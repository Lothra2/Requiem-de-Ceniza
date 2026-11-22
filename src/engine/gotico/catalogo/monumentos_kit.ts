import { registrar, type Pieza, type V3 } from '../objeto';
import { esferaDe } from '../render';
import type { Tema } from '../objeto';
import { G, raiz, bajoTierra } from '../kit_muerte';

/**
 * Los monumentos de los actos 2 a 7 (uno por acto, como la catedral de Santa Oria en el 1): una obra enorme en el centro de
 * un mundo abierto, cuya puerta es la entrada a la mazmorra importante del acto.
 *
 * Miran a la cámara (la diagonal +x +y), con el eje de la avenida en x = y: la puerta queda al frente y al centro de la pantalla
 * al llegar, y lo que flanquea la avenida (colosos, cabezas, estatuas) cae a los costados, sin taparla. La obra se modela entera
 * una sola vez en el marco de la avenida (`F` en `armar`: +y hacia la cámara, +x a la derecha de la pantalla, unidades del
 * mundo, 16 por celda, una persona mide unas 75), con el origen en el centro de la pieza del medio. Como un sprite tiene su
 * límite, va en piezas de huella cuadrada encadenadas por la diagonal (`DIAGONAL`): cada pieza se queda con lo que cae en su
 * huella (`partir`) y lo que cruza una costura va en las dos, cortado a regla. Así la silueta es una sola.
 *
 *   <id>_atras   huella 10×10  en (-8, -8)   lo de atrás (el santuario, lo que se ve más alto en la pantalla)
 *   <id>_medio   huella 14×14  en (0, 0)     el cuerpo
 *   <id>_izq     huella 7×7    en (3, 10)    el ala de la izquierda de la portada (en la pantalla)
 *   <id>_der     huella 7×7    en (10, 3)    el ala de la derecha
 *
 * La puerta va en la celda (7, 7), en la muesca entre las dos alas: el héroe llega por la avenida diagonal y entra de frente.
 * Lo que va suelto alrededor (colosos, el disco caído, campamentos) son objetos propios, puestos por el atrio (monumentos.ts).
 *
 * Ojo con la cámara (escena.ts sube a lo sumo 240 frente a un monumento): parado en la puerta entran en la pantalla de 720
 * unos 550 puntos sobre el héroe. Lo de atrás ya se ve más alto por estar atrás: en el marco F, la altura que entra a la
 * distancia `u` del centro (hacia la cámara) es `alturaMax(u)`.
 */
export interface PiezaMon { fr: string; dx: number; dy: number; w: number; h: number }
export const DIAGONAL: PiezaMon[] = [
  { fr: 'atras', dx: -8, dy: -8, w: 10, h: 10 },
  { fr: 'medio', dx: 0, dy: 0, w: 14, h: 14 },
  { fr: 'izq', dx: 3, dy: 10, w: 7, h: 7 },
  { fr: 'der', dx: 10, dy: 3, w: 7, h: 7 },
];
/** La celda de la puerta (desde la pieza del medio) en el arreglo DIAGONAL. */
export const PUERTA_DIAGONAL: [number, number] = [7, 7];
/** La altura máxima (unidades) que entra en la pantalla parado en la puerta, a la distancia `u` (unidades, hacia la cámara). */
export const alturaMax = (u: number) => 550 - 0.707 * (7 * 16 * 1.414 + 24 - u);
export interface Monumento {
  id: string;
  nombre: [string, string];
  tema: Tema;
  variantes?: string[];
  cuadros?: number;
  piezas?: PiezaMon[];
  /** Arma la obra entera. `F` es el marco de la avenida (ver arriba); `g` el de la grilla (por si hace falta). Devuelve las luces por pieza. */
  armar: (F: G, v: string, f: number, g: G) => Record<string, { c: V3; r: number; color: string }> | void;
}

