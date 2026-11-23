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
  // ------------------------------------------------------------ el glaciar: la lengua de hielo que baja de atrás (más alta a la
  // izquierda) como un campo de alturas liso que se curva, con las grietas que la cruzan, y adelante la pared rota a plomo
  const alto = (v: number, u: number) => 228 + (20 - u) * 0.56 - v * 0.42 + Math.sin(v * 0.028 + u * 0.012) * 16 + Math.sin(u * 0.045 + 1) * 8 - Math.max(0, Math.abs(v) - 110) ** 1.5 * 0.09;
  const V0g = -210, V1g = 210, UF0 = 18, UB0 = -284;
  {
    const NV = 24, NU = 18, du = (UF0 - UB0) / NU, dv = (V1g - V0g) / NV, frente: number[] = [];
    for (let i = 0; i <= NV; i++) frente.push(UF0 + (a.r() - 0.5) * 16 + (i % 5 === 1 ? 10 : 0));
    for (let j = 0; j < NU; j++) for (let i = 0; i < NV; i++) {
      const v0 = V0g + i * dv, v1 = v0 + dv, u0 = UB0 + j * du, ult = j === NU - 1, u1a = ult ? frente[i] : u0 + du, u1b = ult ? frente[i + 1] : u0 + du;
      const h = (v: number, u: number) => alto(v, u) + (ult && u > UF0 - 6 ? (a.r() - 0.5) * 10 : 0);
      F.poli([[v0, u0, 0], [v1, u0, 0], [v0, u1a, 0], [v1, u1b, 0], [v0, u0, h(v0, u0)], [v1, u0, h(v1, u0)], [v0, u1a, h(v0, u1a)], [v1, u1b, h(v1, u1b)]], { mat: ult ? 'mon_hr_pared' : HI, tono: (a.r() - 0.5) * 0.04 });
    }
    // la pared de adelante: columnas que se adelantan, grietas negras azules entre ellas y la cornisa de nieve que cuelga
    for (let i = 1; i < NV; i++) {
      const v = V0g + i * dv, u = Math.min(frente[i], frente[i - 1] ?? frente[i]), hf = alto(v, u) - 6;
      F.poli([[v - 2.5, u - 40, 4], [v + 2.5, u - 40, 4], [v - 2.5, u + 3, 4], [v + 2.5, u + 3, 4], [v - 4, u - 40, hf], [v + 4, u - 40, hf], [v - 4, u + 3, hf - 4], [v + 4, u + 3, hf - 4]], { mat: 'mon_hr_grieta' });
    }
    for (let i = 0; i < NV; i++) { const vm = V0g + (i + 0.5) * dv, u = (frente[i] + frente[i + 1]) / 2, hf = alto(vm, u); F.elip(vm, u - 4, hf + 1, dv * 0.7, 12, 6, { mat: NI, tono: 0.02 }); carambanos(F, vm - dv / 2 + 3, vm + dv / 2 - 3, u + 6, hf - 4, 3, 36); }
    // las grietas que cruzan la lengua: tajos de azul casi negro con su labio de nieve, al ras de la superficie
    for (let k = 0; k < 14; k++) { const u = -260 + (k % 7) * 38 + (a.r() - 0.5) * 10, v = (k < 7 ? -110 : 90) + (a.r() - 0.5) * 120, L = 50 + a.r() * 60, gi = 8 + (a.r() - 0.5) * 16; F.caja(v, u, alto(v, u) - 16, L, 5, 17.5, { mat: 'mon_hr_grieta', giro: gi }); F.elip(v, u + 4, alto(v, u + 4) + 0.6, L * 0.5, 3, 1.6, { mat: NI, giro: gi }); }
    // los seracs del borde, a la izquierda (lo alto de un lado): torres de hielo ladeadas de cantos rotos
    for (let k = 0; k < 6; k++) { const v = -230 + k * 34 + (a.r() - 0.5) * 16, u = -40 + a.r() * 40, z0 = alto(v, u) - 10, s2 = 14 + a.r() * 8; F.poli([[v - s2, u - s2, z0], [v + s2, u - s2, z0], [v - s2, u + s2, z0], [v + s2, u + s2, z0], [v - s2 * 0.4, u - s2 * 0.5, z0 + 40 + a.r() * 40], [v + s2 * 0.7, u - s2 * 0.2, z0 + 30 + a.r() * 26], [v - s2 * 0.6, u + s2 * 0.5, z0 + 24], [v + s2 * 0.3, u + s2 * 0.4, z0 + 50 + a.r() * 30]], { mat: SE, tono: (a.r() - 0.5) * 0.12 }); F.elip(v, u, z0 + 50, 10, 10, 3, { mat: NI }); }
    // los trozos que se desplomaron al pie de la pared
    for (let k = 0; k < 9; k++) { const v = -230 + k * 58 + (a.r() - 0.5) * 30, u = 36 + a.r() * 26, s2 = 12 + a.r() * 16; if (Math.abs(v) < 150) continue; F.poli([[v - s2, u - s2 * 0.7, 0], [v + s2 * 0.8, u - s2, 0], [v - s2 * 0.9, u + s2 * 0.8, 0], [v + s2, u + s2 * 0.6, 0], [v - s2 * 0.5, u - s2 * 0.3, s2 * 1.6 + a.r() * 10], [v + s2 * 0.6, u - s2 * 0.6, s2 * 1.2], [v - s2 * 0.7, u + s2 * 0.5, s2 * 1.4], [v + s2 * 0.4, u + s2 * 0.2, s2 * 1.9 + a.r() * 12]], { mat: SE, tono: (a.r() - 0.5) * 0.1 }); }
  }
  // el pie de basalto, con la escarcha, a los costados del frente
  for (let k = -6; k <= 6; k++) { if (Math.abs(k) < 4) continue; const x = k * 38 + (a.r() - 0.5) * 12; bloque(F, x, 40 + (a.r() - 0.5) * 16, 0, 36 + a.r() * 20, 30 + a.r() * 16, 18 + a.r() * 26, { mat: RO, giro: (a.r() - 0.5) * 30, b: 3, j: 2 }); }
  derrumbe(F, 14, -170, 70, 40, 16, 16, RO); derrumbe(F, 10, 180, 66, 30, 12, 14, RO);
  // ------------------------------------------------------------ el barco del último jarl, preso adentro del hielo: la popa hundida
  // en la masa, el casco ladeado que atraviesa la pared y la proa de dragón que sale a la izquierda con su faro
  {
    const Lb = F.sub(-80, -56, 226, -40, -10, 'y'), U = 0, Z = 0, V0 = -180, V1 = 160;
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
      // la talla: dos sierpes entrelazadas que suben por la jamba (bandas en relieve que se cruzan), con las runas que brillan
      // frío en los ojos del lazo, y la cabeza de cada sierpe arriba mordiendo el capitel
      for (const fase of [0, Math.PI]) { let q: V3 | null = null; for (let k = 0; k <= 30; k++) { const z = 10 + k * 5.2, n: V3 = [x + Math.sin(k * 0.42 + fase) * 10, UF + 4.6 + Math.cos(k * 0.42 + fase) * 0.8, z]; if (q) F.palo(q, n, 2.2, { mat: TA, tono: 0.14 }); q = n; }
        F.elip(x + Math.sin(30 * 0.42 + fase) * 10, UF + 6, 166, 4, 3.4, 3, { mat: TA, tono: 0.16 }); F.elip(x + Math.sin(30 * 0.42 + fase) * 10 + 1.6, UF + 8.6, 167, 0.8, 0.4, 0.8, { mat: RU, tono: 0.2 }); }
      for (let k = 0; k < 8; k++) { const z = 10 + (k * 2 + 1) * 3.74 * 2.0; F.elip(x, UF + 3.4, z + 6, 2.6, 0.8, 2.6, { mat: RU, tono: -0.05 + p * 0.12 }); }
      F.caja(x, UF + 3.8, 0, 32, 1.6, 6, { mat: TA, tono: 0.12 }); nieveSobre(F, x - 16, x + 16, UF - 14, UF + 4, 180, 3);
      F.elip(x, UF + 4.2, 156, 5, 1.4, 4, { mat: RU, tono: 0.1 }); F.caja(x, UF + 4.6, 150, 8, 1, 2, { mat: 'negro' });
      carambanos(F, x - 16, x + 16, UF + 6, 178, 5, 20);
    }
    // el dintel con la inscripción, y encima las dos hachas cruzadas del jarl con el escudo en la cruz
    F.caja(0, UF - 6, 180, 150, 26, 30, { mat: TA, tono: 0.06 }); letras(F.sub(0, UF + 7.2, 0), -40, 40, 0, 190, 1, RU, 4.6, 2);
    // la sierpe del dintel: corre de punta a punta en lazos, con su cabeza a la izquierda y la cola anudada a la derecha
    { let q: V3 | null = null; for (let k = 0; k <= 40; k++) { const t = k / 40, x = -70 + t * 140, z = 186 + Math.sin(t * TAU * 3) * 6 + (Math.abs(x) < 44 ? 0 : 6), n: V3 = [x, UF + 7.4 + Math.cos(t * TAU * 3) * 1, Math.abs(x) < 44 ? (z > 190 ? 204 : z) : z]; if (q) F.palo(q, n, 2, { mat: TA, tono: 0.15 }); q = n; }
      F.elip(-72, UF + 9, 194, 6, 4, 4, { mat: TA, tono: 0.16 }); F.elip(-76, UF + 12, 196, 1, 0.5, 1, { mat: RU, tono: 0.2 }); for (let k = 0; k < 3; k++) F.palo([-78, UF + 11, 191], [-78 - k * 2, UF + 12, 187], 0.5, { mat: 'mu_hueso', r1: 0.1 }); }
    nieveSobre(F, -72, 72, UF - 18, UF + 6, 210, 8); carambanos(F, -74, 74, UF + 8, 180, 16, 26);
    // el portón: las dos hojas de roble y hierro abiertas hacia adentro, con las runas encendidas de azul
    for (const s of [-1, 1]) { const c = F.sub(s * 34, UF - 6, 0, s * 62); c.caja(-s * 18, 0, 0, 36, 7, 124, { mat: MA, tono: -0.04 }); for (const z of [20, 62, 104]) c.caja(-s * 18, 4, z, 38, 1.4, 5, { mat: FE }); for (let k = 0; k < 5; k++) c.elip(-s * 18, 4.4, 30 + k * 18, 3, 0.6, 4, { mat: RU, tono: -0.1 + p * 0.15 }); c.elip(-s * 18, 4, 128, 18, 5, 4, { mat: NI }); }
    // las cabezas de dragón talladas que salen de las esquinas de arriba del frente
    for (const s of [-1, 1]) { const c = F.sub(s * 112, 196, 214, s * -20); c.palo([0, 0, -6], [0, 16, 10], 9, { mat: TA, r1: 6, tono: 0.06 }); c.poli([[-7, 14, 4], [7, 14, 4], [-7, 14, 18], [7, 14, 18], [-4, 40, 6], [4, 40, 6], [-4, 38, 14], [4, 38, 14]], { mat: TA, tono: 0.1 }); c.poli([[-6, 16, 2], [6, 16, 2], [-6, 16, -4], [6, 16, -4], [-3, 36, 2], [3, 36, 2], [-3, 34, -2], [3, 34, -2]], { mat: TA }); for (const e of [-1, 1]) { c.elip(e * 5.4, 24, 14, 1.6, 2, 1.4, { mat: RU, tono: 0.15 }); c.palo([e * 4, 18, 16], [e * 9, 6, 30], 1.8, { mat: TA, r1: 0.4 }); } c.elip(0, 14, 20, 12, 10, 4, { mat: NI }); carambanos(c, -4, 4, 30, 2, 3, 14); }
    // la cornisa del frente y las pilastras de los cantos
    F.caja(0, 120 - 14, 120, 262, 172, 6, { mat: TA, tono: 0.1 }); nieveSobre(F, -120, 120, 190, 200, 126, 6);
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
    izq: { c: [-250, 46, 330] as V3, r: 110 + p * 18, color: '#ffa040' },
    medio: { c: [0, UF - 4, 130] as V3, r: 80 + p * 10, color: '#ff9a40' },
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
  const k = 4.3, m = TA, cs: Comp[] = [], cl: Comp[] = [], ca: Comp[] = [], cb: Comp[] = [];
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
  S.poli([[-11, -5, 58], [11, -5, 58], [-11, -8, 58], [11, -8, 58], [-15, -8, 0.4], [15, -8, 0.4], [-15, -12, 0.4], [15, -12, 0.4]], { mat: m, tono: -0.06 });
  for (let i = 0; i < 7; i++) S.palo([-12.6 + i * 4.2, -12.2, 2], [-9.6 + i * 3.2, -8.8, 56], 1, { mat: m, resta: true });
  for (let i = 0; i < 16; i++) { const t = (i / 15) * Math.PI * 1.1 - 0.05, r0 = 9.6 + (i % 3) * 0.6; S.elip(Math.cos(t) * r0, -Math.sin(t) * 3.4 + 1, 57.4 + (i % 2) * 1.2, 3.4, 3.2, 2.8, { mat: 'mon_hr_piel', tono: (i % 3) * 0.04 }); }
  for (let i = 0; i < 8; i++) S.elip(-8 + (i % 4) * 5.4, -6.8, 52 - Math.floor(i / 4) * 5, 3.2, 2, 3, { mat: 'mon_hr_piel', tono: 0.02 });
  // la espada clavada: la hoja hundida en el pedestal, la cruz, el puño y el pomo bajo las manos
  S.poli([[-1.8, 10, 36], [1.8, 10, 36], [-1.8, 10.8, 36], [1.8, 10.8, 36], [-0.4, 10, -2], [0.4, 10, -2], [-0.4, 10.8, -2], [0.4, 10.8, -2]], { mat: 'acero', tono: 0.06 });
  S.palo([-7, 10.4, 36.6], [7, 10.4, 36.6], 1, { mat: FE, r1: 0.7 }); S.palo([0, 10.4, 37], [0, 10.4, 41.6], 0.9, { mat: 'mon_hr_piel' }); S.esf(0, 10.4, viejo ? 42.6 : 45.6, 1.6, { mat: BR });
  // la cabeza, apenas baja: la cara de hombre gastada por el viento
  const C = S.sub(0, 1.2, 64.4, 0, 8);
  C.elip(0, -0.4, 0, 3.8, 4.2, 4.8, { mat: m });
  C.poli([[-3.4, 3.2, 2.6], [3.4, 3.2, 2.6], [-3.2, 4, 1.4], [3.2, 4, 1.4], [-3, 2.6, 3.6], [3, 2.6, 3.6], [-2.8, 3.4, 2.2], [2.8, 3.4, 2.2]], { mat: m, tono: 0.04 });
  for (const sx of [-1, 1]) { C.elip(sx * 1.6, 3.4, 0.9, 1, 0.5, 0.55, { mat: m, tono: -0.28 }); C.elip(sx * 3.7, 0.4, 0, 0.7, 1.2, 1.4, { mat: m }); }
  C.poli([[-0.7, 3.8, 1.6], [0.7, 3.8, 1.6], [-0.7, 3.4, 1.6], [0.7, 3.4, 1.6], [-1.2, 5.6, -1.8], [1.2, 5.6, -1.8], [-1.1, 4.2, -2.2], [1.1, 4.2, -2.2]], { mat: m, tono: 0.05 });
  // el bigote que cae y la barba larga que baja por el pecho en dos trenzas con sus anillos
  for (const sx of [-1, 1]) C.palo([sx * 0.4, 4.8, -2.6], [sx * 3.2, 4.2, -5.6], 0.9, { mat: m, r1: 0.4, tono: 0.02 });
  cb.push(C.bu([0, 3.4, -4.6], [3.4, 2, 3]), C.hu([0, 3.8, -5], [0, 4.8, -11.6], 3.2, 2.4));
  C.masa(cb, { mat: m, suave: 0.6 });
  for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) C.palo([sx * (1.6 - i * 0.05), 4.8 + i * 0.05, -11.6 - i * 1.9], [sx * (1.5 - i * 0.05), 4.9 + i * 0.05, -13.1 - i * 1.9], 1 - i * 0.07, { mat: m, tono: (i % 2) * 0.05 });
  for (let i = 0; i < 6; i++) C.palo([-2 + i * 0.8, 4.6, -6], [-2.4 + i * 0.96, 5, -10], 0.3, { mat: m, resta: true });
  for (const sx of [-1, 1]) C.cil(sx * 1.5, 4.9, -21.8, 1.1, 1, { mat: BR });
  // el yelmo cónico con su banda, el nasal y las carrilleras
  C.cil(0, -0.4, 1.6, 4.4, 5.6, { mat: m, r1: 0.8, tono: 0.1 }); C.cil(0, -0.4, 1.4, 4.6, 1.2, { mat: m, tono: 0.14 }); for (let i = 0; i < 4; i++) { const t = (i / 4) * TAU + 0.4; C.palo([Math.cos(t) * 4.4, -0.4 + Math.sin(t) * 4.4, 1.6], [Math.cos(t) * 0.9, -0.4 + Math.sin(t) * 0.9, 7], 0.4, { mat: m, tono: 0.16 }); }
  C.caja(0, 4.1, -0.8, 1, 0.9, 3.6, { mat: m, tono: 0.12 }); for (const sx of [-1, 1]) C.caja(sx * 3.7, 0.6, -1.8, 0.8, 3.4, 4, { mat: m, tono: 0.08 });
  // la nieve en el yelmo, el manto y los antebrazos; los carámbanos de la barba y de los brazos
  C.elip(0, -0.4, 6.2, 2.6, 2.6, 1.2, { mat: NI }); for (const sx of [-1, 1]) S.elip(sx * 9.6, -1, 60, 4.4, 4, 1.4, { mat: NI }); S.elip(0, 10.2, 44.6, 2.4, 2.4, 0.8, { mat: NI });
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
