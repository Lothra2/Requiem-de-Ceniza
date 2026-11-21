// La letra gótica de pixel del menú de la portada: versales talladas de 11 puntos de alto (fustes de dos, perfiles de
// uno, remates en cuña y patas que se abren), con las tildes, la ü y la ñ del castellano. Es propia, no la de Diablo 2.
// Se pinta a puntos enteros del aparato en relieve: luz arriba, sombra abajo y un canto oscuro alrededor que cae abajo a
// la derecha. 'hierro': apagado y frío, para lo que no está elegido; 'brasa': el oro caliente del renglón encendido
// (que además lleva el canto de brasa de brasa_menu.ts). La parte de datos (`rasterGotico`) no usa el DOM.

/** Filas 0 a 10 de la versal (10 es la base). Las tildes van en las filas -3 y -2 (la -1 queda libre). */
const G: Record<string, string[]> = {
  A: ['    #    ', '   ###   ', '   ###   ', '  ## ##  ', '  ## ##  ', ' ##   ## ', ' ####### ', ' ##   ## ', '##     ##', '##     ##', '###   ###'],
  B: ['######  ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', ' #####  ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', '######  '],
  C: ['  ##### ', ' ##   ##', '##     #', '##      ', '##      ', '##      ', '##      ', '##      ', '##     #', ' ##   ##', '  ##### '],
  D: ['######  ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##   ##', ' ##   ##', ' ##   ##', ' ##   ##', ' ##   ##', ' ##  ## ', '######  '],
  E: ['########', ' ##    #', ' ##     ', ' ##   # ', ' ##   # ', ' ###### ', ' ##   # ', ' ##   # ', ' ##     ', ' ##    #', '########'],
  F: ['########', ' ##    #', ' ##     ', ' ##   # ', ' ##   # ', ' ###### ', ' ##   # ', ' ##   # ', ' ##     ', ' ##     ', '####    '],
  G: ['  ##### ', ' ##   ##', '##     #', '##      ', '##      ', '##  ####', '##    ##', '##    ##', '##    ##', ' ##   ##', '  ##### '],
  H: ['####  ####', ' ##    ## ', ' ##    ## ', ' ##    ## ', ' ##    ## ', ' ######## ', ' ##    ## ', ' ##    ## ', ' ##    ## ', ' ##    ## ', '####  ####'],
  I: ['####', ' ## ', ' ## ', ' ## ', ' ## ', ' ## ', ' ## ', ' ## ', ' ## ', ' ## ', '####'],
  J: ['  ####', '   ## ', '   ## ', '   ## ', '   ## ', '   ## ', '   ## ', '   ## ', '#  ## ', '## ## ', ' ###  '],
  K: ['#### ###', ' ##   # ', ' ##  #  ', ' ## #   ', ' ####   ', ' #####  ', ' ## ##  ', ' ##  ## ', ' ##  ## ', ' ##   ##', '#### ###'],
  L: ['####    ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', ' ##    #', '########'],
  M: ['###     ###', ' ##     ## ', ' ###   ### ', ' ###   ### ', ' ## # # ## ', ' ## # # ## ', ' ##  #  ## ', ' ##  #  ## ', ' ##     ## ', ' ##     ## ', '####   ####'],
  N: ['###   ###', ' ##    # ', ' ###   # ', ' # ##  # ', ' # ##  # ', ' #  ## # ', ' #  ## # ', ' #   ### ', ' #   ### ', ' #    ## ', '###    # '],
  O: ['  ####  ', ' ##  ## ', '##    ##', '##    ##', '##    ##', '##    ##', '##    ##', '##    ##', '##    ##', ' ##  ## ', '  ####  '],
  P: ['######  ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', ' #####  ', ' ##     ', ' ##     ', ' ##     ', ' ##     ', '####    '],
  Q: ['  ####   ', ' ##  ##  ', '##    ## ', '##    ## ', '##    ## ', '##    ## ', '##    ## ', '##  # ## ', '##   ##  ', ' ##  ##  ', '  #### ##'],
  R: ['######  ', ' ##  ## ', ' ##   ##', ' ##   ##', ' ##  ## ', ' #####  ', ' ## ##  ', ' ##  ## ', ' ##  ## ', ' ##   ##', '#### ###'],
  S: [' ##### ', '##   ##', '##    #', '##     ', ' ###   ', '  #### ', '    ## ', '     ##', '#    ##', '##   ##', ' ##### '],
  T: ['########', '#  ##  #', '   ##   ', '   ##   ', '   ##   ', '   ##   ', '   ##   ', '   ##   ', '   ##   ', '   ##   ', '  ####  '],
  U: ['####  ###', ' ##    # ', ' ##    # ', ' ##    # ', ' ##    # ', ' ##    # ', ' ##    # ', ' ##    # ', ' ##    # ', ' ##   #  ', '  ####   '],
  V: ['####  ###', ' ##    # ', ' ##    # ', '  ##  #  ', '  ##  #  ', '  ##  #  ', '   ## #  ', '   ####  ', '   ###   ', '    ##   ', '    #    '],
  W: ['###  ##  ###', ' ##  ##  #  ', ' ##  ##  #  ', ' ##  ##  #  ', '  ## ### #  ', '  ## # # #  ', '  ## # ##   ', '   ### ##   ', '   ##  ##   ', '   ##  #    ', '   #   #    '],
  X: ['####  ###', ' ##    # ', '  ##  #  ', '  ##  #  ', '   ####  ', '    ##   ', '   ####  ', '  #  ##  ', '  #  ##  ', ' #    ## ', '###  ####'],
  Y: ['####  ###', ' ##    # ', '  ##  #  ', '  ##  #  ', '   ####  ', '    ##   ', '    ##   ', '    ##   ', '    ##   ', '    ##   ', '   ####  '],
  Z: ['########', '#    ## ', '    ##  ', '    ##  ', '   ##   ', '   ##   ', '  ##    ', '  ##    ', ' ##     ', '##     #', '########'],
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
};
/** Las tildes, sobre la letra de base: aguda en cuña, diéresis de dos rombos y la virgulilla con su remate. */
const ACENTO: Record<string, [string, 'agudo' | 'tilde' | 'dieresis']> = {
  Á: ['A', 'agudo'], É: ['E', 'agudo'], Í: ['I', 'agudo'], Ó: ['O', 'agudo'], Ú: ['U', 'agudo'], Ü: ['U', 'dieresis'], Ñ: ['N', 'tilde'],
};
const ALTO = 11, ARRIBA = 3, ABAJO = 2;
/** Separación entre letras y ancho del espacio (puntos de la letra). */
const SEP = 2, ESPACIO = 5;

