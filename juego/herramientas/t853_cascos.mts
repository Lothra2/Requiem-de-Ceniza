// Lámina de cascos: cada base de casco con varios metales (o colores), puesto en el héroe (tres rumbos, la cabeza
// ampliada) junto a su ícono de la casilla. Lo que se ve puesto tiene que ser lo del ícono. Uso:
//   npx tsx juego/herramientas/t853_cascos.mts [clase] [guantes|botas] && python3 juego/herramientas/t853_lamina.py [clase] [pieza]
// Sale en /tmp/requiem-pruebas/cascos/<clase>[_<pieza>]/lamina.png
import { writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
import { crearBase } from '../src/juego/objetos';
import { BASES } from '../src/datos/objetos_datos';
import { nuevoHeroe, equipoVisual, cuerpoDe } from '../src/juego/heroe';
import { aLoot } from '../src/ui/loot';
import { iconoDeLoot, iconoObjeto3D } from '../../src/engine/gotico/iconos3d';
import { personajeEscena } from '../../src/engine/gotico/cuerpo';
import { pintarEscena } from '../../src/engine/gotico/render';

const clase = (process.argv[2] ?? 'templario') as any, pieza = process.argv[3] ?? 'cabeza';
const ranura = pieza === 'guantes' ? 'manos' : pieza === 'botas' ? 'pies' : 'cabeza';
const casilla = ranura === 'cabeza' ? 'cabeza' : ranura;
const OUT = `/tmp/requiem-pruebas/cascos/${clase}${ranura === 'cabeza' ? '' : '_' + pieza}`; mkdirSync(OUT, { recursive: true });
const png = (f: string, r: { w: number; h: number; data: ArrayLike<number> }) => writeFileSync(f, encode({ width: r.w, height: r.h, data: new Uint8Array(r.data as any), channels: 4 }));
const SOLO = process.env.SOLO?.split(',');
const bases = BASES.filter((b) => b.ranura === ranura && !(b as any).soloUnico && (!b.clase || b.clase === clase || ranura === 'cabeza') && (SOLO ? SOLO.includes(b.id) : !b.linea && !b.tinte));
const POR = Number(process.env.POR ?? 4);
const filas: any[] = [];
for (const [bi, b] of bases.entries()) {
  const vistos = new Set<string>();
  // varios números de objeto, niveles y rarezas: salen metales y ribetes distintos de la misma base
  for (let i = 0; vistos.size < POR && i < 400; i++) {
    const nivel = [b.nivel, 16, 24, 31, 38, 47, 56, 60][i % 8], rar = (process.env.RAR as any) ?? (['normal', 'magico', 'raro'] as const)[(i >> 3) % 3];
    const o = crearBase(b, Math.max(b.nivel, nivel)); o.rareza = rar; o.uid = 1000 + bi * 100003 + i * 7919;
    const it = aLoot(o), d = iconoDeLoot(it); if (!d) continue;
    const tj = (it.design as any)?.traje;
    const firma = tj ? `${tj.metal ?? tj.color}|${tj.ribete ?? ''}` : JSON.stringify(d);
    if (vistos.has(firma)) continue; vistos.add(firma);
    const h = nuevoHeroe(clase, 'x'); h.nivel = 60; (h.equipo as any)[casilla] = o;
    const eq = equipoVisual(h), cu = cuerpoDe(clase), k = filas.length;
    for (const [j, dir] of (['so', 's', 'se', 'ne'] as const).entries()) {
      const r = pintarEscena({ ...personajeEscena(cu, eq, dir, 'quieto', 0), sinSombra: true } as any);
      png(`${OUT}/h${k}_${j}.png`, r.img);
    }
    png(`${OUT}/i${k}.png`, iconoObjeto3D(d, 48, 48));
    if (process.env.GRANDE) png(`${OUT}/g${k}.png`, iconoObjeto3D(d, 160, 160));
    filas.push({ k, base: b.id, nivel: o.nivel, rareza: rar, traje: tj ?? null, d, cabeza: (eq as any)[ranura] ?? null });
  }
}
writeFileSync(`${OUT}/lamina.json`, JSON.stringify(filas, null, 1));
console.log(`${filas.length} piezas en ${OUT}`);
