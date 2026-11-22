// Botín: crear objetos (normales, mágicos, raros, de conjunto, únicos, legendarios), pociones, gemas, runas y oro.
import { BASES, PREFIJOS, SUFIJOS, UNICOS, CONJUNTOS, GEMAS, RUNAS, PALABRAS, NOMBRES_RAROS } from '../datos/objetos_datos';
import '../datos/talismanes';
import { LEGENDARIA_JEFE } from '../datos/legendarias';
import '../datos/reliquias';
import { afinidadDe } from '../datos/arsenal';
import type { Base, Elemento, Stat, Ranura, Afijo, Unico } from './tipos_objetos';
import { R, entero, elegir, clamp } from '../nucleo/azar';

export type Rareza = 'normal' | 'magico' | 'raro' | 'conjunto' | 'unico' | 'legendario' | 'gris';
export type TipoObj = 'equipo' | 'pocion' | 'gema' | 'runa' | 'pergamino' | 'thor';
export interface Objeto {
  uid: number;
  tipo: TipoObj;
  base: string;
  rareza: Rareza;
  nombre: [string, string];
  nivel: number;
  stats: [Stat | string, number][];
  dano?: [number, number];
  /** Piso de daño: multiplica el daño de la base cuando el arma es mucho más floja que las de su familia a su nivel. */
  kDano?: number;
  def?: number;
  durab: number; durabMax: number;
  huecos: number;
  engarces: string[];
  vivo?: Elemento;
  lore?: [string, string];
  conjunto?: string;
  /** Equipo de Thor: el tramo de la barda (1 a 5). */
  tramo?: number;
  palabra?: string;
  w: number; h: number;
  /** Pociones: 'vida' | 'mana' | 'rejuv'; tamaño 0..4. */
  pocion?: 'vida' | 'mana' | 'rejuv';
  tam?: number;
  /** Pociones apiladas en la misma casilla. Opcional: sin ella es una sola. */
  cantidad?: number;
  precio: number;
  identificado?: boolean;
  /** Aspecto propio del arma (el arma inicial se ve como la del novato). */
  vis?: any;
  /** Nivel necesario fijo (legendarias y conjuntos). Opcional: los objetos viejos no lo tienen. */
  req?: number;
  /** Efecto propio de una legendaria del arsenal (cadena, pira, tercer golpe...). */
  efecto?: string;
  /** Id de la legendaria del arsenal (para su dibujo en el piso). */
  leg?: string;
}

let uid = Date.now() % 100000;
export const nuevoUid = () => ++uid;
export const BASE_POR_ID = new Map(BASES.map((b) => [b.id, b]));
export function crearUnicoId(id: string, nivel: number): Objeto | null {
  const u = UNICOS.find((x) => x.id === id); const b = u && BASE_POR_ID.get(u.base); if (!u || !b) return null;
  return deUnico(u, b, nivel);
}
export const baseDe = (o: Objeto): Base | undefined => BASE_POR_ID.get(o.base);

const familiaDonde = (b: Base): string[] => {
  const f = b.familia, out = ['todas', f];
  if (b.ranura === 'arma') out.push('arma');
  if (b.ranura === 'torso') out.push('armadura', 'torso');
  // ropa de tela (túnicas, hábitos, vestidos, camisas): puede traer daño de hechizos
  if (b.ranura === 'torso' && ['tunica', 'vestido', 'camisa'].includes((b.visual as any)?.torso?.tipo)) out.push('tela');
  if (b.ranura === 'cabeza') out.push('casco');
  if (b.ranura === 'izq') out.push(f === 'orbe' || f === 'libro' ? f : 'escudo');
  if (b.ranura === 'manos') out.push('guantes');
  if (b.ranura === 'pies') out.push('botas');
  if (b.ranura === 'cinturon') out.push('cinturon');
  if (b.ranura === 'anillo') out.push('anillo', 'joya');
  if (b.ranura === 'amuleto') out.push('amuleto', 'joya');
  if (b.ranura === 'talisman') return ['talisman'];
  return out;
};
const rollStat = (min: number, max: number) => Math.round(min + (max - min) * R());

function aplicarBase(o: Objeto, b: Base) {
  if (b.dano) o.dano = [b.dano[0], b.dano[1]];
  // armas del arsenal: el elemento vivo y su daño elemental propio
  const x = b as any;
  if (x.vivo) o.vivo = x.vivo;
  if (x.implicito) for (const st of x.implicito) o.stats.push([st.stat, rollStat(st.min, st.max)]);
  if (b.def) o.def = rollStat(b.def[0], b.def[1]);
}

export function crearBase(b: Base, nivel: number): Objeto {
  const o: Objeto = { uid: nuevoUid(), tipo: 'equipo', base: b.id, rareza: 'normal', nombre: [...b.nombre] as [string, string], nivel, stats: [], durab: b.durab, durabMax: b.durab, huecos: 0, engarces: [], w: b.tam[0], h: b.tam[1], precio: b.precio };
  aplicarBase(o, b);
  return o;
}

