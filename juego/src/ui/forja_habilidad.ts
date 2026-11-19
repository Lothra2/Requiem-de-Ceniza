// Las casillas de poder del HUD forjado (PC, táctil y la elección de poderes): el ícono pintado de siempre
// (iconos_hab.ts) llevado a pixel entero del tamaño exacto de la casilla, con un afilado suave, su bisel de vidrio a
// pixel (luz arriba a la izquierda, sombra abajo a la derecha, viñeta), y encima los estados: encima, apretado, la
// sombra que gira de la recarga con los segundos, el tinte azul si falta maná o rojo si falta furia, y un destello
// corto cuando el poder vuelve a estar listo.
import { ctx } from '../nucleo/lienzo';
import { Lienzo, PALETA as P } from '../../../src/engine/gotico/hud';
import { iconoPintado } from './iconos_hab';
import { cacheRaster, texto, TITULO } from './comun';
import type { Habilidad } from '../datos/clases';

const iconos = new Map<string, HTMLCanvasElement>();
/** El ícono a pixel entero: s × s puntos, afilado y con su bisel. */
export function iconoPixel(hb: Habilidad, s: number, apagado = false): HTMLCanvasElement {
  const clave = `${hb.id ?? ''}~${hb.glifo}~${hb.color}|${s}|${apagado ? 1 : 0}`;
  let cv = iconos.get(clave); if (cv) return cv;
  cv = document.createElement('canvas'); cv.width = cv.height = s;
  const c = cv.getContext('2d', { willReadFrequently: true })!;
  c.imageSmoothingEnabled = true; (c as any).imageSmoothingQuality = 'high';
  c.drawImage(iconoPintado(hb, s, apagado, false, false, true), 0, 0, s, s);
  const im = c.getImageData(0, 0, s, s), d = im.data, src = new Uint8ClampedArray(d);
  // afilado (máscara de enfoque de un punto): el glifo se lee nítido a pixel entero, sin el velo del achique
  for (let y = 1; y < s - 1; y++) for (let x = 1; x < s - 1; x++) for (let k = 0; k < 3; k++) {
    const i = (y * s + x) * 4 + k, m = (src[i - 4] + src[i + 4] + src[i - s * 4] + src[i + s * 4]) / 4;
    d[i] = src[i] + (src[i] - m) * 0.55;
  }
  // el bisel del vidrio: luz arriba y a la izquierda, sombra abajo y a la derecha, y la viñeta hacia el borde
  for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
    const i = (y * s + x) * 4, e = Math.min(x, y, s - 1 - x, s - 1 - y);
    let k = 1;
    if (e === 0) k = x === 0 || y === 0 ? (x === s - 1 || y === s - 1 ? 0.6 : 1.45) : 0.45;
    else if (e === 1) k = x === 1 || y === 1 ? 1.15 : 0.75;
    else { const cx = (x + 0.5) / s - 0.5, cy = (y + 0.5) / s - 0.5; k = 1 - Math.max(0, Math.hypot(cx, cy) - 0.38) * 0.9; }
    for (let q = 0; q < 3; q++) d[i + q] = Math.min(255, d[i + q] * k + (k > 1.2 ? 18 : 0));
    d[i + 3] = 255;
  }
  c.putImageData(im, 0, 0);
  iconos.set(clave, cv); if (iconos.size > 300) iconos.delete(iconos.keys().next().value!);
  return cv;
}

/** La sombra que gira (a pixel): cubre lo que falta de la recarga, desde arriba en el sentido del reloj, con un filo de latón. */
export function sombraGiro(s: number, paso: number, redondo = false): HTMLCanvasElement {
  return cacheRaster(`forja_giro_${s}_${paso}_${redondo ? 1 : 0}`, () => {
    const l = new Lienzo(s, s), hecho = paso / 48, c = s / 2;
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const rx = x + 0.5 - c, ry = y + 0.5 - c, rr = Math.hypot(rx, ry);
      if (redondo && rr > c) continue;
      let a = Math.atan2(rx, -ry) / (Math.PI * 2); if (a < 0) a += 1;
      if (a >= hecho) l.px(x, y, [4, 3, 2], 0.7);
      const dA = Math.abs(a - hecho) * rr * Math.PI * 2;
      if (hecho > 0 && dA < 0.9 && rr > 1.5) l.px(x, y, P.laton[7], 0.9);
    }
    return l.r;
  });
}

