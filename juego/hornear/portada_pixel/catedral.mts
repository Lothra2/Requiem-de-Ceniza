// La catedral de la portada de pixel: el mismo modelo 3D de la portada vieja, con luz de noche, pintado chico (cada punto
// es un punto de la escena de 640 x 360) y guardado en flotantes para que pixel.py lo lleve a paleta.
// Uso: npx tsx juego/hornear/portada_pixel/catedral.mts  (deja /tmp/requiem-pixel/catedral_*.f32 y .json)
import { writeFileSync, mkdirSync } from 'node:fs';
import { catedralNoche } from './catedral_noche';
const D = process.env.SALIDA ?? '/tmp/requiem-pixel/'; mkdirSync(D, { recursive: true });
const w = +(process.env.W ?? 300), h = +(process.env.H ?? 300), alto = +(process.env.ALTO ?? 236);
const x = +(process.env.X ?? 150), y = +(process.env.Y ?? 262);
const c = catedralNoche({ w, h, x, y, alto, luna: [+(process.env.LUNA_X ?? -226), +(process.env.LUNA_Y ?? 122)], ss: +(process.env.SS ?? 4) });
writeFileSync(D + 'catedral_capa.f32', Buffer.from(c.capa.d.buffer));
writeFileSync(D + 'catedral_luz.f32', Buffer.from(c.luz.d.buffer));
writeFileSync(D + 'catedral_nit.f32', Buffer.from(c.nitida.d.buffer));
writeFileSync(D + 'catedral_tierra.f32', Buffer.from(c.tierra.d.buffer));
writeFileSync(D + 'catedral_vid.f32', Buffer.from(c.vitrales.d.buffer));
writeFileSync(D + 'catedral.json', JSON.stringify({ w, h, puerta: c.puerta, luna: c.luna }));
console.log('listo', w, h, c.puerta);
