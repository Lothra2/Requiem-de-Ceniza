import { registrar, type Arma, type Pieza, type V3 } from '../objeto';
import { corona, colocar } from './botin';

// Piezas de las películas de cierre de acto (ui/cine_acto*.ts): no las pone ningún mapa, las pone la toma en su copia de la zona.

/**
 * La barca de Oyá: una barca de río larga (unas cuatro personas), hundida en el agua hasta su línea de flotación. Proa y popa
 * levantadas en curva, la borda clara, bancos, la soga, un fardo y el farol colgado de la vara de proa (su luz es la de la toma).
 * Va de costado: la proa a +x -y (a la derecha de la pantalla), `h2` al revés.
 *
 * Se parte en dos para que los que van adentro queden ADENTRO: `casco` (todo menos el costado de delante) se ordena detrás de
 * ellos y `borda` (el costado que mira a la cámara, +x +y) delante, tapándoles las piernas hasta las rodillas. La toma pone la
 * borda corrida `ADELANTE` celdas hacia la cámara (para que se pinte después) y la pieza trae su dibujo corrido lo mismo hacia
 * atrás: las dos caen en el mismo sitio.
 */
const GIRO: Record<string, number> = { h: -45, h2: 135 };
/** Celdas que la toma corre la borda hacia la cámara (por la diagonal +x +y), y unidades del modelo por celda. */
export const ADELANTE = 1.4;
const U = 16;
const L = 46, Wb = 12.5, ALTO = 15, AGUA = 4; // medio largo, medio ancho, alto de la borda y lo que se hunde

