import { registrar, type Pieza, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { masa, bulto, hueso as hM, ruido, type Comp } from '../render';
import { rng, hashString } from '../../core/rng';

/**
 * Roca viva (Mundos, entrega 10, Rick 22 nov 2026: "las paredes de roca de las minas y las cuevas se leen como pared").
 * Antes cada tramo de la mina era un tablero de lajas facetadas apiladas, de 5 celdas, misma altura y mismo grueso, puesto
 * en fila a regla sobre el borde de la baldosa; y el contorno de las cuevas, peñascos de la misma familia. Acá van:
 *
 * - `roca_muro`: el tramo de la galería de la mina, roca cortada a pico. Losas convexas por estratos en diagonal (la línea del
 *   estrato corre inclinada por todo el tramo y cada estrato sale o se mete distinto), la cara de adelante plana con los cantos
 *   vivos y las marcas del pico (el material), la cresta que sube y baja con picos, hombros y caídas (8 perfiles), grietas
 *   cavadas, cascajo al pie y, en las vetas, el bolsón de mineral (oro, hierro o la sangre que brilla). `<n>` en x (mira a +y)
 *   y `<n>_y` (mira a +x): el eje y es el espejo del x por la diagonal, así la esquina a inglete sale sola (`muro_esquina`).
 * - `roca_muro_espolon`: el saliente que entra una o dos celdas a la galería (contrafuerte de roca que baja hacia adelante).
 * - `roca_penasco`: el contorno de las cuevas, roca natural. Masa redondeada con repisas de estrato, humedad que chorrea,
 *   musgo en las repisas, raíces o goteras que cuelgan; alturas en cinco escalones (el juego reparte la cresta con un campo
 *   suave, nunca dos vecinas iguales). Familias `c` (cueva) y `h` (hielo: roca azulada, nieve en las repisas y carámbanos).
 * - `roca_pie`: el talud al pie de la roca, plano (no bloquea): piedra suelta, cascajo y polvo que funden el piso con la roca.
 *
 * Unidades: una celda son 16. Lo que mira a la cámara es +x y +y.
 */

const M = MATERIALES;
/** Roca de la mina cortada a pico: estratos en diagonal, marcas del pico en las caras paradas, polvo en lo que mira arriba. */
M.rv_mina = {
  rampa: ['#0c0a08', '#171310', '#231d18', '#302821', '#3e342a', '#4e4134', '#60503f', '#74614c'], ruido: 0.42, escala: 0.16,
  patron: (p, n) => {
    const s = p[0] + p[1], st = Math.sin((p[2] - s * 0.34) * 0.36 + ruido(p[0] * 0.04, p[1] * 0.04, p[2] * 0.03) * 2.6);
    let v = st > 0.78 ? -0.1 : st < -0.86 ? 0.06 : 0;
    v += (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.11) - 0.5) * 0.12;
    if (Math.abs(n[2]) < 0.6) {
      // las marcas del pico: golpes cortos en diagonal, de a filas, que no se alinean de una fila a la otra
      const fila = Math.floor(p[2] / 8), q = (((s * 0.55 + p[2] * 0.8 + fila * 13.7 + ruido(fila * 1.3, s * 0.05, 3) * 9) % 7) + 7) % 7;
      if (q < 1) v -= 0.2; else if (q < 1.8) v += 0.08;
    } else if (n[2] > 0.55) v -= 0.3; // (lo que mira arriba en una mina no recibe luz: el techo no la deja; si no, cada repisa se lee como un tejado)
    return v - Math.min(1, Math.max(0, (p[2] - 58) / 90)) * 0.34; // (lo alto se pierde en lo oscuro del techo: la roca no termina en un canto contra la nada)
  },
};
/** La misma roca con la veta de hierro: más roja y oxidada. */
M.rv_mina_ox = { ...M.rv_mina, rampa: ['#0e0806', '#1b0f0a', '#2a1810', '#3a2216', '#4b2d1d', '#5e3a26', '#734932', '#88593e'] };
/** La roca húmeda de la mina (por donde baja el agua): más oscura y con brillo. */
M.rv_mina_humeda = { ...M.rv_mina, rampa: ['#090908', '#121110', '#1c1a17', '#27241f', '#332f28', '#403a31', '#4f483c'], brillo: 0.38 };
/** Caliza de la cueva: estratos que ondulan en diagonal y chorreones de humedad que bajan. */
M.rv_cueva = {
  rampa: ['#0d0c0a', '#181613', '#24211c', '#322d26', '#413a31', '#52493d', '#655a4b', '#7a6d5b'], ruido: 0.4, escala: 0.14, brillo: 0.18,
  patron: (p, n) => {
    const st = Math.sin((p[2] + (p[0] - p[1]) * 0.22) * 0.42 + ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.04) * 3.4);
    const amp = Math.max(0, ruido(p[0] * 0.035, p[1] * 0.035, p[2] * 0.02 + 4) - 0.38) * 1.6; let v = (st > 0.72 ? -0.1 : st > 0.5 ? 0.04 : 0) * amp;
    // la humedad que chorrea: rayas largas que bajan por las caras paradas
    if (Math.abs(n[2]) < 0.7) { const c = ruido(p[0] * 0.32, p[1] * 0.32, p[2] * 0.012); if (c > 0.64) v -= 0.14 * (c - 0.64) / 0.36 + 0.06; }
    v += (ruido(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.5) * 0.12;
    if (n[2] > 0.65) v += 0.04;
    return v - Math.min(1, Math.max(0, (p[2] - 58) / 90)) * 0.3; // (lo alto se pierde en lo oscuro del techo: la roca no termina en un canto contra la nada)
  },
};
/** Roca de las cuevas de hielo: gris azulada, escarcha en los estratos. */
M.rv_hielo = {
  rampa: ['#0a0c0f', '#12161b', '#1b2128', '#252d36', '#303a45', '#3c4855', '#4a5766', '#5b6878'], ruido: 0.38, escala: 0.14, brillo: 0.25,
  patron: (p, n) => {
    const st = Math.sin((p[2] + (p[0] - p[1]) * 0.25) * 0.4 + ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.04) * 3);
    const amp = Math.max(0, ruido(p[0] * 0.035, p[1] * 0.035, p[2] * 0.02 + 4) - 0.38) * 1.6; let v = (st > 0.75 ? 0.1 : st < -0.8 ? -0.07 : 0) * amp;
    v += (ruido(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.5) * 0.12;
    if (n[2] > 0.55) v += 0.28 * (n[2] - 0.55) / 0.45 + 0.08; // (la escarcha se junta en lo que mira arriba)
    return v - Math.min(1, Math.max(0, (p[2] - 58) / 90)) * 0.32; // (lo alto se pierde en lo oscuro del techo: la roca no termina en un canto contra la nada)
  },
};
M.rv_musgo = { rampa: ['#0b100a', '#141d11', '#1e2a18', '#2a3820', '#364729', '#445733'], ruido: 0.65, escala: 0.55 };
M.rv_musgo_seco = { rampa: ['#10110b', '#1b1c12', '#272819', '#343421', '#42412a'], ruido: 0.6, escala: 0.5 };
M.rv_raiz = { rampa: ['#0d0a07', '#18120c', '#241b12', '#312419', '#3f2f21'], ruido: 0.4, escala: 0.6 };
M.rv_polvo = { rampa: ['#1a1712', '#25211a', '#312b22', '#3e362b', '#4b4134', '#5a4e3e'], ruido: 0.7, escala: 0.7 };
M.rv_grava = { rampa: ['#0e0c0a', '#191613', '#25201b', '#322b24', '#40372e', '#4f4438', '#5f5143'], ruido: 0.55, escala: 0.5 };
M.rv_escarcha = { rampa: ['#2c343c', '#3a444e', '#4a5560', '#5c6772', '#6f7a84', '#848e96'], ruido: 0.3, escala: 0.3 };
M.rv_hielo_vivo = { rampa: ['#14222e', '#1e3446', '#2c4a60', '#3e647c', '#58829a', '#7aa2b6', '#a6c4d2', '#d4e8f0'], ruido: 0.2, escala: 0.12, brillo: 0.6 };
M.rv_oro = { rampa: ['#2a1a06', '#45300c', '#634813', '#82621b', '#a17d25', '#bf9a34', '#dbb94c', '#f0d878'], ruido: 0.25, escala: 0.4, brillo: 0.85 };
M.rv_hierro = { rampa: ['#140806', '#26100a', '#3a1910', '#4f2416', '#66301d', '#7e3f26', '#985030'], ruido: 0.5, escala: 0.45, brillo: 0.3 };
M.rv_sangre = { rampa: ['#160406', '#2a070b', '#430c12', '#5e131a', '#7c1c23', '#9c2c30', '#c04a48', '#e08478'], ruido: 0.22, escala: 0.14, brillo: 0.95 };
M.rv_sangre_luz = { rampa: ['#3a0608', '#600c0e', '#901818', '#c02c24', '#e45a40', '#f8987a'], ruido: 0.35, escala: 0.25, emite: true };

