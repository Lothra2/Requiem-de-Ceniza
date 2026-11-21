// El título de la portada arde de verdad, en pixel art: dos fuegos de Doom (el mismo autómata de las antorchas y la
// catedral) corren en una grilla de celdas de puntos enteros del aparato y se pintan en bandas con su trama, sin
// suavizar. El de atrás nace del canto de arriba de cada letra y sube en lenguas con humo; el de adelante vive DENTRO
// de las letras (su forma es la máscara del título): nace del canto de abajo de cada trazo y de las grietas encendidas
// y lame el hierro de abajo hacia arriba. Donde lo toca, el metal se pone al rojo (una capa sumada que se calienta y
// se enfría despacio), y de las puntas se desprenden brasas de pixel. La entrada es un golpe de forja: al aparecer el
// título, fogonazo, chispas que saltan de las letras y un temblor (respetan `acc.destellos` y `acc.temblor`); al
// terminar de forjarse el fuego se enciende desde el centro hacia los lados con una bocanada.
// `__tituloViejo` vuelve al fuego liso de antes (una grilla agrandada con suavizado) y sin el golpe.
import * as D from '../../../src/engine/gotico/fuego_doom';
import { ctx, E, H, RES } from '../nucleo/lienzo';
import { acc } from '../nucleo/accesible';
import { Sonido } from '../audio/sonido';
import { BANDAS_METAL, capa, pintarCalor, pegarPixel, moverChispas, dibujarChispas, type Capa, type Chispa } from './fuego_pixel';

/** Cuándo pasa cada cosa, en segundos desde que aparece el título (el revelado horneado dura 20 cuadros a 12 por s). */
export const GOLPE_T = 0.7, ENCIENDE_T = 1.45, ENCIENDE_DUR = 0.7;
const viejo = () => !!(window as any).__tituloViejo;

// ------------------------------------------------------------------ el de ahora
interface Estado {
  im: HTMLImageElement; cw: number; ch: number; aire: number; celda: number;
  /** alfa del título por celda (cw x ch) y cuánto de grieta encendida tiene */
  mk: Float32Array;
  atras: D.Fuego; baseA: Float32Array; idxA: Int32Array;
  frente: D.Fuego; baseF: Float32Array; idxF: Int32Array;
  calorMetal: Float32Array;
  /** qué tan cerca del canto de abajo de su trazo está cada celda (1 en el canto, 0 a media letra): ahí vive el calor */
  bajo: Float32Array;
  filaK?: Float32Array;
  tablas?: { sx1: Float32Array; cx1: Float32Array; sx2: Float32Array; cx2: Float32Array; sy1: Float32Array; cy1: Float32Array; sy2: Float32Array; cy2: Float32Array };
  llama: Capa; humo: Capa; adel: Capa; metal: Capa;
  brillo: HTMLCanvasElement; gb: CanvasRenderingContext2D;
}
/** Los sonidos del golpe y del encendido esperan al audio: si la portada arranca antes del primer toque, suenan cuando
 * se desbloquea mientras el título todavía se forja (el golpe hasta 2 s después del encendido, el encendido 1,5 s). */
const pendiente = { golpe: -1, enciende: -1, tras: -1 };
(window as any).__sonidoPendiente = pendiente;
function sonar(t: number) {
  const log = ((window as any).__sonidosPortada ??= []) as { id: string; t: number }[];
  if (Sonido.mudo()) return;
  if (pendiente.golpe >= 0 && t < ENCIENDE_T + 2) { Sonido.efecto('golpe_metal' as any, { vol: 0.7, tono: 0.55 }); log.push({ id: 'golpe_metal', t }); pendiente.tras = t + 0.4; }
  // (si los dos llegan juntos al desbloquear, el encendido espera un poco detrás del golpe)
  if (pendiente.enciende >= 0 && t >= ENCIENDE_T && t >= pendiente.tras && t < ENCIENDE_T + 2.5) { Sonido.efecto('fuego_lanzar' as any, { vol: 0.6, tono: 0.7 }); log.push({ id: 'fuego_lanzar', t }); pendiente.enciende = -1; }
  pendiente.golpe = -1;
  if (t >= ENCIENDE_T + 2.5) pendiente.enciende = -1;
}
let est: Estado | null = null, ultT = -1, ultAd = -1, encendido = false, golpeado = false, avivo = false;
const chispas: Chispa[] = [];

