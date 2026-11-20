// Medidas de espacio de una zona (salen de la auditoría de mundos del 20 nov 2026): despeje, arenas, pasillos, grupos, gore
// (medirZona) y amontonamiento de adornos por pantalla (monton). Las usa t1000_espacios.mjs. Definiciones en CLAUDE.md, Mundos.
export const medirZona = function (z, mons, vista) {
  const W = z.W, H = z.H, N = W * H, tw = z.tw;
  const EST = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina/;
  const GORE = /^hor_|cadaver|cuerpo|empal|colgad|horca|jaula|craneo|calav|hueso|costill|esquel|osario|osament|tortura|crucific|picas|restos|mortaja|amortaj|ahorc|muerto|ahogado|sangre|cadena|gancho|buitres|tumba_reventada/;
  const ANCLA = /^hor_|horca|empal|jaula|pila_cad|tortura|crucific|picas|colgad|patibulo|cuervos_cadaver|nido_huesos|inf2_cuerpos|par_cadaver|des_esqueleto|ahg_red_huesos|pozo_huesos|trono_huesos|foso|cel_angel_caido|restos_batalla|pila_craneos/;
  // alcanzable desde la entrada
  const e0 = z.entradas.arriba || Object.values(z.entradas)[0];
  const alc = new Uint8Array(N);
  { const i0 = Math.floor(e0[1]) * W + Math.floor(e0[0]); const pila = [i0]; alc[i0] = 1; while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!alc[j] && !z.bloq[j]) { alc[j] = 1; pila.push(j); } } } }
  // bloqueo estructural: se quitan los adornos que bloquean (no muros, no relleno, no hueco de cueva)
  const bS = z.bloq.slice(); let decoBloq = 0; const decos = [];
  for (const o of z.objetos) { if (!o.bloquea || EST.test(o.id) || o.capa === 'relleno') continue; decoBloq++; decos.push(o);
    const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2);
    for (let y = y0; y < y0 + o.hh; y++) for (let x = x0; x < x0 + o.hw; x++) if (x >= 0 && y >= 0 && x < W && y < H && bS[y * W + x] === 1 && !(z.hueco && z.hueco[y * W + x])) bS[y * W + x] = 0; }
  // lo estructural solo cuenta si toca lo alcanzable (alcanzable + adornos quitados pegados)
  const libreS = new Uint8Array(N);
  { const pila = []; for (let i = 0; i < N; i++) if (alc[i]) { libreS[i] = 1; pila.push(i); } while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!libreS[j] && !bS[j]) { libreS[j] = 1; pila.push(j); } } } }
  // transformada de distancia de Chebyshev (cuántos anillos libres alrededor): c = 0 pegado a algo
  const dt = (libre) => { const d = new Int16Array(N); const INF = 9999;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const i = y * W + x; if (!libre[i]) { d[i] = 0; continue; } if (x === 0 || y === 0 || x === W - 1 || y === H - 1) { d[i] = 1; continue; } d[i] = Math.min(d[i - 1], d[i - W], d[i - W - 1], d[i - W + 1]) + 1; }
    for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) { const i = y * W + x; if (!libre[i]) continue; if (x === 0 || y === 0 || x === W - 1 || y === H - 1) continue; d[i] = Math.min(d[i], d[i + 1] + 1, d[i + W] + 1, d[i + W + 1] + 1, d[i + W - 1] + 1); }
    return d; };  // d = 1 + anillos libres
  const dA = dt(alc), dS = dt(libreS);
  const abrir = (d, libre, R) => { // unión de cuadrados (2R+1) centrados en celdas con R anillos libres
    const m = new Uint8Array(N); const nuc = new Uint8Array(N); for (let i = 0; i < N; i++) if (d[i] >= R + 1) nuc[i] = 1;
    // dilatación separable
    const t = new Uint8Array(N);
    for (let y = 0; y < H; y++) { let ult = -9999; for (let x = 0; x < W; x++) { if (nuc[y * W + x]) ult = x; if (x - ult <= R) t[y * W + x] = 1; } ult = 9999; for (let x = W - 1; x >= 0; x--) { if (nuc[y * W + x]) ult = x; if (ult - x <= R) t[y * W + x] = 1; } }
    for (let x = 0; x < W; x++) { let ult = -9999; for (let y = 0; y < H; y++) { if (t[y * W + x]) ult = y; if (y - ult <= R) m[y * W + x] = 1; } ult = 9999; for (let y = H - 1; y >= 0; y--) { if (t[y * W + x]) ult = y; if (ult - y <= R) m[y * W + x] = 1; } }
    for (let i = 0; i < N; i++) if (!libre[i]) m[i] = 0; return m; };
  const comps = (m) => { const id = new Int32Array(N).fill(-1), out = []; for (let s = 0; s < N; s++) { if (!m[s] || id[s] >= 0) continue; const k = out.length; let n = 0, sx = 0, sy = 0, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; const pila = [s]; id[s] = k; while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; n++; sx += x; sy += y; if (x < x0) x0 = x; if (y < y0) y0 = y; if (x > x1) x1 = x; if (y > y1) y1 = y; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (m[j] && id[j] < 0) { id[j] = k; pila.push(j); } } } out.push({ n, cx: sx / n, cy: sy / n, w: x1 - x0 + 1, h: y1 - y0 + 1 }); } return { id, out }; };
  const cuenta = (a) => { let n = 0; for (let i = 0; i < N; i++) if (a[i]) n++; return n; };
  const pct = (arr, q) => { if (!arr.length) return null; const s = [...arr].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
  const nAlc = cuenta(alc), nS = cuenta(libreS);
  let huella = 0; for (let i = 0; i < z.pisos.length; i++) if (z.pisos[i]) huella += 25;
  // histograma de despeje (anillos libres = d - 1)
  const hist = (d, libre) => { const h = new Array(13).fill(0); for (let i = 0; i < N; i++) if (libre[i]) h[Math.min(12, d[i] - 1)]++; return h; };
  const hA = hist(dA, alc), hS = hist(dS, libreS);
  const are4A = abrir(dA, alc, 4), are4S = abrir(dS, libreS, 4), are6A = abrir(dA, alc, 6), are3A = abrir(dA, alc, 3), are3S = abrir(dS, libreS, 3);
  const cA = comps(are4A), cS = comps(are4S);
  const arenas = cA.out.filter((c) => c.n >= 120), arenasS = cS.out.filter((c) => c.n >= 120);
  const cerca = (L) => { const d = []; for (const a of L) { let m = 1e9; for (const b of L) if (a !== b) m = Math.min(m, Math.hypot(a.cx - b.cx, a.cy - b.cy)); if (m < 1e9) d.push(m); } return d; };
  // pasillos: eje medio (máximo local de d) fuera de las arenas, ancho = 2d - 1
  const anchos = (d, libre, are) => { const a = []; for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!libre[i] || are[i]) continue; const v = d[i]; let mx = true; for (let dy = -1; dy <= 1 && mx; dy++) for (let dx = -1; dx <= 1; dx++) if (d[i + dy * W + dx] > v) { mx = false; break; } if (mx) a.push(2 * v - 1); } return a; };
  const anA = anchos(dA, alc, are4A), anS = anchos(dS, libreS, are4S);
  // salas (mazmorras): componentes de la apertura con R = 3 sobre lo estructural (corta pasillos de hasta 6 de ancho)
  const salas = comps(are3S).out.filter((c) => c.n >= 60).map((c) => ({ n: c.n, w: c.w, h: c.h })).sort((a, b) => b.n - a.n);
  // adornos que bloquean dentro de las arenas estructurales
  let decoEnArena = 0; for (const o of decos) { const i = Math.round(o.cy) * W + Math.round(o.cx); if (are4S[i]) decoEnArena++; }
  const nAre4S = cuenta(are4S), nAre4A = cuenta(are4A);
  // gore
  const capas = {}; let goreN = 0, anclaN = 0; const anclas = [], gores = [];
  for (const o of z.objetos) { if (o.capa) capas[o.capa] = (capas[o.capa] || 0) + 1; const g = GORE.test(o.id) || o.capa === 'matanza' || o.capa === 'horror'; if (g) { goreN++; gores.push(o); } if (ANCLA.test(o.id) || o.capa === 'matanza' || o.capa === 'horror' || o.capa === 'escena') { anclaN++; anclas.push(o); } }
  // grupos
  const sp = z.spawns.map((s) => { const i = Math.floor(s.cy) * W + Math.floor(s.cx); let dg = 1e9, da = 1e9; for (const o of gores) dg = Math.min(dg, Math.hypot(o.cx - s.cx, o.cy - s.cy)); for (const o of anclas) da = Math.min(da, Math.hypot(o.cx - s.cx, o.cy - s.cy));
    // despeje máximo a 3 celdas (el grupo se riega +-2,5)
    let mA = 0, mS = 0; for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) { const X = Math.floor(s.cx) + dx, Y = Math.floor(s.cy) + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const k = Y * W + X; if (alc[k]) mA = Math.max(mA, dA[k] - 1); if (libreS[k]) mS = Math.max(mS, dS[k] - 1); }
    return { t: s.tipo, f: +s.fuerza.toFixed(2), cA: Math.max(0, dA[i] - 1), cS: Math.max(0, dS[i] - 1), mA, mS, enArena: !!are4A[i], enArenaS: !!are4S[i], dGore: dg > 1e8 ? null : +dg.toFixed(1), dAncla: da > 1e8 ? null : +da.toFixed(1), n: 0, ids: {} }; });
  let nMon = null, elites = null, sueltos = 0;
  if (mons) { nMon = 0; elites = 0; for (const m of mons) { if (m.dueno) continue; nMon++; if (m.calidad >= 1) elites++; let b = -1, bd = 7; z.spawns.forEach((s, k) => { const d = Math.hypot((m.ox ?? m.x) - s.cx - 0.5, (m.oy ?? m.y) - s.cy - 0.5); if (d < bd) { bd = d; b = k; } }); if (b >= 0) { sp[b].n++; sp[b].ids[m.def.id] = (sp[b].ids[m.def.id] || 0) + 1; } else sueltos++; } }
  // pantalla: cuántas celdas se ven y cuánto es piso que se pisa
  let pant = null;
  if (vista) { const mw = vista.mw, mh = vista.mh; const libres = []; for (let i = 0; i < N; i++) if (alc[i]) libres.push(i); let s = 1234567; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
    const fr = [], fpiso = [], nl = [], vacio = [], cl = []; const mA2 = Math.ceil(mw / 32) + 1;
    for (let k = 0; k < 30; k++) { const i = libres[Math.floor(rnd() * libres.length)], hx = i % W, hy = (i - hx) / W; let tot = 0, lib = 0, vac = 0, fuera = 0;
      for (let dy = -60; dy <= 60; dy++) for (let dx = -60; dx <= 60; dx++) { const sx = (dx - dy) * 16, sy = (dx + dy) * 8; if (Math.abs(sx) > mw / 2 || Math.abs(sy) > mh / 2) continue; tot++; const X = hx + dx, Y = hy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) { fuera++; continue; } const j = Y * W + X; if (alc[j]) lib++; else if (z.bloq[j] === 2 || (z.hueco && z.hueco[j]) || !z.pisos[Math.floor(Y / 5) * tw + Math.floor(X / 5)]) vac++; }
      fr.push(lib / tot); nl.push(lib); vacio.push((vac + fuera) / tot); cl.push(tot); }
    pant = { celdas: cl[0], libreMed: +pct(fr, 0.5).toFixed(3), libreP10: +pct(fr, 0.1).toFixed(3), libreP90: +pct(fr, 0.9).toFixed(3), vacioMed: +pct(vacio, 0.5).toFixed(3), celdasLibresMed: pct(nl, 0.5) }; }
  const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
  return { id: z.id, tipo: z.tipo, acto: z.acto, nivel: z.nivel, W, H, cueva: !!z.hueco, huella, alc: nAlc, alcPct: +(nAlc / N).toFixed(3), alcHuella: +(nAlc / Math.max(1, huella)).toFixed(3), libreS: nS,
    histA: hA, histS: hS, despejeMed: pct(Array.from(dA).filter((v, i) => alc[i]).map((v) => v - 1), 0.5),
    nucleo4: +((hA.slice(4).reduce((a, b) => a + b, 0)) / nAlc).toFixed(3), nucleo4S: +((hS.slice(4).reduce((a, b) => a + b, 0)) / nS).toFixed(3),
    arena4: +(nAre4A / nAlc).toFixed(3), arena4S: +(nAre4S / nS).toFixed(3), arena6: +(cuenta(are6A) / nAlc).toFixed(3), arena3: +(cuenta(are3A) / nAlc).toFixed(3),
    arenas: arenas.length, arenasS: arenasS.length, arenaMax: arenas.length ? Math.max(...arenas.map((c) => c.n)) : 0, arenaMaxS: arenasS.length ? Math.max(...arenasS.map((c) => c.n)) : 0, arenaMed: pct(arenas.map((c) => c.n), 0.5), arenaVecMed: pct(cerca(arenas), 0.5),
    despejeMax: Math.max(...hA.map((v, i) => (v ? i : 0))), dMaxReal: (() => { let m = 0; for (let i = 0; i < N; i++) if (alc[i] && dA[i] > m) m = dA[i]; return m - 1; })(),
    pasAnchoMed: pct(anA, 0.5), pasAnchoP10: pct(anA, 0.1), pasAnchoMin: anA.length ? Math.min(...anA) : null, pasAnchoMedS: pct(anS, 0.5), pasAnchoP10S: pct(anS, 0.1),
    noArenaPct: +(1 - nAre4A / nAlc).toFixed(3),
    salas: salas.slice(0, 40), salasN: salas.length, salaMed: pct(salas.map((s) => s.n), 0.5), salaLadoMed: pct(salas.map((s) => Math.min(s.w, s.h)), 0.5),
    objetos: z.objetos.length, decoBloq, decoBloq100: +(decoBloq / nS * 100).toFixed(2), decoEnArena, decoArena100: nAre4S ? +(decoEnArena / nAre4S * 100).toFixed(2) : null,
    capas, goreN, gore1000: +(goreN / nAlc * 1000).toFixed(2), anclaN, ancla1000: +(anclaN / nAlc * 1000).toFixed(2),
    spawns: sp, nSpawns: sp.length, nMon, elites, sueltos, mon1000: nMon == null ? null : +(nMon / nAlc * 1000).toFixed(2), pant };
};

