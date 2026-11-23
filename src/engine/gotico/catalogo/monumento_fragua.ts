import { registrar, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';
import { G, raiz, bajoTierra, bloque, llama, figuraVelada, calavera, cadena, cascotes } from '../kit_muerte';
import { registrarMonumento, deAvenida } from './monumentos_kit';
import { aro } from './monumentos_kit2';

/**
 * La Fragua de Ozmaren (acto 5, El Río de Lava; baja a `a5_fragua`). Canon: Ozmaren es la primera brasa, la que cayó hace mil
 * inviernos; a Sahrim le tocó su pedazo y lo puso a arder en la montaña para forjar. No es un edificio: es un volcán de
 * columnas de basalto (los prismas de seis caras que deja la lava al enfriarse), un cono que sube en escalones de columnas de
 * alto desparejo, con dos ríos de lava que bajan por sus costados y en el cráter la brasa de Ozmaren, un cristal al rojo que
 * se ve de toda la llanura. Al pie, en la base del cono, la boca de la fragua: un arco de hierro remachado con la garganta al
 * blanco, y a los lados las dos chimeneas de hierro que echan fuego. Nada de muros ni techos: roca, lava y hierro.
 *
 * Sueltos en el atrio (monumentos.ts): los dos yunques colosales de Sahrim, uno con el martillo de forja apoyado y otro con
 * las tenazas y la hoja al rojo (`mon_fr_yunque`), los crisoles de la boca (`mon_fr_brasero`), la cuerda de los quemados que tiran
 * del carro de mineral (`mon_fr_cadena`) y los moldes con las hojas que se enfrían (`mon_fr_moldes`).
 */
const M = MATERIALES;
const TAU = Math.PI * 2;
/** Basalto en columnas: negro pardo, la cara de arriba un poco más clara y gastada, las juntas finas. */
M.mon_fr_basalto = {
  rampa: ['#060505', '#0e0c0b', '#171412', '#221d1a', '#2d2622', '#3a312b', '#483d35', '#574a40', '#66574b'], ruido: 0.22, escala: 0.22,
  patron: (p, n) => (n[2] > 0.7 ? 0.42 + (ruido(p[0] * 0.1, p[1] * 0.1, 1) - 0.5) * 0.16 : (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.2) - 0.5) * 0.3 + (ruido(p[0] * 0.02, p[1] * 0.02, p[2] * 0.1) > 0.7 ? -0.2 : 0)),
};
/** Basalto quemado, junto a la lava: más negro, con el brillo rojo que le queda en las grietas. */
M.mon_fr_quemado = { rampa: ['#050302', '#0c0605', '#160a07', '#22100a', '#30160c', '#401e10'], ruido: 0.3, escala: 0.2, patron: (p, n) => (n[2] > 0.7 ? 0.2 : 0) + (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08) - 0.5) * 0.3 };
/** La lava: corre al blanco en el medio y se enfría en costra negra a los lados. */
/** Basalto junto a la lava: el canto encendido de naranja por el resplandor del río. */
M.mon_fr_brillo = { rampa: ['#1a0804', '#2c120a', '#401c10', '#562816', '#6e361c', '#884624', '#a2582e'], ruido: 0.22, escala: 0.22, emite: true, patron: (p, n) => (n[2] > 0.7 ? 0.2 : -0.1) + (ruido(p[0] * 0.05, p[1] * 0.05, p[2] * 0.2) - 0.5) * 0.24 };
M.mon_fr_humo = { rampa: ['#0a0807', '#14100e', '#1e1916', '#29221e', '#352c27', '#423731'], ruido: 0.5, escala: 0.08 };
M.mon_fr_lava = { rampa: ['#2a0602', '#5a0e03', '#8c1c04', '#c03406', '#e8580c', '#ff8a1e', '#ffbe4a', '#ffe8a0'], ruido: 0.5, escala: 0.18, emite: true, patron: (p) => (ruido(p[0] * 0.06, p[1] * 0.06, 1) > 0.62 ? -0.45 : (ruido(p[0] * 0.2, p[1] * 0.2, 3) - 0.5) * 0.4) };
/** La brasa de Ozmaren: el cristal que arde. */
M.mon_fr_brasa = { rampa: ['#3a0804', '#7a1406', '#c0280a', '#ee5214', '#ff8a2e', '#ffc066', '#fff0c8'], ruido: 0.3, escala: 0.3, emite: true };
M.mon_fr_hierro = { rampa: ['#070606', '#100e0d', '#1b1816', '#28231f', '#37302a', '#473e35', '#5a4e43'], ruido: 0.3, escala: 0.5, brillo: 0.35, patron: (p) => (ruido(p[0] * 0.3, p[1] * 0.3, p[2] * 0.3) > 0.72 ? 0.12 : 0) + (ruido(p[0] * 0.04, p[1] * 0.04, p[2] * 0.04) > 0.68 ? -0.14 : 0) };
M.mon_fr_oxido = { rampa: ['#120604', '#24100a', '#3a1a10', '#542716', '#6e351d', '#874426'], ruido: 0.4, escala: 0.4 };
/** Bronce de los brazos, con el verdín en lo que no toca el calor. */
M.mon_fr_bronce = {
  rampa: ['#120a04', '#24170a', '#3a2610', '#543818', '#704b20', '#8c602a', '#a87836', '#c49448', '#dcb064'], ruido: 0.2, escala: 0.3, brillo: 0.6,
  patron: (p, n) => (ruido(p[0] * 0.08, p[1] * 0.08, p[2] * 0.08) > 0.72 && n[2] > 0.2 ? -0.22 : 0) + (ruido(p[0] * 0.2, p[1] * 0.2, p[2] * 0.2) - 0.5) * 0.12,
};
M.mon_fr_verdin = { rampa: ['#08140f', '#10241b', '#183628', '#224a37', '#2e5f47', '#3c7558'], ruido: 0.4, escala: 0.3 };
M.mon_fr_escoria = { rampa: ['#060504', '#0d0a08', '#16110d', '#201913', '#2b2119'], ruido: 0.6, escala: 0.4 };
const BA = 'mon_fr_basalto', QU = 'mon_fr_quemado', LA = 'mon_fr_lava', HI = 'mon_fr_hierro', OX = 'mon_fr_oxido', ES = 'mon_fr_escoria';

