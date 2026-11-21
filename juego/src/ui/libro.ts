// El Libro de Odrán (J): el corazón del Códice. Un libro abierto a doble hoja, en pixel a puntos enteros del aparato: la
// tapa de cuero que gira al abrir, las hojas que se curvan al pasar (rueda, flechas, arrastrar, clic en las esquinas,
// deslizar en táctil), la tinta que corre la primera vez que se ve una pieza y se seca, el hueco que se llena, la hoja
// que late cuando a un hilo le falta una sola pieza, la carta que se quema sola, las notas de otra mano en los actos 6 y 7,
// el índice con el avance de cada hilo y la cinta marcapáginas. Todo se arma en lienzos propios (las hojas se pintan una
// vez y se guardan; solo se repinta la que tiene algo vivo) y con el libro cerrado no cuesta nada.
// Los datos: mundo/libro_hilos.ts (piezas), mundo/libro_cierres.ts (lo escrito nuevo), juego/libro.ts (qué tiene el héroe).
import { ctx, E, W, H, ESCALA, lienzo, baseLienzo, pulso } from '../nucleo/lienzo';
import { IDI } from './comun';
import { textoPixel } from './letra_pixel';
import { Sonido } from '../audio/sonido';
import { ui } from './juego_ui';
import { vistaLibro, marcarVista, marcarCierre, marcarMargen, marcarQuema, quemada, cuentaLibro, PORTADA, type VistaHilo, type VistaPieza } from '../juego/libro';
import type { DatosHeroe } from '../juego/heroe';
import {
  lamina, papel, escribir, cortarMano, anchoMano, gotico, anchoGot, capitular, dibujo, gota, huella, hueco, raya, selloCera, folio, tapa, guardas,
  hashS, azar, pon, lee, bayer, tono, cera, PAPEL, TINTA, RUBRICA, SANGRE, SANGRE_FRESCA, CUERO, ORO, DIBUJOS, type Lamina, type Tinta, type C3,
} from './libro_pixel';
import { AUN_NO, LATE } from '../mundo/libro_cierres';

type T2 = [string, string];
const L2 = (t: T2) => t[IDI];

// ------------------------------------------------------------------ geometría
interface Geo { PW: number; PH: number; D: number; solo: boolean; BW: number; BH: number; gx: number; gy: number; bm: number; pad: number; css: number; fila: number }
const BM = 4, PAD = 8, CINTA = 14, LH = 11;
function calcGeo(): Geo {
  const Wc = lienzo.width, Hc = lienzo.height, css = (W * ESCALA) / Math.max(1, Wc);
  const solo = Wc < Hc * 1.05;
  let D = Math.max(E.tactil ? 2 : 1, Math.floor((Hc * 0.88) / 268));
  while (7 * D * css < 9.5 && D < 8) D++;
  const aH = Math.floor((Hc * (E.tactil ? 0.99 : 0.92)) / D), aW = Math.floor((Wc * 0.97) / D);
  let PH = Math.min(262, aH - 2 * BM - 2 * PAD - CINTA - (E.tactil ? 0 : 8)), PW = Math.round(PH * 0.72);
  if (!solo && 2 * (PW + BM) + 2 * PAD > aW) PW = Math.floor((aW - 2 * PAD) / 2) - BM;
  if (solo) { PW = Math.min(Math.max(PW, Math.round(aW * 0.86) - 2 * PAD - BM - 6), aW - 2 * PAD - BM - 6); PH = Math.min(PH, Math.round(PW * 1.5)); }
  PW = Math.max(110, PW); PH = Math.max(150, PH);
  const BW = solo ? PW + BM + 6 + 2 * PAD : 2 * (PW + BM) + 2 * PAD, BH = PH + 2 * BM + 2 * PAD + CINTA;
  const gx = solo ? PAD + 6 : PAD + BM + PW, gy = PAD + BM;
  // en táctil cada fila del índice mide al menos 44 puntos de pantalla (o lo que se pueda)
  const fila = E.tactil ? Math.max(14, Math.min(30, Math.ceil(44 / (D * css)))) : 14;
  return { PW, PH, D, solo, BW, BH, gx, gy, bm: BM, pad: PAD, css, fila };
}

// ------------------------------------------------------------------ la hoja: lo que lleva escrito
type Op =
  | { k: 'texto'; x: number; y: number; s: string; tinta: Tinta; key?: string; i0: number; inclina?: 1 | -1 | 0; tenue?: number }
  | { k: 'gotico'; x: number; y: number; s: string; rojo?: boolean; menuda?: boolean }
  | { k: 'capital'; x: number; y: number; letra: string; campo: string }
  | { k: 'dibujo'; x: number; y: number; id: string; esc: number }
  | { k: 'hueco'; x: number; y: number; w: number; h: number; tipo: 'mancha' | 'arrancada' | 'sangre'; key?: string }
  | { k: 'raya'; x: number; y: number; w: number; tipo: 'simple' | 'doble' | 'flor' }
  | { k: 'gotas'; x: number; y: number; n: number; chato?: boolean }
  | { k: 'huella'; x: number; y: number }
  | { k: 'sello'; x: number; y: number; key?: string; r?: number }
  | { k: 'latido'; x: number; y: number; grande?: boolean }
  | { k: 'nuevo'; x: number; y: number; hilo: string }
  | { k: 'hilo'; x: number; y: number; w: number }
  | { k: 'corrida'; x: number; y: number; w: number };
interface Clic { x: number; y: number; w: number; h: number; ir?: string; pieza?: string; codice?: boolean }
interface Hoja { ops: Op[]; clics: Clic[]; hilo?: string; quema?: string; latido?: boolean; claves: string[] }
interface Escrito { key: string; texto: number; tipo: 'pieza' | 'margen' | 'cierre'; v?: VistaPieza; hilo?: string; hueco?: boolean }

const est = {
  fase: 'cerrado' as 'cerrado' | 'abriendo' | 'abierto' | 'cerrando', t: 0,
  vista: 0, // en doble hoja, la hoja de la izquierda es 2·vista−1 (−1 son las guardas); en una sola, la hoja que se ve
  vuelta: null as null | { dir: 1 | -1; p: number; auto: boolean; vel: number; tras?: number[] },
  arr: null as null | { x0: number; y0: number; dir: 0 | 1 | -1; p0: number; t0: number; movio: boolean },
  geo: null as Geo | null, firma: '', hojas: [] as Hoja[], porHilo: new Map<string, number>(), porPieza: new Map<string, number>(),
  vistas: [] as VistaHilo[], tVista: 0,
  escr: new Map<string, { t0: number; dur: number; n: number; hueco: number }>(), cola: [] as Escrito[],
  cache: new Map<number, { k: string; c: HTMLCanvasElement; pl?: { x: number; y: number; lado: number } | null }>(), libro: null as HTMLCanvasElement | null,
  tapaL: null as HTMLCanvasElement | null, guardasL: null as HTMLCanvasElement | null, tapaK: '',
  quema: null as null | { pid: string; t0: number }, humo: [] as { x: number; y: number; vx: number; vy: number; t: number }[],
  ultimaVista: 0, sinMarcar: false, pluma: null as null | { x: number; y: number; lado: number },
  latidoT: 0, d: null as DatosHeroe | null, reloj: 0, volviendo: false,
};
/** Para las pruebas: el estado del libro. */
(window as any).__libro = est;
export const libroAbierto = () => est.fase !== 'cerrado';

