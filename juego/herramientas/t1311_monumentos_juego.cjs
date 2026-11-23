// Los monumentos de los actos 2 a 7 en el juego (monumentos.ts): para cada zona con monumento pone al héroe al pie de la
// puerta, lejos de frente, a los costados y detrás, saca una foto por puesto y mide si alguna pieza se corta arriba de la
// pantalla con la cámara que sube frente a lo grande. También revisa que la puerta lleve a su mazmorra.
//   CHROMIUM=... URL=http://127.0.0.1:5197/ node juego/herramientas/t1311_monumentos_juego.cjs <etiqueta> [zonas] [puestos]
//   puestos: puerta,lejos,izq,der,detras. VISTA=pc|pc1080|movil. BANDERAS=__sinMonumentos. Falla si alguno se corta de frente.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const et = process.argv[2] || 'ahora';
const ZONAS = (process.argv[3] || 'a2_ruinas,a3_pantano,a4_glaciar,a5_rio,a6_barrio2,a7_jardin').split(',');
const PUESTOS = (process.argv[4] || 'puerta,cerca,lejos,izq,der,detras').split(',');
const DIR = `/tmp/requiem-pruebas/monumentos/juego/${et}`; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p, errs } = await entrar(process.env.VISTA || 'pc', 'berserker', 40, process.env.URL || 'http://127.0.0.1:5197/', "d.id = 'monumentos1'");
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const k of bs.split(',')) window[k] = true; }, process.env.BANDERAS);
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = 3; m.y = 3; } } }, 50));
  const malos = [], filas = [];
  for (const zid of ZONAS) {
    try { await p.evaluate((z) => window.__ir(z, 'arriba'), zid); await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); }
    catch { console.log(zid, 'no entra'); continue; }
    await p.waitForTimeout(2500);
    const info = await p.evaluate(() => { const z = window.__juego().zona, s = z.salidas.find((q) => q.piezas && q.piezas.length); return s ? { destino: s.destino, cx: s.cx, cy: s.cy, piezas: s.piezas.map((o) => [o.id, o.cx, o.cy]) } : null; });
    if (!info) { console.log(zid, 'SIN MONUMENTO'); malos.push(zid + ' sin monumento'); continue; }
    console.log(zid, 'puerta a', info.destino, 'en', info.cx, info.cy);
    for (const pu of PUESTOS) {
      const r = await p.evaluate((pu) => {
        const j = window.__juego(), z = j.zona, s = z.salidas.find((q) => q.piezas && q.piezas.length), fa = s.piezas[s.piezas.length - 1], md = s.piezas[1];
        z.explorado.fill(1);
        const libre = (x, y) => x > 0 && y > 0 && x < z.W && y < z.H && z.bloq[y * z.W + x] === 0;
        const base = { puerta: [s.cx + 1.5, s.cy + 1.5, 1, 1], cerca: [s.cx + 6, s.cy + 6, 1, 1], lejos: [s.cx + 13, s.cy + 13, 1, 1], izq: [s.cx - 5, s.cy + 12, -1, 1], der: [s.cx + 12, s.cy - 5, 1, -1], detras: [md.cx - 14, md.cy - 14, -1, -1] }[pu];
        let c = null; for (let d = 0; d < 20 && !c; d++) { const x = Math.round(base[0] + base[2] * d), y = Math.round(base[1] + base[3] * d); if (libre(x, y) && libre(x + 1, y) && libre(x, y + 1)) c = [x, y, d]; }
        if (!c) return { sin: 1 };
        j.heroe.x = c[0] + 0.5; j.heroe.y = c[1] + 0.5; j.heroe.camino = null; j.heroe.destino = null;
        return { d: c[2] };
      }, pu);
      if (!r || r.sin) { console.log(zid, pu, 'sin sitio'); continue; }
      await p.waitForTimeout(2600);
      const m = await p.evaluate(async () => {
        const j = window.__juego(), z = j.zona, s = z.salidas.find((q) => q.piezas && q.piezas.length);
        const A = await import('/src/motor/assets.ts'), Lz = await import('/src/nucleo/lienzo.ts');
        const k = window.__vista().ZM || 1, cv = document.getElementById('juego').getBoundingClientRect();
        let arriba = 1e9, falta = 0;
        for (const o of s.piezas) { const q = A.objetoMeta(o.id, o.v)?.f[0]; if (!q) { falta++; continue; } const [, py] = window.__aPant(o.cx + 0.5, o.cy + 0.5); arriba = Math.min(arriba, py - q.ay * k); }
        const [hx, hy] = window.__aPant(j.heroe.x, j.heroe.y);
        return { arriba, falta, hud: cv.height - Lz.ALTO_HUD * cv.height / window.__vista().H, hy };
      });
      const fila = `${zid} ${pu} d=${r.d} arriba=${m.arriba.toFixed(0)} héroe=${m.hy.toFixed(0)} hud=${m.hud.toFixed(0)}${m.falta ? ' SIN ATLAS ' + m.falta : ''}${m.arriba < -30 && pu === 'puerta' ? ' CORTADO' : ''}`;
      console.log(fila); filas.push(fila);
      if ((m.arriba < -30 && pu === 'puerta') || m.falta) malos.push(fila);
      await p.screenshot({ path: `${DIR}/${zid}_${pu}.png` });
    }
    // la puerta lleva a su mazmorra
    if (!process.env.SIN_ENTRAR) {
      await p.evaluate(() => { const j = window.__juego(), s = j.zona.salidas.find((q) => q.piezas && q.piezas.length); j.heroe.x = s.cx + 1.6; j.heroe.y = s.cy + 1.6; j.heroe.destino = null; j.heroe.salida = s; window.__salidaPrueba = s.destino; });
      const llego = await p.waitForFunction(() => window.__juego().zona.id === window.__salidaPrueba, null, { timeout: 8000 }).then(() => true, () => false);
      const fila = `${zid} entra por la puerta: ${llego ? 'sí' : 'NO'}`; console.log(fila); filas.push(fila); if (!llego) malos.push(fila);
    }
  }
  fs.writeFileSync(`${DIR}/medidas.txt`, filas.join('\n') + '\n');
  console.log('malos', malos.length, malos, 'errores', errs.slice(0, 3));
  await b.close(); process.exit(malos.length ? 1 : 0);
})();
