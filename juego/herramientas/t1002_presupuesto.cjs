// El presupuesto de monstruos de cada zona: cuerpos, experiencia total, élites y tamaño de los campamentos, entrando de verdad a
// las 96 zonas (héroe de id fijo). Sirve para comprobar que rehacer los grupos no infla la experiencia ni el botín (que salen
// de los cuerpos y de su calidad). Uso: node juego/herramientas/t1002_presupuesto.cjs <etiqueta> [otra para comparar]
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const DIR = '/tmp/requiem-pruebas/mundos1'; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const etiqueta = process.argv[2] || 'ahora', otra = process.argv[3];
  const { b, p, errs } = await entrar('pc', 'berserker', 30, undefined, "d.id = 'auditoria1';");
  const ids = await p.evaluate(async () => { const A = await import('/src/mundo/actos.ts'); return Object.values(A.ZONAS).filter((d) => d.tipo !== 'pueblo').map((d) => d.id); });
  const out = {};
  for (const id of ids) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), id);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, id, { timeout: 60000 });
    out[id] = await p.evaluate(() => { const j = window.__juego(), z = j.zona, ms = j.monstruos.filter((m) => !m.dueno); const camp = z.spawns.map(() => 0);
      for (const m of ms) { let bi = -1, bd = 9; z.spawns.forEach((s, k) => { const d = Math.hypot(m.ox - s.cx - 0.5, m.oy - s.cy - 0.5); if (d < bd) { bd = d; bi = k; } }); if (bi >= 0) camp[bi]++; }
      return { tipo: z.tipo, n: ms.length, xp: ms.reduce((t, m) => t + m.xp, 0), cal: [0, 1, 2, 3, 4].map((c) => ms.filter((m) => m.calidad === c).length), camp: camp.filter((n, k) => z.spawns[k].tipo !== 'jefe' && n > 0) }; });
  }
  fs.writeFileSync(`${DIR}/presupuesto_${etiqueta}.json`, JSON.stringify(out));
  const tot = (o) => { const v = Object.values(o), c = v.flatMap((q) => q.camp).sort((a, b) => a - b); return { cuerpos: v.reduce((t, q) => t + q.n, 0), xp: v.reduce((t, q) => t + q.xp, 0), campeones: v.reduce((t, q) => t + q.cal[1], 0), unicos: v.reduce((t, q) => t + q.cal[2], 0), campamentos: c.length, medio: +(c.reduce((a, b) => a + b, 0) / c.length).toFixed(1), mediana: c[c.length >> 1], de6omas: Math.round((c.filter((n) => n >= 6).length / c.length) * 100) + ' %' }; };
  console.log(etiqueta, JSON.stringify(tot(out)));
  if (otra && fs.existsSync(`${DIR}/presupuesto_${otra}.json`)) { const a = JSON.parse(fs.readFileSync(`${DIR}/presupuesto_${otra}.json`, 'utf8')); console.log(otra, JSON.stringify(tot(a)));
    const dif = ids.filter((id) => a[id]).map((id) => ({ id, xp: out[id].xp / Math.max(1, a[id].xp), n: out[id].n / Math.max(1, a[id].n) }));
    const fuera = dif.filter((q) => Math.abs(q.xp - 1) > 0.25); console.log('experiencia total', ((tot(out).xp / tot(a).xp - 1) * 100).toFixed(1) + ' %', '| cuerpos', ((tot(out).cuerpos / tot(a).cuerpos - 1) * 100).toFixed(1) + ' %', '| zonas a más de 25 % de su experiencia de antes:', fuera.length, fuera.slice(0, 12).map((q) => q.id + ' ' + q.xp.toFixed(2)).join(', ')); }
  console.log('errores', errs.slice(0, 3)); await b.close();
})();
