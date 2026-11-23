// La película de cierre de un acto hecha en el motor (ui/director.ts): la graba cuadro a cuadro con el reloj del juego
// controlado (25 por segundo) a mp4 y arma una lámina con un cuadro por toma. Uso:
//   node juego/herramientas/t1400_pelicula.cjs <etiqueta> [acto] [pc|pc1080|movil]
//   LAMINA=1 solo la lámina (salta a cada toma), COSTO=1 la corre en tiempo real y mide lo que cuesta por cuadro,
//   CLASE=, NIVEL=, MUESTRA=1 sin héroe (desde el menú, con el de muestra), BANDERAS=a,b=1.
// Sale en /tmp/requiem-pruebas/cine2/<etiqueta>/. Las tomas que se omiten (`omitir`: una variante, el primer plano sin pintar) no
// cuentan en el tiempo de la película. DECIDE=vigdis=sacrificar pone una decisión en el héroe.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'), { execSync } = require('child_process');
// (el héroe de la prueba va vestido con piezas que caen, como en t852: el pintor lo pinta con su equipo y la película lo
//  espera; DESNUDO=1 deja el de salida)
const VESTIR = `const O = window.__T.O; let u = 7000;
  const pz = (r, f) => { for (let i = 0; i < 400; i++) { const o = O.crearObjeto(30, 'raro', f); if (O.baseDe(o).ranura === r) { o.uid = ++u; return o; } } };
  d.nivel = 30; d.fue = d.des = 200;
  d.equipo.torso = pz('torso', (b) => b.ranura === 'torso' && /placas|malla|loriga|coraza/.test(b.id)) ?? d.equipo.torso;
  d.equipo.cabeza = pz('cabeza', (b) => b.ranura === 'cabeza' && /yelmo|casco/.test(b.id)) ?? d.equipo.cabeza;
  d.equipo.manos = pz('manos', (b) => b.ranura === 'manos') ?? d.equipo.manos;
  d.equipo.pies = pz('pies', (b) => b.ranura === 'pies') ?? d.equipo.pies;`;
(async () => {
  const et = process.argv[2] || 'prueba', acto = +(process.argv[3] || 1), vista = process.argv[4] || 'pc';
  const DIR = `/tmp/requiem-pruebas/cine2/${et}`; fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR + '/f', { recursive: true });
  process.on('unhandledRejection', (e) => { console.log('FALLA', String(e).slice(0, 400)); process.exit(1); });
  const { b, p, errs } = await entrar(vista, process.env.CLASE || 'templario', +(process.env.NIVEL || 14), process.env.URL || 'http://127.0.0.1:5198/', `d.decisiones = ${JSON.stringify(Object.fromEntries((process.env.DECIDE || '').split(',').filter(Boolean).map((x) => x.split('='))))};` + `d.id = ${JSON.stringify(process.env.ID || 'cine_prueba')};` + (process.env.DESNUDO ? '' : VESTIR));
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const x of bs.split(',')) { const [k, v] = x.split('='); window[k] = v === undefined ? true : isNaN(+v) ? v : +v; } }, process.env.BANDERAS);
  if (process.env.MUESTRA) await p.evaluate(() => window.__salirAlMenu && window.__salirAlMenu());
  await p.evaluate((a) => window.__peli(a), acto);
  // la película espera al pintor del héroe y a sus zonas; la prueba además al grande de la vigilia (el primer plano)
  let t0w = Date.now();
  for (let i = 0; i < 900; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__peliLista() && window.__T.P.progresoPintura >= 1)) break; }
  console.log('película lista en', ((Date.now() - t0w) / 1000).toFixed(0), 's, pintor', await p.evaluate(() => window.__T.P.progresoPintura));
  t0w = Date.now();
  if (!process.env.SIN_ROSTRO) for (let i = 0; i < 400; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__rostroListo())) break; }
  console.log('primer plano listo:', await p.evaluate(() => window.__rostroListo()), 'en', ((Date.now() - t0w) / 1000).toFixed(0), 's');
  await p.evaluate(() => window.__cineT(0));
  const tomas = await p.evaluate(async (a) => { const M = await import('/src/ui/cine_acto' + a + '.ts'); const e = window.__peliE(); return M['CINE_ACTO' + a].tomas.filter((t) => !(t.omitir && e && t.omitir({ ...e, toma: t }))).map((t) => [t.id, t.dur]); }, acto);
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
