// El taller del HUD forjado: se esculpe en un mapa de alturas con su material (piedra, hierro, latón, hueco y piedra de
// talla) y se hornea una sola vez con la luz de la barra y del rosetón (arriba a la izquierda y un poco de frente):
// normales del relieve, sombra que cae, oclusión, contorno oscuro y tramado ordenado. Así las molduras, el arco de las
// casas de los orbes y las esculturas (la gárgola y la doliente) salen del mismo cincel y con la misma luz.
// No va en src/engine/gotico (cambiaría __PINTOR__): copia lo poco que necesita de hud.ts.
import { Lienzo, PALETA as P, type C3 } from '../../../src/engine/gotico/hud';

type Rampa = C3[];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const cl = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
export function tono(r: Rampa, v: number, x: number, y: number): C3 {
  const t = cl(v) * (r.length - 1), b = Math.floor(t);
  return r[Math.min(r.length - 1, t - b > BAYER[(y & 3) * 4 + (x & 3)] ? b + 1 : b)];
}
export function hash(x: number, y: number, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
function ruido(x: number, y: number, s = 0) {
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export const fbm = (x: number, y: number, s = 0) => ruido(x, y, s) * 0.55 + ruido(x * 2.1, y * 2.1, s + 7) * 0.3 + ruido(x * 4.3, y * 4.3, s + 13) * 0.15;
const hx = (h: string): C3 => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const rampa = (...hs: string[]): Rampa => hs.map(hx);
export const LUZ = (() => { const v = [-0.5, -0.62, 0.6]; const n = Math.hypot(...v); return v.map((c) => c / n) as [number, number, number]; })();

export const M = { VACIO: 0, PIEDRA: 1, HIERRO: 2, LATON: 3, HUECO: 4, TALLA: 5, CERA: 6 } as const;
/** La piedra del panel: gris de ceniza tibio (la de la barra vieja con un poco más de cuerpo, para que se lea tallada). */
const PIEDRA = rampa('#080605', '#110e0c', '#1a1512', '#241e19', '#2f2721', '#3b322a', '#493e34', '#594c40', '#6c5d4e', '#83715f', '#9c8771');
/** La piedra de las esculturas: más clara y más cálida, gastada (para que se despeguen del muro). */
const TALLA = rampa('#080706', '#12100d', '#1c1814', '#27211b', '#332b23', '#40362c', '#4f4336', '#605142', '#74624f', '#8b7660', '#a38d74');
const HUECO = rampa('#030203', '#070505', '#0c0908', '#120e0c', '#1a1411');
const CERA = rampa('#3a3024', '#6c5d44', '#a49274', '#d4c4a0', '#f2e8cc');
const RAMPAS: Record<number, Rampa> = { 1: PIEDRA, 2: P.hierro, 3: P.laton, 4: HUECO, 5: TALLA, 6: CERA };
const BASE: Record<number, number> = { 1: 0.42, 2: 0.42, 3: 0.56, 4: 0.3, 5: 0.46, 6: 0.55 };
const CONTRASTE: Record<number, number> = { 1: 0.95, 2: 0.95, 3: 0.95, 4: 0.5, 5: 1.05, 6: 0.8 };

type Modo = 'max' | 'set' | 'cavar';
/** Un mapa de alturas con material, para esculpir el panel y después hornearlo con luz. */
export class Taller {
  alt: Float32Array; mat: Uint8Array;
  constructor(public w: number, public h: number) { this.alt = new Float32Array(w * h); this.mat = new Uint8Array(w * h); }
  den(x: number, y: number) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }
  pon(x: number, y: number, a: number, m: number, modo: Modo = 'max') {
    x |= 0; y |= 0; if (!this.den(x, y)) return;
    const i = y * this.w + x;
    if (modo === 'set' || this.mat[i] === 0 || (modo === 'max' && a >= this.alt[i])) { this.alt[i] = a; if (m) this.mat[i] = m; }
    else if (modo === 'cavar' && a < this.alt[i]) { this.alt[i] = a; if (m) this.mat[i] = m; }
  }
  /**
   * Una forma cualquiera (en(x, y)) con su bisel de b puntos que sigue el contorno (distancia de chaflán): convexa sube
   * `alto` desde base hasta el plano de arriba; hundida baja `alto` hacia adentro (un hueco con paredes).
   */
  forma(x0: number, y0: number, x1: number, y1: number, en: (x: number, y: number) => boolean, m: number, base: number, b: number, o: { alto?: number; hundido?: boolean; modo?: Modo; plano?: (x: number, y: number) => number } = {}) {
    x0 = Math.floor(x0) - 1; y0 = Math.floor(y0) - 1; x1 = Math.ceil(x1) + 1; y1 = Math.ceil(y1) + 1;
    const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) d[y * w + x] = en(x0 + x, y0 + y) ? 1e9 : 0;
    // chaflán 3-4 en dos pasadas
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = y * w + x; if (!d[i]) continue; let v = d[i];
      if (x > 0) v = Math.min(v, d[i - 1] + 3); if (y > 0) { v = Math.min(v, d[i - w] + 3); if (x > 0) v = Math.min(v, d[i - w - 1] + 4); if (x < w - 1) v = Math.min(v, d[i - w + 1] + 4); } d[i] = v; }
    for (let y = h - 1; y >= 0; y--) for (let x = w - 1; x >= 0; x--) { const i = y * w + x; if (!d[i]) continue; let v = d[i];
      if (x < w - 1) v = Math.min(v, d[i + 1] + 3); if (y < h - 1) { v = Math.min(v, d[i + w] + 3); if (x < w - 1) v = Math.min(v, d[i + w + 1] + 4); if (x > 0) v = Math.min(v, d[i + w - 1] + 4); } d[i] = v; }
    const alto = o.alto ?? b * 0.9, modo = o.modo ?? (o.hundido ? 'set' : 'max');
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const e = d[y * w + x]; if (!e) continue;
      const t = cl((e / 3 - 0.5) / Math.max(0.5, b));
      const pl = o.plano ? o.plano(x0 + x, y0 + y) : 0;
      const a = o.hundido ? base - alto * t + pl : base + alto * Math.sqrt(t * (2 - t)) + pl;
      this.pon(x0 + x, y0 + y, a, m, modo);
    }
  }
  caja(x: number, y: number, w: number, h: number, m: number, base: number, b: number, o: { alto?: number; hundido?: boolean; modo?: Modo; plano?: (x: number, y: number) => number } = {}) {
    this.forma(x, y, x + w - 1, y + h - 1, (px, py) => px >= x && py >= y && px < x + w && py < y + h, m, base, b, o);
  }
  /** Elipsoide (rx, ry en el plano, rz de alto) sobre base, con unión suave (k) a lo que ya hay. */
  elipsoide(cx: number, cy: number, rx: number, ry: number, rz: number, m: number, base: number, k = 0) {
    for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry, q = dx * dx + dy * dy; if (q > 1) continue;
      this.suave(x, y, base + rz * Math.sqrt(1 - q), m, k);
    }
  }
  /** Cápsula de (x0, y0) a (x1, y1) con radio de r0 a r1 (rz: cuánto sobresale respecto del radio). */
  capsula(x0: number, y0: number, x1: number, y1: number, r0: number, r1: number, m: number, base: number, rz = 1, k = 0) {
    const vx = x1 - x0, vy = y1 - y0, l2 = vx * vx + vy * vy || 1e-6, rr = Math.max(r0, r1);
    for (let y = Math.floor(Math.min(y0, y1) - rr); y <= Math.max(y0, y1) + rr; y++) for (let x = Math.floor(Math.min(x0, x1) - rr); x <= Math.max(x0, x1) + rr; x++) {
      const px = x + 0.5, py = y + 0.5, t = cl(((px - x0) * vx + (py - y0) * vy) / l2), r = r0 + (r1 - r0) * t;
      const dd = Math.hypot(px - x0 - vx * t, py - y0 - vy * t); if (dd > r) continue;
      this.suave(x, y, base + r * rz * Math.sqrt(1 - (dd / r) ** 2), m, k);
    }
  }
  /** Una cadena de cápsulas por los puntos [x, y, r]. */
  cadena(pts: [number, number, number][], m: number, base: number, rz = 1, k = 0) { for (let i = 0; i + 1 < pts.length; i++) this.capsula(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pts[i][2], pts[i + 1][2], m, base, rz, k); }
  /** Unión suave: max con un redondeo de k donde dos piezas se juntan (para las esculturas). */
  suave(x: number, y: number, a: number, m: number, k: number) {
    x |= 0; y |= 0; if (!this.den(x, y)) return;
    const i = y * this.w + x;
    if (this.mat[i] === 0) { this.alt[i] = a; this.mat[i] = m; return; }
    const b = this.alt[i];
    if (k > 0) { const hh = Math.max(k - Math.abs(a - b), 0) / k; const v = Math.max(a, b) + hh * hh * k * 0.25; if (a >= b) this.mat[i] = m; this.alt[i] = v; }
    else if (a >= b) { this.alt[i] = a; this.mat[i] = m; }
  }
  /** Anillo convexo (toro) entre r0 y r1. */
  anillo(cx: number, cy: number, r0: number, r1: number, m: number, base: number, alto: number) {
    for (let y = Math.floor(cy - r1); y <= cy + r1; y++) for (let x = Math.floor(cx - r1); x <= cx + r1; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy); if (d < r0 || d > r1) continue;
      this.pon(x, y, base + alto * Math.sin(Math.PI * cl((d - r0) / (r1 - r0))), m);
    }
  }
  /** Cava un surco (baja la altura) en cada punto de la lista. */
  surco(pts: [number, number][], prof: number, m = 0) { for (const [x, y] of pts) { if (!this.den(x, y)) continue; const i = (y | 0) * this.w + (x | 0); if (!this.mat[i]) continue; this.alt[i] -= prof; if (m) this.mat[i] = m; } }
  /** Cava un disco hundido (un pozo con paredes). */
  pozo(cx: number, cy: number, r: number, prof: number, m = 0) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy) / r; if (d > 1 || !this.den(x, y)) continue;
      const i = y * this.w + x; if (!this.mat[i]) continue;
      this.alt[i] -= prof * cl((1 - d) * 2.2); if (m && d < 0.75) this.mat[i] = m;
    }
  }
  /** Pega otro taller (una escultura armada aparte) con su origen en (ox, oy) y alturas + base. */
  pegar(t: Taller, ox: number, oy: number, base: number) {
    for (let y = 0; y < t.h; y++) for (let x = 0; x < t.w; x++) { const i = y * t.w + x; if (t.mat[i]) this.pon(ox + x, oy + y, t.alt[i] + base, t.mat[i], 'set'); }
  }
  /** Juntas de sillería: hiladas cada `alto` puntos y llagas trabadas, cavadas un punto donde hay piedra plana. */
  sillares(x0: number, y0: number, w: number, h: number, alto: number, largo: number, semilla: number, prof = 1.4) {
    const pts: [number, number][] = [];
    for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) {
      const fila = Math.floor((y - y0) / alto), yy = (y - y0) % alto, off = (fila % 2) * (largo / 2) + Math.floor(hash(fila, 3, semilla) * 6);
      const xx = (x - x0 + off) % largo;
      if (yy === 0 || xx === 0) pts.push([x, y]);
    }
    for (const [x, y] of pts) { const i = y * this.w + x; if (this.den(x, y) && this.mat[i] === M.PIEDRA) this.alt[i] -= prof; }
  }

  /** Hornea el relieve con la luz: color de la rampa de cada material, sombra que cae, oclusión, contorno y tramado. */
  hornear(o: { sombraMundo?: number } = {}): Lienzo {
    const { w, h, alt, mat } = this, l = new Lienzo(w, h);
    const A = (x: number, y: number) => { if (x < 0 || y < 0 || x >= w || y >= h) return -6; const i = y * w + x; return mat[i] ? alt[i] : -6; };
    // oclusión: lo que está más bajo que su entorno (radio 4) se oscurece, lo que sobresale toma un poco de luz
    const prom = new Float32Array(w * h);
    { const tmp = new Float32Array(w * h), R = 4;
      for (let y = 0; y < h; y++) { let s = 0; for (let x = -R; x <= R; x++) s += A(x, y); for (let x = 0; x < w; x++) { tmp[y * w + x] = s / (2 * R + 1); s += A(x + R + 1, y) - A(x - R, y); } }
      for (let x = 0; x < w; x++) { let s = 0; for (let y = -R; y <= R; y++) s += y >= 0 && y < h ? tmp[y * w + x] : -6; for (let y = 0; y < h; y++) { prom[y * w + x] = s / (2 * R + 1); const a = y + R + 1, b = y - R; s += (a < h ? tmp[a * w + x] : -6) - (b >= 0 ? tmp[b * w + x] : -6); } } }
    const lx = 0.63, ly = 0.78;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, m = mat[i]; if (!m) continue;
      const a = alt[i];
      const dx = (A(x + 1, y) - A(x - 1, y)) / 2, dy = (A(x, y + 1) - A(x, y - 1)) / 2;
      const nx = -dx, ny = -dy, nz = 1.6, nl = Math.hypot(nx, ny, nz);
      const lu = (nx * LUZ[0] + ny * LUZ[1] + nz * LUZ[2]) / nl - LUZ[2];
      let v = BASE[m] + lu * CONTRASTE[m];
      // textura del material
      if (m === M.PIEDRA) v += (fbm(x / 9, y / 6, 3) - 0.5) * 0.2 + (hash(x, y, 5) - 0.5) * 0.06 - (fbm(x / 23, y / 17, 9) > 0.62 ? 0.06 : 0);
      else if (m === M.TALLA) v += (fbm(x / 4, y / 4, 11) - 0.5) * 0.16 + (hash(x, y, 6) - 0.5) * 0.05;
      else if (m === M.LATON) v += (fbm(x / 10, y / 1.6, 13) - 0.5) * 0.14 + (hash(x, y, 7) - 0.5) * 0.04;
      else if (m === M.HIERRO) v += (fbm(x / 14, y / 3, 17) - 0.5) * 0.16 + (hash(x, y, 8) - 0.5) * 0.05;
      else if (m === M.HUECO) v += (hash(x, y, 9) - 0.5) * 0.08;
      // la piedra junta hollín abajo y toma luz arriba
      if (m === M.PIEDRA || m === M.TALLA) v += 0.07 - (y / h) * 0.14;
      // oclusión y realce
      v += cl((a - prom[i]) * 0.045, -0.22, 0.12);
      // sombra que cae desde arriba a la izquierda
      let sombra = 0;
      for (let s = 1; s <= 12; s++) { const sx = Math.round(x - lx * s), sy = Math.round(y - ly * s); const q = A(sx, sy); if (q > a + s * 0.62 + 0.3) { sombra = 1 - (s - 1) / 16; break; } }
      v -= sombra * (m === M.LATON ? 0.3 : 0.24);
      // contorno: el canto que da al aire y los escalones fuertes hacia abajo a la derecha
      const r = RAMPAS[m];
      let c: C3;
      const borde = A(x - 1, y) < -5 || A(x + 1, y) < -5 || A(x, y - 1) < -5 || A(x, y + 1) < -5;
      if (borde) c = r[0];
      else if (A(x + 1, y) < a - 3.2 || A(x, y + 1) < a - 3.2) c = tono(r, Math.min(v, 0.12), x, y);
      else c = tono(r, v, x, y);
      l.px(x, y, c);
    }
    // la sombra del panel sobre el mundo: un halo oscuro corto encima de la silueta
    const sm = o.sombraMundo ?? 6;
    if (sm > 0) for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (mat[y * w + x]) continue;
      let d = 99;
      for (let k = 1; k <= sm && d === 99; k++) for (let q = -1; q <= 1; q++) { const yy = y + k, xx = x + q; if (yy < h && xx >= 0 && xx < w && mat[yy * w + xx]) { d = k; break; } }
      if (d < 99) l.px(x, y, [0, 0, 0], 0.55 * (1 - (d - 1) / sm) ** 1.6);
    }
    return l;
  }
}

