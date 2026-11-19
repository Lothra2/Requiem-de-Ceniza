// Los motivos de los íconos de habilidad: armas, cuerpos, bestias, elementos y símbolos, cada uno pensado en su propio
// marco (centro en 0,0, unas 28 unidades de alto) para que las recetas (iconos_recetas.ts) los pongan con p.con().
import { Pintor, circ, elip, caja, poli, trazo, curva, arcoPts, estrella, union, fundir, resta, corte, hueco, type Est } from './icono_pintor';

type P = Pintor;
const PI = Math.PI;

// ================================================================ armas
export function hacha(p: P, o: { hoja?: string; mango?: string; filo?: string; barba?: boolean } = {}) {
  const hoja = o.hoja ?? 'acero';
  p.dib(trazo([0, -12, 0, 13], 1.15, 1.3), { m: o.mango ?? 'madera', b: 1.2 });
  const cab = o.barba === false ? poli(1, -12.5, 6, -14, 9.5, -12, 10.5, -7.5, 9.5, -3, 6, -1.5, 3.5, -4, 1, -6.5)
    : poli(1, -12.5, 6, -14.5, 9.5, -13, 11, -8, 10.5, -1.5, 8, 2.5, 6.5, -1.5, 3.5, -4.5, 1, -6.5);
  p.dib(cab, { m: hoja, b: 2.2 });
  p.dib(poli(-1, -11.5, -5.5, -10.2, -1, -8.2), { m: hoja, b: 1 });
  p.dib(trazo(curva(9.6, -13, 11.4, -7.5, 10.6, -1.5), 0.35), o.filo ? { m: o.filo, e: true, t: 5 } : { m: hoja, t: 5, sinBorde: true, sinSombra: true });
  p.dib(caja(0, -9.3, 3.2, 1.3, 0.3), 'bronce'); p.dib(caja(0, -5.8, 2.8, 1, 0.3), 'bronce');
  p.dib(caja(0, 13.2, 2.8, 1.6, 0.6), 'hierro');
}
export function espada(p: P, o: { hoja?: string; guarda?: string; puno?: string; largo?: number; gema?: string; ancha?: number; emis?: boolean } = {}) {
  const L = o.largo ?? 1, w = o.ancha ?? 1.8, hoja: Est = o.emis ? { m: o.hoja ?? 'e_luz', e: true, b: 1.4 } : { m: o.hoja ?? 'acero', b: w };
  p.dib(poli(-w, 4, -w, -11 * L, 0, -14.5 * L, w, -11 * L, w, 4), hoja);
  if (!o.emis) p.dib(trazo([0, 2.5, 0, -12 * L], 0.3), { m: o.hoja ?? 'acero', t: 2, sinBorde: true, sinSombra: true });
  p.dib(caja(0, 5, 9, 1.9, 0.7), o.guarda ?? 'oro');
  p.dib(trazo([0, 6, 0, 10.4], 0.95), { m: o.puno ?? 'cuero', b: 0.9 });
  p.dib(circ(0, 11.6, 1.5), o.guarda ?? 'oro');
  if (o.gema) p.dib(circ(0, 5, 1), { m: o.gema, b: 1 });
}
export function daga(p: P, o: { hoja?: string } = {}) {
  p.dib(poli(-1.4, 2, -1.2, -7, 0, -10, 1.2, -7, 1.4, 2), { m: o.hoja ?? 'acero', b: 1.4 });
  p.dib(caja(0, 2.8, 6, 1.4, 0.5), 'bronce'); p.dib(trazo([0, 3.5, 0, 7], 0.8), 'cuero'); p.dib(circ(0, 7.8, 1.1), 'bronce');
}
export function martillo(p: P, o: { cabeza?: string; mango?: string; emis?: boolean } = {}) {
  p.dib(trazo([0, -6, 0, 13], 1.1, 1.25), { m: o.mango ?? 'madera', b: 1.2 });
  const est: Est = o.emis ? { m: o.cabeza ?? 'e_luz', e: true, b: 2 } : { m: o.cabeza ?? 'hierro', b: 1.4 };
  p.dib(caja(0, -9, 13, 6.5, 1), est);
  if (!o.emis) { p.dib(caja(-4.6, -9, 1.4, 7, 0.3), 'oro'); p.dib(caja(4.6, -9, 1.4, 7, 0.3), 'oro'); }
  p.dib(caja(0, 13.2, 2.6, 1.6, 0.6), 'oro');
}
export function maza(p: P, o: { cabeza?: string } = {}) {
  p.dib(trazo([0, -4, 0, 13], 1.1, 1.25), { m: 'madera', b: 1.2 });
  p.dib(estrella(0, -8, 6, 3.6, 6, 0), { m: o.cabeza ?? 'hierro', b: 1.5 });
  p.dib(circ(0, -8, 3.6), { m: o.cabeza ?? 'hierro', b: 3.6 });
}
export function lanza(p: P, o: { punta?: string; asta?: string; largo?: number; emis?: boolean; cinta?: string } = {}) {
  const L = o.largo ?? 1;
  p.dib(trazo([0, -8 * L, 0, 14 * L], 0.85), { m: o.asta ?? 'madera', b: 0.9 });
  const pt = poli(0, -15 * L - 3, 2.6, -10 * L, 1, -7.5 * L, -1, -7.5 * L, -2.6, -10 * L);
  p.dib(pt, o.emis ? { m: o.punta ?? 'e_luz', e: true, b: 1.4 } : { m: o.punta ?? 'acero', b: 1.6 });
  p.dib(caja(0, -7.2 * L, 2.4, 1.2, 0.3), 'bronce');
  if (o.cinta) { p.dib(trazo(curva(0.6, -6.5 * L, 4, -4 * L, 2.5, 0), 0.7, 0.3), o.cinta); }
}
export function flecha(p: P, o: { punta?: string; asta?: string; pluma?: string; largo?: number; emisPunta?: boolean } = {}) {
  const L = o.largo ?? 1;
  p.dib(trazo([0, -10 * L, 0, 12 * L], 0.6), { m: o.asta ?? 'madera', b: 0.6 });
  p.dib(poli(0, -15 * L, 2.4, -10.5 * L, 0, -11.4 * L, -2.4, -10.5 * L), o.emisPunta ? { m: o.punta ?? 'e_fuego', e: true } : { m: o.punta ?? 'acero', b: 1.2 });
  const pl = o.pluma ?? 'tela';
  p.dib(poli(-0.4, 7 * L, -2.8, 9 * L, -2.8, 13 * L, -0.4, 11 * L), { m: pl, b: 1 });
  p.dib(poli(0.4, 7 * L, 2.8, 9 * L, 2.8, 13 * L, 0.4, 11 * L), { m: pl, b: 1, luz: -0.6 });
}
/** Virote de ballesta: corto, grueso, punta de cuatro caras y aletas cortas. */
export function virote(p: P, o: { punta?: string; asta?: string; aleta?: string; emisPunta?: boolean } = {}) {
  p.dib(trazo([0, -7, 0, 10], 0.95), { m: o.asta ?? 'madera', b: 1 });
  p.dib(poli(0, -13, 2.2, -8.5, 1.4, -6.5, -1.4, -6.5, -2.2, -8.5), o.emisPunta ? { m: o.punta ?? 'e_fuego', e: true } : { m: o.punta ?? 'hierro', b: 1.4 });
  const al = o.aleta ?? 'cuero';
  p.dib(poli(-0.6, 6, -3, 8.5, -3, 11, -0.6, 10), { m: al, b: 0.8 }); p.dib(poli(0.6, 6, 3, 8.5, 3, 11, 0.6, 10), { m: al, b: 0.8, luz: -0.6 });
}
export function arco(p: P, o: { madera?: string; cuerda?: boolean; tenso?: boolean } = {}) {
  const t = o.tenso ? 5 : 0;
  p.dib(trazo(curva(-3, -14, 9, -9, 9, 9, -3, 14), 1.3, 1.3), { m: o.madera ?? 'madera', b: 1.2 });
  p.dib(caja(4.8, 0, 2.6, 3.6, 0.5), 'cuero');
  if (o.cuerda !== false) p.dib(trazo([-3, -14, -3 - t, 0, -3, 14], 0.3), { m: 'hueso', t: 4, sinSombra: true });
}
export function ballesta(p: P) {
  p.dib(trazo([0, -6, 0, 12], 1.5, 1.2), { m: 'madera', b: 1.4 });
  p.dib(trazo(curva(-11, -1, 0, -9, 11, -1), 1.2, 1.2), { m: 'hierro', b: 1.1 });
  p.dib(trazo([-11, -1, 0, 1, 11, -1], 0.3), { m: 'hueso', t: 4, sinSombra: true });
  p.dib(caja(0, -6.5, 3, 2, 0.5), 'bronce');
}
export function escudo(p: P, o: { campo?: string; borde?: string; emblema?: (p: P) => void } = {}) {
  const forma = poli(-10, -11, 0, -12.5, 10, -11, 9.5, 1, 6, 8, 0, 13, -6, 8, -9.5, 1);
  p.dib(forma, { m: o.borde ?? 'acero', b: 1.4 });
  p.con(0, 0.3, 0, 0.8, () => p.dib(forma, { m: o.campo ?? 'tela', b: 2.5, trama: true }));
  o.emblema?.(p);
}
export function escudoRedondo(p: P, o: { campo?: string } = {}) {
  p.dib(circ(0, 0, 12), { m: 'hierro', b: 2 });
  p.dib(circ(0, 0, 10.4), { m: o.campo ?? 'madera', b: 6, trama: true });
  for (const a of [0.5, 2.1, 3.7, 5.3]) p.dib(trazo([Math.cos(a) * 3.5, Math.sin(a) * 3.5, Math.cos(a) * 10, Math.sin(a) * 10], 0.45), { m: 'madera', t: 1, sinBorde: true, sinSombra: true });
  p.dib(circ(0, 0, 3.6), { m: 'hierro', b: 3.6 });
  for (let i = 0; i < 8; i++) { const a = (i / 8) * PI * 2; p.dib(circ(Math.cos(a) * 11.2, Math.sin(a) * 11.2, 0.7), { m: 'bronce', b: 0.7, sinSombra: true }); }
}
export function guadana(p: P) {
  p.dib(trazo(curva(2, 14, 0, 0, 3, -12), 1, 1.1), { m: 'madera', b: 1 });
  p.dib(poli(3, -13, -6, -14, -13, -9, -15, -3, -11, -7, -4, -10.5, 3, -10), { m: 'acero', b: 1.6 });
}

