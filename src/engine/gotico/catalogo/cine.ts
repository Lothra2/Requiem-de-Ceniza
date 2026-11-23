import { registrar, type Arma, type Pieza, type V3 } from '../objeto';

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
