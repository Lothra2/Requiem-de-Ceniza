import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// Los muros del acto 7 (22 nov 2026): la Bóveda, el Relicario y el Trono llevaban la misma muralla de runas de la fortaleza.
// Cada uno con el suyo: el lapislázuli con sus astros, el mármol de los nichos con sus reliquias y el oro reseco por donde baja
// la sangre que el dios no alcanzó a beber. Tema propio ('acto7'): ningún riego viejo las toma.
const T7 = 'acto7' as any;
const PI = Math.PI;
MATERIALES.a7m_lapis = { rampa: ['#04060f', '#080d1d', '#0e152c', '#151e3d', '#1e2a50', '#293864', '#364a7c'], ruido: 0.15, escala: 0.18, brillo: 0.3 };
MATERIALES.a7m_oro = { rampa: ['#2a1d08', '#46310d', '#664914', '#88631d', '#a87e2a', '#c49a3c', '#dcb758'], ruido: 0.1, escala: 0.2, brillo: 0.6 };
MATERIALES.a7m_estrella = { rampa: ['#a08028', '#d4b048', '#f4dc86', '#fff2c0'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a7m_marmol = { rampa: ['#3a3836', '#57544f', '#75716a', '#938e85', '#aea9a0', '#c6c1b8', '#d9d5cd'], ruido: 0.12, escala: 0.16 };
MATERIALES.a7m_terciopelo = { rampa: ['#12030a', '#220610', '#350a18', '#4a1022', '#60172d', '#781e38'], ruido: 0.3, escala: 0.4 };
MATERIALES.a7m_oro_seco = { rampa: ['#1e1406', '#32220b', '#4a3311', '#644618', '#7e5a20', '#966e2b', '#ad8237'], ruido: 0.22, escala: 0.22 };
MATERIALES.a7m_sangre = { rampa: ['#0f0303', '#1c0606', '#2b0a0a', '#3b0f0e', '#4d1512'], ruido: 0.2, escala: 0.3 };
const T = 14, H = 104, F = T / 2, L = 80;
function base(a: any, ps: Pieza[], cuerpo: string, borde: string) {
  ps.push(a.caja(0, 0, 0, L, T + 4, 7, { mat: borde, tono: -0.05 }), a.caja(0, 0, 0, L, T, H, { mat: cuerpo }));
  ps.push(a.caja(0, 0, H, L, T + 4, 4, { mat: borde, tono: 0.05 }), a.caja(0, 0, H + 4, L, T + 1, 3, { mat: cuerpo, tono: 0.05 }));
  ps.push(a.caja(0, F + 0.6, H - 6, L, 1.2, 2, { mat: borde }), a.caja(0, F + 0.6, 9, L, 1.2, 2, { mat: borde }));
}
registrar(
  {
    id: 'a7_muro_astros', nombre: ['Muro de los astros', 'Wall of stars'], tema: T7, variantes: ['astros', 'esfera', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      base(a, ps, 'a7m_lapis', 'a7m_oro');
      // el cielo pintado: estrellas de oro que brillan y las líneas de las constelaciones
      const est: [number, number][] = [];
      for (let i = 0; i < 18; i++) { const x = -36 + a.r() * 72, z = 16 + a.r() * 76; est.push([x, z]); ps.push(a.esfera(x, F + 0.6, z, 0.8 + a.r() * 0.8, { mat: 'a7m_estrella' })); }
      for (let i = 0; i < 6; i++) { const [x0, z0] = est[i * 2], [x1, z1] = est[i * 2 + 1]; if (Math.hypot(x1 - x0, z1 - z0) < 30) ps.push(a.palo([x0, F + 0.4, z0], [x1, F + 0.4, z1], 0.35, { mat: 'a7m_oro', tono: -0.1 })); }
      if (v === 'esfera') {
        // la esfera armilar en relieve: tres aros de oro cruzados y el sol en el centro
        const c: [number, number, number] = [0, F + 1, 56];
        ps.push(a.cilindro(c[0], c[1], c[2], 20, 1.4, { mat: 'a7m_oro', eje: [0, 1, 0] }), a.cilindro(c[0], c[1] + 0.2, c[2], 18.6, 1.6, { mat: 'a7m_lapis', eje: [0, 1, 0], tono: -0.1 }));
        for (const t of [0.5, -0.5]) ps.push(a.palo([c[0] - 18 * Math.cos(t), c[1] + 1, c[2] - 18 * Math.sin(t)], [c[0] + 18 * Math.cos(t), c[1] + 1, c[2] + 18 * Math.sin(t)], 0.9, { mat: 'a7m_oro' }));
        ps.push(a.esfera(c[0], c[1] + 1.4, c[2], 4, { mat: 'a7m_estrella' }));
      }
      if (v === 'roto') ps.push(a.poliedro([[12, -T, H + 12], [42, -T, H + 12], [12, T, H + 12], [42, T, H + 12], [42, -T, 40], [42, T, 52], [26, 0, 78]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
  {
    id: 'a7_muro_relicario', nombre: ['Muro del relicario', 'Reliquary wall'], tema: T7, variantes: ['nichos', 'velo', 'vacio'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      base(a, ps, 'a7m_marmol', 'a7m_oro');
      // tres nichos de arco con su reliquia de oro sobre terciopelo, y las velas al pie
      for (const x of [-25, 0, 25]) {
        ps.push(a.caja(x, F, 28, 17, 10, 36, { mat: 'negro', resta: true }), a.cilindro(x, F, 64, 8.5, 10, { mat: 'negro', resta: true, eje: [0, 1, 0] }));
        ps.push(a.caja(x, F - 3, 28, 16, 4, 1.2, { mat: 'a7m_terciopelo' }));
        ps.push(a.cilindro(x, F + 0.6, 64, 10, 1.4, { mat: 'a7m_oro', eje: [0, 1, 0], r1: 10 }), a.cilindro(x, F + 0.2, 64, 8.6, 2.4, { mat: 'negro', resta: true, eje: [0, 1, 0] }));
        if (v === 'vacio' && x !== 0) continue;
        // el relicario: cofrecito de oro con tejado y su halo
        ps.push(a.caja(x, F - 4, 29.2, 9, 5, 7, { mat: 'a7m_oro' }), a.poliedro([[x - 5, F - 7, 36.2], [x + 5, F - 7, 36.2], [x - 5, F - 1, 36.2], [x + 5, F - 1, 36.2], [x, F - 4, 40.5]], { mat: 'a7m_oro', tono: 0.08 }));
        ps.push(a.cilindro(x, F - 4, 46, 4.5, 0.8, { mat: 'a7m_estrella', eje: [0, 1, 0] }), a.cilindro(x, F - 3.9, 46, 3.6, 1, { mat: 'negro', resta: true, eje: [0, 1, 0] }));
        if (v === 'velo') ps.push(a.caja(x, F + 1.2, 40, 15, 0.8, 30, { mat: 'a7m_terciopelo', tono: -0.05 }));
        for (const dx of [-6, 6]) ps.push(a.cilindro(x + dx, F + 4, 7, 1.1, 4 + a.r() * 3, { mat: 'cera' }));
      }
      return ps;
    },
  },
  {
    id: 'a7_muro_sed', nombre: ['Muro de la sed', 'Wall of thirst'], tema: T7, variantes: ['placas', 'sangre', 'bocas', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      base(a, ps, 'a7m_oro_seco', 'a7m_oro');
      // placas de oro resecas, que se curvan y se despegan, con las grietas negras entre ellas
      for (let i = 0; i < 16; i++) { const x = -34 + (i % 4) * 22 + (a.r() - 0.5) * 6, z = 16 + Math.floor(i / 4) * 21 + (a.r() - 0.5) * 6; ps.push(a.caja(x, F + 0.4, z, 16 + a.r() * 5, 1.2, 15 + a.r() * 4, { mat: 'a7m_oro_seco', tono: (a.r() - 0.5) * 0.2, incl: (a.r() - 0.5) * 8, inclEje: 'x' })); }
      if (v === 'sangre' || v === 'bocas') for (let i = 0; i < 4; i++) { const x = -30 + i * 20 + (a.r() - 0.5) * 6, z0 = 60 + a.r() * 30; ps.push(a.caja(x, F + 1.4, 0, 2 + a.r() * 1.5, 0.6, z0, { mat: 'a7m_sangre' })); ps.push(a.elipsoide(x, F + 4, 0.3, 4, 3, 0.4, { mat: 'a7m_sangre' })); }
      if (v === 'bocas') for (const x of [-22, 22]) { ps.push(a.elipsoide(x, F + 1, 70, 7, 2, 4, { mat: 'negro', resta: true }), a.elipsoide(x, F + 0.8, 70, 8, 1.2, 5, { mat: 'a7m_oro', tono: 0.1 }), a.elipsoide(x, F + 1.4, 70, 6.4, 1.4, 3.4, { mat: 'negro' })); }
      if (v === 'roto') ps.push(a.poliedro([[-42, -T, H + 12], [-10, -T, H + 12], [-42, T, H + 12], [-10, T, H + 12], [-42, -T, 36], [-42, T, 50], [-24, 0, 76]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
);
conVarianteY('a7_muro_astros', 'a7_muro_relicario', 'a7_muro_sed');
void PI;
