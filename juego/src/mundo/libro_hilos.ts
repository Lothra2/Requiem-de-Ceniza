// El Libro de Odrán: los hilos de la historia y sus piezas. Cada pieza es un texto que el jugador ya lee en el juego (un
// diario, una página, unos restos, un encargo, un fantasma, la voz de la Marca, lo que cuenta alguien), con la fuente de
// donde sale y lo que la desbloquea. Lo nuevo (nombres de los hilos, cierres, notas al margen, pistas) está en
// libro_cierres.ts. La lógica (qué piezas tiene el héroe) en juego/libro.ts.

/** De dónde sale el texto de una pieza. */
export type Fuente =
  | { t: 'intro'; i: number[] }
  | { t: 'pag'; i: number }
  | { t: 'diario'; a: number; i: number }
  | { t: 'resto'; a: number; i: number }
  | { t: 'pista'; m: string; i: number }
  | { t: 'pedido'; m: string }
  | { t: 'hecho'; m: string }
  | { t: 'eleccion'; m: string }
  | { t: 'caza'; m: string }
  | { t: 'fantasma'; id: string }
  | { t: 'heraldo'; a: number }
  | { t: 'muerte' }
  | { t: 'entreacto'; a: number }
  | { t: 'revelacion' }
  | { t: 'brasa' }
  | { t: 'voz'; z: string }
  | { t: 'entrada'; z: string }
  | { t: 'jefeZona'; z: string }
  | { t: 'jefe'; id: string }
  /** Lo que cuenta o dice alguien: `k` relato o linea, y el comienzo del texto en castellano para encontrarlo (o 'base' para el relato de siempre). */
  | { t: 'npc'; n: string; k: 'relato' | 'linea'; ini: string }
  | { t: 'desvio'; z: string };

export interface Pieza {
  id: string;
  /** Una o varias fuentes: vale la primera que se tenga (las variantes de un mismo momento según lo que elegiste). */
  f: Fuente | Fuente[];
  /** Pieza clave: el cierre de Odrán sale cuando el hilo tiene todas las suyas. */
  clave?: boolean;
  /** Pieza de más: se escribe si se oye, pero no cuenta ni deja hueco (depende de cuándo se habló con alguien). */
  extra?: boolean;
  /** Acto en el que se puede encontrar (si no, sale de la fuente). Lo de un acto que no llegó no se muestra ni como hueco. */
  acto?: number;
  /** Hueco: mancha de tinta, hoja arrancada o sangre seca (si no, sale de la pieza). */
  hueco?: 'mancha' | 'arrancada' | 'sangre';
  /** Sangre en la hoja: gotas o la huella de un dedo. */
  gore?: 'gotas' | 'huella';
  /** La hoja se quema sola la primera vez que se ve. */
  quema?: boolean;
}
/** Dibujos del margen y del emblema de cada hilo (ui/libro_dibujos.ts). */
export type Dibujo = 'sello' | 'brasa' | 'campanilla' | 'ojo' | 'candado' | 'barco' | 'hacha' | 'atril' | 'campana' | 'escalera' | 'copa' | 'pregunta' | 'craneo' | 'pluma' | 'soga' | 'luna';
export interface Hilo {
  id: string;
  /** El emblema (capitular, índice, ilustración) y los dibujos que van al margen. */
  emblema: Dibujo; margen: Dibujo[];
  /** Color del campo de la capitular. */
  campo: string;
  piezas: Pieza[];
}

const npc = (n: string, k: 'relato' | 'linea', ini = 'base'): Fuente => ({ t: 'npc', n, k, ini });