interface Glifo { w: number; px: [number, number][] }
const glifos = new Map<string, Glifo>();
function glifo(c0: string): Glifo | null {
  const ch = c0.toUpperCase();
  if (ch === ' ' || ch === ' ' || ch === ' ') return null;
  let g = glifos.get(ch); if (g) return g;
  const ac = ACENTO[ch], base = G[ac ? ac[0] : ch] ?? G[ch.normalize('NFD')[0]] ?? G['?'], w = Math.max(...base.map((f) => f.length));
  const px: [number, number][] = [];
  base.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (f[x] === '#') px.push([x, y]); });
  if (ac) {
    const c = Math.floor(w / 2);
    if (ac[1] === 'agudo') px.push([c + 1, -3], [c + 2, -3], [c, -2], [c + 1, -2]);
    else if (ac[1] === 'dieresis') px.push([c - 2, -3], [c - 3, -2], [c - 2, -2], [c + 1, -3], [c + 1, -2], [c + 2, -2]);
    else px.push([c - 3, -2], [c - 2, -3], [c - 1, -3], [c, -2], [c + 1, -2], [c + 2, -3]);
  }
  g = { w, px }; glifos.set(ch, g); return g;
}

/** Lo que queda de un texto en la letra: tinta por punto (1) en una grilla con margen para el canto. `base` es la fila de la base. */
export interface RasterGotico { w: number; h: number; tinta: Uint8Array; base: number; arriba: number }
export function rasterGotico(s: string): RasterGotico {
  const gs: (Glifo | null)[] = [];
  for (const ch of s) gs.push(glifo(ch));
  let ancho = 0;
  gs.forEach((g, i) => { ancho += g ? g.w : ESPACIO; if (i < gs.length - 1) ancho += g ? SEP : 0; });
  const m = 2, w = ancho + m * 2, h = ARRIBA + ALTO + ABAJO + m * 2, tinta = new Uint8Array(w * h);
  let x = m;
  for (const g of gs) {
    if (!g) { x += ESPACIO; continue; }
    for (const [a, b] of g.px) { const X = x + a, Y = m + ARRIBA + b; if (X >= 0 && Y >= 0 && X < w && Y < h) tinta[Y * w + X] = 1; }
    x += g.w + SEP;
  }
  return { w, h, tinta, base: m + ARRIBA + ALTO - 1, arriba: m + ARRIBA };
}

