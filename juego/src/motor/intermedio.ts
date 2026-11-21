// Un cuadro entre dos cuadros pintados (la vigilia, motor/vigilia.ts): en vez de pintar los 24 cuadros del reposo que
// caen entre sus claves (1,5 s cada uno en un núcleo), se arman de las dos claves siguiendo el movimiento de cada punto.
//
// Para cada punto se busca el corrimiento D (de -2R a 2R en cada eje) que mejor casa la clave de antes, tomada S del
// corrimiento atrás, con la de después, 1 - S adelante (comparando un parche de 3 x 3: color, alfa y, si lo hay, el alto).
// Gana el que menos difiere, con un castigo chico por moverse (lo quieto se queda quieto), y el campo pasa por una mediana
// de 3 x 3 (sin saltos sueltos). El punto NO es el promedio de las dos muestras (el grano fino se lavaba y el cuadro salía
// blando, se veía en la lámina): sale entero de una de las dos, con un dado fijo por punto que elige la de después con
// probabilidad S. Así queda pixel art, con el grano de las dos claves. Donde una tiene figura y la otra no (el borde que se
// corre), lo mismo: la silueta sigue de pixel, sin bordes a medias. `falla` dice cuánto no casó (vigilia.ts lo pinta si
// pasa de 0,04).
// El relieve (normales) y el alto se arman con el mismo corrimiento. Sin DOM: corre en el obrero.

