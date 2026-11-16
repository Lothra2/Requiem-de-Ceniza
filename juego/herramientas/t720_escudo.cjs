// El escudo puesto es el del ícono: se equipa cada escudo y se captura el inventario (ícono y muñeco) y el héroe en el mundo.
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  for (const id of (process.argv[2] || 'escudo_redondo,paves,egida_alba').split(',')) {
    const { b, p, errs } = await entrar('pc', process.argv[3] || 'templario', 12);
    await p.waitForTimeout(2000);
    const ok = await p.evaluate((id) => { const T = window.__T, j = window.__juego(), d = j.heroe.d; const base = T.D.BASES.find((x) => x.id === id); if (!base) return 'sin base'; const o = T.O.crearBase(base, 12); const cas = 'izq'; d.equipo[cas] = o; window.__mundo.recalc && window.__mundo.recalc(j); return cas; }, id);
    for (let i = 0; i < 90; i++) { await p.waitForTimeout(1000); if (i > 8 && (await p.evaluate(() => window.__T.P.progresoPintura)) >= 1) break; }
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `/tmp/requiem-pruebas/escudo_${id}_mundo.png`, clip: { x: 520, y: 180, width: 240, height: 240 } });
    await p.keyboard.press('i'); await p.waitForTimeout(2500);
    await p.screenshot({ path: `/tmp/requiem-pruebas/escudo_${id}_inv.png`, clip: { x: 960, y: 80, width: 320, height: 300 } });
    console.log(id, ok, errs.filter((e) => !/404/.test(e)).slice(0, 2)); await b.close();
  }
})();
