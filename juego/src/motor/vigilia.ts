// Los cuadros de la vigilia (elegir héroe guardado, ui/vigilia.ts): cada héroe con exactamente lo que lleva (el mismo
// motor y el mismo equipo que en el mundo: `equipoVisual`, `firmaVisual`), pintado por los obreros de pintor.worker.ts.
//
// - El grande: la presentación de la clase (acción 'seleccion' del motor, 48 cuadros a 12 por segundo: del 0 al 11 el
//   gesto de la clase, del 12 al 47 el reposo que respira, pasa el peso de un pie al otro y mece la tela con el viento),
//   a K veces su alto, con la luz de la fogata horneada (luz_retrato.ts) y su relieve (para la luz avanzada).
// - La carta: el reposo del mundo ('quieto', 8 cuadros) a la escala de la carta, con la luz del juego.
//
// Se pinta de a un cuadro y en un orden que deja ver algo enseguida (pulido del 21 nov 2026: la primera vez tardaba 30 a
// 45 s en la nube hasta el bucle entero y el primer cuadro 5 a 7 s):
// 1. el boceto: el cuadro con que arranca el reposo a la mitad de K (un cuarto de los puntos: sale en un segundo, y se ve a
//    puntos dobles, ya con su luz y su fogata, mientras llega el de verdad);
// 2. las claves del reposo, una cada 3 cuadros (12, regadas por el bucle: quien dibuja usa el pintado más cercano);
// 3. lo de entre medio (24 cuadros) no se pinta: se arma de sus dos claves siguiendo el movimiento de cada punto
//    (motor/intermedio.ts, `entrePend`, en el obrero, unos 0,2 s cada uno en vez de 1,5) en cuanto las dos están: el bucle
//    entero a 12 por segundo sale con la mitad de lo que se pintaba (segunda pasada del 21 nov: con el orden solo el total
//    no bajaba);
// 4. el gesto (no sale hasta tener sus 12; sale al elegir y cada 10 s). Lo pintado se guarda en su propia base de IndexedDB ('marca_vigilia'): la segunda vez
// sale entero de una. La clave lleva __PINTOR__: si cambia cómo se pinta el cuerpo, se vuelve a pintar solo.
import Obrero from './pintor.worker.ts?worker&inline';
import { accionesClase } from '../juego/anim';
import { hayGPU } from '../render/luz_gpu';

/** Versión de lo que se hornea acá (la luz de la vigilia o el orden de los cuadros): si cambia, se vuelve a pintar. */
const VIG_V = 1;
const VER = 'V|' + __PINTOR__ + '|' + VIG_V;
/** Cuadros de la presentación: del 0 al 11 el gesto, del 12 al 47 el reposo (el 0 es la misma pose que el 12). */
export const SEL_N = 48, SEL_ENT = 12, SEL_FPS = 12;
/** Cuadros del reposo de la carta. */
export const CARTA_N = 8;

/** Un cuadro listo para dibujar: el color, el calor de la fogata (para que lata), la silueta (sombra y penumbra) y el techo de cada columna (la lluvia que pega en la figura). */
export interface CuadroV {
  cv: HTMLCanvasElement; calor?: HTMLCanvasElement; sil?: HTMLCanvasElement; w: number; h: number; ax: number; ay: number;
  hoja?: number[]; techo?: Int16Array; rel?: HTMLCanvasElement; alt?: HTMLCanvasElement; atlas: string;
}
interface Crudo { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray; rel?: Uint8ClampedArray; alt?: Uint8ClampedArray; hoja?: number[] }
export interface Pedido {
  clave: string; tipo: 'grande' | 'carta'; K: number; clase: string; cuerpo: any; equipo: any; n: number;
  crudos: (Crudo | null)[]; listos: (CuadroV | null)[]; cola: number[]; enVuelo: Set<number>; hechos: number;
  usado: number; prio: number; cargado: boolean; t0: number; tListo1: number; tListo: number; msPinta: number[];
  /** el boceto (solo el grande): el cuadro 12 a la mitad de K, lo primero que se pinta */
  boceto: Crudo | null; bocetoV: CuadroV | null; bocetoPide: boolean; tBoceto: number;
  /** cuándo quedó el reposo de a dos (el bucle entero a 6 por segundo), el gesto y el reposo entero (ms desde el pedido) */
  tPares: number; tGesto: number; tReposo: number;
  /** lo que tardó cada intermedio en el obrero (ms) */
  msEntre: number[];
  /** lo armado que no casó (falla alta): se pinta */
  sinEntre: Set<number>;
}
/** El cuadro del boceto en la cola de los obreros (no es un índice de la acción). */
const BOCETO = -1;
const pedidos = new Map<string, Pedido>();

