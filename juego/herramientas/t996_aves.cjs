// Los pájaros de pixel de los poderes (quinta pasada): cada especie en sus 8 cuadros de aleteo mirando a un lado y al otro,
// plegados y en picada en 8 rumbos, al cuádruple. Uso: node t996_aves.cjs -> /tmp/requiem-pruebas/poderes5/aves_lamina.png
const { entrar } = require('./comun_pruebas.cjs');
const lamina = async () => {
  const { b, p } = await entrar('pc', 'druida', 10);
  const url = await p.evaluate(async () => { await import('/src/render/presencias.ts'); const Z = 4, L = 36, c = document.createElement('canvas'); c.width = L * 9 * Z; c.height = L * 6 * Z; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.fillStyle = '#8a7656'; g.fillRect(0, 0, c.width, c.height);
    const f = window.__spriteAve; let fila = 0;
    for (const esp of ['cuervo', 'halcon']) { for (const ang of [0, Math.PI]) { for (let i = 0; i < 8; i++) g.drawImage(f(esp, ang, i, 0), i * L * Z, fila * L * Z, L * Z, L * Z); g.drawImage(f(esp, ang, 2, 0.75), 8 * L * Z, fila * L * Z, L * Z, L * Z); fila++; } }
    for (let i = 0; i < 9; i++) g.drawImage(f('halcon', -Math.PI / 2 + (i / 8) * Math.PI, 2, 1), i * L * Z, fila * L * Z, L * Z, L * Z); fila++;
    for (let i = 0; i < 9; i++) g.drawImage(f('halcon', -Math.PI / 2 + (i / 8) * Math.PI, i % 8, 0.3), i * L * Z, fila * L * Z, L * Z, L * Z);
    return c.toDataURL(); });
  require('fs').writeFileSync('/tmp/requiem-pruebas/poderes5/aves_lamina.png', Buffer.from(url.split(',')[1], 'base64'));
  await b.close();
};
// La picada del halcón en el juego (con `__picadaHalcon`), en cámara lenta: /tmp/requiem-pruebas/poderes5/aves_picada.png
const picada = async () => {
  const fs = require('fs'); const { b, p } = await entrar('pc', 'druida', 10);
  await p.evaluate(() => window.__ir('a2_dunas')); await p.waitForTimeout(4500);
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe; window.__sinAmbientePfx = true; j.monstruos = []; h.x += 6; h.y += 6; h.camino = null; });
  await p.waitForTimeout(1200);
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe; window.__camaraLenta = 0.06; window.__t0 = j.t; window.__picadaHalcon(h.x + 2, h.y + 0.5); });
  const fotos = [];
  for (let i = 0; i < 16; i++) { await p.waitForFunction(([t]) => window.__juego().t - window.__t0 >= t, [0.05 * (i + 1)], { timeout: 20000, polling: 5 }).catch(() => {});
    const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x + 2, h.y + 0.5); }); fotos.push(await p.screenshot({ clip: { x: x - 170, y: y - 240, width: 300, height: 270 } })); }
  fs.mkdirSync('/tmp/requiem-pruebas/poderes5/picada', { recursive: true }); fotos.forEach((f, i) => fs.writeFileSync(`/tmp/requiem-pruebas/poderes5/picada/p_${String(i).padStart(2, '0')}.png`, f));
  await b.close();
};
(async () => { await lamina(); await picada(); })();