// ------------------------------------------------------------------ pintar (DOM)
export type TonoGotico = 'hierro' | 'brasa';
/** Rampas de arriba abajo de la versal (11 filas) y el labio de luz y la sombra de abajo. */
const RAMPA: Record<TonoGotico, { cuerpo: [number, number, number][]; luz: [number, number, number]; sombra: [number, number, number]; canto: string }> = {
  // hierro frío: gris con un dejo azul, más claro arriba donde le da la luna
  hierro: { cuerpo: [[150, 148, 147], [140, 138, 138], [131, 129, 130], [122, 120, 122], [113, 111, 114], [105, 103, 106], [97, 95, 99], [89, 87, 92], [81, 79, 85], [73, 71, 78], [65, 63, 71]], luz: [178, 174, 168], sombra: [40, 36, 42], canto: 'rgba(8,4,6,0.92)' },
  // el oro caliente del encendido (el mismo del grabado de antes: claro arriba, brasa abajo)
  brasa: { cuerpo: [[255, 238, 186], [255, 226, 160], [250, 210, 130], [244, 194, 104], [238, 178, 86], [230, 160, 70], [220, 142, 58], [206, 124, 48], [190, 108, 40], [172, 94, 34], [150, 80, 28]], luz: [255, 248, 220], sombra: [96, 44, 14], canto: 'rgba(14,4,2,0.94)' },
};
const hechas = new Map<string, HTMLCanvasElement>();
/** El texto pintado a un punto por punto de la letra, con su canto y su relieve (se guarda por texto y tono). */
export function lienzoGotico(s: string, tono: TonoGotico): { c: HTMLCanvasElement; r: RasterGotico } {
  const r = rasterGotico(s), clave = `${s}|${tono}`;
  let c = hechas.get(clave);
  if (!c) {
    c = document.createElement('canvas'); c.width = r.w; c.height = r.h;
    const g = c.getContext('2d')!, im = g.createImageData(r.w, r.h), d = im.data, { w, h, tinta } = r, P = RAMPA[tono];
    const en = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && tinta[y * w + x] === 1;
    const [cr, cg, cb, ca] = P.canto.match(/[\d.]+/g)!.map(Number);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const j = (y * w + x) * 4;
      if (en(x, y)) {
        const fila = Math.max(0, Math.min(10, y - r.arriba)), arr = !en(x, y - 1), abj = !en(x, y + 1), izq = !en(x - 1, y);
        let col = P.cuerpo[fila];
        if (arr) col = P.luz; else if (abj) col = P.sombra; else if (izq) col = col.map((v, k) => (v + P.luz[k]) / 2) as [number, number, number];
        d[j] = col[0]; d[j + 1] = col[1]; d[j + 2] = col[2]; d[j + 3] = 255;
      } else if (en(x - 1, y) || en(x + 1, y) || en(x, y - 1) || en(x, y + 1) || en(x - 1, y - 1) || en(x - 1, y + 1) || en(x + 1, y - 1)) {
        // el canto oscuro alrededor, y más grueso abajo a la derecha (la sombra que cae)
        d[j] = cr; d[j + 1] = cg; d[j + 2] = cb; d[j + 3] = ca * 255;
      } else if (en(x - 1, y - 1) || en(x - 2, y - 2) || en(x - 1, y - 2)) { d[j] = cr; d[j + 1] = cg; d[j + 2] = cb; d[j + 3] = ca * 150; }
    }
    g.putImageData(im, 0, 0);
    if (hechas.size > 64) hechas.delete(hechas.keys().next().value!);
    hechas.set(clave, c);
  }
  return { c, r };
}
/** Puntos del aparato por punto de la letra para un renglón de `tam` puntos lógicos (la versal mide unos 0,8 de `tam`). */
export const puntoGotico = (tam: number, res: number) => Math.max(1, Math.round((tam * 0.8 * res) / ALTO));