// ================================================================ cuerpo y figuras
export function calavera(p: P, o: { hueso?: string; ojos?: string; mandibula?: boolean; grieta?: boolean } = {}) {
  const h = o.hueso ?? 'hueso';
  p.dib(fundir(1.5, circ(0, -3, 9.5), caja(0, 4, 11, 7, 2.5)), { m: h, b: 4, trama: false });
  if (o.mandibula !== false) p.dib(caja(0, 9.5, 8, 4.5, 1.2), { m: h, b: 1.5 });
  for (const sx of [-1, 1]) p.dib(elip(sx * 3.8, -0.5, 2.8, 3.1), { m: 'sombra', t: 0 });
  p.dib(poli(0, 3, -1.5, 6, 1.5, 6), { m: 'sombra', t: 0 });
  for (let i = -1; i <= 1; i++) p.dib(caja(i * 2.2, 8.4, 0.5, 2.6), { m: h, t: 1, sinBorde: true, sinSombra: true });
  if (o.ojos) for (const sx of [-1, 1]) p.dib(circ(sx * 3.8, -0.2, 1.3), { m: o.ojos, e: true, b: 1.3, brillo: 1.5 });
  if (o.grieta) p.dib(trazo([2, -12.5, 3.5, -8, 1.5, -5.5, 3, -3], 0.4), { m: h, t: 0, sinBorde: true, sinSombra: true });
}
export function hueso(p: P, o: { m?: string; largo?: number } = {}) {
  const L = (o.largo ?? 1) * 10, m = o.m ?? 'hueso';
  p.dib(union(trazo([0, -L, 0, L], 1.4), circ(-1.5, -L - 0.8, 2), circ(1.5, -L - 0.8, 2), circ(-1.5, L + 0.8, 2), circ(1.5, L + 0.8, 2)), { m, b: 1.6 });
}
export function costillas(p: P, o: { m?: string } = {}) {
  const m = o.m ?? 'hueso';
  p.dib(trazo([0, -12, 0, 10], 1.2), { m, b: 1.2 });
  for (let i = 0; i < 4; i++) { const y = -9 + i * 4.2, w = 9 - i * 0.6;
    for (const sx of [-1, 1]) p.dib(trazo(curva(0, y, sx * w, y - 1, sx * (w - 1), y + 4), 0.9, 0.6), { m, b: 0.9 }); }
}
export function vertebra(p: P, m = 'hueso') {
  p.dib(union(elip(0, 0, 3.4, 2), poli(-1, -1, 0, -4.5, 1, -1), poli(-3, 0, -6, -1.6, -3.5, 1), poli(3, 0, 6, -1.6, 3.5, 1)), { m, b: 1.4 });
}
export function diente(p: P, m = 'hueso') { p.dib(poli(-2, -4, 2, -4, 1.4, 1, 0, 5, -1.4, 1), { m, b: 1.3 }); }
export function puno(p: P, o: { m?: string; nudillos?: string } = {}) {
  const m = o.m ?? 'piel';
  p.dib(caja(0, 6.5, 8, 7, 1.5), { m, b: 2 });
  p.dib(caja(0, -1, 13, 10, 3), { m, b: 2.5 });
  for (let i = 0; i < 4; i++) p.dib(caja(-4.6 + i * 3.1, -5, 3, 3.6, 1.3), { m: o.nudillos ?? m, b: 1.3, luz: 0.3 });
  p.dib(trazo([-6.2, 1.2, 2.5, 1.2], 1.4), { m, b: 1.4, luz: -0.3 });
  for (let i = 1; i < 4; i++) p.dib(trazo([-6.2 + i * 3.1, -3, -6.2 + i * 3.1, 0], 0.25), { m, t: 1, sinBorde: true, sinSombra: true });
}
export function mano(p: P, o: { m?: string; abierta?: boolean; garras?: string; flaca?: boolean } = {}) {
  const m = o.m ?? 'piel', w = o.flaca ? 0.85 : 1.25;
  p.dib(caja(0, 9, 6.5, 7, 1.5), { m, b: 2 });
  p.dib(caja(0, 3, 10.5, 9, 3), { m, b: 2.5 });
  const dedos = [[-4.2, -1, -6, -10], [-1.4, -1.5, -2, -13], [1.4, -1.5, 1.8, -13.5], [4.2, -1, 5, -11]];
  for (const [x0, y0, x1, y1] of dedos) { p.dib(trazo([x0, y0, x1, y1], w, w * 0.8), { m, b: w }); if (o.garras) p.dib(poli(x1 - 0.8, y1 + 0.3, x1 + 0.8, y1 + 0.3, x1 + (x1 * 0.1), y1 - 3), { m: o.garras, b: 0.6 }); }
  p.dib(trazo([5, 5, 8.5, 0, 10, -4], w, w * 0.85), { m, b: w });
}
export function manosRezo(p: P, m = 'piel') {
  for (const s of [-1, 1]) p.dib(trazo([s * 1.5, 7, s * 9, 14], 2.4, 3.2), { m: 'tela', b: 2, luz: s > 0 ? -0.5 : 0.2 });
  p.dib(poli(0, -14, 3.4, -8, 4.4, 0, 3.6, 7, 0, 8.5, -3.6, 7, -4.4, 0, -3.4, -8), { m, b: 3 });
  for (const s of [-1, 1]) p.dib(elip(s * 3.8, 2, 1.5, 3.4), { m, b: 1.5, luz: s > 0 ? -0.5 : 0.4 });
  p.dib(trazo([0, -13, 0, 7], 0.25), { m, t: 1, sinBorde: true, sinSombra: true });
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) p.dib(trazo([s * 3.6, -7.5 + i * 2.8, s * 0.6, -7 + i * 2.8], 0.2), { m, t: 2, sinBorde: true, sinSombra: true });
}
/** Figura humana en silueta: puntos de cabeza, cuello, cadera, manos, codos, rodillas y pies. */
export interface Pose { cab: number[]; cue: number[]; cad: number[]; ci: number[]; mi: number[]; cd: number[]; md: number[]; ri: number[]; pi: number[]; rd: number[]; pd: number[] }
export function figura(p: P, q: Pose, est: Est | string = { m: 'silueta', b: 1.2 }) {
  const e: Est = typeof est === 'string' ? { m: est, b: 1.2 } : est;
  p.dib(union(
    trazo([...q.cue, ...q.ci, ...q.mi], 1.05, 0.85), trazo([...q.cue, ...q.cd, ...q.md], 1.05, 0.85),
    trazo([...q.cad, ...q.ri, ...q.pi], 1.4, 1), trazo([...q.cad, ...q.rd, ...q.pd], 1.4, 1),
    trazo([...q.cue, ...q.cad], 2.4, 1.8), circ(q.cab[0], q.cab[1], 2.3)), e);
}
export function ojo(p: P, o: { iris?: string; blanco?: string; pupila?: 'redonda' | 'raja'; brillo?: boolean; ancho?: number } = {}) {
  const w = o.ancho ?? 1, lente = (g: number) => corte(circ(0, 10 * w, 14.5 * w + g), circ(0, -10 * w, 14.5 * w + g));
  p.dib(lente(0.9), { m: 'piel', b: 1.5, luz: -0.5 });
  p.dib(lente(0), { m: o.blanco ?? 'hueso', b: 3 });
  p.dib(corte(circ(0, 0, 5), lente(0)), o.brillo ? { m: o.iris ?? 'e_luz', e: true, b: 4, brillo: 1.2 } : { m: o.iris ?? 'zafiro', b: 5 });
  p.dib(o.pupila === 'raja' ? elip(0, 0, 1, 4.2) : circ(0, 0, 2), { m: 'sombra', t: 0 });
  p.punto(-1.8, -2, 'hueso', 5);
}
export function boca(p: P, o: { labio?: string; colmillos?: boolean; lengua?: boolean } = {}) {
  p.dib(elip(0, 0, 11, 9), { m: o.labio ?? 'carne', b: 3 });
  p.dib(elip(0, 1, 8, 6), { m: 'sombra', t: 0 });
  if (o.lengua) p.dib(elip(0, 4.5, 4.5, 2.4), { m: 'carne', b: 2, luz: 0.5 });
  for (let i = -3; i <= 3; i++) { const x = i * 2.3, big = o.colmillos && Math.abs(i) === 2, l = big ? 5.5 : 2.4;
    p.dib(poli(x - 1, -4.6 + Math.abs(i) * 0.3, x + 1, -4.6 + Math.abs(i) * 0.3, x, -4.6 + Math.abs(i) * 0.3 + l), { m: 'hueso', b: 0.8 });
    p.dib(poli(x - 1, 6.4 - Math.abs(i) * 0.4, x + 1, 6.4 - Math.abs(i) * 0.4, x, 6.4 - Math.abs(i) * 0.4 - l * 0.8), { m: 'hueso', b: 0.8, luz: -0.4 }); }
}
export function corazon(p: P, est: Est | string = { m: 'sangre', b: 4, trama: true }) {
  p.dib(fundir(1.2, circ(-4.2, -3, 5.6), circ(4.2, -3, 5.6), poli(-9.4, -1, 9.4, -1, 0, 11)), est);
}
export function gota(p: P, est: Est | string = { m: 'sangre', b: 5, trama: true }, k = 1) {
  p.con(0, 0, 0, k, () => p.dib(fundir(2, circ(0, 4, 7.5), poli(-4, 0, 0, -12.5, 4, 0)), est));
  p.con(0, 0, 0, k, () => p.dib(elip(-3, 3, 1.3, 2.4), { m: typeof est === 'string' ? est : est.m, t: 5, sinBorde: true, sinSombra: true }));
}
export function llama(p: P, o: { m?: string; k?: number; lenguas?: number; brillo?: number; seed?: number } = {}) {
  const m = o.m ?? 'e_fuego';
  p.con(0, 0, 0, o.k ?? 1, () => {
    const cuerpo = fundir(2.5, circ(0, 5, 6.2), poli(-5, 3, 0.5, -13, 5, 3), trazo(curva(-4, 4, -8, -2, -5.5, -8), 1.6, 0.3), trazo(curva(4, 3, 8.5, -1, 6.5, -6.5), 1.5, 0.3));
    p.dib(cuerpo, { m, e: true, b: 4.5, brillo: o.brillo ?? 1 });
  });
}
export function bolaFuego(p: P, o: { m?: string; r?: number; cola?: number } = {}) {
  const m = o.m ?? 'e_fuego', r = o.r ?? 6.5, c = o.cola ?? 13;
  p.dib(fundir(3, circ(0, 0, r), trazo([0, 0, -c * 0.7, -c * 0.7], r * 0.8, 0.4), trazo(curva(0, 0, -c * 0.4, -c * 0.2, -c * 0.95, -c * 0.35), r * 0.55, 0.2), trazo(curva(0, 0, -c * 0.2, -c * 0.4, -c * 0.35, -c * 0.95), r * 0.55, 0.2)), { m, e: true, b: r * 0.9, brillo: 1.4 });
}
export function cristal(p: P, o: { m?: string; largo?: number; ancho?: number } = {}) {
  const m = o.m ?? 'hielo', L = o.largo ?? 12, w = o.ancho ?? 4;
  p.dib(poli(0, -L, w, -L + w * 1.2, w, L - w * 1.2, 0, L, -w, L - w * 1.2, -w, -L + w * 1.2), { m, b: 0.8, luz: 0.6 });
  p.dib(poli(0, -L, w, -L + w * 1.2, w, L - w * 1.2, 0, L), { m, b: 0.8, luz: -0.9 });
  p.dib(trazo([0, -L + 1, 0, L - 1], 0.25), { m, t: 5, sinBorde: true, sinSombra: true });
}
export function copo(p: P, o: { m?: string; r?: number; emis?: boolean } = {}) {
  const r = o.r ?? 12, est: Est = o.emis ? { m: o.m ?? 'e_frio', e: true, b: 1.2 } : { m: o.m ?? 'hielo', b: 1, luz: 0.5 };
  const brazos = []; for (let i = 0; i < 6; i++) { const a = (i * PI) / 3 - PI / 2, c = Math.cos(a), s = Math.sin(a), q = (k: number, l: number) => [c * k - s * l, s * k + c * l];
    brazos.push(trazo([0, 0, c * r, s * r], 1.1, 0.6));
    for (const [k, l] of [[r * 0.5, r * 0.28], [r * 0.5, -r * 0.28], [r * 0.75, r * 0.18], [r * 0.75, -r * 0.18]]) { const [x1, y1] = q(k - r * 0.14, 0), [x2, y2] = q(k, l); brazos.push(trazo([x1, y1, x2, y2], 0.6, 0.4)); } }
  p.dib(union(...brazos, estrella(0, 0, 6, 1.6, 3.2, 0)), est);
}
export function rayo(p: P, o: { m?: string; k?: number } = {}) {
  p.con(0, 0, 0, o.k ?? 1, () => p.dib(poli(3, -15, -7.5, 1.5, -0.8, 1.5, -4, 15, 8, -3.5, 1.2, -3.5, 5.5, -15), { m: o.m ?? 'e_rayo', e: true, b: 2.4, brillo: 1.5 }));
}
/** Un rayo quebrado entre dos puntos (azar propio), grosor r. */
export function chispazo(p: P, x0: number, y0: number, x1: number, y1: number, o: { r?: number; m?: string; quiebre?: number; ramas?: number } = {}) {
  const n = 6, pts = [x0, y0], dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, q = o.quiebre ?? 2.2;
  for (let i = 1; i < n; i++) { const t = i / n, off = (p.R() - 0.5) * 2 * q; pts.push(x0 + dx * t + nx * off, y0 + dy * t + ny * off); }
  pts.push(x1, y1);
  p.dib(trazo(pts, o.r ?? 0.9, (o.r ?? 0.9) * 0.6), { m: o.m ?? 'e_rayo', e: true, b: 1, brillo: 1.2 });
  for (let k = 0; k < (o.ramas ?? 0); k++) { const i = 1 + Math.floor(p.R() * (n - 2)), bx = pts[i * 2], by = pts[i * 2 + 1], a = Math.atan2(dy, dx) + (p.R() < 0.5 ? -1 : 1) * (0.6 + p.R() * 0.5), l = L * 0.25;
    p.dib(trazo([bx, by, bx + Math.cos(a) * l * 0.5 + (p.R() - 0.5), by + Math.sin(a) * l * 0.5, bx + Math.cos(a) * l, by + Math.sin(a) * l], 0.5, 0.25), { m: o.m ?? 'e_rayo', e: true, b: 0.6 }); }
}
export function nube(p: P, o: { m?: string; k?: number; oscura?: boolean } = {}) {
  p.con(0, 0, 0, o.k ?? 1, () => p.dib(union(circ(-7, 1, 5), circ(-1, -3, 6.5), circ(6, 0, 5.2), caja(0, 3.5, 18, 5, 2.5)), { m: o.m ?? 'nube', b: 3.5, trama: true, luz: o.oscura ? -0.8 : 0 }));
}
export function remolino(p: P, o: { m?: string; vueltas?: number; r?: number; grosor?: number; brazos?: number } = {}) {
  const r = o.r ?? 12, br = o.brazos ?? 3;
  for (let k = 0; k < br; k++) { const pts: number[] = []; const a0 = (k / br) * PI * 2; for (let i = 0; i <= 18; i++) { const t = i / 18, a = a0 + t * (o.vueltas ?? 1.1) * PI * 2, rr = r * (0.2 + 0.8 * t); pts.push(Math.cos(a) * rr, Math.sin(a) * rr); }
    p.dib(trazo(pts, 0.4, o.grosor ?? 1.6), { m: o.m ?? 'e_viento', e: true, b: 1.4 }); }
}
export function tornado(p: P, o: { m?: string; e?: boolean } = {}) {
  const est: Est = o.e ? { m: o.m ?? 'e_viento', e: true, b: 1.5 } : { m: o.m ?? 'tierra', b: 1.6 };
  for (let i = 0; i < 6; i++) { const y = -12 + i * 4.6, w = 11 - i * 1.6, x = Math.sin(i * 1.1) * 1.5;
    p.dib(trazo(curva(x - w, y - 1, x, y + 2.4, x + w, y - 0.6), 1.3 - i * 0.08, 1), est); }
}
export function onda(p: P, o: { m?: string; n?: number; r0?: number; paso?: number; a0?: number; a1?: number; g?: number } = {}) {
  const n = o.n ?? 3, a0 = o.a0 ?? -PI * 0.85, a1 = o.a1 ?? -PI * 0.15;
  for (let i = 0; i < n; i++) p.dib(trazo(arcoPts(0, 0, (o.r0 ?? 5) + i * (o.paso ?? 3.6), a0, a1), (o.g ?? 1) * (1 - i * 0.12)), { m: o.m ?? 'e_fisico', e: true, b: 1, brillo: 0.8 });
}
export function anilloRunas(p: P, o: { m?: string; r?: number; n?: number } = {}) {
  const r = o.r ?? 12, m = o.m ?? 'e_luz';
  p.dib(hueco(circ(0, 0, r), 0.9), { m, e: true, b: 0.6, brillo: 0.6 }); p.dib(hueco(circ(0, 0, r - 2.6), 0.6), { m, e: true, b: 0.5, brillo: 0.4 });
  const n = o.n ?? 8; for (let i = 0; i < n; i++) { const a = (i / n) * PI * 2, x = Math.cos(a) * (r - 1.3), y = Math.sin(a) * (r - 1.3);
    p.con(x, y, a + PI / 2, 1, () => p.dib(i % 2 ? trazo([-0.6, -0.6, 0, 0.6, 0.6, -0.6], 0.3) : trazo([0, -0.7, 0, 0.7], 0.3), { m, e: true, t: 4 })); }
}
export function sol(p: P, o: { m?: string; r?: number; rayos?: number; largo?: number } = {}) {
  const r = o.r ?? 5.5, n = o.rayos ?? 12, L = o.largo ?? 13.5, m = o.m ?? 'e_luz';
  p.dib(estrella(0, 0, n, r + 1, L, -PI / 2), { m, e: true, b: 3, brillo: 1.2 });
  p.dib(circ(0, 0, r), { m, e: true, b: r, luz: 0.8, brillo: 1.5 });
}
export function campana(p: P, o: { m?: string } = {}) {
  const m = o.m ?? 'bronce';
  p.dib(union(poli(-10, 8, -8, 4, -7, -6, -4.5, -10, 0, -11, 4.5, -10, 7, -6, 8, 4, 10, 8), caja(0, 8.2, 22, 2.6, 1.2)), { m, b: 3.2, trama: true });
  p.dib(caja(0, -12.2, 4, 2.4, 0.8), m);
  p.dib(circ(1, 11.5, 2), { m: 'hierro', b: 2 });
  p.dib(trazo([-5, -7, -6, 3], 0.5), { m, t: 5, sinBorde: true, sinSombra: true });
}
export function corona(p: P, o: { m?: string; gemas?: string[]; picos?: number } = {}) {
  const m = o.m ?? 'oro';
  p.dib(union(poli(-12, 7, -12, -6, -7, 0, -3.5, -9, 0, -2, 3.5, -9, 7, 0, 12, -6, 12, 7), caja(0, 6, 24, 4.4, 0.8)), { m, b: 1.6 });
  const g = o.gemas ?? ['rubi', 'zafiro', 'rubi'];
  [[-6, 6], [0, 6], [6, 6]].forEach(([x, y], i) => p.dib(circ(x, y, 1.6), { m: g[i % g.length], b: 1.6 }));
  for (const [x, y] of [[-12, -6], [-3.5, -9], [3.5, -9], [12, -6]]) p.dib(circ(x, y, 1.3), { m: 'oro', b: 1.3, luz: 0.5 });
}
export function frasco(p: P, o: { liquido?: string; vidrio?: string; nivel?: number; corcho?: string; alto?: boolean; brillo?: number } = {}) {
  const v = o.vidrio ?? 'vidrio', liq = o.liquido ?? 'e_fuego', alto = !!o.alto;
  const cuerpo = alto ? fundir(1.5, caja(0, 3, 12, 15, 4), caja(0, -6.5, 5, 5, 1)) : fundir(1.5, circ(0, 3.5, 8.5), caja(0, -6, 4.6, 6, 1));
  p.dib(cuerpo, { m: v, b: 3, luz: -0.5 });
  const nivel = o.nivel ?? -1, adentro = alto ? caja(0, 3, 10, 13, 3.2) : circ(0, 3.5, 7.2);
  const liqE: Est = liq.startsWith('e_') ? { m: liq, e: true, b: 4, brillo: o.brillo ?? 1 } : { m: liq, b: 4, trama: true };
  p.dib(corte(adentro, caja(0, 6 + nivel, 30, 14, 0)), liqE);
  p.dib(trazo(alto ? [-3.5, -1, -3.5, 7] : arcoPts(0, 3.5, 5.6, PI * 1.05, PI * 1.45, 6), 0.55), { m: v, t: 5, sinBorde: true, sinSombra: true });
  p.dib(caja(0, alto ? -10 : -9.6, 5.4, 3, 0.6), { m: o.corcho ?? 'madera', b: 1 });
}
export function bomba(p: P, o: { m?: string; mecha?: boolean } = {}) {
  p.dib(circ(0, 2, 9), { m: o.m ?? 'hierro', b: 7, trama: true });
  p.dib(caja(3.8, -6, 4, 3, 0.6), { m: 'bronce', b: 1 });
  if (o.mecha !== false) { p.dib(trazo(curva(4.5, -7.5, 7, -11, 10, -10.5), 0.5), { m: 'cuero', b: 0.5 }); p.chispa(10.5, -11, 'e_fuego', true); p.brillo(10.5, -11, 4, 0.8); }
}
export function cepo(p: P, o: { m?: string } = {}) {
  const m = o.m ?? 'hierro';
  for (const s of [-1, 1]) {
    const pts: number[] = []; for (let i = 0; i <= 12; i++) { const t = i / 12, a = PI + t * PI; pts.push(Math.cos(a) * 11, s * (Math.sin(a) * 6.5) + s * 1); }
    p.dib(trazo(pts, 1.1), { m, b: 1 });
    for (let i = 1; i < 6; i++) { const a = PI + (i / 6) * PI, x = Math.cos(a) * 11, y = s * Math.sin(a) * 6.5 + s; p.dib(poli(x - 1.2, y, x + 1.2, y, x, y + s * 3.4), { m: 'acero', b: 0.8 }); }
  }
  p.dib(circ(0, 0, 2.6), { m: 'hierro', b: 2.6 }); p.dib(caja(0, 0, 26, 1.6, 0.6), { m, b: 0.8 });
}
export function moneda(p: P, o: { m?: string; r?: number; signo?: boolean } = {}) {
  const r = o.r ?? 6, m = o.m ?? 'oro';
  p.dib(circ(0, 0, r), { m, b: 1.3 }); p.dib(hueco(circ(0, 0, r - 1.8), 0.5), { m, t: 2, sinBorde: true, sinSombra: true });
  if (o.signo !== false) p.dib(estrella(0, 0, 4, r * 0.18, r * 0.45, 0), { m, t: 4, sinBorde: true });
}
export function relojArena(p: P, o: { arena?: string; marco?: string } = {}) {
  const mc = o.marco ?? 'madera';
  p.dib(poli(-7, -10, 7, -10, 1.2, 0, 7, 10, -7, 10, -1.2, 0), { m: 'vidrio', b: 2, luz: -0.6 });
  p.dib(poli(-4, -7.2, 4, -7.2, 0.6, -1.5, -0.6, -1.5), { m: o.arena ?? 'oro', b: 1.2 });
  p.dib(poli(-6, 9, 6, 9, 0, 4.5), { m: o.arena ?? 'oro', b: 1.2 });
  p.dib(trazo([0, -1, 0, 5], 0.35), { m: o.arena ?? 'oro', t: 4, sinBorde: true });
  p.dib(caja(0, -11.5, 18, 2.6, 0.8), mc); p.dib(caja(0, 11.5, 18, 2.6, 0.8), mc);
  for (const sx of [-1, 1]) p.dib(trazo([sx * 8, -11, sx * 8, 11], 0.75), mc);
}
export function cadena(p: P, x0: number, y0: number, x1: number, y1: number, o: { m?: string; n?: number } = {}) {
  const n = o.n ?? 5, a = Math.atan2(y1 - y0, x1 - x0);
  for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t;
    p.con(x, y, a, 1, () => p.dib(hueco(elip(0, 0, 2.4, i % 2 ? 0.8 : 1.6), 0.8), { m: o.m ?? 'hierro', b: 0.7, luz: i % 2 ? -0.6 : 0.2 })); }
}
export function libro(p: P, o: { tapa?: string } = {}) {
  p.dib(poli(-13, -6, 0, -4, 13, -6, 13, 6, 0, 8, -13, 6), { m: o.tapa ?? 'tela', b: 1 });
  p.dib(poli(-12, -7, 0, -5, 0, 6.5, -12, 4.5), { m: 'pergamino', b: 1.2, luz: 0.3 });
  p.dib(poli(12, -7, 0, -5, 0, 6.5, 12, 4.5), { m: 'pergamino', b: 1.2, luz: -0.3 });
  for (let i = 0; i < 3; i++) for (const s of [-1, 1]) p.dib(trazo([s * 2.5, -3 + i * 2.4, s * 9.5, -4.6 + i * 2.4], 0.25), { m: 'pergamino', t: 1, sinBorde: true, sinSombra: true });
}
export function vela(p: P) {
  p.dib(caja(0, 4, 5, 14, 1.2), { m: 'vela', b: 2 });
  p.dib(trazo(curva(-2.4, -2.5, -3.2, 2, -2.6, 4), 0.6), { m: 'vela', t: 4, sinBorde: true });
  p.con(0, -5.5, 0, 0.42, () => llama(p, { m: 'e_luz', brillo: 2 }));
  p.dib(caja(0, 11.5, 10, 2.4, 0.8), 'bronce');
}

