import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';
import { G, raiz, bajoTierra, bloque, ojiva, llama, figuraVelada, calavera, cadena, letras, cascotes } from '../kit_muerte';
import { campana } from './hitos_mayores';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { tronco, aro, sillares } from './monumentos_kit2';
const sillaresYs = sillares(64, 30, { var: 0.28, manchas: 0.8, pie: 20 });

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
M.mon_ys_piedra = { rampa: ['#0c0f12', '#191e22', '#282e33', '#3a4146', '#4f565b', '#666d71', '#7f8588', '#999ea0', '#b3b7b7', '#cbcecc'], ruido: 0.2, escala: 0.2,
  patron: (p, n) => { const base = sillaresYs(p, n), marea = p[2] < 120 ? -0.42 * (1 - Math.max(0, p[2]) / 120) - (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.1) > 0.5 ? 0.1 : 0) : 0, sal = p[2] > 200 && ruido(p[0] * 0.03, p[1] * 0.03, p[2] * 0.02) > 0.5 ? 0.22 : 0.08; return base + marea + sal; } };
M.mon_ys_sal = { rampa: ['#141a1e', '#232b30', '#364046', '#4c565c', '#646e73', '#7e878b', '#99a0a3', '#b4b9bb', '#cdd1d2'], ruido: 0.3, escala: 0.25, patron: (p, n) => (n[2] > 0.5 ? 0.24 : 0) + (p[2] < 60 ? -0.2 : 0) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) - 0.5) * 0.2 };
M.mon_ys_alga = { rampa: ['#050a06', '#0a140c', '#122014', '#1a2e1c', '#243c24', '#2f4c2c'], ruido: 0.5, escala: 0.3 };
M.mon_ys_percebe = { rampa: ['#141210', '#24201b', '#363027', '#4a4234', '#5e5442', '#726551', '#867862'], ruido: 0.5, escala: 0.6 };
M.mon_ys_coral = { rampa: ['#2a0a08', '#48140e', '#661e14', '#842a1a', '#a03a22', '#b84e2e'], ruido: 0.4, escala: 0.4 };
M.mon_ys_agua = { rampa: ['#010403', '#020806', '#040e0a', '#07160f', '#0b2016', '#122d1f', '#1c3e2b'], ruido: 0.4, escala: 0.06, emite: true, patron: (p) => (ruido(p[0] * 0.04, p[1] * 0.04, 2) > 0.66 ? 0.3 : (ruido(p[0] * 0.012, p[1] * 0.012, 5) - 0.5) * 0.3) };
M.mon_ys_animas = { rampa: ['#062418', '#0c3e2a', '#16603f', '#2a8a5c', '#4ab884', '#86e0b0', '#c8f8de'], ruido: 0.4, escala: 0.2, emite: true };
M.mon_ys_espuma = { rampa: ['#56636a', '#73828a', '#93a2a8', '#b3c0c4', '#d2dcde', '#eaf0f0'], ruido: 0.5, escala: 0.4 };
M.mon_ys_bronce = { rampa: ['#140c06', '#26180c', '#3c2814', '#56391c', '#704c26', '#8a6232', '#a67a40', '#c29452'], ruido: 0.25, escala: 0.3, brillo: 0.6, patron: (p) => (ruido(p[0] * 0.15, p[1] * 0.15, p[2] * 0.15) - 0.5) * 0.18 };
M.mon_ys_verdin = { rampa: ['#0a1814', '#12291f', '#1c3d2e', '#2a5541', '#3a6e55', '#52886b'], ruido: 0.4, escala: 0.3 };
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
  // ------------------------------------------------------------ el agua: verde negra, con el reflejo de las ánimas y la espuma
  const charco = (cv: number, cu: number, rv: number, ru: number, z: number, mat: string, tono: number) => { const pts: V3[] = []; for (let i = 0; i < 18; i++) { const t = (i / 18) * TAU; let v = cv + Math.cos(t) * rv * (0.9 + 0.1 * Math.sin(t * 3)), u = cu + Math.sin(t) * ru; u = Math.min(u, 296 - Math.abs(v)); u = Math.max(u, -486 + Math.abs(v)); pts.push([v, u, z], [v, u, z + 1.4]); } F.poli(pts, { mat, tono }); };
  charco(0, -60, 236, 250, 0, AG, 0); charco(-20, 30, 150, 120, 0.8, AG, 0.06);
  for (let k = 0; k < 14; k++) F.elip(-140 + a.r() * 280, -200 + a.r() * 300, 2.4, 12 + a.r() * 26, 3 + a.r() * 4, 0.6, { mat: AN, tono: -0.35 + a.r() * 0.1, giro: (a.r() - 0.5) * 30 });
  // el escombro que asoma del agua alrededor
  for (let k = 0; k < 16; k++) { const t = a.r() * TAU, rr = 150 + a.r() * 70, v = Math.cos(t) * rr, u = -60 + Math.sin(t) * rr; if (u > 296 - Math.abs(v) - 30 || u < -486 + Math.abs(v) || (u > 90 && Math.abs(v) < 160)) continue; bloque(F, v, u, -6, 18 + a.r() * 22, 12 + a.r() * 14, 10 + a.r() * 22, { mat: PI, giro: a.r() * 90, incl: (a.r() - 0.5) * 40, b: 1.4, j: 1 }); F.elip(v, u, 1.6, 22, 10, 1.2, { mat: ES, giro: a.r() * 180 }); }
  // ------------------------------------------------------------ la catedral: hundida hasta media ventana y escorada a la derecha
  const N = F.sub(0, 140, -70, 0, 14, 'y').sub(0, 0, 0, 0, -6, 'x').sub(0, -140, 0);
  const U0 = -300, U1 = 150, WN = 104, HM = 340, NB = 6, BAY = (U1 - U0) / NB, ZW = 110, WW = 52, HW = 150;
  for (const s of [-1, 1]) {
    for (let b = 0; b < NB; b++) {
      const u0 = U0 + b * BAY, um = u0 + BAY / 2, roto = s > 0 && b === 2, alto = roto ? HM * 0.62 : HM;
      // el muro del tramo con su ventanal ojival vacío, la tracería (parteluz, dos lancetas y el óculo) y la luz verde adentro
      N.caja(s * WN, um, 0, 18, BAY + 0.5, alto, { mat: PI, tono: (a.r() - 0.5) * 0.05 });
      if (roto) { for (let k = 0; k < 6; k++) bloque(N, s * (WN + 20 + a.r() * 30), um + (a.r() - 0.5) * BAY, alto - 30 + a.r() * 20, 20, 14, 12, { mat: PI, giro: a.r() * 90, incl: 30, b: 1, j: 0.8 }); continue; }
      const W = N.sub(s * WN, um, ZW, s > 0 ? -90 : 90), pts = ojiva(WW, HW, 0.85, 7);
      W.poli([...pts.map(([x, z]) => [x, -14, z] as V3), ...pts.map(([x, z]) => [x, 14, z] as V3)], { mat: PI, resta: true });
      W.caja(0, -6, 0, WW, 1, HW + 40, { mat: AN, tono: -0.3 + p * 0.08 });
      W.palo([0, 4, 0], [0, 4, HW + 4], 2.2, { mat: PI, tono: 0.08 });
      for (const sx of [-1, 1]) { const q = ojiva(WW / 2 - 4, HW - 34, 0.85, 5).map(([x, z]) => [x + sx * WW / 4, 4, z] as V3); for (let i = 0; i < q.length - 1; i++) if (i > 1) W.palo(q[i], q[i + 1], 1.4, { mat: PI, tono: 0.08 }); }
      aro(W.sub(0, 4, 0), 0, HW + 6, 11, 1.6, PI, 0, TAU, 16, 0, 0.08);
      // el marco de la ventana en tres roscas
      for (let r = 0; r < 2; r++) { const q = ojiva(WW + 8 + r * 8, HW, 0.85, 7); for (let i = 0; i < q.length - 1; i++) if (i > 1) W.palo([q[i][0], 9 + r * 2, q[i][1]], [q[i + 1][0], 9 + r * 2, q[i + 1][1]], 2.2, { mat: PI, tono: 0.06 - r * 0.04 }); }
      algas(W.sub(0, 12, 0), -WW / 2, WW / 2, 0, 40, 6, 40);
      // el agua que entra por el ventanal bajo: una lengua de espuma en el alféizar
      W.elip(0, 12, 2, WW * 0.5, 8, 2, { mat: ES, tono: 0.05 });
      percebes(N.sub(s * (WN + 9), um, 0, s > 0 ? 90 : -90), -BAY / 2, BAY / 2, 30, 110, 0, 22);
    }
    // los contrafuertes en escalones y los arbotantes (unos rotos) que vuelan al muro
    for (let b = 0; b <= NB; b++) {
      const u = U0 + b * BAY, c = N.sub(s * (WN + 34), u, 0);
      tronco(c, 0, 0, 0, 200, 34, 30, 28, 26, { mat: PI }); tronco(c, 0, 0, 200, 290, 28, 26, 20, 20, { mat: PI, tono: 0.04 });
      c.poli([[-10, -10, 290], [10, -10, 290], [-10, 10, 290], [10, 10, 290], [0, 0, 330]], { mat: PI, tono: 0.08 });
      const roto = (b + (s > 0 ? 1 : 0)) % 3 === 0, L = roto ? 0.55 : 1;
      let q: V3 = [s * (WN + 30), u, 250]; for (let k = 1; k <= 6; k++) { const t = (k / 6) * L, n: V3 = [s * (WN + 30 - 26 * t), u, 250 + Math.sin(t * Math.PI * 0.6) * 46]; N.palo(q, n, 6 - k * 0.3, { mat: PI, tono: 0.04 }); q = n; }
      if (roto) N.elip(q[0], q[1], q[2] - 4, 6, 6, 5, { mat: PI, tono: -0.05 });
      percebes(c.sub(0, 16, 0), -14, 14, 30, 120, 0, 10);
    }
  }
  N.caja(0, U0 - 8, 0, WN * 2 + 18, 18, HM * 0.6, { mat: PI });
  // el agua de la nave, alta, que alumbra verde
  N.caja(0, (U0 + U1) / 2, 0, WN * 2 - 14, U1 - U0 - 10, 150, { mat: AG, tono: 0.15 }); N.caja(0, (U0 + U1) / 2, 150, WN * 2 - 16, U1 - U0 - 12, 1.4, { mat: AG, tono: 0.3 + p * 0.06 });
  // la bóveda: los arcos fajones gruesos que quedaron, con su nervadura y algas, y alguna plementería colgando
  for (let b = 0; b <= NB; b++) {
    if (b === 3) continue;
    const u = U0 + b * BAY, R2 = N.sub(0, u, HM), q = ojiva(WN * 2, 0, 0.85, 9);
    for (let i = 2; i < q.length - 1; i++) { N.palo([q[i][0], u, HM + q[i][1]], [q[i + 1][0], u, HM + q[i + 1][1]], 9, { mat: PI, tono: 0.06 }); N.palo([q[i][0], u + 6, HM + q[i][1] - 4], [q[i + 1][0], u + 6, HM + q[i + 1][1] - 4], 4, { mat: PI, tono: -0.04 }); }
    algas(R2, -WN * 0.6, WN * 0.6, 8, 120 - Math.abs(b - 3) * 10, 7, 90);
  }
  // un trozo de plementería que no se cayó, entre los dos primeros arcos
  N.poli([[-WN, U0 + BAY * 4, HM + 4], [-WN * 0.2, U0 + BAY * 4, HM + 150], [-WN, U1, HM + 4], [-WN * 0.2, U1, HM + 150], [-WN, U0 + BAY * 4, HM + 16], [-WN * 0.2, U0 + BAY * 4, HM + 160], [-WN, U1, HM + 16], [-WN * 0.2, U1, HM + 160]], { mat: PI, tono: -0.08 });
  // ------------------------------------------------------------ la fachada: el muro alto, el rosetón roto con la campana trabada, el pórtico
  {
    const UF0 = U1 + 10;
    N.caja(0, UF0, 0, WN * 2 + 52, 30, 400, { mat: PI });
    N.poli([[-WN - 26, UF0 - 15, 400], [WN + 26, UF0 - 15, 400], [-WN - 26, UF0 + 15, 400], [WN + 26, UF0 + 15, 400], [-40, UF0 - 15, 470], [-40, UF0 + 15, 470], [-70, UF0, 460], [0, UF0, 450]], { mat: PI, tono: 0.04 });
    N.caja(50, UF0, 400, 90, 40, 80, { mat: PI, resta: true });
    for (const s of [-1, 1]) { const c = N.sub(s * (WN + 30), UF0 + 4, 0); tronco(c, 0, 0, 0, 380, 40, 40, 30, 30, { mat: PI }); c.poli([[-14, -14, 380], [14, -14, 380], [-14, 14, 380], [14, 14, 380], [0, 0, s < 0 ? 450 : 410]], { mat: PI, tono: 0.08 }); percebes(c.sub(0, 21, 0), -18, 18, 30, 140, 0, 14); }
    // el rosetón: el hueco redondo roto, su marco con la tracería que queda, y la campana grande de bronce trabada en él
    N.sub(0, UF0, 270, 0, 90, 'x').cil(0, 0, -20, 62, 40, { mat: PI, resta: true });
    aro(N.sub(0, UF0 + 16, 0), 0, 270, 66, 5, PI, 0, TAU, 40, 0, 0.08); aro(N.sub(0, UF0 + 16, 0), 0, 270, 30, 3, PI, 0.4, 3.6, 20, 0, 0.06);
    for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; if (k === 1 || k === 2) continue; N.palo([Math.cos(t) * 30, UF0 + 16, 270 + Math.sin(t) * 30], [Math.cos(t) * 64, UF0 + 16, 270 + Math.sin(t) * 64], 2.4, { mat: PI, tono: 0.06 }); }
    campana(N.sub(-4, UF0 + 10, 330), [0, 0, 0], [0.32, 0.4, -0.86], 50, BR);
    algas(N, -50, 50, UF0 + 18, 220, 10, 70);
  }
  // ------------------------------------------------------------ el pórtico: lo único que sigue en alto, a ras del agua, delante de la fachada hundida
  {
    const P = F;
    // el pórtico: el arco apuntado hondo con sus roscas y la puerta de la marea
    const UP = 214, AR = 44;
    P.caja(0, (130 + UP) / 2, 0, AR * 2 + 60, UP - 130, 190, { mat: PI, tono: 0.02 });
    P.poli([[-AR - 30, 130, 190], [AR + 30, 130, 190], [-AR - 30, UP, 190], [AR + 30, UP, 190], [0, 130, 250], [0, UP, 250], [0, 130, 248], [0, UP, 248]], { mat: PI, tono: 0.06 });
    const pt = ojiva(AR * 2, 128, 0.85, 7, 0); P.poli([...pt.map(([x, z]) => [x, UP + 5, z] as V3), ...pt.map(([x, z]) => [x, UP - 70, z] as V3)], { mat: PI, resta: true });
    for (let r = 0; r < 4; r++) arcoOjiva(P.sub(0, UP - 1 - r * 7, 0), AR * 2 + 10 + r * 12, 128, 0, 3.6, PI, 0.08 - r * 0.03);
    P.caja(0, UP - 68, 0, AR * 2, 2, 170, { mat: AN, tono: -0.05 + p * 0.1 });
    for (let i = 0; i < 7; i++) P.caja(0, UP - 8 - i * 9, 8 - i * 1.6, AR * 2 - 4, 9, 2, { mat: PI, tono: -0.1 - i * 0.04 });
    letras(P.sub(0, UP + 0.4, 0), -AR - 20, AR + 20, 0, 214, 2, PI, 4.6, 2);
    percebes(P.sub(0, UP + 1, 0), -AR - 28, AR + 28, 2, 60, 0, 40); algas(N, -AR - 24, AR + 24, UP + 2, 190, 12, 50);
    for (let k = 0; k < 8; k++) { const x = (k < 4 ? -1 : 1) * (AR + 16 + a.r() * 12), z = 4 + a.r() * 60; for (let j = 0; j < 4; j++) P.palo([x, UP + 2, z], [x + (a.r() - 0.5) * 12, UP + 6 + a.r() * 6, z + 6 + a.r() * 10], 1.2, { mat: CO, r1: 0.6 }); }
  
  }
  // ------------------------------------------------------------ el campanario: sin aguja, ladeado sobre el agua, las campanas a la vista
  {
    const T = F.sub(176, -60, -40, 0, 16, 'y').sub(0, 0, 0, 0, 10, 'x');
    tronco(T, 0, 0, 0, 420, 96, 96, 82, 82, { mat: PI });
    for (let k = 0; k < 6; k++) T.caja(0, 0, 80 + k * 64, 100 - k * 3, 100 - k * 3, 6, { mat: PI, tono: 0.08 });
    T.caja(0, 0, 420, 88, 88, 90, { mat: PI });
    T.caja(0, 0, 426, 50, 100, 74, { mat: PI, resta: true }); T.caja(0, 0, 426, 100, 50, 74, { mat: PI, resta: true });
    campana(T.sub(0, 2, 454), [0, 0, 40], [0, 0, -1], 20, BR); campana(T.sub(16, -12, 462), [0, 0, 30], [0, 0, -1], 12, BR);
    T.palo([-34, 0, 494], [34, 0, 494], 3, { mat: 'madera' });
    for (let k = 0; k < 8; k++) T.caja(-36 + (k % 4) * 24, k < 4 ? -36 : 36, 510, 16, 16, 12 + a.r() * 30, { mat: PI, tono: 0.04 });
    algas(T, -44, 44, 49, 420, 12, 100); percebes(T.sub(0, 49.5, 0), -44, 44, 40, 160, 0, 40);
    let q: V3 = [50, 30, 40]; for (let k = 0; k < 26; k++) { const t = k * 0.6, n: V3 = [Math.cos(t) * 54, Math.sin(t) * 54, 40 + k * 10]; cadena(T, q, n, 0.4, HI, 2.8); q = n; }
  }
  for (let k = 0; k < 5; k++) calavera(F.sub(-120 + a.r() * 240, 140 + a.r() * 50, 1, a.r() * 360), 3.2, 'mu_hueso', k % 2 === 0, -0.1);
  return {
    der: { c: [0, 180, 60] as V3, r: 100 + p * 12, color: '#4ad89a' },
    medio: { c: [0, -60, 120] as V3, r: 170 + p * 20, color: '#3ac888' },
    atras_d: { c: [176, -60, 460] as V3, r: 70 + p * 10, color: '#4ad89a' },
  };
}
registrarMonumento({
  id: 'mon_ysmeral', nombre: ['Catedral de las Campanas Ahogadas', 'Cathedral of the Drowned Bells'], tema: 'ahogada', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== los pilares de los ahogados
/** Lo que quedó del claustro: un pilar gótico de haz de columnillas, con su capitel de cabezas que gritan, el pináculo partido,
 *  un brazo de hierro con la campana de los ahogados colgando y su farol verde; la base comida de percebes en el agua. Uno se
 *  ladea, al otro le falta el pináculo. */
function pilar(g: G, ladeado: boolean) {
  const a = g.a, P = ladeado ? g.sub(0, 0, 0, 0, 9, 'y') : g;
  g.elip(0, 0, 0.6, 50, 44, 2, { mat: AG }); for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; bloque(g, Math.cos(t) * 30, Math.sin(t) * 26, -4, 14, 10, 8 + a.r() * 8, { mat: PI, giro: (t * 180) / Math.PI, incl: 20, b: 1, j: 0.6 }); }
  // la base en dos escalones y el haz de ocho columnillas
  P.cil(0, 0, -4, 30, 26, { mat: PI, r1: 26 }); P.cil(0, 0, 22, 24, 10, { mat: PI, r1: 21, tono: 0.04 });
  for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; P.cil(Math.cos(t) * 14, Math.sin(t) * 14, 30, 5.6, 230, { mat: PI, tono: (k % 2) * 0.05 }); }
  P.cil(0, 0, 30, 13, 230, { mat: PI, tono: -0.06 });
  // el capitel con las cabezas que gritan y el ábaco
  P.cil(0, 0, 258, 18, 14, { mat: PI, r1: 26, tono: 0.06 }); P.caja(0, 0, 272, 56, 56, 8, { mat: PI, tono: 0.1 });
  for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU + 0.785, c = P.sub(Math.cos(t) * 20, Math.sin(t) * 20, 262, (t * 180) / Math.PI + 90); c.elip(0, 2, 0, 5, 4, 6, { mat: PI, tono: 0.08 }); c.elip(0, 5.4, -2, 2, 1, 2.6, { mat: 'negro' }); for (const e of [-1, 1]) c.elip(e * 2, 5, 2, 1, 0.6, 0.9, { mat: 'negro' }); }
  // el pináculo con su crestería (o el muñón roto)
  if (!ladeado) { P.cil(0, 0, 280, 18, 10, { mat: PI }); for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU; P.poli([[Math.cos(t) * 18 - 4, Math.sin(t) * 18 - 4, 290], [Math.cos(t) * 18 + 4, Math.sin(t) * 18 - 4, 290], [Math.cos(t) * 18 - 4, Math.sin(t) * 18 + 4, 290], [Math.cos(t) * 18 + 4, Math.sin(t) * 18 + 4, 290], [Math.cos(t) * 18, Math.sin(t) * 18, 320]], { mat: PI, tono: 0.08 }); } P.poli([[-12, -12, 290], [12, -12, 290], [-12, 12, 290], [12, 12, 290], [0, 0, 380]], { mat: PI, tono: 0.06 }); }
  else { P.cil(0, 0, 280, 18, 26, { mat: PI, r1: 14 }); for (let k = 0; k < 5; k++) bloque(g, 30 + k * 8, -10 + k * 6, 0, 10, 8, 6, { mat: PI, giro: k * 40, b: 0.6, j: 0.4 }); }
  // el brazo de hierro, la campana de los ahogados y el farol verde
  P.palo([0, 0, 250], [0, 44, 250], 2.4, { mat: HI }); P.palo([0, 6, 236], [0, 40, 250], 1.4, { mat: HI });
  cadena(P, [0, 42, 248], [0, 42, 226], 0.4, HI, 1.2); campana(P.sub(0, 42, 222), [0, 0, 0], [0, 0, -1], 13, BR);
  P.cil(0, 42, 196, 4, 10, { mat: HI, r1: 3.4 }); P.cil(0, 42, 197, 3.2, 8, { mat: AN, tono: 0.2 });
  // los percebes, los corales y las algas de la marea
  percebes(P.sub(0, 26, 0), -22, 22, 0, 60, 0, 40); algas(P, -18, 18, 22, 276, 8, 60);
  for (let k = 0; k < 6; k++) { const t = a.r() * TAU, x = Math.cos(t) * 24, y = Math.sin(t) * 24; for (let j = 0; j < 3; j++) P.palo([x, y, 10 + k * 6], [x + (a.r() - 0.5) * 10, y + (a.r() - 0.5) * 10, 18 + k * 6 + a.r() * 8], 1.2, { mat: CO, r1: 0.5 }); }
}
registrar({
  id: 'mon_ys_pilar', nombre: ['Pilar de los ahogados', 'Pillar of the drowned'], tema: 'ahogada', variantes: ['entero', 'ladeado'], huella: [5, 5], bloquea: true, cuadros: 1,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); pilar(g, v === 'ladeado'); bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 30, 200] as V3, r: 50, color: '#4ad89a' } }; },
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
