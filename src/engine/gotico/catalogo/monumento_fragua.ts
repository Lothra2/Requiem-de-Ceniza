import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, raiz, bajoTierra, bloque, llama, figuraVelada, calavera, cadena, cascotes } from '../kit_muerte';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { aro } from './monumentos_kit2';

/**
 * La Fragua de Ozmaren (acto 5, El Río de Lava; baja a `a5_fragua`). Canon: Ozmaren es la primera brasa, la que cayó hace mil
 * inviernos; a Sahrim le tocó su pedazo y lo puso a arder en la montaña para forjar. No es un edificio: es un volcán de
 * columnas de basalto (los prismas de seis caras que deja la lava al enfriarse), un cono que sube en escalones de columnas de
 * alto desparejo, con dos ríos de lava que bajan por sus costados y en el cráter la brasa de Ozmaren, un cristal al rojo que
 * se ve de toda la llanura. Al pie, en la base del cono, la boca de la fragua: un arco de hierro remachado con la garganta al
 * blanco, y a los lados las dos chimeneas de hierro que echan fuego. Nada de muros ni techos: roca, lava y hierro.
 *
 * Sueltos en el atrio (monumentos.ts): los dos brazos de bronce que salen de la tierra, uno con el martillo y otro con las
 * tenazas y la hoja al rojo (`mon_fr_brazo`), los crisoles de la boca (`mon_fr_brasero`), la cuerda de los quemados que tiran
 * del carro de mineral (`mon_fr_cadena`) y los moldes con las hojas que se enfrían (`mon_fr_moldes`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Basalto en columnas: negro pardo, la cara de arriba un poco más clara y gastada, las juntas finas. */
M.mon_fr_basalto = {
  rampa: ['#060505', '#0e0c0b', '#171412', '#221d1a', '#2d2622', '#3a312b', '#483d35', '#574a40', '#66574b'], ruido: 0.22, escala: 0.22,
  patron: (p, n) => (n[2] > 0.7 ? 0.26 + (ruido(p[0] * 0.1, p[1] * 0.1, 1) - 0.5) * 0.24 : (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.2) - 0.5) * 0.3 + (ruido(p[0] * 0.02, p[1] * 0.02, p[2] * 0.1) > 0.7 ? -0.2 : 0)),
};
/** Basalto quemado, junto a la lava: más negro, con el brillo rojo que le queda en las grietas. */
M.mon_fr_quemado = { rampa: ['#050302', '#0c0605', '#160a07', '#22100a', '#30160c', '#401e10'], ruido: 0.3, escala: 0.2, patron: (p, n) => (n[2] > 0.7 ? 0.2 : 0) + (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08) - 0.5) * 0.3 };
/** La lava: corre al blanco en el medio y se enfría en costra negra a los lados. */
M.mon_fr_lava = { rampa: ['#2a0602', '#5a0e03', '#8c1c04', '#c03406', '#e8580c', '#ff8a1e', '#ffbe4a', '#ffe8a0'], ruido: 0.5, escala: 0.18, emite: true, patron: (p) => (ruido(p[0] * 0.06, p[1] * 0.06, 1) > 0.62 ? -0.45 : (ruido(p[0] * 0.2, p[1] * 0.2, 3) - 0.5) * 0.4) };
/** La brasa de Ozmaren: el cristal que arde. */
M.mon_fr_brasa = { rampa: ['#3a0804', '#7a1406', '#c0280a', '#ee5214', '#ff8a2e', '#ffc066', '#fff0c8'], ruido: 0.3, escala: 0.3, emite: true };
M.mon_fr_hierro = { rampa: ['#070606', '#100e0d', '#1b1816', '#28231f', '#37302a', '#473e35', '#5a4e43'], ruido: 0.3, escala: 0.5, brillo: 0.35, patron: (p) => (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3) > 0.72 ? 0.12 : 0) + (ruido(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04) > 0.68 ? -0.14 : 0) };
M.mon_fr_oxido = { rampa: ['#120604', '#24100a', '#3a1a10', '#542716', '#6e351d', '#874426'], ruido: 0.4, escala: 0.4 };
/** Bronce de los brazos, con el verdín en lo que no toca el calor. */
M.mon_fr_bronce = {
  rampa: ['#120a04', '#24170a', '#3a2610', '#543818', '#704b20', '#8c602a', '#a87836', '#c49448', '#dcb064'], ruido: 0.2, escala: 0.3, brillo: 0.6,
  patron: (p, n) => (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08) > 0.72 && n[2] > 0.2 ? -0.22 : 0) + (ruido(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) - 0.5) * 0.12,
};
M.mon_fr_verdin = { rampa: ['#08140f', '#10241b', '#183628', '#224a37', '#2e5f47', '#3c7558'], ruido: 0.4, escala: 0.3 };
M.mon_fr_escoria = { rampa: ['#060504', '#0d0a08', '#16110d', '#201913', '#2b2119'], ruido: 0.6, escala: 0.4 };
const BA = 'mon_fr_basalto', QU = 'mon_fr_quemado', LA = 'mon_fr_lava', HI = 'mon_fr_hierro', OX = 'mon_fr_oxido', BZ = 'mon_fr_bronce', ES = 'mon_fr_escoria';

