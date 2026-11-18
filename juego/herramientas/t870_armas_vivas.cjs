// Armas vivas: cada elemento sobre varias armas, quieto, caminando y pegando, con el reloj del juego controlado.
// Uso: URL=... node juego/herramientas/t870_armas_vivas.cjs <clase> <fam,fam,...> [etiqueta]
//   ELEMS=fuego,frio,...   (por defecto los siete y 'acero')   DIRS=se,so,...   ZONA=a1_paramo   BASE=1 (arma del arsenal con su elemento)
// Guarda en /tmp/requiem-pruebas/armas/<etiqueta>/<clase>_<fam>_<elem>_<dir>_<cuadro>.png (recorte de 160x160 con el héroe al
// centro) y un json con lo que se capturó. Las láminas y los zooms se arman con t870_lamina.py.
const { entrar } = require('./comun_pruebas.cjs');
const fs = require('fs');
(async () => {
  const clase = process.argv[2] || 'templario', fams = (process.argv[3] || 'espada').split(','), etq = process.argv[4] || 'antes';
  const ELEMS = (process.env.ELEMS || 'fuego,frio,rayo,veneno,sombra,luz,sangre,acero').split(',');
  const DIRS = (process.env.DIRS || 'se,so,ne').split(',');
  const DIR = `/tmp/requiem-pruebas/armas/${etq}`; fs.mkdirSync(DIR, { recursive: true });
  process.on('unhandledRejection', (e) => { console.log('FALLA', String(e).slice(0, 400)); process.exit(1); });
  const { b, p, errs } = await entrar('pc', clase, 60, undefined, 'd.fue = 500; d.des = 500; d.ene = 300; d.vit = 300;');
  await p.evaluate((z) => window.__ir(z), process.env.ZONA || 'a1_paramo'); await p.waitForTimeout(6000);
  await p.evaluate(() => { const j = window.__juego(), z = j.zona, h = j.heroe; window.__sinLluvia = true; let mejor = null, md = 0;
    for (let y = 14; y < z.H - 14; y += 2) for (let x = 14; x < z.W - 14; x += 2) { let libre = true; for (let dy = -5; dy <= 5 && libre; dy++) for (let dx = -5; dx <= 5; dx++) if (z.bloq[(y + dy) * z.W + x + dx]) { libre = false; break; } if (!libre) continue;
      let d = 99; for (const o of z.objetos) d = Math.min(d, Math.hypot(o.cx - x, o.cy - y)); if (d > md) { md = d; mejor = [x, y]; } }
    if (!mejor) mejor = [Math.floor(h.x), Math.floor(h.y)];
    (h.d.thor ??= {}).descanso = 1e9; h.x = mejor[0] + 0.5; h.y = mejor[1] + 0.5; h.camino = null; window.__sitio = [h.x, h.y]; j.monstruos.length = 0; j.npcs.length = 0; h.vida = h.vidaMax = 1e7; });
  await p.waitForTimeout(1500);
  await p.clock.install(); await p.clock.pauseAt(new Date(Date.now() + 500));
  const correr = async (ms) => { for (let i = 0; i < ms / 40; i++) await p.clock.runFor(40); };
  const esperarPintura = async () => { for (let i = 0; i < 400; i++) { await correr(400); await p.waitForTimeout(300); if (i > 3 && (await p.evaluate(() => { const P = window.__T.P, j = window.__juego(); return P.progresoPintura >= 1 && !!j.firma && (j.firma === 'base' || !!P.cuadrosDeFirma(j.firma, 'atacar', 'se')); }))) break; } await correr(1200); };
  const caja = await p.evaluate(() => { const [x, y] = window.__aPant(window.__sitio[0], window.__sitio[1]); return [x, y]; });
  const recorte = async () => { const [x, y] = await p.evaluate(() => { const h = window.__juego().heroe; return window.__aPant(h.x, h.y); }); return { x: Math.round(x - 80), y: Math.round(y - 115), width: 160, height: 160 }; };
  const hecho = [];
  for (const fam of fams) {
    // el arma: del arsenal sin elemento (nivel 1) o con el elemento propio si BASE=1 y existe
    const ok = await p.evaluate(([fam]) => { const T = window.__T, j = window.__juego(), d = j.heroe.d; const b = T.O.BASE_POR_ID.get(`ars_${fam}_1`) || T.D.BASES.find((x) => x.ranura === 'arma' && x.familia === fam); if (!b) return null; const o = T.O.crearBase(b, 60); d.equipo.arma = o; if (b.dosManos || /arco|ballesta|baculo/.test(b.familia)) d.equipo.izq = null; window.__mundo.recalc(j); return b.id; }, [fam]);
    if (!ok) { console.log('sin arma', fam); continue; }
    await esperarPintura();
    for (const el of ELEMS) {
      await p.evaluate(([el, base]) => { const T = window.__T, j = window.__juego(), d = j.heroe.d, o = d.equipo.arma; if (el === 'acero') { o.vivo = undefined; o.rareza = 'unico'; } else { o.vivo = el; o.rareza = 'normal'; } window.__mundo.recalc(j); }, [el, process.env.BASE]);
      if (el === 'acero') await esperarPintura();
      for (const dir of DIRS) {
        const pre = `${clase}_${fam}_${el}_${dir}`;
        await p.evaluate((dir) => { const j = window.__juego(), h = j.heroe; h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.acc = 'quieto'; h.dir = dir; j.monstruos.length = 0; j.efectos.length = 0; j.proyectiles.length = 0; j.particulas.length = 0; j.numeros.length = 0; }, dir);
        await correr(1200);
        const c = await recorte();
        await p.screenshot({ path: `${DIR}/${pre}_quieto0.png`, clip: c }); await correr(360);
        await p.screenshot({ path: `${DIR}/${pre}_quieto1.png`, clip: c });
        // caminar hacia el rumbo
        const V = { s: [1, 1], so: [0, 1], o: [-1, 1], no: [-1, 0], n: [-1, -1], ne: [0, -1], e: [1, -1], se: [1, 0] }[dir];
        await p.evaluate(([vx, vy]) => { const j = window.__juego(), h = j.heroe; h.correr = false; window.__mundo.caminarA(j, h.x + vx * 6, h.y + vy * 6); }, V);
        for (let i = 0; i < 6; i++) { await correr(80); await p.screenshot({ path: `${DIR}/${pre}_camina${i}.png`, clip: await recorte() }); }
        // pegar a un zombi dormido puesto en el rumbo
        await p.evaluate(async ([dir, vx, vy, blanco]) => { const j = window.__juego(), h = j.heroe, M = window.__mundo, D = await import('/src/datos/monstruos.ts'); h.x = window.__sitio[0]; h.y = window.__sitio[1]; h.camino = null; h.destino = null; h.acc = 'quieto'; h.dir = dir;
          const lejos = h.c.distancia ? 4 : 1.1; window.__m = { x: h.x + vx * lejos, y: h.y + vy * lejos };
          if (blanco) { const m = M.crearMonstruo(D.MONSTRUOS['zombi'], 10, h.x + vx * lejos, h.y + vy * lejos, 0, 0); m.vida = m.vidaMax = 1e6; m.estado = 'dormido'; j.monstruos.push(m); window.__m = m; } }, [dir, ...V, !!process.env.BLANCO]);
        await correr(200);
        await p.evaluate(() => { const j = window.__juego(), h = j.heroe; h.recargas = {}; window.__mundo.usarHabilidad(j, 'ataque', window.__m.x, window.__m.y, window.__m.vida ? window.__m : null, !window.__m.vida); });
        const ca = await recorte();
        for (let i = 0; i < 14; i++) { await correr(40); await p.evaluate(() => { window.__juego().numeros.length = 0; }); await p.screenshot({ path: `${DIR}/${pre}_ataque${String(i).padStart(2, '0')}.png`, clip: ca }); }
        hecho.push(pre);
      }
      console.log('listo', clase, fam, el);
    }
  }
  fs.writeFileSync(`${DIR}/${clase}_${fams.join('-')}.json`, JSON.stringify(hecho));
  console.log('errs', errs.filter((e) => !/404/.test(e)).slice(0, 4)); await b.close();
})();