function afijosPosibles(lista: Afijo[], b: Base, nivel: number) {
  const d = familiaDonde(b);
  return lista.filter((a) => a.nivel <= nivel && a.donde.some((x) => d.includes(x)));
}
/** Botín de antes (bases parejas en la ventana de 30 niveles, afijos por su peso de siempre, únicos parejos). */
const botinViejo = () => !!(globalThis as any).__botinViejo;
/**
 * Los números del botín en evolución (las pruebas los cambian con `__botin = { ... }`): cada cuántos niveles por debajo
 * del objeto una base, un grado de afijo o un único pierden la mitad de su chance, cuánto sube la tirada de un afijo que
 * cae por encima de su nivel, el piso de daño contra la curva de la familia y qué parte del equipo se tira para la clase.
 */
export const BOTIN = { mediaBase: 9, mediaAfijo: 18, mediaUnico: 10, sesgo: 0, piso: 0, clase: 0.25, hechizo: 0.5 };
const bt = (k: keyof typeof BOTIN): number => (globalThis as any).__botin?.[k] ?? BOTIN[k];
/**
 * Botín en evolución (22 nov 2026, Rick: "esperaba armas en evolución"). Los grados de un mismo afijo (Feroz, Cruel,
 * Brutal...) se reparten el peso que el grupo tenía, pero el grado que queda lejos por debajo del nivel del objeto pierde
 * la mitad cada 10 niveles: a nivel 40 sale más Implacable que Feroz. El grupo pesa lo mismo que antes, así que los tipos
 * de afijo (daño, vida, resistencias...) salen igual de seguido. Sin azar adentro: los pesos se arman antes de la tirada.
 */
function pesosAfijo(ok: Afijo[], nivel: number): number[] {
  if (botinViejo() || !(nivel > 0)) return ok.map((a) => a.peso);
  const bruto = ok.map((a) => a.peso * Math.pow(0.5, Math.max(0, nivel - a.nivel) / bt('mediaAfijo')));
  const sumaG = new Map<string, [number, number]>();
  ok.forEach((a, i) => { const g = sumaG.get(a.grupo) ?? [0, 0]; g[0] += a.peso; g[1] += bruto[i]; sumaG.set(a.grupo, g); });
  return ok.map((a, i) => { const g = sumaG.get(a.grupo)!; return g[1] > 0 ? (bruto[i] * g[0]) / g[1] : a.peso; });
}
function elegirAfijo(lista: Afijo[], usados: Set<string>, nivel = 0): Afijo | null {
  const ok = lista.filter((a) => !usados.has(a.grupo));
  if (!ok.length) return null;
  const w = pesosAfijo(ok, nivel);
  let s = 0; for (const x of w) s += x;
  let k = R() * s;
  for (let i = 0; i < ok.length; i++) { k -= w[i]; if (k <= 0) return ok[i]; }
  return ok[ok.length - 1];
}
/**
 * Qué base sale: antes pareja entre todas las de los últimos 30 niveles (a nivel 20 salía tanto el hacha de nivel 1 como la
 * de 20, y el piso se llenaba de armas viejas). Ahora cada base pierde la mitad de su chance cada 8 niveles que queda por
 * debajo del nivel del objeto: lo de tu nivel es lo que más cae y lo viejo sigue saliendo, pero de vez en cuando. Las joyas
 * y los talismanes no tienen escalón: pesan parejo.
 */
function elegirBase(cand: Base[], nivel: number, sinEscalon: (b: Base) => boolean): Base {
  if (botinViejo() || cand.length < 2) return elegir(cand);
  const w = cand.map((b) => (sinEscalon(b) ? 1 : Math.pow(0.5, Math.max(0, nivel - b.nivel) / bt('mediaBase'))));
  let s = 0; for (const x of w) s += x;
  let k = R() * s;
  for (let i = 0; i < cand.length; i++) { k -= w[i]; if (k <= 0) return cand[i]; }
  return cand[cand.length - 1];
}
function sumarAfijo(o: Objeto, a: Afijo) {
  // botín en evolución: el mismo grado tira más alto cuanto más por encima de su nivel cae el objeto (nunca pasa de su
  // máximo): Brutal en un objeto de nivel 25 tira parejo entre 41 y 65; en uno de nivel 45, casi siempre por arriba de 55
  const t = botinViejo() || bt('sesgo') <= 0 ? 0 : clamp((o.nivel - a.nivel) / 20, 0, 1);
  for (const st of a.stats) {
    const v = t > 0 ? Math.round(st.min + (st.max - st.min) * Math.pow(R(), 1 / (1 + bt('sesgo') * t))) : rollStat(st.min, st.max);
    if (st.stat === 'huecos') { o.huecos = Math.max(o.huecos, v); continue; }
    o.stats.push([st.stat, v]);
  }
  if (a.vivo) o.vivo = a.vivo;
}

