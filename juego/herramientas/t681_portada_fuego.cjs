// La portada en varios momentos (entrada, forjado, bucle y un botón encendido), en ES y EN, con recortes del título
// y el costo por cuadro de la portada (`__portadaMed`: el fondo y el título con su fuego, en ms de JS).
// Uso: node juego/herramientas/t681_portada_fuego.cjs <etiqueta> [pc,pc1080,movil] [es,en]
// Variables: URL (otro servidor), BANDERAS=__tituloViejo (se ponen en window antes de cargar).
// Capturas en /tmp/requiem-pruebas/portada2/<etiqueta>/; la lámina la arma t681_lamina.py.
const { chromium } = require('playwright');
const fs = require('fs');
const etq = process.argv[2] || 'ahora';
const VISTAS = { pc: [{ width: 1280, height: 720 }, false, 1], pc1080: [{ width: 1920, height: 1080 }, false, 1], movil: [{ width: 844, height: 390 }, true, 3] };
const vistas = (process.argv[3] || 'pc,pc1080,movil').split(',');
const idiomas = (process.argv[4] || 'es,en').split(',');
const MOMENTOS = [['entrada', 1.2], ['golpe', 2.35], ['forja1', 2.8], ['forja2', 3.4], ['forjado', 4.3], ['enciende', 5.2], ['bucle1', 8], ['bucle2', 11.5]];
const dir = `/tmp/requiem-pruebas/portada2/${etq}`; fs.mkdirSync(dir, { recursive: true });
(async () => {
  const out = {};
  for (const v of vistas) for (const idi of idiomas) {
    const [vp, tactil, dpr] = VISTAS[v];
    const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
    const c = await b.newContext({ viewport: vp, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: dpr });
    const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
    const ban = (process.env.BANDERAS || '').split(',').filter(Boolean);
    await p.addInitScript(([idi, ban]) => { localStorage.setItem('marca.intro', '1'); localStorage.setItem('marca.opciones', JSON.stringify({ idioma: idi === 'en' ? 1 : 0 })); for (const k of ban) window[k] = true; }, [idi, ban]);
    await p.goto(process.env.URL || 'http://127.0.0.1:5197/');
    await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 60000 });
    // que bajen las hojas del título antes de medir: se recarga la portada desde cero
    await p.waitForTimeout(6000);
    await p.evaluate(() => { const m = window.__reiniciarPortada; if (m) m(); });
    const k = `${v}_${idi}`; out[k] = {};
    for (const [nom, tt] of MOMENTOS) {
      if (nom === 'forjado') await p.evaluate(() => { window.__portadaMed = { n: 0, fondo: 0, titulo: 0, peor: 0 }; });
      if (nom === 'bucle1') { const m = await p.evaluate(() => window.__portadaMed); out[k].entrada = m; await p.evaluate(() => { window.__portadaMed = { n: 0, fondo: 0, titulo: 0, peor: 0 }; }); }
      await p.waitForFunction((tt) => (window.__portadaT ?? 0) >= tt, tt, { timeout: 60000, polling: 16 });
      await p.screenshot({ path: `${dir}/${k}_${nom}.png` });
      const r = await p.evaluate(() => window.__tituloRect); if (r) out[k].rect = r;
    }
    out[k].bucle = await p.evaluate(() => window.__portadaMed);
    // un botón encendido: el ratón sobre la segunda fila
    const fil = await p.evaluate(() => window.__menuFilas);
    const fila = fil && (fil.jugar || Object.values(fil)[0]);
    if (fila && !tactil) { await p.mouse.move(fila[0], fila[1]); await p.waitForTimeout(700); await p.screenshot({ path: `${dir}/${k}_boton.png` }); }
    out[k].errores = errs.slice(0, 3);
    const f = (m) => m && m.n ? `${(m.fondo / m.n).toFixed(2)} + ${(m.titulo / m.n).toFixed(2)} ms (peor ${m.peor.toFixed(1)}, ${m.n} cuadros)` : '-';
    console.log(k, 'entrada', f(out[k].entrada), '| bucle', f(out[k].bucle), errs.length ? errs.slice(0, 2) : '');
    await b.close();
  }
  fs.writeFileSync(`${dir}/medidas.json`, JSON.stringify(out, null, 1));
})();
