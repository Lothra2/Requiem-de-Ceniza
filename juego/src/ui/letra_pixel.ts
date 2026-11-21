// La letra de pixel del HUD forjado: 5 x 7 con minúsculas, cifras, signos y los acentos del castellano (á é í ó ú ü ñ
// y sus mayúsculas), dibujada a puntos enteros del aparato como las cifras del rosetón. Cada letra sale en relieve:
// la tinta con su luz arriba y su sombra abajo, y un canto oscuro que cae abajo a la derecha (o grabada: hundida en el
// metal, con el labio de luz abajo). Lo pintado se guarda por texto, color, estilo y tamaño.
import { ctx } from '../nucleo/lienzo';

/** Filas de la celda: 0 a 6 el alto de la mayúscula, 7 y 8 lo que baja (g, j, p, q, y), -2 y -1 los acentos (en las minúsculas, -1 y 0). */
const G: Record<string, string[]> = {
  A: [' ### ', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  B: ['#### ', '#   #', '#   #', '#### ', '#   #', '#   #', '#### '],
  C: [' ### ', '#   #', '#    ', '#    ', '#    ', '#   #', ' ### '],
  D: ['#### ', '#   #', '#   #', '#   #', '#   #', '#   #', '#### '],
  E: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#####'],
  F: ['#####', '#    ', '#    ', '#### ', '#    ', '#    ', '#    '],
  G: [' ### ', '#   #', '#    ', '# ###', '#   #', '#   #', ' ####'],
  H: ['#   #', '#   #', '#   #', '#####', '#   #', '#   #', '#   #'],
  I: ['###', ' # ', ' # ', ' # ', ' # ', ' # ', '###'],
  J: ['  ###', '   # ', '   # ', '   # ', '   # ', '#  # ', ' ##  '],
  K: ['#   #', '#  # ', '# #  ', '##   ', '# #  ', '#  # ', '#   #'],
  L: ['#    ', '#    ', '#    ', '#    ', '#    ', '#    ', '#####'],
  M: ['#   #', '## ##', '# # #', '# # #', '#   #', '#   #', '#   #'],
  N: ['#   #', '##  #', '# # #', '# # #', '#  ##', '#   #', '#   #'],
  O: [' ### ', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  P: ['#### ', '#   #', '#   #', '#### ', '#    ', '#    ', '#    '],
  Q: [' ### ', '#   #', '#   #', '#   #', '# # #', '#  # ', ' ## #'],
  R: ['#### ', '#   #', '#   #', '#### ', '# #  ', '#  # ', '#   #'],
  S: [' ####', '#    ', '#    ', ' ### ', '    #', '    #', '#### '],
  T: ['#####', '  #  ', '  #  ', '  #  ', '  #  ', '  #  ', '  #  '],
  U: ['#   #', '#   #', '#   #', '#   #', '#   #', '#   #', ' ### '],
  V: ['#   #', '#   #', '#   #', '#   #', ' # # ', ' # # ', '  #  '],
  W: ['#   #', '#   #', '#   #', '# # #', '# # #', '## ##', '#   #'],
  X: ['#   #', '#   #', ' # # ', '  #  ', ' # # ', '#   #', '#   #'],
  Y: ['#   #', '#   #', ' # # ', '  #  ', '  #  ', '  #  ', '  #  '],
  Z: ['#####', '    #', '   # ', '  #  ', ' #   ', '#    ', '#####'],
  a: ['    ', '    ', ' ## ', '   #', ' ###', '#  #', ' ###'],
  b: ['#   ', '#   ', '### ', '#  #', '#  #', '#  #', '### '],
  c: ['    ', '    ', ' ###', '#   ', '#   ', '#   ', ' ###'],
  d: ['   #', '   #', ' ###', '#  #', '#  #', '#  #', ' ###'],
  e: ['    ', '    ', ' ## ', '#  #', '####', '#   ', ' ###'],
  f: ['  ##', ' #  ', '####', ' #  ', ' #  ', ' #  ', ' #  '],
  g: ['    ', '    ', ' ###', '#  #', '#  #', '#  #', ' ###', '   #', '### '],
  h: ['#   ', '#   ', '### ', '#  #', '#  #', '#  #', '#  #'],
  i: [' # ', '   ', '## ', ' # ', ' # ', ' # ', '###'],
  ı: ['   ', '   ', '## ', ' # ', ' # ', ' # ', '###'],
  j: ['  #', '   ', ' ##', '  #', '  #', '  #', '  #', '  #', '## '],
  k: ['#   ', '#   ', '#  #', '# # ', '##  ', '# # ', '#  #'],
  l: ['## ', ' # ', ' # ', ' # ', ' # ', ' # ', '###'],
  m: ['     ', '     ', '#### ', '# # #', '# # #', '# # #', '# # #'],
  n: ['    ', '    ', '### ', '#  #', '#  #', '#  #', '#  #'],
  o: ['    ', '    ', ' ## ', '#  #', '#  #', '#  #', ' ## '],
  p: ['    ', '    ', '### ', '#  #', '#  #', '#  #', '### ', '#   ', '#   '],
  q: ['    ', '    ', ' ###', '#  #', '#  #', '#  #', ' ###', '   #', '   #'],
  r: ['    ', '    ', '# ##', '##  ', '#   ', '#   ', '#   '],
  s: ['    ', '    ', ' ###', '#   ', ' ## ', '   #', '### '],
  t: [' #  ', ' #  ', '####', ' #  ', ' #  ', ' #  ', '  ##'],
  u: ['    ', '    ', '#  #', '#  #', '#  #', '#  #', ' ###'],
  v: ['     ', '     ', '#   #', '#   #', ' # # ', ' # # ', '  #  '],
  w: ['     ', '     ', '#   #', '#   #', '# # #', '# # #', ' # # '],
  x: ['    ', '    ', '#  #', '#  #', ' ## ', '#  #', '#  #'],
  y: ['    ', '    ', '#  #', '#  #', '#  #', '#  #', ' ###', '   #', '### '],
  z: ['    ', '    ', '####', '   #', ' ## ', '#   ', '####'],
  '0': [' ### ', '#   #', '#  ##', '# # #', '##  #', '#   #', ' ### '],
  '1': ['  #  ', ' ##  ', '  #  ', '  #  ', '  #  ', '  #  ', ' ### '],
  '2': [' ### ', '#   #', '    #', '   # ', '  #  ', ' #   ', '#####'],
  '3': ['#####', '   # ', '  #  ', '   # ', '    #', '#   #', ' ### '],
  '4': ['   # ', '  ## ', ' # # ', '#  # ', '#####', '   # ', '   # '],
  '5': ['#####', '#    ', '#### ', '    #', '    #', '#   #', ' ### '],
  '6': ['  ## ', ' #   ', '#    ', '#### ', '#   #', '#   #', ' ### '],
  '7': ['#####', '    #', '   # ', '  #  ', ' #   ', ' #   ', ' #   '],
  '8': [' ### ', '#   #', '#   #', ' ### ', '#   #', '#   #', ' ### '],
  '9': [' ### ', '#   #', '#   #', ' ####', '    #', '   # ', ' ##  '],
  ' ': ['   '],
  '(': [' #', '# ', '# ', '# ', '# ', '# ', ' #'],
  ')': ['# ', ' #', ' #', ' #', ' #', ' #', '# '],
  '[': ['##', '# ', '# ', '# ', '# ', '# ', '##'],
  ']': ['##', ' #', ' #', ' #', ' #', ' #', '##'],
  ':': [' ', ' ', '#', ' ', ' ', '#', ' '],
  '.': [' ', ' ', ' ', ' ', ' ', ' ', '#'],
  ',': [' ', ' ', ' ', ' ', ' ', ' ', '#', '#'],
  ';': [' ', ' ', '#', ' ', ' ', '#', '#'],
  '·': [' ', ' ', ' ', '#', ' ', ' ', ' '],
  '-': ['    ', '    ', '    ', '####'],
  '+': ['     ', '  #  ', '  #  ', '#####', '  #  ', '  #  '],
  '/': ['    #', '   # ', '   # ', '  #  ', ' #   ', ' #   ', '#    '],
  '%': ['##  #', '##  #', '   # ', '  #  ', ' #   ', '#  ##', '#  ##'],
  '!': ['#', '#', '#', '#', '#', ' ', '#'],
  '?': [' ### ', '#   #', '    #', '   # ', '  #  ', '     ', '  #  '],
  '¡': ['#', ' ', '#', '#', '#', '#', '#'],
  '¿': ['  #  ', '     ', '  #  ', ' #   ', '#    ', '#   #', ' ### '],
  "'": ['#', '#'],
  '×': ['     ', '     ', '#   #', ' # # ', '  #  ', ' # # ', '#   #'],
  '<': ['   #', '  # ', ' #  ', '#   ', ' #  ', '  # ', '   #'],
  '>': ['#   ', ' #  ', '  # ', '   #', '  # ', ' #  ', '#   '],
};
/** Los acentos: la letra de base y la marca (filas desde -2 en las mayúsculas, desde -1 en las minúsculas). */
const ACENTO: Record<string, [string, 'agudo' | 'tilde' | 'dieresis']> = {
  á: ['a', 'agudo'], é: ['e', 'agudo'], í: ['ı', 'agudo'], ó: ['o', 'agudo'], ú: ['u', 'agudo'], ü: ['u', 'dieresis'], ñ: ['n', 'tilde'],
  Á: ['A', 'agudo'], É: ['E', 'agudo'], Í: ['I', 'agudo'], Ó: ['O', 'agudo'], Ú: ['U', 'agudo'], Ü: ['U', 'dieresis'], Ñ: ['N', 'tilde'],
};
interface Glifo { w: number; px: [number, number][] }
const glifos = new Map<string, Glifo>();
function glifo(ch: string): Glifo {
  let g = glifos.get(ch); if (g) return g;
  const ac = ACENTO[ch], base = G[ac ? ac[0] : ch] ?? G['?'], w = Math.max(...base.map((f) => f.length));
  const px: [number, number][] = [];
  base.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (f[x] === '#') px.push([x, y]); });
  if (ac) {
    const may = ac[0] === ac[0].toUpperCase() && ac[0] !== 'ı', y0 = may ? -2 : -1, c = Math.floor((w - 1) / 2), t0 = Math.floor((w - 4) / 2);
    if (ac[1] === 'agudo') px.push([c + 1, y0], [c, y0 + 1]);
    else if (ac[1] === 'dieresis') px.push([c - 1, y0 + 1], [c + 1, y0 + 1]);
    else px.push([t0 + 1, y0], [t0 + 3, y0], [t0, y0 + 1], [t0 + 2, y0 + 1]);
  }
  g = { w, px }; glifos.set(ch, g); return g;
}
/** El glifo crudo (puntos de tinta y ancho) si la letra lo tiene, o null: lo usa la mano de Odrán (ui/libro_pixel.ts). */
export function glifoLetra(ch: string): { w: number; px: [number, number][] } | null { return G[ch] || ACENTO[ch] ? glifo(ch) : null; }
/** El ancho de un texto en puntos de la letra (sin el canto). */
export function anchoLetra(s: string): number { let w = 0; for (const ch of s) w += glifo(ch).w + 1; return Math.max(0, w - 1); }

