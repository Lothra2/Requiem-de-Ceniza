import type { Arma, Pieza, V3 } from '../objeto';
import type { Escena, Comp } from '../render';
import { G, bloque, cadena, cuervo, vela, calavera, letras, grieta, esqueleto, figuraVelada, arbolMuerto, llama, punta } from '../kit_muerte';
import { cadaver, muneco, ropaDe, tendido, mata, pena, pano } from '../exteriores';
import { campana, duna, ramaM, mezV } from './hitos_mayores';
import './selva2';
import './nieve2';
import './infierno2';
import './ahogada';
import './celestial';

/**
 * Los hitos mayores de los mundos abiertos de los actos 3 a 7 (variantes de `acto_hito`, que los agranda 2,4 veces), con el
 * mismo oficio que los de los actos 1 y 2 (`hitos_mayores.ts`): lo alto atrás (-x -y), el relato adelante (+x +y), una
 * persona mide unas 31 unidades, nada de mantos de suelo con canto (el piso del juego llega hasta la obra).
 *
 *   a3_tambor     Selva de Yhuantl: el gran tambor de la llamada sobre su terraza, al pie de la ceiba.
 *   a3_barco      Manglar Negro: el barco de Ama, varado y tragado por el manglar, con Ama tallada en la proa.
 *   a4_puerta     Picos de Hrimgard: la puerta de los jarls (dos piedras con la sierpe y el dintel) y el muro de escudos.
 *   a4_gigante    Paso del Glaciar: el gigante que el hielo agarró a medio levantarse, y la obra de los que quisieron sacarlo.
 *   a5_yunque     Llanuras de Ceniza: el yunque de Sahrim con la hoja que no se enfría, el martillo caído y las cadenas.
 *   a5_crisol     Río de Lava: el crisol volcado de la fragua, el chorro que corre por la canaleta hasta el molde.
 *   a6_campana    Costa de los Naufragios: la campana de la marea entre dos mástiles, con su soga que se va al mar.
 *   a6_abadesa    Arrecife de Huesos: la Abadesa de la Sal y los peregrinos que se volvieron sal de rodillas.
 *   a6_campanario Barrio Sumergido, las calles: el campanario ladeado con el agua hasta la puerta.
 *   a6_coro       Barrio Sumergido, la plaza: el coro de campanas enterradas, una por cada ánima, alrededor del poste vacío.
 *   a7_escalera   Cielo Roto: la escalera de los siete que se corta en el aire, con los marcados que no llegaron.
 *   a7_caliz      Jardín de los que Intentaron: el cáliz seco de Aun-Saar con los que se arrodillaron a pedir.
 */

const TAU = Math.PI * 2;
const r2 = (a: Arma, k = 1) => (a.r() - 0.5) * 2 * k;
export type Hito = Pieza[] | Escena;

// ------------------------------------------------------------------ piezas de oficio
/** Fuego en cuenco sobre un pie (brasero de tres patas): devuelve el centro de la llama. */
function brasero(g: G, x: number, y: number, h: number, mat: string): V3 {
  const a = g.a;
  for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU + 0.4; g.palo([x + Math.cos(t) * 3.4, y + Math.sin(t) * 3.4, 0], [x + Math.cos(t) * 1.2, y + Math.sin(t) * 1.2, h - 2], 0.5, { mat }); }
  g.cil(x, y, h - 2.4, 1.6, 2.2, { mat, r1: 3.4 }); g.cil(x, y, h - 0.4, 3.4, 0.6, { mat, tono: 0.06 });
  g.elip(x, y, h - 0.2, 2.8, 2.8, 0.8, { mat: 'ext_carbon' });
  for (let k = 0; k < 3; k++) llama(g, x + r2(a, 1), y + r2(a, 1), h, 1.6, 5 + a.r() * 2, 0, 8, k);
  return [x, y, h + 3];
}
/** Farol colgado: jaula de hierro con el vidrio encendido. */
function farol(g: G, x: number, y: number, z: number, k = 1) {
  const s = g.sub(x, y, z).esc(k);
  s.cil(0, 0, 5.4, 2.4, 1, { mat: 'mu_hierro', r1: 0.6 }); s.cil(0, 0, 0, 2.2, 0.8, { mat: 'mu_hierro' });
  s.cil(0, 0, 0.7, 1.8, 4.4, { mat: 'luz_vela', tono: -0.05 }); s.elip(0, 0, 2.6, 1, 1, 1.6, { mat: 'fuego', tono: 0.15 });
  for (let i = 0; i < 4; i++) { const t = (i / 4) * TAU + 0.4; s.palo([Math.cos(t) * 2.1, Math.sin(t) * 2.1, 0.3], [Math.cos(t) * 2.2, Math.sin(t) * 2.2, 5.6], 0.3, { mat: 'mu_hierro' }); }
}
/** Hilada de bloques a lo largo de un rectángulo (el canto de una terraza): w x d, alto h, desde z. */
function hilada(g: G, cx: number, cy: number, z: number, w: number, d: number, h: number, mat: string, largo = 7, falta = 0.04) {
  const a = g.a;
  for (const [ox, oy, lx, ly] of [[0, -d / 2 + 2.5, w, 5], [0, d / 2 - 2.5, w, 5], [-w / 2 + 2.5, 0, 5, d - 10], [w / 2 - 2.5, 0, 5, d - 10]] as number[][]) {
    const L = Math.max(lx, ly), n = Math.max(1, Math.round(L / largo));
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n - 0.5; if (a.r() < falta) continue; bloque(g, cx + ox + (lx > ly ? u * lx : 0), cy + oy + (ly > lx ? u * ly : 0), z, lx > ly ? L / n - 0.3 : 5, ly > lx ? L / n - 0.3 : 5, h, { mat, b: 0.8, j: 0.45, tono: r2(a, 0.05) }); }
  }
  g.caja(cx, cy, z, w - 9, d - 9, h - 0.2, { mat, tono: -0.06 });
}
/** Matas o helechos al pie (falda). */
function faldaMatas(g: G, ps: Pieza[], n: number, R0: number, R1: number, mat: string, cx = 0, cy = 0) {
  const a = g.a; for (let i = 0; i < n; i++) { const t = a.r() * TAU, d = R0 + a.r() * (R1 - R0); mata(a, ps, cx + Math.cos(t) * d, cy + Math.sin(t) * d, 4 + Math.floor(a.r() * 4), 3 + a.r() * 4, mat); }
}

// ================================================================== acto 3
/** El tambor de la llamada de Yhuantl: la terraza de tres gradas comida por la ceiba, el tambor de tronco hueco con su
 * cuero atado en zigzag y la mancha de las manos que lo tocaron, los dos tambores chicos, las mazas de hueso, las ofrendas
 * en la escalinata y los braseros que lo alumbran de noche. Lo de la selva suena a tambores. */
