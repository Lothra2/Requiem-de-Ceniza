// El tajo del cuerpo a cuerpo (Rick, 19 nov 2026, tercera pasada: "la media luna del tajo es chica, sobre todo el Tajo
// salvaje"). Como en Diablo 2 remasterizado: el golpe deja una media luna ancha y pesada que sigue el barrido de verdad
// del arma (la hoja de cada cuadro horneado, `q.hoja`: la mano y la punta), a la medida del alcance del arma, con el
// cuerpo oscuro que tapa (se lee sobre arena y sobre nieve), un tramo del color del poder y el filo encendido. La punta
// de adelante es gruesa y viva, la cola se afina y se apaga. Cada golpe tiene lo suyo: el hacha del berserker barre
// grueso y rojo, el Hachazo de barrido abre un segundo arco, la Ejecución es negra y carmesí, el Desgarro rasga en tres,
// la luz del templario es de oro (el Corte del sello deja runas por el arco), la lanza de la cazadora es una estocada
// larga, los puños del monje son conos de golpe con su anillo de choque (rayo, fuego, piedra, eco), el Golpe de escudo
// empuja una cuña de aire, las garras del druida son tres rayas paralelas y la Mordida dos fauces que se cierran, y el
// Remolino de hierro es un aro de acero que gira alrededor del cuerpo.
// Todo a puntos enteros (rectángulos de 1 punto en caminos por capa) y justo después del cuerpo que golpea.
// `__sinTajos` vuelve a la estela fina de antes.
import type { Juego } from '../juego/mundo';
import type { Cuadro } from '../motor/assets';
import { E } from '../nucleo/lienzo';
import { nochePfx } from './pfx';
import { HABILIDADES } from '../datos/clases';
import { poderesVivos } from './poderes_vivos';

type Forma = 'arco' | 'estocada' | 'garra' | 'mordida' | 'puno' | 'escudo';
export interface EstTajo { forma: Forma; cuerpo: string; medio: string; filo: string; k: number; ancho: number; dur: number; extra?: 'barrido' | 'runas' | 'rasgar' | 'rayo' | 'fuego' | 'piedra' | 'eco' | 'doble' }
const T = (forma: Forma, cuerpo: string, medio: string, filo: string, k: number, ancho: number, dur = 0.24, extra?: EstTajo['extra']): EstTajo => ({ forma, cuerpo, medio, filo, k, ancho, dur, extra });
export const TAJO: Record<string, EstTajo> = {
  // berserker: hachas pesadas
  ataque: T('arco', '#2c2e38', '#a8b0c4', '#ffffff', 1.2, 7, 0.18),
  tajo_salvaje: T('arco', '#480c04', '#e2542a', '#fff2d8', 1.6, 18, 0.34),
  doble_golpe: T('arco', '#3e1206', '#e07a30', '#fff4e0', 1.42, 12, 0.2, 'doble'),
  hachazo_ancho: T('arco', '#3a1a08', '#d8963e', '#fff0c8', 1.85, 15, 0.3, 'barrido'),
  ejecucion: T('arco', '#140002', '#a00818', '#ff6a5a', 1.55, 16, 0.32),
  desgarro: T('arco', '#360406', '#c41422', '#ff9a8a', 1.38, 11, 0.24, 'rasgar'),
  sangria: T('arco', '#2a0206', '#d02030', '#ffb4a4', 1.42, 13, 0.26),
  // templario: espada y luz
  golpe_sagrado: T('arco', '#583808', '#ffc840', '#fffbe0', 1.45, 13, 0.26),
  celo: T('arco', '#262a36', '#c4cce4', '#ffffff', 1.32, 9, 0.16, 'doble'),
  filo_alba: T('arco', '#6a2808', '#ff9c42', '#fff4c4', 1.5, 13, 0.26),
  corte_sello: T('arco', '#3a2a08', '#e8c050', '#fffae0', 1.48, 12, 0.3, 'runas'),
  juicio: T('arco', '#4a3006', '#ffd860', '#ffffff', 1.7, 18, 0.3),
  sentencia_final: T('arco', '#5a3a00', '#ffe486', '#ffffff', 1.85, 21, 0.34),
  golpe_escudo: T('escudo', '#262a36', '#a8b8d8', '#ffffff', 1, 12, 0.24),
  // cazadora: lanza
  estocada: T('estocada', '#2a2418', '#dccca4', '#ffffff', 2.5, 9, 0.26),
  furia_lanza: T('estocada', '#3a1a08', '#ffb060', '#fff4d8', 2.5, 9, 0.24, 'doble'),
  // monje: puños
  puno_rayo: T('puno', '#1a2a74', '#8ab0ff', '#ffffff', 1, 6, 0.2, 'rayo'),
  rafaga_golpes: T('puno', '#3a2a1a', '#e8d8b0', '#ffffff', 1, 5, 0.16, 'doble'),
  codo_piedra: T('puno', '#3a3024', '#c8b48e', '#fff4e0', 1.1, 7, 0.22, 'piedra'),
  palma_dragon: T('puno', '#6a1606', '#ff7a20', '#fff0b0', 1.2, 8, 0.24, 'fuego'),
  puno_eco: T('puno', '#1a2a74', '#a0c0ff', '#ffffff', 1, 6, 0.3, 'eco'),
  rodilla_volcan: T('puno', '#5a1004', '#ff6010', '#ffe080', 1.15, 8, 0.24, 'fuego'),
  puno_dios: T('puno', '#2a2a74', '#c8d8ff', '#ffffff', 1.35, 10, 0.3, 'rayo'),
  // druida: fauces y garras
  mordida_rabiosa: T('mordida', '#3a0a06', '#e8dcc0', '#ffffff', 1, 4, 0.22),
  zarpazo_oso: T('garra', '#2a1a0a', '#c89a5a', '#fff0d0', 1.6, 3, 0.26),
  frenesi_luna: T('garra', '#18264a', '#b8d0ff', '#ffffff', 1.35, 2, 0.2, 'doble'),
};
const HABS = new Map(HABILIDADES.map((h) => [h.id, h]));
export const tajosVivos = () => poderesVivos() && !(window as any).__sinTajos;
/** El estilo del tajo de un poder (o del golpe con el arma), si es cuerpo a cuerpo. */
export function estiloTajo(id: string): EstTajo | null { return TAJO[id] ?? null; }

