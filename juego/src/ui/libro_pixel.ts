// El Libro de Odrán, lo que se pinta a punto entero: el papel con su grano, la mano de Odrán, la tinta que se seca, las
// capitulares, los dibujos del margen, la sangre, los huecos, el cuero de la tapa y las guardas. Todo va en láminas de
// puntos del libro (un punto del libro mide D puntos del aparato al pegarse, sin suavizar): nada de render liso.
import { glifoLetra } from './letra_pixel';
import { rasterGotico, type TallaGotica } from './letra_gotica';

export type C3 = [number, number, number];
export interface Lamina { w: number; h: number; px: Uint8ClampedArray }
export const lamina = (w: number, h: number): Lamina => ({ w, h, px: new Uint8ClampedArray(w * h * 4) });
const hx = (h: string): C3 => { const v = h.replace('#', ''); return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]; };
export const rampa = (...hs: string[]): C3[] => hs.map(hx);

/** Pone un punto (con alfa 1, o mezclado si a < 1). */
export function pon(L: Lamina, x: number, y: number, c: C3, a = 1) {
  x |= 0; y |= 0; if (x < 0 || y < 0 || x >= L.w || y >= L.h) return;
  const i = (y * L.w + x) * 4, p = L.px;
  if (a >= 1) { p[i] = c[0]; p[i + 1] = c[1]; p[i + 2] = c[2]; p[i + 3] = 255; return; }
  p[i] = p[i] + (c[0] - p[i]) * a; p[i + 1] = p[i + 1] + (c[1] - p[i + 1]) * a; p[i + 2] = p[i + 2] + (c[2] - p[i + 2]) * a; p[i + 3] = Math.max(p[i + 3], a * 255);
}
export function lee(L: Lamina, x: number, y: number): C3 { const i = (y * L.w + x) * 4; return [L.px[i], L.px[i + 1], L.px[i + 2]]; }
/** Oscurece o aclara un punto hacia un color (para manchas que dejan ver el papel). */
export function tine(L: Lamina, x: number, y: number, c: C3, k: number) { if (x < 0 || y < 0 || x >= L.w || y >= L.h) return; pon(L, x, y, c, k); }

// ------------------------------------------------------------------ azar y ruido
export function azar(s: number) { let a = s >>> 0 || 1; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
export const hashS = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
const h2 = (x: number, y: number, s: number) => { let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s, 2246822519); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
/** Ruido de valor suave (para el grano y las manchas grandes). */
export function ruido(x: number, y: number, esc: number, s: number) {
  const fx = x / esc, fy = y / esc, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const a = h2(x0, y0, s), b = h2(x0 + 1, y0, s), c = h2(x0, y0 + 1, s), d = h2(x0 + 1, y0 + 1, s);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}
export const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
export const bayer = (x: number, y: number) => BAYER[(y & 3) * 4 + (x & 3)];
/** Elige el tono de una rampa con trama ordenada: v en [0, 1] de claro a oscuro. */
export function tono(R: C3[], v: number, x: number, y: number): C3 { const f = Math.max(0, Math.min(R.length - 1, v * (R.length - 1))), i = Math.floor(f); return R[Math.min(R.length - 1, i + (f - i > bayer(x, y) ? 1 : 0))]; }

// ------------------------------------------------------------------ las tintas
/** Papel viejo, de claro a oscuro. */
export const PAPEL = rampa('#f0dfb6', '#e7d1a3', '#ddc493', '#d1b582', '#c3a46f', '#b0905c', '#957749', '#775b37', '#563e26', '#3a2818');
/** Tinta ferrogálica seca: del negro pardo al sepia gastado. La primera es la recién mojada. */
export const TINTA = rampa('#0d0705', '#1d130c', '#2b1d12', '#3a2919', '#4c3622');
export const RUBRICA = rampa('#3e0c08', '#5c140e', '#7a1e15', '#962a1c');
export const VIOLETA = rampa('#2c2038', '#3e304e', '#544466', '#6c5c80');
export const LAPIZ = rampa('#5e4a34', '#6e5a40', '#80694c', '#927a5a');
export const SANGRE = rampa('#1e0403', '#360806', '#520c09', '#6e140d', '#8e1c12');
export const SANGRE_FRESCA = rampa('#4a0604', '#7a0a06', '#a8140a', '#cc2616');
export const ORO = rampa('#3a2208', '#6a4214', '#9c6c22', '#c89a3a', '#e8c464', '#fbe8a0');
export const CUERO = rampa('#140806', '#1e0d08', '#2a130b', '#381a0f', '#472315', '#572d1b', '#6a3a24', '#7e4a30');
export const HIERRO = rampa('#0e0d0f', '#1c1b1f', '#2c2b30', '#403e44', '#5a575c', '#7a7678', '#9c9894');
export type Tinta = 'tinta' | 'rubrica' | 'violeta' | 'lapiz' | 'sangre';
const TINTAS: Record<Tinta, C3[]> = { tinta: TINTA, rubrica: RUBRICA, violeta: VIOLETA, lapiz: LAPIZ, sangre: SANGRE };

// ------------------------------------------------------------------ el papel
export interface OpcPapel { lado: 'izq' | 'der' | 'solo'; semilla: number; manchas?: number; agua?: boolean; gastada?: number }
/**
 * La hoja: grano de fibra, el amarillo que sube en los bordes, el lomo en sombra (la hoja se curva hacia la costura),
 * manchas de óxido (foxing), alguna aureola de agua y fibras sueltas. Todo pasa por la rampa del papel con trama.
 */
export function papel(w: number, h: number, o: OpcPapel): Lamina {
  const L = lamina(w, h), r = azar(o.semilla), s = o.semilla & 0xffff;
  const fox: [number, number, number, number][] = [];
  const nf = o.manchas ?? 3 + Math.floor(r() * 6);
  for (let i = 0; i < nf; i++) fox.push([r() * w, r() * h, 0.8 + r() * 2.6, 0.15 + r() * 0.35]);
  const agua = o.agua ? [w * (0.2 + r() * 0.6), h * (0.2 + r() * 0.6), 12 + r() * 22] : null;
  const lomo = o.lado === 'izq' ? w - 1 : o.lado === 'der' ? 0 : -999;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let v = 0.18;
    // el grano y las nubes del papel
    v += (ruido(x, y, 9, s) - 0.5) * 0.1 + (ruido(x, y, 2.2, s + 7) - 0.5) * 0.07 + (h2(x, y, s) - 0.5) * 0.05;
    v += (ruido(x, y, 40, s + 3) - 0.5) * 0.12;
    // los bordes amarillean y se gastan
    const be = Math.min(x, w - 1 - x, y, h - 1 - y);
    if (o.lado === 'izq' && x < 6) v += (6 - x) * 0.045; else if (o.lado === 'der' && x > w - 7) v += (x - (w - 7)) * 0.045; else if (o.lado === 'solo' && be === Math.min(x, w - 1 - x)) v += Math.max(0, 5 - be) * 0.03;
    if (y < 5) v += (5 - y) * 0.04; if (y > h - 6) v += (y - (h - 6)) * 0.045;
    v += (o.gastada ?? 0) * Math.max(0, 1 - be / 30) * 0.2;
    // el lomo: la hoja se hunde hacia la costura
    if (lomo > -999) { const dl = Math.abs(x - lomo); if (dl < 16) v += Math.pow(1 - dl / 16, 2) * 0.42; else if (dl < 34) v -= Math.sin(((dl - 16) / 18) * Math.PI) * 0.04; }
    // manchas de óxido
    for (const [fx, fy, fr, fk] of fox) { const d = Math.hypot(x - fx, y - fy); if (d < fr * 2.2) v += fk * Math.max(0, 1 - d / (fr * 2.2)) * (0.6 + ruido(x, y, 1.5, s + 11) * 0.8); }
    // una aureola de agua: el borde más oscuro, adentro apenas
    if (agua) { const d = Math.hypot(x - agua[0], (y - agua[1]) * 1.2) + (ruido(x, y, 6, s + 5) - 0.5) * 6; if (d < agua[2]) v += 0.05 + (d > agua[2] - 2 ? 0.14 : 0); }
    pon(L, x, y, tono(PAPEL, Math.max(0, Math.min(0.92, v)), x, y));
  }
  // fibras sueltas: rayitas apenas más oscuras
  const nfi = Math.floor((w * h) / 900);
  for (let i = 0; i < nfi; i++) {
    let x = r() * w, y = r() * h; const a = r() * Math.PI, l = 3 + r() * 7;
    for (let k = 0; k < l; k++) { const X = Math.round(x), Y = Math.round(y); if (X >= 0 && Y >= 0 && X < w && Y < h) { const c = lee(L, X, Y); pon(L, X, Y, [c[0] - 14, c[1] - 14, c[2] - 12]); } x += Math.cos(a); y += Math.sin(a) * 0.6; }
  }
  return L;
}

