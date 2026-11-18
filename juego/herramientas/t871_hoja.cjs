// Revisa la hoja que guarda el pintor para un arma: dibuja la línea de la hoja (magenta), el tramo vivo (verde) y la
// máscara, sin nada vivo encima. Uso: node t871_hoja.cjs <clase> <fam> [acc] [dir]
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const [clase, fam, acc = 'quieto', dir = 'se'] = process.argv.slice(2);
  const { b, p, errs } = await entrar('pc', clase || 'templario', 60, undefined, 'd.fue = 500; d.des = 500;');
  await p.evaluate(() => { const j = window.__juego(); (j.heroe.d.thor ??= {}).descanso = 1e9; j.monstruos.length = 0; });
  await p.evaluate((fam) => { const T = window.__T, j = window.__juego(), d = j.heroe.d; const bs = T.O.BASE_POR_ID.get(`ars_${fam}_1`); d.equipo.arma = T.O.crearBase(bs, 60); if (bs.dosManos || /arco|baculo/.test(bs.familia)) d.equipo.izq = null; window.__mundo.recalc(j); }, fam);
  for (let i = 0; i < 200; i++) { await p.waitForTimeout(1000); if (i > 6 && (await p.evaluate(() => window.__T.P.progresoPintura)) >= 1) break; }
  await p.waitForTimeout(2000);
  const r = await p.evaluate(([acc, dir]) => { const P = window.__T.P, q = P.cuadrosVivos(acc, dir); return q ? q.map((c) => c.hoja) : null; }, [acc, dir]);
  console.log(fam, acc, dir, JSON.stringify(r && r.slice(0, 4)));
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.acc = 'quieto'; h.dir = 'se'; window.__verHoja = true; });
  await p.waitForTimeout(800);
  const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x, h.y); });
  await p.screenshot({ path: `/tmp/requiem-pruebas/armas/hoja_${clase}_${fam}.png`, clip: { x: x - 80, y: y - 115, width: 160, height: 160 } });
  console.log('errs', errs.slice(0, 3)); await b.close();
})();
