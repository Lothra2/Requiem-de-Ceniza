// El orden de pintado: el héroe delante del portal y de un umbral de salida se ve entero (antes el portal lo tapaba).
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar('pc', 'berserker', 5);
  await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(6000);
  // delante del portal del pueblo (una casilla hacia la cámara)
  const r = await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; const e = z.entradas.portal; if (e) { h.x = e[0] + 1.3; h.y = e[1] - 0.2; h.camino = []; } return { portal: !!j.portal, e }; });
  await p.waitForTimeout(1500); await p.screenshot({ path: '/tmp/requiem-pruebas/orden_portal.png', clip: { x: 340, y: 60, width: 600, height: 440 } });
  // delante de una salida
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe, sa = z.salidas[0]; h.x = sa.cx + 1.6; h.y = sa.cy + 1.6; h.camino = []; });
  await p.waitForTimeout(1500); await p.screenshot({ path: '/tmp/requiem-pruebas/orden_salida.png', clip: { x: 340, y: 60, width: 600, height: 440 } });
  console.log(JSON.stringify(r), errs.filter((e) => !/404/.test(e)).slice(0, 3)); await b.close();
})();
