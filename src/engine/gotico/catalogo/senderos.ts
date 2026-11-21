import { registrar, type Arma, type Pieza } from '../objeto';
import { G, raiz, bajoTierra, bloque, calavera, cadena, vela, rr } from '../kit_muerte';

/**
 * Los senderos de los desvíos (Rick, 21 nov 2026: "el sendero del desvío se lee poco"). El camino de los mundos abiertos
 * se pinta por baldosa, pero el sendero de un desvío es de una o dos celdas: va por piezas planas puestas a lo largo de su
 * traza, del mismo material que el piso de cada tema para que se funda en él, solo más pisado.
 *
 *   sendero_paso   (plano, 2×2)  un tramo pisado a lo largo de x, y o las dos diagonales (`<fam>_<x|y|d|e>[2]`), y las
 *                                piedras que lo bordean (`<fam>_piedras`, `<fam>_piedras2`).
 *   sendero_mojon  (1×1)         el hito chico en la boca del sendero, donde deja el camino (`<fam>`).
 *
 * Familias: tierra (páramo), losas (camposanto), arena (dunas), barro (selva), nieve, ceniza (llanuras de ceniza), tablas
 * (la costa de Ysmeral) y marmol (el cielo roto). Los materiales del pisado son los del piso del juego (`pisos.ts`).
 */

const TAU = Math.PI * 2;
export const FAM_SENDERO: Record<string, string> = { paramo: 'tierra', cementerio: 'losas', desierto: 'arena', selva: 'barro', nieve: 'nieve', infierno: 'ceniza', ahogada: 'tablas', celestial: 'marmol' };
const FAMS = ['tierra', 'losas', 'arena', 'barro', 'nieve', 'ceniza', 'tablas', 'marmol'];
const DIRS: Record<string, number> = { x: 0, y: 90, d: 45, e: -45 };
/** Gasta azar según la variante (el juego hornea con una sola semilla). */
const barajar = (a: Arma, v: string) => { let k = 0; for (let i = 0; i < v.length; i++) k = (k * 31 + v.charCodeAt(i)) % 97; for (let i = 0; i < k; i++) a.r(); };

/** Lo que pisa cada familia: el suelo (material del piso del juego, más oscuro), las manchas de encima y la piedra del borde. */
const PISA: Record<string, { suelo: string; tono: number; mancha: string[]; piedra: string; musgo?: string }> = {
  tierra: { suelo: 'tierra', tono: -0.3, mancha: ['tierra', 'paja'], piedra: 'piedra_gris', musgo: 'musgo' },
  losas: { suelo: 'tierra', tono: -0.16, mancha: ['musgo', 'tierra'], piedra: 'piedra_gris', musgo: 'musgo' },
  arena: { suelo: 'arena', tono: -0.24, mancha: ['arena', 'arena'], piedra: 'arenisca' },
  barro: { suelo: 'tierra', tono: -0.34, mancha: ['hojas_selva', 'tierra'], piedra: 'piedra_musgo', musgo: 'musgo' },
  nieve: { suelo: 'nieve', tono: -0.26, mancha: ['nieve', 'tierra'], piedra: 'roca' },
  ceniza: { suelo: 'roca_roja', tono: -0.3, mancha: ['ext_ceniza', 'roca_roja'], piedra: 'roca_roja' },
  tablas: { suelo: 'ahg_arena', tono: -0.22, mancha: ['ahg_arena', 'ahg_lodo'], piedra: 'ahg_roca' },
  marmol: { suelo: 'arenisca', tono: -0.14, mancha: ['arena', 'arenisca'], piedra: 'marmol' },
};

/** Una pisada (suela y talón) hundida, mirando a `ang` (rad). */
function pisada(g: G, x: number, y: number, ang: number, mat: string, tono: number, k = 1) {
  const c = Math.cos(ang), s = Math.sin(ang), gr = (ang * 180) / Math.PI;
  g.elip(x + c * 1.1 * k, y + s * 1.1 * k, 0.05, 1.5 * k, 0.95 * k, 0.32, { mat, tono, giro: gr });
  g.elip(x - c * 1.4 * k, y - s * 1.4 * k, 0.05, 0.9 * k, 0.8 * k, 0.32, { mat, tono, giro: gr });
}
/** Pezuña o pata (camello en la arena, perro en la nieve): dos medias lunas. */
function pata(g: G, x: number, y: number, ang: number, mat: string, tono: number) {
  const c = Math.cos(ang + 1.57), s = Math.sin(ang + 1.57);
  for (const q of [-1, 1]) g.elip(x + c * q * 0.8, y + s * q * 0.8, 0.05, 1, 0.7, 0.3, { mat, tono, giro: (ang * 180) / Math.PI });
}

