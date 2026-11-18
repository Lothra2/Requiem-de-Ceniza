import { MATERIALES } from './materiales';
import * as superficie from './superficie';

/**
 * Los materiales teñidos del cuerpo (tela, cuero, metal y cota con el color exacto de un diseño) y los metales de los
 * trajes. Viven aparte para que los usen igual la traducción del inventario (apariencia.ts) y lo que se arma con el
 * modelo del ícono puesto en el cuerpo (los cascos de iconos3d.ts).
 */
const M = MATERIALES;
const hex = (h: string): [number, number, number] => { const s = h.replace('#', ''); const n = parseInt(s.length === 3 ? s.split('').map((c) => c + c).join('') : s, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const aHex = (c: number[]) => '#' + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');

/** Registra (una vez) un material teñido con el color exacto del diseño: tela, cuero, metal o cota de anillas. */
export function tinte(color: string, tipo: 'tela' | 'cuero' | 'metal' | 'malla' = 'tela'): string {
  const id = `cu_tinte_${tipo}_${color.replace('#', '').toLowerCase()}`;
  if (M[id]) return id;
  const c = hex(color), duro = tipo === 'metal' || tipo === 'malla', pasos = duro ? 8 : 7;
  // rampa de la sombra casi negra (teñida) al color y un poco más claro en las crestas
  const rampa = Array.from({ length: pasos }, (_, i) => { const t = i / (pasos - 1); const k = 0.1 + t * (duro ? 1.25 : 1.05); return aHex(c.map((v) => v * k + (duro ? t * t * 40 : 0))); });
  // con la superficie de su material (golpes del metal, grano del cuero, hilos de la tela, anillas) y pegada a la pieza,
  // como los materiales de siempre del cuerpo: sin esto lo teñido se veía liso y la textura se deslizaba al caminar
  M[id] = tipo === 'metal' ? { rampa, ruido: 0.04, escala: 0.6, brillo: 0.6, trama: 0.45, patron: superficie.metal, local: true }
    : tipo === 'malla' ? { rampa, ruido: 0.06, escala: 1.3, brillo: 0.25, patron: superficie.malla, local: true }
    : tipo === 'cuero' ? { rampa, ruido: 0.16, escala: 0.8, brillo: 0.08, patron: superficie.cuero, local: true } : { rampa, ruido: 0.12, escala: 1.2, patron: superficie.tela, local: true };
  return id;
}

/**
 * Los metales de las piezas que caen (trajes y cascos), con la saturación del ícono: el oro, el bronce y el acero del
 * cuerpo de siempre, bajo la luz del juego, salían más naranjas y vivos que en la casilla. Los de siempre (`cu_oro`,
 * `cu_bronce`, `cu_placa`) quedan para lo horneado (héroes de salida, monstruos, jefes).
 */
const METAL_PIEZA: Record<string, { rampa: string[]; brillo: number; trama: number }> = {
  cu_oro_pieza: { rampa: ['#191007', '#302110', '#4c361a', '#6b4e26', '#8a6834', '#a88344', '#c29f5a', '#d8bd7a', '#ebdcab'], brillo: 0.75, trama: 0.35 },
  cu_bronce_pieza: { rampa: ['#110a05', '#211409', '#352010', '#4b2f19', '#644022', '#7c532e', '#966a3c', '#af834c', '#c9a065', '#e0c390'], brillo: 0.65, trama: 0.6 },
  cu_placa_pieza: { rampa: ['#0b0b0d', '#16171a', '#222529', '#2f3338', '#3f444a', '#535960', '#6b7179', '#888e96', '#acb2b9', '#d6dadf'], brillo: 0.8, trama: 0.6 },
};
for (const [k, v] of Object.entries(METAL_PIEZA)) M[k] = { rampa: v.rampa, ruido: k === 'cu_placa_pieza' ? 0.015 : 0.04, escala: 0.6, brillo: v.brillo, trama: v.trama, patron: superficie.metal, local: true };

/** El color de cada metal de traje (los mismos del ícono: `HEX_METAL` en iconos3d.ts). */
export const HEX_METAL_CU: Record<string, string> = { acero: '#6d737a', hierro: '#575a60', negro: '#3b4048', bronce: '#91592f', oro: '#b8862a', plata: '#9aa2aa', laton: '#8a7a50' };
const METAL_CU: Record<string, string> = { acero: 'cu_placa_pieza', negro: 'cu_placa_oscura', bronce: 'cu_bronce_pieza', oro: 'cu_oro_pieza', plata: 'cu_plata_vieja', laton: 'cu_laton_viejo' };
/** La placa de un metal de traje. */
export function metalTraje(m: string): string { return METAL_CU[m] ?? tinte(m.startsWith('#') ? m : HEX_METAL_CU[m] ?? '#575a60', 'metal'); }
/** La cota de anillas de un metal de traje. */
export function mallaTraje(m: string): string { return m === 'acero' ? 'cu_malla' : tinte(m.startsWith('#') ? m : HEX_METAL_CU[m] ?? '#6d737a', 'malla'); }
