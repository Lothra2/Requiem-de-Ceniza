// Agregar una pieza al catálogo no tiene que mover ninguna zona (entrega 4: el azar de las casas iba adentro de un
// `REGISTRO.find` y cada pieza nueva corría todo lo que venía después). Genera las 96 zonas dos veces sin navegador, con el
// catálogo de siempre y con una pieza de más registrada antes que todas, y compara objetos, pisos y grupos.
// Uso: node juego/herramientas/t1014_catalogo_azar.mjs [semilla]
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const raiz = fileURLToPath(new URL('..', import.meta.url)), sem = +(process.argv[2] || 12345);
const huella = async (extra) => {
  const s = await createServer({ configFile: raiz + 'vite.config.ts', server: { middlewareMode: true, hmr: false, watch: null }, appType: 'custom', logLevel: 'error', optimizeDeps: { noDiscovery: true } });
  if (extra) { const O = await s.ssrLoadModule('/../src/engine/gotico/objeto.ts'); O.registrar({ id: 'zz_prueba_vacia', nombre: ['a', 'a'], tema: 'comun', variantes: ['a'], huella: [1, 1], armar: () => [] }); }
  const Z = await s.ssrLoadModule('/src/mundo/zona.ts'), A = await s.ssrLoadModule('/src/mundo/actos.ts'), out = {};
  for (const d of Object.values(A.ZONAS)) { const z = Z.generarZona(d, sem); out[d.id] = JSON.stringify([z.objetos.map((o) => [o.id, o.v, o.cx, o.cy]), z.pisos.map((p) => p?.id ?? 0), z.spawns]); }
  await s.close(); return out;
};
const a = await huella(false), b = await huella(true);
const mal = Object.keys(a).filter((k) => a[k] !== b[k]);
console.log(mal.length ? `MAL: ${mal.length} zonas cambian con una pieza de más: ${mal.join(', ')}` : `OK: ${Object.keys(a).length} zonas iguales con una pieza de más`);
process.exit(mal.length ? 1 : 0);
