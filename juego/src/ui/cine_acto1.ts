// El cierre del acto 1, «La brasa no» (unos 75 s): Ilvara cae en el fondo del pozo, la brasa escapa, sube y sale por
// Santa Oria con sus campanas, pasa por el campanario caído donde Vesperio le canta, toma el camino del sur, y en el brazo
// del héroe la Marca se calienta. Cierra con el cartel del acto 2. Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx, W, H, RES } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { ponerMancha, type Juego } from '../juego/mundo';
import { libreCerca, type Zona } from '../mundo/zona';
import { cuadrosRetrato, dibujar, dibujarTenido, type Cuadro } from '../motor/assets';
import { lienzoTrabajo } from '../motor/lienzos';
import { spriteAve, LADO_AVE } from '../render/presencias';
import { estallido } from '../render/brasa_cine';
import { textoGotico } from './texto_gotico';
import { cuadroPresentar } from './seleccion';
import { brasaRenglon } from './brasa_menu';
import { puntoGotico, lienzoGotico } from './letra_gotica';
import { pegarPixel } from './fuego_pixel';
import { TITULO, IDI } from './comun';
import type { Guion, Toma, EstadoToma, Texto } from './director';
import { PELICULA } from '../mundo/actos';
/** La línea n de la película (las del Libro de Odrán), entre t0 y t1. */
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => ({ t0, t1, es: PELICULA[1][n].es, en: PELICULA[1][n].en, voz: PELICULA[1][n].voz, ...o });

// ------------------------------------------------------------------ las anclas (con la semilla del héroe cambian de sitio)
/** El ruedo de Ilvara: donde sale el jefe. */
const anclaJefe = (z: Zona): [number, number] => { const s = z.spawns.find((q) => q.tipo === 'jefe'); return s ? [s.cx + 0.5, s.cy + 0.5] : [z.W / 2, z.H / 2]; };
/** La fachada de la catedral de Santa Oria (la pieza de adelante de la salida a la abadía). */
const anclaFachada = (z: Zona): [number, number] => { const sa = z.salidas.find((q) => q.destino === 'a1_abadia1'); const f = sa?.piezas?.find((o) => /fachada/.test(o.id)) ?? sa?.piezas?.[sa.piezas.length - 1]; return f ? [f.cx + 0.5, f.cy + 0.5] : [z.W / 2, z.H / 2]; };
/** El campanario caído (el hito del camposanto). */
const anclaCampanario = (z: Zona): [number, number] => { const o = z.objetos.find((q) => q.id === 'acto_hito'); return o ? [o.cx + 0.5, o.cy + 0.5] : [z.W / 2, z.H / 3]; };
/** El camino del páramo, un poco adentro de la puerta del este (la que viene del camposanto). */
/** El camino del páramo, un poco adentro de la puerta del este (la que viene del camposanto). */
const anclaCamino = (z: Zona): [number, number] => { const e = z.entradas.e ?? [z.W * 0.8, z.H / 2]; const q = libreCerca(z, e[0] - 22, e[1] + 4); return [q[0] + 0.5, q[1] + 0.5]; };
export const anclaCruz = (z: Zona): [number, number] => { const o = z.objetos.find((q) => q.id === 'acto_hito'); if (o) return [o.cx + 0.5, o.cy + 0.5]; const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };

