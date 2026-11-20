// Efectos de pixelfx (exportados por la Forja): hojas de cuadros con su ancla, por dirección, empacadas en pocos .bin.
// Los datos y los paquetes se bajan cuando hace falta; cada página se decodifica la primera vez que un efecto la usa y se
// suelta cuando nadie la usa, con un tope de memoria (60 Mpx en táctil). Ver hornear/empacar_pfx.py.
import { BASE } from '../motor/assets';
import { E } from '../nucleo/lienzo';
import { armarUsosPfx } from '../juego/pfx_usos';

export interface CuadroPfx { 0: number; 1: number; 2: number; 3: number; 4: number; 5: number; 6: number }
interface Pagina { archivo: string; w: number; h: number; bytes: number; ubic: [string, number, number] }
interface DirPfx { dir: string; espejo: boolean; de?: string; cuadros?: number[][] }
export interface EfectoPfx {
  id: string; nombre: [string, string]; categoria: string; capa: 'mundo' | 'piso' | 'pantalla';
  cuadros: number; t: number; bucle: boolean; direccional: boolean; escala: number; caja: number[];
  paginas: Pagina[]; peso: number; mezcla: string; direcciones: DirPfx[];
  cuerpo?: { tinte?: { color: string; fuerza: number }; alfa?: number[] }; luz?: any; uso?: any[]; paquete: string;
}

let datos: Record<string, EfectoPfx> | null = null, pidiendoDatos = false;
/** Pide el índice de efectos (una vez). */
function cargarDatos() {
  if (datos || pidiendoDatos) return;
  pidiendoDatos = true;
  fetch(BASE + 'fx/efectos_pfx.json').then((r) => r.json()).then((j) => { datos = Object.fromEntries(j.efectos.map((e: EfectoPfx) => [e.id, e])); armarUsosPfx(j.efectos); }).catch(() => { pidiendoDatos = false; });
}
cargarDatos();
export const efectoPfx = (id: string) => (cargarDatos(), datos?.[id]);
export const pfxListo = () => !!datos;
export const todosPfx = () => (datos ? Object.values(datos) : []);

// paquetes: los bytes comprimidos, guardados (pesan poco); las páginas decodificadas, con tope
const paquetes = new Map<string, ArrayBuffer | null>();
function paquete(g: string): ArrayBuffer | null {
  if (paquetes.has(g)) return paquetes.get(g)!;
  paquetes.set(g, null);
  // el paquete viene en base64 (el artifact no sirve binarios): se decodifica una vez con fetch de un data: URL
  fetch(BASE + `fx/pfx_${g}.txt`).then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.text(); }).then((t) => fetch('data:application/octet-stream;base64,' + t.trim())).then((r) => r.arrayBuffer()).then((b) => paquetes.set(g, b)).catch(() => setTimeout(() => paquetes.delete(g), 3000));
  return null;
}
interface Viva { bmp: ImageBitmap | HTMLImageElement | null; mpx: number; uso: number; pidiendo: boolean }
const paginas = new Map<string, Viva>();
export const memoriaPfx = { mpx: 0, paginas: 0, tope: 0 };
const tope = () => (E.tactil ? 60 : 160);
function pagina(p: Pagina): Viva['bmp'] {
  let v = paginas.get(p.archivo);
  const ahora = performance.now();
  if (v) { v.uso = ahora; return v.bmp; }
  const buf = paquete(p.ubic[0]); if (!buf) return null;
  v = { bmp: null, mpx: (p.w * p.h) / 1e6, uso: ahora, pidiendo: true };
  paginas.set(p.archivo, v);
  memoriaPfx.mpx += v.mpx; memoriaPfx.paginas++;
  const blob = new Blob([buf.slice(p.ubic[1], p.ubic[1] + p.ubic[2])], { type: 'image/png' });
  const fin = (b: Viva['bmp']) => { v!.bmp = b; v!.pidiendo = false; };
  if (typeof createImageBitmap === 'function') createImageBitmap(blob).then(fin).catch(() => soltar(p.archivo));
  else { const im = new Image(); im.onload = () => fin(im); im.src = URL.createObjectURL(blob); }
  podar();
  return null;
}
function soltar(archivo: string) {
  const v = paginas.get(archivo); if (!v) return;
  if (v.bmp && 'close' in v.bmp) (v.bmp as ImageBitmap).close();
  paginas.delete(archivo); memoriaPfx.mpx -= v.mpx; memoriaPfx.paginas--;
}
/** Suelta lo que nadie usó hace rato y, si se pasa del tope, lo menos usado (nunca lo de este último segundo). */
export function podar() {
  const ahora = performance.now(), t = tope(); memoriaPfx.tope = t;
  for (const [k, v] of paginas) if (!v.pidiendo && ahora - v.uso > 20000) soltar(k);
  if (memoriaPfx.mpx <= t) return;
  const orden = [...paginas.entries()].filter(([, v]) => !v.pidiendo && ahora - v.uso > 1000).sort((a, b) => a[1].uso - b[1].uso);
  for (const [k] of orden) { if (memoriaPfx.mpx <= t) break; soltar(k); }
}
let ultimaPoda = 0;
export function cuidarPfx() { const a = performance.now(); if (a - ultimaPoda > 2000) { ultimaPoda = a; podar(); } }

