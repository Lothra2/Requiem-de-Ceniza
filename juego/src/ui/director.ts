// El director de tomas: las cinemáticas de cierre de acto hechas con el mismo arte con que se juega (Rick, 23 nov 2026:
// "están muy flojas", eran diapositivas 3D con zoom). Un guion por acto (ui/cine_acto1.ts...) es una lista de tomas como
// datos: la zona real (generada con la semilla con que el héroe la jugó), el ancla dentro de ella, la cámara por claves
// con su curva y su acercamiento a puntos enteros, los actores (el héroe con su equipo, Thor, monstruos y jefes con sus
// animaciones horneadas, la muerte de 22 o 29 cuadros incluida) con sus recorridos, la brasa que vuela, luces, textos,
// sonidos y fundidos. Cada toma puede traer además su `paso` (lo que no cabe en claves: sangre que se abre, chispas, el
// golpe de cámara) y su `pantalla` (lo que va sobre la imagen: un primer plano, el cartel del acto).
//
// Todo lo que se ve sale de lo que ya pinta el juego: dibujarMundo con un Juego propio de la película (no toca el de la
// partida), la luz de luces.ts con las luces de la toma, el clima, la niebla, los fuegos y la oscuridad de la zona. Nada se
// guarda. Se evalúa por tiempo (las posiciones y las animaciones salen del instante, así se puede saltar a cualquier
// segundo para las pruebas: `__cineT`); lo que vuela suelto (chispas, partículas) se integra cuadro a cuadro.
import { ctx, W, H, E, RES, enMundoA, MW, MH } from '../nucleo/lienzo';
import { dibujarMundo, camCine, aPant, cam } from '../render/escena';
import { crearJuego, crearMonstruo, spriteThor, aspectoThor, particulas as soltarParticulas, type Juego, type Monstruo, type Dir, DIR_VEC } from '../juego/mundo';
import { generarZona, type Zona } from '../mundo/zona';
import { ZONAS } from '../mundo/actos';
import { MONSTRUOS } from '../datos/monstruos';
import { nuevoHeroe, type DatosHeroe } from '../juego/heroe';
import { hashTxt } from '../nucleo/azar';
import { manifiesto, atlasDe, clavesCon, asegurar } from '../motor/assets';
import { Sonido } from '../audio/sonido';
import { IDI, T } from './comun';
import { textoGotico, medirGotico } from './texto_gotico';
import type { TonoGotico } from './letra_gotica';
import { dibujarBrasa, reiniciarBrasa, type EstadoBrasa } from '../render/brasa_cine';
import { acc } from '../nucleo/accesible';
import * as Pintor from '../motor/pintor';
import { objetoMeta, dibujarTenido } from '../motor/assets';

// ------------------------------------------------------------------ el guion
export type Curva = 'suave' | 'lineal' | 'entra' | 'sale' | 'corte';
/** La cámara: el punto (x, y) relativo al ancla de la toma, en casillas; `alt` sube la mira en puntos del dibujo; `zoom` es cuántas veces la vista de siempre (se redondea a puntos enteros del aparato y no se interpola: cambia en seco en su clave); `fx`, `fy` dónde cae el punto en la pantalla. */
export interface CamClave { t: number; x: number; y: number; alt?: number; zoom?: number; fx?: number; fy?: number; c?: Curva }
export type AccActor = 'quieto' | 'caminar' | 'correr' | 'atacar' | 'lanzar' | 'herido' | 'morir' | 'especial';
/** Una clave de un actor: dónde está a ese segundo (si se da), qué hace desde ahí (`acc`) y a qué ritmo corre su animación (`ritmo`, 1 el del juego), hacia dónde mira (`dir`, o `mira` un punto) y su alfa. */
export interface ActorClave { t: number; x?: number; y?: number; acc?: AccActor; dur?: number; ritmo?: number; bucle?: boolean; dir?: Dir; mira?: [number, number]; alfa?: number; c?: Curva }
export interface Actor { id: string; tipo: 'heroe' | 'thor' | 'mon' | 'sprite'; mon?: string; /** 'sprite': un cuerpo horneado cualquiera (la gente del campamento, que no son monstruos). */ sprite?: string; claves: ActorClave[]; /** Sin el tinte de su ficha (Vesperio pálido): lo pinta la luz de la toma. */ sinTinte?: boolean; /** Un tinte propio (la sombra que le baja lo pálido), con su fuerza. */ sombra?: [string, number] }
/**
 * La luz de cine: todo se hunde (`hundir`, 0 a 1) menos un pozo de luz sobre lo que importa (un actor por su id, la brasa o
 * un punto relativo al ancla), a `z` puntos del dibujo sobre el piso y de radio `r` puntos del dibujo.
 */
