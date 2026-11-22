import type { V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';
import { G, bloque, letras, grieta, cascotes } from '../kit_muerte';
import { duna, anfora } from './hitos_mayores';
import { registrarMonumento } from './monumentos_kit';
import { tronco, gola, aro, derrumbe } from './monumentos_kit2';
import './acto2';

/**
 * El Templo del Sol Caído (acto 2, Las Ruinas del Sol; su puerta baja a `a2_sol`). Canon: en el desierto de Sahrim cayó hace
 * mil años un pedazo de la primera brasa y los de aquí lo adoraron como su sol. El templo se hizo para mirarlo arriba, en su
 * aro de oro sobre el santuario escalonado. Un día el sol se soltó del aro y cayó: rompió las columnas del patio y quedó
 * clavado de canto en el piso, rajado, todavía tibio. Desde entonces el sacerdote (Hamun) reza hacia abajo y los soles tallados
 * del templo se volvieron a cavar con los rayos hacia el piso ("el altar mira hacia abajo").
 *
 * De lejos: el aro vacío en lo alto sobre sus cuernos de bronce, los dos pilonos con sus mástiles y el disco que asoma del
 * patio. De cerca: los colosos de pie con la cara rapada, los soles invertidos, la escalinata con arena y los rayos de oro
 * arrancados, el patio partido alrededor del sol.
 *
 * Marco común (monumentos_kit): x a lo ancho (±104), y a lo largo con la portada hacia +y; el santuario atrás (y < -76),
 * el patio con el sol al medio, los pilonos, los colosos y la escalinata adelante (y > 72).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Sillares grandes de arenisca dorada: hiladas desparejas, juntas comidas por el viento, la parte baja oscurecida por la
 *  arena que la lame y vetas horizontales de erosión (el viento del desierto talla en bandas). */
const sillarSol = (la: number, al: number) => (p: V3, n: V3) => {
  const ero = (ruido(p[0] * 0.03 + p[1] * 0.03, 2, p[2] * 0.11) - 0.5) * 0.28 - Math.max(0, 1 - p[2] / 34) * 0.16;
  if (Math.abs(n[2]) > 0.7) return (ruido(p[0] * 0.08, p[1] * 0.08, 1) - 0.5) * 0.22 + 0.04;
  const fila = Math.floor(p[2] / al + (ruido(p[0] * 0.01, p[1] * 0.01, 5) - 0.5) * 0.3), u = (Math.abs(n[0]) > Math.abs(n[1]) ? p[1] : p[0]) + fila * la * 0.41;
  const z0 = fila * al, t = p[2] - z0, L = la * (0.75 + ruido(fila * 1.3, 3, 1) * 0.6), b = Math.floor(u / L), r = u - b * L;
  if (t < 1.1 || r < 1.1) return -0.32 + ero * 0.5;
  return (ruido(b * 2.1, fila * 1.7, 9) - 0.5) * 0.18 + ero + (t > al - 2 ? 0.05 : 0);
};
M.mon_sol_piedra = { rampa: ['#1a1006', '#2f1f0c', '#4a3315', '#66471f', '#835c2a', '#a07337', '#ba8a47', '#cfa25d'], ruido: 0.16, escala: 0.16, patron: sillarSol(40, 18) };
M.mon_sol_liso = { rampa: ['#1a1006', '#2f1f0c', '#4a3315', '#66471f', '#835c2a', '#a07337', '#ba8a47', '#cfa25d'], ruido: 0.16, escala: 0.14, patron: (p, n) => (Math.abs(n[2]) > 0.7 ? 0.04 : 0) + (ruido(p[0] * 0.05 + p[1] * 0.05, 1, p[2] * 0.2) - 0.5) * 0.16 };
/** El sol: oro viejo, batido, con la pátina oscura en lo hondo. */
M.mon_sol_oro = { rampa: ['#241503', '#422807', '#64400c', '#8a5c14', '#b07c1e', '#d29e30', '#ecc252', '#fbe08a'], ruido: 0.12, escala: 0.25, brillo: 0.7, patron: (p) => (ruido(p[0] * 0.12, p[1] * 0.12, p[2] * 0.12) > 0.76 ? -0.12 : 0) + (ruido(p[0] * 0.6, p[1] * 0.6, p[2] * 0.6) - 0.5) * 0.12 };
/** Las grietas del sol caído y lo que todavía arde adentro: oro al rojo que late. */
M.mon_sol_brasa = { rampa: ['#3a1004', '#6e1e06', '#a8360a', '#d85a12', '#f48a24', '#ffbe4c', '#ffe490'], ruido: 0.35, escala: 0.3, emite: true };
/** La boca del templo: lo hondo con el resplandor dorado que sube de abajo. */
M.mon_sol_hondo = { rampa: ['#060302', '#0e0603', '#180a04', '#241006', '#341808', '#48220b'], ruido: 0.4, escala: 0.3, emite: true };
/** Pintura gastada de las golas y los frisos: el azul del cielo que adoraban y el rojo ocre. */
M.mon_sol_azul = { rampa: ['#070b16', '#0d162a', '#152340', '#1e3257', '#2a446e', '#385784'], ruido: 0.3, escala: 0.3, patron: (p) => (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3) > 0.6 ? -0.3 : 0) };
M.mon_sol_ocre = { rampa: ['#1d0904', '#331107', '#4c1a0b', '#68240f', '#843014', '#9c3d1c'], ruido: 0.3, escala: 0.3, patron: (p) => (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3) > 0.62 ? -0.3 : 0) };
const S = 'mon_sol_piedra', L = 'mon_sol_liso', O = 'mon_sol_oro', V = 'hit_bronce_verdin', AZ = 'mon_sol_azul', OC = 'mon_sol_ocre';

