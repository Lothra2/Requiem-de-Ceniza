// Lienzos de trabajo en rueda. Las sombras, los filos de luz y el destello de golpe se arman en un lienzo aparte y después
// se pegan al de la pantalla. Antes era uno solo para todo: en una tarjeta gráfica de verdad, tocar un lienzo que ya se
// pegó en este cuadro obliga a vaciar toda la cola de dibujo, y con veinte monstruos y bolas de fuego (más luces, más
// filos, más destellos) eran cientos de frenazos por cuadro: el juego se trancaba (Rick, 18 nov 2026). En la nube no se
// veía porque Chromium pinta sin tarjeta. Ahora cada pedido toma el siguiente de la rueda y crece solo si hace falta.
const N = 160;
const rueda: { cv: HTMLCanvasElement; c: CanvasRenderingContext2D }[] = [];
let i = 0;
export function lienzoTrabajo(w: number, h: number): { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } {
  if (rueda.length < N) { const cv = document.createElement('canvas'); cv.width = Math.max(16, w); cv.height = Math.max(16, h); rueda.push({ cv, c: cv.getContext('2d')! }); i = rueda.length; return rueda[rueda.length - 1]; }
  const t = rueda[i++ % N];
  if (t.cv.width < w || t.cv.height < h) { t.cv.width = Math.max(t.cv.width, w); t.cv.height = Math.max(t.cv.height, h); }
  return t;
}