// ------------------------------------------------------------------ la mano de Odrán
interface GlifoM { w: number; px: [number, number][] }
/** Lo que la letra de pixel no trae y la mano necesita. */
const EXTRA: Record<string, string[]> = {
  '«': ['     ', '     ', '     ', ' # # ', '# #  ', ' # # '],
  '»': ['     ', '     ', '     ', '# #  ', ' # # ', '# #  '],
  '“': ['# #', '# #', '   '], '”': ['# #', '# #', '   '], '"': ['# #', '# #'], '’': [' #', ' #', '# '],
  '…': ['     ', '     ', '     ', '     ', '     ', '     ', '# # #'],
  '—': ['    ', '    ', '    ', '####'], '–': ['   ', '   ', '   ', '###'],
};
const cacheG = new Map<string, GlifoM>();
export function glifoMano(ch: string): GlifoM {
  let g = cacheG.get(ch); if (g) return g;
  const ex = EXTRA[ch];
  if (ex) { const px: [number, number][] = []; ex.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (f[x] === '#') px.push([x, y]); }); g = { w: Math.max(...ex.map((f) => f.length)), px }; }
  else g = glifoLetra(ch) ?? glifoLetra(ch.normalize('NFD')[0]) ?? glifoLetra('?')!;
  cacheG.set(ch, g); return g;
}
const ESP = 3;
export const anchoMano = (s: string) => { let w = 0; for (const ch of s) w += ch === ' ' ? ESP : glifoMano(ch).w + 1; return Math.max(0, w - 1) + 2; };
/** Corta un texto en renglones de a lo sumo `w` puntos. */
export function cortarMano(s: string, w: number, w0 = w, nAngosto = 1): string[] {
  const out: string[] = []; let cur = '';
  const lim = () => (out.length < nAngosto ? w0 : w);
  for (const pal of s.split(/\s+/).filter(Boolean)) {
    const prueba = cur ? `${cur} ${pal}` : pal;
    if (anchoMano(prueba) <= lim() || !cur) cur = prueba; else { out.push(cur); cur = pal; }
  }
  if (cur) out.push(cur);
  return out;
}
export interface OpcMano {
  tinta?: Tinta; inclina?: 1 | -1 | 0; semilla?: number;
  /** Desde qué letra de la pieza cuenta este renglón (para la tinta que se acaba y lo que ya se escribió). */
  i0?: number;
  /** Cuántas letras de la pieza se ven (si falta, todas) y cuánto hace que se escribió cada una (en segundos). */
  ven?: number; edad?: (i: number) => number;
  /** 0 a 1: la tinta apenas se lee (las pistas a lápiz). */
  tenue?: number;
}
/**
 * Escribe un renglón con la mano de Odrán: la letra de pixel inclinada (lo de arriba se corre a la derecha), la línea que
 * ondula apenas, la pluma que se va quedando sin tinta y se vuelve a mojar (más oscuro de golpe), la gota que se junta al
 * final de cada trazo, y la tinta recién puesta que brilla negra y se seca a sepia. Devuelve dónde quedó la pluma.
 */
