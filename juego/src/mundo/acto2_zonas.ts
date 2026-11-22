// Cada zona del acto 2 con su intención (22 nov 2026). Rick: "Bajé por unas escaleras y por el portal y el mundo se parece
// mucho". Las cinco tumbas (el Pozo de los Nombres y los Nombres Borrados, el Templo del Sol Caído, la Galería de los
// Dormidos y la Cámara del Rey sin Sombra) tenían el mismo tema `tumba`: el mismo piso de arenisca, el mismo muro, la misma
// luz y el mismo adorno. Y los tres mundos abiertos el mismo `desierto`. Aquí va lo propio de cada una, encima de su tema:
// piso, muro, columnas, lo que se riega, la pared, el castigo de los campamentos, el asiento del jefe, el trazado, la
// silueta afuera, el color de la oscuridad y los haces del techo. `__acto2Viejo` vuelve a todo lo de antes.
//
// Las listas son las de siempre (`Sel` de zona.ts): `t` los temas del catálogo, `p` lo que tiene que estar en el id, `s` lo
// que no, `v` qué variantes. Las piezas nuevas van con el tema `acto2` (src/engine/gotico/catalogo/acto2.ts).

type Sel = { t: string[]; p?: string[]; s?: string[]; v?: (v: string) => boolean };
type Muro = [string, string[]];
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

const A2 = ['acto2'];
const TUMBA_LUZ: Sel[] = [{ t: ['tumba'], p: ['antorcha'] }];
// (en el desierto el obelisco de runas moradas se leía como una pieza de otro mundo: los santuarios de la arena son el altar de
//  cuernos con su fuego y el monolito pálido con su llama)
const SANT_DESIERTO = ['com_santuario_cuernos', 'com_santuario_monolito'];
const pozoMuro = (vs: string[]): [Muro, Muro] => [['a2_muro_pozo', vs], ['a2_muro_pozo', vs.map((v) => v + '_y')]];
const muro = (id: string, vs: string[]): [Muro, Muro] => [[id, vs], [id, vs.map((v) => v + '_y')]];
// ruido de valor determinista por baldosa (para las formas del piso afuera: no toca el azar de la zona)
const hz = (x: number, y: number, s: number) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
const suave = (x: number, y: number, e: number, s: number) => {
  const fx = x / e, fy = y / e, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, k = (t: number) => t * t * (3 - 2 * t);
  const a = hz(ix, iy, s), b = hz(ix + 1, iy, s), c = hz(ix, iy + 1, s), d = hz(ix + 1, iy + 1, s);
  return (a * (1 - k(u)) + b * k(u)) * (1 - k(v)) + (c * (1 - k(u)) + d * k(u)) * k(v);
};