const hx = (h: string): [number, number, number] => { const v = h.replace('#', ''); const n = v.length === 3 ? v.split('').map((c) => c + c).join('') : v; return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)]; };
const css = (c: number[], a = 1) => `rgba(${Math.round(Math.max(0, Math.min(255, c[0])))},${Math.round(Math.max(0, Math.min(255, c[1])))},${Math.round(Math.max(0, Math.min(255, c[2])))},${a})`;
const hechos = new Map<string, HTMLCanvasElement>();

/**
 * 'relieve': la tinta sobresale (luz arriba, sombra abajo y canto negro que cae abajo a la derecha), para el texto suelto
 * sobre la piedra o el mundo. 'grabado': hundida en la placa (la tinta oscura con el labio de luz abajo a la derecha).
 */
export type EstiloLetra = 'relieve' | 'grabado';
function pintar(s: string, color: string, estilo: EstiloLetra, labio: string): HTMLCanvasElement {
  const clave = `${s}|${color}|${estilo}|${labio}`;
  let cv = hechos.get(clave); if (cv) { hechos.delete(clave); hechos.set(clave, cv); return cv; }
  const w = anchoLetra(s) + 2, h = 2 + 9 + 2 + 1;
  cv = document.createElement('canvas'); cv.width = Math.max(1, w); cv.height = h;
  const g = cv.getContext('2d')!, tinta = new Set<number>(), oy = 2;
  let x = 0; const pts: [number, number][] = [];
  for (const ch of s) { const gl = glifo(ch); for (const [a, b] of gl.px) { pts.push([x + a, b + oy]); tinta.add((b + oy) * 1000 + x + a); } x += gl.w + 1; }
  const en = (a: number, b: number) => tinta.has(b * 1000 + a);
  const c0 = hx(color), luz = c0.map((v) => v + (255 - v) * 0.45), som = c0.map((v) => v * 0.62), lb = hx(labio);
  if (estilo === 'relieve') {
    // el canto que cae (abajo y a la derecha), donde no hay tinta
    g.fillStyle = 'rgba(0,0,0,0.85)'; for (const [a, b] of pts) { if (!en(a + 1, b + 1)) g.fillRect(a + 1, b + 1, 1, 1); if (!en(a + 1, b)) g.fillRect(a + 1, b, 1, 1); if (!en(a, b + 1)) g.fillRect(a, b + 1, 1, 1); }
    for (const [a, b] of pts) { g.fillStyle = css(!en(a, b - 1) ? luz : !en(a, b + 1) ? som : c0); g.fillRect(a, b, 1, 1); }
  } else {
    // grabado: el labio de luz del metal abajo a la derecha y la tinta oscura, más honda arriba (la sombra del corte)
    g.fillStyle = css(lb, 0.9); for (const [a, b] of pts) if (!en(a + 1, b + 1)) g.fillRect(a + 1, b + 1, 1, 1);
    for (const [a, b] of pts) { g.fillStyle = css(!en(a, b - 1) ? c0.map((v) => v * 0.6) : c0); g.fillRect(a, b, 1, 1); }
  }
  hechos.set(clave, cv); if (hechos.size > 300) hechos.delete(hechos.keys().next().value!);
  return cv;
}

