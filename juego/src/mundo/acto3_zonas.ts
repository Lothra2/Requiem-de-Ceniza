// El acto 3 con intención (22 nov 2026). La selva y el manglar compartían `selva`, las Cavernas Inundadas y el Nido de la Araña
// `cueva`, y la Ciudad Hundida (calles y palacio) y el Templo (escalones y vientre) `templo`: el mismo piso, el mismo muro de
// glifos y el mismo riego. Cada una con lo suyo (zonas_propias.ts). `__acto3Viejo` vuelve atrás.
import type { VarianteZona, Muro } from './zonas_propias';
import { suave } from './ruido_zona';

const SE = ['selva'], TS = ['templo_selva'], CU = ['cueva'];
const muro = (id: string, vx: string[], vy: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vx], muroY: [id, vy] });

export const ZONAS_ACTO3: Record<string, VarianteZona> = {
  // La Selva de Yhuantl: hojarasca espesa y verde, árboles gigantes, ídolos y cabezas colosales, cascadas. Verde.
  a3_selva: {
    piso: 'a3_hojarasca', parches: ['a3_hojarasca', 'selva', 'a3_hojarasca'], camino: 'tierra',
    tinta: [2, 9, 3],
  },
  // El Manglar Negro: lodo negro con charcos, el manglar que se clava, chozas en pilotes, barcas y canoas, puentes colgantes.
  a3_pantano: {
    piso: 'a3_lodo', parches: ['pantano', 'a3_lodo', 'a3_lodo'], camino: 'tierra',
    pisoExt: (bx, by) => (suave(bx, by, 3, 41) < 0.3 ? 'pantano' : undefined),
    disperso: [{ t: SE, p: ['sel2_manglar', 'sel2_charca', 'sel2_ranas', 'sel2_tronco_podrido', 'sel2_raices', 'sel2_hongos', 'sel2_cadaver'] }, { t: SE, p: ['sel_tronco_pantano', 'sel_charco', 'sel_canoa'] }],
    grande: [{ t: SE, p: ['sel2_manglar', 'sel2_choza', 'sel2_barca', 'sel_choza_pilotes', 'sel2_arbol_gigante'] }],
    castigo: [['sel2_jaula', 'preso'], ['sel_tronco_pantano', undefined], ['sel2_cadaver', 'tribal']],
    tinta: [3, 6, 4],
  },
  // Las Cavernas Inundadas: el agua quieta cubre media cueva y la roca brilla mojada; lagos negros, gours, hongos que alumbran.
  a3_inundadas: {
    piso: 'a3_cueva_agua', parches: ['a3_cueva_agua', 'cueva', 'a3_cueva_agua'],
    disperso: [{ t: CU, p: ['cue2_charca', 'cue2_gours', 'cue2_estalagmitas', 'cue2_estalactitas_caidas', 'cue2_raices'] }, { t: SE, p: ['sel2_ranas', 'sel_charco'] }],
    grande: [{ t: CU, p: ['cue2_columna', 'cue2_hongo_gigante'] }],
    luces: [{ t: CU, p: ['cue2_hongos_luz'] }], deco: [{ t: CU, p: ['cue2_lago_negro'] }],
    tinta: [2, 8, 11], haz: { c: '150,210,225', dens: 0.004, frio: true }, motas: '',
  },
  // El Nido de la Araña: mantos de seda sobre la roca, capullos con lo que cazó, huevos, árboles de telaraña. Violeta negro.
  a3_nido: {
    piso: 'a3_telarana', parches: ['a3_telarana', 'cueva', 'a3_telarana'],
    disperso: [{ t: CU, p: ['cue2_telarana', 'cue2_capullos', 'cue2_nido_huesos', 'cue_telarana'] }, { t: SE, p: ['sel_capullo'] }],
    grande: [{ t: SE, p: ['sel_arbol_telarana'] }, { t: CU, p: ['cue2_pilar_roca'] }],
    luces: [{ t: CU, p: ['cue2_hongos_luz', 'cue2_drusa'] }], deco: [{ t: CU, p: ['cue2_capullos'] }],
    castigo: [['cue2_capullos', undefined], ['cue2_aventurero', undefined], ['cue2_nido_huesos', undefined]],
    tinta: [8, 4, 12], haz: null, motas: '',
  },
  // La Ciudad Hundida, las Calles: losas con musgo y el agua del pantano, la sillería de la selva, chozas, puentes y canoas
  // entre casas caídas. Verde agua.
  a3_hundida1: {
    piso: 'lajas_musgo', parches: ['pantano', 'lajas_musgo', 'a3_lodo'], estilo: 'selva',
    ...muro('a3_muro_casas', ['ventanas', 'puerta', 'tapiada', 'ventanas', 'roto'], ['ventanas_y', 'puerta_y', 'tapiada_y', 'roto_y']),
    disperso: [{ t: SE, p: ['sel_canoa', 'sel_charco', 'sel2_raices', 'sel2_tronco_podrido', 'sel2_lianas'] }, { t: TS, p: ['tem_calzada', 'tem_estatua_jaguar'] }],
    grande: [{ t: TS, p: ['tem_columna_serpiente'] }, { t: SE, p: ['sel2_ruina'] }],
    luces: [{ t: SE, p: ['sel_antorcha'] }],
    castigo: [['sel_poste_craneos', 'craneos'], ['sel2_cadaver', 'tribal'], ['sel_canoa', undefined]],
    tinta: [2, 10, 8], haz: { c: '180,230,190', dens: 0.006 }, motas: '',
  },
  // La Ciudad Hundida, el Palacio Ahogado: mosaico de jade y oro bajo el agua, columnas de serpiente, ídolos, pedestales con
  // orbes, el muro de glifos. Jade.
  a3_hundida2: {
    piso: 'a3_mosaico', parches: ['a3_mosaico', 'pantano', 'a3_mosaico'],
    ...muro('a3_muro_jade', ['greca', 'serpiente', 'discos', 'greca', 'roto'], ['greca_y', 'serpiente_y', 'discos_y', 'roto_y']),
    disperso: [{ t: TS, p: ['tem_idolo', 'tem_pedestal_orbe', 'tem_estatua_jaguar'] }, { t: SE, p: ['sel_charco', 'sel2_lianas'] }],
    grande: [{ t: TS, p: ['tem_columna_serpiente'] }],
    luces: [{ t: TS, p: ['tem_brasero'] }, { t: TS, p: ['tem_pedestal_orbe'] }],
    tinta: [1, 12, 8], haz: { c: '170,240,200', dens: 0.006 }, motas: 'oro',
  },
  // El Templo, los Escalones Hundidos: peldaños de piedra con musgo en el canto, el muro cubierto de musgo, ídolos y altares,
  // braseros. Ocre y verde.
  a3_templo1: {
    piso: 'a3_escalones', parches: ['a3_escalones', 'lajas_musgo', 'a3_escalones'],
    ...muro('tem_muro_musgo', ['con_raices', 'alto', 'con_raices'], ['con_raices_y', 'alto_y']),
    disperso: [{ t: TS, p: ['tem_idolo', 'tem_altar', 'tem_estatua_jaguar'] }, { t: SE, p: ['sel2_helecho', 'sel2_raices', 'sel2_lianas'] }],
    grande: [{ t: TS, p: ['tem_columna_serpiente'] }],
    luces: [{ t: TS, p: ['tem_brasero'] }],
    tinta: [10, 9, 2], haz: { c: '255,230,160', dens: 0.006 }, motas: 'polvo',
  },
  // El Templo, el Vientre de la Madre: carne viva con venas y raíces en el piso, la pared de carne, capullos, huevos, raíces.
  // Rojo de entraña.
  a3_templo2: {
    piso: 'a3_carne', parches: ['a3_carne', 'pantano', 'a3_carne'], estilo: 'infierno',
    ...muro('inf_muro_carne', ['liso', 'costillas', 'liso'], ['liso_y', 'costillas_y']),
    disperso: [{ t: SE, p: ['sel_capullo', 'sel2_raices', 'sel2_nido'] }, { t: CU, p: ['cue2_capullos'] }, { t: ['infierno'], p: ['inf2_huevo', 'inf2_carne'] }],
    grande: [{ t: SE, p: ['sel2_raices'] }, { t: ['infierno'], p: ['inf2_huevo'] }],
    luces: [{ t: CU, p: ['cue2_hongos_luz'] }, { t: TS, p: ['tem_brasero'] }],
    castigo: [['cue2_capullos', undefined], ['sel2_cadaver', 'tribal'], ['inf2_carne', undefined]],
    tinta: [16, 3, 3], haz: null, motas: '',
  },
};
