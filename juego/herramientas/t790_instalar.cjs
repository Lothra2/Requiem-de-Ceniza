// El juego instalado (PWA): con el build servido (npm run build && npx vite preview --config juego/vite.config.ts --port 4180)
// baja todo al caché, después corta la red, recarga y entra a jugar sin internet. Mide cuánto tarda en abrir con y sin red.
const { chromium } = require('playwright');
const URL = process.env.URL || 'http://127.0.0.1:4180/';
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage(), errs = [];
  c.on('response', (r) => { if (r.status() >= 400) errs.push('HTTP ' + r.status() + ' ' + r.url()); }); p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => { localStorage.setItem('marca.intro', '1'); });
  const aMenu = async () => { const t0 = Date.now(); for (let i = 0; i < 120; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => window.__estado && window.__estado()).catch(() => '') === 'menu') break; } return Date.now() - t0; };
  await p.goto(URL); console.log('menú con red (primera vez)', await aMenu(), 'ms');
  await p.evaluate(() => { const d = window.__T.H.nuevoHeroe('templario', 'Prueba'); d.nivel = 9; localStorage.setItem('marca.heroes', JSON.stringify([d])); });
  await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await aMenu();
  console.log('controlada por el sw', await p.evaluate(() => !!navigator.serviceWorker.controller));
  // el menú ofrece instalar; el panel abre
  await p.waitForTimeout(5000); console.log('renglón', await p.evaluate(() => Object.keys(window.__menuFilas || {}).join(',')));
  await p.evaluate(() => window.__abrirInstalar(false)); await p.waitForTimeout(500); await p.screenshot({ path: '/tmp/requiem-pruebas/pwa_panel.png' });
  const t0 = Date.now(); p.evaluate(() => window.__descargar());
  for (let i = 0; i < 600; i++) { await p.waitForTimeout(1000); const s = await p.evaluate(() => ({ ...window.__inst })); if (i % 10 === 0) console.log(Math.round((Date.now() - t0) / 1000) + 's', s.hechos + '/' + s.total, Math.round(s.bytesHechos / 1048576) + 'MB', s.error); if (s.listo || s.error) { console.log('fin', JSON.stringify(s)); break; } }
  await p.screenshot({ path: '/tmp/requiem-pruebas/pwa_panel_listo.png' });
  console.log('en caché', await p.evaluate(async () => (await (await caches.open('requiem-juego')).keys()).length));
  // versión nueva publicada (ACTUALIZAR=1 vuelve a armar dist): al volver, se recarga sola, baja lo que cambió y limpia lo viejo
  if (process.env.ACTUALIZAR) {
    const v0 = await p.evaluate(() => fetch('./version.json', { cache: 'no-store' }).then((r) => r.json()).then((d) => d.v));
    require('child_process').execSync('npm run build', { stdio: 'ignore' });
    await p.reload(); await aMenu(); await p.waitForTimeout(2000);
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); const s = await p.evaluate(() => ({ ...window.__inst })); if (!s.bajando && s.listo && i > 6) break; }
    const r = await p.evaluate(async () => { const l = await (await fetch('./lista.json', { cache: 'no-store' })).json(); const ks = (await (await caches.open('requiem-juego')).keys()).length; return { v: l.v, archivos: Object.keys(l.f).length, ks, inst: { ...window.__inst } }; });
    console.log('antes', v0, 'ahora', r.v, 'archivos', r.archivos, 'en caché', r.ks, 'listo', r.inst.listo, r.inst.hechos + '/' + r.inst.total);
  }
  // sin red
  await c.setOffline(true); await p.reload(); console.log('menú SIN red', await aMenu(), 'ms');
  const L = await p.evaluate(() => { const cv = document.getElementById('juego'); const r = cv.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H }; });
  await p.waitForTimeout(5000);
  const co = await p.evaluate(() => window.__menuFilas && window.__menuFilas.continuar); await p.mouse.click(L.l + co[0] * L.k, L.t + co[1] * L.k);
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); const e = await p.evaluate(() => window.__estado()); if (e === 'juego') break; if (e === 'entreacto') await p.mouse.click(640, 360); }
  await p.waitForTimeout(4000); await p.screenshot({ path: '/tmp/requiem-pruebas/pwa_sin_red.png' });
  console.log('estado sin red', await p.evaluate(() => window.__estado()), 'zona', await p.evaluate(() => window.__juego()?.zona?.id));
  console.log('errores', errs.filter((e) => !/fonts\.g/.test(e)).slice(0, 6));
  await b.close();
})();
