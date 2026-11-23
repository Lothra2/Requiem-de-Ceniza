// Carga de los atlas horneados y dibujo de cuadros. Los atlas se bajan cuando hacen falta (por zona).
export interface Cuadro {
  img: CanvasImageSource | null;
  atlas: string;
  x: number; y: number; w: number; h: number;
  /** Ancla: el pixel que va sobre el punto del piso. */
  ax: number; ay: number;
  /** Hoja del arma (de la mano a la punta) relativa al ancla, si es personaje. */
  /** de la mano a la punta, y (si lo pintó el aparato) la máscara de tramos que se ven (ver motor/hoja.ts) */
  hoja?: [number, number, number, number] | number[];
  /** Luz por GPU: relieve y alto del cuadro pintado en vivo (los horneados los traen en sus atlas gemelos). */
  rel?: CanvasImageSource; alt?: CanvasImageSource;
}
export interface ObjMeta { f: Cuadro[]; t: number; hu: [number, number]; b: number; tema: string; luz: [number, string, number] | 0; plano: number }
interface Manifiesto { atlas: Record<string, [string, number, number]>; h: Record<string, any[]>; m: Record<string, any[]>; o: Record<string, any>; p: Record<string, any[]>; i?: Record<string, any[]>; w?: Record<string, any[]>; wm?: Record<string, any>; r?: Record<string, any[]>; za?: Record<string, number> }

let man: Manifiesto | null = null;
const imgs = new Map<string, HTMLImageElement | ImageBitmap | HTMLCanvasElement>();
const cargando = new Map<string, Promise<void>>();
const cuadros = new Map<string, Cuadro[]>();
const objetos = new Map<string, ObjMeta>();
export const BASE = './assets/';

const aCuadro = (e: any[]): Cuadro => ({ img: null, atlas: e[0], x: e[1], y: e[2], w: e[3], h: e[4], ax: e[5], ay: e[6], hoja: e.length >= 12 ? e.slice(7) : e.length >= 11 ? [e[7], e[8], e[9], e[10]] : undefined });

export async function cargarManifiesto(): Promise<void> {
  const r = await fetch(BASE + 'manifiesto.json');
  man = await r.json();
}
export const manifiesto = () => man!;

// Descargas: como mucho MAX_DESCARGAS a la vez, con reintentos de espera creciente.
// Si un atlas falla del todo, se borra de `cargando` y se vuelve a pedir pasado un rato
// (antes la promesa resuelta quedaba ahí y el atlas no volvía a bajar nunca: jefe sin cuerpo).
const MAX_DESCARGAS = 4;
const REINTENTOS = 5;
let activas = 0;
const cola: (() => void)[] = [];
const fallo = new Map<string, number>();
const usado = new Map<string, number>();
/** Hora del cuadro actual, para el LRU sin llamar a performance.now() en cada dibujo. */
let ahoraCuadro = 0;
export const marcarCuadro = (t: number) => { ahoraCuadro = t; };
const turno = () => new Promise<void>((ok) => { if (activas < MAX_DESCARGAS) { activas++; ok(); } else cola.push(() => { activas++; ok(); }); });
const soltarTurno = () => { activas--; const s = cola.shift(); if (s) s(); };
// Los atlas van como ImageBitmap: se decodifican UNA vez y quedan listos. Como <img>, Chrome los guarda en un caché de
// imágenes decodificadas con tope; con el relieve (color, normales y altura por atlas) una zona pasaba ese tope y Chrome
// volvía a descomprimir los WebP en cada cuadro: 900 ms de "mundo" y 9 mil llamadas en la RTX 2080 de Rick (19 nov 2026).
const aBitmap = (im: HTMLImageElement): Promise<ImageBitmap | HTMLImageElement> =>
  typeof createImageBitmap === 'function' ? createImageBitmap(im).catch(() => im) : Promise.resolve(im);
