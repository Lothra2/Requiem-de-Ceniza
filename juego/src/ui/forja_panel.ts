// El panel forjado de PC sin el navegador: las tallas, la geometría en puntos de dibujo y el tallado del marco.
// Lo usa hud_forja.ts (en el juego) y t951_esculturas.mts (el laboratorio, sin servidor).
import { textoMicro, Lienzo, PALETA as P, type C3 } from '../../../src/engine/gotico/hud';
import { Taller, M, enOjiva, altoOjiva, bordeOjiva, gargola, doliente } from './forja_taller';

/** La tecla de cada atajo (5 a 9, 0 y F7 a F10). */
const teclaAtajo = (i: number) => (i < 5 ? `${i + 5}` : i === 5 ? '0' : `F${i + 1}`);
// ------------------------------------------------------------------ tallas
export interface Talla {
  hC: number; R: number; orbY: number; PED: number; CASA: number; POZO: number; RAP: number; CEN: number;
  hab: number; rap: number; rapG: number; poc: number; pocG: number; plW: number; plH: number; f: number; fs: number; cor: number;
  filaRec: number; altoRec: number; filaRap: number; filaTec: number; filaPl: number; bandeja: [number, number]; pocY: number; pipY: number; pip: number; tecPocY: number; arcoA: number;
}
const NORMAL: Talla = { hC: 88, R: 46, orbY: 80, PED: 56, CASA: 186, POZO: 64, RAP: 150, CEN: 186, hab: 46, rap: 26, rapG: 3, poc: 34, pocG: 5, plW: 26, plH: 18, f: 1, fs: 1, cor: 9, filaRec: 12, altoRec: 15, filaRap: 31, filaTec: 59, filaPl: 68, bandeja: [14, 77], pocY: 20, pipY: 58, pip: 4, tecPocY: 67, arcoA: 80 };
const COMPACTO: Talla = { hC: 78, R: 38, orbY: 66, PED: 44, CASA: 156, POZO: 54, RAP: 132, CEN: 164, hab: 40, rap: 22, rapG: 3, poc: 30, pocG: 4, plW: 24, plH: 16, f: 0.85, fs: 0.78, cor: 8, filaRec: 10, altoRec: 14, filaRap: 26, filaTec: 50, filaPl: 60, bandeja: [12, 69], pocY: 16, pipY: 50, pip: 3, tecPocY: 58, arcoA: 64 };
export const nucleo = (t: Talla) => 2 * (t.PED + t.CASA + t.POZO + t.RAP) + t.CEN;
const RHO = 1.1;
/** La doliente va un poco más grande que la gárgola (de pie y flaca se perdía). */
const DOL = 1.15;

