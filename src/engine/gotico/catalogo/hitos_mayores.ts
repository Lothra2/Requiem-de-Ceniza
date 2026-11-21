import type { Arma, Pieza, V3 } from '../objeto';
import type { Escena } from '../render';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, bloque, ojiva, cascotes, hiedra, cadena, cuervo, vela, calavera, letras, grieta } from '../kit_muerte';
import { colgado, muneco, ropaDe, mata, disco } from '../exteriores';
import './abadia_oria';
import './desierto2';

/**
 * Los hitos mayores de los mundos abiertos de los actos 1 y 2 (variantes de `acto_hito`, que los agranda 2,4 veces):
 * el campanario caído del camposanto, el roble de las sogas, el pozo del Oasis Muerto y el obelisco del sol. Cada uno
 * se lee de lejos por su silueta (lo alto atrás, a -x -y, lo bajo y el relato adelante, a +x +y, que es lo que ve la
 * cámara) y de cerca cuenta lo que pasó. Una persona mide unas 31 unidades acá adentro.
 */

const M = MATERIALES;
const TAU = Math.PI * 2;
/** Bronce viejo con verdín: lo hondo y lo que no da la luz es verde oscuro, lo que sale y brilla es bronce. */
M.hit_bronce_verdin = {
  rampa: ['#08100d', '#0f1c17', '#172a22', '#22382c', '#3a4630', '#5a5233', '#7a6236', '#98763e', '#b28c4c'], ruido: 0.3, escala: 0.3, brillo: 0.45,
  patron: (p, n) => { const v = ruido(p[0] * 0.22, p[1] * 0.22, p[2] * 0.6); const ch = Math.abs(n[2]) < 0.6 ? ruido(p[0] * 0.9 + p[1] * 0.9, 3, p[2] * 0.07) : 0; return (v > 0.62 ? -0.22 : 0) + (ch > 0.62 ? -0.18 : 0) + (ruido(p[0] * 1.4, p[1] * 1.4, p[2] * 1.4) > 0.8 ? 0.1 : 0); },
};
/** Barro seco en placas: las grietas salen del borde de celdas de Voronoi torcidas (para el fondo del oasis). */
M.hit_barro_seco = {
  rampa: ['#170e08', '#26170d', '#372213', '#4a2f1a', '#5d3d23', '#704c2d', '#835c39'], ruido: 0.25, escala: 0.3,
  patron: (p, n) => {
    if (n[2] < 0.5) return -0.08;
    const k = 0.16, x = p[0] * k + (ruido(p[0] * 0.05, p[1] * 0.05, 1) - 0.5) * 1.2, y = p[1] * k + (ruido(p[0] * 0.05, p[1] * 0.05, 7) - 0.5) * 1.2;
    const ix = Math.floor(x), iy = Math.floor(y); let d1 = 9, d2 = 9;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) { const cx = ix + i + ruido(ix + i, iy + j, 3.3), cy = iy + j + ruido(ix + i, iy + j, 8.1), d = Math.hypot(x - cx, y - cy); if (d < d1) { d2 = d1; d1 = d; } else if (d < d2) d2 = d; }
    const e = d2 - d1; return e < 0.07 ? -0.5 : e < 0.16 ? -0.12 : (ruido(p[0] * 0.5, p[1] * 0.5, 2) - 0.5) * 0.16 + d1 * 0.08;
  },
};

const ang = (x: number, y: number) => Math.atan2(y, x);
export const mezV = (p: V3, q: V3, t: number): V3 => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, p[2] + (q[2] - p[2]) * t];

/** Un muro de sillares entre (x0,y0) y (x1,y1) de grueso T con su perfil de alto `alto(t)` (t de 0 a 1): sólido hasta el
 * alto más bajo y por encima sillar a sillar, así el borde roto sale en escalones de hilada. */
export function muroRoto(g: G, x0: number, y0: number, x1: number, y1: number, T: number, alto: (t: number) => number, mat: string, hilada = 6.5) {
  const a = g.a, L = Math.hypot(x1 - x0, y1 - y0), giro = (ang(x1 - x0, y1 - y0) * 180) / Math.PI;
  let zmin = 999; for (let i = 0; i <= 20; i++) zmin = Math.min(zmin, alto(i / 20));
  const z0 = Math.max(0, Math.floor(zmin / hilada) * hilada - hilada);
  const s = g.sub(x0, y0, 0, giro);
  s.caja(L / 2, 0, 0, L, T, z0, { mat });
  for (let fila = 0, z = z0; z < 200; fila++, z += hilada) {
    let u = -(fila % 2) * 4.5, algo = false;
    while (u < L) {
      const l = Math.min(L - Math.max(u, 0), 6.5 + a.r() * 6), c = Math.max(u, 0) + l / 2;
      if (l > 2 && alto(c / L) > z + hilada * 0.45) { bloque(s, c, (a.r() - 0.5) * 0.5, z, l - 0.35, T + (a.r() - 0.5) * 0.5, hilada - 0.3, { mat, b: 0.9, j: 0.7, tono: (a.r() - 0.5) * 0.1 }); algo = true; }
      u += l;
    }
    if (!algo) break;
  }
}
/** Contrafuerte escalonado contra una cara (sale hacia +y del grupo), con el talud de cada cuerpo. */
export function contrafuerte(g: G, x: number, w: number, d: number, H: number, mat: string) {
  for (const [k, f0, f1] of [[1, 0, 0.42], [0.72, 0.42, 0.74], [0.48, 0.74, 1]] as [number, number, number][]) {
    const dd = d * k, z0 = H * f0, z1 = H * f1;
    g.caja(x, dd / 2 - 0.5, z0, w, dd + 1, z1 - z0, { mat });
    g.poli([[x - w / 2 - 0.3, -0.5, z1], [x + w / 2 + 0.3, -0.5, z1], [x - w / 2 - 0.3, dd + 0.6, z1], [x + w / 2 + 0.3, dd + 0.6, z1], [x - w / 2 - 0.3, -0.5, z1 + dd * 0.55], [x + w / 2 + 0.3, -0.5, z1 + dd * 0.55]], { mat: 'abo_labra', tono: 0.05 });
  }
}
/** Campana tumbada: perfil de verdad (hombro, cintura, falda que se abre, labio grueso) girado alrededor de `e`. */
export function campana(g: G, c: V3, e: V3, R: number, mat: string) {
  // perfil (radio, largo) desde la corona hacia la boca
  const perfil: [number, number][] = [[0.55, 0], [0.82, 0.08], [0.86, 0.22], [0.8, 0.42], [0.84, 0.6], [0.98, 0.8], [1.12, 0.94], [1.15, 1.0]];
  const L = R * 1.55, P = (t: number): V3 => [c[0] + e[0] * t * L, c[1] + e[1] * t * L, c[2] + e[2] * t * L];
  for (let i = 0; i < perfil.length - 1; i++) { const [r0, t0] = perfil[i], [r1, t1] = perfil[i + 1]; const p = P(t0); g.cil(p[0], p[1], p[2], r0 * R, (t1 - t0) * L, { mat, r1: r1 * R, eje: e }); }
  g.elip(...P(0.01), R * 0.55, R * 0.55, R * 0.25, { mat });
  // el labio (anillo grueso) y las bandas en relieve
  for (const [t, k, h] of [[0.93, 1.19, 0.07], [0.62, 0.88, 0.03], [0.3, 0.88, 0.025], [0.2, 0.89, 0.03]] as [number, number, number][]) { const p = P(t); g.cil(p[0], p[1], p[2], R * k, L * h, { mat, eje: e, tono: 0.06 }); }
  // la boca: hueca y negra adentro
  { const p = P(0.35); g.cil(p[0], p[1], p[2], R * 0.6, L * 0.7, { mat: 'negro', r1: R * 1.08, eje: e }); }
  // las asas de la corona
  for (const s of [-1, 1]) { const p = P(-0.04); g.elip(p[0] + s * 1.2, p[1], p[2] + 1.6, 1.1, 2.2, 2.4, { mat, tono: -0.08 }); }
}