// ------------------------------------------------------------------ el orden en que se pinta
/** El grande: el arranque del reposo, los pares del reposo salteados (de a 8, de a 4, de a 2), los impares y el gesto. */
export function ordenGrande(): number[] {
  const o: number[] = [], pon = (f: number) => { if (!o.includes(f)) o.push(f); };
  // (`__ordenViejo`: el de antes, para medir contra lo mismo: el arranque, el reposo de a 9, el gesto, de a 4 y lo que falta)
  if ((window as any).__ordenViejo) {
    for (const f of [12, 30, 21, 39, 16, 25, 34, 43]) pon(f);
    for (let f = 0; f < SEL_ENT; f++) pon(f);
    for (const f of [14, 18, 23, 27, 32, 36, 41, 45]) pon(f);
    for (let f = SEL_ENT; f < SEL_N; f++) pon(f);
    return o;
  }
  if (!entreVivo()) {
    for (const f of [12, 30, 20, 38, 16, 24, 34, 42]) pon(f);
    for (let f = SEL_ENT; f < SEL_N; f += 2) pon(f);
    for (let f = SEL_ENT + 1; f < SEL_N; f += 2) pon(f);
  } else {
    // las claves del reposo, regadas (cada una lejos de las que ya están: el bucle se afina parejo mientras llegan); lo
    // de entre medio no se pinta, se arma de sus dos claves (`entrePend`)
    const G = pasoEntre(), claves: number[] = []; for (let f = SEL_ENT; f < SEL_N; f += G) claves.push(f);
    const dist = (a: number, b: number) => { const d = Math.abs(a - b); return Math.min(d, SEL_N - SEL_ENT - d); };
    pon(SEL_ENT);
    while (o.length < claves.length) { let mej = -1, md = -1; for (const f of claves) if (!o.includes(f)) { const d = Math.min(...o.map((x) => dist(x, f))); if (d > md) { md = d; mej = f; } } pon(mej); }
  }
  for (let f = 0; f < SEL_ENT; f++) pon(f);
  return o;
}
/** Cada cuántos cuadros del reposo hay una clave pintada (3: 12 claves y 24 armados; `__pasoEntre = 2` las 18 pares). */
const pasoEntre = () => { const g = +((window as any).__pasoEntre ?? 3); return g === 2 || g === 3 || g === 4 ? g : 3; };
/** Entre qué claves cae el cuadro f del reposo y a qué altura (0 a 1). */
function clavesDe(f: number): [number, number, number] {
  const G = pasoEntre(), a = SEL_ENT + Math.floor((f - SEL_ENT) / G) * G, b = a + G < SEL_N ? a + G : SEL_ENT;
  return [a, b, (f - a) / G];
}
/**
 * Lo de entre las claves del reposo se arma de ellas (motor/intermedio.ts, siguiendo el movimiento de cada punto, en el
 * obrero). El reposo respira despacio y se corre unos puntos de una clave a la otra: el armado no se distingue del pintado
 * (lab, berserker a K 2,6: 8 a 12 de diferencia media contra el pintado, lo mismo que hay entre dos pintados seguidos, que
 * es el grano que cambia; arcanista 3 a 5). El gesto no: se mueve mucho (22 % de la silueta cambia de un cuadro al otro, y
 * entre dos claves que se parecen puede pasar otra cosa) y se pinta entero. `__sinIntermedios` vuelve a pintar los 48 y
 * `__pasoEntre = 2` pinta las 18 pares (una clave cada dos).
 */
const entreVivo = () => !(window as any).__sinIntermedios && !(window as any).__ordenViejo;
/** Hasta dónde un armado vale (lab: el reposo da 0,004 a 0,017; el gesto, que no se arma así, hasta 0,3). */
const FALLA_MAX = 0.04;
/** El próximo cuadro del reposo para armar que ya tiene sus dos claves (el 45 empalma con el 12), o -1. */
function entrePend(p: Pedido): number {
  if (p.tipo !== 'grande' || !entreVivo()) return -1;
  const G = pasoEntre();
  for (let f = SEL_ENT; f < SEL_N; f++) {
    if ((f - SEL_ENT) % G === 0 || p.crudos[f] || p.enVuelo.has(f) || p.sinEntre.has(f)) continue;
    const [a, b] = clavesDe(f);
    if (p.crudos[a] && p.crudos[b]) return f;
  }
  return -1;
}
/** ¿Están todos los cuadros de f0 a f1 (de a `paso`)? */
const todos = (p: Pedido, f0: number, f1: number, paso: number) => { for (let f = f0; f < f1; f += paso) if (!p.crudos[f]) return false; return true; };
const ordenCarta = () => [0, 4, 2, 6, 1, 3, 5, 7];

