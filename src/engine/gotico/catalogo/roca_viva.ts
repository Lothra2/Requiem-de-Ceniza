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
  rampa: ['#110f0c', '#1d1914', '#2b241c', '#3a3026', '#4a3e31', '#5b4d3d', '#6f5e4b', '#85715a'], ruido: 0.42, escala: 0.16,
  patron: (p, n) => {
    // (tercera vuelta: las rayas de estrato del material y las marcas del pico en filas parejas se leían como vetas de madera.
    //  Ahora manchas de dos escalas, granos de mineral y los golpes del pico en racimos sueltos, no en filas)
    const s = p[0] + p[1];
    let v = (ruido(p[0] * 0.045, p[1] * 0.045, p[2] * 0.05) - 0.5) * 0.26 + (ruido(p[0] * 0.13, p[1] * 0.13, p[2] * 0.13 + 7) - 0.5) * 0.14;
    const g = ruido(p[0] * 0.5, p[1] * 0.5, p[2] * 0.5 + 3); if (g > 0.8) v += 0.12; else if (g < 0.16) v -= 0.1;
    if (Math.abs(n[2]) < 0.6 && ruido(p[0] * 0.03 + 9, p[1] * 0.03, p[2] * 0.03) > 0.55) {
      const q = (((s * 0.5 + p[2] * 0.9 + ruido(s * 0.07, p[2] * 0.07, 5) * 14) % 9) + 9) % 9;
      if (q < 0.9) v -= 0.17; else if (q < 1.6) v += 0.07;
    } else if (n[2] > 0.55) v -= 0.12; // (lo que mira arriba en una mina no recibe luz: el techo no la deja; si no, cada repisa se lee como un tejado)
    return v - Math.min(1, Math.max(0, (p[2] - 58) / 90)) * 0.17; // (lo alto se pierde en lo oscuro del techo: la roca no termina en un canto contra la nada)
  },
};
/** La misma roca con la veta de hierro: más roja y oxidada. */
M.rv_mina_ox = { ...M.rv_mina, rampa: ['#0e0907', '#1a100b', '#281912', '#372319', '#462e21', '#563a2b', '#684a37', '#7c5a44'] };
/** La roca húmeda de la mina (por donde baja el agua): más oscura y con brillo. */
M.rv_mina_humeda = { ...M.rv_mina, rampa: ['#0d0c0a', '#181512', '#24201a', '#312b23', '#3f372d', '#4e4438', '#5f5345'], brillo: 0.38 };
/** Caliza de la cueva: estratos que ondulan en diagonal y chorreones de humedad que bajan. */
M.rv_cueva = {
  rampa: ['#0f0d0b', '#1b1814', '#28231d', '#363027', '#463e33', '#574d3f', '#6a5e4d', '#7f705c'], ruido: 0.42, escala: 0.15, brillo: 0.12,
  patron: (p, n) => {
    // (estratos finos en la piedra; la humedad solo en lo que mira arriba: el agua corre por las juntas, que son piezas aparte)
    const st = Math.sin((p[2] + (p[0] - p[1]) * 0.2) * 0.9 + ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.05) * 5);
    let v = st > 0.8 ? -0.09 : st < -0.85 ? 0.05 : 0;
    v += (ruido(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.5) * 0.2 + (ruido(p[0] * 0.4, p[1] * 0.4, p[2] * 0.4) - 0.5) * 0.1;
    if (n[2] > 0.6) v -= 0.08;
    return v - Math.min(1, Math.max(0, (p[2] - 64) / 90)) * 0.14;
  },
};
M.rv_cueva_b = { ...M.rv_cueva, rampa: ['#0e0d0c', '#1a1917', '#272522', '#35322d', '#44403a', '#55504a', '#67615a', '#7b746b'] };
M.rv_junta = { rampa: ['#050404', '#0b0908', '#120f0c', '#1a1612'], ruido: 0.4, escala: 0.4, brillo: 0.45 };
M.rv_piedra_clara = { rampa: ['#2a251f', '#3a332b', '#4c4338', '#605546', '#756856', '#8b7c67', '#a29079'], ruido: 0.4, escala: 0.4 };
M.rv_nieve = { rampa: ['#4f5f70', '#667789', '#7f90a1', '#98a8b7', '#b0bfcb', '#c5d2dc', '#d8e2ea'], ruido: 0.2, escala: 0.2, brillo: 0.35 };
// (tercera vuelta) el carámbano: hielo claro casi blanco que deja pasar la luz (el `rv_hielo_vivo` oscuro se leía como bolitas)
M.rv_caramb = { rampa: ['#5b7a8c', '#7d9cad', '#9dbccb', '#bcd6e2', '#d6eaf2', '#edf7fb'], ruido: 0.1, escala: 0.1, brillo: 0.75 };
M.rv_hielo = {
  rampa: ['#070b13', '#0d1520', '#14202f', '#1c2c3f', '#25394f', '#2f4761', '#3c5774', '#4c6988'], ruido: 0.38, escala: 0.14, brillo: 0.5,
  patron: (p, n) => {
    const st = Math.sin((p[2] + (p[0] - p[1]) * 0.25) * 0.4 + ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.04) * 3);
    const amp = 0.5 + Math.max(0, ruido(p[0] * 0.035, p[1] * 0.035, p[2] * 0.02 + 4) - 0.38) * 1.6; let v = (st > 0.72 ? 0.16 : st < -0.8 ? -0.12 : 0) * amp + (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3) - 0.5) * 0.12;
    v += (ruido(p[0] * 0.1, p[1] * 0.1, p[2] * 0.1) - 0.5) * 0.12;
    if (n[2] > 0.7) v += 0.16 * (n[2] - 0.7) / 0.3; // (la escarcha se junta en lo que mira arriba; lo blanco de verdad es la nieve, solo arriba)
    return v - Math.min(1, Math.max(0, (p[2] - 58) / 90)) * 0.16; // (lo alto se pierde en lo oscuro del techo: la roca no termina en un canto contra la nada)
  },
};
M.rv_musgo = { rampa: ['#0b100a', '#141d11', '#1e2a18', '#2a3820', '#364729', '#445733'], ruido: 0.65, escala: 0.55 };
M.rv_musgo_seco = { rampa: ['#10110b', '#1b1c12', '#272819', '#343421', '#42412a'], ruido: 0.6, escala: 0.5 };
M.rv_raiz = { rampa: ['#0d0a07', '#18120c', '#241b12', '#312419', '#3f2f21'], ruido: 0.4, escala: 0.6 };
M.rv_polvo = { rampa: ['#241f18', '#312a20', '#3f3629', '#4e4333', '#5d503e', '#6d5e4a'], ruido: 0.7, escala: 0.7 };
M.rv_grava = { rampa: ['#16130f', '#221d17', '#2f2820', '#3d342a', '#4c4134', '#5c4f40', '#6d5e4d'], ruido: 0.55, escala: 0.5 };
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
  const t = Math.max(0, Math.min(4, (u + 40) / 20)), i = Math.min(3, Math.floor(t)), f = Math.max(0, Math.min(1, (t - i - 0.3) / 0.4)), s = (1 - Math.cos(f * PI)) / 2; // (hombros planos y escalones: la cresta no sube en punta)
  return pf[i] + (pf[i + 1] - pf[i]) * s;
};
interface OpcTramo { mat: string; matB?: string; veta?: 'oro' | 'hierro' | 'sangre'; humeda?: boolean; pf: number[]; largo: number; fondo: number; frente: number; caer?: number; estrato?: [number, number]; retiro?: number; entalle?: boolean }
/**
 * Roca cortada por estratos: el tramo se parte a lo largo en losas de ancho dispar y a lo alto por las líneas de estrato
 * (inclinadas, las mismas en todo el tramo); cada pedazo es un poliedro con la cara de adelante plana, apenas en talud, el
 * canto de arriba achaflanado y su propio retiro: unos estratos sobresalen y otros se meten, como la roca que se saca a pico.
 */
