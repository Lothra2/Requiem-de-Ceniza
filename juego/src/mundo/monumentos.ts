// Los monumentos de los actos 2 a 7 (22 nov 2026, Rick: "algo emblemático por acto como la catedral que sale en el acto 1, bien
// representativo del acto, MUY bien elaborado y de tamaño BIEN grande"). Cada uno es el ancla de un mundo abierto, como la
// catedral de Santa Oria en el camposanto: va en el centro del mapa, en tres piezas (catalogo/monumentos_kit.ts), y su puerta es
// la salida a la mazmorra importante del acto (la que ya tenía esa zona: no cambia ningún id de zona ni de salida). Las piezas y
// su relato viven en `src/engine/gotico/catalogo/monumento_*.ts`. `__sinMonumentos` vuelve a la boca de siempre.
import type { DefZona } from './zona';
import { piezasMonumento, PUERTA_DIAGONAL } from '../../../src/engine/gotico/catalogo/monumentos_kit';

type Ancla = NonNullable<DefZona['ancla']>;
type Mon = Ancla & { color: string; motas?: [string, string, string]; eje?: 'y' | 'diag' };
/** El atrio de cada uno: el piso que va bajo la obra y la plaza de adelante, reservada para que el riego no caiga encima. */
const atrio = (piso: string, marco: [string, string, number, number][] = []) => ({ piso, marco, reservar: [4, 4, 24, 24] as [number, number, number, number], tierra: [-14, -14, 18, 18] as [number, number, number, number] });
/** Un monumento de cara a la cámara (monumentos_kit.ts): sus piezas, la puerta en la muesca y lo que va suelto alrededor. */
const mon = (id: string, salida: string, piso: string, marco: [string, string, number, number][], color: string, motas?: [string, string, string]): Mon =>
  ({ piezas: piezasMonumento(id), puerta: PUERTA_DIAGONAL, salida, marco: atrio(piso, marco), color, motas, eje: 'diag' });

export const MONUMENTOS: Record<string, Mon> = {
  // acto 2: el Templo del Sol Caído, en las Ruinas del Sol (baja al templo, a2_sol)
  // (los colosos a los lados de la avenida, el sol caído a la derecha con el andamio de los saqueadores y su campamento a la izquierda)
  a2_ruinas: mon('mon_sol', 'a2_sol', 'arenisca', [['mon_sol_rampa', 'arenada', 10, 10], ['mon_sol_coloso', 'izq', 6, 17], ['mon_sol_coloso', 'der_partido', 17, 6], ['mon_sol_disco', 'clavado', 13, -7], ['mon_sol_saqueo', 'abandonado', -6, 14]], '255,160,60', ['#ffb040', '#ffe08a', '#b89a70']),
};

/** El monumento de una zona (o nada con `__sinMonumentos`). */
export function monumentoDe(id: string): Mon | undefined {
  return (globalThis as any).__sinMonumentos ? undefined : MONUMENTOS[id];
}
/** La luz que sale por la puerta de un monumento (rgb) y sus motas (brasa, brasa clara, ceniza), por el id de su pieza de adelante. */
export function luzMonumento(idPieza: string): { color: string; motas?: [string, string, string]; eje?: 'y' | 'diag' } | undefined {
  for (const m of Object.values(MONUMENTOS)) if (m.piezas[m.piezas.length - 1][0] === idPieza) return m;
  return undefined;
}
