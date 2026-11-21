// El fuego de Doom pintado como pixel art de verdad: cada celda del autómata es un cuadrado de puntos enteros del
// aparato (sin suavizar), el calor cae en pocas bandas de color y entre banda y banda va la trama Bayer 4 x 4. Lo usan
// el título de la portada (titulo_fuego.ts) y el canto de brasa de los botones del menú.
import * as D from '../../../src/engine/gotico/fuego_doom';
import { ctx } from '../nucleo/lienzo';

export type RGBA = readonly [number, number, number, number];
/** Las bandas de la llama, de la brasa honda al alma: rojo sangre, naranja y un amarillo viejo (casi nada de blanco). */
export const BANDAS_LLAMA: readonly RGBA[] = [
  [0, 0, 0, 0], [40, 6, 6, 90], [80, 12, 8, 180], [126, 22, 8, 240], [170, 40, 10, 255], [210, 70, 16, 255],
  [236, 108, 28, 255], [248, 150, 48, 255], [255, 196, 90, 255], [255, 234, 170, 255],
];
/** El metal al rojo (se suma sobre el hierro de las letras): del rojo apagado al naranja vivo. */
// (de brasa a naranja con su verde: el rojo solo sobre el hierro gris lo dejaba rosado)
export const BANDAS_METAL: readonly RGBA[] = [[0, 0, 0, 0], [40, 10, 0, 255], [92, 30, 2, 255], [150, 60, 6, 255], [206, 102, 16, 255], [246, 150, 40, 255], [255, 198, 92, 255]];
/** El humo: tres grises tibios y translúcidos. */
export const BANDAS_HUMO: readonly RGBA[] = [[0, 0, 0, 0], [24, 14, 13, 70], [30, 18, 16, 120], [36, 22, 19, 165]];
/** Umbrales de la trama Bayer 4 x 4 (0 a 1). */
export const BAYER4 = new Float32Array([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16));

/** Banda de `v` (0 a 1) en una escala de `n` bandas, con la trama de la celda (x, y). */
export const banda = (v: number, n: number, x: number, y: number) => {
  const q = Math.floor(v * (n - 1) + BAYER4[(y & 3) * 4 + (x & 3)]);
  return q < 0 ? 0 : q >= n ? n - 1 : q;
};

/** Un lienzo chico con su ImageData, del tamaño de la grilla (una celda por punto). */
export interface Capa { c: HTMLCanvasElement; g: CanvasRenderingContext2D; im: ImageData }
export function capa(w: number, h: number): Capa {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d')!; return { c, g, im: g.createImageData(w, h) };
}

/**
 * Pinta el calor del fuego en bandas (llama) o su humo, una celda por punto, desde la fila `fy` del fuego y en la
 * fila `oy` de la capa. `brillo` sube el calor medio, `umbral` deja transparente lo que esté por debajo (0 a 1) y
 * `mascara` (opcional, del tamaño de la capa) recorta.
 */
let tmp = new Float32Array(0), tmp2 = new Float32Array(0);
/** Calor (o humo) pasado por un 1-2-1 en x y en y: junta las lenguas y saca la sal suelta del autómata. */
function suavizado(src: Uint8Array, w: number, h: number, k: number): Float32Array {
  const n = w * h; if (tmp.length < n) { tmp = new Float32Array(n); tmp2 = new Float32Array(n); }
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { const i = o + x; tmp2[i] = (src[x > 0 ? i - 1 : i] + 2 * src[i] + src[x < w - 1 ? i + 1 : i]) * 0.25; } }
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { const i = o + x; const f = (tmp2[y > 0 ? i - w : i] + 2 * tmp2[i] + tmp2[y < h - 1 ? i + w : i]) * 0.25; tmp[i] = src[i] + (f - src[i]) * k; } }
  return tmp;
}
let otra = new Float32Array(0);
function suavizadoF(src: Float32Array, w: number, h: number): Float32Array {
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { const i = o + x; tmp2[i] = (src[x > 0 ? i - 1 : i] + 2 * src[i] + src[x < w - 1 ? i + 1 : i]) * 0.25; } }
  for (let y = 0; y < h; y++) { const o = y * w; for (let x = 0; x < w; x++) { const i = o + x; tmp[i] = (tmp2[y > 0 ? i - w : i] + 2 * tmp2[i] + tmp2[y < h - 1 ? i + w : i]) * 0.25; } }
  return tmp;
}
export function pintarCalor(f: D.Fuego, cp: Capa, o: { humo?: boolean; brillo?: number; umbral?: number; alfa?: number; mascara?: Float32Array; bandas?: readonly RGBA[]; filtro?: number; trama?: boolean; pasadas?: number; filaK?: Float32Array; tramaDesde?: number } = {}) {
  const { w, h } = f, d = cp.im.data, W = cp.c.width, H = Math.min(cp.c.height, h);
  const bandas = o.bandas ?? (o.humo ? BANDAS_HUMO : BANDAS_LLAMA), n = bandas.length, inv = 1 / (o.humo ? 255 : D.CALOR_MAX);
  const br = 1 / (o.brillo ?? 1), um = o.umbral ?? 0, al = o.alfa ?? 1, mk = o.mascara;
  let src = suavizado(o.humo ? f.humo : f.calor, w, h, o.filtro ?? (o.humo ? 1 : 0.8));
  // (con celdas finas una pasada no alcanza para juntar las lenguas: se repite sobre lo ya suavizado)
  for (let p = 1; p < (o.pasadas ?? 1); p++) { if (otra.length < w * h) otra = new Float32Array(w * h); otra.set(src.subarray(0, w * h)); src = suavizadoF(otra, w, h); }
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * w + x, j = (y * W + x) * 4;
    let v = x < w ? src[i] * inv : 0;
    if (v > 0 && br !== 1) v = Math.pow(v, br);
    if (o.humo) v *= 0.9;
    // (filaK: la llama se enfría por fila, para que muera antes del borde de la pantalla en vez de cortarse)
    if (o.filaK) v *= o.filaK[y];
    // en las bandas oscuras no va la trama (se leía como tablero): se redondea a la banda, el pixel sigue
    const sinTrama = o.trama === false || (o.tramaDesde !== undefined && v * (n - 1) < o.tramaDesde);
    let q = v > um ? (sinTrama ? Math.min(n - 1, Math.floor(v * (n - 1) + 0.5)) : banda(v, n, x, y)) : 0;
    if (mk && mk[y * W + x] < 0.5) q = 0;
    const b = bandas[q]; d[j] = b[0]; d[j + 1] = b[1]; d[j + 2] = b[2]; d[j + 3] = b[3] * al;
  }
  cp.g.putImageData(cp.im, 0, 0);
}

