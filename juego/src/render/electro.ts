// El cuerpo sacudido por el rayo, dibujado sobre su PROPIA silueta.
// Antes iba fx_electrocutado de pixelfx: traía horneado el contorno de un muñeco de 50 puntos y sus arcos seguían ese
// contorno, así que un jefe grande, una araña o un lobo se electrocutaban con la silueta de otro (Rick, 19 nov 2026).
// Ahora los arcos nacen en el borde del cuadro que se está viendo, corren por dentro del cuerpo y saltan afuera, a puntos
// enteros del dibujo, y el sprite parpadea blanco azulado (con algún fogonazo de radiografía).
import type { Cuadro } from '../motor/assets';

/** Cuánto dura la sacudida después del último golpe de rayo (s). */
export const DURA_ELECTRO = 0.8;

interface Mascara { w: number; h: number; a: Uint8Array; borde: Int32Array; dentro: Int32Array; arriba: number; abajo: number }
const cache = new WeakMap<object, Map<string, Mascara | null>>();
let cuantas = 0, lecturas = 0, tic = 0;
let lector: CanvasRenderingContext2D | null = null;

/** Qué puntos del cuadro son cuerpo (alfa alto), su borde y una muestra del interior. Se lee una vez por cuadro de animación. */
export function mascaraDe(q: Cuadro): Mascara | null {
  const im = q.img as any; if (!im || q.w < 2 || q.h < 2) return null;
  let m = cache.get(im); if (!m) { m = new Map(); cache.set(im, m); }
  const k = `${q.x},${q.y},${q.w},${q.h}`;
  if (m.has(k)) return m.get(k)!;
  // leer el cuadro le pide a la tarjeta que devuelva puntos: como mucho 3 cuadros nuevos por cuadro de pantalla
  const ahora = performance.now(); if (ahora - tic > 8) { tic = ahora; lecturas = 0; }
  if (lecturas >= 3) return null;
  lecturas++;
  // (tope por si un héroe pintado en vivo cambia mucho de lienzo: se rehace lo que haga falta)
  if (cuantas > 4000) { cuantas = 0; m.clear(); }
  if (!lector) { const cv = document.createElement('canvas'); lector = cv.getContext('2d', { willReadFrequently: true })!; }
  const cv = lector.canvas;
  if (cv.width < q.w || cv.height < q.h) { cv.width = Math.max(cv.width, q.w); cv.height = Math.max(cv.height, q.h); }
  let d: Uint8ClampedArray;
  try {
    lector.globalCompositeOperation = 'copy';
    lector.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
    d = lector.getImageData(0, 0, q.w, q.h).data;
  } catch { m.set(k, null); return null; }
  const { w, h } = q, a = new Uint8Array(w * h);
  let arriba = h, abajo = 0;
  for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] > 90) { a[i] = 1; const y = (i / w) | 0; if (y < arriba) arriba = y; if (y > abajo) abajo = y; }
  const borde: number[] = [], dentro: number[] = [];
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = y * w + x; if (!a[i]) continue;
    if (!a[i - 1] || !a[i + 1] || !a[i - w] || !a[i + w]) borde.push(i); else if (((x * 7 + y * 13) & 3) === 0) dentro.push(i);
  }
  const r: Mascara | null = borde.length < 6 ? null : { w, h, a, borde: Int32Array.from(borde), dentro: Int32Array.from(dentro.length ? dentro : borde), arriba, abajo };
  m.set(k, r); cuantas++;
  return r;
}