// ------------------------------------------------------------------ IndexedDB propia (si no hay, se pinta igual)
let dbP: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  return (dbP ??= new Promise((ok) => {
    const t = setTimeout(() => ok(null), 1200);
    try { const r = indexedDB.open('marca_vigilia', 1); r.onupgradeneeded = () => r.result.createObjectStore('v'); r.onsuccess = () => { clearTimeout(t); ok(r.result); }; r.onerror = r.onblocked = () => { clearTimeout(t); ok(null); }; } catch { clearTimeout(t); ok(null); }
  }));
}
async function leer(k: string): Promise<(Crudo | null)[] | null> {
  const d = await db(); if (!d) return null;
  return new Promise((ok) => { const tt = setTimeout(() => ok(null), 1500); try { const q = d.transaction('v').objectStore('v').get(k); q.onsuccess = () => { clearTimeout(tt); ok(q.result ?? null); }; q.onerror = () => { clearTimeout(tt); ok(null); }; } catch { clearTimeout(tt); ok(null); } });
}
/** Guarda (los grandes pesan unos 10 MB: quedan los últimos 5, y las cartas las últimas 16). */
async function escribir(p: Pedido) {
  const d = await db(); if (!d) return;
  try {
    const st = d.transaction('v', 'readwrite').objectStore('v'); st.put(p.crudos, p.clave);
    const lk = 'vigilia.claves.' + p.tipo, tope = p.tipo === 'grande' ? 5 : 16;
    let ks: string[] = []; try { ks = JSON.parse(localStorage.getItem(lk) ?? '[]'); } catch { /* nada */ }
    ks = [p.clave, ...ks.filter((x) => x !== p.clave)];
    for (const x of ks.slice(tope)) st.delete(x);
    try { localStorage.setItem(lk, JSON.stringify(ks.slice(0, tope))); } catch { /* nada */ }
  } catch { /* sin espacio */ }
}