const PI = Math.PI;
type Az = () => number;
const entre = (r: Az, a: number, b: number) => a + r() * (b - a);
/** Azar propio de cada variante (la misma variante sale igual siempre, cada una distinta de las otras). */
const azar = (v: string) => rng(hashString('roca_viva|' + v) || 1);
const poli = (pts: V3[], mat: string, tono = 0, resta = false): Pieza => {
  // (el poliedro del motor arma los planos de la cáscara: sirve cualquier nube de puntos)
  const planos: [V3, number][] = [];
  const n = pts.length, c: V3 = [0, 0, 0]; for (const p of pts) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; }
  const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], cr = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]], dt = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) for (let k = j + 1; k < n; k++) {
    let nn = cr(sub(pts[j], pts[i]), sub(pts[k], pts[i])); const l = Math.hypot(...nn); if (l < 1e-6) continue;
    nn = [nn[0] / l, nn[1] / l, nn[2] / l]; let d = dt(nn, pts[i]);
    if (dt(nn, c) > d) { nn = [-nn[0], -nn[1], -nn[2]]; d = -d; }
    if (pts.every((p) => dt(nn, p) <= d + 1e-4) && !planos.some(([m, e]) => dt(m, nn) > 0.9999 && Math.abs(e - d) < 1e-3)) planos.push([nn, d]);
  }
  return { k: 'conv', planos, pts, mat, tono, resta } as Pieza;
};
/** Piedra facetada chica (cascajo, lascas). */
function lasca(r: Az, x: number, y: number, z: number, rx: number, ry: number, rz: number, mat: string, nPts = 7): Pieza {
  const g = r() * 2 * PI, c = Math.cos(g), s = Math.sin(g), pts: V3[] = [];
  for (let i = 0; i < nPts; i++) { const th = r() * 2 * PI, w = r() * 2 - 1, q = Math.sqrt(1 - w * w), k = 0.75 + r() * 0.25, px = Math.cos(th) * q * rx * k, py = Math.sin(th) * q * ry * k; pts.push([x + px * c - py * s, y + px * s + py * c, z + Math.max(-0.4, w) * rz * k]); }
  pts.push([x, y, z - rz * 0.4], [x + rx * 0.6 * c, y + rx * 0.6 * s, z], [x - ry * 0.6 * s, y + ry * 0.6 * c, z]);
  return poli(pts, mat, (r() - 0.5) * 0.14);
}
/** El eje: (u a lo largo, w hacia adelante) -> (x, y). En el eje y el espejo por la diagonal: adelante es +x. */
const ejeDe = (y: boolean) => (u: number, w: number, z: number): V3 => (y ? [w, u, z] : [u, w, z]);
const suelo = (): Pieza => ({ ...(poli([[-450, -450, -80], [450, -450, -80], [-450, 450, -80], [450, 450, -80], [-450, -450, 0], [450, -450, 0], [-450, 450, 0], [450, 450, 0]], 'roca')), resta: true } as Pieza);

