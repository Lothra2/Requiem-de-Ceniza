// Enemigos atascados contra los muros (Rick, 20 nov 2026: "los enemigos quedan como atorados en las paredes").
// node juego/herramientas/t995_atascos.cjs [zonas]   (`VIEJO=1` sin el arreglo, `FOTO=1` guarda capturas de los atascados)
// En cada zona pone al héroe (invulnerable, sin pegar) en varios puntos, despierta a todo lo que esté a 22 casillas y deja
// correr 9 s. Un atascado es el que persigue, no está a tiro de pegar y en los últimos 3 s avanzó menos de 0,6 casillas
// hacia el héroe. Además cuenta los cuerpos con el centro a menos de 0,25 de un muro (se ven metidos en la pared).
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
const ZONAS = (process.argv[2] || 'a1_cripta,a1_cata1,a1_abadia1,a1_mina1,a1_pastor,a2_tumbas1,a4_hielo1,a5_santuario1').split(',');
(async () => {
  const { b, p, errs } = await entrar('pc', 'arcanista', 30, undefined);
  if (process.env.VIEJO) await p.evaluate(() => { window.__atascoViejo = true; });
  // (el frente de la oleada 2 deja a los que no tienen turno rondando a 3 casillas: acá se mide el camino, no el turno)
  await p.evaluate(() => { window.__frenteViejo = true; });
  if (process.env.SIN_TURNO) await p.evaluate(() => { window.__SIN_TURNO = true; });
  const total = { lugares: 0, perseguian: 0, atascados: 0, pegados: 0, enMuro: 0 };
  fs.mkdirSync('/tmp/requiem-pruebas/atascos', { recursive: true });
  for (const zona of ZONAS) {
    await p.evaluate((z) => window.__ir(z), zona); await p.waitForTimeout(3000);
    const puntos = await p.evaluate(() => {
      const j = window.__juego(), z = j.zona, W = z.W, out = []; let sem = 12345; const rnd = () => (sem = (sem * 1103515245 + 12345) % 2147483648) / 2147483648;
      const piso = (x, y) => z.bloq[y * W + x] === 0;
      // puntos de piso con algún muro a 2 o 3 casillas (donde se atascan)
      for (let k = 0; k < 4000 && out.length < 6; k++) {
        const x = 3 + Math.floor(rnd() * (W - 6)), y = 3 + Math.floor(rnd() * (z.H - 6));
        if (!piso(x, y) || !piso(x + 1, y) || !piso(x, y + 1)) continue;
        let muro = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) if (z.bloq[(y + dy) * W + x + dx] === 1) muro++;
        if (muro < 4 || out.some(([a, c]) => Math.hypot(a - x, c - y) < 15)) continue;
        out.push([x, y]);
      }
      return out;
    });
    for (const [x, y] of puntos) {
      const r = await p.evaluate(async ([x, y]) => {
        const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
        h.x = x + 0.5; h.y = y + 0.5; h.camino = null; h.destino = null; h.objetivo = null; h.vida = h.vidaMax = 1e7; h.acc = 'quieto';
        j.monstruos.forEach((o) => { if (!o.dueno) { o.vida = 0; o.muerto = true; o.x = -99; } else { o.x = h.x + 60; o.y = h.y + 60; o.vel = 0; } }); window.__thorLejos = true;
        // un anillo de zombis y esqueletos entre 6 y 16 casillas, en piso, del otro lado de los muros también
        const z = j.zona, W = z.W, ids = ['zombi', 'esqueleto', 'necrofago', 'zombi'].filter((i) => D.MONSTRUOS[i]);
        const puestos = []; let sem = x * 977 + y * 131; const rnd = () => (sem = (sem * 1103515245 + 12345) % 2147483648) / 2147483648;
        for (let k = 0; k < 400 && puestos.length < 6; k++) {
          const a = rnd() * Math.PI * 2, d = 6 + rnd() * 10, mx = Math.floor(x + Math.cos(a) * d), my = Math.floor(y + Math.sin(a) * d);
          if (mx < 1 || my < 1 || mx >= W - 1 || my >= z.H - 1 || z.bloq[my * W + mx] !== 0) continue;
          const m = M.crearMonstruo(D.MONSTRUOS[ids[k % ids.length]], 10, mx + 0.5, my + 0.5, 0, 0);
          m.vida = m.vidaMax = 1e7; m.estado = 'perseguir'; m.objetivo = h; m.cd = 999; m.alerta = 0; j.monstruos.push(m); puestos.push(m);
        }
        window.__puestos = puestos;
        return puestos.length;
      }, [x, y]);
      // 9 s de juego: posición a los 6 s y a los 9 s
      await p.waitForTimeout(6000);
      // (oleada 2: lo que falta por el camino de verdad, no en línea recta: rodear un muro largo aleja y no es atascarse)
      await p.evaluate(async () => { const Z = await import('/src/mundo/zona.ts'), j = window.__juego(), h = j.heroe;
        window.__largo = (m) => { const c = Z.buscarCamino(j.zona, m.x, m.y, h.x, h.y, 40000, true); if (!c) return 1e9; let l = 0, x = m.x, y = m.y; for (const [a, b] of c) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l + Math.hypot(h.x - x, h.y - y) * 3; };
        // (entrega 7) lo que le falta por el rodeo entre los cuerpos, con las reservas de los demás (ver t1011)
        window.__rodeoLargo = (m) => { const M = window.__mundo, r = M.rodeoAceptable ? M.rodeoAceptable(j, m, h) : null; if (!r) return null; let l = 0, x = m.x, y = m.y; for (const [a, b] of r.camino) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l; };
        for (const m of window.__puestos) { m.__d6 = window.__largo(m); m.__r6 = window.__rodeoLargo(m); } });
      await p.waitForTimeout(1500);
      await p.evaluate(() => { for (const m of window.__puestos) { m.__d75 = window.__largo(m); m.__r75 = window.__rodeoLargo(m); } });
      await p.waitForTimeout(1500);
      const res = await p.evaluate(async () => {
        const j = window.__juego(), h = j.heroe, z = j.zona, W = z.W, Z = await import('/src/mundo/zona.ts');
        const cerca = (x, y) => { let m = 9; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const cx = Math.floor(x) + dx, cy = Math.floor(y) + dy; if (z.bloq[cy * W + cx] !== 1) continue; const qx = Math.max(cx, Math.min(cx + 1, x)), qy = Math.max(cy, Math.min(cy + 1, y)); m = Math.min(m, Math.hypot(qx - x, qy - y)); } return m; };
        let perseguian = 0, atascados = 0, pegados = 0, enMuro = 0, esperan = 0; const malos = [];
        for (const m of window.__puestos) {
          if (m.muerto) continue;
          const ob = m.objetivo && !m.objetivo.muerto ? m.objetivo : h; if (ob !== h) continue; const d = Math.hypot(m.x - h.x, m.y - h.y), alcance = m.radio + h.radio + 1.2;
          // (el que quedó a más de 22 casillas suelta al héroe y vuelve a deambular, así es el juego: no es un atascado)
          if (m.estado !== 'perseguir') continue;
          if (!Z.pasable(z, m.x, m.y)) enMuro++;
          if (cerca(m.x, m.y) < 0.25) pegados++;
          // ¿hay camino de verdad al héroe? (si no lo hay, quedarse quieto no es atascarse)
          const cam = Z.buscarCamino(z, m.x, m.y, h.x, h.y, 40000, true);
          const llega = cam && Math.hypot(cam[cam.length - 1][0] - h.x, cam[cam.length - 1][1] - h.y) < 1.5;
          if (!llega) continue;
          perseguian++;
          // (cerca y con otro cuerpo pegado: hace cola detrás de los que ya llegaron)
          const cola = d < 4.5 && window.__puestos.some((o) => o !== m && Math.hypot(o.x - m.x, o.y - m.y) < 1.3);
          // (entrega 7: el que da la vuelta al corro por el lado libre se acerca por el rodeo entre los cuerpos; el que no tiene
          //  hueco aceptable espera su turno, como en t1011. SIN_TURNO=1 los cuenta igual como atascados)
          const r9 = window.__rodeoLargo(m), rodea = (m.__r6 != null && r9 != null && m.__r6 - r9 >= 0.6) || (m.__r75 != null && ((r9 != null && m.__r75 - r9 >= 0.3) || m.__d75 - window.__largo(m) >= 0.3)), quieto = m.__d6 - window.__largo(m) < 0.6;
          if (d > alcance + 0.6 && !cola && quieto && !rodea && (r9 == null || (m.__r6 == null && m.__r75 == null)) && !window.__SIN_TURNO) { esperan++; continue; }
          // (el que al final está pegando o en plena maniobra está peleando: no se cuenta)
          if (d > alcance + 0.6 && !cola && !rodea && quieto && (m.man || m.acc === 'atacar' || m.acc === 'lanzar')) continue;
          if (d > alcance + 0.6 && !cola && !rodea && quieto) { atascados++; malos.push([+m.x.toFixed(2), +m.y.toFixed(2), +d.toFixed(1), m.acc, m.def.id, +cerca(m.x, m.y).toFixed(2)]); }
        }
        for (const m of window.__puestos) { m.vida = 0; m.muerto = true; m.x = -99; }
        return { perseguian, atascados, pegados, enMuro, esperan, malos: malos.slice(0, 4) };
      });
      total.lugares++; for (const k of ['perseguian', 'atascados', 'pegados', 'enMuro', 'esperan']) total[k] = (total[k] ?? 0) + res[k];
      if (res.atascados) console.log(zona, x, y, JSON.stringify(res));
    }
  }
  console.log(JSON.stringify(total), errs.slice(0, 3));
  await b.close();
})();
