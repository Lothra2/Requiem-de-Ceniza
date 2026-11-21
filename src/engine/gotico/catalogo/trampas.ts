import { registrar, type Arma, type Pieza } from '../objeto';
import { G, raiz, bajoTierra, bloque, llama } from '../kit_muerte';
import './infierno2';
import './selva2';

/**
 * Trampas con intención (oleada 4, Rick: "trampas visibles que se puedan esquivar o usar contra los enemigos"). Pocas y donde
 * tienen sentido (`ponerTrampas` en zona.ts); lo que hacen va en `juego/trampas.ts`.
 *
 *   trampa_puas     (1×1)  losa de púas de las mazmorras de obra: `abajo` (se ven los agujeros y la sangre vieja) y `arriba`.
 *   trampa_brasero  (1×1)  brasero alto sobre un pie flojo: `en_pie` (encendido) y `volcado` (las brasas derramadas).
 *   trampa_grieta   (2×2)  grieta de lava del acto 5 que respira: `quieta`, `aviso` (se hincha y brilla) y `erupcion`.
 *   trampa_lazo     (1×1)  lazo de los cazadores de la selva: `armado` (el aro en el piso y la rama doblada) y `saltado`.
 */

const TAU = Math.PI * 2;
const r2 = (a: Arma, k = 1) => (a.r() - 0.5) * 2 * k;

function puas(g: G, a: Arma, arriba: boolean) {
  // la losa: un poco más oscura que el piso, con el canto gastado y una junta de hierro alrededor
  bloque(g, 0, 0, -0.9, 14.5, 14.5, 1.2, { mat: 'piedra_gris', j: 0.3, b: 0.5, tono: -0.12 });
  for (let k = 0; k < 4; k++) { const t = (k / 4) * TAU; g.sub(Math.cos(t) * 7.4, Math.sin(t) * 7.4, 0, (t * 180) / Math.PI + 90).caja(0, 0, 0.05, 15, 0.7, 0.35, { mat: 'mu_hierro', tono: -0.1 }); }
  // los agujeros en cuadrícula, y las púas (asoman la punta abajo; afuera, largas, arriba)
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
    const x = -5.1 + i * 3.4 + r2(a, 0.2), y = -5.1 + k * 3.4 + r2(a, 0.2);
    g.cil(x, y, 0.2, 0.9, 0.15, { mat: 'negro' });
    if (arriba) { g.cil(x, y, 0.2, 0.7, 14 + a.r() * 3, { mat: 'mu_hierro', r1: 0.05, tono: 0.08 }); if (a.r() < 0.35) g.cil(x, y, 7 + a.r() * 3, 0.6, 3.4, { mat: 'sangre', r1: 0.4 }); }
    else g.cil(x, y, 0.1, 0.4, 0.8, { mat: 'mu_hierro', r1: 0.05, tono: -0.1 });
  }
  // la sangre vieja de los que ya pisaron: manchas secas en las juntas
  for (let i = 0; i < 3; i++) g.elip(r2(a, 5), r2(a, 5), 0.25, 1.6 + a.r() * 2, 1 + a.r(), 0.15, { mat: 'mu_sangre_seca', giro: a.r() * 180 });
  if (arriba) for (let i = 0; i < 3; i++) g.elip(r2(a, 4), r2(a, 4), 0.3, 1.2, 0.8, 0.2, { mat: 'sangre', giro: a.r() * 180 });
}

