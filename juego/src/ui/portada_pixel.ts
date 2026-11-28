// La portada de pixel fino: Santa Oria abandonada bajo un cielo de gas, el árbol de la horca con sus ahorcados, las urracas,
// el camposanto y, cada tanto, la brasa que cae de la grieta casi cerrada del cielo (canon: la segunda brasa cae en el
// claustro). La escena se arma en un lienzo chico (un punto por punto de la escena, unos 960 x 540 a la vista: 2 x 2 en
// 1080) y se pega agrandada por enteros, sin suavizar, como el título de fuego.
// Las capas las hornea juego/hornear/portada_pixel/pixel.py (paleta de abandono y trama Bayer). Acá va lo que se mueve: el
// gas que deriva a distintas velocidades, los rayos que respiran, la grieta que late débil, los vitrales, el humo, los
// ahorcados que se mecen, las urracas (posadas: sacuden la cola y picotean; una bandada que cruza), el caminante, la ceniza.
// `__portadaVieja` vuelve a la portada de antes. `__brasaYa` hace caer la brasa ahora, `__bandadaYa` la bandada (pruebas).
import { ctx, E, W, H } from '../nucleo/lienzo';
import { BASE } from '../motor/assets';
import { acc } from '../nucleo/accesible';
import { Sonido } from '../audio/sonido';

const RAIZ = BASE + 'portada/pixel/';
let esc: any = null, pidio = false;
const imgs = new Map<string, HTMLImageElement>();
const pedir = (a: string) => { let im = imgs.get(a); if (im) return im; im = new Image(); im.decoding = 'async'; im.src = RAIZ + a; imgs.set(a, im); im.decode?.().catch(() => { /* nada */ }); return im; };
const lista = (a: string) => { const im = pedir(a); return im.complete && im.naturalWidth ? im : null; };
const archivos = (m: any): string[] => [...m.capas.map((c: any) => c.archivo), ...(m.colgados ?? []).map((c: any) => c.archivo), 'caminante.png', 'urraca.png', 'urraca_vuelo.png'];

export function prepararPixel() {
  if (pidio) return; pidio = true;
  fetch(RAIZ + 'escena.json').then((r) => r.json()).then((m) => { esc = m; for (const a of archivos(m)) pedir(a); })
    .catch(() => { pidio = false; });
}
export const pixelLista = () => !!esc && archivos(esc).every((a) => !!lista(a));
export const portadaPixel = () => !(window as any).__portadaVieja;

// ------------------------------------------------------------------ la paleta de lo que se pinta en vivo
const FUEGO = ['#3a1a0a', '#5e2a0e', '#884414', '#b66a20', '#de9a3e', '#f6cc76', '#ffeebc'];
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
/** La viñeta a trama, del tamaño del lienzo (se rehace si cambia): las esquinas y arriba más oscuros (el título se lee). */
let vin: HTMLCanvasElement | null = null;
function vineta(w: number, h: number) {
  if (vin && vin.width === w && vin.height === h) return vin;
  vin = document.createElement('canvas'); vin.width = w; vin.height = h; const q = vin.getContext('2d')!, im = q.createImageData(w, h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const dx = (x / w - 0.5) * 2, dy = (y / h - 0.45) * 2, d = Math.max(0, Math.hypot(dx * 0.82, dy) - 0.66) / 0.55;
    const abajo = Math.max(0, y / h - 0.86) / 0.14 * 0.45;
    const v = Math.min(1, d * d + abajo), lv = Math.floor(v * 4 + BAYER[(y % 4) * 4 + (x % 4)]);
    if (lv <= 0) continue; const i = (y * w + x) * 4; im.data[i + 3] = Math.min(4, lv) / 4 * 230; im.data[i] = 4; im.data[i + 1] = 4; im.data[i + 2] = 5;
  }
  q.putImageData(im, 0, 0); return vin;
}

// ------------------------------------------------------------------ estado
interface Px { x: number; y: number; vx: number; vy: number; v: number; d: number; c: number }
const ceniza: Px[] = [], brasas: Px[] = [], chispas: Px[] = [];
let camX = 0, camY = 0, tPrev = -1;
let brasa = { t0: -1, prox: 7.5, golpe: -1 };
let bandada = { t0: -1, prox: 3.5, y: 0, n: 5, dir: -1 };
interface Rastro { x: number; y: number; t: number }
let rastro: Rastro[] = [];

