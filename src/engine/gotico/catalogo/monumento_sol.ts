import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, raiz, bajoTierra, bloque, letras, grieta, cascotes, huesos, calavera, cadena } from '../kit_muerte';
import { duna, anfora } from './hitos_mayores';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { tronco, aro, derrumbe } from './monumentos_kit2';
import './acto2';

/**
 * El Templo del Sol Caído (acto 2, Las Ruinas del Sol; su puerta baja a `a2_sol`). Canon: en el desierto de Sahrim cayó hace
 * mil años un pedazo de la primera brasa y los de aquí lo adoraron como su sol. Le hicieron un templo para tenerlo arriba: los
 * pilonos con los mástiles, la sala de columnas de papiro y al fondo el santuario alto, coronado por el marco de piedra donde
 * iba el disco, con los rayos tallados alrededor. Un día el sol se soltó y cayó delante del templo: quedó clavado de canto en
 * la arena, partido en dos, todavía tibio por la grieta. Desde entonces el sacerdote (Hamun) reza hacia abajo y los soles del
 * templo se volvieron a cavar con los rayos hacia el piso ("el altar mira hacia abajo"). Vinieron saqueadores a llevarse el
 * bronce: dejaron el andamio, las cuerdas, el trineo y a los que aplastó la mitad que se les vino encima.
 *
 * El templo va en las tres piezas del kit (15 de ancho: pilonos y portada adelante, la sala hipóstila al medio, el santuario
 * atrás) y alrededor, sueltos en el atrio (monumentos.ts): los dos colosos sentados a los lados de la avenida (`mon_sol_coloso`),
 * el sol caído con el andamio de los saqueadores (`mon_sol_disco`) y su campamento abandonado (`mon_sol_saqueo`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Sillares grandes y desparejos de arenisca dorada: hiladas de alto distinto, juntas comidas por el viento (anchas y oscuras),
 *  los cantos de cada bloque gastados, bandas horizontales de erosión y la arena que oscurece el pie. */
const sillarSol = (la: number, al: number, var0 = 0.3) => (p: V3, n: V3) => {
  // la humedad y el hollín en manchas grandes, la erosión del viento en bandas, el pie oscurecido por la arena
  const mancha = ruido(p[0] * 0.011 + 7, p[1] * 0.011, p[2] * 0.014), ero = (ruido(p[0] * 0.025 + p[1] * 0.025, 2, p[2] * 0.09) - 0.5) * 0.3 - Math.max(0, 1 - p[2] / 46) * 0.2 - (mancha > 0.6 ? (mancha - 0.6) * 1.1 : 0);
  if (Math.abs(n[2]) > 0.7) return (ruido(p[0] * 0.06, p[1] * 0.06, 1) - 0.5) * 0.24 + 0.06;
  // (la coordenada a lo largo de la cara va por su tangente: en las caras de la diagonal, x o y saltaban de una a otra)
  const hn = Math.hypot(n[0], n[1]) || 1, uu = (-p[0] * n[1] + p[1] * n[0]) / hn;
  const fq = p[2] / al, fila = Math.floor(fq), alto = al * (0.7 + ruido(fila * 1.7, 1, 2) * 0.6);
  const z0 = fila * al, t = (p[2] - z0) / alto;
  const u = uu + fila * la * 0.43, L = la * (0.55 + ruido(fila * 1.3, 3, 1) * 0.9), b = Math.floor(u / L), r = (u - b * L) / L;
  const borde = Math.min(t * alto, (1 - t) * al, r * L, (1 - r) * L);
  if (borde < 1.6) return -0.55 + ero * 0.3;
  const canto = borde < 4.2 ? -0.16 * (1 - (borde - 1.6) / 2.6) : 0;
  // bloques de tono desparejo, alguno picado o comido por el viento
  const tb = ruido(b * 2.1, fila * 1.7, 9), pic = tb > 0.86 ? (ruido(p[0] * 0.9, p[1] * 0.9, p[2] * 0.9) - 0.5) * 0.5 : 0;
  return (tb - 0.5) * var0 + ero + canto + pic + (ruido(p[0] * 0.7, p[1] * 0.7, p[2] * 0.7) > 0.8 ? -0.14 : 0);
};
M.mon_sol_piedra = { rampa: ['#0e0804', '#1d1209', '#311f0f', '#4a3016', '#64431e', '#7e5728', '#976b33', '#ae8143', '#c29757'], ruido: 0.2, escala: 0.16, patron: sillarSol(52, 24) };
/** Arenisca rosada (la de la portada y la corona: la cantera de otra veta) y la piedra quemada (donde ardió el sol al caer). */
M.mon_sol_rosa = { rampa: ['#100706', '#20100c', '#351c15', '#4d2a1f', '#663a2a', '#7f4c36', '#975f44', '#ae7456', '#c08a6a'], ruido: 0.2, escala: 0.16, patron: sillarSol(46, 22) };
M.mon_sol_quemada = { rampa: ['#070504', '#110b08', '#1d130c', '#2b1d12', '#3b2818', '#4c3420'], ruido: 0.3, escala: 0.2, patron: sillarSol(40, 20, 0.36) };
/** Ocre oscuro (el zócalo y los pedestales) y la luz cálida de adentro (la puerta, las troneras). */
M.mon_sol_ocre_osc = { rampa: ['#0f0703', '#1d0e06', '#30180a', '#46240f', '#5d3115', '#743f1b', '#8a4e23'], ruido: 0.22, escala: 0.16, patron: sillarSol(60, 26) };
M.mon_sol_luz = { rampa: ['#3a1406', '#6a2608', '#9c400e', '#cc6218', '#ee8a2a', '#ffb448', '#ffd884'], ruido: 0.4, escala: 0.25, emite: true };
M.mon_sol_liso = { rampa: ['#140c05', '#26190b', '#3c2a13', '#563d1b', '#715224', '#8b672f', '#a37c3d', '#b9914f'], ruido: 0.16, escala: 0.14, patron: (p, n) => (Math.abs(n[2]) > 0.7 ? 0.04 : 0) + (ruido(p[0] * 0.04 + p[1] * 0.04, 1, p[2] * 0.16) - 0.5) * 0.2 + (ruido(p[0] * 0.6, p[1] * 0.6, p[2] * 0.6) > 0.8 ? -0.1 : 0) };
/** El bronce del disco: oscuro, con verdín en lo hondo y el oro que asoma donde lo frotaron. */
M.mon_sol_bronce = { rampa: ['#120c06', '#22170b', '#3a2810', '#563c16', '#74521d', '#946a26', '#b28634', '#cca350'], ruido: 0.16, escala: 0.22, brillo: 0.55, patron: (p) => (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) > 0.7 ? -0.12 : 0) + (ruido(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5) - 0.5) * 0.12 };
/** El verdín que se juntó en lo hondo del bronce (solo en las vetas). */
M.mon_sol_verdin = { rampa: ['#08120e', '#0f2019', '#183026', '#234234', '#305443'], ruido: 0.3, escala: 0.3 };
M.mon_sol_oro = { rampa: ['#241503', '#422807', '#64400c', '#8a5c14', '#b07c1e', '#d29e30', '#ecc252'], ruido: 0.12, escala: 0.25, brillo: 0.6, patron: (p) => (ruido(p[0] * 0.6, p[1] * 0.6, p[2] * 0.6) - 0.5) * 0.12 };
/** La grieta del sol: lo que todavía arde adentro, al rojo que late. */
M.mon_sol_brasa = { rampa: ['#3a1004', '#6e1e06', '#a8360a', '#d85a12', '#f48a24', '#ffbe4c', '#ffe490'], ruido: 0.35, escala: 0.3, emite: true };
/** La boca del templo: lo hondo con el resplandor dorado que sube de abajo. */
M.mon_sol_hondo = { rampa: ['#040201', '#0a0502', '#140803', '#200d04', '#2e1406', '#3e1c08'], ruido: 0.4, escala: 0.3, emite: true };
/** Pintura gastada: el azul del cielo que adoraban y el rojo ocre (lo poco que dejó el viento en lo hondo de los relieves). */
M.mon_sol_azul = { rampa: ['#070b16', '#0d162a', '#152340', '#1e3257', '#2a446e'], ruido: 0.35, escala: 0.3, patron: (p) => (ruido(p[0] * 0.25, p[1] * 0.25, p[2] * 0.25) > 0.55 ? -0.45 : 0) };
M.mon_sol_ocre = { rampa: ['#1d0904', '#331107', '#4c1a0b', '#68240f', '#843014'], ruido: 0.35, escala: 0.3, patron: (p) => (ruido(p[0] * 0.25, p[1] * 0.25, p[2] * 0.25) > 0.55 ? -0.45 : 0) };
/** La arena que el viento junta en las repisas y contra los muros: la misma del piso, apenas más clara. */
M.mon_sol_arena = { rampa: ['#3a2c1a', '#544028', '#6e5536', '#886b45', '#a18255', '#b99a68', '#cbae7c'], ruido: 0.28, escala: 0.3, patron: (p) => (Math.sin(p[0] * 0.35 + p[1] * 0.2 + ruido(p[0] * 0.05, p[1] * 0.05, 2) * 6) > 0.7 ? -0.06 : 0) };
const S = 'mon_sol_piedra', RS = 'mon_sol_rosa', QM = 'mon_sol_quemada', OS = 'mon_sol_ocre_osc', L = 'mon_sol_liso', B = 'mon_sol_bronce', O = 'mon_sol_oro', AZ = 'mon_sol_azul', OC = 'mon_sol_ocre', AR = 'mon_sol_arena';

