// El cierre del acto 2, «Su sombra no lo esperó» (unos 65 s): Khamer-Ul vuelve al polvo en su cámara, su sombra se despega del
// piso y se va con la brasa, la brasa cruza el Templo del Sol hacia el este, Oyá suelta las amarras con el héroe y Thor a bordo,
// algo pálido camina sobre el agua detrás de la barca, y en Yhuantl los tambores empiezan a sonar solos. Cartel del acto 3.
// Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { cuadrosMonstruo, cuadrosHeroe, dibujar } from '../motor/assets';
import { lienzoTrabajo } from '../motor/lienzos';
import { MONSTRUOS } from '../datos/monstruos';
import { cuadrosVivos } from '../motor/pintor';
import { estallido } from '../render/brasa_cine';
import type { Guion, Toma, Texto, EstadoToma } from './director';
import { linea, VIOLETA, anclaJefe, anclaSalida, anclaAgua, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, siluetaEnPiso } from './cine_kit';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(2, n, t0, t1, o);

// ------------------------------------------------------------------ la arena y la sombra
/** La arena que se escurre de un cuerpo que se deshace: granos que caen y se amontonan. */
function arena(e: EstadoToma, x: number, y: number, n: number) {
  const j = e.j; if (!j) return;
  for (let i = 0; i < n; i++) j.particulas.push({ x: e.ax + x + (Math.random() - 0.5) * 1.2, y: e.ay + y + (Math.random() - 0.5) * 1.2, z: 20 + Math.random() * 110, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, vz: -10 - Math.random() * 30, t: 0, dur: 1.4 + Math.random() * 1.2, color: Math.random() < 0.5 ? '#c8a868' : '#9a7c48', tam: 1 + Math.random(), grav: 120, tipo: 'ceniza' } as any);
}
/** Por dónde va la sombra del rey a los tl segundos (relativo al ancla) y cuánto se despegó del piso (0 a 1). */
const CAMINO_SOMBRA: [number, number, number][] = [[1.6, 0, 0], [3.0, 0.9, -0.3], [4.6, 2.2, -0.5], [6.2, 3.4, 1.4], [8.6, 7.5, 7.0]];
function sombraEn(tl: number): [number, number, number] | null {
  if (tl < CAMINO_SOMBRA[0][0] || tl > CAMINO_SOMBRA[CAMINO_SOMBRA.length - 1][0]) return null;
  for (let i = 1; i < CAMINO_SOMBRA.length; i++) if (tl <= CAMINO_SOMBRA[i][0]) { const [t0, x0, y0] = CAMINO_SOMBRA[i - 1], [t1, x1, y1] = CAMINO_SOMBRA[i], k = (tl - t0) / (t1 - t0), s = k * k * (3 - 2 * k); return [x0 + (x1 - x0) * s, y0 + (y1 - y0) * s, Math.min(1, (tl - CAMINO_SOMBRA[0][0]) / 1.4)]; }
  return null;
}
/**
 * La silueta de la sombra del rey: su cuadro de frente en negro, sin la arena suelta de los pies, con los brazos abiertos y largos
 * (dos trazos que salen de los hombros y se afinan, con tres dedos) que se mueven despacio, tanteando.
 */
