import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido, type Comp } from '../render';
import { G, raiz, bajoTierra, bloque, ojiva, llama, figuraVelada, calavera, cadena, letras, cascotes } from '../kit_muerte';
import { campana } from './hitos_mayores';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { tronco } from './monumentos_kit2';

/**
 * La Catedral de las Campanas Ahogadas (acto 6, la Plaza de las Ánimas del Barrio Sumergido; baja a `a6_catedral1`). Canon: es
 * la catedral de Ysmeral, la que pactó con el mar hace siglos; el mar sube a veces y se la queda. No se parece a la de Santa
 * Oria: está hundida y ladeada como un barco que se va a pique (la cabecera más honda, todo el cuerpo escorado a la derecha), el
 * techo se lo llevó el mar y quedan las nervaduras desnudas como costillas de ballena con las algas colgando, la nave está llena
 * de agua que alumbra verde (las ánimas), los muros de sal están comidos de percebes, corales y algas hasta donde llega la
 * marea, y el campanario, sin aguja, se inclina sobre la plaza con sus campanas a la vista y la cadena del ancla enrollada. La
 * campana grande se cayó del rosetón y quedó trabada en el hueco. Se entra por el pórtico de adelante, lo único que sigue en
 * alto, por una calzada de losas entre el agua.
 *
 * Sueltos en el atrio (monumentos.ts): las dos plañideras de sal arrodilladas, enormes, tapándose la cara (`mon_ys_planidera`),
 * los faroles de los marinos (`mon_ys_brasero`), el ancla clavada con su cadena (`mon_ys_ancla`) y una campana caída con los
 * ahogados abrazados a ella (`mon_ys_campana`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Piedra de sal: blanca gris, en sillares, con la mancha verde negra de la marea abajo y las costras de sal arriba. */
M.mon_ys_piedra = {
  rampa: ['#10131a', '#1d222a', '#2d333b', '#40464e', '#555b62', '#6b7176', '#82878b', '#9a9ea0', '#b1b4b4', '#c8cac8'], ruido: 0.22, escala: 0.22,
  patron: (p, n) => {
    const marea = p[2] < 90 ? -0.34 * (1 - p[2] / 90) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.1) > 0.5 ? -0.12 : 0) : 0;
    if (n[2] > 0.6) return 0.24 + marea;
    const hn = Math.hypot(n[0], n[1]) || 1, uu = (-p[0] * n[1] + p[1] * n[0]) / hn, fila = Math.floor(p[2] / 18), u = uu + fila * 17, L = 30 + ruido(fila, 1, 1) * 18, r = u / L - Math.floor(u / L), t = p[2] / 18 - fila;
    const borde = Math.min(t * 18, (1 - t) * 18, r * L, (1 - r) * L);
    return (borde < 1.2 ? -0.4 : (ruido(Math.floor(u / L) * 2.3, fila * 1.3, 4) - 0.5) * 0.24) + marea + (ruido(p[0] * 0.03, p[1] * 0.03, p[2] * 0.02) > 0.68 ? 0.16 : 0);
  },
};
M.mon_ys_sal = { rampa: ['#141a1e', '#232b30', '#364046', '#4c565c', '#646e73', '#7e878b', '#99a0a3', '#b4b9bb', '#cdd1d2'], ruido: 0.3, escala: 0.25, patron: (p, n) => (n[2] > 0.5 ? 0.24 : 0) + (p[2] < 60 ? -0.2 : 0) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.2 };
M.mon_ys_alga = { rampa: ['#050a06', '#0a140c', '#122014', '#1a2e1c', '#243c24', '#2f4c2c'], ruido: 0.5, escala: 0.3 };
M.mon_ys_percebe = { rampa: ['#141210', '#24201b', '#363027', '#4a4234', '#5e5442', '#726551', '#867862'], ruido: 0.5, escala: 0.6 };
M.mon_ys_coral = { rampa: ['#2a0a08', '#48140e', '#661e14', '#842a1a', '#a03a22', '#b84e2e'], ruido: 0.4, escala: 0.4 };
M.mon_ys_agua = { rampa: ['#020a0c', '#041416', '#072024', '#0b2e33', '#103e44', '#175058', '#21656e'], ruido: 0.4, escala: 0.06, emite: true, patron: (p) => (ruido(p[0] * 0.04, p[1] * 0.04, 2) > 0.66 ? 0.3 : (ruido(p[0] * 0.012, p[1] * 0.012, 5) - 0.5) * 0.3) };
M.mon_ys_animas = { rampa: ['#062418', '#0c3e2a', '#16603f', '#2a8a5c', '#4ab884', '#86e0b0', '#c8f8de'], ruido: 0.4, escala: 0.2, emite: true };
M.mon_ys_espuma = { rampa: ['#56636a', '#73828a', '#93a2a8', '#b3c0c4', '#d2dcde', '#eaf0f0'], ruido: 0.5, escala: 0.4 };
M.mon_ys_bronce = { rampa: ['#0a1410', '#12241c', '#1c362a', '#284a38', '#365e48', '#4a7458', '#648a68'], ruido: 0.3, escala: 0.3, brillo: 0.4, patron: (p) => (ruido(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) > 0.6 ? 0.2 : 0) };
M.mon_ys_hierro = { rampa: ['#0c0806', '#1a100a', '#2a1a10', '#3c2416', '#50301c', '#643c22'], ruido: 0.4, escala: 0.4 };
const PI = 'mon_ys_piedra', AL = 'mon_ys_alga', PE = 'mon_ys_percebe', CO = 'mon_ys_coral', AG = 'mon_ys_agua', AN = 'mon_ys_animas', ES = 'mon_ys_espuma', BR = 'mon_ys_bronce', HI = 'mon_ys_hierro';