// ------------------------------------------------------------------ armar las hojas
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII'];
function firmaDe(d: DatosHeroe, g: Geo, vs: VistaHilo[]) {
  return [IDI, g.PW, g.PH, g.solo ? 1 : 0, g.fila, vs.map((h) => [h.h.id, h.cierre ? 1 : 0, h.late ? 1 : 0, h.piezas.map((p) => `${p.p.id}${p.estado[0]}${p.margen ? 'm' : ''}${(p.rojos ?? []).length}`).join(',')].join(':')).join('|')].join('/') + (d.acto ?? 0);
}
function armar(d: DatosHeroe, g: Geo) {
  const vs = vistaLibro(d), firma = firmaDe(d, g, vs);
  est.vistas = vs;
  if (firma === est.firma) return;
  est.firma = firma; est.cache.clear();
  const hojas: Hoja[] = [], porHilo = new Map<string, number>(), porPieza = new Map<string, number>();
  const MT = 14, MB = 22, alto = g.PH - MT - MB;
  const x0 = (i: number) => (g.solo ? 14 : i % 2 === 1 ? 12 : 16); // la hoja de la izquierda (impar) deja más lomo a la derecha
  const tw = g.PW - 28;
  let hoja: Hoja = { ops: [], clics: [], claves: [] }, y = MT;
  const nueva = () => { hojas.push(hoja); hoja = { ops: [], clics: [], claves: [] }; y = MT; };
  const cabe = (h: number) => y + h <= MT + alto;
  const X = () => x0(hojas.length);
  // ------ el índice (hoja 0, y las que siga si no entra)
  {
    const F = g.fila;
    hoja.ops.push({ k: 'gotico', x: Math.floor((g.PW - anchoGot(L2(PORTADA.indice))) / 2), y, s: L2(PORTADA.indice), rojo: true }); y += 16;
    hoja.ops.push({ k: 'raya', x: X(), y, w: tw, tipo: 'doble' }); y += 8;
    if (!vs.length) { for (const l of cortarMano(L2(PORTADA.vacio), tw)) { hoja.ops.push({ k: 'texto', x: X(), y, s: l, tinta: 'tinta', i0: 0 }); y += LH; } }
    vs.forEach((vh, i) => {
      if (!cabe(F + 16)) nueva();
      const xx = X(), num = ROMANO[i + 1] ?? String(i + 1);
      // (un hilo sin nombre todavía no da cuenta: va su raya en tinta corrida y un signo de pregunta)
      const sinNombre = vh.tiene === 0 && !vh.cierre, cuenta = sinNombre ? '?' : `${vh.tiene} ${L2(PORTADA.de)} ${vh.total}`;
      const nw = tw - 24 - anchoMano(cuenta) - 16;
      let nom = L2(vh.corto); while (anchoMano(nom) > nw && nom.length > 4) nom = nom.slice(0, -2).trimEnd() + '…';
      const yy = y + Math.floor((F - 9) / 2);
      hoja.ops.push({ k: 'texto', x: xx, y: yy, s: num, tinta: 'rubrica', i0: 0, inclina: 0 });
      hoja.ops.push({ k: 'texto', x: xx + 24, y: yy, s: nom, tinta: sinNombre ? 'lapiz' : 'tinta', i0: 0, tenue: sinNombre ? 0.25 : 0 });
      if (sinNombre) hoja.ops.push({ k: 'corrida', x: xx + 24, y: yy + 3, w: anchoMano(nom) });
      else hoja.ops.push({ k: 'hilo', x: xx + 24 + anchoMano(nom) + 10, y: yy + 6, w: tw - 24 - anchoMano(nom) - anchoMano(cuenta) - 14 });
      hoja.ops.push({ k: 'texto', x: xx + tw - anchoMano(cuenta), y: yy, s: cuenta, tinta: vh.cierre ? 'rubrica' : 'lapiz', i0: 0, inclina: 0 });
      // el sello del hilo cerrado (o el corazón del que late) va en el margen, nunca encima de la cuenta
      if (vh.cierre) hoja.ops.push({ k: 'sello', x: xx + tw + 4, y: yy + 3, r: 3 });
      else if (vh.late) hoja.ops.push({ k: 'latido', x: xx + tw + 4, y: yy + 4 });
      hoja.ops.push({ k: 'nuevo', x: xx + 24 + anchoMano(nom) + 5, y: yy + 4, hilo: vh.h.id });
      hoja.clics.push({ x: xx - 2, y, w: tw + 10, h: F, ir: vh.h.id });
      y += F;
    });
    y += 6;
    if (cabe(30)) {
      if (E.tactil) for (const l of cortarMano(L2(PORTADA.ayudaTactil), tw)) { if (!cabe(LH)) break; hoja.ops.push({ k: 'texto', x: X(), y, s: l, tinta: 'lapiz', i0: 0, tenue: 0.2 }); y += 10; }

    }
    // la nota al pie, en un renglón: lleva al Códice (jefes, decisiones y cine)
    { const nota = L2(E.tactil ? PORTADA.codiceTactil : PORTADA.codice), yp = g.PH - MB - 4, xn = X() + Math.floor((tw - anchoMano(nota)) / 2);
      hoja.ops.push({ k: 'raya', x: X() + 30, y: yp - 6, w: tw - 60, tipo: 'simple' });
      hoja.ops.push({ k: 'texto', x: xn, y: yp, s: nota, tinta: 'rubrica', i0: 0, tenue: 0.1 });
      const hh = Math.max(LH, g.fila); hoja.clics.push({ x: X(), y: yp - Math.floor((hh - 9) / 2), w: tw, h: hh, codice: true }); }
    if (y < g.PH - MB - 50) hoja.ops.push({ k: 'huella', x: g.PW - 30, y: y + 14 });
    nueva();
  }
  // ------ cada hilo
  vs.forEach((vh, hi) => {
    // empieza en una hoja de la izquierda (impar): si toca la derecha, va una hoja con su emblema
    if (!g.solo && hojas.length % 2 === 0) {
      // la portadilla del hilo que viene: su número, su emblema y su nombre, como en los libros de horas
      const num = ROMANO[hi + 1] ?? String(hi + 1), cy = Math.floor(g.PH / 2) - 40;
      hoja.ops.push({ k: 'gotico', x: Math.floor((g.PW - anchoGot(num)) / 2), y: cy - 22, s: num, rojo: true });
      hoja.ops.push({ k: 'dibujo', x: Math.floor(g.PW / 2) - 16, y: cy, id: vh.h.emblema, esc: 2 });
      let yy = cy + 40; const nombre = L2(vh.nombre).split(' '), ls: string[] = []; let c2 = '';
      for (const p of nombre) { const pr = c2 ? `${c2} ${p}` : p; if (anchoGot(pr, 'menuda') > tw - 10 && c2) { ls.push(c2); c2 = p; } else c2 = pr; } if (c2) ls.push(c2);
      for (const l of ls) { hoja.ops.push({ k: 'gotico', x: Math.floor((g.PW - anchoGot(l, 'menuda')) / 2), y: yy, s: l, menuda: true }); yy += 11; }
      hoja.ops.push({ k: 'raya', x: X() + 24, y: yy + 4, w: tw - 48, tipo: 'flor' });
      if (hi % 2 === 0) hoja.ops.push({ k: 'gotas', x: Math.floor(g.PW * 0.68), y: Math.floor(g.PH * 0.78), n: 2 }); else hoja.ops.push({ k: 'huella', x: Math.floor(g.PW * 0.3), y: Math.floor(g.PH * 0.8) });
      nueva();
    }
    const H0 = hojas.length; porHilo.set(vh.h.id, H0); hoja.hilo = vh.h.id;
    // la cabeza: el título gótico, la doble raya, la capitular con la línea de Odrán y el avance
    const tit = L2(vh.nombre), palabras = tit.split(' '), lineasT: string[] = []; let cur = '';
    for (const p of palabras) { const pr = cur ? `${cur} ${p}` : p; if (anchoGot(pr) > tw && cur) { lineasT.push(cur); cur = p; } else cur = pr; } if (cur) lineasT.push(cur);
    for (const l of lineasT) { hoja.ops.push({ k: 'gotico', x: X() + Math.max(0, Math.floor((tw - anchoGot(l)) / 2)), y, s: l, rojo: true }); y += 15; }
    hoja.ops.push({ k: 'raya', x: X(), y, w: tw, tipo: 'doble' }); y += 9;
    const ab = L2(vh.abre), letra = ab[0], resto = ab.slice(1);
    hoja.ops.push({ k: 'capital', x: X(), y, letra, campo: vh.h.campo });
    const ls = cortarMano(resto, tw, tw - 34, 3), yc = y;
    ls.forEach((l, i) => { const lado = i < 3 ? 34 : 0; hoja.ops.push({ k: 'texto', x: X() + lado, y: y + 2, s: l, tinta: 'tinta', i0: 0 }); y += LH; });
    y = Math.max(y, yc + 34) + 3;
    const falt = vh.total - vh.tiene;
    const av = `${vh.tiene} ${L2(PORTADA.de)} ${vh.total}${falt ? ` · ${L2(PORTADA.faltan)} ${falt}` : ''}`;
    hoja.ops.push({ k: 'texto', x: X() + tw - anchoMano(av), y, s: av, tinta: 'lapiz', i0: 0, inclina: 0 }); y += LH + 2;
    let nPieza = 0;
    const separar = () => { if (cabe(10)) { hoja.ops.push({ k: 'raya', x: X() + 10, y: y + 2, w: tw - 20, tipo: nPieza % 3 === 2 ? 'flor' : 'simple' }); y += 9; } };
    for (const v of vh.piezas) {
      if (v.estado === 'futuro' || v.estado === 'oculta') continue;
      if (v.estado === 'hueco') {
        const pl = cortarMano(L2(v.pista!), tw - 8), hh = 26 + pl.length * 10;
        if (!cabe(hh)) nueva();
        const tipo = v.p.hueco ?? (['mancha', 'arrancada', 'sangre'] as const)[hashS(v.p.id) % 3];
        hoja.ops.push({ k: 'hueco', x: X(), y, w: tw, h: 24, tipo });
        y += 26;
        for (const l of pl) { hoja.ops.push({ k: 'texto', x: X() + 4 + Math.floor((tw - 8 - anchoMano(l)) / 2), y, s: l, tinta: 'lapiz', i0: 0, tenue: 0.35 }); y += 10; }
        separar(); nPieza++; continue;
      }
      // la pieza que se quema va sola en su hoja
      if (v.p.quema && y > MT + 2) nueva();
      const ru = cortarMano(L2(v.ru!), tw), tx = cortarMano(L2(v.tx!), tw);
      const nota = v.margen ? cortarMano(L2(v.margen), tw - 14) : [];
      const rojos = v.rojos ?? [];
      const minimo = ru.length * LH + Math.min(2, tx.length) * LH;
      if (!cabe(minimo)) nueva();
      porPieza.set(v.p.id, hojas.length);
      if (v.p.quema) hoja.quema = v.p.id;
      let i0 = 0;
      for (const l of ru) { hoja.ops.push({ k: 'texto', x: X(), y, s: l, tinta: 'rubrica', i0, key: v.p.id }); i0 += l.length + 1; y += LH; }
      for (const l of tx) {
        if (!cabe(LH)) { nueva(); }
        hoja.ops.push({ k: 'texto', x: X(), y, s: l, tinta: 'tinta', i0, key: v.p.id }); i0 += l.length + 1; y += LH;
        if (!hoja.claves.includes(v.p.id)) hoja.claves.push(v.p.id);
      }
      if (!hoja.claves.includes(v.p.id)) hoja.claves.push(v.p.id);
      // la sangre va en papel vacío: se le deja un hueco debajo de la pieza (nunca encima de lo que hay que leer)
      if (v.p.gore && cabe(20)) {
        if (v.p.gore === 'gotas') hoja.ops.push({ k: 'gotas', x: X() + tw - 24 - (hashS(v.p.id) % 40), y: y + 8, n: 2 + (hashS(v.p.id) % 2), chato: true });
        else hoja.ops.push({ k: 'huella', x: X() + tw - 14 - (hashS(v.p.id) % 30), y: y + 9 });
        y += 18;
      }
      if (nota.length) {
        if (!cabe(nota.length * 10 + 4)) nueva();
        y += 2; let j0 = 0;
        for (const l of nota) { hoja.ops.push({ k: 'texto', x: X() + 14, y, s: l, tinta: 'violeta', i0: j0, key: 'm:' + v.p.id, inclina: -1 }); j0 += l.length + 1; y += 10; }
        if (!hoja.claves.includes('m:' + v.p.id)) hoja.claves.push('m:' + v.p.id);
      }
      for (const r of rojos) {
        const dest = vs.find((h) => h.piezas.some((p) => p.p.id === r.hacia));
        if (!dest) continue;
        const s = `${L2(PORTADA.hiloRojo)}: ${L2(r.nota)}`, rl = cortarMano(s, tw - 12);
        if (!cabe(rl.length * 10 + 2)) nueva();
        hoja.ops.push({ k: 'dibujo', x: X() + 1, y: y + 1, id: 'hilo_rojo', esc: 1 });
        const yy0 = y;
        for (const l of rl) { hoja.ops.push({ k: 'texto', x: X() + 11, y, s: l, tinta: 'rubrica', i0: 0, tenue: 0.15 }); y += 10; }
        { const hh = Math.max(y - yy0 + 2, g.fila); hoja.clics.push({ x: X(), y: yy0 - 2 - Math.floor((hh - (y - yy0 + 2)) / 2), w: tw, h: hh, pieza: r.hacia }); }
      }
      if (v.p.quema) nueva(); else separar();
      nPieza++;
    }
    // lo que todavía no pasó
    if (vh.futuro) {
      const ls2 = cortarMano(L2(AUN_NO), tw - 10);
      if (!cabe(ls2.length * LH + 30)) nueva();
      for (const l of ls2) { hoja.ops.push({ k: 'texto', x: X() + 5, y, s: l, tinta: 'lapiz', i0: 0, tenue: 0.15 }); y += LH; }
      y += 4;
      for (let k = 0; k < 2 && cabe(LH); k++) { hoja.ops.push({ k: 'raya', x: X() + 6, y: y + 4, w: tw - 12, tipo: 'simple' }); y += LH; }
    }
    // el cierre de Odrán, o la hoja que late
    if (vh.cierre) {
      const cl = cortarMano(L2(vh.cierre), tw);
      if (!cabe(Math.min(cl.length, 4) * LH + 14)) nueva();
      if (!cabe(Math.min(cl.length, 4) * LH + 34)) nueva();
      // (en la hoja angosta del teléfono el encabezado va en dos renglones)
      const ent = L2(PORTADA.entiendo), pe = ent.split(' '), ents = anchoGot(ent, 'menuda') <= tw ? [ent] : [pe.slice(0, Math.ceil(pe.length / 2)).join(' '), pe.slice(Math.ceil(pe.length / 2)).join(' ')];
      for (const e2 of ents) { hoja.ops.push({ k: 'gotico', x: X() + Math.max(0, Math.floor((tw - anchoGot(e2, 'menuda')) / 2)), y: y + 2, s: e2, rojo: true, menuda: true }); y += 12; }
      hoja.ops.push({ k: 'raya', x: X(), y: y + 2, w: tw, tipo: 'doble' }); y += 10;
      let i0 = 0;
      for (const l of cl) { if (!cabe(LH)) nueva(); hoja.ops.push({ k: 'texto', x: X(), y, s: l, tinta: 'tinta', i0, key: 'c:' + vh.h.id }); i0 += l.length + 1; y += LH; if (!hoja.claves.includes('c:' + vh.h.id)) hoja.claves.push('c:' + vh.h.id); }
      const fi = L2(PORTADA.firma);
      if (!cabe(26)) nueva();
      hoja.ops.push({ k: 'texto', x: X() + tw - anchoMano(fi) - 24, y: y + 4, s: fi, tinta: 'rubrica', i0, key: 'c:' + vh.h.id });
      hoja.ops.push({ k: 'sello', x: X() + tw - 10, y: y + 9, key: 'c:' + vh.h.id }); y += 26;
    } else if (vh.late) {
      if (!cabe(30)) nueva();
      hoja.latido = true;
      for (const l of cortarMano(L2(LATE), tw)) { hoja.ops.push({ k: 'texto', x: X() + Math.floor((tw - anchoMano(l)) / 2), y: y + 2, s: l, tinta: 'rubrica', i0: 0 }); y += LH; } y -= LH;
      hoja.ops.push({ k: 'latido', x: X() + Math.floor(tw / 2), y: y + 24, grande: true }); y += 40;
    }
    // un dibujo del margen donde sobra hoja
    if (cabe(22) && y > MT + 40) hoja.ops.push({ k: 'dibujo', x: X() + tw - 18 - ((hi * 37) % Math.max(1, tw - 40)), y: Math.min(MT + alto - 18, y + 4), id: vh.h.margen[hi % vh.h.margen.length], esc: 1 });
    nueva();
    // las hojas del hilo heredan su hilo (para la que late)
    for (let i = H0; i < hojas.length; i++) { hojas[i].hilo = vh.h.id; if (vh.late) hojas[i].latido = hojas[i].latido || i === hojas.length - 1; }
  });
  // la última: la cera de la vela y una mano
  hoja.ops.push({ k: 'gotas', x: Math.floor(g.PW * 0.4), y: Math.floor(g.PH * 0.6), n: 3 }); hoja.ops.push({ k: 'huella', x: 30, y: g.PH - 40 }); nueva();
  if (!g.solo && hojas.length % 2 === 1) nueva();
  est.hojas = hojas; est.porHilo = porHilo; est.porPieza = porPieza;
}
/** El hilo rojo: un trocito de hilo que cruza el margen. */
DIBUJOS.hilo_rojo = ['..r.....', '.r.r....', 'r...r..r', '.....rr.', '........'];

