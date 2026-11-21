// Cosas debajo de la pared: qué adornos quedan tapados por un muro que se pinta delante de ellos aunque estén delante
// del muro (o metidos en él). Genera las 96 zonas sin navegador (Vite como cargador de módulos, como t1000), vuelca los
// objetos con su orden de pintado (el mismo `prof` de escena.ts) y t1015_tapados.py mira punto por punto, con las
// máscaras de los atlas horneados, cuánto de cada adorno pisa un muro pintado después. Imprime por zona y por capa, guarda
// los recortes de los peores en /tmp/requiem-pruebas/tapados/<etiqueta> y falla si queda alguno.
// Uso: node juego/herramientas/t1015_tapados.mjs [etiqueta] [semillas]   (SOLO=a1_cripta,...  RECORTES=12  BANDERAS=__sinX)
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const etiqueta = process.argv[2] || 'ahora', semillas = (process.argv[3] || '12345,777,4242').split(',').map(Number);
const DIR = `/tmp/requiem-pruebas/tapados/${etiqueta}`; fs.mkdirSync(DIR, { recursive: true });
for (const b of (process.env.BANDERAS || '').split(',').filter(Boolean)) globalThis[b] = true;
const s = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
const Z = await s.ssrLoadModule('/src/mundo/zona.ts'), A = await s.ssrLoadModule('/src/mundo/actos.ts');
const man = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8'));
const solo = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;
// (el mismo criterio que `pisable` en render/escena.ts: lo grande que se pisa por dentro se ordena por su borde de atrás)
const pisable = (z, o) => { let libres = 0, total = 0; if (o.hw * o.hh >= 12) for (let y = Math.floor(o.cy - (o.hh - 1) / 2); y <= o.cy + (o.hh - 1) / 2; y++) for (let x = Math.floor(o.cx - (o.hw - 1) / 2); x <= o.cx + (o.hw - 1) / 2; x++) { total++; if (x >= 0 && y >= 0 && x < z.W && y < z.H && !z.bloq[y * z.W + x]) libres++; } return total > 0 && libres / total > 0.33; };
const zonas = [];
for (const d of Object.values(A.ZONAS)) {
  if (solo && !solo.has(d.id)) continue;
  for (const sem of semillas) {
    const z = Z.generarZona(d, sem);
    const objs = z.objetos.map((o, i) => { const m = man.o[o.id + '|' + o.v]; const plano = !m || m.plano || o.id === 'par_arroyo' || o.id === 'inf2_rio_lava';
      return { i, id: o.id, v: o.v, cx: o.cx, cy: o.cy, hw: o.hw, hh: o.hh, capa: o.capa ?? '', tag: o.tag ?? '', bloq: !!o.bloquea, prof: plano ? -1e6 + o.cx + o.cy : pisable(z, o) ? o.cx + o.cy - (o.hw + o.hh) / 2 + 1 : o.cx + o.cy + (o.hw + o.hh) / 2 - 1, plano: !!plano }; });
    zonas.push({ id: d.id, sem, tipo: z.tipo, tema: d.tema, W: z.W, H: z.H, objs });
  }
}
console.log('despegados', JSON.stringify(globalThis.__despegados));
await s.close();
fs.writeFileSync(`${DIR}/objetos.json`, JSON.stringify(zonas));
const r = spawnSync('python3', [raiz + 'herramientas/t1015_tapados.py', `${DIR}/objetos.json`, DIR], { stdio: 'inherit', env: { ...process.env, ASSETS: raiz + 'public/assets' } });
process.exit(r.status ?? 1);
