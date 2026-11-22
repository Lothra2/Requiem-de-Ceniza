// Los monumentos de los actos 2 a 7 (22 nov 2026, Rick: "algo emblemático por acto como la catedral que sale en el acto 1, bien
// representativo del acto, MUY bien elaborado y de tamaño BIEN grande"). Cada uno es el ancla de un mundo abierto, como la
// catedral de Santa Oria en el camposanto: va en el centro del mapa, en tres piezas (catalogo/monumentos_kit.ts), y su puerta es
// la salida a la mazmorra importante del acto (la que ya tenía esa zona: no cambia ningún id de zona ni de salida). Las piezas y
// su relato viven en `src/engine/gotico/catalogo/monumento_*.ts`. `__sinMonumentos` vuelve a la boca de siempre.
import type { DefZona } from './zona';

type Ancla = NonNullable<DefZona['ancla']>;
type Mon = Ancla & { color: string; motas?: [string, string, string] };
const pz = (id: string): [string, number, number][] => [[`${id}_atras`, 0, -9], [`${id}_medio`, 0, 0], [`${id}_frente`, 0, 7]];
/** El atrio de cada uno: el piso que va bajo la obra y la plaza de adelante, reservada para que el riego no caiga encima. */
const atrio = (piso: string, marco: [string, string, number, number][] = []) => ({ piso, marco, reservar: [-8, 9, 8, 24] as [number, number, number, number], tierra: [-9, -14, 9, 12] as [number, number, number, number] });

export const MONUMENTOS: Record<string, Mon> = {
  // acto 2: el Templo del Sol Caído, en las Ruinas del Sol (baja al templo, a2_sol)
  a2_ruinas: { piezas: pz('mon_sol'), puerta: [0, 8], salida: 'a2_sol', marco: atrio('arenisca'), color: '255,160,60', motas: ['#ffb040', '#ffe08a', '#b89a70'] },
};

/** El monumento de una zona (o nada con `__sinMonumentos`). */
export function monumentoDe(id: string): Mon | undefined {
  return (globalThis as any).__sinMonumentos ? undefined : MONUMENTOS[id];
}
/** La luz que sale por la puerta de un monumento (rgb) y sus motas (brasa, brasa clara, ceniza), por el id de su pieza de adelante. */
export function luzMonumento(idPieza: string): { color: string; motas?: [string, string, string] } | undefined {
  for (const m of Object.values(MONUMENTOS)) if (m.piezas[m.piezas.length - 1][0] === idPieza) return m;
  return undefined;
}
