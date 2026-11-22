import { registrar, type Pieza, type V3 } from '../objeto';
import { esferaDe } from '../render';
import type { Tema } from '../objeto';
import { G, raiz, bajoTierra } from '../kit_muerte';

/**
 * Los monumentos de los actos 2 a 7 (uno por acto, como la catedral de Santa Oria en el 1): una obra enorme en el centro de
 * un mundo abierto, cuya puerta es la entrada a la mazmorra importante del acto. Como la catedral, va en tres piezas que
 * encajan a lo largo de y (la prueba del catálogo pide sprites de menos de 900 puntos de lado) y comparten el mismo marco:
 *
 *   <id>_atras    huella 13×8   ancla en (cx, cy - 9)   lo alto, contra el fondo
 *   <id>_medio    huella 13×9   ancla en (cx, cy)       el cuerpo
 *   <id>_frente   huella 13×5   ancla en (cx, cy + 7)   la portada; la puerta en la celda (cx, cy + 8)
 *
 * La obra se modela entera de una vez, en unidades del mundo (16 por celda, una persona mide unas 75 de alto), con el origen
 * en el centro de la pieza del medio, y cada pieza se queda con lo que cae en su franja de y (`partir`): lo que cruza una
 * costura va en las dos, cortado a regla por la costura. Así la silueta es una sola y nada queda flotando entre piezas.
 */

/** Las tres franjas en y (unidades, desde el centro de la pieza del medio): las costuras van a media celda de cada huella. */
export const FRANJAS = { atras: [-400, -76], medio: [-76, 72], frente: [72, 400] } as const;
const DY = { atras: -9, medio: 0, frente: 7 } as const;
const HUELLA = { atras: [13, 8], medio: [13, 9], frente: [13, 5] } as const;
export type Franja = keyof typeof FRANJAS;
export interface Monumento {
  id: string;
  nombre: [string, string];
  tema: Tema;
  variantes?: string[];
  cuadros?: number;
  /** Arma la obra entera en `g` (origen en el centro de la pieza del medio) y devuelve las luces que quiera por franja. */
  armar: (g: G, v: string, f: number) => Partial<Record<Franja, { c: V3; r: number; color: string }>> | void;
}

/** Lo que ocupa una pieza en y (de a a b) y su punto más alto: los poliedros por sus vértices, lo demás por su esfera. */
function rangoY(p: Pieza): [number, number, number] {
  if (p.k === 'conv') { let a = Infinity, b = -Infinity, z = -Infinity; for (const q of p.pts) { a = Math.min(a, q[1]); b = Math.max(b, q[1]); z = Math.max(z, q[2]); } return [a, b, z]; }
  const e = esferaDe(p); return [e[1] - e[3], e[1] + e[3], e[2] + e[3]];
}
/** Las piezas que caen (aunque sea en parte) en [y0, y1], más dos cortes que se llevan lo que sobra de cada lado. */
function partir(ps: Pieza[], y0: number, y1: number): Pieza[] {
  const out: Pieza[] = [];
  let corta0 = false, corta1 = false, zmax = 0;
  for (const p of ps) {
    if (p.resta) { out.push(p); continue; }
    const [a, b, zt] = rangoY(p);
    if (b < y0 || a > y1) continue;
    out.push(p); zmax = Math.max(zmax, zt);
    if (a < y0) corta0 = true;
    if (b > y1) corta1 = true;
  }
  return out.concat(corta0 || corta1 ? cortes(y0, y1, corta0, corta1, zmax) : []);
}
let herr: { caja: (x: number, y: number, z: number, w: number, d: number, h: number, o: { mat: string; resta?: boolean }) => Pieza } | null = null;
/** (la caja del corte no pasa de lo más alto que queda: el motor mide la sombra del sprite con el alto de todas las piezas) */
function cortes(y0: number, y1: number, c0: boolean, c1: boolean, zmax: number): Pieza[] {
  const r: Pieza[] = [];
  if (c0) r.push(herr!.caja(0, y0 - 400, -10, 1600, 800, zmax, { mat: 'negro', resta: true }));
  if (c1) r.push(herr!.caja(0, y1 + 400, -10, 1600, 800, zmax, { mat: 'negro', resta: true }));
  return r;
}

export function registrarMonumento(m: Monumento) {
  const variantes = m.variantes ?? ['entera'];
  for (const fr of ['atras', 'medio', 'frente'] as Franja[]) {
    const yc = DY[fr] * 16, [y0, y1] = FRANJAS[fr];
    registrar({
      id: `${m.id}_${fr}`, nombre: [`${m.nombre[0]} (${fr})`, `${m.nombre[1]} (${fr})`], tema: m.tema, variantes, huella: [...HUELLA[fr]] as [number, number], bloquea: true,
      cuadros: m.cuadros ?? 1, t: 3,
      armar: (v, f, a) => {
        herr = a;
        const { ps, g } = raiz(a);
        const luces = m.armar(g.sub(0, -yc, 0), v, f) || {};
        const mias = partir(ps, y0 - yc, y1 - yc);
        bajoTierra(mias);
        const l = luces[fr];
        return { piezas: mias, resplandor: l ? { ...l, c: [l.c[0], l.c[1] - yc, l.c[2]] as V3 } : undefined };
      },
    });
  }
}
/** Las piezas de un monumento para `ancla` de la zona (de atrás hacia adelante). */
export const piezasMonumento = (id: string): [string, number, number][] => [[`${id}_atras`, 0, -9], [`${id}_medio`, 0, 0], [`${id}_frente`, 0, 7]];
