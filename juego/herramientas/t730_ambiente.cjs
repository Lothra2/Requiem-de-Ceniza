// Genera todas las zonas y revisa que cada objeto que ponen exista horneado (nada invisible) y cuánta ambientación llevan.
const { chromium } = require('playwright');
(async () => { const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('marca.intro', '1'));
  await p.goto('http://127.0.0.1:5190/'); await p.waitForFunction(() => window.__T, null, { timeout: 90000 });
  const r = await p.evaluate(async () => {
    const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); const man = await (await fetch('/assets/manifiesto.json')).json();
    const faltan = {}, zonas = []; let tot = 0, fallas = [];
    for (const def of Object.values(A.ZONAS)) { let z; try { z = Z.generarZona(def, 12345); } catch (e) { fallas.push(def.id + ': ' + String(e).slice(0, 80)); continue; }
      for (const o of z.objetos) if (!/^(per_|mon_)/.test(o.id) && !man.o[o.id + '|' + o.v]) faltan[o.id + '|' + o.v] = (faltan[o.id + '|' + o.v] || 0) + 1;
      tot += z.objetos.length; zonas.push(def.id + ':' + z.objetos.length); }
    return { zonas: zonas.length, tot, faltan, fallas, muestra: zonas.slice(0, 10) };
  });
  console.log(JSON.stringify(r).slice(0, 1500), errs.slice(0, 2)); await b.close(); })();