// En un PC con tarjeta gráfica de verdad cada atlas se pega UNA vez en un lienzo, que vive en la tarjeta: dibujar desde un
// ImageBitmap le costaba a Chrome entre 0,5 y 3,5 ms por cuadro y por atlas grande (lo que el medidor F3 de Rick mostraba
// arriba de todo: "drawImage pantalla <- ImageBitmap 2044x1144"); desde un lienzo de la tarjeta es una copia de textura.
// Sale punto por punto igual (el mismo dibujo, sin escalar). Si la tarjeta se reinicia, el lienzo queda vacío: se suelta
// y se vuelve a bajar (del caché del navegador). En el teléfono y el iPad queda el ImageBitmap (la memoria es justa).
// `__atlasBitmap` lo apaga, `__atlasLienzo` lo fuerza (pruebas en la nube, donde no hay tarjeta).
let lienzoAtlas: boolean | null = null;
const atlasEnLienzo = (): boolean => {
  const w = window as any; if (w.__atlasBitmap) return false; if (w.__atlasLienzo) return true;
  if (lienzoAtlas === null) lienzoAtlas = !!w.__gpu?.ok && !(typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches);
  return lienzoAtlas;
};
const alPerder = new Set<() => void>();
/** Lo que hay que soltar si la tarjeta gráfica se reinicia (los lienzos guardados quedan vacíos). */
export const siSePierdeLaTarjeta = (f: () => void) => { alPerder.add(f); };
function aLienzo(b: ImageBitmap | HTMLImageElement, perder: () => void): HTMLCanvasElement | ImageBitmap | HTMLImageElement {
  try {
    const c = document.createElement('canvas'); c.width = b.width; c.height = b.height;
    const g = c.getContext('2d'); if (!g) return b;
    g.drawImage(b, 0, 0);
    c.addEventListener('contextlost', perder);
    if (b instanceof ImageBitmap) b.close();
    return c;
  } catch { return b; }
}
let perdida = false;
function tarjetaPerdida() {
  if (perdida) return; perdida = true;
  setTimeout(() => { perdida = false; }, 0);
  // los atlas en lienzo se sueltan (se vuelven a pedir al dibujar) y lo guardado por otros (trozos del piso, mapa) también
  for (const [n, im] of imgs) if (im instanceof HTMLCanvasElement) { imgs.delete(n); usado.delete(n); }
  for (const [n, r] of rels) if (r instanceof HTMLCanvasElement) rels.delete(n);
  const limpiar = (q: Cuadro) => { if (q.img instanceof HTMLCanvasElement) q.img = null; };
  for (const l of cuadros.values()) l.forEach(limpiar);
  for (const o of objetos.values()) o.f.forEach(limpiar);
  for (const f of alPerder) f();
}
function bajar(url: string): Promise<HTMLImageElement | ImageBitmap | HTMLCanvasElement | null> {
  return new Promise((ok) => {
    const im = new Image();
    im.onload = () => { aBitmap(im).then((b) => { if (b !== im) im.src = ''; ok(atlasEnLienzo() ? (aLienzo(b, tarjetaPerdida) as any) : b); }); };
    im.onerror = () => ok(null);
    im.src = url;
  });
}
export function cargarAtlas(nombre: string): Promise<void> {
  if (imgs.has(nombre)) return Promise.resolve();
  let p = cargando.get(nombre);
  if (p) return p;
  const archivo = man!.atlas[nombre]?.[0];
  if (!archivo) return Promise.resolve();
  const f = fallo.get(nombre);
  if (f && performance.now() - f < 4000) return Promise.resolve();
  p = (async () => {
    for (let i = 0; i < REINTENTOS; i++) {
      if (i) await new Promise((r) => setTimeout(r, 300 * 2 ** i));
      await turno();
      const im = await bajar(BASE + archivo + (i ? `?r=${i}` : ''));
      soltarTurno();
      if (im) { imgs.set(nombre, im); usado.set(nombre, performance.now()); fallo.delete(nombre); cargando.delete(nombre); return; }
    }
    console.warn('no cargó', archivo);
    fallo.set(nombre, performance.now());
    cargando.delete(nombre);
  })();
  cargando.set(nombre, p);
  return p;
}
const bytesAtlas = (n: string) => { const a = man?.atlas[n]; return a ? a[1] * a[2] * 4 : 0; };
/** Memoria de atlas decodificados en MB (aprox.). */
export const memoriaAtlas = () => { let t = 0; for (const n of imgs.keys()) t += bytesAtlas(n); return t / 1e6; };
/** Libera atlas que no están en `mantener`, del menos usado al más reciente, hasta quedar bajo el tope (MB).
 *  Lo de la zona anterior suele sobrevivir si cabe, así volver atrás no recarga nada. */
