// El acto 7 termina en un final, no en un cartel, y lleva dos películas (ver ui/director.ts):
// - 7a «La Corona tibia» (`CINE_ACTO7`, al caer Aun-Saar): cae (sus aros de halos se rompen en esquirlas y el oro de las grietas del
//   piso se apaga), la Corona (`cine_corona`) rueda de canto a ×4 hasta los pies del héroe, la gloria de la Escalera se apaga en cuatro
//   etapas (`cine_escalera`) y la Marca late o queda gris. Vuelve al juego (la Corona se lleva al campamento).
// - 7b «El final» (`guionFinal`, al entregar la Corona): los cuatro finales (Vigilia, Cielo Abierto, Rey de Ceniza, Corona Fría), una
//   toma por línea de `EPILOGOS` que dura lo que tarda en leerse, la de Vigdis y los ecos antes de la última, y el título del final
//   con «Fin» en la letra gótica con brasa (escarcha en la Corona Fría). Sin líneas nuevas. Cuerpos de película: cine_auren,
//   cine_monje, cine_vigdis y cine_mira (hornear_extra.ts). Ojo: el piso de vidrio de a7_campamento se pinta encima de las figuras;
//   las tomas de Auren y Mira van al pie de la Escalera apagada (a7_jardin).
// Canon: CLAUDE.md, "Historia y canon".
import { ctx, W, H } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { objetoMeta, dibujar } from '../motor/assets';
import { libreCerca, type Zona } from '../mundo/zona';
import { finalDe } from '../juego/historia';
import { IDI } from './comun';
import type { DatosHeroe } from '../juego/heroe';
import { EPILOGOS, type Final } from '../mundo/decisiones';
import { dibujarRostro, rostroListo } from './cine_rostro';
import { type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, anclaJefe, anclaSalida, despejarPiezas, despejarPies, vez, ceniza, columnaDe, latido, tituloGotico } from './cine_kit';
import { anclaFachada, anclaCamino } from './cine_acto1';
import { nievePiso, anclaPuertaFortin } from './cine_acto4';
import { bocaPecho } from './cine_acto6';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(7, n, t0, t1, o);
const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ------------------------------------------------------------------ la Corona
/** La Corona en las manos (la pieza horneada, echada), a `z` puntos del dibujo sobre el piso y con `k` de alfa: lo que se da. */
function coronaEnMano(x: number, y: number, z: number, k: number, esc = 0.7) {
  const q = objetoMeta('cine_corona', 't1')?.f[0]; if (!q || k <= 0) return;
  const [px, py] = aPant(x, y);
  // (a escala de la mano: la pieza es la del piso, grande para el ×4; puesta en la cabeza, a la mitad)
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = k; ctx.translate(Math.round(px), Math.round(py - z)); ctx.scale(esc, esc);
  // (en el aire no lleva la sombra horneada del piso: se corta lo que queda por debajo de su apoyo)
  ctx.beginPath(); ctx.rect(-q.ax - 2, -q.ay - 2, q.w + 4, q.ay + 3); ctx.clip(); dibujar(ctx, q, 0, 0); ctx.restore();
}
// ------------------------------------------------------------------ 7a: la Corona tibia
const HX = 2.6, HY = -0.9, PIES: [number, number] = [HX - 1.0, HY + 0.9];
const trono = { zona: 'a7_trono', ancla: anclaJefe } as const;
const CORONAS = ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 't0', 't1', 't2', 't3', 'echada'].map((v) => 'cine_corona|' + v);

/**
 * Las grietas de oro del piso del ruedo: tramos rectos quebrados que salen del cuerpo (a pixel, en lo plano del piso), con el oro
 * vivo en el alma y el canto oscuro. Mientras el dios vive laten; desde `t0` se apagan de afuera hacia adentro (cada tramo según
 * lo lejos que queda) hasta quedar como rajaduras oscuras de oro seco.
 */
interface Grieta { pts: [number, number][]; g: number }
let grietasRuedo: Grieta[] | null = null;
function armarGrietasRuedo(): Grieta[] {
  const R: Grieta[] = []; let sem = 31;
  const rnd = () => { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; };
  const crecer = (x: number, y: number, an: number, n: number, g: number, nivel: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < n; i++) {
      // (el rumbo se quiebra en ángulo en cada tramo, nunca curva)
      an += (rnd() < 0.5 ? -1 : 1) * (0.25 + rnd() * 0.45); const L = 0.35 + rnd() * 0.5; x += Math.cos(an) * L; y += Math.sin(an) * L; pts.push([x, y]);
      if (nivel < 1 && rnd() < 0.3) crecer(x, y, an + (rnd() < 0.5 ? -1 : 1) * (0.7 + rnd() * 0.5), 2 + Math.floor(rnd() * 3), Math.max(1, g - 1), nivel + 1);
    }
    R.push({ pts, g });
  };
  for (let i = 0; i < 9; i++) crecer(Math.cos(i * 0.7) * 0.6, Math.sin(i * 0.7) * 0.6, (i / 9) * Math.PI * 2 + (rnd() - 0.5) * 0.5, 6 + Math.floor(rnd() * 5), 2, 0);
  return R;
}
function grietasOro(e: EstadoToma, tl: number, t0: number) {
  const Gs = (grietasRuedo ??= armarGrietasRuedo()), D = 5.2;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const gr of Gs) {
    for (let i = 1; i < gr.pts.length; i++) {
      const [x0, y0] = gr.pts[i - 1], [x1, y1] = gr.pts[i], d = Math.hypot(x1, y1);
      // (se apaga de afuera hacia adentro: lo lejano primero)
      const ta = t0 + Math.max(0, 1 - d / D) * 2.6, k = tl < t0 ? 0.75 + 0.25 * Math.sin(tl * 3 + d) : Math.max(0, 1 - (tl - ta) / 0.9);
      const [ax, ay] = aPant(e.ax + x0, e.ay + y0), [bx, by] = aPant(e.ax + x1, e.ay + y1), L = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
      const w = d < 2.4 ? gr.g : 1;
      for (let s2 = 0; s2 <= L; s2++) {
        const X = Math.round(ax + (bx - ax) * s2 / L), Y = Math.round(ay + (by - ay) * s2 / L);
        ctx.globalAlpha = 0.85; ctx.fillStyle = '#120a04'; ctx.fillRect(X, Y, w + 1, w);
        if (k > 0.02) { ctx.globalAlpha = k; ctx.fillStyle = k > 0.6 ? '#ffd27a' : k > 0.3 ? '#d89a3a' : '#8a5a1c'; ctx.fillRect(X, Y, w, 1); if (w > 1 && k > 0.5) { ctx.fillStyle = '#fff0c0'; ctx.fillRect(X, Y, 1, 1); } }
        else { ctx.globalAlpha = 0.7; ctx.fillStyle = '#3a2810'; ctx.fillRect(X, Y, 1, 1); }
      }
    }
  }
  ctx.restore();
  // (su luz: baja con ellas)
  const Ls = (e.j as any)?.lucesCine as any[] | undefined;
  if (Ls) { const k = tl < t0 ? 0.6 : Math.max(0, 0.6 * (1 - (tl - t0) / 2.8)); if (k > 0.01) Ls.push({ id: 'grietas', x: e.ax + 0.3, y: e.ay + 0.3, z: 6, r: 220, c: [255, 190, 90], k, sinSombra: true }); }
}

