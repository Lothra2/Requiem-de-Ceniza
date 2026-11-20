// De cerca, un cadáver que revienta (cuarta pasada de poderes, 20 nov 2026): un muerto suelto a dos casillas del héroe en
// las dunas, sin nadie alrededor, y <id> (explosion_cadaver, cosecha_osario, festin_tumba) en cámara lenta. Recortes de
// 160 x 120 alrededor del muerto cada 0,03 s de juego en /tmp/requiem-pruebas/poderes4/cadaver/<etiqueta>.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => { const [id = 'explosion_cadaver', et = 'despues'] = process.argv.slice(2); const D = `/tmp/requiem-pruebas/poderes4/cadaver/${et}`; fs.mkdirSync(D, { recursive: true });
  const { b, p } = await entrar('pc', 'nigromante', 30);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  await p.evaluate((s) => { window.__SIN = s[0]; window.__sinHincha = s[1]; }, [!!process.env.SIN, !!process.env.NOH]);
  await p.evaluate(async (id) => { const j = window.__juego(), z = j.zona, h = j.heroe, M = window.__mundo, Dm = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts'); window.__sinLluvia = true; window.__sinAmbientePfx = true; j.portal = null; (h.d.thor ??= {}).descanso = 1e9; if (window.__SIN) window.__sinPoderesVivos = true;
    let mejor = null, md = -1; for (let y = 16; y < z.H - 16; y += 2) for (let x = 16; x < z.W - 16; x += 2) { let libre = true; for (let dy = -5; dy <= 5 && libre; dy++) for (let dx = -5; dx <= 5; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue; let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; z.objetos = z.objetos.filter((o) => Math.hypot(o.cx - h.x, o.cy - h.y) > 10); j.monstruos = [];
    for (const x of C.HABILIDADES) if (x.clase === h.d.clase) h.d.habs[x.id] = 5; h.mana = h.c.manaMax = 1e5; h.dir = 'se';
    const c = M.crearMonstruo(Dm.MONSTRUOS['zombi'], 10, h.x + 2.2, h.y - 0.4, 0, 0); c.vida = 0; c.muerto = true; c.estado = 'dormido'; c.acc = 'morir'; c.t = 5; c.tMuerto = 5; j.monstruos.push(c); window.__c = c; }, id);
  await p.waitForTimeout(2500);
  const [cx, cy] = await p.evaluate(() => window.__aPant(window.__c.x, window.__c.y)); const AN = +(process.env.ANCHO || 160), DX = AN - 80, T0 = +(process.env.DESDE ?? 0.3); const caja = { x: Math.round(cx) - DX, y: Math.round(cy) - 90, width: AN, height: 120 }; // (ANCHO=240 entra el héroe, DESDE=0 desde que se pide; VIEJO=1 el Festín de antes)
  if (process.env.VIEJO) await p.evaluate(() => { window.__festinViejo = true; });
  if (process.env.DBG) { const sh = async (n) => { await p.screenshot({ path: `${D}/dbg_${n}.png`, clip: caja }); }; await sh('a'); await p.evaluate(() => { const j = window.__juego(); window.__camaraLenta = 0.02; window.__c.revienta = j.t + 0.18; window.__c.tMuerto = 598; }); await p.waitForTimeout(2500); await sh('b'); await p.evaluate(() => { window.__c.tMuerto = 5; }); await p.waitForTimeout(300); await sh('c'); await b.close(); return; }
  await p.evaluate((id) => { const j = window.__juego(); window.__camaraLenta = 0.1; window.__t0 = j.t; window.__mundo.usarHabilidad(j, id, window.__c.x, window.__c.y, null, false); }, id);
  for (let i = 0; i < 30; i++) { await p.waitForFunction(([t]) => window.__juego().t - window.__t0 >= t, [T0 + 0.03 * i], { timeout: 20000, polling: 5 }).catch(() => {}); const [qx, qy] = await p.evaluate(() => window.__aPant(window.__c.x, window.__c.y)); await p.screenshot({ path: `${D}/${id}_${String(i).padStart(2, '0')}.png`, clip: { ...caja, x: Math.round(qx) - DX, y: Math.round(qy) - 90 } }); }
  await p.evaluate(() => { window.__camaraLenta = 1; }); await b.close();
  const { execSync } = require('child_process'); execSync(`python3 -c "
from PIL import Image
L=Image.new('RGB',(160*10,120*3))
for i in range(30): L.paste(Image.open('${D}/${id}_%02d.png'%i),((i%10)*160,(i//10)*120))
L.resize((L.width*2,L.height*2),Image.NEAREST).save('${D}/lamina_${id}.png')"`);
  console.log(id, et, 'listo');
})();
