import { registrar, type Arma, type Pieza, type V3 } from '../objeto';

// Una pieza grande y única por acto (se ve una o dos veces por mundo abierto, de lejos se reconoce dónde estás) y el
// aderezo de los muros de las mazmorras de obra: contrafuertes y derrumbes del estilo de cada una.
// Usan la piedra de los riscos (bordes.ts) y los materiales del decorado (decorado.ts).

const PI = Math.PI;
const suelo = (a: Arma) => a.caja(0, 0, -80, 900, 900, 80, { mat: 'roca', resta: true });
const blq = (a: Arma, x: number, y: number, z: number, w: number, d: number, h: number, mat: string, giro = 0) => a.caja(x, y, z, w, d, h, { mat, giro: giro + (a.r() - 0.5) * 5, tono: (a.r() - 0.5) * 0.12 });
/** Peña suelta. */
const pena = (a: Arma, x: number, y: number, r: number, mat: string) => a.elipsoide(x, y, r * 0.35, r, r * 0.85, r * 0.7, { mat, giro: a.r() * 180, tono: (a.r() - 0.5) * 0.12 });

registrar(
  {
    id: 'acto_hito', nombre: ['Hito del acto', 'Act landmark'], tema: 'comun',
    variantes: ['a1_cruz', 'a2_coloso', 'a3_idolo', 'a4_tumulo', 'a5_costillar', 'a6_ancla', 'a7_anillo', 'a1_campanario', 'a1_roble', 'a2_pozo', 'a2_obelisco'], huella: [4, 4], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      if (v === 'a1_cruz') {
        // cruz de término del páramo: gradas, fuste alto, brazos con nudo, una soga colgando y musgo
        const m = 'bor_paramo';
        for (let i = 0; i < 3; i++) ps.push(blq(a, 0, 0, i * 5, 40 - i * 9, 40 - i * 9, 5, m));
        ps.push(a.caja(0, 0, 15, 8, 7, 78, { mat: m })); ps.push(a.caja(0, 0, 66, 40, 7, 9, { mat: m, tono: 0.04 }));
        ps.push(a.cilindro(0, 0, 60, 12, 5, { mat: m, eje: [0, 1, 0] as V3, tono: -0.06 })); ps.push(a.cilindro(0, 0, 60, 7.5, 6, { mat: 'negro', eje: [0, 1, 0] as V3 }));
        ps.push(a.palo([15, 0, 66], [15.5, 1, 44], 0.7, { mat: 'dec_rama' })); ps.push(a.cilindro(15.5, 1, 39, 2.4, 5, { mat: 'dec_rama', r1: 1.6 }));
        for (const [x, y, z] of [[0, 0, 93], [-15, 0, 75], [8, 6, 15], [-12, -8, 10]]) ps.push(a.elipsoide(x, y, z, 6, 5, 1.6, { mat: 'bor_musgo', giro: a.r() * 180 }));
        for (let i = 0; i < 6; i++) { const g = a.r() * 2 * PI; ps.push(pena(a, Math.cos(g) * 30, Math.sin(g) * 26, 5 + a.r() * 4, m)); }
      } else if (v === 'a1_campanario') {
        // el campanario caído del camposanto (las campanas son de Santa Oria): la torre partida a media altura, con su vano
        // ciego mirando al camino, y la campana en el suelo, de lado, rajada, con la soga todavía atada al yugo
        const m = 'bor_paramo';
        ps.push(blq(a, -8, -6, 0, 34, 34, 8, m)); ps.push(a.caja(-8, -6, 8, 26, 26, 52, { mat: m }));
        for (const [x, y] of [[-21, -19], [5, -19], [-21, 7], [5, 7]]) ps.push(a.caja(x, y, 8, 6, 6, 56, { mat: m, tono: -0.06 }));
        ps.push(a.caja(-8, 7.2, 30, 11, 2, 20, { mat: 'negro' })); ps.push(a.cilindro(-8, 7.2, 50, 5.5, 2, { mat: 'negro', eje: [0, 1, 0] as V3 }));
        // el corte de la rotura: dientes de sillares a distintas alturas
        for (let i = 0; i < 7; i++) ps.push(blq(a, -19 + (i % 4) * 7.5, -15 + Math.floor(i / 4) * 16, 60, 7, 7, 4 + a.r() * 9, m));
        // el yugo caído y la campana tumbada
        ps.push(a.palo([10, 16, 3], [30, 4, 4], 2.6, { mat: 'madera_vieja' }));
        // la campana de lado: hombro redondo, falda que se abre, el labio grueso y la boca negra mirando al camino
        const E: V3 = [0.75, -0.6, 0.08], el = Math.hypot(...E), e: V3 = [E[0] / el, E[1] / el, E[2] / el], c0: V3 = [14, 16, 13];
        ps.push(a.elipsoide(c0[0], c0[1], c0[2], 9.5, 9.5, 9.5, { mat: 'bronce' }));
        ps.push(a.cilindro(c0[0], c0[1], c0[2], 9.5, 14, { mat: 'bronce', r1: 14, eje: e }));
        ps.push(a.cilindro(c0[0] + e[0] * 13, c0[1] + e[1] * 13, c0[2] + e[2] * 13, 14.6, 3, { mat: 'bronce', tono: -0.08, eje: e }));
        ps.push(a.cilindro(c0[0] + e[0] * 6, c0[1] + e[1] * 6, c0[2] + e[2] * 6, 7, 11, { mat: 'negro', r1: 12, eje: e }));
        ps.push(a.cilindro(c0[0] - e[0] * 9, c0[1] - e[1] * 9, c0[2] - e[2] * 9, 3, 4, { mat: 'bronce', tono: -0.15, eje: e }));
        ps.push(a.palo([c0[0] + 2, c0[1] + 8, c0[2] + 7], [c0[0] + 8, c0[1] + 12, c0[2] - 2], 0.7, { mat: 'negro' }));
        let p: V3 = [10, 16, 4]; for (let k = 0; k < 6; k++) { const q: V3 = [p[0] - 4 - a.r() * 3, p[1] + 3 + a.r() * 2, 1]; ps.push(a.palo(p, q, 0.8, { mat: 'cuerda' })); p = q; }
        for (let i = 0; i < 9; i++) { const g = a.r() * 2 * PI; ps.push(pena(a, -8 + Math.cos(g) * (24 + a.r() * 12), -6 + Math.sin(g) * (22 + a.r() * 10), 3.5 + a.r() * 4, m)); }
        for (const [x, y, z] of [[-14, -2, 64], [0, -14, 62], [-21, 7, 64], [-30, -2, 2]]) ps.push(a.elipsoide(x, y, z, 6, 5, 1.6, { mat: 'bor_musgo', giro: a.r() * 180 }));
      } else if (v === 'a1_roble') {
        // el roble de las sogas del Bosque de los Ahorcados: un tronco enorme y hueco, ramas como brazos, y las sogas vacías
        // que esperan; a sus pies un cerco de piedras con nombres raspados
        const m = 'corteza_muerta';
        ps.push(a.palo([0, 0, -2], [3, -2, 40], 13, { mat: m, r1: 9 })); ps.push(a.palo([3, -2, 40], [-2, -4, 78], 9, { mat: m, r1: 5 }));
        ps.push(a.elipsoide(3, 10.5, 16, 5, 3.2, 9, { mat: 'negro' }));
        for (let i = 0; i < 6; i++) { const g = (i / 6) * 2 * PI + 0.3; ps.push(a.palo([Math.cos(g) * 8, Math.sin(g) * 8, 4], [Math.cos(g) * 24, Math.sin(g) * 22, -2], 5, { mat: m, r1: 1.5 })); }
        const ramas: [V3, V3][] = [];
        for (const [g, z0, L, z1] of [[0.2, 52, 40, 64], [2.6, 58, 34, 74], [4.3, 46, 30, 58], [1.4, 70, 26, 88]] as [number, number, number, number][]) {
          const b: V3 = [2 + Math.cos(g) * 4, -3 + Math.sin(g) * 4, z0], e: V3 = [Math.cos(g) * L, Math.sin(g) * L, z1];
          ps.push(a.palo(b, e, 4.5, { mat: m, r1: 1.6 })); ramas.push([b, e]);
          for (let k = 0; k < 3; k++) { const f = 0.4 + k * 0.25, q: V3 = [b[0] + (e[0] - b[0]) * f, b[1] + (e[1] - b[1]) * f, b[2] + (e[2] - b[2]) * f]; ps.push(a.palo(q, [q[0] + (a.r() - 0.5) * 18, q[1] + (a.r() - 0.5) * 18, q[2] + 6 + a.r() * 10], 1.4, { mat: m, r1: 0.5 })); }
        }
        for (const [b, e] of ramas.slice(0, 3)) for (const f of [0.55, 0.85]) {
          const t: V3 = [b[0] + (e[0] - b[0]) * f, b[1] + (e[1] - b[1]) * f, b[2] + (e[2] - b[2]) * f - 1], n: V3 = [t[0], t[1], t[2] - 16 - a.r() * 8];
          ps.push(a.palo(t, n, 0.6, { mat: 'cuerda' })); ps.push(a.cilindro(n[0], n[1], n[2] - 2.4, 1.1, 2.6, { mat: 'cuerda', r1: 0.9 }));
          for (let q = 0; q < 10; q++) { const g0 = (q / 10) * 2 * PI, g1 = ((q + 1) / 10) * 2 * PI, R = 4.2; ps.push(a.palo([n[0] + Math.sin(g0) * R * 0.7, n[1], n[2] - 2.6 - R + Math.cos(g0) * R], [n[0] + Math.sin(g1) * R * 0.7, n[1], n[2] - 2.6 - R + Math.cos(g1) * R], 0.55, { mat: 'cuerda' })); }
        }
        for (let i = 0; i < 11; i++) { const g = (i / 11) * 2 * PI; if (Math.sin(g) > 0.8) continue; ps.push(a.caja(Math.cos(g) * 36, Math.sin(g) * 32, 0, 5, 4, 7 + a.r() * 6, { mat: 'bor_paramo', giro: (g * 180) / PI + 90 + (a.r() - 0.5) * 20, tono: (a.r() - 0.5) * 0.1 })); }
        for (const [x, y, z] of [[-8, 6, 30], [6, -8, 20], [12, 4, 2], [-14, -10, 1]]) ps.push(a.elipsoide(x, y, z, 6, 5, 1.8, { mat: 'bor_musgo', giro: a.r() * 180 }));
      } else if (v === 'a2_pozo') {
        // el pozo del Oasis Muerto: brocal ancho de sillares sobre barro rajado, la boca negra, la cabria con la cadena sin
        // cubo, y las palmeras que se secaron alrededor, tronchadas
        const m = 'bor_desierto';
        ps.push(a.elipsoide(0, 0, 0, 40, 36, 4, { mat: m, tono: -0.18 }));
        for (let i = 0; i < 9; i++) { const g = a.r() * PI; ps.push(a.caja((a.r() - 0.5) * 60, (a.r() - 0.5) * 54, 3.7, 20 * a.r() + 8, 0.45, 0.4, { mat: 'negro', giro: (g * 180) / PI })); }
        for (let i = 0; i < 14; i++) { const g = (i / 14) * 2 * PI; ps.push(a.caja(Math.cos(g) * 15, Math.sin(g) * 15, 3, 8, 6, 11 + (i % 3 === 0 ? -4 : 0), { mat: m, giro: (g * 180) / PI + 90, tono: (a.r() - 0.5) * 0.1 })); }
        ps.push(a.cilindro(0, 0, 4, 11, 12, { mat: 'negro' }));
        for (const l of [-1, 1]) ps.push(a.palo([l * 18, -3, 3], [l * 4, -2, 40], 1.8, { mat: 'madera_vieja' }));
        ps.push(a.palo([-8, -2, 36], [8, -2, 36], 1.6, { mat: 'madera_vieja' })); ps.push(a.cilindro(0, -2, 36, 3.4, 9, { mat: 'madera_vieja', eje: [1, 0, 0] as V3, tono: -0.1 }));
        for (let k = 0; k < 7; k++) ps.push(a.cilindro(0.5, -2 + (k % 2) * 0.6, 33 - k * 3.2, 1.2, 2.6, { mat: 'hierro_oxido', eje: k % 2 ? [1, 0, 0.4] as V3 : [0, 1, 0.4] as V3 }));
        for (const [x, y, g, L] of [[-30, 14, 0.6, 46], [28, -18, 2.4, 52], [24, 22, 1.3, 20]] as [number, number, number, number][]) {
          const top: V3 = [x + Math.cos(g) * L * 0.25, y + Math.sin(g) * L * 0.25, L]; ps.push(a.palo([x, y, 2], top, 3.2, { mat: m === 'bor_desierto' ? 'corteza_muerta' : m, r1: 2.2 }));
          if (L > 30) for (let k = 0; k < 4; k++) { const h = (k / 4) * 2 * PI; ps.push(a.palo(top, [top[0] + Math.cos(h) * 14, top[1] + Math.sin(h) * 14, top[2] - 12], 0.9, { mat: 'corteza_muerta', r1: 0.4 })); }
        }
        for (let i = 0; i < 5; i++) { const g = a.r() * 2 * PI; ps.push(pena(a, Math.cos(g) * 30, Math.sin(g) * 28, 3 + a.r() * 3, m)); }
      } else if (v === 'a2_obelisco') {
        // el obelisco del sol de las Ruinas: la base sigue en pie con el disco de bronce del sol medio enterrado delante, y la
        // aguja yace partida en tres tramos que la arena se va tragando
        const m = 'bor_desierto';
        ps.push(blq(a, -18, -12, 0, 22, 22, 6, m)); ps.push(a.caja(-18, -12, 6, 15, 15, 24, { mat: m, tono: 0.04 }));
        for (const [z, h] of [[30, 4], [34, 3]]) ps.push(blq(a, -18, -12, z, 12, 12, h, m));
        for (let i = 0; i < 3; i++) { const f = i / 3, x = -6 + f * 54, y = -4 + f * 30, w = 12 - i * 2.6; ps.push(a.caja(x, y, 0, 18, w, w, { mat: m, giro: 29 + (a.r() - 0.5) * 12, tono: -0.03 + i * 0.03 })); }
        ps.push(a.caja(-6 + 1 * 18 + 10, -4 + 10 + 2, 4, 1.2, 8, 6, { mat: 'negro', giro: 29 }));
        ps.push(a.cilindro(-18, 4, 10, 13, 2.4, { mat: 'bronce', eje: [0, 1, 0.25] as V3 })); ps.push(a.cilindro(-18, 5.4, 10, 5, 1.4, { mat: 'dec_brasa', eje: [0, 1, 0.25] as V3 }));
        for (let i = 0; i < 8; i++) { const g = (i / 8) * 2 * PI; ps.push(a.palo([-18 + Math.cos(g) * 13, 5, 10 + Math.sin(g) * 13], [-18 + Math.cos(g) * 18, 5.6, 10 + Math.sin(g) * 18], 1.2, { mat: 'bronce', r1: 0.3 })); }
        for (const [x, y, r] of [[-30, 10, 18], [10, 18, 14], [36, 6, 20], [-20, 8, 12]]) ps.push(a.elipsoide(x, y, 0, r, r * 0.7, 6, { mat: m, tono: 0.16 }));
      } else if (v === 'a2_coloso') {
        // el coloso tragado por la arena: media cabeza con tocado, la mano abierta más allá, arena montada encima
        const m = 'bor_desierto';
        ps.push(a.elipsoide(-10, 0, 14, 23, 20, 30, { mat: m })); ps.push(a.caja(-10, 0, 34, 50, 30, 12, { mat: m, tono: 0.06 }));
        ps.push(a.caja(-10, 17, 14, 7, 5, 14, { mat: m, tono: -0.1 })); for (const l of [-1, 1]) ps.push(a.caja(-10 + l * 9, 18.5, 26, 8, 2, 3.4, { mat: 'negro' }));
        for (const l of [-1, 1]) ps.push(a.caja(-10 + l * 27, 2, 0, 9, 22, 36, { mat: m, tono: -0.05, incl: l * 8, inclEje: 'y' }));
        ps.push(a.caja(-10, 19.5, 6, 16, 2, 2.6, { mat: 'negro' }));
        ps.push(a.elipsoide(34, 8, 3, 12, 9, 6, { mat: m })); for (let i = 0; i < 4; i++) ps.push(a.palo([30 + i * 4, 12, 6], [28 + i * 5.5, 20, 22 + (i % 2) * 5], 2.6, { mat: m, r1: 1.9 }));
        for (const [x, y, r] of [[-30, 16, 20], [14, 20, 16], [30, -10, 14]]) ps.push(a.elipsoide(x, y, 0, r, r * 0.8, 5, { mat: m, tono: 0.16 }));
      } else if (v === 'a3_idolo') {
        // cabeza de ídolo de la selva: bloque con ojos que arden verde, boca abierta, lianas y raíces que la abrazan
        const m = 'bor_selva';
        ps.push(a.caja(0, 0, 0, 46, 40, 14, { mat: m, tono: -0.06 })); ps.push(a.caja(0, 0, 14, 40, 34, 44, { mat: m })); ps.push(a.caja(0, 0, 58, 46, 38, 9, { mat: m, tono: 0.05 }));
        for (const l of [-1, 1]) { ps.push(a.caja(l * 10, 17.6, 40, 9, 2, 6, { mat: 'dec_runa_verde' })); ps.push(a.caja(l * 22, 2, 30, 6, 16, 18, { mat: m, tono: -0.08 })); }
        ps.push(a.caja(0, 18, 34, 8, 4, 12, { mat: m, tono: -0.1 })); ps.push(a.caja(0, 17.6, 18, 20, 2, 8, { mat: 'negro' }));
        for (let i = 0; i < 5; i++) ps.push(a.caja(-8 + i * 4, 18.4, 23, 2.4, 1.4, 3, { mat: 'bor_celestial', tono: -0.2 }));
        for (let i = 0; i < 9; i++) { let p: V3 = [(a.r() - 0.5) * 44, (a.r() - 0.5) * 30 + 6, 66]; for (let k = 0; k < 5; k++) { const q: V3 = [p[0] + (a.r() - 0.5) * 6, p[1] + 2.5 + a.r() * 2, p[2] - 11 - a.r() * 5]; ps.push(a.palo(p, q, 1.3 - k * 0.15, { mat: 'bor_liana' })); p = q; } }
        for (const [x, y] of [[-14, -6], [10, 4], [18, -10]]) ps.push(a.elipsoide(x, y, 67, 10, 8, 2.4, { mat: 'bor_liana', giro: a.r() * 180 }));
      } else if (v === 'a4_tumulo') {
        // túmulo del norte: loma de nieve con entrada de losas y un cerco de piedras paradas
        const m = 'bor_nieve_roca';
        ps.push(a.elipsoide(0, -4, 0, 40, 34, 26, { mat: 'bor_nieve', tono: -0.06 }));
        for (const l of [-1, 1]) ps.push(a.caja(l * 8, 27, 0, 5, 9, 22, { mat: m })); ps.push(a.caja(0, 27, 22, 26, 11, 5, { mat: m, tono: 0.05 })); ps.push(a.caja(0, 28, 0, 11, 7, 22, { mat: 'negro' }));
        ps.push(a.caja(0, 31.6, 24, 6, 1, 2.4, { mat: 'dec_runa_fria' }));
        for (let i = 0; i < 9; i++) { const g = (i / 9) * 2 * PI + 0.35, x = Math.cos(g) * 46, y = Math.sin(g) * 40 - 4, h = 16 + a.r() * 16; if (Math.abs(x) < 14 && y > 20) continue; ps.push(a.caja(x, y, 0, 6 + a.r() * 2, 4.5, h, { mat: m, giro: (g * 180) / PI, tono: (a.r() - 0.5) * 0.12, incl: (a.r() - 0.5) * 12 })); ps.push(a.elipsoide(x, y, h - 1, 4.4, 3.6, 2.6, { mat: 'bor_nieve' })); }
      } else if (v === 'a5_costillar') {
        // el costillar de algo enorme: espinazo en el suelo y costillas que se cierran arriba, con brasa en las grietas
        const m = 'bor_celestial';
        for (let i = 0; i < 9; i++) ps.push(a.elipsoide(-36 + i * 9, 0, 5, 5.5, 6, 5, { mat: m, tono: -0.22 + (a.r() - 0.5) * 0.08 }));
        for (let i = 0; i < 6; i++) for (const l of [-1, 1]) { const x = -30 + i * 11, alto = 46 - Math.abs(i - 2.5) * 5; let p: V3 = [x, l * 4, 7]; for (let k = 1; k <= 5; k++) { const f = k / 5, q: V3 = [x + (a.r() - 0.5) * 1.5, l * (4 + Math.sin(f * PI) * 27), 7 + alto * Math.sin(f * PI * 0.62) * 1.05]; ps.push(a.palo(p, q, 3 - f * 1.6, { mat: m, r1: 2.7 - f * 1.6, tono: -0.2 })); p = q; } }
        ps.push(a.elipsoide(46, 0, 9, 13, 10, 11, { mat: m, tono: -0.2 })); for (const l of [-1, 1]) ps.push(a.esfera(55, l * 4.5, 13, 3, { mat: 'dec_brasa' }));
        for (let i = 0; i < 7; i++) ps.push(a.caja(-34 + i * 11 + a.r() * 3, (a.r() - 0.5) * 30, 0, 5, 1.6, 0.9, { mat: 'dec_brasa', giro: a.r() * 180 }));
      } else if (v === 'a6_ancla') {
        // el ancla de un barco que ya no está: clavada de lado, con su cadena y cubierta de percebes y algas
        const m = 'bor_ahogada';
        ps.push(a.palo([-6, 0, 4], [10, 0, 70], 4.4, { mat: m, r1: 3.6 })); ps.push(a.cilindro(11.5, 0, 72, 9, 4, { mat: m, eje: [0, 1, 0] as V3 })); ps.push(a.cilindro(11.5, 0, 72, 5, 5, { mat: 'negro', eje: [0, 1, 0] as V3 }));
        ps.push(a.palo([-2, 0, 56], [22, 0, 50], 2.6, { mat: m }));
        for (const l of [-1, 1]) { let p: V3 = [-6, 0, 6]; for (let k = 1; k <= 5; k++) { const g = (k / 5) * 1.25, q: V3 = [-6 + l * Math.sin(g) * 30, 0, 6 + (1 - Math.cos(g)) * 26]; ps.push(a.palo(p, q, 4 - k * 0.3, { mat: m })); p = q; } ps.push(a.caja(p[0] + l * 3, 0, p[2] - 2, 12, 4, 9, { mat: m, incl: l * 34, inclEje: 'y' })); }
        for (let i = 0; i < 9; i++) ps.push(a.cilindro(22 + i * 5, 8 + Math.sin(i * 1.1) * 5, 1.5, 3, 2.4, { mat: m, eje: [i % 2 ? 1 : 0, i % 2 ? 0 : 1, 0.3] as V3, tono: -0.08 }));
        for (let i = 0; i < 14; i++) { const f = a.r(); ps.push(a.elipsoide(-6 + 16 * f + (a.r() - 0.5) * 5, (a.r() - 0.5) * 6, 4 + 66 * f, 1.7, 1.7, 1.5, { mat: 'bor_percebe' })); }
        for (let i = 0; i < 5; i++) { let p: V3 = [-2 + i * 5, 2, 50 - i * 2]; for (let k = 0; k < 3; k++) { const q: V3 = [p[0] + (a.r() - 0.5) * 3, p[1] + 1, p[2] - 8]; ps.push(a.palo(p, q, 0.9, { mat: 'dec_alga' })); p = q; } }
      } else {
        // el anillo roto de la Corona: un aro de oro y mármol de pie sobre su plinto, partido, con un tramo caído
        ps.push(a.caja(0, 0, 0, 44, 22, 6, { mat: 'bor_celestial', tono: -0.05 })); ps.push(a.caja(0, 0, 6, 34, 16, 6, { mat: 'bor_celestial' }));
        const R = 36;
        for (let i = 0; i < 26; i++) { const g = -0.5 + (i / 26) * (2 * PI - 1.25), g2 = g + (2 * PI - 1.25) / 26; ps.push(a.palo([Math.cos(g) * R, 0, 12 + R + Math.sin(g) * R], [Math.cos(g2) * R, 0, 12 + R + Math.sin(g2) * R], 4.6, { mat: i % 4 === 0 ? 'bor_celestial' : 'bor_oro', tono: (a.r() - 0.5) * 0.1 })); }
        for (let i = 0; i < 4; i++) ps.push(a.palo([30 + i * 6, 14 + i * 2, 4.5], [35 + i * 6, 15 + i * 2, 4.5], 4.4, { mat: 'bor_oro' }));
        ps.push(a.esfera(0, 0, 12 + R, 5, { mat: 'dec_runa_oro' }));
        for (let i = 0; i < 5; i++) ps.push(blq(a, (a.r() - 0.5) * 60, 14 + a.r() * 12, 0, 7, 6, 4, 'bor_celestial', a.r() * 90));
      }
      ps.push(suelo(a));
      return ps;
    },
  },
  {
    id: 'dec_muro', nombre: ['Aderezo de muro', 'Wall dressing'], tema: 'comun',
    variantes: ['paramo', 'cementerio', 'desierto', 'nieve', 'selva', 'infierno', 'ahogada', 'celestial'].flatMap((e) => ['contrafuerte', 'derrumbe'].map((t) => `${e}_${t}`)), huella: [1, 1], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], e = v.slice(0, v.lastIndexOf('_')), m = e === 'nieve' ? 'bor_nieve_roca' : 'bor_' + e;
      for (let i = v.length * 3; i > 0; i--) a.r();
      if (v.endsWith('contrafuerte')) {
        // machón escalonado que sube pegado al muro, más ancho abajo
        let z = 0; for (const [w, d, h] of [[13, 11, 16], [11, 9, 26], [9, 7, 26], [7, 5, 18]]) { ps.push(blq(a, 0, -d / 2 + 5.5, z, w, d, h, m)); ps.push(a.caja(0, -d / 2 + 6, z + h - 2.4, w + 1.6, d + 1, 2.4, { mat: m, tono: 0.08 })); z += h; }
        if (e === 'infierno') ps.push(a.caja(0, 6.2, 30, 2, 1, 22, { mat: 'dec_brasa' })); else if (e === 'celestial') ps.push(a.caja(0, 6.2, 34, 5, 1, 5, { mat: 'bor_oro' })); else if (e === 'selva' || e === 'paramo') ps.push(a.elipsoide(0, 3, 86, 6, 5, 2, { mat: e === 'selva' ? 'bor_liana' : 'bor_musgo' })); else if (e === 'nieve') ps.push(a.elipsoide(0, 2, 85, 5.5, 5, 3, { mat: 'bor_nieve' }));
      } else {
        // derrumbe: sillares y cascote en talud contra el muro
        for (let i = 0; i < 12; i++) { const f = a.r(), x = (a.r() - 0.5) * 22 * (1 - f * 0.5), y = 6 - f * 12; ps.push(blq(a, x, y, f * 22 * (0.6 + a.r() * 0.4), 6 + a.r() * 4, 5 + a.r() * 3, 4 + a.r() * 3, m, a.r() * 90)); }
        for (let i = 0; i < 5; i++) ps.push(pena(a, (a.r() - 0.5) * 30, 9 + a.r() * 7, 2.5 + a.r() * 2.5, m));
      }
      ps.push(suelo(a));
      return ps;
    },
  },
);
