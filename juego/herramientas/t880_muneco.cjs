// El muñeco del inventario: entra con una clase y un conjunto de equipo, abre el inventario y captura el panel entero y el
// nicho ampliado (3x, a puntos enteros) en /tmp/requiem-pruebas/muneco.
// Uso: node juego/herramientas/t880_muneco.cjs <etiqueta> [vistas] [clases] [conjuntos] [rumbos]
//   vistas: pc,pc1080,ipad,movil   conjuntos: base,reliquias,raros   rumbos: cuántos giros capturar (0 = solo el de salida)
// En la nube: CHROMIUM=/opt/pw-browsers/chromium URL=http://127.0.0.1:5197/
const { chromium, devices } = require('playwright');
const fs = require('fs');
const ET = process.argv[2] || 'x';
const VS = (process.argv[3] || 'pc').split(','), CL = (process.argv[4] || 'templario').split(','), CJ = (process.argv[5] || 'base').split(','), GIROS = +(process.argv[6] || 0);
const URL = process.env.URL || 'http://127.0.0.1:5197/';
const OUT = '/tmp/requiem-pruebas/muneco'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = {
  pc: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  pc1080: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  ipad: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  movil: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 }, deviceScaleFactor: 3 },
};
const CONJ = {
  base: {},
  reliquias: { cabeza: 'yelmo_centinela_dormido', torso: 'coraza_herrero_ciego', manos: 'brazales_escriba_guerra', pies: 'botas_jinete_sin_caballo', cinturon: 'cinturon_sargento', izq: 'cometa_cruzado_nino', arma: 'media_luna_guia' },
  raros: { cabeza: '*', torso: '*', manos: '*', pies: '*', cinturon: '*', izq: '*', arma: 'diente_primer_invierno' },
  alto: { cabeza: 'corona_ascua_viva', torso: 'mortaja_ultimo_rey', manos: 'punos_verdugo_mayor', pies: 'pasos_sobre_brasa', cinturon: 'cenidor_coloso', izq: 'amanecer_santa_oria', arma: 'lapida' },
};
async function entrar(vista, clase) {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext(VISTAS[vista]);
  const p = await c.newPage(); const errs = [];
  p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  await p.addInitScript((pre) => { localStorage.setItem('marca.intro', '1'); if (pre) new Function(pre)(); }, process.env.PRE || '');
  const aMenu = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
  await p.goto(URL); await aMenu();
  await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 90000 });
  await p.evaluate((clase) => { const d = window.__T.H.nuevoHeroe(clase, 'Prueba'); d.nivel = 90; d.fue = 400; d.des = 300; d.misiones = { m1_hambre: 3, m1_campanas: 2 }; localStorage.setItem('marca.heroes', JSON.stringify([d])); localStorage.setItem('marca.ultimo', '0'); }, clase);
  await p.reload(); await aMenu(); await p.waitForTimeout(4000);
  const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista ? window.__vista() : { W: c.width, H: c.height }; return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H }; });
  const tactil = vista === 'ipad' || vista === 'movil';
  const tap = async (x, y) => { if (tactil) await p.touchscreen.tap(L.l + x * L.k, L.t + y * L.k); else await p.mouse.click(L.l + x * L.k, L.t + y * L.k); };
  { const cc = await p.evaluate(() => window.__menuFilas && window.__menuFilas.continuar); await tap(cc[0], cc[1]); }
  for (let i = 0; i < 100; i++) { await p.waitForTimeout(400); const e = await p.evaluate(() => window.__estado()); if (e === 'juego') break; if (e === 'entreacto') await tap(L.W / 2, L.H / 2); }
  return { b, p, L, errs, tactil };
}
(async () => {
  for (const vista of VS) for (const clase of CL) for (const cj of CJ) {
    const { b, p, errs } = await entrar(vista, clase);
    await p.waitForTimeout(1500);
    const mal = await p.evaluate((jg) => {
      const T = window.__T, j = window.__juego(), d = j.heroe.d, mal = [];
      for (const [cas, id] of Object.entries(jg)) {
        let o = null;
        if (id === '*') { const r = cas === 'izq' ? 'izq' : cas; for (let i = 0; i < 400 && !o; i++) { const x = T.O.crearObjeto(40 + (i % 30), 'raro'); const bs = T.O.baseDe ? T.O.baseDe(x) : null; if (x && x.tipo === 'equipo' && (bs ? bs.ranura === r : false)) o = x; } }
        else o = T.O.crearUnicoId(id, 90);
        if (!o) { mal.push(cas + ':' + id); continue; } d.equipo[cas] = o;
      }
      window.__mundo.recalc(j); return mal;
    }, CONJ[cj] || {});
    // que el pintor del mundo termine (con equipo puesto) y abrir el inventario
    for (let i = 0; i < (process.env.RAPIDO ? 0 : 150); i++) { await p.waitForTimeout(1000); if (i > 3 && (await p.evaluate(() => window.__T.P.progresoPintura)) >= 1) break; }
    await p.keyboard.press('i').catch(() => {});
    await p.evaluate(() => { if (window.__ui && !window.__ui.der) window.__ui.der = 'inv'; });
    // recién abierto (mientras se pinta: el sprite del mundo o el equipo anterior, nunca un hueco)
    await p.waitForTimeout(400);
    { const m = await p.evaluate(() => (window.__muneco ? window.__muneco() : null)); if (m && m.css) await p.screenshot({ path: `${OUT}/${ET}_${vista}_${clase}_${cj}_pronto.png`, clip: { x: m.css[0], y: m.css[1], width: m.css[2], height: m.css[3] } }); }
    const t0 = Date.now();
    // el muñeco: que termine de pintarse (si existe el gancho)
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); const m = await p.evaluate(() => window.__muneco ? window.__muneco() : null); if (!m || m.listo) break; }
    console.log('muñeco listo en', ((Date.now() - t0) / 1000).toFixed(1), 's');
    await p.waitForTimeout(1200);
    const giros = [0]; for (let g = 1; g <= GIROS; g++) giros.push(g);
    for (const g of giros) {
      if (g) { await p.evaluate(() => window.__munecoGirar && window.__munecoGirar(1)); for (let i = 0; i < 60; i++) { await p.waitForTimeout(700); const m = await p.evaluate(() => window.__muneco ? window.__muneco() : null); if (!m || m.listo) break; } await p.waitForTimeout(500); }
      const nom = `${OUT}/${ET}_${vista}_${clase}_${cj}${g ? '_g' + g : ''}`;
      if (!g) await p.screenshot({ path: nom + '_pant.png' });
      const m = await p.evaluate(() => (window.__muneco ? window.__muneco() : null));
      const panel = await p.evaluate(() => (window.__rectPanel ? window.__rectPanel('der') : null));
      if (m && m.css) await p.screenshot({ path: nom + '_nicho.png', clip: { x: m.css[0], y: m.css[1], width: m.css[2], height: m.css[3] } });
      if (panel && !g) await p.screenshot({ path: nom + '_panel.png', clip: { x: panel[0], y: panel[1], width: panel[2], height: panel[3] } });
      console.log(nom, JSON.stringify(m), 'mal:', mal.join(','));
    }
    if (errs.length) console.log('errores', errs.slice(0, 4));
    await b.close();
  }
})();