/** Lo que ocupa una pieza en x y en y y su punto más alto: los poliedros por sus vértices, los palos por sus puntas, lo demás por su esfera. */
function rango(p: Pieza): [number, number, number, number, number] {
  if (p.k === 'conv') { let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity, z = -Infinity; for (const q of p.pts) { x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); z = Math.max(z, q[2]); } return [x0, x1, y0, y1, z]; }
  if (p.k === 'cono') { const R = Math.max(p.r0, p.r1), e = [p.o[0] + p.ez[0] * p.h, p.o[1] + p.ez[1] * p.h, p.o[2] + p.ez[2] * p.h]; return [Math.min(p.o[0], e[0]) - R, Math.max(p.o[0], e[0]) + R, Math.min(p.o[1], e[1]) - R, Math.max(p.o[1], e[1]) + R, Math.max(p.o[2], e[2]) + R]; }
  if (p.k === 'elip') { const R = Math.max(...p.r); return [p.c[0] - R, p.c[0] + R, p.c[1] - R, p.c[1] + R, p.c[2] + R]; }
  const e = esferaDe(p); return [e[0] - e[3], e[0] + e[3], e[1] - e[3], e[1] + e[3], e[2] + e[3]];
}
let herr: { caja: (x: number, y: number, z: number, w: number, d: number, h: number, o: { mat: string; resta?: boolean }) => Pieza } | null = null;
/** Las piezas que caen (aunque sea en parte) en la caja [x0, x1] × [y0, y1], más los cortes que se llevan lo que sobra de cada lado.
 *  (la caja del corte no pasa de lo más alto que queda: el motor mide la sombra del sprite con el alto de todas las piezas) */
function partir(ps: Pieza[], x0: number, x1: number, y0: number, y1: number): Pieza[] {
  const out: Pieza[] = [], corta = [false, false, false, false];
  let zmax = 0;
  for (const p of ps) {
    if (p.resta) { out.push(p); continue; }
    const [a0, a1, b0, b1, zt] = rango(p);
    if (a1 < x0 || a0 > x1 || b1 < y0 || b0 > y1) continue;
    out.push(p); zmax = Math.max(zmax, zt);
    if (a0 < x0) corta[0] = true; if (a1 > x1) corta[1] = true; if (b0 < y0) corta[2] = true; if (b1 > y1) corta[3] = true;
  }
  const o = { mat: 'negro', resta: true }, Z = zmax + 10;
  if (corta[0]) out.push(herr!.caja(x0 - 500, 0, -10, 1000, 3000, Z, o));
  if (corta[1]) out.push(herr!.caja(x1 + 500, 0, -10, 1000, 3000, Z, o));
  if (corta[2]) out.push(herr!.caja(0, y0 - 500, -10, 3000, 1000, Z, o));
  if (corta[3]) out.push(herr!.caja(0, y1 + 500, -10, 3000, 1000, Z, o));
  return out;
}

const DEFS = new Map<string, PiezaMon[]>();
export function registrarMonumento(m: Monumento) {
  const variantes = m.variantes ?? ['entera'], pzs = m.piezas ?? DIAGONAL;
  DEFS.set(m.id, pzs);
  for (const pz of pzs) {
    const ox = pz.dx * 16, oy = pz.dy * 16;
    registrar({
      id: `${m.id}_${pz.fr}`, nombre: [`${m.nombre[0]} (${pz.fr})`, `${m.nombre[1]} (${pz.fr})`], tema: m.tema, variantes, huella: [pz.w, pz.h], bloquea: true,
      cuadros: m.cuadros ?? 1, t: 3,
      armar: (v, f, a) => {
        herr = a;
        const { ps, g } = raiz(a), gg = g.sub(-ox, -oy, 0);
        const luces = m.armar(gg.sub(0, 0, 0, -45), v, f, gg) || {};
        const mias = partir(ps, -pz.w * 8, pz.w * 8, -pz.h * 8, pz.h * 8);
        bajoTierra(mias);
        const l = luces[pz.fr];
        return { piezas: mias, resplandor: l ? { ...l, c: [l.c[0] - ox, l.c[1] - oy, l.c[2]] as V3 } : undefined };
      },
    });
  }
}
/** Las piezas de un monumento para el `ancla` de la zona: [id, dx, dy], la de la puerta (la última del arreglo) al final. */
export const piezasMonumento = (id: string): [string, number, number][] => (DEFS.get(id) ?? DIAGONAL).map((p) => [`${id}_${p.fr}`, p.dx, p.dy]);
/** De un punto del marco de la avenida (u hacia la cámara, v a la derecha, unidades) a la grilla (unidades). */
export const deAvenida = (v: number, u: number): [number, number] => [(v + u) * 0.7071, (u - v) * 0.7071];
