// Los íconos de las habilidades tal como los pinta el juego, en el navegador: cada tamaño en una tira (240 en orden de
// HABILIDADES) en /tmp/requiem-pruebas/iconos/<etiqueta>_<tam>.png, y el tiempo del primer horneado.
// Uso: node juego/herramientas/t970_iconos.cjs <etiqueta> [tamaños, p. ej. 46,40,26,22,34]
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const etq = process.argv[2] || 'ahora', tams = (process.argv[3] || '46,40,26,22,34,96').split(',').map(Number);
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('marca.intro', '1'); });
  await p.goto(process.env.URL || 'http://127.0.0.1:5190/');
  await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 90000 });
  const r = await p.evaluate(async (tams) => {
    const { HABILIDADES } = await import('/src/datos/clases.ts');
    const { iconoPixel } = await import('/src/ui/forja_habilidad.ts');
    const { iconoPintado } = await import('/src/ui/iconos_hab.ts');
    const out = {}, ms = {};
    for (const s of tams) {
      const t0 = performance.now(), cols = 24, filas = Math.ceil(HABILIDADES.length / cols);
      const cv = document.createElement('canvas'); cv.width = cols * s; cv.height = filas * s; const c = cv.getContext('2d'); c.imageSmoothingEnabled = true;
      HABILIDADES.forEach((h, i) => { const x = (i % cols) * s, y = Math.floor(i / cols) * s;
        // 34: el árbol de habilidades (iconoHab con marco, suavizado); 96: un medallón grande del táctil (sin marco)
        const im = s === 34 ? iconoPintado(h, s) : iconoPixel(h, s);
        c.drawImage(im, x, y, s, s); });
      ms[s] = Math.round(performance.now() - t0);
      out[s] = cv.toDataURL('image/png');
    }
    // el primer horneado de un solo ícono a 46 (otra clave: apagado)
    const t1 = performance.now(); for (const h of HABILIDADES) iconoPixel(h, 46, true); ms.apagado46 = Math.round(performance.now() - t1);
    return { out, ms, n: HABILIDADES.length };
  }, tams);
  for (const [s, url] of Object.entries(r.out)) fs.writeFileSync(`/tmp/requiem-pruebas/iconos/${etq}_${s}.png`, Buffer.from(url.split(',')[1], 'base64'));
  console.log(JSON.stringify({ ms: r.ms, n: r.n, errs }));
  await b.close();
})();