export function escribir(L: Lamina, s: string, x: number, y: number, o: OpcMano = {}): { x: number; y: number; ultima: number } {
  const R = TINTAS[o.tinta ?? 'tinta'], inc = o.inclina ?? 1, sem = o.semilla ?? 1, i0 = o.i0 ?? 0;
  let cx = x, i = i0, px = x, py = y;
  const ola = (sem % 97) / 13;
  for (const ch of s) {
    if (o.ven !== undefined && i >= o.ven) break;
    if (ch === ' ') { cx += ESP; i++; continue; }
    const g = glifoMano(ch), dy = Math.round(Math.sin(cx * 0.05 + ola) * 0.55 + (h2(i, 7, sem) < 0.06 ? (h2(i, 9, sem) < 0.5 ? -1 : 1) * 0.6 : 0));
    // la pluma: recién mojada es oscura, después se va aclarando hasta volver a mojarla (cada 40 a 70 letras)
    const ciclo = 40 + Math.floor(h2(Math.floor(i / 55), 3, sem) * 30), k = (i % ciclo) / ciclo;
    let nv = k < 0.12 ? 0 : k < 0.55 ? 1 : 2;
    if (o.tenue) nv = Math.min(R.length - 1, nv + Math.round(o.tenue * 2));
    const edad = o.edad ? o.edad(i) : 99;
    let fondo = -1; for (const [, b] of g.px) fondo = Math.max(fondo, b);
    for (const [a, b] of g.px) {
      const sh = inc === 0 ? 0 : inc * Math.floor((6 - b) / 3);
      const X = cx + a + sh, Y = y + b + dy;
      const seco = Math.max(0, Math.min(R.length - 1, nv + 1 + (b === fondo && h2(i, b, sem) < 0.5 ? -1 : 0)));
      const c: C3 = edad < 0.5 ? TINTA[0] : edad < 1.6 ? R[Math.max(0, seco - (edad < 1.1 ? 2 : 1))] : R[seco];
      if (o.tenue && h2(X, Y, sem) < o.tenue * 0.35) continue;
      pon(L, X, Y, c);
    }
    // el brillo de la tinta mojada
    if (edad < 0.9 && g.px.length) { const [a, b] = g.px[0]; pon(L, cx + a + (inc ? inc * Math.floor((6 - b) / 3) : 0), y + b + dy, [92, 70, 52]); }
    px = cx + g.w; py = y + 6 + dy;
    cx += g.w + 1; i++;
  }
  return { x: px, y: py, ultima: i };
}
/** Un título en letra gótica de pixel, con la tinta de la rúbrica (o la que se pida), más oscura abajo. */
export function gotico(L: Lamina, s: string, x: number, y: number, R: C3[] = RUBRICA, talla: TallaGotica = 'grande', ven = 1) {
  const g = rasterGotico(s, talla), sem = hashS(s);
  for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) {
    if (!g.tinta[yy * g.w + xx]) continue;
    if (ven < 1 && xx / g.w > ven) continue;
    const f = (yy - g.arriba) / g.alto, abajo = !g.tinta[(yy + 1) * g.w + xx];
    let n = f < 0.3 ? 2 : f < 0.75 ? 1 : 0; if (abajo) n = 0; if (h2(xx, yy, sem) < 0.08) n = Math.min(R.length - 1, n + 1);
    pon(L, x + xx - 2, y + yy - g.arriba, R[Math.min(R.length - 1, n)]);
  }
  return g.w - 4;
}
export const anchoGot = (s: string, talla: TallaGotica = 'grande') => rasterGotico(s, talla).w - 4;