export function tamborYhuantl(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), P = 'sel2_piedra', C: V3 = [-6, -6, 0];
  // la ceiba de atrás: contrafuertes de raíz que agarran la terraza, el fuste y la copa
  { const cs: Comp[] = [], b: V3 = [-26, -26, 0];
    cs.push(g.hu([b[0], b[1], -2], [b[0] + 1, b[1] - 1, 44], 10, 7), g.hu([b[0] + 1, b[1] - 1, 44], [b[0] + 3, b[1] - 2, 70], 7, 4.5));
    for (let i = 0; i < 7; i++) { const t = (i / 7) * TAU + a.r() * 0.4, L = 18 + a.r() * 14; cs.push(g.hu([b[0] + Math.cos(t) * 6, b[1] + Math.sin(t) * 6, 16], [b[0] + Math.cos(t) * L, b[1] + Math.sin(t) * L, -1], 5.5, 1.6)); }
    // dos raíces largas que se meten entre los bloques de la terraza
    for (const [x, y] of [[-8, -20], [-20, -6]]) cs.push(g.hu([b[0] + 4, b[1] + 4, 8], [x, y, 9], 3.4, 1.4), g.hu([x, y, 9], [x + 6, y + 6, 3], 1.4, 0.8));
    const br: V3[][] = [ramaM(g, cs, [b[0] + 2, b[1] - 1, 62], [0.7, 0.2, 0.6], 26, 4.2, 1.4, 4, 0.35), ramaM(g, cs, [b[0] + 2, b[1] - 1, 64], [-0.3, 0.8, 0.55], 24, 4, 1.2, 4, 0.35), ramaM(g, cs, [b[0] + 2, b[1] - 1, 66], [-0.6, -0.6, 0.6], 22, 3.6, 1.2, 3, 0.4)];
    g.masa(cs, { mat: 'corteza', suave: 2.6, tono: 0.05 });
    // la copa: masas de follaje sobre cada brazo, y lianas que cuelgan hasta la terraza
    for (const r of br) { const p = r[r.length - 1]; const f: Comp[] = []; for (let k = 0; k < 5; k++) f.push(g.bu([p[0] + r2(a, 7), p[1] + r2(a, 7), p[2] + r2(a, 3)], [8 + a.r() * 4, 7 + a.r() * 3, 4 + a.r() * 2])); g.masa(f, { mat: 'sel2_follaje', suave: 2.5 }); }
    for (let i = 0; i < 6; i++) { const r = br[i % 3], p = r[1 + (i % (r.length - 1))]; let q: V3 = p; for (let k = 0; k < 4; k++) { const n: V3 = [q[0] + r2(a, 1.5), q[1] + r2(a, 1.5) + 1, q[2] - 7 - a.r() * 4]; g.palo(q, n, 0.5, { mat: 'sel2_hoja' }); q = n; if (q[2] < 18) break; } }
  }
  // la terraza: tres gradas de bloques, con musgo en los cantos y alguno caído
  let z = 0; for (const [w, h] of [[46, 5], [36, 5], [26, 4.5]] as [number, number][]) { hilada(g, C[0], C[1], z, w, w, h, P, 7, 0.06); z += h; }
  for (let i = 0; i < 14; i++) { const t = a.r() * TAU, d = 12 + a.r() * 10; g.elip(C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, 5 + Math.floor(a.r() * 2) * 5, 2.4 + a.r() * 2, 1.8 + a.r() * 1.4, 0.8, { mat: 'musgo', giro: a.r() * 180 }); }
  for (let i = 0; i < 3; i++) bloque(g, C[0] + 24 + r2(a, 4), C[1] + r2(a, 16), 0, 6, 5, 4, { mat: P, giro: a.r() * 60, incl: r2(a, 25), j: 0.6 });
  // la escalinata al frente (+x +y), con ofrendas en cada peldaño: cuencos con sangre, cráneos y plumas
  { const s = g.sub(C[0] + 16, C[1] + 16, 0, 45); for (let i = 0; i < 4; i++) bloque(s, 6 - i * 3.5, 0, 0, 4, 14, 3.6 * (i + 1), { mat: P, j: 0.4, tono: 0.03 * i });
    for (const [x, y, k] of [[5, -4.5, 0], [1.6, 4.5, 1], [-1.6, -4, 2]] as number[][]) { const zz = 3.6 * (Math.round((6 - x) / 3.5) + 1); if (k === 1) calavera(s.sub(x, y, zz + 1, 180).esc(0.55), 3.3, 'mu_hueso', true, -0.1); else { s.cil(x, y, zz, 2.2, 1.6, { mat: 'sel2_ocre', r1: 2.8 }); s.elip(x, y, zz + 1.5, 2.2, 2.2, 0.35, { mat: 'sangre' }); } }
    for (let k = 0; k < 4; k++) s.palo([3, 2 + k * 0.7, 7.4], [6 + a.r() * 2, 3 + k, 7.7], 0.35, { mat: k % 2 ? 'tela_roja' : 'ext_pluma', r1: 0.12 }); }
  // el tambor grande: tronco hueco, bandas talladas, cuero tirante y el zigzag de cuerdas a las estacas del pie
  const T: V3 = [C[0], C[1], z];
  g.cil(T[0], T[1], T[2], 9.4, 2.6, { mat: 'corteza', r1: 8.6, tono: -0.05 });
  g.cil(T[0], T[1], T[2] + 2.4, 8.6, 15, { mat: 'corteza', r1: 9.6 });
  for (const zz of [5.5, 11]) { g.cil(T[0], T[1], T[2] + zz, 9.4 + zz * 0.04, 1.6, { mat: 'sel2_ocre', tono: -0.1 }); for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; g.caja(T[0] + Math.cos(t) * (9.6 + zz * 0.04), T[1] + Math.sin(t) * (9.6 + zz * 0.04), T[2] + zz + 0.2, 1.4, 1.2, 1.2, { mat: 'negro', giro: (t * 180) / Math.PI + 45 }); } }
  g.cil(T[0], T[1], T[2] + 17.3, 10.2, 1, { mat: 'cuero', tono: -0.05 }); g.elip(T[0], T[1], T[2] + 18.1, 9.6, 9.6, 0.7, { mat: 'cuero', tono: 0.08 });
  for (let i = 0; i < 4; i++) { const t = a.r() * TAU, d = a.r() * 5; g.elip(T[0] + Math.cos(t) * d, T[1] + Math.sin(t) * d, T[2] + 18.5, 1.7, 1.1, 0.2, { mat: 'sangre', giro: a.r() * 180, tono: -0.1 }); }
  for (let i = 0; i < 16; i++) { const t0 = (i / 16) * TAU, t1 = ((i + 0.5) / 16) * TAU; g.palo([T[0] + Math.cos(t0) * 10, T[1] + Math.sin(t0) * 10, T[2] + 17.6], [T[0] + Math.cos(t1) * 9.8, T[1] + Math.sin(t1) * 9.8, T[2] + 2], 0.32, { mat: 'cuerda', tono: -0.2 }); }
  for (let i = 0; i < 8; i++) { const t = ((i + 0.25) / 8) * TAU; g.palo([T[0] + Math.cos(t) * 9.9, T[1] + Math.sin(t) * 9.9, T[2] + 1], [T[0] + Math.cos(t) * 11.4, T[1] + Math.sin(t) * 11.4, T[2] + 4], 0.6, { mat: 'mu_hueso', tono: -0.2 }); }
  // las mazas: dos fémures con su nudo de cuero, cruzados sobre el cuero
  for (const s of [-1, 1]) { const p: V3 = [T[0] - 6, T[1] + s * 4, T[2] + 19], q: V3 = [T[0] + 7, T[1] - s * 3, T[2] + 21]; g.palo(p, q, 0.8, { mat: 'mu_hueso', tono: -0.15 }); g.esf(q[0], q[1], q[2], 1.8, { mat: 'cuero' }); }
  // los dos tambores chicos en las esquinas de adelante
  for (const [x, y] of [[C[0] + 9, C[1] - 7], [C[0] - 7, C[1] + 9]]) { g.cil(x, y, z, 4, 8, { mat: 'corteza', r1: 4.6 }); g.cil(x, y, z + 8, 4.8, 0.7, { mat: 'cuero' }); for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; g.palo([x + Math.cos(t) * 4.7, y + Math.sin(t) * 4.7, z + 8], [x + Math.cos(t + 0.4) * 4.2, y + Math.sin(t + 0.4) * 4.2, z + 1], 0.25, { mat: 'cuerda' }); } }
  // (entrega 4: casi no se leía en el juego) el arco de la llamada detrás del tambor: dos postes tallados y pintados con su
  // travesaño, del que cuelgan cráneos y tamborcitos; las bandas del tambor con su pintura que brilla verde, y fuego alto
  for (const q of [-1, 1]) { const x = C[0] - 10 + q * 11, y = C[1] - 10 - q * 11; g.cil(x, y, z, 1.9, 46, { mat: 'madera_vieja', r1: 1.5 }); for (let k = 0; k < 6; k++) g.cil(x, y, z + 6 + k * 6.4, 2.1, 2.2, { mat: k % 2 ? 'sel2_ocre' : 'tela_roja', tono: -0.05 }); calavera(g.sub(x, y, z + 46, 45).esc(0.75), 3.3, 'mu_hueso', true, -0.1); for (let k = 0; k < 4; k++) g.palo([x, y, z + 44], [x + q * 1.5 + r2(a, 1), y - q * 1.5 + r2(a, 1), z + 52 + a.r() * 3], 0.4, { mat: k % 2 ? 'ext_pluma' : 'tela_roja', r1: 0.15 }); }
  { const p0: V3 = [C[0] - 21, C[1] + 1, z + 40], p1: V3 = [C[0] + 1, C[1] - 21, z + 40]; g.palo(p0, p1, 1.4, { mat: 'madera_vieja' });
    for (let k = 1; k < 7; k++) { const p = mezV(p0, p1, k / 7); g.palo(p, [p[0], p[1], p[2] - 5 - (k % 2) * 3], 0.25, { mat: 'cuerda' }); if (k % 2) calavera(g.sub(p[0], p[1], p[2] - 10, 45).esc(0.55), 3.3, 'mu_hueso', true, -0.15); else { g.cil(p[0], p[1], p[2] - 11, 1.8, 3.2, { mat: 'corteza' }); g.cil(p[0], p[1], p[2] - 7.9, 1.9, 0.4, { mat: 'cuero' }); } } }
  for (const zz of [5.5, 11]) for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU + 0.5; g.caja(T[0] + Math.cos(t) * (9.9 + zz * 0.04), T[1] + Math.sin(t) * (9.9 + zz * 0.04), T[2] + zz + 1.8, 0.6, 1.8, 1.8, { mat: 'dec_runa_verde', giro: (t * 180) / Math.PI }); }
  // dos braseros al pie de la escalinata, y helechos en la falda
  const b1 = brasero(g, C[0] + 26, C[1] + 6, 13, 'mu_hierro'); brasero(g, C[0] + 6, C[1] + 26, 13, 'mu_hierro');
  for (const [x, y] of [[C[0] + 26, C[1] + 6], [C[0] + 6, C[1] + 26]]) for (let k = 0; k < 2; k++) llama(g, x + r2(a, 0.8), y + r2(a, 0.8), 13.5, 2.2, 9 + a.r() * 3, 0, 8, k + 3);
  faldaMatas(g, ps, 10, 26, 34, 'sel2_hoja', C[0], C[1]);
  cuervo(g.sub(C[0] - 20, C[1] + 2, 10, 300).esc(0.9), 'posado');
  void b1; return { piezas: ps, resplandor: { c: [(C[0] + 12) * 2.4, (C[1] + 12) * 2.4, (z + 22) * 2.4], r: 64, color: '#ffa050' } };
}

/** Un costado de casco: tablones que siguen la cuaderna (media sección) de u0 a u1. `s` el lado (+1 o -1). Se saltan los
 * tablones de `rotos(u, fila)` (el boquete). */
function costado(g: G, L: number, W: number, D: number, s: number, rotos: (u: number, f: number) => boolean, mat: string) {
  const a = g.a, filas = 7, segs = 14;
  const P = (u: number, f: number): V3 => { const k = Math.max(0, 1 - (u / (L / 2)) ** 2), w = W * Math.sqrt(k) * Math.sin((f / filas) * Math.PI / 2 + 0.05), zz = D * (1 - Math.cos((f / filas) * Math.PI / 2)); return [u, s * w, zz + (1 - k) * D * 0.25]; };
  for (let f = 0; f < filas; f++) for (let i = 0; i < segs; i++) {
    const u0 = -L / 2 + (i / segs) * L, u1 = -L / 2 + ((i + 1) / segs) * L; if (rotos((u0 + u1) / 2, f)) continue;
    const p0 = P(u0, f), p1 = P(u1, f), q0 = P(u0, f + 1), q1 = P(u1, f + 1), e = 0.9;
    g.poli([p0, p1, q0, q1, [p0[0], p0[1] * 0.92, p0[2] + e * 0.3], [p1[0], p1[1] * 0.92, p1[2] + e * 0.3], [q0[0], q0[1] * 0.92, q0[2]], [q1[0], q1[1] * 0.92, q1[2]]], { mat, tono: (f % 2 ? -0.04 : 0.02) + r2(a, 0.04) });
  }
  return P;
}
/** El barco de Ama en el Manglar Negro: varado de costado sobre el barro, el casco abierto por el boquete donde entraron las
 * raíces, las cuadernas al aire, el mástil partido con la vela en jirones, Ama tallada en la proa con los brazos abiertos al
 * mar que se la llevó, su nombre en la popa y el farol que alguien sigue encendiendo. */
