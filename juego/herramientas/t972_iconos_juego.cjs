// Los íconos de habilidad en el juego: HUD forjado con los atajos llenos, el árbol de habilidades y la elección de
// poderes, por vista y clase. Capturas en /tmp/requiem-pruebas/iconos/juego_<vista>_<clase>_<que>.png
// Uso: node juego/herramientas/t972_iconos_juego.cjs [vistas: pc1080,ipad] [clases: arcanista,druida]
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const OUT = '/tmp/requiem-pruebas/iconos'; fs.mkdirSync(OUT, { recursive: true });
const VS = (process.argv[2] || 'pc1080,ipad').split(','), CL = (process.argv[3] || 'arcanista,druida').split(',');
(async () => {
  for (const v of VS) for (const cl of CL) {
    // todas las habilidades aprendidas y diez en los atajos (con una definitiva)
    const { b, p, errs } = await entrar(v, cl, 30, undefined, `d.puntosHab = 3;`);
    await p.evaluate(async (cl) => {
      const { HABILIDADES } = await import('/src/datos/clases.ts');
      const d = window.__juego().heroe.d, mias = HABILIDADES.filter((h) => h.clase === cl);
      for (const h of mias) d.habs[h.id] = h.definitiva ? 1 : 3;
      const usar = mias.filter((h) => h.tipo !== 'pasiva' && !h.forma);
      d.der = usar[2].id; d.atajos = usar.slice(0, 10).map((h) => h.id); const def = usar.find((h) => h.definitiva); if (def) d.atajos[9] = def.id;
    }, cl);
    await p.waitForTimeout(1500);
    await p.screenshot({ path: `${OUT}/juego_${v}_${cl}_hud.png` });
    await p.evaluate(() => { window.__ui.izq = 'habs'; });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/juego_${v}_${cl}_arbol.png` });
    await p.evaluate(() => { window.__ui.izq = null; window.__ui.der = 'elegirHab'; });
    await p.waitForTimeout(900);
    await p.screenshot({ path: `${OUT}/juego_${v}_${cl}_elegir.png` });
    const ms = await p.evaluate(() => window.__iconosHorneado);
    console.log(v, cl, 'horneado', JSON.stringify({ n: ms.n, ms: Math.round(ms.ms), max: +ms.max.toFixed(1), medio: +(ms.ms / Math.max(1, ms.n)).toFixed(2) }), errs.length ? errs.slice(0, 4) : 'sin errores');
    await b.close();
  }
})();
