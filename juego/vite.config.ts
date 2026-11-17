import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync, readFileSync, readdirSync } from 'node:fs';
import { createHash } from 'node:crypto';

// La versión de esta compilación (el commit y la hora). Se graba en el juego y en dist/version.json: el juego la compara
// al abrir y al volver a la pestaña, y si en el sitio hay una más nueva guarda y se recarga solo (el teléfono guardaba la vieja).
const VERSION = (() => { let c = 'local'; try { c = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* sin git */ } return c + '-' + Date.now().toString(36); })();

// El juego: app aparte que usa el motor gótico de src/engine/gotico directamente.
// Huella del código que pinta los cuerpos y el equipo puesto: si cambia, el caché de héroes pintados (IndexedDB) se
// descarta solo y cada héroe guardado se vuelve a pintar con lo nuevo. Antes había que acordarse de subir una versión a
// mano, y no se hizo: Rick siguió viendo el escudo viejo en su héroe guardado aunque el arreglo ya estaba publicado.
const PINTOR = (() => { const h = createHash('sha1'), d = fileURLToPath(new URL('../src/engine/gotico/', import.meta.url));
  for (const f of readdirSync(d).filter((f) => f.endsWith('.ts')).sort()) h.update(readFileSync(d + f));
  for (const f of ['./src/juego/visual.ts', './src/motor/pintor.ts']) { try { h.update(readFileSync(fileURLToPath(new URL(f, import.meta.url)))); } catch { /* nada */ } }
  return h.digest('hex').slice(0, 10); })();

export default defineConfig({
  define: { __VERSION__: JSON.stringify(VERSION), __PINTOR__: JSON.stringify(PINTOR) },
  plugins: [{ name: 'version', apply: 'build', closeBundle() { const d = fileURLToPath(new URL('./dist', import.meta.url)); mkdirSync(d, { recursive: true }); writeFileSync(d + '/version.json', JSON.stringify({ v: VERSION })); } }],
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: 'public',
  worker: { format: 'es' },
  server: { port: 5190, fs: { allow: ['..'] } },
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 4000, target: 'es2022' },
});
