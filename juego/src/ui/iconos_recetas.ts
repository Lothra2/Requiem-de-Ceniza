// Las recetas de los íconos: una composición propia por habilidad (por id), con los motivos de iconos_motivos.ts.
// Las definitivas llevan oro y gemas. Las seudo habilidades (el golpe del táctil, agresivo y calmo) caen a la receta de
// su glifo. pintarIcono devuelve los puntos RGBA de s × s, sin DOM.
import { Pintor, circ, elip, caja, poli, trazo, curva, arcoPts, estrella, union, fundir, resta, corte, hueco } from './icono_pintor';
import * as M from './iconos_motivos';
import type { Habilidad } from '../datos/clases';

type P = Pintor;
type Receta = (p: P) => void;
const PI = Math.PI;
const { hacha, espada, martillo, lanza, flecha, virote, arco, escudo, escudoRedondo, calavera, hueso, puno, mano, figura, ojo, boca, corazon, gota, llama, bolaFuego, cristal, copo, rayo, chispazo, nube, remolino, onda, sol, campana, corona, frasco, tajo, estallido, esquirlas } = M;

/** El sello de las definitivas: un aro de oro por detrás con cuatro gemas. */
function aroDef(p: P, gema = 'rubi', r = 13.4) {
  p.dib(hueco(circ(16, 16, r), 1.1), { m: 'oro', b: 0.8, sinSombra: true });
  for (let i = 0; i < 4; i++) { const a = PI / 4 + (i * PI) / 2; p.dib(estrella(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, 4, 0.9, 2.2, a), { m: 'oro', b: 1 }); p.dib(circ(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, 1.1), { m: gema, b: 1.1 }); }
}
/** Pose base para figuras (de pie, mirando a la derecha). */
const POSE = (q: Partial<M.Pose>): M.Pose => ({ cab: [0, -11], cue: [0, -8], cad: [0, 1], ci: [-3, -3], mi: [-5, 2], cd: [3, -3], md: [5, 2], ri: [-2, 6], pi: [-3, 12], rd: [2, 6], pd: [3, 12], ...q });

export const RECETAS: Record<string, Receta> = {
  // ================================================================== BERSERKER
  tajo_salvaje: (p) => { p.con(15, 16, 0, 1, () => M.tajos(p, { m: 'e_fisico', n: 3, largo: 12, g: 1.3 })); p.con(17, 17, -0.6, 0.85, () => hacha(p)); },
  hambre_batalla: (p) => { p.brillo(16, 16, 12, 0.8); p.con(16, 16, 0, 1.1, () => boca(p, { colmillos: true, lengua: true })); p.dib(trazo(curva(19, 25, 20, 28, 19.5, 30), 0.6, 0.3), { m: 'e_sangre', e: true, b: 0.6 }); },
  doble_golpe: (p) => { p.con(12, 17, -0.62, 0.82, () => hacha(p)); p.espejo(16, () => p.con(12, 17, -0.62, 0.82, () => hacha(p))); },
  hachazo_ancho: (p) => { p.con(16, 19, 0, 1, () => tajo(p, { r: 12, a0: PI * 0.95, a1: PI * 2.05, g: 2.4 })); p.con(17, 15, 0.5, 0.82, () => hacha(p)); },
  salto_lobo: (p) => { p.dib(trazo(curva(3, 27, 5, 7, 23, 6, 28, 23), 0.35), { m: 'e_fisico', e: true, b: 0.4, brillo: 0.5 }); p.con(15, 15, 0, 0.88, () => figura(p, POSE({ cab: [1, -10], cue: [0, -7], cad: [-1, 1], ci: [-4, -10], mi: [-2, -13.5], cd: [4, -9], md: [5, -12], ri: [-5, 2], pi: [-8, 6], rd: [3, 4], pd: [1, 9] }), { m: 'pelaje', b: 1.4 })); p.con(19.5, 5, 0.5, 0.45, () => hacha(p)); p.con(16, 27, 0, 1, () => M.grieta(p, { m: 'e_fisico' })); },
  ira_contenida: (p) => { p.brillo(16, 16, 11, 1); p.con(16, 15, 0, 0.95, () => corazon(p, { m: 'sangre', b: 4, trama: true })); M.cadena(p, 4, 9, 28, 22, { n: 7 }); M.cadena(p, 4, 22, 28, 9, { n: 7 }); },
  desatar: (p) => { p.con(16, 16, 0, 1, () => { estallido(p, { m: 'e_sangre', n: 10, r0: 4, r1: 14.5 }); estallido(p, { m: 'e_fuego', n: 10, r0: 2.5, r1: 8, rot: -PI / 2 + PI / 10 }); }); p.con(16, 16, 0, 0.55, () => puno(p, { m: 'piel' })); },
  ejecucion: (p) => { p.con(15, 20, 0, 0.72, () => calavera(p, { grieta: true })); p.con(19, 9, 0.7, 0.85, () => hacha(p, { filo: 'e_sangre' })); p.dib(trazo([14, 18, 13, 24], 0.6, 0.3), { m: 'e_sangre', e: true }); },
  torbellino: (p) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_fisico', r: 13.5, brazos: 3, vueltas: 0.6, grosor: 1.7 })); for (let i = 0; i < 3; i++) { const a = (i / 3) * PI * 2 - PI / 2; p.con(16 + Math.cos(a) * 7.5, 16 + Math.sin(a) * 7.5, a + PI * 0.6, 0.5, () => hacha(p)); } },
  ira_jarl: (p) => { aroDef(p); p.con(16, 27, 0, 1, () => M.grieta(p, { m: 'e_fuego' })); p.con(16, 14, 0, 0.9, () => yelmoAstado(p, 'oro', 'rubi')); },
  rugido: (p) => { p.con(13, 16, 0, 1, () => cabezaGrito(p)); p.con(21, 17, 0, 1, () => onda(p, { m: 'e_fisico', n: 3, r0: 2, paso: 3.4, a0: -0.9, a1: 0.9, g: 0.9 })); },
  bramido: (p) => { p.con(16, 7, 0, 1, () => onda(p, { m: 'e_sangre', n: 3, r0: 3, paso: 3.4, a0: PI * 0.15, a1: PI * 0.85, g: 1 })); p.con(16, 22, 0.15, 0.7, () => { espadaRota(p); }); },
  grito_guerra: (p) => { p.con(16, 16, 0, 1, () => llama(p, { m: 'e_sangre', k: 1.25 })); p.con(16, 18, 0, 0.7, () => puno(p)); },
  canto_remero: (p) => { p.con(16, 15, 0, 1, () => M.barco(p)); p.con(16, 13, 0, 1, () => M.olas(p, { y: 13 })); p.con(16, 16, 0, 1, () => M.olas(p, { y: 12.4, m: 'agua' })); },
  piel_hierro: (p) => { p.con(16, 18, 0, 0.95, () => M.yunque(p)); for (const [x, y] of [[9, 6], [22, 5], [16, 3], [26, 9]]) p.chispa(x, y, 'e_fuego'); p.brillo(16, 10, 8, 0.6); },
  pulmones_fiordo: (p) => { p.con(16, 18, 0, 1, () => M.montana(p)); p.con(16, 11, 0, 0.7, () => remolino(p, { m: 'e_viento', r: 9, brazos: 2, vueltas: 0.9, grosor: 1.3 })); },
  cuerno_ancestros: (p) => { p.con(15, 17, 0, 1, () => M.cuerno(p)); p.con(24, 8, -0.8, 1, () => onda(p, { m: 'e_fisico', n: 3, r0: 1.5, paso: 2.8, a0: -0.8, a1: 0.8, g: 0.7 })); },
  eco_feroz: (p) => { p.con(16, 16, 0, 0.7, () => escudoRedondo(p, { campo: 'tela' })); for (const s of [-1, 1]) p.con(16 + s * 8, 16, s > 0 ? 0 : PI, 1, () => onda(p, { m: 'e_fisico', n: 3, r0: 2, paso: 2.6, a0: -0.75, a1: 0.75, g: 0.8 })); },
  alarido: (p) => { for (let i = 0; i < 3; i++) p.dib(hueco(circ(16, 16, 6 + i * 3.6), 1 - i * 0.2), { m: 'e_fisico', e: true, b: 0.8 }); p.con(16, 16, 0, 0.62, () => calavera(p, { grieta: true })); for (const [x, y] of [[6, 6], [26, 7], [5, 24], [27, 25]]) p.chispa(x, y, 'e_luz'); },
  canto_invierno: (p) => { aroDef(p, 'zafiro'); p.con(16, 16, 0, 1, () => copo(p, { m: 'e_frio', emis: true, r: 9 })); p.con(15, 18, 0, 0.75, () => M.cuerno(p, { m: 'hielo', bandas: 'oro' })); },
  sed_sangre: (p) => { p.con(16, 18, 0, 1, () => caliz(p, 'oro', 'e_sangre')); p.dib(trazo(curva(9, 9, 7, 14, 8, 19), 0.9, 0.4), { m: 'e_sangre', e: true }); },
  desgarro: (p) => { p.con(16, 15, 0.1, 1, () => M.tajos(p, { m: 'e_sangre', n: 3, largo: 12, g: 1.8 })); for (const [x, y] of [[9, 26], [15, 28], [22, 27]]) p.dib(fundir(0.5, circ(x, y, 1.3), poli(x - 0.8, y, x, y - 2.6, x + 0.8, y)), { m: 'sangre', b: 1 }); },
  maestria_hachas: (p) => { p.con(16, 17, 0, 1, () => hacha(p, { filo: 'e_luz' })); p.chispa(26.5, 6, 'e_luz', true); p.chispa(27, 16, 'e_luz'); p.brillo(26, 10, 6, 0.7); },
  sangria: (p) => { p.con(13, 13, -0.7, 0.75, () => hacha(p, { filo: 'e_sangre' })); p.con(22, 22, 0, 0.6, () => gota(p)); p.dib(trazo(curva(14, 7, 20, 9, 21, 15), 0.6, 0.3), { m: 'e_sangre', e: true }); },
  piel_curtida: (p) => { p.con(16, 16, 0, 1, () => pellejo(p)); },
  marea_roja: (p) => { p.con(16, 18, 0, 1, () => { p.dib(hueco(elip(0, 7, 13, 4.2), 1.2), { m: 'e_sangre', e: true, b: 0.8, brillo: 0.8 }); p.dib(elip(0, 7, 11, 3.2), { m: 'sangre', b: 2.5, luz: -0.6 }); for (let i = 0; i < 7; i++) { const t = i / 6, x = -10 + t * 20, h = 8 + Math.sin(t * PI) * 6, a = (t - 0.5) * 0.9; p.con(x, 6, a, 1, () => { p.dib(poli(-1.6, 0, 0, -h, 1.6, 0), { m: 'sangre', b: 1.4 }); p.dib(circ(0, -h - 1.8, 1.3), { m: 'sangre', b: 1.3 }); }); } p.dib(elip(0, 6, 5, 1.6), { m: 'sombra', t: 0, sinBorde: true }); }); },
  frenesi: (p) => { p.con(16, 15, 0, 0.92, () => rayo(p, { m: 'e_sangre' })); M.lineasVelocidad(p, { m: 'e_sangre', n: 4, x0: 1, x1: 2, y0: 9, y1: 24 }); },
  pacto_herida: (p) => { p.con(16, 17, 0, 1, () => mano(p)); p.dib(trazo([10, 16, 21, 12], 0.7, 0.4), { m: 'e_sangre', e: true, b: 0.7, brillo: 1 }); for (const [x, y] of [[13, 21], [18, 23]]) p.dib(trazo([x, y, x, y + 3], 0.6, 0.3), { m: 'e_sangre', e: true }); },
  torrente_sangre: (p) => { p.con(16, 16, -0.6, 1, () => p.dib(fundir(2, poli(13, 0, 0, -9, 2, -3, -13, -5, -10, 0, -13, 5, 2, 3, 0, 9), circ(-4, 0, 4)), { m: 'e_sangre', e: true, b: 4, brillo: 1.4 })); p.con(21, 11, 0.95, 0.5, () => hacha(p)); },
  rio_carmesi: (p) => { aroDef(p, 'rubi'); p.con(16, 16, 0, 0.88, () => corazon(p, { m: 'sangre', b: 4, trama: true })); p.dib(hueco(elip(16, 18, 10, 3.2), 1), { m: 'oro', b: 0.8 }); M.burbujas(p, { m: 'e_sangre', n: 5, x: 16, y: 10, r: 12 }); },
};

// ------------------------------------------------------------------ motivos propios de unas recetas
function yelmoAstado(p: P, m: string, gema: string) {
  for (const s of [-1, 1]) p.dib(trazo(curva(s * 6, -2, s * 13, -4, s * 13, -12, s * 9, -16), 2.2, 0.4), { m: 'hueso', b: 1.6 });
  p.dib(union(corte(circ(0, 1, 9), caja(0, -4, 20, 14)), caja(0, 3, 19, 3.4, 0.8)), { m, b: 3 });
  p.dib(caja(0, 6, 2.6, 7, 0.6), { m, b: 1 });
  for (const s of [-1, 1]) p.dib(poli(s * 1.6, 3.6, s * 8, 3.6, s * 7, 8.5, s * 2, 8), { m: 'sombra', t: 0 });
  p.dib(circ(0, -3, 1.7), { m: gema, b: 1.7 });
}
function cabezaGrito(p: P) {
  // perfil del berserker: yelmo, barba trenzada y la boca abierta (mira a la derecha)
  p.dib(fundir(1.5, circ(-1, -3, 7), poli(-6, 0, 6, -1, 7.5, 2, 6, 5, 3, 9, -5, 9)), { m: 'piel', b: 3 });
  p.dib(poli(1.5, 2.5, 7.5, 1, 6.6, 6, 2.5, 5.5), { m: 'sombra', t: 0 });
  p.dib(union(poli(-8, 3, 3.5, 6, 2, 13, -1, 11, -3, 15, -6, 10)), { m: 'pelaje', b: 2, luz: 0.5 });
  p.dib(union(corte(circ(-1, -3, 7.8), caja(0, -8, 20, 10)), caja(-1, -3.2, 16, 2, 0.6)), { m: 'hierro', b: 2 });
  p.dib(trazo(curva(-6, -7, -12, -9, -11, -15), 1.4, 0.3), { m: 'hueso', b: 1 });
  p.dib(poli(3, -1.5, 5.8, -2.3, 4.8, -0.6), { m: 'e_sangre', e: true, b: 0.5 });
}
function espadaRota(p: P) {
  p.dib(poli(-1.8, 4, -1.8, -4, 0.5, -6, 1.8, -3.5, 1.8, 4), { m: 'acero', b: 1.8 });
  p.dib(poli(3, -9, 5, -11.5, 7.5, -15, 4.8, -14, 2.4, -10.5), { m: 'acero', b: 1, luz: -0.5 });
  p.dib(caja(0, 5, 9, 1.9, 0.7), 'bronce'); p.dib(trazo([0, 6, 0, 10.4], 0.95), 'cuero'); p.dib(circ(0, 11.6, 1.5), 'bronce');
}
function caliz(p: P, m: string, liq: string) {
  p.dib(union(corte(elip(0, -4, 9, 8), caja(0, 0, 22, 16)), trazo([0, 0, 0, 8], 1.2), caja(0, 9, 11, 2.4, 1)), { m, b: 2.5 });
  p.dib(elip(0, -6.5, 8.2, 2.2), { m: liq, e: true, b: 1.5, brillo: 1.2 });
  p.dib(trazo([7.5, -6, 8, -1, 7, 2], 0.8, 0.4), { m: liq, e: true });
}
function pellejo(p: P) {
  p.dib(poli(-11, -12, -5, -10, 0, -13, 5, -10, 11, -12, 9, -4, 12, 3, 8, 6, 10, 13, 3, 10, 0, 13, -3, 10, -10, 13, -8, 6, -12, 3, -9, -4), { m: 'pelaje', b: 2, trama: true });
  p.dib(poli(-6, -6, 6, -6, 7, 6, -7, 6), { m: 'cuero', b: 1.5, luz: 0.5 });
  for (const [x, y] of [[-11, -12], [11, -12], [-10, 13], [10, 13]]) { p.dib(trazo([x, y, x * 1.25, y * 1.18], 0.3), { m: 'cuero', t: 2 }); }
  for (let i = 0; i < 6; i++) p.dib(trazo([-6 + i * 2.4, -6, -5 + i * 2.4, -7.2], 0.2), { m: 'hueso', t: 4, sinBorde: true });
}

