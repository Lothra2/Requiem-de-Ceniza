// El cierre del acto 5, «La sed se quedó sin boca» (unos 85 s, con la revelación adentro): Ozmaren cae en el Corazón de la
// Brasa, su ceniza suelta la Brasa, que rueda hasta los pies del héroe; la Marca late al mismo ritmo y la revelación se dice
// sobre la escena; la película se queda quieta y oscura con la elección (destruir o absorber, la misma de siempre: se guarda en
// `finalElegido`), y sigue con su variante: el puño que la apaga o el pecho que la bebe. Después la Fragua se enfría, quedan las
// cenizas de Vesperio, el mar se parte, Ysmeral sube con sus campanas y Oyá la mira desde su barco varado. Cartel del acto 6.
// Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx, W, H } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { libreCerca, type Zona } from '../mundo/zona';
import { estallido } from '../render/brasa_cine';
import { finalDe } from '../juego/historia';
import { REVELACION, OPCIONES_BRASA } from '../mundo/actos';
import { cuadrosVivos } from '../motor/pintor';
import { cuadrosHeroe } from '../motor/assets';
import { boton } from './comun';
import { dibujarRostro, rostroListo } from './cine_rostro';
import { type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, anclaJefe, anclaSalida, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, latido, siluetaEnPiso, enfriarPiezas } from './cine_kit';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(5, n, t0, t1, o);
const R = (n: number, t0: number, t1: number): Texto => ({ t0, t1, es: REVELACION[n][0], en: REVELACION[n][1] });
const lucesDe = (e: EstadoToma): any[] | null => ((e.j as any)?.lucesCine as any[] | undefined) ?? null;

// ------------------------------------------------------------------ la elección
/** Lo que eligió el jugador en la película (lo lee main.ts, que lo guarda como la revelación de siempre). */
let elegido: 'destruir' | 'absorber' | null = null;
export const eleccionPeli = () => elegido;
export const limpiarEleccionPeli = () => { elegido = null; };
/**
 * La elección sobre la escena quieta y oscura: la última frase de la revelación arriba y los dos botones en la letra gótica (en
 * táctil miden 44 puntos o más). Destruir en hierro frío, absorber en brasa.
 */
function botonesEleccion(tl: number) {
  const k = Math.min(1, Math.max(0, (tl - 1.2) / 1.2)); if (k <= 0) return;
  ctx.save(); ctx.globalAlpha = 0.55 * k; ctx.fillStyle = '#020102'; ctx.fillRect(0, 0, W, H); ctx.restore();
  if (k < 1 || elegido) return;
  const bw = Math.min(260, W * 0.34), bh = 44, by = Math.round(H * 0.72), g = 24;
  if (boton(OPCIONES_BRASA.destruir[0], W / 2 - bw - g / 2, by, bw, bh, { gotico: true, tono: 'hierro', en: OPCIONES_BRASA.destruir[1] } as any)) elegido = 'destruir';
  if (boton(OPCIONES_BRASA.absorber[0], W / 2 + g / 2, by, bw, bh, { gotico: true, tono: 'brasa', en: OPCIONES_BRASA.absorber[1] } as any)) elegido = 'absorber';
}