/**
 * Un tramo pisado de unas dos celdas a lo largo de `ang` (grados), de 12 a 15 unidades de ancho: el fondo en manchas que se
 * deshacen hacia los cantos (nada de óvalo con borde), y encima lo de cada familia.
 */
function tramo(g: G, a: Arma, fam: string, ang: number) {
  const P = PISA[fam], t = (ang * Math.PI) / 180, ux = Math.cos(t), uy = Math.sin(t), nx = -uy, ny = ux;
  const en = (u: number, w: number): [number, number] => [ux * u + nx * w, uy * u + ny * w];
  // el fondo pisado: manchas a lo largo, más anchas en el medio y que se apagan al canto
  for (let i = 0; i < 9; i++) { const u = -15 + i * 3.75 + rr(a, -1, 1), w = rr(a, -1.6, 1.6); const [x, y] = en(u, w); g.elip(x, y, -0.15, 5.5 + a.r() * 2, 4.5 + a.r() * 1.6, 0.4, { mat: P.suelo, tono: P.tono + rr(a, -0.03, 0.03), giro: ang + rr(a, -20, 20) }); }
  for (let i = 0; i < 10; i++) { const u = rr(a, -16, 16), w = (a.r() < 0.5 ? -1 : 1) * rr(a, 4.5, 7.5); const [x, y] = en(u, w); g.elip(x, y, -0.2, 1.6 + a.r() * 1.8, 1.2 + a.r() * 1.2, 0.35, { mat: P.suelo, tono: P.tono * 0.55, giro: a.r() * 180 }); }
  const dir = a.r() < 0.5 ? t : t + Math.PI;
  if (fam === 'tierra' || fam === 'barro' || fam === 'ceniza' || fam === 'nieve' || fam === 'arena') {
    // las huellas de los que pasaron: en hilera de ida y alguna de vuelta
    for (let i = 0; i < 6; i++) { const u = -13 + i * 5.2 + rr(a, -0.8, 0.8), w = (i % 2 ? 1.4 : -1.4) + rr(a, -0.4, 0.4); const [x, y] = en(u, w); pisada(g, x, y, dir + rr(a, -0.2, 0.2), P.suelo, P.tono - 0.12, fam === 'nieve' ? 1.15 : 1); }
    if (a.r() < 0.6) for (let i = 0; i < 4; i++) { const u = -10 + i * 6 + rr(a, -1, 1), w = 3.2 + rr(a, -0.4, 0.4); const [x, y] = en(u, w); if (fam === 'arena' || fam === 'nieve') pata(g, x, y, dir + Math.PI, P.suelo, P.tono - 0.1); else pisada(g, x, y, dir + Math.PI, P.suelo, P.tono - 0.1, 0.9); }
  }
  if (fam === 'tierra') {
    // pasto aplastado en el medio y piedrecitas sueltas
    for (let i = 0; i < 5; i++) { const [x, y] = en(rr(a, -14, 14), rr(a, -3, 3)); g.elip(x, y, 0, 2.4 + a.r(), 0.7, 0.25, { mat: 'paja', tono: -0.15, giro: ang + rr(a, -30, 30) }); }
    for (let i = 0; i < 7; i++) { const [x, y] = en(rr(a, -15, 15), rr(a, -5, 5)); g.elip(x, y, 0, 0.7 + a.r() * 0.7, 0.6 + a.r() * 0.5, 0.5, { mat: 'piedra', tono: rr(a, -0.1, 0.1), giro: a.r() * 180 }); }
  } else if (fam === 'losas') {
    // losas que alguien puso hace mucho, hundidas y partidas, con barro y musgo entre una y otra
    for (let i = 0; i < 4; i++) { const u = -12 + i * 8 + rr(a, -1.2, 1.2), w = rr(a, -1, 1); if (a.r() < 0.18) continue; const [x, y] = en(u, w); bloque(g, x, y, -0.7, 6 + a.r() * 2, 5 + a.r() * 2, 1.2, { mat: 'piedra_gris', giro: ang + rr(a, -12, 12), j: 0.6, b: 0.6, tono: rr(a, -0.1, 0.06), incl: rr(a, -4, 4) });
      if (a.r() < 0.5) g.elip(x + rr(a, -2, 2), y + rr(a, -2, 2), 0.45, 1.6, 1.1, 0.3, { mat: 'musgo', giro: a.r() * 180 }); }
  } else if (fam === 'arena') {
    // la arena corrida por el viento a los costados del paso, en rizos
    for (let i = 0; i < 6; i++) { const u = rr(a, -15, 15), w = (a.r() < 0.5 ? -1 : 1) * rr(a, 4, 6.5); const [x, y] = en(u, w); g.elip(x, y, -0.25, 3.4 + a.r() * 1.6, 0.9, 0.55, { mat: 'arena', tono: 0.05, giro: ang + 60 + rr(a, -10, 10) }); }
  } else if (fam === 'barro') {
    // tablones atravesados sobre el barro y raíces que asoman
    for (let i = 0; i < 3; i++) { if (a.r() < 0.3) continue; const u = -11 + i * 11 + rr(a, -1.5, 1.5); const [x, y] = en(u, rr(a, -0.6, 0.6)); g.caja(x, y, -0.3, 2.6, 10 + a.r() * 2, 0.9, { mat: 'madera_vieja', giro: ang + rr(a, -10, 10), tono: rr(a, -0.12, 0.02) }); }
    for (let i = 0; i < 2; i++) { const [x, y] = en(rr(a, -14, 14), (a.r() < 0.5 ? -1 : 1) * rr(a, 4, 6)); const g2 = a.r() * TAU; g.palo([x, y, -0.4], [x + Math.cos(g2) * 6, y + Math.sin(g2) * 6, -0.2], 0.7, { mat: 'corteza', r1: 0.3 }); }
    for (let i = 0; i < 3; i++) { const [x, y] = en(rr(a, -14, 14), rr(a, -4, 4)); g.elip(x, y, 0, 1.8, 1.2, 0.3, { mat: 'agua_sucia', giro: a.r() * 180 }); }
  } else if (fam === 'nieve') {
    // la nieve hundida y sucia donde más se pisó, con la tierra que asoma
    for (let i = 0; i < 4; i++) { const [x, y] = en(rr(a, -13, 13), rr(a, -2, 2)); g.elip(x, y, -0.1, 2 + a.r() * 1.5, 1.4, 0.3, { mat: 'tierra', tono: -0.05, giro: a.r() * 180 }); }
  } else if (fam === 'ceniza') {
    // losas de basalto partidas y la ceniza pisada entre ellas, con alguna brasa apagada
    for (let i = 0; i < 3; i++) { if (a.r() < 0.25) continue; const [x, y] = en(-10 + i * 10 + rr(a, -1.5, 1.5), rr(a, -1.2, 1.2)); bloque(g, x, y, -0.8, 6 + a.r() * 2, 5 + a.r() * 1.5, 1.3, { mat: 'roca', giro: ang + rr(a, -15, 15), j: 0.8, b: 0.5, tono: -0.12 }); }
    for (let i = 0; i < 6; i++) { const [x, y] = en(rr(a, -15, 15), rr(a, -5, 5)); g.elip(x, y, 0, 0.8 + a.r() * 0.6, 0.7, 0.4, { mat: a.r() < 0.25 ? 'mu_brasa' : 'ext_carbon', giro: a.r() * 180 }); }
  } else if (fam === 'tablas') {
    // tablas de los barcos que se rompieron en la costa, puestas como paso sobre la arena mojada, y conchas
    for (let i = 0; i < 3; i++) { if (a.r() < 0.2) continue; const [x, y] = en(-10 + i * 10 + rr(a, -1, 1), rr(a, -0.8, 0.8)); const gx = ang + 90 + rr(a, -8, 8); g.caja(x, y, -0.25, 3 + a.r(), 11 + a.r() * 2, 0.9, { mat: 'ahg_madera', giro: gx, tono: rr(a, -0.1, 0.05) }); if (a.r() < 0.6) g.cil(x, y, 0.6, 0.35, 0.3, { mat: 'mu_oxido' }); }
    for (let i = 0; i < 6; i++) { const [x, y] = en(rr(a, -15, 15), (a.r() < 0.5 ? -1 : 1) * rr(a, 3.5, 6.5)); g.elip(x, y, 0, 0.8 + a.r() * 0.5, 0.6, 0.45, { mat: a.r() < 0.5 ? 'ahg_concha' : 'ahg_nacar', giro: a.r() * 180 }); }
  } else if (fam === 'marmol') {
    // losas de mármol rotas con su filete de oro gastado, una de cada tanto falta y queda la arena
    for (let i = 0; i < 4; i++) { if (a.r() < 0.22) continue; const u = -12 + i * 8 + rr(a, -0.8, 0.8); const [x, y] = en(u, rr(a, -0.8, 0.8)); const gr = ang + rr(a, -8, 8);
      bloque(g, x, y, -0.6, 6.4, 6.4, 1.2, { mat: 'marmol', giro: gr, j: 0.5, b: 0.5, tono: rr(a, -0.05, 0.08), incl: rr(a, -3, 3) });
      if (a.r() < 0.7) g.sub(x, y, 0.62, gr).caja(0, 2.9, 0, 6, 0.4, 0.15, { mat: 'oro', tono: -0.2 }); }
  }
}
/** Las piedras que bordean el sendero, en un racimo de dos o tres a lo largo de `ang`. */
function piedras(g: G, a: Arma, fam: string) {
  const P = PISA[fam], n = 2 + Math.floor(a.r() * 2);
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 6 + rr(a, -1.2, 1.2), y = rr(a, -1.5, 1.5), w = 3 + a.r() * 2.6, h = 1.8 + a.r() * 2;
    if (fam === 'nieve') { g.elip(x, y, 0, w * 0.75, w * 0.6, h, { mat: 'roca', giro: a.r() * 180, tono: -0.05 }); g.elip(x, y, h * 0.7, w * 0.6, w * 0.5, h * 0.4, { mat: 'nieve', giro: a.r() * 180 }); continue; }
    if (fam === 'tablas' && a.r() < 0.4) { g.palo([x, y, 0], [x + rr(a, -0.6, 0.6), y, 5 + a.r() * 3], 0.9, { mat: 'ahg_madera', r1: 0.7 }); continue; }
    if (fam === 'losas' || fam === 'marmol') bloque(g, x, y, -0.4, w, w * 0.8, h, { mat: P.piedra, giro: a.r() * 90, incl: rr(a, -10, 10), j: 0.6, b: 0.7 });
    else g.elip(x, y, 0, w * 0.6, w * 0.5, h * 0.8, { mat: P.piedra, giro: a.r() * 180, tono: rr(a, -0.08, 0.06) });
    if (P.musgo && a.r() < 0.45) g.elip(x, y, h * 0.6, w * 0.4, w * 0.35, 0.5, { mat: P.musgo, giro: a.r() * 180 });
    if (fam === 'tablas' && a.r() < 0.6) for (let k = 0; k < 3; k++) g.esf(x + rr(a, -1.2, 1.2), y + rr(a, -1, 1), h * 0.6, 0.5, { mat: 'ahg_percebe' });
  }
}

