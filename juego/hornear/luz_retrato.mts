// La luz y el grano de los retratos de la selección (grupo 'r'), aparte del motor para no mover __PINTOR__ (la huella
// del caché de héroes pintados): cambiar esto no repinta a nadie. Lo usan obrero.mts y las pruebas de retrato.
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '../../src/engine/gotico');
const { retrato } = await import(join(raiz, 'retrato.ts'));
const { MATERIALES } = await import(join(raiz, 'materiales.ts'));

/** Cuántas veces el tamaño del juego se hornea el retrato: el juego lo dibuja a ×2 en 720 y ×3 en 1080 (puntos enteros). */
export const K_RETRATO = 2.25;

type V = [number, number, number];
/** Espejo horizontal de la pantalla: en la vista isométrica es cambiar x por y del mundo. */
const esp = (v: V): V => [v[1], v[0], v[2]];

/**
 * La luz de retrato del motor (retrato.ts) con la fogata a la IZQUIERDA del héroe en pantalla, delante de su cara: el
 * héroe mira hacia abajo a la izquierda ('so') y con la fogata a la derecha la cara quedaba del lado de la sombra, gris
 * como una calavera bajo el relleno frío. Ahora la fogata le da de frente en la cara y el pecho (luz corta: el lado
 * que ve la cámara cae a la sombra), un relleno frío muy bajo y una contraluz fría desde atrás a la derecha que recorta
 * cabeza, hombros y el arma. Clave baja: el negro de la sombra es profundo, pero con algo de color.
 */
export function luzRetrato(k = K_RETRATO, o: any = {}) {
  const b = retrato(k);
  // la fogata: casi de frente y un poco a la izquierda de su cara, baja (la hoguera alumbra desde abajo)
  const hz: [number, number] = o.hz ?? [0.1, 0.99], incl = ((o.incl ?? 8) * Math.PI) / 180, l = Math.hypot(hz[0], hz[1]);
  const d: V = [(hz[0] / l) * Math.cos(incl), (hz[1] / l) * Math.cos(incl), -Math.sin(incl)];
  const pecho: V = [0, 0, 50 * k], dist = 80 * k;
  const pos: V = [pecho[0] + d[0] * dist, pecho[1] + d[1] * dist, Math.max(6 * k, pecho[2] + d[2] * dist)];
  const al: V = [pos[0] - pecho[0], pos[1] - pecho[1], pos[2] - pecho[2]], la = Math.hypot(...al);
  const r: any = {
    ...b,
    relieve: 1, cavidad: 1, tonos: 3,
    amb: 0.05, cielo: 0.03, gamma: 1.22, expo: 1.0,
    principal: { ...b.principal, dir: [al[0] / la, al[1] / la, al[2] / la] as V, pos, color: '#ffa458', tinte: 0.55, alcance: 70 * k, foco: [2 * k, 46 * k, 0.55] },
    relleno: { dir: esp([-0.6, 0.6, 0.35]), color: '#5d72a8', fuerza: 0.13, tinte: 0.7 },
    borde: { ...b.borde, dir: esp([-0.8, -0.2, 0.6]), fuerza: 0.55, color: '#6d8cc4', ancho: 2.4, mezcla: 0.8, contorno: 1.4 },
    sombra: { color: '#07080f', fuerza: 0.62, hasta: 0.32 },
    piel: { sombra: '#2a0c08', satura: 0.95, luz: 0, ao: 0.45 },
    techo: { desde: 115, k: 0.4, color: '#e0c49c', mezcla: 0.25 },
  };
  for (const [c, v] of Object.entries(o)) if (c !== 'hz' && c !== 'incl') r[c] = v && typeof v === 'object' && !Array.isArray(v) ? { ...r[c], ...v } : v;
  return r;
}

/**
 * Mientras se pinta un retrato a `f` veces el tamaño del juego, el grano de los materiales (ruido y patrón) va `f` veces
 * más grande: así la tela, el cuero y la placa tienen la misma textura por cuerpo que en el juego, con más puntos para
 * dibujarla. Sin esto, a 2,25 el grano quedaba del mismo tamaño en puntos y el cuerpo parecía arena.
 */
export function conGrano<T>(f: number, fn: () => T): T {
  if (f === 1) return fn();
  const viejos: [any, number, any][] = [];
  for (const m of Object.values(MATERIALES) as any[]) {
    viejos.push([m, m.escala, m.patron]);
    m.escala = m.escala / f;
    if (m.patron) { const p0 = m.patron; m.patron = (p: V, n: V) => p0([p[0] / f, p[1] / f, p[2] / f], n); }
  }
  try { return fn(); } finally { for (const [m, e, p] of viejos) { m.escala = e; m.patron = p; } }
}