// ------------------------------------------------------------------ pintar una hoja
const BLANCA = -99;
function semillaHoja(i: number) { return hashS(`hoja${i}`) ^ 0x5bd1e995; }
/** ¿Esta hoja tiene algo vivo ahora (escribiéndose, latiendo, quemándose)? */
function viva(i: number): boolean {
  const h = est.hojas[i]; if (!h) return false;
  if (h.latido) return true;
  if (h.quema && est.quema?.pid === h.quema) return true;
  for (const k of h.claves) { const e = est.escr.get(k); if (e && est.reloj < e.t0 + e.hueco + e.dur + 1.8) return true; }
  return false;
}
/** Lo que cambia una hoja quieta: qué es nuevo todavía, si ya se quemó y los avisos del índice. */
function firmaHoja(i: number): string {
  const h = est.hojas[i]; if (!h) return '0';
  let s = h.claves.map((k) => (nuevaClave(k) ? 1 : 0)).join('');
  if (h.quema && est.d) s += quemada(est.d, h.quema) ? 'q' : '';
  if (h.ops.some((o) => o.k === 'nuevo')) s += est.vistas.map((v) => (v.nuevas > 0 ? 1 : 0)).join('');
  return s;
}
function nuevaClave(k: string): boolean {
  const v = piezaDeClave(k); if (!v) return false;
  if (k.startsWith('c:')) return !!(v as VistaHilo).cierreNuevo;
  if (k.startsWith('m:')) return !!(v as VistaPieza).margenNueva;
  return !!(v as VistaPieza).nueva;
}
function piezaDeClave(k: string): VistaPieza | VistaHilo | null {
  if (k.startsWith('c:')) return est.vistas.find((h) => h.h.id === k.slice(2)) ?? null;
  const id = k.startsWith('m:') ? k.slice(2) : k;
  for (const vh of est.vistas) for (const v of vh.piezas) if (v.p.id === id) return v;
  return null;
}
function pintarHoja(i: number, g: Geo): Lamina {
  const lado: 'izq' | 'der' | 'solo' = g.solo ? 'solo' : i % 2 === 1 ? 'izq' : 'der';
  const sem = semillaHoja(i);
  const L = papel(g.PW, g.PH, { lado, semilla: sem, agua: sem % 5 === 0, gastada: i > est.hojas.length - 3 ? 0.6 : 0 });
  const h = est.hojas[i];
  if (sem % 5 === 1) cera(L, 20 + (sem % (g.PW - 40)), 20 + ((sem >> 8) % (g.PH - 40)), sem);
  if (!h) return L;
  const ahora = est.reloj;
  for (const o of h.ops) {
    switch (o.k) {
      case 'texto': {
        const e = o.key ? est.escr.get(o.key) : undefined, nueva = o.key ? nuevaClave(o.key) : false;
        if (o.key && nueva && !e) { if (o.tinta !== 'violeta' && o.i0 === 0 && o.key && !o.key.startsWith('c:')) hueco(L, 'mancha', o.x, o.y - 2, Math.min(g.PW - o.x - 10, 90), 14, hashS(o.key)); continue; }
        if (e) {
          const t = ahora - e.t0 - e.hueco; if (t < 0) { if (e.hueco && o.i0 === 0) hueco(L, 'mancha', o.x, o.y - 2, Math.min(g.PW - o.x - 10, 90), 14, hashS(o.key!), Math.max(0, -t / e.hueco)); continue; }
          const ven = (t * e.n) / Math.max(0.01, e.dur);
          if (ven <= o.i0) continue;
          const pos = escribir(L, o.s, o.x, o.y, { tinta: o.tinta, i0: o.i0, ven, edad: (k) => t - (k * e.dur) / e.n, semilla: hashS(o.key!) + o.y, inclina: o.inclina });
          if (ven < o.i0 + o.s.length + 1 && ven > o.i0) est.pluma = { x: pos.x, y: pos.y, lado: i };
        } else escribir(L, o.s, o.x, o.y, { tinta: o.tinta, i0: o.i0, semilla: hashS(o.s) + o.y, inclina: o.inclina, tenue: o.tenue });
        break;
      }
      case 'gotico': gotico(L, o.s, o.x, o.y + 1, o.rojo ? RUBRICA : TINTA, o.menuda ? 'menuda' : 'grande'); break;
      case 'capital': capitular(L, o.letra, o.x, o.y, o.campo, hashS(o.letra + o.campo)); break;
      case 'dibujo': dibujo(L, o.id, o.x, o.y, o.esc, sem); break;
      case 'hueco': hueco(L, o.tipo, o.x, o.y, o.w, o.h, hashS(`${i}:${o.y}`)); break;
      case 'raya': raya(L, o.x, o.y, o.w, o.tipo, sem + o.y); break;
      case 'gotas': { const r = azar(sem + o.x); for (let k = 0; k < o.n; k++) gota(L, o.x + Math.floor((r() - 0.5) * 34), o.y + Math.floor((r() - 0.5) * (o.chato ? 4 : 26)), o.chato ? 2 + Math.floor(r() * 2) : k === 0 ? 3 + Math.floor(r() * 2) : 2 + Math.floor(r() * 2), sem + k, false, o.chato); break; }
      case 'huella': huella(L, o.x, o.y, sem, 0.2 + (sem % 10) / 10); break;
      case 'sello': { const e = o.key ? est.escr.get(o.key) : undefined; if (o.key && nuevaClave(o.key) && (!e || ahora < e.t0 + e.dur + e.hueco)) break; selloCera(L, o.x, o.y, o.r ?? 8, sem); break; }
      case 'latido': {
        // la hoja late: un corazón de sangre que se hincha (lub-dub) y sangra, y venas que se encienden desde el canto
        const ph = (ahora % 1.15) / 1.15, k = Math.max(Math.exp(-Math.pow((ph - 0.05) / 0.06, 2)), 0.75 * Math.exp(-Math.pow((ph - 0.26) / 0.06, 2)));
        const R = k > 0.45 ? SANGRE_FRESCA : SANGRE, r0 = (o.grande ? 9 : 3) + (k > 0.5 ? (o.grande ? 2 : 1) : 0);
        for (let yy = -r0 - 2; yy <= r0 + 2; yy++) for (let xx = -r0 - 2; xx <= r0 + 2; xx++) {
          const u = Math.abs(xx) / (r0 + 0.5), v = (yy + r0 * 0.15) / (r0 + 0.5);
          const den = Math.pow(u * u + v * v - 0.6, 3) - u * u * v * v * v; if (den > 0) continue;
          const nv = Math.hypot(u, v), brillo = xx < 0 && yy > r0 * 0.25 && nv < 0.55;
          pon(L, o.x + xx, o.y - yy, brillo && k > 0.3 ? SANGRE_FRESCA[3] : nv > 0.92 ? R[0] : R[Math.min(R.length - 1, 1 + Math.floor((1 - nv) * 2.6 + (bayer(xx, yy) - 0.5)))]);
        }
        if (o.grande) {
          // lo que chorrea del corazón, más largo con cada latido
          const r = azar(sem + 31);
          for (let c = 0; c < 3; c++) { const cx = o.x + Math.round((r() - 0.5) * r0 * 1.2), largo = 4 + Math.floor(r() * 10) + Math.round(k * 3); for (let s2 = 0; s2 < largo; s2++) pon(L, cx, o.y + r0 - 2 + s2, s2 > largo - 2 ? R[2] : R[1]); pon(L, cx, o.y + r0 - 2 + largo, R[0]); }
        }
        if (h.latido && o.grande) {
          // las venas: por el margen de afuera, de arriba abajo, que se encienden con el latido (nunca sobre el texto)
          const r = azar(sem + 77), x0v = lado === 'izq' ? 2 : g.PW - 3, ancho = 7, dentro = lado === 'izq' ? 1 : -1;
          for (let vn = 0; vn < 4; vn++) {
            let vx = x0v + dentro * Math.floor(r() * 3), vy = 16 + r() * (g.PH - 70); const largo = 22 + r() * 34;
            for (let s2 = 0; s2 < largo; s2++) {
              const c = lee(L, vx | 0, vy | 0), f = 1 - s2 / largo;
              const col: C3 = k > 0.35 ? SANGRE_FRESCA[f > 0.5 ? 2 : 1] : [c[0] * 0.62 + 50 * f, c[1] * 0.42, c[2] * 0.4];
              pon(L, vx, vy, col); if (vn < 2 && s2 < largo * 0.6) pon(L, vx + dentro, vy, col);
              if (r() < 0.08) { let bx = vx, by = vy; for (let b2 = 0; b2 < 2 + r() * 3; b2++) { bx += dentro; by += 1; if (Math.abs(bx - x0v) < ancho) pon(L, bx, by, col); } }
              vy += 1; vx += r() < 0.15 ? (r() < 0.5 ? -1 : 1) : 0; if (Math.abs(vx - x0v) >= ancho) vx = x0v + dentro * (ancho - 1); if (dentro * (vx - x0v) < 0) vx = x0v;
            }
          }
        }
        break;
      }
      case 'nuevo': {
        // tinta fresca: una gota redonda y brillante junto al hilo que tiene algo sin leer
        const vh = est.vistas.find((x) => x.h.id === o.hilo); if (!vh || vh.nuevas <= 0) break;
        for (let yy = -2; yy <= 2; yy++) for (let xx = -2; xx <= 2; xx++) if (xx * xx + yy * yy <= 5) pon(L, o.x + xx, o.y + yy, xx * xx + yy * yy > 3 ? TINTA[1] : TINTA[0]);
        pon(L, o.x - 1, o.y - 1, [120, 96, 70]); pon(L, o.x, o.y + 3, TINTA[2]); break;
      }
      case 'hilo': for (let xx = 0; xx < o.w; xx += 3) pon(L, o.x + xx, o.y, TINTA[4]); break;
      case 'corrida': {
        // tinta corrida: la raya mojada que se llevó el nombre, con sus hilos que bajan
        const r = azar(sem + o.x + o.y);
        for (let xx = -2; xx < o.w + 3; xx++) { const yy = o.y + Math.round(Math.sin(xx * 0.3) * 0.6); pon(L, o.x + xx, yy, TINTA[2]); if (r() < 0.5) pon(L, o.x + xx, yy + 1, TINTA[3]); if (r() < 0.07) for (let k = 2; k < 3 + r() * 4; k++) pon(L, o.x + xx, yy + k, TINTA[3]); }
        break;
      }
    }
  }
  // la carta que se quema: desde la esquina de abajo de afuera
  if (h.quema) {
    const done = quemada(est.d!, h.quema), q = est.quema?.pid === h.quema ? Math.min(1, (ahora - est.quema.t0) / 3.4) : done ? 1 : 0;
    if (q > 0) quemar(L, g, lado, q, sem);
  }
  folio(L, i + 1, lado === 'izq' ? 10 : g.PW - 10 - String(i + 1).length * 4, g.PH - 14);
  return L;
}
/** Quema la esquina: el papel que se fue (se ve lo de abajo), el canto negro, la brasa que corre mientras arde y lo chamuscado. */
function quemar(L: Lamina, g: Geo, lado: string, q: number, sem: number) {
  const cx = lado === 'izq' ? 0 : g.PW - 1, cy = g.PH - 1, R0 = g.PW * 0.42 * Math.min(1, q * 1.15), vivo = q < 1;
  for (let y = Math.floor(g.PH - R0 - 8); y < g.PH; y++) for (let x = 0; x < g.PW; x++) {
    const d = Math.hypot(x - cx, (y - cy) * 1.25) + (Math.sin(x * 0.5 + sem) + Math.sin(y * 0.37) ) * 2.2 + (h3(x, y) - 0.5) * 3;
    // lo quemado se fue: se ve la hoja de abajo, en la sombra del borde roto
    if (d < R0 - 2) { pon(L, x, y, tono(PAPEL, d > R0 - 5 ? 0.62 : 0.3 + (h3(x, y) - 0.5) * 0.1, x, y)); continue; }
    if (d < R0) { pon(L, x, y, vivo && h3(x, y + Math.floor(est.reloj * 20)) < 0.6 ? (d < R0 - 1 ? [255, 210, 90] : [230, 90, 20]) : [18, 10, 6]); continue; }
    if (d < R0 + 2) { pon(L, x, y, vivo ? [150, 40, 12] : [30, 18, 10]); continue; }
    if (d < R0 + 9) { const c = lee(L, x, y), k = 1 - (d - R0 - 2) / 7; pon(L, x, y, [c[0] * (1 - k * 0.55), c[1] * (1 - k * 0.62), c[2] * (1 - k * 0.7)]); }
  }
}
const h3 = (x: number, y: number) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function canvasDe(L: Lamina): HTMLCanvasElement { const c = document.createElement('canvas'); c.width = L.w; c.height = L.h; pegarLamina(c, L); return c; }
function pegarLamina(c: HTMLCanvasElement, L: Lamina) { const g = c.getContext('2d')!; const im = new ImageData(L.px as Uint8ClampedArray<ArrayBuffer>, L.w, L.h); g.clearRect(0, 0, c.width, c.height); g.putImageData(im, 0, 0); }
/** La hoja i ya pintada (se guarda; la viva se repinta en cada cuadro). */
function hojaCanvas(i: number, g: Geo): HTMLCanvasElement {
  if (i === -1) return guardasCanvas(g);
  if (i < -1 || i >= est.hojas.length) i = BLANCA;
  const vivaAhora = i !== BLANCA && viva(i), k = `${est.firma}|${vivaAhora ? 'v' + est.reloj : firmaHoja(i)}`;
  const c = est.cache.get(i);
  if (c && c.k === k) { if (c.pl) est.pluma = c.pl; return c.c; }
  const antes = est.pluma; est.pluma = null;
  const L = pintarHoja(i, g), pl = est.pluma as { x: number; y: number; lado: number } | null; if (!pl) est.pluma = antes;
  if (c && c.c.width === L.w && c.c.height === L.h) { pegarLamina(c.c, L); c.k = k; c.pl = pl; return c.c; }
  const nc = canvasDe(L); est.cache.set(i, { k, c: nc, pl });
  if (est.cache.size > 24) { for (const kk of est.cache.keys()) { if (Math.abs(kk - est.vista * 2) > 6) { est.cache.delete(kk); break; } } }
  return nc;
}

