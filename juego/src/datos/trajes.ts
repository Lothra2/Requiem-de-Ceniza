// Trajes: el aspecto de cada armadura que cae (línea, color, metal, ribete, tabardo y corte), para que no salgan
// todas iguales. Sale del objeto mismo (su número, su base, su nivel y su rareza), así que no se guarda nada nuevo:
// una pieza vieja de la partida también lo tiene y se ve igual cada vez. Lo usa `aLoot` (ui/loot.ts) y de ahí lo
// leen el ícono (`iconoDeLoot`) y el cuerpo (`equipoDeInventario`): lo que se ve puesto es lo del ícono.
// Las reliquias, los conjuntos, las bases míticas y las líneas épicas traen su aspecto propio y no pasan por aquí.
import type { Base } from '../juego/tipos_objetos';

/** Metal por nombre (o un color #rrggbb teñido): el ícono y el cuerpo lo traducen igual. */
export type MetalTraje = 'acero' | 'hierro' | 'negro' | 'bronce' | 'oro' | 'plata' | 'laton' | `#${string}`;
export type LineaTraje = 'tela' | 'cuero' | 'tachonado' | 'malla' | 'placas' | 'hueso';
export interface Traje {
  linea: LineaTraje;
  /** color de la tela o del cuero */
  color?: string;
  /** metal de la placa, la cota o las tachas */
  metal?: MetalTraje;
  /** ribete: un metal por nombre o un color de tela */
  ribete?: string;
  /** sobreveste o tabardo sobre la cota o la coraza */
  tabardo?: string;
  /** corte: tunica, habito, vestido, camisa (tela); jubon o pieles (cuero); puas o pieles (placas). En los cascos, la
   * forma (`FormaCasco` de iconos3d.ts): capucha, turbante, gorro, cofia, nasal, abierto, celada, bacinete, gran_yelmo,
   * astado, mascara, calavera o ciervo */
  corte?: string;
  /** pelaje de las pieles: pardo o gris */
  pelo?: 'pardo' | 'gris';
}

/** Las siete tierras del juego, por el nivel del objeto (el nivel del monstruo que lo soltó). */
interface Tierra { tela: string[]; cuero: string[]; metal: MetalTraje[]; malla: MetalTraje[]; tabardo: string[]; pelo: 'pardo' | 'gris' }
const TIERRAS: Tierra[] = [
  // 1: el páramo de Velmora, la abadía y las catacumbas: lana parda, musgo, sangre de buey, pizarra, morado de abadía
  { tela: ['#5a4a36', '#4a5240', '#6a2a26', '#3e4450', '#6a6352', '#4a2f62', '#2e3a2e'], cuero: ['#6b452e', '#3d3530', '#5e3a24', '#4a3a2a', '#5a2e24'],
    metal: ['hierro', 'acero', 'negro', 'acero'], malla: ['acero', 'hierro', 'negro'], tabardo: ['#7a1f22', '#2f4f7a', '#3a5a2e', '#5a4a2a', '#d0c8b4', '#4a2f62'], pelo: 'pardo' },
  // 2: el desierto y las tumbas: arena, lino blanqueado, terracota, índigo, turquesa gastada
  { tela: ['#a08458', '#c4b89a', '#8a4a2a', '#2e3e6a', '#2f6a66', '#6a3a1e', '#7a6a4a'], cuero: ['#8a6a44', '#7a4a2a', '#a08060', '#5a3a22', '#3a2e26'],
    metal: ['bronce', 'laton', 'acero', 'bronce'], malla: ['bronce', 'acero', 'laton'], tabardo: ['#c4b89a', '#2e3e6a', '#8a3a1e', '#2f6a66', '#b08a3a'], pelo: 'pardo' },
  // 3: la selva y el templo: jade, oliva, ocre, vino, verde azulado
  { tela: ['#2e5a3a', '#4a5228', '#8a6a2a', '#5a2a36', '#1e4a4a', '#6a4a2a'], cuero: ['#4a3a22', '#5a4a2a', '#3a4a2a', '#6a3a22', '#2e2a20'],
    metal: ['bronce', '#4a6a4a', 'acero', 'laton'], malla: ['bronce', 'acero', '#4a6a4a'], tabardo: ['#2e5a3a', '#8a5a1e', '#5a2a36', '#1e4a4a', '#a08040'], pelo: 'pardo' },
  // 4: la nieve y el hielo: lana blanca, azul pizarra, gris, azul noche, rojo de estandarte
  { tela: ['#b8bcc0', '#4a5a6e', '#6a7078', '#2a3446', '#7a2a2a', '#5a6a7a'], cuero: ['#a89a84', '#5a4e44', '#3a3a3e', '#6b5a4a', '#2a2a30'],
    metal: ['plata', 'acero', '#4a6a9a', 'acero'], malla: ['acero', 'plata', '#4a6a9a'], tabardo: ['#2a3446', '#d0d0d4', '#7a1f22', '#4a5a6e', '#3a5a8a'], pelo: 'gris' },
  // 5: los infiernos y el abismo: sangre, carbón, brasa, negro
  { tela: ['#6a1616', '#2a1a1a', '#7a3a1a', '#1e1a1e', '#4a2026', '#3a2a2a'], cuero: ['#3a1e1a', '#241a18', '#5a2a1e', '#2e2420', '#4a1a16'],
    metal: ['negro', '#7a3022', 'laton', 'negro'], malla: ['negro', 'hierro', 'laton'], tabardo: ['#6a1616', '#1e1a1e', '#8a4a1a', '#3a2a2a'], pelo: 'pardo' },
  // 6: Ysmeral ahogada: mar, alga, salitre, verdín
  { tela: ['#2a5c62', '#3a5a4a', '#5a6a7a', '#1e3a4a', '#4a4a3a', '#6a7a6a'], cuero: ['#2e3a34', '#4a4436', '#3a3a30', '#2a3438', '#5a5040'],
    metal: ['bronce', '#3a6a62', 'plata', 'acero'], malla: ['bronce', 'acero', '#3a6a62'], tabardo: ['#2a5c62', '#c4bca4', '#1e3a4a', '#4a6a4a'], pelo: 'gris' },
  // 7: lo celeste: marfil, cielo, oro viejo, lavanda gris, azul real
  { tela: ['#d0c8b4', '#3a5a9a', '#8a7040', '#9a94a8', '#2a3a6a', '#e0dccc'], cuero: ['#a0886a', '#6a5a4a', '#c4b49a', '#4a3e34', '#8a7a64'],
    metal: ['plata', 'oro', 'acero', 'laton'], malla: ['plata', 'oro', 'acero'], tabardo: ['#e0dccc', '#2a3a6a', '#8a7040', '#3a5a9a', '#7a1f22'], pelo: 'gris' },
];
/** Nivel donde empieza cada tierra (actos 1 a 7). Más arriba (Pesadilla e Infierno) la tierra sale del número del objeto. */
const DESDE = [1, 14, 22, 30, 36, 45, 54];

