// Enemigos con arma viva: campeones encantados (fuego, escarcha, rayo, sangre, maldito) con arma en la mano, quietos y
// pegando. Uso: URL=... node juego/herramientas/t873_vivas_monstruos.cjs [id,id,...]
// Capturas en /tmp/requiem-pruebas/armas/monstruos/<id>_<mod>_<cuadro>.png
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const ids = (process.argv[2] || 'bandido,esqueleto,cultista').split(','), MODS = (process.env.MODS || 'ardiente,helado,electrico,vampiro,maldito').split(',');
  const DIR = '/tmp/requiem-pruebas/armas/monstruos'; fs.mkdirSync(DIR, { recursive: true });
  const { b, p, errs } = await entrar('pc', 'templario', 30);
  await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(6000);
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; (h.d.thor ??= {}).descanso = 1e9; j.monstruos.length = 0; j.npcs.length = 0; h.vida = h.vidaMax = 1e7; window.__sinLluvia = true; let mejor = null, md = 0;
    for (let y = 14; y < z.H - 14; y += 2) for (let x = 14; x < z.W - 14; x += 2) { let libre = true; for (let dy = -5; dy <= 5 && libre; dy++) for (let dx = -5; dx <= 5; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (mejor) { h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; } window.__sitio = [h.x, h.y]; });
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500));
  const correr = async (ms) => { for (let i = 0; i < ms / 40; i++) await p.clock.runFor(40); };
  for (const id of ids) for (const mod of MODS) {
    const ok = await p.evaluate(async ([id, mod]) => { const j = window.__juego(), h = j.heroe, D = await import('/src/datos/monstruos.ts'); j.monstruos.length = 0; const def = D.MONSTRUOS[id]; if (!def) return false;
      h.x = window.__sitio[0]; h.y = window.__sitio[1]; const m = window.__mundo.crearMonstruo(def, 20, h.x + 1.0, h.y - 1.0, 0, 0); m.calidad = 1; m.mods = [mod]; m.vida = m.vidaMax = 1e6; m.estado = 'perseguir'; m.objetivo = h; j.monstruos.push(m); window.__m = m; return true; }, [id, mod]);
    if (!ok) { console.log('no existe', id); continue; }
    await correr(2400);
    for (let i = 0; i < 16; i++) { await correr(80); const [x, y] = await p.evaluate(() => window.__aPant(window.__m.x, window.__m.y)); await p.evaluate(() => { window.__juego().numeros.length = 0; }); await p.screenshot({ path: `${DIR}/${id}_${mod}_${String(i).padStart(2, '0')}.png`, clip: { x: Math.round(x - 80), y: Math.round(y - 120), width: 160, height: 160 } }); }
    console.log('listo', id, mod);
  }
  console.log('errs', errs.filter((e) => !/404/.test(e)).slice(0, 4)); await b.close();
})();
