// Luz avanzada: fotos con la luz prendida y apagada en varias zonas, costo del pase por cuadro y cuadros por segundo.
// Uso: URL=http://127.0.0.1:5191/ node juego/herramientas/t840_luz.cjs [clase]  (capturas en /tmp/requiem-pruebas/luz)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'); const D = '/tmp/requiem-pruebas/luz'; fs.mkdirSync(D, { recursive: true });
(async () => {
  const clase = process.argv[2] || 'templario';
  const { b, p, errs } = await entrar('pc', clase, 12);
  const zonas = ['a1_refugio', 'a1_cripta', 'a1_paramo', 'a2_dunas', 'a1_cementerio'];
  for (const z of zonas) {
    await p.evaluate((z) => window.__ir(z), z); await p.waitForTimeout(9000);
    const gpu = await p.evaluate(() => !!window.__lab);
    for (const on of [true, false]) {
      await p.evaluate((on) => { window.__lab.on = on; }, on); await p.waitForTimeout(1200);
      const fps = await p.evaluate(() => new Promise((ok) => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else ok(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
      const ms = await p.evaluate(() => window.__lab.ms);
      await p.screenshot({ path: `${D}/${z}_${on ? 'luz' : 'clasica'}.png` });
      console.log(z, on ? 'avanzada' : 'clasica', 'fps', fps.toFixed(1), on ? 'pase ms ' + ms.toFixed(2) : '', gpu ? '' : 'SIN GPU');
    }
    await p.evaluate(() => { window.__lab.on = true; });
  }
  const rel404 = errs.filter((e) => /_[nh]\.webp/.test(e));
  console.log('errores', errs.length, 'relieve faltante', rel404.length); errs.slice(0, 8).forEach((e) => console.log('  ', e));
  await b.close();
})();