/** Gola pintada: la del kit con bandas de azul, oro y ocre en el cavetto (lo poco que dejó el viento). */
function golaPintada(g: G, x: number, y: number, z: number, w: number, d: number, h: number, sale: number) {
  gola(g, x, y, z, w, d, h, sale, L, OC);
  const a = g.a, n = Math.round(w / 9);
  for (let i = 0; i < n; i++) if (a.r() < 0.7) { const u = -w / 2 + (i + 0.5) * (w / n); g.caja(x + u, y + d / 2 + sale * 0.55, z + h * 0.32, w / n * 0.7, 1.2, h * 0.45, { mat: i % 2 ? AZ : OC, tono: -0.05, incl: -32 }); }
}
/** Sol invertido en relieve hundido sobre una cara (+y del grupo): el disco y siete rayos que caen hacia el piso. */
function solAbajo(c: G, x: number, z: number, R: number, prof = 3) {
  c.cil(x, 0.8, z, R, prof + 0.8, { mat: S, resta: true, eje: [0, -1, 0] });
  c.cil(x, -prof - 0.2, z, R * 0.8, 1.4, { mat: O, eje: [0, 1, 0], tono: -0.1 });
  for (let i = 0; i < 7; i++) {
    const t = -Math.PI / 2 + (i - 3) * 0.3, L0 = R * 1.15, L1 = R * (i % 2 ? 2 : 2.6);
    c.palo([x + Math.cos(t) * L0, 0.8, z + Math.sin(t) * L0], [x + Math.cos(t) * L1, 0.8, z + Math.sin(t) * L1], 2.6, { mat: S, resta: true, r1: 0.9 });
  }
  // lo que fue antes: los rayos hacia arriba, raspados y más claros
  for (let i = 0; i < 5; i++) { const t = Math.PI / 2 + (i - 2) * 0.36; c.palo([x + Math.cos(t) * R * 1.15, -1.1, z + Math.sin(t) * R * 1.15], [x + Math.cos(t) * R * 1.75, -1.1, z + Math.sin(t) * R * 1.75], 1.4, { mat: 'a2_raspado', tono: -0.15 }); }
}
/** Mástil de cedro en su nicho del pilono, con los jirones de tela que quedan. */
function mastil(g: G, x: number, y: number, z0: number, H: number, k: number) {
  const a = g.a;
  g.palo([x, y, z0], [x, y, z0 + H], 3, { mat: 'madera_vieja', r1: 1.9 });
  for (const zz of [z0 + H * 0.3, z0 + H * 0.62]) g.cil(x, y, zz, 3.6, 3, { mat: 'mu_hierro' });
  for (let i = 0; i < 2 + (k % 2); i++) {
    const z1 = z0 + H - 5 - i * 11, Lj = 20 + a.r() * 18, cae = 16 + a.r() * 18, ox = k % 2 ? 1 : -1;
    g.poli([[x, y + 1, z1], [x, y + 1, z1 - 8], [x + ox * Lj * 0.5, y + 7, z1 - cae * 0.5], [x + ox * Lj * 0.42, y + 8, z1 - cae * 0.5 - 7], [x, y + 1.8, z1], [x, y + 1.8, z1 - 8], [x + ox * Lj * 0.5, y + 7.8, z1 - cae * 0.5], [x + ox * Lj * 0.42, y + 8.8, z1 - cae * 0.5 - 7]], { mat: i % 2 ? 'tela_roja' : 'des2_alfombra', tono: -0.12 });
  }
  g.cil(x, y, z0 + H, 2.2, 6, { mat: O, r1: 0.3 });
}
/**
 * Coloso de pie, momiforme, mirando a +y: tallado en planos (las estatuas de aquí son rígidas, de bloque): el fuste de las
 * piernas, el faldellín, el torso que se abre a los hombros, el collar de oro y azul, los brazos cruzados con el cayado y el
 * látigo, el paño de rayas que cae al pecho y la corona alta. Unidades de una persona de 75 (se agranda con `esc`). La cara,
 * rapada a plomo con las marcas del cincel.
 */
