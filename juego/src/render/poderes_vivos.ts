// Poderes pintados en vivo, donde el horneado no alcanzaba (Rick, 19 nov 2026: "un rayo de nivel 12 que no funciona
// bien, la combustión de fuego podría verse mejor").
//   - El Rayo saltarín: cada salto es un relámpago de pixel que sigue a los dos cuerpos que une (no una línea fija al
//     sitio donde estaban), con su rama principal, una hebra al lado y bifurcaciones que se abren. Se vuelve a quebrar
//     24 veces por segundo (no en cada cuadro de pantalla: a 144 Hz era ruido), nace grueso y blanco, parpadea al apagarse
//     y revienta en una estrella en el pecho del que recibe. Sin blanco cae a tierra donde se apuntó.
//   - La Combustión: el aire donde se apunta chupa el calor hacia adentro (motas que acuden, un punto que se enciende,
//     el aire que tiembla y un anillo que se cierra en el piso), y a los 0,2 s revienta: fogonazo, una bola de fuego de
//     Doom que crece y se apaga en humo, onda de choque, pedazos de piso y brasas que vuelan, la marca quemada y el piso
//     que sigue ardiendo. El golpe (daño, temblor, sonido y la marca) lo pone el área con `caida` en mundo.ts.
// Todo a puntos enteros del mundo (el grano del juego) y dentro del orden de pintado, salvo los arcos del rayo, que van
// después de la luz como siempre (la noche los apagaba). `__sinPoderesVivos` vuelve a lo de antes para comparar.
import type { Juego, Efecto } from '../juego/mundo';
import { E } from '../nucleo/lienzo';
import { bolaFuego, prender } from './fuego_especial';
import { estallido, anilloPiso, chispasLibres } from './energia';
import { lienzoTrabajo } from '../motor/lienzos';

