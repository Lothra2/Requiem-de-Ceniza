// El cierre del acto 4, «La casa está casi lista» (unos 68 s): Hjaldur se sienta otra vez en su trono de hielo y esta vez no se
// levanta; la brasa sale envuelta en vaho (y, si Vigdis se entregó al trono, antes sale el calor que él le robó y vuelve al
// Fortín), cruza la Boca del Aliento, Vesperio la mira pasar junto al gigante del glaciar y da las gracias, en el Fortín Vigdis
// deja la lámpara encendida o su tumba sigue tibia, la brasa entra en la Fragua bajo el cielo rajado de la Herida, y en el brazo
// del héroe la Marca ya no duele: late. Cartel del acto 5. Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx, W, H } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { libreCerca, type Zona } from '../mundo/zona';
import { estallido } from '../render/brasa_cine';
import { decisionDe } from '../juego/historia';
import type { DatosHeroe } from '../juego/heroe';
import { dibujarRostro, rostroListo } from './cine_rostro';
import { brasaEn, type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, VIOLETA, anclaJefe, anclaSalida, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, latido } from './cine_kit';
import { anclaHito } from './cine_acto3';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(4, n, t0, t1, o);

/** ¿Vigdis se entregó al trono? (sin elección cuenta como salvada) */
const sacrificada = (d: DatosHeroe) => decisionDe(d, 'vigdis') === 'sacrificar';
const lucesDe = (e: EstadoToma): any[] | null => ((e.j as any)?.lucesCine as any[] | undefined) ?? null;

// ------------------------------------------------------------------ el trono
/** El trono de hielo junto a Hjaldur (el asiento de la sala queda lejos del ruedo): la muerte horneada lo echa de espaldas, así que cae junto al trono, que queda al costado de su hombro y no le tapa las piernas. */
const TRONO: [number, number] = [-3.2, -1.0];
function ponerTrono(e: EstadoToma) {
  const z = e.z; if (!z || z.objetos.some((o) => o.capa === 'cine')) return;
  despejarPies(e, TRONO[0], TRONO[1], 2.6);
  z.objetos.push({ id: 'hie2_trono', v: 'vacio', cx: Math.floor(e.ax + TRONO[0]), cy: Math.floor(e.ay + TRONO[1]), hw: 1, hh: 1, bloquea: false, capa: 'cine' } as any);
}
/** La escarcha del piso que se raja hacia afuera desde el cuerpo: grietas de pixel blancas y azules que corren. */
function grietasHielo(e: EstadoToma, tl: number, t0: number) {
  const u = Math.min(1, Math.max(0, (tl - t0) / 0.9)); if (u <= 0) return;
  const [cx, cy] = aPant(e.ax, e.ay);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let r = 0; r < 9; r++) {
    let a = r * 0.7 + 0.3, x = cx, y = cy; const largo = (40 + ((r * 37) % 30)) * u;
    for (let s = 0; s < largo; s += 1) {
      a += Math.sin(r * 5.1 + s * 0.37) * 0.12; x += Math.cos(a); y += Math.sin(a) * 0.5;
      ctx.globalAlpha = 0.85 * (1 - s / 80); ctx.fillStyle = '#1c2a40'; ctx.fillRect(Math.round(x), Math.round(y) + 1, 1, 1);
      ctx.fillStyle = s < largo - 3 ? '#cfe4ff' : '#ffffff'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
    }
  }
  ctx.restore();
}
/** Vaho de un punto (la brasa en el frío, la tumba tibia). */
function vahoEn(e: EstadoToma, x: number, y: number, z: number, n: number, dt: number, color = '#b8c4d2') {
  if (!e.j) return;
  for (let i = 0; i < n; i++) if (Math.random() < dt * 30) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 0.6, y: y + (Math.random() - 0.5) * 0.6, z: z + Math.random() * 6, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, vz: 6 + Math.random() * 10, t: 0, dur: 1.6 + Math.random() * 1.2, color: Math.random() < 0.5 ? color : '#8a96a8', tam: 1 + Math.random() * 1.2, grav: -2, tipo: 'ceniza' } as any);
}
/**
 * El calor de Vigdis: una luz chica, tibia y dorada (no la brasa: no arde, no late), que sale del pecho del rey y se va sola
 * hacia el sur. Núcleo de pixel de 3 x 3 con su halo, y su luz en el mundo.
 */