// ------------------------------------------------------------------ la galería de la mina
/** Perfiles de la cresta (alto en u = -40, -20, 0, 20, 40): picos, hombros, caídas, mesetas con diente, que suben o bajan. */
const PERFIL: number[][] = [
  [78, 96, 146, 104, 82], [134, 128, 96, 82, 92], [112, 104, 66, 58, 88], [92, 134, 84, 124, 96],
  [80, 84, 92, 128, 72], [66, 84, 102, 124, 140], [140, 118, 96, 82, 66], [124, 82, 62, 86, 118],
];
const altoEn = (pf: number[], u: number) => {
  const t = Math.max(0, Math.min(4, (u + 40) / 20)), i = Math.min(3, Math.floor(t)), f = t - i, s = (1 - Math.cos(f * PI)) / 2;
  return pf[i] + (pf[i + 1] - pf[i]) * s;
};
interface OpcTramo { mat: string; matB?: string; veta?: 'oro' | 'hierro' | 'sangre'; humeda?: boolean; pf: number[]; largo: number; fondo: number; frente: number; caer?: number; estrato?: [number, number]; retiro?: number }
/**
 * Roca cortada por estratos: el tramo se parte a lo largo en losas de ancho dispar y a lo alto por las líneas de estrato
 * (inclinadas, las mismas en todo el tramo); cada pedazo es un poliedro con la cara de adelante plana, apenas en talud, el
 * canto de arriba achaflanado y su propio retiro: unos estratos sobresalen y otros se meten, como la roca que se saca a pico.
 */
