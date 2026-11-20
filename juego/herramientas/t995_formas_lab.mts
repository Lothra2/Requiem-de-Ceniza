// Laboratorio de las formas del druida (sin servidor): pinta con el motor una bestia (lobo_druida, oso_pardo o cualquiera
// de bestias.ts) en cada acción y rumbo, cuadro a cuadro, como la hornea hornear.mts, y arma una lámina por acción.
// Uso: npx tsx juego/herramientas/t995_formas_lab.mts <id>[,<id>...] [acciones] [rumbos] [salida]   (Z=2 el agrandado)
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
const raiz = new URL('../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) await import(raiz + 'catalogo/' + f);
const { objeto, herramientas } = await import(raiz + 'objeto.ts');
const { pintarEscena } = await import(raiz + 'render.ts');
const ids = (process.argv[2] ?? 'oso_pardo').split(',');
const accs = (process.argv[3] ?? 'quieto,caminar,correr,atacar,herido,morir,especial').split(',');
const dirs = (process.argv[4] ?? 'se,s,so,o,no,n,ne,e').split(',');
const OUT = process.argv[5] ?? '/tmp/requiem-pruebas/poderes5/lab';
mkdirSync(OUT, { recursive: true });
const Z = +(process.env.Z ?? 2);
for (const id of ids) for (const acc of accs) {
  const reg = objeto(`mon_${id}_${acc}`); if (!reg) { console.log('sin', id, acc); continue; }
  const N = acc === 'morir' ? 8 : (reg.cuadros ?? 8);
  const filas: any[][] = [];
  for (const dir of dirs) { const fila: any[] = []; for (let i = 0; i < N; i++) { const a = reg.armar(dir, i, herramientas(1)); const r: any = pintarEscena({ ...(Array.isArray(a) ? { piezas: a } : a), sinSombra: true }); const img = r.img ?? r; fila.push({ w: img.w, h: img.h, ax: r.ancla[0], ay: r.ancla[1], data: img.data }); } filas.push(fila); }
  const todos = filas.flat();
  const izq = Math.max(...todos.map((c) => c.ax)), der = Math.max(...todos.map((c) => c.w - c.ax)), arr = Math.max(...todos.map((c) => c.ay)), aba = Math.max(...todos.map((c) => c.h - c.ay));
  const cw = izq + der + 2, ch = arr + aba + 4, W = cw * N, H = ch * filas.length;
  const out = new Uint8Array(W * Z * H * Z * 4);
  const pon = (x: number, y: number, r: number, g: number, b: number) => { for (let dy = 0; dy < Z; dy++) for (let dx = 0; dx < Z; dx++) { const o = ((y * Z + dy) * W * Z + x * Z + dx) * 4; out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = 255; } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = ((Math.floor(x / cw) + Math.floor(y / ch)) % 2) * 10; pon(x, y, 60 + k, 58 + k, 52 + k); }
  filas.forEach((fila, fy) => fila.forEach((c: any, n: number) => {
    const x0 = n * cw + izq - c.ax, y0 = fy * ch + arr - c.ay;
    for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) { const o = (y * c.w + x) * 4, a = c.data[o + 3] / 255; if (!a) continue; const k = ((Math.floor((x0 + x) / cw) + fy) % 2) * 10, f = 1 - a; pon(x0 + x, y0 + y, c.data[o] * a + (60 + k) * f, c.data[o + 1] * a + (58 + k) * f, c.data[o + 2] * a + (52 + k) * f); }
    pon(n * cw + izq, fy * ch + arr, 255, 0, 0);
  }));
  const nombre = `${OUT}/${id}_${acc}.png`;
  writeFileSync(nombre, encode({ width: W * Z, height: H * Z, data: out, channels: 4 }));
  console.log(nombre, N, todos[0].w, todos[0].h);
}
