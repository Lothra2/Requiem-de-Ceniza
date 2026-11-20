// Haces de luz del techo en mazmorras: busca un haz cerca, pone al héroe al lado y saca fotos (varios tiempos).
//   node juego/herramientas/t990_haz.cjs <etiqueta> [zonas]   (VIEJO=1 pone __hazViejo)
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const DIR = '/tmp/requiem-pruebas/haz';
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const et = process.argv[2] || 'ahora', zonas = (process.argv[3] || 'a1_cripta,a1_cata1,a1_abadia1').split(',');
  const { b, p, errs } = await entrar(process.env.VISTA || 'pc', 'templario', 30);
  if (process.env.VIEJO) await p.evaluate(() => { window.__hazViejo = true; });
  const out = {};
  for (const zid of zonas) {
    await p.evaluate((z) => window.__ir(z), zid); await p.waitForTimeout(4000);
    const r = await p.evaluate(() => {
      const j = window.__juego(), Z = j.zona, h = j.heroe;
      j.monstruos.forEach((o) => { if (!o.dueno) { o.vida = 0; o.muerto = true; o.tMuerto = 999; } });
      h.vida = h.vidaMax = 1e6;
      const hc = (x, y) => { const q = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return q - Math.floor(q); };
      const lista = [];
      for (let cy = 0; cy < Z.H; cy++) for (let cx = 0; cx < Z.W; cx++) if (hc(cx * 1.7 + 11, cy * 2.3 + 5) <= 0.0042 && !Z.bloq[cy * Z.W + cx]) lista.push([cx, cy]);
      // el que tenga más piso libre alrededor
      let mejor = null, mv = -1;
      for (const [cx, cy] of lista) { let n = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = cx + dx, Y = cy + dy; if (X >= 0 && Y >= 0 && X < Z.W && Y < Z.H && !Z.bloq[Y * Z.W + X]) n++; } if (n > mv) { mv = n; mejor = [cx, cy]; } }
      if (!mejor) return { n: 0 };
      for (const [dx, dy] of [[2, 1], [1, 2], [-2, 1], [2, -1], [0, 2]]) { const X = mejor[0] + dx, Y = mejor[1] + dy; if (!Z.bloq[Y * Z.W + X]) { h.x = X + 0.5; h.y = Y + 0.5; break; } }
      h.camino = null; return { n: lista.length, haz: mejor };
    });
    out[zid] = r; if (!r.n) continue;
    await p.waitForTimeout(1500);
    for (let i = 0; i < 3; i++) { await p.screenshot({ path: `${DIR}/${et}_${zid}_${i}.png` }); await p.waitForTimeout(700); }
  }
  console.log(JSON.stringify(out), errs.slice(0, 3));
  await b.close();
})();
