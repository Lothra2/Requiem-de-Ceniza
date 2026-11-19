// El pintor de los íconos de habilidad: pixel art de verdad al tamaño exacto en que se ve (o a una base chica que se
// agranda por enteros). Sin DOM: devuelve los puntos RGBA, así lo usa el juego y también el laboratorio sin servidor.
//   - Formas por distancia con signo (círculos, elipses, cajas, polígonos, trazos que se afinan, curvas, arcos, estrellas,
//     restas y uniones), en un espacio de 32 x 32 unidades con transformaciones (mover, girar, escalar).
//   - Cada forma lleva un material: una rampa de 6 tonos con las sombras corridas de matiz. El tono sale de la normal de la
//     forma (bisel o redondez) y de la luz de arriba a la izquierda, la misma del HUD. Las emisivas (fuego, rayo, magia)
//     van del canto oscuro al núcleo blanco y encienden el fondo.
//   - Después: sombra que cae abajo a la derecha sobre lo de atrás, contorno selectivo (teñido del lado de la luz, casi
//     negro del otro), filo del color del elemento en el canto de la sombra, y el fondo del elemento: viñeta oscura en
//     bandas, el halo detrás del motivo y el resplandor de lo que arde, con trama de Bayer solo en el paso de una banda a otra.
export type RGB = [number, number, number];
const hx = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const R6 = (...c: string[]) => c.map(hx);
export const mezclar = (a: RGB, b: RGB, k: number): RGB => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];