// ------------------------------------------------------------------ la tapa y las guardas (con el ex libris)
function asegurarTapa(g: Geo) {
  const k = `${g.PW}x${g.PH}|${IDI}`; if (est.tapaK === k && est.tapaL && est.guardasL) return;
  est.tapaK = k;
  est.tapaL = canvasDe(tapa(g.PW + g.bm, g.PH + 2 * g.bm, 1873, L2(PORTADA.titulo)));
  // las guardas jaspeadas con el ex libris pegado: el título, la línea, el sello, lo que escribió Odrán y su firma
  const Lg = guardas(g.PW, g.PH, 911), ew = Math.round(g.PW * 0.78), eh = Math.round(g.PH * 0.8), ex = Math.floor((g.PW - ew) / 2), ey = Math.floor((g.PH - eh) / 2);
  const P = papel(ew, eh, { lado: 'solo', semilla: 4242, manchas: 4, gastada: 0.4 });
  for (let y = 0; y < eh; y++) for (let x = 0; x < ew; x++) { const i = (y * ew + x) * 4; pon(Lg, ex + x, ey + y, [P.px[i], P.px[i + 1], P.px[i + 2]]); }
  // la sombra del ex libris pegado y su marco
  for (let x = 0; x < ew; x++) { pon(Lg, ex + x + 1, ey + eh, [10, 2, 2]); }
  for (let y = 0; y < eh; y++) pon(Lg, ex + ew, ey + y + 1, [10, 2, 2]);
  const m = 4; for (let x = ex + m; x < ex + ew - m; x++) { pon(Lg, x, ey + m, RUBRICA[2]); pon(Lg, x, ey + eh - 1 - m, RUBRICA[2]); pon(Lg, x, ey + m + 2, TINTA[3]); pon(Lg, x, ey + eh - 3 - m, TINTA[3]); }
  for (let y = ey + m; y < ey + eh - m; y++) { pon(Lg, ex + m, y, RUBRICA[2]); pon(Lg, ex + ew - 1 - m, y, RUBRICA[2]); pon(Lg, ex + m + 2, y, TINTA[3]); pon(Lg, ex + ew - 3 - m, y, TINTA[3]); }
  let y = ey + 14; const tw = ew - 20;
  // el título con aire dentro del marco: si no entra holgado en un renglón, va en dos ("Libro de" / "Odrán")
  { const tit = L2(PORTADA.titulo), libre = ew - 2 * (m + 8);
    const ls = anchoGot(tit) <= libre ? [tit] : (() => { const p = tit.split(' '); const a2 = p.slice(0, -1).join(' '), b2 = p[p.length - 1]; return [a2, b2]; })();
    for (const l of ls) { const talla = anchoGot(l) <= libre ? 'grande' : 'menuda'; gotico(Lg, l, ex + Math.floor((ew - anchoGot(l, talla)) / 2), y, RUBRICA, talla); y += talla === 'grande' ? 15 : 11; } y += 1; }
  for (const l of cortarMano(L2(PORTADA.sub), tw)) { escribir(Lg, l, ex + Math.floor((ew - anchoMano(l)) / 2), y, { semilla: 3 }); y += LH; }
  y += 2; dibujo(Lg, 'sello', ex + Math.floor(ew / 2) - 8, y, 1, 7); y += 20;
  raya(Lg, ex + 10, y, ew - 20, 'flor', 9); y += 8;
  // lo que escribió Odrán: frases enteras, las que entran (nunca cortado a la mitad)
  { const frases = L2(PORTADA.epigrafe).match(/[^.]+\./g) ?? [L2(PORTADA.epigrafe)]; let n = frases.length, ls: string[] = [];
    for (; n > 0; n--) { ls = cortarMano(frases.slice(0, n).join(' ').trim(), tw); if (y + ls.length * LH <= ey + eh - 26) break; }
    for (const l of ls) { escribir(Lg, l, ex + 10, y, { semilla: 11 }); y += LH; } }
  const fi = L2(PORTADA.firma); escribir(Lg, fi, ex + ew - 10 - anchoMano(fi), ey + eh - 20, { tinta: 'rubrica', semilla: 5 });
  huella(Lg, ex + 16, ey + eh - 16, 77, 1.1); gota(Lg, ex + ew + Math.max(3, Math.floor((g.PW - ew) / 4)), ey + Math.floor(eh * 0.35), 2, 31, false, true);
  est.guardasL = canvasDe(Lg);
}
function guardasCanvas(g: Geo) { asegurarTapa(g); return est.guardasL!; }