function coloso(g: G, rota: boolean) {
  const tr = (z0: number, z1: number, w0: number, d0: number, w1: number, d1: number, mat: string, y = 0, tono = 0) => tronco(g, 0, y, z0, z1, w0, d0, w1, d1, { mat, tono });
  bloque(g, 0, 2.5, 0, 13, 16, 4.4, { mat: L, b: 0.6, j: 0.2 });
  tr(4, 34, 12.4, 10, 14.6, 10.6, L);
  g.caja(0, 0, 18, 12.8, 0.4, 0.6, { mat: L, tono: -0.2 });
  tr(34, 40.5, 15.6, 11.6, 15.8, 11.6, O, 0, -0.15);
  tr(40.5, 60, 15, 10.4, 22, 11.4, L);
  // el collar ancho: un medio disco de oro y azul sobre el pecho
  g.caja(0, 0, 54, 24, 14, 6.6, { mat: L, resta: true });
  tr(53.4, 60.2, 21, 11, 22, 11.4, L);
  for (const [r, mat, dy] of [[11, O, 5.9], [8.6, AZ, 6.3], [6, O, 6.7]] as [number, string, number][]) g.poli([[-r, dy - 0.6, 60], [r, dy - 0.6, 60], [-r * 0.55, dy - 0.6, 60 - r * 0.55], [r * 0.55, dy - 0.6, 60 - r * 0.55], [-r, dy + 0.3, 60], [r, dy + 0.3, 60], [-r * 0.55, dy + 0.3, 60 - r * 0.55], [r * 0.55, dy + 0.3, 60 - r * 0.55]], { mat, tono: -0.06 });
  // los brazos cruzados y los puños con el cayado y el látigo
  for (const s of [-1, 1]) {
    g.palo([s * 10, 1, 58], [s * 9.4, 4.5, 46], 3.2, { mat: L, r1: 2.9 });
    g.palo([s * 9.4, 5.2, 45.6], [-s * 3.2, 7.2, 53], 2.8, { mat: L, r1: 2.5 });
    bloque(g, -s * 3.4, 7.8, 50.8, 5.2, 4.4, 5.6, { mat: L, b: 0.8, j: 0.2 });
  }
  g.palo([-3.4, 8.6, 50], [4.6, 9.4, 67], 0.9, { mat: O }); g.palo([4.6, 9.4, 67], [8, 9.4, 64.4], 0.9, { mat: O });
  g.palo([3.4, 8.6, 50], [-5, 9.4, 64], 0.9, { mat: O }); for (const k of [-1, 0, 1]) g.palo([-5, 9.4, 64], [-7.6 + k * 1.3, 9.8, 56.5], 0.55, { mat: O });
  // el cuello, la cabeza y el paño: la silueta de trapecio que se abre a los hombros, con sus aletas sobre el pecho
  g.cil(0, 0, 59.5, 3.6, 4, { mat: L });
  g.elip(0, 1.6, 66, 4.8, 5.2, 5.8, { mat: L });
  g.poli([[-6, -5, 73], [6, -5, 73], [-6, 2.5, 72.4], [6, 2.5, 72.4], [-10.5, -5.6, 60], [10.5, -5.6, 60], [-10, 1.6, 60.5], [10, 1.6, 60.5]], { mat: L, tono: 0.02 });
  for (const s of [-1, 1]) g.poli([[s * 5, 2.2, 69], [s * 8.4, 1.8, 69], [s * 5.2, 4.6, 56.5], [s * 9.4, 4, 56.5], [s * 5, 4.6, 69], [s * 8.4, 4.2, 69], [s * 5.2, 6.4, 56.5], [s * 9.4, 6, 56.5]], { mat: L });
  for (let k = 0; k < 4; k++) for (const s of [-1, 1]) g.caja(s * 7.2, 5.3 + k * 0.45, 58.4 + k * 2.8, 4.2, 1.2, 0.7, { mat: AZ, tono: -0.1 });
  g.poli([[-6.2, 2.3, 71.6], [6.2, 2.3, 71.6], [-6.2, 3.2, 71.6], [6.2, 3.2, 71.6], [-6.2, 2.3, 73.2], [6.2, 2.3, 73.2], [-6.2, 3.2, 73.2], [6.2, 3.2, 73.2]], { mat: O, tono: -0.1 });
  // la corona alta: el cuerpo en cono con su bulbo, y la cobra al frente
  g.cil(0, -1, 72.6, 5.2, 4, { mat: L, r1: 4.8 }); g.cil(0, -1, 76.4, 4.6, 11, { mat: L, r1: 2.8 }); g.esf(0, -1, 88.2, 2.9, { mat: L });
  g.palo([0, 3.4, 73.6], [0, 4.4, 78], 0.9, { mat: O });
  g.palo([0, 5.6, 61.6], [0, 6.2, 56], 1.4, { mat: L, r1: 1 });
  // la cara rapada a plomo, con las marcas del cincel
  g.caja(0, 9.8, 60.5, 11, 6, 12, { mat: L, resta: true });
  for (let i = 0; i < 4; i++) g.caja(-3.2 + i * 2.2, 7, 62.5 + (i % 2) * 2.6, 1, 0.9, 3.8, { mat: L, resta: true, giro: 18 });
  letras(g.sub(0, 5.6, 0), -2.6, 2.6, 0, 30, 6, L, 4, 1.4);
  if (rota) { g.caja(10, 6, 44, 7, 12, 10, { mat: L, resta: true, giro: 20 }); g.poli([[2, -8, 80], [8, -8, 70], [2, 6, 80], [8, 6, 70], [2, -8, 95], [12, -8, 95], [2, 6, 95], [12, 6, 95]], { mat: L, resta: true }); }
}

