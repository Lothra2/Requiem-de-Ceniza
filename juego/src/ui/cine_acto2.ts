// El cierre del acto 2, «Su sombra no lo esperó» (unos 65 s): Khamer-Ul vuelve al polvo en su cámara, su sombra se despega del
// piso y se va con la brasa, la brasa cruza el Templo del Sol hacia el este, Oyá suelta las amarras con el héroe y Thor a bordo,
// algo pálido camina sobre el agua detrás de la barca, y en Yhuantl los tambores empiezan a sonar solos. Cartel del acto 3.
// Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { cuadrosMonstruo, cuadrosHeroe } from '../motor/assets';
import { cuadrosVivos } from '../motor/pintor';
import { estallido } from '../render/brasa_cine';
import type { Guion, Toma, Texto, EstadoToma } from './director';
import { linea, VIOLETA, anclaJefe, anclaSalida, anclaAgua, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, siluetaEnPiso } from './cine_kit';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(2, n, t0, t1, o);

// ------------------------------------------------------------------ la arena y la sombra
/** La arena que se escurre de un cuerpo que se deshace: granos que caen y se amontonan. */
function arena(e: EstadoToma, x: number, y: number, n: number) {
  const j = e.j; if (!j) return;
  for (let i = 0; i < n; i++) j.particulas.push({ x: e.ax + x + (Math.random() - 0.5) * 1.2, y: e.ay + y + (Math.random() - 0.5) * 1.2, z: 20 + Math.random() * 110, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, vz: -10 - Math.random() * 30, t: 0, dur: 1.4 + Math.random() * 1.2, color: Math.random() < 0.5 ? '#c8a868' : '#9a7c48', tam: 1 + Math.random(), grav: 120, tipo: 'ceniza' } as any);
}
/** Por dónde va la sombra del rey a los tl segundos (relativo al ancla) y cuánto se despegó del piso (0 a 1). */
const CAMINO_SOMBRA: [number, number, number][] = [[1.6, 0, 0], [3.0, 0.9, -0.3], [4.6, 2.2, -0.5], [6.2, 3.4, 1.4], [8.6, 7.5, 7.0]];
function sombraEn(tl: number): [number, number, number] | null {
  if (tl < CAMINO_SOMBRA[0][0] || tl > CAMINO_SOMBRA[CAMINO_SOMBRA.length - 1][0]) return null;
  for (let i = 1; i < CAMINO_SOMBRA.length; i++) if (tl <= CAMINO_SOMBRA[i][0]) { const [t0, x0, y0] = CAMINO_SOMBRA[i - 1], [t1, x1, y1] = CAMINO_SOMBRA[i], k = (tl - t0) / (t1 - t0), s = k * k * (3 - 2 * k); return [x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, Math.min(1, (tl - CAMINO_SOMBRA[0][0]) / 1.4)]; }
  return null;
}
/** La sombra de Khamer-Ul que se arrastra sola (y la del héroe, que tiembla hacia ella cuando le pasa por los pies). */
function sombras(e: EstadoToma, tl: number) {
  const p = sombraEn(tl); if (!p) return;
  const [x, y, k] = p, q = cuadrosMonstruo('jefe_rey_sin_sombra', 'quieto', 'se')[0];
  const [px, py] = aPant(e.ax + x, e.ay + y);
  // se despega del piso: primero una mancha aplastada que se estira, después la silueta entera echada hacia atrás
  const fin = Math.max(0, (8.6 - tl) / 0.8);
  // echada hacia donde va (abajo a la derecha en pantalla): se arrastra con la cabeza por delante
  siluetaEnPiso(q, px, py, 0.55 * k + Math.sin(tl * 3) * 0.04, 0.3 * k, 0.8 * Math.min(1, fin));
  // la del héroe: cuando la del rey le roza los pies, la suya tiembla y se estira hacia ella
  const h = e.actores.get('heroe') as any; if (!h) return;
  const d = Math.hypot(e.ax + x - h.x, e.ay + y - h.y);
  if (d < 2.6) {
    const kk = 1 - d / 2.6, qh = cuadrosVivos('quieto', h.dir)?.[0] ?? cuadrosHeroe(e.heroe.clase, 'quieto', h.dir)[0];
    const [hx, hy] = aPant(h.x, h.y), tiembla = Math.sin(tl * 40) * 0.12 * kk;
    const dx = (e.ax + x - h.x - (e.ay + y - h.y)) / Math.max(0.5, d), dy = 0.3;
    siluetaEnPiso(qh, hx, hy, (0.55 + tiembla) * Math.sign(dx || 1), -dy - tiembla, 0.45 * kk);
  }
}