// ================================================================== oficio
/** Cara de un muro en talud: un grupo con x a lo largo de la cara, z por la cara (inclinada) y +y afuera. */
const cara = (g: G, x: number, y: number, giro: number, talud: number) => g.sub(x, y, 0, giro, talud, 'x');
/** Silueta en relieve hundido (bajo, que se lee con la luz rasante): una figura de pie de perfil, mirando a +x de la cara. */
function figura(c: G, x: number, z0: number, h: number, pose: 'marcha' | 'ofrenda' | 'golpe' | 'disco', prof = 2.6) {
  const o = { mat: S, resta: true }, k = h / 75, y = -prof / 2 + 0.3;
  // la pintura que quedó en el fondo del relieve: ocre en el cuerpo, azul en la peluca
  c.caja(x, -prof + 0.1, z0 + 24 * k, 12 * k, 0.6, 26 * k, { mat: OC, tono: -0.15 }); c.elip(x + 1.5 * k, -prof + 0.2, z0 + 67 * k, 4 * k, 0.3, 5.6 * k, { mat: AZ, tono: -0.1 });
  const P = (dx: number, dz: number, w: number, hh: number, gi = 0) => c.caja(x + dx * k, y, z0 + dz * k, w * k, prof, hh * k, { ...o, giro: 0, incl: gi, inclEje: 'y' });
  P(0, 64, 9, 11); c.elip(x + 1.5 * k, y, z0 + 66 * k, 3.4 * k, prof / 2, 5.6 * k, o);
  P(0, 36, 12, 27); P(0, 26, 16, 12);
  if (pose === 'marcha') { P(-4, 0, 4.4, 27, 14); P(5, 0, 4.4, 27, -14); } else { P(-2.5, 0, 4.4, 27); P(3, 0, 4.4, 27); }
  if (pose === 'ofrenda') { P(9, 46, 16, 4); c.elip(x + 18 * k, y, z0 + 50 * k, 4.6 * k, prof / 2, 4.6 * k, o); }
  else if (pose === 'golpe') { P(-6, 54, 4, 20, 30); P(-12, 70, 10, 4); P(8, 44, 14, 4); }
  else if (pose === 'disco') { P(-3, 60, 4, 14); P(3, 60, 4, 14); c.elip(x, y, z0 + 82 * k, 8.4 * k, prof / 2, 8.4 * k, o); }
  else P(8, 44, 12, 4);
}
/** Sol tallado en relieve: el disco hundido y los rayos largos y finos que terminan en manos (lo de aquí); `abajo` los da vuelta. */
function solRelieve(c: G, x: number, z: number, R: number, abajo: boolean, prof = 3) {
  c.cil(x, 0.6, z, R, prof + 0.6, { mat: S, resta: true, eje: [0, -1, 0] });
  c.cil(x, -prof + 0.4, z, R * 0.62, 0.8, { mat: O, eje: [0, 1, 0], tono: -0.25 });
  for (let i = 0; i < 9; i++) {
    const t = (abajo ? -Math.PI / 2 : Math.PI / 2) + (i - 4) * 0.2, L0 = R * 1.15, L1 = R * (2.2 + (i % 2) * 0.7);
    c.palo([x + Math.cos(t) * L0, 0.5, z + Math.sin(t) * L0], [x + Math.cos(t) * L1, 0.5, z + Math.sin(t) * L1], 2, { mat: S, resta: true });
    c.elip(x + Math.cos(t) * (L1 + 3), 0.4, z + Math.sin(t) * (L1 + 3), 3.4, 2, 3.4, { mat: S, resta: true });
  }
}
/** Columna de papiro: basa, fuste en haz con las ataduras pintadas y el capitel abierto (`abierto`) o cerrado. */
function papiro(g: G, x: number, y: number, h: number, r: number, abierto: boolean, rota = 0) {
  const a = g.a;
  g.cil(x, y, 0, r * 1.3, 6, { mat: L, r1: r * 1.2 });
  const hf = rota ? rota : h * 0.82;
  g.cil(x, y, 6, r, hf - 6, { mat: L, r1: r * 0.86 });
  for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU; g.cil(x + Math.cos(t) * r * 0.86, y + Math.sin(t) * r * 0.86, 6, r * 0.22, Math.min(hf, h * 0.8) - 8, { mat: L, tono: 0.04 }); }
  if (rota) { bloque(g, x, y, hf - 2, r * 2, r * 2, 5, { mat: L, giro: a.r() * 90, incl: 20, b: 1.4, j: 2 }); return; }
  for (const zz of [h * 0.62, h * 0.7, h * 0.78]) g.cil(x, y, zz, r * 0.92, 3, { mat: (Math.round(zz) % 2) ? AZ : OC, tono: -0.1 });
  if (abierto) g.cil(x, y, h * 0.82, r * 0.86, h * 0.16, { mat: L, r1: r * 1.9 });
  else { g.cil(x, y, h * 0.82, r * 0.9, h * 0.1, { mat: L, r1: r * 1.2 }); g.cil(x, y, h * 0.92, r * 1.2, h * 0.06, { mat: L, r1: r * 0.8 }); }
  g.caja(x, y, h * 0.98, r * 2.4, r * 2.4, h * 0.02 + 6, { mat: L });
}
/** Gola egipcia con su bocel: el toro en el canto de abajo y el cavetto que se abre y vuela, a lo largo de x de la cara. */
function golaCara(c: G, x0: number, x1: number, z: number, h: number, sale: number, pintada: boolean) {
  c.palo([x0, 1.4, z], [x1, 1.4, z], 3, { mat: L, tono: 0.07 });
  const n = 5;
  for (let i = 0; i < n; i++) {
    const t0 = i / n, t1 = (i + 1) / n, y0 = sale * (1 - Math.cos(t0 * Math.PI / 2)), y1 = sale * (1 - Math.cos(t1 * Math.PI / 2));
    c.poli([[x0 - y0, -2, z + 3 + t0 * h], [x1 + y0, -2, z + 3 + t0 * h], [x0 - y0, y0 + 1, z + 3 + t0 * h], [x1 + y0, y0 + 1, z + 3 + t0 * h], [x0 - y1, -2, z + 3 + t1 * h], [x1 + y1, -2, z + 3 + t1 * h], [x0 - y1, y1 + 1, z + 3 + t1 * h], [x1 + y1, y1 + 1, z + 3 + t1 * h]], { mat: L, tono: 0.02 - t0 * 0.04 });
  }
  c.caja((x0 + x1) / 2, sale * 0.5 - 1, z + 3 + h, x1 - x0 + sale * 2, sale + 3, 3.4, { mat: L, tono: 0.08 });
  // las hojas verticales del cavetto, pintadas a franjas gastadas
  if (pintada) for (let x = x0 + 4; x < x1 - 2; x += 7) c.caja(x, sale * 0.55 + 0.6, z + 3 + h * 0.55, 3.6, 1, h * 0.7, { mat: (Math.round(x / 7) % 2) ? AZ : OC, tono: -0.1, incl: -38 });
}
/** Arena que el viento arrima: una lengua contra un muro o en una repisa (`giro` hacia donde corre la lengua). */
const arena = (g: G, x: number, y: number, z: number, L: number, W: number, H: number, giro: number) => duna(g, [x, y, z], L, W, H, giro, 4, AR);