/** La Corona en la copia de la zona (una pieza que se mueve: va con la luz y el orden del mundo). */
function coronaObj(e: EstadoToma): any {
  const z: any = e.z; if (!z) return {};
  const o = (z.cineCorona ??= { id: 'cine_corona', v: 'r0', cx: 0, cy: 0, hw: 0, hh: 0, bloquea: false, capa: 'cine' });
  if (!z.objetos.includes(o)) z.objetos.push(o);
  return o;
}
/** Dónde va la Corona: sale del cuerpo, rueda de canto en un arco hasta los pies del héroe, frena tambaleando y se echa. */
const C0: [number, number] = [0.9, 0.5];
function coronaEn(tl: number): { x: number; y: number; v: string; rueda: boolean } {
  const u = Math.min(1, Math.max(0, (tl - 0.6) / 3.4)), s = 1 - (1 - u) ** 2.2;
  const x = C0[0] + (PIES[0] + 0.5 - C0[0]) * s + Math.sin(s * Math.PI) * 0.5, y = C0[1] + (PIES[1] + 0.4 - C0[1]) * s - Math.sin(s * Math.PI) * 0.7;
  if (u < 1) {
    // (el giro sobre su eje: lo rodado entre el radio; ocho pasos cada 60 grados)
    const rod = Math.hypot(PIES[0] + 0.5 - C0[0], PIES[1] + 0.4 - C0[1]) * 1.25 * s, gr = (rod * 16 / 8.3) * (180 / Math.PI);
    return { x, y, v: 'r' + (Math.floor(gr / 7.5) % 8), rueda: true };
  }
  // tambalea: se echa de a poco, vuelve a levantarse un poco y cae del todo
  const w = tl - 4.0, sec = ['t0', 't1', 't0', 't1', 't2', 't1', 't2', 't3', 'echada'], i = Math.min(sec.length - 1, Math.floor(w / 0.11));
  return { x, y, v: sec[i], rueda: false };
}
/** El destello que corre por el oro (una estrella de pixel) y el brillo tibio que late lento y se apaga. */
function brilloCorona(e: EstadoToma, tl: number, x: number, y: number) {
  const [px, py] = aPant(x, y), cy = py - 11, fase = (tl * 0.9) % 2.2;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (fase < 0.5) {
    const k = Math.sin((fase / 0.5) * Math.PI), sx = Math.round(px - 8 + fase * 34), sy = Math.round(cy - 6 + fase * 6), L = Math.round(2 + k * 5);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k;
    ctx.fillStyle = '#fff4c8'; ctx.fillRect(sx - L, sy, L * 2 + 1, 1); ctx.fillRect(sx, sy - L, 1, L * 2 + 1);
    ctx.fillStyle = '#ffd27a'; ctx.fillRect(sx - 1, sy - 1, 3, 3);
  }
  // (tibia: un halo cálido muy chico que late lento)
  const lat = 0.5 + 0.5 * Math.sin(tl * 2.2), k2 = 0.22 * lat * Math.max(0.3, 1 - Math.max(0, tl - 5) / 3);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
  const g = ctx.createRadialGradient(px, cy, 0, px, cy, 22); g.addColorStop(0, `rgba(255,190,110,${k2})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(px - 22, cy - 22, 44, 44);
  ctx.restore();
  void e;
}
/** El vaho tibio que sube de la Corona: hilos que suben, se tuercen y se deshacen. */
function vahoTibio(e: EstadoToma, x: number, y: number, dt: number) {
  if (!e.j) return;
  if (Math.random() < dt * 22) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 0.5, y: y + (Math.random() - 0.5) * 0.5, z: 8 + Math.random() * 4, vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15, vz: 7 + Math.random() * 6, t: 0, dur: 1.8 + Math.random(), color: Math.random() < 0.5 ? '#cfc4b0' : '#9c9282', tam: 1, grav: -1.5, tipo: 'humo' } as any);
}
/** La escalera que se apaga: cada pieza del monumento con sus cuatro etapas encima (v1, v2, v3 y apagada) que se funden. */
const ETAPAS = ['v1', 'v2', 'v3', 'apagada'];
function prepararEscalera(e: EstadoToma) {
  const z = e.z; if (!z) return;
  // (la toma se monta otra vez al saltar: las etapas se ponen una sola vez en la copia de la zona)
  if ((z as any).cineEscalera) { e.mem.escalera = (z as any).cineEscalera; return; }
  despejarPiezas(z, 'a7_escaleras');
  const sa = z.salidas.find((q) => q.destino === 'a7_escaleras'); if (!sa?.piezas) return;
  const base = sa.piezas.filter((o) => o.id.startsWith('mon_escalera_')), extra: any[] = [];
  for (const o of base) for (const v of ETAPAS) { const n = { ...o, id: o.id.replace('mon_escalera_', 'cine_escalera_'), v, alfaCine: 0 }; extra.push(n); const i = z.objetos.indexOf(o); z.objetos.splice(i + 1 + ETAPAS.indexOf(v), 0, n as any); }
  // (también anclas: van enteras, no en franjas)
  sa.piezas.unshift(...extra);
  e.mem.escalera = (z as any).cineEscalera = { base, extra };
}
/** u de 0 (viva) a 1 (apagada): cada etapa entra encima de la anterior y la de abajo se va cuando la tapa entera. */
function apagarEscalera(e: EstadoToma, u: number) {
  const m = e.mem.escalera; if (!m) return;
  const f = u * ETAPAS.length;
  for (const o of m.extra) { const k = ETAPAS.indexOf(o.v), a = Math.min(1, Math.max(0, f - k)); o.alfaCine = a; }
  for (const o of m.extra) { const k = ETAPAS.indexOf(o.v); if (f - (k + 1) >= 1) o.alfaCine = 0; }
  for (const o of m.base) (o as any).alfaCine = f >= 1 ? 0 : 1;
}
const ESCALERA = ['atras', 'atras_i', 'atras_d', 'medio', 'izq', 'der'].flatMap((fr) => ETAPAS.map((v) => `cine_escalera_${fr}|${v}`));
const tomas: Toma[] = [
  {
    // Aun-Saar cae: el golpe corta a ×3, su muerte horneada a cámara lenta; la boca del pecho se cierra mientras se dobla
    id: 'cae', dur: 10, ...trono, entra: 1.4, sale: 0.4, oscuridad: 0.86, hundir: 0.62,
    cam: [{ t: 0, x: 3.2, y: 1.4, alt: 90, zoom: 2, fy: 0.55 }, { t: 3.05, x: 2.2, y: 0.6, alt: 92, c: 'suave' }, { t: 3.06, x: 1.2, y: -0.2, alt: 80, zoom: 3, fy: 0.52 }, { t: 9.6, x: 1.0, y: -0.2, alt: 56, c: 'suave' }],
    actores: [
      { id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.5, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.36 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX + 1.3, y: HY + 0.5, mira: [0, 0] }, { t: 2.2, x: HX + 1.3, y: HY + 0.5 }, { t: 3.0, x: HX, y: HY, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'aun', z: 90, r: 240 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'oro', color: [240, 190, 100], sombra: true, claves: [{ t: 0, x: 0.5, y: 0.5, z: 260, r: 300, k: 0.8 }, { t: 5.5, k: 0.8 }, { t: 9.5, k: 0.2, c: 'suave' }] },
      { id: 'frio', color: [140, 140, 170], claves: [{ t: 0, x: 2, y: 2, z: 160, r: 320, k: 0.25 }] },
    ],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true, tono: 0.55 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.7 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.8, id: 'golpe', cine: true }, { t: 5.8, id: 'sub', cine: true }],
    temblores: [[5.8, 0.7, 4]],
    // el oro de las grietas del piso: late mientras vive y se apaga de afuera hacia adentro cuando cae
    suelo: (e, tl) => grietasOro(e, tl, 5.6),
    // (la boca abierta mientras está de pie; se cierra mientras se dobla; ya caído no va)
    mundo: (e, tl) => { if (tl < 4.3) bocaPecho(e, tl < 3.55 ? 1 : Math.max(0, 1 - (tl - 3.55) / 0.7), tl); },
    paso: (e, tl, dt) => { if (e.j && tl > 5.8 && Math.random() < dt * 30) ceniza(e.j, e.ax, e.ay, 1, '#9a8a6a'); },
  },
  {
    // la Corona rueda (×4): se suelta de los trozos, rueda de canto con su sombra hasta los pies del héroe, tambalea y se echa;
    // humea, tibia, y el oro destella
    id: 'corona', dur: 8, ...trono, objetos: CORONAS, entra: 0.3, sale: 0.5, oscuridad: 0.9, hundir: 0.66, sinBruma: true,
    preparar: (e) => { despejarPies(e, PIES[0] + 0.5, PIES[1] + 0.4, 1.2); despejarPies(e, 1.6, 0.1, 1.0); coronaObj(e); },
    cam: [{ t: 0, x: C0[0] + 0.2, y: C0[1] - 0.1, alt: 14, zoom: 4, fy: 0.6 }, { t: 4.2, x: PIES[0] + 0.3, y: PIES[1] + 0.3, alt: 16, c: 'suave' }, { t: 8, x: PIES[0] + 0.35, y: PIES[1] + 0.25, alt: 18, c: 'suave' }],
    actores: [
      { id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [0, 0] }, { t: 3.8, mira: [PIES[0] + 0.5, PIES[1] + 0.9] }] },
    ],
    focos: [{ de: [PIES[0] + 0.5, PIES[1] + 0.4], z: 8, r: 120 }, { de: 'heroe', z: 30, r: 110, k: 0.7 }],
    luces: [
      { id: 'tibia', color: [255, 196, 120], sombra: true, claves: [{ t: 0, x: C0[0], y: C0[1], z: 18, r: 90, k: 0.6 }, { t: 4, x: PIES[0] + 0.5, y: PIES[1] + 0.4, c: 'sale' }, { t: 8, k: 0.4 }] },
      { id: 'arriba', color: [210, 180, 130], sombra: true, claves: [{ t: 0, x: -1.5, y: -1.5, z: 160, r: 260, k: 0.45 }] },
    ],
    sonidos: [{ t: 0.6, id: 'rueda', cine: true, tono: 1.6, vol: 0.8 }, { t: 4.05, id: 'golpe_metal', vol: 0.35, tono: 1.8 }, { t: 4.5, id: 'golpe_metal', vol: 0.25, tono: 2.1 }, { t: 4.9, id: 'golpe_metal', vol: 0.4, tono: 1.6 }, ...[5.4, 6.6].map((t) => ({ t, id: 'latido', cine: true, vol: 0.5 }))],
    paso: (e, tl, dt) => {
      const o = coronaObj(e), c = coronaEn(tl); o.cx = e.ax + c.x - 0.5; o.cy = e.ay + c.y - 0.5; o.v = c.v; e.mem.corona = [e.ax + c.x, e.ay + c.y];
      // (al rodar levanta polvo dorado del piso; quieta, humea)
      if (e.j && c.rueda && Math.random() < dt * 18) e.j.particulas.push({ x: e.ax + c.x, y: e.ay + c.y, z: 1, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: 6 + Math.random() * 8, t: 0, dur: 0.7, color: '#a08860', tam: 1, grav: 20, tipo: 'ceniza' } as any);
      if (tl > 3.2) vahoTibio(e, e.ax + c.x, e.ay + c.y, dt);
    },
    mundo: (e, tl) => { const c = e.mem.corona; if (c) brilloCorona(e, tl, c[0], c[1]); },
    textos: [L(0, 4.4, 7.9)],
  },
  {
    // el cielo callado: la gloria de la Escalera al Trono se apaga de verdad (el haz se adelgaza y se va, las losas que flotaban
    // caen al estrado, el oro se seca y la luz se va a gris); cae ceniza quieta; solo viento
    id: 'callado', dur: 9, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), objetos: ESCALERA, entra: 0.8, sale: 1.0, oscuridad: 0.6, hundir: 0.4, lucesZona: 1,
    preparar: prepararEscalera,
    cam: [{ t: 0, x: 3, y: 3, alt: 560, zoom: 0.6, fy: 0.5 }, { t: 9, x: 3.6, y: 3.6, alt: 470, c: 'suave' }],
    focos: [{ de: [-4, -4], z: 500, r: 520, k: 0.6 }],
    luces: [{ id: 'gloria', color: [255, 220, 150], claves: [{ t: 0, x: -4, y: -4, z: 700, r: 1200, k: 0.9 }, { t: 1.2, k: 0.9 }, { t: 7, k: 0.04, c: 'suave' }] }, { id: 'gris', color: [150, 152, 160], claves: [{ t: 0, x: 0, y: 0, z: 600, r: 1400, k: 0 }, { t: 7.5, k: 0.4, c: 'suave' }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.6, tono: 0.8 }, ...[2.2, 3.1, 3.9, 4.6, 5.4].map((t, i) => ({ t, id: 'golpe', vol: 0.5 - i * 0.06, tono: 0.7 + i * 0.05 }))],
    temblores: [[2.2, 0.3, 1], [3.9, 0.3, 1], [5.4, 0.4, 1]],
    paso: (e, tl, dt) => {
      const u = Math.min(1, Math.max(0, (tl - 1.2) / 5.6)); apagarEscalera(e, u);
      if (!e.j) return; (e.j as any).lucesZonaCine = Math.max(0.05, 1 - u);
      if (Math.random() < dt * 30) e.j.particulas.push({ x: e.ax - 6 + (Math.random() - 0.5) * 14, y: e.ay - 6 + (Math.random() - 0.5) * 14, z: 200 + Math.random() * 300, vx: 0, vy: 0, vz: -14, t: 0, dur: 5, color: '#8a8478', tam: 1.4, grav: 0, tipo: 'ceniza' } as any);
      // (polvo de mármol donde caen las losas)
      if (u > 0.1 && u < 0.95 && Math.random() < dt * 40) { const a = Math.random() * Math.PI * 2, r = 4 + Math.random() * 6; e.j.particulas.push({ x: e.ax - 4 + Math.cos(a) * r, y: e.ay - 4 + Math.sin(a) * r, z: 2, vx: Math.cos(a) * 0.6, vy: Math.sin(a) * 0.6, vz: 10 + Math.random() * 14, t: 0, dur: 1.6, color: '#c8c0b0', tam: 2, grav: 4, tipo: 'humo' } as any); }
    },
    textos: [L(1, 1.6, 8.6)],
  },
  {
    // el primer plano: la Marca late roja si bebió la Brasa; si la apagó, queda gris y quieta
    id: 'rostro', dur: 6, entra: 0.2, sale: 1.6,
    omitir: (e) => !rostroListo(e.heroe),
    sonidos: [{ t: 0.4, id: 'latido', cine: true, vol: 1.2 }, { t: 1.5, id: 'latido', cine: true, vol: 1 }, { t: 2.6, id: 'latido', cine: true, vol: 0.8 }],
    pantalla: (e, tl) => { ctx.save(); ctx.fillStyle = '#030202'; ctx.fillRect(0, 0, W, H); ctx.restore(); dibujarRostro(e.heroe, tl, finalDe(e.heroe) === 'destruir' ? 0 : latido(tl), Math.min(1, tl / 1)); },
  },
];
export const CINE_ACTO7: Guion = { id: 'acto7', acto: 7, tomas };

// ------------------------------------------------------------------ 7b: los finales
/** Un texto del epílogo (español e inglés), de t0 a t1. */
const T1 = (par: [string, string], t0: number, t1: number, o: Partial<Texto> = {}): Texto => ({ t0, t1, es: par[0], en: par[1], ...o });
/** Parte un texto en `n` trozos por sus frases (o por comas, si una frase sola no entra), lo más parejos posible. */
function trozos(s: string, n: number): string[] {
  if (n <= 1) return [s];
  let fr = s.match(/[^.!?]+[.!?]+/g)?.map((x) => x.trim()) ?? [s];
  if (fr.length < n) fr = s.match(/[^,.!?]+[,.!?]+/g)?.map((x) => x.trim()) ?? [s];
  if (fr.length < n) return [s];
  const out: string[] = []; let a = '', resto = s.length;
  for (let i = 0; i < fr.length; i++) {
    const quedan = n - out.length, meta = resto / quedan;
    if (a && (a.length + fr[i].length / 2 > meta) && fr.length - i >= quedan - 1 && quedan > 1) { out.push(a); resto -= a.length; a = ''; }
    a = a ? a + ' ' + fr[i] : fr[i];
  }
  if (a) out.push(a);
  return out;
}
/** Lo que entra en la franja: dos renglones de unas 46 letras. */
const CABE = 88;
/** Un texto del epílogo (español e inglés), de t0 a t1; si no entra en dos renglones va en partes seguidas, por sus frases. */
function T(par: [string, string], t0: number, t1: number, o: Partial<Texto> = {}): Texto[] {
  const n = Math.max(Math.ceil(par[0].length / CABE), Math.ceil(par[1].length / (CABE + 8)));
  const es = trozos(par[0], n), en = trozos(par[1], n), m = Math.min(es.length, en.length);
  if (m < 2) return [T1(par, t0, t1, o)];
  // (si uno de los dos idiomas se partió en menos trozos, el resto va junto en el último)
  const E = [...es.slice(0, m - 1), es.slice(m - 1).join(' ')], N = [...en.slice(0, m - 1), en.slice(m - 1).join(' ')];
  const tot = E.reduce((q, x) => q + x.length, 0); let t = t0; const r: Texto[] = [];
  E.forEach((x, i) => { const d = (t1 - t0) * (x.length / tot); r.push(T1([x, N[i]], i ? t + 0.12 : t, i < m - 1 ? t + d - 0.12 : t1, o)); t += d; });
  return r;
}
/** El corro de los doce monjes alrededor de la boca (relativo a la boca): un anillo abierto con un hueco hacia la cámara. */
const MONJES: [number, number][] = Array.from({ length: 12 }, (_, i) => { const an = Math.PI * 0.25 + 0.42 + (i / 11) * (Math.PI * 2 - 0.84), r = 4.3 + (i % 2) * 0.6; return [Math.cos(an) * r, Math.sin(an) * r]; });
/** La fogata del Refugio (la del campamento). */
const anclaFogata = (z: Zona): [number, number] => { const o = z.objetos.find((q) => /camp_fogata/.test(q.id)); if (o) return [o.cx + 0.5, o.cy + 0.5]; const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };
// eslint-disable-next-line
export const anclaCentro = (z: Zona): [number, number] => { const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };
/** Una toma del Refugio junto al fuego (los ecos y la última línea de la Vigilia). */
function tomaFuego(id: string, dur: number, textos: Texto[], fuegoMira = true): Toma {
  return {
    id, dur, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.8, sale: 0.8, oscuridad: 0.86, hundir: 0.6, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; despejarPies(e, 2.2, -0.8, 1.3); despejarPies(e, -1.0, 1.9, 1.3); despejarPies(e, -2.0, -0.7, 1.2); },
    cam: [{ t: 0, x: 0.5, y: 0.5, alt: 24, zoom: 3, fy: 0.58 }, { t: dur, x: 0.4, y: 0.4, alt: 27, c: 'suave' }],
    // la ronda alrededor del fuego: el héroe a la derecha, Odrán a la izquierda y Thor echado detrás, el fuego en el medio
    actores: [
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.2, y: -0.8, mira: [0, 0] }] },
      { id: 'odran', tipo: 'sprite', sprite: 'odran', claves: [{ t: 0, x: -1.0, y: 1.9, mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: -2.0, y: -0.7, mira: [0, 0] }] },
    ],
    focos: [{ de: [0, 0], z: 14, r: 190 }],
    // (la luz cálida desde abajo, a la altura de las brasas; la llama quieta, que ya no mira: sin titilar)
    luces: [{ id: 'fuego', color: [255, 150, 70], sombra: true, titila: fuegoMira ? 0.12 : 0.02, claves: [{ t: 0, x: 0, y: 0, z: 9, r: 210, k: 1 }] }, { id: 'noche', color: [90, 100, 140], claves: [{ t: 0, x: -3, y: -3, z: 300, r: 600, k: 0.12 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.3, tono: 0.7 }],
    textos,
  };
}
/** Lo que tarda en leerse una línea del epílogo (unas 16 letras por segundo y el respiro de la toma). */
const leer = (par: [string, string], min = 8) => Math.max(min, Math.round((Math.max(par[0].length, par[1].length * 0.95) / 16 + 2.6) * 2) / 2);
/** Estira una toma a `D` segundos: todas sus claves, sonidos, temblores y textos en la misma proporción. */
function estirar(tm: Toma, D: number): Toma {
  const f = D / tm.dur; if (Math.abs(f - 1) < 0.01) return tm;
  const k = <K extends { t: number }>(l?: K[]) => l?.map((c) => ({ ...c, t: c.t * f }));
  return {
    ...tm, dur: D, cam: k(tm.cam), actores: tm.actores?.map((a) => ({ ...a, claves: k(a.claves)! })), luces: tm.luces?.map((l) => ({ ...l, claves: k(l.claves)! })), brasa: k(tm.brasa),
    sonidos: k(tm.sonidos), temblores: tm.temblores?.map(([a, b, c]) => [a * f, b * f, c] as [number, number, number]), textos: tm.textos?.map((x) => ({ ...x, t0: x.t0 * f, t1: x.t1 * f })),
    paso: tm.paso && ((e, tl, dt) => tm.paso!(e, tl / f, dt)), mundo: tm.mundo && ((e, tl, dt) => tm.mundo!(e, tl / f, dt)), suelo: tm.suelo && ((e, tl, dt) => tm.suelo!(e, tl / f, dt)), pantalla: tm.pantalla && ((e, tl, dt) => tm.pantalla!(e, tl / f, dt)),
  };
}
/** El título del final y «Fin», en la letra gótica con su brasa (o su escarcha en la Corona Fría). */
function tituloFin(tl: number, par: [string, string], frio: boolean) { tituloGotico((IDI ? par[1] : par[0]).toUpperCase(), IDI ? 'The End' : 'Fin', tl, 8, frio ? 'escarcha' : 'brasa'); }
/** La línea de Vigdis: salvada llega al Refugio con el deshielo y nieve en el pelo; entregada, su tumba en el Fortín amanece limpia. */
function tomaVigdis(par: [string, string], salvada: boolean): Toma {
  if (salvada) return {
    id: 'vigdis', dur: 8, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.6, sale: 0.6, oscuridad: 0.7, hundir: 0.55, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; despejarPies(e, 3, -2, 3); },
    cam: [{ t: 0, x: 2.2, y: -1.0, alt: 34, zoom: 3, fy: 0.58 }, { t: 8, x: 1.8, y: -0.4, alt: 34, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'cine_vigdis', claves: [{ t: 0, x: 4.5, y: -3.5, dir: 'so' }, { t: 5, x: 2.0, y: -0.6, c: 'sale' }, { t: 8, dir: 's' }] }],
    focos: [{ de: 'vigdis', z: 30, r: 150 }],
    luces: [{ id: 'fuego', color: [255, 160, 80], sombra: true, titila: 0.1, claves: [{ t: 0, x: 0, y: 0, z: 20, r: 220, k: 0.9 }] }, { id: 'alba', color: [170, 180, 210], claves: [{ t: 0, x: 4, y: -4, z: 300, r: 600, k: 0.3 }] }],
    sonidos: [{ t: 0.3, id: 'nana', cine: true }],
    paso: (e, tl, dt) => { const m = e.actores.get('vigdis') as any; if (e.j && m && Math.random() < dt * 10) e.j.particulas.push({ x: m.x + (Math.random() - 0.5) * 0.5, y: m.y + (Math.random() - 0.5) * 0.5, z: 30 + Math.random() * 10, vx: 0, vy: 0, vz: -8, t: 0, dur: 1.4, color: '#e8eef4', tam: 1, grav: 10, tipo: 'ceniza' } as any); void tl; },
    textos: T(par, 0.8, 7.8),
  };
  return {
    id: 'vigdis', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, objetos: ['cem_lapida_cruz|intacta'], entra: 0.6, sale: 0.6, oscuridad: 0.75, hundir: 0.6, sinBruma: true, sinClima: ['fx_ventisca', 'fx_niebla'],
    preparar: (e) => { despejarPies(e, 1.5, 2.5, 5); if (e.z && !e.z.objetos.some((o) => o.capa === 'cine')) e.z.objetos.push({ id: 'cem_lapida_cruz', v: 'intacta', cx: Math.floor(e.ax), cy: Math.floor(e.ay), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); },
    cam: [{ t: 0, x: 1.0, y: 1.3, alt: 30, zoom: 3, fy: 0.6 }, { t: 8, x: 0.7, y: 1.0, alt: 36, c: 'suave' }],
    focos: [{ de: [0.3, 0.6], z: 10, r: 140 }],
    luces: [{ id: 'alba', color: [200, 190, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.35 }] }, { id: 'tibia', color: [255, 190, 130], claves: [{ t: 0, x: 0.4, y: 0.8, z: 6, r: 90, k: 0.45 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.4 }],
    suelo: (e) => nievePiso(e, 15),
    // (la piedra limpia en medio de la nieve: un charco tibio a su pie)
    paso: (e) => vez(e, 'charco', 0, 0, () => { if (e.j) e.j.manchas.push({ x: e.ax + 0.4, y: e.ay + 0.8, r: 0.9, rmax: 1.1, color: '#5a6270', t: 0, tipo: 'hielo', forma: 'charco', sem: 2 } as any); }),
    textos: T(par, 0.8, 7.8),
  };
}

/** La Vigilia: Auren recibe la Corona, los monjes cantan sobre la cripta nueva de Santa Oria, la abadía vela, y el Refugio. */
function vigilia(d: DatosHeroe, vigdis: string | undefined, ecos: [string, string][]): Toma[] {
  const ep = EPILOGOS.vigilia, l = ep.lineas;
  const ts: Toma[] = [
    {
      // el héroe pone la Corona en manos de Auren; él no la mira, la envuelve en su manto oscuro contra el pecho, se da vuelta y se
      // va hacia la escalera (el héroe en primer término, ×3)
      // (al pie de la Escalera al Trono ya apagada: Auren baja por la boca de la escalinata)
      id: 'auren', dur: 10, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), objetos: ['cine_corona|t1', ...ESCALERA], entra: 1.0, sale: 0.8, oscuridad: 0.78, hundir: 0.6, sinBruma: true, lucesZona: 0.15,
      preparar: (e) => { prepararEscalera(e); apagarEscalera(e, 1); despejarPies(e, 2.6, 2.6, 2.6); },
      cam: [{ t: 0, x: 2.8, y: 2.8, alt: 34, zoom: 3, fy: 0.6 }, { t: 10, x: 1.8, y: 1.9, alt: 42, c: 'suave' }],
      actores: [
        { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 4.3, y: 1.9, mira: [1.6, 2.9] }, { t: 6, mira: [0.2, 0.2] }] },
        { id: 'auren', tipo: 'sprite', sprite: 'cine_auren', claves: [{ t: 0, x: 1.6, y: 2.9, mira: [4.3, 1.9], alfa: 1 }, { t: 4.6, x: 1.6, y: 2.9, dir: 'n' }, { t: 5.4, x: 1.6, y: 2.9, dir: 'no', alfa: 1 }, { t: 9.2, x: -0.4, y: 2.2, c: 'lineal', alfa: 1 }, { t: 9.9, alfa: 0 }] },
      ],
      focos: [{ de: 'heroe', z: 30, r: 120 }, { de: 'auren', z: 36, r: 130 }],
      luces: [
        // (la luz tibia del campamento, de costado; y la de Auren: el oro de su coraza que devuelve la luz, sin quemar el blanco)
        { id: 'fogata', color: [255, 170, 100], sombra: true, titila: 0.1, claves: [{ t: 0, x: 4.6, y: 4.0, z: 24, r: 220, k: 0.7 }] },
        { id: 'auren', color: [236, 204, 150], claves: [{ t: 0, x: 2.2, y: 1.7, z: 50, r: 110, k: 0.45 }, { t: 5, k: 0.45 }, { t: 9.6, x: 0.6, y: -0.4, k: 0.2, c: 'lineal' }] },
        { id: 'cielo', color: [120, 130, 170], claves: [{ t: 0, x: -3, y: -3, z: 300, r: 700, k: 0.22 }] },
      ],
      sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.6, vol: 0.5 }],
      // la Corona pasa de las manos del héroe a las de Auren, se hunde en la tela oscura y deja un brillo que se apaga
      mundo: (e, tl) => {
        const h = e.actores.get('heroe') as any, a = e.actores.get('auren') as any; if (!h || !a) return;
        const u = Math.min(1, Math.max(0, (tl - 1.4) / 1.6)), s2 = u * u * (3 - 2 * u), x = h.x + 0.25 + (a.x - 0.2 - h.x - 0.25) * s2, y = h.y - 0.25 + (a.y + 0.2 - h.y + 0.25) * s2;
        coronaEnMano(x, y, 30 + Math.sin(s2 * Math.PI) * 4, 1 - Math.max(0, (tl - 3.4) / 0.8));
        // el bulto: la tela oscura del manto envuelve la Corona contra el pecho (mientras mira hacia acá), con un filo de oro que asoma
        if (tl > 3.0 && !/^n/.test(a.dir)) { const [px, py] = aPant(a.x, a.y), X = Math.round(px + 2), Y = Math.round(py - 33), k = Math.min(1, (tl - 3.0) / 0.5);
          ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = k;
          for (let dy = -4; dy <= 4; dy++) { const w = Math.round(7 * Math.sqrt(1 - (dy / 5) ** 2)); for (let dx = -w; dx <= w; dx++) { const n = (dx * 3 + dy * 5) & 7; ctx.fillStyle = dy < -2 ? '#3a3440' : n === 0 ? '#08060a' : dx + dy < -2 ? '#2a2430' : '#16121a'; ctx.fillRect(X + dx, Y + dy, 1, 1); } }
          ctx.fillStyle = '#0a080c'; ctx.fillRect(X - 6, Y + 1, 12, 1); ctx.fillStyle = '#c89a3a'; ctx.fillRect(X + 3, Y - 1, 2, 1); ctx.fillStyle = '#ffe2a0'; ctx.fillRect(X + 4, Y - 1, 1, 1);
          ctx.restore(); }
        if (tl > 3.2 && tl < 5.5) { const [px, py] = aPant(a.x, a.y), k = Math.sin(((tl - 3.2) / 2.3) * Math.PI) * 0.8; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.fillStyle = '#ffd890'; const gx = Math.round(px - 5), gy = Math.round(py - 34); ctx.fillRect(gx - 2, gy, 5, 1); ctx.fillRect(gx, gy - 2, 1, 5); ctx.restore(); }
      },
      textos: T(l[0], 0.8, 9.6),
    },
    {
      // Santa Oria de noche: la cripta nueva abierta y doce monjes vivos de hábito, cada uno con su vela, en corro alrededor de la
      // boca, cantando por turnos (desde más arriba, para que se vea la boca)
      id: 'cripta', dur: 10, zona: 'a1_cementerio', ancla: anclaFachada, objetos: ['cem_fosa_abierta|vacia'], entra: 0.7, sale: 0.6, oscuridad: 0.88, hundir: 0.66, sinClima: ['fx_lluvia', 'fx_tormenta', 'fx_niebla'], sinBruma: true,
      preparar: (e) => {
        despejarPies(e, 5.5, 5.5, 7.5); const z: any = e.z; if (!z) return; z.lluvia = false; z.niebla = 0;
        if (!z.objetos.some((o: any) => o.capa === 'cine')) z.objetos.push({ id: 'cem_fosa_abierta', v: 'vacia', cx: Math.floor(e.ax + 5), cy: Math.floor(e.ay + 5), hw: 1, hh: 1, bloquea: false, capa: 'cine' });
      },
      cam: [{ t: 0, x: 6.4, y: 6.4, alt: 40, zoom: 2, fy: 0.56 }, { t: 10, x: 6.0, y: 6.0, alt: 48, c: 'suave' }],
      actores: MONJES.map(([x, y], i) => ({ id: 'monje' + i, tipo: 'sprite' as const, sprite: 'cine_monje', sombra: ['#140e0a', 0.6] as [string, number], claves: [{ t: 0, x: 5.5 + x, y: 5.5 + y, mira: [5.5, 5.5] as [number, number] }] })),
      focos: [{ de: [5.5, 5.5], z: 10, r: 250 }], filo: 0.5,
      luces: [{ id: 'fosa', color: [255, 140, 70], sombra: true, titila: 0.06, claves: [{ t: 0, x: 5.5, y: 5.5, z: 4, r: 120, k: 0.4 }] }, { id: 'luna', color: [110, 118, 150], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 800, k: 0.14 }] }],
      sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.5, vol: 0.8 }],
      // cada vela: su luz cálida y chica (con sombra la del medio) y la llama que respira en la mano
      paso: (e, tl) => { const Ls = (e.j as any)?.lucesCine as any[] | undefined; if (!Ls) return; MONJES.forEach(([x, y], i) => { const k = 0.26 + 0.07 * Math.sin(tl * 9 + i * 2.1) + 0.04 * Math.sin(tl * 23 + i); Ls.push({ id: 'vela' + i, x: e.ax + 5.5 + x * 0.9, y: e.ay + 5.5 + y * 0.9, z: 24, r: 44, c: [255, 186, 110], k, sinSombra: i % 3 !== 0 }); }); },
      textos: T(l[1], 0.6, 9.6),
    },
    {
      // la abadía que vela: Santa Oria de lejos, gris, con la luz de las velas en los vitrales; el canto sigue
      id: 'abadia', dur: 8, zona: 'a1_cementerio', ancla: anclaFachada, entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45, sinClima: ['fx_lluvia', 'fx_tormenta'],
      preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; },
      cam: [{ t: 0, x: 10, y: 10, alt: 230, zoom: 0.6, fy: 0.55 }, { t: 8, x: 8, y: 8, alt: 250, c: 'suave' }],
      focos: [{ de: [-4, -4], z: 200, r: 460, k: 0.6 }],
      luces: [{ id: 'gris', color: [150, 155, 170], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.45 }] }, { id: 'velas', color: [255, 190, 110], claves: [{ t: 0, x: -2, y: -2, z: 120, r: 260, k: 0.7 }] }],
      sonidos: [{ t: 0, id: 'organo_pozo', cine: true, tono: 1.2, vol: 0.5 }],
      textos: T(l[2], 0.6, 7.8),
    },
  ];
  ts.forEach((tm, i) => { ts[i] = estirar(tm, leer(l[i])); });
  if (vigdis === 'salvar' || vigdis === 'sacrificar') ts.push(estirar(tomaVigdis(ep.vigdis[vigdis], vigdis === 'salvar'), leer(ep.vigdis[vigdis])));
  // los ecos del viaje: de a uno junto al fuego
  ts.push(...ecosYFin(ecos, l[3], (id, dur, tx) => tomaFuego(id, dur, tx, id === 'ecos'), ep.titulo, false));
  void d;
  return ts;
}

/** Los ecos del viaje (de a uno, con su tiempo de lectura), la última línea y el título del final: la cola de cada película. */
function ecosYFin(ecos: [string, string][], ultima: [string, string], toma: (id: string, dur: number, tx: Texto[]) => Toma, titulo: [string, string], frio: boolean): Toma[] {
  const ts: Toma[] = [];
  if (ecos.length) { let t = 1; const tx: Texto[] = []; for (const par of ecos) { const d = leer(par, 6) - 1.6; tx.push(...T(par, t, t + d)); t += d + 0.6; } ts.push(toma('ecos', t + 0.6, tx)); }
  const D = leer(ultima, 10); ts.push(toma('fuego', D, T(ultima, 1.0, D - 0.6)));
  ts.push({ id: 'titulo', dur: 8, entra: 0, sale: 1.5, sonidos: [{ t: 0.4, id: 'titulo', cine: true }], pantalla: (_e, tl) => tituloFin(tl, titulo, frio) });
  return ts;
}
// ------------------------------------------------------------------ lo común de los otros tres finales
/** El cielo de noche en lo alto del cuadro (el isométrico no mira arriba): se funde con el mundo hacia abajo, con `n` estrellas de
 *  pixel que titilan (las de más, `mas` de 0 a 1, aparecen de a una). En el pase del mundo, como el cielo roto del acto 6. */
function cieloNoche(tl: number, n: number, mas = 0, alto = 0.5, color = '4,6,14') {
  const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const LW = b.x - a.x, LH = (b.y - a.y) * alto;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const g = ctx.createLinearGradient(0, a.y, 0, a.y + LH); g.addColorStop(0, `rgba(${color},1)`); g.addColorStop(0.7, `rgba(${color},0.85)`); g.addColorStop(1, `rgba(${color},0)`); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, LW, LH);
  const tot = n + Math.floor(mas * n * 1.2);
  for (let i = 0; i < tot; i++) {
    const x = a.x + hash(i * 3.1) * LW, f = hash(i * 7.7), y = a.y + f * f * LH * 0.8, nueva = i >= n, k0 = nueva ? Math.min(1, Math.max(0, mas * n * 1.2 - (i - n))) : 1;
    const tit = 0.55 + 0.45 * Math.sin(tl * (1.5 + hash(i) * 3) + i), k = k0 * tit * (1 - f * 0.6); if (k < 0.05) continue;
    const gr = hash(i * 13.3) > 0.8; ctx.globalAlpha = k; ctx.fillStyle = hash(i * 5.5) > 0.7 ? '#ffe8c0' : '#dfe8ff';
    ctx.fillRect(Math.round(x), Math.round(y), gr ? 2 : 1, gr ? 2 : 1);
    if (gr) { ctx.globalAlpha = k * 0.6; ctx.fillRect(Math.round(x) - 1, Math.round(y), 3, 1); ctx.fillRect(Math.round(x), Math.round(y) - 1, 1, 3); }
  }
  ctx.restore();
}
/** Oro que llueve tibio: gotas de pixel que caen del cielo sobre la zona (con su destello). */
function lluviaOro(e: EstadoToma, dt: number, fuerza: number, r = 14) {
  if (!e.j || fuerza <= 0) return;
  for (let i = 0; i < 3; i++) if (Math.random() < dt * 60 * fuerza) e.j.particulas.push({ x: e.ax + (Math.random() - 0.5) * r * 2, y: e.ay + (Math.random() - 0.5) * r * 2, z: 160 + Math.random() * 200, vx: 0.1, vy: 0.1, vz: -70 - Math.random() * 30, t: 0, dur: 4, color: Math.random() < 0.3 ? '#fff0b0' : Math.random() < 0.5 ? '#e8b048' : '#c08a24', tam: 1 + Math.random() * 0.6, grav: 0, tipo: 'ceniza' } as any);
}
/** La Corona puesta: la pieza horneada sobre la cabeza del héroe, que baja desde sus manos a la cabeza entre `t0` y `t1`. */
/** A qué altura (puntos del dibujo) se apoya la Corona puesta: el ancla de la pieza va sobre la coronilla. */
const CABEZA = 75;
function coronaPuesta(e: EstadoToma, tl: number, t0: number, t1: number) {
  const h = e.actores.get('heroe') as any; if (!h || tl < t0 - 1.2) return;
  const u = Math.min(1, Math.max(0, (tl - t0) / (t1 - t0))), s2 = u * u * (3 - 2 * u), z = tl < t0 ? 26 + (tl - t0 + 1.2) * 10 : 38 + 14 * Math.sin(s2 * Math.PI) + s2 * (CABEZA - 38);
  coronaEnMano(h.x + 0.15 * (1 - s2), h.y - 0.15 * (1 - s2), z, Math.min(1, (tl - t0 + 1.2) / 0.4), 0.7 - 0.22 * s2);
}
/** La toma del héroe que se pone la Corona (×3): sube las manos, la Corona baja a la cabeza. `arde` con la Brasa bebida (brasas que
 *  suben y la sombra roja que late); sin ella no pasa nada (la Marca gris y una luz fría). */
function tomaPonerse(par: [string, string], arde: boolean): Toma {
  const D = leer(par, 10);
  return {
    id: 'ponerse', dur: D, zona: 'a7_trono', ancla: anclaJefe, objetos: ['cine_corona|t1'], entra: 1.0, sale: 0.6, oscuridad: 0.92, hundir: 0.72, sinBruma: true,
    preparar: (e) => despejarPies(e, 3.2, 1.6, 2),
    cam: [{ t: 0, x: 3.1, y: 1.5, alt: 26, zoom: 3, fy: 0.6 }, { t: D, x: 3.15, y: 1.55, alt: 30, c: 'suave' }],
    actores: [{ id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.2, y: 1.6, dir: 's' }, { t: 1.6, acc: 'lanzar', dur: 1.6, ritmo: 0.7, dir: 's' }, { t: 3.9, acc: 'quieto', dir: 's' }] }],
    focos: [{ de: 'heroe', z: 34, r: 130 }],
    luces: arde
      ? [{ id: 'arriba', color: [200, 170, 130], claves: [{ t: 0, x: 3.6, y: 0.8, z: 120, r: 220, k: 0.35 }] }, { id: 'sed', color: [255, 40, 16], sombra: true, claves: [{ t: 0, x: 3.4, y: 1.9, z: 6, r: 160, k: 0 }, { t: 3.8, k: 0 }, { t: 5, k: 0.9, c: 'sale' }] }]
      : [{ id: 'arriba', color: [200, 210, 230], sombra: true, claves: [{ t: 0, x: 3.6, y: 0.8, z: 120, r: 220, k: 0.45 }, { t: 4, k: 0.45 }, { t: 7, k: 0.3 }] }],
    sonidos: arde ? [{ t: 3.8, id: 'sub', cine: true }, ...[4.2, 5.3, 6.4, 7.5].map((t) => ({ t, id: 'latido', cine: true, vol: 1.1 })), { t: 4.0, id: 'fuego_lanzar', vol: 0.4 }] : [{ t: 3.8, id: 'viento_nieve', cine: true, vol: 0.4, tono: 0.7 }],
    mundo: (e, tl) => coronaPuesta(e, tl, 2.0, 3.8),
    suelo: (e, tl) => {
      // (la sombra tibia del acto 5: el piso se tiñe de rojo bajo sus pies y late; en lo plano, debajo del cuerpo)
      if (arde && tl > 3.8) { const h = e.actores.get('heroe') as any, [px, py] = aPant(h.x, h.y), k = Math.min(1, (tl - 3.8) / 1.2) * (0.5 + 0.5 * latido(tl)); ctx.save(); ctx.globalCompositeOperation = 'multiply'; const g = ctx.createRadialGradient(px, py, 4, px, py, 70); g.addColorStop(0, `rgba(150,20,10,${0.9 * k})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(px - 70, py - 36, 140, 72); ctx.restore(); }
    },
    paso: (e, tl, dt) => {
      const h = e.actores.get('heroe') as any; if (!e.j || !h || tl < 3.8) return;
      if (arde) { if (Math.random() < dt * 40) e.j.particulas.push({ x: h.x + (Math.random() - 0.5) * 1.2, y: h.y + (Math.random() - 0.5) * 1.2, z: 2 + Math.random() * 10, vx: 0, vy: 0, vz: 20 + Math.random() * 30, t: 0, dur: 1.6, color: Math.random() < 0.5 ? '#ff5a1a' : '#ffb040', tam: 1, grav: -6, tipo: 'ceniza' } as any); }
      // (sin la Brasa: el aliento frío y nada más)
      else if (Math.random() < dt * 4) e.j.particulas.push({ x: h.x + 0.2, y: h.y + 0.2, z: 36, vx: 0.1, vy: 0.1, vz: 3, t: 0, dur: 1.4, color: '#c8d4e0', tam: 1, grav: -1, tipo: 'humo' } as any);
      const Ls = (e.j as any).lucesCine as any[]; if (Ls) Ls.push({ id: 'marca', x: h.x + 0.2, y: h.y + 0.3, z: 26, r: 90, c: arde ? [255, 50, 24] : [140, 140, 150], k: arde ? 0.5 + 0.6 * latido(tl) : 0.12, sinSombra: true });
    },
    textos: T(par, 1.0, D - 0.5),
  };
}
/** Dónde está el asiento del dios en su ruedo (el trono que puso la puesta en escena del jefe), o el ruedo. */
const anclaAsiento = (z: Zona): [number, number] => { const [jx, jy] = anclaJefe(z); const o = z.objetos.filter((q) => q.capa === 'jefe' && /trono|altar|idolo|pulpito|relicario/.test(q.id)).sort((p, q) => Math.hypot(p.cx - jx, p.cy - jy) - Math.hypot(q.cx - jx, q.cy - jy))[0]; return o ? [o.cx + 0.5, o.cy + 0.5] : [jx, jy]; };
/** La toma del Refugio de noche (la fogata), con quien haga falta: `quienes` [id, sprite, x, y], o nadie. */
function tomaRefugio(id: string, dur: number, textos: Texto[], quienes: [string, string, number, number][], o: { frio?: boolean; rojo?: boolean; nieve?: boolean; sonidos?: Toma['sonidos']; paso?: Toma['paso']; mundo?: Toma['mundo'] } = {}): Toma {
  return {
    id, dur, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.8, sale: 0.8, oscuridad: o.frio ? 0.8 : 0.88, hundir: 0.6, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; for (const [, , x, y] of quienes) despejarPies(e, x, y, 1.3); },
    cam: [{ t: 0, x: 0.6, y: 0.6, alt: 26, zoom: 3, fy: 0.58 }, { t: dur, x: 0.4, y: 0.4, alt: 30, c: 'suave' }],
    actores: quienes.map(([qid, sp, x, y]) => (qid === 'heroe' ? { id: 'heroe', tipo: 'heroe' as const, claves: [{ t: 0, x, y, mira: [0, 0] as [number, number] }] } : qid === 'thor' ? { id: 'thor', tipo: 'thor' as const, claves: [{ t: 0, x, y, mira: [0, 0] as [number, number] }] } : { id: qid, tipo: 'sprite' as const, sprite: sp, claves: [{ t: 0, x, y, mira: [0, 0] as [number, number] }] })),
    focos: [{ de: [0, 0], z: 14, r: 190 }],
    luces: [{ id: 'fuego', color: o.rojo ? [255, 70, 30] : o.frio ? [255, 170, 110] : [255, 150, 70], sombra: true, titila: o.rojo ? 0.2 : 0.1, claves: [{ t: 0, x: 0, y: 0, z: 9, r: o.frio ? 150 : 210, k: o.frio ? 0.6 : 1 }] }, { id: 'noche', color: o.frio ? [150, 170, 210] : [90, 100, 140], claves: [{ t: 0, x: -3, y: -3, z: 300, r: 700, k: o.frio ? 0.35 : 0.12 }] }],
    suelo: o.nieve ? (e) => nievePiso(e, 12) : undefined,
    sonidos: o.sonidos ?? [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.3, tono: 0.7 }],
    paso: (e, tl, dt) => { if (o.nieve && e.j && Math.random() < dt * 40) e.j.particulas.push({ x: e.ax + (Math.random() - 0.5) * 14, y: e.ay + (Math.random() - 0.5) * 14, z: 120 + Math.random() * 80, vx: 0.3, vy: 0.2, vz: -18, t: 0, dur: 7, color: '#e8eef4', tam: 1.2, grav: 0, tipo: 'ceniza' } as any); o.paso?.(e, tl, dt); },
    mundo: o.mundo,
    textos,
  };
}