// ------------------------------------------------------------------ ayudas de la toma
/** Un charco de sangre que se abre bajo el cuerpo (una vez por toma). */
function charco(e: EstadoToma, clave: string, x: number, y: number, r: number, rmax: number) {
  if (e.mem[clave] || !e.j) return; e.mem[clave] = 1;
  ponerMancha(e.j, { x: e.ax + x, y: e.ay + y, r, rmax, color: '#4a0806', t: 0, tipo: 'sangre', forma: 'charco', pal: 'rojo', sem: 3 });
}
/** Una vez: corre `f` la primera vez que tl pasa `t`. */
function vez(e: EstadoToma, clave: string, tl: number, t: number, f: () => void) { if (tl >= t && !e.mem[clave]) { e.mem[clave] = 1; f(); } }
/** Una bandada que se espanta: cuervos de pixel que suben aleteando desde (x, y) del mundo. */
interface Cuervo { x: number; y: number; z: number; vx: number; vy: number; vz: number; f: number }
function soltarCuervos(e: EstadoToma, x: number, y: number, n: number) {
  const L: Cuervo[] = (e.mem.cuervos ??= []);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2; L.push({ x: e.ax + x + Math.cos(a) * 3, y: e.ay + y + Math.sin(a) * 3, z: 60 + Math.random() * 160, vx: Math.cos(a) * (1.5 + Math.random() * 2) - 1.5, vy: Math.sin(a) * (1.5 + Math.random() * 2) - 1.5, vz: 40 + Math.random() * 70, f: Math.random() * 8 }); }
}
function dibujarCuervos(e: EstadoToma, dt: number) {
  const L: Cuervo[] | undefined = e.mem.cuervos; if (!L) return;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (const c of L) {
    c.x += c.vx * dt; c.y += c.vy * dt; c.z += c.vz * dt; c.f += dt * 16;
    const [px, py] = aPant(c.x, c.y), ang = Math.atan2(((c.vx + c.vy) * 8 - c.vz), (c.vx - c.vy) * 16);
    ctx.drawImage(spriteAve('cuervo', ang, Math.floor(c.f) & 7, 0), Math.round(px - LADO_AVE / 2), Math.round(py - c.z - LADO_AVE / 2));
  }
  ctx.restore();
}
/** Ceniza pálida que sube de alguien (Vesperio). */
function ceniza(j: Juego, x: number, y: number, n: number, color: string) {
  for (let i = 0; i < n; i++) j.particulas.push({ x: x + (Math.random() - 0.5) * 0.8, y: y + (Math.random() - 0.5) * 0.8, z: 6 + Math.random() * 50, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3 - 0.15, vz: 14 + Math.random() * 22, t: 0, dur: 1.6 + Math.random() * 1.4, color, tam: 1 + Math.random() * 1.2, grav: -4, tipo: 'ceniza' } as any);
}
/** El latido (lub-dub cada 1,1 s, el mismo de la brasa): 0 a 1. */
const latido = (t: number) => { const f = (t % 1.1) / 1.1; return Math.exp(-(((f - 0.05) / 0.06) ** 2)) + 0.7 * Math.exp(-(((f - 0.22) / 0.06) ** 2)); };

// ------------------------------------------------------------------ el primer plano: el retrato grande con la Marca
/**
 * El héroe en primer plano: su retrato de la presentación (pixel art del grupo r, a puntos enteros), la cara y el pecho, a
 * oscuras salvo lo que alumbra la Marca desde abajo, que late. Lo de abajo queda en sombra (el retrato es el de su clase,
 * sin su equipo: manda la cara).
 */
