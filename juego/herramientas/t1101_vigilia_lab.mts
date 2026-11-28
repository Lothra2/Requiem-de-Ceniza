// Laboratorio de la vigilia (elegir héroe guardado) sin servidor: pinta al héroe con su equipo como lo pinta el obrero
// (opción `vigilia` de pintor.worker.ts: la luz de la fogata de luz_retrato, el grano a la escala y una muestra por punto)
// en las acciones que se pidan, y arma una tira por acción con el tiempo que tardó cada cuadro.
// Uso: npx tsx juego/herramientas/t1101_vigilia_lab.mts <clase> [acc:cuadros,...] [K] [salida]
//   acc:cuadros  'seleccion:0-47/4' (del 0 al 47 de a 4), 'quieto:0-8/1', 'presentar:0-15/2'
//   CONJ=base|armado (el equipo de la prueba t1100), SS=2 doble muestra, DIR=so
import { writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
(globalThis as any).__relieve = true;
if (process.env.AMP) (globalThis as any).__selAmp = +process.env.AMP;
const { personajeEscena } = await import('../../src/engine/gotico/cuerpo.ts');
const { pintarEscena, fijarCalidad } = await import('../../src/engine/gotico/render.ts');
if (process.env.CAL) fijarCalidad(+process.env.CAL);
const { nuevoHeroe, equipoVisual, cuerpoDe } = await import('../src/juego/heroe.ts');
const { crearBase } = await import('../src/juego/objetos.ts');
const { BASES } = await import('../src/datos/objetos_datos.ts');
const { luzVigilia, conGrano } = await import('../src/motor/luz_retrato.ts');

const clase = process.argv[2] || 'arcanista', accs = (process.argv[3] || 'seleccion:0-47/6').split(','), K = +(process.argv[4] || 2.25);
const OUT = process.argv[5] || '/tmp/requiem-pruebas/vigilia/lab'; mkdirSync(OUT, { recursive: true });
const ARMADO: Record<string, Record<string, [string, string, string?]>> = {
  arcanista: { cabeza: ['capucha_lana', 'raro'], torso: ['vestido_luto', 'raro'], izq: ['rodela_bronce', 'raro'], arma: ['hoja_vigilia', 'unico', 'fuego'], pies: ['botas_cuero', 'magico'] },
  berserker: { cabeza: ['casco_hierro', 'magico'], torso: ['coraza_hierro', 'raro'], arma: ['hacha_norte', 'unico', 'frio'], manos: ['guanteletes_malla', 'magico'] },
  nigromante: { cabeza: ['calavera_ritual', 'raro'], torso: ['habito_ceremonial', 'raro'], izq: ['escudo_calavera', 'raro'], arma: ['varita_osario', 'unico', 'sombra'] },
};
const d: any = nuevoHeroe(clase as any, 'Lab'); d.nivel = 30;
if (process.env.CONJ !== 'base') for (const [cas, [id, rar, vivo]] of Object.entries(ARMADO[clase] ?? {})) { const o: any = crearBase(BASES.find((b: any) => b.id === id)!, 30); o.rareza = rar; if (vivo) o.vivo = vivo; d.equipo[cas] = o; }
const cuerpo = cuerpoDe(clase as any), equipo = equipoVisual(d), dir = process.env.DIR || 'so';
const cu = { ...cuerpo, alto: (cuerpo.alto ?? 1) * K };
for (const a of accs) {
  const [acc, rango] = a.split(':'); const [ini, resto] = (rango || '0-7/1').split('-'); const [fin, paso] = resto.split('/');
  const fs: number[] = []; for (let f = +ini; f <= +fin + 1e-9; f += +paso) fs.push(f);
  const imgs: { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray }[] = [];
  const t0 = Date.now();
  for (const f of fs) {
    const e = personajeEscena(cu, equipo, dir, acc, f, { detalle: 2 });
    const r = conGrano(1.5, () => pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...luzVigilia(K) }, resplandor: undefined, ss: +(process.env.SS || 1), sinSombra: true } as any));
    imgs.push({ w: r.img.w, h: r.img.h, ax: r.ancla[0], ay: r.ancla[1], data: r.img.data });
  }
  const ms = (Date.now() - t0) / fs.length;
  // tira: todos con el ancla alineada, sobre gris oscuro, al doble
  const L = Math.max(...imgs.map((i) => i.ax)), R = Math.max(...imgs.map((i) => i.w - i.ax)), T = Math.max(...imgs.map((i) => i.ay)), B = Math.max(...imgs.map((i) => i.h - i.ay));
  const cw = L + R + 4, ch = T + B + 4, Z = 2, W = cw * imgs.length * Z, H = ch * Z, o = new Uint8Array(W * H * 4);
  for (let i = 0; i < o.length; i += 4) { o[i] = 26; o[i + 1] = 22; o[i + 2] = 20; o[i + 3] = 255; }
  imgs.forEach((im, n) => { const ox = n * cw + 2 + L - im.ax, oy = 2 + T - im.ay;
    for (let y = 0; y < im.h; y++) for (let x = 0; x < im.w; x++) { const s = (y * im.w + x) * 4, al = im.data[s + 3] / 255; if (!al) continue;
      for (let zy = 0; zy < Z; zy++) for (let zx = 0; zx < Z; zx++) { const t = (((oy + y) * Z + zy) * W + (ox + x) * Z + zx) * 4; for (let c = 0; c < 3; c++) o[t + c] = o[t + c] * (1 - al) + im.data[s + c] * al; } } });
  const nom = `${OUT}/${clase}_${process.env.CONJ || 'armado'}_${acc}_K${K}.png`;
  writeFileSync(nom, encode({ width: W, height: H, data: o, channels: 4 } as any));
  console.log(nom, fs.length, 'cuadros,', ms.toFixed(0), 'ms cada uno, alto', T);
}
