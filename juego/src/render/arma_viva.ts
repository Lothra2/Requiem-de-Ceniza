// Armas vivas: lo que un arma con poder propio hace sola, puesta en la mano. Todo se arma sobre el tramo vivo de cada
// cuadro (el que arma el motor con `filoDe`: la hoja, la cabeza del hacha o la maza, el remate del báculo, la gema de la
// varita; ver motor/hoja.ts) y su máscara de tramos que se ven, a puntos enteros, como el sprite:
//
//   el filo    el núcleo que se lee de lejos: el tramo encendido de su color, con un brillo que lo recorre distinto por
//              elemento (calor que sube, destellos de escarcha, chispazos, icor que late, sombra que respira, oro, latido)
//   la forma   lo propio de cada elemento pegado al arma: la llama de Doom (fuego, y negra de borde violeta la sombra) en
//              una grilla fija por portador que sigue viva en el golpe (armaArdeViva), cristales de escarcha clavados en
//              el filo y vaho que cae, arcos quebrados que saltan por el filo y a tierra, icor que corre, se junta en lo
//              más bajo y gotea con miasma, runas de oro y la estrella en la punta, sangre que late y cae
//   el golpe   en el vuelo el arma suelta su materia en el aire por donde pasa (queda atrás, en el mundo) y al conectar
//              revienta en el blanco (`golpeVivo`)
//   la luz     la de su elemento en el arma (luces.ts lee `luzViva`), contenida quieto y más fuerte pegando
//
// Los cetros, báculos y varitas llevan además un orbe en la cabeza: una gema con volumen (canto oscuro, núcleo claro
// corrido hacia la luz, brillo duro), motas que la orbitan por delante y por detrás y el elemento saliendo de ella.
// Lo que va detrás del cuerpo no se dibuja: los tramos tapados no echan nada y el orbe tapado no se ve.
import type { Cuadro } from '../motor/assets';
import { armaArdeViva } from './fuego_especial';

export type ElemArma = 'fuego' | 'frio' | 'rayo' | 'veneno' | 'sombra' | 'luz' | 'sangre' | 'acero';
/** Rampa de cada elemento: hondo, oscuro, medio, claro y lo más caliente. */
const RAMPA: Record<ElemArma, [string, string, string, string, string]> = {
  fuego: ['#4a0c04', '#b02808', '#ff6a18', '#ffc444', '#fff6d0'],
  frio: ['#0c2450', '#2464c8', '#58b4ff', '#bfeaff', '#ffffff'],
  rayo: ['#180e58', '#4a38d8', '#8c8cff', '#dcdcff', '#ffffff'],
  veneno: ['#0c2806', '#2a7010', '#5cc420', '#b4f264', '#ecffc4'],
  sombra: ['#07020c', '#2a0a48', '#7a2ab8', '#c484ff', '#f2dcff'],
  luz: ['#4a3008', '#b8862a', '#ffd060', '#fff0b4', '#ffffff'],
  sangre: ['#160002', '#560006', '#a00c12', '#e02c22', '#ff9a88'],
  acero: ['#202830', '#5e6874', '#a8b8c8', '#e2e7eb', '#ffffff'],
};
/** Color de la luz de cada elemento (r,g,b), para luces.ts y la estela. */
export const LUZ_RGB: Record<ElemArma, [number, number, number]> = {
  fuego: [255, 122, 40], frio: [120, 196, 255], rayo: [190, 180, 255], veneno: [110, 230, 70], sombra: [150, 70, 230], luz: [255, 226, 150], sangre: [220, 40, 34], acero: [220, 230, 240],
};
const LANZA = /baculo|cetro|varita/;

// ------------------------------------------------------------------ azar propio (no toca el de la partida)
let semilla = 0x9e3779b9;
const A = () => { semilla ^= semilla << 13; semilla ^= semilla >>> 17; semilla ^= semilla << 5; return ((semilla >>> 0) % 100000) / 100000; };
/** Ruido fijo de un entero (los arcos y las chispas cambian de forma por tramos de tiempo, no en cada cuadro). */
const H = (n: number) => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };

// ------------------------------------------------------------------ partículas (en pixeles del mundo: quedan atrás)
type Clase = 'llama' | 'humo' | 'brasa' | 'gota' | 'mancha' | 'vaho' | 'cristal' | 'chispa' | 'burbuja' | 'mota' | 'esquirla' | 'anillo' | 'estrella' | 'miasma';
interface P { x: number; y: number; vx: number; vy: number; t: number; dur: number; k: Clase; el: ElemArma; piso: number; tam: number; s: number }
const psMundo: P[] = [];
let ps = psMundo;
/** Cambia la bolsa de partículas (el muñeco del inventario lleva la suya: lo que suelta su arma no cae en el mundo).
 * Sin argumento vuelve a la del mundo. */
export function pozoArma(p?: unknown[]) { ps = (p as P[] | undefined) ?? psMundo; }
const MAX = 420;
function echar(p: P) { if (ps.length < MAX) ps.push(p); }
const acum = new Map<string, number>();
/** Cuántas salen este cuadro a razón de `porSeg` (con el resto guardado: no depende de los cuadros por segundo). */
function cuota(clave: string, porSeg: number, dt: number): number { const a = (acum.get(clave) ?? 0) + porSeg * dt, n = Math.floor(a); acum.set(clave, a - n); return n; }

// ------------------------------------------------------------------ estado por arma (por quien la lleva)
interface Estado { prev: [number, number, number, number] | null; act: number; ult: number; gota: number; gotaU: number; rayo: number; arcoT: number }
const estados = new WeakMap<object, Estado>();
function estado(e: object): Estado { let s = estados.get(e); if (!s) { s = { prev: null, act: 0.5, ult: 0, gota: 0, gotaU: 1, rayo: 0, arcoT: -9 }; estados.set(e, s); } return s; }

/** La luz del arma viva del héroe (en pixeles del mundo, relativos al origen), para luces.ts. `golpe` es el último impacto. */
export const luzViva: { on: boolean; x: number; y: number; h: number; k: number; c: [number, number, number]; golpe: { x: number; y: number; t: number; c: [number, number, number] } | null } = { on: false, x: 0, y: 0, h: 40, k: 0, c: [255, 255, 255], golpe: null };
/** El color del elemento para la luz del piso. */
export function colorArma(elem: string): string { return (RAMPA[elem as ElemArma] ?? RAMPA.acero)[2]; }
/** Colores de la estela del golpe para un elemento: cuerpo, filo y fuerza. */
export function estiloEstela(elem: string): { cuerpo: string; filo: string; centro: string; k: number } | null {
  const r = RAMPA[elem as ElemArma]; if (!r) return null;
  const rgb = (h: string) => `${parseInt(h.slice(1, 3), 16)},${parseInt(h.slice(3, 5), 16)},${parseInt(h.slice(5, 7), 16)}`;
  return { cuerpo: rgb(elem === 'sombra' ? r[2] : r[2]), centro: rgb(r[3]), filo: rgb(elem === 'sombra' ? r[3] : r[4]), k: elem === 'sombra' || elem === 'sangre' ? 0.85 : 1 };
}