function barca(v: string, a: Arma, parte: 'casco' | 'borda') {
  const g = ((GIRO[v.replace('_borda', '')] ?? -45) * Math.PI) / 180, c = Math.cos(g), s = Math.sin(g);
  // (la borda se dibuja corrida hacia atrás lo que la toma la corre hacia adelante)
  const dw = parte === 'borda' ? -ADELANTE * U : 0;
  const P = (p: V3): V3 => [p[0] * c - p[1] * s + dw, p[0] * s + p[1] * c + dw, p[2] - AGUA];
  const gr = (GIRO[v.replace('_borda', '')] ?? -45);
  const el = (x: number, y: number, z: number, rx: number, ry: number, rz: number, o: any) => { const q = P([x, y, z]); return a.elipsoide(q[0], q[1], q[2], rx, ry, rz, { ...o, giro: (o.giro ?? 0) + gr }); };
  const cj = (x: number, y: number, z: number, an: number, pr: number, al: number, o: any) => { const q = P([x, y, z]); return a.caja(q[0], q[1], q[2], an, pr, al, { ...o, giro: (o.giro ?? 0) + gr }); };
  const pl = (p: V3, q: V3, r: number, o: any) => a.palo(P(p), P(q), r, o);
  const ps: Pieza[] = [];
  // el casco: un huso hueco, más alto hacia las puntas. Lo que queda bajo el agua no se ve (se corta en z = AGUA)
  ps.push(el(0, 0, AGUA + 2, L, Wb, ALTO - 2, { mat: 'madera_vieja' }));
  for (const sx of [-1, 1]) ps.push(el(sx * L * 0.72, 0, AGUA + 6, L * 0.36, Wb * 0.72, ALTO - 3, { mat: 'madera_vieja', tono: -0.04 }));
  ps.push(cj(0, 0, AGUA + ALTO, L * 3, Wb * 3, 30, { mat: 'madera', resta: true })); // (el corte de la borda)
  ps.push(el(0, 0, AGUA + 7, L - 4.5, Wb - 3.8, ALTO - 4, { mat: 'madera', resta: true })); // (el hueco de adentro)
  ps.push(cj(0, 0, AGUA - 40, L * 3, Wb * 3, 40, { mat: 'madera', resta: true })); // (bajo la línea de flotación)
  // la línea de flotación: el agua oscura pegada al casco y un filo de espuma
  ps.push(el(0, 0, AGUA + 0.4, L + 1.5, Wb + 1.2, 0.8, { mat: 'agua' }), el(0, 0, AGUA + 0.9, L + 0.4, Wb + 0.4, 0.5, { mat: 'agua_sucia', tono: 0.25 }));
    // la borda: el filete claro de arriba y las tracas oscuras del costado
  ps.push(el(0, 0, AGUA + ALTO - 0.6, L + 0.4, Wb + 0.4, 1.1, { mat: 'madera_lisa', tono: 0.12 }), el(0, 0, AGUA + ALTO - 0.6, L - 4.5, Wb - 3.8, 2, { mat: 'madera', resta: true }));
  for (const sy of [-1, 1]) for (const z of [AGUA + 5, AGUA + 9.5]) ps.push(pl([-L * 0.82, sy * (Wb - 0.6), z], [L * 0.82, sy * (Wb - 0.3), z], 0.45, { mat: 'negro' }));
  // la parte: el casco se queda sin el costado de delante (+y local), la borda solo con él
  if (parte === 'casco') ps.push(cj(0, Wb * 1.5 + 0.4, -40, L * 3, Wb * 3, 100, { mat: 'madera', resta: true }));
  else ps.push(cj(0, -Wb * 1.5 + 0.4, -40, L * 3, Wb * 3, 100, { mat: 'madera', resta: true }));
  if (parte === 'casco') {
    // el fondo de adentro (tablas) y las cuadernas
    ps.push(el(0, 0, AGUA + 2.6, L - 5, Wb - 3.5, 0.8, { mat: 'madera_lisa', tono: -0.06 }));
    for (let x = -30; x <= 30; x += 10) ps.push(pl([x, -Wb + 1.5, AGUA + 3], [x, -Wb + 1.5, AGUA + ALTO - 2], 0.9, { mat: 'madera_vieja', tono: -0.1 }));
    // proa y popa: la roda que sube en curva; la de proa con la vara del farol
    for (const sx of [-1, 1]) {
      const r0: V3 = [sx * (L - 1), 0, AGUA + ALTO - 2], r1: V3 = [sx * (L + 5), 0, AGUA + ALTO + 7], r2: V3 = [sx * (L + 6), 0, AGUA + ALTO + (sx > 0 ? 15 : 12)];
      ps.push(pl(r0, r1, 2, { mat: 'madera_vieja' }), pl(r1, r2, 1.6, { mat: 'madera_vieja' }));
    }
    ps.push(pl([L + 6, 0, AGUA + ALTO + 14], [L + 13, 0, AGUA + ALTO + 22], 0.8, { mat: 'madera' }), pl([L + 13, 0, AGUA + ALTO + 22], [L + 15, 0, AGUA + ALTO + 18], 0.4, { mat: 'hierro' }));
    ps.push(cj(L + 15, 0, AGUA + ALTO + 12.5, 4.4, 4.4, 6.4, { mat: 'hierro' }), cj(L + 15, 0, AGUA + ALTO + 13, 3.2, 4.8, 5, { mat: 'fuego' }), cj(L + 15, 0, AGUA + ALTO + 13, 4.8, 3.2, 5, { mat: 'fuego' }));
    // los bancos, la soga y lo que lleva
    for (const x of [-22, 22]) ps.push(cj(x, 0, AGUA + ALTO - 5, 4.5, 2 * Wb - 3, 1.6, { mat: 'madera_lisa', tono: 0.05 }));
    ps.push(el(-L + 8, 3, AGUA + 4, 3.6, 3.6, 1.4, { mat: 'cuerda' }), el(-L + 8, 3, AGUA + 5, 2.2, 2.2, 0.9, { mat: 'cuerda', tono: -0.1 }));
    ps.push(el(L - 12, -3, AGUA + 5.6, 5, 4, 3.4, { mat: 'tela', tono: -0.08 }), el(-8, -4, AGUA + 5, 3, 3, 4, { mat: 'piedra' }));
  }
  return parte === 'casco' ? { piezas: ps, resplandor: { c: P([L + 15, 0, AGUA + ALTO + 13]), r: 30, color: '#ffb066' } } : ps;
}
registrar({
  id: 'cine_barca', nombre: ['Barca de Oyá', 'Oya\'s boat'], tema: 'cine' as any, variantes: ['h', 'h_borda'], huella: [2, 2], bloquea: false,
  armar: (v, _f, a: Arma) => barca(v, a, v.endsWith('_borda') ? 'borda' : 'casco'),
});