// ------------------------------------------------------------------ dibujos del margen (a pixel, como grabado en tinta)
/** '#' tinta, '+' tinta media, ':' aguada, 'R' sangre honda, 'r' sangre, 'g' oro. */
export const DIBUJOS: Record<string, string[]> = {
  sello: ['.....######.....', '...##rrrrrr##...', '..#rrwwrrrrrr#..', '.#rrw:RRRR:rrr#.', '.#rw:R#rr#R:rr#.', '#rr:R#rRRr#R:rr#', '#rr:#rR##Rr#:rr#', '#rr:#rR##Rr#:rr#', '#rr:R#rRRr#R:rr#', '#rrr:R#rr#R:rrr#', '.#rrr:RRRR:rrr#.', '.#rrrr::::rrrr#.', '..#rrrrrrrrrr#..', '...##rrrrrr##...', '.....######.....', '................'],
  campanilla: ['.......##.......', '......#..#......', '.......##.......', '......####......', '.....#+::+#.....', '....#+::::+#....', '....#+::::+#....', '....#+::::+#....', '...#++::::++#...', '...#+::::::+#...', '..#++::::::++#..', '..#+::::::::+#..', '.##############.', '.......##.......', '......#++#......', '.......##.......'],
  brasa: ['.......#........', '......#+#.......', '......#:+#......', '.....#+::#......', '....#+:#:+#.....', '....#::#::#..#..', '...#+:#+#:+##+#.', '...#::#r#::#:+#.', '..#+:#rRr#:::#..', '..#::#rRRr#::#..', '..#+:#rRRr#:+#..', '...#+:#rr#:+#...', '...##+:##:+##...', '....##++++##....', '......####......', '................'],
  ojo: ['................', '................', '.....######.....', '...##::::::##...', '..#:::####:::#..', '.#::##+##+##::#.', '#::#+##RR##+#::#', '#:#+#RRRRRR#+#:#', '#::#+##RR##+#::#', '.#::##+##+##::#.', '..#:::####:::#..', '...##::::::##...', '.....######.....', '.......rr.......', '.......Rr.......', '........R.......'],
  candado: ['.....######.....', '...##::::::##...', '..#::::##::::#..', '.#::::#RR#::::#.', '.#:::::##:::::#.', '#::##::::::##::#', '#:#RR#::::#RR#:#', '#::##::##::##::#', '#:::::#++#:::::#', '#::::::##::::::#', '.#::##::::##::#.', '.#:#RR#::#RR#:#.', '..#:##::::##:#..', '...##::::::##...', '.....######.....', '................'],
  barco: ['.......#........', '.......#+.......', '.......#++......', '.......#+++.....', '.......#++++....', '.......#+++++...', '.......#++++++..', '.......#........', '.#.....#.....#..', '.##############.', '..#++++++++++#..', '...#::::::::#...', '....########....', '..:.:..:...:.:..', '.:.:..:.:.:..:..', '................'],
  hacha: ['......##........', '.....#++##......', '....#+:::+#.....', '....#+::::+##...', '....#+:::::++#..', '.....#+::::::#..', '......##+::+#...', '........#++#....', '.......#+#......', '......#+#.......', '.....#+#........', '....#+#.........', '...#+#..........', '..#+#...........', '.#R#............', '..r.............'],
  atril: ['................', '.###.....###....', '#:::##..#:::##..', '#::::+##+::::+#.', '#:::::#::::::+#.', '#:#:#:#:#:#:#+#.', '#:::::#::::::+#.', '.####+#+######..', '......#.........', '......#.........', '.....###........', '.....#+#........', '.....#+#........', '.....#+#........', '....#####.......', '...#######......'],
  campana: ['.......##.......', '......####......', '.....#++++#.....', '....#+::::+#....', '....#+::::+#....', '...#+::::::+#...', '...#+::::::+#...', '...#+::::::+#...', '..#++::::::++#..', '..#+::::::::+#..', '.#++::::::::++#.', '.#+::::::::::+#.', '################', '.......##.......', '......#rr#......', '.......##.......'],
  escalera: ['............####', '............#::#', '.........####::.', '.........#::#...', '......####::....', '......#::#......', '...####::.......', '...#::#.........', '####::..........', '#::#............', '#::.............', '................', '..:...:..:......', '................', '................', '................'],
  copa: ['..############..', '..#::::::::::#..', '..#:RRRRRRRR:#..', '...#:RrrrrR:#...', '...#::::::::#...', '....#::::::#....', '.....##++##.....', '.......##.......', '.......##.......', '......#++#......', '.......##.......', '.......##.......', '.....######.....', '....#++++++#....', '...##########...', '................'],
  pregunta: ['.....######.....', '....##::::##....', '...##:####:##...', '...#:##..##:#...', '.........##:#...', '........##:#....', '.......##:#.....', '......##:#......', '......#:##......', '......####......', '................', '......####......', '......#rr#......', '......#Rr#......', '......####......', '................'],
  craneo: ['.....######.....', '...##::::::##...', '..#::::::::::#..', '.#::::::::::::#.', '.#:::::::::::+#.', '#::####::####:+#', '#::####::####:+#', '#::##R#::#R##:+#', '.#:::::##:::::#.', '..##:::##:::##..', '...#::::::::#...', '...#:#:#:#:##...', '...#########....', '....#.#.#.#.....', '................', '................'],
  pluma: ['..............##', '............##+#', '...........#++#.', '..........#+:#..', '.........#+:#...', '........#+:#....', '.......#+:#.....', '......#+:#......', '.....#+:#.......', '.....#:#........', '....#+#.........', '....##..........', '...#............', '..#.............', '.R..............', 'R...............'],
  soga: ['.......##.......', '.......#+.......', '.......##.......', '.......#+.......', '.......##.......', '......####......', '.....##..##.....', '....#+....+#....', '....#+....+#....', '....#+....+#....', '.....##..##.....', '......####......', '.......##.......', '.......#+.......', '.......##.......', '.......:........'],
  luna: ['......####......', '....##RRR#......', '...#RRR#........', '..#RRr#.........', '..#Rr#..........', '.#RRr#..........', '.#Rr#...........', '.#Rr#...........', '.#RRr#..........', '..#Rr#..........', '..#RRr#.........', '...#RRR#........', '....##RRR#......', '......####......', '................', '................'],
};
/** Pinta un dibujo del margen a `esc` puntos por punto (1 o 2), con la tinta un poco corrida (no son sellos de goma). */
export function dibujo(L: Lamina, id: string, x: number, y: number, esc = 1, sem = 1, ven = 1) {
  const D = DIBUJOS[id]; if (!D) return;
  const w = D[0].length;
  for (let yy = 0; yy < D.length; yy++) for (let xx = 0; xx < w; xx++) {
    const ch = D[yy][xx]; if (ch === '.') continue;
    if (ven < 1 && yy / D.length > ven) continue;
    for (let a = 0; a < esc; a++) for (let b = 0; b < esc; b++) {
      const X = x + xx * esc + a, Y = y + yy * esc + b, n = h2(X, Y, sem);
      let c: C3 | null = null;
      if (ch === '#') c = TINTA[n < 0.15 ? 1 : 2];
      else if (ch === '+') c = TINTA[n < 0.5 ? 3 : 2];
      else if (ch === ':') { if ((X + Y) % 2 === 0 || n < 0.25) c = TINTA[4]; else continue; }
      else if (ch === 'R') c = SANGRE[1]; else if (ch === 'r') c = SANGRE[3]; else if (ch === 'w') c = SANGRE[4]; else if (ch === 'g') c = ORO[3];
      if (c) pon(L, X, Y, c);
    }
  }
}

