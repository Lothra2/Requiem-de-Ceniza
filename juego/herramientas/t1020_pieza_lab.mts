// Laboratorio de piezas del catálogo (sin servidor): pinta con el motor cada variante de una o más piezas, con su huella
// dibujada en el piso y una figura de 75 puntos de alto para la escala, y arma una lámina.
// Uso: npx tsx juego/herramientas/t1020_pieza_lab.mts <id[:var+var],id...> [salida.png] (Z=2 ampliación, COLS=5)
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
const raiz = new URL('../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) await import(raiz + 'catalogo/' + f);
const { pintarObjeto, huellaDe, objeto } = await import(raiz + 'objeto.ts');
const OUT = process.argv[3] || '/tmp/requiem-pruebas/mundos2/piezas/lab.png'; mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const Z = +(process.env.Z || 2), COLS = +(process.env.COLS || 5), CW = +(process.env.CW || 300), CH = +(process.env.CH || 300);
const lista: [string, string][] = [];
for (const q of (process.argv[2] || 'arb_macizo').split(',')) { const [id, vs] = q.split(':'); const d = objeto(id); if (!d) { console.log('no existe', id); continue; } for (const v of vs ? vs.split('+') : d.variantes) lista.push([id, v]); }
const filas = Math.ceil(lista.length / COLS), W = CW * COLS, H = CH * filas, buf = new Uint8ClampedArray(W * H * 4);
const FONDO = (process.env.FONDO || '58,54,48').split(',').map(Number);
for (let i = 0; i < W * H; i++) { buf[i * 4] = FONDO[0]; buf[i * 4 + 1] = FONDO[1]; buf[i * 4 + 2] = FONDO[2]; buf[i * 4 + 3] = 255; }
const punto = (x: number, y: number, c: number[], al = 1) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const t = (y * W + x) * 4; for (let k = 0; k < 3; k++) buf[t + k] = c[k] * al + buf[t + k] * (1 - al); };
lista.forEach(([id, v], n) => {
  const t0 = Date.now(), d = objeto(id), [hw, hh] = huellaDe(d, v), ox = (n % COLS) * CW + CW / 2, oy = Math.floor(n / COLS) * CH + CH * 0.78;
  // la huella: rombo de hw x hh celdas centrado en el ancla
  for (let cy = 0; cy <= hh; cy += 1) for (let cx = 0; cx <= hw; cx += 0.05) { const X = cx - hw / 2, Y = cy - hh / 2; punto(ox + (X - Y) * 16, oy + (X + Y) * 8, [120, 110, 90], 0.7); }
  for (let cx = 0; cx <= hw; cx += 1) for (let cy = 0; cy <= hh; cy += 0.05) { const X = cx - hw / 2, Y = cy - hh / 2; punto(ox + (X - Y) * 16, oy + (X + Y) * 8, [120, 110, 90], 0.7); }
  const r: any = pintarObjeto(id, v, 0, 1), img = r.img ?? r, sx = Math.round(ox - r.ancla[0]), sy = Math.round(oy - r.ancla[1]);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (y * img.w + x) * 4, al = img.data[s + 3] / 255; if (al) punto(sx + x, sy + y, [img.data[s], img.data[s + 1], img.data[s + 2]], al); }
  // la persona de 75 puntos, a la derecha de la huella
  { const px = ox + (hw / 2 + 1.2) * 16, py = oy + (hw / 2 + 1.2) * 8 - 0; for (let y = 0; y < 75; y++) for (let x = -5; x <= 5; x++) if (y < 12 ? Math.abs(x) < 4 : y < 45 ? Math.abs(x) < 6 : Math.abs(Math.abs(x) - 3) < 2) punto(px + x, py - 75 + y, [200, 60, 50], 0.8); }
  console.log(id, v, 'huella', hw, hh, 'sprite', img.w, 'x', img.h, 'ancla', r.ancla.join(','), (Date.now() - t0) + ' ms');
});
const out = new Uint8Array(W * Z * H * Z * 4);
for (let y = 0; y < H * Z; y++) for (let x = 0; x < W * Z; x++) { const s = (Math.floor(y / Z) * W + Math.floor(x / Z)) * 4, t = (y * W * Z + x) * 4; out[t] = buf[s]; out[t + 1] = buf[s + 1]; out[t + 2] = buf[s + 2]; out[t + 3] = 255; }
writeFileSync(OUT, encode({ width: W * Z, height: H * Z, data: out, channels: 4 }));
console.log(OUT);
