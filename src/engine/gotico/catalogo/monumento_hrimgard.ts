import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, raiz, bajoTierra, bloque, letras, grieta, llama, figuraVelada, calavera, cadena } from '../kit_muerte';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { tronco, derrumbe, aro } from './monumentos_kit2';

/**
 * La Boca del Aliento (acto 4, El Paso del Glaciar; baja a `a4_hielo1`, las Cuevas del Aliento Helado). Canon: hace trescientos
 * años los monjes subieron un pedazo de la brasa a Hrimgard y los jarls lo enterraron en el hielo, donde el glaciar respira.
 * No es un edificio: es el glaciar entero, una pared de hielo azul de seracs y prismas que sube en tres escalones hacia atrás,
 * y al pie el frente de granito que los jarls tallaron en la roca viva: dos jambas monolíticas con la sierpe de runas, el
 * dintel, las dos hachas cruzadas del jarl con el escudo en la cruz y, adentro, la boca azul por donde sale el frío. En la cara
 * del glaciar quedó el barco del último jarl, preso en el hielo a media altura, con la proa de dragón afuera y su faro encendido
 * (el que los de abajo ven de noche). Nada de naves, techos, agujas ni rosetones: hielo, roca tallada y un barco.
 *
 * Sueltos en el atrio (monumentos.ts): los dos jarls de granito de pie con la espada clavada (`mon_hr_jarl`), los braseros de
 * hierro de la boca (`mon_hr_brasero`), el muro de escudos de los que murieron guardándola (`mon_hr_escudos`) y el trineo de los
 * monjes con el relicario vacío (`mon_hr_trineo`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Hielo de glaciar: estratos horizontales que ondulan (cada invierno una capa), el azul hondo en las grietas y lo blanco arriba. */
M.mon_hr_hielo = {
  rampa: ['#0a1a2a', '#11283e', '#1a3a55', '#244e6c', '#316583', '#43809b', '#5c9bb2', '#7fb7c8', '#a9d2dc', '#d4ecf0'], ruido: 0.18, escala: 0.12, brillo: 0.55,
  patron: (p, n) => {
    if (n[2] > 0.7) return 0.28 + (ruido(p[0] * 0.05, p[1] * 0.05, 1) - 0.5) * 0.12;
    const ond = Math.sin(p[0] * 0.02 + p[1] * 0.017) * 6 + (ruido(p[0] * 0.01, p[1] * 0.01, 3) - 0.5) * 14, capa = (p[2] + ond) / 9;
    const banda = (ruido(Math.floor(capa) * 1.7, 2, 5) - 0.5) * 0.34, filo = capa - Math.floor(capa) < 0.12 ? -0.22 : 0;
    const veta = ruido(p[0] * 0.04 + p[1] * 0.04, p[2] * 0.008, 7) > 0.7 ? -0.28 : 0;
    return banda + filo + veta + Math.min(0.2, Math.max(0, (p[2] - 260) / 400));
  },
};
M.mon_hr_serac = { rampa: ['#0e2236', '#173450', '#22496a', '#2f6184', '#437c9e', '#5e9ab6', '#86bccc', '#b6dce4', '#e2f4f6'], ruido: 0.16, escala: 0.12, brillo: 0.7 };
M.mon_hr_nieve = { rampa: ['#4c5966', '#677582', '#84919c', '#a1acb4', '#bcc5cb', '#d4dadd', '#e8ecee'], ruido: 0.14, escala: 0.12 };
/** Basalto del pie: negro azulado con la escarcha en lo que mira arriba. */
M.mon_hr_roca = { rampa: ['#07080a', '#0f1114', '#181b20', '#22262c', '#2d323a', '#3a4049', '#4a515b'], ruido: 0.3, escala: 0.22, patron: (p, n) => (n[2] > 0.6 ? 0.35 : 0) + (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.2) - 0.5) * 0.3 + (ruido(p[0] * 0.02, p[1] * 0.02, p[2] * 0.07) > 0.66 ? -0.2 : 0) };
/** Granito gris de la talla, con la escarcha en las repisas y las juntas de los sillares del frente. */
M.mon_hr_granito = {
  rampa: ['#0d0e10', '#1a1c1f', '#292c30', '#3a3e43', '#4d5157', '#61666c', '#767b81', '#8c9197', '#a3a8ad', '#babfc3'], ruido: 0.26, escala: 0.3,
  patron: (p, n) => {
    if (n[2] > 0.6) return 0.3 + (ruido(p[0] * 0.1, p[1] * 0.1, 2) - 0.5) * 0.14;
    const hn = Math.hypot(n[0], n[1]) || 1, uu = (-p[0] * n[1] + p[1] * n[0]) / hn, fila = Math.floor(p[2] / 22), u = uu + fila * 19, L = 34 + ruido(fila, 1, 1) * 30, r = u / L - Math.floor(u / L), t = p[2] / 22 - fila;
    const borde = Math.min(t * 22, (1 - t) * 22, r * L, (1 - r) * L);
    if (borde < 1.4) return -0.5;
    return (ruido(Math.floor(u / L) * 2.3, fila * 1.3, 4) - 0.5) * 0.24 + (borde < 3.4 ? -0.1 : 0) + (ruido(p[0] * 0.03, p[1] * 0.03, p[2] * 0.012) > 0.64 ? -0.16 : 0);
  },
};
M.mon_hr_talla = { rampa: ['#0d0e10', '#1a1c1f', '#292c30', '#3a3e43', '#4d5157', '#61666c', '#767b81', '#8c9197', '#a3a8ad'], ruido: 0.24, escala: 0.26, patron: (p, n) => (n[2] > 0.6 ? 0.28 : 0) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.2 };
/** Las runas que todavía brillan frío y la boca del aliento (lo hondo azul, con su luz). */
M.mon_hr_runa = { rampa: ['#0a2a3a', '#145070', '#2382a6', '#46b4d6', '#8ae0f4', '#d0f8ff'], ruido: 0.3, escala: 0.3, emite: true };
M.mon_hr_aliento = { rampa: ['#02060c', '#061424', '#0c2640', '#14405e', '#22607e', '#3a86a2', '#6ab4cc'], ruido: 0.5, escala: 0.2, emite: true };
/** El barco: roble alquitranado, la vela de rayas rojas y crudas, los escudos pintados. */
M.mon_hr_madera = { rampa: ['#0a0705', '#150e09', '#22170f', '#311f14', '#41291a', '#523421', '#634028'], ruido: 0.3, escala: 0.4, patron: (p) => (Math.sin(p[2] * 0.9 + ruido(p[0] * 0.05, p[1] * 0.05, 0) * 3) > 0.86 ? -0.3 : 0) + (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.06) - 0.5) * 0.24 };
M.mon_hr_rojo = { rampa: ['#1c0605', '#320b08', '#4c120c', '#681a11', '#842418', '#9e3120'], ruido: 0.3, escala: 0.3 };
M.mon_hr_crudo = { rampa: ['#2a2620', '#403a31', '#585044', '#706758', '#897e6c', '#a09580'], ruido: 0.3, escala: 0.3 };
M.mon_hr_amarillo = { rampa: ['#2a1d06', '#45300a', '#634610', '#835d16', '#a1741e', '#ba8a2a'], ruido: 0.3, escala: 0.3 };
M.mon_hr_bronce = { rampa: ['#140c05', '#28190a', '#402a12', '#5a3c1a', '#755024', '#8f6531', '#a87b42', '#c49556'], ruido: 0.25, escala: 0.3, brillo: 0.6 };
M.mon_hr_piel = { rampa: ['#0f0c0a', '#1d1813', '#2c241c', '#3d3226', '#4f4132', '#62513f'], ruido: 0.6, escala: 0.6 };
const HI = 'mon_hr_hielo', SE = 'mon_hr_serac', NI = 'mon_hr_nieve', RO = 'mon_hr_roca', GR = 'mon_hr_granito', TA = 'mon_hr_talla', RU = 'mon_hr_runa', MA = 'mon_hr_madera', FE = 'mu_hierro', BR = 'mon_hr_bronce';

