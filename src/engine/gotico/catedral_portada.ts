import { lamina, mascara, desenfocar, halo, fbm, hash2, sat, suave, type Lamina, type Mascara, type C3, type P2 } from './cine';

/**
 * La catedral de la portada, pintada como toma de cine: un modelo 3D de verdad (fachada de dos torres con agujas,
 * rosetón, tres portales, nave con arbotantes, crucero y aguja del crucero) visto desde abajo de la colina con una
 * cámara en perspectiva. No es el sprite isométrico del juego: acá las verticales fugan hacia arriba, la nave se
 * pierde en la bruma y el edificio nace del terreno (colina y escalinata salen del mismo render, con el mismo
 * z-buffer). La luz es de contraluz: luna de sangre detrás (filo naranja en los bordes), fuego de la puerta y de la
 * ciudad desde abajo en la fachada, y un frío de tormenta en el flanco.
 *
 * Devuelve lo mismo que la catedral vieja: la capa, la luz que late, dónde quedó la puerta y la máscara de vidrios
 * (por donde se ve el fuego de Doom).
 */

type V3 = [number, number, number];
const add = (a: V3, b: V3): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a: V3, k: number): V3 => [a[0] * k, a[1] * k, a[2] * k];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a: V3): V3 => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };

const PIEDRA = 0, TECHO = 1, TIERRA = 2, HUECO = 3, VIDRIO = 4, FUEGO = 5, MARCO = 6, ESCALON = 7, ROSA = 8;
interface Tri { p: [V3, V3, V3]; n: V3; mat: number; uv?: [P2, P2, P2]; dim?: [number, number]; id: number; brillo?: number }

export interface OpcCatedral { w: number; h: number; x: number; y: number; alto: number; ss?: number; /** Dónde está la luna en la capa (de ahí viene el filo de contraluz). */ luna?: P2 }