/** Rampas de 6 tonos, de la sombra a la luz, con el matiz corrido (sombras frías o moradas, luces cálidas). */
export const MAT: Record<string, RGB[]> = {
  acero: R6('#16141f', '#2c3046', '#4c5670', '#7e8ca4', '#b8c4d4', '#f0f4fa'),
  hierro: R6('#100e14', '#221f2a', '#38363f', '#56545c', '#807c80', '#b0aaa4'),
  oro: R6('#260e04', '#56280a', '#985810', '#d49a26', '#f4d05c', '#fff6c4'),
  bronce: R6('#1c0c08', '#421e0e', '#764016', '#ac6c2a', '#d8a050', '#f6dca4'),
  cobre: R6('#1c0808', '#461810', '#82361e', '#bc622e', '#e89a58', '#ffd8a8'),
  madera: R6('#180c08', '#331c0e', '#563218', '#7e4e26', '#a6743c', '#cc9c62'),
  hueso: R6('#241a14', '#544232', '#887458', '#b8a682', '#ded2ac', '#fff8e2'),
  piel: R6('#2a1210', '#5a2a1e', '#8c4c34', '#bc7a56', '#e2a884', '#fad6bc'),
  cuero: R6('#180a08', '#381a10', '#5c2e18', '#844a26', '#a86c3a', '#ca9658'),
  tela: R6('#1c0408', '#420a10', '#741418', '#a82820', '#d44e2e', '#f6884c'),
  piedra: R6('#141218', '#2a2630', '#443e46', '#68605e', '#948a7e', '#c4b8a2'),
  pelaje: R6('#180c0a', '#361e12', '#5a321c', '#84502a', '#ac7842', '#d4a670'),
  lobo: R6('#101218', '#262832', '#44464e', '#6c6e74', '#9e9c9c', '#d6d2ca'),
  cuervo: R6('#06050c', '#13101c', '#221e32', '#383650', '#5a5c7a', '#8692ae'),
  hoja: R6('#061206', '#142c0c', '#244c12', '#407618', '#70a42a', '#b2d65e'),
  corteza: R6('#120c08', '#2a1e12', '#463420', '#64502e', '#867044', '#aa9462'),
  hongo: R6('#1e0406', '#4a0a0e', '#801a18', '#b8362a', '#e06a4a', '#fcb08c'),
  sangre: R6('#120204', '#360408', '#68080e', '#a41414', '#d83224', '#ff7c62'),
  carne: R6('#180406', '#3c0a10', '#6c1820', '#9c3434', '#c45a50', '#e8907e'),
  hielo: R6('#081230', '#143868', '#2868a6', '#56a0d6', '#9ad4f2', '#ecfaff'),
  vidrio: R6('#121a22', '#283846', '#465e6e', '#7894a2', '#b2cad2', '#ecf8fa'),
  rubi: R6('#1e0208', '#520612', '#900c1c', '#d0202a', '#ff5a52', '#ffc4b8'),
  zafiro: R6('#040824', '#0a1a5c', '#16349c', '#2a5ad8', '#6a9cff', '#d0e4ff'),
  esmeralda: R6('#021408', '#063a14', '#0c6a24', '#18a03c', '#52d66c', '#c8ffcc'),
  amatista: R6('#120424', '#2e0c56', '#521a90', '#7e36c8', '#b07cf0', '#ecd4ff'),
  sombra: R6('#07040c', '#160a22', '#28123e', '#401e62', '#62348e', '#9260c2'),
  tierra: R6('#120a06', '#281a10', '#42301e', '#604830', '#84684a', '#a88e6c'),
  lava: R6('#100606', '#2a0e0a', '#4a1a10', '#6a2a18', '#8c4028', '#b0603c'),
  ceniza: R6('#0e0c0e', '#1e1a1c', '#322c2c', '#4a4240', '#686058', '#8e8476'),
  pergamino: R6('#2a1e12', '#544028', '#86683e', '#b49660', '#d8c08a', '#f6e8bc'),
  cera: R6('#2a0a06', '#5a160c', '#901e10', '#c43418', '#e86230', '#ffa070'),
  vela: R6('#2c2418', '#5c4e38', '#8e7e5e', '#beae88', '#e2d6b0', '#fffae6'),
  musgo: R6('#0a0e06', '#1a240e', '#2c3c16', '#44581e', '#62782c', '#8a9c44'),
  agua: R6('#04101c', '#0a2440', '#16426a', '#286a94', '#4c9cbc', '#9ad4e4'),
  nube: R6('#0c0e16', '#1e2234', '#363c54', '#5a6280', '#8c96ae', '#c8d0dc'),
  silueta: R6('#0a0808', '#191416', '#2a2326', '#3e3436', '#584c4a', '#7a6c66'),
  humo: R6('#0a0a0a', '#1c1a1c', '#302c2e', '#4a4446', '#6a6264', '#928a88'),
  // emisivas: del canto (0) al núcleo (5)
  e_fuego: R6('#3a0804', '#8e1c06', '#d4420a', '#f6821a', '#ffc444', '#fff6c0'),
  e_negro: R6('#050207', '#14060f', '#2a0a16', '#5a1220', '#b83418', '#ff9a3a'),
  e_frio: R6('#061a3a', '#0e3c7c', '#2a74c2', '#5ab2f0', '#aae4ff', '#f6fdff'),
  e_rayo: R6('#140c3c', '#2e2690', '#5a58dc', '#9aa2ff', '#d8e0ff', '#ffffff'),
  e_veneno: R6('#0a2006', '#1a4a0a', '#3a8a12', '#6ac41c', '#b0f04c', '#eeffb8'),
  e_sombra: R6('#0e0418', '#2c0a46', '#561e88', '#8c40cc', '#c680f4', '#f2d6ff'),
  e_luz: R6('#3a2404', '#7c5408', '#c29218', '#eec83c', '#fff08e', '#fffef2'),
  e_sangre: R6('#220204', '#56040a', '#940e12', '#d4241a', '#ff5c40', '#ffbca4'),
  e_alma: R6('#04201c', '#0a4a40', '#168670', '#3cc6a2', '#8cf2d2', '#ecfff8'),
  e_viento: R6('#0c1c28', '#1e3c4e', '#3a687c', '#6c9cae', '#aed2dc', '#f2fafc'),
  e_fisico: R6('#2a140a', '#5a2c12', '#9a5a26', '#d49a5a', '#f4d4a2', '#fffaf0'),
  e_oro: R6('#3a1c04', '#7a4208', '#c07c10', '#f0b82a', '#ffe478', '#fffbe4'),
  e_arcano: R6('#160628', '#3a0e6a', '#6a26b8', '#a05cf0', '#d8a8ff', '#fbf0ff'),
};
/** El negro del contorno (cálido, como el del HUD). */
const BORDE: RGB = hx('#0a0706');