// ================================================================== el templo
/**
 * Marco F de la avenida (monumentos_kit): v a lo ancho (+v a la derecha de la pantalla), u hacia la cámara. La puerta mira a +u
 * desde u = 150; los pilonos van de u 120 a 170; la sala hipóstila de u -70 a 100; el santuario de u -235 a -120. Las alturas
 * respetan `alturaMax(u)`: lo de atrás se ve más alto en la pantalla aunque sea más bajo.
 */
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);

  // ------------------------------------------------------------ el santuario y el marco vacío del sol (atrás)
  const U0 = -235, U1 = -122, HS = 168, TS = 12, VS = 54;
  tronco(F, 0, (U0 + U1) / 2, 0, 16, VS * 2 + 18, U1 - U0 + 14, VS * 2 + 12, U1 - U0 + 8, { mat: OS });
  tronco(F, 0, (U0 + U1) / 2, 16, HS, VS * 2, U1 - U0, VS * 2 - TS * 2, U1 - U0 - TS * 2, { mat: S });
  const tS = (Math.atan(TS / (HS - 16)) * 180) / Math.PI;
  { const c = cara(F, 0, U1, 0, tS); golaCara(c, -VS + TS, VS - TS, HS - 20, 18, 8, true);
    c.caja(0, 0.6, 16, 30, 6, 84, { mat: S, resta: true }); c.caja(0, -3.4, 16, 20, 2, 74, { mat: 'mon_sol_hondo', tono: -0.2 });
    for (const sx of [-1, 1]) { figura(sx > 0 ? c : c.sub(0, 0, 0, 180), 22, 30, 60, 'disco'); figura(sx > 0 ? c : c.sub(0, 0, 0, 180), 36, 30, 56, 'marcha'); }
    letras(c, -40, 40, 0.4, 132, 3, S, 4, 1.8); }
  for (const sx of [-1, 1]) { const c = cara(F, sx * VS, (U0 + U1) / 2, sx > 0 ? -90 : 90, tS); golaCara(c, -(U1 - U0) / 2 + TS, (U1 - U0) / 2 - TS, HS - 20, 18, 8, false); if (sx > 0) for (let i = 0; i < 5; i++) figura(c, -40 + i * 16, 26, 52, i === 4 ? 'ofrenda' : 'marcha'); }
  // la corona: el marco de piedra donde iba el sol, de cara a la avenida, con el hueco hondo y partido, los rayos tallados
  // alrededor (en relieve bajo) y los garfios de bronce del soporte, torcidos y rotos
  const UC = U1 - 18, ZC = HS, RH = 48;
  const mc = F.sub(0, UC, ZC);
  mc.poli([[-80, -14, 0], [80, -14, 0], [-80, 14, 0], [80, 14, 0], [-68, -9, 78], [68, -9, 78], [-68, 9, 78], [68, 9, 78]], { mat: RS });
  golaCara(mc.sub(0, 10, 0), -68, 68, 72, 12, 6, true);
  mc.cil(0, 16, 46, RH, 26, { mat: S, resta: true, eje: [0, -1, 0] });
  mc.cil(0, -9.5, 46, RH, 2, { mat: L, eje: [0, 1, 0], tono: -0.2 });
  // en el fondo del hueco, la marca del disco: el aro más claro donde rozaba y la mancha del bronce
  aro(mc.sub(0, -7.8, 0, 0, -90, 'x'), 0, -46, RH - 6, 2.6, 'a2_raspado', 0, TAU, 30, 0, -0.1); mc.cil(0, -8.4, 46, RH * 0.5, 1, { mat: 'mon_sol_verdin', eje: [0, 1, 0] });
  // el borde partido abajo, donde se arrancó: dientes de piedra que faltan
  for (let i = 0; i < 5; i++) { const t = -Math.PI / 2 + (i - 2) * 0.32; mc.caja(Math.cos(t) * (RH + 3), 8, 46 + Math.sin(t) * (RH + 3), 11, 16, 8 + (i % 2) * 4, { mat: S, resta: true, incl: (t * 180) / Math.PI, inclEje: 'y' }); }
  // los rayos tallados en la piedra alrededor del hueco: largos, rectos, con su mano al final
  const rc = mc.sub(0, 14, 0);
  for (let i = 0; i < 18; i++) {
    const t = (i / 18) * TAU + 0.09; if (Math.sin(t) < -0.5) continue;
    const L0 = RH + 4, L1 = Math.min(RH + (i % 2 ? 18 : 28), (76 / Math.max(0.2, Math.abs(Math.cos(t))))); const zt = 46 + Math.sin(t) * L1; if (zt > 80 || zt < 4) continue;
    rc.palo([Math.cos(t) * L0, 0.6, 46 + Math.sin(t) * L0], [Math.cos(t) * L1, 0.6, zt], 3.4, { mat: S, resta: true });
    rc.elip(Math.cos(t) * (L1 + 3.4), 0.5, 46 + Math.sin(t) * (L1 + 3.4), 4.4, 2.4, 4.4, { mat: S, resta: true });
  }
  // los garfios del soporte: barras de bronce que salían del hueco para agarrar el disco, dobladas o partidas
  for (let i = 0; i < 5; i++) { const t = -Math.PI / 2 + (i - 2) * 0.55, r0 = RH - 4; const q: V3 = [Math.cos(t) * r0, 6, 46 + Math.sin(t) * r0], n: V3 = [Math.cos(t) * (r0 - 6), 20 + (i % 2) * 6, 46 + Math.sin(t) * (r0 - 6) + (i % 2 ? 8 : -6)]; mc.palo(q, n, 3.2, { mat: B }); if (i !== 2) mc.palo(n, [n[0] + (a.r() - 0.5) * 10, n[1] + 6, n[2] + (i % 2 ? 12 : -14)], 2.6, { mat: B, r1: 1.2 }); }
  for (const sx of [-1, 1]) cadena(mc, [sx * 26, 12, 80], [sx * 30, 16, 40], 0, 'mu_hierro', 1.4);
  // la arena del lado del viento (-v) contra el santuario y en sus repisas
  arena(F, -VS - 12, (U0 + U1) / 2 - 20, 0, 70, 26, 70, 90); arena(F, -30, U0 - 6, 0, 60, 22, 34, 0); arena(F, 40, U0 - 4, 0, 44, 18, 22, 10);
  arena(F, -26, (U0 + U1) / 2, HS, 40, 24, 6, 90);

  // ------------------------------------------------------------ la rampa que sube de la sala al santuario
  F.poli([[-22, -70, 0], [22, -70, 0], [-22, U1, 0], [22, U1, 0], [-22, -70, 40], [22, -70, 40], [-22, U1, HS - 70], [22, U1, HS - 70]], { mat: S, tono: -0.03 });
  for (let i = 0; i < 18; i++) { const t = i / 18, u = -70 + (U1 + 70) * t, z = 40 + (HS - 110) * t; F.caja(0, u - 1.5, z, 36, 5, 3, { mat: L, tono: -0.04 + (i % 3 === 0 ? 0.04 : 0) }); }
  for (const sx of [-1, 1]) F.poli([[sx * 18, -70, 40], [sx * 25, -70, 40], [sx * 18, U1, HS - 70], [sx * 25, U1, HS - 70], [sx * 18, -70, 48], [sx * 25, -70, 48], [sx * 18, U1, HS - 62], [sx * 25, U1, HS - 62]], { mat: L, tono: 0.06 });
  // dos obeliscos al pie de la rampa: uno en pie, el otro partido (la aguja tirada en el patio)
  for (const sx of [-1, 1]) {
    const x = sx * 72, y = -76, H = sx > 0 ? 180 : 70;
    tronco(F, x, y, 0, 14, 24, 24, 22, 22, { mat: S });
    tronco(F, x, y, 14, 14 + H, 14, 14, sx > 0 ? 8 : 11, sx > 0 ? 8 : 11, { mat: 'des2_glifos' });
    if (sx > 0) tronco(F, x, y, 14 + H, 26 + H, 8, 8, 0.4, 0.4, { mat: O, tono: -0.2 });
    else F.sub(x + 6, y + 12, 5, 60, 84, 'y').poli([[0, -5.5, -5.5], [0, 5.5, -5.5], [0, -5.5, 5.5], [0, 5.5, 5.5], [80, -4.5, -4.5], [80, 4.5, -4.5], [80, -4.5, 4.5], [80, 4.5, 4.5]], { mat: 'des2_glifos' });
  }

  // ------------------------------------------------------------ la sala hipóstila (al medio), en cruz: la nave y las dos alas
  const UH0 = -70, UH1 = 104, HH = 176, VH = 62;
  for (const sx of [-1, 1]) tronco(F, sx * (VH + 8), (UH0 + UH1) / 2, 0, HH, 16, UH1 - UH0, 10, UH1 - UH0, { mat: S }, 0, -sx * 3);
  tronco(F, 0, UH0 + 6, 0, HH, VH * 2 + 32, 12, VH * 2 + 28, 10, { mat: S });
  // las alas bajas a los costados, techadas, con su gola y la procesión
  for (const sx of [-1, 1]) {
    tronco(F, sx * 100, 0, 0, 150, 44, 92, 38, 86, { mat: S });
    golaCara(cara(F, sx * 100, 46, 0, 2), -19, 19, 128, 16, 6, true);
    const c = cara(F, sx * 122, 0, sx > 0 ? -90 : 90, 2); golaCara(c, -43, 43, 128, 16, 6, sx > 0);
    if (sx > 0) { for (let i = 0; i < 6; i++) figura(c, -38 + i * 15, 24, 58, i === 3 ? 'disco' : i === 5 ? 'ofrenda' : 'marcha'); letras(c, -40, 40, 0.4, 104, 2, S, 4, 1.8); c.caja(0, -0.2, 118, 84, 0.8, 3, { mat: OC, tono: -0.2 }); }
    F.caja(sx * 100, 0, 150, 40, 90, 6, { mat: L, tono: 0.04 });
  }
  // el muro de la derecha de la nave, roto: por la brecha se ven las columnas y entra la arena
  F.poli([[VH - 4, -30, HH + 4], [VH + 22, -30, HH + 4], [VH - 4, 90, HH + 4], [VH + 22, 90, HH + 4], [VH - 4, 10, 154], [VH + 22, 10, 154], [VH - 4, 90, 150], [VH + 22, 90, 150]], { mat: S, resta: true });
  derrumbe(F, 6, VH + 20, 30, 8, 20, 12, S);
  // las columnas: la nave alta del medio con capitel abierto, las de las alas más bajas con capitel cerrado
  for (const u of [-46, -12, 22, 56, 88]) for (const sx of [-1, 1]) papiro(F, sx * 24, u, HH + 12, 11.5, true, sx > 0 && u === 22 ? 130 : 0);
  for (const u of [-30, 4, 38]) for (const sx of [-1, 1]) papiro(F, sx * 48, u, HH - 34, 9.6, false, sx > 0 && u === 38 ? 70 : 0);
  // los arquitrabes y lo que queda del techo: losas sobre la nave, una caída de canto contra las columnas
  for (const sx of [-1, 1]) F.caja(sx * 24, 20, HH + 12, 18, 160, 11, { mat: S, tono: 0.03 });
  for (const u of [-40, 30]) F.caja(0, u, HH + 23, 66, 26, 9, { mat: S, tono: 0.05 });
  F.caja(-36, 4, HH - 34, 36, 90, 9, { mat: S });
  bloque(F, 26, 60, 0, 64, 26, 10, { mat: S, giro: 60, incl: 30, b: 1.4, j: 2 });
  for (let i = 0; i < 4; i++) bloque(F, 10 + a.r() * 40, -30 + a.r() * 100, 0, 30 + a.r() * 12, 16, 8, { mat: S, giro: a.r() * 180, incl: (a.r() - 0.5) * 40, b: 1.4, j: 2 });
  arena(F, 44, 60, 0, 60, 30, 26, 120); arena(F, -120, 0, 0, 80, 30, 70, 90); arena(F, -84, -60, 0, 50, 24, 40, 60);

  // ------------------------------------------------------------ los pilonos (adelante) y la portada honda
  const UP0 = 120, UP1 = 170, HP = 284, TP = 14, VP0 = 32, VP1 = 130;
  const tP = (Math.atan(TP / HP) * 180) / Math.PI;
  for (const sx of [-1, 1]) {
    const xc = sx * (VP0 + VP1) / 2, w0 = VP1 - VP0;
    tronco(F, xc, (UP0 + UP1) / 2, 0, HP, w0, UP1 - UP0, w0 - TP * 2, UP1 - UP0 - TP * 2, { mat: S });
    // el bocel en las aristas que se ven y la gola en las cuatro caras
    for (const [ex, ey] of [[w0 / 2, (UP1 - UP0) / 2], [-w0 / 2, (UP1 - UP0) / 2], [sx * w0 / 2, -(UP1 - UP0) / 2]] as number[][]) F.palo([xc + ex, (UP0 + UP1) / 2 + ey, 0], [xc + ex - Math.sign(ex) * TP, (UP0 + UP1) / 2 + ey - Math.sign(ey) * TP, HP], 3.4, { mat: L, tono: 0.06 });
    const w1 = w0 - TP * 2, d1 = UP1 - UP0 - TP * 2;
    const cf = cara(F, xc, UP1, 0, tP);
    golaCara(cf, -w1 / 2, w1 / 2, HP - 2, 28, 12, true);
    golaCara(cara(F, xc, UP0, 180, tP), -w1 / 2, w1 / 2, HP - 2, 28, 12, false);
    for (const lx of [-1, 1]) golaCara(cara(F, xc + lx * (w0 / 2), (UP0 + UP1) / 2, lx > 0 ? -90 : 90, tP), -d1 / 2, d1 / 2, HP - 2, 28, 12, lx === sx);
    // los nichos de los mástiles junto a la portada, los mástiles de cedro con sus abrazaderas y los jirones
    const nx = -sx * (w1 / 2 - 8);
    cf.caja(nx, -1.5, 24, 10, 10, HP - 40, { mat: S, resta: true });
    { const yb = UP1 - 5, x = xc + nx; F.palo([x, yb, 24], [x, yb - 4, HP + 72], 3.6, { mat: 'madera_vieja', r1: 2.2 }); for (const z of [HP * 0.4, HP * 0.75]) F.cil(x, yb - (z / HP) * 4, z, 4.6, 3, { mat: 'mu_hierro' });
      for (let i = 0; i < 2; i++) { const z1 = HP + 62 - i * 16, Lj = 26 + a.r() * 14; F.poli([[x, yb + 1, z1], [x, yb + 1, z1 - 10], [x - sx * Lj, yb + 9, z1 - 16], [x - sx * Lj * 0.8, yb + 10, z1 - 28], [x, yb + 2, z1], [x, yb + 2, z1 - 10], [x - sx * Lj, yb + 10, z1 - 16], [x - sx * Lj * 0.8, yb + 11, z1 - 28]], { mat: i ? 'tela_roja' : 'des2_alfombra', tono: -0.2 }); } }
    // el gran relieve: el rey que ofrece (o golpea) frente al sol tallado con los rayos para abajo, y los glifos
    figura(cf, -sx * 10, 60, 136, sx > 0 ? 'ofrenda' : 'golpe', 2.6);
    solRelieve(cf, -sx * 6 + sx * 30, 216, 20, true);
    letras(cf, -w1 / 2 + 8, w1 / 2 - 8, 0.4, 60, 4, S, 4, 1.8);
    grieta(cf, sx * 26, 0.2, 90, 240, S);
    // las troneras: rendijas altas por donde sale la luz de las escaleras de adentro, con su hollín arriba
    for (const [tx, tz] of [[sx * 22, 150], [-sx * 14, 196], [sx * 6, 104]] as number[][]) { cf.caja(tx, 0, tz, 5, 14, 22, { mat: S, resta: true }); cf.caja(tx, -6, tz, 5, 1, 22, { mat: 'mon_sol_luz', tono: -0.3 }); cf.poli([[tx - 3, 0.4, tz + 22], [tx + 3, 0.4, tz + 22], [tx - 3, 1, tz + 22], [tx + 3, 1, tz + 22], [tx - 1, 0.4, tz + 50], [tx + 1, 0.4, tz + 50], [tx - 1, 1, tz + 50], [tx + 1, 1, tz + 50]], { mat: QM, tono: -0.25 }); }
    // la arena que el viento deja en la repisa de la gola
    arena(F, xc, UP1 - 4 - TP, HP + 30, w1 * 0.6, 10, 5, 0);
    for (const gx of [-w1 / 2 + 6, w1 / 2 - 6]) for (let i = 0; i < 6; i++) letras(cf.sub(gx, 0, 0), -2, 2, 0.4, 190 - i * 2, 1, S, 4, 1.4);
    for (let i = 0; i < 10; i++) { const ex = (i % 2 ? 1 : -1) * (w0 / 2 - 2), z = 20 + a.r() * (HP - 60); F.caja(xc + ex - Math.sign(ex) * (z / HP) * TP, UP1 - 2 - (z / HP) * TP, z, 10 + a.r() * 8, 10, 8 + a.r() * 12, { mat: S, resta: true, giro: a.r() * 40 }); }
    for (let i = 0; i < 5; i++) cf.caja((a.r() - 0.5) * w1 * 0.8, 0, 30 + a.r() * (HP - 90), 14 + a.r() * 12, 4, 10 + a.r() * 8, { mat: S, resta: true });
  }
  // la arena del viento: contra el pilono de la izquierda, alta, y en el canto de su gola
  arena(F, -VP1 - 4, (UP0 + UP1) / 2, 0, 60, 30, 80, 90); arena(F, -96, UP1 + 4, 0, 50, 22, 36, 20); arena(F, -80, (UP0 + UP1) / 2, HP + 2, 30, 16, 6, 0);
  // la portada entre los pilonos, más baja, con el pórtico hondo: el hueco alto, la sombra adentro y la puerta al fondo
  const UQ = 150, HQ = 238;
  tronco(F, 0, (UP0 - 20 + UQ) / 2, 0, HQ, VP0 * 2 + 4, UQ - UP0 + 20, VP0 * 2, UQ - UP0 + 14, { mat: RS }, -3);
  { const c = cara(F, 0, UQ, 0, 1); golaCara(c, -VP0, VP0, HQ - 4, 22, 8, true);
    c.caja(0, 2, 0, 48, 12, 128, { mat: S, resta: true });
    c.caja(0, -6, 0, 36, 70, 104, { mat: S, resta: true });
    c.caja(0, -12, 104, 36, 40, 4, { mat: L });
    c.caja(0, -72, 0, 36, 2, 104, { mat: 'mon_sol_luz', tono: -0.42 });
    // el hollín de siglos de braseros sobre la puerta: lenguas negras que suben por la piedra rosada
    for (let i = 0; i < 5; i++) { const x = -20 + i * 10 + (a.r() - 0.5) * 4, h = 40 + a.r() * 50; c.poli([[x - 5, 0.3, 128], [x + 5, 0.3, 128], [x - 5, 0.9, 128], [x + 5, 0.9, 128], [x - 1.5 + (a.r() - 0.5) * 6, 0.3, 128 + h], [x + 1.5 + (a.r() - 0.5) * 6, 0.3, 128 + h], [x - 1.5, 0.9, 128 + h], [x + 1.5, 0.9, 128 + h]], { mat: QM, tono: -0.2 }); }
    for (let i = 0; i < 7; i++) c.caja(0, -14 - i * 8, -1 - i * 4, 34, 8, 3.6, { mat: L, tono: -0.24 - i * 0.05 });
    for (const sx of [-1, 1]) letras(c.sub(sx * 21, -1, 0), -1.5, 1.5, 0, 120, 10, S, 10, 1.6);
    for (let i = 0; i < 3; i++) figura(c, -18 + i * 18, 170, 40, i === 1 ? 'disco' : 'ofrenda');
    // el disco alado sobre la puerta, partido: la mitad de abajo del sol se cayó con el otro
    c.cil(0, 0.6, 158, 13, 3, { mat: S, resta: true, eje: [0, -1, 0] }); c.cil(0, -2, 158, 10, 0.8, { mat: O, eje: [0, 1, 0], tono: -0.3 });
    c.caja(0, 0.5, 148, 30, 5, 10, { mat: S, resta: true });
    for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) c.caja(sx * (19 + k * 3.4), 0.4, 152 + k * 3.8, 15 - k * 2.4, 3, 2.6, { mat: S, resta: true });
    for (const sx of [-1, 1]) c.caja(sx * 26, -2.4, 158, 14, 0.8, 11, { mat: AZ, tono: -0.2 }); }
  // el umbral: tres gradas que suben a la puerta (lo que sigue de la escalinata va en la avenida, `mon_sol_rampa`)
  for (let i = 0; i < 3; i++) F.caja(0, UQ - 8 - i * 6, 0, 44 - i * 2, 10, 4 + i * 4, { mat: L, tono: -0.06 });
  arena(F, -26, UQ - 4, 0, 30, 14, 10, 30);

  return {
    der: { c: [10, UQ - 30, 60] as V3, r: 72 + p * 10, color: '#ffa040' },
    izq: { c: [-10, UQ - 24, 50] as V3, r: 40, color: '#ffa040' },
    atras: { c: [0, UC, ZC + 46] as V3, r: 36 + p * 6, color: '#ff8a30' },
  };
}
registrarMonumento({ id: 'mon_sol', nombre: ['Templo del Sol Caído', 'Temple of the Fallen Sun'], tema: 'desierto', armar: (F, v, f) => { const r = armar(F, v, f); const conv = (c: V3): V3 => { const [x, y] = deAvenida(c[0], c[1]); return [x, y, c[2]]; }; const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) o[k] = { ...l, c: conv(l.c) }; return o; } });

