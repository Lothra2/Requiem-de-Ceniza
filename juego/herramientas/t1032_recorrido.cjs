// Recorrido de las 96 zonas (entrega 6): para buscar lo que se ve mal (piezas cortadas o flotando, cosas tapadas, piso negro,
// adornos que se repiten feo, hitos mal puestos). En cada zona, sin niebla y con los monstruos fuera, el héroe se para en
// unos puntos fijos (la entrada, el campamento más grande, el jefe o el hito, y lugares al azar con semilla) y saca una
// foto de 1280 x 720 en Lejos por punto. Los puntos quedan en puntos.json: otra corrida (BANDERAS= el antes) vuelve a los
// mismos. Héroe de id fijo, así las zonas salen iguales.
//   CHROMIUM=... node juego/herramientas/t1032_recorrido.cjs <etiqueta> [zonas|todas] [puntos por zona]
//   (/tmp/requiem-pruebas/e6/recorrido/<etiqueta>)
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const et = process.argv[2] || 'ahora', N = +(process.argv[4] || 4);
const BASE = '/tmp/requiem-pruebas/e6/recorrido', DIR = `${BASE}/${et}`, PUNTOS = process.env.PUNTOS || `${BASE}/puntos.json`; fs.mkdirSync(DIR, { recursive: true });
const puntos = fs.existsSync(PUNTOS) ? JSON.parse(fs.readFileSync(PUNTOS, 'utf8')) : {};
(async () => {
  const { b, p, errs } = await entrar('pc', 'berserker', 40, process.env.URL || 'http://127.0.0.1:5196/', "d.id = 'auditoria1'");
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const k of bs.split(',')) window[k] = true; }, process.env.BANDERAS);
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = -80; m.y = -80; } } }, 50));
  let ZONAS = process.argv[3] && process.argv[3] !== 'todas' ? process.argv[3].split(',') : await p.evaluate(async () => { const A = await import('/src/mundo/actos.ts'); return Object.keys(A.ZONAS); });
  for (const zid of ZONAS) {
    if (puntos[zid] && puntos[zid].every((q, i) => fs.existsSync(`${DIR}/${zid}_${i}_${q.q}.png`))) continue; // (ya está: se puede retomar)
    let dentro = false;
    try {
      await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
      // (al entrar a otro acto sale su entreacto o una cinemática: se saltan con clic y Escape)
      for (let k = 0; k < 60 && !dentro; k++) { await p.waitForTimeout(500); const e = await p.evaluate((z) => [window.__estado && window.__estado(), window.__juego && window.__juego() && window.__juego().zona && window.__juego().zona.id === z], zid); if (e[0] === 'juego' && e[1]) dentro = true; else if (e[0] && e[0] !== 'juego') { await p.mouse.click(640, 360); await p.keyboard.press('Escape'); } }
    } catch { /* nada */ }
    if (!dentro) { console.log(zid, 'no entra', await p.evaluate(() => window.__estado && window.__estado()).catch(() => '?')); continue; }
    await p.waitForTimeout(1200);
    let pts = puntos[zid];
    if (!pts) {
      pts = await p.evaluate((N) => {
        const j = window.__juego(), z = j.zona, W = z.W, out = [];
        const libre = (x, y) => x > 1 && y > 1 && x < W - 2 && y < z.H - 2 && z.bloq[y * W + x] === 0;
        out.push({ q: 'entrada', x: Math.floor(j.heroe.x), y: Math.floor(j.heroe.y) });
        const sp = z.spawns.filter((s) => s.tipo !== 'jefe').sort((a, b) => (b.grupos ?? 1) - (a.grupos ?? 1))[0]; if (sp) out.push({ q: 'campamento', x: Math.floor(sp.cx), y: Math.floor(sp.cy) });
        const jf = z.spawns.find((s) => s.tipo === 'jefe'), hi = z.objetos.find((o) => o.id === 'acto_hito');
        if (hi) out.push({ q: 'hito', x: hi.cx + 7, y: hi.cy + 7 }); else if (jf) out.push({ q: 'jefe', x: Math.floor(jf.cx) + 3, y: Math.floor(jf.cy) + 3 });
        let s = 98765 + z.W * 7 + z.H; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
        for (let k = 0; k < 4000 && out.length < N; k++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * z.H); if (!libre(x, y) || out.some((o) => Math.hypot(o.x - x, o.y - y) < 30)) continue; out.push({ q: 'azar', x, y }); }
        return out;
      }, N);
      puntos[zid] = pts; fs.writeFileSync(PUNTOS, JSON.stringify(puntos));
    }
    for (let i = 0; i < pts.length; i++) {
      await p.evaluate(async (s) => {
        const j = window.__juego(), z = j.zona; z.explorado.fill(1); const Z = await import('/src/mundo/zona.ts');
        let x = s.x + (s.dx ?? 0), y = s.y + (s.dy ?? 0);
        // (los puntos del hito se toman del hito de cada versión: al pie, del lado del relato, o detrás)
        if (s.q === 'hito_frente' || s.q === 'hito_detras') { const o = z.objetos.find((q) => q.id === 'acto_hito'); if (o) { const r = s.q === 'hito_frente' ? 1 : -1; for (let d = s.q === 'hito_frente' ? 6 : 4; d < 30; d++) { const X = o.cx + r * d, Y = o.cy + r * d; if (z.bloq[Y * z.W + X] === 0 && z.bloq[Y * z.W + X + 1] === 0) { x = X; y = Y; break; } } } }
        const c = Z.libreCerca(z, x, y); j.heroe.x = c[0] + 0.5; j.heroe.y = c[1] + 0.5; j.heroe.camino = null; j.heroe.destino = null; }, pts[i]);
      await p.waitForTimeout(1500);
      await p.screenshot({ path: `${DIR}/${zid}_${i}_${pts[i].q}.png` });
    }
    console.log(zid, pts.length);
  }
  console.log('errores', errs.slice(0, 5)); await b.close();
})();
