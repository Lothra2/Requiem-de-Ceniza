// Laboratorio de los íconos de habilidad, sin servidor: pinta cada ícono a los tamaños del juego y guarda una tira por
// clase en /tmp/requiem-pruebas/iconos/lab (46, 26 y 22 a tamaño real y 46 ampliado). La lámina con los nombres la arma
// t971_lamina.py. Uso: npx tsx juego/herramientas/t971_iconos_lab.mts [clase|ids separados por coma] [tamaños]
import { writeFileSync, mkdirSync } from 'fs';
import { encode } from 'fast-png';
import { HABILIDADES } from '../src/datos/clases';
import { pintarIcono, tieneReceta } from '../src/ui/iconos_recetas';
const filtro = process.argv[2] || '', tams = (process.argv[3] || '46,26,22').split(',').map(Number), Z = 4;
const lista = HABILIDADES.filter((h) => !filtro || filtro === 'todo' || h.clase === filtro || filtro.split(',').includes(h.id));
const dir = '/tmp/requiem-pruebas/iconos/lab'; mkdirSync(dir, { recursive: true });
const t0 = performance.now(); let n = 0;
const meta: any[] = [];
for (const h of lista) {
  const fila: Record<string, string> = {};
  for (const s of tams) { const d = pintarIcono(h, s); n++; const f = `${dir}/${h.id}_${s}.png`; writeFileSync(f, encode({ width: s, height: s, data: d, channels: 4 })); fila[s] = f; }
  meta.push({ id: h.id, clase: h.clase, nombre: h.nombre[0], tipo: h.tipo, elem: h.elem, def: !!h.definitiva, receta: tieneReceta(h.id), f: fila });
}
const ms = performance.now() - t0;
writeFileSync(`${dir}/meta.json`, JSON.stringify({ tams, meta }));
console.log(`${n} íconos en ${ms.toFixed(0)} ms (${(ms / n).toFixed(2)} ms cada uno), sin receta: ${meta.filter((m) => !m.receta).length}`);
