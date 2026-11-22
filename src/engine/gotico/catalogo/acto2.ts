import { conVarianteY, registrar, type Arma, type Pieza, type V3 } from '../objeto';
import { MATERIALES } from '../materiales';
import { ruido } from '../render';

// El acto 2 con intención (22 nov 2026, Rick: "bajé por unas escaleras y por el portal y el mundo se parece mucho"). Las cinco
// tumbas del desierto eran la misma mazmorra (mismo muro, mismo piso, mismo adorno) y los tres exteriores el mismo arenal. Aquí
// va lo que cada lugar necesita para leerse de un vistazo: el muro de cada tumba (los nombres del pozo, el sol de oro, los
// nichos de los dormidos, el basalto del rey), sus piezas (la boca del pozo, el altar que mira hacia abajo, los lechos de los
// dormidos, las estatuas del rey sin sombra, los nidos y huevos de los escarabajos) y las del mundo abierto (columnata,
// casas caídas y la fuente de las Ruinas, la barca varada del Oasis). Tema propio ('acto2'): ningún riego viejo las toma.
const T2 = 'acto2' as any;
const PI = Math.PI;
const junta = (v: number, paso: number) => { const m = ((v % paso) + paso) % paso; return m < 1 ? 1 : 0; };
/** Sillares con hiladas de alto `alto` y largos que cambian por hilada (no en damero). */
const sillar = (largo: number, alto: number, var0 = 0.14) => (p: [number, number, number], n: [number, number, number]) => {
  if (Math.abs(n[2]) > 0.7) return junta(p[0] + (Math.floor(p[1] / alto) % 2) * largo * 0.5, largo) || junta(p[1], alto) ? -0.2 : 0;
  const fila = Math.floor(p[2] / alto), corre = (fila % 3) * largo * 0.37, u = Math.abs(n[0]) > Math.abs(n[1]) ? p[1] : p[0];
  if (junta(p[2], alto) || junta(u + corre, largo)) return -0.26;
  return (ruido(Math.floor((u + corre) / largo) * 1.7, fila * 2.3, 5) - 0.5) * var0;
};
// el pozo: basalto negro y húmedo, los nombres cavados y los raspados claros
MATERIALES.a2_pozo_sillar = { rampa: ['#08090a', '#111416', '#1b1f22', '#262b2f', '#32383c', '#40474b', '#50585c'], ruido: 0.3, escala: 0.2, patron: sillar(22, 11, 0.2) };
MATERIALES.a2_pozo_liso = { rampa: ['#08090a', '#111416', '#1b1f22', '#262b2f', '#32383c', '#40474b', '#50585c'], ruido: 0.28, escala: 0.18 };
MATERIALES.a2_raspado = { rampa: ['#2a2b2a', '#3d3e3b', '#52524d', '#67665f', '#7c7a71', '#918e83'], ruido: 0.45, escala: 0.5 };
MATERIALES.a2_nombre = { rampa: ['#121516', '#1f2426', '#2d3437', '#3d4549', '#4e575b', '#60696d'], ruido: 0.3, escala: 0.5 };
MATERIALES.a2_moho = { rampa: ['#05080a', '#0a1112', '#101b19', '#172620', '#203227'], ruido: 0.5, escala: 0.4 };
// el sol: arenisca dorada en sillares grandes, oro viejo y el esmalte azul del cielo que adoraban
MATERIALES.a2_sol_sillar = { rampa: ['#1e1307', '#36230e', '#523516', '#6f491f', '#8d5f2a', '#aa7737', '#c48f48'], ruido: 0.18, escala: 0.14, patron: sillar(30, 14, 0.12) };
MATERIALES.a2_sol_liso = { rampa: ['#1e1307', '#36230e', '#523516', '#6f491f', '#8d5f2a', '#aa7737', '#c48f48'], ruido: 0.14, escala: 0.12 };
MATERIALES.a2_oro_sol = { rampa: ['#2a1a05', '#4a300a', '#6e4a10', '#966818', '#bb8a24', '#d9ab3c', '#efcc66'], ruido: 0.1, escala: 0.2, brillo: 0.6 };
MATERIALES.a2_lapis = { rampa: ['#060a16', '#0c1428', '#13203d', '#1c2e54', '#283f6c', '#365183'], ruido: 0.2, escala: 0.25 };
// los dormidos: caliza pálida, vendas viejas y el yeso con que sellaron los nichos
MATERIALES.a2_dorm_sillar = { rampa: ['#1b150e', '#30271b', '#473a29', '#604f3a', '#7a674c', '#948060', '#ab9977'], ruido: 0.22, escala: 0.16, patron: sillar(20, 10) };
MATERIALES.a2_dorm_liso = { rampa: ['#1b150e', '#30271b', '#473a29', '#604f3a', '#7a674c', '#948060', '#ab9977'], ruido: 0.2, escala: 0.14 };
MATERIALES.a2_venda = { rampa: ['#2a2219', '#43392b', '#5d513f', '#786b55', '#93856b', '#ab9e83'], ruido: 0.35, escala: 0.45 };
MATERIALES.a2_yeso = { rampa: ['#2e2a22', '#4a4436', '#675f4c', '#837a63', '#9f957b', '#b8ae93'], ruido: 0.3, escala: 0.3 };
MATERIALES.a2_ocre = { rampa: ['#1d0a05', '#331209', '#4c1b0d', '#672512', '#813018'], ruido: 0.25, escala: 0.3 };
// el rey: basalto pulido, pórfido y oro
MATERIALES.a2_rey_sillar = { rampa: ['#060608', '#0d0d11', '#16161c', '#202028', '#2b2b35', '#383844', '#474756'], ruido: 0.12, escala: 0.16, brillo: 0.35, patron: sillar(36, 18, 0.06) };
MATERIALES.a2_rey_liso = { rampa: ['#060608', '#0d0d11', '#16161c', '#202028', '#2b2b35', '#383844', '#474756'], ruido: 0.1, escala: 0.14, brillo: 0.4 };
MATERIALES.a2_rey_porfido = { rampa: ['#120608', '#210b0e', '#321216', '#451a1e', '#5a2328', '#6f2e33'], ruido: 0.25, escala: 0.3 };
// los escarabajos: quitina tornasol, cera de los nidos y huevos que trasluce
MATERIALES.a2_quitina_p = { rampa: ['#05070a', '#0b1413', '#12221d', '#1a3226', '#29452c', '#4a6234', '#7d8448'], ruido: 0.12, escala: 0.3, brillo: 0.8 };
MATERIALES.a2_nido = { rampa: ['#1a1209', '#2e2112', '#43311c', '#5a4427', '#715833', '#896d42'], ruido: 0.4, escala: 0.35 };
MATERIALES.a2_huevo = { rampa: ['#3b3a24', '#5a5934', '#7b7a46', '#9c9c5c', '#bcbd78', '#d6d79a'], ruido: 0.15, escala: 0.4, brillo: 0.5 };
MATERIALES.a2_luz_huevo = { rampa: ['#6a7a2a', '#93a83c', '#bcd65a', '#e2f588'], ruido: 0.2, escala: 0.4, emite: true };

const rr = (a: Arma, lo: number, hi: number) => lo + a.r() * (hi - lo);
/** Duna o lengua de arena arrimada (cáscara baja). */
function arena(a: Arma, x: number, y: number, rx: number, ry: number, h = 2.5, mat = 'arena'): Pieza {
  const pts: V3[] = [];
  for (let i = 0; i < 10; i++) { const t = (i / 10) * PI * 2, k = 0.85 + a.r() * 0.2; pts.push([x + Math.cos(t) * rx * k, y + Math.sin(t) * ry * k, 0], [x + Math.cos(t) * rx * k * 0.5, y + Math.sin(t) * ry * k * 0.5, h]); }
  return a.poliedro(pts, { mat, tono: -0.12 });
}
/** Muro base de 5 x 1 con zócalo y cornisa de gola (cara de adelante +y). */
function lienzo(a: Arma, ps: Pieza[], sillarM: string, lisoM: string, H = 100, T = 14, L = 80) {
  ps.push(a.caja(0, 0, 0, L, T + 4, 6, { mat: lisoM, tono: -0.08 }), a.caja(0, 0, 0, L, T, H, { mat: sillarM }));
  ps.push(a.caja(0, 0, H, L, T + 2, 3, { mat: lisoM, tono: 0.05 }), a.poliedro([[-L / 2, -T / 2 - 1, H + 3], [L / 2, -T / 2 - 1, H + 3], [-L / 2, T / 2 + 1, H + 3], [L / 2, T / 2 + 1, H + 3], [-L / 2, -T / 2 - 3, H + 8], [L / 2, -T / 2 - 3, H + 8], [-L / 2, T / 2 + 3, H + 8], [L / 2, T / 2 + 3, H + 8]], { mat: lisoM, tono: 0.02 }));
}
/** Nombres cavados en una hilera de la cara +y: grupos de 3 a 7 trazos cortos (cada grupo, un nombre), con huecos entre ellos. */
function nombres(a: Arma, ps: Pieza[], u0: number, u1: number, z: number, cara: number, fresco = 0) {
  let u = u0 + rr(a, 0, 3);
  while (u < u1 - 4) {
    const n = 3 + Math.floor(a.r() * 5), alto = rr(a, 3, 4.6), nuevo = a.r() < fresco;
    for (let i = 0; i < n && u < u1 - 1; i++) {
      const t = a.r(), w = t < 0.6 ? 0.9 : t < 0.85 ? 2.4 : 1.6, h = t < 0.6 ? alto : t < 0.85 ? 0.9 : alto * 0.6;
      const zz = z + (t < 0.6 ? 0 : t < 0.85 ? (a.r() < 0.5 ? 0 : alto - 0.9) : alto * 0.4);
      ps.push(a.caja(u, cara + 0.15, zz, w, 0.5, h, { mat: 'a2_raspado', tono: nuevo ? 0.12 : rr(a, -0.32, -0.12) }));
      u += w + 0.8;
    }
    u += rr(a, 2.2, 4.5);
  }
}

