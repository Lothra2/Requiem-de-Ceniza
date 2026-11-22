import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';

// Pisos propios de las zonas del acto 2 (22 nov 2026, Rick: "bajé por unas escaleras y por el portal y el mundo se parece
// mucho"). Cada zona del desierto tenía la misma arena o la misma arenisca: ahora cada una pisa lo suyo. Van aquí (en el
// catálogo) y no en pisos.ts para no mover la huella del pintor de héroes (`__PINTOR__`). Todos son de 8 variantes y se
// repiten cada dos baldosas (como los quietos de pisos.ts: `PISO_DOBLE` en motor/assets.ts los lista).

const P = BALDOSA, PER = 2;
export function rper(x: number, y: number, per: number, s = 0): number {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const pp = per * PER, h = (a: number, b: number) => hash3(((a % pp) + pp) % pp, ((b % pp) + pp) % pp, s);
  const sm = (t: number) => t * t * (3 - 2 * t), u = sm(xf), v = sm(yf);
  return (h(xi, yi) * (1 - u) + h(xi + 1, yi) * u) * (1 - v) + (h(xi, yi + 1) * (1 - u) + h(xi + 1, yi + 1) * u) * v;
}
export const fr = (x: number, y: number, e: number, s = 0) => rper((x / P) * e, (y / P) * e, e, s) * 0.6 + rper((x / P) * e * 2, (y / P) * e * 2, e * 2, s + 1) * 0.3 + rper((x / P) * e * 4, (y / P) * e * 4, e * 4, s + 2) * 0.1;
export function voronoi(x: number, y: number, n: number, s = 0): [number, number, number] {
  const c = P / n, cx = Math.floor(x / c), cy = Math.floor(y / c);
  let d1 = 1e9, d2 = 1e9, id = 0;
  for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
    const nn = n * PER, gx = cx + i, gy = cy + j, wx = ((gx % nn) + nn) % nn, wy = ((gy % nn) + nn) % nn;
    const px = (gx + 0.15 + hash3(wx, wy, s) * 0.7) * c, py = (gy + 0.15 + hash3(wx, wy, s + 9) * 0.7) * c;
    const d = Math.hypot(x - px, y - py);
    if (d < d1) { d2 = d1; d1 = d; id = wx * 131 + wy; } else if (d < d2) d2 = d;
  }
  return [d1, d2, id];
}
export const det = (x: number, y: number, v: number, k: number) => hash3(Math.floor(x / k), Math.floor(y / k), v * 7 + 3);
export const lejos = (x0: number, y0: number, m = 8) => { const PP = P * PER, x = x0 % PP, y = y0 % PP; return x > m && y > m && x < PP - m && y < PP - m; };

// materiales del piso (rampas de la sombra a la luz)
MATERIALES.a2_arena_duna = { rampa: ['#24170a', '#3f2a14', '#5f411f', '#83592b', '#a7743a', '#c3904c', '#d9aa64'], ruido: 0.12, escala: 0.2 };
MATERIALES.a2_barro = { rampa: ['#3a2716', '#4f3720', '#664a2c', '#7d5e39', '#947348', '#a98858', '#bc9c6a', '#cbb07f'], ruido: 0.2, escala: 0.25 };
MATERIALES.a2_sal = { rampa: ['#3b352c', '#57503f', '#746b56', '#91876e', '#aca288', '#c4baa0', '#d8cfb6'], ruido: 0.3, escala: 0.4 };
MATERIALES.a2_grieta = { rampa: ['#231710', '#2f2015', '#3c2a1b', '#4a3522'], ruido: 0.1, escala: 0.3 };
MATERIALES.a2_losa_calle = { rampa: ['#1b150e', '#2f2619', '#463a28', '#5f5038', '#79684a', '#93805d', '#ab9872'], ruido: 0.22, escala: 0.18 };
MATERIALES.a2_basalto = { rampa: ['#0a0c0d', '#141719', '#1f2326', '#2b3033', '#383e41', '#464d50', '#565e60'], ruido: 0.26, escala: 0.22 };
MATERIALES.a2_agua_negra = { rampa: ['#020304', '#05080a', '#0a0f12', '#10181c', '#1a2429', '#2b3a40'], ruido: 0.08, escala: 0.3, brillo: 0.5 };
MATERIALES.a2_lodo = { rampa: ['#060505', '#0e0c0a', '#171410', '#211d17', '#2c271f'], ruido: 0.2, escala: 0.3 };
MATERIALES.a2_piedra_sol = { rampa: ['#1f1408', '#38250f', '#543818', '#714c21', '#8f632d', '#ad7c3b', '#c7964d'], ruido: 0.14, escala: 0.16 };
MATERIALES.a2_oro_viejo = { rampa: ['#2a1a05', '#4a300a', '#6e4a10', '#966818', '#bb8a24', '#d9ab3c', '#efcc66'], ruido: 0.1, escala: 0.2, brillo: 0.6 };
MATERIALES.a2_basalto_pulido = { rampa: ['#07070a', '#0f0f14', '#18181f', '#22222b', '#2e2e39', '#3c3c49'], ruido: 0.08, escala: 0.2, brillo: 0.4 };
MATERIALES.a2_porfido = { rampa: ['#120608', '#210b0e', '#321216', '#451a1e', '#5a2328', '#6f2e33'], ruido: 0.25, escala: 0.3 };
MATERIALES.a2_quitina = { rampa: ['#05070a', '#0b1413', '#12221d', '#1a3226', '#29452c', '#4a6234', '#7d8448'], ruido: 0.1, escala: 0.3, brillo: 0.7 };
MATERIALES.a2_caliza_dormidos = { rampa: ['#24170b', '#3d2814', '#573b1f', '#73502b', '#8f6738', '#a87f49', '#be965d'], ruido: 0.2, escala: 0.18 };
MATERIALES.a2_polvo_vendas = { rampa: ['#3a2c1c', '#544129', '#6f5838', '#8b7049', '#a5885c', '#bba071'], ruido: 0.3, escala: 0.35 };
MATERIALES.a2_ocre_piso = { rampa: ['#2b0f06', '#45190b', '#5f2511', '#7a3118'], ruido: 0.25, escala: 0.3 };
MATERIALES.a2_resina_piso = { rampa: ['#2a1203', '#4a2306', '#6e370b', '#954f12', '#bb6a1c'], ruido: 0.15, escala: 0.3, brillo: 0.6 };
MATERIALES.a2_roca_cueva = { rampa: ['#110d09', '#1e1811', '#2d241a', '#3d3224', '#4f412f', '#61513b'], ruido: 0.3, escala: 0.2 };

