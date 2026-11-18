// Auditoría del piso negro: lo que en pantalla sale negro liso "como si no hubiera nada" dentro de lo que se juega.
//
// Dos pasadas:
//  datos  (siempre): genera todas las zonas con varias semillas y cuenta, celda por celda, lo que se pinta negro y queda a
//         la vista de donde se camina: roca maciza de caverna (hueco) sin peñasco encima, baldosas sin piso metidas entre
//         piso (hoyos), piso sin arte horneado, celdas vacías (bloq 2) dentro de una baldosa con piso.
//  fotos  (FOTOS=1): entra a cada zona (con su semilla de verdad), destapa la niebla, planta al héroe en una rejilla de
//         puntos caminables y mide en el lienzo los manchones negros cerrados (no tocan el borde de la pantalla), los
//         lleva a celdas del mundo y dice de qué son. Con FOTO=1 guarda las peores vistas marcadas en
//         /tmp/requiem-pruebas/negro.
//
//   node juego/herramientas/t850_negro.cjs [semillas=3]           (SOLO=a1_guarida,a1_cripta para unas pocas)
//   CLARO=1 quita la oscuridad de la zona: lo negro que queda es de la forma del mapa, no de la luz.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const DIR = '/tmp/requiem-pruebas/negro';
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const N = +(process.argv[2] || 3), SOLO = process.env.SOLO ? process.env.SOLO.split(',') : null;
  const { b, p, errs, L } = await entrar('pc', 'berserker', 30, process.env.URL, "d.id = 'auditoria-negro';"); // (id fijo: las zonas salen con la misma semilla en cada corrida)
  // ------------------------------------------------------------------ datos
  const datos = await p.evaluate(async ([N, SOLO]) => {
    const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts');
    const man = await (await fetch('/assets/manifiesto.json')).json();
    const conArte = (id) => Object.keys(man.p).some((k) => k.startsWith(id + '|'));
    const out = {}, sinArte = {};
    for (const def of Object.values(A.ZONAS)) {
      if (SOLO && !SOLO.includes(def.id)) continue;
      const tot = { hueco: 0, hoyo: 0, sinArte: 0, vacio: 0, celdas: 0 };
      for (let s = 1; s <= N; s++) {
        const z = Z.generarZona(def, s * 7919 + 13), { W, H, tw } = z;
        const tile = (x, y) => z.pisos[Math.floor(y / 5) * tw + Math.floor(x / 5)];
        // a la vista: a 9 celdas o menos de una celda caminable (lo que entra en pantalla alrededor del que camina)
        const libre = new Uint8Array(W * H); for (let i = 0; i < W * H; i++) libre[i] = z.bloq[i] === 0 || z.bloq[i] === 3 ? 1 : 0;
        const dist = new Uint16Array(W * H).fill(999), cola = [];
        for (let i = 0; i < W * H; i++) if (libre[i]) { dist[i] = 0; cola.push(i); }
        for (let q = 0; q < cola.length; q++) { const i = cola[q], x = i % W, y = (i - x) / W; if (dist[i] >= 9) continue; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (dist[j] > dist[i] + 1) { dist[j] = dist[i] + 1; cola.push(j); } } }
        // lo que tapan los objetos (su huella y, para lo alto, la celda de atrás)
        const tapa = new Uint8Array(W * H);
        for (const o of z.objetos) { const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2); for (let y = y0 - 1; y < y0 + o.hh; y++) for (let x = x0 - 1; x < x0 + o.hw; x++) if (x >= 0 && y >= 0 && x < W && y < H) tapa[y * W + x] = 1; }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x; if (dist[i] > 6) continue; tot.celdas++;
          const t = tile(x, y);
          if (z.hueco && z.hueco[i]) { if (!tapa[i]) tot.hueco++; continue; }
          if (!t) {
            // hoyo: baldosa sin piso con piso a los dos lados (en x o en y) a menos de 2 baldosas
            const bx = Math.floor(x / 5), by = Math.floor(y / 5), P = (X, Y) => X >= 0 && Y >= 0 && X < z.tw && Y < z.th && !!z.pisos[Y * z.tw + X];
            const ladoX = (P(bx - 1, by) || P(bx - 2, by)) && (P(bx + 1, by) || P(bx + 2, by)), ladoY = (P(bx, by - 1) || P(bx, by - 2)) && (P(bx, by + 1) || P(bx, by + 2));
            if ((ladoX || ladoY) && !tapa[i] && !(z.roca && z.roca[by * z.tw + bx])) tot.hoyo++;
            continue;
          }
          if (!conArte(t.id)) { tot.sinArte++; sinArte[t.id] = 1; }
          else if (z.bloq[i] === 2) tot.vacio++;
        }
      }
      for (const k of Object.keys(tot)) tot[k] = Math.round(tot[k] / N);
      out[def.id] = { tipo: def.tipo, tema: def.tema, ...tot };
    }
    return { out, sinArte: Object.keys(sinArte) };
  }, [N, SOLO]);
  const filas = Object.entries(datos.out).sort((a, b) => (b[1].hueco + b[1].hoyo + b[1].sinArte + b[1].vacio) - (a[1].hueco + a[1].hoyo + a[1].sinArte + a[1].vacio));
  let sum = { hueco: 0, hoyo: 0, sinArte: 0, vacio: 0 };
  for (const [, v] of filas) for (const k of Object.keys(sum)) sum[k] += v[k];
  console.log('DATOS (celdas negras a la vista por zona, media de ' + N + ' semillas)');
  for (const [id, v] of filas.slice(0, 30)) console.log(`  ${id.padEnd(20)} ${v.tipo.padEnd(9)} ${v.tema.padEnd(18)} hueco ${v.hueco}  hoyo ${v.hoyo}  sinArte ${v.sinArte}  vacio ${v.vacio}  (de ${v.celdas})`);
  console.log('  TOTAL', JSON.stringify(sum), 'pisos sin arte:', datos.sinArte.join(',') || 'ninguno');
  if (!process.env.FOTOS) { console.log('errores', errs.slice(0, 3)); await b.close(); return; }
  // ------------------------------------------------------------------ fotos
  const ids = await p.evaluate(async () => { const A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts'); return Object.values(A.ZONAS).map((d) => [d.id, d.tipo === 'mazmorra' ? 'arriba' : d.salidas[0]?.lado ?? 'arriba']); });
  const res = []; let peor = [];
  for (const [id, ent] of ids) {
    if (SOLO && !SOLO.includes(id)) continue;
    await p.evaluate(([id, ent, claro]) => { window.__CLARO = claro; return window.__ir(id, ent); }, [id, ent, !!process.env.CLARO]);
    for (let i = 0; i < 60; i++) { await p.waitForTimeout(250); if (await p.evaluate(() => window.__estado()) === 'juego') break; }
    await p.waitForTimeout(600);
    const pts = await p.evaluate((ST) => {
      const j = window.__juego(), z = j.zona; z.explorado.fill(1); if (window.__CLARO) z.oscuridad = 0; j.monstruos.length = 0; (j.mensajes ?? []).length = 0;
      const pts = [];
      for (let y = 6; y < z.H; y += ST) for (let x = 6; x < z.W; x += ST) {
        let ok = null; for (let r = 0; r < 6 && !ok; r++) for (let dy = -r; dy <= r && !ok; dy++) for (let dx = -r; dx <= r; dx++) { const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < z.W && Y < z.H && z.bloq[Y * z.W + X] === 0) { ok = [X + 0.5, Y + 0.5]; break; } }
        if (ok) pts.push(ok);
      }
      return pts;
    }, +(process.env.PASO || 16));
    const celdas = { hueco: new Set(), vacio: new Set(), piso: new Set() };
    for (const [x, y] of pts) {
      await p.evaluate(([x, y]) => { const j = window.__juego(); j.heroe.x = x; j.heroe.y = y; j.heroe.vida = j.heroe.vidaMax ?? 1e6; j.monstruos.length = 0; j.zona.explorado.fill(1); }, [x, y]);
      await p.waitForTimeout(260);
      const r = await p.evaluate(([x, y, guardar]) => {
        const c = document.getElementById('juego'), g = c.getContext('2d'), cw = c.width, ch = c.height, rc = c.getBoundingClientRect();
        const d = g.getImageData(0, 0, cw, ch).data, B = 8, gw = Math.floor(cw / B), gh = Math.floor(ch / B);
        const k = cw / rc.width; // puntos del lienzo por punto de pantalla
        // fuera de la cuenta: la barra de abajo, el minimapa y los mensajes (se tratan como borde)
        const tapadoUI = (px, py) => py > ch - 120 * k || (px > cw - 200 * k && py < 180 * k) || (px < 600 * k && py > 440 * k);
        const negro = new Uint8Array(gw * gh), borde = new Uint8Array(gw * gh);
        for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) {
          if (tapadoUI(bx * B + B / 2, by * B + B / 2)) { borde[by * gw + bx] = 1; continue; }
          let n = 0; for (let yy = 0; yy < B; yy++) for (let xx = 0; xx < B; xx++) { const o = ((by * B + yy) * cw + bx * B + xx) * 4; if (Math.max(d[o], d[o + 1], d[o + 2]) <= 10) n++; }
          if (n >= B * B * 0.9) negro[by * gw + bx] = 1;
        }
        // lo negro que toca el borde de la pantalla (o la interfaz) es el filo del mundo: no cuenta
        const fuera = new Uint8Array(gw * gh), pila = [];
        for (let by = 0; by < gh; by++) for (let bx = 0; bx < gw; bx++) { const i = by * gw + bx; if ((bx === 0 || by === 0 || bx === gw - 1 || by === gh - 1 || borde[i]) && (negro[i] || borde[i])) { fuera[i] = 1; pila.push(i); } }
        while (pila.length) { const i = pila.pop(), x = i % gw, y = (i - x) / gw; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; const q = Y * gw + X; if (!fuera[q] && (negro[q] || borde[q])) { fuera[q] = 1; pila.push(q); } } }
        // pantalla -> celda del mundo (sobre el plano del piso)
        const o0 = window.__aPant(0, 0), o1 = window.__aPant(1, 0), o2 = window.__aPant(0, 1);
        const ax = o1[0] - o0[0], ay = o1[1] - o0[1], bx_ = o2[0] - o0[0], by_ = o2[1] - o0[1], det = ax * by_ - bx_ * ay;
        const aCelda = (sx, sy) => { const X = sx / k + rc.left - o0[0], Y = sy / k + rc.top - o0[1]; return [Math.floor((X * by_ - bx_ * Y) / det), Math.floor((ax * Y - ay * X) / det)]; };
        const z = window.__juego().zona, cel = [], marcas = [];
        for (let i = 0; i < gw * gh; i++) {
          if (!negro[i] || fuera[i]) continue;
          const bx = i % gw, by = (i - bx) / gw, [X, Y] = aCelda(bx * B + B / 2, by * B + B / 2);
          let tipo = 'vacio';
          if (X >= 0 && Y >= 0 && X < z.W && Y < z.H) { const q = Y * z.W + X; if (z.hueco && z.hueco[q]) tipo = 'hueco'; else if (z.pisos[Math.floor(Y / 5) * z.tw + Math.floor(X / 5)] && z.bloq[q] !== 2) tipo = 'piso'; }
          cel.push([tipo, X, Y]); marcas.push([bx * B, by * B, tipo]);
        }
        let url = null;
        if (guardar && marcas.length) {
          const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch; const q = cv.getContext('2d'); q.drawImage(c, 0, 0);
          q.globalAlpha = 0.55; for (const [x, y, t] of marcas) { q.fillStyle = t === 'hueco' ? '#ff2020' : t === 'piso' ? '#20ff40' : '#3080ff'; q.fillRect(x, y, B, B); }
          url = cv.toDataURL('image/png');
        }
        return { cel, n: marcas.length, url };
      }, [x, y, !!process.env.FOTO]);
      for (const [t, X, Y] of r.cel) celdas[t].add(X + ',' + Y);
      if (r.url) { peor.push({ n: r.n, id, x, y, url: r.url }); peor.sort((a, b) => b.n - a.n); peor = peor.slice(0, +(process.env.FOTOS_N || 12)); }
    }
    const fila = { id, vistas: pts.length, hueco: celdas.hueco.size, vacio: celdas.vacio.size, piso: celdas.piso.size };
    res.push(fila); console.log(`  ${id.padEnd(20)} vistas ${String(pts.length).padStart(3)}  hueco ${fila.hueco}  vacio ${fila.vacio}  piso ${fila.piso}`);
  }
  const t = res.reduce((s, f) => ({ hueco: s.hueco + f.hueco, vacio: s.vacio + f.vacio, piso: s.piso + f.piso }), { hueco: 0, vacio: 0, piso: 0 });
  console.log('FOTOS (celdas con manchón negro cerrado en pantalla)', JSON.stringify(t));
  for (const f of peor) { const ruta = `${DIR}/${process.env.PRE || 'antes'}_${f.id}_${Math.round(f.x)}_${Math.round(f.y)}.png`; fs.writeFileSync(ruta, Buffer.from(f.url.split(',')[1], 'base64')); console.log('  foto', ruta, f.n); }
  console.log('errores', errs.slice(0, 3));
  await b.close();
})();
