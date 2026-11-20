// Desglose de los adornos por pantalla a cielo abierto (o SOLO=zonas): de qué paso (capa) y de qué pieza sale lo que se cuenta
// en t1000 como adorno, y qué pares se montan. node juego/herramientas/t1012_desglose.mjs [semilla]
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const s = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
const Z = await s.ssrLoadModule('/src/mundo/zona.ts'), A = await s.ssrLoadModule('/src/mundo/actos.ts');
const man = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8'));
const EST = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina/;
const solo = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null, sem = +(process.argv[2] || 12345);
const tipo = process.env.TIPO || 'exterior';
const capas = {}, ids = {}, pares = {}, tapaC = {}; let nz = 0, total = 0, mont = 0, pisoT = 0, tapaT = 0;
for (const d of Object.values(A.ZONAS)) {
  if (solo ? !solo.has(d.id) : d.tipo !== tipo || d.casa) continue;
  const z = Z.generarZona(d, sem); nz++;
  const props = [];
  for (const o of z.objetos) { const m = man.o[o.id + '|' + o.v]; if (!m || m.plano || EST.test(o.id)) continue; const f = m.f[0], sx = (o.cx - o.cy) * 16, sy = (o.cx + o.cy) * 8; props.push({ o, x0: sx - f[5], y0: sy - f[6], x1: sx - f[5] + f[3], y1: sy - f[6] + f[4], a: f[3] * f[4] }); }
  total += props.length;
  for (const p of props) { const c = p.o.capa || '(riego)'; capas[c] = (capas[c] || 0) + 1; const k = c + ':' + p.o.id; ids[k] = (ids[k] || 0) + 1; }
  props.sort((a, b) => a.x0 - b.x0); const m60 = new Uint8Array(props.length);
  for (let i = 0; i < props.length; i++) { const a = props[i]; for (let j = i + 1; j < props.length && props[j].x0 < a.x1; j++) { const b = props[j]; const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); if (ix <= 0 || iy <= 0) continue; if (ix * iy / Math.min(a.a, b.a) >= 0.6) { m60[i] = m60[j] = 1; const k = [a.o.capa || '(riego)', b.o.capa || '(riego)'].sort().join(' + '); pares[k] = (pares[k] || 0) + 1; } } }
  for (const v of m60) if (v) mont++;
  // qué tapa el piso: por capa (y por pieza), celdas de piso alcanzable bajo el rectángulo de algún sprite suyo (con el margen de t1000)
  { const W = z.W, H = z.H; const e0 = z.entradas.arriba || Object.values(z.entradas)[0], alc = new Uint8Array(W * H), pila = [Math.floor(e0[1]) * W + Math.floor(e0[0])]; alc[pila[0]] = 1;
    while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!alc[j] && !z.bloq[j]) { alc[j] = 1; pila.push(j); } } }
    let piso = 0; for (const v of alc) piso += v; pisoT += piso;
    const tapa = new Map(), tapaTodo = new Uint8Array(W * H);
    for (const o of z.objetos) { const m = man.o[o.id + '|' + o.v]; if (!m || m.plano) continue; const f = m.f[0], sx = (o.cx - o.cy) * 16, sy = (o.cx + o.cy) * 8, mx = f[3] * 0.15, my = f[4] * 0.1, x0 = sx - f[5] + mx, x1 = sx - f[5] + f[3] - mx, y0 = sy - f[6] + my, y1 = sy - f[6] + f[4];
      const c = EST.test(o.id) ? 'estructura:' + o.id.split('_')[0] : (o.capa || '(riego)') + ':' + o.id; let n = 0;
      // celdas cuyo centro en pantalla cae en el rectángulo
      const r = Math.ceil((f[3] + f[4] * 2) / 32) + 2;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { const X = o.cx + dx, Y = o.cy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || !alc[Y * W + X]) continue; const px = (X - Y) * 16, py = (X + Y) * 8; if (px >= x0 && px <= x1 && py >= y0 && py <= y1) { n++; tapaTodo[Y * W + X] = 1; } }
      tapa.set(c, (tapa.get(c) || 0) + n); }
    for (const [c, n] of tapa) tapaC[c] = (tapaC[c] || 0) + n; for (const v of tapaTodo) tapaT += v; }
}
await s.close();
const top = (o, n) => Object.entries(o).sort((a, b) => b[1] - a[1]).slice(0, n).map(([k, v]) => `${k} ${(v / nz).toFixed(0)}`).join(', ');
console.log(`zonas ${nz}, adornos por zona ${(total / nz).toFixed(0)}, montados ${(mont / total * 100).toFixed(0)} %`);
console.log('por capa (por zona):', top(capas, 20));
console.log('piezas (por zona):', top(ids, 45));
console.log('pares montados (por zona):', top(pares, 14));
console.log(`piso tapado por algún sprite: ${(tapaT / pisoT * 100).toFixed(0)} % del piso alcanzable. Por pieza (% del piso, con solapes):`, Object.entries(tapaC).sort((a, b) => b[1] - a[1]).slice(0, 28).map(([k, v]) => `${k} ${(v / pisoT * 100).toFixed(1)}`).join(', '), '\nPOR CAPA:', Object.entries(Object.entries(tapaC).reduce((o, [k, v]) => { const c = k.split(':')[0]; o[c] = (o[c] || 0) + v; return o; }, {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v / pisoT * 100).toFixed(1)}`).join(', '));
process.exit(0);
