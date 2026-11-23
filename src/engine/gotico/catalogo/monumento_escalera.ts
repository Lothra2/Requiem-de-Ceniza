import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';
import { G, raiz, bajoTierra, bloque, llama, figuraVelada, letras, cascotes } from '../kit_muerte';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { aro, tronco } from './monumentos_kit2';
void figuraVelada;

/**
 * La Escalera al Trono (acto 7, el Jardín de los que Intentaron; baja a `a7_escaleras`). Canon: arriba está Aun-Saar, el Dios
 * Sediento; hace cuarenta años el cielo se rajó un dedo y subieron siete marcados, y la escalera es por donde subieron. No es un
 * edificio: es una escalera de caracol de losas de mármol sueltas que flotan alrededor de un haz de luz seca, sin muro y sin
 * baranda, que sube y sube hasta un halo de oro partido donde el cielo se rajó. Cada losa lleva un nombre grabado (los de los
 * que subieron antes); la última está en blanco. Abajo, el estrado redondo en tres gradas, el oro que se derramó seco por las
 * gradas como cera, y la puerta: un aro de oro parado, del alto de cinco hombres, con la luz blanca adentro y la escalinata que
 * baja. A los lados del aro, dos alas de mármol que se abren como las de un ángel al que le sacaron el cuerpo.
 *
 * Sueltos en el atrio (monumentos.ts): las estelas de los siete con sus nombres y su estrella (`mon_es_estela`), los
 * braseros de fuego blanco (`mon_es_brasero`), el bastón y el manto del séptimo al pie (`mon_es_septimo`) y las losas que se
 * cayeron de la escalera con su nombre (`mon_es_losas`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Mármol blanco con vetas de oro gris, lo que mira arriba gastado. */