export function barcoAma(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), M = 'ahg_madera';
  // el barro negro y el agua que quedó en los bajos (manchas sueltas, sin canto)
  for (let i = 0; i < 9; i++) { const t = a.r() * TAU, d = 8 + a.r() * 26; g.elip(Math.cos(t) * d, Math.sin(t) * d, -0.3, 5 + a.r() * 6, 3 + a.r() * 4, 0.8, { mat: a.r() < 0.5 ? 'agua_sucia' : 'ahg_lodo', giro: a.r() * 180 }); }
  // el casco: a lo largo de una diagonal, escorado sobre la banda de babor y hundido en el barro
  const L = 66, W = 13, D = 15, h = g.sub(-6, -6, -3, -40, 22, 'x');
  const boquete = (u: number, f: number) => (u > -6 && u < 12 && f >= 1 && f <= 4) || (u > 22 && f > 4 && a.r() < 0.5);
  const P = costado(h, L, W, D, 1, boquete, M); costado(h, L, W, D, -1, () => false, M);
  // la quilla, la roda y el codaste
  h.palo([-L / 2 - 1, 0, 1], [L / 2 + 1, 0, 1], 1.4, { mat: M, tono: -0.08 });
  h.palo([L / 2 + 1, 0, 1], [L / 2 + 6, 0, D + 4], 1.5, { mat: M, tono: -0.06 }); h.palo([-L / 2 - 1, 0, 1], [-L / 2 - 2, 0, D + 6], 1.5, { mat: M, tono: -0.06 });
  // las cuadernas que asoman por el boquete
  for (let u = -4; u <= 10; u += 3.4) { let p = P(u, 0); for (let f = 1; f <= 6; f++) { const q = P(u, f); h.palo([p[0], p[1] * 0.9, p[2]], [q[0], q[1] * 0.9, q[2]], 0.9, { mat: M, tono: -0.12 }); p = q; } }
  h.poli([P(-6, 1), P(12, 1), P(-6, 5), P(12, 5), [-6, 0, 2], [12, 0, 2]], { mat: 'negro' });
  // la cubierta rota y la regala
  for (let u = -L / 2 + 6; u < L / 2 - 6; u += 3.2) { if (a.r() < 0.3) continue; const w = W * Math.sqrt(Math.max(0, 1 - (u / (L / 2)) ** 2)) * 0.95; h.caja(u, 0, D - 1, 2.8, w * 2, 0.8, { mat: M, tono: r2(a, 0.06) }); }
  for (const s of [-1, 1]) { let p = P(-L / 2 + 2, 7); p = [p[0], p[1] * s, p[2] + 1.2]; for (let u = -L / 2 + 6; u <= L / 2 - 2; u += 6) { let q = P(u, 7); q = [q[0], q[1] * s, q[2] + 1.2]; h.palo(p, q, 0.7, { mat: M, tono: 0.05 }); p = q; } }
  // el castillo de popa: la caseta con su ventana y el nombre de Ama en la tabla
  { const c = h.sub(-L / 2 + 9, 0, D - 1); bloque(c, 0, 0, 0, 12, W * 1.3, 9, { mat: M, j: 0.5, b: 0.5 }); c.caja(-6.1, 0, 3, 0.5, 4, 3.4, { mat: 'negro' }); c.caja(0, 0, 9, 14, W * 1.4, 1, { mat: M, tono: 0.06 }); letras(c.sub(-6.4, 0, 0, 90), -3.6, 3.6, 0, 5.4, 1, 'bt_oro_viejo', 2.2, 1.4); }
  // el mástil partido, la verga caída y la vela en jirones colgando de ella
  { const m0: V3 = [4, 0, D - 1], m1: V3 = [4.6, 0, D + 32]; h.palo(m0, m1, 1.6, { mat: M, r1: 1.2 }); for (let k = 0; k < 4; k++) h.palo(m1, [m1[0] + r2(a, 1.5), m1[1] + r2(a, 1.5), m1[2] + 1 + a.r() * 3], 0.7, { mat: M, r1: 0.2 });
    const y0 = h.P(-6, -11, D + 24), y1 = h.P(14, 9, D + 6); ps.push(a.palo(y0, y1, 1, { mat: M }));
    pano(a, ps, mezV(y0, y1, 0.1), mezV(y0, y1, 0.8), 12, 'tela', 0, 8, { tiras: 6, jirones: 0.6, viento: 0.6, tono: -0.12 });
    for (let k = 0; k < 3; k++) ps.push(a.palo(h.P(4.4, 0, D + 28), h.P(-L / 2 + 4 + k * 3, r2(a, 4), D + 8), 0.25, { mat: 'ahg_soga' })); }
  // Ama en la proa: la talla de madera con los brazos abiertos, la cara al mar
  { const pr = h.sub(L / 2 + 5, 0, D + 1, 0, 28, 'y'); figuraVelada(pr.sub(0, 0, -2, 0), 18, { mat: M, pose: 'abraza', tono: 0.08 }); }
  // el manglar: raíces en arco que entran por el boquete y abrazan el casco, y el árbol atrás
  { const cs: Comp[] = [], b: V3 = [-24, -26, 0]; cs.push(g.hu([b[0], b[1], 8], [b[0] + 1, b[1], 40], 4.5, 3));
    for (let i = 0; i < 9; i++) { const t = (i / 9) * TAU, L2 = 12 + a.r() * 10; const m: V3 = [b[0] + Math.cos(t) * L2 * 0.5, b[1] + Math.sin(t) * L2 * 0.5, 12 + a.r() * 4]; cs.push(g.hu([b[0], b[1], 10], m, 2, 1.4), g.hu(m, [b[0] + Math.cos(t) * L2, b[1] + Math.sin(t) * L2, -1], 1.4, 0.9)); }
    for (let i = 0; i < 5; i++) { const p = h.P(-2 + i * 3, W * 0.6, 4 + a.r() * 4), m: V3 = [p[0] + r2(a, 4), p[1] + 6, p[2] + 9], q: V3 = [p[0] + r2(a, 6) + 6, p[1] + 12 + a.r() * 4, -1]; cs.push(g.hu(p, m, 1.2, 1.1), g.hu(m, q, 1.1, 0.7)); }
    const br = [ramaM(g, cs, [b[0] + 1, b[1], 38], [0.5, 0.4, 0.7], 16, 2.6, 0.9, 3, 0.5), ramaM(g, cs, [b[0] + 1, b[1], 38], [-0.6, 0.3, 0.6], 15, 2.4, 0.8, 3, 0.5)];
    g.masa(cs, { mat: 'corteza', suave: 1.6, tono: -0.08 });
    for (const r of br) { const p = r[r.length - 1]; const f: Comp[] = []; for (let k = 0; k < 6; k++) f.push(g.bu([p[0] + r2(a, 8), p[1] + r2(a, 8), p[2] + r2(a, 3)], [7 + a.r() * 3, 6 + a.r() * 3, 3.5])); g.masa(f, { mat: 'sel2_follaje2', suave: 2.2, tono: -0.1 }); } }
  // el farol de popa en su vara, encendido (alguien lo enciende), y un esqueleto con la red en la cubierta
  const fp = h.P(-L / 2 + 4, -W * 0.6, D + 14); ps.push(a.palo(h.P(-L / 2 + 4, -W * 0.6, D + 8), [fp[0], fp[1], fp[2] + 6], 0.6, { mat: 'mu_hierro' })); farol(g, fp[0], fp[1], fp[2] - 1, 1.2);
  esqueleto(g.sub(18, 16, 0.2, 130).esc(0.45), 2, 'mu_hueso');
  faldaMatas(g, ps, 8, 22, 36, 'sel2_hoja');
  cuervo(g.sub(...(h.P(4.6, 0, D + 33) as [number, number, number]), 200).esc(0.9), 'grazna');
  return { piezas: ps, resplandor: { c: [fp[0] * 2.4, fp[1] * 2.4, (fp[2] + 1.5) * 2.4], r: 40, color: '#ffb04a' } };
}

// ================================================================== acto 4
/** La puerta de los jarls en los Picos de Hrimgard: dos piedras paradas con la sierpe y las runas que todavía dan su luz
 * fría, el dintel con la nieve encima, el muro de escudos clavados en semicírculo con las lanzas entre ellos, el cuerno sobre
 * la piedra del juramento, el último que quedó de guardia bajo la nieve y la fogata que nadie volvió a prender. */
export function puertaJarls(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), R = 'nie2_roca';
  // la puerta: mira a +x +y (las dos piedras sobre la diagonal x = -y)
  const pu = g.sub(-12, -12, 0, 45);
  for (const s of [-1, 1]) {
    const p = pu.sub(0, s * 14, 0, 0, s * -3, 'x');
    bloque(p, 0, 0, -1, 9, 8, 54, { mat: R, j: 1.1, b: 1.4, arriba: 0.86 });
    // la sierpe: una banda que sube serpenteando por la cara de adelante, con la cabeza arriba, y runas a su lado
    for (let k = 0; k < 22; k++) { const zz = 4 + k * 2.2, yy = Math.sin(k * 0.55) * 2.4 * s; p.caja(4.6, yy, zz, 0.6, 1.6, 2.4, { mat: 'dec_runa_fria', tono: -0.15 + (k % 3) * 0.05 }); }
    p.elip(4.7, Math.sin(22 * 0.55) * 2.4 * s, 54, 0.8, 2.2, 1.8, { mat: 'dec_runa_fria' });
    letras(p.sub(4.7, 0, 0, 90), -3.6, 3.6, 0, 16, 3, 'dec_runa_fria', 2, 1.2);
    p.elip(0, 0, 53, 5.4, 4.6, 2, { mat: 'nieve' }); p.elip(0, 0, 0.5, 7, 6, 3.4, { mat: 'nieve', tono: -0.05 });
  }
  // el dintel con la nieve que se le junta encima y los carámbanos
  bloque(pu, 0, 0, 53, 10, 38, 8, { mat: R, j: 1, b: 1.2 }); pu.elip(0, 0, 61, 5.4, 18, 2.2, { mat: 'nieve' });
  for (let i = 0; i < 9; i++) { const y = -15 + i * 3.7; pu.cil(4.2 + r2(a, 0.6), y, 53, 0.7, -3 - a.r() * 4, { mat: 'hielo', r1: 0.05 }); }
  // por la puerta: la nieve que se cuela en una lengua hacia afuera
  duna(g, [-2, -2, 0], 22, 8, 3, 45, 3, 'nieve');
  // el muro de escudos: en arco delante de la puerta, clavados y torcidos, con lanzas entre uno y otro
  const COL = ['tela_roja', 'madera_vieja', 'tela_azul', 'madera_vieja', 'tela_roja'];
  for (let i = 0; i < 9; i++) {
    const t = -0.35 + (i / 8) * (Math.PI / 2 + 0.7), d = 30 + r2(a, 2), x = -12 + Math.cos(t) * d, y = -12 + Math.sin(t) * d;
    const s = g.sub(x, y, 4.8, (t * 180) / Math.PI, -12 + r2(a, 10), 'y');
    s.cil(0, 0, 0, 5.2, 1, { mat: COL[i % COL.length], eje: [1, 0, 0] }); s.cil(0.9, 0, 0, 1.4, 0.9, { mat: 'mu_hierro', eje: [1, 0, 0] });
    for (let k = 0; k < 2; k++) s.palo([1.05, -5.2, (k - 0.5) * 3], [1.05, 5.2, (k - 0.5) * 3], 0.4, { mat: 'mu_hierro' });
    if (a.r() < 0.35) s.palo([1.1, -5, 5], [1.2, 2, -4], 0.3, { mat: 'negro' });
    if (i < 8) { const t2 = t + (Math.PI / 2 + 0.7) / 16, x2 = -12 + Math.cos(t2) * (d - 2), y2 = -12 + Math.sin(t2) * (d - 2); g.palo([x2, y2, -1], [x2 + r2(a, 3), y2 + r2(a, 3), 26 + a.r() * 6], 0.6, { mat: 'madera_vieja' }); punta(g, x2 + r2(a, 0.3), y2 + r2(a, 0.3), 25 + a.r() * 6, 4.6, 1.3, 'mu_hierro'); }
    g.elip(x, y, 0.4, 6, 4, 3, { mat: 'nieve', giro: (t * 180) / Math.PI });
  }
  // la piedra del juramento con el cuerno, y el último de guardia, tendido bajo la nieve con el hacha
  bloque(g, 12, 10, 0, 8, 6, 6, { mat: R, giro: 30, j: 0.7 });
  { let p: V3 = [9.5, 9, 6.8]; for (let k = 0; k < 7; k++) { const t = k / 6, q: V3 = [9.5 + t * 6, 9 + Math.sin(t * 2.2) * 3, 6.8 + Math.sin(t * Math.PI) * 3]; if (k) g.palo(p, q, 1.6 - t * 1.1, { mat: 'nie2_marfil', r1: 1.55 - (t + 1 / 6) * 1.1 }); p = q; } g.cil(9.3, 9, 6.4, 1.8, 0.8, { mat: 'mu_hierro', eje: [-1, 0, 0.2] }); }
  cadaver(a, ps, 'soldado', [20, 2, 0], 160, { bruces: true, s: 0.45 });
  for (let i = 0; i < 4; i++) g.elip(18 + r2(a, 6), 2 + r2(a, 4), 2.4, 4 + a.r() * 2, 3, 1.4, { mat: 'nieve', giro: a.r() * 180 });
  g.palo([24, 9, 0.6], [30, 4, 1.4], 0.6, { mat: 'madera_vieja' }); g.caja(30, 4, 0.8, 3, 4.6, 0.8, { mat: 'mu_hierro', giro: 30 });
  // la fogata muerta entre la puerta y el muro
  for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; g.elip(4 + Math.cos(t) * 4, 18 + Math.sin(t) * 4, 1, 1.6, 1.3, 1.2, { mat: R, giro: a.r() * 180 }); }
  g.elip(4, 18, 0.5, 3, 3, 0.6, { mat: 'ext_carbon' }); for (let k = 0; k < 3; k++) g.palo([4 + r2(a, 2), 18 + r2(a, 2), 0.8], [4 + r2(a, 2), 18 + r2(a, 2), 1.2], 0.5, { mat: 'ext_carbon' });
  cuervo(pu.sub(0, -6, 62.5, 160).esc(0.9), 'grazna'); cuervo(pu.sub(0, 9, 62.2, 20).esc(0.85), 'posado');
  return ps;
}