/** Mediana del daño medio de las armas de una familia que pueden salir a este nivel (la misma ventana de 30 niveles). */
const medianas = new Map<string, number>();
function medianaFamilia(fam: string, nivel: number): number {
  const k = fam + '|' + nivel; let m = medianas.get(k);
  if (m === undefined) {
    const v = BASES.filter((b) => b.ranura === 'arma' && b.familia === fam && b.dano && !(b as any).soloUnico && b.nivel <= Math.max(1, nivel) && b.nivel >= nivel - 30).map((b) => (b.dano![0] + b.dano![1]) / 2).sort((a, b) => a - b);
    m = v.length ? v[Math.floor(v.length / 2)] : 0; medianas.set(k, m);
  }
  return m;
}
const VARAS = new Set(['varita', 'baculo', 'cetro']);
/** Daño medio de la curva de una familia a un nivel: interpolado entre sus bases de siempre (sin el arsenal ni lo de único). */
const curvas = new Map<string, Base[]>();
function curvaFamilia(fam: string, nivel: number): number {
  let c = curvas.get(fam);
  if (!c) { c = BASES.filter((b) => b.ranura === 'arma' && b.familia === fam && b.dano && !(b as any).arsenal && !(b as any).soloUnico).sort((a, b) => a.nivel - b.nivel); curvas.set(fam, c); }
  if (!c.length) return 0;
  const m = (x: Base) => (x.dano![0] + x.dano![1]) / 2;
  let i = c.findIndex((b) => b.nivel > nivel); if (i < 0) return m(c[c.length - 1]);
  if (i === 0) return m(c[0]);
  const a = c[i - 1], b = c[i], t = (nivel - a.nivel) / Math.max(1, b.nivel - a.nivel);
  return m(a) + (m(b) - m(a)) * t;
}
export function crearObjeto(nivel: number, rareza: Rareza, filtro?: (b: Base) => boolean): Objeto {
  // bases de los últimos 30 niveles (las joyas y talismanes no tienen escalones: siempre entran)
  const sinEscalon = (b: Base) => b.ranura === 'anillo' || b.ranura === 'amuleto' || b.ranura === 'talisman';
  let cand = BASES.filter((b) => !(b as any).soloUnico && b.nivel <= Math.max(1, nivel) && (!filtro || filtro(b)) && (b.nivel >= nivel - 30 || sinEscalon(b)));
  // el arsenal son 360 armas: sin esto taparían todo lo demás. Sale un 35 % de las veces que podría
  { const ars = cand.filter((b) => (b as any).arsenal), resto = cand.filter((b) => !(b as any).arsenal); if (ars.length && resto.length) cand = R() < 0.35 ? ars : resto; }
  // si nada entra en la ventana, la base más alta que respete el filtro
  const resto = cand.length ? cand : BASES.filter((x) => x.nivel <= Math.max(3, nivel) && (!filtro || filtro(x)));
  const b = resto.length ? (cand.length ? elegirBase(cand, nivel, sinEscalon) : resto.reduce((m, x) => (x.nivel > m.nivel ? x : m))) : elegir(BASES.filter((x) => x.nivel <= Math.max(3, nivel)));
  if (rareza === 'unico' || rareza === 'legendario') { const u = crearUnico(nivel, rareza === 'legendario', filtro); if (u) return u; rareza = 'raro'; }
  if (rareza === 'conjunto') { const s = crearConjunto(nivel); if (s) return s; rareza = 'raro'; }
  const o = crearBase(b, nivel);
  o.rareza = rareza;
  // piso de daño: un arma vieja de la ventana nunca pega menos del 70 % de la mediana de su familia a este nivel. Con el
  // botín en evolución el piso es el 75 % de la curva de su familia a este nivel (la base de tu nivel pega el 100 %): un arma
  // vieja que cae alto nunca es basura, pero la de tu nivel le gana
  if (b.ranura === 'arma' && b.dano) {
    const med = botinViejo() || bt('piso') <= 0 ? medianaFamilia(b.familia, nivel) : curvaFamilia(b.familia, nivel) * bt('piso') / 0.7, media = (b.dano[0] + b.dano[1]) / 2;
    if (med > 0 && media < med * 0.7) { o.kDano = Math.round((med * 0.7 / media) * 100) / 100; o.dano = [Math.round(b.dano[0] * o.kDano), Math.round(b.dano[1] * o.kDano)]; }
  }
  // las varas de los que lanzan (varitas, báculos y cetros) traen su daño de hechizos propio, que crece con el nivel de la
  // base: el báculo de nivel 50 le sirve al arcanista más que el de nivel 5 aunque los dos caigan sin afijos (antes la vara
  // de un lanzador valía solo por sus afijos y una de nivel 2 duraba 30 niveles). Fijo por base, sin tirada
  if (!botinViejo() && b.ranura === 'arma' && VARAS.has(b.familia)) o.stats.push(['dano_hechizos', Math.round(2 + b.nivel * bt('hechizo'))]);
  if (rareza === 'normal' && b.huecosMax && R() < 0.25) o.huecos = entero(1, b.huecosMax);
  if (rareza === 'normal' && R() < 0.06) { o.rareza = 'gris'; o.durab = o.durabMax = Math.ceil(b.durab * 0.5); if (o.dano) o.dano = [Math.max(1, Math.floor(o.dano[0] * 0.7)), Math.max(1, Math.floor(o.dano[1] * 0.7))]; if (o.def) o.def = Math.floor(o.def * 0.7); o.nombre = [`${b.nombre[0]} gastado`, `Worn ${b.nombre[1]}`]; }
  if (rareza === 'magico' || rareza === 'raro') {
    const usados = new Set<string>();
    const pres = afijosPosibles(PREFIJOS, b, nivel), sufs = afijosPosibles(SUFIJOS, b, nivel);
    let np = 0, ns = 0;
    if (rareza === 'magico') { const q = R(); np = q < 0.4 ? 1 : q < 0.75 ? 0 : 1; ns = np === 0 ? 1 : R() < 0.5 ? 1 : 0; }
    else { const n = entero(3, 6); np = clamp(entero(1, 3), 1, n - 1); ns = Math.min(3, n - np); }
    let pre: Afijo | null = null, suf: Afijo | null = null;
    for (let i = 0; i < np; i++) { const a = elegirAfijo(pres, usados, nivel); if (!a) break; usados.add(a.grupo); sumarAfijo(o, a); if (!pre) pre = a; }
    for (let i = 0; i < ns; i++) { const a = elegirAfijo(sufs, usados, nivel); if (!a) break; usados.add(a.grupo); sumarAfijo(o, a); if (!suf) suf = a; }
    if (rareza === 'magico') {
      o.nombre = [[b.nombre[0], pre?.nombre[0], suf?.nombre[0]].filter(Boolean).join(' '), [pre?.nombre[1], b.nombre[1], suf?.nombre[1]].filter(Boolean).join(' ')];
      o.precio = Math.round(b.precio * 2.5 + nivel * 5);
    } else {
      const p = elegir(NOMBRES_RAROS.pre), s = elegir(NOMBRES_RAROS.suf);
      o.nombre = [`${p[0]} ${s[0]}`, `${s[1]} ${p[1]}`];
      o.precio = Math.round(b.precio * 5 + nivel * 12);
    }
    aplicarMejoras(o);
  }
  return o;
}

