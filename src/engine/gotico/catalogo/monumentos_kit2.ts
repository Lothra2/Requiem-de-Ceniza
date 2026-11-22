import type { V3 } from '../objeto';
import { ruido } from '../render';
import { G, bloque } from '../kit_muerte';
import type { Comp } from '../render';

/** Oficio común de los monumentos: troncos de pirámide, cornisas, toros y la figura sentada de los colosos. */
const TAU = Math.PI * 2;

/** Tronco de pirámide (muro en talud): base w0 x d0 a z0, cima w1 x d1 a z1, centrado en (x, y). `dy1` corre la cima en y. */
export function tronco(g: G, x: number, y: number, z0: number, z1: number, w0: number, d0: number, w1: number, d1: number, o: { mat: string; tono?: number; resta?: boolean }, dy1 = 0, dx1 = 0) {
  return g.poli([
    [x - w0 / 2, y - d0 / 2, z0], [x + w0 / 2, y - d0 / 2, z0], [x - w0 / 2, y + d0 / 2, z0], [x + w0 / 2, y + d0 / 2, z0],
    [x + dx1 - w1 / 2, y + dy1 - d1 / 2, z1], [x + dx1 + w1 / 2, y + dy1 - d1 / 2, z1], [x + dx1 - w1 / 2, y + dy1 + d1 / 2, z1], [x + dx1 + w1 / 2, y + dy1 + d1 / 2, z1],
  ], o);
}
/** Gola egipcia sobre una caja w x d con la cima en z: el toro abajo y el cavetto que se abre `sale` hacia afuera en dos tramos. */
export function gola(g: G, x: number, y: number, z: number, w: number, d: number, h: number, sale: number, mat: string, toroMat = mat) {
  // el toro: cuatro cilindros en las aristas
  const r = Math.max(1.6, h * 0.14);
  for (const [p, q] of [[[x - w / 2, y + d / 2, z], [x + w / 2, y + d / 2, z]], [[x - w / 2, y - d / 2, z], [x + w / 2, y - d / 2, z]], [[x - w / 2, y - d / 2, z], [x - w / 2, y + d / 2, z]], [[x + w / 2, y - d / 2, z], [x + w / 2, y + d / 2, z]]] as [V3, V3][]) g.palo(p, q, r, { mat: toroMat, tono: 0.06 });
  const t1 = h * 0.45, s1 = sale * 0.25;
  tronco(g, x, y, z, z + t1, w, d, w + s1 * 2, d + s1 * 2, { mat, tono: -0.04 });
  tronco(g, x, y, z + t1, z + h * 0.88, w + s1 * 2, d + s1 * 2, w + sale * 2, d + sale * 2, { mat, tono: 0.02 });
  g.caja(x, y, z + h * 0.88, w + sale * 2, d + sale * 2, h * 0.12, { mat, tono: 0.08 });
}
/** Aro (toro) de radio R y grueso r en el plano x-z del grupo, de t0 a t1 (radianes desde +x hacia +z). */
export function aro(g: G, cx: number, cz: number, R: number, r: number, mat: string, t0 = 0, t1 = TAU, n = 32, y = 0, tono = 0) {
  const pasos = Math.max(3, Math.round((n * (t1 - t0)) / TAU));
  for (let i = 0; i < pasos; i++) { const a0 = t0 + ((t1 - t0) * i) / pasos, a1 = t0 + ((t1 - t0) * (i + 1)) / pasos; g.palo([cx + Math.cos(a0) * R, y, cz + Math.sin(a0) * R], [cx + Math.cos(a1) * R, y, cz + Math.sin(a1) * R], r, { mat, tono }); }
}

/**
 * Figura sentada en su trono, mirando a +y (unidades de una persona de 75 de pie: se agranda con `g.esc`). El rostro se
 * puede raspar (`sinCara`: la cara cortada a plomo, lo que hicieron los que vinieron después). Devuelve la cima de la cabeza.
 */
