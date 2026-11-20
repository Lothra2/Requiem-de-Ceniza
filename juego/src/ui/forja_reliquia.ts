// La reliquia de la clase en el HUD forjado: el recurso de cada clase como un objeto propio que se lee de un vistazo, en
// el nicho del altar (PC) o sobre el cinturón (táctil). Rick (20 nov 2026) no entendió las cargas del arcanista en la
// plaquita de tres puntos: ahora son tres gemas engastadas que se encienden del color del elemento guardado.
//   arcanista: tres gemas.            berserker: un canal de brasa que se llena y arde al tope.
//   monje: tres cuentas en su cordón.  nigromante: seis calaveras, una por cadáver a mano.
//   cazadora: halcón, marcas y trampas. templario: el sol del aura con su nombre y su fuerza.
//   druida: hombre, lobo y oso.        alquimista: sus frascos, el que se está llenando a medias.
// Todo a puntos enteros: se dibuja en unidades de D puntos del lienzo. Las piezas fijas (gemas, calaveras, frascos...)
// se pintan una vez por color en un lienzo chico y se copian.
import { ctx } from '../nucleo/lienzo';
import { T, TT } from './comun';
import { textoPixel, anchoLetra } from './letra_pixel';
import { hash, cl } from './forja_taller';
import { habilidadDe, frascosMax, ventanaCombo, cadaveresCerca, MAX_CARGAS, colorElem, type Juego } from '../juego/mundo';

const piezas = new Map<string, HTMLCanvasElement>();
/** Una pieza de pixel guardada: se pinta una vez (a un punto por pixel) y se copia agrandada a D. */
function pieza(clave: string, w: number, h: number, pintar: (p: (x: number, y: number, c: string) => void) => void): HTMLCanvasElement {
  let c = piezas.get(clave); if (c) return c;
  c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d')!;
  pintar((x, y, col) => { g.fillStyle = col; g.fillRect(x | 0, y | 0, 1, 1); });
  piezas.set(clave, c); if (piezas.size > 240) piezas.delete(piezas.keys().next().value!);
  return c;
}
const rgb = (h: string): [number, number, number] => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const css = (c: number[], k = 1) => `rgb(${Math.round(cl(c[0] * k, 0, 255))},${Math.round(cl(c[1] * k, 0, 255))},${Math.round(cl(c[2] * k, 0, 255))})`;
const claro = (c: number[], k: number) => c.map((v) => v + (255 - v) * k);

