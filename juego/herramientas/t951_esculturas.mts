// Lab sin servidor del HUD forjado: hornea las esculturas y las piezas del panel y las guarda ampliadas.
// Uso: npx tsx juego/herramientas/t951_esculturas.mts [ampliación]   (salida en /tmp/requiem-pruebas/hud/lab)
import { writeFileSync, mkdirSync } from 'fs';
import { encode } from 'fast-png';
import { gargola, doliente, Taller } from '../src/ui/forja_taller';
const OUT = '/tmp/requiem-pruebas/hud/lab'; mkdirSync(OUT, { recursive: true });
const K = +(process.argv[2] || 6);
function guardar(nombre: string, r: { w: number; h: number; data: Uint8ClampedArray | Uint8Array }) {
  const w = r.w * K, h = r.h * K, d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = ((y / K | 0) * r.w + (x / K | 0)) * 4, o = (y * w + x) * 4, a = r.data[i + 3] / 255;
    // sobre un fondo de mundo oscuro
    const bg = [34, 30, 28];
    for (let c = 0; c < 3; c++) d[o + c] = Math.round(r.data[i + c] * a + bg[c] * (1 - a)); d[o + 3] = 255;
  }
  writeFileSync(`${OUT}/${nombre}.png`, encode({ width: w, height: h, data: d, channels: 4 }));
}
for (const f of [1, 0.85]) {
  const g = gargola(f, 1), dl = doliente(f, -1);
  const t = new Taller(g.t.w + dl.t.w + 30, Math.max(g.t.h, dl.t.h) + 20);
  // un pedestal debajo de cada una
  t.caja(4, t.h - 18, g.t.w - 8, 18, 1, 0, 3);
  t.caja(g.t.w + 30 + 4, t.h - 18, dl.t.w - 8, 18, 1, 0, 3);
  t.pegar(g.t, 0, t.h - 18 - g.t.h + 6 * f, 4);
  t.pegar(dl.t, g.t.w + 30, t.h - 18 - dl.t.h + 3 * f, 4);
  guardar(`esculturas_${f}`, t.hornear().r);
}
console.log('listo', OUT);
// el marco entero del panel de PC (normal a 1280 × 720 y compacto a 960 × 540, el de 1080), sin orbes ni íconos
import { geometria, tallarMarco, grabarTeclas } from '../src/ui/forja_panel';
for (const [w, h, k] of [[1280, 720, 2], [960, 540, 2], [1707, 540, 1]] as [number, number, number][]) {
  const g = geometria(w, h); if (!g) continue;
  const t0 = Date.now(), tl = tallarMarco(g), l = tl.hornear({ sombraMundo: 7 }); grabarTeclas(l, g);
  console.log(`marco ${w}x${h}: ${Date.now() - t0} ms`);
  const r = l.r, KK = k, ww = r.w * KK, hh = r.h * KK, d = new Uint8Array(ww * hh * 4);
  for (let y = 0; y < hh; y++) for (let x = 0; x < ww; x++) { const i = ((y / KK | 0) * r.w + (x / KK | 0)) * 4, o = (y * ww + x) * 4, a = r.data[i + 3] / 255; const bg = [38, 32, 28]; for (let c = 0; c < 3; c++) d[o + c] = Math.round(r.data[i + c] * a + bg[c] * (1 - a)); d[o + 3] = 255; }
  writeFileSync(`${OUT}/marco_${w}x${h}.png`, encode({ width: ww, height: hh, data: d, channels: 4 }));
}
