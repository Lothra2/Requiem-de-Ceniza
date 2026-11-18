// Trajes en el juego: viste al héroe con piezas que caen (con su traje), espera al pintor en vivo y saca la foto del
// héroe en el mundo y del inventario. Uso: node juego/herramientas/t852_traje_vivo.cjs [clase] [semilla]
const { entrar } = require('./comun_pruebas.cjs');
const clase = process.argv[2] || 'templario', sem = +(process.argv[3] || 1);
const OUT = '/tmp/requiem-pruebas/trajes';
(async () => {
  const aj = `const O = window.__T.O; let u = ${sem * 1000};
    const pz = (r, f) => { for (let i = 0; i < 400; i++) { const o = O.crearObjeto(40, 'raro', f); if (O.baseDe(o).ranura === r) { o.uid = ++u; return o; } } };
    d.nivel = 60; d.fue = d.des = 250;
    d.equipo.torso = pz('torso', (b) => b.ranura === 'torso' && /placas|malla|loriga|coraza/.test(b.id) && !b.linea && !b.tinte);
    d.equipo.cabeza = pz('cabeza', (b) => b.ranura === 'cabeza' && /yelmo|casco/.test(b.id) && !b.linea && !b.tinte);
    d.equipo.manos = pz('manos', (b) => b.ranura === 'manos' && !b.linea && !b.tinte);
    d.equipo.pies = pz('pies', (b) => b.ranura === 'pies' && !b.linea && !b.tinte);
    d.equipo.cinturon = pz('cinturon', (b) => b.ranura === 'cinturon' && !b.linea && !b.tinte);`;
  const { b, p, errs } = await entrar('pc', clase, 60, process.env.URL, aj);
  let prog = 0;
  for (let i = 0; i < 240; i++) { await p.waitForTimeout(1000); prog = await p.evaluate(() => window.__T.P.progresoPintura); if (prog >= 1 && i > 3) break; }
  const traje = await p.evaluate(() => { const d = window.__juego().heroe.d; return JSON.stringify(window.__T.H.equipoVisual(d)).slice(0, 600); });
  console.log('pintura', prog, traje);
  await p.screenshot({ path: `${OUT}/vivo_${clase}_${sem}.png` });
  await p.keyboard.press('i'); await p.waitForTimeout(2500);
  await p.screenshot({ path: `${OUT}/vivo_${clase}_${sem}_inv.png` });
  console.log('errores:', errs.filter((e) => !/favicon/.test(e)).slice(0, 5));
  await b.close();
})();
