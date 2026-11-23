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
const anclaPuertaFortin = (z: Zona): [number, number] => { const sa = z.salidas.find((q) => q.destino === 'a4_picos'); if (!sa) { const q = libreCerca(z, z.W / 2, 12); return [q[0] + 0.5, q[1] + 0.5]; } return [sa.cx + 4, sa.cy + 2.7]; };
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
 * Nieve y escarcha sobre el piso del Fortín (el portón tiene pasto: el norte es nieve). Manchas de pixel con el borde que se
 * deshace, claras arriba y azuladas en la sombra, alrededor del ancla; van con lo plano del piso.
 */
function nievePiso(e: EstadoToma, r: number) {
  const [cx, cy] = aPant(e.ax, e.ay), RX = r * 16, RY = r * 8;
  const ruido = (x: number, y: number) => { const s = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453; return s - Math.floor(s); };
  const suave = (x: number, y: number) => { const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi; const a = ruido(xi, yi), b = ruido(xi + 1, yi), c = ruido(xi, yi + 1), d = ruido(xi + 1, yi + 1); return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy; };
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let y = -RY; y <= RY; y += 1) for (let x = -RX; x <= RX; x += 1) {
    const d = (x / RX) ** 2 + (y / RY) ** 2; if (d > 1) continue;
    const n = suave((e.ax * 16 + x) / 9, (e.ay * 8 + y) / 5) * 0.65 + suave((e.ax * 16 + x) / 3, (e.ay * 8 + y) / 2) * 0.35;
    if (n < 0.28 + d * 0.5) continue;
    ctx.fillStyle = n > 0.78 ? '#e6edf5' : n > 0.55 ? '#c3cedd' : '#97a6bc'; ctx.globalAlpha = Math.min(1, (n - 0.28 - d * 0.5) * 6);
    ctx.fillRect(Math.round(cx + x), Math.round(cy + y), 1, 1);
  }
  ctx.restore();
}
/**
 * La raja del cielo sobre la Herida: una grieta roja quebrada que cruza lo alto del cuadro de lado a lado, con su resplandor,
 * humo que entra en ella y una luz roja que baja hasta la boca de la Fragua. En el pase del mundo, en lo alto de la pantalla.
 */