function rocaCortada(r: Az, ps: Pieza[], P: (u: number, w: number, z: number) => V3, o: OpcTramo) {
  const L = o.largo / 2, ext = 3;
  // la línea del frente en planta: ondula de verdad (la cara no queda a regla)
  const fa = r() * 6.28, fb = r() * 6.28, fr = (u: number) => o.frente - 2.5 + 3.2 * Math.sin(u * 0.075 + fa) + 2 * Math.sin(u * 0.19 + fb) - (o.entalle ? 16 * Math.max(0, Math.min(1, (27 - Math.abs(u)) / 7)) : 0); // (el entalle: el medio del tramo se mete una celda)
  const jit = (k: number) => (r() - 0.5) * k;
  const H = (u: number) => altoEn(o.pf, (u / L) * 40) + 2.5 * Math.sin(u * 0.21 + fa * 2) + 1.5 * Math.sin(u * 0.43 + fb);
  // estratos: líneas inclinadas (las mismas para todo el tramo)
  // (tercera vuelta: con la misma inclinación y gruesos parejos los estratos se leían como tablones apilados. Cada línea lleva su
  //  propia inclinación alrededor de la del tramo y ondula, los gruesos van de muy finos a muy gruesos, y algunas se acuñan)
  const inc = (r() - 0.5) * 0.7, est: number[] = [0], incK: number[] = [0], ond: number[] = [0], fase: number[] = [0];
  { const [e0, e1] = o.estrato ?? [20, 34]; let z = entre(r, 12, 30); while (z < 180) { est.push(z); incK.push(inc + (r() - 0.5) * 0.35); ond.push(entre(r, 1.5, 5)); fase.push(r() * 6.28); z += r() < 0.3 ? entre(r, e0 * 0.5, e0 * 0.8) : entre(r, e0, e1 * 1.35); } }
  const zEst = (k: number, u: number) => (k === 0 ? 0 : est[k] + incK[k] * u + ond[k] * Math.sin(u * 0.09 + fase[k]));
  // cada estrato se retira un poco más que el de abajo (la cara sube en talud, no a plomo), con su propio capricho
  const retiro: number[] = []; { let acc = 0; for (let k = 0; k < est.length; k++) { acc += k === 0 ? 0 : entre(r, 1.5, o.retiro ?? 6.5); retiro.push(acc + (r() < 0.2 ? -entre(r, 2, 5) : 0)); } }
  for (let k = 0; k < est.length; k++) {
    // cortes a lo largo propios de cada estrato: las juntas no se alinean de un estrato al otro (si no, es un muro de bloques)
    const cortes: number[] = [-L - ext]; { let u = -L - ext + entre(r, 0, 8); while (u < L + ext - 6) { cortes.push(u); u += entre(r, 10, 24); } cortes.push(L + ext); if (cortes[1] - cortes[0] < 4) cortes.splice(1, 1); }
    for (let i = 0; i < cortes.length - 1; i++) {
      const ua = cortes[i] - 0.6, ub = cortes[i + 1] + 0.6, hs = H((ua + ub) / 2), ha = hs + jit(5), hb = hs + jit(5); // (cada losa con su cresta casi pareja: la cresta va en escalones y hombros rotos, no en picos)
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
        P(ua, Math.max(o.fondo, atr - 8), za0), P(ub, Math.max(o.fondo, atr - 8), zb0), P(ua, atr, Math.max(za0, za1 + (top ? entre(r, 0, 6) : 0))), P(ub, atr, Math.max(zb0, zb1 + (top ? entre(r, 0, 6) : 0))),
        P(ua, fa0 + jit(1.5), za0), P(ub, fb0 + jit(1.5), zb0),
        P(ua, fa0 - bt + jit(1.5), Math.max(za0, za1 - ch)), P(ub, fb0 - bt + jit(1.5), Math.max(zb0, zb1 - ch)),
      ];
      // a media altura, un bulto de la cara (el corte del pico deja la piedra con panza)
      if (r() < 0.5) { const zm = (za0 + za1 + zb0 + zb1) / 4; pts.push(P((ua + ub) / 2 + jit(6), (fa0 + fb0) / 2 - bt * 0.4 + entre(r, 0.8, 2.4), zm)); }
      // la cresta rota: el canto de arriba se quiebra en una arista que va hacia atrás
      if (false) pts.push(P((ua + ub) / 2 + jit(8), atr + entre(r, 1, 5), Math.max(za0, Math.max(za1, zb1) + entre(r, -3, 3))));
      const humedo = o.humeda && r() < 0.35;
      ps.push(poli(pts, humedo ? 'rv_mina_humeda' : o.matB && r() < 0.3 ? o.matB : o.mat, (r() - 0.5) * 0.12));
      // la cresta rota: lascas paradas y torcidas sobre el canto (nunca un tejado liso)
      if (top) for (let q = 0; q < 1 + Math.floor(r() * 2); q++) { const u = entre(r, ua, ub), hu = H(u), w = fr(u) - retiro[k] - entre(r, 5, 13), sz = entre(r, 4, 8); const c = P(u, w, Math.min(hu, Math.max(za1, zb1)) - sz * 0.25); ps.push(lasca(r, c[0], c[1], c[2], sz * 1.3, sz * entre(r, 0.6, 0.9), sz * entre(r, 0.4, 0.65), o.mat, 8)); }
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
const TRAMOS = ['m1', 'm2', 'm3', 'm4', 'm5', 'm6', 'm7', 'm8', 'm9', 'm10', 'ov1', 'ov2', 'hv1', 'hv2', 'sv1', 'sv2', 'n1', 'n2', 'n3', 'n4', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6', 'q1', 'q2', 'q3', 'q4'];
/** Los salientes: `e<largo><fondo>_<n>` (largo a lo largo del muro, fondo hacia la galería). */
const ESPOLONES = ['e21_1', 'e21_2', 'e31_1', 'e31_2', 'e22_1', 'e22_2', 'e32_1', 'e32_2'];

registrar(
  {
    id: 'roca_muro', nombre: ['Roca de galería', 'Gallery rock'], tema: 'mina',
    variantes: [...TRAMOS, ...TRAMOS.map((v) => v + '_y')], huella: [5, 2], bloquea: true,
    armar: (v, _f) => {
      const ejeY = v.endsWith('_y'), base = ejeY ? v.slice(0, -2) : v, r = azar(base), P = ejeDe(ejeY), ps: Pieza[] = [];
      const veta = base.startsWith('ov') ? 'oro' : base.startsWith('hv') ? 'hierro' : base.startsWith('sv') ? 'sangre' : undefined;
      const entalle = base[0] === 'n' || base[0] === 'q', n = veta ? Math.floor(r() * PERFIL.length) : (+base.slice(1) + (entalle ? 3 : -1)) % PERFIL.length;
      // (tercera vuelta) `b`: el tramo que tiene piso detrás (el muro entre dos salas, que se ve de frente desde la de atrás) va bajo,
      // por la mitad: lo alto atrás, lo bajo adelante. Los demás bajan un poco (los paredones tapaban media sala)
      const bajo = base[0] === 'b' || base[0] === 'q', pf = PERFIL[n].map((h) => (h * entre(r, 0.92, 1.06) + entre(r, -6, 6)) * (bajo ? 0.42 : 0.86));
      if (+base.slice(1) > 8) pf.reverse();
      rocaCortada(r, ps, P, { mat: veta === 'hierro' ? 'rv_mina_ox' : 'rv_mina', matB: veta === 'hierro' ? 'rv_mina' : undefined, veta, humeda: r() < 0.4, pf, largo: 80, fondo: -22, frente: 13, entalle });
      let luz: [number, number, number] | null = null;
      if (veta) luz = bolson(r, ps, P, 40, 11, veta);
      cascajoPie(r, ps, entalle ? (u, w, z) => P(u, w - 16 * Math.max(0, Math.min(1, (27 - Math.abs(u)) / 7)), z) : P, 40, 12, 'rv_mina', 9 + Math.floor(r() * 6));
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
      const alto = entre(r, 44, 74) * (b === 2 ? 0.92 : 1), frente = D - 1.5, fondo = -D - 26;
      const pf = [alto * entre(r, 0.2, 0.4), alto * entre(r, 0.7, 0.95), alto, alto * entre(r, 0.6, 0.9), alto * entre(r, 0.15, 0.35)];
      rocaCortada(r, ps, P, { mat: 'rv_mina', pf, largo: L * 2 + 6, fondo, frente, humeda: r() < 0.3, caer: alto * entre(r, 0.05, 0.15), estrato: [34, 52], retiro: 3 });
      cascajoPie(r, ps, P, L, frente, 'rv_mina', 6 + a * 2);
      ps.push(suelo());
      return ps;
    },
  },
);

// ------------------------------------------------------------------ la cueva
/**
 * (entrega 10, segunda vuelta: la primera era un bosque de columnas y conos) El macizo de roca de la cueva: una masa ancha que se
 * abomba y se derrama, no una pieza con punta. Lo alto va atrás (contra la roca) en hombros redondos de alturas dispares, con
 * bultos que se hinchan en la cara; adelante un banco bajo que se derrama hacia el piso y bloques caídos. Lascas a medio hundir le
 * dan el canto de la piedra (sin ellas la masa se lee como cera). Mira hacia `dir` (ocho rumbos de 45°: el lado del piso) y mide
 * de largo unas 4 a 5 celdas: se funde con el de al lado. Clases: `a` alto (76 a 104), `m` medio (50 a 66), `b` bajo (20 a 34,
 * el de adelante y los costados: hombros, bancos de roca).
 */
const CLASES_MAC: Record<string, [number, number]> = { a: [76, 104], m: [50, 66], b: [20, 34] };
const MACIZOS = ['a', 'm', 'b'].flatMap((c) => ['1', '2', '3'].flatMap((n) => [0, 1, 2, 3, 4, 5, 6, 7].map((d) => `${c}${n}_${d}`)));
/** Lo que se apoya arriba de cada repisa (para el musgo, la nieve y lo que gotea): x, y, z, ancho, y el rumbo del canto. */
type Repisa = [number, number, number, number];
function macizo(r: Az, ps: Pieza[], alto: number, fam: 'c' | 'h' | 'm', baja: boolean, dir: number): { sobre: Repisa[]; voladizos: V3[] } {
  // (tercera vuelta: la masa de bultos se leía como almohada o barro. Ahora roca de verdad: estratos de losas facetadas, cada
  //  uno con su retiro (unos vuelan sobre el de abajo y dejan su sombra), juntas húmedas oscuras entre estrato y estrato, cantos
  //  achaflanados, grietas cavadas y lascas sueltas. La planta se curva y se cierra en las puntas: el macizo es redondo de lejos
  //  y de cerca es piedra partida)
  const mat = fam === 'h' ? 'rv_hielo' : fam === 'm' ? 'rv_mina' : 'rv_cueva', junta = fam === 'h' ? 'rv_hielo_vivo' : fam === 'm' ? 'rv_mina_humeda' : 'rv_junta';
  const an = (dir * PI) / 4, fx = Math.cos(an), fy = Math.sin(an), P = (u: number, w: number, z: number): V3 => [-fy * u + fx * w, fx * u + fy * w, z];
  const sobre: Repisa[] = [], voladizos: V3[] = [];
  const L = baja ? entre(r, 22, 30) : entre(r, 30, 40), fondo = -26, jit = (k: number) => (r() - 0.5) * k;
  const fa = r() * 6.28, fb = r() * 6.28;
  // el frente en planta: ondula y se cierra en las puntas
  const fr = (u: number) => (baja ? 6 : 8) + 5 * Math.sin(u * 0.09 + fa) + 2.5 * Math.sin(u * 0.23 + fb) - 22 * Math.pow(Math.min(1, Math.abs(u) / L), 2.6);
  // la cresta: dos a cuatro lomos de alturas dispares que bajan en las puntas
  const nl = baja ? 2 : 2 + Math.floor(r() * 3), lomos: [number, number, number][] = [];
  for (let i = 0; i < nl; i++) lomos.push([-L + (2 * L * (i + 0.5)) / nl + jit(10), alto * (i === 0 || i === nl - 1 ? entre(r, 0.6, 0.85) : entre(r, 0.85, 1)), entre(r, 12, 20)]);
  const H = (u: number) => { let h = 0; for (const [c, a, w] of lomos) h = Math.max(h, a * Math.exp(-((u - c) * (u - c)) / (2 * w * w)) ** 0.6); return Math.max(baja ? 6 : 10, h * (1 - Math.pow(Math.min(1, Math.abs(u) / (L + 4)), 4))); };
  const est: number[] = [0]; { let z = entre(r, baja ? 6 : 10, baja ? 11 : 20); while (z < alto + 10) { est.push(z); z += baja ? entre(r, 7, 12) : entre(r, 13, 24); } }
  const inc = jit(0.3), zEst = (k: number, u: number) => (k === 0 ? 0 : est[k] + inc * u);
  const retiro: number[] = []; { let acc = 0; for (let k = 0; k < est.length; k++) { acc += k === 0 ? 0 : entre(r, 1, 6); retiro.push(acc - (k > 0 && r() < 0.3 ? entre(r, 3, 6) : 0)); } }
  for (let k = 0; k < est.length; k++) {
    const cortes: number[] = [-L - 2]; { let u = -L - 2 + entre(r, 0, 8); while (u < L - 4) { cortes.push(u); u += entre(r, 10, 20); } cortes.push(L + 2); if (cortes[1] - cortes[0] < 4) cortes.splice(1, 1); }
    for (let i = 0; i < cortes.length - 1; i++) {
      const ua = cortes[i] - 0.5, ub = cortes[i + 1] + 0.5, ha = H(ua), hb = H(ub), hm = H((ua + ub) / 2);
      const za1 = Math.min(k + 1 < est.length ? zEst(k + 1, ua) : 999, ha), zb1 = Math.min(k + 1 < est.length ? zEst(k + 1, ub) : 999, hb);
      const za0 = Math.min(Math.max(0, zEst(k, ua)), za1), zb0 = Math.min(Math.max(0, zEst(k, ub)), zb1);
      if (za1 - za0 < 2.5 && zb1 - zb0 < 2.5) continue;
      const top = za1 >= ha - 0.1 || zb1 >= hb - 0.1, fa0 = fr(ua) - retiro[k] + jit(3), fb0 = fr(ub) - retiro[k] + jit(3);
      const bt = entre(r, 1, 4), ch = top ? entre(r, 4, 9) : entre(r, 1, 3), atr = Math.max(fondo, Math.min(fa0, fb0) - entre(r, 12, 22));
      const zt = Math.max(za1, zb1), pts: V3[] = [
        P(ua, atr - 6, za0), P(ub, atr - 6, zb0), P(ua, atr, Math.max(za0, za1)), P(ub, atr, Math.max(zb0, zb1)),
        P(ua, fa0, za0), P(ub, fb0, zb0), P(ua, fa0 - bt, Math.max(za0, za1 - ch)), P(ub, fb0 - bt, Math.max(zb0, zb1 - ch)),
        // la cara se parte en dos planos (la panza de la losa) y el canto de arriba se achaflana en el medio
        P((ua + ub) / 2 + jit(5), (fa0 + fb0) / 2 + entre(r, 0.5, 3), (za0 + zb0) / 2 + (zt - (za0 + zb0) / 2) * entre(r, 0.3, 0.6)),
      ];
      if (top && hm > zt) pts.push(P((ua + ub) / 2 + jit(6), (atr + fa0) / 2, Math.min(hm, zt + 8)));
      ps.push(poli(pts, k % 3 === 2 && r() < 0.35 && fam !== 'h' ? (fam === 'm' ? 'rv_mina_ox' : 'rv_cueva_b') : mat, jit(0.14) + (k % 2 ? -0.04 : 0.03)));
      // la nieve del hielo: un manto chato pegado a la cara de arriba de la losa (no bolas), que se asoma por el canto
      if (fam === 'h' && top) { const zA = Math.max(za0, za1), zB = Math.max(zb0, zb1), e = 2.6; ps.push(poli([P(ua + 1, fa0 - bt + 1.5, zA - ch - 0.3), P(ub - 1, fb0 - bt + 1.5, zB - ch - 0.3), P(ua + 1, fa0 - bt - 1.5, zA - ch + e), P(ub - 1, fb0 - bt - 1.5, zB - ch + e), P(ua + 1, atr + 2, zA + 0.2), P(ub - 1, atr + 2, zB + 0.2), P(ua + 1, atr + 2, zA + e + 1.4), P(ub - 1, atr + 2, zB + e + 1.4)], 'rv_nieve', jit(0.06))); }
      // la junta: una losa fina, oscura y húmeda, metida un poco bajo el estrato (es la sombra de la repisa)
      if (k > 0 && za0 > 2) ps.push(poli([P(ua, fa0 - 2.5, za0 - 1.6), P(ub, fb0 - 2.5, zb0 - 1.6), P(ua, fa0 - 2.5, za0 + 0.6), P(ub, fb0 - 2.5, zb0 + 0.6), P(ua, atr, za0 - 1.6), P(ub, atr, zb0 - 1.6), P(ua, atr, za0 + 0.6), P(ub, atr, zb0 + 0.6)], junta, -0.08));
      // la repisa que queda arriba (lo que mira arriba: musgo, nieve) y el voladizo de abajo (de donde gotea o cuelga)
      const ret = retiro[k + 1] ?? retiro[k] + 4, ancho = Math.max(0, ret - retiro[k]);
      if (!top && ancho > 2.5) sobre.push([...P((ua + ub) / 2, (fa0 + fb0) / 2 - bt - ancho / 2, (za1 + zb1) / 2).slice(0, 3) as [number, number, number], Math.min(ancho, 8)] as Repisa);
      if (top) sobre.push([...P((ua + ub) / 2, (fa0 + fb0) / 2 - bt - 5, zt).slice(0, 3) as [number, number, number], 6] as Repisa);
      if (fam === 'h' && r() < 0.55) voladizos.push(P((ua + ub) / 2 + jit(6), Math.min(fa0, fb0) + 0.5, Math.min(za0, zb0) + 2)); // (carámbanos por el canto de cada estrato)
      if (k > 0 && retiro[k] < retiro[k - 1]) voladizos.push(P((ua + ub) / 2 + jit(4), (fa0 + fb0) / 2, (za0 + zb0) / 2));
    }
  }
  // grietas hondas que bajan por la cara
  for (let g = 0; g < (baja ? 1 : 2 + Math.floor(r() * 2)); g++) {
    const u = entre(r, -L * 0.7, L * 0.7), z1 = H(u) - 3, z0 = Math.max(2, z1 - entre(r, 16, 50)), w = fr(u) + 3, du = jit(10);
    if (z1 - z0 < 8) continue;
    ps.push(poli([P(u - 1.2, w, z0), P(u + 1.2, w, z0), P(u + du - 1.6, w, z1), P(u + du + 1.6, w, z1), P(u + du * 0.5, w - entre(r, 6, 11), (z0 + z1) / 2)], 'roca', 0, true));
  }
  // lascas sueltas en las repisas y bloques caídos al pie
  for (let i = 0; i < Math.min(sobre.length, baja ? 2 : 5); i++) { const [x, y, z] = sobre[Math.floor(r() * sobre.length)], sz = entre(r, 2.5, 5); ps.push(lasca(r, x + jit(5), y + jit(5), z + sz * 0.3, sz, sz * 0.8, sz * 0.6, mat, 7)); }
  for (let i = 0; i < 3 + Math.floor(r() * 3); i++) { const u = entre(r, -L, L), c = P(u, fr(u) + entre(r, 3, 14), 0), sz = entre(r, 3, 8); ps.push(lasca(r, c[0], c[1], sz * 0.3, sz, sz * entre(r, 0.6, 0.9), sz * 0.65, mat, 8)); }
  return { sobre, voladizos };
}
function adornarPenasco(r: Az, ps: Pieza[], fam: 'c' | 'h' | 'm', baja: boolean, sobre: Repisa[], voladizos: V3[]) {
  if (fam === 'm') return; // (en la mina la roca va pelada: ni musgo ni nieve)
  // lo que mira arriba: en la cueva musgo en algunas repisas; en el hielo, el copete de nieve en todas (chato, como un manto, no bolas)
  for (const [x, y, z, e] of sobre) {
    if (fam === 'h') break; // (la nieve va en la losa misma)
    if (r() > 0.45) continue;
    const cs2: Comp[] = [], n = 2 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) cs2.push(bulto([x + (r() - 0.5) * e * 1.6, y + (r() - 0.5) * e * 1.6, z + 0.3], [e * entre(r, 0.6, 1), e * entre(r, 0.45, 0.8), entre(r, 0.6, 1.2)], { giro: r() * 180 }));
    ps.push(masa(cs2, { mat: r() < 0.6 ? 'rv_musgo' : 'rv_musgo_seco', suave: 1.4 }));
  }
  if (baja) return;
  // lo que cuelga de los voladizos: carámbanos en el hielo, gotas de colada en la cueva
  for (const [x, y, z] of voladizos) {
    const n = fam === 'h' ? 1 + Math.floor(r() * 3) : r() < 0.45 ? 1 : 0;
    for (let i = 0; i < n; i++) { const l = fam === 'h' ? entre(r, 9, 22) : entre(r, 4, 9), dx = (r() - 0.5) * 10, dy = (r() - 0.5) * 4; ps.push(masa([hM([x + dx, y + dy, z + 0.5], [x + dx + (r() - 0.5) * 0.6, y + dy, z + 0.5 - l], fam === 'h' ? entre(r, 0.8, 1.4) : 1.6, 0.15)], { mat: fam === 'h' ? 'rv_caramb' : 'rv_cueva', suave: 0.3 })); }
  }
}

registrar(
  {
    id: 'roca_penasco', nombre: ['Roca de caverna', 'Cavern rock'], tema: 'cueva',
    variantes: ['c', 'h', 'm'].flatMap((f) => MACIZOS.map((v) => f + '_' + v)), huella: [2, 2], bloquea: false,
    armar: (v, _f) => {
      const r = azar(v), ps: Pieza[] = [], fam = v[0] as 'c' | 'h' | 'm', cl = v[2], dir = +v.split('_')[2], [lo, hi] = CLASES_MAC[cl] ?? [50, 66];
      { const al = entre(r, lo, hi), m = macizo(r, ps, al, fam, cl === 'b', dir); adornarPenasco(r, ps, fam, cl === 'b', m.sobre, m.voladizos); }
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
  for (let i = 0; i < Math.round(L / 3); i++) { const u = entre(r, -L, L), f = Math.pow(r(), 1.3), w = w0 + (w1 - w0) * f * 0.85, e = entre(r, 9, 16) * (1 - f * 0.45); const c = P(u, w, 0); cs.push(bulto([c[0], c[1], 0.05], [e, e * entre(r, 0.55, 0.9), entre(r, 0.4, 0.9)], { giro: r() * 180 })); }
  ps.push(masa(cs, { mat: polvo, suave: 2.5, tono: -0.02 }));
  // la piedra: grande y tupida atrás, chica y suelta adelante
  const n = Math.round(L * 3);
  for (let i = 0; i < n; i++) {
    const f = Math.pow(r(), 1.35), u = entre(r, -L, L), w = w0 + (w1 - w0) * f + (r() - 0.5) * 2, s = (1 - f) * entre(r, 3.5, 8) + entre(r, 1, 2.2);
    const c = P(u, w, s * 0.22);
    // (tercera vuelta: el talud no se leía con la luz de la mina. La sombra oscura de cada piedra grande, hacia donde cae la luz, y
    //  la piedra de arriba del montón más clara, como recién caída)
    if (s > 2.6) ps.push(masa([bulto([c[0] + s * 0.45, c[1] - s * 0.3, 0.05], [s * 1.15, s * 0.85, 0.35], { giro: r() * 180 })], { mat: 'rv_junta', suave: 0.5 }));
    ps.push(lasca(r, c[0], c[1], c[2], s, s * entre(r, 0.6, 0.95), s * entre(r, 0.35, 0.6), f < 0.45 && r() < 0.55 ? 'rv_piedra_clara' : r() < 0.35 ? 'rv_grava' : roca, 6));
  }
  if (fam === 'c' && r() < 0.6) { const c = P(entre(r, -L * 0.6, L * 0.6), w0 + 4, 0); ps.push(masa([bulto([c[0], c[1], 0.3], [entre(r, 4, 7), entre(r, 3, 5), 1.2]), bulto([c[0] + 3, c[1] - 2, 0.4], [3, 2.5, 1])], { mat: 'rv_musgo', suave: 1.4 })); }
}
registrar({
  id: 'roca_pie', nombre: ['Talud de roca', 'Rock talus'], tema: 'cueva',
  variantes: [...PIES_M, ...PIES_M.map((v) => v + '_y'), ...PIES_C], huella: [5, 2], plano: true, bloquea: false,
  huellaPor: Object.fromEntries(PIES_C.map((v) => [v, [2, 2]])) as Record<string, [number, number]>,
  armar: (v, _f) => {
    const ejeY = v.endsWith('_y'), base = ejeY ? v.slice(0, -2) : v, r = azar('pie_' + base), ps: Pieza[] = [];
    if (base[0] === 'm') talud(r, ps, ejeDe(ejeY), 42, -12, 26, 'm');
    else {
      // en la cueva, el talud rodea la roca: va en arco hacia adelante (+x +y)
      const g = entre(r, 0.2, 1.3), Pc = (u: number, w: number, z: number): V3 => [Math.cos(g) * w - Math.sin(g) * u, Math.sin(g) * w + Math.cos(g) * u, z];
      talud(r, ps, Pc, 24, -10, 22, base[0] as 'c' | 'h');
    }
    ps.push(suelo());
    return ps;
  },
});
