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
import { HABILIDADES } from '../datos/clases';
import { ponerMancha } from '../juego/mundo';
import { nochePfx } from './pfx';
import { estiloTajo, tajosVivos } from './tajos';

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
  // (de día el resplandor del rayo suma menos: el Puño de dios quemaba a blanco)
  const hr = haloRayo(), kd = 0.4 + 0.6 * nochePfx();
  ctx.globalAlpha = k * 0.6 * kd; ctx.drawImage(hr, a[0] - 8, a[1] - 8, 16, 16);
  const rb = (nace ? 22 : 11) + r() * 4; ctx.globalAlpha = k * 0.85 * kd; ctx.drawImage(hr, b[0] - rb, b[1] - rb, rb * 2, rb * 2);
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
let tAnt = -1, zonaAnt = '', zonaMat = '';
const R = Math.random;
function estadoComb(e: Efecto): Comb { let c = combs.get(e); if (!c) { c = { det: false, tAnt: 0, sem: Math.floor(R() * 1e6) }; combs.set(e, c); } return c; }

/** Una vez por cuadro (con el reloj del juego): lo que pasa al nacer y al reventar, y los pedazos que vuelan. */
export function seguirPoderes(j: Juego) {
  if (j.zona.id !== zonaAnt) { zonaAnt = j.zona.id; trozos.length = 0; }
  const dt = tAnt < 0 ? 0 : Math.max(0, Math.min(0.05, j.t - tAnt)); tAnt = j.t;
  if (j.zona.id !== zonaMat) { zonaMat = j.zona.id; piezas.length = marcas.length = 0; }
  seguirMateria(j, dt);
  if (!poderesVivos()) return;
  for (const e of j.efectos as Efecto[]) {
    if (e.id !== 'combustion') continue;
    const c = estadoComb(e), esc = e.escala ?? 1;
    if (!(c as any).visto) { (c as any).visto = true; if (!(e as any).sinImplosion) anilloPiso(e.x, e.y, { d: COMBUSTION_T0 + 0.04, r0: 2.6 * esc, r1: 0.15, c: [255, 120, 40], g: 2, a: 0.7 }); }
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
  return itemsMateria(ctx, aP).concat(trozos.map((q) => ({ prof: q.x + q.y + 0.08, draw: () => {
    const [px, py] = aP(q.x, q.y), x = Math.round(px), y = Math.round(py - q.z), a = Math.min(1, (q.d - q.t) * 3);
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = q.c; ctx.fillRect(x, y, q.s, q.s);
    // la cara que mira al fuego, al rojo mientras vuela
    ctx.fillStyle = q.t < 0.6 ? '#ff7a2a' : '#6a4a30'; ctx.fillRect(x, y, q.s, 1); ctx.restore();
  } })));
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
      ctx.globalAlpha = (1 - v) ** 1.2 * 0.9 * (0.35 + 0.65 * nochePfx()); ctx.drawImage(haloFuego(), px - rr * 2, cy - rr * 2, rr * 4, rr * 4);
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

// ================================================================== la materia de cada poder
// (Rick, 19 nov 2026: "cada poder tiene que verse increíble"). Los golpes de sangre, el cuerpo a cuerpo y los proyectiles
// chicos dejaban casi nada después del golpe. mundo.ts anota de qué poder es cada efecto (`e.hab`) y cada golpe que
// conecta (`j.golpesPoder`, solo visual, no se guarda) y acá cada uno suelta su materia: sangre que salpica en abanico y
// cae al piso en gotas que manchan, pedazos de carne que rebotan, el tajo en media luna del color del poder, chispas de
// acero, astillas de flecha, de hueso, de hielo y de vidrio, el haz de luz que baja con sus runas, espinas y enredaderas
// que brotan, la ola de sangre de la Marea roja, grietas en el piso y, en las definitivas, un golpe propio por elemento.
// Todo a puntos enteros y en el orden del mundo. En táctil la mitad de piezas. `__sinMateria` lo apaga para comparar.

type Hab = (typeof HABILIDADES)[number];
const HABS = new Map<string, Hab>(HABILIDADES.map((h) => [h.id, h]));
const conMateria = () => poderesVivos() && !(window as any).__sinMateria;
const KT = () => (E.tactil ? 0.5 : 1);
/** Pieza suelta que vuela: gota (mancha al caer), astilla (gira), trozo (rebota), polvo (bocanada), bebe (va al héroe),
 * hoja (cae meciéndose), burbuja (sube y revienta). */
interface Pz { k: 'gota' | 'astilla' | 'trozo' | 'polvo' | 'bebe' | 'hoja' | 'burbuja'; x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; d: number; c: string; c2?: string; s: number; ang: number; va: number; reb: number; g: number; mancha?: 'sangre' | 'veneno'; luz?: boolean; x0?: number; y0?: number; z0?: number }
/** Marca que dura: tajo, grieta, haz, ola, púa, runas, remolino, estrella, fuente. */
interface Mk { k: 'puf' | 'tajo' | 'grieta' | 'haz' | 'ola' | 'pua' | 'runas' | 'remolino' | 'estrella' | 'fuente'; x: number; y: number; t: number; d: number; c: string; c2?: string; esc: number; sem: number; ang?: number; alto?: number; r?: number; pal?: string; ramas?: P[][]; lean?: number }
const piezas: Pz[] = [], marcas: Mk[] = [];
const TOPE_P = () => (E.tactil ? 220 : 520);
let jRef: Juego | null = null;
const vistosHab = new WeakSet<object>();
const defHecha = new Map<string, number>();
// (pruebas: t760 deja cada poder limpio, sin lo que soltó el anterior)
((window as any).__limpiadores ??= []).push(() => { piezas.length = marcas.length = trozos.length = 0; defHecha.clear(); });
const rnd = (a: number, b: number) => a + R() * (b - a);
const elige = <T,>(xs: T[]) => xs[Math.floor(R() * xs.length)];

function pz(p: Partial<Pz> & { k: Pz['k']; x: number; y: number }) {
  if (piezas.length >= TOPE_P()) return;
  piezas.push({ z: 0, vx: 0, vy: 0, vz: 0, t: 0, d: 1, c: '#fff', s: 2, ang: 0, va: 0, reb: 0, g: 380, ...p } as Pz);
}
function mk(m: Partial<Mk> & { k: Mk['k']; x: number; y: number; d: number }) { if (marcas.length < (E.tactil ? 40 : 90)) marcas.push({ t: 0, c: '#fff', esc: 1, sem: Math.floor(R() * 1e6), ...m } as Mk); }
/** Rumbo en pantalla de un rumbo del mundo (normalizado). */
function enPantalla(ux: number, uy: number): [number, number] { const sx = ux - uy, sy = (ux + uy) / 2, l = Math.hypot(sx, sy) || 1; return [sx / l, sy / l]; }

// ------------------------------------------------------------------ recetas sueltas
/** Sangre en abanico hacia donde iba el golpe: gotas que caen y manchan, y pedazos que rebotan. */
function sangre(x: number, y: number, z: number, ux: number, uy: number, n: number, trozos: number, fuerza = 1, hueso = false) {
  n = Math.round(n * KT()); trozos = Math.round(trozos * KT());
  for (let i = 0; i < n; i++) { const sp = (R() - 0.5) * 1.3, c = Math.cos(sp), s = Math.sin(sp), vx = ux * c - uy * s, vy = ux * s + uy * c, v = (1.4 + R() * 4.2) * fuerza;
    pz({ k: 'gota', x, y, z: z + rnd(-6, 6), vx: vx * v, vy: vy * v, vz: rnd(20, 150) * fuerza, d: 1.6, c: hueso ? elige(['#cfc6a8', '#9a9078']) : elige(['#9a0a0a', '#c01414', '#6a0606', '#e02a20']), s: R() < 0.25 ? 2 : 1, g: 420, mancha: hueso ? undefined : 'sangre' }); }
  for (let i = 0; i < trozos; i++) { const an = Math.atan2(uy, ux) + (R() - 0.5) * 1.8, v = rnd(1.5, 4) * fuerza;
    pz({ k: hueso ? 'astilla' : 'trozo', x, y, z: z + rnd(-4, 6), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(70, 190), d: rnd(1.6, 2.4), c: hueso ? '#d8d0b4' : elige(['#4a0606', '#6a1010', '#7a2a1c']), c2: hueso ? '#8a8268' : '#b02a20', s: hueso ? 4 : rnd(2, 3.5) | 0, reb: 2, ang: R() * 6, va: rnd(-14, 14), g: 460, mancha: hueso ? undefined : 'sangre' }); }
}
/** Astillas (madera, hueso, hielo, vidrio, piedra) que saltan, giran y rebotan. */
function astillas(x: number, y: number, z: number, n: number, cs: string[], c2: string, v0: number, s = 3, ux = 0, uy = 0, luz = false) {
  n = Math.round(n * KT());
  for (let i = 0; i < n; i++) { const an = ux || uy ? Math.atan2(uy, ux) + (R() - 0.5) * 2.4 : R() * 6.283, v = v0 * rnd(0.4, 1.2);
    pz({ k: 'astilla', x, y, z: z + rnd(-4, 8), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(60, 200), d: rnd(0.9, 1.6), c: elige(cs), c2, s: Math.max(2, Math.round(s * rnd(0.6, 1.2))), reb: 1, ang: R() * 6, va: rnd(-18, 18), g: 480, luz }); }
}
function polvo(x: number, y: number, n: number, c: string, r = 4, sube = 10, abre = 1.2) {
  n = Math.round(n * KT());
  for (let i = 0; i < n; i++) { const an = R() * 6.283, v = rnd(0.2, abre); pz({ k: 'polvo', x: x + Math.cos(an) * 0.2, y: y + Math.sin(an) * 0.2, z: rnd(0, 8), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(sube * 0.5, sube), d: rnd(0.7, 1.3), c, s: rnd(r * 0.7, r * 1.3), g: 0 }); }
}
function hojas(x: number, y: number, n: number, cs = ['#5a7a28', '#8a9a30', '#6a4a1c', '#a8b048']) {
  n = Math.round(n * KT());
  for (let i = 0; i < n; i++) { const an = R() * 6.283, v = rnd(1, 4); pz({ k: 'hoja', x, y, z: rnd(10, 40), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(60, 160), d: rnd(1.6, 2.6), c: elige(cs), s: 2, ang: R() * 6, va: rnd(3, 7), g: 160 }); }
}
function burbujas(x: number, y: number, n: number, r = 0.8, c = '#9ae04a') {
  n = Math.round(n * KT());
  for (let i = 0; i < n; i++) { const an = R() * 6.283, d = R() * r; pz({ k: 'burbuja', x: x + Math.cos(an) * d, y: y + Math.sin(an) * d, z: rnd(0, 10), vx: 0, vy: 0, vz: rnd(14, 40), d: rnd(0.5, 1.1), c, s: R() < 0.4 ? 3 : 2, g: -10 }); }
}
function brasas(x: number, y: number, z: number, n: number, v0 = 3, cs: [number, number, number][] = [[255, 230, 150], [255, 140, 40], [230, 70, 20]]) {
  chispasLibres(Math.round(n * KT()), () => { const an = R() * 6.283, v = rnd(0.5, v0); return { x, y, z: z + rnd(-4, 8), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(40, 160), t: 0, d: rnd(0.4, 0.9), c: elige(cs), s: R() < 0.3 ? 3 : 2, reb: 0, g: 160 }; });
}
/** Grieta en el piso: ramas quebradas desde el centro, que se abren de golpe y se apagan despacio. */
function grieta(x: number, y: number, esc: number, d: number, c2?: string) {
  const r = azar(Math.floor(R() * 1e6)), ramas: P[][] = [], n = 5 + Math.floor(r() * 4);
  for (let i = 0; i < n; i++) { let an = (i / n) * 6.283 + r() * 0.6, px = 0, py = 0; const ra: P[] = [[0, 0]], pasos = 3 + Math.floor(r() * 4 * Math.min(1.6, esc));
    for (let s = 0; s < pasos; s++) { const l = (4 + r() * 6) * esc; an += (r() - 0.5) * 0.9; px += Math.cos(an) * l; py += Math.sin(an) * l * 0.5; ra.push([px, py]);
      if (r() < 0.3 && s > 0) { const an2 = an + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.6), l2 = (4 + r() * 6) * esc; ramas.push([[px, py], [px + Math.cos(an2) * l2, py + Math.sin(an2) * l2 * 0.5]]); } }
    ramas.unshift(ra); }
  mk({ k: 'grieta', x, y, d, esc, ramas, c2 });
}
/** El haz de luz que baja del cielo y pega en el piso con su runa. */
function haz(x: number, y: number, esc: number, d: number, retraso = 0, c = '#ffe8a0') { mk({ k: 'haz', x, y, d: d + retraso, t: -retraso, esc, c }); }
function puas(x: number, y: number, n: number, radio: number, pal: string, alto: number, d: number, anillo = false, retraso = 0) {
  n = Math.max(3, Math.round(n * (E.tactil ? 0.6 : 1)));
  for (let i = 0; i < n; i++) { const an = anillo ? (i / n) * 6.283 + R() * 0.3 : R() * 6.283, rr = anillo ? radio * rnd(0.85, 1.1) : Math.sqrt(R()) * radio;
    mk({ k: 'pua', x: x + Math.cos(an) * rr, y: y + Math.sin(an) * rr, d: d + retraso, t: -retraso - (anillo ? 0 : R() * 0.12), pal, alto: alto * rnd(0.6, 1.25), lean: Math.cos(an) * rnd(0.1, 0.5), esc: 1 }); }
}
/** Estalla en el aire una estrella de pixel (impactos de luz, de rayo y de acero). */
function estrella(x: number, y: number, alto: number, c: string, r = 6, d = 0.18) { mk({ k: 'estrella', x, y, d, c, r, alto }); }

/** El reventón de pixel de un proyectil al pegar: capas del elemento que crecen de golpe y se enfrían de adentro afuera. */
const PAL_PUF: Record<string, string[]> = { fuego: ['#7a1608', '#e0400c', '#ff9a22', '#ffe27a', '#fffbe8'], frio: ['#2a4a7a', '#4a8ac8', '#9ad4ff', '#e0f6ff', '#ffffff'], veneno: ['#1e3a0c', '#3a7a18', '#7ac838', '#c8ff70', '#f0ffd0'],
  luz: ['#7a5a10', '#c89a28', '#ffd860', '#fff4c0', '#ffffff'], sombra: ['#14081e', '#3a1466', '#7a3ac8', '#c08aff', '#f0e0ff'], rayo: ['#1a2a7a', '#3a5ad8', '#8ab0ff', '#d8e4ff', '#ffffff'], sangre: ['#3a0404', '#7a0808', '#c01414', '#ff5a40', '#ffd0c0'] };
function puf(x: number, y: number, alto: number, el: string, esc = 1) { if (PAL_PUF[el]) mk({ k: 'puf', x, y, d: 0.32, alto, pal: el, esc }); }
// ------------------------------------------------------------------ qué suelta cada golpe
const FLECHA = /flecha|virote|andanada|racimo|lluvia|torreta|jabalina/;
const MELEE = new Set(['golpe', 'carga', 'salto', 'torbellino']);
function materiaGolpe(ev: any, k: number) {
  const hb = HABS.get(ev.hab) ?? (ev.hab === 'orbe_glacial_esquirla' ? HABS.get('orbe_glacial') : undefined), el: string = ev.elem, z = ev.alto;
  const tipo = hb?.tipo ?? 'proyectil', melee = MELEE.has(tipo), flecha = FLECHA.test(ev.hab) || /flecha|virote/.test(hb?.efecto ?? '');
  if ((tipo === 'area' || tipo === 'trampa' || tipo === 'maldicion') && hb?.duracion) k *= 0.4; // (lo que pega cada medio segundo, más contenido)
  const fuerte = ev.crit || ev.mata, sub = ev.parte !== undefined && ev.parte < 2, f = (fuerte ? 1.4 : 1) * (sub ? 0.7 : 1) * k;
  const [sx, sy] = enPantalla(ev.ux, ev.uy), col = hb?.color ?? '#e0e0e0';
  // el tajo en media luna, del color del poder (lo dibuja el filo, no un sprite)
  // (tercera pasada: la media luna del blanco es del estilo del golpe, el doble de grande, cuerpo oscuro, color y filo)
  const et = tajosVivos() ? estiloTajo(ev.hab) : null;
  if (melee && tipo !== 'torbellino') mk({ k: 'tajo', x: ev.x, y: ev.y, d: et ? Math.max(0.3, et.dur + 0.08) : 0.3, c: et ? et.medio : el === 'sangre' ? '#e01820' : el === 'luz' ? '#ffe070' : col, c2: et ? et.filo : el === 'fisico' ? '#f4f0e8' : '#fff4e0', pal: et?.cuerpo, esc: (fuerte ? 1.35 : 1) * (tipo === 'carga' ? 1.25 : 1) * (ev.parte !== undefined ? 1.1 : 1) * (et ? 0.75 + et.k * 0.45 + et.ancho * 0.012 : 1), ang: Math.atan2(sy, sx) + (ev.parte !== undefined ? (ev.parte % 2 ? -1 : 1) : R() < 0.5 ? -1 : 1) * rnd(0.35, 0.8), alto: z - (ev.parte ?? 1) * 4 + 4, r: ev.parte !== undefined ? (ev.parte % 2 ? -1 : 1) : R() < 0.5 ? 1 : -1, lean: et?.forma === 'garra' ? 3 : et?.extra === 'rasgar' ? 3 : 1 });
  // las chispas del contacto, del color del golpe, abiertas hacia donde iba el golpe
  if (et && melee) { const c = hexRgb(et.filo), c2 = hexRgb(et.medio); chispasLibres(Math.round((fuerte ? 12 : 6) * KT() * k), () => { const an = Math.atan2(ev.uy, ev.ux) + (R() - 0.5) * 1.7, v = rnd(2.5, 6); return { x: ev.x, y: ev.y, z: z + rnd(-6, 6), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(30, 150), t: 0, d: rnd(0.18, 0.4), c: R() < 0.4 ? c : c2, s: 2, reb: 1 }; }); if (fuerte) estrella(ev.x, ev.y, z, et.filo, 11, 0.2); }
  if (el === 'sangre' || (hb?.elem === 'sangre')) {
    sangre(ev.x, ev.y, z, ev.ux, ev.uy, 16 * f + (tipo === 'nova' ? -6 : 0), fuerte ? 4 : 2, 1, ev.hueso);
    if (!ev.hueso && !sub) ponerMancha(jRef!, { x: ev.x + ev.ux * 0.7, y: ev.y + ev.uy * 0.7, r: 0.5 + (fuerte ? 0.35 : 0), color: '#6a0a0a', t: 0, tipo: 'sangre', forma: 'salpicadura', ang: Math.atan2(ev.uy, ev.ux), sem: Math.floor(R() * 8), pal: 'rojo' });
    // la Sangría bebe: hilos de sangre que vuelven al arma del héroe
    if (ev.hab === 'sangria' || ev.hab === 'ejecucion' || ev.hab === 'rio_carmesi') for (let i = 0, n = Math.round(9 * KT()); i < n; i++) pz({ k: 'bebe', x: ev.x, y: ev.y, z, x0: ev.x + rnd(-0.3, 0.3), y0: ev.y + rnd(-0.3, 0.3), z0: z + rnd(-8, 8), d: rnd(0.35, 0.6), t: -i * 0.025, c: elige(['#e01818', '#ff4a3a', '#a00808']), s: 2, g: 0 });
    return;
  }
  if (el === 'fisico' && !flecha) {
    if (melee) { chispasLibres(Math.round((fuerte ? 9 : 5) * KT() * k), () => { const an = Math.atan2(ev.uy, ev.ux) + (R() - 0.5) * 2, v = rnd(2, 5); return { x: ev.x, y: ev.y, z: z + rnd(-4, 6), vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(40, 140), t: 0, d: rnd(0.2, 0.4), c: [255, 220, 150], s: 2, reb: 1 }; });
      sangre(ev.x, ev.y, z, ev.ux, ev.uy, 8 * f, fuerte ? 2 : 0, 0.9, ev.hueso); if (tipo === 'carga' || fuerte) estrella(ev.x, ev.y, z, '#fff6d8', fuerte ? 8 : 6); }
    else { polvo(ev.x, ev.y, 2, '#8a7a60', 3, 8); astillas(ev.x, ev.y, z, 4 * f, ['#a09888', '#6a6258'], '#3a342c', 3, 2); }
    return;
  }
  if ((tipo === 'proyectil' || tipo === 'bomba' || tipo === 'golpe') && !flecha && el !== 'fisico' && !sub) puf(ev.x, ev.y, z, el, (fuerte ? 1.3 : 1) * (hb?.explota ? 1.4 : 1));
  if (flecha) { estrella(ev.x, ev.y, z, '#fff6d8', fuerte ? 7 : 5, 0.14); polvo(ev.x, ev.y, 1, '#8a7a60', 3, 10, 0.5); astillas(ev.x, ev.y, z, 9 * f, ['#8a6a40', '#c8a878', '#5a4228'], '#2a1c10', 3.5, 3, -ev.ux, -ev.uy); if (el === 'fisico') sangre(ev.x, ev.y, z, ev.ux, ev.uy, 9 * f, fuerte ? 1 : 0, 0.9, ev.hueso); if (el === 'fuego') brasas(ev.x, ev.y, z, 8 * f); if (el === 'frio') astillas(ev.x, ev.y, z, 5 * f, ['#e4f6ff', '#9ad4ff'], '#5a8ab0', 3, 2, 0, 0, true); if (el === 'rayo') estrella(ev.x, ev.y, z, '#c8d8ff', 7); return; }
  if (el === 'luz') { estrella(ev.x, ev.y, z, '#fff0a8', fuerte ? 9 : 6, 0.22); astillas(ev.x, ev.y, z, 5 * f, ['#fff4c0', '#ffd860'], '#a07820', 2.5, 2, 0, 0, true);
    if ((melee || ev.hab === 'saeta_fe' || ev.hab === 'espadas_votivas' || ev.hab === 'lanza_espiritu') && marcas.filter((m) => m.k === 'haz').length < 6) haz(ev.x, ev.y, melee ? 0.7 : 0.5, 0.45);
    return; }
  if (el === 'frio') { astillas(ev.x, ev.y, z, 7 * f, ['#f0faff', '#bfe6ff', '#86c4f0'], '#3a6a98', 3.4, 3, ev.ux, ev.uy, true); polvo(ev.x, ev.y, 2, '#cfe8f4', 3, 14, 0.6); return; }
  if (el === 'fuego') { brasas(ev.x, ev.y, z, 10 * f, 3.5); polvo(ev.x, ev.y, 1, '#2a2420', 4, 26, 0.4); return; }
  if (el === 'veneno') { for (let i = 0, n = Math.round(7 * f * KT()); i < n; i++) { const an = R() * 6.283, v = rnd(1, 3.5); pz({ k: 'gota', x: ev.x, y: ev.y, z, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(40, 140), d: 1.4, c: elige(['#8fe04a', '#5ab828', '#c8ff70']), s: R() < 0.3 ? 2 : 1, g: 420, mancha: 'veneno' }); } burbujas(ev.x, ev.y, 3, 0.4); return; }
  if (el === 'sombra') { if (/hueso|osario|dientes|espiral/.test(ev.hab) || /hueso/.test(hb?.efecto ?? '')) astillas(ev.x, ev.y, z, 8 * f, ['#e8e0c8', '#c8bea0', '#a89e80'], '#4a4436', 4, 3, ev.ux, ev.uy);
    polvo(ev.x, ev.y, 2, '#2a1440', 4, 18, 0.5); return; }
  if (el === 'rayo') { chispasLibres(Math.round(6 * f * KT()), () => { const an = R() * 6.283, v = rnd(2, 5); return { x: ev.x, y: ev.y, z, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(30, 120), t: 0, d: rnd(0.15, 0.3), c: [200, 220, 255], s: 2, reb: 1 }; }); if (melee) estrella(ev.x, ev.y, z, '#d8e4ff', 8); }
}

// ------------------------------------------------------------------ lo que nace con cada efecto de un poder
function materiaEfecto(j: Juego, e: Efecto & { hab?: string }) {
  const hb = HABS.get(e.hab!); if (!hb) return;
  const h = j.heroe, enHeroe = Math.hypot(e.x - h.x, e.y - h.y) < 0.6, id = hb.id;
  // las definitivas: un golpe propio por elemento, una vez por lanzada (las de proyectil y bomba, donde revientan)
  if (hb.definitiva && !((hb.tipo === 'proyectil' || hb.tipo === 'bomba') && enHeroe) && j.t - (defHecha.get(id) ?? -9) > 0.9) { defHecha.set(id, j.t); definitiva(j, hb, e.x, e.y); }
  if (id === 'marea_roja' && enHeroe) { ola(e.x, e.y, hb.radio ?? 3.5, 0.55); return; }
  // fin de una carga o un salto: el piso se raja, polvo y piedras (de sangre el Torrente)
  if ((e.id === 'polvo_carga' || e.id === 'onda_aterrizaje') && (hb.tipo === 'carga' || hb.tipo === 'salto')) {
    const sg = hb.elem === 'sangre';
    grieta(e.x, e.y, hb.tipo === 'carga' ? 1.7 : 1.2, 2, sg ? '#ff3020' : undefined);
    if (hb.tipo === 'carga') { estrella(e.x, e.y, 30, sg ? '#ffb0a0' : '#fff6d8', 12, 0.22); (j as any).patada = { dx: 0, dy: 1, k: 6, t: performance.now() }; /* el golpe seco de la llegada (lo baja acc.temblor) */ }
    polvo(e.x, e.y, hb.tipo === 'carga' ? 11 : 7, sg ? '#5a1010' : '#8a7a62', 6, 16, 2.8);
    astillas(e.x, e.y, 4, 10, ['#6a5a48', '#8a7a62', '#4a3e30'], '#2a2018', 4.5, 3);
    anilloPiso(e.x, e.y, { d: 0.45, r0: 0.3, r1: 2.6, c: sg ? [220, 30, 30] : [230, 210, 170], g: 3, a: 0.7 });
    if (sg) { sangre(e.x, e.y, 18, 0, 0, 0, 0); for (let i = 0; i < 14 * KT(); i++) { const an = R() * 6.283, v = rnd(1.5, 4.5); pz({ k: 'gota', x: e.x, y: e.y, z: 14, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(90, 220), d: 1.8, c: elige(['#9a0a0a', '#c01414', '#e02a20']), s: 2, g: 420, mancha: 'sangre' }); } ponerMancha(j, { x: e.x, y: e.y, r: 1.1, color: '#5a0808', t: 0, tipo: 'sangre', forma: 'charco', rmax: 1.4, sem: Math.floor(R() * 8), pal: 'rojo' }); }
    j.sacudida = Math.max(j.sacudida, 0.4); return;
  }
  // los frascos del alquimista: el vidrio que estalla y lo que traía adentro
  if (hb.tipo === 'bomba' && !enHeroe && !/suelo_ardiente|crater|nube/.test(e.id)) {
    astillas(e.x, e.y, 30, 18, ['#e8faff', '#a8dcef', '#ffffff', '#7ab8d0'], '#4a7890', 4.5, 5, 0, 0, true); puf(e.x, e.y, 22, hb.elem === 'fisico' ? 'fuego' : hb.elem, 1.6);
    if (hb.elem === 'fuego') brasas(e.x, e.y, 20, 18, 4.5);
    if (hb.elem === 'frio') astillas(e.x, e.y, 20, 10, ['#f0faff', '#bfe6ff'], '#3a6a98', 4, 3, 0, 0, true);
    if (hb.elem === 'veneno') { for (let i = 0; i < 14 * KT(); i++) { const an = R() * 6.283, v = rnd(1, 4); pz({ k: 'gota', x: e.x, y: e.y, z: 20, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(60, 180), d: 1.5, c: elige(['#8fe04a', '#5ab828', '#c8ff70']), s: R() < 0.3 ? 2 : 1, g: 420, mancha: 'veneno' }); } burbujas(e.x, e.y, 8, 1); }
    if (hb.elem === 'rayo') estrella(e.x, e.y, 20, '#d8e4ff', 10, 0.25);
    return;
  }
  // columnas de luz y castigos de un poder de luz: el haz que baja
  if (hb.elem === 'luz' && /pilar_luz|castigo|columna/.test(e.id) && !hb.definitiva && marcas.filter((m) => m.k === 'haz').length < 8) { haz(e.x, e.y, Math.min(1.4, 0.8 * (e.escala ?? 1)), 0.6); mk({ k: 'runas', x: e.x, y: e.y, d: 0.9, c: '#ffd860', r: 1.1 * (e.escala ?? 1) }); return; }
  // espinas y raíces del druida
  if (e.id === 'estallido_enredaderas' && !hb.definitiva) { puas(e.x, e.y, 9, Math.min(3, (hb.radio ?? 2.5) * 0.8), 'espina', 18, 1.2); hojas(e.x, e.y, 8); return; }
  // remolinos de viento del monje y del druida
  if (/tornado|nova_viento/.test(e.id) && enHeroe && hb.tipo !== 'proyectil' && !hb.definitiva) { mk({ k: 'remolino', x: e.x, y: e.y, d: 0.8, c: '#d8f0ff', r: hb.radio ?? 3 }); return; }
}
/** El horneado que la materia reemplaza: la salpicadura de sangre horneada salía borrosa y agrandada encima del tajo. */
export function sinHorneado(e: Efecto): boolean {
  const hab = (e as any).hab as string | undefined; if (!conMateria() || !hab) return false;
  if (e.id === 'salpicadura_sangre') return true;
  // (la cuadrícula de oro horneada de la Égida del alba: la reemplaza el haz y el sello de render/presencias.ts)
  if (!(window as any).__sinPresencias && ((hab === 'egida_alba' && e.id === 'pfx:fx_bloqueo_escudo') || (hab === 'piel_hierro' && e.id === 'pfx:fx_parada') || (hab === 'cepo_dientes' && e.id === 'pfx:fx_explosion_tierra') || (hab === 'armadura_hueso' && e.id === 'pfx:fx_calaveras_orbitan') || (hab === 'llamar_halcon' && e.id === 'pfx:fx_plumas')
    // (la burbuja de oro del escudo divino en mejoras que no son de luz: el tónico, la piel de yunque, el mantra y la cortina)
    || (/^(tonico_hierro|piel_hierro|mantra_piedra|cortina_viento)$/.test(hab) && /escudo_divino|fx_parada/.test(e.id)))) return true;
  // (tercera pasada) la media luna gris horneada del tajo y las garras: la reemplaza la de render/tajos.ts, del estilo de
  // cada golpe (salía igual en todos, gris y punteada). Solo la que cae en el blanco, no lo que nace en el héroe
  if (!estiloTajo(hab) || !tajosVivos() || !/^(pfx:fx_(tajo_espada|zarpazo|tajo_doble|hachazo|barrido_lanza|estocada|latigazo|rafaga_dagas)|chispas_carne|tajo_garras)$/.test(e.id)) return false;
  const de = (e as any).de as [number, number] | undefined; return !de || Math.hypot(e.x - de[0], e.y - de[1]) > 0.5;
}
function ola(x: number, y: number, radio: number, d: number, retraso = 0) { mk({ k: 'ola', x, y, d: d + retraso, t: -retraso, r: radio, c: '#a80c0c' }); }

/** El golpe propio de cada definitiva, por elemento. */
function definitiva(j: Juego, hb: Hab, x: number, y: number) {
  const id = hb.id, r = Math.min(6, hb.radio ?? 4);
  j.sacudida = Math.max(j.sacudida, 0.55);
  if (id === 'rio_carmesi') {
    ola(x, y, r * 0.75, 0.55); ola(x, y, r, 0.7, 0.14);
    for (let i = 0; i < 8; i++) { const an = (i / 8) * 6.283 + R() * 0.3, d = rnd(1.4, r * 0.8); mk({ k: 'fuente', x: x + Math.cos(an) * d, y: y + Math.sin(an) * d, d: 0.55, t: -i * 0.04, c: '#c01414' }); }
    ponerMancha(j, { x, y, r: 1.6, color: '#5a0808', t: 0, tipo: 'sangre', forma: 'charco', rmax: 2.2, sem: 3, pal: 'rojo' });
    grieta(x, y, 1.8, 2.2, '#ff2010'); return;
  }
  if (hb.elem === 'luz') {
    mk({ k: 'runas', x, y, d: 1.6, c: '#ffd860', r: Math.min(3.2, r * 0.6) }); haz(x, y, 1.9, 1.1);
    for (let i = 0; i < 7; i++) { const an = R() * 6.283, d = rnd(1.2, Math.min(4, r * 0.75)); haz(x + Math.cos(an) * d, y + Math.sin(an) * d, rnd(0.8, 1.1), 0.7, 0.08 + i * 0.06); }
    brasas(x, y, 30, 26, 3, [[255, 250, 220], [255, 220, 120], [255, 200, 80]]); return;
  }
  if (id === 'lamento_osario' || id === 'legion_ceniza' || id === 'condena_osario') {
    puas(x, y, 14, id === 'condena_osario' ? 2 : 2.6, 'hueso', 34, 1.5, true); puas(x, y, 7, 1.6, 'hueso', 24, 1.3, false, 0.1);
    grieta(x, y, 1.5, 2, '#8a40ff'); polvo(x, y, 10, '#1e1028', 6, 30, 2); astillas(x, y, 12, 14, ['#e8e0c8', '#c8bea0'], '#4a4436', 4.5, 3); return;
  }
  if (id === 'despertar_bosque') { puas(x, y, 16, 3, 'espina', 30, 1.8, true); puas(x, y, 8, 2.2, 'espina', 20, 1.6, false, 0.12); hojas(x, y, 24); grieta(x, y, 1.6, 2.4); return; }
  if (id === 'panacea_negra') { astillas(x, y, 30, 18, ['#e8faff', '#a8dcef', '#ffffff'], '#4a7890', 4, 3, 0, 0, true); burbujas(x, y, 22, 1.6, '#7ad040'); return; }
  if (hb.elem === 'frio' && id !== 'ojo_tifon') { puas(x, y, 12, Math.min(4, r * 0.5), 'hielo', 24, 1.6, true); astillas(x, y, 24, 24, ['#f0faff', '#bfe6ff', '#86c4f0'], '#3a6a98', 5, 3, 0, 0, true); return; }
  if (id === 'ojo_tifon') { mk({ k: 'remolino', x, y, d: 1.4, c: '#e0f4ff', r: 4 }); mk({ k: 'remolino', x, y, d: 1.2, t: -0.15, c: '#a8d8ff', r: 2.6 }); hojas(x, y, 14, ['#c8d8e0', '#8aa0b0', '#e8f0f4']); return; }
  if (hb.elem === 'rayo') { for (let i = 0; i < 5; i++) { const an = R() * 6.283, d = i ? rnd(0.8, 2.8) : 0; j.efectos.push({ id: 'arco_cadena', x: x + Math.cos(an) * d + (R() - 0.5), y: y + Math.sin(an) * d - 0.8, x2: x + Math.cos(an) * d, y2: y + Math.sin(an) * d, t: -i * 0.05, dir: 0, escala: 1, z: 0, dur: 0.32, za: 240 + R() * 60, zb: 0, suelo: true, cielo: true, sem: Math.floor(R() * 1e6) } as any); }
    grieta(x, y, 1.6, 1.8, '#8ab0ff'); return; }
  // (la Ira de la estación ya trae sus meteoros: solo la grieta de lava, la bola encima quemaba la pantalla entera)
  if (id === 'ira_estacion') { grieta(x, y, 1.8, 2.4, '#ff6a10'); return; }
  if (hb.elem === 'fuego') { const c = { id: 'combustion', x, y, t: COMBUSTION_T0, dir: 0, escala: 1.4, z: 0, dur: 2.4, sinImplosion: true } as any; j.efectos.push(c); grieta(x, y, 1.8, 2.4, '#ff6a10');
    if (id === 'gran_crisol') astillas(x, y, 30, 18, ['#e8faff', '#a8dcef', '#ffffff'], '#4a7890', 5, 3, 0, 0, true); return; }
  // de tierra y furia: ira del jarl, rugido primigenio, cacería salvaje
  grieta(x, y, 2.2, 2.4, id === 'ira_jarl' ? '#ff4010' : undefined);
  polvo(x, y, 12, '#8a7a62', 7, 18, 3.4);
  astillas(x, y, 4, 22, ['#6a5a48', '#8a7a62', '#4a3e30', '#a09078'], '#2a2018', 6, 4);
  if (id !== 'ira_jarl') hojas(x, y, 18);
}

// ------------------------------------------------------------------ los proyectiles chicos: lo que dejan en el vuelo
function enVuelo(j: Juego, dt: number) {
  if (dt <= 0) return;
  for (const p of j.proyectiles as any[]) {
    if (!p.deHeroe || p.arco) continue;
    const id = p.hab?.id ?? p.habVivo, el = p.elem, z = p.z ?? 20, k = dt * 60 * KT();
    if (!id) continue;
    if (el === 'fuego' && !/bola_fuego|fuego_grande/.test(p.efecto)) { if (R() < 0.7 * k) brasas(p.x, p.y, z - 6, 1, 0.6); if (R() < 0.18 * k) polvo(p.x, p.y, 1, '#2e2622', 2.5, 24, 0.2); }
    else if (el === 'frio' && id !== 'orbe_glacial_esquirla') { if (R() < 0.6 * k) pz({ k: 'astilla', x: p.x + rnd(-0.1, 0.1), y: p.y + rnd(-0.1, 0.1), z: z - 6, vx: -p.vx * 0.05, vy: -p.vy * 0.05, vz: rnd(-10, 20), d: rnd(0.4, 0.7), c: elige(['#f0faff', '#bfe6ff']), c2: '#6aa0d0', s: 2, g: 60, luz: true }); }
    else if (el === 'rayo' && R() < 0.4 * k) chispasLibres(1, () => ({ x: p.x, y: p.y, z: z - 6, vx: rnd(-2, 2), vy: rnd(-2, 2), vz: rnd(10, 60), t: 0, d: 0.2, c: [210, 225, 255], s: 2, reb: 1 }));
    else if (el === 'luz' && R() < 0.5 * k) pz({ k: 'astilla', x: p.x, y: p.y, z: z - 6, vx: rnd(-0.3, 0.3), vy: rnd(-0.3, 0.3), vz: rnd(-10, 20), d: 0.5, c: elige(['#fff4c0', '#ffd860']), s: 1, g: -20, luz: true });
    else if (el === 'veneno' && R() < 0.25 * k) pz({ k: 'gota', x: p.x, y: p.y, z: z - 6, vx: p.vx * 0.1, vy: p.vy * 0.1, vz: 0, d: 1.2, c: '#8fe04a', s: 1, g: 300, mancha: R() < 0.3 ? 'veneno' : undefined });
    else if ((el === 'sombra' || /hueso/.test(p.efecto)) && R() < 0.3 * k) pz({ k: 'astilla', x: p.x, y: p.y, z: z - 6, vx: -p.vx * 0.05, vy: -p.vy * 0.05, vz: rnd(0, 30), d: 0.6, c: '#d8d0b4', c2: '#6a6250', s: 2, g: 300 });
  }
  // la carga y el salto: polvo detrás y, el Torrente de sangre, un reguero
  const h = j.heroe, s = (h as any).salto;
  if (s?.hab) { const sg = s.hab.elem === 'sangre';
    if (R() < 0.8 * KT()) polvo(h.x, h.y, 1, sg ? '#4a0c0c' : '#8a7a62', 4, 10, 0.4);
    if (sg) for (let i = 0; i < 2; i++) pz({ k: 'gota', x: h.x + rnd(-0.2, 0.2), y: h.y + rnd(-0.2, 0.2), z: rnd(10, 30), vx: rnd(-1, 1), vy: rnd(-1, 1), vz: rnd(10, 60), d: 1.4, c: elige(['#9a0a0a', '#c01414']), s: R() < 0.3 ? 2 : 1, g: 420, mancha: 'sangre' }); }
}

/** Una vez por cuadro: los golpes y efectos nuevos de los poderes, y lo que vuela. */
function seguirMateria(j: Juego, dt: number) {
  jRef = j;
  const gp = (j as any).golpesPoder as any[] | undefined;
  if (!conMateria()) { if (gp) gp.length = 0; piezas.length = marcas.length = 0; return; }
  if (gp?.length) { const k = Math.max(0.35, 1 / Math.sqrt(gp.length)); for (const ev of gp) materiaGolpe(ev, k); gp.length = 0; }
  for (const e of j.efectos as any[]) { if (!e.hab || vistosHab.has(e)) continue; vistosHab.add(e); if (e.t < 0.2) materiaEfecto(j, e); }
  enVuelo(j, dt);
  const h = j.heroe;
  for (let i = piezas.length - 1; i >= 0; i--) {
    const q = piezas[i]; q.t += dt; if (q.t > q.d) { piezas.splice(i, 1); continue; } if (q.t < 0) continue;
    if (q.k === 'bebe') { const u = Math.min(1, q.t / q.d), e = u * u * (3 - 2 * u); q.x = q.x0! + (h.x - q.x0!) * e; q.y = q.y0! + (h.y - q.y0!) * e; q.z = q.z0! + (40 - q.z0!) * e + Math.sin(u * Math.PI) * 26; continue; }
    if (q.k === 'hoja') { q.vx *= Math.exp(-2 * dt); q.vy *= Math.exp(-2 * dt); if (q.vz < -30) q.vz = -30; }
    if (q.k === 'polvo') { q.vx *= Math.exp(-3 * dt); q.vy *= Math.exp(-3 * dt); q.vz *= Math.exp(-1.5 * dt); }
    q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; q.vz -= q.g * dt; q.ang += q.va * dt;
    if (q.z < 0 && q.g > 0) {
      if (q.k === 'gota') { if (q.mancha && R() < 0.55) ponerMancha(j, { x: q.x, y: q.y, r: q.s > 1 ? rnd(0.12, 0.2) : rnd(0.07, 0.12), color: q.mancha === 'veneno' ? '#2a5a10' : '#6a0808', t: 0, tipo: q.mancha, forma: q.mancha === 'sangre' ? 'gota' : undefined, sem: Math.floor(R() * 8), pal: 'rojo' }); piezas.splice(i, 1); continue; }
      if (q.reb > 0) { q.z = 0; q.vz = -q.vz * 0.32; q.vx *= 0.5; q.vy *= 0.5; q.va *= 0.5; q.reb--; if (q.mancha && R() < 0.5) ponerMancha(j, { x: q.x, y: q.y, r: 0.14, color: '#5a0808', t: 0, tipo: 'sangre', forma: 'gota', sem: Math.floor(R() * 8), pal: 'rojo' }); }
      else { q.z = 0; q.vz = 0; q.vx *= 0.6; q.vy *= 0.6; q.va = 0; }
    }
  }
  for (let i = marcas.length - 1; i >= 0; i--) {
    const m = marcas[i]; m.t += dt; if (m.t > m.d) { marcas.splice(i, 1); continue; }
    // la fuente de sangre escupe mientras dura; la ola suelta gotas por la cresta
    if (m.t >= 0 && m.k === 'fuente' && m.t < 0.4) for (let n = 0; n < 3 * KT(); n++) { const an = R() * 6.283, v = rnd(0.3, 1.6); pz({ k: 'gota', x: m.x, y: m.y, z: 4, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(150, 260), d: 2, c: elige(['#9a0a0a', '#c01414', '#e02a20', '#6a0606']), s: R() < 0.4 ? 2 : 1, g: 460, mancha: 'sangre' }); }
    if (m.t >= 0 && m.k === 'ola' && m.t < m.d * 0.7 && R() < 0.9) { const u = m.t / m.d, rr = m.r! * (1 - (1 - u) ** 2.4);
      if (R() < 0.45) { const an = R() * 6.283; ponerMancha(j, { x: m.x + Math.cos(an) * rr, y: m.y + Math.sin(an) * rr, r: rnd(0.25, 0.5), color: '#6a0a0a', t: 0, tipo: 'sangre', forma: 'salpicadura', ang: an, sem: Math.floor(R() * 8), pal: 'rojo' }); } for (let n = 0; n < 3 * KT(); n++) { const an = R() * 6.283, v = rnd(0.8, 2.4); pz({ k: 'gota', x: m.x + Math.cos(an) * rr, y: m.y + Math.sin(an) * rr, z: 6, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(60, 150), d: 1.5, c: elige(['#9a0a0a', '#c01414', '#e02a20']), s: R() < 0.3 ? 2 : 1, g: 440, mancha: 'sangre' }); } }
  }
}

// ------------------------------------------------------------------ el dibujo
function itemsMateria(ctx: CanvasRenderingContext2D, aP: (x: number, y: number) => [number, number]): { prof: number; draw: () => void }[] {
  if (!conMateria()) return [];
  const out: { prof: number; draw: () => void }[] = [];
  // las piezas van en un solo item por fila de profundidad gruesa: un drawcall por pieza era caro con 400
  for (const q of piezas) { if (q.t < 0) continue; out.push({ prof: q.x + q.y + (q.z <= 0.5 && q.k !== 'polvo' ? -0.3 : 0.08), draw: () => dibPieza(ctx, q, aP) }); }
  // la cabeza viva de los proyectiles chicos: el dardo de brasa y las brasas saltarinas arden en pixel, las chispas
  // errantes chisporrotean en arcos que cambian 24 veces por segundo, la astilla de escarcha destella
  if (jRef) for (const p of jRef.proyectiles as any[]) { if (!p.deHeroe || p.arco) continue; const id = p.hab?.id ?? p.habVivo; if (!id) continue;
    if (p.elem === 'fuego' && !/bola_fuego|fuego_grande/.test(p.efecto)) out.push({ prof: p.x + p.y + 0.09, draw: () => cabezaFuego(ctx, p, aP) });
    else if (p.elem === 'rayo' && /chispa/.test(p.efecto)) out.push({ prof: p.x + p.y + 0.09, draw: () => cabezaRayo(ctx, p, aP) });
    else if (p.elem === 'frio' && !/orbe/.test(id)) out.push({ prof: p.x + p.y + 0.09, draw: () => cabezaHielo(ctx, p, aP) }); }
  for (const m of marcas) { if (m.t < 0) continue;
    const plano = m.k === 'grieta' || m.k === 'runas', pr = m.x + m.y;
    if (m.k === 'ola' || m.k === 'remolino') { out.push({ prof: pr - 0.7, draw: () => dibMarca(ctx, m, aP, -1) }); out.push({ prof: pr + 0.7, draw: () => dibMarca(ctx, m, aP, 1) }); continue; }
    out.push({ prof: plano ? -1e6 + pr + 0.6 : pr + (m.k === 'tajo' || m.k === 'estrella' ? 0.75 : 0.05), draw: () => dibMarca(ctx, m, aP, 0) }); }
  return out;
}
function cabezaFuego(ctx: CanvasRenderingContext2D, p: any, aP: (x: number, y: number) => [number, number]) {
  const [px, py] = aP(p.x, p.y), z = p.z ?? 20, x = Math.round(px), y = Math.round(py - z), [sx, sy] = enPantalla(p.vx, p.vy), sem = (p.t * 60) | 0, gr = p.hab?.id === 'brasas_saltarinas' ? 0.75 : 1;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // la cola: bocanadas que se enfrían hacia atrás
  const cola: [string, number][] = [['#7a1608', 4.2], ['#e0400c', 3.2], ['#ff9a22', 2.2], ['#ffe27a', 1.4]];
  for (let i = 5; i >= 0; i--) { const d = i * 2.6 * gr, r = (4.5 - i * 0.6) * gr; if (r < 0.8) continue; ctx.globalAlpha = 1 - i * 0.14; ctx.fillStyle = i > 3 ? '#7a1608' : i > 1 ? '#e0400c' : '#ff9a22'; disco(ctx, x - sx * d, y - sy * d + (i ? Math.sin(p.t * 40 + i) * 0.8 : 0), r, 0.9, 0.3, sem + i * 7, p.t); }
  ctx.globalAlpha = 1; for (const [c, r] of cola) { ctx.fillStyle = c; disco(ctx, x, y, r * gr, 0.9, 0.25, sem, p.t); }
  ctx.fillStyle = '#fffbe8'; ctx.fillRect(x, y - 1, 2, 2);
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5 * (0.5 + 0.5 * nochePfx()); const hf = haloFuego(); ctx.drawImage(hf, x - 14, y - 14, 28, 28);
  ctx.restore();
}
function cabezaRayo(ctx: CanvasRenderingContext2D, p: any, aP: (x: number, y: number) => [number, number]) {
  const [px, py] = aP(p.x, p.y), z = p.z ?? 20, c: P = [px, py - z], r = azar(Math.floor(p.t * 24) * 131 + (p.x * 977 | 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const ramas: P[][] = []; for (let i = 0; i < 3; i++) { const an = r() * 6.283, l = 5 + r() * 8; ramas.push(quebrar(c, [c[0] + Math.cos(an) * l, c[1] + Math.sin(an) * l], r, 0.7, 2)); }
  // y una que pica el piso
  ramas.push(quebrar(c, [px + (r() - 0.5) * 10, py], r, 0.5, 3));
  ctx.fillStyle = 'rgba(120,150,255,0.7)'; ctx.beginPath(); for (const q of ramas) trazo(ctx, q, 2); ctx.fill();
  ctx.fillStyle = '#ffffff'; ctx.beginPath(); for (const q of ramas) trazo(ctx, q, 1, 1, 0, 0.7); ctx.fill();
  ctx.fillRect(Math.round(c[0]) - 1, Math.round(c[1]) - 1, 3, 3);
  ctx.globalAlpha = 0.7; ctx.drawImage(haloRayo(), c[0] - 12, c[1] - 12, 24, 24);
  ctx.restore();
}
function cabezaHielo(ctx: CanvasRenderingContext2D, p: any, aP: (x: number, y: number) => [number, number]) {
  const [px, py] = aP(p.x, p.y), z = p.z ?? 20, x = Math.round(px), y = Math.round(py - z), l = 3 + Math.round(2 * Math.abs(Math.sin(p.t * 18)));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#e8f8ff';
  ctx.fillRect(x - l, y, l * 2 + 1, 1); ctx.fillRect(x, y - l, 1, l * 2 + 1); ctx.fillStyle = '#9ad4ff'; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1);
  ctx.restore();
}
function dibPieza(ctx: CanvasRenderingContext2D, q: Pz, aP: (x: number, y: number) => [number, number]) {
  const [px, py] = aP(q.x, q.y), x = Math.round(px), y = Math.round(py - q.z), fin = Math.min(1, (q.d - q.t) * 3);
  ctx.save(); ctx.globalAlpha = fin;
  switch (q.k) {
    case 'gota': { ctx.fillStyle = q.c; ctx.fillRect(x, y, q.s, q.s);
      // la estela de la gota mientras cae rápido
      const vz = q.vz, l = Math.min(3, Math.abs(vz) / 70) | 0; if (l > 0) { ctx.globalAlpha = fin * 0.6; ctx.fillRect(x, vz < 0 ? y - l : y + q.s, 1, l); } break; }
    case 'trozo': { ctx.fillStyle = q.c; ctx.fillRect(x, y, q.s, q.s); ctx.fillStyle = q.c2 ?? q.c; ctx.fillRect(x, y, q.s, 1); if (q.s > 2) { ctx.fillStyle = '#1a0202'; ctx.fillRect(x + q.s - 1, y + q.s - 1, 1, 1); } break; }
    case 'astilla': { const l = q.s, dx = Math.cos(q.ang), dy = Math.sin(q.ang) * 0.6; if (q.luz) ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = q.c2 ?? q.c; ctx.beginPath(); for (let i = 0; i < l; i++) ctx.rect(Math.round(x + dx * (i - l / 2)), Math.round(y + dy * (i - l / 2)) + 1, 1, 1); ctx.fill();
      ctx.fillStyle = q.c; ctx.beginPath(); for (let i = 0; i < l; i++) ctx.rect(Math.round(x + dx * (i - l / 2)), Math.round(y + dy * (i - l / 2)), 1, 1); ctx.fill();
      // el destello del hielo, el vidrio y la luz cuando gira de cara
      if (q.luz && Math.sin(q.ang * 2) > 0.8) { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, 1, 1); } break; }
    case 'polvo': { const u = q.t / q.d, r = q.s * (0.6 + u * 1.4); ctx.globalAlpha = (1 - u) * 0.42; ctx.fillStyle = q.c; disco(ctx, x, y, r, 0.75, 0.3, q.ang * 7 + q.s, q.t * 0.4); break; }
    case 'bebe': { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = q.c; ctx.fillRect(x, y, 2, 2); ctx.globalAlpha = fin * 0.5; ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + 2, y - 1, 1, 1); break; }
    case 'hoja': { const sw = Math.round(Math.sin(q.t * q.va) * 2); ctx.fillStyle = q.c; ctx.fillRect(x + sw, y, Math.cos(q.t * q.va) > 0 ? 2 : 1, 1); ctx.fillRect(x + sw + 1, y + 1, 1, 1); break; }
    case 'burbuja': { const u = q.t / q.d; ctx.fillStyle = q.c; if (u > 0.85) { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + q.s, y, 1, 1); ctx.fillRect(x + 1, y - 1, 1, 1); } else { ctx.fillRect(x, y, q.s, 1); ctx.fillRect(x, y + q.s - 1, q.s, 1); ctx.fillRect(x, y, 1, q.s); ctx.fillRect(x + q.s - 1, y, 1, q.s); ctx.fillStyle = '#eaffc8'; ctx.fillRect(x, y, 1, 1); } break; }
  }
  ctx.restore();
}
// las runas del piso: glifos de 3 x 5
const GLIFOS = [[7, 2, 2, 2, 7], [5, 5, 7, 2, 2], [2, 5, 7, 5, 5], [7, 1, 7, 4, 7], [6, 5, 6, 5, 6], [2, 7, 2, 2, 2], [5, 2, 5, 2, 5], [7, 5, 5, 5, 2]];
const PAL_PUA: Record<string, [string, string, string]> = { hueso: ['#8a8268', '#ddd4b8', '#fffaf0'], hielo: ['#4a7aa8', '#b8e2ff', '#ffffff'], espina: ['#3a2a14', '#5a7a28', '#a8c860'], sangre: ['#4a0606', '#a01010', '#ff5040'] };
function dibMarca(ctx: CanvasRenderingContext2D, m: Mk, aP: (x: number, y: number) => [number, number], mitad: number) {
  const [px0, py0] = aP(m.x, m.y), px = Math.round(px0), py = Math.round(py0), u = m.t / m.d;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  switch (m.k) {
    case 'tajo': {
      // media luna: la cabeza barre en el primer tercio y la cola la sigue; gruesa en el medio y fina en las puntas.
      // Con estilo (pal = el cuerpo oscuro): tres capas, el cuerpo tapa, el color del golpe y el filo encendido; las
      // garras y el Desgarro son tres rayas paralelas (lean)
      const R0 = Math.round(24 * m.esc), cx = px - Math.cos(m.ang!) * R0 * 0.75, cy = py - m.alto! - Math.sin(m.ang!) * R0 * 0.75, abre = 2.1, cab = Math.min(1, u / 0.25), col = Math.max(0, (u - 0.4) / 0.6);
      const N = Math.ceil(abre * R0 * 1.4), g = 1 + Math.round(3 * m.esc * (1 - u * 0.6));
      const capa = (c: string, a: number, w: (f: number) => number, dr: number) => { ctx.globalAlpha = a; ctx.fillStyle = c; ctx.beginPath();
        for (let i = 0; i <= N; i++) { const f = i / N; if (f > cab || f < col) continue; const th = m.ang! + m.r! * (f - 0.5) * abre, ww = Math.max(1, Math.round(w(f))), rx = Math.round(cx + Math.cos(th) * (R0 + dr)), ry = Math.round(cy + Math.sin(th) * (R0 + dr) * 0.85); ctx.rect(rx, ry, ww, ww); }
        ctx.fill(); };
      if (m.pal) { const kd = 0.55 + 0.45 * nochePfx(), rayas = m.lean ?? 1;
        for (let q = 0; q < rayas; q++) { const dr = -q * (g + 3), gg = rayas > 1 ? Math.max(1, g * 0.6) : g;
          capa(m.pal, 0.8 * (1 - u * u), (f) => (gg + 1.5) * Math.sin(Math.PI * f) ** 1.3 + 1, dr + 1);
          ctx.globalCompositeOperation = 'lighter'; capa(m.c, (1 - u) * kd, (f) => gg * Math.sin(Math.PI * f) ** 1.8, dr); ctx.globalCompositeOperation = 'source-over';
          capa(m.c2 ?? '#ffffff', (1 - u) * 0.95, (f) => (f > 0.15 && f < 0.85 ? 1 : 0), dr - 1); }
        break; }
      // el cuerpo del color del poder tapa (se lee sobre arena y sobre nieve), el filo blanco se suma como luz
      capa(m.c, 0.62 * (1 - u * u), (f) => g * Math.sin(Math.PI * f) ** 1.6 + 1, 1);
      ctx.globalCompositeOperation = 'lighter';
      capa(m.c2 ?? '#ffffff', 1 - u, (f) => (g - 1) * Math.sin(Math.PI * f) ** 2, 0);
      capa('#ffffff', (1 - u) * 0.8, () => 1, -1);
      break; }
    case 'puf': {
      const pal = PAL_PUF[m.pal!], crece = 1 - (1 - Math.min(1, m.t / 0.06)) ** 3, enfria = Math.max(0, (m.t - 0.04) / (m.d - 0.04)), r0 = 9 * m.esc * (0.4 + 0.6 * crece) * (1 + enfria * 0.3), y0 = py - m.alto! - enfria * 8;
      for (let i = 0; i < 5; i++) { const vive = 1 - enfria / (1 - i * 0.12); if (vive <= 0) continue; ctx.globalAlpha = Math.min(1, vive * 1.8); ctx.fillStyle = pal[i];
        disco(ctx, px + (i ? 0 : 0), y0 - i * 0.8, r0 * (1 - i * 0.17) * (i ? vive ** 0.4 : 1), 0.85, 0.22 + enfria * 0.2, m.sem % 97 + i * 11, m.t); }
      break; }
    case 'estrella': { const k = 1 - u, l = Math.round(m.r! * (0.5 + 0.5 * k)), x = px, y = Math.round(py - m.alto!); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k; ctx.fillStyle = m.c;
      ctx.fillRect(x - l, y, l * 2 + 1, 1); ctx.fillRect(x, y - l, 1, l * 2 + 1); const d = Math.round(l * 0.5); ctx.fillRect(x - d, y - d, 1, 1); ctx.fillRect(x + d, y - d, 1, 1); ctx.fillRect(x - d, y + d, 1, 1); ctx.fillRect(x + d, y + d, 1, 1);
      ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y - 1, 3, 3); break; }
    case 'grieta': {
      const abre = Math.min(1, m.t / 0.1), a = Math.min(1, (1 - u) * 2.2);
      ctx.globalAlpha = a * 0.85; ctx.fillStyle = '#100a06'; ctx.beginPath(); for (const [i, ra] of m.ramas!.entries()) trazo(ctx, ra.map(([x, y]) => [px + x, py + y] as P), i < 8 ? 2 : 1, 1, 0, abre); ctx.fill();
      ctx.globalAlpha = a * 0.35; ctx.fillStyle = '#d8c8a8'; ctx.beginPath(); for (const ra of m.ramas!.slice(0, 8)) trazo(ctx, ra.map(([x, y]) => [px + x, py + y + 2] as P), 1, 2, 0, abre); ctx.fill();
      // lo que brilla adentro mientras está fresca (lava, sangre, rayo)
      if (m.c2 && u < 0.6) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - u / 0.6) * 0.9; ctx.fillStyle = m.c2; ctx.beginPath(); for (const ra of m.ramas!) trazo(ctx, ra.map(([x, y]) => [px + x, py + y] as P), 1, 1, 0, abre); ctx.fill(); }
      break; }
    case 'haz': {
      const T = m.t, baja = Math.min(1, T / 0.07), vive = T < 0.07 ? 1 : Math.max(0, 1 - (T - 0.07) / (m.d - 0.07)), w = Math.max(1, Math.round(9 * m.esc * (0.35 + 0.65 * vive))), Hh = Math.round(230 * m.esc), top = py - Hh, bot = Math.round(top + Hh * baja);
      ctx.globalCompositeOperation = 'lighter'; const n = nochePfx(), kk = 0.55 + 0.45 * n;
      ctx.globalAlpha = 0.22 * vive * kk; ctx.fillStyle = m.c; ctx.fillRect(px - w, top, w * 2 + 1, bot - top);
      ctx.globalAlpha = 0.5 * vive * kk; ctx.fillRect(px - (w >> 1), top, (w >> 1) * 2 + 1, bot - top);
      // (de día el alma blanca del haz va a dos tercios: ocho haces juntos quemaban a blanco el centro de la definitiva)
      ctx.globalAlpha = vive * (0.6 + 0.4 * n); ctx.fillStyle = '#ffffff'; ctx.fillRect(px - (w > 4 ? 1 : 0), top, w > 4 ? 3 : 1, bot - top);
      // motas que suben por el haz
      const r = azar(m.sem + Math.floor(T * 20)); ctx.fillStyle = '#fff4c0'; for (let i = 0; i < 6; i++) ctx.fillRect(px + Math.round((r() - 0.5) * w * 2), Math.round(bot - r() * Hh * 0.7), 1, 1);
      if (baja >= 1) { const rr = Math.round((6 + 16 * (1 - vive)) * m.esc); ctx.globalAlpha = vive * 0.9; ctx.fillStyle = m.c; ctx.beginPath(); for (let i = 0; i < 40; i++) { const an = (i / 40) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * rr), Math.round(py + Math.sin(an) * rr * 0.5), 1, 1); } ctx.fill();
        ctx.globalAlpha = vive * 0.7 * kk; const hr = halo('rgba(255,236,170,0.9)', 'rgba(255,190,60,0.25)'), q = 18 * m.esc; ctx.drawImage(hr, px - q, py - q * 0.6, q * 2, q * 1.2); }
      break; }
    case 'runas': {
      const a = Math.min(1, m.t / 0.15) * Math.min(1, (1 - u) * 3), R1 = m.r! * 22.6, gir = m.t * 0.9; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * 0.85; ctx.fillStyle = m.c;
      ctx.beginPath(); for (let i = 0; i < 72; i++) { const an = (i / 72) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * R1), Math.round(py + Math.sin(an) * R1 * 0.5), 1, 1); if (i % 2 === 0) ctx.rect(Math.round(px + Math.cos(an) * R1 * 0.82), Math.round(py + Math.sin(an) * R1 * 0.41), 1, 1); } ctx.fill();
      ctx.beginPath(); for (let g = 0; g < 8; g++) { const an = gir + (g / 8) * 6.283, gx = Math.round(px + Math.cos(an) * R1 * 0.91) - 1, gy = Math.round(py + Math.sin(an) * R1 * 0.455) - 2, gl = GLIFOS[(g + (m.sem & 7)) % 8];
        for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 3; xx++) if (gl[yy] & (4 >> xx)) ctx.rect(gx + xx, gy + yy, 1, 1); } ctx.fill();
      break; }
    case 'ola': {
      // la ola de sangre: una cresta que corre por el piso, cuerpo oscuro, labio claro y espuma
      const v = 1 - (1 - u) ** 2.4, R1 = m.r! * 22.6 * v, a = Math.min(1, (1 - u) * 1.8), N = Math.max(24, Math.round(R1 * 2.6)), r = azar(m.sem);
      // el lomo de la ola: una banda oscura que arrastra detrás de la cresta
      ctx.globalAlpha = a * 0.55; ctx.fillStyle = '#5a0408'; ctx.beginPath();
      for (let i = 0; i < N; i += 2) { const an = (i / N) * 6.283, s = Math.sin(an); if ((mitad < 0 && s > 0) || (mitad > 0 && s <= 0)) continue; for (let k = 1; k <= 3; k++) { const rr = R1 * (1 - k * 0.05); ctx.rect(Math.round(px + Math.cos(an) * rr), Math.round(py + s * rr * 0.5), 2, 1); } }
      ctx.fill(); ctx.globalAlpha = a;
      for (let i = 0; i < N; i++) { const an = (i / N) * 6.283 + r() * 0.05, s = Math.sin(an); if ((mitad < 0 && s > 0) || (mitad > 0 && s <= 0)) continue;
        const x = Math.round(px + Math.cos(an) * R1), y = Math.round(py + s * R1 * 0.5), h = Math.round((4 + r() * 7 + Math.sin(an * 5 + m.t * 20) * 2) * (1 - u * 0.7));
        if (h <= 0) continue; ctx.fillStyle = '#4a0406'; ctx.fillRect(x, y - h + 1, 2, h); ctx.fillStyle = '#b01010'; ctx.fillRect(x, y - h, 2, Math.max(1, h >> 1)); ctx.fillStyle = r() < 0.3 ? '#ff6a5a' : '#e02020'; ctx.fillRect(x, y - h - 1, r() < 0.5 ? 2 : 1, 1); }
      break; }
    case 'remolino': {
      const R1 = m.r! * 22.6 * (0.5 + 0.5 * Math.min(1, m.t / 0.3)), a = Math.min(1, m.t / 0.1) * (1 - u); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c; ctx.globalAlpha = a * 0.8; ctx.beginPath();
      for (let b = 0; b < 4; b++) { const an0 = m.t * 7 + (b / 4) * 6.283, rr = R1 * (0.55 + 0.15 * b), zz = 8 + b * 12; for (let i = 0; i < 26; i++) { const an = an0 + i * 0.05, s = Math.sin(an); if ((mitad < 0 && s > 0) || (mitad > 0 && s <= 0)) continue; ctx.rect(Math.round(px + Math.cos(an) * rr), Math.round(py + s * rr * 0.5 - zz), i > 18 ? 1 : 2, 1); } }
      ctx.fill(); break; }
    case 'pua': {
      // púa que brota del piso (hueso, hielo, espina o sangre): sube de golpe, queda y se hunde
      const [c0, c1, c2] = PAL_PUA[m.pal!] ?? PAL_PUA.hueso, sube = Math.min(1, m.t / 0.08), baja = Math.max(0, (m.t - (m.d - 0.25)) / 0.25), h = Math.round(m.alto! * sube * (1 - baja) * (0.9 + 0.1 * Math.sin(m.t * 30) * (1 - sube))), b = Math.max(2, Math.round(m.alto! / (m.pal === 'espina' ? 6 : 4.2)));
      if (h < 1) break; ctx.globalAlpha = 1;
      for (let y = 0; y < h; y++) { const f = y / h, w = Math.max(1, Math.round(b * (1 - f))), lx = Math.round(px + m.lean! * y - w / 2), yy = py - y;
        ctx.fillStyle = c0; ctx.fillRect(lx, yy, w, 1); ctx.fillStyle = c1; ctx.fillRect(lx, yy, Math.max(1, w >> 1), 1);
        if (m.pal === 'espina' && y % 4 === 2 && y < h - 2) { ctx.fillStyle = c2; ctx.fillRect(lx + (y % 8 === 2 ? -1 : w), yy - 1, 1, 1); } }
      ctx.fillStyle = c2; ctx.fillRect(Math.round(px + m.lean! * (h - 1)), py - h, 1, 1);
      // la tierra que se abre en la base
      ctx.fillStyle = '#1a120a'; ctx.globalAlpha = 0.7 * (1 - baja); ctx.fillRect(px - b, py, b * 2 + 1, 1); ctx.fillRect(px - b + 1, py + 1, b * 2 - 1, 1);
      break; }
    case 'fuente': { const a = Math.min(1, (m.d - m.t) * 4); ctx.globalAlpha = a; ctx.fillStyle = '#5a0606'; disco(ctx, px, py, 5, 0.5, 0.25, m.sem % 97, m.t); ctx.fillStyle = '#c01414'; disco(ctx, px, py - 1, 3, 0.5, 0.3, m.sem % 97, m.t); break; }
  }
  ctx.restore();
}

const hexRgb = (c: string): [number, number, number] => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
/** Las recetas sueltas de la materia, para los otros módulos de poderes (render/presencias.ts). */
export const M = {
  grieta, puas, polvo, hojas, astillas, burbujas, brasas, estrella, haz, puf, halo,
  sangre: (x: number, y: number, z: number, ux: number, uy: number, n: number, tr: number, f = 1) => sangre(x, y, z, ux, uy, n, tr, f),
  remolino: (x: number, y: number, d: number, c: string, r: number) => mk({ k: 'remolino', x, y, d, c, r }),
  fuente: (x: number, y: number, d: number, retraso = 0) => mk({ k: 'fuente', x, y, d: d + retraso, t: -retraso, c: '#c01414' }),
  mancha: (j: Juego, m: Parameters<typeof ponerMancha>[1]) => ponerMancha(j, m),
};