/** El campanario de Santa Oria en el camposanto: la torre partida en diagonal, el vano ojival a medio romper, la campana en
 * el suelo sobre el derrumbe, rajada, con el yugo partido y la soga. Hiedra, cuervos, una lápida que alcanzó a aplastar. */
export function campanario(a: Arma): Pieza[] {
  const ps: Pieza[] = [], g = new G(a, ps), S = 'abo_sillar_grueso', L = 'abo_labra';
  // el piso: tierra empapada y pasto que se arrima a la obra
  { const cs: Comp[] = [g.bu([-4, -2, -2.2], [38, 36, 3.4])]; for (let i = 0; i < 7; i++) { const t = a.r() * TAU, d = 14 + a.r() * 14; cs.push(g.bu([Math.cos(t) * d, Math.sin(t) * d, -1.6], [10 + a.r() * 8, 8 + a.r() * 6, 2.2])); } g.masa(cs, { mat: 'abo_barro', suave: 6, tono: 0.1 }); }
  g.elip(-12, -12, 0.2, 22, 22, 1.4, { mat: 'abo_barro' });
  // la torre: 26 x 26 en (-12,-12), muros de 4,5; se rompe en diagonal, alta atrás (-x -y) y baja adelante
  const X0 = -25, X1 = 1, Y0 = -25, Y1 = 1, T = 4.5;
  const altoEn = (x: number, y: number) => { const u = ((x - X0) + (y - Y0)) / ((X1 - X0) + (Y1 - Y0)); const b = u < 0.16 ? 78 - u * 50 : u < 0.5 ? 60 - (u - 0.16) * 20 : 50 - (u - 0.5) * 30; return b + (ruido(x * 0.35, y * 0.35, 4) - 0.5) * 12; };
  // zócalo ataludado
  g.poli([[X0 - 3, Y0 - 3, 0], [X1 + 3, Y0 - 3, 0], [X0 - 3, Y1 + 3, 0], [X1 + 3, Y1 + 3, 0], [X0 - 0.5, Y0 - 0.5, 7], [X1 + 0.5, Y0 - 0.5, 7], [X0 - 0.5, Y1 + 0.5, 7], [X1 + 0.5, Y1 + 0.5, 7]], { mat: L, tono: -0.05 });
  muroRoto(g, X0, Y0 + T / 2, X1, Y0 + T / 2, T, (t) => altoEn(X0 + t * (X1 - X0), Y0), S);
  muroRoto(g, X0 + T / 2, Y0, X0 + T / 2, Y1, T, (t) => altoEn(X0, Y0 + t * (Y1 - Y0)), S);
  muroRoto(g, X0, Y1 - T / 2, X1, Y1 - T / 2, T, (t) => altoEn(X0 + t * (X1 - X0), Y1), S);
  muroRoto(g, X1 - T / 2, Y0, X1 - T / 2, Y1, T, (t) => altoEn(X1, Y0 + t * (Y1 - Y0)), S);
  // cornisa de la primera planta (impostas) que sigue donde el muro sigue
  for (const [x, y, w, d] of [[(X0 + X1) / 2, Y1 + 0.6, X1 - X0 + 1.6, 2.2], [X1 + 0.6, (Y0 + Y1) / 2, 2.2, Y1 - Y0 + 1.6]] as [number, number, number, number][]) g.caja(x, y, 21, w, d, 2.2, { mat: L, tono: 0.06 });
  // el vano de las campanas en la cara +y (arriba a la izquierda, roto a la mitad) y el de la cara +x
  const fy = g.sub(-17, Y1, 0), fx = g.sub(X1, -17, 0, 90);
  fy.prisma(ojiva(8, 8, 0.85, 5, 27), -T - 1, 1, { mat: S, resta: true });
  fx.prisma(ojiva(7, 8, 0.85, 5, 27), -T - 1, 1, { mat: S, resta: true });
  for (const f of [fy, fx]) { const w = f === fy ? 8 : 7, arc = ojiva(w + 3, 8, 0.85, 5, 26).slice(2); for (let i = 0; i < arc.length - 1; i++) f.palo([arc[i][0], 0.7, arc[i][1]], [arc[i + 1][0], 0.7, arc[i + 1][1]], 0.9, { mat: L, tono: 0.07 }); f.caja(0, 0.6, 25.4, w + 3, 2.4, 1.6, { mat: L, tono: 0.05 }); }
  fx.prisma(ojiva(4, 6, 0.85, 4, 14), -T - 1, 1, { mat: S, resta: true });
  // la puerta ojival al pie (cara +y), con la hoja vencida hacia adentro
  const fp = g.sub(-6, Y1, 0);
  fp.prisma(ojiva(10, 13, 0.8, 5, 0), -T - 1.5, 1.5, { mat: S, resta: true });
  fp.prisma(ojiva(10, 13, 0.8, 5, 0), -T + 0.3, -T + 0.6, { mat: 'negro' });
  for (const s of [-1, 1]) fp.caja(s * 6.4, 0.6, 0, 2.2, 2.2, 14, { mat: L, tono: 0.05 });
  { const arc = ojiva(13.2, 13, 0.8, 5, 0).slice(2); for (let i = 0; i < arc.length - 1; i++) fp.palo([arc[i][0], 0.8, arc[i][1]], [arc[i + 1][0], 0.8, arc[i + 1][1]], 1.1, { mat: L, tono: 0.07 }); }
  { const h = fp.sub(-4, -1.2, 0, -28); h.caja(4.5, 0, 0, 9, 1.2, 15, { mat: 'abo_madera', tono: -0.05 }); for (const z of [3, 11]) h.caja(4.5, 0.7, z, 9.4, 0.5, 1, { mat: 'mu_hierro' }); }
  // por dentro: hueco oscuro, y las vigas del bastidor de las campanas que quedaron colgando
  g.caja(-12, -12, 8, X1 - X0 - 2 * T, Y1 - Y0 - 2 * T, 200, { mat: S, resta: true });
  g.caja(-12, -12, 7, X1 - X0 - 2 * T + 0.5, Y1 - Y0 - 2 * T + 0.5, 1.5, { mat: 'negro' });
  g.palo([-21, -21, 58], [-9, -12, 50], 1.5, { mat: 'abo_madera_quemada', tono: -0.1 });
  g.palo([-21, -9, 52], [-15, -14, 47], 1.3, { mat: 'abo_madera_quemada', tono: -0.1, r1: 0.6 });
  // contrafuertes en las esquinas de adelante, partidos con su muro
  contrafuerte(g.sub(X0 + 1, Y1, 0), 0, 6, 6, 52, L);
  contrafuerte(g.sub(X1, Y0 + 1, 0, -90), 0, 6, 6, 70, L);
  contrafuerte(g.sub(X1 - 3, Y1, 0), 0, 6, 5, 26, L);
  // hiedra que trepa por la cara +y y musgo en los escalones del corte
  hiedra(fy.sub(-6, 0.8, 0), [[-1, 0, 0], [0.5, 0, 9], [-1.5, 0, 18], [1, 0, 27], [-0.5, 0, 35], [2, 0, 41]], 4, 'abo_hiedra');
  hiedra(fx.sub(8, 0.8, 0), [[0, 0, 0], [1.5, 0, 8], [0, 0, 15], [2.5, 0, 21]], 4, 'abo_hiedra');
  for (let i = 0; i < 10; i++) { const t = a.r(), x = X0 + 2 + t * (X1 - X0 - 4), y = a.r() < 0.5 ? Y0 + 2 : Y1 - 2, z = altoEn(x, y) - 3.5; for (let k = 0; k < 3; k++) g.elip(x + (a.r() - 0.5) * 3, y + (a.r() - 0.5) * 2, z + a.r(), 1 + a.r() * 0.8, 1 + a.r() * 0.8, 0.9, { mat: 'abo_musgo', tono: (a.r() - 0.5) * 0.1 }); }
  // el derrumbe: lo que cayó de la torre se fue hacia adelante a la derecha, en talud de cascote y sillares
  { const cs: Comp[] = []; for (let i = 0; i < 9; i++) { const t = i / 8; cs.push(g.bu([4 + t * 26 + (a.r() - 0.5) * 6, 2 + t * 14 + (a.r() - 0.5) * 8, 4 - t * 2], [11 - t * 4, 9 - t * 3, 7 - t * 4])); } g.masa(cs, { mat: 'mu_tierra', suave: 4, tono: -0.05 }); }
  cascotes(g, 26, 14, 10, L, 18, 8, 2.8);
  for (let i = 0; i < 12; i++) { const t = a.r(); bloque(g, 4 + t * 30 + (a.r() - 0.5) * 8, 2 + t * 16 + (a.r() - 0.5) * 10, (1 - t) * 6, 6 + a.r() * 5, 4.5 + a.r() * 2, 5 + a.r() * 2, { mat: S, giro: a.r() * 90, incl: (a.r() - 0.5) * 40, inclEje: a.r() < 0.5 ? 'x' : 'y', j: 0.9 }); }
  // un paño de muro que cayó entero, de canto, con sus hiladas todavía trabadas
  { const p = g.sub(16, -12, 0, 62, 24, 'x'); for (let f = 0; f < 3; f++) for (let k = 0; k < 2; k++) bloque(p, (f % 2) * 4 + k * 9 - 4, 0, f * 6.3, 8.6, 4.5, 6, { mat: S, j: 0.6 }); }
  // el pináculo que coronaba la esquina, tirado delante
  { const p = g.sub(-30, 14, 2.6, 25, 82, 'y'); p.caja(0, 0, 0, 5, 5, 8, { mat: L }); p.poli([[-2.6, -2.6, 8], [2.6, -2.6, 8], [-2.6, 2.6, 8], [2.6, 2.6, 8], [0, 0, 20]], { mat: L, tono: 0.04 }); }
  // la campana de Santa Oria: tumbada sobre el derrumbe, la boca hacia el camino y rajada desde el labio
  const E0: V3 = [0.78, 0.5, -0.18], el = Math.hypot(...E0), e: V3 = [E0[0] / el, E0[1] / el, E0[2] / el], c0: V3 = [10, 13, 11];
  campana(g, c0, e, 10, 'hit_bronce_verdin');
  { let p: V3 = mezV(c0, [c0[0] + e[0] * 15.5, c0[1] + e[1] * 15.5, c0[2] + e[2] * 15.5], 1); p = [p[0], p[1], p[2] + 10.5]; for (let k = 0; k < 6; k++) { const q: V3 = [p[0] - e[0] * 2.6 + (a.r() - 0.5) * 1.6, p[1] - e[1] * 2.6 + (a.r() - 0.5) * 1.6, p[2] - 1 - a.r() * 1.2]; g.palo(p, q, 0.55, { mat: 'negro' }); p = q; } }
  letras(g.sub(c0[0] + e[0] * 9, c0[1] + e[1] * 9, 0, 0), -3, 3, 9.2, c0[2] + 9, 1, 'hit_bronce_verdin', 1.6, 0.8);
  // el yugo de roble partido, con los herrajes, y la soga enrollada que todavía va atada
  g.palo([c0[0] - 10, c0[1] - 3, 13], [c0[0] - 2, c0[1] + 1, 19], 2.2, { mat: 'abo_madera' });
  g.palo([c0[0] - 2, c0[1] + 1, 19], [c0[0] - 1, c0[1] + 0.5, 20.5], 1.7, { mat: 'abo_madera', r1: 0.4 });
  g.palo([c0[0] - 24, c0[1] + 6, 2], [c0[0] - 13, c0[1] + 1, 5], 2.2, { mat: 'abo_madera', tono: -0.05 });
  for (const t of [0.25, 0.7]) { const p = mezV([c0[0] - 10, c0[1] - 3, 13], [c0[0] - 2, c0[1] + 1, 19], t); g.cil(p[0], p[1], p[2], 2.6, 1, { mat: 'mu_hierro', eje: [0.8, 0.4, 0.6] }); }
  { let p: V3 = [c0[0] - 4, c0[1] + 2, 16]; for (let k = 0; k < 5; k++) { const q: V3 = [p[0] - 1 + a.r(), p[1] + 2.5, p[2] - 3]; g.palo(p, q, 0.75, { mat: 'cuerda', tono: -0.3 }); p = q; } for (let k = 0; k < 14; k++) { const t = (k / 14) * TAU * 1.8, R = 4.2 - k * 0.15; g.palo([p[0] + Math.cos(t) * R, p[1] + 3 + Math.sin(t) * R * 0.8, 0.6 + k * 0.08], [p[0] + Math.cos(t + 0.45) * R, p[1] + 3 + Math.sin(t + 0.45) * R * 0.8, 0.6 + k * 0.08], 0.75, { mat: 'cuerda', tono: -0.3 }); } }
  // la lápida que aplastó al caer: partida, con la cruz grabada
  { const l = g.sub(30, 24, 0, 30); bloque(l, 0, 0, 0, 9, 3, 7, { mat: 'abo_lapida', j: 0.6 }); bloque(l.sub(2, 4, 1, 20, 70, 'x'), 0, 0, 0, 9, 3, 7, { mat: 'abo_lapida', j: 0.6 }); }
  { const l = g.sub(-34, -2, 0, 70); bloque(l, 0, 0, 0, 7, 2.6, 13, { mat: 'abo_lapida', incl: -8, j: 0.6 }); l.caja(0, 1.4, 8, 1, 0.8, 4, { mat: 'negro' }); l.caja(0, 1.4, 9.8, 3, 0.8, 0.9, { mat: 'negro' }); }
  // matas y cardos al pie, y los cuervos arriba en el diente más alto y en la campana
  for (let i = 0; i < 9; i++) { const t = a.r() * TAU, d = 30 + a.r() * 10; mata(a, ps, Math.cos(t) * d - 4, Math.sin(t) * d - 2, 4 + Math.floor(a.r() * 3), 3 + a.r() * 4, 'ext_pasto'); }
  cuervo(g.sub(X0 + 3, Y0 + 3, altoEn(X0 + 3, Y0 + 3) + 1, 40).esc(0.9), 'posado');
  cuervo(g.sub(X0 + 9, Y1 - 2.5, altoEn(X0 + 9, Y1 - 2) + 0.5, 70).esc(0.85), 'grazna');
  cuervo(g.sub(c0[0] - 1, c0[1], c0[2] + 9.8, 200).esc(0.8), 'picotea');
  return ps;
}