function siluetaRey(q: any, tl: number): { cv: HTMLCanvasElement; w: number; h: number; ax: number; ay: number } | null {
  if (q && !q.img) dibujar(lienzoTrabajo(4, 4).c, q, -999, -999); // (lo carga del atlas si todavía no se pintó)
  if (!q?.img) return null;
  const pad = 70, w = q.w + pad * 2, h = q.h + 10, ax = q.ax + pad, ay = q.ay;
  const { cv, c } = lienzoTrabajo(w, h);
  c.globalCompositeOperation = 'copy'; c.drawImage(q.img, q.x, q.y, q.w, q.h, pad, 0, q.w, q.h);
  c.globalCompositeOperation = 'source-over'; c.clearRect(0, ay - 5, w, h); // (sin la arena regada a los pies)
  c.fillStyle = '#000'; c.strokeStyle = '#000'; c.lineCap = 'round';
  const hy = ay - q.ay * 0.76, sh = q.w * 0.17;
  for (const sx of [-1, 1]) {
    const tt = Math.sin(tl * 1.6 + sx) * 6;
    const x0 = ax + sx * sh, x1 = ax + sx * (sh + 30), y1 = hy - 8 + tt, x2 = ax + sx * (sh + 58), y2 = hy - 22 + tt * 1.5;
    c.lineWidth = 7; c.beginPath(); c.moveTo(x0, hy); c.lineTo(x1, y1); c.stroke();
    c.lineWidth = 4; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke();
    for (const f of [-1, 0, 1]) { c.lineWidth = 2; c.beginPath(); c.moveTo(x2, y2); c.lineTo(x2 + sx * 9, y2 - 5 + f * 5); c.stroke(); }
  }
  // todo negro
  c.globalCompositeOperation = 'source-atop'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
  return { cv, w, h, ax, ay };
}
/** La sombra de Khamer-Ul que se arrastra sola (y la del héroe, que tiembla hacia ella cuando le pasa por los pies). */
function sombras(e: EstadoToma, tl: number) {
  const p = sombraEn(tl); if (!p) return;
  // (el rey de frente, quieto: la corona entera; los brazos los estira la sombra, largos, como dedos que tantean el piso)
  const [x, y, k] = p, q: any = cuadrosMonstruo('jefe_rey_sin_sombra', 'quieto', 's')[0];
  const [px, py] = aPant(e.ax + x, e.ay + y);
  const fin = Math.max(0, (8.6 - tl) / 0.8);
  const sil = siluetaRey(q, tl); if (!sil) return;
  // echada hacia donde va (abajo a la derecha en pantalla): se arrastra con la corona por delante, larga
  ctx.save(); ctx.globalAlpha = 0.97 * Math.min(1, fin); ctx.translate(Math.round(px), Math.round(py));
  ctx.transform(1, 0, -(1.15 * k + Math.sin(tl * 3) * 0.05), -0.62 * k - 0.05, 0, 0);
  ctx.drawImage(sil.cv, 0, 0, sil.w, sil.h, -sil.ax, -sil.ay, sil.w, sil.h); ctx.restore();
  // la del héroe: cuando la del rey le roza los pies, la suya tiembla y se estira hacia ella
  const h = e.actores.get('heroe') as any; if (!h) return;
  const d = Math.hypot(e.ax + x - h.x, e.ay + y - h.y);
  if (d < 2.6) {
    const kk = 1 - d / 2.6, qh = cuadrosVivos('quieto', h.dir)?.[0] ?? cuadrosHeroe(e.heroe.clase, 'quieto', h.dir)[0];
    const [hx, hy] = aPant(h.x, h.y), tiembla = Math.sin(tl * 40) * 0.12 * kk;
    const dx = (e.ax + x - h.x - (e.ay + y - h.y)) / Math.max(0.5, d), dy = 0.3;
    siluetaEnPiso(qh, hx, hy, (0.55 + tiembla) * Math.sign(dx || 1), -dy - tiembla, 0.45 * kk);
  }
}

// ------------------------------------------------------------------ la barca
/** La variante de `cine_barca` (catalogo/cine.ts) cuya proa mira a ese rumbo. */
const VARIANTE_RUMBO: [number, number, string][] = [[1, -1, 'h'], [-1, 1, 'h2'], [1, 1, 'd'], [-1, -1, 'd2'], [1, 0, 'x'], [-1, 0, 'x2'], [0, 1, 'y'], [0, -1, 'y2']];
/**
 * La barca de Oyá en el agua del ancla y el rumbo del canal: de los que se alejan de la orilla (+y), el de más agua seguida (lo
 * ancho de la pantalla, x = -y, le sienta mejor). Deja en `mem` el rumbo y pone las claves de los que suben (relativas al rumbo).
 */