// ------------------------------------------------------------------ de la base a su línea y sus colores propios
const TELA_HEX: Record<string, string> = {
  cu_tela_azul: '#2f4f9a', cu_tela_roja: '#7a2626', cu_tela_verde: '#2f6a34', cu_tela_morada: '#4a2f62', cu_tela_negra: '#1e1c22',
  cu_tela_blanca: '#c8c2b4', cu_tela_parda: '#5a4a36', cu_venda: '#8a7e62', cuerda: '#6a5a40',
};
const CUERO_HEX: Record<string, string> = { cu_cuero: '#6b452e', cu_cuero_negro: '#302925', cu_escama: '#38422b', cu_pelaje: '#5a4630', cu_pelaje_gris: '#5a5854' };
const METAL_MAT: Record<string, MetalTraje> = {
  cu_placa: 'acero', acero: 'acero', cu_malla: 'acero', hierro: 'hierro', hierro_oxido: 'hierro', cu_placa_oscura: 'negro', negro: 'negro',
  cu_oro: 'oro', oro: 'oro', bronce: 'bronce', cu_bronce: 'bronce', cu_laton_viejo: 'laton', cu_plata_vieja: 'plata',
};
interface Propio { linea: LineaTraje; color?: string; metal?: MetalTraje; corte?: string; tabardo?: string; /** las formas que puede tener un casco de esta base */ formas?: string[] }
/** La línea y los colores que la base dice en su dibujo (`visual`). */
export function propioDe(b: Base): Propio | null {
  const v = b.visual as any;
  switch (b.ranura) {
    case 'torso': {
      const t = v.torso; if (!t) return null;
      const tab = v.tabardo?.mat ? TELA_HEX[v.tabardo.mat] : undefined;
      if (/camisa|tunica|vestido|sin_mangas|harapos/.test(t.tipo)) return { linea: 'tela', color: TELA_HEX[t.mat], corte: t.tipo === 'vestido' ? 'vestido' : t.tipo === 'camisa' ? 'camisa' : v.piernas?.tipo === 'tunica_larga' ? 'habito' : 'tunica' };
      if (t.tipo === 'cuero') return { linea: 'cuero', color: CUERO_HEX[t.mat] };
      if (t.tipo === 'cuero_tachonado') return { linea: 'tachonado', color: CUERO_HEX[t.mat] ?? '#302925', metal: METAL_MAT[t.mat2] };
      if (t.tipo === 'malla') return { linea: 'malla', metal: METAL_MAT[t.mat] ?? 'acero', tabardo: tab };
      if (t.tipo === 'placas') return t.mat === 'cu_hueso' ? { linea: 'hueso' } : { linea: 'placas', metal: METAL_MAT[t.mat] ?? 'acero', tabardo: tab, corte: v.hombros?.tipo === 'puas' ? 'puas' : undefined };
      return null;
    }
    case 'cabeza': {
      const c = v.cabeza; if (!c) return null;
      if (c.tipo === 'capucha' || c.tipo === 'turbante') return { linea: 'tela', color: TELA_HEX[c.mat], formas: [c.tipo] };
      if (c.tipo === 'gorro') return { linea: 'cuero', color: CUERO_HEX[c.mat], formas: ['gorro'] };
      if (c.tipo === 'calavera' || c.tipo === 'cuernos') return { linea: 'hueso', formas: [c.tipo === 'cuernos' ? 'ciervo' : 'calavera'] };
      if (c.tipo === 'casco') return { linea: 'malla', metal: METAL_MAT[c.mat] ?? 'hierro', formas: ['nasal', 'cofia', 'abierto'] };
      if (c.tipo === 'yelmo') return { linea: 'placas', metal: METAL_MAT[c.mat] ?? 'acero', formas: ['celada', 'bacinete'] };
      if (c.tipo === 'gran_yelmo') return { linea: 'placas', metal: METAL_MAT[c.mat] ?? 'acero', formas: ['gran_yelmo', 'gran_yelmo', 'astado'] };
      if (c.tipo === 'mascara') return { linea: 'placas', metal: 'laton', formas: ['mascara'] };
      return null; // coronas, diademas y aros: su dibujo propio
    }
    case 'manos': {
      const m = v.manos; if (!m) return null;
      if (m.tipo === 'vendas') return { linea: 'tela', color: TELA_HEX[m.mat] ?? '#8a7e62' };
      if (m.mat === 'cu_hueso') return { linea: 'hueso' };
      if (m.tipo === 'guanteletes' || m.tipo === 'brazales') return { linea: m.mat === 'cu_malla' ? 'malla' : 'placas', metal: METAL_MAT[m.mat] ?? 'acero' };
      return { linea: 'cuero', color: CUERO_HEX[m.mat] };
    }
    case 'pies': {
      const p = v.pies; if (!p) return null;
      if (p.tipo === 'sabatones') return { linea: p.mat === 'cu_malla' ? 'malla' : 'placas', metal: METAL_MAT[p.mat] ?? 'acero' };
      return { linea: p.tipo === 'botas_altas' ? 'tachonado' : 'cuero', color: CUERO_HEX[p.mat] };
    }
    case 'cinturon': {
      const c = v.cinturon; if (!c) return null;
      if (/tela/.test(c.mat)) return { linea: 'tela', color: TELA_HEX[c.mat] };
      if (c.mat === 'cu_malla') return { linea: 'malla', metal: METAL_MAT[c.hebilla] ?? 'acero' };
      if (/placa/.test(c.mat)) return { linea: 'placas', metal: METAL_MAT[c.mat] ?? 'negro' };
      return { linea: 'cuero', color: CUERO_HEX[c.mat] };
    }
  }
  return null;
}

