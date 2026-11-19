// Los iconos de las habilidades: pixel art pintado al tamaño exacto en que se ven (o a una base chica agrandada por
// enteros), cada uno con su propia composición (iconos_recetas.ts, con los motivos de iconos_motivos.ts y el pintor de
// icono_pintor.ts). Se pintan una sola vez por tamaño, cuando se piden, y se guardan.
//   - el fondo es el del elemento (lo físico toma el tono de la clase): viñeta oscura en bandas, el halo detrás del
//     motivo y el resplandor de lo que arde;
//   - el motivo lleva luz de arriba a la izquierda (la del HUD), sombra que cae, contorno selectivo y el filo del color
//     del elemento en el canto de la sombra;
//   - el marco (la barra de siempre y el árbol) es de bronce a pixel; las definitivas llevan oro y gemas.
import type { Habilidad } from '../datos/clases';
import { pintarIcono } from './iconos_recetas';
import { MAT, type RGB } from './icono_pintor';

const cache = new Map<string, HTMLCanvasElement>();
/** Cuánto tardó lo pintado (para medir el primer horneado: `window.__iconosHorneado`). */
export const horneado = { ms: 0, n: 0, max: 0 };
(globalThis as any).__iconosHorneado = horneado;

/** El marco a pixel: canto negro, bisel de bronce (oro en las definitivas, con una gema en cada esquina), canto negro. */
function marcoPixel(d: Uint8ClampedArray, T: number, oro: boolean, gema: RGB[]) {
  const m = oro ? MAT.oro : MAT.bronce, w = T >= 44 ? 3 : 2;
  const pon = (x: number, y: number, c: RGB) => { const i = (y * T + x) * 4; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; };
  for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) {
    const e = Math.min(x, y, T - 1 - x, T - 1 - y); if (e > w) continue;
    if (e === 0 || e === w) { pon(x, y, e === 0 ? [10, 7, 6] : m[0]); continue; }
    const luz = (y === e && x < T - 1 - e) || (x === e && y < T - 1 - e);
    pon(x, y, luz ? (e === 1 ? m[5] : m[4]) : e === 1 ? m[2] : m[1]);
  }
  for (const [cx, cy] of [[w, w], [T - 1 - w, w], [w, T - 1 - w], [T - 1 - w, T - 1 - w]]) {
    if (oro) { for (const [dx, dy, k] of [[0, 0, 3], [1, 0, 4], [0, 1, 2], [1, 1, 1], [-1, 0, 2], [0, -1, 4]]) { const x = cx + dx - (cx > T / 2 ? 1 : 0), y = cy + dy - (cy > T / 2 ? 1 : 0); if (x >= 0 && y >= 0 && x < T && y < T) pon(x, y, gema[k]); } pon(cx - (cx > T / 2 ? 1 : 0), cy - (cy > T / 2 ? 1 : 0), gema[5]); }
    else pon(cx, cy, m[5]);
  }
}

/** El icono de una habilidad, pintado y guardado, de s × s puntos (redondeado). */
export function iconoPintado(hb: Habilidad, s: number, apagado = false, redondo = false, soloGlifo = false, sinMarco = false): HTMLCanvasElement {
  // (los botones del HUD táctil pasan también seudo habilidades sin id: el escudo de Calmo, el golpe con el arma de la clase)
  const T = Math.max(8, Math.round(s)), clave = `${hb.id ?? ''}~${hb.glifo}~${hb.elem}|${T}|${apagado ? 1 : 0}${redondo ? 1 : 0}${soloGlifo ? 1 : 0}${sinMarco ? 1 : 0}`;
  let cv = cache.get(clave); if (cv) return cv;
  const t0 = performance.now();
  const d = pintarIcono(hb, T, { soloGlifo });
  if (!soloGlifo && !sinMarco && !redondo) marcoPixel(d, T, !!hb.definitiva, MAT.rubi);
  if (redondo && !soloGlifo) {
    const c = (T - 1) / 2, r = T / 2;
    for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const q = Math.hypot(x - c, y - c), i = (y * T + x) * 4; if (q > r - 0.5) d[i + 3] = 0; else if (q > r - 1.5) { d[i] = d[i] * 0.35; d[i + 1] = d[i + 1] * 0.35; d[i + 2] = d[i + 2] * 0.35; } }
  }
  if (apagado) for (let i = 0; i < d.length; i += 4) { const l = (d[i] * 0.3 + d[i + 1] * 0.55 + d[i + 2] * 0.15) * 0.42 + 6; d[i] = l; d[i + 1] = l * 0.97; d[i + 2] = l * 0.92; }
  cv = document.createElement('canvas'); cv.width = cv.height = T;
  cv.getContext('2d')!.putImageData(new ImageData(d as any, T, T), 0, 0);
  const ms = performance.now() - t0; horneado.ms += ms; horneado.n++; horneado.max = Math.max(horneado.max, ms);
  cache.set(clave, cv); if (cache.size > 600) cache.delete(cache.keys().next().value!);
  return cv;
}