function brasero(g: G, a: Arma, volcado: boolean) {
  if (!volcado) {
    // el brasero alto de hierro sobre tres patas flojas, una calzada con una piedra: se vuelca de un empujón
    for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU + 0.3; g.palo([Math.cos(t) * 4.6, Math.sin(t) * 4.6, k === 0 ? 1.2 : 0], [Math.cos(t) * 1.6, Math.sin(t) * 1.6, 15], 0.6, { mat: 'mu_hierro' }); }
    bloque(g, Math.cos(0.3) * 4.6, Math.sin(0.3) * 4.6, 0, 2.4, 2, 1.2, { mat: 'piedra_gris', j: 0.6 });
    g.cil(0, 0, 14.6, 2.2, 3, { mat: 'mu_hierro', r1: 5.2 }); g.cil(0, 0, 17.4, 5.3, 0.7, { mat: 'mu_hierro', tono: 0.06 });
    for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; g.palo([Math.cos(t) * 5.1, Math.sin(t) * 5.1, 17.8], [Math.cos(t) * 5.6, Math.sin(t) * 5.6, 19.4], 0.35, { mat: 'mu_hierro' }); }
    g.elip(0, 0, 17.8, 4.4, 4.4, 1.4, { mat: 'mu_brasa' });
    for (let k = 0; k < 4; k++) llama(g, r2(a, 2), r2(a, 2), 18.4, 1.8, 6 + a.r() * 3, 0, 8, k);
    // la vasija de aceite al pie, que es lo que hace que arda tanto
    g.cil(5.6, 3.4, 0, 2, 4, { mat: 'des2_barro', r1: 1.4 }); g.elip(5.6, 3.4, 4, 1.5, 1.5, 0.5, { mat: 'negro' });
    return { c: [0, 0, 21] as [number, number, number] };
  }
  // volcado: el cuenco de costado, las patas al aire, las brasas y el aceite derramados ardiendo en el piso
  const s = g.sub(2, 2, 3, 45, 75, 'y'); s.cil(0, 0, 0, 2.2, 3, { mat: 'mu_hierro', r1: 5.2 }); s.cil(0, 0, 2.8, 5.3, 0.7, { mat: 'mu_hierro' });
  for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU; s.palo([Math.cos(t) * 1.6, Math.sin(t) * 1.6, 0], [Math.cos(t) * 4.6, Math.sin(t) * 4.6, -14], 0.6, { mat: 'mu_hierro' }); }
  for (let i = 0; i < 14; i++) { const d = 4 + a.r() * 10, t = 0.785 + r2(a, 0.5); g.elip(Math.cos(t) * d, Math.sin(t) * d, 0.2, 1 + a.r() * 1.2, 0.8 + a.r(), 0.6, { mat: a.r() < 0.5 ? 'mu_brasa' : 'ext_carbon', giro: a.r() * 180 }); }
  g.elip(9, 9, 0.1, 7, 4, 0.2, { mat: 'negro', giro: 45, tono: 0.1 });
  for (let k = 0; k < 3; k++) llama(g, 6 + k * 3 + r2(a, 1), 6 + k * 3 + r2(a, 1), 0.4, 1.4, 4 + a.r() * 2, 0, 8, k);
  g.cil(-6, 4, 2, 2, 4, { mat: 'des2_barro', eje: [0, 1, 0.1] });
  return { c: [8, 8, 4] as [number, number, number] };
}

function grieta(g: G, a: Arma, fase: number) {
  // costra de basalto alrededor y la grieta en tres brazos; con el aviso se hincha y brilla, en la erupción escupe
  const L = fase === 2 ? 'fuego' : 'lava';
  for (let i = 0; i < 9; i++) { const t = (i / 9) * TAU, d = 9 + a.r() * 5; g.elip(Math.cos(t) * d, Math.sin(t) * d, -0.2, 4 + a.r() * 3, 3 + a.r() * 2, 0.9 + fase * 0.5, { mat: 'inf2_costra', giro: a.r() * 180 }); }
  for (let b = 0; b < 3; b++) {
    const t0 = (b / 3) * TAU + 0.4; let p: [number, number, number] = [0, 0, 0.2];
    for (let k = 1; k <= 4; k++) { const t = t0 + r2(a, 0.4), q: [number, number, number] = [p[0] + Math.cos(t) * 3.6, p[1] + Math.sin(t) * 3.6, 0.2]; g.palo(p, q, 1.3 - k * 0.2 + fase * 0.3, { mat: L }); p = q; }
  }
  g.elip(0, 0, 0.3, 3 + fase, 3 + fase, 0.6 + fase * 0.6, { mat: L });
  if (fase === 2) for (let i = 0; i < 7; i++) { const t = a.r() * TAU, h = 6 + a.r() * 14; g.esf(Math.cos(t) * a.r() * 4, Math.sin(t) * a.r() * 4, h, 0.9 + a.r(), { mat: a.r() < 0.5 ? 'lava' : 'fuego' }); }
}