// ------------------------------------------------------------------ el héroe y la Brasa
/** Dónde queda el héroe en la sala de Ozmaren (relativo al ancla) y la Brasa a sus pies. */
const HX = 2.6, HY = -0.9, PIES: [number, number] = [HX - 0.7, HY + 0.3];
/** La Marca: una luz roja en el brazo del héroe que late con la Brasa (o gris y fría si la apagó). */
function luzMarca(e: EstadoToma, tl: number, k: number, gris = 0) {
  const Ls = lucesDe(e); if (!Ls || k <= 0) return; const lat = latido(tl);
  const c: [number, number, number] = [Math.round(255 - 130 * gris), Math.round(50 + 80 * gris), Math.round(24 + 120 * gris)];
  Ls.push({ id: 'marca', x: e.ax + HX + 0.15, y: e.ay + HY + 0.3, z: 26, r: 150, c, k: k * (gris ? 0.35 : 0.3 + 0.7 * lat), sinSombra: false });
}
/** La sombra del héroe tibia: su silueta echada en el piso, roja oscura, que late (la Brasa bebida). */
function sombraTibia(e: EstadoToma, tl: number, k: number) {
  const h = e.actores.get('heroe') as any; if (!h || k <= 0) return;
  const q = cuadrosVivos('quieto', h.dir)?.[0] ?? cuadrosHeroe(e.heroe.clase, 'quieto', h.dir)[0];
  const [px, py] = aPant(h.x, h.y);
  const lat = latido(tl);
  siluetaEnPiso(q, px, py, -0.9, -0.35, k * 0.92, '#1a0302');
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  siluetaEnPiso(q, px, py, -0.9, -0.35, k * (0.5 + 0.5 * lat), '#b0180a');
  siluetaEnPiso(q, px - 1, py, -0.9, -0.35, k * 0.35 * lat, '#ff5a20');
  ctx.restore();
}
/** Humo y ceniza que se escapan del puño que apaga la Brasa. */
function humoPuno(e: EstadoToma, dt: number) {
  if (!e.j) return; const x = e.ax + HX + 0.2, y = e.ay + HY + 0.2;
  for (let i = 0; i < 3; i++) if (Math.random() < dt * 30) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 0.3, y: y + (Math.random() - 0.5) * 0.3, z: 26 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, vz: 10 + Math.random() * 14, t: 0, dur: 1.6 + Math.random(), color: Math.random() < 0.6 ? '#6a6a6e' : '#9a9aa0', tam: 1 + Math.random(), grav: -3, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ la Fragua que se enfría
/** Lo que es lava y fuego de la Fragua (el monumento, sus braseros, el río y las charcas). */
const LAVA = /mon_fragua|mon_fr_|rio_lava|charca_lava/;

// ------------------------------------------------------------------ las cenizas de Vesperio
/**
 * Donde cayó Vesperio: un montón de ceniza pálida (de pixel, con su sombra y lo que el viento le corrió), la partitura en el piso
 * que se quema por una esquina (el borde de brasa que avanza, lo quemado negro y lo que se va en pavesas) y una chispa violeta
 * que se suelta del montón y sube sola, con su luz. En el pase del mundo; `tl` el tiempo de la toma.
 */
function cenizasVesperio(e: EstadoToma, tl: number) {
  const [cx, cy] = aPant(e.ax + 3.6, e.ay + 3.7), X = Math.round(cx), Y = Math.round(cy);
  const hash = (n: number) => { const v = Math.sin(n * 91.7 + 17.3) * 43758.5453; return v - Math.floor(v); };
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // la sombra y el montón: capas de ceniza de afuera adentro, la de arriba más clara, con granos sueltos
  ctx.globalAlpha = 0.55; ctx.fillStyle = '#060406'; for (let y = -3; y <= 3; y++) { const w = Math.round(17 * Math.sqrt(1 - (y / 3.6) ** 2)); ctx.fillRect(X - w + 2, Y + y + 1, w * 2, 1); }
  ctx.globalAlpha = 1;
  const capas: [number, number, string][] = [[15, 5, '#4a4650'], [12, 7, '#6a6672'], [9, 9, '#8e8a96'], [6, 10, '#b4b0ba'], [3, 11, '#d4d0d8']];
  for (const [r, h, col] of capas) for (let dx = -r; dx <= r; dx++) { const f = 1 - (dx / (r + 0.5)) ** 2; const alto = Math.round(h * f * (0.85 + hash(dx + r * 31) * 0.3)); ctx.fillStyle = col; ctx.fillRect(X + dx, Y - alto, 1, Math.max(1, Math.round(alto * 0.5 + 1))); }
  for (let i = 0; i < 40; i++) { const a = hash(i) * 6.28, r = 12 + hash(i + 50) * 16; ctx.fillStyle = hash(i + 9) < 0.5 ? '#7a7680' : '#55515c'; ctx.fillRect(Math.round(X + Math.cos(a) * r), Math.round(Y + Math.sin(a) * r * 0.45), 1, 1); }
  // brasas violetas que todavía viven en el montón (laten)
  for (let i = 0; i < 7; i++) { const k = 0.5 + 0.5 * Math.sin(tl * (2 + hash(i) * 3) + i * 2); if (k < 0.35) continue; ctx.globalAlpha = k; ctx.fillStyle = k > 0.8 ? '#e8d0ff' : '#9a6ad8'; ctx.fillRect(Math.round(X - 8 + hash(i + 3) * 16), Math.round(Y - 2 - hash(i + 4) * 7), 1, 1); }
  ctx.globalAlpha = 1;
  // la partitura: una hoja tendida en el piso, a la derecha del montón, con su pentagrama y notas; se quema desde la esquina
  const PX = X + 20, PY = Y + 6, an = 22, al = 14, quema = Math.min(1, Math.max(0, (tl - 0.6) / 6.2)) * 0.7;
  for (let v = 0; v < al; v++) for (let u2 = 0; u2 < an; u2++) {
    const sx = PX + u2 - v, sy = PY + Math.round((u2 + v) * 0.5) - 6; // (la hoja en el plano del piso)
    const d = (an - u2) / an * 0.6 + (al - v) / al * 0.4 + hash(u2 * 13 + v) * 0.06; // (la esquina de atrás se va primero)
    if (d < quema - 0.06) continue; // (ya se fue)
    let col = '#cdbf9a'; if (v % 3 === 1 && v > 1 && v < al - 2) col = '#4a4038'; if (hash(u2 * 7 + v * 3) < 0.05 && v > 1) col = '#2a2420';
    if (d < quema) col = d < quema - 0.03 ? '#ff9a40' : '#ffd890'; else if (d < quema + 0.07) col = '#2a1a12';
    ctx.fillStyle = col; ctx.fillRect(sx, sy, 1, 1);
  }
  ctx.restore();
  // la chispa violeta: se suelta del montón y sube sola, meciéndose
  const s0 = 2.4, k = Math.min(1, Math.max(0, (tl - s0) / 0.4)) * (1 - Math.max(0, (tl - 6.2) / 0.6)); e.mem.chispa = null;
  if (k > 0.01) {
    const u = tl - s0, zc = 4 + u * u * 6 + u * 10, xs = X + Math.sin(u * 2.1) * 5, ys = Y - zc;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(xs, ys, 0, xs, ys, 14); g.addColorStop(0, `rgba(170,120,255,${0.55 * k})`); g.addColorStop(1, 'rgba(120,60,220,0)'); ctx.fillStyle = g; ctx.fillRect(xs - 14, ys - 14, 28, 28);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k; ctx.fillStyle = '#a874ff'; ctx.fillRect(Math.round(xs) - 1, Math.round(ys), 3, 1); ctx.fillRect(Math.round(xs), Math.round(ys) - 1, 1, 3);
    ctx.fillStyle = '#f4eaff'; ctx.fillRect(Math.round(xs), Math.round(ys), 1, 1);
    for (let i = 1; i < 6; i++) { ctx.globalAlpha = k * (1 - i / 6) * 0.7; ctx.fillStyle = '#7a4ad0'; ctx.fillRect(Math.round(X + Math.sin((u - i * 0.06) * 2.1) * 5), Math.round(Y - (4 + (u - i * 0.06) ** 2 * 6 + (u - i * 0.06) * 10)) + i, 1, 1); }
    ctx.restore();
    e.mem.chispa = [k, zc];
  }
}

// ------------------------------------------------------------------ el mar que se parte
/**
 * El mar de noche, muy al norte, pintado a pixel en su propio lienzo (sin zona: es lejos de todo lo que se camina): el cielo con
 * la luna y su reguero en el agua, las olas que corren a lo ancho y se apretan hacia el horizonte, y el tajo que nace cerca y
 * corre hasta el horizonte: el agua se abre en dos paredes con su cresta de espuma, el fondo negro y mojado en medio, y la
 * espuma que salta de las crestas. Se pega a puntos enteros.
 */
let lienzoMar: { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;
function marPartido(tl: number) {
  const LW = 320, LH = 180;
  if (!lienzoMar) { const c = document.createElement('canvas'); c.width = LW; c.height = LH; lienzoMar = { c, g: c.getContext('2d')! }; }
  const g = lienzoMar.g, hz = 62, hash = (n: number) => { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); };
  // el cielo: casi negro arriba, un azul de tormenta sobre el horizonte, nubes en bandas y alguna estrella
  for (let y = 0; y < hz; y++) { const f = y / hz; g.fillStyle = `rgb(${Math.round(4 + 14 * f)},${Math.round(6 + 18 * f)},${Math.round(12 + 30 * f)})`; g.fillRect(0, y, LW, 1); }
  for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i) * LW), y = Math.floor(hash(i + 70) * hz * 0.6); g.fillStyle = hash(i + 5) < 0.3 ? '#9aa8c0' : '#4a5468'; g.fillRect(x, y, 1, 1); }
  for (let y = 8; y < hz - 4; y += 1) for (let x = 0; x < LW; x += 1) { const n = Math.sin(x * 0.045 + y * 0.31 + tl * 0.08) + Math.sin(x * 0.11 - y * 0.2 + 2) * 0.6; if (n > 1.15) { g.fillStyle = y < 30 ? '#0e121c' : '#1a2030'; g.fillRect(x, y, 1, 1); } }
  // la luna, baja a la izquierda, y su halo
  const MX = 78, MY = 30; g.fillStyle = 'rgba(120,140,180,0.10)'; for (let r = 16; r > 7; r -= 3) { g.beginPath(); g.arc(MX, MY, r, 0, 7); g.fill(); }
  for (let y = -7; y <= 7; y++) for (let x = -7; x <= 7; x++) { const d = x * x + y * y; if (d > 49) continue; g.fillStyle = d > 36 ? '#9aa4b4' : (x + y < -3 ? '#e8ecf0' : hash(x * 9 + y) < 0.2 ? '#aab2be' : '#cfd6de'); g.fillRect(MX + x, MY + y, 1, 1); }
  // el agua, fila a fila: más oscura y las olas más juntas hacia el horizonte
  const prog = Math.min(1, Math.max(0, (tl - 1.2) / 4.2)), abre = Math.min(1, Math.max(0, (tl - 1.6) / 3.2)), mid = LW * 0.56;
  for (let y = hz; y < LH; y++) {
    const p = (y - hz) / (LH - hz), esc = 0.15 + p * 0.85; // (la profundidad: 0 en el horizonte)
    g.fillStyle = `rgb(${Math.round(5 + 10 * p)},${Math.round(9 + 16 * p)},${Math.round(16 + 22 * p)})`; g.fillRect(0, y, LW, 1);
    // el reguero de la luna
    for (let x = MX - 10 - p * 20; x < MX + 10 + p * 20; x++) if (Math.sin(x * 0.7 / esc + y * 1.3 + tl * 2) > 0.55) { g.fillStyle = p < 0.3 ? '#8a96ac' : '#5a6880'; g.fillRect(Math.round(x), y, 1, 1); }
    // las crestas de las olas
    for (let x = 0; x < LW; x++) { const n = Math.sin(x * 0.09 / esc + y * 0.9 - tl * 1.4 + hash(y) * 6) * Math.sin(x * 0.021 / esc + y * 0.37 + 1.3); if (n > 0.72) { g.fillStyle = n > 0.9 ? '#46566c' : '#26324a'; g.fillRect(x, y, 1, 1); } }
    // el tajo: nace cerca y corre hacia el horizonte
    const llega = 1 - prog; if (p < llega) continue;
    const ancho = (2 + abre * 46) * esc * Math.min(1, (p - llega) / 0.08 + 0.2), cx = mid + Math.sin(y * 0.15 + tl * 0.8) * esc * 1.5;
    // el fondo: negro mojado con un brillo
    g.fillStyle = '#020305'; g.fillRect(Math.round(cx - ancho), y, Math.round(ancho * 2), 1);
    if (hash(y * 3) < 0.25) { g.fillStyle = '#10161e'; g.fillRect(Math.round(cx + (hash(y) - 0.5) * ancho), y, 2, 1); }
  }
  // las paredes de agua a los dos lados del tajo, de lejos a cerca (lo cercano tapa lo lejano), con su cresta de espuma
  for (let y = hz; y < LH; y++) {
    const p = (y - hz) / (LH - hz), esc = 0.15 + p * 0.85; if (p < 1 - prog) continue;
    const ancho = (2 + abre * 46) * esc, cx = mid + Math.sin(y * 0.15 + tl * 0.8) * esc * 1.5, pared = Math.round(abre * 22 * esc);
    if (pared < 1) continue;
    for (const lado of [-1, 1]) {
      const x = Math.round(cx + lado * ancho);
      for (let h = 0; h < pared; h++) { const k = h / pared; g.fillStyle = k > 0.85 ? (hash(y * 7 + h + lado) < 0.5 ? '#e6eef2' : '#b8c8d4') : k > 0.6 ? '#3e5268' : lado < 0 ? '#16243a' : '#0c1626'; g.fillRect(x - (lado < 0 ? 0 : 1), y - h, 2, 1); }
      // espuma que salta de la cresta
      if (hash(y * 13 + Math.floor(tl * 9) + lado) < 0.3) { g.fillStyle = '#d8e4ea'; g.fillRect(x + lado * Math.round(hash(y + tl) * 3), y - pared - 1 - Math.round(hash(y * 5 + tl) * 3), 1, 1); }
    }
  }
  // al pegar: la pantalla entera, a puntos enteros, con el temblor
  const esc = Math.max(W / LW, H / LH), ox = Math.round((W - LW * esc) / 2), oy = Math.round((H - LH * esc) / 2);
  const tiembla = tl > 1.4 && tl < 5 ? (5 - tl) / 3.6 : 0, sx = Math.round((Math.random() - 0.5) * 4 * tiembla), sy = Math.round((Math.random() - 0.5) * 3 * tiembla);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(lienzoMar.c, ox + sx, oy + sy, LW * esc, LH * esc);
  // la viñeta
  const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, Math.hypot(W, H) / 2); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.7)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

