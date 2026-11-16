// Armas vivas: lo que un arma con poder propio hace sola, puesta en la mano, además de la llama que le corre por la hoja.
//   fuego   brasas que suben y gotas de fuego que caen y chisporrotean en el piso
//   frio    vaho helado que baja de la hoja y escarcha que titila
//   rayo    arcos que saltan por la hoja y, cada tanto, uno que descarga a tierra
//   veneno  gotas que caen de la punta y dejan su mancha, burbujas que suben
//   sombra  humo oscuro que se desprende hacia arriba y motas violetas
//   luz     rayos finos que giran en la punta y destellos
//   sangre  gotas que caen
//   acero   (únicas y legendarias sin elemento) un brillo que recorre el filo
// Los cetros, báculos y varitas llevan además un orbe de poder en la cabeza con motas que lo orbitan y un hilo de poder
// que se derrama hasta el piso. Todo es chico, a puntos enteros y pegado al arma: nada de esto tapa al héroe.
// Las partículas viven en coordenadas del mundo (pixeles), así quedan atrás cuando el héroe camina en vez de seguirlo.
import { R } from '../nucleo/azar';

type Clase = 'brasa' | 'gota' | 'vaho' | 'humo' | 'mota' | 'burbuja' | 'mancha';
interface P { x: number; y: number; vx: number; vy: number; t: number; dur: number; c: string; k: Clase; piso: number; tam: number }
const ps: P[] = [];
const MAX = 260;

export type ElemArma = 'fuego' | 'frio' | 'rayo' | 'veneno' | 'sombra' | 'luz' | 'sangre' | 'acero';
const COL: Record<ElemArma, [string, string, string]> = {
  fuego: ['#ff6a18', '#ffd060', '#fff4c0'], frio: ['#58a8ff', '#c8f0ff', '#ffffff'], rayo: ['#8890ff', '#d8dcff', '#ffffff'],
  veneno: ['#38b030', '#b0ff60', '#e8ffb0'], sombra: ['#6a28b0', '#c080ff', '#f0d8ff'], luz: ['#ffd060', '#fff0b0', '#ffffff'],
  sangre: ['#900010', '#e02020', '#ff8070'], acero: ['#a8b8c8', '#e8f0f8', '#ffffff'],
};
const LANZA = /baculo|cetro|varita/;
const acum: Record<string, number> = {};
/** Cuántas salen este cuadro a razón de `porSeg` (con el resto guardado, para que no dependa de los cuadros por segundo). */
function cuota(clave: string, porSeg: number, dt: number): number { const a = (acum[clave] ?? 0) + porSeg * dt, n = Math.floor(a); acum[clave] = a - n; return n; }
function echar(p: P) { if (ps.length < MAX) ps.push(p); }

/** El color principal de un elemento, para la luz del piso. */
export function colorArma(elem: string): string { return (COL[elem as ElemArma] ?? COL.acero)[0]; }

/**
 * El derrame del arma. `hoja` va en pantalla (de la mano a la punta), `pisoY` es la altura de los pies en pantalla y
 * `ox, oy` es dónde cae en pantalla el origen del mundo (para anclar las partículas al piso y no a la cámara).
 */
