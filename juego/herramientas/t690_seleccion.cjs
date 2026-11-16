// La pantalla de elegir clase, en PC a 1920x1080 (y en teléfono): una captura por clase.
const { chromium } = require('playwright');
(async () => {
  const clases = (process.argv[3] || 'berserker,arcanista').split(',');
  for (const [nom, vp, tactil, dpr] of [['pc', { width: 1920, height: 1080 }, false, 1], ['movil', { width: 844, height: 390 }, true, 3]]) {
    if (process.argv[2] && process.argv[2] !== nom) continue;
    const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}); const c = await b.newContext({ viewport: vp, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: dpr }); const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('marca.intro', '1'); });
    await p.goto('http://127.0.0.1:5190/'); for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; }
    await p.waitForFunction(() => window.__menuFilas && window.__menuFilas.jugar, null, { timeout: 60000 });
    const L = async () => p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top, f: window.__menuFilas, P: window.__pantalla, e: window.__estado() }; });
    const tap = async (x, y) => { const q = await L(); if (tactil) await p.touchscreen.tap(q.l + x * q.k, q.t + y * q.k); else await p.mouse.click(q.l + x * q.k, q.t + y * q.k); };
    let q = await L(); for (let i = 0; i < 3 && (await L()).e === 'menu'; i++) { await tap(q.f.jugar[0], q.f.jugar[1]); await p.waitForTimeout(1500); }
    q = await L(); console.log(nom, q.e, Object.keys(q.P || {}).slice(0, 30));
    await p.waitForTimeout(14000); await p.screenshot({ path: `/tmp/requiem-pruebas/sel_${nom}_0.png` });
    console.log(errs.slice(0, 2)); await b.close();
  }
})();