// ------------------------------------------------------------------ la capitular iluminada
/**
 * La letra que abre cada hilo: un cuadro de 30 puntos con el campo del color del hilo en rombos, el filete de oro con
 * su canto oscuro, la letra gótica al doble en oro (luz arriba a la izquierda, sombra abajo), y un zarcillo rojo y azul
 * que baja por el margen como hacían los iluminadores.
 */
export function capitular(L: Lamina, letra: string, x: number, y: number, campo: string, sem: number) {
  const S = 30, F = hx(campo), oscuro: C3 = [F[0] * 0.45, F[1] * 0.45, F[2] * 0.45], claro: C3 = [Math.min(255, F[0] * 1.5 + 20), Math.min(255, F[1] * 1.5 + 20), Math.min(255, F[2] * 1.5 + 20)];
  for (let yy = 0; yy < S; yy++) for (let xx = 0; xx < S; xx++) {
    const X = x + xx, Y = y + yy, b = Math.min(xx, yy, S - 1 - xx, S - 1 - yy);
    if (b === 0) pon(L, X, Y, TINTA[1]);
    else if (b === 1) pon(L, X, Y, xx < S / 2 && yy < S / 2 ? ORO[5] : ORO[xx + yy > S ? 2 : 4]);
    else if (b === 2) pon(L, X, Y, ORO[1]);
    else {
      // los rombos del campo, con un punto de oro en cada cruce
      const u = (xx + yy) % 6, v = (xx - yy + 60) % 6;
      if (u === 0 && v === 0) pon(L, X, Y, ORO[4]);
      else if (u === 0 || v === 0) pon(L, X, Y, oscuro);
      else pon(L, X, Y, h2(X, Y, sem) < 0.1 ? claro : yy < S / 2 ? F : [F[0] * 0.82, F[1] * 0.82, F[2] * 0.82]);
    }
  }
  const g = rasterGotico(letra, 'grande'), lw = g.w - 4, ox = x + Math.floor((S - lw * 2) / 2) - 4, oy = y + 4;
  const en = (a: number, b: number) => a >= 0 && b >= 0 && a < g.w && b < g.h && g.tinta[b * g.w + a] === 1;
  for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) {
    const t = en(xx, yy), canto = !t && (en(xx - 1, yy) || en(xx, yy - 1) || en(xx - 1, yy - 1) || en(xx + 1, yy) || en(xx, yy + 1));
    if (!t && !canto) continue;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) {
      const X = ox + xx * 2 + a, Y = oy + (yy - g.arriba) * 2 + b;
      if (X < x + 3 || Y < y + 3 || X > x + S - 4 || Y > y + S - 4) continue;
      if (canto) { pon(L, X, Y, TINTA[0]); continue; }
      const arr = !en(xx, yy - 1) && b === 0, izq = !en(xx - 1, yy) && a === 0, abj = !en(xx, yy + 1) && b === 1;
      pon(L, X, Y, arr || izq ? ORO[5] : abj ? ORO[1] : (yy - g.arriba) / g.alto < 0.45 ? ORO[4] : ORO[3]);
    }
  }
  // el zarcillo: baja desde la esquina de abajo a la izquierda, en rojo y azul de pluma, con hojitas
  const r = azar(sem); let zx = x - 4, zy = y + 4;
  for (let k = 0; k < 40; k++) {
    const c = k % 9 < 5 ? RUBRICA[2] : [44, 64, 120] as C3;
    pon(L, zx, zy, c); zy++; if (k % 7 === 3) zx += r() < 0.5 ? -1 : 1;
    if (k % 8 === 5) { pon(L, zx + 1, zy - 1, c); pon(L, zx + 2, zy - 2, c); pon(L, zx + 2, zy - 1, RUBRICA[3]); }
  }
  pon(L, zx, zy, RUBRICA[1]); pon(L, zx - 1, zy + 1, RUBRICA[1]); pon(L, zx + 1, zy + 1, RUBRICA[1]);
  return S;
}

// ------------------------------------------------------------------ la sangre
/** Una gota de sangre seca (o fresca) caída sobre la hoja, con sus salpicaduras y a veces su cola. */
export function gota(L: Lamina, x: number, y: number, r0: number, sem: number, fresca = false) {
  const R = fresca ? SANGRE_FRESCA : SANGRE, r = azar(sem);
  const cola = r() < 0.5, ang = r() * Math.PI * 2;
  for (let yy = -r0 - 2; yy <= r0 + 2; yy++) for (let xx = -r0 - 2; xx <= r0 + 2; xx++) {
    const d = Math.hypot(xx, yy) + (ruido(x + xx, y + yy, 1.6, sem) - 0.5) * 1.6;
    if (d > r0) continue;
    const borde = d > r0 - 1.2;
    pon(L, x + xx, y + yy, borde ? R[0] : R[Math.min(R.length - 1, 1 + Math.floor((1 - d / r0) * (R.length - 2) + (bayer(x + xx, y + yy) - 0.5)))]);
  }
  if (cola) { let cx = x, cy = y; for (let k = 0; k < r0 * 3; k++) { cx += Math.cos(ang) * 0.9; cy += Math.sin(ang) * 0.9; pon(L, cx, cy, R[k < r0 ? 1 : 0]); if (k < r0) pon(L, cx + 1, cy, R[2]); } }
  const n = 3 + Math.floor(r() * 6);
  for (let i = 0; i < n; i++) { const a = r() * Math.PI * 2, d = r0 + 2 + r() * r0 * 2.2; pon(L, x + Math.cos(a) * d, y + Math.sin(a) * d, R[r() < 0.5 ? 1 : 2]); if (r() < 0.3) pon(L, x + Math.cos(a) * d + 1, y + Math.sin(a) * d, R[1]); }
}
/** La huella de un dedo con sangre: crestas en óvalos, más cargada de un lado, que se corta donde el dedo no apretó. */
export function huella(L: Lamina, x: number, y: number, sem: number, ang = 0.3) {
  const ca = Math.cos(ang), sa = Math.sin(ang), r = azar(sem), lado = r() * Math.PI * 2;
  for (let yy = -8; yy <= 8; yy++) for (let xx = -7; xx <= 7; xx++) {
    const u = xx * ca + yy * sa, v = -xx * sa + yy * ca, e = Math.hypot(u / 4.6, v / 6.4);
    if (e > 1) continue;
    const giro = Math.hypot(u / 4.6, (v + 1.2) / 6.4) * 6.2 + Math.atan2(v, u) * 0.18;
    if (Math.floor(giro) % 2) continue;
    const peso = 0.55 + 0.45 * Math.cos(Math.atan2(v, u) - lado) - e * 0.4 + (ruido(x + xx, y + yy, 2, sem) - 0.5);
    if (peso < 0.15) continue;
    pon(L, x + xx, y + yy, SANGRE[peso > 0.7 ? 2 : peso > 0.4 ? 1 : 0], peso > 0.3 ? 1 : 0.6);
  }
}

