// Lo que cuesta un poder lanzado sin parar: doce zombis alrededor y el poder cada 0,35 s durante 6 s, con y sin el
// dibujo en vivo (`__sinPoderesVivos`). Imprime cuadros por segundo, p50/p95 y el JS por fase (`__rendFases`) del mundo.
// Uso: node t971_poderes_fps.cjs [rayo_cadena,combustion,...] (`CLASE=` otra clase, `FORMA=lobo|oso` el druida transformado, `BANDERA=__sinMateria` compara solo la materia). En la nube Chromium pinta sin tarjeta: vale comparar.
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const ids = (process.argv[2] || 'rayo_cadena,combustion').split(',');
  const clase = process.env.CLASE || 'arcanista', bandera = process.env.BANDERA || '__sinPoderesVivos';
  const { b, p } = await entrar('pc', clase, 30);
  await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
  await p.evaluate(async () => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts');
    for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 10; (h.d.thor ??= {}).descanso = 1e9; j.monstruos = [];
    for (let i = 0; i < 12; i++) { const a = (i / 12) * 6.28, r = 2.5 + (i % 3) * 1.5, m = M.crearMonstruo(D.MONSTRUOS.zombi, 10, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, 0, 0); m.vida = m.vidaMax = 1e7; m.estado = 'dormido'; j.monstruos.push(m); } });
  if (process.env.FORMA) await p.evaluate((f) => { window.__formaPrueba = f; }, process.env.FORMA);
  await p.waitForTimeout(2000);
  const medir = (id, viejo) => p.evaluate(([id, viejo, bandera]) => new Promise((ok) => {
    window[bandera] = viejo; window.__rendFases.ligero(true);
    // (FORMA=lobo|oso: el druida transformado mientras mide, con BANDERA=__sinFormas compara contra el druida teñido)
    if (window.__formaPrueba) { const h = window.__juego().heroe; h.buffs['forma_' + window.__formaPrueba] = { t: 9000, bonos: {}, hab: 'forma_' + window.__formaPrueba }; }
    const t = []; let ult = performance.now(); const t0 = ult; let tl = 0;
    const f = (ahora) => { t.push(ahora - ult); ult = ahora;
      if (ahora - tl > 350) { tl = ahora; const j = window.__juego(), h = j.heroe; const ms = j.monstruos.filter((m) => !m.muerto && !m.dueno); const m = ms[Math.floor(Math.random() * ms.length)]; if (m) { h.mana = h.c.manaMax; h.acc = 'quieto'; h.recargas = {}; window.__mundo.usarHabilidad(j, id, m.x, m.y, m, false); } }
      if (ahora - t0 < 6000) requestAnimationFrame(f); else { const fa = window.__rendFases.leer(); window.__rendFases.ligero(false); t.sort((a, b) => a - b); const s = t.reduce((a, b) => a + b, 0); ok({ fps: +(t.length / (s / 1000)).toFixed(1), p50: +t[t.length >> 1].toFixed(1), p95: +t[Math.floor(t.length * 0.95)].toFixed(1), fases: fa }); } };
    requestAnimationFrame(f); }), [id, viejo, bandera]);
  for (const id of ids) for (const viejo of [true, false, true, false]) console.log(id.padEnd(14), viejo ? 'antes ' : 'ahora ', JSON.stringify(await medir(id, viejo)));
  await b.close();
})();
