// La portada de pixel: la noche en que cae la segunda brasa sobre Santa Oria (canon: el cielo se raja y la brasa cae en
// el claustro). La escena se arma en un lienzo chico (un punto por punto de la escena, unos 640 x 360 a la vista) y se
// pega agrandada por enteros, sin suavizar, como el título de fuego: la misma grilla para todo.
// Las capas las hornea juego/hornear/portada_pixel/pixel.py (una sola paleta y trama Bayer). Acá va lo que se mueve:
// estrellas que titilan, la grieta que late como la Marca, nubes y niebla que derivan, fuegos de la ciudad, vitrales que
// laten, cuervos, el caminante con la capa al viento, ceniza, brasas y, cada tanto, la brasa que cae del cielo.
// `__portadaVieja` vuelve a la portada de antes. `__brasaYa` hace caer la brasa ahora (pruebas).
import { ctx, E, W, H } from '../nucleo/lienzo';
import { BASE } from '../motor/assets';
import { acc } from '../nucleo/accesible';
import { Sonido } from '../audio/sonido';

const RAIZ = BASE + 'portada/pixel/';
let esc: any = null, pidio = false;
const imgs = new Map<string, HTMLImageElement>();
const pedir = (a: string) => { let im = imgs.get(a); if (im) return im; im = new Image(); im.decoding = 'async'; im.src = RAIZ + a; imgs.set(a, im); im.decode?.().catch(() => { /* nada */ }); return im; };
const lista = (a: string) => { const im = pedir(a); return im.complete && im.naturalWidth ? im : null; };

export function prepararPixel() {
  if (pidio) return; pidio = true;
  fetch(RAIZ + 'escena.json').then((r) => r.json()).then((m) => { esc = m; for (const c of m.capas) pedir(c.archivo); pedir('caminante.png'); pedir('cuervos.png'); })
    .catch(() => { pidio = false; });
}
export const pixelLista = () => !!esc && esc.capas.every((c: any) => !!lista(c.archivo)) && !!lista('caminante.png');
export const portadaPixel = () => !(window as any).__portadaVieja;

// ------------------------------------------------------------------ la paleta de lo que se pinta en vivo
const FUEGO = ['#220d0a', '#3a140c', '#581e0d', '#802b0f', '#aa4212', '#ce641c', '#ec902e', '#fbc05e', '#ffeaa8'];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const fr = (x: number) => x - Math.floor(x);
const hsh = (n: number) => fr(Math.sin(n * 127.1 + 311.7) * 43758.5453);

let lz: HTMLCanvasElement | null = null, g: CanvasRenderingContext2D | null = null;
/** Un sprite de luz redonda hecho a trama (sin degradé liso): se suma. Uno por color y radio, una sola vez. */
const luces = new Map<string, HTMLCanvasElement>();
function luzTrama(r: number, rgb: [number, number, number], k = 1.6): HTMLCanvasElement {
  const key = r + ':' + rgb.join(',') + ':' + k; let c = luces.get(key); if (c) return c;
  const n = r * 2 + 1; c = document.createElement('canvas'); c.width = c.height = n; const q = c.getContext('2d')!, im = q.createImageData(n, n);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const d = Math.hypot(x - r, y - r) / r; if (d >= 1) continue;
    const v = Math.pow(1 - d, k), lv = Math.min(3, Math.floor(v * 3 + BAYER[(y % 4) * 4 + (x % 4)]));
    if (lv <= 0) continue; const i = (y * n + x) * 4, a = [0, 0.33, 0.62, 1][lv];
    im.data[i] = rgb[0]; im.data[i + 1] = rgb[1]; im.data[i + 2] = rgb[2]; im.data[i + 3] = 255 * a;
  }
  q.putImageData(im, 0, 0); luces.set(key, c); return c;
}
/** La viñeta a trama, del tamaño del lienzo (se rehace si cambia). */
let vin: HTMLCanvasElement | null = null;
function vineta(w: number, h: number) {
  if (vin && vin.width === w && vin.height === h) return vin;
  vin = document.createElement('canvas'); vin.width = w; vin.height = h; const q = vin.getContext('2d')!, im = q.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.45) * 2, d = Math.max(0, Math.hypot(dx * 0.85, dy) - 0.62) / 0.6;
    const arriba = Math.max(0, 0.16 - y / h) / 0.16 * 0.5;
    const v = Math.min(1, d * d + arriba), lv = Math.floor(v * 4 + BAYER[(y % 4) * 4 + (x % 4)]);
    if (lv <= 0) continue; const i = (y * w + x) * 4; im.data[i + 3] = Math.min(4, lv) / 4 * 235; im.data[i] = 3; im.data[i + 1] = 2; im.data[i + 2] = 8;
  }
  q.putImageData(im, 0, 0); return vin;
}

