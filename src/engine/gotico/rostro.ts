import { elipsoide, palo, bulto, hueso, masa, type Comp, type Pieza, type V3 } from './render';
import { MATERIALES } from './materiales';

/**
 * La cara de los héroes, tallada (19 nov 2026). Antes la cabeza era la de todos (cráneo, mandíbula, pómulos y nariz
 * de la masa del cuerpo) y la cara eran piezas pegadas encima: cuencas, ojos blancos, cejas y pómulos que abultaban
 * como calcomanías. En el muñeco y en la selección se leía un antifaz con ojos saltones y la mandíbula salía más
 * adelante que la frente (un hocico).
 *
 * Ahora la cara se esculpe en la masa (`cabezaHeroe`, la llama `partes` solo para los héroes):
 * - el cráneo va más atrás y la frente es una pieza propia, así el ojo queda HUNDIDO bajo el arco de las cejas y
 *   entre el puente de la nariz y el pómulo (la sombra de la cuenca sale de la forma y de la oclusión, no de pintura);
 * - arco de las cejas con el entrecejo, reborde de la órbita, pómulos altos, el hocico de la boca (maxilar) que no
 *   pasa de la frente, labios (el de arriba en sombra, el de abajo agarra luz), surco del mentón, mentón, ángulo de la
 *   mandíbula y orejas; nariz con lomo, punta y aletas. Ella: frente lisa, cejas y mandíbula más finas, labios llenos.
 * Y encima (`rasgos`), por escala (`detalle`): en el juego (cabeza de 10 a 14 puntos) el ojo es un trazo oscuro
 * hundido (los blancos a esa escala eran anteojos) y las cejas; desde el muñeco (detalle 2) el ojo tiene su blanco
 * apagado, el iris con brillo y el párpado de arriba, la línea de la boca, las comisuras y el surco de la nariz.
 * Unidades de cabeza (H): la cara llega a ~3,9 adelante, los ojos a 0,3 de alto, la nariz a 5,1 (el yelmo cerrado
 * cubre hasta 5,3).
 */
type Fn = (fw: number, rt: number, up: number) => V3;
export interface MarcoCab { cab: Fn; ejes: [V3, V3, V3]; cz: number; H: number }

/** Elipsoide con los ejes de la cabeza, en unidades de cabeza (H). */
function elipCab(m: MarcoCab, fw: number, rt: number, up: number, r: V3, mat: string, tono = 0): Pieza {
  const [x, y, z] = m.cab(fw * m.H, rt * m.H, m.cz + up * m.H);
  return { ...elipsoide(x, y, z, r[0] * m.H, r[1] * m.H, r[2] * m.H, { mat, tono }), ex: m.ejes[0], ey: m.ejes[1], ez: m.ejes[2] } as Pieza;
}
const P = (m: MarcoCab, fw: number, rt: number, up: number): V3 => m.cab(fw * m.H, rt * m.H, m.cz + up * m.H);
const nrm = (v: V3): V3 => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
const crz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** Una dirección de la cabeza (fw, rt, up) en el mundo. */
const dirCab = (m: MarcoCab, v: V3): V3 => { const o = P(m, 0, 0, 0), q = P(m, v[0], v[1], v[2]); return nrm([q[0] - o[0], q[1] - o[1], q[2] - o[2]]); };
/** Ejes de un bulto girado en la cabeza: x hacia `ax`, z lo más cerca de `arriba`. */
function ejesGir(m: MarcoCab, ax: V3, arriba: V3 = [0, 0, 1]): [V3, V3, V3] {
  const ex = dirCab(m, ax), up = dirCab(m, arriba), ey = nrm(crz(up, ex)), ez = crz(ex, ey);
  return [ex, ey, ez];
}

/** El material de los labios de una piel: la misma rampa tirada al rojo (ella más que él). */
export function labioDe(piel: string, mujer: boolean): string {
  const id = `${piel}_labio${mujer ? '_m' : ''}`;
  if (MATERIALES[id]) return id;
  const base = MATERIALES[piel];
  if (!base) return piel;
  const k = mujer ? 0.24 : 0.1, R = [150, 52, 46];
  const rampa = base.rampa.map((h) => {
    const c = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
    return '#' + c.map((v, i) => Math.round(v + (R[i] * (0.35 + 0.65 * (v / 255)) - v) * k).toString(16).padStart(2, '0')).join('');
  });
  MATERIALES[id] = { ...base, rampa };
  return id;
}