// ------------------------------------------------------------------ dibujo a puntos enteros
function punto(ctx: CanvasRenderingContext2D, x: number, y: number, c: string, a: number, w = 1, h = 1) {
  if (a <= 0.01) return; ctx.globalAlpha = a > 1 ? 1 : a; ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
/** Una línea de un punto de grueso, sin suavizado (para arcos, rayos y cristales). */
function linea(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, c: string, a: number) {
  const n = Math.max(1, Math.round(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))); ctx.globalAlpha = a > 1 ? 1 : a; ctx.fillStyle = c;
  for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
}

// ------------------------------------------------------------------ lenguas de llama (pixel art armado una vez)
// Una lengua es una gota invertida de pixeles: punta arriba, panza abajo, el núcleo caliente abajo al centro y el canto
// más oscuro. Cuatro edades (de recién nacida a casi apagada) por tres tamaños, en una lámina fija por elemento: cada
// partícula de llama estampa la suya (drawImage a puntos enteros), así el fuego tiene forma y no es polvo de pixeles.
const LW = 6, LH = 12, TAMS: [number, number][] = [[2, 4], [3, 6], [4, 9]];
const laminas = new Map<string, HTMLCanvasElement>();
function laminaLenguas(el: ElemArma): HTMLCanvasElement {
  const k = el; let cv = laminas.get(k); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = LW * 4; cv.height = LH * 3; const g = cv.getContext('2d')!, r = RAMPA[el];
  for (let s = 0; s < 3; s++) for (let et = 0; et < 4; et++) {
    const [w, h] = TAMS[s], cx = (LW - 1) / 2;
    for (let y = 0; y < h; y++) {
      const t = (y + 0.5) / h, half = (w / 2) * Math.sin(Math.PI * Math.pow(t, 0.62)) + 0.15;
      for (let x = 0; x < LW; x++) {
        const dxp = Math.abs(x - cx); if (dxp > half) continue;
        const rr = dxp / Math.max(0.6, half), canto = rr > 0.7 || y === 0;
        const calor = (1 - rr) * 0.6 + t * 0.55 - et * 0.32 - (canto ? 0.35 : 0);
        g.fillStyle = r[Math.max(0, Math.min(4, Math.round(calor * 4.2)))]; g.fillRect(et * LW + x, s * LH + (LH - h) + y, 1, 1);
      }
    }
  }
  laminas.set(k, cv); return cv;
}
/** Estampa una lengua con el pie en (x, y). */
function lengua(ctx: CanvasRenderingContext2D, el: ElemArma, x: number, y: number, tam: number, et: number, a: number) {
  if (a <= 0.01) return; const s = Math.max(0, Math.min(2, tam)), e2 = Math.max(0, Math.min(3, et));
  ctx.globalAlpha = a > 1 ? 1 : a; ctx.drawImage(laminaLenguas(el), e2 * LW, s * LH, LW, LH, Math.round(x) - 3, Math.round(y) - LH + 1, LW, LH);
}

/** Cómo late el filo de cada elemento en el punto u de la hoja (0 mano, 1 punta). */
function brillo(el: ElemArma, u: number, t: number, sg: number): number {
  switch (el) {
    case 'fuego': return 0.62 + 0.38 * Math.sin(u * 13 - t * 17 + sg);
    case 'frio': return 0.5 + 0.5 * Math.max(0, Math.sin(u * 7 + t * 1.6 + sg)) ** 8 + 0.15 * Math.sin(t * 2 + u * 3);
    case 'rayo': return H(Math.floor(t * 28) * 7 + Math.floor(u * 6)) < 0.45 ? 1 : 0.35;
    case 'veneno': return 0.55 + 0.45 * Math.sin(u * 6 - t * 3.2 + sg);
    case 'sombra': return 0.35 + 0.65 * Math.sin(u * 4.5 + t * 2.1 + sg) ** 2;
    case 'luz': return 0.72 + 0.28 * Math.sin(u * 4 - t * 2.4);
    case 'sangre': { const f = (t - u * 0.35) % 1.15, b = Math.exp(-((f - 0.05) ** 2) / 0.004) + 0.6 * Math.exp(-((f - 0.28) ** 2) / 0.004); return 0.45 + 0.55 * Math.min(1, b); }
    default: { const c = (t % 2.6) / 2.6; return Math.max(0, 1 - Math.abs(u - c / 0.25) * 4) * (c < 0.25 ? 1 : 0); }
  }
}

/**
 * Lo vivo del arma de `e` (el héroe o un enemigo con arma de elemento). Se llama después de dibujar el cuerpo. `ox, oy` es
 * dónde cae el origen del mundo en pantalla. `k` baja la fuerza (los enemigos van más contenidos).
 */
