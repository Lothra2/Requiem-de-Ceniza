// La panorámica del monumento cuadro a cuadro: entra a la zona con el héroe lejos de la puerta, lo acerca y graba la subida, el
// instante arriba y la vuelta (reloj del juego controlado, 12 cuadros por segundo). Mide que el mundo espera mientras dura y que
// un clic la corta.
// Uso: CHROMIUM=... node juego/herramientas/t1313_panoramica.cjs <etiqueta> [zona] (VISTA=pc|pc1080, URL=)
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const et = process.argv[2] || 'ahora', zona = process.argv[3] || 'a7_jardin';
const DIR = `/tmp/requiem-pruebas/monumentos/panoramica/${et}`; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p, errs } = await entrar(process.env.VISTA || 'pc1080', 'berserker', 40, process.env.URL || 'http://127.0.0.1:5197/', "d.id = 'panoramica1'");
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = 3; m.y = 3; } } }, 50));
  // lejos (más de 26 celdas por el eje): no la dispara
  await p.evaluate((z) => window.__ir(z, 'arriba'), zona);
  await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zona, { timeout: 60000 });
  await p.evaluate(() => { const j = window.__juego(), s = j.zona.salidas.find((q) => q.piezas && q.piezas.length); j.heroe.x = s.cx + 30; j.heroe.y = s.cy + 30; j.heroe.destino = null; j.heroe.camino = null; j.zona.explorado.fill(1); });
  await p.waitForTimeout(3000);
  const antes = await p.evaluate(() => window.__panoT);
  // a 14 celdas: arranca
  await p.evaluate(() => { const j = window.__juego(), s = j.zona.salidas.find((q) => q.piezas && q.piezas.length); j.heroe.x = s.cx + 14; j.heroe.y = s.cy + 14; });
  const filas = []; let t0 = Date.now();
  // CLIC=1: un clic a los 0,5 s la corta (salta a la bajada)
  let corto = null;
  for (let i = 0; i < 40; i++) { const r = await p.evaluate(() => ({ t: window.__panoT, reloj: window.__juego().t })); filas.push(r); if (process.env.CLIC && i === 1 && r.t !== undefined) { const t0c = r.t; await p.mouse.click(400, 300); corto = await p.evaluate(() => window.__panoT); console.log('clic en', t0c.toFixed(2), 'queda en', corto); } await p.screenshot({ path: `${DIR}/c${String(i).padStart(2, '0')}.png` }); if (r.t === undefined && i > 4) break; await p.waitForTimeout(80); }
  const dur = (Date.now() - t0) / 1000;
  const vio = filas.filter((f) => f.t !== undefined), relojQuieto = vio.length > 1 && vio[vio.length - 1].reloj === vio[0].reloj;
  // un clic la corta (otra zona, primera vez)
  console.log('antes de acercarse', antes, '| cuadros con panorámica', vio.length, '| máx t', Math.max(...vio.map((f) => f.t)).toFixed(2), '| mundo quieto', relojQuieto, '| duró', dur.toFixed(1), 's');
  fs.writeFileSync(`${DIR}/medidas.json`, JSON.stringify(filas));
  console.log('errores', errs.slice(0, 3));
  await b.close();
})();