/** Dibuja la escena entera en la pantalla. `t` en segundos desde que arranca la portada, `k` la entrada desde negro. */
export function dibujarPixel(t: number, k: number, sacude: { dx: number; dy: number }) {
  if (!esc) return;
  const DW = ctx.canvas.width, DH = ctx.canvas.height;
  // cuántos puntos del aparato por punto de la escena: unos 540 de alto (2 en 1080, 1 en 720 y en el teléfono)
  let s = Math.max(1, Math.floor(DH / 500)); while (DW / s > esc.w || DH / s > esc.h) s++;
  const Wl = Math.ceil(DW / s), Hl = Math.min(esc.h, Math.ceil(DH / s));
  if (!lz) { lz = document.createElement('canvas'); g = lz.getContext('2d')!; }
  if (lz.width !== Wl || lz.height !== Hl) { lz.width = Wl; lz.height = Hl; }
  const q = g!; q.imageSmoothingEnabled = false; q.globalAlpha = 1; q.globalCompositeOperation = 'source-over';
  q.fillStyle = '#08090a'; q.fillRect(0, 0, Wl, Hl);
  const dt = tPrev < 0 ? 1 / 60 : Math.min(0.1, Math.max(0, t - tPrev)); tPrev = t;
  // dónde mira: en horizontal el medio de la vista de diseño, en vertical (teléfono parado) la catedral
  const vertical = DH > DW, F = esc.foco;
  const x0 = Math.round(Math.min(esc.w - Wl, Math.max(0, (vertical ? F[2] : F[0]) - Wl / 2)));
  const y0 = Math.round(Math.min(esc.h - Hl, Math.max(0, F[1] - Hl / 2)));
  // la cámara: el ratón la corre un poco (suave) y respira despacio
  const mx = E.x / Math.max(1, W) - 0.5, my = E.y / Math.max(1, H) - 0.5;
  camX += ((Number.isFinite(mx) ? mx : 0) * 2 * 16 + Math.sin(t * 2 * Math.PI / 52) * 6 - camX) * Math.min(1, dt * 2.2);
  camY += ((Number.isFinite(my) ? my : 0) * 2 * 5 - camY) * Math.min(1, dt * 2.2);
  const holgX = Math.min(x0, esc.w - Wl - x0), holgY = Math.min(y0, esc.h - Hl - y0);
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
  const w = window as any;

  // ---- la brasa: cuándo cae, y cómo late la grieta (débil: casi cerrada)
  if (w.__brasaYa) { w.__brasaYa = false; brasa = { t0: -1, prox: t, golpe: -1 }; }
  if (brasa.t0 < 0 && t >= brasa.prox) { brasa.t0 = t; rastro = []; Sonido.efecto('fuego_lanzar' as any, { vol: 0.3 }); }
  const CAIDA = 1.5, B0: [number, number] = esc.brasa[0], B1: [number, number] = esc.brasa[1];
  const ub = brasa.t0 >= 0 ? (t - brasa.t0) / CAIDA : -1;
  if (ub >= 1 && brasa.golpe < 0) {
    brasa.golpe = t;
    Sonido.efecto('trueno' as any, { vol: 0.3 });
    for (let i = 0; i < 40; i++) { const a = -Math.PI * (0.1 + 0.8 * Math.random()), v = 30 + Math.random() * 100; chispas.push({ x: B1[0], y: B1[1], vx: Math.cos(a) * v, vy: Math.sin(a) * v, v: 0, d: 0.6 + Math.random() * 1.1, c: 1 }); }
  }
  if (brasa.golpe >= 0 && t - brasa.golpe > 4) brasa = { t0: -1, prox: t + 12 + Math.random() * 10, golpe: -1 };
  const golpeK = brasa.golpe >= 0 ? Math.max(0, 1 - (t - brasa.golpe) / 2.6) : 0;
  const fase = fr(t / 3.6), lub = Math.exp(-Math.pow((fase - 0.08) / 0.05, 2)) + 0.7 * Math.exp(-Math.pow((fase - 0.22) / 0.05, 2));
  const abre = brasa.t0 >= 0 ? Math.max(0, 1 - Math.abs(ub - 0.05) / 0.4) : (brasa.prox - t < 0.7 && brasa.prox - t > 0 ? 1 - (brasa.prox - t) / 0.7 : 0);

  const C = esc.catedral;
  for (const c of esc.capas) {
    const id = c.id ?? '';
    // antes del primer plano: el caminante (los pies se hunden en el pasto)
    if (id === 'frente') {
      const cm = esc.caminante, im = lista('caminante.png');
      if (im) { const [x, y] = P(cm.x, cm.y, 1), f = Math.floor(t * 7) % cm.n; q.drawImage(im, f * cm.w, 0, cm.w, cm.h, x, y, cm.w, cm.h); }
    }
    let alfa = 1;
    if (id === 'grieta') alfa = (0.22 + 0.3 * lub + 0.9 * abre + 0.3 * golpeK) * k;
    if (id === 'rayos') alfa = (0.55 + 0.25 * Math.sin(t * 0.37) + 0.15 * Math.sin(t * 0.91 + 2)) * k;
    const lat = 0.75 + 0.12 * Math.sin(t * 2.1) + 0.1 * Math.sin(t * 5.3 + 1) * Math.sin(t * 0.7);
    if (id === 'halo') alfa = (0.5 * lat + 0.6 * golpeK) * k;
    if (id === 'vidrios') alfa = (0.45 * lat + 0.9 * golpeK) * k;
    pega(c.archivo, c.par, c.x ?? 0, c.y ?? 0, alfa, !!c.sumar, c.deriva ?? 0);
    // con la catedral: humo que sube de la nave y la brasa que cae
    if (id === 'vidrios') {
      const [ox, oy] = corr(0.3);
      for (let i = 0; i < 30; i++) {
        const u = fr(t * (0.035 + hsh(i) * 0.02) + hsh(i + 50)), x = esc.humo[0] + (hsh(i + 9) - 0.5) * 40 + u * u * 170 + Math.sin(t * 0.6 + i) * 4 * u, y = esc.humo[1] - u * 220;
        const r = 1 + Math.floor(u * 8 * (0.6 + hsh(i + 3) * 0.6)), a = Math.min(1, u * 6) * (1 - u) * 0.7;
        q.globalAlpha = a; q.fillStyle = u < 0.15 ? '#2e1a10' : '#141414';
        q.fillRect(Math.round(x + ox - r), Math.round(y + oy - r * 0.7), r * 2, Math.max(1, Math.round(r * 1.4)));
      } q.globalAlpha = 1;
      if (brasa.t0 >= 0) caeBrasa();
    }
  }

  // ---- los ahorcados: cada uno se mece a su ritmo
  for (const c of esc.colgados ?? []) {
    const im = lista(c.archivo); if (!im) continue;
    const f = Math.floor(fr(t / c.periodo + c.fase) * c.n) % c.n, [x, y] = P(c.x, c.y, 1);
    q.drawImage(im, f * c.w, 0, c.w, c.h, x, y, c.w, c.h);
  }
  // ---- las urracas posadas: casi quietas, a ratos sacuden la cola o picotean
  { const im = lista('urraca.png');
    if (im) esc.perchas.forEach(([x, y, d]: [number, number, number], i: number) => {
      const ciclo = Math.floor(t / 2.3 + hsh(i) * 7), elige = hsh(ciclo * 13 + i * 7), dentro = fr(t / 2.3 + hsh(i) * 7);
      const f = dentro < 0.18 ? (elige < 0.35 ? 1 : elige < 0.6 ? 2 : 0) : 0;
      const [px, py] = P(x - 9, y, 1);
      q.save(); q.translate(Math.round(px) + 9, Math.round(py)); if (d < 0) q.scale(-1, 1); q.drawImage(im, f * 18, 0, 18, 12, -9, 0, 18, 12); q.restore();
    }); }
  // ---- la bandada que cruza el cielo cada tanto
  if (w.__bandadaYa) { w.__bandadaYa = false; bandada.prox = t; }
  if (bandada.t0 < 0 && t >= bandada.prox) bandada = { t0: t, prox: 0, y: esc.foco[1] - 200 + Math.random() * 90, n: 4 + Math.floor(Math.random() * 4), dir: Math.random() < 0.5 ? -1 : 1 };
  if (bandada.t0 >= 0) {
    const im = lista('urraca_vuelo.png'), u = (t - bandada.t0) / 11;
    if (u > 1) bandada = { ...bandada, t0: -1, prox: t + 14 + Math.random() * 12 };
    else if (im) for (let i = 0; i < bandada.n; i++) {
      const xx = bandada.dir < 0 ? esc.foco[0] + 560 - (u * 1200) + i * 26 + hsh(i) * 20 : esc.foco[0] - 560 + u * 1200 - i * 26 - hsh(i) * 20;
      const yy = bandada.y + Math.sin(u * 9 + i * 1.3) * 6 + i * 7 - (i % 2) * 12;
      const [px, py] = P(xx, yy, 0.55), f = Math.floor(t * 9 + i * 1.7) % 4;
      q.save(); q.translate(Math.round(px), Math.round(py)); if (bandada.dir > 0) q.scale(-1, 1); q.drawImage(im, f * 20, 0, 20, 7, -10, -3, 20, 7); q.restore();
    }
  }

  // ---- ceniza que cae con el viento, brasas de la puerta y chispas del golpe
  while (ceniza.length < 130) ceniza.push({ x: Math.random() * esc.w, y: Math.random() * esc.h, vx: 6 + Math.random() * 10, vy: 6 + Math.random() * 12, v: Math.random() * 6, d: 0, c: Math.random() < 0.3 ? 1 : 0 });
  for (const p of ceniza) {
    p.x += (p.vx + Math.sin(t * 0.9 + p.v) * 5) * dt; p.y += p.vy * dt;
    if (p.y > esc.h || p.x > esc.w) { p.x = Math.random() * esc.w - 60; p.y = -4; }
    const [x, y] = P(p.x, p.y, 0.6 + p.c * 0.6); punto(x, y, p.c ? '#7e7a6c' : '#4a4840', 0.85);
  }
  if (Math.random() < dt * 4) brasas.push({ x: C.puerta[0] + (Math.random() - 0.5) * 50, y: C.puerta[1] - Math.random() * 40, vx: (Math.random() - 0.3) * 12, vy: -14 - Math.random() * 18, v: Math.random() * 6, d: 2 + Math.random() * 2.5, c: 0 });
  for (const l of [brasas, chispas]) for (let i = l.length - 1; i >= 0; i--) {
    const p = l[i]; p.v += dt; if (p.v >= p.d) { l[i] = l[l.length - 1]; l.pop(); continue; }
    if (l === chispas) p.vy += 130 * dt; else p.vx += Math.sin(t * 2 + i) * 6 * dt;
    p.x += p.vx * dt; p.y += p.vy * dt;
    const [x, y] = P(p.x, p.y, 0.3), u = p.v / p.d; punto(x, y, FUEGO[Math.max(1, 6 - Math.floor(u * 6))], 1);
  }
  q.globalAlpha = 1; q.drawImage(vineta(Wl, Hl), 0, 0);

  // ---- al aparato: puntos enteros, sin suavizar
  const ka = Math.abs(ctx.getTransform().a) || 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH);
  const ox = Math.floor((DW - Wl * s) / 2) + Math.round(sacude.dx * ka), oy = Math.floor((DH - Hl * s) / 2) + Math.round(sacude.dy * ka);
  ctx.globalAlpha = Math.min(1, Math.max(0, k)); ctx.drawImage(lz, 0, 0, Wl, Hl, ox, oy, Wl * s, Hl * s);
  ctx.restore();
  w.__portadaPixel = { s, Wl, Hl, x0, y0, brasa: brasa.t0 >= 0, bandada: bandada.t0 >= 0 };

  // la brasa: cabeza blanca, anillo, estela que se enfría; el golpe en la nave y lo que queda ardiendo
  function caeBrasa() {
    const [ox, oy] = corr(0.3);
    if (ub < 1) {
      const e = ub * ub * (1.4 - 0.4 * ub), x = B0[0] + (B1[0] - B0[0]) * e + Math.sin(e * 3) * 8, y = B0[1] + (B1[1] - B0[1]) * e;
      rastro.push({ x, y, t });
      q.globalCompositeOperation = 'lighter'; q.globalAlpha = 0.85; q.drawImage(luzTrama(18, [230, 110, 40], 1.2), Math.round(x + ox) - 18, Math.round(y + oy) - 18);
      q.globalCompositeOperation = 'source-over';
      for (let i = 0; i < 3; i++) brasas.push({ x, y, vx: (Math.random() - 0.5) * 24, vy: -10 - Math.random() * 24, v: 0, d: 0.4 + Math.random() * 0.7, c: 1 });
    }
    for (let i = 1; i < rastro.length; i++) {
      const a = rastro[i - 1], b = rastro[i], edad = t - b.t; if (edad > 1) continue;
      const banda = Math.max(0, 6 - Math.floor(edad * 8) - (ub >= 1 ? 2 : 0)), n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y)));
      for (let j = 0; j < n; j++) { const u = j / n, px = a.x + (b.x - a.x) * u + ox, py = a.y + (b.y - a.y) * u + oy; punto(px, py, FUEGO[banda], 1); if (banda > 2) punto(px + 1, py, FUEGO[banda - 2], 1); if (banda > 4) punto(px - 1, py, FUEGO[banda - 3], 1); }
    }
    if (ub < 1 && rastro.length) {
      const b = rastro[rastro.length - 1], x = Math.round(b.x + ox), y = Math.round(b.y + oy);
      q.globalAlpha = 1; q.fillStyle = FUEGO[3]; q.fillRect(x - 3, y - 1, 7, 3); q.fillRect(x - 1, y - 3, 3, 7);
      q.fillStyle = FUEGO[5]; q.fillRect(x - 2, y - 1, 5, 3); q.fillRect(x - 1, y - 2, 3, 5); q.fillStyle = FUEGO[6]; q.fillRect(x - 1, y - 1, 3, 3);
    }
    if (brasa.golpe >= 0) {
      const u = t - brasa.golpe, gx = B1[0] + ox, gy = B1[1] + oy;
      q.globalCompositeOperation = 'lighter';
      q.globalAlpha = Math.max(0, 1 - u / 1.6) * acc.destellos; q.drawImage(luzTrama(80, [220, 100, 34], 1.8), gx - 80, gy - 80);
      q.globalAlpha = Math.max(0, 1 - u / 0.35) * acc.destellos; q.drawImage(luzTrama(30, [255, 228, 170], 1.2), gx - 30, gy - 30);
      const vida = Math.min(1, u / 0.4) * Math.max(0, 1 - Math.max(0, u - 2.6) / 1.3);
      q.globalAlpha = 0.5 * vida; q.drawImage(luzTrama(22, [190, 70, 20], 1.3), gx - 22, gy - 24);
      q.globalCompositeOperation = 'source-over';
      if (u < 0.7) { const r = 5 + u * 90, nn = Math.ceil(r * 6); for (let i = 0; i < nn; i++) { const a = i / nn * Math.PI * 2; if (Math.sin(a) > 0.3) continue; punto(gx + Math.cos(a) * r, gy + Math.sin(a) * r * 0.45, FUEGO[Math.max(1, 6 - Math.floor(u * 8))], 1 - u / 0.7); } }
      // lo que queda ardiendo en el techo
      for (let c = -6; c <= 6; c++) {
        const n = Math.floor(t * 11 + c * 5), alto = Math.max(0, Math.round((9 - Math.abs(c) * 1.2) * vida * (0.6 + 0.6 * hsh(n + c * 31))));
        for (let k2 = 0; k2 < alto; k2++) punto(gx + c + (hsh(n * 3 + k2) < 0.25 ? (c > 0 ? 1 : -1) : 0), gy + 2 - k2, FUEGO[Math.max(1, 6 - Math.floor(k2 / Math.max(1, alto) * 5) - (Math.abs(c) > 4 ? 2 : 0))], 1);
      }
    }
  }
}
(window as any).__brasaYa = false;
