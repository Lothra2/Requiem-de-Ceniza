// Fotos de los adornos (con t920_adornos.cjs): entra a cada zona con un héroe de id fijo (la misma semilla en cada corrida),
// sin oscuridad ni niebla y sin monstruos, y fotografía la vista más cargada de adornos, la de un cofre y la de la entrada.
// Uso: node juego/herramientas/t921_adornos_fotos.cjs <etiqueta> [zona,zona,...]   (URL= otro puerto)
// La primera corrida guarda los puntos en /tmp/requiem-pruebas/adornos/puntos.json y las siguientes vuelven a los mismos
// (PUNTOS=nuevo para elegirlos otra vez). SIN_CURAR=1 apaga `curarAdornos` (el antes). Lámina: t921_lamina.py <antes> <ahora>.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const DIR = '/tmp/requiem-pruebas/adornos', ETQ = process.argv[2] || 'ahora';
const ZONAS = (process.argv[3] || 'a1_paramo,a1_bosque,a1_cementerio,a1_cripta,a1_cata1,a1_abadia1,a2_dunas,a2_tumbas1,a2_ruinas,a3_selva,a3_templo1,a4_picos,a4_hielo2,a5_fragua,a5_llanuras,a6_costa,a7_trono,a7_boveda').split(',');
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const fPuntos = DIR + '/puntos.json', guardados = !process.env.PUNTOS && fs.existsSync(fPuntos) ? JSON.parse(fs.readFileSync(fPuntos, 'utf8')) : {};
  const { b, p, errs } = await entrar('pc', 'berserker', 30, undefined, "d.id = 'adornos1';");
  await p.evaluate((sin) => { window.__topeOscuro = 0; window.__sinCurar = sin; }, !!process.env.SIN_CURAR);
  const res = [];
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid); await p.waitForTimeout(3000);
    let pts = guardados[zid];
    if (!pts) pts = guardados[zid] = await p.evaluate(() => {
      const j = window.__juego(), z = j.zona, W = z.W, H = z.H;
      const est = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|borde|puente|riel|isla|rio_|arroyo|dec_escalon|^casa_|esquina/;
      const ch = z.objetos.filter((o) => o.capa !== 'relleno' && !est.test(o.id) && o.hw * o.hh <= 9 && z.pisos[Math.floor(o.cy / 5) * z.tw + Math.floor(o.cx / 5)]);
      let best = 0, bp = [W / 2, H / 2];
      for (let y = 8; y < H - 8; y += 2) for (let x = 8; x < W - 8; x += 2) { let n = 0; for (const o of ch) if (Math.abs(o.cx - x) < 7 && Math.abs(o.cy - y) < 7) n++; if (n > best) { best = n; bp = [x, y]; } }
      const cof = z.objetos.filter((o) => o.tag === 'cofre');
      // el cofre con otro más cerca (los pares), o el primero
      let cp = null, cd = 1e9; for (const a of cof) for (const c of cof) if (a !== c) { const d = Math.hypot(a.cx - c.cx, a.cy - c.cy); if (d < cd) { cd = d; cp = [(a.cx + c.cx) / 2, (a.cy + c.cy) / 2]; } }
      if (!cp && cof[0]) cp = [cof[0].cx, cof[0].cy];
      const e = z.entradas.arriba ?? Object.values(z.entradas)[0];
      return [{ n: 'cargado', x: bp[0], y: bp[1] }, ...(cp ? [{ n: 'cofre', x: cp[0], y: cp[1] }] : []), { n: 'entrada', x: e[0], y: e[1] }];
    });
    for (const q of pts) {
      await p.evaluate((q) => { const j = window.__juego(), z = j.zona, h = j.heroe; j.monstruos.length = 0; z.explorado.fill(1); h.x = q.x + 0.5; h.y = q.y + 0.5; h.camino = []; h.destino = null; }, q);
      await p.waitForTimeout(1400);
      const nom = `${DIR}/${ETQ}_${zid}_${q.n}.png`; await p.screenshot({ path: nom }); res.push(nom);
    }
    const cuenta = await p.evaluate(() => { const z = window.__juego().zona; return { objetos: z.objetos.length, cofres: z.objetos.filter((o) => o.tag === 'cofre').length }; });
    console.log(zid, JSON.stringify(cuenta));
  }
  fs.writeFileSync(fPuntos, JSON.stringify(guardados));
  console.log(res.length, 'fotos'); console.log(errs.filter((e) => !/404/.test(e)).slice(0, 5));
  await b.close();
})();