// ================================================================== los colosos de la avenida
/**
 * Coloso sentado, exento, mirando a +y (4 veces una persona: cerca de 300 de alto). El trono con la atadura de las dos tierras
 * tallada al costado, las manos abiertas sobre las rodillas, el faldellín plisado, el collar, el paño de rayas y la doble
 * corona, la cara comida por el viento. `partido`: la cabeza y el hombro se cayeron delante, con el pecho cortado en diagonal.
 */
function coloso(g: G, partido: boolean) {
  const k = 3.5, s = g.esc(k), cs: Comp[] = [], m = L;
  // el pedestal y el trono
  bloque(g, 0, -2, 0, 124, 160, 12, { mat: OS, b: 2, j: 1, tono: -0.04 });
  letras(g.sub(0, 78, 0), -54, 54, 0, 8, 1, S, 4, 2);
  bloque(s, 0, -10, 3, 27, 24, 18.5, { mat: RS, b: 0.5, j: 0.25 });
  bloque(s, 0, -20, 21, 27, 4.6, 26, { mat: RS, b: 0.4, j: 0.2, tono: -0.03 });
  for (const sx of [-1, 1]) { const c = s.sub(sx * 13.6, -10, 3, sx > 0 ? -90 : 90); c.palo([-6, 0.1, 6], [6, 0.1, 6], 0.7, { mat: S, resta: true }); c.elip(0, 0.1, 11, 4, 0.5, 4, { mat: S, resta: true }); c.palo([-6, 0.1, 13], [6, 0.1, 13], 0.5, { mat: S, resta: true }); }
  // el cuerpo en tres masas (piernas, tronco, brazos: una sola masa de 300 de alto inflaba la caja del sprite)
  const cl: Comp[] = [], ca: Comp[] = [];
  cs.push(s.bu([0, -10, 24], [10, 8.4, 4.6]));
  cs.push(s.hu([0, -10.5, 25.4], [0, -11.2, 44], 8.4, 10.2));
  cs.push(s.bu([0, -9, 40], [11, 6.6, 7.4]));
  cs.push(s.hu([-11.6, -11, 46.6], [11.6, -11, 46.6], 4.2));
  cs.push(s.hu([0, -11, 47.4], [0, -10, 53], 4, 3.6));
  for (const sx of [-1, 1]) {
    cl.push(s.hu([sx * 5.4, -8, 22.6], [sx * 5.6, 8, 23], 5.6, 4.8));
    cl.push(s.bu([sx * 5.6, 9, 22], [4.6, 4.4, 4.2]));
    cl.push(s.hu([sx * 5.6, 10.4, 20], [sx * 5.8, 11.4, 3.6], 4.2, 3.6));
    cl.push(s.bu([sx * 5.8, 14.2, 1.8], [3.6, 6, 2]));
    ca.push(s.hu([sx * 12, -11, 45], [sx * 11.6, -4, 30], 3.8, 3.3));
    ca.push(s.hu([sx * 11.4, -3.6, 29.6], [sx * 7.6, 9, 25.6], 3.2, 2.9));
    ca.push(s.bu([sx * 7.2, 11.6, 25.4], [3.2, 4.6, 1.6]));
    ca.push(s.bu([sx * 12.4, -10.6, 44.6], [3.6, 3.8, 3.4]), s.bu([sx * 12, -7.6, 38], [3.4, 3.4, 4.4]), s.bu([sx * 10, 3, 28.4], [2.8, 4, 2.4]));
  }
  s.masa(cs, { mat: m, suave: 0.8 }); s.masa(cl, { mat: m, suave: 0.8 });
  for (const sx of [-1, 1]) s.masa(ca.filter((_, i) => (i < 6) === (sx < 0)), { mat: m, suave: 0.6 });
  // el pecho tallado a planos: los pectorales y el canto del esternón
  for (const sx of [-1, 1]) s.poli([[sx * 0.4, -3.4, 37], [sx * 9.4, -4.2, 38], [sx * 0.4, -2, 43], [sx * 9.4, -3, 43.6], [sx * 0.4, -5, 37], [sx * 9.4, -6, 38], [sx * 0.4, -5, 43], [sx * 9.4, -6, 43.6]], { mat: m, tono: 0.02 });
  // el faldellín plisado (estrías hundidas) y el cinto
  s.caja(0, -6, 23.6, 22, 13, 1.4, { mat: L, tono: 0.04 }); for (let i = 0; i < 9; i++) s.caja(-8 + i * 2, 1.7, 15.4, 0.4, 2.4, 8, { mat: m, resta: true });
  // los dedos de las manos sobre las rodillas
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) s.caja(sx * (5.2 + i * 1.3), 15.6, 26.6, 0.4, 2.6, 0.6, { mat: m, resta: true });
  if (!partido) {
    // el collar ancho, el paño de rayas con sus aletas sobre el pecho, la cara gastada y la doble corona
    for (const [r, mat, dy] of [[10, L, 0], [7.6, AZ, 0.4], [5.2, L, 0.8]] as [number, string, number][]) s.poli([[-r, -4.6 + dy, 48], [r, -4.6 + dy, 48], [-r * 0.5, -2.6 + dy, 48 - r * 0.6], [r * 0.5, -2.6 + dy, 48 - r * 0.6], [-r, -3.4 + dy, 48.6], [r, -3.4 + dy, 48.6], [-r * 0.5, -1.6 + dy, 48 - r * 0.6], [r * 0.5, -1.6 + dy, 48 - r * 0.6]], { mat, tono: -0.1 });
    s.elip(0, -8.6, 58, 4.6, 5, 5.6, { mat: m });
    s.poli([[-5.6, -13, 64.6], [5.6, -13, 64.6], [-5.6, -6, 64], [5.6, -6, 64], [-10, -13.6, 50], [10, -13.6, 50], [-9.4, -7.2, 50.4], [9.4, -7.2, 50.4]], { mat: L, tono: 0.02 });
    for (const sx of [-1, 1]) s.poli([[sx * 4.6, -6.4, 60.4], [sx * 7.8, -6.8, 60.4], [sx * 4.8, -4.6, 48.6], [sx * 8.6, -5, 48.6], [sx * 4.6, -4.6, 60.4], [sx * 7.8, -5, 60.4], [sx * 4.8, -2.8, 48.6], [sx * 8.6, -3.2, 48.6]], { mat: L });
    for (let i = 0; i < 4; i++) for (const sx of [-1, 1]) s.caja(sx * 6.6, -3.9 + i * 0.3, 50.6 + i * 2.5, 3.4, 0.7, 0.9, { mat: AZ, tono: -0.2 });
    // el paño: franjas de oro y lapislázuli gastadas en toda la tela, la que cae detrás y las aletas
    for (let i = 0; i < 6; i++) { const z = 51 + i * 2.2, w = 9.6 - i * 0.62; s.poli([[-w, -13.9 + i * 0.05, z], [w, -13.9 + i * 0.05, z], [-w + 0.2, -7.4 + i * 0.1, z], [w - 0.2, -7.4 + i * 0.1, z], [-w, -13.9 + i * 0.05, z + 0.9], [w, -13.9 + i * 0.05, z + 0.9], [-w + 0.2, -7.4 + i * 0.1, z + 0.9], [w - 0.2, -7.4 + i * 0.1, z + 0.9]], { mat: i % 2 ? O : AZ, tono: -0.18 }); }
    for (let i = 0; i < 5; i++) for (const sx of [-1, 1]) s.caja(sx * 6.6, -3.2 + i * 0.25, 49.4 + i * 2.3, 3.8, 0.6, 1, { mat: i % 2 ? O : AZ, tono: -0.15 });
    // la cara: frente bajo el paño, los ojos almendrados con el trazo largo del cosmético, los pómulos, la nariz partida, la
    // boca de labios llenos con la sonrisa quieta, el mentón con la barba postiza trenzada; el viento la comió de un lado
    s.elip(0, -4.4, 58.6, 3.8, 1.7, 3.6, { mat: m });
    for (const sx of [-1, 1]) {
      s.elip(sx * 1.8, -2.9, 59.8, 1.15, 0.7, 0.55, { mat: m, resta: true });
      s.elip(sx * 1.8, -3.1, 59.8, 0.5, 0.35, 0.45, { mat: 'mon_sol_quemada' });
      s.palo([sx * 2.9, -2.8, 59.9], [sx * 4, -3.2, 59.4], 0.22, { mat: m, resta: true });
      s.palo([sx * 0.8, -2.6, 60.9], [sx * 3, -3, 60.7], 0.28, { mat: m, tono: 0.08 });
      s.elip(sx * 2.4, -3.3, 58.1, 1.2, 0.9, 0.9, { mat: m, tono: 0.04 });
    }
    s.poli([[-0.5, -2.6, 59.6], [0.5, -2.6, 59.6], [-0.9, -2, 57.6], [0.9, -2, 57.6], [-0.5, -3.4, 59.6], [0.5, -3.4, 59.6], [-0.9, -3.4, 57.6], [0.9, -3.4, 57.6]], { mat: m });
    s.caja(0.4, -1.7, 57.2, 1.6, 1.2, 1.4, { mat: m, resta: true, giro: 20 });
    s.elip(0, -2.7, 56.6, 1.5, 0.6, 0.38, { mat: m, tono: 0.03 }); s.elip(0, -2.65, 56.1, 1.3, 0.6, 0.42, { mat: m, tono: -0.02 }); s.palo([-1.4, -2.3, 56.35], [1.4, -2.3, 56.35], 0.12, { mat: m, resta: true });
    s.palo([0, -3.2, 55], [0, -2.6, 50.6], 1.15, { mat: m, r1: 0.85 }); for (let i = 0; i < 4; i++) s.cil(0, -2.9 + i * 0.12, 51.4 + i * 1, 1.05, 0.25, { mat: m, resta: true });
    s.cil(0, -9.6, 64, 5, 3.6, { mat: L, r1: 4.6 }); s.cil(0, -9.6, 67.4, 4.4, 8, { mat: RS, r1: 2.4 }); s.esf(0, -9.6, 75.6, 2.4, { mat: RS });
    s.palo([0, -5.6, 64], [0, -4.8, 66.8], 0.7, { mat: O, tono: -0.1 }); s.esf(0, -4.6, 67.2, 0.8, { mat: O, tono: -0.1 });
    s.caja(-2.4, -2.4, 56.4, 4, 1.6, 6, { mat: m, resta: true, giro: 25 });
    // la mano derecha se partió: falta el puño y el pedazo está tirado en el pedestal
    s.caja(-7.4, 12, 25.6, 5, 7, 4, { mat: m, resta: true, giro: 10 }); bloque(g, -40, 58, 12, 16, 12, 9, { mat: L, giro: 40, incl: 18, b: 2, j: 2 });
  } else {
    // partido: el pecho cortado en diagonal, la cabeza con su corona tirada delante, de cara al cielo, hundida en la arena
    s.poli([[-16, -20, 47], [16, -20, 53], [-16, 4, 45], [16, 4, 51], [-16, -20, 80], [16, -20, 80], [-16, 4, 80], [16, 4, 80]], { mat: m, resta: true });
    for (let i = 0; i < 5; i++) s.caja(-12 + i * 6, -9 + (i % 2) * 4, 49 + i * 1.2, 4, 5, 3, { mat: m, resta: true, giro: i * 30 });
    const h = s.sub(10, 26, 4.6, 120, -70, 'x');
    h.elip(0, 0, 0, 4.6, 5, 5.6, { mat: m }); h.poli([[-5.6, -4.4, 6.6], [5.6, -4.4, 6.6], [-5.6, 2.6, 6], [5.6, 2.6, 6], [-9, -5, -6], [9, -5, -6], [-8.4, 1.4, -5.6], [8.4, 1.4, -5.6]], { mat: L });
    h.elip(0, 4.4, 0.4, 3.6, 1.4, 3.4, { mat: m }); h.cil(0, -1, 6, 5, 3.6, { mat: L, r1: 4.6 }); h.cil(0, -1, 9.4, 4.4, 8, { mat: L, r1: 2.4 });
    cascotes(g, 12, 50, 30, L, 30, 100, 6);
    for (let i = 0; i < 3; i++) bloque(g, -40 + i * 9, 90 + i * 14, 0, 26, 20, 16, { mat: L, giro: i * 40, incl: 20 + i * 10, b: 3, j: 3 });
  }
  // las grietas que bajan por el cuerpo y el trono
  for (const [x, y, z0, z1] of [[-6, 1, 6, 40], [8, 6, 10, 22], [4, -2, 30, 46]] as number[][]) grieta(s.sub(x, y, 0), 0, 0.4, z0, z1, m);
  // la arena: lenguas contra el trono del lado del viento, y en las rodillas
  arena(g, -60, -10, 0, 90, 36, 44, 90); arena(g, 30, 80, 0, 60, 24, 12, 160);
  s.elip(-5.6, 9, 26.4, 4, 3, 0.8, { mat: AR });
}
registrar({
  // (mira a la cámara, la avenida diagonal: `izq` entero y `der_partido` sin cabeza)
  id: 'mon_sol_coloso', nombre: ['Coloso del Sol Caído', 'Colossus of the Fallen Sun'], tema: 'desierto', variantes: ['izq', 'der_partido'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); coloso(g, v === 'der_partido'); bajoTierra(ps); return ps; },
});