/**
 * El barco de Oyá varado en la arena de su costa (acto 6): un casco de alta mar, largo (unas diez celdas), hundido de quilla en la
 * arena y escorado, con la cubierta a la altura de una persona, la borda clara, tracas, un boquete en el costado de delante con
 * las tablas rotas, el castillo de popa, el bauprés, el mástil partido con la verga ladeada y la vela en jirones, la jarcia floja
 * y el farol de proa (su luz la pone la toma). Va de costado: la proa a +x -y (a la derecha de la pantalla). La cubierta queda a
 * `CUBIERTA` unidades del piso: la toma alza ahí a quien va de pie en la proa. El dibujo va corrido `BARCO_ATRAS` celdas hacia la
 * cámara (la toma lo pone esas celdas más atrás): así quien está de pie en la cubierta se pinta después del casco.
 */
export const CUBIERTA = 34;
export const BARCO_ATRAS = 1.2;
function barco(a: Arma) {
  const g = (-45 * Math.PI) / 180, c = Math.cos(g), s = Math.sin(g), dw = BARCO_ATRAS * U;
  const Lb = 84, Wc = 21, H0 = CUBIERTA, ESC = 0.13; // medio largo, medio ancho, alto de la borda, escora (la borda de atrás más alta)
  const P = (p: V3): V3 => [p[0] * c - p[1] * s + dw, p[0] * s + p[1] * c + dw, p[2] - p[1] * ESC];
  const el = (x: number, y: number, z: number, rx: number, ry: number, rz: number, o: any) => { const q = P([x, y, z]); return a.elipsoide(q[0], q[1], q[2], rx, ry, rz, { ...o, giro: (o.giro ?? 0) - 45 }); };
  const cj = (x: number, y: number, z: number, an: number, pr: number, al: number, o: any) => { const q = P([x, y, z]); return a.caja(q[0], q[1], q[2], an, pr, al, { ...o, giro: (o.giro ?? 0) - 45 }); };
  const pl = (p: V3, q: V3, r: number, o: any) => a.palo(P(p), P(q), r, o);
  const ps: Pieza[] = [];
  // la arena que lo agarra: un banco bajo y largo bajo el casco que asoma apenas por los costados
  ps.push(el(-6, 2, -1, Lb * 0.98, Wc * 1.3, 8, { mat: 'arena', tono: -0.1 }));
  // el casco: rebanadas a lo largo con la manga que se cierra hacia las puntas (la proa afilada, la popa ancha y redonda). Lo de
  //  arriba se corta parejo a la altura de la cubierta: ese corte ES la cubierta (con sus tablas encima)
  const R = 32, manga = (x: number) => { const u = x / Lb; return Wc * (u > 0 ? Math.pow(Math.max(0.04, 1 - u), 0.85) : Math.pow(Math.max(0.04, 1 - u ** 4), 0.5)); };
  for (let i = 0; i < R; i++) {
    const x = -Lb + (2 * Lb * (i + 0.5)) / R, m = manga(x);
    // (el costado recto y, abajo, la panza que se mete en la arena)
    ps.push(cj(x, 0, -2, (2 * Lb) / R + 0.8, 2 * m, H0 + 2, { mat: 'madera_vieja', tono: (i % 4) * 0.012 - 0.02 }));
  }
  ps.push(cj(0, 0, -60, Lb * 3, Wc * 4, 60, { mat: 'madera', resta: true })); // (lo enterrado)
  // las tablas de la cubierta (a lo largo) y la borda: el pasamano claro sobre candeleros, siguiendo la manga
  for (const y of [-14, -9, -4, 1, 6, 11, 16]) { let x0 = null as number | null; for (let x = -Lb; x <= Lb; x += 2) { const ok = manga(x) - 2 > Math.abs(y); if (ok && x0 === null) x0 = x; if ((!ok || x >= Lb - 2) && x0 !== null) { ps.push(pl([x0, y, H0 + 0.2], [x - 2, y, H0 + 0.2], 0.3, { mat: 'negro' })); x0 = null; } } }
  ps.push(el(-4, 0, H0 - 0.6, Lb * 0.9, Wc * 0.7, 1, { mat: 'madera_lisa', tono: 0.02 }));
  for (const sy of [-1, 1]) for (let i = 0; i < R; i++) {
    const xa = -Lb + 3 + ((2 * Lb - 6) * i) / R, xb = -Lb + 3 + ((2 * Lb - 6) * (i + 1)) / R, ya = sy * (manga(xa) - 1), yb = sy * (manga(xb) - 1);
    ps.push(pl([xa, ya, H0 + 6.5], [xb, yb, H0 + 6.5], 1.1, { mat: 'madera_lisa', tono: 0.12 }), pl([xa, ya, H0 - 0.5], [xa, ya, H0 + 6.5], 0.6, { mat: 'madera_vieja' }));
    // las tracas del costado (rayas oscuras que siguen la manga, más bajas cuanto más adentro) y la línea de la marea con verdín
    for (const [z, k] of [[H0 - 7, 0.97], [H0 - 15, 0.9], [H0 - 23, 0.78]] as [number, number][]) ps.push(pl([xa, sy * manga(xa) * k, z], [xb, sy * manga(xb) * k, z], 0.5, { mat: 'negro' }));
    ps.push(pl([xa, sy * manga(xa) * 0.72, 7], [xb, sy * manga(xb) * 0.72, 7], 1.8, { mat: 'musgo', tono: -0.2 }));
  }
  // el boquete del costado de delante: el hueco negro y las tablas rotas que salen
  ps.push(el(-20, manga(-20) * 0.86, 15, 9, 2.4, 6, { mat: 'negro' }));
  for (const [x, z, dx, dz] of [[-30, 21, -4, 6], [-24, 9, 3, -5], [-13, 22, 5, 5], [-10, 10, 4, -4], [-27, 15, -6, 1]]) ps.push(pl([x, manga(x) * 0.88, z], [x + dx, manga(x) + 3, z + dz], 1.1, { mat: 'madera_vieja', tono: 0.05 }));
  // el castillo de popa: una caseta con su techo y la puerta
  ps.push(cj(-Lb * 0.64, 0, CUBIERTA, 26, 2 * Wc - 8, 18, { mat: 'madera', tono: -0.06 }));
  ps.push(cj(-Lb * 0.64, 0, CUBIERTA + 18, 30, 2 * Wc - 4, 2.4, { mat: 'madera_lisa', tono: 0.04 }));
  ps.push(cj(-Lb * 0.64 + 13.4, 4, CUBIERTA, 1, 7, 12, { mat: 'negro' }));
  // la roda de proa y el bauprés con su farol
  ps.push(pl([Lb - 2, 0, H0 - 4], [Lb + 8, 0, H0 + 8], 2.6, { mat: 'madera_vieja' }));
  ps.push(pl([Lb + 6, 0, H0 + 6], [Lb + 40, 0, H0 + 22], 1.6, { mat: 'madera_vieja' }));
  ps.push(pl([Lb + 30, 0, H0 + 17], [Lb + 31, 0, H0 + 9], 0.4, { mat: 'hierro' }));
  ps.push(cj(Lb + 31, 0, H0 + 6, 4.4, 4.4, 6.4, { mat: 'hierro' }), cj(Lb + 31, 0, H0 + 6.4, 3.2, 4.8, 5, { mat: 'fuego' }), cj(Lb + 31, 0, H0 + 6.4, 4.8, 3.2, 5, { mat: 'fuego' }));
  // el mástil partido y ladeado (hacia la cámara), la verga caída en diagonal y la vela en jirones
  const pie: V3 = [6, -2, CUBIERTA], top: V3 = [2, -14, CUBIERTA + 150];
  ps.push(pl(pie, top, 3.4, { mat: 'madera_vieja' }));
  ps.push(pl([top[0] + 2, top[1], top[2] - 2], [top[0] - 3, top[1] + 4, top[2] + 9], 2.4, { mat: 'madera_vieja', tono: 0.06 })); // (la astilla de la rotura)
  const v0: V3 = [-36, -10, CUBIERTA + 120], v1: V3 = [44, -12, CUBIERTA + 104];
  ps.push(pl(v0, v1, 1.8, { mat: 'madera_vieja' }));
  { // (la vela: cuelga de la verga en una sola tela de franjas pegadas, rota abajo en flecos de largo parejo que cambia de a poco,
    //  con la comba del viento y dos desgarrones; colgando del mástil, no un bloque)
    const C = 18, hash = (n: number) => { const v = Math.sin(n * 91.3 + 7.1) * 43758.5453; return v - Math.floor(v); };
    for (let ci = 0; ci < C; ci++) {
      const u = (ci + 0.5) / C, x = v0[0] + (v1[0] - v0[0]) * u, zt = v0[2] + (v1[2] - v0[2]) * u;
      const largo = 34 + 36 * Math.sin(u * Math.PI) * (0.75 + 0.25 * Math.sin(u * 9)) + hash(ci) * 10 - (ci === 5 || ci === 6 ? 26 : 0);
      for (let z = 0; z < largo; z += 6) {
        const comba = Math.sin((z / 76) * Math.PI) * 6 * Math.sin(u * Math.PI);
        if ((ci === 11 && z > 14 && z < 30) || (ci === 12 && z > 18 && z < 26)) continue; // (el desgarrón)
        ps.push(cj(x, -10 + comba, zt - 2 - z - 6, 80 / C + 0.6, 0.8, 6.4, { mat: 'tela', tono: -0.04 - hash(ci * 5 + z) * 0.05 - z / 600 }));
      }
    }
  }
  // la jarcia floja: del tope a la proa y a la popa, y obenques a la borda
  ps.push(pl(top, [Lb + 36, 0, H0 + 20], 0.35, { mat: 'cuerda' }), pl(top, [-Lb + 4, 0, H0 + 2], 0.35, { mat: 'cuerda' }));
  for (const sy of [-1, 1]) for (const x of [-4, 14]) ps.push(pl([top[0], top[1], top[2] - 30], [x, sy * (Wc - 1), H0], 0.3, { mat: 'cuerda', tono: -0.1 }));
  // lo de cubierta: el cabrestante, rollos de soga, barriles y la red colgando por la borda
  ps.push(el(30, 3, CUBIERTA + 4, 4.5, 4.5, 5, { mat: 'madera', tono: -0.08 }), el(-14, 8, CUBIERTA + 1.5, 4, 4, 1.5, { mat: 'cuerda' }), el(-14, 8, CUBIERTA + 2.6, 2.4, 2.4, 1, { mat: 'cuerda', tono: -0.1 }));
  for (const [x, y] of [[-30, -9], [-25, -12]]) ps.push(el(x, y, CUBIERTA + 6, 4, 4, 6.5, { mat: 'madera_vieja', tono: 0.08 }));
  ps.push(cj(40, Wc + 1.4, H0 - 9, 22, 0.6, 16, { mat: 'cuerda', tono: -0.2 }));
  return { piezas: ps, resplandor: { c: P([Lb + 31, 0, H0 + 6.4]), r: 30, color: '#ffb066' } };
}
registrar({
  id: 'cine_barco', nombre: ['Barco de Oyá', 'Oya\'s ship'], tema: 'cine' as any, variantes: ['varado'], huella: [2, 2], bloquea: false,
  armar: (_v, _f, a: Arma) => barco(a),
});