export interface Foco { de: string | [number, number]; z?: number; r: number; k?: number }
/**
 * El primer término: algo cerca de la cámara que pasa por delante (una columna, una lápida, ramas), en silueta casi negra,
 * más grande que el mundo (a puntos más gruesos: está más cerca) y que corre más que la cámara (`par`). `fx`, `fy` es dónde
 * caen sus pies en la pantalla al empezar la toma (fracción del ancho y el alto). `id` es una pieza del catálogo
 * ('id|variante') o una función que la elige entre lo que hay en la zona.
 */
export interface PrimerTermino { id: string | ((z: Zona) => string | null); fx: number; fy: number; par?: number; mas?: number; alfa?: number; espejo?: boolean; canto?: string }
/** La brasa: dónde va (relativo al ancla), su altura sobre el piso en puntos del dibujo, su fuerza (0 a 1) y su tamaño. */
export interface BrasaClave { t: number; x?: number; y?: number; z?: number; k?: number; tam?: number; c?: Curva }
export interface LuzClave { t: number; x?: number; y?: number; z?: number; r?: number; k?: number; c?: Curva }
export interface LuzToma { id: string; color: [number, number, number]; claves: LuzClave[]; sombra?: boolean; titila?: number }
/** Un texto: aparece en t0, se va en t1. `voz` es quien habla (va en su color y entre comillas latinas). */
export interface Texto { t0: number; t1: number; es: string; en: string; tono?: TonoGotico; voz?: boolean; arriba?: boolean }
export interface SonidoToma { t: number; id: string; vol?: number; tono?: number; cine?: boolean }
export interface Toma {
  id: string; dur: number;
  /** La zona (id de ZONAS). Sin zona la toma no pinta mundo (un primer plano o un cartel, con su `pantalla`). */
  zona?: string;
  /** Piezas que la toma pone en la zona (`id|v`): se bajan con lo demás. */
  objetos?: string[];
  /** El ancla dentro de la zona (casillas): todo lo de la toma es relativo a ella. */
  ancla?: (z: Zona) => [number, number];
  cam?: CamClave[];
  actores?: Actor[];
  brasa?: BrasaClave[];
  luces?: LuzToma[];
  textos?: Texto[];
  sonidos?: SonidoToma[];
  /** Fundido de entrada y de salida (segundos), a negro o al color. */
  entra?: number; sale?: number; colorEntra?: string; colorSale?: string;
  /** Oscuridad de la zona en esta toma (la de la zona si no). */
  oscuridad?: number;
  /** Sacudidas de cámara: [t, dur, fuerza en puntos]. */
  temblores?: [number, number, number][];
  /** La luz de cine de la toma (ver Foco) y cuánto se hunde lo demás. */
  focos?: Foco[]; hundir?: number;
  primer?: PrimerTermino[];
  /** Se llama una vez al montar la toma (sacar lo que tapa, preparar lo que se va a pintar). */
  preparar?: (e: EstadoToma) => void;
  /** Si devuelve true al llegar, la toma no se ve (lo que necesita no está pintado): la película sigue con la siguiente. */
  omitir?: (e: EstadoToma) => boolean;
  /** Efectos de clima que esta toma no lleva (p. ej. 'fx_luciernagas'). Las criaturas de ambiente (fuegos fatuos, murciélagos) nunca van: salen al azar. */
  sinClima?: string[];
  /** Lo que no cabe en claves: se llama cada cuadro con el estado de la toma. */
  paso?: (e: EstadoToma, tl: number, dt: number) => void;
  /** Lo que se dibuja dentro del pase del mundo, después de él (en puntos del dibujo: `aPant` vale). */
  mundo?: (e: EstadoToma, tl: number, dt: number) => void;
  /** Lo que se dibuja encima del mundo, ya en la pantalla (o en vez del mundo, si la toma no tiene zona). */
  pantalla?: (e: EstadoToma, tl: number, dt: number) => void;
}
export interface Guion { id: string; acto: number; tomas: Toma[]; musica?: string }

// ------------------------------------------------------------------ el estado
export interface EstadoToma {
  toma: Toma; j: Juego | null; z: Zona | null; ax: number; ay: number;
  actores: Map<string, Monstruo | Juego['heroe']>;
  brasa: EstadoBrasa;
  /** Lo que la toma quiere guardar entre cuadros (su `paso`). */
  mem: Record<string, any>;
  heroe: DatosHeroe;
}
interface Escena { z: Zona; j: Juego }
let guionVivo: Guion | null = null, heroeVivo: DatosHeroe | null = null;
const escenas = new Map<string, Escena>();
const omitidas = new Set<number>();
let listo = false, cargando = false, tomaViva = -1, estado: EstadoToma | null = null, tAnt = -1;
const sonados = new Set<string>();

