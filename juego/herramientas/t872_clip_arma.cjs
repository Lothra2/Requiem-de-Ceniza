// Clips cortos de un arma viva (reloj controlado, 25 cuadros por segundo): quieto, caminando y tres golpes a un zombi.
// Uso: URL=... node juego/herramientas/t872_clip_arma.cjs <clase> <fam> <elem,elem,...> [etiqueta]
// Deja /tmp/requiem-pruebas/armas/clips/<etiqueta>_<clase>_<fam>_<elem>.mp4 (recorte de 240x200 ampliado al doble).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'), { execSync } = require('child_process');
(async () => {
  const [clase = 'templario', fam = 'espada', elems = 'fuego', etq = 'clip'] = process.argv.slice(2);
  const DIR = '/tmp/requiem-pruebas/armas/clips'; fs.mkdirSync(DIR, { recursive: true });
  process.on('unhandledRejection', (e) => { console.log('FALLA', String(e).slice(0, 300)); process.exit(1); });
  const { b, p, errs } = await entrar('pc', clase, 60, undefined, 'd.fue = 500; d.des = 500; d.ene = 300;');
  await p.evaluate((z) => window.__ir(z), process.env.ZONA || 'a1_cata1'); await p.waitForTimeout(6000);
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; (h.d.thor ??= {}).descanso = 1e9; let mejor = null, md = 0;
    for (let y = 8; y < z.H - 8; y++) for (let x = 8; x < z.W - 8; x++) { let libre = true; for (let dy = -3; dy <= 3 && libre; dy++) for (let dx = -3; dx <= 3; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue; const d = Math.hypot(x - h.x, y - h.y); if (!mejor || d < md) { md = d; mejor = [x, y]; } }
    if (mejor) { h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; } window.__sitio = [h.x, h.y]; j.monstruos.length = 0; h.vida = h.vidaMax = 1e7; });
  await p.evaluate((fam) => { const T = window.__T, j = window.__juego(), d = j.heroe.d, bs = T.O.BASE_POR_ID.get(`ars_${fam}_1`); d.equipo.arma = T.O.crearBase(bs, 60); if (bs.dosManos || /arco|ballesta|baculo/.test(bs.familia)) d.equipo.izq = null; window.__mundo.recalc(j); }, fam);
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500));
  const correr = async (ms) => { for (let i = 0; i < ms / 40; i++) await p.clock.runFor(40); };
  for (let i = 0; i < 400; i++) { await correr(400); await p.waitForTimeout(300); if (i > 3 && (await p.evaluate(() => { const P = window.__T.P, j = window.__juego(); return P.progresoPintura >= 1 && !!j.firma && (j.firma === 'base' || !!P.cuadrosDeFirma(j.firma, 'atacar', 'se')); }))) break; }
  for (const el of elems.split(',')) {
    await p.evaluate((el) => { const j = window.__juego(), o = j.heroe.d.equipo.arma; o.vivo = el; window.__mundo.recalc(j); const h = j.heroe; h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.acc = 'quieto'; h.dir = 'se'; h.camino = null; j.monstruos.length = 0; }, el);
    await correr(1500);
    const d = `${DIR}/f_${etq}_${el}`; fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d);
    const guion = {
      20: () => { const j = window.__juego(), h = j.heroe; window.__mundo.caminarA(j, h.x + 2.5, h.y + 1); },
      55: async () => { const j = window.__juego(), h = j.heroe, D = await import('/src/datos/monstruos.ts'); h.camino = null; h.destino = null; h.acc = 'quieto'; const m = window.__mundo.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.1, h.y + 0.1, 0, 0); m.vida = m.vidaMax = 1e6; m.estado = 'dormido'; j.monstruos.push(m); window.__m = m; },
    };
    for (const f of [60, 80, 100]) guion[f] = () => { const j = window.__juego(), h = j.heroe; h.recargas = {}; window.__mundo.usarHabilidad(j, 'ataque', window.__m.x, window.__m.y, window.__m, false); };
    for (let i = 0; i < 125; i++) {
      if (guion[i]) await p.evaluate(guion[i]);
      await p.clock.runFor(40);
      await p.evaluate(() => { window.__juego().numeros.length = 0; });
      const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x, h.y); });
      await p.screenshot({ path: `${d}/f${String(i).padStart(4, '0')}.png`, clip: { x: Math.round(x - 110), y: Math.round(y - 130), width: 240, height: 200 } });
    }
    const out = `${DIR}/${etq}_${clase}_${fam}_${el}.mp4`;
    try { execSync(`ffmpeg -y -loglevel error -framerate 25 -i ${d}/f%04d.png -vf scale=480:400:flags=neighbor -c:v libx264 -pix_fmt yuv420p -crf 16 ${out}`); } catch (e) { console.log('ffmpeg', String(e).slice(0, 200)); }
    console.log('clip', out);
  }
  console.log('errs', errs.filter((e) => !/404/.test(e)).slice(0, 4)); await b.close();
})();
