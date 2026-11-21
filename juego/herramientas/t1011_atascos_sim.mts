// Atascos sin navegador: lo mismo que t995_atascos.cjs pero con el juego cargado en Node (rápido, muchas zonas y semillas).
// En cada zona pone al héroe quieto en puntos con muro cerca, despierta 6 cuerpos a 6 a 16 casillas (también detrás de muros)
// y corre 9 s. Atascado: tiene camino de verdad al héroe, no está a tiro y en los últimos 3 s se acercó menos de 0,6.
//   npx tsx juego/herramientas/t1011_atascos_sim.mts [zonas] [semillas]   (DETALLE=1 imprime cada atascado)
// (entrega 7) No cuenta al que acorta su rodeo entre los cuerpos (`rodean`), al que no tiene rodeo aceptable (`esperan`) ni al que está
// pegando o en maniobra (`actuan`); SIN_RODEO=1, SIN_TURNO=1 y SIN_ACTUA=1 los vuelven a contar.
// (entrega 8) `esperaMax`: la espera parada más larga de uno que espera su turno (segundos); `vacio`: cuadros esperando con nadie
// pegándole al héroe (tiene que dar 0: sin corro no hay turno).
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
(globalThis as any).__frenteViejo = true; (globalThis as any).__thorLejos = true;
for (const b of (process.env.BANDERAS || '').split(',').filter(Boolean)) (globalThis as any)[b] = true;
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const HE = await sv.ssrLoadModule('/src/juego/heroe.ts'), MU = await sv.ssrLoadModule('/src/juego/mundo.ts'), ZO = await sv.ssrLoadModule('/src/mundo/zona.ts'), MO = await sv.ssrLoadModule('/src/datos/monstruos.ts'), AC = await sv.ssrLoadModule('/src/mundo/actos.ts');
const ZONAS = (process.argv[2] && process.argv[2] !== 'todas' ? process.argv[2].split(',') : Object.values<any>(AC.ZONAS).filter((z) => z.tipo === 'mazmorra' && !z.casa && AC.POBL_ZONA[z.id]).map((z) => z.id));
const SEM = +(process.argv[3] || 2), DT = 1 / 30;
const tot: any = { lugares: 0, perseguian: 0, atascados: 0 };
// lo que le falta caminar hasta el héroe (por el camino de verdad: rodear un muro aleja en línea recta y no es atascarse)
let zz: any, hh: any;
// (entrega 7) lo que le falta por el rodeo entre los cuerpos (con las reservas de los demás): el que da la vuelta al corro por el
// lado libre se aleja en línea recta y por el camino de la grilla (que no ve los cuerpos), pero se acerca por este
const rodeoLargo = (j: any, m: any) => { const r = MU.rodeoAceptable ? MU.rodeoAceptable(j, m, hh) : null; if (!r) return null; let l = 0, x = m.x, y = m.y; for (const [a, b] of r.camino) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l; };
const largo = (m: any) => { const c = ZO.buscarCamino(zz, m.x, m.y, hh.x, hh.y, 40000, true); if (!c) return 1e9; let l = 0, x = m.x, y = m.y; for (const [a, b] of c) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l + Math.hypot(hh.x - x, hh.y - y) * 3; };
for (const zid of ZONAS) for (let s = 0; s < SEM; s++) {
  const d = HE.nuevoHeroe('arcanista', 'Sim'); d.id = 'atasco' + s; d.nivel = 30;
  const j = MU.crearJuego(d, 0); MU.olvidarZonas(); MU.entrarZona(j, zid, 'arriba');
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
  for (const [x, y] of pts) {
    h.x = x + 0.5; h.y = y + 0.5; h.camino = null; h.destino = null; h.objetivo = null; h.vida = h.vidaMax = 1e7; h.acc = 'quieto'; h.muerto = false;
    for (let i = j.monstruos.length - 1; i >= 0; i--) { const o = j.monstruos[i]; if (!o.dueno) j.monstruos.splice(i, 1); else { o.x = h.x + 60; o.y = h.y + 60; o.vel = 0; } }
    const ids = ['zombi', 'esqueleto', 'necrofago', 'zombi'], puestos: any[] = [];
    for (let k = 0; k < 400 && puestos.length < 6; k++) {
      const a = rnd() * Math.PI * 2, dd = 6 + rnd() * 10, mx = Math.floor(x + Math.cos(a) * dd), my = Math.floor(y + Math.sin(a) * dd);
      if (mx < 1 || my < 1 || mx >= W - 1 || my >= z.H - 1 || z.bloq[my * W + mx] !== 0) continue;
      const m = MU.crearMonstruo(MO.MONSTRUOS[ids[k % ids.length]], 10, mx + 0.5, my + 0.5, 0, 0);
      m.vida = m.vidaMax = 1e7; m.estado = 'perseguir'; m.objetivo = h; m.cd = 999; m.alerta = 0; m.x0 = m.x; m.y0 = m.y; j.monstruos.push(m); puestos.push(m);
    }
    for (let t = 0; t < 9; t += DT) { if (process.env.TRAZA && t > 8.6) for (const m of puestos) if (Math.abs(m.x0 - +process.env.TRAZA.split(',')[0]) < 0.1 && Math.abs(m.y0 - +process.env.TRAZA.split(',')[1]) < 0.1) console.log(t.toFixed(2), m.x.toFixed(2), m.y.toFixed(2), m.acc, 'cd', m.cd.toFixed(1), 'tCam', m.tCam?.toFixed(2), 'trab', m.trabado, 'cam', JSON.stringify(m.camino), 'pens', m.pensar.toFixed(2), 'cola', m.cola, 'hueco', JSON.stringify(m.hueco), 'rodeo', JSON.stringify(m.rodeo), 'espera', m.espera, 'bc', JSON.stringify(ZO.buscarCamino(z, m.x, m.y, h.x, h.y, 5000)), 'pas', ZO.pasable(z, m.x, m.y), ZO.pasable(z, Math.floor(m.x), Math.floor(m.y)), 'h', h.x, h.y, 'bloq vecinos', [-1, 0, 1].map((dy) => [-2, -1, 0, 1, 2, 3].map((dx) => z.bloq[(Math.floor(m.y) + dy) * W + Math.floor(m.x) + dx]).join('')).join('/')); if (Math.abs(t - 6) < DT / 2) for (const m of puestos) { m.d6 = largo(m); m.r6 = rodeoLargo(j, m); } if (t > 6) for (const m of puestos) { const hq = m.hueco ? m.hueco.join() : ''; if (m.huecoVisto !== undefined && hq && hq !== m.huecoVisto) { m.rCambio = rodeoLargo(j, m); m.tCambio = t; } m.huecoVisto = hq; } if (Math.abs(t - 7.5) < DT / 2) for (const m of puestos) { m.d75 = largo(m); m.r75 = rodeoLargo(j, m); } h.vida = h.vidaMax; MU.actualizar(j, DT);
      // (entrega 8) cuánto espera su turno parado cada uno (la racha más larga) y si espera con el corro vacío (nadie pegándole al
      //  héroe de los que van por él: eso sería un atasco disfrazado de espera; el que va por Thor espera el corro de Thor)
      for (const m of puestos) { const q: any = m, ob = m.objetivo; if (ob === h && q.esperoT !== undefined && Math.abs(q.esperoT - j.t) < DT * 1.5 && Math.hypot(m.x - h.x, m.y - h.y) > m.radio + h.radio + 1.2) { q.tEsp = (q.tEsp ?? 0) + DT; tot.esperaMax = Math.max(tot.esperaMax ?? 0, +q.tEsp.toFixed(2)); if (!j.monstruos.some((o: any) => o !== m && !o.muerto && o.objetivo === h && Math.hypot(o.x - h.x, o.y - h.y) <= o.radio + h.radio + 1.0)) tot.vacio = (tot.vacio ?? 0) + 1; } else q.tEsp = 0; } }
    tot.lugares++;
    for (const m of puestos) {
      const dd = Math.hypot(m.x - h.x, m.y - h.y), alcance = m.radio + h.radio + 1.2;
      const cam = ZO.buscarCamino(z, m.x, m.y, h.x, h.y, 40000, true), llega = cam && Math.hypot(cam[cam.length - 1][0] - h.x, cam[cam.length - 1][1] - h.y) < 1.5;
      if (!llega || m.objetivo !== h) continue;
      tot.perseguian++;
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
      if (dd > alcance + 0.6 && !cola && !rodea && m.d6 - largo(m) < 0.6) { tot.atascados++; if (process.env.DETALLE) console.log(zid, s, 'héroe', x, y, 'monstruo', m.def.id, m.x.toFixed(2), m.y.toFixed(2), 'de', m.x0, m.y0, 'dist', dd.toFixed(1), m.acc, 'trabado', m.trabado, 'camino', JSON.stringify(m.camino?.slice(0, 3)), 'estado', m.estado, 'cola', m.cola, 'hueco', JSON.stringify(m.hueco), 'dAcerca', m.dAcerca?.toFixed(2), 'obj', m.objetivo === h, m.objetivo?.tipo, m.objetivo?.def?.id, m.objetivo?.invocaId, 'thor', j.monstruos.filter((o: any) => o.dueno).length, 'pegados al héroe', puestos.filter((o) => o !== m && Math.hypot(o.x - h.x, o.y - h.y) < o.radio + h.radio + 1.2).length, 'otro más cerca', Math.min(...puestos.filter((o) => o !== m).map((o) => Math.hypot(o.x - m.x, o.y - m.y))).toFixed(2), 'pos', JSON.stringify(puestos.map((o) => [+o.x.toFixed(1), +o.y.toFixed(1)]))); }
    }
  }
}
console.log(JSON.stringify(tot));
await sv.close(); process.exit(0);
