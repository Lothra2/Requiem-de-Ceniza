// Dinámica del equipo: el héroe con una prenda, un escudo o un arma en cada acción (caminar, correr, atacar, lanzar,
// herido, morir) y rumbo, cuadro por cuadro, pintado con el mismo motor que el pintor en vivo. Sirve para ver vuelo de
// la tela, ruedo que se atrasa, escudo pegado al brazo y arma en la mano a lo largo del golpe. Uso:
//   npx tsx juego/herramientas/t855_dinamica.mts <clase> <conjunto> [acciones] [rumbos]
//   python3 juego/herramientas/t855_lamina.py <clase> <conjunto>   ->  /tmp/requiem-pruebas/dinamica/<clase>_<conjunto>.png
// Conjuntos: habito, vestido, tunica, tabardo, capa, pieles, escudo_<redondo|cometa|torre|rodela>, arma_<tipo>, base
import { writeFileSync, mkdirSync } from 'node:fs';
import { encode } from 'fast-png';
import { nuevoHeroe, equipoVisual, cuerpoDe } from '../src/juego/heroe';
import { personajeEscena, type Equipo } from '../../src/engine/gotico/cuerpo';
import { cuadrosDe, type Accion, type Dir } from '../../src/engine/gotico/figura';
import { pintarEscena } from '../../src/engine/gotico/render';

const clase = (process.argv[2] ?? 'templario') as any, conj = process.argv[3] ?? 'habito';
const ACC = (process.argv[4] ?? 'caminar,correr,atacar,lanzar,herido,morir').split(',') as Accion[];
const DIRS = (process.argv[5] ?? 's,se,e,ne,n,o').split(',') as Dir[];
const OUT = `/tmp/requiem-pruebas/dinamica/${clase}_${conj}`; mkdirSync(OUT, { recursive: true });
const png = (f: string, r: { w: number; h: number; data: ArrayLike<number> }) => writeFileSync(f, encode({ width: r.w, height: r.h, data: new Uint8Array(r.data as any), channels: 4 }));
const h = nuevoHeroe(clase, 'x'), cu = cuerpoDe(clase);
const eq: Equipo = JSON.parse(JSON.stringify(equipoVisual(h)));
const ESC = { pieza: 'escudo_cometa', linea: 'placas', nivel: 3, color: '#7a2626' } as any;
if (conj === 'habito') { eq.torso = { tipo: 'tunica', mat: 'cu_tela_morada', ribete: 'cu_oro' }; eq.piernas = { tipo: 'tunica_larga', mat: 'cu_tela_morada' }; }
else if (conj === 'vestido') { eq.torso = { tipo: 'vestido', mat: 'cu_tela_roja', ribete: 'cu_oro' }; eq.piernas = { tipo: 'tunica_larga', mat: 'cu_tela_roja' }; }
else if (conj === 'tunica') { eq.torso = { tipo: 'tunica', mat: 'cu_tela_verde' }; }
else if (conj === 'tabardo') { eq.torso = { tipo: 'placas', mat: 'cu_placa', mat2: 'cu_malla' }; eq.piernas = { tipo: 'grebas', mat: 'cu_placa', mat2: 'cu_malla' }; eq.tabardo = { mat: 'cu_tela_azul', borde: 'cu_oro' }; eq.hombros = { tipo: 'placas', mat: 'cu_placa' }; }
else if (conj === 'capa') { eq.capa = { mat: 'cu_tela_roja', largo: 1, forro: 'cu_oro' }; }
else if (conj === 'pieles') { eq.torso = { tipo: 'placas', mat: 'cu_placa', mat2: 'cu_malla' }; eq.hombros = { tipo: 'pieles', mat: 'cu_pelaje' }; }
else if (conj.startsWith('escudo_')) { const t = conj.slice(7); eq.izq = { tipo: (t === 'redondo' ? 'escudo_redondo' : t === 'rodela' ? 'rodela' : 'escudo_' + t) as any, mat: 'cu_placa', mat2: 'cu_oro', icono: { ...ESC, pieza: t === 'rodela' || t === 'redondo' ? 'escudo_redondo' : 'escudo_' + t, ...(t === 'rodela' ? { variante: 'rodela' } : {}) } }; eq.arma = { tipo: 'espada', mat: 'cu_placa' }; }
else if (conj.startsWith('arma_')) { eq.arma = { tipo: conj.slice(5) as any, mat: 'cu_placa' }; delete eq.izq; }
const filas: { acc: string; dir: string; n: number }[] = [];
for (const acc of ACC) for (const dir of DIRS) {
  const n = cuadrosDe(acc, cu.presentacion);
  for (let f = 0; f < n; f++) png(`${OUT}/${acc}_${dir}_${f}.png`, pintarEscena({ ...personajeEscena(cu, eq, dir, acc, f), sinSombra: true } as any).img);
  filas.push({ acc, dir, n });
}
writeFileSync(`${OUT}/filas.json`, JSON.stringify(filas));
console.log(OUT, filas.length, 'filas');
