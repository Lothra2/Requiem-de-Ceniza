// Vistas de un mundo sin pelea ni niebla, para revisar el trazado y la ambientación: en cada zona se para en cada lugar
// (claros, hito, garganta), en el jefe, en la entrada y en dos puntos del borde, con todo explorado y los monstruos quietos.
// Uso: node juego/herramientas/t1021_vistas.cjs <etiqueta> [zonas] (VISTA=pc|pc1080|movil, DIR=, MONSTRUOS=1 los deja, MAPA=1 abre el mapa grande al final)
// Salida: /tmp/requiem-pruebas/mundos2/vistas/<etiqueta>/<zona>_<n>_<sitio>.png e indice.json
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const etiqueta = process.argv[2] || 'ahora', VISTA = process.env.VISTA || 'pc';
const ZONAS = (process.argv[3] || 'a1_paramo,a1_bosque,a1_cementerio,a2_dunas').split(',');
const DIR = `${process.env.DIR || '/tmp/requiem-pruebas/mundos2/vistas'}/${etiqueta}`; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p, errs } = await entrar(VISTA, 'berserker', 30, undefined, "d.id = 'auditoria1';");
  await p.evaluate((flags) => { for (const f of flags) { const [k, v] = f.split('='); window[k] = v === undefined ? true : +v; } setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; j.heroe.muerto = false; } }, 50); }, (process.env.BANDERAS || '__topeOscuro=0.45').split(',').filter(Boolean));
  const indice = [];
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); await p.waitForTimeout(2500);
    const pts = await p.evaluate((dejar) => { const j = window.__juego(), z = j.zona; z.explorado.fill(1);
      if (!dejar) for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.__quieto = true; }
      const out = []; const e0 = Object.values(z.entradas)[0]; out.push({ sitio: 'entrada', cx: e0[0], cy: e0[1] });
      for (const l of z.lugares || []) out.push({ sitio: l.papel + (l.escena ? '_' + l.escena : ''), cx: l.cx, cy: l.cy, nombre: l.nombre && l.nombre[0] });
      const jf = z.spawns.find((s) => s.tipo === 'jefe'); if (jf && !(z.lugares || []).length) out.push({ sitio: 'jefe', cx: jf.cx, cy: jf.cy });
      if (!(z.lugares || []).length) { const sp = z.spawns.filter((s) => s.tipo !== 'jefe').slice(0, 3); sp.forEach((s, i) => out.push({ sitio: 'campamento' + i, cx: s.cx, cy: s.cy })); }
      for (const s of z.salidas.slice(0, 2)) out.push({ sitio: 'salida', cx: s.cx, cy: s.cy + 4 });
      return out; }, !!process.env.MONSTRUOS);
    let n = 0;
    for (const q of pts) {
      await p.evaluate(async (q) => { const j = window.__juego(), h = j.heroe, Z = await import('/src/mundo/zona.ts'); const c = Z.libreCerca(j.zona, q.cx, q.cy + 1); h.x = c[0] + 0.5; h.y = c[1] + 0.5; h.camino = null; h.destino = null; h.objetivo = null; j.zona.explorado.fill(1);
        if (!window.__dejarMon) for (const m of j.monstruos) if (m.__quieto) { m.estado = 'dormido'; m.objetivo = null; } }, q);
      await p.waitForTimeout(1500);
      const f = `${zid}_${n++}_${q.sitio}.png`; await p.screenshot({ path: `${DIR}/${f}` }); indice.push({ zid, f, ...q });
    }
    if (process.env.MAPA) { await p.keyboard.press('Tab'); await p.waitForTimeout(900); await p.screenshot({ path: `${DIR}/${zid}_mapa.png` }); await p.keyboard.press('Tab'); await p.waitForTimeout(300); }
  }
  fs.writeFileSync(`${DIR}/indice.json`, JSON.stringify(indice, null, 1));
  console.log('vistas', indice.length, 'errores', errs.slice(0, 3));
  await b.close();
})();