/** Columna de basalto de seis caras, de `z0` a `z1`, radio `r`, con el canto de arriba biselado y un giro propio. */
function columna(g: G, x: number, y: number, z0: number, z1: number, r: number, mat: string, giro: number, tono = 0) {
  const anillo = (z: number, rr: number) => Array.from({ length: 6 }, (_, i) => { const t = (i / 6) * TAU + giro; return [x + Math.cos(t) * rr, y + Math.sin(t) * rr, z] as V3; });
  g.poli([...anillo(z0, r), ...anillo(z1 - 2, r)], { mat, tono });
  g.poli([...anillo(z1 - 2.2, r), ...anillo(z1, r * 0.84)], { mat, tono: tono + 0.04 });
}

// ================================================================== la obra
function armar(F: G, _v: string, f: number) {
  const a = F.a, p = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
  // ------------------------------------------------------------ el cono de basalto columnar: columnas altas y apretadas que se juntan
  // en grupos del mismo alto (paredes y escalones netos, la cara de arriba plana y clara), un cono empinado y dos ríos de lava
  // anchos que bajan serpenteando del cráter al pie entre paredes de columnas, con su costra y el resplandor en las de al lado
  const UC = -70, R = 214, CR = 44, ESC = 34;
  const perfil = (r: number) => (r < CR ? 430 : 470 * Math.max(0, 1 - (r - CR) / (R - CR)) + 26);
  const rios = [{ ang: 2.5, ser: 0.16, f: 1.3 }, { ang: 0.62, ser: -0.14, f: 1.1 }];
  const centroRio = (k: number, r: number) => { const t = rios[k].ang + Math.sin(r * 0.024 * rios[k].f + k) * rios[k].ser; return [Math.cos(t) * r, UC + Math.sin(t) * r, t] as const; };
  const distRio = (v: number, u: number) => { const r = Math.hypot(v, u - UC); if (r < CR + 6) return [1e9, -1] as const; let best = 1e9, kk = -1; for (let k = 0; k < rios.length; k++) { const [cv, cu] = centroRio(k, r); const d = Math.hypot(cv - v, cu - u); if (d < best) { best = d; kk = k; } } return [best, kk] as const; };
  const enBoca = (v: number, u: number) => Math.abs(v) < 118 && u > 40;
  const S = 22, RH = 12.8;
  for (let fila = -16; fila <= 16; fila++) for (let col = -16; col <= 16; col++) {
    const v = col * S + (fila & 1 ? S / 2 : 0), u = UC + fila * S * 0.866, r = Math.hypot(v, u - UC);
    if (u > 300 - Math.abs(v) - 10 || u < -490 + Math.abs(v)) continue;
    const boca = enBoca(v, u); if (boca && u > 206) continue;
    if (r > R && !boca) continue;
    const [dr] = distRio(v, u); if (!boca && dr < 22) continue;
    // el alto: el perfil del cono escalonado en gradas netas, y el grupo (un ruido de baja frecuencia) decide si sube o baja una grada entera
    let h0 = boca ? Math.max(perfil(Math.min(r, R)), 250 - Math.abs(v) * 0.75 - Math.max(0, u - 120) * 0.9) : perfil(r);
    h0 += (ruido(v * 0.018 + 3, u * 0.018, 7) - 0.5) * 70;
    const h = Math.max(ESC, Math.round(h0 / ESC) * ESC + (a.r() < 0.15 ? -ESC * 0.35 : 0));
    const cerca = !boca && dr < 40, mat = r < CR + 26 ? QU : cerca ? 'mon_fr_brillo' : BA;
    columna(F, v, u, 0, h, RH, mat, 0, (a.r() - 0.5) * 0.06 + (cerca ? (40 - dr) / 40 * 0.2 : 0));
  }
  // los ríos: la cinta de lava ancha y seguida (tramos que siguen la ladera), al blanco en el medio, naranja y la costra negra en los bordes
  for (let k = 0; k < rios.length; k++) {
    let prev: [number, number, number, number] | null = null;
    for (let r = CR + 2; r <= R + 30; r += 9) {
      const [v, u, t] = centroRio(k, r), z = Math.max(1.5, perfil(Math.min(r, R)) * 0.82 - 18 - Math.max(0, r - R) * 2), nx = -Math.sin(t), ny = Math.cos(t);
      if (u > 300 - Math.abs(v) - 12) break;
      if (prev) {
        const [pv, pu, pz, pt] = prev, pnx = -Math.sin(pt), pny = Math.cos(pt);
        for (const [w, mat, dz, tono] of [[24, QU, 0, -0.05], [17, LA, 1.2, 0.05], [8, 'mon_fr_brasa', 2, 0.12]] as [number, string, number, number][])
          F.poli([[pv - pnx * w, pu - pny * w, pz + dz], [pv + pnx * w, pu + pny * w, pz + dz], [v - nx * w, u - ny * w, z + dz], [v + nx * w, u + ny * w, z + dz], [pv - pnx * w, pu - pny * w, pz + dz + 2], [pv + pnx * w, pu + pny * w, pz + dz + 2], [v - nx * w, u - ny * w, z + dz + 2], [v + nx * w, u + ny * w, z + dz + 2]], { mat, tono: tono + (1 - r / R) * 0.15 + p * 0.05 });
      }
      prev = [v, u, z, t];
    }
    // el charco al pie, con su costra
    const [v, u, t] = centroRio(k, R + 24); F.elip(v, u, 1, 44, 30, 3, { mat: LA, tono: 0.12, giro: (t * 180) / Math.PI }); F.elip(v, u, 0.4, 58, 42, 2, { mat: QU, giro: (t * 180) / Math.PI });
  }
  // ------------------------------------------------------------ el cráter: el pozo de lava, la brasa de Ozmaren y la columna de humo
  {
    F.cil(0, UC, 400, CR - 2, 34, { mat: LA, tono: 0.2 + p * 0.1 }); F.cil(0, UC, 404, CR - 14, 32, { mat: 'mon_fr_brasa', tono: 0.1 });
    const B = F.sub(0, UC, 420, 18, 10);
    B.poli([[-18, -14, 0], [16, -16, 0], [18, 14, 0], [-14, 18, 0], [-10, -8, 70], [12, -6, 64], [10, 10, 72], [-8, 12, 66], [2, 0, 104]], { mat: 'mon_fr_brasa', tono: 0.15 + p * 0.1 });
    B.poli([[18, -6, 0], [34, -10, 0], [36, 8, 0], [20, 10, 0], [28, -2, 50]], { mat: 'mon_fr_brasa', tono: 0.05 });
    B.poli([[-20, 4, 0], [-34, -4, 0], [-30, 16, 0], [-18, 16, 0], [-30, 6, 40]], { mat: 'mon_fr_brasa', tono: 0 });
    for (let k = 0; k < 9; k++) { const t = (k / 9) * TAU; columna(F, Math.cos(t) * (CR + 4), UC + Math.sin(t) * (CR + 4), 0, 448 + (k % 3) * ESC * 0.5, RH, QU, t, -0.04); }
    // la columna de humo y ceniza que sube torcida, oscura, con la panza encendida por la brasa
    for (let k = 0; k < 7; k++) for (let j = 0; j < 3; j++) { const z = 462 + k * 20 + (a.r() - 0.5) * 10, dx = Math.sin(k * 0.7) * 12 + k * 5 + (j - 1) * (10 + k * 3) + (a.r() - 0.5) * 8, rr = 14 + k * 3 + a.r() * 6; F.elip(dx, UC - k * 4 + (a.r() - 0.5) * 16, z, rr, rr * 0.85, rr * 0.8, { mat: 'mon_fr_humo', tono: k < 2 ? 0.25 - j * 0.05 : -0.03 * k + (a.r() - 0.5) * 0.06 }); }
  }
  // ------------------------------------------------------------ las dos chimeneas de hierro que salen del cono a los lados de la boca
  for (const s of [-1, 1]) {
    const x = s * 92, u = 30, h = s < 0 ? 380 : 330;
    F.cil(x, u, 0, 24, h, { mat: HI, r1: 17 });
    for (let k = 0; k < 7; k++) F.cil(x, u, 30 + k * ((h - 60) / 6), 25 - k * 1.1, 6, { mat: OX, tono: 0.05 });
    F.cil(x, u, h, 17, 14, { mat: HI, r1: 28 }); F.cil(x, u, h + 14, 28, 6, { mat: HI, tono: 0.06 });
    F.cil(x, u, h + 15, 22, 5, { mat: LA, tono: 0.25 + p * 0.1 });
    for (let k = 0; k < 5; k++) llama(F, x + (a.r() - 0.5) * 20, u + (a.r() - 0.5) * 20, h + 20, 7, 34 + a.r() * 22, f, 4, k + 30);
    // los tirantes de hierro que la atan al cono
    for (const dz of [0.4, 0.7]) F.palo([x, u, h * dz], [x - s * 40, u - 40, h * dz + 30], 2.4, { mat: HI });
  }
  // ------------------------------------------------------------ la boca de la fragua: el arco de hierro remachado en la base del cono
  const UF = 214;
  {
    // el macizo de basalto quemado que sostiene la boca, con las columnas que se abren a los lados como dientes
    for (let k = 0; k < 9; k++) { const t = (k / 8) * Math.PI, v = Math.cos(t) * 96, u = 150 + Math.sin(t) * 40 - 20, h = 140 + Math.sin(t) * 60 + (a.r() - 0.5) * 24; columna(F, v, u, 0, h, 18, k % 3 ? BA : QU, a.r(), (a.r() - 0.5) * 0.08); }
    // el arco de hierro: tres anillos de chapas remachadas, la garganta al blanco y la lengua de lava que sale por el umbral
    const AR = 44, ZA = 96;
    F.caja(0, UF - 36, 0, AR * 2, 90, ZA, { mat: QU, resta: true }); F.sub(0, UF - 36, ZA, 0, 90, 'x').cil(0, 0, -45, AR, 90, { mat: QU, resta: true });
    F.caja(0, 196, 0, AR * 2 + 40, 40, 16, { mat: QU, resta: true });
    for (let r = 0; r < 3; r++) { const R0 = AR + 6 + r * 11, uu = UF - 2 - r * 6; aro(F.sub(0, uu, 0), 0, ZA, R0, 5.6, r === 1 ? OX : HI, 0, Math.PI, 26); for (const sx of [-1, 1]) F.caja(sx * R0, uu, 0, 11, 11, ZA, { mat: r === 1 ? OX : HI }); for (let k = 0; k < 9; k++) { const t = (k / 8) * Math.PI; F.esf(Math.cos(t) * R0, uu + 5.4, ZA + Math.sin(t) * R0, 1.6, { mat: HI, tono: 0.15 }); } }
    // adentro: el resplandor que va de rojo en las paredes a naranja y al blanco al fondo, la forja con su fuego, las cadenas al trasluz
    for (let i = 0; i < 4; i++) { const uu = UF - 20 - i * 14, w = AR * 2 - 6 - i * 4; F.caja(-w / 2 - 1, uu, 0, 3, 14, ZA + AR - 10 - i * 6, { mat: i < 2 ? 'mon_fr_brillo' : LA, tono: -0.1 + i * 0.08 }); F.caja(w / 2 + 1, uu, 0, 3, 14, ZA + AR - 10 - i * 6, { mat: i < 2 ? 'mon_fr_brillo' : LA, tono: -0.1 + i * 0.08 }); }
    F.caja(0, UF - 79, 0, AR * 2, 2, ZA + AR, { mat: 'mon_fr_brasa', tono: 0.2 + p * 0.1 });
    F.caja(0, UF - 70, 0, AR * 1.4, 6, 34, { mat: HI, tono: -0.1 }); F.caja(0, UF - 70, 34, AR * 1.2, 7, 4, { mat: LA, tono: 0.2 }); for (let k = 0; k < 4; k++) llama(F, -20 + k * 13, UF - 70, 38, 6, 26 + a.r() * 10, f, 4, k + 50);
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) cadena(F, [sx * (14 + k * 14), UF - 60, ZA + AR - 8], [sx * (16 + k * 12), UF - 58, 60 - k * 20], 3, HI, 1.6);
    F.caja(0, UF - 36, 0.5, AR * 2 - 6, 70, 1.6, { mat: LA, tono: 0.05 });
    F.poli([[-20, UF - 50, 0.6], [20, UF - 50, 0.6], [-24, UF + 30, 0.6], [24, UF + 30, 0.6], [-20, UF - 50, 2], [20, UF - 50, 2], [-24, UF + 30, 1.2], [24, UF + 30, 1.2]], { mat: LA, tono: 0.15 });
    // la clave: la cara de Sahrim en hierro, con los ojos al rojo, y la brasa de Ozmaren grabada encima
    { const c = F.sub(0, UF + 2, ZA + AR + 30); c.elip(0, 0, 0, 20, 8, 24, { mat: HI, tono: 0.04 }); for (const e of [-1, 1]) { c.elip(e * 7, 6.4, 4, 3.4, 1.4, 2, { mat: 'mon_fr_brasa', tono: 0.1 }); c.palo([e * 14, 2, 14], [e * 30, 0, 34], 4, { mat: HI, r1: 1 }); } c.poli([[-2, 6, 0], [2, 6, 0], [-2, 6, -8], [2, 6, -8], [-3, 11, -8], [3, 11, -8]], { mat: HI }); c.caja(0, 7, -14, 12, 2, 2, { mat: 'mon_fr_brasa', tono: -0.1 }); for (let k = 0; k < 8; k++) c.palo([-8 + k * 2.3, 6, -18], [-9 + k * 2.6, 7, -30 - (k % 2) * 4], 1.4, { mat: HI, r1: 0.6 }); }
    // las cadenas gruesas que cuelgan del arco y los ganchos
    for (const s of [-1, 1]) cadena(F, [s * 70, UF + 2, ZA + 40], [s * 36, UF + 10, ZA + 4], 10, HI, 2.4);
    // el yunque de la boca: el yunque grande de Sahrim, a un costado, con la hoja al rojo y el martillo
    { const c = F.sub(-70, UF + 18, 0, -20); bloque(c, 0, 0, 0, 40, 30, 16, { mat: ES, b: 2, j: 1 }); c.poli([[-18, -9, 16], [18, -9, 16], [-18, 9, 16], [18, 9, 16], [-24, -11, 34], [30, -10, 34], [-24, 11, 34], [30, 10, 34]], { mat: HI, tono: 0.06 }); c.poli([[30, -6, 34], [30, 6, 34], [30, -6, 26], [30, 6, 26], [46, 0, 33]], { mat: HI }); c.caja(4, 0, 34, 34, 4, 1.2, { mat: 'mon_fr_brasa', tono: 0.1 }); c.palo([-20, 14, 0], [-6, 10, 40], 2, { mat: 'madera' }); c.caja(-6, 10, 40, 12, 8, 8, { mat: HI }); }
  }
  // ------------------------------------------------------------ el pie: la escoria, las brasas y el piso quemado
  cascotes(F, 14, 120, 20, ES, 0, 170, 4);
  for (let k = 0; k < 10; k++) { const v = (a.r() < 0.5 ? -1 : 1) * (120 + a.r() * 80), u = 120 + a.r() * 60 - Math.max(0, Math.abs(v) - 150); F.elip(v, u, 0.4, 14 + a.r() * 14, 10 + a.r() * 8, 2, { mat: k % 3 ? ES : LA, tono: k % 3 ? 0 : -0.2, giro: a.r() * 180 }); }
  void figuraVelada; void calavera; void bloque;
  return {
    der: { c: [0, UF - 40, 50] as V3, r: 110 + p * 16, color: '#ff7a24' },
    medio: { c: [0, UC, 460] as V3, r: 160 + p * 24, color: '#ff5a1c' },
    izq: { c: [-92, 30, 400] as V3, r: 90 + p * 14, color: '#ff8a30' },
    atras_d: { c: [92, 30, 350] as V3, r: 90 + p * 14, color: '#ff8a30' },
  };
}
registrarMonumento({
  id: 'mon_fragua', nombre: ['La Fragua de Ozmaren', 'Ozmaren\'s Forge'], tema: 'infierno', cuadros: 1,
  piezas: [{ fr: 'atras', dx: -16, dy: -16, w: 12, h: 12 }, { fr: 'atras_i', dx: -16, dy: 0, w: 12, h: 20 }, { fr: 'atras_d', dx: 0, dy: -16, w: 20, h: 12 }, { fr: 'medio', dx: 0, dy: 0, w: 20, h: 20 }, { fr: 'izq', dx: 0, dy: 12, w: 20, h: 4 }, { fr: 'der', dx: 12, dy: 0, w: 4, h: 20 }],
  puerta: [10, 10],
  armar: (F, v, f) => { const r = armar(F, v, f); const o: Record<string, { c: V3; r: number; color: string }> = {}; for (const [k, l] of Object.entries(r)) { const [x, y] = deAvenida(l.c[0], l.c[1]); o[k] = { ...l, c: [x, y, l.c[2]] }; } return o; },
});