function rocaCortada(r: Az, ps: Pieza[], P: (u: number, w: number, z: number) => V3, o: OpcTramo) {
  const L = o.largo / 2, ext = 3;
  // la línea del frente en planta: ondula de verdad (la cara no queda a regla)
  const fa = r() * 6.28, fb = r() * 6.28, fr = (u: number) => o.frente - 2.5 + 3.2 * Math.sin(u * 0.075 + fa) + 2 * Math.sin(u * 0.19 + fb);
  const jit = (k: number) => (r() - 0.5) * k;
  const H = (u: number) => altoEn(o.pf, (u / L) * 40) + 5 * Math.sin(u * 0.21 + fa * 2) + 3 * Math.sin(u * 0.43 + fb);
  // estratos: líneas inclinadas (las mismas para todo el tramo)
  const inc = (r() - 0.5) * 0.7, est: number[] = [0]; { let z = entre(r, 14, 26); while (z < 180) { est.push(z); z += entre(r, ...(o.estrato ?? [20, 34])); } }
  const zEst = (k: number, u: number) => (k === 0 ? 0 : est[k] + inc * u);
  // cada estrato se retira un poco más que el de abajo (la cara sube en talud, no a plomo), con su propio capricho
  const retiro: number[] = []; { let acc = 0; for (let k = 0; k < est.length; k++) { acc += k === 0 ? 0 : entre(r, 1.5, o.retiro ?? 6.5); retiro.push(acc + (r() < 0.2 ? -entre(r, 2, 5) : 0)); } }
  for (let k = 0; k < est.length; k++) {
    // cortes a lo largo propios de cada estrato: las juntas no se alinean de un estrato al otro (si no, es un muro de bloques)
    const cortes: number[] = [-L - ext]; { let u = -L - ext + entre(r, 0, 8); while (u < L + ext - 6) { cortes.push(u); u += entre(r, 10, 24); } cortes.push(L + ext); if (cortes[1] - cortes[0] < 4) cortes.splice(1, 1); }
    for (let i = 0; i < cortes.length - 1; i++) {
      const ua = cortes[i] - 0.6, ub = cortes[i + 1] + 0.6, ha = H(ua), hb = H(ub);
      const za1 = Math.min(k + 1 < est.length ? zEst(k + 1, ua) : 999, ha), zb1 = Math.min(k + 1 < est.length ? zEst(k + 1, ub) : 999, hb);
      // (donde la cresta baja de la línea del estrato, el pedazo se cierra en cuña ahí: si no, quedaba una losa flotando a la
      //  altura del estrato, como el ala de un sombrero)
      const za0 = Math.min(Math.max(0, zEst(k, ua)), za1), zb0 = Math.min(Math.max(0, zEst(k, ub)), zb1);
      if (za1 - za0 < 3 && zb1 - zb0 < 3) continue;
      const top = za1 >= ha - 0.1 || zb1 >= hb - 0.1;
      // la cara de cada losa gira un poco (no hay dos caras paralelas) y se tumba hacia atrás al subir
      const giro = entre(r, -4, 4), fa0 = fr(ua) - retiro[k] + giro, fb0 = fr(ub) - retiro[k] - giro;
      const bt = entre(r, 2, 6), ch = top ? entre(r, 3, 9) + (o.caer ?? 0) : entre(r, 0.5, 3), atr = Math.max(o.fondo, Math.min(fa0, fb0) - bt - entre(r, 8, 16)); // (la cara de arriba es angosta: la roca se va hacia atrás en cuña, no queda un techo plano que agarre la luz)
      const pts: V3[] = [
        P(ua, o.fondo, za0), P(ub, o.fondo, zb0), P(ua, atr, Math.max(za0, za1 + (top ? entre(r, 0, 6) : 0))), P(ub, atr, Math.max(zb0, zb1 + (top ? entre(r, 0, 6) : 0))),
        P(ua, fa0 + jit(1.5), za0), P(ub, fb0 + jit(1.5), zb0),
        P(ua, fa0 - bt + jit(1.5), Math.max(za0, za1 - ch)), P(ub, fb0 - bt + jit(1.5), Math.max(zb0, zb1 - ch)),
      ];
      // a media altura, un bulto de la cara (el corte del pico deja la piedra con panza)
      if (r() < 0.5) { const zm = (za0 + za1 + zb0 + zb1) / 4; pts.push(P((ua + ub) / 2 + jit(6), (fa0 + fb0) / 2 - bt * 0.4 + entre(r, 0.8, 2.4), zm)); }
      // la cresta rota: el canto de arriba se quiebra en una arista que va hacia atrás
      if (false) pts.push(P((ua + ub) / 2 + jit(8), atr + entre(r, 1, 5), Math.max(za0, Math.max(za1, zb1) + entre(r, -3, 3))));
      const humedo = o.humeda && r() < 0.35;
      ps.push(poli(pts, humedo ? 'rv_mina_humeda' : o.matB && r() < 0.3 ? o.matB : o.mat, (r() - 0.5) * 0.14 + (k % 2 ? -0.035 : 0.025)));
      // la cresta rota: lascas paradas y torcidas sobre el canto (nunca un tejado liso)
      if (top) for (let q = 0; q < 1 + Math.floor(r() * 2); q++) { const u = entre(r, ua, ub), hu = H(u), w = fr(u) - retiro[k] - entre(r, 5, 13), sz = entre(r, 4, 8); const c = P(u, w, Math.min(hu, Math.max(za1, zb1)) - sz * 0.7); ps.push(lasca(r, c[0], c[1], c[2], sz, sz * entre(r, 0.5, 0.8), sz * entre(r, 1, 1.7), o.mat, 8)); }
    }
  }
  // grietas cavadas: cuñas finas que entran por la cara (no cortan la roca entera)
  const nG = 1 + Math.floor(r() * 3);
  for (let g = 0; g < nG; g++) {
    const u = entre(r, -L + 8, L - 8), z0 = entre(r, 6, 30), z1 = Math.min(H(u) - 6, z0 + entre(r, 26, 70)), du = (r() - 0.5) * 12, w = fr(u) + 3;
    if (z1 - z0 < 12) continue;
    ps.push(poli([P(u - 1.1, w, z0), P(u + 1.1, w, z0), P(u + du - 1.3, w, z1), P(u + du + 1.3, w, z1), P(u + du * 0.5, w - entre(r, 5, 9), (z0 + z1) / 2)], 'roca', 0, true));
  }
}
/** El cascajo que se queda al pie de lo que se cortó (dentro de la huella, pegado a la cara). */
function cascajoPie(r: Az, ps: Pieza[], P: (u: number, w: number, z: number) => V3, L: number, frente: number, mat: string, n: number) {
  for (let i = 0; i < n; i++) { const u = entre(r, -L, L), w = frente + entre(r, -3, 5), s = entre(r, 1.6, 4.4); const p = P(u, w, s * 0.3); ps.push(lasca(r, p[0], p[1], p[2], s, s * 0.85, s * 0.7, r() < 0.3 ? 'rv_grava' : mat)); }
}
/** El bolsón de mineral: un racimo de pepitas o cristales metido en la cara, sobre una grieta en diagonal. */
function bolson(r: Az, ps: Pieza[], P: (u: number, w: number, z: number) => V3, L: number, frente: number, veta: 'oro' | 'hierro' | 'sangre'): [number, number, number] {
  const u0 = entre(r, -L * 0.55, L * 0.2), z0 = entre(r, 18, 40), du = entre(r, 22, 40), dz = entre(r, 10, 34) * (r() < 0.5 ? -0.4 : 1);
  const mat = veta === 'oro' ? 'rv_oro' : veta === 'hierro' ? 'rv_hierro' : 'rv_sangre';
  for (let i = 0; i < 26; i++) {
    const t = i / 25, u = u0 + du * t + (r() - 0.5) * 5, z = z0 + dz * t + Math.sin(t * 6) * 4 + (r() - 0.5) * 5, w = frente + 0.6 - (r() * 2);
    const c = P(u, w, z), s = entre(r, 1.3, 3.2) * (1 - Math.abs(t - 0.45) * 0.8);
    if (veta === 'sangre' && i % 3 === 0) ps.push(poli([P(u, w - 2, z), P(u + 1.5, w - 1, z + 1), P(u - 1.2, w - 1, z + 1.4), P(u + (r() - 0.5) * 2, w + 3.5, z + 2.5 + r() * 3)], 'rv_sangre_luz', 0));
    else ps.push(lasca(r, c[0], c[1], c[2], s, s * 0.9, s, mat, 6));
  }
  // la boca: la roca de alrededor un poco más oscura y rota (unas lascas sueltas)
  for (let i = 0; i < 6; i++) { const t = r(), c = P(u0 + du * t + (r() - 0.5) * 10, frente + 1, z0 + dz * t + (r() - 0.5) * 10); ps.push(lasca(r, c[0], c[1], c[2], 2.5, 2, 2.2, 'rv_mina_humeda')); }
  const c = P(u0 + du * 0.5, frente + 6, z0 + dz * 0.5); return [c[0], c[1], c[2]];
}

