// El reparto de los monstruos medido como se juega: un explorador entra por la puerta de verdad y recorre la zona yendo siempre a
// lo más cercano que no vio (lo visto: lo que queda a 12 casillas de camino de donde pasó), y anota cuándo aparece cada grupo
// (a 14 casillas y a la vista). Mide cuánto camina entre un encuentro y el siguiente, los tramos de 20 casillas (una pantalla) sin
// nada nuevo, cuerpos y grupos por pantalla, el tamaño de los grupos y lo que hay a la vista de la puerta al llegar.
// Sin navegador (el juego cargado en Node como t1011). Guarda cada zona (bloq y monstruos) para las láminas de t1042_reparto_lamina.py.
//   npx tsx juego/herramientas/t1040_reparto.mts <etiqueta> [zonas|todas] [semillas]   (BANDERAS=__campamentos el antes, NIVEL=1)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { mkdirSync, writeFileSync } from 'node:fs';
const mulberry = (seed: number) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
let azar = mulberry(+(process.env.SEMILLA || 4040)); Math.random = () => azar();
const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
for (const b of (process.env.BANDERAS || '').split(',').filter(Boolean)) (globalThis as any)[b] = true;
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const HE = await sv.ssrLoadModule('/src/juego/heroe.ts'), MU = await sv.ssrLoadModule('/src/juego/mundo.ts'), ZO = await sv.ssrLoadModule('/src/mundo/zona.ts'), AC = await sv.ssrLoadModule('/src/mundo/actos.ts');
const etiqueta = process.argv[2] || 'ahora';
const todas = Object.values<any>(AC.ZONAS).filter((d) => d.tipo !== 'pueblo').map((d) => d.id);
const ZONAS = !process.argv[3] || process.argv[3] === 'todas' ? todas : process.argv[3].split(',');
const SEM = +(process.argv[4] || 2), NIVEL = +(process.env.NIVEL || 30);
const DIR = `${process.env.DIR || '/tmp/requiem-pruebas/enemigos'}/${etiqueta}`; mkdirSync(DIR, { recursive: true });
const PANT = 20, VISTA = 14, VISTO = 12, AREA = 900; // (AREA: celdas caminables que se descubren en una pantalla, a 720 se ven unas 900 a 1500)
const tot = { zonas: 0, cuerpos: 0, grupos: 0, camino: 0, pant: 0, pantVacias: 0, gaps: [] as number[], tam: [] as number[], aLaVista: 0, primero: [] as number[], primeroTam: [] as number[], area: 0, areaVacias: 0, gapsA: [] as number[] };
const porTipo: Record<string, typeof tot> = {};
for (const zid of ZONAS) for (let s = 0; s < SEM; s++) {
  azar = mulberry(1000 + s * 7919 + zid.length * 31);
  const d = HE.nuevoHeroe('arcanista', 'Sim'); d.id = 'reparto' + s; d.nivel = NIVEL;
  const j = MU.crearJuego(d, 0); MU.olvidarZonas(); MU.entrarZona(j, zid, 'arriba');
  const z = j.zona, W = z.W, H = z.H, h = j.heroe;
  const ms = j.monstruos.filter((m: any) => !m.dueno && !m.muerto);
  if (!ms.length) continue;
  const libre = (i: number) => z.bloq[i] === 0 || z.bloq[i] === 3;
  // los grupos: por `camp` (con campamentos, el campamento entero; el jefe aparte)
  const gid = (m: any) => (m.def.jefe || m.calidad >= 3 ? 'jefe' : String(m.camp ?? 'x' + m.id));
  const grupos = new Map<string, any[]>(); for (const m of ms) { const k = gid(m); if (!grupos.has(k)) grupos.set(k, []); grupos.get(k)!.push(m); }
  // explorar
  const visto = new Uint8Array(W * H), visto2 = new Set<string>();
  let x = Math.floor(h.x), y = Math.floor(h.y), camino = 0, ultimo = 0, nv = 0, ultA = 0; const gaps: number[] = [], gapsA: number[] = [], eventos: [number, number][] = [], eventosA: [number, number][] = [];
  const ver = (cx: number, cy: number) => {
    const q = [cy * W + cx], dd = new Map<number, number>([[q[0], 0]]);
    for (let k = 0; k < q.length; k++) { const i = q[k], c = dd.get(i)!; if (!visto[i]) { visto[i] = 1; nv++; } if (c >= VISTO) continue; const px = i % W, py = (i - px) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = px + dx, Y = py + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const n = Y * W + X; if (!dd.has(n) && libre(n)) { dd.set(n, c + 1); q.push(n); } } }
    for (const [k, g] of grupos) { if (visto2.has(k)) continue; if (g.some((m: any) => Math.hypot(m.x - cx - 0.5, m.y - cy - 0.5) < VISTA && ZO.lineaLibre(z, cx + 0.5, cy + 0.5, m.x, m.y))) { visto2.add(k); if (k !== 'jefe') { eventos.push([camino, g.length]); gaps.push(camino - ultimo); ultimo = camino; eventosA.push([nv, g.length]); gapsA.push((nv - ultA) / AREA); ultA = nv; } } }
  };
  ver(x, y);
  const aLaVista = eventos.length; // lo que ya se ve desde la puerta
  for (let paso = 0; paso < 4000; paso++) {
    // lo no visto más cercano por camino
    const prev = new Int32Array(W * H).fill(-1), q = [y * W + x]; prev[q[0]] = q[0]; let meta = -1;
    for (let k = 0; k < q.length && meta < 0; k++) { const i = q[k], px = i % W, py = (i - px) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = px + dx, Y = py + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const n = Y * W + X; if (prev[n] < 0 && libre(n)) { prev[n] = i; if (!visto[n]) { meta = n; break; } q.push(n); } } }
    if (meta < 0) break;
    const ruta: number[] = []; for (let i = meta; i !== y * W + x; i = prev[i]) ruta.push(i); ruta.reverse();
    for (let k = 0; k < ruta.length; k++) { const i = ruta[k]; x = i % W; y = (i - x) / W; camino++; if (k % 3 === 2 || k === ruta.length - 1) ver(x, y); }
  }
  gaps.push(camino - ultimo); gapsA.push((nv - ultA) / AREA);
  const nA = Math.max(1, Math.ceil(nv / AREA)), pa = new Array(nA).fill(0); for (const [c, n] of eventosA) pa[Math.min(nA - 1, Math.floor(c / AREA))] += n;
  // por pantalla de camino
  const nP = Math.max(1, Math.ceil(camino / PANT)); const pc = new Array(nP).fill(0); for (const [c, n] of eventos) pc[Math.min(nP - 1, Math.floor(c / PANT))] += n;
  const fila = (t: typeof tot) => { t.zonas++; t.cuerpos += ms.length; t.grupos += [...grupos.keys()].filter((k) => k !== 'jefe').length; t.camino += camino; t.pant += nP; t.pantVacias += pc.filter((v) => v === 0).length; t.gaps.push(...gaps.slice(1)); for (const [k, g] of grupos) if (k !== 'jefe') t.tam.push(g.length); t.aLaVista += aLaVista; t.area += nA; t.areaVacias += pa.filter((v) => v === 0).length; t.gapsA.push(...gapsA.slice(1)); const e = eventos.find((q) => q[0] > 0) ?? eventos[0]; if (e) { t.primero.push(e[0]); t.primeroTam.push(e[1]); } };
  fila(tot); fila((porTipo[z.tipo] ??= { zonas: 0, cuerpos: 0, grupos: 0, camino: 0, pant: 0, pantVacias: 0, gaps: [], tam: [], aLaVista: 0, primero: [], primeroTam: [], area: 0, areaVacias: 0, gapsA: [] }));
  if (s === 0) writeFileSync(`${DIR}/${zid}.json`, JSON.stringify({ W, H, tipo: z.tipo, bloq: Buffer.from(z.bloq).toString('base64'), heroe: [h.x, h.y], ms: ms.map((m: any) => [+m.x.toFixed(1), +m.y.toFixed(1), m.calidad, gid(m), m.def.ia, !!(m as any).ronda]), spawns: z.spawns.map((q: any) => [q.cx, q.cy, q.tipo]), camino, eventos }));
}
const q = (a: number[], p: number) => { const b = [...a].sort((x, y) => x - y); return b.length ? b[Math.min(b.length - 1, Math.floor(p * b.length))] : 0; };
const hist = (a: number[]) => { const h: Record<string, number> = { '1': 0, '2': 0, '3-4': 0, '5-6': 0, '7-9': 0, '10+': 0 }; for (const n of a) h[n === 1 ? '1' : n === 2 ? '2' : n <= 4 ? '3-4' : n <= 6 ? '5-6' : n <= 9 ? '7-9' : '10+']++; return Object.fromEntries(Object.entries(h).map(([k, v]) => [k, Math.round((v / Math.max(1, a.length)) * 100) + '%'])); };
const resumen = (t: typeof tot) => ({ zonas: t.zonas, pantallasDescubiertas: t.area, cuerposPorPantallaDescubierta: +(t.cuerpos / t.area).toFixed(2), descubiertasVacias: Math.round((t.areaVacias / t.area) * 100) + '%', entreEncuentrosPantallas: { mediana: +q(t.gapsA, 0.5).toFixed(2), p90: +q(t.gapsA, 0.9).toFixed(2), max: +q(t.gapsA, 1).toFixed(2) }, cuerpos: t.cuerpos, grupos: t.grupos, cuerposPorGrupo: +(t.cuerpos / Math.max(1, t.grupos)).toFixed(2), cuerposPorPantalla: +(t.cuerpos / t.pant).toFixed(2), gruposPorPantalla: +(t.grupos / t.pant).toFixed(2), pantallasVacias: Math.round((t.pantVacias / t.pant) * 100) + '%', entreEncuentros: { mediana: q(t.gaps, 0.5), p90: q(t.gaps, 0.9), max: q(t.gaps, 1) }, tamGrupos: hist(t.tam), aLaVistaDeLaPuerta: t.aLaVista, primerEncuentro: { camino: q(t.primero, 0.5), tamMediano: q(t.primeroTam, 0.5), tamMax: q(t.primeroTam, 1) } });
const out = { etiqueta, nivel: NIVEL, total: resumen(tot), ...Object.fromEntries(Object.entries(porTipo).map(([k, v]) => [k, resumen(v)])) };
writeFileSync(`${DIR}/resumen.json`, JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
await sv.close(); process.exit(0);