/** Una gema tallada (octógono con tabla): encendida del color, o el engaste vacío. */
function gema(s: number, col: string | null): HTMLCanvasElement {
  return pieza(`gema${s}${col}`, s + 2, s + 2, (p) => {
    const c = (s - 1) / 2, ch = Math.round(s * 0.3), base = col ? rgb(col) : [92, 84, 88];
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const ax = Math.abs(x - c), ay = Math.abs(y - c); if (ax + ay > c + (c - ch) + 0.01) continue;
      const borde = ax + ay > c + (c - ch) - 1 || ax > c - 1 || ay > c - 1, tabla = ax < c * 0.42 && ay < c * 0.42;
      let k: number;
      if (borde) k = 0.3;
      else if (tabla) k = col ? 1.25 - ((x - c) + (y - c)) * 0.04 : 0.55;
      else k = (x - c) + (y - c) < 0 ? (Math.abs(x - c) > Math.abs(y - c) ? 0.95 : 1.1) : (Math.abs(x - c) > Math.abs(y - c) ? 0.55 : 0.7);
      if (!col) k = borde ? 0.75 : tabla ? 0.16 : k * 0.34;
      p(x + 1, y + 1, css(k > 1 ? claro(base, (k - 1) * 1.6) : base, Math.min(1, k)));
    }
    // el brillo duro de la tabla y las cuatro uñas de latón del engaste
    if (col) { p(Math.round(c - c * 0.3) + 1, Math.round(c - c * 0.3) + 1, '#ffffff'); p(Math.round(c - c * 0.3) + 2, Math.round(c - c * 0.3) + 1, css(claro(base, 0.7))); }
    for (const [qx, qy] of [[c, 0], [c, s - 1], [0, c], [s - 1, c]] as [number, number][]) { p(Math.round(qx) + 1, Math.round(qy) + 1, '#d8b060'); }
    for (const [qx, qy] of [[1, 1], [s, 1], [1, s], [s, s]] as [number, number][]) { p(qx, qy, '#8a6c34'); }
  });
}
/** Un dibujo de pixel por filas: '#' el cuerpo, '+' la luz, '-' lo hondo. Encendido del color, o apagado en hierro. */
function glifo(nombre: string, filas: string[], col: string | null, sombra = true): HTMLCanvasElement {
  return pieza(`gl_${nombre}_${col}`, filas[0].length + 1, filas.length + 1, (p) => {
    const b = col ? rgb(col) : [58, 50, 44];
    const en = (x: number, y: number) => y >= 0 && y < filas.length && x >= 0 && x < filas[y].length && filas[y][x] !== '.';
    if (sombra) filas.forEach((f, y) => { for (let x = 0; x < f.length; x++) if (f[x] !== '.' && !en(x + 1, y + 1)) p(x + 1, y + 1, 'rgba(0,0,0,0.7)'); });
    filas.forEach((f, y) => { for (let x = 0; x < f.length; x++) { const q = f[x]; if (q === '.') continue;
      p(x, y, q === '-' ? (col ? css(b, 0.22) : '#0c0908') : q === '+' || !en(x, y - 1) ? css(claro(b, col ? 0.4 : 0.12)) : !en(x, y + 1) ? css(b, 0.6) : css(b)); } });
  });
}
const G = {
  calavera: ['..#######..', '.#########.', '###########', '###########', '##--###--##', '##--###--##', '#####-#####', '.####-####.', '..#######..', '..#-#-#-#..', '...#####...'],
  halcon: ['#.............#', '##...........##', '.###...#...###.', '..####.#.####..', '...#########...', '....#######....', '.....#####.....', '......###......', '.......#.......'],
  mira: ['....#....', '..#####..', '.#..#..#.', '.#.....#.', '###.-.###', '.#.....#.', '.#..#..#.', '..#####..', '....#....'],
  cepo: ['#.#.#.#.#.#', '###########', '#.........#', '.#.......#.', '..#######..', '....###....', '...#####...'],
  hombre: ['....#####....', '...#######...', '...#######...', '...#-###-#...', '...#######...', '....#####....', '.....###.....', '..#########..', '.###########.', '#############', '#############'],
  lobo: ['.#.........#.', '.##.......##.', '.###.....###.', '.###########.', '.###########.', '.##-#####-##.', '.###########.', '..#########..', '...###-###...', '...#######...', '....#####....'],
  oso: ['.##.......##.', '####.....####', '.###########.', '#############', '##-#######-##', '#############', '#####---#####', '.####-#-####.', '.###########.', '..#########..', '....#####....'],
  frasco: ['..###..', '..#+#..', '..#.#..', '.#...#.', '#.....#', '#.....#', '#.....#', '#.....#', '#.....#', '.#...#.', '..###..'],
};
/** El sol del aura: disco con ocho rayos. */
function sol(s: number, col: string | null): HTMLCanvasElement {
  return pieza(`sol${s}${col}`, s, s, (p) => {
    const c = (s - 1) / 2, b = col ? rgb(col) : [58, 50, 44];
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const dx = x - c, dy = y - c, d = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
      const rayo = d > c * 0.62 && d <= c && Math.abs(((a / (Math.PI / 4)) % 1 + 1) % 1 - 0.5) > 0.36;
      if (d <= c * 0.5) p(x, y, d > c * 0.5 - 1 ? css(b, 0.55) : css(claro(b, col ? 0.5 - (dx + dy) * 0.06 : 0.05)));
      else if (rayo) p(x, y, css(b, dx + dy < 0 ? 1 : 0.7));
    }
  });
}