// ------------------------------------------------------------------ el Cielo Abierto (Mira)
function cielo(vigdis: string | undefined, ecos: [string, string][]): Toma[] {
  const ep = EPILOGOS.cielo, l = ep.lineas, ts: Toma[] = [];
  const D0 = leer(l[0], 11), D1 = leer(l[1], 10), D2 = leer(l[2], 9);
  ts.push({
    // al pie de la escalera apagada, el héroe le da la Corona a Mira; ella la levanta hacia las tres estrellas que liberó y la suelta:
    // no cae, sube
    id: 'mira', dur: D0, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), objetos: ['cine_corona|t1', ...ESCALERA], entra: 1.0, sale: 0.8, oscuridad: 0.84, hundir: 0.6, sinBruma: true, lucesZona: 0.1,
    preparar: (e) => { prepararEscalera(e); apagarEscalera(e, 1); despejarPies(e, 2.6, 2.6, 2.6); },
    cam: [{ t: 0, x: 2.8, y: 2.8, alt: 40, zoom: 3, fy: 0.66 }, { t: D0, x: 2.4, y: 2.4, alt: 70, c: 'suave' }],
    actores: [
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 4.3, y: 1.9, mira: [1.4, 3.1] }, { t: 4.5, mira: [1.0, 1.0] }] },
      { id: 'mira', tipo: 'sprite', sprite: 'cine_mira', claves: [{ t: 0, x: 1.4, y: 3.1, mira: [4.3, 1.9] }, { t: 3.4, dir: 'n' }, { t: 3.6, acc: 'lanzar', dur: 1.4, ritmo: 0.55 }, { t: 6.2, acc: 'quieto', dir: 'n' }] },
    ],
    focos: [{ de: 'heroe', z: 30, r: 120 }, { de: 'mira', z: 40, r: 140 }],
    luces: [{ id: 'estrellas', color: [200, 210, 255], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.35 }] }, { id: 'corona', color: [255, 210, 130], claves: [{ t: 0, x: 3.4, y: 2.5, z: 30, r: 90, k: 0.35 }, { t: 3, x: 1.8, y: 2.7, k: 0.5 }, { t: D0, x: 1.4, y: 2.4, z: 200, k: 0.2 }] }],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 1.1, vol: 0.4 }, { t: 5.2, id: 'brasa_vuela', cine: true, tono: 1.4, vol: 0.4 }],
    mundo: (e, tl) => {
      cieloNoche(tl, 3, 0, 0.42);
      const h = e.actores.get('heroe') as any, m = e.actores.get('mira') as any; if (!h || !m) return;
      // las tres estrellas que liberó, grandes, arriba
      const [mx, my] = aPant(m.x, m.y);
      [[-70, -170], [-30, -200], [24, -180]].forEach(([dx, dy], i) => { const k = 0.7 + 0.3 * Math.sin(tl * 2 + i); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.fillStyle = '#fff4d8'; const X = Math.round(mx + dx), Y = Math.round(my + dy), L = 3 + (i === 1 ? 2 : 0); ctx.fillRect(X - L, Y, L * 2 + 1, 1); ctx.fillRect(X, Y - L, 1, L * 2 + 1); ctx.fillRect(X - 1, Y - 1, 3, 3); ctx.restore(); });
      // la Corona: de las manos del héroe a las de Mira; ella la alza y la suelta, y sube despacio, hacia las estrellas
      const u = Math.min(1, Math.max(0, (tl - 1.2) / 1.6)), s2 = u * u * (3 - 2 * u), sube = Math.max(0, tl - 5.2);
      const x = h.x + (m.x - h.x) * s2, y = h.y + (m.y - h.y) * s2, z = 30 + Math.sin(s2 * Math.PI) * 4 + (tl > 3.8 ? Math.min(14, (tl - 3.8) * 14) : 0) + sube * sube * 9 + sube * 6;
      coronaEnMano(x, y, z, Math.max(0, 1 - Math.max(0, sube - 3.5) / 1.5));
      if (sube > 0) { const [px, py] = aPant(x, y); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(px, py - z - 6, 0, px, py - z - 6, 24); g.addColorStop(0, 'rgba(255,220,140,0.35)'); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(px - 24, py - z - 30, 48, 48); ctx.restore(); }
    },
    textos: T(l[0], 0.8, D0 - 0.5),
  });
  ts.push({
    // arriba, la Corona se rompe como un vidrio y llueve oro tibio sobre el valle (el Refugio desde lejos)
    id: 'rompe', dur: D1, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.6, sale: 0.8, oscuridad: 0.56, hundir: 0.3, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; },
    cam: [{ t: 0, x: 3, y: 3, alt: 110, zoom: 0.8, fy: 0.74 }, { t: D1, x: 2, y: 2, alt: 100, c: 'suave' }],
    focos: [{ de: [0, 0], z: 40, r: 420, k: 0.6 }],
    luces: [{ id: 'oro', color: [255, 210, 130], claves: [{ t: 0, x: -4, y: -4, z: 500, r: 1000, k: 0 }, { t: 2.2, k: 0 }, { t: 3, k: 0.7, c: 'sale' }, { t: D1, k: 0.45 }] }, { id: 'fuego', color: [255, 150, 70], titila: 0.1, claves: [{ t: 0, x: 0, y: 0, z: 10, r: 160, k: 0.6 }] }],
    sonidos: [{ t: 2.2, id: 'hielo_cruje', cine: true, tono: 1.8 }, { t: 2.25, id: 'campana', cine: true, tono: 1.4, vol: 0.6 }, { t: 2.3, id: 'sub', cine: true }, { t: 3, id: 'coro_vesperio', cine: true, tono: 1.3, vol: 0.4 }],
    temblores: [[2.2, 0.6, 2]],
    paso: (e, tl, dt) => lluviaOro(e, dt, tl < 2.6 ? 0 : Math.min(1, (tl - 2.6) / 1.2), 20),
    mundo: (e, tl) => {
      cieloNoche(tl, 70, 0, 0.5);
      const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
      const cx = (a.x + b.x) / 2, cy = a.y + (b.y - a.y) * 0.16, q = objetoMeta('cine_corona', 'r2')?.f[0];
      ctx.save(); ctx.imageSmoothingEnabled = false;
      if (tl < 2.2 && q) { ctx.globalAlpha = Math.min(1, tl / 0.8); ctx.save(); ctx.translate(Math.round(cx), Math.round(cy + 10 - tl * 4)); ctx.scale(3, 3); dibujar(ctx, q, 0, 0); ctx.restore(); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g0 = ctx.createRadialGradient(cx, cy - 20, 0, cx, cy - 20, 70); g0.addColorStop(0, `rgba(255,210,130,${0.25 * Math.min(1, tl)})`); g0.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g0; ctx.fillRect(cx - 70, cy - 90, 140, 140); ctx.restore(); }
      else if (q) {
        // el estallido: un fogonazo, el aro de luz que se abre y los pedazos de oro que vuelan girando y destellan
        const u = tl - 2.2; ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 + u * 120); g.addColorStop(0, `rgba(255,240,190,${Math.max(0, 0.9 - u * 0.5)})`); g.addColorStop(1, 'rgba(255,200,100,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 200, cy - 200, 400, 400);
        if (u < 1.2) { ctx.globalAlpha = 1 - u / 1.2; ctx.strokeStyle = '#fff0c0'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(cx, cy, 8 + u * 90, 4 + u * 45, 0, 0, Math.PI * 2); ctx.stroke(); }
        ctx.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 40; i++) { const an = hash(i) * Math.PI * 2, v = 60 + hash(i + 9) * 160, x = cx + Math.cos(an) * v * u, y = cy + Math.sin(an) * v * u * 0.7 + u * u * 22, gi = u * (4 + hash(i + 3) * 8), w = 3 + Math.round(hash(i + 5) * 5);
          if (u > 3.5) continue; ctx.globalAlpha = Math.max(0, 1 - u / 3.5); ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(gi); ctx.fillStyle = Math.sin(gi * 3) > 0.6 ? '#fff4c8' : i % 2 ? '#e0a83a' : '#a87420'; ctx.fillRect(-w, -2, w * 2, 3); ctx.restore(); }
        // la lluvia de oro tibio: hilos de pixel que caen por todo el cuadro, cada vez más
        const kr = Math.min(1, Math.max(0, (u - 0.4) / 1.4)), Hh = b.y - a.y;
        for (let i = 0; i < 480 * kr; i++) { const x = a.x + hash(i * 1.7) * (b.x - a.x), y = a.y + ((hash(i * 2.3) * Hh + tl * 160 * (0.7 + hash(i * 3.1) * 0.6)) % Hh), L = 3 + Math.round(hash(i * 4.1) * 4);
          ctx.globalAlpha = 0.55 + 0.45 * hash(i * 5.3); ctx.fillStyle = i % 4 ? '#f0b850' : '#fff4c0'; ctx.fillRect(Math.round(x), Math.round(y), 2, L); ctx.fillStyle = '#fff8d8'; ctx.fillRect(Math.round(x), Math.round(y) + L, 2, 2); }
      }
      ctx.restore();
    },
    textos: T(l[1], 0.6, D1 - 0.5),
  });
  ts.push({
    // sin dioses: Santa Oria de día gris; las campanas son solo campanas; el oro que cayó queda en el piso
    id: 'sin_dioses', dur: D2, zona: 'a1_cementerio', ancla: anclaFachada, entra: 0.6, sale: 0.6, oscuridad: 0.5, hundir: 0.3, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; },
    cam: [{ t: 0, x: 10, y: 10, alt: 200, zoom: 0.7, fy: 0.55 }, { t: D2, x: 8.5, y: 8.5, alt: 210, c: 'suave' }],
    luces: [{ id: 'gris', color: [170, 172, 180], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.5 }] }],
    sonidos: [{ t: 0.6, id: 'campana', cine: true, tono: 0.9, vol: 0.5 }, { t: 3.4, id: 'campana', cine: true, tono: 0.85, vol: 0.4 }],
    paso: (e, tl, dt) => lluviaOro(e, dt, Math.max(0, 0.35 - tl * 0.05), 20),
    textos: T(l[2], 0.6, D2 - 0.5),
  });
  if (vigdis === 'salvar') ts.push(tomaLampara(ep.vigdis.salvar));
  else if (vigdis === 'sacrificar') ts.push(tomaTumba(ep.vigdis.sacrificar, 'derrite'));
  ts.push(...ecosYFin(ecos, l[3], (id, dur, tx) => {
    // Mira cuenta estrellas: junto al fuego, con el cielo lleno (en la de los ecos todavía las de siempre; en la última, más)
    const ult = id === 'fuego';
    return tomaRefugio(id, dur, tx, [['mira', 'cine_mira', -1.0, 1.9], ['heroe', '', 2.2, -0.8], ['thor', '', -2.0, -0.7]], { frio: true, mundo: (_e, tl) => cieloNoche(tl, 150, ult ? Math.min(1, tl / (dur * 0.7)) : 0, 0.5) });
  }, ep.titulo, false));
  return ts;
}
/** Vigdis sube al Paso del Glaciar con su lámpara encendida (por Eirik, por si acaso). */
function tomaLampara(par: [string, string]): Toma {
  const D = leer(par, 10);
  return {
    id: 'vigdis', dur: D, zona: 'a4_glaciar', ancla: anclaCentro, entra: 0.8, sale: 0.8, oscuridad: 0.86, hundir: 0.62, sinBruma: true, sinClima: ['fx_ventisca'],
    preparar: (e) => { despejarPies(e, 0, 0, 4); const z: any = e.z; if (z) z.niebla = 0; },
    cam: [{ t: 0, x: 1.4, y: 1.2, alt: 36, zoom: 3, fy: 0.6 }, { t: D, x: -0.6, y: -0.8, alt: 40, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'cine_vigdis', claves: [{ t: 0, x: 2.0, y: 1.8 }, { t: D * 0.85, x: -1.0, y: -1.3, c: 'lineal' }, { t: D, dir: 'n' }] }],
    focos: [{ de: 'vigdis', z: 40, r: 150 }],
    luces: [{ id: 'luna', color: [130, 150, 200], claves: [{ t: 0, x: -4, y: -4, z: 400, r: 800, k: 0.3 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.5 }, { t: 0.5, id: 'nana', cine: true, vol: 0.6 }],
    paso: (e, tl, dt) => { const m = e.actores.get('vigdis') as any, Ls = (e.j as any)?.lucesCine as any[]; if (m && Ls) Ls.push({ id: 'lampara', x: m.x - 0.3, y: m.y + 0.3, z: 30, r: 120, c: [255, 180, 100], k: 0.8 + 0.1 * Math.sin(tl * 11), sinSombra: false }); if (e.j && Math.random() < dt * 50) e.j.particulas.push({ x: e.ax + (Math.random() - 0.5) * 16, y: e.ay + (Math.random() - 0.5) * 16, z: 100 + Math.random() * 80, vx: 1.2, vy: 0.4, vz: -20, t: 0, dur: 5, color: '#e8eef4', tam: 1.2, grav: 0, tipo: 'ceniza' } as any); },
    textos: T(par, 0.8, D - 0.5),
  };
}
/** La tumba de Vigdis en el Fortín: `derrite` (sin dioses la nieve se va y debajo no hay nadie) o `tibia` (bajo la nieve, algo tibio
 *  que late: el Rey la siente). */
function tomaTumba(par: [string, string], modo: 'derrite' | 'tibia' | 'quieta', conHeroe = false): Toma {
  const D = leer(par, 9), base = tomaVigdis(par, false);
  return {
    ...base, dur: D, textos: T(par, 0.8, D - 0.5),
    actores: conHeroe ? [{ id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 1.7, y: -0.3, mira: [0.4, 0.6] }] }] : undefined,
    suelo: (e) => nievePiso(e, modo === 'derrite' ? Math.max(4, 15 - e.mem.tl * 2.2) : 15),
    paso: (e, tl, dt) => { e.mem.tl = tl; base.paso?.(e, tl, dt); const Ls = (e.j as any)?.lucesCine as any[]; if (modo === 'tibia' && Ls) Ls.push({ id: 'tibia2', x: e.ax + 0.4, y: e.ay + 0.7, z: 3, r: 70, c: [255, 90, 40], k: 0.35 + 0.35 * latido(tl * 0.8), sinSombra: true }); },
  };
}