/** Lo que pinta cada glifo cuando no hay receta propia (el golpe del táctil, agresivo y calmo, habilidades nuevas). */
const GLIFO: Record<string, Receta> = {
  hacha: (p) => p.con(16, 16, 0.6, 0.95, () => hacha(p)),
  espada: (p) => p.con(16, 16, 0.785, 0.95, () => espada(p)),
  escudo: (p) => p.con(16, 16, 0, 0.95, () => escudo(p)),
  arco: (p) => p.con(14, 16, 0, 1, () => arco(p)),
  puno: (p) => p.con(16, 17, 0, 0.95, () => puno(p)),
  garra: (p) => p.con(16, 16, 0, 1, () => M.garra(p)),
  hueso: (p) => p.con(16, 16, 0.785, 1, () => hueso(p)),
  orbe: (p) => p.con(16, 16, 0, 1.2, () => M.orbe(p)),
  frasco: (p) => p.con(16, 17, 0, 1, () => frasco(p)),
};
/** Si nada coincide: un orbe del elemento. */
const RESPALDO: Receta = (p) => p.con(16, 16, 0, 1.2, () => M.orbe(p, { m: p.emi }));

const hash = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };
export const tieneReceta = (id: string) => id in RECETAS;

/** Pinta el ícono de una habilidad a s × s (s ≤ 64 directo; más grande, a una base chica agrandada por enteros). */
export function pintarIcono(hb: Pick<Habilidad, 'id' | 'glifo' | 'elem' | 'clase'> & { definitiva?: boolean }, s: number, o: { soloGlifo?: boolean } = {}): Uint8ClampedArray {
  if (s > 64) {
    const k = Math.ceil(s / 52), b = Math.ceil(s / k), base = pintarIcono(hb, b, o), out = new Uint8ClampedArray(s * s * 4), off = Math.floor((b * k - s) / 2);
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) { const sx = Math.floor((x + off) / k), sy = Math.floor((y + off) / k), i = (sy * b + sx) * 4, j = (y * s + x) * 4; out[j] = base[i]; out[j + 1] = base[i + 1]; out[j + 2] = base[i + 2]; out[j + 3] = base[i + 3]; }
    return out;
  }
  const id = hb.id && hb.id !== 'ataque' ? hb.id : '';
  const p = new Pintor(s, hb.elem ?? 'fisico', hash(id || hb.glifo || 'x'));
  (RECETAS[id] ?? GLIFO[hb.glifo] ?? RESPALDO)(p);
  return p.final({ clase: hb.clase, soloGlifo: o.soloGlifo });
}

// ------------------------------------------------------------------ más motivos de recetas
/** El aro de un aura en el piso, con motas que suben. */
function auraSuelo(p: P, m = 'e_luz') {
  p.dib(hueco(elip(16, 25.5, 12, 3.4), 1.1), { m, e: true, b: 0.7, brillo: 1.2 });
  for (const [x, y] of [[6, 19], [26, 17], [9, 11], [24, 9]]) p.chispa(x, y, m);
}
function manoBendice(p: P, m = 'piel') {
  p.dib(caja(0, 8, 6.5, 7, 1.5), { m, b: 2 });
  p.dib(caja(0, 2.5, 10, 8, 3), { m, b: 2.5 });
  p.dib(trazo([-1.6, -1, -2, -13], 1.2, 1), { m, b: 1.2 }); p.dib(trazo([1.4, -1, 1.8, -12.5], 1.2, 1), { m, b: 1.2 });
  p.dib(trazo([3.6, 0, 5, -3, 3.6, -1.6], 1.1), { m, b: 1.1, luz: -0.4 }); p.dib(trazo([-4, 0, -6.6, -4, -3.5, -2.2], 1.1), { m, b: 1.1 });
}
function coraza(p: P, m: string) {
  p.dib(poli(-11, -9, -5, -11, 0, -8, 5, -11, 11, -9, 12, -3, 9, 0, 8, 10, 0, 13, -8, 10, -9, 0, -12, -3), { m, b: 2.4, trama: true });
  p.dib(trazo([0, -7, 0, 11], 0.35), { m, t: 1, sinBorde: true, sinSombra: true });
  for (const s of [-1, 1]) p.dib(poli(s * 9, -10, s * 13, -14, s * 13.5, -7, s * 11, -6), { m, b: 1, luz: 0.6 });
}
function horno(p: P) {
  p.dib(union(caja(0, 2, 24, 22, 2), corte(circ(0, -6, 12), caja(0, -10, 26, 10))), { m: 'piedra', b: 1.6 });
  p.dib(union(caja(0, 6, 12, 10), circ(0, 1, 6)), { m: 'sombra', t: 0, sinBorde: true });
  p.con(0, 4, 0, 0.62, () => llama(p, { brillo: 1.8 }));
  for (let r = 0; r < 4; r++) p.dib(trazo([-12, -4 + r * 4.5, -6.5, -4 + r * 4.5], 0.25), { m: 'piedra', t: 1, sinBorde: true, sinSombra: true });
  for (let r = 0; r < 4; r++) p.dib(trazo([6.5, -4 + r * 4.5, 12, -4 + r * 4.5], 0.25), { m: 'piedra', t: 1, sinBorde: true, sinSombra: true });
}
function cabezaPerfil(p: P, m = 'silueta') {
  p.dib(fundir(1.5, circ(0, -2, 8), poli(-3, 3, 7, 0, 8, 3, 6, 4, 7, 6, 4, 9, -1, 10, -4, 13, -8, 13, -6, 5)), { m, b: 2 });
}
function prisma(p: P) {
  p.dib(poli(0, -10, 9, 7, -9, 7), { m: 'vidrio', b: 1.2, luz: 0.4 });
  p.dib(poli(0, -10, 9, 7, 0, 7), { m: 'vidrio', b: 1.2, luz: -0.5 });
}
const ESTRUENDO = (p: P, x: number, y: number) => { p.chispa(x, y, 'e_rayo', true); p.brillo(x, y, 4, 0.8); };