export interface OpcCabeza { mujer: boolean; grasa?: number; orejas?: 'puntiagudas' | 'grandes'; piel?: string; mat?: string; inf?: number }
/**
 * La cabeza del héroe como componentes de la masa de la carne (unión suave con radios chicos: cada forma se lee).
 * `mat` es el de la masa (la piel); los labios llevan su material.
 */
export function cabezaHeroe(m: MarcoCab, o: OpcCabeza): Comp[] {
  const H = m.H, inf = o.inf ?? 0, mj = o.mujer, gr = o.grasa ?? 0, mat = o.mat;
  const B = (fw: number, rt: number, up: number, r: V3, k: number, tono?: number, mt = mat): Comp =>
    bulto(P(m, fw, rt, up), [r[0] * H + inf, r[1] * H + inf, r[2] * H + inf], { ejes: m.ejes, mat: mt, tono, k: k * H });
  const Bg = (fw: number, rt: number, up: number, r: V3, k: number, ax: V3, arriba: V3, tono?: number, mt = mat): Comp =>
    bulto(P(m, fw, rt, up), [r[0] * H + inf, r[1] * H + inf, r[2] * H + inf], { ejes: ejesGir(m, ax, arriba), mat: mt, tono, k: k * H });
  const Hu = (a: V3, b: V3, r0: number, r1: number, k: number, tono?: number): Comp =>
    hueso(P(m, ...a), P(m, ...b), r0 * H + inf, r1 * H + inf, { mat, tono, k: k * H });
  const cs: Comp[] = [];
  // el cráneo, más atrás que el de la gente (la cara no es su frente): la frente va aparte, arriba del arco
  // (formas redondas con uniones anchas: la luz cae de a poco, sin repisas que se lean como franjas)
  // (sin pasarse de la frente de antes: los cascos se arman a esa medida y la piel asomaba por el borde)
  cs.push(B(-0.4, 0, 0.95, [3.85, 3.55, 4.3], 1.2));
  cs.push(B(0.85, 0, 1.75, [2.78, mj ? 2.9 : 3.0, 1.9], 1.0));
  // el arco de las cejas (dos, con el entrecejo): el techo de la cuenca; en ella apenas marcado
  for (const s of [1, -1]) cs.push(Bg(mj ? 2.85 : 2.9, s * 1.3, 1.05, mj ? [0.72, 1.4, 0.5] : [0.82, 1.45, 0.6], 0.9, [1, -s * 0.18, 0], [0, 0, 1]));
  cs.push(B(mj ? 3.1 : 3.2, 0, 0.85, [0.6, 0.75, 0.6], 0.8));
  // el reborde de afuera de la órbita (cierra la cuenca de costado) y el pómulo alto, bajo el ojo
  for (const s of [1, -1]) {
    cs.push(B(2.1, s * 2.55, 0.45, [1.0, 0.85, 1.25], 1.0));
    cs.push(Bg(2.3, s * 2.1, -0.95, [1.25, 1.2, 1.05], 1.1, [1, s * 0.45, 0], [0.25, 0, 1]));
  }
  // la nariz: el lomo angosto entre los ojos, la punta y las aletas
  cs.push(Hu([3.5, 0, 0.72], [4.42, 0, -0.82], mj ? 0.32 : 0.36, mj ? 0.42 : 0.48, 0.4, 0.05));
  cs.push(B(mj ? 4.38 : 4.5, 0, -1.02, mj ? [0.5, 0.5, 0.45] : [0.58, 0.56, 0.5], 0.35, 0.06));
  for (const s of [1, -1]) cs.push(B(3.95, s * (mj ? 0.48 : 0.56), -1.18, [0.48, 0.36, 0.38], 0.28, -0.04));
  // el maxilar (la boca no pasa de la frente), los labios y el mentón con su surco
  cs.push(B(2.5, 0, -1.95, [1.32, mj ? 1.62 : 1.75, 1.15], 1.1));
  const lab = o.piel ? labioDe(o.piel, mj) : mat;
  cs.push(Bg(3.6, 0, -2.02, mj ? [0.42, 0.98, 0.3] : [0.4, 1.0, 0.27], 0.3, [1, 0, -0.25], [0, 0, 1], mj ? -0.02 : -0.1, lab));
  cs.push(Bg(3.5, 0, -2.5, mj ? [0.46, 0.88, 0.34] : [0.4, 0.82, 0.28], 0.28, [1, 0, 0.35], [0, 0, 1], mj ? 0.1 : 0.05, lab));
  cs.push(B(2.95, 0, -3.2, [0.9, mj ? 1.0 : 1.32, 0.82], 0.55, 0.03));
  // la mandíbula con su ángulo marcado (en él), atrás y abajo de la oreja
  cs.push(B(0.9, 0, -2.0, [2.8, (mj ? 2.48 : 2.85) + gr * 0.6, 2.35], 1.1));
  if (!mj) for (const s of [1, -1]) cs.push(B(-0.15, s * 2.55, -2.6, [1.15, 0.72, 1.0], 0.7));
  // las orejas: la concha y el lóbulo (o en punta)
  for (const s of [1, -1]) {
    if (o.orejas === 'puntiagudas') cs.push(hueso(P(m, -0.2, s * 3.4, 0), P(m, -1.6, s * 5.6, 2.4), 0.9 * H, 0.2 * H, { mat, k: 0.6 * H }));
    else {
      const g = o.orejas === 'grandes' ? 1.3 : 1;
      cs.push(Bg(-0.4, s * 3.42, -0.05, [0.95 * g, 0.48, 1.5 * g], 0.45, [1, s * 0.25, 0], [0.15, 0, 1]));
      cs.push(B(-0.25, s * 3.4, -1.25, [0.55, 0.42, 0.5], 0.4));
    }
  }
  return cs;
}