/** Un arco apuntado (ojiva) de semiancho a, radio rho, con arranque en ys: ¿(x, y) está adentro de la torre que corona? */
export function enOjiva(x: number, y: number, cx: number, ys: number, a: number, rho: number, yb: number) {
  const px = x + 0.5, py = y + 0.5;
  if (Math.abs(px - cx) > a || py > yb) return false;
  if (py >= ys) return true;
  return (px - (cx - a + rho)) ** 2 + (py - ys) ** 2 <= rho * rho && (px - (cx + a - rho)) ** 2 + (py - ys) ** 2 <= rho * rho;
}
/** Alto de la punta de la ojiva sobre su arranque. */
export const altoOjiva = (a: number, rho: number) => Math.sqrt(rho * rho - (rho - a) ** 2);
/** Puntos a lo largo del trasdós de la ojiva (para las crestas), de un lado al otro, cada `paso` puntos. */
export function bordeOjiva(cx: number, ys: number, a: number, rho: number, paso: number): [number, number][] {
  const out: [number, number][] = [], h = altoOjiva(a, rho), ang = Math.asin(h / rho);
  const n = Math.max(2, Math.floor((rho * ang) / paso));
  for (let i = 0; i <= n; i++) { const t = (i / n) * ang; out.push([cx - a + rho - rho * Math.cos(t), ys - rho * Math.sin(t)]); }
  return out;
}