// ------------------------------------------------------------------ la hoja que gira (y la tapa)
/**
 * Pinta una hoja que gira alrededor del lomo, columna a columna: la hoja se curva (lo de afuera va detrás del giro), se ve
 * de frente o del revés según hacia dónde mira cada columna, se agranda un poco lo que se levanta y la sombra cae sobre la
 * hoja de abajo. `der` es la cara que se ve cuando la hoja está a la derecha, `izq` la de la izquierda.
 */
function hojaQueGira(G: CanvasRenderingContext2D, der: HTMLCanvasElement, izq: HTMLCanvasElement, q: number, adelante: boolean, gx: number, gy: number, fw: number, fh: number, sombra = true) {
  // la hoja se toma del canto de afuera: lo de afuera gira primero y lo del lomo lo sigue (se curva), y al final se alcanzan
  const qa = Math.max(0, Math.min(1, q)), qin = Math.pow(qa, 1.9), qout = Math.min(1, Math.pow(qa, 0.45) * 1.02);
  const cols: { x: number; w: number; u: number; cara: 'd' | 'i'; luz: number; lev: number }[] = [];
  let x = gx, minx = gx, maxx = gx;
  for (let u = 0; u < fw; u++) {
    const f = (u + 0.5) / fw, a = Math.PI * (qin + (qout - qin) * Math.pow(f, 1.5)), ph = adelante ? a : Math.PI - a;
    const c = Math.cos(ph), nx = x + c;
    cols.push({ x: Math.min(x, nx), w: Math.abs(nx - x), u, cara: c >= 0 ? 'd' : 'i', luz: Math.abs(c), lev: Math.sin(ph) * f });
    x = nx; minx = Math.min(minx, x); maxx = Math.max(maxx, x);
  }
  const th = Math.PI * (adelante ? (qin + qout) / 2 : 1 - (qin + qout) / 2), st = Math.sin(th);
  // la sombra que la hoja echa sobre la de abajo: ancha mientras está levantada, a bandas (pixel, no degradé liso),
  // más negra pegada al canto libre, y un hueco de sombra junto al lomo donde la hoja se despega
  if (sombra) {
    const lejos = th < Math.PI / 2 ? maxx : minx, dir = th < Math.PI / 2 ? 1 : -1, ancho = Math.round(8 + 40 * st);
    for (let s = 0; s < ancho; s++) {
      const X = Math.round(lejos + dir * s);
      if ((dir > 0 && X >= gx + fw) || (dir < 0 && X < gx - fw)) continue;
      const a = (0.5 * st + 0.08) * Math.pow(1 - s / ancho, 1.4);
      G.fillStyle = `rgba(12,5,2,${(Math.round(a * 7) / 7).toFixed(3)})`; G.fillRect(X, gy + 1, 1, fh - 1);
    }
    for (let s = 0; s < 7; s++) { const a = 0.32 * st * (1 - s / 7); G.fillStyle = `rgba(12,5,2,${(Math.round(a * 6) / 6).toFixed(3)})`; G.fillRect(gx + s, gy, 1, fh); G.fillRect(gx - 1 - s, gy, 1, fh); }
  }
  // la luz viene de arriba a la izquierda: cada columna se aclara u oscurece según hacia dónde mira (Lambert),
  // el lomo de la hoja queda en sombra, la cresta de la curva prende un filo de luz y el canto libre tiene su grosor
  const LX = -0.45, LZ = 0.89, plano = LZ;
  const orden = cols.slice().sort((a, b) => a.lev - b.lev);
  let cresta = -1, mejor = 2;
  for (const c of cols) if (c.lev > 0.25 && c.luz < mejor) { mejor = c.luz; cresta = c.u; }
  for (const c of orden) {
    const src = c.cara === 'd' ? der : izq, sx = c.cara === 'd' ? c.u : fw - 1 - c.u;
    const hh = Math.round(fh * (1 + 0.08 * c.lev)), yy = gy - Math.round((hh - fh) / 2) - Math.round(c.lev * 5);
    const X0 = Math.floor(c.x), X1 = Math.max(X0 + 1, Math.ceil(c.x + c.w)), w = X1 - X0;
    G.drawImage(src, Math.min(src.width - 1, Math.max(0, sx)), 0, 1, src.height, X0, yy, w, hh);
    // la normal de la cara que se ve, en el plano x-z
    const f = (c.u + 0.5) / fw, a2 = Math.PI * (qin + (qout - qin) * Math.pow(f, 1.5)), ph = adelante ? a2 : Math.PI - a2;
    const nx = c.cara === 'd' ? -Math.sin(ph) : Math.sin(ph), nz = c.cara === 'd' ? Math.cos(ph) : -Math.cos(ph);
    let dif = Math.max(0, nx * LX + nz * LZ) / plano;
    dif -= Math.max(0, 1 - c.u / 7) * 0.25;                       // el lomo de la hoja
    if (c.cara === 'i') dif -= 0.04;                              // el revés, apenas más apagado
    if (dif < 0.97) { const a = Math.min(0.72, (1 - dif) * 0.8); G.fillStyle = `rgba(22,10,4,${(Math.round(a * 10) / 10).toFixed(2)})`; G.fillRect(X0, yy, w, hh); }
    else if (dif > 1.03) { G.globalCompositeOperation = 'lighter'; G.fillStyle = `rgba(255,214,150,${(Math.min(0.18, (dif - 1) * 0.6)).toFixed(2)})`; G.fillRect(X0, yy, w, hh); G.globalCompositeOperation = 'source-over'; }
    // el filo de luz de la cresta y, a su lado, la sombra del pliegue
    if (c.u === cresta) { G.fillStyle = 'rgba(255,236,196,0.55)'; G.fillRect(X0, yy + 2, 1, hh - 4); G.fillStyle = 'rgba(30,14,6,0.35)'; G.fillRect(X0 + (c.cara === 'd' ? 1 : -1), yy + 2, 1, hh - 4); }
    // el canto libre: el grosor del papel (claro) y su borde oscuro, y el canto de arriba y abajo
    if (c.u >= fw - 1) { G.fillStyle = 'rgba(40,24,12,0.9)'; G.fillRect(X0, yy, 1, hh); G.fillStyle = 'rgba(250,236,206,0.7)'; G.fillRect(X0 + (c.cara === 'd' ? -1 : 1), yy + 1, 1, hh - 2); }
    G.fillStyle = 'rgba(60,36,18,0.55)'; G.fillRect(X0, yy, w, 1); G.fillRect(X0, yy + hh - 1, w, 1);
  }
}

