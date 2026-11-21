// Los cuadros de la vigilia (elegir héroe guardado, ui/vigilia.ts): cada héroe con exactamente lo que lleva (el mismo
// motor y el mismo equipo que en el mundo: `equipoVisual`, `firmaVisual`), pintado por los obreros de pintor.worker.ts.
//
// - El grande: la presentación de la clase (acción 'seleccion' del motor, 48 cuadros a 12 por segundo: del 0 al 11 el
//   gesto de la clase, del 12 al 47 el reposo que respira, pasa el peso de un pie al otro y mece la tela con el viento),
//   a K veces su alto, con la luz de la fogata horneada (luz_retrato.ts) y su relieve (para la luz avanzada).
// - La carta: el reposo del mundo ('quieto', 8 cuadros) a la escala de la carta, con la luz del juego.
//
// Se pinta de a un cuadro y en un orden que deja ver algo enseguida: primero el cuadro con que arranca el reposo, después
// el reposo salteado (quien dibuja usa el pintado más cercano al que toca, así el bucle se afina mientras llegan), el
// gesto y al final lo que falta. Lo pintado se guarda en su propia base de IndexedDB ('marca_vigilia'): la segunda vez
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
}
const pedidos = new Map<string, Pedido>();

// ------------------------------------------------------------------ el orden en que se pinta
/** El grande: el arranque del reposo, el reposo de a 9, de a 4 o 5, el gesto y lo que falta. */
export function ordenGrande(): number[] {
  const o: number[] = [], pon = (f: number) => { if (!o.includes(f)) o.push(f); };
  for (const f of [12, 30, 21, 39, 16, 25, 34, 43]) pon(f);
  for (let f = 0; f < SEL_ENT; f++) pon(f);
  for (const f of [14, 18, 23, 27, 32, 36, 41, 45]) pon(f);
  for (let f = SEL_ENT; f < SEL_N; f++) pon(f);
  return o;
}
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
const N_OBREROS = () => Math.max(1, Math.min(3, (navigator.hardwareConcurrency || 4) - 1));
/** El próximo cuadro a pintar: el del pedido con más prioridad que se usó hace poco (lo que no se mira hace 1,5 s espera: al salir de la pantalla el juego tiene los núcleos). */
function siguiente(): { p: Pedido; f: number } | null {
  const ahora = performance.now();
  // (primero el cuadro con que arranca el grande, después el primero de cada carta, que son baratos, después el resto)
  const nota = (p: Pedido) => p.prio * 10 + (p.hechos + p.enVuelo.size < 1 ? (p.tipo === 'grande' ? 50 : p.prio > 1 ? 70 : 30) : 0);
  let mejor: Pedido | null = null, nm = -1;
  for (const p of pedidos.values()) {
    if (!p.cargado || !p.cola.length || ahora - p.usado > 1500) continue;
    const v = nota(p);
    if (v > nm || (v === nm && mejor && p.usado > mejor.usado + 50)) { mejor = p; nm = v; }
  }
  if (!mejor) return null;
  const f = mejor.cola.shift()!; mejor.enVuelo.add(f);
  return { p: mejor, f };
}
function dar(w: Worker) {
  const t = siguiente();
  if (!t) { enMano.delete(w); libres.push(w); return; }
  enMano.set(w, t);
  const { p, f } = t;
  if (p.tipo === 'grande') w.postMessage({ id: p.clave, cuerpo: p.cuerpo, equipo: p.equipo, acc: 'seleccion', dir: 'so', vigilia: p.K, fs: [f], clave: String(f), calidad: 1 });
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
    };
    w.onerror = () => { const t = enMano.get(w); if (t) t.p.enVuelo.delete(t.f); dar(w); };
    dar(w);
    if (!enMano.has(w)) return;
  }
}
function llego(p: Pedido, f: number, c: Crudo) {
  if (p.crudos[f]) return;
  if ((c as any).ms) p.msPinta.push(Math.round((c as any).ms));
  // (sin tarjeta no se usa el relieve: no se guarda, y la carta tampoco lo necesita)
  const guardaRel = p.tipo === 'grande' && (hayGPU || !!(window as any).__vigiliaRel);
  p.crudos[f] = { w: c.w, h: c.h, ax: c.ax, ay: c.ay, data: c.data, hoja: c.hoja, rel: guardaRel ? c.rel : undefined, alt: guardaRel ? c.alt : undefined };
  p.hechos++;
  if (p.hechos === 1) p.tListo1 = performance.now() - p.t0;
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
    const q: Pedido = { clave, tipo, K, clase, cuerpo, equipo, n, crudos: new Array(n).fill(null), listos: new Array(n).fill(null), cola: [], enVuelo: new Set(), hechos: 0, usado: performance.now(), prio, cargado: false, t0: performance.now(), tListo1: -1, tListo: -1, msPinta: [] };
    p = q; pedidos.set(clave, q);
    void (async () => {
      const c = await leer(clave);
      if (c && c.length === n) { c.forEach((x, f) => { if (x) { q.crudos[f] = x; q.hechos++; } }); if (q.hechos) q.tListo1 = performance.now() - q.t0; if (q.hechos === n) q.tListo = q.tListo1; }
      q.cola = (tipo === 'grande' ? ordenGrande() : ordenCarta()).filter((f) => !q.crudos[f]);
      q.cargado = true; trabajar();
    })();
    podar();
  }
  p.usado = performance.now(); p.prio = prio;
  if (p.cargado && p.cola.length && libres.length) trabajar();
  else if (p.cargado && p.cola.length && obreros.length < N_OBREROS()) trabajar();
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
export const vigiliaOcupada = () => { const a = performance.now(); for (const p of pedidos.values()) if (p.tipo === 'grande' && a - p.usado < 1500 && (p.cola.length || p.enVuelo.size || !p.cargado)) return true; return false; };
/** Para las pruebas y el informe. */
(window as any).__vigiliaPedidos = () => [...pedidos.values()].map((p) => ({ tipo: p.tipo, clase: p.clase, K: p.K, hechos: p.hechos, n: p.n, ms1: Math.round(p.tListo1), ms: Math.round(p.tListo), pinta: p.msPinta.slice(0, 6) }));