/** Los % de daño o defensa mejorados se aplican al número base del objeto. */
export function aplicarMejoras(o: Objeto) {
  const b = baseDe(o); if (!b) return;
  let dp = 0, ap = 0, dmin = 0, dmax = 0, d = 0;
  for (const [s, v] of o.stats) { if (s === 'dano_pct') dp += v; if (s === 'def_pct') ap += v; if (s === 'dano_min') dmin += v; if (s === 'dano_max') dmax += v; if (s === 'def') d += v; }
  const k = o.kDano ?? 1;
  if (b.dano) o.dano = [Math.round(b.dano[0] * k * (1 + dp / 100)) + dmin, Math.round(b.dano[1] * k * (1 + dp / 100)) + dmax];
  if (b.def) o.def = Math.round(((o.def ?? b.def[0]) * (1 + ap / 100))) + d;
  if (o.dano && o.dano[1] < o.dano[0]) o.dano[1] = o.dano[0];
}

export function crearUnico(nivel: number, legendario: boolean, filtro?: (b: Base) => boolean): Objeto | null {
  const todos = UNICOS.filter((u) => !u.soloMision && u.nivel <= nivel + 3 && !!u.legendario === legendario && BASE_POR_ID.has(u.base) && (!filtro || filtro(BASE_POR_ID.get(u.base)!)));
  if (!todos.length) return null;
  // a nivel alto no caen los de los primeros actos: los de los últimos 35 niveles (o, si no hay, los más altos que haya)
  const tope = todos.reduce((m, u) => Math.max(m, u.nivel), 0);
  const ventana = todos.filter((x) => x.nivel >= Math.min(nivel - 35, tope - 15));
  // botín en evolución: el único de tu nivel sale más que el de 30 niveles atrás (la mitad cada 10 niveles por debajo)
  let u: Unico;
  if (botinViejo()) u = elegir(ventana);
  else { const w = ventana.map((x) => Math.pow(0.5, Math.max(0, nivel - x.nivel) / bt('mediaUnico'))); let s = 0; for (const x of w) s += x; let k = R() * s; u = ventana[ventana.length - 1]; for (let i = 0; i < ventana.length; i++) { k -= w[i]; if (k <= 0) { u = ventana[i]; break; } } }
  return deUnico(u, BASE_POR_ID.get(u.base)!, nivel);
}
/** Arma un único o legendario con sus estadísticas, su elemento vivo y su nivel necesario. */
function deUnico(u: Unico, b: Base, nivel: number): Objeto {
  const o = crearBase(b, Math.max(nivel, u.nivel));
  o.rareza = u.legendario ? 'legendario' : 'unico';
  o.nombre = [...u.nombre] as [string, string];
  for (const st of u.stats) { const v = rollStat(st.min, st.max); if (st.stat === 'huecos') o.huecos = v; else o.stats.push([st.stat, v]); }
  if (u.vivo) o.vivo = u.vivo;
  if ((u as any).vis) o.vis = (u as any).vis;
  if ((u as any).efecto) { o.efecto = (u as any).efecto; o.leg = u.id; }
  o.lore = u.lore;
  if (u.req) o.req = u.req;
  o.precio = Math.round(b.precio * 10 + o.nivel * 30);
  aplicarMejoras(o);
  return o;
}
export function crearConjunto(nivel: number): Objeto | null {
  const todos = CONJUNTOS.filter((c) => c.nivel <= nivel + 3);
  if (!todos.length) return null;
  const tope = todos.reduce((m, c) => Math.max(m, c.nivel), 0);
  const c = elegir(todos.filter((x) => x.nivel >= Math.min(nivel - 35, tope - 15)));
  return crearPiezaConjunto(c.id, elegir(c.piezas).id, nivel);
}
/** Una pieza concreta de un conjunto (su nivel necesario es el del conjunto). */
export function crearPiezaConjunto(conjunto: string, pieza: string, nivel: number): Objeto | null {
  const c = CONJUNTOS.find((x) => x.id === conjunto), p = c?.piezas.find((x) => x.id === pieza);
  const b = p && BASE_POR_ID.get(p.base); if (!c || !p || !b) return null;
  const o = crearBase(b, Math.max(nivel, c.nivel));
  o.rareza = 'conjunto'; o.conjunto = c.id; o.nombre = [...p.nombre] as [string, string]; o.lore = c.lore;
  for (const st of p.stats) o.stats.push([st.stat, rollStat(st.min, st.max)]);
  if (p.vivo) o.vivo = p.vivo;
  o.req = c.req ?? c.nivel;
  o.precio = Math.round(b.precio * 8 + o.nivel * 25);
  aplicarMejoras(o);
  return o;
}
/** La legendaria temática de un jefe, si la suelta (de acto siempre que toque; de mazmorra solo si es único o jefe). */
export function legendariaJefe(id: string, nivel: number, calidad: number): Objeto | null {
  const lj = LEGENDARIA_JEFE[id]; if (!lj || calidad < 2 || nivel < (lj[2] ?? 0) || R() >= lj[1]) return null;
  return crearUnicoId(lj[0], nivel);
}

