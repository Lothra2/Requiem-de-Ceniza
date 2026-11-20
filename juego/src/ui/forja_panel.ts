// El panel forjado de PC sin el navegador: las tallas, la geometría en puntos de dibujo y el tallado del marco.
// Lo usa hud_forja.ts (en el juego) y t951_esculturas.mts (el laboratorio, sin servidor).
import { textoMicro, Lienzo, PALETA as P, type C3 } from '../../../src/engine/gotico/hud';
import { Taller, M, enOjiva, altoOjiva, bordeOjiva, gargola, doliente } from './forja_taller';

/** La tecla de cada atajo (5 a 9, 0 y F7 a F10). */
const teclaAtajo = (i: number) => (i < 5 ? `${i + 5}` : i === 5 ? '0' : `F${i + 1}`);
// ------------------------------------------------------------------ tallas
// (20 nov 2026, el HUD "con intención") Los orbes anclan las esquinas en casas más chicas, las esculturas se asoman
// por detrás del riñón de cada casa (parte del cuerpo queda tapado por el arco) y el medio es una consola baja: placas
// del menú de a dos por dos en las puntas, los pozos de los poderes como dos torres que rompen la cornisa, cinco atajos
// a cada lado, el cinturón partido en dos pares (1 y 2, 3 y 4) y en el centro el altar: arriba la Marca (el rosetón del
// nivel, que es una brasa) y abajo el nicho de la reliquia de la clase.
export interface Talla {
  hC: number; R: number; orbY: number; arcoA: number; hab: number; rap: number; rapG: number; poc: number; pocG: number; plW: number; plH: number; plG: number; f: number; fs: number; cor: number;
  PL: number; POZO: number; RAP: number; PAR: number; ALTAR: number;
  habY: number; filaRap: number; filaTec: number; plY: number; bandeja: [number, number]; pocY: number; pipY: number; pip: number; nicho: [number, number, number];
}
const NORMAL: Talla = { hC: 62, R: 46, orbY: 60, arcoA: 64, hab: 46, rap: 26, rapG: 3, poc: 34, pocG: 5, plW: 26, plH: 18, plG: 4, f: 1, fs: 1, cor: 8,
  PL: 66, POZO: 64, RAP: 152, PAR: 85, ALTAR: 124, habY: 9, filaRap: 14, filaTec: 43, plY: 13, bandeja: [9, 60], pocY: 12, pipY: 49, pip: 4, nicho: [14, 41, 110] };
const COMPACTO: Talla = { hC: 56, R: 38, orbY: 50, arcoA: 53, hab: 40, rap: 22, rapG: 3, poc: 30, pocG: 4, plW: 24, plH: 16, plG: 3, f: 0.85, fs: 0.78, cor: 8,
  PL: 56, POZO: 54, RAP: 126, PAR: 72, ALTAR: 96, habY: 9, filaRap: 13, filaTec: 38, plY: 12, bandeja: [9, 54], pocY: 12, pipY: 44, pip: 3, nicho: [14, 36, 84] };
export const consola = (t: Talla) => 2 * (t.PL + t.POZO + t.RAP + t.PAR) + t.ALTAR;
export const nucleo = (t: Talla) => consola(t) + 4 * t.arcoA;
const RHO = 1.1;
/** La doliente va un poco más grande que la gárgola (de pie y flaca se perdía). */
const DOL = 1.15;
/** Lo más que se separa cada casa de la consola (pantallas muy anchas: más allá sigue un muro bajo). */
const HOMBRO_MAX = 190;