export function liberarAtlas(mantener: Set<string>, topeMB = 500, edadMs = 5000): string[] {
  let total = memoriaAtlas() * 1e6;
  const tope = topeMB * 1e6;
  if (total <= tope) return [];
  const ahora = performance.now();
  const cand = [...imgs.keys()].filter((n) => !mantener.has(n) && ahora - (usado.get(n) ?? 0) > edadMs).sort((a, b) => (usado.get(a) ?? 0) - (usado.get(b) ?? 0));
  const fuera = new Set<string>();
  for (const n of cand) { if (total <= tope) break; total -= bytesAtlas(n); fuera.add(n); }
  if (!fuera.size) return [];
  for (const n of fuera) { const im = imgs.get(n); imgs.delete(n); usado.delete(n); if (im instanceof HTMLImageElement) im.src = ''; else if (im instanceof HTMLCanvasElement) im.width = im.height = 0; else (im as ImageBitmap)?.close?.(); }
  // los cuadros guardan la imagen: soltarla para que se pueda recoger y se vuelva a pedir al dibujar
  const limpiar = (q: Cuadro) => { if (q.img && fuera.has(q.atlas)) q.img = null; };
  for (const l of cuadros.values()) l.forEach(limpiar);
  for (const o of objetos.values()) o.f.forEach(limpiar);
  return [...fuera];
}
/** Pide atlas en segundo plano (p. ej. el jefe de la zona siguiente). */
export function precargar(nombres: Iterable<string>) { for (const n of nombres) if (!imgs.has(n)) cargarAtlas(n); }
export const atlasListo = (n: string) => imgs.has(n);
export async function asegurar(nombres: Iterable<string>, progreso?: (h: number, t: number) => void) {
  const ns = [...new Set(nombres)].filter((n) => !imgs.has(n));
  let h = 0;
  progreso?.(0, ns.length);
  await Promise.all(ns.map((n) => cargarAtlas(n).then(() => progreso?.(++h, ns.length))));
}

function lista(grupo: 'h' | 'm' | 'p' | 'i' | 'r' | 'sel', clave: string): Cuadro[] {
  const k = grupo + ':' + clave;
  let c = cuadros.get(k);
  if (!c) { const raw = (man as any)?.[grupo]?.[clave]; c = raw ? raw.map(aCuadro) : []; cuadros.set(k, c!); }
  return c!;
}
/**
 * El paso fino horneado del héroe con su equipo de salida (rumbo k de 16, o 'k~' los medios cuadros). Solo si sus
 * atlas ya bajaron: si no, los pide y devuelve null (el héroe sigue en sus 8 rumbos un instante, no desaparece).
 */
export function cuadrosHeroeFinos(clase: string, acc: string, k: number | string): Cuadro[] | null {
  const fs = lista('h', `${clase}/${acc}@${k}`); if (!fs.length) return null;
  let listo = true; for (const q of fs) if (!q.img && !imgs.has(q.atlas)) { listo = false; void cargarAtlas(q.atlas); }
  return listo ? fs : null;
}
export const hayFinosHorneados = (clase: string) => lista('h', `${clase}/caminar@1`).length > 0;
export const cuadrosHeroe = (clase: string, acc: string, dir: string) => lista('h', `${clase}/${acc}/${dir}`);
export const cuadrosMonstruo = (id: string, acc: string, dir: string) => lista('m', `${id}/${acc}/${dir}`);
export const cuadrosPiso = (id: string, v: number) => lista('p', `${id}|${v}`);
/** Pisos cuya textura se repite cada dos baldosas (ver pisos.ts de la Forja): la variante sale de la posición de la baldosa. */
const PISO_DOBLE = new Set(['a3_hojarasca', 'a3_agua_negra', 'a3_lodo', 'a3_cueva_agua', 'a3_telarana', 'a3_mosaico', 'a3_escalones', 'a3_carne', 'pasto', 'pasto_seco', 'tierra', 'empedrado', 'lajas', 'lajas_musgo', 'baldosa_catedral', 'madera', 'cueva', 'arena', 'arenisca', 'ladrillo_cloaca', 'nieve', 'hielo', 'selva', 'hueso', 'tierra_infierno',
  // los del acto 2 (catalogo/acto2_pisos.ts)
  'a2_arena_duna', 'a2_barro_seco', 'a2_barro_orilla', 'a2_losa_calle', 'a2_losa_pozo', 'a2_agua_negra', 'a2_losa_sol', 'a2_losa_rey', 'a2_losa_dormidos', 'a2_cueva_quitina',
  'a6_arena_gris', 'a6_coral', 'a6_adoquin', 'a6_plaza', 'a6_agua_cripta', 'a6_tablas', 'a6_piedra_faro',
  'a7_astros', 'a7_relicario', 'a7_peldanos', 'a7_sed', 'a7_ceniza_marmol', 'a7_musgo_oro', 'a7_oro_losas', 'a7_losas_ceniza']);