/** El héroe de muestra (sin partida: desde el menú o una prueba). */
export function heroeMuestra(): DatosHeroe { const d = nuevoHeroe('templario', 'Muestra'); (d as any).id = 'muestra_cine'; d.nivel = 14; return d; }
/** La semilla con que el héroe ve esa zona (la misma que en entrarZona). */
const semillaDe = (d: DatosHeroe, zid: string) => (hashTxt(d.id + zid) % 100000) + (hashTxt(zid + d.id + (d.ciclo ?? 0)) % 1000);

/** Lo que hay que bajar para una zona y sus actores. */
function atlasDeEscena(z: Zona, d: DatosHeroe, sprites: Set<string>, extra: string[] = []): Set<string> {
  const m: any = manifiesto(), s = new Set<string>();
  const ids = new Set<string>(extra);
  for (const o of z.objetos) ids.add(`${o.id}|${o.v}`);
  for (const sa of z.salidas) for (const o of sa.piezas ?? []) ids.add(`${o.id}|${o.v}`);
  for (const k of ids) for (const e of m.o?.[k]?.f ?? []) s.add(e[0]);
  for (const a of atlasDe('p', Object.keys(m.p ?? {}))) s.add(a);
  for (const a of atlasDe('w', Object.keys(m.w ?? {}))) s.add(a);
  for (const a of atlasDe('h', clavesCon('h', `${d.clase}/`))) s.add(a);
  for (const sp of sprites) for (const a of atlasDe('m', clavesCon('m', `${sp}/`))) s.add(a);
  for (const k of Object.keys(m.o ?? {})) if (k.startsWith('gore_') && !k.startsWith('gore_pared')) for (const e of m.o[k].f) s.add(e[0]);
  return s;
}
const spriteDe = (a: Actor, d: DatosHeroe) => a.tipo === 'thor' ? spriteThor(aspectoThor(d)).sprite : a.tipo === 'mon' ? MONSTRUOS[a.mon!]?.sprite : a.tipo === 'sprite' ? a.sprite! : null;

/**
 * Prepara una película: genera sus zonas (de a una, sin trabar el cuadro) y baja lo que pinta. Se puede llamar de antemano
 * (al caer el jefe) y otra vez al empezar: no repite lo hecho.
 */
export function prepararPelicula(g: Guion, d: DatosHeroe) {
  if (guionVivo === g && heroeVivo?.id === d.id && (listo || cargando)) return;
  guionVivo = g; heroeVivo = d; listo = false; cargando = true; tPide = performance.now(); omitidas.clear(); escenas.clear(); tomaViva = -1; estado = null;
  const zonas = [...new Set(g.tomas.map((t) => t.zona).filter(Boolean) as string[])];
  const sprites = new Map<string, Set<string>>(), extra = new Map<string, string[]>();
  for (const t of g.tomas) if (t.zona && t.objetos) extra.set(t.zona, [...(extra.get(t.zona) ?? []), ...t.objetos]);
  for (const t of g.tomas) if (t.zona) for (const a of t.actores ?? []) { const sp = spriteDe(a, d); if (sp) (sprites.get(t.zona) ?? sprites.set(t.zona, new Set()).get(t.zona)!).add(sp); }
  const yo = g;
  (async () => {
    const todo = new Set<string>();
    for (const id of zonas) {
      await new Promise((r) => setTimeout(r, 0));
      if (guionVivo !== yo) return;
      const z = generarZona(ZONAS[id], semillaDe(d, id));
      z.explorado.fill(1);
      const j = crearJuego(JSON.parse(JSON.stringify(d)), IDI);
      j.zona = z; (j as any).sinAntorcha = true; (j as any).lucesCine = [];
      j.heroe.x = -500; j.heroe.y = -500;
      escenas.set(id, { z, j });
      for (const a of atlasDeEscena(z, d, sprites.get(id) ?? new Set(), extra.get(id))) todo.add(a);
    }
    // (con los retratos del primer plano)
    for (const a of atlasDe('r' as any, clavesCon('r' as any, `${d.clase}/`))) todo.add(a);
    await asegurar(todo);
    if (guionVivo === yo) { listo = true; cargando = false; }
  })().catch(() => { cargando = false; listo = true; });
}
let tPide = 0;
/**
 * ¿Puede correr? Las zonas generadas, lo que pinta bajado y el héroe de la partida pintado con su equipo (si el pintor está
 * en medio, se espera: nunca la silueta de mientras se pinta). Con 30 s de espera sigue igual (algo se trabó).
 */
export const peliculaLista = () => listo && (Pintor.progresoPintura >= 1 || performance.now() - tPide > 60000);
export const duracionPelicula = (g: Guion) => g.tomas.reduce((a, t) => a + t.dur, 0);

