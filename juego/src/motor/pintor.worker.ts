// Obrero del navegador: pinta los cuadros del héroe con el equipo que lleva puesto.
import { personajeEscena, esqueleto, filoDe } from '../../../src/engine/gotico/cuerpo';
import { pintarEscena, aPantalla, fijarCalidad } from '../../../src/engine/gotico/render';
import { hojaDe } from './hoja';
import { tinte } from '../../../src/engine/gotico/apariencia';
import { luzVigilia, conGrano } from './luz_retrato';
import { intermedio } from './intermedio';

// (luz por GPU: el motor saca también la normal y el alto de cada punto, para reiluminar al héroe con su equipo)
(globalThis as any).__relieve = true;
/** Los materiales teñidos se registran al vuelo en el hilo principal: aquí hay que volver a crearlos. */
function tenir(equipo: any) { for (const m of JSON.stringify(equipo).matchAll(/cu_tinte_(tela|cuero|metal|malla)_([0-9a-f]{6})/g)) tinte('#' + m[2], m[1] as any); }

/** Recorta el cuadro a lo que tiene algo (con su relieve y su alto, si los trae) y anota los búferes que se pasan. */
function recortado(r: any, bufs: ArrayBuffer[], extra: Record<string, unknown> = {}) {
  const img = r.img; let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const corta = (src?: { data: Uint8ClampedArray }) => { if (!src) return undefined; const q = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) q.set(src.data.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4), y * w * 4); bufs.push(q.buffer as ArrayBuffer); return q; };
  return { w, h, ax: r.ancla[0] - x0, ay: r.ancla[1] - y0, data: corta(img), rel: corta(r.rel), alt: corta(r.alt), ...extra };
}

self.onmessage = (ev: MessageEvent) => {
  const { id, cuerpo, equipo, acc, dir, cuadros, calidad, base, clave, retrato, fs, desfase, muneco, vigilia, entre } = ev.data;
  try {
    // el cuadro del medio de la vigilia (motor/intermedio.ts): se arma de sus dos vecinos pintados siguiendo el movimiento
    // (unos 0,2 s en vez de 1,5); la hoja del arma sale exacta del esqueleto de ese cuadro
    if (entre) {
      const t0 = performance.now(), K = entre.K, cu = { ...cuerpo, alto: (cuerpo.alto ?? 1) * K }, f = entre.f;
      const r = intermedio(entre.a, entre.b, entre.R ?? 3, 'mezcla', entre.S ?? 0.5);
      const bufs: ArrayBuffer[] = [r.data.buffer as ArrayBuffer]; if (r.rel) bufs.push(r.rel.buffer as ArrayBuffer); if (r.alt) bufs.push(r.alt.buffer as ArrayBuffer);
      const out = [{ ...r, hoja: hojaDe(esqueleto, aPantalla, cu, equipo, dir, acc, f, filoDe as any), ms: performance.now() - t0, entre: true }];
      (self as any).postMessage({ id, acc, dir, out, clave }, bufs);
      return;
    }
    fijarCalidad(calidad ?? 1);
    tenir(equipo);
    const out: any[] = [];
    const bufs: ArrayBuffer[] = [];
    // el retrato: el héroe en grande (`retrato` veces su alto), con el doble de muestras y la luz cálida de una fogata a
    // su costado, para los menús. Los mismos cuadros de reposo, pintados a ese tamaño en vez de ampliar el sprite chico.
    if (retrato) {
      for (const f of fs as number[]) {
        const e = personajeEscena({ ...cuerpo, alto: (cuerpo.alto ?? 1) * retrato }, equipo, dir, acc, f);
        const r = pintarEscena({ ...e, resplandor: e.resplandor ?? { c: [20 * retrato, -8 * retrato, 6 * retrato], r: 46 * retrato, color: '#ffd0a0' }, ss: 2, sinSombra: true } as any);
        const img = r.img; let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
        for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
        const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Uint8ClampedArray(w * h * 4);
        for (let y = 0; y < h; y++) d.set(img.data.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4), y * w * 4);
        out.push({ w, h, ax: r.ancla[0] - x0, ay: r.ancla[1] - y0, data: d }); bufs.push(d.buffer as ArrayBuffer);
      }
      (self as any).postMessage({ id, acc, dir, out, clave }, bufs);
      return;
    }
    // la vigilia (elegir héroe guardado, ui/vigilia.ts): el héroe a `vigilia` veces su alto con la luz de la fogata de la
    // presentación de las clases (luz_retrato.ts, fuera del motor), los rasgos grandes de la cara y el grano a la escala
    // del cuerpo, a una muestra por punto (pixel art), con su relieve, su alto y la hoja del arma (para el arma viva).
    if (vigilia) {
      const K = vigilia, cu = { ...cuerpo, alto: (cuerpo.alto ?? 1) * K }, t0 = performance.now();
      for (const f of fs as number[]) {
        const e = personajeEscena(cu, equipo, dir, acc, f, { detalle: 2 });
        const r = conGrano(Math.max(1, K / 1.5), () => pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...luzVigilia(K) }, resplandor: undefined, ss: 1, sinSombra: true } as any));
        out.push(recortado(r, bufs, { hoja: hojaDe(esqueleto, aPantalla, cu, equipo, dir, acc, f, filoDe as any), ms: performance.now() - t0 }));
      }
      (self as any).postMessage({ id, acc, dir, out, clave }, bufs);
      return;
    }
    // el muñeco del inventario (ui/muneco.ts): los cuadros de siempre (pixel art, una muestra por punto, la luz del juego)
    // pintados a `muneco` veces el alto, con su relieve y la hoja del arma a esa escala. No es ampliar el sprite chico.
    const K = muneco || 1, cu = K !== 1 ? { ...cuerpo, alto: (cuerpo.alto ?? 1) * K } : cuerpo;
    const lista: number[] = muneco ? (fs as number[]) : Array.from({ length: cuadros }, (_, i) => (base ? (i * base) / cuadros : i) + (desfase ?? 0));
    // (`base`: los cuadros que la acción tiene en el motor; si se piden más, salen los intermedios: el motor acepta medios cuadros)
    for (const f of lista) {
      const r = pintarEscena({ ...personajeEscena(cu, equipo, dir, acc, f), sinSombra: true });
      const img = r.img;
      let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
      for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.data[(y * img.w + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
      const w = x1 - x0 + 1, h = y1 - y0 + 1, d = new Uint8ClampedArray(w * h * 4);
      for (let y = 0; y < h; y++) d.set(img.data.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4), y * w * 4);
      const recorte = (src?: { data: Uint8ClampedArray }) => { if (!src) return undefined; const q = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) q.set(src.data.subarray(((y0 + y) * img.w + x0) * 4, ((y0 + y) * img.w + x1 + 1) * 4), y * w * 4); bufs.push(q.buffer as ArrayBuffer); return q; };
      out.push({ w, h, ax: r.ancla[0] - x0, ay: r.ancla[1] - y0, data: d, hoja: hojaDe(esqueleto, aPantalla, cu, equipo, dir, acc, f, filoDe as any), rel: recorte(r.rel), alt: recorte(r.alt) });
      bufs.push(d.buffer as ArrayBuffer);
    }
    (self as any).postMessage({ id, acc, dir, out, clave }, bufs);
  } catch (e) {
    (self as any).postMessage({ id, acc, dir, clave, error: String(e) });
  }
};