/** Columna de basalto de seis caras, de `z0` a `z1`, radio `r`, con el canto de arriba biselado y un giro propio. */
function columna(g: G, x: number, y: number, z0: number, z1: number, r: number, mat: string, giro: number, tono = 0) {
  const anillo = (z: number, rr: number) => Array.from({ length: 6 }, (_, i) => { const t = (i / 6) * TAU + giro; return [x + Math.cos(t) * rr, y + Math.sin(t) * rr, z] as V3; });
  g.poli([...anillo(z0, r), ...anillo(z1 - 2, r)], { mat, tono });
  g.poli([...anillo(z1 - 2.2, r), ...anillo(z1, r * 0.84)], { mat, tono: tono + 0.04 });
}

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  // ------------------------------------------------------------ el cono de columnas: sube hacia el cráter en escalones desparejos
  const UC = -64, R = 232, CR = 50;
  const perfil = (r: number) => (r < CR ? 392 + r * 0.3 : 470 * Math.pow(Math.max(0, 1 - (r - CR) / (R - CR)), 0.85) + 18);
  // los dos ríos de lava: bajan del cráter por la izquierda adelante y por la derecha, serpenteando
  const rios = [{ ang: 2.05, ser: 0.16 }, { ang: 1.05, ser: -0.14 }];
  const enRio = (v: number, u: number) => { const dx = v, dy = u - UC, r = Math.hypot(dx, dy); if (r < CR + 10) return -1; const t = Math.atan2(dy, dx); for (let k = 0; k < rios.length; k++) { const c = rios[k].ang + Math.sin(r * 0.03) * rios[k].ser; let d = Math.abs(((t - c + Math.PI * 3) % TAU) - Math.PI) * r; if (d < 26) return k; } return -1; };
  // (la boca y las chimeneas: ahí no van columnas)
  const enBoca = (v: number, u: number) => Math.abs(v) < 118 && u > 40;
  const S = 25, RH = 14.6;
  for (let fila = -14; fila <= 14; fila++) for (let col = -14; col <= 14; col++) {
    const v = col * S + (fila & 1 ? S / 2 : 0), u = UC + fila * S * 0.866, r = Math.hypot(v, u - UC);
    if (u > 300 - Math.abs(v) - 10 || u < -490 + Math.abs(v)) continue;
    if (r > R && !enBoca(v, u)) continue;
    // (alrededor de la boca las columnas se juntan en un macizo que sube hacia el cono: la boca queda metida en la roca)
    const boca = enBoca(v, u);
    if (boca && u > 206) continue;
    if (!boca && (r > R || u > 300 - Math.abs(v) - 10)) continue;
    const rio = boca ? -1 : enRio(v, u), h0 = (boca ? Math.max(perfil(Math.min(r, R)), 236 - Math.abs(v) * 0.7 - Math.max(0, u - 120) * 0.9) : perfil(r)) + (ruido(v * 0.05, u * 0.05, 3) - 0.5) * 50 + (a.r() - 0.5) * 18 - (v > 60 ? (v - 60) * 0.12 : 0);
    const h = rio >= 0 ? h0 * 0.9 - 8 : h0;
    if (h < 8) continue;
    columna(F, v + (a.r() - 0.5) * 2, u + (a.r() - 0.5) * 2, 0, h, RH * (0.92 + a.r() * 0.14), rio >= 0 || r < CR + 30 ? QU : BA, a.r() * 0.5, (a.r() - 0.5) * 0.08);
    // la lava que corre por el cauce, encima de las columnas hundidas
    if (rio >= 0) F.elip(v, u, h + 0.6, RH * 1.6, RH * 1.6, 3.4, { mat: LA, tono: -0.15 + (1 - r / R) * 0.3 + p * 0.06 });
    // la ceniza en lo alto de algunas, y alguna columna caída al pie
    else if (a.r() < 0.12) F.elip(v, u, h + 0.4, RH * 0.7, RH * 0.6, 1.4, { mat: 'mon_fr_escoria', tono: 0.2 });
    // las juntas por donde asoma el calor de adentro: una veta al rojo entre columna y columna, más cerca del cráter más seguido
    if (rio < 0 && a.r() < 0.1 + (1 - r / R) * 0.18) { const z0 = h * (0.2 + a.r() * 0.4); F.caja(v + RH * 0.7, u + RH * 0.5, z0, 2.4, 2.4, h * 0.4 + a.r() * h * 0.3, { mat: LA, tono: 0.15, giro: 30 }); }
  }
  // la cinta de lava de cada río, seguida: brilla de arriba abajo, más clara en el medio del cauce
  for (const rr of rios) for (let r = CR + 6; r < R + 10; r += 7) {
    const t = rr.ang + Math.sin(r * 0.03) * rr.ser, v = Math.cos(t) * r, u = UC + Math.sin(t) * r; if (u > 300 - Math.abs(v) - 14 || enBoca(v, u)) continue;
    const h = Math.max(1, perfil(r) * 0.9 - 8) + 6; F.elip(v, u, h, 16, 12, 3, { mat: LA, tono: 0.1 + (1 - r / R) * 0.25, giro: (t * 180) / Math.PI }); F.elip(v, u, h + 1.2, 7, 5, 1.6, { mat: 'mon_fr_brasa', tono: 0.1, giro: (t * 180) / Math.PI });
  }
  // los charcos de lava donde los ríos llegan al pie, y la costra
  for (const rr of rios) { const t = rr.ang + Math.sin(R * 0.03) * rr.ser, v = Math.cos(t) * (R + 16), u = UC + Math.sin(t) * (R + 16); if (u > 300 - Math.abs(v) - 30) continue; F.elip(v, u, 0.6, 40, 30, 3, { mat: LA, tono: 0.1, giro: (t * 180) / Math.PI }); F.elip(v, u, 0.3, 52, 40, 2, { mat: QU, giro: (t * 180) / Math.PI }); }
  // ------------------------------------------------------------ el cráter: el pozo de lava y la brasa de Ozmaren que arde arriba
  {
    F.cil(0, UC, 360, CR - 4, 30, { mat: LA, tono: 0.2 + p * 0.1 });
    // la brasa: un cristal de facetas al rojo, partido, con las astillas alrededor, que sube del pozo
    const B = F.sub(0, UC, 380, 18, 10);
    B.poli([[-18, -14, 0], [16, -16, 0], [18, 14, 0], [-14, 18, 0], [-10, -8, 70], [12, -6, 64], [10, 10, 72], [-8, 12, 66], [2, 0, 104]], { mat: 'mon_fr_brasa', tono: 0.15 + p * 0.1 });
    B.poli([[18, -6, 0], [34, -10, 0], [36, 8, 0], [20, 10, 0], [28, -2, 50]], { mat: 'mon_fr_brasa', tono: 0.05 });
    B.poli([[-20, 4, 0], [-34, -4, 0], [-30, 16, 0], [-18, 16, 0], [-30, 6, 40]], { mat: 'mon_fr_brasa', tono: 0 });
    for (let k = 0; k < 6; k++) { const t = (k / 6) * TAU; columna(F, Math.cos(t) * (CR - 2), UC + Math.sin(t) * (CR - 2), 0, 396 + (a.r() - 0.5) * 20, 12, QU, t, -0.05); }
    for (let k = 0; k < 8; k++) llama(F, (a.r() - 0.5) * 70, UC + (a.r() - 0.5) * 70, 390, 7, 30 + a.r() * 20, f, 4, k);
  }
  // ------------------------------------------------------------ las dos chimeneas de hierro que salen del cono a los lados de la boca
  for (const s of [-1, 1]) {
    const x = s * 92, u = 30, h = s < 0 ? 380 : 330;
    F.cil(x, u, 0, 24, h, { mat: HI, r1: 17 });
    for (let k = 0; k < 7; k++) F.cil(x, u, 30 + k * ((h - 60) / 6), 25 - k * 1.1, 6, { mat: OX, tono: 0.05 });
    F.cil(x, u, h, 17, 14, { mat: HI, r1: 28 }); F.cil(x, u, h + 14, 28, 6, { mat: HI, tono: 0.06 });
    F.cil(x, u, h + 15, 22, 5, { mat: LA, tono: 0.25 + p * 0.1 });
    for (let k = 0; k < 5; k++) llama(F, x + (a.r() - 0.5) * 20, u + (a.r() - 0.5) * 20, h + 20, 7, 34 + a.r() * 22, f, 4, k + 30);
    // los tirantes de hierro que la atan al cono
    for (const dz of [0.4, 0.7]) F.palo([x, u, h * dz], [x - s * 40, u - 40, h * dz + 30], 2.4, { mat: HI });
  }
  // ------------------------------------------------------------ la boca de la fragua: el arco de hierro remachado en la base del cono
  const UF = 214;
  {
    // el macizo de basalto quemado que sostiene la boca, con las columnas que se abren a los lados como dientes
    for (let k = 0; k < 9; k++) { const t = (k / 8) * Math.PI, v = Math.cos(t) * 96, u = 150 + Math.sin(t) * 40 - 20, h = 140 + Math.sin(t) * 60 + (a.r() - 0.5) * 24; columna(F, v, u, 0, h, 18, k % 3 ? BA : QU, a.r(), (a.r() - 0.5) * 0.08); }
    // el arco de hierro: tres anillos de chapas remachadas, la garganta al blanco y la lengua de lava que sale por el umbral
    const AR = 44, ZA = 96;
    F.caja(0, UF - 36, 0, AR * 2, 90, ZA, { mat: QU, resta: true }); F.sub(0, UF - 36, ZA, 0, 90, 'x').cil(0, 0, -45, AR, 90, { mat: QU, resta: true });
    F.caja(0, 196, 0, AR * 2 + 40, 40, 16, { mat: QU, resta: true });
    for (let r = 0; r < 3; r++) { const R0 = AR + 6 + r * 11, uu = UF - 2 - r * 6; aro(F.sub(0, uu, 0), 0, ZA, R0, 5.6, r === 1 ? OX : HI, 0, Math.PI, 26); for (const sx of [-1, 1]) F.caja(sx * R0, uu, 0, 11, 11, ZA, { mat: r === 1 ? OX : HI }); for (let k = 0; k < 9; k++) { const t = (k / 8) * Math.PI; F.esf(Math.cos(t) * R0, uu + 5.4, ZA + Math.sin(t) * R0, 1.6, { mat: HI, tono: 0.15 }); } }
    F.caja(0, UF - 80, 0, AR * 2, 2, ZA + AR, { mat: LA, tono: 0.3 + p * 0.1 });
    for (let k = 0; k < 6; k++) F.elip((a.r() - 0.5) * 60, UF - 70 + a.r() * 30, 10 + a.r() * 50, 16, 10, 12, { mat: LA, tono: 0.1 + a.r() * 0.2 });
    F.poli([[-20, UF - 50, 0.6], [20, UF - 50, 0.6], [-24, UF + 30, 0.6], [24, UF + 30, 0.6], [-20, UF - 50, 2], [20, UF - 50, 2], [-24, UF + 30, 1.2], [24, UF + 30, 1.2]], { mat: LA, tono: 0.15 });
    // la clave: la cara de Sahrim en hierro, con los ojos al rojo, y la brasa de Ozmaren grabada encima
    { const c = F.sub(0, UF + 2, ZA + AR + 30); c.elip(0, 0, 0, 20, 8, 24, { mat: HI, tono: 0.04 }); for (const e of [-1, 1]) { c.elip(e * 7, 6.4, 4, 3.4, 1.4, 2, { mat: 'mon_fr_brasa', tono: 0.1 }); c.palo([e * 14, 2, 14], [e * 30, 0, 34], 4, { mat: HI, r1: 1 }); } c.poli([[-2, 6, 0], [2, 6, 0], [-2, 6, -8], [2, 6, -8], [-3, 11, -8], [3, 11, -8]], { mat: HI }); c.caja(0, 7, -14, 12, 2, 2, { mat: 'mon_fr_brasa', tono: -0.1 }); for (let k = 0; k < 8; k++) c.palo([-8 + k * 2.3, 6, -18], [-9 + k * 2.6, 7, -30 - (k % 2) * 4], 1.4, { mat: HI, r1: 0.6 }); }
    // las cadenas gruesas que cuelgan del arco y los ganchos
    for (const s of [-1, 1]) cadena(F, [s * 70, UF + 2, ZA + 40], [s * 36, UF + 10, ZA + 4], 10, HI, 2.4);
    // el yunque de la boca: el yunque grande de Sahrim, a un costado, con la hoja al rojo y el martillo
    { const c = F.sub(-70, UF + 18, 0, -20); bloque(c, 0, 0, 0, 40, 30, 16, { mat: ES, b: 2, j: 1 }); c.poli([[-18, -9, 16], [18, -9, 16], [-18, 9, 16], [18, 9, 16], [-24, -11, 34], [30, -10, 34], [-24, 11, 34], [30, 10, 34]], { mat: HI, tono: 0.06 }); c.poli([[30, -6, 34], [30, 6, 34], [30, -6, 26], [30, 6, 26], [46, 0, 33]], { mat: HI }); c.caja(4, 0, 34, 34, 4, 1.2, { mat: 'mon_fr_brasa', tono: 0.1 }); c.palo([-20, 14, 0], [-6, 10, 40], 2, { mat: 'madera' }); c.caja(-6, 10, 40, 12, 8, 8, { mat: HI }); }
  }
  // ------------------------------------------------------------ el pie: la escoria, las brasas y el piso quemado
  cascotes(F, 14, 120, 20, ES, 0, 170, 4);
  for (let k = 0; k < 10; k++) { const v = (a.r() < 0.5 ? -1 : 1) * (120 + a.r() * 80), u = 120 + a.r() * 60 - Math.max(0, Math.abs(v) - 150); F.elip(v, u, 0.4, 14 + a.r() * 14, 10 + a.r() * 8, 2, { mat: k % 3 ? ES : LA, tono: k % 3 ? 0 : -0.2, giro: a.r() * 180 }); }
  void figuraVelada; void calavera; void bloque;
  return {
    der: { c: [0, UF - 40, 50] as V3, r: 110 + p * 16, color: '#ff7a24' },
    medio: { c: [0, UC, 420] as V3, r: 160 + p * 24, color: '#ff5a1c' },
    izq: { c: [-92, 30, 400] as V3, r: 90 + p * 14, color: '#ff8a30' },
    atras_d: { c: [92, 30, 350] as V3, r: 90 + p * 14, color: '#ff8a30' },
  };
}
registrarMonumento({
  id: 'mon_fragua', nombre: ['La Fragua de Ozmaren', 'Ozmaren\'s Forge'], tema: 'infierno', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== los brazos de bronce de Sahrim
/** Un antebrazo de bronce que sale de la tierra hasta el codo, inclinado, con el puño cerrado sobre su herramienta: el martillo
 *  levantado o las tenazas con la hoja al rojo. La tierra rota y la escoria alrededor del codo. */
function brazo(g: G, tenazas: boolean) {
  const k = 3.6, s = g.esc(k), cs: Comp[] = [];
  // la tierra que se rompió al salir: losas de basalto levantadas y escoria
  for (let i = 0; i < 9; i++) { const t = (i / 9) * TAU; bloque(g, Math.cos(t) * 40, Math.sin(t) * 40, 0, 30 + (i % 3) * 8, 22, 10 + (i % 4) * 6, { mat: i % 2 ? QU : BA, giro: (t * 180) / Math.PI, incl: 20, b: 1.6, j: 1 }); }
  g.elip(0, 0, 0.4, 60, 60, 3, { mat: ES });
  // el antebrazo: sale de la tierra ladeado, se afina hacia la muñeca; los dos músculos largos marcados
  const L = tenazas ? -0.16 : 0.12, E: V3 = [0, 0, -6], W: V3 = [L * 50, 2, 46];
  cs.push(s.hu(E, W, 7.8, 6), s.bu([0, -1, 0], [8.6, 8, 6]), s.hu([1.6, 2.6, 2], [L * 30 + 1.4, 3.4, 30], 4.6, 3), s.hu([-2.6, -2, 4], [L * 30 - 2, -1.6, 32], 4.2, 2.8));
  s.masa(cs, { mat: BZ, suave: 1.4 });
  // el brazal de hierro remachado en la muñeca
  s.cil(W[0] - L * 6, W[1], W[2] - 8, 7, 7, { mat: HI, r1: 6.8 }); for (let i = 0; i < 10; i++) { const t = (i / 10) * TAU; s.esf(W[0] - L * 6 + Math.cos(t) * 7, W[1] + Math.sin(t) * 7, W[2] - 4.6, 0.7, { mat: HI, tono: 0.2 }); }
  // el puño: el dorso, los cuatro dedos cerrados alrededor del mango (de canto a la cámara) y el pulgar encima
  const P = s.sub(W[0], W[1], W[2] + 5);
  P.poli([[-6, -5, -4], [6, -5, -4], [-6, 5, -4], [6, 5, -4], [-6.4, -5.4, 6], [6.4, -5.4, 6], [-6.4, 4, 7], [6.4, 4, 7]], { mat: BZ, tono: 0.04 });
  for (let i = 0; i < 4; i++) { const z = 4.8 - i * 3.1; P.palo([-6, 5.4, z], [6, 5.4, z], 1.7, { mat: BZ, tono: (i % 2) * 0.05 }); P.palo([-6.4, 3.6, z + 0.6], [-6.4, 6.6, z - 0.4], 1.6, { mat: BZ }); }
  P.palo([5.6, -1, 6], [3, 5.6, 7.4], 2, { mat: BZ, r1: 1.7, tono: 0.06 });
  if (!tenazas) {
    // el martillo levantado: el mango que atraviesa el puño y la cabeza enorme con sus bocas de acero
    s.palo([W[0] + 11, W[1] + 5.6, W[2] + 2], [W[0] - 26, W[1] + 5.6, W[2] + 30], 2.3, { mat: 'madera' });
    const H2 = s.sub(W[0] - 26, W[1] + 5.6, W[2] + 30, 0, -37, 'y'); H2.caja(0, 0, -10, 14, 14, 30, { mat: HI, tono: 0.05 }); H2.caja(0, 0, -12, 15, 15, 3, { mat: 'acero', tono: 0.15 }); H2.caja(0, 0, 18, 15, 15, 3, { mat: 'acero', tono: 0.15 }); for (const z of [-4, 6, 14]) H2.caja(0, 0, z, 14.6, 14.6, 1.2, { mat: OX });
  } else {
    // las tenazas cerradas sobre una hoja de espada al rojo, que gotea
    for (const e of [-1, 1]) s.palo([W[0] + e * 1.6, W[1] + 6, W[2] + 2], [W[0] + e * 0.8 + 2, W[1] + 16, W[2] + 30], 1.4, { mat: HI });
    s.poli([[W[0] + 0.6, W[1] + 15, W[2] + 26], [W[0] + 5.4, W[1] + 15, W[2] + 26], [W[0] + 0.6, W[1] + 16, W[2] + 26], [W[0] + 5.4, W[1] + 16, W[2] + 26], [W[0] + 2.6, W[1] + 15, W[2] + 70], [W[0] + 3.4, W[1] + 15, W[2] + 70], [W[0] + 2.6, W[1] + 16, W[2] + 70], [W[0] + 3.4, W[1] + 16, W[2] + 70]], { mat: 'mon_fr_brasa', tono: 0.15 });
    for (let i = 0; i < 4; i++) s.palo([W[0] + 3, W[1] + 15.6, W[2] + 24 - i * 6], [W[0] + 3.2, W[1] + 15.8, W[2] + 21 - i * 6], 0.6, { mat: 'mon_fr_lava', r1: 0.3 });
  }
}
registrar({
  id: 'mon_fr_brazo', nombre: ['Brazo de Sahrim', 'Arm of Sahrim'], tema: 'infierno', variantes: ['martillo', 'tenazas'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); brazo(g, v === 'tenazas'); bajoTierra(ps); return ps; },
});

// ================================================================== los crisoles de la boca
registrar({
  id: 'mon_fr_brasero', nombre: ['Crisol de la fragua', 'Forge crucible'], tema: 'infierno', variantes: ['encendido'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU; g.palo([Math.cos(t) * 12, Math.sin(t) * 12, 0], [Math.cos(t) * 7, Math.sin(t) * 7, 30], 2, { mat: HI }); }
    g.cil(0, 0, 28, 8, 16, { mat: HI, r1: 13 }); g.elip(0, 0, 44, 12, 12, 2, { mat: LA, tono: 0.2 + pp * 0.1 });
    for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 7, (a.r() - 0.5) * 7, 44, 5, 22 + a.r() * 7, f, 4, k);
    g.elip(0, 0, 0.4, 16, 16, 1.4, { mat: ES });
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 58] as V3, r: 64 + pp * 10, color: '#ff8a30' } };
  },
});