/** Rama de masa que se tuerce: tramos de hueso de `p` hacia `d` (largo L), afinándose de r0 a r1; devuelve los puntos. */
export function ramaM(g: G, cs: Comp[], p: V3, d: V3, L: number, r0: number, r1: number, n: number, tor: number, cae = 0): V3[] {
  const a = g.a, pts: V3[] = [p]; let q = p, dir = d;
  for (let i = 1; i <= n; i++) {
    const t = i / n; dir = [dir[0] + (a.r() - 0.5) * tor, dir[1] + (a.r() - 0.5) * tor, dir[2] + (a.r() - 0.5) * tor * 0.6 - cae * t]; const l = Math.hypot(...dir); dir = [dir[0] / l, dir[1] / l, dir[2] / l];
    const nq: V3 = [q[0] + dir[0] * L / n, q[1] + dir[1] * L / n, q[2] + dir[2] * L / n];
    cs.push(g.hu(q, nq, r0 + (r1 - r0) * (t - 1 / n), r0 + (r1 - r0) * t)); pts.push(nq); q = nq;
  }
  return pts;
}
/** Soga con su lazo colgando de `t` (punto de la rama): cuerda, el nudo de vueltas y el lazo abierto. `corta` la deja deshilachada. */
export function soga(g: G, t: V3, largo: number, giro: number, corta = false) {
  const a = g.a, n: V3 = [t[0] + (a.r() - 0.5) * 1.2, t[1] + (a.r() - 0.5) * 1.2, t[2] - largo];
  g.palo([t[0], t[1], t[2] + 1.2], [t[0], t[1], t[2] - 0.8], 1.1, { mat: 'cuerda', tono: -0.3 });
  g.palo(t, n, 0.55, { mat: 'cuerda', tono: -0.25 });
  if (corta) { for (let k = 0; k < 4; k++) g.palo(n, [n[0] + (a.r() - 0.5) * 2, n[1] + (a.r() - 0.5) * 2, n[2] - 1.5 - a.r()], 0.25, { mat: 'cuerda', tono: -0.2 }); return; }
  g.cil(n[0], n[1], n[2] - 3, 1, 3.2, { mat: 'cuerda', r1: 0.85, tono: -0.3 });
  for (let k = 0; k < 4; k++) g.cil(n[0], n[1], n[2] - 2.9 + k * 0.8, 1.15, 0.5, { mat: 'cuerda', tono: -0.4 });
  const c = Math.cos(giro), s = Math.sin(giro), R = 3.6;
  for (let q = 0; q < 12; q++) { const g0 = (q / 12) * TAU, g1 = ((q + 1) / 12) * TAU; const P = (u: number): V3 => [n[0] + Math.sin(u) * R * 0.8 * c, n[1] + Math.sin(u) * R * 0.8 * s, n[2] - 3 - R + Math.cos(u) * R]; g.palo(P(g0), P(g1), 0.5, { mat: 'cuerda', tono: -0.3 }); }
}

