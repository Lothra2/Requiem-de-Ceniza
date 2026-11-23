import { registrar, type Arma, type Pieza, type V3 } from '../objeto';

// Piezas de las películas de cierre de acto (ui/cine_acto*.ts): no las pone ningún mapa, las pone la toma en su copia de la zona.

/**
 * La barca de Oyá: una barca de río larga, sin suelo debajo (va en el agua). Proa y popa levantadas en curva, la borda clara, dos
 * bancos, el remo apoyado que asoma por un costado, la soga de la amarra enrollada y el farol colgado de la vara de proa (su luz es
 * la de la toma: aquí el vidrio y la llama). La variante dice hacia dónde mira la proa: `h` a +x -y (lo ancho de la pantalla),
 * `d` a +x +y, `x`, `y`, y con `2` al revés.
 */
const GIRO: Record<string, number> = { h: -45, h2: 135, d: 45, d2: -135, x: 0, x2: 180, y: 90, y2: -90 };
registrar({
  id: 'cine_barca', nombre: ['Barca de Oyá', 'Oya\'s boat'], tema: 'cine' as any, variantes: Object.keys(GIRO), huella: [2, 2], bloquea: false,
  armar: (v, _f, a: Arma) => {
    const g = ((GIRO[v] ?? 0) * Math.PI) / 180, c = Math.cos(g), s = Math.sin(g);
    const P = (p: V3): V3 => [p[0] * c - p[1] * s, p[0] * s + p[1] * c, p[2]];
    const el = (x: number, y: number, z: number, rx: number, ry: number, rz: number, o: any) => { const q = P([x, y, z]); return a.elipsoide(q[0], q[1], q[2], rx, ry, rz, { ...o, giro: (o.giro ?? 0) + (GIRO[v] ?? 0) }); };
    const cj = (x: number, y: number, z: number, an: number, pr: number, al: number, o: any) => { const q = P([x, y, z]); return a.caja(q[0], q[1], q[2], an, pr, al, { ...o, giro: (o.giro ?? 0) + (GIRO[v] ?? 0) }); };
    const pl = (p: V3, q: V3, r: number, o: any) => a.palo(P(p), P(q), r, o);
    const ps: Pieza[] = [];
    // el casco: medio huso hueco, más alto en las puntas (dos husos que suben hacia proa y popa)
    ps.push(el(0, 0, 6, 34, 10, 7, { mat: 'madera_vieja' }));
    for (const sx of [-1, 1]) ps.push(el(sx * 26, 0, 9, 12, 6.5, 8, { mat: 'madera_vieja', tono: -0.04 }));
    ps.push(cj(0, 0, 13.5, 90, 30, 9, { mat: 'madera', resta: true }), el(0, 0, 7.5, 31, 8.2, 6, { mat: 'madera', resta: true }));
    // la borda: un filete claro todo alrededor y las tracas oscuras del costado
    ps.push(el(0, 0, 8.6, 33.4, 9.6, 1, { mat: 'madera_lisa', tono: 0.14 }), el(0, 0, 8.9, 31, 8.2, 1.4, { mat: 'madera', resta: true }));
    for (const sy of [-1, 1]) ps.push(pl([-26, sy * 8.8, 4.4], [26, sy * 8.8, 4.4], 0.45, { mat: 'negro' }));
    // proa y popa: la roda que se levanta en curva, la de proa con su vara del farol
    for (const sx of [-1, 1]) {
      const r0: V3 = [sx * 31, 0, 7], r1: V3 = [sx * 37, 0, 15], r2: V3 = [sx * 38, 0, sx > 0 ? 22 : 19];
      ps.push(pl(r0, r1, 1.6, { mat: 'madera_vieja' }), pl(r1, r2, 1.3, { mat: 'madera_vieja' }));
    }
    ps.push(pl([38, 0, 21], [44, 0, 29], 0.7, { mat: 'madera' }), pl([44, 0, 29], [46, 0, 25], 0.35, { mat: 'hierro' }));
    // el farol: jaula de hierro y el vidrio encendido
    ps.push(cj(46, 0, 19.5, 3.6, 3.6, 5.4, { mat: 'hierro' }), cj(46, 0, 20, 2.6, 4, 4.2, { mat: 'fuego' }), cj(46, 0, 20, 4, 2.6, 4.2, { mat: 'fuego' }));
    // bancos, la soga y el remo que asoma
    for (const x of [-12, 10]) ps.push(cj(x, 0, 7.6, 4, 16.6, 1.4, { mat: 'madera_lisa', tono: 0.05 }));
    ps.push(el(-22, 2, 4.6, 3.2, 3.2, 1.2, { mat: 'cuerda' }), el(-22, 2, 5.4, 2, 2, 0.8, { mat: 'cuerda', tono: -0.1 }));
    ps.push(pl([-18, -4, 9], [24, -14, 3], 0.7, { mat: 'madera' }), cj(25, -14.4, 2.6, 7, 3.4, 0.6, { mat: 'madera', giro: -13 }));
    // lo que lleva: un fardo y un cántaro
    ps.push(el(20, 3, 5.6, 4.6, 3.6, 3, { mat: 'tela', tono: -0.08 }), a.cilindro(...P([-4, 4, 4]), 2.2, 5, { mat: 'piedra' }));
    return { piezas: ps, resplandor: { c: P([46, 0, 20]), r: 30, color: '#ffb066' } };
  },
});
