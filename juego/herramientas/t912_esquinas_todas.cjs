// Las esquinas de muro en todas las zonas (varias semillas, sin dibujar): cuántas hay, que cada una tenga su sprite
// horneado, que no toquen `bloq` ni muevan los objetos de antes, y qué adorno quedó metido en la celda de una esquina.
// Uso: node juego/herramientas/t912_esquinas_todas.cjs [semillas]   (URL= otro puerto)
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar('pc', 'berserker', 8);
  const r = await p.evaluate(async (N) => {
    const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts');
    const man = await (await fetch('/assets/manifiesto.json')).json();
    const out = []; let total = 0, sinSprite = 0, encima = 0; const porVar = {};
    for (const id of Object.keys(A.ZONAS)) for (let s = 1; s <= N; s++) {
      const z = Z.generarZona(A.ZONAS[id], s * 7919 + 13), es = z.objetos.filter((o) => o.id === 'muro_esquina');
      // las esquinas van al final y no bloquean nada
      const i0 = z.objetos.findIndex((o) => o.id === 'muro_esquina');
      if (i0 >= 0 && z.objetos.slice(i0).some((o) => o.id !== 'muro_esquina')) out.push(id + ' esquinas en medio de la lista');
      for (const e of es) {
        total++; porVar[e.v] = (porVar[e.v] ?? 0) + 1;
        if (!man.o['muro_esquina|' + e.v]) { sinSprite++; out.push('sin sprite ' + e.v); }
        if (e.bloquea) out.push(id + ' esquina que bloquea');
        const otro = z.objetos.find((o) => o !== e && o.id !== 'muro_esquina' && !/muro|pared|muralla|almena|nichos|loculos|osario/.test(o.id) && !(man.o[o.id + '|' + o.v]?.plano) && Math.abs(o.cx - e.cx) <= (o.hw - 1) / 2 + 0.01 && Math.abs(o.cy - e.cy) <= (o.hh - 1) / 2 + 0.01);
        if (otro) { encima++; if (encima <= 15) out.push(`${id} ${s}: ${otro.id}:${otro.v} en la celda de la esquina ${e.cx},${e.cy}`); }
      }
    }
    out.push(`TOTAL ${total} esquinas, ${sinSprite} sin sprite, ${encima} con un adorno en su celda`, JSON.stringify(porVar));
    return out;
  }, +(process.argv[2] || 2));
  console.log(r.join('\n')); console.log(errs.filter((e) => !/404/.test(e)).slice(0, 3));
  await b.close();
})();