Object.assign(RECETAS, {
  // ================================================================== TEMPLARIO
  golpe_sagrado: (p: P) => { p.con(22, 22, 0, 1, () => estallido(p, { m: 'e_luz', n: 4, r0: 1.6, r1: 7.5, rot: 0 })); p.con(13, 13, PI * 0.75, 0.88, () => espada(p)); p.con(22, 22, 0, 0.32, () => M.cruz(p, { emis: true })); },
  voto_acero: (p: P) => { p.con(15, 15, PI, 0.95, () => espada(p, { gema: 'zafiro' })); p.dib(trazo(curva(15, 10, 21, 12, 22, 20), 0.9, 0.7), { m: 'tela', b: 0.8 }); p.con(22.5, 22, 0, 0.42, () => M.sello(p)); },
  celo: (p: P) => { for (let i = 0; i < 3; i++) p.dib(trazo([5 + i * 5, 27, 18 + i * 5, 6], 0.3, 1.6), { m: 'e_luz', e: true, b: 1, brillo: 0.7 }); p.con(10, 23, PI * 0.25, 0.62, () => espada(p)); },
  filo_alba: (p: P) => { p.con(16, 26, 0, 1, () => { p.dib(corte(estrella(0, 0, 12, 8, 14, 0), caja(0, -8, 32, 16)), { m: 'e_luz', e: true, b: 3, brillo: 1.2 }); p.dib(corte(circ(0, 0, 7), caja(0, -4, 20, 8)), { m: 'e_luz', e: true, b: 5, luz: 1 }); });
    p.con(16, 13, 0, 0.92, () => espada(p, { hoja: 'e_luz', emis: true })); },
  carga: (p: P) => { for (const [x, y, r] of [[6, 24, 3], [9, 27.5, 2.2], [4, 19.5, 2]] as [number, number, number][]) p.dib(circ(x, y, r), { m: 'tierra', b: r, luz: 0.6, trama: true }); M.lineasVelocidad(p, { m: 'e_fisico', n: 4, x0: 1, x1: 3, y0: 7, y1: 17 }); p.con(19, 16, 0.3, 1, () => { p.dib(union(caja(0, 1, 14, 16, 2.5), corte(elip(0, -6, 7, 3.5), caja(0, -8, 16, 6))), { m: 'acero', b: 2.2, trama: true }); p.dib(caja(1.5, -1.5, 11, 1.6, 0.4), { m: 'sombra', t: 0 }); for (let i = 0; i < 3; i++) for (let k = 0; k < 2; k++) p.dib(circ(3 + i * 1.8, 3.5 + k * 1.8, 0.45), { m: 'sombra', t: 0, sinBorde: true }); p.dib(union(caja(-3, 3, 1.4, 9), caja(-3, 1.5, 5, 1.4)), { m: 'oro', b: 0.8 }); p.dib(caja(0, 9.5, 15, 2, 0.6), { m: 'oro', b: 0.8 }); }); },
  disciplina: (p: P) => { p.con(16, 13, 0, 0.92, () => espada(p, { largo: 1.05 })); p.con(16, 19, 0, 0.6, () => puno(p, { m: 'acero', nudillos: 'oro' })); },
  corte_sello: (p: P) => { p.con(16, 16, 0, 1, () => M.anilloRunas(p, { r: 12, n: 10 })); p.con(16, 16, 0, 0.45, () => M.cruz(p, { emis: true })); p.dib(trazo([5, 26, 27, 5], 0.3, 1.5), { m: 'e_fisico', e: true, b: 1, brillo: 1 }); },
  juicio: (p: P) => { p.brillo(16, 10, 10, 0.8); p.con(16, 16, 0, 1, () => M.balanza(p)); },
  espadas_votivas: (p: P) => { for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 - PI / 2; p.con(16 + Math.cos(a) * 7.5, 16 + Math.sin(a) * 7.5, a + PI / 2, 0.6, () => espada(p, { emis: true, hoja: 'e_luz', guarda: 'oro', ancha: 2.6 })); } p.dib(circ(16, 16, 2.4), { m: 'e_luz', e: true, b: 2.4, brillo: 1.5 }); },
  sentencia_final: (p: P) => { aroDef(p, 'zafiro'); p.con(16, 26, 0, 1, () => estallido(p, { m: 'e_luz', n: 9, r0: 2.5, r1: 8, rot: 0 })); p.con(16, 13, PI, 1, () => espada(p, { hoja: 'e_luz', emis: true, guarda: 'oro', gema: 'zafiro', ancha: 2.2 })); },
  aura_fuerza: (p: P) => { auraSuelo(p, 'e_sangre'); p.con(16, 14, 0, 0.9, () => espada(p, { guarda: 'oro', gema: 'rubi' })); },
  aura_oracion: (p: P) => { auraSuelo(p); p.con(16, 14, 0, 1, () => M.vela(p)); },
  aura_espinas: (p: P) => { auraSuelo(p, 'e_fisico'); p.con(16, 15, 0, 1, () => { const pts = arcoPts(0, 0, 9, 0, PI * 2, 24); p.dib(trazo(pts, 1.1), { m: 'corteza', b: 1 }); for (let i = 0; i < 10; i++) { const a = (i / 10) * PI * 2; p.con(Math.cos(a) * 9, Math.sin(a) * 9, a, 1, () => p.dib(poli(0, -0.9, 3.4, 0, 0, 0.9), { m: 'hueso', b: 0.6 })); } }); },
  aura_firmeza: (p: P) => { auraSuelo(p); p.con(16, 14, 0, 0.82, () => escudo(p, { campo: 'zafiro', borde: 'oro', emblema: (p) => p.con(0, 0, 0, 0.5, () => M.cruz(p, { m: 'acero' })) })); },
  aura_llama: (p: P) => { auraSuelo(p, 'e_fuego'); p.con(16, 14, 0, 0.95, () => llama(p, { m: 'e_luz', brillo: 1.4 })); p.con(16, 17, 0, 0.5, () => llama(p, { m: 'e_fuego' })); },
  fervor_sello: (p: P) => { p.con(16, 16, 0, 1, () => sol(p, { r: 5, rayos: 10, largo: 14 })); p.con(16, 16, 0, 0.85, () => M.sello(p, { signo: (p) => p.con(0, 0, 0, 0.32, () => M.cruz(p, { m: 'cera' })) })); },
  aura_presteza: (p: P) => { auraSuelo(p, 'e_viento'); p.con(17, 13, 0, 0.82, () => M.ala(p, { m: 'hueso' })); M.lineasVelocidad(p, { n: 3, x0: 3, x1: 1, y0: 8, y1: 16 }); },
  juramento_renovado: (p: P) => { p.con(16, 21, 0, 0.95, () => M.libro(p)); p.con(16, 8, 0, 0.42, () => M.cruz(p, { emis: true })); p.brillo(16, 9, 7, 1); },
  aura_conviccion: (p: P) => { auraSuelo(p); p.con(16, 14, 0, 0.82, () => M.ojoMagico(p)); for (const x of [8, 24]) p.dib(poli(x - 2, 4, x + 2, 4, x, 8), { m: 'e_luz', e: true, b: 1 }); },
  coro_sellos: (p: P) => { aroDef(p, 'zafiro'); p.con(16, 19, 0, 0.75, () => sol(p, { r: 4, rayos: 12, largo: 10 })); for (const [x, y] of [[8.5, 9.5], [16, 6.5], [23.5, 9.5]]) p.con(x, y, 0, 1, () => M.halo(p, { r: 2.8, ry: 1.1, g: 0.9, m: 'e_oro' })); },
  bendicion: (p: P) => { p.brillo(16, 10, 9, 1.2); p.con(16, 17, 0, 1, () => manoBendice(p)); for (const [x, y] of [[9, 6], [23, 6], [16, 3]]) p.chispa(x, y, 'e_luz'); },
  rezo_alivio: (p: P) => { p.brillo(16, 13, 12, 1.4); p.con(16, 16, 0, 1, () => M.manosRezo(p)); p.con(25, 7, 0, 1, () => p.dib(union(caja(0, 0, 2, 7, 0.5), caja(0, 0, 7, 2, 0.5)), { m: 'e_veneno', e: true, b: 1, brillo: 1.4 })); },
  golpe_escudo: (p: P) => { p.con(24, 15, 0, 1, () => estallido(p, { m: 'e_fisico', n: 7, r0: 2, r1: 7 })); p.con(14, 16, -0.3, 0.85, () => escudo(p, { campo: 'tela', emblema: (p) => p.con(0, -1, 0, 0.6, () => p.dib(estrella(0, 0, 4, 1.2, 5, 0), 'oro')) })); M.lineasVelocidad(p, { m: 'e_fisico', n: 3, x0: 1, y0: 10, y1: 22 }); },
  saeta_fe: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => { p.dib(trazo([0, 14, 0, -6], 0.2, 2.2), { m: 'e_luz', e: true, b: 1.4, brillo: 1.4 }); p.dib(poli(0, -15, 3, -7, 0, -9, -3, -7), { m: 'e_luz', e: true, b: 2, brillo: 1.5 }); }); },
  muralla_fe: (p: P) => { p.con(16, 19, 0, 0.95, () => M.muro(p)); p.con(16, 7, 0, 0.36, () => M.cruz(p, { emis: true })); p.brillo(16, 8, 7, 1); },
  martillo_bendito: (p: P) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_luz', r: 13, brazos: 1, vueltas: 0.9, grosor: 1.6 })); p.brillo(19, 11, 8, 1); p.con(17, 15, 0.6, 0.78, () => martillo(p, { cabeza: 'acero' })); },
  egida_alba: (p: P) => { p.con(16, 15, 0, 1, () => sol(p, { r: 7, rayos: 14, largo: 15.5 })); p.con(16, 17, 0, 0.78, () => escudo(p, { campo: 'oro', borde: 'acero', emblema: (p) => p.con(0, -1, 0, 0.5, () => M.cruz(p, { m: 'tela' })) })); },
  campana_penitencia: (p: P) => { p.con(16, 15, 0, 0.9, () => campana(p)); for (const s of [-1, 1]) p.con(16 + s * 6, 15, s > 0 ? 0 : PI, 1, () => onda(p, { m: 'e_luz', n: 2, r0: 6, paso: 3, a0: -0.6, a1: 0.6, g: 0.8 })); },
  gracia_martir: (p: P) => { p.con(16, 18, 0, 0.85, () => corazon(p)); p.con(16, 18, 0, 0.85, () => { const pts = arcoPts(0, -2, 8, 0, PI * 2, 20); p.dib(trazo(pts, 0.6), { m: 'corteza', b: 0.6 }); for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2 + 0.3; p.con(Math.cos(a) * 8, -2 + Math.sin(a) * 8, a, 1, () => p.dib(poli(0, -0.7, 2.6, 0, 0, 0.7), { m: 'hueso', b: 0.5 })); } }); p.con(16, 5, 0, 1, () => M.halo(p, { r: 6, g: 1.1 })); },
  cielo_abierto: (p: P) => { aroDef(p, 'zafiro'); for (const [x, w] of [[9, 2.4], [16, 3.4], [23, 2.4]]) p.dib(poli(x - w * 0.6, 9, x + w * 0.6, 9, x + w, 27, x - w, 27), { m: 'e_luz', e: true, b: 1.6, brillo: 1.3 });
    p.con(8, 9, 0, 0.55, () => nube(p, { m: 'nube' })); p.con(24, 9, 0, 0.55, () => nube(p, { m: 'nube' })); p.dib(hueco(elip(16, 26.5, 11, 2.4), 0.8), { m: 'e_luz', e: true, b: 0.6 }); },

  // ================================================================== ARCANISTA
  saeta_ignea: (p: P) => { p.con(18, 14, PI * 1.25, 1, () => { p.dib(fundir(2, poli(0, -7, 3.2, 0, 0, 4, -3.2, 0), trazo([0, 0, 0, 19], 2.6, 0.2)), { m: 'e_fuego', e: true, b: 2.6, brillo: 1.5 }); p.dib(trazo([2.5, 3, 4, 12], 0.8, 0.1), { m: 'e_fuego', e: true, b: 0.8 }); p.dib(trazo([-2.5, 3, -4, 11], 0.8, 0.1), { m: 'e_fuego', e: true, b: 0.8 }); }); },
  brasas_saltarinas: (p: P) => { for (const [x0, y0, x1, y1, cx, cy] of [[5, 26, 13, 13, 8, 12], [13, 13, 21, 20, 17, 8], [21, 20, 27, 8, 25, 10]]) p.dib(trazo(curva(x0, y0, cx, cy, x1, y1), 0.35), { m: 'e_fuego', e: true, t: 2, brillo: 0.3 });
    for (const [x, y, r] of [[13, 13, 2.3], [21, 20, 2.6], [27, 8, 2.1]]) p.dib(circ(x, y, r), { m: 'e_fuego', e: true, b: r, brillo: 1.4 }); },
  bola_fuego: (p: P) => { p.con(19, 19, 0, 1, () => bolaFuego(p, { r: 7.5, cola: 15 })); },
  ceniza_venas: (p: P) => { p.con(16, 16, 0.2, 1.3, () => { p.dib(poli(-8, 3, -7, -4, -2, -8, 5, -7, 9, -1, 7, 6, 0, 8), { m: 'lava', b: 2.5 }); p.dib(trazo([-6, -1, -2, 0, 0, -5, 2, 1, 6, 0, 3, 5], 0.45), { m: 'e_fuego', e: true, b: 0.5, brillo: 1.6 }); }); for (const [x, y] of [[7, 6], [24, 5], [27, 13], [5, 14]]) p.dib(caja(x, y, 1.6, 1.6), { m: 'ceniza', t: 4, sinBorde: true }); },
  muro_fuego: (p: P) => { p.dib(caja(16, 26, 28, 3, 1), { m: 'tierra', b: 1 }); for (const [x, k] of [[7, 0.6], [16, 0.82], [25, 0.6], [11.5, 0.5], [20.5, 0.5]] as [number, number][]) p.con(x, 24 - k * 10, 0, k, () => llama(p)); },
  combustion: (p: P) => { p.dib(hueco(circ(16, 16, 12), 2.4), { m: 'humo', b: 1.4 }); p.con(16, 16, 0, 1, () => estallido(p, { m: 'e_fuego', n: 11, r0: 3.5, r1: 11 })); p.dib(circ(16, 16, 3), { m: 'e_fuego', e: true, b: 3, luz: 1 }); },
  lanza_magma: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => { p.dib(poli(0, -15, 3, -8, 2, 14, -2, 14, -3, -8), { m: 'lava', b: 1.5 }); p.dib(trazo([0, -12, 1, -6, -1, 0, 1, 6, 0, 12], 0.45), { m: 'e_fuego', e: true, b: 0.5, brillo: 1.4 }); }); for (const [x, y] of [[8, 25], [5, 21], [11, 28]]) p.chispa(x, y, 'e_fuego'); },
  maestria_fuego: (p: P) => { p.con(16, 17, 0, 0.92, () => horno(p)); },
  meteoro: (p: P) => { p.dib(trazo([28, 3, 15, 16], 0.4, 4), { m: 'e_fuego', e: true, b: 3, brillo: 1.6 }); p.con(13, 19, 0.5, 0.9, () => M.piedra(p, { m: 'lava' })); p.dib(trazo([11, 18, 14, 20, 13, 23], 0.4), { m: 'e_fuego', e: true, b: 0.4 }); },
  sol_negro: (p: P) => { aroDef(p, 'rubi'); p.con(16, 16, 0, 1, () => { p.dib(estrella(0, 0, 16, 8.4, 13, 0), { m: 'e_fuego', e: true, b: 4.5, brillo: 1.8 }); p.dib(estrella(0, 0, 16, 8.4, 10.5, PI / 16), { m: 'e_negro', e: true, b: 2, brillo: 0.5 }); p.dib(circ(0, 0, 8.2), { m: 'sombra', b: 8, luz: -1.4 }); p.dib(hueco(circ(0, 0, 8.2), 0.7), { m: 'e_fuego', e: true, b: 0.5, luz: 1 }); }); },
  esquirla: (p: P) => { p.dib(trazo([5, 27, 14, 18], 0.2, 1.6), { m: 'e_frio', e: true, b: 1, brillo: 0.6 }); p.con(19, 13, PI * 0.25, 0.85, () => cristal(p, { largo: 9, ancho: 3.2 })); },
  armadura_escarcha: (p: P) => { p.con(16, 16, 0, 1, () => coraza(p, 'hielo')); for (const [x, y] of [[4, 6], [28, 6], [16, 4]]) p.chispa(x, y, 'e_frio'); },
  nova_escarcha: (p: P) => { p.dib(hueco(circ(16, 16, 6.5), 1.6), { m: 'e_frio', e: true, b: 1, brillo: 1.4 }); p.con(16, 16, 0, 1, () => esquirlas(p, { m: 'hielo', e: false, n: 10, r0: 7, r1: 14, ancho: 1.7 })); },
  frio_hueso: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => hueso(p, { largo: 1.05 })); for (const [x, y, a] of [[12, 12, -0.5], [19, 18, 0.4], [15, 15, 2.6], [21, 13, 0.9]]) p.con(x, y, a, 0.32, () => cristal(p)); },
  carambano: (p: P) => { p.con(16, 16, PI * 0.25 + PI, 1, () => { p.dib(poli(-3.5, -14, 3.5, -14, 0.8, 8, 0, 15, -0.8, 8), { m: 'hielo', b: 1.2, luz: 0.5 }); p.dib(poli(0, -14, 3.5, -14, 0.8, 8, 0, 15), { m: 'hielo', b: 1, luz: -0.6 }); }); },
  sepulcro_hielo: (p: P) => { p.dib(poli(5, 9, 11, 4, 25, 5, 28, 11, 27, 27, 21, 29, 6, 28), { m: 'hielo', b: 1.4, luz: 0.3, trama: true }); p.con(16, 17, 0, 0.9, () => figura(p, POSE({ ci: [-3, -4], mi: [-4.5, 3], cd: [3, -4], md: [4.5, 3] }), { m: 'hielo', t: 1 })); p.dib(trazo([8, 10, 12, 6, 24, 6.5], 0.3), { m: 'hielo', t: 5, sinBorde: true }); },
  orbe_glacial: (p: P) => { p.con(16, 16, 0, 1, () => esquirlas(p, { m: 'hielo', e: false, n: 6, r0: 8, r1: 13.5, ancho: 1.3, rot: 0.3 })); p.con(16, 16, 0, 1, () => M.orbe(p, { m: 'e_frio', r: 7.5 })); },
  corazon_invierno: (p: P) => { p.con(16, 16, 0, 1, () => corazon(p, { m: 'hielo', b: 2, luz: 0.3 })); p.dib(trazo([12, 9, 15, 13, 13, 17, 17, 21], 0.3), { m: 'hielo', t: 5, sinBorde: true }); for (const [x, y] of [[6, 6], [26, 7], [26, 24]]) p.chispa(x, y, 'e_frio'); },
  ventisca: (p: P) => { p.con(16, 10, 0, 0.85, () => nube(p, { oscura: true })); for (const [x, y, k] of [[9, 20, 0.28], [18, 24, 0.34], [25, 18, 0.24], [13, 27, 0.2]] as [number, number, number][]) p.con(x, y, 0, k, () => copo(p, { m: 'hielo' })); for (let i = 0; i < 3; i++) p.dib(trazo([4 + i * 8, 17, 1 + i * 8, 26], 0.3), { m: 'e_viento', e: true, t: 3 }); },
  edad_hielo: (p: P) => { aroDef(p, 'zafiro'); for (const [x, y, a, k] of [[11, 18, -0.45, 0.75], [21, 18, 0.45, 0.75], [16, 15, 0, 1]] as [number, number, number, number][]) p.con(x, y, a, k, () => cristal(p, { largo: 11, ancho: 4 })); p.dib(caja(16, 26, 18, 2.6, 1), { m: 'hielo', b: 1 }); },
  chispa: (p: P) => { p.dib(caja(16, 26.5, 28, 2.4, 1), { m: 'piedra', b: 1 }); for (const [x0, y0, x1, y1] of [[4, 24, 12, 14], [12, 24, 19, 8], [19, 24, 28, 15]]) chispazo(p, x0, y0, x1, y1, { r: 0.6, quiebre: 2.2 }); for (const [x, y] of [[12, 14], [19, 8], [28, 15]]) ESTRUENDO(p, x, y); },
  latido_galvanico: (p: P) => { p.dib(hueco(circ(16, 16, 11.5), 1), { m: 'e_rayo', e: true, b: 0.6, brillo: 0.8 }); p.dib(trazo([3, 17, 9, 17, 11, 13, 13, 22, 16, 6, 19, 25, 21, 15, 23, 17, 29, 17], 0.8, 0.8), { m: 'e_rayo', e: true, b: 0.8, brillo: 1.4 }); },
  arco_voltaico: (p: P) => { for (const [x, y] of [[7, 22], [25, 10]]) { p.dib(trazo([x, y + 3, x, y + 8], 1.2), { m: 'cobre', b: 1.2 }); p.dib(circ(x, y, 3), { m: 'cobre', b: 3 }); } chispazo(p, 9, 20, 23, 12, { r: 1, quiebre: 3, ramas: 2 }); },
  resonancia: (p: P) => { p.dib(hueco(circ(16, 16, 9), 0.6), { m: 'e_arcano', e: true, b: 0.5, brillo: 0.6 }); for (const [a, m] of [[-PI / 2, 'e_fuego'], [PI / 6, 'e_frio'], [PI * 5 / 6, 'e_rayo']] as [number, string][]) p.con(16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 0, 1, () => M.orbe(p, { m, r: 4 })); p.dib(circ(16, 16, 2), { m: 'e_arcano', e: true, b: 2 }); },
  rayo_cadena: (p: P) => { const n = [[5, 24], [14, 9], [21, 22], [28, 8]]; for (let i = 0; i < 3; i++) chispazo(p, n[i][0], n[i][1], n[i + 1][0], n[i + 1][1], { r: 0.95, quiebre: 2 }); for (const [x, y] of n) { p.dib(circ(x, y, 1.8), { m: 'e_rayo', e: true, b: 1.8 }); ESTRUENDO(p, x, y); } },
  descarga_prismatica: (p: P) => { p.dib(trazo([2, 19, 11, 17], 1.1), { m: 'e_luz', e: true, b: 1 }); for (const [y, m] of [[7, 'e_fuego'], [15, 'e_frio'], [23, 'e_rayo']] as [number, string][]) p.dib(trazo([18, 16, 30, y], 0.6, 1.6), { m, e: true, b: 1.2, brillo: 1 }); p.con(15, 17, 0, 0.85, () => prisma(p)); },
  paso_tormenta: (p: P) => { p.con(22, 17, 0, 1, () => estallido(p, { m: 'e_rayo', n: 8, r0: 4, r1: 11 })); p.con(22, 18, 0, 0.78, () => figura(p, POSE({ ci: [-3, -4], mi: [-6, -1], cd: [3, -4], md: [6, 0] }), { m: 'silueta', b: 1.2, luz: 0.6 })); chispazo(p, 3, 27, 13, 17, { r: 0.8, quiebre: 1.8 }); for (const [x, y] of [[5, 25], [9, 21]]) p.chispa(x, y, 'e_rayo'); },
  mente_tormenta: (p: P) => { p.con(15, 17, 0, 1, () => cabezaPerfil(p)); chispazo(p, 9, 8, 16, 18, { r: 0.7, ramas: 2 }); chispazo(p, 14, 9, 20, 15, { r: 0.6 }); p.brillo(15, 13, 6, 1); },
  tempestad: (p: P) => { for (const [x0, x1] of [[9, 6], [16, 18], [23, 27]]) chispazo(p, x0, 12, x1, 28, { r: 0.85, quiebre: 1.8 }); p.con(16, 8, 0, 0.9, () => nube(p, { oscura: true })); },
  furia_firmamento: (p: P) => { aroDef(p, 'amatista'); p.dib(circ(16, 16, 11.5), { m: 'nube', b: 3, luz: -0.8, trama: true }); p.con(16, 16, 0, 0.95, () => rayo(p)); chispazo(p, 9, 9, 4, 17, { r: 0.5 }); chispazo(p, 22, 22, 27, 15, { r: 0.5 }); },
} as Record<string, Receta>);