// ------------------------------------------------------------------ el Rey de Ceniza (la Corona puesta con la Brasa bebida)
function reyCeniza(vigdis: string | undefined, ecos: [string, string][]): Toma[] {
  const ep = EPILOGOS.rey_ceniza, l = ep.lineas, ts: Toma[] = [tomaPonerse(l[0], true)];
  const D1 = leer(l[1], 10), D2 = leer(l[2], 10);
  ts.push({
    // el Trono Sediento: el héroe en el asiento del dios, la Corona puesta, la luz roja que late; todo lo que tiene calor viene
    id: 'trono', dur: D1, zona: 'a7_trono', ancla: anclaAsiento, objetos: ['cine_corona|t1'], entra: 0.8, sale: 0.6, oscuridad: 0.94, hundir: 0.74,
    preparar: (e) => despejarPies(e, 1.1, 1.1, 1.2),
    cam: [{ t: 0, x: 4, y: 4, alt: 70, zoom: 2, fy: 0.55 }, { t: D1, x: 1.8, y: 1.8, alt: 46, c: 'suave' }],
    actores: [{ id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 1.1, y: 1.1, dir: 's' }] }],
    focos: [{ de: 'heroe', z: 40, r: 140 }],
    luces: [{ id: 'sed', color: [255, 40, 16], sombra: true, claves: [{ t: 0, x: 1.6, y: 1.6, z: 8, r: 220, k: 0.7 }] }],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true, tono: 0.5 }, ...[0.8, 1.9, 3.0, 4.1, 5.2, 6.3, 7.4].map((t) => ({ t, id: 'latido', cine: true, vol: 0.8 }))],
    mundo: (e, tl) => { const h = e.actores.get('heroe') as any; if (h) coronaEnMano(h.x, h.y, CABEZA, 1, 0.48); void tl; },
    paso: (e, tl, dt) => {
      const Ls = (e.j as any)?.lucesCine as any[]; if (Ls && Ls[0]) Ls[0].k = 0.35 + 0.6 * latido(tl);
      // (lo que tiene calor viene: brasas y ceniza tibia que se arrastran por el piso hacia el trono)
      if (e.j && Math.random() < dt * 50) { const a = Math.random() * Math.PI * 2, r = 7 + Math.random() * 4; e.j.particulas.push({ x: e.ax + 1.1 + Math.cos(a) * r, y: e.ay + 1.1 + Math.sin(a) * r, z: 2 + Math.random() * 8, vx: -Math.cos(a) * 2.2, vy: -Math.sin(a) * 2.2, vz: 0, t: 0, dur: 3, color: Math.random() < 0.5 ? '#ff4a1a' : '#a83010', tam: 1, grav: 0, tipo: 'ceniza' } as any); }
    },
    textos: T(l[1], 0.8, D1 - 0.5),
  });
  // Velmora arde por dentro: nadie junto al fuego (bajo y rojo); las campanas de Santa Oria contestan solas
  ts.push(tomaRefugio('nadie', D2, T(l[2], 0.8, D2 - 0.5), [], { rojo: true, sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.5, tono: 0.6 }, ...[3.4, 4.6, 5.8].map((t, i) => ({ t, id: 'campana', cine: true, tono: 0.55 - i * 0.03, vol: 0.6 }))] }));
  if (vigdis === 'salvar') ts.push(tomaCaldo(ep.vigdis.salvar));
  else if (vigdis === 'sacrificar') ts.push(tomaTumba(ep.vigdis.sacrificar, 'tibia'));
  ts.push(...ecosYFin(ecos, l[3], (id, dur, tx) => (id === 'fuego' ? tomaTerceraBrasa(dur, tx) : tomaRefugio(id, dur, tx, [], { rojo: true })), ep.titulo, false));
  return ts;
}
/** Vigdis deja el caldo en el primer escalón de la escalera apagada y no sube más. */
function tomaCaldo(par: [string, string]): Toma {
  const D = leer(par, 11);
  return {
    id: 'vigdis', dur: D, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), objetos: ESCALERA, entra: 0.8, sale: 0.8, oscuridad: 0.86, hundir: 0.6, sinBruma: true, lucesZona: 0.1,
    preparar: (e) => { prepararEscalera(e); apagarEscalera(e, 1); despejarPies(e, 2, 2, 3); },
    cam: [{ t: 0, x: 2.6, y: 2.6, alt: 34, zoom: 3, fy: 0.6 }, { t: D, x: 2.3, y: 2.3, alt: 38, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'cine_vigdis', claves: [{ t: 0, x: 5.5, y: 4.5 }, { t: D * 0.35, x: 2.4, y: 1.9, c: 'sale' }, { t: D * 0.45, dir: 'n' }, { t: D * 0.6, x: 2.4, y: 1.9, dir: 'n' }, { t: D * 0.6, dir: 'se' }, { t: D, x: 5.6, y: 4.8, c: 'entra' }] }],
    focos: [{ de: [1.8, 1.4], z: 10, r: 120 }, { de: 'vigdis', z: 40, r: 120 }],
    luces: [{ id: 'sed', color: [255, 50, 20], claves: [{ t: 0, x: -2, y: -2, z: 120, r: 400, k: 0.4 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.4, tono: 0.7 }],
    paso: (e, tl, dt) => {
      const m = e.actores.get('vigdis') as any, Ls = (e.j as any)?.lucesCine as any[]; if (m && Ls) Ls.push({ id: 'lampara', x: m.x - 0.3, y: m.y + 0.3, z: 30, r: 100, c: [255, 180, 100], k: 0.7, sinSombra: false });
      if (e.j && tl > D * 0.45 && Math.random() < dt * 8) e.j.particulas.push({ x: e.ax + 1.8, y: e.ay + 1.4, z: 6, vx: 0, vy: 0, vz: 8, t: 0, dur: 1.6, color: '#d8d0c4', tam: 1, grav: -1, tipo: 'humo' } as any);
    },
    // el cuenco del caldo en el primer escalón
    mundo: (e, tl) => { if (tl < D * 0.45) return; const [px, py] = aPant(e.ax + 1.8, e.ay + 1.4); ctx.save(); ctx.imageSmoothingEnabled = false; const X = Math.round(px), Y = Math.round(py - 2); ctx.fillStyle = '#2a1a10'; ctx.fillRect(X - 4, Y - 1, 9, 3); ctx.fillStyle = '#6a4424'; ctx.fillRect(X - 4, Y - 2, 9, 2); ctx.fillStyle = '#c08a4a'; ctx.fillRect(X - 3, Y - 2, 7, 1); ctx.restore(); },
    textos: T(par, 0.8, D - 0.5),
  };
}
/** Muy lejos, en otro cielo, la tercera brasa: la misma de la película del acto 1 (el cometa que late), cruza la noche, se para,
 *  cambia de rumbo y viene hacia acá, creciendo hasta llenar el cuadro. */
function tomaTerceraBrasa(D: number, textos: Texto[]): Toma {
  return {
    id: 'fuego', dur: D, zona: 'a1_paramo', ancla: anclaCamino, entra: 0.8, sale: 0.3, colorSale: '#3a0604', oscuridad: 0.7, hundir: 0.5,
    cam: [{ t: 0, x: 8, y: 8, alt: 170, zoom: 0.8, fy: 0.7 }, { t: D, x: 7, y: 7, alt: 180, c: 'suave' }],
    // (lejos y alta, de izquierda a derecha; a la mitad se detiene, late, gira y viene hacia la cámara)
    brasa: [{ t: 0.4, x: -10, y: 2, z: 430, k: 0.9, tam: 0.8 }, { t: D * 0.45, x: 4, y: -6, z: 420, k: 1, tam: 0.9, c: 'suave' }, { t: D * 0.6, x: 4.5, y: -5.5, z: 410, k: 1, tam: 1.1, c: 'suave' }, { t: D, x: 9, y: 9, z: 210, k: 1, tam: 3, c: 'entra' }],
    focos: [{ de: 'brasa', r: 260 }],
    luces: [{ id: 'luna', color: [110, 125, 170], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 700, k: 0.18 }] }],
    sonidos: [{ t: 0, id: 'organo_sur', cine: true, tono: 0.8 }, { t: 0.6, id: 'brasa_vuela', cine: true, vol: 0.5 }, ...[D * 0.5, D * 0.5 + 1.1].map((t) => ({ t, id: 'latido', cine: true, vol: 1.2 })), { t: D * 0.62, id: 'brasa_nace', cine: true }, { t: D * 0.7, id: 'brasa_vuela', cine: true }, { t: D - 0.6, id: 'sub', cine: true }],
    mundo: (_e, tl) => cieloNoche(tl, 80, 0, 0.62, '6,4,10'),
    textos,
  };
}

