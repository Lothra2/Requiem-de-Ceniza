// Botín en evolución en la interfaz: la ficha compara con lo puesto (▲ o ▼ en daño por segundo, defensa y vida) y la
// etiqueta del piso lleva una flechita verde solo si el objeto es mejora para el héroe y lo puede llevar ya.
//   CHROMIUM=... URL=http://127.0.0.1:5197/ node juego/herramientas/t1301_botin_ficha.cjs [pc|pc1080|movil] [clase]
// Capturas en /tmp/requiem-pruebas/botin/ficha_<vista>_*.png. Falla si la marca sale en lo que no es mejora.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const vista = process.argv[2] || 'pc', clase = process.argv[3] || 'berserker';
const SAL = '/tmp/requiem-pruebas/botin'; fs.mkdirSync(SAL, { recursive: true });
(async () => {
  const { b, p, L, errs, tactil } = await entrar(vista, clase, 24, process.env.URL || 'http://127.0.0.1:5197/', 'd.fue = 140; d.des = 60;');
  const pant = (x, y) => [L.l + x * L.k, L.t + y * L.k];
  // lo puesto: un arma mágica de nivel 20 de su tipo; en la bolsa una que mejora y una que empeora (las busca tirando)
  const r = await p.evaluate((clase) => {
    const O = window.__T.O, j = window.__juego(), d = j.heroe.d;
    j.monstruos = [];
    const fam = (bb) => bb.ranura === 'arma' && !bb.clase && (clase === 'cazadora' ? bb.familia === 'arco' : ['hacha', 'hacha_doble', 'espada', 'mandoble'].includes(bb.familia));
    d.equipo.arma = O.crearObjeto(20, 'magico', fam); window.__recalc?.();
    const buscar = (v) => { for (let i = 0; i < 400; i++) { const o = O.crearObjeto(v > 0 ? 26 : 8, v > 0 ? 'raro' : 'normal', fam); const m = window.__mejora(o); if (m && m.veredicto === v && m.puede) return o; } return null; };
    const mejor = buscar(1), peor = buscar(-1);
    d.bolsa.length = 0;
    d.bolsa.push({ o: mejor, x: 0, y: 0, b: 0 }, { o: peor, x: 3, y: 0, b: 0 });
    window.__ui.der = 'inv'; window.__ui.bolsaActiva = 0;
    const mm = window.__mejora(mejor), mp = window.__mejora(peor);
    return { puesto: d.equipo.arma.nombre[0], mejor: [mejor.nombre[0], mejor.nivel, Math.round(mm.dps * 100)], peor: [peor.nombre[0], peor.nivel, Math.round(mp.dps * 100)] };
  }, clase);
  console.log(JSON.stringify(r));
  await p.waitForTimeout(500);
  const rej = await p.evaluate(() => JSON.parse(JSON.stringify(window.__rejillas.bolsa)));
  for (const [nombre, cx] of [['mejor', 0], ['peor', 3]]) {
    const [X, Y] = pant(rej.x + (cx + 0.5) * rej.C, rej.y + 0.5 * rej.C);
    if (tactil) await p.touchscreen.tap(X, Y); else await p.mouse.move(X, Y, { steps: 4 });
    await p.waitForTimeout(450);
    await p.screenshot({ path: `${SAL}/ficha_${vista}_${nombre}.png` });
    if (tactil) { const f = await p.evaluate(() => window.__ficha && window.__ficha()); const c = f && f.find((q) => /Cerrar|Close/.test(q.txt)); if (c) await p.touchscreen.tap(...pant(c.r[0] + c.r[2] / 2, c.r[1] + c.r[3] / 2)); await p.waitForTimeout(300); }
  }
  // el piso: la que mejora, la que empeora, una de nivel alto que todavía no puede llevar y oro
  await p.evaluate(() => { window.__ui.der = null; window.__ui.izq = null; });
  const piso = await p.evaluate((clase) => {
    const O = window.__T.O, j = window.__juego(), d = j.heroe.d, h = j.heroe;
    const bolsa = d.bolsa.map((e) => e.o); d.bolsa.length = 0;
    const alto = O.crearObjeto(60, 'raro', (bb) => bb.ranura === 'arma' && (bb.req.fue ?? 0) > 200);
    j.suelo.length = 0;
    const poner = (o, dx, dy, oro = 0) => j.suelo.push({ o, oro, x: h.x + dx, y: h.y + dy, t: 5, id: Math.random() });
    poner(bolsa[0], 1.6, 0.4); poner(bolsa[1], -0.4, 1.6); if (alto) poner(alto, 1.2, -1.4); poner(null, -1.4, -0.6, 137);
    return { alto: alto && [alto.nombre[0], window.__mejora(alto)?.veredicto, window.__mejora(alto)?.puede] };
  }, clase);
  await p.waitForTimeout(700);
  const marcas = await p.evaluate(() => window.__marcasMejora);
  const [hx, hy] = await p.evaluate(() => window.__aPant(window.__juego().heroe.x, window.__juego().heroe.y));
  const [X, Y] = pant(hx - 200, hy - 170);
  await p.screenshot({ path: `${SAL}/ficha_${vista}_piso.png`, clip: { x: Math.max(0, X), y: Math.max(0, Y), width: 400 * L.k, height: 260 * L.k } });
  await p.screenshot({ path: `${SAL}/ficha_${vista}_piso_entero.png` });
  console.log(JSON.stringify({ piso, marcas }));
  const mal = marcas !== 1;
  console.log(mal ? 'FALLA: la marca de mejora salió ' + marcas + ' veces (tiene que ser 1)' : 'ok: una marca, en la que mejora', errs.slice(0, 3));
  await b.close(); process.exit(mal ? 1 : 0);
})();