// ------------------------------------------------------------------ los huecos (lo que falta)
/** Una mancha de tinta volcada encima de renglones tachados. */
export function hueco(L: Lamina, tipo: 'mancha' | 'arrancada' | 'sangre', x: number, y: number, w: number, h: number, sem: number, ven = 1) {
  const r = azar(sem);
  if (tipo === 'arrancada') {
    // la hoja se rompió: se ve la de abajo, más clara y limpia, con el borde de fibras y su sombra
    const borde = (xx: number) => Math.round(Math.sin(xx * 0.7 + sem) * 1.2 + (ruido(xx, 0, 3, sem) - 0.5) * 4);
    for (let xx = 0; xx < w; xx++) {
      const t = 2 + borde(xx), b = h - 3 + borde(xx + 99);
      for (let yy = t; yy <= b; yy++) {
        if (h2(xx, yy, sem) > ven + 0.02) continue;
        const X = x + xx, Y = y + yy;
        if (yy === t) pon(L, X, Y, [246, 234, 206]); // las fibras sueltas del borde roto
        else if (yy <= t + 2) pon(L, X, Y, PAPEL[yy === t + 1 ? 5 : 4]); // la sombra del borde sobre la hoja de abajo
        else if (yy === b) pon(L, X, Y, [244, 232, 204]);
        else pon(L, X, Y, tono(PAPEL, 0.08 + (ruido(X, Y, 5, sem) - 0.5) * 0.08, X, Y));
      }
    }
    // un renglón de la hoja de abajo, que no se lee
    for (let xx = 6; xx < w - 10; xx++) if (h2(xx, 3, sem) < 0.55 && ven > 0.5) pon(L, x + xx, y + Math.floor(h / 2) + (xx % 5 === 0 ? 1 : 0), PAPEL[6]);
    return;
  }
  // los renglones tachados que quedaron debajo
  for (let k = 0; k < 2; k++) { const yy = y + 6 + k * 9; for (let xx = 4; xx < w - 6; xx++) if (h2(xx, k, sem) < 0.7) pon(L, x + xx, yy + (Math.sin(xx * 0.4 + k) > 0.6 ? 1 : 0), tipo === 'sangre' ? TINTA[3] : TINTA[2]); }
  const cx = x + w * (0.3 + r() * 0.4), cy = y + h / 2, rx = Math.min(w * 0.36, 26), ry = h * 0.42;
  const R = tipo === 'sangre' ? SANGRE : TINTA;
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) {
    const nx = (xx - cx) / rx, ny = (yy - cy) / ry, d = Math.hypot(nx, ny) - (ruido(xx, yy, 4, sem) - 0.5) * 0.7 - (tipo === 'sangre' ? Math.max(0, -ny) * 0.25 * Math.sin(xx * 0.3) : 0);
    if (d > 1 || h2(xx, yy, sem + 3) > ven + 0.05) continue;
    if (tipo === 'sangre') { const k = d > 0.82 ? 0 : 1 + Math.floor((1 - d) * 2.5 + (bayer(xx, yy) - 0.5)); pon(L, xx, yy, R[Math.min(R.length - 1, k)]); }
    else pon(L, xx, yy, d > 0.86 ? R[2] : d < 0.35 && h2(xx, yy, sem) < 0.06 ? R[3] : R[d < 0.6 ? 0 : 1]);
  }
  // salpicaduras y el chorrito que baja
  for (let i = 0; i < 9; i++) { const a = r() * Math.PI * 2, d = 1.1 + r() * 0.6; pon(L, cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d, R[1]); }
  if (ven > 0.6) { let dx = cx + (r() - 0.5) * rx, dy = cy + ry * 0.7; for (let k = 0; k < 4 + r() * 6; k++) { pon(L, dx, dy, R[1]); dy++; } pon(L, dx, dy, R[0]); pon(L, dx + 1, dy, R[1]); }
}

