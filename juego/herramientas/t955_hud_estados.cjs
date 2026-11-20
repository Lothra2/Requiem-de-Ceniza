// El HUD forjado "con intención": cada estado que el panel muestra, forzado con ganchos y fotografiado.
// Uso: node juego/herramientas/t955_hud_estados.cjs <etiqueta> [vistas] [estados|recursos|todo] [clases]
//   vistas: pc, pc1080, ipad, movil.  estados: vida baja (30, 12 y 5 %), maná (40, 15 y 0 %), veneno, escarcha, sangrado,
//   fuego, el trago, la racha (fresca y seca), subir de nivel, la voz de la Marca, los mensajes (recién dichos, idos y
//   el registro abierto), el jefe (el dintel cayendo, quieto con ceniza, el golpe y la muerte), el pueblo y la muerte.
//   recursos: la reliquia de cada clase vacía, a medias y llena.
// Capturas en /tmp/requiem-pruebas/hud2/estados (SALIDA= otra carpeta); t955_lamina.py arma las láminas.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const ET = process.argv[2] || 'x', VS = (process.argv[3] || 'pc,pc1080,movil').split(','), QUE = process.argv[4] || 'todo';
const CLASES = (process.argv[5] || 'arcanista,berserker,monje,nigromante,cazadora,templario,druida,alquimista').split(',');
const OUT = process.env.SALIDA || '/tmp/requiem-pruebas/hud2/estados'; fs.mkdirSync(OUT, { recursive: true });
const errores = {};
async function preparar(vista, clase) {
  const s = await entrar(vista, clase, 30, undefined, "d.xp = 0; d.habs = d.habs || {};");
  const { p } = s;
  await p.evaluate(() => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
  await p.evaluate(() => { const j = window.__juego(), h = j.heroe, H = window.__T.H;
    h.d.xp = Math.round(H.xpPara(30) + (H.xpPara(31) - H.xpPara(30)) * 0.55);
    const t = ['vida', 'vida', 'mana', 'rejuv']; h.d.tiposCinturon = [...t]; h.d.cinturon = t.map((q, i) => { const o = window.__T.O.crearPocion(q, 1); o.cantidad = 4 - i; return o; });
    j.monstruos = j.monstruos.filter((m) => m.dueno); (h.d.thor ??= {}).descanso = 999; j.mensajes.length = 0; h.vida = h.vidaMax; h.mana = h.c.manaMax; h.camino = null; h.objetivo = null; });
  if (!s.tactil) await p.mouse.move(s.L.l + s.L.W * 0.6 * s.L.k, s.L.t + s.L.H * 0.3 * s.L.k);
  await p.waitForTimeout(1200);
  return s;
}
(async () => {
  for (const v of VS) {
    const foto = async (p, n) => p.screenshot({ path: `${OUT}/${ET}_${v}_${n}.png` });
    const ev = (p, f, a) => p.evaluate(f, a);
    if (QUE === 'estados' || QUE === 'todo') {
      const s = await preparar(v, 'berserker'), { p } = s;
      const base = () => ev(p, () => { const j = window.__juego(), h = j.heroe; h.vida = h.vidaMax; h.mana = h.c.manaMax; h.veneno = 0; h.frio = 0; h.sangrado = 0; h.congelado = 0; h.furia = 40; });
      await base(); await p.waitForTimeout(400); await foto(p, '01_normal');
      for (const k of [30, 12, 5]) { await ev(p, (k) => { const h = window.__juego().heroe; h.vida = h.vidaMax * k / 100; }, k); await p.waitForTimeout(450); await foto(p, `02_vida_${String(k).padStart(2, '0')}`); await p.waitForTimeout(170); await foto(p, `02_vida_${String(k).padStart(2, '0')}b`); }
      await base();
      for (const k of [40, 15, 0]) { await ev(p, (k) => { const h = window.__juego().heroe; h.mana = h.c.manaMax * k / 100; }, k); await p.waitForTimeout(500); await foto(p, `03_mana_${String(k).padStart(2, '0')}`); }
      await base();
      for (const [n, f] of [['veneno', 'h.veneno = 6; h.venenoDps = 0'], ['frio', 'h.frio = 2.5'], ['sangrado', 'h.sangrado = 4'], ['fuego', 'h.ardeT = j.t']]) {
        await ev(p, (f) => { const j = window.__juego(), h = j.heroe; h.vida = h.vidaMax * 0.7; new Function('j', 'h', f)(j, h); }, f); await p.waitForTimeout(n === 'fuego' ? 250 : 600); await foto(p, `04_${n}`); await base(); await p.waitForTimeout(200);
      }
      await ev(p, () => { const h = window.__juego().heroe; h.vida = h.vidaMax * 0.5; h.frio = 0; });
      await ev(p, () => window.__mundo.usarPocion(window.__juego(), 0)); await p.waitForTimeout(330); await foto(p, '05_trago'); await p.waitForTimeout(800); await base();
      // la racha
      await ev(p, () => { const j = window.__juego(); j.racha = 5; j.rachaT = j.t; }); await p.waitForTimeout(500);
      await ev(p, () => { const j = window.__juego(); j.racha = 9; j.rachaT = j.t; }); await p.waitForTimeout(900); await foto(p, '06_racha');
      await ev(p, () => { const j = window.__juego(); j.racha = 12; j.rachaT = j.t; }); await p.waitForTimeout(9000); await foto(p, '06_racha_seca');
      // subir de nivel
      await ev(p, () => { window.__juego().heroe.d.nivel++; }); await p.waitForTimeout(350); await foto(p, '07_nivel'); await p.waitForTimeout(900); await foto(p, '07_nivel_b'); await p.waitForTimeout(3000);
      // la voz de la Marca
      await ev(p, () => { const j = window.__juego(); j.vozMarcaHud = { t0: j.t, dur: 7 }; window.__mundo.msg(j, ['Tengo sed. No es tuya. Camina.', 'I thirst. It is not yours. Walk.'], '#ff6a48'); }); await p.waitForTimeout(1500); await foto(p, '08_voz'); await p.waitForTimeout(250); await foto(p, '08_voz_b');
      // los mensajes: recién dichos (seis), idos y el registro entero
      await ev(p, () => { const j = window.__juego(), m = window.__mundo.msg; j.vozMarcaHud = null;
        m(j, ['Lona remendada, un fuego que no calienta y gente con ceniza en la piel. Te miran el brazo antes que la cara.', 'x'], '#b0a890'); m(j, ['El Refugio de los Cenicientos', 'x'], '#ffd080'); m(j, ['La lluvia cae tibia. Huele a ceniza mojada.', 'x'], '#b0a890');
        m(j, ['Páramo de Velmora', 'x'], '#ffd080'); m(j, ['No tengo maná.', 'x'], '#ff8060'); m(j, ['Clic izquierdo sobre un monstruo para pegarle. Clic derecho lanza tu poder. 1 a 4 toma pociones.', 'x'], '#80c0ff'); j.heroe.tCombate = j.t; });
      await p.waitForTimeout(600); await foto(p, '09_mensajes'); await p.waitForTimeout(5600); await foto(p, '09_mensajes_idos');
      await ev(p, () => window.__registro(true)); await p.waitForTimeout(500); await foto(p, '09_registro'); const abierto = await ev(p, () => window.__registro());
      if (!s.tactil) { await p.keyboard.press('h'); await p.waitForTimeout(300); } else await ev(p, () => window.__registro(false));
      const cerrado = !(await ev(p, () => window.__registro()));
      if (!s.tactil) { await p.keyboard.press('h'); await p.waitForTimeout(200); const ab2 = await ev(p, () => window.__registro()); await p.keyboard.press('Escape'); await p.waitForTimeout(200); const menu = await ev(p, () => window.__ui.izq); console.log(v, 'registro: abre', abierto, 'H cierra', cerrado, 'H abre', ab2, 'Esc cierra sin abrir el menú', !(await ev(p, () => window.__registro())) && !menu); }
      // el jefe
      await ev(p, async () => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); const def = D.MONSTRUOS['abadesa'] || Object.values(D.MONSTRUOS).find((d) => d.jefe);
        const m = M.crearMonstruo(def, 30, h.x + 5, h.y - 4, 3, 0); m.estado = 'dormido'; m.vidaMax = m.vida = 100000; j.monstruos.push(m); j.jefe = m; window.__jefePrueba = m; });
      await p.waitForTimeout(230); await foto(p, '10_jefe_cae'); await p.waitForTimeout(2600); await foto(p, '10_jefe');
      await p.waitForTimeout(6000); await foto(p, '10_jefe_ceniza');
      await ev(p, () => { const m = window.__jefePrueba; m.vida = m.vidaMax * 0.62; }); await p.waitForTimeout(140); await foto(p, '10_jefe_golpe');
      await ev(p, () => { const m = window.__jefePrueba; m.vida = m.vidaMax * 0.18; }); await p.waitForTimeout(900); await foto(p, '10_jefe_bajo');
      await ev(p, () => { const j = window.__juego(), m = window.__jefePrueba; j.monstruos = j.monstruos.filter((q) => q !== m); j.jefe = null; }); await p.waitForTimeout(330); await foto(p, '10_jefe_suelta'); await p.waitForTimeout(2500);
      // el pueblo: la brasa se cubre
      await ev(p, () => window.__ir('a1_refugio')); await p.waitForTimeout(6000); await ev(p, () => { window.__juego().mensajes.length = 0; }); await p.waitForTimeout(300); await foto(p, '11_pueblo');
      // la muerte: el panel se apaga y la Marca no
      await ev(p, () => window.__ir('a1_paramo')); await p.waitForTimeout(5000);
      await ev(p, () => { const j = window.__juego(), h = j.heroe; j.monstruos = j.monstruos.filter((m) => m.dueno); j.mensajes.length = 0; h.muerto = true; h.acc = 'morir'; h.t = 0; h.vida = 0; h.murioEn = j.t; }); await p.waitForTimeout(2600); await foto(p, '12_muerto');
      const pulso = await ev(p, () => { const P = window.__hudPulso; return P ? { brasa: +P.brasa.toFixed(2), muerto: P.muerto } : null; });
      console.log(v, 'estados listos, errores', s.errs.length, s.errs.slice(0, 3).join(' | '), 'pulso muerto', JSON.stringify(pulso)); errores[v] = (errores[v] || 0) + s.errs.length;
      await s.b.close();
    }
    if (QUE === 'recursos' || QUE === 'todo') {
      const PASOS = {
        arcanista: ['h.cargas = []', "h.cargas = ['fuego']", "h.cargas = ['fuego', 'frio', 'rayo']"],
        berserker: ['h.furia = 0; h.furiaFija = 0', 'h.furia = 55', 'h.furia = 100; h.furiaFija = 5'],
        monje: ['h.combo = { paso: 0, t: -99 }', 'h.combo = { paso: 1, t: j.t }', 'h.combo = { paso: 2, t: j.t }'],
        nigromante: ['window.__cad(0)', 'window.__cad(3)', 'window.__cad(7)'],
        cazadora: ['j.torretas.length = 0', "window.__zom(2).forEach((m) => { m.marca = 9; })", "const z = window.__zom(4); z.slice(0, 3).forEach((m) => { m.marca = 9; }); j.torretas.push({ x: h.x + 3, y: h.y, t: 99, tipo: 'cepo', hab: 'cepo' }, { x: h.x + 4, y: h.y, t: 99, tipo: 'cepo', hab: 'cepo' }); z[3].dueno = h; z[3].invocaId = 'halcon'; z[3].marca = 0"],
        templario: ['h.d.aura = null', "h.d.habs.aura_fuerza = 5; h.d.aura = 'aura_fuerza'", "h.d.habs.aura_espinas = 5; h.d.aura = 'aura_espinas'"],
        druida: ['delete h.buffs.forma_lobo; delete h.buffs.forma_oso', "h.buffs.forma_lobo = { t: 210, bonos: {}, hab: 'forma_lobo' }", "delete h.buffs.forma_lobo; h.buffs.forma_oso = { t: 120, bonos: {}, hab: 'forma_oso' }"],
        alquimista: ['h.frascos = 0; h.frascoT = 0.4', 'h.frascos = 2; h.frascoT = 2.4', 'h.frascos = window.__mundo.frascosMax(h); h.frascoT = 0'],
      };
      for (const cl of CLASES) {
        const s = await preparar(v, cl), { p } = s;
        await ev(p, async () => { const M = window.__mundo, D = await import('/src/datos/monstruos.ts'), C = await import('/src/datos/clases.ts');
          const nuevo = (muerto, i) => { const j = window.__juego(), h = j.heroe, c = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + 6 + (i % 3), h.y - 5 + (i / 3 | 0), 0, 0); c.estado = 'dormido'; c.vidaMax = c.vida = 1e6; if (muerto) { c.vida = 0; c.muerto = true; c.acc = 'morir'; c.t = 5; c.tMuerto = 5; } j.monstruos.push(c); return c; };
          window.__cad = (n) => { const j = window.__juego(); j.monstruos = j.monstruos.filter((m) => m.dueno); for (let i = 0; i < n; i++) nuevo(true, i); };
          window.__zom = (n) => { const j = window.__juego(); j.monstruos = j.monstruos.filter((m) => m.dueno && m.invocaId !== 'halcon'); const out = []; for (let i = 0; i < n; i++) out.push(nuevo(false, i)); return out; };
          window.__aura = (pot) => { const j = window.__juego(), h = j.heroe, a = C.HABILIDADES.find((x) => x.clase === 'templario' && x.tipo === 'aura') || C.HABILIDADES.find((x) => x.clase === 'templario' && /aura|brasa/i.test(x.id)); h.d.aura = a.id; h.buffs[a.id] = { t: 9999, bonos: {}, hab: a.id }; h.auraPot = pot; };
        });
        for (let i = 0; i < 3; i++) { await ev(p, (f) => { const j = window.__juego(), h = j.heroe; new Function('j', 'h', f)(j, h); }, PASOS[cl][i]); await p.waitForTimeout(cl === 'monje' ? 250 : 500); await foto(p, `r_${cl}_${i}`); }
        console.log(v, cl, 'errores', s.errs.length, s.errs.slice(0, 2).join(' | ')); errores[v] = (errores[v] || 0) + s.errs.length;
        await s.b.close();
      }
    }
  }
  console.log('errores por vista', JSON.stringify(errores));
})().catch((e) => { console.error(e); process.exit(1); });
