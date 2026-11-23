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
    if (n[2] > 0.55) return 0.1 + (n[2] - 0.55) * 0.7 + (ruido(p[0] * 0.03, p[1] * 0.012, 1) - 0.5) * 0.3 + (Math.sin(p[0] * 0.05 + ruido(p[0] * 0.01, p[1] * 0.01, 2) * 6) > 0.7 ? -0.12 : 0);
    const ond = Math.sin(p[0] * 0.02 + p[1] * 0.017) * 6 + (ruido(p[0] * 0.01, p[1] * 0.01, 3) - 0.5) * 14, capa = (p[2] + ond) / 9;
    const banda = (ruido(Math.floor(capa) * 1.7, 2, 5) - 0.5) * 0.34, filo = capa - Math.floor(capa) < 0.12 ? -0.22 : 0;
    const veta = ruido(p[0] * 0.04 + p[1] * 0.04, p[2] * 0.008, 7) > 0.7 ? -0.28 : 0;
    return banda + filo + veta - 0.22 + Math.min(0.46, Math.max(0, p[2] / 600));
  },
};
/** La pared rota: estrías a plomo (el hielo que cayó en láminas) y el azul viejo y turbio abajo. */
M.mon_hr_pared = {
  rampa: ['#071422', '#0d2034', '#15304a', '#1f4462', '#2b5b7c', '#3c7596', '#5592ae', '#76b0c6', '#a2cfdc', '#d0ecf2'], ruido: 0.14, escala: 0.12, brillo: 0.7,
  patron: (p, n) => {
    if (n[2] > 0.55) return 0.08 + (n[2] - 0.55) * 0.7 + (ruido(p[0] * 0.03, p[1] * 0.012, 1) - 0.5) * 0.3;
    const hn = Math.hypot(n[0], n[1]) || 1, uu = (-p[0] * n[1] + p[1] * n[0]) / hn;
    const estria = (ruido(uu * 0.35, 1, p[2] * 0.01) - 0.5) * 0.5 + (Math.sin(uu * 0.9 + ruido(uu * 0.05, p[2] * 0.02, 3) * 4) > 0.82 ? 0.18 : 0);
    return estria * 0.6 - 0.28 + Math.min(0.42, Math.max(0, p[2] / 520));
  },
};
M.mon_hr_grieta = { rampa: ['#010306', '#03080f', '#060f1c', '#0a182b', '#10233c'], ruido: 0.3, escala: 0.2 };
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
    // (la junta: el canto hondo oscuro y la escarcha que se juntó adentro)
    if (borde < 0.8) return -0.55;
    if (borde < 2) return 0.34 - t * 0.2;
    return (ruido(Math.floor(u / L) * 2.3, fila * 1.3, 4) - 0.5) * 0.36 + (borde < 3.4 ? -0.1 : 0) + (ruido(p[0] * 0.03, p[1] * 0.03, p[2] * 0.012) > 0.64 ? -0.16 : 0);
  },
};
M.mon_hr_claro = { rampa: ['#24272b', '#383c41', '#4e5359', '#666b72', '#7f848b', '#999ea4', '#b3b7bc', '#cbced2', '#e0e2e4'], ruido: 0.22, escala: 0.26, patron: (p, n) => (n[2] > 0.6 ? 0.2 : 0) + (ruido(p[0] * 0.06, p[1] * 0.06, p[2] * 0.06) - 0.5) * 0.24 };
M.mon_hr_oscuro = { rampa: ['#060708', '#0d0f11', '#15181b', '#1e2226', '#282d32', '#33393f', '#40474e'], ruido: 0.26, escala: 0.26, patron: (p, n) => (n[2] > 0.6 ? 0.3 : 0) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.24 };
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
  // ------------------------------------------------------------ el glaciar: una masa que sube en gradas de hielo hacia atrás
  // (la cascada de hielo: cada grada con su lomo nevado casi llano y su escalón roto a plomo, que es lo que da el volumen), más
  // alto a la izquierda, con la lengua que llega adelante hasta la puerta y la rodea
  const ESC = [176, 104, 34, -36, -106, -176, -240], ALT = [196, 246, 294, 338, 382, 420, 452], UB0 = -284, V0g = -212, V1g = 212;
  // el frente de cada grada en `v`: sale y entra por columnas, y a los costados se recoge (no se sale de las piezas)
  const NV = 16, dv = (V1g - V0g) / NV, cols: number[][] = ESC.map(() => { const out: number[] = []; let c0 = 0; for (let i = 0; i < NV; i++) { if (i === 0 || a.r() < 0.55) c0 = (a.r() - 0.5) * 44 + (a.r() < 0.25 ? 22 : 0); out.push(c0); } return out; });
  const frenteDe = (j: number, i: number) => { const v = V0g + (i + 0.5) * dv, lado = v < 0 ? 212 - j * 8 : 200 - j * 18; return Math.abs(v) > lado ? -1e4 : Math.min(ESC[j] + cols[j][i], 300 - Math.abs(v) - 8); };
  const altoDe = (j: number, v: number, u: number) => ALT[j] - v * 0.22 + Math.sin(v * 0.03 + j) * 8 + (ESC[j] - u) * 0.1 - Math.max(0, Math.abs(v) - 150) * 0.7;
  for (let j = 0; j < ESC.length; j++) for (let i = 0; i < NV; i++) {
    const v0 = V0g + i * dv, v1 = v0 + dv, uf = frenteDe(j, i), ub = j === ESC.length - 1 || frenteDe(j + 1, i) < -1000 ? UB0 : Math.min(frenteDe(j + 1, i), uf - 30);
    if (uf < -1000 || uf <= ub + 6) continue;
    const h0 = altoDe(j, v0, uf), h1 = altoDe(j, v1, uf), hb0 = altoDe(j, v0, ub), hb1 = altoDe(j, v1, ub);
    // el bloque de la grada: la cara de adelante a plomo con estrías (su material) y el lomo de encima, claro
    F.poli([[v0, ub, 0], [v1, ub, 0], [v0, uf, 0], [v1, uf, 0], [v0, ub, hb0], [v1, ub, hb1], [v0, uf, h0], [v1, uf, h1]], { mat: j === 0 ? 'mon_hr_pared' : HI, tono: (a.r() - 0.5) * 0.05 });
    F.poli([[v0, uf - 3, 0], [v1, uf - 3, 0], [v0, uf, 0], [v1, uf, 0], [v0, uf - 3, h0 - 3], [v1, uf - 3, h1 - 3], [v0, uf + 0.5, h0 - 8], [v1, uf + 0.5, h1 - 8]], { mat: 'mon_hr_pared', tono: (a.r() - 0.5) * 0.08 });
    // el lomo de nieve que redondea el canto y cuelga un poco, con los carámbanos
    if (a.r() < 0.22) F.elip((v0 + v1) / 2, uf - 2, (h0 + h1) / 2, dv * 0.6, 9, 4, { mat: NI, tono: (a.r() - 0.5) * 0.05 });
    if (a.r() < 0.5) carambanos(F, v0 + 3, v1 - 3, uf + 3, (h0 + h1) / 2 - 6, 3, 18 + a.r() * 26);
    // la grieta del escalón: una hendidura en V, honda y negra azul, con el labio de nieve de los dos lados
    if (i > 0 && Math.abs(cols[j][i] - cols[j][i - 1]) > 9) { const h = Math.min(h0, altoDe(j, v0, frenteDe(j, i - 1))); F.poli([[v0 - 5, uf - 40, h + 0.5], [v0 + 5, uf - 40, h + 0.5], [v0 - 5, uf + 1, h - 4], [v0 + 5, uf + 1, h - 4], [v0, uf - 40, h - 26], [v0, uf + 1, h - 30]], { mat: 'mon_hr_grieta' }); }
  }
  // las grietas en V que cruzan el lomo de cada grada a lo largo (siguen la forma), con su labio
  for (let j = 1; j < ESC.length; j++) for (let k = 0; k < 2; k++) {
    const vc = (k ? 60 : -90) + (a.r() - 0.5) * 60, L = 50 + a.r() * 40, uc = ESC[j] - 24 - a.r() * 16, gi = (a.r() - 0.5) * 18, h = altoDe(j, vc, uc), c = F.sub(vc, uc, h, gi);
    c.poli([[-L / 2, -5, 0.6], [L / 2, -5, 0.6], [-L / 2, 5, 0.6], [L / 2, 5, 0.6], [-L / 2 + 6, 0, -22], [L / 2 - 6, 0, -22]], { mat: 'mon_hr_grieta' });
    c.elip(0, -7, 0.4, L * 0.52, 3.4, 2.2, { mat: NI, tono: 0.05 }); c.elip(0, 7, 0.4, L * 0.52, 3.4, 2.2, { mat: NI, tono: -0.02 });
  }
  // las cuevas de hielo de la pared de adelante, lejos de la puerta: hondas, oscuras, con su azul al fondo
  for (const [vc, zc] of [[-128, 60], [112, 44], [160, 120]] as number[][]) { const uf = 168; F.elip(vc, uf + 6, zc, 22, 24, 30, { mat: HI, resta: true }); F.elip(vc, uf - 16, zc, 16, 4, 22, { mat: 'mon_hr_aliento', tono: -0.2 }); carambanos(F, vc - 18, vc + 18, uf + 10, zc + 26, 6, 20); }
  // unos seracs de cantos rotos en lo alto a la izquierda y trozos caídos al pie
  for (let k = 0; k < 5; k++) { const v = -200 + k * 36 + (a.r() - 0.5) * 16, u = -200 + a.r() * 50, z0 = altoDe(5, v, u) - 12, s2 = 13 + a.r() * 8; F.poli([[v - s2, u - s2, z0], [v + s2, u - s2, z0], [v - s2, u + s2, z0], [v + s2, u + s2, z0], [v - s2 * 0.4, u - s2 * 0.5, z0 + 40 + a.r() * 34], [v + s2 * 0.7, u - s2 * 0.2, z0 + 28 + a.r() * 22], [v - s2 * 0.6, u + s2 * 0.5, z0 + 22], [v + s2 * 0.3, u + s2 * 0.4, z0 + 46 + a.r() * 26]], { mat: SE, tono: (a.r() - 0.5) * 0.1 }); F.elip(v, u, z0 + 40, 9, 9, 3, { mat: NI }); }
  for (let k = 0; k < 7; k++) { const v = (k % 2 ? 1 : -1) * (110 + k * 12), u = 170 + a.r() * 20 - Math.max(0, Math.abs(v) - 130), s2 = 9 + a.r() * 9; F.poli([[v - s2, u - s2 * 0.7, 0], [v + s2 * 0.8, u - s2, 0], [v - s2 * 0.9, u + s2 * 0.8, 0], [v + s2, u + s2 * 0.6, 0], [v - s2 * 0.5, u - s2 * 0.3, s2 * 1.6], [v + s2 * 0.6, u - s2 * 0.6, s2 * 1.2], [v - s2 * 0.7, u + s2 * 0.5, s2 * 1.4], [v + s2 * 0.4, u + s2 * 0.2, s2 * 1.9]], { mat: SE, tono: (a.r() - 0.5) * 0.1 }); }
  // ------------------------------------------------------------ el barco del último jarl, preso adentro del hielo: la popa hundida
  // en la masa, el casco ladeado que atraviesa la pared y la proa de dragón que sale a la izquierda con su faro
  {
    const Lb = F.sub(10, 108, 204, -6, -6, 'y'), U = 0, Z = 0, V0 = -150, V1 = 150;
    const sec = (v: number) => { const t = (v - V0) / (V1 - V0); return Math.sin(Math.min(1, Math.max(0, t)) * Math.PI) ** 0.55; };
    for (let i = 0; i < 16; i++) {
      const va = V0 + ((V1 - V0) * i) / 16, vb = V0 + ((V1 - V0) * (i + 1)) / 16, wa = 4 + sec(va) * 26, wb = 4 + sec(vb) * 26, la = Z + 6 + (1 - sec(va)) * 26, lb = Z + 6 + (1 - sec(vb)) * 26;
      for (const sd of [-1, 1]) for (let t = 0; t < 4; t++) { const k0 = t / 4, k1 = (t + 1) / 4; Lb.poli([[va, U + sd * wa * (1 - k0), Z + 30 - k0 * 24], [vb, U + sd * wb * (1 - k0), Z + 30 - k0 * 24], [va, U + sd * wa * (1 - k1), Z + 30 - k1 * 24], [vb, U + sd * wb * (1 - k1), Z + 30 - k1 * 24], [va, U, Math.min(la, Z + 30 - k0 * 24)], [vb, U, Math.min(lb, Z + 30 - k0 * 24)], [va, U, Math.min(la, Z + 30 - k1 * 24)], [vb, U, Math.min(lb, Z + 30 - k1 * 24)]], { mat: MA, tono: (t % 2 ? -0.06 : 0.04) }); }
      if (i > 1 && i < 15) { Lb.sub((va + vb) / 2, U + wa + 1.6, Z + 26, 0, 90, 'x').cil(0, 0, 0, 9, 1.6, { mat: ['mon_hr_rojo', 'mon_hr_amarillo', 'mon_hr_crudo', 'mon_hr_rojo'][i % 4], tono: -0.05 }); Lb.esf((va + vb) / 2, U + wa + 3.4, Z + 26, 2.4, { mat: BR }); Lb.elip((va + vb) / 2, U + wa + 2, Z + 35, 6, 3, 2, { mat: NI }); }
    }
    Lb.palo([V0, U + 4, Z + 24], [V1, U + 4, Z + 24], 2.2, { mat: MA, tono: 0.08 });
    { let q: V3 = [V0, U + 2, Z + 26]; for (let k = 1; k <= 7; k++) { const t = k / 7, n: V3 = [V0 - Math.sin(t * 1.4) * 40, U + 4 + t * 6, Z + 26 + t * 64]; Lb.palo(q, n, 7 - k * 0.6, { mat: MA, r1: 7 - (k + 1) * 0.6, tono: 0.02 }); q = n; }
      const c = Lb.sub(q[0], q[1], q[2], 0); c.poli([[-2, -6, -6], [6, -6, -6], [-2, 6, -6], [6, 6, -6], [-20, -4, 2], [-20, 4, 2], [0, -5, 6], [0, 5, 6]], { mat: MA, tono: 0.06 }); c.poli([[-2, -5, -8], [4, -5, -8], [-2, 5, -8], [4, 5, -8], [-18, -3, -6], [-18, 3, -6], [-2, -4, -4], [-2, 4, -4]], { mat: MA }); c.elip(-8, 5, 2, 2, 1, 1.6, { mat: RU, tono: 0.2 }); c.elip(-8, -5, 2, 2, 1, 1.6, { mat: RU, tono: 0.2 });
      for (const s of [-1, 1]) c.palo([2, s * 4, 5], [12, s * 7, 18], 1.6, { mat: MA, r1: 0.3 }); for (let k = 0; k < 4; k++) c.palo([-16 + k * 4, 3, -5], [-16 + k * 4, 3.4, -9], 0.6, { mat: 'mu_hueso', r1: 0.1 });
      c.elip(-6, 0, 7, 10, 6, 2.4, { mat: NI }); carambanos(c, -18, 0, 4, -6, 5, 12);
      c.cil(6, 0, 8, 4, 2, { mat: FE, r1: 7 }); for (let k = 0; k < 6; k++) { const t = (k / 6) * TAU; c.palo([6 + Math.cos(t) * 5, Math.sin(t) * 5, 9], [6 + Math.cos(t) * 8, Math.sin(t) * 8, 20], 0.7, { mat: FE }); }
      for (let k = 0; k < 4; k++) llama(c, 6 + (a.r() - 0.5) * 4, (a.r() - 0.5) * 4, 11, 4.4, 18 + a.r() * 6, f, 4, k); }
    // el mástil partido y la vela con la escarcha
    Lb.palo([-20, U, Z + 20], [-26, U + 2, Z + 110], 4.4, { mat: MA, r1: 3.6 });
    for (let k = 0; k < 5; k++) { const x0 = -86 + k * 22; Lb.poli([[x0, U + 6, Z + 104], [x0 + 22, U + 6, Z + 106], [x0, U + 8, Z + 104], [x0 + 22, U + 8, Z + 106], [x0 + 6, U + 10, Z + 46 + (k % 3) * 8], [x0 + 26, U + 12, Z + 52], [x0 + 6, U + 12, Z + 46 + (k % 3) * 8], [x0 + 26, U + 14, Z + 52]], { mat: k % 2 ? 'mon_hr_rojo' : 'mon_hr_crudo', tono: -0.04 }); for (let j = 0; j < 3; j++) Lb.elip(x0 + 6 + a.r() * 14, U + 12, Z + 60 + a.r() * 40, 5 + a.r() * 4, 1.4, 3 + a.r() * 3, { mat: NI, tono: 0.05 }); }
    Lb.palo([-96, U + 6, Z + 106], [26, U + 6, Z + 108], 2, { mat: MA });
    carambanos(Lb, V0 + 20, V1 - 40, U + 18, Z + 4, 18, 34);
    // el hielo que lo traga donde entra en la pared: lenguas de hielo sobre el casco
    for (let k = 0; k < 4; k++) { const x = -10 + k * 22; Lb.elip(x, U + 8, Z + 14 + (a.r() - 0.5) * 8, 20 + a.r() * 8, 22, 18 + a.r() * 6, { mat: 'mon_hr_pared', tono: 0.06 }); }
  }
  // ------------------------------------------------------------ la portada de los jarls, metida en la base del hielo
  const UF = 214;
  {
    // el macizo de granito oscuro que la sostiene, hundido en la pared de hielo, con el arco de medio punto tallado en tres roscas
    tronco(F, 0, 186, 0, 214, 176, 60, 160, 50, { mat: GR });
    nieveSobre(F, -76, 76, 168, 206, 214, 8); carambanos(F, -80, 80, 212, 206, 14, 30);
    // el vano: jambas rectas hasta 112 y el arco de medio punto encima; lo hondo azul que sale de adentro
    const AR = 38, ZA = 112;
    F.caja(0, UF - 34, 0, AR * 2, 80, ZA, { mat: GR, resta: true }); F.sub(0, UF - 34, ZA, 0, 90, 'x').cil(0, 0, -40, AR, 80, { mat: GR, resta: true });
    F.caja(0, UF - 72, 0, AR * 2, 2, ZA + AR, { mat: 'mon_hr_aliento', tono: 0.05 + p * 0.08 });
    for (let i = 0; i < 7; i++) F.caja(0, UF - 10 - i * 8, 8 - i * 1.6, AR * 2 - 4, 8, 2, { mat: SE, tono: -0.1 - i * 0.04 });
    for (let k = 0; k < 6; k++) F.elip((a.r() - 0.5) * 50, UF - 46 + a.r() * 30, 10 + a.r() * 30, 14 + a.r() * 8, 10, 8, { mat: 'mon_hr_aliento', tono: 0.2 + a.r() * 0.15 });
    // las tres roscas del arco, claras sobre lo oscuro, y las jambas escalonadas
    for (let r = 0; r < 3; r++) { const R0 = AR + 4 + r * 9, uu = UF - 2 + r * 0.01 - r * 5; aro(F.sub(0, uu, 0), 0, ZA, R0, 3.6, 'mon_hr_claro', 0, Math.PI, 24, 0, -r * 0.05); for (const s of [-1, 1]) F.caja(s * R0, uu, 0, 7, 7, ZA, { mat: 'mon_hr_claro', tono: -r * 0.05 }); }
    // la sierpe grande que da la vuelta al arco: gruesa, clara, con la cabeza abajo a la izquierda y la cola anudada a la derecha
    { let q: V3 | null = null; const R = AR + 34; for (let k = 0; k <= 46; k++) { const t = k / 46, ang = Math.PI * (1 - t), r2 = R + Math.sin(t * TAU * 4) * 5, n: V3 = [Math.cos(ang) * r2 * (t < 0.04 || t > 0.96 ? 1 : 1), UF + 4, ZA + Math.sin(ang) * r2 - (t < 0.12 ? (0.12 - t) * 500 : t > 0.88 ? (t - 0.88) * 500 : 0)]; if (q) { F.palo(q, n, 5.4, { mat: 'mon_hr_claro', tono: k % 3 === 0 ? -0.12 : 0.08 }); if (k % 2) F.palo([q[0], q[1] + 4, q[2]], [n[0], n[1] + 4, n[2]], 1.4, { mat: 'mon_hr_oscuro' }); } q = n; }
      const hz = ZA + Math.sin(Math.PI) * R - 60; const c = F.sub(-R, UF + 6, Math.max(20, hz)); c.poli([[-7, -4, -2], [7, -4, -2], [-7, -4, 12], [7, -4, 12], [-4, 14, 0], [4, 14, 0], [-4, 12, 8], [4, 12, 8]], { mat: 'mon_hr_claro', tono: 0.1 }); for (const e of [-1, 1]) c.elip(e * 4.6, 6, 9, 1.4, 1.8, 1.2, { mat: RU, tono: 0.2 }); for (let k = 0; k < 3; k++) c.palo([-3 + k * 3, 13, 1], [-3 + k * 3, 14, -3], 0.6, { mat: 'mu_hueso', r1: 0.1 });
      for (let k = 0; k < 3; k++) aro(F.sub(R + 2, UF + 6, 0), 0, 34 + k * 9, 6 - k, 2.2, 'mon_hr_claro', 0, TAU, 12); }
    // las runas que brillan en el intradós y las jambas
    for (let k = 0; k < 9; k++) { const ang = (k / 8) * Math.PI; F.elip(Math.cos(ang) * (AR + 13), UF + 4.6, ZA + Math.sin(ang) * (AR + 13), 2.6, 0.8, 2.6, { mat: RU, tono: -0.05 + p * 0.12 }); }
    for (const s of [-1, 1]) for (let k = 0; k < 6; k++) F.elip(s * (AR + 13), UF + 4.6, 14 + k * 16, 2.4, 0.8, 3, { mat: RU, tono: -0.05 + p * 0.12 });
    // el portón abierto hacia adentro, con las runas encendidas
    for (const s of [-1, 1]) { const c = F.sub(s * AR, UF - 10, 0, s * 66); c.caja(-s * 18, 0, 0, 36, 7, 112, { mat: MA, tono: -0.04 }); for (const z of [18, 56, 94]) c.caja(-s * 18, 4, z, 38, 1.4, 5, { mat: FE }); for (let k = 0; k < 5; k++) c.elip(-s * 18, 4.4, 26 + k * 17, 3, 0.6, 4, { mat: RU, tono: -0.1 + p * 0.15 }); }
    // el arco de hielo que el glaciar echó encima de la portada, con sus carámbanos
    { const R = 96; for (let k = 0; k < 18; k++) { const t0 = (k / 18) * Math.PI, t1 = ((k + 1) / 18) * Math.PI; F.palo([Math.cos(t0) * R, 196, 150 + Math.sin(t0) * R * 0.6], [Math.cos(t1) * R, 196, 150 + Math.sin(t1) * R * 0.6], 13, { mat: SE, tono: 0.04 }); }
      F.elip(0, 194, 150 + R * 0.6 + 8, 60, 14, 8, { mat: NI }); carambanos(F, -90, 90, 208, 150 + R * 0.4, 16, 40); }
    // las hachas cruzadas del jarl con el escudo, sobre la clave, y las antorchas de la cara
    for (const s of [-1, 1]) { const p0: V3 = [s * 64, UF + 4, 176], p1: V3 = [-s * 22, UF + 6, 260]; F.palo(p0, p1, 3.6, { mat: MA, r1: 3 }); const c = F.sub(p1[0], p1[1], p1[2]); c.poli([[s * 2, -2.6, 5], [s * 2, 2.6, 5], [s * 2, -2.6, -11], [s * 2, 2.6, -11], [-s * 24, -1.2, 14], [-s * 24, 1.2, 14], [-s * 24, -1.2, -20], [-s * 24, 1.2, -20]], { mat: FE, tono: 0.06 }); c.palo([-s * 23, 2, 14], [-s * 23, 2, -20], 1, { mat: 'acero', tono: 0.2 }); }
    F.sub(0, UF + 8, 214, 0, 90, 'x').cil(0, 0, 0, 22, 4, { mat: MA, tono: 0.04 }); aro(F.sub(0, UF + 12, 0), 0, 214, 21, 1.8, FE, 0, TAU, 24); F.sub(0, UF + 12, 214, 0, 90, 'x').cil(0, 0, 0, 6, 5, { mat: BR, r1: 3 });
    for (const s of [-1, 1]) { const x = s * 80; F.palo([x, UF - 26, 110], [x, UF - 8, 118], 1.6, { mat: FE }); F.cil(x, UF - 6, 114, 3, 6, { mat: FE, r1: 5 }); for (let k = 0; k < 3; k++) llama(F, x + (a.r() - 0.5) * 3, UF - 6 + (a.r() - 0.5) * 3, 120, 3, 12 + a.r() * 4, f, 4, k + 10); }
    for (let k = 0; k < 5; k++) F.elip((a.r() - 0.5) * 70, UF + 6 + a.r() * 10, 0.3, 10 + a.r() * 8, 5, 0.6, { mat: NI, giro: a.r() * 180 });
    calavera(F.sub(-24, UF + 10, 2, 120), 3.4, 'mu_hueso', true, 0.05); calavera(F.sub(30, UF + 8, 2, 60), 3.4, 'mu_hueso', false, 0);
  }
  void cadena; void letras; void grieta; void derrumbe; void RO;
  return {
    der: { c: [0, UF - 30, 50] as V3, r: 90 + p * 14, color: '#6ad0ff' },
    izq: { c: [-180, 130, 300] as V3, r: 110 + p * 18, color: '#ffa040' },
    medio: { c: [0, UF - 4, 120] as V3, r: 80 + p * 10, color: '#ff9a40' },
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
  const k = 4.3, m = TA, LC = 'mon_hr_claro', OS = 'mon_hr_oscuro', cs: Comp[] = [], cl: Comp[] = [], ca: Comp[] = [], cb: Comp[] = [];
  bloque(g, 0, 0, 0, 130, 130, 16, { mat: GR, b: 2, j: 1 }); letras(g.sub(0, 65.4, 0), -52, 52, 0, 4, 2, RU, 4.6, 2);
  const S = g.esc(k).sub(0, 0, 16 / k);
  // las piernas con las botas y las vendas de cuero (casi todo bajo la cota y la capa)
  for (const sx of [-1, 1]) { cl.push(S.bu([sx * 3.8, 2.4, 1.4], [2.6, 4.4, 1.6]), S.hu([sx * 3.8, 0, 2], [sx * 4, 0, 19], 3, 2.7), S.hu([sx * 4, 0, 19], [sx * 4.4, -0.4, 33], 3.8, 3.4)); for (let i = 0; i < 4; i++) S.cil(sx * 3.9, 0, 4 + i * 3.6, 3.1 - i * 0.05, 1.2, { mat: 'mon_hr_piel', tono: 0.05 }); }
  // el cuerpo: pecho ancho, la panza bajo la cota
  cs.push(S.hu([0, 0, 34], [0, 0, 54], 7.6, 8.8), S.bu([0, 1.4, 49], [9, 6, 6.4]), S.bu([0, 1.6, 40], [7.6, 5.6, 6]), S.hu([0, 0, 56], [0, 0.6, 60], 2.8, 2.6));
  // los brazos: del hombro al codo y del codo al pomo de la espada (las dos manos encima, una sobre otra)
  const brazo = (sx: number, roto: boolean) => {
    ca.push(S.hu([sx * 8.6, -0.4, 55], [sx * 9.2, 2.6, 44.6], 3, 2.6));
    if (!roto) ca.push(S.hu([sx * 9.2, 2.6, 44.6], [sx * 2, 9.4, 42.4], 2.5, 2.1), S.bu([sx * 1.4, 10.2, 42.6 + (sx > 0 ? 1.6 : 0)], [2.2, 2.4, 2]));
  };
  brazo(-1, viejo); brazo(1, false);
  S.masa(cl, { mat: m, suave: 0.6 }); S.masa(cs, { mat: m, suave: 0.8 }); S.masa(ca, { mat: m, suave: 0.5 });
  for (const sx of [-1, 1]) if (!(viejo && sx < 0)) S.sub(sx * 5.4, 6.4, 43.4, sx * -45, 70, 'y').cil(0, 0, -2, 2.6, 4, { mat: 'mon_hr_piel', tono: 0.1 });
  // la cota de malla: hasta las rodillas, partida adelante, con las hileras de anillos marcadas, y el cinto
  tronco(S, 0, 0, 16, 40, 21, 13.4, 18, 11.4, { mat: m, tono: -0.08 }); S.caja(0, 6.4, 16, 2, 1.4, 14, { mat: m, resta: true });
  for (let i = 0; i < 9; i++) { const z = 18 + i * 2.4; S.caja(0, 0, z, 30, 20, 0.18, { mat: m, resta: true }); }
  S.caja(0, 0, 38.6, 20.4, 13.2, 2.6, { mat: 'mon_hr_piel', tono: 0.12 }); S.caja(0, 6.8, 38.6, 3.4, 1, 2.6, { mat: BR });
  // la capa que cae detrás hasta el pedestal, con sus pliegues, y el manto de pieles sobre los hombros que baja por la espalda
  S.poli([[-15, -4, 59], [15, -4, 59], [-15, -8, 58], [15, -8, 58], [-17, -8, 0.4], [17, -8, 0.4], [-17, -13, 0.4], [17, -13, 0.4]], { mat: OS });
  for (const sx of [-1, 1]) S.poli([[sx * 9, -4, 59], [sx * 15.4, -4, 58], [sx * 9, 4, 58], [sx * 15.4, 3, 56], [sx * 12, -6, 30], [sx * 17, -8, 20], [sx * 12.6, 1, 34], [sx * 16.6, -2, 24]], { mat: OS, tono: 0.04 });
  for (let i = 0; i < 8; i++) S.palo([-15 + i * 4.3, -13.4, 2], [-12 + i * 3.4, -8.8, 56], 1.1, { mat: OS, resta: true });
  for (let i = 0; i < 16; i++) { const t = (i / 15) * Math.PI * 1.1 - 0.05, r0 = 9.6 + (i % 3) * 0.6; S.elip(Math.cos(t) * r0, -Math.sin(t) * 3.4 + 1, 57.4 + (i % 2) * 1.2, 3.4, 3.2, 2.8, { mat: 'mon_hr_piel', tono: (i % 3) * 0.04 }); }
  for (let i = 0; i < 8; i++) S.elip(-8 + (i % 4) * 5.4, -6.8, 52 - Math.floor(i / 4) * 5, 3.2, 2, 3, { mat: 'mon_hr_piel', tono: 0.02 });
  // la espada clavada: la hoja hundida en el pedestal, la cruz, el puño y el pomo bajo las manos
  S.poli([[-1.8, 10, 36], [1.8, 10, 36], [-1.8, 10.8, 36], [1.8, 10.8, 36], [-0.4, 10, -2], [0.4, 10, -2], [-0.4, 10.8, -2], [0.4, 10.8, -2]], { mat: 'acero', tono: 0.06 });
  S.palo([-7, 10.4, 36.6], [7, 10.4, 36.6], 1, { mat: FE, r1: 0.7 }); S.palo([0, 10.4, 37], [0, 10.4, 41.6], 0.9, { mat: 'mon_hr_piel' }); S.esf(0, 10.4, viejo ? 42.6 : 45.6, 1.6, { mat: BR });
  // la cabeza, apenas baja: la cara de hombre gastada por el viento
  const C = S.sub(0, 1.2, 64.4, 0, 8);
  C.elip(0, -0.4, 0, 3.8, 4.2, 4.8, { mat: LC });
  C.poli([[-3.4, 3.2, 2.6], [3.4, 3.2, 2.6], [-3.2, 4, 1.4], [3.2, 4, 1.4], [-3, 2.6, 3.6], [3, 2.6, 3.6], [-2.8, 3.4, 2.2], [2.8, 3.4, 2.2]], { mat: LC, tono: 0.04 });
  for (const sx of [-1, 1]) { C.elip(sx * 1.6, 3.4, 0.9, 1, 0.5, 0.55, { mat: LC, tono: -0.28 }); C.elip(sx * 3.7, 0.4, 0, 0.7, 1.2, 1.4, { mat: LC }); }
  C.poli([[-0.7, 3.8, 1.6], [0.7, 3.8, 1.6], [-0.7, 3.4, 1.6], [0.7, 3.4, 1.6], [-1.2, 5.6, -1.8], [1.2, 5.6, -1.8], [-1.1, 4.2, -2.2], [1.1, 4.2, -2.2]], { mat: LC, tono: 0.05 });
  // el bigote que cae y la barba larga que baja por el pecho en dos trenzas con sus anillos
  for (const sx of [-1, 1]) C.palo([sx * 0.4, 4.8, -2.6], [sx * 3.2, 4.2, -5.6], 0.9, { mat: LC, r1: 0.4, tono: 0.02 });
  cb.push(C.bu([0, 3.4, -4.6], [3.4, 2, 3]), C.hu([0, 3.8, -5], [0, 4.8, -11.6], 3.2, 2.4));
  C.masa(cb, { mat: LC, suave: 0.6 });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) C.palo([sx * (1.8 - i * 0.05), 5.4 + i * 0.4, -11.6 - i * 1.9], [sx * (1.7 - i * 0.05), 5.8 + i * 0.4, -13.1 - i * 1.9], 1.2 - i * 0.07, { mat: LC, tono: (i % 2) * 0.05 });
  for (let i = 0; i < 6; i++) C.palo([-2 + i * 0.8, 4.6, -6], [-2.4 + i * 0.96, 5, -10], 0.3, { mat: LC, resta: true });
  for (const sx of [-1, 1]) C.cil(sx * 1.5, 4.9, -21.8, 1.1, 1, { mat: BR });
  // el yelmo cónico con su banda, el nasal y las carrilleras
  C.cil(0, -0.4, 1.6, 4.4, 8.4, { mat: LC, r1: 0.5, tono: 0.02 }); C.cil(0, -0.4, 1.4, 4.6, 1.2, { mat: LC, tono: 0.14 }); for (let i = 0; i < 4; i++) { const t = (i / 4) * TAU + 0.4; C.palo([Math.cos(t) * 4.4, -0.4 + Math.sin(t) * 4.4, 1.6], [Math.cos(t) * 0.6, -0.4 + Math.sin(t) * 0.6, 9.6], 0.4, { mat: LC, tono: 0.16 }); }
  C.caja(0, 4.1, -0.8, 1, 0.9, 3.6, { mat: LC, tono: 0.12 }); for (const sx of [-1, 1]) C.caja(sx * 3.7, 0.6, -1.8, 0.8, 3.4, 4, { mat: LC, tono: 0.08 });
  // la nieve en el yelmo, el manto y los antebrazos; los carámbanos de la barba y de los brazos
  C.elip(0, -0.4, 4.6, 3, 3, 1.2, { mat: NI }); for (const sx of [-1, 1]) S.elip(sx * 9.6, -1, 60, 4.4, 4, 1.4, { mat: NI }); S.elip(0, 10.2, 44.6, 2.4, 2.4, 0.8, { mat: NI });
  for (let i = 0; i < 7; i++) S.palo([-5 + i * 1.7, 5.6 + (i % 2), 42], [-5 + i * 1.7, 5.8 + (i % 2), 38.6 - (i % 3)], 0.35, { mat: SE, r1: 0.05 });
  if (viejo) {
    // el que se partió: le falta el antebrazo izquierdo (caído al pie, con la mano todavía cerrada), una raja le cruza el pecho
    grieta(S.sub(3, 7, 0), 0, 0, 18, 56, m); S.caja(-6, 4, 56, 7, 6, 6, { mat: m, resta: true, giro: 20, incl: 30 });
    const P = g.sub(-34, 44, 16.6, 30); P.palo([0, 0, 4], [32, 6, 6], 8.4, { mat: m, r1: 7 }); P.esf(36, 7, 6, 8, { mat: m }); P.elip(16, 3, 12, 14, 8, 2, { mat: NI });
    for (let i = 0; i < 5; i++) bloque(g, -40 + i * 9, 54 + (i % 2) * 6, 16, 6 + i, 5, 4, { mat: m, giro: i * 30, b: 0.6, j: 0.4 });
  }
  g.elip(0, 0, 16.2, 60, 60, 3, { mat: NI, tono: -0.04 }); g.elip(30, -20, 17, 26, 18, 6, { mat: NI });
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
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -18);
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
void ruido; void cristal;