function primerPlano(e: EstadoToma, tl: number, dur: number) {
  const clase = e.heroe.clase, ret = cuadrosRetrato(clase, e.heroe.nivel >= 30 ? 2 : 0);
  ctx.save(); ctx.fillStyle = '#030202'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const q: Cuadro | undefined = ret.length ? ret[cuadroPresentar(tl + 6, ret.length)] : undefined;
  if (!q) return;
  // el tamaño: puntos enteros del aparato, la figura de unas 2,4 pantallas de alto (se ve de la frente al pecho)
  const dev = Math.max(2, Math.round((H * RES * 0.95) / q.h)), esc = dev / RES;
  const acerca = 1 + 0.03 * (tl / dur);
  const cx = W * 0.5, piesY = H * 0.16 + q.ay * esc * acerca;
  const x = Math.round((cx - (q.ax - q.w / 2) * esc * 0) * RES) / RES, y = Math.round(piesY * RES) / RES;
  const lat = latido(tl), k = Math.min(1, tl / 1.2);
  // el cuerpo en clave baja (la fogata horneada del retrato apenas: es de noche y no hay otra luz)
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = k; dibujar(ctx, q, x, y, esc); ctx.restore();
  dibujarTenido(ctx, q, x, y, '#06040a', 0.6 * k, esc);
  // la luz de la Marca: el mismo cuadro teñido de rojo, que solo vale abajo (sube desde el brazo) y late
  const { cv: lc, c: g } = lienzoTrabajo(Math.ceil(q.w * esc) + 2, Math.ceil(q.h * esc) + 2);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, lc.width, lc.height); g.imageSmoothingEnabled = false;
  g.drawImage(q.img ?? new Image(), q.x, q.y, q.w, q.h, 0, 0, q.w * esc, q.h * esc);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgb(255,70,30)'; g.fillRect(0, 0, lc.width, lc.height);
  g.globalCompositeOperation = 'destination-in';
  const yo = 0, ymarca = (q.h * esc) * 0.5;
  const gr = g.createLinearGradient(0, ymarca + 60, 0, ymarca - q.h * esc * 0.4);
  gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.62)'); gr.addColorStop(1, 'rgba(0,0,0,0.12)');
  g.fillStyle = gr; g.fillRect(0, 0, lc.width, lc.height); g.restore(); void yo;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = k * (0.32 + 0.5 * lat);
  ctx.drawImage(lc, 0, 0, Math.ceil(q.w * esc), Math.ceil(q.h * esc), Math.round((x - q.ax * esc) * RES) / RES, Math.round((y - q.ay * esc) * RES) / RES, q.w * esc, q.h * esc);
  // el resplandor que sube desde abajo, fuera de cuadro
  const by = H * 0.98, R = H * (0.55 + 0.08 * lat);
  const rg = ctx.createRadialGradient(cx, by, 0, cx, by, R);
  rg.addColorStop(0, `rgba(255,60,20,${0.30 * k * (0.6 + 0.5 * lat)})`); rg.addColorStop(0.5, `rgba(160,20,8,${0.12 * k})`); rg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.globalAlpha = 1; ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  ctx.restore();
  // chispas de pixel que suben desde abajo (de la Marca)
  const ch: { x: number; y: number; v: number; s: number }[] = (e.mem.chispas ??= []);
  if (ch.length < 40 && Math.random() < 0.5) ch.push({ x: cx + (Math.random() - 0.5) * W * 0.4, y: H, v: 20 + Math.random() * 40, s: Math.random() < 0.3 ? 2 : 1 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = ch.length - 1; i >= 0; i--) { const p = ch[i]; p.y -= p.v / 60; p.x += Math.sin(p.y * 0.05 + i) * 0.3; if (p.y < H * 0.3) { ch.splice(i, 1); continue; } ctx.globalAlpha = Math.min(1, (p.y - H * 0.3) / (H * 0.3)) * k; ctx.fillStyle = p.y > H * 0.7 ? '#ffb060' : '#d04018'; const u = 1 / RES * 2; ctx.fillRect(Math.round(p.x * RES / 2) * u, Math.round(p.y * RES / 2) * u, p.s * u, p.s * u); }
  ctx.restore();
}