function calorVigdis(e: EstadoToma, tl: number) {
  if (tl < 1.0) return; const u = Math.min(1, (tl - 1.0) / 4.2), s = u * u * (3 - 2 * u);
  const x = e.ax + 0.1 + s * 9, y = e.ay + 0.1 + s * 6, z = 10 + 50 * Math.min(1, (tl - 1.0) / 1.4) + s * 60, k = Math.min(1, (tl - 1.0) / 0.6) * (1 - Math.max(0, (u - 0.85) / 0.15));
  const Ls = lucesDe(e); if (Ls && k > 0.02) Ls.push({ id: 'calor', x, y, z, r: 120, c: [255, 200, 120], k: 0.8 * k, sinSombra: false });
  e.mem.calor = [x, y, z, k];
}
function dibujarCalor(e: EstadoToma, tl: number) {
  const c = e.mem.calor; if (!c || c[3] <= 0.02) return; const [x, y, z, k] = c, [px, py] = aPant(x, y), X = Math.round(px), Y = Math.round(py - z);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(X, Y, 0, X, Y, 22); g.addColorStop(0, `rgba(255,210,140,${0.5 * k})`); g.addColorStop(1, 'rgba(255,160,80,0)'); ctx.fillStyle = g; ctx.fillRect(X - 22, Y - 22, 44, 44);
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = k;
  const resp = 0.85 + 0.15 * Math.sin(tl * 2.2);
  ctx.fillStyle = '#ffcf8a'; ctx.fillRect(X - 2, Y - 1, 4, 3); ctx.fillRect(X - 1, Y - 2, 2, 5);
  ctx.globalAlpha = k * resp; ctx.fillStyle = '#fff4d8'; ctx.fillRect(X - 1, Y - 1, 2, 2);
  ctx.restore();
}

// ------------------------------------------------------------------ el Fortín
/** Adentro del Fortín, frente al portón del norte (el que da a los picos), con el pabellón de delante fuera (lo saca `preparar`). */
export const anclaPuertaFortin = (z: Zona): [number, number] => { const sa = z.salidas.find((q) => q.destino === 'a4_picos'); if (!sa) { const q = libreCerca(z, z.W / 2, 12); return [q[0] + 0.5, q[1] + 0.5]; } return [sa.cx + 4, sa.cy + 2.7]; };
/** La lámpara de Vigdis: un farol de pixel en su mano, con la llama que tiembla (y más cuando pasa la brasa). */
function lampara(e: EstadoToma, tl: number) {
  const v = e.actores.get('vigdis') as any; if (!v) return;
  const [px, py] = aPant(v.x, v.y), X = Math.round(px + 6), Y = Math.round(py - 22);
  const tiembla = tl > 3.0 && tl < 4.4 ? Math.sin(tl * 40) * 0.5 + 0.5 : Math.sin(tl * 9) * 0.2 + 0.8;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2a2018'; ctx.fillRect(X - 2, Y - 6, 5, 1); ctx.fillRect(X, Y - 8, 1, 2); ctx.fillRect(X - 2, Y + 1, 5, 1);
  ctx.fillStyle = '#3a2c20'; ctx.fillRect(X - 2, Y - 5, 1, 6); ctx.fillRect(X + 2, Y - 5, 1, 6);
  ctx.fillStyle = '#ffb860'; ctx.fillRect(X - 1, Y - 5, 3, 6);
  ctx.fillStyle = '#fff0c0'; ctx.globalAlpha = tiembla; ctx.fillRect(X, Y - 3 - Math.round(tiembla), 1, 2 + Math.round(tiembla));
  ctx.restore();
  const Ls = lucesDe(e); if (Ls) Ls.push({ id: 'lampara', x: v.x + 0.3, y: v.y + 0.2, z: 12, r: 150, c: [255, 170, 90], k: 1.0 * (0.8 + 0.2 * tiembla), sinSombra: false });
}

/**
 * Nieve sobre todo el piso del Fortín (el portón tiene pasto: el norte es nieve): una capa pareja con su textura (ondas que dejó
 * el viento, lo azulado en lo hondo, pisadas viejas) y briznas de pasto seco que asoman, nada verde. Se pinta una vez en su propio
 * lienzo, a puntos del dibujo, del ancho de lo que ve la toma, y se pega cada cuadro con lo plano del piso (debajo de todo lo
 * que está de pie).
 */
