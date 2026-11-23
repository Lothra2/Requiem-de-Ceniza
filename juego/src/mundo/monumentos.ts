// Los monumentos de los actos 2 a 7 (22 nov 2026, Rick: "algo emblemático por acto como la catedral que sale en el acto 1, bien
// representativo del acto, MUY bien elaborado y de tamaño BIEN grande"). Cada uno es el ancla de un mundo abierto, como la
// catedral de Santa Oria en el camposanto: va en el centro del mapa, en tres piezas (catalogo/monumentos_kit.ts), y su puerta es
// la salida a la mazmorra importante del acto (la que ya tenía esa zona: no cambia ningún id de zona ni de salida). Las piezas y
// su relato viven en `src/engine/gotico/catalogo/monumento_*.ts`. `__sinMonumentos` vuelve a la boca de siempre.
import type { DefZona } from './zona';
import { piezasMonumento, puertaMonumento, fondoMonumento } from '../../../src/engine/gotico/catalogo/monumentos_kit';

type Ancla = NonNullable<DefZona['ancla']>;
/** Las piezas de los monumentos (sus prefijos): no se riegan con el tema (van solo en su atrio) ni llevan la bruma de altura. */
export const PIEZA_MONUMENTO = /^mon_(sol|yh|yhuantl|hr|hrim|fr|fragua|ys|ysmeral|es|escalera)_/;
type Mon = Ancla & { color: string; motas?: [string, string, string]; eje?: 'y' | 'diag' };
/** El atrio de cada uno: el piso que va bajo la obra y la plaza de adelante, reservada para que el riego no caiga encima. */
const atrio = (piso: string, marco: [string, string, number, number][] = [], atras = -14) => ({ piso, marco, reservar: [4, 4, 24, 24] as [number, number, number, number], tierra: [atras, atras, 18, 18] as [number, number, number, number] });
/** Un monumento de cara a la cámara (monumentos_kit.ts): sus piezas, la puerta en la muesca y lo que va suelto alrededor. */
const mon = (id: string, salida: string, piso: string, marco: [string, string, number, number][], color: string, motas?: [string, string, string]): Mon =>
  ({ piezas: piezasMonumento(id), puerta: puertaMonumento(id), salida, marco: atrio(piso, marco, Math.min(-14, fondoMonumento(id) - 1)), color, motas, eje: 'diag' });

export const MONUMENTOS: Record<string, Mon> = {
  // acto 2: el Templo del Sol Caído, en las Ruinas del Sol (baja al templo, a2_sol)
  // (los colosos a los lados de la avenida, el sol caído a la derecha con el andamio de los saqueadores y su campamento a la izquierda)
  a2_ruinas: mon('mon_sol', 'a2_sol', 'arenisca', [['mon_sol_rampa', 'arenada', 10, 10], ['mon_sol_brasero', 'encendido', 11, 9], ['mon_sol_brasero', 'encendido', 9, 11], ['mon_sol_coloso', 'izq', 6, 17], ['mon_sol_coloso', 'der_partido', 17, 6], ['mon_sol_disco', 'clavado', 13, -7], ['mon_sol_saqueo', 'abandonado', -6, 14]], '255,160,60', ['#ffb040', '#ffe08a', '#b89a70']),
  a3_pantano: mon('mon_yhuantl', 'a3_templo1', 'lajas_musgo', [['mon_yh_antorcha', 'izq', 8, 17], ['mon_yh_antorcha', 'der', 17, 8], ['mon_yh_tambores', 'circulo', 4, 21], ['mon_yh_altar', 'sangre', 21, 4]], '64,255,144', ['#40ff90', '#b0ffd0', '#6a7a60']),
  // acto 4: la Boca del Aliento, el glaciar con el frente de los jarls y el barco preso en el hielo (baja a a4_hielo1)
  a4_glaciar: mon('mon_hrim', 'a4_hielo1', 'hielo', [['mon_hr_jarl', 'izq', 2, 18], ['mon_hr_jarl', 'der_viejo', 18, 2], ['mon_hr_brasero', 'encendido', 13, 11], ['mon_hr_brasero', 'encendido', 11, 13], ['mon_hr_escudos', 'helado', -5, 23], ['mon_hr_trineo', 'vacio', 23, -5]], '106,208,255', ['#8ad8ff', '#e0f6ff', '#9aa8b4']),
  // acto 5: la Fragua de Ozmaren, el volcán de columnas con la brasa en el cráter (baja a a5_fragua; el río de lava va por un costado)
  a5_rio: mon('mon_fragua', 'a5_fragua', 'lava_grietas', [['mon_fr_yunque', 'martillo', 0, 21], ['mon_fr_yunque', 'tenazas', 21, 0], ['mon_fr_brasero', 'encendido', 13, 11], ['mon_fr_brasero', 'encendido', 11, 13], ['mon_fr_cadena', 'tirando', -5, 23], ['mon_fr_moldes', 'enfriando', 23, -5]], '255,122,36', ['#ff7a24', '#ffd080', '#5a4a40']),
  // acto 6: la Catedral de las Campanas Ahogadas, hundida y escorada con el mar adentro (baja a a6_catedral1)
  a6_barrio2: mon('mon_ysmeral', 'a6_catedral1', 'empedrado', [['mon_ys_pilar', 'entero', 0, 21], ['mon_ys_pilar', 'ladeado', 21, 0], ['mon_ys_brasero', 'encendido', 13, 11], ['mon_ys_brasero', 'encendido', 11, 13], ['mon_ys_ancla', 'clavada', -5, 23], ['mon_ys_campana', 'abrazada', 23, -5]], '74,216,154', ['#4ad89a', '#c8f8de', '#7a8a90']),
  // acto 7: la Escalera al Trono, la escalera de caracol que flota alrededor del haz hasta el halo partido (baja a a7_escaleras)
  a7_jardin: mon('mon_escalera', 'a7_escaleras', 'fortaleza', [['mon_es_estela', 'entera', 0, 21], ['mon_es_estela', 'raspada', 21, 0], ['mon_es_brasero', 'encendido', 16, 9], ['mon_es_brasero', 'encendido', 9, 16], ['mon_es_septimo', 'caido', 15, 15], ['mon_es_losas', 'nombres', -5, 23]], '255,236,180', ['#fff2c8', '#ffe8a0', '#c8b890']),
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
