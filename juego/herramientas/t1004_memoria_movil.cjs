// Memoria de atlas en el teléfono al entrar a zonas (tope táctil 380 MB): entra a cada zona en la vista de teléfono, pelea
// unos segundos parado en el campamento más grande y lee `memoriaAtlas()`. Uso: node juego/herramientas/t1004_memoria_movil.cjs [zonas]
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const ZS = (process.argv[2] || 'a1_paramo,a1_cata1,a5_llanuras,a7_trono').split(',');
  const { b, p, errs } = await entrar('movil', 'berserker', 30, undefined, "d.id = 'auditoria1';");
  await p.evaluate(() => { setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; j.heroe.muerto = false; } }, 50); });
  const mem = () => p.evaluate(async () => { const A = await import('/src/motor/assets.ts'); const m = A.memoriaAtlas(); return typeof m === 'number' ? Math.round(m) : m; });
  for (const z of ZS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), z);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, z, { timeout: 60000 }); await p.waitForTimeout(3000);
    const m0 = await mem();
    const n = await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; const c = {}; for (const m of j.monstruos) if (m.camp != null && !m.dueno) c[m.camp] = (c[m.camp] || 0) + 1; const k = Object.entries(c).sort((a, b) => b[1] - a[1])[0]; if (!k) return 0; const s = z.spawns[+k[0]]; h.x = s.cx + 2.5; h.y = s.cy + 0.5; h.camino = null; return k[1]; });
    await p.waitForTimeout(7000);
    const m1 = await mem(), des = await p.evaluate(() => window.__juego().monstruos.filter((m) => !m.muerto && !m.dueno && m.estado === 'perseguir').length);
    console.log(z, 'al entrar', JSON.stringify(m0), '| peleando con', n, '(despiertos ' + des + ')', JSON.stringify(m1));
  }
  console.log('errores', errs.slice(0, 3)); await b.close();
})();
