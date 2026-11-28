// Obrero del horneado: pinta cuadros con el motor gótico y los devuelve recortados.
import { parentPort } from 'node:worker_threads';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../../src/engine/gotico');
if (process.env.RELIEVE) (globalThis as any).__relieve = true;
for (const f of readdirSync(join(raiz, 'catalogo'))) await import(join(raiz, 'catalogo', f));
const { pintarObjeto, objeto, herramientas } = await import(join(raiz, 'objeto.ts'));
const { pintarPiso } = await import(join(raiz, 'pisos.ts'));
const { pintarEscena, aPantalla } = await import(join(raiz, 'render.ts'));
const { personajeEscena, esqueleto } = await import(join(raiz, 'cuerpo.ts'));
const { pintarPoder } = await import(join(raiz, 'poderes.ts'));
const extra = await import('../src/motor/hoja.ts');
const { HEROES } = await import(join(raiz, 'catalogo/personajes.ts'));
const { luzRetrato, conGrano, K_RETRATO } = await import('./luz_retrato.mts');

type Cuadro = { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray; hoja?: number[]; rel?: Uint8ClampedArray; alt?: Uint8ClampedArray };

// (laboratorio: con RELIEVE=1 la normal y el alto se recortan con el mismo encuadre que la imagen)
const recortar = (r: any, ax: number, ay: number): Cuadro => { const c = recortar0(r.img ?? r, ax, ay); if (r.rel) { c.rel = recortar0(r.rel, ax, ay, r.img ?? r).data; } if (r.alt) c.alt = recortar0(r.alt, ax, ay, r.img ?? r).data; return c; };
function recortar0(img: { w: number; h: number; data: Uint8ClampedArray }, ax: number, ay: number, guia = img): Cuadro {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (guia.data[(y * img.w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return { w: 1, h: 1, ax: 0, ay: 0, data: new Uint8ClampedArray(4) };
  const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) d.set(img.data.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4), y * w * 4);
  return { w, h, ax: ax - x0, ay: ay - y0, data: d };
}

parentPort!.on('message', (job: any) => {
  try {
    const out: Cuadro[] = [];
    if (job.tipo === 'personaje') {
      for (let i = 0; i < job.cuadros; i++) {
        const f = (i + (job.desfase ?? 0)) * (job.paso ?? 1);
        const r = pintarEscena({ ...personajeEscena(job.cuerpo, job.equipo, job.dir, job.acc, f), sinSombra: true });
        const c = recortar(r, r.ancla[0], r.ancla[1]);
        c.hoja = extra.hojaDe(esqueleto, aPantalla, job.cuerpo, job.equipo, job.dir, job.acc, f);
        out.push(c);
      }
    } else if (job.tipo === 'retrato') {
      // como retratoHeroe del motor, pero sin sombra: el juego le pone la suya con sus luces
      // La presentación es pixel art, como el héroe del juego: a 1,5 veces su tamaño (unos 150 px), para dibujarla a un
      // número entero de puntos por pixel, igual que la fogata y el piso de esa pantalla. (A 5,4 y lisa se veía el muñeco
      // de plastilina: manos, nariz y torso no aguantan un render grande.) Lleva la luz de retrato del motor: la fogata a
      // su derecha como principal, el otro lado en sombra con relleno frío y la contraluz que recorta cabeza y hombros.
      // (18 nov 2026) A 1,5 la cara y las manos eran cuatro manchas: va a 2,25 (el juego lo dibuja a ×2 en 720 y ×3 en
      // 1080), con los rasgos grandes de la cara (`detalle: 2`), el grano de los materiales al tamaño del cuerpo y la luz de
      // luz_retrato.mts: la fogata a la izquierda, delante de la cara.
      const h = HEROES.find((x: any) => x.id === job.id), k = K_RETRATO, LUZ_RETRATO = luzRetrato(k);
      for (let f = 0; f < job.cuadros; f++) {
        const e = personajeEscena({ ...h.cuerpo, alto: (h.cuerpo.alto ?? 1) * k }, h.niveles[job.nivel], 'so', job.acc ?? 'presentar', f, { detalle: 2 });
        const r = conGrano(1.5, () => pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...LUZ_RETRATO }, resplandor: undefined, ss: 2, sinSombra: true }));
        out.push(recortar(r, r.ancla[0], r.ancla[1]));
      }
    } else if (job.tipo === 'objeto') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarObjeto(job.id, job.v, f, job.seed); out.push(recortar(r, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'bestia') {
      const d = objeto(job.id);
      for (let i = 0; i < job.cuadros; i++) { const f = i * (job.paso ?? 1); const a = d.armar(job.v, f, herramientas(1)); const esc = Array.isArray(a) ? { piezas: a } : a; const r = pintarEscena({ ...esc, sinSombra: true }); out.push(recortar(r, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'poder') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarPoder(job.id, job.dir, f); out.push(recortar(r, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'piso') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarPiso(job.id, job.v, f); out.push({ w: r.w, h: r.h, ax: 80, ay: 40, data: r.data, rel: (r as any).rel?.data }); }
    }
    parentPort!.postMessage({ id: job.id_job, out }, out.flatMap((c) => [c.data.buffer, c.rel?.buffer, c.alt?.buffer].filter(Boolean) as ArrayBuffer[]));
  } catch (e) {
    parentPort!.postMessage({ id: job.id_job, error: String((e as Error).stack ?? e) });
  }
});
parentPort!.postMessage({ listo: true });
