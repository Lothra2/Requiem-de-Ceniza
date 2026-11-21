// La entrada de la portada a velocidad real: un video (el grabador de Playwright, pasado a mp4 de 25 por segundo) y el
// sonido del golpe y del encendido con la API de audio interceptada (cuenta osciladores y fuentes creados).
// Caso 1: la portada arranca sin ningún gesto (audio sin crear); el clic llega a mitad de la forja: el golpe tiene que
// sonar al desbloquear y el encendido a su hora. Caso 2: el audio ya está desbloqueado cuando arranca.
// Uso: node juego/herramientas/t683_portada_video.cjs <etiqueta> [pc|pc1080|movil]. Salida en /tmp/requiem-pruebas/portada2/<etiqueta>/video_<vista>/.
const { chromium } = require('playwright');
const fs = require('fs'), { execSync } = require('child_process');
const etq = process.argv[2] || 'ahora', vista = process.argv[3] || 'pc';
const VISTAS = { pc: [{ width: 1280, height: 720 }, false, 1], pc1080: [{ width: 1920, height: 1080 }, false, 1], movil: [{ width: 844, height: 390 }, true, 3] };
const dir = `/tmp/requiem-pruebas/portada2/${etq}/video_${vista}`; fs.mkdirSync(dir, { recursive: true });
const URL = process.env.URL || 'http://127.0.0.1:5197/';
async function pagina(b, video) {
  const [vp, tactil, dpr] = VISTAS[vista];
  const c = await b.newContext({ viewport: vp, hasTouch: tactil, isMobile: tactil, deviceScaleFactor: dpr, ...(video ? { recordVideo: { dir, size: vp } } : {}) });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => {
    localStorage.setItem('marca.intro', '1');
    // la API de audio interceptada: cada nodo que suena queda contado con la hora de la portada
    window.__nodos = [];
    for (const k of ['AudioContext', 'webkitAudioContext']) { const C = window[k]; if (!C) continue; for (const m of ['createOscillator', 'createBufferSource']) { const o = C.prototype[m]; C.prototype[m] = function (...a) { window.__nodos.push({ m, t: window.__portadaT ?? -1, estado: this.state }); return o.apply(this, a); }; } }
  });
  await p.goto(URL);
  await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 60000 });
  await p.waitForTimeout(6000);
  return { c, p, errs };
}
// el video del grabador va a 25 por segundo en mp4 y en cuadros sueltos (cuadros_<nombre>/)
async function aMp4(p, c, nombre) {
  const v = p.video(); await c.close(); const ruta = await v.path();
  execSync(`ffmpeg -y -loglevel error -i ${ruta} -r 25 -c:v libx264 -pix_fmt yuv420p ${dir}/${nombre}.mp4`);
  const cd = `${dir}/cuadros_${nombre}`; fs.rmSync(cd, { recursive: true, force: true }); fs.mkdirSync(cd);
  execSync(`ffmpeg -y -loglevel error -i ${dir}/${nombre}.mp4 -vf fps=25 ${cd}/%04d.png`); fs.rmSync(ruta, { force: true });
  console.log('video', `${dir}/${nombre}.mp4`, fs.readdirSync(cd).length, 'cuadros');
}
const esperarT = (p, tt) => p.waitForFunction((tt) => (window.__portadaT ?? 0) >= tt, tt, { timeout: 60000, polling: 16 });
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const [vp] = VISTAS[vista];
  // caso 1, con video: sin gesto hasta la mitad de la forja
  { const { c, p, errs } = await pagina(b, true);
    await p.evaluate(() => { window.__sonidosPortada = []; window.__nodos = []; window.__reiniciarPortada(); });
    const t0 = Date.now();
    await esperarT(p, 3.15);
    const antes = await p.evaluate(() => ({ audio: window.__audio(), sonidos: window.__sonidosPortada.slice(), nodos: window.__nodos.length }));
    await p.mouse.click(vp.width - 6, 6);
    await esperarT(p, 9);
    const despues = await p.evaluate(() => ({ audio: window.__audio(), sonidos: window.__sonidosPortada.slice(), nodos: window.__nodos.filter((n) => n.estado === 'running').map((n) => +n.t.toFixed(2)) }));
    const real = (Date.now() - t0) / 1000, tp = await p.evaluate(() => window.__portadaT);
    console.log('caso 1 (sin gesto al arrancar): antes del clic', JSON.stringify(antes), '\n  después', JSON.stringify({ audio: despues.audio, sonidos: despues.sonidos }), '\n  nodos que suenan (hora de la portada):', despues.nodos.slice(0, 12).join(' '), `\n  reloj real ${real.toFixed(1)} s para ${tp.toFixed(1)} s de portada`, errs.slice(0, 2));
    await aMp4(p, c, 'entrada_sin_gesto'); }
  // caso 2: el audio ya desbloqueado antes de que arranque la portada
  { const { c, p, errs } = await pagina(b, true);
    await p.mouse.click(vp.width - 6, 6); await p.waitForTimeout(1500);
    await p.evaluate(() => { window.__sonidosPortada = []; window.__reiniciarPortada(); });
    await esperarT(p, 9);
    const r = await p.evaluate(() => ({ audio: window.__audio(), sonidos: window.__sonidosPortada.slice() }));
    console.log('caso 2 (ya desbloqueado):', JSON.stringify(r), errs.slice(0, 2)); await aMp4(p, c, 'entrada'); }
  await b.close();
})();
