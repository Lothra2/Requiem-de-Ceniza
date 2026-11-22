import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// Los muros del acto 3 (22 nov 2026): las Calles y el Palacio de la Ciudad Hundida y los Escalones del Templo llevaban la
// misma piedra verde con musgo. Las Calles son fachadas de casas que se tragó el agua (el revoque claro arriba y la línea de
// la marea con las algas abajo), y el Palacio un muro de obsidiana con paneles de jade, la greca de oro y las serpientes.
// Tema propio ('acto3'): ningún riego viejo las toma.
const T3 = 'acto3' as any;
MATERIALES.a3m_revoque = { rampa: ['#2b261b', '#433c2b', '#5d543d', '#786d50', '#918563', '#a89b76', '#bcb08a'], ruido: 0.35, escala: 0.25 };
MATERIALES.a3m_ahogado = { rampa: ['#081009', '#0f1d12', '#172b1a', '#213b22', '#2c4c2b', '#385c33'], ruido: 0.45, escala: 0.35, brillo: 0.3 };
MATERIALES.a3m_sillar = { rampa: ['#1a1710', '#2a251a', '#3c3525', '#4f4631', '#62573d', '#74684a'], ruido: 0.2, escala: 0.18 };
MATERIALES.a3m_madera = { rampa: ['#100a06', '#1d130b', '#2b1d11', '#3a2817', '#4a341e'], ruido: 0.3, escala: 0.4 };
MATERIALES.a3m_liana = { rampa: ['#061006', '#0c1e0b', '#142d11', '#1d3f17', '#27511d'], ruido: 0.4, escala: 0.4 };
MATERIALES.a3m_obsidiana = { rampa: ['#030405', '#07090b', '#0c1013', '#12181c', '#1a2227', '#232d33'], ruido: 0.1, escala: 0.2, brillo: 0.6 };
MATERIALES.a3m_jade = { rampa: ['#03100a', '#071f13', '#0c301e', '#13432a', '#1c5837', '#286e46', '#368556'], ruido: 0.15, escala: 0.22, brillo: 0.5 };
MATERIALES.a3m_oro = { rampa: ['#2a1d08', '#46310d', '#664914', '#88631d', '#a87e2a', '#c49a3c'], ruido: 0.12, escala: 0.2, brillo: 0.6 };
MATERIALES.a3m_ojo = { rampa: ['#4a6a20', '#7aa030', '#b8e050', '#e8ff9a'], ruido: 0.1, escala: 0.3, emite: true };
const T = 14, H = 104, F = T / 2, L = 80, MAREA = 38;