/** Cristal de hielo: prisma de seis caras con el pie en `b`, que sube por `d` (largo L, radio r) y termina en punta; las caras
 * salen chatas y los cantos duros (poliedro), cada una con su tono. */
function cristal(g: G, b: V3, d: V3, L: number, r: number, mat: string, tono = 0) {
  const a = g.a, l = Math.hypot(...d), u: V3 = [d[0] / l, d[1] / l, d[2] / l], t0: V3 = Math.abs(u[2]) > 0.9 ? [1, 0, 0] : [0, 0, 1];
  const e1n: V3 = [u[1] * t0[2] - u[2] * t0[1], u[2] * t0[0] - u[0] * t0[2], u[0] * t0[1] - u[1] * t0[0]], k1 = Math.hypot(...e1n), e1: V3 = [e1n[0] / k1, e1n[1] / k1, e1n[2] / k1];
  const e2: V3 = [u[1] * e1[2] - u[2] * e1[1], u[2] * e1[0] - u[0] * e1[2], u[0] * e1[1] - u[1] * e1[0]], pts: V3[] = [], f0 = a.r() * TAU;
  const P = (s: number, rr: number, an: number): V3 => [b[0] + u[0] * s + (e1[0] * Math.cos(an) + e2[0] * Math.sin(an)) * rr, b[1] + u[1] * s + (e1[1] * Math.cos(an) + e2[1] * Math.sin(an)) * rr, b[2] + u[2] * s + (e1[2] * Math.cos(an) + e2[2] * Math.sin(an)) * rr];
  for (let k = 0; k < 6; k++) { const an = f0 + (k / 6) * TAU + r2(a, 0.15); pts.push(P(-r * 0.4, r * (0.9 + a.r() * 0.2), an), P(L * (0.68 + a.r() * 0.1), r * (0.75 + a.r() * 0.15), an)); }
  pts.push(P(L, r * 0.08, 0));
  g.poli(pts, { mat, tono: tono + r2(a, 0.06) });
}
/** El gigante del Paso del Glaciar: el glaciar lo agarró a medio levantarse. Un frente de cristales de hielo (caras chatas,
 * cantos duros, grietas oscuras y escarcha en lo alto) lo tiene hundido hasta la cintura y le come el brazo izquierdo; afuera
 * quedan el pecho, los dos hombros, la cabeza de carne helada (frente, cuencas hondas, nariz, la boca apretada, la barba de
 * carámbanos y la melena blanca) y el brazo derecho que todavía agarra el hacha clavada en el paso. Delante, la obra de los
 * que quisieron sacarlo: la escala contra el hielo, las picas, la soga, el trineo con bloques y el farol; uno se quedó. */
export function giganteHielo(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), L = g.sub(-14, -14, 0, 45), HI = 'hielo', HH = 'hie2_hielo', PIEL = 'jf_piel_escarcha';
  // (en el marco L: +x mira al camino, y de lado a lado en la pantalla)
  // el frente del glaciar detrás: cristales grandes que se inclinan hacia atrás, más altos detrás de él
  for (let i = 0; i < 22; i++) { const y = -36 + i * 3.4 + r2(a, 1.2), alto = 26 + (1 - Math.abs(y) / 38) * 34 + a.r() * 12, x = -14 - a.r() * 8; cristal(L, [x, y, -4], [-0.35 + r2(a, 0.2), r2(a, 0.3), 1], alto, 4.6 + a.r() * 3, a.r() < 0.5 ? HI : HH, i % 3 ? 0 : 0.08); }
  // el cuerpo: pecho, hombros y cuello (la cintura queda adentro del hielo)
  const cs: Comp[] = [];
  cs.push(L.bu([-4, 0, 26], [9, 14, 13]), L.bu([-3, 0, 34], [9.5, 15, 9]), L.bu([-4, -15, 38], [7.5, 8, 7.5]), L.bu([-5, 15, 38], [7.5, 8, 7.5]), L.hu([-3, 0, 40], [-2, 0, 46], 5.4, 5));
  // la cabeza: cráneo, frente que se adelanta, pómulos, mandíbula y nariz; los arcos de las cejas
  cs.push(L.bu([-1.5, 0, 52], [7.4, 7, 8.4]), L.bu([3.4, 0, 54.6], [3.4, 6.6, 2.6]), L.bu([3.8, -4, 50], [2.6, 2.4, 2.2]), L.bu([3.8, 4, 50], [2.6, 2.4, 2.2]), L.bu([3, 0, 45.6], [4.4, 5.6, 3]), L.bu([6.4, 0, 50.4], [2.2, 1.7, 3.4]));
  // el brazo derecho afuera: del hombro al codo, el antebrazo y el puño en el mango
  const hom: V3 = [-4, -16, 37], codo: V3 = [6, -25, 28], mano: V3 = [15, -23, 22];
  cs.push(L.hu(hom, codo, 6, 5), L.hu(codo, mano, 5, 4.2), L.bu(mano, [4.4, 4, 3.8]));
  // el izquierdo: el codo asoma del hielo y el resto se lo comió el glaciar
  cs.push(L.hu([-5, 16, 36], [-1, 25, 28], 5.6, 4.8));
  L.masa(cs, { mat: PIEL, suave: 2.2, tono: 0.12 });
  // las cuencas hondas, la boca apretada y la escarcha en la carne
  for (const q of [-1, 1]) { L.elip(5.2, q * 3.2, 51.8, 1.4, 1.8, 1.4, { mat: 'negro', tono: 0.1 }); L.esf(5.9, q * 3.2, 51.6, 0.5, { mat: 'dec_runa_fria', tono: -0.2 }); }
  L.caja(6.3, 0, 46.9, 0.8, 5, 0.6, { mat: 'negro', tono: 0.15 });
  
  // la melena blanca detrás y la barba de carámbanos que cuelga de la mandíbula
  { const m: Comp[] = []; for (let i = 0; i < 11; i++) { const t = -1.3 + (i / 10) * 2.6, y = Math.sin(t) * 7, x0 = -3 - Math.cos(t) * 5; m.push(L.hu([x0, y, 58.5 - Math.abs(y) * 0.3], [x0 - 5 - a.r() * 3, y * 1.7, 34 + a.r() * 6], 1.8, 0.7)); } m.push(L.bu([-5, 0, 57], [4.4, 6.6, 3.4])); L.masa(m, { mat: 'cu_pelo_blanco', suave: 1.1 }); }
  for (let i = 0; i < 11; i++) { const y = -4.5 + i * 0.9, l = 5 + a.r() * 6 - Math.abs(y) * 0.6; L.palo([4.4 - Math.abs(y) * 0.2, y, 44.6], [4.9 - Math.abs(y) * 0.2, y * 1.05, 44.6 - l], 0.8 - Math.abs(y) * 0.06, { mat: HI, r1: 0.05 }); }
  for (let i = 0; i < 7; i++) { const p = mezV(hom, mano, a.r()); L.cil(p[0], p[1], p[2] - 3.6, 0.7, -2 - a.r() * 4, { mat: HI, r1: 0.05 }); }
  // el hacha: el mango baja del puño y la hoja queda clavada en el paso
  const fin: V3 = [26, -18, 0]; L.palo([mano[0] - 4, mano[1] - 1, 27], fin, 1.7, { mat: 'nie2_tronco' });
  { const s = L.sub(fin[0] - 1.5, fin[1], 3, -20, -30, 'y'); s.poli([[0, -1, -6], [0, 1, -6], [0, -1, 8], [0, 1, 8], [12, -0.3, -9], [12, 0.3, -9], [12, -0.3, 12], [12, 0.3, 12]], { mat: 'mu_hierro', tono: 0.04 }); }
  // el glaciar adelante: lo agarra hasta la cintura (cristales que salen hacia afuera) y le cubre el brazo izquierdo
  for (let i = 0; i < 18; i++) { const y = -22 + i * 2.6 + r2(a, 1), x = 3 + a.r() * 5; cristal(L, [x, y, -3], [0.4 + r2(a, 0.15), r2(a, 0.4), 1], (Math.abs(y) < 13 ? 24 : 12) + a.r() * 10 + (y > 8 ? 8 : 0), 3.4 + a.r() * 2.4, a.r() < 0.6 ? HI : HH, 0.06); }
  for (let i = 0; i < 6; i++) cristal(L, [-2 + r2(a, 3), 20 + r2(a, 6), 18 + a.r() * 8], [0.3, 0.4 + r2(a, 0.3), 1], 14 + a.r() * 8, 3.4, HI, 0.04);
  // la losa de hielo del suelo con sus grietas oscuras
  L.poli([[-6, -30, -1], [12, -32, -1], [-8, 30, -1], [14, 28, -1], [-4, -26, 2], [10, -28, 2.4], [-6, 26, 2], [12, 24, 2.4], [18, 0, 0.8]], { mat: HH, tono: 0.05 });
  for (let c = 0; c < 5; c++) { let p: V3 = [4 + r2(a, 6), r2(a, 20), 2.5]; for (let k = 0; k < 5; k++) { const q: V3 = [p[0] + r2(a, 3), p[1] + r2(a, 4), 2.5]; L.palo(p, q, 0.22, { mat: 'negro', tono: 0.3 }); p = q; } }
  // la obra de los que quisieron sacarlo: la escala contra el hielo con el farol colgado, las picas, el trineo con bloques
  { const e0: V3 = [20, 8, 0], e1: V3 = [7, 6, 26]; for (const q of [-1, 1]) L.palo([e0[0], e0[1] + q * 2.4, 0], [e1[0], e1[1] + q * 2.4, e1[2]], 0.6, { mat: 'madera_vieja' }); for (let k = 1; k < 8; k++) { const p = mezV(e0, e1, k / 8); L.palo([p[0], p[1] - 2.4, p[2]], [p[0], p[1] + 2.4, p[2]], 0.4, { mat: 'madera_vieja' }); }
    const fz = mezV(e0, e1, 0.78); L.palo(fz, [fz[0] + 2.4, fz[1], fz[2] + 0.6], 0.3, { mat: 'mu_hierro' }); const fp = L.P(fz[0] + 2.6, fz[1], fz[2] - 7.2); farol(g, fp[0], fp[1], fp[2], 1); }
  for (const [x, y, z] of [[7, -6, 14], [8, 12, 12], [6, 2, 9]]) { L.palo([x, y, z], [x + 5, y, z + 3], 0.4, { mat: 'madera_vieja' }); L.palo([x - 0.5, y - 1.6, z + 1], [x - 0.5, y + 1.6, z - 1], 0.35, { mat: 'mu_hierro' }); }
  { const s = L.sub(30, 16, 0, 20); s.caja(0, -3, 1.6, 16, 1, 0.8, { mat: 'madera_vieja' }); s.caja(0, 3, 1.6, 16, 1, 0.8, { mat: 'madera_vieja' }); for (const x of [-6, 0, 6]) s.caja(x, 0, 2.4, 1.6, 8, 0.7, { mat: 'madera_vieja' }); for (const x of [-4, 3]) cristal(s, [x, 0, 2.6], [r2(a, 0.2), r2(a, 0.2), 1], 5, 2.6, HI); }
  { const p = L.P(30, -6, 0); cadaver(a, ps, 'explorador', p, 200, { bruces: false, s: 0.45 }); for (let i = 0; i < 3; i++) g.elip(p[0] + r2(a, 4), p[1] + r2(a, 4), 1.6, 3 + a.r() * 2, 2.4, 1, { mat: 'nieve', giro: a.r() * 180 }); }
  duna(g, [16, -6, 0], 18, 7, 3, 70, 3, 'nieve'); duna(g, [-20, 14, 0], 20, 7, 4, 20, 3, 'nieve');
  cuervo(L.sub(-2, 0, 61, 0).esc(0.9), 'grazna');
  const lz = L.P(16, 8, 18);
  return { piezas: ps, resplandor: { c: [lz[0] * 2.4, lz[1] * 2.4, lz[2] * 2.4], r: 34, color: '#ffbe6a' } };
}

