import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// El Faro Apagado por dentro (22 nov 2026): se leía como cualquier mazmorra gris. El muro de la torre, encalado y gastado por
// la sal, con troneras por donde entra la luz fría del mar y sogas colgadas; y la linterna del faro, la gran lámpara de bronce
// con su lente rajada y el depósito de aceite, que ya no alumbra. Tema propio ('acto6').
const T6 = 'acto6' as any;
MATERIALES.a6m_cal = { rampa: ['#2c2c2a', '#41413d', '#585853', '#71706a', '#8a8981', '#a3a198', '#bab8ae', '#cecbc1'], ruido: 0.3, escala: 0.2 };
MATERIALES.a6m_rojo = { rampa: ['#1c0806', '#2e0d09', '#43140d', '#5a1c12', '#722618', '#8a311f'], ruido: 0.3, escala: 0.25 };
MATERIALES.a6m_piedra = { rampa: ['#121416', '#1d2023', '#2a2e31', '#373c40', '#464b4f', '#565b5f'], ruido: 0.3, escala: 0.2 };
MATERIALES.a6m_mar = { rampa: ['#3a6a80', '#5a90a8', '#86b8cc', '#b6dcea'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a6m_bronce = { rampa: ['#0c1714', '#172a23', '#244036', '#33574a', '#456f5f', '#5a8775', '#749e8c'], ruido: 0.2, escala: 0.25, brillo: 0.5 };
MATERIALES.a6m_vidrio = { rampa: ['#0a1214', '#16252a', '#24393f', '#355058', '#4b6a72', '#668890'], ruido: 0.1, escala: 0.3, brillo: 0.8 };
const T = 14, H = 104, F = T / 2, L = 80;

registrar(
  {
    id: 'a6_muro_faro', nombre: ['Muro del faro', 'Lighthouse wall'], tema: T6, variantes: ['tronera', 'sogas', 'faja', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // la torre encalada sobre un zócalo de piedra negra, con la faja oscura que se ve desde el mar
      ps.push(a.caja(0, 0, 0, L, T + 4, 16, { mat: 'a6m_piedra' }), a.caja(0, 0, 16, L, T, H - 16, { mat: 'a6m_cal' }));
      ps.push(a.caja(0, F + 0.4, 46, L, 1, 14, { mat: 'a6m_rojo' }), a.caja(0, 0, H, L, T + 3, 5, { mat: 'a6m_piedra', tono: 0.08 }));
      // el salitre que chorrea de las juntas
      for (let i = 0; i < 6; i++) ps.push(a.caja(-36 + a.r() * 72, F + 0.2, 16, 1.5 + a.r() * 2, 0.5, 10 + a.r() * 30, { mat: 'a6m_piedra', tono: 0.15 }));
      if (v === 'tronera' || v === 'roto') {
        // dos troneras estrechas con la luz del mar adentro y su derrame en el alféizar
        for (const x of v === 'roto' ? [-20] : [-20, 20]) {
          ps.push(a.caja(x, F, 66, 6, 10, 22, { mat: 'negro', resta: true }), a.caja(x, F - 3, 66, 3.6, 2, 20, { mat: 'a6m_mar' }));
          ps.push(a.caja(x, F + 1, 64.5, 10, 3, 1.5, { mat: 'a6m_piedra', tono: 0.1 }));
        }
      }
      if (v === 'sogas') for (const x of [-26, -6, 18]) {
        ps.push(a.cilindro(x, F + 1, 84, 1.6, 1.2, { mat: 'hierro_oxido', eje: [0, 1, 0] }));
        for (let k = 0; k < 4; k++) ps.push(a.cilindro(x, F + 2.5, 74 - k * 2.4, 5.5 - k * 0.4, 2.2, { mat: 'cuerda', eje: [0, 1, 0], tono: -0.05 * k }));
      }
      if (v === 'faja') for (let i = 0; i < 4; i++) ps.push(a.caja(-30 + i * 20, F + 0.6, 26, 10, 0.6, 14, { mat: 'a6m_piedra', tono: -0.05 }));
      if (v === 'roto') ps.push(a.poliedro([[12, -T, H + 12], [42, -T, H + 12], [12, T, H + 12], [42, T, H + 12], [42, -T, 40], [42, T, 52], [26, 0, 78]], { mat: 'negro', resta: true }));
      return ps;
    },
  },
  {
    id: 'a6_linterna_faro', nombre: ['La linterna del faro', 'The lighthouse lantern'], tema: T6, variantes: ['apagada', 'rota'], huella: [4, 4], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // la base de piedra con su escalerita, el depósito de aceite de bronce y la gran lente escalonada en su jaula
      ps.push(a.cilindro(0, 0, 0, 28, 8, { mat: 'a6m_piedra', r1: 26 }), a.cilindro(0, 0, 8, 22, 4, { mat: 'a6m_cal', r1: 20 }));
      ps.push(a.cilindro(0, 0, 12, 12, 16, { mat: 'a6m_bronce', r1: 10 }), a.cilindro(0, 0, 28, 10.5, 2, { mat: 'a6m_bronce', tono: 0.1 }));
      const rota = v === 'rota';
      for (let k = 0; k < 6; k++) { const r = 14 - Math.abs(k - 2.5) * 2.2; ps.push(a.cilindro(0, 0, 30 + k * 6, r, 5.4, { mat: 'a6m_vidrio', r1: r - 0.6, tono: k % 2 ? 0.05 : -0.05 })); }
      if (rota) ps.push(a.poliedro([[2, 4, 30], [16, 8, 30], [6, 16, 66], [18, 12, 66], [10, 10, 48]], { mat: 'negro', resta: true }));
      for (let k = 0; k < 8; k++) { const t = (k / 8) * Math.PI * 2; ps.push(a.palo([Math.cos(t) * 15, Math.sin(t) * 15, 30], [Math.cos(t) * 12, Math.sin(t) * 12, 68], 0.9, { mat: 'a6m_bronce' })); }
      ps.push(a.cilindro(0, 0, 66, 13, 3, { mat: 'a6m_bronce', r1: 9 }), a.cilindro(0, 0, 69, 5, 8, { mat: 'a6m_bronce', r1: 1 }));
      // la mecha apagada y el hollín, y lo que dejó el guardián: la aceitera, el trapo, la escalerita
      ps.push(a.cilindro(0, 0, 44, 2, 6, { mat: 'negro' }));
      ps.push(a.cilindro(22, 10, 0, 4, 9, { mat: 'a6m_bronce', r1: 3 }), a.palo([22, 10, 9], [27, 12, 12], 0.7, { mat: 'a6m_bronce' }));
      ps.push(a.elipsoide(-18, 18, 0.6, 7, 4, 0.8, { mat: 'negro', tono: 0.1 }));
      for (let k = 0; k < 4; k++) ps.push(a.caja(-6 + k * 4, 26, k * 2, 10, 4, 2, { mat: 'a6m_piedra', tono: 0.05 }));
      if (rota) for (let i = 0; i < 7; i++) ps.push(a.caja(-20 + a.r() * 40, 14 + a.r() * 12, 0, 2 + a.r() * 3, 1.6 + a.r() * 2, 0.6, { mat: 'a6m_vidrio', giro: a.r() * 90 }));
      return ps;
    },
  },
);
conVarianteY('a6_muro_faro');
