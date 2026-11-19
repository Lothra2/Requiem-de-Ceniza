// Caras y manos a cada escala: el héroe de cada clase (y variantes de género, piel y barba) en el juego (K 1, de frente,
// tres cuartos y de lado), en el muñeco del inventario (K 2,1) y en el retrato de la selección (2,25 con la luz de la
// fogata), con la cabeza recortada; y las manos de cerca (vacía, puño, espada, a dos manos, báculo, arco, escudo,
// guantes, guanteletes, vendas) en reposo y en el golpe. Pinta con el motor, sin servidor. Uso:
//   RAIZ=<repo> npx tsx juego/herramientas/t890_caras.mts <salida> [caras|manos|todo]
//   python3 juego/herramientas/t890_lamina.py <antes> <despues>     (láminas lado a lado en /tmp/requiem-pruebas/caras)
// RAIZ permite pintar el "antes" con el motor de otra copia del repo (por omisión, esta).
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encode } from 'fast-png';

const aqui = join(dirname(fileURLToPath(import.meta.url)), '../..');
const RAIZ = process.env.RAIZ ?? aqui;
const { personajeEscena, esqueleto } = await import(join(RAIZ, 'src/engine/gotico/cuerpo.ts'));
const { pintarEscena, aPantalla } = await import(join(RAIZ, 'src/engine/gotico/render.ts'));
const { nuevoHeroe, equipoVisual, cuerpoDe } = await import(join(RAIZ, 'juego/src/juego/heroe.ts'));
const { luzRetrato, conGrano } = await import(join(RAIZ, 'juego/hornear/luz_retrato.mts'));

