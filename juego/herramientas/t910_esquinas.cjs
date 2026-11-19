// Las esquinas de los muros: busca en cada zona las esquinas donde se juntan dos muros (la que sale hacia la sala, en V
// hacia la cámara, y la del fondo, en L), la mira sin oscuridad ni niebla y guarda el recorte con y
// sin las esquinas nuevas (`__sinEsquinas`), lado a lado, en /tmp/requiem-pruebas/esquinas.
// Uso: node juego/herramientas/t910_esquinas.cjs [etiqueta] [zona,zona,...] [esquinas por zona]   (URL= otro puerto)
// Con OSCURO=1 deja la luz de la zona. El héroe se para unas 6 celdas delante de cada esquina (la cámara lo sigue).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const ZONAS = (process.argv[3] || 'a1_cripta,a1_abadia1,a1_abadia2,a1_cata1,a1_mina1,a1_mina2,a2_nombres1,a2_tumbas1,a3_hundida1,a3_templo1,a5_fragua,a6_faro,a7_boveda,a4_fortin,a5_bastion,a1_refugio').split(',');
const ETQ = process.argv[2] || 'esq', N = +(process.argv[4] || 2), DIR = '/tmp/requiem-pruebas/esquinas';
(async () => {
  fs.mkdirSync(DIR, { recursive: true });
  const { b, p, errs } = await entrar('pc', 'berserker', 30);
  if (!process.env.OSCURO) await p.evaluate(() => { window.__topeOscuro = 0; });
  const res = [];
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid); await p.waitForTimeout(3500);
    const esq = await p.evaluate((N) => {
      const j = window.__juego(), z = j.zona, W = z.W, H = z.H;
      // las piezas largas de muro (5 x 1 o 1 x 5) que bloquean
      const ms = z.objetos.filter((o) => o.bloquea && ((o.hw === 5 && o.hh <= 2) || (o.hh === 5 && o.hw <= 2)));
      const X = new Map(), Y = new Map();
      for (const o of ms) { const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2); if (o.hh === 1) X.set(x0 + ',' + y0, o); else Y.set(x0 + ',' + y0, o); }
      const out = [];
      for (const [k, o] of X) {
        const [x0, y] = k.split(',').map(Number), c = x0 + o.hw;
        // en V: el muro en x termina en c - 1 y el muro en y de la columna c termina en la fila y - 1 (la baldosa de atrás
        // vacía, las tres de alrededor con piso)
        for (const [k2, q] of Y) { const [xc, y0] = k2.split(',').map(Number); if (xc === c && y0 + q.hh === y) out.push({ tipo: 'v', x: c, y, a: o.id + ':' + o.v, b: q.id + ':' + q.v }); }
        // en L: los dos muros empiezan en la misma celda
        if (Y.has(x0 + ',' + y)) out.push({ tipo: 'l', x: x0 + 0.5, y: y + 0.5, a: o.id + ':' + o.v, b: Y.get(x0 + ',' + y).id + ':' + Y.get(x0 + ',' + y).v });
      }
      const h = j.heroe, lejos = (e) => Math.hypot(e.x - h.x, e.y - h.y) > 14;
      const v = out.filter((e) => e.tipo === 'v' && lejos(e)), l = out.filter((e) => e.tipo === 'l' && lejos(e));
      z.explorado.fill(1);
      return { nV: out.filter((e) => e.tipo === 'v').length, nL: out.filter((e) => e.tipo === 'l').length, lista: [...v.slice(0, N), ...l.slice(0, N)] };
    }, N);
    res.push(`${zid}: ${esq.nV} en V, ${esq.nL} en L`);
    let i = 0;
    for (const e of esq.lista) {
      const fotos = [];
      for (const sin of [true, false]) {
        // la cámara sigue al héroe: se lo para delante de la esquina, unas 6 celdas hacia la cámara (queda abajo, fuera
        // del recorte). (El foco de escena.ts no sirve: importar el módulo desde la prueba da otra copia)
        await p.evaluate(([e, sin]) => {
          window.__sinEsquinas = sin;
          const j = window.__juego(), z = j.zona, h = j.heroe; j.monstruos.length = 0;
          let d = 6; for (; d < 10; d++) { const X = Math.floor(e.x + d), Y = Math.floor(e.y + d); if (X < z.W && Y < z.H && z.bloq[Y * z.W + X] !== 1) break; }
          h.x = e.x + d + 0.1; h.y = e.y + d + 0.1; h.camino = [];
        }, [e, sin]);
        await p.waitForTimeout(1200);
        const [sx, sy] = await p.evaluate((e) => window.__aPant(e.x - 0.5, e.y - 0.5), e);
        const w = 240, hgt = 205, clip = { x: Math.min(1280 - w, Math.max(0, sx - w / 2)), y: Math.min(720 - hgt, Math.max(0, sy - 190)), width: w, height: hgt };
        const nom = `${DIR}/${ETQ}_${zid}_${e.tipo}${i}_${sin ? 'antes' : 'ahora'}.png`;
        await p.screenshot({ path: nom, clip }); fotos.push(nom);
      }
      res.push(`  ${zid} ${e.tipo}${i} ${e.a} + ${e.b} en ${e.x},${e.y}`); i++;
    }
  }
  console.log(res.join('\n')); console.log(errs.filter((e) => !/404/.test(e)).slice(0, 5));
  await b.close();
})();