export function armaViva(ctx: CanvasRenderingContext2D, e: { acc: string; t: number; muerto?: boolean }, q: Cuadro, px: number, py: number, esc: number, el: ElemArma, tipo: string, t: number, dt: number, ox: number, oy: number, k = 1, conLuz = false, mascara?: number) {
  if (!q.hoja) return;
  // el tramo vivo que armó el motor (la hoja, la cabeza, el remate o la gema) si el cuadro lo trae; si no, la hoja entera
  const hj = q.hoja as number[], vivo = hj.length >= 9 ? 5 : 0, ve = mascara ?? (hj.length > 4 ? hj[4] : 63);
  const x0 = px + hj[vivo] * esc, y0 = py + hj[vivo + 1] * esc, x1 = px + hj[vivo + 2] * esc, y1 = py + hj[vivo + 3] * esc;
  const r = RAMPA[el] ?? RAMPA.acero, d = Math.min(dt, 0.05), st = estado(e), lanza = LANZA.test(tipo), sg: number = (e as any).id ?? 0;
  // fuerza: contenida quieto, algo más caminando y entera pegando (sube rápido y baja despacio)
  const pega = e.acc === 'atacar' || e.acc === 'lanzar';
  const meta = pega ? 1 : e.acc === 'caminar' || e.acc === 'correr' ? 0.62 : 0.5;
  st.act += (meta - st.act) * Math.min(1, d * (meta > st.act ? 14 : 3));
  const act = st.act * k;
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  const ve_ = (u: number) => (ve >> Math.min(5, Math.floor(u * 6))) & 1;
  const en = (u: number): [number, number] => [x0 + dx * u, y0 + dy * u];
  // la hoja del cuadro anterior (en el mundo): lo que barrió entre uno y otro es por donde suelta materia
  const ahora: [number, number, number, number] = [x0 - ox, y0 - oy, x1 - ox, y1 - oy];
  const prev = st.prev && t - st.ult < 0.12 ? st.prev : ahora;
  st.prev = ahora; st.ult = t;
  const barrido = Math.hypot(ahora[2] - prev[2], ahora[3] - prev[3]);
  const piso = py - oy;
  /** Nace una partícula en el punto u de la hoja (o en lo barrido, con `b` de 0 a 1 entre el cuadro anterior y este). */
  const nace = (kc: Clase, u: number, vx: number, vy: number, dur: number, tam = 1, b = 1, el2 = el) => {
    if (!ve_(u)) return;
    const hx = prev[0] + (ahora[0] - prev[0]) * b, hy = prev[1] + (ahora[1] - prev[1]) * b, tx = prev[2] + (ahora[2] - prev[2]) * b, ty = prev[3] + (ahora[3] - prev[3]) * b;
    echar({ x: hx + (tx - hx) * u + (A() - 0.5) * 1.6, y: hy + (ty - hy) * u + (A() - 0.5) * 1.6, vx, vy, t: 0, dur, k: kc, el: el2, piso: piso + (A() - 0.5) * 6, tam, s: A() * 100 });
  };
  const uAzar = (desde = 0.12) => desde + A() * (1 - desde);
  // el impulso de la hoja: lo que sale en el vuelo sigue un poco el golpe
  const ivx = ((ahora[2] - prev[2]) / Math.max(d, 0.016)) * 0.12, ivy = ((ahora[3] - prev[3]) / Math.max(d, 0.016)) * 0.12;
  const enVuelo = (porPx: number) => (pega && barrido > 2 ? cuota(sg + 'b' + el, barrido * porPx, 1) : 0);

  ctx.save();
  // ---------------------------------------------------------------- el resplandor de la hoja (suave, por debajo)
  if (el !== 'acero') {
    ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (let s = 0; s < 6; s++) {
      if (!((ve >> s) & 1)) continue;
      const [ax, ay] = en(s / 6), [bx, by] = en((s + 1) / 6);
      ctx.strokeStyle = r[2]; ctx.globalAlpha = (el === 'sombra' ? 0.1 : 0.16) * act; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  }
  // ---------------------------------------------------------------- el filo
  ctx.globalCompositeOperation = 'lighter';
  const n = Math.max(2, Math.round(L));
  for (let i = 0; i <= n; i++) {
    const u = i / n; if (!ve_(u) || u < 0.08) continue;
    const w = brillo(el, u, t, sg), x = Math.round(x0 + dx * u), y = Math.round(y0 + dy * u);
    if (el === 'acero') { if (w > 0.02) { punto(ctx, x, y, r[4], w * 0.9); punto(ctx, x + Math.round(nx), y + Math.round(ny), r[3], w * 0.35); } continue; }
    punto(ctx, x, y, w > 0.8 ? r[4] : r[3], (0.3 + 0.55 * w) * (0.55 + 0.45 * act));
    punto(ctx, x + Math.round(nx), y + Math.round(ny), r[2], 0.3 * w * (0.5 + act));
    punto(ctx, x - Math.round(nx), y - Math.round(ny), r[2], 0.2 * w * (0.5 + act));
  }
  // (el destello en cruz cuando el brillo del acero llega a la punta)
  if (el === 'acero') { const c = (t % 2.6) / 2.6; if (c >= 0.25 && c < 0.36 && ve_(0.95)) { const kk = 1 - (c - 0.25) / 0.11, l = Math.round(1 + kk * 4); linea(ctx, x1 - l, y1, x1 + l, y1, r[4], kk); linea(ctx, x1, y1 - l, x1, y1 + l, r[4], kk); } }

  // ---------------------------------------------------------------- la forma de cada elemento
  switch (el) {
    case 'fuego': {
      // la llama es la de Doom en su grilla propia (ver armaArdeViva): acá solo brasas sueltas y humo en lo alto. Los
      // enemigos no llevan grilla (pesa: son muchos): lenguas de pixel que suben del filo
      if (!conLuz) for (let i = cuota(sg + 'f1', 22 + 30 * act, d); i > 0; i--) nace('llama', uAzar(0.15), (A() - 0.5) * 5 + ivx * 0.2, -10 - A() * 14, 0.24 + A() * 0.2, A() < 0.3 ? 2 : A() < 0.75 ? 1 : 0);
      for (let i = cuota(sg + 'f2', 4 + 14 * act, d); i > 0; i--) nace('brasa', uAzar(0.3), (A() - 0.5) * 18 + ivx, -30 - A() * 30, 0.5 + A() * 0.7);
      for (let i = cuota(sg + 'f3', 2 + 3 * act, d); i > 0; i--) nace('humo', uAzar(0.4), (A() - 0.5) * 5, -22 - A() * 10, 0.7 + A() * 0.5, 1);
      break;
    }
    case 'frio': {
      // cristales clavados en el filo, alternando de lado, que crecen hacia la punta y destellan de a uno
      for (let c = 0; c < 6; c++) {
        const u = 0.2 + c * 0.14; if (!ve_(u)) continue;
        const [cx, cy] = en(u), lado = c % 2 ? 1 : -1, lg = 2 + (c % 3 === 1 ? 1 : 0) + (pega ? 1 : 0), ia = 0.35 * (c % 2 ? 1 : -1);
        const ux = nx * lado + (dx / L) * ia, uy = ny * lado + (dy / L) * ia;
        ctx.globalCompositeOperation = 'source-over'; linea(ctx, cx + ux, cy + uy, cx + ux * lg, cy + uy * lg, r[3], 0.85);
        ctx.globalCompositeOperation = 'lighter'; punto(ctx, cx + ux * (lg + 0.4), cy + uy * (lg + 0.4), r[4], 0.9);
        const gl = Math.max(0, Math.sin(t * 2.2 - c * 1.3)) ** 12;
        if (gl > 0.2) { const tx = Math.round(cx + ux * lg), ty = Math.round(cy + uy * lg); punto(ctx, tx - 1, ty, r[4], gl * 0.7); punto(ctx, tx + 1, ty, r[4], gl * 0.7); punto(ctx, tx, ty - 1, r[4], gl * 0.7); punto(ctx, tx, ty + 1, r[4], gl * 0.7); }
      }
      // el vaho que cae pesado de la hoja y la escarcha que titila al caer
      for (let i = cuota(sg + 'h1', 16 + 26 * act, d); i > 0; i--) nace('vaho', uAzar(0.15), (A() - 0.5) * 6, 7 + A() * 9, 0.8 + A() * 0.7, A() < 0.4 ? 2 : 1);
      for (let i = cuota(sg + 'h2', 4 + 10 * act, d); i > 0; i--) nace('cristal', uAzar(0.2), (A() - 0.5) * 6, 4 + A() * 8, 0.6 + A() * 0.5);
      for (let i = enVuelo(0.45); i > 0; i--) nace(A() < 0.6 ? 'cristal' : 'vaho', uAzar(0.45), (A() - 0.5) * 6, 2 + A() * 6, 0.45 + A() * 0.4, 1, A());
      break;
    }
    case 'rayo': {
      // arcos quebrados que corren por el filo: cambian de forma 18 veces por segundo; alguno salta afuera del filo
      const paso = Math.floor(t * 18), nArcos = pega ? 3 : 2;
      for (let a = 0; a < nArcos; a++) {
        const f = H(paso * 3.1 + a * 17.7 + sg); if (f < (pega ? 0.15 : 0.35)) continue;
        const u0 = 0.12 + H(paso + a * 5.3) * 0.5, u1 = Math.min(1, u0 + 0.22 + H(paso * 1.7 + a) * 0.35);
        if (!ve_(u0) || !ve_(u1)) continue;
        const sale = H(paso * 2.3 + a * 9.1) < 0.3, [ax, ay] = en(u0), [bx0, by0] = en(u1), lado = H(paso + a) < 0.5 ? -1 : 1;
        const bx = sale ? bx0 + nx * lado * (5 + H(paso * 4.1 + a) * 6) : bx0, by = sale ? by0 + ny * lado * (5 + H(paso * 4.1 + a) * 6) : by0;
        let lx = ax, ly = ay; const N = 5;
        for (let q2 = 1; q2 <= N; q2++) {
          const w = q2 / N, z = q2 < N ? (H(paso * 7.7 + q2 * 3.3 + a * 11) - 0.5) * 7 : 0;
          const qx = ax + (bx - ax) * w + nx * z, qy = ay + (by - ay) * w + ny * z;
          linea(ctx, lx + nx, ly + ny, qx + nx, qy + ny, r[1], 0.45 * act + 0.15); linea(ctx, lx, ly, qx, qy, a ? r[3] : r[4], 0.95);
          lx = qx; ly = qy;
        }
      }
      // la descarga a tierra: de la punta al piso, un instante, con su chispazo
      if (cuota(sg + 'r1', pega ? 2.4 : 0.9, d) > 0 && ve_(0.95)) { st.arcoT = t; st.rayo = H(t * 91) * 2 - 1; }
      const dr = t - st.arcoT;
      if (dr >= 0 && dr < 0.1) {
        const tx = x1 + st.rayo * 12, ty = py - 1, al = 1 - dr / 0.1; let lx = x1, ly = y1;
        for (let q2 = 1; q2 <= 6; q2++) { const w = q2 / 6, z = q2 < 6 ? (H(st.arcoT * 37 + q2 * 4.3) - 0.5) * 9 : 0, qx = x1 + (tx - x1) * w + z, qy = y1 + (ty - y1) * w; linea(ctx, lx, ly, qx, qy, r[4], al); linea(ctx, lx + 1, ly, qx + 1, qy, r[2], al * 0.4); lx = qx; ly = qy; }
        punto(ctx, tx - 2, ty, r[3], al, 5, 1); punto(ctx, tx - 1, ty - 1, r[4], al, 3, 1);
        if (dr < d + 0.001) for (let i = 0; i < 5; i++) echar({ x: tx - ox, y: ty - oy, vx: (A() - 0.5) * 70, vy: -20 - A() * 40, t: 0, dur: 0.15 + A() * 0.15, k: 'chispa', el, piso: ty - oy, tam: 1, s: 0 });
      }
      for (let i = cuota(sg + 'r2', 5 + 16 * act, d); i > 0; i--) nace('chispa', uAzar(0.2), (A() - 0.5) * 50 + ivx, (A() - 0.5) * 50 + ivy, 0.08 + A() * 0.14);
      for (let i = enVuelo(0.35); i > 0; i--) nace('chispa', uAzar(0.45), (A() - 0.5) * 30, (A() - 0.5) * 30, 0.12 + A() * 0.16, 1, A());
      break;
    }
    case 'veneno':
    case 'sangre': {
      // la gota se junta en lo más bajo de la hoja, se estira y cae; en el golpe salen despedidas
      const ven = el === 'veneno', uBajo = y1 > y0 ? 0.97 : 0.3;
      // (corriendo, la hoja se mece y lo más bajo cambia de punta a cada rato: antes eso volvía a cero la gota y nunca
      // caía nada. Ahora la gota sigue juntándose donde quede lo más bajo, y en marcha se junta más rápido)
      const anda = !pega && (e.acc === 'caminar' || e.acc === 'correr'), corre = e.acc === 'correr';
      st.gotaU = uBajo;
      st.gota += (d / (ven ? 0.75 : 1.1)) * (anda ? (corre ? 2.6 : 1.8) : 1);
      if (ve_(uBajo)) {
        const [gx, gy] = en(uBajo), g = Math.min(1, st.gota);
        ctx.globalCompositeOperation = 'source-over';
        punto(ctx, gx, gy + 1, r[2], 0.9 * g); if (g > 0.5) punto(ctx, gx, gy + 2, r[3], 0.9 * (g - 0.5) * 2); if (g > 0.85) punto(ctx, gx, gy + 3, r[2], 0.9);
        ctx.globalCompositeOperation = 'lighter'; punto(ctx, gx, gy + 1, r[4], 0.35 * g);
        if (st.gota >= 1) { st.gota = 0; echar({ x: gx - ox, y: gy + 3 - oy, vx: 0, vy: 8, t: 0, dur: 2, k: 'gota', el, piso: piso + (A() - 0.5) * 4, tam: 2, s: 0 }); }
      }
      // el icor corre por la hoja: perlas que bajan por el filo
      if (ven) for (let i = 0; i < 4; i++) { const u = ((t * 0.3 + i * 0.25 + H(i) * 0.1) % 1) * 0.82 + 0.15; if (!ve_(u)) continue; const [vx, vy] = en(u); ctx.globalCompositeOperation = 'lighter'; punto(ctx, vx + nx * 0.6, vy + ny * 0.6, r[4], 0.7); }
      if (ven) {
        for (let i = cuota(sg + 'v1', 4 + 6 * act, d); i > 0; i--) nace('burbuja', uAzar(0.2), (A() - 0.5) * 4, -6 - A() * 7, 0.5 + A() * 0.5);
        for (let i = cuota(sg + 'v2', 7 + 8 * act, d); i > 0; i--) nace('miasma', uAzar(0.15), (A() - 0.5) * 5, -4 - A() * 6, 1 + A() * 0.6, 1);
      }
      for (let i = enVuelo(ven ? 0.35 : 0.45); i > 0; i--) nace('gota', uAzar(0.4), ivx * 1.6 + (A() - 0.5) * 20, ivy * 1.6 - 10 - A() * 20, 2, 1, A());
      // en marcha el arma chorrea: gotas que se sueltan de la hoja por donde pasa (con la inercia del paso, quedan atrás) y
      // dejan su rastro en el piso; el veneno además deja una estela de miasma
      if (anda && barrido > 0.5) {
        for (let i = cuota(sg + 'mg', barrido * (corre ? 0.11 : 0.08) * (0.5 + act), 1); i > 0; i--) nace('gota', uAzar(0.45), -ivx * 0.6 + (A() - 0.5) * 8, 4 + A() * 10, 2, 1 + (A() < 0.3 ? 1 : 0), A());
        if (ven) for (let i = cuota(sg + 'mm', barrido * 0.09, 1); i > 0; i--) nace('miasma', uAzar(0.2), -ivx * 0.4 + (A() - 0.5) * 4, -3 - A() * 4, 1.2 + A() * 0.8, 1, A());
      }
      break;
    }
    case 'sombra': {
      // la llama negra es la de Doom con la paleta de sombra (ver armaArdeViva): motas violetas que suben y humo
      for (let i = cuota(sg + 's2', 4 + 8 * act, d); i > 0; i--) nace('mota', uAzar(0.2), (A() - 0.5) * 10, -8 - A() * 10, 0.5 + A() * 0.4);
      for (let i = cuota(sg + 's3', 3 + 4 * act, d); i > 0; i--) nace('humo', uAzar(0.3), (A() - 0.5) * 6, -14 - A() * 10, 0.9 + A() * 0.6, 1);
      break;
    }
    case 'luz': {
      // runas que se encienden de a una por la hoja y la estrella de la punta (cuatro rayos largos y cuatro cortos)
      ctx.globalCompositeOperation = 'lighter';
      for (let c = 0; c < 4; c++) { const u = 0.25 + c * 0.17; if (!ve_(u)) continue; const [cx, cy] = en(u), w = Math.max(0, Math.sin(t * 2.6 - c * 0.9)) ** 4; if (w < 0.05) continue; punto(ctx, cx - 1, cy, r[3], w * 0.8); punto(ctx, cx + 1, cy, r[3], w * 0.8); punto(ctx, cx, cy - 1, r[4], w); punto(ctx, cx, cy + 1, r[3], w * 0.8); }
      if (ve_(0.95)) {
        const pul = 0.7 + 0.3 * Math.sin(t * 3.1), giro = t * 0.6, tx = Math.round(x1), ty = Math.round(y1);
        for (let i = 0; i < 8; i++) { const a = giro + (i * Math.PI) / 4, l = ((i % 2 ? 2.5 : 5) + (pega ? 3 : 0)) * pul; for (let s = 1; s <= Math.round(l); s++) punto(ctx, tx + Math.cos(a) * s, ty + Math.sin(a) * s, s < l * 0.5 ? r[4] : r[3], (1 - s / (l + 1)) * 0.85); }
        punto(ctx, tx, ty, r[4], 1);
      }
      for (let i = cuota(sg + 'l1', 6 + 14 * act, d); i > 0; i--) nace('mota', uAzar(0.2), (A() - 0.5) * 8, -6 - A() * 10, 0.5 + A() * 0.5);
      for (let i = enVuelo(0.4); i > 0; i--) nace('mota', uAzar(0.45), (A() - 0.5) * 6, -2 - A() * 6, 0.35 + A() * 0.35, 1, A());
      break;
    }
    case 'acero':
      for (let i = enVuelo(0.25); i > 0; i--) nace('chispa', uAzar(0.5), (A() - 0.5) * 30, (A() - 0.5) * 30, 0.1 + A() * 0.1, 1, A());
      break;
  }

  // ---------------------------------------------------------------- el orbe de los que lanzan
  if (lanza && el !== 'acero' && ve_(0.97)) orbe(ctx, tipo === 'varita' || !vivo ? x1 : (x0 + x1) / 2, tipo === 'varita' || !vivo ? y1 : (y0 + y1) / 2, tipo === 'varita' ? 2 : tipo === 'cetro' ? 3 : 4, el, r, t, act, d, ox, oy, piso, sg);

  ctx.restore();
  if (conLuz) { luzViva.on = true; luzViva.x = (x0 + x1) / 2 - ox; luzViva.y = py - oy; luzViva.h = Math.max(8, py - (y0 + y1) / 2); luzViva.c = LUZ_RGB[el]; luzViva.k = (0.62 + 0.38 * st.act) * pulsoLuz(el, t); }
}

const MOD_ELEM: Record<string, ElemArma> = { ardiente: 'fuego', helado: 'frio', electrico: 'rayo', vampiro: 'sangre', maldito: 'sombra' };
const ELEMS_VIVOS = new Set(['fuego', 'frio', 'rayo', 'veneno', 'sombra', 'luz', 'sangre']);
/** El elemento vivo del arma de un enemigo: el de su encantamiento de campeón, o el de su daño si es campeón, único o jefe. */
/** Los que pegan con dientes, garras o el cuerpo (su `hoja` es la mordida o el zarpazo, no un arma). */
const SIN_ARMA = /chacal|lobo|arana|rata|murcielago|cienaga|perro|gusano|larva/;
export function elemMonstruo(m: { calidad: number; mods: string[]; def: { elem?: string; jefe?: boolean; sprite?: string } }): ElemArma | null {
  if (SIN_ARMA.test(m.def.sprite ?? '')) return null;
  for (const id of m.mods) if (MOD_ELEM[id]) return MOD_ELEM[id];
  return (m.calidad >= 1 || m.def.jefe) && ELEMS_VIVOS.has(m.def.elem ?? '') ? (m.def.elem as ElemArma) : null;
}
/**
 * Qué tramos de la hoja de un enemigo se ven. Los cuadros horneados no traen la máscara (ver motor/hoja.ts): de espaldas,
 * lo que cae dentro de la columna del cuerpo se da por tapado.
 */
export function mascaraMonstruo(q: Cuadro, px: number, py: number, esc: number, dir: string): number {
  if (!q.hoja || dir[0] !== 'n') return 63;
  let ve = 0; const ancho = q.w * esc * 0.3, alto = py - q.ay * esc;
  for (let i = 0; i < 6; i++) { const u = (i + 0.5) / 6, x = px + (q.hoja[0] + (q.hoja[2] - q.hoja[0]) * u) * esc, y = py + (q.hoja[1] + (q.hoja[3] - q.hoja[1]) * u) * esc; if (!(Math.abs(x - px) < ancho && y > alto && y < py)) ve |= 1 << i; }
  return ve;
}

/**
 * La llama del arma (fuego, y la negra de la sombra) del héroe: va DETRÁS del cuerpo (se llama antes de dibujarlo). La
 * llama envuelve la hoja y sube: dibujada encima tapaba el pecho y la cara cada vez que el arma quedaba delante; detrás,
 * el cuerpo la corta donde se cruzan y el filo encendido (que va encima) sigue diciendo dónde está la hoja. Por eso acá
 * prenden también los tramos tapados: lo que asoma por encima del hombro se ve, como debe.
 */
export function llamaArmaAtras(ctx: CanvasRenderingContext2D, e: object, q: Cuadro, px: number, py: number, esc: number, el: ElemArma, tipo: string, t: number, dt: number, ox: number, oy: number) {
  if (!q.hoja || (el !== 'fuego' && el !== 'sombra') || (window as any).__sinLlamaArma) return;
  const hj = q.hoja as number[], vivo = hj.length >= 9 ? 5 : 0, st = estado(e);
  const h: [number, number, number, number] = [hj[vivo] * esc, hj[vivo + 1] * esc, hj[vivo + 2] * esc, hj[vivo + 3] * esc];
  const p = st.prev && t - st.ult < 0.12 ? st.prev : null;
  const antes: [number, number, number, number] | null = p ? [p[0] + ox - px, p[1] + oy - py, p[2] + ox - px, p[3] + oy - py] : null;
  ctx.save();
  armaArdeViva(ctx, e, el === 'fuego' ? 'infierno' : 'sombra', h, antes, 63, px, py, st.act, dt, LANZA.test(tipo) ? (tipo === 'varita' ? 1 : 2) : 0, el === 'sombra' ? 0.9 : 1);
  ctx.restore();
}

/** Cómo titila la luz de cada elemento (cerca de 1, nunca un apagón). */
function pulsoLuz(el: ElemArma, t: number): number {
  switch (el) {
    case 'fuego': return 0.86 + 0.08 * Math.sin(t * 13) + 0.06 * Math.sin(t * 29.7);
    case 'rayo': return H(Math.floor(t * 20)) < 0.25 ? 1.08 : 0.82;
    case 'sangre': return 0.85 + 0.12 * Math.max(0, Math.sin(t * 5.5)) ** 6;
    case 'sombra': return 0.7 + 0.08 * Math.sin(t * 2);
    default: return 0.92 + 0.06 * Math.sin(t * 2.3);
  }
}

/** El orbe: una gema con volumen en la cabeza del arma, con motas en órbita y su elemento. */
function orbe(ctx: CanvasRenderingContext2D, cx0: number, cy0: number, rad: number, el: ElemArma, r: string[], t: number, act: number, d: number, ox: number, oy: number, piso: number, sg: number) {
  const cx = Math.round(cx0), cy = Math.round(cy0) - 1, pul = 0.85 + 0.15 * Math.sin(t * 4.2);
  // el halo: la gema alumbra el aire
  ctx.globalCompositeOperation = 'lighter';
  const hr = rad * 4 + 2, g = ctx.createRadialGradient(cx, cy, 0, cx, cy, hr);
  g.addColorStop(0, r[3] + 'aa'); g.addColorStop(0.35, r[2] + '44'); g.addColorStop(1, r[2] + '00');
  ctx.globalAlpha = (0.45 + 0.35 * act) * pul; ctx.fillStyle = g; ctx.fillRect(cx - hr, cy - hr, hr * 2, hr * 2);
  // motas en órbita (inclinada): las de atrás antes de la gema y más tenues
  const orbita = (atras: boolean) => {
    for (let i = 0; i < 3; i++) {
      const a = t * (2.6 + i * 0.4) + (i * Math.PI * 2) / 3, s = Math.sin(a); if ((s < 0) !== atras) continue;
      const mx = cx + Math.cos(a) * (rad + 3), my = cy + s * (rad * 0.45 + 1) - Math.cos(a) * 1.2;
      punto(ctx, mx, my, atras ? r[2] : r[4], atras ? 0.45 : 0.95);
    }
  };
  orbita(true);
  // la gema: canto oscuro, cuerpo del color, núcleo claro corrido hacia la luz (arriba a la izquierda) y un brillo duro
  ctx.globalCompositeOperation = 'source-over';
  const lx = cx - rad * 0.35, ly = cy - rad * 0.35;
  for (let y = -rad; y <= rad; y++) for (let x = -rad; x <= rad; x++) {
    const dd = x * x + y * y; if (dd > rad * rad + rad * 0.6) continue;
    const borde = Math.sqrt(dd) / (rad + 0.3), luz = Math.hypot(cx + x - lx, cy + y - ly) / (rad * 1.5);
    const i = Math.max(0, Math.min(4, Math.round(4.2 - luz * 3.2 - borde * 1.4 + (el === 'sombra' ? -0.8 : 0))));
    punto(ctx, cx + x, cy + y, r[i], 1);
  }
  ctx.globalCompositeOperation = 'lighter';
  punto(ctx, cx - 1, cy, r[3], 0.5 * pul + 0.3 * act, 2, 2);
  ctx.globalCompositeOperation = 'source-over';
  punto(ctx, Math.round(cx - rad * 0.5), Math.round(cy - rad * 0.5), '#ffffff', 0.9);
  orbita(false);
  // el elemento saliendo de la gema
  const sale = (k: Clase, vx: number, vy: number, dur: number, tam = 1) => echar({ x: cx - ox + (A() - 0.5) * rad * 1.6, y: cy - oy - rad * 0.6 + (A() - 0.5) * rad, vx, vy, t: 0, dur, k, el, piso: piso + (A() - 0.5) * 6, tam, s: A() * 100 });
  const kk = 0.6 + act;
  switch (el) {
    case 'frio': for (let i = cuota(sg + 'oh', 10 * kk, d); i > 0; i--) sale(A() < 0.5 ? 'vaho' : 'cristal', (A() - 0.5) * 6, 5 + A() * 8, 0.7 + A() * 0.5); break;
    case 'rayo': {
      const paso = Math.floor(t * 16);
      for (let a = 0; a < 2; a++) { if (H(paso + a * 3.3) < 0.4) continue; const an = H(paso * 2.1 + a) * Math.PI * 2, l = rad + 3 + H(paso * 3.7 + a) * 5; let px2 = cx + Math.cos(an) * rad, py2 = cy + Math.sin(an) * rad; for (let s = 1; s <= 3; s++) { const w = s / 3, qx = cx + Math.cos(an) * (rad + (l - rad) * w) + (H(paso * 5 + s + a) - 0.5) * 3, qy = cy + Math.sin(an) * (rad + (l - rad) * w) + (H(paso * 6 + s + a) - 0.5) * 3; ctx.globalCompositeOperation = 'lighter'; linea(ctx, px2, py2, qx, qy, r[4], 0.9); px2 = qx; py2 = qy; } }
      break;
    }
    case 'veneno': case 'sangre': for (let i = cuota(sg + 'ov', 1.2 * kk, d); i > 0; i--) echar({ x: cx - ox, y: cy + rad - oy, vx: 0, vy: 6, t: 0, dur: 2, k: 'gota', el, piso: piso + (A() - 0.5) * 4, tam: 2, s: 0 }); break;
    case 'luz': for (let i = cuota(sg + 'ol', 8 * kk, d); i > 0; i--) sale('mota', (A() - 0.5) * 10, -6 - A() * 10, 0.5 + A() * 0.4); break;
  }
}

/**
 * El golpe que conecta: la materia del arma revienta en el blanco (x, y en pantalla del mundo a la altura del pecho).
 * `ox, oy` como en armaViva.
 */
export function golpeVivo(el: ElemArma, x: number, y: number, ox: number, oy: number, piso: number, fuerte: boolean) {
  const wx = x - ox, wy = y - oy, pw = piso - oy, n = fuerte ? 1.5 : 1;
  const sale = (k: Clase, vel: number, arriba: number, dur: number, tam = 1, cuantas = 1) => { for (let i = 0; i < Math.round(cuantas * n); i++) { const a = A() * Math.PI * 2, v = vel * (0.4 + A() * 0.6); echar({ x: wx + (A() - 0.5) * 4, y: wy + (A() - 0.5) * 4, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.6 - arriba * A(), t: 0, dur: dur * (0.7 + A() * 0.6), k, el, piso: pw + (A() - 0.5) * 8, tam, s: A() * 100 }); } };
  echar({ x: wx, y: wy, vx: 0, vy: 0, t: 0, dur: 0.2, k: 'anillo', el, piso: pw, tam: fuerte ? 20 : 14, s: 0 });
  switch (el) {
    case 'fuego': sale('llama', 60, 25, 0.32, 2, 12); sale('brasa', 110, 60, 0.6, 1, 10); sale('humo', 20, 15, 0.8, 1, 4); break;
    case 'frio': echar({ x: wx, y: wy, vx: 0, vy: 0, t: 0, dur: 0.2, k: 'estrella', el, piso: pw, tam: 12, s: 0.39 }); sale('esquirla', 120, 50, 0.5, 1, 16); sale('vaho', 35, 0, 0.8, 2, 10); sale('cristal', 60, 20, 0.6, 1, 8); break;
    case 'rayo': sale('chispa', 170, 40, 0.26, 1, 24); echar({ x: wx, y: wy, vx: 0, vy: 0, t: 0, dur: 0.18, k: 'estrella', el, piso: pw, tam: 18, s: A() * 100 }); break;
    case 'veneno': sale('gota', 90, 60, 2, 1, 16); sale('burbuja', 25, 20, 0.7, 1, 6); sale('humo', 25, 10, 0.9, 1, 5); break;
    case 'sombra': sale('humo', 40, 20, 0.9, 1, 10); sale('mota', 80, 20, 0.5, 1, 12); echar({ x: wx, y: wy, vx: 0, vy: 0, t: 0, dur: 0.22, k: 'estrella', el, piso: pw, tam: 10, s: 0.4 }); break;
    case 'luz': sale('mota', 90, 30, 0.5, 1, 14); echar({ x: wx, y: wy, vx: 0, vy: 0, t: 0, dur: 0.22, k: 'estrella', el, piso: pw, tam: 22, s: 0 }); break;
    case 'sangre': sale('gota', 100, 70, 2, 1, 22); break;
    default: sale('chispa', 120, 40, 0.18, 1, 10);
  }
}

/** Avanza y dibuja las partículas de las armas vivas (una vez por cuadro). */
export function dibujarDerrames(ctx: CanvasRenderingContext2D, ox: number, oy: number, dt: number) {
  if (!ps.length) return;
  const d = Math.min(dt, 0.05);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.t += d;
    if (p.t >= p.dur) { ps[i] = ps[ps.length - 1]; ps.pop(); continue; }
    const v = p.t / p.dur, r = RAMPA[p.el];
    switch (p.k) {
      case 'gota': case 'esquirla':
        p.vy += 260 * d; p.x += p.vx * d; p.y += p.vy * d;
        if (p.y >= p.piso && p.vy > 0) {
          if (p.k === 'esquirla') { p.dur = p.t + 0.25; p.vx = p.vy = 0; p.y = p.piso; break; }
          p.k = 'mancha'; p.y = p.piso; p.t = 0; p.dur = p.el === 'sangre' ? 3.4 : 2.8; // (el rastro dura lo que se ve al correr)
          for (let q = 0; q < 3 && ps.length < MAX; q++) ps.push({ x: p.x, y: p.y, vx: (A() - 0.5) * 30, vy: -12 - A() * 18, t: 0, dur: 0.18 + A() * 0.1, k: 'chispa', el: p.el, piso: p.piso, tam: 1, s: 0 });
        }
        break;
      case 'mancha': case 'anillo': case 'estrella': break;
      case 'llama': p.x += p.vx * d + Math.sin(p.t * 26 + p.s) * 7 * d; p.y += p.vy * d; p.vy *= 1 - d * 1.5; break;
      case 'brasa': p.vx += Math.sin(p.t * 11 + p.s) * 60 * d; p.vy += 10 * d; p.x += p.vx * d; p.y += p.vy * d; break;
      case 'vaho': p.vx *= 1 - d * 1.5; p.vy *= 1 - d * 0.8; p.x += p.vx * d; p.y += p.vy * d; if (p.y > p.piso) { p.y = p.piso; p.vy = 0; p.vx += (p.s > 50 ? 1 : -1) * 8 * d; } break;
      case 'humo': p.vx += Math.sin(p.t * 4 + p.s) * 14 * d; p.x += p.vx * d; p.y += p.vy * d; break;
      case 'burbuja': p.x += Math.sin(p.t * 9 + p.s) * 5 * d; p.y += p.vy * d; break;
      case 'miasma': p.x += p.vx * d + Math.sin(p.t * 3 + p.s) * 4 * d; p.y += p.vy * d; break;
      default: p.x += p.vx * d; p.y += p.vy * d; if (p.k === 'chispa') { p.vy += 120 * d; p.vx *= 1 - d * 3; } if (p.k === 'cristal' && p.y > p.piso) { p.y = p.piso; p.vx = p.vy = 0; }
    }
    if (p.t >= p.dur) continue;
    const x = Math.round(p.x + ox), y = Math.round(p.y + oy);
    switch (p.k) {
      case 'llama': {
        ctx.globalCompositeOperation = 'lighter';
        lengua(ctx, p.el, x, y, p.tam - Math.floor(v * 1.6), Math.floor(v * 4), v < 0.7 ? 0.9 : 0.9 * (1 - v) / 0.3);
        break;
      }
      case 'humo': ctx.globalCompositeOperation = 'source-over'; { const tm = 1 + Math.round(v * 2); punto(ctx, x - (tm >> 1), y - (tm >> 1), p.el === 'veneno' ? '#1a3a10' : p.el === 'sombra' ? '#170a24' : '#1c1410', 0.32 * Math.min(1, v * 5) * (1 - v), tm, tm); } break;
      case 'miasma': ctx.globalCompositeOperation = 'lighter'; { const w = 2 + Math.round(v * 3); punto(ctx, x - (w >> 1), y, p.el === 'veneno' ? RAMPA.veneno[1] : r[1], 0.3 * Math.min(1, v * 4) * (1 - v), w, 1 + Math.round(v)); } break;
      case 'brasa': ctx.globalCompositeOperation = 'lighter'; punto(ctx, x, y, v < 0.3 ? r[4] : r[3], (1 - v) * (0.7 + 0.3 * Math.sin(p.t * 30 + p.s))); break;
      case 'vaho': ctx.globalCompositeOperation = 'lighter'; { const w = p.tam + Math.round(v * 2); punto(ctx, x, y, r[2], 0.32 * Math.min(1, v * 4) * (1 - v), w, 1); } break;
      case 'cristal': ctx.globalCompositeOperation = 'lighter'; { const tw = 0.5 + 0.5 * Math.sin(p.t * 22 + p.s); punto(ctx, x, y, r[4], (1 - v) * (0.4 + 0.6 * tw)); if (tw > 0.92) { punto(ctx, x - 1, y, r[3], 0.5 * (1 - v)); punto(ctx, x + 1, y, r[3], 0.5 * (1 - v)); punto(ctx, x, y - 1, r[3], 0.5 * (1 - v)); punto(ctx, x, y + 1, r[3], 0.5 * (1 - v)); } } break;
      case 'chispa': ctx.globalCompositeOperation = 'lighter'; { const l = Math.hypot(p.vx, p.vy) || 1, sx = Math.round((-p.vx / l) * 1.6), sy = Math.round((-p.vy / l) * 1.6); punto(ctx, x, y, r[4], 1 - v * 0.5); if (sx || sy) punto(ctx, x + sx, y + sy, r[2], 0.6 * (1 - v)); } break;
      case 'esquirla': { ctx.globalCompositeOperation = 'source-over'; const l = Math.hypot(p.vx, p.vy) || 1; linea(ctx, x, y, x + Math.round((p.vx / l) * 2), y + Math.round((p.vy / l) * 2), r[3], 0.9 * (1 - v * 0.6)); ctx.globalCompositeOperation = 'lighter'; punto(ctx, x, y, r[4], 0.8 * (1 - v)); } break;
      case 'burbuja': ctx.globalCompositeOperation = 'lighter'; if (v < 0.85) { punto(ctx, x, y, r[3], 0.6, 1, 1); if (p.s > 60) { punto(ctx, x + 1, y, r[2], 0.4); punto(ctx, x, y - 1, r[2], 0.4); } } else { punto(ctx, x - 1, y, r[4], 0.6); punto(ctx, x + 1, y, r[4], 0.6); } break;
      case 'gota': ctx.globalCompositeOperation = 'source-over'; punto(ctx, x, y, r[2], 0.95, 1, p.tam + (p.vy > 60 ? 1 : 0)); ctx.globalCompositeOperation = 'lighter'; punto(ctx, x, y, r[4], 0.3); break;
      case 'mancha': {
        ctx.globalCompositeOperation = 'source-over'; const w = 2 + Math.round(Math.min(1, v * 5) * 3), a = (1 - v) * 0.75;
        punto(ctx, x - (w >> 1), y, r[1], a, w, 1); punto(ctx, x - (w >> 1) + 1, y - 1, r[2], a * 0.8, Math.max(1, w - 2), 1);
        if (p.el === 'veneno') { ctx.globalCompositeOperation = 'lighter'; punto(ctx, x, y - 1, r[3], a * 0.4); }
        break;
      }
      case 'mota': ctx.globalCompositeOperation = 'lighter'; { const a = Math.sin(v * Math.PI); punto(ctx, x, y, r[4], a); if (v > 0.3 && v < 0.6) { punto(ctx, x - 1, y, r[3], a * 0.5); punto(ctx, x + 1, y, r[3], a * 0.5); punto(ctx, x, y - 1, r[3], a * 0.5); punto(ctx, x, y + 1, r[3], a * 0.5); } } break;
      case 'anillo': {
        // el aro del impacto, chato como el piso, a puntos enteros
        ctx.globalCompositeOperation = 'lighter'; const rr = 2 + v * p.tam, a = (1 - v) * 0.9, nn = Math.max(10, Math.round(rr * 4));
        for (let s = 0; s < nn; s++) { const an = (s / nn) * Math.PI * 2; punto(ctx, x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.55, s % 2 ? r[3] : r[4], a); }
        if (v < 0.35) punto(ctx, x - 1, y - 1, r[4], 1 - v / 0.35, 3, 3);
        break;
      }
      case 'estrella': {
        ctx.globalCompositeOperation = 'lighter'; const a = 1 - v;
        for (let s = 0; s < 8; s++) { const an = (s * Math.PI) / 4 + p.s, l = (s % 2 ? 0.5 : 1) * p.tam * (0.5 + v * 0.8); for (let q = 1; q <= l; q++) punto(ctx, x + Math.cos(an) * q, y + Math.sin(an) * q, q < l * 0.4 ? r[4] : r[3], a * (1 - q / (l + 1))); }
        punto(ctx, x - 1, y - 1, r[4], a, 3, 3);
        break;
      }
    }
  }
  ctx.restore();
}

/** La luz que el arma viva echa en el piso, a los pies (va detrás del cuerpo). */
export function luzPisoArma(ctx: CanvasRenderingContext2D, px: number, py: number, elem: string, t: number, k = 1) {
  if (elem === 'acero') return;
  const c = colorArma(elem), pul = elem === 'fuego' ? 0.85 + 0.15 * Math.sin(t * 11) * Math.sin(t * 3.7) : 0.9 + 0.1 * Math.sin(t * 2.3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(Math.round(px), Math.round(py)); ctx.scale(1, 0.5);
  const r = 30 * k, g = ctx.createRadialGradient(0, 0, 2, 0, 0, r); g.addColorStop(0, c + '30'); g.addColorStop(0.6, c + '10'); g.addColorStop(1, c + '00');
  ctx.globalAlpha = pul * (elem === 'sombra' || elem === 'sangre' ? 0.6 : 1); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}