/** El roble de las sogas del Bosque de los Ahorcados: tronco enorme y hueco con contrafuertes de raíz, ramas como brazos que
 * se abren sobre el camino, las sogas que esperan (una todavía con su muerto, una cortada), el banquillo pateado, el cerco
 * de piedras con los nombres raspados, velas y cintas de los que vienen a llorar, hojas muertas y cuervos. */
export function robleSogas(a: Arma): Escena {
  const ps: Pieza[] = [], g = new G(a, ps), C = 'abo_corteza';
  // el piso: tierra negra con hojarasca y musgo
  { const cs: Comp[] = [g.bu([0, 0, -2.4], [36, 33, 3.4])]; for (let i = 0; i < 6; i++) { const t = a.r() * TAU, d = 14 + a.r() * 12; cs.push(g.bu([Math.cos(t) * d, Math.sin(t) * d, -1.8], [9 + a.r() * 6, 8 + a.r() * 5, 2.2])); } g.masa(cs, { mat: 'abo_barro', suave: 6, tono: 0.12 }); }
  for (let i = 0; i < 60; i++) { const t = a.r() * TAU, d = Math.sqrt(a.r()) * 36; g.elip(Math.cos(t) * d, Math.sin(t) * d, 0.5, 1.3 + a.r() * 0.8, 0.8 + a.r() * 0.5, 0.35, { mat: a.r() < 0.6 ? 'hojas_otono' : 'abo_hiedra', giro: a.r() * 180, tono: (a.r() - 0.5) * 0.2 }); }
  // el tronco: base ancha que se abre en contrafuertes de raíz, fuste torcido y la copa partida en tres brazos
  const cs: Comp[] = [];
  const t0: V3 = [-6, -6, 0], t1: V3 = [-5, -7, 18], t2: V3 = [-7, -5, 34], t3: V3 = [-5, -7, 44];
  cs.push(g.hu([-6, -6, -2], t1, 14, 10.5), g.hu(t1, t2, 10.5, 10), g.hu(t2, t3, 10, 7), g.bu([-6, -6, 3], [18, 17, 7]));
  for (let i = 0; i < 4; i++) { const t = a.r() * TAU, z = 8 + a.r() * 28; cs.push(g.bu([t0[0] + Math.cos(t) * 10, t0[1] + Math.sin(t) * 10, z], [5 + a.r() * 3, 5 + a.r() * 3, 6 + a.r() * 4])); }
  for (let i = 0; i < 7; i++) { const t = (i / 7) * TAU + a.r() * 0.5, L = 22 + a.r() * 12; const m: V3 = [t0[0] + Math.cos(t) * L * 0.45, t0[1] + Math.sin(t) * L * 0.45, 3]; cs.push(g.hu([t0[0] + Math.cos(t) * 8, t0[1] + Math.sin(t) * 8, 12], m, 6.5, 4), g.hu(m, [t0[0] + Math.cos(t + 0.2) * L, t0[1] + Math.sin(t + 0.2) * L, -1.5], 4, 1.4)); }
  // los brazos: uno largo y casi horizontal hacia el camino (+x +y), donde cuelgan las sogas, y los otros arriba y atrás
  const brazoA = ramaM(g, cs, [-2, -8, 34], [0.85, -0.42, 0.42], 58, 6.8, 2, 6, 0.22, 0.14);
  const brazoB = ramaM(g, cs, [-9, -2, 36], [-0.45, 0.85, 0.42], 46, 6, 1.6, 5, 0.3, 0.14);
  const brazoC = ramaM(g, cs, t3, [0.15, -0.25, 1], 34, 6.5, 1.6, 4, 0.45);
  const brazoD = ramaM(g, cs, [-8, -9, 40], [-0.7, -0.55, 0.5], 40, 5.5, 1.4, 5, 0.4, 0.1);
  const brazoE = ramaM(g, cs, [-3, -3, 40], [0.45, 0.55, 0.65], 26, 4.5, 1.2, 3, 0.4);
  for (let i = 0; i < 9; i++) { const z = 4 + a.r() * 34, t = -2.2 + (a.r() - 0.5) * 1.6; cs.push(g.bu([-6 + Math.cos(t) * 10.5, -6 + Math.sin(t) * 10.5, z], [3 + a.r() * 2, 3 + a.r() * 2, 4 + a.r() * 3], { mat: 'abo_musgo', k: 0.8 })); }
  g.masa(cs, { mat: C, suave: 3.2 });
  // el hueco del tronco, mirando al camino: boca negra con el labio de corteza
  g.elip(2.6, 2.6, 14, 3.6, 3.4, 11, { mat: 'negro', giro: 45 });
  for (const s of [-1, 1]) g.elip(2.6 + s * 3.4 * 0.7, 2.6 - s * 3.4 * 0.7, 14, 2.4, 2.6, 11.5, { mat: C, giro: 45, tono: 0.05 });
  g.elip(3.2, 3.2, 3.8, 6.5, 4.5, 2.4, { mat: C, giro: 45, tono: 0.08 });
  // ramas finas y secas en la copa (de cada brazo salen varillas que se tuercen)
  for (const br of [brazoA, brazoB, brazoC, brazoD, brazoE]) for (let k = 1; k < br.length; k++) for (let j = 0; j < (k > 2 ? 3 : 1); j++) {
    const b = br[k], t = a.r() * TAU, q: V3 = [b[0] + Math.cos(t) * 10, b[1] + Math.sin(t) * 10, b[2] + 4 + a.r() * 9]; g.palo(b, q, 1.1, { mat: C, r1: 0.35 });
    g.palo(q, [q[0] + Math.cos(t + 0.8) * 5, q[1] + Math.sin(t + 0.8) * 5, q[2] + 2 + a.r() * 4], 0.4, { mat: C, r1: 0.15 });
  }
  // las sogas del brazo largo: tres vacías que esperan (una cortada) y un muerto que nadie bajó
  const en = (br: V3[], u: number): V3 => { const f = u * (br.length - 1), i = Math.min(br.length - 2, Math.floor(f)); const p = mezV(br[i], br[i + 1], f - i); return [p[0], p[1], p[2] - 2]; };
  soga(g, en(brazoA, 0.74), 12, 0.4);
  soga(g, en(brazoA, 0.93), 9, 1.1, true);
  soga(g, en(brazoB, 0.6), 17, 2.2);
  { const t = en(brazoA, 0.5), cu: V3 = [t[0] + 0.6, t[1] + 0.4, t[2] - 7.5]; g.palo(t, cu, 0.55, { mat: 'cuerda', tono: -0.25 });
    // (colgado baja la figura 21 sin escalar: la nuca de la figura chica queda a 21 - 23 s debajo del punto)
    muneco(a, ps, colgado([cu[0], cu[1], cu[2] + 21 - 23 * 0.52 + 0.4], 150), { ...ropaDe(a, 'campesino'), capucha: undefined, torso: 'ext_tela_sucia' }, { brazos: [176, 174], codos: [6, -4], piernas: [3, 6], rodillas: [6, 10], cabeza: 12, ladea: 38 }, { colgado: true, s: 0.52 }); }
  // el banquillo pateado bajo la primera soga
  { const p = en(brazoA, 0.5), b = g.sub(p[0] + 3, p[1] + 3, 0, 30, 82, 'x'); b.caja(0, 0, 0, 7, 4, 1.2, { mat: 'abo_madera', tono: -0.05 }); for (const [x, y] of [[-2.6, -1.4], [2.6, 1.4], [2.6, -1.4]]) b.palo([x, y, 0], [x * 1.1, y * 1.1, -5], 0.55, { mat: 'abo_madera' }); }
  // el cerco de piedras paradas con los nombres raspados (abierto hacia el camino)
  for (let i = 0; i < 13; i++) {
    const t = (i / 13) * TAU + 0.2; if (Math.abs(((t - Math.PI / 4 + TAU) % TAU) - Math.PI) > Math.PI - 0.55) continue;
    const x = -6 + Math.cos(t) * 33, y = -6 + Math.sin(t) * 30, h = 5 + a.r() * 5, s = g.sub(x, y, 0, (t * 180) / Math.PI + 90, (a.r() - 0.5) * 16, 'x');
    bloque(s, 0, 0, -0.5, 4.2 + a.r() * 1.6, 2.4, h, { mat: 'abo_lapida', j: 0.7, arriba: 0.8 });
    for (let k = 0; k < 3; k++) s.caja((a.r() - 0.5) * 2, 1.25, h * 0.35 + k * 1.3, 1.6 + a.r() * 1.4, 0.4, 0.45, { mat: 'negro', tono: 0.15 });
    if (a.r() < 0.3) s.elip(-0.6, 0.6, h * 0.3, 1.2, 0.5, 1.6, { mat: 'abo_musgo' });
  }
  // los que vienen a llorar: velas consumidas entre las raíces y cintas atadas a la soga cortada
  for (const [x, y] of [[8, 12], [11, 9], [6, 15], [14, 13]]) vela(g, x, y, 0, 1.6 + a.r() * 2.5, 0.75, 0, 8, a.r() * 8, a.r() < 0.6);
  { const p = en(brazoA, 0.93); for (let k = 0; k < 3; k++) g.palo([p[0], p[1], p[2] - 2 - k * 2], [p[0] + 1 + a.r(), p[1] + 1.5, p[2] - 5 - k * 2.5], 0.3, { mat: k % 2 ? 'tela_roja' : 'mu_mortaja' }); }
  for (let i = 0; i < 7; i++) { const t = a.r() * TAU, d = 20 + a.r() * 12; mata(a, ps, Math.cos(t) * d - 6, Math.sin(t) * d - 6, 4 + Math.floor(a.r() * 3), 3 + a.r() * 3, 'ext_pasto'); }
  cuervo(g.sub(brazoC[brazoC.length - 1][0], brazoC[brazoC.length - 1][1], brazoC[brazoC.length - 1][2] - 0.4, 120).esc(0.9), 'grazna');
  cuervo(g.sub(en(brazoA, 0.25)[0], en(brazoA, 0.25)[1], en(brazoA, 0.25)[2] + 4.6, 30).esc(0.85), 'posado');
  // (entrega 3, Rick: "el roble queda muy oscuro bajo la lluvia") la luz con intención: el farol que alguien colgó del brazo
  // que mira al camino para que los suyos no se queden a oscuras, con su cadena, la jaula de hierro, el vidrio ahumado y
  // la llama; y tres velas vivas en el labio del hueco, donde dejan las cintas. El resplandor tiñe el árbol y el juego le
  // da su luz (`fuenteDe`), que saca de la lluvia el tronco, las sogas y el muerto.
  const pf = en(brazoE, 0.85), fz = pf[2] - 12, F: V3 = [pf[0] + 0.4, pf[1] + 0.4, fz];
  cadena(g, [pf[0], pf[1], pf[2] + 1], [F[0], F[1], fz + 7.4], 0.3, 'mu_hierro', 0.55);
  g.cil(F[0], F[1], fz + 6, 2.6, 1.2, { mat: 'mu_hierro', r1: 0.6 }); g.cil(F[0], F[1], fz + 5.2, 2.7, 0.8, { mat: 'mu_hierro' });
  g.cil(F[0], F[1], fz, 2.4, 0.9, { mat: 'mu_hierro' }); g.cil(F[0], F[1], fz - 1, 1.2, 1.1, { mat: 'mu_hierro', r1: 2.2 });
  g.cil(F[0], F[1], fz + 0.8, 2.05, 4.4, { mat: 'luz_vela', tono: -0.05 });
  for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU + 0.4; g.palo([F[0] + Math.cos(t) * 2.3, F[1] + Math.sin(t) * 2.3, fz + 0.4], [F[0] + Math.cos(t) * 2.4, F[1] + Math.sin(t) * 2.4, fz + 5.6], 0.32, { mat: 'mu_hierro' }); }
  g.elip(F[0], F[1], fz + 2.8, 1.1, 1.1, 1.7, { mat: 'fuego', tono: 0.15 });
  for (const [x, y, h] of [[4.4, 6.4, 2.6], [6.2, 4.6, 1.8], [5.6, 6.8, 3.4]] as [number, number, number][]) vela(g, x, y, 5.8, h, 0.7, 0, 8, a.r() * 8, true);
  // (en unidades de la pieza ya agrandada 2,4 veces: el resplandor no pasa por la escala)
  return { piezas: ps, resplandor: { c: [F[0] * 2.4, F[1] * 2.4, (fz + 2.5) * 2.4], r: 46, color: '#ffb25c' } };
}