export const HILOS: Hilo[] = [
  { id: 'pozo', emblema: 'sello', margen: ['craneo', 'luna', 'pluma'], campo: '#28406e', piezas: [
    { id: 'pozo_intro', f: { t: 'intro', i: [0, 1, 2] } },
    { id: 'pozo_p0', f: { t: 'pag', i: 0 } },
    { id: 'pozo_p1', f: { t: 'pag', i: 1 } },
    { id: 'pozo_p2', f: { t: 'pag', i: 2 }, clave: true },
    { id: 'pozo_p3', f: { t: 'pag', i: 3 }, gore: 'gotas' },
    { id: 'pozo_p4', f: { t: 'pag', i: 4 } },
    { id: 'pozo_p6', f: { t: 'pag', i: 6 }, clave: true },
    { id: 'pozo_p8', f: { t: 'pag', i: 8 }, clave: true },
    { id: 'pozo_resto', f: { t: 'resto', a: 1, i: 0 }, gore: 'huella' },
    { id: 'pozo_entrada', f: { t: 'entrada', z: 'a1_pozo' } },
    { id: 'pozo_odran', f: npc('odran', 'relato'), acto: 5 },
    { id: 'pozo_libro', f: { t: 'diario', a: 5, i: 0 }, clave: true },
  ] },
  { id: 'marca', emblema: 'brasa', margen: ['brasa', 'ojo', 'luna'], campo: '#7a1c18', piezas: [
    { id: 'mar_intro', f: { t: 'intro', i: [3, 4, 5, 6, 7, 8] } },
    { id: 'mar_cem', f: { t: 'voz', z: 'a1_cementerio' } },
    { id: 'mar_pozo', f: { t: 'voz', z: 'a1_pozo' } },
    { id: 'mar_llave', f: { t: 'pag', i: 5 } },
    { id: 'mar_tumbas', f: { t: 'voz', z: 'a2_tumbas1' } },
    { id: 'mar_templo', f: { t: 'voz', z: 'a3_templo1' } },
    { id: 'mar_nino', f: npc('nino_nieve', 'relato', 'El niño dice') },
    { id: 'mar_nino_eleccion', f: { t: 'eleccion', m: 'm4_nino' } },
    { id: 'mar_hielo', f: { t: 'voz', z: 'a4_hielo1' } },
    { id: 'mar_llanuras', f: { t: 'voz', z: 'a5_llanuras' }, clave: true },
    { id: 'mar_sangre', f: { t: 'entrada', z: 'a5_santuario1' } },
    { id: 'mar_astilla', f: { t: 'diario', a: 5, i: 1 }, clave: true },
    { id: 'mar_sexta', f: { t: 'diario', a: 5, i: 2 }, clave: true },
    { id: 'mar_revelacion', f: { t: 'revelacion' }, clave: true },
    { id: 'mar_brasa', f: { t: 'brasa' }, clave: true },
    { id: 'mar_ysolde', f: npc('ysolde', 'relato', 'Te seguí desde el Refugio'), acto: 7 },
  ] },
  { id: 'vesperio', emblema: 'campanilla', margen: ['campanilla', 'luna', 'pluma'], campo: '#4a2a6a', piezas: [
    { id: 'ves_ivola0', f: { t: 'diario', a: 1, i: 0 } },
    { id: 'ves_ivola1', f: { t: 'diario', a: 1, i: 1 }, clave: true },
    { id: 'ves_abadia', f: { t: 'fantasma', id: 'f_abadia' } },
    { id: 'ves_her1', f: { t: 'heraldo', a: 1 } },
    { id: 'ves_carta1', f: { t: 'resto', a: 1, i: 3 }, clave: true, gore: 'gotas' },
    { id: 'ves_her2', f: { t: 'heraldo', a: 2 } },
    { id: 'ves_carta2', f: { t: 'resto', a: 2, i: 3 } },
    { id: 'ves_celda', f: npc('ixel', 'relato', '¿Viste a un hombre pálido') },
    { id: 'ves_her3', f: { t: 'heraldo', a: 3 } },
    { id: 'ves_carta3', f: { t: 'resto', a: 3, i: 3 } },
    { id: 'ves_her4', f: { t: 'heraldo', a: 4 } },
    { id: 'ves_carta4', f: { t: 'resto', a: 4, i: 3 } },
    { id: 'ves_carta5', f: { t: 'resto', a: 5, i: 3 }, clave: true, quema: true },
    { id: 'ves_muerte', f: { t: 'muerte' }, clave: true, gore: 'gotas' },
    { id: 'ves_lys', f: npc('lys', 'linea', 'Vesperio. Lo recuerdo'), extra: true },
  ] },
  { id: 'tomas', emblema: 'ojo', margen: ['ojo', 'soga', 'craneo'], campo: '#2a5a50', piezas: [
    { id: 'tomas_abad', f: { t: 'pag', i: 7 }, clave: true },
    { id: 'tomas_relato', f: npc('tomas', 'relato') },
    { id: 'tomas_brasa', f: npc('tomas', 'linea', 'Tomás te dibuja con una espada'), extra: true },
    { id: 'tomas_dibujo', f: npc('tomas', 'linea', 'Tomás dibuja a un hombre pálido'), extra: true },
    { id: 'tomas_cripta', f: { t: 'pedido', m: 'm1_reliquia' } },
    { id: 'tomas_reliquia', f: { t: 'eleccion', m: 'm1_reliquia' }, clave: true },
    { id: 'tomas_cuelgan', f: { t: 'pedido', m: 'm1s_ahorcados' } },
    { id: 'tomas_p0', f: { t: 'pista', m: 'm1s_ahorcados', i: 0 } },
    { id: 'tomas_p1', f: { t: 'pista', m: 'm1s_ahorcados', i: 1 }, gore: 'huella' },
    { id: 'tomas_p2', f: { t: 'pista', m: 'm1s_ahorcados', i: 2 }, clave: true },
    { id: 'tomas_bosque', f: { t: 'fantasma', id: 'f_bosque' } },
    { id: 'tomas_cintas', f: { t: 'desvio', z: 'a1_bosque' } },
    { id: 'tomas_ciro', f: npc('ciro', 'relato'), extra: true },
    { id: 'tomas_soga', f: { t: 'caza', m: 'm1s_ciro' } },
    { id: 'tomas_era', f: { t: 'hecho', m: 'm1s_ciro' }, clave: true },
  ] },
  { id: 'sellos', emblema: 'candado', margen: ['candado', 'craneo', 'sello'], campo: '#5a4a1a', piezas: [
    { id: 'sel_mapas', f: npc('cartografo', 'relato') },
    { id: 'sel_ivola2', f: { t: 'diario', a: 1, i: 2 }, clave: true },
    { id: 'sel_lys', f: npc('lys', 'relato') },
    { id: 'sel_ent1', f: { t: 'entreacto', a: 1 } },
    { id: 'sel_tahem0', f: { t: 'diario', a: 2, i: 0 } },
    { id: 'sel_tahem1', f: { t: 'diario', a: 2, i: 1 } },
    { id: 'sel_manos', f: { t: 'resto', a: 2, i: 2 }, gore: 'huella' },
    { id: 'sel_tahem2', f: { t: 'diario', a: 2, i: 2 }, clave: true },
    { id: 'sel_ent2', f: { t: 'entreacto', a: 2 } },
    { id: 'sel_mapa', f: { t: 'eleccion', m: 'm2_sol' } },
    { id: 'sel_ama1', f: { t: 'diario', a: 3, i: 1 } },
    { id: 'sel_ent3', f: { t: 'entreacto', a: 3 }, clave: true },
    { id: 'sel_runas0', f: { t: 'diario', a: 4, i: 0 } },
    { id: 'sel_runas2', f: { t: 'diario', a: 4, i: 2 } },
    { id: 'sel_ent4', f: { t: 'entreacto', a: 4 }, clave: true },
    { id: 'sel_ent5', f: { t: 'entreacto', a: 5 }, clave: true },
  ] },
  { id: 'ama', emblema: 'barco', margen: ['barco', 'luna', 'pluma'], campo: '#1e4a62', piezas: [
    { id: 'ama_caja', f: { t: 'diario', a: 3, i: 0 } },
    { id: 'ama_hija', f: { t: 'diario', a: 3, i: 2 }, clave: true },
    { id: 'ama_esperaban', f: { t: 'desvio', z: 'a3_pantano' } },
    { id: 'ama_tarn', f: { t: 'pedido', m: 'm6t_bitacora' } },
    { id: 'ama_b0', f: { t: 'pista', m: 'm6t_bitacora', i: 0 } },
    { id: 'ama_b1', f: { t: 'pista', m: 'm6t_bitacora', i: 1 }, clave: true },
    { id: 'ama_b2', f: { t: 'pista', m: 'm6t_bitacora', i: 2 }, clave: true },
    { id: 'ama_bitacora', f: { t: 'eleccion', m: 'm6t_bitacora' }, clave: true },
    { id: 'ama_oya', f: npc('oya', 'linea', 'Mi madre no me abandonó'), extra: true },
  ] },
  { id: 'norte', emblema: 'hacha', margen: ['hacha', 'craneo', 'luna'], campo: '#3a5a7a', piezas: [
    { id: 'nor_sigrun', f: npc('sigrun', 'relato'), extra: true },
    { id: 'nor_vigdis', f: npc('vigdis', 'relato') },
    { id: 'nor_eirik', f: { t: 'pedido', m: 'm4_grieta' } },
    { id: 'nor_glaciar', f: { t: 'fantasma', id: 'f_glaciar' } },
    { id: 'nor_runas1', f: { t: 'diario', a: 4, i: 1 } },
    { id: 'nor_s0', f: { t: 'pista', m: 'm4_sangre', i: 0 }, gore: 'huella' },
    { id: 'nor_s1', f: { t: 'pista', m: 'm4_sangre', i: 1 }, clave: true },
    { id: 'nor_s2', f: { t: 'pista', m: 'm4_sangre', i: 2 } },
    { id: 'nor_vigdis_eleccion', f: { t: 'eleccion', m: 'm4_sangre' }, clave: true },
    { id: 'nor_grieta', f: { t: 'jefeZona', z: 'a4_grieta' } },
    { id: 'nor_madre', f: { t: 'pista', m: 'm4s_abrazados', i: 1 } },
    { id: 'nor_abrazados', f: { t: 'pista', m: 'm4s_abrazados', i: 2 } },
    { id: 'nor_ulfar', f: { t: 'hecho', m: 'm4s_desertor' } },
    { id: 'nor_rey', f: { t: 'jefe', id: 'rey_escarcha' }, clave: true },
  ] },
  { id: 'auren', emblema: 'atril', margen: ['atril', 'campanilla', 'pluma'], campo: '#6a4a20', piezas: [
    { id: 'aur_vispera', f: { t: 'eleccion', m: 'm3_ixel' } },
    { id: 'aur_bastion', f: { t: 'entrada', z: 'a5_bastion' } },
    { id: 'aur_coro', f: { t: 'pedido', m: 'm5_coro' }, clave: true },
    { id: 'aur_seis', f: { t: 'jefeZona', z: 'a5_abismo2' } },
    { id: 'aur_coro_eleccion', f: { t: 'eleccion', m: 'm5_coro' }, clave: true },
    { id: 'aur_llanuras', f: { t: 'fantasma', id: 'f_llanuras' } },
    { id: 'aur_alumno', f: npc('auren', 'linea', 'Vesperio fue mi alumno'), extra: true },
    { id: 'aur_juicio', f: { t: 'eleccion', m: 'm5t_juicio' }, clave: true },
    { id: 'aur_odran', f: [npc('odran', 'linea', 'Auren te contó algo'), npc('odran', 'linea', 'Treinta años escribiendo')] },
    { id: 'aur_quemados', f: { t: 'hecho', m: 'm5s_ceniza' } },
    { id: 'aur_doce', f: npc('lys', 'relato', 'Ysmeral tenía doce hermanas') },
    { id: 'aur_arriba', f: [npc('auren', 'relato', 'Me perdonaste'), npc('auren', 'relato', 'Ya nadie me contesta')], extra: true },
  ] },
  { id: 'ysmeral', emblema: 'campana', margen: ['campana', 'craneo', 'barco'], campo: '#1e5a5a', piezas: [
    { id: 'ysm_salitre', f: npc('sor_salitre', 'relato'), clave: true },
    { id: 'ysm_nerea', f: npc('nerea', 'relato') },
    { id: 'ysm_camp0', f: { t: 'diario', a: 6, i: 0 } },
    { id: 'ysm_camp1', f: { t: 'diario', a: 6, i: 1 }, clave: true },
    { id: 'ysm_camp2', f: { t: 'diario', a: 6, i: 2 } },
    { id: 'ysm_mesa', f: { t: 'resto', a: 6, i: 0 }, gore: 'gotas' },
    { id: 'ysm_barrio', f: { t: 'fantasma', id: 'f_barrio' } },
    { id: 'ysm_c0', f: { t: 'pista', m: 'm6s_campanero', i: 0 } },
    { id: 'ysm_c1', f: { t: 'pista', m: 'm6s_campanero', i: 1 }, clave: true },
    { id: 'ysm_c2', f: { t: 'pista', m: 'm6s_campanero', i: 2 }, gore: 'huella' },
    { id: 'ysm_orden', f: { t: 'hecho', m: 'm6s_campanero' }, clave: true },
    { id: 'ysm_boya', f: { t: 'resto', a: 6, i: 1 } },
    { id: 'ysm_voz', f: { t: 'voz', z: 'a6_catedral1' } },
    { id: 'ysm_criptas', f: { t: 'jefeZona', z: 'a6_criptas2' } },
    { id: 'ysm_buzo', f: { t: 'desvio', z: 'a6_arrecife' } },
  ] },
  { id: 'siete', emblema: 'escalera', margen: ['escalera', 'craneo', 'luna'], campo: '#6a5a2a', piezas: [
    { id: 'sie_odran', f: npc('odran', 'relato', 'Hace cuarenta años vi'), clave: true },
    { id: 'sie_eskel', f: npc('eskel', 'relato'), clave: true },
    { id: 'sie_tabla0', f: { t: 'diario', a: 7, i: 0 } },
    { id: 'sie_tabla2', f: { t: 'diario', a: 7, i: 2 }, clave: true },
    { id: 'sie_resto', f: { t: 'resto', a: 7, i: 3 }, gore: 'gotas' },
    { id: 'sie_copero', f: { t: 'pedido', m: 'm7_relicario' } },
    { id: 'sie_nego', f: { t: 'jefeZona', z: 'a7_relicario' } },
    { id: 'sie_copa', f: { t: 'pedido', m: 'm7t_copa' } },
    { id: 'sie_descanso', f: { t: 'desvio', z: 'a7_cielo' } },
    { id: 'sie_jardin', f: { t: 'entrada', z: 'a7_jardin' } },
    { id: 'sie_estatua', f: { t: 'eleccion', m: 'm7_jardin' } },
    { id: 'sie_vael', f: [npc('eskel', 'linea', 'Te pareces a Vael'), npc('eskel', 'linea', 'Apagaste tu Marca')] },
  ] },
  { id: 'sed', emblema: 'copa', margen: ['copa', 'luna', 'craneo'], campo: '#7a5a10', piezas: [
    { id: 'sed_lagrima', f: { t: 'diario', a: 4, i: 3 }, clave: true },
    { id: 'sed_sigrun', f: npc('sigrun', 'relato', 'Mi abuela contaba') },
    { id: 'sed_ysolde', f: npc('ysolde', 'linea', 'En el norte las cartas salen heladas'), extra: true },
    { id: 'sed_auren', f: npc('auren', 'relato'), extra: true },
    { id: 'sed_costa', f: { t: 'voz', z: 'a6_costa' } },
    { id: 'sed_ent6', f: { t: 'entreacto', a: 6 }, clave: true },
    { id: 'sed_puente', f: { t: 'pedido', m: 'm7_puente' }, clave: true },
    { id: 'sed_mira', f: npc('mira', 'relato') },
    { id: 'sed_boca', f: { t: 'diario', a: 7, i: 1 }, clave: true },
    { id: 'sed_cielo', f: { t: 'voz', z: 'a7_cielo' } },
    { id: 'sed_ojos', f: { t: 'resto', a: 7, i: 1 }, gore: 'gotas' },
    { id: 'sed_abrazaron', f: { t: 'desvio', z: 'a7_jardin' } },
    { id: 'sed_escalones', f: { t: 'voz', z: 'a7_escaleras' } },
    { id: 'sed_noesmalo', f: npc('auren', 'relato', 'Aun-Saar no es malo'), extra: true },
    { id: 'sed_trono', f: { t: 'jefe', id: 'aun_saar' } },
  ] },
  { id: 'pregunta', emblema: 'pregunta', margen: ['pregunta', 'campanilla', 'luna'], campo: '#3a2050', piezas: [
    { id: 'pre_auren', f: npc('auren', 'relato', 'Vesperio me dijo una vez'), clave: true },
    { id: 'pre_costa', f: { t: 'fantasma', id: 'v_costa' }, clave: true },
    { id: 'pre_barrio', f: { t: 'fantasma', id: 'v_barrio' }, clave: true },
    { id: 'pre_cielo', f: { t: 'fantasma', id: 'v_cielo' }, clave: true },
    { id: 'pre_jardin', f: { t: 'fantasma', id: 'v_jardin' }, clave: true },
  ] },
];
