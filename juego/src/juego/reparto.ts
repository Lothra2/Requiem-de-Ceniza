// El reparto de los monstruos por todo el mapa (Rick, 22 nov 2026: "que aparecen como en grupos [...] van apareciendo mientras
// descubro el mundo y si hay zonas con más pero no como en grupitos de x"). Antes `poblar` juntaba todo el presupuesto en los
// campamentos de `acampar` (6 a 10 cuerpos cada 24 celdas, que despertaban juntos) y entre uno y otro no había nada.
//
// Ahora el MISMO presupuesto (las mismas tiradas del mismo dado de `poblar`: cuerpos, experiencia, élites y botín iguales) se
// reparte por todo lo caminable con un campo de densidad con intención y en grupos de tamaños muy distintos: sueltos, parejas,
// manadas de 3 a 6 y, a veces, una mayor alrededor de un chamán. Cada élite sigue en su sitio con su escolta al lado, y cada
// sitio de campamento de la generación (donde están el castigo, la fogata, la ofrenda) guarda una manada: es su guardia.
// Cada grupo lleva su propio `camp` (despierta por lo que ve o lo que oye, no el campamento entero) y algunos rondan.
// Nada se guarda: la zona es la misma (pisos, objetos, `spawns`), solo cambia dónde se paran los cuerpos al entrar.
import { despejeZona, lineaLibre, lineaPasable, libreCerca, pasable, type Zona, type Spawn } from '../mundo/zona';
import { R, entre, dist } from '../nucleo/azar';

/** Lo que `poblar` tiró en cada sitio de la generación: los cuerpos de cada tirada (un grupo de los de antes) por separado. */
export interface SitioTirado { s: Spawn; elite: Mon[]; escolta: Mon[]; tiradas: Mon[][] }
/** Lo justo del monstruo que hace falta acá (para no importar mundo.ts). */
export interface Mon { x: number; y: number; ox: number; oy: number; camp?: number; calidad: number; def: { ia: string; id: string } }
/** Una ronda (los merodeadores): la manada se mueve despacio alrededor de su sitio. La lleva cada cuerpo en `ronda`. */
export interface Ronda { hx: number; hy: number; cx: number; cy: number; ver: number; prox: number }

const deTiro = (m: Mon) => m.def.ia === 'mago' || m.def.ia === 'distancia' || m.def.ia === 'invocador';

/** Lo que mide la última llamada (para las pruebas: `__reparto`). */
export const ULTIMO: { grupos: number[]; rondan: number; anclados: number; ms: number; msCampo: number } = { grupos: [], rondan: 0, anclados: 0, ms: 0, msCampo: 0 };

/**
 * El campo de densidad: cuánto pide cada celda caminable tener algo. Más en lo abierto (salas, claros), en los cruces y junto
 * a lo que hay que cuidar (escenas, relatos, horror, cofres, sitios de campamento); menos en los pasillos y alrededor de las
 * salidas; nada a la vista de una entrada, en el ruedo del jefe ni en el desvío. Encima una ondulación ancha (unas 18 celdas):
 * hay rincones con más y rincones con menos, como en Diablo 2.
 */