function ponerBarca(e: EstadoToma) {
  const z = e.z; if (!z) return;
  const agua = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return /a3_agua_negra/.test(z.pisos[ty * z.tw + tx]?.id ?? ''); };
  // (de costado: la proa a la derecha de la pantalla; anclaMuelle eligió un canal que corre así)
  const rumbo: [number, number] = [Math.SQRT1_2, -Math.SQRT1_2], v = 'h'; void agua;
  // (el canal por donde se va, libre: nada del manglar le cae encima a la barca)
  const [rx, ry] = rumbo;
  z.objetos = z.objetos.filter((o) => { if (o.tag || /muro|hito/.test(o.id)) return true; const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay, k = Math.max(-3, Math.min(8, dx * rx + dy * ry)); return Math.hypot(dx - rx * k, dy - ry * k) > 4 + Math.max(o.hw ?? 0, o.hh ?? 0); });
  const o: any = { id: 'cine_barca', v, cx: e.ax - 0.5, cy: e.ay - 0.5, hw: 1, hh: 1, bloquea: false, capa: 'cine' };
  z.objetos.push(o); e.mem.barca = o; e.mem.rumbo = rumbo;
  // los asientos: Oyá en la popa, el héroe en el medio y Thor a proa, junto al farol
  const en = (k: number, lado = 0): [number, number] => [rx * k - ry * lado, ry * k + rx * lado];
  const [ox, oy] = en(-1.9), [hx, hy] = en(-0.35, 0.05), [tx, ty] = en(0.95, -0.05);
  const proa: [number, number] = [rx * 2.7, ry * 2.7];
  const tm = e.toma as any;
  for (const a of tm.actores) {
    if (a.id === 'oya') a.claves = [{ t: 0, x: ox, y: oy, mira: [0.6, 4.5] }, { t: 3.9, mira: [ox + rx * 4, oy + ry * 4] }];
    if (a.id === 'heroe') a.claves = [{ t: 0, x: hx + 3.6, y: hy + 3.6 }, { t: 2.3, x: hx + 1.1, y: hy + 1.1, c: 'lineal' }, { t: 3.3, x: hx, y: hy, c: 'sale' }, { t: 3.4, mira: [proa[0] * 3, proa[1] * 3] }];
    if (a.id === 'thor') a.claves = [{ t: 0.3, x: tx + 3.8, y: ty + 3.4 }, { t: 2.7, x: tx + 1.2, y: ty + 1.1, c: 'lineal' }, { t: 3.7, x: tx, y: ty, c: 'sale' }, { t: 3.8, mira: [proa[0] * 3, proa[1] * 3] }];
  }
  const d10 = deriva(10);
  tm.cam = [{ t: 0, x: 1.3, y: 1.3, alt: 30, zoom: 3, fy: 0.52 }, { t: 3.6, x: 0.1, y: 0.4, alt: 28, c: 'suave' }, { t: 5.6, x: 0, y: 0.2, alt: 28, c: 'suave' }, { t: 10, x: rx * d10 * 0.8, y: ry * d10 * 0.8 + 0.2, alt: 30, c: 'entra' }];
  e.mem.proa = proa;
}
/** Lo que se corrió la barca a los tl segundos (arranca despacio cuando Oyá suelta las amarras). */
const deriva = (tl: number) => (tl < 5.6 ? 0 : tl < 6.6 ? 0.45 * (tl - 5.6) ** 2 : 0.45 + 0.9 * (tl - 6.6));
/** La barca, los que van en ella y el farol de proa, corridos por el canal (después de que el director los puso en su clave). */
function moverBarca(e: EstadoToma, tl: number) {
  const o = e.mem.barca; if (!o) return; const [rx, ry] = e.mem.rumbo, d = deriva(tl), mece = Math.sin(tl * 1.7) * 0.03;
  o.cx = e.ax - 0.5 + rx * d; o.cy = e.ay - 0.5 + ry * d + mece;
  const f = ((e.j as any)?.lucesCine as any[] | undefined)?.find((l) => l.id === 'farol');
  if (f) { f.x = e.ax + e.mem.proa[0] + rx * d; f.y = e.ay + e.mem.proa[1] + ry * d; }
  if (tl < 5.6) return;
  for (const id of ['oya', 'heroe', 'thor']) { const m = e.actores.get(id) as any; if (!m) continue; m.x += rx * d; m.y += ry * d + mece; }
}
/** El agua alrededor de la barca: los anillos del remo de Oyá, la estela y el farol que se refleja temblando. */
function aguaBarca(e: EstadoToma, tl: number) {
  const o = e.mem.barca; if (!o) return; const [rx, ry] = e.mem.rumbo, d = deriva(tl), cx = o.cx + 0.5, cy = o.cy + 0.5;
  ctx.save();
  // el reflejo del farol: rayitas tibias que tiemblan bajo la proa
  const [fx, fy] = aPant(e.ax + e.mem.proa[0] + rx * d, e.ay + e.mem.proa[1] + ry * d);
  for (let k = 0; k < 9; k++) { const w = 3 + Math.sin(tl * 5 + k * 1.7) * 2 + (k % 3), yy = fy + 4 + k * 3; ctx.globalAlpha = 0.55 * (1 - k / 9); ctx.fillStyle = k < 3 ? '#ffd9a0' : '#e0904a'; ctx.fillRect(Math.round(fx - w / 2 + Math.sin(tl * 3 + k) * 1.5), Math.round(yy), Math.round(w), 1); }
  // los anillos de la pala (Oyá rema desde que suelta: uno por palada, de un lado y del otro)
  ctx.strokeStyle = '#a9b8b4'; ctx.lineWidth = 1;
  if (tl > 5.6) for (let i = 0; i < 6; i++) {
    const t0 = 5.6 + Math.floor((tl - 5.6) / 1.1 - i) * 1.1; if (t0 < 5.6) continue; const u = (tl - t0) / 2.2; if (u > 1) continue;
    const lado = Math.round((t0 - 5.6) / 1.1) % 2 ? 1 : -1, d0 = deriva(t0);
    const [px, py] = aPant(e.ax + rx * (d0 - 1.4) - ry * lado * 0.75, e.ay + ry * (d0 - 1.4) + rx * lado * 0.75);
    ctx.globalAlpha = 0.7 * (1 - u); ctx.beginPath(); ctx.ellipse(Math.round(px), Math.round(py), 3 + u * 16, 1.5 + u * 8, 0, 0, Math.PI * 2); ctx.stroke();
  }
  // la estela: dos líneas que se abren detrás de la popa mientras anda
  if (d > 0.05) for (const lado of [-1, 1]) {
    ctx.beginPath(); ctx.globalAlpha = 0.22;
    for (let k = 0; k <= 10; k++) { const b = 1.3 + k * 0.35, w = 0.35 + k * 0.12; const [px, py] = aPant(cx - rx * b - ry * lado * w, cy - ry * b + rx * lado * w + Math.sin(tl * 4 + k) * 0.04); k ? ctx.lineTo(Math.round(px), Math.round(py)) : ctx.moveTo(Math.round(px), Math.round(py)); }
    ctx.stroke();
  }
  ctx.restore();
}


