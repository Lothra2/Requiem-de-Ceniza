// La vigilia (elegir héroe guardado, `dibujarSeleccion` en ui/menus.ts y ui/vigilia.ts): entra con varios héroes con su
// equipo (arcanista con capucha, rodela y espada en llamas; berserker con hacha de escarcha; nigromante con escudo de
// calaveras y varita de sombra; templario de salida) y saca:
//   <et>_<vista>_pronto*.png   lo que se ve apenas se entra (antes de que el pintor termine)
//   <et>_<vista>_<n>_pant.png  la pantalla entera con cada héroe elegido, ya pintado
//   <et>_<vista>_<n>_tNN.png   cuadros del reposo, de la entrada y del gesto (con el reloj de la vigilia fijo, `__tSel`)
//   <et>_<vista>_hover.png     el ratón sobre una carta
//   <et>_<vista>_video/        cuadros a 25 por segundo de 6 s para armar el video (ffmpeg)
// Uso: node juego/herramientas/t1100_vigilia.cjs <etiqueta> [vistas] [cuantos héroes] (vistas: pc,pc1080,ipad,movil)
//   VIDEO=1 graba los cuadros del video (solo en la primera vista), ANTES=1 no usa los ganchos nuevos (para el antes),
//   BANDERAS=__ordenViejo el orden de pintado de antes (sin boceto) con todo lo demás de ahora, para medir contra lo mismo.
// El uid de cada pieza va fijo (el traje sale del uid): dos corridas visten igual y se pueden comparar lado a lado.
// En la nube: CHROMIUM=/opt/pw-browsers/chromium URL=http://127.0.0.1:5199/
const { chromium, devices } = require('playwright');
const fs = require('fs');
const ET = process.argv[2] || 'x';
const VS = (process.argv[3] || 'pc').split(','), NH = +(process.argv[4] || 4);
const URL = process.env.URL || 'http://127.0.0.1:5199/';
const OUT = '/tmp/requiem-pruebas/vigilia'; fs.mkdirSync(OUT, { recursive: true });
const VISTAS = {
  pc: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  pc1080: { viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 },
  ipad: { viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 },
  movil: { ...devices['iPhone 13'], viewport: { width: 844, height: 390 }, deviceScaleFactor: 3 },
};
// cada héroe: clase, nombre, nivel y su equipo (bases, con rareza y elemento vivo del arma)
const HEROES = [
  ['arcanista', 'Loquita', 34, { cabeza: ['capucha_lana', 'raro'], torso: ['vestido_luto', 'raro'], izq: ['rodela_bronce', 'raro'], arma: ['hoja_vigilia', 'unico', 'fuego'], pies: ['botas_cuero', 'magico'] }],
  ['berserker', 'Brakka', 22, { cabeza: ['casco_hierro', 'magico'], torso: ['coraza_hierro', 'raro'], arma: ['hacha_norte', 'unico', 'frio'], manos: ['guanteletes_malla', 'magico'] }],
  ['nigromante', 'Osmund', 47, { cabeza: ['calavera_ritual', 'raro'], torso: ['habito_ceremonial', 'raro'], izq: ['escudo_calavera', 'raro'], arma: ['varita_osario', 'unico', 'sombra'] }],
  ['templario', 'Aldric', 3, {}],
  ['cazadora', 'Nerea', 12, { torso: ['jubon_cuero', 'magico'], arma: ['arco_tejo_paramo', 'raro'] }],
  ['monje', 'Tomas', 18, { manos: ['vendas_pugil', 'raro'], torso: ['tunica_novicio', 'magico'] }],
];
(async () => {
  for (const [nv, vista] of VS.entries()) {
    const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
    const c = await b.newContext(VISTAS[vista]);
    const p = await c.newPage(); const errs = [];
    p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
    await p.addInitScript((ban) => { localStorage.setItem('marca.intro', '1'); for (const k of ban) { const [n, v] = k.split('='); window[n] = v === undefined ? true : +v; } }, (process.env.BANDERAS || '').split(',').filter(Boolean));
    // LUZ=1: la luz avanzada a la fuerza (en la nube el WebGL es por software y no se enciende sola)
    if (process.env.LUZ) await p.addInitScript(() => { window.__vigiliaRel = true; const f = () => { if (window.__lab) window.__lab.on = true; else setTimeout(f, 50); }; f(); });
    const aMenu = async () => { for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
    await p.goto(URL); await aMenu();
    await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 90000 });
    await p.evaluate((HS) => {
      const T = window.__T, out = [];
      for (const [clase, nombre, nivel, eq] of HS) {
        const d = T.H.nuevoHeroe(clase, nombre); d.nivel = nivel; d.acto = 1 + Math.floor(nivel / 14); d.jugado = nivel * 1500; d.muertes = nivel % 7; d.oro = nivel * 913;
        for (const [cas, [id, rar, vivo]] of Object.entries(eq)) {
          const bs = T.D.BASES.find((x) => x.id === id); if (!bs) { console.error('falta base ' + id); continue; }
          const o = T.O.crearBase(bs, Math.max(1, nivel)); o.rareza = rar; if (vivo) o.vivo = vivo; o.uid = 7000 + out.length * 16 + Object.keys(d.equipo).indexOf(cas); d.equipo[cas] = o;
        }
        out.push(d);
      }
      localStorage.setItem('marca.heroes', JSON.stringify(out)); localStorage.setItem('marca.ultimo', '0');
    }, HEROES.slice(0, NH));
    await p.reload(); await aMenu(); await p.waitForTimeout(1500);
    const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista ? window.__vista() : { W: c.width, H: c.height }; return { k: r.width / v.W, l: r.left, t: r.top, W: v.W, H: v.H }; });
    const tactil = vista === 'ipad' || vista === 'movil';
    const tap = async (x, y) => { if (tactil) await p.touchscreen.tap(L.l + x * L.k, L.t + y * L.k); else await p.mouse.click(L.l + x * L.k, L.t + y * L.k); };
    { let cc = null; for (let i = 0; i < 60 && !cc; i++) { await p.waitForTimeout(250); cc = await p.evaluate(() => window.__menuFilas && window.__menuFilas.jugar); } await p.waitForTimeout(800); await tap(cc[0], cc[1]); }
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(100); if (await p.evaluate(() => window.__estado()) === 'seleccion') break; }
    const t0 = Date.now();
    for (const ms of [150, 600, 1500, 2000]) { const w = ms - (Date.now() - t0); if (w > 0) await p.waitForTimeout(w); await p.screenshot({ path: `${OUT}/${ET}_${vista}_pronto${ms}.png` }); }
    const listo = async () => p.evaluate(() => (window.__vigilia ? window.__vigilia() : null));
    const esperar = async (seg) => { const a = Date.now(); for (let i = 0; i < seg * 2; i++) { const v = await listo(); if (v && v.listo) break; if (!v && process.env.ANTES && i > 30) break; await p.waitForTimeout(500); } return (Date.now() - a) / 1000; };
    const s0 = await esperar(150);
    console.log(vista, 'héroe 0 listo en', ((Date.now() - t0) / 1000).toFixed(1), 's', JSON.stringify(await listo()));
    const fijar = (s) => p.evaluate((s) => { window.__tSel = s; }, s);
    const fotos = async (n) => {
      await p.screenshot({ path: `${OUT}/${ET}_${vista}_${n}_pant.png` });
      if (process.env.ANTES) { for (let k = 0; k < 6; k++) { await p.waitForTimeout(180); await p.screenshot({ path: `${OUT}/${ET}_${vista}_${n}_t${String(k).padStart(2, '0')}.png` }); } return; }
      // la entrada (0 a 1,2 s después de elegirlo), el reposo y el gesto, con el reloj de la vigilia fijo
      const v = await listo(); const tc = v.tCambio; fs.writeFileSync(`${OUT}/${ET}_${vista}_${n}_info.json`, JSON.stringify(v));
      const tiempos = [0.05, 0.25, 0.5, 0.8, 1.2, 2.0, 2.4, 2.8, 3.2, 10.15, 10.35, 10.55, 10.75, 10.95];
      for (const [k, s] of tiempos.entries()) { await fijar(tc + s); await p.waitForTimeout(140); await p.screenshot({ path: `${OUT}/${ET}_${vista}_${n}_t${String(k).padStart(2, '0')}.png` }); }
      await fijar(undefined);
    };
    await fotos(0);
    if (process.env.VIDEO && nv === 0) {
      const dir = `${OUT}/${ET}_${vista}_video`; fs.mkdirSync(dir, { recursive: true });
      const v = await listo(); const base = v.tCambio;
      for (let i = 0; i < 25 * 9; i++) { await fijar(base + i / 25); await p.waitForTimeout(30); await p.screenshot({ path: `${dir}/c${String(i).padStart(4, '0')}.png` }); }
      await fijar(undefined);
    }
    // los otros héroes: clic en su carta, esperar, fotos
    for (let n = 1; n < Math.min(NH, 3); n++) {
      const pc = await p.evaluate((n) => window.__pantalla && window.__pantalla['heroe' + n], n);
      if (!pc) { console.log('sin carta', n); continue; }
      await tap(pc[0], pc[1]); const a = Date.now();
      await p.waitForTimeout(300); await p.screenshot({ path: `${OUT}/${ET}_${vista}_${n}_pronto.png` });
      await esperar(150); const vi = await listo(); console.log(vista, 'héroe', n, 'listo en', ((Date.now() - a) / 1000).toFixed(1), 's', vi ? JSON.stringify({ msBoceto: vi.msBoceto, ms1: vi.ms1, msPares: vi.msPares, msGesto: vi.msGesto, msReposo: vi.msReposo, msTodo: vi.msTodo }) : '');
      if (process.env.PEDIDOS) console.log('  pedidos', JSON.stringify(await p.evaluate(() => window.__vigiliaPedidos && window.__vigiliaPedidos().filter((q) => q.tipo === 'grande'))));
      await fotos(n);
    }
    // el ratón sobre una carta que no está elegida, y sobre «Nuevo héroe»
    if (!tactil) {
      const pc = await p.evaluate(() => window.__pantalla && window.__pantalla.heroe0); if (pc) { await p.mouse.move(L.l + pc[0] * L.k, L.t + pc[1] * L.k); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${ET}_${vista}_hover.png` }); }
      const pn = await p.evaluate(() => window.__pantalla && window.__pantalla.crear); if (pn) { await p.mouse.move(L.l + pn[0] * L.k, L.t + pn[1] * L.k); await p.waitForTimeout(500); await p.screenshot({ path: `${OUT}/${ET}_${vista}_hover_nuevo.png` }); }
    }
    // el costo por cuadro de esta pantalla (la fase de interfaz del medidor, o el cuadro entero)
    const costo = await p.evaluate(async () => {
      const ts = []; let prev = performance.now();
      await new Promise((ok) => { let n = 0; const f = () => { const a = performance.now(); ts.push(a - prev); prev = a; if (++n < 120) requestAnimationFrame(f); else ok(); }; requestAnimationFrame(f); });
      ts.sort((a, b) => a - b); const r = window.__rend ? window.__rend() : null;
      return { cuadro_med: ts[60].toFixed(1), cuadro_p95: ts[114].toFixed(1), vigilia: window.__vigilia ? window.__vigilia().ms : null, rend: r ? JSON.stringify(r).slice(0, 300) : null };
    });
    console.log(vista, 'costo', JSON.stringify(costo));
    if (errs.length) console.log('errores', errs.slice(0, 6));
    await b.close();
  }
})();