/** El mojón de la boca del sendero: dice que por ahí se va a algún lado, sin decir a dónde. */
function mojon(g: G, a: Arma, fam: string) {
  switch (fam) {
    case 'tierra': {
      // montón de piedras apiladas con una vara y un trapo atado (la seña de los caminantes)
      for (let i = 0; i < 6; i++) { const z = i < 3 ? 0 : i < 5 ? 2.6 : 4.8, r = i < 3 ? 3 : i < 5 ? 2.3 : 1.6, t = (i / 3) * TAU; g.elip(i < 3 ? Math.cos(t) * 2 : i < 5 ? (i - 3.5) * 1.6 : 0, i < 3 ? Math.sin(t) * 2 : 0, z + r * 0.6, r, r * 0.8, r * 0.65, { mat: 'piedra_gris', giro: a.r() * 180, tono: rr(a, -0.08, 0.06) }); }
      g.palo([0.4, 0.2, 4], [0.9, 0.5, 17], 0.45, { mat: 'madera_vieja' });
      g.palo([0.9, 0.5, 15.5], [3.4, 1.6, 12], 0.5, { mat: 'tela_roja', r1: 0.25 }); g.palo([0.9, 0.5, 15], [2.4, 2.2, 10.5], 0.35, { mat: 'tela_roja', r1: 0.2, tono: -0.1 });
      g.elip(0, 0, 2.6, 2.4, 2, 0.6, { mat: 'musgo' }); break;
    }
    case 'losas': {
      // una estela chica de piedra con su cruz grabada, ladeada, y una vela consumida al pie
      bloque(g, 0, 0, -0.5, 5, 2.4, 11, { mat: 'piedra_gris', incl: -7, j: 0.6, arriba: 0.85 });
      g.sub(0, 1.25, 0, 0, -7).caja(0, 0, 6, 0.9, 0.5, 4, { mat: 'negro' }); g.sub(0, 1.25, 0, 0, -7).caja(0, 0, 7.6, 2.8, 0.5, 0.8, { mat: 'negro' });
      g.elip(-1.6, 0.8, 9.5, 1.4, 1, 0.5, { mat: 'musgo' }); vela(g, 2.8, 3, 0, 2, 0.8, 0, 8, 0, false); break;
    }
    case 'arena': {
      // tres piedras planas apiladas y un cuerno de carnero encima: aquí hubo agua
      for (let i = 0; i < 3; i++) bloque(g, rr(a, -0.6, 0.6), rr(a, -0.6, 0.6), i * 2.1, 6 - i * 1.4, 5 - i * 1.1, 2.1, { mat: 'arenisca', giro: a.r() * 60, j: 0.6 });
      for (let k = 0; k < 6; k++) { const t0 = k * 0.45, t1 = t0 + 0.45; g.palo([Math.cos(t0) * (2.2 - k * 0.25), 0.3 + k * 0.4, 7 + Math.sin(t0) * 2.2], [Math.cos(t1) * (2.2 - (k + 1) * 0.25), 0.3 + (k + 1) * 0.4, 7 + Math.sin(t1) * 2.2], 0.9 - k * 0.12, { mat: 'mu_hueso', tono: -0.2 }); }
      break;
    }
    case 'barro': {
      // estaca tallada con una calavera, plumas y un parche de cuero: la seña de los del tambor
      g.cil(0, 0, 0, 1.3, 20, { mat: 'madera_vieja', r1: 0.9 });
      for (let k = 0; k < 4; k++) g.cil(0, 0, 3 + k * 3.4, 1.45, 0.9, { mat: 'sel2_ocre', tono: k % 2 ? -0.1 : 0.05 });
      calavera(g.sub(0, 0.6, 18.4, 90).esc(0.7), 3.3, 'mu_hueso', true, -0.15);
      for (let k = 0; k < 4; k++) { const t = -0.6 + k * 0.4; g.palo([Math.cos(t) * 1.2, Math.sin(t) * 1.2, 15], [Math.cos(t) * 2.6, Math.sin(t) * 2.6 + 1, 9 + a.r() * 2], 0.35, { mat: k % 2 ? 'tela_roja' : 'ext_pluma', r1: 0.15 }); }
      g.cil(0, 0, 11, 2.1, 3, { mat: 'cuero', r1: 2.2, tono: -0.05 }); break;
    }
    case 'nieve': {
      // piedra rúnica chica, con la nieve encima y la runa de camino gastada
      bloque(g, 0, 0, -0.5, 5, 3.2, 12, { mat: 'roca', j: 0.8, arriba: 0.7, incl: 5 });
      for (let k = 0; k < 3; k++) g.sub(0, 1.7, 0, 0, 5).caja(rr(a, -0.8, 0.8), 0, 3 + k * 2.6, 0.6 + a.r(), 0.4, 1.8, { mat: 'negro', tono: 0.1 });
      g.elip(0, 0, 11.5, 2.6, 1.7, 1, { mat: 'nieve' }); g.elip(1.5, 1.5, 0.6, 4, 3, 1.4, { mat: 'nieve', tono: -0.05 }); break;
    }
    case 'ceniza': {
      // una púa de hierro clavada con un cráneo ensartado y un tramo de cadena: por aquí pasaron los de la fragua
      g.palo([0, 0, -1], [0.4, 0.3, 19], 0.9, { mat: 'mu_hierro', r1: 0.2 });
      calavera(g.sub(0.25, 0.2, 11, 60).esc(0.75), 3.3, 'mu_hueso', true, -0.25);
      cadena(g, [0.3, 0.2, 8], [3, 2.6, 0.6], 1.2, 'mu_oxido', 0.6);
      for (let i = 0; i < 4; i++) g.elip(rr(a, -3, 3), rr(a, -3, 3), 0.3, 1.2, 1, 0.5, { mat: 'ext_carbon', giro: a.r() * 180 }); break;
    }
    case 'tablas': {
      // un remo clavado en la arena con un farol apagado colgando y la red enganchada
      g.palo([0, 0, -1], [0.3, 0.2, 21], 0.7, { mat: 'ahg_madera' }); g.caja(0.3, 0.2, 18, 0.7, 3.2, 7, { mat: 'ahg_madera', tono: 0.05 });
      g.palo([0.25, 0.2, 13], [2.6, 0.4, 13.2], 0.3, { mat: 'mu_hierro' });
      g.cil(2.6, 0.4, 8.6, 1.3, 3.4, { mat: 'mu_oxido' }); g.cil(2.6, 0.4, 9.2, 1, 2.2, { mat: 'ahg_vidrio' }); g.cil(2.6, 0.4, 12, 0.6, 1, { mat: 'mu_oxido', r1: 0.2 });
      for (let k = 0; k < 5; k++) g.palo([rr(a, -1, 1), 1, 6 + k], [rr(a, -2, 2), 2.5, 0.4], 0.18, { mat: 'ahg_soga' });
      for (let k = 0; k < 3; k++) g.elip(rr(a, -3, 3), rr(a, 1, 4), 0.3, 0.9, 0.7, 0.5, { mat: 'ahg_concha', giro: a.r() * 180 }); break;
    }
    default: {
      // marmol: el tambor de una columna partida con su filete de oro, y una pluma de ala de piedra apoyada
      g.cil(0, 0, 0, 3.4, 6.5, { mat: 'marmol', tono: 0.02 });
      for (let k = 0; k < 10; k++) { const t = (k / 10) * TAU; g.cil(Math.cos(t) * 3.4, Math.sin(t) * 3.4, 0, 0.55, 6.5, { mat: 'marmol', tono: -0.08 }); }
      g.cil(0, 0, 6.3, 3.6, 0.6, { mat: 'oro', tono: -0.15 });
      g.poli([[-1.8, 3.4, 0], [1.2, 3.6, 0], [-1.5, 4.6, 0.5], [0.6, 4.2, 9], [-0.6, 4.6, 8]], { mat: 'marmol', tono: 0.06 });
    }
  }
}

const PASOS = FAMS.flatMap((f) => [...Object.keys(DIRS).flatMap((d) => [`${f}_${d}`, `${f}_${d}2`]), `${f}_piedras`, `${f}_piedras2`]);
registrar(
  {
    id: 'sendero_paso', nombre: ['Sendero pisado', 'Trodden path'], tema: 'comun', variantes: PASOS, huella: [2, 2], bloquea: false, plano: true,
    armar: (v, _f, a) => {
      const { ps, g } = raiz(a); barajar(a, v);
      const [fam, que] = v.split('_');
      if (que.startsWith('piedras')) piedras(g, a, fam); else tramo(g, a, fam, DIRS[que[0]]);
      bajoTierra(ps); return ps as Pieza[];
    },
  },
  {
    id: 'sendero_mojon', nombre: ['Mojón del sendero', 'Waymarker'], tema: 'comun', variantes: FAMS, huella: [1, 1], bloquea: false,
    armar: (v, _f, a) => { const { ps, g } = raiz(a); barajar(a, v); mojon(g, a, v); bajoTierra(ps); return ps as Pieza[]; },
  },
);