// la luz del muñeco (copia de `iluminar` en juego/src/motor/muneco.ts, que no se puede importar sin navegador)
(globalThis as any).__relieve = true;
const nrm3 = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const LK = nrm3([-0.62, 0.62, 0.62]), LR = nrm3([0.85, -0.45, 0.3]), VV = [0, 0.866, 0.5], CALIDA = [1.0, 0.84, 0.62], FRIA = [0.62, 0.74, 1.0];
function iluminar(d: ArrayLike<number>, rel: ArrayLike<number> | undefined, w: number, h: number): Uint8ClampedArray {
  const o = new Uint8ClampedArray(d.length);
  const A = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = d[i + 3]; if (!a) continue;
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const ra = rel ? rel[i + 3] / 255 : 0, emite = ra > 0.38 && ra < 0.62;
    const bordeD = A(x + 1, y) === 0 || A(x + 1, y - 1) === 0, bordeI = A(x - 1, y) === 0 || A(x - 1, y - 1) === 0, bordeA = A(x, y - 1) === 0;
    let kk = 1, rim = 0, cal = 0;
    if (rel && ra >= 0.3 && !emite) {
      const n0 = rel[i] / 127.5 - 1, n1 = rel[i + 1] / 127.5 - 1, n2 = rel[i + 2] / 127.5 - 1;
      const n = nrm3([(n0 - n1) * 0.7071, (n0 + n1) * 0.7071, n2]);
      const dk = n[0] * LK[0] + n[1] * LK[1] + n[2] * LK[2], dr = n[0] * LR[0] + n[1] * LR[1] + n[2] * LR[2];
      const fr = 1 - Math.max(0, n[0] * VV[0] + n[1] * VV[1] + n[2] * VV[2]);
      kk = 0.8 + 0.42 * Math.max(0, dk) - 0.12 * Math.max(0, -dk); cal = Math.max(0, dk); rim = Math.max(0, dr) ** 1.4 * (0.25 + fr * 0.9);
    }
    if (!emite) { if (bordeD) rim = Math.max(rim, 0.55); else if (bordeA && x > w * 0.45) rim = Math.max(rim, 0.3); if (bordeI) cal = Math.max(cal, 0.7); }
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    r = r * kk * (1 + (CALIDA[0] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[0] * (0.4 + lum);
    g = g * kk * (1 + (CALIDA[1] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[1] * (0.4 + lum);
    b = b * kk * (1 + (CALIDA[2] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[2] * (0.4 + lum);
    const rk = rim * (0.22 + 0.5 * lum); r += FRIA[0] * rk; g += FRIA[1] * rk; b += FRIA[2] * rk;
    o[i] = Math.min(255, r * 255); o[i + 1] = Math.min(255, g * 255); o[i + 2] = Math.min(255, b * 255); o[i + 3] = a;
  }
  return o;
}
const conLuzM = (r: any) => ({ ...r, img: { w: r.img.w, h: r.img.h, data: iluminar(r.img.data, r.rel?.data, r.img.w, r.img.h) } });
const OUT = process.argv[2] ?? '/tmp/requiem-pruebas/caras/despues', QUE = process.argv[3] ?? 'todo';
mkdirSync(OUT, { recursive: true });
type R = { w: number; h: number; data: ArrayLike<number> };
const png = (f: string, r: R) => writeFileSync(f, encode({ width: r.w, height: r.h, data: new Uint8Array(r.data as any), channels: 4 }));
function recorte(img: R, cx: number, cy: number, rw: number, rh: number): R {
  const w = Math.round(rw * 2), h = Math.round(rh * 2), x0 = Math.round(cx - rw), y0 = Math.round(cy - rh), d = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const sx = x0 + x, sy = y0 + y; if (sx < 0 || sy < 0 || sx >= img.w || sy >= img.h) continue;
    for (let c = 0; c < 4; c++) d[(y * w + x) * 4 + c] = img.data[(sy * img.w + sx) * 4 + c];
  }
  return { w, h, data: d };
}
const CLASES = ['berserker', 'templario', 'arcanista', 'cazadora', 'nigromante', 'monje', 'druida', 'alquimista'];
const sujetos: { n: string; cu: any; eq: any }[] = [];
for (const c of CLASES) {
  const eq = JSON.parse(JSON.stringify(equipoVisual(nuevoHeroe(c, 'x')))); delete eq.cabeza;
  sujetos.push({ n: c, cu: cuerpoDe(c), eq });
}
// variantes: él y ella con otras pieles, pelos y barbas
const base = (c: string) => JSON.parse(JSON.stringify(sujetos.find((s) => s.n === c)!.eq));
sujetos.push({ n: 'templaria', cu: { ...cuerpoDe('templario'), genero: 'm', barba: undefined, peinado: 'largo', pelo: 'cu_pelo_negro', piel: 'cu_piel_morena' }, eq: base('templario') });
sujetos.push({ n: 'monje_anciano', cu: { ...cuerpoDe('monje'), piel: 'cu_piel_palida', peinado: 'calvo', barba: 'larga', pelo: 'cu_pelo_blanco' }, eq: base('monje') });
sujetos.push({ n: 'cazador', cu: { ...cuerpoDe('cazadora'), genero: 'h', barba: 'bigote', peinado: 'corto', pelo: 'cu_pelo_castano', piel: 'cu_piel_morena' }, eq: base('cazadora') });

const filas: any[] = [];
const t0 = Date.now(); let tGame = 0, nGame = 0, tDoll = 0, nDoll = 0, tRet = 0, nRet = 0;
function cabezaEn(cu: any, eq: any, dir: string, acc: string, f: number, r: any) {
  const e = esqueleto(cu, dir, acc, f, eq.arma?.tipo ?? 'nada', eq.izq?.tipo);
  const p = aPantalla(e.cab(1.0 * e.S, 0, e.cz - 0.6 * e.S));
  return [p[0] + r.ancla[0], p[1] + r.ancla[1]];
}
const SUJ = process.env.SUJ?.split(',');
if (QUE !== 'manos') for (const s of sujetos.filter((x) => !SUJ || SUJ.includes(x.n))) {
  const fila: any = { n: s.n, celdas: [] };
  // juego: K 1, de frente, tres cuartos y de lado
  for (const dir of ['s', 'so', 'o', 'se']) {
    const t = Date.now();
    const r = pintarEscena({ ...personajeEscena(s.cu, s.eq, dir, 'quieto', 0), sinSombra: true, ss: 1 });
    tGame += Date.now() - t; nGame++;
    const [cx, cy] = cabezaEn(s.cu, s.eq, dir, 'quieto', 0, r);
    const f = `${s.n}_juego_${dir}.png`; png(join(OUT, f), recorte(r.img, cx, cy, 11, 11)); png(join(OUT, `${s.n}_juego_${dir}_cuerpo.png`), r.img);
    fila.celdas.push({ f, esc: 'juego', dir });
  }
  // muñeco: K 2,1
  for (const dir of ['s', 'so']) {
    const cu = { ...s.cu, alto: (s.cu.alto ?? 1) * 2.1 }, t = Date.now();
    const r = conLuzM(pintarEscena({ ...personajeEscena(cu, s.eq, dir, 'quieto', 0), sinSombra: true, ss: 1 }));
    tDoll += Date.now() - t; nDoll++;
    const [cx, cy] = cabezaEn(cu, s.eq, dir, 'quieto', 0, r);
    const f = `${s.n}_muneco_${dir}.png`; png(join(OUT, f), recorte(r.img, cx, cy, 22, 22)); png(join(OUT, `${s.n}_muneco_${dir}_cuerpo.png`), r.img);
    fila.celdas.push({ f, esc: 'muneco', dir });
  }
  // retrato: 2,25 con la luz de la fogata, como obrero.mts (solo las 8 clases con su equipo de selección)
  {
    const k = 2.25, cu = { ...s.cu, alto: (s.cu.alto ?? 1) * k }, t = Date.now();
    const e = personajeEscena(cu, s.eq, 'so', 'presentar', 0, { detalle: 2 });
    const r = conGrano(1.5, () => pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...luzRetrato(k) }, resplandor: undefined, ss: 2, sinSombra: true }));
    tRet += Date.now() - t; nRet++;
    const [cx, cy] = cabezaEn(cu, s.eq, 'so', 'presentar', 0, r);
    const f = `${s.n}_retrato.png`; png(join(OUT, f), recorte(r.img, cx, cy, 24, 24)); png(join(OUT, `${s.n}_retrato_cuerpo.png`), r.img);
    fila.celdas.push({ f, esc: 'retrato', dir: 'so' });
  }
  filas.push(fila);
  console.log(s.n, ((Date.now() - t0) / 1000).toFixed(0) + 's');
}

// ---- manos
const manos: any[] = [];
if (QUE !== 'caras') {
  const cu0 = cuerpoDe('templario');
  const casos: { n: string; c: string; eq: (e: any) => void; acc?: string; f?: number; dir?: string }[] = [
    { n: 'vacia', c: 'arcanista', eq: (e) => { e.arma = { tipo: 'nada' }; delete e.izq; } },
    { n: 'vacia_conjuro', c: 'arcanista', eq: (e) => { e.arma = { tipo: 'nada' }; delete e.izq; }, acc: 'lanzar', f: 3 },
    { n: 'puno', c: 'monje', eq: (e) => { e.arma = { tipo: 'puno' }; } },
    { n: 'puno_golpe', c: 'monje', eq: (e) => { e.arma = { tipo: 'puno' }; }, acc: 'atacar', f: 3 },
    { n: 'espada', c: 'templario', eq: (e) => { e.arma = { tipo: 'espada', mat: 'cu_placa' }; } },
    { n: 'espada_golpe', c: 'templario', eq: (e) => { e.arma = { tipo: 'espada', mat: 'cu_placa' }; }, acc: 'atacar', f: 3 },
    { n: 'mandoble', c: 'berserker', eq: (e) => { e.arma = { tipo: 'mandoble', mat: 'cu_placa' }; delete e.izq; } },
    { n: 'hacha_doble_golpe', c: 'berserker', eq: (e) => { e.arma = { tipo: 'hacha_doble', mat: 'cu_placa', mango: 'madera' }; delete e.izq; }, acc: 'atacar', f: 2 },
    { n: 'lanza', c: 'templario', eq: (e) => { e.arma = { tipo: 'lanza', mat: 'cu_placa' }; delete e.izq; } },
    { n: 'baculo', c: 'nigromante', eq: (e) => { e.arma = { tipo: 'baculo', mat: 'madera' }; delete e.izq; } },
    { n: 'arco', c: 'cazadora', eq: (e) => { e.arma = { tipo: 'arco', mat: 'madera' }; delete e.izq; } },
    { n: 'arco_tira', c: 'cazadora', eq: (e) => { e.arma = { tipo: 'arco', mat: 'madera' }; delete e.izq; }, acc: 'atacar', f: 2 },
    { n: 'daga', c: 'alquimista', eq: (e) => { e.arma = { tipo: 'daga', mat: 'cu_placa' }; } },
    { n: 'escudo', c: 'templario', eq: (e) => { e.arma = { tipo: 'espada', mat: 'cu_placa' }; e.izq = { tipo: 'escudo_redondo', mat: 'madera', mat2: 'hierro' }; } },
    { n: 'guantes', c: 'cazadora', eq: (e) => { e.arma = { tipo: 'espada', mat: 'cu_placa' }; delete e.izq; e.manos = { tipo: 'guantes', mat: 'cu_cuero', ribete: 'cu_bronce_pieza' }; } },
    { n: 'guanteletes', c: 'templario', eq: (e) => { e.arma = { tipo: 'espada', mat: 'cu_placa' }; e.manos = { tipo: 'guanteletes', mat: 'cu_placa' }; } },
    { n: 'guanteletes_vacia', c: 'templario', eq: (e) => { e.arma = { tipo: 'nada' }; delete e.izq; e.manos = { tipo: 'guanteletes', mat: 'cu_placa' }; } },
    { n: 'vendas', c: 'monje', eq: (e) => { e.arma = { tipo: 'puno' }; e.manos = { tipo: 'vendas', mat: 'cu_tela_blanca' }; } },
    { n: 'brazales', c: 'berserker', eq: (e) => { e.arma = { tipo: 'hacha', mat: 'cu_placa', mango: 'madera' }; e.manos = { tipo: 'brazales', mat: 'cu_cuero' }; } },
  ];
  void cu0;
  const MAN = process.env.MAN?.split(',');
  for (const cs of casos.filter((x) => !MAN || MAN.includes(x.n))) {
    const eq = JSON.parse(JSON.stringify(equipoVisual(nuevoHeroe(cs.c, 'x')))); delete eq.cabeza; cs.eq(eq);
    const acc = cs.acc ?? 'quieto', f = cs.f ?? 0;
    const fila: any = { n: cs.n, celdas: [] };
    for (const [esc, K, dir] of [['muneco', 2.1, 's'], ['muneco', 2.1, 'so'], ['juego', 1, 's'], ['juego', 1, 'so'], ['retrato', 2.25, 'so']] as [string, number, string][]) {
      const cu = { ...cuerpoDe(cs.c), alto: (cuerpoDe(cs.c).alto ?? 1) * K };
      let r;
      if (esc === 'retrato') { const e = personajeEscena(cu, eq, dir, acc, f, { detalle: 2 }); r = conGrano(1.5, () => pintarEscena({ ...e, luz: { ...(e.luz ?? {}), ...luzRetrato(K) }, resplandor: undefined, ss: 2, sinSombra: true })); }
      else { r = pintarEscena({ ...personajeEscena(cu, eq, dir, acc, f), sinSombra: true, ss: 1 }); if (esc === 'muneco') r = conLuzM(r); }
      const e = esqueleto(cu, dir, acc, f, eq.arma?.tipo ?? 'nada', eq.izq?.tipo);
      for (const i of [0, 1]) {
        const p = aPantalla(e.brazos[i].mano), rw = 8 * K;
        const n = `mano_${cs.n}_${esc}_${dir}_${i ? 'izq' : 'der'}.png`;
        png(join(OUT, n), recorte(r.img, p[0] + r.ancla[0], p[1] + r.ancla[1], rw, rw));
        fila.celdas.push({ f: n, esc, dir, lado: i ? 'izq' : 'der' });
      }
      if (esc === 'muneco' && dir === 's') png(join(OUT, `mano_${cs.n}_cuerpo.png`), r.img);
    }
    manos.push(fila);
  }
}
writeFileSync(join(OUT, 'filas.json'), JSON.stringify({ caras: filas, manos, tiempos: { juego: nGame ? tGame / nGame : 0, muneco: nDoll ? tDoll / nDoll : 0, retrato: nRet ? tRet / nRet : 0 } }));
console.log(OUT, 'juego', (tGame / Math.max(1, nGame)).toFixed(0), 'ms', 'muneco', (tDoll / Math.max(1, nDoll)).toFixed(0), 'ms', 'retrato', (tRet / Math.max(1, nRet)).toFixed(0), 'ms');
