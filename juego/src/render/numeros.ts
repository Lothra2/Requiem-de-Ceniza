// Los números de daño: cifras de pixel con canto negro (el mismo grano del HUD), no texto liso del navegador.
//   - saltan del golpe con un brinco corto y se abren hacia un costado, cada uno por su lado, así no se enciman;
//   - el crítico nace más grande, se asienta y lleva doble canto y un destello;
//   - los golpes menores de una racha van chicos; lo que recibe el héroe, en rojo y hacia abajo;
//   - los letreros (falla, Bloqueo, ¡Remate!) usan la letra de los títulos con el mismo canto.
import type { Numero } from '../juego/mundo';

const CIFRA: Record<string, string[]> = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'], '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00110', '01000', '10000', '11111'], '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '-': ['00000', '00000', '00000', '01110', '00000', '00000', '00000'], '+': ['00000', '00100', '00100', '11111', '00100', '00100', '00000'],
};
const cache = new Map<string, HTMLCanvasElement>();
const aclarar = (hex: string, k: number) => { const n = parseInt(hex.slice(1, 7), 16), f = (v: number) => Math.round(v + (255 - v) * k); return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`; };
/** El número ya pintado: cifras con luz arriba, su color abajo y canto negro (doble si es crítico). */
function sello(txt: string, color: string, critico: boolean): HTMLCanvasElement {
  const k = `${txt}|${color}|${critico ? 1 : 0}`; let c = cache.get(k); if (c) return c;
  if (cache.size > 400) cache.clear();
  const m = critico ? 2 : 1, w = txt.length * 6 - 1 + m * 2, h = 7 + m * 2;
  c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!;
  const puntos: [number, number, number][] = [];
  [...txt].forEach((ch, i) => { const g = CIFRA[ch]; if (!g) return; for (let y = 0; y < 7; y++) for (let q = 0; q < 5; q++) if (g[y][q] === '1') puntos.push([m + i * 6 + q, m + y, y]); });
  if (critico) { x.fillStyle = '#5a0a00'; for (const [px, py] of puntos) x.fillRect(px - 2, py - 2, 5, 5); }
  x.fillStyle = '#000'; for (const [px, py] of puntos) x.fillRect(px - 1, py - 1, 3, 3);
  const claro = aclarar(color, 0.55);
  for (const [px, py, fila] of puntos) { x.fillStyle = fila < 3 ? claro : color; x.fillRect(px, py, 1, 1); }
  cache.set(k, c); return c;
}
const azar = new WeakMap<object, number>();
const lado = (n: object) => { let v = azar.get(n); if (v === undefined) { v = Math.random() * 2 - 1; azar.set(n, v); } return v; };

/** Dibuja los números del cuadro. `aPant` lleva del mundo a la pantalla; `fuente` es la letra de los títulos. */
export function dibujarNumeros(ctx: CanvasRenderingContext2D, numeros: Numero[], aPant: (x: number, y: number) => [number, number], fuente: string) {
  const su = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false; ctx.textAlign = 'center';
  const puestos: [number, number, number, number][] = [];
  for (const n of numeros) {
    const [px, py] = aPant(n.x, n.y), t = n.t, vida = 1.1;
    const alfa = t > 0.78 ? Math.max(0, (vida - t) / (vida - 0.78)) : 1;
    const s = lado(n), abre = 1 - Math.exp(-4.5 * t), brinco = Math.sin(Math.min(1, t / 0.3) * Math.PI) * (n.grande ? 9 : 6);
    const x = px + s * (n.grande ? 20 : 15) * abre; let y = py - n.z - brinco;
    ctx.globalAlpha = alfa * (n.chico ? 0.85 : 1);
    if (/^[0-9+\-]+$/.test(n.txt)) {
      const c = sello(n.txt, n.color.length >= 7 ? n.color.slice(0, 7) : '#ffffff', !!n.grande);
      // tamaños enteros: el crítico nace a 4 y se asienta en 3, el normal va a 2 y el menor de una racha a 1 (con canto igual se lee)
      const k = n.grande ? (t < 0.09 ? 4 : 3) : n.menor ? 1.5 : 2, w = Math.round(c.width * k), h = Math.round(c.height * k);
      // que no se encimen: si este cae sobre uno ya puesto en el cuadro, sube un renglón (hasta cuatro)
      let x0 = Math.round(x - w / 2), y0 = Math.round(y - h);
      for (let v = 0; v < 4 && puestos.some((q) => x0 < q[0] + q[2] + 2 && x0 + w + 2 > q[0] && y0 < q[1] + q[3] + 1 && y0 + h + 1 > q[1]); v++) y0 -= h + 2;
      puestos.push([x0, y0, w, h]);
      ctx.drawImage(c, x0, y0, w, h); y = y0 + h;
      if (n.grande && t < 0.22) { const q = 1 - t / 0.22, l = Math.round(6 + q * 8); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = q * 0.9; ctx.fillStyle = '#fff6c0'; ctx.fillRect(Math.round(x) - l, Math.round(y - h / 2), l * 2 + 1, 1); ctx.fillRect(Math.round(x), Math.round(y - h / 2) - l, 1, l * 2 + 1); ctx.globalCompositeOperation = 'source-over'; }
    } else {
      ctx.font = n.chico ? `italic 11px ${fuente}` : `bold ${n.grande ? 17 : 13}px ${fuente}`;
      const xx = Math.round(x), yy = Math.round(y);
      ctx.fillStyle = '#000'; for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [1, 1]]) ctx.fillText(n.txt, xx + dx, yy + dy);
      ctx.fillStyle = n.color; ctx.fillText(n.txt, xx, yy);
    }
  }
  ctx.globalAlpha = 1; ctx.textAlign = 'left'; ctx.imageSmoothingEnabled = su;
}