/** Palmera seca a escala `k`: tronco anillado que se curva, la copa de pencas muertas que cuelgan; `quebrada` la parte. */
export function palmaSeca(g: G, b: V3, H: number, curva: number, giro: number, k: number, quebrada = false) {
  const a = g.a, d: V3 = [Math.cos(giro), Math.sin(giro), 0], n = 6, cs: Comp[] = [g.bu([b[0], b[1], b[2] + 1.5 * k], [4.6 * k, 4.6 * k, 3 * k])];
  let p = b; const tope = quebrada ? 0.5 : 1;
  for (let i = 1; i <= n; i++) { const t = (i / n) * tope, q: V3 = [b[0] + d[0] * curva * t * t, b[1] + d[1] * curva * t * t, b[2] + H * t]; cs.push(g.hu(p, q, (3 - 1.1 * ((i - 1) / n)) * k, (3 - 1.1 * (i / n)) * k)); p = q; }
  g.masa(cs, { mat: 'des2_tronco_palma', suave: 1.2 * k });
  if (quebrada) { for (let i = 0; i < 5; i++) g.palo(p, [p[0] + (a.r() - 0.5) * 3 * k, p[1] + (a.r() - 0.5) * 3 * k, p[2] + (2 + a.r() * 4) * k], 0.9 * k, { mat: 'des2_tronco_palma', r1: 0.15 }); return p; }
  g.esf(p[0], p[1], p[2], 2.6 * k, { mat: 'des2_tronco_palma', tono: -0.08 });
  for (let j = 0; j < 9; j++) {
    const t = (j / 9) * TAU + a.r() * 0.5, L = (17 + a.r() * 7) * k; let q = p, e = 0.25 - a.r() * 0.3;
    for (let s = 0; s < 3; s++) {
      const l = L / 3, nq: V3 = [q[0] + Math.cos(t) * Math.cos(e) * l, q[1] + Math.sin(t) * Math.cos(e) * l, q[2] + Math.sin(e) * l], w0 = [1.2, 5, 3.6][s] * k, w1 = [5, 3.6, 0.5][s] * k, nx = -Math.sin(t), ny = Math.cos(t);
      g.poli([[q[0] + nx * w0 / 2, q[1] + ny * w0 / 2, q[2] - 0.5], [q[0] - nx * w0 / 2, q[1] - ny * w0 / 2, q[2] - 0.5], [nq[0] + nx * w1 / 2, nq[1] + ny * w1 / 2, nq[2] - 0.5], [nq[0] - nx * w1 / 2, nq[1] - ny * w1 / 2, nq[2] - 0.5], q, nq], { mat: 'des2_palma_seca', tono: (a.r() - 0.5) * 0.1 - s * 0.05 });
      q = nq; e -= 0.75;
    }
  }
  for (let j = 0; j < 8; j++) { const t = a.r() * TAU, q: V3 = [p[0] + Math.cos(t) * 2 * k, p[1] + Math.sin(t) * 2 * k, p[2] - 1]; g.palo(q, [q[0] + Math.cos(t) * 2 * k, q[1] + Math.sin(t) * 2 * k, q[2] - (10 + a.r() * 6) * k], 1 * k, { mat: 'des2_palma_seca', r1: 0.3, tono: -0.12 }); }
  return p;
}
/** Arena amontonada: masa de bultos alargados a lo largo del viento (giro en grados), con la cresta corrida a sotavento. */
export function duna(g: G, c: V3, L: number, W: number, H: number, giro: number, n = 4, mat = 'arena') {
  const a = g.a, cs: Comp[] = [], cg = Math.cos((giro * Math.PI) / 180), sg = Math.sin((giro * Math.PI) / 180);
  for (let i = 0; i < n; i++) { const u = (i / (n - 1) - 0.5) * L * 0.8, w = (a.r() - 0.5) * W * 0.3, h = H * (1 - Math.abs(u / L) * 1.1) * (0.8 + a.r() * 0.3); cs.push(g.bu([c[0] + u * cg - w * sg, c[1] + u * sg + w * cg, c[2] - h * 0.35], [L / n * 0.9 + W * 0.3, W * (0.5 + a.r() * 0.2), h], { giro: giro + (a.r() - 0.5) * 12 })); }
  g.masa(cs, { mat, suave: Math.min(W, L) * 0.35 });
}
/** Ánfora de barro: cuerpo, cuello, labio y asas; `rota` le saca medio cuerpo y deja los cascos al lado. */
export function anfora(g: G, x: number, y: number, k: number, tumbada: number, rota = false) {
  const a = g.a, s = g.sub(x, y, tumbada ? 3.2 * k : 0, a.r() * 360, tumbada, 'x');
  s.elip(0, 0, 5 * k, 3.4 * k, 3.4 * k, 5 * k, { mat: 'des2_barro' });
  s.cil(0, 0, 9 * k, 1.6 * k, 3 * k, { mat: 'des2_barro', r1: 1.3 * k }); s.cil(0, 0, 11.6 * k, 1.9 * k, 0.8 * k, { mat: 'des2_barro', tono: 0.06 });
  for (const q of [-1, 1]) s.palo([q * 1.5 * k, 0, 11 * k], [q * 3 * k, 0, 8 * k], 0.5 * k, { mat: 'des2_barro' });
  if (rota) { s.elip(2.6 * k, 1.6 * k, 6 * k, 3 * k, 2.6 * k, 4 * k, { mat: 'des2_barro', resta: true }); s.elip(2 * k, 1 * k, 5.5 * k, 2.4 * k, 2.2 * k, 3.4 * k, { mat: 'negro' }); for (let i = 0; i < 4; i++) bloque(g, x + 5 * k + (a.r() - 0.5) * 6 * k, y + 4 * k + (a.r() - 0.5) * 6 * k, 0, 2.6 * k, 2 * k, 0.6 * k, { mat: 'des2_barro', giro: a.r() * 90, incl: (a.r() - 0.5) * 50, j: 0.3 }); }
}