const listo = new Map<string, number>(), cargando = new Set<string>();
export interface EstadoCasilla { hb: Habilidad; apagado?: boolean; encima?: boolean; apretado?: boolean; recarga?: number; total?: number; faltaMana?: boolean; faltaFuria?: boolean; marcado?: boolean; id?: string; chico?: boolean }
/**
 * Pinta la casilla en puntos del lienzo (x, y arriba a la izquierda) de s puntos de dibujo, cada uno de D puntos del
 * lienzo. tx(v): de puntos del lienzo a puntos lógicos (para el texto de los segundos).
 */
export function casillaPoderForjada(x: number, y: number, s: number, D: number, o: EstadoCasilla, aLog: (v: number) => number) {
  const ap = o.apretado ? D : 0;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(iconoPixel(o.hb, s, !!o.apagado), x + ap, y + ap, s * D, s * D);
  if (o.apretado) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x, y, s * D, s * D); ctx.fillStyle = '#000'; ctx.fillRect(x, y, s * D, D); ctx.fillRect(x, y, D, s * D); }
  const rec = Math.max(0, o.recarga ?? 0), tot = Math.max(0.01, o.total ?? 1);
  if (rec > 0) ctx.drawImage(sombraGiro(s, Math.max(0, Math.min(47, Math.floor((1 - rec / tot) * 48)))), x, y, s * D, s * D);
  else if (o.faltaFuria) { ctx.fillStyle = 'rgba(120,10,6,0.5)'; ctx.fillRect(x, y, s * D, s * D); }
  else if (o.faltaMana) { ctx.fillStyle = 'rgba(10,22,120,0.52)'; ctx.fillRect(x, y, s * D, s * D); }
  if (o.marcado) { ctx.fillStyle = '#ffd060'; ctx.fillRect(x, y, s * D, D); ctx.fillRect(x, y + (s - 1) * D, s * D, D); ctx.fillRect(x, y, D, s * D); ctx.fillRect(x + (s - 1) * D, y, D, s * D); }
  if (o.encima && !o.apretado) { ctx.fillStyle = 'rgba(255,236,190,0.13)'; ctx.fillRect(x, y, s * D, s * D); ctx.fillStyle = 'rgba(255,240,200,0.75)'; ctx.fillRect(x, y, s * D, D); ctx.fillRect(x, y, D, s * D); }
  // el destello al quedar listo: un marco de luz que se abre y el vidrio que relumbra
  if (o.id) {
    const ahora = performance.now();
    if (rec > 0) cargando.add(o.id); else if (cargando.delete(o.id)) listo.set(o.id, ahora);
    const e = (ahora - (listo.get(o.id) ?? -1e9)) / 450;
    if (e < 1) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,236,190,${(1 - e) * 0.45})`; ctx.fillRect(x, y, s * D, s * D);
      const m = Math.round(e * 6) * D, a = (1 - e) * 0.9;
      ctx.fillStyle = `rgba(255,220,140,${a})`;
      ctx.fillRect(x - m, y - m, s * D + 2 * m, D); ctx.fillRect(x - m, y + s * D + m - D, s * D + 2 * m, D); ctx.fillRect(x - m, y - m, D, s * D + 2 * m); ctx.fillRect(x + s * D + m - D, y - m, D, s * D + 2 * m);
      ctx.globalCompositeOperation = 'source-over';
    }
  }
  ctx.restore();
  if (rec > 0) {
    const seg = rec >= 9.5 ? String(Math.round(rec)) : rec.toFixed(1), cx = aLog(x + (s * D) / 2), cy = aLog(y + (s * D) / 2), tam = o.chico ? 10 : Math.max(12, Math.round(aLog(s * D) * 0.34));
    texto(seg, cx, cy + tam * 0.36, { alin: 'center', tam, color: '#f4e6c0', fuente: TITULO });
  }
}