/** Los tramos de la mina: `m1`..`m8` (perfil), `ov`, `hv`, `sv` (vetas de oro, hierro y sangre), con `_y` el eje y. */
const TRAMOS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'ov1', 'ov2', 'hv1', 'hv2', 'sv1', 'sv2'];
/** Los salientes: `e<largo><fondo>_<n>` (largo a lo largo del muro, fondo hacia la galería). */
const ESPOLONES = ['e21_1', 'e21_2', 'e31_1', 'e31_2', 'e22_1', 'e22_2', 'e32_1', 'e32_2'];

registrar(
  {
    id: 'roca_muro', nombre: ['Roca de galería', 'Gallery rock'], tema: 'mina',
    variantes: [...TRAMOS, ...TRAMOS.map((v) => v + '_y')], huella: [5, 2], bloquea: true,
    armar: (v, _f) => {
      const ejeY = v.endsWith('_y'), base = ejeY ? v.slice(0, -2) : v, r = azar(base), P = ejeDe(ejeY), ps: Pieza[] = [];
      const veta = base.startsWith('ov') ? 'oro' : base.startsWith('hv') ? 'hierro' : base.startsWith('sv') ? 'sangre' : undefined;
      const n = veta ? Math.floor(r() * PERFIL.length) : (+base.slice(1) - 1) % PERFIL.length;
      const pf = PERFIL[n].map((h) => h * entre(r, 0.92, 1.06) + entre(r, -6, 6));
      if (+base.slice(1) > 8) pf.reverse();
      rocaCortada(r, ps, P, { mat: veta === 'hierro' ? 'rv_mina_ox' : 'rv_mina', matB: veta === 'hierro' ? 'rv_mina' : undefined, veta, humeda: r() < 0.4, pf, largo: 80, fondo: -22, frente: 13 });
      let luz: [number, number, number] | null = null;
      if (veta) luz = bolson(r, ps, P, 40, 11, veta);
      cascajoPie(r, ps, P, 40, 12, 'rv_mina', 9 + Math.floor(r() * 6));
      ps.push(suelo());
      if (veta === 'sangre' && luz) return { piezas: ps, resplandor: { c: luz, r: 46, color: '#e0403a' } };
      return ps;
    },
  },
  {
    id: 'roca_muro_espolon', nombre: ['Saliente de roca', 'Rock spur'], tema: 'mina',
    variantes: [...ESPOLONES, ...ESPOLONES.map((v) => v + '_y')], huella: [2, 1],
    huellaPor: Object.fromEntries(ESPOLONES.flatMap((v) => { const a = +v[1], b = +v[2]; return [[v, [a, b]], [v + '_y', [b, a]]]; })) as Record<string, [number, number]>,
    bloquea: true,
    armar: (v, _f) => {
      const ejeY = v.endsWith('_y'), base = ejeY ? v.slice(0, -2) : v, r = azar(base), P = ejeDe(ejeY), ps: Pieza[] = [];
      const a = +base[1], b = +base[2], L = a * 8, D = b * 8;
      // el contrafuerte: alto contra el muro (se mete en la roca de atrás) y baja hacia la galería
      const alto = entre(r, 56, 96) * (b === 2 ? 0.92 : 1), frente = D - 1.5, fondo = -D - 26;
      const pf = [alto * entre(r, 0.2, 0.4), alto * entre(r, 0.7, 0.95), alto, alto * entre(r, 0.6, 0.9), alto * entre(r, 0.15, 0.35)];
      rocaCortada(r, ps, P, { mat: 'rv_mina', pf, largo: L * 2 + 6, fondo, frente, humeda: r() < 0.3, caer: alto * entre(r, 0.05, 0.15), estrato: [34, 52], retiro: 3 });
      cascajoPie(r, ps, P, L, frente, 'rv_mina', 6 + a * 2);
      ps.push(suelo());
      return ps;
    },
  },
);

