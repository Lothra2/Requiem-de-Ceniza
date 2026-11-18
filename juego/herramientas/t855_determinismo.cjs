// La misma zona sale igual siempre: genera las 96 zonas apenas carga la página (en frío), las vuelve a generar muchas veces
// (para que el motor caliente las funciones) y compara. Antes un `.sort(() => r() - 0.5)` en las escenas de los mundos
// abiertos daba otro orden en frío que en caliente: otros cofres, otro relieve, otro `bloq` en el páramo y el bosque.
//   node juego/herramientas/t855_determinismo.cjs [semillas=2]
//   REF=archivo.json guarda las huellas en caliente (sin REF existente) o compara contra ellas (con REF existente).
const fs = require('fs');
const { chromium } = require('playwright');
(async () => {
  const N = +(process.argv[2] || 2), URL = process.env.URL || 'http://127.0.0.1:5190/';
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
  // FRESCO=archivo.json: cada zona a cielo abierto en una página nueva, generada apenas carga (en frío de verdad), y se
  // guarda o se compara contra ese archivo (lo caminable, los grupos y las marcas: no lo que solo se ve). Sirve para ver que
  // un arreglo deja las zonas como las veía una partida al cargar.
  if (process.env.FRESCO) {
    const huellas = {}; let ids = null;
    for (let i = 0; ; i++) {
      const p = await b.newPage(); await p.addInitScript(() => localStorage.setItem('marca.intro', '1')); await p.goto(URL);
      const r = await p.evaluate(async ([i, N]) => {
        const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts');
        const ext = Object.values(A.ZONAS).filter((d) => d.tipo === 'exterior'); if (i >= ext.length) return null;
        const def = ext[i], out = {};
        for (let s = 1; s <= N; s++) { const z = Z.generarZona(def, s * 7919 + 13); out[def.id + '#' + s] = Array.from(z.bloq).reduce((a, b) => (a * 31 + b) >>> 0, 0) + ':' + z.spawns.concat(z.marcas).map((q) => q.cx * 7 + q.cy).reduce((a, b) => (a * 31 + b) >>> 0, 0); }
        return out;
      }, [i, N]);
      await p.close(); if (!r) break; Object.assign(huellas, r);
    }
    if (fs.existsSync(process.env.FRESCO)) { const ref = JSON.parse(fs.readFileSync(process.env.FRESCO, 'utf8')); const mal = Object.keys(ref).filter((k) => ref[k] !== huellas[k]); console.log(`en frío contra ${process.env.FRESCO}: ${Object.keys(ref).length} zonas, ${mal.length} distintas`, mal.join(' '), mal.length ? 'MAL' : 'OK'); }
    else { fs.writeFileSync(process.env.FRESCO, JSON.stringify(huellas)); console.log('guardado', Object.keys(huellas).length, 'en', process.env.FRESCO); }
    await b.close(); return;
  }
  const p = await b.newPage();
  const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('marca.intro', '1'));
  await p.goto(URL);
  const r = await p.evaluate(async (N) => {
    const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts');
    const h = (s, v) => (Math.imul(s ^ v, 16777619) >>> 0);
    const huella = (z) => {
      let s = 2166136261;
      for (let i = 0; i < z.bloq.length; i++) s = h(s, z.bloq[i]);
      for (const o of z.objetos) { s = h(s, o.cx * 4096 + o.cy); for (let i = 0; i < o.id.length; i++) s = h(s, o.id.charCodeAt(i)); for (let i = 0; i < o.v.length; i++) s = h(s, o.v.charCodeAt(i)); }
      for (const t of z.pisos) { s = h(s, t ? t.v + 1 : 0); if (t) for (let i = 0; i < t.id.length; i++) s = h(s, t.id.charCodeAt(i)); }
      if (z.alturas) for (let i = 0; i < z.alturas.length; i += 7) s = h(s, Math.round(z.alturas[i] * 1e6));
      for (const q of [...z.spawns, ...z.marcas]) s = h(s, q.cx * 4096 + q.cy);
      return s.toString(16);
    };
    const todas = () => { const out = {}; for (const def of Object.values(A.ZONAS)) for (let s = 1; s <= N; s++) out[def.id + '#' + s] = huella(Z.generarZona(def, s * 7919 + 13)); return out; };
    const frio = todas();
    // caliente: hasta que dos vueltas seguidas den lo mismo (el motor compila en segundo plano: vueltas y pausas)
    let caliente = todas(), vueltas = 1;
    for (; vueltas < 40; vueltas++) { await new Promise((r) => setTimeout(r, 400)); const otra = todas(); const igual = Object.keys(otra).every((k) => otra[k] === caliente[k]); caliente = otra; if (igual && vueltas >= 8) break; }
    const distintas = Object.keys(frio).filter((k) => frio[k] !== caliente[k]);
    return { frio, caliente, distintas, vueltas };
  }, N);
  let malas = r.distintas.length, ref = null;
  console.log(`zonas x semillas: ${Object.keys(r.frio).length} (${r.vueltas} vueltas para calentar), distintas en frío y en caliente: ${malas}`, r.distintas.slice(0, 10).join(' '));
  if (process.env.REF) {
    if (fs.existsSync(process.env.REF)) {
      ref = JSON.parse(fs.readFileSync(process.env.REF, 'utf8'));
      for (const t of ['frio', 'caliente']) {
        const cambian = Object.keys(ref[t]).filter((k) => ref[t][k] !== r.frio[k]);
        console.log(`contra la referencia en ${t}: ${cambian.length} distintas`, cambian.slice(0, 10).join(' '));
        if (t === (process.env.CONTRA || 'frio')) malas += cambian.length;
      }
    } else { fs.writeFileSync(process.env.REF, JSON.stringify({ frio: r.frio, caliente: r.caliente })); console.log('referencia guardada en', process.env.REF); }
  }
  console.log(malas ? 'MAL' : 'OK', errs.slice(0, 3));
  await b.close();
})();