/** Prisma de hielo de seis caras con su punta, de `p` hacia `d` (unitario): radio `r`, largo `L`. */
function cristal(g: G, p: V3, d: V3, r: number, L: number, mat = SE, tono = 0) {
  const ax: V3 = Math.abs(d[2]) < 0.9 ? [0, 0, 1] : [1, 0, 0];
  let e1: V3 = [d[1] * ax[2] - d[2] * ax[1], d[2] * ax[0] - d[0] * ax[2], d[0] * ax[1] - d[1] * ax[0]]; const n1 = Math.hypot(...e1); e1 = [e1[0] / n1, e1[1] / n1, e1[2] / n1];
  const e2: V3 = [d[1] * e1[2] - d[2] * e1[1], d[2] * e1[0] - d[0] * e1[2], d[0] * e1[1] - d[1] * e1[0]];
  const anillo = (t: number, rr: number) => Array.from({ length: 6 }, (_, i) => { const a = (i / 6) * TAU; return [p[0] + d[0] * t + (e1[0] * Math.cos(a) + e2[0] * Math.sin(a)) * rr, p[1] + d[1] * t + (e1[1] * Math.cos(a) + e2[1] * Math.sin(a)) * rr, p[2] + d[2] * t + (e1[2] * Math.cos(a) + e2[2] * Math.sin(a)) * rr] as V3; });
  const b = anillo(0, r), m = anillo(L * 0.78, r * 0.92), tip: V3 = [p[0] + d[0] * L, p[1] + d[1] * L, p[2] + d[2] * L];
  g.poli([...b, ...m], { mat, tono }); g.poli([...m, tip], { mat, tono: tono + 0.08 });
}
/** Carámbanos que cuelgan de un canto (de x0 a x1 en u, a la altura z). */
function carambanos(g: G, x0: number, x1: number, u: number, z: number, n: number, largo: number) {
  const a = g.a; for (let i = 0; i < n; i++) { const x = x0 + a.r() * (x1 - x0), L = largo * (0.3 + a.r() * 0.7); g.palo([x, u, z], [x + (a.r() - 0.5) * 1.5, u + 0.5, z - L], 1 + a.r() * 1.2, { mat: SE, r1: 0.15, tono: 0.1 }); }
}
/** Nieve encima de una repisa: almohadas chatas. */
function nieveSobre(g: G, x0: number, x1: number, u0: number, u1: number, z: number, n: number) {
  const a = g.a; for (let i = 0; i < n; i++) g.elip(x0 + a.r() * (x1 - x0), u0 + a.r() * (u1 - u0), z, 8 + a.r() * 10, 5 + a.r() * 6, 2 + a.r() * 2, { mat: NI, giro: a.r() * 180, tono: (a.r() - 0.5) * 0.06 });
}

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  // ------------------------------------------------------------ el glaciar: tres escalones de hielo que suben hacia atrás
  const ESC: [number, number, number, number][] = [[-70, 100, 250, 200], [-160, 90, 340, 190], [-240, 80, 420, 172]]; // [u centro, medio fondo, alto, medio ancho]
  for (const [uc, dd, zz, ww] of ESC) {
    // el escalón en siete columnas de alto distinto (la cresta sube y baja: nunca una meseta)
    const NS = 7, alt: number[] = [];
    for (let k = 0; k < NS; k++) {
      const x0 = -ww - 10 + (k / NS) * (ww * 2 + 20), x1 = -ww - 10 + ((k + 1) / NS) * (ww * 2 + 20), h = zz * (0.72 + a.r() * 0.36) * (1 - Math.abs(k - 3) * 0.04);
      alt.push(h);
      F.poli([[x0 - 4, uc - dd, 0], [x1 + 4, uc - dd, 0], [x0 - 4, uc + dd, 0], [x1 + 4, uc + dd, 0], [x0 + 6, uc - dd + 18, h], [x1 - 6, uc - dd + 18, h + (a.r() - 0.5) * 30], [x0 + 6, uc + dd - 16, h - 10 - a.r() * 20], [x1 - 6, uc + dd - 16, h - 10 - a.r() * 20]], { mat: HI, tono: (a.r() - 0.5) * 0.08 });
      // las agujas de hielo de su cresta
      for (let j = 0; j < 3; j++) cristal(F, [x0 + (x1 - x0) * (0.2 + j * 0.3), uc + (a.r() - 0.4) * dd * 1.1, h - 12], [(a.r() - 0.5) * 0.5, (a.r() - 0.3) * 0.4, 0.88], 7 + a.r() * 6, 46 + a.r() * 60, SE, (a.r() - 0.5) * 0.12);
    }
    // la cara de adelante, partida en paños que se adelantan y se retiran (no es una pared lisa)
    for (let k = -3; k <= 3; k++) { const x = k * (ww / 3.4) + (a.r() - 0.5) * 10, w = ww / 3.6 + a.r() * 14, h = zz * (0.55 + a.r() * 0.4); F.poli([[x - w, uc + dd - 4, 0], [x + w, uc + dd - 4, 0], [x - w, uc + dd + 8 + a.r() * 8, 0], [x + w, uc + dd + 8 + a.r() * 8, 0], [x - w * 0.8, uc + dd - 6, h], [x + w * 0.8, uc + dd - 6, h], [x - w * 0.8, uc + dd + 2, h - 10], [x + w * 0.8, uc + dd + 2, h - 10]], { mat: HI, tono: (a.r() - 0.5) * 0.1 }); }
    // las grietas hondas, azul oscuro, de arriba abajo
    for (let k = 0; k < 5; k++) { const x = (a.r() - 0.5) * ww * 1.6; F.poli([[x - 3, uc + dd + 20, zz * 0.2], [x + 3, uc + dd + 20, zz * 0.2], [x - 3, uc + dd - 30, zz * 0.2], [x + 3, uc + dd - 30, zz * 0.2], [x - 7, uc + dd + 20, zz + 40], [x + 7, uc + dd + 20, zz + 40], [x - 7, uc + dd - 30, zz + 40], [x + 7, uc + dd - 30, zz + 40]], { mat: HI, resta: true }); }
    // los seracs de la cresta: bloques ladeados y prismas que le rompen el canto de arriba
    for (let k = 0; k < 13; k++) {
      const x = -ww + 10 + (k / 12) * (ww * 2 - 20) + (a.r() - 0.5) * 12, u = uc + (a.r() - 0.3) * dd * 1.2, h = 26 + a.r() * 46;
      if (k % 3 === 0) F.caja(x, u, alt[Math.min(NS - 1, Math.floor(((x + ww) / (ww * 2)) * NS))] - 16, 12 + a.r() * 10, 12 + a.r() * 10, h * 0.7, { mat: SE, giro: (a.r() - 0.5) * 50, incl: (a.r() - 0.5) * 30, tono: (a.r() - 0.5) * 0.1 });
      if (k % 2) cristal(F, [x + 6, u + 4, alt[Math.min(NS - 1, Math.max(0, Math.floor(((x + ww) / (ww * 2)) * NS)))] - 8], [(a.r() - 0.5) * 0.5, (a.r() - 0.2) * 0.4, 0.86], 5 + a.r() * 4, 34 + a.r() * 34);
    }
    for (let k = 0; k < NS; k++) nieveSobre(F, -ww + k * (ww * 2 / NS), -ww + (k + 1) * (ww * 2 / NS), uc - dd + 24, uc + dd - 20, alt[k] - 14, 2);
    carambanos(F, -ww + 10, ww - 10, uc + dd + 4, zz * 0.62, 12, 22);
  }
  // los prismas grandes del glaciar, como dientes, entre escalón y escalón
  for (let k = 0; k < 9; k++) { const x = -180 + k * 45 + (a.r() - 0.5) * 20, u = -150 + (a.r() - 0.5) * 30; cristal(F, [x, u, 220 + a.r() * 60], [(a.r() - 0.5) * 0.4, 0.15, 0.95], 9 + a.r() * 6, 60 + a.r() * 50, SE, (a.r() - 0.5) * 0.1); }
  // el pie de basalto, con la escarcha, a lo ancho del frente
  for (let k = -5; k <= 5; k++) { const x = k * 38 + (a.r() - 0.5) * 12; bloque(F, x, 30 + (a.r() - 0.5) * 16, 0, 36 + a.r() * 20, 30 + a.r() * 16, 22 + a.r() * 30, { mat: RO, giro: (a.r() - 0.5) * 30, b: 3, j: 2 }); }
  derrumbe(F, 14, -150, 50, 40, 16, 16, RO); derrumbe(F, 14, 150, 50, 40, 16, 16, RO);
  // ------------------------------------------------------------ el barco del último jarl, preso en la cara del glaciar
  {
    const U = -22, Z = 256, V0 = -236, V1 = 150;
    const sec = (v: number) => { const t = (v - V0) / (V1 - V0); return Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) ** 0.55; };
    for (let i = 0; i < 16; i++) {
      const va = V0 + ((V1 - V0) * i) / 16, vb = V0 + ((V1 - V0) * (i + 1)) / 16, wa = 4 + sec(va) * 26, wb = 4 + sec(vb) * 26, la = Z + 6 + (1 - sec(va)) * 26, lb = Z + 6 + (1 - sec(vb)) * 26;
      for (let t = 0; t < 4; t++) { const k0 = t / 4, k1 = (t + 1) / 4; F.poli([[va, U + wa * (1 - k0), Z + 30 - k0 * 24], [vb, U + wb * (1 - k0), Z + 30 - k0 * 24], [va, U + wa * (1 - k1), Z + 30 - k1 * 24], [vb, U + wb * (1 - k1), Z + 30 - k1 * 24], [va, U - 2, Math.min(la, Z + 30 - k0 * 24)], [vb, U - 2, Math.min(lb, Z + 30 - k0 * 24)], [va, U - 2, Math.min(la, Z + 30 - k1 * 24)], [vb, U - 2, Math.min(lb, Z + 30 - k1 * 24)]], { mat: MA, tono: (t % 2 ? -0.06 : 0.04) }); }
      // los escudos de la borda, pintados
      if (i > 1 && i < 15) F.sub((va + vb) / 2, U + wa + 1.6, Z + 26, 0, 90, 'x').cil(0, 0, 0, 9, 1.6, { mat: ['mon_hr_rojo', 'mon_hr_amarillo', 'mon_hr_crudo', 'mon_hr_rojo'][i % 4], tono: -0.05 });
      if (i > 1 && i < 15) F.esf((va + vb) / 2, U + wa + 3.4, Z + 26, 2.4, { mat: BR });
    }
    F.palo([V0, U + 4, Z + 24], [V1, U + 4, Z + 24], 2.2, { mat: MA, tono: 0.08 });
    // la proa de dragón: el cuello que sube en curva, la cabeza con las fauces y los cuernos
    { let q: V3 = [V0, U + 2, Z + 26]; for (let k = 1; k <= 7; k++) { const t = k / 7, n: V3 = [V0 - Math.sin(t * 1.4) * 40, U + 4 + t * 6, Z + 26 + t * 64]; F.palo(q, n, 7 - k * 0.6, { mat: MA, r1: 7 - (k + 1) * 0.6, tono: 0.02 }); q = n; }
      const c = F.sub(q[0], q[1], q[2], 0); c.poli([[-2, -6, -6], [6, -6, -6], [-2, 6, -6], [6, 6, -6], [-20, -4, 2], [-20, 4, 2], [0, -5, 6], [0, 5, 6]], { mat: MA, tono: 0.06 }); c.poli([[-2, -5, -8], [4, -5, -8], [-2, 5, -8], [4, 5, -8], [-18, -3, -6], [-18, 3, -6], [-2, -4, -4], [-2, 4, -4]], { mat: MA }); c.elip(-8, 5, 2, 2, 1, 1.6, { mat: RU, tono: 0.2 }); c.elip(-8, -5, 2, 2, 1, 1.6, { mat: RU, tono: 0.2 });
      for (const s of [-1, 1]) c.palo([2, s * 4, 5], [12, s * 7, 18], 1.6, { mat: MA, r1: 0.3 }); for (let k = 0; k < 4; k++) c.palo([-16 + k * 4, 3, -5], [-16 + k * 4, 3.4, -9], 0.6, { mat: 'mu_hueso', r1: 0.1 });
      // el faro: la canasta de hierro en la proa con su fuego
      c.cil(6, 0, 8, 4, 2, { mat: FE, r1: 7 }); for (let k = 0; k < 6; k++) { const t = (k / 6) * TAU; c.palo([6 + Math.cos(t) * 5, Math.sin(t) * 5, 9], [6 + Math.cos(t) * 8, Math.sin(t) * 8, 20], 0.7, { mat: FE }); }
      for (let k = 0; k < 4; k++) llama(c, 6 + (a.r() - 0.5) * 4, (a.r() - 0.5) * 4, 11, 4.4, 18 + a.r() * 6, f, 4, k); }
    // el mástil partido y la vela de rayas, tiesa de hielo
    F.palo([-40, U + 4, Z + 20], [-46, U + 6, Z + 120], 4.4, { mat: MA, r1: 3.6 }); F.palo([-46, U + 6, Z + 120], [-30, U + 2, Z + 132], 3.4, { mat: MA, r1: 2 });
    for (let k = 0; k < 6; k++) { const x0 = -110 + k * 22; F.poli([[x0, U + 10, Z + 112], [x0 + 22, U + 10, Z + 114], [x0, U + 12, Z + 112], [x0 + 22, U + 12, Z + 114], [x0 + 6, U + 14, Z + 50 + (k % 3) * 8], [x0 + 26, U + 16, Z + 56], [x0 + 6, U + 16, Z + 50 + (k % 3) * 8], [x0 + 26, U + 18, Z + 56]], { mat: k % 2 ? 'mon_hr_rojo' : 'mon_hr_crudo', tono: -0.04 }); }
    F.palo([-120, U + 10, Z + 114], [20, U + 10, Z + 116], 2, { mat: MA });
    // el hielo que lo traga: lenguas que le suben por el casco y carámbanos que cuelgan de la quilla
    for (let k = 0; k < 9; k++) { const x = V0 + 50 + k * 38; F.elip(x, U + 10, Z - 2 + (a.r() - 0.5) * 8, 22 + a.r() * 10, 16, 14 + a.r() * 8, { mat: HI, tono: 0.06 }); }
    carambanos(F, V0 + 30, V1 - 20, U + 18, Z + 4, 22, 34); nieveSobre(F, V0 + 30, V1 - 20, U - 2, U + 20, Z + 30, 10);
  }
  // ------------------------------------------------------------ el frente tallado en la roca: jambas, dintel, hachas y la boca
  const UF = 214;
  {
    // el macizo de granito que sale del hielo hasta la avenida, en talud, con su cara de sillares
    tronco(F, 0, 120, 0, 214, 280, 188, 220, 140, { mat: GR }, -14);
    F.caja(0, 120 - 14, 214, 226, 146, 6, { mat: TA, tono: 0.08 });
    nieveSobre(F, -100, 100, 60, 180, 220, 14);
    for (const s of [-1, 1]) { F.poli([[s * 140, UF - 8, 0], [s * 160, UF - 8, 0], [s * 140, 40, 0], [s * 160, 40, 0], [s * 114, UF - 30, 200], [s * 124, UF - 30, 200], [s * 114, 60, 200], [s * 124, 60, 200]], { mat: GR, tono: -0.04 }); carambanos(F, s * 150 - 14, s * 150 + 14, UF - 8, 150, 6, 30); }
    // el hueco de la boca y lo hondo que sale azul, los escalones de hielo que bajan
    F.caja(0, UF - 30, 0, 74, 70, 128, { mat: GR, resta: true }); F.poli([[-37, UF + 4, 128], [37, UF + 4, 128], [-37, UF - 66, 128], [37, UF - 66, 128], [-16, UF + 4, 150], [16, UF + 4, 150], [-16, UF - 66, 150], [16, UF - 66, 150]], { mat: GR, resta: true });
    F.caja(0, UF - 66, 0, 74, 2, 150, { mat: 'mon_hr_aliento', tono: 0.05 + p * 0.08 });
    for (let i = 0; i < 7; i++) F.caja(0, UF - 8 - i * 8, 8 - i * 1.6, 70, 8, 2, { mat: SE, tono: -0.1 - i * 0.04 });
    for (let k = 0; k < 6; k++) F.elip((a.r() - 0.5) * 50, UF - 40 + a.r() * 30, 10 + a.r() * 30, 14 + a.r() * 8, 10, 8, { mat: 'mon_hr_aliento', tono: 0.2 + a.r() * 0.15 });
    // las dos jambas monolíticas con la sierpe de runas que sube y brilla frío
    for (const s of [-1, 1]) {
      const x = s * 52;
      F.caja(x, UF - 6, 0, 30, 20, 170, { mat: TA, tono: 0.04 }); F.caja(x, UF - 6, 170, 36, 24, 10, { mat: TA, tono: 0.08 });
      for (let k = 0; k < 12; k++) { const z = 14 + k * 12.6, dx = Math.sin(k * 1.1) * 7; F.palo([x + dx - 6, UF + 4.4, z], [x - dx + 6, UF + 4.4, z + 10], 1.6, { mat: TA, resta: true }); F.palo([x + dx - 6, UF + 3.8, z], [x - dx + 6, UF + 3.8, z + 10], 0.8, { mat: RU, tono: -0.1 + p * 0.1 }); }
      F.elip(x, UF + 4.2, 156, 5, 1.4, 4, { mat: RU, tono: 0.1 }); F.caja(x, UF + 4.6, 150, 8, 1, 2, { mat: 'negro' });
      carambanos(F, x - 16, x + 16, UF + 6, 178, 5, 20);
    }
    // el dintel con la inscripción, y encima las dos hachas cruzadas del jarl con el escudo en la cruz
    F.caja(0, UF - 6, 180, 150, 26, 30, { mat: TA, tono: 0.06 }); letras(F.sub(0, UF + 7.2, 0), -62, 62, 0, 186, 2, RU, 4.6, 2);
    for (const s of [-1, 1]) {
      const p0: V3 = [s * 86, UF + 4, 200], p1: V3 = [-s * 30, UF + 6, 330];
      F.palo(p0, p1, 4.6, { mat: MA, r1: 4 }); F.palo([p0[0] - s * 4, p0[1], p0[2] - 8], p0, 5.4, { mat: FE });
      const c = F.sub(p1[0], p1[1], p1[2]); c.poli([[s * 2, -3, 6], [s * 2, 3, 6], [s * 2, -3, -14], [s * 2, 3, -14], [-s * 30, -1.4, 18], [-s * 30, 1.4, 18], [-s * 30, -1.4, -26], [-s * 30, 1.4, -26]], { mat: FE, tono: 0.06 }); c.palo([-s * 29, 2, 18], [-s * 29, 2, -26], 1.2, { mat: 'acero', tono: 0.2 });
    }
    F.sub(0, UF + 8, 266, 0, 90, 'x').cil(0, 0, 0, 30, 5, { mat: MA, tono: 0.04 }); aro(F.sub(0, UF + 13, 0), 0, 266, 29, 2.2, FE, 0, TAU, 28); F.sub(0, UF + 13, 266, 0, 90, 'x').cil(0, 0, 0, 8, 6, { mat: BR, r1: 4 });
    for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU + 0.4; F.palo([Math.cos(t) * 9, UF + 13, 266 + Math.sin(t) * 9], [Math.cos(t) * 26, UF + 13, 266 + Math.sin(t) * 26], 1.2, { mat: FE }); }
    // los escudos tallados del friso, la grieta y la escarcha de la cara
    for (let k = -4; k <= 4; k++) { if (Math.abs(k) < 2) continue; F.sub(k * 26, UF - 14, 206, 0, 90, 'x').cil(0, 0, 0, 10, 3, { mat: TA, tono: 0.05 }); F.sub(k * 26, UF - 10.6, 206, 0, 90, 'x').cil(0, 0, 0, 3, 1.4, { mat: TA, tono: 0.12 }); }
    grieta(F.sub(-96, UF - 34, 0), 0, 0, 20, 150, GR); grieta(F.sub(102, UF - 34, 0), 0, 0, 30, 170, GR);
    // las antorchas de la cara, en sus jaulas de hierro
    for (const s of [-1, 1]) { const x = s * 92; F.palo([x, UF - 26, 120], [x, UF - 10, 128], 1.6, { mat: FE }); F.cil(x, UF - 8, 124, 3, 6, { mat: FE, r1: 5 }); for (let k = 0; k < 3; k++) llama(F, x + (a.r() - 0.5) * 3, UF - 8 + (a.r() - 0.5) * 3, 130, 3, 12 + a.r() * 4, f, 4, k + 10); }
    // el piso de la boca: la escarcha que sale, huesos, un yelmo y velas
    for (let k = 0; k < 5; k++) F.elip((a.r() - 0.5) * 70, UF + 6 + a.r() * 10, 0.3, 10 + a.r() * 8, 5, 0.6, { mat: NI, giro: a.r() * 180 });
    calavera(F.sub(-24, UF + 10, 2, 120), 3.4, 'mu_hueso', true, 0.05); calavera(F.sub(30, UF + 8, 2, 60), 3.4, 'mu_hueso', false, 0);
  }
  void cadena;
  return {
    der: { c: [0, UF - 30, 50] as V3, r: 90 + p * 14, color: '#6ad0ff' },
    izq: { c: [0, UF - 4, 130] as V3, r: 70 + p * 10, color: '#ff9a40' },
    atras_i: { c: [-262, -14, 340] as V3, r: 110 + p * 18, color: '#ffa040' },
    medio: { c: [0, 40, 260] as V3, r: 60, color: '#8ad8ff' },
  };
}
registrarMonumento({
  id: 'mon_hrim', nombre: ['La Boca del Aliento', 'The Mouth of the Breath'], tema: 'nieve', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== los dos jarls de granito
/** El jarl de pie con la espada clavada y las dos manos en el pomo, la cabeza baja: el yelmo con nasal, la barba en trenzas,
 *  la cota hasta las rodillas y la capa con la piel sobre los hombros. La escarcha en lo que mira arriba y carámbanos. */
function jarl(g: G, viejo: boolean) {
  const k = 4.3, s = g.esc(k), m = TA, cs: Comp[] = [], cl: Comp[] = [], ca: Comp[] = [];
  bloque(g, 0, 0, 0, 130, 130, 16, { mat: GR, b: 2, j: 1 }); letras(g.sub(0, 65.4, 0), -52, 52, 0, 4, 2, RU, 4.6, 2);
  const z0 = 16 / k, S = s.sub(0, 0, z0);
  for (const sx of [-1, 1]) {
    cl.push(S.bu([sx * 4, 2.6, 1.4], [2.6, 4.6, 1.6]), S.hu([sx * 4, 0, 2], [sx * 4.3, 0, 20], 3.2, 2.8), S.hu([sx * 4.3, 0, 20], [sx * 4.6, -0.4, 34], 4.2, 3.6));
    ca.push(S.hu([sx * 10.4, -0.6, 56], [sx * 8.6, 3, 45], 3.2, 2.7), S.hu([sx * 8.6, 3, 45], [sx * 2.4, 8.6, 41.4], 2.7, 2.2), S.bu([sx * 1.8, 9.6, 42], [2.2, 2.2, 2.6]), S.bu([sx * 10.4, -0.6, 56.6], [4.4, 4.4, 4.2]));
  }
  cs.push(S.hu([0, 0, 36], [0, 0, 54], 8.2, 9.6), S.bu([0, 1.2, 50], [9.8, 6.4, 6.6]), S.hu([0, 0, 57], [0, 0.8, 61.4], 3, 2.8));
  S.masa(cl, { mat: m, suave: 0.6 }); S.masa(cs, { mat: m, suave: 0.8 }); S.masa(ca, { mat: m, suave: 0.6 });
  // la cota de malla hasta las rodillas, partida adelante, y el cinto con su hebilla
  tronco(S, 0, 0, 18, 40, 22, 14, 19, 12, { mat: 'mon_hr_talla', tono: -0.06 }); S.caja(0, 6.6, 18, 2, 1, 16, { mat: m, resta: true });
  S.caja(0, 0, 37, 21, 13.4, 2.4, { mat: 'mon_hr_piel', tono: 0.1 }); S.caja(0, 6.8, 37, 3.6, 0.8, 2.4, { mat: BR });
  for (let i = 0; i < 10; i++) S.caja(0, 6.4, 20 + i * 1.8, 18, 0.3, 0.3, { mat: m, resta: true });
  // la capa que cae detrás hasta el pedestal, con sus pliegues, y la piel sobre los hombros
  S.poli([[-12, -5, 58], [12, -5, 58], [-12, -8, 58], [12, -8, 58], [-15, -8, 0.4], [15, -8, 0.4], [-15, -12, 0.4], [15, -12, 0.4]], { mat: m, tono: -0.05 });
  for (let i = 0; i < 6; i++) S.palo([-11 + i * 4.4, -12.2, 2], [-9 + i * 3.6, -8.8, 56], 0.9, { mat: m, resta: true });
  for (let i = 0; i < 9; i++) { const t = (i / 8) * Math.PI; S.elip(Math.cos(t) * 10, -1 + Math.sin(t) * 1.4 - 2, 58.4, 4.2, 4, 3, { mat: 'mon_hr_piel', tono: 0.08 }); }
  // la espada clavada: la hoja en la roca del pedestal, la cruz, el puño y el pomo bajo las manos
  S.poli([[-1.8, 10, 34], [1.8, 10, 34], [-1.8, 10.8, 34], [1.8, 10.8, 34], [-0.4, 10, -2], [0.4, 10, -2], [-0.4, 10.8, -2], [0.4, 10.8, -2]], { mat: 'acero', tono: 0.06 });
  S.palo([-7, 10.4, 34.6], [7, 10.4, 34.6], 1, { mat: FE, r1: 0.7 }); S.palo([0, 10.4, 35], [0, 10.4, 40.6], 0.9, { mat: 'mon_hr_piel' }); S.esf(0, 10.4, 43.6, 1.7, { mat: BR });
  // la cabeza baja: la cara, los ojos en sombra con su brillo, la nariz, el bigote, la barba en dos trenzas
  const C = S.sub(0, 1.4, 63, 0, 14);
  C.elip(0, 0, 0, 4, 4.3, 5, { mat: m }); C.caja(0, 3.6, 1.4, 6.4, 1.2, 1.4, { mat: m, tono: 0.05 });
  for (const sx of [-1, 1]) { C.elip(sx * 1.7, 3.9, 0.4, 1, 0.5, 0.6, { mat: m, tono: -0.35 }); C.elip(sx * 1.7, 4.1, 0.4, 0.4, 0.2, 0.3, { mat: RU, tono: viejo ? -0.2 : 0.1 }); }
  C.poli([[-0.8, 3.8, 1], [0.8, 3.8, 1], [-0.8, 3.8, -2.6], [0.8, 3.8, -2.6], [-0.3, 5.6, 0.4], [0.3, 5.6, 0.4], [-1.2, 5.2, -2.6], [1.2, 5.2, -2.6]], { mat: m });
  for (const sx of [-1, 1]) C.palo([0, 4.6, -3.2], [sx * 3.4, 4.2, -5.6], 0.9, { mat: m, r1: 0.4 });
  const cb: Comp[] = [C.hu([0, 3.4, -4], [0, 4.6, -10], 3.4, 2), C.bu([0, 3.2, -6], [3.6, 2, 3])]; C.masa(cb, { mat: m, suave: 0.6 });
  for (const sx of [-1, 1]) for (let i = 0; i < 5; i++) C.esf(sx * 1.6, 5 - i * 0.1, -10.6 - i * 1.8, 1 - i * 0.08, { mat: m, tono: -0.03 });
  // el yelmo: casquete con su cresta, el aro, el nasal y las carrilleras
  C.elip(0, -0.2, 2.6, 4.5, 4.7, 3.8, { mat: m, tono: 0.08 }); C.palo([0, -4.4, 2.6], [0, 4.4, 2.6], 0.8, { mat: m, tono: 0.12 });
  aro(C.sub(0, 0, 0, 0, 90, 'x'), 0, 1.4, 4.4, 0.6, m, 0, TAU, 20); C.caja(0, 4.6, -0.4, 1, 0.8, 4, { mat: m, tono: 0.1 });
  for (const sx of [-1, 1]) C.caja(sx * 3.8, 1.6, -1.6, 0.8, 3.6, 4, { mat: m, tono: 0.06 });
  // la escarcha y la nieve en lo que mira arriba, los carámbanos de los brazos y la barba
  for (const [x, y, z, r] of [[0, -0.2, 67.6, 4], [-10.4, -0.6, 60.8, 3.6], [10.4, -0.6, 60.8, 3.6], [0, 9.6, 44.2, 2.6]] as number[][]) S.elip(x, y, z, r, r, 1.2, { mat: NI });
  for (let i = 0; i < 8; i++) S.palo([-6 + i * 1.7, 4.4 + (i % 2) * 2, 41], [-6 + i * 1.7, 4.6 + (i % 2) * 2, 37 - (i % 3)], 0.35, { mat: SE, r1: 0.05 });
  if (viejo) { grieta(S.sub(4, 6.6, 0), 0, 0, 20, 50, m); S.caja(5, -1, 44, 6, 14, 8, { mat: m, resta: true, giro: 20, incl: 30 }); }
  g.elip(0, 0, 16.2, 60, 60, 3, { mat: NI, tono: -0.04 });
}
registrar({
  id: 'mon_hr_jarl', nombre: ['Jarl de granito', 'Granite jarl'], tema: 'nieve', variantes: ['izq', 'der_viejo'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); jarl(g, v === 'der_viejo'); bajoTierra(ps); return ps; },
});

// ================================================================== los braseros de hierro de la boca
registrar({
  id: 'mon_hr_brasero', nombre: ['Brasero de los jarls', 'Brazier of the jarls'], tema: 'nieve', variantes: ['encendido'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    bloque(g, 0, 0, 0, 26, 26, 8, { mat: GR, b: 1.4, j: 0.6 });
    for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU; g.palo([Math.cos(t) * 11, Math.sin(t) * 11, 8], [Math.cos(t) * 4, Math.sin(t) * 4, 46], 1.4, { mat: FE }); }
    g.cil(0, 0, 44, 6, 8, { mat: FE, r1: 13 }); g.elip(0, 0, 52, 12, 12, 1.6, { mat: 'ext_carbon' });
    for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 7, (a.r() - 0.5) * 7, 52, 4.6, 20 + a.r() * 7, f, 4, k);
    g.elip(0, 0, 8.2, 12, 12, 1.4, { mat: NI });
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 64] as V3, r: 60 + pp * 10, color: '#ff9440' } };
  },
});