// ================================================================== los yunques colosales de Sahrim
/** Un yunque del tamaño de una casa sobre su cepa de basalto escalonada: el cuerpo de hierro negro con la cintura, el cuerno
 *  largo, la mesa clara y gastada, el agujero de la tajadera; uno con el martillo de forja apoyado (cabeza de dos bocas, mango de
 *  roble con flejes), el otro con las tenazas que muerden una hoja al rojo que gotea sobre la mesa. Escoria y brasas al pie. */
function yunque(g: G, tenazas: boolean) {
  const a = g.a;
  // la cepa: tres gradas de basalto, la de arriba quemada, con la escoria y las brasas alrededor
  for (let i = 0; i < 3; i++) bloque(g, 0, 0, i * 12, 120 - i * 18, 84 - i * 14, 12, { mat: i === 2 ? QU : BA, b: 2, j: 1, tono: -i * 0.03 });
  for (let k = 0; k < 8; k++) { const t = (k / 8) * TAU; g.elip(Math.cos(t) * 64, Math.sin(t) * 48, 0.5, 14 + a.r() * 10, 10, 3, { mat: k % 3 ? ES : LA, tono: k % 3 ? 0 : -0.1, giro: (t * 180) / Math.PI }); }
  const Y = g.sub(0, 0, 36, 0);
  // el pie ancho, la cintura y la mesa: en poliedros, cantos netos
  Y.poli([[-40, -26, 0], [40, -26, 0], [-40, 26, 0], [40, 26, 0], [-24, -16, 26], [24, -16, 26], [-24, 16, 26], [24, 16, 26]], { mat: HI });
  Y.poli([[-24, -16, 26], [24, -16, 26], [-24, 16, 26], [24, 16, 26], [-20, -14, 46], [20, -14, 46], [-20, 14, 46], [20, 14, 46]], { mat: HI, tono: -0.04 });
  Y.poli([[-20, -14, 46], [20, -14, 46], [-20, 14, 46], [20, 14, 46], [-46, -22, 70], [40, -22, 70], [-46, 22, 70], [40, 22, 70]], { mat: HI, tono: 0.02 });
  Y.poli([[-46, -22, 70], [40, -22, 70], [-46, 22, 70], [40, 22, 70], [-48, -23, 82], [42, -23, 82], [-48, 23, 82], [42, 23, 82]], { mat: HI, tono: 0.05 });
  // el cuerno: se afina hacia la punta, redondeado abajo
  Y.poli([[40, -20, 70], [40, 20, 70], [40, -21, 82], [40, 21, 82], [92, -1.5, 80], [92, 1.5, 80], [80, -6, 74], [80, 6, 74]], { mat: HI, tono: 0.03 });
  // la mesa: acero claro, gastado al centro, con el agujero cuadrado y el redondo
  Y.caja(-3, 0, 82, 86, 44, 1.4, { mat: 'acero', tono: 0.08 }); Y.caja(-38, 0, 82.4, 6, 6, 1.4, { mat: 'negro' }); Y.cil(-28, 0, 82.4, 2.4, 1.4, { mat: 'negro' });
  for (let k = 0; k < 10; k++) Y.esf(-40 + a.r() * 76, (a.r() - 0.5) * 40, 83.6, 1.2 + a.r() * 1.4, { mat: k % 2 ? 'mon_fr_brasa' : ES, tono: -0.1 });
  if (!tenazas) {
    // el martillo de forja apoyado contra el yunque: la cabeza de dos bocas en el piso, el mango de roble con sus flejes, ladeado
    const Mm = g.sub(-74, 18, 0, 20); Mm.caja(0, 0, 0, 40, 22, 22, { mat: HI, tono: 0.04 }); Mm.caja(-21, 0, 1, 3, 23, 20, { mat: 'acero', tono: 0.15 }); Mm.caja(21, 0, 1, 3, 23, 20, { mat: 'acero', tono: 0.15 });
    for (const x of [-8, 8]) Mm.caja(x, 0, 0, 2, 22.6, 22.6, { mat: OX });
    Mm.palo([0, 0, 18], [4, -46, 150], 4.4, { mat: 'madera', r1: 3.8 }); for (const t of [0.05, 0.35, 0.85]) Mm.cil(4 * t, -46 * t, 18 + 132 * t, 5, 4, { mat: HI, eje: [0.025, -0.33, 0.94] });
  } else {
    // las tenazas: las dos patas largas cruzadas, la boca que muerde una hoja al rojo tendida sobre la mesa y que gotea por el canto
    const T = Y.sub(0, 0, 84); T.poli([[-30, -2, 0], [36, -2, 0], [-30, 2, 0], [36, 2, 0], [-30, -1, 2], [40, -0.5, 1.6], [-30, 1, 2], [40, 0.5, 1.6]], { mat: 'mon_fr_brasa', tono: 0.15 }); T.palo([-30, 0, 1], [-40, 0, 1], 1.6, { mat: HI });
    for (const e of [-1, 1]) { T.palo([-40, e * 2, 2], [-60, e * 14, 30], 2, { mat: HI }); T.palo([-60, e * 14, 30], [-110, e * 30, 60], 2, { mat: HI }); }
    for (let i = 0; i < 4; i++) T.palo([20 + i * 5, 23, -1], [20 + i * 5, 24, -14 - i * 4], 1, { mat: LA, r1: 0.4 });
    for (let i = 0; i < 4; i++) g.elip(20 + i * 5, 42, 0.6, 5, 4, 1, { mat: LA, tono: 0.1 });
  }
}
registrar({
  id: 'mon_fr_yunque', nombre: ['Yunque de Sahrim', 'Anvil of Sahrim'], tema: 'infierno', variantes: ['martillo', 'tenazas'], huella: [6, 6], bloquea: true,
  armar: (v, _f, a) => { const { ps, g } = raiz(a, -45); yunque(g.sub(0, 0, 0, v === 'tenazas' ? 0 : 180).esc(1.3), v === 'tenazas'); bajoTierra(ps); return ps; },
});