// ================================================================== la escalinata de la avenida (plana: se pisa)
registrar({
  id: 'mon_sol_rampa', nombre: ['Escalinata del Sol Caído', 'Stair of the Fallen Sun'], tema: 'desierto', variantes: ['arenada'], huella: [5, 5], bloquea: false, plano: true,
  armar: (_v, _f, a) => {
    const { ps, g } = raiz(a, -45);
    // las losas de la avenida, hundidas y partidas, con la arena que se come la mitad de la izquierda
    for (let r2 = 0; r2 < 6; r2++) for (let k = 0; k < 4; k++) { const v0 = -27 + k * 18, u = 40 - r2 * 16; if (v0 < -10 && r2 > 2 && a.r() < 0.6) continue; bloque(g, v0 + (a.r() - 0.5) * 2, u, -1.2, 17, 15, 1.8, { mat: L, b: 0.5, j: 0.5, tono: -0.1 + (a.r() - 0.5) * 0.1, giro: (a.r() - 0.5) * 4 }); }
    for (let i = 0; i < 5; i++) g.elip(-24 + a.r() * 14, -30 + a.r() * 60, 0, 14 + a.r() * 10, 9 + a.r() * 5, 1.4, { mat: AR, giro: a.r() * 180 });
    cascotes(g, 6, 30, 30, L, 6, 0, 2.4);
    bajoTierra(ps); return ps;
  },
});