// ================================================================== el muro de escudos de los que murieron guardándola
registrar({
  id: 'mon_hr_escudos', nombre: ['El último muro de escudos', 'The last shield wall'], tema: 'nieve', variantes: ['helado'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -45);
    g.elip(0, -6, 0, 40, 18, 7, { mat: NI });
    for (let i = 0; i < 6; i++) {
      const x = -30 + i * 12, caido = i === 2 || i === 5;
      if (!caido) { figuraVelada(g.sub(x, -4, 0), 34, { mat: 'mon_hr_talla', pose: 'pie', tono: -0.1 }); g.sub(x, 2, 18, 0, 90, 'x').cil(0, 0, 0, 7.4, 1.4, { mat: ['mon_hr_rojo', 'mon_hr_amarillo', 'mon_hr_crudo'][i % 3], tono: -0.1 }); g.esf(x, 3.6, 18, 1.6, { mat: BR }); g.palo([x + 3, -2, 0], [x + 6, 6, 46], 0.6, { mat: MA }); g.poli([[x + 5.6, 5, 44], [x + 6.4, 5, 44], [x + 5.6, 7, 44], [x + 6.4, 7, 44], [x + 6, 6.4, 52], [x + 6, 6.6, 52], [x + 6, 6.4, 52], [x + 6.2, 6.6, 52]], { mat: 'acero' }); }
      else { g.sub(x, 4, 1.4, 20, 0).cil(0, 0, 0, 7.4, 1.4, { mat: 'mon_hr_rojo', tono: -0.2 }); calavera(g.sub(x + 4, 0, 2, 40), 3.2, 'mu_hueso', true, -0.05); g.palo([x - 8, -4, 1], [x + 10, 6, 1.4], 0.6, { mat: MA }); }
      g.elip(x, -2, 30, 4, 3, 1, { mat: NI });
    }
    for (let k = 0; k < 10; k++) g.palo([-32 + k * 7, 8, 6], [-32 + k * 7 + 0.4, 8.4, 1], 0.4, { mat: SE, r1: 0.05 });
    bajoTierra(ps); return ps;
  },
});