// ------------------------------------------------------------------ los obreros (compartidos por todos los pedidos)
const obreros: Worker[] = [];
const libres: Worker[] = [];
const enMano = new Map<Worker, { p: Pedido; f: number }>();
// (de 3 a 5: en una máquina de 8 núcleos el tope de 3 dejaba la mitad parada; en 4 núcleos siguen 3)
const N_OBREROS = () => Math.max(1, Math.min(5, (navigator.hardwareConcurrency || 4) - 1));
/** El próximo cuadro a pintar: el del pedido con más prioridad que se usó hace poco (lo que no se mira hace 1,5 s espera: al salir de la pantalla el juego tiene los núcleos). */
function siguiente(): { p: Pedido; f: number; entre?: boolean } | null {
  const ahora = performance.now();
  // (primero el cuadro con que arranca el grande, después el primero de cada carta, que son baratos, después el resto)
  const nota = (p: Pedido) => p.prio * 10 + (p.bocetoPide ? 200 : 0) + (p.hechos + p.enVuelo.size < 1 ? (p.tipo === 'grande' ? 50 : p.prio > 1 ? 70 : 30) : 0);
  let mejor: Pedido | null = null, nm = -1;
  for (const p of pedidos.values()) {
    if (!p.cargado || (!p.cola.length && !p.bocetoPide && entrePend(p) < 0) || ahora - p.usado > 1500) continue;
    const v = nota(p);
    if (v > nm || (v === nm && mejor && p.usado > mejor.usado + 50)) { mejor = p; nm = v; }
  }
  if (!mejor) return null;
  if (mejor.bocetoPide) { mejor.bocetoPide = false; mejor.enVuelo.add(BOCETO); return { p: mejor, f: BOCETO }; }
  // (un intermedio listo para armar va antes que el próximo cuadro: es barato y completa el bucle)
  const fe = entrePend(mejor);
  if (fe >= 0) { mejor.enVuelo.add(fe); return { p: mejor, f: fe, entre: true }; }
  if (!mejor.cola.length) return null;
  const f = mejor.cola.shift()!; mejor.enVuelo.add(f);
  return { p: mejor, f };
}
function dar(w: Worker) {
  const t = siguiente();
  if (!t) { enMano.delete(w); libres.push(w); return; }
  enMano.set(w, t);
  const { p, f } = t;
  if (t.entre) { const [a, b, S] = clavesDe(f); w.postMessage({ id: p.clave, cuerpo: p.cuerpo, equipo: p.equipo, acc: 'seleccion', dir: 'so', entre: { a: p.crudos[a], b: p.crudos[b], S, R: pasoEntre() > 2 ? 4 : 3, K: p.K, f }, clave: String(f) }); }
  else if (p.tipo === 'grande') w.postMessage({ id: p.clave, cuerpo: p.cuerpo, equipo: p.equipo, acc: 'seleccion', dir: 'so', vigilia: f === BOCETO ? kBoceto(p.K) : p.K, fs: [f === BOCETO ? SEL_ENT : f], clave: String(f), calidad: 1 });
  else { const n = accionesClase(p.clase).find((a) => a[0] === 'quieto')?.[1] ?? 4; w.postMessage({ id: p.clave, cuerpo: p.cuerpo, equipo: p.equipo, acc: 'quieto', dir: 'so', muneco: p.K, fs: [(f * n) / CARTA_N], clave: String(f), calidad: 1 }); }
}
function trabajar() {
  while (libres.length) { const w = libres.pop()!; dar(w); if (!enMano.has(w)) return; }
  while (obreros.length < N_OBREROS()) {
    let w: Worker; try { w = new Obrero(); } catch { return; }
    obreros.push(w);
    w.onmessage = (ev) => {
      const m = ev.data, t = enMano.get(w);
      if (t && m.id === t.p.clave) {
        const p = t.p, f = +m.clave, c = m.out?.[0];
        p.enVuelo.delete(f);
        if (!m.error && c) llego(p, f, c); else if (m.error) console.warn('vigilia', m.error);
      }
      dar(w);
      // (lo que llegó puede dejar listo un intermedio: que lo tome un obrero que estaba parado)
      if (libres.length) trabajar();
    };
    w.onerror = () => { const t = enMano.get(w); if (t) t.p.enVuelo.delete(t.f); dar(w); };
    dar(w);
    if (!enMano.has(w)) return;
  }
}
/** El K del boceto: la mitad (se ve a puntos dobles). */
export const kBoceto = (K: number) => K / 2;
function llego(p: Pedido, f: number, c: Crudo) {
  if (f === BOCETO) { if (!p.boceto) { p.boceto = { w: c.w, h: c.h, ax: c.ax, ay: c.ay, data: c.data, hoja: c.hoja }; p.tBoceto = performance.now() - p.t0; } return; }
  if (p.crudos[f]) return;
  // un intermedio cuyos vecinos no casaron (algo se movió de más entre los dos): ese cuadro se pinta, primero en la cola
  if ((c as any).entre && ((c as any).falla ?? 0) > FALLA_MAX) { p.sinEntre.add(f); p.cola.unshift(f); return; }
  if ((c as any).ms) ((c as any).entre ? p.msEntre : p.msPinta).push(Math.round((c as any).ms));
  // (sin tarjeta no se usa el relieve: no se guarda, y la carta tampoco lo necesita)
  const guardaRel = p.tipo === 'grande' && (hayGPU || !!(window as any).__vigiliaRel);
  p.crudos[f] = { w: c.w, h: c.h, ax: c.ax, ay: c.ay, data: c.data, hoja: c.hoja, rel: guardaRel ? c.rel : undefined, alt: guardaRel ? c.alt : undefined };
  p.hechos++;
  const ya = performance.now() - p.t0;
  if (p.hechos === 1) p.tListo1 = ya;
  if (p.tipo === 'grande') {
    if (p.tPares < 0 && todos(p, SEL_ENT, SEL_N, entreVivo() ? pasoEntre() : 2)) p.tPares = ya;
    if (p.tGesto < 0 && todos(p, 0, SEL_ENT, 1)) p.tGesto = ya;
    if (p.tReposo < 0 && todos(p, SEL_ENT, SEL_N, 1)) p.tReposo = ya;
  }
  if (p.hechos === p.n) { p.tListo = performance.now() - p.t0; void escribir(p); }
  else if (p.tipo === 'grande' && p.hechos % 16 === 0) void escribir(p);
}