/** El pozo del Oasis Muerto: el brocal de sillares sobre un estrado de dos gradas, la cabria de piedra con la viga rajada, la
 * polea y la cadena que baja a nada, el abrevadero partido lleno de arena, el fondo del oasis en barro seco y rajado,
 * palmeras muertas (una tronchada, otra caída), ánforas rotas y las osamentas de los que llegaron tarde. */
export function pozoOasis(a: Arma): Pieza[] {
  const ps: Pieza[] = [], g = new G(a, ps), P = 'des2_piedra_pulida';
  // el suelo: arena que se arrima, y adelante el fondo del oasis hundido, barro seco en placas
  // (entrega 3, Rick: "el borde de arena se nota contra el piso") sin manto de arena debajo: el piso del juego llega hasta
  // la obra y solo la arena que el viento arrima contra las gradas, en lenguas bajas del material del piso (`arena`)
  for (let i = 0; i < 6; i++) { a.r(); a.r(); a.r(); a.r(); }
  disco(a, ps, 17, 18.5, -0.9, 19, 12.5, 1.5, 'hit_barro_seco', { giro: 40, ruido: 0.26, n: 32, tono: -0.06 });
  for (let i = 0; i < 7; i++) { const t = a.r() * TAU, d = 0.82 + a.r() * 0.25; g.elip(17 + Math.cos(t) * 19 * d * 0.8, 18.5 + Math.sin(t) * 12.5 * d, -0.3, 4 + a.r() * 4, 2.6 + a.r() * 2, 0.8, { mat: 'arena', giro: 40 + (a.r() - 0.5) * 60 }); }
  // el estrado: dos gradas de losas, la de abajo comida por la arena
  const C: V3 = [-8, -8, 0];
  for (const [r, z, h] of [[20, 0, 3.6], [16, 3.6, 3.4]] as [number, number, number][]) {
    const nl = r > 18 ? 16 : 12;
    for (let i = 0; i < nl; i++) { const t = (i / nl) * TAU, x = C[0] + Math.cos(t) * (r - 3), y = C[1] + Math.sin(t) * (r - 3); bloque(g.sub(x, y, 0, (t * 180) / Math.PI), 0, 0, z, 6.2, (TAU * (r - 3)) / nl + 0.6, h, { mat: P, j: 0.6, tono: (a.r() - 0.5) * 0.1 }); }
    g.cil(C[0], C[1], z, r - 5.5, h, { mat: P, tono: -0.04 });
  }
  for (const [x, y, gi] of [[C[0] - 21, C[1] + 4, 100], [C[0] + 3, C[1] - 21, 10], [C[0] + 14, C[1] + 16, 135]] as [number, number, number][]) duna(g, [x, y, 0], 16, 6, 3, gi, 3);
  // el brocal: dos hiladas de sillares curvos, la albardilla con las estrías que gastaron las sogas, y una piedra caída
  const R = 9, zb = 7;
  for (let f = 0; f < 2; f++) for (let i = 0; i < 10; i++) { const t = ((i + f * 0.5) / 10) * TAU; bloque(g.sub(C[0] + Math.cos(t) * R, C[1] + Math.sin(t) * R, 0, (t * 180) / Math.PI), 0, 0, zb + f * 4.4, 3.6, (TAU * R) / 10 - 0.3, 4.3, { mat: P, j: 0.5, tono: (a.r() - 0.5) * 0.1 }); }
  for (let i = 0; i < 10; i++) { if (i === 3) continue; const t = ((i + 0.25) / 10) * TAU; const s = g.sub(C[0] + Math.cos(t) * R, C[1] + Math.sin(t) * R, 0, (t * 180) / Math.PI); bloque(s, 0, 0, zb + 8.8, 4.6, (TAU * R) / 10 + 0.2, 2, { mat: P, j: 0.4, tono: 0.06 }); for (let k = 0; k < 2; k++) s.caja(1.8, (k - 0.5) * 2, zb + 10.4, 1.6, 0.35, 0.5, { mat: 'negro', tono: 0.1 }); }
  { const t = (3.25 / 10) * TAU; bloque(g, C[0] + Math.cos(t) * (R + 8), C[1] + Math.sin(t) * (R + 8), 7, 4.6, 5.4, 2, { mat: P, giro: 30, incl: 25, j: 0.4 }); }
  g.cil(C[0], C[1], zb - 4, R - 1.6, 13.4, { mat: 'negro' });
  g.cil(C[0], C[1], zb + 8, R - 1.7, 0.6, { mat: 'negro', tono: 0.05 });
  // la cabria: dos pilares de piedra con su remate, la viga de madera rajada, la polea y la cadena que baja
  for (const s of [-1, 1]) { const x = C[0] + s * (R + 2.4), y = C[1] - 1.5; bloque(g, x, y, zb, 4.6, 4.6, 26, { mat: P, j: 0.6, arriba: 0.86 }); bloque(g, x, y, zb + 26, 6, 6, 2.2, { mat: P, j: 0.4 });  }
  g.palo([C[0] - R - 4, C[1] - 1.5, zb + 29.6], [C[0] + R + 4, C[1] - 1.5, zb + 29.6], 1.8, { mat: 'madera_vieja' });
  g.palo([C[0] + 1, C[1] - 1.5, zb + 29.2], [C[0] + 6, C[1] - 1.2, zb + 31.4], 0.4, { mat: 'negro' });
  { const c: V3 = [C[0] - 1, C[1] - 1.5, zb + 26]; g.cil(c[0] - 1, c[1], c[2], 3.2, 2, { mat: 'madera_vieja', eje: [1, 0, 0], tono: -0.08 }); g.cil(c[0] - 1.6, c[1], c[2], 1, 3.2, { mat: 'mu_hierro', eje: [1, 0, 0] }); g.palo([c[0], c[1], c[2] + 3.2], [c[0], c[1], zb + 28], 0.5, { mat: 'mu_hierro' });
    cadena(g, [c[0] + 3.2, c[1], c[2]], [c[0] + 3.2, c[1] + 0.2, zb - 2], 0, 'mu_oxido', 0.75); cadena(g, [c[0] - 3.2, c[1], c[2]], [C[0] + R + 2, C[1] + 6, zb + 11], 3, 'mu_oxido', 0.75); }
  // el cubo, roto y volcado en la albardilla
  { const s = g.sub(C[0] + 6, C[1] + 7, zb + 13, 40, 80, 'x'); s.cil(0, 0, 0, 2.6, 4.8, { mat: 'madera_vieja', r1: 3.1 }); s.cil(0, 0, 0.6, 2, 4.6, { mat: 'negro', r1: 2.5 }); for (const z of [0.8, 3.8]) s.cil(0, 0, z, 2.75 + z * 0.1, 0.5, { mat: 'mu_hierro' }); }
  // el abrevadero de piedra, partido en dos y lleno de arena
  { const s = g.sub(C[0] + 24, C[1] - 4, 0, 90); s.caja(-7, 0, 0, 13, 7, 6, { mat: P, giro: 4 }); s.caja(7.5, 0.8, 0, 13, 7, 6, { mat: P, giro: -8, incl: 6 }); s.caja(-7, 0, 1.5, 11, 4.6, 6, { mat: P, resta: true, giro: 4 }); s.caja(7.5, 0.8, 1.5, 11, 4.6, 6, { mat: P, resta: true, giro: -8, incl: 6 }); s.elip(-7, 0, 4.4, 5.4, 2.2, 1.2, { mat: 'des2_arena' }); s.elip(7.5, 0.8, 4, 5.4, 2.2, 1.1, { mat: 'des2_arena' }); }
  // las palmeras que se secaron con el agua: una entera y muerta, una tronchada, una caída que cruza atrás
  palmaSeca(g, [-34, 6, 0], 58, 9, 0.3, 1);
  palmaSeca(g, [-20, -36, 0], 66, 12, 0.9, 1.05);
  { const cs: Comp[] = []; const b: V3 = [-30, -24, 3]; let p = b; for (let i = 1; i <= 5; i++) { const q: V3 = [b[0] + i * 7, b[1] - i * 2.2, 2.6 - i * 0.2]; cs.push(g.hu(p, q, 2.5 - i * 0.12, 2.4 - i * 0.12)); p = q; } g.masa(cs, { mat: 'des2_tronco_palma', suave: 1 }); }
  // la arena que el viento arrima contra el estrado y entre las palmas
  duna(g, [-28, -16, 0], 30, 12, 6, 70, 4); duna(g, [-26, 14, 0], 22, 9, 4, 110, 3); duna(g, [6, -30, 0], 22, 8, 3.6, 10, 3);
  // ánforas que nadie volvió a llenar, la osamenta de un camello y un odre reseco
  anfora(g, C[0] + 14, C[1] + 12, 1, 0); anfora(g, C[0] + 18, C[1] + 9, 0.9, 80, true); anfora(g, C[0] - 4, C[1] + 20, 0.85, 75, true);
  { const s = g.sub(30, 4, 0, 200); for (let i = 0; i < 6; i++) { const x = -8 + i * 3.2; for (const q of [-1, 1]) s.palo([x, 0, 2.6], [x + 1, q * 5.4, 5.6 - i * 0.2], 0.55, { mat: 'mu_hueso', r1: 0.4, tono: -0.3 }); } s.palo([-12, 0, 2.4], [12, 0, 1.6], 0.9, { mat: 'mu_hueso', tono: -0.3 }); duna(s, [-4, -4, 0], 18, 7, 3, 0, 3); calavera(s.sub(16, 1, 0, 20).esc(1.2), 3, 'mu_hueso', true, -0.3); }
  { const s = g.sub(C[0] + 2, C[1] + 22, 1.6, 30); s.elip(0, 0, 0, 4, 2.6, 1.6, { mat: 'ext_cuero_seco' }); s.palo([3.6, 0, 0.4], [6, 0.4, 0.8], 0.7, { mat: 'ext_cuero_seco', r1: 0.4 }); }
  
  return ps;
}