// azar fijo por ventana de tiempo y cuerpo: el mismo dibujo en todo el cuadro (y a cualquier fps)
function azar(s: number) { let x = s | 0; return () => { x = (x + 0x6d2b79f5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/** Cuánto pesa la sacudida ahora (0 nada, 1 recién golpeado). */
export function fuerzaElectro(e: any, ahora: number): number {
  const t0 = e?.electroT; if (t0 === undefined) return 0;
  const dt = ahora - t0; if (dt < 0 || dt > DURA_ELECTRO) return 0;
  return dt < DURA_ELECTRO - 0.25 ? 1 : (DURA_ELECTRO - dt) / 0.25;
}

/** El parpadeo del sprite: [color, fuerza] para dibujarTenido, o null en las ventanas en que no titila. */
export function tinteElectro(id: number, f: number, ahora: number): [string, number] | null {
  if (f <= 0) return null;
  const r = azar(Math.floor(ahora * 18) * 977 + id * 31);
  const x = r();
  // la radiografía: casi blanco un instante (quinta pasada: celeste y a 0,4, el Puño de rayo dejaba al blanco en blanco)
  if (x < 0.12) return (window as any).__blancoViejo ? ['#eef4ff', 0.55 * f] : ['#c4d2ff', 0.4 * f];
  if (x < 0.32) return null; // ventana apagada: el chisporroteo corta
  return ['#a9b8ff', (0.12 + r() * 0.16) * f];
}

/** Los arcos sobre el cuerpo y las chispas que saltan. (px, py) el ancla en pantalla, esc puntos por punto del dibujo. */
export function dibujarElectro(ctx: CanvasRenderingContext2D, id: number, q: Cuadro, px: number, py: number, esc: number, f: number, ahora: number) {
  if (f <= 0) return;
  const M = mascaraDe(q); if (!M) return;
  const { w, h, a, borde, dentro } = M;
  const ventana = Math.floor(ahora * 16), r = azar(ventana * 7919 + id * 131);
  const alto = M.abajo - M.arriba + 1;
  // más arcos en cuerpos grandes (un jefe de 3 veces la altura lleva unos 6 a la vez)
  const n = Math.max(2, Math.min(7, Math.round(1.4 + alto / 26)));
  const ox = Math.round(px - q.ax * esc), oy = Math.round(py - q.ay * esc), s = Math.max(1, Math.round(esc));
  const pts: number[] = []; // pares x,y en puntos del dibujo
  const traza = (x0: number, y0: number, x1: number, y1: number) => {
    // línea de puntos enteros (Bresenham)
    let dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0); const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, x = x0, y = y0;
    for (let k = 0; k < 64; k++) { pts.push(x, y); if (x === x1 && y === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x += sx; } if (e2 <= dx) { e += dx; y += sy; } }
  };
  const dentroDe = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && a[y * w + x] === 1;
  const rayo = (x: number, y: number, tx: number, ty: number, pasos: number, ramas: boolean) => {
    for (let k = 0; k < pasos; k++) {
      const dx = tx - x, dy = ty - y, d = Math.hypot(dx, dy); if (d < 2) break;
      const paso = 2 + Math.floor(r() * 3), nx = -dy / d, ny = dx / d, j = (r() - 0.5) * 5;
      let x2 = Math.round(x + (dx / d) * paso + nx * j), y2 = Math.round(y + (dy / d) * paso + ny * j);
      // el arco se pega a la piel: si se sale, prueba el quiebre del otro lado
      if (!dentroDe(x2, y2)) { const x3 = Math.round(x + (dx / d) * paso - nx * j), y3 = Math.round(y + (dy / d) * paso - ny * j); if (dentroDe(x3, y3)) { x2 = x3; y2 = y3; } }
      traza(x, y, x2, y2);
      if (ramas && r() < 0.18) rayo(x2, y2, x2 + Math.round((r() - 0.5) * 14), y2 + Math.round((r() - 0.3) * 10), 3, false);
      x = x2; y = y2;
    }
  };
  for (let i = 0; i < n; i++) {
    if (r() < 0.22) continue; // chisporroteo: no todos en cada ventana
    const b = borde[Math.floor(r() * borde.length)], c = dentro[Math.floor(r() * dentro.length)];
    rayo(b % w, (b / w) | 0, c % w, (c / w) | 0, 9 + Math.floor(alto / 14), true);
  }
  // uno o dos que saltan del borde al aire (o al piso)
  const saltos = 1 + (alto > 70 ? 1 : 0);
  for (let i = 0; i < saltos; i++) {
    if (r() < 0.35) continue;
    const b = borde[Math.floor(r() * borde.length)], bx = b % w, by = (b / w) | 0;
    const cx = q.ax, cy = (M.arriba + M.abajo) / 2, ux = bx - cx, uy = by - cy, d = Math.hypot(ux, uy) || 1;
    const largo = 5 + r() * 8;
    rayo(bx, by, Math.round(bx + (ux / d) * largo), Math.round(by + (uy / d) * largo + 2), 4, false);
  }
  if (!pts.length) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // halo: un punto alrededor de cada punto del arco
  ctx.globalAlpha = 0.28 * f; ctx.fillStyle = '#4a62ff';
  for (let i = 0; i < pts.length; i += 2) ctx.fillRect(ox + Math.round((pts[i] - 1) * esc), oy + Math.round((pts[i + 1] - 1) * esc), s * 3, s * 3);
  ctx.globalAlpha = 0.55 * f; ctx.fillStyle = '#8fa6ff';
  for (let i = 0; i < pts.length; i += 2) ctx.fillRect(ox + Math.round(pts[i] * esc) - (s >> 1), oy + Math.round(pts[i + 1] * esc), s * 2, s);
  // núcleo casi blanco
  ctx.globalAlpha = 0.95 * f; ctx.fillStyle = '#f2f6ff';
  for (let i = 0; i < pts.length; i += 2) ctx.fillRect(ox + Math.round(pts[i] * esc), oy + Math.round(pts[i + 1] * esc), s, s);
  // chispas sueltas que vuelan desde el borde, con su recorrido dentro de la ventana
  const fr = ahora * 16 - ventana;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3 + (alto > 70 ? 3 : 0); i++) {
    const b = borde[Math.floor(r() * borde.length)], bx = b % w, by = (b / w) | 0, vx = (r() - 0.5) * 16, vy = -2 - r() * 8;
    ctx.globalAlpha = (1 - fr) * 0.9 * f;
    ctx.fillRect(ox + Math.round(Math.round(bx + vx * fr) * esc), oy + Math.round(Math.round(by + vy * fr + 6 * fr * fr) * esc), s, s);
  }
  ctx.restore();
}

/** Dónde empieza la cabeza del cuerpo en pantalla (el punto más alto de su silueta), o null si todavía no se leyó. */
export function cabezaDe(q: Cuadro, py: number, esc: number): number | null {
  const M = mascaraDe(q); return M ? py - (q.ay - M.arriba) * esc : null;
}

// El frío y el veneno también van sobre la silueta de verdad: fx_congelado traía una figura humana oscura y
// fx_envenenado su contorno y un charco de talla humana (una araña o un jefe helados llevaban encima a un muñeco).
const lado = (M: Mascara) => { let x0 = M.w, x1 = 0; for (let i = 0; i < M.borde.length; i++) { const x = M.borde[i] % M.w; if (x < x0) x0 = x; if (x > x1) x1 = x; } return [x0, x1]; };
const anchos = new WeakMap<Mascara, number[]>();
function ancho(M: Mascara) { let a = anchos.get(M); if (!a) { a = lado(M); anchos.set(M, a); } return a; }

/** Escarcha: el canto de arriba de la silueta blanco hielo, motas que caen y el piso escarchado bajo los pies. */
export function dibujarEscarcha(ctx: CanvasRenderingContext2D, id: number, q: Cuadro, px: number, py: number, esc: number, ahora: number, fuerte: boolean) {
  const M = mascaraDe(q); if (!M) return;
  const { w, a, borde } = M, s = Math.max(1, Math.round(esc));
  const ox = Math.round(px - q.ax * esc), oy = Math.round(py - q.ay * esc);
  const P = (x: number, y: number) => [ox + Math.round(x * esc), oy + Math.round(y * esc)];
  ctx.save();
  // escarcha en lo que mira arriba (hombros, cabeza, lomo): un punto claro donde arriba no hay cuerpo
  ctx.fillStyle = '#e8f6ff';
  for (let i = 0; i < borde.length; i++) {
    const k = borde[i]; if (k < w || a[k - w]) continue;
    const x = k % w, y = (k / w) | 0, h = (x * 73 + y * 151) % 7;
    ctx.globalAlpha = (fuerte ? 0.85 : 0.55) * (h < 3 ? 1 : 0.55);
    const [X, Y] = P(x, y); ctx.fillRect(X, Y, s, s);
  }
  // motas de nieve que bajan desde la silueta (cada una con su vuelta de 1,6 s)
  const r = azar(id * 977 + 3), n = Math.max(3, Math.min(12, Math.round(borde.length / 30)));
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < n; i++) {
    const k = borde[Math.floor(r() * borde.length)], f = (ahora / 1.6 + r()) % 1;
    const [X, Y] = P((k % w) + Math.sin(f * 6 + i) * 2, ((k / w) | 0) - 4 + f * 14);
    ctx.globalAlpha = 0.8 * Math.sin(f * Math.PI); ctx.fillRect(X, Y, s, s);
  }
  // el piso escarchado: un óvalo de puntos del ancho del cuerpo
  const [x0, x1] = ancho(M), rx = Math.max(6, (x1 - x0) * 0.55), ry = rx * 0.42, cx = (x0 + x1) / 2 - q.ax;
  const r2 = azar(id * 31 + 7);
  ctx.fillStyle = '#bfe6ff';
  for (let i = 0; i < Math.round(rx * 1.6); i++) {
    const t = r2() * Math.PI * 2, d = Math.sqrt(r2());
    ctx.globalAlpha = (fuerte ? 0.55 : 0.35) * (1 - d * 0.6);
    ctx.fillRect(Math.round(px + (cx + Math.cos(t) * rx * d) * esc), Math.round(py + Math.sin(t) * ry * d * esc), s, s);
  }
  ctx.restore();
}

