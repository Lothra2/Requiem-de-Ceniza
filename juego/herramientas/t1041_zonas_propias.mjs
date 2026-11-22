// Revisa las tablas de zonas_propias.ts contra el manifiesto: cada pieza y variante que se nombra (muros, castigo, asiento,
// pared, relleno, santuarios) tiene que estar horneada, y cada piso también. node juego/herramientas/t1041_zonas_propias.mjs
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
const ZP = await sv.ssrLoadModule('/src/mundo/zonas_propias.ts');
const m = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8'));
const malos = [], hay = (id, v) => v === undefined ? Object.keys(m.o).some((k) => k.startsWith(id + '|')) : !!m.o[id + '|' + v];
for (const [z, d] of Object.entries(ZP.VARIANTE_ZONA)) {
  for (const k of ['muroX', 'muroY']) if (d[k]) for (const v of d[k][1]) if (!hay(d[k][0], v)) malos.push(`${z} ${k} ${d[k][0]}|${v}`);
  for (const [id, v] of [...(d.castigo ?? []), ...(d.foco ? [d.foco] : [])]) if (!hay(id, v)) malos.push(`${z} ${id}|${v}`);
  for (const [id] of d.pared ?? []) if (!hay(id)) malos.push(`${z} pared ${id}`);
  for (const id of [d.brasero, ...(d.santuarios ?? [])].filter(Boolean)) if (!hay(id)) malos.push(`${z} ${id}`);
  if (d.relleno) for (const t of ['alta', 'media', 'baja']) for (const [id, v] of d.relleno[t]) if (!hay(id, v)) malos.push(`${z} relleno ${id}|${v}`);
  for (const p of [d.piso, ...(d.parches ?? []), d.camino].filter(Boolean)) if (!Object.keys(m.p).some((k) => k.startsWith(p + '|'))) malos.push(`${z} piso ${p}`);
  if (d.pisoExt) for (let by = 0; by < 30; by++) for (let bx = 0; bx < 30; bx++) { const p = d.pisoExt(bx, by, 30, 30, 0.5, 0.5); if (p && !Object.keys(m.p).some((k) => k.startsWith(p + '|'))) { malos.push(`${z} pisoExt ${p}`); bx = by = 99; } }
  for (const k of ['borde', 'disperso', 'grande', 'luces', 'deco', 'extra']) for (const s of d[k] ?? []) { const n = Object.keys(m.o).filter((q) => { const [id, v] = q.split('|'); return (s.p ?? ['']).some((p) => id.includes(p)) && !(s.s ?? []).some((p) => id.includes(p)) && s.t.includes(m.o[q].tema) && (!s.v || s.v(v)); }).length; if (!n) malos.push(`${z} ${k} vacío ${JSON.stringify(s.p)}`); }
}
console.log(malos.length ? malos.join('\n') : 'OK: todo horneado');
await sv.close();
process.exit(malos.length ? 1 : 0);
