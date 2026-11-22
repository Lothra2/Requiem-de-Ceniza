// Video de un recorrido de verdad (reloj del juego controlado, 25 por segundo): el héroe (invulnerable, berserker de nivel 30)
// entra por la puerta y explora yendo a lo más cercano que no vio; si algo lo persigue a 7 casillas se da vuelta y pelea.
// Anota cuándo aparece cada grupo en pantalla (a 14 casillas y a la vista) y cuándo despierta cada cuerpo (para ver si
// despierta el grupo y no el campamento entero). Sirve para comparar el reparto con los campamentos (BANDERAS=__campamentos).
//   node juego/herramientas/t1041_video_recorrido.cjs <etiqueta> [zonas] (SEG=40)  -> /tmp/requiem-pruebas/enemigos/video/<etiqueta>
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const { execSync } = require('child_process');
const etq = process.argv[2] || 'ahora', ZONAS = (process.argv[3] || 'a1_paramo,a1_cripta').split(','), SEG = +(process.env.SEG || 40);
const DIR = '/tmp/requiem-pruebas/enemigos/video/' + etq; fs.mkdirSync(DIR, { recursive: true });
(async () => {
  const { b, p } = await entrar('pc', 'berserker', 30, undefined, "d.id = 'auditoria1';");
  for (const b2 of (process.env.BANDERAS || '').split(',').filter(Boolean)) await p.evaluate((k) => { window[k] = true; }, b2);
  const resumen = {};
  for (const zid of ZONAS) {
    await p.evaluate((z) => window.__ir(z, 'arriba'), zid);
    await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, zid, { timeout: 60000 }); await p.waitForTimeout(2500);
    await p.evaluate(() => {
      const j = window.__juego(), z = j.zona, h = j.heroe, W = z.W, H = z.H;
      h.vida = h.vidaMax = 1e7; (h.d.thor ??= {}).descanso = 1e9; j.monstruos = j.monstruos.filter((o) => !o.dueno);
      const visto = new Uint8Array(W * H), libre = (i) => z.bloq[i] === 0 || z.bloq[i] === 3;
      const S = (window.__rec = { visto, grupos: {}, desp: {}, eventos: [], t0: j.t });
      const gid = (m) => (m.def.jefe || m.calidad >= 3 ? 'jefe' : String(m.camp));
      window.__paso = () => {
        h.vida = h.vidaMax; h.muerto = false;
        const cx = Math.floor(h.x), cy = Math.floor(h.y);
        for (let dy = -12; dy <= 12; dy++) for (let dx = -12; dx <= 12; dx++) { const X = cx + dx, Y = cy + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && dx * dx + dy * dy <= 144) visto[Y * W + X] = 1; }
        const t = +(j.t - S.t0).toFixed(2);
        for (const m of j.monstruos) {
          if (m.dueno || m.muerto) continue; const g = gid(m);
          if (!S.grupos[g] && Math.hypot(m.x - h.x, m.y - h.y) < 14) { S.grupos[g] = t; S.eventos.push([t, g, j.monstruos.filter((o) => !o.muerto && gid(o) === g).length]); }
          if (m.estado === 'perseguir' && S.desp[m.id] == null) S.desp[m.id] = [t, g];
        }
        // pelear con lo que lo persigue cerca
        let mejor = null, bd = 7; for (const m of j.monstruos) if (!m.dueno && !m.muerto && m.estado === 'perseguir') { const d = Math.hypot(m.x - h.x, m.y - h.y); if (d < bd) { bd = d; mejor = m; } }
        if (mejor) { h.objetivo = mejor; return; }
        if (h.objetivo && !h.objetivo.muerto) return;
        h.objetivo = null;
        if (h.camino && h.camino.length > 2) return;
        // a lo más cercano que no vio (hasta 22 pasos por ese camino)
        const prev = new Int32Array(W * H).fill(-1), q = [cy * W + cx]; prev[q[0]] = q[0]; let meta = -1;
        for (let k = 0; k < q.length && meta < 0; k++) { const i = q[k], px = i % W, py = (i - px) / W; for (const [ex, ey] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = px + ex, Y = py + ey; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const n = Y * W + X; if (prev[n] < 0 && libre(n)) { prev[n] = i; if (!visto[n]) { meta = n; break; } q.push(n); } } }
        if (meta < 0) return;
        const ruta = []; for (let i = meta; i !== q[0]; i = prev[i]) ruta.push(i); ruta.reverse();
        const d = ruta[Math.min(ruta.length - 1, 22)]; window.__mundo.caminarA(j, (d % W) + 0.5, Math.floor(d / W) + 0.5);
      };
    });
    // (con el reloj quieto el pintor del héroe no avanza y sale la silueta blanca: se le da tiempo antes de la primera zona)
    if (zid === ZONAS[0]) await p.waitForTimeout(+(process.env.ESPERA || 30000)); else await p.waitForTimeout(300);
    await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500)); for (let i = 0; i < 10; i++) await p.clock.runFor(40);
    const d = `${DIR}/${zid}`; fs.rmSync(d, { recursive: true, force: true }); fs.mkdirSync(d, { recursive: true });
    for (let i = 0; i < SEG * 25; i++) {
      if (i % 5 === 0) await p.evaluate(() => window.__paso());
      await p.clock.runFor(40);
      await p.screenshot({ path: `${d}/f${String(i).padStart(4, '0')}.jpg`, type: 'jpeg', quality: 80 });
    }
    await p.clock.resume();
    try { execSync(`ffmpeg -y -loglevel error -framerate 25 -i ${d}/f%04d.jpg -vf scale=960:-2 -c:v libx264 -pix_fmt yuv420p -crf 23 ${DIR}/${zid}.mp4`); } catch (e) { console.log('ffmpeg', String(e).slice(0, 200)); }
    // una tira de 8 cuadros para mirar sin el video
    try { const fr = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => `${d}/f${String(Math.floor((k + 0.5) * SEG * 25 / 8)).padStart(4, '0')}.jpg`); execSync(`ffmpeg -y -loglevel error ${fr.map((f) => `-i ${f}`).join(' ')} -filter_complex "${fr.map((_, k) => `[${k}]scale=480:-2[a${k}]`).join(';')};${fr.map((_, k) => `[a${k}]`).join('')}xstack=inputs=8:layout=0_0|w0_0|w0+w1_0|w0+w1+w2_0|0_h0|w0_h0|w0+w1_h0|w0+w1+w2_h0" ${DIR}/tira_${zid}.jpg`); } catch (e) { console.log('tira', String(e).slice(0, 200)); }
    fs.rmSync(d, { recursive: true, force: true });
    const r = await p.evaluate(() => { const S = window.__rec, j = window.__juego(); const ev = S.eventos.filter((e) => e[1] !== 'jefe'); const gaps = ev.map((e, k) => +(e[0] - (k ? ev[k - 1][0] : 0)).toFixed(1));
      // despertares: por grupo, cuántos de sus cuerpos despertaron y cuántos grupos despertaron a la vez (en el mismo medio segundo)
      const porT = {}; for (const [id, [t, g]] of Object.entries(S.desp)) { const k = Math.floor(t * 2); (porT[k] ??= new Set()).add(g); }
      const juntos = Object.values(porT).map((s) => s.size);
      return { encuentros: ev.length, segundosEntre: gaps, tamanos: ev.map((e) => e[2]), muertos: j.monstruos.filter((m) => m.muerto).length, despiertos: Object.keys(S.desp).length, gruposQueDespiertanJuntos: Math.max(0, ...juntos) }; });
    resumen[zid] = r; console.log(zid, JSON.stringify(r));
  }
  fs.writeFileSync(`${DIR}/resumen.json`, JSON.stringify(resumen, null, 1));
  await b.close();
})();