export function catedralHeroica(o: OpcCatedral): { capa: Lamina; luz: Lamina; puerta: P2; vitrales: Mascara; luna: P2 } {
  const T: Tri[] = [];
  let nid = 1;
  // ------------------------------------------------------------------ piezas
  const poli = (pts: V3[], mat: number, hacia: V3 | null, x: Partial<Tri> = {}, uvs?: P2[]) => {
    let n = norm(cross(sub(pts[1], pts[0]), sub(pts[2], pts[0])));
    if (hacia && dot(n, hacia) < 0) n = mul(n, -1);
    for (let i = 1; i < pts.length - 1; i++) T.push({ p: [pts[0], pts[i], pts[i + 1]], n, mat, id: x.id ?? 0, dim: x.dim, brillo: x.brillo, uv: uvs ? [uvs[0], uvs[i], uvs[i + 1]] : undefined });
  };
  const caja = (x0: number, x1: number, y0: number, y1: number, z0: number, z1: number, mat = PIEDRA, tapa = true) => {
    poli([[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], mat, [0, 0, -1]);
    poli([[x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1]], mat, [0, 0, 1]);
    poli([[x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0]], mat, [-1, 0, 0]);
    poli([[x1, y0, z0], [x1, y0, z1], [x1, y1, z1], [x1, y1, z0]], mat, [1, 0, 0]);
    if (tapa) poli([[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], mat, [0, 1, 0]);
  };
  /** Aguja de n lados; `corte` (0..1) la deja rota a esa altura con el borde mellado. */
  const aguja = (cx: number, cz: number, y0: number, r: number, y1: number, lados = 8, corte = 1, giro = Math.PI / 8) => {
    const ap: V3 = [cx, y1, cz];
    for (let i = 0; i < lados; i++) {
      const a0 = giro + (i / lados) * Math.PI * 2, a1 = giro + ((i + 1) / lados) * Math.PI * 2;
      const b0: V3 = [cx + Math.cos(a0) * r, y0, cz + Math.sin(a0) * r], b1: V3 = [cx + Math.cos(a1) * r, y0, cz + Math.sin(a1) * r];
      const fuera: V3 = [Math.cos((a0 + a1) / 2), 0.25, Math.sin((a0 + a1) / 2)];
      if (corte >= 1) { poli([b0, b1, ap], TECHO, fuera); continue; }
      const k0 = corte * (0.82 + 0.3 * hash2(i, 7, 91)), k1 = corte * (0.82 + 0.3 * hash2(i + 1 === lados ? 0 : i + 1, 7, 91));
      const t0 = add(b0, mul(sub(ap, b0), k0)), t1 = add(b1, mul(sub(ap, b1), k1));
      poli([b0, b1, t1, t0], TECHO, fuera);
      // el hueco de adentro arde
      poli([t0, t1, [cx, y0 + (y1 - y0) * corte * 0.55, cz]], FUEGO, [0, 1, 0], { brillo: 1 });
    }
  };
  const pinaculo = (cx: number, cz: number, y0: number, s: number, h: number) => {
    caja(cx - s / 2, cx + s / 2, y0, y0 + h * 0.42, cz - s / 2, cz + s / 2);
    aguja(cx, cz, y0 + h * 0.42, s * 0.72, y0 + h, 4, 1, Math.PI / 4);
  };
  const cruz = (cx: number, y: number, cz: number, s: number, eje: 'x' | 'z') => {
    caja(cx - s * 0.07, cx + s * 0.07, y, y + s, cz - s * 0.07, cz + s * 0.07, HUECO);
    if (eje === 'x') caja(cx - s * 0.3, cx + s * 0.3, y + s * 0.6, y + s * 0.72, cz - s * 0.07, cz + s * 0.07, HUECO);
    else caja(cx - s * 0.07, cx + s * 0.07, y + s * 0.6, y + s * 0.72, cz - s * 0.3, cz + s * 0.3, HUECO);
  };
  /** Arco ojival sobre un muro: base en `o` (centro abajo), `der` a lo largo del muro, `n` hacia afuera. */
  const ojiva = (o2: V3, der: V3, n: V3, w: number, h: number, mat: number, sale: number, x: Partial<Tri> = {}) => {
    const hs = Math.max(0.1, h - 0.866 * w), pts: P2[] = [[-w / 2, 0], [w / 2, 0], [w / 2, hs]];
    for (let k = 1; k <= 6; k++) { const a = (k / 6) * (Math.PI / 3); pts.push([-w / 2 + w * Math.cos(a), hs + w * Math.sin(a)]); }
    for (let k = 5; k >= 0; k--) { const a = (k / 6) * (Math.PI / 3); pts.push([w / 2 - w * Math.cos(a), hs + w * Math.sin(a)]); }
    const base = add(o2, mul(n, sale));
    const P3 = pts.map(([px, py]) => add(add(base, mul(der, px)), [0, py, 0] as V3));
    // abanico desde el centro (el arco no es convexo desde la esquina)
    const c3 = add(base, [0, hs * 0.5, 0] as V3), cu: P2 = [0.5, (hs * 0.5) / h];
    for (let i = 0; i < pts.length; i++) {
      const j = (i + 1) % pts.length;
      T.push({ p: [c3, P3[i], P3[j]], n, mat, id: x.id ?? 0, dim: [w, h], brillo: x.brillo, uv: [cu, [pts[i][0] / w + 0.5, pts[i][1] / h], [pts[j][0] / w + 0.5, pts[j][1] / h]] });
    }
  };
  /** Ventana: marco de piedra clara, derrame oscuro y vidrio. */
  const ventana = (o2: V3, der: V3, n: V3, w: number, h: number, brillo = 1) => {
    ojiva(add(o2, [0, -0.35, 0]), der, n, w + 1.0, h + 0.9, MARCO, 0.05);
    ojiva(add(o2, [0, -0.1, 0]), der, n, w + 0.36, h + 0.3, HUECO, 0.09);
    ojiva(o2, der, n, w, h, VIDRIO, 0.13, { id: nid++, brillo });
  };
  const disco = (c: V3, der: V3, n: V3, r: number, mat: number, sale: number, x: Partial<Tri> = {}) => {
    const base = add(c, mul(n, sale)), N = 32;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * Math.PI * 2, a1 = ((i + 1) / N) * Math.PI * 2;
      const q = (a: number): V3 => add(add(base, mul(der, Math.cos(a) * r)), [0, Math.sin(a) * r, 0] as V3);
      T.push({ p: [base, q(a0), q(a1)], n, mat, id: x.id ?? 0, dim: [r, r], brillo: x.brillo, uv: [[0, 0], [Math.cos(a0), Math.sin(a0)], [Math.cos(a1), Math.sin(a1)]] });
    }
  };
  const FZ: V3 = [0, 0, -1], FX: V3 = [1, 0, 0], DX: V3 = [1, 0, 0], DZ: V3 = [0, 0, 1];

  // ------------------------------------------------------------------ el edificio
  // torres de la fachada
  const torre = (cx: number, rota: boolean) => {
    const x0 = cx - 4.6, x1 = cx + 4.6, z0 = 0, z1 = 9.2, H1 = 47;
    caja(x0, x1, 0, H1, z0, z1);
    // contrafuertes de esquina, con dos retallos
    for (const [bx, bz] of [[x0, z0], [x1, z0], [x0, z1], [x1, z1]] as P2[]) {
      caja(bx - 1.1, bx + 1.1, 0, 17, bz - 1.1, bz + 1.1); caja(bx - 0.8, bx + 0.8, 17, 32, bz - 0.8, bz + 0.8); caja(bx - 0.55, bx + 0.55, 32, 43, bz - 0.55, bz + 0.55);
      pinaculo(bx, bz, 43, 0.9, 4.2);
    }
    // cornisas
    for (const y of [13.2, 27.4, 40.6, H1]) caja(x0 - 0.45, x1 + 0.45, y, y + 0.55, z0 - 0.45, z1 + 0.45);
    // portal lateral, ventanal y campanario (fachada y flanco)
    ojiva([cx, -0.3, z0], DX, FZ, 4.6, 8.2, MARCO, 0.06); ojiva([cx, 0, z0], DX, FZ, 3.2, 6.8, HUECO, 0.12); ojiva([cx, 0, z0], DX, FZ, 2.5, 6.0, FUEGO, 0.18, { brillo: 0.55 });
    ventana([cx, 15.4, z0], DX, FZ, 2.6, 10.2, 1);
    ventana([cx - 1.75, 29.6, z0], DX, FZ, 1.9, 9.6, 0.7); ventana([cx + 1.75, 29.6, z0], DX, FZ, 1.9, 9.6, 0.7);
    for (const y of [42.2]) for (const dx of [-2.6, 0, 2.6]) ojiva([cx + dx, y, z0], DX, FZ, 1.3, 3.6, HUECO, 0.08);
    const zc = (z0 + z1) / 2;
    ventana([x1, 15.4, zc], DZ, FX, 2.6, 10.2, 0.9);
    ventana([x1, 29.6, zc - 1.75], DZ, FX, 1.9, 9.6, 0.6); ventana([x1, 29.6, zc + 1.75], DZ, FX, 1.9, 9.6, 0.6);
    // remate: cuatro pináculos y la aguja de ocho lados
    for (const [bx, bz] of [[x0 + 0.7, z0 + 0.7], [x1 - 0.7, z0 + 0.7], [x0 + 0.7, z1 - 0.7], [x1 - 0.7, z1 - 0.7]] as P2[]) pinaculo(bx, bz, H1 + 0.55, 1.5, 10.5);
    caja(x0 + 1.2, x1 - 1.2, H1 + 0.55, H1 + 3.2, z0 + 1.2, z1 - 1.2);
    if (rota) aguja(cx, zc, H1 + 3.2, 3.9, 88, 8, 0.4);
    else { aguja(cx, zc, H1 + 3.2, 3.9, 90, 8); cruz(cx, 89.4, zc, 3.4, 'x'); }
  };
  torre(10.6, false); torre(-10.6, true);
  // cuerpo central de la fachada: portal, galería, rosetón y hastial
  const zf = 0.9;
  caja(-6, 6, 0, 30.5, zf, 3);
  poli([[-6.4, 30.5, zf], [6.4, 30.5, zf], [0, 41, zf]], PIEDRA, FZ);
  caja(-6.5, 6.5, 30.2, 30.9, zf - 0.4, zf + 0.6);
  cruz(0, 41, zf, 3, 'x');
  // gablete del portal y el portal abierto, con el fuego adentro
  poli([[-4.9, 9.6, zf - 0.25], [4.9, 9.6, zf - 0.25], [0, 15.6, zf - 0.25]], MARCO, FZ);
  ojiva([0, -0.3, zf], DX, FZ, 7.4, 11.6, MARCO, 0.3); ojiva([0, 0, zf], DX, FZ, 6.0, 10.4, PIEDRA, 0.36); ojiva([0, 0, zf], DX, FZ, 4.9, 9.4, HUECO, 0.42);
  ojiva([0, 0, zf], DX, FZ, 4.0, 8.6, FUEGO, 0.48, { brillo: 1 });
  for (let i = -3; i <= 3; i++) { ojiva([i * 1.6, 15.2, zf], DX, FZ, 1.05, 2.9, HUECO, 0.08); ojiva([i * 1.6, 15.3, zf], DX, FZ, 0.7, 2.4, FUEGO, 0.12, { brillo: 0.35 }); }
  disco([0, 24.2, zf], DX, FZ, 5.3, MARCO, 0.06); disco([0, 24.2, zf], DX, FZ, 4.7, HUECO, 0.1); disco([0, 24.2, zf], DX, FZ, 4.35, ROSA, 0.15, { id: nid++, brillo: 1 });
  ventana([0, 32.4, zf], DX, FZ, 1.5, 4.2, 0.6);
  // nave, naves laterales y techos
  const ZN = 64;
  caja(-7, 7, 0, 27.5, 3, ZN, PIEDRA, false);
  poli([[-7.5, 27.5, 3], [0, 38, 3], [0, 38, ZN], [-7.5, 27.5, ZN]], TECHO, [-1, 1, 0]);
  poli([[7.5, 27.5, 3], [0, 38, 3], [0, 38, ZN], [7.5, 27.5, ZN]], TECHO, [1, 1, 0]);
  caja(7, 13, 0, 14, 9.2, ZN, PIEDRA, false); caja(-13, -7, 0, 14, 9.2, ZN, PIEDRA, false);
  poli([[13.4, 14, 9.2], [7, 18.6, 9.2], [7, 18.6, ZN], [13.4, 14, ZN]], TECHO, [1, 1, 0]);
  poli([[-13.4, 14, 9.2], [-7, 18.6, 9.2], [-7, 18.6, ZN], [-13.4, 14, ZN]], TECHO, [-1, 1, 0]);
  caja(7, 7.4, 27.2, 27.9, 3, ZN);
  // tramos: ventanas altas, ventanas bajas, contrafuertes con pináculo y arbotantes
  for (let i = 0; i < 8; i++) {
    const z = 13.6 + i * 6.3, enCrucero = z > 38 && z < 54;
    const zb = z - 3.15;
    if (!enCrucero || zb < 39.5 || zb > 52.5) {
      caja(13, 14.9, 0, 17.5, zb - 0.6, zb + 0.6); caja(13.2, 14.5, 17.5, 20.5, zb - 0.45, zb + 0.45); pinaculo(13.85, zb, 20.5, 1.1, 6);
      // arbotante: una barra inclinada del contrafuerte al muro alto
      poli([[13.6, 19.2, zb - 0.32], [7, 25.2, zb - 0.32], [7, 23.6, zb - 0.32], [13.6, 17.4, zb - 0.32]], PIEDRA, FZ);
      poli([[13.6, 19.2, zb + 0.32], [7, 25.2, zb + 0.32], [7, 23.6, zb + 0.32], [13.6, 17.4, zb + 0.32]], PIEDRA, DZ);
      poli([[13.6, 19.2, zb - 0.32], [7, 25.2, zb - 0.32], [7, 25.2, zb + 0.32], [13.6, 19.2, zb + 0.32]], PIEDRA, [1, 1, 0]);
    }
    if (enCrucero) continue;
    ventana([7, 19.6, z], DZ, FX, 2.7, 6.6, 0.85);
    ventana([13, 3.2, z], DZ, FX, 2.5, 8.6, 0.95);
  }
  // crucero con su hastial y su ventanal, y la aguja del crucero
  caja(-23, 23, 0, 27.5, 40, 52, PIEDRA, false);
  poli([[-23.5, 27.5, 39.6], [23.5, 27.5, 39.6], [23.5, 38, 46], [-23.5, 38, 46]], TECHO, [0, 1, -1]);
  poli([[-23.5, 27.5, 52.4], [23.5, 27.5, 52.4], [23.5, 38, 46], [-23.5, 38, 46]], TECHO, [0, 1, 1]);
  poli([[23, 27.5, 40], [23, 27.5, 52], [23, 38, 46]], PIEDRA, FX);
  ventana([23, 5, 46], DZ, FX, 5.2, 17, 1); ventana([23, 28.4, 46], DZ, FX, 1.6, 4.4, 0.5);
  for (const zz of [40, 52]) { caja(22.2, 24.4, 0, 30, zz - 1.2, zz + 1.2); pinaculo(23.3, zz, 30, 1.9, 9.5); }
  ventana([16, 6, 40], DX, FZ, 2.6, 13, 0.8);
  caja(-1.9, 1.9, 36, 41.5, 44.1, 47.9); for (const [bx, bz] of [[-1.9, 44.1], [1.9, 44.1], [-1.9, 47.9], [1.9, 47.9]] as P2[]) pinaculo(bx, bz, 41.5, 0.8, 4.4);
  aguja(0, 46, 41.5, 1.75, 71, 8); cruz(0, 70.6, 46, 2.4, 'x');
  // cabecera
  caja(-7, 7, 0, 27.5, ZN, ZN + 7, PIEDRA, false); aguja(0, ZN + 1, 27.5, 9, 39, 8);
  // escalinata: catorce peldaños anchos que bajan hacia el que mira, con dos pretiles
  const NE = 14, PASO = 1.15, ALZA = 0.34, ZE = -0.6;
  for (let i = 0; i < NE; i++) { const z1 = ZE - i * PASO, y1 = -i * ALZA; caja(-9.4 - i * 0.3, 9.4 + i * 0.3, y1 - ALZA - 3, y1, z1 - PASO, z1 + 0.02, ESCALON); }
  // pretiles bajos a los lados (no tapan el portal desde abajo)
  for (const s of [-1, 1]) for (let i = 0; i < NE; i += 2) caja(s * (10.3 + i * 0.3) - 0.55, s * (10.3 + i * 0.3) + 0.55, -i * ALZA - 4, -i * ALZA + 0.9, ZE - (i + 2) * PASO, ZE - i * PASO + 0.02, PIEDRA);
  // atrio: una losa bajo todo el edificio para que nada flote
  caja(-25, 25, -3, 0, ZE, ZN + 9, ESCALON);

  // ------------------------------------------------------------------ el terreno
  const hEscalera = (z: number) => (z > ZE ? 0 : Math.max(-ALZA / PASO * (ZE - z), -60));
  const alturaBase = (x: number, z: number) => {
    const dx = Math.max(0, Math.abs(x) - 27), dz = Math.max(0, ZE - 2 - z, z - (ZN + 11)), d = Math.hypot(dx, dz);
    return -15 * (1 - Math.exp(-((d / 38) ** 1.5))) - d * 0.035 + (fbm(x * 0.045 + 9, z * 0.045, 4, 17) - 0.5) * 5 * sat(d / 14) + (fbm(x * 0.21, z * 0.21, 3, 23) - 0.5) * 1.1 * sat(d / 5);
  };
  const altura = (x: number, z: number) => {
    // la bajada se abre en abanico hacia el que mira: la escalinata y el sendero quedan a la vista
    const medio = 12.5 + Math.max(0, ZE - z) * 1.5, h0 = alturaBase(x, z), k = suave(medio, medio - 5, Math.abs(x)) * suave(ZE + 2, ZE - 2, z);
    return h0 + (Math.min(h0, hEscalera(z) - 0.25) - h0) * k;
  };
  { const X0 = -250, X1 = 250, Z0 = -52, Z1 = 150, S = 2.5;
    for (let z = Z0; z < Z1; z += S) for (let x = X0; x < X1; x += S) {
      const a: V3 = [x, altura(x, z), z], b: V3 = [x + S, altura(x + S, z), z], c: V3 = [x + S, altura(x + S, z + S), z + S], d: V3 = [x, altura(x, z + S), z + S];
      T.push({ p: [a, b, c], n: [0, 1, 0], mat: TIERRA, id: 0 }, { p: [a, c, d], n: [0, 1, 0], mat: TIERRA, id: 0 });
    } }

  // ------------------------------------------------------------------ la cámara
  const SS = o.ss ?? 2, W = o.w * SS, H = o.h * SS;
  const CAM: V3 = [47, -9, -52], MIRA: V3 = [-2, 36, 14];
  const fwd = norm(sub(MIRA, CAM)), der = norm(cross([0, 1, 0], fwd)), arr = cross(fwd, der);
  const aCam = (p: V3): V3 => { const d = sub(p, CAM); return [dot(d, der), dot(d, arr), dot(d, fwd)]; };
  // encuadre: la base de la fachada en (x, y) y la punta de la aguja `alto` px más arriba
  const pA = aCam([0, 0, zf]), pB = aCam([10.6, 92.8, 4.6]);
  const esc = (o.alto * SS) / (pB[1] / pB[2] - pA[1] / pA[2]);
  const cx = o.x * SS - (pA[0] / pA[2]) * esc, cy = o.y * SS + (pA[1] / pA[2]) * esc;
  const proy = (c: V3): P2 => [cx + (c[0] / c[2]) * esc, cy - (c[1] / c[2]) * esc];
  const enPant = (p: V3): P2 => proy(aCam(p));

  // ------------------------------------------------------------------ rasterizado con z-buffer
  const zb = new Float32Array(W * H).fill(Infinity), quien = new Int32Array(W * H).fill(-1), l1 = new Float32Array(W * H), l2 = new Float32Array(W * H);
  for (let ti = 0; ti < T.length; ti++) {
    const t = T[ti], c0 = aCam(t.p[0]), c1 = aCam(t.p[1]), c2 = aCam(t.p[2]);
    if (c0[2] < 2 || c1[2] < 2 || c2[2] < 2) continue;
    const [ax, ay] = proy(c0), [bx, by] = proy(c1), [ex, ey] = proy(c2);
    const area = (bx - ax) * (ey - ay) - (ex - ax) * (by - ay); if (Math.abs(area) < 1e-6) continue;
    const x0 = Math.max(0, Math.floor(Math.min(ax, bx, ex))), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, ex)));
    const y0 = Math.max(0, Math.floor(Math.min(ay, by, ey))), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, ey)));
    if (x0 > x1 || y0 > y1) continue;
    const i0 = 1 / c0[2], i1 = 1 / c1[2], i2 = 1 / c2[2];
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5;
      const w1 = ((px - ax) * (ey - ay) - (ex - ax) * (py - ay)) / area, w2 = ((bx - ax) * (py - ay) - (px - ax) * (by - ay)) / area, w0 = 1 - w1 - w2;
      if (w0 < -1e-4 || w1 < -1e-4 || w2 < -1e-4) continue;
      const iz = w0 * i0 + w1 * i1 + w2 * i2, z = 1 / iz, i = y * W + x;
      // las piezas pegadas al muro (marcos, vidrios) ganan por su pequeño resalte: basta la comparación directa
      if (z >= zb[i]) continue;
      zb[i] = z; quien[i] = ti; l1[i] = (w1 * i1) / iz; l2[i] = (w2 * i2) / iz;
    }
  }

  // ------------------------------------------------------------------ sombreado
  const LUNA_DIR = norm([0.2, 0.42, 0.88]);
  const lunaP: P2 = o.luna ? [o.luna[0] * SS, o.luna[1] * SS] : proy(aCam(add(CAM, mul(norm([0.02, 0.36, 0.93]), 1000))));
  const PORTAL: V3 = [0, 4.5, -3.5];
  const col = new Float32Array(W * H * 3), em = new Float32Array(W * H * 3), vid = new Float32Array(W * H), cub = new Float32Array(W * H), esTierra = new Uint8Array(W * H);
  const PALETA: C3[] = [[1, 0.2, 0.05], [1, 0.42, 0.08], [1, 0.62, 0.16], [0.85, 0.08, 0.06], [0.95, 0.3, 0.2], [0.6, 0.1, 0.28]];
  const tracerLanceta = (u: number, v: number, w: number, h: number, id: number): [number, C3] => {
    const x = u * w, y = v * h, hs = h - 0.866 * w, n = w > 2.3 ? 3 : 2, g = 0.17;
    let abre = 1;
    if (x < g * 0.7 || x > w - g * 0.7 || y < g) abre = 0;
    const cel = Math.min(n - 1, Math.floor((x / w) * n));
    for (let k = 1; k < n; k++) if (Math.abs(x - (w * k) / n) < g / 2) abre = 0;
    const fila = Math.floor(y / 1.45); if (y % 1.45 < 0.11 && y < hs) abre = 0;
    let c = PALETA[Math.floor(hash2(cel + id * 7, fila, 5) * PALETA.length)];
    if (y > hs) {
      // cabeza del arco: un óculo con su anillo
      const r = Math.hypot(x - w / 2, y - (hs + w * 0.3)), R = w * 0.24;
      if (Math.abs(r - R) < g * 0.45) abre = 0; else if (r < R) { abre = 1; c = PALETA[Math.floor(hash2(id, 3, 8) * 3)]; }
    }
    return [abre, c];
  };
  const tracerRosa = (u: number, v: number, id: number): [number, C3] => {
    const r = Math.hypot(u, v), a = Math.atan2(v, u) + Math.PI;
    let abre = 1;
    for (const rr of [0.2, 0.52, 0.97]) if (Math.abs(r - rr) < 0.035) abre = 0;
    const n = r < 0.2 ? 6 : r < 0.52 ? 12 : 24, s = (a / (Math.PI * 2)) * n, f = s - Math.floor(s);
    if (r > 0.06 && Math.min(f, 1 - f) * ((Math.PI * 2 * r) / n) < 0.022) abre = 0;
    if (r > 0.52) { const cr = Math.hypot(r - 0.78, (f - 0.5) * ((Math.PI * 2 * 0.78) / n)); if (Math.abs(cr - 0.075) < 0.018) abre = 0; }
    const anillo = r < 0.2 ? 0 : r < 0.52 ? 1 : 2;
    const c = anillo === 0 ? PALETA[2] : PALETA[Math.floor(hash2(Math.floor(s) + id, anillo, 12) * PALETA.length)];
    return [abre, anillo === 0 ? [1, 0.75, 0.3] : c];
  };
  const NIEBLA: C3 = [0.2, 0.05, 0.04];
  for (let i = 0; i < W * H; i++) {
    const ti = quien[i]; if (ti < 0) continue;
    const t = T[ti], b1 = l1[i], b2 = l2[i], b0 = 1 - b1 - b2;
    const P: V3 = [t.p[0][0] * b0 + t.p[1][0] * b1 + t.p[2][0] * b2, t.p[0][1] * b0 + t.p[1][1] * b1 + t.p[2][1] * b2, t.p[0][2] * b0 + t.p[1][2] * b1 + t.p[2][2] * b2];
    let n = t.n, alb: C3, mat = t.mat;
    cub[i] = 1;
    if (mat === TIERRA) {
      const e = 0.6, hx = altura(P[0] + e, P[2]) - altura(P[0] - e, P[2]), hz = altura(P[0], P[2] + e) - altura(P[0], P[2] - e);
      n = norm([-hx, 2 * e, -hz]); esTierra[i] = 1;
      const camino = suave(6.5, 3.5, Math.abs(P[0] + Math.sin(P[2] * 0.11) * 2.2)) * suave(ZE - NE * PASO + 3, ZE - NE * PASO - 3, P[2]);
      const m = 0.6 + 0.8 * fbm(P[0] * 0.3, P[2] * 0.3, 4, 41);
      alb = [0.075 * m + camino * 0.06, 0.058 * m + camino * 0.045, 0.055 * m + camino * 0.035];
    } else if (mat === TECHO) {
      const s = P[1] * 1.9 + (P[0] + P[2]) * 0.02, fila = Math.floor(s), jf = s - fila < 0.16 ? 0.6 : 1, tj = (P[0] * 0.9 + P[2] * 0.9) * 1.1 + (fila % 2) * 0.5, jx = tj - Math.floor(tj) < 0.1 ? 0.75 : 1;
      const m = (0.8 + 0.4 * hash2(fila, Math.floor(tj), 3)) * jf * jx * (0.7 + 0.5 * fbm((P[0] + P[2]) * 0.2, P[1] * 0.12, 3, 5));
      alb = [0.11 * m, 0.115 * m, 0.15 * m];
    } else if (mat === HUECO) alb = [0.012, 0.008, 0.01];
    else if (mat === VIDRIO || mat === ROSA || mat === FUEGO) alb = [0.05, 0.016, 0.012];
    else {
      const tg = Math.abs(n[1]) > 0.9 ? P[0] : P[0] * Math.abs(n[2]) + P[2] * Math.abs(n[0]) + (Math.abs(n[0]) > 0.2 && Math.abs(n[2]) > 0.2 ? P[2] : 0);
      const cy2 = P[1] / 0.62, fila = Math.floor(cy2), junta = cy2 - fila < 0.12 ? 0.78 : 1, tt = tg / 1.25 + (fila % 2) * 0.5, jx = tt - Math.floor(tt) < 0.07 ? 0.82 : 1;
      const bloque = 0.86 + 0.28 * hash2(fila, Math.floor(tt), 9);
      const mugre = 0.55 + 0.75 * fbm(tg * 0.9, P[1] * 0.085, 4, 31), mancha = 0.75 + 0.45 * fbm(tg * 0.12, P[1] * 0.12, 3, 33);
      const k = bloque * junta * jx * mugre * mancha * (mat === MARCO ? 1.45 : mat === ESCALON ? 1.15 : 1);
      const ka = k * (1 - 0.3 * sat(P[1] / 70));
      alb = [0.25 * ka, 0.235 * ka, 0.28 * ka];
    }
    // luces
    const alFuego = norm(sub(PORTAL, P)), dF = Math.hypot(P[0] - PORTAL[0], P[1] - PORTAL[1], P[2] - PORTAL[2]);
    const kPortal = Math.max(0, dot(n, alFuego)) * (260 / (dF * dF + 55));
    const kPie = Math.max(0, dot(n, norm([0.1, -0.3, -1]))) * Math.exp(-Math.max(0, P[1]) / 26) * 0.95;
    const kCiudad = Math.max(0, dot(n, norm([-0.75, 0.05, -0.65]))) * 0.42;
    const kFrio = Math.max(0, dot(n, norm([0.95, 0.15, -0.25]))) * 0.5;
    const kLuna = Math.max(0, dot(n, LUNA_DIR));
    const kCielo = 0.5 + 0.5 * n[1], arriba = Math.max(0, n[1]);
    let r = alb[0] * (0.2 * kCielo + 1.5 * kPortal + 1.05 * kPie + 0.62 * kCiudad + 0.2 * kFrio + 1.3 * kLuna + 0.75 * arriba);
    let g = alb[1] * (0.13 * kCielo + 0.5 * kPortal + 0.34 * kPie + 0.17 * kCiudad + 0.21 * kFrio + 0.55 * kLuna + 0.2 * arriba);
    let bl = alb[2] * (0.17 * kCielo + 0.15 * kPortal + 0.1 * kPie + 0.07 * kCiudad + 0.34 * kFrio + 0.22 * kLuna + 0.1 * arriba);
    // la tierra pegada al edificio y el pie de los muros quedan en sombra (asienta la catedral)
    if (mat !== TIERRA && mat !== ESCALON) { const pie = 0.5 + 0.5 * sat((P[1] + 1) / 7); r *= pie; g *= pie; bl *= pie; }
    // bruma: lo lejano se pierde en el rojo del cielo
    const prof = zb[i], kn = sat(1 - Math.exp(-Math.max(0, prof - 78) / 135)) * (mat === TIERRA ? 0.75 : 0.9);
    r += (NIEBLA[0] - r) * kn; g += (NIEBLA[1] - g) * kn; bl += (NIEBLA[2] - bl) * kn;
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = bl;
    // vidrios y fuego
    if ((mat === VIDRIO || mat === ROSA) && t.uv) {
      const u = t.uv[0][0] * b0 + t.uv[1][0] * b1 + t.uv[2][0] * b2, v = t.uv[0][1] * b0 + t.uv[1][1] * b1 + t.uv[2][1] * b2;
      const [abre, c] = mat === ROSA ? tracerRosa(u, v, t.id) : tracerLanceta(u, v, t.dim![0], t.dim![1], t.id);
      const k = abre * (t.brillo ?? 1) * (1 - kn * 0.7);
      em[i * 3] = c[0] * k; em[i * 3 + 1] = c[1] * k; em[i * 3 + 2] = c[2] * k; vid[i] = k;
    } else if (mat === FUEGO) { const k = (t.brillo ?? 1) * (1 - kn * 0.7); em[i * 3] = 0.6 * k; em[i * 3 + 1] = 0.17 * k; em[i * 3 + 2] = 0.04 * k; vid[i] = Math.min(1, k * 1.1); }
  }
  // filo de contraluz: el borde que mira a la luna (contra el cielo o contra algo mucho más lejano) se enciende
  const filo = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x; if (!cub[i]) continue;
    const dx = lunaP[0] - x, dy = lunaP[1] - y, d = Math.hypot(dx, dy) || 1;
    let k = 0;
    for (const paso of [SS * 1.2, SS * 2.4]) {
      const sx = Math.round(x + (dx / d) * paso), sy = Math.round(y + (dy / d) * paso);
      if (sx < 0 || sy < 0 || sx >= W || sy >= H) continue;
      const j = sy * W + sx;
      if (!cub[j]) k = Math.max(k, paso < SS * 2 ? 1 : 0.55); else if (zb[j] > zb[i] + 7 + zb[i] * 0.05) k = Math.max(k, paso < SS * 2 ? 0.6 : 0.3);
    }
    filo[i] = k * (0.35 + 0.65 * Math.exp(-d / (520 * SS))) * (esTierra[i] ? 0.45 : 1);
  }

  // ------------------------------------------------------------------ a la capa (se promedia el sobremuestreo)
  const capa = lamina(o.w, o.h), luz = lamina(o.w, o.h), vitrales = mascara(o.w, o.h), k2 = 1 / (SS * SS);
  for (let y = 0; y < o.h; y++) for (let x = 0; x < o.w; x++) {
    let r = 0, g = 0, b = 0, a = 0, er = 0, eg = 0, eb = 0, v = 0;
    for (let sy = 0; sy < SS; sy++) for (let sx = 0; sx < SS; sx++) {
      const i = (y * SS + sy) * W + x * SS + sx; if (!cub[i]) continue;
      const f = filo[i];
      r += col[i * 3] + f * 1.25; g += col[i * 3 + 1] + f * 0.5; b += col[i * 3 + 2] + f * 0.18; a += 1;
      er += em[i * 3]; eg += em[i * 3 + 1]; eb += em[i * 3 + 2]; v += vid[i];
    }
    const j = (y * o.w + x) * 4;
    capa.d[j] = r * k2; capa.d[j + 1] = g * k2; capa.d[j + 2] = b * k2; capa.d[j + 3] = a * k2;
    luz.d[j] = er * k2 * 0.62; luz.d[j + 1] = eg * k2 * 0.62; luz.d[j + 2] = eb * k2 * 0.62; luz.d[j + 3] = Math.min(1, v * k2 * 0.6);
    vitrales.d[y * o.w + x] = v * k2;
  }
  // debajo del terreno todo es tierra (el borde de abajo de la capa nunca queda hueco)
  for (let x = 0; x < o.w; x++) {
    let y = 0; while (y < o.h && capa.d[(y * o.w + x) * 4 + 3] < 0.5) y++;
    let ult = -1; for (let yy = o.h - 1; yy >= y; yy--) if (capa.d[(yy * o.w + x) * 4 + 3] > 0.5) { ult = yy; break; }
    for (let yy = ult + 1; yy < o.h && ult >= 0; yy++) { const j = (yy * o.w + x) * 4; capa.d[j] = 0.03; capa.d[j + 1] = 0.022; capa.d[j + 2] = 0.024; capa.d[j + 3] = 1; }
  }
  // resplandor de vidrios y puerta: el halo que late
  const v2 = lamina(o.w, o.h); v2.d.set(luz.d); desenfocar(v2.d, o.w, o.h, 7, 4);
  const v3 = lamina(o.w, o.h); v3.d.set(luz.d); desenfocar(v3.d, o.w, o.h, 26, 4); // (4 canales: con 3 la lámina RGBA se leía corrida y dejaba copias fantasma de los vitrales en el cielo)
  for (let i = 0; i < v2.d.length; i++) luz.d[i] += v2.d[i] * 1.5 + v3.d[i] * 1.7;
  const puerta = enPant([0, 0.5, zf]).map((q) => q / SS) as P2;
  halo(luz, puerta[0], puerta[1] - 26, 95, [1, 0.36, 0.12], 0.9, 1, true);
  halo(luz, puerta[0] - 10, puerta[1] + 50, 250, [0.8, 0.12, 0.035], 0.42, 0.42, true);
  return { capa, luz, puerta, vitrales, luna: [lunaP[0] / SS, lunaP[1] / SS] };
}