type Muestra = [number, number, number, number, number]; // mano x, y, punta x, y, segundos
interface Estado { s: Muestra[]; ult: string; atq: number; hab: string }
const estados = new WeakMap<object, Estado>();
const DV: Record<string, [number, number]> = { s: [1, 1], so: [0, 1], o: [-1, 1], no: [-1, 0], n: [-1, -1], ne: [0, -1], e: [1, -1], se: [1, 0] };
/** Rumbo en pantalla al que mira el cuerpo. */
function frente(dir: string): [number, number] { const [vx, vy] = DV[dir] ?? [1, 1], x = vx - vy, y = (vx + vy) / 2, l = Math.hypot(x, y) || 1; return [x / l, y / l]; }

// ------------------------------------------------------------------ rasterizado por capas
/** Junta rectángulos por color y fuerza (cuatro escalones de alfa por color) y los pinta en un camino cada uno. */
class Capas {
  m = new Map<string, number[]>();
  add(c: string, a: number, x: number, y: number, w = 1, h = 1) { const q = Math.min(3, Math.max(0, Math.round(a * 4) - 1)); if (a < 0.08) return; const k = c + '|' + q; let l = this.m.get(k); if (!l) { l = []; this.m.set(k, l); } l.push(x, y, w, h); }
  pintar(ctx: CanvasRenderingContext2D, aditivo: (c: string) => boolean, kd: number) {
    for (const [k, l] of this.m) { const [c, q] = k.split('|'), ad = aditivo(c); ctx.globalCompositeOperation = ad ? 'lighter' : 'source-over'; ctx.globalAlpha = ((+q + 1) / 4) * (ad ? kd : 1); ctx.fillStyle = c; ctx.beginPath(); for (let i = 0; i < l.length; i += 4) ctx.rect(l[i], l[i + 1], l[i + 2], l[i + 3]); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; this.m.clear();
  }
}
const capas = new Capas();
const kdia = () => 0.55 + 0.45 * nochePfx();

/** Una media luna de a radios: para cada paso del barrido, de adentro (cuerpo oscuro) a afuera (filo). */
function mediaLuna(est: EstTajo, pts: { cx: number; cy: number; an: number; r: number; edad: number }[], ancho: number, lineas = 1) {
  const paso = E.tactil ? 2 : 1;
  for (let i = 0; i < pts.length; i += 1) {
    const p = pts[i], v = Math.max(0, 1 - p.edad / est.dur); if (v <= 0) continue; const a = Math.min(1, v * 1.8);
    // forma de media luna: fina en la cola, gruesa pasando la mitad, y se afina con la edad
    const f0 = i / Math.max(1, pts.length - 1), perfil = 0.18 + 0.82 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + f0 * 0.8)), 0.7), w = Math.max(2, ancho * Math.pow(v, 0.4) * perfil);
    const ca = Math.cos(p.an), sa = Math.sin(p.an) * 0.86;
    for (let ln = 0; ln < lineas; ln++) {
      const rOut = p.r - ln * (ancho + 3), rIn = rOut - (lineas > 1 ? Math.max(2, w * 0.5) : w);
      for (let r = rIn; r <= rOut; r += paso) {
        const f = (r - rIn) / Math.max(1, rOut - rIn), x = Math.round(p.cx + ca * r), y = Math.round(p.cy + sa * r);
        if (rOut - r < (w > 9 ? 2.5 : 1.5)) capas.add(est.filo, Math.min(1, a * 1.4), x, y, paso, paso);
        else if (f > 0.58) capas.add(est.medio, a, x, y, paso, paso);
        else capas.add(est.cuerpo, a * (0.7 + 0.3 * f), x, y, paso, paso);
      }
    }
  }
}

