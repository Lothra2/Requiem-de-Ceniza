// El muñeco del inventario: el héroe de pie en su nicho, con exactamente lo que lleva (el mismo motor y el mismo equipo
// que en el mundo), en pixel art a puntos enteros de la pantalla, con luz de retrato, sombra en el piso, la respiración del
// reposo, el arma viva si la tiene, y se puede girar (arrastrar con el ratón o el dedo, las flechas del teclado o los
// botoncitos del nicho).
//
// Antes era un render liso del motor a doble muestra, reducido a la mitad: borroso, pálido, siempre mirando al mismo lado
// y pintado en el hilo principal cada vez que se cambiaba algo (un tirón de medio segundo).
//
// Cómo se dibuja: todo va a un lienzo propio a la resolución del muñeco (un punto del lienzo = d puntos de la pantalla,
// d entero) y se pega a la pantalla sin suavizado, con la transformación del aparato. El héroe viene pintado a K veces su
// alto (motor/muneco.ts) para que llene el nicho sin ampliar el sprite chico: en 1280 × 720 K≈1,4 y d=1, en 1920 × 1080
// K≈2,1 y d=1, en el iPad y el teléfono d=2 o 3.
import { ctx, E, pulso } from '../nucleo/lienzo';
import { NICHO } from '../../../src/engine/gotico/hud';
import { cuadrosMuneco, RUMBOS, type CuadroM } from '../motor/muneco';
import { cuadrosVivos } from '../motor/pintor';
import { cuadrosHeroe, dibujar, type Cuadro } from '../motor/assets';
import { equipoVisual, firmaVisual, cuerpoDe } from '../juego/heroe';
import { armaViva, llamaArmaAtras, dibujarDerrames, pozoArma, type ElemArma } from '../render/arma_viva';
import { lienzoTrabajo } from '../motor/lienzos';
import type { Juego } from '../juego/mundo';

/** Rumbo que mira el muñeco (índice en RUMBOS). De frente, un poco hacia su derecha: se ve la cara y el escudo. */
let rumbo = RUMBOS.indexOf('s');
let arrastre: { x0: number; r0: number } | null = null;
let tPrev = 0;
/** Quien lleva el arma viva del muñeco (su estado de llama y su latido, aparte del héroe del mundo). */
const portador = { acc: 'quieto', t: 0, id: 911 };
/** Lo que suelta el arma del muñeco (en puntos del muñeco, no del mundo). */
const pozo: unknown[] = [];
let escenario: { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } | null = null;
let info: Record<string, unknown> = {};
let vestido: { k: string; eq: any; f: string } | null = null;
/** Alto de referencia del héroe en el mundo (ancla del reposo de frente): los del juego miden unos 80. */
const altoRef = (clase: string) => cuadrosHeroe(clase, 'quieto', 's')[0]?.ay ?? 80;

export function girarMuneco(n: number) { rumbo = (((rumbo + n) % 8) + 8) % 8; }
(window as any).__munecoGirar = girarMuneco;
(window as any).__muneco = () => info;