/** El obelisco del sol de las Ruinas: el estrado de tres gradas con la arena arrimada, el muñón de la aguja con su jeroglífico
 * y el sol de bronce todavía clavado (le falta un rayo), la aguja caída en dos tramos que la arena se va tragando, el
 * piramidión con su capa de oro gastada al final, y el que se llevó el rayo, que no llegó lejos. */
export function obeliscoSol(a: Arma): Pieza[] {
  const ps: Pieza[] = [], g = new G(a, ps), P = 'des2_piedra_pulida', J = 'des2_glifos';
  // (entrega 3, Rick: "el borde de arena se nota contra el piso") sin manto de arena debajo: el piso del juego llega hasta
  // la obra y solo la arena que el viento arrima contra las gradas, en lenguas bajas del material del piso (`arena`)
  for (let i = 0; i < 6; i++) { a.r(); a.r(); a.r(); a.r(); }
  const C: V3 = [-14, -12, 0];
  // el estrado: tres gradas de sillares, con esquinas desportilladas
  let z = 0;
  for (const [w, h] of [[32, 5.4], [25, 5], [19, 4.6]] as [number, number][]) {
    const n = Math.round(w / 6);
    for (const [ox, oy, lx, ly, gi] of [[0, -w / 2 + 2.5, w, 5, 0], [0, w / 2 - 2.5, w, 5, 0], [-w / 2 + 2.5, 0, 5, w - 10, 0], [w / 2 - 2.5, 0, 5, w - 10, 0]] as number[][]) {
      const largo = Math.max(lx, ly), k = Math.max(1, Math.round((largo / w) * n));
      for (let i = 0; i < k; i++) { const u = (i + 0.5) / k - 0.5, roto = a.r() < 0.08; bloque(g, C[0] + ox + (lx > ly ? u * lx : 0), C[1] + oy + (ly > lx ? u * ly : 0), z, lx > ly ? largo / k - 0.25 : 5, ly > lx ? largo / k - 0.25 : 5, roto ? h * 0.55 : h, { mat: P, b: 0.8, j: 0.35, tono: (a.r() - 0.5) * 0.08, giro: gi }); }
    }
    g.caja(C[0], C[1], z, w - 9, w - 9, h - 0.2, { mat: P, tono: -0.06 });
    z += h;
  }
  // el muñón de la aguja: tronco de pirámide con glifos, partido en bisel arriba
  const B = 7, T0 = z, H = 54, tp = 0.8;
  const sh = (x: number, y: number, zz: number): V3 => { const f = 1 - (1 - tp) * ((zz - T0) / H); return [C[0] + x * f, C[1] + y * f, zz]; };
  g.poli([sh(-B, -B, T0), sh(B, -B, T0), sh(-B, B, T0), sh(B, B, T0), sh(-B, -B, T0 + H), sh(B, -B, T0 + H), sh(-B, B, T0 + H), sh(B, B, T0 + H)], { mat: J });
  // la rotura: un bisel que baja hacia +x, con lajas y dientes
  g.poli([[C[0] - 12, C[1] - 12, T0 + H - 1], [C[0] + 12, C[1] - 12, T0 + H - 20], [C[0] - 12, C[1] + 12, T0 + H - 6], [C[0] + 12, C[1] + 12, T0 + H - 25], [C[0] - 12, C[1] - 12, T0 + H + 9], [C[0] + 12, C[1] - 12, T0 + H + 9], [C[0] - 12, C[1] + 12, T0 + H + 9], [C[0] + 12, C[1] + 12, T0 + H + 9]], { mat: P, resta: true });
  g.poli([[C[0] + 1, C[1] + 1, T0 + H - 30], [C[0] + 12, C[1] + 1, T0 + H - 30], [C[0] + 1, C[1] + 12, T0 + H - 30], [C[0] + 12, C[1] + 12, T0 + H - 30], [C[0] + 1, C[1] + 1, T0 + H], [C[0] + 12, C[1] + 1, T0 + H], [C[0] + 1, C[1] + 12, T0 + H], [C[0] + 12, C[1] + 12, T0 + H], [C[0] + 4, C[1] + 4, T0 + H - 36]], { mat: P, resta: true });
  for (let i = 0; i < 3; i++) { const x = -5 + a.r() * 3, y = -5 + a.r() * 4, zz = T0 + H - 1 - (x + 12) * 0.79 - (y + 12) * 0.21; bloque(g, C[0] + x, C[1] + y, zz - 1.2, 2 + a.r() * 1.5, 2 + a.r() * 1.5, 2 + a.r() * 2.5, { mat: J, giro: a.r() * 90, incl: (a.r() - 0.5) * 20, j: 0.5 }); }
  grieta(g.sub(C[0] - 2, C[1] + B * 0.9, 0), 0, 0.4, T0 + 22, T0 + 38, J);
  // el sol de bronce en la cara +y: disco con su ombligo, el aro grabado y doce rayos (falta uno), rajado
  const ys = C[1] + B * 0.9 + 0.6, zs = T0 + 20, xs = C[0];
  const sol = g.sub(xs, ys, zs, 0, -90, 'x');
  sol.cil(0, 0, 0, 6.4, 1.3, { mat: 'ahg_bronce_viejo' }); sol.cil(0, 0, 1.2, 2.4, 1.2, { mat: 'bt_oro_viejo', r1: 1.6 }); for (let i = 0; i < 5; i++) { const t = a.r() * TAU, r = 2.5 + a.r() * 3; sol.elip(Math.cos(t) * r, Math.sin(t) * r, 1.25, 1 + a.r(), 0.7 + a.r() * 0.6, 0.15, { mat: 'hit_bronce_verdin', giro: a.r() * 180 }); }
  for (let i = 0; i < 18; i++) { const t0 = (i / 18) * TAU, t1 = ((i + 1) / 18) * TAU; sol.palo([Math.cos(t0) * 4.6, Math.sin(t0) * 4.6, 1.4], [Math.cos(t1) * 4.6, Math.sin(t1) * 4.6, 1.4], 0.35, { mat: 'ahg_bronce_viejo', tono: 0.12 }); }
  for (let i = 0; i < 12; i++) { if (i === 4) continue; const t = (i / 12) * TAU + 0.13, L = i % 2 ? 9 : 11.5, w = 0.2; sol.poli([[Math.cos(t - w) * 6, Math.sin(t - w) * 6, 0.2], [Math.cos(t + w) * 6, Math.sin(t + w) * 6, 0.2], [Math.cos(t) * L, Math.sin(t) * L, 0.4], [Math.cos(t - w) * 6, Math.sin(t - w) * 6, 1.1], [Math.cos(t + w) * 6, Math.sin(t + w) * 6, 1.1], [Math.cos(t) * L, Math.sin(t) * L, 0.7]], { mat: i % 3 === 0 ? 'hit_bronce_verdin' : 'ahg_bronce_viejo', tono: (a.r() - 0.5) * 0.1 }); }
  { const t = (4 / 12) * TAU + 0.13; for (const q of [-1, 1]) sol.esf(Math.cos(t + q * 0.08) * 6.2, Math.sin(t + q * 0.08) * 6.2, 0.6, 0.45, { mat: 'mu_hierro' }); }
  sol.palo([-1, 0.5, 1.5], [4, -3, 1.5], 0.25, { mat: 'negro' });
  // la aguja caída: dos tramos tumbados hacia +x, el primero apoyado en la grada, el otro hundido; el piramidión al final
  const tramo = (x0: number, y0: number, z0: number, L: number, r0: number, r1: number, giro: number, incl: number) => {
    const s = g.sub(x0, y0, z0, giro, incl, 'y'); s.poli([[0, -r0, -r0], [0, r0, -r0], [0, -r0, r0], [0, r0, r0], [L, -r1, -r1], [L, r1, -r1], [L, -r1, r1], [L, r1, r1]], { mat: J, tono: (a.r() - 0.5) * 0.06 });
    for (let i = 0; i < 3; i++) bloque(s, L + 0.5, (a.r() - 0.5) * r1, (a.r() - 0.5) * r1 - r1 * 0.3, 1.6 + a.r(), 2 + a.r() * 2, 2 + a.r() * 2, { mat: J, giro: a.r() * 90, j: 0.5 });
    return s;
  };
  tramo(C[0] + 13, C[1] + 3, 11, 22, 5.4, 4.8, 24, -18);
  tramo(C[0] + 36, C[1] + 14, 2.4, 20, 4.8, 4.2, 30, 4);
  { const s = g.sub(C[0] + 58, C[1] + 26, 2.4, 40, 70, 'y'); s.poli([[-4, -4, 0], [4, -4, 0], [-4, 4, 0], [4, 4, 0], [0, 0, 7]], { mat: J }); s.poli([[-2.4, -2.4, 2.8], [2.4, -2.4, 2.8], [-2.4, 2.4, 2.8], [2.4, 2.4, 2.8], [0, 0, 7.2]], { mat: 'bt_oro_viejo' }); }
  // la arena: dunas que se arriman al estrado por el lado del viento y se tragan los tramos caídos
  duna(g, [C[0] - 20, C[1] + 2, 0], 36, 14, 19, 95, 5); duna(g, [C[0] - 2, C[1] - 22, 0], 32, 12, 16, 5, 4);
  duna(g, [C[0] + 44, C[1] + 22, 0], 22, 12, 8, 30, 4); duna(g, [C[0] + 30, C[1] + 6, 0], 16, 9, 6.5, 120, 3); duna(g, [C[0] + 50, C[1] + 34, 0], 14, 8, 5, 60, 3);
  // el que arrancó el rayo: un esqueleto medio enterrado con el rayo de bronce todavía en la mano
  { const s = g.sub(C[0] + 22, C[1] + 34, 0.4, -30); calavera(s.sub(-12, 0, -0.8, 160), 2.6, 'mu_hueso', false, -0.35); for (let i = 0; i < 4; i++) for (const q of [-1, 1]) s.palo([-6 + i * 2.2, 0, 1.6], [-5.4 + i * 2.2, q * 3.8, 0.8], 0.5, { mat: 'mu_hueso', tono: -0.35 }); s.palo([-9, 0, 1.4], [2, 0, 1], 0.7, { mat: 'mu_hueso', tono: -0.35 }); s.palo([-6, 3, 1], [3, 8, 0.8], 0.55, { mat: 'mu_hueso', tono: -0.35 });
    s.poli([[2, 7.4, 0.4], [3.6, 9, 0.4], [12, 12, 0.6], [2, 7.4, 1.1], [3.6, 9, 1.1], [12, 12, 0.9]], { mat: 'hit_bronce_verdin' }); duna(s, [-1, -4, 0], 16, 8, 3.4, 0, 3); }
  // ofrendas al pie del sol: cuencos y cáscaras de lámparas
  for (const [x, y] of [[C[0] - 3, C[1] + 16], [C[0] + 4, C[1] + 17]]) { g.cil(x, y, 0.2, 2.2, 1.4, { mat: 'des2_barro', r1: 2.6 }); g.cil(x, y, 0.8, 1.8, 1, { mat: 'negro', r1: 2.2 }); }
  return ps;
}
