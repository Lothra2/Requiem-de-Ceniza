// Lámina de las formas de casco (iconos3d.ts `cascoForma`): cada forma con varios metales, el ícono grande junto al
// casco puesto en el héroe (tres rumbos y de espaldas). Uso:
//   FORMAS=nasal,celada METALES=acero,oro npx tsx juego/herramientas/t854_formas_cascos.mts [clase]
//   python3 juego/herramientas/t854_lamina.py [clase] [columnas]   ->  /tmp/requiem-pruebas/cascos/formas_<clase>/lamina.png
import { writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
import { nuevoHeroe, cuerpoDe, equipoVisual } from '../src/juego/heroe';
import { iconoObjeto3D } from '../../src/engine/gotico/iconos3d';
import { equipoDeInventario } from '../../src/engine/gotico/apariencia';
import { personajeEscena } from '../../src/engine/gotico/cuerpo';
import { pintarEscena } from '../../src/engine/gotico/render';
const clase = (process.argv[2] ?? 'templario') as any;
const OUT = `/tmp/requiem-pruebas/cascos/formas_${clase}`; mkdirSync(OUT, { recursive: true });
const png = (f: string, r: any) => writeFileSync(f, encode({ width: r.w, height: r.h, data: new Uint8Array(r.data), channels: 4 }));
const casos: [string, any][] = [];
const F = (process.env.FORMAS ?? 'nasal,cofia,abierto,celada,bacinete,gran_yelmo,astado,mascara').split(',');
const METALES = (process.env.METALES ?? 'acero,oro,laton,negro,bronce,plata').split(',');
for (const f of F) for (const m of METALES) {
  const linea = f === 'nasal' || f === 'cofia' || f === 'abierto' ? 'malla' : 'placas';
  casos.push([`${f}_${m}`, { pieza: 'casco', linea, nivel: 3, metal: m, variante: f, ...(m === 'oro' ? { ribete: 'plata' } : m === 'negro' ? { ribete: 'oro' } : {}) }]);
}
const h = nuevoHeroe(clase, 'x'); const base = equipoVisual(h); const cu = cuerpoDe(clase);
const filas: any[] = [];
casos.forEach(([n, d], k) => {
  png(`${OUT}/g${k}.png`, iconoObjeto3D(d, 120, 120));
  const eq = { ...base, ...equipoDeInventario({ casco: { it: {} as any, icono3d: d } }, base) } as any;
  eq.arma = base.arma;
  for (const [j, dir] of (['s', 'so', 'se', 'ne'] as const).entries()) png(`${OUT}/h${k}_${j}.png`, pintarEscena({ ...personajeEscena(cu, eq, dir, 'quieto', 0), sinSombra: true } as any).img);
  filas.push({ k, n });
});
writeFileSync(`${OUT}/f.json`, JSON.stringify(filas));