/** El muñeco en el nicho del panel de inventario (x, y: la esquina del panel). `ocupado`: hay algo en la mano (no se arrastra). */
export function munecoInventario(j: Juego, x: number, y: number, t: number, ocupado: boolean) {
  const h = j.heroe, d0 = h.d, N = NICHO;
  const ahora = performance.now() / 1000, dt = tPrev ? Math.min(0.1, ahora - tPrev) : 0.016; tPrev = ahora;
  // ---- girar: arrastrar en el nicho, las flechas o los botoncitos de abajo
  const nx = x + N.x, ny = y + N.y, B = 11, by = ny + N.h - B - 3, bIzq = nx + 3, bDer = nx + N.w - B - 3;
  const en = (ax: number, ay: number, w: number, hh: number) => E.x >= ax && E.x < ax + w && E.y >= ay && E.y < ay + hh;
  if (!ocupado && E.clicIzq && en(bIzq, by, B, B)) { E.clicIzq = false; girarMuneco(1); }
  else if (!ocupado && E.clicIzq && en(bDer, by, B, B)) { E.clicIzq = false; girarMuneco(-1); }
  else if (!ocupado && E.clicIzq && en(nx, ny, N.w, N.h)) { E.clicIzq = false; arrastre = { x0: E.x, r0: rumbo }; }
  if (arrastre) {
    if (!E.izq) arrastre = null;
    // (arrastrar a la derecha gira el frente hacia la derecha, como un muñeco en una tornamesa)
    else { rumbo = arrastre.r0; girarMuneco(-Math.round((E.x - arrastre.x0) / 20)); }
  }
  if (pulso('ArrowLeft')) girarMuneco(1);
  if (pulso('ArrowRight')) girarMuneco(-1);
  const dir = RUMBOS[rumbo];

  // ---- dónde cae el nicho en la pantalla de verdad (puntos del aparato)
  const m = ctx.getTransform();
  const ins = 3;
  const X0 = Math.ceil(m.a * (nx + ins) + m.e), Y0 = Math.ceil(m.d * (ny + ins) + m.f);
  const X1 = Math.floor(m.a * (nx + N.w - ins) + m.e), Y1 = Math.floor(m.d * (ny + N.h - ins) + m.f);
  const DW = X1 - X0, DH = Y1 - Y0; if (DW < 20 || DH < 20) return;
  // ---- la escala: el héroe ocupa ~78 % del alto del nicho. d entero (puntos de pantalla por punto del muñeco) y K el
  // tamaño al que se pinta (sin pasar de KMAX: más grande el cuerpo del motor no aguanta, mejor puntos dobles)
  const KMAX = (window as any).__munecoKmax ?? 2.2, ref = altoRef(d0.clase), meta = DH * 0.78;
  let d = 1; while (meta / (ref * d) > KMAX) d++;
  const K = Math.max(1, Math.round((meta / (ref * d)) * 10) / 10);
  const sw = Math.floor(DW / d), sh = Math.floor(DH / d);
  const OX = X0 + Math.floor((DW - sw * d) / 2), OY = Y0 + Math.floor((DH - sh * d) / 2);

  // ---- los cuadros: los del muñeco si están, los del equipo anterior mientras se pinta, y si no hay nada todavía el
  // sprite del mundo a escala entera (nunca un hueco)
  // (el equipo visual y su firma se arman solo cuando cambia lo puesto, no en cada cuadro)
  const ke = d0.clase + '|' + Object.entries(d0.equipo).map(([k, o]) => k + ':' + (o ? o.uid + '.' + o.engarces.length : '')).join(',');
  if (!vestido || vestido.k !== ke) vestido = { k: ke, eq: equipoVisual(d0), f: firmaVisual(d0) };
  const r = cuadrosMuneco(d0.clase, cuerpoDe(d0.clase), vestido.eq, vestido.f, K, dir);
  let q: CuadroM | null = null, qm: Cuadro | null = null, s = 1;
  const fase = Math.floor(t * 5.4);
  if (r.fs?.length) q = r.fs[fase % r.fs.length];
  else { const fs = cuadrosVivos('quieto', dir) ?? cuadrosHeroe(d0.clase, 'quieto', dir); qm = fs[fase % Math.max(1, fs.length)] ?? null; s = Math.max(1, Math.round(K)); }

  // ---- el escenario
  if (!escenario) { const cv = document.createElement('canvas'); escenario = { cv, c: cv.getContext('2d')! }; }
  const { cv, c } = escenario;
  if (cv.width !== sw || cv.height !== sh) { cv.width = sw; cv.height = sh; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false;
  c.clearRect(0, 0, sw, sh);
  const px = Math.round(sw / 2), py = sh - Math.max(6, Math.round(sh * 0.085));
  const kc = q ? K : s; // tamaño del cuerpo respecto del sprite del mundo
  // luz de la antorcha detrás, a la altura del pecho: separa la silueta del fondo oscuro del nicho
  {
    const cy = py - ref * kc * 0.55, rr = ref * kc * 0.75, pul = 0.92 + 0.05 * Math.sin(t * 7.3) + 0.03 * Math.sin(t * 17.1);
    const g = c.createRadialGradient(px - rr * 0.15, cy, 1, px, cy, rr);
    g.addColorStop(0, `rgba(255,170,90,${0.2 * pul})`); g.addColorStop(0.55, `rgba(200,110,50,${0.08 * pul})`); g.addColorStop(1, 'rgba(120,60,30,0)');
    c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(0, 0, sw, sh); c.globalCompositeOperation = 'source-over';
  }
  // el piso: un charco de luz cálida y la sombra a los pies, a puntos enteros (anillos, no un degradé liso)
  pedestal(c, px, py, Math.round(15 * kc), t);
  // ---- el arma viva: lo de detrás del cuerpo, el cuerpo, y encima el filo y su materia
  const ar = d0.equipo.arma as any, el = (h.c.vivo ?? (ar && (ar.rareza === 'unico' || ar.rareza === 'legendario') ? 'acero' : null)) as ElemArma | null;
  const hoja = q ? q.hoja : qm?.hoja ? (qm.hoja as number[]).map((v, i) => (i === 4 ? v : v * s)) : undefined;
  const vivo = !!(el && (el as string) !== 'fisico' && hoja && !(window as any).__sinDerrame);
  // (lo vivo se dibuja a la escala del mundo, ampliado K: la llama y las chispas guardan su tamaño respecto del arma)
  const qv = vivo ? ({ hoja: hoja!.map((v, i) => (i === 4 ? v : v / kc)) } as any) : null;
  pozoArma(pozo);
  try {
    if (vivo) { c.save(); c.translate(px, py); c.scale(kc, kc); llamaArmaAtras(c, portador, qv, 0, 0, 1, el!, h.c.tipoArma, t, dt, 0, 0); c.restore(); }
    if (q) c.drawImage(q.cv, px - q.ax, py - q.ay);
    else if (qm) dibujar(c, qm, px, py, s);
    if (vivo) {
      c.save(); c.translate(px, py); c.scale(kc, kc);
      armaViva(c, portador, qv, 0, 0, 1, el!, h.c.tipoArma, t, dt, 0, 0, 1, false);
      dibujarDerrames(c, 0, 0, dt);
      c.restore();
    } else pozo.length = 0;
  } finally { pozoArma(); }
  // ---- a la pantalla: a puntos enteros del aparato, sin suavizado
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0, sw, sh, OX, OY, sw * d, sh * d);
  ctx.restore();
  // ---- los botoncitos de girar (flechas de pixel, se encienden al pasar)
  for (const [bx, lado] of [[bIzq, -1], [bDer, 1]] as const) flecha(bx, by, B, lado, en(bx, by, B, B) && !ocupado);
  // ---- para las pruebas
  const rc = ctx.canvas.getBoundingClientRect(), kx = rc.width / ctx.canvas.width, ky = rc.height / ctx.canvas.height;
  info = { listo: r.listo, viejo: r.viejo, progreso: r.progreso, K, d, dir, mundo: !q, css: [rc.left + X0 * kx, rc.top + Y0 * ky, DW * kx, DH * ky], vivo: vivo ? el : null };
}

