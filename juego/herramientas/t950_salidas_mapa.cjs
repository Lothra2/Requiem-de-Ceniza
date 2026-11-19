// Salidas en el mapa, el minimapa y el mundo: subir, bajar, superficie, otra región, guarida, campamento y casa.
// node juego/herramientas/t950_salidas_mapa.cjs <etiqueta> [zonas]   (capturas en /tmp/requiem-pruebas/mapa)
// Por cada zona: el mapa grande, y por cada salida el mundo con el minimapa parado delante de ella.
// MISION=m1_abadesa (activa) por omisión. La zona se explora entera para la foto (TODO=0 la deja como está).
// Lámina: python3 juego/herramientas/t950_lamina.py antes despues
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const etq = process.argv[2] || 'prueba';
const zonas = (process.argv[3] || 'a1_cementerio,a1_abadia2,a1_cata1,a1_paramo').split(',');
const MISION = process.env.MISION ?? 'm1_abadesa';
const dir = '/tmp/requiem-pruebas/mapa'; fs.mkdirSync(dir, { recursive: true });
(async () => {
  const mis = `d.misiones = { m1_hambre: 3, m1_campanas: 3${MISION ? `, ${MISION}: 1` : ''} }; d.vida = 99999;`;
  const { b, p, errs } = await entrar(process.env.VISTA || 'pc', 'templario', 40, process.env.URL || 'http://127.0.0.1:5197/', mis);
  for (const zid of zonas) {
    await p.evaluate((z) => window.__ir(z), zid); await p.waitForTimeout(5000);
    const sal = await p.evaluate((todo) => { const j = window.__juego(), z = j.zona; if (todo) z.explorado.fill(1);
      j.monstruos.forEach((m) => { if (!m.def.jefe) m.muerto = true; });
      return z.salidas.map((s) => ({ destino: s.destino, cx: s.cx, cy: s.cy, e: z.entradas['salida_' + s.destino] })); }, process.env.TODO !== '0');
    console.log(zid, JSON.stringify(sal.map((s) => s.destino)));
    for (const s of sal) {
      await p.evaluate((s) => { const j = window.__juego(), h = j.heroe, e = s.e || [s.cx, s.cy + 3]; h.x = e[0] + 0.5; h.y = e[1] + 1.5; h.camino = null; j.monstruos.forEach((m) => { if (!m.def.jefe) m.muerto = true; }); window.__ui.mapa = false; }, s);
      await p.waitForTimeout(1600);
      await p.screenshot({ path: `${dir}/${etq}_${zid}_mundo_${s.destino}.png` });
    }
    await p.evaluate(() => { window.__ui.mapa = true; }); await p.waitForTimeout(700);
    await p.screenshot({ path: `${dir}/${etq}_${zid}_mapa.png` });
    await p.evaluate(() => { window.__ui.mapa = false; });
  }
  console.log(errs.length ? 'errores: ' + errs.slice(0, 5).join(' | ') : 'sin errores');
  await b.close();
})();
