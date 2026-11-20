// El costo del HUD por cuadro (la fase "interfaz" del medidor F3) en estado quieto: vida y maná llenos y sin nada que
// cambie (así no entran los cuadros nuevos de los orbes), y con todo lo que late encendido (vida al 12 %, jefe, racha).
// Uso: node juego/herramientas/t956_hud_costo.cjs [vistas]   (URL= otro servidor, para comparar con el de antes)
const { entrar } = require('./comun_pruebas.cjs');
const VS = (process.argv[2] || 'pc,pc1080,movil').split(',');
(async () => {
  for (const v of VS) {
    const s = await entrar(v, 'berserker', 30), { p } = s;
    await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(6000);
    const fijar = (vida) => p.evaluate((vida) => { const j = window.__juego(), h = j.heroe; j.monstruos = j.monstruos.filter((m) => m.dueno); (h.d.thor ??= {}).descanso = 999; h.camino = null; h.objetivo = null; h.curando = null;
      clearInterval(window.__fijo); window.__fijo = setInterval(() => { h.vida = h.vidaMax * vida; h.mana = h.c.manaMax; h.furia = 40; }, 16); }, vida);
    const medir = async () => { const out = []; for (let i = 0; i < 4; i++) { await p.evaluate(() => window.__rendFases.ligero(true)); await p.waitForTimeout(2500); out.push(await p.evaluate(() => window.__rendFases.leer().interfaz)); } out.sort((a, b) => a - b); return out; };
    if (!s.tactil) await p.mouse.move(s.L.l + s.L.W * 0.6 * s.L.k, s.L.t + s.L.H * 0.3 * s.L.k);
    await fijar(1); await p.waitForTimeout(2500); const quieto = await medir();
    await fijar(0.12); await p.evaluate(async () => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); const m = M.crearMonstruo(D.MONSTRUOS['abadesa'], 30, h.x + 6, h.y - 5, 3, 0); m.estado = 'dormido'; m.vidaMax = m.vida = 1e6; j.monstruos.push(m); j.jefe = m; j.racha = 12; j.rachaT = j.t; h.veneno = 60; h.venenoDps = 0; });
    await p.waitForTimeout(3000); const vivo = await medir();
    if (process.env.PARTES) for (const [n, f] of [['vida12', 'h.veneno = 0; j.jefe = null; j.racha = 0'], ['veneno', 'window.__v = 1; h.veneno = 60'], ['jefe', 'h.veneno = 0; window.__v = 1; j.jefe = j.monstruos.find((m) => !m.dueno)'], ['racha', 'j.jefe = null; j.racha = 12; j.rachaT = j.t']]) {
      await p.evaluate((f) => { const j = window.__juego(), h = j.heroe; new Function('j', 'h', f)(j, h); }, f); if (n === 'veneno' || n === 'jefe') await fijar(1); await p.waitForTimeout(n === 'vida12' ? 31000 : 4000); console.log(v, n, (await medir()).map((x) => x.toFixed(2)).join(' ')); }
    console.log(v, 'interfaz quieto', quieto.map((x) => x.toFixed(2)).join(' '), '| con todo latiendo', vivo.map((x) => x.toFixed(2)).join(' '), 'errores', s.errs.length);
    await s.b.close();
  }
})().catch((e) => { console.error(e); process.exit(1); });