// ================================================================ bestias
export function cabezaLobo(p: P, o: { m?: string; ojos?: string; boca?: boolean } = {}) {
  const m = o.m ?? 'lobo';
  p.dib(union(poli(-11, -12, -6.5, -4, -10, 0, -8, 5, -3, 11, 0, 13, 3, 11, 8, 5, 10, 0, 6.5, -4, 11, -12, 4, -6.5, -4, -6.5)), { m, b: 3, trama: true });
  for (const s of [-1, 1]) p.dib(poli(s * 10, -10, s * 6.5, -5, s * 5, -7), { m: 'carne', t: 2 });
  p.dib(poli(-4, 1, 4, 1, 2.6, 9, 0, 10.5, -2.6, 9), { m, b: 2.5, luz: 0.8 });
  p.dib(elip(0, 9.4, 2.2, 1.4), { m: 'sombra', t: 1 });
  for (const s of [-1, 1]) p.dib(poli(s * 6.4, -2.4, s * 2.6, -1.4, s * 3.4, 0.4), { m: o.ojos ?? 'e_luz', e: true, b: 0.8, brillo: 1.4 });
  if (o.boca) { p.dib(poli(-3.5, 10, 3.5, 10, 2, 14, -2, 14), { m: 'sombra', t: 0 }); for (const s of [-1, 1]) p.dib(poli(s * 2.6, 10, s * 1.4, 10, s * 2, 13), { m: 'hueso', t: 5 }); }
}
export function cabezaOso(p: P, o: { m?: string; ojos?: string; rugido?: boolean } = {}) {
  const m = o.m ?? 'pelaje';
  for (const s of [-1, 1]) { p.dib(circ(s * 8.5, -9, 3.6), { m, b: 2.5 }); p.dib(circ(s * 8.5, -9, 1.8), { m: 'carne', t: 2 }); }
  p.dib(fundir(3, circ(0, -1, 11), elip(0, 6, 8.5, 6)), { m, b: 4, trama: true });
  p.dib(elip(0, 5.5, 5.5, 4.2), { m: 'pelaje', b: 3, luz: 1 });
  p.dib(elip(0, 2.6, 2.4, 1.6), { m: 'sombra', t: 1 });
  for (const s of [-1, 1]) p.dib(circ(s * 4.6, -3, 1.2), o.ojos ? { m: o.ojos, e: true, b: 1.2, brillo: 1.2 } : { m: 'sombra', t: 0 });
  if (o.rugido) { p.dib(elip(0, 8, 3.8, 3), { m: 'sombra', t: 0 }); for (const s of [-1, 1]) p.dib(poli(s * 3, 5.6, s * 1.6, 5.6, s * 2.3, 8.6), { m: 'hueso', t: 5 }); }
}
/** Ave de frente con las alas abiertas (halcón, cuervo). */
export function aveAbierta(p: P, o: { m?: string; pecho?: string; pico?: string } = {}) {
  const m = o.m ?? 'pelaje';
  for (const s of [-1, 1]) p.dib(poli(0, -2, s * 6, -6, s * 13, -10, s * 15, -7, s * 12, -4, s * 14, -3, s * 10.5, 0, s * 12, 1.5, s * 8, 3, s * 3, 4), { m, b: 2, luz: s > 0 ? -0.4 : 0.2 });
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) p.dib(trazo([s * (5 + i * 2.6), -3.5 - i * 0.8, s * (9 + i * 2), -1 - i * 1.5], 0.25), { m, t: 1, sinBorde: true, sinSombra: true });
  p.dib(fundir(1, elip(0, 2, 3.4, 6), circ(0, -5.5, 2.8)), { m: o.pecho ?? m, b: 2.5, luz: 0.4 });
  p.dib(poli(-2.5, 7, 2.5, 7, 0, 12), { m, b: 1 });
  p.dib(poli(-0.9, -4.4, 0.9, -4.4, 0, -1.8), { m: o.pico ?? 'oro', b: 0.6 });
  for (const s of [-1, 1]) p.punto(s * 1.2, -6, 'oro', 5);
}
/** Ave de perfil volando (a la derecha). */
export function aveVuelo(p: P, o: { m?: string; pico?: string; ojo?: string } = {}) {
  const m = o.m ?? 'pelaje';
  p.dib(poli(-1, -1, -6, -11, -3, -12, 4, -4), { m, b: 1.5, luz: 0.4 });
  p.dib(fundir(1.2, elip(0, 0, 6.5, 2.6), circ(5.5, -1.3, 2.3), poli(-5, -1.5, -11, -3.5, -11, 2, -5, 1.5)), { m, b: 2 });
  p.dib(poli(7.4, -2.2, 10.5, -0.8, 7.6, 0), { m: o.pico ?? 'oro', b: 0.6 });
  p.dib(poli(-1, 0, -7, 7, -3, 8, 3, 1), { m, b: 1.5, luz: -0.6 });
  p.punto(6, -2, o.ojo ?? 'oro', 5, !!o.ojo);
}
/** Cuervo posado de perfil (mira a la derecha). */
export function cuervo(p: P, o: { m?: string; ojo?: string } = {}) {
  const m = o.m ?? 'cuervo';
  p.dib(fundir(1.5, elip(-1, 1, 6.5, 4.6), circ(5, -4, 3.2), poli(-6, 0, -13, 5, -12, 7, -5, 4)), { m, b: 2.5 });
  p.dib(poli(7, -5.6, 12, -3.6, 7.4, -2.4), { m: 'hierro', b: 0.8 });
  p.dib(poli(-4, -1, 3, -2, 1, 4, -8, 4), { m, b: 1.2, luz: -0.6 });
  p.punto(5.6, -4.6, o.ojo ?? 'e_sangre', 5, true);
  p.dib(trazo([0, 5, -0.5, 9], 0.4), { m: 'hierro', b: 0.4 }); p.dib(trazo([2, 5, 2.5, 9], 0.4), { m: 'hierro', b: 0.4 });
}
export function pluma(p: P, o: { m?: string; canon?: string } = {}) {
  p.dib(fundir(0.5, poli(0, -14, 4.5, -6, 4, 4, 0.6, 11, -0.6, 11, -4, 4, -4.5, -6)), { m: o.m ?? 'pelaje', b: 3 });
  for (let i = 0; i < 5; i++) { const y = -8 + i * 3.6; p.dib(trazo([0, y + 2, -3.8, y - 0.5], 0.22), { m: o.m ?? 'pelaje', t: 1, sinBorde: true, sinSombra: true }); }
  p.dib(trazo([0, -12, 0, 14], 0.45), { m: o.canon ?? 'hueso', b: 0.4 });
}
export function ala(p: P, o: { m?: string; emis?: boolean } = {}) {
  const est: Est = o.emis ? { m: o.m ?? 'e_luz', e: true, b: 2 } : { m: o.m ?? 'hueso', b: 1.6 };
  p.dib(poli(-12, 8, -9, -2, -2, -10, 8, -13, 13, -11, 9, -8, 12, -6, 7, -3, 10, -1, 4, 2, 6, 4, -2, 6), est);
  for (let i = 0; i < 4; i++) p.dib(trazo([-8 + i * 3, 4 - i * 1.4, 6 - i * 0.5, -10 + i * 3.5], 0.22), { ...est, t: o.emis ? 3 : 1, sinBorde: true, sinSombra: true, e: est.e });
}
export function garra(p: P, o: { m?: string; n?: number; sangre?: boolean } = {}) {
  const n = o.n ?? 3;
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 6;
    p.con(x, 0, 0.25, 1, () => p.dib(poli(-2.2, 12, -1.5, 0, 0.5, -9, 2.8, -14, 1.8, -6, 2, 4, 2.2, 12), { m: o.m ?? 'hueso', b: 1.8 }));
    if (o.sangre) p.dib(circ(x + 1.5, 13, 1.1), { m: 'sangre', b: 1 }); }
}
/** Tres tajos de garra (las heridas): emisivos. */
export function tajos(p: P, o: { m?: string; n?: number; largo?: number; g?: number } = {}) {
  const n = o.n ?? 3, L = o.largo ?? 13;
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 6;
    p.dib(trazo(curva(x - 5, -L, x + 1, -2, x + 5, L), 0.25, o.g ?? 1.5), { m: o.m ?? 'e_sangre', e: true, b: 1.2, brillo: 0.8 }); }
}
export function colmillo(p: P, m = 'hueso') { p.dib(poli(-2.6, -10, 2.6, -10, 1.8, 0, 0, 10, -1, 2), { m, b: 2 }); }
export function cornamenta(p: P, o: { m?: string } = {}) {
  const m = o.m ?? 'hueso';
  for (const s of [-1, 1]) {
    p.dib(trazo(curva(s * 2, 6, s * 6, -2, s * 6, -9, s * 11, -14), 1.2, 0.6), { m, b: 1 });
    p.dib(trazo([s * 5.5, -1, s * 11, -4, s * 13, -3], 0.8, 0.4), { m, b: 0.8 });
    p.dib(trazo([s * 6.2, -7, s * 4, -12, s * 4.6, -14], 0.7, 0.35), { m, b: 0.7 });
  }
}
export function ciervoSalto(p: P, m = 'pelaje') {
  p.dib(fundir(1.5, elip(0, 0, 8, 3.6), trazo([5.5, -1, 9, -6], 2, 1.6), elip(10.5, -7.5, 2.8, 1.8),
    trazo([-6, 1, -11, 7, -14, 9], 1, 0.6), trazo([-4, 2, -8, 6, -12, 5], 0.9, 0.6), trazo([5, 2, 10, 4, 13, 8], 0.9, 0.6), trazo([3.5, 2.5, 8, 7, 9.5, 11], 0.9, 0.6), poli(-8, -1.5, -11, -4, -8, -2)), { m, b: 2 });
  p.dib(trazo(curva(9, -9, 8, -13, 5, -15), 0.5, 0.3), { m: 'hueso', b: 0.5 }); p.dib(trazo(curva(10, -9, 11, -13, 13, -15), 0.5, 0.3), { m: 'hueso', b: 0.5 });
  p.dib(elip(-1, 1.2, 5, 1.6), { m, t: 5, sinBorde: true, sinSombra: true });
}
export function serpiente(p: P, m = 'esmeralda') {
  p.dib(trazo(curva(-12, 10, 8, 12, -10, -2, 6, -6), 1.8, 1.2), { m, b: 1.6 });
  p.dib(elip(7.5, -7, 3.2, 2.2), { m, b: 2 });
  p.dib(trazo([10, -6.5, 13, -5.5, 14, -7, 13, -5.5, 14, -4], 0.25), { m: 'sangre', t: 4 });
}

