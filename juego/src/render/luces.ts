import { lienzoTrabajo } from '../motor/lienzos';
// Luces del mundo: cada fuego, proyectil, hechizo y la antorcha del héroe es una luz con color.
// Sirve para tres cosas: sombras proyectadas de los personajes, reflejo de color en sus cuerpos y destellos.
import { W, H } from '../nucleo/lienzo';
import { rumboSalida, COLOR_RUMBO } from '../mundo/rumbos';
import type { Cuadro } from '../motor/assets';
import { LUZ_EFECTO, intensidadLuz, rgbLuz } from '../../../src/engine/gotico/luz_efectos';
import { luzDeArma } from '../../../src/engine/gotico/elementos_arma';
import { baseDe as baseDeObj } from '../juego/objetos';
const hexRgb = (c: string): [number, number, number] => { const n = parseInt(c.replace('#', '').slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
import { manifiesto, objetoMeta } from '../motor/assets';
import type { Juego, Ent } from '../juego/mundo';
import { R } from '../nucleo/azar';
import { fuerzaElectro } from './electro';
import { puntoSalida } from '../mundo/zona';
import { auraEquipo } from '../juego/visual';
import { lucesOzmaren, ALTO_OZMAREN } from './fuego';
import { vivosDe } from './fuego_vivo';
import { efectoPfx } from './pfx';
/** La luz de un poder: la tabla de la Forja o, si es de pixelfx, la que trae el efecto. */
const luzDe = (id: string): any => (id.startsWith('pfx:') ? efectoPfx(id.slice(4))?.luz : LUZ_EFECTO[id]);
import { pulsosOzmaren, lucesSuelo } from './fuego_especial';
import { luzViva } from './arma_viva';
import { pulsoLuz } from '../../../src/engine/gotico/fuego_doom';
import { luzCombustion } from './poderes_vivos';
import { HABILIDADES } from '../datos/clases';
/** Los poderes de golpe cuerpo a cuerpo (su luz va a la mitad, quinta pasada). */
const GOLPES = new Set(HABILIDADES.filter((h) => h.tipo === 'golpe' && !h.definitiva).map((h) => h.id));
import { nochePfx } from './pfx';
import { lucesPresencias } from './presencias';
import { luzPuas } from './puas';
/** Las losas de púas de la zona (una vez por zona). */
const puasZona = new WeakMap<object, { cx: number; cy: number; v: string }[]>();
function trampasPuas(z: { objetos: { id: string; cx: number; cy: number; v: string }[] }) { let l = puasZona.get(z); if (!l) { l = z.objetos.filter((o) => o.id === 'trampa_puas'); puasZona.set(z, l); } return l; }

export interface Luz {
  /** Punto del piso bajo la luz, en pantalla. */
  x: number; y: number;
  /** Altura de la llama sobre el piso, en pixeles de pantalla. */
  h: number;
  /** Alcance en pixeles de pantalla (sin aplastar). */
  r: number;
  c: [number, number, number];
  /** Intensidad 0 a 1. */
  k: number;
  /** Si la luz la lleva alguien, esa entidad no proyecta sombra con ella. */
  de?: Ent;
  /** Antorcha del héroe: alumbra pero no tiñe de color. */
  blanca?: boolean;
  /** Alumbra pero no proyecta sombras (lo que lleva el héroe encima). */
  sinSombra?: boolean;
  /** Identidad estable entre cuadros, para suavizar las sombras. */
  id?: string;
  /** Prioridad de los poderes (0 imprescindible a 3 adorno): pesa en el tope de luces. */
  prio?: number;
}

export const COLOR_ELEM: Record<string, [number, number, number]> = {
  fuego: [255, 120, 40], hielo: [90, 160, 255], frio: [90, 160, 255], rayo: [170, 190, 255], veneno: [90, 230, 70],
  sombra: [150, 70, 255], luz: [255, 225, 150], sagrado: [255, 225, 150], arcano: [200, 110, 255], hueso: [220, 215, 190],
  naturaleza: [120, 220, 90], fisico: [255, 200, 140], sangre: [230, 30, 30],
};
const hex = (c: [number, number, number], a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

const LUZ_RAREZA: Record<string, [number, number, number]> = { raro: [255, 230, 90], conjunto: [90, 230, 90], unico: [210, 170, 90], legendario: [255, 110, 40] };
const ids = new WeakMap<object, string>(); let nId = 0;
const idDe = (o: object) => { let v = ids.get(o); if (!v) { v = 'x' + nId++; ids.set(o, v); } return v; };
export let luces: Luz[] = [];
const presencia = new Map<string, { a: number; dentro: boolean; t: number }>(); let tPresencia = 0;
(window as any).__luces = () => luces;
/** Destello global de la escena (explosiones grandes), 0 a 1. */
export let destello = 0;
export let destelloColor: [number, number, number] = [255, 200, 140];
/** Sol: dirección fija de sombra para zonas claras. */
let sol = 0;

export function recolectar(j: Juego, t: number, aPant: (x: number, y: number) => [number, number], W: number, H: number) {
  const z = j.zona, h = j.heroe;
  const L: Luz[] = [];
  const dentro = (x: number, y: number, r: number) => x > -r && x < W + r && y > -r && y < H + r;
  // antorcha del héroe
  const [hx, hy] = aPant(h.x, h.y);
  const osc = (j as any).oscurece ?? 0;
  const rLuz = ((z.tipo === 'pueblo' ? 420 : 210) + h.c.radio_luz * 18 + Math.sin(t * 7) * 3) * (osc > 0 ? 0.55 + 0.45 * Math.max(0, 1 - Math.sin((osc / 3.5) * Math.PI)) : 1);
  // la antorcha alumbra el camino, no el pecho: el centro va unos 20 px hacia donde mira el héroe
  const DIR_PANT: Record<string, [number, number]> = { s: [0, 1], so: [-0.71, 0.71], o: [-1, 0], no: [-0.71, -0.71], n: [0, -1], ne: [0.71, -0.71], e: [1, 0], se: [0.71, 0.71] };
  const [dvx, dvy] = DIR_PANT[h.dir] ?? [0, 0];
  // (las cinemáticas, ui/director.ts: sin la antorcha del héroe y con sus propias luces, en casillas del mundo)
  const cine = (j as any).lucesCine as { x: number; y: number; z: number; r: number; c: [number, number, number]; k: number; id?: string; sinSombra?: boolean }[] | undefined;
  if (cine) for (const l of cine) { const [lx, ly] = aPant(l.x, l.y); if (l.k > 0.01 && dentro(lx, ly, l.r)) L.push({ x: lx, y: ly, h: l.z, r: l.r, c: l.c, k: l.k, id: l.id, sinSombra: l.sinSombra, prio: 0 }); }
  if (!(j as any).sinAntorcha) L.push({ x: hx + dvx * 20, y: hy + dvy * 14, h: 55, r: rLuz, c: [255, 210, 150], k: 1, de: h, blanca: true, sinSombra: true });
  if (h.c.vivo) {
    // arma elemental: la luz de su elemento en la mano (más grande cuanto mejor el arma), con sombra si alcanza
    const ENC: Record<string, string> = { fuego: 'fuego', frio: 'hielo', rayo: 'rayo', veneno: 'veneno', sombra: 'sombra', luz: 'sagrado', sangre: 'sangre' };
    const nv = (h.d.equipo.arma?.vis?.nivel ?? (h.d.equipo.arma ? (baseDeObj(h.d.equipo.arma) as any)?.arsenal?.nivel : undefined) ?? 3) as number;
    const la = ENC[h.c.vivo] ? luzDeArma(ENC[h.c.vivo] as any, nv) : null;
    if (la) {
      // en la hoja (la pone arma_viva.ts cada cuadro): contenida quieto y entera pegando, titilando según su elemento
      const c = hexRgb(la.color), v = luzViva.on, [ox, oy] = aPant(0, 0);
      L.push({ id: 'mano', x: v ? ox + luzViva.x : hx + 10, y: v ? oy + luzViva.y : hy, h: v ? luzViva.h : 42, r: la.radio, c, k: Math.min(1, la.intensidad * (v ? luzViva.k : 0.85)), de: h, prio: 1 });
    } else {
      const cv = COLOR_ELEM[h.c.vivo === 'luz' ? 'sagrado' : h.c.vivo] ?? COLOR_ELEM.fuego;
      L.push({ x: hx + 10, y: hy, h: 40, r: 120, c: cv, k: 0.55 + Math.sin(t * 13) * 0.08, de: h, sinSombra: true });
    }
  }
  // el golpe del arma viva que conecta: un fogonazo corto de su color en el blanco
  const gv = luzViva.golpe, eg = gv ? t - gv.t : 9;
  luzViva.on = false;
  if (gv && eg >= 0 && eg < 0.16) { const [ox, oy] = aPant(0, 0); L.push({ x: ox + gv.x, y: oy + gv.y, h: 30, r: 110, c: gv.c, k: 0.75 * (1 - eg / 0.16), sinSombra: true }); }
  // equipo legendario: el héroe mismo da una luz de su color
  const au = auraEquipo(h.d.equipo as any);
  if (au) L.push({ x: hx, y: hy, h: 45, r: 110 + au.k * 70, c: au.color, k: (0.35 + au.k * 0.35) * (0.85 + Math.sin(t * 3) * 0.15), de: h, sinSombra: true });
  // las piezas ancla (la catedral) tapan las luces que quedan detrás: sin esto un farol del otro lado pinta la torre
  const tapan: { x0: number; y0: number; x1: number; y1: number; prof: number }[] = [];
  for (const sa of z.salidas) for (const p of sa.piezas ?? []) {
    const q = objetoMeta(p.id, p.v)?.f[0]; if (!q) continue;
    const [px, py] = aPant(p.cx + 0.5, p.cy + 0.5);
    tapan.push({ x0: px - q.ax + q.w * 0.1, y0: py - q.ay, x1: px - q.ax + q.w * 0.9, y1: py - q.ay + q.h * 0.85, prof: p.cx + p.cy });
  }
  const tapada = (o: { cx: number; cy: number }, x: number, y: number) => tapan.some((t) => o.cx + o.cy < t.prof - 2 && x > t.x0 && x < t.x1 && y > t.y0 && y < t.y1);
  // fuegos y objetos que alumbran (una toma de película puede bajarlos: `lucesZona` en ui/director.ts)
  const kZona = (j as any).lucesZonaCine ?? 1;
  for (const o of z.objetos) {
    if (kZona <= 0.01) break;
    const meta = objetoMeta(o.id, o.v); if (!meta || !meta.luz) continue;
    // ríos de lava: un tramo de cada dos alumbra (la luz es grande y se solapa); igual se ve continuo
    if (/rio_lava/.test(o.id) && (Math.floor(o.cx / 5) + Math.floor(o.cy / 5)) % 2) continue;
    const [px, py] = aPant(o.cx + 0.5, o.cy + 0.5);
    if (!dentro(px, py, 320) || tapada(o, px, py)) continue;
    // fuego de Doom vivo: la luz late con la llama de verdad (y sus sombras tiemblan con ella)
    const vs = vivosDe(o);
    if (vs) {
      vs.forEach((v, i) => { const lz = v.s.luz; L.push({ x: px + lz.dx, y: py, h: lz.altura, r: lz.radio, c: v.luz, k: lz.intensidad * pulsoLuz(v.f, lz.mueve).k * kZona, id: `o${o.cx},${o.cy}${i ? ',' + i : ''}`, sinSombra: !lz.sombra }); });
      continue;
    }
    const lc: any = meta.luz[1];
    const c: [number, number, number] = Array.isArray(lc) ? [lc[0], lc[1], lc[2]] : String(lc).includes(',') ? (String(lc).split(',').map(Number) as any) : [255, 150, 60];
    const r = Math.min(260, meta.luz[0] * 1.3) * (0.93 + Math.sin(t * 9 + o.cx) * 0.04 + R() * 0.03);
    const ka = (o as any).alfaCine ?? 1; if (ka <= 0.01) continue;
    L.push({ x: px, y: py, h: Math.max(20, meta.luz[2] * 1.2), r, c, k: 0.9 * kZona * ka, id: `o${o.cx},${o.cy}${o.id}` });
  }
  // (entrega 6) la losa de púas: su barrido de luz fría (puas.ts), para que se vea venir también en lo oscuro
  if (!(window as any).__puasMudas && !(window as any).__puasViejas) for (const o of trampasPuas(z)) {
    if (o.v !== 'abajo') continue;
    const [px, py] = aPant(o.cx + 0.5, o.cy + 0.5); if (!dentro(px, py, 120)) continue;
    const lp = luzPuas(t, o.cx * 7 + o.cy * 13);
    L.push({ id: `p${o.cx},${o.cy}`, x: px, y: py, h: 14, r: lp.r, c: [170, 200, 240], k: lp.k, sinSombra: true });
  }
  // el piso que sigue ardiendo
  for (const l of lucesSuelo(aPant)) if (dentro(l.x, l.y, 200)) L.push(l);
  // la pieza ancla del mapa (la catedral): luna fría encima para que se lea de lejos, y el latido rojo de sus vitrales
  for (const sa of z.salidas) if (sa.piezas?.length) {
    const fa = sa.piezas[sa.piezas.length - 1], [px, py] = aPant(fa.cx + 0.5, fa.cy - 4); if ((fa as any).alfaCine === 0) continue;
    if (!dentro(px, py, 700)) continue;
    // luna gris y sin tinte azul (el azul sumado era lo que enfriaba la catedral): solo para que se lea de lejos
    if (!(window as any).__sinLuna) L.push({ id: 'ancla0', x: px, y: py - 120, h: 260, r: 320, c: [110, 114, 122], k: 0, sinSombra: true });
    // el latido rojo de los vitrales solo si arden (sellada están apagados): con fuego de Doom late con su pulso
    const vit = z.objetos.find((o) => o.id === fa.id) ? vivosDe(fa) : undefined;
    if (fa.v !== 'sellada') L.push({ id: 'ancla1', x: px, y: py - 60, h: 90, r: 200, c: [255, 50, 40], k: vit ? 0.22 * pulsoLuz(vit[0].f, 0.5).k : 0.18 + 0.1 * (0.5 + 0.5 * Math.sin(t * 1.4)), sinSombra: true });
    // la puerta abierta: luz roja fuerte justo afuera del umbral, con el pulso de los vitrales; tiñe el piso, al héroe, a Thor y a las
    // lápidas y les saca sombras largas hacia afuera (con sombra, a propósito)
    if (fa.v !== 'sellada') { const [dx, dy] = aPant(fa.cx + 0.5, fa.cy + 2); const pulso = 0.5 + 0.5 * Math.sin(t * 1.4); L.push({ id: 'puerta', x: dx, y: dy, h: 22, r: 150 + pulso * 25, c: [255, 58, 18], k: 0.8 + pulso * 0.2 }); }
  }
  // proyectiles: la luz viaja con ellos (tabla de la Forja: color, radio, curva, parpadeo); un abanico de más de 3 es una sola luz
  const salvas = new Map<any, { x: number; y: number; n: number; p: any }>();
  for (const p of j.proyectiles) {
    const LE = luzDe(p.efecto);
    if (p.salva && LE?.enVuelo) { const s = salvas.get(p.salva) ?? { x: 0, y: 0, n: 0, p }; s.x += p.x; s.y += p.y; s.n++; salvas.set(p.salva, s); }
  }
  const unaPorSalva = new Set<any>();
  for (const [k, s] of salvas) if (s.n > 3) unaPorSalva.add(k);
  const hechas = new Set<any>();
  for (const p of j.proyectiles) {
    const LE = luzDe(p.efecto);
    let x = p.x, y = p.y, rk = 1;
    if (p.salva && unaPorSalva.has(p.salva)) { if (hechas.has(p.salva)) continue; hechas.add(p.salva); const s = salvas.get(p.salva)!; x = s.x / s.n; y = s.y / s.n; rk = 1.3; }
    const [px, py] = aPant(x, y);
    if (!dentro(px, py, 300)) continue;
    if (LE) {
      if (!LE.enVuelo || LE.intensidad <= 0 || LE.radio <= 0) continue;
      // pixelfx: la curva por cuadro del propio efecto (intensidadLuz solo conoce la tabla de la Forja y daba 0)
      const ep = p.efecto.startsWith('pfx:') ? efectoPfx(p.efecto.slice(4)) : null;
      const k = (ep ? LE.intensidad * (LE.curva?.length ? LE.curva[Math.floor((p.t * 25) / ep.t) % LE.curva.length] : 1) : intensidadLuz(p.efecto, (manifiesto().wm?.[p.efecto]?.t ?? 2) / 25, p.t, true)) * (1 - (LE.parpadeo ?? 0) * R());
      if (k <= 0.02) continue;
      L.push({ id: idDe(p), x: px, y: py, h: Math.max(18, (p.z ?? 0) * 1.2), r: LE.radio * rk, c: ep ? hexRgb(LE.color) : rgbLuz(p.efecto), k, sinSombra: !LE.sombra, prio: LE.prioridad ?? 1 });
      continue;
    }
    const el = (manifiesto().wm?.[p.efecto]?.elem as string) ?? p.elem;
    const c = COLOR_ELEM[p.elem === 'rayo' || el === 'rayo' ? 'rayo' : p.elem && p.elem !== 'fisico' ? p.elem : el] ?? COLOR_ELEM.fisico;
    const fuerte = el === 'rayo' || p.elem === 'rayo' ? 1.35 : p.arco ? 0.5 : 1;
    L.push({ id: idDe(p), x: px, y: py, h: Math.max(18, (p.z ?? 0) * 1.2 + 30), r: 200 * fuerte * rk + Math.sin(t * 30 + p.x) * 10, c, k: Math.min(1, 0.85 * fuerte), prio: 1 });
  }
  // trampas armadas, el aura y los sellos de las invocaciones (render/presencias.ts)
  for (const lz of lucesPresencias(j, aPant)) if (dentro(lz.x, lz.y, 300)) L.push({ x: lz.x, y: lz.y, h: lz.h, r: lz.r, c: lz.c, k: lz.k, sinSombra: true, prio: 2 });
  // fogonazo en la mano del héroe al lanzar
  for (const fg of ((j as any).fogonazos ?? []) as { t: number; dur: number; r: number; k: number; id: string }[]) {
    const q = Math.max(0, 1 - fg.t / fg.dur); if (q <= 0) continue;
    L.push({ x: hx + 8, y: hy, h: 46, r: fg.r, c: rgbLuz(fg.id), k: fg.k * q, de: h, sinSombra: true, prio: 1 });
  }
  // hechizos y explosiones: luz que se apaga; los impactos dan un destello
  let fl = 0; let flc: [number, number, number] = destelloColor;
  const L0 = L.length;
  const colH = new Set<string>(); // (la columna del Coro y del Ascenso nace en el héroe: de día su luz lo lavaba a blanco)
  for (const e of j.efectos) {
    if ((e as any).sinLuz) continue; // (los rayitos de la onda del Puño de dios: su luz la da el área, de a veinte encendían los cuerpos)
    const [px, py] = aPant(e.x, e.y);
    if (!dentro(px, py, 300)) continue;
    { const hb = (e as any).hab; if ((hb === 'coro_sellos' || hb === 'ascenso_espiritu') && Math.hypot(e.x - j.heroe.x, e.y - j.heroe.y) < 0.6) { colH.add(idDe(e)); colH.add(idDe(e) + 'b'); } }
    // la Combustión: el calor que se junta, el golpe (con destello) y el fuego que queda (poderes_vivos.ts)
    if (e.id === 'combustion') { const lz = luzCombustion(e); if (lz) { L.push({ id: idDe(e), x: px, y: py, h: 34, r: lz[0], c: COLOR_ELEM.fuego, k: lz[1], prio: 0 }); if (lz[2] > fl) { fl = lz[2]; flc = COLOR_ELEM.fuego; } } continue; }
    // pixelfx: el cuadro sale del efecto (en el manifiesto de poderes no está y caía en la luz genérica)
    const ep = e.id.startsWith('pfx:') ? efectoPfx(e.id.slice(4)) : null;
    const meta = ep ? { t: ep.t, bucle: ep.bucle } : manifiesto().wm?.[e.id];
    const LE = luzDe(e.id);
    if (LE && meta) {
      // curva por cuadro de la Forja; los de prioridad 0 además dan el destello de pantalla
      const n = LE.curva.length, fi = Math.floor((e.t * 25) / (meta.t ?? 2));
      const cv = meta.bucle ? LE.curva[fi % n] : fi < n ? LE.curva[fi] : 0;
      const k = LE.intensidad * cv * (1 - (LE.parpadeo ?? 0) * R());
      if (k <= 0.01 || LE.radio <= 0) continue;
      const esc = e.escala ?? 1, c: [number, number, number] = colH.has(idDe(e)) && !(window as any).__blancoViejo ? [255, 196, 100] : ep ? hexRgb(LE.color) : rgbLuz(e.id);
      // (quinta pasada: el golpe cuerpo a cuerpo de un poder alumbra a la mitad: de noche el Puño de rayo dejaba el piso y
      // al blanco casi blancos)
      // (sexta pasada: los rayos del Puño de dios que caen en corro alumbran a media luz y sin destello de pantalla)
      const chc = (e as any).chico || (e as any).corro, kr = (e as any).chico ? 0.35 : (e as any).corro ? 0.6 : 1, kk = (e as any).chico ? 0.4 : 0.5, gpe = !(window as any).__blancoViejo && (GOLPES.has((e as any).hab ?? '') || ((e as any).hab === 'puno_dios' && !(window as any).__blancoQuinta)); L.push({ id: idDe(e), x: px, y: py, h: LE.altura * esc + (e.z ?? 0), r: LE.radio * esc * kr, c, k: Math.min(1, chc ? k * kk : gpe ? k * 0.5 : k), sinSombra: !LE.sombra, prio: chc ? 2 : LE.prioridad ?? 2 });
      // (la columna que nace en el héroe no da el destello de pantalla: de noche lavaba todo a blanco, quinta pasada)
      if ((LE.prioridad ?? 2) === 0 && !chc && !gpe && (!colH.has(idDe(e)) || (window as any).__blancoViejo)) { const f = k * Math.min(1, esc); if (f > fl) { fl = f; flc = c; } }
      if (e.id === 'arco_cadena' && (e as any).x2 !== undefined) { const [bx, by] = aPant((e as any).x2, (e as any).y2); L.push({ id: idDe(e) + 'b', x: (px + bx) / 2, y: (py + by) / 2, h: 34, r: LE.radio * kr, c, k: Math.min(1, chc ? k * kk : k), prio: chc ? 2 : 0, sinSombra: !LE.sombra }); }
      continue;
    }
    const c = COLOR_ELEM[meta?.elem ?? (e.id === 'arco_cadena' ? 'rayo' : 'fisico')] ?? COLOR_ELEM.fisico;
    const dur = e.dur ?? 1;
    const k = Math.max(0, 1 - e.t / dur);
    const impacto = meta && !meta.bucle && (meta.tipo === 'impacto' || meta.tipo === 'lluvia' || meta.tipo === 'area');
    const golpe = impacto ? Math.max(0, 1 - e.t / 0.25) : 0;
    L.push({ id: idDe(e), x: px, y: py, h: 40 + (e.z ?? 0), r: (150 * (e.escala ?? 1)) * (0.4 + k * 0.6) + 40 + golpe * 120, c, k: Math.min(1, 0.45 * k + golpe * 0.8) });
    if (impacto && meta.elem !== 'fisico' && meta.elem !== 'hueso') { const f = golpe * Math.min(1, (e.escala ?? 1)); if (f > fl) { fl = f; flc = c; } }
    if (e.id === 'arco_cadena' && (e as any).x2 !== undefined) {
      const [bx, by] = aPant((e as any).x2, (e as any).y2);
      const ch = (e as any).chico; L.push({ id: idDe(e) + 'b', x: (px + bx) / 2, y: (py + by) / 2, h: 34, r: ch ? 70 : 220, c: COLOR_ELEM.rayo, k: ch ? k * 0.4 : k });
    }
  }
  for (const a of j.areas) if (a.retraso <= 0 && a.elem && a.elem !== 'fisico') {
    const [px, py] = aPant(a.x, a.y);
    if (!dentro(px, py, 300)) continue;
    // (sexta pasada) la onda triple del Puño de dios son tres áreas de rayo de una décima: juntas encendían el sitio a blanco
    const kp = a.hab === 'puno_dios' && !(window as any).__blancoQuinta ? 0.3 : 1;
    L.push({ id: idDe(a), x: px, y: py, h: 20, r: a.radio * 32 + 40, c: COLOR_ELEM[a.elem] ?? COLOR_ELEM.fuego, k: (0.6 + Math.sin(t * 11 + a.x) * 0.08) * kp });
  }
  // (tercera pasada) de día la luz de los poderes suma menos: las definitivas (el Coro de los sellos, el Juicio, la
  // Sentencia) encendían a blanco medio campo en las dunas. Las antorchas, el fuego y la lámpara del héroe no cambian
  // (quinta pasada: de noche la columna del Coro y del Ascenso tampoco va entera, 0,55; antes subía a 1 y el sitio quedaba
  // blanco, 49 a 55 % de puntos casi blancos en el héroe)
  if (!(window as any).__fogonazoParejo) { const n = nochePfx(), kd = 0.45 + 0.55 * n, kc = (window as any).__blancoViejo ? 0.4 + 0.6 * n : 0.3 + 0.2 * n; for (let i = L0; i < L.length; i++) L[i].k *= kd * (colH.has(L[i].id ?? "") ? kc : 1); }
  // el cuerpo sacudido por el rayo alumbra azul a tirones (render/electro.ts)
  for (const m of [h as any, ...j.monstruos]) {
    const f = m.muerto ? 0 : fuerzaElectro(m, j.t); if (f <= 0) continue;
    const [px, py] = aPant(m.x, m.y); if (!dentro(px, py, 300)) continue;
    // (sexta pasada: a media luz y más azul; tres cuerpos sacudidos juntos se encendían unos a otros hasta el blanco)
    const q6 = !(window as any).__blancoQuinta;
    L.push({ id: 'el' + m.id, x: px, y: py, h: 34 * (m.escala ?? 1), r: 80 + 40 * (m.escala ?? 1), c: q6 ? [110, 135, 255] : [150, 170, 255], k: f * (0.16 + 0.22 * R()) * (q6 ? 0.55 : 1), de: m, sinSombra: true, prio: 1 });
  }
  // Ozmaren arde: una luz naranja que palpita, más fuerte cuando abre el pecho
  for (const m of j.monstruos) {
    if (m.muerto || m.def.sprite !== 'jefe_ozmaren') continue;
    const [px, py] = aPant(m.x, m.y); if (!dentro(px, py, 400)) continue;
    const furia = Math.min(1, (m.fase ?? 0) * 0.6 + (m.acc === 'lanzar' || (m.acc as string) === 'especial' ? 0.6 : 0));
    for (const [i, l] of lucesOzmaren(px, py, ALTO_OZMAREN * (m.escala ?? 1), t, furia, pulsosOzmaren).entries()) L.push({ id: 'oz' + i, x: l.x, y: l.y, h: l.h, r: l.r, c: l.nucleo ? [255, 150 + Math.round(l.k * 60), 60] : [255, 95 + Math.round(l.k * 40), 25], k: l.k, de: m });
  }
  // la Campana que Ahoga: luz de mar verde que respira y crece con cada tañido; Aun-Saar: luz blanca dorada y la boca del pecho que late
  for (const m of j.monstruos) {
    if (m.muerto) continue;
    const sp = m.def.sprite;
    if (sp !== 'jefe_campana_ahoga' && sp !== 'jefe_aun_saar') continue;
    const [px, py] = aPant(m.x, m.y); if (!dentro(px, py, 420)) continue;
    const esp = m.acc === 'lanzar' || (m.acc as string) === 'especial' ? 1 : 0;
    const es = m.escala ?? 1;
    if (sp === 'jefe_campana_ahoga') {
      const tan = esp ? 0.5 + 0.5 * Math.abs(Math.sin(t * 6)) : 0;
      L.push({ id: 'ca0', x: px, y: py - 60 * es, h: 70 * es, r: 190 + tan * 90 + Math.sin(t * 1.3) * 12, c: [70, 220, 190], k: 0.7 + tan * 0.3 + Math.sin(t * 1.3) * 0.06, de: m });
      L.push({ id: 'ca1', x: px, y: py - 20 * es, h: 24, r: 120 + tan * 60, c: [120, 255, 220], k: 0.35 + tan * 0.4, de: m, sinSombra: true });
    } else {
      const pulso = 0.5 + 0.5 * Math.sin(t * 2.4) * Math.sin(t * 0.9 + 1);
      L.push({ id: 'as0', x: px, y: py - 150 * es, h: 160 * es, r: 260 + Math.sin(t * 0.8) * 15, c: [255, 240, 205], k: 0.75 + (m.fase ?? 0) * 0.08, de: m });
      L.push({ id: 'as1', x: px, y: py - 120 * es, h: 120 * es, r: 140 + pulso * 70 + esp * 90, c: [255, 205, 110], k: 0.45 + pulso * 0.35 + esp * 0.3, de: m, sinSombra: true });
    }
  }
  // grietas de lava del piso: brillan y respiran
  for (const mk of z.marcas) if (mk.tipo === 'lava' && mk.cx % 2 === 0) {
    const [px, py] = aPant(mk.cx + 0.5, mk.cy + 0.5); if (!dentro(px, py, 200)) continue;
    L.push({ id: `lv${mk.cx},${mk.cy}`, x: px, y: py, h: 8, r: 110, c: [255, 80, 20], k: 0.35 + 0.25 * Math.sin(t * 1.7 + mk.cx * 0.7) + R() * 0.08 });
  }
  // botín en el piso: luz del color de su rareza
  for (const sl of j.suelo) {
    const o = sl.o; if (!o) continue;
    const c = LUZ_RAREZA[o.rareza]; if (!c) continue;
    const [px, py] = aPant(sl.x, sl.y); if (!dentro(px, py, 120)) continue;
    L.push({ x: px, y: py, h: 30, r: o.rareza === 'legendario' ? 130 : o.rareza === 'unico' ? 110 : 80, c, k: 0.5 + Math.sin(t * 3 + sl.id) * 0.08, sinSombra: true });
  }
  // portal
  if (j.portal) {
    const pz = (j as any).portalZona === z.id ? aPant(j.portal.x, j.portal.y) : z.tipo === 'pueblo' && z.entradas.portal ? aPant(z.entradas.portal[0] + 0.5, z.entradas.portal[1] - 1) : null;
    const tp = z.tipo === 'pueblo' ? 'pueblo' : /^a5_/.test(z.id) ? 'infierno' : 'mazmorra';
    if (pz) L.push({ id: 'portal', x: pz[0], y: pz[1], h: 40, r: 170, c: tp === 'pueblo' ? [255, 174, 85] : tp === 'infierno' ? [224, 64, 26] : [74, 184, 176], k: 0.85 });
  }
  // cada salida con su luz propia, ámbar: tiñe el piso y se ve de lejos
  j.zona.salidas.forEach((sa, i) => { const [sx, sy] = aPant(...puntoSalida(j.zona, sa)); if (sx < -200 || sx > W + 200 || sy < -200 || sy > H + 200) return; L.push({ id: 'sal' + i, x: sx, y: sy, h: 34, r: 150 + Math.sin(t * 2.2 + sa.cx) * 12, c: luzSalida(j.zona.id, sa.destino), k: 0.6, sinSombra: true }); });
  // cerca de un jefe despierto las luces del mapa titubean y a ratos se apagan, como si algo les chupara el aire
  const jf = j.jefe && !j.jefe.muerto && j.jefe.estado === 'perseguir' ? j.jefe : null;
  if (jf) {
    const [bx, by] = aPant(jf.x, jf.y);
    for (let i = L.length - 1; i >= 0; i--) {
      const l = L[i]; if (!l.id || l.id[0] !== 'o') continue;
      const d = Math.hypot(l.x - bx, l.y - by); if (d > 380) continue;
      const cerca = 1 - d / 380, sem = (l.x * 0.37 + l.y * 0.11) % 7;
      const parpadeo = Math.sin(t * (9 + sem * 3)) * Math.sin(t * (2.3 + sem)) ;
      const apagada = Math.sin(t * 0.7 + sem * 2.1) > 0.92 - cerca * 0.25;
      if (apagada) { L.splice(i, 1); continue; }
      l.k *= Math.max(0.15, 1 - cerca * (0.45 + 0.4 * Math.abs(parpadeo)));
    }
  }
  // con muchas luces (el acto 5 llega a ~50) el cuadro se cae: quedan las 22 que más pesan en pantalla
  // (fuerza por radio y cercanía al centro); las del héroe y las sin id de objeto siempre entran
  // (Rick, 20 nov 2026, "saltos de iluminación" en una cripta llena de velas: el radio de cada vela tiembla al azar y el
  // fuego de Doom late, así que las que quedaban cerca del puesto 18 entraban y salían del tope en cuadros seguidos y su
  // luz se prendía y se apagaba entera. Ahora la que ya está adentro pesa 1,8 veces más para salir, y la que entra o sale
  // se funde en un cuarto de segundo: `presencia` por id de luz)
  const dtL = Math.min(0.1, Math.max(0, t - tPresencia)); tPresencia = t;
  if ((window as any).__lucesSaltan) { if (L.length > 18) {
    const cxp = W / 2, cyp = H * 0.45;
    const PRIO = [4, 2, 1, 0.5];
    const peso = (l: Luz) => (l.de === h || l.id === 'puerta' || l.id?.startsWith('ancla') || l.id?.startsWith('oz') || l.id?.startsWith('ca') || l.id?.startsWith('as') ? 1e9 : l.prio === 0 && l.k > 0.2 ? 1e8 + l.k : ((l.k * l.r) / (60 + Math.hypot(l.x - cxp, l.y - cyp))) * (l.prio !== undefined ? PRIO[l.prio] : 1));
    L.sort((a, b) => peso(b) - peso(a)); L.length = 18;
  } } else {
    const cxp = W / 2, cyp = H * 0.45;
    const PRIO = [4, 2, 1, 0.5];
    const peso = (l: Luz) => (l.de === h || l.id === 'puerta' || l.id?.startsWith('ancla') || l.id?.startsWith('oz') || l.id?.startsWith('ca') || l.id?.startsWith('as') ? 1e9 : l.prio === 0 && l.k > 0.2 ? 1e8 + l.k : ((l.k * l.r) / (60 + Math.hypot(l.x - cxp, l.y - cyp))) * (l.prio !== undefined ? PRIO[l.prio] : 1) * (l.id && presencia.get(l.id)?.dentro ? 1.8 : 1));
    let fuera: Luz[] = [];
    if (L.length > 18) { L.sort((a, b) => peso(b) - peso(a)); fuera = L.splice(18); }
    const vistas = new Set<string>(), paso = dtL * 4;
    for (const l of L) {
      if (!l.id) continue; vistas.add(l.id);
      let p = presencia.get(l.id);
      // (una luz que nunca se vio viene de fuera de la pantalla: entra entera; la que estaba fuera del tope se enciende de a poco)
      if (!p) { p = { a: 1, dentro: true, t }; presencia.set(l.id, p); }
      p.dentro = true; p.t = t; p.a = Math.min(1, p.a + paso); l.k *= p.a;
    }
    // las que quedaron fuera del tope se apagan de a poco (como mucho 6 de más mientras se funden)
    let extra = 0;
    for (const l of fuera) {
      if (!l.id) continue; vistas.add(l.id);
      let p = presencia.get(l.id);
      if (!p) { p = { a: 0, dentro: false, t }; presencia.set(l.id, p); }
      p.dentro = false; p.t = t; p.a = Math.max(0, p.a - paso);
      if (p.a > 0 && extra < 6) { l.k *= p.a; L.push(l); extra++; }
    }
    if (presencia.size > 400) for (const [id, p] of presencia) if (!vistas.has(id) && t - p.t > 2) presencia.delete(id);
  }
  // como mucho 6 luces de poderes proyectan sombra (las de prioridad 3 nunca)
  let conSombra = 0;
  for (const l of L) if (l.prio !== undefined && !l.sinSombra) { if (l.prio >= 3 || conSombra >= 6) l.sinSombra = true; else conSombra++; }
  luces = L;
  destello = Math.max(destello * 0.82, fl); destelloColor = fl > 0 ? flc : destelloColor;
  sol = z.tipo === 'mazmorra' ? 0 : Math.max(0, 0.6 - z.oscuridad);
}

// lienzo de trabajo para siluetas: uno distinto en cada pedido (ver motor/lienzos.ts)
let tmp: HTMLCanvasElement, tctx: CanvasRenderingContext2D;
const gctx = document.createElement('canvas').getContext('2d')!; // (solo para crear degradados)
const prep = (w: number, h: number) => { const t = lienzoTrabajo(w, h); tmp = t.cv; tctx = t.c; return tctx; };
function silueta(q: Cuadro, relleno: string | CanvasGradient): boolean {
  const im = q.img; if (!im) return false;
  prep(q.w, q.h);
  tctx.globalCompositeOperation = 'copy';
  tctx.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
  tctx.globalCompositeOperation = 'source-in';
  tctx.fillStyle = relleno; tctx.fillRect(0, 0, q.w, q.h);
  tctx.globalCompositeOperation = 'source-over';
  return true;
}

interface Influencia { l: Luz; f: number; gx: number; gy: number; d: number }
function influencias(e: Ent, px: number, py: number, paraSombra = false): Influencia[] {
  const out: Influencia[] = [];
  for (const l of luces) {
    if (l.de === e || (paraSombra && l.sinSombra)) continue;
    const gx = px - l.x, gy = (py - l.y) * 2; // piso sin aplastar
    const d = Math.hypot(gx, gy);
    if (d >= l.r) continue;
    const f = l.k * Math.pow(1 - d / l.r, 0.8);
    if (f < 0.04) continue;
    out.push({ l, f, gx, gy, d });
  }
  out.sort((a, b) => b.f - a.f);
  return paraSombra ? out.slice(0, 5) : out.slice(0, 3);
}

const estadoSombras = new Map<number, { t: number; s: Map<string, { gx: number; gy: number; len: number; a: number }> }>();
export const olvidarSombras = () => estadoSombras.clear();
/** Sombras del personaje: una por cada luz fija cercana, estiradas lejos de ella y más suaves con la distancia. */
// presupuesto de sombras por cuadro: con decenas de monstruos y muchas luces (acto 5) las sombras completas se comían el cuadro
let gastoSombras = 0;
export const nuevoCuadroSombras = () => { gastoSombras = 0; };
export function sombras(ctx: CanvasRenderingContext2D, e: Ent, q: Cuadro, px: number, py: number, esc: number) {
  // Khamer-Ul no tiene sombra: es su maldición
  if ((e as any).def?.sprite === 'jefe_rey_sin_sombra') return;
  // sombra de contacto, siempre: ancla los pies al piso
  // (solo un roce bajo los pies: la sombra de verdad es la silueta proyectada de más abajo, que ahora está siempre)
  const rr = (e.radio / 0.45) * 0.9 * esc;
  ctx.save(); ctx.globalAlpha = q.img ? 0.2 : 0.32; ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.ellipse(px, py, rr * (q.img ? 6.5 : 11), rr * (q.img ? 2.8 : 5), 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  if (!q.img) return;
  // sombras suavizadas: cada luz fija tiene su sombra por entidad, que gira y se estira despacio (~150 ms) y aparece
  // o se apaga con fundido, así no saltan de una luz a otra al caminar ni titilan con el fuego
  const ahora = performance.now() / 1000;
  if (estadoSombras.size > 600) estadoSombras.clear();
  let est = estadoSombras.get(e.id);
  if (!est) { est = { t: ahora, s: new Map() }; estadoSombras.set(e.id, est); }
  const dt = Math.min(0.2, Math.max(0, ahora - est.t)); est.t = ahora;
  const kk = 1 - Math.exp(-dt / 0.15);
  const vistos = new Set<string>();
  for (const i of influencias(e, px, py, true)) {
    if (i.d < 6) continue;
    const id = i.l.id ?? 'anon';
    vistos.add(id);
    const len = Math.max(0.45, Math.min(2.2, (i.d / i.l.h) * 0.95)), a = Math.min(1, 1.1 * i.f);
    const gx = i.gx / i.d, gy = i.gy / i.d;
    const v = est.s.get(id);
    if (!v) est.s.set(id, { gx, gy, len, a: a * kk });
    else { v.gx += (gx - v.gx) * kk; v.gy += (gy - v.gy) * kk; v.len += (len - v.len) * kk; v.a += (a - v.a) * kk; }
  }
  for (const [id, v] of est.s) if (!vistos.has(id)) { v.a -= v.a * kk; if (v.a < 0.01) est.s.delete(id); }
  const lista: { gx: number; gy: number; len: number; a: number }[] = [];
  for (const v of est.s.values()) { const n = Math.hypot(v.gx, v.gy) || 1; lista.push({ gx: v.gx / n, gy: v.gy / n, len: v.len, a: v.a }); }
  lista.sort((x, y) => y.a - x.a); lista.length = Math.min(lista.length, 3);
  if (sol > 0) lista.push({ gx: 0.55, gy: -0.83, len: 0.85, a: sol * 0.7 });
  // sin luces cerca igual hay sombra: la del cielo (luna, resplandor), con la misma caída que traen horneada los objetos
  // del mapa. Se apaga a medida que las luces fijas mandan, para no sumar una sombra de más junto a una fogata.
  const fuertes = lista.reduce((t, v) => t + v.a, 0);
  if (fuertes < 0.6) lista.push({ gx: 0.93, gy: 0.36, len: 0.8, a: 0.5 * (1 - fuertes / 0.6) });
  if (!lista.length) return;
  if (!silueta(q, '#000')) return;
  const n = lista.length;
  const norm = n > 2 ? Math.sqrt(2 / n) : 1;
  // los sprites gigantes (jefes) se dibujan con menos sombras y una sola copia: son caros
  const grande = q.w * q.h * esc * esc > 50000;
  // lejos del centro de la pantalla, o pasado el presupuesto, basta la sombra de la luz más fuerte en una sola copia
  const lejos = Math.hypot(px - W / 2, py - H * 0.45) > 320;
  if ((lejos || gastoSombras > 150) && !grande && e.tipo !== 'heroe') { const s0 = lista[0]; dibujarSombra(ctx, q, px, py, esc, s0.gx, s0.gy, s0.len, Math.min(0.72, s0.a), 1); gastoSombras += 1; return; }
  const usar = grande ? lista.slice(0, 2) : lista;
  for (const s of usar) dibujarSombra(ctx, q, px, py, esc, s.gx, s.gy, s.len, Math.min(0.82, s.a * norm), grande ? 1 : 3);
  gastoSombras += usar.length * (grande ? 1 : 3);
}

/** Sombra de una silueta ya preparada en el lienzo de trabajo: (gx, gy) es la dirección lejos de la luz en el piso. */
function dibujarSombra(ctx: CanvasRenderingContext2D, q: Cuadro, px: number, py: number, esc: number, gx: number, gy: number, len: number, alfa: number, copias = 3) {
  // eje de la altura: hacia afuera de la luz, sobre el piso. Eje del ancho: perpendicular, también en el piso.
  const cx = -gx * len, cy = -gy * 0.5 * len;
  let ux = -gy, uy = gx; if (ux < 0) { ux = -ux; uy = -uy; }
  const ax = ux, ay = uy * 0.5;
  // Un núcleo nítido, a puntos enteros y del mismo negro de los pies a la punta (la sombra que sigue al fuego en el
  // Diablo de Rick), y alrededor un borde apenas difuso. Antes eran tres copias corridas que la volvían una mancha gris.
  const su = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  const capas: [number, number, number][] = copias === 1 ? [[1, 0, alfa]] : [[1.05, 0.8, alfa * 0.22], [1, 0, alfa]];
  for (const [k, desp, a] of capas) {
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(Math.round(px + desp), Math.round(py));
    ctx.transform(ax, ay, cx * k, cy * k, 0, 0);
    ctx.drawImage(tmp, 0, 0, q.w, q.h, -q.ax * esc, -q.ay * esc, q.w * esc, q.h * esc);
    ctx.restore();
  }
  ctx.imageSmoothingEnabled = su;
}

/** Cuánto lo alumbra un fuego o un poder de color (0 nada, 1 de lleno). Junto al fuego el cuerpo se deja oscuro y el filo lo dibuja. */
export function luzFuerte(e: Ent, px: number, py: number): number { let k = 0; for (const i of influencias(e, px, py)) if (!i.l.blanca) k = Math.max(k, i.f); return Math.min(1, k); }

/** Sombra de un sprite suelto (menús): una luz en (lx, ly) de pantalla a la altura lh. */
export function sombraSuelta(ctx: CanvasRenderingContext2D, q: Cuadro | undefined, px: number, py: number, esc: number, lx: number, ly: number, lh: number, alfa: number) {
  if (!q || !q.img || !silueta(q, '#000')) return;
  const gx = px - lx, gy = (py - ly) * 2, d = Math.hypot(gx, gy) || 1;
  dibujarSombra(ctx, q, px, py, esc, gx / d, gy / d, Math.max(0.45, Math.min(2.2, (d / lh) * 0.95)), alfa);
}

/** Reflejo de las luces de color sobre el cuerpo: el lado que mira a la luz se enciende con su color. */
export function reflejos(ctx: CanvasRenderingContext2D, e: Ent, q: Cuadro, px: number, py: number, esc: number) {
  if (!q.img) return;
  const inf = influencias(e, px, py).filter((i) => !i.l.blanca).slice(0, q.w * q.h * esc * esc > 50000 ? 1 : 2);
  for (const i of inf) {
    // Dos capas, como el caballero del fuego de Diablo: un baño muy suave del color de la luz del lado que la mira, y
    // sobre todo el FILO: los puntos del borde de la silueta que dan al fuego se encienden. El cuerpo sigue oscuro
    // y la forma se lee por el canto de luz (antes era un degradado ancho que aplanaba la figura).
    const dx = i.d > 1 ? -i.gx / i.d : 0, dy = i.d > 1 ? (-i.gy / i.d) * 0.5 : -1, n = Math.hypot(dx, dy) || 1, ux = dx / n, uy = dy / n;
    const fuerza = Math.min(0.2, i.f * 0.24);
    if (fuerza >= 0.03) {
      const mx = q.ax, my = q.ay * 0.55, ext = Math.max(q.w, q.h) * 0.6;
      const g = gctx.createLinearGradient(mx + ux * ext, my + uy * ext - (i.l.h > 30 ? ext * 0.3 : 0), mx - ux * ext, my - uy * ext);
      g.addColorStop(0, hex(i.l.c, 1)); g.addColorStop(0.3, hex(i.l.c, 0.25)); g.addColorStop(0.5, hex(i.l.c, 0));
      if (silueta(q, g)) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fuerza; ctx.drawImage(tmp, 0, 0, q.w, q.h, px - q.ax * esc, py - q.ay * esc, q.w * esc, q.h * esc); ctx.restore(); }
    }
    // (más fuerte cuando la luz viene de un costado; las figuras flacas, como un esqueleto, son casi todo borde: con la
    // luz encima o detrás el filo las contorneaba enteras como un fantasma, así que ahí baja)
    const flaca = (() => { const a = q.w * q.h; return a > 0 ? Math.min(1, (q.w * 0.5) / Math.max(1, q.h * 0.42)) : 1; })();
    const filo = Math.min(0.6, i.f * 0.8) * (0.3 + 0.7 * Math.abs(ux)) * (0.55 + 0.45 * flaca) * (((window as any).__filoK as number | undefined) ?? 1); // (__filoK: las películas lo bajan en un plano cerrado)
    if ((window as any).__sinFilo || filo < 0.06 || !silueta(q, `rgb(${Math.min(255, i.l.c[0] + 40)},${Math.min(255, i.l.c[1] + 30)},${Math.min(255, i.l.c[2] + 20)})`)) continue;
    // lo que queda de la silueta después de restarle ella misma corrida hacia la luz es el canto que la mira
    const k = Math.max(1, Math.round(1.6 / Math.max(0.5, esc)));
    tctx.globalCompositeOperation = 'destination-out'; tctx.drawImage(q.img, q.x, q.y, q.w, q.h, Math.round(-ux * k), Math.round(-uy * k), q.w, q.h); tctx.globalCompositeOperation = 'source-over';
    const su = ctx.imageSmoothingEnabled; ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = filo;
    ctx.drawImage(tmp, 0, 0, q.w, q.h, px - q.ax * esc, py - q.ay * esc, q.w * esc, q.h * esc); ctx.restore(); ctx.imageSmoothingEnabled = su;
  }
}

/** La luz que el umbral derrama en el piso: cálida de siempre, mezclada con el color de su rumbo (brasa baja, azul sube). */
function luzSalida(desde: string, destino: string): [number, number, number] {
  if ((window as any).__sinRumbos) return [255, 180, 95];
  const r = rumboSalida(desde, destino); if (r === 'region' || r === 'campamento' || r === 'casa') return [255, 180, 95];
  const c = COLOR_RUMBO[r]; return [(255 + c[0] * 2) / 3 | 0, (180 + c[1] * 2) / 3 | 0, (95 + c[2] * 2) / 3 | 0];
}