M.mon_es_marmol = {
  rampa: ['#1c1a17', '#2f2c27', '#47433b', '#615c52', '#7d776b', '#999284', '#b5ad9d', '#cec7b6', '#e3ddcd', '#f2ede0'], ruido: 0.12, escala: 0.16,
  patron: (p, n) => (n[2] > 0.6 ? 0.12 : 0) + (Math.abs(Math.sin(p[0] * 0.03 + p[2] * 0.05 + ruido(p[0] * 0.02, p[1] * 0.02, p[2] * 0.02) * 6)) < 0.05 ? -0.3 : 0) + (ruido(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04) - 0.5) * 0.14,
};
M.mon_es_oro = { rampa: ['#1e1204', '#3a2408', '#5c3a0e', '#835616', '#aa7420', '#cc952e', '#e6b648', '#f6d270', '#fff0b0'], ruido: 0.18, escala: 0.3, brillo: 0.85 };
M.mon_es_oro_seco = { rampa: ['#140c04', '#251708', '#3a250e', '#523516', '#6c471e', '#866028', '#9e7834'], ruido: 0.4, escala: 0.3, brillo: 0.3 };
M.mon_es_luz = { rampa: ['#6a5a30', '#9a8648', '#c8b468', '#e8d690', '#f8ecc0', '#fffbea'], ruido: 0.3, escala: 0.1, emite: true };
M.mon_es_blanco = { rampa: ['#c8c0a8', '#ddd6c0', '#ece6d4', '#f7f2e6', '#fffdf6'], ruido: 0.2, escala: 0.2, emite: true };
M.mon_es_cascara = { rampa: ['#1a1208', '#2c200e', '#423016', '#5a421e', '#735628', '#8c6a34'], ruido: 0.5, escala: 0.4, brillo: 0.2 };
M.mon_es_nube = { rampa: ['#3a3630', '#55504a', '#726c64', '#918a80', '#b0a99e', '#cdc6ba', '#e6e0d4'], ruido: 0.5, escala: 0.04 };
M.mon_es_sombra = { rampa: ['#000000', '#030303', '#070605', '#0b0a08', '#100e0c'], ruido: 0.1, escala: 0.2 };
const MA = 'mon_es_marmol', OR = 'mon_es_oro', OS = 'mon_es_oro_seco', LU = 'mon_es_luz', BL = 'mon_es_blanco';

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  const UC = -64;
  // ------------------------------------------------------------ el estrado: tres gradas redondas de mármol con el oro derramado
  for (let i = 0; i < 3; i++) {
    const R = 182 - i * 30, z = i * 14;
    F.cil(0, UC, z, R, 14, { mat: MA, tono: -i * 0.03 });
    F.cil(0, UC, z + 11.6, R + 1.5, 2.4, { mat: OR, tono: -0.1 }); F.cil(0, UC, z + 12, R - 4, 2.6, { mat: MA, tono: 0.04 });
    // el oro seco que se derramó por la grada como cera
    for (let k = 0; k < 10; k++) { const t = (k / 10) * TAU + i * 0.4 + a.r() * 0.3, L = 8 + a.r() * 10; if (Math.sin(t) > 0.62 && Math.abs(Math.cos(t)) < 0.3) continue; F.palo([Math.cos(t) * (R - 2), UC + Math.sin(t) * (R - 2), z + 14], [Math.cos(t) * (R + 2), UC + Math.sin(t) * (R + 2), z + 14 - L], 2.4 + a.r() * 2, { mat: OS, r1: 1.2 }); }
  }
  // el corro de los siete: siete columnas altas y gruesas de mármol en el borde del estrado, con su capitel de oro y la llama
  // blanca arriba; la del que no volvió está partida y su tambor caído
  for (let k = 0; k < 7; k++) {
    const t = Math.PI * 0.5 + 0.45 + (k / 7) * (TAU - 0.9), x = Math.cos(t) * 160, y = UC + Math.sin(t) * 160, rota = k === 4, h = rota ? 150 + a.r() * 40 : 330;
    bloque(F, x, y, 28, 40, 40, 14, { mat: MA, b: 1.4, j: 0.8 }); F.cil(x, y, 42, 17, 8, { mat: MA, r1: 15, tono: 0.04 });
    F.cil(x, y, 50, 14, h, { mat: MA, r1: 12 }); for (let j = 0; j < 10; j++) { const tt = (j / 10) * TAU; F.palo([x + Math.cos(tt) * 14, y + Math.sin(tt) * 14, 54], [x + Math.cos(tt) * 12, y + Math.sin(tt) * 12, 46 + h], 1.1, { mat: MA, resta: true }); }
    if (!rota) { F.cil(x, y, 50 + h, 12, 18, { mat: OR, r1: 21 }); F.caja(x, y, 68 + h, 44, 44, 8, { mat: OR, tono: -0.05 }); F.cil(x, y, 76 + h, 10, 10, { mat: OR, r1: 16 }); for (let j = 0; j < 3; j++) llama(F, x + (a.r() - 0.5) * 8, y + (a.r() - 0.5) * 8, 86 + h, 5.4, 26 + a.r() * 8, f, 4, k * 3 + j, 'mon_es_blanco'); }
    else { F.poli([[x - 14, y - 14, 50 + h], [x + 14, y - 14, 50 + h - 26], [x - 14, y + 14, 50 + h - 12], [x + 14, y + 14, 50 + h], [x, y, 50 + h + 20]], { mat: MA }); F.sub(x + 40, y + 24, 12, 30, 90, 'y').cil(0, 0, -50, 13, 100, { mat: MA }); }
  }
  // el pozo del haz: un anillo de oro en el centro del estrado
  F.cil(0, UC, 42, 62, 8, { mat: OR }); F.cil(0, UC, 44, 54, 8, { mat: BL, tono: 0.1 });
  // ------------------------------------------------------------ el haz de luz: el alma blanca angosta, hebras de luz y el polvo que sube
  const ZT = 600;
  F.cil(0, UC, 48, 9, ZT + 40, { mat: BL, r1: 5, tono: 0.15 }); for (let k = 0; k < 9; k++) { const t = (k / 9) * TAU, rr = 18 + (k % 3) * 9; F.palo([Math.cos(t) * rr, UC + Math.sin(t) * rr, 50], [Math.cos(t + 0.4) * rr * 0.6, UC + Math.sin(t + 0.4) * rr * 0.6, 60 + ZT], 1.1 - (k % 3) * 0.2, { mat: LU, r1: 0.4, tono: 0.05 }); }
  for (let k = 0; k < 60; k++) { const t = a.r() * TAU, rr = 10 + a.r() * 46, z = 60 + a.r() * ZT; F.esf(Math.cos(t) * rr, UC + Math.sin(t) * rr, z, 1.2 + a.r() * 1.8, { mat: k % 3 ? BL : OR, tono: 0.1 }); }
  // ------------------------------------------------------------ la escalera de caracol: losas grandes de mármol que flotan sueltas
  const NS = 40, VUELTAS = 1.9, T0 = Math.PI * 0.55;
  for (let i = 0; i < NS; i++) {
    const q = i / NS, t = T0 + q * VUELTAS * TAU, z = 60 + q * ZT, R = 150 - q * 30, x = Math.cos(t) * R, y = UC + Math.sin(t) * R;
    const g = F.sub(x, y, z, (t * 180) / Math.PI + 90, (a.r() - 0.5) * 6);
    // la losa: gruesa, de cantos rotos (un trozo arrancado de un lado), el canto de oro y el nombre grabado (la última en blanco)
    bloque(g, 0, 0, -16, 78, 38, 16, { mat: MA, b: 2.4, j: 1.6, tono: (a.r() - 0.5) * 0.06 });
    if (i % 3 === 1) g.poli([[30, -20, -18], [40, -20, -18], [30, 20, -18], [40, 20, -18], [36, -20, 1], [40, -20, 1], [26, 20, 1], [40, 20, 1]], { mat: MA, resta: true });
    g.caja(0, 19.4, -15, 78, 1, 4, { mat: OR, tono: -0.05 });
    if (i < NS - 1) letras(g.sub(0, 0, 0.1, 0, 90, 'x'), -24, 24, 0, -1.8, 1, OS, 4.4, 1.4);
    // la piedra que cuelga debajo (la losa se arrancó de la roca) y el polvo de oro que cae
    g.poli([[-20, -12, -16], [20, -12, -16], [-20, 12, -16], [20, 12, -16], [(a.r() - 0.5) * 10, (a.r() - 0.5) * 6, -44 - (i % 3) * 10]], { mat: MA, tono: -0.12 });
    if (i % 4 === 0) g.palo([-22, 8, -16], [-22, 8, -40 - a.r() * 20], 2, { mat: OS, r1: 0.6 });
    // la luz del haz que pega en la cara de adentro de la losa
    g.caja(0, -19.2, -12, 70, 0.8, 10, { mat: LU, tono: -0.4 });
    if (i % 7 === 3) { g.cil(14, 0, 0, 1.6, 7, { mat: 'cera', tono: -0.3 }); llama(g, 14, 0, 7, 1.2, 3.4, f, 4, i, 'mon_es_luz'); }
  }
  // losas sueltas fuera de la espiral, que se soltaron y flotan a la deriva, y las que cayeron al estrado
  for (let k = 0; k < 9; k++) { const t = 0.3 + k * 0.7 + a.r() * 0.3, R = 210 + a.r() * 50, z = 140 + a.r() * 400, g = F.sub(Math.cos(t) * R * 0.85, UC + Math.sin(t) * R * 0.75, z, a.r() * 360, 20 + a.r() * 70, k % 2 ? 'x' : 'y'); bloque(g, 0, 0, -10, 64, 32, 16, { mat: MA, b: 2.4, j: 1.6, tono: -0.02 }); g.poli([[24, -17, -11], [33, -17, -11], [24, 17, -11], [33, 17, -11], [30, -17, 7], [33, -17, 7], [18, 17, 7], [33, 17, 7]], { mat: MA, resta: true }); g.caja(0, 16.4, -9, 64, 1, 4, { mat: OR, tono: -0.05 }); g.poli([[-16, -10, -10], [16, -10, -10], [-16, 10, -10], [16, 10, -10], [(a.r() - 0.5) * 8, 0, -34]], { mat: MA, tono: -0.12 }); }
  for (let k = 0; k < 6; k++) { const t = -1.6 + k * 0.5 + a.r() * 0.2, R = 100 + a.r() * 40, g = F.sub(Math.cos(t) * R, UC + Math.sin(t) * R, 42, a.r() * 180, (a.r() - 0.5) * 30); bloque(g, 0, 0, -4, 70, 34, 14, { mat: MA, b: 2.4, j: 1.6, tono: -0.06 }); }
  // ------------------------------------------------------------ arriba: el anillo de oro macizo partido, la raja del cielo con sus nubes
  // y el Trono Sediento que se adivina en contraluz
  {
    const ZH = 60 + ZT + 80, H = F.sub(0, UC, ZH, 0, 52, 'x'), RH = 176;
    aro(H, 0, 0, RH, 20, OR, 0.42, TAU - 0.62, 56);
    aro(H, 0, 0, RH - 22, 6, OR, 0.6, TAU - 0.9, 44, 0, -0.12); aro(H, 0, 0, RH + 22, 5, OR, 0.5, TAU - 0.7, 48, 0, -0.08);
    // los bordes rotos: trozos de oro astillados en los dos cabos y los pedazos que caen
    for (const t0 of [0.42, TAU - 0.62]) for (let j = 0; j < 4; j++) { const t = t0 + (t0 < 1 ? -1 : 1) * j * 0.03; H.poli([[Math.cos(t) * (RH - 18), -10, Math.sin(t) * (RH - 18)], [Math.cos(t) * (RH + 18), -10, Math.sin(t) * (RH + 18)], [Math.cos(t) * (RH - 18), 10, Math.sin(t) * (RH - 18)], [Math.cos(t) * (RH + 18), 10, Math.sin(t) * (RH + 18)], [Math.cos(t + (t0 < 1 ? -0.08 : 0.08)) * (RH + (a.r() - 0.5) * 20), (a.r() - 0.5) * 16, Math.sin(t + (t0 < 1 ? -0.08 : 0.08)) * (RH + (a.r() - 0.5) * 20)]], { mat: OR, tono: 0.06 }); }
    for (let k = 0; k < 7; k++) { const x = RH * Math.cos(0.1) + (a.r() - 0.5) * 30, z = ZH - 50 - k * 70, s = 12 - k; F.poli([[x - s, UC - s, z], [x + s, UC - s, z + 4], [x - s, UC + s, z + 2], [x + s, UC + s, z], [x, UC, z + s * 1.6], [x + 2, UC + 2, z - s]], { mat: OR, tono: -0.05 }); }
    // la raja: la luz que sale. Detrás, la gloria (capas que se abren y se apagan hacia afuera); encima la herida en zigzag con el
    // alma blanca encendida, y los rayos que salen de ella hasta romper el borde del anillo
    for (let k = 0; k < 4; k++) F.sub(0, UC - 30 - k * 10, ZH - 10, 0, 90, 'x').cil(0, 0, 0, 40 + k * 32, 3, { mat: k < 2 ? BL : LU, tono: 0.1 - k * 0.14 });
    { const pts: [number, number][] = [[-8, -120], [14, -80], [-12, -40], [10, 0], [-14, 40], [8, 80], [-6, 110]];
      for (let k = 0; k < pts.length - 1; k++) { const [x0, z0] = pts[k], [x1, z1] = pts[k + 1], w0 = 3 + 14 * Math.sin((k / (pts.length - 1)) * Math.PI), w1 = 3 + 14 * Math.sin(((k + 1) / (pts.length - 1)) * Math.PI); F.palo([x0, UC + 4, ZH + z0], [x1, UC + 4, ZH + z1], w0 * 1.5, { mat: LU, r1: w1 * 1.5, tono: 0.05 }); F.palo([x0, UC + 6, ZH + z0], [x1, UC + 6, ZH + z1], w0 * 0.7, { mat: BL, r1: w1 * 0.7, tono: 0.25 }); }
      for (let k = 0; k < 16; k++) { const t = (k / 16) * TAU + 0.1, L = RH + 30 + (k % 3) * 26; F.palo([Math.cos(t) * 20, UC + 2, ZH + Math.sin(t) * 30], [Math.cos(t) * L, UC + 2 - (k % 2) * 20, ZH + Math.sin(t) * L * 0.8], 3 - (k % 3) * 0.7, { mat: k % 2 ? BL : LU, r1: 0.3, tono: 0.1 }); } }
    // las nubes: jirones largos y planos que se abren desde la raja hacia afuera, deshilachados en la punta, oscuros por arriba y
    // encendidos de oro por la panza del lado de la luz
    for (let k = 0; k < 11; k++) {
      const t = (k / 11) * TAU + 0.2, gi = (t * 180) / Math.PI;
      for (let j = 0; j < 4; j++) { const r0 = RH - 20 + j * 34 + (a.r() - 0.5) * 12, L = 46 - j * 8, cx = Math.cos(t) * r0, cz = ZH + Math.sin(t) * r0 * 0.75, y = UC - 60 + (a.r() - 0.5) * 20 - j * 6;
        const G2 = F.sub(cx, y, cz, 0, -gi, 'y'); G2.elip(0, 0, 3, L * 1.3, 20 - j * 3, 7 - j, { mat: 'mon_es_nube', tono: -0.05 - j * 0.06 }); G2.elip(-L * 0.12, 4, -4, L * 1.1, 16 - j * 3, 4, { mat: LU, tono: -0.15 - j * 0.08 });
        if (j === 3) for (let q = 0; q < 3; q++) G2.elip(L + 8 + q * 7, (q - 1) * 4, 0, 6 - q, 2, 1.2, { mat: 'mon_es_nube', tono: -0.2 }); } }
    // el trono, en contraluz detrás de la raja: el asiento, el respaldo alto con siete púas, los brazos con sus garras y la tarima;
    // el canto de cada pieza encendido de la luz de la raja
    const T = F.sub(-4, UC - 26, ZH - 100).esc(1), SO = 'mon_es_sombra';
    T.caja(0, 6, -16, 90, 70, 16, { mat: SO }); T.caja(0, 0, 0, 62, 46, 30, { mat: SO }); T.caja(0, -20, 30, 62, 10, 150, { mat: SO });
    for (let k = 0; k < 7; k++) T.poli([[-28 + k * 9.4, -24, 180], [-22 + k * 9.4, -24, 180], [-28 + k * 9.4, -16, 180], [-22 + k * 9.4, -16, 180], [-25 + k * 9.4, -20, 206 + (3 - Math.abs(k - 3)) * 16]], { mat: SO });
    for (const s of [-1, 1]) { T.caja(s * 34, 0, 30, 10, 44, 32, { mat: SO }); T.palo([s * 34, 22, 60], [s * 34, 30, 54], 3, { mat: SO, r1: 0.6 }); T.caja(s * 31, -14, 30, 1.4, 1.4, 150, { mat: LU, tono: 0.1 }); }
    T.caja(0, -14.6, 180, 62, 1.4, 1.4, { mat: LU, tono: 0.1 }); T.caja(0, 23.6, 30, 62, 1.4, 1.4, { mat: LU, tono: 0.05 });
  }
  // ------------------------------------------------------------ la puerta: el aro de oro parado delante del estrado y las alas de mármol
  const UF = 214, RA = 58;
  {
    // la boca: el hueco en el estrado que baja, con la escalinata y la luz blanca
    F.caja(0, UF - 40, 0, RA * 1.5, 80, 50, { mat: MA, tono: -0.05 });
    F.caja(0, UF - 34, 4, RA * 1.2, 70, 60, { mat: MA, resta: true });
    for (let i = 0; i < 7; i++) F.caja(0, UF - 8 - i * 9, 4 - i * 0.1, RA * 1.2 - 4, 9, 2, { mat: MA, tono: -0.05 - i * 0.05 });
    F.caja(0, UF - 72, 0, RA * 1.2, 2, 50, { mat: LU, tono: -0.3 + p * 0.06 });
    // el aro de oro, parado, con el disco de luz adentro y las letras del borde
    const A2 = F.sub(0, UF - 8, RA + 6);
    aro(A2, 0, 0, RA, 6, OR, 0, TAU, 48); aro(A2, 0, 0, RA - 10, 2.4, OR, 0, TAU, 40, 0, -0.1);
    A2.sub(0, -6, 0, 0, 90, 'x').cil(0, 0, -1, RA - 12, 2, { mat: LU, tono: -0.35 + p * 0.06 });
    for (let k = 0; k < 12; k++) { const t = (k / 12) * TAU; A2.palo([Math.cos(t) * (RA + 6), 0, Math.sin(t) * (RA + 6)], [Math.cos(t) * (RA + 20 + (k % 2) * 10), 0, Math.sin(t) * (RA + 20 + (k % 2) * 10)], 2.2, { mat: OR, r1: 0.4 }); }
    // las dos alas de mármol: plumas largas en abanico, una partida
    for (const s of [-1, 1]) for (let fila = 0; fila < 3; fila++) for (let k = 0; k < 7 - fila; k++) {
      if (s > 0 && fila === 0 && k > 4) continue;
      const t = 0.25 + k * 0.2 + fila * 0.08, L = 120 - fila * 26 - k * 6, x0 = s * (RA + 8), z0 = 70 + fila * 18;
      F.palo([x0, UF - 14 - fila * 6, z0], [x0 + s * Math.cos(t) * L, UF - 20 - fila * 6, z0 + Math.sin(t) * L * 1.1], 6.4 - fila * 1.4, { mat: MA, r1: 1.4, tono: fila * 0.04 });
    }
    for (const s of [-1, 1]) { const c = F.sub(s * (RA + 6), UF - 12, 0); tronco(c, 0, 0, 0, 80, 22, 22, 16, 16, { mat: MA }); c.cil(0, 0, 80, 10, 10, { mat: OR, r1: 13 }); c.elip(0, 0, 90, 11, 11, 1.4, { mat: 'ext_carbon' }); for (let k = 0; k < 3; k++) llama(c, (a.r() - 0.5) * 6, (a.r() - 0.5) * 6, 90, 4, 18, f, 4, k + 40, 'mon_es_blanco'); }
    letras(F.sub(0, UF + 0.3, 0), -RA, RA, 0, 46, 1, OR, 4.6, 1.6);
  }
  cascotes(F, 10, 120, 30, MA, 0, 160, 3);
  return {
    der: { c: [0, UF - 20, 60] as V3, r: 60 + p * 8, color: '#c8a868' },
    medio: { c: [0, UC, 300] as V3, r: 150 + p * 20, color: '#ffe8a0' },
    atras: { c: [0, UC, 740] as V3, r: 140 + p * 20, color: '#fff0c0' },
  };
}
registrarMonumento({
  id: 'mon_escalera', nombre: ['La Escalera al Trono', 'The Stair to the Throne'], tema: 'celestial', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== las estelas de los siete
/** La estela de los que subieron: un pilar de mármol en talud del alto de cinco hombres, con los nombres grabados en columnas, la
 *  estrella de siete puntas de oro arriba con su corona de rayos y, al pie, el oro seco que le chorreó encima como cera, las velas
 *  y los cuencos vacíos. Una lleva el nombre raspado. */
function estela(g: G, raspada: boolean) {
  const a = g.a;
  bloque(g, 0, 0, 0, 70, 70, 10, { mat: MA, b: 1.6, j: 1 }); bloque(g, 0, 0, 10, 52, 52, 10, { mat: MA, b: 1.2, j: 0.8, tono: 0.04 });
  tronco(g, 0, 0, 20, 300, 36, 36, 24, 24, { mat: MA });
  g.caja(0, 0, 300, 30, 30, 6, { mat: OR, tono: -0.05 }); g.caja(0, 0, 306, 26, 26, 4, { mat: MA, tono: 0.06 });
  // los nombres en las cuatro caras (en la de adelante, raspados en una)
  for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU, c = g.sub(Math.cos(t) * 17.4, Math.sin(t) * 17.4, 0, (t * 180) / Math.PI + 90); if (raspada && k === 1) c.caja(0, 0, 110, 22, 2, 140, { mat: MA, resta: true }); else letras(c, -10, 10, 0, 60, 18, OS, 4.2, 1.4); }
  // la estrella de siete puntas, de canto a la avenida, y su corona de rayos
  const E = g.sub(0, 0, 340, 45, 90, 'x');
  for (let k = 0; k < 7; k++) { const t = (k / 7) * TAU - Math.PI / 2; E.poli([[0, -2, 0], [0, 2, 0], [Math.cos(t - 0.45) * 12, -1.4, Math.sin(t - 0.45) * 12], [Math.cos(t + 0.45) * 12, 1.4, Math.sin(t + 0.45) * 12], [Math.cos(t) * 30, 0, Math.sin(t) * 30]], { mat: OR, tono: 0.06 }); }
  E.sub(0, 0, 0, 0, 90, 'x').cil(0, 0, -3, 9, 6, { mat: 'mon_es_blanco', tono: 0.1 });
  for (let k = 0; k < 14; k++) { const t = (k / 14) * TAU; E.palo([Math.cos(t) * 32, 0, Math.sin(t) * 32], [Math.cos(t) * (44 + (k % 2) * 12), 0, Math.sin(t) * (44 + (k % 2) * 12)], 1.4, { mat: OR, r1: 0.3 }); }
  g.palo([0, 0, 310], [0, 0, 340], 3, { mat: OR });
  // el oro seco que chorreó, las velas y los cuencos
  for (let k = 0; k < 12; k++) { const t = (k / 12) * TAU + a.r() * 0.3, z0 = 280 - a.r() * 60; g.palo([Math.cos(t) * 13, Math.sin(t) * 13, z0], [Math.cos(t) * 17, Math.sin(t) * 17, z0 - 30 - a.r() * 60], 1.8, { mat: OS, r1: 0.8 }); }
  g.elip(0, 0, 20.4, 26, 26, 1.4, { mat: OS, tono: -0.05 });
  for (let k = 0; k < 6; k++) { const t = (k / 6) * TAU + 0.3, x = Math.cos(t) * 30, y = Math.sin(t) * 30; g.cil(x, y, 10, 1.4, 6 + (k % 3) * 3, { mat: 'cera', tono: -0.3 }); llama(g, x, y, 16 + (k % 3) * 3, 1, 3, 0, 4, k, 'mon_es_luz'); }
  for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU + 1; g.cil(Math.cos(t) * 40, Math.sin(t) * 40, 0, 4, 3, { mat: OR, r1: 5.4, tono: -0.1 }); }
}
registrar({
  id: 'mon_es_estela', nombre: ['Estela de los siete', 'Stele of the seven'], tema: 'celestial', variantes: ['entera', 'raspada'], huella: [5, 5], bloquea: true,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); estela(g, v === 'raspada'); bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 340] as V3, r: 50, color: '#ffe8a0' } }; },
});

