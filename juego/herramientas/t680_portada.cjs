// La portada en PC, iPad y teléfono (apaisado y vertical), ya con el título puesto.
const { chromium } = require('playwright');
(async () => {
  for (const [nom, vp, tactil, dpr] of [['pc', { width: 1920, height: 1080 }, false, 1], ['ipad', { width: 1194, height: 834 }, true, 2], ['movil', { width: 844, height: 390 }, true, 3], ['vertical', { width: 390, height: 844 }, true, 3]]) {
    if (process.argv[2] && process.argv[2] !== nom) continue;
    const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}); const c = await b.newContext({ viewport: vp, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: dpr }); const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('marca.intro', '1'); });
    await p.goto(process.env.URL || 'http://127.0.0.1:5190/'); for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; }
    await p.waitForTimeout(9000); await p.screenshot({ path: `/tmp/requiem-pruebas/portada_${nom}.png` });
    console.log(nom, errs.slice(0, 2)); await b.close();
  }
})();
