// Recortes de cerca del HUD forjado en el juego: los orbes al 100, 50 y 15 % (vida y maná, dos cuadros cada uno para ver
// que el líquido se mueve), los atajos vacíos y con poder (quieto, con el ratón encima de uno vacío y eligiendo un
// poder), la placa del correr (corriendo y caminando), el recurso de la clase y los letreros de pixel.
// Uso: node juego/herramientas/t953_hud_detalle.cjs <etiqueta> [vistas]   (pc, pc1080, ipad; salida /tmp/requiem-pruebas/hud/detalle)
// Después: python3 juego/herramientas/t953_lamina.py <etiqueta> arma lamina_detalle.png.
const { chromium } = require('playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://127.0.0.1:5190/';
const ET = process.argv[2] || 'x', VS = (process.argv[3] || 'pc,pc1080,ipad').split(',');
const OUT = process.env.SALIDA || '/tmp/requiem-pruebas/hud/detalle'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = { pc: { viewport: { width: 1280, height: 720 } }, pc1080: { viewport: { width: 1920, height: 1080 } }, ipad: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true } };
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const v of VS) {
    const c = await b.newContext({ ...VISTAS[v], deviceScaleFactor: 1 }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => localStorage.setItem('marca.intro', '1'));
    const aMenu = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
    await p.goto(URL); await aMenu();
    await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 90000 });
    await p.evaluate(() => {
      const H = window.__T.H, d = H.nuevoHeroe('berserker', 'Prueba'); d.nivel = 30; d.xp = Math.round(H.xpPara(30) + (H.xpPara(31) - H.xpPara(30)) * 0.4);
      d.misiones = { m1_hambre: 3, m1_campanas: 2 }; d.habs.ejecucion = 6; d.habs.ira_jarl = 1; d.der = 'ejecucion';
      d.atajos = ['ejecucion', null, 'ira_jarl', null, null, null, null, null, null, null];
      localStorage.setItem('marca.heroes', JSON.stringify([d]));
    });
    await p.reload(); await aMenu(); await p.waitForTimeout(3000);
    const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H }; });
    const tap = async (x, y) => { if (v === 'ipad') await p.touchscreen.tap(L.l + x * L.k, L.t + y * L.k); else await p.mouse.click(L.l + x * L.k, L.t + y * L.k); };
    await p.waitForFunction(() => window.__menuFilas && window.__menuFilas.continuar, null, { timeout: 30000 });
    { const cc = await p.evaluate(() => window.__menuFilas.continuar); await tap(cc[0], cc[1]); }
    for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); const e = await p.evaluate(() => window.__estado()); if (e === 'juego') break; if (e === 'entreacto') await tap(L.W / 2, L.H / 2); }
    await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
    await p.evaluate(() => { const j = window.__juego(); for (const m of j.monstruos) { m.vida = m.vidaMax; m.dormido = true; } j.heroe.furia = 40; });
    const quieto = () => p.evaluate(() => { const h = window.__juego().heroe; h.camino = null; h.objetivo = null; });
    const R = await p.evaluate(() => (window.__hudForja ? window.__hudForja() : {}));
    const H2 = await p.evaluate(() => window.__hud().hud);
    const px = (r, m = 0) => ({ x: Math.max(0, L.l + (r[0] - m) * L.k), y: Math.max(0, L.t + (r[1] - m) * L.k), width: (r[2] + 2 * m) * L.k, height: (r[3] + 2 * m) * L.k });
    const foto = async (nombre, r, m) => { if (!r) return; const cl = px(r, m); cl.width = Math.min(cl.width, VISTAS[v].viewport.width - cl.x); cl.height = Math.min(cl.height, VISTAS[v].viewport.height - cl.y); await p.screenshot({ path: `${OUT}/${ET}_${v}_${nombre}.png`, clip: cl }); };
    if (v !== 'ipad') await p.mouse.move(L.l + L.W * 0.5 * L.k, L.t + L.H * 0.25 * L.k);
    const orbes = [R.orbeVida ?? H2.casaVida, R.orbeMana ?? H2.casaMana];
    for (const k of [1, 0.5, 0.15]) {
      await p.evaluate((k) => { const h = window.__juego().heroe; h.vida = Math.max(1, h.vidaMax * k); h.mana = h.c.manaMax * k; h.regen = 0; }, k);
      await quieto(); await p.waitForTimeout(1600);
      for (const f of [0, 1]) { await p.evaluate((k) => { const h = window.__juego().heroe; h.vida = Math.max(1, h.vidaMax * k); h.mana = h.c.manaMax * k; }, k);
        await foto(`orbeV_${Math.round(k * 100)}_${f}`, orbes[0], 14); await foto(`orbeM_${Math.round(k * 100)}_${f}`, orbes[1], 14); await p.waitForTimeout(330); }
    }
    if (R.rap0) {
      const fila = [R.rap0[0], R.rap0[1], R.rap4[0] + R.rap4[2] - R.rap0[0], R.rap0[3]], filaD = [R.rap5[0], R.rap5[1], R.rap9[0] + R.rap9[2] - R.rap5[0], R.rap5[3]];
      const caja = (a) => [a[0] - 10, a[1] - 34, a[2] + 20, a[3] + 70];
      await foto('atajos_izq', caja(fila), 0); await foto('atajos_der', caja(filaD), 0);
      await p.mouse.move(L.l + (R.rap3[0] + R.rap3[2] / 2) * L.k, L.t + (R.rap3[1] + R.rap3[3] / 2) * L.k); await p.waitForTimeout(400);
      await foto('atajos_izq_encima', caja(fila), 0);
      await p.evaluate(() => { window.__ui.der = 'elegirHab'; }); await p.mouse.move(L.l + L.W * 0.5 * L.k, L.t + L.H * 0.1 * L.k); await p.waitForTimeout(400);
      await foto('atajos_der_eligiendo', caja(filaD), 0); await p.evaluate(() => { window.__ui.der = null; });
      await foto('correr', R.correr, 4); await p.evaluate(() => { window.__juego().heroe.correr = false; }); await p.waitForTimeout(200); await foto('caminar', R.correr, 4);
      await foto('recurso', R.recurso, 4);
      for (const id of ['inv', 'menu']) { const r = R['btn_' + id]; await p.mouse.move(L.l + (r[0] + r[2] / 2) * L.k, L.t + (r[1] + r[3] / 2) * L.k); await p.waitForTimeout(300); await foto('letrero_' + id, [r[0] - 70, r[1] - 26, r[2] + 140, r[3] + 30], 0); }
      { const r = R.orbeVida; await p.mouse.move(L.l + (r[0] + r[2] / 2) * L.k, L.t + (r[1] + r[3] / 2) * L.k); await p.waitForTimeout(300); await foto('letrero_vida', [r[0] - 40, r[1] - 30, r[2] + 80, 50], 0); }
    } else if (H2.cinturon) await foto('recurso', [H2.cinturon[0] - 6, H2.cinturon[1] - 40, H2.cinturon[2] + 12, 40], 0);
    console.log(v, 'errores', errs.length, errs.slice(0, 2).join(' | '));
    await c.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