function campoDensidad(z: Zona, alc: Uint8Array, desp: Int16Array, llegada?: [number, number]): Float32Array {
  const { W, H } = z, d = new Float32Array(W * H);
  // la ondulación: valores al azar en una red de 18 celdas, interpolados
  const P = 18, gw = Math.ceil(W / P) + 2, gh = Math.ceil(H / P) + 2, red = new Float32Array(gw * gh);
  for (let i = 0; i < red.length; i++) red[i] = 0.35 + R() * 1.3;
  const onda = (x: number, y: number) => {
    const fx = x / P, fy = y / P, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
    const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty), g = (a: number, b: number) => red[b * gw + a];
    return (g(ix, iy) * (1 - sx) + g(ix + 1, iy) * sx) * (1 - sy) + (g(ix, iy + 1) * (1 - sx) + g(ix + 1, iy + 1) * sx) * sy;
  };
  // lo que se cuida
  const cuida: [number, number][] = [];
  for (const sp of z.spawns) if (sp.tipo !== 'jefe') cuida.push([sp.cx, sp.cy]);
  for (const o of z.objetos) if ((o.capa === 'relato' || o.capa === 'escena' || o.capa === 'horror' || o.capa === 'matanza' || o.tag === 'cofre') && R() < 0.5) cuida.push([o.cx, o.cy]);
  for (const m of z.marcas) if (m.tipo === 'cofre' || m.tipo === 'santuario' || m.tipo === 'altar') cuida.push([m.cx, m.cy]);
  const bono = new Float32Array(W * H);
  for (const [cx, cy] of cuida) { const R0 = 9; for (let y = Math.max(0, Math.floor(cy - R0)); y <= Math.min(H - 1, cy + R0); y++) for (let x = Math.max(0, Math.floor(cx - R0)); x <= Math.min(W - 1, cx + R0); x++) { const q = Math.hypot(x - cx, y - cy); if (q < R0) bono[y * W + x] = Math.max(bono[y * W + x], 1 - q / R0); } }
  const ents = Object.values(z.entradas), sals = z.salidas.map((s): [number, number] => [s.cx, s.cy]);
  const jefe = z.spawns.find((s) => s.tipo === 'jefe'), desvios = (z.lugares ?? []).filter((l) => l.papel === 'desvio');
  // los cruces: celdas de paso (despeje bajo) de donde salen tres caminos o más
  const RAY = 12, rayo = (x: number, y: number, a: number) => { for (let k = 2; k <= 6; k++) { const X = Math.round(x + Math.cos(a) * k), Y = Math.round(y + Math.sin(a) * k); if (X < 0 || Y < 0 || X >= W || Y >= H || z.bloq[Y * W + X] === 1 || z.bloq[Y * W + X] === 2) return false; } return true; };
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    const i = y * W + x; if (z.bloq[i] !== 0 || !alc[i]) continue;
    const dp = desp[i]; let v = dp >= 4 ? 1 : dp === 3 ? 0.75 : dp === 2 ? 0.42 : 0.18;
    if (z.claros?.[i]) v *= 1.45;
    v *= 1 + bono[i] * 0.9;
    if (dp <= 3 && (x & 1) === 0 && (y & 1) === 0) {
      let libres = 0, tramos = 0, ant = rayo(x, y, ((RAY - 1) / RAY) * Math.PI * 2);
      for (let k = 0; k < RAY; k++) { const l = rayo(x, y, (k / RAY) * Math.PI * 2); if (l) { libres++; if (!ant) tramos++; } ant = l; }
      if (tramos >= 3 && libres <= 9) v *= 1.9;
    }
    // la puerta por la que se llega: nada a la vista (16 casillas, 24 si se ve) y poco hasta las 28; las otras puertas solo no
    // tienen a nadie encima (9 casillas): por ahí se llega después, con la zona ya poblada
    if (llegada) { const de = Math.hypot(llegada[0] - x, llegada[1] - y); if (de < 16 || (de < 24 && lineaLibre(z, llegada[0] + 0.5, llegada[1] + 0.5, x + 0.5, y + 0.5))) continue; if (de < 28) v *= 0.25 + 0.75 * ((de - 16) / 12); }
    let de = 1e9; for (const e of ents) de = Math.min(de, Math.hypot(e[0] - x, e[1] - y));
    if (de < 9) continue; if (de < 14) v *= 0.3 + 0.7 * ((de - 9) / 5);
    for (const [sx, sy] of sals) { const q = Math.hypot(sx - x, sy - y); if (q < 7) v *= 0.3; else if (q < 11) v *= 0.7; }
    if (jefe) { const q = Math.hypot(jefe.cx - x, jefe.cy - y); if (q < 14 || (q < 22 && lineaLibre(z, x + 0.5, y + 0.5, jefe.cx + 0.5, jefe.cy + 0.5))) continue; }
    if (desvios.some((l) => Math.hypot(l.cx - x, l.cy - y) < 16)) continue;
    d[i] = v * onda(x, y);
  }
  return d;
}

/** Lo que se alcanza caminando desde las entradas (libre o pisable). */
function alcanzaDesde(z: Zona): Uint8Array {
  const { W, H } = z, vis = new Uint8Array(W * H), pila: number[] = [];
  for (const [ex, ey] of Object.values(z.entradas)) for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const X = Math.floor(ex) + dx, Y = Math.floor(ey) + dy; if (X >= 0 && Y >= 0 && X < W && Y < H) { const i = Y * W + X; if (!vis[i] && (z.bloq[i] === 0 || z.bloq[i] === 3)) { vis[i] = 1; pila.push(i); } } }
  if (!pila.length) return vis.fill(1);
  while (pila.length) { const i = pila.pop()!, x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!vis[j] && (z.bloq[j] === 0 || z.bloq[j] === 3)) { vis[j] = 1; pila.push(j); } } }
  return vis;
}