function armar(im: HTMLImageElement, celda: number, cw: number): Estado | null {
  const ch = Math.max(8, Math.round((cw * im.naturalHeight) / im.naturalWidth)), aire = Math.round(ch * ((window as any).__tituloCorto ? 0.24 : 0.42)); // (sexta pasada: más aire arriba, las llamas de RÉQUIEM suben más)
  const m = document.createElement('canvas'); m.width = cw; m.height = ch;
  const g = m.getContext('2d', { willReadFrequently: true }); if (!g) return null;
  g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, cw, ch);
  const d = g.getImageData(0, 0, cw, ch).data, mk = new Float32Array(cw * ch);
  for (let i = 0; i < cw * ch; i++) mk[i] = d[i * 4 + 3] / 255;
  const a = (x: number, y: number) => (x < 0 || y < 0 || x >= cw || y >= ch ? 0 : mk[y * cw + x]);
  const azar = (x: number, y: number, s: number) => { const h1 = Math.sin(x * 12.9898 + y * 78.233 + s * 37.719) * 43758.5453; return h1 - Math.floor(h1); };
  // atrás: el canto de arriba de cada trazo, con la grilla más alta para que suban las lenguas
  const wA = cw, hA = ch + aire, fA = new Float32Array(wA * hA), idxA: number[] = [];
  // adelante: el canto de abajo de cada trazo y las grietas encendidas, y la forma es la letra misma
  const fF = new Float32Array(cw * ch), forma = new Float32Array(cw * ch), idxF: number[] = [];
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = a(x, y), i = y * cw + x;
    forma[i] = Math.max(0, Math.min(1, (v - 0.55) / 0.35));
    if (v >= 0.5 && a(x, y - 1) < 0.3 && a(x, y - 3) < 0.3 && azar(x, y, 1) < 0.9) { const j = (y + aire) * wA + x; fA[j] = (0.8 + 0.2 * azar(x, y, 2)) * (y > ch * 0.5 ? 0.72 : 1); idxA.push(j); }
    if (v < 0.85) continue;
    // el canto de abajo (la fila de letra que tiene aire debajo, y la de arriba de esa para que no sea una raya)
    // (lenguas finas: solo en columnas sueltas, una celda de ancho, para que el hierro de al lado quede limpio)
    if (a(x, y + 1) < 0.5) { if (azar(x, 0, 4) < 0.28 && azar(x - 1, 0, 4) >= 0.28) { fF[i] = 0.7 + 0.3 * azar(x, y, 5); idxF.push(i); } continue; }
    // las grietas: el horneado las trae encendidas (rojo y oro sobre el hierro gris)
    const r = d[i * 4], gg = d[i * 4 + 1], b = d[i * 4 + 2];
    if (r > 170 && r - b > 90 && gg > 70 && azar(x, y, 6) < 0.3) { fF[i] = 0.45 + 0.35 * azar(x, y, 7); idxF.push(i); }
  }
  if (!idxA.length) return null;
  const atras = D.crearFuego({ ancho: wA, alto: hA, semilla: 666, paleta: 'infierno', forma: { tipo: 'mapa', fuente: fA }, altura: (window as any).__tituloCorto ? 0.3 : 0.5, viento: 0.08, rafagas: 0.35, turbulencia: 0.36, ruido: 0.5, tramo: 9, velocidadTramo: 1.5, humo: 0.5, margen: 2, encendido: 0 });
  const frente = D.crearFuego({ ancho: cw, alto: ch, semilla: 667, paleta: 'infierno', forma: { tipo: 'mapa', fuente: fF, forma }, altura: 0.075, viento: 0, rafagas: 0.1, turbulencia: 0.12, ruido: 0.6, tramo: 4, velocidadTramo: 2.6, humo: 0, margen: 0, encendido: 0 });
  // la distancia al canto de abajo de cada trazo, columna por columna (de abajo hacia arriba)
  const bajo = new Float32Array(cw * ch), largo = Math.max(6, ch * 0.13);
  for (let x = 0; x < cw; x++) { let dd = 1e9; for (let y = ch - 1; y >= 0; y--) { const i = y * cw + x; if (mk[i] < 0.6) { dd = 1e9; continue; } dd = dd > 1e8 ? 0 : dd + 1; bajo[i] = Math.max(0, 1 - dd / largo); } }
  // (sin precalentar: las fuentes están apagadas hasta el encendido, y precalentar 50 mil celdas trababa 0,6 s)
  D.encender(atras, 1); D.encender(frente, 1);
  const brillo = document.createElement('canvas'); brillo.width = Math.ceil(wA / 4); brillo.height = Math.ceil(hA / 4);
  return {
    im, cw, ch, aire, celda, mk, atras, baseA: new Float32Array(atras.fuente), idxA: Int32Array.from(idxA),
    frente, baseF: new Float32Array(frente.fuente), idxF: Int32Array.from(idxF), calorMetal: new Float32Array(cw * ch), bajo,
    llama: capa(wA, hA), humo: capa(wA, hA), adel: capa(cw, ch), metal: capa(cw, ch), brillo, gb: brillo.getContext('2d')!,
  };
}

