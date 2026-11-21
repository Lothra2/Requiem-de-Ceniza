// Arrastrar objetos en el inventario (Rick, 21 nov 2026: "que siempre queden para desplazar en los cuadros superiores; el
// mouse queda como en la mitad del objeto y no es fácil moverlo al baúl"). Lo que va en la mano cuelga de su casilla de
// arriba a la izquierda y cae donde está esa casilla. Para cada tamaño (1x1, 1x2, 1x3, 2x2, 2x3, 2x4): de la bolsa al
// baúl, del baúl a la bolsa y, si es equipo, a su casilla. Revisa que el dibujo de la mano coincida con la casilla que se
// resalta y que caiga ahí. En táctil arrastra con el dedo (eventos de toque de verdad): el objeto va arriba del dedo y cae
// donde se ve; un toque corto sin mover cae donde se tocó.
//   node juego/herramientas/t1100_arrastre.cjs [pc|movil|ipad] [etiqueta]   (URL=, VIEJO=1 con __arrastreViejo)
// Capturas de cerca en /tmp/requiem-pruebas/arrastre/<etiqueta>_<vista>_*.png y el resumen en <etiqueta>_<vista>.json.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const vista = process.argv[2] || 'pc', etiqueta = process.argv[3] || 'ahora';
const SAL = '/tmp/requiem-pruebas/arrastre'; fs.mkdirSync(SAL, { recursive: true });
const TAM = [[1, 1], [1, 2], [1, 3], [2, 2], [2, 3], [2, 4]];
(async () => {
  const { b, p, L, errs, tactil } = await entrar(vista, 'templario', 70, process.env.URL || 'http://127.0.0.1:5198/');
  if (process.env.VIEJO) await p.evaluate(() => { window.__arrastreViejo = true; });
  await p.evaluate(() => { const j = window.__juego(); j.monstruos = []; const u = window.__ui; u.izq = 'cofre'; u.der = 'inv'; u.cofre = []; u.cofreX = j.heroe.x; u.cofreY = j.heroe.y; u.bolsaActiva = 0; j.heroe.d.bolsa.length = 0; });
  await p.waitForTimeout(600);
  const cdp = tactil ? await p.context().newCDPSession(p) : null;
  const pant = (x, y) => [L.l + x * L.k, L.t + y * L.k];
  const toque = async (tipo, x, y) => { const [X, Y] = pant(x, y); await cdp.send('Input.dispatchTouchEvent', { type: tipo, touchPoints: tipo === 'touchEnd' ? [] : [{ x: X, y: Y, id: 1 }] }); };
  const mover = async (x, y) => { const [X, Y] = pant(x, y); await p.mouse.move(X, Y, { steps: 6 }); };
  const clic = async () => { await p.mouse.down(); await p.waitForTimeout(50); await p.mouse.up(); };
  const rej = () => p.evaluate(() => JSON.parse(JSON.stringify({ r: window.__rejillas, eq: window.__casillasEquipo })));
  const foto = async (nombre, cx, cy, w, h, dedo) => {
    const [X, Y] = pant(cx - w / 2, cy - h / 2);
    const f = `${SAL}/${etiqueta}_${vista}_${nombre}.png`;
    await p.screenshot({ path: f, clip: { x: Math.max(0, X), y: Math.max(0, Y), width: w * L.k, height: h * L.k } });
    if (dedo) fs.writeFileSync(f + '.json', JSON.stringify({ dedo: [(dedo[0] - (cx - w / 2)) * L.k, (dedo[1] - (cy - h / 2)) * L.k] }));
    return f;
  };
  const res = [];
  for (const [w, h] of TAM) {
    const tam = `${w}x${h}`;
    // un objeto de ese tamaño en la bolsa, arriba a la izquierda
    const id = await p.evaluate(([w, h]) => {
      const O = window.__T.O, j = window.__juego(); let o = O.crearObjeto(40, 'magico', (b) => b.tam[0] === w && b.tam[1] === h && b.ranura !== 'anillo' && (!b.clase || b.clase === 'templario'));
      if (!o || o.w !== w || o.h !== h) { o = O.crearObjeto(40, 'magico'); o.w = w; o.h = h; }
      o.stats.push(['reduc_req', 100]);
      j.heroe.d.bolsa.length = 0; j.heroe.d.bolsa.push({ o, x: 0, y: 0, b: 0 }); window.__ui.cofre.length = 0; window.__ui.mano = null; window.__pruebaObj = o;
      return { base: o.base, ranura: window.__T.D.BASES.find((q) => q.id === o.base)?.ranura ?? null, w: o.w, h: o.h };
    }, [w, h]);
    await p.waitForTimeout(200);
    let R = await rej(); const bo = R.r.bolsa, co = R.r.cofre;
    const celda = (g, cx, cy) => [g.x + (cx + 0.5) * g.C, g.y + (cy + 0.5) * g.C];
    const fila = { tam, base: id.base };
    if (!tactil) {
      // agarrarlo por la casilla de abajo a la derecha: igual cuelga de la de arriba a la izquierda
      await mover(...celda(bo, w - 1, h - 1)); await clic(); await p.waitForTimeout(150);
      fila.agarrado = await p.evaluate(() => window.__ui.mano === window.__pruebaObj);
      if (process.env.DEBUG) console.log(await p.evaluate(() => JSON.stringify({ mano: window.__ui.mano?.base, bolsa: window.__juego().heroe.d.bolsa.map((e) => [e.o.base, e.x, e.y, e.b, e.o.w, e.o.h]), act: window.__ui.bolsaActiva })));
      // al baúl, a la casilla (4, 2)
      const [tx, ty] = celda(co, 4, 2); await mover(tx, ty); await p.waitForTimeout(220);
      const d = await p.evaluate(() => ({ dest: window.__manoDestino, dib: window.__manoDibujo }));
      fila.baulDestino = d.dest; fila.dibujoCoincide = Math.abs(d.dib.x - (co.x + 4 * co.C)) < 1.5 && Math.abs(d.dib.y - (co.y + 2 * co.C)) < 1.5;
      fila.foto = await foto(`${tam}_baul`, co.x + (4 + w / 2) * co.C, co.y + (2 + h / 2) * co.C, Math.max(150, (w + 4) * co.C), Math.max(150, (h + 4) * co.C));
      await clic(); await p.waitForTimeout(150);
      fila.enBaul = await p.evaluate(() => { const e = window.__ui.cofre.find((q) => q.o === window.__pruebaObj); return e ? [e.x, e.y] : null; });
      // del baúl a la bolsa, a (5, 1): se agarra por la casilla de abajo
      await mover(...celda(co, 4, 2 + h - 1)); await clic(); await p.waitForTimeout(150);
      R = await rej(); const bo2 = R.r.bolsa;
      await mover(...celda(bo2, 5, 1)); await p.waitForTimeout(220);
      fila.foto2 = await foto(`${tam}_bolsa`, bo2.x + (5 + w / 2) * bo2.C, bo2.y + (1 + h / 2) * bo2.C, Math.max(150, (w + 4) * bo2.C), Math.max(150, (h + 4) * bo2.C));
      await clic(); await p.waitForTimeout(150);
      fila.enBolsa = await p.evaluate(() => { const e = window.__juego().heroe.d.bolsa.find((q) => q.o === window.__pruebaObj); return e ? [e.x, e.y] : null; });
      // al equipo, si lo es: el cursor sobre la casilla
      const cas = { arma: 'arma', izq: 'izq', cabeza: 'cabeza', torso: 'torso', manos: 'manos', pies: 'pies', cinturon: 'cinturon', amuleto: 'amuleto', talisman: 'talisman' }[id.ranura];
      if (cas && R.eq[cas]) {
        await mover(...celda(bo2, 5, 1 + h - 1)); await clic(); await p.waitForTimeout(150);
        const r = R.eq[cas]; await mover(r[0] + r[2] / 2, r[1] + r[3] / 2); await p.waitForTimeout(220);
        fila.foto3 = await foto(`${tam}_equipo`, r[0] + r[2] / 2, r[1] + r[3] / 2, 200, 200);
        await clic(); await p.waitForTimeout(200);
        fila.equipado = await p.evaluate((cas) => window.__juego().heroe.d.equipo[cas] === window.__pruebaObj, cas);
        fila.casilla = cas;
        if (!fila.equipado) fila.porQue = await p.evaluate((cas) => { const j = window.__juego(), H = window.__T.H; return { mano: window.__ui.mano?.base, puesto: j.heroe.d.equipo[cas]?.base, cumple: H.cumpleReq(j.heroe.d, j.heroe.c, window.__pruebaObj), dest: window.__manoDestino }; }, cas);
        await p.evaluate(() => { window.__ui.mano = null; });
      }
    } else {
      // táctil: el objeto en la mano (como tras "Mover" en su ficha), arrastrar el dedo al baúl y soltar
      await p.evaluate(() => { const j = window.__juego(); const d = j.heroe.d; d.bolsa.length = 0; window.__ui.mano = window.__pruebaObj; });
      await p.waitForTimeout(150);
      // el dedo va donde el objeto, alzado, deja su casilla de arriba sobre (4, 2) del baúl
      const alzE = Math.round((h - 0.5) * co.C + 30), c42 = celda(co, 4, 2), tgt = [c42[0], c42[1] + alzE], a0 = [tgt[0] - 60, tgt[1] - 20];
      await toque('touchStart', a0[0], a0[1]); await p.waitForTimeout(60);
      for (let i = 1; i <= 8; i++) { await toque('touchMove', a0[0] + ((tgt[0] - a0[0]) * i) / 8, a0[1] + ((tgt[1] - a0[1]) * i) / 8); await p.waitForTimeout(30); }
      await p.evaluate(() => { window.__manoDestino = null; }); await p.waitForTimeout(250);
      const d = await p.evaluate(() => ({ dest: window.__manoDestino, dib: window.__manoDibujo, alz: window.__ui.alzado }));
      fila.alzado = d.alz; fila.baulDestino = d.dest;
      fila.dibujoCoincide = d.dest && Math.abs(d.dib.x - (co.x + d.dest.x * co.C)) < 1.5 && Math.abs(d.dib.y - (co.y + d.dest.y * co.C)) < 1.5;
      fila.dedoLibre = d.dib.y + d.dib.h < tgt[1] - 4; // el objeto entero queda arriba del dedo
      fila.foto = await foto(`${tam}_baul_dedo`, tgt[0], tgt[1] - (d.alz || 0) / 2, Math.max(170, (w + 5) * co.C), Math.max(190, (h + 5) * co.C + (d.alz || 0)), tgt);
      await toque('touchEnd', tgt[0], tgt[1]); await p.waitForTimeout(250);
      fila.enBaul = await p.evaluate(() => { const e = window.__ui.cofre.find((q) => q.o === window.__pruebaObj); return e ? [e.x, e.y] : null; });
      fila.esperado = d.dest ? [d.dest.x, d.dest.y] : null; fila.esperado42 = !!d.dest && d.dest.x === 4 && d.dest.y === 2;
      // un toque corto sin mover: cae donde se tocó
      await p.evaluate(() => { const u = window.__ui; const i = u.cofre.findIndex((q) => q.o === window.__pruebaObj); if (i >= 0) u.cofre.splice(i, 1); u.mano = window.__pruebaObj; });
      await p.waitForTimeout(150);
      R = await rej(); const bo2 = R.r.bolsa; const t2 = celda(bo2, 5, 1); fila.t2 = t2;
      // el toque corto va dentro de la página, apoyar y levantar en la misma tarea: por CDP el levantar espera a que la
      // página atienda el apoyar, y con un cuadro lento el toque duraba más de 0,3 s (se tomaba por sostenido, y con razón)
      { const [X, Y] = pant(t2[0], t2[1]);
        await p.evaluate(([X, Y]) => { const c = document.getElementById('juego'); const t = new Touch({ identifier: 7, target: c, clientX: X, clientY: Y });
          c.dispatchEvent(new TouchEvent('touchstart', { touches: [t], targetTouches: [t], changedTouches: [t], bubbles: true, cancelable: true }));
          c.dispatchEvent(new TouchEvent('touchend', { touches: [], targetTouches: [], changedTouches: [t], bubbles: true, cancelable: true })); }, [X, Y]); }
      await p.waitForTimeout(250);
      fila.toqueCorto = await p.evaluate(() => { const e = window.__juego().heroe.d.bolsa.find((q) => q.o === window.__pruebaObj); return e ? [e.x, e.y] : null; });
      if (!fila.toqueCorto) fila.porQueCorto = await p.evaluate(() => ({ rej: JSON.stringify(window.__rejillas.bolsa), mano: window.__ui.mano === window.__pruebaObj, cofre: window.__ui.cofre.map((e) => [e.x, e.y]), suelo: window.__juego().suelo.length, ficha: !!window.__ui.ficha, der: window.__ui.der, izq: window.__ui.izq }));
      await p.evaluate(() => { window.__ui.mano = null; });
    }
    res.push(fila); console.log(JSON.stringify(fila));
  }
  const ok = res.every((f) => f.dibujoCoincide && (tactil ? f.enBaul && f.esperado && f.enBaul[0] === f.esperado[0] && f.enBaul[1] === f.esperado[1] && f.dedoLibre && f.toqueCorto && f.toqueCorto[0] === 5 && f.toqueCorto[1] === 1 : f.enBaul && f.enBaul[0] === 4 && f.enBaul[1] === 2 && f.enBolsa && f.enBolsa[0] === 5 && f.enBolsa[1] === 1 && (f.equipado === undefined || f.equipado)));
  fs.writeFileSync(`${SAL}/${etiqueta}_${vista}.json`, JSON.stringify(res, null, 1));
  console.log(ok ? 'BIEN: todo cae donde se ve' : 'MAL: algo no cayó donde se veía', errs.slice(0, 3));
  await b.close(); process.exit(ok ? 0 : 1);
})();
