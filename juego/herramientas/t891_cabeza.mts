// Cabeza y manos en grande para modelar (K alto, sin pixel art): RAIZ=<repo> npx tsx juego/herramientas/t891_cabeza.mts <salida> <K> <clase,...> [dirs] [acc] [f] [ss] [arma]
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode } from 'fast-png';
const aqui = join(dirname(fileURLToPath(import.meta.url)), '../..');
const RAIZ = process.env.RAIZ ?? aqui;
const { personajeEscena, esqueleto } = await import(join(RAIZ, 'src/engine/gotico/cuerpo.ts'));
const { pintarEscena, aPantalla } = await import(join(RAIZ, 'src/engine/gotico/render.ts'));
const { nuevoHeroe, equipoVisual, cuerpoDe } = await import(join(RAIZ, 'juego/src/juego/heroe.ts'));
const [OUT, Ks, clases, dirs = 's,so,o', acc = 'quieto', fs = '0', sss = '1', armaT] = process.argv.slice(2);
mkdirSync(OUT, { recursive: true });
const K = +Ks;
for (const c0 of clases.split(',')) {
  const [c, mod] = c0.split(':');
  const eq = JSON.parse(JSON.stringify(equipoVisual(nuevoHeroe(c, 'x')))); delete eq.cabeza;
  if (armaT) { eq.arma = { tipo: armaT, mat: 'cu_placa', mango: 'madera' }; if (armaT !== 'espada') delete eq.izq; }
  let cu = { ...cuerpoDe(c) };
  if (mod === 'm') cu = { ...cu, genero: 'm', barba: undefined };
  if (mod === 'h') cu = { ...cu, genero: 'h' };
  if (mod === 'sb') cu = { ...cu, barba: undefined };
  cu.alto = (cu.alto ?? 1) * K;
  for (const dir of dirs.split(',')) {
    const r = pintarEscena({ ...personajeEscena(cu, eq, dir, acc, +fs, { detalle: +(process.env.DET ?? 2) }), sinSombra: true, ss: +sss });
    const e = esqueleto(cu, dir, acc, +fs, eq.arma?.tipo ?? 'nada', eq.izq?.tipo);
    const foco = process.env.MANO ? e.brazos[+process.env.MANO].mano : e.cab(0.5 * e.S, 0, e.cz);
    const p = aPantalla(foco), cx = p[0] + r.ancla[0], cy = p[1] + r.ancla[1], R = (process.env.MANO ? 7 : 10) * K;
    const w = Math.round(2 * R), d = new Uint8Array(w * w * 4);
    for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const sx = Math.round(cx - R) + x, sy = Math.round(cy - R) + y; const o = (y * w + x) * 4; if (sx < 0 || sy < 0 || sx >= r.img.w || sy >= r.img.h || !r.img.data[(sy * r.img.w + sx) * 4 + 3]) { d[o] = 50; d[o + 1] = 45; d[o + 2] = 42; d[o + 3] = 255; continue; } for (let k = 0; k < 4; k++) d[o + k] = r.img.data[(sy * r.img.w + sx) * 4 + k]; }
    writeFileSync(join(OUT, `${c0.replace(':', '_')}_${dir}.png`), encode({ width: w, height: w, data: d, channels: 4 }));
  }
}