/** La geometría del panel en puntos de dibujo (y local: 0 arriba del lienzo del marco, B abajo). */
export interface Geo {
  t: Talla; Wa: number; HF: number; B: number; yT: number; x0: number;
  casaV: number; casaM: number; orbV: [number, number]; orbM: [number, number];
  pozoI: [number, number]; pozoD: [number, number]; rapI: number; rapD: number; cen: number;
  poc: [number, number][]; rapidos: [number, number][]; placas: { id: string; x: number; y: number }[]; rec: [number, number, number, number]; correr: [number, number, number, number];
  xp: [number, number, number, number]; roseton: [number, number]; ojos: [number, number][]; llama: [number, number]; apex: number;
}
export function geometria(Wa: number, Ha: number): Geo | null {
  const t = Ha >= 620 && Wa >= nucleo(NORMAL) + 20 ? NORMAL : COMPACTO;
  if (Wa < nucleo(t) + 8) return null;
  const apex = t.orbY + altoOjiva(t.arcoA, t.arcoA * RHO);
  const HF = Math.ceil(Math.max(apex + 22 * t.f, t.hC + 6 * t.f + 92 * t.fs * DOL, t.hC + 6 * t.f + 84 * t.fs)) + 8, B = HF, yT = B - t.hC;
  const x0 = Math.floor((Wa - nucleo(t)) / 2);
  let x = x0;
  const pedI = x; x += t.PED; const casaV = x; x += t.CASA; const pozoIx = x; x += t.POZO; const rapI = x; x += t.RAP; const cen = x; x += t.CEN;
  const rapD = x; x += t.RAP; const pozoDx = x; x += t.POZO; const casaM = x; x += t.CASA; const pedD = x;
  const orbV: [number, number] = [casaV + t.CASA / 2, B - t.orbY], orbM: [number, number] = [casaM + t.CASA / 2, B - t.orbY];
  const habY = Math.round(yT + (t.cor + t.filaPl + t.plH) / 2 - t.hab / 2);
  const pozoI: [number, number] = [Math.round(pozoIx + (t.POZO - t.hab) / 2), habY], pozoD: [number, number] = [Math.round(pozoDx + (t.POZO - t.hab) / 2), habY];
  const anchoB = 4 * t.poc + 3 * t.pocG, bx = Math.round(cen + (t.CEN - anchoB) / 2);
  const poc = [0, 1, 2, 3].map((i) => [bx + i * (t.poc + t.pocG), yT + t.pocY] as [number, number]);
  const anchoR = 5 * t.rap + 4 * t.rapG;
  const rapidos: [number, number][] = [];
  for (let i = 0; i < 10; i++) { const g = i < 5 ? rapI : rapD, k = i % 5; rapidos.push([Math.round(g + (t.RAP - anchoR) / 2) + k * (t.rap + t.rapG), yT + t.filaRap]); }
  const placas: { id: string; x: number; y: number }[] = [];
  const fila = (ids: string[], gx: number) => { const w = ids.length * t.plW + (ids.length - 1) * 4, px = Math.round(gx + (t.RAP - w) / 2); ids.forEach((id, i) => placas.push({ id, x: px + i * (t.plW + 4), y: yT + t.filaPl })); };
  fila(['pers', 'inv', 'habs'], rapI); fila(['agresivo', 'mapa', 'menu'], rapD);
  const rec: [number, number, number, number] = [rapI + 4, yT + t.filaRec, t.RAP - 8, t.altoRec];
  const correr: [number, number, number, number] = [rapD + 4, yT + t.filaRec, t.RAP - 8, t.altoRec];
  const xp: [number, number, number, number] = [casaV + t.CASA - 6, yT + 2, casaM + 6 - (casaV + t.CASA - 6), 5];
  const g = gargola(t.fs, 1), dl = doliente(t.fs * DOL, -1);
  const gx = Math.round(pedI + t.PED / 2 - g.pie[0]), gy = Math.round(yT - 6 * t.f - g.pie[1]);
  const dx = Math.round(pedD + t.PED / 2 - dl.pie[0]), dy = Math.round(yT - 6 * t.f - dl.pie[1]);
  return { t, Wa, HF, B, yT, x0, casaV, casaM, orbV, orbM, pozoI, pozoD, rapI, rapD, cen, poc, rapidos, placas, rec, correr, xp,
    roseton: [cen + t.CEN / 2, yT - 7], ojos: g.ojos.map(([a, b]) => [a + gx, b + gy] as [number, number]), llama: [dl.llama[0] + dx, dl.llama[1] + dy], apex: B - apex };
}

// ------------------------------------------------------------------ el marco, horneado una vez por tamaño
/** El pedazo del marco que lleva los atajos (con margen para la luz y la sombra): x, y, ancho y alto en puntos de dibujo. */
export function cajaAtajos(g: Geo): [number, number, number, number] { const x0 = g.rapI - 16, y0 = g.yT - 12; return [x0, y0, g.rapD + g.t.RAP + 16 - x0, g.B - y0]; }
/** El rectángulo de cada atajo en el pedazo: se reparten el hueco de en medio, así no se pisan. */
export function rectAtajo(g: Geo, i: number): [number, number, number, number] {
  const t = g.t, [x, y] = g.rapidos[i], k = i % 5, x0 = k === 0 ? x - 6 : x - 1, x1 = k === 4 ? x + t.rap + 6 : x + t.rap + 2;
  return [x0, y - 5, x1 - x0, g.yT + t.filaTec + 9 - (y - 5)];
}
/** Las teclas de latón de los atajos llenos, en el pedazo (ox, oy: su esquina en el marco). */
export function grabarAtajos(l: Lienzo, g: Geo, ox: number, oy: number) {
  const t = g.t;
  g.rapidos.forEach(([x], i) => { const s = teclaAtajo(i), w = [...s].length * 4 - 1; textoMicro(l, Math.round(x + t.rap / 2 - w / 2) - ox, g.yT + t.filaTec - oy, s, [24, 14, 6], null); });
}
/**
 * `llenos`: los atajos con su bisel entero (hierro, hueco y la plaquita de latón de la tecla). Sin eso (el marco de
 * todos los cuadros) cada atajo es apenas un rebaje en la piedra con la plaquita apagada: hud_forja.ts pega encima el
 * pedazo del marco lleno de cada atajo que tiene poder (atajosLlenos), o a medias si está vacío y se le apunta.
 */
