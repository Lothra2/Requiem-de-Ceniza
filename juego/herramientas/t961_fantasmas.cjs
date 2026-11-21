// Los fantasmas (21 nov 2026): Vesperio espera delante del hito de cuatro mundos de los actos 6 y 7 solo después de morir en
// la Fragua, dice todas sus líneas (y espera si te vas), queda en el Códice y su línea entra al epílogo; los demás esperan en
// el desvío del mundo abierto. Capturas en /tmp/requiem-pruebas/fantasmas.
//   node juego/herramientas/t961_fantasmas.cjs [pc|movil]   (BANDERAS=__fantasmasViejos para el antes)
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const DIR = '/tmp/requiem-pruebas/fantasmas';
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const vista = process.argv[2] || 'pc';
  const { b, p, errs } = await entrar(vista, 'nigromante', 70);
  for (const f of (process.env.BANDERAS || '').split(',').filter(Boolean)) await p.evaluate((f) => { window[f] = true; }, f);
  const foto = (n) => p.screenshot({ path: `${DIR}/${vista}_${n}.png` });
  const t = () => p.evaluate(() => window.__juego().t);
  const esperarJuego = async (s) => { const t0 = await t(); for (let i = 0; i < 400 && (await t()) - t0 < s; i++) await p.waitForTimeout(100); };
  const limpiar = () => p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.vida = h.vidaMax = 1e7; j.zona.oscuridad = 0.3; j.monstruos.forEach((o) => { if (!o.dueno) { o.vida = 0; o.muerto = true; o.tMuerto = 999; } }); });
  const fallos = [], out = { zonas: {} };
  const ir = async (z) => { await p.evaluate((z) => window.__ir(z), z); await esperarJuego(2.5); await limpiar(); };
  const fantasmasDe = () => p.evaluate(() => (window.__juego().zona.fantasmas || []).map((f) => ({ id: f.id, x: f.x, y: f.y, estado: f.estado, i: f.i, n: f.lineas.length })));

  // 1. sin Vesperio muerto no sale
  await p.evaluate(() => { const d = window.__juego().heroe.d; d.heraldoMuerto = false; d.fantasmas = []; });
  await ir('a6_barrio2');
  const antes = await fantasmasDe(); out.sinHeraldo = antes;
  if (antes.some((f) => f.id.startsWith('v_'))) fallos.push('Vesperio salió sin haber muerto en la Fragua');

  // 2. con Vesperio muerto, en sus cuatro sitios
  await p.evaluate(() => { window.__juego().heroe.d.heraldoMuerto = true; });
  for (const z of ['a6_costa', 'a6_barrio2', 'a7_cielo', 'a7_jardin', 'a1_bosque']) {
    await p.evaluate(() => { delete window.__juego().zona.fantasmas; });
    await ir(z);
    await p.evaluate(() => { delete window.__juego().zona.fantasmas; });
    await ir(z);
    const fs_ = await fantasmasDe(), lug = await p.evaluate(() => (window.__juego().zona.lugares || []).map((l) => ({ papel: l.papel, cx: l.cx, cy: l.cy })));
    const f = fs_[0]; if (!f) { fallos.push(`${z}: sin fantasma`); continue; }
    const hito = lug.find((l) => l.papel === (z === 'a1_bosque' ? 'desvio' : 'hito'));
    const dl = hito ? Math.hypot(f.x - hito.cx, f.y - hito.cy) : -1;
    out.zonas[z] = { id: f.id, lineas: f.n, junto: hito?.papel, dist: +dl.toFixed(1) };
    if (!hito || dl > 12) fallos.push(`${z}: el fantasma queda a ${dl.toFixed(1)} de su ${hito?.papel ?? 'lugar'}`);
    // el héroe llega de frente, a 4 casillas
    await p.evaluate(([x, y]) => { const j = window.__juego(), h = j.heroe, Z = j.zona; for (const [dx, dy] of [[3, 3], [4, 0], [0, 4], [-3, 3], [3, -3], [-4, 0], [0, -4]]) { const X = x + dx, Y = y + dy; if (!Z.bloq[Math.floor(Y) * Z.tw + Math.floor(X)]) { h.x = X; h.y = Y; h.camino = null; return; } } }, [f.x, f.y]);
    await esperarJuego(1.5); await foto(`${z}_1`);
    // se va lejos a mitad: el que tiene más que decir espera
    if (f.n > 1) {
      await esperarJuego(f.n > 1 ? 6.5 : 0);
      const i0 = (await fantasmasDe())[0].i; await foto(`${z}_2`);
      await p.evaluate(([x, y]) => { const j = window.__juego(), h = j.heroe; h.x = x + 30; h.y = y; }, [f.x, f.y]);
      await esperarJuego(12);
      const i1 = (await fantasmasDe())[0]; if (i1.i !== i0 || i1.estado !== 'habla') fallos.push(`${z}: siguió hablando solo (${i0} a ${i1.i}, ${i1.estado})`);
      await p.evaluate(([x, y]) => { const j = window.__juego(), h = j.heroe; h.x = x + 3; h.y = y + 3; }, [f.x, f.y]);
    }
    for (let k = 0; k < 60; k++) { await esperarJuego(1); const g = (await fantasmasDe())[0]; if (k === 3) await foto(`${z}_3`); if (g.estado === 'ido') break; }
    const g = (await fantasmasDe())[0]; if (g.estado !== 'ido') fallos.push(`${z}: no terminó (${g.estado}, línea ${g.i})`);
  }
  out.oidos = await p.evaluate(() => window.__juego().heroe.d.fantasmas);
  for (const id of ['v_costa', 'v_barrio', 'v_cielo', 'v_jardin']) if (!out.oidos.includes(id)) fallos.push(`no quedó anotado ${id}`);
  out.ecos = await p.evaluate(() => window.__ecosFinal().map((e) => e[0].slice(0, 50)));
  if (!out.ecos.some((e) => e.startsWith('En Santa Oria'))) fallos.push('la línea de Vesperio no entra al epílogo');
  // el epílogo con la línea de Vesperio (la segunda antes de la última: buscarla por tiempo)
  const nl = await p.evaluate(() => window.__ecosFinal().length);
  await p.evaluate(() => window.__finalT(0));
  for (let s = 0; s < 14; s++) { await p.evaluate((s) => window.__finalT(s * 7.5 + 3.5), s); await p.waitForTimeout(500); const shot = `final_${s}`; await foto(shot); }
  out.lineasEcos = nl;
  console.log(JSON.stringify(out, null, 1));
  console.log('errores', JSON.stringify(errs.slice(0, 5)));
  console.log(fallos.length ? 'MAL\n' + fallos.join('\n') : 'BIEN');
  await b.close();
})();