/** La racha del bucle: cada 5 s (corrido un poco al azar fijo), una ola de 1,4 s que cruza de izquierda a derecha. */
let rachaN = -1;
function racha(t: number): { k: number; x: number; nueva: boolean } {
  const T0 = ENCIENDE_T + ENCIENDE_DUR + 2.5; if (t < T0) return { k: 0, x: 0, nueva: false };
  const P = 5, n = Math.floor((t - T0) / P), u = (t - T0 - n * P) / 1.4, nueva = n !== rachaN; rachaN = n;
  if (u > 1) return { k: 0, x: 0, nueva };
  const lado = (Math.sin(n * 12.9898) * 43758.5) % 1 > 0 ? 1 : -1;
  return { k: Math.sin(u * Math.PI) * 0.55, x: lado > 0 ? u * 1.3 - 0.15 : 1.15 - u * 1.3, nueva };
}

/** El encendido: las fuentes se prenden desde el centro hacia los lados (k 0 a 1); 1 es todo, 0 nada. */
function prender(s: Estado, k: number) {
  const mitad = s.cw / 2;
  const una = (f: D.Fuego, base: Float32Array, idx: Int32Array) => {
    for (let n = 0; n < idx.length; n++) {
      const i = idx[n], x = i % f.w, q = Math.abs(x + 0.5 - mitad) / mitad;
      f.fuente[i] = base[i] * Math.max(0, Math.min(1, (k * 1.3 - q) * 5));
    }
  };
  una(s.atras, s.baseA, s.idxA); una(s.frente, s.baseF, s.idxF);
}

/**
 * El metal al rojo, liso (sin trama: dentro de la letra no va ningún cuadro suelto). Junta lo que toca la llama de
 * adelante y la de atrás en el canto de arriba, el calor que vive siempre en lo bajo de cada trazo y respira en vetas que
 * suben, las rachas que cruzan el título y la forja de la entrada. Sube rápido y se enfría despacio.
 */