// ================================================================== los crisoles de la boca
registrar({
  id: 'mon_fr_brasero', nombre: ['Crisol de la fragua', 'Forge crucible'], tema: 'infierno', variantes: ['encendido'], huella: [2, 2], bloquea: true, cuadros: 4, t: 3,
  armar: (_v, f, a) => {
    const { ps, g } = raiz(a), pp = 0.5 + 0.5 * Math.sin((f / 4) * TAU);
    for (let k = 0; k < 3; k++) { const t = (k / 3) * TAU; g.palo([Math.cos(t) * 12, Math.sin(t) * 12, 0], [Math.cos(t) * 7, Math.sin(t) * 7, 30], 2, { mat: HI }); }
    g.cil(0, 0, 28, 8, 16, { mat: HI, r1: 13 }); g.elip(0, 0, 44, 12, 12, 2, { mat: LA, tono: 0.2 + pp * 0.1 });
    for (let k = 0; k < 4; k++) llama(g, (a.r() - 0.5) * 7, (a.r() - 0.5) * 7, 44, 5, 22 + a.r() * 7, f, 4, k);
    g.elip(0, 0, 0.4, 16, 16, 1.4, { mat: ES });
    bajoTierra(ps); return { piezas: ps, resplandor: { c: [0, 0, 58] as V3, r: 64 + pp * 10, color: '#ff8a30' } };
  },
});

