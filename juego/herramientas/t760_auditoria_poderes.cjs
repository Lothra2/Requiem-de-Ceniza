// Auditoría de poderes: cada habilidad activa contra tres zombis pegados (para que el cuerpo a cuerpo pegue ya), en campo
// abierto y sin lluvia, cinco cuadros por habilidad (0,15 0,35 0,55 0,8 y 1,1 s después de pedirla: el golpe de los
// conjuros cae a eso de 0,3 s). Lo de alrededor se despeja (objetos a 12 casillas, monstruos de la zona, piso que arde)
// para que nada tape ni se cuele de un poder al siguiente. SOLO=a,b corre solo esos; las capturas van a SALIDA
// (/tmp/requiem-pruebas/pa por omisión) y t760_lamina.py las junta. `VIEJO=1` sin la materia de los poderes (`__sinMateria`).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const SAL = process.env.SALIDA || '/tmp/requiem-pruebas/pa'; fs.mkdirSync(SAL, { recursive: true });
const TOMAS = [150, 350, 550, 800, 1100];
(async () => {
  const clase = process.argv[2] || 'templario';
  const { b, p, errs } = await entrar('pc', clase, 30);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  const ok = await p.evaluate((viejo) => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; window.__sinAmbientePfx = true; if (viejo) window.__sinMateria = true; let mejor = null, md = 0;
    for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -5; dy <= 5 && libre; dy++) for (let dx = -5; dx <= 5; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); for (const s of z.salidas) d = Math.min(d, Math.hypot(s.cx - x, s.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) return null; h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y];
    z.objetos = z.objetos.filter((o) => Math.hypot(o.cx + 0.5 - h.x, o.cy + 0.5 - h.y) > 12); return md; }, !!process.env.VIEJO);
  await p.waitForTimeout(1500);
  const ids = await p.evaluate(async () => { const C = await import('/src/datos/clases.ts'); const h = window.__juego().heroe; for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; return C.HABILIDADES.filter((x) => x.clase === h.d.clase && x.tipo !== 'pasiva').map((x) => x.id); });
  const solo = process.env.SOLO ? process.env.SOLO.split(',') : null;
  let n = 0;
  for (const id of ids) {
    if (solo && !solo.includes(id)) { n++; continue; }
    await p.evaluate(async (id) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts'); const hb = C.HABILIDADES.find((x) => x.id === id);
      // cada poder empieza limpio (antes se colaban de uno al siguiente el aura activa, las trampas y torretas que
      // seguían tirando, los cuervos, la armadura de hueso, la tempestad, el huracán, el remolino, la furia fija, las
      // cargas y lo que soltaban los poderes en los módulos de dibujo: chispas, anillos, gotas, tajos y grietas)
      h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.objetivo = null;
      h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.acc = 'quieto'; h.t = 0; h.furia = 100; h.furiaFija = 0; h.frascos = 9; h.salto = null; h.dir = 'se'; h.buffs = {};
      h.d.aura = null; h.escudoHueso = 0; h.tempestad = 0; h.huracan = 0; h.torbellino = 0; h.congelado = 0; h.aturdido = 0; h.combo = { paso: 0, t: -9 }; h.cargas = ['fuego', 'frio', 'rayo'];
      if (hb.forma) h.buffs[hb.forma === 'oso' ? 'forma_oso' : 'forma_lobo'] = { t: 30, bonos: {}, hab: 'x' };
      window.__mundo.recalc?.(j);
      j.monstruos = []; j.manchas && (j.manchas.length = 0); h.quema = 0; h.frio = 0; h.veneno = 0; (h.d.thor ??= {}).descanso = 999; // (el perro también se va: se paraba delante de todo)
      j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.torretas.length = 0; j.cuervos.length = 0;
      if (j.cadenas) j.cadenas.length = 0; if (j.golpesPoder) j.golpesPoder.length = 0; if (j.golpesVivos) j.golpesVivos.length = 0; if (j.caidas) j.caidas.length = 0;
      j.sacudida = 0; j.congela = 0; j.patada = null; window.__apagarSuelos?.(); for (const f of window.__limpiadores ?? []) f();
      const ms = [0, 1, 2].map((i) => { const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.25 + i * 0.75, h.y + 0.35 - i * 0.55, 0, 0); m.vida = m.vidaMax = 50000; m.estado = 'dormido'; j.monstruos.push(m); return m; });
      // los que levantan muertos necesitan cadáveres (antes avisaban "Necesito un cadáver" y la lámina salía vacía)
      if (hb.tipo === 'invocar') for (let i = 0; i < 4; i++) { const c = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.6 + (i % 2) * 0.9, h.y + 1.4 + (i >> 1) * 0.8, 0, 0); c.vida = 0; c.muerto = true; c.acc = 'morir'; c.t = 5; c.tMuerto = 5; j.monstruos.push(c); }
      // las trampas se arman en un sitio libre y un zombi la pisa a los 0,6 s: se ve armada y después el disparo
      if (hb.tipo === 'trampa') { const tx = h.x + 1.6, ty = h.y - 1.4; M.usarHabilidad(j, id, tx, ty, null, false); window.__pisar = [tx, ty]; for (const m of ms) { m.x += 1.6; m.y += 1.2; } return; }
      window.__pisar = null;
      M.usarHabilidad(j, id, ms[0].x, ms[0].y, ms[0], false); }, id);
    const t0 = Date.now();
    for (let i = 0; i < TOMAS.length; i++) { await p.waitForTimeout(Math.max(0, TOMAS[i] - (Date.now() - t0)));
      if (i === 2) await p.evaluate(() => { const q = window.__pisar, m = window.__juego().monstruos[0]; if (q && m) { m.x = q[0]; m.y = q[1]; } }); await p.screenshot({ path: `${SAL}/${clase}_${String(n).padStart(2, '0')}_${i}.png`, clip: { x: 640 - 130, y: 300 - 120, width: 300, height: 220 } }); }
    await p.waitForTimeout(900); n++;
  }
  fs.writeFileSync(`${SAL}/${clase}.json`, JSON.stringify(ids)); console.log(clase, ok, ids.length, errs.filter((e) => !/404/.test(e)).slice(0, 2));
  await b.close();
})();
