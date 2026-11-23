import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// Los muros del acto 4 (22 nov 2026): la Cripta del Rey Bárbaro llevaba el muro de las criptas del acto 1 y el Trono de Hjaldur
// la pared de hielo de las cuevas. El túmulo es piedra seca de pizarra apilada entre postes de madera, con escudos clavados y
// runas; el salón de Hjaldur es la pared de madera tallada de un gran salón del norte, que el hielo se tragó. Tema propio.
const T4 = 'acto4' as any;
MATERIALES.a4m_pizarra = { rampa: ['#0f1012', '#1a1b1f', '#26282d', '#33353c', '#41444c', '#50545d'], ruido: 0.25, escala: 0.22 };
MATERIALES.a4m_madera = { rampa: ['#0d0906', '#19110a', '#261a10', '#342416', '#432f1d', '#523a24'], ruido: 0.3, escala: 0.45 };
MATERIALES.a4m_escudo_r = { rampa: ['#1e0605', '#330b08', '#4c120c', '#661a10'], ruido: 0.3, escala: 0.3 };
MATERIALES.a4m_escudo_a = { rampa: ['#0a1218', '#122230', '#1c3446', '#28475c'], ruido: 0.3, escala: 0.3 };
MATERIALES.a4m_hierro = { rampa: ['#141516', '#232527', '#35383b', '#4a4e52', '#61666b'], ruido: 0.15, escala: 0.25, brillo: 0.4 };
MATERIALES.a4m_runa = { rampa: ['#2a5a78', '#4a8ab0', '#7ab8d8', '#b8e4f4'], ruido: 0.05, escala: 0.3, emite: true };
MATERIALES.a4m_hielo = { rampa: ['#2d4a62', '#41657f', '#5a839c', '#78a2b8', '#9cc2d3', '#c4e0ea'], ruido: 0.12, escala: 0.3, brillo: 0.8 };
MATERIALES.a4m_escarcha = { rampa: ['#7d8a96', '#9ba7b2', '#bac4cd', '#d6dee4'], ruido: 0.35, escala: 0.6 };
const T = 14, H = 104, F = T / 2, L = 80;

function escudo(a: any, ps: Pieza[], x: number, z: number, r: number, mat: string) {
  ps.push(a.cilindro(x, F + 1.2, z, r, 1.6, { mat, eje: [0, 1, 0] }), a.cilindro(x, F + 2.2, z, r * 0.28, 1.4, { mat: 'a4m_hierro', eje: [0, 1, 0] }));
  ps.push(a.cilindro(x, F + 1.4, z, r + 0.6, 0.8, { mat: 'a4m_hierro', eje: [0, 1, 0], tono: -0.1 }));
  for (const k of [0, 1]) ps.push(a.caja(x, F + 1.9, z, k ? 0.8 : r * 1.9, 0.5, k ? r * 1.9 : 0.8, { mat, tono: 0.12 }));
}

