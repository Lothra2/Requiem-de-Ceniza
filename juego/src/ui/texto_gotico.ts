// La letra gótica de pixel (letra_gotica.ts) puesta como texto: elige la talla y los puntos del aparato por punto de la
// letra que dan la altura de versal más cercana a la que pide el tamaño (la grande de 11 puntos, o la menuda de 7 para lo
// chico), la achica si no entra en `max` (un punto menos, después la menuda, y al final corta con un punto) y la pega a
// puntos enteros del aparato en el tono que se pida, con el encendido de brasa encima si se pide. Devuelve el ancho en
// puntos lógicos. Lo usan los menús (la portada, Opciones, la vigilia) y los botones con `gotico` (ui/comun.ts).
import { ctx } from '../nucleo/lienzo';
import { pegarPixel } from './fuego_pixel';
import { lienzoGotico, anchoGotico, type TonoGotico, type TallaGotica } from './letra_gotica';

/** ¿Va la letra gótica? (`__letraVieja` vuelve a la letra de antes en todos los menús). */
export const gotica = () => !(window as any).__letraVieja;

export interface OpcGotico {
  alin?: CanvasTextAlign; tono?: TonoGotico; max?: number; talla?: TallaGotica;
  /** `y` es el medio de la versal (no la base): para centrar en un botón o un renglón. */
  medio?: boolean;
  /** 0 a 1: cuánto del encendido de brasa va encima (el renglón o el botón con el puntero). */
  encendido?: number;
  /** 0 a 1: el resplandor de brasa detrás (los títulos). */
  brillo?: number;
}
const ALTO = { grande: 11, menuda: 7 } as const;
/** Talla y puntos por punto cuya versal queda más cerca de la de `tam` (unos 0,72 de `tam` lógicos); la grande gana si empatan. */
function elegir(tam: number, res: number, talla?: TallaGotica): { talla: TallaGotica; kp: number } {
  const meta = tam * 0.72 * res;
  if (talla) return { talla, kp: Math.max(1, Math.round(meta / ALTO[talla])) };
  let mejor = { talla: 'grande' as TallaGotica, kp: 1 }, nota = 1e9;
  for (const t of ['grande', 'menuda'] as const) for (let kp = 1; kp <= 8; kp++) {
    const v = Math.abs(ALTO[t] * kp - meta) / meta - (t === 'grande' ? 0.12 : 0);
    if (v < nota) { nota = v; mejor = { talla: t, kp }; }
  }
  return mejor;
}
/** Cómo queda un texto (talla, puntos del aparato por punto de la letra, el texto que entra, su ancho y su versal en puntos lógicos) sin dibujarlo. */
export function medirGotico(s: string, tam: number, o: OpcGotico = {}): { talla: TallaGotica; kp: number; s: string; w: number; alto: number } {
  const res = ctx.getTransform().a || 1;
  let { talla, kp } = elegir(tam, res, o.talla), S = s;
  const ancho = () => (anchoGotico(S, talla) * kp) / res;
  if (o.max) {
    while (ancho() > o.max && kp > 1) kp--;
    if (ancho() > o.max && talla === 'grande' && !o.talla) { const k11 = kp; talla = 'menuda'; kp = Math.max(1, Math.round((k11 * 11) / 7)); while (ancho() > o.max && kp > 1) kp--; }
    if (ancho() > o.max) { while (S.length > 2 && ancho() > o.max) S = S.slice(0, -2) + '.'; }
  }
  return { talla, kp, s: S, w: ancho(), alto: (ALTO[talla] * kp) / res };
}
export function textoGotico(s: string, x: number, y: number, tam: number, o: OpcGotico = {}): number {
  if (!s) return 0;
  const m = medirGotico(s, tam, o), res = ctx.getTransform().a || 1, cel = m.kp / res;
  const base = lienzoGotico(m.s, o.tono ?? 'hueso', m.talla), r = base.r;
  const x0 = o.alin === 'center' ? x - m.w / 2 : o.alin === 'right' || o.alin === 'end' ? x - m.w : x;
  const yb = o.medio ? y + m.alto / 2 : y;
  const ox = x0 - 2 * cel, oy = yb - (r.base + 1) * cel, a0 = ctx.globalAlpha;
  if (o.brillo && o.brillo > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, `rgba(255,130,40,${0.3 * o.brillo})`); g.addColorStop(1, 'rgba(255,100,30,0)');
    ctx.translate(x0 + m.w / 2, yb - m.alto / 2); ctx.scale(m.w * 0.62 + 12, m.alto * 1.4); ctx.fillStyle = g; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  const enc = o.encendido ?? 0;
  if (enc < 0.99) pegarPixel(base.c, ox, oy, m.kp, a0);
  if (enc > 0.01) pegarPixel(lienzoGotico(m.s, 'brasa', m.talla).c, ox, oy, m.kp, a0 * enc);
  return m.w;
}
