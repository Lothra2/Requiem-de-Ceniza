// Las formas del druida en el juego (quinta pasada de poderes, 20 nov 2026): el druida, el lobo y el oso uno al lado del
// otro en cada acción, cada rumbo y varios cuadros (con `__poseHeroe`, que pinta la pose sin tocar la lógica), y el cambio
// de forma en cámara lenta (de druida a lobo, de lobo a oso y de oso a druida). Las capturas van a
// /tmp/requiem-pruebas/poderes5/formas y `python3 juego/herramientas/t995_lamina.py` arma las láminas.
// Uso: CHROMIUM=... URL=... node t995_formas.cjs [acciones] [rumbos]   (ZONA= otra zona, a2_dunas por omisión; NOCHE=1)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const accs = (process.argv[2] || 'quieto,caminar,correr,atacar,lanzar,herido,morir').split(',');
  const dirs = (process.argv[3] || 'se,s,so,o,no,n,ne,e').split(',');
  const D = '/tmp/requiem-pruebas/poderes5/formas'; fs.mkdirSync(D, { recursive: true });
  const { b, p, errs } = await entrar('pc', 'druida', 30);
  const ZONA = process.env.ZONA || 'a2_dunas';
  for (let k = 0; k < 3; k++) { await p.evaluate((z) => window.__ir(z), ZONA); await p.waitForTimeout(4500); if (await p.evaluate((z) => window.__juego().zona.id === z, ZONA)) break; }
  await p.evaluate(async () => { const j = window.__juego(), z = j.zona, h = j.heroe; j.portal = null; window.__sinLluvia = true; window.__sinAmbientePfx = true; let mejor = null, md = -99;
    for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -6; dy <= 6 && libre; dy++) for (let dx = -6; dx <= 6; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let lejos = true; for (const sa of z.salidas) if (Math.hypot(sa.cx - x, sa.cy - y) < 24) lejos = false; if (!lejos) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (mejor) { h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; } h.camino = null; z.objetos = z.objetos.filter((o) => Math.hypot(o.cx + 0.5 - h.x, o.cy + 0.5 - h.y) > 10);
    const C = await import('/src/datos/clases.ts'); for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5;
    j.monstruos = []; h.vida = h.vidaMax = 1e9; (h.d.thor ??= {}).descanso = 1e9; window.__mundo.recalc(j); });
  if (process.env.NOCHE) await p.evaluate(() => { const z = window.__juego().zona; z.oscuridad = 0.85; });
  await p.waitForTimeout(3000);
  const cuerpo = async (f) => { await p.evaluate((f) => { const h = window.__juego().heroe; delete h.buffs.forma_lobo; delete h.buffs.forma_oso; if (f) h.buffs['forma_' + f] = { t: 9000, bonos: {}, hab: 'forma_' + f }; window.__mundo.recalc(window.__juego()); }, f); await p.waitForTimeout(1500); };
  const recorte = async (ruta, w = 140, hh = 120) => { const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x, h.y); }); const L = await p.evaluate(() => { const c = document.getElementById('juego'), r = c.getBoundingClientRect(), v = window.__vista(); return { k: r.width / v.W, l: r.left, t: r.top }; });
    await p.screenshot({ path: ruta, clip: { x: L.l + (x - w / 2) * L.k, y: L.t + (y - hh * 0.72) * L.k, width: w * L.k, height: hh * L.k } }); };
  const N = { quieto: 4, caminar: 6, correr: 6, atacar: 6, lanzar: 6, herido: 3, morir: 6 };
  for (const f of ['', 'lobo', 'oso']) {
    await cuerpo(f);
    for (const acc of accs) for (const dir of dirs) for (let i = 0; i < N[acc]; i++) {
      const u = i / N[acc];
      await p.evaluate(([acc, dir, u]) => { const dur = acc === 'morir' ? 0.8 : acc === 'herido' ? 0.3 : 0.55; window.__poseHeroe = { acc, dir, rumbo: undefined, t: acc === 'quieto' ? u * 1.4 : u * dur, dur, golpeEn: dur * 0.5, recorrido: u * (acc === 'correr' ? 2.6 : 1.8), camino: null }; }, [acc, dir, u]);
      await p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await recorte(`${D}/${f || 'druida'}_${acc}_${dir}_${i}.png`);
    }
  }
  await p.evaluate(() => { window.__poseHeroe = null; });
  // el cambio en cámara lenta: druida -> lobo -> oso -> druida
  await cuerpo('');
  for (const [de, a] of [['', 'lobo'], ['lobo', 'oso'], ['oso', '']]) {
    await cuerpo(de);
    await p.evaluate(() => { window.__camaraLenta = 0.1; window.__t0 = window.__juego().t; const h = window.__juego().heroe; h.dir = 'so'; h.acc = 'quieto'; });
    await p.evaluate((a) => { const h = window.__juego().heroe; delete h.buffs.forma_lobo; delete h.buffs.forma_oso; if (a) h.buffs['forma_' + a] = { t: 9000, bonos: {}, hab: 'forma_' + a }; }, a);
    for (let i = 0; i < 16; i++) {
      await p.waitForFunction(([t]) => window.__juego().t - window.__t0 >= t, [0.045 * (i + 1)], { timeout: 20000, polling: 5 }).catch(() => {});
      await recorte(`${D}/cambio_${de || 'druida'}_${a || 'druida'}_${String(i).padStart(2, '0')}.png`, 200, 150);
    }
    await p.evaluate(() => { window.__camaraLenta = 1; });
  }
  // el Oso espíritu (el oso pardo de verdad, antes el ogro teñido) a dos casillas, en cuatro momentos
  if (!process.env.SIN_OSO) { await cuerpo(''); await p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.recargas = {}; h.mana = h.c.manaMax = 1e5; h.acc = 'quieto'; window.__mundo.usarHabilidad(j, 'oso_espiritu', h.x + 2, h.y + 0.5, null, false); });
    for (const t of [400, 1200, 2500]) { await p.waitForTimeout(t === 400 ? 400 : 800); await p.evaluate(() => { const j = window.__juego(), m = j.monstruos.find((q) => q.invocaId === 'oso'); if (m) { const h = j.heroe; m.x = h.x + 2; m.y = h.y + 0.5; m.estado = 'dormido'; } }); const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x + 1, h.y); }); await p.screenshot({ path: `${D}/oso_espiritu_${t}.png`, clip: { x: x - 110, y: y - 100, width: 220, height: 140 } }); } }
  console.log('errores', errs.filter((e) => !/404/.test(e)).slice(0, 5));
  await b.close();
})();