export type Elem = 'fuego' | 'frio' | 'rayo' | 'veneno' | 'sombra' | 'luz' | 'sangre' | 'fisico';
/** Fondo de cada elemento: hondo, medio y luz. Lo físico toma el tono de la clase. */
const FONDO: Record<string, [string, string, string]> = {
  fuego: ['#2c0a06', '#b4400e', '#ffc458'], frio: ['#06183a', '#2a76be', '#c8f0ff'], rayo: ['#120e3c', '#5650d0', '#e4e4ff'],
  veneno: ['#0a2208', '#388a18', '#c8f082'], sombra: ['#16062a', '#6a2cb0', '#d8a8ff'], luz: ['#2c1c06', '#b4881e', '#fff0b0'],
  sangre: ['#2a0406', '#a01418', '#ff9080'],
};
const FISICO_CLASE: Record<string, [string, string, string]> = {
  berserker: ['#24100a', '#8a3a1e', '#f0b080'], templario: ['#1a1810', '#7a6a40', '#f0e0b0'], arcanista: ['#141430', '#4a4a90', '#d0d0ff'],
  cazadora: ['#121a0c', '#4e6a2a', '#d8e8a0'], nigromante: ['#16121a', '#5a4e5e', '#e0d4d8'], monje: ['#22160a', '#8a6024', '#f8dca0'],
  druida: ['#0e1a0e', '#3e6a34', '#c8e8a8'], alquimista: ['#0c1a18', '#2e6a5e', '#b8f0e0'],
};
/** El emisivo propio de cada elemento (rayos, filos de corte, chispas, el filo de luz del canto). */
export const EMI: Record<string, string> = { fuego: 'e_fuego', frio: 'e_frio', rayo: 'e_rayo', veneno: 'e_veneno', sombra: 'e_sombra', luz: 'e_luz', sangre: 'e_sangre', fisico: 'e_fisico' };

