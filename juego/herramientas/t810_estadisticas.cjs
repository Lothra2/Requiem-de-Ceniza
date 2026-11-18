// Auditoría de estadísticas (lista de fallas típicas de los RPG):
//  1. poner y quitar cada objeto deja las estadísticas exactamente como estaban;
//  2. cambiar equipo no cura (la vida conserva su proporción, ida y vuelta da lo mismo);
//  3. una mejora (buff) que termina no deja nada pegado;
//  4. topes: resistencias, reducción, bloqueo, esquiva y crítico con todas las habilidades a 20 y el equipo más cargado;
//  5. nadie queda inmune: daño contra la resistencia y la defensa más altas posibles.
const { entrar } = require('./comun_pruebas.cjs');
(async () => {
  const { b, p, errs } = await entrar('pc', 'templario', 30);
  const r = await p.evaluate(async () => {
    const { H, O, D } = window.__T, M = window.__mundo, j = window.__juego(), out = { invariancia: [], vida: null, buff: null, topes: {}, inmune: null };
    const CL = (await import('/src/datos/clases.ts')), HAB = CL.HABILIDADES;
    const igual = (a, b) => JSON.stringify(a) === JSON.stringify(b);
    // 1. invariancia con 400 objetos al azar de todas las rarezas
    const d = H.nuevoHeroe('templario', 'X'); d.nivel = 40; d.fue = 200; d.des = 200;
    const casilla = (o) => { const ba = D.BASES.find((x) => x.id === o.base); const r = ba?.ranura; return r === 'arma' ? 'arma' : r === 'escudo' || ba?.tipo?.startsWith?.('escudo') ? 'izq' : r === 'anillo' ? 'anillo1' : r; };
    let malos = 0, probados = 0;
    for (let i = 0; i < 400; i++) {
      const o = O.crearObjeto(5 + (i % 60), ['normal', 'magico', 'raro', 'unico'][i % 4] ?? 'magico'); const cas = casilla(o); if (!cas || !(cas in d.equipo || ['arma', 'izq', 'casco', 'cuerpo', 'guantes', 'botas', 'cinto', 'amuleto', 'anillo1', 'anillo2'].includes(cas))) continue;
      const antes = H.calcular(d), viejo = d.equipo[cas]; d.equipo[cas] = o; H.calcular(d); if (viejo) d.equipo[cas] = viejo; else delete d.equipo[cas]; const despues = H.calcular(d); probados++;
      if (!igual(antes, despues)) { malos++; if (out.invariancia.length < 3) out.invariancia.push(o.base); }
    }
    out.invarianciaRes = { probados, malos };
    // 2. vida al cambiar equipo (en el juego de verdad)
    const h = j.heroe; M.recalc(j); h.vida = h.vidaMax * 0.3; const v0 = h.vida, m0 = h.vidaMax;
    const anillo = O.crearObjeto(30, 'magico', (ba) => ba.ranura === 'anillo'); anillo.stats = [['vida', 150]];
    const viejo = h.d.equipo.anillo1; h.d.equipo.anillo1 = anillo; M.recalc(j); const v1 = h.vida, m1 = h.vidaMax;
    if (viejo) h.d.equipo.anillo1 = viejo; else delete h.d.equipo.anillo1; M.recalc(j);
    out.vida = { antes: [Math.round(v0), m0], conAnillo: [Math.round(v1), m1], despues: [Math.round(h.vida), h.vidaMax], cura: Math.round(h.vida - v0) };
    // 3. buff que termina
    const c0 = JSON.stringify(h.c); h.buffs.prueba = { t: 5, bonos: { vida: 80, def_pct: 40, dano_pct: 30, res_todo: 20 } }; M.recalc(j); const conBuff = h.c.vidaMax;
    delete h.buffs.prueba; M.recalc(j); out.buff = { conBuff, sinBuff: h.vidaMax, igual: c0 === JSON.stringify(h.c) };
    // 4. topes por clase: todas sus habilidades a 20 y diez objetos cargados de lo que más sube cada tope
    for (const cl of CL.CLASES) {
      const x = H.nuevoHeroe(cl.id, 'X'); x.nivel = 60; x.des = 300;
      for (const hb of HAB) if (hb.clase === cl.id) x.habs[hb.id] = 20;
      const sinEquipo = H.calcular(x);
      const cargado = (stats) => { const o = O.crearObjeto(60, 'raro', (ba) => ba.ranura === 'anillo'); o.stats = stats; return o; };
      for (const cas of ['casco', 'cuerpo', 'guantes', 'botas', 'cinto', 'amuleto', 'anillo1', 'anillo2']) x.equipo[cas] = cargado([['esquiva', 15], ['critico', 15], ['res_todo', 30], ['reduc_dano', 15], ['robo_vida', 10], ['bloqueo', 10], ['vel_ataque', 30]]);
      const c = H.calcular(x);
      out.topes[cl.id] = { esquivaHabs: sinEquipo.esquiva, esquiva: c.esquiva, critico: c.critico, bloqueo: c.bloqueo, reduc: c.reduc_dano, resFuego: c.res.fuego, robo: c.robo_vida, velAtaque: c.vel_ataque };
    }
    // 5. inmunidad: el monstruo con más resistencia más una maldición en contra, y el héroe con todo al tope
    const MON = (await import('/src/datos/monstruos.ts')).MONSTRUOS; let maxRes = 0, quien = '';
    for (const m of Object.values(MON)) for (const [e, v] of Object.entries(m.res ?? {})) if (v > maxRes) { maxRes = v; quien = m.id + ':' + e; }
    out.inmune = { maxResMonstruo: maxRes, quien };
    return out;
  });
  console.log(JSON.stringify(r, null, 1)); console.log(errs.slice(0, 3)); await b.close();
})();
