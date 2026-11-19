// Medidor de rendimiento (F3): cuadros por segundo de verdad y cuánto se lleva cada parte del cuadro, para saber en el
// equipo de Rick dónde se va el tiempo (en la nube Chromium pinta sin tarjeta y no sirve para eso).
// - fps y el 1 % más lento salen del intervalo entre cuadros (lo que se ve).
// - lógica, mundo, luz e interfaz son tiempo de JavaScript del hilo principal. Si la suma es mucho menor que el intervalo,
//   lo que frena es la tarjeta gráfica (o el compositor), no el código.
// - con el medidor abierto también cuenta las llamadas de dibujo por cuadro.
import { ctx, W, H, RES, ZM } from './lienzo';
import { lab, infoGPU } from '../render/luz_gpu';

export const rend = { on: false };
const fases: Record<string, number> = {};
let t0 = 0, ultimo = 0;
const intervalos: number[] = [];
let llamadas = 0, llamadasCuadro = 0, envuelto = false;

export function medir<T>(nombre: string, f: () => T): T {
  if (!rend.on) return f();
  const a = performance.now(); try { return f(); } finally { fases[nombre] = (fases[nombre] ?? 0) * 0.9 + (performance.now() - a) * 0.1; }
}
export function empezarCuadro(ahora: number) {
  if (ultimo) { intervalos.push(ahora - ultimo); if (intervalos.length > 240) intervalos.shift(); }
  ultimo = ahora; t0 = performance.now();
  if (rend.on) { llamadasCuadro = llamadas; llamadas = 0; }
}
export function terminarCuadro() { if (rend.on) fases.total = (fases.total ?? 0) * 0.9 + (performance.now() - t0) * 0.1; }

function envolver() {
  if (envuelto) return; envuelto = true;
  const P = CanvasRenderingContext2D.prototype as any;
  for (const k of ['drawImage', 'fillRect', 'fill', 'stroke', 'putImageData']) { const o = P[k]; P[k] = function (...a: any[]) { if (rend.on) llamadas++; return o.apply(this, a); }; }
}
export function alternar() { rend.on = !rend.on; if (rend.on) envolver(); }
if (typeof addEventListener === 'function') addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'F3') { e.preventDefault(); alternar(); } });
(window as any).__rend = () => ({ ...informe() });

function informe() {
  const v = [...intervalos].sort((a, b) => a - b), n = v.length || 1, med = v.reduce((s, x) => s + x, 0) / n;
  const p99 = v[Math.floor(n * 0.99)] ?? 0;
  return { fps: +(1000 / (med || 16.7)).toFixed(1), bajo1: +(1000 / (p99 || 16.7)).toFixed(1), cuadroMs: +med.toFixed(1), fases: Object.fromEntries(Object.entries(fases).map(([k, x]) => [k, +x.toFixed(2)])), luzMs: +lab.ms.toFixed(2), luz: lab.on, gpu: infoGPU.que, llamadas: llamadasCuadro, lienzo: `${ctx.canvas.width}x${ctx.canvas.height}`, RES: +RES.toFixed(2), ZM: +ZM.toFixed(2) };
}

export function dibujarRendimiento() {
  if (!rend.on) return;
  const r = informe(), f = r.fases;
  const filas = [
    `${r.fps} fps   1% bajo ${r.bajo1}   cuadro ${r.cuadroMs} ms`,
    `JS total ${f.total ?? 0} ms`,
    `  lógica ${f.logica ?? 0}   mundo ${f.mundo ?? 0}   interfaz ${f.interfaz ?? 0}`,
    `  luz avanzada ${r.luz ? r.luzMs + ' ms' : 'apagada'}   llamadas ${r.llamadas}`,
    `lienzo ${r.lienzo}  res ${r.RES}  vista ${r.ZM}`,
    `GPU ${r.gpu.slice(0, 64)}`,
    (f.total ?? 0) < r.cuadroMs * 0.6 ? 'lo que frena: la tarjeta gráfica' : 'lo que frena: el código (JS)',
  ];
  ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.font = '11px monospace'; const w = 330, h = filas.length * 14 + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(W - w - 8, H / 2 - h / 2, w, h);
  filas.forEach((t, i) => { ctx.fillStyle = i === 0 ? (r.fps >= 55 ? '#8f8' : r.fps >= 30 ? '#ff8' : '#f88') : '#ddd'; ctx.fillText(t, W - w, H / 2 - h / 2 + 16 + i * 14); });
  ctx.restore();
}