// ------------------------------------------------------------------ componer el libro
function lienzoLibro(g: Geo) {
  let c = est.libro; if (!c || c.width !== g.BW || c.height !== g.BH) { c = document.createElement('canvas'); c.width = g.BW; c.height = g.BH; est.libro = c; }
  return c;
}
const hojaIzq = (v: number) => 2 * v - 1, hojaDer = (v: number) => 2 * v;
function maxVista(g: Geo) { return g.solo ? est.hojas.length - 1 : Math.ceil(est.hojas.length / 2); }
function componer(g: Geo) {
  const c = lienzoLibro(g), G = c.getContext('2d')!;
  G.imageSmoothingEnabled = false; G.clearRect(0, 0, c.width, c.height);
  asegurarTapa(g);
  const { PW, PH, gx, gy, bm } = g;
  est.pluma = null;
  // la sombra del libro sobre la mesa
  const sombra = (x: number, y: number, w: number, h: number) => { for (let k = 0; k < 6; k++) { G.fillStyle = `rgba(0,0,0,${0.09 + k * 0.02})`; G.fillRect(x + 6 - k, y + 7 - k, w + k, h + k); } };
  const abriendo = est.fase === 'abriendo' ? est.t : 9, cerrando = est.fase === 'cerrando' ? est.t : -1;
  // ---- el libro cerrado (o abriéndose / cerrándose en la primera hoja)
  let th = -1; // ángulo de la tapa: 0 cerrada, π abierta
  if (abriendo < 1.15) th = abriendo < 0.42 ? 0 : Math.min(Math.PI, ((abriendo - 0.42) / 0.68) * Math.PI);
  if (cerrando >= 0 && est.vista === 0) th = Math.max(0, Math.PI * (1 - cerrando / 0.5));
  const tapaW = PW + bm, tapaH = PH + 2 * bm;
  if (th >= 0 && th < 0.001) {
    // cerrado: la tapa, el lomo y el canto de las hojas
    const corr = abriendo < 0.42 ? Math.round((1 - Math.min(1, abriendo / 0.3)) * -(g.solo ? 0 : PW / 2)) : 0;
    const x = gx + corr;
    sombra(x - 6, gy - bm, tapaW + 6, tapaH);
    for (let k = 0; k < 4; k++) { G.fillStyle = k % 2 ? '#d8c494' : '#b8a070'; G.fillRect(x + tapaW - 1 + k - 3, gy + 2, 1, PH - 4); }
    G.drawImage(est.tapaL!, x, gy - bm);
    lomo(G, x - 6, gy - bm, 6, tapaH);
    return c;
  }
  const abierto = th < 0 || th >= Math.PI - 0.001;
  // ---- abierto: las dos tapas, el canto de las hojas, las hojas y lo que gira
  const v = est.vista, n = maxVista(g);
  sombra(g.solo ? gx - 6 : gx - PW - bm, gy - bm, g.solo ? PW + bm + 6 : 2 * (PW + bm), PH + 2 * bm);
  if (!g.solo && abierto) tapaReves(G, gx - PW - bm, gy - bm, PW + bm, PH + 2 * bm);
  tapaReves(G, gx, gy - bm, PW + bm, PH + 2 * bm);
  if (g.solo) lomo(G, gx - 6, gy - bm, 6, PH + 2 * bm);
  // el canto de las hojas: más grueso del lado que más hojas tiene
  const frac = n > 0 ? v / n : 0, tl = g.solo || v === 0 ? 0 : Math.round(1 + 3 * frac), tr = Math.round(1 + 3 * (1 - frac));
  for (let k = 0; k < tr; k++) { G.fillStyle = k % 2 ? '#cfb889' : '#a88f62'; G.fillRect(gx + PW + k, gy + 1 + k, 1, PH - 2 - k); G.fillRect(gx + 2, gy + PH + k, PW - 2 + k, 1); }
  for (let k = 0; k < tl; k++) { G.fillStyle = k % 2 ? '#cfb889' : '#a88f62'; G.fillRect(gx - PW - 1 - k, gy + 1 + k, 1, PH - 2 - k); G.fillRect(gx - PW - k, gy + PH + k, PW - 2 + k, 1); }
  const vu = est.vuelta;
  const izqDe = (vv: number) => (g.solo ? null : hojaCanvas(hojaIzq(vv), g)), derDe = (vv: number) => hojaCanvas(g.solo ? vv : hojaDer(vv), g);
  if (!abierto) {
    // la tapa girando: abajo a la derecha el índice; la tapa con el cuero de un lado y las guardas del otro
    G.drawImage(derDe(0), gx, gy); cinta(G, g);
    hojaQueGira(G, est.tapaL!, guardasConTapa(g), th / Math.PI, true, gx, gy - bm, tapaW, tapaH);
  } else if (vu) {
    const p = easeIO(vu.p), d = vu.dir;
    if (g.solo) {
      const ahora = v, otra = v + d;
      // en una sola hoja: la de abajo es la que viene, la que gira es la de ahora (o la que vuelve)
      if (d > 0) { G.drawImage(derDe(otra), gx, gy); cinta(G, g); hojaQueGira(G, derDe(ahora), revesBlanco(g), p, true, gx, gy, PW, PH); }
      else { G.drawImage(derDe(ahora), gx, gy); cinta(G, g); hojaQueGira(G, derDe(otra), revesBlanco(g), p, false, gx, gy, PW, PH); }
    } else if (d > 0) {
      G.drawImage(izqDe(v)!, gx - PW, gy); G.drawImage(derDe(v + 1), gx, gy); cinta(G, g);
      hojaQueGira(G, derDe(v), izqDe(v + 1)!, p, true, gx, gy, PW, PH);
    } else {
      G.drawImage(izqDe(v - 1)!, gx - PW, gy); G.drawImage(derDe(v), gx, gy); cinta(G, g);
      hojaQueGira(G, derDe(v - 1), izqDe(v)!, p, false, gx, gy, PW, PH);
    }
  } else {
    if (!g.solo) G.drawImage(izqDe(v)!, gx - PW, gy);
    G.drawImage(derDe(v), gx, gy);
    // la cinta marcapáginas: sale de arriba del lomo, cae sobre la hoja de la derecha y cuelga por abajo
    cinta(G, g);
  }
  // la pluma que escribe y el humo de lo que arde
  const pl = est.pluma as null | { x: number; y: number; lado: number };
  if (pl && abierto && !vu) {
    const lx = g.solo ? gx : pl.lado % 2 === 1 ? gx - PW : gx;
    pluma(G, lx + pl.x, gy + pl.y);
  }
  for (const h of est.humo) { const a = Math.max(0, 1 - h.t / 1.6); G.fillStyle = `rgba(${h.t < 0.3 ? '255,150,60' : '60,52,48'},${(a * 0.7).toFixed(2)})`; G.fillRect(Math.round(h.x), Math.round(h.y), h.t < 0.3 ? 1 : 2, h.t < 0.3 ? 1 : 2); }
  return c;
}
const easeIO = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
let revesB: { k: string; c: HTMLCanvasElement } | null = null;
function revesBlanco(g: Geo) { const k = `${g.PW}x${g.PH}`; if (!revesB || revesB.k !== k) revesB = { k, c: canvasDe(papel(g.PW, g.PH, { lado: 'izq', semilla: 99, manchas: 2 })) }; return revesB.c; }
let guardasT: { k: string; c: HTMLCanvasElement } | null = null;
/** El revés de la tapa del tamaño de la tapa: el cuero que dobla por el canto y las guardas encima. */
function guardasConTapa(g: Geo) {
  const k = est.tapaK; if (guardasT?.k === k) return guardasT.c;
  const c = document.createElement('canvas'); c.width = g.PW + g.bm; c.height = g.PH + 2 * g.bm; const G = c.getContext('2d')!;
  tapaReves(G, 0, 0, c.width, c.height, true); G.drawImage(guardasCanvas(g), g.bm, g.bm);
  guardasT = { k, c }; return c;
}
/** El cuero de la tapa visto desde adentro (el borde que dobla por el canto). */
function tapaReves(G: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, izq = false) {
  if (!est.tapaL) return;
  G.drawImage(est.tapaL, 0, 0, est.tapaL.width, est.tapaL.height, x, y, w, h);
  void izq;
}
function lomo(G: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
    const nervio = (yy - 10) % 28 < 3 && yy > 6 && yy < h - 6;
    const v = 0.35 + (xx === 0 ? -0.2 : xx === w - 1 ? 0.25 : 0) + (nervio ? (((yy - 10) % 28) === 0 ? -0.25 : 0.25) : 0) + (h3(xx, yy) - 0.5) * 0.2;
    const col = tono(CUERO, Math.max(0, Math.min(1, 1 - v)), xx, yy); G.fillStyle = `rgb(${col[0]},${col[1]},${col[2]})`; G.fillRect(x + xx, y + yy, 1, 1);
  }
}
/** La cinta de seda roja, con su caída que se mece apenas y la punta en cola de golondrina. */
function cinta(G: CanvasRenderingContext2D, g: Geo) {
  const x0 = g.solo ? g.gx + 7 : g.gx + 6, largo = g.PH + g.bm + CINTA - 1, colgado = g.PH - 6;
  const px = (c: C3, x: number, y: number) => { G.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; G.fillRect(x, y, 1, 1); };
  for (let s = 0; s < largo; s++) {
    // sobre la hoja va casi derecha; lo que cuelga se mece y se tuerce
    const cuelga = s > colgado, mec = cuelga ? Math.sin(est.reloj * 1.4 + s * 0.15) * ((s - colgado) / CINTA) * 2 : 0;
    const x = Math.round(x0 + Math.sin(s * 0.021) * 1.2 + mec), y = g.gy - 2 + s, ancho = 5;
    const cola = s >= largo - 3, torcida = cuelga && Math.sin(est.reloj * 1.4 + s * 0.15) > 0.85;
    for (let k = 0; k < ancho; k++) {
      if (cola && k >= 1 && k <= 3 && s - (largo - 3) >= Math.abs(k - 2)) continue; // la cola de golondrina
      const c: C3 = torcida ? [70, 8, 8] : k === 0 ? [168, 36, 28] : k === ancho - 1 ? [64, 6, 6] : (s + k * 3) % 6 === 0 ? [150, 26, 22] : [118, 14, 12];
      px(c, x + k, y);
    }
    // la sombra de la cinta sobre la hoja
    if (!cuelga && s > 1) { G.fillStyle = 'rgba(30,10,4,0.32)'; G.fillRect(x + ancho, y, 1, 1); }
  }
  // donde dobla sobre el canto de arriba de la hoja
  G.fillStyle = 'rgb(54,4,4)'; G.fillRect(x0, g.gy - 2, 5, 1);
}
/** La pluma de Odrán escribiendo sola: el cañón, las barbas y la punta mojada sobre la letra. */
function pluma(G: CanvasRenderingContext2D, x: number, y: number) {
  // una pluma de ganso de 28 puntos: el cañón, las barbas claras con su sombra y la punta negra de tinta, que tiembla
  const bob = Math.round(Math.sin(est.reloj * 26) * 0.7), sx = Math.round(Math.sin(est.reloj * 9) * 0.6);
  const px = (c: string, a: number, b: number) => { G.fillStyle = c; G.fillRect(x + a + sx, y - b + bob, 1, 1); };
  for (let k = 0; k < 28; k++) {
    const a = Math.round(k * 0.62), b = k;
    if (k < 3) { px('#0a0604', a, b); continue; }          // la punta mojada
    px(k < 6 ? '#5a4a38' : '#c8bca0', a, b);              // el cañón
    if (k > 6) {
      const ancho = Math.round(Math.sin(((k - 6) / 22) * Math.PI) * 5);
      for (let w = 1; w <= ancho + 1; w++) { px(w >= ancho ? '#2a2016' : '#ece2c8', a - w, b - Math.round(w * 0.3)); }
      for (let w = 1; w <= Math.max(1, ancho - 1); w++) px(w >= ancho - 1 ? '#2a2016' : '#c8bc9c', a + w, b + Math.round(w * 0.4));
    }
  }
  // la sombra de la pluma sobre la hoja
  G.fillStyle = 'rgba(30,14,4,0.25)'; for (let k = 3; k < 22; k += 2) G.fillRect(x + Math.round(k * 0.62) + 3, y - k + 4, 2, 1);
}
// ------------------------------------------------------------------ lo que se escribe solo
/** Al quedar quieta una hoja doble, lo nuevo que se ve se pone en cola y se escribe de a uno. */
function encolar(g: Geo) {
  if (est.fase !== 'abierto' || est.vuelta) return;
  const hs = g.solo ? [est.vista] : [hojaIzq(est.vista), hojaDer(est.vista)];
  let t = est.reloj + 0.25;
  for (const e of est.escr.values()) t = Math.max(t, e.t0 + e.hueco + e.dur + 0.15);
  for (const i of hs) {
    const h = est.hojas[i]; if (!h) continue;
    for (const k of h.claves) {
      if (est.escr.has(k) || !nuevaClave(k)) continue;
      // cuántas letras: todo lo de esa clave en todas sus hojas
      let n = 0; for (const hh of est.hojas) for (const o of hh.ops) if (o.k === 'texto' && o.key === k) n = Math.max(n, o.i0 + o.s.length + 1);
      const dur = Math.min(4.2, Math.max(0.8, n / 70)), hu = k.startsWith('m:') || k.startsWith('c:') ? 0 : 0.45;
      est.escr.set(k, { t0: t, dur, n, hueco: hu }); t += hu + dur + 0.2;
    }
    if (h.quema && !quemada(est.d!, h.quema) && !est.quema) { est.quema = { pid: h.quema, t0: Math.max(t, est.reloj + 0.6) }; }
  }
}
/** Lo que terminó de escribirse queda como visto (y deja de escribirse solo). */
function terminarEscritos(todo = false) {
  const d = est.d; if (!d) return;
  let cambio = false;
  for (const [k, e] of est.escr) {
    if (!todo && est.reloj < e.t0 + e.hueco + e.dur + 1.7) continue;
    if (todo && est.reloj < e.t0) { est.escr.delete(k); continue; }
    const v = piezaDeClave(k);
    if (k.startsWith('c:')) marcarCierre(d, k.slice(2));
    else if (k.startsWith('m:')) marcarMargen(d, k.slice(2));
    else if (v && 'p' in v) marcarVista(d, v);
    est.escr.delete(k); cambio = true;
  }
  if (cambio && est.geo) armar(d, est.geo);
  if (est.quema && (todo || est.reloj > est.quema.t0 + 3.6)) { if (est.reloj > est.quema.t0) marcarQuema(d, est.quema.pid); est.quema = null; }
}