registrar(
  // ---------------------------------------------------------------- el Pozo de los Nombres
  {
    id: 'a2_muro_pozo', nombre: ['Muro del pozo', 'Well wall'], tema: T2, variantes: ['nombres', 'cuerdas', 'gotea', 'raspados', 'borrado'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], T = 14, H = 100;
      lienzo(a, ps, 'a2_pozo_sillar', 'a2_pozo_liso', H, T);
      const raspa = v === 'raspados' || v === 'borrado';
      // las hileras de nombres de los que bajaron: de la rodilla al alcance de la mano (lo de arriba, con escalera)
      const filas = v === 'borrado' ? [18, 26, 34] : [14, 21, 28, 35, 42, 49, 56, 63, 72];
      for (const z of filas) nombres(a, ps, -38, 38, z, T / 2, v === 'nombres' ? 0.15 : 0);
      if (raspa) {
        // los nombres raspados: manchas claras y hondas donde alguien rascó la piedra con lo que tuvo, con las rayas del raspado
        for (let i = 0; i < (v === 'borrado' ? 7 : 4); i++) {
          const x = rr(a, -32, 32), z = rr(a, 14, v === 'borrado' ? 78 : 62), w = rr(a, 8, 18), h = rr(a, 6, 14);
          ps.push(a.caja(x, T / 2 + 0.4, z, w, 0.6, h, { mat: 'a2_raspado', tono: 0.2 }));
          for (let k = 0; k < 5; k++) ps.push(a.caja(x + rr(a, -w / 3, w / 3), T / 2 + 0.8, z + rr(a, 1, h - 2), rr(a, 4, w * 0.8), 0.4, 0.7, { mat: 'a2_pozo_liso', tono: -0.1 }));
        }
        if (v === 'borrado') for (let i = 0; i < 3; i++) ps.push(a.palo([rr(a, -30, 30), T / 2 + 0.6, rr(a, 30, 80)], [rr(a, -30, 30), T / 2 + 0.6, rr(a, 10, 30)], 0.6, { mat: 'a2_ocre', tono: -0.1 }));
      }
      if (v === 'cuerdas') {
        // las sogas de los que bajaron, atadas a argollas de hierro bajo la cornisa, y los cubos que no subieron
        for (const x of [-24, 6, 26]) {
          ps.push(a.cilindro(x, T / 2 + 1, H - 8, 2, 1.2, { mat: 'hierro_oxido', eje: [0, 1, 0] }));
          const largo = rr(a, 40, 80), z1 = H - 8 - largo;
          ps.push(a.palo([x, T / 2 + 2, H - 9], [x + rr(a, -2, 2), T / 2 + 2.5, z1], 0.7, { mat: 'cuerda' }));
          if (a.r() < 0.7) { ps.push(a.cilindro(x, T / 2 + 3.6, z1 - 7, 3.4, 7, { mat: 'madera_vieja', r1: 4.2 }), a.cilindro(x, T / 2 + 3.6, z1 - 3, 4.3, 1, { mat: 'hierro_oxido' })); }
          else ps.push(a.cilindro(x, T / 2 + 4, 0, 4, 2.4, { mat: 'cuerda', tono: -0.08 }), a.cilindro(x, T / 2 + 4, 2.4, 3.4, 2, { mat: 'cuerda', tono: -0.02 }));
        }
      }
      if (v === 'gotea' || v === 'borrado') {
        // el agua que baja por la piedra: un reguero negro brillante y el moho de los lados
        const x = rr(a, -20, 20);
        ps.push(a.caja(x, T / 2 + 0.3, 0, 5, 1, H - 4, { mat: 'a2_agua_negra', tono: 0.1 }));
        ps.push(a.caja(x - 4, T / 2 + 0.2, 0, 4, 0.8, rr(a, 40, 70), { mat: 'a2_moho' }), a.caja(x + 4, T / 2 + 0.2, 0, 3, 0.8, rr(a, 30, 60), { mat: 'a2_moho' }));
        ps.push(a.elipsoide(x, T / 2 + 7, 0.2, 9, 5, 0.6, { mat: 'a2_agua_negra' }));
      }
      // al pie, lo que dejaron: velas o un cubo
      if (a.r() < 0.5) for (let i = 0; i < 3; i++) { const x = rr(a, -34, 34); ps.push(a.cilindro(x, T / 2 + 3, 0, 1.2, rr(a, 3, 7), { mat: 'cera' })); }
      return ps;
    },
  },
  {
    id: 'a2_boca_pozo', nombre: ['La boca del pozo', 'The mouth of the well'], tema: T2, variantes: ['cabria', 'rota'], huella: [4, 4], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], R = 26;
      // el brocal de sillares negros, con la albardilla gastada y el agujero que no tiene fondo
      for (let i = 0; i < 16; i++) {
        const t0 = (i / 16) * PI * 2, t1 = ((i + 1) / 16) * PI * 2, roto = v === 'rota' && i >= 3 && i <= 5;
        const h = roto ? rr(a, 4, 10) : 16 + rr(a, -1, 1);
        const p = (t: number, r: number, z: number): V3 => [Math.cos(t) * r, Math.sin(t) * r, z];
        ps.push(a.poliedro([p(t0, R - 7, 0), p(t1, R - 7, 0), p(t0, R, 0), p(t1, R, 0), p(t0, R - 7, h), p(t1, R - 7, h), p(t0, R + 0.5, h), p(t1, R + 0.5, h)], { mat: 'a2_pozo_sillar', tono: (i % 3) * 0.03 }));
        if (!roto) ps.push(a.poliedro([p(t0, R - 8, h), p(t1, R - 8, h), p(t0, R + 1.5, h), p(t1, R + 1.5, h), p(t0, R - 7.5, h + 3), p(t1, R - 7.5, h + 3), p(t0, R + 1, h + 3), p(t1, R + 1, h + 3)], { mat: 'a2_pozo_liso', tono: 0.08 }));
        // nombres en el brocal
        if (!roto && i % 2 === 0) { const t = (t0 + t1) / 2; for (let k = 0; k < 3; k++) ps.push(a.caja(Math.cos(t) * (R + 0.4), Math.sin(t) * (R + 0.4), 5 + k * 3.4, 0.9, 2.4, 2.4, { mat: 'negro', resta: true, giro: (t * 180) / PI })); }
      }
      ps.push(a.cilindro(0, 0, -30, R - 7.2, 60, { mat: 'negro', resta: true }));
      ps.push(a.cilindro(0, 0, -2, R - 7.5, 2.5, { mat: 'negro' }));
      // el agua negra muy abajo: un brillo
      ps.push(a.elipsoide(-3, 2, 1, 6, 3, 0.4, { mat: 'a2_agua_negra', tono: 0.3 }));
      if (v === 'cabria') {
        // la cabria de vigas con el torno, la soga que baja y el cubo colgado a medio camino
        for (const [x, y] of [[-R - 2, -6], [-R - 2, 6], [R + 2, -6], [R + 2, 6]] as [number, number][]) ps.push(a.palo([x, y, 0], [Math.sign(x) * 12, 0, 70], 2.2, { mat: 'madera_vieja' }));
        ps.push(a.palo([-16, 0, 66], [16, 0, 66], 2.6, { mat: 'madera_vieja', tono: 0.05 }));
        ps.push(a.cilindro(-8, 0, 66, 4.5, 16, { mat: 'madera', eje: [1, 0, 0] }), a.cilindro(-8, 0, 66, 5, 2, { mat: 'hierro_oxido', eje: [1, 0, 0] }));
        ps.push(a.palo([0, 0, 62], [0, 0, 20], 0.8, { mat: 'cuerda' }), a.cilindro(0, 0, 13, 4, 7, { mat: 'madera_vieja', r1: 4.8 }), a.cilindro(0, 0, 17, 5, 1, { mat: 'hierro_oxido' }));
        ps.push(a.palo([18, 0, 66], [24, 0, 74], 1.4, { mat: 'madera_vieja' }));
      } else {
        // la cabria caída: una viga cruzada sobre el brocal roto y la soga cortada
        ps.push(a.palo([-34, 18, 2], [30, -12, 18], 2.4, { mat: 'madera_vieja', tono: -0.05 }), a.palo([20, 22, 0], [6, 30, 22], 2, { mat: 'madera_vieja' }));
        ps.push(a.cilindro(28, 20, 0, 5, 2.2, { mat: 'cuerda', tono: -0.1 }), a.cilindro(28, 20, 2.2, 4, 2, { mat: 'cuerda' }));
      }
      // cubos, sogas y velas de los que esperaban arriba
      ps.push(a.cilindro(R + 6, 14, 0, 3.6, 7, { mat: 'madera_vieja', r1: 4.4, incl: 70, giro: 30 }));
      for (let i = 0; i < 5; i++) { const t = rr(a, 0.2, 1.6); ps.push(a.cilindro(Math.cos(t) * (R + 5), Math.sin(t) * (R + 5), 0, 1.2, rr(a, 3, 8), { mat: 'cera' })); }
      return ps;
    },
  },
  {
    id: 'a2_cuerdas_pozo', nombre: ['Sogas y cubos', 'Ropes and buckets'], tema: T2, variantes: ['cubos', 'rollo', 'cubo_roto'], huella: [1, 1], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      if (v !== 'cubo_roto') for (let k = 0; k < 3; k++) ps.push(a.cilindro(rr(a, -2, 2), rr(a, -2, 2), k * 1.6, 6 - k * 1.1, 1.6, { mat: 'cuerda', tono: -0.08 + k * 0.04 }));
      if (v === 'cubos') { ps.push(a.cilindro(5, -3, 0, 3.4, 7, { mat: 'madera_vieja', r1: 4.2 }), a.cilindro(5, -3, 3, 4.3, 1, { mat: 'hierro_oxido' })); ps.push(a.cilindro(-5, 4, 0, 3, 6, { mat: 'madera_vieja', r1: 3.6, incl: 80, giro: -40 })); }
      if (v === 'cubo_roto') { ps.push(a.cilindro(0, 0, 0, 3.6, 5, { mat: 'madera_vieja', r1: 4, incl: 75, giro: 20 })); for (let i = 0; i < 4; i++) ps.push(a.caja(rr(a, -6, 6), rr(a, -6, 6), 0, 1.4, 5, 0.8, { mat: 'madera_vieja', giro: rr(a, 0, 180) })); ps.push(a.palo([-6, -6, 0.5], [4, 2, 0.5], 0.7, { mat: 'cuerda' })); }
      return ps;
    },
  },
  {
    id: 'a2_charca_negra', nombre: ['Charca de agua negra', 'Pool of black water'], tema: T2, variantes: ['quieta', 'velas'], huella: [3, 3], bloquea: false, plano: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      const pts: V3[] = []; for (let i = 0; i < 14; i++) { const t = (i / 14) * PI * 2, k = 0.8 + a.r() * 0.3; pts.push([Math.cos(t) * 22 * k, Math.sin(t) * 20 * k, 0], [Math.cos(t) * 22 * k, Math.sin(t) * 20 * k, 0.5]); }
      ps.push(a.poliedro(pts, { mat: 'a2_agua_negra' }));
      ps.push(a.elipsoide(-6, -4, 0.6, 7, 2, 0.2, { mat: 'a2_agua_negra', tono: 0.35 }));
      if (v === 'velas') for (let i = 0; i < 6; i++) { const t = (i / 6) * PI * 2 + 0.3; ps.push(a.cilindro(Math.cos(t) * 23, Math.sin(t) * 21, 0, 1.1, rr(a, 2, 5), { mat: 'cera' })); }
      return { piezas: ps, sinSombra: true };
    },
  },
  {
    id: 'a2_piedra_nombres', nombre: ['Piedra de los nombres', 'Stone of names'], tema: T2, variantes: ['nombres', 'raspada'], huella: [1, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.caja(0, 0, 0, 14, 8, 30, { mat: 'a2_pozo_liso', giro: rr(a, -6, 6) }), a.poliedro([[-7, -4, 30], [7, -4, 30], [-7, 4, 30], [7, 4, 30], [0, -4, 36], [0, 4, 36]], { mat: 'a2_pozo_liso' }));
      for (let z = 5; z < 27; z += 4.2) nombres(a, ps, -6, 6, z, 4, 0);
      if (v === 'raspada') ps.push(a.caja(0, 4.3, 6, 11, 0.6, 18, { mat: 'a2_raspado', tono: 0.2 }));
      ps.push(a.cilindro(5, 7, 0, 1, 4, { mat: 'cera' }));
      return ps;
    },
  },
  // ---------------------------------------------------------------- el Templo del Sol Caído
  {
    id: 'a2_muro_sol', nombre: ['Muro del templo del sol', 'Sun temple wall'], tema: T2, variantes: ['disco', 'rayos', 'friso', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], T = 14, H = 100, F = T / 2;
      lienzo(a, ps, 'a2_sol_sillar', 'a2_sol_liso', H, T);
      // la banda de oro bajo la cornisa con el friso de soles chicos y el esmalte azul
      ps.push(a.caja(0, F + 0.4, H - 12, 80, 1.4, 9, { mat: 'a2_lapis' }));
      for (let i = 0; i < 8; i++) ps.push(a.cilindro(-35 + i * 10, F + 1, H - 7.5, 3, 1.4, { mat: 'a2_oro_sol', eje: [0, 1, 0] }));
      ps.push(a.caja(0, F + 0.6, H - 13.5, 80, 1.6, 1.5, { mat: 'a2_oro_sol', tono: -0.05 }), a.caja(0, F + 0.6, H - 3, 80, 1.6, 1.5, { mat: 'a2_oro_sol', tono: -0.05 }));
      if (v === 'disco' || v === 'roto') {
        // el gran disco del sol en relieve, con su anillo y doce rayos que bajan en abanico
        const zc = 54;
        for (let k = 0; k < 12; k++) {
          const t = -PI * 0.08 - (k / 11) * PI * 0.84, L = k % 2 ? 26 : 32;
          if (v === 'roto' && k > 7) continue;
          ps.push(a.palo([Math.cos(t) * 16, F + 1, zc + Math.sin(t) * 16], [Math.cos(t) * L, F + 1, zc + Math.sin(t) * L], k % 2 ? 1.2 : 1.8, { mat: 'a2_oro_sol', r1: 0.5, tono: -0.08 }));
        }
        ps.push(a.cilindro(0, F, zc, 16, 2.6, { mat: 'a2_sol_liso', eje: [0, 1, 0] }), a.cilindro(0, F + 1.6, zc, 14, 1.8, { mat: 'a2_oro_sol', eje: [0, 1, 0] }), a.cilindro(0, F + 2.6, zc, 6, 1.6, { mat: 'a2_oro_sol', eje: [0, 1, 0], tono: 0.1 }));
        if (v === 'roto') ps.push(a.poliedro([[2, F - 3, zc + 2], [20, F - 3, zc - 6], [6, F + 6, zc - 18], [22, F + 6, zc + 10], [14, F + 6, zc - 2]], { mat: 'negro', resta: true }));
      }
      if (v === 'rayos') {
        // tres columnas de luz en relieve que bajan del techo: el sol que entraba
        for (const x of [-24, 0, 24]) { ps.push(a.poliedro([[x - 3, F, H - 14], [x + 3, F, H - 14], [x - 7, F, 8], [x + 7, F, 8], [x - 3, F + 1.6, H - 14], [x + 3, F + 1.6, H - 14], [x - 7, F + 1.6, 8], [x + 7, F + 1.6, 8]], { mat: 'a2_oro_sol', tono: -0.14 })); }
        for (const x of [-12, 12]) for (let z = 16; z < 80; z += 9) ps.push(a.cilindro(x, F + 0.6, z, 1.8, 1, { mat: 'negro', resta: true, eje: [0, 1, 0] }));
      }
      if (v === 'friso') {
        // la procesión: los fieles de perfil subiendo hacia el sol, en dos bandas talladas
        for (const z0 of [22, 54]) {
          ps.push(a.caja(0, F + 0.3, z0 - 2, 76, 1, 24, { mat: 'a2_sol_liso', tono: 0.06 }));
          for (let i = 0; i < 7; i++) { const x = -32 + i * 10.5; ps.push(a.caja(x, F + 0.8, z0, 3, 1.2, 12, { mat: 'a2_ocre' }), a.esfera(x + 0.5, F + 1, z0 + 14.5, 2.2, { mat: 'a2_ocre' }), a.palo([x + 1.5, F + 1, z0 + 9], [x + 5, F + 1, z0 + 14], 0.8, { mat: 'a2_ocre' })); }
          ps.push(a.cilindro(36, F + 1, z0 + 12, 3.5, 1.4, { mat: 'a2_oro_sol', eje: [0, 1, 0] }));
        }
      }
      if (v === 'roto') for (let i = 0; i < 6; i++) ps.push(a.caja(rr(a, -10, 34), F + rr(a, 4, 14), 0, rr(a, 7, 14), rr(a, 6, 10), rr(a, 4, 8), { mat: 'a2_sol_sillar', giro: rr(a, -30, 30), incl: rr(a, -12, 12) }));
      ps.push(arena(a, rr(a, -26, 26), F + 3, 14, 4, 3));
      return ps;
    },
  },
  {
    id: 'a2_columna_sol', nombre: ['Columna del sol', 'Sun column'], tema: T2, variantes: ['disco', 'rota'], huella: [2, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], H = v === 'rota' ? rr(a, 38, 52) : 100;
      ps.push(a.caja(0, 0, 0, 26, 26, 6, { mat: 'a2_sol_sillar' }), a.cilindro(0, 0, 6, 11, 5, { mat: 'a2_sol_liso', r1: 9.5 }));
      ps.push(a.cilindro(0, 0, 11, 8.5, H - 11, { mat: 'a2_sol_liso', r1: 7.6 }));
      // estrías y bandas de oro y lapislázuli
      for (let k = 0; k < 10; k++) { const t = (k / 10) * PI * 2; ps.push(a.caja(Math.cos(t) * 8.2, Math.sin(t) * 8.2, 14, 1, 1, Math.min(H - 20, 70), { mat: 'negro', resta: true, giro: (t * 180) / PI })); }
      for (const z of [20, 24]) if (z < H - 4) ps.push(a.cilindro(0, 0, z, 8.7, 2, { mat: z === 20 ? 'a2_oro_sol' : 'a2_lapis' }));
      if (v === 'disco') {
        ps.push(a.cilindro(0, 0, H - 6, 8, 6, { mat: 'a2_oro_sol', r1: 12, tono: -0.1 }), a.caja(0, 0, H, 28, 28, 5, { mat: 'a2_sol_sillar' }));
        // el disco del sol en lo alto, mirando a la sala (+x +y), con sus rayos
        const c: V3 = [5, 5, H - 18], d: V3 = [Math.SQRT1_2, Math.SQRT1_2, 0];
        ps.push(a.cilindro(c[0], c[1], c[2], 11, 2, { mat: 'a2_oro_sol', eje: d }), a.cilindro(c[0] + 1.4, c[1] + 1.4, c[2], 5, 1.4, { mat: 'a2_oro_sol', eje: d, tono: 0.12 }));
        for (let k = 0; k < 8; k++) { const t = (k / 8) * PI * 2, ux = -Math.SQRT1_2 * Math.cos(t), uy = Math.SQRT1_2 * Math.cos(t), uz = Math.sin(t); ps.push(a.palo([c[0] + ux * 11, c[1] + uy * 11, c[2] + uz * 11], [c[0] + ux * 16, c[1] + uy * 16, c[2] + uz * 16], 1.3, { mat: 'a2_oro_sol', r1: 0.4 })); }
      } else {
        ps.push(a.poliedro([[-9, -9, H - 8], [9, -9, H - 2], [-9, 9, H - 5], [9, 9, H + 2], [0, 0, H + 4]], { mat: 'negro', resta: true }));
        ps.push(a.cilindro(14, 12, 6, 7.6, 22, { mat: 'a2_sol_liso', eje: [0.6, 0.8, 0.05] }), a.cilindro(-2, 22, 0, 10, 2.4, { mat: 'a2_oro_sol', eje: [0.2, 1, 0.3], tono: -0.15 }));
        ps.push(arena(a, 6, 14, 16, 8, 3));
      }
      return ps;
    },
  },
  {
    id: 'a2_altar_sol', nombre: ['Altar que mira hacia abajo', 'The altar that faces down'], tema: T2, variantes: ['abajo', 'roto'], huella: [3, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // gradas, la mesa de oro y el sol vuelto hacia el piso: el disco tumbado boca abajo y sus rayos clavados en la piedra
      ps.push(a.caja(0, 0, 0, 50, 34, 4, { mat: 'a2_sol_sillar' }), a.caja(0, 0, 4, 44, 28, 4, { mat: 'a2_sol_sillar', tono: 0.04 }));
      ps.push(a.caja(0, -2, 8, 32, 16, 14, { mat: 'a2_sol_liso' }), a.caja(0, -2, 22, 36, 20, 3, { mat: 'a2_oro_sol', tono: -0.1 }));
      for (let i = 0; i < 5; i++) ps.push(a.cilindro(-12 + i * 6, 6.2, 14, 2, 1, { mat: 'a2_lapis', eje: [0, 1, 0] }));
      const roto = v === 'roto';
      ps.push(a.cilindro(0, -2, 25, roto ? 0 : 13, 2.2, { mat: 'a2_oro_sol', r1: roto ? 0 : 13 }));
      if (!roto) for (let k = 0; k < 12; k++) { const t = (k / 12) * PI * 2; ps.push(a.palo([Math.cos(t) * 12, -2 + Math.sin(t) * 12, 26], [Math.cos(t) * 19, -2 + Math.sin(t) * 19, 23], 1.3, { mat: 'a2_oro_sol', r1: 0.5, tono: -0.05 })); }
      else { ps.push(a.cilindro(18, 12, 0, 13, 2, { mat: 'a2_oro_sol', eje: [0.3, 0.4, 1], tono: -0.12 })); ps.push(a.poliedro([[-4, -2, 25], [6, -2, 25], [0, 6, 25], [2, 0, 32]], { mat: 'a2_oro_sol' })); }
      // la sangre del que rezó hacia abajo, las velas y los cuencos
      ps.push(a.elipsoide(-6, 14, 4.3, 9, 4, 0.3, { mat: 'sangre', tono: -0.2 }));
      for (const [x, y] of [[-21, 12], [-17, 14], [20, 12], [16, 14]]) ps.push(a.cilindro(x, y, 4, 1.2, rr(a, 4, 8), { mat: 'cera' }));
      ps.push(a.cilindro(10, 13, 4, 3.4, 2, { mat: 'a2_oro_sol', r1: 2.4 }));
      return ps;
    },
  },
  {
    id: 'a2_disco_caido', nombre: ['Sol caído', 'Fallen sun'], tema: T2, variantes: ['caido', 'partido'], huella: [3, 3], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // el sol del techo caído de canto, medio hundido en las losas que rompió
      const e: V3 = [Math.SQRT1_2, Math.SQRT1_2, 0.35];
      ps.push(a.cilindro(-2, -2, 6, 22, 4, { mat: 'a2_oro_sol', eje: e, tono: -0.08 }), a.cilindro(-0.4, -0.4, 6.8, 9, 1.6, { mat: 'a2_oro_sol', eje: e, tono: 0.08 }));
      ps.push(a.caja(-2, -2, -8, 52, 52, 10, { mat: 'negro', resta: true }));
      if (v === 'partido') ps.push(a.poliedro([[-10, -10, 0], [10, -10, 0], [-2, 4, 30], [6, 0, 30], [0, -6, 14]], { mat: 'negro', resta: true }), a.cilindro(18, 10, 0, 10, 2.4, { mat: 'a2_oro_sol', eje: [0.1, 0.2, 1], tono: -0.15 }));
      for (let i = 0; i < 8; i++) ps.push(a.caja(rr(a, -22, 22), rr(a, -22, 22), 0, rr(a, 5, 12), rr(a, 4, 9), rr(a, 2, 5), { mat: 'a2_piedra_sol', giro: rr(a, 0, 90), incl: rr(a, -20, 20) }));
      ps.push(arena(a, 14, 16, 12, 8, 2.5));
      return ps;
    },
  },
  // ---------------------------------------------------------------- la Galería de los Dormidos
  {
    id: 'a2_muro_dormidos', nombre: ['Muro de los dormidos', 'Wall of the sleepers'], tema: T2, variantes: ['loculos', 'vendas', 'sellado', 'vacios'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], T = 14, H = 100, F = T / 2;
      lienzo(a, ps, 'a2_dorm_sillar', 'a2_dorm_liso', H, T);
      // tres hileras de nichos de a tres: en cada uno un dormido acostado, envuelto, con la cabeza hacia la izquierda
      for (const [z, hh] of [[10, 20], [38, 20], [66, 18]] as [number, number][]) {
        for (const x of [-25, 0, 25]) {
          const sellado = v === 'sellado' && a.r() < 0.6, vacio = v === 'vacios' && a.r() < 0.6;
          ps.push(a.caja(x, F, z, 21, 12, hh, { mat: 'negro', resta: true }));
          ps.push(a.caja(x, F - 0.5, z - 1.6, 23, 2, 1.6, { mat: 'a2_dorm_liso', tono: 0.08 }));
          if (sellado) { ps.push(a.caja(x, F - 1, z, 21, 1.6, hh, { mat: 'a2_yeso' })); ps.push(a.cilindro(x, F + 0.8, z + hh / 2, 2.8, 0.6, { mat: 'a2_ocre', eje: [0, 1, 0] }), a.esfera(x, F + 1, z + hh / 2, 1.1, { mat: 'negro' })); continue; }
          if (vacio) { for (let i = 0; i < 3; i++) ps.push(a.caja(x + rr(a, -7, 7), F - 3, z, rr(a, 2, 5), 1.6, 1.2, { mat: 'hueso', giro: rr(a, 0, 90) })); continue; }
          const y = F - 4;
          ps.push(a.elipsoide(x + 1, y, z + 3.6, 8.8, 3.4, 3, { mat: 'a2_venda', tono: -0.06 }), a.elipsoide(x - 8.4, y, z + 4, 2.6, 2.8, 2.6, { mat: 'a2_venda', tono: -0.02 }));
          for (let k = 0; k < 5; k++) ps.push(a.cilindro(x - 5 + k * 3.4, y, z + 3.6, 3.2 - Math.abs(k - 2) * 0.3, 0.7, { mat: 'a2_venda', eje: [1, 0.3 * (k % 2 ? 1 : -1), 0], tono: -0.18 }));
          if (v === 'vendas' && a.r() < 0.6) ps.push(a.palo([x + rr(a, -4, 4), F + 0.5, z + 2], [x + rr(a, -6, 6), F + 3, z - rr(a, 6, 14)], 1, { mat: 'a2_venda', r1: 0.6, tono: -0.1 }));
        }
        // la línea pintada de ocre bajo cada hilera
        ps.push(a.caja(0, F + 0.3, z - 4, 78, 0.8, 1, { mat: 'a2_ocre' }));
      }
      if (v === 'vendas') for (let i = 0; i < 2; i++) ps.push(a.elipsoide(rr(a, -30, 30), F + 5, 0.6, rr(a, 5, 9), rr(a, 2, 4), 0.8, { mat: 'a2_venda', tono: -0.08 }));
      return ps;
    },
  },
  {
    id: 'a2_lecho_dormido', nombre: ['Lecho de un dormido', 'Sleeper\'s bier'], tema: T2, variantes: ['dormido', 'dos', 'vacio'], huella: [3, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // la losa sobre dos patas de piedra, con el dormido tendido y su vela; a lo largo de x (la galería)
      ps.push(a.caja(-16, 0, 0, 8, 18, 12, { mat: 'a2_dorm_sillar' }), a.caja(16, 0, 0, 8, 18, 12, { mat: 'a2_dorm_sillar' }), a.caja(0, 0, 12, 46, 22, 4, { mat: 'a2_dorm_liso', tono: 0.05 }));
      ps.push(a.caja(0, 11.2, 13, 40, 0.8, 1.6, { mat: 'a2_ocre' }));
      const dormido = (y: number, s: number) => {
        ps.push(a.elipsoide(2, y, 19.5, 17 * s, 5 * s, 3.4 * s, { mat: 'a2_venda', tono: -0.05 }), a.elipsoide(-17 * s, y, 20, 3.4 * s, 3.6 * s, 3.4 * s, { mat: 'a2_venda' }));
        ps.push(a.elipsoide(-4, y, 22.4, 4 * s, 4.4 * s, 1.4 * s, { mat: 'a2_venda', tono: -0.1 })); // las manos cruzadas
        for (let k = 0; k < 7; k++) ps.push(a.cilindro(-12 * s + k * 4.6 * s, y, 19.5, 3.8 * s - Math.abs(k - 3) * 0.25, 0.8, { mat: 'a2_venda', eje: [1, (k % 2 ? 0.35 : -0.35), 0], tono: -0.2 }));
        ps.push(a.elipsoide(-18 * s, y + 0.5, 21.6, 1.2, 2.4, 1, { mat: 'tumba_pintura', tono: 0.05 }));
      };
      if (v === 'dormido') dormido(0, 1);
      if (v === 'dos') { dormido(-4.5, 0.8); dormido(5, 0.75); }
      if (v === 'vacio') { ps.push(a.palo([-14, 4, 17], [16, -3, 17], 1.4, { mat: 'a2_venda', tono: -0.15 })); ps.push(a.elipsoide(18, 14, 0.5, 9, 4, 0.8, { mat: 'a2_venda', tono: -0.1 })); }
      ps.push(a.cilindro(-21, -8, 16, 1.2, 5, { mat: 'cera' }), a.cilindro(20, 8, 16, 1.2, 3, { mat: 'cera' }));
      return ps;
    },
  },
  {
    id: 'a2_vendas', nombre: ['Vendas sueltas', 'Loose wrappings'], tema: T2, variantes: ['suelo', 'enredo'], huella: [2, 2], bloquea: false, plano: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      for (let i = 0; i < (v === 'enredo' ? 7 : 4); i++) { const x = rr(a, -12, 12), y = rr(a, -12, 12), t = rr(a, 0, PI); ps.push(a.palo([x, y, 0.6], [x + Math.cos(t) * rr(a, 8, 18), y + Math.sin(t) * rr(a, 8, 18), 0.6], rr(a, 0.9, 1.6), { mat: 'a2_venda', tono: rr(a, -0.2, 0) })); }
      if (v === 'enredo') ps.push(a.elipsoide(0, 0, 1.4, 6, 5, 1.8, { mat: 'a2_venda', tono: -0.1 }), a.caja(5, -4, 0, 3, 1.6, 1, { mat: 'hueso', giro: 30 }));
      return { piezas: ps, sinSombra: true };
    },
  },
  // ---------------------------------------------------------------- la Cámara del Rey sin Sombra
  {
    id: 'a2_muro_rey', nombre: ['Muro del rey', 'King\'s wall'], tema: T2, variantes: ['friso', 'rey', 'oro', 'roto'], huella: [5, 1], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], T = 14, H = 104, F = T / 2;
      lienzo(a, ps, 'a2_rey_sillar', 'a2_rey_liso', H, T);
      // el zócalo de pórfido y las dos bandas de oro de toda la cámara
      ps.push(a.caja(0, F + 0.3, 6, 80, 1, 12, { mat: 'a2_rey_porfido' }));
      for (const z of [18, H - 14]) ps.push(a.caja(0, F + 0.6, z, 80, 1.4, 2.2, { mat: 'a2_oro_sol', tono: -0.08 }));
      if (v === 'rey') {
        // el rey en relieve de oro, de frente, con la corona alta y el cetro. El muro tiene donde debería ir su sombra
        // pintada (todos los demás la llevan en negro detrás): un hueco claro con la forma del cuerpo y nada adentro
        const x = 0, z0 = 22;
        ps.push(a.caja(x + 10, F + 0.2, z0, 13, 0.6, 58, { mat: 'a2_raspado', tono: 0.1 }));
        ps.push(a.caja(x, F + 1, z0, 10, 1.6, 34, { mat: 'a2_oro_sol', tono: -0.1 }), a.caja(x, F + 1.2, z0 + 34, 13, 1.6, 14, { mat: 'a2_oro_sol' }));
        ps.push(a.esfera(x, F + 1.4, z0 + 52, 4, { mat: 'a2_oro_sol', tono: 0.05 }), a.poliedro([[x - 4, F + 1, z0 + 55], [x + 4, F + 1, z0 + 55], [x - 2.5, F + 2.4, z0 + 66], [x + 2.5, F + 2.4, z0 + 66], [x, F + 2, z0 + 68]], { mat: 'a2_oro_sol', tono: 0.1 }));
        ps.push(a.palo([x - 8, F + 2, z0 + 10], [x - 8, F + 2, z0 + 60], 1, { mat: 'a2_oro_sol' }), a.esfera(x - 8, F + 2, z0 + 61, 2, { mat: 'a2_lapis' }));
        // los súbditos en negro, de perfil, con sus sombras negras detrás
        for (const s of [-1, 1]) for (let i = 0; i < 2; i++) {
          const xx = x + s * (20 + i * 11);
          ps.push(a.caja(xx + s * 3, F + 0.4, z0, 5, 0.6, 32, { mat: 'negro' }), a.caja(xx, F + 0.9, z0, 5, 1.2, 30, { mat: 'a2_ocre' }), a.esfera(xx, F + 1, z0 + 33, 2.6, { mat: 'a2_ocre' }));
        }
      }
      if (v === 'oro') {
        // paneles de oro batido con el cartucho del rey: el nombre está raspado
        for (const x of [-26, 0, 26]) { ps.push(a.caja(x, F + 0.5, 26, 20, 1.2, 56, { mat: 'a2_oro_sol', tono: -0.18 })); ps.push(a.cilindro(x, F + 1, 54, 6, 1, { mat: 'a2_rey_liso', eje: [0, 1, 0] })); ps.push(a.caja(x, F + 1.6, 46, 6, 1, 16, { mat: 'a2_raspado', resta: true })); }
      }
      if (v === 'friso') {
        // la fila de reyes antes que él, cada uno con su sombra negra pintada en el muro
        for (let i = 0; i < 5; i++) { const x = -32 + i * 16; ps.push(a.caja(x + 3, F + 0.4, 24, 6, 0.6, 40, { mat: 'negro' }), a.caja(x, F + 0.9, 24, 5, 1.2, 36, { mat: 'a2_oro_sol', tono: -0.15 }), a.esfera(x, F + 1, 63, 2.8, { mat: 'a2_oro_sol', tono: -0.1 }), a.caja(x, F + 1, 66, 4, 1, 5, { mat: 'a2_lapis' })); }
      }
      if (v === 'roto') {
        ps.push(a.poliedro([[10, -T, H + 12], [42, -T, H + 12], [10, T, H + 12], [42, T, H + 12], [42, -T, 34], [42, T, 46], [24, 0, 74]], { mat: 'negro', resta: true }));
        for (let i = 0; i < 6; i++) ps.push(a.caja(rr(a, 14, 38), F + rr(a, 4, 14), 0, rr(a, 7, 14), rr(a, 6, 10), rr(a, 4, 8), { mat: 'a2_rey_sillar', giro: rr(a, -30, 30), incl: rr(a, -12, 12) }));
      }
      return ps;
    },
  },
  {
    id: 'a2_estatua_rey', nombre: ['Estatua del rey sin sombra', 'Statue of the shadowless king'], tema: T2, variantes: ['en_pie', 'sin_rostro', 'caida'], huella: [2, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], m = 'a2_rey_liso';
      ps.push(a.caja(0, 0, 0, 28, 28, 10, { mat: 'a2_rey_porfido' }), a.caja(0, 0, 10, 30, 30, 3, { mat: 'a2_oro_sol', tono: -0.12 }));
      if (v === 'caida') {
        // se partió en las rodillas: los pies siguen en el pedestal y el cuerpo yace de espaldas al lado, la corona rodada
        ps.push(a.caja(-6, -6, 13, 10, 8, 4, { mat: m }), a.caja(-6, -8, 13, 9, 6, 10, { mat: m }), a.poliedro([[-11, -11, 23], [-1, -11, 26], [-11, -5, 24], [-1, -5, 27]], { mat: m, tono: 0.1 }));
        const g = 35;
        ps.push(a.caja(4, 12, 0, 26, 11, 8, { mat: m, giro: g }), a.caja(5, 13, 7.5, 14, 10, 1.6, { mat: 'a2_oro_sol', tono: -0.1, giro: g }));
        ps.push(a.caja(15, 20, 0, 11, 13, 9, { mat: 'a2_lapis', giro: g }), a.elipsoide(16, 21, 9.5, 4, 3.2, 2.6, { mat: 'a2_oro_sol', tono: 0.08 }));
        ps.push(a.cilindro(-12, 16, 3, 4.2, 11, { mat: 'a2_oro_sol', r1: 2, eje: [-0.5, 0.8, 0.1] }));
        for (let i = 0; i < 4; i++) ps.push(a.caja(rr(a, -14, 14), rr(a, 4, 16), 0, rr(a, 3, 6), rr(a, 3, 5), rr(a, 2, 4), { mat: m, giro: rr(a, 0, 90) }));
        return ps;
      }
      const z0 = 13;
      // de pie, rígido, los pies juntos, el faldellín de oro, los brazos cruzados con cetro y mayal
      ps.push(a.caja(0, 2, z0, 10, 8, 4, { mat: m }), a.caja(0, 0, z0, 9, 6, 26, { mat: m }));
      ps.push(a.poliedro([[-7, -4, z0 + 20], [7, -4, z0 + 20], [-7, 4.5, z0 + 20], [7, 4.5, z0 + 20], [-6, -3.6, z0 + 34], [6, -3.6, z0 + 34], [-6, 3.6, z0 + 34], [6, 3.6, z0 + 34]], { mat: 'a2_oro_sol', tono: -0.12 }));
      ps.push(a.poliedro([[-6, -3.4, z0 + 34], [6, -3.4, z0 + 34], [-6, 3.4, z0 + 34], [6, 3.4, z0 + 34], [-10, -4, z0 + 54], [10, -4, z0 + 54], [-10, 4, z0 + 54], [10, 4, z0 + 54]], { mat: m }));
      ps.push(a.elipsoide(0, 0.8, z0 + 52, 10, 5, 3.4, { mat: 'a2_oro_sol' }), a.elipsoide(0, 1, z0 + 52.4, 7, 4.6, 2.8, { mat: 'a2_lapis' }));
      ps.push(a.palo([-9, 3, z0 + 50], [5, 5, z0 + 40], 2.2, { mat: m }), a.palo([9, 3, z0 + 50], [-5, 5, z0 + 42], 2.2, { mat: m }));
      ps.push(a.palo([3, 6, z0 + 30], [-4, 7, z0 + 58], 0.9, { mat: 'a2_oro_sol' }), a.palo([-3, 6, z0 + 32], [5, 7, z0 + 57], 0.9, { mat: 'a2_lapis' }));
      // la cabeza con el tocado a rayas y la corona alta
      ps.push(a.cilindro(0, 0, z0 + 54, 2.8, 4, { mat: m }));
      ps.push(a.poliedro([[-7, -3, z0 + 58], [7, -3, z0 + 58], [-8, 3, z0 + 50], [8, 3, z0 + 50], [-5, -2, z0 + 68], [5, -2, z0 + 68], [-4, 3, z0 + 66], [4, 3, z0 + 66]], { mat: 'a2_lapis' }));
      for (const z of [z0 + 56, z0 + 60, z0 + 64]) ps.push(a.caja(0, 0.2, z, 15, 7, 1.2, { mat: 'a2_oro_sol', tono: -0.05 }));
      ps.push(a.elipsoide(0, 1.8, z0 + 62, 4, 3.2, 4.4, { mat: v === 'sin_rostro' ? 'a2_raspado' : 'a2_oro_sol', tono: v === 'sin_rostro' ? -0.1 : 0.1 }));
      if (v === 'sin_rostro') ps.push(a.caja(0, 4, z0 + 59, 6, 2, 6, { mat: 'negro', resta: true }));
      else { ps.push(a.esfera(-1.4, 4.6, z0 + 63, 0.6, { mat: 'negro' }), a.esfera(1.4, 4.6, z0 + 63, 0.6, { mat: 'negro' })); }
      ps.push(a.cilindro(0, 0, z0 + 68, 4.6, 12, { mat: 'a2_oro_sol', r1: 2.2, tono: 0.05 }), a.esfera(0, 0, z0 + 80, 2.4, { mat: 'a2_oro_sol', tono: 0.1 }));
      return ps;
    },
  },
  {
    id: 'a2_tesoro_rey', nombre: ['Tesoro del rey', 'The king\'s treasure'], tema: T2, variantes: ['monton', 'cofres', 'derramado'], huella: [2, 2], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      const monton = (x: number, y: number, r: number, h: number) => { const pts: V3[] = []; for (let i = 0; i < 10; i++) { const t = (i / 10) * PI * 2; pts.push([x + Math.cos(t) * r, y + Math.sin(t) * r * 0.9, 0], [x + Math.cos(t) * r * 0.35, y + Math.sin(t) * r * 0.3, h]); } ps.push(a.poliedro(pts, { mat: 'a2_oro_sol', tono: -0.05 })); for (let i = 0; i < 8; i++) ps.push(a.cilindro(x + rr(a, -r, r), y + rr(a, -r, r) * 0.8, rr(a, 0, h * 0.6), 1.6, 0.5, { mat: 'a2_oro_sol', tono: 0.15, eje: [rr(a, -1, 1), rr(a, -1, 1), 1] })); };
      if (v === 'monton') { monton(-2, -2, 14, 8); ps.push(a.cilindro(8, 6, 0, 3, 9, { mat: 'a2_oro_sol', r1: 4.2 }), a.cilindro(8, 6, 9, 2, 3, { mat: 'a2_oro_sol', r1: 3 })); ps.push(a.esfera(-6, 2, 8, 1.6, { mat: 'a2_lapis' }), a.esfera(2, -6, 6, 1.4, { mat: 'sangre', tono: 0.2 })); }
      if (v === 'cofres') { ps.push(a.caja(-4, -4, 0, 18, 11, 9, { mat: 'madera_lisa', giro: 15 }), a.caja(-4, -4, 9, 19, 12, 1.4, { mat: 'a2_oro_sol', giro: 15 })); monton(10, 8, 7, 4); ps.push(a.caja(-6, 12, 0, 10, 7, 6, { mat: 'a2_lapis', giro: -20 })); }
      if (v === 'derramado') { monton(0, 0, 10, 3); ps.push(a.cilindro(10, -6, 4, 4, 9, { mat: 'a2_oro_sol', eje: [1, 0.3, 0.1], r1: 2.6 })); for (let i = 0; i < 12; i++) ps.push(a.cilindro(rr(a, -14, 16), rr(a, -14, 16), 0, 1.5, 0.5, { mat: 'a2_oro_sol', tono: 0.1 })); }
      return ps;
    },
  },
  // ---------------------------------------------------------------- la Cueva de los Escarabajos
  {
    id: 'a2_nido_escarabajo', nombre: ['Nido de escarabajos', 'Scarab nest'], tema: T2, variantes: ['nido', 'abierto'], huella: [3, 3], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // un montículo de arena amasada con baba, lleno de bocas, con huesos metidos y la quitina de las mudas encima
      const pts: V3[] = []; for (let i = 0; i < 12; i++) { const t = (i / 12) * PI * 2, k = 0.85 + a.r() * 0.25; pts.push([Math.cos(t) * 22 * k, Math.sin(t) * 20 * k, 0], [Math.cos(t) * 13 * k, Math.sin(t) * 12 * k, 14 + a.r() * 4], [Math.cos(t) * 5, Math.sin(t) * 5, 24 + a.r() * 4]); }
      ps.push(a.poliedro(pts, { mat: 'a2_nido' }));
      for (let i = 0; i < 9; i++) { const t = rr(a, -0.6, 2.4), r = rr(a, 10, 18), z = rr(a, 4, 18); ps.push(a.elipsoide(Math.cos(t) * r, Math.sin(t) * r, z, 2.8, 2.8, 2.2, { mat: 'negro', resta: true })); }
      if (v === 'abierto') { ps.push(a.elipsoide(4, 4, 20, 9, 8, 9, { mat: 'negro', resta: true })); for (let i = 0; i < 5; i++) ps.push(a.elipsoide(rr(a, 0, 8), rr(a, 0, 8), rr(a, 12, 18), 2.4, 2, 3, { mat: 'a2_huevo', tono: 0.05 })); }
      for (let i = 0; i < 4; i++) ps.push(a.palo([rr(a, -16, 16), rr(a, -14, 14), rr(a, 2, 12)], [rr(a, -20, 20), rr(a, -18, 18), rr(a, 2, 16)], 1.2, { mat: 'hueso' }));
      for (let i = 0; i < 5; i++) ps.push(a.elipsoide(rr(a, -18, 18), rr(a, -16, 16), rr(a, 6, 20), rr(a, 2.5, 4), rr(a, 1.5, 3), 1.2, { mat: 'a2_quitina_p', giro: rr(a, 0, 180) }));
      return ps;
    },
  },
  {
    id: 'a2_huevos', nombre: ['Huevos de escarabajo', 'Scarab eggs'], tema: T2, variantes: ['nidada', 'rotos'], huella: [2, 2], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      ps.push(a.elipsoide(0, 0, 0.5, 14, 12, 1.4, { mat: 'a2_nido', tono: -0.1 }));
      for (let i = 0; i < 11; i++) {
        const x = rr(a, -10, 10), y = rr(a, -9, 9), roto = v === 'rotos' && a.r() < 0.6;
        if (roto) { ps.push(a.elipsoide(x, y, 1.5, 2.6, 2.2, 1.6, { mat: 'a2_huevo', tono: -0.15 }), a.elipsoide(x, y, 2.6, 1.8, 1.6, 1.4, { mat: 'negro', resta: true })); }
        else ps.push(a.elipsoide(x, y, 3.4, 2.6, 2.3, 3.6, { mat: i % 3 ? 'a2_huevo' : 'a2_luz_huevo', tono: rr(a, -0.1, 0.1) }));
      }
      return { piezas: ps, resplandor: { c: [0, 0, 6], r: 22, color: '#b8e060' } };
    },
  },
  {
    id: 'a2_quitina', nombre: ['Mudas de quitina', 'Shed chitin'], tema: T2, variantes: ['muda', 'pedazos'], huella: [2, 2], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      if (v === 'muda') {
        // la cáscara entera de un escarabajo grande, vacía y partida por el lomo
        ps.push(a.elipsoide(0, 0, 5, 14, 9, 6, { mat: 'a2_quitina_p' }), a.elipsoide(0, 0, 6.5, 13, 8, 5.4, { mat: 'negro', resta: true }), a.caja(0, 0, 8, 28, 2, 6, { mat: 'negro', resta: true }));
        ps.push(a.elipsoide(15, 0, 4, 4.6, 6, 3.4, { mat: 'a2_quitina_p', tono: 0.05 }));
        for (const s of [-1, 1]) for (let k = 0; k < 3; k++) ps.push(a.palo([-4 + k * 6, s * 7, 3], [-6 + k * 7, s * 14, 0.6], 0.8, { mat: 'a2_quitina_p', tono: -0.1 }));
      } else for (let i = 0; i < 8; i++) ps.push(a.elipsoide(rr(a, -12, 12), rr(a, -12, 12), 1, rr(a, 2, 5), rr(a, 1.5, 3.5), 1, { mat: 'a2_quitina_p', giro: rr(a, 0, 180), tono: rr(a, -0.1, 0.1) }));
      return ps;
    },
  },
  {
    id: 'a2_arena_cae', nombre: ['Arena que entra', 'Sand pouring in'], tema: T2, variantes: ['cono', 'chorro'], huella: [2, 2], bloquea: false,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // la arena del desierto que se cuela por una grieta del techo y arma un cono en el piso
      ps.push(arena(a, 0, 0, 16, 14, v === 'cono' ? 10 : 6));
      ps.push(a.cilindro(0, 0, 0, 7, v === 'cono' ? 13 : 8, { mat: 'arena', r1: 0.5, tono: 0.05 }));
      if (v === 'chorro') { ps.push(a.cilindro(0, 0, 6, 1.4, 90, { mat: 'arena', r1: 1.8, tono: 0.1 })); for (let i = 0; i < 6; i++) ps.push(a.esfera(rr(a, -2, 2), rr(a, -2, 2), rr(a, 20, 90), 0.6, { mat: 'arena', tono: 0.15 })); }
      for (let i = 0; i < 3; i++) ps.push(a.caja(rr(a, -12, 12), rr(a, -12, 12), 0, rr(a, 3, 6), rr(a, 2, 5), rr(a, 1.5, 3), { mat: 'roca', giro: rr(a, 0, 90) }));
      return ps;
    },
  },
  // ---------------------------------------------------------------- las Ruinas del Sol (afuera)
  {
    id: 'a2_columnata', nombre: ['Columnata caída', 'Fallen colonnade'], tema: T2, variantes: ['entera', 'rota'], huella: [7, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], L = 112;
      ps.push(a.caja(0, 0, 0, L, 30, 5, { mat: 'a2_sol_sillar', tono: -0.05 }), a.caja(0, 0, 5, L - 6, 26, 3, { mat: 'a2_sol_liso' }));
      const n = 5, cae = v === 'rota' ? [1, 3] : [3];
      for (let i = 0; i < n; i++) {
        const x = -L / 2 + 12 + i * ((L - 24) / (n - 1));
        if (cae.includes(i)) {
          // la que cayó: el muñón y los tambores rodados hacia adelante
          ps.push(a.cilindro(x, 0, 8, 7, rr(a, 8, 20), { mat: 'a2_sol_liso', r1: 6.6 }));
          for (let k = 0; k < 3; k++) ps.push(a.cilindro(x + rr(a, -6, 6), 22 + k * 13, 7, 6.6, 12, { mat: 'a2_sol_liso', eje: [rr(a, -0.4, 0.4), 1, 0], tono: rr(a, -0.06, 0.06) }));
          continue;
        }
        ps.push(a.cilindro(x, 0, 8, 7, 82, { mat: 'a2_sol_liso', r1: 6 }));
        for (let k = 0; k < 8; k++) { const t = (k / 8) * PI * 2; ps.push(a.caja(x + Math.cos(t) * 6.6, Math.sin(t) * 6.6, 12, 0.9, 0.9, 72, { mat: 'negro', resta: true })); }
        ps.push(a.cilindro(x, 0, 84, 6.2, 6, { mat: 'a2_sol_liso', r1: 10 }), a.caja(x, 0, 90, 22, 22, 5, { mat: 'a2_sol_sillar' }));
      }
      // el arquitrabe: entero sobre las primeras, partido y caído donde falta la columna
      const xa = -L / 2 + 12, xb = v === 'rota' ? -L / 2 + 12 + (L - 24) / 4 * 1 - 4 : -L / 2 + 12 + (L - 24) / 4 * 2 + 6;
      ps.push(a.caja((xa + xb) / 2 - 6, 0, 95, xb - xa + 14, 20, 10, { mat: 'a2_sol_sillar', tono: 0.04 }), a.caja((xa + xb) / 2 - 6, 9, 98, xb - xa + 14, 2, 3, { mat: 'a2_oro_sol', tono: -0.2 }));
      ps.push(a.caja(L / 4, 26, 0, 40, 16, 9, { mat: 'a2_sol_sillar', giro: 8, incl: 6 }));
      ps.push(arena(a, -10, 22, 40, 10, 4), arena(a, 30, -10, 26, 12, 5));
      return ps;
    },
  },
  {
    id: 'a2_ruina_casa', nombre: ['Casa caída', 'Fallen house'], tema: T2, variantes: ['esquina', 'u', 'arco'], huella: [5, 5], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], S = 80;
      // la casa de adobe de la ciudad del sol sin techo: muros de distinta altura, los vanos, las vigas caídas y la arena adentro
      const muro = (x: number, y: number, l: number, eje: 'x' | 'y', h0: number, h1: number) => {
        const n = Math.ceil(l / 8);
        for (let i = 0; i < n; i++) { const t = i / Math.max(1, n - 1), h = h0 + (h1 - h0) * t + rr(a, -4, 4), u = -l / 2 + 4 + i * 8; ps.push(eje === 'x' ? a.caja(x + u, y, 0, 8.4, 9, Math.max(4, h), { mat: 'a2_losa_calle', tono: rr(a, -0.04, 0.04) }) : a.caja(x, y + u, 0, 9, 8.4, Math.max(4, h), { mat: 'a2_losa_calle', tono: rr(a, -0.04, 0.04) })); }
      };
      muro(0, -S / 2 + 5, S - 6, 'x', 70, v === 'arco' ? 40 : 18);
      muro(-S / 2 + 5, 0, S - 6, 'y', 66, 14);
      if (v === 'u') muro(S / 2 - 5, -10, S - 26, 'y', 40, 10);
      if (v === 'arco') { ps.push(a.caja(14, -S / 2 + 5, 0, 18, 12, 46, { mat: 'negro', resta: true })); ps.push(a.cilindro(14, -S / 2 + 5, 46, 9, 12, { mat: 'negro', resta: true, eje: [0, 1, 0] })); }
      ps.push(a.caja(-12, -S / 2 + 5, 26, 10, 12, 18, { mat: 'negro', resta: true }));
      ps.push(a.palo([-30, -30, 62], [10, 10, 2], 2.2, { mat: 'madera_vieja', tono: -0.1 }), a.palo([-34, 6, 40], [-6, 30, 1], 2, { mat: 'madera_vieja', tono: -0.15 }));
      for (let i = 0; i < 10; i++) ps.push(a.caja(rr(a, -26, 30), rr(a, -26, 30), 0, rr(a, 6, 10), rr(a, 5, 9), rr(a, 3, 6), { mat: 'a2_losa_calle', giro: rr(a, 0, 90), incl: rr(a, -14, 14) }));
      ps.push(arena(a, -14, -14, 24, 20, 8), arena(a, 20, 24, 20, 12, 4));
      ps.push(a.cilindro(-26, 20, 0, 4, 10, { mat: 'tierra', r1: 3 }));
      return ps;
    },
  },
  {
    id: 'a2_fuente_seca', nombre: ['Fuente de la plaza', 'Plaza fountain'], tema: T2, variantes: ['plaza', 'rota'], huella: [4, 4], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [], R = 28;
      // la taza octogonal seca con arena en el fondo, el pilar del medio con su sol, y la cara del dios del agua que ya no sale
      for (let i = 0; i < 8; i++) { const t0 = (i / 8) * PI * 2 + PI / 8, t1 = ((i + 1) / 8) * PI * 2 + PI / 8, p = (t: number, r: number, z: number): V3 => [Math.cos(t) * r, Math.sin(t) * r, z]; const roto = v === 'rota' && i === 1; ps.push(a.poliedro([p(t0, R - 5, 0), p(t1, R - 5, 0), p(t0, R, 0), p(t1, R, 0), p(t0, R - 5, roto ? 4 : 12), p(t1, R - 5, roto ? 4 : 12), p(t0, R, roto ? 3 : 12), p(t1, R, roto ? 3 : 12)], { mat: 'a2_sol_sillar', tono: (i % 2) * 0.04 })); }
      ps.push(a.cilindro(0, 0, 0, R - 5, 4, { mat: 'arena', tono: -0.05 }));
      ps.push(a.cilindro(0, 0, 0, 6, v === 'rota' ? 22 : 44, { mat: 'a2_sol_liso' }), a.cilindro(0, 0, 18, 12, 3, { mat: 'a2_sol_liso', r1: 9 }));
      if (v === 'plaza') { ps.push(a.cilindro(0, 0, 44, 5, 3, { mat: 'a2_oro_sol', r1: 7 }), a.cilindro(2, 2, 52, 7, 1.6, { mat: 'a2_oro_sol', eje: [Math.SQRT1_2, Math.SQRT1_2, 0] })); }
      else { ps.push(a.cilindro(18, 14, 0, 5, 20, { mat: 'a2_sol_liso', eje: [0.6, 0.7, 0.2] })); }
      for (const t of [0.3, 1.9, 3.4, 4.9]) ps.push(a.esfera(Math.cos(t) * 6.6, Math.sin(t) * 6.6, 30, 2.4, { mat: 'a2_oro_sol', tono: -0.2 }));
      ps.push(arena(a, 12, -18, 18, 10, 5), arena(a, -20, 16, 14, 8, 3));
      return ps;
    },
  },
  // ---------------------------------------------------------------- el Oasis Muerto (afuera)
  {
    id: 'a2_barca_varada', nombre: ['Barca varada', 'Stranded boat'], tema: T2, variantes: ['entera', 'rota'], huella: [5, 2], bloquea: true,
    armar: (v, _f, a) => {
      const ps: Pieza[] = [];
      // la barca del oasis, de cuando era un lago: quedó de costado sobre el barro seco, con el remo y la red que se pudrió
      const L = 72, W = 22;
      for (let i = 0; i < 9; i++) {
        const t = i / 8, x = -L / 2 + t * L, ancho = W * Math.sin(Math.PI * (0.08 + t * 0.84)) * 0.5;
        if (v === 'rota' && i >= 3 && i <= 4) { ps.push(a.palo([x, -ancho, 2], [x, -ancho - 2, 18], 1, { mat: 'madera_vieja' })); continue; }
        ps.push(a.caja(x, -ancho, 0, L / 8 + 1, 2, 14 + Math.abs(t - 0.5) * 8, { mat: 'madera_vieja', tono: (i % 2) * 0.05, incl: -22 }));
        ps.push(a.caja(x, ancho - 2, 0, L / 8 + 1, 2, 8 + Math.abs(t - 0.5) * 6, { mat: 'madera_vieja', tono: -0.08, incl: 40 }));
      }
      ps.push(a.caja(0, 0, 0, L - 6, W * 0.7, 2, { mat: 'madera_vieja', tono: -0.15 }));
      for (const x of [-18, 0, 18]) ps.push(a.caja(x, 0, 2, 2.4, W * 0.7, 2.4, { mat: 'madera_vieja', tono: 0.05 }));
      ps.push(a.palo([-L / 2 - 4, 18, 0.6], [6, 26, 0.6], 1.2, { mat: 'madera_vieja' }), a.caja(-L / 2 - 6, 18, 0, 7, 3, 1, { mat: 'madera_vieja' }));
      ps.push(a.elipsoide(16, 22, 1, 12, 6, 1.2, { mat: 'cuerda', tono: -0.2 }));
      for (let i = 0; i < 3; i++) ps.push(a.elipsoide(rr(a, 8, 26), rr(a, 14, 28), 1, 2.4, 1, 0.8, { mat: 'hueso' })); // peces secos
      return ps;
    },
  },
);
conVarianteY('a2_muro_pozo', 'a2_muro_sol', 'a2_muro_dormidos', 'a2_muro_rey', 'a2_columnata', 'a2_lecho_dormido');