/** Percebes y conchas en racimo sobre una cara (en el plano x-z del grupo, mirando a +y). */
function percebes(g: G, x0: number, x1: number, z0: number, z1: number, y: number, n: number) {
  const a = g.a; for (let i = 0; i < n; i++) { const x = x0 + a.r() * (x1 - x0), z = z0 + a.r() * (z1 - z0), r = 1.4 + a.r() * 2.6; g.palo([x, y, z], [x + (a.r() - 0.5) * 1.4, y + r * 1.2, z + (a.r() - 0.5) * 1.4], r, { mat: PE, r1: r * 0.45, tono: (a.r() - 0.5) * 0.12 }); }
}
/** Algas que cuelgan de un canto: tiras que caen ondulando. */
function algas(g: G, x0: number, x1: number, y: number, z: number, n: number, L: number) {
  const a = g.a; for (let i = 0; i < n; i++) { let q: V3 = [x0 + a.r() * (x1 - x0), y, z]; const l = L * (0.4 + a.r() * 0.6); for (let k = 0; k < 4; k++) { const nq: V3 = [q[0] + Math.sin(k * 1.7 + i) * 2.4, q[1] + 0.6, q[2] - l / 4]; g.palo(q, nq, 1.4 - k * 0.25, { mat: AL, tono: (a.r() - 0.5) * 0.1 }); q = nq; } }
}
/** Un arco apuntado de palos (nervadura o rosca) en el plano x-z, a la profundidad `y`. */
function arcoOjiva(g: G, w: number, hr: number, y: number, r: number, mat: string, tono = 0) {
  const pts = ojiva(w, hr, 0.85, 6).slice(2);
  let q: V3 = [w / 2, y, 0]; g.palo([w / 2, y, 0], [w / 2, y, hr], r, { mat, tono }); q = [w / 2, y, hr];
  for (const [x, z] of pts) { const n: V3 = [x, y, z]; g.palo(q, n, r, { mat, tono }); q = n; }
  g.palo(q, [-w / 2, y, 0], r, { mat, tono });
}

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  // ------------------------------------------------------------ el agua: la plaza inundada alrededor, con la espuma que rompe
  // (en poliedros chatos: un óvalo de agua de 250 inflaba la caja de cada pieza)
  const charco = (cv: number, cu: number, rv: number, ru: number, z: number, tono: number) => { const pts: V3[] = []; for (let i = 0; i < 16; i++) { const t = (i / 16) * TAU; let v = cv + Math.cos(t) * rv, u = cu + Math.sin(t) * ru; u = Math.min(u, 296 - Math.abs(v)); u = Math.max(u, -486 + Math.abs(v)); pts.push([v, u, z], [v, u, z + 1.4]); } F.poli(pts, { mat: AG, tono }); };
  charco(0, -40, 228, 240, 0, 0.05); charco(-40, 40, 160, 130, 0.6, 0.12);
  for (let k = 0; k < 26; k++) { const t = (k / 26) * TAU, rv = 220 + a.r() * 16, ru = 236 + a.r() * 16, v = Math.cos(t) * rv, u = -40 + Math.sin(t) * ru; if (u > 300 - Math.abs(v) - 20 || u < -480 + Math.abs(v) || u > 150) continue; F.elip(v, u, 1.6, 16 + a.r() * 14, 6, 1.6, { mat: ES, giro: (t * 180) / Math.PI + 90 }); }
  // ------------------------------------------------------------ la catedral: escorada a la derecha y con la cabecera hundida
  const N = F.sub(0, 120, -26, 0, 11, 'y').sub(0, 0, 0, 0, -5, 'x').sub(0, -120, 0);
  const U0 = -250, U1 = 150, WN = 94, HM = 252, NB = 7, BAY = (U1 - U0) / NB;
  // los muros de la nave, por tramos, con su ventana apuntada (la luz verde de las ánimas adentro) y los pilares entre tramo y tramo
  for (const s of [-1, 1]) {
    for (let b = 0; b < NB; b++) {
      const u0 = U0 + b * BAY, um = u0 + BAY / 2, roto = s > 0 && (b === 2 || b === 5), alto = roto ? HM * (0.55 + a.r() * 0.2) : HM - (a.r() < 0.3 ? 20 : 0);
      N.caja(s * WN, um, 0, 14, BAY + 0.5, alto, { mat: PI, tono: (a.r() - 0.5) * 0.06 });
      if (!roto) { const W = N.sub(s * (WN + 8), um, 40, s > 0 ? 90 : -90); W.poli([[-12, -2, 0], [12, -2, 0], [-12, 30, 0], [12, 30, 0], [-12, -2, 80], [12, -2, 80], [-12, 30, 80], [12, 30, 80]], { mat: PI, resta: true }); W.caja(0, 6, 0, 22, 1, 104, { mat: AN, tono: -0.2 + p * 0.1 }); arcoOjiva(W.sub(0, -0.5, 0), 26, 80, 0, 2, PI, 0.06); algas(W, -10, 10, 0, 100, 4, 40); }
      N.caja(s * (WN + 6), u0, 0, 22, 14, HM + 10, { mat: PI, tono: 0.04 });
      percebes(N.sub(s * (WN + 9), um, 0, s > 0 ? 90 : -90), -BAY / 2, BAY / 2, 2, 70, 0, 18);
    }
  }
  N.caja(0, U0 - 6, 0, WN * 2 + 14, 14, HM * 0.7, { mat: PI });
  // el agua adentro de la nave, que alumbra verde, y lo que flota
  N.caja(0, (U0 + U1) / 2, 0, WN * 2 - 12, U1 - U0 - 10, 84, { mat: AG, tono: 0.2 }); N.caja(0, (U0 + U1) / 2, 84, WN * 2 - 14, U1 - U0 - 12, 1, { mat: AN, tono: -0.25 });
  // las nervaduras desnudas: los arcos de la bóveda que quedaron, como costillas, con las algas que cuelgan y algún pedazo de techo
  for (let b = 0; b <= NB; b++) {
    const u = U0 + b * BAY; if (b === 3) continue;
    const R2 = N.sub(0, u, HM); arcoOjiva(R2, WN * 2, 0, 0, 4.4, PI, 0.08);
    algas(R2, -WN * 0.6, WN * 0.6, 3, 90 - Math.abs(b - 3) * 6, 5, 70);
  }
  N.palo([0, U0, HM + 128], [0, U1, HM + 128], 3.4, { mat: PI, tono: 0.06 });
  // ------------------------------------------------------------ la fachada: el muro alto, el hueco del rosetón con la campana trabada
  {
    const UF0 = U1 + 8;
    N.caja(0, UF0, 0, WN * 2 + 40, 26, 330, { mat: PI });
    N.poli([[-WN - 20, UF0 - 13, 330], [WN + 20, UF0 - 13, 330], [-WN - 20, UF0 + 13, 330], [WN + 20, UF0 + 13, 330], [-30, UF0 - 13, 380], [-30, UF0 + 13, 380], [-60, UF0, 372], [10, UF0, 360]], { mat: PI, tono: 0.04 });
    N.caja(40, UF0, 330, 70, 40, 60, { mat: PI, resta: true }); N.caja(-WN - 4, UF0, 250, 30, 40, 90, { mat: PI, resta: true });
    // el hueco del rosetón: un agujero redondo roto, con la campana grande que se cayó y quedó trabada
    N.sub(0, UF0, 250, 0, 90, 'x').cil(0, 0, -20, 50, 40, { mat: PI, resta: true });
    N.sub(0, UF0 + 12, 250, 0, 90, 'x').cil(0, 0, 0, 54, 3, { mat: PI, tono: 0.08, r1: 50 });
    campana(N.sub(-6, UF0 + 4, 282), [0, 0, 0], [0.34, 0.42, -0.84], 40, BR);
    algas(N, -40, 40, UF0 + 14, 206, 8, 60);
    // el pórtico: el arco apuntado hondo con sus roscas, adelante, y la puerta de la marea
    const UP = 214, AR = 40;
    N.caja(0, (UF0 + UP) / 2, 0, AR * 2 + 52, UP - UF0, 170, { mat: PI, tono: 0.02 });
    N.poli([[-AR - 26, UF0, 170], [AR + 26, UF0, 170], [-AR - 26, UP, 170], [AR + 26, UP, 170], [0, UF0, 226], [0, UP, 226], [0, UF0, 224], [0, UP, 224]], { mat: PI, tono: 0.06 });
    N.caja(0, UP - 30, -40, AR * 2, 80, 156, { mat: PI, resta: true }); const pt = ojiva(AR * 2, 116, 0.85, 6, 0); N.poli([...pt.map(([x, z]) => [x, UP + 5, z] as V3), ...pt.map(([x, z]) => [x, UP - 66, z] as V3)], { mat: PI, resta: true });
    for (let r = 0; r < 3; r++) arcoOjiva(N.sub(0, UP - 1 - r * 7, 0), AR * 2 + 10 + r * 12, 116, 0, 3.4, PI, 0.08 - r * 0.03);
    N.caja(0, UP - 64, 0, AR * 2, 2, 150, { mat: AN, tono: -0.05 + p * 0.1 });
    for (let i = 0; i < 6; i++) N.caja(0, UP - 8 - i * 9, 26 - i * 9, AR * 2 - 4, 9, 2, { mat: PI, tono: -0.1 - i * 0.04 });
    letras(N.sub(0, UP + 0.4, 0), -AR - 18, AR + 18, 0, 196, 2, PI, 4.6, 2);
    percebes(N.sub(0, UP + 1, 0), -AR - 24, AR + 24, 2, 60, 0, 40); algas(N, -AR - 20, AR + 20, UP + 2, 170, 10, 46);
    // los corales que le crecen al pórtico y las estrellas de mar
    for (let k = 0; k < 8; k++) { const x = (k < 4 ? -1 : 1) * (AR + 14 + a.r() * 10), z = 10 + a.r() * 70; for (let j = 0; j < 4; j++) N.palo([x, UP + 2, z], [x + (a.r() - 0.5) * 12, UP + 6 + a.r() * 6, z + 6 + a.r() * 10], 1.2, { mat: CO, r1: 0.6 }); }
  }
  // ------------------------------------------------------------ el campanario: sin aguja, ladeado sobre la plaza, las campanas a la vista
  {
    const T = F.sub(158, -40, -10, 0, 15, 'y').sub(0, 0, 0, 0, 10, 'x');
    tronco(T, 0, 0, 0, 380, 86, 86, 74, 74, { mat: PI });
    for (let k = 0; k < 5; k++) T.caja(0, 0, 60 + k * 64, 90 - k * 3, 90 - k * 3, 6, { mat: PI, tono: 0.08 });
    // el cuerpo de campanas: cuatro vanos abiertos con sus campanas colgando y el agua que chorrea
    T.caja(0, 0, 380, 80, 80, 80, { mat: PI });
    for (const [x, y, gi] of [[0, 40, 0], [40, 0, 90]] as number[][]) { T.caja(x, y, 386, gi ? 12 : 44, gi ? 44 : 12, 66, { mat: PI, resta: true }); }
    T.caja(0, 0, 386, 44, 44, 66, { mat: PI, resta: true });
    campana(T.sub(0, 2, 410), [0, 0, 40], [0, 0, -1], 18, BR); campana(T.sub(14, -10, 420), [0, 0, 30], [0, 0, -1], 11, BR);
    T.palo([-30, 0, 452], [30, 0, 452], 2.6, { mat: 'madera' });
    // la corona rota (sin aguja: se la llevó el mar), las algas, los percebes y la cadena del ancla enrollada
    for (let k = 0; k < 8; k++) T.caja(-32 + (k % 4) * 21, k < 4 ? -32 : 32, 460, 14, 14, 10 + a.r() * 26, { mat: PI, tono: 0.04 });
    algas(T, -40, 40, 43, 380, 10, 90); percebes(T.sub(0, 43.5, 0), -38, 38, 2, 120, 0, 40);
    let q: V3 = [46, 30, 20]; for (let k = 0; k < 26; k++) { const t = k * 0.6, n: V3 = [Math.cos(t) * 48, Math.sin(t) * 48, 20 + k * 10]; cadena(T, q, n, 0.4, HI, 2.6); q = n; }
  }
  // ------------------------------------------------------------ la calzada de losas entre el agua hasta el pórtico, y lo que dejó la marea
  for (let k = 0; k < 6; k++) bloque(F, (a.r() - 0.5) * 6, 160 + k * 10, -1, 64 - k * 2, 9, 3, { mat: PI, tono: -0.12, b: 0.6, j: 0.5, giro: (a.r() - 0.5) * 6 });
  cascotes(F, 10, 120, 30, PI, -40, 120, 4);
  for (let k = 0; k < 5; k++) calavera(F.sub(-120 + a.r() * 240, 120 + a.r() * 60, 1, a.r() * 360), 3.2, 'mu_hueso', k % 2 === 0, -0.1);
  return {
    der: { c: [0, 170, 70] as V3, r: 90 + p * 12, color: '#4ad89a' },
    medio: { c: [0, -40, 100] as V3, r: 150 + p * 20, color: '#3ac888' },
    atras_d: { c: [160, -40, 440] as V3, r: 70 + p * 10, color: '#4ad89a' },
  };
}
registrarMonumento({
  id: 'mon_ysmeral', nombre: ['Catedral de las Campanas Ahogadas', 'Cathedral of the Drowned Bells'], tema: 'ahogada', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== las plañideras de sal
/** Una mujer de sal arrodillada, enorme, que se tapa la cara; los percebes le suben por el manto y le cuelgan algas. */
registrar({
  id: 'mon_ys_planidera', nombre: ['Plañidera de sal', 'Salt mourner'], tema: 'ahogada', variantes: ['izq', 'der'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => {
    const { ps, g } = raiz(a, -45);
    bloque(g, 0, 0, 0, 120, 110, 14, { mat: PI, b: 2, j: 1, tono: -0.1 }); g.elip(0, 0, 14, 64, 58, 3, { mat: AG, tono: 0.05 });
    // la figura arrodillada y encorvada, el manto que se derrama en el piso, la cabeza velada que cae hacia adelante y las dos
    // manos sobre la cara (masas de sal, lisas, con los pliegues cavados)
    const S = g.sub(0, 0, 14, v === 'der' ? 14 : -14).esc(4.4), SA = 'mon_ys_sal', cs: Comp[] = [], cb: Comp[] = [];
    cs.push(S.bu([0, -2, 5], [17, 15, 7]), S.bu([0, 1, 9], [13, 11, 8]), S.hu([0, -1, 12], [0, 2.5, 30], 9.4, 7), S.bu([0, 1.6, 29], [10.4, 6.6, 5.4]));
    S.masa(cs, { mat: SA, suave: 2.4 });
    for (let i = 0; i < 9; i++) { const t = -1.2 + i * 0.3; S.palo([Math.sin(t) * 17, Math.cos(t) * 15 - 2, 1], [Math.sin(t) * 9, Math.cos(t) * 7 + 1, 22], 0.6, { mat: SA, resta: true }); }
    // la cabeza velada, adelantada y baja, y el velo que cae por la espalda
    cb.push(S.bu([0, 5.4, 35.4], [4.6, 5.2, 5.4]), S.hu([0, 3, 37], [0, -3.6, 26], 4.6, 6.4), S.hu([0, 1, 32], [0, 4.6, 35], 3, 3));
    for (const sx of [-1, 1]) cb.push(S.hu([sx * 8.4, 1, 29], [sx * 7, 6.6, 21], 2.8, 2.4), S.hu([sx * 7, 6.6, 21], [sx * 2.4, 9.6, 33], 2.4, 2), S.bu([sx * 1.8, 10.2, 35], [2.2, 1.6, 3]));
    S.masa(cb, { mat: SA, suave: 1.4 });
    for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) S.palo([sx * (0.8 + k * 1.1), 11.6, 37.4], [sx * (0.6 + k * 1.1), 11.6, 33.6], 0.3, { mat: SA, resta: true });
    // la sal que le cae de los hombros y el velo en costras, y lo que dejó el mar en ella
    for (let k = 0; k < 6; k++) S.elip((k - 2.5) * 3, -2 + (k % 2), 33 + (k % 3), 2.6, 2.2, 1.2, { mat: 'mon_ys_espuma', tono: 0.1 });
    percebes(g.sub(0, 30, 14), -40, 40, 0, 50, 0, 40); algas(g, -30, 30, 26, 150, 8, 70);
    for (let k = 0; k < 6; k++) g.palo([-40 + k * 16, 28, 14], [-38 + k * 16, 36, 30 + (k % 3) * 8], 1.6, { mat: CO, r1: 0.6 });
    bajoTierra(ps); return ps;
  },
});

// ================================================================== los faroles de los marinos
registrar({
  id: 'mon_ys_brasero', nombre: ['Farol de los ahogados', 'Lantern of the drowned'], tema: 'ahogada', variantes: ['encendido'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    g.palo([0, 0, 0], [0, 0, 70], 2.4, { mat: 'madera' }); g.palo([0, 0, 64], [14, 0, 66], 1.4, { mat: HI });
    g.cil(14, 0, 44, 5, 16, { mat: HI, r1: 4 }); g.cil(14, 0, 46, 4, 12, { mat: AN, tono: 0.2 + pp * 0.1 }); for (let k = 0; k < 2; k++) llama(g, 14, 0, 48, 2.6, 8, f, 4, k, 'mon_ys_animas');
    cadena(g, [14, 0, 66], [14, 0, 60], 0.2, HI, 1); percebes(g.sub(0, 2.6, 0), -2, 2, 0, 30, 0, 10);
    g.elip(0, 0, 0.6, 12, 12, 1.4, { mat: AG });
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [14, 0, 52] as V3, r: 56 + pp * 8, color: '#4ad89a' } };
  },
});

