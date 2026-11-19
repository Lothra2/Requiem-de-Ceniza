// Laboratorio de las esquinas de muro (sin servidor): arma con el motor la V de dos muros como la pone zona.ts (el muro en
// x de la baldosa de la izquierda y el muro en y de la de arriba) y pega los sprites en su orden, sin y con la esquina
// (`muro_esquina`). Uso: VARIANTES=obra_cementerio,mon_muro npx tsx juego/herramientas/t911_esquina_lab.mts
// Sale en /tmp/requiem-pruebas/esquinas/lab_<variante>.png (izquierda antes, derecha con la esquina), a doble tamaño.
import { readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
const raiz = new URL('../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) await import(raiz + 'catalogo/' + f);
const { pintarObjeto, huellaDe, objeto } = await import(raiz + 'objeto.ts');
const { ESQUINAS_MURO } = await import(raiz + 'catalogo/muros.ts');
const OUT = '/tmp/requiem-pruebas/esquinas'; mkdirSync(OUT, { recursive: true });
const VS = (process.env.VARIANTES ?? Object.keys(ESQUINAS_MURO).join(',')).split(',');
const W = 300, H = 300;
for (const v of VS) {
  const [id, vx, vy] = ESQUINAS_MURO[v];
  const d = objeto(id), [hwx, hhx] = huellaDe(d, vx), [hwy, hhy] = huellaDe(d, vy), g = Math.max(hhx, hwy);
  // como zona.ts: baldosa de la esquina en (0, 0)
  // (L=1: la L del fondo de una sala, los dos muros de la misma baldosa)
  const L = !!process.env.L;
  const ox = { id, v: vx, cx: Math.round((L ? 0 : -5) + (hwx - 1) / 2), cy: Math.round((hhx - 1) / 2), hw: hwx, hh: hhx };
  const oy = { id, v: vy, cx: Math.round((hwy - 1) / 2), cy: Math.round((L ? 0 : -5) + (hhy - 1) / 2), hw: hwy, hh: hhy };
  const oe = { id: 'muro_esquina', v, cx: g > 1 ? 1 : 0, cy: g > 1 ? 1 : 0, hw: 1, hh: 1 };
  const lienzo = (con: boolean) => {
    const buf = new Uint8ClampedArray(W * H * 4);
    for (let i = 0; i < W * H; i++) { buf[i * 4] = 46; buf[i * 4 + 1] = 42; buf[i * 4 + 2] = 40; buf[i * 4 + 3] = 255; }
    const lista = [ox, oy, ...(con && !L ? [oe] : [])].map((o) => ({ o, prof: o.cx + o.cy + (o.hw + o.hh) / 2 - 1 })).sort((a, b) => a.prof - b.prof);
    for (const { o } of lista) {
      const r: any = pintarObjeto(o.id, o.v, 0, 1), img = r.img ?? r;
      const sx = Math.round(W / 2 + (o.cx + 0.5 - (o.cy + 0.5)) * 16 - r.ancla[0]), sy = Math.round(H * 0.72 + (o.cx + 0.5 + o.cy + 0.5) * 8 - r.ancla[1]);
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) {
        const X = sx + x, Y = sy + y; if (X < 0 || Y < 0 || X >= W || Y >= H) continue;
        const s = (y * img.w + x) * 4, a = img.data[s + 3] / 255; if (!a) continue;
        const t = (Y * W + X) * 4; for (let k = 0; k < 3; k++) buf[t + k] = img.data[s + k] * a + buf[t + k] * (1 - a);
      }
    }
    return buf;
  };
  const a = lienzo(false), b = lienzo(true), Z = 2, out = new Uint8Array(W * 2 * Z * H * Z * 4);
  for (let y = 0; y < H * Z; y++) for (let x = 0; x < W * 2 * Z; x++) {
    const src = x < W * Z ? a : b, sx = Math.floor((x % (W * Z)) / Z), sy = Math.floor(y / Z), s = (sy * W + sx) * 4, t = (y * W * 2 * Z + x) * 4;
    out[t] = src[s]; out[t + 1] = src[s + 1]; out[t + 2] = src[s + 2]; out[t + 3] = 255;
  }
  writeFileSync(`${OUT}/lab${L ? 'L' : ''}_${v}.png`, encode({ width: W * 2 * Z, height: H * Z, data: out, channels: 4 }));
  console.log('lab', v);
}
