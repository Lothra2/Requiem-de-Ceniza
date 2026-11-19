// Medidor de rendimiento (F3): cuadros por segundo de verdad y cuánto se lleva cada parte del cuadro, para saber en el
// equipo de Rick dónde se va el tiempo (en la nube Chromium pinta sin tarjeta y no sirve para eso).
// - fps y el 1 % más lento salen del intervalo entre cuadros (lo que se ve).
// - lógica, mundo, luz e interfaz son tiempo de JavaScript del hilo principal. Si la suma es mucho menor que el intervalo,
//   lo que frena es la tarjeta gráfica (o el compositor), no el código.
// - con el medidor abierto también cuenta las llamadas de dibujo por cuadro.
import { ctx, W, H, RES, ZM } from './lienzo';
import { lab, infoGPU } from '../render/luz_gpu';

/** on: medir fases (barato); llamadas: además contar y cronometrar cada llamada de dibujo (solo con F3 abierto). */
export const rend = { on: false, llamadas: false };
const fases: Record<string, number> = {};
// Tramos del pase del mundo (piso, objetos, sombras, efectos, luz, niebla...): cada tramo() cierra el anterior. Con el
// medidor cerrado es una comparación y nada más.
const tramos: Record<string, number> = {}; let tTramo = 0, tramoAbierto = '';
export function tramo(nombre: string) {
  if (!rend.on) return;
  const t = performance.now();
  if (tramoAbierto) tramos[tramoAbierto] = (tramos[tramoAbierto] ?? 0) + (t - tTramo);
  tramoAbierto = nombre; tTramo = t;
}
export function cerrarTramos() {
  if (!rend.on) return;
  tramo('');
  for (const k in tramos) { fases['m.' + k] = (fases['m.' + k] ?? tramos[k]) * 0.9 + tramos[k] * 0.1; tramos[k] = 0; }
}
let t0 = 0, ultimo = 0;
const intervalos: number[] = [];
let llamadas = 0, llamadasCuadro = 0, envuelto = false;
const caras = new Map<string, number>(); let topCaras: [string, number][] = []; let tTop = 0;

export function medir<T>(nombre: string, f: () => T): T {
  if (!rend.on) return f();
  const a = performance.now(); try { return f(); } finally { const d = performance.now() - a; fases[nombre] = (fases[nombre] ?? d) * 0.9 + d * 0.1; }
}
export function empezarCuadro(ahora: number) {
  if (ultimo) { intervalos.push(ahora - ultimo); if (intervalos.length > 240) intervalos.shift(); }
  ultimo = ahora; t0 = performance.now();
  if (rend.llamadas) { llamadasCuadro = llamadas; llamadas = 0; if (ahora - tTop > 1000) { const seg = (ahora - tTop) / 1000; topCaras = [...caras].sort((x, y) => y[1] - x[1]).slice(0, 4).map(([k, v]) => [k, v / Math.max(1, (seg * 1000) / Math.max(1, intervalos[intervalos.length - 1] ?? 16))]); caras.clear(); tTop = ahora; } }
}
export function terminarCuadro() { if (rend.on) { const d = performance.now() - t0; fases.total = (fases.total ?? d) * 0.9 + d * 0.1; } }

