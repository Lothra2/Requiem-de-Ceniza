const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const vista = process.argv[2] || 'pc';
  const { b, p, errs } = await entrar(vista, 'berserker', 8);
  await p.waitForTimeout(2500);
  await p.screenshot({ path: '/tmp/requiem-pruebas/t360_pueblo.png' });
  await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(6000);
  await p.screenshot({ path: '/tmp/requiem-pruebas/t360_paramo.png' });
  const fps = await p.evaluate(() => new Promise((res) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 3000) requestAnimationFrame(f); else res(Math.round(n / 3)); }; f(); }));
  console.log('fps', fps, 'errs', errs.slice(0, 3));
  await b.close();
})();