export const monton = function (z, man) {
  const W = z.W, H = z.H, N = W * H, tw = z.tw;
  const EST = /muro|pared|muralla|almena|penasco|risco|nichos|reja|puerta|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina/;
  const e0 = z.entradas.arriba || Object.values(z.entradas)[0]; const alc = new Uint8Array(N);
  { const i0 = Math.floor(e0[1]) * W + Math.floor(e0[0]); const pila = [i0]; alc[i0] = 1; while (pila.length) { const i = pila.pop(), x = i % W, y = (i - x) / W; for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (!alc[j] && !z.bloq[j]) { alc[j] = 1; pila.push(j); } } } }
  const props = [], todos = []; const usos = {};
  for (const o of z.objetos) { usos[o.id] = (usos[o.id] || 0) + 1; const m = man.o[o.id + '|' + o.v]; if (!m) continue; const f = m.f[0]; const sx = (o.cx - o.cy) * 16, sy = (o.cx + o.cy) * 8; const r = { x0: sx - f[5], y0: sy - f[6], x1: sx - f[5] + f[3], y1: sy - f[6] + f[4], sx, sy, o, plano: !!m.plano, est: EST.test(o.id) || o.capa === 'relleno', a: f[3] * f[4] };
    todos.push(r); if (!r.plano && !r.est) props.push(r); }
  // solape: pares de adornos (no planos, no estructura) cuyo rectángulo se pisa 30 % o más del más chico (60 % = montado)
  props.sort((a, b) => a.x0 - b.x0); const sol30 = new Uint8Array(props.length), sol60 = new Uint8Array(props.length); let pares30 = 0, pares60 = 0; const ej = {};
  for (let i = 0; i < props.length; i++) { const a = props[i]; for (let j = i + 1; j < props.length && props[j].x0 < a.x1; j++) { const b = props[j]; const ix = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), iy = Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0); if (ix <= 0 || iy <= 0) continue; const fr = ix * iy / Math.min(a.a, b.a); if (fr >= 0.3) { sol30[i] = sol30[j] = 1; pares30++; } if (fr >= 0.6) { sol60[i] = sol60[j] = 1; pares60++; const k = [a.o.id, b.o.id].sort().join(' + '); ej[k] = (ej[k] || 0) + 1; } } }
  const cta = (a) => { let n = 0; for (const v of a) if (v) n++; return n; };
  // huellas pegadas: adornos con otro adorno a menos de 1,5 celdas de borde a borde
  let pegados = 0; { const g = new Map(); const key = (x, y) => (Math.floor(x / 6)) + ',' + (Math.floor(y / 6)); props.forEach((p, i) => { const k = key(p.o.cx, p.o.cy); if (!g.has(k)) g.set(k, []); g.get(k).push(i); });
    props.forEach((p, i) => { const gx = Math.floor(p.o.cx / 6), gy = Math.floor(p.o.cy / 6); let hit = false; for (let dy = -1; dy <= 1 && !hit; dy++) for (let dx = -1; dx <= 1 && !hit; dx++) for (const j of g.get((gx + dx) + ',' + (gy + dy)) || []) { if (j === i) continue; const q = props[j]; const ex = Math.abs(p.o.cx - q.o.cx) - (p.o.hw + q.o.hw) / 2, ey = Math.abs(p.o.cy - q.o.cy) - (p.o.hh + q.o.hh) / 2; if (Math.max(ex, ey) < 1.5) { hit = true; break; } } if (hit) pegados++; }); }
  // por pantalla (1280 x 624): piezas, cobertura de sprites y piso legible
  const libres = []; for (let i = 0; i < N; i++) if (alc[i]) libres.push(i); let s = 1234567; const rnd = () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
  const MW = 1280, MH = 624, G = 8, gw = MW / G, gh = MH / G; const nProps = [], nTodos = [], cob = [], legible = [], pisoPant = [];
  const pct = (arr, q) => { const t = [...arr].sort((a, b) => a - b); return t[Math.min(t.length - 1, Math.floor(q * t.length))]; };
  for (let k = 0; k < 30; k++) { const i = libres[Math.floor(rnd() * libres.length)], hx = i % W, hy = (i - hx) / W, cx = (hx - hy) * 16, cy = (hx + hy) * 8; const X0 = cx - MW / 2, Y0 = cy - MH / 2;
    const g = new Uint8Array(gw * gh); let np = 0, nt = 0;
    for (const r of todos) { if (r.x1 < X0 || r.x0 > X0 + MW || r.y1 < Y0 || r.y0 > Y0 + MH) continue; nt++; if (r.plano) continue; if (!r.est) np++;
      // el tercio de abajo del sprite es su pie: lo que tapa de verdad el piso es el cuerpo. Se cuenta el rectángulo entero menos un margen de 15 %
      const mx = (r.x1 - r.x0) * 0.15, my = (r.y1 - r.y0) * 0.1; const a0 = Math.max(0, Math.floor((r.x0 + mx - X0) / G)), a1 = Math.min(gw - 1, Math.floor((r.x1 - mx - X0) / G)), b0 = Math.max(0, Math.floor((r.y0 + my - Y0) / G)), b1 = Math.min(gh - 1, Math.floor((r.y1 - Y0) / G));
      for (let y = b0; y <= b1; y++) for (let x = a0; x <= a1; x++) g[y * gw + x] = 1; }
    let c = 0; for (const v of g) if (v) c++; cob.push(c / g.length);
    let tot = 0, lib = 0, leg = 0; for (let dy = -60; dy <= 60; dy++) for (let dx = -60; dx <= 60; dx++) { const sx = (dx - dy) * 16, sy = (dx + dy) * 8; if (Math.abs(sx) >= MW / 2 || Math.abs(sy) >= MH / 2) continue; tot++; const X = hx + dx, Y = hy + dy; if (X < 0 || Y < 0 || X >= W || Y >= H || !alc[Y * W + X]) continue; lib++; if (!g[Math.floor((sy + MH / 2) / G) * gw + Math.floor((sx + MW / 2) / G)]) leg++; }
    nProps.push(np); nTodos.push(nt); legible.push(leg / tot); pisoPant.push(lib / tot); }
  return { id: z.id, props: props.length, sol30: +(cta(sol30) / Math.max(1, props.length)).toFixed(3), sol60: +(cta(sol60) / Math.max(1, props.length)).toFixed(3), pares60, pegados: +(pegados / Math.max(1, props.length)).toFixed(3), ej,
    propsPantMed: pct(nProps, 0.5), propsPantP90: pct(nProps, 0.9), dibPantMed: pct(nTodos, 0.5), dibPantP90: pct(nTodos, 0.9), cobMed: +pct(cob, 0.5).toFixed(3), cobP90: +pct(cob, 0.9).toFixed(3), legibleMed: +pct(legible, 0.5).toFixed(3), legibleP10: +pct(legible, 0.1).toFixed(3), pisoPantMed: +pct(pisoPant, 0.5).toFixed(3), usos };
};
