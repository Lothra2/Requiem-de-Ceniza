// El jefe que embiste corre de verdad (Rick, 20 nov 2026: "los bosses solo se deslizan, la imagen congelada").
// node juego/herramientas/t997_embestida.cjs [id] [etiqueta]   (`VIEJO=1` sin sumar lo recorrido en la embestida)
// Pone al jefe a 6 casillas, le fuerza la embestida y, en cámara lenta (x0,15), saca 14 recortes del cuerpo y anota el
// cuadro de animación que se ve (`recorrido`, acción) en cada uno. Lámina en /tmp/requiem-pruebas/embestida.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs'), { execSync } = require('child_process');
const ID = process.argv[2] || 'verdugo', ET = process.argv[3] || 'ahora', DIR = `/tmp/requiem-pruebas/embestida/${ET}`;
(async () => {
  fs.rmSync(DIR, { recursive: true, force: true }); fs.mkdirSync(DIR, { recursive: true });
  const { b, p, errs } = await entrar('pc', 'templario', 30, undefined);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4000);
  await p.evaluate(async (id) => {
    const j = window.__juego(), z = j.zona, h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts');
    window.__sinLluvia = true; window.__sinAmbiente = true;
    let mejor = null, md = 0;
    for (let y = 18; y < z.H - 18; y += 2) for (let x = 18; x < z.W - 18; x += 2) { let libre = true; for (let dy = -4; dy <= 4 && libre; dy++) for (let dx = -2; dx <= 8; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue; let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; h.vida = h.vidaMax = 1e7;
    j.monstruos = j.monstruos.filter((o) => o.dueno); j.monstruos.forEach((o) => { o.x = h.x - 30; o.vel = 0; }); j.npcs.length = 0;
    const df = D.MONSTRUOS[id]; (h.d.jefesVistos ??= []).push(df.id);
    const m = M.crearMonstruo(df, 20, h.x + 6, h.y - 0.5, 0, 0); m.vida = m.vidaMax = 1e7; m.estado = 'perseguir'; m.objetivo = h; m.alerta = 0; m.cd = 999; j.monstruos.push(m); window.__m = m;
  }, ID);
  await p.waitForTimeout(3500); // (que bajen los atlas)
  if (process.env.VIEJO) await p.evaluate(() => { window.__embestidaVieja = true; });
  // la embestida: solo esa maniobra, ya
  await p.evaluate(() => { const m = window.__m, h = window.__juego().heroe; m.x = h.x + 6; m.y = h.y - 0.5; m.man = undefined; m.manCd = 0; m.def = { ...m.def, proyectil: undefined, ia: 'bruto' }; window.__camaraLenta = 0.15; });
  const datos = [];
  for (let i = 0; i < 60 && datos.length < 14; i++) {
    const s = await p.evaluate(() => { const m = window.__m; return { fase: m.man?.fase, tipo: m.man?.tipo, acc: m.acc, vis: m.accVis, rec: +(m.recorrido ?? 0).toFixed(2), x: +m.x.toFixed(2), p: window.__aPant(m.x, m.y) }; });
    if (s.fase === 'accion' && s.tipo === 'embestida') {
      const [px, py] = s.p;
      await p.screenshot({ path: `${DIR}/f${String(datos.length).padStart(2, '0')}.png`, clip: { x: Math.max(0, px - 110), y: Math.max(0, py - 200), width: 220, height: 230 } });
      datos.push(s);
    } else if (s.tipo && s.tipo !== 'embestida') await p.evaluate(() => { window.__m.man = undefined; window.__m.manCd = 0; });
    await p.waitForTimeout(90);
  }
  console.log(JSON.stringify(datos.map((d) => [d.acc, d.vis, d.rec, d.x])));
  try { execSync(`python3 -c "
from PIL import Image;import glob
fs=sorted(glob.glob('${DIR}/f*.png'));ims=[Image.open(f) for f in fs]
if ims:
  w,h=ims[0].size;o=Image.new('RGB',(w*7,h*((len(ims)+6)//7)))
  for i,im in enumerate(ims):o.paste(im,((i%7)*w,(i//7)*h))
  o.save('${DIR}/../lamina_${ET}.png')"`); } catch (e) { console.log(String(e).slice(0, 200)); }
  console.log(errs.slice(0, 3)); await b.close();
})();
