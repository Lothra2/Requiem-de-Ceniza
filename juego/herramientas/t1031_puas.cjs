// La losa de púas de reojo (entrega 6): pone al héroe a unas 5 celdas de una losa en la pelea de siempre (pantalla de 720,
// Lejos, la luz de la zona), saca 30 cuadros seguidos (uno cada 0,1 s) y guarda un recorte ampliado de la losa por cuadro y
// la pantalla entera en el cuadro más brillante. BANDERAS=__puasViejas el antes.
//   CHROMIUM=... node juego/herramientas/t1031_puas.cjs <etiqueta> [zonas]    (/tmp/requiem-pruebas/e6/puas/<etiqueta>)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const et = process.argv[2] || 'ahora', ZONAS = (process.argv[3] || 'a1_cripta,a2_tumbas1,a4_fortaleza1').split(',');
const DIR = `/tmp/requiem-pruebas/e6/puas/${et}`; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p, errs } = await entrar('pc', 'berserker', 30, process.env.URL || 'http://127.0.0.1:5196/', "d.id = 'auditoria1'");
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const k of bs.split(',')) window[k] = true; }, process.env.BANDERAS);
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = -50; m.y = -50; } } }, 50));
  for (const zid of ZONAS) {
    try { await p.evaluate((z) => window.__ir(z, 'arriba'), zid); await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); } catch { console.log(zid, 'no entra'); continue; }
    await p.waitForTimeout(1500);
    const s = await p.evaluate(async () => {
      const j = window.__juego(), z = j.zona, o = z.objetos.find((q) => q.id === 'trampa_puas'); if (!o) return null;
      z.explorado.fill(1); const Z = await import('/src/mundo/zona.ts'); const c = Z.libreCerca(z, o.cx + 5, o.cy - 2);
      j.heroe.x = c[0] + 0.5; j.heroe.y = c[1] + 0.5; j.heroe.camino = null; j.heroe.destino = null; return { cx: o.cx, cy: o.cy };
    });
    if (!s) { console.log(zid, 'sin púas'); continue; }
    await p.waitForTimeout(1800);
    const [x, y] = await p.evaluate((s) => window.__aPant(s.cx + 0.5, s.cy + 0.5), s);
    for (let i = 0; i < 30; i++) {
      await p.screenshot({ path: `${DIR}/${zid}_${String(i).padStart(2, '0')}.png`, clip: { x: Math.round(x) - 40, y: Math.round(y) - 26, width: 80, height: 48 } });
      if (i === 0) await p.screenshot({ path: `${DIR}/${zid}_pantalla.png` });
      await p.waitForTimeout(70);
    }
    console.log(zid, 'losa en', Math.round(x), Math.round(y));
  }
  console.log('errores', errs.slice(0, 3)); await b.close();
})();
