import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';
import { G, raiz, bajoTierra, bloque, llama, figuraVelada, letras, cascotes } from '../kit_muerte';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { aro, tronco } from './monumentos_kit2';

/**
 * La Escalera al Trono (acto 7, el Jardín de los que Intentaron; baja a `a7_escaleras`). Canon: arriba está Aun-Saar, el Dios
 * Sediento; hace cuarenta años el cielo se rajó un dedo y subieron siete marcados, y la escalera es por donde subieron. No es un
 * edificio: es una escalera de caracol de losas de mármol sueltas que flotan alrededor de un haz de luz seca, sin muro y sin
 * baranda, que sube y sube hasta un halo de oro partido donde el cielo se rajó. Cada losa lleva un nombre grabado (los de los
 * que subieron antes); la última está en blanco. Abajo, el estrado redondo en tres gradas, el oro que se derramó seco por las
 * gradas como cera, y la puerta: un aro de oro parado, del alto de cinco hombres, con la luz blanca adentro y la escalinata que
 * baja. A los lados del aro, dos alas de mármol que se abren como las de un ángel al que le sacaron el cuerpo.
 *
 * Sueltos en el atrio (monumentos.ts): los suplicantes bebidos, de rodillas, secos como cáscaras doradas (`mon_es_bebido`), los
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
const MA = 'mon_es_marmol', OR = 'mon_es_oro', OS = 'mon_es_oro_seco', LU = 'mon_es_luz', BL = 'mon_es_blanco';

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  const UC = -64;
  // ------------------------------------------------------------ el estrado: tres gradas redondas de mármol con el oro derramado
  for (let i = 0; i < 3; i++) {
    const R = 182 - i * 30, z = i * 14;
    F.cil(0, UC, z, R, 14, { mat: MA, tono: -i * 0.03 });
    F.cil(0, UC, z + 12, R + 1.5, 2.6, { mat: OR, tono: -0.1 });
    // el oro seco que se derramó por la grada como cera
    for (let k = 0; k < 10; k++) { const t = (k / 10) * TAU + i * 0.4 + a.r() * 0.3, L = 8 + a.r() * 10; if (Math.sin(t) > 0.62 && Math.abs(Math.cos(t)) < 0.3) continue; F.palo([Math.cos(t) * (R - 2), UC + Math.sin(t) * (R - 2), z + 14], [Math.cos(t) * (R + 2), UC + Math.sin(t) * (R + 2), z + 14 - L], 2.4 + a.r() * 2, { mat: OS, r1: 1.2 }); }
  }
  // el pozo del haz: un anillo de oro en el centro del estrado, con letras alrededor
  F.cil(0, UC, 42, 40, 6, { mat: OR }); F.cil(0, UC, 44, 32, 6, { mat: BL, tono: 0.1 });
  // ------------------------------------------------------------ el haz de luz seca: la columna que sube al cielo rajado
  for (let k = 0; k < 7; k++) { const z = 48 + k * 80, r0 = 22 - k * 1.4; F.cil(0, UC, z, r0, 80, { mat: LU, r1: r0 - 1.4, tono: 0.1 - k * 0.02 + p * 0.06 }); }
  for (let k = 0; k < 18; k++) { const t = a.r() * TAU, rr = 26 + a.r() * 16, z = 60 + a.r() * 500; F.esf(Math.cos(t) * rr, UC + Math.sin(t) * rr, z, 1.4 + a.r() * 1.6, { mat: BL }); }
  // ------------------------------------------------------------ la escalera de caracol: losas sueltas que flotan sin muro ni baranda
  const NS = 46, R0 = 104, VUELTAS = 2.3, ZT = 520, T0 = Math.PI * 0.55;
  for (let i = 0; i < NS; i++) {
    const t = T0 + (i / NS) * VUELTAS * TAU, z = 56 + (i / NS) * ZT, R = R0 - (i / NS) * 26, x = Math.cos(t) * R, y = UC + Math.sin(t) * R;
    const g = F.sub(x, y, z, (t * 180) / Math.PI + 90);
    // la losa: gruesa, con el canto de oro y el nombre grabado en la cara de arriba (la última en blanco)
    bloque(g, 0, 0, -9, 46, 24, 9, { mat: MA, b: 1, j: 0.6, tono: (a.r() - 0.5) * 0.06 });
    g.caja(0, 12.2, -8, 46, 0.8, 3, { mat: OR, tono: -0.05 });
    if (i < NS - 1) letras(g.sub(0, 0, 0.1, 0, 90, 'x').sub(0, 0, 0), -16, 16, 0, -1.4, 1, OS, 3.6, 1.2);
    // la piedra que cuelga debajo de cada losa: un cono roto (la losa arrancada de algo)
    g.cil(0, 0, -9, 9, -16 - (i % 3) * 6, { mat: MA, r1: 2, tono: -0.1 });
    if (i % 4 === 0) g.palo([-14, 6, -9], [-14, 6, -26 - a.r() * 14], 1.6, { mat: OS, r1: 0.6 });
    // algunos escalones con lo que dejaron los que subieron: una vela, un zapato, un cuenco vacío
    if (i % 7 === 3) { g.cil(10, 0, 0, 1.4, 6, { mat: 'cera', tono: -0.3 }); llama(g, 10, 0, 6, 1, 3, f, 4, i, 'mon_es_luz'); }
  }
  // ------------------------------------------------------------ el halo partido donde el cielo se rajó
  {
    const ZH = 56 + ZT + 60, H = F.sub(0, UC, ZH, 0, 64, 'x');
    aro(H, 0, 0, 120, 7, OR, 0.3, TAU - 0.5, 48);
    aro(H, 0, 0, 104, 3, OR, 0.6, TAU - 0.9, 40, 0, -0.1);
    // los dos cabos del halo, rotos, y los pedazos que caen
    for (const t of [0.3, TAU - 0.5]) H.esf(Math.cos(t) * 120, 0, Math.sin(t) * 120, 9, { mat: OR, tono: 0.1 });
    for (let k = 0; k < 5; k++) { const z = ZH - 30 - k * 40, x = 120 * Math.cos(0.05) + (a.r() - 0.5) * 20; F.poli([[x - 5, UC + 8, z], [x + 5, UC + 8, z], [x - 5, UC + 14, z], [x + 5, UC + 14, z], [x - 2, UC + 10, z + 9], [x + 2, UC + 12, z + 8]], { mat: OR, tono: -0.1 }); }
    // la raja en el cielo: una herida de luz blanca dentro del halo, el dedo por donde subieron
    F.poli([[-6, UC, ZH - 70], [6, UC, ZH - 70], [-3, UC + 4, ZH - 70], [3, UC + 4, ZH - 70], [-24, UC, ZH + 80], [-14, UC, ZH + 80], [-20, UC + 4, ZH + 80], [-16, UC + 4, ZH + 80]], { mat: BL, tono: 0.15 });
    for (let k = 0; k < 6; k++) { const t = (k / 6) * TAU; F.palo([0, UC, ZH], [Math.cos(t) * 160, UC + Math.sin(t) * 20, ZH + Math.sin(t) * 120], 1.4, { mat: LU, r1: 0.2, tono: 0.1 }); }
  }
  // ------------------------------------------------------------ la puerta: el aro de oro parado delante del estrado y las alas de mármol
  const UF = 214, RA = 58;
  {
    // la boca: el hueco en el estrado que baja, con la escalinata y la luz blanca
    F.caja(0, UF - 40, 0, RA * 1.5, 80, 50, { mat: MA, tono: -0.05 });
    F.caja(0, UF - 34, 4, RA * 1.2, 70, 60, { mat: MA, resta: true });
    for (let i = 0; i < 7; i++) F.caja(0, UF - 8 - i * 9, 4 - i * 0.1, RA * 1.2 - 4, 9, 2, { mat: MA, tono: -0.05 - i * 0.05 });
    F.caja(0, UF - 72, 0, RA * 1.2, 2, 50, { mat: BL, tono: 0.1 + p * 0.06 });
    // el aro de oro, parado, con el disco de luz adentro y las letras del borde
    const A2 = F.sub(0, UF - 8, RA + 6);
    aro(A2, 0, 0, RA, 6, OR, 0, TAU, 48); aro(A2, 0, 0, RA - 10, 2.4, OR, 0, TAU, 40, 0, -0.1);
    A2.sub(0, -2, 0, 0, 90, 'x').cil(0, 0, -1, RA - 12, 2, { mat: BL, tono: 0.05 + p * 0.08 });
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
    der: { c: [0, UF - 20, 60] as V3, r: 100 + p * 14, color: '#fff2c8' },
    medio: { c: [0, UC, 300] as V3, r: 150 + p * 20, color: '#ffe8a0' },
    atras: { c: [0, UC, 640] as V3, r: 140 + p * 20, color: '#fff0c0' },
  };
}
registrarMonumento({
  id: 'mon_escalera', nombre: ['La Escalera al Trono', 'The Stair to the Throne'], tema: 'celestial', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== los suplicantes bebidos
registrar({
  id: 'mon_es_bebido', nombre: ['Los que intentaron', 'Those who tried'], tema: 'celestial', variantes: ['izq', 'der'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => {
    const { ps, g } = raiz(a, -45);
    bloque(g, 0, 0, 0, 110, 100, 12, { mat: MA, b: 2, j: 1 });
    // el grande: de rodillas con los brazos arriba (pidiendo), seco como una cáscara de oro; alrededor tres chicos de rodillas
    figuraVelada(g.sub(0, -6, 12, v === 'der' ? 15 : -15), 200, { mat: 'mon_es_cascara', pose: 'reza', tono: 0.05 });
    for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU + 0.6; figuraVelada(g.sub(Math.cos(t) * 40, Math.sin(t) * 34, 12, (t * 180) / Math.PI + 90), 34, { mat: 'mon_es_cascara', pose: k === 1 ? 'cubre_cara' : 'rodillas', tono: -0.05 }); }
    for (let k = 0; k < 10; k++) g.elip(-40 + a.r() * 80, -40 + a.r() * 80, 12.4, 4 + a.r() * 4, 3, 0.6, { mat: OS, giro: a.r() * 180 });
    bajoTierra(ps); return ps;
  },
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
