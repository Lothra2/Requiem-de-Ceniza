// Fotos para revisar a ojo: (1) las reliquias en la bolsa, por páginas; (2) la ambientación de cerca en varias zonas;
// (3) los poderes grandes de la arcanista en acción. Uso: node t750_fotos.cjs [reliquias|ambiente|poderes]
const { entrar } = require('./comun_pruebas.cjs');
const que = process.argv[2] || 'reliquias,ambiente,poderes';
(async () => {
  if (que.includes('reliquias')) {
    const { b, p } = await entrar('pc', 'templario', 90);
    await p.waitForTimeout(2000);
    const ids = await p.evaluate(async () => { const R = await import('/src/datos/reliquias.ts'); return R.RELIQUIAS.filter((u) => R.ASPECTO_RELIQUIA.has(u.nombre[0])).map((u) => u.id); });
    await p.keyboard.press('i'); await p.waitForTimeout(1500);
    let i = 0, pag = 0;
    while (i < ids.length && pag < 12) {
      i = await p.evaluate(([ids, i]) => { const T = window.__T, d = window.__juego().heroe.d; d.bolsa = []; let k = i; for (; k < ids.length; k++) { const o = T.O.crearUnicoId(ids[k], 90); if (!o) continue; o.identificado = true; if (!T.H.meterEnBolsa(d, o)) break; if (d.bolsa.some((e) => (e.b ?? 0) > 0)) { d.bolsa.pop(); break; } } return k; }, [ids, i]);
      await p.waitForTimeout(1800);
      await p.screenshot({ path: `/tmp/requiem-pruebas/foto_rel_${pag++}.png`, clip: { x: 962, y: 536, width: 316, height: 166 } });
    }
    console.log('reliquias: páginas', pag, 'de', ids.length); await b.close();
  }
  if (que.includes('ambiente')) {
    const { b, p } = await entrar('pc', 'berserker', 30);
    await p.evaluate(() => { window.__sinLluvia = true; });
    let n = 0;
    for (const zona of ['a1_bosque', 'a1_cripta', 'a1_cementerio', 'a1_paramo']) {
      await p.evaluate((z) => window.__ir(z), zona); await p.waitForTimeout(6000);
      const r = await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; j.monstruos.forEach((m) => { if (!m.dueno) { m.vida = 0; m.muerto = true; m.tMuerto = 999; } });
        const pal = /telar|craneo|calav|hueso|costill|hongo|helecho|pasto|flor|musgo|raiz|vela|junco|zarza/; const os = z.objetos.filter((o) => pal.test(o.id + '|' + o.v) && !o.bloquea);
        let mejor = null, mc = -1; for (const o of os) { if (z.bloq[o.cy * z.W + o.cx] === 1 || z.bloq[o.cy * z.W + o.cx] === 2) continue; const c = os.filter((q) => Math.abs(q.cx - o.cx) < 7 && Math.abs(q.cy - o.cy) < 7).length; if (c > mc) { mc = c; mejor = o; } }
        if (mejor) { h.x = mejor.cx + 0.5; h.y = mejor.cy + 1.5; h.camino = []; } return { n: os.length, cerca: mc }; });
      await p.waitForTimeout(2500);
      await p.screenshot({ path: `/tmp/requiem-pruebas/foto_amb_${n++}.png`, clip: { x: 340, y: 110, width: 600, height: 400 } }); console.log(zona, JSON.stringify(r));
    }
    await b.close();
  }
  if (que.includes('poderes')) {
    const { b, p } = await entrar('pc', 'arcanista', 60);
    await p.evaluate(() => { window.__sinLluvia = true; window.__ir('a1_bosque'); }); await p.waitForTimeout(6000);
    let n = 0;
    for (const id of ['muro_fuego', 'ventisca', 'orbe_glacial', 'meteoro', 'fisura_x']) {
      const ok = await p.evaluate(async (id) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, d = h.d; const C = await import('/src/datos/clases.ts'); if (!C.HABILIDADES.find((q) => q.id === id)) return 'no existe';
        j.monstruos.forEach((m) => { if (!m.dueno) { m.vida = 0; m.muerto = true; m.tMuerto = 999; } });
        const D = await import('/src/datos/monstruos.ts');
        for (let i = 0; i < 7; i++) { const m = M.crearMonstruo(D.MONSTRUOS[i % 2 ? 'esqueleto' : 'zombi'], 30, h.x + 3.2 + (i % 3) * 0.9, h.y - 2.6 + i * 0.75, 0, 0); m.vida = m.vidaMax = 99999; m.vel = 0; m.dano = [0, 0]; j.monstruos.push(m); }
        d.habs[id] = 12; d.der = id; h.mana = h.manaMax = 99999; h.recargas = {}; M.recalc(j); h.mana = 99999;
        return M.usarHabilidad(j, id, h.x + 4, h.y - 0.5, null, true); }, id);
      if (ok === 'no existe') continue;
      for (const [k, ms] of [[0, 900], [1, 900]]) { await p.waitForTimeout(ms); await p.screenshot({ path: `/tmp/requiem-pruebas/foto_pod_${id}_${k}.png`, clip: { x: 400, y: 130, width: 560, height: 380 } }); }
      console.log(id, ok); await p.waitForTimeout(2500); n++;
    }
    await b.close();
  }
})();
