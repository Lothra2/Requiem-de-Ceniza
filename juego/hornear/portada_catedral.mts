// Vuelve a pintar la catedral de la portada (toma en perspectiva) y lo que depende de dónde quedó la puerta:
// catedral.png, catedral_luz.png, catedral_fuego (tira), niebla.png y cementerio. Actualiza portada.json.
// Uso: npx tsx juego/hornear/portada_catedral.mts [RAPIDO=1 sin fuego]   y después python3 juego/hornear/portada_webp.py
import { readFileSync, writeFileSync } from 'node:fs';
import { catedralHeroica } from '../../src/engine/gotico/catedral_portada';
import { CAPA, capaFuegoCatedral, capaNiebla, capaCementerio } from '../../src/engine/gotico/portada';
import { aRaster, grano } from '../../src/engine/gotico/cine';
import { encodePng } from '../../src/engine/export/png';
const DIR = new URL('../public/assets/portada/', import.meta.url).pathname;
const t0 = Date.now(), av = (s: string) => console.log(((Date.now() - t0) / 1000).toFixed(1) + 's', s);
const X = +(process.env.X ?? 1030), Y = +(process.env.Y ?? 628), ALTO = +(process.env.ALTO ?? 570);
av('catedral'); const cat = catedralHeroica({ w: CAPA.w, h: CAPA.h, x: X, y: Y, alto: ALTO, luna: [X + 62, Y - ALTO * 0.7], ss: +(process.env.SS ?? 2) });
writeFileSync(DIR + 'fondo/catedral.png', encodePng(aRaster(cat.capa)));
writeFileSync(DIR + 'fondo/catedral_luz.png', encodePng(aRaster(cat.luz)));
const man = JSON.parse(readFileSync(DIR + 'portada.json', 'utf8'));
const capas: any[] = man.fondo.capas;
if (process.env.RAPIDO !== '1') {
  av('fuego tras los vidrios'); const f = capaFuegoCatedral(cat.vitrales)!;
  writeFileSync(DIR + 'fondo/catedral_fuego.png', encodePng(f.img));
  const c = capas.find((q) => q.id === 'catedral_fuego'), a = f.anim as any;
  Object.assign(c, { x: f.x, y: f.y, w: a.w, h: a.h, anim: f.anim });
  av('niebla'); writeFileSync(DIR + 'fondo/niebla.png', encodePng(aRaster(capaNiebla(cat.puerta))));
  av('camposanto'); const cem = capaCementerio(cat.puerta); grano(cem, 0.02, 3); writeFileSync(DIR + 'fondo/cementerio.png', encodePng(aRaster(cem)));
}
man.fondo.foco = { ...man.fondo.foco, x: Math.round(cat.puerta[0] - CAPA.mx), puerta: [Math.round(cat.puerta[0] - CAPA.mx), Math.round(cat.puerta[1] - CAPA.my)] };
man.fondo.luna = { x: Math.round(cat.luna[0] - CAPA.mx), y: Math.round(cat.luna[1] - CAPA.my) };
writeFileSync(DIR + 'portada.json', JSON.stringify(man));
av(`listo: puerta ${cat.puerta.map(Math.round)} luna ${cat.luna.map(Math.round)}`);