export function derrameArma(ctx: CanvasRenderingContext2D, hoja: [number, number, number, number], pisoY: number, ox: number, oy: number, elem: ElemArma, tipo: string, t: number, dt: number) {
  const [x0, y0, x1, y1] = hoja, [c0, c1, c2] = COL[elem] ?? COL.acero, lanza = LANZA.test(tipo);
  const en = (u: number): [number, number] => [x0 + (x1 - x0) * u, y0 + (y1 - y0) * u];
  const nace = (u: number, k: Clase, vx: number, vy: number, dur: number, c: string, tam = 1) => { const [x, y] = en(u); echar({ x: x - ox + (R() - 0.5) * 2, y: y - oy + (R() - 0.5) * 2, vx, vy, t: 0, dur, c, k, piso: pisoY - oy + (R() - 0.5) * 5, tam }); };
  const d = Math.min(dt, 0.05);
  ctx.save();
  switch (elem) {
    case 'fuego':
      for (let i = cuota('f1', 16, d); i > 0; i--) nace(0.25 + R() * 0.75, 'brasa', (R() - 0.5) * 14, -22 - R() * 34, 0.5 + R() * 0.6, R() < 0.5 ? c0 : c1);
      for (let i = cuota('f2', 0.9, d); i > 0; i--) nace(0.7 + R() * 0.3, 'gota', (R() - 0.5) * 6, 4, 1.6, c1, 2);
      break;
    case 'frio':
      for (let i = cuota('h1', 13, d); i > 0; i--) nace(0.2 + R() * 0.8, 'vaho', (R() - 0.5) * 7, 9 + R() * 10, 0.9 + R() * 0.7, R() < 0.6 ? c1 : c0, R() < 0.4 ? 2 : 1);
      for (let i = cuota('h2', 4, d); i > 0; i--) nace(R(), 'mota', (R() - 0.5) * 5, (R() - 0.5) * 5, 0.35 + R() * 0.3, c2);
      break;
    case 'rayo': {
      // arcos por la hoja: quebrados, de un punto, que cambian de forma varias veces por segundo
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
      const paso = Math.floor(t * 22);
      for (let a = 0; a < 2; a++) {
        const s = Math.sin(paso * 12.9898 + a * 78.233) * 43758.5453, f = s - Math.floor(s); if (f < 0.35) continue;
        const u0 = 0.1 + f * 0.4, u1 = Math.min(1, u0 + 0.3 + f * 0.3), [ax, ay] = en(u0), [bx, by] = en(u1), nx = -(by - ay), ny = bx - ax, ln = Math.hypot(nx, ny) || 1;
        ctx.strokeStyle = a ? c1 : c2; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.moveTo(Math.round(ax), Math.round(ay));
        for (let q = 1; q <= 4; q++) { const w = q / 4, z = Math.sin(paso * 3.7 + q * 5.1 + a * 9) * 4 * (q < 4 ? 1 : 0); ctx.lineTo(Math.round(ax + (bx - ax) * w + (nx / ln) * z), Math.round(ay + (by - ay) * w + (ny / ln) * z)); }
        ctx.stroke();
      }
      // la descarga a tierra: de la punta al piso, un instante
      if (cuota('r1', 1.1, d) > 0) acum.rT = t;
      const dr = t - (acum.rT ?? -9);
      if (dr >= 0 && dr < 0.09) {
        const px = x1 + Math.sin(acum.rT * 91) * 9, py = pisoY - 1;
        ctx.strokeStyle = c2; ctx.globalAlpha = 0.9 * (1 - dr / 0.09); ctx.beginPath(); ctx.moveTo(Math.round(x1), Math.round(y1));
        for (let q = 1; q <= 5; q++) { const w = q / 5; ctx.lineTo(Math.round(x1 + (px - x1) * w + (q < 5 ? Math.sin(acum.rT * 37 + q * 4.3) * 5 : 0)), Math.round(y1 + (py - y1) * w)); }
        ctx.stroke(); ctx.fillStyle = c1; ctx.fillRect(Math.round(px) - 2, Math.round(py), 5, 1);
      }
      for (let i = cuota('r2', 5, d); i > 0; i--) nace(R(), 'mota', (R() - 0.5) * 30, (R() - 0.5) * 30, 0.12 + R() * 0.15, c2);
      break;
    }
    case 'veneno':
      for (let i = cuota('v1', 2.4, d); i > 0; i--) nace(0.75 + R() * 0.25, 'gota', (R() - 0.5) * 3, 2, 1.8, R() < 0.5 ? c0 : c1, 2);
      for (let i = cuota('v2', 5, d); i > 0; i--) nace(0.2 + R() * 0.8, 'burbuja', (R() - 0.5) * 5, -7 - R() * 8, 0.6 + R() * 0.5, c1);
      break;
    case 'sombra':
      for (let i = cuota('s1', 14, d); i > 0; i--) nace(0.15 + R() * 0.85, 'humo', (R() - 0.5) * 8, -10 - R() * 14, 0.8 + R() * 0.7, R() < 0.5 ? '#12061e' : '#2a1040', 2 + (R() < 0.3 ? 1 : 0));
      for (let i = cuota('s2', 5, d); i > 0; i--) nace(R(), 'mota', (R() - 0.5) * 9, -6 - R() * 10, 0.4 + R() * 0.4, c1);
      break;
    case 'luz': {
      ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
      const pul = 0.6 + 0.4 * Math.sin(t * 3.1);
      for (let i = 0; i < 6; i++) { const a = t * 0.7 + (i * Math.PI) / 3, l = (i % 2 ? 7 : 12) * pul + 3, g = ctx.createLinearGradient(x1, y1, x1 + Math.cos(a) * l, y1 + Math.sin(a) * l); g.addColorStop(0, c2); g.addColorStop(1, c0 + '00'); ctx.strokeStyle = g; ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.moveTo(Math.round(x1), Math.round(y1)); ctx.lineTo(Math.round(x1 + Math.cos(a) * l), Math.round(y1 + Math.sin(a) * l)); ctx.stroke(); }
      for (let i = cuota('l1', 6, d); i > 0; i--) nace(R(), 'mota', (R() - 0.5) * 8, -4 - R() * 9, 0.4 + R() * 0.4, R() < 0.5 ? c1 : c2);
      break;
    }
    case 'sangre':
      for (let i = cuota('g1', 2, d); i > 0; i--) nace(0.6 + R() * 0.4, 'gota', (R() - 0.5) * 3, 2, 1.8, R() < 0.6 ? c0 : c1, 2);
      break;
    case 'acero': {
      // el brillo que recorre el filo: de la guarda a la punta, y un destello en cruz cuando llega
      const ciclo = (t % 2.6) / 2.6;
      ctx.globalCompositeOperation = 'lighter';
      if (ciclo < 0.22) { const u = ciclo / 0.22, [gx, gy] = en(u); ctx.fillStyle = c2; ctx.globalAlpha = 0.9; ctx.fillRect(Math.round(gx) - 1, Math.round(gy) - 1, 2, 2); const [hx, hy] = en(Math.max(0, u - 0.12)); ctx.globalAlpha = 0.4; ctx.fillRect(Math.round(hx), Math.round(hy), 1, 1); }
      else if (ciclo < 0.32) { const k = 1 - (ciclo - 0.22) / 0.1, l = Math.round(1 + k * 4); ctx.fillStyle = c2; ctx.globalAlpha = k; ctx.fillRect(Math.round(x1) - l, Math.round(y1), l * 2 + 1, 1); ctx.fillRect(Math.round(x1), Math.round(y1) - l, 1, l * 2 + 1); }
      break;
    }
  }
  ctx.restore();

  // los que lanzan: el orbe de poder en la cabeza, sus motas en órbita y el hilo que se derrama
  if (lanza && elem !== 'acero') {
    const pul = 0.75 + 0.25 * Math.sin(t * 4.2), r = (tipo === 'varita' ? 5 : 8) * pul + 2, hx = Math.round(x1), hy = Math.round(y1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(hx, hy, 0, hx, hy, r); g.addColorStop(0, c2 + 'ee'); g.addColorStop(0.3, c1 + 'aa'); g.addColorStop(1, c0 + '00');
    ctx.fillStyle = g; ctx.fillRect(hx - r, hy - r, r * 2, r * 2);
    ctx.fillStyle = c2; ctx.fillRect(hx - 1, hy - 1, 2, 2);
    for (let i = 0; i < 3; i++) { const a = t * 3.2 + (i * Math.PI * 2) / 3, mx = hx + Math.round(Math.cos(a) * (r * 0.9 + 2)), my = hy + Math.round(Math.sin(a) * (r * 0.42 + 1)); ctx.globalAlpha = 0.5 + 0.5 * Math.sin(a); ctx.fillStyle = i ? c1 : c2; ctx.fillRect(mx, my, 1, 1); }
    ctx.restore();
    for (let i = cuota('o1', 9, d); i > 0; i--) echar({ x: hx - ox + (R() - 0.5) * 4, y: hy - oy + 2, vx: (R() - 0.5) * 10, vy: 6 + R() * 8, t: 0, dur: 1.4, c: R() < 0.6 ? c1 : c0, k: 'gota', piso: pisoY - oy + (R() - 0.5) * 6, tam: 1 });
  }
}

/** Avanza y dibuja las partículas de todas las armas vivas (una vez por cuadro, después de los cuerpos). */
export function dibujarDerrames(ctx: CanvasRenderingContext2D, ox: number, oy: number, dt: number) {
  if (!ps.length) return;
  const d = Math.min(dt, 0.05);
  ctx.save();
  for (let i = ps.length - 1; i >= 0; i--) {
    const p = ps[i]; p.t += d;
    if (p.t >= p.dur) { ps.splice(i, 1); continue; }
    const v = p.t / p.dur;
    if (p.k === 'gota') {
      p.vy += 260 * d; p.x += p.vx * d; p.y += p.vy * d;
      if (p.y >= p.piso) { p.k = 'mancha'; p.y = p.piso; p.t = 0; p.dur = 0.55; for (let q = 0; q < 2 && ps.length < MAX; q++) ps.push({ x: p.x, y: p.y, vx: (R() - 0.5) * 26, vy: -14 - R() * 16, t: 0, dur: 0.22 + R() * 0.12, c: p.c, k: 'brasa', piso: p.piso, tam: 1 }); continue; }
    } else if (p.k === 'mancha') { /* quieta en el piso */ }
    else { p.x += p.vx * d; p.y += p.vy * d; if (p.k === 'brasa') { p.vx += (R() - 0.5) * 60 * d; p.vy += 14 * d; } else if (p.k === 'vaho') p.vx *= 1 - d; else if (p.k === 'humo') { p.vx += (R() - 0.5) * 30 * d; } else if (p.k === 'burbuja') p.vx = Math.sin((p.t + p.x) * 9) * 6; }
    const x = Math.round(p.x + ox), y = Math.round(p.y + oy);
    ctx.fillStyle = p.c;
    switch (p.k) {
      case 'humo': ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.5 * (1 - v) * Math.min(1, v * 6); ctx.fillRect(x - 1, y - 1, p.tam + Math.round(v * 2), p.tam + Math.round(v * 2)); break;
      case 'vaho': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (1 - v); ctx.fillRect(x, y, p.tam, p.tam); break;
      case 'mancha': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * (1 - v); ctx.fillRect(x - 1 - Math.round(v * 2), y, 3 + Math.round(v * 4), 1); break;
      case 'mota': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(v * Math.PI); ctx.fillRect(x, y, 1, 1); if (v > 0.3 && v < 0.7) { ctx.globalAlpha *= 0.6; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } break;
      case 'burbuja': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7 * (1 - v); ctx.fillRect(x, y, 1, 1); break;
      case 'gota': ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.95; ctx.fillRect(x, y, 1, p.tam + 1); break;
      default: ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1 - v; ctx.fillRect(x, y, 1, 1);
    }
  }
  ctx.restore();
}

/** La luz que el arma viva echa en el piso, a los pies (va detrás del cuerpo). */
export function luzPisoArma(ctx: CanvasRenderingContext2D, px: number, py: number, elem: string, t: number, k = 1) {
  if (elem === 'acero' || elem === 'sangre') return;
  const c = colorArma(elem), pul = 0.8 + 0.2 * Math.sin(t * 5.3) * Math.sin(t * 1.7);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(Math.round(px), Math.round(py)); ctx.scale(1, 0.5);
  const r = 34 * k, g = ctx.createRadialGradient(0, 0, 2, 0, 0, r); g.addColorStop(0, c + '38'); g.addColorStop(0.6, c + '14'); g.addColorStop(1, c + '00');
  ctx.globalAlpha = pul * (elem === 'sombra' ? 0.7 : 1); ctx.fillStyle = g; ctx.fillRect(-r, -r, r * 2, r * 2);
  ctx.restore();
}