/**
 * Los cuadros de un héroe para la vigilia. Devuelve el pedido (siempre el mismo para la misma clave): `crudos[f]` dice
 * qué cuadro ya está, y `cuadro(p, f)` lo arma para dibujar la primera vez que se pide.
 */
export function pedirVigilia(tipo: 'grande' | 'carta', clase: string, cuerpo: any, equipo: any, firma: string, K: number, prio: number): Pedido {
  const clave = VER + '|' + tipo + '|' + clase + '|' + K + '|' + firma;
  let p = pedidos.get(clave);
  if (!p) {
    const n = tipo === 'grande' ? SEL_N : CARTA_N;
    const q: Pedido = { clave, tipo, K, clase, cuerpo, equipo, n, crudos: new Array(n).fill(null), listos: new Array(n).fill(null), cola: [], enVuelo: new Set(), hechos: 0, usado: performance.now(), prio, cargado: false, t0: performance.now(), tListo1: -1, tListo: -1, msPinta: [],
      boceto: null, bocetoV: null, bocetoPide: false, tBoceto: -1, tPares: -1, tGesto: -1, tReposo: -1, msEntre: [], sinEntre: new Set() };
    p = q; pedidos.set(clave, q);
    void (async () => {
      const c = await leer(clave);
      if (c && c.length === n) { c.forEach((x, f) => { if (x) { q.crudos[f] = x; q.hechos++; } }); if (q.hechos) q.tListo1 = performance.now() - q.t0; if (q.hechos === n) q.tListo = q.tListo1; }
      q.cola = (tipo === 'grande' ? ordenGrande() : ordenCarta()).filter((f) => !q.crudos[f]);
      // (sin el cuadro con que arranca el reposo, el boceto va primero; si ya vino de IndexedDB, no hace falta)
      if (tipo === 'grande' && !q.crudos[SEL_ENT] && !(window as any).__sinBoceto && !(window as any).__ordenViejo) q.bocetoPide = true;
      if (tipo === 'grande' && q.hechos) { const a = q.tListo1; if (todos(q, SEL_ENT, SEL_N, 2)) q.tPares = a; if (todos(q, 0, SEL_ENT, 1)) q.tGesto = a; if (todos(q, SEL_ENT, SEL_N, 1)) q.tReposo = a; }
      q.cargado = true; trabajar();
    })();
    podar();
  }
  p.usado = performance.now(); p.prio = prio;
  const hay = p.cola.length || p.bocetoPide || entrePend(p) >= 0;
  if (p.cargado && hay && libres.length) trabajar();
  else if (p.cargado && hay && obreros.length < N_OBREROS()) trabajar();
  return p;
}
/** Suelta de la memoria los pedidos grandes que hace rato no se miran (quedan en IndexedDB). */
function podar() {
  const grandes = [...pedidos.values()].filter((p) => p.tipo === 'grande').sort((a, b) => b.usado - a.usado);
  for (const p of grandes.slice(4)) if (!p.enVuelo.size) pedidos.delete(p.clave);
  const cartas = [...pedidos.values()].filter((p) => p.tipo === 'carta').sort((a, b) => b.usado - a.usado);
  for (const p of cartas.slice(24)) if (!p.enVuelo.size) pedidos.delete(p.clave);
}

