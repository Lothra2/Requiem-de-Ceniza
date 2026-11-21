// Los hitos de los mundos abiertos en la pantalla de 720 (entrega 6): que ninguno se corte desde donde se lo ve llegar.
// Para cada zona con `acto_hito` pone al héroe al pie, del lado del relato (+x +y, lo que ve la cámara), a los costados y
// detrás (para mirar la ventana de lo alto que tapa al héroe, recorte.ts), mide la caja del sprite en pantalla contra el mundo
// visible (de 0 al borde del HUD) y guarda una foto por puesto.
//   CHROMIUM=... URL=http://127.0.0.1:5196/ node juego/herramientas/t1030_hitos_pantalla.cjs <etiqueta> [zonas] [puestos]
//   puestos: frente,izq,der,detras (por omisión los cuatro). VISTA=pc|pc1080. BANDERAS=__alfaViejo. Falla si alguno se corta.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const et = process.argv[2] || 'ahora';
const ZONAS = (process.argv[3] || 'a1_paramo,a1_bosque,a1_cementerio,a2_dunas,a2_oasis_muerto,a2_ruinas,a3_selva,a3_pantano,a4_picos,a4_glaciar,a5_llanuras,a5_rio,a6_costa,a6_arrecife,a6_barrio1,a6_barrio2,a7_cielo,a7_jardin').split(',');
const PUESTOS = (process.argv[4] || 'frente,izq,der,detras').split(',');
const DIR = `/tmp/requiem-pruebas/e6/hitos/${et}`; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p, errs } = await entrar(process.env.VISTA || 'pc', 'berserker', 30, process.env.URL || 'http://127.0.0.1:5196/', "d.id = 'auditoria1'");
  if (process.env.BANDERAS) await p.evaluate((bs) => { for (const k of bs.split(',')) window[k] = true; }, process.env.BANDERAS);
  await p.evaluate(() => setInterval(() => { const j = window.__juego && window.__juego(); if (j && j.heroe) { j.heroe.vida = j.heroe.vidaMax; for (const m of j.monstruos) if (!m.dueno) { m.estado = 'dormido'; m.vel = 0; m.x = 3; m.y = 3; } } }, 50));
  const malos = [], filas = [];
  for (const zid of ZONAS) {
    try { await p.evaluate((z) => window.__ir(z, 'arriba'), zid); await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); }
    catch { console.log(zid, 'no entra'); continue; }
    await p.waitForTimeout(1500);
    for (const pu of PUESTOS) {
      const r = await p.evaluate(async (pu) => {
        const j = window.__juego(), z = j.zona, o = z.objetos.find((q) => q.id === 'acto_hito'); if (!o) return null;
        z.explorado.fill(1);
        // el rumbo del puesto: frente = +x +y (la diagonal que ve la cámara), los costados a 45 grados, detrás = -x -y
        const R = { frente: [1, 1], izq: [0, 1], der: [1, 0], detras: [-1, -1] }[pu];
        const libre = (x, y) => x > 0 && y > 0 && x < z.W && y < z.H && z.bloq[y * z.W + x] === 0;
        let c = null; for (let d = 2; d < 30 && !c; d++) { const x = Math.round(o.cx + R[0] * d), y = Math.round(o.cy + R[1] * d); if (libre(x, y) && libre(x + 1, y) && libre(x, y + 1)) c = [x, y, d]; }
        if (!c) return { sin: 1 };
        j.heroe.x = c[0] + 0.5; j.heroe.y = c[1] + 0.5; j.heroe.camino = null; j.heroe.destino = null;
        return { cx: o.cx, cy: o.cy, v: o.v, d: c[2] };
      }, pu);
      if (!r || r.sin) { console.log(zid, pu, r ? 'sin sitio' : 'sin hito'); continue; }
      await p.waitForTimeout(1600);
      const m = await p.evaluate(async () => {
        const j = window.__juego(), z = j.zona, o = z.objetos.find((q) => q.id === 'acto_hito');
        const A = await import('/src/motor/assets.ts'), Lz = await import('/src/nucleo/lienzo.ts');
        const q = A.objetoMeta(o.id, o.v).f[0], [px, py] = window.__aPant(o.cx + 0.5, o.cy + 0.5), [hx, hy] = window.__aPant(j.heroe.x, j.heroe.y);
        const k = window.__vista().ZM || 1, cv = document.getElementById('juego').getBoundingClientRect();
        return { arriba: py - q.ay * k, abajo: py - q.ay * k + q.h * k, izq: px - q.ax * k, der: px - q.ax * k + q.w * k, alto: q.h, ay: q.ay, hud: cv.height - Lz.ALTO_HUD * cv.height / window.__vista().H, W: cv.width, hx, hy };
      });
      const corte = Math.max(0, -m.arriba) + Math.max(0, m.izq < 0 ? -m.izq : 0) + Math.max(0, m.der - m.W);
      const fila = `${zid} ${r.v} ${pu} d=${r.d} alto=${m.alto} (ancla ${m.ay}) arriba=${m.arriba.toFixed(0)} abajo=${m.abajo.toFixed(0)} hud=${m.hud.toFixed(0)} x=${m.izq.toFixed(0)}..${m.der.toFixed(0)} héroe=${m.hy.toFixed(0)}${corte > 0 && pu !== 'detras' ? '  CORTADO ' + corte.toFixed(0) : ''}`;
      console.log(fila); filas.push(fila);
      if (corte > 0 && pu !== 'detras') malos.push(fila);
      await p.screenshot({ path: `${DIR}/${zid}_${pu}.png` });
    }
  }
  fs.writeFileSync(`${DIR}/medidas.txt`, filas.join('\n') + '\n');
  console.log('cortados', malos.length, 'errores', errs.slice(0, 3));
  await b.close(); process.exit(malos.length ? 1 : 0);
})();
