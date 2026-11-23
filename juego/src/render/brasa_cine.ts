// La brasa de las cinemáticas (ui/director.ts): la astilla de Ozmaren que escapa. Todo en la grilla del mundo (una celda
// por punto del dibujo, a puntos enteros del aparato): el núcleo de pixel que late, un fuego de Doom chico que sube de él,
// la estela de celdas que se enfría hacia atrás cuando corre, y chispas que se sueltan. El resplandor sí es blando (es luz).
import * as D from '../../../src/engine/gotico/fuego_doom';
import { capa, pintarCalor, pegarPixel, moverChispas, dibujarChispas, BANDAS_LLAMA, type Capa, type Chispa } from '../ui/fuego_pixel';

export interface EstadoBrasa { f: D.Fuego; cp: Capa; chispas: Chispa[]; rastro: [number, number, number][]; acum: number; t: number; ult: [number, number] | null; vel: number }
const FW = 22, FH = 34;
export function reiniciarBrasa(): EstadoBrasa {
  const f = D.crearFuego({ ancho: FW, alto: FH, semilla: 31, paleta: 'infierno', forma: { tipo: 'llama', ancho: 0.32, afinar: 0.55 }, altura: 0.7, viento: 0, rafagas: 0.25, turbulencia: 0.5, ruido: 0.4, humo: 0, margen: 2, encendido: 1 });
  return { f, cp: capa(FW, FH), chispas: [], rastro: [], acum: 0, t: 0, ult: null, vel: 0 };
}
const COL = BANDAS_LLAMA.map((b) => `rgb(${b[0]},${b[1]},${b[2]})`);

/**
 * Dibuja la brasa. `b` trae su punto en el dibujo del mundo (sx, sy: (x - y) * 16 y (x + y) * 8 - z), su fuerza k (0 a 1)
 * y su tamaño; `o` es aPant(0, 0) (dónde cae el origen del dibujo en la pantalla); `T` los puntos del aparato por punto.
 * Sin `b` (ya se fue) quedan las chispas que soltó hasta que se apaguen.
 */