// ---------------------------------------------------------------- formas (distancia con signo en unidades locales)
export interface Sdf { f: (x: number, y: number) => number; bb: [number, number, number, number] }
const len = (x: number, y: number) => Math.sqrt(x * x + y * y);
export const circ = (cx: number, cy: number, r: number): Sdf => ({ f: (x, y) => len(x - cx, y - cy) - r, bb: [cx - r, cy - r, cx + r, cy + r] });
export const elip = (cx: number, cy: number, rx: number, ry: number): Sdf => {
  const m = Math.min(rx, ry);
  return { f: (x, y) => { const qx = (x - cx) / rx, qy = (y - cy) / ry, l = len(qx, qy); return (l - 1) * m * (l < 1 ? 1 : Math.min(1.6, Math.max(rx, ry) / m)); }, bb: [cx - rx, cy - ry, cx + rx, cy + ry] };
};
/** Caja centrada en (cx, cy) de w × h con esquinas redondeadas r. */
export const caja = (cx: number, cy: number, w: number, h: number, r = 0): Sdf => ({
  f: (x, y) => { const qx = Math.abs(x - cx) - w / 2 + r, qy = Math.abs(y - cy) - h / 2 + r; return len(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - r; },
  bb: [cx - w / 2, cy - h / 2, cx + w / 2, cy + h / 2],
});
/** Polígono (x0, y0, x1, y1, ...), exacto. */
export const poli = (...p: number[]): Sdf => {
  const n = p.length / 2; let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 0; i < n; i++) { x0 = Math.min(x0, p[i * 2]); x1 = Math.max(x1, p[i * 2]); y0 = Math.min(y0, p[i * 2 + 1]); y1 = Math.max(y1, p[i * 2 + 1]); }
  return { f: (x, y) => {
    let d = (x - p[0]) ** 2 + (y - p[1]) ** 2, s = 1;
    for (let i = 0, j = n - 1; i < n; j = i, i++) {
      const vix = p[i * 2], viy = p[i * 2 + 1], vjx = p[j * 2], vjy = p[j * 2 + 1], ex = vjx - vix, ey = vjy - viy, wx = x - vix, wy = y - viy;
      const t = Math.max(0, Math.min(1, (wx * ex + wy * ey) / (ex * ex + ey * ey || 1))), bx = wx - ex * t, by = wy - ey * t;
      d = Math.min(d, bx * bx + by * by);
      const c1 = y >= viy, c2 = y < vjy, c3 = ex * wy > ey * wx;
      if ((c1 && c2 && c3) || (!c1 && !c2 && !c3)) s = -s;
    }
    return s * Math.sqrt(d);
  }, bb: [x0, y0, x1, y1] };
};
/** Trazo por los puntos (x0, y0, x1, y1, ...) que va de grosor r0 a r1 (radios). */
export const trazo = (pts: number[], r0: number, r1 = r0): Sdf => {
  const n = pts.length / 2, acc: number[] = [0]; let tot = 0, x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (let i = 1; i < n; i++) { tot += len(pts[i * 2] - pts[i * 2 - 2], pts[i * 2 + 1] - pts[i * 2 - 1]); acc.push(tot); }
  for (let i = 0; i < n; i++) { x0 = Math.min(x0, pts[i * 2]); x1 = Math.max(x1, pts[i * 2]); y0 = Math.min(y0, pts[i * 2 + 1]); y1 = Math.max(y1, pts[i * 2 + 1]); }
  const rm = Math.max(r0, r1);
  return { f: (x, y) => {
    let d = 1e9;
    for (let i = 0; i < n - 1; i++) {
      const ax = pts[i * 2], ay = pts[i * 2 + 1], ex = pts[i * 2 + 2] - ax, ey = pts[i * 2 + 3] - ay, l2 = ex * ex + ey * ey || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * ex + (y - ay) * ey) / l2)), s = tot ? (acc[i] + (acc[i + 1] - acc[i]) * t) / tot : 0;
      d = Math.min(d, len(x - ax - ex * t, y - ay - ey * t) - (r0 + (r1 - r0) * s));
    }
    return d;
  }, bb: [x0 - rm, y0 - rm, x1 + rm, y1 + rm] };
};
/** Puntos de una curva cuadrática o cúbica (para trazos). */
export const curva = (...c: number[]): number[] => {
  const out: number[] = [], N = 14;
  for (let i = 0; i <= N; i++) {
    const t = i / N, u = 1 - t;
    if (c.length === 6) out.push(u * u * c[0] + 2 * u * t * c[2] + t * t * c[4], u * u * c[1] + 2 * u * t * c[3] + t * t * c[5]);
    else out.push(u * u * u * c[0] + 3 * u * u * t * c[2] + 3 * u * t * t * c[4] + t * t * t * c[6], u * u * u * c[1] + 3 * u * u * t * c[3] + 3 * u * t * t * c[5] + t * t * t * c[7]);
  }
  return out;
};
/** Puntos de un arco de circunferencia (ángulos en radianes, 0 a la derecha, crece en el sentido del reloj). */
export const arcoPts = (cx: number, cy: number, r: number, a0: number, a1: number, n = 16): number[] => {
  const out: number[] = []; for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; out.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } return out;
};
export const estrella = (cx: number, cy: number, n: number, r0: number, r1: number, rot = -Math.PI / 2): Sdf => {
  const p: number[] = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r0 : r1, a = rot + (i * Math.PI) / n; p.push(cx + Math.cos(a) * r, cy + Math.sin(a) * r); } return poli(...p);
};
export const union = (...s: Sdf[]): Sdf => ({ f: (x, y) => { let d = 1e9; for (const q of s) d = Math.min(d, q.f(x, y)); return d; }, bb: [Math.min(...s.map((q) => q.bb[0])), Math.min(...s.map((q) => q.bb[1])), Math.max(...s.map((q) => q.bb[2])), Math.max(...s.map((q) => q.bb[3]))] });
/** Unión suave (k en unidades). */
export const fundir = (k: number, ...s: Sdf[]): Sdf => ({ f: (x, y) => { let d = s[0].f(x, y); for (let i = 1; i < s.length; i++) { const b = s[i].f(x, y), h = Math.max(0, Math.min(1, 0.5 + (0.5 * (b - d)) / k)); d = b + (d - b) * h - k * h * (1 - h); } return d; }, bb: union(...s).bb });
export const resta = (a: Sdf, ...b: Sdf[]): Sdf => ({ f: (x, y) => { let d = a.f(x, y); for (const q of b) d = Math.max(d, -q.f(x, y)); return d; }, bb: a.bb });
export const corte = (a: Sdf, b: Sdf): Sdf => ({ f: (x, y) => Math.max(a.f(x, y), b.f(x, y)), bb: a.bb });
/** Anillo: la forma vaciada a grosor g. */
export const hueco = (a: Sdf, g: number): Sdf => ({ f: (x, y) => Math.abs(a.f(x, y)) - g / 2, bb: [a.bb[0] - g, a.bb[1] - g, a.bb[2] + g, a.bb[3] + g] });