function calentar(s: Estado, dt: number, t: number, forja: number, racha: number, rachaX: number) {
  const { cw, ch, aire, mk, calorMetal, bajo } = s, cF = s.frente.calor, cA = s.atras.calor, d = s.metal.im.data, n = BANDAS_METAL.length - 1;
  const kUp = 1 - Math.exp(-dt * 7), kDn = 1 - Math.exp(-dt * 1.4), inv = 1 / D.CALOR_MAX, fx = 9 / cw, fy = 6 / ch;
  // las vetas, separables (seno de una suma = productos de senos y cosenos por fila y por columna: nada de trigonometría por celda)
  const tb = s.tablas ?? (s.tablas = { sx1: new Float32Array(cw), cx1: new Float32Array(cw), sx2: new Float32Array(cw), cx2: new Float32Array(cw), sy1: new Float32Array(ch), cy1: new Float32Array(ch), sy2: new Float32Array(ch), cy2: new Float32Array(ch) });
  for (let x = 0; x < cw; x++) { const a1 = x * fx * 3.1 + t * 1.7, a2 = x * fx * 1.3 - t * 0.9; tb.sx1[x] = Math.sin(a1); tb.cx1[x] = Math.cos(a1); tb.sx2[x] = Math.sin(a2); tb.cx2[x] = Math.cos(a2); }
  for (let y = 0; y < ch; y++) { const b1 = y * fy * 5 + t * 2.3, b2 = y * fy * 2.2; tb.sy1[y] = Math.sin(b1); tb.cy1[y] = Math.cos(b1); tb.sy2[y] = Math.sin(b2); tb.cy2[y] = Math.cos(b2); }
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = y * cw + x, j = i * 4, m = mk[i];
    // (solo el hierro de adentro: el canto oscuro del título no se enciende, así el borde queda nítido)
    if (m < 0.9 || x === 0 || y === 0 || x === cw - 1 || y === ch - 1 || mk[i - 1] < 0.9 || mk[i + 1] < 0.9 || mk[i - cw] < 0.9 || mk[i + cw] < 0.9) { d[j + 3] = 0; continue; }
    const f0 = cF[i], f1 = y + 1 < ch ? cF[i + cw] : 0, f2 = y + 3 < ch ? cF[i + 3 * cw] : 0, a0 = cA[i + aire * cw];
    // las vetas: dos ondas torcidas que suben por el hierro
    const veta = 0.5 + 0.25 * (tb.sx1[x] * tb.cy1[y] + tb.cx1[x] * tb.sy1[y]) + 0.25 * (tb.sx2[x] * tb.cy2[y] + tb.cx2[x] * tb.sy2[y]);
    const b = bajo[i], dr = x / cw - rachaX;
    const meta = Math.min(1, (f0 * 0.5 + f1 * 0.3 + f2 * 0.25 + a0 * 0.5) * inv + b * b * (0.32 + 0.3 * veta) + 0.025 * veta + forja + racha * Math.exp(-dr * dr * 60) * (0.25 + 0.5 * b));
    const v = calorMetal[i], c = (calorMetal[i] = v + (meta - v) * (meta > v ? kUp : kDn));
    // la rampa del metal, interpolada (liso)
    const u = Math.min(n - 0.001, c * n * 0.95), k0 = Math.floor(u), q = u - k0, A = BANDAS_METAL[k0], B = BANDAS_METAL[k0 + 1];
    d[j] = A[0] + (B[0] - A[0]) * q; d[j + 1] = A[1] + (B[1] - A[1]) * q; d[j + 2] = A[2] + (B[2] - A[2]) * q; d[j + 3] = k0 ? 255 : 255 * q;
  }
  s.metal.g.putImageData(s.metal.im, 0, 0);
}

function chispasDeGolpe(s: Estado, x: number, oy: number, cel: number) {
  const n = E.tactil ? 60 : 130, cx = x + (s.cw * cel) / 2, cy = oy + (s.aire + s.ch * 0.5) * cel;
  for (let k = 0; k < n; k++) {
    const i = s.idxA[Math.floor(Math.random() * s.idxA.length)], px = x + ((i % s.cw) + 0.5) * cel, py = oy + Math.floor(i / s.cw) * cel;
    const ang = Math.atan2(py - cy, px - cx) + (Math.random() - 0.5) * 0.5, v = 240 + Math.random() * 380;
    chispas.push({ x: px, y: py, vx: Math.cos(ang) * v * 1.35, vy: Math.sin(ang) * v - 160 - Math.random() * 160, t: 0, d: 0.28 + Math.random() * 0.55, g: 760, q: 1, s: 1 });
  }
}

/**
 * El fuego del título. `pasada` 'atras' va antes del título (humo, resplandor, llamas y brasas detrás de las letras);
 * 'adelante' después: el metal al rojo y la llama que lame las letras desde abajo y desde las grietas. (x, y, w, h) es
 * donde va el título, `t` los segundos desde que aparece y `alfa` cuánto arde (0 a 1).
 */
