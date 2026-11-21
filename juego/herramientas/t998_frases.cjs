// Las frases de jefes y campeones se apagan solas (Rick, 21 nov 2026: "diálogos emergentes que quedaron puestos, me pasó con
// un boss"). La cuenta de `hablaT` bajaba solo en los jefes y después de los return de sus maniobras: la frase de un jefe de
// zona o de un campeón quedaba pegada para siempre. Pone un jefe, un único y un campeón hablando y mira que a los 10 s callen.
// node juego/herramientas/t998_frases.cjs
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar('pc', 'templario', 30, undefined);
  await p.evaluate(() => window.__ir('a1_cata1')); await p.waitForTimeout(3500);
  await p.evaluate(async () => {
    const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
    h.vida = h.vidaMax = 1e7;
    const ids = [Object.values(D.MONSTRUOS).find((d) => d.jefe).id, 'esqueleto', 'zombi'];
    window.__hablan = ids.map((id, i) => { const m = M.crearMonstruo(D.MONSTRUOS[id], 10, h.x + 3 + i, h.y + 2, i === 1 ? 2 : i === 2 ? 1 : 0, 0); m.vida = m.vidaMax = 1e7; m.estado = 'perseguir'; m.objetivo = h; m.habla = 'Frase de prueba que no se debe quedar pegada.'; m.hablaT = 5; j.monstruos.push(m); return m; });
  });
  // (se espera en tiempo del juego, no del reloj: con la máquina cargada el juego corre más lento, dt tope 0,05 por cuadro)
  const esperarJuego = async (s) => { await p.evaluate(() => { window.__t998 = window.__juego().t; }); for (let i = 0; i < 600; i++) { await p.waitForTimeout(250); if (await p.evaluate((s) => window.__juego().t - window.__t998 >= s, s)) return; } };
  await esperarJuego(2);
  const antes = await p.evaluate(() => window.__hablan.map((m) => !!m.habla));
  await esperarJuego(9);
  const despues = await p.evaluate(() => window.__hablan.map((m) => !!m.habla));
  console.log('hablan a los 2 s', JSON.stringify(antes), 'a los 11 s', JSON.stringify(despues), despues.some(Boolean) ? 'MAL' : 'OK', errs.slice(0, 3));
  await b.close();
})();