// ================================================================== el trineo de los monjes con el relicario vacío
registrar({
  id: 'mon_hr_trineo', nombre: ['El trineo de los monjes', 'The monks\' sled'], tema: 'nieve', variantes: ['vacio'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -20);
    g.elip(0, 0, 0, 36, 24, 5, { mat: NI });
    for (const s of [-1, 1]) { g.palo([-26, s * 12, 3], [24, s * 12, 3], 1.4, { mat: MA }); g.palo([24, s * 12, 3], [32, s * 12, 12], 1.4, { mat: MA }); }
    g.caja(0, 0, 5, 52, 28, 2.4, { mat: MA, tono: 0.04 }); for (let k = 0; k < 4; k++) g.palo([-22 + k * 14, -12, 4], [-22 + k * 14, -12, 8], 1, { mat: MA });
    // el relicario de hierro, abierto, con las cadenas rotas y el hueco donde iba el pedazo
    bloque(g, 0, 0, 7.4, 24, 16, 14, { mat: FE, b: 0.8, j: 0.3 }); g.caja(0, 0, 18, 20, 12, 4, { mat: FE, resta: true });
    g.poli([[-12, -8, 21.4], [12, -8, 21.4], [-12, -9.6, 21.4], [12, -9.6, 21.4], [-12, -16, 36], [12, -16, 36], [-12, -17.4, 35], [12, -17.4, 35]], { mat: FE, tono: 0.05 });
    g.caja(0, 0, 19, 8, 6, 0.6, { mat: 'mon_hr_aliento', tono: 0.1 });
    cadena(g, [-12, 8, 14], [-26, 18, 0.6], 2, FE, 1.2); cadena(g, [12, 8, 14], [22, 20, 0.6], 2, FE, 1.2);
    // los dos monjes que lo subieron: uno de rodillas contra el relicario, otro caído en la nieve
    figuraVelada(g.sub(-22, -20, 0, 70), 32, { mat: 'mon_hr_crudo', pose: 'rodillas', tono: -0.2 }); g.elip(-22, -20, 24, 4, 4, 1.2, { mat: NI });
    figuraVelada(g.sub(26, -16, 2, 0, 80, 'y'), 32, { mat: 'mon_hr_crudo', pose: 'pie', tono: -0.25 });
    for (let i = 0; i < 6; i++) g.elip(-30 + a.r() * 60, -20 + a.r() * 40, 2, 6 + a.r() * 6, 4, 2, { mat: NI, giro: a.r() * 180 });
    bajoTierra(ps); return ps;
  },
});
void ruido;