export interface OpcRasgos { piel: string; ceja?: string; mujer: boolean; barba: boolean; bigote?: boolean; ojo: string; brilla: boolean; detalle?: number; /** el ceño (0 sereno a 1 furioso): baja la ceja hacia el entrecejo */ gesto?: number }
/**
 * Lo que va encima de la cabeza tallada: los ojos dentro de la cuenca, las cejas sobre el arco y, desde el muñeco, el
 * párpado, la línea de la boca con sus comisuras y el surco de la nariz. Las líneas oscuras van HUNDIDAS en la masa:
 * solo asoman donde la forma hace un pliegue (entre los labios, junto a la aleta), como se entinta un pliegue.
 */
export function rasgos(m: MarcoCab, o: OpcRasgos): Pieza[] {
  const ps: Pieza[] = [], det = o.detalle ?? 1, H = m.H, mj = o.mujer;
  const ojoVivo = MATERIALES[o.ojo + '_vivo'] ? o.ojo + '_vivo' : o.ojo;
  for (const s of [1, -1]) {
    if (!o.brilla) {
      if (det >= 2) {
        // el globo: blanco apagado (en la sombra de la cuenca), el iris con su brillo y el párpado de arriba que lo corta
        // (el globo adelante, casi al ras del arco: hundido se leía dormido)
        ps.push(elipCab(m, 3.16, s * 1.36, 0.26, [0.5, 0.68, 0.46], 'cu_ojo_blanco', 0.2));
        ps.push(elipCab(m, 3.5, s * 1.3, 0.24, [0.22, 0.3, 0.32], ojoVivo));
        // el brillo: un punto claro arriba del iris (mirada despierta)
        ps.push(elipCab(m, 3.72, s * 1.2, 0.38, [0.1, 0.14, 0.14], 'cu_ojo_brillo'));
        // los párpados: el de arriba corta apenas el iris (gesto firme), el de abajo cierra el ojo
        ps.push({ ...elipsoide(...P(m, 3.16, s * 1.36, 0.86), 0.58 * H, 0.74 * H, 0.32 * H, { mat: o.piel, tono: -0.03 }), ...ejesP(m, [1, -s * 0.1, -0.3]) } as Pieza);
        ps.push({ ...elipsoide(...P(m, 3.12, s * 1.36, -0.3), 0.52 * H, 0.68 * H, 0.22 * H, { mat: o.piel, tono: 0.03 }), ...ejesP(m, [1, -s * 0.1, 0.25]) } as Pieza);
        // la línea de las pestañas en el canto del párpado: dibuja el ojo (más marcada en ella)
        const rp = (mj ? 0.12 : 0.085) * H;
        ps.push(palo(P(m, 3.5, s * 0.82, 0.56), P(m, 3.64, s * 1.42, 0.58), rp, { mat: 'cu_ojo', r1: rp }));
        ps.push(palo(P(m, 3.64, s * 1.42, 0.58), P(m, 3.36, s * (mj ? 2.06 : 1.98), mj ? 0.66 : 0.58), rp, { mat: 'cu_ojo', r1: rp * 0.6 }));
      } else {
        // en el juego: un trazo oscuro en el fondo de la cuenca (blanco y pupila a 1 punto eran anteojos)
        ps.push(elipCab(m, 3.22, s * 1.36, 0.22, [0.5, 0.68, 0.34], o.ojo));
      }
    }
    // la ceja: dos tramos que se afinan hacia afuera; adentro baja hacia el entrecejo según el ceño de la clase. En ella
    // más fina y en arco. (Las barras gruesas y parejas de antes eran un antifaz)
    const ceja = o.ceja ?? o.piel, tc = o.ceja ? -0.18 : 0.12, g = o.gesto ?? 0.5;
    const a: V3 = mj ? [3.66, 0.48, 1.22 - 0.08 * g] : [3.74, 0.42, 1.04 - 0.16 * g], b: V3 = mj ? [3.56, 1.32, 1.5] : [3.62, 1.3, 1.24], c: V3 = mj ? [3.04, 2.18, 1.38] : [3.12, 2.25, 1.26 + 0.06 * g];
    const r = (mj ? 0.12 : 0.17) * H;
    ps.push(palo(P(m, a[0], s * a[1], a[2]), P(m, b[0], s * b[1], b[2]), r, { mat: ceja, tono: tc, r1: r * 0.8 }));
    ps.push(palo(P(m, b[0], s * b[1], b[2]), P(m, c[0], s * c[1], c[2]), r * 0.8, { mat: ceja, tono: tc - 0.04, r1: r * 0.32 }));
    if (det >= 2) {
      // el surco de la aleta de la nariz y (en él) el pliegue que baja a la comisura
      ps.push(palo(P(m, 4.05, s * 0.86, -0.9), P(m, 4.12, s * 0.74, -1.42), 0.09 * H, { mat: o.piel, tono: -0.4 }));
      if (!o.barba) ps.push(palo(P(m, 3.66, s * 1.05, -1.4), P(m, 3.32, s * 1.28, -2.28), 0.08 * H, { mat: o.piel, tono: mj ? -0.12 : -0.22 }));
    }
  }
  if (det >= 2 && !(o.barba && !o.bigote)) {
    // la boca: la línea hundida entre los labios y las comisuras (apenas abajo: gesto serio)
    ps.push(palo(P(m, 3.55, 0.95, -2.34), P(m, 3.86, 0, -2.25), 0.1 * H, { mat: o.piel, tono: -0.7 }));
    ps.push(palo(P(m, 3.86, 0, -2.25), P(m, 3.55, -0.95, -2.34), 0.1 * H, { mat: o.piel, tono: -0.7 }));
  }
  return ps;
}
/** Ejes de una pieza suelta girada en la cabeza (para el párpado). */
function ejesP(m: MarcoCab, ax: V3): { ex: V3; ey: V3; ez: V3 } { const [ex, ey, ez] = ejesGir(m, ax); return { ex, ey, ez }; }

