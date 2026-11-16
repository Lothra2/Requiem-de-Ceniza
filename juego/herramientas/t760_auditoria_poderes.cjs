// Auditoría de poderes: cada habilidad activa contra tres zombis pegados (para que el cuerpo a cuerpo pegue ya), en campo
// abierto y sin lluvia, cuatro cuadros seguidos por habilidad.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const clase = process.argv[2] || 'templario';
  const { b, p, errs } = await entrar('pc', clase, 30);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  const ok = await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; let mejor = null, md = 0;
    for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -5; dy <= 5 && libre; dy++) for (let dx = -5; dx <= 5; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); for (const s of z.salidas) d = Math.min(d, Math.hypot(s.cx - x, s.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) return null; h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y]; return md; });
  await p.waitForTimeout(1500);
  const ids = await p.evaluate(async () => { const C = await import('/src/datos/clases.ts'); const h = window.__juego().heroe; for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; return C.HABILIDADES.filter((x) => x.clase === h.d.clase && x.tipo !== 'pasiva').map((x) => x.id); });
  let n = 0;
  for (const id of ids) {
    await p.evaluate(async (id) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts'); const hb = C.HABILIDADES.find((x) => x.id === id);
      h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null;
      h.vida = h.vidaMax = 1e6; h.mana = h.c.manaMax = 1e5; h.recargas = {}; h.acc = 'quieto'; h.furia = 100; h.frascos = 9; h.salto = null; h.dir = 'se'; h.buffs = {};
      if (hb.forma) h.buffs[hb.forma === 'oso' ? 'forma_oso' : 'forma_lobo'] = { t: 30, bonos: {}, hab: 'x' };
      j.monstruos = j.monstruos.filter((o) => o === j.thor || (o.dueno && false)); j.efectos.length = 0; j.proyectiles.length = 0; j.areas.length = 0; j.particulas.length = 0;
      const ms = [0, 1, 2].map((i) => { const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 1.25 + i * 0.75, h.y + 0.35 - i * 0.55, 0, 0); m.vida = m.vidaMax = 50000; m.estado = 'dormido'; j.monstruos.push(m); return m; });
      M.usarHabilidad(j, id, ms[0].x, ms[0].y, ms[0], false); }, id);
    for (let i = 0; i < 4; i++) { await p.waitForTimeout(i ? 110 : 90); await p.screenshot({ path: `/tmp/requiem-pruebas/pa/${clase}_${String(n).padStart(2, '0')}_${i}.png`, clip: { x: 640 - 130, y: 300 - 120, width: 300, height: 220 } }); }
    await p.waitForTimeout(1300); n++;
  }
  fs.writeFileSync(`/tmp/requiem-pruebas/pa/${clase}.json`, JSON.stringify(ids)); console.log(clase, ok, ids.length, errs.filter((e) => !/404/.test(e)).slice(0, 2));
  await b.close();
})();
