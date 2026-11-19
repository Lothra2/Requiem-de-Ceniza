// La historia en el juego: los restos de una matanza se leen (clic de verdad), la voz de la Marca al entrar al camposanto y
// la frase del jefe de la zona en la Cripta (Ívola). Capturas en /tmp/requiem-pruebas/historia.
//   node juego/herramientas/t960_historia.cjs [pc|movil]
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const DIR = '/tmp/requiem-pruebas/historia';
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const vista = process.argv[2] || 'pc';
  const { b, p, errs } = await entrar(vista, 'berserker', 30);
  const foto = (n) => p.screenshot({ path: `${DIR}/${vista}_${n}.png` });
  const limpiar = () => p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.vida = h.vidaMax = 1e6; j.zona.oscuridad = 0.25; j.monstruos.forEach((o) => { if (!o.dueno && !o.jefeZona && !(o.def.jefe)) { o.vida = 0; o.muerto = true; o.tMuerto = 999; } }); });
  const out = {};

  // 1. restos: la zona del heraldo del acto 1 trae la carta de Vesperio
  await p.evaluate(() => window.__ir('a1_cata1')); await p.waitForTimeout(4500); await limpiar();
  out.restos = await p.evaluate(() => window.__juego().zona.objetos.filter((o) => o.tag === 'restos').map((o) => ({ id: o.id, cx: o.cx, cy: o.cy, ...o.dato })));
  const carta = out.restos.find((r) => r.i === 3) ?? out.restos[0];
  if (carta) {
    // el héroe a dos pasos, el ratón sobre el bulto, el letrero, y el clic
    await p.evaluate(([x, y]) => { const j = window.__juego(), h = j.heroe, Z = j.zona; for (const [dx, dy] of [[0, 3], [2, 2], [-2, 2], [3, 0], [-3, 0], [0, -3]]) { const X = x + dx, Y = y + dy; if (Z.bloq[Math.floor(Y) * Z.W + Math.floor(X)] === 0) { h.x = X + 0.5; h.y = Y + 0.5; break; } } h.camino = null; }, [carta.cx, carta.cy]);
    await p.waitForTimeout(1200);
    const [sx, sy] = await p.evaluate(([x, y]) => window.__aPant(x + 0.5, y + 0.5), [carta.cx, carta.cy]);
    let hit = null;
    for (const dy of [-14, -24, -8, -34, -44, 0]) { await p.mouse.move(sx, sy + dy); await p.waitForTimeout(150); if (vista !== 'pc') break; await p.mouse.move(sx, sy + dy); await p.waitForTimeout(150); hit = dy; break; }
    await foto('1_restos_encima');
    if (vista === 'pc') await p.mouse.click(sx, sy + hit); else await p.touchscreen.tap(sx, sy - 14);
    await p.waitForTimeout(2500);
    out.panel = await p.evaluate(() => ({ izq: window.__ui.izq, panel: window.__ui.paginaPanel, titulo: window.__ui.paginaTitulo, sub: window.__ui.paginaSub }));
    if (out.panel.izq !== 'pagina') { out.clicFallo = true; await p.evaluate(([x, y]) => { const o = window.__juego().zona.objetos.find((q) => q.cx === x && q.cy === y && q.tag === 'restos'); window.__usar(o); }, [carta.cx, carta.cy]); await p.waitForTimeout(500); out.panel = await p.evaluate(() => ({ izq: window.__ui.izq, panel: window.__ui.paginaPanel, titulo: window.__ui.paginaTitulo, sub: window.__ui.paginaSub })); }
    await foto('2_restos_pagina');
    out.codiceRestos = await p.evaluate(() => window.__juego().heroe.d.restos);
    await p.evaluate(() => { window.__ui.izq = null; });
  }

  // 2. la voz de la Marca al entrar al camposanto
  await p.evaluate(() => window.__ir('a1_cementerio'));
  const tEco = () => p.evaluate(() => ((window.__juego().ecos || []).find((e) => e.sigue) || { t: -9 }).t);
  for (let i = 0; i < 60 && (await tEco()) < 1.5; i++) await p.waitForTimeout(250);
  await foto('3_voz_marca');
  for (let i = 0; i < 60 && (await tEco()) < 5; i++) await p.waitForTimeout(250);
  await foto('4_voz_marca_tarde');
  out.ecos = await p.evaluate(() => (window.__juego().ecos || []).map((e) => e.txt[0].slice(0, 40)));

  // 3. la frase del jefe de la zona (Ívola, en la Cripta)
  await p.evaluate(() => window.__ir('a1_cripta')); await p.waitForTimeout(4500); await limpiar();
  out.jefe = await p.evaluate(() => { const j = window.__juego(), h = j.heroe, m = j.monstruos.find((q) => q.jefeZona); if (!m) return null; const Z = j.zona; for (let r = 3; r < 7; r++) for (let a = 0; a < 16; a++) { const X = m.x + Math.cos(a / 16 * 6.28) * r, Y = m.y + Math.sin(a / 16 * 6.28) * r; if (Z.bloq[Math.floor(Y) * Z.W + Math.floor(X)] === 0) { h.x = X; h.y = Y; return { id: m.def.id, nombre: m.nombre[0] }; } } return { id: m.def.id, sinLugar: true }; });
  for (let i = 0; i < 40; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => { const m = window.__juego().monstruos.find((q) => q.jefeZona); return m && m.habla && m.hablaT < 5.2; })) break; }
  await foto('5_jefe_zona');
  out.habla = await p.evaluate(() => { const m = window.__juego().monstruos.find((q) => q.jefeZona); return m && { habla: m.habla, t: m.hablaT }; });
  await p.waitForTimeout(2500); await foto('6_jefe_zona_tarde');

  console.log(JSON.stringify(out, null, 1));
  console.log('errores', JSON.stringify(errs.slice(0, 5)));
  await b.close();
})();