/** Si el héroe pega cuerpo a cuerpo con estilo propio (entonces no va la estela fina de siempre). */
export function tajoAplica(j: Juego): boolean { if (!tajosVivos()) return false; const h = j.heroe, id = h.habActual, hb = HABS.get(id); if (h.c.distancia && (id === 'ataque' || !hb)) return false;
  // (el golpe de puño del monje sin poder sigue con sus líneas de velocidad de siempre)
  if (id === 'ataque' && h.d.clase === 'monje') return false; return !!(TAJO[id] ?? (hb && hb.tipo === 'golpe')) || ((h as any).torbellino > 0); }
/** El golpe cuerpo a cuerpo del héroe con un poder (o con el arma). Devuelve false si no le toca (sigue la estela de siempre). */
export function tajoHeroe(ctx: CanvasRenderingContext2D, j: Juego, e: any, q: Cuadro, px: number, py: number, esc: number, tiempo: number): boolean {
  if (!tajosVivos()) return false;
  const h = j.heroe, id = h.habActual, hb = HABS.get(id);
  if (h.c.distancia && (id === 'ataque' || !hb)) return false;
  const est = TAJO[id] ?? (hb && (hb.tipo === 'golpe') ? T('arco', '#2c2e38', hb.color, '#ffffff', 1.35, 10) : null); if (!est) return false;
  let st = estados.get(e); if (!st) { st = { s: [], ult: '', atq: -1, hab: id }; estados.set(e, st); }
  const pegando = e.acc === 'atacar';
  if (pegando && e.t < 0.05 && st.atq !== Math.floor(tiempo * 4)) { st.s.length = 0; st.atq = Math.floor(tiempo * 4); st.hab = id; }
  if (pegando && st.hab !== id) { st.s.length = 0; st.hab = id; }
  const e2 = TAJO[st.hab] ?? est;
  if (!pegando && (!st.s.length || tiempo - st.s[st.s.length - 1][4] > e2.dur)) { st.s.length = 0; return st.hab !== 'ataque' || !!TAJO.ataque; }
  const hj = q.hoja; let fx: number, fy: number;
  [fx, fy] = frente(e.dir);
  const prog = e.dur ? Math.min(1, e.t / e.dur) : 0.5;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (e2.forma === 'arco' || e2.forma === 'estocada') {
    if (pegando && hj) { const k = `${hj[0]},${hj[1]},${hj[2]},${hj[3]}`; if (k !== st.ult) { st.ult = k; st.s.push([hj[0] * esc, hj[1] * esc, hj[2] * esc, hj[3] * esc, tiempo]); if (st.s.length > 10) st.s.shift(); } }
    const s = st.s; if (s.length < 2 && !(e2.forma === 'estocada' && s.length)) { ctx.restore(); return true; }
    // ¿barre o empuja? lo que gira poco es una estocada (la lanza, los golpes de punta)
    let giro = 0; for (let i = 1; i < s.length; i++) { let d = Math.atan2(s[i][3] - s[i][1], s[i][2] - s[i][0]) - Math.atan2(s[i - 1][3] - s[i - 1][1], s[i - 1][2] - s[i - 1][0]); while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283; giro += d; }
    if (e2.forma === 'estocada' || Math.abs(giro) < 0.45) estocada(ctx, e2, s, px, py, tiempo);
    else arcoBarrido(ctx, e2, s, px, py, tiempo, Math.round(q.ay * esc * 0.5));
  } else if (e2.forma === 'puno') puno(ctx, e2, e, hj ?? null, px, py, fx, fy, prog, tiempo, esc);
  else if (e2.forma === 'escudo') cunaEscudo(ctx, e2, px, py, fx, fy, prog);
  else if (e2.forma === 'garra' || e2.forma === 'mordida') garras(ctx, e2, px, py, fx, fy, prog, e.dir, esc);
  capas.pintar(ctx, (c) => c === e2.medio, kdia());
  ctx.restore();
  return true;
}