// ------------------------------------------------------------------ la barca
/**
 * La barca de Oyá (una piragua) en el agua del ancla, y el rumbo del canal: de los rumbos que se alejan de la orilla (+y), el
 * que tiene más agua seguida (la piragua está tallada a lo largo de la pantalla: x = -y le sienta mejor).
 */
function ponerBarca(e: EstadoToma) {
  const z = e.z; if (!z) return;
  const agua = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return /a3_agua_negra/.test(z.pisos[ty * z.tw + tx]?.id ?? ''); };
  let rumbo: [number, number] = [1, -1], nota = -1;
  for (const [dx, dy, extra] of [[1, -1, 1.5], [-1, -1, 0.5], [1, 0, 0], [-1, 0, 0], [0, -1, 0]] as [number, number, number][]) {
    const L = Math.hypot(dx, dy); let n = 0; for (let k = 1; k <= 14; k++) { if (!agua(e.ax + (dx / L) * k, e.ay + (dy / L) * k)) break; n++; }
    if (n + extra > nota) { nota = n + extra; rumbo = [dx / L, dy / L]; }
  }
  // (el canal por donde se va, libre: nada del manglar le cae encima a la barca)
  const [rx, ry] = rumbo;
  z.objetos = z.objetos.filter((o) => { if (o.tag || /muro|hito/.test(o.id)) return true; const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay, k = Math.max(-2, Math.min(7, dx * rx + dy * ry)); return Math.hypot(dx - rx * k, dy - ry * k) > 3.6 + Math.max(o.hw ?? 0, o.hh ?? 0); });
  const o: any = { id: 'sel2_barca', v: 'piragua', cx: e.ax - 0.5, cy: e.ay - 0.5, hw: 1, hh: 1, bloquea: false, capa: 'cine' };
  z.objetos.push(o); e.mem.barca = o; e.mem.rumbo = rumbo;
}
/** Lo que se corrió la barca a los tl segundos (arranca despacio cuando Oyá suelta las amarras). */
const deriva = (tl: number) => (tl < 5.6 ? 0 : tl < 6.6 ? 0.45 * (tl - 5.6) ** 2 : 0.45 + 0.9 * (tl - 6.6));
/** La barca y los que van en ella, corridos por el canal (después de que el director los puso en su clave). */
function moverBarca(e: EstadoToma, tl: number) {
  const o = e.mem.barca; if (!o) return; const [rx, ry] = e.mem.rumbo, d = deriva(tl), mece = Math.sin(tl * 1.7) * 0.03;
  o.cx = e.ax - 0.5 + rx * d; o.cy = e.ay - 0.5 + ry * d + mece;
  if (tl < 5.6) return;
  for (const id of ['oya', 'heroe', 'thor']) { const m = e.actores.get(id) as any; if (!m) continue; m.x += rx * d; m.y += ry * d + mece; if (id !== 'oya') m.dir = dirRumbo(rx, ry); }
}
const dirRumbo = (rx: number, ry: number) => (rx > 0.3 ? (ry < -0.3 ? 'ne' : 'e') : rx < -0.3 ? (ry < -0.3 ? 'no' : 'o') : 'n') as any;

/**
 * Donde Vesperio camina sobre el agua: un tramo de agua negra que corre a lo largo de x por donde va (de +4,6 a -0,6 del ancla)
 * con agua también a los lados (no una orilla de adoquín). Se mira celda a celda.
 */