function rajaCielo(e: EstadoToma, tl: number) {
  const m = ctx.getTransform(), inv = m.inverse(), a = inv.transformPoint(new DOMPoint(0, 0)), b = inv.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const x0 = a.x, x1 = b.x, alto = b.y - a.y, y0 = a.y + alto * 0.2, ancho = x1 - x0, lat = 0.85 + 0.15 * Math.sin(tl * 2.3);
  // (quebrada: tramos de largo y ángulo dispar, siempre los mismos)
  const pts: [number, number][] = []; let y = y0, x = x0 - 8, k = 0;
  while (x <= x1 + 8) { pts.push([x, y]); const r1 = Math.sin(k * 91.7) * 0.5 + 0.5, r2 = Math.sin(k * 37.3 + 2) * 0.5 + 0.5; x += 8 + r1 * 22; y += (r2 - 0.5) * 44 + (y0 - y) * 0.4; k++; }
  // el cielo: lo alto del cuadro se oscurece hacia la noche, para que la raja se lea en el cielo
  { ctx.save(); const gc = ctx.createLinearGradient(0, a.y, 0, a.y + alto * 0.42); gc.addColorStop(0, 'rgba(6,2,2,1)'); gc.addColorStop(0.6, 'rgba(10,3,3,0.85)'); gc.addColorStop(1, 'rgba(10,3,3,0)'); ctx.fillStyle = gc; ctx.fillRect(x0, a.y, ancho, alto * 0.42); ctx.restore(); }
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // el resplandor (es luz: blando)
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, y0 - 60, 0, y0 + 60); g.addColorStop(0, 'rgba(255,40,20,0)'); g.addColorStop(0.5, `rgba(255,60,20,${0.5 * lat})`); g.addColorStop(1, 'rgba(255,40,20,0)');
  ctx.fillStyle = g; ctx.fillRect(x0, y0 - 60, ancho, 120);
  // la luz que baja hasta la boca
  const [bx, by] = aPant(e.ax, e.ay), gb = ctx.createLinearGradient(0, y0, 0, by);
  gb.addColorStop(0, `rgba(255,50,20,${0.28 * lat})`); gb.addColorStop(1, 'rgba(255,50,20,0.04)');
  ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(bx - 30, y0); ctx.lineTo(bx + 30, y0); ctx.lineTo(bx + 70, by); ctx.lineTo(bx - 70, by); ctx.closePath(); ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
  // la grieta: borde oscuro, carne roja y el alma clara, a pixel
  const linea = (w: number, col: string, dy: number) => { ctx.fillStyle = col; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [cx2, cy2] = pts[i]; for (let s = 0; s <= 6; s++) { const u = s / 6; ctx.fillRect(Math.round(ax + (cx2 - ax) * u - w / 2), Math.round(ay + (cy2 - ay) * u - w / 2 + dy), w, w); } } };
  linea(9, '#1a0202', 0); linea(6, '#a01810', 0); linea(3, '#ff7038', 0); linea(1, '#ffe0a0', 0);
  for (let i = 2; i < pts.length; i += 5) { const [px, py] = pts[i]; for (let s = 0; s < 8; s++) { ctx.fillStyle = s < 4 ? '#a01810' : '#5a0806'; ctx.fillRect(Math.round(px + Math.sin(i + s) * s * 0.8), Math.round(py + (i % 2 ? s : -s) * 1.5), 2, 2); } }
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
    id: 'vesperio', dur: 9, zona: 'a4_glaciar', ancla: anclaHito, entra: 0.6, sale: 0.9, oscuridad: 0.92, hundir: 0.84, sinBruma: true, filo: 1.4, sinClima: ['fx_niebla', 'fx_ventisca', 'fx_nieve'],
    preparar: (e) => despejarPies(e, 4.4, 4.4, 3.5),
    cam: [{ t: 0, x: 4.6, y: 4.6, alt: 54, zoom: 3, fy: 0.58 }, { t: 9, x: 4.3, y: 4.3, alt: 58, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#241c2c', 0.42], claves: [{ t: 0, x: 4.4, y: 4.4, dir: 'no', acc: 'quieto' }, { t: 2.6, mira: [6, 3] }, { t: 4.6, dir: 's' }, { t: 7.0, x: 4.4, y: 4.4, alfa: 1, acc: 'caminar', mira: [8, 9] }, { t: 8.8, x: 5.4, y: 5.6, alfa: 0, c: 'lineal' }] },
    ],
    brasa: [{ t: 0.4, x: -1, y: -1, z: 120, k: 0.7, tam: 0.7 }, { t: 2.6, x: 6.6, y: 2.6, z: 96, k: 0.3, tam: 0.5, c: 'sale' }, { t: 4.4, x: 7.2, y: 2.6, z: 100, k: 0.3, c: 'suave' }, { t: 6.4, x: 14, y: 6, z: 160, k: 0.6, tam: 0.5, c: 'entra' }],
    focos: [{ de: 'vesperio', z: 50, r: 120, k: 0.6 }, { de: 'brasa', r: 70, k: 0.5 }],
    luces: [
      { id: 'ves', color: VIOLETA, sombra: true, titila: 0.08, claves: [{ t: 0, x: 6.0, y: 4.6, z: 70, r: 130, k: 0.18 }, { t: 7.0, k: 0.18 }, { t: 8.8, k: 0 }] },
      { id: 'canto', color: [170, 120, 240], claves: [{ t: 0, x: 3.5, y: 2.9, z: 60, r: 90, k: 0.75 }, { t: 7.0, k: 0.9 }, { t: 8.8, k: 0 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.89 }, { t: 0, id: 'viento_nieve', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * (tl > 7 ? 30 : 6)) ceniza(e.j, m.x, m.y, tl > 7 ? 2 : 1, '#9e96ae'); const b = brasaEn(e, tl); if (b) vahoEn(e, b.x, b.y, b.z, 1, dt); },
    textos: [L(3, 4.8, 8.2, { tono: VIOLETA })],
  },
  {
    // el Fortín, Vigdis viva: en la puerta del norte con su lámpara, mirando la montaña; la llama tiembla cuando la brasa pasa
    id: 'fortin', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, entra: 0.6, sale: 0.6, oscuridad: 0.86, hundir: 0.66, sinBruma: true,
    omitir: (e) => sacrificada(e.heroe),
    preparar: (e) => despejarPies(e, 1.5, 2.5, 5),
    cam: [{ t: 0, x: 0.9, y: 1.1, alt: 40, zoom: 3, fy: 0.6 }, { t: 8, x: 0.6, y: 0.8, alt: 46, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'vigdis', claves: [{ t: 0, x: 0, y: 0, dir: 'n' }, { t: 3.4, dir: 'ne' }, { t: 5.6, dir: 'n' }] }],
    brasa: [{ t: 2.4, x: -12, y: -6, z: 260, k: 0.6, tam: 0.6 }, { t: 5.4, x: 6, y: -14, z: 260, k: 0.6, c: 'lineal' }],
    focos: [{ de: 'vigdis', z: 30, r: 140 }],
    luces: [{ id: 'luna', color: [90, 120, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.32 }] }],
    sonidos: [{ t: 0, id: 'nana', cine: true }],
    suelo: (e) => nievePiso(e, 6),
    mundo: (e, tl) => lampara(e, tl),
    textos: [L(4, 3.6, 7.6)],
  },
  {
    // el Fortín, Vigdis entregada: su tumba en la nieve junto a la puerta; la nieve se derrite alrededor de la piedra y sube vaho
    id: 'tumba', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, objetos: ['cem_lapida_cruz|intacta'], entra: 0.6, sale: 0.6, oscuridad: 0.86, hundir: 0.66, sinBruma: true,
    omitir: (e) => !sacrificada(e.heroe),
    preparar: (e) => { despejarPies(e, 1.5, 2.5, 5); if (e.z && !e.z.objetos.some((o) => o.capa === 'cine')) e.z.objetos.push({ id: 'cem_lapida_cruz', v: 'intacta', cx: Math.floor(e.ax), cy: Math.floor(e.ay), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); },
    cam: [{ t: 0, x: 1.0, y: 1.3, alt: 30, zoom: 3, fy: 0.6 }, { t: 8, x: 0.7, y: 1.0, alt: 36, c: 'suave' }],
    brasa: [{ t: 2.4, x: -12, y: -6, z: 260, k: 0.6, tam: 0.6 }, { t: 5.4, x: 6, y: -14, z: 260, k: 0.6, c: 'lineal' }],
    focos: [{ de: [0.3, 0.6], z: 10, r: 130 }],
    luces: [
      { id: 'luna', color: [120, 140, 190], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.2 }] },
      { id: 'tibia', color: [255, 190, 130], claves: [{ t: 0, x: 0.4, y: 0.8, z: 6, r: 90, k: 0.4 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.5 }],
    suelo: (e) => nievePiso(e, 6),
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