type P = [number, number];
/** Azar con semilla (el mismo de electro.ts). */
function azar(s: number) { let x = s | 0; return () => { x = (x + 0x6d2b79f5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const poderesVivos = () => !(window as any).__sinPoderesVivos;

// ------------------------------------------------------------------ resplandores (uno por color, hechos una vez)
const halos = new Map<string, HTMLCanvasElement>();
function halo(c: string, c2: string): HTMLCanvasElement {
  const k = c + c2; let s = halos.get(k); if (s) return s;
  s = document.createElement('canvas'); s.width = s.height = 64; const x = s.getContext('2d')!;
  const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.22, c); g.addColorStop(0.6, c2); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.fillStyle = g; x.fillRect(0, 0, 64, 64); halos.set(k, s); return s;
}
const haloRayo = () => halo('rgba(170,200,255,0.85)', 'rgba(60,100,255,0.22)');
const haloFuego = () => halo('rgba(255,210,120,0.9)', 'rgba(255,90,20,0.25)');

// ------------------------------------------------------------------ el relámpago de pixel
/** Línea quebrada de a a b por desplazamiento del punto medio: `desv` es cuánto se tuerce respecto del largo. */
function quebrar(a: P, b: P, r: () => number, desv: number, niveles: number): P[] {
  let pts: P[] = [a, b], d = desv;
  for (let n = 0; n < niveles; n++) {
    const out: P[] = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i - 1], q = pts[i], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.hypot(dx, dy) || 1, o = (r() - 0.5) * d * l;
      out.push([(p[0] + q[0]) / 2 - (dy / l) * o, (p[1] + q[1]) / 2 + (dx / l) * o], q);
    }
    pts = out; d *= 0.62;
  }
  return pts;
}
/** Suma al camino actual un cuadrado de `g` puntos por cada punto de la línea (Bresenham): un solo fill por capa. */
function trazo(ctx: CanvasRenderingContext2D, pts: P[], g: number, paso = 1, desde = 0, hasta = 1) {
  const h = (g - 1) >> 1, i0 = Math.floor(desde * (pts.length - 1)), i1 = Math.ceil(hasta * (pts.length - 1));
  let n = 0;
  for (let i = Math.max(1, i0 + 1); i <= i1; i++) {
    let x0 = Math.round(pts[i - 1][0]), y0 = Math.round(pts[i - 1][1]); const x1 = Math.round(pts[i][0]), y1 = Math.round(pts[i][1]);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
    for (let s = 0; s < 400; s++) {
      if (n++ % paso === 0) ctx.rect(x0 - h, y0 - h, g, g);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; }
    }
  }
}
/** Los arcos del Rayo saltarín (efectos `arco_cadena`), después de la luz. */
export function dibujarArcos(ctx: CanvasRenderingContext2D, j: Juego, aP: (x: number, y: number) => [number, number]) {
  for (const e of j.efectos as any[]) if (e.id === 'arco_cadena' && e.x2 !== undefined && e.t >= 0) arco(ctx, e, aP);
}
function arco(ctx: CanvasRenderingContext2D, e: any, aP: (x: number, y: number) => [number, number]) {
  const dur = e.dur ?? 0.45, u = e.t / dur; if (u >= 1) return;
  const [ax, ay] = aP(e.x, e.y), [bx, by] = aP(e.x2, e.y2);
  const a: P = [ax, ay - (e.za ?? 34)], b: P = [bx, by - (e.zb ?? 34)];
  const nace = e.t < 0.07, tic = Math.floor(e.t * 24), r = azar((e.sem ?? 7) * 977 + tic * 131);
  // se apaga a tirones: algunos golpes de reloj el arco queda casi en nada, como un rayo que vuelve a pegar
  let k = (1 - u) ** 0.7; if (!nace && r() < 0.2) k *= 0.35;
  const l = Math.hypot(b[0] - a[0], b[1] - a[1]), niv = l > 170 ? 6 : l > 80 ? 5 : 4;
  const princ = quebrar(a, b, r, 0.36, niv), hebra = quebrar(a, b, r, 0.5, niv - 1);
  const ramas: P[][] = [], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  for (let i = 0, nr = 2 + Math.floor(r() * 3); i < nr; i++) {
    const p = princ[2 + Math.floor(r() * (princ.length - 5))], an = ang + (r() < 0.5 ? -1 : 1) * (0.35 + r() * 0.75), ll = Math.min(64, l * (0.16 + r() * 0.2));
    const fin: P = [p[0] + Math.cos(an) * ll, p[1] + Math.sin(an) * ll], rama = quebrar(p, fin, r, 0.55, 3); ramas.push(rama);
    if (r() < 0.4) { const q = rama[Math.floor(rama.length / 2)], an2 = an + (r() - 0.5) * 1.6, l2 = ll * 0.5; ramas.push(quebrar(q, [q[0] + Math.cos(an2) * l2, q[1] + Math.sin(an2) * l2], r, 0.6, 2)); }
  }
  // a tierra: tres lenguas que corren por el piso desde donde cae
  if (e.suelo) for (let i = 0; i < 3; i++) { const an = r() * 6.283, ll = 14 + r() * 18; ramas.push(quebrar(b, [b[0] + Math.cos(an) * ll, b[1] + 34 * 0 + Math.sin(an) * ll * 0.5], r, 0.6, 3)); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = `rgba(60,95,255,${0.2 * k})`; ctx.beginPath(); trazo(ctx, princ, 5, 2); ctx.fill();
  ctx.fillStyle = `rgba(110,150,255,${0.75 * k})`; ctx.beginPath(); trazo(ctx, princ, 3); for (const q of ramas) trazo(ctx, q, 2, 1, 0, 0.6); ctx.fill();
  ctx.fillStyle = `rgba(160,190,255,${0.6 * k})`; ctx.beginPath(); trazo(ctx, hebra, 1); for (const q of ramas) trazo(ctx, q, 1); ctx.fill();
  ctx.fillStyle = `rgba(255,255,255,${Math.min(1, k * 1.4)})`; ctx.beginPath(); trazo(ctx, princ, nace ? 2 : 1); for (const q of ramas) trazo(ctx, q, 1, 1, 0, 0.35); ctx.fill();
  // donde nace y donde pega: resplandor y una estrella de pixel que late
  const hr = haloRayo();
  ctx.globalAlpha = k * 0.6; ctx.drawImage(hr, a[0] - 8, a[1] - 8, 16, 16);
  const rb = (nace ? 22 : 11) + r() * 4; ctx.globalAlpha = k * 0.85; ctx.drawImage(hr, b[0] - rb, b[1] - rb, rb * 2, rb * 2);
  ctx.globalAlpha = 1; ctx.fillStyle = `rgba(255,255,255,${k})`;
  const bxr = Math.round(b[0]), byr = Math.round(b[1]), lx = Math.round((nace ? 9 : 4) + r() * 5), ly = Math.round(lx * 0.7);
  ctx.fillRect(bxr - lx, byr, lx * 2 + 1, 1); ctx.fillRect(bxr, byr - ly, 1, ly * 2 + 1);
  if (nace) { ctx.fillRect(bxr - 1, byr - 1, 3, 3); ctx.fillStyle = `rgba(150,190,255,${k * 0.8})`; for (const [dx, dy] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) ctx.fillRect(bxr + dx, byr + dy, 1, 1); }
  ctx.restore();
}

// ------------------------------------------------------------------ Combustión
/** Segundos desde que se pide hasta que revienta (lo mismo que espera el área del daño en mundo.ts). */
export const COMBUSTION_T0 = 0.2;
interface Trozo { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; d: number; c: string; s: number; reb: number }
interface Comb { det: boolean; tAnt: number; sem: number }
const combs = new WeakMap<object, Comb>();
const trozos: Trozo[] = [];
let tAnt = -1, zonaAnt = '';
const R = Math.random;
function estadoComb(e: Efecto): Comb { let c = combs.get(e); if (!c) { c = { det: false, tAnt: 0, sem: Math.floor(R() * 1e6) }; combs.set(e, c); } return c; }

/** Una vez por cuadro (con el reloj del juego): lo que pasa al nacer y al reventar, y los pedazos que vuelan. */
export function seguirPoderes(j: Juego) {
  if (j.zona.id !== zonaAnt) { zonaAnt = j.zona.id; trozos.length = 0; }
  const dt = tAnt < 0 ? 0 : Math.max(0, Math.min(0.05, j.t - tAnt)); tAnt = j.t;
  if (!poderesVivos()) return;
  for (const e of j.efectos as Efecto[]) {
    if (e.id !== 'combustion') continue;
    const c = estadoComb(e), esc = e.escala ?? 1;
    if (!(c as any).visto) { (c as any).visto = true; anilloPiso(e.x, e.y, { d: COMBUSTION_T0 + 0.04, r0: 2.6 * esc, r1: 0.15, c: [255, 120, 40], g: 2, a: 0.7 }); }
    if (!c.det && e.t >= COMBUSTION_T0) {
      c.det = true;
      // el golpe: fogonazo, dos ondas, el resplandor de pantalla (lo baja `acc.destellos`) y chispas que saltan
      estallido(e.x, e.y, 18, [255, 140, 50], 1.5 * Math.min(1.4, esc));
      anilloPiso(e.x, e.y, { d: 0.5, r0: 0.3, r1: 2.9 * esc, c: [255, 190, 90], g: 3.5, a: 0.9 });
      // brasas: suben, se abren y caen despacio
      const nb = Math.round((E.tactil ? 18 : 34) * esc);
      chispasLibres(nb, () => { const an = R() * 6.283, v = 1 + R() * 4.5; return { x: e.x, y: e.y, z: 14 + R() * 26, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: 60 + R() * 170, t: 0, d: 0.7 + R() * 0.9, c: R() < 0.35 ? [255, 230, 150] : R() < 0.6 ? [255, 140, 40] : [230, 70, 20], s: R() < 0.3 ? 3 : 2, reb: 0, g: 120 }; });
      // pedazos de piso y de roca: oscuros, con una cara alumbrada, rebotan una vez
      for (let i = 0, n = Math.round((E.tactil ? 7 : 14) * esc); i < n; i++) { const an = R() * 6.283, v = 2 + R() * 4.5; trozos.push({ x: e.x + Math.cos(an) * 0.3, y: e.y + Math.sin(an) * 0.3, z: 4, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: 90 + R() * 160, t: 0, d: 1.1 + R() * 0.6, c: R() < 0.5 ? '#2a1d14' : '#3c2a1c', s: R() < 0.35 ? 3 : 2, reb: 1 }); }
      // el piso sigue ardiendo donde reventó
      prender(e.x, e.y, 1.5 * esc);
    }
  }
  for (let i = trozos.length - 1; i >= 0; i--) {
    const q = trozos[i]; q.t += dt; if (q.t > q.d) { trozos.splice(i, 1); continue; }
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= 420 * dt;
    if (q.z < 0) { if (q.reb > 0) { q.z = 0; q.vz = -q.vz * 0.3; q.vx *= 0.45; q.vy *= 0.45; q.reb--; } else { q.z = 0; q.vz = 0; q.vx *= 0.7; q.vy *= 0.7; } }
  }
}
/** Los pedazos que vuelan, en el orden del mundo. */
export function itemsPoderes(ctx: CanvasRenderingContext2D, aP: (x: number, y: number) => [number, number]): { prof: number; draw: () => void }[] {
  return trozos.map((q) => ({ prof: q.x + q.y + 0.08, draw: () => {
    const [px, py] = aP(q.x, q.y), x = Math.round(px), y = Math.round(py - q.z), a = Math.min(1, (q.d - q.t) * 3);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = q.c; ctx.fillRect(x, y, q.s, q.s);
    // la cara que mira al fuego, al rojo mientras vuela
    ctx.fillStyle = q.t < 0.6 ? '#ff7a2a' : '#6a4a30'; ctx.fillRect(x, y, q.s, 1); ctx.restore();
  } }));
}

/**
 * El aire que tiembla: se copia lo ya pintado debajo (un lienzo de la rueda, nunca la pantalla sobre sí misma) y se
 * vuelve a pegar en tiras de 2 puntos corridas por una onda. `amp` en puntos del mundo; 0 no hace nada.
 */
function calima(ctx: CanvasRenderingContext2D, cx: number, cy: number, w: number, h: number, amp: number, t: number) {
  if (amp < 0.35 || (window as any).__sinCalima || E.tactil) return;
  const m = ctx.getTransform(), sx = Math.round(m.a * (cx - w / 2) + m.e), sy = Math.round(m.d * (cy - h / 2) + m.f), sw = Math.round(w * m.a), sh = Math.round(h * m.d);
  const cv = ctx.canvas; if (sx < 0 || sy < 0 || sx + sw > cv.width || sy + sh > cv.height || sw < 4 || sh < 4) return;
  const lz = lienzoTrabajo(sw, sh); lz.c.clearRect(0, 0, sw, sh); lz.c.drawImage(cv, sx, sy, sw, sh, 0, 0, sw, sh);
  const paso = Math.max(2, Math.round(2 * m.d));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.imageSmoothingEnabled = false;
  for (let y = 0; y < sh; y += paso) {
    const v = y / sh, borde = Math.sin(v * Math.PI), off = Math.round(Math.sin(y * 0.21 / m.d + t * 23) * amp * m.a * borde);
    if (off) ctx.drawImage(lz.cv, 0, y, sw, paso, sx + off, sy + y, sw, paso);
  }
  ctx.restore();
}

/** Ruido suave por ángulo (lóbulos que hierven): el borde de la bola no es un círculo. */
function borde(sem: number, an: number, t: number) {
  return 0.55 * Math.sin(an * 3 + sem + t * 9) * 0.5 + 0.3 * Math.sin(an * 5 - sem * 1.7 + t * 13) * 0.5 + 0.2 * Math.sin(an * 9 + sem * 2.3 - t * 17) * 0.5;
}
/** Un disco de pixel con el borde roto (filas enteras): `r` radio en x, achatado `ay` en y. */
function disco(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, ay: number, rugo: number, sem: number, t: number) {
  if (r < 0.8) return;
  const ry = r * ay, n = Math.ceil(ry * (1 + rugo)), x0 = Math.round(cx), y0 = Math.round(cy);
  ctx.beginPath();
  for (let y = -n; y <= n; y++) {
    const v = y / (ry * (1 + rugo * 0.5));
    if (Math.abs(v) > 1.25) continue;
    const anI = Math.atan2(v, -1), anD = Math.atan2(v, 1);
    const rI = r * (1 + rugo * borde(sem, anI, t)), rD = r * (1 + rugo * borde(sem, anD, t));
    const k = 1 - v * v; if (k <= 0) continue;
    const xi = Math.round(-Math.sqrt(k) * rI), xd = Math.round(Math.sqrt(k) * rD);
    if (xd >= xi) ctx.rect(x0 + xi, y0 + y, xd - xi + 1, 1);
  }
  ctx.fill();
}
/** Dibuja la Combustión (lo de pie: el calor que acude, el fogonazo y la bola). Se llama desde el orden del mundo. */
export function dibujarCombustion(ctx: CanvasRenderingContext2D, e: Efecto, px: number, py: number) {
  const c = estadoComb(e), dt = Math.max(0, Math.min(0.05, e.t - c.tAnt)), esc = e.escala ?? 1; c.tAnt = e.t;
  const T0 = COMBUSTION_T0, cy = py - 28 * Math.min(1.3, esc), Rp = 2.4 * 22.6 * esc, sem = c.sem % 97;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  if (e.t < T0) {
    const u = e.t / T0, r = azar(c.sem);
    // el aire empieza a temblar y a chupar
    calima(ctx, px, cy, Rp * 1.6, 70 * esc, 1.6 * u, e.t);
    ctx.globalCompositeOperation = 'lighter';
    // motas de calor que acuden en espiral al punto, cada una con su raya hacia adentro
    for (let i = 0; i < 40; i++) {
      const an = i * 2.399 + r() * 0.4 + u * (1.2 + r()), d0 = 0.45 + r() * 0.7, ease = 1 - (1 - Math.min(1, u * (0.8 + r() * 0.5))) ** 2;
      const rr = Rp * d0 * (1 - ease), z = (r() - 0.5) * 46 * (1 - ease), cal = Math.min(1, ease * 1.2 + r() * 0.15);
      const x = px + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * 0.5 + z, dx = px - x, dy = cy - y, l = Math.hypot(dx, dy) || 1, cola = Math.min(l, 3 + 9 * ease);
      ctx.fillStyle = `rgba(255,${Math.round(60 + 180 * cal)},${Math.round(10 + 150 * cal * cal)},${Math.min(1, 0.35 + u * 0.8)})`; ctx.beginPath();
      for (let q = 0; q <= cola; q += 1) ctx.rect(Math.round(x - (dx / l) * q), Math.round(y - (dy / l) * q), 1, 1);
      ctx.fill(); if (i % 3 === 0) ctx.fillRect(Math.round(x) - 1, Math.round(y), 2, 2);
    }
    // el punto que se enciende, a punto de reventar
    const rh = 8 + u * u * 26; ctx.globalAlpha = 0.4 + u * 0.6; ctx.drawImage(haloFuego(), px - rh, cy - rh, rh * 2, rh * 2); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#ff6a1a'; disco(ctx, px, cy, 1.5 + u * u * 6, 0.9, 0.25, sem, e.t);
    ctx.fillStyle = '#fff2c8'; disco(ctx, px, cy, 0.8 + u * u * 3.5, 0.9, 0.2, sem, e.t);
  } else {
    const s = e.t - T0, Rb = 30 * esc;
    // el calor que tiembla sobre el fuego (antes del fuego: lo ondula lo de atrás, no la llama)
    calima(ctx, px, cy - 24 * esc, Rp * 1.5, 100 * esc, 2 * Math.max(0, 1 - s / 1.5), e.t);
    // el humo: bocanadas oscuras que suben y se abren (debajo de la bola y de la llama)
    ctx.globalCompositeOperation = 'source-over';
    if (s > 0.12 && s < 1.9) { const r = azar(c.sem + 5);
      for (let i = 0; i < 7; i++) { const an = r() * 6.283, v = (s - 0.12) / 1.78, sube = v * (50 + r() * 40) * esc, rr = (6 + r() * 8 + v * 16) * esc;
        ctx.globalAlpha = Math.min(1, (s - 0.12) * 5) * (1 - v) * 0.55; ctx.fillStyle = i % 2 ? '#2a211c' : '#3a2e26';
        disco(ctx, px + Math.cos(an) * Rb * 0.5 * (0.4 + v), cy - 8 * esc - sube + Math.sin(an) * 6, rr, 0.8, 0.3, sem + i * 7, e.t * 0.3); }
      ctx.globalAlpha = 1; }
    // la bola de fuego de Doom: crece, se alimenta un tercio de segundo y se apaga subiendo en humo
    ctx.globalCompositeOperation = 'lighter';
    bolaFuego(ctx, e, s, px, py, esc, dt);
    // la bola de pixel del estallido: cuatro capas que crecen de golpe y se enfrían de adentro hacia afuera
    if (s < 0.55) {
      const crece = 1 - (1 - Math.min(1, s / 0.09)) ** 3, enfria = Math.max(0, (s - 0.06) / 0.49), r0 = Rb * (0.35 + 0.65 * crece) * (1 + enfria * 0.25), yb = cy - enfria * 22 * esc;
      ctx.globalCompositeOperation = 'source-over';
      const capas: [string, number, number][] = [['#7a1608', 1, 0.75], ['#e0400c', 0.86, 0.95], ['#ff9a22', 0.66, 0.35], ['#ffe27a', 0.46, 0.2], ['#fffbe8', 0.28, 0.05]];
      // cada capa es un racimo de bocanadas (una coliflor, no un disco): las de afuera se abren y suben, el corazón
      // caliente queda corrido arriba
      const rl = azar(c.sem + 9), lob: [number, number, number][] = [[0, 0, 1]];
      for (let i = 0; i < 7; i++) { const an = (i / 7) * 6.283 + rl() * 0.6; lob.push([Math.cos(an) * (0.42 + rl() * 0.2), Math.sin(an) * (0.36 + rl() * 0.2) - 0.08, 0.5 + rl() * 0.22]); }
      capas.forEach(([col, k, fin], i) => { const vive = Math.max(0, 1 - enfria / (1 - fin * 0.4 + 0.0001)); if (vive <= 0) return;
        const rk = r0 * k * (i ? vive ** 0.35 : 1), abre = 0.7 + 0.5 * crece + enfria * 0.4, sube = i * 2.5 * esc;
        ctx.globalAlpha = Math.min(1, vive * 1.6) * (i === 0 ? 0.9 : 1); ctx.fillStyle = col;
        for (let q = 0; q < lob.length; q++) { const [ox, oy, rr] = lob[q]; if (i >= 3 && q > 0 && q % 2) continue;
          disco(ctx, px + ox * r0 * abre * (1 - i * 0.12), yb - sube + oy * r0 * abre * (1 - i * 0.12), rk * (q ? rr : 0.72), 0.9, 0.18 + enfria * 0.2, sem + i * 11 + q * 5, e.t); } });
      ctx.globalAlpha = 1;
    }
    ctx.globalCompositeOperation = 'lighter';
    // el fogonazo: el resplandor que abre el golpe y una onda de pixel en el aire
    if (s < 0.16) {
      const v = s / 0.16, rr = (24 + v * 40) * esc;
      ctx.globalAlpha = (1 - v) ** 1.2 * 0.9; ctx.drawImage(haloFuego(), px - rr * 2, cy - rr * 2, rr * 4, rr * 4);
      const ra = Math.round((18 + v * 70) * esc); ctx.globalAlpha = (1 - v) * 0.85; ctx.fillStyle = '#ffd890'; ctx.beginPath();
      for (let i = 0; i < 64; i++) { const an = (i / 64) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * ra), Math.round(cy + Math.sin(an) * ra * 0.6), 2, 2); }
      ctx.fill(); ctx.globalAlpha = 1;
    }
  }
  ctx.restore();
}
/** La luz de la Combustión para luces.ts: [radio, intensidad, golpe 0..1] o null. */
export function luzCombustion(e: Efecto): [number, number, number] | null {
  if (!poderesVivos()) return null;
  const esc = e.escala ?? 1, T0 = COMBUSTION_T0;
  if (e.t < T0) { const u = e.t / T0; return [90 + 120 * u * esc, 0.35 * u, 0]; }
  const s = e.t - T0; if (s > 1.8) return null;
  const golpe = Math.max(0, 1 - s / 0.18);
  return [(200 + 110 * golpe) * esc, Math.min(1, 0.55 * (1 - s / 1.8) * (0.85 + 0.15 * Math.sin(s * 37)) + golpe * 0.7), golpe * 0.35];
}