/**
 * El muelle: un tramo de canal que corre a lo ancho de la pantalla (x = -y), de donde se va la barca de costado (la proa a la
 * derecha), con la orilla delante (hacia la cámara, +x +y) a 3 a 5 celdas, de donde suben el héroe y Thor.
 */
function anclaMuelle(z: any): [number, number] {
  const agua = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && /a3_agua_negra/.test(z.pisos[ty * z.tw + tx]?.id ?? ''); };
  const tierra = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && !!z.pisos[ty * z.tw + tx] && !agua(x, y); };
  let mejor: [number, number] | null = null, nota = -1;
  for (let y = 8; y < z.H - 8; y++) for (let x = 8; x < z.W - 8; x++) {
    let ok = true, n = 0;
    for (let k = -3; k <= 8 && ok; k++) { if (!agua(x + k * 0.7, y - k * 0.7)) ok = false; if (agua(x + k * 0.7 - 1, y - k * 0.7 - 1)) n++; }
    if (!ok) continue;
    let orilla = 0; for (let d = 2; d <= 5; d++) if (tierra(x + d * 0.7, y + d * 0.7)) { orilla = 12 - d; break; }
    if (!orilla) continue;
    if (n + orilla > nota) { nota = n + orilla; mejor = [x, y]; }
  }
  return mejor ?? anclaAgua(/a3_agua_negra/)(z);
}
/**
 * Donde Vesperio camina sobre el agua: un tramo de agua negra que corre a lo largo de x por donde va (de +4,6 a -0,6 del ancla)
 * con agua también a los lados (no una orilla de adoquín). Se mira celda a celda.
 */
function anclaCanal(z: any): [number, number] {
  const agua = (x: number, y: number) => { const tx = Math.floor(x / 5), ty = Math.floor(y / 5); return tx >= 0 && ty >= 0 && tx < z.tw && ty < z.th && /a3_agua_negra/.test(z.pisos[ty * z.tw + tx]?.id ?? ''); };
  let mejor: [number, number] | null = null, nota = -1;
  for (let y = 6; y < z.H - 6; y += 1) for (let x = 6; x < z.W - 10; x += 1) {
    let n = 0, ok = true;
    for (let dx = -2; dx <= 6 && ok; dx++) { if (!agua(x + dx, y)) ok = false; for (const dy of [-2, -1, 1, 2]) if (agua(x + dx, y + dy)) n++; }
    if (!ok) continue;
    for (let dy = -5; dy <= 3; dy++) for (const dx of [-3, 0, 3, 6]) if (agua(x + dx, y + dy)) n += 0.5;
    if (n > nota) { nota = n; mejor = [x, y]; }
  }
  return mejor ?? anclaAgua(/a3_agua_negra/, false)(z);
}

/**
 * Vesperio sobre el agua negra: su luz violeta que se abre en el agua, su silueta invertida temblando debajo de los pies (en tiras
 * de dos puntos corridas por una onda, apagada y violeta) y los anillos que deja cada paso, bien visibles.
 */