/** La geometría del panel en puntos de dibujo (y local: 0 arriba del lienzo del marco, B abajo). */
export interface Geo {
  t: Talla; Wa: number; HF: number; B: number; yT: number; x0: number; x1: number; conI: number; conD: number;
  casaV: number; casaM: number; orbV: [number, number]; orbM: [number, number];
  pozoI: [number, number]; pozoD: [number, number]; rapI: number; rapD: number; cen: number;
  poc: [number, number][]; rapidos: [number, number][]; placas: { id: string; x: number; y: number }[]; rec: [number, number, number, number];
  xp: [number, number, number, number]; roseton: [number, number]; ojos: [number, number][]; llama: [number, number]; apex: number;
  garg: [number, number]; dol: [number, number]; /** El pie de la vela de la doliente y su alto entera. */ vela: [number, number]; velaH: number;
}
export function geometria(Wa: number, Ha: number): Geo | null {
  const t = Ha >= 620 && Wa >= nucleo(NORMAL) + 20 ? NORMAL : COMPACTO;
  if (Wa < nucleo(t) + 8) return null;
  const apex = t.orbY + altoOjiva(t.arcoA, t.arcoA * RHO);
  const HF = Math.ceil(Math.max(apex + 16 * t.f, t.hC + 6 * t.f + 92 * t.fs * DOL, t.hC + 6 * t.f + 84 * t.fs)) + 18, B = HF, yT = B - t.hC;
  const total = Math.min(Wa, nucleo(t) + 2 * HOMBRO_MAX), x0 = Math.floor((Wa - total) / 2), x1 = x0 + total;
  const casaV = x0, casaM = x1 - 2 * t.arcoA, conI = Math.floor((Wa - consola(t)) / 2), conD = conI + consola(t);
  const orbV: [number, number] = [casaV + t.arcoA, B - t.orbY], orbM: [number, number] = [casaM + t.arcoA, B - t.orbY];
  let x = conI;
  const plI = x; x += t.PL; const pozoIx = x; x += t.POZO; const rapI = x; x += t.RAP; const parI = x; x += t.PAR; const cen = x; x += t.ALTAR;
  const parD = x; x += t.PAR; const rapD = x; x += t.RAP; const pozoDx = x; x += t.POZO; const plD = x;
  const pozoI: [number, number] = [Math.round(pozoIx + (t.POZO - t.hab) / 2), yT + t.habY], pozoD: [number, number] = [Math.round(pozoDx + (t.POZO - t.hab) / 2), yT + t.habY];
  const anchoP = 2 * t.poc + t.pocG;
  const poc = [0, 1, 2, 3].map((i) => [Math.round((i < 2 ? parI : parD) + (t.PAR - anchoP) / 2) + (i % 2) * (t.poc + t.pocG), yT + t.pocY] as [number, number]);
  const anchoR = 5 * t.rap + 4 * t.rapG;
  const rapidos: [number, number][] = [];
  for (let i = 0; i < 10; i++) { const g = i < 5 ? rapI : rapD, k = i % 5; rapidos.push([Math.round(g + (t.RAP - anchoR) / 2) + k * (t.rap + t.rapG), yT + t.filaRap]); }
  // las placas del menú: dos por dos en cada punta de la consola
  const placas: { id: string; x: number; y: number }[] = [];
  const bloque = (ids: string[], gx: number) => { const w = 2 * t.plW + t.plG, px = Math.round(gx + (t.PL - w) / 2); ids.forEach((id, i) => placas.push({ id, x: px + (i % 2) * (t.plW + t.plG), y: yT + t.plY + (i >> 1) * (t.plH + t.plG) })); };
  bloque(['pers', 'inv', 'habs', 'mapa'], plI); bloque(['agresivo', 'correr', 'registro', 'menu'], plD);
  const rec: [number, number, number, number] = [Math.round(cen + (t.ALTAR - t.nicho[2]) / 2), yT + t.nicho[0], t.nicho[2], t.nicho[1]];
  const xpx = pozoI[0] + t.hab + 9, xp: [number, number, number, number] = [xpx, yT + 2, pozoD[0] - 9 - xpx, 4];
  // las esculturas: sobre la punta de la consola, medio escondidas tras el riñón de cada casa
  const g = gargola(t.fs, 1), dl = doliente(t.fs * DOL, -1);
  const gcx = Math.min(casaV + 2 * t.arcoA + Math.round(16 * t.fs), conI + Math.round(30 * t.fs)), dcx = Math.max(casaM - Math.round(16 * t.fs), conD - Math.round(24 * t.fs));
  const garg: [number, number] = [Math.round(gcx - g.pie[0]), Math.round(yT - 5 * t.f - g.pie[1])], dol: [number, number] = [Math.round(dcx - dl.pie[0]), Math.round(yT - 4 * t.f - dl.pie[1])];
  return { t, Wa, HF, B, yT, x0, x1, conI, conD, casaV, casaM, orbV, orbM, pozoI, pozoD, rapI, rapD, cen, poc, rapidos, placas, rec, xp,
    roseton: [cen + t.ALTAR / 2, yT - 7], ojos: g.ojos.map(([a, b]) => [a + garg[0], b + garg[1]] as [number, number]), llama: [dl.llama[0] + dol[0], dl.llama[1] + dol[1]], apex: B - apex, garg, dol,
    vela: [Math.round(dl.vela[0] + dol[0]), Math.round(dl.vela[1] + dol[1])], velaH: Math.max(5, Math.round(8 * t.fs * DOL)) };
}