// ================================================================== acto 5
/** El yunque de Sahrim en las Llanuras de Ceniza: el plinto de basalto, el yunque del tamaño de una casa con su cuerno, la
 * hoja a medio forjar que sigue al rojo, el martillo de los que forjaban caído contra el plinto, las cadenas que lo atan a los
 * cuatro bolardos, la escoria que todavía respira, las tenazas y los herreros que se quedaron. */
export function yunqueSahrim(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), B = 'inf2_basalto', F = 'inf2_hierro', C: V3 = [-8, -8, 0];
  let z = 0; for (const [w, h] of [[54, 6], [42, 6]] as [number, number][]) { hilada(g, C[0], C[1], z, w, w * 0.8, h, B, 8, 0.05); z += h; }
  // el yunque a lo largo de la diagonal: pie, cintura, tabla y cuerno
  const y = g.sub(C[0], C[1], z, -45).esc(2.05);
  y.caja(0, 0, 0, 22, 16, 5, { mat: F, tono: -0.06 }); y.poli([[-9, -6, 5], [9, -6, 5], [-9, 6, 5], [9, 6, 5], [-6, -4, 14], [6, -4, 14], [-6, 4, 14], [6, 4, 14]], { mat: F });
  y.caja(-2, 0, 14, 30, 12, 6, { mat: F, tono: 0.04 }); y.caja(-2, 0, 19.6, 30, 12, 0.6, { mat: F, tono: 0.14 });
  y.cil(13, 0, 15.6, 5.2, 15, { mat: F, r1: 0.3, eje: [1, 0, 0.12] });
  y.caja(-12, 0, 19.7, 2.2, 2.2, 0.4, { mat: 'negro' }); y.cil(-8, 0, 19.7, 0.9, 0.4, { mat: 'negro' });
  // la hoja: larga, al rojo en el medio, con la espiga que se enfría y el humo de la última gota de agua
  y.caja(-3, 0, 20.3, 22, 3.6, 0.7, { mat: 'lava', tono: 0.05 }); y.caja(-3, 0, 20.8, 16, 1.2, 0.4, { mat: 'fuego', tono: 0.1 }); y.caja(-17, 0, 20.4, 7, 1.4, 0.6, { mat: 'mu_oxido' });
  // las tenazas sobre la tabla, el martillo caído contra el plinto (cabeza al piso, mango arriba)
  y.palo([-14, -4, 20.6], [-24, -9, 21.4], 0.5, { mat: F }); y.palo([-14, -3, 20.6], [-24, -2, 21.4], 0.5, { mat: F });
  { const s = g.sub(C[0] + 26, C[1] + 4, 0, 60, 18, 'y').esc(1.4); bloque(s, 0, 0, 0, 10, 8, 9, { mat: F, j: 0.6, b: 1 }); s.palo([0, 0, 9], [0, 0, 40], 1.5, { mat: 'madera_vieja', tono: -0.15 }); for (const zz of [11, 26]) s.cil(0, 0, zz, 1.9, 1.2, { mat: 'mu_oxido' }); }
  // las cadenas a los bolardos
  for (const [bx, by, ex, ey] of [[-40, -16, -12, -5], [-16, -40, -5, -12], [18, -30, 5, -8], [-30, 18, -8, 5]] as number[][]) { g.cil(bx, by, 0, 3, 12, { mat: F, r1: 2.4 }); g.cil(bx, by, 11.6, 3.6, 1.6, { mat: F }); cadena(g, [bx, by, 11], [C[0] + ex, C[1] + ey, z + 8], 4, 'mu_oxido', 1.5); }
  // la escoria: montones que se endurecieron, con vetas que todavía arden
  { const cs: Comp[] = []; for (let i = 0; i < 7; i++) cs.push(g.bu([20 + r2(a, 8), -16 + r2(a, 8), 2], [5 + a.r() * 3, 4 + a.r() * 3, 3 + a.r() * 2])); g.masa(cs, { mat: 'inf2_costra', suave: 1.6 }); for (let i = 0; i < 6; i++) { const p: V3 = [20 + r2(a, 7), -16 + r2(a, 7), 4 + a.r() * 2]; g.palo(p, [p[0] + r2(a, 4), p[1] + r2(a, 4), p[2] - 1], 0.4, { mat: 'lava' }); } }
  // los herreros: uno sentado contra el plinto (esqueleto en su delantal), otro tendido con su maza
  esqueleto(g.sub(18, 18, 0.1, 200).esc(0.45), 2, 'inf2_hueso');
  { const s = g.sub(C[0] + 4, C[1] + 19, 0, 260); calavera(s.sub(0, 0, 4.6, 0).esc(0.5), 3.3, 'inf2_hueso', true); s.caja(0, 0, 0, 4, 3, 3.4, { mat: 'cuero', tono: -0.2 }); for (const q of [-1, 1]) s.palo([0, q * 1.2, 1], [4, q * 1.5, 0.4], 0.5, { mat: 'inf2_hueso' }); }
  duna(g, [-30, -2, 0], 20, 8, 3.4, 95, 3, 'inf2_ceniza'); duna(g, [6, -30, 0], 18, 7, 3, 10, 3, 'inf2_ceniza');
  for (let i = 0; i < 6; i++) { const t = a.r() * TAU, d = 30 + a.r() * 8; g.elip(Math.cos(t) * d - 8, Math.sin(t) * d - 8, 0.2, 1.4, 1.1, 0.7, { mat: a.r() < 0.4 ? 'lava' : 'ext_carbon', giro: a.r() * 180 }); }
  return { piezas: ps, resplandor: { c: [C[0] * 2.4, C[1] * 2.4, (z + 44) * 2.4], r: 56, color: '#ff6a24' } };
}

/** El crisol de la fragua volcado en el Río de Lava: el pórtico de vigas con la polea y la cadena rota, el crisol tumbado en
 * su cuna, el chorro que corre por la canaleta de piedra hasta el molde del sello (el pedazo que iban a fundir), lo que se
 * derramó y se endureció, y los fundidores. */
export function crisolFragua(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), F = 'inf2_hierro', B = 'inf2_basalto';
  // el pórtico: dos patas en A de vigas de hierro, la viga de arriba, la polea y la cadena que se cortó
  for (const s of [-1, 1]) { const x = -16 + s * 14, y = -16 - s * 14; g.palo([x - 6, y - 6, 0], [x, y, 56], 1.8, { mat: F }); g.palo([x + 6, y + 6, 0], [x, y, 56], 1.8, { mat: F }); g.palo([x - 3, y - 3, 26], [x + 3, y + 3, 26], 1.1, { mat: F }); }
  g.palo([-30, -2, 56], [-2, -30, 56], 2.2, { mat: F, tono: 0.05 });
  g.cil(-16, -16, 50, 3.2, 2, { mat: F, eje: [0.7, -0.7, 0] }); cadena(g, [-16, -16, 50], [-14, -14, 30], 0.5, 'mu_oxido', 1.1);
  for (let k = 0; k < 3; k++) g.palo([-14, -14, 30], [-14 + r2(a, 2), -14 + r2(a, 2), 27 - k], 0.4, { mat: 'mu_oxido' });
  // la cuna y el crisol tumbado, la boca hacia el molde
  const E0: V3 = [0.62, 0.62, -0.47], el = Math.hypot(...E0), e: V3 = [E0[0] / el, E0[1] / el, E0[2] / el], c0: V3 = [-14, -14, 14];
  for (const s of [-1, 1]) { const q = g.sub(-14 + s * 6, -14 - s * 6, 0, 45); q.poli([[-10, -1, 0], [10, -1, 0], [-10, 1, 0], [10, 1, 0], [-7, -1, 12], [7, -1, 12], [-7, 1, 12], [7, 1, 12]], { mat: B, tono: -0.04 }); }
  g.cil(c0[0], c0[1], c0[2], 8, 18, { mat: F, r1: 11, eje: e }); g.cil(c0[0], c0[1], c0[2], 7, 18.2, { mat: 'negro', r1: 9.8, eje: e });
  const boca: V3 = [c0[0] + e[0] * 18, c0[1] + e[1] * 18, c0[2] + e[2] * 18];
  g.cil(boca[0], boca[1], boca[2], 9.8, 0.6, { mat: 'lava', eje: e }); for (let k = 0; k < 2; k++) g.cil(...mezV(c0, boca, 0.25 + k * 0.5), 9.2 + k * 1.2, 1.4, { mat: 'mu_oxido', eje: e });
  // el chorro: de la boca a la canaleta, y la canaleta hasta el molde del sello
  { let p: V3 = [boca[0] + 2, boca[1] + 2, boca[2] - 4]; for (let k = 1; k <= 5; k++) { const t = k / 5, q: V3 = [boca[0] + 2 + t * 6, boca[1] + 2 + t * 6, (boca[2] - 4) * (1 - t * t) + 1.4]; g.palo(p, q, 2.2 - t * 0.6, { mat: 'lava', r1: 2 - t * 0.6 }); g.palo(p, q, 0.9, { mat: 'fuego' }); p = q; } }
  { const s = g.sub(8, 8, 0, 45); for (let i = 0; i < 4; i++) { bloque(s, i * 6, -3.4, 0, 6, 2.4, 2.4, { mat: B, j: 0.4 }); bloque(s, i * 6, 3.4, 0, 6, 2.4, 2.4, { mat: B, j: 0.4 }); } s.caja(9, 0, 0.6, 24, 4.4, 1.2, { mat: 'lava' }); s.caja(9, 0, 1.3, 22, 1.6, 0.5, { mat: 'fuego', tono: 0.05 });
    // el molde: una piedra con la forma del sello (aro y gajo) llena de metal que se enfría desde el borde
    const m = s.sub(32, 0, 0); bloque(m, 0, 0, 0, 16, 16, 3, { mat: B, j: 0.5 }); m.cil(0, 0, 2.6, 6.4, 0.7, { mat: 'inf2_costra' }); m.cil(0, 0, 2.8, 5, 0.7, { mat: 'lava' }); for (let i = 0; i < 5; i++) { const t = (i / 5) * TAU; m.caja(Math.cos(t) * 2.4, Math.sin(t) * 2.4, 3.3, 4.4, 0.5, 0.4, { mat: 'inf2_costra', giro: (t * 180) / Math.PI }); } }
  // lo derramado: charcos que se endurecieron y todavía rajan rojo
  for (let i = 0; i < 6; i++) { const x = 4 + r2(a, 10), y = 14 + r2(a, 8); g.elip(x, y, 0, 3 + a.r() * 3, 2 + a.r() * 2, 0.9, { mat: 'inf2_costra', giro: a.r() * 180 }); g.palo([x - 2, y, 0.8], [x + 2, y + r2(a, 1.5), 0.8], 0.3, { mat: 'lava' }); }
  // los fundidores: uno con la pértiga todavía en la mano, otro que no alcanzó a correr
  esqueleto(g.sub(24, 8, 0.1, 160).esc(0.45), 2.5, 'inf2_hueso'); g.palo([24, 2, 1.4], [6, -6, 4], 0.6, { mat: F });
  esqueleto(g.sub(0, 24, 0.1, 250).esc(0.45), 3, 'inf2_hueso');
  duna(g, [-30, 4, 0], 18, 8, 3, 100, 3, 'inf2_ceniza');
  return { piezas: ps, resplandor: { c: [(boca[0] + 6) * 2.4, (boca[1] + 6) * 2.4, 8 * 2.4], r: 50, color: '#ff5a1c' } };
}

