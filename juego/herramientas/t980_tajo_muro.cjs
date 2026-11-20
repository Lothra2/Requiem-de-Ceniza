// El tajo del héroe y el muro de delante (cuarta pasada de poderes, 20 nov 2026). Planta un muro del cementerio en campo
// abierto del desierto, pone al héroe detrás (el muro le queda a menos de una casilla, entre él y la cámara) con un zombi
// pegado al costado abierto, y pega con <ids> en cámara lenta. Mide qué parte de la silueta del muro se pierde en el peor
// cuadro con el orden viejo (`__tajoViejo`: el tajo entero a 1,1 casillas) y con el nuevo (recortado a los cuerpos).
// Capturas en /tmp/requiem-pruebas/poderes4/muro. Uso: node t980_tajo_muro.cjs <clase> <id,id>
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => { const clase = process.argv[2] || 'berserker', ids = (process.argv[3] || 'tajo_salvaje').split(','); const D = '/tmp/requiem-pruebas/poderes4/muro'; fs.mkdirSync(D, { recursive: true });
  const { b, p } = await entrar('pc', clase, 30);
  await p.evaluate(() => window.__ir('a1_cementerio')); await p.waitForTimeout(4500);
  const molde = await p.evaluate(() => { const z = window.__juego().zona; const o = z.objetos.find((q) => q.id === 'cem_muro' && q.v === 'x') || z.objetos.find((q) => q.id === 'cem_muro'); return o ? JSON.parse(JSON.stringify({ ...o, obj: undefined })) : null; });
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  await p.evaluate(async (molde) => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; window.__sinAmbiente = true; window.__sinAmbientePfx = true; window.__sinViento = true; (h.d.thor ??= {}).descanso = 1e9;
    let mejor = null, md = 0; for (let y = 18; y < z.H - 18; y += 2) for (let x = 18; x < z.W - 18; x += 2) { let libre = true; for (let dy = -6; dy <= 6 && libre; dy++) for (let dx = -6; dx <= 6; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue; let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    const o = { ...molde, cx: mejor[0], cy: mejor[1], tag: undefined, bloquea: false, dato: undefined }; z.objetos.push(o); window.__o = o;
    const C = await import('/src/datos/clases.ts'); for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; }, molde);
  await p.evaluate((e) => { window.__HX = e[0]; window.__HY = e[1]; window.__MX = e[2]; window.__MY = e[3]; }, [process.env.HX || '0.9', process.env.HY || '-1.3', process.env.MX || '-0.2', process.env.MY || '1.0']);
  await p.evaluate(() => { const j = window.__juego(); for (const k of ['sacudida', 'patada', 'congela']) Object.defineProperty(j, k, { get: () => (k === 'patada' ? null : 0), set() {}, configurable: true }); });
  const poner = (conMon) => p.evaluate(async (conMon) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, Dm = await import('/src/datos/monstruos.ts'), o = window.__o;
    j.monstruos = []; j.efectos.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.manchas.length = 0; for (const f of window.__limpiadores ?? []) f();
    h.x = o.cx + (+window.__HX); h.y = o.cy + (+window.__HY); h.camino = null; h.destino = null; h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.acc = 'quieto'; h.furia = 100; h.buffs = {}; h.dir = 's';
    if (conMon) { const m = M.crearMonstruo(Dm.MONSTRUOS['zombi'], 10, h.x + (+window.__MX), h.y + (+window.__MY), 0, 0); m.vida = m.vidaMax = 1e7; m.estado = 'dormido'; m.vel = 0; m.cd = 99; j.monstruos.push(m); window.__m = m; } }, conMon);
  await poner(false); await p.waitForTimeout(2500);
  const c = await p.evaluate(() => window.__aPant(window.__o.cx, window.__o.cy)); const caja = { x: Math.round(c[0]) - 110, y: Math.round(c[1]) - 150, width: 220, height: 180 };
  await p.evaluate((caja) => { const cv = document.getElementById('juego'), r = cv.getBoundingClientRect(), k = cv.width / r.width;
    window.__foto = () => cv.getContext('2d').getImageData(Math.round((caja.x - r.left) * k), Math.round((caja.y - r.top) * k), Math.round(caja.width * k), Math.round(caja.height * k)).data;
    window.__dist = (A, B, i) => Math.abs(A[i * 4] - B[i * 4]) + Math.abs(A[i * 4 + 1] - B[i * 4 + 1]) + Math.abs(A[i * 4 + 2] - B[i * 4 + 2]); }, caja);
  // la silueta del muro que se ve (con y sin él, con el héroe quieto detrás)
  await p.evaluate(() => { window.__con = window.__foto(); const z = window.__juego().zona; window.__i = z.objetos.indexOf(window.__o); z.objetos.splice(window.__i, 1); }); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__sin = window.__foto(); window.__juego().zona.objetos.splice(window.__i, 0, window.__o); }); await p.waitForTimeout(400);
  const nm = await p.evaluate(() => { const N = window.__con.length / 4, mk = new Uint8Array(N); let n = 0; for (let i = 0; i < N; i++) if (window.__dist(window.__con, window.__sin, i) > 45) { mk[i] = 1; n++; } window.__mask = mk; return n; });
  for (const id of ids) for (const viejo of [true, false]) {
    await poner(true); await p.evaluate((v) => { window.__tajoViejo = v; }, viejo); await p.waitForTimeout(700); await p.evaluate(() => { window.__base = window.__foto(); });
    await p.evaluate((id) => { const j = window.__juego(), m = window.__m; window.__camaraLenta = 0.15; window.__t0 = j.t; window.__mundo.usarHabilidad(j, id, m.x, m.y, m, false); }, id);
    let peor = 0;
    for (let i = 0; i < 24; i++) { await p.waitForFunction(([t]) => window.__juego().t - window.__t0 >= t, [0.035 * (i + 1)], { timeout: 20000, polling: 5 }).catch(() => {});
      const f = await p.evaluate(() => { const A = window.__foto(), B = window.__base, mk = window.__mask; let n = 0, t = 0; for (let k = 0; k < mk.length; k++) if (mk[k]) { t++; if (window.__dist(A, B, k) > 60) n++; } return n / Math.max(1, t); });
      peor = Math.max(peor, f); if (i % 2 === 1) await p.screenshot({ path: `${D}/${id}_${viejo ? 'viejo' : 'nuevo'}_${String(i).padStart(2, '0')}.png`, clip: caja }); }
    await p.evaluate(() => { window.__camaraLenta = 1; });
    console.log(id, viejo ? 'viejo' : 'nuevo', 'muro', nm, 'peor tapado', (peor * 100).toFixed(1) + '%');
  }
  await b.close(); })();