function diana(p: P) {
  for (const [r, m] of [[11, 'tela'], [8.4, 'hueso'], [5.8, 'tela'], [3.2, 'hueso'], [1.4, 'tela']] as [number, string][]) p.dib(circ(0, 0, r), { m, b: r === 11 ? 3 : 0.8, sinSombra: r !== 11 });
  p.dib(trazo([-3, 12, -6, 15], 1), 'madera'); p.dib(trazo([3, 12, 6, 15], 1), 'madera');
}
function aljaba(p: P) {
  for (const [x, a] of [[-3, -0.25], [0, 0], [3, 0.25]] as [number, number][]) p.con(x, -6, a, 0.6, () => { p.dib(trazo([0, -6, 0, 10], 0.9), 'madera'); for (const s of [-1, 1]) p.dib(poli(s * 0.5, -7, s * 3, -5, s * 3, -1, s * 0.5, -2), { m: 'tela', b: 1, luz: s > 0 ? -0.6 : 0 }); });
  p.dib(poli(-6, -5, 6, -5, 5, 13, -5, 13), { m: 'cuero', b: 2.5, trama: true });
  for (const y of [-3, 9]) p.dib(caja(0, y, 12.5, 1.8, 0.4), 'bronce');
  p.dib(trazo(curva(-6, -4, -10, 3, -6, 12), 0.6), { m: 'cuero', b: 0.6, luz: -0.5 });
}
function totem(p: P) {
  p.dib(trazo([0, -4, 0, 12], 1.6), { m: 'madera', b: 1.6 });
  for (let i = 0; i < 4; i++) p.dib(caja(0, -2 + i * 3, 5.5, 1.4, 0.6), { m: 'cobre', b: 0.8 });
  p.dib(poli(-6, 12, 6, 12, 3, 9, -3, 9), 'madera');
  p.dib(circ(0, -7, 3.4), { m: 'e_rayo', e: true, b: 3, brillo: 1.4 });
  for (const s of [-1, 1]) p.dib(trazo([s * 1.5, -4, s * 4.5, -8, s * 4, -11], 0.5), { m: 'cobre', b: 0.5 });
}
function cabezaHalcon(p: P) {
  p.dib(fundir(2, circ(-1, -2, 8), poli(-9, 2, 2, 4, -3, 13, -10, 12)), { m: 'pelaje', b: 3, trama: true });
  p.dib(poli(5, -6, 12, -3, 11, 2, 8, 5, 6.5, 1, 4, 0), { m: 'oro', b: 1.4 });
  p.dib(poli(10, 0, 11, 2, 8.6, 4), { m: 'sombra', t: 1 });
  p.dib(poli(-4, 3, 4, 2, 0, 8, -6, 9), { m: 'hueso', b: 2 });
  p.dib(elip(2, -3, 2.6, 2.4), { m: 'oro', b: 2.4 }); p.dib(circ(2.5, -3, 1.2), { m: 'sombra', t: 0 }); p.punto(1.4, -4, 'hueso', 5);
  p.dib(trazo([-1, -6.5, 5, -5], 0.7), { m: 'pelaje', t: 1 });
}
function reticula(p: P, m = 'e_sangre') {
  p.dib(hueco(circ(0, 0, 9), 1.2), { m, e: true, b: 0.8, brillo: 1 });
  for (let i = 0; i < 4; i++) { const a = (i * PI) / 2; p.dib(trazo([Math.cos(a) * 6, Math.sin(a) * 6, Math.cos(a) * 13, Math.sin(a) * 13], 0.8), { m, e: true, b: 0.8 }); }
  p.dib(circ(0, 0, 1.6), { m, e: true, b: 1.6, luz: 1 });
}
function craneoPerro(p: P) {
  p.dib(fundir(1.5, circ(-3, -2, 6.5), poli(-2, -6, 12, -1, 12, 2, 0, 3)), { m: 'hueso', b: 2.5 });
  p.dib(poli(-6, 2, 11, 3, 10, 6, -1, 8, -6, 6), { m: 'hueso', b: 1.5, luz: -0.4 });
  p.dib(elip(-1, -2.5, 2.4, 1.8), { m: 'sombra', t: 0 }); p.dib(circ(-0.6, -2.4, 0.9), { m: 'e_sombra', e: true, b: 1 });
  for (let i = 0; i < 4; i++) { p.dib(poli(2 + i * 2.4, 2, 3.6 + i * 2.4, 2, 2.8 + i * 2.4, 4.4), { m: 'hueso', t: 5 }); }
  p.dib(poli(9, 2.5, 10.6, 2.5, 10, 6), { m: 'hueso', t: 5 }); p.dib(poli(-9, -6, -7, -11, -4, -7), { m: 'hueso', b: 1 });
}
function manoHueso(p: P, m = 'hueso') {
  p.dib(trazo([0, 14, 0, 6], 1.3), { m, b: 1.2 }); p.dib(trazo([2.2, 14, 2.2, 6], 1), { m, b: 1 });
  p.dib(caja(0.5, 4, 8, 4, 1.2), { m, b: 1.4 });
  for (const [x0, x1, y1] of [[-3, -5, -8], [-1, -1.5, -10], [1.5, 2, -10], [3.6, 5, -7]]) p.dib(trazo([x0, 2.5, (x0 + x1) / 2, (2.5 + y1) / 2, x1, y1], 0.75, 0.55), { m, b: 0.7 });
  p.dib(trazo([4.5, 4, 8, 1, 9, -2], 0.75, 0.55), { m, b: 0.7 });
}