// ------------------------------------------------------------------ la Corona Fría (la Corona puesta con la Brasa apagada)
function coronaFria(vigdis: string | undefined, ecos: [string, string][]): Toma[] {
  const ep = EPILOGOS.corona_fria, l = ep.lineas, ts: Toma[] = [tomaPonerse(l[0], false)];
  const D1 = leer(l[1], 10), D2 = leer(l[2], 11);
  // la gente del Refugio lo recibe en corro; él quieto en el medio, con la Corona puesta
  const gente: [string, string, number, number][] = [['heroe', '', 0.6, 0.6], ['odran', 'odran', -2.2, 2.0], ['lys', 'lys', 3.2, -1.6], ['brannoc', 'brannoc', 3.4, 1.4], ['tomas', 'tomas', 1.2, 3.4], ['ysolde', 'ysolde', -2.0, -1.4]];
  const conCorona: Toma['mundo'] = (e) => { const h = e.actores.get('heroe') as any; if (h) coronaEnMano(h.x, h.y, CABEZA, 1, 0.48); };
  ts.push({ ...tomaRefugio('recibe', D1, T(l[1], 0.8, D1 - 0.5), gente, { frio: true, mundo: conCorona }), objetos: ['cine_corona|t1'], actores: gente.map(([qid, sp, x, y]) => (qid === 'heroe' ? { id: 'heroe', tipo: 'heroe' as const, claves: [{ t: 0, x, y, dir: 's' as const }] } : { id: qid, tipo: 'sprite' as const, sprite: sp, claves: [{ t: 0, x, y, mira: [0.6, 0.6] as [number, number] }] })), focos: [{ de: [0.6, 0.6], z: 30, r: 200 }] });
  // el invierno largo: nieve sobre el Refugio, Ysolde le tira las cartas y sale la misma (el rey con escarcha en la cara)
  ts.push({ ...tomaRefugio('invierno', D2, T(l[2], 0.8, D2 - 0.5), [['heroe', '', 1.6, -0.4], ['ysolde', 'ysolde', -0.4, 1.6]], { frio: true, nieve: true, mundo: (e, tl) => { conCorona(e, tl, 0); cartaRey(e, tl); } }), objetos: ['cine_corona|t1'] });
  if (vigdis === 'salvar') ts.push({ ...tomaRefugio('vigdis', leer(ep.vigdis.salvar, 10), T(ep.vigdis.salvar, 0.8, leer(ep.vigdis.salvar, 10) - 0.5), [['heroe', '', 1.2, -0.2], ['vigdis', 'cine_vigdis', 0.2, 0.9]], { frio: true, mundo: conCorona }), objetos: ['cine_corona|t1'] });
  else if (vigdis === 'sacrificar') ts.push(tomaTumba(ep.vigdis.sacrificar, 'quieta', true));
  ts.push(...ecosYFin(ecos, l[3], (id, dur, tx) => (id === 'fuego' ? tomaSolo(dur, tx) : { ...tomaRefugio(id, dur, tx, [['heroe', '', 1.6, -0.4]], { frio: true, nieve: true, mundo: conCorona }), objetos: ['cine_corona|t1'] }), ep.titulo, true));
  return ts;
}
/** La carta del rey con escarcha: boca arriba en el piso entre los dos, con su destello frío. */
function cartaRey(e: EstadoToma, tl: number) {
  const [px, py] = aPant(e.ax + 0.6, e.ay + 0.6), X = Math.round(px), Y = Math.round(py - 1);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#1a1410'; ctx.fillRect(X - 4, Y - 6, 9, 12); ctx.fillStyle = '#d8ccb0'; ctx.fillRect(X - 3, Y - 5, 7, 10); ctx.fillStyle = '#c8a040'; ctx.fillRect(X - 1, Y - 3, 3, 1); ctx.fillRect(X - 2, Y - 4, 1, 1); ctx.fillRect(X + 2, Y - 4, 1, 1); ctx.fillStyle = '#6a5a4a'; ctx.fillRect(X - 1, Y - 2, 3, 3);
  ctx.fillStyle = '#e8f4ff'; ctx.globalAlpha = 0.8; for (const [dx, dy] of [[-3, 4], [-2, 3], [3, -5], [2, 4], [-3, -5]]) ctx.fillRect(X + dx, Y + dy, 1, 1);
  const f = (tl * 0.7) % 2; if (f < 0.4) { const L = Math.round(2 + Math.sin((f / 0.4) * Math.PI) * 3); ctx.globalAlpha = 1; ctx.fillRect(X + 2 - L, Y - 4, L * 2 + 1, 1); ctx.fillRect(X + 2, Y - 4 - L, 1, L * 2 + 1); }
  ctx.restore();
}
/** El héroe solo, de cerca (×4), con escarcha en la cara: la Corona puesta, el aliento que no sale tibio. */
function tomaSolo(D: number, textos: Texto[]): Toma {
  return {
    id: 'fuego', dur: D, zona: 'a1_refugio', ancla: anclaFogata, objetos: ['cine_corona|t1'], entra: 0.8, sale: 0.8, oscuridad: 0.84, hundir: 0.74, sinClima: ['fx_lluvia', 'fx_tormenta'], sinBruma: true,
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; despejarPies(e, 3, -1, 1.5); },
    cam: [{ t: 0, x: 3.05, y: -0.95, alt: 44, zoom: 4, fy: 0.55 }, { t: D, x: 3.0, y: -1.0, alt: 48, c: 'suave' }],
    actores: [{ id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3, y: -1, dir: 's' }] }],
    focos: [{ de: 'heroe', z: 40, r: 90 }],
    luces: [{ id: 'frio', color: [160, 190, 235], sombra: true, claves: [{ t: 0, x: 1.5, y: 0.5, z: 80, r: 200, k: 0.55 }] }, { id: 'fuego', color: [255, 150, 70], claves: [{ t: 0, x: 0, y: 0, z: 9, r: 120, k: 0.25 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.5, tono: 0.6 }],
    suelo: (e) => nievePiso(e, 8),
    mundo: (e, tl) => {
      const h = e.actores.get('heroe') as any; if (!h) return; coronaEnMano(h.x, h.y, CABEZA, 1, 0.48);
      // la escarcha que le crece en la cara y en la Corona: cristales de pixel que destellan
      const [px, py] = aPant(h.x, h.y); ctx.save(); ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < 16; i++) { const k = Math.min(1, tl / 4 - i * 0.04); if (k <= 0) continue; const x = Math.round(px - 7 + hash(i) * 14), y = Math.round(py - 50 + hash(i + 7) * 14); ctx.globalAlpha = k * (0.6 + 0.4 * Math.sin(tl * 3 + i)); ctx.fillStyle = i % 3 ? '#dff0ff' : '#ffffff'; ctx.fillRect(x, y, 1, 1); if (i % 5 === 0) { ctx.fillRect(x - 1, y, 3, 1); } }
      ctx.restore();
    },
    paso: (e, tl, dt) => { const h = e.actores.get('heroe') as any; if (e.j && h && Math.random() < dt * 40) e.j.particulas.push({ x: e.ax + (Math.random() - 0.5) * 8, y: e.ay + (Math.random() - 0.5) * 8, z: 60 + Math.random() * 40, vx: 0.4, vy: 0.2, vz: -14, t: 0, dur: 6, color: '#e8eef4', tam: 1, grav: 0, tipo: 'ceniza' } as any); void tl; },
    textos,
  };
}

/**
 * El guion del final del héroe (7b), con su Vigdis y sus ecos; null si ese final todavía no tiene película (sigue la cinemática y
 * la pantalla de texto de antes).
 */
export function guionFinal(fin: Final, d: DatosHeroe, vigdis: string | undefined, ecos: [string, string][]): Guion | null {
  const id = 'fin_' + fin + '_' + (vigdis ?? '') + ecos.length;
  if (fin === 'vigilia') return { id, acto: 7, tomas: vigilia(d, vigdis, ecos) };
  if (fin === 'cielo') return { id, acto: 7, tomas: cielo(vigdis, ecos) };
  if (fin === 'rey_ceniza') return { id, acto: 7, tomas: reyCeniza(vigdis, ecos) };
  if (fin === 'corona_fria') return { id, acto: 7, tomas: coronaFria(vigdis, ecos) };
  return null;
}