// ------------------------------------------------------------------ Ysmeral que sube
/** El agua que baja: la ciudad sube del fondo, así que el mar se retira por la pantalla de arriba abajo con su línea de espuma. */
function aguaQueBaja(e: EstadoToma, tl: number) {
  const u = Math.min(1, Math.max(0, (tl - 0.2) / 6.5)), s = u * u * (3 - 2 * u); if (s >= 1) return;
  const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const yw = a.y + (b.y - a.y) * (0.05 + s * 1.05);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(6,20,24,0.78)'; ctx.fillRect(a.x, yw, b.x - a.x, b.y - yw + 2);
  // la línea del agua: espuma rota y lo que chorrea
  for (let x = Math.floor(a.x); x < b.x; x++) {
    const o = Math.sin(x * 0.21 + tl * 3) * 1.2 + Math.sin(x * 0.05 - tl) * 2;
    ctx.fillStyle = Math.sin(x * 1.7 + tl * 5) > 0.2 ? '#9cc4c4' : '#4a7a80'; ctx.fillRect(x, Math.round(yw + o), 1, 1);
    if (Math.sin(x * 0.9 + tl * 2) > 0.85) { ctx.fillStyle = 'rgba(160,200,200,0.5)'; ctx.fillRect(x, Math.round(yw + o) + 2, 1, 2); }
  }
  ctx.restore();
  void e;
}