// ------------------------------------------------------------------ adornos de la hoja
/** Una raya de pluma con un rombo al medio (separa piezas), o la doble raya bajo un título. */
export function raya(L: Lamina, x: number, y: number, w: number, tipo: 'simple' | 'doble' | 'flor', sem: number) {
  const m = x + Math.floor(w / 2);
  for (let xx = x; xx < x + w; xx++) {
    const dm = Math.abs(xx - m); if (tipo !== 'doble' && dm < 4) continue;
    const c = TINTA[h2(xx, y, sem) < 0.2 ? 3 : 2];
    if (tipo === 'flor' && dm > w * 0.32) continue;
    pon(L, xx, y + (tipo === 'flor' && h2(xx, 1, sem) < 0.04 ? 1 : 0), c);
    if (tipo === 'doble') pon(L, xx, y + 2, RUBRICA[2]);
  }
  if (tipo !== 'doble') { for (const [a, b] of [[0, -2], [-1, -1], [1, -1], [-2, 0], [2, 0], [-1, 1], [1, 1], [0, 2]]) pon(L, m + a, y + b, RUBRICA[2]); pon(L, m, y, RUBRICA[3]); }
}
/** El sello de cera roja de un hilo cerrado. */
export function selloCera(L: Lamina, x: number, y: number, r0: number, sem: number) {
  for (let yy = -r0 - 2; yy <= r0 + 2; yy++) for (let xx = -r0 - 2; xx <= r0 + 2; xx++) {
    const d = Math.hypot(xx, yy) + (ruido(x + xx, y + yy, 2, sem) - 0.5) * 2.2;
    if (d > r0 + 1) continue;
    const luz = (-xx - yy) / (r0 * 2), anillo = Math.abs(d - r0 * 0.62) < 0.8;
    let c = RUBRICA[2];
    if (d > r0) c = RUBRICA[0]; else if (anillo) c = RUBRICA[0]; else if (luz > 0.25) c = SANGRE_FRESCA[3]; else if (luz < -0.3) c = RUBRICA[1];
    pon(L, x + xx, y + yy, c);
  }
  // la O de Odrán grabada en la cera
  for (let a = 0; a < 16; a++) { const t = (a / 16) * Math.PI * 2; pon(L, x + Math.round(Math.cos(t) * r0 * 0.32), y + Math.round(Math.sin(t) * r0 * 0.38), RUBRICA[0]); }
}
/** Una gota de cera de vela: un charco pálido con su borde, su brillo y el chorrito que se enfrió. */
export function cera(L: Lamina, x: number, y: number, sem: number) {
  const r = azar(sem), r0 = 2 + Math.floor(r() * 3), C = rampa('#a88e5c', '#c8b080', '#e4d4a8', '#f4ead0');
  for (let yy = -r0 - 1; yy <= r0 + 4; yy++) for (let xx = -r0 - 1; xx <= r0 + 1; xx++) {
    const d = Math.hypot(xx, yy > 0 ? yy * 0.55 : yy) + (ruido(x + xx, y + yy, 1.5, sem) - 0.5) * 1.2;
    if (d > r0) continue;
    pon(L, x + xx, y + yy, d > r0 - 0.9 ? C[0] : xx < 0 && yy < 0 && d < r0 * 0.5 ? C[3] : d < r0 * 0.6 ? C[2] : C[1]);
  }
}
/** Las cifras del folio, a lápiz. */
export function folio(L: Lamina, n: number, x: number, y: number) { escribir(L, String(n), x, y, { tinta: 'lapiz', inclina: 0, tenue: 0.3, semilla: n }); }

// ------------------------------------------------------------------ la tapa, el lomo y las guardas
/**
 * La tapa de cuero viejo: grano y arrugas, grietas, el borde gastado más claro, el gofrado en seco (dos marcos hundidos
 * con su labio de luz y flores en las esquinas), el título dorado a fuego que se gastó, el sello de los cinco pedazos en
 * el centro, cuatro cantoneras de hierro con sus remaches, la correa del broche y sangre vieja que nadie limpió.
 */
