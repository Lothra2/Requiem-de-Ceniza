// La cadena de rayos no cruza muros: héroe de un lado de un muro, zombi del otro (a 2 o 3 celdas), apuntando al zombi.
// node juego/herramientas/t940_rayo_muro.cjs [zona]   Imprime cuántos casos le pegó a través del muro (debe ser 0).
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar('pc', 'arcanista', 30, undefined);
  await p.evaluate((z) => window.__ir(z), process.argv[2] || 'a1_abadia1'); await p.waitForTimeout(3500);
  const lugares = await p.evaluate(() => {
    const j = window.__juego(), h = j.heroe, z = j.zona, W = z.W;
    j.monstruos.forEach((o) => { o.vida = 0; o.muerto = true; o.x = -99; }); // (Thor también: si no, muerde al blanco)
    h.vida = h.vidaMax = h.mana = h.manaMax = 1e6;
    const piso = (x, y) => x >= 0 && y >= 0 && x < W && y < z.H && z.bloq[y * W + x] === 0;
    const muro = (x, y) => z.bloq[y * W + x] === 1 || z.bloq[y * W + x] === 2;
    const out = [];
    for (let y = 2; y < z.H - 2 && out.length < 12; y += 3) for (let x = 2; x < W - 4 && out.length < 12; x += 2) for (const [dx, dy] of [[1, 0], [0, 1]])
      if (piso(x, y) && muro(x + dx, y + dy) && piso(x + 2 * dx, y + 2 * dy)) out.push([x, y, dx, dy, 1]);
    let n = 0; for (let y = 2; y < z.H - 2 && n < 5; y += 3) for (let x = 2; x < W - 4 && n < 5; x += 2) if (piso(x, y) && piso(x + 1, y) && piso(x + 2, y)) { out.push([x, y, 1, 0, 0]); n++; }
    return out;
  });
  const r = { casos: 0, cruzo: 0, libre: 0, pegoLibre: 0 };
  for (const [x, y, dx, dy, conMuro] of lugares) {
    await p.evaluate(async ([x, y, dx, dy]) => {
      const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
      h.x = x + 0.5; h.y = y + 0.5; h.d.habs.arco_voltaico = 5; h.d.habs.chispa = 5; h.recargas = {}; h.camino = null; h.vida = h.vidaMax = 1e6; h.mana = h.manaMax; h.acc = 'quieto'; h.salto = null; j.monstruos.forEach((o) => { if (o !== window.__z) { o.vida = 0; o.muerto = true; o.x = -99; } });
      const m = M.crearMonstruo(D.MONSTRUOS.zombi, 10, x + 2 * dx + 0.5, y + 2 * dy + 0.5, 0, 0); m.vida = m.vidaMax = 1e6; m.cd = 99; j.monstruos.push(m); window.__z = m; window.__traza = 1; window.__trazas = []; const Z = await import('/src/mundo/zona.ts'); window.__ll = [Z.lineaLibre(j.zona, h.x, h.y, m.x, m.y), j.zona.bloq[(y + dy) * j.zona.W + x + dx], j.zona.W];
      window.__ok = M.usarHabilidad(j, 'arco_voltaico', m.x, m.y, m, false);
    }, [x, y, dx, dy]);
    await p.waitForTimeout(1300);
    const pego = await p.evaluate(() => { const m = window.__z, g = (window.__trazas || []).some((t) => /resolverHabilidad/.test(t)); if (g) { const j = window.__juego(); window.__donde = [m.x, m.y, j.heroe.x, j.heroe.y, m.vidaMax - m.vida, window.__ll, (window.__trazas || []).filter((t) => /resolverHabilidad/.test(t)), j.efectos.map((e) => e.id).join(' '), (j.proyectiles || []).length, (j.areas || []).length]; } m.vida = 0; m.muerto = true; m.x = -99; return g; });
    if (pego && conMuro) console.log('cruzó', x, y, dx, dy, JSON.stringify(await p.evaluate(() => window.__donde)));
    if (conMuro) { r.casos++; if (pego) r.cruzo++; } else { r.libre++; if (pego) r.pegoLibre++; }
  }
  console.log(JSON.stringify(r), errs.slice(0, 3));
  await b.close();
})();