// ================================================================== la cuerda de los quemados que tiran del carro de mineral
registrar({
  id: 'mon_fr_cadena', nombre: ['La cuerda de los quemados', 'The burned chain gang'], tema: 'infierno', variantes: ['tirando'], huella: [6, 6], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -30);
    // el carro de mineral, ladeado, con la rueda partida y el mineral que brilla
    bloque(g, 26, 0, 8, 34, 26, 20, { mat: 'madera', b: 1, j: 0.5, giro: 6 }); for (const e of [-1, 1]) g.sub(26 + e * 12, 14, 8, 0, 90, 'x').cil(0, 0, -2, 8, 3, { mat: HI });
    for (let k = 0; k < 8; k++) g.elip(20 + a.r() * 14, (a.r() - 0.5) * 18, 28 + a.r() * 4, 5, 4, 4, { mat: k % 3 ? ES : 'mon_fr_brasa', tono: k % 3 ? 0 : -0.2 });
    // los cuatro quemados, encorvados, atados a la cadena; uno caído
    for (let i = 0; i < 4; i++) { const x = 4 - i * 16, cae = i === 2; if (cae) { figuraVelada(g.sub(x, 4, 2, 0, 80, 'y'), 30, { mat: QU, pose: 'pie', tono: 0.1 }); continue; } figuraVelada(g.sub(x, 0, 0, -90, -16, 'y'), 32, { mat: QU, pose: 'pie', tono: 0.1 }); }
    cadena(g, [10, 0, 22], [-50, 0, 24], 4, HI, 1.4); cadena(g, [-50, 0, 24], [-64, 6, 0.6], 2, HI, 1.4);
    calavera(g.sub(-30, 14, 2, 50), 3.2, 'mu_hueso', true, -0.1);
    g.elip(-10, 0, 0.3, 50, 18, 1.2, { mat: ES });
    bajoTierra(ps); return ps;
  },
});

