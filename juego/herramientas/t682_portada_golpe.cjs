// El golpe de forja del título cuadro a cuadro, con el reloj de la portada fijo (`__portadaReloj`): de 0,1 s antes del
// golpe a 1,3 s después (el encendido), cada 1/30 s. Uso: node juego/herramientas/t682_portada_golpe.cjs <etiqueta> [pc|pc1080|movil] [es|en]
// Variables: URL, BANDERAS=__tituloViejo, DESDE y HASTA (segundos de la escena), PASO. Capturas en /tmp/requiem-pruebas/portada2/<etiqueta>/golpe_<vista>/.
const { chromium } = require('playwright');
const fs = require('fs');
const etq = process.argv[2] || 'ahora', vista = process.argv[3] || 'pc', idi = process.argv[4] || 'es';
const VISTAS = { pc: [{ width: 1280, height: 720 }, false, 1], pc1080: [{ width: 1920, height: 1080 }, false, 1], movil: [{ width: 844, height: 390 }, true, 3] };
const dir = `/tmp/requiem-pruebas/portada2/${etq}/golpe_${vista}_${idi}`; fs.mkdirSync(dir, { recursive: true });
(async () => {
  const [vp, tactil, dpr] = VISTAS[vista];
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: vp, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: dpr });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const ban = (process.env.BANDERAS || '').split(',').filter(Boolean);
  await p.addInitScript(([idi, ban]) => { localStorage.setItem('marca.intro', '1'); localStorage.setItem('marca.opciones', JSON.stringify({ idioma: idi === 'en' ? 1 : 0 })); for (const k of ban) window[k] = true; }, [idi, ban]);
  await p.goto(process.env.URL || 'http://127.0.0.1:5197/');
  await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 60000 });
  await p.waitForTimeout(6000);
  const desde = +(process.env.DESDE || 2.1), hasta = +(process.env.HASTA || 3.6), paso = +(process.env.PASO || 1 / 30);
  // desde atrás (sin título) para que el fuego y las chispas arranquen de cero
  await p.evaluate(() => { window.__portadaReloj = 0.5; });
  await p.waitForTimeout(300);
  let n = 0;
  for (let t = desde; t <= hasta + 1e-6; t += paso, n++) {
    await p.evaluate((t) => { window.__portadaReloj = t; }, t);
    await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
    await p.screenshot({ path: `${dir}/${String(n).padStart(3, '0')}.png` });
  }
  const r = await p.evaluate(() => window.__tituloRect);
  fs.writeFileSync(`${dir}/rect.json`, JSON.stringify(r));
  console.log(vista, idi, n, 'cuadros', errs.slice(0, 2));
  await b.close();
})();
