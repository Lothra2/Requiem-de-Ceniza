// Laboratorio de morir con intermedios (sin servidor): pinta la muerte de un monstruo, bestia o jefe con el motor, cuadro
// por cuadro, como la hornea hornear.mts (22 cuadros, 29 los jefes, la clave k en el cuadro 3k o 4k), y arma una tira.
// Con N=8 pinta las 8 claves de antes. Las claves llevan una raya roja abajo.
// Uso: npx tsx juego/herramientas/t930_morir_lab.mts <id>[,<id>...] [dir] [salida]
//   ids: los de MONSTRUOS (zombi, esqueleto, ogro...), de bestias (lobo_sombrio...) o de jefes (jefe_verdugo...).
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
const raiz = new URL('../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) await import(raiz + 'catalogo/' + f);
const { objeto, herramientas } = await import(raiz + 'objeto.ts');
const { pintarEscena } = await import(raiz + 'render.ts');
const { personajeEscena } = await import(raiz + 'cuerpo.ts');
const { MONSTRUOS } = await import(raiz + 'catalogo/personajes.ts');
const extras = await import('../src/datos/hornear_extra.ts');

const ids = (process.argv[2] ?? 'zombi').split(',');
const dir = process.argv[3] ?? 'se';
const OUT = process.argv[4] ?? '/tmp/requiem-pruebas/morir';
mkdirSync(OUT, { recursive: true });
const Z = +(process.env.Z ?? 2);

for (const id of ids) {
  const jefe = id.startsWith('jefe_');
  const N = +(process.env.N ?? (jefe ? 29 : 22)), paso = 7 / (N - 1);
  const hum = [...MONSTRUOS, ...extras.MONSTRUOS_EXTRA].find((m: any) => m.id === id);
  const reg = hum ? null : objeto(jefe ? `${id}_morir` : `mon_${id}_morir`);
  const cuadros: { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray; clave: boolean }[] = [];
  for (let i = 0; i < N; i++) {
    const f = i * paso, clave = Math.abs(f - Math.round(f)) < 1e-6;
    let r: any;
    if (hum) r = pintarEscena({ ...personajeEscena(hum.cuerpo, hum.equipo, dir as any, 'morir', f), sinSombra: true });
    else { const a = reg.armar(dir, f, herramientas(1)); r = pintarEscena({ ...(Array.isArray(a) ? { piezas: a } : a), sinSombra: true }); }
    const img = r.img ?? r;
    cuadros.push({ w: img.w, h: img.h, ax: r.ancla[0], ay: r.ancla[1], data: img.data, clave });
  }
  // todas con el ancla (los pies) en el mismo punto de cada celda
  const izq = Math.max(...cuadros.map((c) => c.ax)), der = Math.max(...cuadros.map((c) => c.w - c.ax));
  const arr = Math.max(...cuadros.map((c) => c.ay)), aba = Math.max(...cuadros.map((c) => c.h - c.ay));
  const cw = izq + der + 2, ch = arr + aba + 4, W = cw * N, H = ch;
  const out = new Uint8Array(W * Z * H * Z * 4);
  const pon = (x: number, y: number, r: number, g: number, b: number, a: number) => { for (let dy = 0; dy < Z; dy++) for (let dx = 0; dx < Z; dx++) { const o = ((y * Z + dy) * W * Z + x * Z + dx) * 4; out[o] = r; out[o + 1] = g; out[o + 2] = b; out[o + 3] = a; } };
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = (Math.floor(x / cw) % 2) * 10; pon(x, y, 34 + k, 32 + k, 30 + k, 255); }
  cuadros.forEach((c, n) => {
    const x0 = n * cw + izq - c.ax, y0 = arr - c.ay;
    for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
      const o = (y * c.w + x) * 4, a = c.data[o + 3] / 255; if (!a) continue;
      const k = (Math.floor((x0 + x) / cw) % 2) * 10, f = 1 - a;
      pon(x0 + x, y0 + y, c.data[o] * a + (34 + k) * f, c.data[o + 1] * a + (32 + k) * f, c.data[o + 2] * a + (30 + k) * f, 255);
    }
    if (c.clave) for (let x = n * cw + 2; x < (n + 1) * cw - 2; x++) pon(x, H - 2, 200, 40, 30, 255);
  });
  const nombre = `${OUT}/${id}_${dir}_${N}.png`;
  writeFileSync(nombre, encode({ width: W * Z, height: H * Z, data: out, channels: 4 }));
  console.log(nombre, N, 'cuadros');
}
