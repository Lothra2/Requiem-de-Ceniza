// Las reliquias se ven con su aspecto propio: se viste un juego entero y se captura el inventario (casillas y muñeco) y el héroe en el mundo.
const { entrar } = require('./comun_pruebas.cjs');
const JUEGOS = {
  bajo: { cabeza: 'capucha_que_volvio', torso: 'jubon_sobreviviente', manos: 'manos_enterrador', pies: 'botas_mensajero', cinturon: 'faja_abuela', izq: 'tapa_caldero', arma: 'juramento_novicio' },
  medio: { cabeza: 'yelmo_centinela_dormido', torso: 'coraza_herrero_ciego', manos: 'brazales_escriba_guerra', pies: 'botas_jinete_sin_caballo', cinturon: 'cinturon_sargento', izq: 'cometa_cruzado_nino', arma: 'partetroncos' },
  alto: { cabeza: 'corona_ascua_viva', torso: 'mortaja_ultimo_rey', manos: 'punos_verdugo_mayor', pies: 'pasos_sobre_brasa', cinturon: 'cenidor_coloso', izq: 'amanecer_santa_oria', arma: 'lapida' },
};
(async () => {
  for (const nom of (process.argv[2] || 'bajo,medio,alto').split(',')) {
    const { b, p, errs } = await entrar('pc', 'templario', 90, undefined, 'd.fue = 400; d.des = 300;');
    await p.waitForTimeout(2000);
    const r = await p.evaluate((jg) => { const T = window.__T, j = window.__juego(), d = j.heroe.d, mal = []; for (const [cas, id] of Object.entries(jg)) { const o = T.O.crearUnicoId(id, 90); if (!o) { mal.push(id); continue; } d.equipo[cas] = o; } window.__mundo.recalc(j); return mal; }, JUEGOS[nom]);
    for (let i = 0; i < 120; i++) { await p.waitForTimeout(1000); if (i > 10 && (await p.evaluate(() => window.__T.P.progresoPintura)) >= 1) break; }
    await p.waitForTimeout(3000);
    await p.screenshot({ path: `/tmp/requiem-pruebas/rel_${nom}_mundo.png`, clip: { x: 540, y: 190, width: 200, height: 220 } });
    await p.keyboard.press('i'); await p.waitForTimeout(3000);
    await p.screenshot({ path: `/tmp/requiem-pruebas/rel_${nom}_inv.png`, clip: { x: 960, y: 80, width: 320, height: 300 } });
    console.log(nom, 'sin crear:', r, errs.filter((e) => !/404/.test(e)).slice(0, 2)); await b.close();
  }
})();