export function dibujarBrasa(c: CanvasRenderingContext2D, e: EstadoBrasa, b: { sx: number; sy: number; k: number; tam: number } | null, o: [number, number], Tz: number, dt: number, t: number) {
  e.t += dt;
  const [ox, oy] = o;
  if (b && b.k > 0.01) {
    // cuánto corre (puntos del dibujo por segundo): la estela y las chispas salen de eso
    let vx = 0, vy = 0;
    if (e.ult && dt > 0) { vx = (b.sx - e.ult[0]) / dt; vy = (b.sy - e.ult[1]) / dt; }
    e.ult = [b.sx, b.sy]; const v = Math.hypot(vx, vy); e.vel += (v - e.vel) * Math.min(1, dt * 8);
    e.rastro.unshift([b.sx, b.sy, e.t]); while (e.rastro.length > 60) e.rastro.pop();
    // el latido: dos golpes cerca (lub-dub) cada 1,1 s
    const fase = (t % 1.1) / 1.1, lat = Math.exp(-(((fase - 0.05) / 0.05) ** 2)) + 0.7 * Math.exp(-(((fase - 0.22) / 0.05) ** 2));
    // (en los planos abiertos la brasa no puede ser un punto: crece hasta pesar en la pantalla, con la estela de cometa larga)
    const big = Math.max(1, 2.6 / Tz), k = b.k, tam = b.tam * big;
    // el resplandor (blando: es la luz en el aire)
    const R = (26 + 26 * k) * tam * (1 + 0.18 * lat) * (big > 1 ? 1.6 : 1), X = ox + b.sx, Y = oy + b.sy;
    c.save(); c.globalCompositeOperation = 'lighter';
    const g = c.createRadialGradient(X, Y, 0, X, Y, R);
    g.addColorStop(0, `rgba(255,120,50,${0.55 * k})`); g.addColorStop(0.3, `rgba(220,50,20,${0.28 * k})`); g.addColorStop(1, 'rgba(120,10,0,0)');
    c.fillStyle = g; c.fillRect(X - R, Y - R, R * 2, R * 2);
    c.restore();
    // la estela: de la cola fría (rojo hondo) a la cabeza (naranja), una celda por punto, más ancha cerca
    if (e.vel > 40 && e.rastro.length > 2) {
      c.save(); c.globalCompositeOperation = 'lighter';
      const L = Math.min(e.rastro.length - 1, Math.round((8 + e.vel / 14) * big));
      for (let i = L; i >= 1; i--) {
        const [ax, ay] = e.rastro[i], [bx, by] = e.rastro[i - 1], u = i / L;
        const n = Math.max(2, Math.ceil(Math.hypot(bx - ax, by - ay)));
        const q = Math.max(1, Math.min(BANDAS_LLAMA.length - 2, Math.round((1 - u) * 7)));
        c.fillStyle = COL[q]; c.globalAlpha = k * (1 - u) * 0.9;
        const gr = Math.max(1, Math.round((u < 0.3 ? 2 : 1) * Math.max(1, tam)));
        for (let s = 0; s < n; s++) { const px = Math.round(ox + ax + ((bx - ax) * s) / n), py = Math.round(oy + ay + ((by - ay) * s) / n); c.fillRect(px - (gr >> 1), py - (gr >> 1), gr, gr); }
      }
      c.restore();
    }
    // el fuego que sube del núcleo (la llama se acuesta hacia atrás cuando corre de costado)
    D.soplar(e.f, Math.max(-1.2, Math.min(1.2, -vx / 160)), 0.3);
    D.encender(e.f, k > 0.2 ? 1 : 0); D.paso(e.f, dt);
    pintarCalor(e.f, e.cp, { brillo: 1.25, umbral: 0.1, alfa: 1, pasadas: 1 });
    const fx = Math.round(ox + b.sx - FW / 2), fy = Math.round(oy + b.sy - FH + 4);
    if (tam >= 0.6) {
      const gr2 = Math.max(1, Math.round(big)), fx2 = Math.round(ox + b.sx - (FW * gr2) / 2), fy2 = Math.round(oy + b.sy - FH * gr2 + 4 * gr2);
      pegarPixel(e.cp.c, gr2 > 1 ? fx2 : fx, gr2 > 1 ? fy2 : fy, Tz * gr2, Math.min(1, k * 1.1), 'lighter');
    }
    // el núcleo: un disco de pixel que late (blanco, amarillo, naranja y el canto de sangre)
    const r = Math.max(1, Math.round((1.6 + 2.2 * tam) * (0.85 + 0.25 * lat) * Math.min(1, 0.5 + k)));
    const cx = Math.round(ox + b.sx), cy = Math.round(oy + b.sy);
    c.save(); c.globalAlpha = Math.min(1, k * 1.4);
    for (let yy = -r - 1; yy <= r + 1; yy++) for (let xx = -r - 1; xx <= r + 1; xx++) {
      const d = Math.hypot(xx, yy * 1.05);
      if (d > r + 1) continue;
      c.fillStyle = d > r + 0.3 ? 'rgb(96,8,6)' : d > r - 0.8 ? COL[5] : d > r * 0.45 ? COL[8] : COL[9];
      c.fillRect(cx + xx, cy + yy, 1, 1);
    }
    c.restore();
    // chispas: más cuanto más corre y cuanto más fuerte
    e.acum += dt * (14 + e.vel * 0.18) * k;
    while (e.acum > 1 && e.chispas.length < 140) {
      e.acum -= 1; const a = Math.random() * Math.PI * 2, s = 8 + Math.random() * 30;
      e.chispas.push({ x: b.sx + (Math.random() - 0.5) * 4, y: b.sy + (Math.random() - 0.5) * 4, vx: Math.cos(a) * s - vx * 0.15, vy: Math.sin(a) * s - vy * 0.15 - 8, t: 0, d: 0.4 + Math.random() * 0.9, g: 30, q: 0.85 + Math.random() * 0.15, s: Math.random() < 0.2 ? 2 : 1 });
    }
  } else { e.ult = null; e.rastro.length = 0; }
  moverChispas(e.chispas, dt, t, 0);
  dibujarChispas(e.chispas, ox, oy, Tz, 1, t);
}
/** Chispas sueltas de un estallido (el pecho que se abre, el golpe contra la torre). */
export function estallido(e: EstadoBrasa, sx: number, sy: number, n: number, fuerza = 1) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, s = (20 + Math.random() * 90) * fuerza;
    e.chispas.push({ x: sx, y: sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s * 0.7 - 20 * fuerza, t: 0, d: 0.5 + Math.random() * 1.2, g: 60, q: 1, s: Math.random() < 0.3 ? 2 : 1 });
  }
}
