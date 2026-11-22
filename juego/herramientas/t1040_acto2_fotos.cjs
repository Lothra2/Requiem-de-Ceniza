// Fotos del acto 2 en los mismos puntos (relativos al mapa) para comparar antes y después: entrada, tres puntos
// fijos del mapa (fracción del ancho y el alto, a la celda libre más cercana), el jefe y el hito si hay.
// Uso: node juego/herramientas/t1040_acto2_fotos.cjs <etiqueta> [zonas] (BANDERAS=__acto2Viejo para el antes, VISTA=pc)
// Salida: /tmp/requiem-pruebas/acto2/<etiqueta>/<zona>_<sitio>.png e indice.json
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const etiqueta = process.argv[2] || 'ahora', VISTA = process.env.VISTA || 'pc';
const ZONAS = (process.argv[3] || 'a2_dunas,a2_oasis_muerto,a2_ruinas,a2_escarabajos,a2_nombres1,a2_nombres2,a2_sol,a2_tumbas1,a2_tumbas2').split(',');
const DIR = `${process.env.DIR || '/tmp/requiem-pruebas/acto2'}/${etiqueta}`; fs.mkdirSync(DIR, { recursive: true });
const FR = [[0.3, 0.35], [0.62, 0.5], [0.45, 0.72]];
(async () => {
  const { b, p, errs } = await entrar(VISTA, 'berserker', 30, undefined, "d.id = 'auditoria1';");
  await p.evaluate((flags) => { for (const f of flags) { const [k, v] = f.split('='); window[k] = v === undefined ? true : +v; } setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; j.heroe.muerto = false; } }, 50); }, ('__topeOscuro=0.45,' + (process.env.BANDERAS || '')).split(',').filter(Boolean));
  const indice = [];
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 90000 }); await p.waitForTimeout(2500);
    const pts = await p.evaluate((FR) => { const j = window.__juego(), z = j.zona; z.explorado.fill(1);
      for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.__quieto = true; }
      const out = []; const e0 = z.entradas.arriba || Object.values(z.entradas)[0]; out.push({ sitio: 'entrada', cx: e0[0], cy: e0[1] });
      FR.forEach(([fx, fy], i) => out.push({ sitio: 'p' + (i + 1), cx: Math.floor(z.W * fx), cy: Math.floor(z.H * fy) }));
      const jf = z.spawns.find((s) => s.tipo === 'jefe'); if (jf) out.push({ sitio: 'jefe', cx: jf.cx + 3, cy: jf.cy + 3 });
      const hito = (z.lugares || []).find((l) => l.papel === 'hito'); if (hito) out.push({ sitio: 'hito', cx: hito.cx + 7, cy: hito.cy + 7 });
      return out; }, FR);
    for (const q of pts) {
      await p.evaluate(async (q) => { const j = window.__juego(), h = j.heroe, Z = await import('/src/mundo/zona.ts'); const c = Z.libreCerca(j.zona, q.cx, q.cy); h.x = c[0] + 0.5; h.y = c[1] + 0.5; h.camino = null; h.destino = null; h.objetivo = null; j.zona.explorado.fill(1);
        for (const m of j.monstruos) if (m.__quieto) { m.estado = 'dormido'; m.objetivo = null; } }, q);
      await p.waitForTimeout(1400);
      const f = `${zid}_${q.sitio}.png`; await p.screenshot({ path: `${DIR}/${f}` }); indice.push({ zid, f, ...q });
    }
  }
  fs.writeFileSync(`${DIR}/indice.json`, JSON.stringify(indice, null, 1));
  console.log('fotos', indice.length, 'errores', errs.slice(0, 3));
  await b.close();
})();