// ------------------------------------------------------------------ el azar propio de cada pieza
function mezclar(n: number): number { let x = (n ^ 0x9e3779b9) >>> 0; x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0; x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0; return (x ^ (x >>> 16)) >>> 0; }
const hashTexto = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
/** Un dado que siempre tira lo mismo para la misma pieza. */
function dado(semilla: number) { let s = mezclar(semilla); return () => { s = mezclar(s + 0x6d2b79f5); return s / 4294967296; }; }
const de = <T,>(r: () => number, xs: readonly T[]): T => xs[Math.floor(r() * xs.length) % xs.length];
const pesos = <T extends string>(r: () => number, xs: [T, number][]): T => { let s = 0; for (const [, p] of xs) s += p; let k = r() * s; for (const [x, p] of xs) { k -= p; if (k <= 0) return x; } return xs[xs.length - 1][0]; };

/** Oscurece y apaga un color (lo gastado). */
function gastar(h: string): string {
  const n = parseInt(h.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255], g = (c[0] + c[1] + c[2]) / 3;
  return '#' + c.map((v) => Math.round((v * 0.45 + g * 0.55) * 0.82).toString(16).padStart(2, '0')).join('');
}
const claro = (h: string) => { const n = parseInt(h.slice(1), 16); return ((n >> 16) & 255) + ((n >> 8) & 255) + (n & 255) > 420; };