// ------------------------------------------------------------------ estado
interface Px { x: number; y: number; vx: number; vy: number; v: number; d: number; c: number }
const ceniza: Px[] = [], brasas: Px[] = [], chispas: Px[] = [];
let camX = 0, camY = 0, tPrev = -1;
let brasa = { t0: -1, prox: 6.2, golpe: -1 };
interface Rastro { x: number; y: number; t: number }
let rastro: Rastro[] = [];

/** Dibuja la escena entera en la pantalla. `t` en segundos desde que arranca la portada, `k` la entrada a negro (0 a 1). */
export function dibujarPixel(t: number, k: number, sacude: { dx: number; dy: number }) {
  if (!esc) return;
  const DW = ctx.canvas.width, DH = ctx.canvas.height;
  // cuántos puntos del aparato por punto de la escena: unos 360 de alto, sin pasarse del ancho de la escena
  // (a la baja: 900 de alto va a 2 y muestra más escena en vez de recortarla)
  let s = Math.max(1, Math.floor(DH / 340)); while (DW / s > esc.w || DH / s > esc.h) s++;
  const Wl = Math.ceil(DW / s), Hl = Math.min(esc.h, Math.ceil(DH / s));
  if (!lz) { lz = document.createElement('canvas'); g = lz.getContext('2d')!; }
  if (lz.width !== Wl || lz.height !== Hl) { lz.width = Wl; lz.height = Hl; }
  const q = g!; q.imageSmoothingEnabled = false; q.globalAlpha = 1; q.globalCompositeOperation = 'source-over';
  q.fillStyle = '#05050c'; q.fillRect(0, 0, Wl, Hl);
  const dt = tPrev < 0 ? 1 / 60 : Math.min(0.1, Math.max(0, t - tPrev)); tPrev = t;
  // dónde mira: en horizontal el medio de la escena, en vertical (teléfono parado) la catedral y el caminante
  const vertical = DH > DW;
  const F = esc.foco, foco = vertical ? F[2] : F[0];
  const x0 = Math.round(Math.min(esc.w - Wl, Math.max(0, foco - Wl / 2)));
  const y0 = Math.round(Math.min(esc.h - Hl, Math.max(0, F[1] - Hl / 2)));
  // la cámara: el ratón la corre un poco (suave) y respira despacio
  const mx = E.x / Math.max(1, W) - 0.5, my = E.y / Math.max(1, H) - 0.5;
  camX += ((Number.isFinite(mx) ? mx : 0) * 2 * 14 + Math.sin(t * 2 * Math.PI / 46) * 5 - camX) * Math.min(1, dt * 2.5);
  camY += ((Number.isFinite(my) ? my : 0) * 2 * 4 - camY) * Math.min(1, dt * 2.5);
  const holgX = Math.min(x0, esc.w - Wl - x0), holgY = Math.min(y0, esc.h - Hl - y0);
  // corrimiento de una capa (en puntos enteros de la escena), sin mostrar nunca su borde
  const corr = (par: number): [number, number] => [
    Math.round(-x0 - Math.max(-holgX, Math.min(holgX, camX * par))),
    Math.round(-y0 - Math.max(-holgY, Math.min(holgY, camY * par)))];
  const pega = (arch: string, par: number, x = 0, y = 0, alfa = 1, sumar = false, deriva = 0) => {
    const im = lista(arch); if (!im || alfa <= 0.003) return;
    const [ox, oy] = corr(par);
    q.globalAlpha = Math.min(1, alfa); q.globalCompositeOperation = sumar ? 'lighter' : 'source-over';
    if (deriva) {
      const w = im.naturalWidth, d = Math.round(((t * deriva) % w + w) % w);
      q.drawImage(im, ox + x + d - w, oy + y); q.drawImage(im, ox + x + d, oy + y);
    } else q.drawImage(im, ox + x, oy + y);
    q.globalAlpha = 1; q.globalCompositeOperation = 'source-over';
  };
  const P = (bx: number, by: number, par: number): [number, number] => { const [ox, oy] = corr(par); return [bx + ox, by + oy]; };
  const punto = (x: number, y: number, col: string, a = 1, w = 1, h = 1) => { q.globalAlpha = a; q.fillStyle = col; q.fillRect(Math.round(x), Math.round(y), w, h); };

  // ---- la brasa: cuándo cae y cómo late la grieta
  if ((window as any).__brasaYa) { (window as any).__brasaYa = false; brasa.prox = t; }
  if (brasa.t0 < 0 && t >= brasa.prox) { brasa.t0 = t; rastro = []; Sonido.efecto('fuego_lanzar' as any, { vol: 0.35 }); }
  const CAIDA = 1.25, B0: [number, number] = esc.brasa[0], B1: [number, number] = esc.brasa[1];
  const ub = brasa.t0 >= 0 ? (t - brasa.t0) / CAIDA : -1;
  if (ub >= 1 && brasa.golpe < 0) {
    brasa.golpe = t;
    Sonido.efecto('trueno' as any, { vol: 0.32 });
    for (let i = 0; i < 46; i++) { const a = -Math.PI * (0.1 + 0.8 * Math.random()), v = 30 + Math.random() * 90; chispas.push({ x: B1[0], y: B1[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: 0, d: 0.6 + Math.random() * 1.1, c: 1 }); }
  }
  if (brasa.golpe >= 0 && t - brasa.golpe > 3.5) { brasa = { t0: -1, prox: t + 9 + Math.random() * 7, golpe: -1 }; }
  const golpeK = brasa.golpe >= 0 ? Math.max(0, 1 - (t - brasa.golpe) / 2.6) : 0;
  // la grieta late como un corazón (lub dub cada 3,4 s) y se abre justo antes de soltar la brasa
  const fase = fr(t / 3.4), lub = Math.exp(-Math.pow((fase - 0.08) / 0.05, 2)) + 0.7 * Math.exp(-Math.pow((fase - 0.22) / 0.05, 2));
  const abre = brasa.t0 >= 0 ? Math.max(0, 1 - Math.abs(ub - 0.05) / 0.4) : (brasa.prox - t < 0.6 && brasa.prox - t > 0 ? 1 - (brasa.prox - t) / 0.6 : 0);

  // ---- el cielo, sus estrellas y la grieta
  pega('cielo.png', 0.04);
  { const [ox, oy] = corr(0.04);
    for (const [x, y, v, f, cruz] of esc.estrellas) {
      const b = 0.5 + 0.5 * Math.sin(t * v + f), xx = x + ox, yy = y + oy; if (xx < 0 || yy < 0 || xx >= Wl || yy >= Hl) continue;
      punto(xx, yy, b > 0.75 ? '#b6bcd6' : b > 0.4 ? '#7276a0' : '#45486a', 1);
      if (cruz && b > 0.7) { q.globalAlpha = (b - 0.7) / 0.3; q.fillStyle = '#5a5e86'; q.fillRect(xx - 1, yy, 1, 1); q.fillRect(xx + 1, yy, 1, 1); q.fillRect(xx, yy - 1, 1, 1); q.fillRect(xx, yy + 1, 1, 1); }
    } q.globalAlpha = 1; }
  pega('grieta_luz.png', 0.04, 0, 0, (0.35 + 0.45 * lub + 0.8 * abre + 0.4 * golpeK) * k, true);
  pega('nubes_lejos.png', 0.08, 0, 0, 1, false, -1.1);
  pega('montes.png', 0.14);
  // los fuegos de la ciudad: lenguas de dos o tres puntos que cambian
  { const [ox, oy] = corr(0.14);
    esc.fuegos.forEach(([x, y]: [number, number], i: number) => {
      const n = Math.floor(t * 9 + i * 3), alto = 1 + Math.floor(hsh(n + i * 13) * 3);
      for (let k2 = 0; k2 < alto; k2++) punto(x + ox + (hsh(n * 7 + k2) < 0.3 ? 1 : 0), y + oy - 1 - k2, FUEGO[Math.max(3, 7 - k2 * 2 - (hsh(n + k2) < 0.4 ? 1 : 0))]);
      q.globalCompositeOperation = 'lighter'; q.globalAlpha = 0.35 + 0.2 * hsh(n);
      q.drawImage(luzTrama(6, [150, 50, 16], 1.4), x + ox - 6, y + oy - 8); q.globalCompositeOperation = 'source-over'; q.globalAlpha = 1;
    }); }
  pega('nubes_cerca.png', 0.18, 0, 0, 1, false, -2.4);
  pega('niebla.png', 0.22, 0, 0, 0.7, false, 2.6);

  // ---- la catedral: colina, piedra, halo de la puerta y vitrales que laten (más con la brasa)
  const C = esc.catedral;
  pega('colina.png', 0.34);
  pega('catedral.png', 0.34, C.x, C.y);
  const lat = 0.78 + 0.12 * Math.sin(t * 2.1) + 0.1 * Math.sin(t * 5.3 + 1) * Math.sin(t * 0.7);
  pega('catedral_halo.png', 0.34, C.x, C.y, (0.75 * lat + 0.6 * golpeK) * k, true);
  pega('catedral_vidrios.png', 0.34, C.x, C.y, (0.5 * lat + 0.9 * golpeK) * k, true);
  // humo de pixel que sube de la nave hacia la derecha
  { const [ox, oy] = corr(0.34);
    for (let i = 0; i < 26; i++) {
      const u = fr(t * (0.045 + hsh(i) * 0.02) + hsh(i + 50)), x = esc.humo[0] + (hsh(i + 9) - 0.5) * 30 + u * u * 120 + Math.sin(t * 0.6 + i) * 3 * u, y = esc.humo[1] - u * 150;
      const r = 1 + Math.floor(u * 5 * (0.6 + hsh(i + 3) * 0.6)), a = Math.min(1, u * 6) * (1 - u) * 0.8;
      q.globalAlpha = a; q.fillStyle = u < 0.18 ? '#3a1810' : '#0e0c18';
      q.fillRect(Math.round(x + ox - r), Math.round(y + oy - r * 0.7), r * 2, Math.max(1, Math.round(r * 1.4)));
    } q.globalAlpha = 1; }
  // cuervos que rondan las agujas
  { const im = lista('cuervos.png');
    if (im) for (let i = 0; i < 5; i++) {
      const w = (0.12 + hsh(i) * 0.1) * (i % 2 ? 1 : -1), a = t * w + hsh(i + 4) * 6.28;
      const [x, y] = P(esc.cuervos[0] + Math.cos(a) * (40 + hsh(i + 7) * 70), esc.cuervos[1] + hsh(i + 2) * 70 + Math.sin(a) * (10 + hsh(i + 8) * 18), 0.3);
      const fl = Math.sin(t * 0.8 + i * 2) > 0.3 ? 1 : Math.floor(fr(t * (7 + i)) * 3), dir = -Math.sin(a) * Math.sign(w) >= 0;
      q.save(); q.translate(Math.round(x), Math.round(y)); if (!dir) q.scale(-1, 1); q.drawImage(im, fl * 7, 0, 7, 5, -3, -2, 7, 5); q.restore();
    } }

  // ---- la brasa que cae: cabeza de pixel blanca, anillo naranja, estela que se enfría de banda en banda
  if (brasa.t0 >= 0) {
    const [ox, oy] = corr(0.3);
    if (ub < 1) {
      const e = ub * ub * (1.4 - 0.4 * ub), x = B0[0] + (B1[0] - B0[0]) * e + Math.sin(e * 3) * 6, y = B0[1] + (B1[1] - B0[1]) * e;
      rastro.push({ x, y, t });
      q.globalCompositeOperation = 'lighter';
      q.globalAlpha = 0.9; q.drawImage(luzTrama(14, [255, 120, 40], 1.2), Math.round(x + ox) - 14, Math.round(y + oy) - 14);
      q.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 4; i++) brasas.push({ x, y, vx: (Math.random() - 0.5) * 20, vy: -10 - Math.random() * 20, v: 0, d: 0.4 + Math.random() * 0.6, c: 1 });
    }
    // la estela: del punto más viejo al de ahora, cada tramo una banda más fría
    for (let i = 1; i < rastro.length; i++) {
      const a = rastro[i - 1], b = rastro[i], edad = t - b.t; if (edad > 0.9) continue;
      const banda = Math.max(0, 8 - Math.floor(edad * 10) - (ub >= 1 ? 2 : 0)), n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      for (let j = 0; j < n; j++) { const u = j / n; punto(a.x + (b.x - a.x) * u + ox, a.y + (b.y - a.y) * u + oy, FUEGO[banda], 1); if (banda > 3) punto(a.x + (b.x - a.x) * u + ox + 1, a.y + (b.y - a.y) * u + oy, FUEGO[banda - 2], 1); if (banda > 6) punto(a.x + (b.x - a.x) * u + ox - 1, a.y + (b.y - a.y) * u + oy, FUEGO[banda - 3], 1); }
    }
    if (ub < 1) { const b = rastro[rastro.length - 1]; const x = Math.round(b.x + ox), y = Math.round(b.y + oy);
      q.globalAlpha = 1; q.fillStyle = FUEGO[5]; q.fillRect(x - 3, y - 1, 7, 3); q.fillRect(x - 1, y - 3, 3, 7); q.fillStyle = FUEGO[7]; q.fillRect(x - 2, y - 1, 5, 3); q.fillRect(x - 1, y - 2, 3, 5); q.fillStyle = FUEGO[8]; q.fillRect(x - 1, y - 1, 3, 3); }
    // el golpe: fogonazo a trama sobre la catedral y un anillo que se abre
    if (brasa.golpe >= 0) {
      const u = (t - brasa.golpe), [gx, gy] = [B1[0] + ox, B1[1] + oy];
      q.globalCompositeOperation = 'lighter';
      q.globalAlpha = Math.max(0, 1 - u / 1.6) * acc.destellos; q.drawImage(luzTrama(60, [255, 110, 36], 1.8), gx - 60, gy - 60);
      q.globalAlpha = Math.max(0, 1 - u / 0.35) * acc.destellos; q.drawImage(luzTrama(26, [255, 230, 170], 1.2), gx - 26, gy - 26);
      q.globalCompositeOperation = 'source-over';
      if (u < 0.7) { const r = 4 + u * 70, nn = Math.ceil(r * 6); for (let i = 0; i < nn; i++) { const a = i / nn * Math.PI * 2; if (Math.sin(a) > 0.3) continue; punto(gx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.45, FUEGO[Math.max(3, 8 - Math.floor(u * 9))], 1 - u / 0.7); } }
    }
  }
  // lo que queda ardiendo en el techo de la nave después del golpe (se apaga solo)
  if (brasa.golpe >= 0) {
    const u = t - brasa.golpe, vida = Math.min(1, u / 0.4) * Math.max(0, 1 - Math.max(0, u - 2.4) / 1.1);
    if (vida > 0) {
      const [ox, oy] = corr(0.34), bx = B1[0] + ox, by = B1[1] + oy + 2;
      q.globalCompositeOperation = 'lighter'; q.globalAlpha = 0.55 * vida; q.drawImage(luzTrama(16, [200, 70, 20], 1.3), bx - 16, by - 18); q.globalCompositeOperation = 'source-over';
      for (let c = -5; c <= 5; c++) {
        const n = Math.floor(t * 11 + c * 5), alto = Math.max(0, Math.round((7 - Math.abs(c) * 1.1) * vida * (0.6 + 0.6 * hsh(n + c * 31))));
        for (let k2 = 0; k2 < alto; k2++) punto(bx + c + (hsh(n * 3 + k2) < 0.25 ? (c > 0 ? 1 : -1) : 0), by - k2, FUEGO[Math.max(2, 8 - Math.floor(k2 / Math.max(1, alto) * 6) - (Math.abs(c) > 3 ? 2 : 0))], 1);
      }
      if (Math.random() < dt * 14 * vida) brasas.push({ x: B1[0] + (Math.random() - 0.5) * 8, y: B1[1] - 4, vx: 6 + Math.random() * 10, vy: -16 - Math.random() * 14, v: 0, d: 1 + Math.random() * 1.5, c: 0 });
    }
  }
  pega('niebla.png', 0.5, 0, 34, 1, false, 5.5);

  // ---- el caminante y el primer plano
  { const cm = esc.caminante, im = lista('caminante.png');
    if (im) { const [x, y] = P(cm.x, cm.y, 1), f = Math.floor(t * 7) % cm.n; q.drawImage(im, f * cm.w, 0, cm.w, cm.h, x, y, cm.w, cm.h); } }
  pega('frente.png', 1);

  // ---- ceniza que cae con el viento y brasas que suben de la catedral
  while (ceniza.length < 90) ceniza.push({ x: Math.random() * esc.w, y: Math.random() * esc.h, vx: 4 + Math.random() * 8, vy: 5 + Math.random() * 9, v: Math.random() * 6, d: 0, c: Math.random() < 0.25 ? 1 : 0 });
  for (const p of ceniza) {
    p.x += (p.vx + Math.sin(t * 0.9 + p.v) * 4) * dt; p.y += p.vy * dt;
    if (p.y > esc.h || p.x > esc.w) { p.x = Math.random() * esc.w - 40; p.y = -4; }
    const [x, y] = P(p.x, p.y, 0.6 + p.c * 0.5); punto(x, y, p.c ? '#8e8a96' : '#55526a', 0.85);
  }
  if (Math.random() < dt * 10) brasas.push({ x: C.puerta[0] + (Math.random() - 0.5) * 40, y: C.puerta[1] - Math.random() * 30, vx: (Math.random() - 0.3) * 10, vy: -12 - Math.random() * 16, v: Math.random() * 6, d: 2 + Math.random() * 2.5, c: 0 });
  for (const lista2 of [brasas, chispas]) for (let i = lista2.length - 1; i >= 0; i--) {
    const p = lista2[i]; p.v += dt; if (p.v >= p.d) { lista2[i] = lista2[lista2.length - 1]; lista2.pop(); continue; }
    if (lista2 === chispas) p.vy += 120 * dt; else p.vx += Math.sin(t * 2 + i) * 6 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const [x, y] = P(p.x, p.y, 0.34), u = p.v / p.d; punto(x, y, FUEGO[Math.max(2, 8 - Math.floor(u * 7))], 1);
  }
  // la viñeta a trama, y la entrada desde el negro
  q.globalAlpha = 1; q.drawImage(vineta(Wl, Hl), 0, 0);
  // ---- al aparato: puntos enteros, sin suavizar
  // (el temblor del golpe del título viene en puntos lógicos de la pantalla: se pasa a puntos del aparato)
  const ka = Math.abs(ctx.getTransform().a) || 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH);
  const ox = Math.floor((DW - Wl * s) / 2) + Math.round(sacude.dx * ka), oy = Math.floor((DH - Hl * s) / 2) + Math.round(sacude.dy * ka);
  ctx.globalAlpha = Math.min(1, Math.max(0, k)); ctx.drawImage(lz, 0, 0, Wl, Hl, ox, oy, Wl * s, Hl * s);
  ctx.restore();
  (window as any).__portadaPixel = { s, Wl, Hl, x0, y0, brasa: brasa.t0 >= 0 };
}
(window as any).__brasaYa = false;