export function tapa(w: number, h: number, sem: number, titulo: string): Lamina {
  const L = lamina(w, h), r = azar(sem);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const be = Math.min(x, w - 1 - x, y, h - 1 - y);
    let v = 0.36 + (ruido(x, y, 7, sem) - 0.5) * 0.22 + (ruido(x, y, 1.7, sem + 1) - 0.5) * 0.14 + (ruido(x, y, 30, sem + 2) - 0.5) * 0.2;
    if (be < 4) v -= (4 - be) * 0.06; // el canto gastado, más claro
    if (be === 0) v = 0.95;
    pon(L, x, y, tono(CUERO, 1 - Math.max(0, Math.min(1, v)), x, y));
  }
  // grietas del cuero
  for (let i = 0; i < 22; i++) { let x = r() * w, y = r() * h, a = r() * Math.PI * 2; for (let k = 0; k < 6 + r() * 16; k++) { pon(L, x, y, CUERO[0]); pon(L, x + 1, y + 1, CUERO[5]); a += (r() - 0.5) * 0.9; x += Math.cos(a); y += Math.sin(a); } }
  // el gofrado: dos marcos hundidos
  const marco = (m: number) => { for (let x = m; x < w - m; x++) { pon(L, x, m, CUERO[0]); pon(L, x, m + 1, CUERO[6]); pon(L, x, h - 1 - m, CUERO[0]); pon(L, x, h - m, CUERO[6]); } for (let y = m; y < h - m; y++) { pon(L, m, y, CUERO[0]); pon(L, m + 1, y, CUERO[6]); pon(L, w - 1 - m, y, CUERO[0]); pon(L, w - m, y, CUERO[6]); } };
  marco(7); marco(12);
  // flores gofradas en las esquinas del marco de adentro
  for (const [cx, cy] of [[12, 12], [w - 13, 12], [12, h - 13], [w - 13, h - 13]]) for (let k = -4; k <= 4; k++) { pon(L, cx + k, cy + k, CUERO[0]); pon(L, cx + k, cy - k, CUERO[0]); pon(L, cx + k + 1, cy + k, CUERO[6]); }
  // el título dorado a fuego, gastado
  const tw = anchoGot(titulo);
  { const g = rasterGotico(titulo, 'grande'), x0 = Math.floor((w - tw) / 2), y0 = 26;
    for (let yy = 0; yy < g.h; yy++) for (let xx = 0; xx < g.w; xx++) {
      if (!g.tinta[yy * g.w + xx]) continue; const X = x0 + xx - 2, Y = y0 + yy - g.arriba;
      if (h2(X, Y, sem) < 0.16) { pon(L, X, Y, CUERO[1]); continue; } // donde el oro se fue, queda el hundido
      const arr = !g.tinta[(yy - 1) * g.w + xx]; pon(L, X, Y, arr ? ORO[5] : (yy - g.arriba) / g.alto < 0.5 ? ORO[4] : ORO[2]);
      pon(L, X + 1, Y + 1, CUERO[0]);
    } }
  // el sello de los cinco pedazos: un círculo hundido con cinco puntos de oro y la brasa al centro
  { const cx = Math.floor(w / 2), cy = Math.floor(h * 0.55), R0 = Math.floor(Math.min(w, h) * 0.2);
    for (let a = 0; a < 140; a++) { const t = (a / 140) * Math.PI * 2; for (const rr of [R0, R0 - 3]) { pon(L, cx + Math.round(Math.cos(t) * rr), cy + Math.round(Math.sin(t) * rr), CUERO[0]); pon(L, cx + Math.round(Math.cos(t) * rr) + 1, cy + Math.round(Math.sin(t) * rr) + 1, CUERO[6]); } }
    for (let k = 0; k < 5; k++) { const t = -Math.PI / 2 + (k / 5) * Math.PI * 2, px = cx + Math.round(Math.cos(t) * (R0 - 1.5)), py = cy + Math.round(Math.sin(t) * (R0 - 1.5));
      for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1], [-1, 0], [0, -1]]) pon(L, px + a, py + b, a + b < 0 ? ORO[5] : ORO[3]); }
    for (let yy = -7; yy <= 6; yy++) for (let xx = -5; xx <= 5; xx++) { const f = Math.abs(xx) / 5 + Math.max(0, -yy) / 8; if (f > 1 - (yy > 0 ? yy / 7 : 0)) continue; pon(L, cx + xx, cy + yy, f < 0.35 ? ORO[5] : f < 0.7 ? ORO[3] : ORO[1]); } }
  // las cantoneras de hierro con remaches
  const cantonera = (ex: number, ey: number) => {
    const sx = ex ? -1 : 1, sy = ey ? -1 : 1, ox = ex ? w - 1 : 0, oy = ey ? h - 1 : 0;
    for (let a = 0; a < 20; a++) for (let b = 0; b < 20 - a; b++) {
      const X = ox + sx * a, Y = oy + sy * b, borde = a + b === 19 || a === 0 || b === 0;
      const luz = (sx * -1 * a + sy * -1 * b) / 20;
      pon(L, X, Y, borde ? HIERRO[a + b === 19 ? 0 : 5] : tono(HIERRO, 0.45 - luz * 0.3 + (ruido(X, Y, 2, sem) - 0.5) * 0.25, X, Y));
    }
    for (const [a, b] of [[4, 4], [11, 3], [3, 11]]) { const X = ox + sx * a, Y = oy + sy * b; pon(L, X, Y, HIERRO[6]); pon(L, X + 1, Y, HIERRO[2]); pon(L, X, Y + 1, HIERRO[2]); pon(L, X + 1, Y + 1, HIERRO[1]); }
  };
  cantonera(0, 0); cantonera(1, 0); cantonera(0, 1); cantonera(1, 1);
  // la correa del broche (sale del canto de la derecha) con su hebilla de latón
  { const y0 = Math.floor(h / 2) - 5; for (let x = w - 22; x < w; x++) for (let y = y0; y < y0 + 10; y++) { const b = y === y0 || y === y0 + 9; pon(L, x, y, b ? CUERO[0] : tono(CUERO, 0.62 + (ruido(x, y, 2, sem + 9) - 0.5) * 0.3, x, y)); }
    for (let x = w - 26; x < w - 16; x++) for (let y = y0 - 2; y < y0 + 12; y++) { const b = x === w - 26 || x === w - 17 || y === y0 - 2 || y === y0 + 11; if (!b && x > w - 25 && x < w - 18 && y > y0 && y < y0 + 10) continue; pon(L, x, y, b ? ORO[1] : y < y0 + 4 ? ORO[4] : ORO[2]); } }
  // sangre vieja: una mano que se apoyó al cerrarlo y gotas
  for (let i = 0; i < 3; i++) huella(L, Math.floor(w * (0.62 + r() * 0.2)), Math.floor(h * (0.72 + r() * 0.14)), sem + i * 17, r() * 2);
  for (let i = 0; i < 4; i++) gota(L, Math.floor(w * (0.2 + r() * 0.6)), Math.floor(h * (0.1 + r() * 0.85)), 1 + Math.floor(r() * 2), sem + 40 + i);
  return L;
}
/** Las guardas: papel jaspeado rojo y negro (tinta peinada sobre agua) en el revés de la tapa. */
export function guardas(w: number, h: number, sem: number): Lamina {
  const L = lamina(w, h), J = rampa('#160606', '#2c0a08', '#4a120c', '#6a2014', '#8a3420', '#b05a30', '#d89a60');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const peine = Math.sin(x * 0.21 + Math.sin(y * 0.09 + ruido(x, y, 18, sem) * 6) * 3.2) * 0.5 + 0.5;
    const vena = Math.abs(Math.sin(y * 0.13 + Math.sin(x * 0.05) * 4 + ruido(x, y, 9, sem + 1) * 5));
    let v = 0.15 + peine * 0.35 + (vena < 0.12 ? 0.4 : 0) + (ruido(x, y, 3, sem + 2) - 0.5) * 0.2;
    if (Math.min(x, y, w - 1 - x, h - 1 - y) < 3) v *= 0.5;
    pon(L, x, y, tono(J, Math.max(0, Math.min(1, v)), x, y));
  }
  return L;
}