/** Para a los cuerpos de un grupo alrededor de (cx, cy): los de cuerpo a cuerpo hacia el frente, los de tiro y conjuro detrás. */
function parar(z: Zona, cuerpos: Mon[], cx: number, cy: number, frente: [number, number], radio: number, camp: number) {
  const a0 = Math.atan2(frente[1], frente[0]);
  for (const m of cuerpos) {
    const tiro = deTiro(m), jefe = m.calidad >= 1;
    let q: [number, number] = [cx, cy];
    for (let k = 0, esc = 1; k < 5; k++, esc *= 0.65) {
      const a = a0 + (tiro ? Math.PI : 0) + entre(-1.3, 1.3), d = (cuerpos.length === 1 ? entre(0, 0.6) : jefe ? entre(0, 1.2) : tiro ? entre(radio + 1.2, radio + 2.8) : entre(0.6, radio)) * esc;
      q = libreCerca(z, cx + Math.cos(a) * d, cy + Math.sin(a) * d);
      if (lineaPasable(z, cx + 0.5, cy + 0.5, q[0] + 0.5, q[1] + 0.5)) break;
    }
    // (dos en la misma celda no: el que llega segundo busca la libre más cercana del grupo)
    if (usadas.has(q[1] * z.W + q[0])) {
      let b: [number, number] | null = null, bd = 1e9;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = q[0] + dx, Y = q[1] + dy; if (usadas.has(Y * z.W + X) || !pasable(z, X + 0.5, Y + 0.5)) continue; const dd = Math.hypot(dx, dy) + Math.hypot(X - cx, Y - cy) * 0.3; if (dd < bd && lineaPasable(z, cx + 0.5, cy + 0.5, X + 0.5, Y + 0.5)) { bd = dd; b = [X, Y]; } }
      if (b) q = b;
    }
    usadas.add(q[1] * z.W + q[0]);
    m.x = m.ox = q[0] + 0.5; m.y = m.oy = q[1] + 0.5; m.camp = camp;
  }
}
const usadas = new Set<number>();

/**
 * Reparte lo tirado. `llegada`: la entrada por la que llega el héroe. `bienvenida`: héroe de nivel bajo en una zona de inicio
 * (a 40 celdas de su puerta solo hay grupos de 3 o menos, y ningún élite: eso ya lo dejan los `mansos` de `poblar`).
 */