// ================================================================== el sol caído y el andamio de los saqueadores
function disco(g: G, f: number) {
  const a = g.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU), brasa = { mat: 'mon_sol_brasa', tono: -0.22 + p * 0.3 };
  // el disco: piedra con su cara de bronce, clavado de canto en la arena e inclinado, partido en dos por la grieta del medio
  const R = 104, T = 24;
  const mitad = (sg: number, gi: number, inc: number, dx: number, dz: number) => {
    const d = g.sub(dx, -4, R - 30 + dz, -45 + gi, inc, 'x');
    d.cil(0, -T / 2, 0, R, T, { mat: S, eje: [0, 1, 0] });
    d.caja(-sg * (R + 10), 0, -R - 10, R * 2 + 20, T + 20, R * 2 + 20, { mat: S, resta: true, giro: 0, incl: sg * 8, inclEje: 'y' });
    d.cil(0, T / 2 - 1, 0, R - 6, 4, { mat: B, eje: [0, 1, 0] });
    // los rayos tallados en la cara de bronce, en relieve bajo, y el ombligo con su aro
    for (let i = 0; i < 24; i++) { const t = (i / 24) * TAU; if (Math.sign(Math.cos(t)) !== sg && Math.abs(Math.cos(t)) > 0.06) continue; d.palo([Math.cos(t) * 30, T / 2 + 3, Math.sin(t) * 30], [Math.cos(t) * (R - 14), T / 2 + 3, Math.sin(t) * (R - 14)], 1.4, { mat: B, resta: true }); }
    d.cil(0, T / 2 + 2.6, 0, 26, 3, { mat: B, eje: [0, 1, 0], tono: 0.08 }); d.cil(0, T / 2 + 5, 0, 12, 2, { mat: O, eje: [0, 1, 0], tono: -0.1 });
    aro(d.sub(0, T / 2 + 3.2, 0, 0, -90, 'x'), 0, 0, R - 8, 2.2, B, 0, TAU, 40);
    // el canto de piedra con las hiladas de la talla y la cara de atrás picada
    for (let i = 0; i < 6; i++) d.caja((a.r() - 0.5) * R, -T / 2 - 1, (a.r() - 0.5) * R, 14 + a.r() * 10, 3, 10, { mat: S, resta: true, giro: a.r() * 90 });
    return d;
  };
  mitad(-1, 0, 16, -6, 0); mitad(1, 7, 24, 10, -8);
  // la grieta: al rojo adentro, entre las dos mitades
  { let q: V3 = [-2, -4, 6]; for (let i = 0; i < 10; i++) { const n: V3 = [-2 + (a.r() - 0.5) * 9, -4 + (a.r() - 0.5) * 5, 6 + (i + 1) * 19]; g.palo(q, n, 4.4 - (i % 3) * 0.8, brasa); if (i % 3 === 1) g.palo(n, [n[0] + (a.r() < 0.5 ? -1 : 1) * (10 + a.r() * 10), n[1], n[2] + 8], 1.6, brasa); q = n; } }
  // la arena vidriada y quemada alrededor, donde pegó al caer, con grietas que todavía brillan
  for (let i = 0; i < 6; i++) g.elip(-10 + (a.r() - 0.5) * 70, 10 + (a.r() - 0.5) * 60, 0.2, 18 + a.r() * 16, 12 + a.r() * 10, 0.8, { mat: QM, giro: a.r() * 180, tono: -0.1 });
  for (let i = 0; i < 6; i++) { const t = (i / 6) * TAU + 0.4; g.palo([Math.cos(t) * 10, Math.sin(t) * 10, 0.4], [Math.cos(t) * (40 + a.r() * 30), Math.sin(t) * (40 + a.r() * 30), 0.4], 1.4, { ...brasa, tono: brasa.tono - 0.12 }); }
  // la arena que se lo traga: un médano contra el lado del viento y lo que saltó al caer
  arena(g, -40, -60, 0, 120, 44, 50, 30); arena(g, 30, 40, 0, 80, 34, 22, 120);
  // el andamio de los saqueadores: postes, travesaños, la polea y las cuerdas que bajan al disco, la escala
  const P = (x: number, y: number, h: number) => g.palo([x, y, -4], [x, y, h], 2.4, { mat: 'madera_vieja' });
  for (const [x, y] of [[60, -40], [60, 30], [100, -40], [100, 30]] as number[][]) P(x, y, 200);
  for (const z of [70, 140, 198]) { g.palo([60, -40, z], [60, 30, z], 1.8, { mat: 'madera_vieja' }); g.palo([100, -40, z], [100, 30, z], 1.8, { mat: 'madera_vieja' }); g.palo([60, -40, z], [100, -40, z], 1.8, { mat: 'madera_vieja' }); }
  for (const z of [70, 140]) for (let i = 0; i < 5; i++) g.caja(80, -36 + i * 16, z + 1.5, 44, 14, 2.4, { mat: 'madera_vieja', tono: (a.r() - 0.5) * 0.2, giro: (a.r() - 0.5) * 6 });
  g.palo([60, -40, 0], [100, 30, 140], 1.4, { mat: 'madera_vieja' });
  // el brazo de la grúa que sale hacia el disco, con la polea y las dos cuerdas tirantes al bronce (una cortada)
  g.palo([60, 0, 198], [-20, 0, 236], 3, { mat: 'madera_vieja' }); g.palo([60, 0, 140], [0, 0, 230], 2, { mat: 'madera_vieja' });
  g.cil(-18, 0, 228, 6, 4, { mat: 'mu_hierro', eje: [0, 1, 0] });
  g.palo([-18, 0, 226], [-24, -10, 150], 0.9, { mat: 'cuerda' }); g.palo([-18, 2, 226], [-8, 6, 190], 0.9, { mat: 'cuerda' }); g.palo([-8, 6, 190], [-6, 12, 176], 0.9, { mat: 'cuerda', tono: 0.2 });
  g.palo([-18, 0, 228], [62, 0, 202], 0.7, { mat: 'cuerda' }); g.palo([62, 0, 60], [62, 0, 202], 0.7, { mat: 'cuerda' });
  for (let i = 0; i < 8; i++) g.palo([104, -46 + i * 0.3, i * 18], [104, -34 + i * 0.3, i * 18], 1.2, { mat: 'madera_vieja' });
  g.palo([104, -46, 0], [104, -46, 144], 1.4, { mat: 'madera_vieja' }); g.palo([104, -34, 0], [104, -34, 144], 1.4, { mat: 'madera_vieja' });
  // el trineo con sus rodillos, las cuñas y lo que aplastó la mitad que se vino encima
  g.caja(40, 90, 4, 110, 40, 8, { mat: 'madera_vieja', giro: -30 }); for (let i = 0; i < 5; i++) g.sub(10 + i * 20, 110 - i * 12, 3).cil(0, -20, 0, 3.4, 40, { mat: 'madera_vieja', eje: [0, 1, 0], tono: -0.1 });
  for (let i = 0; i < 3; i++) bloque(g, -40 + i * 26, 64 + i * 6, 0, 16, 10, 8, { mat: 'madera_vieja', giro: i * 60, incl: 25, b: 0.8, j: 0.8 });
  huesos(g, 10, 24, 14, 10, 50, 0.9, 0.4);
  calavera(g.sub(26, 46, 2, 200), 4, 'mu_hueso', true, -0.2); calavera(g.sub(-30, 52, 1.5, 70), 4, 'mu_hueso', false, -0.25);
  for (let i = 0; i < 3; i++) g.sub(-10 + i * 18, 62 + i * 4, 6).palo([0, 0, 0], [14, 8, 30], 1.4, { mat: 'mu_hueso', tono: -0.2 });
  return { c: [0, 0, 90] as V3, r: 70 + p * 14, color: '#ff6a20' };
}
registrar({
  id: 'mon_sol_disco', nombre: ['El sol caído', 'The fallen sun'], tema: 'desierto', variantes: ['clavado'], huella: [9, 6], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => { const { ps, g } = raiz(a); const r = disco(g, f); bajoTierra(ps); return { piezas: ps, resplandor: r }; },
});