function arcoBarrido(ctx: CanvasRenderingContext2D, est: EstTajo, s: Muestra[], px: number, py: number, tiempo: number, pecho: number) {
  // el arco gira alrededor del pecho (no de la mano, que también viaja): pasa por la punta del arma de cada cuadro y se
  // abre un poco más allá de ella, a la medida del alcance (con un piso para las dagas)
  const cy0 = -pecho, ang = (m: Muestra) => Math.atan2((m[3] - cy0) / 0.86, m[2]), rad = (m: Muestra) => Math.max(26, Math.hypot(m[2], (m[3] - cy0) / 0.86) * (0.8 + 0.25 * est.k) + 4);
  const pts: { cx: number; cy: number; an: number; r: number; edad: number }[] = [];
  // solo el golpe, no el levantar del arma: el tramo seguido que gira para el mismo lado más rápido y con la punta bajando
  let mejor = [0, s.length - 1], mv = -1, i0 = 0, sg = 0, tot = 0;
  for (let i = 1; i <= s.length; i++) {
    let d = i < s.length ? ang(s[i]) - ang(s[i - 1]) : 0; while (d > Math.PI) d -= 6.283; while (d < -Math.PI) d += 6.283;
    const sgn = Math.abs(d) < 0.03 ? sg : Math.sign(d);
    if (i === s.length || (sg && sgn !== sg)) { const dur = Math.max(0.03, s[i - 1][4] - s[i0][4]), baja = s[i - 1][3] - s[i0][3], v = baja < -3 || Math.abs(tot) < 0.35 ? -1 : Math.abs(tot) / dur * Math.min(1, Math.abs(tot) / 0.8); if (v > mv) { mv = v; mejor = [i0, i - 1]; } i0 = i - 1; tot = 0; }
    sg = sgn; tot += d;
  }
  if (mv < 0) return; // (todavía levanta el arma: el golpe no salió)
  for (let i = mejor[0] + 1; i <= mejor[1]; i++) {
    const a = s[i - 1], b = s[i], a0 = ang(a), ra = rad(a), rb = rad(b); let da = ang(b) - a0; while (da > Math.PI) da -= 6.283; while (da < -Math.PI) da += 6.283;
    const n = Math.max(1, Math.ceil(Math.abs(da) * Math.max(ra, rb) / (E.tactil ? 2 : 1)));
    for (let k = 0; k < n; k++) { const u = k / n; pts.push({ cx: px, cy: py + cy0, an: a0 + da * u, r: ra + (rb - ra) * u, edad: tiempo - (Math.max(a[4], b[4] - 0.06) + (b[4] - Math.max(a[4], b[4] - 0.06)) * u) }); }
  }
  if (!pts.length) return;
  mediaLuna(est, pts, est.ancho, est.extra === 'rasgar' ? 3 : 1);
  // el Hachazo de barrido abre un segundo arco más afuera, más tenue (el que alcanza a los de alrededor)
  if (est.extra === 'barrido') mediaLuna({ ...est, dur: est.dur * 0.8 }, pts.map((p) => ({ ...p, r: p.r * 1.32, edad: p.edad + 0.04 })), est.ancho * 0.45);
  // la punta de adelante: un destello que va con la hoja
  const f = pts[pts.length - 1], a = Math.max(0, 1 - f.edad / est.dur);
  if (a > 0) { const x = Math.round(f.cx + Math.cos(f.an) * f.r), y = Math.round(f.cy + Math.sin(f.an) * f.r * 0.86); capas.add(est.filo, a, x - 2, y, 5, 1); capas.add(est.filo, a, x, y - 2, 1, 5); }
  // el Corte del sello deja runas por el arco
  if (est.extra === 'runas') for (let i = 6; i < pts.length; i += 9) { const p = pts[i], a2 = Math.max(0, 1 - p.edad / (est.dur * 1.4)); if (a2 <= 0) continue; const r = p.r - est.ancho * 0.5, x = Math.round(p.cx + Math.cos(p.an) * r), y = Math.round(p.cy + Math.sin(p.an) * r * 0.86), g = RUNAS[(i / 9 | 0) % RUNAS.length];
    for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 3; xx++) if (g[yy] & (4 >> xx)) capas.add('#fff4c0', a2, x - 1 + xx, y - 2 + yy); }
}
const RUNAS = [[7, 2, 2, 2, 7], [5, 5, 7, 2, 2], [2, 5, 7, 5, 5], [7, 1, 7, 4, 7], [6, 5, 6, 5, 6]];