export function sentado(g: G, o: { mat: string; trono: string; tocado?: string; barba?: boolean; sinCara?: boolean; brazos?: 'rodillas' | 'pecho' }) {
  const m = o.mat, cs: Comp[] = [];
  // el trono: el asiento y el respaldo bajo, con el canto marcado
  bloque(g, 0, -9, 0, 30, 26, 21, { mat: o.trono, b: 1.2, j: 0.5 });
  bloque(g, 0, -20, 21, 30, 4.5, 26, { mat: o.trono, b: 1, j: 0.5, tono: -0.04 });
  g.caja(0, 4.2, 2, 26, 0.8, 16, { mat: o.trono, tono: -0.12 });
  // el cuerpo de una sola masa: pelvis, torso, hombros, muslos, piernas
  cs.push(g.bu([0, -9, 24.5], [10.5, 8.5, 5.2]));
  cs.push(g.hu([0, -9, 26], [0, -10, 46], 9.2, 10.6));
  cs.push(g.bu([0, -7.6, 41.5], [11.8, 7.4, 8.4]));
  cs.push(g.hu([-12, -9.5, 48], [12, -9.5, 48], 4.4));
  for (const s of [-1, 1]) {
    cs.push(g.hu([s * 5.6, -6, 22.5], [s * 6, 14, 23.5], 6, 5));
    cs.push(g.bu([s * 6, 15.5, 23], [5, 5, 4.6]));
    cs.push(g.hu([s * 6, 17, 21], [s * 6.2, 18.5, 3.6], 4.4, 3.8));
    cs.push(g.bu([s * 6.2, 22, 1.6], [3.6, 7.2, 2.2]));
    if (o.brazos === 'pecho') {
      cs.push(g.hu([s * 13, -9, 46.5], [s * 11, -3, 33], 3.9, 3.3));
      cs.push(g.hu([s * 11, -3, 33], [-s * 3, 1, 41], 3.2, 2.8));
    } else {
      cs.push(g.hu([s * 13, -9.5, 46.5], [s * 12.5, 0, 31], 4, 3.4));
      cs.push(g.hu([s * 12.5, 0, 30.5], [s * 9, 15, 26], 3.3, 2.9));
      cs.push(g.bu([s * 8.6, 18, 26], [3.3, 4.8, 1.8]));
    }
  }
  cs.push(g.hu([0, -9, 49], [0, -8, 55], 4.2, 3.8));
  g.masa(cs, { mat: m, suave: 2.2 });
  // la cabeza con su tocado: el paño de rayas que cae a los hombros y la barba trenzada
  g.esf(0, -7.4, 60.5, 6.6, { mat: m });
  const t = o.tocado ?? m;
  g.elip(0, -8.4, 62.2, 8.4, 8, 7, { mat: t, tono: 0.02 });
  for (const s of [-1, 1]) g.poli([[s * 6, -4.5, 60], [s * 9, -5, 60], [s * 6.5, -3, 46], [s * 10.5, -4, 46], [s * 6, -6.5, 60], [s * 9, -7, 60], [s * 6.5, -5, 46], [s * 10.5, -6, 46]], { mat: t });
  for (let k = 0; k < 4; k++) g.caja(0, -8.4, 56.4 + k * 2.8, 17.4, 16.8, 0.5, { mat: t, tono: -0.16 });
  g.cil(0, -9, 68.2, 2.2, 3, { mat: t, tono: 0.05, r1: 1.4 });
  if (o.barba) g.palo([0, -1.8, 55.5], [0, -0.6, 48.5], 1.5, { mat: m, r1: 1.1, tono: -0.04 });
  if (o.sinCara) {
    // la cara rapada a plomo, con las marcas del cincel y el pecho picado
    g.caja(0, 1.5, 51, 14, 6, 15, { mat: m, resta: true });
    for (let i = 0; i < 5; i++) g.caja(-4 + i * 2, -1.3, 52 + (i % 2) * 4, 1.2, 1, 5, { mat: m, resta: true, giro: 20 });
  } else {
    for (const s of [-1, 1]) g.caja(s * 2.4, -1.3, 61, 2.2, 1, 0.9, { mat: 'negro' });
    g.caja(0, -0.6, 58, 1.6, 1.4, 3.4, { mat: m });
  }
  return 70;
}
/** Bloques de derrumbe regados en un rombo. */
export function derrumbe(g: G, n: number, x: number, y: number, rx: number, ry: number, tam: number, mat: string) {
  const a = g.a;
  for (let i = 0; i < n; i++) { const s = tam * (0.5 + a.r() * 0.8); bloque(g, x + (a.r() - 0.5) * 2 * rx, y + (a.r() - 0.5) * 2 * ry, -s * 0.2, s * (1 + a.r() * 0.8), s * (0.8 + a.r() * 0.5), s * (0.6 + a.r() * 0.5), { mat, giro: a.r() * 180, incl: (a.r() - 0.5) * 40, b: s * 0.15, j: s * 0.3, tono: (a.r() - 0.5) * 0.12 }); }
}

/**
 * Sillería de monumento (el patrón de material): hiladas de alto desparejo, bloques de largo y tono distinto, juntas hondas y
 * oscuras, cantos comidos, bloques picados, manchas grandes (humedad, hollín) y el pie oscurecido. La coordenada a lo largo
 * de la cara va por su tangente, así sirve en las caras de la diagonal. `o.musgo` aclara/oscurece lo de arriba de cada bloque
 * (el verde lo pone el material), `o.pie` el alto del pie oscuro.
 */
export function sillares(la: number, al: number, o: { var?: number; manchas?: number; pie?: number; junta?: number } = {}) {
  const V = o.var ?? 0.3, MN = o.manchas ?? 1, PIE = o.pie ?? 46, J = o.junta ?? 1.6;
  return (p: V3, n: V3) => {
    const mancha = ruido(p[0] * 0.011 + 7, p[1] * 0.011, p[2] * 0.014), ero = (ruido(p[0] * 0.025 + p[1] * 0.025, 2, p[2] * 0.09) - 0.5) * 0.3 - Math.max(0, 1 - p[2] / PIE) * 0.2 - (mancha > 0.6 ? (mancha - 0.6) * 1.1 * MN : 0);
    if (Math.abs(n[2]) > 0.7) return (ruido(p[0] * 0.06, p[1] * 0.06, 1) - 0.5) * 0.24 + 0.04;
    const hn = Math.hypot(n[0], n[1]) || 1, uu = (-p[0] * n[1] + p[1] * n[0]) / hn;
    const fila = Math.floor(p[2] / al), alto = al * (0.7 + ruido(fila * 1.7, 1, 2) * 0.6), t = (p[2] - fila * al) / alto;
    const u = uu + fila * la * 0.43, L = la * (0.55 + ruido(fila * 1.3, 3, 1) * 0.9), b = Math.floor(u / L), r = (u - b * L) / L;
    const borde = Math.min(t * alto, (1 - t) * al, r * L, (1 - r) * L);
    if (borde < J) return -0.55 + ero * 0.3;
    const canto = borde < J + 2.6 ? -0.16 * (1 - (borde - J) / 2.6) : 0;
    const tb = ruido(b * 2.1, fila * 1.7, 9), pic = tb > 0.86 ? (ruido(p[0] * 0.9, p[1] * 0.9, p[2] * 0.9) - 0.5) * 0.5 : 0;
    return (tb - 0.5) * V + ero + canto + pic + (ruido(p[0] * 0.7, p[1] * 0.7, p[2] * 0.7) > 0.8 ? -0.14 : 0);
  };
}
