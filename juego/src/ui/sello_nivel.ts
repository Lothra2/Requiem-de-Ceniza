// El nivel del héroe en el HUD: un rosetón forjado en la punta de la ojiva del orbe de vida (y entre los orbes en el
// táctil). Hierro con cuatro lóbulos remachados, bisel de latón, un canal donde corre oro fundido con la experiencia que
// falta para el nivel siguiente, y el número en cifras de pixel de latón en relieve sobre esmalte oscuro.
// Se pinta pixel a pixel con la paleta y la luz de la barra (src/engine/gotico/hud.ts) y se copia a punto entero, así
// tiene el mismo grano que el resto del HUD. Rick (18 nov 2026): el sello de antes "parecía un parche con el nivel".
import { Lienzo, PALETA as P, type C3 } from '../../../src/engine/gotico/hud';
import type { Raster } from '../../../src/engine/core/raster';
import { ctx, RES } from '../nucleo/lienzo';
import { acc } from '../nucleo/accesible';
import { cacheRaster } from './comun';

type Rampa = C3[];
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
const cl = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** Tono de la rampa con tramado ordenado (igual que la barra). */
function tono(r: Rampa, v: number, x: number, y: number): C3 {
  const t = cl(v) * (r.length - 1), b = Math.floor(t);
  return r[Math.min(r.length - 1, t - b > BAYER[(y & 3) * 4 + (x & 3)] ? b + 1 : b)];
}
const mez = (a: C3, b: C3, k: number): C3 => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
function hash(x: number, y: number, s = 0) {
  let h = (x * 374761393 + y * 668265263 + s * 974711) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// la luz de la barra: arriba a la izquierda y un poco de frente
const LUZ = (() => { const v = [-0.5, -0.62, 0.6]; const n = Math.hypot(...v); return v.map((c) => c / n) as [number, number, number]; })();

// ------------------------------------------------------------------ cifras de pixel
// Dos tallas: 6x9 de trazo doble (una o dos cifras) y 5x7 para el 100. Se recortan a su tinta al componer.
const GRANDE: Record<string, string[]> = {
  '0': ['.####.', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '##..##', '.####.'],
  '1': ['..##..', '.###..', '####..', '..##..', '..##..', '..##..', '..##..', '..##..', '######'],
  '2': ['.####.', '##..##', '....##', '....##', '...##.', '..##..', '.##...', '##....', '######'],
  '3': ['.####.', '##..##', '....##', '....##', '..###.', '....##', '....##', '##..##', '.####.'],
  '4': ['...##.', '..###.', '.####.', '##.##.', '##.##.', '######', '...##.', '...##.', '...##.'],
  '5': ['######', '##....', '##....', '#####.', '....##', '....##', '....##', '##..##', '.####.'],
  '6': ['.####.', '##..##', '##....', '##....', '#####.', '##..##', '##..##', '##..##', '.####.'],
  '7': ['######', '....##', '....##', '...##.', '...##.', '..##..', '..##..', '..##..', '..##..'],
  '8': ['.####.', '##..##', '##..##', '##..##', '.####.', '##..##', '##..##', '##..##', '.####.'],
  '9': ['.####.', '##..##', '##..##', '##..##', '.#####', '....##', '....##', '##..##', '.####.'],
};
const CHICA: Record<string, string[]> = {
  '0': ['.###.', '##.##', '##.##', '##.##', '##.##', '##.##', '.###.'],
  '1': ['.##', '###', '.##', '.##', '.##', '.##', '###'],
  '2': ['.###.', '##.##', '...##', '..##.', '.##..', '##...', '#####'],
  '3': ['####.', '...##', '...##', '.###.', '...##', '...##', '####.'],
  '4': ['...##', '..###', '.#.##', '##.##', '#####', '...##', '...##'],
  '5': ['#####', '##...', '####.', '...##', '...##', '##.##', '.###.'],
  '6': ['.###.', '##...', '##...', '####.', '##.##', '##.##', '.###.'],
  '7': ['#####', '...##', '...##', '..##.', '..##.', '.##..', '.##..'],
  '8': ['.###.', '##.##', '##.##', '.###.', '##.##', '##.##', '.###.'],
  '9': ['.###.', '##.##', '##.##', '.####', '...##', '...##', '.###.'],
};
/** La máscara del número (x, y de cada pixel con tinta) centrada en (0, 0). */
function cifras(n: number): { px: [number, number][]; w: number; h: number } {
  const s = String(n), F = s.length > 2 ? CHICA : GRANDE, h = F['0'].length;
  // cada cifra recortada a su tinta (el 1 es más angosto) y un punto de aire entre cifras
  const tiras = [...s].map((ch) => {
    const g = F[ch]; let a = 99, b = -1;
    for (const f of g) for (let i = 0; i < f.length; i++) if (f[i] === '#') { a = Math.min(a, i); b = Math.max(b, i); }
    return { g, a, w: b - a + 1 };
  });
  const w = tiras.reduce((q, t) => q + t.w, 0) + tiras.length - 1;
  const px: [number, number][] = [];
  let x0 = -Math.floor(w / 2);
  for (const t of tiras) {
    t.g.forEach((f, y) => { for (let i = t.a; i < t.a + t.w; i++) if (f[i] === '#') px.push([x0 + i - t.a, y - Math.floor(h / 2)]); });
    x0 += t.w + 1;
  }
  return { px, w, h };
}

// ------------------------------------------------------------------ el rosetón
/** Centro del rosetón en su raster (el eje cae entre dos pixeles, como la ojiva de la barra) y lado del raster. */
export const C_SELLO = 20;
const LADO = 43;
// radios (distancia al centro de cada pixel)
const R_ESMALTE = 8.7, R_LABIO = 9.5, R_CANAL = 11.2, R_FILETE = 12.1, R_BISEL = 13.6, R_CANTO = 14.4;
const LOBULO_D = 15, LOBULO_R = 4.2;
const lobulos = [0, 1, 2, 3].map((k) => { const a = Math.PI / 4 + (k * Math.PI) / 2; return [C_SELLO + Math.cos(a) * LOBULO_D, C_SELLO + Math.sin(a) * LOBULO_D] as [number, number]; });
/** Los pixeles del canal ordenados desde arriba en el sentido del reloj (para llenarlo con la experiencia). */
const CANAL: [number, number][] = (() => {
  const out: [number, number, number][] = [];
  for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) {
    const dx = x + 0.5 - C_SELLO, dy = y + 0.5 - C_SELLO, d = Math.hypot(dx, dy);
    if (d > R_LABIO && d <= R_CANAL) { let a = Math.atan2(dx, -dy); if (a < 0) a += Math.PI * 2; out.push([x, y, a]); }
  }
  out.sort((p, q) => p[2] - q[2]);
  return out.map(([x, y]) => [x, y]);
})();
export const PIXELES_CANAL = CANAL.length;