export function tallarMarco(g: Geo, llenos = false): Taller {
  const { t, Wa, HF, B, yT } = g, tl = new Taller(Wa, HF);
  // 1. el muro de los extremos (pantallas anchas): sillería con arquería ciega y una albardilla arriba
  const hMuro = t.hC - 8;
  for (const [a, b] of [[0, g.x0 + t.PED / 2], [g.x0 + nucleo(t) - t.PED / 2, Wa]] as [number, number][]) {
    if (b - a < 2) continue;
    tl.caja(a - 4, B - hMuro, b - a + 8, hMuro + 4, M.PIEDRA, 0, 3, { alto: 3 });
    tl.caja(a - 4, B - hMuro - 5, b - a + 8, 7, M.PIEDRA, 2, 3, { alto: 4 });
    tl.sillares(a, B - hMuro + 3, b - a, hMuro - 3, 13, 34, 21);
    // arcos ciegos cada 40 puntos, con su columnilla y un cuadrifolio
    const paso = 40;
    for (let cx = a + 20; cx < b - 10; cx += paso) {
      const ys = B - hMuro + 26, aa = 13;
      tl.forma(cx - aa, ys - altoOjiva(aa, aa * 1.15) - 1, cx + aa, B - 8, (x, y) => enOjiva(x, y, cx, ys, aa, aa * 1.15, B - 9), M.PIEDRA, 3, 3, { hundido: true, alto: 5 });
      tl.capsula(cx - paso / 2, B - 9, cx - paso / 2, ys - 6, 2.2, 2.2, M.PIEDRA, 3, 1);
      tl.pozo(cx, ys - 4, 4.5, 3, M.HUECO);
    }
  }
  // 2. la banda del medio con su cornisa (y la canaleta de la experiencia) y el zócalo
  const bx0 = g.casaV + t.CASA / 2, bx1 = g.casaM + t.CASA / 2;
  tl.caja(bx0, yT + 2, bx1 - bx0, t.hC - 2, M.PIEDRA, 0, 3, { alto: 3 });
  tl.caja(bx0, B - 5, bx1 - bx0, 5, M.PIEDRA, 3, 2, { alto: 2 });
  tl.caja(bx0, yT - 1, bx1 - bx0, t.cor + 1, M.PIEDRA, 3, 3, { alto: 4 });
  tl.caja(g.xp[0] - 2, g.xp[1] - 2, g.xp[2] + 4, g.xp[3] + 4, M.LATON, 6, 2, { alto: 2 });
  tl.caja(g.xp[0], g.xp[1], g.xp[2], g.xp[3], M.HUECO, 7, 1, { hundido: true, alto: 3 });
  tl.sillares(bx0, yT + t.cor + 2, bx1 - bx0, t.hC - t.cor - 7, 20, 46, 7, 1.6);
  // dentellones bajo la cornisa: un taco cada 5 puntos
  for (let x = bx0 + 2; x < bx1 - 3; x += 5) tl.caja(x, yT + t.cor, 3, 3, M.PIEDRA, 2, 1, { alto: 2 });
  // pilastras con capitel y basa entre los grupos (la casa, el pozo, los atajos y el medio)
  for (const px of [g.casaV + t.CASA + 1, g.pozoI[0] + t.hab + 9, g.rapI + t.RAP, g.rapD - 1, g.pozoD[0] - 10, g.casaM - 2]) {
    tl.caja(px - 3, yT + t.cor + 3, 6, t.hC - t.cor - 8, M.PIEDRA, 2, 2, { alto: 3 });
    tl.caja(px - 4, yT + t.cor + 2, 8, 4, M.PIEDRA, 3, 1.5, { alto: 3 });
    tl.caja(px - 4, B - 9, 8, 4, M.PIEDRA, 3, 1.5, { alto: 3 });
  }
  // 3. los pedestales de las esculturas
  for (const px of [g.x0, g.x0 + nucleo(t) - t.PED]) {
    const top = yT - 6 * t.f, w = t.PED - 8, x = px + 4;
    tl.caja(x, top + 6, w, B - top - 6, M.PIEDRA, 2, 3, { alto: 3 });
    tl.caja(x - 3, top, w + 6, 8, M.PIEDRA, 4, 3, { alto: 4 });
    tl.caja(x - 2, B - 10, w + 4, 10, M.PIEDRA, 4, 2, { alto: 3 });
    // el tablero del frente con una ojiva ciega
    const cx = x + w / 2, ys = top + 26, aa = w / 2 - 7;
    tl.forma(cx - aa, top + 10, cx + aa, B - 14, (xx, yy) => enOjiva(xx, yy, cx, ys, aa, aa * 1.2, B - 15), M.PIEDRA, 5, 2, { hundido: true, alto: 4 });
    tl.anillo(cx, ys + 4, 4, 7, M.PIEDRA, 2, 2.5);
  }
  // 4. las casas de los orbes: torre con arco apuntado, filete de latón, crestería, florón, tracería sobre el orbe
  for (const [cx, oy] of [g.orbV, g.orbM]) {
    const a = t.arcoA, rho = a * RHO, ys = oy;
    tl.forma(cx - a, ys - altoOjiva(a, rho), cx + a, B, (x, y) => enOjiva(x, y, cx, ys, a, rho, B), M.PIEDRA, 2, 4, { alto: 6 });
    // la moldura: un filete de latón que sigue el arco por dentro
    tl.forma(cx - a + 6, ys - altoOjiva(a - 6, (a - 6) * RHO), cx + a - 6, B, (x, y) => enOjiva(x, y, cx, ys, a - 6, (a - 6) * RHO, B) && !enOjiva(x, y, cx, ys, a - 9, (a - 9) * RHO, B + 9), M.LATON, 8, 1.5, { alto: 2, modo: 'set' });
    // el campo de adentro, un poco hundido
    tl.forma(cx - a + 9, ys - altoOjiva(a - 9, (a - 9) * RHO), cx + a - 9, B, (x, y) => enOjiva(x, y, cx, ys, a - 9, (a - 9) * RHO, B), M.PIEDRA, 5, 3, { hundido: true, alto: 3, modo: 'set' });
    // crestería: botones de piedra por el trasdós y el florón en la punta
    for (const [px, py] of bordeOjiva(cx, ys, a, rho, 11)) { if (py > ys - 4) continue; tl.elipsoide(px, py - 1, 3, 3, 3.2, M.PIEDRA, 6, 1); tl.elipsoide(2 * cx - px, py - 1, 3, 3, 3.2, M.PIEDRA, 6, 1); }
    const ap = ys - altoOjiva(a, rho);
    tl.capsula(cx, ap + 4, cx, ap - 10 * t.f, 3, 2, M.PIEDRA, 6, 1);
    tl.elipsoide(cx, ap - 12 * t.f, 3.4, 3.4, 4, M.PIEDRA, 7, 1); tl.elipsoide(cx - 4.5, ap - 7 * t.f, 2.6, 2.2, 3, M.PIEDRA, 7, 1); tl.elipsoide(cx + 4.5, ap - 7 * t.f, 2.6, 2.2, 3, M.PIEDRA, 7, 1);
    // el campo de la casa como un rosetón de piedra: radios tallados que salen del anillo del orbe
    { const pts: [number, number][] = [];
      for (let k = 0; k < 24; k++) { const an = (k / 24) * Math.PI * 2; for (let rr = t.R + 15; rr < t.R + 40; rr += 0.5) { const x = Math.round(cx + Math.cos(an) * rr), y = Math.round(oy + Math.sin(an) * rr); if (enOjiva(x, y, cx, ys, a - 11, (a - 11) * RHO, B - 12)) pts.push([x, y]); } }
      tl.surco(pts, 1.4); }
    // la tracería sobre el orbe: un óculo con tres lóbulos
    const ry = oy - t.R - 7 - (altoOjiva(a - 9, (a - 9) * RHO) - t.R - 7) / 2 - 2, rr = Math.min(12, (altoOjiva(a - 9, (a - 9) * RHO) - t.R - 10) / 2);
    if (rr > 6) {
      tl.anillo(cx, ry, rr - 3, rr, M.PIEDRA, 4, 2.6);
      for (let k = 0; k < 3; k++) { const an = -Math.PI / 2 + (k * 2 * Math.PI) / 3; tl.pozo(cx + Math.cos(an) * rr * 0.36, ry + Math.sin(an) * rr * 0.36, rr * 0.4, 4, M.HUECO); }
    }
    // el asiento del orbe: anillo de hierro ancho con su labio de latón
    tl.anillo(cx, oy, t.R + 5, t.R + 13, M.HIERRO, 6, 3.4);
    tl.anillo(cx, oy, t.R + 12, t.R + 14.5, M.LATON, 7, 1.6);
    for (let k = 0; k < 12; k++) { const an = (k / 12) * Math.PI * 2 + Math.PI / 12; tl.elipsoide(cx + Math.cos(an) * (t.R + 9.5), oy + Math.sin(an) * (t.R + 9.5), 1.7, 1.7, 2, M.LATON, 9, 0); }
    // la ménsula de abajo donde se apoya el orbe
    tl.caja(cx - 26, B - 9, 52, 9, M.PIEDRA, 4, 2, { alto: 3 });
  }
  // 5. los pozos de los dos poderes: marco de latón con remaches en las esquinas
  for (const [x, y] of [g.pozoI, g.pozoD]) {
    tl.caja(x - 6, y - 6, t.hab + 12, t.hab + 12, M.HIERRO, 3, 3, { alto: 3 });
    tl.caja(x - 3, y - 3, t.hab + 6, t.hab + 6, M.LATON, 6, 2, { alto: 2.5 });
    tl.caja(x, y, t.hab, t.hab, M.HUECO, 7, 1, { hundido: true, alto: 3 });
    for (const [qx, qy] of [[x - 3, y - 3], [x + t.hab + 2, y - 3], [x - 3, y + t.hab + 2], [x + t.hab + 2, y + t.hab + 2]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.6, 1.6, 2, M.LATON, 9, 0);
  }
  // 6. los atajos: lleno, un bisel de hierro con el hueco y remaches de latón; vacío, un rebaje apenas tallado
  for (const [x, y] of g.rapidos) {
    if (llenos) {
      tl.caja(x - 1, y - 1, t.rap + 2, t.rap + 2, M.HIERRO, 4, 1.6, { alto: 2.5 });
      tl.caja(x + 1, y + 1, t.rap - 2, t.rap - 2, M.HUECO, 6, 1, { hundido: true, alto: 3.5 });
      for (const [qx, qy] of [[x, y], [x + t.rap - 1, y], [x, y + t.rap - 1], [x + t.rap - 1, y + t.rap - 1]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.2, 1.2, 1.5, M.LATON, 6.5, 0);
    } else tl.caja(x + 2, y + 2, t.rap - 4, t.rap - 4, M.PIEDRA, 3, 2, { hundido: true, alto: 1.2, modo: 'set' });
  }
  // 7. el recurso de la clase y el correr: ranuras con filete de latón
  for (const [x, y, w, h] of [g.rec, g.correr]) { tl.caja(x - 2, y - 2, w + 4, h + 4, M.LATON, 4, 1.5, { alto: 2 }); tl.caja(x, y, w, h, M.HUECO, 5, 1, { hundido: true, alto: 3 }); }
  // 7b. las plaquitas de latón de las teclas (se graban después de hornear)
  for (const [x] of g.rapidos) { if (llenos) tl.caja(x + Math.floor(t.rap / 2) - 7, yT + t.filaTec - 2, 14, 9, M.LATON, 4, 1.5, { alto: 2 }); else tl.caja(x + Math.floor(t.rap / 2) - 7, yT + t.filaTec - 2, 14, 9, M.PIEDRA, 3, 1.5, { alto: 0.8 }); }
  // 8. los zócalos de las placas del menú
  for (const p of g.placas) tl.caja(p.x - 2, p.y - 2, t.plW + 4, t.plH + 4, M.HIERRO, 2, 1.5, { hundido: true, alto: 2 });
  // 9. la bandeja del cinturón: borde de latón, fondo hundido, divisiones de hierro y los alvéolos de las cuentas
  { const anchoB = 4 * t.poc + 3 * t.pocG, x = g.poc[0][0] - 7, y = yT + t.bandeja[0], w = anchoB + 14, h = t.bandeja[1] - t.bandeja[0];
    tl.caja(x - 2, y - 2, w + 4, h + 4, M.HIERRO, 3, 2, { alto: 3 });
    tl.caja(x, y, w, h, M.LATON, 5, 2, { alto: 2.5 });
    tl.caja(x + 3, y + 3, w - 6, h - 6, M.HUECO, 7, 2, { hundido: true, alto: 4 });
    for (let i = 0; i < 4; i++) {
      const [px, py] = g.poc[i];
      tl.caja(px - 1, py - 1, t.poc + 2, t.poc + 2, M.HIERRO, 3, 1, { alto: 1.5, modo: 'set' });
      tl.caja(px, py, t.poc, t.poc, M.HUECO, 4, 1, { hundido: true, alto: 3, modo: 'set' });
      if (i) tl.caja(px - t.pocG + 1, y + 3, t.pocG - 2, h - 6, M.HIERRO, 3, 1, { alto: 2, modo: 'set' });
      tl.caja(px + Math.floor(t.poc / 2) - 5, yT + t.tecPocY - 2, 10, 9, M.LATON, 6, 1.5, { alto: 2, modo: 'set' });
    }
    for (const [qx, qy] of [[x + 1, y + 1], [x + w - 2, y + 1], [x + 1, y + h - 2], [x + w - 2, y + h - 2]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.6, 1.6, 2, M.LATON, 8, 0); }
  // 10. el frontón del rosetón en el medio de la cornisa
  { const [cx] = g.roseton, a = 24 * Math.max(0.85, t.f), ys = yT + 4;
    tl.forma(cx - a, ys - altoOjiva(a, a * 1.25), cx + a, yT + t.bandeja[0] - 3, (x, y) => enOjiva(x, y, cx, ys, a, a * 1.25, yT + t.bandeja[0] - 3), M.PIEDRA, 4, 3, { alto: 4 });
    const ap = ys - altoOjiva(a, a * 1.25); tl.elipsoide(cx, ap - 2, 2.6, 2.6, 3, M.PIEDRA, 7, 1); }
  // 11. las esculturas sobre sus pedestales
  { const ga = gargola(t.fs, 1), dl = doliente(t.fs * DOL, -1);
    tl.pegar(ga.t, Math.round(g.x0 + t.PED / 2 - ga.pie[0]), Math.round(yT - 6 * t.f - ga.pie[1]), 8);
    tl.pegar(dl.t, Math.round(g.x0 + nucleo(t) - t.PED / 2 - dl.pie[0]), Math.round(yT - 6 * t.f - dl.pie[1]), 8); }
  return tl;
}
/**
 * Las teclas grabadas con incrustación de latón (después de hornear: cifras de pixel 3x5). En el marco de todos los
 * cuadros la tecla de cada atajo va apenas marcada en la piedra; las de latón van en el pedazo lleno (grabarAtajos).
 */
export function grabarTeclas(l: Lienzo, g: Geo) {
  const t = g.t, inc: C3 = [24, 14, 6], som: C3 | null = null, incM: C3 = P.laton[6];
  const centrado = (s: string, cx: number, y: number, c: C3 = inc) => { const w = [...s].length * 4 - 1; textoMicro(l, Math.round(cx - w / 2), y, s, c, som); };
  g.rapidos.forEach(([x], i) => centrado(teclaAtajo(i), x + t.rap / 2, g.yT + t.filaTec, [26, 21, 17]));
  g.poc.forEach(([x], i) => centrado(String(i + 1), x + t.poc / 2, g.yT + t.tecPocY));
  // los botones del ratón grabados bajo cada pozo: el izquierdo o el derecho encendido
  for (const [lado, [x, y]] of [[0, g.pozoI], [1, g.pozoD]] as [number, [number, number]][]) {
    const mx = Math.round(x + t.hab / 2 - 3), my = y + t.hab + 7;
    if (my + 8 > g.B - 4) continue;
    for (let yy = 0; yy < 8; yy++) for (let xx = 0; xx < 7; xx++) {
      const borde = (yy === 0 && xx > 0 && xx < 6) || (yy === 7 && xx > 0 && xx < 6) || ((xx === 0 || xx === 6) && yy > 0 && yy < 7) || (yy === 3 && xx > 0 && xx < 6) || (xx === 3 && yy < 3);
      const boton = yy > 0 && yy < 3 && (lado === 0 ? xx > 0 && xx < 3 : xx > 3 && xx < 6);
      if (borde) l.px(mx + xx, my + yy, incM); else if (boton) l.px(mx + xx, my + yy, P.laton[8]);
    }
  }
}