// ------------------------------------------------------------------ consumibles
export const POCIONES: { pocion: 'vida' | 'mana' | 'rejuv'; tam: number; nombre: [string, string]; valor: number; precio: number; nivel: number }[] = [
  { pocion: 'vida', tam: 0, nombre: ['Poción de vida menor', 'Minor Healing Potion'], valor: 45, precio: 30, nivel: 1 },
  { pocion: 'vida', tam: 1, nombre: ['Poción de vida ligera', 'Light Healing Potion'], valor: 90, precio: 70, nivel: 8 },
  { pocion: 'vida', tam: 2, nombre: ['Poción de vida', 'Healing Potion'], valor: 160, precio: 140, nivel: 18 },
  { pocion: 'vida', tam: 3, nombre: ['Poción de vida mayor', 'Greater Healing Potion'], valor: 280, precio: 250, nivel: 30 },
  { pocion: 'vida', tam: 4, nombre: ['Poción de vida suprema', 'Supreme Healing Potion'], valor: 450, precio: 400, nivel: 45 },
  { pocion: 'mana', tam: 0, nombre: ['Poción de maná menor', 'Minor Mana Potion'], valor: 30, precio: 30, nivel: 1 },
  { pocion: 'mana', tam: 1, nombre: ['Poción de maná ligera', 'Light Mana Potion'], valor: 60, precio: 70, nivel: 8 },
  { pocion: 'mana', tam: 2, nombre: ['Poción de maná', 'Mana Potion'], valor: 110, precio: 140, nivel: 18 },
  { pocion: 'mana', tam: 3, nombre: ['Poción de maná mayor', 'Greater Mana Potion'], valor: 180, precio: 250, nivel: 30 },
  { pocion: 'mana', tam: 4, nombre: ['Poción de maná suprema', 'Supreme Mana Potion'], valor: 300, precio: 400, nivel: 45 },
  { pocion: 'rejuv', tam: 0, nombre: ['Poción de rejuvenecer', 'Rejuvenation Potion'], valor: 35, precio: 600, nivel: 12 },
  { pocion: 'rejuv', tam: 1, nombre: ['Poción de rejuvenecer plena', 'Full Rejuvenation Potion'], valor: 100, precio: 1500, nivel: 30 },
];
export function crearPocion(pocion: 'vida' | 'mana' | 'rejuv', tam: number): Objeto {
  const p = POCIONES.find((x) => x.pocion === pocion && x.tam === tam) ?? POCIONES[0];
  return { uid: nuevoUid(), tipo: 'pocion', base: `pocion_${pocion}_${tam}`, rareza: 'normal', nombre: p.nombre, nivel: p.nivel, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, pocion, tam, precio: p.precio };
}
export const valorPocion = (o: Objeto) => POCIONES.find((x) => x.pocion === o.pocion && x.tam === o.tam)?.valor ?? 40;
export function pocionParaNivel(nivel: number): Objeto {
  const tam = nivel < 8 ? 0 : nivel < 18 ? 1 : nivel < 30 ? 2 : nivel < 45 ? 3 : 4;
  const q = R();
  if (q < 0.04 && nivel >= 12) return crearPocion('rejuv', nivel > 30 ? 1 : 0);
  return crearPocion(q < 0.6 ? 'vida' : 'mana', clamp(tam - (R() < 0.3 ? 1 : 0), 0, 4));
}
export function crearGema(nivel: number): Objeto {
  const cand = GEMAS.filter((g) => g.nivel <= nivel);
  const g = elegir(cand.length ? cand : GEMAS.slice(0, 7));
  return { uid: nuevoUid(), tipo: 'gema', base: g.id, rareza: 'normal', nombre: g.nombre, nivel: g.nivel, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, precio: 50 + g.calidad * 120 };
}
export function crearRuna(nivel: number): Objeto {
  const cand = RUNAS.filter((r) => r.nivel <= nivel);
  const ru = cand.length ? cand[Math.floor(Math.pow(R(), 2.2) * cand.length * 0.999 + (cand.length - 1) * 0) ] : RUNAS[0];
  // las runas altas son más raras: tira hacia las bajas
  const r = cand.length ? cand[Math.floor(cand.length * (1 - Math.pow(R(), 0.35)))] ?? ru : ru;
  return { uid: nuevoUid(), tipo: 'runa', base: r.id, rareza: 'normal', nombre: [`Runa ${r.nombre[0]}`, `${r.nombre[1]} Rune`], nivel: r.nivel, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, precio: 100 + r.orden * 80 };
}
export function crearPergamino(tipo: 'portal' | 'olvido'): Objeto {
  if (tipo === 'olvido') return { uid: nuevoUid(), tipo: 'pergamino', base: 'pergamino_olvido', rareza: 'unico', nombre: ['Lágrima del Olvido', 'Tear of Oblivion'], nivel: 1, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, precio: 5000, lore: ['Una gota que no moja. Quien la bebe olvida cómo pelear, y aprende de nuevo.', 'A drop that does not wet. Whoever drinks it forgets how to fight, and learns anew.'] };
  return { uid: nuevoUid(), tipo: 'pergamino', base: `pergamino_${tipo}`, rareza: 'normal', nombre: tipo === 'portal' ? ['Pergamino de regreso', 'Scroll of Return'] : ['Pergamino de lectura', 'Scroll of Reading'], nivel: 1, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, precio: 50 };
}