export const VARIANTE_ZONA: Record<string, VarianteZona> = {
  // ---------------------------------------------------------------- mundos abiertos
  // Las Dunas de Sahrim: el mar de arena. Piso de rizos del viento, casi sin ensenadas (se ve lejos), dunas altas y la
  // caravana que no llegó. Nada de ruinas ni columnas: eso es de la ciudad.
  a2_dunas: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_arena_duna', parches: ['arena', 'a2_arena_duna', 'a2_arena_duna'], camino: 'arena', vinetas: [],
    borde: [{ t: ['desierto'], p: ['des2_duna'], v: (v) => /alta|doble|ondulada/.test(v) }, { t: ['desierto'], p: ['des2_roca_viento'], v: (v) => /yardang|ventifacto/.test(v) }],
    disperso: [{ t: ['desierto'], p: ['des2_huesos', 'des2_craneo_cuernos', 'des2_remolino', 'des2_arenas_movedizas', 'des2_escarabajos', 'des2_restos_batalla'] }, { t: ['desierto'], p: ['des2_arbusto'], v: (v) => /rodante|seco/.test(v) }],
    grande: [{ t: ['desierto'], p: ['des2_duna', 'des2_caravana', 'des2_osamenta', 'des2_camello_muerto'] }, { t: ['desierto'], p: ['des2_tienda'], v: (v) => /beduina|derrumbada/.test(v) }],
    extra: [{ t: ['desierto'], p: ['des2_duna', 'des2_arenas_movedizas', 'des2_remolino', 'des2_osamenta', 'des2_caravana'] }],
    castigo: [['des2_caravana', 'emboscada'], ['des2_camello_muerto', 'con_buitres'], ['des_esqueleto', 'enterrado']],
    silueta: { ens: [3, 1], mac: [0, 1], hondo: 0.75 },
  },
  // El Oasis Muerto: era un lago. En el medio, el lecho seco en placas de barro con su orilla de tierra; alrededor la arena.
  // Palmeras muertas y quebradas, la barca varada, camellos, buitres y pozos secos.
  a2_oasis_muerto: {
    santuarios: SANT_DESIERTO,
    piso: 'arena', parches: ['tierra', 'arena', 'arena'], camino: 'tierra', vinetas: [],
    pisoExt: (bx, by, tw, th) => {
      const dx = (bx + 0.5 - tw / 2) / (tw / 2), dy = (by + 0.5 - th / 2) / (th / 2), d = Math.hypot(dx * 0.95, dy * 1.05) + (suave(bx, by, 3, 7) - 0.5) * 0.32;
      return d < 0.34 ? 'a2_barro_seco' : d < 0.47 ? 'a2_barro_orilla' : undefined;
    },
    borde: [{ t: ['desierto'], p: ['des2_palmera'], v: (v) => /muerta|quebrada/.test(v) }, { t: ['desierto'], p: ['des2_duna'], v: (v) => /baja|con_huesos/.test(v) }, { t: ['desierto'], p: ['des2_roca_viento'], v: (v) => /hongo|columnas/.test(v) }],
    disperso: [{ t: ['desierto'], p: ['des2_palmera'], v: (v) => /muerta|quebrada/.test(v) }, { t: ['desierto'], p: ['des2_camello_muerto', 'des2_buitres', 'des2_huesos', 'des2_craneo_cuernos'] }, { t: ['desierto'], p: ['des2_arbusto'], v: (v) => /seco|espinoso/.test(v) }],
    grande: [{ t: ['desierto'], p: ['des2_oasis'], v: (v) => v === 'seco' }, { t: ['desierto'], p: ['des2_pozo_seco'] }, { t: A2, p: ['a2_barca_varada'] }, { t: ['desierto'], p: ['des2_palmera'], v: (v) => /muerta|grupo/.test(v) }],
    extra: [{ t: ['desierto'], p: ['des2_oasis'], v: (v) => v === 'seco' }, { t: ['desierto'], p: ['des2_palmera'], v: (v) => /muerta|quebrada/.test(v) }, { t: ['desierto'], p: ['des2_camello_muerto', 'des2_buitres', 'des2_pozo_seco'] }, { t: A2, p: ['a2_barca_varada'] }],
    castigo: [['a2_barca_varada', 'rota'], ['des2_camello_muerto', 'momificado'], ['des2_buitres', 'comiendo']],
  },
  // Las Ruinas del Sol: la ciudad que adoraba al sol. Calles enlosadas en cuadrícula, la arena metida en las manzanas,
  // casas sin techo, columnatas, la fuente seca de cada plaza, estatuas caídas, esfinges y obeliscos.
  a2_ruinas: {
    santuarios: SANT_DESIERTO,
    piso: 'arena', parches: ['a2_losa_calle', 'arenisca', 'arena'], camino: 'a2_losa_calle', vinetas: ['tumba'],
    pisoExt: (bx, by, tw, th, m) => {
      const calle = (bx % 6 === 2) || (by % 6 === 3), plaza = suave(bx, by, 4, 11) > 0.64;
      if (calle) return suave(bx, by, 2, 13) > 0.8 ? 'arena' : 'a2_losa_calle';
      if (plaza) return 'a2_losa_calle';
      return m > 0.55 ? 'arenisca' : undefined;
    },
    borde: [{ t: ['desierto'], p: ['des2_muro'], v: (v) => /^(x|bajo)/.test(v) }, { t: ['desierto'], p: ['des2_duna'], v: (v) => /baja|alta/.test(v) }, { t: A2, p: ['a2_ruina_casa'] }],
    disperso: [{ t: ['desierto'], p: ['des2_estela', 'des2_columnas', 'des2_huesos', 'des2_restos_batalla'] }, { t: ['desierto'], p: ['des_jarras', 'des_columnas'] }],
    grande: [{ t: A2, p: ['a2_columnata', 'a2_ruina_casa', 'a2_fuente_seca'] }, { t: ['desierto'], p: ['des2_esfinge', 'des2_estatua_caida', 'des2_obelisco', 'des2_sarcofago'] }],
    extra: [{ t: A2, p: ['a2_columnata', 'a2_ruina_casa', 'a2_fuente_seca'] }, { t: ['desierto'], p: ['des2_esfinge', 'des2_estatua_caida', 'des2_obelisco', 'des2_columnas', 'des2_muro', 'des2_estela'] }],
    castigo: [['des_empalado', 'buitres'], ['des2_estatua_caida', 'cabeza'], ['cat_monton_huesos', 'de_calaveras']],
  },
  // ---------------------------------------------------------------- bajo tierra
  // El Pozo de los Nombres: piedra negra y húmeda, agua negra en charcos, los muros cubiertos de los nombres de los que
  // bajaron, sus sogas y cubos. Arriba la boca del pozo deja caer una luz fría.
  a2_nombres1: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_losa_pozo', parches: ['a2_losa_pozo', 'a2_agua_negra', 'a2_losa_pozo'], oscuridad: 0.8, estilo: 'cementerio',
    ...(() => { const [x, y] = pozoMuro(['nombres', 'nombres', 'cuerdas', 'gotea']); return { muroX: x, muroY: y }; })(),
    disperso: [{ t: A2, p: ['a2_cuerdas_pozo', 'a2_piedra_nombres', 'a2_charca_negra'] }, { t: ['catacumbas'], p: ['cat2_gotera', 'cat2_huesos_suelo'] }],
    grande: [{ t: A2, p: ['a2_piedra_nombres'], v: (v) => v === 'nombres' }],
    luces: TUMBA_LUZ, deco: [{ t: A2, p: ['a2_boca_pozo'], v: (v) => v === 'cabria' }],
    pared: [['a2_cuerdas_pozo', 'suelto'], ['cri_vasijas', 'suelto'], ['cat_monton_huesos', 'suelto'], ['cri_pila_craneos', 'suelto']],
    castigo: [['a2_piedra_nombres', 'nombres'], ['a2_cuerdas_pozo', 'cubo_roto'], ['cem2_velas_tumba', 'derretidas']],
    sala: { w: [4, 3], h: [4, 3], mayor: [7, 7] },
    tinta: [4, 10, 14], haz: { c: '196,214,232', dens: 0.0062, frio: true }, motas: '',
  },
  // Los Nombres Borrados: el fondo del pozo. El agua negra lo cubre casi todo, los nombres están raspados (para que él no
  // sepa a quién beber), sin luz de arriba, y la Borradora espera junto a otra boca que sigue bajando.
  a2_nombres2: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_agua_negra', parches: ['a2_losa_pozo', 'a2_agua_negra', 'a2_losa_pozo'], oscuridad: 0.88, estilo: 'ahogada',
    ...(() => { const [x, y] = pozoMuro(['raspados', 'borrado', 'gotea', 'raspados']); return { muroX: x, muroY: y }; })(),
    disperso: [{ t: A2, p: ['a2_charca_negra', 'a2_piedra_nombres'], v: (v) => v !== 'nombres' }, { t: A2, p: ['a2_cuerdas_pozo'], v: (v) => v === 'cubo_roto' }, { t: ['catacumbas'], p: ['cat2_huesos_suelo'] }],
    grande: [{ t: A2, p: ['a2_piedra_nombres'], v: (v) => v === 'raspada' }],
    luces: [{ t: ['tumba'], p: ['antorcha'], v: (v) => v === 'muro' }], deco: [{ t: A2, p: ['a2_charca_negra'], v: (v) => v === 'velas' }],
    pared: [['a2_cuerdas_pozo', 'suelto'], ['cat_monton_huesos', 'suelto'], ['cri_pila_craneos', 'suelto']],
    castigo: [['a2_charca_negra', 'velas'], ['cri_cuerpo_amortajado', 'momia'], ['a2_piedra_nombres', 'raspada']],
    foco: ['a2_boca_pozo', 'rota'], brasero: 'tum_antorcha',
    tinta: [2, 5, 8], haz: null, motas: '',
  },
  // El Templo del Sol Caído: oro viejo. Losas doradas con el sol de bronce embutido, columnas con su disco, muros con el
  // sol en relieve y la procesión, mucha luz que entra por el techo roto, soles caídos y el altar que mira hacia abajo.
  a2_sol: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_losa_sol', parches: ['a2_losa_sol', 'arena', 'a2_losa_sol'], oscuridad: 0.66,
    ...(() => { const [x, y] = muro('a2_muro_sol', ['disco', 'rayos', 'friso', 'friso', 'roto']); return { muroX: x, muroY: y }; })(),
    disperso: [{ t: A2, p: ['a2_disco_caido'] }, { t: ['tumba'], p: ['canopos', 'obelisco'] }, { t: ['desierto'], p: ['jarr', 'vasij'], s: ['des2_'] }],
    grande: [{ t: A2, p: ['a2_columna_sol'] }],
    luces: [{ t: ['tumba'], p: ['brasero'] }], deco: [{ t: A2, p: ['a2_altar_sol'], v: (v) => v === 'abajo' }],
    pared: [['tum_canopos', 'suelto'], ['cri_vasijas', 'suelto'], ['mue_velas', 'suelto']],
    castigo: [['a2_altar_sol', 'roto'], ['cri_cuerpo_amortajado', 'momia'], ['cat_monton_huesos', 'chico']],
    foco: ['a2_altar_sol', 'abajo'], brasero: 'tum_brasero',
    sala: { w: [5, 2], h: [5, 2], mayor: [9, 7] },
    tinta: [22, 12, 2], haz: { c: '255,208,128', dens: 0.012 }, motas: 'oro',
  },
  // La Galería de los Dormidos: galerías largas y angostas, los muros de nichos con los dormidos acostados en hileras, los
  // lechos de piedra en fila a los dos lados del paso, vendas por el piso, olor a canela. Poca luz, velas.
  a2_tumbas1: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_losa_dormidos', parches: ['a2_losa_dormidos', 'arenisca', 'a2_losa_dormidos'], oscuridad: 0.8,
    ...(() => { const [x, y] = muro('a2_muro_dormidos', ['loculos', 'loculos', 'vendas', 'sellado', 'vacios']); return { muroX: x, muroY: y }; })(),
    disperso: [{ t: A2, p: ['a2_vendas'] }, { t: ['tumba'], p: ['canopos', 'sarcofago'] }, { t: ['desierto'], p: ['jarr', 'vasij'], s: ['des2_'] }],
    grande: [{ t: A2, p: ['a2_lecho_dormido'] }], hileras: true, limpio: true,
    // (los huecos entre galerías se llenaban de pilas de sillares y escombro que ensuciaban todo: ahora es la arena que entró)
    relleno: { alta: [['des2_duna', 'alta', 1], ['des2_duna', 'doble', 1]], media: [['des2_duna', 'ondulada', 1], ['des2_duna', 'alta', 0.6]], baja: [['des2_duna', 'baja', 1]] },
    luces: [{ t: ['tumba'], p: ['antorcha'] }, { t: ['cripta' as any], p: ['cri_candelabro'], v: (v) => !/_der$/.test(v) }],
    deco: [{ t: ['tumba'], p: ['sarcofago'], v: (v) => /momia/.test(v) }],
    pared: [['tum_canopos', 'suelto'], ['mue_velas', 'suelto'], ['cri_vasijas', 'suelto'], ['cat2_momias_pared', 'largo']],
    castigo: [['a2_lecho_dormido', 'vacio'], ['a2_vendas', 'enredo'], ['cri_cuerpo_amortajado', 'momia']],
    sala: { w: [8, 2], h: [4, 1], galeria: true, cada: 80 },
    tinta: [18, 10, 2], haz: { c: '255,196,112', dens: 0.0045 }, motas: 'polvo',
  },
  // La Cámara del Rey sin Sombra: basalto pulido, oro y pórfido. Salas grandes y pocas, la avenida de estatuas del rey, el
  // muro donde a todos les pintaron su sombra menos a él, el tesoro. Ningún haz de luz: aquí nada echa sombra.
  a2_tumbas2: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_losa_rey', parches: ['a2_losa_rey', 'a2_losa_rey', 'a2_losa_rey'], oscuridad: 0.8, estilo: 'cementerio',
    ...(() => { const [x, y] = muro('a2_muro_rey', ['friso', 'rey', 'oro', 'friso', 'roto']); return { muroX: x, muroY: y }; })(),
    disperso: [{ t: A2, p: ['a2_tesoro_rey'] }, { t: ['tumba'], p: ['canopos'] }, { t: A2, p: ['a2_estatua_rey'], v: (v) => v === 'caida' }],
    grande: [{ t: A2, p: ['a2_estatua_rey'], v: (v) => v !== 'caida' }],
    luces: [{ t: ['tumba'], p: ['brasero'] }], deco: [{ t: ['tumba'], p: ['sarcofago'], v: (v) => /chacal/.test(v) }],
    pared: [['a2_tesoro_rey', 'suelto'], ['tum_canopos', 'suelto'], ['cri_vasijas', 'suelto']],
    castigo: [['a2_tesoro_rey', 'cofres'], ['des_esqueleto', 'costillas'], ['a2_tesoro_rey', 'derramado']],
    foco: ['mue_trono', 'dorado'], brasero: 'tum_brasero',
    sala: { w: [6, 2], h: [5, 2], cada: 110 },
    tinta: [10, 5, 13], haz: null, motas: '',
  },
  // La Cueva de los Escarabajos: una cueva viva. El piso con la arena que entra y quitina que brilla, nidos, nidadas de
  // huevos que alumbran verde, mudas vacías, arena que cae por las grietas del techo.
  a2_escarabajos: {
    santuarios: SANT_DESIERTO,
    piso: 'a2_cueva_quitina', parches: ['a2_cueva_quitina', 'arena', 'a2_cueva_quitina'], oscuridad: 0.78,
    disperso: [{ t: A2, p: ['a2_quitina', 'a2_huevos', 'a2_arena_cae'] }, { t: ['desierto'], p: ['des2_escarabajos'] }, { t: ['cueva'], p: ['cue2_nido_huesos', 'cue2_estalagmitas'] }],
    grande: [{ t: ['cueva'], p: ['cue2_pilar_roca', 'cue2_columna'] }],
    luces: [{ t: A2, p: ['a2_huevos'] }, { t: ['cueva'], p: ['antorcha'], s: ['cue2_'] }], deco: [{ t: A2, p: ['a2_arena_cae'], v: (v) => v === 'chorro' }, { t: A2, p: ['a2_nido_escarabajo'] }],
    pared: [['a2_quitina', 'suelto'], ['a2_huevos', 'suelto'], ['cat_monton_huesos', 'suelto']],
    castigo: [['a2_nido_escarabajo', 'abierto'], ['des_esqueleto', 'costillas'], ['a2_quitina', 'pedazos']],
    foco: ['a2_nido_escarabajo', 'abierto'],
    tinta: [7, 11, 3], haz: { c: '255,214,150', dens: 0.0045 }, motas: 'polvo',
  },
};

/** Lo propio de la zona, o nada con `__acto<N>Viejo` (la bandera de su acto: `__acto2Viejo`, `__acto6Viejo`...). */
export const varianteDe = (id: string): VarianteZona | undefined => ((globalThis as any)[`__acto${id[1]}Viejo`] ? undefined : VARIANTE_ZONA[id]);
