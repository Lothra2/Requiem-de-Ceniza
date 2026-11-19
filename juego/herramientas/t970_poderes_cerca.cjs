// De cerca y cuadro a cuadro (reloj del juego controlado, 25 por segundo): el Rayo saltarín contra seis zombis
// regados (para que se vean los saltos), el mismo rayo al piso sin nadie a tiro, y la Combustión sobre un grupo a tres
// casillas. Uso: node t970_poderes_cerca.cjs <etiqueta> [rayo,suelo,combustion] (capturas en
// /tmp/requiem-pruebas/poderes/cerca/<etiqueta>; también hab:<id> para cualquier poder; `python3 t970_lamina.py <etiqueta> [otra]` arma las tiras).
// `VIEJO=1` prende `__sinPoderesVivos` (el dibujo de antes, con la lógica de ahora).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const et = process.argv[2] || 'ahora', que = (process.argv[3] || 'rayo,suelo,combustion').split(',');
  const D = `/tmp/requiem-pruebas/poderes/cerca/${et}`; fs.mkdirSync(D, { recursive: true });
  const { b, p, errs } = await entrar('pc', process.env.CLASE || 'arcanista', 30);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  await p.evaluate(async (viejo) => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; window.__sinAmbientePfx = true; if (viejo) window.__sinPoderesVivos = true; let mejor = null, md = -99;
    for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -7; dy <= 7 && libre; dy++) for (let dx = -7; dx <= 7; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); for (const sa of z.salidas) d = Math.min(d, Math.hypot(sa.cx - x, sa.cy - y) - 4); if (d > md) { md = d; mejor = [x, y]; } }
    h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y];
    z.objetos = z.objetos.filter((o) => Math.hypot(o.cx + 0.5 - h.x, o.cy + 0.5 - h.y) > 14);
    const C = await import('/src/datos/clases.ts'); for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; }, !!process.env.VIEJO);
  await p.waitForTimeout(2500);
  const limpiar = () => p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.acc = 'quieto'; h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.buffs = {}; h.dir = 'se';
    (h.d.thor ??= {}).descanso = 1e9; j.sacudida = 0; j.congela = 0; j.monstruos = []; j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.manchas.length = 0; window.__apagarSuelos?.(); });
  // zombis: [dx, dy] desde el héroe
  const poner = (pos) => p.evaluate(async (pos) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, Dm = await import('/src/datos/monstruos.ts');
    window.__ms = pos.map(([dx, dy]) => { const m = M.crearMonstruo(Dm.MONSTRUOS['zombi'], 10, h.x + dx, h.y + dy, 0, 0); m.vida = m.vidaMax = 1e5; m.estado = 'dormido'; j.monstruos.push(m); return m; }); }, pos);
  // un ensayo en tiempo real de cada poder (que bajen los atlas y los paquetes de efectos) antes de congelar el reloj
  await limpiar(); await poner([[3, 0], [5, 2], [3, 4]]);
  for (const id of (process.env.CLASE ? que.filter((x) => x.startsWith('hab:')).map((x) => x.slice(4)) : ['rayo_cadena', 'combustion'])) { await p.evaluate((id) => { const j = window.__juego(), m = window.__ms[0]; j.heroe.recargas = {}; j.heroe.acc = 'quieto'; window.__mundo.usarHabilidad(j, id, m.x, m.y, m, false); }, id); await p.waitForTimeout(2500); }
  await p.waitForTimeout(8000); // (que el pintor termine al héroe: con el reloj quieto sale como silueta blanca)
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500)); for (let i = 0; i < 20; i++) await p.clock.runFor(40);
  const caja = { x: 640 - 240, y: 300 - 190, width: 560, height: 330 };
  const toma = async (nombre, prep, n) => {
    await limpiar(); await prep(); for (let i = 0; i < 8; i++) await p.clock.runFor(40);
    const t0 = await p.evaluate(() => window.__juego().t);
    await p.evaluate(() => { window.__lanzar(); });
    const datos = [];
    for (let i = 0; i < n; i++) { await p.clock.runFor(40); await p.screenshot({ path: `${D}/${nombre}_${String(i).padStart(2, '0')}.png`, clip: caja });
      datos.push(await p.evaluate((t0) => { const j = window.__juego(); return { t: +(j.t - t0).toFixed(2), arcos: j.efectos.filter((e) => e.id === 'arco_cadena').length, dano: (window.__ms ?? []).map((m) => Math.round(m.vidaMax - m.vida)), sac: +j.sacudida.toFixed(2) }; }, t0)); }
    fs.writeFileSync(`${D}/${nombre}.json`, JSON.stringify(datos)); console.log(nombre, JSON.stringify(datos[datos.length - 1]));
  };
  if (que.includes('rayo')) await toma('rayo', async () => { await poner([[3, -1.5], [6.5, 0.5], [4.5, 4], [8.5, 4.5], [2, 6.5], [9, -1]]);
    await p.evaluate(() => { window.__lanzar = () => { const j = window.__juego(), m = window.__ms[0]; window.__mundo.usarHabilidad(j, 'rayo_cadena', m.x, m.y, m, false); }; }); }, 22);
  if (que.includes('suelo')) await toma('suelo', async () => { await p.evaluate(() => { window.__ms = []; window.__lanzar = () => { const j = window.__juego(), h = j.heroe; window.__mundo.usarHabilidad(j, 'rayo_cadena', h.x + 4, h.y + 1, null, false); }; }); }, 16);
  if (que.includes('combustion')) await toma('combustion', async () => { await poner([[3.2, 0.4], [3.9, 1.2], [2.8, 1.5]]);
    await p.evaluate(() => { window.__lanzar = () => { const j = window.__juego(), m = window.__ms[0]; window.__mundo.usarHabilidad(j, 'combustion', m.x + 0.2, m.y + 0.4, null, false); }; }); }, 40);
  // cualquier otro poder de cerca: hab:<id> contra tres zombis a tres casillas (CLASE= para otra clase que el arcanista)
  for (const q of que.filter((x) => x.startsWith('hab:'))) { const id = q.slice(4);
    await toma(id, async () => { await poner([[3.2, 0.4], [3.9, 1.2], [2.8, 1.5]]);
      await p.evaluate((id) => { window.__lanzar = () => { const j = window.__juego(), m = window.__ms[0]; window.__mundo.usarHabilidad(j, id, m.x, m.y, m, false); }; }, id); }, 30); }
  console.log('errores', errs.filter((e) => !/404/.test(e)).slice(0, 3));
  await b.close();
})();
