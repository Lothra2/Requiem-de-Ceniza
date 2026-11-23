// El acto 4 con intención (22 nov 2026). Los Picos y el Paso del Glaciar compartían `nieve`, los Socavones y la Veta Madre
// `mina`, la Grieta, las Cuevas del Aliento Helado y el Trono de Hjaldur `hielo` (la misma cueva de roca escarchada), y la Cripta
// del Rey Bárbaro era la cripta del acto 1. Cada una con lo suyo (zonas_propias.ts). `__acto4Viejo` vuelve atrás.
import type { VarianteZona, Muro } from './zonas_propias';
import { suave } from './ruido_zona';

const NI = ['nieve'], HI = ['hielo'], MI = ['mina'], CR = ['cripta'];
const muro = (id: string, vx: string[], vy: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vx], muroY: [id, vy] });

export const ZONAS_ACTO4: Record<string, VarianteZona> = {
  // Los Picos de Hrimgard: la montaña de los jarls. Nieve barrida que deja ver la pizarra negra, pinos, piedras rúnicas, túmulos,
  // hitos y armas clavadas en la nieve. Gris de piedra.
  a4_picos: {
    piso: 'a4_nieve_pizarra', parches: ['a4_nieve_pizarra', 'nieve', 'a4_nieve_pizarra'], camino: 'nieve',
    disperso: [{ t: NI, p: ['nie2_roca', 'nie2_piedra_runica', 'nie2_hito', 'nie2_escudos', 'nie2_tronco_caido', 'nie2_cadaver'] }, { t: NI, p: ['nie2_pino', 'nie2_arbol_muerto', 'nie2_lena'] }],
    grande: [{ t: NI, p: ['nie2_bosquecillo', 'nie2_tumulo', 'nie2_pino', 'nie2_cabana', 'nie2_tienda'] }],
    luces: [{ t: NI, p: ['nie2_brasero', 'nie2_runa_viva'] }],
    tinta: [10, 10, 13],
  },
  // El Paso del Glaciar: el hielo azul del glaciar con sus grietas y lenguas de nieve; seracs, el mamut y los soldados presos en
  // el hielo, cristales, sin pinos. Azul frío.
  a4_glaciar: {
    piso: 'a4_hielo_glaciar', parches: ['a4_hielo_glaciar', 'a4_hielo_glaciar', 'a4_hielo_glaciar'], camino: 'hielo',
    pisoExt: (bx, by) => (suave(bx, by, 4, 61) > 0.76 ? 'nieve' : 'a4_hielo_glaciar'),
    borde: [{ t: HI, p: ['hie2_serac', 'hie2_roca'] }, { t: NI, p: ['nie2_roca', 'nie2_ventisquero'] }],
    disperso: [{ t: HI, p: ['hie2_serac', 'hie2_cristal', 'hie_cuerpo', 'hie2_charco', 'hie2_roca', 'hie2_osamenta'] }, { t: NI, p: ['nie2_soldado_hielo', 'nie2_ventisquero', 'nie2_trineo'] }],
    grande: [{ t: HI, p: ['hie2_serac', 'hie2_lago', 'hie2_arbol', 'hie2_barco'] }, { t: NI, p: ['nie2_mamut'] }],
    luces: [{ t: HI, p: ['hie2_cristal', 'hie_antorcha'] }],
    tinta: [5, 11, 20],
  },
  // Minas de los Gigantes, los Socavones: los túneles de trabajo que el agua inundó. Tierra negra, tablones tendidos sobre el
  // barro y charcos negros por todos lados, faroles. Frío y mojado, contra el oro de la Veta Madre.
  a4_minas1: {
    piso: 'a4_socavon', parches: ['a4_socavon', 'cueva', 'a4_socavon'],
    disperso: [{ t: MI, p: ['min_cajones', 'min_carretilla', 'min_herramientas', 'min_escalera', 'min_minero_muerto'] }],
    luces: [{ t: MI, p: ['min_linterna'] }],
    tinta: [5, 7, 9], motas: '', haz: null,
  },
  // Minas de los Gigantes, la Veta Madre: la roca cruzada de vetas de oro y de mena roja, montones de mineral, tolvas, el horno
  // donde fundían. Oro.
  a4_minas2: {
    piso: 'a4_veta_madre', parches: ['a4_veta_madre', 'cueva', 'a4_veta_madre'],
    disperso: [{ t: MI, p: ['min_mineral', 'min_veta', 'min_pico_clavado', 'min_vagoneta', 'min_minero_muerto'] }],
    grande: [{ t: MI, p: ['min_tolva', 'min_horno', 'min_tren', 'min_montacargas'] }],
    luces: [{ t: MI, p: ['min_linterna'] }],
    tinta: [15, 10, 2], motas: 'oro', haz: { c: '255,200,110', dens: 0.008 },
  },
  // La Cripta del Rey Bárbaro: un túmulo del norte. Losas de pizarra con escarcha, el muro de piedra seca con postes, escudos y
  // runas, piedras rúnicas, túmulos, cuernos y armas en vez de los osarios de Santa Oria. Ámbar de brasero.
  a4_barbaro: {
    piso: 'a4_losas_tumulo', parches: ['a4_losas_tumulo', 'lajas', 'a4_losas_tumulo'], estilo: 'nieve',
    ...muro('a4_muro_tumulo', ['piedra', 'escudos', 'piedra', 'runas', 'roto'], ['piedra_y', 'escudos_y', 'runas_y', 'roto_y']),
    disperso: [{ t: NI, p: ['nie2_escudos', 'nie2_cuerno', 'nie2_osamenta', 'nie2_cadaver', 'nie2_hito'] }, { t: CR, p: ['cri_vasijas', 'cri_cofres_osarios'] }],
    grande: [{ t: NI, p: ['nie2_piedra_runica', 'nie2_tumulo', 'nie2_runa_viva'] }, { t: CR, p: ['cri_sarcofago'] }],
    luces: [{ t: NI, p: ['nie2_brasero'] }],
    deco: [{ t: NI, p: ['nie2_tumulo', 'nie2_runa_viva'] }],
    castigo: [['nie2_horca', undefined], ['nie2_cadaver', 'congelado'], ['nie2_escudos', undefined]],
    tinta: [14, 9, 4], haz: null, motas: 'polvo',
  },
  // La Grieta Glaciar: dentro del hielo. Hielo hondo azul casi negro con sus grietas claras, seracs, columnas con presos y
  // cristales gigantes. Azul hondo.
  a4_grieta: {
    piso: 'a4_grieta_hielo', parches: ['a4_grieta_hielo', 'hielo', 'a4_grieta_hielo'],
    disperso: [{ t: HI, p: ['hie2_estalactita', 'hie_cristales', 'hie_puas', 'hie2_cadaver', 'hie2_erupcion'] }],
    grande: [{ t: HI, p: ['hie2_serac', 'hie2_columna', 'hie2_cristal'] }],
    luces: [{ t: HI, p: ['hie2_cristal'] }],
    tinta: [3, 9, 22], haz: { c: '150,200,255', dens: 0.004, frio: true }, motas: 'escarcha',
  },
  // Las Cuevas del Aliento Helado: roca oscura cubierta de escarcha en plumas, osamentas y cadáveres helados, el fuego azul de
  // las antorchas. Gris blanco.
  a4_hielo1: {
    piso: 'a4_escarcha_roca', parches: ['a4_escarcha_roca', 'cueva', 'a4_escarcha_roca'],
    disperso: [{ t: HI, p: ['hie2_escarcha', 'hie2_roca', 'hie_roca', 'hie2_osamenta', 'hie2_cadaver', 'hie2_charco'] }],
    grande: [{ t: HI, p: ['hie2_estatua', 'hie_pilar', 'hie2_pozo'] }],
    luces: [{ t: HI, p: ['hie_antorcha', 'hie2_brasero'] }],
    tinta: [10, 12, 15], haz: null, motas: 'escarcha',
  },
  // El Trono de Hjaldur: el gran salón del jarl que el hielo se tragó. Salas de obra (no cueva), tablones negros helados, la
  // pared de madera tallada con escudos y carámbanos, pilares rúnicos y estatuas de hielo, braseros. Azul con brasa.
  a4_hielo2: {
    organica: null, estilo: 'nieve', limpio: true,
    piso: 'a4_tablas_heladas', parches: ['a4_tablas_heladas', 'hielo', 'a4_tablas_heladas'],
    ...muro('a4_muro_salon', ['tallas', 'escudos', 'hielo', 'tallas', 'roto'], ['tallas_y', 'escudos_y', 'hielo_y', 'roto_y']),
    disperso: [{ t: HI, p: ['hie2_cadaver', 'hie2_escarcha', 'hie2_cofre'] }, { t: NI, p: ['nie2_escudos', 'nie2_cuerno', 'nie2_lena'] }],
    grande: [{ t: HI, p: ['hie2_pilar_runa', 'hie2_estatua', 'hie2_columna'] }],
    luces: [{ t: NI, p: ['nie2_brasero'] }, { t: HI, p: ['hie2_brasero'] }],
    deco: [{ t: HI, p: ['hie2_trono'] }],
    sala: { w: [5, 2], h: [5, 2], mayor: [8, 7] },
    tinta: [8, 10, 18], haz: null, motas: 'escarcha',
  },
};
