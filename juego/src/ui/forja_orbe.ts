// El orbe del HUD forjado: líquido de verdad dentro de una esfera de vidrio (Rick, 19 nov 2026: lleno se leía como una
// bola de billar, porque la superficie solo se veía al bajar). La superficie siempre se ve: el 100 % llega hasta un
// poco antes de la cúpula, con su menisco que trepa por el vidrio, el borde de la lámina iluminado desde arriba y las
// olas que corren. Adentro el líquido se mueve en volutas (ruido torcido que da la vuelta con el cuadro), con hilos de
// luz, más claro al frente y hundido hacia el borde y el fondo, burbujas que suben y el vidrio encima.
// No va en src/engine/gotico (cambiaría __PINTOR__): el orbe del motor queda para la barra de siempre.
import { Lienzo, PALETA as P, ladoOrbe, type C3, type TipoOrbe } from '../../../src/engine/gotico/hud';
import type { Raster } from '../../../src/engine/core/raster';
import { tono, hash, fbm, cl, LUZ } from './forja_taller';

/** Cuadros del ciclo del líquido (a 10 por segundo, 1,6 s la vuelta). */
export const CUADROS_LIQ = 16;
const ARO = 6;
const VIDRIO: C3[] = [[3, 2, 5], [7, 6, 11], [12, 10, 18], [19, 16, 27], [28, 24, 38], [39, 34, 51]];
const LIQ: Record<TipoOrbe, C3[]> = { vida: P.sangre, mana: P.mana, veneno: P.veneno, helado: P.hielo };
const mezcla = (a: C3, b: C3, t: number): C3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];

/**
 * Hasta dónde llega el líquido a la vista. Lleno es 0,93 del alto: queda un casquete fino de vidrio donde se ve la
 * superficie, pero se lee lleno. (Con 0,8, Rick, 20 nov 2026: "tengo la vida full pero no parece": la cúpula oscura de
 * arriba se leía como un quinto de vida perdida. Con 1 era la bola de billar de antes.)
 */
export const nivelVisto = (k: number) => (k <= 0 ? 0 : 0.03 + 0.9 * cl(k));

/**
 * Un cuadro del orbe. k de 0 (vacío) a 1 (lleno), cuadro de 0 a CUADROS_LIQ - 1 (cierra el ciclo), r el radio del vidrio.
 * El raster mide ladoOrbe(r) por lado, como el del motor.
 */
