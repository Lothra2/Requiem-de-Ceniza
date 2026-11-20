// Auditoría de adornos (Rick, 19 nov 2026: "dos cofres uno al lado del otro", "no quiero adornos por todos lados sin
// intención"). Genera las 96 zonas (sin dibujar) y mide por zona: adornos por cada 100 celdas caminables y por categoría
// (cofres, contenedores, gore, ambiente chico, velas y luces, muebles, relleno), pares de cofres cerca, cofres de adorno
// junto a uno de verdad, el mismo adorno repetido al lado, el peor cuadro de 12 x 12 y de qué paso salió cada cosa
// (`capa`). Uso: node juego/herramientas/t920_adornos.cjs [etiqueta] [semillas]   (URL= otro puerto, SIN_CURAR=1 mide sin
// `curarAdornos`). Escribe /tmp/requiem-pruebas/adornos/medida_<etiqueta>.json.
const { chromium } = require('playwright');
const fs = require('fs');
const ETI = process.argv[2] || 'ahora', N = +(process.argv[3] || 2), URL = process.env.URL || 'http://127.0.0.1:5190/';
const OUT = '/tmp/requiem-pruebas/adornos'; fs.mkdirSync(OUT, { recursive: true });
(async () => {
  const b = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {}); const p = await b.newPage(); const errs = []; p.on('pageerror', (e) => errs.push(e.message));
  await p.addInitScript(() => localStorage.setItem('marca.intro', '1'));
  await p.goto(URL); await p.waitForFunction(() => window.__T, null, { timeout: 120000 });
  const r = await p.evaluate(async ([N, sinCurar, raiz]) => {
    globalThis.__sinCurar = sinCurar;
    const Z = await import('/src/mundo/zona.ts'), A = await import('/src/mundo/actos.ts'); await import('/src/mundo/actos67.ts');
    const G = await import('/@fs' + raiz + '/src/engine/gotico/index.ts').catch(() => null);
    const plano = new Set((G?.REGISTRO ?? []).filter((d) => d.plano).map((d) => d.id));
    const ESTRUCT = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|^bor_|esquina|entrada|^com_cueva|escalinata|acto_hito|^per_|^mon_|^npc_|_orilla|vacio_/;
    const CAT = [
      ['cofre', (o) => o.tag === 'cofre' || o.tag === 'baul'],
      ['cofre_adorno', (o) => /cofre|arcon|baul/.test(o.id)],
      ['contenedor', (o) => o.tag === 'romper' || /urna|barril|caja|saco|vasija|anfora|jarron|tinaja|nasa/.test(o.id)],
      ['gore', (o) => /^hor_|sangre|cadaver|cuerpo|empal|colgad|horca|jaula|craneo|calav|hueso|costill|esquel|osario|osament|tortura|carne|crucific|picas|restos|mortaja|amortaj|ahorc|viscer|tripa|muerto|ahogado/.test(o.id)],
      ['telarana', (o) => /telar/.test(o.id)],
      ['luz', (o) => /vela|candel|lampara|linterna|antorch|brasero|farol|fogata|pira|cirio/.test(o.id)],
      ['mueble', (o) => /mesa|silla|banco|estante|atril|^mue_|cama|armario|librer|trono|alfombra/.test(o.id)],
      ['planta', (o) => /pasto|hierba|helecho|hongo|seta|musgo|flor|junco|raiz|zarza|liana|alga|coral|planta|cardo|brote|mata|arbust|brezo/.test(o.id)],
    ];
    const cat = (o) => { if (o.capa === 'relleno') return 'relleno'; if (plano.has(o.id)) return 'piso'; if (o.id === 'dec_escalon') return 'escalon'; if (ESTRUCT.test(o.id) && !o.tag) return null; for (const [c, f] of CAT) if (f(o)) return c; return 'otro'; };
    const zonas = [];
    for (const id of Object.keys(A.ZONAS)) for (let s = 1; s <= N; s++) {
      const def = A.ZONAS[id], z = Z.generarZona(def, s * 7919 + 13), { W, H } = z;
      // lo que guarda la partida y lo caminable, contra la misma zona sin curarAdornos: mismo tamaño, pisos, entradas,
      // salidas y grupos; lo que se alcanzaba desde la entrada (por celdas del todo libres, como t370) se sigue alcanzando (salvo la huella de lo que se mudó o
      // se agregó) y las salidas, los grupos y los cofres quedan al alcance
      let comp = null;
      if (!sinCurar) {
        globalThis.__sinCurar = true; const z0 = Z.generarZona(def, s * 7919 + 13); globalThis.__sinCurar = false;
        const mal = [];
        if (z0.W !== W || z0.H !== H || z0.tw !== z.tw || z0.th !== z.th || z0.explorado.length !== z.explorado.length) mal.push('tamano');
        if (JSON.stringify(z0.pisos) !== JSON.stringify(z.pisos)) mal.push('pisos');
        if (JSON.stringify(z0.entradas) !== JSON.stringify(z.entradas)) mal.push('entradas');
        if (JSON.stringify(z0.salidas.map((q) => [q.cx, q.cy, q.destino])) !== JSON.stringify(z.salidas.map((q) => [q.cx, q.cy, q.destino]))) mal.push('salidas');
        // (desde los campamentos, `asentarCampamentos` corre cada uno a lo más abierto que tenga a 5 celdas DESPUÉS de curar: el
        //  sitio exacto puede cambiar con el curado. Lo que no puede cambiar: cuántos son, de qué tipo, y que queden a 5 de donde estaban)
        { const q = (sp) => sp.map((s) => s.tipo + (s.grupos ?? '')).join(); if (q(z0.spawns) !== q(z.spawns) || z.spawns.some((s, i) => Math.hypot(s.cx - z0.spawns[i].cx, s.cy - z0.spawns[i].cy) > 10.5)) mal.push('grupos'); }
        const alc = (zz) => { const v = new Uint8Array(W * H), e = zz.entradas.arriba ?? Object.values(zz.entradas)[0]; const i0 = Math.floor(e[1]) * W + Math.floor(e[0]); if (zz.bloq[i0]) return v; const pila = [i0]; v[i0] = 1; while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!v[j] && !zz.bloq[j]) { v[j] = 1; pila.push(j); } } } return v; };
        const a0 = alc(z0), a1 = alc(z), pas = (b) => b === 0 || b === 3;
        let cerradas = 0, abiertas = 0, perdidas = 0;
        for (let i = 0; i < W * H; i++) { const p0 = pas(z0.bloq[i]), p1 = pas(z.bloq[i]); if (p0 && !p1) cerradas++; if (!p0 && p1) abiertas++; if (a0[i] && !a1[i] && z.bloq[i] === 0) perdidas++; }
        const llega = (cx, cy, rr = 3) => { for (let dy = -rr; dy <= rr; dy++) for (let dx = -rr; dx <= rr; dx++) { const X = Math.floor(cx) + dx, Y = Math.floor(cy) + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && a1[Y * W + X]) return true; } return false; };
        const lejos = [...z.salidas.map((q) => ['salida', q.cx, q.cy]), ...z.spawns.map((q) => ['grupo ' + q.tipo, q.cx, q.cy]), ...z.objetos.filter((o) => o.tag === 'cofre').map((o) => ['cofre', o.cx, o.cy])].filter(([n, x, y]) => !llega(x, y) && (n !== 'cofre' || true));
        const antes = new Set([...z0.salidas.map((q) => ['salida', q.cx, q.cy]), ...z0.spawns.map((q) => ['grupo ' + q.tipo, q.cx, q.cy])].filter(([, x, y]) => { for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = Math.floor(x) + dx, Y = Math.floor(y) + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && a0[Y * W + X]) return false; } return true; }).map((q) => q.join()));
        const nuevos = lejos.filter((q) => !antes.has(q.join()));
        if (perdidas) mal.push('perdidas ' + perdidas);
        if (nuevos.length) mal.push('lejos ' + nuevos.map((q) => q[0]).join(','));
        comp = { mal, cerradas, abiertas };
      }
      let camin = 0; for (let i = 0; i < W * H; i++) { const b = z.bloq[i]; if ((b === 0 || b === 3) && z.pisos[Math.floor(i / W / 5) * z.tw + Math.floor((i % W) / 5)]) camin++; }
      const por = {}, capas = {}, otros = {}; const deco = [];
      for (const o of z.objetos) { const c = cat(o); if (!c) continue; por[c] = (por[c] || 0) + 1; if (c === 'otro') otros[o.id] = (otros[o.id] || 0) + 1; if (c !== 'relleno' && c !== 'piso') { deco.push({ o, c }); capas[o.capa || '-'] = (capas[o.capa || '-'] || 0) + 1; } }
      const d = (a, b) => Math.hypot(a.cx - b.cx, a.cy - b.cy);
      const cof = z.objetos.filter((o) => o.tag === 'cofre' || o.tag === 'baul'), cofA = z.objetos.filter((o) => !o.tag && /cofre|arcon|baul/.test(o.id));
      let p3 = 0, p6 = 0, p10 = 0, ad6 = 0; const ejemplos = [];
      for (let i = 0; i < cof.length; i++) for (let j = i + 1; j < cof.length; j++) { const q = d(cof[i], cof[j]); if (q <= 3) p3++; if (q < 6) p6++; if (q < 10) p10++; if (q < 6 && ejemplos.length < 3) ejemplos.push(`${cof[i].id}(${cof[i].capa}) ${cof[j].id}(${cof[j].capa}) a ${q.toFixed(1)} en ${cof[i].cx},${cof[i].cy}`); }
      for (const a of cofA) for (const c of [...cof, ...cofA]) if (c !== a && d(a, c) < 6) { ad6++; if (ejemplos.length < 5) ejemplos.push(`adorno ${a.id}(${a.capa}) junto a ${c.id}(${c.capa}) a ${d(a, c).toFixed(1)}`); break; }
      // el mismo adorno a menos de 5 celdas (pares), sin relleno
      let rep = 0; const repId = {};
      const ch = deco.map((x) => x.o).filter((o) => o.hw * o.hh <= 9);
      for (let i = 0; i < ch.length; i++) for (let j = i + 1; j < ch.length; j++) if (ch[i].id === ch[j].id && d(ch[i], ch[j]) < 5) { rep++; repId[ch[i].id] = (repId[ch[i].id] || 0) + 1; }
      // el cuadro de 12 x 12 más cargado (adornos chicos)
      let peor = 0, peorEn = null; const G = 12, gw = Math.ceil(W / 6), gh = Math.ceil(H / 6), grid = new Uint16Array(gw * gh);
      for (const o of ch) grid[Math.floor(o.cy / 6) * gw + Math.floor(o.cx / 6)]++;
      for (let y = 0; y < gh - 1; y++) for (let x = 0; x < gw - 1; x++) { const n = grid[y * gw + x] + grid[y * gw + x + 1] + grid[(y + 1) * gw + x] + grid[(y + 1) * gw + x + 1]; if (n > peor) { peor = n; peorEn = [x * 6 + 6, y * 6 + 6]; } }
      const k100 = 100 / Math.max(1, camin);
      zonas.push({ id, s, tipo: def.tipo, tema: def.tema, camin, deco: deco.length, densidad: +(deco.length * k100).toFixed(2), por, capas, cofres: cof.length, p3, p6, p10, ad6, rep, repTop: Object.entries(repId).sort((a, b) => b[1] - a[1]).slice(0, 3), repId, peor, peorEn, ejemplos, otros, comp, objetos: z.objetos.length });
    }
    return zonas;
  }, [N, !!process.env.SIN_CURAR, require('path').resolve(__dirname, '../..')]);
  const sum = (f) => r.reduce((a, z) => a + f(z), 0);
  const tipos = ['exterior', 'mazmorra', 'pueblo'];
  console.log(`zonas ${r.length}  errores ${errs.length}`);
  for (const t of tipos) { const zs = r.filter((z) => z.tipo === t); if (!zs.length) continue; const c = {}; let cam = 0; for (const z of zs) { cam += z.camin; for (const [k, v] of Object.entries(z.por)) c[k] = (c[k] || 0) + v; }
    console.log(`${t.padEnd(9)} n ${zs.length}  adornos/100 ${(zs.reduce((a, z) => a + z.deco, 0) * 100 / cam).toFixed(2)}  ` + Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(v * 100 / cam).toFixed(2)}`).join('  ')); }
  console.log(`cofres ${sum((z) => z.cofres)}  pares<=3 ${sum((z) => z.p3)}  pares<6 ${sum((z) => z.p6)}  pares<10 ${sum((z) => z.p10)}  adorno-cofre<6 ${sum((z) => z.ad6)}  repetidos<5 ${sum((z) => z.rep)}  peor12x12 max ${Math.max(...r.map((z) => z.peor))} medio ${(sum((z) => z.peor) / r.length).toFixed(1)}`);
  if (!process.env.SIN_CURAR) { const malas = r.filter((z) => z.comp && z.comp.mal.length); console.log(`contra sin curar: ${malas.length} zonas con algo distinto, celdas cerradas ${sum((z) => z.comp?.cerradas ?? 0)} abiertas ${sum((z) => z.comp?.abiertas ?? 0)}`); for (const z of malas.slice(0, 20)) console.log('  MAL', z.id, z.s, z.comp.mal.join(' | ')); }
  const ot = {}; for (const z of r) for (const [k, v] of Object.entries(z.otros)) ot[k] = (ot[k] || 0) + v; console.log('otro (los 15 que más):', Object.entries(ot).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + ' ' + v).join(', '));
  const rp = {}; for (const z of r) for (const [k, v] of Object.entries(z.repId)) rp[k] = (rp[k] || 0) + v; console.log('repetidos (los 15 que más):', Object.entries(rp).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([k, v]) => k + ' ' + v).join(', '));
  const capas = {}; for (const z of r) for (const [k, v] of Object.entries(z.capas)) capas[k] = (capas[k] || 0) + v; console.log('por capa', JSON.stringify(capas));
  const orden = [...r].sort((a, b) => b.densidad - a.densidad), dec = orden.slice(0, Math.ceil(r.length / 10));
  console.log('decil más cargado:'); for (const z of dec) console.log(`  ${z.id} s${z.s} ${z.tipo} ${z.densidad}/100  peor ${z.peor} en ${z.peorEn}  rep ${z.rep} ${JSON.stringify(z.repTop)}`);
  const conPares = r.filter((z) => z.p6 || z.ad6); console.log('cofres cerca:'); for (const z of conPares.slice(0, 25)) console.log(`  ${z.id} s${z.s}: ${z.ejemplos.join(' | ')}`);
  fs.writeFileSync(`${OUT}/medida_${ETI}.json`, JSON.stringify(r));
  if (errs.length) console.log(errs.slice(0, 3));
  await b.close();
})();