/**
 * La barba del héroe: volumen pegado a la mandíbula que deja ver el labio de abajo, el bigote que cae por las
 * comisuras y mechones con punta en el borde (no un bloque). Larga: el chorro que baja del mentón en mechones;
 * trenzada: la trenza de nudos. Devuelve las piezas (masa + mechones sueltos).
 */
export function barbaHeroe(m: MarcoCab, tipo: 'corta' | 'larga' | 'bigote' | 'trenzada', mat: string, det: number): Pieza[] {
  const H = m.H, cs: Comp[] = [], ps: Pieza[] = [];
  const B = (fw: number, rt: number, up: number, r: V3, k: number, tono?: number): Comp => bulto(P(m, fw, rt, up), [r[0] * H, r[1] * H, r[2] * H], { ejes: m.ejes, mat, tono, k: k * H });
  const Hu = (a: V3, b: V3, r0: number, r1: number, k: number, tono?: number): Comp => hueso(P(m, ...a), P(m, ...b), r0 * H, r1 * H, { mat, tono, k: k * H });
  // el bigote: del surco bajo la nariz a las comisuras, y cae
  for (const s of [1, -1]) {
    cs.push(Hu([4.08, s * 0.12, -1.6], [3.92, s * 0.95, -1.92], 0.36, 0.34, 0.3, 0.06));
    cs.push(Hu([3.92, s * 0.95, -1.92], [3.55, s * 1.38, tipo === 'bigote' ? -2.55 : -2.7], 0.34, 0.16, 0.25, -0.02));
  }
  if (tipo !== 'bigote') {
    // la barba sobre la mandíbula: los carrillos, el mentón y abajo (deja el labio de abajo a la vista)
    for (const s of [1, -1]) cs.push(B(1.75, s * 2.35, -2.0, [1.75, 0.8, 1.6], 0.6));
    cs.push(B(2.65, 0, -3.35, [1.38, 1.7, 1.25], 0.6, 0.02));
    cs.push(B(1.3, 0, -3.35, [2.2, 2.55, 1.35], 0.7, -0.04));
    for (const s of [1, -1]) cs.push(B(0.2, s * 2.75, -1.3, [0.9, 0.55, 1.6], 0.5)); // patilla
    // los mechones del borde: puntas que bajan desparejas (alternan luz y sombra)
    const n = 7;
    for (let i = 0; i < n; i++) {
      const u = (i / (n - 1)) * 2 - 1, rt = u * 2.3, fw = 3.0 - Math.abs(u) * 1.7, up = -3.7 - (1 - Math.abs(u)) * 0.6 + Math.abs(u) * 0.9;
      const l = (tipo === 'corta' ? 1.0 : 1.5) + (i % 2) * 0.45 + (i === 3 ? 0.3 : 0);
      cs.push(Hu([fw, rt, up], [fw + 0.25, rt * 1.08, up - l], 0.58, 0.14, 0.3, i % 2 ? -0.08 : 0.07));
    }
    if (tipo === 'larga') {
      // el chorro largo del mentón en mechones paralelos con las puntas a distinto largo
      for (const [rt, l, t] of [[-0.95, 5.6, 0.04], [0, 6.4, 0.1], [0.95, 5.2, -0.04], [-0.45, 6.0, -0.08], [0.5, 5.9, 0.02]] as const)
        cs.push(Hu([2.9, rt, -3.6], [3.55, rt * 0.7, -3.6 - l], 0.95, 0.22, 0.45, t));
    }
    if (tipo === 'trenzada') {
      // la trenza: nudos que se alternan de lado y se afinan, con un anillo de metal en la punta
      let c: V3 = [3.0, 0, -4.3];
      for (let i = 0; i < 6; i++) {
        const lado = i % 2 ? 1 : -1, r = 0.95 - i * 0.1;
        cs.push(bulto(P(m, c[0], c[1] + lado * 0.18, c[2]), [r * H, r * 0.95 * H, r * 1.05 * H], { ejes: ejesGir(m, [0.15, lado * 0.5, -1], [1, 0, 0]), mat, tono: lado > 0 ? 0.08 : -0.08, k: 0.2 * H }));
        c = [c[0] + 0.12, 0, c[2] - r * 1.25];
      }
      ps.push(elipCab(m, c[0], 0, c[2] + 0.55, [0.42, 0.42, 0.32], 'cu_placa_oscura'));
      cs.push(Hu([c[0], 0, c[2] + 0.2], [c[0] + 0.1, 0, c[2] - 0.9], 0.35, 0.12, 0.2));
    }
  }
  ps.unshift(masa(cs, { mat, suave: 0.6 * H }));
  void det;
  return ps;
}

