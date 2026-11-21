// La letra gótica de pixel de los menús (portada, Opciones, la vigilia): versales talladas propias, con dos tallas.
// - La grande, de 11 puntos de alto: fustes de dos, perfiles de uno, espolones en las cabezas (la púa que sale arriba a la
//   izquierda de cada fuste), pies en cuña que patean a la derecha, la A con punta de arco, la M y la N con su cuña, y
//   quiebres en las curvas (la C, la O, la G, la Q y la S no son redondas: van facetadas, con el nudillo hacia adentro a
//   media altura y el pico de la pluma arriba a la derecha). Rick, 21 nov 2026: "más de lápida que gótica feroz".
// - La menuda, de 7 puntos, para lo chico (el detalle de Continuar, los rótulos de la ficha, los nombres de las cartas):
//   la misma familia con la cabeza de cada fuste cortada en diagonal, más llana para que se lea a un punto por punto.
// Es propia, no la de Diablo 2. Lo que la letra no tiene (un nombre con letras de otro alfabeto) cae a la letra de base
// sin la tilde (ç, à, ö...) y, si tampoco, al glifo de reserva: un rombo tallado con su cruz, del ancho de una letra.
// Se pinta a puntos enteros del aparato en relieve: luz arriba, sombra abajo y un canto oscuro alrededor que cae abajo a
// la derecha. Los tonos (`TonoGotico`): 'hierro' apagado y frío para lo que no está elegido, 'brasa' el oro caliente del
// encendido, 'oro' el de los títulos, 'hueso' los rótulos, 'ceniza' lo apagado, 'sangre' lo peligroso, o un color propio.
// La parte de datos (`rasterGotico`) no usa el DOM.