/** Veneno: burbujas verdes que suben por dentro del cuerpo, gotas que caen de lo más bajo y el charco bajo los pies. */
export function dibujarVeneno(ctx: CanvasRenderingContext2D, id: number, q: Cuadro, px: number, py: number, esc: number, ahora: number) {
  const M = mascaraDe(q); if (!M) return;
  const { w, dentro, borde } = M, s = Math.max(1, Math.round(esc));
  const ox = Math.round(px - q.ax * esc), oy = Math.round(py - q.ay * esc);
  ctx.save();
  // charco: óvalo verde oscuro del ancho del cuerpo, con borde más vivo
  const [x0, x1] = ancho(M), rx = Math.max(6, (x1 - x0) * 0.5), ry = rx * 0.4, cx = px + ((x0 + x1) / 2 - q.ax) * esc;
  const r0 = azar(id * 17 + 1);
  for (let i = 0; i < Math.round(rx * 2.2); i++) {
    const t = r0() * Math.PI * 2, d = Math.sqrt(r0());
    ctx.globalAlpha = d > 0.8 ? 0.5 : 0.28; ctx.fillStyle = d > 0.8 ? '#7fb21e' : '#2e4a0c';
    ctx.fillRect(Math.round(cx + Math.cos(t) * rx * d * esc), Math.round(py + Math.sin(t) * ry * d * esc), s, s);
  }
  // burbujas: nacen en un punto del cuerpo, suben y revientan (vuelta de 1,1 s)
  const r = azar(id * 977 + 11), n = Math.max(3, Math.min(10, Math.round(dentro.length / 40)));
  for (let i = 0; i < n; i++) {
    const k = dentro[Math.floor(r() * dentro.length)], f = (ahora / 1.1 + r()) % 1;
    const x = ox + Math.round((k % w) * esc), y = oy + Math.round((((k / w) | 0) - f * 9) * esc);
    ctx.globalAlpha = f < 0.85 ? 0.85 : 0.4; ctx.fillStyle = f < 0.85 ? '#a6e23a' : '#e4ff9a';
    if (f < 0.85) ctx.fillRect(x, y, s, s); else { ctx.fillRect(x - s, y, s, s); ctx.fillRect(x + s, y, s, s); ctx.fillRect(x, y - s, s, s); }
  }
  // gotas que caen desde el borde de abajo (lo que mira al piso)
  const r2 = azar(id * 41 + 5);
  ctx.fillStyle = '#8ccf24';
  for (let i = 0; i < 3; i++) {
    let k = borde[Math.floor(r2() * borde.length)]; for (let t = 0; t < 6 && M.a[k + w]; t++) k = borde[Math.floor(r2() * borde.length)];
    const f = (ahora / 0.9 + r2()) % 1, x = ox + Math.round((k % w) * esc), y0 = oy + Math.round(((k / w) | 0) * esc);
    ctx.globalAlpha = 0.85; ctx.fillRect(x, Math.min(Math.round(py), y0 + Math.round(f * f * (py - y0))), s, s * 2);
  }
  ctx.restore();
}