export function fuegoTitulo(im: HTMLImageElement | null, x: number, y: number, w: number, h: number, t: number, alfa: number, pasada: 'atras' | 'adelante') {
  if (viejo()) { fuegoTituloViejo(im, x, y, w, h, t, alfa, pasada); return; }
  if (!im) return;
  // la grilla: celdas de 2 o 3 puntos enteros del aparato (el grano de las letras: 240 de ancho en PC, 260 en el teléfono)
  const T = ctx.getTransform(), dev = w * RES, celda = Math.max(2, Math.min(3, Math.round(dev / 240))), cw = Math.max(16, Math.round(dev / celda));
  if (!est || est.im !== im || est.cw !== cw || est.celda !== celda) { est = armar(im, celda, cw); ultT = -1; encendido = false; if (!est) return; }
  const s = est, cel = celda / RES, oy = y - s.aire * cel, x0 = x + (w - s.cw * cel) / 2;
  if (pasada === 'atras') {
    if (t < ultT - 0.5) { golpeado = false; encendido = false; avivo = false; chispas.length = 0; pendiente.golpe = pendiente.enciende = pendiente.tras = -1; }
    const dt = ultT < 0 ? 1 / 30 : Math.min(0.1, Math.max(0, t - ultT)); ultT = t;
    // el golpe de forja: chispas que saltan de las letras y el martillazo
    if (!golpeado && t >= GOLPE_T && t < ENCIENDE_T) { golpeado = true; chispasDeGolpe(s, x0, oy, cel); pendiente.golpe = t; }
    // el encendido: del centro a los lados, con una bocanada
    const ki = Math.max(0, Math.min(1, (t - ENCIENDE_T) / ENCIENDE_DUR));
    // el frente del encendido corre del centro a los lados soltando brasas hacia arriba (la bocanada que se lee)
    if (ki > 0 && ki < 1) {
      const m = s.cw / 2, q = Math.min(1, ki * 1.3), n = E.tactil ? 3 : 6;
      for (let k = 0; k < n; k++) {
        const lado = k % 2 ? 1 : -1, cx = Math.round(m + lado * q * m + (Math.random() - 0.5) * 6), i = s.idxA.find((j) => Math.abs((j % s.cw) - cx) < 2);
        if (i === undefined) continue;
        chispas.push({ x: x0 + ((i % s.cw) + 0.5) * cel, y: oy + Math.floor(i / s.cw) * cel, vx: lado * (30 + Math.random() * 90), vy: -260 - Math.random() * 220, t: 0, d: 0.35 + Math.random() * 0.5, g: 260, q: 1, s: 1 });
      }
    }
    if (ki < 1) { prender(s, ki); encendido = false; } else if (!encendido) { prender(s, 1); encendido = true; }
    if (!avivo && t >= ENCIENDE_T && t < ENCIENDE_T + 1) { avivo = true; D.avivar(s.atras, 2.8, 1.0); D.avivar(s.frente, 2, 0.8); pendiente.enciende = t; }
    // las rachas: cada 4 a 6 s el fuego se aviva y una ola de calor cruza el título (el bucle no se apaga nunca)
    const r = racha(t);
    if (r.nueva) { D.avivar(s.atras, 1.7, 0.8); D.avivar(s.frente, 1.6, 0.6); }
    D.paso(s.atras, dt); D.paso(s.frente, dt);
    // brasas de las puntas de atrás y de las letras (pocas: son pixel y se leen una por una)
    const tope = E.tactil ? 45 : 90;
    if (alfa > 0.2 && chispas.length < tope) {
      for (const b of D.brasas(s.atras, 2, 0.5)) if (Math.random() < 0.35) chispas.push({ x: x0 + b.x * cel, y: oy + b.y * cel, vx: (Math.random() - 0.5) * 20, vy: -28 - Math.random() * 46, t: 0, d: 0.9 + Math.random() * 1.6, g: -6, q: 0.55 + b.calor * 0.4, s: 1 });
      for (const b of D.brasas(s.frente, 1, 0.55)) if (Math.random() < 0.22) chispas.push({ x: x0 + b.x * cel, y: y + b.y * cel, vx: (Math.random() - 0.5) * 16, vy: -36 - Math.random() * 40, t: 0, d: 0.7 + Math.random() * 1.2, g: -4, q: 0.7 + b.calor * 0.3, s: 1 });
    }
    moverChispas(chispas, dt, t, 6);
    sonar(t);
    // las llamas mueren antes del borde de arriba de la pantalla: cada fila se enfría según dónde cae (nunca un corte)
    const fk = s.filaK ?? (s.filaK = new Float32Array(s.ch + s.aire)), techo = Math.max(10, H * ((window as any).__tituloCorto ? 0.06 : 0.045));
    for (let r = 0; r < fk.length; r++) { const sy = (T.d * (oy + r * cel) + T.f) / T.d, u = Math.max(0, Math.min(1, (sy - 2) / techo)), v = (window as any).__tituloCorto ? 1 : Math.max(0, Math.min(1, r / (s.aire * 0.45))); fk[r] = u * u * (3 - 2 * u) * v * v * (3 - 2 * v); } // (sexta pasada: y antes del techo de su grilla: con las llamas más altas, en el teléfono chocaban con la fila de arriba y quedaba un borde recto)
    pintarCalor(s.atras, s.humo, { humo: true, pasadas: 2, filaK: fk });
    pintarCalor(s.atras, s.llama, { brillo: 1.5, umbral: 0.22, pasadas: 2, filaK: fk, tramaDesde: E.tactil ? 3.6 : 2.6 });
    pegarPixel(s.humo.c, x0, oy, celda, alfa * 0.9);
    // el resplandor: la llama achicada a un cuarto y agrandada suave (es luz, no fuego: puede ser blanda)
    s.gb.clearRect(0, 0, s.brillo.width, s.brillo.height); s.gb.imageSmoothingEnabled = true; s.gb.drawImage(s.llama.c, 0, 0, s.brillo.width, s.brillo.height);
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa * 0.3;
    ctx.drawImage(s.brillo, x0 - cel * 4, oy - cel * 5, s.cw * cel + cel * 8, (s.ch + s.aire) * cel + cel * 8); ctx.restore();
    pegarPixel(s.llama.c, x0, oy, celda, alfa);
  } else {
    // el metal al rojo (sumado) y la llama que lame las letras (encima, sin tapar el hierro frío)
    // la forja: el hierro se calienta mientras aparece, al rojo en el golpe, y se enfría
    const forja = (t < GOLPE_T ? 0.6 * Math.max(0, t / GOLPE_T) ** 2 : 0.6 * Math.exp(-(t - GOLPE_T) / 0.9)) + (t >= ENCIENDE_T ? 0.35 * Math.exp(-(t - ENCIENDE_T) / 0.45) : 0);
    const dt = ultAd < 0 || t < ultAd ? 1 / 30 : Math.min(0.1, t - ultAd); ultAd = t;
    const r = racha(t);
    calentar(s, dt, t, forja, r.k * alfa, r.x);
    pegarPixel(s.metal.c, x0, y, celda, Math.max(alfa * 0.72, forja), 'lighter');
    // las lenguas finas que suben por los cantos y las grietas: sin trama, solo lo caliente
    pintarCalor(s.frente, s.adel, { brillo: 1.05, umbral: 0.5, mascara: s.mk, trama: false, filtro: 0 });
    pegarPixel(s.adel.c, x0, y, celda, alfa * 0.9);
    dibujarChispas(chispas, x0, oy, celda, 1, t);
  }
}