// ------------------------------------------------------------------ curvas e interpolación
const suave = (k: number) => k * k * (3 - 2 * k);
const curva = (c: Curva | undefined, k: number) => (c === 'lineal' ? k : c === 'entra' ? k * k * k : c === 'sale' ? 1 - (1 - k) ** 3 : c === 'corte' ? (k < 1 ? 0 : 1) : suave(k));
/** Interpola claves de tiempo: la curva de la clave de llegada manda en el tramo. */
function entre<K extends { t: number; c?: Curva }>(cl: K[], t: number, campo: (k: K) => number | undefined): number | undefined {
  const xs = cl.filter((k) => campo(k) !== undefined);
  if (!xs.length) return undefined;
  if (t <= xs[0].t) return campo(xs[0]);
  for (let i = 1; i < xs.length; i++) if (t <= xs[i].t) { const a = xs[i - 1], b = xs[i]; const k = b.t > a.t ? curva(b.c, (t - a.t) / (b.t - a.t)) : 1; return campo(a)! + (campo(b)! - campo(a)!) * k; }
  return campo(xs[xs.length - 1]);
}
/** La última clave con ese campo antes de t. */
function ultima<K extends { t: number }>(cl: K[], t: number, campo: (k: K) => unknown, antes = true): K | undefined { let r: K | undefined; for (const k of cl) if (k.t <= t && campo(k) !== undefined) r = k; return r ?? (antes ? cl.find((k) => campo(k) !== undefined) : undefined); }
const dirDeVec = (dx: number, dy: number): Dir => {
  let mejor: Dir = 's', v = -9; for (const [d, [x, y]] of Object.entries(DIR_VEC)) { const p = x * dx + y * dy; if (p > v) { v = p; mejor = d as Dir; } } return mejor;
};