// ------------------------------------------------------------------ las esculturas
/**
 * La gárgola: agazapada sobre su pedestal, mirando hacia adentro (s = 1 a la derecha), con las alas plegadas, los
 * cuernos hacia atrás, las garras agarradas al borde y la cola colgando. Devuelve el taller y dónde quedan sus ojos.
 */
export function gargola(f: number, s = 1): { t: Taller; ojos: [number, number][]; pie: [number, number] } {
  const W0 = Math.ceil(78 * f), H0 = Math.ceil(84 * f), t = new Taller(W0, H0);
  const ox = W0 / 2, oy = H0 - 6 * f; // el borde del pedestal (x 0 al centro, y hacia arriba)
  const P = (x: number, y: number): [number, number] => [ox + s * x * f, oy - y * f];
  const E = (x: number, y: number, rx: number, ry: number, rz: number, base = 0, m: number = M.TALLA, k = 3) => { const [a, b] = P(x, y); t.elipsoide(a, b, rx * f, ry * f, rz * f, m, base * f, k * f); };
  const C = (pts: [number, number, number][], base = 0, rz = 1, m: number = M.TALLA, k = 2.5) => t.cadena(pts.map(([x, y, r]) => [...P(x, y), r * f] as [number, number, number]), m, base * f, rz, k * f);
  // el ala plegada, detrás de todo: membrana baja con sus dedos en relieve y el borde festoneado
  { const ala: [number, number][] = [[-2, 40], [-9, 66], [-15, 74], [-21, 70], [-27, 60], [-30, 46], [-27, 32], [-18, 24], [-8, 26]].map(([x, y]) => P(x, y));
    const xs = ala.map((p) => p[0]), ys = ala.map((p) => p[1]);
    const dentro = (x: number, y: number) => { let c = false; for (let i = 0, j = ala.length - 1; i < ala.length; j = i++) { const [xi, yi] = ala[i], [xj, yj] = ala[j]; if ((yi > y + 0.5) !== (yj > y + 0.5) && x + 0.5 < xi + ((y + 0.5 - yi) / (yj - yi)) * (xj - xi)) c = !c; } return c; };
    t.forma(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), dentro, M.TALLA, 0, 3 * f, { alto: 3.5 * f });
    C([[-6, 44, 2.6], [-15, 74, 1.4]], 2); C([[-15, 74, 1.6], [-27, 61, 1.1]], 2); C([[-15, 74, 1.4], [-30, 46, 1]], 2); C([[-15, 74, 1.2], [-27, 32, 0.9]], 2);
    // el festón: mordidas entre las puntas de los dedos
    for (const [x, y] of [[-23, 66], [-30, 53], [-29, 39], [-23, 28]] as [number, number][]) { const [a, b] = P(x, y); t.pozo(a, b, 3.2 * f, 8 * f); for (let yy = Math.floor(b - 3 * f); yy <= b + 3 * f; yy++) for (let xx = Math.floor(a - 3 * f); xx <= a + 3 * f; xx++) if (Math.hypot(xx + 0.5 - a, yy + 0.5 - b) < 2.4 * f && t.den(xx, yy)) t.mat[yy * t.w + xx] = 0; }
  }
  // cola que cuelga por el borde del pedestal
  C([[-14, 8, 3.4], [-22, 4, 3], [-25, -6, 2.4], [-21, -14, 1.8], [-16, -15, 1.2]], 2, 1.1);
  { const [a, b] = P(-15, -15); t.elipsoide(a, b, 2.4 * f, 1.6 * f, 2 * f, M.TALLA, 2 * f, 0); }
  // anca, muslo y pie con las garras sobre el borde
  E(-8, 16, 15, 14, 13, 4); E(5, 13, 10, 9, 11, 6);
  C([[0, 3, 4.2], [12, 2, 3.2]], 6, 1.1);
  for (const q of [-1.6, 0, 1.6]) C([[12, 2 + q, 1.6], [16.5, -0.5 + q * 0.6, 1.1], [17.5, -3 + q * 0.4, 0.8]], 7, 1.2, M.TALLA, 0.8);
  // torso inclinado y pecho
  C([[-7, 20, 11.5], [4, 35, 10.5]], 8, 1.05); E(10, 35, 9, 9, 10, 9); E(5, 42, 9.5, 7, 9, 9);
  // la columna: una cresta de vértebras por el lomo
  for (let i = 0; i < 6; i++) { const u = i / 5; E(-14 + u * 14, 26 + u * 20, 2.4, 2.2, 2.2, 15, M.TALLA, 1.5); }
  // brazo: hombro, codo y la mano apoyada en la rodilla, con sus garras
  C([[8, 40, 5.4], [16, 27, 4.4], [17.5, 11, 3.6]], 14, 1.05);
  for (const q of [-1.5, 0, 1.5]) C([[18, 10 + q, 1.6], [22, 6 + q * 0.7, 1.1], [23, 3 + q * 0.4, 0.7]], 15, 1.2, M.TALLA, 0.8);
  // cuello y cabeza adelantada: cráneo, hocico, quijada, arco de las cejas, oreja y los cuernos hacia atrás
  C([[9, 43, 6.2], [17, 48, 5.2]], 14, 1);
  E(22, 50, 8, 7, 8.5, 16); C([[24, 48.5, 4.6], [33, 46.5, 3.1]], 17, 1.1); C([[23, 45.5, 3.2], [31, 42.5, 2.2]], 16, 1);
  C([[18, 54.5, 2.3], [27.5, 53, 2]], 22, 1.1, M.TALLA, 1);
  C([[17, 52, 1.8], [12, 57, 1.1]], 20, 1.2);
  C([[19, 55, 2.6], [14, 63, 2.1], [8, 68, 1.4], [4, 68.5, 0.8]], 20, 1.1, M.TALLA, 1.2);
  C([[23, 56, 2], [20, 63, 1.5], [16, 67, 0.9]], 18, 1.1, M.TALLA, 1);
  // la boca abierta y los colmillos
  { const pts: [number, number][] = []; for (let x = 25; x <= 32; x++) { const [a, b] = P(x, 45.6 - (x - 25) * 0.15); pts.push([a, b]); pts.push([a, b + 1]); } t.surco(pts, 5 * f, M.HUECO); }
  for (const x of [27, 30]) { const [a, b] = P(x, 45.5); t.pon(a, b, 30 * f, M.CERA, 'set'); t.pon(a, b + 1, 29 * f, M.CERA, 'set'); }
  // la cuenca del ojo, honda (ahí arde la brasa)
  const ojo = P(24.5, 51.5); t.pozo(ojo[0], ojo[1], 2.2 * f, 6 * f, M.HUECO);
  return { t, ojos: [ojo], pie: [ox, oy] };
}

