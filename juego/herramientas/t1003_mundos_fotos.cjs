// Fotos de los mundos en plena pelea: en cada zona, el campamento más grande, uno típico y el de élite o el jefe, con los
// monstruos despiertos y el héroe invulnerable, más la rejilla de la zona para el mapa de despeje (t1003_lamina.py).
// Uso: node juego/herramientas/t1003_mundos_fotos.cjs <etiqueta> [zonas] (VISTA=pc|pc1080|movil, URL=, CHROMIUM=)
// Salida: /tmp/requiem-pruebas/mundos1/<etiqueta>/<vista>/<zona>_<sitio>.png, indice.json y mapas/<zona>.json
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const etiqueta = process.argv[2] || 'ahora', VISTA = process.env.VISTA || 'pc';
const ZONAS = (process.argv[3] || 'a1_paramo,a1_bosque,a1_cementerio,a1_guarida,a1_cripta,a1_cata1,a1_pozo,a2_dunas,a2_tumbas1,a2_tumbas2,a3_selva,a3_pantano,a3_templo2,a4_picos,a4_hielo1,a4_minas2,a5_llanuras,a5_santuario2,a6_costa,a6_catedral2,a7_cielo,a7_trono').split(',');
const DIR = `/tmp/requiem-pruebas/mundos1/${etiqueta}/${VISTA}`; fs.mkdirSync(DIR + '/mapas', { recursive: true });
const MEDIR = fs.readFileSync(__dirname + '/medir_espacios.mjs', 'utf8').replace(/^_m_/, '').replace('export const medirZona =', 'window.__medirZona =').replace('export const monton =', 'window.__monton =');
(async () => {
  const { b, p, errs } = await entrar(VISTA, 'berserker', 30, undefined, "d.id = 'auditoria1';");
  await p.evaluate(MEDIR);
  await p.evaluate(() => { setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; j.heroe.muerto = false; } }, 50); });
  const res = [];
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); await p.waitForTimeout(2500);
    const info = await p.evaluate(() => { const j = window.__juego(), z = j.zona; const m = window.__medirZona(z, j.monstruos, null);
      const sp = m.spawns.map((s, i) => ({ ...s, i, cx: z.spawns[i].cx, cy: z.spawns[i].cy })).filter((s) => s.t !== 'jefe' && s.n > 0);
      const grande = [...sp].sort((a, b) => b.n - a.n || b.mA - a.mA)[0], med = [...sp].sort((a, b) => a.mA - b.mA)[Math.floor(sp.length / 2)];
      const jf = z.spawns.find((s) => s.tipo === 'jefe'), elite = sp.filter((s) => s.t !== 'grupo' && s !== grande && s !== med).sort((a, b) => b.n - a.n)[0];
      const pts = [grande && { ...grande, sitio: 'grande' }, med && med !== grande && { ...med, sitio: 'tipico' }, jf ? { sitio: 'jefe', cx: jf.cx, cy: jf.cy, t: 'jefe', mA: m.spawns[z.spawns.indexOf(jf)].mA, n: 1 } : elite && { ...elite, sitio: 'elite' }].filter(Boolean);
      return { pts, bloq: Array.from(z.bloq).join(''), W: z.W, H: z.H, spawns: z.spawns.map((s, i) => ({ cx: s.cx, cy: s.cy, t: s.tipo, n: m.spawns[i].n })), gore: z.objetos.filter((o) => o.capa === 'matanza' || o.capa === 'horror' || o.capa === 'escena' || /^hor_/.test(o.id)).map((o) => [o.cx, o.cy]), salidas: z.salidas.map((s) => [s.cx, s.cy]), lugares: (z.lugares || []).map((l) => [l.cx, l.cy, l.r, l.papel]), hueco: z.hueco ? Array.from(z.hueco).join('') : null, piso: z.pisos.map((q) => (q ? 1 : 0)).join(''), tw: z.tw }; });
    if (VISTA === 'pc') fs.writeFileSync(`${DIR}/mapas/${zid}.json`, JSON.stringify(info));
    for (const q of info.pts) {
      const r = await p.evaluate((q) => { const j = window.__juego(), z = j.zona, h = j.heroe, W = z.W;
        let bx = q.cx, by = q.cy, bs = -1; for (let dy = -4; dy <= 4; dy++) for (let dx = -4; dx <= 4; dx++) { const X = Math.floor(q.cx) + dx, Y = Math.floor(q.cy) + dy, d = Math.hypot(dx, dy); if (d < 2.5 || d > 4.5 || X < 1 || Y < 1 || X >= W - 1 || Y >= z.H - 1 || z.bloq[Y * W + X]) continue; let c = 0; for (let a = -1; a <= 1; a++) for (let e = -1; e <= 1; e++) if (!z.bloq[(Y + a) * W + X + e]) c++; if (c > bs) { bs = c; bx = X; by = Y; } }
        h.x = bx + 0.5; h.y = by + 0.5; h.camino = null; h.destino = null; h.objetivo = null; return [bx, by]; }, q);
      await p.waitForTimeout(q.sitio === 'jefe' ? 5200 : 2600);
      const cerca = await p.evaluate(() => { const j = window.__juego(), h = j.heroe, v = window.__vista(), mw = v.W / v.ZM / 2, mh = v.H / v.ZM / 2; let enPant = 0, desp = 0; for (const m of j.monstruos) { if (m.muerto || m.dueno) continue; const sx = (m.x - m.y - h.x + h.y) * 16, sy = (m.x + m.y - h.x - h.y) * 8; if (Math.abs(sx) < mw && Math.abs(sy) < mh) { enPant++; if (m.estado === 'perseguir' || m.estado === 'atacar') desp++; } } return { enPant, desp }; });
      await p.screenshot({ path: `${DIR}/${zid}_${q.sitio}.png` });
      res.push({ zid, sitio: q.sitio, tipo: q.t, despeje: q.mA, grupo: q.n, ...cerca, heroe: r }); console.log(zid, q.sitio, q.t, 'cuerpos', q.n, 'despeje', q.mA, JSON.stringify(cerca));
    }
  }
  fs.writeFileSync(DIR + '/indice.json', JSON.stringify(res)); console.log('errores', errs.slice(0, 5)); await b.close();
})();