/** Lo que explica cada reliquia al pasarle por encima. */
export const AYUDA_RELIQUIA: Record<string, [string, string]> = {
  berserker: ['Furia: sube al pegar y al recibir golpes, se apaga fuera de combate. Más furia, más daño.', 'Fury: rises when you hit and get hit, fades out of combat. More fury, more damage.'],
  templario: ['Solo un aura activa a la vez. Ponla en el botón derecho para encenderla.', 'Only one aura active at a time. Set it on the right button to light it.'],
  arcanista: ['Cada hechizo de fuego, escarcha o rayo guarda una carga: la gema se enciende de su color. Las cargas suben el daño de su elemento y algunas habilidades las gastan.', 'Every fire, frost or lightning spell stores a charge: the gem lights in its color. Charges raise their element\'s damage and some skills spend them.'],
  cazadora: ['Tu halcón y algunas flechas marcan presas: las marcadas reciben más daño. A la derecha, las trampas armadas.', 'Your hawk and some arrows mark prey: marked prey takes more damage. On the right, your armed traps.'],
  nigromante: ['Los muertos quedan en el suelo un rato: puedes levantarlos, comerlos o reventarlos. Una calavera por cadáver a mano.', 'The dead stay on the ground for a while: you can raise them, eat them or burst them. One skull per corpse in reach.'],
  monje: ['Tres golpes cuerpo a cuerpo seguidos: el tercero es un remate con una onda. El cordón se consume: pega antes de que se acabe.', 'Three melee blows in a row: the third is a finisher with a shockwave. The cord burns down: strike before it runs out.'],
  druida: ['Piel de lobo y piel de oso cambian tu cuerpo. Algunas habilidades solo se usan transformado.', 'Wolfskin and Bearhide change your body. Some skills only work while transformed.'],
  alquimista: ['Las bombas gastan frascos. Se rellenan solos con el tiempo.', 'Bombs use flasks. They refill on their own over time.'],
};

let cargasAntes = 0, cargaT = -9;
/**
 * Dibuja la reliquia de la clase. X, Y: la esquina en puntos del lienzo. Wd, Hd: el tamaño en puntos de dibujo (cada
 * uno de D puntos del lienzo). Hay que llamarla con la transformación del lienzo en la identidad.
 */
