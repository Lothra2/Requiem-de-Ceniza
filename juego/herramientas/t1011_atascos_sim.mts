// Atascos sin navegador: lo mismo que t995_atascos.cjs pero con el juego cargado en Node (rápido, muchas zonas y semillas).
// En cada zona pone al héroe quieto en puntos con muro cerca, despierta 6 cuerpos a 6 a 16 casillas (también detrás de muros)
// y corre 9 s. Atascado: tiene camino de verdad al héroe, no está a tiro y en los últimos 3 s se acercó menos de 0,6.
//   npx tsx juego/herramientas/t1011_atascos_sim.mts [zonas] [semillas]   (DETALLE=1 imprime cada atascado)
// (entrega 7) No cuenta al que acorta su rodeo entre los cuerpos (`rodean`), al que no tiene rodeo aceptable (`esperan`) ni al que está
// pegando o en maniobra (`actuan`); SIN_RODEO=1, SIN_TURNO=1 y SIN_ACTUA=1 los vuelven a contar.
// (entrega 8) `esperaMax`: la espera parada más larga de uno que espera su turno (segundos); `vacio`: cuadros esperando con nadie
// pegándole al héroe (tiene que dar 0: sin corro no hay turno).
// (entrega 9) Todo se puede repetir: el azar de cada zona y semilla sale de `SEMILLA` (si no se da, una al azar que se imprime), los
// cuerpos llevan ids fijos y el reloj del juego arranca en un punto propio de cada zona; así `SEMILLA=n S=s t1011 <zona>` da
// exactamente lo mismo que esa zona dentro de la corrida entera (antes el contador de ids del juego y el lado de Thor arrastraban lo de
// las zonas de antes: por eso el atascado de a7_islas2 no salía corriendo esa zona sola). Cada atascado deja su traza entera (cada
// cuadro, los 6 cuerpos, y el progreso cada medio segundo) en /tmp/requiem-pruebas/atascos/<semilla>/ con la línea para repetirlo;
// también la deja el que espera más de 2,5 s con un hueco (`espera_`) y el que solo la cuenta de la entrega 8 da por atascado (`e8_`).
// `S=` corre solo esa semilla de zona, `FIRMA=1` imprime una huella de cada lugar (para comprobar que repetir da lo mismo).
// (entrega 9) La cuenta objetiva (`objetiva`), que no mira nada del juego: cada medio segundo arma, con los cuerpos de ese momento, el
// campo de distancias por donde cabe el cuerpo entero (media casilla, muros y los otros cuerpos) hasta el aro de golpe libre del
// héroe, y suma cuánto lo acercó al aro lo que caminó en ese medio segundo. En los últimos 3 s: `llegaron` (a tiro), `avanzan` (se
// acercaron 0,6 o más por ese campo o por el camino de los muros), `corroLleno` (no había aro libre adonde llegar en 4 de cada 5
// vistazos y alguien le pega al héroe), `otroObjetivo` (se fue un rato tras Thor: no cuenta), `actuan` (hizo una maniobra: en la prueba nadie pega, cd 999), `rondan` (el aro libre solo
// a más de 20 casillas de camino y se movió), `esperan` (lo más largo sin acercarse teniendo adónde ir fue menos de 2,5 s), `vaiven`
// (caminó 3 casillas o más sin acercarse con el hueco ahí) y `atascados` (2,5 s o más sin acercarse teniendo adónde ir). La cuenta de
// siempre (`atascados` del primer renglón) es ahora la de la entrega 8 que además la objetiva da por atascado o de acá para allá;
// `atascadosE8` es la de la entrega 8 sola (`CRIBA_E8=1` la vuelve la principal). También mide la espera parada con un hueco libre
// (`esperaHueco`: la racha más larga de quieto (mientras va por el héroe: el que persigue a un invocado y ya lo tiene a tiro, sin
//  poder pegar en la prueba, no espera un hueco), menos de 0,15 por medio segundo, con el aro libre alcanzable; por largo del camino).
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
const mulberry = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const fnv = (s: string) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return h >>> 0; };
// (el juego guarda `R = Math.random` al cargar: se cambia la fuente por debajo, no la función)
const BASE = +(process.env.SEMILLA || (Date.now() % 1000000)); let azar = mulberry(BASE); Math.random = () => azar();
const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
(globalThis as any).__frenteViejo = true; (globalThis as any).__thorLejos = true;
for (const b of (process.env.BANDERAS || '').split(',').filter(Boolean)) { const [k, v] = b.split('='); (globalThis as any)[k] = v === undefined ? true : isNaN(+v) ? v : +v; }
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const HE = await sv.ssrLoadModule('/src/juego/heroe.ts'), MU = await sv.ssrLoadModule('/src/juego/mundo.ts'), ZO = await sv.ssrLoadModule('/src/mundo/zona.ts'), MO = await sv.ssrLoadModule('/src/datos/monstruos.ts'), AC = await sv.ssrLoadModule('/src/mundo/actos.ts');
const ZONAS = (process.argv[2] && process.argv[2] !== 'todas' ? process.argv[2].split(',') : Object.values<any>(AC.ZONAS).filter((z) => z.tipo === 'mazmorra' && !z.casa && AC.POBL_ZONA[z.id]).map((z) => z.id));
const SEM = +(process.argv[3] || 2), DT = 1 / 30, SOLO_S = process.env.S !== undefined ? +process.env.S : null;
const DIR = `/tmp/requiem-pruebas/atascos/${BASE}`;
console.log('SEMILLA', BASE);
const tot: any = { lugares: 0, perseguian: 0, atascados: 0 };
const obj: any = { perseguian: 0, otroObjetivo: 0, llegaron: 0, avanzan: 0, actuan: 0, corroLleno: 0, rondan: 0, esperan: 0, vaiven: 0, atascados: 0 };
const espH: { t: number; l: number; zid: string; s: number; li: number; id: string }[] = [];
// lo que le falta caminar hasta el héroe (por el camino de verdad: rodear un muro aleja en línea recta y no es atascarse)
let zz: any, hh: any;
// (entrega 7) lo que le falta por el rodeo entre los cuerpos (con las reservas de los demás): el que da la vuelta al corro por el
// lado libre se aleja en línea recta y por el camino de la grilla (que no ve los cuerpos), pero se acerca por este
const rodeoLargo = (j: any, m: any) => { const r = MU.rodeoAceptable ? MU.rodeoAceptable(j, m, hh) : null; if (!r) return null; let l = 0, x = m.x, y = m.y; for (const [a, b] of r.camino) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l; };
const largo = (m: any) => { const c = ZO.buscarCamino(zz, m.x, m.y, hh.x, hh.y, 40000, true); if (!c) return 1e9; let l = 0, x = m.x, y = m.y; for (const [a, b] of c) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l + Math.hypot(hh.x - x, hh.y - y) * 3; };
// (entrega 9) el campo objetivo: media casilla, 22 x 22 casillas alrededor del héroe; libre donde cabe el cuerpo entero (los cuatro
// puntos a 0,35, como el juego) y no pisa a otro cuerpo; la meta es el aro de golpe libre que se ve desde el héroe
const G = 0.5, NG = 45;
let fijo: any = null; // (lo que no cambia en un lugar: dónde cabe el cuerpo entre los muros y lo que se ve desde el héroe)
function campoFijo(j: any, h: any) {
  const z = j.zona, ox = h.x - ((NG - 1) * G) / 2, oy = h.y - ((NG - 1) * G) / 2, pas = new Uint8Array(NG * NG), ve = new Uint8Array(NG * NG);
  for (let gy = 0; gy < NG; gy++) for (let gx = 0; gx < NG; gx++) { const x = ox + gx * G, y = oy + gy * G, i = gy * NG + gx;
    if (ZO.pasable(z, x, y) && ZO.pasable(z, x - 0.35, y) && ZO.pasable(z, x + 0.35, y) && ZO.pasable(z, x, y - 0.35) && ZO.pasable(z, x, y + 0.35)) pas[i] = 1;
    if (pas[i] && Math.hypot(x - h.x, y - h.y) < 2.6 && ZO.lineaPasable(z, h.x, h.y, x, y)) ve[i] = 1; }
  fijo = { ox, oy, pas, ve, h };
}
function campo(j: any, m: any, h: any, meta?: [number, number] | null) {
  const { ox, oy, pas, ve } = fijo, aro = m.radio + h.radio + 0.7; // (dentro del alcance del golpe, radio + radio + 0,75, con un pelo de margen)
  const otros = j.monstruos.filter((o: any) => o !== m && !o.muerto && Math.abs(o.x - h.x) < 13 && Math.abs(o.y - h.y) < 13).map((o: any) => ({ x: o.x, y: o.y, radio: o.radio }));
  // (el hueco que ya tomó otro que va hacia él, vivo y por el mismo héroe, está tomado: es un cuerpo que ya viene)
  for (const r of (h.huecosCorro ?? [])) if (r.m !== m && !r.m.muerto && r.m.objetivo === h && r.m.huecoR === r && j.t - r.t <= 1.5) otros.push({ x: r.x, y: r.y, radio: r.m.radio });
  const libre = pas.slice(), D = new Float32Array(NG * NG).fill(Infinity), cola: number[] = [];
  for (const o of otros) { const rr = o.radio + m.radio, x0 = Math.max(0, Math.ceil((o.x - rr - ox) / G)), x1 = Math.min(NG - 1, Math.floor((o.x + rr - ox) / G)), y0 = Math.max(0, Math.ceil((o.y - rr - oy) / G)), y1 = Math.min(NG - 1, Math.floor((o.y + rr - oy) / G));
    for (let gy = y0; gy <= y1; gy++) for (let gx = x0; gx <= x1; gx++) if (Math.hypot(ox + gx * G - o.x, oy + gy * G - o.y) < rr) libre[gy * NG + gx] = 0; }
  for (let gy = 0; gy < NG; gy++) for (let gx = 0; gx < NG; gx++) { const i = gy * NG + gx; if (!libre[i]) continue; const dh = Math.hypot(ox + gx * G - h.x, oy + gy * G - h.y);
    if (dh < m.radio + h.radio) { libre[i] = 0; continue; } // (encima del héroe no se para nadie)
    if (meta ? Math.hypot(ox + gx * G - meta[0], oy + gy * G - meta[1]) < 0.4 : dh <= aro && ve[i]) { D[i] = 0; cola.push(i); } }
  // (Dijkstra de 8 vecinos sin cortar esquinas; con montículo simple de arreglo ordenado por cubetas de 0,05)
  const cub: number[][] = []; for (const i of cola) (cub[0] ??= []).push(i);
  for (let b = 0; b < cub.length; b++) { const L = cub[b]; if (!L) continue; for (let k = 0; k < L.length; k++) { const i = L[k], d = D[i]; if (Math.round(d / 0.05) !== b) continue; const gx = i % NG, gy = (i - gx) / NG;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const X = gx + dx, Y = gy + dy; if (X < 0 || Y < 0 || X >= NG || Y >= NG) continue; const n = Y * NG + X; if (!libre[n]) continue; if (dx && dy && (!libre[gy * NG + X] || !libre[Y * NG + gx])) continue;
      const nd = d + (dx && dy ? G * Math.SQRT2 : G); if (nd < D[n] - 1e-6) { D[n] = nd; (cub[Math.round(nd / 0.05)] ??= []).push(n); } } } }
  // lo que le falta desde (x, y): por las cuatro celdas de alrededor (el cuerpo queda entre celdas), si están libres
  //  y solo si el tramo de ahí a la celda no pasa por otro cuerpo ni por el muro: si no, saltaba al otro lado del que lo encierra)
  const z = j.zona, tramo = (x: number, y: number, X: number, Y: number) => { for (let k = 1; k <= 4; k++) { const px = x + (X - x) * k / 4, py = y + (Y - y) * k / 4; if (!ZO.pasable(z, px, py) || otros.some((o: any) => Math.hypot(o.x - px, o.y - py) < o.radio + m.radio - 0.05)) return false; } return true; };
  return (x: number, y: number) => { const fx = (x - ox) / G, fy = (y - oy) / G, gx = Math.floor(fx), gy = Math.floor(fy); if (gx < 0 || gy < 0 || gx >= NG - 1 || gy >= NG - 1) return NaN; let best = Infinity;
    for (let dy = 0; dy <= 1; dy++) for (let dx = 0; dx <= 1; dx++) { const X = gx + dx, Y = gy + dy, v = D[Y * NG + X] + Math.hypot(X - fx, Y - fy) * G; if (v < best && tramo(x, y, ox + X * G, oy + Y * G)) best = v; }
    return best; };
}
// (el que va por la vuelta larga de los muros hacia un hueco lejano, `porLejos`: cuánto le falta por el camino de los muros)
const hastaMuros = (x: number, y: number, meta: number[]) => { const c = ZO.buscarCamino(zz, x, y, meta[0], meta[1], 40000, true); if (!c) return NaN; let l = 0, px = x, py = y; for (const [a, b] of c) { l += Math.hypot(a - px, b - py); px = a; py = b; } return l + Math.hypot(meta[0] - px, meta[1] - py); };
const fmt = (v: number) => (v === Infinity ? 'inf' : Number.isNaN(v) ? 'fuera' : v.toFixed(1));
let li = -1;
for (const zid of ZONAS) for (let s = 0; s < SEM; s++) {
  if (SOLO_S !== null && s !== SOLO_S) continue;
  const hz = fnv(`${BASE}|${zid}|${s}`); azar = mulberry(hz);
  const d = HE.nuevoHeroe('arcanista', 'Sim'); d.id = 'atasco' + s; d.nivel = 30;
  const j = MU.crearJuego(d, 0); MU.olvidarZonas(); MU.entrarZona(j, zid, 'arriba');
  j.t = 1000 + (hz % 4000) * 10; // (un reloj propio por zona: los topes de caminos por cuadro van por `j.t` y no se mezclan con los de la zona de antes)
  MU.actualizar(j, DT); // (que nazca Thor antes de fijarle el id: su lado sale del id, y el contador de ids es de toda la corrida)
  { let k = 0; for (const o of j.monstruos) { o.id = 800000 + k++; delete (o as any).lado; } }
  const z = j.zona, W = z.W, h = j.heroe; zz = z; hh = h;
  let sem = 12345 + s; const rnd = () => (sem = (sem * 1103515245 + 12345) % 2147483648) / 2147483648;
  const piso = (x: number, y: number) => z.bloq[y * W + x] === 0, pts: [number, number][] = [];
  for (let k = 0; k < 4000 && pts.length < 6; k++) {
    const x = 3 + Math.floor(rnd() * (W - 6)), y = 3 + Math.floor(rnd() * (z.H - 6));
    if (!piso(x, y) || !piso(x + 1, y) || !piso(x, y + 1)) continue;
    let muro = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (z.bloq[(y + dy) * W + x + dx] === 1) muro++;
    if (muro < 4 || pts.some(([a, c]) => Math.hypot(a - x, c - y) < 15)) continue;
    pts.push([x, y]);
  }
  for (let pi = 0; pi < pts.length; pi++) {
    const [x, y] = pts[pi]; li++;
    h.x = x + 0.5; h.y = y + 0.5; h.camino = null; h.destino = null; h.objetivo = null; h.vida = h.vidaMax = 1e7; h.acc = 'quieto'; h.muerto = false; (h as any).huecosCorro = []; (h as any).frente = null;
    for (let i = j.monstruos.length - 1; i >= 0; i--) { const o = j.monstruos[i]; if (!o.dueno) j.monstruos.splice(i, 1); else { o.x = h.x + 60; o.y = h.y + 60; o.vel = 0; } }
    const ids = ['zombi', 'esqueleto', 'necrofago', 'zombi'], puestos: any[] = [];
    for (let k = 0; k < 400 && puestos.length < 6; k++) {
      const a = rnd() * Math.PI * 2, dd = 6 + rnd() * 10, mx = Math.floor(x + Math.cos(a) * dd), my = Math.floor(y + Math.sin(a) * dd);
      if (mx < 1 || my < 1 || mx >= W - 1 || my >= z.H - 1 || z.bloq[my * W + mx] !== 0) continue;
      const m = MU.crearMonstruo(MO.MONSTRUOS[ids[k % ids.length]], 10, mx + 0.5, my + 0.5, 0, 0);
      m.id = 900000 + pi * 10 + puestos.length; // (ids fijos: el punto del corro y el frente salen del id)
      m.vida = m.vidaMax = 1e7; m.estado = 'perseguir'; m.objetivo = h; m.cd = 999; m.alerta = 0; m.x0 = m.x; m.y0 = m.y; m.traza = []; m.prog = []; j.monstruos.push(m); puestos.push(m);
    }
    campoFijo(j, h); const t0 = j.t; let campos: any[] | null = null, tc = -1;
    for (let t = 0; t < 9; t += DT) { if (process.env.TRAZA && t > 8.6) for (const m of puestos) if (Math.abs(m.x0 - +process.env.TRAZA.split(',')[0]) < 0.1 && Math.abs(m.y0 - +process.env.TRAZA.split(',')[1]) < 0.1) console.log(t.toFixed(2), m.x.toFixed(2), m.y.toFixed(2), m.acc, 'cd', m.cd.toFixed(1), 'tCam', m.tCam?.toFixed(2), 'trab', m.trabado, 'cam', JSON.stringify(m.camino), 'pens', m.pensar.toFixed(2), 'cola', m.cola, 'hueco', JSON.stringify(m.hueco), 'rodeo', JSON.stringify(m.rodeo), 'espera', m.espera); if (Math.abs(t - 6) < DT / 2) for (const m of puestos) { m.d6 = largo(m); m.r6 = rodeoLargo(j, m); } if (t > 6) for (const m of puestos) { const hq = m.hueco ? m.hueco.join() : ''; if (m.huecoVisto !== undefined && hq && hq !== m.huecoVisto) { m.rCambio = rodeoLargo(j, m); m.tCambio = t; } m.huecoVisto = hq; } if (Math.abs(t - 7.5) < DT / 2) for (const m of puestos) { m.d75 = largo(m); m.r75 = rodeoLargo(j, m); }
      // (entrega 9) cada medio segundo: el campo con los cuerpos de ahora, para cada uno; al medio segundo siguiente se mira cuánto lo
      //  acercó lo que caminó, con el mismo campo. El que va hacia el hueco que tomó (otro que el más cercano, la búsqueda del juego
      //  cuenta pasos y no largo) avanza si se acerca a ese sitio por el mismo campo: se toma lo que más se acercó de las dos
      const paso = Math.round(t / DT) % 15 === 0;
      if (paso) { if (campos) for (let k = 0; k < puestos.length; k++) { const m = puestos[k], c = campos[k]; if (!c) continue; const a = c.f(c.x, c.y), b0 = c.f(m.x, m.y), a2 = c.f2 ? c.f2(c.x, c.y) : c.lj ? c.lj[2] : NaN, b2 = c.f2 ? c.f2(m.x, m.y) : c.lj ? hastaMuros(m.x, m.y, c.lj) : NaN, b = Number.isFinite(a) && Number.isFinite(a2) && Number.isFinite(b2) && a2 - b2 > a - b0 ? a - (a2 - b2) : b0; m.prog.push({ t: tc, a, b, a2, b2, mov: Math.hypot(m.x - c.x, m.y - c.y), pega: Math.hypot(m.x - h.x, m.y - h.y) <= m.radio + h.radio + 0.8, lleno: !Number.isFinite(a), ocupado: j.monstruos.some((o: any) => o !== m && !o.muerto && o.objetivo === h && Math.hypot(o.x - h.x, o.y - h.y) <= o.radio + h.radio + 1.0), actua: !!m.actInt, otro: !!m.otroInt, objH: m.objetivo === h }); m.actInt = false; m.otroInt = false; }
        campos = puestos.map((m) => (Math.hypot(m.x - h.x, m.y - h.y) < 10.5 ? { f: campo(j, m, h), f2: m.hueco ? campo(j, m, h, m.hueco) : null, lj: m.porLejos && m.huecoLejos ? [m.huecoLejos[0], m.huecoLejos[1], hastaMuros(m.x, m.y, m.huecoLejos)] : null, x: m.x, y: m.y } : null)); tc = t; }
      h.vida = h.vidaMax; MU.actualizar(j, DT);
      // (entrega 8) cuánto espera su turno parado cada uno (la racha más larga) y si espera con el corro vacío (nadie pegándole al
      //  héroe de los que van por él: eso sería un atasco disfrazado de espera; el que va por Thor espera el corro de Thor)
      for (const m of puestos) { const q: any = m, ob = m.objetivo; if (ob === h && q.esperoT !== undefined && Math.abs(q.esperoT - j.t) < DT * 1.5 && Math.hypot(m.x - h.x, m.y - h.y) > m.radio + h.radio + 1.2) { q.tEsp = (q.tEsp ?? 0) + DT; tot.esperaMax = Math.max(tot.esperaMax ?? 0, +q.tEsp.toFixed(2)); if (!j.monstruos.some((o: any) => o !== m && !o.muerto && o.objetivo === h && Math.hypot(o.x - h.x, o.y - h.y) <= o.radio + h.radio + 1.0)) tot.vacio = (tot.vacio ?? 0) + 1; } else q.tEsp = 0; }
      for (const m of puestos) { if (m.man || m.acc === 'atacar' || m.acc === 'lanzar') m.actInt = true; if (m.objetivo !== h) m.otroInt = true; } // (en la prueba nadie pega, cd 999: lo que hace es una maniobra, que es pelear; y el que se fue un rato tras Thor no cuenta)
      for (const m of puestos) { const q: any = m; m.traza.push(`${(j.t - t0).toFixed(3)} ${m.x.toFixed(3)},${m.y.toFixed(3)} ${m.acc} d${Math.hypot(m.x - h.x, m.y - h.y).toFixed(2)} tr${q.trabado ?? 0} c${q.cola ?? 0} rod${q.rodeando ? 1 : 0} e${q.esperaH ? 1 : 0} tEspH${(q.tEspH ?? 0).toFixed(2)} h${q.hueco ? q.hueco.map((v: number) => v.toFixed(1)).join(',') : '-'} rC${q.rodeoC ? q.rodeoC.length : '-'} cam${m.camino ? m.camino.length : '-'} tCam${(q.tCam ?? 0).toFixed(2)} tR${(q.tRodeo ?? 0).toFixed(2)} corro${q.corro ? 1 : 0} est${m.estado} obj${m.objetivo === h ? 'h' : m.objetivo ? m.objetivo.tipo : '-'} man${m.man ? 1 : 0} at${(m.aturdido ?? 0).toFixed(1)} pres${(m as any).preso ?? ''}${(m as any).enlazado ? ' lazo' : ''}`); }
    }
    if (campos) for (let k = 0; k < puestos.length; k++) { const m = puestos[k], c = campos[k]; if (!c) continue; const a = c.f(c.x, c.y), b0 = c.f(m.x, m.y), a2 = c.f2 ? c.f2(c.x, c.y) : c.lj ? c.lj[2] : NaN, b2 = c.f2 ? c.f2(m.x, m.y) : c.lj ? hastaMuros(m.x, m.y, c.lj) : NaN, b = Number.isFinite(a) && Number.isFinite(a2) && Number.isFinite(b2) && a2 - b2 > a - b0 ? a - (a2 - b2) : b0; m.prog.push({ t: tc, a, b, a2, b2, mov: Math.hypot(m.x - c.x, m.y - c.y), pega: Math.hypot(m.x - h.x, m.y - h.y) <= m.radio + h.radio + 0.8, lleno: !Number.isFinite(a), ocupado: j.monstruos.some((o: any) => o !== m && !o.muerto && o.objetivo === h && Math.hypot(o.x - h.x, o.y - h.y) <= o.radio + h.radio + 1.0), actua: !!m.actInt, otro: !!m.otroInt, objH: m.objetivo === h }); m.actInt = false; m.otroInt = false; }
    tot.lugares++; if (process.env.FIRMA) console.log('FIRMA', zid, s, pi, fnv(puestos.map((m) => m.traza.join('|')).join('#')));
    const volcar = (m: any, que: string) => { mkdirSync(DIR, { recursive: true }); const f = `${DIR}/${que}_${zid}_s${s}_l${pi}_${m.id - 900000 - pi * 10}.txt`;
      writeFileSync(f, [`# ${que} ${zid} s${s} lugar ${pi} héroe ${h.x},${h.y} ${m.def.id} de ${m.x0},${m.y0}`, `# repetir: SEMILLA=${BASE} S=${s} npx tsx juego/herramientas/t1011_atascos_sim.mts ${zid} ${SEM}`,
        `# progreso por el campo cada 0,5 s (t: desde -> hasta, movido, pega, lleno, ocupado):`, ...m.prog.map((p: any) => `#  ${p.t.toFixed(1)}: ${fmt(p.a)} -> ${fmt(p.b)}${Number.isNaN(p.a2) ? '' : ` (a su hueco ${fmt(p.a2)} -> ${fmt(p.b2)})`} mov ${p.mov.toFixed(2)} ${p.pega ? 'pega' : ''} ${p.actua ? 'maniobra' : ''} ${p.lleno ? 'lleno' : ''} ${p.ocupado ? 'ocupado' : ''}`),
        `# los otros (al final): ${puestos.filter((o) => o !== m).map((o) => `${o.def.id} ${o.x.toFixed(2)},${o.y.toFixed(2)} d${Math.hypot(o.x - h.x, o.y - h.y).toFixed(2)}`).join(' | ')}`,
        ...m.traza, '# los otros, cuadro a cuadro:', ...puestos.filter((o) => o !== m).flatMap((o) => [`## ${o.def.id} ${o.id}`, ...o.traza])].join('\n'));
      return f; };
    for (const m of puestos) {
      const dd = Math.hypot(m.x - h.x, m.y - h.y), alcance = m.radio + h.radio + 1.2;
      const cam = ZO.buscarCamino(z, m.x, m.y, h.x, h.y, 40000, true), llega = cam && Math.hypot(cam[cam.length - 1][0] - h.x, cam[cam.length - 1][1] - h.y) < 1.5;
      // (entrega 9) la espera parada con el aro libre alcanzable: rachas de vistazos de medio segundo quieto (menos de 0,15) con el
      //  campo finito desde donde estaba, sin pegar
      if (llega && m.objetivo === h) { let r = 0, l = 0; const cierra = () => { if (r > 0) espH.push({ t: r, l, zid, s, li: pi, id: m.def.id }); if (r > 2.5 && !m.volcadoEsp) { m.volcadoEsp = 1; volcar(m, 'espera'); } r = 0; l = 0; };
        for (const p of m.prog) { if (!p.pega && !p.actua && !p.lleno && p.objH !== false && p.mov < 0.15) { r += 0.5; l = Math.max(l, p.a); } else cierra(); } cierra(); }
      if (!llega || m.objetivo !== h) continue;
      tot.perseguian++;
      // (entrega 9) la cuenta objetiva de los últimos 3 s
      { obj.perseguian++; const ult = m.prog.filter((p: any) => p.t >= 5.99), progC = ult.reduce((s2: number, p: any) => s2 + (Number.isFinite(p.a) && Number.isFinite(p.b) ? p.a - p.b : 0), 0);
        const pegaAlgo = ult.some((p: any) => p.pega), lleno = ult.length > 0 && ult.filter((p: any) => p.lleno).length >= 0.8 * ult.length && ult.filter((p: any) => p.ocupado).length >= 0.8 * ult.length;
        const muros = m.d6 - largo(m);
        // (el que solo tiene el aro libre muy lejos de camino, más de 20 casillas, y en vez de esa vuelta ronda por el aro de espera
        //  moviéndose: no está clavado, `rondan`; el que no se mueve con ese hueco lejano sí cuenta como atascado)
        const lejano = ult.length > 0 && ult.filter((p: any) => p.lleno || p.a > 20).length >= 0.8 * ult.length && ult.filter((p: any) => p.ocupado).length >= 0.8 * ult.length, movido = ult.reduce((s2: number, p: any) => s2 + p.mov, 0);
        // (el resto: `esperan` si lo más largo que estuvo sin acercarse con un hueco alcanzable fue menos de 2,5 s (el turno tras perder
        //  su hueco, que lo tomó otro) y no anduvo de acá para allá; `vaiven` si caminó 3 casillas o más sin acercarse con el hueco ahí,
        //  y `atascados` si pasó 2,5 s o más sin acercarse teniendo adónde ir)
        let tramo = 0, tramoMax = 0; for (const p of ult) { if (!p.lleno && !p.pega && !p.actua && !(p.a - p.b >= 0.1)) { tramo += 0.5; tramoMax = Math.max(tramoMax, tramo); } else tramo = 0; }
        const huecoAhi = ult.filter((p: any) => !p.lleno).length >= 0.5 * ult.length;
        let que: string;
        if (ult.some((p: any) => p.otro)) que = 'otroObjetivo'; else if (dd <= m.radio + h.radio + 0.8 || pegaAlgo) que = 'llegaron'; else if (progC >= 0.6 || muros >= 0.6) que = 'avanzan'; else if (ult.some((p: any) => p.actua)) que = 'actuan'; else if (lleno) que = 'corroLleno'; else if (lejano && movido >= 0.6) que = 'rondan';
        else if (movido >= 3 && progC < 0.3 && huecoAhi) que = 'vaiven'; else if (tramoMax < 2.5) que = 'esperan'; else que = 'atascados';
        obj[que]++; m.objetiva = que;
        if (que === 'atascados' || que === 'vaiven') { const f = volcar(m, 'objetiva'); console.log('OBJETIVA ' + que, zid, 's' + s, 'lugar', pi, m.def.id, 'dist', dd.toFixed(1), 'progreso', progC.toFixed(2), 'muros', muros.toFixed(2), f); }
      }
      // (cerca y con otro cuerpo pegado: hace cola detrás de los que ya llegaron, no está atascado)
      const cola = dd < 4.5 && puestos.some((o) => o !== m && Math.hypot(o.x - m.x, o.y - m.y) < 1.3);
      // (entrega 6: con el corro lleno de verdad, sin paso entre los muros y los cuerpos hasta un hueco libre alrededor del héroe,
      //  esperar quieto es lo justo: se cuenta aparte, no como atascado)
      const turno = dd > alcance + 0.6 && !cola && m.d6 - largo(m) < 0.6 && !process.env.SIN_TURNO && !(MU.rodeoAceptable && !process.env.TURNO_E6 ? MU.rodeoAceptable(j, m, h) : MU.rodeoCuerpos(j, m, h));
      if (turno) { tot.esperan = (tot.esperan ?? 0) + 1; continue; }
      // (entrega 7: si a los 6 s no tenía hueco aceptable estaba esperando su turno; si el hueco se abrió después, se le pide que
      //  avance desde los 7,5 s la mitad, 0,3 (también al que cambió de rodeo a mitad); si recién se abrió en el último segundo y
      //  medio, sigue contando como que espera; entrega 8: el que cambió de hueco después de los 6 s, porque el suyo lo tomó otro, tiene
      //  que haber acortado el rodeo nuevo desde que lo tomó)
      const r9 = rodeoLargo(j, m), rodea = !process.env.SIN_RODEO && ((m.r6 != null && r9 != null && m.r6 - r9 >= 0.6) || (m.rCambio != null && r9 != null && m.rCambio - r9 >= Math.min(0.6, 0.4 * (9 - m.tCambio))) || (m.r75 != null && ((r9 != null && m.r75 - r9 >= 0.3) || m.d75 - largo(m) >= 0.3)));
      if (!process.env.SIN_TURNO && !process.env.SIN_RODEO && m.r6 == null && m.r75 == null && !rodea && dd > alcance + 0.6 && !cola && m.d6 - largo(m) < 0.6) { tot.esperan = (tot.esperan ?? 0) + 1; continue; }
      if (rodea) tot.rodean = (tot.rodean ?? 0) + 1;
      // (entrega 7: el que al final está pegando o en plena maniobra, con su aviso, está peleando: no se cuenta)
      const actua = !process.env.SIN_ACTUA && (m.man || m.acc === 'atacar' || m.acc === 'lanzar');
      if (dd > alcance + 0.6 && !cola && !rodea && actua && m.d6 - largo(m) < 0.6) { tot.actuan = (tot.actuan ?? 0) + 1; continue; }
      // (entrega 9: la cuenta de la entrega 8 se confunde con el que perdió su hueco y salió a rodear tarde, o con el que dio la vuelta por
      //  otro lado: cuenta en `atascadosE8`, y `atascados` es solo el que además la cuenta objetiva da por atascado o de acá para allá)
      if (dd > alcance + 0.6 && !cola && !rodea && m.d6 - largo(m) < 0.6) { tot.atascadosE8 = (tot.atascadosE8 ?? 0) + 1; if (m.objetiva !== 'atascados' && m.objetiva !== 'vaiven') { const f = volcar(m, 'e8'); console.log('E8', zid, 's' + s, 'lugar', pi, m.def.id, 'objetiva', m.objetiva, f); } }
      if (dd > alcance + 0.6 && !cola && !rodea && m.d6 - largo(m) < 0.6 && (process.env.CRIBA_E8 || m.objetiva === 'atascados' || m.objetiva === 'vaiven')) { tot.atascados++; const f = volcar(m, 'atascado'); console.log('ATASCADO', zid, 's' + s, 'lugar', pi, m.def.id, 'objetiva', m.objetiva, 'repetir: SEMILLA=' + BASE, 'S=' + s, zid, f); if (process.env.DETALLE) console.log(zid, s, 'héroe', x, y, 'monstruo', m.def.id, m.x.toFixed(2), m.y.toFixed(2), 'de', m.x0, m.y0, 'dist', dd.toFixed(1), m.acc, 'trabado', m.trabado, 'camino', JSON.stringify(m.camino?.slice(0, 3)), 'estado', m.estado, 'cola', m.cola, 'hueco', JSON.stringify(m.hueco), 'dAcerca', m.dAcerca?.toFixed(2), 'obj', m.objetivo === h, m.objetivo?.tipo, m.objetivo?.def?.id, m.objetivo?.invocaId, 'thor', j.monstruos.filter((o: any) => o.dueno).length, 'pegados al héroe', puestos.filter((o) => o !== m && Math.hypot(o.x - h.x, o.y - h.y) < o.radio + h.radio + 1.2).length, 'otro más cerca', Math.min(...puestos.filter((o) => o !== m).map((o) => Math.hypot(o.x - m.x, o.y - m.y))).toFixed(2), 'pos', JSON.stringify(puestos.map((o) => [+o.x.toFixed(1), +o.y.toFixed(1)]))); }
    }
  }
}
console.log(JSON.stringify(tot));
console.log('objetiva', JSON.stringify(obj));
espH.sort((a, b) => b.t - a.t);
const corto = espH.filter((e) => e.l <= 20), largoE = espH.filter((e) => e.l > 20);
console.log('esperaHueco', JSON.stringify({ n: espH.length, max: espH[0]?.t ?? 0, maxCorto: corto[0]?.t ?? 0, maxLargo: largoE[0]?.t ?? 0, masDe2_5: espH.filter((e) => e.t > 2.5).length, peores: espH.slice(0, 6).map((e) => `${e.t}s l${e.l.toFixed(1)} ${e.zid} s${e.s} l${e.li} ${e.id}`) }));
await sv.close(); process.exit(0);