// ================================================================ naturaleza
export function arbol(p: P, o: { copa?: string; tronco?: string; cara?: boolean; ojos?: string } = {}) {
  const t = o.tronco ?? 'corteza';
  p.dib(union(poli(-3.5, 14, -2.5, 0, 2.5, 0, 3.5, 14), trazo(curva(-1, 2, -5, -1, -9, -4), 1.1, 0.5), trazo(curva(1, 1, 5, -2, 8, -6), 1.1, 0.5), poli(-3.5, 13, -8, 15, 8, 15, 3.5, 13)), { m: t, b: 1.6 });
  p.dib(union(circ(-6.5, -6, 5.6), circ(6.5, -6.5, 5.6), circ(0, -11, 6.5), circ(0, -4.5, 5.4)), { m: o.copa ?? 'hoja', b: 3.5, trama: true });
  if (o.cara) { for (const s of [-1, 1]) p.dib(elip(s * 1.6, 5, 0.9, 0.6), o.ojos ? { m: o.ojos, e: true, b: 0.8, brillo: 1.4 } : { m: 'sombra', t: 0 }); p.dib(elip(0, 8.5, 1.2, 1.6), { m: 'sombra', t: 0 }); }
}
export function raiz(p: P, o: { m?: string; n?: number } = {}) {
  const m = o.m ?? 'corteza', n = o.n ?? 3;
  for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 7, s = i % 2 ? 1 : -1;
    p.dib(trazo(curva(x * 0.4, 14, x - s * 4, 4, x + s * 3, -4, x - s * 1, -13), 2.4, 0.3), { m, b: 1.6 }); }
}
export function enredadera(p: P, o: { m?: string; hojas?: string } = {}) {
  const m = o.m ?? 'hoja', pts: number[] = []; for (let i = 0; i <= 30; i++) { const t = i / 30, a = t * PI * 4.2, r = 11 * (1 - t * 0.75); pts.push(Math.cos(a) * r, Math.sin(a) * r * 0.85 + (t - 0.5) * 4); }
  p.dib(trazo(pts, 1.3, 0.4), { m: 'corteza', b: 1.2 });
  for (let i = 3; i < 30; i += 5) { const x = pts[i * 2], y = pts[i * 2 + 1]; p.con(x, y, i * 0.9, 1, () => p.dib(fundir(0.4, elip(1.8, 0, 2.2, 1.2), circ(0, 0, 0.4)), { m: o.hojas ?? m, b: 1.2 })); }
}
export function espinas(p: P, o: { m?: string; r?: number; n?: number } = {}) {
  const r = o.r ?? 12, n = o.n ?? 8, pts: number[] = [];
  for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * PI * 2, rr = i % 2 ? r * 0.45 : r; pts.push(Math.cos(a) * rr, Math.sin(a) * rr); }
  p.dib(poli(...pts), { m: o.m ?? 'corteza', b: 2 });
}
export function hoja(p: P, o: { m?: string; k?: number } = {}) {
  p.con(0, 0, 0, o.k ?? 1, () => { p.dib(fundir(0.6, poli(0, -13, 6, -4, 5, 5, 0, 11, -5, 5, -6, -4)), { m: o.m ?? 'hoja', b: 3 });
    p.dib(trazo([0, -11, 0, 13], 0.4), { m: o.m ?? 'hoja', t: 1, sinBorde: true, sinSombra: true });
    for (let i = 0; i < 3; i++) for (const s of [-1, 1]) p.dib(trazo([0, -5 + i * 4, s * 3.8, -8 + i * 4], 0.22), { m: o.m ?? 'hoja', t: 1, sinBorde: true, sinSombra: true }); });
}
export function hongo(p: P, o: { sombrero?: string; k?: number } = {}) {
  p.con(0, 0, 0, o.k ?? 1, () => { p.dib(caja(0, 3, 4, 8, 1.5), { m: 'hueso', b: 1.6 }); p.dib(corte(elip(0, -1.5, 8, 6), caja(0, -5, 20, 9)), { m: o.sombrero ?? 'hongo', b: 3 });
    for (const [x, y] of [[-3.5, -4], [2, -5.2], [4.6, -2.5]]) p.dib(circ(x, y, 0.8), { m: 'hueso', t: 5, sinBorde: true }); });
}
export function loto(p: P, o: { m?: string; centro?: string } = {}) {
  const m = o.m ?? 'oro';
  for (const [a, k, l] of [[-1.25, 0.8, -0.6], [1.25, 0.8, -0.6], [-0.65, 0.95, 0], [0.65, 0.95, 0], [0, 1.05, 0.5]] as [number, number, number][])
    p.con(0, 6, a, k, () => p.dib(fundir(1, poli(0, -15, 4.2, -6, 0, 0, -4.2, -6)), { m, b: 2.5, luz: l }));
  p.dib(elip(0, 7, 9, 2.4), { m: 'hoja', b: 2 });
  p.dib(circ(0, 1, 2), { m: o.centro ?? 'e_luz', e: true, b: 2, brillo: 1.5 });
}
export function montana(p: P, o: { m?: string; nieve?: string } = {}) {
  p.dib(poli(-15, 10, -6, -6, -2, -1, 3, -10, 15, 10), { m: o.m ?? 'piedra', b: 2 });
  p.dib(poli(3, -10, 15, 10, 5, 10, 4, 2, 1, -2), { m: o.m ?? 'piedra', b: 1.5, luz: -1.1, sinSombra: true });
  p.dib(poli(-6, -6, -2, -1, -5, 10, -11, 10, -7, 2), { m: o.m ?? 'piedra', b: 1.5, luz: -0.9, sinSombra: true });
  for (const [x0, y0, x1, y1] of [[-9, 4, -7, 9], [8, 2, 11, 9], [0, 3, 1, 9]]) p.dib(trazo([x0, y0, x1, y1], 0.3), { m: o.m ?? 'piedra', t: 1, sinBorde: true, sinSombra: true });
  p.dib(poli(-8.5, -2, -6, -6, -3.4, -2.6, -5, -1, -6.5, -3), { m: o.nieve ?? 'hielo', b: 1, luz: 1 });
  p.dib(poli(0, -5.5, 3, -10, 6.5, -4, 4.5, -5, 3, -3.5, 1.5, -5), { m: o.nieve ?? 'hielo', b: 1, luz: 1 });
}
export function grieta(p: P, o: { m?: string; borde?: string } = {}) {
  p.dib(poli(-14, 6, -15, 12, 15, 12, 14, 6, 6, 4, -6, 4), { m: o.borde ?? 'tierra', b: 1.5 });
  p.dib(poli(-11, 8, -4, 6.5, 0, 9, 5, 6.5, 11, 8, 4, 10, 0, 11.5, -5, 10), { m: o.m ?? 'e_fuego', e: true, b: 1.2, brillo: 1.4 });
}
export function piedra(p: P, o: { m?: string; k?: number } = {}) { p.con(0, 0, 0, o.k ?? 1, () => p.dib(poli(-7, 4, -6, -2, -2, -6, 4, -5, 7, -1, 6, 4, 1, 6), { m: o.m ?? 'piedra', b: 2 })); }
export function luna(p: P, o: { m?: string; r?: number } = {}) {
  const r = o.r ?? 10; p.dib(resta(circ(0, 0, r), circ(r * 0.45, -r * 0.25, r * 0.85)), o.m?.startsWith('e_') ? { m: o.m, e: true, b: 3 } : { m: o.m ?? 'hueso', b: 3 });
}

