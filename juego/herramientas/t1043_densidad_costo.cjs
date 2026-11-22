// Lo que cuesta la densidad por cuadro: en una zona grande, con lo de antes (`__densidadVieja`) y lo de ahora, mide la lógica y
// el dibujo del mundo (ms de JS, __rendFases) explorando (todos dormidos o rondando) y con TODO despierto encima del héroe
// invulnerable (el peor caso: la zona entera persiguiéndolo). Uso: node juego/herramientas/t1043_densidad_costo.cjs [zonas] [vueltas]
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const ZONAS = (process.argv[2] || 'a1_paramo,a2_dunas').split(','), V = +(process.argv[3] || 2);
  const { b, p, errs } = await entrar('pc', 'berserker', 30);
  const medir = (seg) => p.evaluate((seg) => new Promise((ok) => { window.__rendFases.ligero(true); const t = []; let ult = performance.now(); const t0 = ult;
    const f = (a) => { t.push(a - ult); ult = a; if (a - t0 < seg * 1000) requestAnimationFrame(f); else { const F = window.__rendFases.leer(); t.sort((x, y) => x - y); ok({ logica: F.logica, mundo: F.mundo, total: F.total, p50: +t[t.length >> 1].toFixed(1), p95: +t[Math.floor(t.length * 0.95)].toFixed(1) }); } };
    requestAnimationFrame(f); }), seg);
  const res = {};
  for (let v = 0; v < V; v++) for (const zid of ZONAS) for (const vieja of [true, false]) {
    // (pasando por el pueblo: entrar a la zona donde ya se está no la vuelve a poblar)
    await p.evaluate(() => window.__ir('a1_refugio', 'arriba'));
    await p.waitForFunction(() => window.__estado() === 'juego' && window.__juego().zona.id === 'a1_refugio', null, { timeout: 60000 });
    await p.evaluate((vj) => { window.__densidadVieja = vj; window.__mundo.olvidarZonas(); }, vieja);
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 });
    await p.evaluate(() => { const h = window.__juego().heroe; h.vida = h.vidaMax = 1e9; });
    await p.waitForTimeout(2500);
    const n = await p.evaluate(() => window.__juego().monstruos.filter((m) => !m.muerto && !m.dueno).length);
    const quieto = await medir(4);
    // todo despierto y encima: cada uno a 6 a 16 casillas del héroe, persiguiéndolo, sin morir
    await p.evaluate(() => { const j = window.__juego(), h = j.heroe, Z = j.zona; for (const m of j.monstruos) { if (m.muerto || m.dueno) continue; m.vida = m.vidaMax = 1e9;
      for (let k = 0; k < 30; k++) { const a = Math.random() * 6.28, r = 6 + Math.random() * 10, x = Math.floor(h.x + Math.cos(a) * r), y = Math.floor(h.y + Math.sin(a) * r); if (x > 0 && y > 0 && x < Z.W && y < Z.H && Z.bloq[y * Z.W + x] === 0) { m.x = m.ox = x + 0.5; m.y = m.oy = y + 0.5; break; } }
      m.estado = 'perseguir'; m.objetivo = h; } });
    await p.waitForTimeout(3000);
    const pelea = await medir(6);
    const k = `${zid} ${vieja ? 'antes' : 'ahora'}`; (res[k] ??= []).push({ n, quieto, pelea });
    console.log(k, 'cuerpos', n, 'explorando', JSON.stringify(quieto), 'todo despierto', JSON.stringify(pelea));
  }
  // la mediana de las vueltas (la nube tiene ruido: otras sesiones corren pruebas)
  const med = (v) => { const s = [...v].sort((a, b) => a - b); return s[s.length >> 1]; };
  for (const [k, v] of Object.entries(res)) console.log('MEDIANA', k, 'cuerpos', med(v.map((x) => x.n)), 'explorando logica', med(v.map((x) => x.quieto.logica)), 'mundo', med(v.map((x) => x.quieto.mundo)), '| despierto logica', med(v.map((x) => x.pelea.logica)), 'mundo', med(v.map((x) => x.pelea.mundo)), 'total', med(v.map((x) => x.pelea.total)));
  console.log('errores', errs.slice(0, 3)); await b.close();
})();
