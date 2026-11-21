// Auditoría de lo que se ve mal en las 96 zonas (entrega 6), sin navegador. Por zona y semilla cuenta:
//  - flotando: un adorno de pie con parte de su huella sobre el vacío o fuera del piso (sin baldosa debajo)
//  - repetidos: la misma pieza con la misma cara a menos de 3 celdas de otra igual (se lee como copia y pega)
//  - en la salida: algo que bloquea o tapa a menos de 2 celdas del punto de una salida (la escalera o la boca tapada)
//  - montados: dos adornos que se pisan 60 % (la medida de t1000, con las cajas del manifiesto)
//  - hito: la zona abierta sin su hito, o con el hito sin explanada delante (4 de 4 celdas libres por la diagonal +x +y)
// Imprime el total por tipo y por pieza, y guarda los peores casos (con zona, semilla y celda) en casos_<etiqueta>.json, que
// t1032_recorrido.cjs puede fotografiar (PUNTOS=...).
//   node juego/herramientas/t1033_auditoria.mjs <etiqueta> [semillas]   (SOLO=zonas, BANDERAS=__x,__y para el antes)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const et = process.argv[2] || 'ahora', semillas = process.env.HEROE ? [0] : (process.argv[3] || '12345,777,4242').split(',').map(Number);
for (const b of (process.env.BANDERAS || '').split(',').filter(Boolean)) globalThis[b] = true;
const s = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
const Z = await s.ssrLoadModule('/src/mundo/zona.ts'), A = await s.ssrLoadModule('/src/mundo/actos.ts'), AZ = await s.ssrLoadModule('/src/nucleo/azar.ts');
const man = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8')).o;
const solo = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;
const EST = /muro|pared_toba|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina|macizo|escombro|sendero|trampa|camino/;
const tot = { flotando: 0, repetidos: 0, salida: 0, montados: 0, hito: 0 }, porPieza = {}, casos = [];
const suma = (t, id) => { porPieza[t + ' ' + id] = (porPieza[t + ' ' + id] || 0) + 1; };
for (const d of Object.values(A.ZONAS)) {
  if (solo && !solo.has(d.id)) continue;
  for (const sem0 of semillas) {
    // (HEROE=<id>: la semilla con que ese héroe ve la zona, como `entrarZona`; así los casos se pueden fotografiar en el juego)
    const sem = process.env.HEROE ? (AZ.hashTxt(process.env.HEROE + d.id) % 100000) + (AZ.hashTxt(d.id + process.env.HEROE + 0) % 1000) : sem0;
    const z = Z.generarZona(d, sem), W = z.W, H = z.H;
    const meta = (o) => man[o.id + '|' + o.v];
    const props = z.objetos.filter((o) => { const m = meta(o); return m && !m.plano && !EST.test(o.id) && o.capa !== 'relleno'; });
    // flotando
    if (d.tipo !== 'pueblo') for (const o of props) {
      const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2); let fuera = 0, n = 0;
      for (let y = y0; y < y0 + o.hh; y++) for (let x = x0; x < x0 + o.hw; x++) { n++; if (x < 0 || y < 0 || x >= W || y >= H || !z.pisos[Math.floor(y / 5) * z.tw + Math.floor(x / 5)] || z.bloq[y * W + x] === 2) fuera++; }
      if (fuera / n > 0.34) { tot.flotando++; suma('flotando', o.id + ':' + (o.capa ?? '-')); casos.push({ t: 'flotando', z: d.id, sem, x: o.cx, y: o.cy, id: o.id, v: o.v, k: fuera / n }); }
    }
    // repetidos
    const porId = new Map(); for (const o of props) { const k = o.id + '|' + o.v; if (!porId.has(k)) porId.set(k, []); porId.get(k).push(o); }
    for (const [k, L] of porId) for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) if (Math.hypot(L[i].cx - L[j].cx, L[i].cy - L[j].cy) < Math.max(3, (L[i].hw + L[i].hh) / 2 + 1.2)) { tot.repetidos++; suma('repetidos', k); casos.push({ t: 'repetidos', z: d.id, sem, x: L[i].cx, y: L[i].cy, id: k, k: 1 }); }
    // en la salida
    for (const sa of z.salidas) for (const o of props) { if (o === sa.obj || (sa.piezas ?? []).includes(o) || o.tag) continue; if (Math.hypot(o.cx - sa.cx, o.cy - sa.cy) < 2 + Math.max(o.hw, o.hh) / 2 && (o.bloquea || (meta(o).f[0][4] > 60))) { tot.salida++; suma('salida', o.id); casos.push({ t: 'salida', z: d.id, sem, x: sa.cx, y: sa.cy, id: o.id, k: 1 }); } }
    // montados (60 %; pueblos y casas no, como en desmontar)
    if (d.tipo !== 'pueblo' && !d.casa) {
    const cajas = props.map((o) => { const f = meta(o).f[0], sx = (o.cx - o.cy) * 16, sy = (o.cx + o.cy) * 8; return { o, x0: sx - f[5], y0: sy - f[6], x1: sx - f[5] + f[3], y1: sy - f[6] + f[4], a: f[3] * f[4] }; }).sort((a, b) => a.x0 - b.x0);
    for (let i = 0; i < cajas.length; i++) for (let j = i + 1; j < cajas.length && cajas[j].x0 < cajas[i].x1; j++) { const a = cajas[i], b = cajas[j]; const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); if (ix <= 0 || iy <= 0) continue; if (a.o.capa === 'pared' && b.o.capa === 'pared' && /pared/.test(a.o.id) !== /pared/.test(b.o.id)) continue; if (ix * iy / Math.min(a.a, b.a) >= 0.6) { tot.montados++; suma('montados', [a.o.id, b.o.id].sort().join('+')); casos.push({ t: 'montados', z: d.id, sem, x: a.o.cx, y: a.o.cy, id: a.o.id + '+' + b.o.id, k: 1 }); } }
    }
    // hito
    if (d.tipo === 'exterior' && z.objetos.some((o) => o.capa === 'escena')) {
      const h = z.objetos.find((o) => o.id === 'acto_hito');
      if (!h) { tot.hito++; casos.push({ t: 'sin hito', z: d.id, sem, x: 0, y: 0, k: 9 }); }
      else { let ok = 0; for (let k = 6; k <= 9; k++) if (z.bloq[(h.cy + k) * W + h.cx + k] === 0) ok++; if (ok < 3) { tot.hito++; casos.push({ t: 'hito sin explanada', z: d.id, sem, x: h.cx, y: h.cy, k: 4 - ok }); } }
    }
  }
}
await s.close();
fs.mkdirSync('/tmp/requiem-pruebas/e6', { recursive: true });
fs.writeFileSync(`/tmp/requiem-pruebas/e6/casos_${et}.json`, JSON.stringify(casos));
console.log(JSON.stringify(tot));
console.log(Object.entries(porPieza).sort((a, b) => b[1] - a[1]).slice(0, +(process.env.TOP || 30)).map(([k, v]) => v + ' ' + k).join('\n'));
