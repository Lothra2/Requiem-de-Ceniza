// Fotos en el juego de lo que Rick vio "debajo de las paredes" (21 nov 2026): el cofre del nicho secreto, lo del castigo y
// los relatos contra el muro de atrás, lo que viste las paredes y lo que va en los rincones. Elige los sitios en la corrida
// de ahora y los guarda en puntos.json; la del antes (BANDERAS=__murosEnteros,__pegadosAlMuro,__nichoViejo) vuelve a los
// mismos puntos de cámara. Sin niebla y con los monstruos dormidos.
// Uso: CHROMIUM=... node juego/herramientas/t1016_tapados_fotos.cjs <etiqueta> [zonas]   (URL=, BANDERAS=, N=4 sitios por zona)
// Lámina: python3 juego/herramientas/t1016_lamina.py antes ahora   (/tmp/requiem-pruebas/tapados/fotos)
const { chromium } = require('playwright');
const fs = require('fs');
const et = process.argv[2] || 'ahora', ZONAS = (process.argv[3] || 'a1_cripta,a1_cata1,a1_abadia1,a2_tumbas1,a5_santuario1,a6_criptas').split(',');
const URL = process.env.URL || 'http://127.0.0.1:5196/', DIR = `/tmp/requiem-pruebas/tapados/fotos/${et}`, PUNTOS = '/tmp/requiem-pruebas/tapados/fotos/puntos.json';
const BANDERAS = (process.env.BANDERAS || '').split(',').filter(Boolean), N = +(process.env.N || 4);
fs.mkdirSync(DIR, { recursive: true });
const puntos = fs.existsSync(PUNTOS) ? JSON.parse(fs.readFileSync(PUNTOS, 'utf8')) : {};
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  const c = await b.newContext({ viewport: { width: 1280, height: 720 } });
  const p = await c.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript((bs) => { localStorage.setItem('marca.intro', '1'); localStorage.setItem('marca.opciones', JSON.stringify({ general: 0, musica: 0, efectos: 0, horror: 0, idioma: 0, brillo: 1, vista: 0 })); for (const k of bs) window[k] = true; }, BANDERAS);
  const alMenu = async () => { for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; } };
  await p.goto(URL); await alMenu();
  await p.waitForFunction(() => window.__T && window.__T.H, null, { timeout: 60000 });
  await p.evaluate(() => { const d = window.__T.H.nuevoHeroe('berserker', 'Prueba'); d.nivel = 30; d.id = 'auditoria1'; localStorage.setItem('marca.heroes', JSON.stringify([d])); });
  await p.reload(); await alMenu(); await p.waitForTimeout(2500);
  await p.waitForFunction(() => window.__menuFilas && window.__menuFilas.continuar, null, { timeout: 60000 }); await p.waitForTimeout(1200);
  const c0 = await p.evaluate(() => window.__menuFilas.continuar); const k = await p.evaluate(() => document.getElementById('juego').getBoundingClientRect().width / window.__vista().W);
  await p.mouse.click(c0[0] * k, c0[1] * k);
  for (let i = 0; i < 80; i++) { await p.waitForTimeout(400); if (await p.evaluate(() => window.__estado()) === 'juego') break; }
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = -50; m.y = -50; } } }, 50));
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); await p.waitForTimeout(2000);
    // los sitios: el cofre del nicho, y lo que está contra el muro de atrás (castigo, relato, pared, rincón, cofres y urnas)
    let sitios = puntos[zid];
    if (!sitios) {
      sitios = await p.evaluate((N) => {
        const z = window.__juego().zona, W = z.W, out = [];
        const muro = (x, y) => x < 0 || y < 0 || x >= W || y >= z.H || z.bloq[y * W + x] === 1 || z.bloq[y * W + x] === 2;
        const nicho = z.objetos.filter((o) => o.id === 'cofre_noble' && o.capa === 'escondido');
        for (const o of nicho.slice(0, 2)) out.push({ que: 'nicho', id: o.id, cx: o.cx, cy: o.cy });
        const contra = z.objetos.filter((o) => /relato|pared|escondido|interactivo|riego|umbral/.test(o.capa || '') && o.id !== 'cofre_noble' && (muro(o.cx - 1 - Math.floor(o.hw / 2), o.cy) || muro(o.cx, o.cy - 1 - Math.floor(o.hh / 2))));
        const pesa = (o) => (/embalsamar|amortaj|sarcof|mesa|cofre|jergon|tumba/.test(o.id) ? 0 : 1) + (o.capa === 'relato' ? 0 : 0.5);
        contra.sort((a, b) => pesa(a) - pesa(b));
        for (const o of contra) { if (out.length >= N) break; if (out.some((q) => Math.hypot(q.cx - o.cx, q.cy - o.cy) < 14)) continue; out.push({ que: o.capa, id: o.id, cx: o.cx, cy: o.cy }); }
        return out;
      }, N);
      puntos[zid] = sitios; fs.writeFileSync(PUNTOS, JSON.stringify(puntos, null, 1));
    }
    for (let i = 0; i < sitios.length; i++) {
      const s = sitios[i];
      await p.evaluate(async (s) => { const j = window.__juego(), z = j.zona; z.explorado.fill(1); const Z = await import('/src/mundo/zona.ts'); const c = Z.libreCerca(z, s.cx + 7, s.cy + 7); j.heroe.x = c[0] + 0.5; j.heroe.y = c[1] + 0.5; j.heroe.camino = null; j.heroe.destino = null; }, s);
      await p.waitForTimeout(1800);
      await p.screenshot({ path: `${DIR}/${zid}_${i}.png` }); console.log(et, zid, i, s.que, s.id, s.cx, s.cy);
    }
  }
  console.log('errores', errs.slice(0, 3)); await b.close();
})();