export function nievePiso(e: EstadoToma, r: number) {
  const RX = r * 16, RY = r * 8;
  if (!e.mem.nieve) {
    const c = document.createElement('canvas'); c.width = RX * 2; c.height = RY * 2; const g = c.getContext('2d')!;
    const ruido = (x: number, y: number) => { const v = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return v - Math.floor(v); };
    const suave = (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const a = ruido(xi, yi), b = ruido(xi + 1, yi), cc = ruido(xi, yi + 1), d = ruido(xi + 1, yi + 1); return a + (b - a) * fx + (cc - a) * fy + (a - b - cc + d) * fx * fy; };
    const img = g.createImageData(c.width, c.height), D = img.data;
    for (let y = 0; y < c.height; y++) for (let x = 0; x < c.width; x++) {
      const wx = e.ax * 16 + x - RX, wy = e.ay * 8 + y - RY;
      // (la orilla del lienzo se deshace en el borde: el resto del piso queda bajo la viñeta)
      const d = ((x - RX) / RX) ** 2 + ((y - RY) / RY) ** 2; if (d > 1 - suave(wx / 7, wy / 4) * 0.12) continue;
      const n = suave(wx / 11, wy / 6) * 0.6 + suave(wx / 3.5, wy / 2) * 0.3 + ruido(wx, wy) * 0.1;
      const onda = Math.sin(wx * 0.11 + wy * 0.35 + suave(wx / 20, wy / 10) * 4) * 0.5 + 0.5;
      let r0 = 168 + n * 40 + onda * 10, g0 = 178 + n * 38 + onda * 9, b0 = 196 + n * 30 + onda * 6;
      if (n < 0.34) { r0 -= 46; g0 -= 38; b0 -= 18; } // (lo hondo, azulado)
      if (onda > 0.93) { r0 += 14; g0 += 14; b0 += 12; } // (la cresta de la onda)
      const i = (y * c.width + x) * 4; D[i] = Math.min(255, r0); D[i + 1] = Math.min(255, g0); D[i + 2] = Math.min(255, b0); D[i + 3] = 255;
      // pasto seco que asoma (ocre, nunca verde) en matas ralas
      if (suave(wx / 9 + 40, wy / 5) > 0.72 && ruido(wx * 3, wy * 7) < 0.22) { D[i] = 120; D[i + 1] = 104; D[i + 2] = 70; }
      else if (suave(wx / 9 + 40, wy / 5) > 0.68 && ruido(wx * 5, wy * 3) < 0.12) { D[i] = 84; D[i + 1] = 72; D[i + 2] = 52; }
    }
    g.putImageData(img, 0, 0);
    // pisadas viejas que van y vienen hacia el portón
    g.fillStyle = 'rgba(120,134,160,0.55)';
    for (let k = 0; k < 14; k++) { const x = RX - 30 + k * 4 + (k % 2) * 3, y = RY + 18 - k * 2.6 + (k % 2) * 2; g.fillRect(Math.round(x), Math.round(y), 2, 1); }
    e.mem.nieve = c;
  }
  const [cx, cy] = aPant(e.ax, e.ay);
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(e.mem.nieve, Math.round(cx - RX), Math.round(cy - RY)); ctx.restore();
}
/**
 * La raja del cielo sobre la Herida: baja quebrada en zigzag desde la esquina de arriba a la izquierda hacia el medio del cielo,
 * abierta en el medio y en punta en las dos puntas; las nubes negras de alrededor toman su rojo, y el humo de la Fragua sube y se
 * mete en ella. Con una luz roja que baja hasta la boca. En el pase del mundo, en lo alto de la pantalla.
 */