/** Filas 0 a 10 de la versal grande (10 es la base). Las tildes van en las filas -3 y -2 (la -1 queda libre). */
const G: Record<string, string[]> = {
  A: ['    #     ', '   ##     ', '   ###    ', '  ## ##   ', '  ##  ##  ', ' ##   ##  ', ' ######## ', ' ##  # ## ', '##     ## ', '##     ## ', '#     ####'],
  B: ['#####   ', ' ##  ## ', ' ##   ##', ' ##  ## ', ' ## ##  ', ' ####   ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', '###### #'],
  C: ['  #### #', ' #   ## ', '##    # ', '##      ', '##      ', '###     ', '##      ', '##      ', '##     #', ' ##   ##', '  ####  '],
  D: ['#####   ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##   ##', ' ##  ###', ' ##   ##', ' ##   ##', ' ##   ##', ' ##  ## ', '#####   '],
  E: ['#  #####', ' ##  ## ', ' ##     ', ' ##   # ', ' ##  ## ', ' ###### ', ' ##  ## ', ' ##   # ', ' ##     ', ' ##   ##', '###### #'],
  F: ['#  #####', ' ##  ## ', ' ##     ', ' ##   # ', ' ##  ## ', ' ###### ', ' ##  ## ', ' ##   # ', ' ##     ', ' ##     ', '###     '],
  G: ['  #### # ', ' #   ##  ', '##    #  ', '##       ', '##       ', '###  ####', '##    ## ', '##    ## ', '##    ## ', ' ##  ### ', '  #### # '],
  H: ['#     #  ', ' ##    ##', ' ##    ##', ' ##    ##', ' ##    ##', ' ########', ' ## #  ##', ' ##    ##', ' ##    ##', ' ##    ##', '###   ###'],
  I: ['#  ', ' ##', ' ##', ' ##', ' ##', '###', ' ##', ' ##', ' ##', ' ##', '###'],
  J: ['#   ', ' ###', '  ##', '  ##', '  ##', '  ##', '  ##', '  ##', '  ##', '# ##', ' ## '],
  K: ['#    ### ', ' ##   #  ', ' ##  #   ', ' ## #    ', ' ####    ', ' ####    ', ' ## ##   ', ' ##  ##  ', ' ##  ##  ', ' ##   ## ', '###   ###'],
  L: ['#       ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##   ##', '###### #'],
  M: ['#     #  ', ' ##    ##', ' ###  ###', ' ## ## ##', ' ## ## ##', ' ##    ##', ' ##    ##', ' ##    ##', ' ##    ##', ' ##    ##', '###   ###'],
  N: ['#     #   ', ' ####  ## ', ' ####  ## ', ' ## ## ## ', ' ## ## ## ', ' ##  #### ', ' ##  #### ', ' ##   ### ', ' ##   ### ', ' ##    ## ', '###    ###'],
  O: ['  ####  ', ' #   ## ', '##    ##', '##    ##', '##    ##', '###  ###', '##    ##', '##    ##', '##    ##', ' ##   # ', '  ####  '],
  P: ['#####   ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', ' ## ##  ', ' ####   ', ' ##     ', ' ##     ', ' ##     ', '###     '],
  Q: ['  ####   ', ' #   ##  ', '##    ## ', '##    ## ', '##    ## ', '###  ### ', '##    ## ', '##    ## ', '##  # ## ', ' ## ###  ', '  ##  ###'],
  R: ['#####   ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', ' #####  ', ' ## ##  ', ' ##  ## ', ' ##  ## ', ' ##   ##', '###   ##'],
  S: ['  #### #', ' #    # ', '##      ', '###     ', ' ###    ', '  ####  ', '    ### ', '     ###', '      ##', ' #    # ', '# ####  '],
  T: ['## #### #', '#  ##   #', '   ##    ', '   ##    ', '   ##    ', '   ##    ', '   ##    ', '   ##    ', '   ##    ', '   ##    ', '  ###    '],
  U: ['#     #  ', ' ##    ##', ' ##    ##', ' ##    ##', ' ##    ##', ' ##   ###', ' ##    ##', ' ##    ##', ' ##    ##', '  ##  ###', '   ### # '],
  V: ['#     # ', ' ##    #', ' ##    #', ' ##    #', '  ##   #', '  ##  # ', '  ##  # ', '   ## # ', '   #### ', '    ##  ', '    #   '],
  W: ['#   #    # ', ' ##  ##   #', ' ##  ##   #', ' ##  ##   #', ' ##  ##   #', ' ##  ##   #', ' ##  ### # ', ' ##  # ### ', '  ## #  ## ', '   ##   #  ', '   #    #  '],
  X: ['#     #  ', ' ##   #  ', '  ##  #  ', '  ## #   ', '   ###   ', '   ##    ', '   ###   ', '  # ##   ', '  #  ##  ', ' #    ## ', '###   ###'],
  Y: ['#     #', ' ##   #', ' ##   #', '  ## # ', '  ## # ', '   ##  ', '   ##  ', '   ##  ', '   ##  ', '   ##  ', '  ###  '],
  Z: ['## #####', '#    ## ', '    ##  ', '    ##  ', '   ##   ', '  ####  ', '  ##    ', ' ##     ', ' ##     ', '##    ##', '###### #'],
  '0': [' #### ', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
  '1': ['  ## ', ' ### ', '# ## ', '  ## ', '  ## ', '  ## ', '  ## ', '  ## ', '  ## ', '  ## ', '#####'],
  '2': [' #### ', '##  ##', '    ##', '    ##', '   ## ', '  ##  ', ' ##   ', ' ##   ', '##    ', '##   #', '######'],
  '3': [' #### ', '##  ##', '    ##', '    ##', '   ## ', '  ### ', '    ##', '    ##', '    ##', '##  ##', ' #### '],
  '4': ['   ## ', '  ### ', '  ### ', ' # ## ', ' # ## ', '#  ## ', '######', '   ## ', '   ## ', '   ## ', '  ####'],
  '5': ['######', '##    ', '##    ', '##    ', '##### ', '    ##', '    ##', '    ##', '    ##', '##  ##', ' #### '],
  '6': ['  ### ', ' ##   ', '##    ', '##    ', '##### ', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
  '7': ['######', '#   ##', '    ##', '   ## ', '   ## ', '  ##  ', '  ##  ', '  ##  ', '  ##  ', '  ##  ', ' #### '],
  '8': [' #### ', '##  ##', '##  ##', '##  ##', ' #### ', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
  '9': [' #### ', '##  ##', '##  ##', '##  ##', '##  ##', ' #####', '    ##', '    ##', '    ##', '   ## ', ' ###  '],
  '.': ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '##', '##'],
  ',': ['  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '  ', '##', '##', ' #', '# '],
  ':': ['  ', '  ', '  ', '##', '##', '  ', '  ', '  ', '  ', '##', '##'],
  ';': ['  ', '  ', '  ', '##', '##', '  ', '  ', '  ', '  ', '##', '##', ' #', '# '],
  '·': ['  ', '  ', '  ', '  ', '  ', '##', '##'],
  '-': ['    ', '    ', '    ', '    ', '    ', '####'],
  "'": ['##', '##', ' #', '# '],
  '!': ['##', '##', '##', '##', '##', '##', '##', '  ', '  ', '##', '##'],
  '¡': ['##', '##', '  ', '  ', '##', '##', '##', '##', '##', '##', '##'],
  '?': [' #### ', '##  ##', '    ##', '    ##', '   ## ', '  ##  ', '  ##  ', '      ', '      ', '  ##  ', '  ##  '],
  '¿': ['  ##  ', '  ##  ', '      ', '      ', '  ##  ', '  ##  ', ' ##   ', '##    ', '##    ', '##  ##', ' #### '],
  '(': ['  #', ' ##', '## ', '## ', '## ', '## ', '## ', '## ', '## ', ' ##', '  #'],
  ')': ['#  ', '## ', ' ##', ' ##', ' ##', ' ##', ' ##', ' ##', ' ##', '## ', '#  '],
  '/': ['     #', '     #', '    # ', '    # ', '   #  ', '   #  ', '  #   ', '  #   ', ' #    ', ' #    ', '#     '],
  '‹': ['    ', '    ', '   #', '  ##', ' ## ', '##  ', ' ## ', '  ##', '   #'],
  '›': ['    ', '    ', '#   ', '##  ', ' ## ', '  ##', ' ## ', '##  ', '#   '],
  '%': ['##    #', '##   # ', '    #  ', '    #  ', '   #   ', '   #   ', '  #    ', '  #    ', ' #   ##', '#    ##', '       '],
  '+': ['      ', '      ', '      ', '  ##  ', '  ##  ', '######', '  ##  ', '  ##  ', '      '],
  '&': [' ###   ', '## ##  ', '## ##  ', ' ###   ', ' ##    ', '## ## #', '##  ## ', '##   # ', '##  ## ', ' ### ##', '       '],
};
/** La menuda: filas 0 a 6 (6 es la base). */
const G7: Record<string, string[]> = {
  A: ['  #   ', ' ###  ', ' # ## ', '##  ##', '######', '##  ##', '##  ##'],
  B: [' #### ', '##  ##', '##  # ', '##### ', '##  ##', '##  ##', '##### '],
  C: [' #### ', '##  ##', '##    ', '##    ', '##    ', '##  ##', ' #### '],
  D: [' ###  ', '## ## ', '##  ##', '##  ##', '##  ##', '## ## ', '####  '],
  E: [' #####', '##    ', '##    ', '##### ', '##    ', '##    ', '######'],
  F: [' #####', '##    ', '##    ', '##### ', '##    ', '##    ', '###   '],
  G: [' #### ', '##  ##', '##    ', '## ###', '##  ##', '##  ##', ' #####'],
  H: [' #   # ', '##  ## ', '##  ## ', '###### ', '##  ## ', '##  ## ', '### ###'],
  I: [' # ', '## ', '## ', '## ', '## ', '## ', '###'],
  J: ['   ##', '   ##', '   ##', '   ##', '   ##', '## ##', ' ### '],
  K: [' #  ##', '## ## ', '####  ', '###   ', '####  ', '## ## ', '### ##'],
  L: [' #    ', '##    ', '##    ', '##    ', '##    ', '##    ', '######'],
  M: [' #   ## ', '### ### ', '####### ', '## # ## ', '##   ## ', '##   ## ', '###  ###'],
  N: [' #   # ', '### ## ', '###### ', '## ### ', '##  ## ', '##  ## ', '### ###'],
  O: [' #### ', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
  P: [' #### ', '##  ##', '##  ##', '##### ', '##    ', '##    ', '###   '],
  Q: [' #### ', '##  ##', '##  ##', '##  ##', '## ###', '##  # ', ' ## ##'],
  R: [' ####  ', '##  ## ', '##  ## ', '#####  ', '## ##  ', '##  ## ', '### ###'],
  S: [' #### ', '##  ##', '##    ', ' #### ', '    ##', '##  ##', ' #### '],
  T: ['######', '  ##  ', '  ##  ', '  ##  ', '  ##  ', '  ##  ', '  ##  '],
  U: [' #   #', '##  ##', '##  ##', '##  ##', '##  ##', '##  ##', ' #### '],
  V: ['##  ##', '##  ##', '##  ##', '##  ##', ' #### ', ' #### ', '  ##  '],
  W: [' #    # ', '##   ## ', '##   ## ', '## # ## ', '####### ', '### ### ', '##   ###'],
  X: ['##  ##', '##  ##', ' #### ', '  ##  ', ' #### ', '##  ##', '##  ##'],
  Y: ['##  ##', '##  ##', ' #### ', '  ##  ', '  ##  ', '  ##  ', '  ##  '],
  Z: ['######', '    ##', '   ## ', '  ##  ', ' ##   ', '##    ', '######'],
  "0": [' #### ', '##  ##', '## ###', '### ##', '##  ##', '##  ##', ' #### '],
  "1": [' ## ', '### ', ' ## ', ' ## ', ' ## ', ' ## ', '####'],
  "2": [' #### ', '##  ##', '    ##', '   ## ', '  ##  ', ' ##   ', '######'],
  "3": ['##### ', '    ##', '    ##', ' #### ', '    ##', '    ##', '##### '],
  "4": ['   ## ', '  ### ', ' #### ', '## ## ', '######', '   ## ', '   ## '],
  "5": ['######', '##    ', '##### ', '    ##', '    ##', '##  ##', ' #### '],
  "6": [' #### ', '##    ', '##### ', '##  ##', '##  ##', '##  ##', ' #### '],
  "7": ['######', '    ##', '   ## ', '  ##  ', '  ##  ', '  ##  ', '  ##  '],
  "8": [' #### ', '##  ##', '##  ##', ' #### ', '##  ##', '##  ##', ' #### '],
  "9": [' #### ', '##  ##', '##  ##', ' #####', '    ##', '    ##', ' #### '],
  '.': ['  ', '  ', '  ', '  ', '  ', '##', '##'],
  ',': ['  ', '  ', '  ', '  ', '  ', '##', '##', ' #'],
  ':': ['  ', '##', '##', '  ', '  ', '##', '##'],
  ';': ['  ', '##', '##', '  ', '  ', '##', '##', ' #'],
  '·': ['  ', '  ', '  ', '##', '  ', '  ', '  '],
  '-': ['    ', '    ', '    ', '####', '    ', '    ', '    '],
  "'": ['##', ' #', '  '],
  '!': ['##', '##', '##', '##', '  ', '##', '##'],
  '¡': ['##', '##', '  ', '##', '##', '##', '##'],
  '?': [' #### ', '##  ##', '   ## ', '  ##  ', '      ', '  ##  ', '  ##  '],
  '¿': ['  ##  ', '  ##  ', '      ', '  ##  ', ' ##   ', '##  ##', ' #### '],
  '(': [' #', '# ', '# ', '# ', '# ', '# ', ' #'],
  ')': ['# ', ' #', ' #', ' #', ' #', ' #', '# '],
  '/': ['    #', '   # ', '   # ', '  #  ', ' #   ', ' #   ', '#    '],
  '‹': ['   ', '  #', ' ##', '## ', ' ##', '  #', '   '],
  '›': ['   ', '#  ', '## ', ' ##', '## ', '#  ', '   '],
  '%': ['##  #', '## # ', '  #  ', '  #  ', ' # ##', '#  ##', '     '],
  '+': ['    ', ' ## ', '####', ' ## ', '    ', '    ', '    '],
  '&': [' ##  ', '#  # ', ' ##  ', '## # ', '#  # ', ' ## #', '     '],
};
/** El glifo de reserva (lo que la letra no tiene): un rombo tallado con su cruz adentro, de la altura de la versal. */
const RESERVA: Record<number, string[]> = {
  11: ['    #    ', '   ###   ', '  ## ##  ', ' ##   ## ', '##  #  ##', '## ### ##', '##  #  ##', ' ##   ## ', '  ## ##  ', '   ###   ', '    #    '],
  7: ['  #  ', ' ### ', '## ##', '#####', '## ##', ' ### ', '  #  '],
};
/** Las tildes, sobre la letra de base: aguda y grave en cuña, diéresis de dos rombos, la virgulilla con su remate y la cedilla. */
type Marca = 'agudo' | 'grave' | 'tilde' | 'dieresis' | 'cedilla' | 'circunflejo';
const ACENTO: Record<string, [string, Marca]> = {
  Á: ['A', 'agudo'], É: ['E', 'agudo'], Í: ['I', 'agudo'], Ó: ['O', 'agudo'], Ú: ['U', 'agudo'], Ü: ['U', 'dieresis'], Ñ: ['N', 'tilde'],
  À: ['A', 'grave'], È: ['E', 'grave'], Ì: ['I', 'grave'], Ò: ['O', 'grave'], Ù: ['U', 'grave'],
  Ä: ['A', 'dieresis'], Ë: ['E', 'dieresis'], Ï: ['I', 'dieresis'], Ö: ['O', 'dieresis'], Ç: ['C', 'cedilla'],
  Â: ['A', 'circunflejo'], Ê: ['E', 'circunflejo'], Î: ['I', 'circunflejo'], Ô: ['O', 'circunflejo'], Û: ['U', 'circunflejo'],
};
interface Talla { alto: number; sep: number; espacio: number; g: Record<string, string[]> }
const TALLAS = { grande: { alto: 11, sep: 2, espacio: 5, g: G } as Talla, menuda: { alto: 7, sep: 1, espacio: 3, g: G7 } as Talla };
export type TallaGotica = keyof typeof TALLAS;
const ARRIBA = 3, ABAJO = 2;

interface Glifo { w: number; px: [number, number][] }
const glifos = new Map<string, Glifo>();
/** ¿La letra tiene este carácter (o su base sin tilde)? */
export function tieneGotico(c: string): boolean {
  return versales(c).every((ch) => ch === ' ' || !!ACENTO[ch] || !!G[ch] || !!G[ch.normalize('NFD')[0]]);
}
function glifo(c0: string, t: TallaGotica): Glifo | null {
  const ch = c0;
  if (ch === ' ' || ch === ' ' || ch === ' ') return null;
  const clave = t + ch;
  let g = glifos.get(clave); if (g) return g;
  const T = TALLAS[t], ac = ACENTO[ch];
  const base = T.g[ac ? ac[0] : ch] ?? T.g[ch.normalize('NFD')[0]] ?? RESERVA[T.alto];
  const w = Math.max(...base.map((f) => f.length));
  const px: [number, number][] = [];
  base.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (f[x] === '#') px.push([x, y]); });
  if (ac) {
    const c = Math.floor(w / 2), A = T.alto === 11 ? 0 : 1; // (en la menuda la tilde baja una fila: queda pegada a la letra)
    const m = ac[1];
    if (m === 'agudo') px.push([c + 1, -3 + A], [c + 2, -3 + A], [c, -2 + A], [c + 1, -2 + A]);
    else if (m === 'grave') px.push([c - 2, -3 + A], [c - 1, -3 + A], [c - 1, -2 + A], [c, -2 + A]);
    else if (m === 'dieresis') px.push([c - 2, -3 + A], [c - 3, -2 + A], [c - 2, -2 + A], [c + 1, -3 + A], [c + 1, -2 + A], [c + 2, -2 + A]);
    else if (m === 'circunflejo') px.push([c - 2, -2 + A], [c - 1, -3 + A], [c, -3 + A], [c + 1, -2 + A]);
    else if (m === 'cedilla') px.push([c, T.alto], [c + 1, T.alto + 1], [c - 1, T.alto + 1]);
    else px.push([c - 3, -2 + A], [c - 2, -3 + A], [c - 1, -3 + A], [c, -2 + A], [c + 1, -2 + A], [c + 2, -3 + A]);
  }
  g = { w, px }; glifos.set(clave, g); return g;
}
/** Letras de otros alfabetos latinos que se escriben con dos de las nuestras o con la base (antes de caer a la reserva). */
const LIGA: Record<string, string> = { Æ: 'AE', Œ: 'OE', Ø: 'O', Ð: 'D', Đ: 'D', Þ: 'TH', Ł: 'L', Ħ: 'H', Ŧ: 'T', ẞ: 'SS', Ĳ: 'IJ' };
/** Las versales del texto, letra por letra (toUpperCase puede alargar: la ß da SS). */
const versales = (s: string) => [...s.toUpperCase()].flatMap((c) => [...(LIGA[c] ?? c)]);

/** Lo que queda de un texto en la letra: tinta por punto (1) en una grilla con margen para el canto. `base` es la fila de la base. */
export interface RasterGotico { w: number; h: number; tinta: Uint8Array; base: number; arriba: number; alto: number }
export function rasterGotico(s: string, talla: TallaGotica = 'grande'): RasterGotico {
  const T = TALLAS[talla], gs: (Glifo | null)[] = [];
  for (const ch of versales(s)) gs.push(glifo(ch, talla));
  let ancho = 0;
  gs.forEach((g, i) => { ancho += g ? g.w : T.espacio; if (i < gs.length - 1) ancho += g ? T.sep : 0; });
  const m = 2, w = Math.max(1, ancho) + m * 2, h = ARRIBA + T.alto + ABAJO + m * 2, tinta = new Uint8Array(w * h);
  let x = m;
  for (const g of gs) {
    if (!g) { x += T.espacio; continue; }
    for (const [a, b] of g.px) { const X = x + a, Y = m + ARRIBA + b; if (X >= 0 && Y >= 0 && X < w && Y < h) tinta[Y * w + X] = 1; }
    x += g.w + T.sep;
  }
  return { w, h, tinta, base: m + ARRIBA + T.alto - 1, arriba: m + ARRIBA, alto: T.alto };
}
/** El ancho de un texto en puntos de la letra (sin el margen del canto). */
export const anchoGotico = (s: string, talla: TallaGotica = 'grande') => rasterGotico(s, talla).w - 4;

// ------------------------------------------------------------------ pintar (DOM)
type C3 = [number, number, number];
export type TonoGotico = 'hierro' | 'brasa' | 'oro' | 'hueso' | 'ceniza' | 'sangre' | C3;
interface Rampa { arriba: C3; abajo: C3; luz: C3; sombra: C3; canto: [number, number, number, number] }
const RAMPA: Record<Exclude<TonoGotico, C3>, Rampa> = {
  // hierro frío: gris con un dejo azul, más claro arriba donde le da la luna
  hierro: { arriba: [150, 148, 147], abajo: [65, 63, 71], luz: [178, 174, 168], sombra: [40, 36, 42], canto: [8, 4, 6, 0.92] },
  // el oro caliente del encendido (claro arriba, brasa abajo)
  brasa: { arriba: [255, 238, 186], abajo: [150, 80, 28], luz: [255, 248, 220], sombra: [96, 44, 14], canto: [14, 4, 2, 0.94] },
  // el oro de los títulos grabados: más hondo y menos encendido que la brasa
  oro: { arriba: [255, 230, 168], abajo: [140, 84, 30], luz: [255, 244, 206], sombra: [70, 36, 12], canto: [10, 4, 2, 0.94] },
  // hueso viejo: los rótulos
  hueso: { arriba: [222, 208, 172], abajo: [120, 104, 76], luz: [240, 230, 200], sombra: [52, 42, 30], canto: [8, 5, 4, 0.92] },
  // ceniza: lo apagado
  ceniza: { arriba: [150, 136, 108], abajo: [82, 72, 56], luz: [170, 158, 130], sombra: [34, 28, 22], canto: [6, 4, 3, 0.9] },
  // sangre: lo que avisa (borrar, Pesadilla, Infierno)
  sangre: { arriba: [255, 150, 120], abajo: [130, 30, 20], luz: [255, 200, 170], sombra: [60, 10, 6], canto: [10, 2, 2, 0.94] },
};
function rampaDe(t: TonoGotico): Rampa {
  if (typeof t === 'string') return RAMPA[t];
  const mez = (c: C3, o: C3, k: number) => c.map((v, i) => Math.round(v + (o[i] - v) * k)) as C3;
  return { arriba: mez(t, [255, 245, 225], 0.35), abajo: mez(t, [20, 12, 8], 0.45), luz: mez(t, [255, 250, 235], 0.55), sombra: mez(t, [10, 6, 4], 0.72), canto: [8, 4, 3, 0.92] };
}
const hechas = new Map<string, HTMLCanvasElement>();
/** El texto pintado a un punto por punto de la letra, con su canto y su relieve (se guarda por texto, tono y talla). */
export function lienzoGotico(s: string, tono: TonoGotico, talla: TallaGotica = 'grande'): { c: HTMLCanvasElement; r: RasterGotico } {
  const r = rasterGotico(s, talla), clave = `${s}|${tono}|${talla}`;
  let c = hechas.get(clave);
  if (!c) {
    c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
    const g = c.getContext('2d')!, im = g.createImageData(r.w, r.h), d = im.data, { w, h, tinta } = r, P = rampaDe(tono);
    const en = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && tinta[y * w + x] === 1;
    const [cr, cg, cb, ca] = P.canto, ult = r.alto - 1;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      if (en(x, y)) {
        const fila = Math.max(0, Math.min(ult, y - r.arriba)) / ult, arr = !en(x, y - 1), abj = !en(x, y + 1), izq = !en(x - 1, y);
        let col = P.arriba.map((v, k) => v + (P.abajo[k] - v) * fila) as C3;
        if (arr) col = P.luz; else if (abj) col = P.sombra; else if (izq) col = col.map((v, k) => (v + P.luz[k]) / 2) as C3;
        d[j] = col[0]; d[j + 1] = col[1]; d[j + 2] = col[2]; d[j + 3] = 255;
      } else if (en(x - 1, y) || en(x + 1, y) || en(x, y - 1) || en(x, y + 1) || en(x - 1, y - 1) || en(x - 1, y + 1) || en(x + 1, y - 1)) {
        // el canto oscuro alrededor, y más grueso abajo a la derecha (la sombra que cae)
        d[j] = cr; d[j + 1] = cg; d[j + 2] = cb; d[j + 3] = ca * 255;
      } else if (en(x - 1, y - 1) || en(x - 2, y - 2) || en(x - 1, y - 2)) { d[j] = cr; d[j + 1] = cg; d[j + 2] = cb; d[j + 3] = ca * 150; }
    }
    g.putImageData(im, 0, 0);
    if (hechas.size > 160) hechas.delete(hechas.keys().next().value!);
    hechas.set(clave, c);
  }
  return { c, r };
}
/** Puntos del aparato por punto de la letra para un renglón de `tam` puntos lógicos (la versal mide unos 0,8 de `tam`). */
export const puntoGotico = (tam: number, res: number, talla: TallaGotica = 'grande') => Math.max(1, Math.round((tam * 0.8 * res) / TALLAS[talla].alto));
