// El recorte de lo alto que tapa al héroe (entrega 6 de mundos). Antes, con el héroe detrás de un hito, un muro o un árbol,
// la pieza entera bajaba a 0,45 de golpe: el hito quedaba como un fantasma y se veía el piso de atrás a través de toda la
// torre. Ahora solo se abre una ventana alrededor del héroe: un óvalo a puntos enteros del dibujo, que en el medio deja un
// velo de la pieza (se sigue leyendo qué hay delante) y hacia el borde vuelve a la pieza entera en escalones tramados
// (Bayer 4 x 4, como el resto del pixel art del juego). La ventana se abre y se cierra en un cuarto de segundo, por pieza.
// `__alfaViejo` vuelve a la pieza entera a 0,45.
import { dibujar, type Cuadro } from '../motor/assets';
import { lienzoTrabajo } from '../motor/lienzos';

/** Medio ancho y medio alto de la ventana, en puntos del dibujo (el héroe mide unos 64 de alto). */
const RX = 38, RY = 50;
export const RX_REC = RX;
/** Lo que queda de la pieza en el medio de la ventana (0 la abriría del todo: el hueco se leía como un error). */
const VELO = 0.26;
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
let mascara: HTMLCanvasElement | null = null;
/** La máscara una sola vez: alfa = cuánto se quita en cada punto. Escalones de un octavo, tramados entre uno y otro. */
function mascaraVentana(): HTMLCanvasElement {
  if (mascara) return mascara;
  const w = RX * 2, h = RY * 2, cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d')!, im = g.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x + 0.5 - RX) / RX, dy = (y + 0.5 - RY) / RY, d = Math.sqrt(dx * dx + dy * dy);
    if (d >= 1) continue;
    // de la pieza queda VELO hasta 0,45 del radio y sube suave (cuadrática) hasta entera en el borde
    const t = d < 0.45 ? 0 : (d - 0.45) / 0.55, queda = VELO + (1 - VELO) * t * t;
    // a escalones de 1/8 con trama entre el de abajo y el de arriba: el borde no es un aro liso ni una línea
    const n = (1 - queda) * 8, piso = Math.floor(n), frac = n - piso, sube = frac * 16 > BAYER[(y & 3) * 4 + (x & 3)] + 0.5 ? 1 : 0;
    im.data[(y * w + x) * 4 + 3] = Math.round(((piso + sube) / 8) * 255);
  }
  g.putImageData(im, 0, 0);
  return (mascara = cv);
}

const fuerza = new WeakMap<object, { k: number; t: number }>();
/** Cuánto está abierta la ventana de una pieza (0 a 1), que sube o baja hacia `quiere` en 0,25 s. */
export function aperturaRecorte(o: object, quiere: boolean, tiempo: number): number {
  let s = fuerza.get(o); if (!s) { if (!quiere) return 0; s = { k: 0, t: tiempo }; fuerza.set(o, s); }
  const dt = Math.max(0, Math.min(0.1, tiempo - s.t)); s.t = tiempo;
  s.k = Math.max(0, Math.min(1, s.k + (quiere ? 4 : -4) * dt));
  return s.k;
}

/** La pieza (o su versión con bruma) con la ventana abierta donde está el héroe, en un lienzo de la rueda del tamaño del cuadro.
 *  `hx`, `hy`: el centro del cuerpo del héroe en pantalla; `px`, `py`: el ancla de la pieza. */
export function piezaRecortada(q: Cuadro, br: HTMLCanvasElement | null, px: number, py: number, hx: number, hy: number, k: number): HTMLCanvasElement | null {
  const { cv, c } = lienzoTrabajo(q.w, q.h);
  c.globalCompositeOperation = 'copy';
  if (br) c.drawImage(br, 0, 0, q.w, q.h, 0, 0, q.w, q.h);
  else { c.clearRect(0, 0, cv.width, cv.height); c.globalCompositeOperation = 'source-over'; if (!dibujar(c, q, q.ax, q.ay)) return null; }
  c.globalCompositeOperation = 'destination-out'; c.globalAlpha = k;
  // a puntos enteros del dibujo: la trama queda pegada a la grilla de la pieza
  c.drawImage(mascaraVentana(), Math.round(hx - (px - q.ax) - RX), Math.round(hy - (py - q.ay) - RY));
  c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  return cv;
}
/** El centro de la ventana: el pecho del héroe (sus pies en pantalla menos medio cuerpo). */
export const ALTO_PECHO = 32;