export function repartir(z: Zona, sitios: SitioTirado[], llegada: [number, number] | undefined, bienvenida: boolean): void {
  const t0 = performance.now(), { W, H } = z, alc = alcanzaDesde(z), desp = despejeZona(z), dens = campoDensidad(z, alc, desp, llegada); ULTIMO.msCampo = performance.now() - t0;
  const ents = Object.values(z.entradas);
  const frenteDe = (x: number, y: number): [number, number] => { let bd = 1e9, f: [number, number] = [0, 1]; for (const [ex, ey] of ents) { const d = Math.hypot(ex - x, ey - y); if (d < bd && d > 0.5) { bd = d; f = [(ex - x) / d, (ey - y) / d]; } } return f; };
  let campN = 10000;
  // los grupos ya puestos (centro y cuerpos) para separar
  const puestos: { x: number; y: number; n: number }[] = [];
  ULTIMO.grupos = []; ULTIMO.rondan = 0; ULTIMO.anclados = 0; usadas.clear();
  const sueltos: Mon[][] = [];
  // un sitio a la vista de una puerta no se ancla (al llegar no tiene que haber nadie mirándote): lo suyo va al reparto
  const aLaVista = (x: number, y: number) => (!!llegada && (Math.hypot(llegada[0] - x, llegada[1] - y) < 16 || (Math.hypot(llegada[0] - x, llegada[1] - y) < 24 && lineaLibre(z, llegada[0] + 0.5, llegada[1] + 0.5, x + 0.5, y + 0.5)))) || ents.some(([ex, ey]) => Math.hypot(ex - x, ey - y) < 9);
  const elitesSueltos: SitioTirado[] = [];
  // 1) lo anclado: cada élite en su sitio con su escolta al lado (la segunda oleada), y cada sitio de campamento con su guardia
  const ponerElite = (st: SitioTirado, cx: number, cy: number) => {
    const camp = campN++, f = frenteDe(cx, cy);
    parar(z, st.elite, cx, cy, f, 1.6, camp);
    puestos.push({ x: cx, y: cy, n: st.elite.length + st.escolta.length });
    if (st.escolta.length) {
      // la escolta acampa a un lado, de espaldas al frente: a 4 a 7 celdas, donde se pase en línea recta
      let ex = cx, ey = cy; const a0 = Math.atan2(-f[1], -f[0]);
      for (let k = 0; k < 12; k++) { const a = a0 + entre(-1.6, 1.6), r = entre(4, 7), q = libreCerca(z, cx + Math.cos(a) * r, cy + Math.sin(a) * r); if (alc[q[1] * W + q[0]] && lineaPasable(z, cx + 0.5, cy + 0.5, q[0] + 0.5, q[1] + 0.5)) { ex = q[0]; ey = q[1]; break; } }
      parar(z, st.escolta, ex, ey, f, 1.2 + Math.sqrt(st.escolta.length) * 0.5, camp);
    }
    ULTIMO.grupos.push(st.elite.length + st.escolta.length);
  };
  for (const st of sitios) {
    const visto = aLaVista(st.s.cx, st.s.cy);
    if (st.elite.length) { if (visto) elitesSueltos.push(st); else { ponerElite(st, st.s.cx, st.s.cy); ULTIMO.anclados++; } }
    const tir = st.tiradas.slice();
    if (!st.elite.length && tir.length && !visto) {
      // la guardia del sitio: una tirada, a veces dos juntas (la manada grande de la fogata), a veces solo un par
      let g = tir.shift()!;
      if (tir.length && R() < 0.3) g = g.concat(tir.shift()!);
      else if (g.length >= 3 && R() < 0.3) { sueltos.push(g.slice(2)); g = g.slice(0, 2); }
      const bien = bienvenida && llegada && Math.hypot(llegada[0] - st.s.cx, llegada[1] - st.s.cy) < 40;
      if (bien && g.length > 3) { sueltos.push(g.slice(3)); g = g.slice(0, 3); }
      parar(z, g, st.s.cx, st.s.cy, st.s.frente ?? frenteDe(st.s.cx, st.s.cy), 1 + Math.sqrt(g.length) * 0.8, campN++);
      puestos.push({ x: st.s.cx, y: st.s.cy, n: g.length }); ULTIMO.grupos.push(g.length); ULTIMO.anclados++;
    }
    sueltos.push(...tir);
  }
  // 2) lo demás se parte y se junta: sueltos, parejas, manadas, y alguna mayor alrededor de un chamán
  const grupos: Mon[][] = [];
  for (let k = 0; k < sueltos.length; k++) {
    const t = sueltos[k];
    const conChaman = t.some((m) => m.def.ia === 'invocador');
    if (k + 1 < sueltos.length && (conChaman ? R() < 0.6 : R() < 0.16)) { grupos.push(t.concat(sueltos[++k])); continue; }
    if (t.length >= 3 && R() < 0.3) { const c = R() < 0.5 ? 1 : 2; grupos.push(t.slice(0, c), t.slice(c)); continue; }
    if (t.length === 2 && R() < 0.3) { grupos.push([t[0]], [t[1]]); continue; }
    grupos.push(t);
  }
  // los grandes primero (eligen lo más abierto), los chicos después (caben en los pasillos y rincones)
  grupos.sort((a, b) => b.length - a.length);
  // las celdas donde puede haber algo, para tirar candidatos
  const celdas: number[] = []; let dmax = 0;
  for (let i = 0; i < W * H; i++) if (dens[i] > 0) { celdas.push(i); if (dens[i] > dmax) dmax = dens[i]; }
  const sep = (n: number, m: number) => 4 + 1.25 * Math.sqrt(n + m);
  // los élites que no se pudieron anclar van a lo más denso que quede lejos de todo
  for (const st of elitesSueltos) {
    let mejor = -1, ms = -1, n = st.elite.length + st.escolta.length;
    for (let k = 0, acept = 0; k < 4000 && acept < 64 && celdas.length; k++) {
      const i = celdas[Math.floor(R() * celdas.length)]; if (R() * dmax > dens[i] || desp[i] < 3) continue; acept++;
      const x = i % W, y = (i - x) / W; if (bienvenida && llegada && Math.hypot(llegada[0] - x, llegada[1] - y) < 40) continue;
      if (puestos.some((p) => Math.hypot(p.x - x, p.y - y) < sep(n, p.n) * 1.3)) continue;
      const v = dens[i] * (0.7 + R() * 0.6); if (v > ms) { ms = v; mejor = i; }
    }
    if (mejor >= 0) ponerElite(st, mejor % W, Math.floor(mejor / W)); else ponerElite(st, st.s.cx, st.s.cy);
  }
  for (const g of grupos) {
    const n = g.length, holgura = entre(0.75, 1.5), chico = n <= 2;
    let mejor = -1, ms = -1;
    for (const afloja of [1, 0.7, 0.45]) {
      if (mejor >= 0 || !celdas.length) break;
      for (let k = 0, acept = 0; k < 3000 && acept < 48; k++) {
        const i = celdas[Math.floor(R() * celdas.length)];
        // los chicos no le hacen asco al pasillo: un suelto en un pasillo es lo que se encuentra a la vuelta
        let v = dens[i]; if (chico && desp[i] <= 2) v = Math.max(v, dmax * 0.35 * Math.min(1, v * 4));
        if (R() * dmax > v) continue;
        acept++;
        const x = i % W, y = (i - x) / W;
        if (bienvenida && llegada && n > 3 && Math.hypot(llegada[0] - x, llegada[1] - y) < 40) continue;
        let ok = true, dn = 1e9; for (const p of puestos) { const q = Math.hypot(p.x - x, p.y - y); if (q < sep(n, p.n) * holgura * afloja) { ok = false; break; } dn = Math.min(dn, q); }
        if (!ok) continue;
        // (lo denso tira, pero lo vacío también: un sitio lejos de todo grupo pesa más, así no queda media pantalla sin nadie)
        const s = v * (0.55 + R() * 0.9) * (0.3 + 0.7 * Math.min(1, dn / 26)); if (s > ms) { ms = s; mejor = i; }
      }
    }
    if (mejor < 0) mejor = celdas.length ? celdas[Math.floor(R() * celdas.length)] : -1;
    let x: number, y: number;
    if (mejor < 0) { const s0 = sitios[0]?.s; if (!s0) continue; x = s0.cx; y = s0.cy; } else { x = mejor % W; y = (mejor - x) / W; }
    const camp = campN++;
    parar(z, g, x, y, frenteDe(x, y), 0.9 + Math.sqrt(n) * 0.75, camp);
    puestos.push({ x, y, n }); ULTIMO.grupos.push(n);
    // los merodeadores: una de cada cuatro manadas (más los sueltos) ronda despacio alrededor de su sitio
    if (R() < (n <= 2 ? 0.4 : n <= 4 ? 0.25 : 0.12) && !(llegada && Math.hypot(llegada[0] - x, llegada[1] - y) < 30)) {
      const rd: Ronda = { hx: x, hy: y, cx: x, cy: y, ver: 0, prox: entre(1, 6) };
      for (const m of g) { (m as any).ronda = rd; (m as any).rondaOff = [m.ox - x - 0.5, m.oy - y - 0.5]; }
      ULTIMO.rondan++;
    }
  }
  ULTIMO.ms = performance.now() - t0;
}

