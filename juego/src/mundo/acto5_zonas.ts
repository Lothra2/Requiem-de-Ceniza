// El acto 5 con intención (22 nov 2026). Las Llanuras de Ceniza y el Río de Lava compartían `infierno` (la misma tierra roja), el
// Abismo de los Susurros y las Islas sobre la Nada `abismo`, y la Fragua de Ozmaren, la Garganta y el Corazón de la Brasa
// `santuario` (la tierra roja, la pared de carne, los mismos braseros). Cada una con lo suyo (zonas_propias.ts). `__acto5Viejo`
// vuelve atrás.
import type { VarianteZona, Muro } from './zonas_propias';
import { suave } from './ruido_zona';

const IN = ['infierno'], AB = ['abismo'];
const muro = (id: string, vx: string[], vy: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vx], muroY: [id, vy] });

export const ZONAS_ACTO5: Record<string, VarianteZona> = {
  // Las Llanuras de Ceniza: lo que quedó de lo que ardió. Ceniza gris en dunas bajas con carbón y ascuas, árboles muertos, los
  // colosos y las ruinas, las piras. Gris, con el fuego lejos.
  a5_llanuras: {
    piso: 'a5_ceniza', parches: ['a5_ceniza', 'a5_ceniza', 'a5_ceniza'], camino: 'a5_ceniza', vinetas: [],
    pisoExt: (bx, by) => (suave(bx, by, 4, 71) < 0.14 ? 'tierra_infierno' : 'a5_ceniza'),
    disperso: [{ t: IN, p: ['inf2_roca', 'inf2_arbol', 'inf2_cuerpos', 'inf2_estandarte', 'inf2_osario', 'inf2_huevo'] }],
    grande: [{ t: IN, p: ['inf2_coloso', 'inf2_ruina', 'inf2_obelisco', 'inf2_arbol', 'inf2_craneo'] }],
    luces: [{ t: IN, p: ['inf2_pira', 'inf2_brasero'] }],
    tinta: [11, 9, 8],
  },
  // El Río de Lava: basalto negro enfriado con la lava viva en las juntas, el río, obsidiana, fumarolas y géiseres, columnas de
  // fuego. Negro y naranja.
  a5_rio: {
    piso: 'a5_basalto', parches: ['a5_basalto', 'a5_basalto', 'a5_basalto'], camino: 'a5_basalto', vinetas: [],
    pisoExt: (bx, by) => (suave(bx, by, 3, 73) < 0.12 ? 'lava_grietas' : 'a5_basalto'),
    disperso: [{ t: IN, p: ['inf2_obsidiana', 'inf2_charca_lava', 'inf2_fumarola', 'inf2_grieta', 'inf2_roca'] }],
    grande: [{ t: IN, p: ['inf2_geiser', 'inf2_columna_fuego', 'inf2_obsidiana', 'inf2_espina'] }],
    luces: [{ t: IN, p: ['inf2_charca_lava', 'inf2_columna_fuego'] }],
    tinta: [16, 5, 2],
  },
  // El Abismo de los Susurros: piedra del vacío violeta con estrellas y runas, el muro de obsidiana con las runas que susurran,
  // círculos de runas, jaulas, almas. Violeta.
  a5_abismo1: {
    piso: 'a5_vacio_piedra', parches: ['a5_vacio_piedra', 'pentagrama', 'a5_vacio_piedra'],
    ...muro('a5_muro_obsidiana', ['runas', 'runas', 'roto'], ['runas_y', 'roto_y']),
    disperso: [{ t: AB, p: ['abi_runa', 'abi_circulo_runas', 'abi_grieta', 'abi_jaula', 'abi_almas', 'abi_cristal_vacio', 'abi_ojos'] }],
    grande: [{ t: AB, p: ['abi_obelisco', 'abi_estatua', 'abi_altar', 'abi_columna_puente'] }],
    luces: [{ t: AB, p: ['abi_farol', 'abi_runa'] }],
    tinta: [10, 4, 17], haz: { c: '170,130,255', dens: 0.004 }, motas: '',
  },
  // El Abismo, las Islas sobre la Nada: las islas de piedra del vacío sobre lo negro, frías, con cadenas y estrellas debajo.
  // Azul de noche.
  a5_abismo2: {
    piso: 'a5_vacio_piedra', parches: ['a5_vacio_piedra', 'hueso', 'a5_vacio_piedra'],
    tinta: [3, 6, 16], motas: '',
  },
  // La Fragua de Ozmaren: el taller del dios. Planchas de hierro con canaletas de metal al rojo, la pared de hierro con los hornos
  // y las herramientas, yunques, calderos y cadenas. Naranja de forja.
  a5_fragua: {
    piso: 'a5_hierro', parches: ['a5_hierro', 'tierra_infierno', 'a5_hierro'], estilo: 'infierno',
    ...muro('a5_muro_fragua', ['planchas', 'horno', 'planchas', 'herramientas', 'roto'], ['planchas_y', 'horno_y', 'herramientas_y', 'roto_y']),
    disperso: [{ t: IN, p: ['inf2_caldero', 'inf2_cadenas', 'inf2_ganchos', 'inf_forja', 'inf2_cuerpos'] }],
    grande: [{ t: IN, p: ['inf_forja', 'inf2_caldero', 'inf2_columna_fuego', 'inf2_estatua'] }],
    luces: [{ t: IN, p: ['inf2_brasero', 'inf2_pira'] }],
    tinta: [17, 8, 2], motas: 'brasa', haz: null,
  },
  // La Herida, la Garganta: la piedra abierta como carne mojada, la obsidiana que sangra por sus grietas, espinas, ganchos,
  // carne y sangre. Carmesí.
  a5_santuario1: {
    piso: 'a5_herida', parches: ['a5_herida', 'hueso', 'a5_herida'], estilo: 'infierno',
    ...muro('a5_muro_obsidiana', ['herida', 'herida2', 'herida', 'roto'], ['herida_y', 'herida2_y', 'roto_y']),
    disperso: [{ t: IN, p: ['inf2_sangre', 'inf2_carne', 'inf2_ganchos', 'inf2_espina', 'inf2_empalado', 'inf2_pinchos'] }],
    grande: [{ t: IN, p: ['inf2_espina', 'inf2_obelisco', 'inf2_jaula'] }],
    luces: [{ t: IN, p: ['inf2_brasero'] }],
    tinta: [19, 2, 4], motas: '', haz: null,
  },
  // El Corazón de la Brasa: obsidiana pulida cruzada de venas al blanco, el muro con las venas de la brasa, columnas de fuego,
  // pentáculos y el altar. Oro blanco.
  a5_santuario2: {
    piso: 'a5_brasa_viva', parches: ['a5_brasa_viva', 'lava_grietas', 'a5_brasa_viva'], estilo: 'infierno',
    ...muro('a5_muro_obsidiana', ['brasa', 'brasa2', 'brasa', 'roto'], ['brasa_y', 'brasa2_y', 'roto_y']),
    disperso: [{ t: IN, p: ['inf2_obsidiana', 'inf2_grieta', 'inf2_fumarola', 'inf2_charca_lava'] }],
    grande: [{ t: IN, p: ['inf2_columna_fuego', 'inf2_pentaculo', 'inf2_altar', 'inf2_obelisco'] }],
    luces: [{ t: IN, p: ['inf2_columna_fuego', 'inf2_pentaculo'] }],
    tinta: [16, 10, 3], motas: 'brasa', haz: { c: '255,220,150', dens: 0.005 },
  },
};