function armar(g: G, _v: string, f: number) {
  const a = g.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  const brasa = { mat: 'mon_sol_brasa', tono: -0.2 + p * 0.32 };

  // ============================================================ ATRÁS: el santuario escalonado y el aro vacío
  const YS = -150;
  // tres gradas en talud, con la escalera procesional que sube por el medio de la cara de adelante
  const gradas: [number, number, number, number][] = [[176, 108, 0, 84], [134, 84, 84, 154], [96, 62, 154, 214]];
  for (const [w, d, z0, z1] of gradas) {
    tronco(g, 0, YS, z0, z1, w, d, w - 10, d - 8, { mat: S });
    golaPintada(g, 0, YS, z1, w - 10, d - 8, 13, 3.4);
  }
  // la escalera: un plano inclinado de escalones entre dos rampas, de la grada de abajo a la cima
  for (let i = 0; i < 24; i++) { const t = i / 24, z = 4 + t * 206, y = YS + 66 - t * 34; g.caja(0, y, z - 4, 40, 7, 7.4, { mat: L, tono: -0.06 + (i % 2) * 0.03 }); }
  for (const s of [-1, 1]) g.poli([[s * 20, YS + 71, 0], [s * 29, YS + 71, 0], [s * 20, YS + 32, 214], [s * 29, YS + 32, 214], [s * 20, YS + 71, 16], [s * 29, YS + 71, 16], [s * 20, YS + 34, 222], [s * 29, YS + 34, 222]], { mat: L, tono: 0.05 });
  // las bandas de reyes con el sol en alto, raspados, en cada grada
  for (const [w, d, z0, z1] of gradas) { const c = g.sub(0, YS + d / 2 - (z1 - z0) * 0.04 - 1, 0); for (const sx of [-1, 1]) letras(c, sx * (w * 0.18) - 14, sx * (w * 0.18) + 14, 0.4, z0 + (z1 - z0) * 0.7, 3, S, 4, 1.8); }
  for (const s of [-1, 1]) solAbajo(g.sub(s * 52, YS + 52, 0), 0, 56, 11);
  // los cuernos de bronce que sostenían el sol y el aro, vacío y rajado (de frente a la cámara)
  const zc = 230, R = 62, ar = g.sub(0, YS + 2, 0, -45);
  ar.caja(0, 0, 214, 46, 30, 16, { mat: L }); ar.caja(0, 0, 228, 36, 24, 4, { mat: O, tono: -0.1 });
  for (const s of [-1, 1]) {
    let q: V3 = [s * 12, 0, zc];
    for (let i = 1; i <= 9; i++) { const t = i / 9, n: V3 = [s * (12 + Math.sin(t * 2.5) * 52), 0, zc + Math.sin(t * 1.45) * 72 + t * 36]; ar.palo(q, n, 7.4 - t * 4.6, { mat: V, r1: 7 - t * 4.6 }); q = n; }
    ar.esf(q[0], 0, q[2], 3, { mat: O });
  }
  const zo = zc + R + 10;
  aro(ar, 0, zo, R, 8, O, -Math.PI / 2 + 0.5, Math.PI * 1.5 - 0.5, 34, 0, -0.02);
  aro(ar, 0, zo, R - 10, 2.6, V, -Math.PI / 2 + 0.56, Math.PI * 1.5 - 0.56, 34, 1.5);
  aro(ar, 0, zo, R + 9, 2, O, -Math.PI / 2 + 0.6, Math.PI * 1.5 - 0.6, 34, -1, 0.1);
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * TAU + 0.09, dd = Math.abs(Math.atan2(Math.sin(t + Math.PI / 2), Math.cos(t + Math.PI / 2)));
    if (dd < 0.62) continue;
    const L0 = R + 8, L1 = R + (a.r() < 0.3 ? 14 : i % 2 ? 26 : 36);
    ar.poli([[Math.cos(t - 0.055) * L0, -2.4, zo + Math.sin(t - 0.055) * L0], [Math.cos(t + 0.055) * L0, -2.4, zo + Math.sin(t + 0.055) * L0], [Math.cos(t) * L1, -0.8, zo + Math.sin(t) * L1], [Math.cos(t - 0.055) * L0, 2.4, zo + Math.sin(t - 0.055) * L0], [Math.cos(t + 0.055) * L0, 2.4, zo + Math.sin(t + 0.055) * L0], [Math.cos(t) * L1, 0.8, zo + Math.sin(t) * L1]], { mat: O, tono: (a.r() - 0.5) * 0.14 });
  }
  for (const s of [-1, 1]) { const t = -Math.PI / 2 + s * 0.5; ar.esf(Math.cos(t) * R, 0, zo + Math.sin(t) * R, 9, { mat: O, tono: -0.12 }); ar.esf(Math.cos(t) * R + s * 2, 3, zo + Math.sin(t) * R - 4, 3.4, brasa); }
  for (const s of [-1, 1]) { const t = -Math.PI / 2 + s * 0.95; let q: V3 = [Math.cos(t) * R, 0, zo + Math.sin(t) * R]; for (let i = 0; i < 6; i++) { const n: V3 = [q[0] - s * 1.6, 0, q[2] - 8]; ar.palo(q, n, 1.5, { mat: 'mu_hierro', tono: (i % 2) * 0.1 }); q = n; } }
  // la arena que se come el santuario por detrás y por los lados
  duna(g, [-78, YS - 30, 0], 80, 40, 62, 25, 5); duna(g, [70, YS - 46, 0], 70, 30, 46, -15, 4); duna(g, [-96, YS + 40, 0], 40, 26, 34, 80, 4);

  // ============================================================ MEDIO: el patio partido con el sol clavado
  const YP0 = -76, YP1 = 60;
  // el piso del patio: losas, levantadas y partidas alrededor del sol
  const SX = 52, SY = -8;
  for (let y = YP0 + 6; y < YP1 - 4; y += 15) for (let x = -88; x < 98; x += 18) {
    const d = Math.hypot(x - SX, y - SY); if (d < 30 || a.r() < 0.08) continue;
    const lev = d < 70 ? (70 - d) / 40 : 0;
    bloque(g, x + (a.r() - 0.5) * 2, y, -1 + lev * 3, 17.4, 14.4, 2.4, { mat: L, b: 0.5, j: 0.4, tono: -0.08 + (a.r() - 0.5) * 0.08, incl: lev * 12 * (a.r() - 0.5), giro: lev * 10 * (a.r() - 0.5) });
  }
  // los muros del patio: el de la izquierda entero con su gola, el de la derecha (el que se ve) roto en escalones
  tronco(g, -96, (YP0 + YP1) / 2, 0, 150, 16, YP1 - YP0, 12, YP1 - YP0, { mat: S }); golaPintada(g, -96, (YP0 + YP1) / 2, 150, 12, YP1 - YP0, 10, 2.4);
  tronco(g, 97, (YP0 + YP1) / 2, 0, 104, 16, YP1 - YP0, 12, YP1 - YP0, { mat: S });
  // roto: la caída del sol se llevó el medio (una brecha en V hasta abajo) y el viento comió el resto en escalones
  g.poli([[80, -62, 110], [112, -62, 110], [80, 30, 110], [112, 30, 110], [80, -34, 10], [112, -34, 10], [80, 4, 6], [112, 4, 6]], { mat: S, resta: true });
  for (const [y0, y1, z] of [[-76, -64, 84], [36, 48, 76], [48, 60, 60]] as number[][]) g.caja(97, (y0 + y1) / 2, z, 30, y1 - y0, 60, { mat: S, resta: true });
  { const lado = g.sub(104, (YP0 + YP1) / 2, 0, -90); for (let i = 0; i < 5; i++) { lado.caja(-50 + i * 22, 0.4, 14, 7, 2, 34, { mat: S, resta: true }); lado.esf(-50 + i * 22, 0.2, 52, 4.4, { mat: S, resta: true }); } }
  derrumbe(g, 7, 104, -10, 6, 20, 10, S);
  // columnas de papiro: la hilera de la izquierda en pie con su arquitrabe; la de la derecha partida por el sol
  for (let k = 0; k < 4; k++) { const y = YP0 + 16 + k * 36; g.cil(-66, y, 0, 10, 126, { mat: 'mon_sol_liso', r1: 8.6 }); for (const zz of [30, 60, 90]) g.cil(-66, y, zz, 10.4, 2, { mat: k % 2 ? AZ : OC, r1: 10.2 }); g.cil(-66, y, 126, 8.6, 16, { mat: L, r1: 14 }); g.caja(-66, y, 142, 24, 24, 7, { mat: L }); }
  g.caja(-66, (YP0 + YP1) / 2 + 2, 149, 22, YP1 - YP0 - 10, 13, { mat: S, tono: 0.03 });
  for (const [x, y, h] of [[2, YP0 + 18, 150], [8, YP0 + 58, 60], [86, YP1 - 14, 90]] as number[][]) {
    g.cil(x, y, 0, 10, Math.min(h, 126), { mat: 'mon_sol_liso', r1: 8.6 });
    if (h >= 140) { g.cil(x, y, 126, 8.6, 16, { mat: L, r1: 14 }); g.caja(x, y, 142, 24, 24, 7, { mat: L }); }
    else { bloque(g, x, y, h - 2, 18, 18, 7, { mat: L, incl: 16, giro: 30, b: 1.6, j: 2 }); grieta(g.sub(x, y + 10, 0), 0, 0, h * 0.3, h - 4, L); }
  }
  // tambores de columna que rodaron
  for (const [x, y, gi] of [[18, 40, 20], [70, 26, 80], [-30, -40, -30]] as number[][]) g.sub(x, y, 9, gi).cil(-12, 0, 0, 9.4, 24, { mat: L, eje: [1, 0, 0], tono: -0.04 });
  // EL SOL: un disco de oro de casi tres hombres, clavado de canto en el patio, inclinado hacia la cámara, rajado al rojo
  const sol = g.sub(SX, SY, 66, -45, 16, 'x');
  const RS = 74;
  sol.cil(0, -8, 0, RS, 16, { mat: O, eje: [0, 1, 0] });
  sol.cil(0, 8, 0, RS - 6, 2, { mat: O, eje: [0, 1, 0], tono: 0.06 });
  sol.cil(0, 9.6, 0, 22, 4, { mat: V, eje: [0, 1, 0] }); sol.cil(0, 13.4, 0, 12, 2, { mat: O, eje: [0, 1, 0], tono: 0.1 });
  aro(sol.sub(0, 10, 0, 0, -90, 'x'), 0, 0, 46, 1.8, V, 0, TAU, 30); aro(sol.sub(0, 10, 0, 0, -90, 'x'), 0, 0, 30, 1.2, O, 0, TAU, 24, 0, 0.12);
  for (let i = 0; i < 14; i++) { const t = (i / 14) * TAU + 0.2; if (i === 3 || i === 9 || i === 10) continue; const Lr = i % 2 ? 98 : 112; sol.poli([[Math.cos(t - 0.08) * (RS - 2), -5, Math.sin(t - 0.08) * (RS - 2)], [Math.cos(t + 0.08) * (RS - 2), -5, Math.sin(t + 0.08) * (RS - 2)], [Math.cos(t) * Lr, -1, Math.sin(t) * Lr], [Math.cos(t - 0.08) * (RS - 2), 5, Math.sin(t - 0.08) * (RS - 2)], [Math.cos(t + 0.08) * (RS - 2), 5, Math.sin(t + 0.08) * (RS - 2)], [Math.cos(t) * Lr, 1, Math.sin(t) * Lr]], { mat: O, tono: (a.r() - 0.5) * 0.12 }); }
  // la grieta del medio, cavada y al rojo adentro, con sus ramas
  { let q: V3 = [-RS, 9, 22]; for (let i = 0; i < 10; i++) { const n: V3 = [q[0] + 15, 9, q[2] - 5 + (a.r() - 0.5) * 12]; sol.palo(q, n, 5, { mat: O, resta: true }); sol.palo([q[0], 5, q[2]], [n[0], 5, n[2]], 3.6, brasa); if (i % 3 === 1) { const r2: V3 = [n[0] + 5, 9, n[2] + 15 + a.r() * 8]; sol.palo(n, r2, 1.8, { mat: O, resta: true }); sol.palo([n[0], 6, n[2]], [r2[0], 6, r2[2]], 1.1, brasa); } q = n; } }
  // el cráter: losas hundidas, arena volada y el piso rajado al rojo alrededor del canto que entró
  for (let i = 0; i < 9; i++) { const t = (i / 9) * TAU, r = 30 + a.r() * 10; bloque(g, SX + Math.cos(t) * r, SY + Math.sin(t) * r, -2, 18, 13, 3, { mat: L, giro: (t * 180) / Math.PI + 90, incl: 22 + a.r() * 16, b: 0.6, j: 0.8, tono: -0.12 }); }
  for (let i = 0; i < 7; i++) { const t = (i / 7) * TAU + 0.3; g.palo([SX + Math.cos(t) * 18, SY + Math.sin(t) * 18, 0.3], [SX + Math.cos(t) * (44 + a.r() * 20), SY + Math.sin(t) * (44 + a.r() * 20), 0.3], 1.3, { ...brasa, tono: brasa.tono - 0.15 }); }
  // los rayos que se le soltaron, regados por el patio
  for (let i = 0; i < 5; i++) { const t = a.r() * 360; g.sub(SX - 40 + a.r() * 70, SY + 30 + a.r() * 30, 2, t).poli([[0, -4, 0], [0, 4, 0], [34 + a.r() * 10, 0, 0], [0, -4, 3], [0, 4, 3], [34, 0, 2]], { mat: O, tono: -0.15 - a.r() * 0.15 }); }
  // dos obeliscos chicos a los pies del santuario: uno en pie, el otro partido por la caída
  for (const s of [-1, 1]) {
    const x = s * 62, y = YP0 + 4, H = s > 0 ? 156 : 70;
    tronco(g, x, y, 0, 12, 22, 22, 20, 20, { mat: S });
    tronco(g, x, y, 12, 12 + H, 13, 13, s > 0 ? 7.6 : 10.4, s > 0 ? 7.6 : 10.4, { mat: 'des2_glifos' });
    if (s > 0) tronco(g, x, y, 12 + H, 12 + H + 12, 7.6, 7.6, 0.4, 0.4, { mat: O });
    else { g.sub(x - 4, y + 12, 3, 70, 82, 'y').poli([[0, -5, -5], [0, 5, -5], [0, -5, 5], [0, 5, 5], [70, -4, -4], [70, 4, -4], [70, -4, 4], [70, 4, 4]], { mat: 'des2_glifos' }); }
  }
  duna(g, [86, 10, 0], 52, 22, 26, 90, 4); duna(g, [20, YP1 - 6, 0], 40, 14, 9, 10, 3);

  // ============================================================ FRENTE: los pilonos, la portada, los colosos y la escalinata
  const YF0 = 58, YF1 = 112, HP = 270, HQ = 206;
  for (const s of [-1, 1]) {
    const xc = s * 67;
    tronco(g, xc, (YF0 + YF1) / 2, 0, HP, 74, YF1 - YF0, 62, YF1 - YF0 - 12, { mat: S }, -4, -s * 2);
    golaPintada(g, xc - s * 2, (YF0 + YF1) / 2 - 4, HP, 62, YF1 - YF0 - 12, 22, 5);
    const zf = (z: number) => YF1 - (z / HP) * 8;
    for (const nx of [-29, 29]) { g.caja(xc + nx, zf(150) - 1, 28, 7, 10, HP - 40, { mat: S, resta: true }); mastil(g, xc + nx, zf(150) - 5, 28, HP + 50, nx > 0 ? 1 : 0); }
    solAbajo(g.sub(xc, zf(236), 0), 0, 236, 15);
    letras(g.sub(xc, zf(180), 0), -20, 20, 0, 182, 3, S, 4, 1.8);
    grieta(g.sub(xc + s * 14, zf(120), 0), 0, 0.4, 60, 190, S);
    if (s > 0) letras(g.sub(xc + 31, (YF0 + YF1) / 2, 0, -90), -18, 18, 0.4, 230, 7, S, 4, 1.8);
  }
  // la portada entre los pilonos, más baja y un poco metida, con su disco alado partido
  tronco(g, 0, (YF0 + YF1) / 2 - 2, 0, HQ, 62, YF1 - YF0 - 4, 60, YF1 - YF0 - 8, { mat: S }, -2);
  golaPintada(g, 0, (YF0 + YF1) / 2 - 4, HQ, 60, YF1 - YF0 - 8, 18, 4);
  const pt = g.sub(0, YF1 - 5, 0);
  pt.caja(0, 1.5, 0, 46, 6, 148, { mat: S, resta: true });
  pt.caja(0, 0, 0, 36, 70, 130, { mat: S, resta: true });
  pt.caja(0, -68, 0, 36, 2, 130, { mat: 'mon_sol_hondo', tono: -0.1 });
  for (let i = 0; i < 7; i++) pt.caja(0, -4 - i * 9, -1 - i * 3.4, 36, 9, 4, { mat: L, tono: -0.2 - i * 0.05 });
  pt.caja(0, -36, -40, 36, 70, 30, { mat: 'mon_sol_hondo', tono: -0.2 });
  pt.caja(0, 1, 152, 58, 3, 28, { mat: L });
  for (const s of [-1, 1]) for (let k = 0; k < 4; k++) pt.poli([[s * 7, 2, 158 + k * 3.6], [s * (27 - k * 2), 2.8, 156 + k * 4.6], [s * 7, 3.8, 161 + k * 3.6], [s * (27 - k * 2), 4.4, 159 + k * 4.6]], { mat: k % 2 ? O : AZ, tono: -0.05 });
  pt.cil(0, 1, 168, 8, 4, { mat: O, eje: [0, 1, 0] }); pt.caja(0, 3.5, 161, 20, 8, 7.5, { mat: O, resta: true });
  for (const s of [-1, 1]) letras(pt.sub(s * 27, 1.6, 0), -3.5, 3.5, 0, 128, 11, S, 11, 2.2);
  // los colosos de pie contra los pilonos, sobre sus pedestales
  for (const s of [-1, 1]) {
    const x = s * 67, y = YF1 + 22;
    bloque(g, x, y, 0, 40, 40, 20, { mat: S, b: 1.6, j: 0.8, tono: -0.05 });
    golaPintada(g, x, y, 20, 38, 38, 6, 1.4);
    letras(g.sub(x, y + 20, 0), -14, 14, 0.4, 14, 2, S, 4, 1.6);
    coloso(g.sub(x, y - 6, 26).esc(2.45), s > 0);
    if (s > 0) { bloque(g, x + 30, y + 14, 0, 22, 14, 12, { mat: L, giro: 30, incl: 14, b: 2, j: 1.5 }); bloque(g, x + 26, y - 8, 0, 18, 18, 16, { mat: L, giro: 70, incl: 40, b: 2.4, j: 2 }); }
  }
  // la escalinata: tres gradas anchas con arena en las juntas y los rayos de oro que se cayeron
  for (let i = 0; i < 3; i++) { const y = YF1 + 30 - i * 10; for (let k = 0; k < 4; k++) bloque(g, -25.5 + k * 17, y, i * 4.4, 16.6, 10 + (2 - i) * 10, 4.6, { mat: L, b: 0.8, j: 0.5, tono: (a.r() - 0.5) * 0.1 - 0.04 }); }
  for (let i = 0; i < 3; i++) g.sub(-26 + i * 24 + a.r() * 6, YF1 + 30 + a.r() * 8, 5 + (i % 2) * 4, a.r() * 360).poli([[0, -3, 0], [0, 3, 0], [26 + a.r() * 8, 0, 0], [0, -3, 2], [0, 3, 2], [26, 0, 1.4]], { mat: O, tono: -0.12 - a.r() * 0.15 });
  duna(g, [-98, YF1 + 6, 0], 48, 24, 26, 70, 4); duna(g, [100, YF1 + 14, 0], 36, 18, 14, 110, 4);
  duna(g, [-36, YF1 + 34, 0], 26, 10, 5, 10, 3); duna(g, [38, YF1 + 36, 0], 20, 9, 4, 160, 3);
  for (const [x, y] of [[-96, 146], [96, 150]] as [number, number][]) anfora(g, x, y, 2.2, a.r() * 90, a.r() < 0.5);
  cascotes(g, 12, 26, 8, L, 0, YF1 + 32, 3);
  return {
    frente: { c: [0, YF1 + 10, 44] as V3, r: 74 + p * 14, color: '#ffa040' },
    medio: { c: [SX, SY, 80] as V3, r: 110 + p * 24, color: '#ff8a30' },
    atras: { c: [0, YS, 300] as V3, r: 60, color: '#ffc060' },
  };
}

registrarMonumento({ id: 'mon_sol', nombre: ['Templo del Sol Caído', 'Temple of the Fallen Sun'], tema: 'desierto', cuadros: 4, armar });
