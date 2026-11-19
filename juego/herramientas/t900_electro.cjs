// El rayo sobre la silueta de cada cuerpo (render/electro.ts): jefes, bestias, humanoides y el héroe, quietos en fila,
// con capturas recortadas de cada uno en varios momentos.
// ESTADO=frio, veneno, aturdido, miedo, maldicion, marca (o varios con +) en vez del rayo.
// node juego/herramientas/t900_electro.cjs [ids separados por coma] [etiqueta]   (capturas en /tmp/requiem-pruebas/electro)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const ids = (process.argv[2] || 'madre_cienaga,rey_escarcha,ogro,lobo,zombi').split(','), tag = process.argv[3] || 'x';
  fs.mkdirSync('/tmp/requiem-pruebas/electro', { recursive: true });
  const { b, p, errs } = await entrar('pc', 'arcanista', 30);
  await p.evaluate((e) => { window.__est = e; }, process.env.ESTADO || '');
  await p.evaluate((z) => window.__ir(z), process.env.ZONA || 'a1_pozo'); await p.waitForTimeout(3500);
  // en la arena del jefe (campo abierto)
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe, s = j.zona.spawns.find((q) => q.tipo === 'jefe'); if (s) { h.x = s.cx - 4; h.y = s.cy + 4; } h.camino = null; });
  await p.waitForTimeout(1500);
  await p.evaluate(async (ids) => {
    window.__sinLluvia = true;
    const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
    h.vida = h.vidaMax = 1e6;
    j.monstruos.forEach((o) => { o.vida = 0; o.muerto = true; o.tMuerto = 9999; o.x = -999; });
    // en fila de izquierda a derecha en pantalla, sujetos en su lugar en cada cuadro (y Thor lejos)
    const pos = ids.map((id, i) => [h.x + 1.5 + i * 3.6, h.y - 1.5 - i * 3.6]);
    window.__fila = ids.map((id, i) => { const m = M.crearMonstruo(D.MONSTRUOS[id], 30, pos[i][0], pos[i][1], 0, 0); m.vida = m.vidaMax = 1e9; j.monstruos.push(m); return m; });
    const hx = h.x, hy = h.y;
    const sujetar = () => { window.__fila.forEach((m, i) => { m.x = pos[i][0]; m.y = pos[i][1]; m.camino = null; m.cd = 9; }); h.x = hx; h.y = hy; h.camino = null; for (const o of j.monstruos) if (o.dueno) { o.x = hx - 30; o.y = hy - 30; } requestAnimationFrame(sujetar); };
    sujetar();
  }, ids);
  await p.waitForTimeout(2500);
  for (let k = 0; k < 6; k++) {
    const caps = await p.evaluate(() => {
      const j = window.__juego(), h = j.heroe;
      const est = window.__est;
      for (const m of [h, ...window.__fila]) {
        if (!est) m.electroT = j.t;
        else for (const e of est.split('+')) { if (e === 'maldicion') m.maldicion = m.maldicion ?? { res: 0, dur: 99 }; else m[e] = 9; }
      }
      return [h, ...window.__fila].map((e) => { const [x, y] = window.__aPant(e.x, e.y); return { id: e.def?.id ?? 'heroe', x, y, jefe: !!e.def?.jefe }; });
    });
    await p.waitForTimeout(90 + k * 41);
    const caps2 = await p.evaluate(() => [window.__juego().heroe, ...window.__fila].map((e) => { const [x, y] = window.__aPant(e.x, e.y); return { id: e.def?.id ?? 'heroe', x, y, jefe: !!e.def?.jefe }; }));
    const full = `/tmp/requiem-pruebas/electro/${tag}_full_${k}.png`;
    await p.screenshot({ path: full });
    fs.writeFileSync(full.replace('.png', '.json'), JSON.stringify(caps2));
  }
  console.log(errs.slice(0, 3));
  await b.close();
})();