// ================================================================== la cuerda de los quemados que tiran del carro de mineral
registrar({
  id: 'mon_fr_cadena', nombre: ['La cuerda de los quemados', 'The burned chain gang'], tema: 'infierno', variantes: ['tirando'], huella: [6, 6], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -30);
    // el carro de mineral, ladeado, con la rueda partida y el mineral que brilla
    bloque(g, 26, 0, 8, 34, 26, 20, { mat: 'madera', b: 1, j: 0.5, giro: 6 }); for (const e of [-1, 1]) g.sub(26 + e * 12, 14, 8, 0, 90, 'x').cil(0, 0, -2, 8, 3, { mat: HI });
    for (let k = 0; k < 8; k++) g.elip(20 + a.r() * 14, (a.r() - 0.5) * 18, 28 + a.r() * 4, 5, 4, 4, { mat: k % 3 ? ES : 'mon_fr_brasa', tono: k % 3 ? 0 : -0.2 });
    // los cuatro quemados, encorvados, atados a la cadena; uno caído
    for (let i = 0; i < 4; i++) { const x = 4 - i * 16, cae = i === 2; if (cae) { figuraVelada(g.sub(x, 4, 2, 0, 80, 'y'), 30, { mat: QU, pose: 'pie', tono: 0.1 }); continue; } figuraVelada(g.sub(x, 0, 0, -90, -16, 'y'), 32, { mat: QU, pose: 'pie', tono: 0.1 }); }
    cadena(g, [10, 0, 22], [-50, 0, 24], 4, HI, 1.4); cadena(g, [-50, 0, 24], [-64, 6, 0.6], 2, HI, 1.4);
    calavera(g.sub(-30, 14, 2, 50), 3.2, 'mu_hueso', true, -0.1);
    g.elip(-10, 0, 0.3, 50, 18, 1.2, { mat: ES });
    bajoTierra(ps); return ps;
  },
});

