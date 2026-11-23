import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, raiz as raizG, bajoTierra, bloque, letras, grieta, cascotes, calavera, llama, huesos } from '../kit_muerte';
import { ramaM } from './hitos_mayores';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { tronco, sillares, derrumbe } from './monumentos_kit2';
import './templo_selva';
import './selva2';
import './bordes';

/**
 * La pirámide de Yhuantl (acto 3, El Manglar Negro; su boca baja a `a3_templo1`, los Escalones Hundidos). Canon: a Yhuantl le
 * tocó el pedazo de la brasa hace una generación, cuando llegó en el barco de Ama, y los de la selva lo guardaron en la
 * pirámide que ya tenían, la de la llamada: seis gradas de talud y tablero, y arriba el santuario de la cresta calada con el
 * gran tambor. Lo de la selva suena a tambores. La boca del templo es la cabeza de la serpiente de plumas al pie de la
 * escalinata: se entra por las fauces, por la lengua, y los escalones bajan "más de lo que la tierra permite". El manglar se
 * la está comiendo: las raíces le abrazan las esquinas, una ceiba le crece del costado y el agua negra le llega a la grada.
 *
 * Mira a la cámara (monumentos_kit): una sola pieza de 20 x 20 con la puerta en su esquina de adelante (la boca de la
 * serpiente), y sueltos en la avenida las dos estelas con sus antorchas, el círculo de los tambores y la piedra de las
 * ofrendas (`mon_yh_estela`, `mon_yh_tambores`, `mon_yh_altar`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Caliza de la selva: bloques grandes, verde de humedad, con líquen claro y la mugre negra que baja de cada repisa. */