function envolver() {
  if (envuelto) return; envuelto = true;
  const P = CanvasRenderingContext2D.prototype as any;
  // cada llamada se mide y se agrupa por método, destino (pantalla u otro lienzo) y fuente (atlas, lienzo, bitmap y su
  // tamaño): si algo frena (una lectura de la tarjeta, una imagen que se vuelve a descomprimir) sale arriba de la lista
  for (const k of ['drawImage', 'fillRect', 'fill', 'stroke', 'putImageData', 'getImageData', 'clip']) {
    const o = P[k];
    P[k] = function (this: CanvasRenderingContext2D, ...a: any[]) {
      if (!rend.llamadas) return o.apply(this, a);
      llamadas++; const t = performance.now(); const r = o.apply(this, a); const dt = performance.now() - t;
      if (dt > 0.05) { const src = k === 'drawImage' ? ` <- ${a[0]?.constructor?.name ?? '?'} ${a[0]?.width}x${a[0]?.height}` : ''; const dst = this.canvas === ctx.canvas ? 'pantalla' : `lienzo ${this.canvas.width}x${this.canvas.height}`; const key = `${k} ${dst}${src}`; caras.set(key, (caras.get(key) ?? 0) + dt); }
      return r;
    };
  }
}
export function alternar() { rend.on = rend.llamadas = !rend.on; if (rend.on) envolver(); }
// para las pruebas: las fases sin el envoltorio de las llamadas (que cuesta), y leerlas
(window as any).__rendFases = { ligero: (on: boolean) => { rend.on = on; rend.llamadas = false; for (const k in fases) delete fases[k]; }, leer: () => Object.fromEntries(Object.entries(fases).map(([k, x]) => [k, +x.toFixed(2)])) };
if (typeof addEventListener === 'function') addEventListener('keydown', (e: KeyboardEvent) => { if (e.key === 'F3') { e.preventDefault(); alternar(); } });
(window as any).__rend = () => ({ ...informe() });

// el mundo por partes, de a tres por fila
function tramosTexto(f: Record<string, number>): string[] {
  const ts = Object.entries(f).filter(([k]) => k.startsWith('m.')).map(([k, v]) => `${k.slice(2)} ${v.toFixed(1)}`);
  const filas: string[] = []; for (let i = 0; i < ts.length; i += 3) filas.push('    ' + ts.slice(i, i + 3).join('   ')); return filas;
}
function informe() {
  const v = [...intervalos].sort((a, b) => a - b), n = v.length || 1, med = v.reduce((s, x) => s + x, 0) / n;
  const p99 = v[Math.floor(n * 0.99)] ?? 0;
  return { caras: topCaras, fps: +(1000 / (med || 16.7)).toFixed(1), bajo1: +(1000 / (p99 || 16.7)).toFixed(1), cuadroMs: +med.toFixed(1), fases: Object.fromEntries(Object.entries(fases).map(([k, x]) => [k, +x.toFixed(2)])), luzMs: +lab.ms.toFixed(2), luz: lab.on, gpu: infoGPU.que, llamadas: llamadasCuadro, lienzo: `${ctx.canvas.width}x${ctx.canvas.height}`, RES: +RES.toFixed(2), ZM: +ZM.toFixed(2) };
}

export function dibujarRendimiento() {
  if (!rend.on) return;
  const r = informe(), f = r.fases;
  const filas = [
    `${r.fps} fps   1% bajo ${r.bajo1}   cuadro ${r.cuadroMs} ms`,
    `JS total ${f.total ?? 0} ms`,
    `  lógica ${f.logica ?? 0}   mundo ${f.mundo ?? 0}   interfaz ${f.interfaz ?? 0}`,
    `  luz avanzada ${r.luz ? r.luzMs + ' ms' : 'apagada'}   llamadas ${r.llamadas}`,
    ...tramosTexto(f),
    `lienzo ${r.lienzo}  res ${r.RES}  vista ${r.ZM}`,
    `GPU ${r.gpu.slice(0, 64)}`,
    (f.total ?? 0) < r.cuadroMs * 0.6 ? 'lo que frena: la tarjeta gráfica' : 'lo que frena: el código (JS)',
    ...topCaras.map(([k, v]) => `${v.toFixed(1)} ms  ${k}`.slice(0, 58)),
  ];
  ctx.save(); ctx.setTransform(RES, 0, 0, RES, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  ctx.font = '11px monospace'; const w = 380, h = filas.length * 14 + 10;
  ctx.fillStyle = 'rgba(0,0,0,0.78)'; ctx.fillRect(W - w - 8, H / 2 - h / 2, w, h);
  filas.forEach((t, i) => { ctx.fillStyle = i === 0 ? (r.fps >= 55 ? '#8f8' : r.fps >= 30 ? '#ff8' : '#f88') : '#ddd'; ctx.fillText(t, W - w, H / 2 - h / 2 + 16 + i * 14); });
  ctx.restore();
}