// ================================================================== el ancla clavada y su cadena
registrar({
  id: 'mon_ys_ancla', nombre: ['El ancla de Ysmeral', 'The anchor of Ysmeral'], tema: 'ahogada', variantes: ['clavada'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -30, 18);
    g.palo([0, 0, -10], [0, 0, 110], 5, { mat: HI }); g.palo([-26, 0, 100], [26, 0, 100], 3.4, { mat: HI });
    for (const s of [-1, 1]) { let q: V3 = [0, 0, -6]; for (let k = 1; k <= 5; k++) { const t = (k / 5) * 1.3, n: V3 = [s * Math.sin(t) * 40, 0, -6 + (1 - Math.cos(t)) * 40]; g.palo(q, n, 4.4 - k * 0.3, { mat: HI }); q = n; } g.poli([[q[0], -3, q[2]], [q[0], 3, q[2]], [q[0] + s * 10, -1, q[2] + 14], [q[0] + s * 10, 1, q[2] + 14], [q[0] - s * 4, 0, q[2] - 6]], { mat: HI }); }
    g.cil(0, 0, 112, 6, 4, { mat: HI, r1: 7 });
    cadena(g0, [0, 0, 110], [-40, 30, 0.6], 20, HI, 2.4); cadena(g0, [-40, 30, 0.6], [-70, -10, 0.6], 2, HI, 2.4);
    percebes(g.sub(0, 5, 0), -4, 4, 20, 90, 0, 22); algas(g, -20, 20, 2, 96, 5, 40);
    g0.elip(0, 0, 0.5, 46, 40, 2, { mat: AG }); cascotes(g0, 6, 30, 30, PI, 0, 0, 3);
    bajoTierra(ps); return ps;
  },
});

// ================================================================== la campana caída con los ahogados abrazados
registrar({
  id: 'mon_ys_campana', nombre: ['La campana caída', 'The fallen bell'], tema: 'ahogada', variantes: ['abrazada'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -30);
    g.elip(0, 0, 0.4, 50, 40, 2, { mat: AG });
    campana(g, [-24, 0, 30], [0.96, 0, -0.28], 28, BR);
    percebes(g.sub(0, 22, 0), -20, 20, 4, 40, 0, 30);
    figuraVelada(g.sub(-30, 14, 0, 60), 34, { mat: 'mon_ys_sal', pose: 'abraza', tono: -0.1 }); figuraVelada(g.sub(24, 22, 0, -70), 34, { mat: 'mon_ys_sal', pose: 'rodillas', tono: -0.12 });
    algas(g, -20, 20, 20, 30, 6, 24);
    bajoTierra(ps); return ps;
  },
});
void ruido;