function reflejoVesperio(e: EstadoToma, tl: number) {
  const m = e.actores.get('vesperio') as any; if (!m) return;
  const [px, py] = aPant(m.x, m.y), X = Math.round(px), Y = Math.round(py);
  ctx.save();
  // la luz en el agua: un óvalo violeta sumado, más claro bajo él
  const g = ctx.createRadialGradient(X, Y + 6, 2, X, Y + 6, 70); g.addColorStop(0, 'rgba(170,120,230,0.38)'); g.addColorStop(0.5, 'rgba(110,70,170,0.14)'); g.addColorStop(1, 'rgba(60,30,100,0)');
  // (solo en el agua: del pie para abajo, que encima de él lo lavaba)
  ctx.save(); ctx.beginPath(); ctx.rect(X - 120, Y - 1, 240, 80); ctx.clip();
  ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(X, Y + 4, 70, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  ctx.globalCompositeOperation = 'source-over';
  // la silueta invertida: el cuadro de caminar, volteado, en tiras que tiemblan
  const sp = MONSTRUOS.heraldo?.sprite, fr = sp ? cuadrosMonstruo(sp, 'caminar', m.dir ?? 'o') : [];
  const q: any = fr.length ? fr[Math.floor(tl * 9) % fr.length] : null;
  if (q && !(window as any).__sinReflejo) {
    if (!q.img) dibujar(lienzoTrabajo(4, 4).c, q, -999, -999);
  }
  if (q?.img && !(window as any).__sinReflejo) {
    const { cv, c } = lienzoTrabajo(q.w, q.h);
    c.globalCompositeOperation = 'copy'; c.drawImage(q.img, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h);
    c.globalCompositeOperation = 'source-atop'; c.globalAlpha = 0.55; c.fillStyle = '#6a4c9a'; c.fillRect(0, 0, q.w, q.h); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
    for (let yy = 0; yy < q.h; yy += 2) {
      const src = q.ay - yy - 2; if (src < 0) break; // de los pies hacia arriba
      const k = yy / q.ay, off = Math.round(Math.sin(tl * 3.2 + yy * 0.35) * (1 + 2.5 * k));
      ctx.globalAlpha = 0.6 * (1 - k * 0.8);
      const E = MONSTRUOS.heraldo?.escala ?? 1; ctx.drawImage(cv, 0, src, q.w, 2, Math.round(X - q.ax * E + off), Math.round(Y + yy * E + 1), Math.round(q.w * E), Math.ceil(2 * E));
    }
  }
  // los anillos de cada paso
  ctx.strokeStyle = '#c8b8f0'; ctx.lineWidth = 1;
  for (let k = 0; k < 4; k++) { const u = (tl * 1.1 + k / 4) % 1, [rx, ry] = aPant(m.x + 0.55 * (1 - u) + 0.2, m.y + 0.1); ctx.globalAlpha = 0.9 * (1 - u) ** 1.3; ctx.beginPath(); ctx.ellipse(Math.round(rx), Math.round(ry), 3 + u * 26, 1.5 + u * 12, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

/** Sin lluvia en esta toma (la zona es la misma de la toma que sigue: guarda la de antes). */
const sinLluvia = (e: EstadoToma) => { const z: any = e.z; if (!z) return; if (z.lluvia0 === undefined) z.lluvia0 = z.lluvia; z.lluvia = false; };

// ------------------------------------------------------------------ el guion
const tomas: Toma[] = [
  {
    // la cámara del rey: Khamer-Ul de rodillas ante su estatua; el golpe corta a ×3 y el cuerpo se deshace en arena
    id: 'camara', dur: 10, zona: 'a2_tumbas2', ancla: anclaJefe, entra: 1.6, sale: 0.4, oscuridad: 0.82, hundir: 0.6,
    cam: [{ t: 0, x: 2.9, y: 1.2, alt: 50, zoom: 2, fy: 0.5 }, { t: 3.05, x: 1.8, y: 0.4, alt: 56, c: 'suave' }, { t: 3.06, x: 0.9, y: -0.5, alt: 62, zoom: 3, fy: 0.5 }, { t: 9.6, x: 0.7, y: -0.4, alt: 40, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_sin_sombra', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.6, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.42 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.6, y: -0.4, mira: [0, 0] }, { t: 2.2, x: 3.6, y: -0.4 }, { t: 3.0, x: 2.3, y: -0.9, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.2, y: 1.6, mira: [0, 0] }, { t: 1.3, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.2, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'rey', z: 80, r: 200 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'oro', color: [255, 190, 90], sombra: true, titila: 0.1, claves: [{ t: 0, x: -2, y: 3, z: 50, r: 240, k: 0.55 }] },
      { id: 'frio', color: [120, 110, 170], sombra: true, claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.45 }] },
    ],
    sonidos: [{ t: 0, id: 'desierto', cine: true }, { t: 1.3, id: 'grunido', vol: 0.7 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.94 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.2, id: 'arena_cae', cine: true }, { t: 5.5, id: 'golpe', cine: true }, { t: 5.5, id: 'sub', cine: true }],
    temblores: [[5.5, 0.5, 3]],
    paso: (e, tl, dt) => { if (tl > 4.4 && tl < 8.5 && Math.random() < dt * 30) arena(e, 0.1, 0.1, 3); },
    textos: [L(0, 6.0, 9.7)],
  },
  {
    // la sombra: se despega del montón de arena y se arrastra hacia la salida; le roza los pies al héroe, la suya tiembla hacia
    // ella y el héroe se da vuelta a mirarla. La brasa sube del pecho y la sigue
    id: 'sombra', dur: 9.5, zona: 'a2_tumbas2', ancla: anclaJefe, entra: 0.25, sale: 0.6, oscuridad: 0.88, hundir: 0.66,
    // (delante de la cámara: nada que tape a la sombra cuando sale; la sala queda atrás)
    preparar: (e) => { despejarPies(e, 3.5, 3.5, 3.2); if (e.z) e.z.objetos = e.z.objetos.filter((o) => { const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay; return o.tag || /muro/.test(o.id) || dx + dy < 5 || Math.hypot(dx, dy) > 17; }); },
    cam: [{ t: 0, x: 1.4, y: 0.2, alt: 26, zoom: 3, fy: 0.5 }, { t: 5, x: 2.6, y: 1.0, alt: 30, c: 'suave' }, { t: 9.5, x: 4.4, y: 3.6, alt: 40, c: 'suave' }],
    actores: [
      { id: 'rey', tipo: 'mon', mon: 'rey_sin_sombra', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.3, y: -0.9, mira: [0, 0] }, { t: 3.2, mira: [1.0, -0.3] }, { t: 4.4, mira: [2.4, 0.4] }, { t: 5.4, mira: [3.4, 1.8] }, { t: 6.0, mira: [5.0, 4.0] }, { t: 6.4, x: 2.3, y: -0.9 }, { t: 7.4, x: 3.1, y: -0.2, c: 'suave' }, { t: 7.5, mira: [7, 6.5] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 0.6, y: 2.4, mira: [0, 0] }, { t: 3.6, acc: 'especial', dur: 0.9, mira: [2.2, -0.5] }, { t: 4.5, acc: 'quieto', mira: [4, 2.5] }, { t: 5.2, x: 0.6, y: 2.4 }, { t: 6.4, x: 0.2, y: 3.0, c: 'sale' }] },
    ],
    brasa: [{ t: 0.8, x: 0.1, y: 0.1, z: 6, k: 0, tam: 0.35 }, { t: 2.0, z: 14, k: 0.6, tam: 0.6 }, { t: 3.4, x: 1.0, y: -0.2, z: 40, k: 1, tam: 1 }, { t: 5.0, x: 2.5, y: -0.2, z: 46, k: 1, c: 'suave' }, { t: 6.6, x: 4.0, y: 2.6, z: 50, k: 1, c: 'suave' }, { t: 8.6, x: 7.6, y: 7.2, z: 60, k: 0.9, c: 'suave' }],
    focos: [{ de: 'brasa', r: 190 }, { de: 'heroe', z: 30, r: 120, k: 0.8 }],
    sonidos: [{ t: 0.8, id: 'brasa_nace', cine: true }, { t: 1.6, id: 'sombra', cine: true }, { t: 3.6, id: 'grunido' }, { t: 4.6, id: 'latido', cine: true }, { t: 6.6, id: 'brasa_vuela', cine: true, vol: 0.6 }],
    paso: (e, tl) => { vez(e, 'sangre', tl, 0, () => charco(e, 'c', 0.3, 0.3, 1.0, 1.1)); vez(e, 'pecho', tl, 2.0, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 10, 26, 0.6)); },
    mundo: (e, tl) => sombras(e, tl),
    textos: [L(1, 4.6, 9.2)],
  },
  {
    // el Templo del Sol: la brasa sale por la avenida entre los colosos, el disco caído se enciende y se va al este
    id: 'sol', dur: 9, zona: 'a2_ruinas', ancla: anclaSalida('a2_sol'), entra: 0.6, sale: 0.6, oscuridad: 0.55, hundir: 0.45,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a2_sol'); },
    cam: [{ t: 0, x: 6, y: 6, alt: 230, zoom: 0.6, fy: 0.5 }, { t: 9, x: 9, y: 4, alt: 200, c: 'suave' }],
    brasa: [{ t: 0.5, x: 0, y: 0, z: 60, k: 1, tam: 2 }, { t: 3.5, x: 5, y: 4, z: 120, k: 1, c: 'suave' }, { t: 6.5, x: 13, y: 2, z: 180, k: 1, c: 'suave' }, { t: 9, x: 22, y: -2, z: 220, k: 0.8, tam: 1.4, c: 'lineal' }],
    focos: [{ de: [-4, -6], z: 160, r: 380, k: 0.8 }, { de: 'brasa', r: 260 }],
    primer: [{ id: 'des2_palmera|seca', fx: 0.05, fy: 1.08, par: 1.8 }, { id: 'des2_columnas|rota', fx: 0.95, fy: 1.1, par: 2.1, mas: 2 }],
    luces: [
      { id: 'luna', color: [150, 150, 200], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.5 }] },
      // el disco de bronce caído: se enciende cuando la brasa le pasa por delante
      { id: 'disco', color: [255, 170, 70], sombra: true, claves: [{ t: 0, x: 6, y: -14, z: 60, r: 260, k: 0 }, { t: 2.6, k: 0 }, { t: 3.4, k: 1, c: 'sale' }, { t: 5.5, k: 0.15 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_arena', cine: true }, { t: 0.6, id: 'brasa_vuela', cine: true }, { t: 3.2, id: 'campana', cine: true, tono: 1.6, vol: 0.5 }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 60) { const j = e.j; j.particulas.push({ x: e.ax + (Math.random() - 0.3) * 30, y: e.ay + (Math.random() - 0.3) * 30, z: Math.random() * 80, vx: 2.2 + Math.random(), vy: -0.6, vz: 0, t: 0, dur: 2 + Math.random() * 2, color: '#a88c5c', tam: 1, grav: 0, tipo: 'ceniza' } as any); } void tl; },
    textos: [L(2, 2.4, 8.6)],
  },
  {
    // el muelle (un canal del manglar): Oyá en la popa de su barca; el héroe y Thor suben desde la orilla, ella suelta las
    // amarras y la barca se va por el canal con los tres
    id: 'muelle', dur: 10, zona: 'a3_pantano', ancla: anclaMuelle, sinBruma: true, objetos: VARIANTE_RUMBO.map((q) => 'cine_barca|' + q[2]), entra: 0.7, sale: 0.6, oscuridad: 0.7, hundir: 0.66, sinClima: ['fx_lluvia', 'fx_tormenta'],
    // (sin lluvia: a ×3 las gotas se leían como rayas rotas; la claves y la cámara las arma ponerBarca según el rumbo del canal)
    preparar: (e) => { sinLluvia(e); despejarPies(e, 0, 0, 6); despejarPies(e, 2, 4, 5); despejarPies(e, 0, 9, 6); if (e.z) e.z.objetos = e.z.objetos.filter((o) => !/cofre/.test(o.id) || Math.hypot(o.cx - e.ax, o.cy - e.ay) > 14); ponerBarca(e); },
    cam: [{ t: 0, x: 0, y: 1.6, alt: 30, zoom: 3, fy: 0.52 }],
    actores: [
      { id: 'oya', tipo: 'sprite', sprite: 'oya', claves: [{ t: 0, x: -1, y: 1 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 0, y: 4 }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 1, y: 4 }] },
    ],
    focos: [{ de: 'heroe', z: 30, r: 150 }, { de: 'oya', z: 30, r: 110, k: 0.85 }, { de: 'thor', z: 20, r: 90, k: 0.7 }],
    luces: [
      // el farol de proa (lo mueve moverBarca con la barca): tibio, alumbra a los tres
      { id: 'farol', color: [255, 176, 100], sombra: true, titila: 0.12, claves: [{ t: 0, x: 1.4, y: -1.4, z: 26, r: 190, k: 1 }] },
      { id: 'cielo', color: [120, 140, 160], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 700, k: 0.22 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_arena', cine: true, vol: 0.4 }, { t: 5.4, id: 'puerta', vol: 0.4 }],
    paso: (e, tl) => moverBarca(e, tl),
    mundo: (e, tl) => aguaBarca(e, tl),
    textos: [L(3, 4.4, 9.6)],
  },
  {
    // sobre el agua: algo pálido camina detrás de la barca, cantando, y no se hunde
    id: 'agua', dur: 9, zona: 'a3_pantano', ancla: anclaCanal, entra: 0.6, sale: 0.7, oscuridad: 0.86, hundir: 0.72, sinBruma: true, sinClima: ['fx_luciernagas', 'fx_lluvia', 'fx_tormenta'],
    // (lo que crece en el agua y delante de la cámara sale: el manglar lo tapaba hasta la cabeza; sin lluvia, que a ×3 se rompía)
    preparar: (e) => { sinLluvia(e); if (e.z) { e.z.objetos = e.z.objetos.filter((o) => { const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay; const u = dx + dy - 4, w = dx - dy - 3; return /muro/.test(o.id) || !(u > -7 && u < 18 && Math.abs(w) < 15); }); } },
    cam: [{ t: 0, x: 2.8, y: 0.9, alt: 40, zoom: 3, fy: 0.5 }, { t: 9, x: 0.6, y: 0.7, alt: 42, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#241c2c', 0.42], claves: [{ t: 0, x: 4.6, y: 0.3, acc: 'caminar', dir: 'o' }, { t: 9, x: -0.6, y: 0.3, c: 'lineal' }] },
    ],
    focos: [{ de: 'vesperio', z: 50, r: 150, k: 0.85 }],
    // su luz violeta de costado, delante (le da color a la cara y al agua), y un canto frío por detrás
    luces: [
      { id: 'ves', color: VIOLETA, sombra: true, titila: 0.08, claves: [{ t: 0, x: 6.0, y: 2.2, z: 70, r: 170, k: 1.2 }, { t: 9, x: 0.8, y: 2.2, c: 'lineal' }] },
      { id: 'canto', color: [170, 120, 240], claves: [{ t: 0, x: 3.6, y: -1.2, z: 60, r: 120, k: 0.9 }, { t: 9, x: -1.6, y: -1.2, c: 'lineal' }] },
    ],
    sonidos: [{ t: 0, id: 'coro_agua', cine: true }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * 8) ceniza(e.j, m.x, m.y, 1, '#9e96ae'); void tl; },
    mundo: (e, tl) => reflejoVesperio(e, tl),
    textos: [L(4, 1.6, 8.4)],
  },
  {
    // Yhuantl: la brasa sube por la escalera de la pirámide y entra por la máscara; los tambores suenan solos
    id: 'yhuantl', dur: 10, zona: 'a3_pantano', ancla: anclaSalida('a3_templo1'), entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45,
    preparar: (e) => { if (e.z) { const z: any = e.z; if (z.lluvia0 !== undefined) z.lluvia = z.lluvia0; despejarPiezas(e.z, 'a3_templo1'); } },
    cam: [{ t: 0, x: 8, y: 8, alt: 250, zoom: 0.6, fy: 0.5 }, { t: 10, x: 6, y: 6, alt: 300, c: 'suave' }],
    brasa: [{ t: 0, x: 18, y: 16, z: 160, k: 1, tam: 1.2 }, { t: 3.4, x: 6, y: 6, z: 60, k: 1, c: 'suave' }, { t: 6.2, x: 0.5, y: 0.5, z: 30, k: 1, tam: 1, c: 'suave' }, { t: 6.8, x: 0, y: 0, z: 26, k: 0, tam: 0.6 }],
    focos: [{ de: [-6, -6], z: 260, r: 420, k: 0.8 }, { de: 'brasa', r: 240 }],
    primer: [{ id: 'sel2_helecho|arborescente', fx: 0.05, fy: 1.08, par: 1.7, mas: 2 }, { id: 'sel2_manglar|raices', fx: 0.95, fy: 1.1, par: 2.0 }],
    luces: [
      { id: 'boca', color: [255, 90, 40], sombra: true, claves: [{ t: 0, x: 0, y: 0, z: 30, r: 200, k: 0 }, { t: 6.4, k: 0 }, { t: 7.0, k: 1, r: 320, c: 'sale' }, { t: 10, k: 0.7 }] },
      { id: 'luna', color: [120, 150, 140], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.4 }] },
    ],
    sonidos: [{ t: 0.2, id: 'brasa_vuela', cine: true, vol: 0.6 }, { t: 6.6, id: 'sub', cine: true }, { t: 6.8, id: 'tambores', cine: true }],
    temblores: [[6.7, 0.4, 2]],
    paso: (e, tl) => vez(e, 'entra', tl, 6.7, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 30, 50, 1)),
    textos: [L(5, 6.8, 9.8)],
  },
  { id: 'acto3', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 3) },
];

export const CINE_ACTO2: Guion = { id: 'acto2', acto: 2, tomas };
