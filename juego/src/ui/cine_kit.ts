// Lo que comparten las películas de los actos (ui/cine_acto<N>.ts, ver ui/director.ts): anclas, sangre, cuervos, ceniza, el
// latido, lo que se saca de la copia de la zona, el primer término de la zona y el cartel del acto que empieza.
import { ctx, W, H } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { ponerMancha, type Juego } from '../juego/mundo';
import type { Zona } from '../mundo/zona';
import { objetoMeta } from '../motor/assets';
import { spriteAve, LADO_AVE } from '../render/presencias';
import { textoGotico } from './texto_gotico';
import { brasaRenglon } from './brasa_menu';
import { puntoGotico, lienzoGotico } from './letra_gotica';
import { pegarPixel } from './fuego_pixel';
import { TITULO, IDI } from './comun';
import type { EstadoToma, Texto } from './director';
import { PELICULA } from '../mundo/actos';

/** La línea n de la película de un acto (las del Libro de Odrán), entre t0 y t1. */
export const linea = (acto: number, n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => ({ t0, t1, es: PELICULA[acto][n].es, en: PELICULA[acto][n].en, voz: PELICULA[acto][n].voz, ...o });
export const VIOLETA: [number, number, number] = [200, 170, 255];
export const metaDe = (id: string, v: string) => objetoMeta(id, v)?.f[0];
/** El ruedo de Ilvara: donde sale el jefe. */
export const anclaJefe = (z: Zona): [number, number] => { const s = z.spawns.find((q) => q.tipo === 'jefe'); return s ? [s.cx + 0.5, s.cy + 0.5] : [z.W / 2, z.H / 2]; };
/** Las piezas del monumento o la catedral de una salida (la de `destino`), y la de adelante (la puerta). */
export const piezasDe = (z: Zona, destino: string) => z.salidas.find((q) => q.destino === destino)?.piezas ?? [];
/** El ancla de un monumento: la pieza que más adelante queda (la que da a la cámara), o la que pide `re`. */
export const anclaPieza = (destino: string, re?: RegExp) => (z: Zona): [number, number] => {
  const ps = piezasDe(z, destino); const f = (re && ps.find((o) => re.test(o.id))) || [...ps].sort((a, b) => b.cx + b.cy - (a.cx + a.cy))[0];
  return f ? [f.cx + 0.5, f.cy + 0.5] : [z.W / 2, z.H / 2];
};
/**
 * Saca de la zona de la película (es su copia, la partida no la ve) lo que queda delante de las piezas de una salida (una
 * catedral, un monumento) y las tapa desde la cámara: la caja del dibujo de cada pieza contra la de todas, y solo lo que está
 * más cerca de la cámara.
 */
export function despejarPiezas(z: Zona, destino: string, guardar = /catedral|acto_hito|mon_/) {
  const piezas = piezasDe(z, destino); if (!piezas.length) return;
  const caja = (o: { id: string; v: string; cx: number; cy: number }) => { const q = metaDe(o.id, o.v); if (!q) return null; const X = (o.cx - o.cy) * 16, Y = (o.cx + o.cy + 1) * 8; return [X - q.ax, Y - q.ay, X - q.ax + q.w, Y - q.ay + q.h]; };
  const cf = piezas.map(caja).filter(Boolean) as number[][]; if (!cf.length) return;
  const x0 = Math.min(...cf.map((c) => c[0])) - 24, y0 = Math.min(...cf.map((c) => c[1])), x1 = Math.max(...cf.map((c) => c[2])) + 24, y1 = Math.max(...cf.map((c) => c[3])) + 60;
  const prof = Math.min(...piezas.map((o) => o.cx + o.cy));
  const mias = new Set(piezas.map((o) => o.id + '|' + o.cx + '|' + o.cy));
  z.objetos = z.objetos.filter((o) => { if (o.cx + o.cy <= prof - 2 || guardar.test(o.id) || mias.has(o.id + '|' + o.cx + '|' + o.cy)) return true; const c = caja(o as any); return !c || c[2] < x0 || c[0] > x1 || c[3] < y0 || c[1] > y1; });
}

// ------------------------------------------------------------------ ayudas de la toma
/** Un charco de sangre que se abre bajo el cuerpo (una vez por toma). */
export function charco(e: EstadoToma, clave: string, x: number, y: number, r: number, rmax: number) {
  if (e.mem[clave] || !e.j) return; e.mem[clave] = 1;
  ponerMancha(e.j, { x: e.ax + x, y: e.ay + y, r, rmax, color: '#4a0806', t: 0, tipo: 'sangre', forma: 'charco', pal: 'rojo', sem: 3 });
}
/** Una vez: corre `f` la primera vez que tl pasa `t`. */
export function vez(e: EstadoToma, clave: string, tl: number, t: number, f: () => void) { if (tl >= t && !e.mem[clave]) { e.mem[clave] = 1; f(); } }
/** Una bandada que se espanta: cuervos de pixel que suben aleteando desde (x, y) del mundo. */
interface Cuervo { x: number; y: number; z: number; vx: number; vy: number; vz: number; f: number }
export function soltarCuervos(e: EstadoToma, x: number, y: number, n: number) {
  const L: Cuervo[] = (e.mem.cuervos ??= []);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; L.push({ x: e.ax + x + Math.cos(a) * 3, y: e.ay + y + Math.sin(a) * 3, z: 60 + Math.random() * 160, vx: Math.cos(a) * (1.5 + Math.random() * 2) - 1.5, vy: Math.sin(a) * (1.5 + Math.random() * 2) - 1.5, vz: 40 + Math.random() * 70, f: Math.random() * 8 }); }
}
export function dibujarCuervos(e: EstadoToma, dt: number) {
  const L: Cuervo[] | undefined = e.mem.cuervos; if (!L) return;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const c of L) {
    c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.f += dt * 16;
    const [px, py] = aPant(c.x, c.y), ang = Math.atan2(((c.vx + c.vy) * 8 - c.vz), (c.vx - c.vy) * 16);
    ctx.drawImage(spriteAve('cuervo', ang, Math.floor(c.f) & 7, 0), Math.round(px - LADO_AVE / 2), Math.round(py - c.z - LADO_AVE / 2));
  }
  ctx.restore();
}
/** Ceniza pálida que sube de alguien (Vesperio). */
export function ceniza(j: Juego, x: number, y: number, n: number, color: string) {
  // (alrededor del cuerpo, no encima: a 0,8 a 1,5 casillas, y sube)
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 0.8 + Math.random() * 0.7; j.particulas.push({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r, z: 4 + Math.random() * 20, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 - 0.15, vz: 18 + Math.random() * 22, t: 0, dur: 1.8 + Math.random() * 1.4, color, tam: 1 + Math.random() * 0.8, grav: -4, tipo: 'ceniza' } as any); }
}
/** Saca lo suelto y chico que quedó a los pies de alguien (la copia de la zona de la película). */
export function despejarPies(e: EstadoToma, x: number, y: number, r: number) {
  const z = e.z; if (!z) return; const X = e.ax + x, Y = e.ay + y;
  z.objetos = z.objetos.filter((o) => /hito|catedral|muro|verja|cerca|arb_|macizo/.test(o.id) || Math.hypot(o.cx + 0.5 - X, o.cy + 0.5 - Y) > r);
}
/** El latido (lub-dub cada 1,1 s, el mismo de la brasa): 0 a 1. */
export const latido = (t: number) => { const f = (t % 1.1) / 1.1; return Math.exp(-(((f - 0.05) / 0.06) ** 2)) + 0.7 * Math.exp(-(((f - 0.22) / 0.06) ** 2)); };
/** Una columna o pilar de la zona para el primer término (el más común de los altos que bloquean). */
export const columnaDe = (z: Zona): string | null => {
  const n = new Map<string, number>();
  for (const o of z.objetos) { if (!o.bloquea || /hito|muro|catedral|roca_|penasco/.test(o.id)) continue; const q = metaDe(o.id, o.v); if (q && q.h > 110 && q.h < 320 && q.w < 110) n.set(o.id + '|' + o.v, (n.get(o.id + '|' + o.v) ?? 0) + 1); }
  return [...n.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
};


// ------------------------------------------------------------------ el cartel del acto que empieza
export const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** El nombre de cada acto (el de su carta). */
export const NOMBRE_ACTO: Record<number, [string, string]> = { 1: ['El Valle de Velmora', 'The Vale of Velmora'], 2: ['Las Arenas de Sahrim', 'The Sands of Sahrim'], 3: ['La Selva de Yhuantl', 'The Jungle of Yhuantl'], 4: ['Los Picos de Hrimgard', 'The Peaks of Hrimgard'], 5: ['La Herida', 'The Wound'], 6: ['Ysmeral, la Ciudad Ahogada', 'Ysmeral, the Drowned City'], 7: ['La Corona del Dios Sediento', 'The Crown of the Thirsting God'] };
/** El cartel del acto que empieza, solo (al entregar la misión del acto: la transición). Devuelve true al terminar. */
export function cartelActo(acto: number, t: number, dur = 6.5): boolean { cartel(t, dur, acto); return t >= dur; }
export function cartel(tl: number, dur: number, acto = 2) {
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const k = Math.min(1, Math.max(0, (tl - 0.4) / 1.2), Math.max(0, (dur - tl) / 1.2));
  const tam = Math.round(H / 9), S = (IDI ? 'ACT ' : 'ACTO ') + ROMANO[acto], ty = Math.round(H * 0.47);
  // (como los renglones del menú: la grilla de la letra y la del canto de brasa son la misma)
  const A = ctx.getTransform().a, kp = puntoGotico(tam, A), cel = kp / A, hierro = lienzoGotico(S, 'hierro'), r = hierro.r;
  const tx = Math.round(W / 2 - ((r.w - 4) * cel) / 2), ox = tx - 2 * cel, oy = ty - (r.base + 1) * cel;
  ctx.save(); ctx.globalAlpha = k;
  // un resplandor de brasa detrás (es luz: blando)
  { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const R = (r.w * cel) * 0.7, g = ctx.createRadialGradient(W / 2, ty - tam * 0.4, 0, W / 2, ty - tam * 0.4, R); g.addColorStop(0, `rgba(255,90,30,${0.22 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  brasaRenglon('cine_acto', S, tam, TITULO, tx, ty, k, tl, 'atras', true);
  pegarPixel(hierro.c, ox, oy, kp, k * 0.35);
  pegarPixel(lienzoGotico(S, 'brasa').c, ox, oy, kp, k);
  brasaRenglon('cine_acto', S, tam, TITULO, tx, ty, k, tl, 'adelante', true);
  const k2 = Math.min(1, Math.max(0, (tl - 1.4) / 1.2), Math.max(0, (dur - tl) / 1.2));
  ctx.globalAlpha = k2;
  textoGotico(NOMBRE_ACTO[acto][IDI ? 1 : 0].toUpperCase(), W / 2, Math.round(H * 0.62), Math.round(H / 26), { alin: 'center', tono: 'oro', brillo: 0.3 });
  ctx.restore();
}

/** El ancla en la boca de una salida (la puerta de un monumento, la escalera). */
export const anclaSalida = (destino: string) => (z: Zona): [number, number] => { const sa = z.salidas.find((q) => q.destino === destino); return sa ? [sa.cx + 0.5, sa.cy + 0.5] : [z.W / 2, z.H / 2]; };
/**
 * Un tramo de agua con orilla delante (a +y, hacia la cámara): la baldosa de `piso` con más agua a los lados y tierra justo
 * delante. Devuelve el medio de esa baldosa. Sirve para el muelle y para lo que camina sobre el agua.
 */
export const anclaAgua = (piso: RegExp, conOrilla = true) => (z: Zona): [number, number] => {
  const es = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && piso.test(z.pisos[ty * z.tw + tx]?.id ?? '');
  const tierra = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && !!z.pisos[ty * z.tw + tx] && !es(tx, ty);
  let mejor: [number, number] | null = null, nota = -1;
  for (let ty = 2; ty < z.th - 2; ty++) for (let tx = 2; tx < z.tw - 2; tx++) {
    if (!es(tx, ty)) continue;
    // agua alrededor (5 x 5 baldosas: un canal ancho o una charca, no un charco suelto)
    let n = 0; for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (es(tx + dx, ty + dy)) n++;
    // con orilla: tierra justo delante (+y), de donde se sube a la barca
    const orilla = conOrilla ? (tierra(tx, ty + 1) ? 8 : tierra(tx + 1, ty + 1) || tierra(tx - 1, ty + 1) ? 4 : -20) : 0;
    const centro = -Math.hypot(tx - z.tw / 2, ty - z.th / 2) * 0.05;
    if (n + orilla + centro > nota) { nota = n + orilla + centro; mejor = [tx * 5 + 2.5, ty * 5 + 2.5]; }
  }
  return mejor ?? [z.W / 2, z.H / 2];
};
/**
 * Una silueta echada en el piso: el cuadro `q` en negro, aplastado sobre el suelo con su ancla en (px, py) de la pantalla del
 * mundo, la cabeza hacia (ax, ay) (en puntos por punto de alto: -0.7, -0.3 la echa hacia atrás a la izquierda) y `k` de alfa.
 */
export function siluetaEnPiso(q: any, px: number, py: number, ax: number, ay: number, k: number, color = '#050306') {
  if (!q || k <= 0.01) return;
  ctx.save(); ctx.globalAlpha = k; ctx.translate(Math.round(px), Math.round(py)); ctx.transform(1, 0, -ax, -ay, 0, 0);
  dibujarTenidoK(q, color); ctx.restore();
}
import { dibujarTenido } from '../motor/assets';
const dibujarTenidoK = (q: any, color: string) => dibujarTenido(ctx, q, 0, 0, color, 1, 1);
