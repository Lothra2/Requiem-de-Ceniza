// La película de cierre de un acto hecha en el motor (ui/director.ts): la graba cuadro a cuadro con el reloj del juego
// controlado (25 por segundo) a mp4 y arma una lámina con un cuadro por toma. Uso:
//   node juego/herramientas/t1400_pelicula.cjs <etiqueta> [acto] [pc|pc1080|movil]
//   LAMINA=1 solo la lámina (salta a cada toma), COSTO=1 la corre en tiempo real y mide lo que cuesta por cuadro,
//   CLASE=, NIVEL=, MUESTRA=1 sin héroe (desde el menú, con el de muestra), BANDERAS=a,b=1.
// Sale en /tmp/requiem-pruebas/cine2/<etiqueta>/.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'), { execSync } = require('child_process');
(async () => {
  const et = process.argv[2] || 'prueba', acto = +(process.argv[3] || 1), vista = process.argv[4] || 'pc';
  const DIR = `/tmp/requiem-pruebas/cine2/${et}`; fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR + '/f', { recursive: true });
  process.on('unhandledRejection', (e) => { console.log('FALLA', String(e).slice(0, 400)); process.exit(1); });
  const { b, p, errs } = await entrar(vista, process.env.CLASE || 'templario', +(process.env.NIVEL || 14), process.env.URL || 'http://127.0.0.1:5198/', `d.id = ${JSON.stringify(process.env.ID || 'cine_prueba')}`);
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const x of bs.split(',')) { const [k, v] = x.split('='); window[k] = v === undefined ? true : isNaN(+v) ? v : +v; } }, process.env.BANDERAS);
  if (process.env.MUESTRA) await p.evaluate(() => window.__salirAlMenu && window.__salirAlMenu());
  await p.evaluate((a) => window.__peli(a), acto);
  for (let i = 0; i < 240; i++) { await p.waitForTimeout(500); const e = await p.evaluate(() => window.__peliEstado()); if (e.listo) break; }
  const tomas = await p.evaluate(async (a) => { const M = await import('/src/ui/cine_acto1.ts'); return M.CINE_ACTO1.tomas.map((t) => [t.id, t.dur]); }, acto);
  const total = tomas.reduce((s, t) => s + t[1], 0);
  console.log('tomas', JSON.stringify(tomas), 'total', total);
  if (process.env.COSTO) {
    await p.waitForTimeout(total * 1000 + 1500);
    console.log('costo', JSON.stringify(await p.evaluate(() => { const c = window.__peliCosto(); const r = { n: c.n, medio: +(c.ms / c.n).toFixed(2), max: +c.max.toFixed(1), por: {} }; for (const [k, v] of Object.entries(c.por)) r.por[k] = { medio: +(v.ms / v.n).toFixed(2), max: +v.max.toFixed(1) }; return r; })));
    console.log('errores', JSON.stringify(errs.slice(0, 10))); await b.close(); return;
  }
  // calentamiento en tiempo real: cada toma un momento, para que bajen y se decodifiquen sus atlas y el pintor del héroe
  // termine (con el reloj quieto lo que falta sale como silueta blanca: es de la prueba, no del juego)
  { let t0 = 0; for (const [id, dur] of tomas) { if (process.env.SOLO && !process.env.SOLO.split(',').includes(id)) { t0 += dur; continue; } for (const k of [0.2, 0.6]) { await p.evaluate((s) => window.__cineT(s), t0 + dur * k); await p.waitForTimeout(900); } t0 += dur; } await p.evaluate(() => window.__cineT(0)); await p.waitForTimeout(300); }
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500));
  if (process.env.LAMINA) {
    let t0 = 0; const fotos = [];
    for (const [id, dur] of tomas) {
      if (process.env.SOLO && !process.env.SOLO.split(',').includes(id)) { t0 += dur; continue; }
      for (const k of [0.3, 0.62, 0.9]) {
        await p.evaluate((s) => window.__cineT(s - 0.5), t0 + dur * k);
        for (let i = 0; i < 13; i++) await p.clock.runFor(40);
        const f = `${DIR}/f/${id}_${Math.round(k * 100)}.png`; await p.screenshot({ path: f }); fotos.push(f);
      }
      t0 += dur;
    }
    fs.writeFileSync(DIR + '/fotos.json', JSON.stringify(fotos));
  } else {
    const n = Math.ceil(total * 25) + 10;
    for (let i = 0; i < n; i++) {
      await p.clock.runFor(40);
      await p.screenshot({ path: `${DIR}/f/f${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
      if (i % 100 === 0) console.log('cuadro', i, '/', n, JSON.stringify(await p.evaluate(() => [window.__estado(), window.__cineToma])));
      if (await p.evaluate(() => window.__estado()) !== 'cine') { console.log('terminó en', i); break; }
    }
    execSync(`ffmpeg -y -loglevel error -framerate 25 -i ${DIR}/f/f%05d.jpg -c:v libx264 -pix_fmt yuv420p -crf 20 ${DIR}/pelicula.mp4`);
    console.log('mp4', DIR + '/pelicula.mp4');
  }
  console.log('sonidos', JSON.stringify(await p.evaluate(() => window.__cineSonados ?? [])));
  console.log('errores', JSON.stringify(errs.slice(0, 10)));
  await b.close();
})();