/**
 * El golpe de la entrada para la escena: cuánto se corre la pantalla (puntos lógicos, ya por `acc.temblor`) y cuánto
 * destella (0 a 1, ya por `acc.destellos`) a `t` segundos de aparecer el título.
 */
export function golpeTitulo(t: number): { dx: number; dy: number; destello: number; bocanada: number } {
  if (viejo() || t < GOLPE_T - 0.01) return { dx: 0, dy: 0, destello: 0, bocanada: 0 };
  const u = t - GOLPE_T, a = 7 * Math.exp(-u / 0.13) * (u < 0.7 ? 1 : 0) * acc.temblor;
  const v = t - ENCIENDE_T, b = v >= 0 ? 2 * Math.exp(-v / 0.12) * (v < 0.5 ? 1 : 0) * acc.temblor : 0;
  const dx = Math.round((Math.sin(u * 83) * a + Math.sin(v * 71) * b) * 2) / 2, dy = Math.round((Math.cos(u * 67) * a * 0.8 + Math.cos(v * 59) * b) * 2) / 2;
  const destello = Math.exp(-u / 0.09) * acc.destellos;
  const bocanada = v >= 0 ? Math.exp(-v / 0.35) * acc.destellos : 0;
  return { dx, dy, destello, bocanada };
}

