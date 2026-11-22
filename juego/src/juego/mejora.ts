// ¿Es mejor que lo que llevo? (botín en evolución, 22 nov 2026). Prueba el objeto puesto en su casilla con `calcular` del
// juego y compara el daño por segundo del héroe (daño medio del arma más el elemental, por el crítico y la velocidad de
// ataque), el daño de los hechizos, la defensa, la vida y las resistencias. Solo lee: no cambia nada del héroe ni se guarda.
import { calcular, cumpleReq, type Casilla, type Calc, type DatosHeroe } from './heroe';
import { baseDe, type Objeto } from './objetos';

/** Las clases que pegan con hechizos: para ellas el arma vale por lo que le suma a los hechizos. */
const LANZAN = new Set(['arcanista', 'nigromante', 'druida']);

export interface Mejora {
  /** Casilla contra la que se compara. */
  cas: Casilla;
  /** Lo que hay puesto ahí (undefined: la casilla está vacía). */
  actual?: Objeto;
  /** Daño por segundo del golpe, cociente nuevo / puesto menos 1 (0,23 = 23 % más). */
  dps: number;
  /** Daño de hechizos: cociente nuevo / puesto menos 1. */
  hech: number;
  def: number; vida: number; res: number;
  /** 1 mejora para este héroe, -1 empeora, 0 casi igual o no se compara. */
  veredicto: 1 | -1 | 0;
  /** Cumple los requisitos para ponérselo ahora. */
  puede: boolean;
}

export function casillaDe(d: DatosHeroe, o: Objeto): Casilla | null {
  const r = baseDe(o)?.ranura; if (!r || o.tipo !== 'equipo') return null;
  if (r === 'anillo') return !d.equipo.anillo1 ? 'anillo1' : !d.equipo.anillo2 ? 'anillo2' : 'anillo1';
  return r as Casilla;
}
const dpsDe = (c: Calc) => {
  let el = 0; for (const v of Object.values(c.elem)) el += v ?? 0;
  const dur = Math.min(1, Math.max(0.25, 0.62 / (1 + c.vel_ataque / 100)));
  return (((c.dano[0] + c.dano[1]) / 2 + el) * (1 + c.critico / 100)) / dur;
};
const hechDe = (c: Calc) => (1 + (c.st.dano_hechizos ?? 0) / 100) * (1 + 0.08 * (c.mas_habilidades ?? 0)) * (1 + (c.vel_lanzar ?? 0) / 200);
const resDe = (c: Calc) => Math.max(0, c.res.fuego) + Math.max(0, c.res.frio) + Math.max(0, c.res.rayo) + Math.max(0, c.res.veneno);

/** Cuánto cambia el héroe con ese objeto puesto. null si no es equipo o no tiene casilla. */
export function cuantoMejora(d: DatosHeroe, o: Objeto): Mejora | null {
  const cas = casillaDe(d, o); const b = baseDe(o);
  if (!cas || !b) return null;
  const actual = d.equipo[cas];
  if (actual === o) return null;
  const eq = { ...d.equipo, [cas]: o };
  // un arma a dos manos saca el escudo; un escudo con un arma a dos manos puesta no se compara
  if (cas === 'arma' && b.dosManos) delete eq.izq;
  if (cas === 'izq' && d.equipo.arma && baseDe(d.equipo.arma)?.dosManos) return { cas, actual, dps: 0, hech: 0, def: 0, vida: 0, res: 0, veredicto: 0, puede: false };
  const c0 = calcular(d), c1 = calcular({ ...d, equipo: eq });
  const puede = cumpleReq(d, c0, o) && !(b.clase && b.clase !== d.clase);
  const dps = dpsDe(c1) / Math.max(1e-6, dpsDe(c0)) - 1, hech = hechDe(c1) / hechDe(c0) - 1;
  const def = c1.def - c0.def, vida = c1.vidaMax - c0.vidaMax, res = resDe(c1) - resDe(c0);
  // la nota: lo principal de la clase (golpe o hechizo) pesa entero, la defensa y la vida en proporción a lo que ya hay
  const ataque = LANZAN.has(d.clase) ? hech + dps * 0.25 : dps + hech * 0.25;
  const nota = ataque + (def / Math.max(20, c0.def)) * 0.5 + (vida / Math.max(1, c0.vidaMax)) * 1.2 + res / 400;
  const veredicto: 1 | -1 | 0 = nota > 0.03 ? 1 : nota < -0.03 ? -1 : 0;
  return { cas, actual, dps, hech, def, vida, res, veredicto, puede };
}

/** Cache por objeto mientras el héroe no cambie (equipo, nivel y atributos): las etiquetas del piso lo piden cada cuadro. */
const memo = new Map<number, { k: string; m: Mejora | null }>();
export function mejoraCacheada(d: DatosHeroe, o: Objeto): Mejora | null {
  const k = `${d.nivel}|${d.fue}|${d.des}|${d.vit}|${d.ene}|${Object.entries(d.equipo).map(([c, x]) => c + ':' + (x?.uid ?? 0) + ':' + (x?.durab ? 1 : 0)).join(',')}`;
  const e = memo.get(o.uid); if (e && e.k === k) return e.m;
  const m = cuantoMejora(d, o);
  memo.set(o.uid, { k, m }); if (memo.size > 400) memo.delete(memo.keys().next().value!);
  return m;
}
