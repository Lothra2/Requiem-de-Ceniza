// La partida de antes de MAPA_V: se arma una partida de verdad (héroe con bolsa, equipo, misiones, piedras de viaje, casas
// saqueadas, restos leídos, zonas exploradas y posición guardada), se le dejan las claves del mapa como las escribía el juego
// antes de la versión (id de zona, con `~o` en las cuevas), se recarga y se revisa que SOLO se pierde la niebla: todo lo demás
// queda byte a byte igual, el héroe aparece en una celda libre y al guardar las claves viejas siguen ahí sin tocar.
// Uso: node juego/herramientas/t1001_partida_vieja.cjs   (URL=, CHROMIUM=)
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs, L } = await entrar('pc', 'berserker', 24, undefined, "d.id = 'partidavieja1'; d.viajes = ['a1_refugio', 'a1_paramo', 'a1_cementerio', 'a2_dunas']; d.misiones = { m1_hambre: 3, m1_campanas: 2 }; d.casas = ['a1_casa_paramo|0']; d.oro = 4321; d.actosHechos = [1];");
  const ir = async (z) => { await p.evaluate((z) => window.__ir(z), z); await p.waitForFunction((z) => window.__estado() === 'juego' && window.__juego().zona.id === z, z, { timeout: 60000 }); await p.waitForTimeout(600); };
  // explora de verdad tres zonas (un exterior, una cueva y una mazmorra de obra) y deja al héroe en medio de la última
  for (const z of ['a1_paramo', 'a1_guarida', 'a1_cata1']) { await ir(z); await p.evaluate(() => { const j = window.__juego(); j.zona.explorado.fill(1); j.heroe.vida = j.heroe.vidaMax = 1e6; }); }
  await ir('a1_paramo');
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; let m = null; for (let y = 10; y < z.H - 10; y += 3) for (let x = 10; x < z.W - 10; x += 3) { if (z.bloq[y * z.W + x]) continue; const d = Math.hypot(x - h.x, y - h.y); if (d > 30 && (!m || d > m[2])) m = [x + 0.5, y + 0.5, d]; } h.x = m[0]; h.y = m[1]; h.camino = null; });
  await p.waitForTimeout(400);
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(() => { window.__U.ui.guardarAhora = true; }); await p.waitForTimeout(600);
  // la partida como la dejaba el juego de antes: las claves del mapa sin la versión
  const vieja = await p.evaluate(() => { const hs = JSON.parse(localStorage.getItem('marca.heroes')), d = hs[0], m = {}; for (const [k, v] of Object.entries(d.mapas || {})) m[k.replace(/~m\d+$/, '')] = v; d.mapas = m; (d.hist ??= {}).restos = ['1:0', '1:2']; localStorage.setItem('marca.heroes', JSON.stringify(hs)); localStorage.removeItem('marca.copia1'); window.__sinGuardar = true; return d; });
  const clavesViejas = Object.keys(vieja.mapas);
  await p.reload(); for (let i = 0; i < 80; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado && window.__estado()) === 'menu') break; }
  await p.waitForTimeout(5500);
  const c = await p.evaluate(() => window.__menuFilas && window.__menuFilas.continuar); await p.mouse.click(L.l + c[0] * L.k, L.t + c[1] * L.k);
  for (let i = 0; i < 60; i++) { await p.waitForTimeout(500); if (await p.evaluate(() => window.__estado() === 'juego')) break; }
  await p.waitForTimeout(1200);
  const viva = await p.evaluate(() => { const j = window.__juego(), h = j.heroe, z = j.zona; return { zona: z.id, libre: z.bloq[Math.floor(h.y) * z.W + Math.floor(h.x)] === 0 || z.bloq[Math.floor(h.y) * z.W + Math.floor(h.x)] === 3, visto: z.explorado.reduce((s, v) => s + (v ? 1 : 0), 0), de: z.explorado.length, d: JSON.parse(JSON.stringify(h.d)) }; });
  // guardar otra vez: las claves viejas quedan, aparece la nueva
  await p.keyboard.press('Escape'); await p.waitForTimeout(400); await p.evaluate(() => { window.__U.ui.guardarAhora = true; }); await p.waitForTimeout(600);
  const nueva = await p.evaluate(() => JSON.parse(localStorage.getItem('marca.heroes'))[0]);
  const sin = (d) => { const o = { ...d }; for (const k of ['mapas', 'jugado', 'pos', 'vidaActual', 'manaActual', 'zona']) delete o[k]; return JSON.stringify(o); };
  const R = {
    'misma zona': viva.zona === vieja.zona, 'héroe en celda libre': viva.libre,
    'niebla reiniciada': viva.visto < viva.de * 0.6,
    'héroe, bolsa, equipo, misiones, viajes, casas y restos iguales al cargar': sin(viva.d) === sin(vieja),
    'iguales después de guardar': sin(nueva) === sin(vieja),
    'claves viejas del mapa intactas': clavesViejas.length >= 3 && clavesViejas.every((k) => nueva.mapas[k] === vieja.mapas[k]),
    'clave nueva con versión': Object.keys(nueva.mapas).some((k) => /~m\d+$/.test(k)),
    'sin errores': errs.length === 0,
  };
  console.log('claves viejas', clavesViejas.join(' '), '| visto', viva.visto, 'de', viva.de, '| bolsa', vieja.bolsa.length, 'equipo', Object.keys(vieja.equipo).length);
  let mal = 0; for (const [k, v] of Object.entries(R)) { console.log(v ? 'OK ' : 'MAL', k); if (!v) mal++; }
  if (errs.length) console.log(errs.slice(0, 4));
  await b.close(); process.exit(mal ? 1 : 0);
})();