// ------------------------------------------------------------------ el marco, horneado una vez por tamaño
/** El pedazo del marco que lleva los atajos (con margen para la luz y la sombra): x, y, ancho y alto en puntos de dibujo. */
export function cajaAtajos(g: Geo): [number, number, number, number] { const x0 = g.rapI - 4, y0 = g.yT + g.t.cor + 1; return [x0, y0, g.rapD + g.t.RAP + 4 - x0, g.B - y0]; }
/** El rectángulo de cada atajo en el pedazo: se reparten el hueco de en medio, así no se pisan. */
export function rectAtajo(g: Geo, i: number): [number, number, number, number] {
  const t = g.t, [x, y] = g.rapidos[i], k = i % 5, x0 = k === 0 ? x - 4 : x - 1, x1 = k === 4 ? x + t.rap + 4 : x + t.rap + 2;
  return [x0, y - 3, x1 - x0, g.yT + t.filaTec + 9 - (y - 3)];
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
 * `sinVela`: la doliente sin su vela (la vela se dibuja por cuadro: se consume con el maná).
 */
export function tallarMarco(g: Geo, llenos = false, sinVela = true): Taller {
  const { t, Wa, HF, B, yT } = g, tl = new Taller(Wa, HF);
  const hMuro = t.hC - 8;
  const muro = (a: number, b: number, sem: number) => {
    if (b - a < 2) return;
    tl.caja(a - 4, B - hMuro, b - a + 8, hMuro + 4, M.PIEDRA, 0, 3, { alto: 3 });
    tl.caja(a - 4, B - hMuro - 4, b - a + 8, 6, M.PIEDRA, 2, 3, { alto: 4 });
    tl.sillares(a, B - hMuro + 3, b - a, hMuro - 3, 13, 34, sem);
    // arcos ciegos cada 40 puntos, con su columnilla y un óculo (solo si el tramo da para uno entero)
    const paso = 40, n = Math.floor((b - a - 8) / paso); if (n < 1) return;
    const m0 = a + (b - a - n * paso) / 2;
    for (let i = 0; i < n; i++) {
      const cx = Math.round(m0 + paso / 2 + i * paso), ys = B - hMuro + 24, aa = 12;
      tl.forma(cx - aa, ys - altoOjiva(aa, aa * 1.15) - 1, cx + aa, B - 8, (x, y) => enOjiva(x, y, cx, ys, aa, aa * 1.15, B - 9), M.PIEDRA, 3, 3, { hundido: true, alto: 5 });
      tl.pozo(cx, ys - 3, 4, 3, M.HUECO);
    }
  };
  // 1. el muro bajo: más allá de las casas (pantallas muy anchas) y los hombros entre cada casa y la consola
  muro(0, g.x0 + t.arcoA, 21); muro(g.x1 - t.arcoA, Wa, 23);
  muro(g.casaV + t.arcoA, g.conI + 4, 25); muro(g.conD - 4, g.casaM + t.arcoA, 27);
  // 2. las esculturas van detrás de las casas y de la consola: se asoman por encima del riñón del arco
  { const ga = gargola(t.fs, 1), dl = doliente(t.fs * DOL, -1, sinVela);
    // cada una en su pedestal, que sube del hombro
    for (const [cx, w] of [[g.garg[0] + ga.pie[0], 46 * t.fs], [g.dol[0] + dl.pie[0], 40 * t.fs]]) {
      tl.caja(cx - w / 2, yT - 1, w, B - yT + 1, M.PIEDRA, 1, 3, { alto: 3 }); tl.caja(cx - w / 2 - 3, yT - 5 * t.f, w + 6, 7, M.PIEDRA, 2, 3, { alto: 4 }); }
    tl.pegar(ga.t, g.garg[0], g.garg[1], 4); tl.pegar(dl.t, g.dol[0], g.dol[1], 4); }
  // 3. la consola: cuerpo, zócalo y cornisa (con la canaleta de la experiencia)
  const bx0 = g.conI, bx1 = g.conD;
  tl.caja(bx0, yT + 2, bx1 - bx0, t.hC - 2, M.PIEDRA, 6, 3, { alto: 3, modo: 'set' });
  tl.caja(bx0, B - 5, bx1 - bx0, 5, M.PIEDRA, 9, 2, { alto: 2, modo: 'set' });
  tl.caja(bx0 - 2, yT - 1, bx1 - bx0 + 4, t.cor + 1, M.PIEDRA, 9, 3, { alto: 4, modo: 'set' });
  tl.sillares(bx0, yT + t.cor + 2, bx1 - bx0, t.hC - t.cor - 7, 17, 44, 7, 1.6);
  for (let x = bx0 + 2; x < bx1 - 3; x += 5) tl.caja(x, yT + t.cor, 3, 3, M.PIEDRA, 8, 1, { alto: 2 });
  // pilastras entre los grupos, cada una con su pináculo que rompe la línea de la cornisa
  for (const px of [g.pozoI[0] - 9, g.rapI + 1, g.rapI + t.RAP - 1, g.cen - 1, g.cen + t.ALTAR + 1, g.rapD + 1, g.rapD + t.RAP - 1, g.pozoD[0] + t.hab + 9]) {
    tl.caja(px - 3, yT + t.cor + 3, 6, t.hC - t.cor - 8, M.PIEDRA, 8, 2, { alto: 3 });
    tl.caja(px - 4, yT + t.cor + 2, 8, 4, M.PIEDRA, 9, 1.5, { alto: 3 });
    tl.caja(px - 4, B - 9, 8, 4, M.PIEDRA, 9, 1.5, { alto: 3 });
    tl.caja(px - 3, yT - 5, 6, 6, M.PIEDRA, 9, 2, { alto: 3 }); tl.elipsoide(px, yT - 7, 2.6, 2.6, 3, M.PIEDRA, 11, 1);
  }
  tl.caja(g.xp[0] - 2, g.xp[1] - 2, g.xp[2] + 4, g.xp[3] + 4, M.LATON, 12, 2, { alto: 2 });
  tl.caja(g.xp[0], g.xp[1], g.xp[2], g.xp[3], M.HUECO, 13, 1, { hundido: true, alto: 3 });
  // 4. las casas de los orbes en las esquinas: arco apuntado, filete de latón, crestería, florón y el asiento del orbe
  for (const [cx, oy] of [g.orbV, g.orbM]) {
    const a = t.arcoA, rho = a * RHO, ys = oy;
    tl.forma(cx - a, ys - altoOjiva(a, rho), cx + a, B, (x, y) => enOjiva(x, y, cx, ys, a, rho, B), M.PIEDRA, 14, 4, { alto: 6, modo: 'set' });
    tl.forma(cx - a + 5, ys - altoOjiva(a - 5, (a - 5) * RHO), cx + a - 5, B, (x, y) => enOjiva(x, y, cx, ys, a - 5, (a - 5) * RHO, B) && !enOjiva(x, y, cx, ys, a - 7.5, (a - 7.5) * RHO, B + 9), M.LATON, 20, 1.5, { alto: 2, modo: 'set' });
    tl.forma(cx - a + 8, ys - altoOjiva(a - 8, (a - 8) * RHO), cx + a - 8, B, (x, y) => enOjiva(x, y, cx, ys, a - 8, (a - 8) * RHO, B), M.PIEDRA, 17, 3, { hundido: true, alto: 3, modo: 'set' });
    for (const [px, py] of bordeOjiva(cx, ys, a, rho, 11)) { if (py > ys - 6) continue; tl.elipsoide(px, py - 1, 3, 3, 3.2, M.PIEDRA, 18, 1); tl.elipsoide(2 * cx - px, py - 1, 3, 3, 3.2, M.PIEDRA, 18, 1); }
    const ap = ys - altoOjiva(a, rho);
    tl.capsula(cx, ap + 4, cx, ap - 8 * t.f, 3, 2, M.PIEDRA, 18, 1);
    tl.elipsoide(cx, ap - 10 * t.f, 3.4, 3.4, 4, M.PIEDRA, 19, 1); tl.elipsoide(cx - 4.5, ap - 5 * t.f, 2.6, 2.2, 3, M.PIEDRA, 19, 1); tl.elipsoide(cx + 4.5, ap - 5 * t.f, 2.6, 2.2, 3, M.PIEDRA, 19, 1);
    // radios tallados que salen del anillo del orbe
    { const pts: [number, number][] = [];
      for (let k = 0; k < 24; k++) { const an = (k / 24) * Math.PI * 2; for (let rr = t.R + 15; rr < t.R + 30; rr += 0.5) { const x = Math.round(cx + Math.cos(an) * rr), y = Math.round(oy + Math.sin(an) * rr); if (enOjiva(x, y, cx, ys, a - 10, (a - 10) * RHO, B - 8)) pts.push([x, y]); } }
      tl.surco(pts, 1.4); }
    tl.anillo(cx, oy, t.R + 4, t.R + 12, M.HIERRO, 18, 3.4);
    tl.anillo(cx, oy, t.R + 11, t.R + 13.5, M.LATON, 19, 1.6);
    for (let k = 0; k < 12; k++) { const an = (k / 12) * Math.PI * 2 + Math.PI / 12; tl.elipsoide(cx + Math.cos(an) * (t.R + 8.5), oy + Math.sin(an) * (t.R + 8.5), 1.7, 1.7, 2, M.LATON, 21, 0); }
  }
  // 5. los pozos de los dos poderes: torres que suben sobre la cornisa, con su cresta (ahí va grabado el botón del ratón)
  for (const [x, y] of [g.pozoI, g.pozoD]) {
    const cx = x + t.hab / 2;
    tl.caja(x - 8, yT - 4, t.hab + 16, B - yT + 4, M.PIEDRA, 10, 3, { alto: 3, modo: 'set' });
    tl.forma(cx - 12, yT - 20, cx + 12, yT + 2, (px, py) => py >= yT - 20 + Math.max(0, Math.abs(px + 0.5 - cx) - 5) * 1.1 && py <= yT + 2 && Math.abs(px + 0.5 - cx) <= 12, M.PIEDRA, 11, 2, { alto: 3 });
    tl.caja(x - 6, y - 6, t.hab + 12, t.hab + 12, M.HIERRO, 13, 3, { alto: 3, modo: 'set' });
    tl.caja(x - 3, y - 3, t.hab + 6, t.hab + 6, M.LATON, 16, 2, { alto: 2.5, modo: 'set' });
    tl.caja(x, y, t.hab, t.hab, M.HUECO, 17, 1, { hundido: true, alto: 3, modo: 'set' });
    for (const [qx, qy] of [[x - 3, y - 3], [x + t.hab + 2, y - 3], [x - 3, y + t.hab + 2], [x + t.hab + 2, y + t.hab + 2]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.6, 1.6, 2, M.LATON, 19, 0);
  }
  // 6. los atajos: lleno, un bisel de hierro con el hueco y remaches de latón; vacío, un rebaje apenas tallado
  for (const [x, y] of g.rapidos) {
    if (llenos) {
      tl.caja(x - 1, y - 1, t.rap + 2, t.rap + 2, M.HIERRO, 10, 1.6, { alto: 2.5, modo: 'set' });
      tl.caja(x + 1, y + 1, t.rap - 2, t.rap - 2, M.HUECO, 12, 1, { hundido: true, alto: 3.5, modo: 'set' });
      for (const [qx, qy] of [[x, y], [x + t.rap - 1, y], [x, y + t.rap - 1], [x + t.rap - 1, y + t.rap - 1]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.2, 1.2, 1.5, M.LATON, 12.5, 0);
      tl.caja(x + Math.floor(t.rap / 2) - 7, yT + t.filaTec - 2, 14, 9, M.LATON, 10, 1.5, { alto: 2, modo: 'set' });
    } else { tl.caja(x + 2, y + 2, t.rap - 4, t.rap - 4, M.PIEDRA, 9, 2, { hundido: true, alto: 1.2, modo: 'set' }); tl.caja(x + Math.floor(t.rap / 2) - 7, yT + t.filaTec - 2, 14, 9, M.PIEDRA, 9, 1.5, { alto: 0.8, modo: 'set' }); }
  }
  // 7. los zócalos de las placas del menú
  for (const p of g.placas) tl.caja(p.x - 2, p.y - 2, t.plW + 4, t.plH + 4, M.HIERRO, 8, 1.5, { hundido: true, alto: 2, modo: 'set' });
  // 8. el cinturón en dos pares: cada uno su bandeja de latón con las copas, la tecla y los alvéolos de las cuentas
  for (const i0 of [0, 2]) {
    const x = g.poc[i0][0] - 4, y = yT + t.bandeja[0], w = 2 * t.poc + t.pocG + 8, h = t.bandeja[1] - t.bandeja[0];
    tl.caja(x - 2, y - 2, w + 4, h + 4, M.HIERRO, 9, 2, { alto: 3, modo: 'set' });
    tl.caja(x, y, w, h, M.LATON, 11, 2, { alto: 2.5, modo: 'set' });
    tl.caja(x + 2, y + 2, w - 4, h - 4, M.HUECO, 13, 2, { hundido: true, alto: 4, modo: 'set' });
    for (const i of [i0, i0 + 1]) {
      const [px, py] = g.poc[i];
      tl.caja(px - 1, py - 1, t.poc + 2, t.poc + 2, M.HIERRO, 9, 1, { alto: 1.5, modo: 'set' });
      tl.caja(px, py, t.poc, t.poc, M.HUECO, 10, 1, { hundido: true, alto: 3, modo: 'set' });
      tl.caja(px, yT + t.pipY - 2, 9, 9, M.LATON, 12, 1.5, { alto: 2, modo: 'set' });
    }
  }
  // 9. el altar: el nicho de la reliquia de la clase (hundido, con filete de latón) y el frontón de la Marca
  { const [x, y, w, h] = g.rec, [cx] = g.roseton, a = Math.round(31 * Math.max(0.85, t.f)), ys = yT + 3;
    tl.forma(cx - a, ys - altoOjiva(a, a * 1.25), cx + a, yT + 4, (px, py) => enOjiva(px, py, cx, ys, a, a * 1.25, yT + 4), M.PIEDRA, 10, 3, { alto: 4 });
    for (const [px, py] of bordeOjiva(cx, ys, a, a * 1.25, 9)) { if (py > ys - 5) continue; tl.elipsoide(px, py - 1, 2.2, 2.2, 2.6, M.PIEDRA, 12, 1); tl.elipsoide(2 * cx - px, py - 1, 2.2, 2.2, 2.6, M.PIEDRA, 12, 1); }
    const ap = ys - altoOjiva(a, a * 1.25); tl.capsula(cx, ap + 3, cx, ap - 4, 2.4, 1.6, M.PIEDRA, 12, 1); tl.elipsoide(cx, ap - 6, 2.8, 2.8, 3.2, M.PIEDRA, 13, 1);
    tl.caja(x - 4, y - 4, w + 8, h + 8, M.HIERRO, 9, 2, { alto: 3, modo: 'set' });
    tl.caja(x - 2, y - 2, w + 4, h + 4, M.LATON, 11, 1.5, { alto: 2, modo: 'set' });
    tl.caja(x, y, w, h, M.HUECO, 13, 2, { hundido: true, alto: 4, modo: 'set' });
    for (const [qx, qy] of [[x - 3, y - 3], [x + w + 2, y - 3], [x - 3, y + h + 2], [x + w + 2, y + h + 2]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.6, 1.6, 2, M.LATON, 13, 0); }
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
  g.poc.forEach(([x], i) => centrado(String(i + 1), x + 4.5, g.yT + t.pipY));
  // el botón del ratón grabado en la cresta de cada pozo: el izquierdo o el derecho encendido
  for (const [lado, [x]] of [[0, g.pozoI], [1, g.pozoD]] as [number, [number, number]][]) {
    const mx = Math.round(x + t.hab / 2 - 4.5), my = g.yT - 13;
    for (let yy = 0; yy < 11; yy++) for (let xx = 0; xx < 9; xx++) {
      const redo = (yy === 0 || yy === 10) && (xx < 2 || xx > 6) || (yy === 1 || yy === 9) && (xx === 0 || xx === 8);
      if (redo) continue;
      const borde = yy === 0 || yy === 10 || xx === 0 || xx === 8 || (yy === 1 && (xx === 1 || xx === 7)) || (yy === 9 && (xx === 1 || xx === 7)) || yy === 4 || (xx === 4 && yy < 4);
      const boton = yy > 0 && yy < 4 && (lado === 0 ? xx > 0 && xx < 4 : xx > 4 && xx < 8);
      l.px(mx + xx, my + yy, borde ? incM : boton ? P.laton[8] : [14, 10, 8]);
    }
  }
}