/**
 * Pinta el rosetón. llenos: pixeles del canal con oro (0..PIXELES_CANAL). calor: 0 en reposo, 1 recién subido de nivel.
 */
export function rosetonNivel(nivel: number, llenos: number, calor: number): Raster {
  const l = new Lienzo(LADO, LADO), C = C_SELLO;
  const dist = (x: number, y: number) => Math.hypot(x + 0.5 - C, y + 0.5 - C);
  const enLob = (x: number, y: number) => lobulos.some(([lx, ly]) => Math.hypot(x + 0.5 - lx, y + 0.5 - ly) <= LOBULO_R);
  const enCuerpo = (x: number, y: number) => x >= 0 && y >= 0 && x < LADO && y < LADO && (dist(x, y) <= R_CANTO || enLob(x, y));
  // sombra que cae sobre la piedra (abajo a la derecha, como los remaches de la barra)
  for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) {
    if (enCuerpo(x, y)) continue;
    if (enCuerpo(x - 1, y - 2) || enCuerpo(x - 1, y - 1)) l.px(x, y, [0, 0, 0], enCuerpo(x - 1, y - 1) ? 0.6 : 0.4);
    else if (enCuerpo(x - 2, y - 2) || enCuerpo(x, y - 1) || enCuerpo(x - 1, y)) l.px(x, y, [0, 0, 0], 0.22);
  }
  // los cuatro lóbulos de hierro: domos martillados con su remache de latón
  for (const [lx, ly] of lobulos) {
    for (let y = Math.floor(ly - LOBULO_R - 1); y <= ly + LOBULO_R + 1; y++) for (let x = Math.floor(lx - LOBULO_R - 1); x <= lx + LOBULO_R + 1; x++) {
      const dx = (x + 0.5 - lx) / LOBULO_R, dy = (y + 0.5 - ly) / LOBULO_R, d2 = dx * dx + dy * dy;
      if (d2 > 1 || dist(x, y) <= R_CANTO) continue;
      const nz = Math.sqrt(1 - d2), lu = dx * LUZ[0] + dy * LUZ[1] + nz * LUZ[2];
      // borde: el contorno oscuro donde el lóbulo toca el aire
      const borde = !enCuerpo(x + 1, y) || !enCuerpo(x - 1, y) || !enCuerpo(x, y + 1) || !enCuerpo(x, y - 1);
      l.px(x, y, borde ? P.hierro[0] : tono(P.hierro, 0.2 + lu * 0.62 + (hash(x, y, 5) - 0.5) * 0.08, x, y));
    }
  }
  // el disco: canto oscuro, bisel de latón convexo, canal, labio hundido y esmalte
  const lleno = new Set(CANAL.slice(0, Math.max(0, Math.min(CANAL.length, llenos))).map(([x, y]) => y * LADO + x));
  const punta = llenos > 0 && llenos < CANAL.length ? CANAL[llenos - 1] : null;
  const k = cl(calor);
  for (let y = 0; y < LADO; y++) for (let x = 0; x < LADO; x++) {
    const d = dist(x, y);
    if (d > R_CANTO) continue;
    const dx = (x + 0.5 - C) / d, dy = (y + 0.5 - C) / d, haciaLuz = -(dx * LUZ[0] + dy * LUZ[1]); // > 0: mira a la luz (arriba a la izquierda)
    if (d > R_BISEL) { l.px(x, y, P.hierro[0]); continue; }
    if (d > R_FILETE) {
      // aro de hierro convexo, martillado: luz arriba a la izquierda, sombra abajo
      const v = 0.42 + haciaLuz * 0.3 + (hash(x, y, 9) - 0.5) * 0.08 + k * 0.1;
      l.px(x, y, tono(P.hierro, v, x, y));
      continue;
    }
    if (d > R_CANAL) { l.px(x, y, tono(P.laton, 0.55 + haciaLuz * 0.3 + k * 0.2, x, y)); continue; } // filete de latón
    if (d > R_LABIO) {
      // el canal de la experiencia: oro fundido lo hecho, hierro negro lo que falta
      if (lleno.has(y * LADO + x)) {
        const v = 0.72 + haciaLuz * -0.15 + (hash(x, y, 3) - 0.5) * 0.08 + k * 0.25;
        l.px(x, y, punta && punta[0] === x && punta[1] === y ? P.xp[8] : tono(P.xp, v, x, y));
      } else l.px(x, y, haciaLuz > 0.2 ? [4, 3, 3] : tono(P.hierro, 0.06 + Math.max(0, -haciaLuz) * 0.1, x, y));
      continue;
    }
    if (d > R_ESMALTE) { l.px(x, y, haciaLuz > 0 ? P.laton[0] : P.laton[2]); continue; } // labio hundido: sombra arriba, luz abajo
    // esmalte: negro rojizo con un poco de luz abajo a la derecha (está hundido) y su brasa al subir de nivel
    const v = 0.1 + (1 - d / R_ESMALTE) * 0.05 - haciaLuz * 0.05 + (hash(x, y, 7) - 0.5) * 0.04;
    let c = tono(P.sangre, v, x, y);
    c = mez(c, [8, 5, 4], 0.55);
    if (k > 0) c = mez(c, tono(P.fuego, 0.35 + (1 - d / R_ESMALTE) * 0.25, x, y), k * 0.55 * (1 - d / (R_ESMALTE + 2)));
    l.px(x, y, c);
  }
  // remaches de latón en cada lóbulo
  for (const [lx, ly] of lobulos) {
    const rx = Math.floor(lx), ry = Math.floor(ly);
    l.px(rx - 1, ry - 1, P.laton[8]); l.px(rx, ry - 1, P.laton[6]); l.px(rx - 1, ry, P.laton[6]); l.px(rx, ry, P.laton[3]); l.px(rx + 1, ry, P.hierro[0], 0.6); l.px(rx, ry + 1, P.hierro[0], 0.6);
  }
  // el número en relieve: cara de latón con luz arriba a la izquierda, canto en sombra y su sombra sobre el esmalte
  const { px } = cifras(nivel), ox = C, oy = C;
  const tinta = new Set(px.map(([x, y]) => (y + oy) * LADO + x + ox));
  const t = (x: number, y: number) => tinta.has(y * LADO + x);
  for (const [qx, qy] of px) { const x = qx + ox, y = qy + oy; if (!t(x + 1, y + 1)) l.px(x + 1, y + 1, [0, 0, 0], 0.85); }
  for (const [qx, qy] of px) {
    const x = qx + ox, y = qy + oy;
    const luz = !t(x - 1, y) || !t(x, y - 1), sombra = !t(x + 1, y) || !t(x, y + 1);
    let c: C3 = luz && !sombra ? P.laton[8] : sombra && !luz ? P.laton[4] : P.laton[6];
    if (k > 0) c = mez(c, luz && !sombra ? [255, 255, 255] : P.xp[8], k * 0.85);
    l.px(x, y, c);
  }
  return l.r;
}