// ------------------------------------------------------------------ armar un cuadro para dibujar
const lienzo = (d: Uint8ClampedArray, w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')!.putImageData(new ImageData(d as any, w, h), 0, 0); return c; };
/** Hacia dónde está la fogata del cuadro (la de luz_retrato: delante y a la izquierda de su cara, baja), en el sistema de la normal en pantalla. */
const nrm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const LF = nrm([-0.75, 0.55, 0.2]);
/**
 * El calor de la fogata: lo que mira al fuego, de su color, para sumarlo encima con el latido de la llama. Con relieve
 * sale de la normal; sin él (la carta), del borde de la silueta que mira a la izquierda y de lo bajo.
 */
function calorDe(c: Crudo): Uint8ClampedArray {
  const { w, h, data: d, rel } = c, o = new Uint8ClampedArray(d.length);
  const A = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4; if (!d[i + 3]) continue;
    let k = 0;
    const ra = rel ? rel[i + 3] / 255 : 0, emite = ra > 0.38 && ra < 0.62;
    if (rel && ra >= 0.3 && !emite) {
      const n0 = rel[i] / 127.5 - 1, n1 = rel[i + 1] / 127.5 - 1, n2 = rel[i + 2] / 127.5 - 1;
      const n = nrm([(n0 - n1) * 0.7071, (n0 + n1) * 0.7071, n2]);
      k = Math.max(0, n[0] * LF[0] + n[1] * LF[1] + n[2] * LF[2]) ** 1.3;
    } else if (!emite) k = A(x - 1, y) === 0 || A(x - 2, y) === 0 ? 0.8 : 0.12;
    // más abajo, más cerca del fuego
    k *= 0.55 + 0.45 * (y / h);
    const lum = (0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2]) / 255;
    const v = k * (0.35 + lum) * 255;
    o[i] = Math.min(255, v * 1.0); o[i + 1] = Math.min(255, v * 0.5); o[i + 2] = Math.min(255, v * 0.2); o[i + 3] = d[i + 3];
  }
  return o;
}
/** El cuadro f listo para dibujar (se arma la primera vez que se pide: así lo que llega de IndexedDB no traba un cuadro). */
export function cuadroV(p: Pedido, f: number): CuadroV | null {
  const ya = p.listos[f]; if (ya) return ya;
  const c = p.crudos[f]; if (!c) return null;
  const sil = new Uint8ClampedArray(c.data.length), techo = new Int16Array(c.w).fill(-1);
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const i = (y * c.w + x) * 4 + 3; if (c.data[i] > 40) { sil[i] = 255; if (techo[x] < 0) techo[x] = y; } }
  const q: CuadroV = {
    cv: lienzo(c.data, c.w, c.h), w: c.w, h: c.h, ax: c.ax, ay: c.ay, hoja: c.hoja, techo, atlas: p.clave + '#' + f,
    sil: lienzo(sil, c.w, c.h), calor: lienzo(calorDe(c), c.w, c.h),
    rel: c.rel ? lienzo(c.rel, c.w, c.h) : undefined, alt: c.alt ? lienzo(c.alt, c.w, c.h) : undefined,
  };
  p.listos[f] = q;
  return q;
}
/** El boceto listo para dibujar (a la mitad de K: se pega a puntos dobles), o null. */
export function bocetoV(p: Pedido): CuadroV | null {
  if (p.bocetoV) return p.bocetoV;
  const c = p.boceto; if (!c) return null;
  const sil = new Uint8ClampedArray(c.data.length);
  for (let i = 3; i < c.data.length; i += 4) if (c.data[i] > 40) sil[i] = 255;
  p.bocetoV = { cv: lienzo(c.data, c.w, c.h), w: c.w, h: c.h, ax: c.ax, ay: c.ay, hoja: c.hoja, atlas: p.clave + '#b', sil: lienzo(sil, c.w, c.h), calor: lienzo(calorDe(c), c.w, c.h) };
  return p.bocetoV;
}
/** El cuadro pintado más cercano a `f` dentro de [desde, hasta) (cíclico), o null si no hay ninguno. */
export function cercano(p: Pedido, f: number, desde: number, hasta: number): number | null {
  const n = hasta - desde;
  for (let d = 0; d <= n / 2; d++) {
    const a = desde + ((((f - desde - d) % n) + n) % n), b = desde + ((((f - desde + d) % n) + n) % n);
    if (p.crudos[a]) return a; if (p.crudos[b]) return b;
  }
  return null;
}
/**
 * ¿Hay un grande a medio pintar que se está mirando? Mientras tanto el pintor del mundo (el héroe elegido en todas sus
 * acciones, main.ts) espera: los dos a la vez se peleaban los núcleos y el de la vigilia tardaba el triple.
 */
export const vigiliaOcupada = () => { const a = performance.now(); for (const p of pedidos.values()) if (p.tipo === 'grande' && a - p.usado < 1500 && (p.cola.length || p.enVuelo.size || p.bocetoPide || !p.cargado || entrePend(p) >= 0)) return true; return false; };
/** Para las pruebas y el informe. */
(window as any).__vigiliaPedidos = () => [...pedidos.values()].map((p) => ({ tipo: p.tipo, clase: p.clase, K: p.K, hechos: p.hechos, n: p.n, msBoceto: Math.round(p.tBoceto), ms1: Math.round(p.tListo1), msPares: Math.round(p.tPares), msGesto: Math.round(p.tGesto), msReposo: Math.round(p.tReposo), ms: Math.round(p.tListo), pinta: p.msPinta.slice(0, 6), entre: p.msEntre.slice(0, 6), nEntre: p.msEntre.length }));