// ================================================================== los moldes con las hojas que se enfrían
registrar({
  id: 'mon_fr_moldes', nombre: ['Los moldes de Sahrim', 'Sahrim\'s molds'], tema: 'infierno', variantes: ['enfriando'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -45);
    for (let i = 0; i < 4; i++) {
      const x = -24 + i * 16; bloque(g, x, 0, 0, 13, 52, 8, { mat: ES, b: 1, j: 0.5 });
      g.poli([[x - 2.6, -22, 8.2], [x + 2.6, -22, 8.2], [x - 2.6, 20, 8.2], [x + 2.6, 20, 8.2], [x - 1.6, -22, 9.4], [x + 1.6, -22, 9.4], [x - 0.4, 24, 9], [x + 0.4, 24, 9]], { mat: i % 2 ? 'mon_fr_brasa' : HI, tono: i % 2 ? 0.05 : 0.1 });
    }
    g.cil(36, -10, 0, 12, 18, { mat: HI, r1: 14 }); g.elip(36, -10, 18, 12, 12, 1.6, { mat: LA, tono: 0.2 });
    cascotes(g, 8, 30, 20, ES, 0, 30, 3);
    for (let k = 0; k < 3; k++) g.palo([-40 + k * 4, 26, 0], [-34 + k * 6, 20, 30], 1.2, { mat: HI });
    bajoTierra(ps); return ps;
  },
});
void ruido;