// ------------------------------------------------------------------ la cueva
const ALTURA_PEN: Record<string, [number, number]> = { a1: [132, 152], a2: [110, 128], m1: [90, 106], m2: [70, 84], m3: [52, 64], b: [18, 34] };
const PENASCOS = [
  ...['a1', 'a2', 'm1', 'm2', 'm3'].flatMap((t) => ['1', '2', '3'].map((n) => `${t}_${n}`)), 'b_1', 'b_2', 'b_3', 'b_4',
];
/**
 * Peñasco natural de cueva: una masa de bultos que se funden (sin facetas), en repisas de estrato que se corren hacia atrás al
 * subir, con lóbulos al pie, la humedad del material, musgo (o nieve) sobre las repisas que miran arriba y, según el azar,
 * raíces que bajan del techo, goteras con su estalactita o una estalagmita al pie.
 */
function penascoNatural(r: Az, ps: Pieza[], alto: number, fam: 'c' | 'h' | 'm', baja: boolean) {
  const mat = fam === 'h' ? 'rv_hielo' : fam === 'm' ? 'rv_mina' : 'rv_cueva', matB = fam === 'h' ? 'rv_hielo' : fam === 'm' ? 'rv_mina_humeda' : 'sub_roca_humeda';
  const sobre: [number, number, number, number][] = [];
  // (entrega 10) La roca natural se arma de pedazos grandes y desparejos, chatos como estratos, corridos hacia atrás al subir
  // y con su propia inclinación; entre uno y otro, la grieta oscura. Adentro, un núcleo que tapa los huecos (no se ve).
  const trozo = (x: number, y: number, z: number, rx: number, ry: number, rz: number, m = mat, n = 12) => {
    const g = r() * 2 * PI, c = Math.cos(g), sn = Math.sin(g), dip = entre(r, -0.25, 0.25), pts: V3[] = [];
    for (let i = 0; i < n; i++) { const th = r() * 2 * PI, w = r() * 2 - 1, q = Math.sqrt(1 - w * w), k = 0.72 + r() * 0.28, px = Math.cos(th) * q * rx * k, py = Math.sin(th) * q * ry * k; pts.push([x + px * c - py * sn, y + px * sn + py * c, z + Math.max(-0.7, Math.min(0.8, w)) * rz * k + px * dip]); }
    ps.push(poli(pts, m, (r() - 0.5) * 0.16));
  };
  if (baja) {
    const n = 5 + Math.floor(r() * 4);
    for (let i = 0; i < n; i++) { const t = r() * 2 * PI, d = r() * 14, rr = entre(r, 9, 17) * (1 - d / 36); const x = Math.cos(t) * d, y = Math.sin(t) * d * 0.9, h = Math.min(alto, rr * entre(r, 0.6, 1.3)); trozo(x, y, h * 0.3, rr, rr * entre(r, 0.6, 0.9), h * 0.7, r() < 0.2 ? matB : mat, 9); sobre.push([x, y, h * 0.8, rr * 0.5]); }
    return sobre;
  }
  const gl = PI * 0.75 + entre(r, -0.6, 0.6), ancho = entre(r, 13, 19); // (la línea del peñasco corre más o menos de lado en pantalla: a lo largo de x = y se vería de punta, como una aguja)
  ps.push(masa([hM([0, 0, 6], [-entre(r, 4, 10), -entre(r, 4, 10), alto * 0.8], 18, 10)], { mat, suave: 2 }));
  let z = 0, k = 0;
  while (z < alto - 6) {
    const f = z / alto, capa = entre(r, 12, 22) * (1 - f * 0.25), atr = f * entre(r, 6, 12);
    // en cada estrato, dos a cuatro pedazos a lo largo de la línea del peñasco (así se junta con los de al lado)
    const nT = 2 + Math.floor(r() * 2) + (f < 0.4 ? 1 : 0);
    for (let i = 0; i < nT; i++) {
      const t = (i + 0.5) / nT - 0.5, d = t * ancho * 2 * (1 - f * 0.45) + entre(r, -4, 4), rx = entre(r, 13, 20) * (1 - f * 0.4), ry = entre(r, 11, 16) * (1 - f * 0.3);
      const x = Math.cos(gl) * d - atr + entre(r, 0, 4), y = Math.sin(gl) * d - atr + entre(r, 0, 4);
      trozo(x, y, z + capa * 0.45, rx, ry, capa * 0.62, k % 3 === 2 && r() < 0.5 ? matB : mat);
      if (r() < 0.4) sobre.push([x + 3, y + 3, z + capa * 0.85, rx * 0.4]);
    }
    z += capa * entre(r, 0.72, 0.9); k++;
  }
  // la cresta: uno a tres dientes
  for (let i = 0; i < 1 + Math.floor(r() * 3); i++) { const d = entre(r, -ancho, ancho) * 0.6, x = Math.cos(gl) * d - 9, y = Math.sin(gl) * d - 9, s2 = entre(r, 6, 11); trozo(x, y, alto - s2 * 0.4, s2, s2 * 0.75, s2 * entre(r, 1.3, 2), mat, 10); sobre.push([x, y, alto * 0.97, 4]); }
  // lo que se derramó al pie
  for (let i = 0; i < 4; i++) { const t = entre(r, -0.5, 2), d = entre(r, 14, 22), rr = entre(r, 4, 8); trozo(Math.cos(t) * d, Math.sin(t) * d, rr * 0.25, rr, rr * 0.8, rr * 0.6, mat, 8); }
  return sobre;
}
function adornarPenasco(r: Az, ps: Pieza[], alto: number, fam: 'c' | 'h' | 'm', baja: boolean, sobre: [number, number, number, number][]) {
  if (fam === 'm') return; // (en la mina la roca va pelada: ni musgo ni raíces)
  // musgo o nieve sobre lo que mira arriba
  for (const [x, y, z, e] of sobre) if (r() < (fam === 'h' ? 0.18 : 0.5)) {
    const cs2: Comp[] = []; const n = 2 + Math.floor(r() * 3);
    for (let i = 0; i < n; i++) cs2.push(bulto([x + (r() - 0.5) * e, y + (r() - 0.5) * e, z + 0.5], [e * entre(r, 0.4, 0.7), e * entre(r, 0.3, 0.55), entre(r, 1.2, 2.4)], { giro: r() * 180 }));
    ps.push(masa(cs2, { mat: fam === 'h' ? 'nieve' : r() < 0.6 ? 'rv_musgo' : 'rv_musgo_seco', suave: 1.5 }));
  }
  if (baja) return;
  const q = r();
  if (fam === 'h') {
    // carámbanos bajo las repisas
    for (let i = 0; i < 3 + Math.floor(r() * 4); i++) { const [x, y, z] = sobre[Math.floor(r() * sobre.length)]; const l = entre(r, 8, 20); ps.push(masa([hM([x + 4, y + 4, z - 2], [x + 4 + (r() - 0.5) * 2, y + 4, z - 2 - l], entre(r, 1.6, 2.6), 0.3)], { mat: 'rv_hielo_vivo', suave: 1 })); }
  } else if (q < 0.33) {
    // raíces que bajan desde arriba, por la cara que se ve
    for (let i = 0; i < 2 + Math.floor(r() * 2); i++) {
      const t = entre(r, -0.2, 1.8), cs2: Comp[] = []; let p: V3 = [Math.cos(t) * 10, Math.sin(t) * 10, alto * entre(r, 0.82, 0.98)];
      for (let k = 0; k < 5; k++) { const d = entre(r, 0.9, 1.3), q2: V3 = [p[0] + Math.cos(t) * 3.4 * d + (r() - 0.5) * 3, p[1] + Math.sin(t) * 3.4 * d + (r() - 0.5) * 3, p[2] - entre(r, 12, 22)]; cs2.push(hM(p, q2, 2 - k * 0.3, 1.7 - k * 0.3)); p = q2; if (p[2] < 6) break; }
      ps.push(masa(cs2, { mat: 'rv_raiz', suave: 1.2 }));
    }
  } else if (q < 0.66) {
    // la gotera: una estalactita bajo la repisa y la mancha de agua al pie
    const [x, y, z] = sobre[Math.floor(r() * sobre.length)], l = entre(r, 10, 22);
    ps.push(masa([hM([x + 3, y + 3, z - 1], [x + 3.5, y + 3.5, z - l], 3, 0.4), bulto([x + 3, y + 3, z - 1], [5, 4, 2])], { mat: 'rv_cueva', suave: 1.6 }));
    ps.push(masa([bulto([x + 6, y + 6, 0.1], [7, 5, 0.6]), bulto([x + 10, y + 8, 0.1], [4, 3, 0.5])], { mat: 'sub_roca_humeda', suave: 1.5 }));
  } else if (q < 0.85) {
    // una estalagmita al pie, delante
    const t = entre(r, 0.1, 1.4), d = entre(r, 20, 26), x = Math.cos(t) * d, y = Math.sin(t) * d, h = entre(r, 16, 34);
    ps.push(masa([bulto([x, y, 1], [6, 5, 2.4]), hM([x, y, 1], [x + (r() - 0.5) * 2, y, h], entre(r, 3.6, 5), 0.5)], { mat: 'rv_cueva', suave: 1.8 }));
  }
}