// ================================================================== acto 6
/** La campana de la marea en la Costa de los Naufragios: dos mástiles de barcos hundidos clavados en la arena y atados en lo
 * alto, la campana de Ysmeral colgada de una cadena, con percebes y algas, la soga del badajo que se va al mar (la marea la
 * toca), el bote volcado, la red con lo que trajo, los barriles y el farol del mástil. */
export function campanaMarea(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), M = 'ahg_madera';
  // los mástiles en A sobre la diagonal, la verga atada arriba
  const top: V3 = [-12, -12, 62];
  for (const s of [-1, 1]) { const b: V3 = [-12 + s * 18, -12 - s * 18, -2]; g.palo(b, [top[0] + s * 2, top[1] - s * 2, top[2] + 4], 2.2, { mat: M, r1: 1.6 }); for (let k = 0; k < 4; k++) g.cil(...mezV(b, top, 0.2 + k * 0.2), 2.6, 1.2, { mat: 'ahg_soga' }); for (let k = 0; k < 6; k++) g.esf(...mezV(b, top, 0.03 + a.r() * 0.15), 0.9, { mat: 'ahg_percebe' }); }
  g.palo([top[0] - 20, top[1] + 20, top[2] - 1], [top[0] + 20, top[1] - 20, top[2] - 1], 1.6, { mat: M });
  for (let k = 0; k < 8; k++) g.palo([top[0] + r2(a, 2), top[1] + r2(a, 2), top[2] + 1.6], [top[0] + r2(a, 2), top[1] + r2(a, 2), top[2] - 2.4], 0.5, { mat: 'ahg_soga' });
  // la campana colgada, con su badajo y la soga larga que baja y corre por la arena hacia el agua
  cadena(g, [top[0], top[1], top[2] - 2], [top[0], top[1], top[2] - 9], 0, 'mu_oxido', 1.2);
  const cb: V3 = [top[0], top[1], top[2] - 9]; campana(g, cb, [0, 0, -1], 9, 'hit_bronce_verdin');
  for (let i = 0; i < 18; i++) { const t = a.r() * TAU, k = a.r(); g.esf(cb[0] + Math.cos(t) * (7 + k * 3), cb[1] + Math.sin(t) * (7 + k * 3), cb[2] - 4 - k * 9, 0.7 + a.r() * 0.5, { mat: 'ahg_percebe' }); }
  for (let i = 0; i < 6; i++) { const t = a.r() * TAU; let p: V3 = [cb[0] + Math.cos(t) * 10, cb[1] + Math.sin(t) * 10, cb[2] - 13]; for (let k = 0; k < 3; k++) { const q: V3 = [p[0] + r2(a, 1), p[1] + r2(a, 1), p[2] - 2.6]; g.palo(p, q, 0.45, { mat: 'ahg_alga' }); p = q; } }
  const bd: V3 = [cb[0], cb[1], cb[2] - 15]; g.palo([cb[0], cb[1], cb[2] - 4], bd, 0.8, { mat: 'mu_hierro' }); g.esf(bd[0], bd[1], bd[2], 2.2, { mat: 'mu_hierro' });
  { let p: V3 = bd; const pts: V3[] = [[bd[0] + 8, bd[1] + 8, 18], [bd[0] + 18, bd[1] + 16, 3], [14, 22, 0.6], [26, 30, 0.6], [38, 38, 0.2]]; for (const q of pts) { g.palo(p, q, 0.55, { mat: 'ahg_soga', tono: -0.1 }); p = q; } g.elip(20, 26, 0.6, 2.4, 1.6, 0.7, { mat: 'ahg_alga', giro: 45 }); }
  // el agua que llega: lenguas de espuma y arena mojada adelante (sin canto: manchas sueltas)
  for (let i = 0; i < 7; i++) { const u = a.r(); g.elip(18 + u * 22 + r2(a, 4), 30 + u * 8 + r2(a, 4), -0.2, 5 + a.r() * 4, 2 + a.r() * 1.5, 0.5, { mat: a.r() < 0.5 ? 'ahg_espuma' : 'ahg_arena', giro: -20 + r2(a, 20), tono: -0.05 }); }
  // el bote volcado, la red con un ahogado y los barriles
  { const s = g.sub(14, -14, 0, 30), cs: Comp[] = []; for (let i = 0; i < 5; i++) { const u = -12 + i * 6; cs.push(s.bu([u, 0, 3], [5, 6.4 * Math.sqrt(1 - (u / 15) ** 2) + 1, 4])); } s.masa(cs, { mat: M, suave: 2 }); s.palo([-15, 0, 1], [15, 0, 1], 0.9, { mat: M, tono: 0.1 }); s.caja(4, 0, 6.6, 3, 2, 1.2, { mat: 'negro', giro: 20 }); }
  { const h = cadaver(a, ps, 'campesino', [22, 8, 0], 120, { bruces: true, s: 0.45 }); for (let i = 0; i < 9; i++) { const p = mezV(h.pecho, h.pies[0] ?? h.pelvis, a.r()); g.palo([p[0] - 5, p[1] - 5, p[2] + 3], [p[0] + 5, p[1] + 5, p[2] + 2], 0.2, { mat: 'ahg_soga' }); } }
  for (const [x, y, t] of [[-24, 10, 0], [-20, 16, 70], [4, 26, 0]]) { const s = g.sub(x, y, t ? 4 : 0, a.r() * 90, t, 'y'); s.cil(0, 0, 0, 4, 9, { mat: M, r1: 4 }); s.elip(0, 0, 4.5, 4.6, 4.6, 4, { mat: M }); for (const zz of [1.5, 7]) s.cil(0, 0, zz, 4.5, 0.6, { mat: 'mu_oxido' }); }
  // el farol de un mástil y las algas que trajo la última marea
  const fp = mezV([-30, 6, -2], top, 0.55); g.palo(fp, [fp[0] + 3, fp[1] + 3, fp[2]], 0.4, { mat: 'mu_hierro' }); farol(g, fp[0] + 3.2, fp[1] + 3.2, fp[2] - 6.4, 1.1);
  for (let i = 0; i < 8; i++) { const t = a.r() * TAU, d = 10 + a.r() * 26; g.elip(Math.cos(t) * d, Math.sin(t) * d, 0.2, 2.6, 1, 0.5, { mat: 'ahg_alga', giro: a.r() * 180 }); g.elip(Math.cos(t + 1) * d, Math.sin(t + 1) * d, 0.3, 0.9, 0.7, 0.5, { mat: 'ahg_concha', giro: a.r() * 180 }); }
  cuervo(g.sub(top[0] + 9, top[1] - 9, top[2] + 0.6, 130).esc(0.9), 'posado');
  return { piezas: ps, resplandor: { c: [(fp[0] + 3) * 2.4, (fp[1] + 3) * 2.4, (fp[2] - 4) * 2.4], r: 40, color: '#ffbe5a' } };
}

/** La Abadesa de la Sal en el Arrecife de Huesos: la estatua de sal sobre el arrecife, velada, con la campanilla entre las
 * manos; la sal que el mar le va comiendo; los peregrinos que vinieron a pedirle y se quedaron de rodillas, de sal también
 * (a uno se le cayó la cabeza); el costillar de la ballena y el coral que crece en los huesos, y la luz del mar. */
export function abadesaSal(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), S = 'ahg_sal', C: V3 = [-12, -12, 0];
  // el arrecife: peñas con coral y percebes, el plinto donde está parada
  for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU + a.r() * 0.4, d = 9 + a.r() * 4; pena(a, ps, [C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, 0], [8 + a.r() * 3, 7 + a.r() * 2, 7 + a.r() * 4], { mat: 'ahg_roca', musgo: 0.5, matMusgo: 'ahg_alga' }); }
  bloque(g, C[0], C[1], 0, 16, 16, 11, { mat: 'ahg_roca', j: 1.4, b: 1.6, arriba: 0.85 });
  for (let i = 0; i < 14; i++) { const t = a.r() * TAU, d = 6 + a.r() * 12, zz = 2 + a.r() * 8; for (let k = 0; k < 3; k++) g.palo([C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, zz], [C[0] + Math.cos(t) * d + r2(a, 2), C[1] + Math.sin(t) * d + r2(a, 2), zz + 2 + a.r() * 2], 0.4, { mat: 'ahg_coral', r1: 0.2 }); }
  // la Abadesa: grande, velada, mirando al camino, las manos juntas con la campanilla
  const ab = g.sub(C[0], C[1], 10.6, 45); const zh = figuraVelada(ab, 62, { mat: S, pose: 'reza' });
  campana(ab, [8.6, 0, zh - 10.5], [0, 0, -1], 2.2, 'hit_bronce_verdin');
  // la sal comida por el mar: hoyos y lajas caídas al pie
  for (let i = 0; i < 9; i++) { const zz = 3 + a.r() * (zh - 14), t = r2(a, 1.6); ab.elip(Math.cos(t) * 8.6, Math.sin(t) * 8.6, zz, 2.4 + a.r(), 1.6, 1.6, { mat: S, resta: true }); }
  for (let i = 0; i < 6; i++) bloque(g, C[0] + 12 + r2(a, 6), C[1] + 12 + r2(a, 6), 0, 3 + a.r() * 3, 2 + a.r() * 2, 1.6 + a.r() * 2, { mat: S, giro: a.r() * 90, incl: r2(a, 30), j: 0.6 });
  // los peregrinos de sal, de rodillas mirándola, en arco adelante; a uno se le partió la cabeza
  for (let i = 0; i < 5; i++) {
    const t = Math.PI / 4 + (i - 2) * 0.42, d = 30 + r2(a, 2), x = C[0] + Math.cos(t) * d, y = C[1] + Math.sin(t) * d;
    const f = g.sub(x, y, 0, (t * 180) / Math.PI + 180); figuraVelada(f, 27, { mat: S, pose: i % 2 ? 'reza' : 'rodillas', tono: r2(a, 0.05) });
    if (i === 3) { f.elip(0.3, 0, 23 * 27 / 34 + 1, 3.6, 3.6, 4.6, { mat: S, resta: true }); calavera(g.sub(x + 4, y + 3, 1, a.r() * 360).esc(0.5), 3.3, S, false); }
  }
  // el costillar de la ballena a un costado, con el coral en los huesos
  { const s = g.sub(14, -22, 0, 70); for (let i = 0; i < 6; i++) { const u = -14 + i * 5.6, H = 22 - Math.abs(i - 2.5) * 3; for (const q of [-1, 1]) { let p: V3 = [u, q * 3, 0]; for (let k = 1; k <= 4; k++) { const t = k / 4, n: V3 = [u + t * 2, q * (3 + Math.sin(t * Math.PI) * 9), Math.sin(t * Math.PI * 0.55) * H]; s.palo(p, n, 1.2 - t * 0.4, { mat: 'mu_hueso', tono: -0.1 }); p = n; } } } s.palo([-17, 0, 1], [17, 0, 1.5], 1.8, { mat: 'mu_hueso', tono: -0.15 }); for (let i = 0; i < 8; i++) s.esf(r2(a, 14), r2(a, 8), a.r() * 10, 1, { mat: 'ahg_coral' }); }
  // la luz del mar: algas y medusas que brillan en los charcos del arrecife
  for (let i = 0; i < 5; i++) { const t = a.r() * TAU, d = 16 + a.r() * 8; g.elip(C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, 0, 4, 3, 0.4, { mat: 'ahg_agua', giro: a.r() * 180 }); g.esf(C[0] + Math.cos(t) * d + r2(a, 1.5), C[1] + Math.sin(t) * d + r2(a, 1.5), 0.6, 0.9, { mat: 'ahg_bio' }); }
  for (let i = 0; i < 8; i++) { const t = a.r() * TAU, d = 16 + a.r() * 20; g.elip(C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, 0.2, 2.6, 1, 0.5, { mat: 'ahg_alga', giro: a.r() * 180 }); }
  cuervo(ab.sub(0, 0, zh + 4.2, 0).esc(0.85), 'posado');
  return { piezas: ps, resplandor: { c: [C[0] * 2.4 + 20, C[1] * 2.4 + 20, 10], r: 46, color: '#58d0c8' } };
}

