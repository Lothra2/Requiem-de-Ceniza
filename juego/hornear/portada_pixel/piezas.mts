// Las piezas de la portada pintadas con el motor del juego: los ahorcados (cuerpos de verdad del motor, en harapos) y el
// pueblo abandonado (casas, molino, capilla y atalaya del catálogo). Las deja en flotantes en /tmp/requiem-pixel/piezas
// para que pixel.py las lleve a la paleta. Uso: npx tsx juego/hornear/portada_pixel/piezas.mts [LAB=1 solo prueba poses]
import { writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { modelo, modeloPersonaje, iluminar, type Luz } from '../../../src/engine/gotico/estudio';
import { CUERPOS, EQUIPOS } from '../../../src/engine/gotico/actos45';
const raiz = new URL('../../../src/engine/gotico/', import.meta.url).pathname;
for (const f of readdirSync(raiz + 'catalogo')) if (f.endsWith('.ts')) await import(raiz + 'catalogo/' + f);
const D = '/tmp/requiem-pixel/piezas/'; mkdirSync(D, { recursive: true });
const luz: Luz = { amb: [1, 1, 1], desat: 0.25, clave: { dir: [-0.7, -0.7], k: 0.55 }, bordes: [{ dx: -1, dy: -1, c: [0.55, 0.52, 0.44], k: 0.6 }] };
const guardar = (n: string, m: any, alto: number) => {
  const p = iluminar(m, alto, luz);
  writeFileSync(D + n + '.f32', Buffer.from(p.cuerpo.d.buffer));
  return { n, w: p.cuerpo.w, h: p.cuerpo.h, ax: p.ax, ay: p.ay };
};
const sal: any[] = [];
if (process.env.LAB) {
  for (const [acc, f] of [['herido', 0], ['herido', 2], ['morir', 1], ['morir', 2], ['quieto', 0]] as const)
    for (const dir of ['s', 'se', 'so'] as const) sal.push(guardar(`lab_${acc}${f}_${dir}`, modeloPersonaje(`lab${acc}${f}${dir}`, CUERPOS.muerto, EQUIPOS.preso, dir, acc, f, 4), 240));
} else {
  const cuerpos: [string, any, any, string, any, number][] = [
    ['ahorcado0', CUERPOS.muerto, EQUIPOS.preso, 'se', 'morir', 1],
    ['ahorcado1', CUERPOS.palido, EQUIPOS.harapos, 'so', 'quieto', 0],
    ['ahorcado2', CUERPOS.muerto, EQUIPOS.harapos, 's', 'morir', 1],
  ];
  for (const [n, cu, eq, dir, acc, f] of cuerpos) sal.push(guardar(n, modeloPersonaje(n, cu, eq, dir, acc, f, 4), 260));
  for (const [n, id, v, f, alto] of [['casa1', 'casa_entramado', 'abandonada', 0, 150], ['casa2', 'casa_dos_pisos', 'abandonada', 0, 170], ['capilla', 'casa_capilla', 'ruinosa', 0, 170],
    ['atalaya', 'casa_atalaya', 'madera_rota', 0, 190], ['granero', 'casa_granero', 'abandonado', 0, 150]] as [string, string, string, number, number][])
    sal.push(guardar(n, modelo(id, v, f, 2), alto));
  for (let f = 0; f < 6; f++) sal.push(guardar('molino' + f, modelo('casa_molino', 'abandonado', f, 2), 200));
}
writeFileSync(D + 'piezas.json', JSON.stringify(sal));
console.log(sal.map((s) => `${s.n} ${s.w}x${s.h}`).join('\n'));