/** La sombra a los pies y la luz en el piso del nicho, en anillos de pixel. */
function pedestal(c: CanvasRenderingContext2D, px: number, py: number, rx: number, t: number) {
  const ry = Math.max(3, Math.round(rx * 0.42));
  // el charco de luz de la antorcha (ancho, tenue, cálido)
  const RX = Math.round(rx * 2.3), RY = Math.round(ry * 2.1), pul = 0.9 + 0.1 * Math.sin(t * 5.1);
  c.globalCompositeOperation = 'lighter';
  for (let k = 3; k >= 1; k--) {
    const ex = Math.round((RX * k) / 3), ey = Math.max(1, Math.round((RY * k) / 3));
    c.fillStyle = `rgba(255,150,70,${0.035 * pul})`;
    for (let yy = -ey; yy <= ey; yy++) { const w = Math.round(ex * Math.sqrt(1 - (yy * yy) / (ey * ey + 0.01))); c.fillRect(px - w, py + yy, w * 2 + 1, 1); }
  }
  c.globalCompositeOperation = 'source-over';
  // la sombra: tres anillos, más negra al centro
  for (const [k, a] of [[1, 0.22], [0.72, 0.22], [0.45, 0.25]] as const) {
    const ex = Math.round(rx * k), ey = Math.max(1, Math.round(ry * k));
    c.fillStyle = `rgba(4,2,1,${a})`;
    for (let yy = -ey; yy <= ey; yy++) { const w = Math.round(ex * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ey * ey + 0.01)))); c.fillRect(px - w + 1, py + yy, w * 2 - 1, 1); }
  }
}

/** Una flecha de pixel (lado -1 izquierda, 1 derecha) con su placa, en coordenadas del panel. */
function flecha(x: number, y: number, B: number, lado: number, encima: boolean) {
  const { cv, c } = lienzoTrabajo(B, B);
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, B, B); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.fillStyle = encima ? 'rgba(40,28,16,0.9)' : 'rgba(14,10,8,0.55)'; c.fillRect(1, 1, B - 2, B - 2);
  c.fillStyle = encima ? '#c8a050' : '#5a4630'; c.fillRect(0, 1, 1, B - 2); c.fillRect(B - 1, 1, 1, B - 2); c.fillRect(1, 0, B - 2, 1); c.fillRect(1, B - 1, B - 2, 1);
  const col = encima ? '#ffe0a0' : '#a08860', mid = Math.floor(B / 2);
  c.fillStyle = col;
  for (let i = 0; i < 4; i++) { const xx = lado < 0 ? 3 + i : B - 4 - i; c.fillRect(xx, mid - i, 1, i * 2 + 1); }
  const su = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  ctx.drawImage(cv, 0, 0, B, B, x, y, B, B);
  ctx.imageSmoothingEnabled = su;
}