function estocada(ctx: CanvasRenderingContext2D, est: EstTajo, s: Muestra[], px: number, py: number, tiempo: number) {
  // una raya larga y afilada en el rumbo de la hoja, más allá de la punta: gruesa atrás, aguja adelante
  const b = s[s.length - 1], edad = tiempo - b[4], a = Math.max(0, 1 - edad / est.dur); if (a <= 0) return;
  const dx = b[2] - b[0], dy = b[3] - b[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, largo = Math.max(44, L * est.k), x0 = px + b[0] + ux * L * 0.4, y0 = py + b[1] + uy * L * 0.4;
  const n = Math.round(largo), paso = E.tactil ? 2 : 1;
  const raya = (desv: number, k: number) => { for (let i = 0; i < n; i += paso) { const f = i / n, w = Math.max(1, Math.round(est.ancho * k * Math.sin(Math.PI * Math.min(1, f * 1.25)) * (1 - f * 0.6) * (0.4 + 0.6 * a))), cx = x0 + ux * i + nx * desv, cy = y0 + uy * i + ny * desv;
      for (let q = -w; q <= w; q += paso) { const x = Math.round(cx + nx * q), y = Math.round(cy + ny * q * 0.86), borde = Math.abs(q) >= w - 0.5; capas.add(borde ? est.cuerpo : Math.abs(q) < 1 ? est.filo : est.medio, a * (borde ? 0.8 : 0.95), x, y, paso, paso); } } };
  raya(0, 1); if (est.extra === 'doble') raya(est.ancho * 1.6, 0.5);
  const tx = Math.round(x0 + ux * largo), ty = Math.round(y0 + uy * largo); capas.add(est.filo, a, tx - 3, ty, 7, 1); capas.add(est.filo, a, tx, ty - 2, 1, 5);
}

function puno(ctx: CanvasRenderingContext2D, est: EstTajo, e: any, hj: number[] | null, px: number, py: number, fx: number, fy: number, prog: number, tiempo: number, esc: number) {
  // el puño sale del hombro: un cono de golpe hacia adelante y, en lo más extendido, un anillo de choque
  const ventana = prog > 0.25 && prog < 0.8; if (!ventana) return;
  const u = (prog - 0.25) / 0.55, z = 30 * esc, sale = Math.min(1, u * 2.2), a = u < 0.5 ? 1 : Math.max(0, 1 - (u - 0.5) / 0.5);
  const hx = hj ? px + hj[2] * esc : px + fx * 14, hy = hj ? py + hj[3] * esc : py - z + fy * 7, x0 = hx - fx * 26 * sale, y0 = hy - fy * 26 * sale, nx = -fy, ny = fx;
  const n = Math.round(30 * sale * est.k), paso = E.tactil ? 2 : 1;
  for (let i = 0; i < n; i += paso) { const f = i / Math.max(1, n), w = Math.max(1, Math.round(est.ancho * 0.5 * f)), cx = x0 + fx * i, cy = y0 + fy * i;
    for (let q = -w; q <= w; q += paso) { const borde = Math.abs(q) >= w; capas.add(borde ? est.filo : f > 0.7 ? est.medio : est.cuerpo, a * (0.3 + 0.7 * f), Math.round(cx + nx * q), Math.round(cy + ny * q), paso, paso); } }
  // el anillo de choque en el puño (la onda del Puño del eco son tres que salen una detrás de otra)
  const anillos = est.extra === 'eco' ? 3 : 1;
  for (let k = 0; k < anillos; k++) { const v = u * 1.6 - k * 0.3; if (v <= 0 || v > 1) continue; const rr = (5 + v * 13) * est.k, aa = (1 - v) * a;
    for (let i = 0; i < 28; i += 1) { const an = (i / 28) * 6.283, ox = Math.cos(an) * rr * 0.45, oy = Math.sin(an) * rr; // de canto, mirando al frente
      const x = Math.round(hx + fx * (v * 10 + ox) + nx * oy), y = Math.round(hy + fy * (v * 10 + ox) * 0.86 + ny * oy * 0.86); capas.add(i % 2 ? est.medio : est.filo, aa, x, y); } }
  // lo del elemento en el puño
  const r = (k: number) => { const s = Math.sin((Math.floor(tiempo * 24) + k) * 12.9898) * 43758.5453; return s - Math.floor(s); };
  if (est.extra === 'rayo') { let x = hx, y = hy; for (let i = 0; i < 9; i++) { x += (r(i) - 0.5) * 6 + fx * 2; y += (r(i + 20) - 0.5) * 6; capas.add(i % 3 ? est.medio : est.filo, a, Math.round(x), Math.round(y)); } }
  if (est.extra === 'fuego') for (let i = 0; i < 18; i++) { const an = r(i) * 6.283, d = r(i + 40) * 8 * sale, x = Math.round(hx + fx * d * 1.2 + Math.cos(an) * d * 0.5), y = Math.round(hy + fy * d - r(i + 70) * 6); capas.add(i % 3 === 0 ? est.filo : i % 3 === 1 ? est.medio : '#c03008', a, x, y, 2, 1); }
  if (est.extra === 'piedra') for (let i = 0; i < 10; i++) { const an = r(i) * 6.283, d = 4 + r(i + 30) * 10 * u; capas.add(i % 2 ? '#8a7a62' : '#5a4e40', a, Math.round(hx + Math.cos(an) * d), Math.round(hy + Math.sin(an) * d * 0.6), 2, 2); }
}

function cunaEscudo(ctx: CanvasRenderingContext2D, est: EstTajo, px: number, py: number, fx: number, fy: number, prog: number) {
  // el escudo empuja: tres cheurones de aire que salen del pecho hacia adelante
  if (prog < 0.3 || prog > 0.95) return; const u = (prog - 0.3) / 0.65, nx = -fy, ny = fx, cx = px + fx * 8, cy = py - 28 + fy * 4;
  for (let k = 0; k < 3; k++) { const v = u * 1.4 - k * 0.18; if (v <= 0 || v > 1) continue; const d = 6 + v * 34, w = 6 + v * 14, a = (1 - v) * 0.95;
    for (let q = -w; q <= w; q += 1) { const back = Math.abs(q) * 0.55, x = Math.round(cx + fx * (d - back) + nx * q), y = Math.round(cy + fy * (d - back) * 0.86 + ny * q * 0.86); capas.add(est.cuerpo, a * 0.8, x, y + 1); capas.add(Math.abs(q) < 2 ? est.filo : est.medio, a, x, y); } }
}

function garras(ctx: CanvasRenderingContext2D, est: EstTajo, px: number, py: number, fx: number, fy: number, prog: number, dir: string, esc: number) {
  // las bestias no tienen hoja: el barrido sale del pecho, del lado de la zarpa al otro (o las fauces que se cierran)
  if (prog < 0.2) return; const u = Math.min(1, (prog - 0.2) / 0.4), fin = prog > 0.6 ? Math.max(0, 1 - (prog - 0.6) / 0.4) : 1, z = 26 * esc, cx = px + fx * 10, cy = py - z + fy * 5;
  const base = Math.atan2(fy, fx);
  if (est.forma === 'mordida') {
    // dos fauces: una baja y otra sube hasta cerrarse delante de la boca, con colmillos
    const R = 13 * esc, cierra = Math.min(1, u * 1.4), a = fin;
    for (const lado of [-1, 1]) for (let i = 0; i <= 18; i++) { const f = i / 18, an = base + lado * (1 - cierra) * 1.2 + lado * (f - 0.5) * 1.6 * (1 - cierra * 0.5), r = R * (0.6 + 0.4 * Math.sin(f * Math.PI));
      const x = Math.round(cx + fx * 8 + Math.cos(an) * r * 0.5), y = Math.round(cy + fy * 4 + lado * (1 - cierra) * 8 + Math.sin(an) * r * 0.3); capas.add(est.cuerpo, a * 0.85, x, y + 1, 2, 1); capas.add(i % 3 === 0 ? est.filo : est.medio, a, x, y - lado, 1, i % 3 === 0 ? 2 : 1); }
    return;
  }
  const R = 22 * est.k * esc, lado = (dir.length + (prog > 0.5 ? 1 : 0)) % 2 ? 1 : -1, ab = 1.9, pts: { cx: number; cy: number; an: number; r: number; edad: number }[] = [], N = Math.round(ab * R);
  for (let i = 0; i <= N * u; i++) { const f = i / N; pts.push({ cx, cy, an: base + lado * (f - 0.5) * ab, r: R, edad: (u - f) * 0.3 * (1 / fin) }); }
  // tres rayas paralelas (las uñas)
  mediaLuna({ ...est, dur: 0.3 }, pts, est.ancho, 3);
}

/** El Remolino de hierro: un aro de acero que gira alrededor del cuerpo. `atras` dibuja la mitad de atrás (antes del cuerpo). */
export function torbellinoAro(ctx: CanvasRenderingContext2D, j: Juego, px: number, py: number, tiempo: number, atras: boolean) {
  if (!tajosVivos() || !((j.heroe as any).torbellino > 0)) return;
  const est = TAJO.tajo_salvaje, gir = tiempo * 15, R = 44, z = 22, pts: { cx: number; cy: number; an: number; r: number; edad: number }[] = [];
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let b = 0; b < 2; b++) for (let i = 0; i < 70; i++) { const f = i / 70, an = gir + b * Math.PI - f * 2.4; if ((Math.sin(an) < 0) !== atras) continue; pts.push({ cx: px, cy: py - z, an, r: R, edad: f * 0.2 }); }
  mediaLuna({ ...est, ancho: 13 }, pts, 13);
  // el aro va aplastado como el piso: se dibuja con el seno a la mitad
  const sq = new Map<string, number[]>(); for (const [k, l] of capas.m) { for (let i = 1; i < l.length; i += 4) l[i] = Math.round(py - z + (l[i] - (py - z)) * 0.55); sq.set(k, l); }
  capas.pintar(ctx, (c) => c === est.medio, kdia());
  ctx.restore();
}
