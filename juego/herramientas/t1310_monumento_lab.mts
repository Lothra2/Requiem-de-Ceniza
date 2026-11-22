// Laboratorio de los monumentos (sin servidor): pinta las tres piezas de un monumento juntas, cada una en su sitio y en el
// orden del juego (atrás, medio, frente), con una persona de 75 puntos en la puerta, y guarda la lámina entera y un recorte de
// cerca de la portada al doble.
// Uso: npx tsx juego/herramientas/t1310_monumento_lab.mts <id> [variante] [salida_base]   (F=cuadro, SOLO=frente,medio,atras)
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
const raiz = new URL('../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) await import(raiz + 'catalogo/' + f);
const { pintarCuadro } = await import(raiz + 'objeto.ts');
const id = process.argv[2] || 'mon_sol', v = process.argv[3] || 'entera', OUT = process.argv[4] || `/tmp/requiem-pruebas/monumentos/lab_${id}`;
mkdirSync(OUT.replace(/\/[^/]*$/, ''), { recursive: true });
const F = +(process.env.F || 0), solo = (process.env.SOLO || 'atras,medio,frente').split(',');
const piezas: [string, number][] = [['atras', -9], ['medio', 0], ['frente', 7]];
const W = 1100, H = 1200, OX = 520, OY = 900;
const buf = new Uint8ClampedArray(W * H * 4);
const FONDO = (process.env.FONDO || '58,54,48').split(',').map(Number);
for (let i = 0; i < W * H; i++) { buf[i * 4] = FONDO[0]; buf[i * 4 + 1] = FONDO[1]; buf[i * 4 + 2] = FONDO[2]; buf[i * 4 + 3] = 255; }
const punto = (x: number, y: number, c: number[], al = 1) => { x = Math.round(x); y = Math.round(y); if (x < 0 || y < 0 || x >= W || y >= H) return; const t = (y * W + x) * 4; for (let k = 0; k < 3; k++) buf[t + k] = c[k] * al + buf[t + k] * (1 - al); };
// la huella total (13 x 22) en el piso
for (let cy = -12.5; cy <= 9.5; cy += 1) for (let cx = -6.5; cx <= 6.5; cx += 0.05) punto(OX + (cx - cy) * 16, OY + (cx + cy) * 8, [110, 100, 84], 0.5);
for (let cx = -6.5; cx <= 6.5; cx += 1) for (let cy = -12.5; cy <= 9.5; cy += 0.05) punto(OX + (cx - cy) * 16, OY + (cx + cy) * 8, [110, 100, 84], 0.5);
const t0 = Date.now();
for (const [fr, dy] of piezas) {
  if (!solo.includes(fr)) continue;
  const t1 = Date.now(), r: any = pintarCuadro(`${id}_${fr}`, v, F, 1), img = r.img ?? r;
  const ox = OX + (0 - dy) * 16 + 8, oy = OY + (0 + dy) * 8 + 8, sx = Math.round(ox - r.ancla[0]), sy = Math.round(oy - r.ancla[1]);
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) { const s = (y * img.w + x) * 4, al = img.data[s + 3] / 255; if (al) punto(sx + x, sy + y, [img.data[s], img.data[s + 1], img.data[s + 2]], al); }
  console.log(fr, 'sprite', img.w, 'x', img.h, (Date.now() - t1) + ' ms');
}
// la persona de 75 puntos junto a la puerta (celda 2, 9.5)
{ const px = OX + (2 - 10) * 16, py = OY + (2 + 10) * 8; for (let y = 0; y < 75; y++) for (let x = -5; x <= 5; x++) if (y < 12 ? Math.abs(x) < 4 : y < 45 ? Math.abs(x) < 6 : Math.abs(Math.abs(x) - 3) < 2) punto(px + x, py - 75 + y, [200, 60, 50], 0.85); }
const guardar = (nombre: string, x0: number, y0: number, w: number, h: number, Z: number) => {
  const out = new Uint8Array(w * Z * h * Z * 4);
  for (let y = 0; y < h * Z; y++) for (let x = 0; x < w * Z; x++) { const X = Math.min(W - 1, x0 + Math.floor(x / Z)), Y = Math.min(H - 1, y0 + Math.floor(y / Z)), s = (Y * W + X) * 4, t = (y * w * Z + x) * 4; out[t] = buf[s]; out[t + 1] = buf[s + 1]; out[t + 2] = buf[s + 2]; out[t + 3] = 255; }
  writeFileSync(nombre, encode({ width: w * Z, height: h * Z, data: out, channels: 4 }));
};
guardar(OUT + '.png', 0, 0, W, H, 1);
guardar(OUT + '_cerca.png', OX - 330, OY - 380, 420, 420, 2);
console.log(OUT + '.png', OUT + '_cerca.png', (Date.now() - t0) + ' ms');