export const variantePiso = (id: string, v: number, bx: number, by: number) => (PISO_DOBLE.has(id) ? (bx & 1) + 2 * (by & 1) + 4 * (v & 1) : v);
/** Retrato grande de la clase en su pose de presentación (nivel 0 novato, 2 leyenda). */
/** Alto en pixeles del héroe de la presentación (horneado a 2,25 veces el del juego): se dibuja a puntos enteros. */
export const RETRATO_ALTO = 225;
export const cuadrosRetrato = (id: string, nivel: number) => lista('r', `${id}/${nivel}`);
/** Presentación de la selección de personaje (grupo 'sel' de la Forja): 48 cuadros, los 12 primeros son la entrada. */
export const cuadrosSel = (id: string, nivel: number) => lista('sel', `${id}/${nivel}`);
export const metaSel = (): { cuadros: number; entrada: number; fps: number; escala: number } | null => (man as any)?.selm ?? null;
export const cuadrosIcono = (id: string) => lista('i', id);
export function objetoMeta(id: string, v: string): ObjMeta | null {
  const k = `${id}|${v}`;
  let o = objetos.get(k);
  if (o) return o;
  const raw = man?.o[k];
  if (!raw) return null;
  o = { ...raw, f: raw.f.map(aCuadro) } as ObjMeta;
  objetos.set(k, o);
  return o;
}
/** Atlas que usa una lista de claves. */
export function atlasDe(grupo: 'h' | 'm' | 'p' | 'o' | 'i' | 'w', claves: string[]): Set<string> {
  const s = new Set<string>();
  const g = (man as any)?.[grupo] ?? {};
  for (const k of claves) {
    const v = g[k]; if (!v) continue;
    const fs = grupo === 'o' ? v.f : v;
    for (const e of fs) s.add(e[0]);
  }
  return s;
}
/** Todas las claves de un grupo que empiezan con un prefijo (p. ej. 'zombi/'). */
export function clavesCon(grupo: 'h' | 'm' | 'p' | 'o' | 'i' | 'w', prefijo: string): string[] {
  return Object.keys((man as any)?.[grupo] ?? {}).filter((k) => k.startsWith(prefijo));
}