// ------------------------------------------------------------------ pasar la hoja
function pasar(dir: 1 | -1, auto = true, vel = 2.1) {
  const g = est.geo!; if (est.vuelta) return false;
  const n = maxVista(g), a = est.vista + dir;
  if (a < (g.solo ? -1 : 0) || a > n) return false;
  terminarEscritos(true);
  est.vuelta = { dir, p: 0, auto, vel };
  if (auto) Sonido.efecto('libro_pagina', { vol: 0.8 });
  return true;
}
/** Va a la hoja de un hilo o una pieza, pasando hojas de corrido. */
function irA(hoja: number) {
  const g = est.geo!; const meta = g.solo ? hoja : Math.ceil(hoja / 2);
  if (meta === est.vista) return;
  const dir = meta > est.vista ? 1 : -1, pasos = Math.abs(meta - est.vista);
  if (pasos > 4) est.vista = meta - dir * 3;
  est.vuelta = null; pasar(dir, true, 5.5);
  if (est.vuelta) (est.vuelta as any).meta = meta;
  Sonido.efecto('libro_pagina', { vol: 0.9, tono: 1.15 });
}

// ------------------------------------------------------------------ abrir y cerrar
export function abrirLibro(d: DatosHeroe) {
  if (est.fase !== 'cerrado') return;
  est.d = d; est.fase = 'abriendo'; est.t = 0; est.vuelta = null; est.escr.clear(); est.quema = null; est.humo = [];
  est.geo = calcGeo(); est.firma = ''; armar(d, est.geo);
  const hayNuevo = est.vistas.some((h) => h.nuevas > 0);
  est.vista = hayNuevo || !est.ultimaVista ? 0 : Math.min(est.ultimaVista, maxVista(est.geo));
  if (est.geo.solo) est.vista = hayNuevo ? 0 : est.vista;
  avisoHud.nuevo = false;
  Sonido.efecto('libro_abrir', { vol: 0.9 });
}
export function cerrarLibro() {
  if (est.fase === 'cerrado' || est.fase === 'cerrando') return;
  terminarEscritos(true);
  est.fase = 'cerrando'; est.t = 0; est.ultimaVista = est.vista;
  // desde cualquier hoja: las hojas vuelven de corrido hasta la primera y ahí la tapa gira y cae
  const g = est.geo, meta = g?.solo ? -1 : 0;
  est.volviendo = est.vista > meta;
  if (!est.volviendo) Sonido.efecto('libro_cerrar', { vol: 0.9 });
}
export function alternarLibro(d: DatosHeroe) { if (est.fase === 'cerrado') abrirLibro(d); else cerrarLibro(); }