// ------------------------------------------------------------------ en pantalla
let nivelVisto = -1, subioEn = -99;
/** Dónde quedó el último rosetón dibujado (para las pruebas: centro y radio en puntos del lienzo). */
export const selloDibujado = { x: 0, y: 0, r: 0 };

/**
 * Dibuja el rosetón con centro (cx, cy) a `esc` puntos por pixel. kxp: fracción hecha hacia el nivel siguiente.
 * Al subir de nivel el esmalte se pone al rojo, el oro del canal arde, sale un anillo de luz y unas chispas que suben
 * (todo más suave con Destellos suaves).
 */
export function dibujarRoseton(nivel: number, kxp: number, cx: number, cy: number, esc: number, t: number, rejilla = false) {
  if (nivelVisto >= 0 && nivel > nivelVisto) subioEn = t;
  if (nivel < nivelVisto) subioEn = -99; // otro héroe: no es una subida
  nivelVisto = nivel;
  const dt = t - subioEn, ard = Math.max(0, 1 - dt / 3.5), fl = acc.destellos;
  const calor = Math.round(Math.pow(ard, 0.6) * 4) / 4;
  const llenos = Math.round(cl(kxp) * PIXELES_CANAL);
  const img = cacheRaster(`roseton_${nivel}_${llenos}_${calor}`, () => rosetonNivel(nivel, llenos, calor));
  // (rejilla: a puntos enteros del lienzo y no del HUD lógico, para el HUD forjado a 1,5 puntos por punto lógico)
  const aR = (v: number) => (rejilla ? Math.round(v * RES) / RES : Math.round(v));
  const x0 = aR(cx - C_SELLO * esc), y0 = aR(cy - C_SELLO * esc), R = R_CANTO * esc;
  selloDibujado.x = cx; selloDibujado.y = cy; selloDibujado.r = R;
  (window as any).__selloNivel = [cx, cy, R];
  ctx.save();
  if (ard > 0) {
    // resplandor tibio detrás (chico: no tapa la barra ni el orbe)
    const g = ctx.createRadialGradient(cx, cy, R * 0.7, cx, cy, R * 2.1);
    g.addColorStop(0, `rgba(255,190,90,${0.42 * ard * fl})`); g.addColorStop(1, 'rgba(255,120,30,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 2.1, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  const su = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, x0, y0, LADO * esc, LADO * esc);
  ctx.imageSmoothingEnabled = su;
  if (ard > 0) {
    ctx.globalCompositeOperation = 'lighter';
    // un anillo de luz que se abre una sola vez
    if (dt < 0.7) {
      const p = dt / 0.7, rr = R * (1 + p * 1.3);
      ctx.strokeStyle = `rgba(255,226,150,${(1 - p) * 0.75 * fl})`; ctx.lineWidth = Math.max(1, esc * (1.5 - p));
      ctx.beginPath(); ctx.arc(cx, cy, rr, 0, Math.PI * 2); ctx.stroke();
    }
    // chispas: pixeles de oro que nacen en el aro y suben abriéndose, cada una con su vida
    const n = Math.round(14 * fl), u = Math.max(1, Math.round(esc));
    for (let i = 0; i < n; i++) {
      const t0 = hash(i, 1, 77) * 0.9, vida = 0.7 + hash(i, 2, 77) * 0.9, q = (dt - t0) / vida;
      if (q < 0 || q > 1) continue;
      const a = -Math.PI / 2 + (hash(i, 3, 77) - 0.5) * 2.6, v = (16 + hash(i, 4, 77) * 22) * esc;
      const sx = cx + Math.cos(a) * R * 0.95 + Math.cos(a) * v * q * 0.6, sy = cy + Math.sin(a) * R * 0.95 + Math.sin(a) * v * q - 10 * esc * q * q;
      const col = q < 0.35 ? '255,244,200' : q < 0.7 ? '255,196,90' : '230,110,40';
      ctx.fillStyle = `rgba(${col},${(1 - q) * fl})`; ctx.fillRect(Math.round(sx), Math.round(sy), u, u);
    }
    ctx.globalCompositeOperation = 'source-over';
  }
  ctx.restore();
}