// ================================================================== los braseros de fuego blanco
registrar({
  id: 'mon_es_brasero', nombre: ['Brasero blanco', 'White brazier'], tema: 'celestial', variantes: ['encendido'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    bloque(g, 0, 0, 0, 22, 22, 6, { mat: MA, b: 1, j: 0.5 });
    g.cil(0, 0, 6, 5, 34, { mat: MA, r1: 3.6 }); g.cil(0, 0, 40, 4, 8, { mat: OR, r1: 12 }); g.elip(0, 0, 48, 11, 11, 1.4, { mat: 'ext_carbon' });
    for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 6, (a.r() - 0.5) * 6, 48, 4.4, 20 + a.r() * 6, f, 4, k, 'mon_es_blanco');
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 60] as V3, r: 60 + pp * 10, color: '#fff2c8' } };
  },
});

// ================================================================== el bastón y el manto del séptimo
registrar({
  id: 'mon_es_septimo', nombre: ['Lo que dejó el séptimo', 'What the seventh left'], tema: 'celestial', variantes: ['caido'], huella: [4, 4], bloquea: false, plano: false,
  armar: (_v, f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -30);
    // el manto tirado, vacío, con la forma de alguien que se arrodilló, y el bastón con su remate de oro
    g.elip(0, 0, 1.4, 22, 14, 4, { mat: 'tela_roja', tono: -0.2 }); g.elip(-6, 2, 4, 10, 8, 4, { mat: 'tela_roja', tono: -0.25 });
    g.palo([-30, -10, 1.4], [30, 14, 1.4], 1.4, { mat: 'madera' }); g.esf(31, 14.4, 1.8, 3, { mat: OR });
    for (let k = 0; k < 3; k++) { g.cil(14 + k * 6, -16, 0, 1.2, 5 + k, { mat: 'cera', tono: -0.3 }); llama(g, 14 + k * 6, -16, 5 + k, 0.9, 2.6, f, 4, k, 'mon_es_luz'); }
    bajoTierra(ps); return ps;
  },
});

// ================================================================== las losas caídas de la escalera
registrar({
  id: 'mon_es_losas', nombre: ['Losas caídas', 'Fallen steps'], tema: 'celestial', variantes: ['nombres'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g } = raiz(a);
    for (let k = 0; k < 4; k++) { const t = k * 1.6 + a.r(); const c = g.sub(Math.cos(t) * 18, Math.sin(t) * 16, 0, a.r() * 180, (a.r() - 0.5) * 30); bloque(c, 0, 0, 0, 40, 20, 8, { mat: MA, b: 1, j: 0.6 }); c.caja(0, 10.2, 1, 40, 0.8, 3, { mat: OR, tono: -0.1 }); letras(c.sub(0, 0, 8.1, 0, 90, 'x'), -14, 14, 0, -1.4, 1, OS, 3.6, 1.2); }
    cascotes(g, 10, 30, 30, MA, 0, 0, 3);
    bajoTierra(ps); return ps;
  },
});
void ruido;