registrar(
  {
    id: 'roca_penasco', nombre: ['Roca de caverna', 'Cavern rock'], tema: 'cueva',
    variantes: [...PENASCOS.map((v) => 'c_' + v), ...PENASCOS.map((v) => 'h_' + v), ...PENASCOS.map((v) => 'm_' + v)], huella: [2, 2], bloquea: false,
    armar: (v, _f) => {
      const r = azar(v), ps: Pieza[] = [], fam = v[0] as 'c' | 'h' | 'm', t = v.split('_')[1], [lo, hi] = ALTURA_PEN[t] ?? [60, 80];
      { const al = entre(r, lo, hi), sb = penascoNatural(r, ps, al, fam, t === 'b'); adornarPenasco(r, ps, al, fam, t === 'b', sb); }
      ps.push(suelo());
      return ps;
    },
  },
);

// ------------------------------------------------------------------ el pie de la roca
const PIES_M = ['m1', 'm2', 'm3', 'm4'], PIES_C = ['c1', 'c2', 'c3', 'c4', 'h1', 'h2', 'h3'];
/**
 * El talud: lo que se fue cayendo de la roca y el polvo que dejó. Va plano (no bloquea ni echa sombra): más tupido y grueso
 * contra la roca (atrás, -w) y cada vez más ralo y fino hacia el piso, así el piso no se corta en seco contra la pared.
 */
