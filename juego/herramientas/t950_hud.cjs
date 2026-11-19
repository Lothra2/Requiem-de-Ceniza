// El HUD forjado (ui/hud_forja.ts) en escenas del juego, en cada aparato, con el de antes al lado.
// Uso: node juego/herramientas/t950_hud.cjs <etiqueta> [vistas]   (el forjado es el de por omisión; HUD=0 saca la barra de siempre con window.__hudNuevo = false)
//   vistas: pc (1280x720), pc1080 (1920x1080 nativo), ultra (2560x1080), ipad (1024x768 táctil), movil (844x390),
//   pctactil (1280x720 con pantalla táctil y ratón: el panel de PC que también se toca).
// Por vista: _normal (vida llena, ratón en el mundo), _baja (vida al 12 %, latido, un poder en recarga y el ratón sobre
// el orbe de maná), _clic (prueba de clics: cinturón, botones y poderes) y un json con los rectángulos del HUD en
// puntos de pantalla para recortar (t950_lamina.py). Capturas en /tmp/requiem-pruebas/hud.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://127.0.0.1:5190/';
const ET = process.argv[2] || 'x', VS = (process.argv[3] || 'pc,pc1080,ultra,ipad,movil,pctactil').split(',');
const NUEVO = process.env.HUD !== '0';
const OUT = '/tmp/requiem-pruebas/hud'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = {
  pc: { viewport: { width: 1280, height: 720 } }, pc1080: { viewport: { width: 1920, height: 1080 } }, ultra: { viewport: { width: 2560, height: 1080 } },
  ipad: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }, movil: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } },
  pctactil: { viewport: { width: 1280, height: 720 }, hasTouch: true },
};
const TACTIL = { ipad: 1, movil: 1, pctactil: 1 };
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const resumen = {};
  for (const v of VS) {
    const c = await b.newContext({ ...VISTAS[v], deviceScaleFactor: VISTAS[v].deviceScaleFactor ?? 1 }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript(([nuevo, pcTactil]) => {
      localStorage.setItem('marca.intro', '1'); if (!nuevo) window.__hudNuevo = false;
      // un portátil con pantalla táctil: el puntero principal es el ratón (fino) y además se puede tocar
      if (pcTactil) { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => (/pointer:\s*coarse/.test(q) ? { ...mm(q), matches: false, media: q } : /any-pointer:\s*fine/.test(q) ? { ...mm(q), matches: true, media: q } : mm(q)); }
    }, [NUEVO, v === 'pctactil']);
    const aMenu = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
    await p.goto(URL); await aMenu();
    await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 90000 });
    await p.evaluate(() => {
      const H = window.__T.H, d = H.nuevoHeroe('berserker', 'Prueba'); d.nivel = 30; d.xp = Math.round(H.xpPara(30) + (H.xpPara(31) - H.xpPara(30)) * 0.62);
      d.misiones = { m1_hambre: 3, m1_campanas: 2 };
      d.habs.ejecucion = 6; d.habs.ira_jarl = 1; d.habs.torbellino = 4; d.der = 'ejecucion'; d.atajos = ['ejecucion', 'ira_jarl', 'torbellino', null, null, null, null, null, null, null];
      localStorage.setItem('marca.heroes', JSON.stringify([d]));
    });
    await p.reload(); await aMenu(); await p.waitForTimeout(4000);
    const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H, cw: v.cw, ch: v.ch }; });
    const tactil = !!TACTIL[v];
    const tap = async (x, y) => { if (tactil) await p.touchscreen.tap(L.l + x * L.k, L.t + y * L.k); else await p.mouse.click(L.l + x * L.k, L.t + y * L.k); };
    { const cc = await p.evaluate(() => window.__menuFilas && window.__menuFilas.continuar); await tap(cc[0], cc[1]); }
    for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); const e = await p.evaluate(() => window.__estado()); if (e === 'juego') break; if (e === 'entreacto') await tap(L.W / 2, L.H / 2); }
    await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
    // el cinturón lleno de a poco (4, 3, 2 y 1 en cada columna) y la furia a media
    await p.evaluate(() => {
      const j = window.__juego(), h = j.heroe, H = window.__T.H;
      const t = ['vida', 'vida', 'mana', 'rejuv'];
      h.d.tiposCinturon = [...t]; h.d.cinturon = t.map((q, i) => { const o = window.__T.O ? window.__T.O.crearPocion(q, 1) : null; if (o) o.cantidad = 4 - i; return o ?? h.d.cinturon[i]; });
      h.furia = 64; h.vida = h.vidaMax; h.mana = h.c.manaMax * 0.7;
      for (const m of j.monstruos) { m.vida = m.vidaMax; m.dormido = true; }
    });
    const quieto = async () => p.evaluate(() => { const h = window.__juego().heroe; h.camino = null; h.objetivo = null; });
    if (!tactil) await p.mouse.move(L.l + L.W * 0.62 * L.k, L.t + L.H * 0.32 * L.k);
    await quieto(); await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/${ET}_${v}_normal.png` });
    // vida baja: el latido, un poder en recarga (ira del jarl 14 s de 22) y el ratón sobre el orbe de maná
    await p.evaluate(() => { const h = window.__juego().heroe; h.vida = h.vidaMax * 0.12; h.mana = h.c.manaMax * 0.38; h.recargas.ira_jarl = 14; h.recargas.ejecucion = 1.1; });
    const rects = await p.evaluate(() => (window.__hudForja ? window.__hudForja() : null));
    if (!tactil && rects && rects.orbeMana) { const r = rects.orbeMana; await p.mouse.move(L.l + (r[0] + r[2] / 2) * L.k, L.t + (r[1] + r[3] / 2) * L.k); }
    await quieto(); await p.waitForTimeout(500);
    await p.screenshot({ path: `${OUT}/${ET}_${v}_baja.png` });
    await p.waitForTimeout(260);
    await p.screenshot({ path: `${OUT}/${ET}_${v}_baja2.png` });
    // el destello del poder que vuelve a estar listo (la ira del jarl termina su recarga)
    await p.evaluate(() => { const h = window.__juego().heroe; h.recargas.ira_jarl = 0.12; });
    await p.waitForTimeout(260);
    await p.screenshot({ path: `${OUT}/${ET}_${v}_listo.png` });
    const hudT = await p.evaluate(() => window.__hud().hud);
    const toques = await p.evaluate(() => (window.__toques || []).map((q) => ({ id: q.id, r: q.r })));
    const clic = {};
    // el cinturón táctil: tocar cada columna bebe una
    if (tactil && hudT.cinturon && !(rects && rects.panel)) {
      const [cx, cy, cw, ch] = hudT.cinturon;
      await p.evaluate(() => { const h = window.__juego().heroe; h.vida = h.vidaMax * 0.5; });
      for (let i = 0; i < 4; i++) {
        const antes = await p.evaluate((i) => { const o = window.__juego().heroe.d.cinturon[i]; return o ? (o.cantidad ?? 1) : 0; }, i);
        await tap(cx + (i + 0.5) * cw / 4, cy + ch / 2); await p.waitForTimeout(250);
        const despues = await p.evaluate((i) => { const o = window.__juego().heroe.d.cinturon[i]; return o ? (o.cantidad ?? 1) : 0; }, i);
        clic['poc' + i] = `${antes}->${despues}`;
      }
    }
    // la cámara: dónde cae el héroe en la pantalla (en puntos de pantalla)
    const heroe = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x, h.y); });
    // clics de verdad: cada casilla del cinturón (beber), la bolsa, el poder derecho (abre la elección) y el menú
    if (rects) {
      const centro = (r) => [r[0] + r[2] / 2, r[1] + r[3] / 2];
      await p.evaluate(() => { const h = window.__juego().heroe; h.vida = h.vidaMax * 0.5; });
      for (let i = 0; i < 4; i++) {
        const r = rects['poc' + i]; if (!r) continue;
        const antes = await p.evaluate((i) => { const o = window.__juego().heroe.d.cinturon[i]; return o ? (o.cantidad ?? 1) : 0; }, i);
        if (tactil) await tap(...centro(r)); else { await p.mouse.move(L.l + centro(r)[0] * L.k, L.t + centro(r)[1] * L.k); await p.mouse.click(L.l + centro(r)[0] * L.k, L.t + centro(r)[1] * L.k, { button: 'right' }); }
        await p.waitForTimeout(250);
        const despues = await p.evaluate((i) => { const o = window.__juego().heroe.d.cinturon[i]; return o ? (o.cantidad ?? 1) : 0; }, i);
        clic['poc' + i] = `${antes}->${despues}`;
      }
      if (!tactil) { await p.keyboard.press('2'); await p.waitForTimeout(200); clic.tecla2 = await p.evaluate(() => { const o = window.__juego().heroe.d.cinturon[1]; return o ? (o.cantidad ?? 1) : 0; }); }
      for (const [id, panel] of [['inv', 'der'], ['pers', 'izq']]) {
        const r = rects['btn_' + id]; if (!r) continue;
        await tap(...centro(r)); await p.waitForTimeout(350);
        clic['btn_' + id] = await p.evaluate((lado) => window.__ui[lado], panel);
        await p.screenshot({ path: `${OUT}/${ET}_${v}_panel_${id}.png` });
        await tap(...centro(r)); await p.waitForTimeout(250);
        await p.evaluate(() => { window.__ui.izq = null; window.__ui.der = null; });
      }
      if (rects.habDer && !tactil) { await tap(...centro(rects.habDer)); await p.waitForTimeout(350); clic.habDer = await p.evaluate(() => window.__ui.der); await p.screenshot({ path: `${OUT}/${ET}_${v}_elegir.png` }); await p.evaluate(() => { window.__ui.der = null; }); }
      // clic en el mundo justo encima del panel: el héroe camina (el panel no se come el clic de arriba)
      if (rects.panel && !tactil) {
        const yy = rects.panel[1] - 40;
        await p.evaluate(() => { const h = window.__juego().heroe; h.camino = null; h.objetivo = null; });
        await p.mouse.click(L.l + (rects.panel[0] + rects.panel[2] * 0.3) * L.k, L.t + yy * L.k); await p.waitForTimeout(150);
        clic.mundoSobrePanel = await p.evaluate(() => !!window.__juego().heroe.camino || !!window.__juego().heroe.objetivo);
      }
    }
    // el costo de la interfaz por cuadro (el medidor F3, sin capturas encima)
    let rend = null;
    { await p.evaluate(() => window.__rendFases.ligero(true)); await p.waitForTimeout(2500); rend = await p.evaluate(() => { const f = window.__rendFases.leer(); return { interfaz: f.interfaz, mundo: f.mundo, marcoMs: window.__hudForjaMs }; }); await p.evaluate(() => window.__rendFases.ligero(false)); }
    // los toques del táctil: cada uno de 44 pt o más y ninguno encima de otro
    const pt = L.k, chicos = [], cruces = [];
    for (const q of toques) if (q.r[2] * pt < 43.5 || q.r[3] * pt < 43.5) chicos.push(q.id);
    const redondo = (id) => /^(golpe|poder|hab\d|agresivo)$/.test(id);
    for (let a = 0; a < toques.length; a++) for (let b2 = a + 1; b2 < toques.length; b2++) { const A = toques[a].r, B = toques[b2].r;
      if (redondo(toques[a].id) && redondo(toques[b2].id)) { if (Math.hypot(A[0] + A[2] / 2 - B[0] - B[2] / 2, A[1] + A[3] / 2 - B[1] - B[3] / 2) < (A[2] + B[2]) / 2 - 1) cruces.push(toques[a].id + '/' + toques[b2].id); continue; }
      if (A[0] < B[0] + B[2] - 1 && A[0] + A[2] - 1 > B[0] && A[1] < B[1] + B[3] - 1 && A[1] + A[3] - 1 > B[1]) cruces.push(toques[a].id + '/' + toques[b2].id); }
    if (toques.length) clic.toques = `${toques.length} toques, chicos: ${chicos.join(',') || 'ninguno'}, cruces: ${cruces.join(',') || 'ninguno'}`;
    resumen[v] = { L, heroe, rects, hudT, toques, clic, rend, errs: errs.slice(0, 5) };
    fs.writeFileSync(`${OUT}/${ET}_${v}.json`, JSON.stringify(resumen[v]));
    console.log(v, 'lienzo', `${L.W}x${L.H}`, `(${L.cw}x${L.ch})`, 'héroe', heroe.map(Math.round).join(','), 'clics', JSON.stringify(clic), 'errores', errs.length, errs.slice(0, 2).join(' | '));
    await c.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