Object.assign(RECETAS, {
  // ================================================================== CAZADORA
  flecha_certera: (p: P) => { p.con(19, 19, 0, 0.95, () => diana(p)); p.con(12, 12, -PI * 0.25 + PI, 0.8, () => flecha(p)); },
  flecha_rastro: (p: P) => { p.con(23, 9, 0, 0.5, () => reticula(p)); p.con(13, 19, PI * 0.25, 0.95, () => flecha(p, { pluma: 'pelaje' })); p.con(13, 19, PI * 0.25, 0.95, () => { p.dib(poli(-0.6, 4, -4.5, 7, -4.5, 13, -0.6, 10), { m: 'pelaje', b: 1.2 }); p.dib(poli(0.6, 4, 4.5, 7, 4.5, 13, 0.6, 10), { m: 'pelaje', b: 1.2, luz: -0.5 }); }); },
  flecha_ignea: (p: P) => { p.dib(trazo([4, 28, 18, 14], 0.4, 3.2), { m: 'e_fuego', e: true, b: 2.5, brillo: 1.2 }); p.con(16, 16, PI * 0.25, 1, () => flecha(p, { punta: 'e_fuego', emisPunta: true })); p.con(23.5, 8.5, PI * 0.25, 0.42, () => llama(p)); },
  flecha_helada: (p: P) => { p.dib(trazo([4, 28, 18, 14], 0.3, 2.2), { m: 'e_frio', e: true, b: 2, brillo: 0.8 }); p.con(16, 16, PI * 0.25, 1, () => flecha(p, { punta: 'hielo', pluma: 'vidrio' })); p.con(24.5, 7.5, PI * 0.25, 0.4, () => cristal(p, { largo: 8, ancho: 3.6 })); for (const [x, y] of [[8, 16], [14, 25]]) p.chispa(x, y, 'e_frio'); },
  andanada: (p: P) => { for (let i = -2; i <= 2; i++) p.con(16 + i * 4.2, 22, i * 0.42, 0.74, () => flecha(p, { largo: 0.92 })); },
  pulso_firme: (p: P) => { p.con(12, 16, 0, 1, () => arco(p, { tenso: true })); p.con(17, 16, PI / 2, 0.92, () => flecha(p)); },
  flecha_racimo: (p: P) => { p.con(21, 11, 0, 1, () => { esquirlas(p, { m: 'acero', e: false, n: 9, r0: 3, r1: 8, ancho: 1 }); estallido(p, { m: 'e_fisico', n: 6, r0: 1.5, r1: 5 }); }); p.con(11, 21, PI * 0.25, 0.8, () => flecha(p)); },
  aljaba_viva: (p: P) => { p.con(16, 17, 0.25, 1, () => aljaba(p)); },
  lluvia_flechas: (p: P) => { p.dib(caja(16, 27.5, 28, 2.2, 1), { m: 'tierra', b: 1 }); for (const [x, y] of [[7, 14], [13, 9], [19, 15], [25, 10], [10, 22], [22, 22], [16, 20]]) p.con(x, y, PI * 0.92, 0.42, () => flecha(p)); },
  flecha_cometa: (p: P) => { aroDef(p, 'rubi'); p.dib(trazo([5, 27, 20, 12], 0.5, 4.5), { m: 'e_fuego', e: true, b: 3.5, brillo: 1.6 }); p.con(17, 15, PI * 0.25, 1, () => flecha(p, { punta: 'oro', pluma: 'tela', asta: 'oro' })); p.con(23, 9, 0, 0.55, () => estallido(p, { m: 'e_fuego', n: 6, r0: 2, r1: 6 })); },
  estocada: (p: P) => { p.con(25, 16, 0, 1, () => estallido(p, { m: 'e_fisico', n: 6, r0: 1.8, r1: 6.5, rot: 0 })); p.con(13, 16, PI / 2, 1, () => lanza(p, { largo: 0.85 })); M.lineasVelocidad(p, { m: 'e_fisico', n: 3, x0: 1, y0: 10, y1: 22 }); },
  instinto_presa: (p: P) => { p.con(16, 16, 0, 1, () => ojo(p, { iris: 'oro', pupila: 'raja', ancho: 0.95 })); for (const s of [-1, 1]) p.dib(trazo([16 + s * 10, 22, 16 + s * 13, 26], 0.6), { m: 'e_fisico', e: true, b: 0.6 }); },
  jabalina_rayo: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => lanza(p, { punta: 'e_rayo', emis: true })); chispazo(p, 5, 21, 17, 9, { r: 0.55, quiebre: 3 }); chispazo(p, 11, 27, 23, 15, { r: 0.55, quiebre: 3 }); },
  cepo_dientes: (p: P) => { p.con(16, 17, 0, 1, () => M.cepo(p)); },
  maestria_lanza: (p: P) => { p.dib(trazo(arcoPts(16, 16, 12.5, -PI * 0.2, PI * 1.4, 22), 0.3, 1.8), { m: 'e_fisico', e: true, b: 1, brillo: 0.8 }); p.con(16, 16, PI * 0.25, 0.92, () => lanza(p, { cinta: 'tela' })); },
  trampa_chispas: (p: P) => { p.con(16, 17, 0, 1, () => totem(p)); for (const [x, y] of [[6, 9], [26, 8], [7, 18], [25, 17]]) chispazo(p, 16, 10, x, y, { r: 0.4, quiebre: 1.2 }); },
  furia_lanza: (p: P) => { for (const [y, a] of [[8, -0.2], [16, 0], [24, 0.2]] as [number, number][]) p.con(14, y, PI / 2 + a, 0.62, () => lanza(p)); M.lineasVelocidad(p, { m: 'e_fisico', n: 5, x0: 1, x1: 1, y0: 6, y1: 26 }); },
  mina_brasa: (p: P) => { p.con(16, 14, 0.4, 0.82, () => frasco(p, { liquido: 'e_fuego' })); p.dib(corte(elip(16, 27, 14, 7), caja(16, 30, 32, 12)), { m: 'tierra', b: 2.5, trama: true }); for (const [x, y] of [[8, 18], [24, 15], [21, 22]]) p.chispa(x, y, 'e_fuego'); },
  furia_tormenta: (p: P) => { p.con(16, 11, PI / 2, 0.95, () => lanza(p, { punta: 'e_rayo', emis: true, largo: 0.85 })); for (const x of [8, 15, 22]) chispazo(p, x, 12, x - 1, 28, { r: 0.55, quiebre: 1.6 }); },
  coto_caza: (p: P) => { aroDef(p, 'esmeralda'); for (let i = 0; i < 6; i++) { const a = (i / 6) * PI * 2 - PI / 2, x = 16 + Math.cos(a) * 8, y = 16 + Math.sin(a) * 8; p.dib(circ(x, y, 2.4), { m: 'hierro', b: 2 }); p.dib(circ(x, y - 0.6, 1.2), { m: i % 2 ? 'e_rayo' : 'e_fuego', e: true, b: 1.2, brillo: 1.4 }); } p.con(16, 16, 0, 0.5, () => reticula(p, 'e_fuego')); },
  esquiva: (p: P) => { M.lineasVelocidad(p, { m: 'e_fisico', n: 3, x0: 1, y0: 18, y1: 26 }); p.con(16, 17, 0, 1, () => M.ciervoSalto(p)); },
  llamar_halcon: (p: P) => { p.con(16, 16, 0, 1, () => M.aveAbierta(p)); },
  ojo_halcon: (p: P) => { p.con(15, 17, 0, 1.1, () => cabezaHalcon(p)); p.chispa(19, 13, 'e_luz'); },
  marca_presa: (p: P) => { p.con(16, 16, 0, 1, () => reticula(p)); p.con(16, 16, 0, 0.42, () => calavera(p, { ojos: 'e_sangre' })); },
  espiritu_guardian: (p: P) => { p.con(16, 18, 0, 0.75, () => M.cornamenta(p, { m: 'e_alma' })); p.con(16, 18, 0, 1, () => { p.dib(fundir(1.5, poli(-5, -5, 5, -5, 2.5, 7, 0, 10, -2.5, 7), circ(0, -3, 4.5)), { m: 'e_alma', e: true, b: 4, brillo: 1.6 }); for (const s of [-1, 1]) p.dib(elip(s * 2.2, -2, 0.9, 1.2), { m: 'sombra', t: 0, sinBorde: true }); for (const s of [-1, 1]) p.dib(poli(s * 4, -6, s * 9, -7, s * 5, -3.5), { m: 'e_alma', e: true, b: 1 }); }); },
  lazo_salvaje: (p: P) => { p.dib(trazo(curva(5, 5, 16, 14, 27, 5), 0.6), { m: 'cuero', b: 0.6 }); p.con(16, 18, 0, 0.62, () => M.colmillo(p)); p.con(9.5, 15, 0.3, 0.45, () => M.pluma(p, { m: 'pelaje' })); p.con(22.5, 15, -0.3, 0.45, () => M.pluma(p, { m: 'cuervo' })); for (const x of [12.5, 19.5]) p.dib(circ(x, 12.2, 1.2), { m: 'esmeralda', b: 1.2 }); },
  savia_bosque: (p: P) => { p.con(14, 13, -0.6, 0.9, () => M.hoja(p)); p.con(22, 23, 0, 0.42, () => gota(p, { m: 'e_veneno', e: true, b: 5, brillo: 1.4 } as any)); p.dib(trazo([18, 16, 21, 19], 0.6, 0.4), { m: 'e_veneno', e: true }); },
  picada: (p: P) => { p.con(24, 25, 0, 0.9, () => estallido(p, { m: 'e_fisico', n: 6, r0: 1.5, r1: 5 })); p.con(15, 14, PI * 0.28, 1.05, () => halconPicada(p)); for (const [x, y] of [[4, 6], [8, 3], [3, 11]]) p.dib(trazo([x, y, x + 5, y + 5], 0.2, 0.6), { m: 'e_viento', e: true, b: 0.5 }); },
  cielo_halcones: (p: P) => { for (const [x, y, k, a] of [[9, 10, 0.62, -0.25], [23, 12, 0.58, 0.2], [15, 23, 0.68, 0]] as [number, number, number, number][]) p.con(x, y, a, k, () => aveCielo(p)); },
  caceria_salvaje: (p: P) => { aroDef(p, 'esmeralda'); p.con(16, 13, 0, 0.82, () => M.cornamenta(p, { m: 'oro' })); p.con(16, 19, 0, 0.55, () => { p.dib(fundir(1.5, poli(-6, -8, 6, -8, 3, 8, 0, 12, -3, 8), circ(0, -6, 5)), { m: 'hueso', b: 3 }); for (const s of [-1, 1]) p.dib(elip(s * 2.6, -4, 1.4, 1.9), { m: 'e_sangre', e: true, b: 1 }); }); },

  // ================================================================== NIGROMANTE
  lanza_hueso: (p: P) => { p.dib(trazo([4, 28, 14, 18], 0.2, 2.2), { m: 'e_sombra', e: true, b: 1.6, brillo: 0.8 }); p.con(17, 15, PI * 0.25, 1, () => { p.dib(union(poli(0, -15, 2.2, -6, 1.6, 12, -1.6, 12, -2.2, -6), circ(-1.4, 12.6, 1.8), circ(1.4, 12.6, 1.8)), { m: 'hueso', b: 1.8 }); p.dib(trazo([0, -10, 0, 8], 0.3), { m: 'hueso', t: 2, sinBorde: true, sinSombra: true }); }); },
  armadura_hueso: (p: P) => { p.dib(hueco(circ(16, 16, 11.5), 0.6), { m: 'e_sombra', e: true, b: 0.5, brillo: 0.8 }); for (let i = 0; i < 4; i++) { const a = (i / 4) * PI * 2 - PI / 4; p.con(16 + Math.cos(a) * 11.5, 16 + Math.sin(a) * 11.5, a, 0.4, () => hueso(p)); } p.con(16, 16.5, 0, 0.78, () => M.costillas(p)); },
  dientes_tumba: (p: P) => { for (let i = -2; i <= 2; i++) { const a = -PI / 2 + i * 0.42; p.con(16 + Math.cos(a) * 11, 26 + Math.sin(a) * 11, a + PI / 2, 1, () => M.diente(p)); } p.dib(trazo(arcoPts(16, 26, 5, -PI * 0.9, -PI * 0.1), 0.8), { m: 'e_sombra', e: true, b: 0.6, brillo: 1 }); },
  medula_piedra: (p: P) => { p.dib(poli(6, 9, 25, 7, 28, 22, 22, 27, 5, 25), { m: 'piedra', b: 1.6, trama: true }); p.dib(trazo([9, 12, 13, 18, 11, 22], 0.3), { m: 'piedra', t: 0, sinBorde: true }); p.con(17, 16, PI * 0.25, 0.95, () => hueso(p)); },
  explosion_cadaver: (p: P) => { p.con(16, 16, 0, 1, () => estallido(p, { m: 'e_fuego', n: 9, r0: 4, r1: 14 })); p.con(16, 17, 0, 0.55, () => calavera(p, { grieta: true })); for (const [x, y, r] of [[6, 8, 1.6], [27, 11, 1.3], [8, 26, 1.4], [26, 25, 1.8]]) p.dib(circ(x, y, r), { m: 'carne', b: r }); },
  jaula_costillas: (p: P) => { p.dib(corte(elip(16, 28, 15, 5), caja(16, 31, 32, 10)), { m: 'tierra', b: 2 }); for (let i = 0; i < 5; i++) { const x = 6 + i * 5, s = i < 2 ? 1 : i > 2 ? -1 : 0; p.dib(trazo(curva(x, 27, x - s * 1.5, 14, x + s * 4, 5), 1.2, 0.5), { m: 'hueso', b: 1 }); } p.con(16, 18, 0, 0.75, () => figura(p, POSE({}), { m: 'silueta', b: 1, luz: 1 })); },
  espiral_huesos: (p: P) => { for (let i = 0; i < 6; i++) { const t = i / 5, a = t * PI * 1.9 - PI * 0.3, r = 3.5 + t * 8.5; p.con(16 + Math.cos(a) * r, 16 + Math.sin(a) * r, a + PI / 2, 0.62 + t * 0.4, () => M.vertebra(p)); } p.dib(circ(16, 16, 2.2), { m: 'e_sombra', e: true, b: 2.2, brillo: 1.4 }); },
  medula_negra: (p: P) => { p.con(14, 13, PI * 0.25, 0.85, () => hueso(p, { largo: 0.9 })); p.dib(fundir(1, circ(21, 21, 3), trazo([19, 17, 21, 21], 1.2)), { m: 'e_sombra', e: true, b: 2.5, brillo: 1.4 }); p.dib(fundir(1, circ(22, 27.5, 1.6), poli(21, 27, 22, 24.5, 23, 27)), { m: 'e_sombra', e: true, b: 1.5 }); },
  cosecha_osario: (p: P) => { p.con(16, 16, 0.2, 0.95, () => M.guadana(p)); for (const [x, y] of [[8, 24], [22, 25]]) { p.con(x, y, 0, 0.36, () => estallido(p, { m: 'e_fuego', n: 7, r0: 4, r1: 12 })); p.con(x, y, 0, 0.3, () => calavera(p)); } },
  lamento_osario: (p: P) => { aroDef(p, 'amatista'); p.con(16, 16, 0, 1, () => esquirlas(p, { m: 'hueso', e: false, n: 10, r0: 6, r1: 12.5, ancho: 1.6 })); p.con(16, 16, 0, 0.5, () => calavera(p, { ojos: 'e_sombra' })); },
  alzar_esqueleto: (p: P) => { p.brillo(16, 22, 9, 1.2); p.con(16, 14, -0.1, 1, () => manoHueso(p)); p.dib(corte(elip(16, 29, 16, 6), caja(16, 32, 32, 12)), { m: 'tierra', b: 2.5, trama: true }); for (const [x, y] of [[7, 24], [25, 23]]) p.dib(caja(x, y, 2.4, 1.6, 0.4), { m: 'piedra', b: 0.8 }); },
  festin_tumba: (p: P) => { p.con(16, 14, 0, 0.78, () => calavera(p, { mandibula: false, ojos: 'e_sombra' })); p.con(16, 14, 0, 0.78, () => p.dib(caja(0, 14.5, 9, 3.4, 1), { m: 'hueso', b: 1.2 })); for (const [m, s] of [['e_sangre', -1], ['e_frio', 1]] as [string, number][]) p.dib(trazo(curva(16 + s * 14, 27, 16 + s * 10, 18, 16 + s * 3, 26, 16 + s * 0.5, 22), 1.5, 0.5), { m, e: true, b: 1.2, brillo: 1 }); },
  maestria_muertos: (p: P) => { p.con(16, 6, PI, 0.55, () => mano(p, { m: 'ceniza', flaca: true })); for (const [x0, x1] of [[11.5, 12.5], [15, 15.5], [18.5, 18.5], [21, 20]]) p.dib(trazo([x0, 12, x1, 19.5], 0.28), { m: 'e_sombra', e: true, t: 4, brillo: 0.4 }); p.con(16, 23, 0, 0.55, () => calavera(p, { ojos: 'e_sombra' })); },
  sabueso_osario: (p: P) => { p.con(15, 17, 0, 1.05, () => craneoPerro(p)); },
  mago_hueso: (p: P) => { p.con(19, 16, 0, 0.92, () => arco(p, { madera: 'hueso' })); p.con(12, 16, 0, 0.62, () => calavera(p, { ojos: 'e_sombra' })); },
  carne_prestada: (p: P) => { p.con(16, 16, 0, 1, () => corazon(p, { m: 'carne', b: 4, trama: true })); p.dib(trazo([10, 9, 14, 14, 13, 19, 17, 24], 0.4), { m: 'carne', t: 0, sinBorde: true }); for (const [x, y] of [[11, 11], [13.5, 14.5], [13.5, 18.5], [15.5, 22]]) p.dib(trazo([x - 1.6, y - 0.6, x + 1.6, y + 0.6], 0.3), { m: 'hueso', t: 4, sinBorde: true }); },
  golem_sangre: (p: P) => { p.con(16, 16, 0, 1, () => { p.dib(fundir(2, elip(0, -3, 9, 7), circ(0, -10, 3.4), trazo([-8, -5, -11, 4, -10, 10], 3, 2.6), trazo([8, -5, 11, 4, 10, 10], 3, 2.6), trazo([-4, 3, -5, 13], 2.6), trazo([4, 3, 5, 13], 2.6)), { m: 'sangre', b: 3, trama: true }); for (const s of [-1, 1]) p.dib(circ(s * 1.4, -10.4, 0.8), { m: 'e_luz', e: true, b: 0.8 }); }); M.burbujas(p, { m: 'e_sangre', n: 3, x: 16, y: 10, r: 14 }); },
  marcha_fosa: (p: P) => { for (const [x, k] of [[8, 0.5], [24, 0.5]] as [number, number][]) p.con(x, 13, 0, k, () => M.tumba(p)); p.con(16, 16, 0, 0.7, () => manoHueso(p)); p.dib(corte(elip(16, 29.5, 16, 5), caja(16, 32, 32, 10)), { m: 'tierra', b: 2 }); p.con(9, 24, 0.4, 0.4, () => manoHueso(p)); p.con(24, 24, -0.4, 0.4, () => manoHueso(p)); },
  ofrenda: (p: P) => { p.con(16, 13, 0, 1, () => estallido(p, { m: 'e_sombra', n: 8, r0: 3.5, r1: 11 })); p.dib(union(caja(16, 24, 20, 4, 0.8), caja(16, 28, 14, 4, 0.5)), { m: 'piedra', b: 1.2 }); p.con(16, 15, 0, 0.5, () => calavera(p, { ojos: 'e_sombra' })); },
  legion_ceniza: (p: P) => { aroDef(p, 'amatista'); for (const [x, y, k] of [[9, 13, 0.36], [23, 13, 0.36], [16, 11, 0.4], [11, 21, 0.42], [21, 21, 0.42]] as [number, number, number][]) { p.con(x + 3, y - 1, 0, k * 0.9, () => lanza(p)); p.con(x, y, 0, k, () => calavera(p, { ojos: 'e_sombra' })); } },
  amplificar: (p: P) => { p.con(16, 16, 0, 1, () => M.anilloRunas(p, { m: 'e_sombra', r: 12 })); p.dib(elip(16, 16, 3.5, 8.5), { m: 'carne', b: 2.5 }); p.dib(elip(16, 16, 1.4, 6.5), { m: 'e_sangre', e: true, b: 1.2, brillo: 1.2 }); },
  toque_putrido: (p: P) => { p.con(16, 17, 0, 0.95, () => mano(p, { m: 'musgo', garras: 'hueso' })); for (const [x, y] of [[7, 7], [24, 6], [27, 14], [6, 15]]) M.mosca(p, x, y); M.burbujas(p, { n: 3, x: 16, y: 20, r: 8 }); },
  debilidad: (p: P) => { p.con(16, 12, 0.5, 0.82, () => mano(p, { m: 'ceniza', flaca: true, garras: 'hueso' })); p.con(16, 25, PI / 2 + 0.15, 0.55, () => espadaRota(p)); p.dib(trazo([8, 6, 9, 12, 8, 15], 0.4), { m: 'e_sombra', e: true }); },
  lengua_amarga: (p: P) => { p.con(16, 12, 0, 0.9, () => boca(p, { labio: 'sombra', colmillos: true })); p.dib(trazo(curva(16, 15, 14, 21, 20, 23, 18, 27), 1.7, 1), { m: 'carne', b: 1.3 }); p.dib(trazo([18, 27, 15, 30], 0.7, 0.3), { m: 'carne', b: 0.6 }); p.dib(trazo([18, 27, 21, 30], 0.7, 0.3), { m: 'carne', b: 0.6 }); p.dib(circ(10, 24, 1), { m: 'e_sombra', e: true, b: 1 }); },
  terror: (p: P) => { p.con(16, 16, 0, 1.15, () => { M.espectro(p, { m: 'e_sombra' }); p.dib(elip(0, -1.6, 2, 3.2), { m: 'sombra', t: 0, sinBorde: true }); }); },
  sifon_vida: (p: P) => { p.con(16, 16, 0, 1, () => M.anilloRunas(p, { m: 'e_sombra', r: 12, n: 6 })); p.con(16, 17, 0, 0.62, () => gota(p)); for (let i = 0; i < 4; i++) { const a = PI / 4 + (i * PI) / 2; p.dib(trazo([16 + Math.cos(a) * 11, 16 + Math.sin(a) * 11, 16 + Math.cos(a + 0.4) * 6, 16 + Math.sin(a + 0.4) * 6], 0.3, 0.9), { m: 'e_sangre', e: true, b: 0.8 }); } },
  huesos_vidrio: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => hueso(p, { m: 'vidrio' })); p.dib(trazo([12, 13, 15, 17, 13, 19, 17, 22], 0.35), { m: 'e_sombra', e: true, t: 4 }); for (const [x, y] of [[23, 9], [8, 22]]) p.chispa(x, y, 'e_sombra'); },
  pacto_sombra: (p: P) => { p.con(16, 18, 0, 0.9, () => M.pergaminoRollo(p)); p.con(20, 22, 0, 0.42, () => M.sello(p, { cera: 'sombra' })); p.con(10, 8, 0, 0.5, () => llama(p, { m: 'e_sombra' })); },
  decrepitud: (p: P) => { p.con(16, 16, 0, 1, () => M.relojArena(p, { arena: 'e_sombra', marco: 'ceniza' })); p.dib(trazo([10, 6, 12, 10, 10, 13], 0.3), { m: 'vidrio', t: 0, sinBorde: true }); },
  condena_osario: (p: P) => { aroDef(p, 'amatista'); M.cadena(p, 4, 25, 28, 25, { n: 8 }); p.con(16, 17, 0, 0.72, () => calavera(p, { ojos: 'e_sombra', grieta: true })); p.con(16, 7, 0, 0.5, () => corona(p, { m: 'hueso', gemas: ['amatista'] })); },
} as Record<string, Receta>);