/**
 * El barco de Oyá (la pieza `cine_barco` de catalogo/cine.ts, que la toma pone en su copia del pueblo): la cubierta queda a
 * `CUBIERTA` del piso y el dibujo va corrido `BARCO_ATRAS` celdas hacia la cámara (los mismos números que la pieza). Oyá va de pie
 * en la proa (`PROA`, relativo al ancla).
 */
const CUBIERTA = 30, BARCO_ATRAS = 1.2, PROA: [number, number] = [2.5, -2.5];
/** En el barco varado: un punto libre cerca del medio del pueblo (donde va el barco). */
const anclaCubierta = (z: Zona): [number, number] => { const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };

// ------------------------------------------------------------------ el guion
const OZM = 'senor_demonio';
const sala = { zona: 'a5_santuario2', ancla: anclaJefe } as const;
const tomas: Toma[] = [
  {
    // el Corazón de la Brasa: Ozmaren de rodillas; el golpe corta a ×3 y su muerte horneada a cámara lenta
    id: 'ozmaren', dur: 10, ...sala, entra: 1.6, sale: 0.4, oscuridad: 0.8, hundir: 0.6,
    cam: [{ t: 0, x: 3.2, y: 1.4, alt: 70, zoom: 2, fy: 0.52 }, { t: 3.05, x: 2.2, y: 0.5, alt: 72, c: 'suave' }, { t: 3.06, x: 1.2, y: -0.4, alt: 66, zoom: 3, fy: 0.5 }, { t: 9.6, x: 1.0, y: -0.3, alt: 50, c: 'suave' }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.5, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.36 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX + 1.3, y: HY + 0.5, mira: [0, 0] }, { t: 2.2, x: HX + 1.3, y: HY + 0.5 }, { t: 3.0, x: HX, y: HY, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'ozm', z: 80, r: 230 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'lava', color: [255, 90, 40], sombra: true, titila: 0.15, claves: [{ t: 0, x: -2, y: 3, z: 40, r: 280, k: 0.8 }, { t: 5.5, k: 0.8 }, { t: 9.5, k: 0.35, c: 'suave' }] },
      { id: 'frio', color: [140, 120, 160], claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.3 }] },
    ],
    sonidos: [{ t: 0, id: 'ozmaren', cine: true }, { t: 1.2, id: 'grunido', vol: 0.8 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.84 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.8, id: 'golpe', cine: true }, { t: 5.8, id: 'sub', cine: true }],
    temblores: [[5.8, 0.6, 4]],
    paso: (e, tl) => vez(e, 'sangre', tl, 5.8, () => charco(e, 'c1', 0.3, 0.3, 0.5, 2.2)),
    textos: [L(0, 6.0, 9.7)],
  },
  {
    // la Brasa rueda: de la ceniza del cuerpo sale la Brasa y rueda hasta los pies del héroe
    id: 'rueda', dur: 8, ...sala, entra: 0.3, sale: 0.3, oscuridad: 0.88, hundir: 0.7,
    cam: [{ t: 0, x: 1.4, y: -0.2, alt: 26, zoom: 3, fy: 0.56 }, { t: 8, x: PIES[0], y: PIES[1], alt: 22, c: 'suave' }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [0, 0] }, { t: 4.4, mira: [PIES[0], PIES[1] + 1] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.0, y: 1.6, mira: [0, 0] }, { t: 3.6, acc: 'especial', dur: 0.9, mira: [PIES[0], PIES[1]] }, { t: 4.5, acc: 'quieto', mira: [PIES[0], PIES[1]] }] },
    ],
    brasa: [{ t: 0.6, x: 0.2, y: 0.2, z: 3, k: 0, tam: 0.4 }, { t: 1.6, z: 4, k: 0.7, tam: 0.8 }, { t: 4.2, x: PIES[0], y: PIES[1], z: 4, k: 1, tam: 1, c: 'sale' }, { t: 8, x: PIES[0], y: PIES[1], z: 4, k: 1 }],
    focos: [{ de: 'brasa', r: 170 }, { de: 'heroe', z: 34, r: 130, k: 0.8 }],
    luces: [{ id: 'lava', color: [255, 90, 40], claves: [{ t: 0, x: -2, y: 3, z: 40, r: 240, k: 0.3 }] }],
    sonidos: [{ t: 0.6, id: 'brasa_nace', cine: true }, { t: 1.6, id: 'rueda', cine: true }, ...[4.6, 5.7, 6.8].map((t) => ({ t, id: 'latido', cine: true }))],
    paso: (e, tl, dt) => { vez(e, 'sangre', tl, 0, () => charco(e, 'c', 0.3, 0.3, 2.0, 2.2)); vez(e, 'sale', tl, 1.6, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 4, 20, 0.6)); if (e.j && tl < 3 && Math.random() < dt * 20) ceniza(e.j, e.ax, e.ay, 1, '#4a4440'); },
    textos: [R(0, 1.0, 7.8)],
  },
  {
    // la Marca responde: de cerca, la Brasa a los pies y el brazo que late al mismo ritmo
    id: 'marca', dur: 9, ...sala, entra: 0.25, sale: 0.25, oscuridad: 0.92, hundir: 0.72,
    cam: [{ t: 0, x: HX - 0.1, y: HY + 0.2, alt: 28, zoom: 4, fy: 0.5 }, { t: 9, x: HX - 0.1, y: HY + 0.25, alt: 26 }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [PIES[0], PIES[1] + 1] }] },
    ],
    brasa: [{ t: 0, x: PIES[0], y: PIES[1], z: 4, k: 1, tam: 1 }, { t: 9, z: 4, k: 1 }],
    focos: [{ de: 'heroe', z: 30, r: 150 }],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true }, ...[0.05, 1.15, 2.25, 3.35, 4.45, 5.55, 6.65, 7.75].map((t, i) => ({ t, id: 'latido', cine: true, vol: 1 + i * 0.08 }))],
    paso: (e, tl) => { charco(e, 'c', 0.3, 0.3, 2.2, 2.2); luzMarca(e, tl, 1); },
    textos: [R(1, 0.6, 4.4), R(2, 4.6, 8.8)],
  },
  {
    // el primer plano: la Marca late en el brazo, al ritmo de la Brasa (si el grande no se pintó, no va)
    id: 'rostro', dur: 6, entra: 0.15, sale: 0.4,
    omitir: (e) => !rostroListo(e.heroe),
    sonidos: [...[0.05, 1.15, 2.25, 3.35, 4.45, 5.55].map((t) => ({ t, id: 'latido', cine: true, vol: 1.4 }))],
    pantalla: (e, tl) => { ctx.save(); ctx.fillStyle = '#030202'; ctx.fillRect(0, 0, W, H); ctx.restore(); dibujarRostro(e.heroe, tl, latido(tl), Math.min(1, tl / 0.8)); },
  },
  {
    // la elección: la escena quieta y oscura; la película se para al final de esta toma hasta que se elige (main.ts)
    id: 'eleccion', dur: 3, ...sala, pausa: true, entra: 0.3, sale: 0, oscuridad: 0.94, hundir: 0.78,
    omitir: (e) => !!finalDe(e.heroe),
    cam: [{ t: 0, x: HX - 0.4, y: HY + 0.3, alt: 30, zoom: 3, fy: 0.42 }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [PIES[0], PIES[1] + 1] }] },
    ],
    brasa: [{ t: 0, x: PIES[0], y: PIES[1], z: 4, k: 1, tam: 1.1 }, { t: 3, z: 4, k: 1 }],
    focos: [{ de: 'brasa', r: 160 }, { de: 'heroe', z: 30, r: 120, k: 0.7 }],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true }],
    paso: (e, tl) => { charco(e, 'c', 0.3, 0.3, 2.2, 2.2); luzMarca(e, tl, 1); },
    pantalla: (_e, tl) => botonesEleccion(tl),
    textos: [R(3, 0.4, 99999)],
  },
  {
    // destruir: el héroe levanta la Brasa y la aprieta en el puño hasta que deja de latir; humo, ceniza y la Marca que se pone gris
    id: 'destruir', dur: 9, ...sala, entra: 0.3, sale: 0.6, oscuridad: 0.9, hundir: 0.72,
    omitir: (e) => finalDe(e.heroe) !== 'destruir',
    cam: [{ t: 0, x: HX - 0.2, y: HY + 0.2, alt: 34, zoom: 3, fy: 0.5 }, { t: 9, x: HX - 0.1, y: HY + 0.2, alt: 38, c: 'suave' }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [PIES[0], PIES[1] + 1] }, { t: 2.6, acc: 'lanzar', dur: 1.2, ritmo: 0.35, dir: 's' }, { t: 5.4, acc: 'quieto', dir: 's' }] },
    ],
    brasa: [{ t: 0, x: PIES[0], y: PIES[1], z: 4, k: 1, tam: 1 }, { t: 1.0, k: 1 }, { t: 2.6, x: HX + 0.2, y: HY + 0.2, z: 28, k: 1, tam: 0.8, c: 'sale' }, { t: 3.4, k: 0.9, tam: 0.6 }, { t: 4.6, k: 0, tam: 0.2, c: 'entra' }],
    focos: [{ de: 'heroe', z: 30, r: 150 }],
    sonidos: [{ t: 2.6, id: 'brasa_vuela', cine: true, vol: 0.4 }, { t: 3.4, id: 'apaga', cine: true }, ...[0.4, 1.5, 2.6, 3.5].map((t, i) => ({ t, id: 'latido', cine: true, vol: 1 - i * 0.2 }))],
    paso: (e, tl, dt) => { charco(e, 'c', 0.3, 0.3, 2.2, 2.2); luzMarca(e, tl, tl < 4.6 ? 1 : 0.8, Math.min(1, Math.max(0, (tl - 3.6) / 1.4))); if (tl > 3.4 && tl < 7.5) humoPuno(e, dt); },
    textos: [L(1, 4.8, 8.6)],
  },
  {
    // absorber: el héroe lleva la Brasa al pecho y la Marca la bebe; su sombra en el piso se vuelve roja y late
    id: 'absorber', dur: 9, ...sala, entra: 0.3, sale: 0.6, oscuridad: 0.9, hundir: 0.72,
    omitir: (e) => finalDe(e.heroe) !== 'absorber',
    cam: [{ t: 0, x: HX - 0.2, y: HY + 0.2, alt: 34, zoom: 3, fy: 0.5 }, { t: 9, x: HX - 0.5, y: HY + 0.6, alt: 30, c: 'suave' }],
    actores: [
      { id: 'ozm', tipo: 'mon', mon: OZM, claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [PIES[0], PIES[1] + 1] }, { t: 2.6, acc: 'lanzar', dur: 1.2, ritmo: 0.3, dir: 's' }, { t: 5.4, acc: 'quieto', dir: 's' }] },
    ],
    brasa: [{ t: 0, x: PIES[0], y: PIES[1], z: 4, k: 1, tam: 1 }, { t: 1.0, k: 1 }, { t: 3.2, x: HX + 0.05, y: HY + 0.05, z: 36, k: 1, tam: 0.9, c: 'sale' }, { t: 3.9, z: 36, k: 0, tam: 0.3, c: 'entra' }],
    focos: [{ de: 'heroe', z: 30, r: 160 }],
    sonidos: [{ t: 2.6, id: 'brasa_vuela', cine: true, vol: 0.4 }, { t: 3.9, id: 'sub', cine: true }, ...[3.9, 5.0, 6.1, 7.2].map((t) => ({ t, id: 'latido', cine: true, vol: 1.3 }))],
    temblores: [[3.9, 0.4, 2]],
    paso: (e, tl) => { charco(e, 'c', 0.3, 0.3, 2.2, 2.2); vez(e, 'bebe', tl, 3.9, () => estallido(e.brasa, (e.ax + HX - e.ay - HY) * 16, (e.ax + HX + e.ay + HY) * 8 - 36, 40, 1)); luzMarca(e, tl, tl < 3.9 ? 0.6 : 1); },
    suelo: (e, tl) => sombraTibia(e, tl, Math.min(1, Math.max(0, (tl - 4.0) / 1.5))),
    textos: [L(2, 4.8, 8.6)],
  },
  {
    // la Fragua se enfría: las cintas de lava se apagan de abajo arriba, la boca se oscurece, sube humo negro y el cielo se cierra
    id: 'fragua', dur: 8, zona: 'a5_rio', ancla: anclaSalida('a5_fragua'), entra: 0.6, sale: 0.6, oscuridad: 0.66, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a5_fragua'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 280, zoom: 0.6, fy: 0.5 }, { t: 8, x: 7, y: 7, alt: 300, c: 'suave' }],
    focos: [{ de: [-6, -6], z: 260, r: 440, k: 0.75 }],
    luces: [
      { id: 'boca', color: [255, 110, 40], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 30, r: 320, k: 1.1 }, { t: 2, k: 1.1 }, { t: 6.5, k: 0.05, c: 'suave' }] },
      { id: 'cielo', color: [255, 60, 30], claves: [{ t: 0, x: -10, y: -10, z: 700, r: 1200, k: 0.45 }, { t: 7, k: 0.08, c: 'suave' }] },
      { id: 'luna', color: [110, 120, 150], claves: [{ t: 0, x: -6, y: -6, z: 500, r: 900, k: 0 }, { t: 4, k: 0 }, { t: 7.5, k: 0.3, c: 'suave' }] },
    ],
    lucesZona: 1,
    sonidos: [{ t: 0, id: 'fragua_enfria', cine: true }],
    paso: (e, tl, dt) => {
      // (los fuegos de la zona se apagan con la lava)
      if (e.j) (e.j as any).lucesZonaCine = Math.max(0, 1 - Math.max(0, (tl - 1.5) / 4.5));
      if (e.j && tl > 1.5 && Math.random() < dt * 25) e.j.particulas.push({ x: e.ax - 6 + (Math.random() - 0.5) * 6, y: e.ay - 6 + (Math.random() - 0.5) * 6, z: 200 + Math.random() * 120, vx: 0.3, vy: -0.2, vz: 30 + Math.random() * 20, t: 0, dur: 3 + Math.random() * 2, color: Math.random() < 0.5 ? '#1a1616' : '#2c2626', tam: 2 + Math.random() * 2, grav: -2, tipo: 'ceniza' } as any);
    },
    mundo: (e, tl) => enfriarPiezas(e, LAVA, Math.max(0, (tl - 1.5) / 5)),
  },
  {
    // las cenizas de Vesperio delante de la boca ya fría: un montón pálido con brasas violetas, la partitura que se quema por el
    // borde y una chispa violeta que se suelta y sube sola
    id: 'cenizas', dur: 7, zona: 'a5_rio', ancla: anclaSalida('a5_fragua'), entra: 0.5, sale: 0.6, oscuridad: 0.9, hundir: 0.74, lucesZona: 0,
    preparar: (e) => despejarPies(e, 3.5, 3.5, 3.5),
    cam: [{ t: 0, x: 4.3, y: 4.2, alt: 24, zoom: 3, fy: 0.6 }, { t: 7, x: 4.1, y: 4.0, alt: 44, c: 'suave' }],
    focos: [{ de: [3.9, 3.9], z: 6, r: 150 }],
    luces: [
      { id: 'ves', color: [150, 100, 235], claves: [{ t: 0, x: 3.7, y: 3.8, z: 10, r: 110, k: 0.55 }, { t: 6, k: 0.3 }] },
      { id: 'papel', color: [255, 150, 70], claves: [{ t: 0, x: 4.6, y: 4.4, z: 3, r: 60, k: 0.0 }, { t: 1.2, k: 0.55 }, { t: 6.6, k: 0.35 }] },
      { id: 'luna', color: [110, 120, 150], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.18 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.84, vol: 0.6 }],
    paso: (e, tl, dt) => {
      if (e.j && Math.random() < dt * 6) ceniza(e.j, e.ax + 3.6, e.ay + 3.7, 1, '#b8a8d8');
      const c = e.mem.chispa, Ls = lucesDe(e); if (c && Ls) Ls.push({ id: 'chispa', x: e.ax + 3.6, y: e.ay + 3.7, z: c[1], r: 70, c: [170, 120, 255], k: 0.7 * c[0], sinSombra: true });
    },
    mundo: (e, tl) => { enfriarPiezas(e, LAVA, 1); cenizasVesperio(e, tl); },
    textos: [L(3, 2.4, 6.6)],
  },
  {
    // el mar se parte: muy al norte, de noche, un tajo corre hacia el horizonte y el agua se levanta en dos paredes
    id: 'mar', dur: 9, entra: 0.6, sale: 0.6,
    sonidos: [{ t: 0, id: 'mar_parte', cine: true }],
    pantalla: (_e, tl) => marPartido(tl),
    textos: [L(4, 2.0, 8.6)],
  },
  {
    // Ysmeral sube: la Catedral de las Campanas Ahogadas sale del agua, escorada y chorreando; las campanas suenan solas
    id: 'ysmeral', dur: 10, zona: 'a6_barrio2', ancla: anclaSalida('a6_catedral1'), entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a6_catedral1'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 320, zoom: 0.6, fy: 0.5 }, { t: 10, x: 6, y: 6, alt: 360, c: 'suave' }],
    focos: [{ de: [-6, -6], z: 300, r: 460, k: 0.8 }],
    luces: [
      { id: 'luna', color: [130, 160, 170], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.45 }] },
      { id: 'verdin', color: [90, 200, 170], sombra: true, claves: [{ t: 0, x: -4, y: -4, z: 200, r: 360, k: 0.25 }, { t: 5, k: 0.6, c: 'suave' }] },
    ],
    sonidos: [{ t: 0.4, id: 'campanas_ahogadas', cine: true }],
    temblores: [[0.4, 3, 1.5]],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 40) e.j.particulas.push({ x: e.ax - 4 + (Math.random() - 0.5) * 10, y: e.ay - 4 + (Math.random() - 0.5) * 10, z: 120 + Math.random() * 260, vx: 0, vy: 0, vz: -60 - Math.random() * 40, t: 0, dur: 1.5, color: '#8ab4c0', tam: 1, grav: 60, tipo: 'ceniza' } as any); void tl; },
    mundo: (e, tl) => aguaQueBaja(e, tl),
    textos: [L(5, 2.0, 9.6)],
  },
  {
    // el barco varado: Oyá sola en la proa de su barco, en la arena de la costa, mirando hacia la ciudad; las campanas lejos
    id: 'oya', dur: 8, zona: 'a6_barco', ancla: anclaCubierta, objetos: ['cine_barco|varado'], entra: 0.6, sale: 0.6, oscuridad: 0.84, hundir: 0.5, lucesZona: 0.3,
    preparar: (e) => {
      despejarPies(e, 0, 0, 9); const z = e.z;
      if (z && !z.objetos.some((o) => o.capa === 'cine')) z.objetos.push({ id: 'cine_barco', v: 'varado', cx: e.ax - 0.5 - BARCO_ATRAS, cy: e.ay - 0.5 - BARCO_ATRAS, hw: 1, hh: 1, bloquea: false, capa: 'cine' } as any);
    },
    cam: [{ t: 0, x: 1.6, y: 0.4, alt: 64, zoom: 2, fy: 0.56 }, { t: 8, x: 2.0, y: -0.2, alt: 70, c: 'suave' }],
    actores: [{ id: 'oya', tipo: 'sprite', sprite: 'oya', claves: [{ t: 0, x: PROA[0], y: PROA[1], dir: 'ne' }, { t: 4.5, dir: 'n' }] }],
    focos: [{ de: [0.6, -0.6], z: 40, r: 300, k: 0.8 }, { de: 'oya', z: 70, r: 120 }],
    luces: [
      { id: 'farol', color: [255, 176, 100], sombra: true, titila: 0.12, claves: [{ t: 0, x: 5.0, y: -4.8, z: 44, r: 190, k: 0.95 }] },
      { id: 'luna', color: [120, 140, 180], sombra: true, claves: [{ t: 0, x: -8, y: -2, z: 300, r: 800, k: 0.42 }] },
    ],
    sonidos: [{ t: 0, id: 'campana', cine: true, tono: 0.7, vol: 0.4 }, { t: 3.2, id: 'campana', cine: true, tono: 0.66, vol: 0.35 }, { t: 0.5, id: 'tema_oya', cine: true }],
    paso: (e) => { const m = e.actores.get('oya') as any; if (m) m.alto = CUBIERTA; },
    textos: [L(6, 1.6, 7.6)],
  },
  { id: 'acto6', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 6) },
];

export const CINE_ACTO5: Guion = { id: 'acto5', acto: 5, tomas };
void sombraTibia;
