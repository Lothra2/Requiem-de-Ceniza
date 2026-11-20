// Atascos sin navegador: lo mismo que t995_atascos.cjs pero con el juego cargado en Node (rápido, muchas zonas y semillas).
// En cada zona pone al héroe quieto en puntos con muro cerca, despierta 6 cuerpos a 6 a 16 casillas (también detrás de muros)
// y corre 9 s. Atascado: tiene camino de verdad al héroe, no está a tiro y en los últimos 3 s se acercó menos de 0,6.
//   npx tsx juego/herramientas/t1011_atascos_sim.mts [zonas] [semillas]   (DETALLE=1 imprime cada atascado)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
(globalThis as any).__frenteViejo = true; (globalThis as any).__thorLejos = true;
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const HE = await sv.ssrLoadModule('/src/juego/heroe.ts'), MU = await sv.ssrLoadModule('/src/juego/mundo.ts'), ZO = await sv.ssrLoadModule('/src/mundo/zona.ts'), MO = await sv.ssrLoadModule('/src/datos/monstruos.ts'), AC = await sv.ssrLoadModule('/src/mundo/actos.ts');
const ZONAS = (process.argv[2] && process.argv[2] !== 'todas' ? process.argv[2].split(',') : Object.values<any>(AC.ZONAS).filter((z) => z.tipo === 'mazmorra' && !z.casa && AC.POBL_ZONA[z.id]).map((z) => z.id));
const SEM = +(process.argv[3] || 2), DT = 1 / 30;
const tot = { lugares: 0, perseguian: 0, atascados: 0 };
// lo que le falta caminar hasta el héroe (por el camino de verdad: rodear un muro aleja en línea recta y no es atascarse)
let zz: any, hh: any;
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
    for (let t = 0; t < 9; t += DT) { if (process.env.TRAZA && t > 8.6) for (const m of puestos) if (Math.abs(m.x0 - +process.env.TRAZA.split(',')[0]) < 0.1 && Math.abs(m.y0 - +process.env.TRAZA.split(',')[1]) < 0.1) console.log(t.toFixed(2), m.x.toFixed(2), m.y.toFixed(2), m.acc, 'cd', m.cd.toFixed(1), 'tCam', m.tCam?.toFixed(2), 'trab', m.trabado, 'cam', JSON.stringify(m.camino), 'pens', m.pensar.toFixed(2), 'bc', JSON.stringify(ZO.buscarCamino(z, m.x, m.y, h.x, h.y, 5000)), 'pas', ZO.pasable(z, m.x, m.y), ZO.pasable(z, Math.floor(m.x), Math.floor(m.y)), 'h', h.x, h.y, 'bloq vecinos', [-1, 0, 1].map((dy) => [-2, -1, 0, 1, 2, 3].map((dx) => z.bloq[(Math.floor(m.y) + dy) * W + Math.floor(m.x) + dx]).join('')).join('/')); if (Math.abs(t - 6) < DT / 2) for (const m of puestos) m.d6 = largo(m); h.vida = h.vidaMax; MU.actualizar(j, DT); }
    tot.lugares++;
    for (const m of puestos) {
      const dd = Math.hypot(m.x - h.x, m.y - h.y), alcance = m.radio + h.radio + 1.2;
      const cam = ZO.buscarCamino(z, m.x, m.y, h.x, h.y, 40000, true), llega = cam && Math.hypot(cam[cam.length - 1][0] - h.x, cam[cam.length - 1][1] - h.y) < 1.5;
      if (!llega || m.objetivo !== h) continue;
      tot.perseguian++;
      // (cerca y con otro cuerpo pegado: hace cola detrás de los que ya llegaron, no está atascado)
      const cola = dd < 4.5 && puestos.some((o) => o !== m && Math.hypot(o.x - m.x, o.y - m.y) < 1.3);
      if (dd > alcance + 0.6 && !cola && m.d6 - largo(m) < 0.6) { tot.atascados++; if (process.env.DETALLE) console.log(zid, s, 'héroe', x, y, 'monstruo', m.def.id, m.x.toFixed(2), m.y.toFixed(2), 'de', m.x0, m.y0, 'dist', dd.toFixed(1), m.acc, 'trabado', m.trabado, 'camino', JSON.stringify(m.camino?.slice(0, 3)), 'estado', m.estado, 'obj', m.objetivo === h, m.objetivo?.tipo, m.objetivo?.def?.id, m.objetivo?.invocaId, 'thor', j.monstruos.filter((o: any) => o.dueno).length); }
    }
  }
}
console.log(JSON.stringify(tot));
await sv.close(); process.exit(0);