M.mon_yh_piedra = { rampa: ['#141410', '#24231c', '#37352a', '#4c4939', '#625e4a', '#78735c', '#8e886f', '#a49d83', '#b8b197', '#cbc4aa'], ruido: 0.2, escala: 0.2, patron: sillares(30, 14, { var: 0.3, manchas: 1.1, pie: 60 }) };
M.mon_yh_lisa = { rampa: ['#141410', '#24231c', '#37352a', '#4c4939', '#625e4a', '#78735c', '#8e886f', '#a49d83', '#bab39a'], ruido: 0.22, escala: 0.18, patron: (p) => (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.26 + (ruido(p[0] * 0.012, p[1] * 0.012, p[2] * 0.02) > 0.64 ? -0.14 : 0) };
/** Caliza roja (la de los tableros de abajo, de otra cantera) y la piedra negra de humo del santuario. */
M.mon_yh_roja = { rampa: ['#160806', '#2a100b', '#3f1a12', '#56251a', '#6c3223', '#82412e', '#97503a', '#a96149'], ruido: 0.22, escala: 0.2, patron: sillares(26, 12, { var: 0.28 }) };
M.mon_yh_humo = { rampa: ['#060606', '#0d0c0b', '#171513', '#221f1b', '#2e2a24', '#3a352d'], ruido: 0.3, escala: 0.2, patron: sillares(24, 12, { var: 0.3 }) };
/** La pintura vieja de los tableros: rojo de achiote y el azul maya que ya casi no se ve. */
M.mon_yh_rojo = { rampa: ['#2a0905', '#46110a', '#64190e', '#842313', '#a32e18', '#bd3f1f', '#d1552a'], ruido: 0.3, escala: 0.3, patron: (p) => (ruido(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) > 0.66 ? -0.3 : 0) };
M.mon_yh_azul = { rampa: ['#071a1e', '#0d2b31', '#143e46', '#1d535c', '#286a73', '#36828b', '#4a99a0'], ruido: 0.3, escala: 0.3, patron: (p) => (ruido(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) > 0.66 ? -0.3 : 0) };
/** Los ojos y la garganta de la serpiente: jade que alumbra; lo hondo de la boca. */
M.mon_yh_luz = { rampa: ['#062a18', '#0c4a2a', '#167044', '#2a9a62', '#58c88a', '#a4f0c0'], ruido: 0.3, escala: 0.3, emite: true };
M.mon_yh_hondo = { rampa: ['#010403', '#030a06', '#06120b', '#0a1b10', '#0f2717', '#174024'], ruido: 0.4, escala: 0.3, emite: true };
M.mon_yh_cabeza = { rampa: ['#090b08', '#12160f', '#1d2318', '#293122', '#36402d', '#444f39', '#535e46', '#636d54'], ruido: 0.24, escala: 0.22, patron: (p) => (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.3 + (ruido(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5) > 0.78 ? -0.16 : 0) };
const P = 'mon_yh_piedra', L = 'mon_yh_lisa', MU = 'templo_selva_musgo', J = 'templo_selva_jade', R = 'mon_yh_rojo', AZ = 'mon_yh_azul', LI = 'bor_liana', RJ = 'mon_yh_roja', HU = 'mon_yh_humo';

/** Musgo en una repisa: manchas chatas regadas por el borde de una grada (de x0 a x1 en y). */
function musgoRepisa(g: G, x0: number, x1: number, y: number, z: number, n: number) {
  const a = g.a; for (let i = 0; i < n; i++) g.elip(x0 + a.r() * (x1 - x0), y + (a.r() - 0.5) * 6, z + 0.2, 5 + a.r() * 8, 3 + a.r() * 3, 1.4, { mat: MU, giro: (a.r() - 0.5) * 30, tono: (a.r() - 0.5) * 0.12 });
}
/** Liana que cuelga de un punto, se mece y termina en hojas. */
function liana(g: G, p: V3, L: number) {
  const a = g.a; let q = p;
  for (let k = 0; k < 6 && q[2] > 2; k++) { const n: V3 = [q[0] + (a.r() - 0.5) * 4, q[1] + 1 + a.r() * 2, q[2] - L / 6]; g.palo(q, n, 1.1 - k * 0.1, { mat: LI }); if (k % 2) g.elip(n[0], n[1] + 1, n[2], 3, 2, 1.2, { mat: 'templo_selva_follaje', giro: a.r() * 180 }); q = n; }
}
/** Raíz de manglar en arco: sale de `p`, baja en curva al piso o al agua. */
function raizM(g: G, cs: Comp[], p: V3, dir: number, L: number, r: number) {
  const a = g.a, n = 6; let q = p;
  for (let i = 1; i <= n; i++) { const t = i / n, x = p[0] + Math.cos(dir) * L * t, y = p[1] + Math.sin(dir) * L * t, z = p[2] * (1 - t) * (1 - t * 0.3) + Math.sin(t * Math.PI) * L * 0.06 - (t > 0.9 ? 2 : 0); const nq: V3 = [x + (a.r() - 0.5) * 3, y + (a.r() - 0.5) * 3, z]; cs.push(g.hu(q, nq, r * (1 - t * 0.45), r * (1 - t * 0.55))); q = nq; }
}
/**
 * La boca de la serpiente: la portada en máscara (la cara del monstruo tallada en el frente de un bloque de piedra, como se
 * hacía aquí): la puerta es la boca, con los colmillos que cuelgan del labio, los dientes del umbral y la lengua bífida que sale
 * como una alfombra; arriba los ojos de jade con la ceja en voluta, las narices, las orejeras redondas a los lados y el
 * penacho de plumas que se abre detrás. `F` es el marco de la avenida; `u0` el frente de la máscara.
 */
function mascara(F: G, u0: number, brillo: { mat: string; tono: number }) {
  const a = F.a, c = F.sub(0, u0, 0), K = 'mon_yh_cabeza';
  // el bloque de la máscara, en talud apenas, con su marco
  tronco(c, 0, -26, 0, 168, 128, 52, 120, 46, { mat: P });
  c.caja(0, -1, 160, 128, 8, 12, { mat: L, tono: 0.06 });
  // la boca: el hueco hondo, lo negro de la garganta con el jade que sube del fondo y los escalones que bajan
  c.caja(0, 2, 8, 60, 40, 92, { mat: P, resta: true }); c.elip(0, 2, 100, 30, 20, 12, { mat: P, resta: true });
  c.caja(0, -36, 0, 60, 2, 110, { mat: 'negro' });
  for (let i = 0; i < 6; i++) c.caja(0, -8 - i * 5, 8 - i * 1.6, 56, 5.4, 2, { mat: L, tono: -0.22 - i * 0.05 });
  c.caja(0, -30, 0, 54, 10, 2, { mat: 'mon_yh_hondo', tono: 0.15 });
  // el labio de arriba con los dientes, los colmillos curvos de las comisuras, los dientes de abajo en el umbral
  c.caja(0, 2, 92, 72, 8, 10, { mat: K, tono: 0.06 });
  for (let i = 0; i < 6; i++) { const x = -22 + i * 8.8; c.palo([x, 5, 94], [x, 6, 82 - (i % 2) * 4], 2.4, { mat: 'mu_hueso', r1: 0.4, tono: -0.12 }); }
  for (const sx of [-1, 1]) { let q: V3 = [sx * 32, 4, 96]; for (let k = 1; k <= 5; k++) { const n: V3 = [sx * (32 - k * 1.4), 6 + k * 1.6, 96 - k * 14]; c.palo(q, n, 5 - k * 0.85, { mat: 'mu_hueso', r1: 5 - (k + 1) * 0.85, tono: -0.1 }); q = n; } }
  for (let i = 0; i < 7; i++) c.palo([-27 + i * 9, 4, 6], [-27 + i * 9, 5, 15 + (i % 2) * 3], 2, { mat: 'mu_hueso', r1: 0.3, tono: -0.15 });
  c.caja(0, 3, 0, 72, 8, 6, { mat: K, tono: 0.02 });
  // la lengua: sale de la boca y se parte en dos sobre el piso de la avenida
  c.poli([[-10, -20, 6.4], [10, -20, 6.4], [-10, 8, 6.4], [10, 8, 6.4], [-10, -20, 7.6], [10, -20, 7.6], [-10, 8, 2], [10, 8, 2]], { mat: R, tono: 0.04 });
  for (const sx of [-1, 1]) c.poli([[0, 8, 0.2], [sx * 8, 8, 0.2], [sx * 10, 14, 0.2], [sx * 14, 12, 0.2], [0, 8, 1.8], [sx * 8, 8, 1.8], [sx * 10, 14, 1], [sx * 14, 12, 1]], { mat: R, tono: -0.05 });
  // la nariz y las narices
  c.poli([[-14, 0, 112], [14, 0, 112], [-14, 0, 128], [14, 0, 128], [-10, 10, 114], [10, 10, 114], [-10, 7, 126], [10, 7, 126]], { mat: K });
  for (const sx of [-1, 1]) { c.elip(sx * 6, 9, 116, 3.4, 2.4, 3, { mat: 'negro' }); c.palo([sx * 3, 9, 112], [sx * 12, 7, 106], 1.2, { mat: K, resta: true }); }
  // los ojos de jade, grandes, con su rendija, bajo la ceja en voluta que vuela
  for (const sx of [-1, 1]) {
    const x = sx * 38;
    c.caja(x, 1.5, 116, 30, 8, 22, { mat: P, resta: true });
    c.elip(x, -1, 127, 13, 4, 9, brillo); c.elip(x, 3, 127, 1.6, 1.2, 7.4, { mat: 'negro' });
    c.poli([[x - 18, 0, 140], [x + 18, 0, 140], [x - 18, 8, 138], [x + 18, 8, 138], [x - 16, 0, 146], [x + 16, 0, 146], [x - 16, 8, 144], [x + 16, 8, 144]], { mat: K, tono: 0.05 });
    for (let k = 0; k < 9; k++) { const t = (k / 9) * Math.PI * 1.7, r0 = 9 - k * 0.8, r1 = 9 - (k + 1) * 0.8, cx0 = x + sx * 20; c.palo([cx0 + Math.cos(t) * r0, 2.6, 148 + Math.sin(t) * r0], [cx0 + Math.cos(t + 0.34) * r1, 2.6, 148 + Math.sin(t + 0.34) * r1], 1.6, { mat: P, resta: true }); }
    // las orejeras: discos con su ombligo de jade y la pluma colgando
    c.sub(sx * 54, 2, 96, 0, 90, 'x').cil(0, 0, 0, 10, 6, { mat: K }); c.sub(sx * 54, 8.4, 96, 0, 90, 'x').cil(0, 0, 0, 4, 1.6, { mat: J });
    c.palo([sx * 54, 6, 86], [sx * 55, 8, 62], 2.2, { mat: J, r1: 1 });
  }
  // las escamas talladas en el frente del bloque, los restos de rojo y azul, la grieta y el musgo
  for (let r2 = 0; r2 < 3; r2++) for (let k = -2; k <= 2; k++) { if (Math.abs(k) < 2 && r2 < 2) continue; const x = k * 20 + (r2 % 2) * 10, z = 30 + r2 * 26; c.palo([x - 8, 1, z], [x, 1, z - 5], 1.4, { mat: P, resta: true }); c.palo([x, 1, z - 5], [x + 8, 1, z], 1.4, { mat: P, resta: true }); }
  c.caja(-44, -0.2, 40, 24, 0.6, 14, { mat: R, tono: 0.05 }); c.caja(46, -0.2, 64, 20, 0.6, 12, { mat: AZ, tono: 0.05 });
  grieta(c.sub(48, 1, 0), 0, 0, 20, 90, P); musgoRepisa(c, -60, 60, -4, 168, 6);
  // el penacho: plumas de piedra anchas y curvas detrás de la máscara, en dos filas, abiertas en abanico
  for (let fila = 0; fila < 2; fila++) for (let i = 0; i < 9 - fila * 2; i++) {
    const t = -1.15 + (i + fila) * 0.29, r0 = 46 - fila * 10, cz = 150 + Math.cos(t) * 18;
    const p0: V3 = [Math.sin(t) * r0, -36 - fila * 6, cz], p1: V3 = [Math.sin(t) * (r0 + 32), -46 - fila * 6, cz + Math.cos(t) * 46 + 8], p2: V3 = [Math.sin(t) * (r0 + 42), -42 - fila * 6, cz + Math.cos(t) * 54 + 2];
    c.palo(p0, p1, 7 - fila, { mat: (i + fila) % 2 ? J : P, r1: 5 - fila, tono: -0.04 + (a.r() - 0.5) * 0.08 }); c.palo(p1, p2, 5 - fila, { mat: (i + fila) % 2 ? J : P, r1: 1.4, tono: -0.02 });
  }
}
/** Tambor de tronco con cuero y su zigzag de cuerdas (unidades del mundo). */
function tambor(g: G, x: number, y: number, z: number, r: number, h: number) {
  g.cil(x, y, z, r * 0.84, h, { mat: 'corteza', r1: r });
  g.cil(x, y, z + h * 0.25, r * 0.9, h * 0.14, { mat: R, r1: r * 0.94 }); g.cil(x, y, z + h * 0.62, r * 0.96, h * 0.1, { mat: AZ });
  g.cil(x, y, z + h, r * 1.04, 1.4, { mat: 'cuero', tono: -0.05 }); g.elip(x, y, z + h + 1.3, r * 0.98, r * 0.98, 0.8, { mat: 'cuero', tono: 0.08 });
  for (let i = 0; i < 12; i++) { const t = (i / 12) * TAU; g.palo([x + Math.cos(t) * r, y + Math.sin(t) * r, z + h], [x + Math.cos(t + 0.26) * r * 0.9, y + Math.sin(t + 0.26) * r * 0.9, z + h * 0.35], 0.4, { mat: 'cuerda' }); }
  g.elip(x + r * 0.2, y + r * 0.1, z + h + 1.6, r * 0.4, r * 0.3, 0.2, { mat: 'sangre', tono: -0.2 });
}
// ================================================================== la pirámide
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  const luz = { mat: 'mon_yh_luz', tono: -0.15 + p * 0.25 };
  // ------------------------------------------------------------ nueve gradas de talud y tablero: la masa sube hacia atrás
  // (la pirámide va atrás, la escalinata baja por la cara de adelante hasta la máscara, que es la puerta al pie)
  const UC = -110, D0 = 170, W0 = 210, N = 10, H = 34, PASO = 15;
  for (let i = 0; i < N; i++) {
    const d = D0 - i * PASO, w = W0 - i * PASO, z = i * H, zt = z + H * 0.52, mat = i < 2 ? RJ : P;
    // el talud: la cara inclinada de abajo, que se retira 7
    tronco(F, 0, UC, z, zt, w * 2, d * 2, w * 2 - 14, d * 2 - 14, { mat });
    // la sombra honda bajo el vuelo del tablero (la raya negra que marca cada grada de lejos)
    F.caja(0, UC, zt - 0.5, w * 2 - 12, d * 2 - 12, 3, { mat: HU, tono: -0.35 });
    // el tablero: el cajón de arriba que vuela 3 sobre el talud, con su marco y el panel pintado
    F.caja(0, UC, zt + 2.5, w * 2 - 8, d * 2 - 8, H - (zt - z) - 2.5, { mat, tono: 0.04 });
    F.caja(0, UC, z + H - 3, w * 2 - 6, d * 2 - 6, 3, { mat: L, tono: 0.1 });
    const yf = UC + d - 4;
    for (const sx of [-1, 1]) {
      const cx = sx * (w / 2 + 34), an = w - 76;
      F.caja(cx, yf + 1.2, zt + 6, an, 3, H - (zt - z) - 12, { mat, resta: true });
      F.caja(cx, yf - 0.8, zt + 6, an, 0.8, H - (zt - z) - 12, { mat: i % 3 === 2 ? AZ : R, tono: 0.08 });
      // la greca del panel: los escalones tallados de la serpiente que se repiten
      for (let k = 0; k < Math.floor(an / 18); k++) { const x = cx - an / 2 + 9 + k * 18; F.caja(x, yf - 0.6, zt + 10, 8, 1.4, 4, { mat: L, tono: 0.02 }); F.caja(x + 4, yf - 0.6, zt + 14, 4, 1.4, 4, { mat: L, tono: 0.02 }); }
    }
    // las cabezas de serpiente que asoman en las cuatro esquinas de cada tablero
    for (const sx of [-1, 1]) { const x = sx * (w - 8); F.elip(x, yf + 3, z + H * 0.76, 6, 5, 5, { mat: L, tono: 0.08 }); F.elip(x, yf + 7, z + H * 0.72, 2, 1.2, 1.4, { mat: 'negro' }); F.palo([x - 2, yf + 7, z + H * 0.66], [x - 2, yf + 8, z + H * 0.6], 0.6, { mat: 'mu_hueso' }); F.palo([x + 2, yf + 7, z + H * 0.66], [x + 2, yf + 8, z + H * 0.6], 0.6, { mat: 'mu_hueso' }); }
    // musgo solo en la repisa, algún chorreón de mugre y las lianas que cuelgan
    musgoRepisa(F, -w + 6, w - 6, UC + d - 5, z + H, 2 + (N - i));
    for (let k = 0; k < 3; k++) { const x = (a.r() < 0.5 ? -1 : 1) * (60 + a.r() * (w - 70)), L0 = 10 + a.r() * 14; F.poli([[x - 2.4, yf + 4.4, zt], [x + 2.4, yf + 4.4, zt], [x - 2.4, yf + 5, zt], [x + 2.4, yf + 5, zt], [x - 0.8, yf + 4.4 + L0 * 0.15, zt - L0], [x + 0.8, yf + 4.4 + L0 * 0.15, zt - L0], [x - 0.8, yf + 5, zt - L0], [x + 0.8, yf + 5, zt - L0]], { mat: HU, tono: -0.1 }); }
    if (i < N - 1 && i % 2 === 0) liana(F, [(a.r() < 0.5 ? -1 : 1) * (80 + a.r() * (w - 90)), UC + d - 3, z + H], 16 + a.r() * 18);
  }
  // la esquina de atrás a la izquierda que se vino abajo (la masa que rompe la arista de lejos)
  F.poli([[-W0 - 6, UC + 40, 40], [-W0 + 30, UC + 40, 40], [-W0 - 6, UC + D0 + 4, 40], [-W0 + 30, UC + D0 + 4, 40], [-W0 - 6, UC + D0 + 4, 110], [-W0 + 56, UC + 20, 110], [-W0 - 6, UC + 20, 110], [-W0 + 56, UC + D0 + 4, 110]], { mat: P, resta: true });
  derrumbe(F, 14, -W0 + 10, UC + D0 + 8, 26, 10, 14, P);
  // ------------------------------------------------------------ la escalinata axial: de la cima al pie, detrás de la máscara
  const ZT = N * H, UT = UC + D0 - (N - 1) * PASO - 4, UB = 186, AN = 146;
  const pend = (z: number) => UB - (z / ZT) * (UB - UT);
  F.poli([[-AN / 2, UT, ZT], [AN / 2, UT, ZT], [-AN / 2, UB, 0], [AN / 2, UB, 0], [-AN / 2, UT - 40, 0], [AN / 2, UT - 40, 0], [-AN / 2, UT - 40, ZT], [AN / 2, UT - 40, ZT]], { mat: P });
  const NE = 52;
  for (let i = 0; i < NE; i++) { const z = (i / NE) * ZT, u = pend(z); F.caja(0, u - 1.9, z, AN - 4, 7.4, ZT / NE + 0.3, { mat: L, tono: 0.08 + (i % 4 === 0 ? -0.06 : 0) }); F.caja(0, u + 1.6, z, AN - 4, 0.6, 1.4, { mat: HU, tono: -0.3 }); }
  for (let i = 0; i < 8; i++) { const z = (0.1 + a.r() * 0.8) * ZT, u = pend(z); F.elip((a.r() - 0.5) * (AN - 30), u + 1, z + 4, 3 + a.r() * 3, 2, 1, { mat: MU, giro: a.r() * 180 }); }
  // las alfardas: el cuerpo de la serpiente de plumas que baja a cada lado, con sus escamas pintadas, y la cabeza al pie
  for (const s of [-1, 1]) {
    const x0 = s * (AN / 2), x1 = s * (AN / 2 + 14);
    F.poli([[x0, UT, ZT + 10], [x1, UT, ZT + 10], [x0, UB + 6, 12], [x1, UB + 6, 12], [x0, UT - 6, ZT - 8], [x1, UT - 6, ZT - 8], [x0, UB, -2], [x1, UB, -2]], { mat: L, tono: 0.12 });
    for (let k = 0; k < 28; k++) { const z = 14 + (k / 28) * (ZT - 18), u = pend(z); F.caja(s * (AN / 2 + 7), u + 3, z + 8.6, 12, 2, 3, { mat: k % 3 === 0 ? J : R, tono: 0.1, incl: -56 }); }
    // la cabeza de serpiente al pie de la alfarda: fauces abiertas hacia la avenida, plumas en la nuca, ojo de jade
    const hx = s * (AN / 2 + 7), c = F.sub(hx, UB + 4, 0);
    c.caja(0, 0, 0, 22, 30, 12, { mat: L, tono: 0.08 });
    c.poli([[-12, -12, 12], [12, -12, 12], [-12, 18, 12], [12, 18, 12], [-10, -10, 34], [10, -10, 34], [-9, 20, 26], [9, 20, 26]], { mat: 'mon_yh_cabeza', tono: 0.12 });
    c.caja(0, 20, 18, 18, 6, 5, { mat: 'negro' }); for (let k = 0; k < 4; k++) c.palo([-6 + k * 4, 21, 24], [-6 + k * 4, 21.6, 19], 0.9, { mat: 'mu_hueso', r1: 0.2 });
    c.poli([[-11, 8, 12], [11, 8, 12], [-11, 22, 12], [11, 22, 12], [-10, 8, 17], [10, 8, 17], [-9, 24, 15], [9, 24, 15]], { mat: 'mon_yh_cabeza', tono: 0.04 });
    for (const ex of [-1, 1]) { c.elip(ex * 9.6, 8, 28, 2.4, 3.4, 2.6, { mat: 'mon_yh_luz', tono: 0.1 }); c.elip(ex * 10.8, 8, 28, 0.5, 0.8, 2, { mat: 'negro' }); }
    for (let k = 0; k < 5; k++) c.palo([-8 + k * 4, -8, 30], [-10 + k * 5, -16, 44], 2.2, { mat: k % 2 ? J : R, r1: 0.6, tono: 0.05 });
    c.poli([[-2, 22, 12.4], [2, 22, 12.4], [-2, 22, 13], [2, 22, 13], [-4, 34, 12.4], [4, 34, 12.4], [-4, 34, 13], [4, 34, 13]], { mat: R, tono: 0.1 });
  }
  // los braseros de las gradas, a los lados de la escalinata (se ven de lejos, de noche, subiendo)
  for (let i = 1; i < N - 1; i += 2) {
    const z = (i + 1) * H, u = UC + D0 - (i + 1) * PASO - 7;
    for (const s of [-1, 1]) { const x = s * (AN / 2 + 30); F.cil(x, u, z, 4.4, 9, { mat: 'mon_yh_humo', r1: 7.6 }); F.elip(x, u, z + 9, 6.6, 6.6, 1.4, { mat: 'ext_carbon' }); for (let k = 0; k < 3; k++) llama(F, x + (a.r() - 0.5) * 4, u + (a.r() - 0.5) * 4, z + 9, 3.4, 12 + a.r() * 5, f, 4, i * 3 + k); F.elip(x, u + 4, z + 0.3, 12, 8, 0.4, { mat: 'ext_carbon', tono: -0.2 }); }
  }
  // las ofrendas en los escalones: cuencos con sangre, calaveras, velas negras
  for (let i = 0; i < 16; i++) { const z = (0.04 + a.r() * 0.6) * ZT, u = pend(z), x = (a.r() - 0.5) * (AN - 30), zz = (Math.floor((z / ZT) * NE) + 1) * (ZT / NE) + 0.3; if (i % 3 === 0) calavera(F.sub(x, u - 4, zz, 90), 3.6, 'mu_hueso', true, -0.05); else if (i % 3 === 1) { F.cil(x, u - 4, zz, 3, 2, { mat: 'des2_barro', r1: 3.8 }); F.elip(x, u - 4, zz + 1.8, 2.8, 2.8, 0.6, { mat: 'sangre', tono: 0.05 }); } else { F.cil(x, u - 4, zz, 1.2, 6, { mat: 'cera', tono: -0.3 }); llama(F, x, u - 4, zz + 6, 0.9, 2.6, f, 4, i); } }
  // la sangre que bajó por el medio de la escalinata (de lejos, una raya oscura en lo claro)
  for (let i = 0; i < NE - 2; i += 1) { const z = (i / NE) * ZT, u = pend(z); F.caja(Math.sin(i * 0.7) * 3, u - 1.9, z + ZT / NE + 0.35, 8 - (i % 3), 6.6, 0.25, { mat: 'sangre', tono: -0.15 }); }
  // ------------------------------------------------------------ la cima: el santuario de humo, la cresta calada alta, el fuego
  const US = UC - 6;
  F.caja(0, US, ZT, 116, 70, 62, { mat: HU });
  for (const sx of [-1, 1]) F.caja(sx * 40, US + 32.4, ZT + 6, 14, 1.2, 46, { mat: R, tono: 0.05 });
  F.caja(0, US, ZT + 58, 112, 70, 4, { mat: L, tono: 0.12 }); F.caja(0, US, ZT + 62, 100, 60, 6, { mat: P, tono: 0.05 });
  // la puerta del santuario: tres vanos con el fuego de adentro
  for (const sx of [-1, 0, 1]) { F.caja(sx * 30, US + 30, ZT, 16, 14, 40, { mat: P, resta: true }); F.caja(sx * 30, US + 22, ZT, 16, 2, 40, { mat: 'fuego', tono: -0.1 }); llama(F, sx * 30, US + 26, ZT, 5, 22, f, 4, 7 + sx); }
  for (const sx of [-1, 1]) letras(F.sub(sx * 46, US + 32.6, 0), -3, 3, 0, ZT + 52, 6, HU, 4, 1.6);
  { const c = F.sub(0, US - 18, ZT + 68); tronco(c, 0, 0, 0, 86, 96, 12, 60, 8, { mat: P });
    for (let r2 = 0; r2 < 4; r2++) for (let k = 0; k < 5 - r2; k++) c.caja(-24 + k * 12 + r2 * 6, 0, 8 + r2 * 18, 7, 16, 11, { mat: P, resta: true });
    c.caja(0, 6.4, 40, 70, 0.8, 4, { mat: R, tono: 0.1 }); c.caja(0, 6.2, 62, 54, 0.8, 4, { mat: AZ, tono: 0.08 });
    for (const sx of [-1, 0, 1]) calavera(c.sub(sx * 22, 6, 80 - Math.abs(sx) * 10, 90), 5, L, true, 0.05); }
  tambor(F, -40, UT - 18, ZT, 16, 30); tambor(F, 44, UT - 14, ZT, 10, 18); tambor(F, 58, UT - 26, ZT, 7, 12);
  for (const sx of [-1, 1]) { const p0: V3 = [-42 + sx * 6, UT - 16, ZT + 33], p1: V3 = [-28 + sx * 10, UT - 6, ZT + 36]; F.palo(p0, p1, 1.2, { mat: 'mu_hueso', tono: -0.05 }); F.esf(p1[0], p1[1], p1[2], 2.4, { mat: 'cuero' }); }
  // los dos braseros grandes de la cima: el fuego que se ve desde todo el manglar
  for (const sx of [-1, 1]) { const x = sx * 34, u = UT - 2; F.cil(x, u, ZT, 6, 16, { mat: L, r1: 10, tono: 0.05 }); F.elip(x, u, ZT + 16, 9, 9, 1.6, { mat: 'ext_carbon' }); for (let k = 0; k < 4; k++) llama(F, x + (a.r() - 0.5) * 5, u + (a.r() - 0.5) * 5, ZT + 16, 4.4, 18 + a.r() * 6, f, 4, k + 20); }
  // ------------------------------------------------------------ la ceiba enorme que se le trepó a la esquina de la derecha
  {
    const cs: Comp[] = [], base: V3 = [112, -30, 4 * H];
    // las raíces bajan grada por grada hasta el piso, abrazando la esquina
    for (let i = 0; i < 9; i++) {
      const t = -0.9 + (i / 8) * 2.4, dx = Math.cos(t), dy = Math.sin(t); let q: V3 = [base[0] + dx * 12, base[1] + dy * 12, base[2] + 18];
      for (let k = 1; k <= 6; k++) { const v2 = q[0] + dx * 15 + (a.r() - 0.5) * 6, u2 = q[1] + dy * 15 + (a.r() - 0.5) * 6, nz = Math.max(1, base[2] + 14 - k * 30); const n: V3 = [v2, u2, nz]; cs.push(F.hu(q, n, 7 - k * 0.8, 6.4 - k * 0.8)); q = n; if (nz <= 1) break; }
    }
    for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU; cs.push(F.hu([base[0] + Math.cos(t) * 44, base[1] + Math.sin(t) * 44, base[2] + 1], [base[0] + Math.cos(t) * 8, base[1] + Math.sin(t) * 8, base[2] + 80], 8, 14)); }
    const tr = ramaM(F, cs, base, [0.05, -0.18, 1], 250, 32, 15, 7, 0.14);
    const copa = tr[tr.length - 1];
    for (let i = 0; i < 7; i++) { const t = (i / 7) * TAU + 0.3; ramaM(F, cs, tr[4 + (i % 3)], [Math.cos(t), Math.sin(t) * 0.8, 0.18], 110 + a.r() * 40, 11, 4, 4, 0.3, 0.1); }
    for (let i = 0; i < cs.length; i += 5) F.masa(cs.slice(Math.max(0, i - 1), i + 5), { mat: 'sel2_corteza', suave: 3 });
    for (let i = 0; i < 80; i++) { const lob = i % 6, t = lob * 1.05 + 0.4 + (a.r() - 0.5) * 0.9, d = 30 + Math.sqrt(a.r()) * 86 * (lob === 5 ? 0.3 : 1), rx = 13 + a.r() * 10; F.elip(copa[0] + Math.cos(t) * d, copa[1] + Math.sin(t) * d * 0.75, copa[2] + 6 - d * 0.12 + a.r() * 14, rx, rx * 0.85, rx * (0.55 + a.r() * 0.2), { mat: a.r() < 0.5 ? 'templo_selva_follaje' : 'sel2_follaje', giro: a.r() * 180, tono: (a.r() - 0.5) * 0.14 }); }
    for (let i = 0; i < 9; i++) liana(F, [copa[0] + (a.r() - 0.5) * 120, copa[1] + (a.r() - 0.2) * 60, copa[2] - 8], 60 + a.r() * 70);
  }
  // ------------------------------------------------------------ el pie: las raíces del manglar en la esquina de la izquierda
  { const cs: Comp[] = []; for (const [x, y, d0] of [[-W0 + 8, UC + D0 - 8, 1.9], [-W0 + 30, UC + D0 - 4, 1.6]] as number[][]) for (let k = 0; k < 2; k++) raizM(F, cs, [x, y, 30 + k * 16], d0 + (k - 0.5) * 0.5, 26 + k * 6, 5 - k * 0.8); F.masa(cs, { mat: 'sel2_corteza', suave: 1.6 }); }
  // ------------------------------------------------------------ la cabeza de la serpiente: la puerta
  mascara(F, 214, luz);
  for (let i = 0; i < 6; i++) { const x = (i < 3 ? -1 : 1) * (40 + (i % 3) * 7), u = 232 + (i % 2) * 4; F.cil(x, u, 0, 1.3, 5 + (i % 3) * 2, { mat: 'cera', tono: -0.4 }); llama(F, x, u, 5 + (i % 3) * 2, 0.9, 2.6, f, 4, i); }
  cascotes(F, 8, 30, 6, L, 0, 232, 3);
  grieta(F.sub(-110, -90 + 150 + 0.2, 0), 0, 0, 20, 60, P);
  void bloque; void huesos;
  return { der: { c: [0, 214, 60] as V3, r: 80 + p * 12, color: '#40ff90' }, izq: { c: [0, 214, 60] as V3, r: 60, color: '#40ff90' }, medio: { c: [0, -76, 380] as V3, r: 100 + p * 14, color: '#ff8a30' }, atras: { c: [0, -116, 400] as V3, r: 80 + p * 10, color: '#ff9a40' } };
}
registrarMonumento({
  id: 'mon_yhuantl', nombre: ['Pirámide de Yhuantl', 'Pyramid of Yhuantl'], tema: 'selva', cuadros: 1, piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }], puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== lo suelto de la avenida