/** Engarzar una gema o runa en un objeto con huecos libres. Las runas en orden pueden formar una palabra. */
export function engarzar(o: Objeto, g: Objeto): boolean {
  if (o.engarces.length >= o.huecos) return false;
  if (g.tipo !== 'gema' && g.tipo !== 'runa') return false;
  o.engarces.push(g.base);
  const b = baseDe(o);
  if (g.tipo === 'gema') {
    const gm = GEMAS.find((x) => x.id === g.base);
    if (gm && b) { const sts = b.ranura === 'arma' ? gm.arma : b.ranura === 'izq' && b.familia !== 'orbe' ? gm.escudo : gm.armadura; for (const s of sts) o.stats.push([s.stat, s.max]); }
  } else {
    const ru = RUNAS.find((x) => x.id === g.base);
    if (ru && b) for (const s of b.ranura === 'arma' ? ru.arma : ru.armadura) o.stats.push([s.stat, s.max]);
  }
  // palabra rúnica: si el objeto es normal y las runas forman una
  if (o.engarces.length === o.huecos && (o.rareza === 'normal' || o.rareza === 'gris') && b) {
    const d = familiaDonde(b);
    const p = PALABRAS.find((w) => w.runas.length === o.huecos && w.runas.every((r, i) => r === o.engarces[i]) && w.donde.some((x) => d.includes(x)));
    if (p) {
      o.palabra = p.id; o.rareza = 'unico'; o.nombre = [`${p.nombre[0]} (${b.nombre[0]})`, `${p.nombre[1]} (${b.nombre[1]})`];
      for (const s of p.stats) o.stats.push([s.stat, s.max]);
      if (p.vivo) o.vivo = p.vivo;
      o.lore = p.lore;
    }
  }
  aplicarMejoras(o);
  return true;
}

// ------------------------------------------------------------------ qué cae
export interface Caida { oro?: number; obj?: Objeto }
/** Qué suelta un monstruo de ese nivel. calidad: 0 normal, 1 campeón, 2 único, 3 jefe, 4 jefe de acto. */
/**
 * Lo que sirve a la clase (botín en evolución): un arma de familia afín, una pieza de su clase o cualquier otra cosa que
 * no sea arma (armadura, joyas). Antes un monje veía caer unas 40 garras en toda la campaña normal (menos de una por nivel)
 * y una cazadora unos 57 arcos y ballestas: la mejora tardaba lo que tardaba en caer una de las suyas.
 */
