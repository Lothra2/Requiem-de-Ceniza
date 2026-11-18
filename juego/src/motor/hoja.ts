// Dónde está la hoja del arma en cada cuadro (en pixeles relativos al ancla del sprite): de la mano a la punta.
// Sirve para que las armas vivas ardan, congelen o chispeen justo sobre la hoja.
const LARGO: Record<string, [number, number]> = {
  espada: [3, 25], cimitarra: [3, 23], mandoble: [4, 36], hacha: [8, 22], hacha_doble: [10, 32], maza: [9, 22], martillo: [14, 32], mangual: [6, 20],
  lanza: [20, 48], alabarda: [24, 46], guadana: [24, 42], baculo: [16, 34], cetro: [10, 22], varita: [4, 13], daga: [2, 11], garras: [1, 7],
  arco: [-8, 10], ballesta: [2, 14], puno: [0, 2], nada: [0, 1],
};
type V3 = [number, number, number];
/** Hacia dónde mira la cámara (igual que VISTA en render.ts, sin importarlo para no arrastrar el motor al hilo principal). */
const KZ = Math.sqrt(1.5), VL = Math.hypot(1, 1, 1 / KZ), VISTA: V3 = [-1 / VL, -1 / VL, -1 / KZ / VL];
/** En cuántos tramos se parte la hoja para saber qué parte queda detrás del cuerpo. */
export const TRAMOS_HOJA = 6;
/**
 * De la mano a la punta en pantalla (para el arco del golpe) y, si se pasa `filo` (filoDe del motor), el tramo vivo del arma
 * tal como lo arma el motor (la hoja, la cabeza del hacha o la maza, el remate del báculo, la gema de la varita) con la
 * máscara de qué parte se ve: [x0, y0, x1, y1, máscara, vx0, vy0, vx1, vy1].
 */
export function hojaDe(esqueleto: any, aPantalla: (p: V3) => [number, number], cuerpo: any, equipo: any, dir: string, acc: string, f: number, filo?: (e: any, tipo: string, b: any) => [V3, V3]): number[] {
  const tipo = equipo.arma?.tipo ?? 'nada';
  const e = esqueleto(cuerpo, dir, acc, f, tipo, equipo.izq?.tipo);
  const b = e.brazos[0];
  const [l0, l1] = LARGO[tipo] ?? [2, 20];
  const S = e.S;
  const p0: V3 = [b.mano[0] + b.eje[0] * l0 * S, b.mano[1] + b.eje[1] * l0 * S, b.mano[2] + b.eje[2] * l0 * S];
  const p1: V3 = [b.mano[0] + b.eje[0] * l1 * S, b.mano[1] + b.eje[1] * l1 * S, b.mano[2] + b.eje[2] * l1 * S];
  const a = aPantalla(p0), c = aPantalla(p1);
  // el tramo vivo: el del motor si se tiene, si no la hoja entera
  let v0 = p0, v1 = p1;
  if (filo) { try { [v0, v1] = filo(e, tipo, b); } catch { /* la hoja entera */ } }
  // qué tramos se ven: uno queda tapado si cae dentro de la columna del cuerpo en pantalla y no está delante del pecho
  // (la máscara es de bits, el bit i = el tramo i desde la mano se ve). Así lo vivo del arma no se pinta encima del héroe
  // cuando le pasa por detrás (de espaldas, o en el vuelo del golpe)
  const c0: V3 = [0, 0, (e.zc ?? 31 * S) + 8 * S], piso = aPantalla([0, 0, 0]), alto = aPantalla([0, 0, (e.cz ?? 60 * S) + 7 * S]);
  let ve = 0;
  for (let i = 0; i < TRAMOS_HOJA; i++) {
    const u = (i + 0.5) / TRAMOS_HOJA, p: V3 = [v0[0] + (v1[0] - v0[0]) * u, v0[1] + (v1[1] - v0[1]) * u, v0[2] + (v1[2] - v0[2]) * u];
    const fondo = (p[0] - c0[0]) * VISTA[0] + (p[1] - c0[1]) * VISTA[1] + (p[2] - c0[2]) * VISTA[2], sp = aPantalla(p);
    const enColumna = Math.abs(sp[0] - piso[0]) < 7.5 * S && sp[1] > alto[1] && sp[1] < piso[1] + 2;
    if (!enColumna || fondo < -3 * S) ve |= 1 << i;
  }
  const out = [Math.round(a[0]), Math.round(a[1]), Math.round(c[0]), Math.round(c[1])];
  if (!filo) return out;
  const va = aPantalla(v0), vb = aPantalla(v1);
  return [...out, ve, Math.round(va[0]), Math.round(va[1]), Math.round(vb[0]), Math.round(vb[1])];
}