// ================================================================== los moldes con las hojas que se enfrían
registrar({
  id: 'mon_fr_moldes', nombre: ['Los moldes de Sahrim', 'Sahrim\'s molds'], tema: 'infierno', variantes: ['enfriando'], huella: [5, 5], bloquea: true,
  armar: (_v, _f, a) => {
    const { ps, g: g0 } = raiz(a), g = g0.sub(0, 0, 0, -45);
    for (let i = 0; i < 4; i++) {
      const x = -24 + i * 16; bloque(g, x, 0, 0, 13, 52, 8, { mat: ES, b: 1, j: 0.5 });
      g.poli([[x - 2.6, -22, 8.2], [x + 2.6, -22, 8.2], [x - 2.6, 20, 8.2], [x + 2.6, 20, 8.2], [x - 1.6, -22, 9.4], [x + 1.6, -22, 9.4], [x - 0.4, 24, 9], [x + 0.4, 24, 9]], { mat: i % 2 ? 'mon_fr_brasa' : HI, tono: i % 2 ? 0.05 : 0.1 });
    }
    g.cil(36, -10, 0, 12, 18, { mat: HI, r1: 14 }); g.elip(36, -10, 18, 12, 12, 1.6, { mat: LA, tono: 0.2 });
    cascotes(g, 8, 30, 20, ES, 0, 30, 3);
    for (let k = 0; k < 3; k++) g.palo([-40 + k * 4, 26, 0], [-34 + k * 6, 20, 30], 1.2, { mat: HI });
    bajoTierra(ps); return ps;
  },
});
void ruido;