/** Ave rapaz vista desde abajo, planeando: alas largas que se afinan, plumas abiertas en la punta, cola en abanico. */
function aveCielo(p: P, m = 'pelaje') {
  for (const s of [-1, 1]) {
    p.dib(trazo(curva(0, 0, s * 4, -6.5, s * 9, -6.5, s * 15, -1.5), 2, 0.35), { m, b: 1.4, luz: s > 0 ? -0.5 : 0.3 });
    p.dib(trazo(curva(0, 1.5, s * 5, -2.5, s * 9, -3, s * 12.5, 0.5), 1.4, 0.3), { m, b: 1, luz: -0.6 });
  }
  p.dib(fundir(1, elip(0, 1, 1.8, 4), circ(0, -3.4, 1.7)), { m, b: 1.6, luz: 0.4 });
  p.dib(poli(-1.2, 4, 1.2, 4, 2.6, 7.6, -2.6, 7.6), { m, b: 1 });
}
/** Halcón en picada: alas recogidas hacia atrás (mira abajo a la derecha). */
function halconPicada(p: P) {
  p.dib(poli(-3, -2, -14, -9, -12, -5, -4, 1), { m: 'pelaje', b: 1.5, luz: 0.4 });
  p.dib(fundir(1.4, elip(0, 0, 7, 2.6), circ(6.5, 0.3, 2.3), poli(-6, -1.2, -12, -2.5, -12, 2, -6, 1.4)), { m: 'pelaje', b: 2 });
  p.dib(poli(8.4, -0.8, 11.6, 1, 8.6, 1.8), { m: 'oro', b: 0.6 });
  p.dib(poli(-2, 1, -13, 5, -11, 8, -3, 2.6), { m: 'pelaje', b: 1.5, luz: -0.7 });
  p.dib(elip(-1, 0.8, 4.5, 1), { m: 'hueso', b: 1, luz: 0.4 });
  p.punto(7, -0.6, 'e_sangre', 5, true);
}
function grulla(p: P) {
  p.dib(fundir(1.2, elip(-1, 3, 6, 3.6), trazo(curva(3, 1, 7, -4, 4, -10, 7, -12), 1.1, 0.8), circ(7, -12, 1.6)), { m: 'hueso', b: 2 });
  p.dib(poli(8, -12.6, 13, -11.5, 8.4, -11.2), { m: 'oro', b: 0.5 }); p.punto(7, -13, 'tela', 5);
  p.dib(caja(7, -13.6, 2, 1, 0.4), { m: 'tela', t: 3 });
  for (const s of [-1, 1]) p.dib(poli(-1, 1, s * 4 - 4, -8, s * 6 - 6, -14, s * 3 - 1, -12, 3, -1), { m: 'hueso', b: 1.6, luz: s > 0 ? -0.7 : 0.2 });
  p.dib(poli(-6, 2, -12, 4, -7, 6), { m: 'sombra', t: 1 });
  p.dib(trazo([-1, 6, -2, 14], 0.4), { m: 'hierro', b: 0.4 }); p.dib(trazo([1, 6, 3, 13], 0.4), { m: 'hierro', b: 0.4 });
}
function cairn(p: P) {
  for (const [y, w, h] of [[10, 16, 5], [4.6, 13, 4.6], [-0.4, 10, 4.2], [-5, 7.5, 3.8], [-9.2, 5, 3.2]] as [number, number, number][]) p.dib(elip(0, y, w / 2, h / 2), { m: 'piedra', b: 2.2 });
  p.dib(trazo([-2, 4, 0, 6, 2, 4], 0.35), { m: 'e_luz', e: true, t: 4 });
}
function huellaMano(p: P, m: string) {
  p.dib(fundir(0.5, caja(0, 2, 7, 7, 2.5), trazo([-2.6, -1, -3.2, -7], 1, 0.9), trazo([-0.8, -1.5, -0.8, -8.5], 1, 0.9), trazo([1, -1.5, 1.3, -8], 1, 0.9), trazo([2.7, -1, 3.4, -6], 1, 0.9), trazo([3, 3, 6, 0], 1, 0.9)), { m, e: true, b: 2, brillo: 1 });
}
function enso(p: P, m: string) { p.dib(trazo(arcoPts(0, 0, 10, -PI * 0.35, PI * 1.45, 24), 2.2, 0.6), { m, e: true, b: 1.4, brillo: 0.9 }); }

