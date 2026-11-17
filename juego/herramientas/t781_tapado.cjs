// Mide cuánto tapa cada poder al objeto que el blanco tiene DELANTE. Saca la silueta del objeto (cuadro con y sin él),
// lanza cada habilidad con el blanco detrás y cuenta qué parte de esa silueta cambió mucho de color a los 0,3 / 0,55 / 0,9 s.
// Imprime, por habilidad, el peor porcentaje con el orden viejo (efectos encima) y con el nuevo.
const { entrar } = require('./comun_pruebas.cjs');
(async () => { const clase = process.argv[2] || 'arcanista'; const { b, p, errs } = await entrar('pc', clase, 30);
  // escenario controlado: se toma un muro del cementerio y se planta en campo abierto del desierto, de día (ahí no hay
  // velas que parpadeen sobre el muro ni nada alrededor), con el blanco detrás y el héroe a un costado
  await p.evaluate(() => window.__ir('a1_cementerio')); await p.waitForTimeout(4500);
  const molde = await p.evaluate(() => { const z = window.__juego().zona; const o = z.objetos.find((q) => q.id === 'cem_muro' && q.v === 'x') || z.objetos.find((q) => q.id === 'cem_muro'); return o ? JSON.parse(JSON.stringify({ ...o, obj: undefined })) : null; });
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  const ok = await p.evaluate(async (molde) => { const j = window.__juego(), z = j.zona, h = j.heroe; if (!molde) return null; window.__sinLluvia = true; window.__sinAmbiente = true; window.__sinViento = true; (h.d.thor ??= {}).descanso = 1e9;
    let mejor = null, md = 0; for (let y = 18; y < z.H - 18; y += 2) for (let x = 18; x < z.W - 18; x += 2) { let libre = true; for (let dy = -6; dy <= 6 && libre; dy++) for (let dx = -6; dx <= 6; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue; let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) return null; const o = { ...molde, cx: mejor[0], cy: mejor[1], tag: undefined, bloquea: false, dato: undefined }; z.objetos.push(o); window.__o = o;
    const C = await import('/src/datos/clases.ts'); for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; h.x = o.cx + 3.8; h.y = o.cy + 0.8; h.camino = null; h.dir = 'o';
    return { obj: o.id + '|' + o.v, ids: C.HABILIDADES.filter((x) => x.clase === h.d.clase && x.tipo !== 'pasiva' && !['buff', 'aura', 'teleporte', 'forma'].includes(x.tipo)).map((x) => x.id) }; }, molde);
  if (process.env.SOLO) ok.ids = ok.ids.filter((x) => process.env.SOLO.split(',').includes(x));
  await p.evaluate((f) => { for (const k of f.split(',')) if (k) window[k] = true; }, process.env.FLAGS || '');
  if (!ok) { console.log(clase, 'sin objeto'); await b.close(); return; }
  // sin temblor ni empujón de cámara: corren la imagen un par de puntos y arruinan la comparación
  await p.evaluate(() => { const j = window.__juego(); for (const k of ['sacudida', 'patada', 'congela']) Object.defineProperty(j, k, { get: () => (k === 'patada' ? null : 0), set() {}, configurable: true }); });
  await p.waitForTimeout(2500);
  const c = await p.evaluate(() => window.__aPant(window.__o.cx, window.__o.cy)); const caja = { x: Math.round(c[0]) - 70, y: Math.round(c[1]) - 130, width: 140, height: 150 };
  // los pixeles se leen del lienzo del juego, adentro de la página (sin librerías)
  await p.evaluate((caja) => { const cv = document.getElementById('juego'), r = cv.getBoundingClientRect(), k = cv.width / r.width;
    window.__w = Math.round(caja.width * k);
    window.__foto = () => cv.getContext('2d').getImageData(Math.round((caja.x - r.left) * k), Math.round((caja.y - r.top) * k), Math.round(caja.width * k), Math.round(caja.height * k)).data;
    window.__dist = (A, B, i) => Math.abs(A[i * 4] - B[i * 4]) + Math.abs(A[i * 4 + 1] - B[i * 4 + 1]) + Math.abs(A[i * 4 + 2] - B[i * 4 + 2]); }, caja);
  const limpiar = (conMon) => p.evaluate(async (conMon) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'), o = window.__o;
    j.monstruos = j.monstruos.filter(() => false); j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0; j.numeros.length = 0; j.suelo.length = 0; j.torretas.length = 0; j.manchas.length = 0; j.sacudida = 0;
    h.x = o.cx + 3.8; h.y = o.cy + 0.8; h.camino = null; h.destino = null; h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.acc = 'quieto'; h.furia = 100; h.frascos = 9; h.buffs = {}; h.dir = 'o';
    if (conMon) { const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, o.cx - 1, o.cy - 1, 0, 0); m.vida = m.vidaMax = 1e7; m.estado = 'dormido'; m.dir = 's'; m.vel = 0; m.cd = 99; j.monstruos.push(m); window.__m = m; } }, conMon);
  // silueta del objeto: con y sin él
  await limpiar(false); await p.waitForTimeout(700); await p.evaluate(() => { window.__con = window.__foto(); });
  await p.evaluate(() => { const z = window.__juego().zona; window.__i = z.objetos.indexOf(window.__o); z.objetos.splice(window.__i, 1); }); await p.waitForTimeout(400); await p.evaluate(() => { window.__sin = window.__foto(); });
  await p.evaluate(() => { window.__juego().zona.objetos.splice(window.__i, 0, window.__o); }); await p.waitForTimeout(400);
  const nm = await p.evaluate(() => { const N = window.__con.length / 4, mk = new Uint8Array(N); let n = 0; for (let i = 0; i < N; i++) if (window.__dist(window.__con, window.__sin, i) > 45) { mk[i] = 1; n++; } window.__mask = mk; return n; });
  await limpiar(true); await p.waitForTimeout(900); await p.evaluate(() => { window.__base = window.__foto(); });
  ok.ids.unshift('(nada)');
  const res = [];
  for (const id of ok.ids) { const fila = { id };
    for (const viejo of [true, false]) { await limpiar(true); await p.waitForTimeout(350);
      await p.evaluate(async ([id, viejo]) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, C = await import('/src/datos/clases.ts'), hb = C.HABILIDADES.find((x) => x.id === id) || {}; window.__efectosEncima = viejo;
        if (hb.forma) h.buffs[hb.forma === 'oso' ? 'forma_oso' : 'forma_lobo'] = { t: 30, bonos: {}, hab: 'x' }; if (id !== '(nada)') M.usarHabilidad(j, id, window.__m.x, window.__m.y, window.__m, false); }, [id, viejo]);
      let peor = 0, nf = 0; for (const ms of [300, 250, 350]) { await p.waitForTimeout(ms); if (process.env.FOTO && !viejo) await p.screenshot({ path: `/tmp/requiem-pruebas/or/t_${id}_${nf++}.png`, clip: { x: caja.x - 40, y: caja.y - 20, width: 240, height: 200 } }); const fr = await p.evaluate(() => { // ¿se sigue viendo el DIBUJO del objeto? La luz que lo tiñe no cuenta: se compara el relieve del objeto
        // (brillo medio por bloques de 4 puntos, cada bloque contra su vecino) con el del cuadro limpio.
        // 0 = intacto, 1 = irreconocible (algo pintado encima). Por bloques, para que el grano de la imagen no cuente
        const f = window.__foto(), B = window.__base, mk = window.__mask, W = window.__w, H = mk.length / W, Q = 4, bw = Math.floor(W / Q), bh = Math.floor(H / Q);
        const bloques = (D) => { const o = new Float32Array(bw * bh).fill(-1); for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) { let s = 0, n = 0; for (let dy = 0; dy < Q; dy++) for (let dx = 0; dx < Q; dx++) { const i = (y * Q + dy) * W + x * Q + dx; if (mk[i]) { s += D[i * 4] * 0.3 + D[i * 4 + 1] * 0.6 + D[i * 4 + 2] * 0.1; n++; } } if (n >= Q * Q * 0.75) o[y * bw + x] = s / n; } return o; };
        const a = bloques(B), c = bloques(f); let sab = 0, saa = 0, scc = 0;
        for (let y = 0; y < bh; y++) for (let x = 0; x < bw - 1; x++) { const i = y * bw + x; if (a[i] < 0 || a[i + 1] < 0) continue; const da = a[i] - a[i + 1], dc = c[i] - c[i + 1]; sab += da * dc; saa += da * da; scc += dc * dc; }
        for (let y = 0; y < bh - 1; y++) for (let x = 0; x < bw; x++) { const i = y * bw + x; if (a[i] < 0 || a[i + bw] < 0) continue; const da = a[i] - a[i + bw], dc = c[i] - c[i + bw]; sab += da * dc; saa += da * da; scc += dc * dc; }
        return 1 - Math.max(0, sab / Math.sqrt(Math.max(1, saa * scc))); }); peor = Math.max(peor, fr); }
      fila[viejo ? 'antes' : 'ahora'] = Math.round(peor * 100); await p.waitForTimeout(700); }
    res.push(fila); }
  await p.evaluate(() => { window.__efectosEncima = false; });
  console.log(clase, ok.obj, 'silueta', nm, 'px'); for (const r of res) console.log('  ' + r.id.padEnd(24), 'antes', String(r.antes).padStart(3) + '%', ' ahora', String(r.ahora).padStart(3) + '%', r.ahora >= 35 ? '  <<<' : '');
  if (errs.length) console.log('errores', errs.slice(0, 2)); await b.close(); })();
