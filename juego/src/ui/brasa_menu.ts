// El canto de brasa de los botones del menú de la portada: al pasar el ratón (o en el renglón elegido), un fuego de
// Doom chico nace del canto de abajo de cada letra y la lame por detrás, y el borde de las letras se enciende en pixel
// (de la brasa honda abajo al naranja vivo, con la llama que lo toca), con alguna chispa. Todo a puntos enteros del
// aparato, en bandas con su trama. `__menuViejo` lo apaga (queda el dorado con resplandor de antes).
import * as D from '../../../src/engine/gotico/fuego_doom';
import { ctx, E } from '../nucleo/lienzo';
import { BANDAS_LLAMA, banda, capa, pintarCalor, pegarPixel, moverChispas, dibujarChispas, type Capa, type Chispa } from './fuego_pixel';

interface Renglon { f: D.Fuego; mk: Float32Array; borde: Int32Array; fuego: Capa; canto: Capa; celda: number; cw: number; ch: number; px: number; arriba: number; alto: number; ult: number; chispas: Chispa[] }
const renglones = new Map<string, Renglon>();

function armar(S: string, tam: number, familia: string, celda: number, ka: number): Renglon | null {
  ctx.save(); ctx.font = `700 ${tam}px ${familia}`; const wt = ctx.measureText(S).width; ctx.restore();
  const px = tam * 0.5, arriba = tam * 1.45, abajo = tam * 0.4, sc = ka / celda;
  const cw = Math.ceil((wt + px * 2) * sc), ch = Math.ceil((arriba + abajo) * sc);
  if (cw < 4 || ch < 4) return null;
  const c = document.createElement('canvas'); c.width = cw; c.height = ch;
  const g = c.getContext('2d', { willReadFrequently: true }); if (!g) return null;
  g.font = `700 ${tam * sc}px ${familia}`; g.textBaseline = 'alphabetic'; g.fillStyle = '#fff'; g.fillText(S, px * sc, arriba * sc);
  const d = g.getImageData(0, 0, cw, ch).data, mk = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) mk[i] = d[i * 4 + 3] / 255;
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= cw || y >= ch ? 0 : mk[y * cw + x]);
  const fuente = new Float32Array(cw * ch), borde: number[] = [];
  let arribaL = ch, abajoL = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = a(x, y); if (v < 0.5) continue;
    arribaL = Math.min(arribaL, y); abajoL = Math.max(abajoL, y);
    const h1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, r = h1 - Math.floor(h1);
    if (a(x, y + 1) < 0.3 && r < 0.85) fuente[y * cw + x] = 0.7 + 0.3 * r;
    if (a(x - 1, y) < 0.35 || a(x + 1, y) < 0.35 || a(x, y - 1) < 0.35 || a(x, y + 1) < 0.35) borde.push(y * cw + x);
  }
  if (!borde.length) return null;
  const f = D.crearFuego({ ancho: cw, alto: ch, semilla: 77 + cw, paleta: 'infierno', forma: { tipo: 'mapa', fuente }, altura: 0.42, viento: 0.06, rafagas: 0.2, turbulencia: 0.35, ruido: 0.65, tramo: 3, velocidadTramo: 2, humo: 0, margen: 2, encendido: 0 });
  return { f, mk, borde: Int32Array.from(borde), fuego: capa(cw, ch), canto: capa(cw, ch), celda, cw, ch, px, arriba, alto: Math.max(1, abajoL - arribaL), ult: -1, chispas: [] };
}

/**
 * La brasa de un renglón. (tx, ty) es donde va el texto (izquierda y línea de base, lógicos), `k` cuánto está encendido
 * (0 a 1). `pasada` 'atras' va antes del texto (el fuego que lo lame), 'adelante' después (el canto encendido y chispas).
 */
export function brasaRenglon(id: string, S: string, tam: number, familia: string, tx: number, ty: number, k: number, t: number, pasada: 'atras' | 'adelante') {
  if ((window as any).__menuViejo) return;
  const T = ctx.getTransform(), celda = 2, clave = `${id}|${S}|${tam}|${celda}|${T.a}`;
  let r = renglones.get(clave);
  if (!r) { const nr = armar(S, tam, familia, celda, T.a); if (!nr) return; r = nr; for (const k2 of renglones.keys()) if (k2.startsWith(id + '|')) renglones.delete(k2); renglones.set(clave, r); }
  const cel = celda / T.a, x0 = tx - r.px, y0 = ty - r.arriba;
  if (pasada === 'atras') {
    const dt = r.ult < 0 || t < r.ult ? 1 / 30 : Math.min(0.1, t - r.ult); r.ult = t;
    D.encender(r.f, k > 0.3 ? 1 : 0); D.paso(r.f, dt);
    if (k > 0.5 && r.chispas.length < (E.tactil ? 4 : 9)) for (const b of D.brasas(r.f, 1, 0.55)) if (Math.random() < 0.12) r.chispas.push({ x: x0 + b.x * cel, y: y0 + b.y * cel, vx: (Math.random() - 0.5) * 14, vy: -24 - Math.random() * 30, t: 0, d: 0.5 + Math.random() * 0.8, g: -4, q: 0.8, s: 1 });
    moverChispas(r.chispas, dt, t, 4);
    pintarCalor(r.f, r.fuego, { brillo: 1.1, umbral: 0.12 });
    pegarPixel(r.fuego.c, x0, y0, celda, k * 0.8);
  } else {
    // el canto: el borde de cada letra en brasa, más vivo abajo y donde lo toca la llama, que titila
    const { cw, ch, borde, canto, f } = r, d = canto.im.data, n = BANDAS_LLAMA.length, base = r.arriba * (T.a / celda);
    d.fill(0);
    for (let m = 0; m < borde.length; m++) {
      const i = borde[m], x = i % cw, y = (i - x) / cw;
      const baja = Math.max(0, Math.min(1, 1 - (base - y) / (r.alto * 1.05)));
      const llama = (f.calor[i] + (y + 1 < ch ? f.calor[i + cw] : 0)) / (2 * D.CALOR_MAX);
      const v = 0.22 + baja * 0.42 + llama * 0.5 + 0.06 * Math.sin(t * 9 + x * 0.7 + y);
      const q = banda(Math.min(1, v), n, x, y), b = BANDAS_LLAMA[q], j = i * 4;
      d[j] = b[0]; d[j + 1] = b[1]; d[j + 2] = b[2]; d[j + 3] = q ? 255 : 0;
    }
    canto.g.putImageData(canto.im, 0, 0);
    pegarPixel(canto.c, x0, y0, celda, k * 0.92);
    dibujarChispas(r.chispas, x0, y0, celda, k, t);
  }
}