export function reliquiaClase(j: Juego, X: number, Y: number, Wd: number, Hd: number, D: number, t: number) {
  const h = j.heroe, d = h.d, alto = Hd >= 34;
  const u = (x: number, y: number, w: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(X + Math.round(x) * D, Y + Math.round(y) * D, Math.round(w) * D, Math.round(hh) * D); };
  const pon = (cv: HTMLCanvasElement, x: number, y: number, k = 1) => ctx.drawImage(cv, X + Math.round(x) * D, Y + Math.round(y) * D, cv.width * D * k, cv.height * D * k);
  const luz = (x: number, y: number, r: number, col: string, a: number) => { if (a <= 0.01) return; const gx = X + x * D, gy = Y + y * D, [cr, cg, cb] = rgb(col); const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, r * D); gl.addColorStop(0, `rgba(${cr},${cg},${cb},${a})`); gl.addColorStop(1, `rgba(${cr},${cg},${cb},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(gx - r * D, gy - r * D, 2 * r * D, 2 * r * D); ctx.restore(); };
  // el rótulo abajo, centrado (el primero que entra)
  const yR = Hd - 3, rotulo = (s: string | string[], col = '#a89878') => { const ls = typeof s === 'string' ? [s] : s, q = ls.find((l) => anchoLetra(l) <= Wd - 4) ?? ls[ls.length - 1]; textoPixel(q, X + Math.round(Wd / 2) * D, Y + yR * D, { D, color: col, alin: 'center' }); };
  const cy = alto ? Math.round((Hd - 11) / 2) : Math.round(Hd / 2); // el centro de la pieza (arriba del rótulo si hay alto)
  switch (d.clase) {
    case 'arcanista': {
      const s = alto ? (Hd >= 40 ? 19 : 17) : 13, sep = s + (Wd > 100 ? 12 : 8), x0 = Math.round(Wd / 2 - sep) - (s >> 1) - 1;
      if (h.cargas.length > cargasAntes) cargaT = t; cargasAntes = h.cargas.length;
      for (let i = 0; i < MAX_CARGAS; i++) {
        const e = h.cargas[i], col = e ? colorElem(e) : null, gx = x0 + i * sep;
        if (col) luz(gx + s / 2 + 1, cy + 0.5, s * 0.95, col, 0.34 + 0.08 * Math.sin(t * 3 + i * 2));
        pon(gema(s, col), gx, cy - (s >> 1) - 1);
        // la que acaba de entrar relumbra
        if (col && i === h.cargas.length - 1 && t - cargaT < 0.35) luz(gx + s / 2 + 1, cy + 0.5, s * 1.4, '#ffffff', 0.6 * (1 - (t - cargaT) / 0.35));
      }
      if (alto) rotulo(h.cargas.length >= MAX_CARGAS ? T('Cargas llenas', 'Charges full') : T('Cargas', 'Charges'), h.cargas.length >= MAX_CARGAS ? '#ffe0a0' : '#a89878');
      break;
    }
    case 'berserker': {
      const k = cl(h.furia / 100), x0 = 10, w = Wd - 20, hb = alto ? 12 : 9, y0 = cy - (hb >> 1) - (alto ? 0 : 1), n = Math.round(w * k), arde = h.furia >= 100 || h.furiaFija > 0, tf = Math.floor(t * 10);
      // el canal: hierro negro con casquillos de latón en las puntas (un cuerno de guerra tendido)
      u(x0 - 1, y0 - 1, w + 2, hb + 2, '#000'); u(x0, y0, w, hb, '#160a08'); u(x0, y0 + hb - 1, w, 1, '#2a1410');
      for (const cx of [x0 - 4, x0 + w]) { u(cx, y0 - 2, 4, hb + 4, '#8a6c34'); u(cx, y0 - 2, 4, 1, '#f0d898'); u(cx, y0 - 1, 1, hb + 2, '#d0aa5c'); u(cx, y0 + hb + 1, 4, 1, '#4a3814'); u(cx + 1, y0 + (hb >> 1), 2, 1, '#2a1a08'); }
      if (n > 0) {
        u(x0, y0, n, hb, arde ? '#e04a14' : '#b02410'); u(x0, y0, n, 2, arde ? '#ffb050' : '#e8572a'); u(x0, y0 + hb - 3, n, 3, arde ? '#8a1c08' : '#6a0e08');
        // la brasa que hierve: pizcas claras que cambian de sitio
        for (let i = 0; i < Math.ceil(n / 7); i++) { const bx = Math.floor(hash(i, tf >> 1, 31) * n), by = 2 + Math.floor(hash(i, tf >> 1, 32) * (hb - 5)); u(x0 + bx, y0 + by, 2, 1, arde ? '#ffe090' : '#ff8a4a'); }
        u(x0 + n - 1, y0, 1, hb, '#ffd0a0');
      }
      for (const q of [0.25, 0.5, 0.75]) u(x0 + Math.round(w * q), y0, 1, hb, 'rgba(0,0,0,0.55)');
      // al tope arde: lenguas de fuego sobre el canal
      if (arde) { for (let x = 0; x < w; x += 2) { const a = 1 + Math.floor(hash(x, tf, 33) * (alto ? 5 : 3)); u(x0 + x, y0 - a, 2, a, '#e85a14'); if (a > 2) u(x0 + x, y0 - a + 2, 2, a - 2, '#ffc050'); } luz(Wd / 2, y0, Wd * 0.5, '#ff5a20', 0.22 + 0.06 * Math.sin(t * 9)); }
      if (alto) rotulo(arde ? T('¡Furia!', 'Fury!') : `${T('Furia', 'Fury')} ${Math.round(h.furia)}`, arde ? '#ffb070' : '#a89878');
      break;
    }
    case 'monje': {
      const vivo = h.combo.paso > 0 && (j.t - h.combo.t <= ventanaCombo(h) || !!h.buffs.loto_dorado), n = vivo ? h.combo.paso : 0;
      const r = alto ? 7 : 5, sep = Math.min(30, Math.round((Wd - 24) / 3)), x0 = Math.round(Wd / 2) - sep;
      const kv = vivo ? (h.buffs.loto_dorado ? 1 : cl(1 - (j.t - h.combo.t) / ventanaCombo(h))) : 0;
      // el cordón: lo que queda de la ventana arde hacia la izquierda
      u(x0 - r - 4, cy, 2 * sep + 2 * r + 8, 1, '#3a2c1c'); if (kv > 0) { const w = Math.round((2 * sep + 2 * r + 8) * kv); u(x0 - r - 4, cy, w, 1, '#e0a040'); u(x0 - r - 4 + w - 1, cy - 1, 2, 3, '#fff0b0'); }
      for (let i = 0; i < 3; i++) { const on = i < n, rr = i === 2 ? r + 1 : r, col = on ? (i === 2 ? '#ffd060' : '#e0b070') : null;
        if (on) luz(x0 + i * sep + 0.5, cy + 0.5, rr * 2.4, i === 2 ? '#ffc040' : '#e09040', 0.3);
        pon(pieza(`cuenta${rr}${col}`, 2 * rr + 2, 2 * rr + 2, (p) => { const b = col ? rgb(col) : [50, 42, 36]; for (let y = -rr; y <= rr; y++) for (let x = -rr; x <= rr; x++) { const q = Math.hypot(x, y); if (q > rr + 0.3) continue; const k2 = q > rr - 0.8 ? 0.35 : 0.75 - (x + y) / (rr * 3.2); p(x + rr, y + rr, css(k2 > 1 ? claro(b, k2 - 1) : b, Math.min(1, k2))); } if (col) p(rr - Math.round(rr * 0.4), rr - Math.round(rr * 0.4), '#fff8e0'); }), x0 + i * sep - rr, cy - rr); }
      if (alto) rotulo(n >= 2 ? T('¡Remata!', 'Finish!') : T('Combo', 'Combo'), n >= 2 ? '#ffd060' : '#a89878');
      break;
    }
    case 'nigromante': {
      const c = cadaveresCerca(j, h.x, h.y, 12).length, n = Math.min(6, c), sep = Math.min(17, Math.floor((Wd - 4) / 6)), x0 = Math.round((Wd - sep * 6) / 2) + ((sep - 11) >> 1);
      for (let i = 0; i < 6; i++) { if (i < n) luz(x0 + i * sep + 5.5, cy, 9, '#b090ff', 0.16); pon(glifo('calavera', G.calavera, i < n ? '#e0d8c0' : null), x0 + i * sep, cy - 5); }
      if (alto) rotulo(`${T('Cadáveres', 'Corpses')} ${c}`, c ? '#d8d0b8' : '#807060');
      break;
    }
    case 'cazadora': {
      const hal = j.monstruos.some((m) => m.dueno && !m.muerto && m.invocaId === 'halcon');
      const marcados = j.monstruos.filter((m) => !m.muerto && !m.dueno && (m.marca ?? 0) > 0).length, tr = j.torretas.length;
      const tercio = Wd / 3;
      pon(glifo('halcon', G.halcon, hal ? '#ffd080' : null), tercio * 0.5 - 7, cy - 4); if (hal) luz(tercio * 0.5, cy, 12, '#ffc060', 0.18);
      pon(glifo('mira', G.mira, marcados ? '#ff5040' : null), tercio * 1.5 - 11, cy - 4);
      textoPixel(String(marcados), X + Math.round(tercio * 1.5 + 2) * D, Y + (cy + 4) * D, { D, color: marcados ? '#ffb0a0' : '#706458' });
      pon(glifo('cepo', G.cepo, tr ? '#c8c0b0' : null), tercio * 2.5 - 12, cy - 3);
      textoPixel(String(tr), X + Math.round(tercio * 2.5 + 3) * D, Y + (cy + 4) * D, { D, color: tr ? '#e8e0d0' : '#706458' });
      if (alto) rotulo(hal ? [T('Halcón · marcas · trampas', 'Hawk · marks · traps'), T('Halcón en vuelo', 'Hawk aloft'), T('Halcón', 'Hawk')] : [T('Sin halcón · marcas · trampas', 'No hawk · marks · traps'), T('Sin halcón', 'No hawk')], hal ? '#ffd080' : '#a89878');
      break;
    }
    case 'templario': {
      const a = d.aura && h.buffs[d.aura] ? habilidadDe(d.aura) : null, s = alto ? 21 : 15, pot = a && h.auraPot > 0 ? `+${Math.round(h.auraPot)}%` : '';
      const sx = alto ? Math.round(Wd / 2 - s / 2) : 4, sy = cy - (s >> 1);
      if (a) luz(sx + s / 2, sy + s / 2, s * (1.1 + 0.1 * Math.sin(t * 2.2)), '#ffd060', 0.3);
      pon(sol(s, a ? '#ffd870' : null), sx, sy);
      if (alto) { if (pot) textoPixel(pot, X + (sx + s + 4) * D, Y + (cy + 4) * D, { D, color: '#ffd060' }); rotulo(a ? [`${T('Aura', 'Aura')}: ${TT(a.nombre)}`, TT(a.nombre)] : T('Sin aura', 'No aura'), a ? '#ffe0a0' : '#807060'); }
      else { const nom = a ? TT(a.nombre) : T('Sin aura', 'No aura'); textoPixel(nom, X + (sx + s + 4) * D, Y + (cy + 4) * D, { D, color: a ? '#ffe0a0' : '#807060' }); }
      break;
    }
    case 'druida': {
      const f = h.buffs.forma_oso ? 2 : h.buffs.forma_lobo ? 1 : 0, sep = Math.min(30, Math.round((Wd - 16) / 3)), x0 = Math.round(Wd / 2) - sep;
      const ids: [string, string[], string][] = [['hombre', G.hombre, '#d8c8a0'], ['lobo', G.lobo, '#a8c0e0'], ['oso', G.oso, '#d09860']];
      ids.forEach(([id, fil, col], i) => { if (i === f) { luz(x0 + i * sep + 0.5, cy, 13, col, 0.24); if (!f) u(x0 + i * sep - 8, cy + 8, 17, 1, col); } pon(glifo(id, fil, i === f ? col : null), x0 + i * sep - 6, cy - 6); });
      if (f) { const bf = h.buffs[f === 2 ? 'forma_oso' : 'forma_lobo'], k = cl(bf.t / 300); u(8, cy + 8, Wd - 16, 2, '#2a2018'); u(8, cy + 8, Math.round((Wd - 16) * k), 2, ids[f][2]); }
      if (alto) rotulo(f === 2 ? T('Forma de oso', 'Bear form') : f === 1 ? T('Forma de lobo', 'Wolf form') : T('Forma humana', 'Human form'), f ? ids[f][2] : '#a89878');
      break;
    }
    case 'alquimista': {
      const max = Math.min(10, frascosMax(h)), n = Math.min(max, Math.floor(h.frascos)), K = alto && max * 18 <= Wd - 6 ? 2 : 1;
      const sep = Math.min(K === 2 ? 20 : 11, Math.floor((Wd - 4) / max)), x0 = Math.round((Wd - sep * max) / 2) + ((sep - 7 * K) >> 1), col = h.buffs.panacea_negra ? '#80ff60' : '#ff9040';
      for (let i = 0; i < max; i++) {
        const fx = x0 + i * sep, fy = cy - (K === 2 ? 11 : 5), lleno = i < n, k = lleno ? 1 : i === n && h.frascos < frascosMax(h) ? cl(h.frascoT / 4) : 0;
        // el líquido adentro (hasta 6 puntos de alto) y el vidrio encima
        if (k > 0) { const al = Math.max(1, Math.round(6 * k)) * K; u(fx + K, fy + 10 * K - al, 5 * K, al, lleno ? col : css(rgb(col), 0.55)); if (lleno) u(fx + K, fy + 10 * K - al, 5 * K, K, css(claro(rgb(col), 0.5))); }
        pon(glifo('frasco', G.frasco, lleno ? '#c8d0d8' : k > 0 ? '#8a8478' : null, false), fx, fy, K);
      }
      if (n > 0) luz(Wd / 2, cy, Wd * 0.4, col, 0.1);
      if (alto) rotulo(`${T('Frascos', 'Flasks')} ${n}/${frascosMax(h)}`, n ? '#e8c090' : '#807060');
      break;
    }
  }
}