/** El campanario ladeado de las Calles Mojadas: la torre de Ysmeral hundida de un lado, con la puerta bajo el agua, las
 * algas hasta donde llegó la marea, el campanario abierto en cuatro arcos con su campana todavía colgada y el chapitel roto;
 * la pasarela de tablas que alguien tendió hasta la puerta y el farol en su poste. */
export function campanarioLadeado(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), P = 'ahg_piedra', T = g.sub(-12, -12, -6, 45, -13, 'x');
  // el fuste: hiladas de sillares de 22 x 22
  const W = 22;
  for (let f = 0; f < 10; f++) { const z = f * 5.6, off = (f % 2) * 3; for (const lado of [0, 1, 2, 3]) { const s = T.sub(0, 0, 0, lado * 90); for (let u = -W / 2 + off - 6; u < W / 2; u += 7) { const c = Math.max(-W / 2, u), d2 = Math.min(W / 2, u + 7); if (d2 - c < 2) continue; bloque(s, (c + d2) / 2, W / 2 - 2.2, z, d2 - c - 0.3, 4.4, 5.4, { mat: P, j: 0.5, b: 0.6, tono: r2(a, 0.06) - (z < 14 ? 0.08 : 0) }); } } }
  T.caja(0, 0, 0, W - 8, W - 8, 56, { mat: P, tono: -0.1 });
  // la marea hasta donde subió: algas y percebes en las hiladas de abajo
  for (let i = 0; i < 26; i++) { const lado = Math.floor(a.r() * 2), u = r2(a, W / 2 - 1), z = 4 + a.r() * 9, s = T.sub(0, 0, 0, lado * 90 + 0); s.elip(u, W / 2 + 0.3, z, 1.6 + a.r(), 0.6, 1.2 + a.r(), { mat: a.r() < 0.6 ? 'ahg_alga' : 'ahg_percebe' }); }
  // la puerta (cara +x), con el agua adentro
  { const s = T.sub(W / 2, 0, 0, 90); s.caja(0, -0.3, 0, 8, 1.4, 12, { mat: 'negro' }); for (const q of [-1, 1]) s.caja(q * 4.8, 0, 0, 1.6, 1.6, 12, { mat: 'ahg_piedra_lisa' }); s.cil(0, 0.6, 12, 4.8, 1.6, { mat: 'ahg_piedra_lisa', eje: [0, 1, 0] }); }
  // el campanario: cuatro pilares, arcos, cornisa, la campana adentro y el chapitel roto
  { const zc = 56; for (const [x, y] of [[-W / 2 + 3, -W / 2 + 3], [W / 2 - 3, -W / 2 + 3], [-W / 2 + 3, W / 2 - 3], [W / 2 - 3, W / 2 - 3]]) T.caja(x, y, zc, 3, 3, 24, { mat: P });
    for (let lado = 0; lado < 4; lado++) { const s = T.sub(0, 0, zc, lado * 90); for (let k = 0; k <= 8; k++) { const t = (k / 8) * Math.PI, t2 = ((k + 1) / 8) * Math.PI; if (k < 8) s.palo([-Math.cos(t) * 7.4, W / 2 - 1.5, 20.5 + Math.sin(t) * 3], [-Math.cos(t2) * 7.4, W / 2 - 1.5, 20.5 + Math.sin(t2) * 3], 1, { mat: 'ahg_piedra_lisa' }); } }
    T.caja(0, 0, zc + 24, W + 1, W + 1, 2.4, { mat: 'ahg_piedra_lisa', tono: 0.05 });
    T.caja(0, 0, zc, W - 7, W - 7, 0.8, { mat: P }); T.palo([-10, 0, zc + 21], [10, 0, zc + 21], 1.4, { mat: 'ahg_madera' }); campana(T, [0, 0, zc + 20.5], [0, 0, -1], 7.6, 'hit_bronce_verdin'); T.palo([0, 0, zc + 9], [3, 4, zc + 3], 0.6, { mat: 'mu_hierro' });
    T.poli([[-W / 2, -W / 2, zc + 26.4], [W / 2, -W / 2, zc + 26.4], [-W / 2, W / 2, zc + 26.4], [W / 2, W / 2, zc + 26.4], [-2, -2, zc + 40], [3, -1, zc + 36], [-1, 4, zc + 37]], { mat: 'ahg_piedra', tono: -0.12 });
    for (let k = 0; k < 4; k++) T.palo([r2(a, 3), r2(a, 3), zc + 34], [r2(a, 4), r2(a, 4), zc + 42 + a.r() * 4], 0.4, { mat: 'mu_oxido' }); }
  // el agua alrededor de la base (charcos sueltos del lado que se hundió) y el barro
  for (let i = 0; i < 8; i++) { const t = -0.3 + a.r() * 2.2, d = 14 + a.r() * 10; g.elip(-12 + Math.cos(t) * d, -12 + Math.sin(t) * d, -0.2, 5 + a.r() * 5, 3 + a.r() * 3, 0.6, { mat: a.r() < 0.6 ? 'ahg_agua' : 'ahg_lodo', giro: a.r() * 180 }); }
  // la pasarela de tablas sobre pilotes hasta la puerta, y el farol en su poste
  { const s = g.sub(8, -6, 0, 20); for (let i = 0; i < 7; i++) { if (i === 4) continue; s.caja(i * 3.6, 0, 2.6, 3, 7 + r2(a, 0.8), 0.7, { mat: 'ahg_madera', giro: r2(a, 6), tono: r2(a, 0.08) }); } for (const x of [0, 10, 20]) for (const y of [-3.2, 3.2]) s.palo([x, y, -1], [x, y, 2.6], 0.7, { mat: 'ahg_madera', tono: -0.1 }); }
  g.palo([24, 2, 0], [24, 2, 24], 0.8, { mat: 'ahg_madera' }); g.palo([24, 2, 23], [27, 5, 23.5], 0.4, { mat: 'mu_hierro' }); farol(g, 27.2, 5.2, 16.6, 1.1);
  for (let i = 0; i < 6; i++) bloque(g, 14 + r2(a, 10), 14 + r2(a, 10), 0, 3 + a.r() * 3, 3, 2.2, { mat: P, giro: a.r() * 90, incl: r2(a, 25), j: 0.6 });
  cuervo(T.sub(0, 4, 56 + 26.6, 200).esc(0.9), 'grazna');
  return { piezas: ps, resplandor: { c: [27 * 2.4, 5 * 2.4, 19 * 2.4], r: 40, color: '#ffbe5a' } };
}

/** El coro de campanas de la Plaza de las Ánimas: nueve campanas enterradas de boca hasta media falda, una por cada ánima que
 * se llevó el mar, alrededor del poste vacío con su yugo; velas en las coronas, sal, algas, lo que queda del enlosado y la
 * doliente que se cubre la cara. */
export function coroCampanas(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), C: V3 = [-8, -8, 0];
  // el poste del medio: pilar de piedra con el yugo vacío y la cadena colgando
  bloque(g, C[0], C[1], 0, 8, 8, 58, { mat: 'ahg_piedra', j: 0.6, arriba: 0.9 }); g.caja(C[0], C[1], 58, 10, 10, 2.6, { mat: 'ahg_piedra_lisa' });
  g.palo([C[0] - 13, C[1] + 13, 53], [C[0] + 13, C[1] - 13, 53], 2, { mat: 'ahg_madera' }); for (const s of [-1, 1]) g.palo([C[0] + s * 11, C[1] - s * 11, 53], [C[0] + s * 11, C[1] - s * 11, 58], 1, { mat: 'mu_hierro' });
  cadena(g, [C[0] + 6, C[1] - 6, 52], [C[0] + 6.4, C[1] - 6.2, 34], 0, 'mu_oxido', 1.3);
  for (let i = 0; i < 5; i++) g.elip(C[0] + r2(a, 3), C[1] + r2(a, 3), 8 + a.r() * 20, 2.2, 1.2, 1.4, { mat: 'ahg_alga' });
  // el enlosado que queda: losas sueltas, hundidas, con sal en las juntas
  for (let i = 0; i < 16; i++) { const t = a.r() * TAU, d = 6 + a.r() * 28; bloque(g, C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, -0.7, 6 + a.r() * 2, 5 + a.r() * 2, 1.2, { mat: 'ahg_piedra_lisa', giro: a.r() * 20, incl: r2(a, 5), j: 0.5, b: 0.5, tono: r2(a, 0.08) }); }
  // las nueve campanas, enterradas de boca (asoma la corona y media falda), de tamaños y metales distintos
  for (let i = 0; i < 9; i++) {
    const t = (i / 9) * TAU + 0.2, d = 26 + r2(a, 2), x = C[0] + Math.cos(t) * d, y = C[1] + Math.sin(t) * d, R = 6.2 + a.r() * 3, L = R * 1.55;
    const tilt: V3 = [r2(a, 0.18), r2(a, 0.18), -1], tl = Math.hypot(...tilt), e: V3 = [tilt[0] / tl, tilt[1] / tl, tilt[2] / tl];
    campana(g, [x, y, L * 0.55], e, R, i % 3 ? 'hit_bronce_verdin' : 'ahg_bronce_viejo');
    g.elip(x, y, 0.2, R * 1.25, R * 1.15, 0.8, { mat: 'ahg_lodo', tono: -0.05 });
    vela(g, x, y, L * 0.55 + R * 0.1, 1.6 + a.r() * 2.4, 0.8, 0, 8, i, a.r() < 0.7);
    if (a.r() < 0.5) g.elip(x + r2(a, 2), y + r2(a, 2), L * 0.3, 1.6, 1, 0.8, { mat: 'ahg_sal', giro: a.r() * 180 });
    if (i % 3 === 0) letras(g.sub(x, y, 0, (t * 180) / Math.PI + 180).sub(R * 0.86, 0, 0, 90), -1.6, 1.6, 0, L * 0.38, 1, 'ahg_sal', 1.2, 0.6);
  }
  // la doliente: se cubre la cara frente a una campana, de espaldas al poste
  figuraVelada(g.sub(C[0] + 15, C[1] + 15, 0, 45), 30, { mat: 'ahg_vela', pose: 'cubre_cara', tono: -0.15 });
  for (let i = 0; i < 6; i++) { const t = a.r() * TAU, d = 10 + a.r() * 26; g.elip(C[0] + Math.cos(t) * d, C[1] + Math.sin(t) * d, 0.2, 2.4, 1, 0.5, { mat: a.r() < 0.5 ? 'ahg_alga' : 'ahg_sal', giro: a.r() * 180 }); }
  cuervo(g.sub(C[0], C[1], 60.6, 40).esc(0.9), 'grazna');
  return { piezas: ps, resplandor: { c: [(C[0] + 14) * 2.4, (C[1] + 14) * 2.4, 12 * 2.4], r: 42, color: '#ffb850' } };
}