registrar(
  {
    id: 'a4_muro_tumulo', nombre: ['Muro del túmulo', 'Barrow wall'], tema: T4, variantes: ['piedra', 'escudos', 'runas', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.caja(0, 0, 0, L, T, H, { mat: 'a4m_pizarra', tono: -0.15 }));
      // la piedra seca: lajas de pizarra apiladas de canto, desparejas, cada hilada corrida
      for (let fila = 0, z = 2; z < H - 6; fila++) {
        const alto = 4 + a.r() * 4;
        for (let x = -40 + (fila % 2) * 5 + a.r() * 3; x < 40; ) {
          const largo = 8 + a.r() * 12, w = Math.min(largo, 40 - x);
          if (w > 2) ps.push(a.caja(x + w / 2, F - 0.6 + a.r() * 1.4, z, w - 0.8, 2, alto - 0.7, { mat: 'a4m_pizarra', tono: (a.r() - 0.5) * 0.3, incl: (a.r() - 0.5) * 4, inclEje: 'y' }));
          x += largo;
        }
        z += alto;
      }
      // los postes de madera que sostienen el techo de tierra y la viga de arriba
      for (const x of [-34, 34]) ps.push(a.caja(x, F + 1.5, 0, 6, 5, H + 4, { mat: 'a4m_madera' }));
      ps.push(a.caja(0, F + 2, H - 2, L, 5, 6, { mat: 'a4m_madera', tono: 0.05 }));
      // la tierra del túmulo encima, con nieve
      ps.push(a.caja(0, 0, H + 4, L, T + 2, 4, { mat: 'a4m_pizarra', tono: -0.25 }));
      for (let i = 0; i < 4; i++) if (a.r() < 0.6) ps.push(a.caja(-30 + i * 20 + (a.r() - 0.5) * 6, (a.r() - 0.5) * 3, H + 8, 6 + a.r() * 5, T - 5, 1 + a.r(), { mat: 'a4m_escarcha', tono: -0.35 + (a.r() - 0.5) * 0.1 }));
      if (v === 'escudos') { escudo(a, ps, -16, 58, 10, 'a4m_escudo_r'); escudo(a, ps, 12, 62, 10, 'a4m_escudo_a'); ps.push(a.palo([-24, F + 3, 30], [22, F + 3, 86], 0.9, { mat: 'a4m_madera' }), a.poliedro([[22, F + 3, 86], [24, F + 3, 92], [20, F + 3, 92]], { mat: 'a4m_hierro' })); }
      if (v === 'runas') {
        // la losa grande con la sierpe de runas que se enciende
        ps.push(a.caja(0, F + 1, 50, 30, 2, 58, { mat: 'a4m_pizarra', tono: 0.1 }));
        for (let i = 0; i < 9; i++) { const z = 26 + i * 6, x = Math.sin(i * 0.8) * 8; ps.push(a.caja(x, F + 2.2, z, 2.2, 0.6, 3.4, { mat: 'a4m_runa' }), a.caja(x + 1.6, F + 2.2, z + 1, 1.2, 0.6, 1.2, { mat: 'a4m_runa' })); }
      }
      if (v === 'roto') ps.push(a.poliedro([[10, -T, H + 20], [42, -T, H + 20], [10, T, H + 20], [42, T, H + 20], [42, -T, 40], [42, T, 54], [24, 0, 80]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
  {
    id: 'a4_muro_salon', nombre: ['Pared del salón', 'Hall wall'], tema: T4, variantes: ['tallas', 'escudos', 'hielo', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // zócalo de piedra y la pared de tablones verticales
      ps.push(a.caja(0, 0, 0, L, T + 4, 12, { mat: 'a4m_pizarra' }), a.caja(0, 0, 12, L, T, H - 12, { mat: 'a4m_madera', tono: -0.1 }));
      for (let i = 0; i < 13; i++) ps.push(a.caja(-36 + i * 6, F + 0.6, 12, 5.2, 1.2, H - 12, { mat: 'a4m_madera', tono: (a.r() - 0.5) * 0.25 }));
      // los postes tallados con el nudo de las sierpes y las cabezas de dragón arriba
      for (const x of [-34, 0, 34]) {
        ps.push(a.caja(x, F + 2.4, 0, 7, 5, H + 6, { mat: 'a4m_madera', tono: 0.08 }));
        for (let k = 0; k < 6; k++) ps.push(a.caja(x + (k % 2 ? 1.6 : -1.6), F + 5, 22 + k * 12, 3.6, 1, 6, { mat: 'a4m_madera', tono: 0.2, incl: k % 2 ? 35 : -35, inclEje: 'y' }));
        ps.push(a.elipsoide(x, F + 6, H + 4, 3.4, 6, 3.2, { mat: 'a4m_madera', tono: 0.12 }), a.esfera(x + 1.6, F + 10, H + 5.5, 0.8, { mat: 'a4m_runa' }));
      }
      ps.push(a.caja(0, F + 1.5, H - 3, L, 4, 6, { mat: 'a4m_madera', tono: 0.05 }));
      if (v === 'escudos') { escudo(a, ps, -17, 66, 9, 'a4m_escudo_r'); escudo(a, ps, 17, 66, 9, 'a4m_escudo_a'); }
      if (v === 'tallas') for (const x of [-17, 17]) for (let k = 0; k < 4; k++) ps.push(a.caja(x, F + 1.6, 40 + k * 12, 14 - k * 2, 0.8, 2, { mat: 'a4m_madera', tono: 0.25 }));
      // el hielo que se tragó el salón: costra en la pared, carámbanos de la viga y escarcha arriba
      const costra = v === 'hielo' ? 0.9 : 0.35;
      for (let i = 0; i < 5; i++) if (a.r() < costra) { const x = -32 + i * 16 + (a.r() - 0.5) * 6; ps.push(a.caja(x, F + 1.8, 0, 5 + a.r() * 4, 1.4, 14 + a.r() * (v === 'hielo' ? 60 : 24), { mat: 'a4m_hielo', tono: -0.15 + (a.r() - 0.5) * 0.2 })); }
      for (let i = 0; i < 8; i++) { const x = -36 + a.r() * 72, l = 6 + a.r() * 14; ps.push(a.cilindro(x, F + 4.2, H - 6 - l / 2, 1.2, l, { mat: 'a4m_hielo', r1: 0.1 })); }
      ps.push(a.caja(0, F + 1, H + 0.5, L, T + 2, 2, { mat: 'a4m_madera', tono: -0.1 }));
      for (let i = 0; i < 3; i++) ps.push(a.caja(-28 + i * 28 + (a.r() - 0.5) * 8, F + 1, H + 2.5, 8 + a.r() * 6, T - 2, 1, { mat: 'a4m_escarcha', tono: -0.35 }));
      if (v === 'roto') ps.push(a.poliedro([[-42, -T, H + 20], [-10, -T, H + 20], [-42, T, H + 20], [-10, T, H + 20], [-42, -T, 40], [-42, T, 54], [-24, 0, 80]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
);
conVarianteY('a4_muro_tumulo', 'a4_muro_salon');
