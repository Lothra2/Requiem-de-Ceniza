// Prueba de espacios: las medidas de la auditoría de mundos como regresión. Genera las 96 zonas sin navegador (Vite en modo
// servidor de módulos) en varias semillas y mide por familia: % de arena, arenas de 120 celdas o más, campamentos parados en
// arena, adornos por pantalla, adornos montados, piso legible y el despeje de cada jefe. Falla si algo baja de su piso.
// Uso: node juego/herramientas/t1000_espacios.mjs [etiqueta] [semillas]   (SOLO=a1_paramo,a2_dunas  ZONAS=1 imprime cada zona)
// Guarda /tmp/requiem-pruebas/mundos1/metricas_<etiqueta>.json. Con ANTES=<etiqueta> imprime la tabla contra esa corrida.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { medirZona, monton } from './medir_espacios.mjs';

const raiz = fileURLToPath(new URL('..', import.meta.url));
const etiqueta = process.argv[2] || 'ahora', semillas = (process.argv[3] || '12345,777,4242').split(',').map(Number);
const DIR = '/tmp/requiem-pruebas/mundos1'; fs.mkdirSync(DIR, { recursive: true });
const s = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
const Z = await s.ssrLoadModule('/src/mundo/zona.ts'), A = await s.ssrLoadModule('/src/mundo/actos.ts');
const man = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8'));
const solo = process.env.SOLO ? new Set(process.env.SOLO.split(',')) : null;
const familia = (d, z) => (d.tipo === 'pueblo' ? 'pueblo' : d.tipo === 'exterior' ? 'exterior' : d.casa ? 'casa' : z.hueco ? 'cueva' : 'obra');
// excepciones a propósito: apretado como tema (minas de riel, puentes sobre el vacío)
const med = (a) => { if (!a.length) return 0; const t = [...a].sort((x, y) => x - y); return t[Math.floor(t.length / 2)]; };
const filas = [];
for (const d of Object.values(A.ZONAS)) {
  if (solo && !solo.has(d.id)) continue;
  semillas.forEach((sem, k) => {
    const z = Z.generarZona(d, sem), m = medirZona(z, null, { mw: 1280, mh: 624 }), q = k === 0 ? monton(z, man) : null;
    const camp = m.spawns.filter((sp) => sp.t !== 'jefe'), jefe = m.spawns.find((sp) => sp.t === 'jefe');
    // el ruedo del jefe: radio libre (anillos de Chebyshev) en el mejor punto a 3 celdas de donde sale
    const f = { id: d.id, fam: familia(d, z), sem, tema: d.tema, alc: m.alc, arena: m.arena4, arenaS: m.arena4S, arenas: m.arenas, arenaMax: m.arenaMax, pasillo: m.pasAnchoMed, camp: camp.length, campArena: camp.filter((sp) => sp.enArena).length,
      campN: camp.reduce((t, sp) => t + (z.spawns.find((o) => Math.floor(o.cx) === Math.floor(o.cx) && o.tipo === sp.t)?.n ?? 0), 0), jefe: jefe ? jefe.mA : null, jefePunto: jefe ? jefe.cA : null, vacio: m.pant?.vacioMed, piso: m.pant?.libreMed, decoArena: m.decoArena100,
      escenas: z.objetos.filter((o) => o.capa === 'escena').length, hito: z.objetos.filter((o) => o.id === 'acto_hito').length, lugares: (z.lugares ?? []).length };
    if (q) Object.assign(f, { props: q.props, propsPant: q.propsPantMed, propsP90: q.propsPantP90, montados: q.sol60, pegados: q.pegados, legible: q.legibleMed, dib: q.dibPantMed });
    filas.push(f);
    if (process.env.ZONAS) console.log(f.id.padEnd(15), f.fam.padEnd(8), sem, 'arena', f.arena, 'n', f.arenas, 'max', f.arenaMax, 'camp', f.campArena + '/' + f.camp, 'jefe', f.jefe, q ? `props/pant ${f.propsPant} mont ${f.montados} leg ${f.legible}` : '');
  });
}
await s.close();
fs.writeFileSync(`${DIR}/metricas_${etiqueta}.json`, JSON.stringify(filas));
const resumen = (F) => { const o = {}; for (const fam of ['exterior', 'cueva', 'obra', 'casa', 'pueblo']) { const L = F.filter((f) => f.fam === fam); if (!L.length) continue; const M = L.filter((f) => f.props != null), camp = L.reduce((t, f) => t + f.camp, 0);
  o[fam] = { zonas: L.length, arena: Math.round(med(L.map((f) => f.arena)) * 100), arenas: med(L.map((f) => f.arenas)), arenaMax: med(L.map((f) => f.arenaMax)), sinArena: Math.round((L.filter((f) => !f.arenas).length / L.length) * 100), campArena: camp ? Math.round((L.reduce((t, f) => t + f.campArena, 0) / camp) * 100) : 0,
    camp: +(camp / L.length).toFixed(1), pasillo: med(L.map((f) => f.pasillo ?? 0)), propsPant: med(M.map((f) => f.propsPant)), propsP90: med(M.map((f) => f.propsP90)), montados: Math.round(med(M.map((f) => f.montados)) * 100), legible: Math.round(med(M.map((f) => f.legible)) * 100), dib: med(M.map((f) => f.dib)),
    vacio: Math.round(med(L.map((f) => f.vacio ?? 0)) * 100), decoArena: med(L.map((f) => f.decoArena ?? 0)) }; } return o; };