function anclaCanal(z: any): [number, number] {
  const agua = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && /a3_agua_negra/.test(z.pisos[ty * z.tw + tx]?.id ?? ''); };
  let mejor: [number, number] | null = null, nota = -1;
  for (let y = 6; y < z.H - 6; y += 1) for (let x = 6; x < z.W - 10; x += 1) {
    let n = 0, ok = true;
    for (let dx = -2; dx <= 6 && ok; dx++) { if (!agua(x + dx, y)) ok = false; for (const dy of [-2, -1, 1, 2]) if (agua(x + dx, y + dy)) n++; }
    if (!ok) continue;
    for (let dy = -5; dy <= 3; dy++) for (const dx of [-3, 0, 3, 6]) if (agua(x + dx, y + dy)) n += 0.5;
    if (n > nota) { nota = n; mejor = [x, y]; }
  }
  return mejor ?? anclaAgua(/a3_agua_negra/, false)(z);
}

// ------------------------------------------------------------------ el guion
const tomas: Toma[] = [
  {
    // la cámara del rey: Khamer-Ul de rodillas ante su estatua; el golpe corta a ×3 y el cuerpo se deshace en arena
    id: 'camara', dur: 10, zona: 'a2_tumbas2', ancla: anclaJefe, entra: 1.6, sale: 0.4, oscuridad: 0.82, hundir: 0.6,
    cam: [{ t: 0, x: 2.9, y: 1.2, alt: 50, zoom: 2, fy: 0.5 }, { t: 3.05, x: 1.8, y: 0.4, alt: 56, c: 'suave' }, { t: 3.06, x: 0.9, y: -0.5, alt: 62, zoom: 3, fy: 0.5 }, { t: 9.6, x: 0.7, y: -0.4, alt: 40, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_sin_sombra', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.6, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.42 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.6, y: -0.4, mira: [0, 0] }, { t: 2.2, x: 3.6, y: -0.4 }, { t: 3.0, x: 2.3, y: -0.9, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.2, y: 1.6, mira: [0, 0] }, { t: 1.3, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.2, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'rey', z: 80, r: 200 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'oro', color: [255, 190, 90], sombra: true, titila: 0.1, claves: [{ t: 0, x: -2, y: 3, z: 50, r: 240, k: 0.55 }] },
      { id: 'frio', color: [120, 110, 170], sombra: true, claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.45 }] },
    ],
    sonidos: [{ t: 0, id: 'desierto', cine: true }, { t: 1.3, id: 'grunido', vol: 0.7 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.94 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.2, id: 'arena_cae', cine: true }, { t: 5.5, id: 'golpe', cine: true }, { t: 5.5, id: 'sub', cine: true }],
    temblores: [[5.5, 0.5, 3]],
    paso: (e, tl, dt) => { if (tl > 4.4 && tl < 8.5 && Math.random() < dt * 30) arena(e, 0.1, 0.1, 3); },
    textos: [L(0, 6.0, 9.7)],
  },
  {
    // la sombra: se despega del montón de arena y se arrastra hacia la salida; le roza los pies al héroe, la suya tiembla hacia
    // ella y el héroe se da vuelta a mirarla. La brasa sube del pecho y la sigue
    id: 'sombra', dur: 9.5, zona: 'a2_tumbas2', ancla: anclaJefe, entra: 0.25, sale: 0.6, oscuridad: 0.88, hundir: 0.66,
    // (delante de la cámara: nada que tape a la sombra cuando sale; la sala queda atrás)
    preparar: (e) => { despejarPies(e, 3.5, 3.5, 3.2); if (e.z) e.z.objetos = e.z.objetos.filter((o) => { const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay; return o.tag || /muro/.test(o.id) || dx + dy < 5 || Math.hypot(dx, dy) > 17; }); },
    cam: [{ t: 0, x: 1.4, y: 0.2, alt: 26, zoom: 3, fy: 0.5 }, { t: 5, x: 2.6, y: 1.0, alt: 30, c: 'suave' }, { t: 9.5, x: 4.4, y: 3.6, alt: 40, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_sin_sombra', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.3, y: -0.9, mira: [0, 0] }, { t: 3.2, mira: [1.0, -0.3] }, { t: 4.4, mira: [2.4, 0.4] }, { t: 5.4, mira: [3.4, 1.8] }, { t: 6.0, mira: [5.0, 4.0] }, { t: 6.4, x: 2.3, y: -0.9 }, { t: 7.4, x: 3.1, y: -0.2, c: 'suave' }, { t: 7.5, mira: [7, 6.5] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 2.4, y: 1.5, mira: [0, 0] }, { t: 3.6, acc: 'especial', dur: 0.9, mira: [2.2, -0.5] }, { t: 4.5, acc: 'quieto', mira: [4, 2.5] }, { t: 5.2, x: 2.4, y: 1.5 }, { t: 6.4, x: 2.0, y: 2.3, c: 'sale' }] },
    ],
    brasa: [{ t: 0.8, x: 0.1, y: 0.1, z: 6, k: 0, tam: 0.35 }, { t: 2.0, z: 14, k: 0.6, tam: 0.6 }, { t: 3.4, x: 1.0, y: -0.2, z: 40, k: 1, tam: 1 }, { t: 5.0, x: 2.5, y: -0.2, z: 46, k: 1, c: 'suave' }, { t: 6.6, x: 4.0, y: 2.6, z: 50, k: 1, c: 'suave' }, { t: 8.6, x: 7.6, y: 7.2, z: 60, k: 0.9, c: 'suave' }],
    focos: [{ de: 'brasa', r: 190 }, { de: 'heroe', z: 30, r: 120, k: 0.8 }],
    sonidos: [{ t: 0.8, id: 'brasa_nace', cine: true }, { t: 1.6, id: 'sombra', cine: true }, { t: 3.6, id: 'grunido' }, { t: 4.6, id: 'latido', cine: true }, { t: 6.6, id: 'brasa_vuela', cine: true, vol: 0.6 }],
    paso: (e, tl) => { vez(e, 'sangre', tl, 0, () => charco(e, 'c', 0.3, 0.3, 1.0, 1.1)); vez(e, 'pecho', tl, 2.0, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 10, 26, 0.6)); },
    mundo: (e, tl) => sombras(e, tl),
    textos: [L(1, 4.6, 9.2)],
  },
  {
    // el Templo del Sol: la brasa sale por la avenida entre los colosos, el disco caído se enciende y se va al este
    id: 'sol', dur: 9, zona: 'a2_ruinas', ancla: anclaSalida('a2_sol'), entra: 0.6, sale: 0.6, oscuridad: 0.55, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a2_sol'); },
    cam: [{ t: 0, x: 6, y: 6, alt: 230, zoom: 0.6, fy: 0.5 }, { t: 9, x: 9, y: 4, alt: 200, c: 'suave' }],
    brasa: [{ t: 0.5, x: 0, y: 0, z: 60, k: 1, tam: 2 }, { t: 3.5, x: 5, y: 4, z: 120, k: 1, c: 'suave' }, { t: 6.5, x: 13, y: 2, z: 180, k: 1, c: 'suave' }, { t: 9, x: 22, y: -2, z: 220, k: 0.8, tam: 1.4, c: 'lineal' }],
    focos: [{ de: [-4, -6], z: 160, r: 380, k: 0.8 }, { de: 'brasa', r: 260 }],
    primer: [{ id: 'des2_palmera|seca', fx: 0.05, fy: 1.08, par: 1.8 }, { id: 'des2_columnas|rota', fx: 0.95, fy: 1.1, par: 2.1, mas: 2 }],
    luces: [
      { id: 'luna', color: [150, 150, 200], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.5 }] },
      // el disco de bronce caído: se enciende cuando la brasa le pasa por delante
      { id: 'disco', color: [255, 170, 70], sombra: true, claves: [{ t: 0, x: 6, y: -14, z: 60, r: 260, k: 0 }, { t: 2.6, k: 0 }, { t: 3.4, k: 1, c: 'sale' }, { t: 5.5, k: 0.15 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_arena', cine: true }, { t: 0.6, id: 'brasa_vuela', cine: true }, { t: 3.2, id: 'campana', cine: true, tono: 1.6, vol: 0.5 }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 60) { const j = e.j; j.particulas.push({ x: e.ax + (Math.random() - 0.3) * 30, y: e.ay + (Math.random() - 0.3) * 30, z: Math.random() * 80, vx: 2.2 + Math.random(), vy: -0.6, vz: 0, t: 0, dur: 2 + Math.random() * 2, color: '#a88c5c', tam: 1, grav: 0, tipo: 'ceniza' } as any); } void tl; },
    textos: [L(2, 2.4, 8.6)],
  },
  {
    // el muelle (un canal del manglar): Oyá en la popa de su barca; el héroe y Thor suben desde la orilla, ella suelta las
    // amarras y la barca se va por el canal con los tres
    id: 'muelle', dur: 10, zona: 'a3_pantano', ancla: anclaAgua(/a3_agua_negra/), objetos: ['sel2_barca|piragua'], entra: 0.7, sale: 0.6, oscuridad: 0.5, hundir: 0.5,
    preparar: (e) => { despejarPies(e, 0, 0, 6); despejarPies(e, 2, 4, 5); despejarPies(e, 0, 9, 6); if (e.z) e.z.objetos = e.z.objetos.filter((o) => !/cofre/.test(o.id) || Math.hypot(o.cx - e.ax, o.cy - e.ay) > 14); ponerBarca(e); },
    cam: [{ t: 0, x: 1.4, y: 2.4, alt: 34, zoom: 2, fy: 0.5 }, { t: 5.5, x: 0.6, y: 1.2, alt: 38, c: 'suave' }, { t: 10, x: 1.6, y: -0.8, alt: 42, c: 'suave' }],
    actores: [
      { id: 'oya', tipo: 'sprite', sprite: 'oya', claves: [{ t: 0, x: -0.7, y: 0.5, mira: [2.5, 4.5] }, { t: 4.2, mira: [0.6, -0.4] }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.6, y: 5.4 }, { t: 2.2, x: 0.9, y: 2.6, c: 'lineal' }, { t: 3.4, x: 0.25, y: 0.05, c: 'sale' }, { t: 3.5, mira: [3, -3] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0.4, x: 3.4, y: 5.6 }, { t: 2.8, x: 1.4, y: 2.4, c: 'lineal' }, { t: 3.8, x: 0.75, y: -0.45, c: 'sale' }, { t: 3.9, mira: [3, -3] }] },
    ],
    focos: [{ de: 'heroe', z: 34, r: 160 }, { de: 'oya', z: 34, r: 110, k: 0.7 }],
    primer: [{ id: 'sel2_helecho|arborescente', fx: 0.06, fy: 1.1, par: 1.9, mas: 2 }],
    luces: [
      { id: 'farol', color: [255, 180, 110], sombra: true, titila: 0.15, claves: [{ t: 0, x: 1.4, y: 2.2, z: 40, r: 170, k: 0.7 }] },
      { id: 'cielo', color: [130, 150, 170], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 700, k: 0.35 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_arena', cine: true, vol: 0.4 }, { t: 5.4, id: 'puerta', vol: 0.4 }],
    paso: (e, tl) => moverBarca(e, tl),
    textos: [L(3, 4.4, 9.6)],
  },
  {
    // sobre el agua: algo pálido camina detrás de la barca, cantando, y no se hunde
    id: 'agua', dur: 9, zona: 'a3_pantano', ancla: anclaCanal, entra: 0.6, sale: 0.7, oscuridad: 0.66, hundir: 0.62, sinClima: ['fx_luciernagas'],
    // (lo que crece en el agua y delante de la cámara sale: el manglar lo tapaba hasta la cabeza)
    preparar: (e) => { if (e.z) e.z.objetos = e.z.objetos.filter((o) => { const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay; const u = dx + dy - 4, w = dx - dy - 3; return /muro/.test(o.id) || !(u > -7 && u < 18 && Math.abs(w) < 15); }); },
    cam: [{ t: 0, x: 2.6, y: 0.4, alt: 44, zoom: 3, fy: 0.55 }, { t: 9, x: 0.4, y: 0.2, alt: 46, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#241c2c', 0.4], claves: [{ t: 0, x: 4.6, y: 0.3, acc: 'caminar', dir: 'o' }, { t: 9, x: -0.6, y: 0.3, c: 'lineal' }] },
    ],
    focos: [{ de: 'vesperio', z: 56, r: 170, k: 0.8 }],
    luces: [{ id: 'ves', color: VIOLETA, sombra: true, claves: [{ t: 0, x: 5.6, y: -1, z: 46, r: 150, k: 0.9 }, { t: 9, x: 0.4, y: -1, c: 'lineal' }] }],
    sonidos: [{ t: 0, id: 'coro_agua', cine: true }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * 8) ceniza(e.j, m.x, m.y, 1, '#9e96ae'); void tl; },
    mundo: (e, tl) => {
      // los anillos en el agua bajo sus pies: no se hunde, el agua apenas lo nota
      const m = e.actores.get('vesperio') as any; if (!m) return;
      ctx.save(); ctx.strokeStyle = 'rgba(190,180,220,0.5)'; ctx.lineWidth = 1;
      for (let k = 0; k < 3; k++) { const u = ((tl * 0.9 + k / 3) % 1), [px, py] = aPant(m.x + 0.4 * (1 - u), m.y); ctx.globalAlpha = 0.85 * (1 - u); ctx.beginPath(); ctx.ellipse(Math.round(px), Math.round(py), 4 + u * 22, 2 + u * 11, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
    textos: [L(4, 1.6, 8.4)],
  },
  {
    // Yhuantl: la brasa sube por la escalera de la pirámide y entra por la máscara; los tambores suenan solos
    id: 'yhuantl', dur: 10, zona: 'a3_pantano', ancla: anclaSalida('a3_templo1'), entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a3_templo1'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 250, zoom: 0.6, fy: 0.5 }, { t: 10, x: 6, y: 6, alt: 300, c: 'suave' }],
    brasa: [{ t: 0, x: 18, y: 16, z: 160, k: 1, tam: 1.2 }, { t: 3.4, x: 6, y: 6, z: 60, k: 1, c: 'suave' }, { t: 6.2, x: 0.5, y: 0.5, z: 30, k: 1, tam: 1, c: 'suave' }, { t: 6.8, x: 0, y: 0, z: 26, k: 0, tam: 0.6 }],
    focos: [{ de: [-6, -6], z: 260, r: 420, k: 0.8 }, { de: 'brasa', r: 240 }],
    primer: [{ id: 'sel2_helecho|arborescente', fx: 0.05, fy: 1.08, par: 1.7, mas: 2 }, { id: 'sel2_manglar|raices', fx: 0.95, fy: 1.1, par: 2.0 }],
    luces: [
      { id: 'boca', color: [255, 90, 40], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 30, r: 200, k: 0 }, { t: 6.4, k: 0 }, { t: 7.0, k: 1, r: 320, c: 'sale' }, { t: 10, k: 0.7 }] },
      { id: 'luna', color: [120, 150, 140], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.4 }] },
    ],
    sonidos: [{ t: 0.2, id: 'brasa_vuela', cine: true, vol: 0.6 }, { t: 6.6, id: 'sub', cine: true }, { t: 6.8, id: 'tambores', cine: true }],
    temblores: [[6.7, 0.4, 2]],
    paso: (e, tl) => vez(e, 'entra', tl, 6.7, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 30, 50, 1)),
    textos: [L(5, 6.8, 9.8)],
  },
  { id: 'acto3', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 3) },
];

export const CINE_ACTO2: Guion = { id: 'acto2', acto: 2, tomas };