function lazo(g: G, a: Arma, armado: boolean) {
  // la rama doblada y clavada con su estaca, la cuerda y el aro tendido entre hojas (saltado: la rama arriba y el aro colgando)
  g.palo([-6, -6, -0.5], [-6.4, -6.2, 5], 0.7, { mat: 'madera_vieja' });
  if (armado) {
    g.palo([-8, -9, 0], [-1, -4, 9], 0.8, { mat: 'corteza', r1: 0.4 }); g.palo([-1, -4, 9], [-5.6, -5.8, 4.6], 0.25, { mat: 'cuerda' });
    for (let k = 0; k < 14; k++) { const t0 = (k / 14) * TAU, t1 = ((k + 1) / 14) * TAU; g.palo([2 + Math.cos(t0) * 4, 2 + Math.sin(t0) * 3.4, 0.25], [2 + Math.cos(t1) * 4, 2 + Math.sin(t1) * 3.4, 0.25], 0.25, { mat: 'cuerda', tono: -0.1 }); }
    g.palo([-5.6, -5.8, 4.6], [-1.2, 0.4, 0.3], 0.25, { mat: 'cuerda' });
    for (let i = 0; i < 6; i++) g.elip(2 + r2(a, 4), 2 + r2(a, 3), 0.3, 1.8, 0.8, 0.2, { mat: 'hojas_selva', giro: a.r() * 180 });
  } else {
    g.palo([-8, -9, 0], [-3, -6, 22], 0.8, { mat: 'corteza', r1: 0.4 });
    let p: [number, number, number] = [-3, -6, 22]; for (let k = 0; k < 4; k++) { const q: [number, number, number] = [p[0] + 0.4, p[1] + 0.3, p[2] - 3.2]; g.palo(p, q, 0.25, { mat: 'cuerda' }); p = q; }
    for (let k = 0; k < 10; k++) { const t0 = (k / 10) * TAU, t1 = ((k + 1) / 10) * TAU; g.palo([p[0] + Math.cos(t0) * 1.4, p[1], p[2] - 1.4 + Math.sin(t0) * 1.4], [p[0] + Math.cos(t1) * 1.4, p[1], p[2] - 1.4 + Math.sin(t1) * 1.4], 0.22, { mat: 'cuerda' }); }
    for (let i = 0; i < 5; i++) g.elip(2 + r2(a, 5), 2 + r2(a, 4), 0.3, 1.8, 0.8, 0.2, { mat: 'hojas_selva', giro: a.r() * 180 });
  }
}

registrar(
  { id: 'trampa_puas', nombre: ['Losa de púas', 'Spike plate'], tema: 'comun', variantes: ['abajo', 'arriba'], huella: [1, 1], bloquea: false,
    armar: (v, _f, a) => { const { ps, g } = raiz(a); puas(g, a, v === 'arriba'); bajoTierra(ps); return ps as Pieza[]; } },
  { id: 'trampa_brasero', nombre: ['Brasero flojo', 'Loose brazier'], tema: 'comun', variantes: ['en_pie', 'volcado'], huella: [1, 1], bloquea: true,
    armar: (v, _f, a) => { const { ps, g } = raiz(a); const { c } = brasero(g.esc(1.9), a, v === 'volcado'); bajoTierra(ps); return { piezas: ps, resplandor: { c: [c[0] * 1.9, c[1] * 1.9, c[2] * 1.9], r: v === 'volcado' ? 30 : 36, color: '#ff9440' } }; } },
  { id: 'trampa_grieta', nombre: ['Grieta que respira', 'Breathing fissure'], tema: 'comun', variantes: ['quieta', 'aviso', 'erupcion'], huella: [2, 2], bloquea: false,
    armar: (v, _f, a) => { const { ps, g } = raiz(a); const f = ['quieta', 'aviso', 'erupcion'].indexOf(v); grieta(g, a, f); bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 2 + f * 6], r: 16 + f * 10, color: f === 2 ? '#ffb040' : '#ff5a18' } }; } },
  { id: 'trampa_lazo', nombre: ['Lazo', 'Snare'], tema: 'comun', variantes: ['armado', 'saltado'], huella: [1, 1], bloquea: false,
    armar: (v, _f, a) => { const { ps, g } = raiz(a); lazo(g.esc(1.7), a, v === 'armado'); bajoTierra(ps); return ps as Pieza[]; } },
);
