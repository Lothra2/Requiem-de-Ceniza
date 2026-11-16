// Con el equipo de salida, el héroe camina en los 16 rumbos y a 24 cuadros desde el primer paso (horneado, sin esperar al pintor).
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  for (const clase of (process.argv[2] || 'berserker,arcanista').split(',')) {
    const { b, p, errs } = await entrar(process.argv[3] || 'movil', clase, 1);
    await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
    const vistos = new Set(); let medios = 0, n = 0;
    // camina hacia 16 puntos alrededor (cada 22,5°) y anota qué rumbo usa el dibujo
    for (let k = 0; k < 16; k++) {
      await p.evaluate((k) => { const j = window.__juego(), h = j.heroe, a = (k * Math.PI) / 8; window.__mundo.caminarA ? window.__mundo.caminarA(j, h.x + Math.cos(a) * 3, h.y + Math.sin(a) * 3) : null; }, k);
      await p.waitForTimeout(700);
      const r = await p.evaluate(() => ({ f: window.__fino, m: window.__medios, fin: window.__finos || 0 }));
      vistos.add(r.f); if (r.m) medios++; n++;
    }
    console.log(clase, 'rumbos usados', [...vistos].sort((a, b) => a - b).join(','), 'impares', [...vistos].filter((x) => x % 2 === 1).length, 'con medios cuadros', medios + '/' + n, 'pintados por el aparato', await p.evaluate(() => window.__finos || 0), errs.filter((e) => !/404/.test(e)).slice(0, 2));
    await b.close();
  }
})();
