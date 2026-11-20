// Las formas del druida (Piel de lobo y Piel de oso): mientras dura la forma el héroe ES la bestia. Se pinta con sus
// propios cuadros horneados (`lobo_druida` y `oso_pardo` de catalogo/bestias.ts: quieto, caminar, correr, atacar, herido,
// morir y 'especial', el aullido o el rugido, que va al lanzar), en 16 rumbos al andar como los monstruos, y el cambio
// no es un salto: el cuerpo de antes se encoge y se enciende de verde, en el medio del cambio pasa al otro y este crece
// con un rebote mientras la luz se apaga (DUR_CAMBIO). El estallido de pelo, hojas y motas lo suelta presencias.ts.
// Todo es solo lo que se ve: las estadísticas, el tamaño de choque y la velocidad son los de siempre (mundo.ts) y nada de
// esto se guarda. `__sinFormas` vuelve al druida teñido de antes.
import type { Juego } from '../juego/mundo';
import { cuadrosMonstruo, type Cuadro } from '../motor/assets';
import ZANCADA_MONSTRUO from '../../../src/engine/gotico/datos/zancada_monstruos.json';
import ZANCADA_CORRER from '../../../src/engine/gotico/datos/zancada_correr_monstruos.json';

export type Forma = 'lobo' | 'oso';
export const SPRITE_FORMA: Record<Forma, string> = { lobo: 'lobo_druida', oso: 'oso_pardo' };
/** A qué tamaño se pinta cada forma (los cuadros ya vienen horneados a la medida del héroe: a escala entera, sin grano). */
export const ESC_FORMA: Record<Forma, number> = { lobo: 1, oso: 1 };
export const DUR_CAMBIO = 0.5;
/** El instante del cambio de cuerpo dentro de DUR_CAMBIO (antes, el de antes encogido; después, el nuevo creciendo). */
const MEDIO = 0.42;
export const formasVivas = () => !(window as any).__sinFormas;
export const formaDe = (j: Juego): Forma | null => (j.heroe.buffs.forma_oso ? 'oso' : j.heroe.buffs.forma_lobo ? 'lobo' : null);
/** La acción del héroe en la bestia: lanzar es el aullido o el rugido. */
export const accForma = (acc: string) => (acc === 'lanzar' ? 'especial' : acc);

let actual: Forma | null = null, previa: Forma | null = null, t0 = -99, avisado = -99;
const oyentes: ((de: Forma | null, a: Forma | null) => void)[] = [];
/** Avisa cada cambio de forma (presencias.ts suelta el estallido). */
export function alCambiarForma(f: (de: Forma | null, a: Forma | null) => void) { oyentes.push(f); }
((window as any).__limpiadores ??= []).push(() => { previa = actual; t0 = -99; });

export interface VistaForma {
  /** El cuerpo que se ve en este cuadro (null: el druida). */
  cuerpo: Forma | null;
  /** 0 a 1 mientras cambia, 1 quieto. */
  u: number;
  /** Escala extra del cuerpo (encoge el de antes, crece con rebote el nuevo). */
  k: number;
  /** Cuánto se tiñe de verde la silueta (0 a 0,9) y el brillo sumado encima. */
  tinte: number; brillo: number;
}
/** El estado de la forma en este cuadro; cuenta el cambio con el reloj del juego. */
export function vistaForma(j: Juego, t: number): VistaForma {
  const f = formasVivas() ? formaDe(j) : null;
  if (f !== actual) { previa = actual; actual = f; t0 = t; if (avisado !== t) { avisado = t; for (const o of oyentes) o(previa, actual); } }
  const u = Math.max(0, Math.min(1, (t - t0) / DUR_CAMBIO));
  if (u >= 1) return { cuerpo: actual, u: 1, k: 1, tinte: 0, brillo: 0 };
  if (u < MEDIO) { const a = u / MEDIO, s = a * a * (3 - 2 * a); return { cuerpo: previa, u, k: 1 - 0.14 * s, tinte: 0.74 * s, brillo: 0.4 * s }; }
  const b = (u - MEDIO) / (1 - MEDIO), crece = 0.84 + 0.16 * b + 0.09 * Math.sin(b * Math.PI) * (1 - b);
  return { cuerpo: actual, u, k: crece, tinte: 0.74 * (1 - b) ** 1.6, brillo: 0.45 * (1 - b) ** 2 };
}
export const enCambio = () => actual !== previa && t0 > -99;

/** Los cuadros de la bestia para una acción y un rumbo, con el rumbo real en 16 al andar (como los monstruos). */
export function cuadrosForma(f: Forma, acc: string, dir: string, rumbo?: number): Cuadro[] {
  const sp = SPRITE_FORMA[f];
  let fs = cuadrosMonstruo(sp, acc, dir);
  if (!fs.length && acc === 'especial') fs = cuadrosMonstruo(sp, 'atacar', dir);
  if (!fs.length && acc === 'correr') fs = cuadrosMonstruo(sp, 'caminar', dir);
  if (!fs.length) fs = cuadrosMonstruo(sp, 'quieto', dir);
  if ((acc === 'caminar' || acc === 'correr') && rumbo !== undefined && !(window as any).__sinFino) {
    const g = ((rumbo * 180) / Math.PI + 360) % 360, k = Math.round(g / 22.5) % 16, D8 = ['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'];
    if (Math.abs(((k * 22.5 - D8.indexOf(dir) * 45 + 540) % 360) - 180) <= 34) { const ff = cuadrosMonstruo(sp, acc, k % 2 ? 'r' + k * 22.5 : D8[k / 2]); if (ff.length) fs = ff; }
  }
  return fs;
}
/** Casillas por ciclo de pasos de la bestia (para que las patas no patinen al ritmo del héroe). */
export function zancadaForma(f: Forma, acc: string): number {
  const sp = SPRITE_FORMA[f], z = (ZANCADA_MONSTRUO as Record<string, number>)[sp] ?? 1.5;
  return (acc === 'correr' ? (ZANCADA_CORRER as Record<string, number>)[sp] ?? z * 1.46 : z) * ESC_FORMA[f];
}
/** Lo que el druida transformado muerde o desgarra (el golpe sin poder también es de la bestia, no del arma). */
export const bocaForma: Record<Forma, { alto: number; frente: number }> = { lobo: { alto: 16, frente: 18 }, oso: { alto: 26, frente: 20 } };