/** El traje de una pieza: sale de su número (`uid`), su base, su nivel y su rareza. null: la pieza no lleva traje. */
export function trajeDe(o: { uid: number; nivel: number; rareza: string }, b: Base): Traje | null {
  const p = propioDe(b); if (!p) return null;
  const r = dado(mezclar(o.uid) ^ hashTexto(b.id));
  let ti = DESDE.length - 1; for (let i = 0; i < DESDE.length; i++) if (o.nivel >= DESDE[i]) ti = i;
  // en Pesadilla e Infierno (más allá del acto 7) cualquier tierra
  if (o.nivel > 64) ti = Math.floor(r() * TIERRAS.length);
  const T = TIERRAS[ti];
  const rar = o.rareza, rica = rar === 'raro' || rar === 'unico' || rar === 'legendario' || rar === 'conjunto', magica = rar === 'magico';
  const tj: Traje = { linea: p.linea };
  // la base manda en una parte de las piezas (una coraza de obsidiana es negra): el resto viste los colores de su tierra
  const propia = r() < 0.32;
  switch (p.linea) {
    case 'tela': tj.color = propia && p.color ? p.color : de(r, T.tela); break;
    case 'cuero': case 'tachonado': tj.color = propia && p.color ? p.color : de(r, T.cuero); if (p.linea === 'tachonado') tj.metal = rica ? de(r, ['oro', 'plata', 'laton'] as MetalTraje[]) : de(r, ['acero', 'hierro', 'bronce', 'laton'] as MetalTraje[]); break;
    case 'malla': tj.metal = propia || r() < 0.3 ? p.metal ?? 'acero' : de(r, T.malla); break;
    case 'placas': tj.metal = propia || r() < 0.25 ? p.metal ?? 'acero' : de(r, T.metal); break;
    case 'hueso': tj.color = de(r, T.cuero); break;
  }
  // el oro entero queda para las piezas raras y mejores: lo común y lo mágico de oro sale de latón viejo
  if (tj.metal === 'oro' && !rica && p.linea !== 'tachonado') tj.metal = 'laton';
  // el ribete dice la rareza sin pintar todo de un color: hierro o nada en lo común, bronce o acero en lo mágico,
  // oro o plata en lo raro y mejor
  const metalRibete: string | undefined = rica ? (r() < 0.62 ? 'oro' : 'plata') : magica ? de(r, ['bronce', 'acero', 'laton']) : undefined;
  if (p.linea === 'tela') {
    tj.corte = r() < 0.45 && p.corte ? p.corte : pesos(r, [['tunica', 4], ['habito', 3], ['camisa', b.escalon === 0 ? 2 : 1], ['vestido', b.escalon >= 1 ? 2 : 1]]);
    // la tela siempre lleva su ribete: lo común, de un paño claro u oscuro del mismo color; lo demás, de metal
    tj.ribete = metalRibete ?? (claro(tj.color!) ? '#4a3a2a' : de(r, ['#b8a070', '#8a7a5a', '#c8c0a8']));
  } else if (p.linea === 'cuero' || p.linea === 'tachonado') {
    if (b.ranura === 'torso' && r() < (ti === 3 ? 0.65 : 0.3)) { tj.corte = 'pieles'; tj.pelo = r() < 0.5 ? T.pelo : de(r, ['pardo', 'gris'] as const); }
    if (metalRibete) tj.ribete = metalRibete;
  } else if (p.linea === 'malla' || p.linea === 'placas') {
    if (metalRibete && metalRibete !== tj.metal) tj.ribete = metalRibete;
    if (b.ranura === 'torso') {
      // sobreveste: la base la trae o sale con los colores de la tierra (más en las piezas buenas)
      if (p.tabardo && r() < 0.6) tj.tabardo = p.tabardo;
      else if (r() < (rica ? 0.55 : magica ? 0.4 : 0.28)) tj.tabardo = de(r, T.tabardo);
      if (p.linea === 'placas') {
        const c = r();
        tj.corte = p.corte === 'puas' && c < 0.5 ? 'puas' : c < 0.2 ? 'puas' : c < (ti === 3 ? 0.55 : 0.32) ? 'pieles' : undefined;
        if (tj.corte === 'pieles') tj.pelo = T.pelo;
        if (!tj.corte) delete tj.corte;
      } else if (r() < (ti === 3 ? 0.45 : 0.15)) { tj.corte = 'pieles'; tj.pelo = T.pelo; }
    }
  }
  // la forma del casco (con su propio dado: no mueve nada de lo de arriba)
  if (b.ranura === 'cabeza' && p.formas) tj.corte = de(dado(mezclar(o.uid) ^ hashTexto('forma|' + b.id)), p.formas);
  // lo gastado: el color apagado y sin ribete de metal
  if (rar === 'gris') { if (tj.color) tj.color = gastar(tj.color); if (tj.tabardo) tj.tabardo = gastar(tj.tabardo); if (tj.ribete && !tj.ribete.startsWith('#')) delete tj.ribete; }
  for (const k of Object.keys(tj) as (keyof Traje)[]) if (tj[k] === undefined) delete tj[k];
  return tj;
}