/** Pide de antemano las páginas de estos efectos (al entrar a una zona o elegir la clase). */
export function precargarPfx(ids: string[]) {
  for (const id of ids) { const e = efectoPfx(id); if (e) for (const p of e.paginas) pagina(p); }
}

let fuerzaAditiva = 1, noche = 1;
/** La escena avisa qué tan oscura es la zona (0 pleno día, 1 negro): de eso sale cuánto pesan los efectos de luz. */
export function claridadPfx(oscuridad: number) { noche = Math.max(0, Math.min(1, oscuridad / 0.55)); fuerzaAditiva = 0.58 + 0.42 * noche; }
/** Qué tan de noche es la zona (0 pleno día, 1 de 0,55 de oscuridad para arriba): los fogonazos de pantalla y los halos
 * grandes bajan de día (la Combustión lavaba de naranja la pantalla entera en el desierto). */
export const nochePfx = () => ((window as any).__fogonazoParejo ? 1 : noche); // (`__fogonazoParejo` vuelve a lo de antes)
/** Cuadro del efecto a los `seg` segundos (o -1 si ya terminó). */
export function cuadroPfx(e: EfectoPfx, seg: number) {
  const i = Math.floor((seg * 25) / e.t);
  return e.bucle ? ((i % e.cuadros) + e.cuadros) % e.cuadros : i < e.cuadros ? i : -1;
}
/** Duración en segundos de una pasada. */
export const duracionPfx = (e: EfectoPfx) => (e.cuadros * e.t) / 25;
/** El índice de dirección 0..7 (s, so, o, no, n, ne, e, se) desde un vector en el mundo. */
export function dirPfx(vx: number, vy: number) {
  // en pantalla: sx = vx - vy, sy = (vx + vy) / 2
  const sx = vx - vy, sy = (vx + vy) / 2, a = Math.atan2(sy, sx);
  // s = abajo (pi/2), so = abajo izquierda, o = izquierda (pi), ... sentido horario visto en pantalla
  const k = Math.round(((a - Math.PI / 2) / (Math.PI / 4)) + 8) % 8;
  return k;
}

/**
 * Dibuja el efecto con su ancla en (x, y) de pantalla. `dir` 0..7. Devuelve false si todavía no está cargado o ya
 * terminó. Capa pantalla: estirado a cubrir (W, H) y la esquina en (0, 0).
 */