// ================================================================== el campamento abandonado de los saqueadores
registrar({
  id: 'mon_sol_saqueo', nombre: ['Campamento de los saqueadores', 'Looters\' camp'], tema: 'desierto', variantes: ['abandonado'], huella: [6, 6], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g } = raiz(a);
    // dos tiendas caídas: los palos en ángulo y la lona rota encima
    for (const [x, y, gi, caida] of [[-30, -20, 20, 0], [24, 10, -30, 1]] as number[][]) {
      const t = g.sub(x, y, 0, gi);
      t.palo([-20, 0, 0], [0, 0, caida ? 22 : 40], 1.4, { mat: 'madera_vieja' }); t.palo([20, 0, 0], [0, 0, caida ? 22 : 40], 1.4, { mat: 'madera_vieja' });
      t.poli([[-22, -16, 0], [22, -16, 0], [-2, -14, caida ? 20 : 38], [2, -14, caida ? 20 : 38], [-22, 0, 0], [22, 0, 0]], { mat: 'des2_lana_negra', tono: -0.1 });
      t.poli([[-22, 16, 0], [22, 16, 0], [-2, 14, caida ? 18 : 38], [2, 14, caida ? 18 : 38], [-22, 0, 0.4], [22, 0, 0.4]], { mat: 'des2_alfombra', tono: -0.25 });
      if (caida) t.caja(6, 6, 6, 14, 12, 14, { mat: 'des2_alfombra', resta: true });
    }
    // el fuego apagado, la olla volcada, los cajones con el bronce que juntaron, los picos y la cuerda en rollo
    for (let i = 0; i < 7; i++) { const t = (i / 7) * TAU; bloque(g, 12 + Math.cos(t) * 9, -26 + Math.sin(t) * 9, 0, 5, 4, 3, { mat: S, giro: t * 57, b: 0.6, j: 0.6 }); }
    g.elip(12, -26, 0.4, 7, 7, 1, { mat: 'ext_carbon' }); g.sub(20, -32, 4, 30, 80, 'y').cil(0, 0, 0, 5, 7, { mat: 'mu_hierro', r1: 6 });
    for (const [x, y, gi] of [[-34, 22, 10], [-18, 30, 40]] as number[][]) { bloque(g, x, y, 0, 16, 11, 11, { mat: 'madera_vieja', giro: gi, b: 0.6, j: 0.4 }); for (let i = 0; i < 4; i++) g.elip(x + (a.r() - 0.5) * 10, y + (a.r() - 0.5) * 6, 11.5, 3, 2, 1, { mat: B, tono: 0.1 }); }
    for (let i = 0; i < 2; i++) g.palo([-6 + i * 8, 34, 0.6], [6 + i * 8, 20, 4], 0.8, { mat: 'madera_vieja' });
    g.cil(30, 30, 0, 7, 3.4, { mat: 'cuerda', r1: 6 }); g.cil(30, 30, 3.4, 4, 1, { mat: 'negro' });
    for (const [x, y] of [[-8, -40], [40, -8]] as number[][]) anfora(g, x, y, 1.8, a.r() * 90, a.r() < 0.5);
    // el último que se quedó: un esqueleto sentado contra el cajón, con la cantimplora
    calavera(g.sub(-26, 14, 10, 30), 3.4, 'mu_hueso', true, -0.2); g.palo([-26, 14, 2], [-26, 13, 9], 2.4, { mat: 'mu_hueso', tono: -0.25 }); huesos(g, 6, 8, 6, -18, 8, 0.7, 0.3);
    duna(g, [-40, -4, 0], 30, 14, 9, 80, 3, AR); duna(g, [40, 30, 0], 24, 12, 6, 120, 3, AR);
    bajoTierra(ps); return ps;
  },
});

