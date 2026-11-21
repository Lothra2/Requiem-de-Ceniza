// El Libro de Odrán: arma un héroe a distintas alturas de la historia y saca capturas del libro (cerrado, abriéndose, el
// índice, un hilo a medias, un hilo cerrado con el cierre de Odrán, una pieza escribiéndose, la hoja a mitad de la curva,
// la carta que se quema, la hoja que late y las notas de otra mano). Comprueba que nada del futuro asoma y que una
// partida vieja (misiones hechas, sin el campo nuevo) abre el libro con lo que ya encontró.
// Uso: CHROMIUM=/opt/pw-browsers/chromium URL=http://127.0.0.1:5193/ node juego/herramientas/t1200_libro.cjs [pc|pc1080|movil|ipad] [escenas]
// Capturas en /tmp/requiem-pruebas/libro/<vista>.
const fs = require('fs');
const { entrar } = require('./comun_pruebas.cjs');
const vista = process.argv[2] || 'pc';
const solo = (process.argv[3] || '').split(',').filter(Boolean);
const SAL = `/tmp/requiem-pruebas/libro/${vista}`;
fs.mkdirSync(SAL, { recursive: true });

// ------------------------------------------------------------------ las partidas
const H = {
  // recién empezado: el acto 1 con lo primero hecho
  acto1: `d.acto = 1; d.misiones = { m1_hambre: 3, m1_campanas: 1 }; d.diarios = { 1: 1 }; d.paginas = 1; d.restos = ['1:0']; d.actosHechos = [];`,
  // el acto 3 con varias cosas encontradas (y una parte vista ya en el libro, para que lo nuevo se escriba)
  acto3: `d.acto = 3; d.actosHechos = [1, 2]; d.zona = 'a3_muelle';
    d.misiones = { m1_hambre: 3, m1_campanas: 3, m1_abadesa: 3, m1_verdugo: 3, m1_reliquia: 3, m1s_ahorcados: 3, m1s_ciro: 3, m2_saqueador: 3, m2_dormidos: 3, m2_rey: 3, m2_sol: 3, m3_bruja: 3, m3_ixel: 1 };
    d.elecciones = { m1_reliquia: 0, m2_sol: 0 }; d.misionProg = {}; d.viajes = ['a1_refugio', 'a1_abadia1', 'a2_oasis', 'a2_tumbas1', 'a3_muelle'];
    d.diarios = { 1: 3, 2: 2, 3: 1 }; d.paginas = 5; d.restos = ['1:0', '1:3', '2:3', '2:2', '3:0']; d.heraldo = [1, 2]; d.fantasmas = ['f_abadia', 'f_bosque'];
    d.jefesVistos = ['abadesa', 'rey_sin_sombra'];
    d.libro = { o: ['tomas_relato', 'sel_lys', 'sel_mapas'], v: ['pozo_intro', 'pozo_p0', 'pozo_p1', 'pozo_p2', 'pozo_resto', 'pozo_entrada', 'mar_intro', 'mar_cem', 'mar_pozo', 'ves_ivola0', 'ves_ivola1', 'tomas_abad', 'tomas_relato', 'tomas_cripta', 'tomas_reliquia'] };`,
  // el acto 7 casi todo: falta poco, Vesperio muerto (sus notas al margen), la Brasa apagada
  acto7: `d.acto = 7; d.actosHechos = [1, 2, 3, 4, 5, 6]; d.zona = 'a7_campamento';
    const M = window.__T && window.__T.MISIONES || []; d.misiones = {}; d.elecciones = {};
    for (const m of (window.__libroMisiones ? window.__libroMisiones() : [])) { d.misiones[m.id] = 3; if (m.el) d.elecciones[m.id] = 0; }
    d.misiones.m7_aunsaar = 1; delete d.elecciones.m7_aunsaar; d.misiones.m7_jardin = 1; delete d.elecciones.m7_jardin;
    d.finalElegido = 'destruir'; d.decisiones = { vigdis: 'salvar' }; d.heraldo = [1, 2, 3, 4]; d.heraldoMuerto = true;
    d.diarios = { 1: 3, 2: 3, 3: 3, 4: 4, 5: 3, 6: 3, 7: 3 }; d.paginas = 9;
    d.restos = []; for (let a = 1; a <= 7; a++) for (let i = 0; i < 4; i++) d.restos.push(a + ':' + i);
    d.fantasmas = ['f_cementerio', 'f_bosque', 'f_abadia', 'f_oasis', 'f_hundida', 'f_glaciar', 'f_llanuras', 'f_barrio', 'v_costa', 'v_barrio', 'v_cielo'];
    d.jefesVistos = ['abadesa', 'rey_sin_sombra', 'madre_cienaga', 'rey_escarcha', 'senor_demonio', 'campana_ahoga'];
    d.viajes = ['a1_refugio', 'a5_bastion', 'a6_barco', 'a7_campamento', 'a6_costa', 'a6_catedral1', 'a7_cielo', 'a7_escaleras', 'a4_hielo1', 'a5_llanuras', 'a2_tumbas1', 'a3_templo1', 'a1_cementerio', 'a1_pozo', 'a5_santuario1', 'a7_jardin'];
    d.libro = { o: window.__libroTodosOidos ? window.__libroTodosOidos() : [] };
    d.libro.v = (window.__libroTodas ? window.__libroTodas() : []).filter((id) => !['pozo_p8', 'pozo_libro', 'ves_carta5', 'ves_muerte', 'sed_ent6', 'aur_juicio', 'sie_tabla2', 'pre_jardin'].includes(id));
    d.libro.c = ['marca', 'tomas', 'sellos'];`,
  // una partida vieja: misiones de los actos 1 y 2 hechas, sin restos, sin fantasmas, sin el campo del libro
  vieja: `d.acto = 2; d.actosHechos = [1]; d.zona = 'a2_oasis';
    d.misiones = { m1_hambre: 3, m1_campanas: 3, m1_abadesa: 3, m1_reliquia: 3, m1s_ahorcados: 3, m2_saqueador: 3, m2_dormidos: 2 };
    d.elecciones = { m1_reliquia: 1 }; d.diarios = { 1: 3 }; d.paginas = 2; d.heraldo = [1]; delete d.libro; delete d.restos; delete d.fantasmas;`,
};