/** Dibuja un cuadro con el ancla en (x, y). Devuelve si se pudo (el atlas puede estar bajando). */
// ---------------- laboratorio de luz: los atlas gemelos de relieve (_n) y alto (_h), y el gancho que los dibuja en paralelo
const rels = new Map<string, ImageBitmap | HTMLImageElement | HTMLCanvasElement | 'bajando' | null>();
/** La imagen de un atlas de relieve si ya está bajada (la pide la primera vez). */
/** Hay atlas o relieves bajando o decodificándose (la guardia de la luz no cuenta esos cuadros). */
export const bajandoAlgo = () => cargando.size > 0 || [...rels.values()].some((r) => r === 'bajando');
export const relBajando = (nombre: string) => rels.get(nombre) === 'bajando';
export function relDe(nombre: string): ImageBitmap | HTMLImageElement | HTMLCanvasElement | null {
  const r = rels.get(nombre); if (r !== undefined) return r === 'bajando' ? null : r;
  const a = (man as any)?.rel?.[nombre]; if (!a) { rels.set(nombre, null); return null; }
  rels.set(nombre, 'bajando'); void bajar(BASE + a[0]).then((b) => { if (b) rels.set(nombre, b); else rels.delete(nombre); }); return null;
}
let gancho: ((c: CanvasRenderingContext2D, q: Cuadro, im: CanvasImageSource, x: number, y: number, escala: number) => void) | null = null;
export const fijarGanchoRelieve = (f: typeof gancho) => { gancho = f; };
/** El relieve de un cuadro sin pintar su color (lo que se pintó aparte, como la pieza recortada alrededor del héroe). */
export function relieveDe(c: CanvasRenderingContext2D, q: Cuadro, x: number, y: number) { const im = q.img ?? imgs.get(q.atlas); if (gancho && im) gancho(c, q, im, x, y, 1); }
export function dibujar(c: CanvasRenderingContext2D, q: Cuadro | undefined, x: number, y: number, escala = 1): boolean {
  if (!q) return false;
  let im = q.img;
  if (!im) { im = imgs.get(q.atlas) ?? null; if (!im) { cargarAtlas(q.atlas); return false; } q.img = im; }
  usado.set(q.atlas, ahoraCuadro);
  if (escala === 1) c.drawImage(im, q.x, q.y, q.w, q.h, Math.round(x - q.ax), Math.round(y - q.ay), q.w, q.h);
  else c.drawImage(im, q.x, q.y, q.w, q.h, x - q.ax * escala, y - q.ay * escala, q.w * escala, q.h * escala);
  if (gancho) gancho(c, q, im, x, y, escala);
  return true;
}

// lienzo de trabajo para teñir sprites (golpe, hielo, veneno, campeones)
import { lienzoTrabajo } from './lienzos';
export function dibujarTenido(c: CanvasRenderingContext2D, q: Cuadro | undefined, x: number, y: number, color: string, k: number, escala = 1): boolean {
  if (!q) return false;
  let im = q.img;
  if (!im) { im = imgs.get(q.atlas) ?? null; if (!im) { cargarAtlas(q.atlas); return false; } q.img = im; }
  usado.set(q.atlas, ahoraCuadro);
  const { cv: tmp, c: tctx } = lienzoTrabajo(q.w, q.h); // (uno distinto cada vez: ver motor/lienzos.ts)
  tctx.globalCompositeOperation = 'copy';
  tctx.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
  tctx.globalCompositeOperation = 'source-atop';
  tctx.globalAlpha = k; tctx.fillStyle = color; tctx.fillRect(0, 0, q.w, q.h); tctx.globalAlpha = 1;
  tctx.globalCompositeOperation = 'source-over';
  c.drawImage(tmp, 0, 0, q.w, q.h, x - q.ax * escala, y - q.ay * escala, q.w * escala, q.h * escala);
  if (gancho) gancho(c, { ...q, atlas: '' }, im, x - 1e-6, y, escala === 1 ? 1.000001 : escala);
  return true;
}
/** La silueta del cuadro de un color en un lienzo de la rueda (sin pintarla): para el canto de color de las mejoras. */
export function siluetaCuadro(q: Cuadro | undefined, color: string): HTMLCanvasElement | null {
  if (!q) return null;
  let im = q.img;
  if (!im) { im = imgs.get(q.atlas) ?? null; if (!im) return null; q.img = im; }
  const { cv, c } = lienzoTrabajo(q.w, q.h);
  c.globalCompositeOperation = 'copy'; c.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
  c.globalCompositeOperation = 'source-in'; c.fillStyle = color; c.fillRect(0, 0, q.w, q.h); c.globalCompositeOperation = 'source-over';
  return cv;
}
/** Silueta para sombras y fantasmas: todo el sprite de un color. */
export function dibujarSilueta(c: CanvasRenderingContext2D, q: Cuadro | undefined, x: number, y: number, color: string, escala = 1): boolean {
  return dibujarTenido(c, q, x, y, color, 1, escala);
}
