// La losa de púas que avisa (entrega 6 de mundos). En la entrega 5 era una cruz de 5 puntos cada 2,6 s sobre una de las 16
// puntas: se veía si se miraba la losa, nunca de reojo en la pelea. Ahora, sin volverse un cartel:
//  - el canto de la losa se lee siempre, apenas: un rombo de acero frío a puntos enteros que respira;
//  - las 16 puntas brillan en sus agujeros (un punto de luz y otro más tenue debajo, la punta y su caña);
//  - cada 2,4 s un barrido de luz cruza la losa en diagonal: las puntas se encienden de a una con un destello de 3 puntos de
//    alto, y la del medio del barrido suelta una estrella de 9 x 7 (núcleo blanco, cruz fría, puntos en diagonal);
//  - ese barrido trae su luz (`luzPuas`, la lee luces.ts): en la cripta más oscura la losa se ve venir.
// Cada losa va a su ritmo. `__puasViejas` vuelve al destello de antes y `__puasMudas` lo apaga todo.
const PERIODO = 2.4, BARRE = 0.34;
/** Dónde va el barrido de una losa: f es la fase del ciclo (0 a 1) y `a` cuánto brilla ahora (0 fuera del barrido). */
export function cicloPuas(t: number, sem: number): { f: number; a: number } {
  const c = (t + (sem % 97) * 0.173) / PERIODO, f = c - Math.floor(c);
  return { f, a: f < BARRE ? Math.sin((f / BARRE) * Math.PI) : 0 };
}
/** La luz fría del barrido (y la de siempre, muy baja), para luces.ts. */
export function luzPuas(t: number, sem: number): { k: number; r: number } {
  const { a } = cicloPuas(t, sem);
  return { k: 0.1 + 0.42 * a, r: 34 + 26 * a };
}
const punta = (i: number, k: number): [number, number] => { const u = -5.1 + i * 3.4, v = -5.1 + k * 3.4; return [Math.round((u - v) * 1.1), Math.round((u + v) * 0.55) - 1]; };
export function brilloPuas(c: CanvasRenderingContext2D, px: number, py: number, t: number, sem: number) {
  const X = Math.round(px), Y = Math.round(py), op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  const resp = 0.5 + 0.5 * Math.sin(t * 1.7 + sem), { f, a } = cicloPuas(t, sem);
  // el canto: un rombo de 2 a 1 alrededor de las puntas (la losa mide una celda: 32 x 16, el rombo va un punto adentro)
  c.fillStyle = `rgba(120,140,170,${0.07 + 0.05 * resp + 0.12 * a})`;
  for (let s = 0; s < 14; s++) { const dx = s, dy = (s + 1) >> 1; c.fillRect(X - 14 + dx, Y - dy, 1, 1); c.fillRect(X + 14 - dx, Y - dy, 1, 1); c.fillRect(X - 14 + dx, Y + dy, 1, 1); c.fillRect(X + 14 - dx, Y + dy, 1, 1); }
  c.fillRect(X, Y - 7, 1, 1); c.fillRect(X, Y + 7, 1, 1);
  // con el barrido toda la losa toma un velo frío un instante: es lo que se ve de reojo (la estrella sola era muy chica)
  if (a > 0.05) { c.fillStyle = `rgba(110,140,190,${0.13 * a})`; for (let dy = -6; dy <= 6; dy++) { const w = 13 - Math.abs(dy) * 2; c.fillRect(X - w, Y + dy, 2 * w + 1, 1); } }
  // las puntas en sus agujeros: punta y caña
  const pos = (f / BARRE) * 8 - 1; // el barrido va de la punta de atrás (i + k = 0) a la de adelante (6)
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
    const [dx, dy] = punta(i, k), sx = X + dx, sy = Y + dy, cerca = a > 0 ? Math.max(0, 1 - Math.abs(i + k - pos)) : 0;
    c.fillStyle = `rgba(170,190,215,${0.2 + 0.12 * resp + 0.6 * cerca})`; c.fillRect(sx, sy, 1, 1);
    c.fillStyle = `rgba(120,140,165,${0.1 + 0.06 * resp + 0.3 * cerca})`; c.fillRect(sx, sy + 1, 1, 1);
    if (cerca > 0.15) { c.fillStyle = `rgba(215,230,255,${0.75 * cerca})`; c.fillRect(sx, sy - 2, 1, 2); }
  }
  // la estrella en la punta del medio del barrido, en lo más alto del brillo
  if (a > 0.35) {
    const n = Math.floor(t / PERIODO + sem) % 4, [dx, dy] = punta(n === 0 ? 1 : n === 1 ? 2 : n === 2 ? 1 : 2, n < 2 ? 2 : 1), sx = X + dx, sy = Y + dy - 2, e = (a - 0.35) / 0.65;
    c.fillStyle = `rgba(150,180,230,${0.5 * e})`; c.fillRect(sx - 4, sy, 9, 1); c.fillRect(sx, sy - 3, 1, 7);
    c.fillStyle = `rgba(200,220,255,${0.7 * e})`; c.fillRect(sx - 2, sy, 5, 1); c.fillRect(sx, sy - 2, 1, 5);
    c.fillStyle = `rgba(170,200,240,${0.35 * e})`; c.fillRect(sx - 2, sy - 2, 1, 1); c.fillRect(sx + 2, sy - 2, 1, 1); c.fillRect(sx - 2, sy + 2, 1, 1); c.fillRect(sx + 2, sy + 2, 1, 1);
    c.fillStyle = `rgba(255,255,255,${0.95 * e})`; c.fillRect(sx, sy, 1, 1);
  }
  c.globalCompositeOperation = op;
}
