// El primer plano del héroe en las cinemáticas: el grande de la vigilia (motor/vigilia.ts, pixel art con su equipo de
// verdad, el mismo que el jugador ve al elegirlo; casi siempre ya está en IndexedDB `marca_vigilia`). Va en la oscuridad y lo
// alumbra solo la Marca, desde abajo, en el brazo del arma: una luz roja que late, calculada con el relieve del cuadro (la
// normal de cada punto mira o no a la Marca) y que se apaga con la distancia. Lo que no mira a la luz queda en sombra.
import { ctx, W, H, RES } from '../nucleo/lienzo';
import { pedidoGrande } from './vigilia';
import { cercano, cuadroV, SEL_ENT, SEL_N, type CuadroV } from '../motor/vigilia';
import type { DatosHeroe } from '../juego/heroe';

/** Pide el grande en segundo plano (al entrar a la zona del jefe, al caer el jefe). */
export function pedirRostro(d: DatosHeroe) { try { pedidoGrande(d, 0); } catch { /* nada */ } }
/** ¿Está el reposo pintado (al menos 6 cuadros, para que respire)? */
export function rostroListo(d: DatosHeroe): boolean {
  try { const p = pedidoGrande(d, 0); let n = 0; for (let f = SEL_ENT; f < SEL_N; f++) if (p.crudos[f]) n++; return n >= 6; } catch { return false; }
}
(window as any).__rostroListo = (d?: DatosHeroe) => { const j = (window as any).__juego?.(); const h = d ?? j?.heroe?.d; return h ? rostroListo(h) : false; };

const nrm = (a: number, b: number, c: number): [number, number, number] => { const l = Math.hypot(a, b, c) || 1; return [a / l, b / l, c / l]; };
/** La luz de la Marca sobre un cuadro: dónde (la mano del arma, un poco hacia el cuerpo y adelante) y cuánto a cada punto. */
const rojos = new Map<string, { c: HTMLCanvasElement; base: HTMLCanvasElement }>();
function luzMarca(q: CuadroV): { c: HTMLCanvasElement; base: HTMLCanvasElement } {
  const k = q.atlas; const ya = rojos.get(k); if (ya) return ya;
  const w = q.w, h = q.h, g = q.cv.getContext('2d')!, d = g.getImageData(0, 0, w, h).data;
  const rel = q.rel ? q.rel.getContext('2d')!.getImageData(0, 0, w, h).data : null;
  // la Marca: en el antebrazo del arma (la mano que sale de la hoja, corrida hacia el pecho); sin arma, a media altura
  const hx = q.hoja ? q.ax + q.hoja[0] : w * 0.5;
  const mx = hx + (q.ax - hx) * 0.5, my = q.ay * 0.4, mz = h * 0.3, R = q.ay * 0.3;
  const out = new ImageData(w, h), o = out.data, base = new ImageData(w, h), b = base.data;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (d[i + 3] < 10) continue;
    let n: [number, number, number] = [0, 0, 1];
    if (rel && rel[i + 3] / 255 >= 0.3) { const n0 = rel[i] / 127.5 - 1, n1 = rel[i + 1] / 127.5 - 1, n2 = rel[i + 2] / 127.5 - 1; n = nrm((n0 - n1) * 0.7071, (n0 + n1) * 0.7071, n2); }
    else {
      // (sin relieve, que solo viene con la luz por GPU: la forma sale del brillo del propio cuadro, como un bajorrelieve,
      //  y del borde de la silueta, que mira hacia afuera)
      const lu = (xx: number, yy: number) => { const j = (Math.min(h - 1, Math.max(0, yy)) * w + Math.min(w - 1, Math.max(0, xx))) * 4; return d[j + 3] < 10 ? -0.6 : (0.3 * d[j] + 0.59 * d[j + 1] + 0.11 * d[j + 2]) / 255; };
      n = nrm((lu(x - 1, y) - lu(x + 1, y)) * 2.2, (lu(x, y - 1) - lu(x, y + 1)) * 2.2, 1);
    }
    const L = nrm(mx - x, my - y, mz), dif = Math.max(0, n[0] * L[0] + n[1] * L[1] + n[2] * L[2]);
    const dd = Math.hypot(mx - x, (my - y) * 1.1), cae = 1 / (1 + (dd / R) ** 2.2);
    // desde abajo: lo que queda por encima de la Marca recibe menos (la luz sube y se pierde), lo de abajo casi nada
    const sube = y < my ? 1 : Math.max(0, 1 - (y - my) / (q.ay * 0.16));
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const v = Math.min(1, dif * cae * sube * 1.6) * (0.4 + lum) * 255;
    o[i] = Math.min(255, v * 1.15); o[i + 1] = Math.min(255, v * 0.32); o[i + 2] = Math.min(255, v * 0.12); o[i + 3] = d[i + 3];
    // el cuerpo a oscuras: el color apagado y frío (la noche), sin la fogata de la vigilia
    b[i] = d[i] * 0.22; b[i + 1] = d[i + 1] * 0.21; b[i + 2] = d[i + 2] * 0.27; b[i + 3] = d[i + 3];
  }
  const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')!.putImageData(out, 0, 0);
  const bc = document.createElement('canvas'); bc.width = w; bc.height = h; bc.getContext('2d')!.putImageData(base, 0, 0);
  const r = { c, base: bc }; rojos.set(k, r); if (rojos.size > 24) rojos.delete(rojos.keys().next().value!);
  return r;
}