// ------------------------------------------------------------------ montar y mover la toma
function montar(i: number): EstadoToma | null {
  const g = guionVivo!, tm = g.tomas[i], d = heroeVivo!;
  const es = tm.zona ? escenas.get(tm.zona) ?? null : null;
  const j = es?.j ?? null, z = es?.z ?? null;
  const [ax, ay] = z && tm.ancla ? tm.ancla(z) : [0, 0];
  const actores = new Map<string, any>();
  if (j && z) {
    j.monstruos = []; j.particulas = []; j.efectos = []; j.manchas = []; j.numeros = []; j.proyectiles = []; j.areas = [];
    (j as any).lucesCine = []; j.heroe.x = -500; j.heroe.y = -500; j.sacudida = 0;
    z.oscuridad = tm.oscuridad ?? (ZONAS[z.id].oscuridad ?? z.oscuridad);
    for (const a of tm.actores ?? []) {
      if (a.tipo === 'heroe') { actores.set(a.id, j.heroe); continue; }
      const def0 = a.tipo === 'thor' ? { ...MONSTRUOS.lobo_sombrio, id: 'thor', sprite: spriteThor(aspectoThor(d)).sprite, nombre: ['Thor', 'Thor'] as [string, string], jefe: false } : a.tipo === 'sprite' ? { ...MONSTRUOS.lobo_sombrio, id: 'cine_' + a.sprite, sprite: a.sprite!, tinte: undefined, escala: 1, jefe: false } : MONSTRUOS[a.mon!];
      if (!def0) continue;
      const m = crearMonstruo(def0 as any, 10, ax, ay, 0, 0);
      m.estado = 'dormido'; (m as any).cine = true;
      if (a.tipo === 'thor') { m.tipo = 'invocado'; m.dueno = true; m.invocaId = 'thor'; const sp = spriteThor(aspectoThor(d)); m.tinte = sp.tinte; m.escala = sp.escala; }
      if (a.sinTinte) m.tinte = undefined;
      if (a.sombra) { m.tinte = a.sombra[0]; (m as any).tinteK = a.sombra[1]; }
      j.monstruos.push(m); actores.set(a.id, m);
    }
  }
  const e: EstadoToma = { toma: tm, j, z, ax, ay, actores, brasa: reiniciarBrasa(), mem: {}, heroe: d };
  tm.preparar?.(e);
  return e;
}
function moverActores(e: EstadoToma, tl: number) {
  for (const a of e.toma.actores ?? []) {
    const m = e.actores.get(a.id) as any; if (!m) continue;
    const cl = a.claves;
    const x = entre(cl, tl, (k) => k.x), y = entre(cl, tl, (k) => k.y);
    const px = (x ?? 0) + e.ax, py = (y ?? 0) + e.ay;
    // lo caminado hasta acá: la suma de los tramos entre claves de posición (los pies no patinan)
    let rec = 0, mov = false, vx = 0, vy = 0; const pos = cl.filter((k) => k.x !== undefined);
    for (let i = 1; i < pos.length; i++) {
      const p0 = pos[i - 1], p1 = pos[i]; if (tl <= p0.t) break;
      const k = Math.min(1, (tl - p0.t) / Math.max(1e-3, p1.t - p0.t)), kk = curva(p1.c, k);
      const L = Math.hypot(p1.x! - p0.x!, (p1.y ?? p0.y!) - p0.y!); rec += L * kk;
      if (k < 1 && L > 0.01) { mov = true; vx = p1.x! - p0.x!; vy = (p1.y ?? p0.y!) - p0.y!; }
    }
    m.x = px; m.y = py; m.recorrido = rec;
    const ka = ultima(cl, tl, (k) => k.acc, false), aact = (ka?.acc ?? (mov ? 'caminar' : 'quieto')) as string;
    const accion = mov && (aact === 'quieto') ? 'caminar' : aact;
    m.acc = accion; m.t = (tl - (ka && ka.acc ? ka.t : 0)) * (ka?.ritmo ?? 1); m.dur = ka?.dur ?? 0.9; m.golpeEn = m.dur * 0.55;
    m.t = Math.max(0, m.t); if (ka?.bucle) m.t = m.t % m.dur;
    if (accion === 'quieto') m.t = tl;
    const muere = accion === 'morir';
    m.muerto = muere; m.tMuerto = muere ? Math.min(5, tl - (ka?.t ?? 0)) : 0; if (m.tipo !== 'heroe') m.vida = muere ? 0 : m.vidaMax;
    const kd = ultima(cl, tl, (k) => k.dir ?? k.mira);
    if (mov && !(kd && kd.t > tl - 0.01 && kd.dir)) m.dir = dirDeVec(vx, vy);
    else if (kd?.mira) m.dir = dirDeVec(kd.mira[0] + e.ax - px, kd.mira[1] + e.ay - py);
    else if (kd?.dir) m.dir = kd.dir;
    if (mov && kd?.dir && kd.t <= tl) m.dir = kd.dir; // (un paso atrás: anda mirando a otro lado)
    const al = entre(cl, tl, (k) => k.alfa); (m as any).alfaCine = al ?? 1;
  }
}
function moverLuces(e: EstadoToma, tl: number) {
  if (!e.j) return;
  const L: any[] = [];
  for (const l of e.toma.luces ?? []) {
    const g = (f: (k: LuzClave) => number | undefined) => entre(l.claves, tl, f) ?? 0;
    const tit = l.titila ? 1 + l.titila * (Math.sin(tl * 13.1) * 0.5 + Math.sin(tl * 7.3 + 1) * 0.5) : 1;
    L.push({ id: l.id, x: g((k) => k.x) + e.ax, y: g((k) => k.y) + e.ay, z: g((k) => k.z), r: g((k) => k.r), c: l.color, k: Math.max(0, g((k) => k.k) * tit), sinSombra: !l.sombra });
  }
  // la brasa alumbra donde va, con sombra
  const b = brasaEn(e, tl);
  if (b && b.k > 0.02) L.push({ id: 'brasa', x: b.x, y: b.y, z: b.z, r: 150 + 120 * b.k * (b.tam ?? 1), c: [255, 70, 30], k: Math.min(1, 0.45 + 0.6 * b.k) * (0.88 + 0.12 * Math.sin(tl * 17)), sinSombra: false });
  (e.j as any).lucesCine = L;
}
export function brasaEn(e: EstadoToma, tl: number) {
  const cl = e.toma.brasa; if (!cl?.length || tl < cl[0].t || tl > cl[cl.length - 1].t + 0.001) return null;
  return { x: entre(cl, tl, (k) => k.x)! + e.ax, y: entre(cl, tl, (k) => k.y)! + e.ay, z: entre(cl, tl, (k) => k.z)!, k: entre(cl, tl, (k) => k.k) ?? 1, tam: entre(cl, tl, (k) => k.tam) ?? 1 };
}
/** Lo suelto del mundo de la película: partículas, efectos y manchas que crecen (lo que en el juego hace actualizar). */
function moverSuelto(j: Juego, dt: number) {
  for (const p of j.particulas) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.grav * dt; if (p.z < 0) { p.z = 0; p.vx *= 0.5; p.vy *= 0.5; p.vz = 0; } }
  j.particulas = j.particulas.filter((p) => p.t < p.dur);
  for (const f of j.efectos) f.t += dt;
  j.efectos = j.efectos.filter((f) => f.t < (f.dur ?? 3));
  for (const mc of j.manchas) { if (mc.forma === 'charco' && mc.t < 10) mc.t += dt; if (mc.rmax && mc.r < mc.rmax) mc.r = Math.min(mc.rmax, mc.r + (mc.rmax - mc.r) * dt * 0.45 + dt * 0.02); }
  j.t += dt; if (j.sacudida > 0) j.sacudida = Math.max(0, j.sacudida - dt * 2);
}

