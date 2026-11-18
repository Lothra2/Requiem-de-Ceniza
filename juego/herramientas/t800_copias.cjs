// El seguro de la partida: al guardar, la partida anterior pasa a marca.copia1; desde Opciones, Partida, Copias se vuelve
// a ella y la de ese momento queda en marca.respaldo. Además fotografía el panel de Opciones (con Temblor y Destellos).
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar(process.argv[2] || 'pc', 'templario', 12);
  const oro = () => p.evaluate(() => JSON.parse(localStorage.getItem('marca.heroes'))[0].oro);
  await p.evaluate(() => { localStorage.removeItem('marca.copia1'); localStorage.removeItem('marca.copia2'); window.__juego().heroe.d.oro = 111; dispatchEvent(new Event('pagehide')); });
  const o1 = await oro();
  await p.evaluate(() => { window.__juego().heroe.d.oro = 999; dispatchEvent(new Event('pagehide')); });
  const o2 = await oro(), c1 = await p.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('marca.copia1')).h)[0].oro);
  console.log('guardado', o1, '->', o2, '| copia1 tiene', c1);
  // otra guardada al rato no pisa la copia (como mucho una cada 10 min)
  await p.evaluate(() => { window.__juego().heroe.d.oro = 555; dispatchEvent(new Event('pagehide')); });
  console.log('copia1 sigue', await p.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('marca.copia1')).h)[0].oro));
  // el panel de opciones
  await p.keyboard.press('Escape'); await p.waitForTimeout(700);
  await p.evaluate(() => { window.__juego().eventos.push({ tipo: 'opciones' }); }); await p.waitForTimeout(900);
  await p.screenshot({ path: `/tmp/requiem-pruebas/opciones_${process.argv[2] || 'pc'}.png` });
  // volver a la copia
  await p.evaluate(async () => (await import('/src/ui/traslado.ts')).abrirCopias(false)); await p.waitForTimeout(400);
  await p.screenshot({ path: `/tmp/requiem-pruebas/copias_${process.argv[2] || 'pc'}.png` });
  await Promise.all([p.waitForNavigation(), p.click('text=Volver a esta copia >> nth=0')]);
  await p.waitForTimeout(3000);
  console.log('después de volver: oro', await oro(), '| respaldo tiene', await p.evaluate(() => JSON.parse(JSON.parse(localStorage.getItem('marca.respaldo')).d['marca.heroes'])[0].oro));
  console.log(errs.slice(0, 3)); await b.close();
})();
