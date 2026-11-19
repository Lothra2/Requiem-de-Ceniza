// El muñeco del inventario se gira y no estorba: arrastrar (ratón o dedo), flechas del teclado y botoncitos; las casillas
// del equipo siguen respondiendo; con algo en la mano no se gira; al cambiar el casco se ve el anterior mientras se pinta.
// Uso: node juego/herramientas/t881_muneco_giro.cjs [pc|movil]   (capturas en /tmp/requiem-pruebas/muneco)
const { entrar } = require('./comun_pruebas.cjs');
const OUT = '/tmp/requiem-pruebas/muneco';
const vista = process.argv[2] || 'pc';
(async () => {
  const { b, p, L, tap, errs, tactil } = await entrar(vista, 'templario', 60, undefined, 'd.fue = 400; d.des = 300;');
  const fallos = [];
  const ok = (c, m) => { console.log((c ? 'ok   ' : 'FALLA ') + m); if (!c) fallos.push(m); };
  await p.evaluate(() => { const T = window.__T, j = window.__juego(), d = j.heroe.d; d.equipo.cabeza = T.O.crearUnicoId('yelmo_centinela_dormido', 60); d.equipo.izq = T.O.crearUnicoId('cometa_cruzado_nino', 60); window.__mundo.recalc(j); window.__ui.der = 'inv'; });
  const mu = () => p.evaluate(() => window.__muneco());
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if ((await mu()).listo) break; }
  let m = await mu(); ok(m.listo && !m.mundo, 'el muñeco se pintó (' + JSON.stringify(m) + ')');
  // de pantalla CSS a puntos lógicos del lienzo
  const aLog = (cx, cy) => [(cx - L.l) / L.k, (cy - L.t) / L.k];
  const [cx, cy] = aLog(m.css[0] + m.css[2] / 2, m.css[1] + m.css[3] / 2);
  const d0 = m.dir;
  // arrastrar a la derecha
  if (tactil) {
    const s = await p.context().newCDPSession(p), pt = (x, y) => [{ x: L.l + x * L.k, y: L.t + y * L.k }];
    await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(cx - 20, cy) });
    for (let i = 1; i <= 8; i++) { await s.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(cx - 20 + i * 6, cy) }); await p.waitForTimeout(60); }
    await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  } else {
    await p.mouse.move(L.l + (cx - 20) * L.k, L.t + cy * L.k); await p.mouse.down();
    for (let i = 1; i <= 8; i++) { await p.mouse.move(L.l + (cx - 20 + i * 6) * L.k, L.t + cy * L.k); await p.waitForTimeout(60); }
    await p.mouse.up();
  }
  await p.waitForTimeout(300); m = await mu(); ok(m.dir !== d0, `arrastrar gira (${d0} -> ${m.dir})`);
  const estaba = await p.evaluate(() => window.__juego().heroe.x + ',' + window.__juego().heroe.y);
  // flechas del teclado
  if (!tactil) { const a = m.dir; await p.keyboard.press('ArrowLeft'); await p.waitForTimeout(200); m = await mu(); ok(m.dir !== a, `flecha izquierda gira (${a} -> ${m.dir})`); }
  // los botoncitos: abajo a la izquierda y a la derecha del nicho
  { const a = (await mu()).dir; const [bx, by] = aLog(m.css[0] + 6, m.css[1] + m.css[3] - 6); await tap(bx, by); await p.waitForTimeout(300); m = await mu(); ok(m.dir !== a, `botón de girar (${a} -> ${m.dir})`); }
  // girar todos los rumbos y capturar cada uno (esperando que se pinte)
  for (let g = 0; g < 8; g++) {
    await p.evaluate(() => window.__munecoGirar(1));
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(400); if ((await mu()).listo) break; }
    m = await mu(); await p.screenshot({ path: `${OUT}/giro_${vista}_${g}_${m.dir}.png`, clip: { x: m.css[0], y: m.css[1], width: m.css[2], height: m.css[3] } });
  }
  ok((await p.evaluate(() => window.__juego().heroe.x + ',' + window.__juego().heroe.y)) === estaba, 'girar no hizo caminar al héroe');
  // la casilla del casco sigue respondiendo: clic la toma a la mano
  const casco = await p.evaluate(() => { const r = window.__rectPanel('der'); return r; });
  const kP = casco[2] / 320, [hx, hy] = aLog(casco[0] + 82 * kP, casco[1] + 60 * kP);
  await tap(hx, hy); await p.waitForTimeout(300);
  let mano = await p.evaluate(() => window.__ui.mano && window.__ui.mano.base);
  ok(!!mano, 'clic en la casilla del casco lo toma (' + mano + ')');
  // con algo en la mano no se gira
  { const a = (await mu()).dir; await tap(cx, cy); await p.waitForTimeout(300); ok((await mu()).dir === a, 'con algo en la mano el clic en el nicho no gira'); }
  await tap(hx, hy); await p.waitForTimeout(300);
  ok(!(await p.evaluate(() => window.__ui.mano)), 'el casco volvió a su casilla');
  // cambio de casco: mientras se pinta se ve el anterior
  await p.evaluate(() => { const T = window.__T, j = window.__juego(); j.heroe.d.equipo.cabeza = T.O.crearUnicoId('corona_ascua_viva', 60); window.__mundo.recalc(j); });
  await p.waitForTimeout(250); m = await mu();
  await p.screenshot({ path: `${OUT}/cambio_${vista}_durante.png`, clip: { x: m.css[0], y: m.css[1], width: m.css[2], height: m.css[3] } });
  ok(m.viejo || m.listo, 'al cambiar el casco se ve el anterior (viejo=' + m.viejo + ', listo=' + m.listo + ')');
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if ((await mu()).listo) break; }
  m = await mu(); ok(m.listo && !m.viejo, 'y después el nuevo');
  await p.screenshot({ path: `${OUT}/cambio_${vista}_despues.png`, clip: { x: m.css[0], y: m.css[1], width: m.css[2], height: m.css[3] } });
  if (errs.length) console.log('errores', errs.slice(0, 4));
  console.log(fallos.length ? `${fallos.length} fallas` : 'todo bien');
  await b.close();
})();