// ================================================================== acto 7
/** La escalera de los siete en el Cielo Roto: la escalinata de mármol que sube hacia atrás y se corta en el aire, la baranda
 * de oro, los peldaños que se van soltando hacia arriba, el arco roto donde terminaba; seis marcados tendidos donde los dejó
 * la sed, cada uno más arriba, y al pie el bastón y el manto del séptimo, el que volvió. */
export function escaleraSiete(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), M = 'cel_marmol', O = 'cel_oro', E = g.sub(22, -4, 0, 180);
  // la escalinata: catorce peldaños hacia atrás, el macizo de abajo, las barandas de oro con sus pilares
  const N = 12, paso = 4.2, alza = 4.8, ancho = 22;
  for (let i = 0; i < N; i++) { const roto = i >= N - 3, x = i * paso; bloque(E, x, roto ? r2(a, 2) : 0, (i + 1) * alza - 1.6, paso + 0.4, ancho - (roto ? 6 + a.r() * 6 : 0), 1.6, { mat: M, j: roto ? 1 : 0.35, b: 0.4, tono: 0.04 - i * 0.004, incl: roto ? r2(a, 8) : 0 }); E.caja(x, 0, 0, paso, ancho - 1, (i + 1) * alza - 1.6, { mat: M, tono: -0.1 }); }
  for (const s of [-1, 1]) { for (let i = 0; i < N - 3; i += 2) { const x = i * paso, zz = (i + 1) * alza; E.cil(x, s * (ancho / 2 - 1), zz, 0.9, 9, { mat: M }); E.cil(x, s * (ancho / 2 - 1), zz + 8.6, 1.3, 1, { mat: O }); } E.palo([0, s * (ancho / 2 - 1), alza + 9], [(N - 4) * paso, s * (ancho / 2 - 1), (N - 3) * alza + 9], 0.7, { mat: O }); }
  // los peldaños que se soltaron: bloques en el aire, cada vez más sueltos, y polvo de oro cayendo
  for (let i = 0; i < 5; i++) bloque(E, (N + i * 0.9) * paso, r2(a, 5), (N + 1.5 + i * 1.6) * alza, 3.4, 4 + a.r() * 5, 1.4, { mat: M, giro: r2(a, 30), incl: r2(a, 30), j: 0.8 });
  for (let i = 0; i < 12; i++) E.esf((N - 2) * paso + r2(a, 6), r2(a, 8), (N - 2) * alza - a.r() * 30, 0.4, { mat: 'cel_luz_oro' });
  // el arco roto donde terminaba: un brazo de oro que sube y se corta
  for (let k = 0; k < 8; k++) { const t = (k / 12) * Math.PI, t2 = ((k + 1) / 12) * Math.PI; E.palo([(N - 1) * paso, -Math.cos(t) * 12, N * alza + Math.sin(t) * 16], [(N - 1) * paso, -Math.cos(t2) * 12, N * alza + Math.sin(t2) * 16], 1.8, { mat: k % 3 ? O : M }); }
  // los seis marcados, cada uno más arriba, bebidos (la sed los dejó secos)
  for (let i = 0; i < 6; i++) { const st = 1 + i * 2 + (i > 2 ? 1 : 0), x = st * paso, zz = (st + 1) * alza; muneco(a, ps, tendido(E.P(x + 0.4, r2(a, 5), zz), 0 + r2(a, 50), a.r() < 0.5, 2.6), { ...ropaDe(a, 'explorador'), piel: 'sed_piel_seca', capucha: undefined }, { brazos: [120 + r2(a, 50), 40 + r2(a, 40)], codos: [r2(a, 30), r2(a, 30)], piernas: [10 + a.r() * 15, 5 + a.r() * 20], rodillas: [10 + a.r() * 30, a.r() * 30], cabeza: r2(a, 40) }, { s: 0.45 }); }
  // al pie: el bastón y el manto del que volvió (Eskel), doblado sobre el primer peldaño
  E.palo([-2, -6, alza + 0.2], [-1, 6, alza + 0.6], 0.6, { mat: 'madera_vieja' }); E.elip(0.6, 2, alza + 0.4, 2.6, 3.6, 0.9, { mat: 'cu_tela_ceniza' });
  // las nubes y la luz que sube del corte
  for (let i = 0; i < 6; i++) { const t = a.r() * TAU, d = 24 + a.r() * 12; g.elip(Math.cos(t) * d - 6, Math.sin(t) * d - 6, 0.4, 6 + a.r() * 4, 4, 1.6, { mat: 'cel_nube', giro: a.r() * 180 }); }
  const top = E.P((N - 1) * paso, 0, N * alza + 12);
  return { piezas: ps, resplandor: { c: [top[0] * 2.4, top[1] * 2.4, top[2] * 2.4], r: 50, color: '#ffe2a0' } };
}

/** El cáliz de Aun-Saar en el Jardín de los que Intentaron: el estrado redondo, el cáliz de oro alto como una torre, seco y
 * rajado, con la corona de puntas en el labio; los que se arrodillaron a pedirle de beber, de mármol, con las manos alzadas
 * (a dos se les rompieron los brazos), el árbol de oro muerto y el polvo dorado que cae del borde. */
export function calizAunSaar(a: Arma): Hito {
  const ps: Pieza[] = [], g = new G(a, ps), M = 'cel_marmol', O = 'cel_oro', OV = 'cel_oro_viejo', C: V3 = [-8, -8, 0];
  // el estrado: dos gradas redondas de losas
  for (const [r, z, h] of [[22, 0, 3.4], [16, 3.4, 3.4]] as [number, number, number][]) { const nl = r > 18 ? 18 : 13; for (let i = 0; i < nl; i++) { const t = (i / nl) * TAU, x = C[0] + Math.cos(t) * (r - 3), y = C[1] + Math.sin(t) * (r - 3); bloque(g.sub(x, y, 0, (t * 180) / Math.PI), 0, 0, z, 6, (TAU * (r - 3)) / nl + 0.5, h, { mat: M, j: 0.4, tono: r2(a, 0.06) }); } g.cil(C[0], C[1], z, r - 5.5, h, { mat: M, tono: -0.05 }); }
  // el cáliz: pie, nudo, astil y la copa con su corona de puntas; adentro seco y rajado
  const z0 = 6.8;
  g.cil(C[0], C[1], z0, 9, 3, { mat: OV, r1: 6 }); g.cil(C[0], C[1], z0 + 3, 3, 14, { mat: O, r1: 2.4 }); g.elip(C[0], C[1], z0 + 11, 4.4, 4.4, 3, { mat: OV });
  for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU; g.esf(C[0] + Math.cos(t) * 4.2, C[1] + Math.sin(t) * 4.2, z0 + 11, 1, { mat: 'cel_luz' }); }
  g.cil(C[0], C[1], z0 + 17, 2.4, 4, { mat: O, r1: 10 }); g.cil(C[0], C[1], z0 + 21, 10, 13, { mat: O, r1: 16 }); g.cil(C[0], C[1], z0 + 33.6, 16.4, 1.4, { mat: OV });
  g.cil(C[0], C[1], z0 + 23, 8.6, 12, { mat: 'negro', r1: 14.8 });
  g.elip(C[0], C[1], z0 + 24, 9, 9, 1, { mat: 'sed_ceniza', tono: -0.1 });
  for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU, t2 = t + 0.18; g.poli([[C[0] + Math.cos(t) * 15.6, C[1] + Math.sin(t) * 15.6, z0 + 34.6], [C[0] + Math.cos(t2) * 15.6, C[1] + Math.sin(t2) * 15.6, z0 + 34.6], [C[0] + Math.cos(t) * 16.6, C[1] + Math.sin(t) * 16.6, z0 + 34.6], [C[0] + Math.cos(t + 0.09) * 16, C[1] + Math.sin(t + 0.09) * 16, z0 + 40 + (i % 3 === 0 ? 4 : 0)]], { mat: OV }); }
  for (let i = 0; i < 4; i++) { const t = r2(a, 1) + Math.PI / 4; grieta(g.sub(C[0] + Math.cos(t) * 13, C[1] + Math.sin(t) * 13, 0, (t * 180) / Math.PI + 90), 0, 0.6, z0 + 23 + i * 1.5, z0 + 32, OV); }
  for (let i = 0; i < 10; i++) { const t = Math.PI / 4 + r2(a, 0.6); g.esf(C[0] + Math.cos(t) * (16 + a.r() * 2), C[1] + Math.sin(t) * (16 + a.r() * 2), z0 + 30 - a.r() * 28, 0.4, { mat: 'cel_luz_oro' }); }
  // los que se arrodillaron: seis de mármol alrededor, mirando el cáliz; dos con los brazos rotos a sus pies
  for (let i = 0; i < 6; i++) {
    const t = Math.PI / 4 + (i - 2.5) * 0.62 + r2(a, 0.06), d = 27, x = C[0] + Math.cos(t) * d, y = C[1] + Math.sin(t) * d;
    const f = g.sub(x, y, 0, (t * 180) / Math.PI + 180); figuraVelada(f, 26, { mat: M, pose: i % 2 ? 'reza' : 'rodillas', tono: r2(a, 0.04) });
    if (i === 1 || i === 4) for (let k = 0; k < 2; k++) g.palo([x + r2(a, 4), y + r2(a, 4), 0.8], [x + r2(a, 6), y + r2(a, 6), 0.9], 1.1, { mat: M });
    g.elip(x, y, 0.2, 6, 5, 0.7, { mat: 'cel_luz_oro', tono: -0.4, giro: (t * 180) / Math.PI });
  }
  // el árbol de oro muerto detrás
  { const s = g.sub(-30, -24, 0); arbolMuerto(s, 52, 4, { mat: OV, ramas: 6, tor: 0.6 }); }
  for (let i = 0; i < 6; i++) { const t = a.r() * TAU, d = 30 + a.r() * 8; g.elip(Math.cos(t) * d - 8, Math.sin(t) * d - 8, 0.3, 5, 3.4, 1.4, { mat: 'cel_nube', giro: a.r() * 180 }); }
  return { piezas: ps, resplandor: { c: [C[0] * 2.4, C[1] * 2.4, (z0 + 38) * 2.4], r: 44, color: '#ffd878' } };
}

export const HITOS_LEJANOS: Record<string, (a: Arma) => Hito> = {
  a3_tambor: tamborYhuantl, a3_barco: barcoAma, a4_puerta: puertaJarls, a4_gigante: giganteHielo, a5_yunque: yunqueSahrim, a5_crisol: crisolFragua,
  a6_campana: campanaMarea, a6_abadesa: abadesaSal, a6_campanario: campanarioLadeado, a6_coro: coroCampanas, a7_escalera: escaleraSiete, a7_caliz: calizAunSaar,
};