/**
 * El primer plano: la figura grande, de la cabeza al pecho y la mano, en la oscuridad, alumbrada por la Marca que late (`lat`,
 * 0 a 1). `k` es la entrada (la luz sube desde el negro). Devuelve false si todavía no hay nada pintado.
 */
export function dibujarRostro(d: DatosHeroe, tl: number, lat: number, k: number): boolean {
  const p = pedidoGrande(d, 2);
  const f = cercano(p, SEL_ENT + (Math.floor(tl * 6) % (SEL_N - SEL_ENT)), SEL_ENT, SEL_N); if (f === null) return false;
  const q = cuadroV(p, f); if (!q) return false;
  const { c, base } = luzMarca(q);
  // a puntos enteros del aparato: la figura de algo más que la pantalla de alto (se ve de la cabeza a la cintura)
  const dev = Math.max(1, Math.round((H * RES * 1.25) / q.h)), esc = dev / RES;
  const acerca = tl * 0.6;
  const x = Math.round((W * 0.5 - q.ax * esc) * RES) / RES;
  const y = Math.round((H * 0.12 - acerca) * RES) / RES;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = k; ctx.drawImage(base, 0, 0, q.w, q.h, x, y, q.w * esc, q.h * esc);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * (0.55 + 0.6 * lat);
  ctx.drawImage(c, 0, 0, q.w, q.h, x, y, q.w * esc, q.h * esc);
  // un poco más encendido cerca de la Marca en el golpe del latido (el brazo arde un instante)
  if (lat > 0.5) { ctx.globalAlpha = k * (lat - 0.5) * 0.7; ctx.drawImage(c, 0, 0, q.w, q.h, x, y, q.w * esc, q.h * esc); }
  ctx.restore();
  // el resplandor de la Marca en el aire (blando: es luz), donde está en la pantalla
  const hx = q.hoja ? q.ax + q.hoja[0] : q.w * 0.5;
  const mx = x + (hx + (q.ax - hx) * 0.5) * esc, my = y + q.ay * 0.4 * esc, R = q.h * esc * (0.18 + 0.05 * lat);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(mx, my, 0, mx, my, R); g.addColorStop(0, `rgba(255,70,24,${0.32 * k * (0.5 + 0.6 * lat)})`); g.addColorStop(1, 'rgba(120,10,0,0)');
  ctx.fillStyle = g; ctx.fillRect(mx - R, my - R, R * 2, R * 2); ctx.restore();
  (window as any).__rostroDib = { f, esc, x, y, mx, my };
  return true;
}
