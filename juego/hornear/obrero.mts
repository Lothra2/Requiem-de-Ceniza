// Obrero del horneado: pinta cuadros con el motor gótico y los devuelve recortados.
import { parentPort } from 'node:worker_threads';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../../src/engine/gotico');
for (const f of readdirSync(join(raiz, 'catalogo'))) await import(join(raiz, 'catalogo', f));
const { pintarObjeto, objeto, herramientas } = await import(join(raiz, 'objeto.ts'));
const { pintarPiso } = await import(join(raiz, 'pisos.ts'));
const { pintarEscena, aPantalla } = await import(join(raiz, 'render.ts'));
const { personajeEscena, esqueleto } = await import(join(raiz, 'cuerpo.ts'));
const { pintarPoder } = await import(join(raiz, 'poderes.ts'));
const extra = await import('../src/motor/hoja.ts');
const { HEROES } = await import(join(raiz, 'catalogo/personajes.ts'));
const { retrato } = await import(join(raiz, 'retrato.ts'));

type Cuadro = { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray; hoja?: number[] };

function recortar(img: { w: number; h: number; data: Uint8ClampedArray }, ax: number, ay: number): Cuadro {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3] > 0) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
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
        const f = i * (job.paso ?? 1);
        const r = pintarEscena({ ...personajeEscena(job.cuerpo, job.equipo, job.dir, job.acc, f), sinSombra: true });
        const c = recortar(r.img, r.ancla[0], r.ancla[1]);
        c.hoja = extra.hojaDe(esqueleto, aPantalla, job.cuerpo, job.equipo, job.dir, job.acc, f);
        out.push(c);
      }
    } else if (job.tipo === 'retrato') {
      // como retratoHeroe del motor, pero sin sombra: el juego le pone la suya con sus luces
      // El héroe a tamaño de pantalla (5,4 veces el del juego: unos 540 px de alto, que en un monitor de 1080 sale punto
      // por punto) y con la luz de retrato del motor: la fogata a su derecha como luz principal, el otro lado en sombra con
      // un relleno frío y la contraluz que recorta cabeza y hombros. Antes iba a 2,4 y la pantalla lo estiraba al doble.
      const h = HEROES.find((x: any) => x.id === job.id), k = 5.4;
      const LUZ_RETRATO = { ...retrato(k), relieve: 1, cavidad: 1, amb: 0.07, cielo: 0.04, gamma: 1.18, expo: 1.22,
        relleno: { dir: [-0.6, 0.6, 0.35], color: '#6f86b8', fuerza: 0.3, tinte: 0.6 }, sombra: { color: '#0a0c16', fuerza: 0.5, hasta: 0.3 } };
      for (let f = 0; f < job.cuadros; f++) {
        const e = personajeEscena({ ...h.cuerpo, alto: (h.cuerpo.alto ?? 1) * k }, h.niveles[job.nivel], 'so', 'presentar', f);
        const r = pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...LUZ_RETRATO }, resplandor: undefined, ss: 2, sinSombra: true });
        out.push(recortar(r.img, r.ancla[0], r.ancla[1]));
      }
    } else if (job.tipo === 'objeto') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarObjeto(job.id, job.v, f, job.seed); out.push(recortar(r.img, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'bestia') {
      const d = objeto(job.id);
      for (let i = 0; i < job.cuadros; i++) { const f = i * (job.paso ?? 1); const a = d.armar(job.v, f, herramientas(1)); const esc = Array.isArray(a) ? { piezas: a } : a; const r = pintarEscena({ ...esc, sinSombra: true }); out.push(recortar(r.img, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'poder') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarPoder(job.id, job.dir, f); out.push(recortar(r.img, r.ancla[0], r.ancla[1])); }
    } else if (job.tipo === 'piso') {
      for (let f = 0; f < job.cuadros; f++) { const r = pintarPiso(job.id, job.v, f); out.push({ w: r.w, h: r.h, ax: 80, ay: 40, data: r.data }); }
    }
    parentPort!.postMessage({ id: job.id_job, out }, out.map((c) => c.data.buffer as ArrayBuffer));
  } catch (e) {
    parentPort!.postMessage({ id: job.id_job, error: String((e as Error).stack ?? e) });
  }
});
parentPort!.postMessage({ listo: true });
