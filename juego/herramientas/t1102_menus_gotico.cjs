// La letra gótica en los menús (ui/letra_gotica.ts y ui/texto_gotico.ts): la portada con Continuar y su detalle (con un
// héroe de nombre con letras que la letra no tiene, para ver el glifo de reserva), Opciones (con una llave encendida) y la
// vigilia (elegir héroe: el título, la ficha, Jugar y Borrar, los nombres de las cartas). En el teléfono mide además los
// objetivos de toque de los botones de esas pantallas (`__toquesMenu`, en puntos CSS: cada uno debe medir 44 o más).
// Uso: node juego/herramientas/t1102_menus_gotico.cjs <etiqueta> [pc,pc1080,movil]   (URL=, BANDERAS=__letraVieja el antes)
// Capturas en /tmp/requiem-pruebas/gotico/<etiqueta>_<vista>_*.png.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const ET = process.argv[2] || 'ahora', VS = (process.argv[3] || 'pc,pc1080,movil').split(',');
const URL = process.env.URL || 'http://127.0.0.1:5198/';
const OUT = '/tmp/requiem-pruebas/gotico'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = {
  pc: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  pc1080: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  movil: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 }, deviceScaleFactor: 3 },
};
(async () => {
  let malos = 0;
  for (const vista of VS) {
    const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
    const c = await b.newContext(VISTAS[vista]); const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message));
    const ban = (process.env.BANDERAS || '').split(',').filter(Boolean);
    await p.addInitScript((ban) => { localStorage.setItem('marca.intro', '1'); for (const k of ban) window[k] = true; }, ban);
    await p.goto(URL); await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 90000 });
    await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 60000 });
    await p.evaluate(() => {
      const T = window.__T, hs = [['nigromante', 'Æsir Ødegård 龍', 47], ['arcanista', 'Loquita', 34], ['berserker', 'Bartolomeo Desangrado', 22]].map(([cl, n, nv]) => { const d = T.H.nuevoHeroe(cl, n); d.nivel = nv; d.acto = 1 + Math.floor(nv / 14); d.jugado = nv * 1500; d.muertes = nv % 7; d.oro = nv * 913; return d; });
      hs[0].dificultad = 1;
      localStorage.setItem('marca.heroes', JSON.stringify(hs)); localStorage.setItem('marca.ultimo', '0');
    });
    await p.reload(); await p.waitForFunction(() => window.__estado && window.__estado() === 'menu', null, { timeout: 90000 });
    await p.waitForTimeout(6500);
    const L = await p.evaluate(() => { const c = document.getElementById('juego'), r = c.getBoundingClientRect(); return { k: r.width / window.__vista().W, l: r.left, t: r.top }; });
    const tactil = vista === 'movil';
    const aP = (v) => [L.l + v[0] * L.k, L.t + v[1] * L.k];
    const mover = async (v) => { if (!tactil) await p.mouse.move(...aP(v)); };
    const tocar = async (v) => { const [x, y] = aP(v); if (tactil) await p.touchscreen.tap(x, y); else await p.mouse.click(x, y); };
    // la portada con Continuar encendido (su detalle)
    const fil = await p.evaluate(() => window.__menuFilas);
    if (fil && fil.continuar) { await mover(fil.continuar); await p.waitForTimeout(900); }
    await p.screenshot({ path: `${OUT}/${ET}_${vista}_portada.png` });
    // Opciones
    await tocar(fil.opciones); await p.waitForTimeout(900);
    const pa = await p.evaluate(() => window.__pantalla);
    if (pa && pa.vista1) { await mover(pa.vista1); await p.waitForTimeout(500); }
    await p.screenshot({ path: `${OUT}/${ET}_${vista}_opciones.png` });
    const tqO = await p.evaluate(() => window.__toquesMenu ? { ...window.__toquesMenu } : null);
    await tocar((await p.evaluate(() => window.__pantalla)).volver); await p.waitForTimeout(900);
    // la vigilia
    const fil2 = await p.evaluate(() => window.__menuFilas);
    await tocar(fil2.jugar);
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(150); if (await p.evaluate(() => window.__estado()) === 'seleccion') break; }
    await p.waitForTimeout(2500);
    await p.screenshot({ path: `${OUT}/${ET}_${vista}_vigilia.png` });
    const ps = await p.evaluate(() => window.__pantalla);
    if (ps && ps.jugar) { await mover(ps.jugar); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${ET}_${vista}_vigilia_jugar.png` }); }
    // la carta del héroe de nombre largo
    if (ps && ps.heroe2) { await tocar(ps.heroe2); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/${ET}_${vista}_vigilia_largo.png` }); }
    const tqV = await p.evaluate(() => window.__toquesMenu ? { ...window.__toquesMenu } : null);
    if (tactil) {
      for (const [pant, tq] of [['opciones', tqO], ['vigilia', tqV]]) {
        if (!tq) { console.log(vista, pant, 'sin __toquesMenu'); continue; }
        const chicos = Object.entries(tq).filter(([, r]) => r[0] < 43.5 || r[1] < 43.5);
        malos += chicos.length;
        console.log(vista, pant, 'toques', Object.keys(tq).length, chicos.length ? 'CHICOS: ' + JSON.stringify(chicos) : 'todos de 44 pt o más');
      }
    }
    if (errs.length) { console.log(vista, 'errores', errs.slice(0, 4)); malos++; }
    console.log(vista, 'listo');
    await b.close();
  }
  process.exit(malos ? 1 : 0);
})();
