import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// Los muros del acto 5 (22 nov 2026): la Fragua, la Garganta, el Corazón de la Brasa y el Abismo de los Susurros llevaban la
// misma pared de carne. La Fragua es una pared de hierro remachado, negra de hollín, con las bocas de los hornos al rojo y las
// herramientas colgadas; las otras tres son obsidiana partida: por la Garganta le corre la sangre viva por las heridas, por el
// Corazón le brillan las venas de la brasa al blanco y en el Abismo le susurran las runas violetas. Tema propio ('acto5').
const T5 = 'acto5' as any;
MATERIALES.a5m_hierro = { rampa: ['#09090a', '#131315', '#1e1e21', '#2a2a2e', '#37373c', '#45454b'], ruido: 0.15, escala: 0.3, brillo: 0.4 };
MATERIALES.a5m_hollin = { rampa: ['#040303', '#090706', '#100d0b', '#181410'], ruido: 0.35, escala: 0.5 };
MATERIALES.a5m_fuego = { rampa: ['#7a1a02', '#c03c06', '#f07414', '#ffb040', '#ffe2a0'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a5m_obsidiana = { rampa: ['#030304', '#08080b', '#101014', '#18181e', '#222229', '#2e2e37'], ruido: 0.08, escala: 0.2, brillo: 0.8 };
MATERIALES.a5m_sangre = { rampa: ['#3a0306', '#640710', '#940f18', '#c41e22'], ruido: 0.1, escala: 0.3, brillo: 0.8 };
MATERIALES.a5m_brasa = { rampa: ['#9a4008', '#d27018', '#f6a838', '#ffd884', '#fff4d0'], ruido: 0.08, escala: 0.3, emite: true };
MATERIALES.a5m_runa = { rampa: ['#3a1a70', '#5c2ca6', '#8a54d8', '#c09cf6'], ruido: 0.05, escala: 0.3, emite: true };
const T = 14, H = 104, F = T / 2, L = 80;

registrar(
  {
    id: 'a5_muro_fragua', nombre: ['Pared de la fragua', 'Forge wall'], tema: T5, variantes: ['planchas', 'horno', 'herramientas', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.caja(0, 0, 0, L, T + 4, 10, { mat: 'a5m_hierro', tono: -0.1 }), a.caja(0, 0, 0, L, T, H, { mat: 'a5m_hollin' }));
      // planchas remachadas, cada una con su tono, y los remaches
      for (let fila = 0; fila < 4; fila++) for (let col = 0; col < 4; col++) {
        const x = -30 + col * 20, z = 12 + fila * 22;
        ps.push(a.caja(x, F + 0.5, z, 19, 1.2, 21, { mat: 'a5m_hierro', tono: (a.r() - 0.5) * 0.3 }));
        for (const dx of [-8, 8]) for (const dz of [2, 19]) ps.push(a.esfera(x + dx, F + 1.3, z + dz, 0.9, { mat: 'a5m_hierro', tono: 0.25 }));
      }
      // el hollín que sube por la pared y la viga de hierro de arriba
      for (let i = 0; i < 4; i++) { const x = -30 + i * 20 + (a.r() - 0.5) * 8; ps.push(a.caja(x, F + 1.4, 40, 8 + a.r() * 8, 0.5, 60, { mat: 'a5m_hollin' })); }
      ps.push(a.caja(0, F + 2, H - 4, L, 5, 6, { mat: 'a5m_hierro', tono: 0.08 }));
      if (v === 'horno') {
        // la boca del horno al rojo, con su arco de ladrillo refractario y las brasas que se caen
        ps.push(a.caja(0, F + 1.5, 8, 28, 3, 34, { mat: 'a5m_hierro', tono: 0.15 }), a.caja(0, F, 12, 20, 10, 22, { mat: 'negro', resta: true }));
        ps.push(a.caja(0, F - 3, 12, 18, 2, 20, { mat: 'a5m_fuego' }), a.caja(0, F + 2, 34, 22, 2, 4, { mat: 'a5m_fuego', tono: -0.3 }));
        for (let i = 0; i < 5; i++) ps.push(a.esfera(-8 + a.r() * 16, F + 3 + a.r() * 3, 1, 1 + a.r(), { mat: 'a5m_fuego', tono: -0.2 }));
      }
      if (v === 'herramientas') {
        // tenazas, martillos y cadenas colgadas
        for (const [x, l] of [[-22, 30], [-8, 24], [8, 34], [22, 26]] as [number, number][]) {
          ps.push(a.palo([x, F + 2, 80], [x, F + 2, 80 - l], 0.7, { mat: 'a5m_hierro', tono: 0.1 }));
          ps.push(a.caja(x, F + 2, 80 - l - 3, 5, 3, 4, { mat: 'a5m_hierro', tono: 0.2 }));
        }
        ps.push(a.caja(0, F + 2, 82, 60, 2, 2, { mat: 'a5m_hierro', tono: 0.15 }));
      }
      if (v === 'roto') ps.push(a.poliedro([[10, -T, H + 14], [42, -T, H + 14], [10, T, H + 14], [42, T, H + 14], [42, -T, 40], [42, T, 54], [24, 0, 80]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
  {
    id: 'a5_muro_obsidiana', nombre: ['Muro de obsidiana', 'Obsidian wall'], tema: T5, variantes: ['herida', 'herida2', 'brasa', 'brasa2', 'runas', 'liso', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.caja(0, 0, 0, L, T, H, { mat: 'a5m_obsidiana', tono: -0.1 }));
      // la obsidiana en lajas facetadas, partidas en diagonal
      for (let i = 0; i < 9; i++) {
        const x = -36 + i * 9 + (a.r() - 0.5) * 3, z = a.r() * 10, h = H - 6 - a.r() * 14;
        ps.push(a.caja(x, F + 0.6 + a.r() * 1.2, z, 8.5, 1.6, h, { mat: 'a5m_obsidiana', tono: (a.r() - 0.5) * 0.25, incl: (a.r() - 0.5) * 6, inclEje: 'y' }));
      }
      const mat = v.startsWith('herida') ? 'a5m_sangre' : v.startsWith('brasa') ? 'a5m_brasa' : v === 'runas' ? 'a5m_runa' : null;
      if (mat && v !== 'runas') {
        // las grietas que se abren de arriba abajo, con lo que corre por adentro
        const n = v.endsWith('2') ? 3 : 2;
        for (let k = 0; k < n; k++) {
          let x = -28 + k * (56 / Math.max(1, n - 1)) + (a.r() - 0.5) * 8, z = H - 8;
          while (z > 4) { const nz = z - 8 - a.r() * 8, nx = x + (a.r() - 0.5) * 8; ps.push(a.palo([x, F + 2.2, z], [nx, F + 2.2, Math.max(2, nz)], v.startsWith('brasa') ? 0.9 : 1.1, { mat })); x = nx; z = nz; }
          if (v.startsWith('herida')) ps.push(a.elipsoide(x, F + 4, 0.3, 5, 3, 0.5, { mat: 'a5m_sangre' }));
        }
      }
      if (v === 'runas') for (let i = 0; i < 6; i++) { const x = -26 + (i % 3) * 26, z = 34 + Math.floor(i / 3) * 34; ps.push(a.caja(x, F + 2.2, z, 2, 0.6, 9, { mat: 'a5m_runa' }), a.caja(x + 2, F + 2.2, z + 6, 5, 0.6, 1.4, { mat: 'a5m_runa' }), a.caja(x - 2, F + 2.2, z + 1, 4, 0.6, 1.2, { mat: 'a5m_runa', incl: 30, inclEje: 'y' })); }
      if (v === 'roto') ps.push(a.poliedro([[-42, -T, H + 14], [-10, -T, H + 14], [-42, T, H + 14], [-10, T, H + 14], [-42, -T, 38], [-42, T, 52], [-24, 0, 80]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
);
conVarianteY('a5_muro_fragua', 'a5_muro_obsidiana');