function rajaCielo(e: EstadoToma, tl: number) {
  const m = ctx.getTransform(), inv = m.inverse(), a = inv.transformPoint(new DOMPoint(0, 0)), b = inv.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const x0 = a.x, alto = b.y - a.y, ancho = b.x - a.x, lat = 0.85 + 0.15 * Math.sin(tl * 2.3);
  const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };
  // la traza: de la esquina de arriba hacia el medio, en tramos de largo y quiebre dispares (siempre los mismos)
  const P0: [number, number] = [x0 + ancho * 0.06, a.y + alto * 0.1], P1: [number, number] = [x0 + ancho * 0.6, a.y + alto * 0.36];
  const pts: [number, number][] = [P0]; let u = 0, lado = 1;
  // (tramos de largo dispar, a veces dos seguidos para el mismo lado, y el quiebre de altura dispar: nada de dientes iguales)
  for (let i = 1; u < 0.94; i++) { u += 0.035 + hash(i * 3) * 0.1; if (hash(i * 5 + 1) < 0.72) lado = -lado; const q = 0.15 + hash(i) * hash(i + 9) * 1.6; pts.push([P0[0] + (P1[0] - P0[0]) * Math.min(1, u) + (hash(i + 20) - 0.5) * ancho * 0.012, P0[1] + (P1[1] - P0[1]) * Math.min(1, u) + lado * q * alto * 0.03]); }
  pts.push(P1);
  // muestras a lo largo, con el ancho de la boca (abierta en el medio)
  const mu: [number, number, number][] = []; let largo = 0; for (let i = 1; i < pts.length; i++) largo += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  let rec = 0; const wMax = Math.max(7, alto * 0.046) * (0.92 + 0.08 * Math.sin(tl * 1.7));
  for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], L = Math.hypot(bx - ax, by - ay); for (let s2 = 0; s2 < L; s2 += 0.7) { const u = (rec + s2) / largo; mu.push([ax + (bx - ax) * s2 / L, ay + (by - ay) * s2 / L, wMax * Math.pow(Math.sin(Math.PI * u), 0.8) * (0.7 + 0.5 * hash(Math.floor((rec + s2) / 3)))]); } rec += L; }
  const cMid = mu[Math.floor(mu.length * 0.5)];
  // el cielo: lo alto del cuadro se oscurece, y las nubes negras en bandas toman el rojo cerca de la raja
  { ctx.save(); const gc = ctx.createLinearGradient(0, a.y, 0, a.y + alto * 0.5); gc.addColorStop(0, 'rgba(6,2,2,1)'); gc.addColorStop(0.65, 'rgba(10,3,3,0.85)'); gc.addColorStop(1, 'rgba(10,3,3,0)'); ctx.fillStyle = gc; ctx.fillRect(x0, a.y, ancho, alto * 0.5); ctx.restore(); }
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const dSeg = (x: number, y: number) => { const vx = P1[0] - P0[0], vy = P1[1] - P0[1], k = Math.max(0, Math.min(1, ((x - P0[0]) * vx + (y - P0[1]) * vy) / (vx * vx + vy * vy))); return Math.hypot(x - P0[0] - vx * k, y - P0[1] - vy * k); };
  const Q = 3;
  for (let y = a.y + alto * 0.02; y < a.y + alto * 0.5; y += Q) for (let x = x0; x < b.x; x += Q) {
    const n = Math.sin(x * 0.018 + y * 0.05 + tl * 0.12) + Math.sin(x * 0.041 - y * 0.03 + 1.7 - tl * 0.08) * 0.7 + Math.sin(x * 0.09 + y * 0.11) * 0.3;
    if (n < 0.55) continue;
    const cerca = Math.max(0, 1 - dSeg(x, y) / (alto * 0.22)), f = Math.min(1, (n - 0.55) * 1.6), bajo = 1 - (y - a.y) / (alto * 0.5);
    const r = Math.round(14 + 30 * f + 150 * cerca * cerca * lat), g = Math.round(8 + 10 * f + 22 * cerca * cerca), bb = Math.round(10 + 10 * f);
    ctx.globalAlpha = Math.min(1, 0.55 + 0.4 * f) * Math.min(1, bajo * 2.2); ctx.fillStyle = `rgb(${r},${g},${bb})`; ctx.fillRect(Math.round(x), Math.round(y), Q, Q);
  }
  ctx.globalAlpha = 1;
  // el humo de la Fragua: una columna que sube torcida desde la boca y entra por el medio de la raja
  const [bx0, by0] = aPant(e.ax - 1, e.ay - 1), top: [number, number] = [bx0, by0 - 240];
  for (let k = 0; k < 90; k++) {
    const u = k / 90, ph = tl * 0.35 + u; const x = top[0] + (cMid[0] - top[0]) * u * u + Math.sin(ph * 6 + k) * (6 + u * 10), y = top[1] + (cMid[1] - top[1]) * u + Math.cos(ph * 5 + k * 0.7) * 4;
    const r = Math.round(5 + 7 * (1 - u)); const cerca = u > 0.7 ? (u - 0.7) / 0.3 : 0;
    ctx.globalAlpha = 0.35 + 0.25 * hash(k); ctx.fillStyle = cerca > 0.3 ? '#4a1410' : hash(k + 3) < 0.5 ? '#1e1616' : '#2c2222';
    ctx.fillRect(Math.round(x - r), Math.round(y - r * 0.7), r * 2, Math.round(r * 1.4));
  }
  ctx.globalAlpha = 1;
  // el resplandor de la raja y la luz que baja hasta la boca
  ctx.globalCompositeOperation = 'lighter';
  const gr = ctx.createRadialGradient(cMid[0], cMid[1], 0, cMid[0], cMid[1], alto * 0.35); gr.addColorStop(0, `rgba(255,60,20,${0.35 * lat})`); gr.addColorStop(1, 'rgba(160,20,10,0)'); ctx.fillStyle = gr; ctx.fillRect(cMid[0] - alto * 0.35, cMid[1] - alto * 0.35, alto * 0.7, alto * 0.7);
  const [bx, by] = aPant(e.ax, e.ay), gb = ctx.createLinearGradient(0, cMid[1], 0, by);
  gb.addColorStop(0, `rgba(255,50,20,${0.22 * lat})`); gb.addColorStop(1, 'rgba(255,50,20,0.03)');
  ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(cMid[0] - 20, cMid[1]); ctx.lineTo(cMid[0] + 20, cMid[1]); ctx.lineTo(bx + 70, by); ctx.lineTo(bx - 70, by); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // la raja: labio negro, carne roja, fuego y el alma al blanco, a pixel
  const capa = (f: number, mas: number, col: string) => { ctx.fillStyle = col; for (const [x, y, w] of mu) { const q = Math.max(1, Math.round(w * f + mas)); ctx.fillRect(Math.round(x - q / 2), Math.round(y - q / 2), q, q); } };
  capa(1, 3, '#120101'); capa(1, 0, '#6e0a06'); capa(0.72, 0, '#c01e0e'); capa(0.45, 0, '#f06024'); capa(0.18, 0, '#ffd890');
  // grietas finas que salen de los quiebres
  for (let i = 2; i < pts.length - 1; i += 2) { let [x, y] = pts[i], an = (i % 4 ? -1 : 1) * (0.9 + hash(i) * 0.8); for (let s2 = 0; s2 < 10 + hash(i * 3) * 14; s2++) { if (s2 % 4 === 0) an += (hash(i * 7 + s2) - 0.5) * 1.2; x += Math.cos(an); y += Math.sin(an); ctx.fillStyle = s2 < 6 ? '#8a1208' : '#3a0504'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } }
  ctx.restore();
}
/** El humo que sube y entra en la raja. */
function humoRaja(e: EstadoToma, dt: number) {
  if (!e.j) return; for (let i = 0; i < 2; i++) if (Math.random() < dt * 20) e.j.particulas.push({ x: e.ax - 2 + (Math.random() - 0.5) * 8, y: e.ay - 2 + (Math.random() - 0.5) * 8, z: 140 + Math.random() * 80, vx: 0, vy: 0, vz: 50 + Math.random() * 30, t: 0, dur: 4, color: Math.random() < 0.5 ? '#1c1616' : '#342828', tam: 2 + Math.random() * 2, grav: -4, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ el guion
const tomas: Toma[] = [
  {
    // el trono de hielo: Hjaldur de pie delante de su trono; el golpe corta a ×3, cae sentado contra el trono y la escarcha se raja
    id: 'trono', dur: 10, zona: 'a4_hielo2', ancla: anclaJefe, objetos: ['hie2_trono|vacio'], preparar: ponerTrono, entra: 1.6, sale: 0.4, oscuridad: 0.82, hundir: 0.6,
    cam: [{ t: 0, x: 3.0, y: 1.4, alt: 56, zoom: 2, fy: 0.52 }, { t: 3.05, x: 2.0, y: 0.5, alt: 60, c: 'suave' }, { t: 3.06, x: 0.6, y: -0.4, alt: 56, zoom: 3, fy: 0.5 }, { t: 9.6, x: 0.2, y: -0.6, alt: 46, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_escarcha', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.5, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.4, dir: 's' }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.8, y: -0.4, mira: [0, 0] }, { t: 2.2, x: 3.8, y: -0.4 }, { t: 3.0, x: 2.5, y: -0.9, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'rey', z: 70, r: 210 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'hielo', color: [130, 170, 230], sombra: true, claves: [{ t: 0, x: -2, y: 2.5, z: 70, r: 260, k: 0.6 }] },
      { id: 'fuego', color: [255, 150, 80], sombra: true, titila: 0.12, claves: [{ t: 0, x: 3, y: 3, z: 40, r: 200, k: 0.35 }] },
    ],
    sonidos: [{ t: 0, id: 'dron_frio', cine: true }, { t: 1.2, id: 'grunido', vol: 0.7 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.89 }, { t: 3.3, id: 'golpe_metal' }, { t: 5.6, id: 'golpe', cine: true }, { t: 5.6, id: 'hielo_cruje', cine: true }],
    temblores: [[5.6, 0.5, 3]],
    mundo: (e, tl) => grietasHielo(e, tl, 5.6),
    textos: [L(0, 6.0, 9.7)],
  },
  {
    // (si Vigdis se entregó) el calor que el trono le robó sale del pecho del rey, tibio, y se va solo al sur
    id: 'calor', dur: 6.5, zona: 'a4_hielo2', ancla: anclaJefe, objetos: ['hie2_trono|vacio'], preparar: ponerTrono, entra: 0.3, sale: 0.5, oscuridad: 0.9, hundir: 0.72,
    omitir: (e) => !sacrificada(e.heroe),
    cam: [{ t: 0, x: 0.6, y: -0.2, alt: 30, zoom: 3, fy: 0.55 }, { t: 6.5, x: 1.6, y: 0.6, alt: 60, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_escarcha', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.5, y: -0.9, mira: [0, 0] }, { t: 2.4, mira: [4, 2] }] },
    ],
    focos: [{ de: [0.2, 0.2], z: 30, r: 150 }, { de: 'heroe', z: 34, r: 110, k: 0.7 }],
    luces: [{ id: 'hielo', color: [130, 170, 230], claves: [{ t: 0, x: -2, y: 2.5, z: 70, r: 240, k: 0.4 }] }],
    sonidos: [{ t: 0.8, id: 'nana', cine: true }],
    paso: (e, tl) => calorVigdis(e, tl),
    mundo: (e, tl) => dibujarCalor(e, tl),
    textos: [L(1, 2.0, 6.2)],
  },
  {
    // la brasa del frío: sale del pecho envuelta en vaho; el héroe retrocede con la escarcha encima, Thor se sacude
    id: 'brasa', dur: 8, zona: 'a4_hielo2', ancla: anclaJefe, objetos: ['hie2_trono|vacio'], preparar: ponerTrono, entra: 0.25, sale: 0.5, oscuridad: 0.9, hundir: 0.7,
    cam: [{ t: 0, x: 1.0, y: -0.2, alt: 26, zoom: 3, fy: 0.55 }, { t: 4.4, x: 0.9, y: -0.2, alt: 40, c: 'suave' }, { t: 5.8, x: 0.8, y: -0.3, alt: 84, c: 'entra' }, { t: 8, x: 0.8, y: -0.3, alt: 92 }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_escarcha', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.5, y: -0.9, mira: [0, 0] }, { t: 3.2, x: 2.5, y: -0.9 }, { t: 4.0, x: 3.1, y: -1.3, c: 'sale' }, { t: 4.1, mira: [0.2, 0.2] }, { t: 5.9, dir: 'no' }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.0, y: 1.6, mira: [0, 0] }, { t: 3.4, acc: 'especial', dur: 0.9, mira: [1, 0.5] }, { t: 4.3, acc: 'quieto', mira: [0.2, 0.2] }] },
    ],
    focos: [{ de: 'brasa', r: 200 }, { de: 'heroe', z: 34, r: 120, k: 0.75 }],
    brasa: [{ t: 0.7, x: 0.15, y: 0.15, z: 6, k: 0, tam: 0.35 }, { t: 2.0, z: 12, k: 0.5, tam: 0.5 }, { t: 3.6, z: 40, k: 0.9, tam: 0.9, c: 'sale' }, { t: 5.0, z: 48, k: 1, tam: 1 }, { t: 6.0, z: 560, k: 1, c: 'entra' }],
    luces: [{ id: 'hielo', color: [130, 170, 230], claves: [{ t: 0, x: -2, y: 2.5, z: 70, r: 240, k: 0.35 }] }],
    sonidos: [{ t: 0.7, id: 'brasa_nace', cine: true }, { t: 3.4, id: 'grunido' }, { t: 3.6, id: 'latido', cine: true }, { t: 5.3, id: 'brasa_vuela', cine: true }],
    temblores: [[5.5, 0.5, 2]],
    paso: (e, tl, dt) => {
      vez(e, 'pecho', tl, 2.0, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 10, 26, 0.6));
      const b = brasaEn(e, tl); if (b && b.k > 0.1) vahoEn(e, b.x, b.y, b.z, 2, dt);
      if (tl < 6) vahoEn(e, e.ax + 0.2, e.ay + 0.2, 6, 1, dt * 0.5);
    },
    mundo: (e, tl) => grietasHielo(e, tl + 9, 0),
    textos: [L(2, 3.2, 7.6)],
  },
  {
    // la Boca del Aliento: la brasa sale por el arco portal de la sierpe, entre los jarls de piedra; el cuerno, lejos
    id: 'boca', dur: 9, zona: 'a4_glaciar', ancla: anclaSalida('a4_hielo1'), entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45, sinBruma: true,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a4_hielo1'); },
    cam: [{ t: 0, x: 7, y: 7, alt: 250, zoom: 0.6, fy: 0.5 }, { t: 9, x: 9, y: 6, alt: 230, c: 'suave' }],
    brasa: [{ t: 0.4, x: -2, y: -2, z: 40, k: 1, tam: 1.6 }, { t: 3.5, x: 4, y: 4, z: 120, k: 1, c: 'suave' }, { t: 6.5, x: 14, y: 8, z: 200, k: 1, c: 'suave' }, { t: 9, x: 24, y: 10, z: 240, k: 0.8, tam: 1.2, c: 'lineal' }],
    focos: [{ de: [-4, -4], z: 200, r: 380, k: 0.8 }, { de: 'brasa', r: 260 }],
    luces: [
      { id: 'luna', color: [140, 160, 210], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.45 }] },
      { id: 'boca', color: [255, 120, 60], sombra: true, claves: [{ t: 0, x: -1, y: -1, z: 50, r: 240, k: 0.8 }, { t: 2, k: 0.2 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true }, { t: 0.5, id: 'brasa_vuela', cine: true }, { t: 3.0, id: 'cuerno', cine: true }],
    paso: (e, tl, dt) => { const b = brasaEn(e, tl); if (b) vahoEn(e, b.x, b.y, b.z, 2, dt); },
  },
  {
    // Vesperio junto al gigante del glaciar: solo en la nieve; la brasa baja hasta su cara y él la mira con algo de celos, sin
    // tocarla. Da las gracias y se va hacia el sur
    id: 'vesperio', dur: 9, zona: 'a4_glaciar', ancla: anclaHito, luzBrasa: 0.2, lucesZona: 0.12, entra: 0.6, sale: 0.9, oscuridad: 0.92, hundir: 0.84, sinBruma: true, filo: 1.4, sinClima: ['fx_niebla', 'fx_ventisca', 'fx_nieve'],
    preparar: (e) => despejarPies(e, 4.4, 4.4, 3.5),
    cam: [{ t: 0, x: 4.6, y: 4.6, alt: 54, zoom: 3, fy: 0.58 }, { t: 9, x: 4.3, y: 4.3, alt: 58, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#1c1428', 0.55], claves: [{ t: 0, x: 4.4, y: 4.4, dir: 'no', acc: 'quieto' }, { t: 2.6, mira: [6, 3] }, { t: 4.6, dir: 's' }, { t: 7.0, x: 4.4, y: 4.4, alfa: 1, acc: 'caminar', mira: [8, 9] }, { t: 8.8, x: 5.4, y: 5.6, alfa: 0, c: 'lineal' }] },
    ],
    brasa: [{ t: 0.4, x: -1, y: -1, z: 120, k: 0.7, tam: 0.7 }, { t: 2.6, x: 6.6, y: 2.6, z: 96, k: 0.3, tam: 0.5, c: 'sale' }, { t: 4.4, x: 7.2, y: 2.6, z: 100, k: 0.3, c: 'suave' }, { t: 6.4, x: 14, y: 6, z: 160, k: 0.6, tam: 0.5, c: 'entra' }],
    focos: [{ de: 'vesperio', z: 50, r: 120, k: 0.6 }, { de: 'brasa', r: 70, k: 0.5 }],
    luces: [
      { id: 'ves', color: [120, 96, 210], sombra: true, titila: 0.08, claves: [{ t: 0, x: 6.2, y: 5.4, z: 70, r: 140, k: 0.42 }, { t: 7.0, k: 0.45 }, { t: 8.8, k: 0 }] },
      { id: 'canto', color: [140, 80, 240], claves: [{ t: 0, x: 3.4, y: 3.2, z: 66, r: 110, k: 1.35 }, { t: 7.0, k: 1.4 }, { t: 8.8, k: 0 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.89 }, { t: 0, id: 'viento_nieve', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * (tl > 7 ? 30 : 6)) ceniza(e.j, m.x, m.y, tl > 7 ? 2 : 1, '#9e96ae'); const b = brasaEn(e, tl); if (b) vahoEn(e, b.x, b.y, b.z, 1, dt); },
    textos: [L(3, 4.8, 8.2, { tono: VIOLETA })],
  },
  {
    // el Fortín, Vigdis viva: en la puerta del norte con su lámpara, mirando la montaña; la llama tiembla cuando la brasa pasa
    id: 'fortin', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, entra: 0.6, sale: 0.6, oscuridad: 0.86, hundir: 0.66, sinBruma: true, sinClima: ['fx_ventisca', 'fx_niebla'],
    omitir: (e) => sacrificada(e.heroe),
    preparar: (e) => despejarPies(e, 1.5, 2.5, 5),
    cam: [{ t: 0, x: 0.9, y: 1.1, alt: 40, zoom: 3, fy: 0.6 }, { t: 8, x: 0.6, y: 0.8, alt: 46, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'vigdis', claves: [{ t: 0, x: 0, y: 0, dir: 's' }, { t: 2.8, dir: 'e' }, { t: 5.8, dir: 'se' }] }],
    brasa: [{ t: 3.0, x: -7, y: -1, z: 56, k: 0.75, tam: 0.6 }, { t: 6.4, x: 3, y: -9, z: 70, k: 0.75, c: 'lineal' }],
    focos: [{ de: 'vigdis', z: 30, r: 140 }],
    luces: [{ id: 'luna', color: [90, 120, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.32 }] }],
    sonidos: [{ t: 0, id: 'nana', cine: true }],
    suelo: (e) => nievePiso(e, 15),
    mundo: (e, tl) => lampara(e, tl),
    textos: [L(4, 3.6, 7.6)],
  },
  {
    // el Fortín, Vigdis entregada: su tumba en la nieve junto a la puerta; la nieve se derrite alrededor de la piedra y sube vaho
    id: 'tumba', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, objetos: ['cem_lapida_cruz|intacta'], entra: 0.6, sale: 0.6, oscuridad: 0.86, hundir: 0.66, sinBruma: true, sinClima: ['fx_ventisca', 'fx_niebla'],
    omitir: (e) => !sacrificada(e.heroe),
    preparar: (e) => { despejarPies(e, 1.5, 2.5, 5); if (e.z && !e.z.objetos.some((o) => o.capa === 'cine')) e.z.objetos.push({ id: 'cem_lapida_cruz', v: 'intacta', cx: Math.floor(e.ax), cy: Math.floor(e.ay), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); },
    cam: [{ t: 0, x: 1.0, y: 1.3, alt: 30, zoom: 3, fy: 0.6 }, { t: 8, x: 0.7, y: 1.0, alt: 36, c: 'suave' }],
    brasa: [{ t: 3.0, x: -7, y: -1, z: 56, k: 0.75, tam: 0.6 }, { t: 6.4, x: 3, y: -9, z: 70, k: 0.75, c: 'lineal' }],
    focos: [{ de: [0.3, 0.6], z: 10, r: 130 }],
    luces: [
      { id: 'luna', color: [120, 140, 190], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.2 }] },
      { id: 'tibia', color: [255, 190, 130], claves: [{ t: 0, x: 0.4, y: 0.8, z: 6, r: 90, k: 0.4 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.5 }],
    suelo: (e) => nievePiso(e, 15),
    paso: (e, tl, dt) => { vez(e, 'charco', tl, 0, () => { if (e.j) e.j.manchas.push({ x: e.ax + 0.4, y: e.ay + 0.8, r: 0.9, rmax: 1.2, color: '#5a6270', t: 0, tipo: 'hielo', forma: 'charco', sem: 2 } as any); }); vahoEn(e, e.ax + 0.4, e.ay + 0.8, 2, 1, dt * 0.6, '#d8dde6'); },
    textos: [L(5, 3.6, 7.6)],
  },
  {
    // la Herida: el cielo rajado en rojo sobre la Fragua de Ozmaren; la brasa entra por la boca encendida y la lava se aviva
    id: 'herida', dur: 9, zona: 'a5_rio', ancla: anclaSalida('a5_fragua'), entra: 0.7, sale: 0.6, oscuridad: 0.6, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a5_fragua'); },
    cam: [{ t: 0, x: 9, y: 9, alt: 200, zoom: 0.6, fy: 0.68 }, { t: 9, x: 6, y: 6, alt: 230, c: 'suave' }],
    brasa: [{ t: 0, x: 26, y: 20, z: 280, k: 1, tam: 1.4 }, { t: 3.6, x: 7, y: 7, z: 90, k: 1, c: 'suave' }, { t: 6.0, x: 0.5, y: 0.5, z: 30, k: 1, tam: 1, c: 'suave' }, { t: 6.6, x: 0, y: 0, z: 26, k: 0, tam: 0.6 }],
    focos: [{ de: [-6, -6], z: 260, r: 440, k: 0.8 }, { de: 'brasa', r: 240 }],
    luces: [
      { id: 'herida', color: [255, 50, 30], claves: [{ t: 0, x: -10, y: -10, z: 700, r: 1200, k: 0.4 }, { t: 6.2, k: 0.4 }, { t: 6.8, k: 0.75, c: 'sale' }, { t: 9, k: 0.55 }] },
      { id: 'boca', color: [255, 110, 40], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 30, r: 220, k: 0.4 }, { t: 6.2, k: 0.4 }, { t: 6.8, k: 1.2, r: 340, c: 'sale' }, { t: 9, k: 0.8 }] },
    ],
    sonidos: [{ t: 0, id: 'herida', cine: true }, { t: 0.3, id: 'brasa_vuela', cine: true, vol: 0.6 }, { t: 6.5, id: 'sub', cine: true }],
    temblores: [[6.5, 0.6, 3]],
    mundo: (e, tl) => rajaCielo(e, tl),
    paso: (e, tl, dt) => { humoRaja(e, dt); vez(e, 'entra', tl, 6.5, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 30, 50, 1)); },
    textos: [L(6, 1.4, 8.6)],
  },
  {
    // el primer plano: el grande de la vigilia; la Marca ya no duele, late fuerte y tira del brazo
    id: 'rostro', dur: 8, entra: 0.15, sale: 1.2,
    omitir: (e) => !rostroListo(e.heroe),
    sonidos: [{ t: 0, id: 'dron_marca', cine: true }, ...[0.4, 1.3, 2.15, 2.95, 3.7, 4.4, 5.05, 5.65, 6.2].map((t, i) => ({ t, id: 'latido', cine: true, vol: 1 + i * 0.1 }))],
    pantalla: (e, tl) => {
      ctx.save(); ctx.fillStyle = '#030202'; ctx.fillRect(0, 0, W, H); ctx.restore();
      // el latido se apura: de 1,1 s a 0,55 s entre golpes
      const fase = tl < 0.4 ? 0 : (tl - 0.4) * (1 + tl * 0.14);
      dibujarRostro(e.heroe, tl, latido(fase), Math.min(1, tl / 1.2));
    },
    textos: [L(7, 1.2, 4.2), L(8, 4.4, 7.6)],
  },
  { id: 'acto5', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 5) },
];

export const CINE_ACTO4: Guion = { id: 'acto4', acto: 4, tomas };
void charco; void H;