/**
 * La Corona de Aun-Saar (acto 7): la de oro con sus seis puntas y sus gemas, sin el gorro, grande (como se ve a ×4 en la toma). Rueda
 * de canto por el piso hacia +x (el eje del aro a lo largo de y, un poco echada): `r0`..`r7` es el giro sobre su eje en pasos de
 * 7,5° (las seis puntas se repiten cada 60°: el bucle de ocho cuadros no salta); `t0`..`t3` se va echando al frenar (tambalea) y
 * `echada` queda en el piso, apenas apoyada en las puntas.
 */
const S_CORONA = 2.6, R_CORONA = 3.2 * S_CORONA;
function coronaCine(v: string): Pieza[] {
  const echa: Record<string, number> = { t0: 62, t1: 48, t2: 30, t3: 14, echada: 5 };
  const inc = v.startsWith('r') ? 74 : echa[v] ?? 74, giro = v.startsWith('r') ? +v.slice(1) * 7.5 : v === 'echada' ? 20 : 12 + (+v.slice(1) || 0) * 9;
  const ps = corona(S_CORONA, 'bt_oro', ['bt_rubi', 'bt_rubi', 'bt_zafiro'], '');
  // (el aro se apoya en el canto de abajo: su punto más bajo toca el piso)
  return colocar(ps, [0, 0, R_CORONA * Math.sin((inc * Math.PI) / 180) + 0.6], giro, inc, 90);
}
registrar({
  id: 'cine_corona', nombre: ['Corona de Aun-Saar', 'Crown of Aun-Saar'], tema: 'cine' as any, variantes: ['r0', 'r1', 'r2', 'r3', 'r4', 'r5', 'r6', 'r7', 't0', 't1', 't2', 't3', 'echada'], huella: [1, 1], bloquea: false,
  armar: (v) => coronaCine(v),
});
