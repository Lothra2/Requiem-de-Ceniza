// Barras de vida sobre los enemigos (render/barras_vida.ts; Rick, 21 nov 2026: "ponle barra de salud a los enemigos para
// ver más fácil cómo están de energía"). Pone alrededor del héroe (invulnerable) comunes, un campeón, un único, un jefe de
// zona y dos invocados, los hiere a distintas alturas y saca: la pelea entera, recortes al doble de cada clase de barra
// (con el tramo pálido recién quitado), los modos Siempre, En pelea y Nunca, una barra que se apaga sola, la niebla (un
// enemigo en lo no explorado no lleva barra) y el costo con 60 enemigos en modo Siempre.
//   node juego/herramientas/t1101_barras.cjs <etiqueta> [pc|pc1080|movil]   (URL=, ZONA=a1_paramo)
// Capturas en /tmp/requiem-pruebas/barras/<etiqueta>_<vista>_*.png y el resumen en <etiqueta>_<vista>.json.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const etiqueta = process.argv[2] || 'ahora', vista = process.argv[3] || 'pc';
const SAL = '/tmp/requiem-pruebas/barras'; fs.mkdirSync(SAL, { recursive: true });
(async () => {
  const { b, p, L, errs } = await entrar(vista, 'arcanista', 30, process.env.URL || 'http://127.0.0.1:5198/');
  const zona = process.env.ZONA || 'a1_paramo';
  await p.evaluate((z) => window.__ir(z), zona); await p.waitForTimeout(4500);
  const R = {};
  const poner = async (n, lejos = 3.2) => p.evaluate(async ([n, lejos]) => {
    const j = window.__juego(), h = j.heroe, M = window.__mundo; h.vida = h.vidaMax = 1e7; h.d.agresivo = false; window.__sinLluvia = true; j.zona.oscuridad = Math.min(j.zona.oscuridad ?? 0, 0.3);
    j.monstruos.forEach((o) => { if (!o.dueno) { o.vida = 0; o.muerto = true; o.tMuerto = 999; } });
    const D = await import('/src/datos/monstruos.ts');
    const ids = ['zombi', 'esqueleto', 'zombi', 'esqueleto', 'zombi', 'zombi', 'esqueleto', 'zombi'];
    const out = [];
    for (let i = 0; i < n; i++) {
      const cal = n > 20 ? (i % 9 === 0 ? 1 : 0) : i === 0 ? 1 : i === 1 ? 2 : i === 2 ? 2 : 0;
      const a = (i / n) * 6.283, r = n > 20 ? 2.5 + (i % 5) * 1.3 : lejos + (i % 2) * 1.2;
      const m = M.crearMonstruo(D.MONSTRUOS[ids[i % ids.length]], 30, h.x + Math.cos(a) * r, h.y + Math.sin(a) * r, cal, 0);
      if (n <= 20 && i === 2) { m.jefeZona = true; m.escala = 1.3; m.nombre = ['Jefe de prueba', 'Test boss']; }
      m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); out.push(m.id);
    }
    return out;
  }, [n, lejos]);
  // 1) la pelea: 9 enemigos y dos invocados heridos
  await poner(9);
  await p.evaluate(async () => {
    const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
    for (const [k, dx] of [[0.45, -1.6], [0.8, 1.6]]) { const m = M.crearMonstruo(D.MONSTRUOS.esqueleto, 30, h.x + dx, h.y + 1.4, 0, 0); m.tipo = 'invocado'; m.dueno = true; m.invocaId = 'esqueleto'; m.estado = 'deambular'; m.vida = m.vidaMax * k; j.monstruos.push(m); }
    h.tCombate = j.t;
    // heridas a distintas alturas: primero la vida de partida, después un golpe que deja el tramo pálido
    j.monstruos.filter((m) => !m.muerto && !m.dueno).forEach((m, i) => { m.vida = m.vidaMax * [0.9, 0.7, 0.55, 0.35, 0.2, 1, 0.6, 0.15, 0.8][i % 9]; });
  });
  await p.waitForTimeout(300);
  await p.evaluate(() => { const j = window.__juego(); j.heroe.tCombate = j.t; j.monstruos.filter((m) => !m.muerto && !m.dueno).forEach((m, i) => { if (i % 3 !== 2) m.vida = Math.max(1, m.vida - m.vidaMax * 0.18); }); });
  await p.waitForTimeout(160);
  await p.screenshot({ path: `${SAL}/${etiqueta}_${vista}_pelea.png` });
  const vistas = await p.evaluate(() => window.__barrasVistas || []);
  R.pelea = vistas.map((v) => v.tipo);
  // recortes al doble de cada clase de barra (en puntos del aparato: el recorte es del lienzo tal cual)
  const dpr = await p.evaluate(() => { const c = document.getElementById('juego'); return c.width / c.getBoundingClientRect().width; });
  const rc = await p.evaluate(() => document.getElementById('juego').getBoundingClientRect().toJSON());
  const hechos = new Set();
  for (const v of vistas) {
    if (hechos.has(v.tipo)) continue; hechos.add(v.tipo);
    const cx = rc.left + (v.x + v.w / 2) / dpr, cy = rc.top + v.y / dpr, w = 150, h = 120;
    await p.screenshot({ path: `${SAL}/${etiqueta}_${vista}_cerca_${v.tipo}.png`, clip: { x: Math.max(0, cx - w / 2), y: Math.max(0, cy - 40), width: w, height: h } });
  }
  // 2) se apaga sola: sin golpes ni pelea, a los 5 s quedan solo los invocados heridos
  // (los invocados y Thor se van: si no, siguen pegando y la barra no tiene por qué apagarse; los enemigos quedan aturdidos)
  await p.evaluate(() => { const j = window.__juego(); j.monstruos.forEach((m) => { if (m.dueno) { m.vida = 0; m.muerto = true; m.tMuerto = 999; } else if (!m.muerto) { m.estado = 'dormido'; m.aturdido = 60; } }); j.heroe.tCombate = -99; });
  // (5,2 s del reloj del juego: en la nube a 1080 el juego corre más lento que el reloj de pared)
  // (el único no se queda aturdido y vuelve a la pelea: la prueba mira que sin golpes y fuera de pelea se apaguen)
  await p.evaluate(async () => { const j = window.__juego(), t0 = j.t, fin = performance.now() + 25000; (j.heroe.d.thor ??= {}).descanso = 999; while (performance.now() < fin && j.t - t0 < 5.2) { j.heroe.tCombate = -99; j.monstruos.forEach((m) => { if (m.dueno) { m.vida = 0; m.muerto = true; m.tMuerto = 999; } else if (!m.muerto) m.estado = 'dormido'; }); await new Promise((r) => setTimeout(r, 50)); } });
  R.apagadas = await p.evaluate(() => (window.__barrasVistas || []).map((v) => v.tipo));
  if (R.apagadas.length) R.porQue = await p.evaluate(() => { const j = window.__juego(); return { aliados: j.monstruos.filter((q) => q.dueno && !q.muerto).map((q) => q.invocaId), acc: j.heroe.acc, tCombate: j.t - j.heroe.tCombate, vivos: (window.__barrasVistas || []).map((v) => { const m = j.monstruos.find((q) => q.id === v.id); return { est: m.estado, sang: m.sangrado, ven: m.veneno, v: m.vida / m.vidaMax, at: m.aturdido, mods: m.mods }; }) }; });
  // 3) modos
  await p.evaluate(() => { window.__barrasVida.modo = 0; });
  await p.waitForTimeout(500);
  R.siempre = await p.evaluate(() => (window.__barrasVistas || []).length);
  await p.screenshot({ path: `${SAL}/${etiqueta}_${vista}_siempre.png` });
  await p.evaluate(() => { window.__barrasVida.modo = 2; });
  await p.waitForTimeout(400);
  R.nunca = await p.evaluate(() => (window.__barrasVistas || []).length);
  // 4) la niebla: el mismo enemigo en una baldosa no explorada no lleva barra
  await p.evaluate(() => { window.__barrasVida.modo = 0; });
  R.niebla = await p.evaluate(async () => {
    // (el héroe explora a su alrededor en cada cuadro: con __rv = 0 solo su baldosa, y a cielo abierto ya no toda la pantalla)
    window.__rv = 0; const j = window.__juego(), z = j.zona, h = j.heroe, m = j.monstruos.find((q) => !q.muerto && !q.dueno && (Math.floor(q.x / 5) !== Math.floor(h.x / 5) || Math.floor(q.y / 5) !== Math.floor(h.y / 5)));
    const i = Math.floor(m.y / 5) * z.tw + Math.floor(m.x / 5), antes = z.explorado[i];
    await new Promise((r) => setTimeout(r, 300)); const con = (window.__barrasVistas || []).some((v) => v.id === m.id);
    const fin = performance.now() + 900; let sin = false;
    while (performance.now() < fin) { z.explorado[i] = 0; await new Promise((r) => requestAnimationFrame(r)); sin = !(window.__barrasVistas || []).some((v) => v.id === m.id && v.a > 0.05); }
    z.explorado[i] = antes; delete window.__rv; return { conVista: con, ocultaEnNiebla: sin };
  });
  // 5) costo: 60 enemigos, todos con barra
  await poner(60);
  await p.evaluate(() => { const j = window.__juego(); j.monstruos.forEach((m) => { if (!m.dueno && !m.muerto) m.vida = m.vidaMax * 0.5; }); window.__barrasCosto = { n: 0, ms: 0, cuadros: 0 }; });
  await p.waitForTimeout(3000);
  R.costo = await p.evaluate(() => { const c = window.__barrasCosto; return { barrasPorCuadro: +(c.n / c.cuadros).toFixed(1), msPorCuadro: +(c.ms / c.cuadros).toFixed(3), cuadros: c.cuadros }; });
  await p.screenshot({ path: `${SAL}/${etiqueta}_${vista}_sesenta.png` });
  await p.evaluate(() => { window.__barrasVida.modo = 1; });
  const ok = R.pelea.includes('comun') && R.pelea.includes('campeon') && R.pelea.includes('unico') && R.pelea.includes('zona') && R.pelea.includes('aliado') && R.apagadas.length === 0 && R.nunca === 0 && R.niebla.conVista && R.niebla.ocultaEnNiebla;
  console.log(JSON.stringify(R)); console.log(ok ? 'BIEN' : 'MAL', errs.slice(0, 3));
  fs.writeFileSync(`${SAL}/${etiqueta}_${vista}.json`, JSON.stringify(R, null, 1));
  await b.close(); process.exit(ok ? 0 : 1);
})();