// ------------------------------------------------------------------ cada cuadro
let ultimoT = 0;
/** Dibuja el libro si está abierto y atiende su entrada. Devuelve true si el libro tapa el juego (se come la entrada). */
export function dibujarLibro(d: DatosHeroe): boolean {
  if (est.fase === 'cerrado') return false;
  const ahora = performance.now() / 1000, dt = Math.min(0.05, ultimoT ? ahora - ultimoT : 0.016); ultimoT = ahora;
  est.reloj = (window as any).__libroReloj ?? est.reloj + dt;
  est.d = d; est.t = (window as any).__libroT ?? est.t + dt;
  baseLienzo();
  const g0 = calcGeo();
  if (!est.geo || g0.PW !== est.geo.PW || g0.PH !== est.geo.PH || g0.D !== est.geo.D || g0.solo !== est.geo.solo) { est.geo = g0; est.firma = ''; est.cache.clear(); est.tapaK = ''; guardasT = null; }
  const g = est.geo;
  est.tVista += dt; if (est.tVista > 0.5 || !est.hojas.length) { armar(d, g); est.tVista = 0; }
  est.vista = Math.max(g.solo ? -1 : 0, Math.min(maxVista(g), est.vista));
  if (est.fase === 'abriendo' && est.t > 1.15) { est.fase = 'abierto'; est.t = 0; }
  if (est.fase === 'cerrando' && est.volviendo) {
    est.t = 0;
    const meta = g.solo ? -1 : 0;
    if (!est.vuelta) {
      if (est.vista <= meta) { est.volviendo = false; Sonido.efecto('libro_cerrar', { vol: 0.9 }); }
      else { if (est.vista - meta > 4) est.vista = meta + 4; pasar(-1, true, 7.5); }
    }
  }
  if (est.fase === 'cerrando' && !est.volviendo && est.t > (est.vista === 0 && !g.solo ? 0.62 : 0.28)) { est.fase = 'cerrado'; est.t = 0; E.clicIzq = false; return true; }
  // la hoja que gira sola
  if (est.vuelta && est.vuelta.auto) {
    est.vuelta.p += dt * est.vuelta.vel;
    if (est.vuelta.p >= 1) {
      est.vista += est.vuelta.dir; const meta = (est.vuelta as any).meta as number | undefined;
      est.vuelta = null;
      if (meta !== undefined && meta !== est.vista) { pasar(meta > est.vista ? 1 : -1, true, 5.5); if (est.vuelta) (est.vuelta as any).meta = meta; }
    }
  }
  if (est.vuelta && est.vuelta.auto && est.vuelta.p < 0) est.vuelta = null;
  entrada(g, d);
  terminarEscritos(); encolar(g);
  // la pluma rasca y la hoja late
  if (est.pluma && Math.floor(est.reloj * 12) !== Math.floor((est.reloj - dt) * 12) && Math.random() < 0.7) Sonido.efecto('libro_pluma', { vol: 0.5 + Math.random() * 0.3, tono: 0.9 + Math.random() * 0.3 });
  const late = est.fase === 'abierto' && !est.vuelta && (g.solo ? [est.vista] : [hojaIzq(est.vista), hojaDer(est.vista)]).some((i) => est.hojas[i]?.latido);
  if (late && Math.floor(est.reloj / 1.15) !== Math.floor((est.reloj - dt) / 1.15)) Sonido.efecto('libro_latido', { vol: 0.55 });
  // el humo de la carta que arde
  if (est.quema && est.reloj > est.quema.t0 && est.reloj < est.quema.t0 + 3.4) {
    const i = est.porPieza.get(est.quema.pid) ?? -5, lado = g.solo ? 'solo' : i % 2 === 1 ? 'izq' : 'der';
    const bx = lado === 'izq' ? g.gx - g.PW : g.gx, q = (est.reloj - est.quema.t0) / 3.4, R0 = g.PW * 0.42 * Math.min(1, q * 1.15);
    for (let k = 0; k < 3; k++) { const a = -Math.PI / 2 - Math.random() * Math.PI / 2, px = lado === 'izq' ? bx + Math.cos(a + Math.PI) * -R0 : bx + g.PW - 1 + Math.cos(a) * R0, py = g.gy + g.PH - 1 + Math.sin(a) * R0 * 0.8; est.humo.push({ x: px, y: py, vx: (Math.random() - 0.5) * 6, vy: -8 - Math.random() * 10, t: 0 }); }
    if (Math.floor(est.reloj * 6) !== Math.floor((est.reloj - dt) * 6)) Sonido.efecto('libro_arde', { vol: 0.6 });
  }
  for (const h of est.humo) { h.t += dt; h.x += h.vx * dt; h.y += h.vy * dt; h.vx += Math.sin(h.t * 3 + h.y) * 4 * dt; }
  est.humo = est.humo.filter((h) => h.t < 1.6);
  // pintar: la sala a oscuras, la luz de la vela y el libro a puntos enteros
  const c = componer(g);
  const Wc = lienzo.width, Hc = lienzo.height;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  // (al cerrar desde la primera hoja la tapa gira entera y recién después se apaga)
  const ab = est.fase === 'abriendo' ? Math.min(1, est.t / 0.3) : est.fase === 'cerrando' ? (est.vista === 0 && !g.solo ? Math.max(0, 1 - Math.max(0, est.t - 0.5) / 0.12) : Math.max(0, 1 - est.t / 0.28)) : 1;
  ctx.fillStyle = `rgba(6,3,2,${(0.8 * ab).toFixed(3)})`; ctx.fillRect(0, 0, Wc, Hc);
  const ox = Math.round((Wc - g.BW * g.D) / 2), oy = Math.round((Hc - g.BH * g.D) / 2) - (est.fase === 'abriendo' ? Math.round((1 - Math.min(1, est.t / 0.3)) * 10) * g.D : est.fase === 'cerrando' && (est.vista !== 0 || g.solo) ? -Math.round(est.t * 30) * g.D : 0);
  ctx.imageSmoothingEnabled = false; ctx.globalAlpha = Math.min(1, ab * 1.3);
  ctx.drawImage(c, ox, oy, g.BW * g.D, g.BH * g.D);
  // la vela: una luz tibia que tiembla sobre el libro, a pasos (sin degradé liso)
  const fl = 0.035 + 0.02 * Math.sin(est.reloj * 7.3) + 0.012 * Math.sin(est.reloj * 17.1);
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,150,60,${(fl * ab).toFixed(3)})`; ctx.fillRect(ox + g.pad * g.D, oy, g.BW * g.D - 2 * g.pad * g.D, g.BH * g.D);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.restore();
  // la X para cerrar y, en táctil, el índice
  botones(g, ox, oy);
  baseLienzo();
  return true;
}

// ------------------------------------------------------------------ la entrada
const rectCerrar = { x: 0, y: 0, s: 0 }, rectIndice = { x: 0, y: 0, s: 0 };
function aLibro(g: Geo): [number, number] {
  const Wc = lienzo.width, Hc = lienzo.height, k = Wc / W;
  const ox = Math.round((Wc - g.BW * g.D) / 2), oy = Math.round((Hc - g.BH * g.D) / 2);
  return [(E.x * k - ox) / g.D, (E.y * k - oy) / g.D];
}
function entrada(g: Geo, d: DatosHeroe) {
  void d;
  const k = lienzo.width / W, px = E.x * k, py = E.y * k;
  const enBoton = (r: { x: number; y: number; s: number }) => px >= r.x && py >= r.y && px < r.x + r.s && py < r.y + r.s;
  if (pulso('Escape') || pulso('j')) { E.pulsadas.delete('Escape'); E.pulsadas.delete('j'); cerrarLibro(); return; }
  if (est.fase !== 'abierto') { E.clicIzq = false; E.rueda = 0; return; }
  if (E.clicIzq && enBoton(rectCerrar)) { E.clicIzq = false; cerrarLibro(); return; }
  if (E.clicIzq && E.tactil && enBoton(rectIndice)) { E.clicIzq = false; irA(0); return; }
  if (pulso('ArrowRight') || pulso('PageDown') || pulso('d')) pasar(1);
  if (pulso('ArrowLeft') || pulso('PageUp') || pulso('a')) pasar(-1);
  if (pulso('Home')) irA(0);
  if (E.rueda) { pasar(E.rueda > 0 ? 1 : -1); E.rueda = 0; }
  const [bx, by] = aLibro(g);
  const sobreHoja = (lado: 'izq' | 'der') => { const x0 = lado === 'izq' ? g.gx - g.PW : g.gx; return bx >= x0 && bx < x0 + g.PW && by >= g.gy && by < g.gy + g.PH; };
  // arrastrar la hoja (o deslizar el dedo)
  if (E.clicIzq && !est.vuelta && (sobreHoja('der') || sobreHoja('izq'))) est.arr = { x0: bx, y0: by, dir: 0, p0: 0, t0: performance.now(), movio: false };
  if (est.arr && E.izq) {
    const dx = bx - est.arr.x0;
    if (!est.arr.movio && Math.abs(dx) > 5) {
      est.arr.movio = true; const dir = dx < 0 ? 1 : -1;
      if (pasar(dir as 1 | -1, false)) est.arr.dir = dir as 1 | -1;
    }
    if (est.vuelta && !est.vuelta.auto) est.vuelta.p = Math.max(0, Math.min(1, (-dx * est.vuelta.dir) / (g.PW * 1.25)));
  }
  if (est.arr && !E.izq) {
    const a = est.arr; est.arr = null;
    if (a.movio && est.vuelta && !est.vuelta.auto) {
      const rapido = performance.now() - a.t0 < 260;
      const v = est.vuelta; v.auto = true;
      if (v.p > 0.3 || rapido) { v.vel = 2.6; Sonido.efecto('libro_pagina', { vol: 0.7 }); }
      else { v.vel = -3; (v as any).volver = true; }
      return;
    }
    if (!a.movio) {
      // un clic: primero lo que se toca en la hoja (el índice, un hilo rojo), si no la esquina o la mitad
      const hs = g.solo ? [[est.vista, g.gx]] : [[hojaIzq(est.vista), g.gx - g.PW], [hojaDer(est.vista), g.gx]];
      for (const [i, x0] of hs) {
        const h = est.hojas[i]; if (!h) continue;
        for (const c of h.clics) if (bx >= x0 + c.x && bx < x0 + c.x + c.w && by >= g.gy + c.y && by < g.gy + c.y + c.h) {
          if (c.ir) { const hoja = est.porHilo.get(c.ir); if (hoja !== undefined) irA(hoja); Sonido.efecto('click'); return; }
          if (c.pieza) { const hoja = est.porPieza.get(c.pieza); if (hoja !== undefined) irA(hoja); return; }
          if (c.codice) { cerrarLibro(); ui.izq = 'codice'; Sonido.efecto('click'); return; }
        }
      }
      // la cinta lleva al índice
      const cx = g.solo ? g.gx + 8 : g.gx + 7;
      if (bx >= cx - 2 && bx < cx + 7 && by > g.gy + g.PH - 4) { irA(0); return; }
      if (sobreHoja('der') || g.solo) pasar(1); else if (sobreHoja('izq')) pasar(-1);
    }
  }
  // la hoja que vuelve cuando se soltó a medias
  if (est.vuelta && (est.vuelta as any).volver) {
    if (est.vuelta.p <= 0) est.vuelta = null;
  }
  ui_comer();
}
function ui_comer() { E.clicIzq = false; E.clicDer = false; E.rueda = 0; }
/** La X para cerrar (un sello de cera con la cruz) y, en táctil, el botón del índice: de 44 puntos o más. */
function botones(g: Geo, ox: number, oy: number) {
  const k = lienzo.width / W, s = Math.max(Math.round(20 * g.D), Math.ceil(44 / g.css));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const cx = Math.min(lienzo.width - s - 4, ox + g.BW * g.D - s), cy = Math.max(4, oy);
  rectCerrar.x = cx; rectCerrar.y = cy; rectCerrar.s = s;
  ctx.drawImage(boton('cerrar'), cx, cy, s, s);
  if (E.tactil) { rectIndice.x = Math.max(4, ox); rectIndice.y = cy; rectIndice.s = s; ctx.drawImage(boton('indice'), rectIndice.x, rectIndice.y, s, s); }
  else rectIndice.s = 0;
  ctx.restore();
  // la ayuda, abajo, en letra de pixel
  if (est.fase === 'abierto' && !E.tactil) { const y = (oy + g.BH * g.D) / k + 4; if (y < H - 12) textoPixel(L2(PORTADA.ayuda), W / 2, y, { alin: 'center', color: '#8a7454' }); }
  (window as any).__libroBotones = { cerrar: { ...rectCerrar }, indice: { ...rectIndice }, css: g.css };
}
const btnCache = new Map<string, HTMLCanvasElement>();
function boton(tipo: 'cerrar' | 'indice') {
  let c = btnCache.get(tipo); if (c) return c;
  const L = lamina(20, 20);
  selloCera(L, 10, 10, 8, tipo === 'cerrar' ? 5 : 9);
  // la cruz (o las tres rayas del índice) hundidas en la cera
  if (tipo === 'cerrar') for (let k = -4; k <= 4; k++) { pon(L, 10 + k, 10 + k, RUBRICA[0]); pon(L, 10 + k, 10 - k, RUBRICA[0]); pon(L, 11 + k, 10 + k, SANGRE_FRESCA[3]); }
  else for (let r = 0; r < 3; r++) for (let k = -4; k <= 4; k++) { pon(L, 10 + k, 6 + r * 4, RUBRICA[0]); pon(L, 10 + k, 7 + r * 4, SANGRE_FRESCA[3]); }
  c = canvasDe(L); btnCache.set(tipo, c); return c;
}

// ------------------------------------------------------------------ el aviso del HUD: Odrán anota algo
export const avisoHud = { nuevo: false, t: 0, cuenta: -1, revisa: 0, nuevas: 0 };
/** Cada tanto: si entró una pieza nueva mientras se juega, Odrán la anota (aviso y la pluma del HUD). */
export function pasoLibro(d: DatosHeroe, dt: number, avisar: (t: T2) => void) {
  avisoHud.revisa -= dt; avisoHud.t += dt;
  if (avisoHud.revisa > 0) return;
  avisoHud.revisa = 1.2;
  const c = cuentaLibro(d);
  avisoHud.nuevas = c.nuevas;
  if (avisoHud.cuenta >= 0 && c.tiene > avisoHud.cuenta) { avisoHud.nuevo = true; avisoHud.t = 0; avisar(PORTADA.anota); Sonido.efecto('libro_pluma', { vol: 0.6 }); }
  avisoHud.cuenta = c.tiene;
}
/** Al cambiar de héroe el aviso vuelve a empezar. */
export function reiniciarAvisoLibro() { avisoHud.cuenta = -1; avisoHud.nuevo = false; avisoHud.nuevas = 0; avisoHud.revisa = 0; est.ultimaVista = 0; est.firma = ''; }
const icono = new Map<string, HTMLCanvasElement>();
/** La pluma con su gota de tinta, chiquita, que late cuando Odrán anotó algo. Devuelve el rectángulo (lógico) para tocarla. */
export function iconoLibro(x: number, y: number, tam: number, t: number): [number, number, number, number] {
  const k = avisoHud.nuevo && avisoHud.t < 8 ? 1 : avisoHud.nuevas > 0 ? 2 : 0, clave = String(k);
  let c = icono.get(clave);
  if (!c) {
    const L = lamina(14, 14);
    // un libro chico de cuero con la pluma encima
    for (let yy = 4; yy < 13; yy++) for (let xx = 1; xx < 11; xx++) pon(L, xx, yy, xx === 1 || yy === 12 ? CUERO[1] : yy === 4 ? CUERO[6] : CUERO[4]);
    for (let yy = 5; yy < 12; yy++) pon(L, 10, yy, PAPEL[2]);
    pon(L, 5, 8, ORO[4]); pon(L, 6, 8, ORO[3]); pon(L, 5, 9, ORO[2]);
    for (let s = 0; s < 9; s++) { pon(L, 4 + s, 9 - s, s < 2 ? TINTA[0] : [230, 220, 196]); if (s > 2) pon(L, 5 + s, 9 - s, [180, 170, 150]); }
    if (k) { pon(L, 3, 11, SANGRE_FRESCA[2]); pon(L, 3, 12, SANGRE_FRESCA[1]); pon(L, 2, 12, SANGRE_FRESCA[3]); }
    c = canvasDe(L); icono.set(clave, c);
  }
  const m = ctx.getTransform(), D = Math.max(1, Math.round((tam / 14) * m.a)), w = (14 * D) / m.a;
  ctx.save();
  if (k === 1) { const a = 0.5 + 0.5 * Math.sin(t * 6); ctx.globalAlpha = 0.65 + 0.35 * a; }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(c, Math.round(x * m.a + m.e), Math.round(y * m.d + m.f), 14 * D, 14 * D);
  ctx.restore();
  return [x, y, w, w];
}
void lee; void huella; void ORO; void PAPEL; void SANGRE; void tono;

// ------------------------------------------------------------------ ganchos para las pruebas (t1200_libro.cjs)
const W_ = window as any;
W_.__libroAbrir = () => { const j = W_.__juego?.(); if (j) abrirLibro(j.heroe.d); };
W_.__libroCerrar = () => cerrarLibro();
W_.__libroIr = (h: number) => irA(h);
W_.__libroPasar = (d: 1 | -1) => pasar(d);
W_.__libroHojas = () => est.hojas.map((h) => ({ hilo: h.hilo, texto: h.ops.filter((o) => o.k === 'texto' || o.k === 'gotico').map((o) => (o as any).s).join(' '), claves: h.claves, quema: h.quema, latido: !!h.latido }));
W_.__libroHilos = () => est.vistas.map((v) => ({ id: v.h.id, tiene: v.tiene, total: v.total, cierre: !!v.cierre, late: v.late, futuro: v.futuro, nuevas: v.nuevas, huecos: v.piezas.filter((p) => p.estado === 'hueco').map((p) => p.p.id), tienen: v.piezas.filter((p) => p.estado === 'tiene').map((p) => p.p.id), primera: est.porHilo.get(v.h.id) }));
W_.__libroGeo = () => est.geo;
/** Lo que se sale de la hoja (texto o título que pasa el margen): debe dar 0. */
W_.__libroFuera = () => { const g = est.geo!; const out: string[] = []; est.hojas.forEach((h, i) => { for (const o of h.ops) { if (o.k === 'texto' && (o.x < 2 || o.x + anchoMano(o.s) > g.PW - 3)) out.push(`${i}: ${o.s}`); if (o.k === 'gotico' && (o.x < 2 || o.x + anchoGot(o.s, o.menuda ? 'menuda' : 'grande') > g.PW - 3)) out.push(`${i}: ${o.s}`); } }); return out; };