// lo que no puede asomar en cada altura (nombres y textos del futuro)
const PROHIBIDO = {
  acto1: ['Ysmeral', 'Eskel', 'Aun-Saar', 'Hjaldur', 'Vigdis', 'Ozmaren', 'Auren', 'Khamer', 'Yhuantl', 'Ama', 'Vael', 'Abadesa de la Sal', 'Los siete que subieron', 'La sangre tibia', 'Sediento'],
  acto3: ['Ysmeral', 'Eskel', 'Aun-Saar', 'Hjaldur', 'Vigdis', 'Vael', 'Abadesa de la Sal', 'Los siete que subieron', 'La sangre tibia', 'Sediento', 'Auren y las siete voces'],
  vieja: ['Ysmeral', 'Eskel', 'Aun-Saar', 'Hjaldur', 'Vigdis', 'Vael', 'Abadesa de la Sal', 'Sediento', 'Yhuantl'],
};

(async () => {
  const fallas = [];
  const URL = process.env.URL || 'http://127.0.0.1:5193/';
  const corre = (n) => !solo.length || solo.includes(n);
  for (const [nombre, ajuste] of Object.entries(H)) {
    if (!corre(nombre)) continue;
    // los ganchos que arman la partida del acto 7 necesitan la página cargada: se arma en dos pasos
    const pre = `window.__libroMisiones = () => (window.__libroDatos ? window.__libroDatos().misiones : []); window.__libroTodosOidos = () => (window.__libroDatos ? window.__libroDatos().oidos : []); window.__libroTodas = () => (window.__libroDatos ? window.__libroDatos().todas : []);`;
    const { b, p, errs } = await entrar(vista, nombre === 'acto7' ? 'templario' : 'arcanista', nombre === 'acto7' ? 60 : 12, URL, pre + ajuste);
    const foto = async (n) => { await p.screenshot({ path: `${SAL}/${nombre}_${n}.png` }); };
    const reloj = async (t) => p.evaluate((t) => { window.__libroReloj = t; }, t);
    // ------ el libro cerrado y abriéndose (con el reloj de la escena en la mano)
    await p.evaluate(() => { window.__libroAbrir(); });
    const fase = async (t) => p.evaluate((t) => { window.__libroT = t; }, t);
    if (nombre === 'acto3' || nombre === 'acto1') {
      await reloj(10);
      for (const [t, n] of [[0.12, '1_aparece'], [0.36, '1_cerrado'], [0.62, '2_abriendo_tapa'], [0.8, '2b_tapa_de_canto'], [0.98, '3_abriendo_casi']]) { await fase(t); await p.waitForTimeout(250); await foto(n); }
    }
    await p.evaluate(() => { delete window.__libroT; });
    await p.evaluate(() => { const e = window.__libro; e.fase = 'abierto'; e.t = 0; });
    await reloj(20); await p.waitForTimeout(300);
    const hilos = await p.evaluate(() => window.__libroHilos());
    console.log(`\n[${nombre}] hilos:`, hilos.map((h) => `${h.id} ${h.tiene}/${h.total}${h.cierre ? ' cierre' : ''}${h.late ? ' late' : ''}${h.futuro ? ' +futuro' : ''} nuevas ${h.nuevas}`).join(' | '));
    await foto('4_indice');
    // ------ nada del futuro
    const hojas = await p.evaluate(() => window.__libroHojas());
    const todo = hojas.map((h) => h.texto).join(' ');
    for (const s of PROHIBIDO[nombre] ?? []) if (todo.includes(s)) { fallas.push(`${nombre}: asoma «${s}»`); }
    if (nombre === 'acto1' && hilos.some((h) => ['sed', 'ysmeral', 'pregunta', 'norte', 'auren', 'ama'].includes(h.id) || (h.id === 'siete' && h.tiene > 0))) fallas.push(`${nombre}: se ve un hilo de más adelante`);
    if (nombre === 'acto3' && hilos.some((h) => ['ysmeral', 'pregunta', 'norte'].includes(h.id) || (h.id === 'siete' && h.tiene > 0))) fallas.push(`${nombre}: se ve un hilo de más adelante`);
    // ------ una pieza escribiéndose y el hilo a medias
    const ir = async (hilo, desde = 0) => { const h = hilos.find((x) => x.id === hilo); if (!h) return false; await p.evaluate((n) => { const e = window.__libro, g = window.__libroGeo(); e.vuelta = null; e.vista = g.solo ? n : Math.ceil(n / 2); }, h.primera + desde); return true; };
    if (nombre === 'acto3') {
      await reloj(30);
      // (en el teléfono las hojas son más chicas: lo nuevo puede caer una o dos hojas más allá)
      for (let k = 0; k < 6; k += 2) { await ir('vesperio', k); await p.waitForTimeout(500); if (await p.evaluate(() => window.__libro.escr.size)) break; }
      const t0 = await p.evaluate(() => { let t = 1e9; for (const e of window.__libro.escr.values()) t = Math.min(t, e.t0 + e.hueco); return t; });
      const tf = await p.evaluate(() => { let t = 0; for (const e of window.__libro.escr.values()) t = Math.max(t, e.t0 + e.hueco + e.dur); return t; });
      if (t0 < 1e8) { await reloj(t0 - 0.25); await p.waitForTimeout(150); await foto('5_hueco_que_se_llena'); await reloj(t0 + 0.9); await p.waitForTimeout(150); await foto('6_escribiendose'); await reloj(t0 + 2.2); await p.waitForTimeout(150); await foto('6b_tinta_fresca'); }
      else fallas.push('acto3: no se escribió nada nuevo en el hilo de Vesperio');
      await reloj(tf + 3); await p.waitForTimeout(300); await foto('7_hilo_a_medias');
      // la hoja a mitad de la curva
      for (const pp of [0.25, 0.5, 0.78]) { await p.evaluate((pp) => { window.__libro.vuelta = { dir: 1, p: pp, auto: false, vel: 0 }; }, pp); await p.waitForTimeout(150); await foto(`8_pasando_${Math.round(pp * 100)}`); }
      await p.evaluate(() => { window.__libro.vuelta = null; });
      for (const [k, n] of [[0, '9_hilo_tomas'], [2, '9b_hilo_tomas_mas'], [4, '9c_hilo_tomas_cierre']]) { await ir('tomas', k); await p.waitForTimeout(400); const tf2 = await p.evaluate(() => { let t = 0; for (const e of window.__libro.escr.values()) t = Math.max(t, e.t0 + e.hueco + e.dur); return t; }); if (tf2) { await reloj(tf2 + 3); await p.waitForTimeout(300); } await foto(n); }
    }
    if (nombre === 'acto7') {
      const cerrado = hilos.find((h) => h.cierre); if (!cerrado) fallas.push('acto7: ningún hilo cerró');
      // el hilo de Vesperio: las notas de otra mano y la carta que se quema (va sola en su hoja)
      await reloj(40); await ir('vesperio', 2); await p.waitForTimeout(500);
      { const ini = await p.evaluate(() => { let t = 1e9; for (const [k, e] of window.__libro.escr) if (k.startsWith('m:')) t = Math.min(t, e.t0); return t; });
        if (ini < 1e8) { await reloj(ini + 0.5); await p.waitForTimeout(150); await foto('5_nota_otra_mano_escribiendose'); await reloj(ini + 4); await p.waitForTimeout(150); await foto('5b_nota_otra_mano_seca'); } else fallas.push('acto7: no se escribió ninguna nota de otra mano'); }
      const hq = await p.evaluate(() => window.__libroHojas().findIndex((h) => h.quema));
      if (hq < 0) fallas.push('acto7: no hay hoja que se queme');
      else {
        await reloj(80); await p.evaluate((n) => { const e = window.__libro, g = window.__libroGeo(); e.vuelta = null; e.vista = g.solo ? n : Math.ceil(n / 2); }, hq); await p.waitForTimeout(500);
        const q = await p.evaluate(() => window.__libro.quema && window.__libro.quema.t0);
        if (!q) fallas.push('acto7: la carta no se quemó');
        else { for (const [dt, n] of [[0.7, '6_carta_que_arde'], [1.9, '6a_carta_que_arde_mas'], [6, '6b_carta_quemada']]) { await reloj(q + dt); await p.waitForTimeout(150); await foto(n); } }
      }
      // un hilo cerrado con el cierre de Odrán (el de la Marca, ya escrito) y uno que se cierra ahora (se escribe)
      for (const h of ['marca', 'pozo', 'pregunta']) {
        const hh = hilos.find((x) => x.id === h); if (!hh) continue;
        // a la última hoja del hilo
        const ult = await p.evaluate((id) => { const hs = window.__libroHojas(); let u = -1; hs.forEach((x, i) => { if (x.hilo === id) u = i; }); return u; }, h);
        await p.evaluate((n) => { const e = window.__libro, g = window.__libroGeo(); e.vuelta = null; e.vista = g.solo ? n : Math.ceil(n / 2); }, ult);
        await p.waitForTimeout(400);
        const fin = await p.evaluate(() => { let t = 0; for (const e of window.__libro.escr.values()) t = Math.max(t, e.t0 + e.hueco + e.dur); return t; });
        const ini = await p.evaluate(() => { let t = 1e9; for (const e of window.__libro.escr.values()) t = Math.min(t, e.t0 + e.hueco); return t; });
        if (fin) { await reloj((ini + fin) / 2); await p.waitForTimeout(150); await foto(`7_cierre_${h}_escribiendose`); await reloj(fin + 3); await p.waitForTimeout(200); }
        await foto(`7_cierre_${h}`);
      }
      // la hoja que late: el hilo al que le falta una sola clave
      const late = hilos.find((h) => h.late);
      if (late) { const ult = await p.evaluate((id) => { const hs = window.__libroHojas(); let u = -1; hs.forEach((x, i) => { if (x.hilo === id && x.latido) u = i; }); return u; }, late.id); await p.evaluate((n) => { const e = window.__libro, g = window.__libroGeo(); e.vista = g.solo ? n : Math.ceil(n / 2); }, ult); await reloj(700.05); await p.waitForTimeout(200); await foto(`8_late_${late.id}`); await reloj(700.5); await p.waitForTimeout(200); await foto(`8_late_${late.id}_b`); }
    }
    if (nombre === 'vieja') {
      const tot = hilos.reduce((s, h) => s + h.tiene, 0);
      console.log(`[vieja] piezas que salen del guardado viejo: ${tot}`);
      if (tot < 12) fallas.push(`vieja: el libro sale casi vacío (${tot})`);
      const L2 = await p.evaluate(() => JSON.parse(localStorage.getItem('marca.heroes'))[0].libro);
      await ir('tomas'); await p.waitForTimeout(400); { const tf3 = await p.evaluate(() => { let t = 0; for (const e of window.__libro.escr.values()) t = Math.max(t, e.t0 + e.hueco + e.dur); return t; }); if (tf3) await reloj(tf3 + 3); } await p.waitForTimeout(300); await foto('5_tomas_desde_partida_vieja');
    }
    // ------ cerrar (y que el juego siga)
    await p.evaluate(() => { delete window.__libroReloj; delete window.__libroT; window.__libroCerrar(); }); for (let i = 0; i < 40 && (await p.evaluate(() => window.__libro.fase)) !== 'cerrado'; i++) await p.waitForTimeout(250);
    const fase2 = await p.evaluate(() => window.__libro.fase);
    if (fase2 !== 'cerrado') fallas.push(`${nombre}: el libro no se cerró (${fase2})`);
    // el aviso: una pieza nueva mientras se juega (la voz de la Marca de una zona) hace que Odrán anote algo
    if (nombre === 'acto1') {
      await p.evaluate(() => { delete window.__libroReloj; const j = window.__juego(); j.heroe.d.paginas = 2; }); await p.waitForTimeout(2600);
      const msgs = await p.evaluate(() => (window.__juego().mensajes || []).map((m) => m.txt[0]));
      if (!msgs.some((m) => /Odrán anota/.test(m))) fallas.push('acto1: no salió el aviso de Odrán');
      await foto('9_aviso_hud');
    }
    const rotas = await p.evaluate(() => window.__libroRotas());
    if (rotas.length) fallas.push(`piezas sin texto: ${rotas.join(', ')}`);
    const malos = errs.filter((e) => !/favicon|404/.test(e));
    if (malos.length) fallas.push(`${nombre}: errores ${malos.slice(0, 3).join(' | ')}`);
    await b.close();
  }
  console.log(fallas.length ? `\nFALLAS:\n- ${fallas.join('\n- ')}` : '\nLIBRO OK');
  process.exit(fallas.length ? 1 : 0);
})();