// ---------------------------------------------------------------- el pintor
/** Cómo se pinta una forma. */
export interface Est {
  /** material (clave de MAT) */
  m: string;
  /** emisiva: va del canto al núcleo y enciende el fondo */
  e?: boolean;
  /** ancho del bisel en unidades (redondez); en las emisivas, la profundidad del núcleo */
  b?: number;
  /** corre el tono (más luz o más sombra) */
  luz?: number;
  /** tono fijo (0 a 5), sin luz */
  t?: number;
  /** sin contorno alrededor, sin sombra que cae, sin filo del elemento */
  sinBorde?: boolean; sinSombra?: boolean; sinRim?: boolean;
  /** trama de Bayer en el paso de un tono a otro (solo superficies grandes y curvas) */
  trama?: boolean;
  /** cuánto enciende el fondo (emisivas: 1 por omisión) */
  brillo?: number;
}
interface Meta { m: number; e: boolean; borde: boolean; rim: boolean }
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const LX = -0.5, LY = -0.62, LZ = 0.6, LN = Math.sqrt(LX * LX + LY * LY + LZ * LZ), L = [LX / LN, LY / LN, LZ / LN], PLANO = L[2];
const NOMBRES = Object.keys(MAT), IDX: Record<string, number> = {}; NOMBRES.forEach((k, i) => (IDX[k] = i));

export class Pintor {
  readonly s: number; readonly S: number;
  /** el elemento (rampa emisiva y fondo) */
  el: string; emi: string;
  private mat: Int16Array; private tono: Int8Array; private sid: Int16Array; private glow: Float32Array; private fondoAdd: Float32Array; private sombraBg: Uint8Array;
  private metas: Meta[] = [];
  private tf: [number, number, number, number, number, number] = [1, 0, 0, 1, 0, 0];
  private pila: (typeof this.tf)[] = [];
  private semilla: number;
  constructor(s: number, el: string, semilla = 1) {
    this.s = s; this.S = s / 32; this.el = FONDO[el] || el === 'fisico' ? el : 'fisico'; this.emi = EMI[this.el] ?? 'e_fisico';
    const n = s * s; this.mat = new Int16Array(n).fill(-1); this.tono = new Int8Array(n); this.sid = new Int16Array(n).fill(-1);
    this.glow = new Float32Array(n); this.fondoAdd = new Float32Array(n); this.sombraBg = new Uint8Array(n); this.semilla = semilla >>> 0 || 1;
  }
  /** Azar propio del ícono (siempre el mismo para la misma habilidad). */
  R = () => { this.semilla = (Math.imul(this.semilla, 1664525) + 1013904223) >>> 0; return this.semilla / 4294967296; };

  // ---- transformaciones: lo que se pinta dentro de con() queda movido, girado (radianes) y escalado
  con(x: number, y: number, ang: number, k: number, fn: () => void) {
    this.pila.push(this.tf); const [a, b, c, d, e, f] = this.tf, co = Math.cos(ang) * k, si = Math.sin(ang) * k;
    this.tf = [a * co + c * si, b * co + d * si, -a * si + c * co, -b * si + d * co, a * x + c * y + e, b * x + d * y + f];
    fn(); this.tf = this.pila.pop()!;
  }
  /** Espejo horizontal alrededor de x = cx (en el marco actual). */
  espejo(cx: number, fn: () => void) { this.pila.push(this.tf); const [a, b, c, d, e, f] = this.tf; this.tf = [-a, -b, c, d, a * 2 * cx + e, b * 2 * cx + f]; fn(); this.tf = this.pila.pop()!; }