/**
 * Pega una capa en la pantalla a puntos enteros del aparato: su esquina (x, y) en puntos lógicos se redondea al punto
 * del aparato y cada celda mide `celda` puntos del aparato, sin suavizar. `dx`, `dy` corren en celdas.
 */
export function pegarPixel(c: HTMLCanvasElement, x: number, y: number, celda: number, alfa: number, op: GlobalCompositeOperation = 'source-over') {
  if (alfa <= 0.003) return;
  const T = ctx.getTransform(), px = Math.round(T.a * x + T.e), py = Math.round(T.d * y + T.f);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = Math.min(1, alfa); ctx.globalCompositeOperation = op;
  ctx.drawImage(c, px, py, c.width * celda, c.height * celda); ctx.restore();
}

/** Chispas de pixel: cuadros de una celda (dos las grandes) que suben, se enfrían de banda en banda y se apagan. */
export interface Chispa { x: number; y: number; vx: number; vy: number; t: number; d: number; g: number; q: number; s: number }
export function moverChispas(cs: Chispa[], dt: number, t: number, viento = 0) {
  for (let i = cs.length - 1; i >= 0; i--) {
    const c = cs[i]; c.t += dt; if (c.t >= c.d) { cs[i] = cs[cs.length - 1]; cs.pop(); continue; }
    c.vy += c.g * dt; c.vx += (Math.sin(t * 2.7 + c.y * 0.07 + i) * 26 + viento) * dt; c.vx *= 1 - 0.6 * dt;
    c.x += c.vx * dt; c.y += c.vy * dt;
  }
}
/**
 * Dibuja las chispas a puntos enteros del aparato, encajadas en la grilla de `celda` puntos que empieza en (x0, y0)
 * (lógicos). Se enfrían con la vida de blanco a amarillo, naranja y rojo (`q` es cuán caliente nace, 1 al blanco) y las
 * rápidas dejan su estela de celdas, cada una una banda más fría. Van sumadas.
 */
export function dibujarChispas(cs: Chispa[], x0: number, y0: number, celda: number, alfa: number, t: number) {
  if (!cs.length || alfa <= 0) return;
  const T = ctx.getTransform(), ox = Math.round(T.a * x0 + T.e), oy = Math.round(T.d * y0 + T.f), k = T.a / celda;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  const n = BANDAS_LLAMA.length, col = BANDAS_LLAMA.map((b) => `rgb(${b[0]},${b[1]},${b[2]})`);
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i], u = c.t / c.d, cx = Math.round((c.x - x0) * k), cy = Math.round((c.y - y0) * k);
    const q0 = (n - 1) * c.q - u * (n - 1) * 0.8 + (Math.sin(t * 31 + i * 7.3) > 0.7 ? 1 : 0);
    const q = Math.max(2, Math.min(n - 1, Math.round(q0))), s = c.s * celda;
    ctx.globalAlpha = alfa * Math.min(1, (1 - u) * 2.5); ctx.fillStyle = col[q];
    ctx.fillRect(ox + cx * celda, oy + cy * celda, s, s);
    // la estela: hacia atrás de la velocidad, de a una celda, cada una más fría
    const v = Math.hypot(c.vx, c.vy), L = Math.min(6, Math.floor((v * k) / 55));
    if (L > 0) {
      const dx = -c.vx / v, dy = -c.vy / v;
      for (let m = 1; m <= L; m++) {
        const qq = q - 1 - Math.floor(m * 0.8); if (qq < 1) break;
        ctx.globalAlpha = alfa * Math.min(1, (1 - u) * 2.5) * (1 - m / (L + 1)); ctx.fillStyle = col[qq];
        ctx.fillRect(ox + Math.round(cx + dx * m) * celda, oy + Math.round(cy + dy * m) * celda, celda, celda);
      }
    }
  }
  ctx.restore();
}
