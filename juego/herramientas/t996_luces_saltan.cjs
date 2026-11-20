// Saltos de luz (Rick, 20 nov 2026: video en una cripta llena de velas, la luz se prendía y se apagaba a saltos).
// node juego/herramientas/t996_luces_saltan.cjs [zonas]   (`VIEJO=1` el tope de 18 luces de antes, sin fundido)
// Pone al héroe en el punto de cada zona con más luces en pantalla, camina despacio y mira cuadro a cuadro las luces de
// objetos: un salto es una luz que pasa de más de 0,25 de fuerza a nada (o al revés) de un cuadro al siguiente.
const { entrar } = require('./comun_pruebas.cjs');
const ZONAS = (process.argv[2] || 'a1_cripta,a1_cata1,a1_abadia1,a1_cementerio').split(',');
(async () => {
  const { b, p, errs } = await entrar('pc', 'arcanista', 20, undefined);
  if (process.env.VIEJO) await p.evaluate(() => { window.__lucesSaltan = true; });
  const tot = { cuadros: 0, saltos: 0, maxLuces: 0 };
  for (const zona of ZONAS) {
    await p.evaluate((z) => window.__ir(z), zona); await p.waitForTimeout(3000);
    // el punto con más objetos que alumbran a 14 casillas
    await p.evaluate(async () => {
      const j = window.__juego(), z = j.zona, h = j.heroe, A = await import('/src/motor/assets.ts');
      j.monstruos.forEach((o) => { if (!o.dueno) { o.vida = 0; o.muerto = true; o.x = -99; } });
      const luz = z.objetos.filter((o) => A.objetoMeta(o.id, o.v)?.luz);
      let mejor = null, n = -1;
      for (const o of luz) { const c = luz.filter((q) => Math.hypot(q.cx - o.cx, q.cy - o.cy) < 14).length; if (c > n && z.bloq[o.cy * z.W + o.cx + 1] === 0) { n = c; mejor = o; } }
      if (mejor) { h.x = mejor.cx + 1.5; h.y = mejor.cy + 0.5; h.camino = null; }
      for (let x = 0; x < z.W; x++) for (let y = 0; y < z.H; y++) z.explorado && (z.explorado[Math.floor(y / 5) * z.tw + Math.floor(x / 5)] = 1);
    });
    await p.waitForTimeout(1500);
    const r = await p.evaluate(() => new Promise((ok) => {
      const j = window.__juego(), h = j.heroe; let antes = null, cuadros = 0, saltos = 0, max = 0; const x0 = h.x;
      const paso = () => {
        h.x = x0 + Math.sin(cuadros / 40) * 2;
        const ls = window.__luces(), ahora = new Map();
        for (const l of ls) if (l.id && l.id[0] === 'o') ahora.set(l.id, l.k);
        max = Math.max(max, ls.length);
        if (antes) { for (const [id, k] of antes) if (k > 0.25 && !ahora.has(id)) saltos++; for (const [id, k] of ahora) if (k > 0.25 && !antes.has(id)) saltos++; }
        antes = ahora; cuadros++;
        if (cuadros < 240) requestAnimationFrame(paso); else ok({ cuadros, saltos, max });
      };
      requestAnimationFrame(paso);
    }));
    console.log(zona, JSON.stringify(r));
    tot.cuadros += r.cuadros; tot.saltos += r.saltos; tot.maxLuces = Math.max(tot.maxLuces, r.max);
  }
  console.log(JSON.stringify(tot), errs.slice(0, 3));
  await b.close();
})();