// El aturdido (cuarta pasada, Rick: las cruces negras horneadas de `fx_aturdido` se veían como manchas sobre la cabeza
// en el Codo de piedra). Cuatro estrellitas de oro de pixel que dan vuelta sobre la cabeza de verdad, con su canto oscuro
// para que se lean sobre arena y nieve; las de atrás más chicas y apagadas.
export function dibujarAturdido(ctx: CanvasRenderingContext2D, id: number, px: number, cab: number, k: number, ahora: number) {
  const rx = Math.round(8 + 3 * k), ry = Math.round(2 + k), y0 = Math.round(cab - 5 - 2 * k), gir = ahora * 3.4 + id;
  const est: [number, number, number][] = [];
  for (let i = 0; i < 4; i++) { const an = gir + (i / 4) * 6.283; est.push([Math.round(px + Math.cos(an) * rx), Math.round(y0 + Math.sin(an) * ry), Math.sin(an)]); }
  est.sort((a, b) => a[2] - b[2]);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const [x, y, z] of est) {
    const g = z > -0.2, l = g ? 2 : 1, tw = Math.sin(ahora * 13 + x) > 0.6;
    ctx.globalAlpha = g ? 1 : 0.6;
    ctx.fillStyle = '#2a1804'; ctx.fillRect(x - l - 1, y - 1, l * 2 + 3, 3); ctx.fillRect(x - 1, y - l - 1, 3, l * 2 + 3);
    ctx.fillStyle = g ? '#ffc830' : '#c8901c'; ctx.fillRect(x - l, y, l * 2 + 1, 1); ctx.fillRect(x, y - l, 1, l * 2 + 1);
    ctx.fillStyle = tw ? '#ffffff' : '#fff2b0'; ctx.fillRect(x, y, 1, 1);
  }
  ctx.restore();
}