/**
 * Mechones y raya del pelo corto o largo (no rapado ni cresta): la raya, un surco oscuro de la frente a la coronilla a
 * un costado; mechones del flequillo que caen sobre la frente sin taparla; y puntas en la nuca que rompen el borde.
 */
export function mechones(m: MarcoCab, pelo: string, mujer: boolean): Pieza[] {
  const ps: Pieza[] = [];
  // la raya (hundida en el pelo: se ve como surco, no como un palo encima)
  ps.push(palo(P(m, 2.0, 1.05, 4.6), P(m, -1.6, 1.2, 5.3), 0.28 * m.H, { mat: pelo, tono: -0.45 }));
  // el flequillo: tres mechones desparejos que bajan del nacimiento del pelo, chatos contra la frente
  // el flequillo va en la masa del pelo (flequilloHeroe); aquí solo los cortes entre mechas, hundidos: se ven como surcos
  for (const rt of [-0.75, 1.15]) ps.push(palo(P(m, 3.0, rt, 3.75), P(m, 3.32, rt - 0.3, 2.85), 0.13 * m.H, { mat: pelo, tono: -0.4, r1: 0.06 * m.H }));
  // la nuca: puntas que salen del borde de atrás
  for (const s of [1, -1, 0]) {
    const rt = s * 2.0;
    ps.push(palo(P(m, -3.6, rt, 0.2), P(m, -4.1, rt * 1.1, mujer ? -1.6 : -1.0), 0.7 * m.H, { mat: pelo, tono: s === 0 ? -0.06 : 0.05, r1: 0.2 * m.H }));
  }
  return ps;
}

