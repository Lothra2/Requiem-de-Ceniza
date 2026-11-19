// Opciones, HUD: por omisión el forjado; elegir Clásico vuelve a la barra de siempre, se guarda (opciones.hud =
// 'clasico', campo opcional) y sigue igual después de recargar; elegir Forjado lo vuelve a prender.
// Uso: node juego/herramientas/t954_hud_opcion.cjs [pc|movil]   (capturas en /tmp/requiem-pruebas/hud/opcion_*.png)
const { entrar } = require('./comun_pruebas.cjs');
const V = process.argv[2] || 'pc';
(async () => {
  const { b, p, L, tap, errs } = await entrar(V, 'berserker', 12);
  const OUT = '/tmp/requiem-pruebas/hud';
  // ¿qué HUD se ve? (__hudVisto: el que dibujó main.ts en el último cuadro)
  const cual = async () => { await p.waitForTimeout(600); return p.evaluate(() => window.__hudVisto); };
  const res = { omision: await cual(), guardadoAntes: await p.evaluate(() => JSON.parse(localStorage.getItem('marca.opciones') || '{}').hud ?? null) };
  await p.screenshot({ path: `${OUT}/opcion_${V}_omision.png` });
  // Opciones desde el juego (lo mismo que Pausa, Opciones): la fila del HUD
  const abrir = async () => { await p.evaluate(() => { window.__U.ui.izq = null; window.__juego().eventos.push({ tipo: 'opciones' }); });
    for (let i = 0; i < 20 && (await p.evaluate(() => window.__estado())) !== 'opciones'; i++) await p.waitForTimeout(250); await p.waitForTimeout(400); };
  await abrir(); res.estado = await p.evaluate(() => window.__estado());
  const pant = await p.evaluate(() => window.__pantalla);
  res.filaHud = !!(pant && pant.hud0 && pant.hud1);
  // ¿la losa entra en la pantalla? la última fila y Volver adentro
  res.entra = pant ? Object.values(pant).every(([x, y]) => y > 0 && y < L.H && x > 0 && x < L.W) : false;
  await p.screenshot({ path: `${OUT}/opcion_${V}_menu.png` });
  if (pant && pant.hud1) { await tap(pant.hud1[0], pant.hud1[1]); await p.waitForTimeout(300); }
  res.guardado = await p.evaluate(() => JSON.parse(localStorage.getItem('marca.opciones') || '{}').hud ?? null);
  await p.screenshot({ path: `${OUT}/opcion_${V}_menu_clasico.png` });
  { const v = await p.evaluate(() => window.__pantalla.volver); await tap(v[0], v[1]); await p.waitForTimeout(800); }
  for (let i = 0; i < 10 && (await p.evaluate(() => window.__estado())) !== 'juego'; i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
  res.trasElegir = await cual();
  await p.screenshot({ path: `${OUT}/opcion_${V}_clasico.png` });
  // recargar: sigue la barra de siempre
  await p.reload(); for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; }
  await p.waitForTimeout(4800);
  { const c = await p.evaluate(() => window.__menuFilas.continuar); await tap(c[0], c[1]); }
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); if ((await p.evaluate(() => window.__estado())) === 'juego') break; }
  await p.waitForTimeout(1500);
  res.trasRecargar = await cual();
  await p.screenshot({ path: `${OUT}/opcion_${V}_recargado.png` });
  // y de vuelta al forjado
  await abrir(); { const q = await p.evaluate(() => window.__pantalla.hud0); if (q) { await tap(q[0], q[1]); await p.waitForTimeout(300); } }
  res.guardadoForja = await p.evaluate(() => JSON.parse(localStorage.getItem('marca.opciones') || '{}').hud ?? null);
  { const v = await p.evaluate(() => window.__pantalla.volver); await tap(v[0], v[1]); await p.waitForTimeout(800); }
  for (let i = 0; i < 10 && (await p.evaluate(() => window.__estado())) !== 'juego'; i++) { await p.keyboard.press('Escape'); await p.waitForTimeout(400); }
  res.deVuelta = await cual();
  res.heroes = await p.evaluate(() => (JSON.parse(localStorage.getItem('marca.heroes') || '[]')[0] || {}).clase);
  console.log(JSON.stringify(res), 'errores', errs.slice(0, 3));
  const ok = res.omision === 'forjado' && res.filaHud && res.guardado === 'clasico' && res.trasElegir === 'clasico' && res.trasRecargar === 'clasico' && res.guardadoForja === 'forja' && res.deVuelta === 'forjado';
  console.log(ok ? 'BIEN' : 'MAL');
  await b.close();
})().catch((e) => { console.error(e); process.exit(1); });