  /** Pinta una forma con su estilo. */
  dib(sdf: Sdf, est: Est | string) {
    const E: Est = typeof est === 'string' ? { m: est } : est;
    const [a, b, c, d, e, f] = this.tf, det = a * d - b * c, k = Math.sqrt(Math.abs(det)) || 1;
    const ia = d / det, ib = -b / det, ic = -c / det, id = a / det;
    const S = this.S, s = this.s;
    // caja en pantalla
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const [u, v] of [[sdf.bb[0], sdf.bb[1]], [sdf.bb[2], sdf.bb[1]], [sdf.bb[0], sdf.bb[3]], [sdf.bb[2], sdf.bb[3]]]) { const X = a * u + c * v + e, Y = b * u + d * v + f; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); }
    const px0 = Math.max(0, Math.floor(x0 * S) - 2), px1 = Math.min(s - 1, Math.ceil(x1 * S) + 2), py0 = Math.max(0, Math.floor(y0 * S) - 2), py1 = Math.min(s - 1, Math.ceil(y1 * S) + 2);
    if (px0 > px1 || py0 > py1) return;
    // distancia en unidades del mundo
    const D = (X: number, Y: number) => { const u = ia * (X - e) + ic * (Y - f), v = ib * (X - e) + id * (Y - f); return sdf.f(u, v) * k; };
    const mi = IDX[E.m] ?? 0, emis = !!E.e, bis = E.b ?? (emis ? 2.2 : 1.4), engorde = 0.18 / S, h = 0.35 / S;
    const meta: Meta = { m: mi, e: emis, borde: !E.sinBorde, rim: !E.sinRim && !emis }, id0 = this.metas.length; this.metas.push(meta);
    const hechos: number[] = [], alto = y1 - y0 > 7 ? 1 : y1 - y0 > 4 ? 0.5 : 0;
    for (let py = py0; py <= py1; py++) for (let px = px0; px <= px1; px++) {
      const X = (px + 0.5) / S, Y = (py + 0.5) / S, dd = D(X, Y);
      if (dd >= engorde) continue;
      const i = py * s + px; let t: number;
      if (E.t !== undefined) t = E.t;
      else if (emis) { t = 1.6 + Math.max(0, Math.min(1, -dd / bis)) * 4.2 + (E.luz ?? 0); if (E.trama) t += BAYER[(py & 3) * 4 + (px & 3)] - 0.5; }
      else {
        let nx = 0, ny = 0, nz = 1;
        const u = Math.max(0, Math.min(1, 1 + dd / bis));
        if (u > 0) {
          let gx = D(X + h, Y) - D(X - h, Y), gy = D(X, Y + h) - D(X, Y - h); const gl = len(gx, gy) || 1; gx /= gl; gy /= gl;
          nx = gx * u; ny = gy * u; nz = Math.sqrt(Math.max(0, 1 - u * u));
        }
        const lum = nx * L[0] + ny * L[1] + nz * L[2];
        t = 3 + (lum - PLANO) * 4.4 + (E.luz ?? 0) + alto * (0.5 - (Y - y0) / (y1 - y0 || 1));
        if (lum > 0.97) t += 0.6;
        if (E.trama) t += (BAYER[(py & 3) * 4 + (px & 3)] - 0.5) * 0.9;
      }
      this.mat[i] = mi; this.tono[i] = Math.max(emis ? 0 : 1, Math.min(5, Math.floor(t + 0.5))); this.sid[i] = id0;
      if (E.t !== undefined) this.tono[i] = E.t;
      hechos.push(i);
    }
    // sombra que cae abajo a la derecha sobre lo de atrás (y sobre el fondo)
    if (!emis && !E.sinSombra && !E.sinBorde) for (const i of hechos) {
      const q = i + s + 1; if (q >= s * s || (i % s) === s - 1) continue;
      if (this.sid[q] === id0) continue;
      if (this.mat[q] < 0) this.sombraBg[q] = 1;
      else if (!this.metas[this.sid[q]].e && this.tono[q] > 0) { this.tono[q] = Math.max(0, this.tono[q] - 1); }
    }
    if (emis) { const g = E.brillo ?? 1; for (const i of hechos) this.glow[i] += g * (0.4 + this.tono[i] * 0.12); }
  }
  /** Atajos: dib con transformación local. */
  en(x: number, y: number, ang: number, k: number, sdf: Sdf, est: Est | string) { this.con(x, y, ang, k, () => this.dib(sdf, est)); }
  /** Resplandor suelto (unidades), sin forma: solo enciende el fondo. */
  brillo(x: number, y: number, r: number, k = 1) {
    const [a, b, c, d, e, f] = this.tf, X0 = a * x + c * y + e, Y0 = b * x + d * y + f, sc = Math.sqrt(Math.abs(a * d - b * c)), R = r * sc, S = this.S, s = this.s;
    for (let py = Math.max(0, Math.floor((Y0 - R) * S)); py <= Math.min(s - 1, Math.ceil((Y0 + R) * S)); py++)
      for (let px = Math.max(0, Math.floor((X0 - R) * S)); px <= Math.min(s - 1, Math.ceil((X0 + R) * S)); px++) {
        const q = len((px + 0.5) / S - X0, (py + 0.5) / S - Y0) / R; if (q < 1) this.fondoAdd[py * s + px] += k * (1 - q) * 2.2;
      }
  }
  /** Un punto de luz en (x, y): cruz de un punto de brazo (dos a tamaños grandes), del material emisivo m. */
  chispa(x: number, y: number, m = this.emi, larga = false) {
    const [a, b, c, d, e, f] = this.tf, X = a * x + c * y + e, Y = b * x + d * y + f, s = this.s, px = Math.floor(X * this.S), py = Math.floor(Y * this.S), mi = IDX[m];
    const id0 = this.metas.length; this.metas.push({ m: mi, e: true, borde: false, rim: false });
    const pon = (x: number, y: number, t: number) => { if (x < 0 || y < 0 || x >= s || y >= s) return; const i = y * s + x; if (this.mat[i] >= 0 && !this.metas[this.sid[i]].e && t < 4) return; this.mat[i] = mi; this.tono[i] = t; this.sid[i] = id0; this.glow[i] += 0.5; };
    const brazo = larga || s >= 40 ? 2 : 1;
    pon(px, py, 5); for (let k = 1; k <= brazo; k++) { const t = k === 1 ? 3 : 2; pon(px + k, py, t); pon(px - k, py, t); pon(px, py + k, t); pon(px, py - k, t); }
  }
  /** Un punto suelto (unidades), con su material y tono. */
  punto(x: number, y: number, m: string, t: number, emisivo = false) {
    const [a, b, c, d, e, f] = this.tf, X = a * x + c * y + e, Y = b * x + d * y + f, s = this.s, px = Math.floor(X * this.S), py = Math.floor(Y * this.S);
    if (px < 0 || py < 0 || px >= s || py >= s) return; const i = py * s + px;
    const id0 = this.metas.length; this.metas.push({ m: IDX[m], e: emisivo, borde: false, rim: false });
    this.mat[i] = IDX[m]; this.tono[i] = t; this.sid[i] = id0; if (emisivo) this.glow[i] += 0.6;
  }
  /** Suma al fondo una forma (motivos del fondo: un tono o dos más claros). */
  fondo(sdf: Sdf, k: number) {
    const S = this.S, s = this.s;
    for (let py = Math.max(0, Math.floor(sdf.bb[1] * S) - 1); py <= Math.min(s - 1, Math.ceil(sdf.bb[3] * S) + 1); py++)
      for (let px = Math.max(0, Math.floor(sdf.bb[0] * S) - 1); px <= Math.min(s - 1, Math.ceil(sdf.bb[2] * S) + 1); px++)
        if (sdf.f((px + 0.5) / S, (py + 0.5) / S) < 0) this.fondoAdd[py * s + px] += k;
  }

  /**
   * Arma la imagen: fondo (salvo soloGlifo), halo, contorno, filo y colores. Devuelve RGBA de s × s.
   * clase: para el tono del fondo de lo físico.
   */
  final(o: { clase?: string; soloGlifo?: boolean; fondoDe?: string } = {}): Uint8ClampedArray {
    const s = this.s, n = s * s, out = new Uint8ClampedArray(n * 4), S = this.S;
    const fd = this.el === 'fisico' ? FISICO_CLASE[o.clase ?? ''] ?? ['#1c120c', '#7a5236', '#f0dcb0'] : FONDO[o.fondoDe ?? this.el] ?? FONDO.luz;
    const [ho, me, lu] = fd.map(hx), neg = hx('#030203');
    const bg: RGB[] = [mezclar(neg, ho, 0.22), mezclar(neg, ho, 0.48), mezclar(neg, ho, 0.76), ho, mezclar(ho, me, 0.3), mezclar(ho, me, 0.55), mezclar(ho, me, 0.8), me, mezclar(me, lu, 0.45), mezclar(me, lu, 0.8)];
    // halo: el motivo y lo que arde, esparcidos (tres pasadas de caja)
    const masc = new Float32Array(n); for (let i = 0; i < n; i++) masc[i] = this.mat[i] >= 0 ? 1 : 0;
    const desenf = (a: Float32Array, r: number) => { const t = new Float32Array(n); for (let p = 0; p < 3; p++) {
      for (let y = 0; y < s; y++) { let acc = 0; for (let x = -r; x < s + r; x++) { if (x + r < s && x + r >= 0) acc += a[y * s + x + r]; if (x - r - 1 >= 0 && x - r - 1 < s) acc -= a[y * s + x - r - 1]; if (x >= 0 && x < s) t[y * s + x] = acc / (2 * r + 1); } }
      for (let x = 0; x < s; x++) { let acc = 0; for (let y = -r; y < s + r; y++) { if (y + r < s && y + r >= 0) acc += t[(y + r) * s + x]; if (y - r - 1 >= 0 && y - r - 1 < s) acc -= t[(y - r - 1) * s + x]; if (y >= 0 && y < s) a[y * s + x] = acc / (2 * r + 1); } } }
      return a; };
    const halo = desenf(masc, Math.max(1, Math.round(2.2 * S))), arde = desenf(Float32Array.from(this.glow), Math.max(1, Math.round(1.8 * S)));
    const solid = (i: number) => this.mat[i] >= 0;
    for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
      const i = py * s + px, o4 = i * 4;
      let col: RGB;
      if (this.mat[i] >= 0) col = MAT[NOMBRES[this.mat[i]]][this.tono[i]];
      else {
        if (o.soloGlifo) { out[o4 + 3] = 0; continue; }
        const X = (px + 0.5) / S - 15.5, Y = (py + 0.5) / S - 14.5, r = len(X, Y) / 16;
        let t = 3.9 - r * 3.3 + Math.min(2, halo[i] * 2.8) + Math.min(4.2, arde[i] * 3.2) + this.fondoAdd[i] - (this.sombraBg[i] ? 1.4 : 0);
        if (r > 1.02) t -= 0.6;
        t += BAYER[(py & 3) * 4 + (px & 3)] - 0.5;
        col = bg[Math.max(0, Math.min(9, Math.floor(t)))];
      }
      out[o4] = col[0]; out[o4 + 1] = col[1]; out[o4 + 2] = col[2]; out[o4 + 3] = 255;
    }
    // filo del elemento: el canto de abajo a la derecha de lo sólido, donde da la luz que viene de atrás
    const rimM = MAT[this.emi];
    for (let py = 1; py < s - 1; py++) for (let px = 1; px < s - 1; px++) {
      const i = py * s + px; if (!solid(i)) continue; const me2 = this.metas[this.sid[i]]; if (!me2.rim) continue;
      if ((!solid(i + 1) || !solid(i + s)) && solid(i - 1) && solid(i - s)) {
        const c2 = this.tono[i] >= 3 ? rimM[4] : rimM[3]; const o4 = i * 4; out[o4] = c2[0]; out[o4 + 1] = c2[1]; out[o4 + 2] = c2[2];
      }
    }
    // contorno selectivo: del lado de la luz, el tono más hondo del material; del otro, casi negro
    const cont = new Uint8ClampedArray(out);
    for (let py = 0; py < s; py++) for (let px = 0; px < s; px++) {
      const i = py * s + px; if (solid(i)) continue;
      let vec = -1, luzSide = false;
      const prueba = (q: number, lado: boolean) => { if (vec >= 0 && !lado) return; if (solid(q) && this.metas[this.sid[q]].borde) { vec = q; luzSide = lado; } };
      if (px < s - 1) prueba(i + 1, true); if (py < s - 1) prueba(i + s, true); if (px > 0) prueba(i - 1, false); if (py > 0) prueba(i - s, false);
      if (vec < 0) continue;
      const m = this.metas[this.sid[vec]], rm = MAT[NOMBRES[m.m]];
      let col: RGB = luzSide && !m.e ? mezclar(rm[0], BORDE, 0.35) : m.e ? rm[0] : BORDE;
      if (m.e && !luzSide) col = mezclar(rm[0], BORDE, 0.5);
      if (o.soloGlifo) cont[i * 4 + 3] = 255;
      cont[i * 4] = col[0]; cont[i * 4 + 1] = col[1]; cont[i * 4 + 2] = col[2];
    }
    return cont;
  }
}
