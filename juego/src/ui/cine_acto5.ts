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
import { linea, VIOLETA, anclaJefe, anclaSalida, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, latido, siluetaEnPiso } from './cine_kit';
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
  siluetaEnPiso(q, px, py, -0.9, -0.35, k * (0.45 + 0.35 * latido(tl)), '#5a0806');
}
/** Humo y ceniza que se escapan del puño que apaga la Brasa. */
function humoPuno(e: EstadoToma, dt: number) {
  if (!e.j) return; const x = e.ax + HX + 0.2, y = e.ay + HY + 0.2;
  for (let i = 0; i < 3; i++) if (Math.random() < dt * 30) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 0.3, y: y + (Math.random() - 0.5) * 0.3, z: 26 + Math.random() * 6, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3, vz: 10 + Math.random() * 14, t: 0, dur: 1.6 + Math.random(), color: Math.random() < 0.6 ? '#6a6a6e' : '#9a9aa0', tam: 1 + Math.random(), grav: -3, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ el mar que se parte
/** El tajo en el mar: una línea de espuma que corre hacia el horizonte y se abre en dos labios, con el agua oscura en medio. */
function tajoMar(e: EstadoToma, tl: number) {
  const u = Math.min(1, Math.max(0, (tl - 1.2) / 4.5)); if (u <= 0) return;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  const largo = 40 * u, abre = Math.min(1, Math.max(0, (tl - 2.5) / 4)) * 1.6;
  for (let s = 0; s < largo; s += 0.25) {
    const w = abre * (1 - s / 48) + 0.15, ond = Math.sin(s * 0.9 - tl * 4) * 0.12;
    for (const lado of [-1, 1]) {
      const [px, py] = aPant(e.ax - s * 0.7 + lado * (w + ond) * 0.7, e.ay - s * 0.7 - lado * (w + ond) * 0.7);
      ctx.globalAlpha = 0.85 * (1 - s / 44); ctx.fillStyle = (Math.floor(s * 4 + tl * 9) % 5) ? '#d8e4e8' : '#ffffff'; ctx.fillRect(Math.round(px), Math.round(py), 2, 1);
    }
    if (abre > 0.3) { const [px, py] = aPant(e.ax - s * 0.7, e.ay - s * 0.7); ctx.globalAlpha = 0.6 * (1 - s / 44); ctx.fillStyle = '#04080a'; ctx.fillRect(Math.round(px - abre * 8), Math.round(py), Math.round(abre * 16), 1); }
  }
  ctx.restore();
}

/** Un tramo de agua de la costa (el más ancho de agua seguida, lejos del borde). */
const anclaMar = (z: Zona): [number, number] => {
  const agua = (tx: number, ty: number) => tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && /agua|mar|ahg/.test(z.pisos[ty * z.tw + tx]?.id ?? '');
  let mejor: [number, number] | null = null, nota = -1;
  for (let ty = 3; ty < z.th - 3; ty++) for (let tx = 3; tx < z.tw - 3; tx++) {
    if (!agua(tx, ty)) continue; let n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (agua(tx + dx, ty + dy)) n++;
    if (n > nota) { nota = n; mejor = [tx * 5 + 2.5, ty * 5 + 2.5]; }
  }
  return mejor ?? [z.W / 2, z.H / 2];
};
/** En el barco varado: un punto libre cerca del medio del pueblo (la cubierta). */
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
    // la Fragua se enfría: las cintas de lava se apagan, la boca se oscurece, sube humo negro
    id: 'fragua', dur: 8, zona: 'a5_rio', ancla: anclaSalida('a5_fragua'), entra: 0.6, sale: 0.6, oscuridad: 0.66, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a5_fragua'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 280, zoom: 0.6, fy: 0.5 }, { t: 8, x: 7, y: 7, alt: 300, c: 'suave' }],
    focos: [{ de: [-6, -6], z: 260, r: 440, k: 0.75 }],
    luces: [
      { id: 'boca', color: [255, 110, 40], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 30, r: 320, k: 1.1 }, { t: 2, k: 1.1 }, { t: 6.5, k: 0.05, c: 'suave' }] },
      { id: 'cielo', color: [255, 60, 30], claves: [{ t: 0, x: -10, y: -10, z: 700, r: 1200, k: 0.45 }, { t: 7, k: 0.08, c: 'suave' }] },
    ],
    sonidos: [{ t: 0, id: 'fragua_enfria', cine: true }],
    paso: (e, tl, dt) => { if (e.j && tl > 1.5 && Math.random() < dt * 25) e.j.particulas.push({ x: e.ax - 6 + (Math.random() - 0.5) * 6, y: e.ay - 6 + (Math.random() - 0.5) * 6, z: 200 + Math.random() * 120, vx: 0.3, vy: -0.2, vz: 30 + Math.random() * 20, t: 0, dur: 3 + Math.random() * 2, color: Math.random() < 0.5 ? '#1a1616' : '#2c2626', tam: 2 + Math.random() * 2, grav: -2, tipo: 'ceniza' } as any); },
  },
  {
    // las cenizas de Vesperio delante de la boca: un montón pálido, la partitura que se quema por el borde y una chispa violeta
    id: 'cenizas', dur: 7, zona: 'a5_rio', ancla: anclaSalida('a5_fragua'), objetos: ['ves_rastro|partitura', 'cri_vasijas|con_cenizas'], entra: 0.5, sale: 0.6, oscuridad: 0.88, hundir: 0.7,
    preparar: (e) => { despejarPies(e, 3.5, 3.5, 3); const z = e.z; if (z && !z.objetos.some((o) => o.capa === 'cine')) z.objetos.push({ id: 'ves_rastro', v: 'partitura', cx: Math.floor(e.ax + 3.5), cy: Math.floor(e.ay + 3.5), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); },
    cam: [{ t: 0, x: 3.7, y: 3.8, alt: 26, zoom: 3, fy: 0.55 }, { t: 7, x: 3.6, y: 3.7, alt: 40, c: 'suave' }],
    brasa: [{ t: 2.4, x: 3.6, y: 3.7, z: 6, k: 0.0, tam: 0.3 }, { t: 3.0, z: 12, k: 0.35, tam: 0.3 }, { t: 6.8, z: 160, k: 0.0, tam: 0.2, c: 'entra' }],
    focos: [{ de: [3.6, 3.7], z: 8, r: 140 }],
    luces: [{ id: 'ves', color: VIOLETA, claves: [{ t: 0, x: 3.8, y: 3.9, z: 14, r: 110, k: 0.5 }, { t: 6, k: 0.25 }] }],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.84, vol: 0.6 }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 8) ceniza(e.j, e.ax + 3.6, e.ay + 3.7, 1, '#b8a8d8'); vez(e, 'pila', tl, 0, () => { if (e.j) e.j.manchas.push({ x: e.ax + 3.5, y: e.ay + 3.6, r: 0.8, rmax: 0.9, color: '#8a8490', t: 0, tipo: 'quemado', sem: 4 } as any); }); },
    textos: [L(3, 2.4, 6.6)],
  },
  {
    // el mar se parte: de noche, sobre el agua de la costa, un tajo de espuma corre hacia el horizonte y se abre
    id: 'mar', dur: 9, zona: 'a6_costa', ancla: anclaMar, entra: 0.6, sale: 0.6, oscuridad: 0.7, hundir: 0.4, sinClima: ['fx_lluvia', 'fx_tormenta'],
    cam: [{ t: 0, x: 4, y: 4, alt: 120, zoom: 1, fy: 0.62 }, { t: 9, x: 0, y: 0, alt: 150, c: 'suave' }],
    focos: [{ de: [-6, -6], z: 0, r: 420, k: 0.6 }],
    luces: [{ id: 'luna', color: [140, 160, 200], claves: [{ t: 0, x: -10, y: -10, z: 500, r: 900, k: 0.5 }] }],
    sonidos: [{ t: 0, id: 'mar_parte', cine: true }],
    temblores: [[1.4, 3.5, 2]],
    mundo: (e, tl) => tajoMar(e, tl),
    textos: [L(4, 2.0, 8.6)],
  },
  {
    // Ysmeral sube: la Catedral de las Campanas Ahogadas, escorada, chorreando; las campanas suenan solas bajo el agua
    id: 'ysmeral', dur: 10, zona: 'a6_barrio2', ancla: anclaSalida('a6_catedral1'), entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a6_catedral1'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 320, zoom: 0.6, fy: 0.5 }, { t: 10, x: 6, y: 6, alt: 360, c: 'suave' }],
    focos: [{ de: [-6, -6], z: 300, r: 460, k: 0.8 }],
    luces: [
      { id: 'luna', color: [130, 160, 170], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.45 }] },
      { id: 'verdin', color: [90, 200, 170], sombra: true, claves: [{ t: 0, x: -4, y: -4, z: 200, r: 360, k: 0.25 }, { t: 5, k: 0.6, c: 'suave' }] },
    ],
    sonidos: [{ t: 0.4, id: 'campanas_ahogadas', cine: true }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 40) e.j.particulas.push({ x: e.ax - 4 + (Math.random() - 0.5) * 10, y: e.ay - 4 + (Math.random() - 0.5) * 10, z: 120 + Math.random() * 260, vx: 0, vy: 0, vz: -60 - Math.random() * 40, t: 0, dur: 1.5, color: '#8ab4c0', tam: 1, grav: 60, tipo: 'ceniza' } as any); void tl; },
    textos: [L(5, 2.0, 9.6)],
  },
  {
    // el barco varado: Oyá sola, mirando la ciudad; las campanas lejos
    id: 'oya', dur: 8, zona: 'a6_barco', ancla: anclaCubierta, entra: 0.6, sale: 0.6, oscuridad: 0.84, hundir: 0.66,
    preparar: (e) => despejarPies(e, 0, 0, 3),
    cam: [{ t: 0, x: 1.2, y: 1.4, alt: 40, zoom: 2, fy: 0.6 }, { t: 8, x: 0.9, y: 1.1, alt: 44, c: 'suave' }],
    actores: [{ id: 'oya', tipo: 'sprite', sprite: 'oya', claves: [{ t: 0, x: 0, y: 0, dir: 'n' }, { t: 4.5, dir: 'ne' }] }],
    focos: [{ de: 'oya', z: 30, r: 150 }],
    luces: [{ id: 'farol', color: [255, 176, 100], sombra: true, titila: 0.12, claves: [{ t: 0, x: 1.0, y: -0.6, z: 30, r: 160, k: 0.8 }] }, { id: 'luna', color: [120, 140, 170], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 700, k: 0.22 }] }],
    sonidos: [{ t: 0, id: 'campana', cine: true, tono: 0.7, vol: 0.4 }, { t: 3.2, id: 'campana', cine: true, tono: 0.66, vol: 0.35 }, { t: 0.5, id: 'tema_oya', cine: true }],
    textos: [L(6, 1.6, 7.6)],
  },
  { id: 'acto6', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 6) },
];

export const CINE_ACTO5: Guion = { id: 'acto5', acto: 5, tomas };
void sombraTibia;
