// Llamadas de dibujo por cuadro y por quién las hace, y tiempo de JS del mundo, por zona, a 1920x1007 en Lejos.
// Uso: URL=... node juego/herramientas/t890_llamadas.cjs [zonas] [luz 0|1]  (zonas separadas por coma; PELEA=n suma n monstruos)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const ZS = (process.argv[2] || 'a1_refugio,a1_paramo,a1_cripta,a1_cementerio,a2_dunas').split(','), LUZ = +(process.argv[3] || 0);
  const URL = process.env.URL || 'http://127.0.0.1:5201/';
  // GPU=1: Chromium con el lienzo acelerado (SwiftShader por ANGLE en el proceso de la GPU): el hilo principal graba las
// llamadas como en un PC con tarjeta, así el tiempo de JS se parece al de verdad (el pintado va aparte y lento)
const args = process.env.GPU ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] : [];
const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args });
  const c = await b.newContext({ viewport: { width: 1920, height: 1007 }, deviceScaleFactor: 1 });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((al) => { if (al) window.__atlasLienzo = 1; localStorage.setItem('marca.intro', '1'); localStorage.setItem('marca.opciones', JSON.stringify({ vista: +(window.__vistaPrueba ?? 0), luz: 1 })); }, !!process.env.ATLAS_LIENZO);
  const aMenu = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
  await p.goto(URL); await aMenu();
  await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 60000 });
  await p.evaluate(() => { const d = window.__T.H.nuevoHeroe('arcanista', 'Prueba'); d.nivel = 20; d.misiones = { m1_hambre: 3, m1_campanas: 2 }; localStorage.setItem('marca.heroes', JSON.stringify([d])); });
  await p.reload(); await aMenu(); await p.waitForFunction(() => window.__menuFilas && window.__menuFilas.continuar, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top }; });
  { const q = await p.evaluate(() => window.__menuFilas.continuar); await p.mouse.click(L.l + q[0] * L.k, L.t + q[1] * L.k); }
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => window.__estado()) === 'juego') break; }
  await p.evaluate(() => {
    const P = CanvasRenderingContext2D.prototype; const W = window.__cuenta = { on: false, n: 0, pant: 0, por: new Map(), met: new Map(), k: 0 };
    const main = document.getElementById('juego');
    for (const m of ['drawImage', 'fillRect', 'fill', 'stroke', 'clip', 'putImageData', 'fillText', 'strokeRect', 'clearRect', 'getImageData']) {
      const o = P[m]; P[m] = function (...a) { if (W.on) { W.n++; if (this.canvas === main) W.pant++; W.met.set(m, (W.met.get(m) || 0) + 1);
        if ((W.k++ & 7) === 0) { const st = new Error().stack.split('\n').slice(2).map((l) => { const x = /at (\S+) .*\/src\/(.*?)(\?[^:]*)?:(\d+):\d+/.exec(l); return x ? `${x[1]} ${x[2]}:${x[4]}` : null; }).filter(Boolean);
          let i = 0; while (i < st.length - 1 && /assets\.ts|luz_gpu\.ts:(3\d|4\d|5\d)|dibujarTenido|dibujarSilueta/.test(st[i])) i++; const k = st.slice(i, i + 1).join(' < ') + ` [${m}]`; W.por.set(k, (W.por.get(k) || 0) + 8); } }
        return o.apply(this, a); };
    }
  });
  const res = {}, fuente = {};
  for (const Z of ZS) {
    await p.evaluate(([Z, LUZ]) => { window.__lab.on = !!LUZ; window.__ir(Z); }, [Z, LUZ]); await p.waitForTimeout(+(process.env.ESPERA || 7000));
    if (process.env.PELEA) await p.evaluate(async (N) => { const j = window.__juego(), h = j.heroe, M = window.__mundo; h.vida = h.vidaMax = 1e7; const D = await import('/src/datos/monstruos.ts'); const ids = ['zombi', 'esqueleto', 'necrofago', 'bandido', 'cultista', 'chacal'].filter((i) => D.MONSTRUOS[i]);
      for (let i = 0; i < N; i++) { const a = (i / N) * 6.28, r = 3 + (i % 3) * 1.4, m = M.crearMonstruo(D.MONSTRUOS[ids[i % ids.length]], 10, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, 0, 0); m.vida = m.vidaMax = 1e6; m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); } }, +process.env.PELEA);
    await p.waitForTimeout(2500);
    if (LUZ) await p.evaluate(() => { if (!window.__forzarLuz) { window.__forzarLuz = 1; const f = () => { window.__lab.on = true; requestAnimationFrame(f); }; requestAnimationFrame(f); } });
    else await p.evaluate(() => { window.__lab.on = false; });
    // 1) tiempo de JS sin envoltorio (medidor de fases en modo liviano)
    const t = await p.evaluate(() => new Promise((ok) => { const R = window.__rendFases; R.ligero(true); setTimeout(() => { const f = R.leer(); R.ligero(false); ok(f); }, 3000); }));
    // 2) llamadas
    const n = await p.evaluate(() => new Promise((ok) => { const W = window.__cuenta; W.n = 0; W.pant = 0; W.por.clear(); W.met.clear(); let cu = 0; W.on = true; const f = () => { if (++cu < 60) requestAnimationFrame(f); else { W.on = false; ok({ porCuadro: Math.round(W.n / 60), pantalla: Math.round(W.pant / 60), met: Object.fromEntries([...W.met].map(([k, v]) => [k, Math.round(v / 60)])), por: [...W.por].sort((a, b) => b[1] - a[1]).slice(0, 22).map(([k, v]) => [Math.round(v / 60), k]) }); } }; requestAnimationFrame(f); }));
    if (process.env.CARAS) { await p.keyboard.press('F3'); await p.waitForTimeout(4000); const r = await p.evaluate(() => window.__rend()); await p.keyboard.press('F3'); console.log('  F3', JSON.stringify({ fases: r.fases, llamadas: r.llamadas, caras: r.caras.map(([k, v]) => [k, +v.toFixed(2)]) })); }
    await p.screenshot({ path: `/tmp/requiem-pruebas/fps/z_${Z}_${LUZ}.png` });
    res[Z] = { t, ...n };
    console.log('==', Z, 'luz', LUZ, JSON.stringify(t)); console.log('  llamadas/cuadro', n.porCuadro, 'pantalla', n.pantalla, JSON.stringify(n.met)); for (const [v, k] of n.por) { const x = /^\S+ (\S+):(\d+)/.exec(k); let lin = ''; if (x) { fuente[x[1]] ??= await (await fetch(URL + 'src/' + x[1])).text().catch(() => ''); lin = (fuente[x[1]].split('\n')[+x[2] - 1] || '').trim().slice(0, 70); } console.log('   ', String(v).padStart(5), k.padEnd(52), lin); }
  }
  fs.writeFileSync(`/tmp/requiem-pruebas/fps/llamadas_${LUZ}${process.env.ET ? '_' + process.env.ET : ''}.json`, JSON.stringify(res, null, 1));
  console.log('errores', errs.slice(0, 4)); await b.close();
})();