Object.assign(RECETAS, {
  // ================================================================== MONJE
  puno_rayo: (p: P) => { p.con(16, 17, 0, 1, () => puno(p)); chispazo(p, 4, 6, 10, 14, { r: 0.6 }); chispazo(p, 28, 5, 22, 13, { r: 0.6 }); chispazo(p, 27, 26, 22, 21, { r: 0.5 }); p.brillo(16, 14, 10, 0.8); },
  nudillos_hierro: (p: P) => { p.con(16, 17, 0, 1, () => puno(p, { nudillos: 'hierro' })); p.dib(trazo([8, 10.5, 24, 10.5], 0.5), { m: 'hierro', b: 0.5 }); for (const [x, y] of [[6, 5], [26, 6]]) p.chispa(x, y, 'e_luz'); },
  rafaga_golpes: (p: P) => { for (const [x, y, k] of [[9, 10, 0.5], [14, 16, 0.58], [19, 22, 0.66]] as [number, number, number][]) p.con(x, y, PI / 2, k, () => puno(p)); M.lineasVelocidad(p, { m: 'e_fisico', n: 3, x0: 1, y0: 19, y1: 28 }); p.con(27, 22, 0, 0.36, () => estallido(p, { m: 'e_fisico', n: 6, r0: 2, r1: 7 })); },
  codo_piedra: (p: P) => { p.con(23, 9, 0, 0.75, () => estallido(p, { m: 'e_fisico', n: 7, r0: 2, r1: 7 })); p.dib(trazo([4, 26, 19, 13, 8, 6], 3, 2.4), { m: 'piel', b: 2.5 }); p.dib(circ(19, 13, 3.4), { m: 'piedra', b: 2.4 }); p.dib(caja(9, 7.5, 4, 3, 1), { m: 'tela', b: 1 }); },
  palma_dragon: (p: P) => { p.con(20, 14, -0.4, 1, () => { p.dib(fundir(2, trazo(curva(-12, 6, -2, 0, 4, -8, 12, -10), 4.5, 1), circ(-6, 4, 5)), { m: 'e_fuego', e: true, b: 3, brillo: 1.4 }); }); p.con(11, 20, -0.6, 0.72, () => mano(p)); for (const [x, y] of [[26, 22], [29, 15]]) p.chispa(x, y, 'e_fuego'); },
  arte_remate: (p: P) => { for (const [x, y, k] of [[6, 24, 0.24], [11, 17, 0.32], [20, 11, 0.6]] as [number, number, number][]) p.con(x, y, 0, k, () => estallido(p, { m: x > 15 ? 'e_luz' : 'e_fisico', n: 8, r0: 4, r1: 13 })); p.con(20, 11, 0, 0.32, () => puno(p)); },
  puno_eco: (p: P) => { for (let i = 0; i < 2; i++) p.dib(hueco(circ(16, 15, 9 + i * 4), 1.1 - i * 0.3), { m: 'e_rayo', e: true, b: 0.8, brillo: 0.8 }); p.con(16, 16, 0, 0.72, () => puno(p)); },
  rodilla_volcan: (p: P) => { p.con(22, 11, 0, 0.82, () => estallido(p, { m: 'e_fuego', n: 9, r0: 3, r1: 10 })); p.dib(trazo([6, 27, 10, 18, 19, 13], 3, 2.6), { m: 'tela', b: 2.5 }); p.dib(trazo([19, 13, 12, 22, 13, 28], 2.4, 1.8), { m: 'tela', b: 2, luz: -0.4 }); p.dib(circ(19, 13, 3), { m: 'piel', b: 2.5 }); },
  patada_voladora: (p: P) => { M.lineasVelocidad(p, { m: 'e_fisico', n: 4, x0: 1, x1: 2, y0: 8, y1: 20 }); p.con(15, 16, 0, 1, () => figura(p, POSE({ cab: [-6, -8], cue: [-4, -6], cad: [2, 0], ci: [-8, -3], mi: [-11, 0], cd: [-1, -9], md: [3, -11], ri: [5, 4], pi: [0, 7], rd: [8, 0], pd: [13, 1] }), { m: 'tela', b: 1.4 })); p.con(28, 17, 0, 0.42, () => estallido(p, { m: 'e_fisico', n: 6, r0: 1.5, r1: 6 })); },
  puno_dios: (p: P) => { aroDef(p, 'zafiro'); p.con(16, 16, 0, 1, () => { for (let i = 0; i < 3; i++) p.dib(hueco(circ(0, 0, 6 + i * 3), 0.7), { m: 'e_rayo', e: true, b: 0.5, brillo: 0.6 }); }); p.con(16, 16, 0, 0.82, () => puno(p, { m: 'oro', nudillos: 'oro' })); for (const [x, y] of [[9, 12], [13, 12], [17, 12]]) p.dib(circ(x + 2, y - 0.5, 0.9), { m: 'zafiro', b: 0.9 }); },
  puno_vendaval: (p: P) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_viento', r: 13, brazos: 3, vueltas: 0.5, grosor: 1.3 })); p.con(17, 16, -PI / 2, 0.68, () => puno(p, { m: 'hielo', nudillos: 'hielo' })); },
  pies_pluma: (p: P) => { p.con(19, 13, 0.7, 0.85, () => M.pluma(p, { m: 'hueso' })); p.dib(fundir(1, caja(12, 22, 6, 9, 2), elip(15, 26, 6.5, 2.6)), { m: 'piel', b: 2 }); p.dib(caja(12, 18, 7, 2.4, 0.8), { m: 'tela', b: 1 }); },
  paso_viento: (p: P) => { for (let i = 0; i < 4; i++) p.dib(trazo(curva(2, 7 + i * 4.5, 14, 4 + i * 4.5, 29, 9 + i * 4), 0.2, 0.9 - i * 0.12), { m: 'e_viento', e: true, b: 0.8, brillo: 0.5 }); for (const [x, y, a] of [[9, 24, 1.2], [17, 19, 1.2], [25, 24, 1.2]] as [number, number, number][]) p.con(x, y, a, 0.85, () => p.dib(fundir(0.6, elip(0, 0, 1.8, 3.2), elip(0, -4.2, 1.5, 1.3), circ(-1.6, -6.4, 0.6), circ(0, -6.8, 0.6), circ(1.5, -6.3, 0.6)), { m: 'e_frio', e: true, b: 1, brillo: 0.8 })); },
  ola_escarcha: (p: P) => { for (let i = -1; i <= 1; i++) p.con(16 + i * 2, 20, i * 0.45, 1, () => p.dib(resta(circ(0, -5, 8.5), circ(0, -1.5, 8.5)), { m: 'e_frio', e: true, b: 1.6, brillo: 1.2 })); for (const [x, y] of [[7, 8], [25, 8]]) p.chispa(x, y, 'e_frio'); },
  cortina_viento: (p: P) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_viento', r: 13, brazos: 4, vueltas: 0.35, grosor: 1.7 })); p.con(16, 17, 0, 0.75, () => figura(p, POSE({ ci: [-3, -4], mi: [-3, 2], cd: [3, -4], md: [3, 2] }), { m: 'tela', b: 1.2 })); },
  aliento_montana: (p: P) => { p.con(16, 19, 0, 1, () => M.montana(p)); p.con(16, 7, 0, 0.62, () => nube(p, { m: 'vidrio' })); },
  ciclon: (p: P) => { p.con(16, 16, 0, 1, () => M.tornado(p, { m: 'e_frio', e: true })); for (const [x, y] of [[6, 8], [26, 12], [8, 24]]) p.chispa(x, y, 'e_frio'); },
  navaja_viento: (p: P) => { p.con(16, 16, -0.35, 1, () => { p.dib(resta(elip(0, 0, 14, 7), elip(-2.5, 1.5, 13, 6.5)), { m: 'e_frio', e: true, b: 1.4, brillo: 1.3 }); }); M.lineasVelocidad(p, { m: 'e_viento', n: 3, x0: 1, y0: 19, y1: 27 }); },
  mil_palmas: (p: P) => { for (const [x, y, a, k] of [[16, 16, 0, 0.8], [7, 9, -0.7, 0.42], [25, 9, 0.7, 0.42], [7, 23, -2.2, 0.42], [25, 23, 2.2, 0.42]] as [number, number, number, number][]) p.con(x, y, a, k, () => huellaMano(p, 'e_luz')); },
  ojo_tifon: (p: P) => { aroDef(p, 'zafiro'); p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_frio', r: 11.5, brazos: 4, vueltas: 0.75, grosor: 1.6 })); p.dib(circ(16, 16, 3), { m: 'sombra', t: 0 }); p.dib(hueco(circ(16, 16, 3), 0.7), { m: 'oro', b: 0.6 }); },
  mente_serena: (p: P) => { p.con(16, 16, 0, 1, () => enso(p, 'e_luz')); p.con(16, 16, 0, 0.36, () => gota(p, { m: 'e_frio', e: true, b: 4, brillo: 1.4 } as any)); },
  palma_serena: (p: P) => { p.brillo(16, 16, 12, 1.4); p.con(16, 17, 0, 0.95, () => mano(p)); p.dib(union(caja(16, 18, 2.2, 6, 0.5), caja(16, 18, 6, 2.2, 0.5)), { m: 'e_veneno', e: true, b: 1.1, brillo: 1.2 }); },
  vientre_hierro: (p: P) => { p.dib(caja(16, 16, 26, 11, 2), { m: 'cuero', b: 2 }); p.dib(caja(16, 16, 11, 9, 1.5), { m: 'hierro', b: 1.6 }); p.dib(hueco(caja(16, 16, 7, 5, 1), 0.8), { m: 'oro', b: 0.6 }); for (const x of [6, 26]) p.dib(circ(x, 16, 1.4), { m: 'oro', b: 1.4 }); },
  mantra_piedra: (p: P) => { p.brillo(16, 18, 10, 0.8); p.con(16, 17, 0, 1, () => cairn(p)); },
  grulla: (p: P) => { p.con(16, 16, 0, 1, () => grulla(p)); },
  lanza_espiritu: (p: P) => { p.dib(trazo([4, 28, 18, 14], 0.3, 2), { m: 'e_alma', e: true, b: 1.6, brillo: 0.8 }); p.con(17, 15, PI * 0.25, 1, () => lanza(p, { punta: 'e_luz', asta: 'oro', emis: true })); },
  tercer_ojo: (p: P) => { p.dib(corte(circ(16, 30, 15), caja(16, 26, 32, 20)), { m: 'piel', b: 4, trama: true }); for (const s of [-1, 1]) { p.dib(trazo(arcoPts(16 + s * 5.5, 24, 2.6, PI * 0.15, PI * 0.85, 6), 0.45), { m: 'sombra', t: 0 }); p.dib(trazo([16 + s * 3, 20.5, 16 + s * 8.5, 19.6], 0.55), { m: 'pelaje', t: 1 }); } p.con(16, 10, 0, 1, () => sol(p, { r: 3, rayos: 12, largo: 8.5 })); p.con(16, 10.5, PI / 2, 0.42, () => ojo(p, { iris: 'e_luz', brillo: true })); },
  campana_interior: (p: P) => { for (const x of [5, 27]) p.dib(trazo([x, 5, x, 29], 1.1), { m: 'madera', b: 1 }); p.dib(caja(16, 5, 28, 2.6, 1), { m: 'madera', b: 1 }); for (const x of [12, 20]) p.dib(trazo([x, 6, 16 + (x - 16) * 0.4, 9], 0.35), 'cuero'); p.con(16, 18, 0, 1, () => { p.dib(circ(0, 0, 9), { m: 'bronce', b: 4, trama: true }); for (const r of [3, 6.4]) p.dib(hueco(circ(0, 0, r), 0.5), { m: 'bronce', t: 2, sinBorde: true, sinSombra: true }); p.dib(circ(0, 0, 2), { m: 'e_luz', e: true, b: 2, brillo: 1.4 }); }); for (const s of [-1, 1]) p.con(16 + s * 10, 18, s > 0 ? 0 : PI, 1, () => onda(p, { m: 'e_luz', n: 2, r0: 1.2, paso: 2.4, a0: -0.6, a1: 0.6, g: 0.6 })); },
  loto_dorado: (p: P) => { p.con(16, 16, 0, 1, () => M.loto(p)); },
  ascenso_espiritu: (p: P) => { aroDef(p, 'zafiro'); for (const s of [-1, 1]) p.con(16 + s * 6, 13, s > 0 ? 0 : 0, 0.7, () => s > 0 ? M.ala(p, { emis: true }) : p.espejo(0, () => M.ala(p, { emis: true }))); p.con(16, 16, 0, 0.7, () => figura(p, POSE({ ci: [-4, -9], mi: [-5, -14], cd: [4, -9], md: [5, -14] }), { m: 'e_luz', e: true, b: 1.5 })); p.con(16, 5, 0, 1, () => M.halo(p, { r: 3.6, g: 0.9 })); },

  // ================================================================== DRUIDA
  invocar_lobo: (p: P) => { p.con(22, 8, 0, 0.5, () => M.luna(p, { m: 'e_luz' })); p.con(14, 18, -0.35, 0.9, () => lobosAullido(p)); },
  forma_lobo: (p: P) => { p.con(16, 16, 0, 1.05, () => M.cabezaLobo(p, { boca: true, ojos: 'e_luz' })); },
  cuervos: (p: P) => { for (const [x, y, k, a] of [[11, 10, 0.55, -0.2], [22, 15, 0.6, 0.1], [12, 23, 0.6, -0.1]] as [number, number, number, number][]) p.con(x, y, a, k, () => M.cuervo(p)); },
  mordida_rabiosa: (p: P) => { p.con(15, 16, 0, 1, () => fauces(p)); },
  corazon_salvaje: (p: P) => { p.con(16, 16, 0, 1, () => corazon(p, { m: 'hoja', b: 4, trama: true })); p.con(16, 17, 0, 0.45, () => M.huellaGarra(p, 'pelaje')); },
  forma_oso: (p: P) => { p.con(16, 17, 0, 1, () => M.cabezaOso(p, { ojos: 'e_luz' })); },
  oso_espiritu: (p: P) => { p.con(16, 17, 0, 1, () => osoErguido(p, 'e_alma')); },
  zarpazo_oso: (p: P) => { p.con(19, 15, 0.15, 1, () => M.tajos(p, { m: 'e_fisico', n: 4, largo: 12, g: 1.3 })); p.con(12, 19, -0.4, 0.62, () => zarpa(p)); },
  frenesi_luna: (p: P) => { p.con(16, 16, 0, 1.2, () => M.luna(p, { m: 'e_luz' })); p.con(17, 16, 0.2, 0.85, () => M.tajos(p, { m: 'e_sangre', n: 4, largo: 11, g: 1.3 })); },
  rugido_primigenio: (p: P) => { aroDef(p, 'esmeralda'); p.con(16, 16, 0, 1, () => onda(p, { m: 'e_fisico', n: 2, r0: 10, paso: 2.5, a0: 0, a1: PI * 2 })); p.con(16, 17, 0, 0.8, () => M.cabezaOso(p, { ojos: 'e_fuego', rugido: true })); p.con(16, 6, 0, 0.32, () => corona(p, { gemas: ['esmeralda'] })); },
  rafaga_artica: (p: P) => { p.dib(poli(4, 16, 28, 4, 30, 28), { m: 'e_frio', e: true, b: 6, brillo: 1, luz: -1.4 }); for (const [x, y, k] of [[16, 15, 0.28], [24, 9, 0.22], [24, 22, 0.24], [10, 16, 0.18]] as [number, number, number][]) p.con(x, y, 0, k, () => copo(p, { m: 'hielo' })); p.con(5, 16, 0, 1, () => remolino(p, { m: 'e_viento', r: 4, brazos: 2, vueltas: 0.8, grosor: 0.9 })); },
  relampago_canada: (p: P) => { p.con(10, 19, 0, 0.75, () => pino(p)); p.con(23, 21, 0, 0.62, () => pino(p)); chispazo(p, 19, 2, 11, 13, { r: 1.1, quiebre: 2 }); chispazo(p, 11, 13, 22, 17, { r: 0.7 }); },
  ojo_nube: (p: P) => { p.con(16, 16, 0, 1.05, () => nube(p, { oscura: true })); p.con(16, 16.5, 0, 0.5, () => ojo(p, { iris: 'e_frio', brillo: true })); },
  granizada: (p: P) => { p.con(16, 9, 0, 0.9, () => nube(p, { oscura: true })); for (const [x, y] of [[9, 19], [15, 23], [21, 19], [12, 27], [24, 26]]) { p.dib(trazo([x - 1.5, y - 4, x, y], 0.2, 0.5), { m: 'e_frio', e: true, t: 2 }); p.dib(circ(x, y, 1.6), { m: 'hielo', b: 1.6, luz: 0.5 }); } },
  fisura: (p: P) => { p.con(16, 15, 0, 1, () => { p.dib(poli(-15, 4, -15, 15, 15, 15, 15, 2, 6, 6, -6, 4), { m: 'tierra', b: 1.6 }); p.dib(poli(-12, 9, -6, 6, -1, 9, 4, 5.5, 10, 7, 4, 10, -1, 12, -6, 10), { m: 'e_fuego', e: true, b: 1.4, brillo: 1.4 }); }); for (const [x, k] of [[11, 0.5], [18, 0.62]] as [number, number][]) p.con(x, 14, 0, k, () => llama(p)); },
  hijo_vendaval: (p: P) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_viento', r: 12.5, brazos: 2, vueltas: 0.7, grosor: 1.3 })); for (const [x, y, a] of [[21, 10, 0.8], [10, 21, -2]] as [number, number, number][]) p.con(x, y, a, 0.42, () => M.hoja(p)); },
  tornado: (p: P) => { p.con(16, 16, 0, 1, () => M.tornado(p, { m: 'tierra' })); for (const [x, y] of [[7, 22], [25, 13], [24, 25]]) p.dib(caja(x, y, 1.6, 1.6, 0.3), { m: 'piedra', b: 0.8 }); },
  trueno_valle: (p: P) => { p.dib(poli(1, 28, 1, 22, 8, 17, 14, 22, 20, 16, 31, 24, 31, 28), { m: 'hoja', b: 1.6, luz: -0.6 }); for (const [x0, x1] of [[10, 8], [20, 20], [27, 26]]) chispazo(p, x0, 3, x1, 20, { r: 0.8, quiebre: 1.6 }); },
  huracan: (p: P) => { p.con(16, 16, 0, 1, () => remolino(p, { m: 'e_viento', r: 12.5, brazos: 3, vueltas: 0.45, grosor: 1.5 })); for (let i = 0; i < 5; i++) { const a = (i / 5) * PI * 2; p.con(16 + Math.cos(a) * 8, 16 + Math.sin(a) * 8, a + PI / 2, 0.3, () => cristal(p)); } p.dib(circ(16, 16, 2.4), { m: 'e_frio', e: true, b: 2.4, luz: 1 }); },
  ira_estacion: (p: P) => { aroDef(p, 'rubi'); p.dib(poli(5, 27, 12, 18, 16, 21, 20, 17, 27, 27), { m: 'piedra', b: 1.6 }); p.dib(poli(14, 19, 16, 21, 18, 18.5, 16, 23), { m: 'e_fuego', e: true, b: 1 }); for (const [x, y] of [[11, 8], [21, 6], [23, 13]]) { p.dib(trazo([x + 5, y - 5, x, y], 0.3, 2), { m: 'e_fuego', e: true, b: 1.5, brillo: 1 }); p.dib(circ(x, y, 1.9), { m: 'lava', b: 1.9 }); } },
  enredadera: (p: P) => { p.con(16, 16, 0, 1.05, () => M.enredadera(p)); },
  savia_vieja: (p: P) => { p.con(16, 16, 0, 1, () => { p.dib(circ(0, 0, 12), { m: 'corteza', b: 2 }); p.dib(circ(0, 0, 10), { m: 'madera', b: 10, luz: 0.8, trama: true }); for (const r of [2.5, 4.8, 7.2, 9]) p.dib(hueco(circ(0.4, 0.3, r), 0.35), { m: 'madera', t: 2, sinBorde: true, sinSombra: true }); p.dib(trazo([4, -9, 6, -2, 3, 3], 0.3), { m: 'madera', t: 1, sinBorde: true }); }); p.con(16, 16, 0, 0.36, () => corazon(p, { m: 'e_veneno', e: true, b: 3, brillo: 1.5 })); p.dib(fundir(0.5, circ(25, 27, 1.5), poli(24.2, 27, 25, 24, 25.8, 27)), { m: 'e_oro', e: true, b: 1.4 }); },
  zarzas: (p: P) => { p.dib(trazo([4, 27, 13, 18], 0.2, 1.6), { m: 'e_veneno', e: true, b: 1, brillo: 0.6 }); p.con(18, 14, 0.3, 0.75, () => M.espinas(p, { m: 'corteza', n: 9 })); p.con(18, 14, 0.62, 0.5, () => M.espinas(p, { m: 'musgo', n: 7 })); for (const [x, y] of [[12, 9], [25, 21]]) p.dib(circ(x, y, 1.1), { m: 'e_veneno', e: true, b: 1 }); },
  piel_corteza: (p: P) => { p.con(16, 16, 0, 1, () => coraza(p, 'corteza')); for (const [x, y, a] of [[8, 9, -0.5], [24, 9, 0.5], [16, 24, 0]] as [number, number, number][]) p.con(x, y, a, 0.6, () => p.dib(poli(-1, 0, 0, -4.5, 1, 0), { m: 'hueso', b: 0.6 })); for (let i = 0; i < 3; i++) p.dib(trazo([11 + i * 4, 10, 10 + i * 4.5, 24], 0.3), { m: 'corteza', t: 1, sinBorde: true, sinSombra: true }); },
  lanzas_raiz: (p: P) => { p.dib(hueco(elip(16, 22, 12.5, 4), 0.8), { m: 'e_veneno', e: true, b: 0.6, brillo: 0.6 }); for (const [x, y, h, c] of [[6, 22, 10, -2], [11, 25, 13, 1.5], [16, 26, 17, -1], [21, 25, 13, 1.5], [26, 22, 10, 2], [11, 19, 7, -1], [21, 19, 7, 1]] as [number, number, number, number][]) p.dib(trazo(curva(x, y, x + c, y - h * 0.5, x - c * 0.3, y - h), 2, 0.2), { m: 'corteza', b: 1.4 }); },
  abrazo_bosque: (p: P) => { p.con(16, 16, 0, 0.62, () => M.orbe(p, { m: 'e_veneno', r: 9 })); for (const s of [-1, 1]) p.dib(trazo(curva(16 + s * 2, 30, 16 + s * 16, 20, 16 + s * 12, 4, 16 - s * 1, 3), 1.6, 0.5), { m: 'corteza', b: 1.2 }); for (const [x, y, a] of [[6, 13, -0.7], [26, 13, 0.7], [11, 4, -1.5], [21, 4, 1.5]] as [number, number, number][]) p.con(x, y, a, 0.3, () => M.hoja(p)); },
  corro_hongos: (p: P) => { p.dib(hueco(elip(16, 22, 12, 4.4), 0.7), { m: 'e_veneno', e: true, b: 0.6, brillo: 0.8 }); for (const [x, y, k] of [[6, 21, 0.45], [26, 21, 0.45], [11, 25, 0.55], [21, 25, 0.55], [16, 17, 0.62], [9, 17, 0.38], [23, 17, 0.38]] as [number, number, number][]) p.con(x, y, 0, k, () => M.hongo(p)); M.burbujas(p, { n: 4, x: 16, y: 10, r: 14 }); },
  roble_sabio: (p: P) => { auraSuelo(p, 'e_luz'); p.con(16, 14, 0, 0.92, () => M.arbol(p, { copa: 'hoja', cara: true, ojos: 'e_luz' })); },
  raiz_madre: (p: P) => { p.dib(corte(elip(16, 30, 16, 17), caja(16, 22, 32, 18)), { m: 'tierra', b: 2, luz: -1, trama: true }); p.con(16, 21, 0, 0.75, () => M.raiz(p, { n: 4 })); p.con(16, 9, 0, 0.36, () => M.hoja(p)); p.dib(trazo([16, 13, 16, 11], 0.5), 'corteza'); M.burbujas(p, { n: 5, x: 16, y: 28, r: 16 }); },
  despertar_bosque: (p: P) => { aroDef(p, 'esmeralda'); p.con(16, 16, 0, 0.9, () => { p.dib(union(circ(-6, -9, 5), circ(6, -9, 5), circ(0, -12, 5.5)), { m: 'hoja', b: 3, trama: true }); p.dib(fundir(1.5, caja(0, 0, 9, 12, 2), trazo([-3, 5, -5, 13], 2), trazo([3, 5, 5, 13], 2), trazo([-4, -3, -10, 2, -12, -4], 1.5, 0.8), trazo([4, -3, 10, 2, 12, -4], 1.5, 0.8)), { m: 'corteza', b: 2 }); for (const s of [-1, 1]) p.dib(elip(s * 2, -2, 1, 0.8), { m: 'e_veneno', e: true, b: 1, brillo: 1.4 }); p.dib(elip(0, 2, 1.5, 1.2), { m: 'sombra', t: 0 }); }); p.con(16, 3.8, 0, 0.3, () => corona(p, { gemas: ['esmeralda'] })); },
  virote_perforante: (p: P) => { for (const x of [11, 19]) p.dib(caja(x, 16, 3, 18, 0.6), { m: 'madera', b: 1, luz: -0.3 }); p.con(16, 16, PI / 2, 1, () => virote(p)); for (const x of [11, 19]) p.dib(caja(x, 16, 3, 3.2, 0), { m: 'madera', b: 1 }); },
  ojo_ballestero: (p: P) => { p.con(16, 16, 0, 1, () => ojo(p, { iris: 'esmeralda' })); for (let i = 0; i < 4; i++) { const a = (i * PI) / 2; p.dib(trazo([16 + Math.cos(a) * 9, 16 + Math.sin(a) * 9, 16 + Math.cos(a) * 14, 16 + Math.sin(a) * 14], 0.6), { m: 'e_fisico', e: true, b: 0.6 }); } },
  rafaga_virotes: (p: P) => { for (const a of [-0.45, 0, 0.45]) p.con(16 + a * 12, 22, a, 0.82, () => virote(p)); },
  virote_lastre: (p: P) => { p.con(15, 16, PI / 2, 1, () => { p.dib(trazo([0, -6, 0, 10], 1.2), 'madera'); p.dib(fundir(0.6, caja(0, -9, 6, 6, 1.4), poli(-3, -12, 3, -12, 0, -14)), { m: 'hierro', b: 2 }); for (const s of [-1, 1]) p.dib(poli(s * 0.6, 6, s * 3, 8.5, s * 3, 11, s * 0.6, 10), { m: 'cuero', b: 0.8 }); }); for (let i = 0; i < 2; i++) p.dib(trazo(arcoPts(27 + i * 2, 16, 6, -PI * 0.4, PI * 0.4, 8), 0.5), { m: 'e_fisico', e: true, b: 0.5 }); },
  virote_escarcha: (p: P) => { p.con(15, 17, PI * 0.25, 1, () => virote(p)); p.con(23, 9, 0, 0.42, () => frasco(p, { liquido: 'e_frio' })); for (const [x, y] of [[26, 15], [17, 6]]) p.chispa(x, y, 'e_frio'); },
  resorte_templado: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => M.resorte(p)); p.con(23, 23, 0, 0.42, () => M.engranaje(p)); },
  virote_explosivo: (p: P) => { p.con(22, 10, 0, 0.75, () => estallido(p, { m: 'e_fuego', n: 8, r0: 3, r1: 10 })); p.con(13, 19, PI * 0.25, 0.92, () => virote(p)); p.con(20, 12, PI * 0.25, 0.32, () => M.bomba(p, { mecha: false })); },
  virote_tormenta: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => virote(p, { punta: 'cobre', asta: 'cobre' })); chispazo(p, 9, 14, 15, 9, { r: 0.5 }); chispazo(p, 17, 23, 23, 17, { r: 0.5 }); ESTRUENDO(p, 24, 8); },
  tormenta_virotes: (p: P) => { for (let i = -3; i <= 3; i++) p.con(16 + i * 3.4, 25, i * 0.32, 0.62, () => virote(p)); },
  virote_dragon: (p: P) => { aroDef(p, 'rubi'); p.dib(trazo([5, 27, 17, 15], 0.4, 3.6), { m: 'e_fuego', e: true, b: 2.5, brillo: 1.4 }); p.con(16, 16, PI * 0.25, 1.05, () => { virote(p, { punta: 'oro', asta: 'madera', aleta: 'tela' }); p.dib(circ(0, -4, 1.8), { m: 'e_fuego', e: true, b: 1.8, brillo: 1.6 }); }); },
  bomba_ignea: (p: P) => { p.con(15, 17, 0, 1, () => frasco(p, { liquido: 'e_fuego' })); p.dib(trazo(curva(15, 7, 19, 4, 22, 5), 0.5), 'cuero'); p.chispa(23, 5, 'e_fuego', true); p.brillo(23, 5, 4, 0.8); },
  bandolera: (p: P) => { p.dib(trazo([3, 5, 29, 27], 2.4), { m: 'cuero', b: 1.4 }); for (const [x, y, l] of [[9, 10, 'e_fuego'], [16, 16, 'e_frio'], [23, 22, 'e_veneno']] as [number, number, string][]) p.con(x, y + 2, 0.7, 0.36, () => frasco(p, { liquido: l, alto: true })); },
  frasco_helado: (p: P) => { p.con(16, 17, 0, 1, () => frasco(p, { liquido: 'e_frio' })); for (const [x, y, a] of [[7, 9, -0.6], [25, 9, 0.6]] as [number, number, number][]) p.con(x, y, a, 0.3, () => cristal(p)); },
  destilar: (p: P) => { p.con(11, 20, 0, 0.75, () => frasco(p, { liquido: 'e_fuego' })); p.dib(trazo(curva(11, 12, 14, 4, 24, 5, 25, 14), 0.8), { m: 'vidrio', b: 0.8 }); p.con(24, 21, 0, 0.55, () => frasco(p, { liquido: 'e_veneno', alto: true })); for (const y of [16, 19]) p.dib(circ(25, y, 0.7), { m: 'e_veneno', e: true, b: 0.7 }); },
  torreta: (p: P) => { for (const [x0, x1] of [[16, 8], [16, 24], [16, 16]]) p.dib(trazo([x0, 17, x1, 28], 0.9), { m: 'madera', b: 0.9 }); p.con(16, 13, PI / 2, 0.8, () => M.ballesta(p)); p.con(16, 17, 0, 0.32, () => M.engranaje(p)); },
  frasco_rayo: (p: P) => { p.con(16, 17, 0, 1, () => frasco(p, { liquido: 'e_rayo', alto: true })); chispazo(p, 5, 6, 10, 15, { r: 0.6 }); chispazo(p, 27, 7, 22, 15, { r: 0.6 }); chispazo(p, 13, 15, 19, 22, { r: 0.4, m: 'hueso' }); },
  bomba_humo: (p: P) => { p.con(16, 12, 0, 1, () => { for (const [x, y, r] of [[-7, 2, 6], [0, -3, 7.5], [7, 1, 6], [3, 6, 5], [-4, 6, 4.6]] as [number, number, number][]) p.dib(circ(x, y, r), { m: 'humo', b: 3.4, trama: true }); }); p.con(16, 22, 0, 0.55, () => M.bomba(p)); },
  polvora_negra: (p: P) => { p.con(16, 17, 0, 1, () => M.barril(p)); p.dib(caja(16, 9, 6, 6, 1), { m: 'pergamino', b: 1 }); p.con(16, 9, 0, 0.22, () => calavera(p)); for (const [x, y] of [[24, 25], [27, 21]]) p.dib(circ(x, y, 1), { m: 'ceniza', t: 2 }); },
  bomba_cluster: (p: P) => { p.con(16, 14, 0, 0.75, () => M.bomba(p)); for (const [x, y] of [[7, 24], [16, 27], [25, 24]]) p.con(x, y, 0, 0.3, () => M.bomba(p, { mecha: false })); },
  gran_crisol: (p: P) => { aroDef(p, 'rubi'); p.con(16, 17, 0, 0.82, () => M.caldero(p, { m: 'hierro', liquido: 'e_fuego' })); p.dib(hueco(elip(16, 13.5, 9, 2), 0.8), { m: 'oro', b: 0.6 }); M.burbujas(p, { m: 'e_fuego', n: 4, x: 16, y: 10, r: 10 }); },
  nube_toxica: (p: P) => { p.con(16, 14, 0, 1, () => nube(p, { m: 'musgo' })); p.con(16, 16, 0, 0.35, () => calavera(p, { hueso: 'esmeralda' })); M.burbujas(p, { n: 4, x: 16, y: 28, r: 14 }); },
  sangre_amarga: (p: P) => { p.con(16, 16, 0, 1, () => gota(p, { m: 'sangre', b: 5, trama: true })); p.dib(corte(fundir(2, circ(16, 20, 7.5), poli(12, 16, 16, 3.5, 20, 16)), caja(22, 16, 12, 30)), { m: 'e_veneno', e: true, b: 4, brillo: 1.2 }); },
  virote_veneno: (p: P) => { p.con(16, 16, PI * 0.25, 1, () => virote(p, { punta: 'esmeralda' })); for (const [x, y] of [[23, 13], [25, 17]]) p.dib(fundir(0.5, circ(x, y, 1.2), poli(x - 0.7, y, x, y - 2.4, x + 0.7, y)), { m: 'e_veneno', e: true, b: 1.2 }); M.burbujas(p, { n: 3, x: 9, y: 24, r: 8 }); },
  elixir: (p: P) => { p.con(16, 16, 0, 1, () => frasco(p, { liquido: 'sangre', alto: true })); p.con(16, 18, 0, 0.32, () => M.huellaGarra(p, 'hueso')); },
  frasco_peste: (p: P) => { p.con(16, 17, 0, 1, () => frasco(p, { liquido: 'e_veneno' })); p.con(16, 20, 0, 0.3, () => calavera(p)); for (const [x, y] of [[7, 8], [25, 7], [27, 15]]) M.mosca(p, x, y); },
  transmutar: (p: P) => { p.con(16, 16, 0, 1, () => M.anilloRunas(p, { m: 'e_oro', r: 12.5, n: 6 })); p.dib(poli(16, 6, 24.5, 21, 7.5, 21), { m: 'e_oro', e: true, b: 0.5, brillo: 0.6, t: 3 }); p.dib(poli(16, 9, 22, 19.5, 10, 19.5), { m: 'sombra', t: 0, sinBorde: true }); p.con(16, 16, 0, 0.75, () => M.moneda(p)); },
  miasma: (p: P) => { for (const [m, a, r] of [['e_veneno', 0, 12], ['e_sombra', PI * 0.7, 10], ['e_veneno', PI * 1.4, 8]] as [string, number, number][]) { const pts = Array.from({ length: 14 }, (_, i) => { const t = i / 13, aa = a + t * PI * 1.6; return [16 + Math.cos(aa) * r * (1 - t * 0.4), 16 + Math.sin(aa) * r * (1 - t * 0.4) * 0.8]; }).flat(); p.dib(trazo(pts, 0.4, 2.2), { m, e: true, b: 1.6, brillo: 0.9 }); } p.con(16, 16, 0, 0.32, () => calavera(p, { hueso: 'musgo' })); },
  tonico_hierro: (p: P) => { p.con(16, 16, 0, 1, () => frasco(p, { liquido: 'hierro', alto: true, vidrio: 'vidrio' })); p.con(16, 18, 0, 0.36, () => escudo(p, { campo: 'esmeralda' })); },
  lluvia_acida: (p: P) => { p.con(16, 9, 0, 0.92, () => nube(p, { m: 'musgo' })); for (let i = 0; i < 5; i++) { const x = 6 + i * 5; p.dib(trazo([x + 1.5, 16 + (i % 2) * 2, x - 1, 23 + (i % 2) * 2], 0.4, 0.6), { m: 'e_veneno', e: true, b: 0.6 }); } p.dib(caja(16, 28, 26, 2, 0.8), { m: 'e_veneno', e: true, b: 1, t: 2 }); },
  panacea_negra: (p: P) => { aroDef(p, 'esmeralda'); p.con(16, 17, 0, 0.92, () => frasco(p, { liquido: 'e_negro', vidrio: 'sombra', corcho: 'oro', alto: true })); p.con(16, 19, 0, 0.3, () => calavera(p, { ojos: 'e_veneno' })); p.dib(circ(16, 7.5, 1.4), { m: 'esmeralda', b: 1.4 }); },
} as Record<string, Receta>);