// ================================================================== los braseros del pórtico
/** Brasero alto de bronce sobre su pie de piedra: el cuenco con el fuego que no se apaga (el juego le pone su fuego vivo). */
registrar({
  id: 'mon_sol_brasero', nombre: ['Brasero del Sol Caído', 'Brazier of the Fallen Sun'], tema: 'desierto', variantes: ['encendido'], huella: [1, 1], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    bloque(g, 0, 0, 0, 22, 22, 12, { mat: OS, b: 1.4, j: 0.6 });
    tronco(g, 0, 0, 12, 18, 18, 18, 14, 14, { mat: RS });
    g.cil(0, 0, 18, 4.4, 34, { mat: B, r1: 3 });
    for (let i = 0; i < 3; i++) { const t = (i / 3) * TAU + 0.5; g.palo([Math.cos(t) * 10, Math.sin(t) * 10, 18], [Math.cos(t) * 3, Math.sin(t) * 3, 40], 1.4, { mat: B }); }
    g.cil(0, 0, 50, 6, 8, { mat: B, r1: 13 }); g.cil(0, 0, 58, 13, 2, { mat: B, tono: 0.1 });
    for (let i = 0; i < 8; i++) { const t = (i / 8) * TAU; g.palo([Math.cos(t) * 13, Math.sin(t) * 13, 59], [Math.cos(t) * 15.5, Math.sin(t) * 15.5, 63], 1, { mat: B }); }
    g.elip(0, 0, 59, 11, 11, 2.4, { mat: 'ext_carbon' });
    for (let i = 0; i < 5; i++) g.elip((a.r() - 0.5) * 12, (a.r() - 0.5) * 12, 60, 2.4, 2.4, 1.6, { mat: 'mon_sol_brasa', tono: -0.1 + p * 0.2 });
    // el hollín en la piedra de atrás y la arena al pie
    duna(g, [-10, -6, 0], 18, 8, 5, 30, 3, AR);
    bajoTierra(ps);
    return { piezas: ps, resplandor: { c: [0, 0, 66] as V3, r: 46 + p * 8, color: '#ff9a3a' } };
  },
});