export interface OpcLetra { color?: string; alin?: 'left' | 'center' | 'right'; estilo?: EstiloLetra; labio?: string; /** puntos del aparato por punto de la letra (si no, el del lienzo, redondeado) */ D?: number; escala?: number }
/** Cuántos puntos del aparato lleva cada punto de la letra con la transformación de ahora. */
export function gradoLetra(o: OpcLetra = {}): number { const m = ctx.getTransform(); return o.D ?? Math.max(1, Math.round(m.a * (o.escala ?? 1))); }
/** El ancho del texto en puntos lógicos (con la transformación de ahora). */
export function anchoPixel(s: string, o: OpcLetra = {}): number { return (anchoLetra(s) * gradoLetra(o)) / ctx.getTransform().a; }
/**
 * Escribe s con la letra de pixel. x, y en puntos lógicos, y en la línea de base (como `texto`). Se pega a puntos enteros
 * del aparato.
 */
export function textoPixel(s: string, x: number, y: number, o: OpcLetra = {}) {
  if (!s) return;
  const m = ctx.getTransform(), D = gradoLetra(o), cv = pintar(s, o.color ?? '#e8d8b0', o.estilo ?? 'relieve', o.labio ?? '#d0aa5c');
  const wTxt = anchoLetra(s) * D, al = o.alin ?? 'left';
  const X = m.a * x + m.c * y + m.e - (al === 'center' ? wTxt / 2 : al === 'right' ? wTxt : 0), Y = m.b * x + m.d * y + m.f - 7 * D;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, Math.round(X), Math.round(Y) - 2 * D, cv.width * D, cv.height * D);
  ctx.restore();
}