export function sirveA(clase: string): (b: Base) => boolean {
  return (b) => (!b.clase || b.clase === clase) && (b.ranura !== 'arma' || afinidadDe(b, clase) === 'afin');
}
export function botin(nivel: number, calidad: number, hallazgo: number, oroExtra: number, clase?: string): Caida[] {
  const out: Caida[] = [];
  const tiradas = [1, 2, 3, 5, 8][calidad];
  for (let t = 0; t < tiradas; t++) {
    const q = R();
    const nada = [0.55, 0.35, 0.15, 0.05, 0][calidad];
    if (t === 0 && q < nada) continue;
    const k = R();
    if (k < 0.24) { out.push({ oro: Math.round((5 + nivel * entero(2, 7)) * (1 + oroExtra / 100) * (1 + calidad * 0.5)) }); continue; }
    if (k < 0.42) { out.push({ obj: pocionParaNivel(nivel) }); continue; }
    if (k < 0.46) { out.push({ obj: crearGema(nivel) }); continue; }
    if (k < 0.475 && nivel > 4) { out.push({ obj: crearRuna(nivel) }); continue; }
    if (k < 0.49) { out.push({ obj: crearPergamino('portal') }); continue; }
    // lo común, lo mágico y lo raro a veces se tira para la clase; los únicos, legendarios y conjuntos siguen siendo suerte pura
    const rz = tirarRareza(calidad, hallazgo, nivel);
    const paraClase = !!clase && !botinViejo() && (rz === 'normal' || rz === 'magico' || rz === 'raro') && R() < bt('clase');
    out.push({ obj: crearObjeto(nivel, rz, paraClase ? sirveA(clase!) : undefined) });
  }
  return out;
}
export function tirarRareza(calidad: number, hallazgo: number, nivel = 99): Rareza {
  // en los primeros niveles lo único y lo legendario cae más seguido: la primera reliquia tiene que llegar temprano
  const pronto = nivel <= 12 ? 2.2 : nivel <= 30 ? 1.5 : 1;
  const mf = 1 + hallazgo / 100, mfu = (1 + hallazgo / 250) * pronto;
  const bono = [1, 2, 3, 5, 8][calidad] ?? 1;
  const r = R();
  if (r < 0.0025 * bono * mfu) return 'legendario';
  if (r < 0.012 * bono * mfu) return 'unico';
  if (r < 0.022 * bono * mfu) return 'conjunto';
  if (r < 0.09 * bono * mf) return 'raro';
  if (r < 0.34 * bono * mf) return 'magico';
  return 'normal';
}

export const COLOR_RAREZA: Record<Rareza, string> = { normal: '#d8d0c0', gris: '#8a8a8a', magico: '#6c8cff', raro: '#ffe060', conjunto: '#40d040', unico: '#c8a050', legendario: '#ff8a20' };
export const colorObj = (o: Objeto) => (o.tipo === 'runa' ? '#ffa040' : o.tipo === 'gema' ? '#d0d0d0' : COLOR_RAREZA[o.rareza]);
export const ranuraDe = (o: Objeto): Ranura | null => (o.tipo === 'equipo' ? baseDe(o)?.ranura ?? null : null);

