// El acto 7 con intención (22 nov 2026). Los dos mundos abiertos con `celestial` (el Cielo Roto y el Jardín de los que
// Intentaron), las dos partes de las Islas de Oro con `celestial_islas` y cuatro interiores con `celestial_interior` (la Bóveda
// de los Astros, el Relicario del Sediento, las Escaleras al Trono y el Trono Sediento) salían con la misma arenisca, la misma
// muralla de runas y el mismo riego de oro y mármol. Cada una con lo suyo (zonas_propias.ts). `__acto7Viejo` vuelve atrás.
import type { VarianteZona, Sel, Muro } from './zonas_propias';
import { suave } from './ruido_zona';

const CE = ['celestial'];
const muro = (id: string, vs: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: [id, vs], muroY: [id, vs.map((v) => v + '_y')] });
const obra = (est: string, panos: string[]): { muroX: Muro; muroY: Muro } => ({ muroX: ['muro_obra', panos.map((p) => `${est}_${p}`)], muroY: ['muro_obra', panos.map((p) => `${est}_${p}_y`)] });
const LUZ_BLANCA: Sel[] = [{ t: CE, p: ['cel_brasero_blanco'], v: (v) => v !== 'apagado' }];

export const ZONAS_ACTO7: Record<string, VarianteZona> = {
  // El Cielo Roto: lo que se cayó del cielo. Ceniza gris sobre el mármol de las islas, la cara del coloso, alas de piedra,
  // ángeles caídos, lanzas, cadenas que suben al cielo y nubes de ceniza en el borde. Gris ceniza.
  a7_cielo: {
    piso: 'a7_ceniza_marmol', parches: ['a7_ceniza_marmol', 'a7_oro_losas', 'a7_ceniza_marmol'], camino: 'a7_oro_losas', vinetas: [],
    borde: [{ t: CE, p: ['cel_isla_roca', 'cel_cadena_dorada', 'cel_isla_ruinas', 'cel_torre_ruina'] }, { t: CE, p: ['cel_nube_ceniza'], v: (v) => v === 'grande' || v === 'chica' }],
    disperso: [{ t: CE, p: ['cel_escombros_marmol', 'cel_ala_piedra', 'cel_lanza_angel', 'cel_halo_roto', 'cel_corona_caida', 'cel_mano_estatua', 'cel_piso_roto', 'cel_grieta_vacio'] }],
    grande: [{ t: CE, p: ['cel_angel_caido', 'cel_cabeza_coloso', 'cel_torre_ruina', 'cel_arco_triunfal', 'cel_corona_caida'] }, { t: CE, p: ['cel_columna_rota'], v: (v) => v !== 'corta' }],
    luces: [{ t: CE, p: ['cel_rayo_luz'] }, ...LUZ_BLANCA],
    castigo: [['cel_angel_caido', 'sin_alas'], ['sed_cuerpo_seco', undefined], ['cel_lanza_angel', 'rotas']],
    tinta: [12, 11, 10],
  },
  // El Jardín de los que Intentaron: musgo de oro seco con piedras de paso, árboles de oro muertos, los suplicantes de mármol
  // en grupos, fuentes secas y pedestales vacíos. Oro viejo.
  a7_jardin: {
    piso: 'a7_musgo_oro', parches: ['a7_musgo_oro', 'a7_oro_losas', 'a7_musgo_oro'], camino: 'a7_oro_losas', vinetas: [],
    borde: [{ t: CE, p: ['cel_arbol_oro', 'cel_jardin_estatuas', 'cel_balaustrada'] }],
    disperso: [{ t: CE, p: ['cel_estatua_suplica', 'cel_pedestal_vacio', 'cel_anfora_oro', 'cel_arpa_rota', 'cel_halo_roto'] }],
    grande: [{ t: CE, p: ['cel_jardin_estatuas', 'cel_arbol_oro', 'cel_fuente_seca', 'cel_estatua_angel'] }],
    luces: [{ t: CE, p: ['cel_candelabro_oro'], v: (v) => v !== 'caido' }, ...LUZ_BLANCA],
    castigo: [['cel_jardin_estatuas', 'con_arbol'], ['sed_cuerpo_seco', undefined], ['cel_estatua_suplica', 'postrado']],
    pisoExt: (bx, by) => (suave(bx, by, 4, 31) > 0.7 ? 'a7_oro_losas' : undefined),
    tinta: [14, 11, 4],
  },
  // Las Islas de Oro, el Puente Quebrado: las islas de mármol claro con oro, columnas rotas y escaleras flotantes. Azul de cielo.
  a7_islas1: {
    piso: 'a7_oro_losas', parches: ['a7_oro_losas', 'a7_oro_losas', 'a7_oro_losas'],
    tinta: [6, 9, 16], haz: null, motas: 'oro',
  },
  // Las Islas Altas: más cerca del trono las islas son losas de runas y llueve ceniza; el oro se apaga. Gris violeta.
  a7_islas2: {
    piso: 'a7_ceniza_marmol', parches: ['a7_ceniza_marmol', 'a7_sed', 'a7_ceniza_marmol'],
    tinta: [10, 8, 13], haz: null, motas: '',
  },
  // La Bóveda de los Astros: lapislázuli con estrellas de oro en el piso y en los muros, esferas armilares, atriles y
  // obeliscos de oro. Azul noche y motas de oro.
  a7_boveda: {
    piso: 'a7_astros', parches: ['a7_astros', 'a7_oro_losas', 'a7_astros'], estilo: 'celestial',
    ...muro('a7_muro_astros', ['astros', 'astros', 'esfera', 'roto']),
    disperso: [{ t: ['arcano'], p: ['arc_atril', 'arc_estante'] }, { t: CE, p: ['cel_esfera_armilar', 'cel_halo_roto', 'cel_arpa_rota'] }],
    grande: [{ t: CE, p: ['cel_obelisco_oro'], v: (v) => v === 'entero' || v === 'flotante' }, { t: ['arcano'], p: ['arc_pilar_estrella'] }],
    luces: [{ t: CE, p: ['cel_candelabro_oro'], v: (v) => v !== 'caido' }, { t: ['arcano'], p: ['arc_brasero'] }],
    deco: [{ t: CE, p: ['cel_esfera_armilar'], v: (v) => v !== 'rota' }],
    pared: [['cel_estandarte', 'suelto'], ['cel_candelabro_oro', 'suelto'], ['arc_estante', 'suelto']],
    castigo: [['cel_esfera_armilar', 'rota'], ['sed_cuerpo_seco', undefined], ['cel_halo_roto', 'monton']],
    foco: ['cel_esfera_armilar', 'flotante'], brasero: 'cel_candelabro_oro',
    tinta: [3, 5, 18], haz: null, motas: 'oro',
  },
  // El Relicario del Sediento: mármol pálido y alfombras de terciopelo carmesí, nichos con relicarios, ánforas, coronas y halos
  // de los que vinieron a pedir. Carmesí y oro.
  a7_relicario: {
    piso: 'a7_relicario', parches: ['a7_relicario', 'a7_oro_losas', 'a7_relicario'], estilo: 'celestial',
    ...muro('a7_muro_relicario', ['nichos', 'nichos', 'velo', 'vacio']),
    disperso: [{ t: CE, p: ['cel_relicario', 'cel_anfora_oro', 'cel_corona_caida', 'cel_halo_roto', 'cel_pedestal_vacio'] }],
    grande: [{ t: CE, p: ['cel_columna_rota'], v: (v) => v === 'entera' || v === 'alta' }],
    luces: [{ t: CE, p: ['cel_candelabro_oro'], v: (v) => v !== 'caido' }],
    deco: [{ t: CE, p: ['cel_altar_sed'], v: (v) => v === 'con_ofrendas' }],
    pared: [['cel_relicario', 'suelto'], ['cel_anfora_oro', 'suelto'], ['cel_candelabro_oro', 'suelto']],
    castigo: [['cel_altar_sed', 'con_ofrendas'], ['sed_cuerpo_seco', undefined], ['cel_relicario', 'volcado']],
    foco: ['cel_altar_sed', 'con_cuenco'], brasero: 'cel_candelabro_oro',
    tinta: [16, 3, 7], haz: { c: '255,210,150', dens: 0.004 }, motas: 'oro',
  },
  // Las Escaleras al Trono: mármol blanco en peldaños, la sillería del cielo con pilastras, columnatas y balaustradas,
  // escaleras de oro y mucha luz blanca que baja. Blanco y oro.
  a7_escaleras: {
    piso: 'a7_peldanos', parches: ['a7_peldanos', 'a7_oro_losas', 'a7_peldanos'], estilo: 'celestial',
    ...obra('celestial', ['pilastras', 'liso', 'arco_ciego', 'pilastras', 'roto']),
    disperso: [{ t: CE, p: ['cel_escombros_marmol', 'cel_estatua_suplica', 'cel_estandarte', 'cel_lanza_angel'] }],
    grande: [{ t: CE, p: ['cel_estatua_angel'], v: (v) => v !== 'sin_cabeza' }, { t: CE, p: ['cel_columna_rota'], v: (v) => v === 'entera' }],
    luces: LUZ_BLANCA, deco: [{ t: CE, p: ['cel_escalera_oro', 'cel_balaustrada'] }],
    pared: [['cel_estandarte', 'suelto'], ['cel_candelabro_oro', 'suelto']],
    castigo: [['cel_estatua_suplica', 'tendiendo'], ['sed_cuerpo_seco', undefined], ['cel_estatua_suplica', 'encogido']],
    tinta: [14, 13, 10], haz: { c: '255,246,220', dens: 0.011 }, motas: 'oro',
  },
  // El Trono Sediento: oro reseco y agrietado como tierra sin agua, la sangre seca en las grietas, los muros de placas de oro
  // por donde baja la sangre, bebidos por todas partes y la copa volcada. Rojo negro.
  a7_trono: {
    piso: 'a7_sed', parches: ['a7_sed', 'a7_sed', 'a7_sed'], estilo: 'celestial',
    ...muro('a7_muro_sed', ['placas', 'sangre', 'bocas', 'placas', 'roto']),
    disperso: [{ t: CE, p: ['cel_halo_roto', 'cel_corona_caida', 'cel_anfora_oro', 'cel_grieta_vacio'] }],
    grande: [{ t: CE, p: ['cel_altar_sed'] }, { t: CE, p: ['cel_obelisco_oro'], v: (v) => v === 'partido' }],
    luces: LUZ_BLANCA, deco: [{ t: CE, p: ['cel_trono_copa'], v: (v) => v === 'volcada' || v === 'con_ceniza' }],
    pared: [['cel_anfora_oro', 'suelto'], ['cel_candelabro_oro', 'suelto']],
    castigo: [['cel_altar_sed', 'roto'], ['sed_cuerpo_seco', undefined], ['cel_halo_roto', 'clavado']],
    tinta: [16, 4, 3], haz: null, motas: 'brasa',
  },
};