// ================================================================ magia y signos
export function cruz(p: P, o: { m?: string; emis?: boolean; k?: number } = {}) {
  p.con(0, 0, 0, o.k ?? 1, () => p.dib(union(caja(0, 1, 4.2, 26, 0.8), caja(0, -5, 17, 4.2, 0.8)), o.emis ? { m: o.m ?? 'e_luz', e: true, b: 2, brillo: 1.3 } : { m: o.m ?? 'oro', b: 1.6 }));
}
export function halo(p: P, o: { m?: string; r?: number; g?: number; ry?: number } = {}) {
  p.dib(hueco(elip(0, 0, o.r ?? 8, o.ry ?? (o.r ?? 8) * 0.35), o.g ?? 1.2), { m: o.m ?? 'e_luz', e: true, b: 0.8, brillo: 1 });
}
export function orbe(p: P, o: { m?: string; r?: number; e?: boolean } = {}) {
  const r = o.r ?? 8; p.dib(circ(0, 0, r), o.e === false ? { m: o.m ?? 'zafiro', b: r, trama: true } : { m: o.m ?? 'e_arcano', e: true, b: r, brillo: 1.4 });
  p.punto(-r * 0.4, -r * 0.45, 'hueso', 5);
}
export function estallido(p: P, o: { m?: string; n?: number; r0?: number; r1?: number; rot?: number } = {}) {
  p.dib(estrella(0, 0, o.n ?? 8, o.r0 ?? 4, o.r1 ?? 13, o.rot ?? -PI / 2), { m: o.m ?? 'e_fuego', e: true, b: 3.5, brillo: 1.5 });
}
/** Esquirlas que salen en anillo (polígonos finos). */
export function esquirlas(p: P, o: { m?: string; n?: number; r0?: number; r1?: number; ancho?: number; rot?: number; e?: boolean } = {}) {
  const n = o.n ?? 8, r0 = o.r0 ?? 6, r1 = o.r1 ?? 14, w = o.ancho ?? 1.6;
  for (let i = 0; i < n; i++) { const a = (o.rot ?? 0) + (i / n) * PI * 2;
    p.con(Math.cos(a) * r0, Math.sin(a) * r0, a, 1, () => p.dib(poli(0, -w, r1 - r0, 0, 0, w, -1, 0), o.e === false ? { m: o.m ?? 'hielo', b: 0.8, luz: 0.4 } : { m: o.m ?? 'e_frio', e: true, b: 1 })); }
}
export function lineasVelocidad(p: P, o: { m?: string; n?: number; x0?: number; x1?: number; y0?: number; y1?: number } = {}) {
  const n = o.n ?? 4; for (let i = 0; i < n; i++) { const y = (o.y0 ?? -8) + (((o.y1 ?? 8) - (o.y0 ?? -8)) * i) / Math.max(1, n - 1), l = 4 + ((i * 7) % 5);
    p.dib(trazo([(o.x0 ?? -14), y, (o.x0 ?? -14) + l + (o.x1 ?? 0), y], 0.2, 0.55), { m: o.m ?? 'e_viento', e: true, b: 0.5, brillo: 0.4 }); }
}
/** Tajo curvo del arma (arco de corte), del ángulo a0 al a1. */
export function tajo(p: P, o: { m?: string; r?: number; a0?: number; a1?: number; g?: number } = {}) {
  p.dib(trazo(arcoPts(0, 0, o.r ?? 12, o.a0 ?? -PI * 0.9, o.a1 ?? -PI * 0.1, 18), 0.3, o.g ?? 2.2), { m: o.m ?? 'e_fisico', e: true, b: 1.4, brillo: 1 });
}
export function ojoMagico(p: P, o: { m?: string; iris?: string } = {}) {
  const lente = corte(circ(0, 9, 15), circ(0, -9, 15));
  p.dib(hueco(lente, 1.4), { m: o.m ?? 'e_luz', e: true, b: 1, brillo: 1.2 });
  p.dib(circ(0, 0, 4.4), { m: o.iris ?? 'sombra', t: 0 });
  p.dib(circ(0, 0, 2.4), { m: o.m ?? 'e_luz', e: true, b: 2.4 });
  for (let i = -2; i <= 2; i++) p.dib(trazo([i * 4.6, -6.6 + Math.abs(i) * 1.4, i * 6, -10 + Math.abs(i) * 1.6], 0.5), { m: o.m ?? 'e_luz', e: true, b: 0.5 });
}
export function portal(p: P, o: { m?: string; r?: number } = {}) {
  const r = o.r ?? 7; p.dib(hueco(elip(0, 0, r, r * 1.35), 1.6), { m: o.m ?? 'e_rayo', e: true, b: 1, brillo: 1.2 });
  p.dib(elip(0, 0, r - 1.6, r * 1.35 - 1.6), { m: 'sombra', t: 0, sinBorde: true });
}
export function tumba(p: P, o: { m?: string; cruz?: boolean } = {}) {
  p.dib(union(caja(0, 4, 13, 16, 0.8), circ(0, -3.5, 6.5)), { m: o.m ?? 'piedra', b: 1.6 });
  if (o.cruz !== false) p.dib(union(caja(0, 0, 1.6, 9), caja(0, -2, 6, 1.6)), { m: o.m ?? 'piedra', t: 1, sinBorde: true, sinSombra: true });
  p.dib(poli(-11, 13, 11, 13, 13, 15, -13, 15), { m: 'tierra', b: 1 });
}
export function yunque(p: P) {
  p.dib(union(poli(-13, -6, 8, -6, 13, -4.5, 8, -2, 5, -2, 4, 3, 7, 7, -7, 7, -4, 3, -5, -2, -10, -2), caja(0, 8.5, 16, 3, 0.8)), { m: 'hierro', b: 1.4 });
  p.dib(trazo([-12, -6, 7, -6], 0.4), { m: 'hierro', t: 5, sinBorde: true, sinSombra: true });
}
export function cuerno(p: P, o: { m?: string; bandas?: string } = {}) {
  const m = o.m ?? 'hueso';
  p.dib(trazo(curva(-12, 6, -6, 9, 4, 4, 9, -8), 1, 4.2), { m, b: 2.4 });
  p.dib(elip(9, -8.5, 4.6, 2.2), { m: 'sombra', t: 0 });
  for (const t of [0.35, 0.6, 0.82]) { const pt = curva(-12, 6, -6, 9, 4, 4, 9, -8), i = Math.round(t * 14); p.dib(circ(pt[i * 2], pt[i * 2 + 1], 1 + t * 3.4), { m: o.bandas ?? 'bronce', b: 1.2 }); }
}
export function tambor(p: P) {
  p.dib(caja(0, 2, 18, 12, 2), { m: 'madera', b: 2 }); p.dib(elip(0, -4, 9, 3), { m: 'cuero', b: 2, luz: 1 });
  for (let i = -2; i <= 2; i++) p.dib(trazo([i * 3.6, -2, i * 3.6 + 1.8, 7.5], 0.3), { m: 'hueso', t: 4, sinBorde: true });
}
export function engranaje(p: P, o: { m?: string; r?: number; n?: number } = {}) {
  const r = o.r ?? 8, n = o.n ?? 8;
  p.dib(resta(union(circ(0, 0, r), ...Array.from({ length: n }, (_, i) => { const a = (i / n) * PI * 2; return caja(Math.cos(a) * r, Math.sin(a) * r, 3, 3, 0.4); })), circ(0, 0, r * 0.35)), { m: o.m ?? 'bronce', b: 1.4 });
}
export function resorte(p: P, o: { m?: string } = {}) {
  const pts: number[] = []; for (let i = 0; i <= 40; i++) { const t = i / 40, a = t * PI * 10; pts.push(Math.cos(a) * 6, -12 + t * 24 + Math.sin(a) * 1.4); }
  p.dib(trazo(pts, 1), { m: o.m ?? 'acero', b: 1 });
}
export function huellaGarra(p: P, m = 'tierra') {
  p.dib(elip(0, 3, 5, 4.2), { m, b: 2.5 });
  for (const [x, y] of [[-5.5, -3], [-2, -6], [2, -6], [5.5, -3]]) { p.dib(elip(x, y, 1.9, 2.4), { m, b: 1.5 }); p.dib(poli(x - 0.8, y - 2, x + 0.8, y - 2, x, y - 5), { m: 'hueso', b: 0.6 }); }
}
export function barril(p: P) {
  p.dib(fundir(1, elip(0, 0, 9, 12), caja(0, 0, 15, 22, 3)), { m: 'madera', b: 4, trama: true });
  for (const y of [-7, 7]) p.dib(caja(0, y, 17, 2, 0.6), { m: 'hierro', b: 0.8 });
  for (const x of [-4, 0, 4]) p.dib(trazo([x, -10, x, 10], 0.25), { m: 'madera', t: 1, sinBorde: true, sinSombra: true });
}
export function caldero(p: P, o: { m?: string; liquido?: string } = {}) {
  p.dib(fundir(1, corte(circ(0, -1, 12), caja(0, 6, 30, 22)), caja(0, -4, 24, 3, 1.2)), { m: o.m ?? 'hierro', b: 5, trama: true });
  p.dib(elip(0, -4.4, 10.5, 2.3), { m: o.liquido ?? 'e_fuego', e: true, b: 2, brillo: 1.6 });
  for (const s of [-1, 1]) p.dib(trazo([s * 7, 9, s * 9, 13.5], 1), { m: o.m ?? 'hierro', b: 1 });
}
export function burbujas(p: P, o: { m?: string; n?: number; x?: number; y?: number; r?: number } = {}) {
  for (let i = 0; i < (o.n ?? 4); i++) { const x = (o.x ?? 0) + (p.R() - 0.5) * (o.r ?? 10), y = (o.y ?? 0) - p.R() * (o.r ?? 10), r = 0.8 + p.R() * 1.4;
    p.dib(hueco(circ(x, y, r), 0.5), { m: o.m ?? 'e_veneno', e: true, b: 0.5, brillo: 0.4 }); }
}
export function mosca(p: P, x: number, y: number) { p.dib(elip(x, y, 1, 0.7), { m: 'sombra', t: 0, sinBorde: true }); p.punto(x - 0.6, y - 1.2, 'vidrio', 4); p.punto(x + 0.6, y - 1.2, 'vidrio', 4); }
export function espectro(p: P, o: { m?: string } = {}) {
  const m = o.m ?? 'e_alma';
  p.dib(fundir(2, circ(0, -6, 6), poli(-6.5, -5, 6.5, -5, 8, 10, 4.5, 6.5, 2, 12, -1, 7, -4, 12, -6, 7, -9, 10)), { m, e: true, b: 5, brillo: 1.3 });
  for (const s of [-1, 1]) p.dib(elip(s * 2.3, -6.5, 1.2, 1.8), { m: 'sombra', t: 0, sinBorde: true });
  p.dib(elip(0, -2.4, 1.3, 1.9), { m: 'sombra', t: 0, sinBorde: true });
}
export function sello(p: P, o: { cera?: string; signo?: (p: P) => void } = {}) {
  p.dib(union(circ(0, 0, 9), ...Array.from({ length: 9 }, (_, i) => circ(Math.cos(i * 0.7) * 8.4, Math.sin(i * 0.7) * 8.4, 2.4))), { m: o.cera ?? 'cera', b: 2.5 });
  p.dib(hueco(circ(0, 0, 6.2), 0.7), { m: o.cera ?? 'cera', t: 1, sinBorde: true, sinSombra: true });
  o.signo?.(p);
}
export function pergaminoRollo(p: P) {
  p.dib(caja(0, 0, 18, 20, 1), { m: 'pergamino', b: 2 });
  for (const y of [-10, 10]) p.dib(caja(0, y, 22, 3.4, 1.7), { m: 'pergamino', b: 1.7, luz: -0.3 });
  for (let i = 0; i < 4; i++) p.dib(trazo([-6, -5 + i * 3.2, 6 - (i % 2) * 3, -5 + i * 3.2], 0.3), { m: 'pergamino', t: 1, sinBorde: true, sinSombra: true });
}
export function balanza(p: P) {
  p.dib(trazo([0, -12, 0, 10], 1), { m: 'oro', b: 1 }); p.dib(caja(0, 11.5, 10, 2.4, 1), 'oro'); p.dib(trazo([-11, -8, 11, -10], 0.8), { m: 'oro', b: 0.8 });
  for (const [x, y] of [[-11, -8], [11, -10]]) { p.dib(trazo([x, y, x - 3.5, y + 8, x + 3.5, y + 8, x, y], 0.25), { m: 'oro', t: 3, sinSombra: true }); p.dib(corte(circ(x, y + 7.5, 4.6), caja(x, y + 10, 12, 5)), { m: 'oro', b: 1.5 }); }
  p.dib(circ(0, -12.5, 1.6), { m: 'oro', b: 1.6, luz: 0.5 });
}
export function torre(p: P, o: { m?: string } = {}) {
  p.dib(union(caja(0, 3, 10, 20, 0.5), caja(0, -8, 14, 4, 0.5), caja(-5, -11, 3, 3), caja(0, -11, 3, 3), caja(5, -11, 3, 3)), { m: o.m ?? 'piedra', b: 1.4 });
  p.dib(corte(caja(0, 6, 3.6, 7), union(caja(0, 8, 3.6, 7), circ(0, 4.5, 1.8))), { m: 'sombra', t: 0, sinBorde: true });
}
export function muro(p: P, o: { m?: string } = {}) {
  p.dib(union(caja(0, 4, 26, 14, 0.5), ...[-10.5, -3.5, 3.5, 10.5].map((x) => caja(x, -4.5, 5, 4))), { m: o.m ?? 'piedra', b: 1.2 });
  for (let r = 0; r < 3; r++) { p.dib(trazo([-13, -1 + r * 4.4, 13, -1 + r * 4.4], 0.22), { m: o.m ?? 'piedra', t: 1, sinBorde: true, sinSombra: true });
    for (let c = 0; c < 4; c++) { const x = -9 + c * 6.5 + (r % 2) * 3.2; p.dib(trazo([x, -1 + r * 4.4, x, 3.4 + r * 4.4], 0.22), { m: o.m ?? 'piedra', t: 1, sinBorde: true, sinSombra: true }); } }
}
export function barco(p: P) {
  p.dib(poli(-13, 1, 12, 1, 9, 7, -9, 7), { m: 'madera', b: 1.6 });
  p.dib(trazo(curva(12, 1, 14, -4, 11, -9), 1.1, 0.8), { m: 'madera', b: 1 }); p.dib(poli(10.5, -10, 13.5, -10.5, 12, -8), { m: 'madera', b: 0.6 });
  p.dib(trazo(curva(-13, 1, -15, -3, -12, -6), 1, 0.6), { m: 'madera', b: 1 });
  p.dib(trazo([0, 1, 0, -14], 0.6), { m: 'madera', b: 0.6 }); p.dib(poli(0.6, -13, 9, -9, 8.4, -3, 0.6, -2.5), { m: 'tela', b: 2 });
  for (let i = 0; i < 4; i++) p.dib(circ(-8 + i * 5, 3, 1.4), { m: 'bronce', b: 1.4 });
  for (let i = 0; i < 4; i++) p.dib(trazo([-9 + i * 5, 6, -12 + i * 5, 11], 0.45), { m: 'madera', b: 0.5 });
}
export function olas(p: P, o: { m?: string; y?: number } = {}) {
  const y = o.y ?? 10; p.dib(trazo([-16, y, -12, y - 1.6, -8, y, -4, y - 1.6, 0, y, 4, y - 1.6, 8, y, 12, y - 1.6, 16, y], 0.8), { m: o.m ?? 'agua', b: 0.8 });
}
