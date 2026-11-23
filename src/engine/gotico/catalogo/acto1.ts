import { conVarianteY, registrar, type Pieza } from '../objeto';
import { MATERIALES } from '../materiales';

// El muro del Claustro Profanado (22 nov 2026): la Nave y el Claustro de la abadía llevaban la misma pared lisa con el mismo
// damero. El claustro es la arcada: un antepecho bajo, columnas pareadas con su capitel y los arcos de medio punto hondos y
// negros, con la hiedra que baja, sangre en el antepecho y alguna columna rota. Tema propio ('acto1').
const T1 = 'acto1' as any;
MATERIALES.a1m_piedra = { rampa: ['#141311', '#211f1c', '#302d29', '#3f3b36', '#4f4a44', '#605a53', '#716a62'], ruido: 0.2, escala: 0.2 };
MATERIALES.a1m_hiedra = { rampa: ['#060b05', '#0d1709', '#15240e', '#1e3214', '#28411a'], ruido: 0.45, escala: 0.5 };
MATERIALES.a1m_sangre = { rampa: ['#1e0404', '#330807', '#4a0d0a', '#62140e'], ruido: 0.2, escala: 0.3, brillo: 0.4 };
const T = 14, H = 104, F = T / 2, L = 80;

registrar({
  id: 'a1_muro_claustro', nombre: ['Arcada del claustro', 'Cloister arcade'], tema: T1, variantes: ['arcos', 'hiedra', 'sangre', 'roto'], huella: [5, 1], bloquea: true,
  armar: (v, _f, a) => {
    const ps: Pieza[] = [];
    // el cuerpo de la arcada, el antepecho con su albardilla y la cornisa
    ps.push(a.caja(0, 0, 0, L, T, H, { mat: 'a1m_piedra', tono: -0.05 }));
    ps.push(a.caja(0, 0, 26, L, T + 3, 3, { mat: 'a1m_piedra', tono: 0.1 }), a.caja(0, 0, H - 6, L, T + 4, 6, { mat: 'a1m_piedra', tono: 0.08 }));
    // tres arcos abiertos a lo negro sobre el antepecho, con las columnas pareadas entre ellos
    for (const x of [-26, 0, 26]) {
      ps.push(a.caja(x, F, 30, 18, 12, 38, { mat: 'negro', resta: true }), a.cilindro(x, F, 68, 9, 12, { mat: 'negro', resta: true, eje: [0, 1, 0] }));
    }
    for (const x of [-39, -13, 13, 39]) {
      const rota = v === 'roto' && x === 13;
      for (const dx of [-1.6, 1.6]) ps.push(a.cilindro(x + dx, F - 1, 29, 1.4, rota ? 14 : 38, { mat: 'a1m_piedra', tono: 0.05 }));
      if (!rota) ps.push(a.caja(x, F - 1, 66, 6, 5, 3, { mat: 'a1m_piedra', tono: 0.15 }));
    }
    if (v === 'hiedra' || v === 'roto') for (let i = 0; i < 6; i++) { const x = -36 + a.r() * 72, l = 20 + a.r() * 50; ps.push(a.caja(x, F + 1.4, H - 6 - l, 3 + a.r() * 3, 1.2, l, { mat: 'a1m_hiedra', tono: (a.r() - 0.5) * 0.2 })); }
    if (v === 'sangre') for (let i = 0; i < 3; i++) { const x = -30 + i * 28 + (a.r() - 0.5) * 8; ps.push(a.caja(x, F + 1.8, 28, 8 + a.r() * 6, 0.6, 2, { mat: 'a1m_sangre' }), a.caja(x, F + 1.9, 2, 1.6, 0.5, 26, { mat: 'a1m_sangre', tono: -0.1 })); }
    if (v === 'roto') ps.push(a.poliedro([[10, -T, H + 14], [42, -T, H + 14], [10, T, H + 14], [42, T, H + 14], [42, -T, 60], [42, T, 70], [26, 0, 88]], { mat: 'negro', resta: true }));
    return ps;
  },
});
conVarianteY('a1_muro_claustro');