function talud(r: Az, ps: Pieza[], P: (u: number, w: number, z: number) => V3, L: number, w0: number, w1: number, fam: 'm' | 'c' | 'h') {
  const roca = fam === 'm' ? 'rv_mina' : fam === 'h' ? 'rv_hielo' : 'rv_cueva', polvo = fam === 'h' ? 'rv_escarcha' : 'rv_polvo';
  // el polvo: manchas chatas que se derraman hacia adelante, con el borde roto
  const cs: Comp[] = [];
  for (let i = 0; i < Math.round(L / 5); i++) { const u = entre(r, -L, L), f = Math.pow(r(), 1.6), w = w0 + (w1 - w0) * f * 0.8, e = entre(r, 5, 10) * (1 - f * 0.5); const c = P(u, w, 0); cs.push(bulto([c[0], c[1], 0.05], [e, e * entre(r, 0.55, 0.9), entre(r, 0.4, 0.9)], { giro: r() * 180 })); }
  ps.push(masa(cs, { mat: polvo, suave: 2.5, tono: -0.02 }));
  // la piedra: grande y tupida atrás, chica y suelta adelante
  const n = Math.round(L * 2.2);
  for (let i = 0; i < n; i++) {
    const f = Math.pow(r(), 1.35), u = entre(r, -L, L), w = w0 + (w1 - w0) * f + (r() - 0.5) * 2, s = (1 - f) * entre(r, 3, 6.5) + entre(r, 0.8, 1.8);
    const c = P(u, w, s * 0.22); ps.push(lasca(r, c[0], c[1], c[2], s, s * entre(r, 0.6, 0.95), s * entre(r, 0.35, 0.6), r() < 0.35 ? 'rv_grava' : roca, 6));
  }
  if (fam === 'c' && r() < 0.6) { const c = P(entre(r, -L * 0.6, L * 0.6), w0 + 4, 0); ps.push(masa([bulto([c[0], c[1], 0.3], [entre(r, 4, 7), entre(r, 3, 5), 1.2]), bulto([c[0] + 3, c[1] - 2, 0.4], [3, 2.5, 1])], { mat: 'rv_musgo', suave: 1.4 })); }
}
registrar({
  id: 'roca_pie', nombre: ['Talud de roca', 'Rock talus'], tema: 'cueva',
  variantes: [...PIES_M, ...PIES_M.map((v) => v + '_y'), ...PIES_C], huella: [5, 2], plano: true, bloquea: false,
  huellaPor: Object.fromEntries(PIES_C.map((v) => [v, [2, 2]])) as Record<string, [number, number]>,
  armar: (v, _f) => {
    const ejeY = v.endsWith('_y'), base = ejeY ? v.slice(0, -2) : v, r = azar('pie_' + base), ps: Pieza[] = [];
    if (base[0] === 'm') talud(r, ps, ejeDe(ejeY), 42, -16, 14, 'm');
    else {
      // en la cueva, el talud rodea la roca: va en arco hacia adelante (+x +y)
      const g = entre(r, 0.2, 1.3), Pc = (u: number, w: number, z: number): V3 => [Math.cos(g) * w - Math.sin(g) * u, Math.sin(g) * w + Math.cos(g) * u, z];
      talud(r, ps, Pc, 18, -14, 12, base[0] as 'c' | 'h');
    }
    ps.push(suelo());
    return ps;
  },
});
