// Lo propio de cada zona encima de su tema (22 nov 2026, Rick: "Bajé por unas escaleras y por el portal y el mundo se parece
// mucho"). Zonas distintas con el mismo tema salían iguales: mismo piso, mismo muro, misma luz y mismo adorno. Cada acto
// tiene su tabla (acto2_zonas.ts, acto6_zonas.ts...) y aquí se juntan. `__acto<N>Viejo` vuelve a lo de antes en ese acto.
import { ZONAS_ACTO2 } from './acto2_zonas';
import { ZONAS_ACTO6 } from './acto6_zonas';
import { ZONAS_ACTO7 } from './acto7_zonas';

export type Sel = { t: string[]; p?: string[]; s?: string[]; v?: (v: string) => boolean };
export type Muro = [string, string[]];
export interface VarianteZona {
  /** El estilo del escombro, el relleno y la sillería de las mazmorras (muros.ts: paramo, cementerio, desierto, nieve...). */
  estilo?: string;
  piso?: string; parches?: string[]; camino?: string; oscuridad?: number;
  borde?: Sel[]; disperso?: Sel[]; grande?: Sel[]; luces?: Sel[]; deco?: Sel[];
  /** Afuera: los paisajes del motor que se estampan (reemplaza `vinetas`; [] ninguno). */
  vinetas?: string[];
  /** Reemplaza `extra` de la zona (los mundos abiertos). */
  extra?: Sel[];
  /** El muro de la tumba (x y su gemelo en y). Con muro propio no va la sillería genérica de la Forja (`muro_obra`). */
  muroX?: Muro; muroY?: Muro;
  /** Bajo tierra: sin el escombro del frente ni las piedras sueltas del tema en las salas (el piso queda limpio para lo suyo). */
  limpio?: boolean;
  /** Bajo tierra: con qué se llenan los huecos encerrados entre salas (`rellenarBolsas`): [id, variante, peso] por talla. */
  relleno?: { alta: [string, string, number][]; media: [string, string, number][]; baja: [string, string, number][] };
  /** Los santuarios que da la zona (`colocarInteractivos`): las piezas, el efecto es el de siempre. */
  santuarios?: string[];
  /** Lo que viste el muro de atrás (`PARED_TEMA`). */
  pared?: [string, 'largo' | 'suelto'][];
  /** El castigo de los campamentos comunes (ancla y lo de alrededor, `CASTIGO`). */
  castigo?: [string, string | undefined][];
  /** El asiento del jefe y sus braseros (`FOCO_JEFE`, `BRASERO_JEFE`). */
  foco?: [string, string | undefined]; brasero?: string;
  /** Trazado de las salas de obra: ancho y alto (mínimo y cuántas más), galería (largas en x o en y), cuánta área por sala y la sala mayor. */
  sala?: { w: [number, number]; h: [number, number]; galeria?: boolean; cada?: number; mayor?: [number, number] };
  /** Lo grande de las salas que no son la mayor va en hileras a lo largo de la galería (los lechos de los dormidos). */
  hileras?: boolean;
  /** Afuera: el piso dominante por baldosa (lecho seco, calles). Devuelve un id o nada para dejar el de siempre. */
  pisoExt?: (bx: number, by: number, tw: number, th: number, m: number, m2: number) => string | undefined;
  /** Afuera: cuántas ensenadas y macizos (mínimo y cuántos más) y qué tan hondas. */
  silueta?: { ens: [number, number]; mac: [number, number]; hondo?: number };
  /** Dibujo: el color de la oscuridad (rgb), los haces del techo (color, densidad y si son fríos; null sin haces) y las motas. */
  tinta?: [number, number, number];
  haz?: { c: string; dens: number; frio?: boolean } | null;
  motas?: 'polvo' | 'oro' | 'brasa' | '';
}


export const VARIANTE_ZONA: Record<string, VarianteZona> = { ...ZONAS_ACTO2, ...ZONAS_ACTO6, ...ZONAS_ACTO7 };

/** Lo propio de la zona, o nada con `__acto<N>Viejo` (la bandera de su acto: `__acto2Viejo`, `__acto6Viejo`...). */
export const varianteDe = (id: string): VarianteZona | undefined => ((globalThis as any)[`__acto${id[1]}Viejo`] ? undefined : VARIANTE_ZONA[id]);