/**
 * La ronda de un merodeador (en `actualizarMonstruo`, mientras duerme o deambula). Cada tanto la manada elige otro punto a 4 a
 * 11 celdas de su sitio, al que se llega en línea recta desde donde está, y va para allá a paso lento, cada uno con su lugar en
 * el grupo. Devuelve el punto al que va este cuerpo (o null si está en su sitio).
 */
export function pasoRonda(z: Zona, m: Mon, t: number): [number, number] | null {
  const rd: Ronda | undefined = (m as any).ronda; if (!rd) return null;
  if (t >= rd.prox) {
    rd.prox = t + entre(6, 14);
    for (let k = 0; k < 10; k++) {
      const a = R() * Math.PI * 2, r = entre(4, 11), q = libreCerca(z, rd.hx + Math.cos(a) * r, rd.hy + Math.sin(a) * r);
      if (dist(q[0], q[1], rd.hx, rd.hy) < 13 && lineaPasable(z, rd.cx + 0.5, rd.cy + 0.5, q[0] + 0.5, q[1] + 0.5)) { rd.cx = q[0]; rd.cy = q[1]; rd.ver++; break; }
    }
  }
  const o = m as any;
  if (o.rondaVer !== rd.ver) { o.rondaVer = rd.ver; const off = o.rondaOff ?? [0, 0]; const q = libreCerca(z, rd.cx + off[0], rd.cy + off[1]); o.rondaDest = lineaPasable(z, rd.cx + 0.5, rd.cy + 0.5, q[0] + 0.5, q[1] + 0.5) ? [q[0] + 0.5, q[1] + 0.5] : [rd.cx + 0.5, rd.cy + 0.5]; }
  const d = o.rondaDest as [number, number] | undefined;
  if (!d || dist(m.x, m.y, d[0], d[1]) < 0.4) return null;
  return d;
}
