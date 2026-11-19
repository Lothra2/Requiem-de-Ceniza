// ¿Sale igual? Pinta el mismo cuadro del mundo (reloj quieto, mismo azar, dt = 0) con lo de antes y con lo nuevo y mide la
// diferencia punto por punto, del lienzo y (con la luz avanzada) de los lienzos de relieve y alto.
// Uso: URL=... node juego/herramientas/t891_igual.cjs [zonas] [luz 0|1]   ANTES='__sinTrozos=1;__sinLotes=1' (lo que apaga lo nuevo)
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const ZS = (process.argv[2] || 'a1_refugio,a1_paramo,a1_cripta,a1_cementerio,a2_dunas').split(','), LUZ = +(process.argv[3] || 0);
  const URL = process.env.URL || 'http://127.0.0.1:5201/', ANTES = (process.env.ANTES || '__sinTrozos').split(',');
  const args = process.env.GPU ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--enable-gpu-rasterization', '--enable-accelerated-2d-canvas'] : [];
  const b = await chromium.launch({ ...(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}), args });
  const c = await b.newContext({ viewport: { width: +(process.env.ANCHO || 1920), height: +(process.env.ALTO || 1007) }, deviceScaleFactor: 1 });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  const vista = +(process.env.VISTA || 0);
  await p.addInitScript((v) => { localStorage.setItem('marca.intro', '1'); localStorage.setItem('marca.opciones', JSON.stringify({ vista: v, luz: 1 })); }, vista);
  const aMenu = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
  await p.goto(URL); await aMenu();
  await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 60000 });
  await p.evaluate(() => { const d = window.__T.H.nuevoHeroe('arcanista', 'Prueba'); d.nivel = 20; d.misiones = { m1_hambre: 3, m1_campanas: 2 }; localStorage.setItem('marca.heroes', JSON.stringify([d])); });
  await p.reload(); await aMenu(); await p.waitForFunction(() => window.__menuFilas && window.__menuFilas.continuar, null, { timeout: 60000 }); await p.waitForTimeout(1500);
  const L = await p.evaluate(() => { const c = document.getElementById('juego'); const r = c.getBoundingClientRect(); const v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top }; });
  { const q = await p.evaluate(() => window.__menuFilas.continuar); await p.mouse.click(L.l + q[0] * L.k, L.t + q[1] * L.k); }
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => window.__estado()) === 'juego') break; }
  const salida = [];
  for (const Z of ZS) {
    await p.evaluate(([Z, LUZ]) => { window.__lab.on = !!LUZ; window.__ir(Z); }, [Z, LUZ]); await p.waitForTimeout(6000);
    if (LUZ) await p.evaluate(() => { if (!window.__forzarLuz) { window.__forzarLuz = 1; const f = () => { window.__lab.on = true; requestAnimationFrame(f); }; requestAnimationFrame(f); } });
    // sitios: el héroe en varios puntos (con la cámara en fracciones distintas)
    const sitios = await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe, r = []; let s = 7;
      const az = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
      r.push([h.x, h.y]); for (let i = 0; i < 400 && r.length < 4; i++) { const x = 4 + az() * (z.W - 8), y = 4 + az() * (z.H - 8); if (!z.bloq[Math.floor(y) * z.W + Math.floor(x)] && z.pisos[Math.floor(y / 5) * z.tw + Math.floor(x / 5)]) r.push([x, y]); } return r; });
    for (const [sx, sy] of sitios) {
      // que bajen los atlas de este sitio, en tiempo real
      await p.evaluate(([sx, sy]) => { const h = window.__juego().heroe; h.x = sx; h.y = sy; h.camino = null; h.destino = null; window.__juego().monstruos.length = 0; }, [sx, sy]);
      await p.waitForTimeout(3500);
      const r = await p.evaluate(async ([ANTES, LUZ, process_SOLO, TIEMPO, FOTO]) => {
        const j = window.__juego(); let camara = null;
        const cv = document.getElementById('juego'), g = cv.getContext('2d');
        const quieto = performance.now; let tq = performance.now(); performance.now = () => tq; const dn = Date.now; const td = Date.now(); Date.now = () => td;
        const rnd = Math.random;
        const pintar = (antes) => { for (const k of ANTES) window[k] = antes ? 1 : undefined; let s = 12345; Math.random = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
          camara = window.__pintarMundo(j, process_SOLO, antes, TIEMPO).cam; Math.random = rnd;
          const im = g.getImageData(0, 0, cv.width, cv.height).data; const lz = window.__luzCv(); const rl = LUZ && lz.relCv ? [lz.relCv, lz.altCv].map((c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data) : [];
          return [im, ...rl]; };
        pintar(false); // (calienta los trozos)
        const A = pintar(true), B1 = pintar(false), B = pintar(false);
        const dif = (a, b) => { let mx = 0, s = 0, n = 0; for (let i = 0; i < a.length; i++) { const d = Math.abs(a[i] - b[i]); if (d) { n++; s += d; if (d > mx) mx = d; } } return { max: mx, media: +(s / a.length).toFixed(4), puntos: n }; };
        const A2 = pintar(true);
        let foto = null;
        if (FOTO) { const w = cv.width, h = cv.height, k = document.createElement('canvas'); k.width = w; k.height = h; const x = k.getContext('2d'), im = x.createImageData(w, h);
          for (let i = 0; i < w * h; i++) { const d = Math.max(Math.abs(A[0][i * 4] - B[0][i * 4]), Math.abs(A[0][i * 4 + 1] - B[0][i * 4 + 1]), Math.abs(A[0][i * 4 + 2] - B[0][i * 4 + 2])); im.data[i * 4] = d ? Math.min(255, 60 + d * 8) : A[0][i * 4] >> 2; im.data[i * 4 + 1] = d ? 0 : A[0][i * 4 + 1] >> 2; im.data[i * 4 + 2] = d ? 0 : A[0][i * 4 + 2] >> 2; im.data[i * 4 + 3] = 255; }
          x.putImageData(im, 0, 0); foto = k.toDataURL('image/png'); }
        performance.now = quieto; Date.now = dn;
        return { foto, cam: camara.map((v) => v.toFixed(2)).join(','), antesAntes: dif(A[0], A2[0]), lienzo: dif(A[0], B[0]), primero: dif(A[0], B1[0]), rel: A[1] ? dif(A[1], B[1]) : null, alt: A[2] ? dif(A[2], B[2]) : null };
      }, [ANTES, LUZ, !!process.env.SOLO, +(process.env.TIEMPO || 100), !!process.env.FOTO]);
      if (r.foto) { fs.writeFileSync(`/tmp/requiem-pruebas/fps/dif_${Z}_${salida.length}.png`, Buffer.from(r.foto.split(',')[1], 'base64')); delete r.foto; }
      console.log(Z, JSON.stringify(r)); salida.push({ Z, ...r });
    }
  }
  fs.writeFileSync('/tmp/requiem-pruebas/fps/igual.json', JSON.stringify(salida, null, 1));
  console.log('errores', errs.slice(0, 4)); await b.close();
})();