// ------------------------------------------------------------------ el de antes (__tituloViejo)
interface EstadoViejo { im: HTMLImageElement; f: D.Fuego; ch: number; aire: number; llama: HTMLCanvasElement; gl: CanvasRenderingContext2D; il: ImageData; humo: HTMLCanvasElement; gh: CanvasRenderingContext2D; ih: ImageData; brillo: HTMLCanvasElement; gb: CanvasRenderingContext2D }
let estV: EstadoViejo | null = null, ultV = -1;
const chispasV: { x: number; y: number; vx: number; vy: number; t: number; d: number }[] = [];
function armarViejo(im: HTMLImageElement): EstadoViejo | null {
  const CELDAS = 176, cw = CELDAS, ch = Math.max(8, Math.round((CELDAS * im.naturalHeight) / im.naturalWidth)), aire = Math.round(ch * 0.3);
  const m = document.createElement('canvas'); m.width = cw; m.height = ch;
  const g = m.getContext('2d', { willReadFrequently: true }); if (!g) return null;
  g.drawImage(im, 0, 0, cw, ch);
  const d = g.getImageData(0, 0, cw, ch).data, a = (x: number, y: number) => (y < 0 ? 0 : d[(y * cw + x) * 4 + 3] / 255);
  const w = cw, h = ch + aire, fuente = new Float32Array(w * h), forma = new Float32Array(w * h).fill(1);
  let n = 0;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const v = a(x, y); if (v < 0.45) continue;
    const i = (y + aire) * w + x, h1 = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453, r = h1 - Math.floor(h1);
    if (a(x, y - 1) < 0.3 && a(x, y - 3) < 0.3 && r < 0.7) { fuente[i] = 0.55 + 0.45 * r; n++; }
  }
  if (!n) return null;
  const f = D.crearFuego({ ancho: w, alto: h, semilla: 666, paleta: 'infierno', forma: { tipo: 'mapa', fuente, forma }, altura: 0.12, viento: 0.1, rafagas: 0.3, turbulencia: 0.4, ruido: 0.6, tramo: 6, velocidadTramo: 1.6, humo: 0.45, margen: 2, brillo: 1.15, pegada: 0.5 });
  const capaV = () => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!; return [c, x, x.createImageData(w, h)] as const; };
  const [llama, gl, il] = capaV(), [humo, gh, ih] = capaV();
  const brillo = document.createElement('canvas'); brillo.width = Math.ceil(w / 4); brillo.height = Math.ceil(h / 4);
  return { im, f, ch, aire, llama, gl, il, humo, gh, ih, brillo, gb: brillo.getContext('2d')! };
}
function fuegoTituloViejo(im: HTMLImageElement | null, x: number, y: number, w: number, h: number, t: number, alfa: number, pasada: 'atras' | 'adelante') {
  if (!im || alfa <= 0) return;
  if (!estV || estV.im !== im) { estV = armarViejo(im); ultV = -1; if (!estV) return; }
  const s = estV, cel = w / s.f.w, oy = y - s.aire * (h / s.ch);
  if (pasada === 'atras') {
    const dt = ultV < 0 ? 1 / 30 : Math.min(0.1, Math.max(0, t - ultV)); ultV = t;
    D.paso(s.f, dt);
    D.pintar(s.f, s.il.data, s.f.w, s.f.h, 1, { capa: 'llama', filtro: 0.8 }); s.gl.putImageData(s.il, 0, 0);
    D.pintar(s.f, s.ih.data, s.f.w, s.f.h, 1, { capa: 'humo' }); s.gh.putImageData(s.ih, 0, 0);
    if (chispasV.length < (E.tactil ? 40 : 70)) for (const b of D.brasas(s.f, 2, 0.45)) if (Math.random() < 0.5) chispasV.push({ x: x + b.x * cel, y: oy + b.y * cel, vx: (Math.random() - 0.5) * 18, vy: -30 - Math.random() * 40, t: 0, d: 1 + Math.random() * 1.4 });
    for (let i = chispasV.length - 1; i >= 0; i--) { const c = chispasV[i]; c.t += dt; if (c.t > c.d) { chispasV.splice(i, 1); continue; } c.vx += Math.sin(t * 3 + c.y * 0.05) * 30 * dt; c.x += c.vx * dt; c.y += c.vy * dt; }
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.globalAlpha = alfa * 0.8; ctx.drawImage(s.humo, x, oy, w, s.f.h * cel);
    s.gb.clearRect(0, 0, s.brillo.width, s.brillo.height); s.gb.imageSmoothingEnabled = true; s.gb.drawImage(s.llama, 0, 0, s.brillo.width, s.brillo.height);
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa * 0.32; ctx.drawImage(s.brillo, x - cel * 3, oy - cel * 4, w + cel * 6, s.f.h * cel + cel * 6);
    ctx.globalAlpha = alfa * 0.78; ctx.drawImage(s.llama, x, oy, w, s.f.h * cel);
    for (const c of chispasV) { const k = Math.sin((c.t / c.d) * Math.PI); ctx.globalAlpha = alfa * k; ctx.fillStyle = c.t / c.d < 0.4 ? '#ffd27a' : '#ff6a24'; ctx.fillRect(c.x, c.y, 2, 2); }
    ctx.restore();
  } else {
    ctx.save(); ctx.imageSmoothingEnabled = true; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = alfa * 0.18;
    ctx.drawImage(s.llama, x, oy, w, s.f.h * cel); ctx.restore();
  }
}
