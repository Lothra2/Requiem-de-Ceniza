// El emblema del nivel en el HUD: capturas en PC (720 y 1080), iPad y teléfono, con niveles 1, 9, 10, 99 y la subida.
// Uso: node juego/herramientas/t840_nivel.cjs [etiqueta] [vistas]  (vistas: pc,pc1080,ipad,movil)
const { chromium, devices } = require('playwright');
const fs = require('fs');
const URL = process.env.URL || 'http://127.0.0.1:5190/';
const ET = process.argv[2] || 'x', VS = (process.argv[3] || 'pc,pc1080,ipad,movil').split(',');
const OUT = '/tmp/requiem-pruebas/nivel'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = { pc: { viewport: { width: 1280, height: 720 } }, pc1080: { viewport: { width: 1920, height: 1080 } }, ipad: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true }, movil: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 } } };
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  for (const v of VS) {
    const c = await b.newContext({ ...VISTAS[v], deviceScaleFactor: 1 }); const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    await p.addInitScript(() => { localStorage.setItem('marca.intro', '1'); });
    const aMenu = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
    await p.goto(URL); await aMenu();
    await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 90000 });
    await p.evaluate(() => { const d = window.__T.H.nuevoHeroe('templario', 'Prueba'); d.nivel = 9; d.xp = window.__T.H.xpPara ? window.__T.H.xpPara(9) : 0; d.misiones = { m1_hambre: 3, m1_campanas: 2 }; localStorage.setItem('marca.heroes', JSON.stringify([d])); });
    await p.reload(); await aMenu(); await p.waitForTimeout(4000);
    const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista ? window.__vista() : { W: c.width, H: c.height }; return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H }; });
    const tactil = v === 'ipad' || v === 'movil';
    const tap = async (x, y) => { if (tactil) await p.touchscreen.tap(L.l + x * L.k, L.t + y * L.k); else await p.mouse.click(L.l + x * L.k, L.t + y * L.k); };
    { const cc = await p.evaluate(() => window.__menuFilas && window.__menuFilas.continuar); await tap(cc[0], cc[1]); }
    for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); const e = await p.evaluate(() => window.__estado()); if (e === 'juego') break; if (e === 'entreacto') await tap(L.W / 2, L.H / 2); }
    await p.waitForTimeout(2500);
    if (!tactil) await p.mouse.move(L.l + L.W * 0.5 * L.k, L.t + L.H * 0.3 * L.k);
    const nivel = async (n, xpk = 0.6) => p.evaluate(([n, xpk]) => { const h = window.__juego().heroe, H = window.__T.H; h.d.nivel = n; if (H.xpPara) { const a = H.xpPara(n), z = H.xpPara(n + 1); h.d.xp = Math.round(a + (z - a) * xpk); } }, [n, xpk]);
    // de mayor a menor: bajar de nivel no enciende la subida, así se ven en reposo
    await nivel(100, 1); await p.waitForTimeout(4000);
    for (const n of [100, 99, 10, 9, 1]) { await nivel(n, n === 99 ? 0.95 : n === 10 ? 0.6 : 0.3); await p.waitForTimeout(700); await p.screenshot({ path: `${OUT}/${ET}_${v}_n${n}.png` }); }
    // la subida: de 41 a 42 y capturas a 0,3 s y 1,5 s
    await nivel(41, 0.98); await p.waitForTimeout(4000); await nivel(42, 0.02);
    await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${ET}_${v}_sube_a.png` });
    await p.waitForTimeout(1200); await p.screenshot({ path: `${OUT}/${ET}_${v}_sube_b.png` });
    const sello = await p.evaluate(() => window.__selloNivel || null);
    if (!tactil && sello) { await p.mouse.move(L.l + sello[0] * L.k, L.t + sello[1] * L.k); await p.waitForTimeout(600); await p.screenshot({ path: `${OUT}/${ET}_${v}_pista.png` }); }
    fs.writeFileSync(`${OUT}/${ET}_${v}.json`, JSON.stringify({ L, sello, errs }));
    console.log(v, JSON.stringify(L), 'sello', JSON.stringify(sello), 'errores', errs.length, errs.slice(0, 3).join(' | '));
    await c.close();
  }
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
