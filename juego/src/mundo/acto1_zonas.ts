// El acto 1 con intención (22 nov 2026). El Bosque de los Ahorcados pisaba el pasto del Páramo, la Guarida del Hambre y la Cueva
// del Pastor eran la misma cueva, las dos partes de la Mina de Velmora la misma mina, la Nave del Silencio y el Claustro
// Profanado el mismo damero con la misma pared, y los Osarios y el Pozo de la Brasa las mismas lajas. El Páramo, el Camposanto
// y la Cripta ya tenían lo suyo y no se tocan. Cada una con lo suyo (zonas_propias.ts). `__acto1Viejo` vuelve atrás.
import type { VarianteZona, Muro } from './zonas_propias';

const PA = ['paramo'], CU = ['cueva'], MI = ['mina'], MO = ['monasterio'], CA = ['catacumbas'];
const muro = (id: string, vx: string[], vy: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vx], muroY: [id, vy] });

export const ZONAS_ACTO1: Record<string, VarianteZona> = {
  // El Bosque de los Ahorcados: el bosque cerrado. Hojarasca podrida parda y negra con raíces y musgo, robles y troncos, los
  // árboles de los ahorcados, jaulas y cuervos. Verde negro, sin el pasto del páramo.
  a1_bosque: {
    piso: 'a1_hojarasca', parches: ['a1_hojarasca', 'a1_hojarasca', 'tierra'], camino: 'tierra',
    disperso: [{ t: PA, p: ['par_tronco', 'par_tocon', 'par_matorral', 'par_cuervos', 'par_huesos', 'par_cadaver'] }],
    grande: [{ t: PA, p: ['par_arbol_ahorcados', 'par_horca', 'par_jaula_colgante'] }, { t: ['arboles'], p: ['roble', 'arbol'] }],
    tinta: [3, 9, 5], oscuridad: 0.5,
    bruma: { n: 12, a: 1.6, c: '120,140,120' },
  },
  // La Guarida del Hambre: la madriguera de lo que tiene hambre. Tierra con huesos roídos, sangre arrastrada y surcos de uñas,
  // nidos de huesos, capullos y costillares. Rojo de carne vieja.
  a1_guarida: {
    piso: 'a1_roida', parches: ['a1_roida', 'cueva', 'a1_roida'],
    disperso: [{ t: CU, p: ['cue2_nido_huesos', 'cue2_capullos', 'cue2_telarana', 'cue_huesos', 'cue_costillar', 'cue2_aventurero'] }],
    luces: [{ t: CU, p: ['cue_antorcha'] }],
    tinta: [14, 5, 4], haz: null,
  },
  // La Cueva del Pastor: el redil. Paja tendida sobre la tierra con lana y lo que dejaron las ovejas, el campamento del pastor,
  // raíces que entran y una gotera. Ámbar de lámpara.
  a1_pastor: {
    piso: 'a1_paja', parches: ['a1_paja', 'tierra', 'a1_paja'],
    disperso: [{ t: CU, p: ['cue2_campamento', 'cue_campamento', 'cue2_pertrechos', 'cue2_raices', 'cue_raices', 'cue2_charca'] }],
    luces: [{ t: CU, p: ['cue_antorcha'] }],
    tinta: [14, 10, 4], haz: { c: '255,225,160', dens: 0.005 },
  },
  // La Mina de Velmora, el Pozo Profundo: lo más hondo de la mina, roca gris azulada mojada, agua que rezuma y se junta, el pozo
  // y la bomba de agua. Frío.
  a1_mina2: {
    piso: 'a1_roca_honda', parches: ['a1_roca_honda', 'cueva', 'a1_roca_honda'],
    disperso: [{ t: MI, p: ['min_bomba', 'min_pozo', 'min_escalera', 'min_minero_muerto', 'min_cajones'] }],
    tinta: [4, 7, 11], haz: null,
  },
  // La Abadía, el Claustro Profanado: el patio del claustro con el pasto entre las losas, la arcada con sus columnas pareadas y
  // la hiedra, la pila, estatuas y la sangre de la profanación. Verde de patio.
  a1_abadia2: {
    piso: 'a1_claustro', parches: ['a1_claustro', 'lajas', 'a1_claustro'],
    ...muro('a1_muro_claustro', ['arcos', 'hiedra', 'arcos', 'sangre', 'roto'], ['arcos_y', 'hiedra_y', 'sangre_y', 'roto_y']),
    disperso: [{ t: MO, p: ['mon_estatua', 'mon_pila_bautismal', 'mon_charco_sangre', 'mon_campana'] }],
    grande: [{ t: MO, p: ['mon_estatua', 'mon_pilar'] }],
    tinta: [6, 9, 6],
  },
  // El Pozo de la Brasa: donde cayó la brasa. La piedra chamuscada con las grietas que todavía brillan, ceniza, la luz de brasa
  // y las motas que suben. Naranja.
  a1_pozo: {
    piso: 'a1_brasa_caida', parches: ['a1_brasa_caida', 'lajas', 'a1_brasa_caida'],
    disperso: [{ t: CA, p: ['cat2_escombro', 'cat2_huesos_suelo', 'cat2_columna_derrumbada', 'cat2_carretilla'] }],
    tinta: [16, 6, 2], motas: 'brasa', haz: { c: '255,170,90', dens: 0.005 },
  },
};
