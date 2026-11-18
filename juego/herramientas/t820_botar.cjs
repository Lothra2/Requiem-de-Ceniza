// Lo que el jugador bota no vuelve solo a la bolsa (Rick, 18 nov 2026). Se agarra un objeto mágico con el mouse, se suelta
// en el piso, el héroe se queda encima y no se recoge solo; uno igual que cae de un monstruo sí se recoge solo.
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, L, errs } = await entrar('pc', 'templario', 12);
  await p.evaluate(() => { const j = window.__juego(); j.monstruos = []; j.suelo.length = 0; });
  await p.evaluate(async () => { const O = window.__T.O; window.__ui.mano = O.crearObjeto(12, 'magico', (b) => b.ranura === 'anillo'); });
  const [hx, hy] = await p.evaluate(() => window.__aPant(window.__juego().heroe.x, window.__juego().heroe.y));
  await p.mouse.move(L.l + (hx + 120) * L.k, L.t + (hy - 120) * L.k); await p.waitForTimeout(200); await p.mouse.down(); await p.waitForTimeout(80); await p.mouse.up(); await p.waitForTimeout(400);
  console.log('mano tras clic', await p.evaluate(async () => !!window.__ui.mano), 'click en', hx + 30, hy - 60);
  const botado = await p.evaluate(() => window.__juego().suelo.map((s) => ({ botado: s.botado, x: s.x, y: s.y })));
  // un anillo igual que cae del cielo, al lado
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe, O = window.__T.O; j.suelo.push({ o: O.crearObjeto(12, 'magico', (b) => b.ranura === 'anillo'), oro: 0, x: h.x + 0.6, y: h.y + 0.6, t: 0, id: 77 }); h.camino = null; h.x = j.suelo[0].x; h.y = j.suelo[0].y; });
  await p.waitForTimeout(2500);
  const queda = await p.evaluate(() => window.__juego().suelo.map((s) => ({ id: s.id, botado: !!s.botado })));
  console.log('botado', JSON.stringify(botado), '| en el piso después de 2,5 s parado encima:', JSON.stringify(queda));
  // con clic sí se recoge
  const s0 = await p.evaluate(() => { const s = window.__juego().suelo.find((q) => q.botado); return s ? window.__aPant(s.x, s.y) : null; });
  if (s0) for (const dy of [-4, -10, -16, 0, -22]) { await p.mouse.move(L.l + s0[0] * L.k, L.t + (s0[1] + dy) * L.k); await p.waitForTimeout(250); await p.mouse.down(); await p.waitForTimeout(60); await p.mouse.up(); await p.waitForTimeout(1200); if (!(await p.evaluate(() => window.__juego().suelo.length))) break; }
  console.log('después del clic queda en el piso:', await p.evaluate(() => window.__juego().suelo.length), errs.slice(0, 3));
  await b.close();
})();
