// Fluidez en pelea: muchos monstruos alrededor del héroe en campo abierto y bolas de fuego seguidas. Mide el tiempo de
// cada cuadro y saca un perfil de CPU con las funciones que más comen. Uso: node juego/herramientas/t860_fps.cjs [n] [zona]
// (el Chromium de la nube pinta sin tarjeta gráfica: lo que vale es comparar antes y después y ver qué funciones pesan)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const N = +(process.argv[2] || 24), Z = process.argv[3] || 'a1_paramo';
  const { b, p, errs } = await entrar('pc', 'arcanista', 20, undefined, "d.puntos = 0; d.habilidades = Object.assign(d.habilidades || {}, { saeta_ignea: 5, bola_fuego: 10 });");
  await p.evaluate((Z) => window.__ir(Z), Z); await p.waitForTimeout(6000);
  await p.evaluate(async (N) => {
    const j = window.__juego(), h = j.heroe, M = window.__mundo; h.vida = h.vidaMax = 1e7; h.mana = h.manaMax = 1e7;
    const D = await import('/src/datos/monstruos.ts'); const ids = ['zombi', 'esqueleto', 'necrofago', 'bandido', 'cultista', 'chacal'].filter((i) => D.MONSTRUOS[i]);
    for (let i = 0; i < N; i++) { const a = (i / N) * 6.28, r = 3 + (i % 3) * 1.4, m = M.crearMonstruo(D.MONSTRUOS[ids[i % ids.length]], 10, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, 0, 0); m.vida = m.vidaMax = 1e6; m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); }
  }, N);
  // VIVO=<elemento>: el héroe con un arma de ese elemento y un tercio de los monstruos campeones encantados (armas vivas)
  if (process.env.VIVO) { await p.evaluate(async (el) => { const T = window.__T, j = window.__juego(), d = j.heroe.d; const b = T.O.BASE_POR_ID.get('ars_baculo_1'); d.equipo.arma = T.O.crearBase(b, 20); d.equipo.arma.vivo = el; window.__mundo.recalc(j);
    const MOD = { fuego: 'ardiente', frio: 'helado', rayo: 'electrico', sangre: 'vampiro', sombra: 'maldito' }; j.monstruos.forEach((m, i) => { if (i % 3 === 0) { m.calidad = 1; m.mods = [MOD[el] ?? 'ardiente']; } }); }, process.env.VIVO);
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); if (i > 5 && (await p.evaluate(() => window.__T.P.progresoPintura)) >= 1) break; } }
  if (process.env.ESPERA) await p.waitForTimeout(+process.env.ESPERA * 1000);
  if (process.env.SINVIVAM) await p.evaluate(() => { window.__sinVivaMonstruos = true; });
  await p.waitForTimeout(1500);
  const medir = async (seg, conFuego) => p.evaluate(([seg, conFuego]) => new Promise((ok) => {
    const t = []; let ult = performance.now(); const t0 = ult; let tl = 0;
    const f = (ahora) => { t.push(ahora - ult); ult = ahora;
      if (conFuego && ahora - tl > 280) { tl = ahora; const j = window.__juego(), h = j.heroe; const ms = j.monstruos.filter((m) => !m.muerto && !m.dueno); const m = ms[Math.floor(Math.random() * ms.length)]; if (m) { h.mana = h.manaMax; h.tAtaque = 0; h.cd = {}; window.__mundo.usarHabilidad(j, 'bola_fuego', m.x, m.y, m, false); } }
      if (ahora - t0 < seg * 1000) requestAnimationFrame(f); else { t.sort((a, b) => a - b); const s = t.reduce((a, b) => a + b, 0); ok({ cuadros: t.length, fps: +(t.length / (s / 1000)).toFixed(1), p50: +t[t.length >> 1].toFixed(1), p95: +t[Math.floor(t.length * 0.95)].toFixed(1), peor: +t[t.length - 1].toFixed(1) }); } };
    requestAnimationFrame(f); }), [seg, conFuego]);
  console.log('quieto   ', JSON.stringify(await medir(3, false)));
  const cdp = await p.context().newCDPSession(p); await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  console.log('con fuego', JSON.stringify(await medir(8, true)));
  const { profile } = await cdp.send('Profiler.stop');
  const st = await p.evaluate(() => { const j = window.__juego(); return { efectos: j.efectos.length, proy: (j.proyectiles || []).length, part: (j.particulas || []).length, vivos: j.monstruos.filter((m) => !m.muerto).length, chispas: (j.chispas || []).length }; });
  console.log('estado', JSON.stringify(st));
  await p.screenshot({ path: '/tmp/requiem-pruebas/fps/pelea.png' });
  // tiempo propio por función
  const dt = profile.timeDeltas, cuenta = new Map(); const porId = new Map(profile.nodes.map((n) => [n.id, n]));
  profile.samples.forEach((id, i) => { const n = porId.get(id); const k = `${n.callFrame.functionName || '(anon)'} ${(n.callFrame.url || '').split('/').slice(-2).join('/').split('?')[0]}:${n.callFrame.lineNumber + 1}`; cuenta.set(k, (cuenta.get(k) || 0) + (dt[i] || 0)); });
  const tot = [...cuenta.values()].reduce((a, b) => a + b, 0);
  [...cuenta.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).forEach(([k, v]) => console.log(((v / tot) * 100).toFixed(1).padStart(5) + '%', k));
  fs.writeFileSync('/tmp/requiem-pruebas/fps/perfil.cpuprofile', JSON.stringify(profile));
  console.log('errores', errs.slice(0, 4)); await b.close();
})();