// ------------------------------------------------------------------ el cartel del acto que empieza
const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
/** El nombre de cada acto (el de su carta). */
const NOMBRE_ACTO: Record<number, [string, string]> = { 1: ['El Valle de Velmora', 'The Vale of Velmora'], 2: ['Las Arenas de Sahrim', 'The Sands of Sahrim'], 3: ['La Selva de Yhuantl', 'The Jungle of Yhuantl'], 4: ['Los Picos de Hrimgard', 'The Peaks of Hrimgard'], 5: ['La Herida', 'The Wound'], 6: ['Ysmeral, la Ciudad Ahogada', 'Ysmeral, the Drowned City'], 7: ['La Corona del Dios Sediento', 'The Crown of the Thirsting God'] };
/** El cartel del acto que empieza, solo (al entregar la misión del acto: la transición). Devuelve true al terminar. */
export function cartelActo(acto: number, t: number, dur = 6.5): boolean { cartel(t, dur, acto); return t >= dur; }
function cartel(tl: number, dur: number, acto = 2) {
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.restore();
  const k = Math.min(1, Math.max(0, (tl - 0.4) / 1.2), Math.max(0, (dur - tl) / 1.2));
  const tam = Math.round(H / 9), S = (IDI ? 'ACT ' : 'ACTO ') + ROMANO[acto], ty = Math.round(H * 0.47);
  // (como los renglones del menú: la grilla de la letra y la del canto de brasa son la misma)
  const A = ctx.getTransform().a, kp = puntoGotico(tam, A), cel = kp / A, hierro = lienzoGotico(S, 'hierro'), r = hierro.r;
  const tx = Math.round(W / 2 - ((r.w - 4) * cel) / 2), ox = tx - 2 * cel, oy = ty - (r.base + 1) * cel;
  ctx.save(); ctx.globalAlpha = k;
  // un resplandor de brasa detrás (es luz: blando)
  { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const R = (r.w * cel) * 0.7, g = ctx.createRadialGradient(W / 2, ty - tam * 0.4, 0, W / 2, ty - tam * 0.4, R); g.addColorStop(0, `rgba(255,90,30,${0.22 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  brasaRenglon('cine_acto', S, tam, TITULO, tx, ty, k, tl, 'atras', true);
  pegarPixel(hierro.c, ox, oy, kp, k * 0.35);
  pegarPixel(lienzoGotico(S, 'brasa').c, ox, oy, kp, k);
  brasaRenglon('cine_acto', S, tam, TITULO, tx, ty, k, tl, 'adelante', true);
  const k2 = Math.min(1, Math.max(0, (tl - 1.4) / 1.2), Math.max(0, (dur - tl) / 1.2));
  ctx.globalAlpha = k2;
  textoGotico(NOMBRE_ACTO[acto][IDI ? 1 : 0].toUpperCase(), W / 2, Math.round(H * 0.62), Math.round(H / 26), { alin: 'center', tono: 'oro', brillo: 0.3 });
  ctx.restore();
}

// ------------------------------------------------------------------ el guion
const VIOLETA: [number, number, number] = [200, 170, 255];
const tomas: Toma[] = [
  {
    id: 'pozo', dur: 10, zona: 'a1_pozo', ancla: anclaJefe, entra: 1.6, sale: 0.4, oscuridad: 0.84,
    cam: [{ t: 0, x: 2.6, y: 1.0, alt: 50, zoom: 2, fy: 0.5 }, { t: 3.05, x: 1.8, y: 0.4, alt: 56, c: 'suave' }, { t: 3.06, x: 0.9, y: -0.5, alt: 58, zoom: 3, fy: 0.5 }, { t: 9.6, x: 0.7, y: -0.4, alt: 40, c: 'suave' }],
    actores: [
      { id: 'ilvara', tipo: 'mon', mon: 'abadesa', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.4, ritmo: 0.55, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.42 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.6, y: -0.4, mira: [0, 0] }, { t: 2.2, x: 3.6, y: -0.4 }, { t: 3.0, x: 2.3, y: -0.9, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.2, y: 1.6, mira: [0, 0] }, { t: 1.3, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.2, acc: 'quieto', mira: [0, 0] }] },
    ],
    luces: [
      { id: 'velas', color: [255, 150, 80], sombra: true, titila: 0.12, claves: [{ t: 0, x: 2, y: 3, z: 40, r: 260, k: 0.6 }] },
      { id: 'frio', color: [140, 160, 220], sombra: true, claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.55 }] },
    ],
    sonidos: [{ t: 0, id: 'organo_pozo', cine: true }, { t: 3.3, id: 'coro_muerte', cine: true }, { t: 1.3, id: 'grunido', vol: 0.7 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.5, id: 'golpe', cine: true }, { t: 5.5, id: 'sub', cine: true }],
    temblores: [[5.5, 0.5, 3]],
    paso: (e, tl) => { vez(e, 'sangre', tl, 5.5, () => charco(e, 'c1', 0.3, 0.3, 0.3, 1.5)); },
    textos: [L(0, 6.0, 9.7)],
  },
  {
    id: 'brasa', dur: 9, zona: 'a1_pozo', ancla: anclaJefe, entra: 0.25, sale: 0.5, oscuridad: 0.9,
    cam: [{ t: 0, x: 1.0, y: -0.2, alt: 22, zoom: 3, fy: 0.5 }, { t: 5.4, x: 0.9, y: -0.2, alt: 34 }, { t: 6.6, x: 0.8, y: -0.2, alt: 80, c: 'entra' }, { t: 9, x: 0.8, y: -0.2, alt: 86 }],
    actores: [
      { id: 'ilvara', tipo: 'mon', mon: 'abadesa', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.3, y: -0.9, mira: [0, 0] }, { t: 3.5, x: 2.3, y: -0.9 }, { t: 3.5, mira: [0, 0] }, { t: 4.3, x: 3.1, y: -1.3, c: 'sale' }, { t: 6.4, dir: 'no' }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 2.4, y: 1.5, mira: [0, 0] }, { t: 3.7, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 4.6, acc: 'quieto', mira: [0, 0] }] },
    ],
    brasa: [{ t: 0.9, x: 0.15, y: 0.15, z: 5, k: 0, tam: 0.35 }, { t: 2.3, z: 9, k: 0.55, tam: 0.55 }, { t: 3.6, z: 40, k: 1, tam: 1, c: 'sale' }, { t: 5.8, z: 46, k: 1 }, { t: 6.7, z: 560, k: 1, c: 'entra' }],
    sonidos: [{ t: 0.9, id: 'brasa_nace', cine: true }, { t: 3.7, id: 'grunido' }, { t: 3.8, id: 'latido', cine: true }, { t: 4.9, id: 'latido', cine: true }, { t: 5.75, id: 'brasa_vuela', cine: true }, { t: 6.4, id: 'sub', cine: true }],
    temblores: [[2.3, 0.3, 1], [5.9, 0.6, 2]],
    paso: (e, tl) => {
      vez(e, 'sangre', tl, 0, () => { charco(e, 'c', 0.3, 0.3, 1.5, 1.6); });
      vez(e, 'pecho', tl, 2.3, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 8, 30, 0.7));
      vez(e, 'sale', tl, 5.9, () => estallido(e.brasa, (e.ax - e.ay) * 16 + 4, (e.ax + e.ay) * 8 - 60, 40, 1));
    },
    textos: [L(1, 4.2, 8.7)],
  },
  {
    id: 'catedral', dur: 9, zona: 'a1_cementerio', ancla: anclaFachada, entra: 0.5, sale: 0.6, oscuridad: 0.78,
    cam: [{ t: 0, x: 3, y: 3, alt: 360, zoom: 1, fy: 0.55 }, { t: 4.0, x: 2.5, y: 2.5, alt: 390, c: 'suave' }, { t: 9, x: 2, y: -2, alt: 470, c: 'suave' }],
    luces: [
      // la brasa sube por dentro de la abadía: la nave se enciende de abajo arriba
      { id: 'nave', color: [255, 60, 24], sombra: true, claves: [{ t: 0, x: 1.5, y: 1.5, z: 20, r: 220, k: 0 }, { t: 2.2, z: 160, r: 320, k: 0.9, c: 'entra' }, { t: 4.1, z: 420, r: 420, k: 1 }, { t: 4.8, z: 500, r: 300, k: 0.25 }, { t: 6.5, k: 0 }] },
      { id: 'luna', color: [130, 150, 210], claves: [{ t: 0, x: 8, y: 8, z: 400, r: 700, k: 0.42 }] },
    ],
    brasa: [{ t: 4.1, x: 0, y: 0, z: 430, k: 1, tam: 1.6 }, { t: 5.2, x: 0.5, y: -3, z: 540, k: 1, c: 'sale' }, { t: 9, x: 3, y: -16, z: 640, k: 0.9, tam: 1.1, c: 'suave' }],
    sonidos: [{ t: 0, id: 'sub', cine: true }, { t: 4.1, id: 'brasa_vuela', cine: true }, { t: 4.15, id: 'campana', cine: true }, { t: 5.9, id: 'campana', cine: true, tono: 0.94 }, { t: 7.7, id: 'campana', cine: true, tono: 0.89 }],
    temblores: [[4.1, 0.5, 2]],
    paso: (e, tl) => {
      vez(e, 'estalla', tl, 4.15, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 430, 80, 1.3));
      vez(e, 'sueltaCuervos', tl, 4.3, () => soltarCuervos(e, 0, 0, 16));
    },
    mundo: (e, _tl, dt) => dibujarCuervos(e, dt),
    textos: [L(2, 4.8, 8.8)],
  },
  {
    id: 'campanario', dur: 10, zona: 'a1_cementerio', ancla: anclaCampanario, entra: 0.6, sale: 0.5, oscuridad: 0.8,
    cam: [{ t: 0, x: 9, y: 11, alt: 90, zoom: 2, fy: 0.55 }, { t: 5.5, x: 4.0, y: 4.8, alt: 100, c: 'suave' }, { t: 10, x: 3.6, y: 4.4, alt: 100, c: 'suave' }],
    brasa: [{ t: 0, x: 16, y: 20, z: 200, k: 1, tam: 0.9 }, { t: 5.2, x: 1.6, y: 2.0, z: 120, k: 1, c: 'suave' }, { t: 8.2, x: -9, y: -9, z: 260, k: 1, c: 'entra' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', claves: [{ t: 0, x: 5.4, y: 6.6, dir: 'se', acc: 'quieto' }, { t: 3.6, mira: [1.6, 2.0] }, { t: 4.7, acc: 'lanzar', dur: 1.0, ritmo: 0.32, mira: [0, 0] }] },
    ],
    luces: [
      { id: 'luna', color: [120, 140, 200], claves: [{ t: 0, x: 4, y: 4, z: 300, r: 500, k: 0.28 }] },
      { id: 'ves', color: VIOLETA, claves: [{ t: 0, x: 5.4, y: 6.6, z: 40, r: 120, k: 0.25 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true }, { t: 4.4, id: 'zumbido', cine: true }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 14) ceniza(e.j, e.ax + 5.4, e.ay + 6.6, 1, '#c8c0d8'); void tl; },
  },
  {
    id: 'vesperio', dur: 7, zona: 'a1_cementerio', ancla: anclaCampanario, entra: 0.3, sale: 0.9, oscuridad: 0.86,
    cam: [{ t: 0, x: 5.3, y: 6.5, alt: 52, zoom: 3, fy: 0.58 }, { t: 7, x: 5.1, y: 6.3, alt: 54 }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', claves: [{ t: 0, x: 5.4, y: 6.6, acc: 'lanzar', dur: 1.0, ritmo: 0.1, dir: 'n' }, { t: 2.0, acc: 'quieto', dir: 's' }, { t: 4.6, x: 5.4, y: 6.6, dir: 's', alfa: 1 }, { t: 4.6, dir: 's' }, { t: 6.8, x: 4.2, y: 5.4, alfa: 0, c: 'lineal' }] },
    ],
    luces: [{ id: 'ves', color: VIOLETA, sombra: true, titila: 0.08, claves: [{ t: 0, x: 6.0, y: 7.4, z: 34, r: 150, k: 0.85 }, { t: 5.4, k: 0.8 }, { t: 6.8, k: 0 }] }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * (tl > 4.6 ? 40 : 12)) ceniza(e.j, m.x, m.y, tl > 4.6 ? 2 : 1, '#d8d0e8'); },
    textos: [L(3, 2.2, 6.4, { tono: VIOLETA })],
  },
  {
    id: 'sur', dur: 10, zona: 'a1_paramo', ancla: anclaCamino, entra: 0.7, sale: 0.7, oscuridad: 0.66,
    cam: [{ t: 0, x: 16, y: -4, alt: 110, zoom: 1, fy: 0.5 }, { t: 4.6, x: 4, y: 2, alt: 120, c: 'suave' }, { t: 10, x: -8, y: 16, alt: 80, c: 'suave' }],
    brasa: [{ t: 0.6, x: 26, y: -8, z: 200, k: 1, tam: 1.5 }, { t: 4.6, x: 3, y: 2, z: 190, k: 1, tam: 1.5, c: 'suave' }, { t: 9.6, x: -16, y: 26, z: 90, k: 0.8, tam: 0.8, c: 'lineal' }],
    luces: [{ id: 'luna', color: [110, 125, 170], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 700, k: 0.22 }] }],
    sonidos: [{ t: 0, id: 'organo_sur', cine: true }, { t: 2.2, id: 'brasa_vuela', cine: true, vol: 0.6 }],
    textos: [L(4, 2.6, 9.6)],
  },
  {
    id: 'marca', dur: 6, zona: 'a1_pozo', ancla: anclaJefe, entra: 0.8, sale: 0.25, oscuridad: 0.92,
    cam: [{ t: 0, x: 2.2, y: -0.9, alt: 30, zoom: 3, fy: 0.5 }, { t: 6, x: 2.3, y: -0.8, alt: 34 }],
    actores: [
      { id: 'ilvara', tipo: 'mon', mon: 'abadesa', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.3, y: -0.9, mira: [0, 0] }, { t: 3.4, dir: 's' }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 5.0, y: -2.6, mira: [2.3, -0.9] }, { t: 1.2, x: 5.0, y: -2.6 }, { t: 3.6, x: 3.2, y: -0.4, c: 'lineal' }, { t: 3.7, mira: [2.3, -0.9] }] },
    ],
    luces: [{ id: 'marca', color: [255, 50, 24], claves: [{ t: 0, x: 2.45, y: -0.6, z: 26, r: 170, k: 0.5 }] }],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true }, ...[0.4, 1.5, 2.6, 3.7, 4.8].map((t) => ({ t, id: 'latido', cine: true }))],
    paso: (e, tl) => { charco(e, 'c', 0.3, 0.3, 1.5, 1.6); const L = (e.j as any)?.lucesCine as any[] | undefined; const m = L?.find((l) => l.id === 'marca'); if (m) m.k = 0.25 + 0.75 * latido(tl - 0.4); },
  },
  {
    id: 'rostro', dur: 7, entra: 0.15, sale: 1.2,
    sonidos: [...[0.4, 1.5, 2.6, 3.7, 4.8, 5.9].map((t, i) => ({ t, id: 'latido', cine: true, vol: 1 + i * 0.12 }))],
    pantalla: (e, tl) => primerPlano(e, tl, 7),
    textos: [L(5, 1.6, 6.6)],
  },
  {
    id: 'acto2', dur: 7, entra: 0, sale: 1.4,
    sonidos: [{ t: 0.35, id: 'titulo', cine: true }],
    pantalla: (_e, tl) => cartel(tl, 7),
  },
];

export const CINE_ACTO1: Guion = { id: 'acto1', acto: 1, tomas };