/**
 * El flequillo del héroe como parte de la masa del pelo: la franja sobre la frente y tres mechas que bajan pegadas a su
 * curva, fundidas con el resto (antes eran piezas sueltas: de cerca, dientes o escamas).
 */
export function flequilloHeroe(m: MarcoCab): Comp[] {
  const H = m.H, cs: Comp[] = [];
  const frente = (up: number) => Math.max(0.9 + 2.95 * Math.sqrt(Math.max(0, 1 - ((up - 1.75) / 1.9) ** 2)), -0.4 + 3.85 * Math.sqrt(Math.max(0, 1 - ((up - 0.95) / 4.3) ** 2)));
  cs.push(bulto(P(m, 1.0, 0, 3.75), [2.6 * H, 3.4 * H, 1.2 * H], { ejes: m.ejes, k: 1.4 * H }));
  for (const [rt, largo, t] of [[-1.6, 1.0, 0.06], [0.2, 1.35, 0.1], [2.0, 0.85, 0.02]] as const) {
    const u0 = 3.75, u1 = 3.75 - largo, uc = (u0 + u1) / 2;
    cs.push(bulto(P(m, frente(uc) - 0.05, rt - 0.15, uc), [(largo / 2 + 0.45) * H, 0.75 * H, 0.32 * H], { ejes: ejesGir(m, [frente(u1) - frente(u0), -0.3, u1 - u0], [1, 0, 0]), tono: t, k: 0.6 * H }));
  }
  return cs;
}

/**
 * Las hebras del pelo (y de la barba) en el material: lomos y surcos finos alrededor del eje de cada pieza, que en la
 * cabeza salen de la coronilla y en el pelo largo bajan a lo largo; el surco hunde más de lo que levanta el lomo.
 */
export function hebras(p: V3): number {
  const a = Math.atan2(p[1], p[0]), c = Math.cos(a * 16 + Math.sin(p[2] * 0.55) * 1.1);
  // cerca del eje las hebras se juntan: se apagan (si no, un remolino de puntos en la coronilla)
  const k = Math.min(1, Math.hypot(p[0], p[1]) / 1.6);
  return k * (c > 0.5 ? 0.07 : c < -0.35 ? -0.16 : 0);
}