export function orbeVivo(tipo: TipoOrbe, k: number, cuadro: number, r: number): Raster {
  const S = ladoOrbe(r), l = new Lienzo(S, S), c = S / 2, liq = LIQ[tipo], e = r / 46;
  const nivel = nivelVisto(k), fase = ((cuadro % CUADROS_LIQ) / CUADROS_LIQ) * Math.PI * 2;
  const calma = tipo === 'helado' ? 0.2 : 1;
  // olas: dos trenes que corren en sentidos opuestos y un vaivén lento (siempre algo, también lleno)
  const amp = (0.9 + 1.1 * Math.sqrt(Math.max(0, Math.sin(Math.min(0.97, nivel) * Math.PI)))) * e * calma;
  const ySup = (x: number) => c + r - 2 * r * nivel
    + amp * (Math.sin((x / (r * 0.9)) * Math.PI * 2 + fase) * 0.6 + Math.sin((x / (r * 0.37)) * Math.PI * 2 - 2 * fase) * 0.32 + Math.sin(fase) * ((x - c) / r) * 0.9);
  // la curva de la lámina vista un poco desde arriba: el borde de atrás de la superficie (una elipse muy aplastada)
  const lamina = (x: number) => { const ys = ySup(x), semi = Math.sqrt(Math.max(0, 1 - ((ys - c) / r) ** 2)), u = (x - c) / r; const s2 = semi > 0.05 ? Math.sqrt(Math.max(0, 1 - (u / semi) ** 2)) : 0; return s2 * semi * r * 0.28; };
  // el giro del líquido: ruido torcido que da la vuelta (se recorre un círculo con la fase)
  const cf = Math.cos(fase), sf = Math.sin(fase);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const px = x + 0.5, py = y + 0.5, dx = (px - c) / r, dy = (py - c) / r, d2 = dx * dx + dy * dy;
    if (d2 > 1) continue;
    const nz = Math.sqrt(1 - d2), lu = dx * LUZ[0] + dy * LUZ[1] + nz * LUZ[2];
    let ys = ySup(px);
    // menisco: el líquido trepa por el vidrio en los bordes
    const semi = Math.sqrt(Math.max(0, 1 - ((ys - c) / r) ** 2)), borde = semi > 0.12 ? Math.abs(dx) / semi : 0;
    if (borde > 0.78) ys -= Math.min(3.2 * e + 0.6, ((borde - 0.78) / 0.22) ** 2 * 2.6 * e);
    const prof = py - ys, lam = lamina(px);
    let col: C3;
    if (prof >= 0 && nivel > 0) {
      // volutas: el líquido se mueve por dentro
      const q = fbm(dx * 1.3 + cf * 0.45 + 3, dy * 1.3 + sf * 0.45 + 7, 31);
      const w = fbm(dx * 1.7 + q * 2.4 - sf * 0.5, dy * 1.7 - q * 1.8 + cf * 0.5, 47);
      const giro = cl((w - 0.5) * 2.6, -1, 1) * calma;
      // hondura: más claro al frente y arriba (la luz entra por la lámina), hundido hacia el borde y el fondo
      const hondo = cl(prof / (1.6 * r));
      let v = 0.2 + 0.3 * lu + 0.2 * nz - 0.22 * hondo - 0.2 * (1 - nz) * (1 - nz) + 0.24 * giro * (0.4 + 0.6 * nz);
      // hilos de luz que se tuercen con las volutas
      const hilo = Math.abs(Math.sin(w * 11 + q * 3));
      if (hilo < 0.1 && nz > 0.5) v += 0.1 * (1 - hilo / 0.1) * calma;
      if (tipo === 'veneno') v += 0.06 * Math.sin(dx * 9 - fase + dy * 6) - 0.03;
      // la luz que baja de la superficie en un abanico
      v += 0.12 * Math.exp(-prof / (5 * e)) * nz;
      // la lámina: un canto claro y debajo una franja con brillo
      if (prof < 1) v = 0.97;
      else if (prof < 2.2 * e + 0.4) v += 0.26;
      else if (prof < 4 * e) v += 0.1;
      col = tono(liq, v, x, y);
    } else if (nivel > 0 && prof >= -lam - 0.5 && prof < 0 && borde < 0.98) {
      // la cara de arriba de la lámina, vista de canto: el reflejo del cielo con destellos que corren por ella
      const u = (dx + 1) / 2, gl = Math.sin(u * 22 - fase * 2) * 0.5 + Math.sin(u * 9 + fase) * 0.5;
      const fr = cl(-prof / Math.max(1, lam)), v = 0.7 - 0.26 * fr + 0.14 * gl - 0.16 * Math.abs(dx);
      col = tono(liq, v, x, y);
      // el canto de atrás de la lámina, donde toca el vidrio: una línea clara que cierra la elipse
      if (prof < -lam + 0.6 && lam > 1.2) col = tono(liq, 0.84 + 0.1 * gl, x, y);
      if (gl > 0.72 && hash(x, y + cuadro * 7, 5) < 0.5) col = mezcla(col, liq[8], 0.6);
    } else {
      // vidrio vacío, oscuro y apenas teñido por el líquido
      const v = 0.18 + 0.35 * lu * nz + 0.1 * nz;
      col = mezcla(tono(VIDRIO, v, x, y), liq[2], 0.12);
      // el reflejo del líquido en la cara de atrás del vidrio, arriba de la superficie
      if (nivel > 0 && prof > -7 * e && prof < 0) col = mezcla(col, liq[3], 0.28 * (1 + prof / (7 * e)));
    }
    l.px(x, y, col);
  }
  // burbujas (o cristales de hielo) que suben y se deshacen en la lámina
  const nb = tipo === 'veneno' ? 13 : tipo === 'helado' ? 6 : 10;
  for (let b = 0; b < nb; b++) {
    const t = ((cuadro % CUADROS_LIQ) / CUADROS_LIQ * (1 + (b % 2)) + hash(b, 3, 7)) % 1;
    const span = (16 + hash(b, 4, 7) * 22) * e;
    const bx = c + (hash(b, 1, 7) - 0.5) * 1.2 * r + Math.sin(t * Math.PI * 4 + b) * 0.9;
    const by = c + r * 0.84 - hash(b, 2, 7) * r * 0.9 - t * span;
    const ddx = (bx - c) / r, ddy = (by - c) / r;
    if (ddx * ddx + ddy * ddy > 0.74 || by < ySup(bx) + 2) continue;
    if (tipo === 'helado') {
      const kk = Math.sin(t * Math.PI);
      l.px(bx, by, liq[8], 0.4 + 0.6 * kk);
      if (kk > 0.6) { l.px(bx - 1, by, liq[7], 0.5); l.px(bx + 1, by, liq[7], 0.5); l.px(bx, by - 1, liq[7], 0.5); l.px(bx, by + 1, liq[7], 0.5); }
      continue;
    }
    if (t < 0.35 || (tipo !== 'veneno' && hash(b, 5, 7) < 0.4)) l.px(bx, by, liq[7], 0.75);
    else { l.px(bx, by, liq[8]); l.px(bx + 1, by, liq[6]); l.px(bx, by + 1, liq[6]); l.px(bx + 1, by + 1, liq[4]); }
  }
  // una burbuja que revienta en la lámina de vez en cuando (un anillo de dos cuadros)
  { const b = cuadro % CUADROS_LIQ, xr = c + (hash(b >> 2, 9, 3) - 0.5) * r * 0.9;
    if (nivel > 0.06 && (b & 7) < 2) { const yr = ySup(xr) - 1, rr = (b & 3) + 1; for (let a = 0; a < 8; a++) l.px(xr + Math.cos((a * Math.PI) / 4) * rr, yr + Math.sin((a * Math.PI) / 4) * rr * 0.4, liq[8], 0.55 - (b & 3) * 0.2); } }
  // escarcha que trepa desde el borde (congelado)
  if (tipo === 'helado') {
    for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
      const dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r, d = Math.hypot(dx, dy);
      if (d > 1 || d < 0.7) continue;
      const a = Math.atan2(dy, dx), n = fbm(Math.cos(a) * 3 + 5, Math.sin(a) * 3 + 5, 21) * 0.6 + hash(x, y, 4) * 0.4;
      if (n > 1.55 - ((d - 0.7) / 0.3) * 0.95) l.px(x, y, tono(P.hielo, 0.65 + (d - 0.7), x, y), 0.85);
    }
  }
  // vidrio: el líquido visto a través del canto (refracción), borde oscuro, media luna de brillo y destello
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r, d = Math.hypot(dx, dy);
    if (d > 1) continue;
    const ang = (Math.atan2(dy, dx) * 180) / Math.PI;
    if (d > 0.84 && d < 0.93 && ang > 15 && ang < 120 && y + 0.5 > ySup(x + 0.5)) {
      const kk = Math.sin(((ang - 15) / 105) * Math.PI) * Math.sin(((d - 0.84) / 0.09) * Math.PI);
      if (kk > bayer(x, y) * 0.8) l.px(x, y, liq[7], 0.45 * kk + 0.1);
    }
    if (d > 0.9) l.mul(x, y, 0.82 - (d - 0.9) * 3);
    if (d > 0.965) l.px(x, y, VIDRIO[0], 0.8);
    const a2 = ang < 0 ? ang + 360 : ang;
    if (d > 0.62 && d < 0.9 && a2 > 188 && a2 < 282) {
      const kk = Math.sin(((d - 0.62) / 0.28) * Math.PI) * Math.sin(((a2 - 188) / 94) * Math.PI);
      if (kk > 0.3 + bayer(x, y) * 0.55) l.px(x, y, [235, 240, 250], 0.12 + 0.26 * kk);
      if (kk > 0.88) l.px(x, y, [255, 255, 255], 0.25);
    }
  }
  const sx = c - r * 0.44, sy = c - r * 0.5;
  for (let y = Math.floor(sy - 3); y <= sy + 3; y++) for (let x = Math.floor(sx - 3); x <= sx + 3; x++) {
    const d = Math.hypot((x + 0.5 - sx) / 1.25, y + 0.5 - sy);
    if (d < 1.3) l.px(x, y, [255, 255, 255], 0.9); else if (d < 2.5) l.px(x, y, [235, 240, 255], 0.3);
  }
  l.px(c + r * 0.34, c + r * 0.55, [255, 255, 255], 0.5); l.px(c + r * 0.38, c + r * 0.52, [255, 255, 255], 0.3);
  // aro de hierro forjado con remaches de latón
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = x + 0.5 - c, dy = y + 0.5 - c, d = Math.hypot(dx, dy);
    if (d <= r || d > r + ARO) continue;
    const u = (d - r) / ARO, nr = (u - 0.45) * 1.9, nzz = Math.sqrt(Math.max(0, 1 - nr * nr));
    const lu = (dx / d) * nr * LUZ[0] + (dy / d) * nr * LUZ[1] + nzz * LUZ[2];
    let v = 0.05 + lu * 0.85 + (fbm(Math.atan2(dy, dx) * 9, u * 2, 5) - 0.5) * 0.15;
    if (d < r + 1 || d > r + ARO - 1) v = 0.02;
    l.px(x, y, tono(P.hierro, v, x, y));
  }
  for (let q = 0; q < 8; q++) {
    const a = (q / 8) * Math.PI * 2 + Math.PI / 8, rx = Math.round(c + Math.cos(a) * (r + ARO / 2)) - 0.5, ry = Math.round(c + Math.sin(a) * (r + ARO / 2)) - 0.5, R = 1.9;
    for (let y = Math.floor(ry - R); y <= ry + R; y++) for (let x = Math.floor(rx - R); x <= rx + R; x++) {
      const ux = (x - rx) / R, uy = (y - ry) / R, dd = ux * ux + uy * uy; if (dd > 1) continue;
      const lu = ux * LUZ[0] + uy * LUZ[1] + Math.sqrt(1 - dd) * LUZ[2];
      l.px(x, y, tono(P.laton, dd > 0.7 ? Math.min(0.3, 0.15 + lu * 0.8) : 0.15 + lu * 0.8, x, y));
    }
  }
  return l.r;
}