/** Estela de la avenida con su antorcha: la piedra tallada con el guerrero jaguar y la máscara, el cuenco de fuego arriba. */
registrar({
  id: 'mon_yh_antorcha', nombre: ['Estela con antorcha de Yhuantl', 'Torch stela of Yhuantl'], tema: 'selva', variantes: ['izq', 'der'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (v, f, a) => {
    const { ps, g: g0 } = raizG(a), g = g0.sub(0, 0, 0, -45), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    bloque(g, 0, 0, 0, 34, 28, 12, { mat: RJ, b: 1.4, j: 0.6 });
    tronco(g, 0, 0, 12, 230, 26, 16, 20, 13, { mat: P });
    // el relieve: el guerrero jaguar de pie con su tocado de plumas, las columnas de glifos y, arriba, la cara del dios que mira la avenida
    const c = g.sub(0, 8, 0);
    c.caja(0, -0.6, 34, 12, 2.4, 70, { mat: P, resta: true }); c.elip(1, -0.6, 112, 6, 1.4, 8, { mat: P, resta: true }); for (let k = 0; k < 6; k++) c.palo([0, -0.4, 120], [-8 + k * 3.2, -0.4, 138], 1, { mat: P, resta: true });
    c.caja(0, -1.6, 70, 12, 0.6, 26, { mat: R, tono: -0.15 }); c.caja(0, -1.6, 48, 12, 0.6, 10, { mat: AZ, tono: -0.15 });
    letras(c, -11, -7, 0, 100, 16, P, 4, 1.4); letras(c, 7, 11, 0, 100, 16, P, 4, 1.4);
    // la cara: frente, ojos de jade, nariz, la boca abierta con colmillos
    c.caja(0, 0.8, 176, 24, 5, 40, { mat: 'mon_yh_cabeza', tono: 0.04 }); c.caja(0, 2, 196, 26, 6, 6, { mat: L, tono: 0.06 });
    for (const sx of [-1, 1]) { c.caja(sx * 6, 3.4, 188, 8, 2, 6, { mat: P, resta: true }); c.elip(sx * 6, 3, 188, 3.4, 1.2, 2.4, { mat: 'mon_yh_luz', tono: -0.1 }); c.elip(sx * 15, 1, 176, 4, 3, 4, { mat: 'mon_yh_cabeza' }); c.elip(sx * 15, 3.6, 176, 1.6, 0.6, 1.6, { mat: J }); }
    c.poli([[-3, 3, 182], [3, 3, 182], [-3, 3, 172], [3, 3, 172], [-2, 7, 180], [2, 7, 180], [-2, 6, 172], [2, 6, 172]], { mat: 'mon_yh_cabeza' });
    c.caja(0, 3.6, 162, 14, 3, 6, { mat: 'negro' }); for (const sx of [-1, 1]) c.palo([sx * 5, 4.4, 165], [sx * 4.4, 5, 158], 1, { mat: 'mu_hueso', r1: 0.2 });
    // el cuenco de fuego
    g.cil(0, 0, 230, 7, 7, { mat: L, r1: 14 }); g.elip(0, 0, 237, 12, 12, 1.6, { mat: 'ext_carbon' });
    for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 5, (a.r() - 0.5) * 5, 237, 3.8, 14 + a.r() * 5, f, 4, k);
    liana(g, [v === 'izq' ? -12 : 12, 7, 226], 80); musgoRepisa(g, -16, 16, 7, 12, 5);
    for (let k = 0; k < 3; k++) { const z = 12 + k * 3; g.cil(10 - k * 7, 16, z, 1.2, 5, { mat: 'cera', tono: -0.4 }); llama(g, 10 - k * 7, 16, z + 5, 0.9, 2.4, f, 4, k); }
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 250] as V3, r: 48 + pp * 8, color: '#ff9a40' } };
  },
});
/** El círculo de los tambores: cuatro tambores de tronco alrededor del fuego, los postes con calaveras y las mazas de fémur. */
registrar({
  id: 'mon_yh_tambores', nombre: ['Tambores de la llamada', 'Drums of the calling'], tema: 'selva', variantes: ['circulo'], huella: [5, 5], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raizG(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; bloque(g, Math.cos(t) * 10, Math.sin(t) * 10, 0, 6, 5, 3.4, { mat: L, giro: (t * 180) / Math.PI, b: 0.6, j: 0.6 }); }
    g.elip(0, 0, 0.6, 8, 8, 1.2, { mat: 'ext_carbon' }); for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 6, (a.r() - 0.5) * 6, 1, 3.6, 14 + a.r() * 6, f, 4, k);
    for (let i = 0; i < 4; i++) { const t = (i / 4) * TAU + 0.4; tambor(g, Math.cos(t) * 26, Math.sin(t) * 26, 0, 7 + (i % 2) * 2, 14 + (i % 2) * 6); }
    for (let i = 0; i < 3; i++) { const t = (i / 3) * TAU + 1.2, x = Math.cos(t) * 34, y = Math.sin(t) * 34; g.palo([x, y, 0], [x, y, 46], 1.4, { mat: 'sel2_corteza' }); calavera(g.sub(x, y, 47, 45), 3.6, 'mu_hueso', true, -0.1); for (let k = 0; k < 3; k++) g.palo([x, y, 40 - k * 6], [x + 3, y + 2, 34 - k * 6], 0.6, { mat: k % 2 ? R : J }); }
    huesos(g, 6, 20, 20, 0, 0, 0.8, 0.3);
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 14] as V3, r: 46 + pp * 10, color: '#ff8a30' } };
  },
});
/** La piedra de las ofrendas: el que está echado con el cuenco en el vientre, lleno de sangre, y las calaveras amontonadas. */
registrar({
  id: 'mon_yh_altar', nombre: ['Piedra de las ofrendas', 'Offering stone'], tema: 'selva', variantes: ['sangre'], huella: [4, 4], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raizG(a), g = g0.sub(0, 0, 0, -45);
    bloque(g, 0, 0, 0, 52, 34, 14, { mat: RJ, b: 1.6, j: 0.8 }); letras(g.sub(0, 17, 0), -20, 20, 0, 10, 2, RJ, 3.6, 1.6);
    // el echado: piernas dobladas, el torso que se levanta sobre los codos, la cabeza girada a la avenida
    const cs: Comp[] = [];
    cs.push(g.hu([-16, 0, 20], [4, 0, 22], 7, 6), g.bu([10, 0, 26], [8, 7, 6]), g.hu([12, 0, 28], [20, 0, 36], 5, 4.4));
    for (const s of [-1, 1]) { cs.push(g.hu([-6, s * 6, 18], [-12, s * 7, 32], 3.4, 3), g.hu([-12, s * 7, 32], [-22, s * 6, 18], 3, 2.6), g.hu([6, s * 8, 24], [10, s * 10, 16], 2.8, 2.4)); }
    g.masa(cs, { mat: L, suave: 1.6 }); g.esf(20, 4, 40, 5.6, { mat: L }); g.cil(-2, 0, 30, 6, 3, { mat: L, r1: 7 }); g.elip(-2, 0, 33, 5.4, 5.4, 0.6, { mat: 'sangre', tono: 0.05 });
    for (let k = 0; k < 4; k++) g.poli([[-6 + k * 4, 16.6, 14], [-4 + k * 4, 16.6, 14], [-6 + k * 4, 17.2, 14], [-4 + k * 4, 17.2, 14], [-5.6 + k * 4, 16.8, 2], [-4.4 + k * 4, 16.8, 2], [-5.6 + k * 4, 17.4, 2], [-4.4 + k * 4, 17.4, 2]], { mat: 'sangre', tono: -0.2 });
    for (let i = 0; i < 7; i++) calavera(g.sub(-30 + (a.r() - 0.5) * 10, 10 + (a.r() - 0.5) * 14, (i % 3) * 3, a.r() * 360), 3.4, 'mu_hueso', i % 2 === 0, -0.15);
    g.elip(10, 26, 0.2, 14, 8, 0.4, { mat: 'sangre', tono: -0.25, giro: 30 });
    bajoTierra(ps); return ps;
  },
});
