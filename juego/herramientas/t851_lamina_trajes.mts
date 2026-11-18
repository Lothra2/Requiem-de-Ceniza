// Lámina de trajes: héroes vestidos con armaduras que caen (pecho, casco, guantes, botas y cinto de la misma tierra)
// junto a sus íconos, pintados con el mismo motor que el pintor en vivo. Uso:
//   npx tsx juego/herramientas/t851_lamina_trajes.mts [clase] [cuantos] && python3 juego/herramientas/t851_lamina.py
import { writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
import { crearObjeto, baseDe } from '../src/juego/objetos';
import { nuevoHeroe, equipoVisual, cuerpoDe } from '../src/juego/heroe';
import { aLoot } from '../src/ui/loot';
import { iconoDeLoot, iconoObjeto3D } from '../../src/engine/gotico/iconos3d';
import { personajeEscena } from '../../src/engine/gotico/cuerpo';
import { pintarEscena } from '../../src/engine/gotico/render';

const clase = (process.argv[2] ?? 'templario') as any, N = Number(process.argv[3] ?? 24);
const OUT = `/tmp/requiem-pruebas/trajes/${clase}`; mkdirSync(OUT, { recursive: true });
const png = (f: string, r: { w: number; h: number; data: ArrayLike<number> }) => writeFileSync(f, encode({ width: r.w, height: r.h, data: new Uint8Array(r.data as any), channels: 4 }));
const NIVELES = [3, 9, 16, 19, 24, 28, 31, 34, 38, 42, 47, 52, 56, 60];
const RAR = ['normal', 'magico', 'raro', 'normal', 'magico', 'raro', 'gris'] as const;
const vistos = new Set<string>(), filas: any[] = [];
let semilla = 0;
for (let i = 0; filas.length < N && i < N * 40; i++) {
  const nivel = NIVELES[filas.length % NIVELES.length], rar = RAR[(filas.length * 3 + i) % RAR.length];
  const pecho = crearObjeto(nivel, rar as any, (b) => b.ranura === 'torso' && !b.linea && !b.tinte && (!b.clase || b.clase === clase));
  const it = aLoot(pecho), tj = (it.design as any)?.traje; if (!tj) continue;
  const firma = tj.linea + (tj.corte ?? '') + (tj.tabardo ? 't' : '');
  // que salgan todas las líneas y cortes, sin repetir la misma combinación mucho
  if (vistos.has(firma) && i < N * 20) continue; vistos.add(firma);
  const h = nuevoHeroe(clase, 'x'); h.nivel = 60;
  h.equipo.torso = pecho;
  for (const [cas, ran] of [['cabeza', 'cabeza'], ['manos', 'manos'], ['pies', 'pies'], ['cinturon', 'cinturon']] as const) {
    const o = crearObjeto(nivel, rar as any, (b) => b.ranura === ran && !b.linea && !b.tinte && (!b.clase || b.clase === clase));
    if (baseDe(o)?.ranura === ran) (h.equipo as any)[cas] = o;
  }
  const eq = equipoVisual(h), cu = cuerpoDe(clase);
  const k = filas.length;
  for (const [j, dir] of (['so', 'se'] as const).entries()) {
    const r = pintarEscena({ ...personajeEscena(cu, eq, dir, 'quieto', 0), sinSombra: true } as any);
    png(`${OUT}/h${k}_${j}.png`, r.img);
  }
  const iconos: string[] = [];
  for (const cas of ['torso', 'cabeza', 'manos', 'pies', 'cinturon']) {
    const o = (h.equipo as any)[cas]; if (!o) continue;
    const d = iconoDeLoot(aLoot(o)); if (!d) continue;
    const f = `${OUT}/i${k}_${cas}.png`; png(f, iconoObjeto3D(d, cas === 'torso' ? 72 : 48, cas === 'torso' ? 96 : 48)); iconos.push(f);
  }
  filas.push({ k, nivel, rareza: pecho.rareza, nombre: pecho.nombre[0], base: pecho.base, traje: tj, iconos });
  semilla++;
}
writeFileSync(`${OUT}/lamina.json`, JSON.stringify(filas, null, 1));
console.log(`${filas.length} trajes en ${OUT}`);