registrar(
  {
    id: 'a3_muro_casas', nombre: ['Fachada ahogada', 'Drowned facade'], tema: T3, variantes: ['puerta', 'ventanas', 'tapiada', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // zócalo de sillares, la casa de revoque claro y el alero de vigas
      ps.push(a.caja(0, 0, 0, L, T + 4, 8, { mat: 'a3m_sillar', tono: -0.05 }), a.caja(0, 0, 0, L, T, H, { mat: 'a3m_revoque' }));
      ps.push(a.caja(0, 1, H, L + 2, T + 8, 4, { mat: 'a3m_madera' }), a.caja(0, 0, H + 4, L, T + 2, 3, { mat: 'a3m_sillar', tono: 0.05 }));
      for (let i = 0; i < 7; i++) ps.push(a.caja(-36 + i * 12, F + 3, H - 2, 2.4, 7, 2.4, { mat: 'a3m_madera', tono: -0.05 }));
      // lo que dejó el agua: la piel verde hasta la marea, con su borde irregular, y manchas que gotean desde ahí
      for (let i = 0; i < 10; i++) { const x = -36 + i * 8 + (a.r() - 0.5) * 3, z = MAREA + (a.r() - 0.5) * 8; ps.push(a.caja(x, F + 0.4, 0, 9, 0.8, z, { mat: 'a3m_ahogado', tono: (a.r() - 0.5) * 0.15 })); }
      ps.push(a.caja(0, F + 0.7, MAREA + 1, L, 0.6, 1.6, { mat: 'a3m_ahogado', tono: 0.15 }));
      for (let i = 0; i < 5; i++) { const x = -34 + a.r() * 68; ps.push(a.caja(x, F + 0.5, MAREA, 1.5 + a.r(), 0.5, 10 + a.r() * 18, { mat: 'a3m_revoque', tono: -0.25 })); }
      // el revoque caído deja ver la piedra
      for (let i = 0; i < 3; i++) { const x = -30 + a.r() * 60, z = MAREA + 14 + a.r() * 40; ps.push(a.caja(x, F + 0.3, z, 10 + a.r() * 8, 0.8, 7 + a.r() * 6, { mat: 'a3m_sillar', tono: -0.08 })); }
      const vano = (x: number, z: number, w: number, h: number, lleno: string | null) => {
        ps.push(a.caja(x, F, z, w + 4, 2.6, h + 3, { mat: 'a3m_sillar', tono: 0.06 }));
        ps.push(a.caja(x, F, z, w, 10, h, { mat: 'negro', resta: true }));
        if (lleno) ps.push(a.caja(x, F - 2, z, w, 2, h, { mat: lleno, tono: -0.1 }));
      };
      if (v === 'puerta' || v === 'tapiada') {
        // la puerta grande con su arco, abierta a lo negro o tapiada con piedra
        vano(-14, 8, 18, 34, v === 'tapiada' ? 'a3m_sillar' : null);
        ps.push(a.cilindro(-14, F, 42, 11, 2.6, { mat: 'a3m_sillar', eje: [0, 1, 0], tono: 0.06 }), a.cilindro(-14, F, 42, 9, 10, { mat: v === 'tapiada' ? 'a3m_sillar' : 'negro', resta: v !== 'tapiada', eje: [0, 1, 0] }));
        if (v === 'puerta') ps.push(a.caja(-21, F + 3, 8, 6, 1.5, 30, { mat: 'a3m_madera', incl: 12, inclEje: 'y' }));
        vano(20, 60, 12, 16, null);
        ps.push(a.caja(20, F + 4, 58, 18, 7, 2, { mat: 'a3m_madera' }));
      }
      if (v === 'ventanas' || v === 'roto') for (const x of [-24, 0, 24]) {
        vano(x, 58, 11, 18, null);
        // la contraventana que cuelga de una bisagra
        if (a.r() > 0.4) ps.push(a.caja(x + 8, F + 2, 58, 6, 1.2, 17, { mat: 'a3m_madera', incl: (a.r() - 0.5) * 30, inclEje: 'y' }));
      }
      if (v === 'ventanas') { vano(-24, 14, 10, 14, 'a3m_ahogado'); vano(24, 14, 10, 14, null); }
      // las lianas que bajan del alero
      for (let i = 0; i < 4; i++) { const x = -34 + a.r() * 68, l = 30 + a.r() * 50; ps.push(a.caja(x, F + 1.6, H - l, 1.8, 1.2, l, { mat: 'a3m_liana' })); for (let k = 0; k < 3; k++) ps.push(a.elipsoide(x + (a.r() - 0.5) * 3, F + 2, H - a.r() * l, 2.2, 1.2, 1.6, { mat: 'a3m_liana', tono: 0.1 })); }
      if (v === 'roto') ps.push(a.poliedro([[10, -T, H + 14], [42, -T, H + 14], [10, T, H + 14], [42, T, H + 14], [42, -T, 44], [42, T, 56], [26, 0, 82]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
  {
    id: 'a3_muro_jade', nombre: ['Muro de jade', 'Jade wall'], tema: T3, variantes: ['greca', 'serpiente', 'discos', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.caja(0, 0, 0, L, T + 6, 10, { mat: 'a3m_oro', tono: -0.15 }), a.caja(0, 0, 0, L, T, H, { mat: 'a3m_obsidiana' }));
      ps.push(a.caja(0, 0, H, L, T + 6, 5, { mat: 'a3m_oro', tono: -0.05 }), a.caja(0, 0, H + 5, L, T + 2, 3, { mat: 'a3m_obsidiana', tono: 0.1 }));
      // tres paneles de jade en marco de oro
      for (const x of [-26, 0, 26]) {
        ps.push(a.caja(x, F + 0.4, 18, 22, 1.4, 58, { mat: 'a3m_oro', tono: -0.05 }), a.caja(x, F + 1, 20, 19, 1.4, 54, { mat: 'a3m_jade', tono: (a.r() - 0.5) * 0.1 }));
        // grietas por donde se metió el agua
        if (a.r() > 0.4) ps.push(a.caja(x + (a.r() - 0.5) * 10, F + 1.6, 22 + a.r() * 20, 0.8, 0.6, 18 + a.r() * 14, { mat: 'negro', incl: (a.r() - 0.5) * 30, inclEje: 'y' }));
      }
      // la greca escalonada de oro por arriba
      for (let i = 0; i < 10; i++) { const x = -36 + i * 8; ps.push(a.caja(x, F + 1, 84, 6, 1.6, 2, { mat: 'a3m_oro' }), a.caja(x + (i % 2 ? 2 : -2), F + 1, 86, 2, 1.6, 8, { mat: 'a3m_oro' }), a.caja(x, F + 1, 92, 6, 1.6, 2, { mat: 'a3m_oro' })); }
      if (v === 'serpiente') {
        // la serpiente emplumada que corre por el muro: cuerpo de jade con escamas de oro y la cabeza que asoma con sus ojos
        for (let i = 0; i < 14; i++) { const x = -34 + i * 5, z = 66 + Math.sin(i * 0.7) * 6; ps.push(a.esfera(x, F + 2.2, z, 3.2, { mat: 'a3m_jade', tono: 0.08 }), a.esfera(x, F + 4.5, z + 1.5, 1.1, { mat: 'a3m_oro' })); }
        ps.push(a.elipsoide(36, F + 4, 64, 6, 5, 4.5, { mat: 'a3m_jade', tono: 0.12 }), a.esfera(38, F + 8, 66, 1.2, { mat: 'a3m_ojo' }));
      }
      if (v === 'discos') for (const x of [-26, 0, 26]) {
        ps.push(a.cilindro(x, F + 1.8, 50, 7, 1.4, { mat: 'a3m_oro', eje: [0, 1, 0] }), a.cilindro(x, F + 2.4, 50, 5, 1.4, { mat: 'a3m_jade', eje: [0, 1, 0], tono: 0.12 }));
        ps.push(a.esfera(x, F + 3.4, 50, 1.4, { mat: 'a3m_ojo' }));
      }
      // cabezas de serpiente en la cornisa que escupen el agua
      for (const x of [-30, 30]) { ps.push(a.elipsoide(x, F + 5, H - 4, 4, 6, 3.4, { mat: 'a3m_jade', tono: 0.1 }), a.caja(x, F + 6, 0, 1.2, 0.6, H - 6, { mat: 'a3m_ahogado' })); }
      if (v === 'roto') ps.push(a.poliedro([[-42, -T, H + 14], [-10, -T, H + 14], [-42, T, H + 14], [-10, T, H + 14], [-42, -T, 38], [-42, T, 52], [-24, 0, 80]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
);
conVarianteY('a3_muro_casas', 'a3_muro_jade');