/** Un dado por punto (fijo): de cuál de los dos vecinos sale el punto, sin trama que se lea. */
const azar = (x: number, y: number) => { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export interface CrudoI { w: number; h: number; ax: number; ay: number; data: Uint8ClampedArray; rel?: Uint8ClampedArray; alt?: Uint8ClampedArray; hoja?: number[];
  /** cuánto no casaron los dos vecinos (0 a 1): la parte de la figura donde solo uno tenía algo, más el color que no casó */
  falla?: number }

/** R: el corrimiento más grande que se busca entre los dos vecinos (en puntos del cuadro). */
export function intermedio(A: CrudoI, B: CrudoI, R = 3, modo: 'prom' | 'mezcla' | 'antes' = 'mezcla', S = 0.5): CrudoI {
  // (S: dónde cae entre los dos, de 0 el de antes a 1 el de después; el corrimiento D se reparte S atrás y 1 - S adelante)
  const sa = (d: number) => Math.round(S * d);
  // el lienzo común: alineados por el ancla, con R de margen
  const L = Math.max(A.ax, B.ax) + R, T = Math.max(A.ay, B.ay) + R;
  const W = L + Math.max(A.w - A.ax, B.w - B.ax) + R, H = T + Math.max(A.h - A.ay, B.h - B.ay) + R;
  const oxA = L - A.ax, oyA = T - A.ay, oxB = L - B.ax, oyB = T - B.ay;
  const N = W * H;
  // los dos en el lienzo común (RGBA), y el alto (si viene) en un canal aparte para la comparación
  const pon = (C: CrudoI, ox: number, oy: number, src: Uint8ClampedArray | undefined) => {
    const o = new Uint8ClampedArray(N * 4); if (!src) return o;
    for (let y = 0; y < C.h; y++) o.set(src.subarray(y * C.w * 4, (y + 1) * C.w * 4), ((y + oy) * W + ox) * 4);
    return o;
  };
  const a = pon(A, oxA, oyA, A.data), b = pon(B, oxB, oyB, B.data);
  const aR = A.rel && B.rel ? pon(A, oxA, oyA, A.rel) : null, bR = aR ? pon(B, oxB, oyB, B.rel) : null;
  const aH = A.alt && B.alt ? pon(A, oxA, oyA, A.alt) : null, bH = aH ? pon(B, oxB, oyB, B.alt) : null;
  // dónde hace falta buscar: lo que tiene figura en alguno de los dos, ensanchado R
  const hay = new Uint8Array(N);
  for (let i = 0; i < N; i++) if (a[i * 4 + 3] || b[i * 4 + 3]) hay[i] = 1;
  const zona = new Uint8Array(N);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (hay[y * W + x]) {
    for (let dy = -R; dy <= R; dy++) { const yy = y + dy; if (yy < 0 || yy >= H) continue; const f = yy * W; for (let dx = -R; dx <= R; dx++) { const xx = x + dx; if (xx >= 0 && xx < W) zona[f + xx] = 1; } }
  }
  const idxL: number[] = []; for (let i = 0; i < N; i++) if (zona[i]) idxL.push(i);
  const M = idxL.length, idx = Int32Array.from(idxL), xs = new Int32Array(M), ys = new Int32Array(M);
  for (let k = 0; k < M; k++) { xs[k] = idx[k] % W; ys[k] = (idx[k] / W) | 0; }
  // diferencia de un punto con un corrimiento: el de antes en x - ⌊D/2⌋, el de después en x + ⌈D/2⌉
  const dif = new Float32Array(N), caja = new Float32Array(N);
  const mejor = new Float32Array(M).fill(Infinity), mDx = new Int8Array(M), mDy = new Int8Array(M);
  const costo = (i: number, ia: number, ib: number) => {
    const pa = ia * 4, pb = ib * 4, al = a[pa + 3], bl = b[pb + 3];
    if (!al && !bl) return 0;
    let s = Math.abs(al - bl) * 1.5;
    s += Math.abs(a[pa] - b[pb]) + Math.abs(a[pa + 1] - b[pb + 1]) + Math.abs(a[pa + 2] - b[pb + 2]);
    if (aH && bH) s += Math.abs(aH[pa] - bH[pb]) * 0.5;
    void i; return s;
  };
  const D = 2 * R;
  for (let dy = -D; dy <= D; dy++) for (let dx = -D; dx <= D; dx++) {
    const ax0 = -sa(dx), ay0 = -sa(dy), bx0 = dx - sa(dx), by0 = dy - sa(dy);
    for (let k = 0; k < M; k++) {
      const i = idx[k], x = xs[k], y = ys[k];
      const xa = x + ax0, ya = y + ay0, xb = x + bx0, yb = y + by0;
      dif[i] = xa < 0 || ya < 0 || xa >= W || ya >= H || xb < 0 || yb < 0 || xb >= W || yb >= H ? 2000 : costo(i, ya * W + xa, yb * W + xb);
    }
    // parche de 3 x 3 (la suma de la caja)
    for (let k = 0; k < M; k++) {
      const i = idx[k], x = xs[k], y = ys[k]; let s = 0;
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) { const u = i - W, d = i + W; s = dif[u - 1] + dif[u] + dif[u + 1] + dif[i - 1] + dif[i] + dif[i + 1] + dif[d - 1] + dif[d] + dif[d + 1]; }
      else for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) s += dif[yy * W + xx];
      caja[i] = s + (Math.abs(dx) + Math.abs(dy)) * 6;
    }
    for (let k = 0; k < M; k++) { const c = caja[idx[k]]; if (c < mejor[k]) { mejor[k] = c; mDx[k] = dx; mDy[k] = dy; } }
  }
  // el campo parejo: cada punto toma la mediana de su corrimiento y el de sus vecinos (quita los saltos sueltos)
  const fx = new Int8Array(N), fy = new Int8Array(N);
  for (let k = 0; k < M; k++) { fx[idx[k]] = mDx[k]; fy[idx[k]] = mDy[k]; }
  const gx = new Int8Array(N), gy = new Int8Array(N), vx: number[] = [], vy: number[] = [];
  for (let k = 0; k < M; k++) {
    const i = idx[k], x = i % W, y = (i / W) | 0; vx.length = 0; vy.length = 0;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++) for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) { const j = yy * W + xx; if (zona[j]) { vx.push(fx[j]); vy.push(fy[j]); } }
    vx.sort((p, q) => p - q); vy.sort((p, q) => p - q);
    gx[i] = vx[vx.length >> 1]; gy[i] = vy[vy.length >> 1];
  }
  // el cuadro del medio
  const o = new Uint8ClampedArray(N * 4), oR = aR ? new Uint8ClampedArray(N * 4) : null, oH = aH ? new Uint8ClampedArray(N * 4) : null;
  let fig = 0, solo = 0, raro = 0;
  for (let k = 0; k < M; k++) {
    const i = idx[k], x = xs[k], y = ys[k], dx = gx[i], dy = gy[i];
    const xa = Math.min(W - 1, Math.max(0, x - sa(dx))), ya = Math.min(H - 1, Math.max(0, y - sa(dy)));
    const xb = Math.min(W - 1, Math.max(0, x + dx - sa(dx))), yb = Math.min(H - 1, Math.max(0, y + dy - sa(dy)));
    const pa = (ya * W + xa) * 4, pb = (yb * W + xb) * 4, po = i * 4;
    const al = a[pa + 3], bl = b[pb + 3];
    if (!al && !bl) continue;
    fig++; if (!al || !bl) solo++; else { const dc = (Math.abs(a[pa] - b[pb]) + Math.abs(a[pa + 1] - b[pb + 1]) + Math.abs(a[pa + 2] - b[pb + 2])) / 3; if (dc > 40) raro++; }
    // las dos con figura: el promedio; una sola: en damero (la silueta queda entera de pixel)
    let u = 0.5;
    if (!al || !bl) { const deA = azar(x + 7, y + 3) >= S; if (deA ? !al : !bl) continue; u = deA ? 0 : 1; }
    else if (modo === 'antes') u = 0;
    else if (modo === 'mezcla') u = azar(x, y) < S ? 1 : 0;
    else if (modo === 'prom') u = S;
    for (let c = 0; c < 4; c++) o[po + c] = a[pa + c] * (1 - u) + b[pb + c] * u + 0.5;
    if (oR && aR && bR) for (let c = 0; c < 4; c++) oR[po + c] = (u === 0.5 && c === 3) ? (al >= bl ? aR[pa + 3] : bR[pb + 3]) : aR[pa + c] * (1 - u) + bR[pb + c] * u + 0.5;
    if (oH && aH && bH) for (let c = 0; c < 4; c++) oH[po + c] = aH[pa + c] * (1 - u) + bH[pb + c] * u + 0.5;
  }
  // recortado a lo que tiene algo
  let x0 = W, y0 = H, x1 = -1, y1 = -1;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (o[(y * W + x) * 4 + 3]) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) { x0 = y0 = 0; x1 = y1 = 0; }
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const corta = (s: Uint8ClampedArray | null) => { if (!s) return undefined; const q = new Uint8ClampedArray(w * h * 4); for (let y = 0; y < h; y++) q.set(s.subarray(((y0 + y) * W + x0) * 4, ((y0 + y) * W + x1 + 1) * 4), y * w * 4); return q; };
  return { w, h, ax: L - x0, ay: T - y0, data: corta(o)!, rel: corta(oR), alt: corta(oH), falla: fig ? (solo + raro * 0.5) / fig : 0 };
}
