// Las cajas de los sprites de los adornos (ancho, alto y ancla del primer cuadro horneado) para la generación de zonas:
// `desmontar` en zona.ts mira con esto qué adorno tapa a otro en pantalla. Sale del manifiesto: volver a correrlo
// después de hornear piezas nuevas (sin su caja, una pieza no se desmonta nunca, no se rompe nada).
// Uso: node juego/herramientas/t1013_cajas.mjs
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url));
const man = JSON.parse(fs.readFileSync(raiz + 'public/assets/manifiesto.json', 'utf8'));
const EST = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina/;
const t = {};
for (const [k, m] of Object.entries(man.o)) { const id = k.split('|')[0]; if (m.plano || EST.test(id) || !m.f?.[0]) continue; const f = m.f[0]; t[k] = [f[3], f[4], f[5], f[6]]; }
fs.writeFileSync(raiz + 'src/mundo/cajas_sprite.json', JSON.stringify(t));
// las de los muros, aparte (las de arriba no los llevan a propósito): `despegarDeMuros` mira con ellas qué tapa cada franja
const MURO = /muro|muralla|nichos|pared_toba|esquina|almena|reja|tapia/, tm = {};
for (const [k, m] of Object.entries(man.o)) { const id = k.split('|')[0]; if (m.plano || !MURO.test(id) || !m.f?.[0]) continue; const f = m.f[0]; tm[k] = [f[3], f[4], f[5], f[6]]; }
fs.writeFileSync(raiz + 'src/mundo/cajas_muro.json', JSON.stringify(tm));
console.log('cajas de muro', Object.keys(tm).length);
// (entrega 6) las de los adornos que EST deja afuera por el nombre pero son adorno (lo que cuelga de la pared, los santuarios, la
// puerta del cielo): `desmontarFinal` en zona.ts mira con ellas lo que quedó montado al final de la generación
const DECO = /pared|santuario|puerta_cielo|escalera_caracol/, td = {};
for (const [k, m] of Object.entries(man.o)) { const id = k.split('|')[0]; if (m.plano || !DECO.test(id) || MURO.test(id) || !m.f?.[0]) continue; const f = m.f[0]; td[k] = [f[3], f[4], f[5], f[6]]; }
fs.writeFileSync(raiz + 'src/mundo/cajas_deco.json', JSON.stringify(td));
console.log('cajas de adorno con nombre de estructura', Object.keys(td).length);
console.log('cajas', Object.keys(t).length, fs.statSync(raiz + 'src/mundo/cajas_sprite.json').size, 'bytes');