/**
 * La doliente: una figura de pie con capucha, la cabeza gacha hacia adentro (s = -1 mira a la izquierda), las manos
 * juntas sobre el pecho sosteniendo una vela, el manto en pliegues que se abren hacia el ruedo.
 */
export function doliente(f: number, s = -1): { t: Taller; llama: [number, number]; pie: [number, number] } {
  const W0 = Math.ceil(58 * f), H0 = Math.ceil(92 * f), t = new Taller(W0, H0);
  const ox = W0 / 2, oy = H0 - 3 * f;
  // (x positivo es hacia donde mira)
  const X = (x: number, y: number): [number, number] => [ox + s * x * f, oy - y * f];
  const E = (x: number, y: number, rx: number, ry: number, rz: number, base = 0, m: number = M.TALLA, k = 3) => { const [a, b] = X(x, y); t.elipsoide(a, b, rx * f, ry * f, rz * f, m, base * f, k * f); };
  const C = (pts: [number, number, number][], base = 0, rz = 1, m: number = M.TALLA, k = 2.5) => t.cadena(pts.map(([x, y, r]) => [...X(x, y), r * f] as [number, number, number]), m, base * f, rz, k * f);
  // el manto: una columna que se ensancha hacia el ruedo, inclinada un poco hacia adelante arriba
  for (let yy = 0; yy <= 56; yy += 0.5) {
    const w = 17.5 - yy * 0.13 + (yy < 5 ? (5 - yy) * 0.6 : 0), cx = -1 + yy * 0.05;
    for (let xx = -w; xx <= w; xx += 0.5) {
      const u = xx / w, [a, b] = X(cx + xx, yy);
      const plie = Math.sin((xx + yy * 0.08 * Math.sign(xx)) * 1.15) * (yy < 46 ? 0.9 + (46 - yy) * 0.03 : 0.3);
      t.suave(a, b, (w * 0.75 * Math.sqrt(Math.max(0, 1 - u * u)) + plie) * f, M.TALLA, 0);
    }
  }
  // los pliegues hondos del manto, que se abren hacia abajo
  for (const x0 of [-9, -4.5, 0.5, 5.5, 10]) { const pts: [number, number][] = []; for (let yy = 4; yy <= 44; yy++) { const [a, b] = X(-1 + x0 * (1 + (44 - yy) * 0.012), yy); pts.push([a, b]); } t.surco(pts, 1.6 * f); }
  // hombros y velo que cae por la espalda
  E(0, 56, 11, 6, 9, 3); C([[-6, 66, 4.5], [-9, 50, 3.6], [-10, 36, 2]], 4, 1);
  // las mangas anchas que bajan hacia las manos juntas, adelante
  C([[6, 55, 4.6], [9, 46, 5.2], [10, 39, 5.6]], 6, 1); C([[-4, 55, 4.4], [3, 46, 5], [7, 39, 5.4]], 5, 1);
  E(11, 38, 5.6, 4.6, 6.5, 9);
  // las manos juntas y la vela
  E(13.5, 40, 3, 3.2, 3.6, 12); E(12, 41.5, 2.6, 2.4, 3, 13);
  C([[14.5, 43, 1.5], [14.5, 50, 1.4]], 14, 1.2, M.CERA, 0.6);
  // la cabeza gacha en su capucha: la capucha, su punta atrás y la abertura de la cara en sombra
  E(5, 64, 8.5, 9, 10, 6); C([[-2, 68, 4.2], [-6, 69, 2.6], [-8, 67, 1.4]], 8, 1); E(9, 61, 4.8, 6, 8, 9);
  { const [a, b] = X(10.5, 60.5); for (let yy = Math.floor(b - 5 * f); yy <= b + 5 * f; yy++) for (let xx = Math.floor(a - 3.4 * f); xx <= a + 3.4 * f; xx++) { const d = ((xx + 0.5 - a) / (3.4 * f)) ** 2 + ((yy + 0.5 - b) / (5 * f)) ** 2; if (d < 1 && t.den(xx, yy) && t.mat[yy * t.w + xx]) { const i = yy * t.w + xx; t.alt[i] -= 6 * f * (1 - d); if (d < 0.6) t.mat[i] = M.HUECO; } } }
  // la nariz y el mentón que asoman apenas de la sombra
  E(12.5, 59, 1.2, 1.6, 1.4, 12); E(11.5, 56.5, 1.6, 1.2, 1.2, 11);
  const llama = X(14.5, 52);
  return { t, llama, pie: [ox, oy] };
}