function lobosAullido(p: P) {
  // lobo sentado de perfil, el hocico al cielo (mira arriba a la derecha)
  p.dib(fundir(1.5, poli(-6, 12, -7, 2, -4, -4, 0, -8, 3, -12, 8, -15, 7, -11, 4, -6, 3, 0, 5, 6, 6, 12), poli(-2, -9, -1, -13, 1.5, -9.5)), { m: 'lobo', b: 2.5, trama: true });
  p.dib(poli(-6, 12, -12, 11, -13, 7, -8, 8), { m: 'lobo', b: 1.4, luz: -0.6 });
  p.dib(poli(2, -9, 3, -8.4, 2.4, -7.6), { m: 'e_luz', e: true, t: 5 });
  p.dib(poli(5, -11.5, 8, -15, 7.5, -12.5), { m: 'sombra', t: 1 });
}
function fauces(p: P) {
  // fauces de lobo de perfil (miran a la derecha), abiertas, con sangre
  p.dib(poli(-8, -1, 4, -2.5, 13, -3, 12, 6, 6, 3.5, -4, 2), { m: 'sombra', t: 0 });
  for (let i = 0; i < 5; i++) { const x = -2 + i * 3, big = i === 4 || i === 1, l = big ? 4.6 : 2.4; p.dib(poli(x - 1, -2.6 - i * 0.1, x + 1, -2.6 - i * 0.1, x + 0.3, -2.6 + l), { m: 'hueso', b: 0.8 }); p.dib(poli(x - 1, 2.6 + i * 0.3, x + 1, 2.6 + i * 0.3, x + 0.3, 2.6 + i * 0.3 - l * 0.8), { m: 'hueso', b: 0.8, luz: -0.4 }); }
  p.dib(poli(-14, -3, -9, -10, 1, -11.5, 9, -9, 14.5, -6.5, 13.5, -3, 4, -2.6, -6, -1.4), { m: 'lobo', b: 2.5, trama: true });
  p.dib(poli(-13, 4, -4, 2, 6, 3.8, 12.5, 6.5, 11, 10, 2, 11, -9, 10), { m: 'lobo', b: 2, luz: -0.4 });
  p.dib(poli(-14, -3, -16, 4, -13, 10, -9, 10, -13, 4), { m: 'lobo', b: 1.6, luz: -0.8 });
  p.dib(elip(13.6, -6.6, 1.5, 1.1), { m: 'sombra', t: 0 });
  p.dib(poli(-4, -7.5, 0, -8, -1.5, -6.5), { m: 'e_sangre', e: true, b: 0.6, brillo: 1.2 });
  p.dib(poli(-9, -10, -6, -15, -4, -10), { m: 'lobo', b: 1 });
  for (const [x, y] of [[8, 9.5], [4, 10.5]]) p.dib(trazo([x, y, x, y + 4], 0.7, 0.3), { m: 'e_sangre', e: true });
}
function osoErguido(p: P, m: string) {
  p.dib(fundir(2, elip(0, 0, 8, 10), circ(0, -10, 5), circ(-3.6, -14, 1.8), circ(3.6, -14, 1.8), trazo([-6, -4, -12, -10], 2.4, 1.8), trazo([6, -4, 12, -10], 2.4, 1.8), trazo([-4, 8, -5, 14], 2.6), trazo([4, 8, 5, 14], 2.6)), { m, e: true, b: 5, brillo: 1.4 });
  for (const s of [-1, 1]) p.dib(circ(s * 1.8, -10.5, 0.8), { m: 'sombra', t: 0, sinBorde: true });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.dib(poli(s * 12 - 1 + i, -11, s * 12 + i, -11, s * 12 - 0.5 + i, -13.5), { m: 'hueso', t: 5 });
}
function zarpa(p: P) {
  p.dib(fundir(1.5, elip(0, 4, 8, 7), trazo([0, 10, 0, 16], 4)), { m: 'pelaje', b: 3, trama: true });
  for (let i = -2; i <= 2; i++) { const x = i * 3.2, y = -2 - (2 - Math.abs(i)) * 1.2; p.dib(circ(x, y, 2), { m: 'pelaje', b: 2 }); p.dib(poli(x - 0.9, y - 1.4, x + 0.9, y - 1.4, x + 0.4, y - 6), { m: 'hueso', b: 0.8 }); }
  p.dib(elip(0, 5, 4.5, 3.4), { m: 'cuero', b: 2, luz: -0.5 });
}
function pino(p: P) {
  p.dib(caja(0, 11, 2.4, 6, 0.4), { m: 'corteza', b: 1 });
  for (let i = 0; i < 3; i++) p.dib(poli(0, -14 + i * 6, 7 + i * 1.6, -3 + i * 6, -7 - i * 1.6, -3 + i * 6), { m: 'hoja', b: 1.6, luz: -0.3 });
}