// ------------------------------------------------------------------ dibujar
/** Dónde está un foco en el mundo (casillas) y su altura. */
function puntoFoco(e: EstadoToma, f: Foco, tl: number): [number, number, number] | null {
  if (Array.isArray(f.de)) return [f.de[0] + e.ax, f.de[1] + e.ay, f.z ?? 40];
  if (f.de === 'brasa') { const b = brasaEn(e, tl); return b ? [b.x, b.y, b.z] : null; }
  const m = e.actores.get(f.de) as any; return m ? [m.x, m.y, f.z ?? 40] : null;
}
/** La luz de cine: un velo oscuro sobre todo con un pozo blando en cada foco (en el pase del mundo, antes de la viñeta). */
let velo: { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;
function hundirMenos(e: EstadoToma, tl: number) {
  const k = e.toma.hundir ?? 0.62, q = 4, w = Math.ceil(W / q), h = Math.ceil(H / q);
  if (!velo) { const c = document.createElement('canvas'); velo = { c, g: c.getContext('2d')! }; }
  const { c, g } = velo; if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, w, h); g.fillStyle = `rgba(2,1,3,${k})`; g.fillRect(0, 0, w, h);
  g.globalCompositeOperation = 'destination-out';
  for (const f of e.toma.focos ?? []) {
    const p = puntoFoco(e, f, tl); if (!p) continue;
    const [sx, sy] = aPant(p[0], p[1]), x = sx / q, y = (sy - p[2]) / q, r = f.r / q;
    const gr = g.createRadialGradient(x, y, r * 0.15, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${f.k ?? 1})`); gr.addColorStop(0.55, `rgba(0,0,0,${(f.k ?? 1) * 0.6})`); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.save(); g.translate(x, y); g.scale(1, 0.85); g.translate(-x, -y); g.fillStyle = gr; g.fillRect(x - r, y - r * 1.3, r * 2, r * 2.6); g.restore();
  }
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(c, 0, 0, w * q, h * q); ctx.restore();
}
/** El primer término: piezas en silueta, más grandes y corriendo más que la cámara, delante de todo. */
function primerTermino(e: EstadoToma, tl: number, Tz: number) {
  const z = e.z; if (!z) return;
  // cuánto se movió la cámara desde el principio de la toma (en puntos lógicos de la pantalla)
  const cx = (camCine.x - camCine.y) * 16 * Tz / RES, cy = ((camCine.x + camCine.y) * 8 - camCine.alt) * Tz / RES;
  e.mem.cam0 ??= [cx, cy];
  const dx = cx - e.mem.cam0[0], dy = cy - e.mem.cam0[1];
  for (const [n, p] of (e.toma.primer ?? []).entries()) {
    const id = (e.mem['pt' + n] ??= typeof p.id === 'function' ? p.id(z) ?? '' : p.id) as string; if (!id) continue;
    const [oid, v] = id.split('|'), q = objetoMeta(oid, v ?? '')?.f[0]; if (!q) continue;
    const T2 = Tz + (p.mas ?? 1), esc = T2 / RES, par = p.par ?? 1.6;
    const x = Math.round((W * p.fx - dx * par) * RES) / RES, y = Math.round((H * p.fy - dy * par) * RES) / RES;
    ctx.save(); ctx.imageSmoothingEnabled = false;
    if (p.espejo) { ctx.translate(x, 0); ctx.scale(-1, 1); ctx.translate(-x, 0); }
    // el canto que mira a la luz de la toma (hacia el medio de la pantalla) se enciende un punto: sin eso, negro sobre negro
    const lado = (p.fx < 0.5 ? 1 : -1) * (p.espejo ? -1 : 1), u = T2 / RES;
    dibujarTenido(ctx, q, x + lado * u, y - u, p.canto ?? '#5a4a58', 0.85, esc);
    dibujarTenido(ctx, q, x, y, '#040306', p.alfa ?? 0.92, esc);
    ctx.restore();
  }
}
const franja = () => Math.round(H * 0.105);
/** La viñeta de cine: los bordes se hunden (el ojo va al medio). */
let vin: { c: HTMLCanvasElement; w: number; h: number } | null = null;
function vineta() {
  if (!vin || vin.w !== W || vin.h !== H) {
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W / 4)); c.height = Math.max(1, Math.round(H / 4));
    const g = c.getContext('2d')!, R = Math.hypot(c.width, c.height) / 2, gr = g.createRadialGradient(c.width / 2, c.height * 0.5, R * 0.42, c.width / 2, c.height * 0.5, R);
    gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.6, 'rgba(0,0,0,0.32)'); gr.addColorStop(1, 'rgba(0,0,0,0.78)');
    g.fillStyle = gr; g.fillRect(0, 0, c.width, c.height); vin = { c, w: W, h: H };
  }
  ctx.save(); ctx.imageSmoothingEnabled = true; ctx.drawImage(vin.c, 0, 0, W, H); ctx.restore();
}
/** Las franjas de cine. */
function franjas() { ctx.save(); ctx.fillStyle = '#000'; const b = franja(); ctx.fillRect(0, 0, W, b); ctx.fillRect(0, H - b, W, b + 1); ctx.restore(); }
/** Un texto en la letra gótica de pixel, centrado en la franja de abajo (o arriba), con su entrada y salida. */
function dibujarTexto(tx: Texto, tl: number) {
  const k = Math.min(1, Math.max(0, (tl - tx.t0) / 0.7), Math.max(0, (tx.t1 - tl) / 0.6)); if (k <= 0) return;
  let s = IDI ? tx.en : tx.es; if (tx.voz) s = IDI ? `“${s}”` : `«${s}»`;
  const b = franja(), tam = Math.max(E.tactil ? 18 : 17, Math.round(H / 29)), max = W * 0.86;
  // en uno o dos renglones, partido por palabras
  const ren: string[] = [];
  if (medirGotico(s, tam).w <= max) ren.push(s);
  else { const ps = s.split(' '); let a = ''; for (const p of ps) { const n = a ? a + ' ' + p : p; if (medirGotico(n, tam).w > max && a) { ren.push(a); a = p; } else a = n; } if (a) ren.push(a); }
  const lh = Math.round(tam * 1.25), y0 = tx.arriba ? Math.round(b * 0.5 - ((ren.length - 1) * lh) / 2 + tam * 0.36) : Math.round(H - b * 0.5 - ((ren.length - 1) * lh) / 2 + tam * 0.36);
  ctx.save(); ctx.globalAlpha = k;
  ren.forEach((r, i) => textoGotico(r, W / 2, y0 + i * lh, tam, { alin: 'center', tono: tx.tono ?? [242, 230, 204], max, brillo: tx.voz ? 0.1 : 0.2 }));
  ctx.restore();
}

/**
 * Dibuja la película en el instante t (segundos desde que empezó). Devuelve true cuando terminó. Mientras la toma que toca
 * no está lista (zona o atlas bajando) dibuja negro con la brasa latiendo y no avanza: `esperando()` lo dice.
 */
const costo = { n: 0, ms: 0, max: 0, por: {} as Record<string, { n: number; ms: number; max: number }> };
(window as any).__peliCosto = () => costo;
export function dibujarPelicula(g: Guion, d: DatosHeroe, t: number): boolean {
  const c0 = performance.now();
  const r = dibujarPeli(g, d, t);
  const ms = performance.now() - c0, id = (window as any).__cineToma?.id ?? '-', q = (costo.por[id] ??= { n: 0, ms: 0, max: 0 });
  costo.n++; costo.ms += ms; costo.max = Math.max(costo.max, ms); q.n++; q.ms += ms; q.max = Math.max(q.max, ms);
  return r;
}
function dibujarPeli(g: Guion, d: DatosHeroe, t: number): boolean {
  prepararPelicula(g, d);
  const dt = tAnt < 0 || t < tAnt ? 1 / 30 : Math.min(0.1, t - tAnt); tAnt = t;
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  let t0 = 0, i = 0;
  const durDe = (k: number) => (omitidas.has(k) ? 0 : g.tomas[k].dur);
  while (i < g.tomas.length && t >= t0 + durDe(i)) { t0 += durDe(i); i++; }
  // (la toma que no tiene lo que necesita se salta sin aviso: la que sigue empieza en su lugar)
  if (listo && i < g.tomas.length && i !== tomaViva && g.tomas[i].omitir?.({ toma: g.tomas[i], j: null, z: null, ax: 0, ay: 0, actores: new Map(), brasa: reiniciarBrasa(), mem: {}, heroe: d })) { omitidas.add(i); return dibujarPeli(g, d, t); }
  if (i >= g.tomas.length) { terminar(2.5); return true; }
  const tm = g.tomas[i], tl = t - t0;
  if (!listo) { franjas(); return false; }
  if (i !== tomaViva || !estado) {
    tomaViva = i; estado = montar(i);
    // los sonidos se rearman al volver atrás (las pruebas saltan)
    for (const k of [...sonados]) if (!k.startsWith(tm.id + '@')) sonados.delete(k);
  }
  const e = estado!;
  // sonidos de la toma a su tiempo
  for (const s of tm.sonidos ?? []) { const k = `${tm.id}@${s.t}@${s.id}`; if (s.t <= tl && tl - s.t < 0.5 && !sonados.has(k)) { sonados.add(k); sonar(s); } }
  if (e.j && e.z) {
    moverActores(e, tl); moverLuces(e, tl);
    tm.paso?.(e, tl, dt);
    moverSuelto(e.j, dt);
    // la cámara
    const cl = tm.cam ?? [{ t: 0, x: 0, y: 0 }];
    camCine.on = true;
    camCine.x = (entre(cl, tl, (k) => k.x) ?? 0) + e.ax; camCine.y = (entre(cl, tl, (k) => k.y) ?? 0) + e.ay;
    camCine.alt = entre(cl, tl, (k) => k.alt) ?? 0; camCine.fx = entre(cl, tl, (k) => k.fx) ?? 0.5; camCine.fy = entre(cl, tl, (k) => k.fy) ?? 0.5;
    const zk = ultima(cl, tl, (k) => k.zoom)?.zoom ?? 1;
    // el temblor: corrido entero de puntos del dibujo
    let sx = 0, sy = 0;
    for (const [ts, td, f] of tm.temblores ?? []) if (tl >= ts && tl < ts + td) { const q = f * (1 - (tl - ts) / td) * acc.temblor; sx += Math.round((Math.random() - 0.5) * 2 * q); sy += Math.round((Math.random() - 0.5) * 2 * q); }
    camCine.x += (sx + sy * 2) / 32; camCine.y += (sy * 2 - sx) / 32;
    // la cámara nunca está quieta del todo: respira (como una cámara en mano muy leve)
    if (!(window as any).__camaraQuieta) { camCine.x += Math.sin(tl * 0.41 + i) * 0.1 + Math.sin(tl * 0.17) * 0.06; camCine.y += Math.cos(tl * 0.33 + i * 2) * 0.08; camCine.alt += Math.sin(tl * 0.27 + i) * 2; }
    // (el acercamiento es respecto de la pantalla, no de la vista del jugador: zoom 1 deja unos 640 puntos del dibujo de
    //  alto, en cualquier pantalla; siempre a puntos enteros del aparato)
    const Tz = Math.max(1, Math.round((zk * H * RES) / 640));
    const w0 = (window as any).__sinBarras, a0 = (window as any).__sinAmbientePfx, c0 = (window as any).__climaFuera;
    (window as any).__sinBarras = true; (window as any).__sinAmbientePfx = true; (window as any).__climaFuera = tm.sinClima;
    try {
      enMundoA(Tz, () => {
        dibujarMundo(e.j!, dt, t);
        // la brasa, en el aire (después de la luz: es la luz)
        const b = brasaEn(e, tl);
        tm.mundo?.(e, tl, dt);
        dibujarBrasa(ctx, e.brasa, b ? { ...b, sx: (b.x - b.y) * 16, sy: (b.x + b.y) * 8 - b.z } : null, aPant(0, 0), Tz, dt, tl);
        if (tm.focos?.length) hundirMenos(e, tl);
        (window as any).__cineMundo = { MW, MH, cam: { ...cam } };
      });
    } finally { (window as any).__sinBarras = w0; (window as any).__sinAmbientePfx = a0; (window as any).__climaFuera = c0; camCine.on = false; }
    if (tm.primer?.length) primerTermino(e, tl, Tz);
    vineta();
  } else tm.paso?.(e, tl, dt);
  tm.pantalla?.(e, tl, dt);
  // fundidos
  const fe = tm.entra ?? 0.6, fs = tm.sale ?? 0.6;
  const kE = fe > 0 ? Math.min(1, tl / fe) : 1, kS = fs > 0 ? Math.min(1, Math.max(0, (tm.dur - tl) / fs)) : 1;
  if (kE < 1) { ctx.save(); ctx.globalAlpha = 1 - kE; ctx.fillStyle = tm.colorEntra ?? '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  if (kS < 1) { ctx.save(); ctx.globalAlpha = 1 - kS; ctx.fillStyle = tm.colorSale ?? '#000'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  franjas();
  for (const tx of tm.textos ?? []) dibujarTexto(tx, tl);
  if (t > 1.2) pistaSaltar();
  (window as any).__cineToma = { id: tm.id, i, tl };
  return false;
}
function pistaSaltar() {
  const s = E.tactil ? T('Toca para saltar', 'Tap to skip') : T('Clic o Esc para saltar', 'Click or Esc to skip');
  ctx.save(); ctx.globalAlpha = 0.5; textoGotico(s, W - 14, H - 8, 9, { alin: 'right', tono: 'ceniza', talla: 'menuda' }); ctx.restore();
}
function sonar(s: SonidoToma) {
  if (s.cine) Sonido.cine(s.id, { vol: s.vol, tono: s.tono }); else Sonido.efecto(s.id, { vol: s.vol ?? 1, tono: s.tono });
  ((window as any).__cineSonados ??= []).push(s.id);
}
/** Al terminar o saltar: suelta lo de la película. */
export function terminar(fundido = 0.5) {
  camCine.on = false; tomaViva = -1; estado = null; tAnt = -1; sonados.clear();
  Sonido.cineCortar(fundido);
}
/** Suelta las zonas y el guion (para que una película nueva arme de cero). */
export function soltarPelicula() { terminar(); escenas.clear(); guionVivo = null; heroeVivo = null; listo = false; cargando = false; }
/** El estado de la toma viva (las pruebas). */
(window as any).__peliJ = () => estado?.j;
(window as any).__peliEstado = () => ({ listo, cargando, toma: tomaViva, escenas: [...escenas.keys()] });
(window as any).__peliE = () => estado;
export { soltarParticulas };
(window as any).__peliLista = () => peliculaLista();