const SUMA_LUZ = new Set(['fx_estallido_copos', 'pfx:fx_estallido_copos']);
export function dibujarPfx(ctx: CanvasRenderingContext2D, id: string, seg: number, x: number, y: number, o: { dir?: number; alfa?: number; escala?: number; W?: number; H?: number; tesela?: boolean; cabeza?: number } = {}): boolean {
  const e = efectoPfx(id); if (!e) return false;
  const n = cuadroPfx(e, seg); if (n < 0) return false;
  let d = e.direcciones[e.direccional ? (o.dir ?? 0) % e.direcciones.length : 0];
  let espejo = false;
  if (d.espejo) { espejo = true; d = e.direcciones.find((q) => q.dir === d.de)!; }
  const c = d?.cuadros?.[Math.min(n, d.cuadros.length - 1)]; if (!c) return false;
  if (!c[3]) return true; // cuadro vacío
  const p = e.paginas[c[0]]; const bmp = pagina(p); if (!bmp) return false;
  ctx.save();
  ctx.imageSmoothingEnabled = false;
  if (o.alfa !== undefined) ctx.globalAlpha *= o.alfa;
  if ((window as any).__pfxAlfa !== undefined) ctx.globalAlpha *= (window as any).__pfxAlfa;
  // los que se suman como luz bajan con la claridad del lugar: de día, sobre arena o nieve, un cuadro de fogonazo
  // quemaba a blanco al héroe y a los enemigos. En lo oscuro van enteros
  // (cuarta pasada) el estallido de copos del Manto de escarcha venía horneado opaco: su estrella blanca no bajaba de día
  // y quemaba la cabeza a pleno sol. De día va a medias opaco (los copos se siguen leyendo sobre la arena) y a medias
  // sumado como luz; de noche como siempre
  if (SUMA_LUZ.has(id) && (o as any).modo === undefined && !(window as any).__fogonazoParejo && noche < 1) {
    ctx.restore(); const a0 = o.alfa ?? 1;
    const ok = dibujarPfx(ctx, id, seg, x, y, { ...o, alfa: a0 * (0.4 + 0.6 * noche), modo: 'n' } as any);
    dibujarPfx(ctx, id, seg, x, y, { ...o, alfa: a0 * 0.45 * (1 - noche), modo: 'l' } as any); return ok;
  }
  const suma = e.mezcla === 'aditiva' || e.mezcla === 'sumar' || (o as any).modo === 'l';
  if (suma && e.capa !== 'pantalla') {
    ctx.globalAlpha *= fuerzaAditiva;
    // (tercera pasada) los grandes de luz sumada (las definitivas horneadas: el Lamento del osario, el Puño de dios, las
    // Espadas votivas) quemaban a blanco medio campo de día aunque bajaran como los chicos: van más abajo cuanto más
    // grandes y más claro el lugar (a pleno día, uno de 200 puntos de ancho queda a un 45 % de lo de antes)
    if (!(window as any).__fogonazoParejo) { const ancho = c[3] * Math.min(e.escala * (o.escala ?? 1), Math.max(2, e.escala)), big = Math.max(0, Math.min(1, (ancho - 70) / 130)); ctx.globalAlpha *= 1 - big * (1 - noche) * 0.55; }
  }
  ctx.globalCompositeOperation = suma ? 'lighter' : 'source-over';
  if (e.capa === 'pantalla' && o.tesela) {
    // clima en mosaico: el cuadro a escala 2 (el mismo pixel que el mundo) con la esquina del lienzo del efecto en (x, y).
    // (el cuadro viene recortado: sin su corrimiento la tesela quedaba corta y corrida y abría una raya entre teselas)
    ctx.drawImage(bmp, c[1], c[2], c[3], c[4], Math.round(x + (c[5] ?? 0) * 2), Math.round(y + (c[6] ?? 0) * 2), c[3] * 2, c[4] * 2);
  } else if (e.capa === 'pantalla' && o.W) {
    // a cubrir la pantalla manteniendo la proporción del cuadro
    const k = Math.max(o.W / c[3], (o.H ?? 0) / c[4]);
    ctx.drawImage(bmp, c[1], c[2], c[3], c[4], (o.W - c[3] * k) / 2, ((o.H ?? 0) - c[4] * k) / 2, c[3] * k, c[4] * k);
  } else {
    const reg = (window as any).__regEsc; if (reg) reg[id] = Math.max(reg[id] ?? 0, +(e.escala * (o.escala ?? 1)).toFixed(2));
    // El grano del efecto no pasa de dos puntos de pantalla por punto del dibujo: agrandado a 3 o 4 salía en bloques
    // gruesos (otro juego encima del juego) y tapaba al héroe y a medio campo. El radio real lo marcan el anillo y la
    // energía del piso, que se pintan al grano del mundo.
    const k = (window as any).__pfxSinTope ? e.escala * (o.escala ?? 1) : Math.min(e.escala * (o.escala ?? 1), Math.max(2, e.escala)), w = c[3] * k, h = c[4] * k;
    // lo que va sobre la cabeza (estrellas del aturdido, la calavera del maldito...) se hornea sobre un cuerpo de unos 50
    // puntos: con el tope de grano no crece con el cuerpo, así que se sube (o se baja) a la cabeza de verdad
    if (o.cabeza !== undefined) y += Math.max(-400, Math.min(60, o.cabeza - (y - 50 * k)));
    if (espejo) { ctx.translate(Math.round(x - (c[5] + c[3]) * k) + w, Math.round(y + c[6] * k)); ctx.scale(-1, 1); ctx.drawImage(bmp, c[1], c[2], c[3], c[4], 0, 0, w, h); }
    else ctx.drawImage(bmp, c[1], c[2], c[3], c[4], Math.round(x + c[5] * k), Math.round(y + c[6] * k), w, h);
  }
  ctx.restore();
  return true;
}
/** Alfa del cuerpo en el cuadro (aparecer, desaparecer, morir) o 1. */
export function alfaCuerpo(id: string, seg: number) {
  const e = efectoPfx(id); const a = e?.cuerpo?.alfa; if (!a || !e) return 1;
  const n = cuadroPfx(e, seg); return n < 0 ? a[a.length - 1] : a[Math.min(n, a.length - 1)];
}
(window as any).__pfx = { memoria: memoriaPfx, dibujarPfx, efectoPfx, todos: todosPfx };

/** La caja que ocupan todos los cuadros de un efecto (en puntos del dibujo): [x, y, ancho, alto]. */
const cajas = new Map<string, [number, number, number, number]>();
export function cajaPfx(id: string): [number, number, number, number] | null {
  const hay = cajas.get(id); if (hay) return hay;
  const e = efectoPfx(id); if (!e) return null;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of e.direcciones) for (const c of d.cuadros ?? []) { if (!c || !c[3]) continue; x0 = Math.min(x0, c[5] ?? 0); y0 = Math.min(y0, c[6] ?? 0); x1 = Math.max(x1, (c[5] ?? 0) + c[3]); y1 = Math.max(y1, (c[6] ?? 0) + c[4]); }
  if (!isFinite(x0)) return null;
  const k: [number, number, number, number] = [x0, y0, x1 - x0, y1 - y0]; cajas.set(id, k); return k;
}
