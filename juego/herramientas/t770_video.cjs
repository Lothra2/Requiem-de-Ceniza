// Graba clips cuadro a cuadro con el reloj del juego controlado (25 cuadros por segundo de juego), así el video sale a
// velocidad real aunque la máquina sea lenta. Uso: node vid.cjs heroe <clase> | monstruos <id,id,...> | jefes <id,...>
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'), { execSync } = require('child_process');
const DIR = '/tmp/requiem-pruebas/vid';
(async () => {
  const modo = process.argv[2], lista = (process.argv[3] || '').split(',').filter(Boolean);
  process.on('unhandledRejection', (e) => { console.log('FALLA', String(e).slice(0, 300)); process.exit(1); });
  const clase = modo === 'heroe' ? lista[0] : 'templario';
  const { b, p, errs } = await entrar('pc', clase, 30);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(5000);
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; window.__sinAmbiente = true; let mejor = null, md = 0;
    for (let y = 18; y < z.H - 18; y += 2) for (let x = 18; x < z.W - 18; x += 2) { let libre = true; for (let dy = -6; dy <= 6 && libre; dy++) for (let dx = -6; dx <= 6; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) mejor = [Math.floor(h.x), Math.floor(h.y)];
    h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y]; j.monstruos = j.monstruos.filter((o) => false); j.npcs.length = 0; });
  await p.waitForTimeout(1500);
  // calentamiento en tiempo real: que carguen los atlas de cada acción antes de congelar el reloj (si no, salen siluetas)
  if (modo === 'heroe') {
    for (const [dx, dy, c] of [[3, 0, 0], [3, 3, 0], [0, 3, 0], [-3, 3, 0], [-3, 0, 0], [-3, -3, 0], [0, -3, 0], [3, -3, 0], [4, 0, 1], [4, 4, 1], [-4, 4, 1], [-4, -4, 1], [0, 0, 1]]) { await p.evaluate(([dx, dy, c]) => { const j = window.__juego(), h = j.heroe; h.correr = !!c; window.__mundo.caminarA(j, window.__sitio[0] + dx, window.__sitio[1] + dy); }, [dx, dy, c]); await p.waitForTimeout(900); }
    await p.evaluate(async () => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts'); h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.2, h.y + 0.3, 0, 0); m.vida = m.vidaMax = 1e5; m.estado = 'dormido'; j.monstruos.push(m); window.__m = m;
      const hs = C.HABILIDADES.filter((x) => x.clase === h.d.clase && x.tipo !== 'pasiva'); for (const x of hs) h.d.habs[x.id] = 5; window.__hs = ['ataque', ...['proyectil', 'area', 'golpe'].map((t) => (hs.find((x) => x.tipo === t) || hs[0]).id)]; });
    for (let i = 0; i < 4; i++) { await p.evaluate((i) => { const j = window.__juego(), h = j.heroe; h.recargas = {}; h.acc = 'quieto'; window.__mundo.usarHabilidad(j, window.__hs[i], window.__m.x, window.__m.y, window.__m, false); }, i); await p.waitForTimeout(1300); }
    await p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.vidaMax = h.vida = 400; window.__mundo.danar(j, h, { min: 60, max: 60, elem: 'fisico', fuente: window.__m }); }); await p.waitForTimeout(900);
  } else {
    for (const id of lista) { await p.evaluate(async (id) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); h.vida = h.vidaMax = 1e6; j.monstruos = j.monstruos.filter(() => false); const df = D.MONSTRUOS[id] ?? Object.values(D.MONSTRUOS).find((x) => x.sprite === id); (h.d.jefesVistos ??= []).push(df.id); const m = M.crearMonstruo(df, 20, h.x + 2.2, h.y + 0.6, 0, 0); m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); window.__m = m; }, id);
      await p.waitForTimeout(modo === 'jefes' ? 6000 : 2600); if (modo === 'jefes') { await p.evaluate(() => { const j = window.__juego(); j.monstruos = j.monstruos.filter(() => false); j.jefe = null; }); continue; } await p.evaluate(() => { const j = window.__juego(), m = window.__m; for (let k = 0; k < 3; k++) { m.vida = 1; window.__mundo.danar(j, m, { min: 50, max: 50, elem: 'fisico', fuente: j.heroe, deHeroe: true }); } }); await p.waitForTimeout(1500); }
  }
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500)); for (let i = 0; i < 40; i++) await p.clock.runFor(40);
  const clip = async (nombre, cuadros, guion, caja) => {
    const d = `${DIR}/${nombre}`; fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
    const datos = []; for (let i = 0; i < 30; i++) await p.clock.runFor(40);   // que la cámara llegue
    for (let i = 0; i < cuadros; i++) {
      const acc = guion[i]; if (acc) await p.evaluate(acc[0], acc[1]);
      await p.clock.runFor(40);
      await p.screenshot({ path: `${d}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 92, clip: caja });
      datos.push(await p.evaluate(async () => { const E = { aPantUI: (x, y) => window.__aPant(x, y) }, j = window.__juego(), h = j.heroe, m = window.__m; const q = (e) => e ? { x: +e.x.toFixed(3), y: +e.y.toFixed(3), acc: e.acc, t: +(e.t ?? 0).toFixed(3), dir: e.dir, p: E.aPantUI(e.x, e.y).map(Math.round), muerto: !!e.muerto, est: e.estado } : null; return { h: q(h), m: q(m) }; }));
    }
    try { execSync(`ffmpeg -y -loglevel error -framerate 25 -i ${d}/f%04d.jpg -c:v libx264 -pix_fmt yuv420p -crf 18 ${DIR}/${nombre}.mp4`); } catch (e) { console.log('ffmpeg', String(e).slice(0, 200)); }
    fs.writeFileSync(`${DIR}/${nombre}.json`, JSON.stringify({ caja, datos })); console.log('clip', nombre, cuadros);
  };
  const limpiar = () => p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.acc = 'quieto'; h.muerto = false; h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.buffs = {}; h.dir = 's';
    (h.d.thor ??= {}).descanso = 1e9; j.patada = null; j.sacudida = 0; j.congela = 0; j.monstruos = j.monstruos.filter(() => false); j.suelo.length = 0; j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.manchas.length = 0; });
  if (modo === 'heroe') {
    await limpiar();
    const ir = (dx, dy, correr) => [([dx, dy, correr]) => { const j = window.__juego(), h = j.heroe; h.correr = correr; window.__mundo.caminarA(j, window.__sitio[0] + dx, window.__sitio[1] + dy); }, [dx, dy, correr]];
    const zombi = [async () => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); h.camino = null; h.destino = null; const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.2, h.y + 0.3, 0, 0); m.vida = m.vidaMax = 1e5; m.estado = 'dormido'; j.monstruos.push(m); window.__m = m; }, null];
    const usar = (cual) => [async (cual) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, C = await import('/src/datos/clases.ts'); const hs = C.HABILIDADES.filter((x) => x.clase === h.d.clase && x.tipo !== 'pasiva'); for (const x of hs) h.d.habs[x.id] = 5; const id = cual === 'ataque' ? 'ataque' : (hs.find((x) => x.tipo === cual) || hs[0]).id; h.recargas = {}; M.usarHabilidad(j, id, window.__m.x, window.__m.y, window.__m, false); }, cual];
    const pega = [() => { const j = window.__juego(), h = j.heroe; h.vida = h.vidaMax = 400; window.__mundo.danar(j, h, { min: 60, max: 60, elem: 'fisico', fuente: window.__m }); }, null];
    const muere = [() => { const j = window.__juego(), h = j.heroe; window.__mundo.danar(j, h, { min: 9999, max: 9999, elem: 'fisico', fuente: window.__m }); }, null];
    // caminar en los ocho rumbos, correr, pegar, lanzar, recibir, morir
    const g = {}; let f = 5;
    for (const [dx, dy] of [[3, 0], [3, 3], [0, 3], [-3, 3], [-3, 0], [-3, -3], [0, -3], [3, -3], [0, 0]]) { g[f] = ir(dx, dy, false); f += 34; }
    for (const [dx, dy] of [[5, 0], [5, 5], [-5, 5], [-5, -5], [0, 0]]) { g[f] = ir(dx, dy, true); f += 30; }
    g[f] = zombi; f += 12; for (let i = 0; i < 4; i++) { g[f] = usar('ataque'); f += 22; }
    for (const t of ['proyectil', 'area', 'golpe']) { g[f] = usar(t); f += 30; }
    g[f] = pega; f += 14; g[f] = pega; f += 14; g[f] = muere; f += 50;
    await clip(`heroe_${clase}`, f, g, { x: 640 - 260, y: 300 - 200, width: 520, height: 400 });
  } else {
    for (const id of lista) {
      await limpiar();
      const jefe = modo === 'jefes', n = jefe ? 300 : 170, g = {};
      g[2] = [async ([id, jefe]) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); const def = D.MONSTRUOS[id] ?? Object.values(D.MONSTRUOS).find((x) => x.sprite === id); const m = M.crearMonstruo(def, 20, h.x + (jefe ? 6 : 5.5), h.y + 1, 0, 0); m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); window.__m = m; }, [id, jefe]];
      g[n - 55] = [() => { const j = window.__juego(), m = window.__m; m.vida = 1; window.__mundo.danar(j, m, { min: 50, max: 50, elem: 'fisico', fuente: j.heroe, deHeroe: true }); }, null];
      g[n - 53] = g[n - 55]; g[n - 51] = g[n - 55];
      await clip(`${jefe ? 'jefe' : 'mon'}_${id}`, n, g, jefe ? { x: 640 - 340, y: 300 - 250, width: 680, height: 500 } : { x: 640 - 280, y: 300 - 190, width: 560, height: 380 });
    }
  }
  console.log('errs', errs.filter((e) => !/404/.test(e)).slice(0, 3)); await b.close();
})();