/** Nombre corto de cada stat para el tooltip. */
export const NOMBRE_STAT: Record<string, [string, string]> = {
  dano_pct: ['+{v}% daño mejorado', '+{v}% Enhanced Damage'], dano_hechizos: ['+{v}% daño de hechizos', '+{v}% Spell Damage'], dano_min: ['+{v} daño mínimo', '+{v} to Minimum Damage'], dano_max: ['+{v} daño máximo', '+{v} to Maximum Damage'],
  dano_fuego: ['+{v} daño de fuego', '+{v} Fire Damage'], dano_frio: ['+{v} daño de frío', '+{v} Cold Damage'], dano_rayo: ['+{v} daño de rayo', '+{v} Lightning Damage'],
  dano_veneno: ['+{v} daño de veneno', '+{v} Poison Damage'], dano_sombra: ['+{v} daño de sombra', '+{v} Shadow Damage'], dano_luz: ['+{v} daño de luz', '+{v} Holy Damage'], dano_sangre: ['+{v} daño de sangrado', '+{v} Bleed Damage'],
  def: ['+{v} defensa', '+{v} Defense'], def_pct: ['+{v}% defensa mejorada', '+{v}% Enhanced Defense'],
  vida: ['+{v} vida', '+{v} to Life'], mana: ['+{v} maná', '+{v} to Mana'], fue: ['+{v} fuerza', '+{v} to Strength'], des: ['+{v} destreza', '+{v} to Dexterity'], vit: ['+{v} vitalidad', '+{v} to Vitality'], ene: ['+{v} energía', '+{v} to Energy'],
  todos_atributos: ['+{v} a todos los atributos', '+{v} to All Attributes'],
  res_fuego: ['Resistencia al fuego +{v}%', 'Fire Resist +{v}%'], res_frio: ['Resistencia al frío +{v}%', 'Cold Resist +{v}%'], res_rayo: ['Resistencia al rayo +{v}%', 'Lightning Resist +{v}%'],
  res_veneno: ['Resistencia al veneno +{v}%', 'Poison Resist +{v}%'], res_sombra: ['Resistencia a la sombra +{v}%', 'Shadow Resist +{v}%'], res_todo: ['Todas las resistencias +{v}%', 'All Resistances +{v}%'],
  robo_vida: ['{v}% de vida robada por golpe', '{v}% Life Stolen per Hit'], robo_mana: ['{v}% de maná robado por golpe', '{v}% Mana Stolen per Hit'],
  vel_ataque: ['+{v}% velocidad de ataque', '+{v}% Increased Attack Speed'], vel_lanzar: ['+{v}% velocidad de lanzamiento', '+{v}% Faster Cast Rate'], vel_mover: ['+{v}% velocidad al correr', '+{v}% Faster Run/Walk'], vel_recuperar: ['+{v}% recuperación de golpes', '+{v}% Faster Hit Recovery'],
  critico: ['{v}% de golpe crítico', '{v}% Critical Strike'], bloqueo: ['+{v}% probabilidad de bloquear', '+{v}% Chance to Block'],
  regen_vida: ['Regenera {v} de vida por segundo', 'Replenish {v} Life per second'], regen_mana: ['Regeneración de maná +{v}%', 'Regenerate Mana +{v}%'],
  mas_habilidades: ['+{v} a todas las habilidades', '+{v} to All Skills'], mas_clase: ['+{v} a las habilidades de la clase', '+{v} to Class Skills'],
  hallazgo: ['{v}% más hallazgo de objetos mágicos', '{v}% Better Chance of Magic Items'], oro_extra: ['{v}% más oro de los monstruos', '{v}% Extra Gold from Monsters'],
  radio_luz: ['+{v} radio de luz', '+{v} to Light Radius'], precision: ['+{v} índice de ataque', '+{v} to Attack Rating'], reduc_dano: ['Daño reducido {v}%', 'Damage Reduced by {v}%'],
  espinas: ['El atacante recibe {v} de daño', 'Attacker Takes {v} Damage'], vida_por_muerte: ['+{v} vida por cada muerte', '+{v} Life after each Kill'], mana_por_muerte: ['+{v} maná por cada muerte', '+{v} Mana after each Kill'],
  golpe_aplastante: ['{v}% de golpe aplastante', '{v}% Crushing Blow'], herida_abierta: ['{v}% de herida abierta', '{v}% Open Wounds'], ralentizar: ['Ralentiza al objetivo {v}%', 'Slows Target by {v}%'], aturdir: ['{v}% de aturdir', '{v}% Chance to Stun'],
  perforar: ['{v}% de perforar', '{v}% Piercing Attack'], invocados_pct: ['+{v}% de vida y daño de invocados', '+{v}% Summon Life and Damage'], valor: ['{v}% resistencia al terror', '{v}% Terror Resistance'], durabilidad_infinita: ['Indestructible', 'Indestructible'], reduc_req: ['Requisitos -{v}%', 'Requirements -{v}%'],
};
export function textoStat(s: string, v: number, idi: 0 | 1): string {
  const t = NOMBRE_STAT[s]; if (!t) return `${s} ${v}`;
  return t[idi].replace('{v}', String(v)).replace('+-', '-');
}

// ------------------------------------------------------------------ equipo de Thor
const NOMBRE_BARDA: [string, string][] = [['', ''], ['Placa dorada y pañuelo', 'Gold Tag and Bandana'], ['Peto de cuero', 'Leather Breastplate'], ['Malla con hombreras', 'Mail with Pauldrons'], ['Barda de placas', 'Plate Barding'], ['Barda de la Casa GG', 'Barding of House GG']];
const NOMBRE_COLLAR: [string, string][] = [['Collar de cuero', 'Leather Collar'], ['Collar tachonado', 'Studded Collar'], ['Collar de plata', 'Silver Collar'], ['Collar de los guardianes', 'Guardian Collar']];
const TRAMO_NIVEL = [1, 6, 15, 30, 50, 75];
/** Un collar o una barda para Thor. La barda sube su armadura a un tramo; el collar le da daño, vida y velocidad. */
export function crearObjetoThor(clase: 'collar' | 'barda', nivel: number): Objeto {
  if (clase === 'barda') {
    let t = 0; for (let i = 0; i < TRAMO_NIVEL.length; i++) if (nivel >= TRAMO_NIVEL[i]) t = i;
    const tramo = Math.max(1, Math.min(5, t + (R() < 0.3 ? 1 : 0)));
    const rareza: Rareza = tramo === 5 ? 'legendario' : tramo >= 3 ? 'raro' : 'magico';
    return { uid: nuevoUid(), tipo: 'thor', base: 'thor_barda', rareza, nombre: [...NOMBRE_BARDA[tramo]] as [string, string], nivel, stats: [], durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 2, h: 2, precio: 400 + tramo * 900, tramo };
  }
  const g = Math.min(3, Math.floor(nivel / 25));
  const k = 1 + nivel / 40;
  const stats: [string, number][] = [['thor_dano', Math.round((8 + R() * 10) * k)], ['thor_vida', Math.round((8 + R() * 12) * k)]];
  if (R() < 0.4) stats.push(['thor_vel', Math.round(5 + R() * 10)]);
  return { uid: nuevoUid(), tipo: 'thor', base: 'thor_collar', rareza: stats.length > 2 ? 'raro' : 'magico', nombre: [...NOMBRE_COLLAR[g]] as [string, string], nivel, stats, durab: 0, durabMax: 0, huecos: 0, engarces: [], w: 1, h: 1, precio: 300 + nivel * 25 };
}
