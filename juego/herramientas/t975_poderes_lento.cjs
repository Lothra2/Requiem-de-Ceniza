// De cerca y en cámara lenta (tercera pasada de poderes, 19 nov 2026): cada poder pedido contra tres zombis, con el juego a
// `LENTO` de su velocidad (0,1 por omisión, `__camaraLenta`) y el pintor del héroe vivo (con el reloj quieto de t970 el
// héroe sale como silueta blanca y tapa lo que se quiere ver). Toma `N` cuadros (24) cada `PASO` segundos de juego (0,04).
// Uso: node t975_poderes_lento.cjs <clase> <etiqueta> <id,id,...> y python3 t975_lamina.py <etiqueta> [otra] arma las tiras
// en /tmp/requiem-pruebas/poderes4/cerca. CERCA=1 los zombis pegados (cuerpo a cuerpo), FIN=1 termina la mejora a mitad,
// ZONA= otra zona (a2_dunas por omisión: pleno día), VIEJO=1 con `__sinPresencias` y `__sinTajos` (lo de antes), FOGONAZO=1 además los fogonazos y la luz de los poderes
// parejos de día y de noche (`__fogonazoParejo`, lo de antes de la tercera pasada).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const [clase, et, lista] = process.argv.slice(2); const ids = (lista || '').split(',').filter(Boolean);
  const D = `/tmp/requiem-pruebas/poderes4/cerca/${et}`; fs.mkdirSync(D, { recursive: true });
  const LENTO = +(process.env.LENTO || 0.1), N = +(process.env.N || 24), PASO = +(process.env.PASO || 0.04);
  const { b, p, errs } = await entrar('pc', clase, 30);
  const ZONA = process.env.ZONA || 'a2_dunas';
  // (a veces la zona tarda: se espera a estar adentro antes de buscar el sitio)
  for (let k = 0; k < 3; k++) { await p.evaluate((z) => window.__ir(z), ZONA); await p.waitForTimeout(4500); if (await p.evaluate((z) => window.__juego().zona.id === z, ZONA)) break; }
  await p.evaluate(async ([viejo]) => { const j = window.__juego(), z = j.zona, h = j.heroe; j.portal = null; window.__sinLluvia = true; window.__sinAmbientePfx = true; if (viejo) { window.__sinPresencias = true; window.__sinTajos = true; } if (viejo === 2) window.__fogonazoParejo = true; let mejor = null, md = -99;
    for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -7; dy <= 7 && libre; dy++) for (let dx = -7; dx <= 7; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); for (const sa of z.salidas) d = Math.min(d, Math.hypot(sa.cx - x, sa.cy - y) - 4); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) mejor = [Math.floor(h.x), Math.floor(h.y)]; h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y];
    z.objetos = z.objetos.filter((o) => Math.hypot(o.cx + 0.5 - h.x, o.cy + 0.5 - h.y) > 14);
    const C = await import('/src/datos/clases.ts'); for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; }, [process.env.FOGONAZO ? 2 : !!process.env.VIEJO]);
  await p.waitForTimeout(2500);
  // con ESCUDO=1 el héroe lleva un escudo (el Golpe de escudo lo pide) y se espera al pintor para que se vea puesto
  if (process.env.ESCUDO) { await p.evaluate(() => { const T = window.__T, j = window.__juego(), d = j.heroe.d, b = T.D.BASES.find((x) => x.id === 'escudo_cometa') || T.D.BASES.find((x) => x.ranura === 'izq'); d.equipo.izq = T.O.crearBase(b, 12); window.__mundo.recalc(j); j.monstruos = []; j.heroe.vida = j.heroe.vidaMax = 1e9; }); await p.waitForTimeout(+(process.env.ESPERA_PINTOR || 45000)); }
  const caja = { x: 640 - 200, y: 300 - 170, width: 400, height: 260 };
  for (const id of ids) {
    await p.evaluate(async ([id, cerca]) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, C = await import('/src/datos/clases.ts'), Dm = await import('/src/datos/monstruos.ts'), hb = C.HABILIDADES.find((x) => x.id === id);
      window.__camaraLenta = 1;
      j.portal = null;       h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.objetivo = null; h.acc = 'quieto'; h.t = 0; h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.buffs = {}; h.dir = 'se';
      h.d.aura = null; h.escudoHueso = 0; h.tempestad = 0; h.huracan = 0; h.torbellino = 0; h.furia = 100; h.furiaFija = 0; h.frascos = 9; h.salto = null; h.congelado = 0; h.aturdido = 0; h.combo = { paso: 0, t: -9 }; h.cargas = ['fuego', 'frio', 'rayo'];
      if (hb.forma) h.buffs[hb.forma === 'oso' ? 'forma_oso' : 'forma_lobo'] = { t: 30, bonos: {}, hab: 'x' };
      M.recalc(j); (h.d.thor ??= {}).descanso = 1e9;
      j.sacudida = 0; j.congela = 0; j.patada = null; j.monstruos = []; j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.manchas.length = 0; j.torretas.length = 0; j.cuervos.length = 0;
      if (j.cadenas) j.cadenas.length = 0; if (j.golpesPoder) j.golpesPoder.length = 0; if (j.caidas) j.caidas.length = 0; window.__apagarSuelos?.(); for (const f of window.__limpiadores ?? []) f();
      const pos = cerca ? [[1.15, 0.25], [1.7, 0.9], [0.8, 1.3]] : [[3.2, 0.4], [3.9, 1.2], [2.8, 1.5]];
      window.__ms = pos.map(([dx, dy]) => { const m = M.crearMonstruo(Dm.MONSTRUOS['zombi'], 10, h.x + dx, h.y + dy, 0, 0); m.vida = m.vidaMax = 1e5; m.estado = 'dormido'; j.monstruos.push(m); return m; });
      if (hb.tipo === 'invocar' || hb.efecto === 'cadaver') for (let i = 0; i < 4; i++) { const cad = hb.efecto === 'cadaver', c = M.crearMonstruo(Dm.MONSTRUOS['zombi'], 10, h.x + (cad ? 1.5 : 1.6) + (i % 2) * 0.9, h.y + (cad ? -1.3 : 1.4) + (i >> 1) * (cad ? -0.8 : 0.8), 0, 0); c.vida = 0; c.muerto = true; c.estado = 'dormido'; c.acc = 'morir'; c.t = 5; c.tMuerto = 5; j.monstruos.push(c); }
      window.__pisar = null;
      // los que piden un siervo vivo: la Ofrenda sus esqueletos y la Picada el halcón
      const pide = id === 'ofrenda' ? 'alzar_esqueleto' : id === 'picada' ? 'llamar_halcon' : null;
      if (pide) { M.usarHabilidad(j, pide, h.x + 1.2, h.y + 1.2, null, false); if (id === 'ofrenda') { h.recargas = {}; M.usarHabilidad(j, pide, h.x + 1.2, h.y + 1.2, null, false); }
        await new Promise((r) => setTimeout(r, 1600)); for (const m of j.monstruos) if (m.dueno) { m.x = window.__ms[0].x - 0.7 + Math.random() * 0.3; m.y = window.__ms[0].y + 0.4; }
        j.efectos.length = 0; h.recargas = {}; h.acc = 'quieto'; for (const f of window.__limpiadores ?? []) f(); } }, [id, !!process.env.CERCA]);
    await p.waitForTimeout(700);
    await p.evaluate(([id, lento]) => { const j = window.__juego(), h = j.heroe, m = window.__ms[0], M = window.__mundo; window.__camaraLenta = lento; window.__t0 = j.t;
      import('/src/datos/clases.ts').then((C) => { const hb = C.HABILIDADES.find((x) => x.id === id);
        if (hb.tipo === 'trampa') { M.usarHabilidad(j, id, h.x + 1.6, h.y - 1.4, null, false); window.__pisar = [h.x + 1.6, h.y - 1.4]; for (const q of window.__ms) { q.x += 1.6; q.y += 1.2; } }
        else M.usarHabilidad(j, id, m.x, m.y, m, false); }); }, [id, LENTO]);
    const datos = [];
    for (let i = 0; i < N; i++) {
      // espera hasta el tiempo de juego del cuadro i
      await p.waitForFunction(([t]) => window.__juego().t - window.__t0 >= t, [PASO * (i + 1)], { timeout: 20000, polling: 5 }).catch(() => {});
      if (i === Math.floor(N * 0.45)) await p.evaluate(() => { const q = window.__pisar, m = (window.__ms ?? [])[0]; if (q && m) { m.x = q[0]; m.y = q[1]; } });
      if (process.env.FIN && i === Math.floor(N * 0.6)) await p.evaluate(() => { for (const b of Object.values(window.__juego().heroe.buffs)) if (b.t < 9000) b.t = 0.02; });
      await p.screenshot({ path: `${D}/${id}_${String(i).padStart(2, '0')}.png`, clip: caja });
      datos.push(await p.evaluate(() => +(window.__juego().t - window.__t0).toFixed(2)));
    }
    await p.evaluate(() => { window.__camaraLenta = 1; });
    fs.writeFileSync(`${D}/${id}.json`, JSON.stringify(datos)); console.log(id, datos[datos.length - 1]);
  }
  console.log('errores', errs.filter((e) => !/404/.test(e)).slice(0, 3));
  await b.close();
})();
