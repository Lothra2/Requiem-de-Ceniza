import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';

// La versión de esta compilación (el commit y la hora). Se graba en el juego y en dist/version.json: el juego la compara
// al abrir y al volver a la pestaña, y si en el sitio hay una más nueva guarda y se recarga solo (el teléfono guardaba la vieja).
const VERSION = (() => { let c = 'local'; try { c = execSync('git rev-parse --short HEAD').toString().trim(); } catch { /* sin git */ } return c + '-' + Date.now().toString(36); })();

// El juego: app aparte que usa el motor gótico de src/engine/gotico directamente.
export default defineConfig({
  define: { __VERSION__: JSON.stringify(VERSION) },
  plugins: [{ name: 'version', apply: 'build', closeBundle() { const d = fileURLToPath(new URL('./dist', import.meta.url)); mkdirSync(d, { recursive: true }); writeFileSync(d + '/version.json', JSON.stringify({ v: VERSION })); } }],
  root: fileURLToPath(new URL('.', import.meta.url)),
  base: './',
  publicDir: 'public',
  worker: { format: 'es' },
  server: { port: 5190, fs: { allow: ['..'] } },
  build: { outDir: 'dist', emptyOutDir: true, assetsInlineLimit: 0, chunkSizeWarningLimit: 4000, target: 'es2022' },
});