const R = resumen(filas), antes = process.env.ANTES && fs.existsSync(`${DIR}/metricas_${process.env.ANTES}.json`) ? resumen(JSON.parse(fs.readFileSync(`${DIR}/metricas_${process.env.ANTES}.json`, 'utf8')).filter((f) => !solo || solo.has(f.id))) : null;
const NOMBRE = { zonas: 'zonas medidas', arena: '% arena', arenas: 'arenas de 120+ por zona', arenaMax: 'arena más grande (celdas)', sinArena: '% de zonas sin arena', campArena: '% de campamentos en arena', camp: 'campamentos por zona', pasillo: 'ancho de pasillo (mediana)', propsPant: 'adornos por pantalla', propsP90: 'adornos por pantalla (p90)', montados: '% adornos montados (60 %)', legible: '% piso legible', dib: 'objetos dibujados por pantalla', vacio: '% de pantalla vacío o roca', decoArena: 'adornos que bloquean por 100 celdas de arena' };
const fams = Object.keys(R);
console.log('\n| medida | ' + fams.join(' | ') + ' |\n|---|' + fams.map(() => '---').join('|') + '|');
for (const k of Object.keys(NOMBRE)) console.log(`| ${NOMBRE[k]} | ` + fams.map((f) => (antes?.[f] ? `${antes[f][k]} → ` : '') + R[f][k]).join(' | ') + ' |');
// jefes
const jefes = filas.filter((f) => f.jefe != null), porJefe = {};
for (const f of jefes) (porJefe[f.id] ??= []).push(f.jefe);
console.log('\nRuedo del jefe (radio libre, la peor semilla): ' + Object.entries(porJefe).map(([id, v]) => `${id} ${Math.min(...v)}`).join(', '));
// los pisos: lo que no puede volver a bajar (ver CLAUDE.md, Mundos). Las metas de la auditoría van entre paréntesis.
const PISOS = JSON.parse(fs.readFileSync(raiz + 'herramientas/t1000_pisos.json', 'utf8'));
let mal = 0;
for (const [fam, reglas] of Object.entries(PISOS.familias)) { if (!R[fam]) continue; for (const [k, [op, v]] of Object.entries(reglas)) { const x = R[fam][k], ok = op === '>=' ? x >= v : x <= v; if (!ok) { mal++; console.log(`MAL ${fam}: ${NOMBRE[k]} ${x}, tiene que ser ${op} ${v}`); } } }
if (!solo) for (const [id, v] of Object.entries(porJefe)) { const piso = PISOS.jefe[id] ?? PISOS.jefe['*']; if (Math.min(...v) < piso) { mal++; console.log(`MAL jefe de ${id}: radio libre ${Math.min(...v)}, tiene que ser >= ${piso}`); } }
if (!solo) for (const f of filas) if (f.fam === 'exterior' && PISOS.exterior) { if (f.hito < PISOS.exterior.hito) { mal++; console.log(`MAL ${f.id} (${f.sem}): sin la pieza del acto`); } if (f.escenas < PISOS.exterior.escenas) { mal++; console.log(`MAL ${f.id} (${f.sem}): ${f.escenas} piezas de escena`); } }
console.log(mal ? `\nFALLA: ${mal}` : '\nespacios: todo en su piso');
process.exit(mal ? 1 : 0);