const NUEVOS: PisoDef[] = [
  // las Dunas: arena viva, rizos asimétricos del viento (lado de barlovento largo, sotavento corto) y vetas de arena fina
  { id: 'a2_arena_duna', nombre: ['Arena de duna', 'Dune sand'], tema: 'desierto', variantes: 8, punto: (x, y, v) => {
    const ondu = fr(x, y, 2, 41) * 1.7 + fr(x, y, 6, 42) * 0.35;
    const f = (((x + y * 0.5) / P) * 7 + ondu) % 1, sierra = f < 0.78 ? f / 0.78 : (1 - f) / 0.22;
    const veta = fr(x, y, 14, 43);
    let tono = (sierra - 0.5) * 0.22 + (veta - 0.5) * 0.08;
    if (v > 0 && lejos(x, y) && det(x, y, v, 7) > 0.93) return ['a2_arena_duna', 1.6, -0.18]; // piedrita medio enterrada
    if (f > 0.78) tono -= 0.06; // la sombra del sotavento
    return ['a2_arena_duna', sierra * 1.6, tono];
  } },
  // el Oasis Muerto: el lecho del lago en placas de barro. Placas de tamaños dispares (dos escalas que se mezclan con un campo
  // suave, así la baldosa no se repite a la vista), cada una con su tono (de barro pardo a casi arena), el canto levantado y
  // claro donde se enrosca la costra, la grieta angosta con su sombra al lado y costra de sal en algunas
  { id: 'a2_barro_seco', nombre: ['Barro seco', 'Dried mud'], tema: 'desierto', variantes: 8, punto: (x, y, v) => {
    const k = fr(x, y, 2, 70), [g1, g2, gid] = voronoi(x, y, 3, 44), [c1, c2, cid] = voronoi(x, y, 6, 71);
    const chica = k > 0.52, b = chica ? c2 - c1 : g2 - g1, id = chica ? cid : gid;
    if (b < 0.8) return ['a2_grieta', -2, 0];
    if (b < 1.8) return ['a2_barro', -0.4, -0.2 + (b - 0.8) * 0.12]; // la sombra al pie del canto
    const sal = fr(x, y, 4, 46 + (id % 5));
    const canto = Math.max(0, 4.5 - b);
    const h = 0.8 + canto * 0.35 + (fr(x, y, 10, id) - 0.5) * 0.5;
    const tono = (hash3(id, 3, 7) - 0.5) * 0.3 + canto * 0.05 + (k - 0.5) * 0.15;
    if (sal > 0.7 || (v > 0 && lejos(x, y) && det(x, y, v, 18) > 0.88 && sal > 0.5)) return ['a2_sal', h + 0.3, tono * 0.5];
    if (hash3(id, 9, 2) > 0.86) return ['arena', h - 0.4, tono * 0.4 - 0.04]; // la arena que el viento metió en una placa hundida
    return ['a2_barro', h, tono];
  } },
  // la orilla del lago muerto: arena con placas de costra sueltas, chicas y levantadas, cada vez menos hacia afuera
  { id: 'a2_barro_orilla', nombre: ['Orilla de barro', 'Mud shore'], tema: 'desierto', variantes: 8, punto: (x, y, v) => {
    const [c1, c2, cid] = voronoi(x, y, 7, 72), b = c2 - c1, costra = fr(x, y, 3, 73) > 0.45 && hash3(cid, 4, 5) > 0.35;
    if (costra) {
      if (b < 1.6) return ['arena', -0.6, -0.12];
      const canto = Math.max(0, 3.4 - b);
      return ['a2_barro', 1 + canto * 0.6, (hash3(cid, 6, 1) - 0.5) * 0.25 + 0.06 + canto * 0.05];
    }
    const ola = Math.sin(((2 * x + y) / P) * Math.PI * 4 + fr(x, y, 4, 74) * 6);
    if (v > 0 && lejos(x, y) && det(x, y, v, 9) > 0.92) return ['a2_sal', 0.6, 0];
    return ['arena', ola * 0.6 + fr(x, y, 12, 75), ola * 0.05 - 0.02];
  } },
  // las Ruinas del Sol: calle de losas grandes gastadas, en hiladas, con la arena metida en las juntas y alguna losa que falta
  { id: 'a2_losa_calle', nombre: ['Losas de calle', 'Street slabs'], tema: 'desierto', variantes: 8, punto: (x, y, v) => {
    const fila = Math.floor(y / 20), cx = 32, ux = (x + (fila % 2) * 16 + hash3(fila % 8, 2, 5) * 6) % cx, uy = y % 20, losa = Math.floor((x + (fila % 2) * 16) / cx) * 17 + fila;
    const borde = Math.min(ux, cx - ux, uy, 20 - uy);
    const arena = fr(x, y, 3, 47);
    if (borde < 1.3) return ['arena', -1.5 + arena, -0.05];
    if (hash3(losa % 23, fila % 8, v) > 0.94 && lejos(x, y)) return ['arena', -0.5 + fr(x, y, 12, 48), -0.03]; // la losa que se llevaron
    if (arena > 0.66) return ['arena', 0.4 + (arena - 0.66) * 3, 0.02]; // la duna que entra en la calle
    const gasto = Math.min(1, borde / 4);
    return ['a2_losa_calle', 1 + gasto * 1.2 + (fr(x, y, 9, losa) - 0.5) * 0.6, (hash3(losa, 9, 1) - 0.5) * 0.2 - (1 - gasto) * 0.08];
  } },
  // el Pozo de los Nombres: piedra negra del pozo, losas irregulares húmedas con charcos de agua negra
  { id: 'a2_losa_pozo', nombre: ['Piedra del pozo', 'Well stone'], tema: 'tumba', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 5, 49), b = d2 - d1;
    const agua = fr(x, y, 4, 50);
    if (agua < 0.27) return ['a2_agua_negra', 0, (fr(x, y, 16, 51) - 0.5) * 0.18];
    if (b < 1.5) return ['a2_lodo', -1.5, -0.05];
    const moja = agua < 0.36 ? 0.12 : 0;
    let tono = (hash3(id, 4, 4) - 0.5) * 0.14 + moja;
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.9) tono -= 0.15;
    return ['a2_basalto', Math.min(2.5, b * 0.6), tono];
  } },
  // los Nombres Borrados: el agua negra cubre casi todo, con piedras que asoman
  { id: 'a2_agua_negra', nombre: ['Agua negra', 'Black water'], tema: 'tumba', variantes: 8, punto: (x, y) => {
    const [d1, d2] = voronoi(x, y, 6, 52), piedra = fr(x, y, 5, 53);
    if (piedra > 0.66 && d2 - d1 > 2) return ['a2_basalto', 1 + (d2 - d1) * 0.3, -0.06];
    const ola = Math.sin((x + y * 0.6) * 0.35 + fr(x, y, 6, 54) * 6) * 0.5;
    return ['a2_agua_negra', ola * 0.4, ola * 0.05 + (fr(x, y, 10, 55) - 0.5) * 0.1];
  } },
  // el Templo del Sol Caído: losas de piedra dorada pulida y, cada dos baldosas, el sol de bronce embutido en el piso
  { id: 'a2_losa_sol', nombre: ['Losas del sol', 'Sun slabs'], tema: 'tumba', variantes: 8, punto: (x, y, v) => {
    const dx = x - 80, dy = y - 80, r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    if (r < 30) {
      if (r < 13) return ['a2_oro_viejo', 1.2 - r * 0.04, 0.05 + (fr(x, y, 12, 56) - 0.5) * 0.15];
      if (r < 14.5) return ['a2_grieta', -0.5, 0];
      const rayo = Math.abs(((ang / (Math.PI * 2)) * 16 + 16.5) % 1 - 0.5) < 0.16 + (30 - r) * 0.008;
      if (r > 28.5) return ['a2_oro_viejo', 0.6, -0.1];
      if (rayo) return ['a2_oro_viejo', 1, 0.02 - (r - 14) * 0.012];
      return ['a2_piedra_sol', 0.4, 0.1];
    }
    const c = 40, ux = x % c, uy = y % c;
    if (ux < 1 || uy < 1) return ['a2_piedra_sol', -1.2, -0.3];
    let tono = (fr(x, y, 6, 57) - 0.5) * 0.18 + (hash3(Math.floor(x / c), Math.floor(y / c), 58) - 0.5) * 0.1;
    if (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.85) tono -= 0.16;
    return ['a2_piedra_sol', 1, tono];
  } },
  // la Cámara del Rey sin Sombra: basalto pulido en losas grandes con filete de oro y una banda de pórfido
  { id: 'a2_losa_rey', nombre: ['Losas del rey', 'King\'s slabs'], tema: 'tumba', variantes: 8, punto: (x, y, v) => {
    const c = 40, ux = x % c, uy = y % c;
    if (ux < 1.1 || uy < 1.1) return ['a2_oro_viejo', 0.4, -0.12];
    const ix = Math.floor(x / c), iy = Math.floor(y / c), pf = (ix + iy) % 2 === 0;
    if (pf && ux > 5 && ux < 35 && uy > 5 && uy < 35 && (ux < 7 || ux > 33 || uy < 7 || uy > 33)) return ['a2_porfido', 0.6, (fr(x, y, 10, 59) - 0.5) * 0.2];
    let tono = (fr(x, y, 5, 60) - 0.5) * 0.12 + Math.sin((x - y) * 0.09) * 0.03;
    if (v > 0 && lejos(x, y) && det(x, y, v, 16) > 0.86) tono -= 0.1;
    return ['a2_basalto_pulido', 1, tono];
  } },
  // la Galería de los Dormidos: losas largas como tapas de fosa, de caliza tostada, a lo largo de la galería; el polvo de las
  // vendas en las juntas, el surco grabado con su línea de ocre en algunas tapas y gotas de resina ámbar de los embalsamadores
  { id: 'a2_losa_dormidos', nombre: ['Losas de fosa', 'Grave slabs'], tema: 'tumba', variantes: 8, punto: (x, y, v) => {
    const col = Math.floor(x / 18), corr = hash3(col % 9, 1, 61) * 40, uy = (y + corr) % 40, ux = x % 18, losa = col * 7 + Math.floor((y + corr) / 40);
    if (ux < 1 || uy < 1) return ['a2_polvo_vendas', -1, -0.12];
    const polvo = fr(x, y, 4, 62);
    if (polvo > 0.72) return ['a2_polvo_vendas', 0.3, (polvo - 0.72) * 0.6];
    let tono = (hash3(losa % 31, 3, 63) - 0.5) * 0.22;
    const grabada = hash3(losa % 31, 5, 64) > 0.55;
    if (grabada && Math.abs(ux - 9) < 0.8 && uy > 7 && uy < 33) return ['a2_ocre_piso', 0.2, 0.05];
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.93) return ['a2_resina_piso', 1.3, 0.1];
    if (v > 0 && lejos(x, y) && det(x, y, v, 12) > 0.86) tono -= 0.12;
    return ['a2_caliza_dormidos', 1, tono];
  } },
  // la Cueva de los Escarabajos: roca de cueva con la arena que entra en lenguas y pedazos de quitina que brillan
  { id: 'a2_cueva_quitina', nombre: ['Suelo de la cueva de los escarabajos', 'Scarab cave floor'], tema: 'cueva', variantes: 8, punto: (x, y, v) => {
    const arena = fr(x, y, 3, 65), n = fr(x, y, 8, 66);
    const [d1, d2, id] = voronoi(x, y, 16, 67);
    if (hash3(id, 7, 68) > 0.86 && d2 - d1 > 1.2 && d1 < 3.5) return ['a2_quitina', 1.5 + (3.5 - d1) * 0.4, (hash3(id, 2, 69) - 0.5) * 0.3];
    if (arena > 0.58) { const ola = Math.sin(((x + 2 * y) / P) * Math.PI * 6 + n * 5); return ['arena', 0.6 + ola * 0.4 + (arena - 0.58) * 4, -0.06 + ola * 0.04]; }
    if (v > 0 && lejos(x, y) && det(x, y, v, 5) > 0.9) return ['a2_roca_cueva', 2.2, 0.06];
    return ['a2_roca_cueva', n * 2.5, (n - 0.5) * 0.25 - 0.04];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO2 = NUEVOS.map((d) => d.id);
