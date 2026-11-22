// El acto 6 con intención (22 nov 2026). Cuatro mundos abiertos con el tema `ahogada` (la costa, el arrecife y las dos partes del
// barrio sumergido) y cinco mazmorras con `catedral_ahogada` (el faro, las dos criptas, la nave y el campanario) salían con el
// mismo piso de lajas con musgo y agua, el mismo muro de vitrales y el mismo riego de cascos, redes y campanas. Cada una con lo
// suyo, como en el acto 2 (zonas_propias.ts). `__acto6Viejo` vuelve a lo de antes.
import type { VarianteZona, Sel, Muro } from './zonas_propias';
import { suave } from './ruido_zona';

const AH = ['ahogada'];
const muro = (id: string, vx: string[], vy: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vx], muroY: [id, vy] });
const obra = (est: string, panos: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: ['muro_obra', panos.map((p) => `${est}_${p}`)], muroY: ['muro_obra', panos.map((p) => `${est}_${p}_y`)] });
const FAROL: Sel[] = [{ t: AH, p: ['ahg_farol_pescador'] }];

export const ZONAS_ACTO6: Record<string, VarianteZona> = {
  // ---------------------------------------------------------------- mundos abiertos
  // La Costa de los Naufragios: playa de arena gris mojada con las líneas de la marea; lo que el mar escupe: cascos partidos,
  // mástiles, anclas, botes, barriles y ahogados. Luz de tormenta azul gris.
  a6_costa: {
    piso: 'a6_arena_gris', parches: ['a6_arena_gris', 'agua', 'a6_arena_gris'], camino: 'tierra', vinetas: [],
    borde: [{ t: AH, p: ['ahg_roca_percebes', 'ahg_mastil_caido', 'ahg_casco_costillar'] }],
    disperso: [{ t: AH, p: ['ahg_barril_marino', 'ahg_nasa', 'ahg_tablones', 'ahg_timon', 'ahg_red_huesos', 'ahg_peces_muertos', 'ahg_marino_ahogado', 'ahg_cadena_ancla', 'ahg_vela_raida', 'ahg_cofre_barco', 'ahg_roca_percebes'] }],
    grande: [{ t: AH, p: ['ahg_casco_proa', 'ahg_casco_popa', 'ahg_casco_costillar', 'ahg_mastil_roto', 'ahg_ancla', 'ahg_bote_roto', 'ahg_casco_bote_colgado'] }],
    luces: FAROL,
    castigo: [['ahg_red_huesos', 'llena'], ['ahg_marino_ahogado', 'enredado'], ['ahg_peces_muertos', 'podridos']],
    tinta: [4, 9, 14],
  },
  // El Arrecife de Huesos: la marea baja dejó al aire un lecho de coral blanco de hueso con charcas; costillares de ballena,
  // conchas gigantes, tentáculos y coral que alumbra. Verde mar.
  a6_arrecife: {
    piso: 'a6_coral', parches: ['a6_coral', 'agua', 'a6_arena_gris'], camino: 'a6_arena_gris', vinetas: [],
    borde: [{ t: AH, p: ['ahg_arrecife_huesos', 'ahg_roca_percebes', 'ahg_coral_hueso'] }],
    disperso: [{ t: AH, p: ['ahg_coral_hueso', 'ahg_charco_marea', 'ahg_concha_gigante', 'ahg_peces_muertos', 'ahg_roca_percebes', 'ahg_tentaculo'] }],
    grande: [{ t: AH, p: ['ahg_ballena_huesos', 'ahg_arrecife_huesos', 'ahg_concha_gigante'] }],
    luces: [{ t: AH, p: ['ahg_coral_hueso'], v: (v) => v === 'con_luz' }, { t: AH, p: ['ahg_boya_campana'], v: (v) => v === 'con_luz' }],
    castigo: [['ahg_ballena_huesos', 'craneo'], ['ahg_marino_ahogado', 'boca_abajo'], ['ahg_tentaculo', 'con_marino']],
    tinta: [3, 12, 10],
  },
  // El Barrio Sumergido, las Calles Mojadas: calles de adoquín negro y brillante en cuadrícula, charcos, las casas caídas y
  // las puertas tapiadas, faroles de pescador, escaleras que se meten en el agua.
  a6_barrio1: {
    piso: 'a6_adoquin', parches: ['a6_adoquin', 'agua', 'lajas_musgo'], camino: 'a6_adoquin', vinetas: ['cementerio'],
    pisoExt: (bx, by) => ((bx % 5 === 2) || (by % 5 === 1) ? 'a6_adoquin' : suave(bx, by, 3, 21) > 0.62 ? 'agua' : undefined),
    borde: [{ t: AH, p: ['ahg_puerta_hundida', 'ahg_arco_hundido'] }, { t: ['pueblo'], p: ['pue_ruina_derrumbada', 'pue_casa_calcinada'] }],
    disperso: [{ t: AH, p: ['ahg_barril_marino', 'ahg_nasa', 'ahg_tablones', 'ahg_escalera_agua', 'ahg_peces_muertos', 'ahg_marino_ahogado'] }, { t: ['pueblo'], p: ['pue_escombros', 'pue_carreta'] }],
    grande: [{ t: AH, p: ['ahg_puerta_hundida', 'ahg_arco_hundido', 'ahg_muelle'] }, { t: ['pueblo'], p: ['pue_ruina_derrumbada'] }],
    luces: [{ t: AH, p: ['ahg_farol_pescador'] }, { t: ['pueblo'], p: ['pue_farol'] }],
    castigo: [['pue_horca', undefined], ['ahg_marino_ahogado', 'sentado'], ['ahg_red_huesos', 'colgada']],
    tinta: [6, 6, 12],
  },
  // El Barrio Sumergido, la Plaza de las Ánimas: la plaza grande en anillos con su rosa de bronce, los santos de piedra y la
  // pescadora, columnas con percebes, la torre del campanario, campanas caídas, cruces de marinos. Luz morada de las ánimas.
  a6_barrio2: {
    piso: 'a6_adoquin', parches: ['lajas_musgo', 'a6_plaza', 'a6_adoquin'], camino: 'a6_plaza', vinetas: [],
    pisoExt: (bx, by, tw, th) => { const d = Math.hypot((bx + 0.5 - tw / 2) / (tw / 2), (by + 0.5 - th / 2) / (th / 2)) + (suave(bx, by, 3, 23) - 0.5) * 0.2; return d < 0.42 ? 'a6_plaza' : undefined; },
    borde: [{ t: AH, p: ['ahg_columna_percebes', 'ahg_arco_hundido', 'ahg_torre_campanario'] }],
    disperso: [{ t: AH, p: ['ahg_cruz_marinos', 'ahg_campana_caida', 'ahg_pila_ahogada', 'ahg_columna_percebes'] }, { t: ['cementerio'], p: ['losa', 'cruz', 'urna'] }],
    grande: [{ t: AH, p: ['ahg_estatua_santo', 'ahg_pescadora_estatua', 'ahg_torre_campanario', 'ahg_campana_colgante', 'ahg_columna_caida_algas'] }],
    luces: [{ t: AH, p: ['ahg_farol_altar', 'ahg_pila_ahogada'], v: (v) => /velas|faroles|con_velas/.test(v) }, { t: AH, p: ['ahg_farol_pescador'] }],
    castigo: [['ahg_cruz_marinos', 'con_redes'], ['ahg_marino_ahogado', 'tendido'], ['ahg_campana_caida', 'chica']],
    tinta: [10, 5, 16],
  },
  // ---------------------------------------------------------------- bajo tierra
  // El Faro Apagado: la torre por dentro. Piedra gris clara en anillos con el hollín del fuego que se apagó, la sillería de la
  // costa, barriles de aceite, nasas, timones, redes y faroles fríos. Gris y sin haces: la luz que daba está muerta.
  a6_faro: {
    piso: 'a6_piedra_faro', parches: ['a6_piedra_faro', 'a6_tablas', 'a6_piedra_faro'], estilo: 'ahogada',
    ...obra('ahogada', ['liso', 'pilastras', 'liso', 'roto']),
    disperso: [{ t: AH, p: ['ahg_barril_marino', 'ahg_nasa', 'ahg_timon', 'ahg_red_huesos', 'ahg_cadena_ancla', 'ahg_tablones'] }],
    grande: [{ t: ['monasterio'], p: ['mon_pilar'] }],
    luces: [{ t: AH, p: ['ahg_farol_pescador'] }], deco: [{ t: AH, p: ['ahg_farol_altar'], v: (v) => v === 'apagado' }],
    pared: [['ahg_nasa', 'suelto'], ['ahg_barril_marino', 'suelto'], ['ahg_algas_colgantes', 'suelto'], ['cri_vasijas', 'suelto']],
    castigo: [['ahg_red_huesos', 'en_poste'], ['ahg_marino_ahogado', 'contra_ancla'], ['ahg_barril_marino', 'reventado']],
    foco: ['ahg_farol_altar', 'apagado'], brasero: 'ahg_farol_pescador',
    tinta: [8, 10, 13], haz: null, motas: '',
  },
  // Las Criptas Inundadas: el agua verde llega a los tobillos y las losas asoman; nichos de huesos en los muros, sarcófagos,
  // algas colgando, faroles de altar. Verde ahogado.
  a6_criptas: {
    piso: 'a6_agua_cripta', parches: ['a6_agua_cripta', 'lajas_musgo', 'a6_agua_cripta'], estilo: 'ahogada',
    ...muro('cat2_pared_toba', ['humeda', 'humeda', 'agrietada', 'con_nicho'], ['humeda_der', 'humeda_der', 'lisa_der']),
    disperso: [{ t: ['cripta'], p: ['cri_sarcofago_sellado', 'cri_sarcofago_abierto', 'cri_lapida_suelo', 'cri_cuerpo_amortajado', 'cri_vasijas'] }, { t: AH, p: ['ahg_charco_marea', 'ahg_peces_muertos', 'ahg_marino_ahogado'] }],
    grande: [{ t: ['cripta'], p: ['cri_pilar', 'cri_estatua_guardian'] }],
    luces: [{ t: AH, p: ['ahg_farol_altar'], v: (v) => v !== 'apagado' }, { t: ['cripta'], p: ['cri_lampara_aceite'] }],
    pared: [['ahg_algas_colgantes', 'suelto'], ['cri_vasijas', 'suelto'], ['ahg_cruz_marinos', 'suelto'], ['cri_cadenas_pared', 'largo']],
    castigo: [['cri_sarcofago_abierto', undefined], ['ahg_marino_ahogado', 'enredado'], ['ahg_peces_muertos', 'podridos']],
    tinta: [2, 12, 8], haz: { c: '150,220,190', dens: 0.003, frio: true }, motas: '',
  },
  // Las Criptas, el Osario Ahogado: el piso de huesos bajo el agua, paredes de calaveras, pilas de cráneos, pozos de huesos,
  // coral que crece sobre los muertos. Hueso y negro, sin luz de arriba.
  a6_criptas2: {
    piso: 'hueso', parches: ['a6_agua_cripta', 'hueso', 'a6_agua_cripta'], estilo: 'cementerio',
    ...muro('cri_osario_pared', ['calaveras', 'huesos_cruzados', 'roseton', 'arco'], ['calaveras_der', 'huesos_cruzados_der']),
    disperso: [{ t: ['cripta'], p: ['cri_pila_craneos', 'cri_pozo_huesos', 'cri_cofres_osarios'] }, { t: ['catacumbas'], p: ['cat_monton_huesos'] }, { t: AH, p: ['ahg_coral_hueso', 'ahg_red_huesos'] }],
    grande: [{ t: ['cripta'], p: ['cri_columna_calaveras', 'cri_altar_huesos'] }],
    luces: [{ t: ['cripta'], p: ['cri_brasero_huesos', 'cri_candelabro'], v: (v) => !/_der$/.test(v) }],
    pared: [['cri_pila_craneos', 'suelto'], ['cat_monton_huesos', 'suelto'], ['ahg_algas_colgantes', 'suelto']],
    castigo: [['cri_pozo_huesos', undefined], ['ahg_red_huesos', 'llena'], ['cat_monton_huesos', 'de_calaveras']],
    foco: ['cri_altar_huesos', undefined], brasero: 'cri_brasero_huesos',
    tinta: [10, 9, 6], haz: null, motas: '',
  },
  // La Catedral, la Nave: el damero de mármol con el agua que entra, los muros de vitrales, bancos en filas, santos, el
  // rosetón caído, pilas de agua ahogada y el altar. Haces fríos que bajan por los vitrales rotos.
  a6_catedral1: {
    piso: 'baldosa_catedral', parches: ['baldosa_catedral', 'agua', 'baldosa_catedral'],
    ...muro('mon_muro_vitral', ['izq', 'izq', 'izq_roto'], ['der', 'der', 'der_roto']),
    disperso: [{ t: ['monasterio'], p: ['mon_banco', 'mon_estatua', 'mon_pila_bautismal'] }, { t: AH, p: ['ahg_pila_ahogada', 'ahg_charco_marea', 'ahg_estatua_santo'] }],
    grande: [{ t: ['monasterio'], p: ['mon_pilar'] }],
    luces: [{ t: ['monasterio'], p: ['mon_brasero'], v: (v) => v === 'fuego_azul' || v === 'pedestal' }, { t: AH, p: ['ahg_farol_altar'], v: (v) => v !== 'apagado' }],
    deco: [{ t: AH, p: ['ahg_roseton_caido'] }, { t: ['monasterio'], p: ['mon_altar', 'mon_pulpito'] }],
    pared: [['mon_tapiz', 'suelto'], ['ahg_algas_colgantes', 'suelto'], ['cri_candelabro', 'suelto']],
    castigo: [['mon_banco', 'roto'], ['ahg_marino_ahogado', 'sentado'], ['ahg_estatua_santo', 'decapitado']],
    tinta: [3, 7, 18], haz: { c: '160,196,240', dens: 0.009, frio: true }, motas: '',
  },
  // La Catedral, el Campanario Hundido: el piso de tablas de la torre, negras y con huecos, los muros de piedra de la torre,
  // campanas colgando y caídas, sogas, vigas. Oscuro y húmedo.
  a6_catedral2: {
    piso: 'a6_tablas', parches: ['a6_tablas', 'agua', 'a6_tablas'], estilo: 'ahogada',
    ...muro('mon_muro', ['izq', 'izq_roto', 'izq'], ['der', 'der_roto', 'der']),
    disperso: [{ t: AH, p: ['ahg_campana_caida', 'ahg_tablones', 'ahg_cadena_ancla'] }, { t: ['monasterio'], p: ['mon_campana'] }, { t: ['acto2'], p: ['a2_cuerdas_pozo'] }],
    grande: [{ t: AH, p: ['ahg_campana_colgante', 'ahg_columna_caida_algas'] }],
    luces: [{ t: AH, p: ['ahg_farol_pescador'] }], deco: [{ t: AH, p: ['ahg_campana_caida'], v: (v) => v === 'rajada' || v === 'tumbada' }],
    pared: [['a2_cuerdas_pozo', 'suelto'], ['ahg_algas_colgantes', 'suelto'], ['ahg_barril_marino', 'suelto']],
    castigo: [['ahg_campana_caida', 'boca_arriba'], ['ahg_marino_ahogado', 'boca_abajo'], ['mon_campana', 'caida']],
    tinta: [6, 9, 11], haz: { c: '170,200,220', dens: 0.0035, frio: true }, motas: '',
  },
};