// La marca de presa (cuarta pasada): el horneado `fx_presa_marcada` salía como una nube de corazones rojos que tapaba
// medio cuerpo. Es una mira de caza de pixel sobre la cabeza: un rombo rojo con cuatro marcas que se cierran y laten, con
// su canto oscuro.
export function dibujarMarcaPresa(ctx: CanvasRenderingContext2D, id: number, px: number, cab: number, ahora: number) {
  const x = Math.round(px), y = Math.round(cab - 9), lat = 0.5 + 0.5 * Math.sin(ahora * 5 + id), r = 4 + Math.round(lat), t = 2 + Math.round(lat);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const rombo = (c: string, d: number) => { ctx.fillStyle = c; for (let i = -r; i <= r; i++) { const w = r - Math.abs(i); ctx.fillRect(x - w + d, y + i + d, 1, 1); ctx.fillRect(x + w + d, y + i + d, 1, 1); } };
  rombo('#1a0404', 1); rombo('#e02a20', 0);
  ctx.fillStyle = '#1a0404'; ctx.fillRect(x - r - t - 1, y, t + 1, 2); ctx.fillRect(x + r + 1, y, t + 1, 2); ctx.fillRect(x, y - r - t - 1, 2, t + 1); ctx.fillRect(x, y + r + 1, 2, t + 1);
  ctx.fillStyle = '#ff6a50'; ctx.fillRect(x - r - t - 1, y, t, 1); ctx.fillRect(x + r + 2, y, t, 1); ctx.fillRect(x, y - r - t - 1, 1, t); ctx.fillRect(x, y + r + 2, 1, t);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 + 0.5 * lat; ctx.fillStyle = '#ffd0c0'; ctx.fillRect(x, y, 1, 1);
  ctx.restore();
}
