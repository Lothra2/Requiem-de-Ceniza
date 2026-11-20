// Lo que late en el HUD forjado: el panel cuenta la historia del juego y responde a lo que pasa (Rick, 20 nov 2026:
// "un HUD mejor que el de Diablo, con intención").
//   La Marca: el rosetón del nivel es la brasa que el héroe lleva clavada. Respira con la experiencia, arde al subir de
//     nivel, late cuando la voz de la Marca habla y cuando hay un jefe cerca, se cubre en los pueblos y no se apaga ni
//     con el héroe muerto (canon: "la Marca que no se apaga").
//   La vida baja: grietas en la piedra de la casa que sangran luz con el latido y el vidrio del orbe que se raja.
//   El maná: la vela de la doliente es el maná. Se consume, tiembla cuando queda poco y se apaga con humo.
//   La racha: la sangre de la matanza corre por la piedra del panel y se seca.
//   Los estados del héroe en el aro del orbe de vida: veneno, escarcha, sangrado y el fuego recién recibido.
//   El trago: la poción sube por el orbe. El jefe: cae ceniza con brasas (la sed del Sediento) y se junta en la cornisa.
// Todo a puntos enteros (unidades de D puntos del lienzo), sin lecturas del lienzo y sin cachés por cuadro. Hay que
// llamar a todo con la transformación del lienzo en la identidad.
import { ctx } from '../nucleo/lienzo';
import { acc } from '../nucleo/accesible';
import { hash, cl, M } from './forja_taller';
import { xpPara, NIVEL_MAX } from '../juego/heroe';
import { ardorNivel } from './sello_nivel';
import type { Juego } from '../juego/mundo';

/** El latido de la vida baja: dos golpes (lub-dub) por ciclo, más rápido cuanto menos vida. 0 a 1. */
export function latido(k: number, t: number): number {
  if (k >= 0.3) return 0;
  const bpm = 64 + 70 * (1 - k / 0.3), p = ((t * bpm) / 60) % 1;
  const g = (c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));
  return Math.min(1, g(0.06, 0.05) + 0.7 * g(0.27, 0.06)) * (0.55 + 0.45 * (1 - k / 0.3));
}

/** El pulso del HUD en este cuadro: lo que cada pieza necesita saber del juego. */
export interface Pulso {
  t: number; dt: number; kV: number; kM: number; kxp: number; lat: number;
  /** La brasa de la Marca, 0,05 a 1. */ brasa: number; /** La voz de la Marca hablando, 0 a 1. */ voz: number;
  /** Jefe despierto (entra y sale de a poco). */ jefe: number; pueblo: number; muerto: number; /** Subió de nivel hace poco, 1 a 0. */ subio: number;
  /** El trago en curso: de qué y cuánto va (0 a 1). */ bebio: { tipo: string; k: number } | null;
  /** El fuego recién recibido, 1 a 0. */ arde: number;
}
const E0 = { t: 0, jefe: 0, pueblo: 0, muerto: 0 };
export function pulsoHud(j: Juego, t: number): Pulso {
  const h = j.heroe, d = h.d, o = j as any, hh = h as any, dt = cl(t - E0.t, 0, 0.1); E0.t = t;
  const hacia = (v: number, obj: number, sube: number, baja: number) => (v < obj ? Math.min(obj, v + sube * dt) : Math.max(obj, v - baja * dt));
  E0.jefe = hacia(E0.jefe, j.jefe && !j.jefe.muerto ? 1 : 0, 1.6, 0.5);
  E0.pueblo = hacia(E0.pueblo, j.zona?.tipo === 'pueblo' ? 1 : 0, 0.7, 0.7);
  E0.muerto = hacia(E0.muerto, h.muerto ? 1 : 0, 0.8, 2.5);
  const kV = cl(h.vida / Math.max(1, h.vidaMax)), kM = cl(h.mana / Math.max(1, h.c.manaMax));
  const a = xpPara(d.nivel), b = xpPara(d.nivel + 1), kxp = d.nivel >= NIVEL_MAX ? 1 : cl((d.xp - a) / Math.max(1, b - a));
  let voz = 0; { const v = o.vozMarcaHud; if (v) { const x = j.t - v.t0; if (x > v.dur) o.vozMarcaHud = null; else if (x > 0) voz = Math.min(1, x / 0.5, (v.dur - x) / 1.2); } }
  const golpe = Math.pow(Math.max(0, Math.sin(t * 5.2)), 6), subio = ardorNivel(j.t);
  let brasa = 0.2 + 0.3 * kxp + 0.06 * Math.sin(t * 1.25) + E0.jefe * (0.22 + 0.2 * golpe) + voz * 0.55 * (0.6 + 0.4 * Math.sin(t * 7) ** 2);
  brasa *= 1 - 0.82 * E0.pueblo * (1 - voz);
  if (E0.muerto > 0) brasa = Math.max(brasa, E0.muerto * (0.5 + 0.1 * Math.sin(t * 2)));
  brasa = cl(Math.max(brasa, subio), 0.05, 1);
  const bb = hh.bebio, kb = bb ? (j.t - bb.t) / 0.9 : 2;
  return { t, dt, kV, kM, kxp, lat: h.muerto ? 0 : latido(kV, t), brasa, voz, jefe: E0.jefe, pueblo: E0.pueblo, muerto: E0.muerto, subio,
    bebio: bb && kb >= 0 && kb < 1 ? { tipo: bb.tipo, k: kb } : null, arde: cl(1 - (j.t - (hh.ardeT ?? -9)) / 1.4) };
}

/** Una tanda de puntos de D en un solo camino. pts en puntos del lienzo. */
function puntos(pts: number[], D: number, color: string) {
  if (!pts.length) return;
  ctx.fillStyle = color; ctx.beginPath(); for (let i = 0; i < pts.length; i += 2) ctx.rect(pts[i], pts[i + 1], D, D); ctx.fill();
}

// ------------------------------------------------------------------ grietas (en la piedra y en el vidrio)
/**
 * Grietas que salen de un aro de radio r0 hacia afuera (o hacia adentro con `adentro`): caminos quebrados con alguna
 * rama. Devuelve [dx, dy, orden] en puntos de dibujo respecto del centro; el orden (0 a 1) dice cuándo aparece cada punto.
 */
export function grietas(sem: number, r0: number, n: number, largo: number, adentro = false, angs?: number[]): [number, number, number][] {
  const out: [number, number, number][] = [], visto = new Set<number>();
  const pon = (x: number, y: number, o: number) => { const k = Math.round(x) * 4096 + Math.round(y); if (visto.has(k)) return; visto.add(k); out.push([Math.round(x), Math.round(y), o]); };
  for (let i = 0; i < n; i++) {
    let a = angs ? angs[i % angs.length] : (i / n) * Math.PI * 2 + hash(i, 1, sem) * 0.7, x = Math.cos(a) * r0, y = Math.sin(a) * r0;
    if (adentro) a += Math.PI;
    const L = largo * (0.6 + hash(i, 2, sem) * 0.6);
    for (let s = 0; s < L; s++) {
      if (s % 3 === 0) a += (hash(i * 31 + s, 3, sem) - 0.5) * 0.9;
      x += Math.cos(a); y += Math.sin(a); pon(x, y, (i / n) * 0.5 + (s / L) * 0.5);
      // una rama corta a mitad de camino
      if (s === Math.floor(L * 0.45) && hash(i, 4, sem) > 0.35) { let bx = x, by = y, ba = a + (hash(i, 5, sem) > 0.5 ? 0.9 : -0.9); for (let q = 0; q < L * 0.4; q++) { if (q % 3 === 0) ba += (hash(i * 17 + q, 6, sem) - 0.5) * 0.7; bx += Math.cos(ba); by += Math.sin(ba); pon(bx, by, (i / n) * 0.5 + 0.3 + (q / L) * 0.5); } }
    }
  }
  return out;
}
/** Deja solo las grietas que caen en piedra del marco (cx, cy: el centro en puntos del marco). `todo`: también en el hierro y el latón. */
export function enPiedra(g: [number, number, number][], cx: number, cy: number, mat: Uint8Array, w: number, h: number, todo = false): [number, number, number][] {
  return g.filter(([x, y]) => { const px = Math.round(cx) + x, py = Math.round(cy) + y; if (px < 0 || py < 0 || px >= w || py >= h) return false; const m = mat[py * w + px]; return todo ? m !== 0 && m !== M.HUECO : m === M.PIEDRA || m === M.TALLA; });
}
/** Pinta las grietas encendidas: luz sumada del color, hasta el orden `hasta`. (cx, cy): el centro en puntos del lienzo. */
export function grietasLuz(g: [number, number, number][], cx: number, cy: number, D: number, rgbc: string, a: number, hasta = 1) {
  if (a <= 0.01 || !g.length) return;
  const pts: number[] = []; for (const [x, y, o] of g) if (o <= hasta) pts.push(cx + x * D, cy + y * D);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; puntos(pts, D, `rgba(${rgbc},${cl(a)})`); ctx.restore();
}

// ------------------------------------------------------------------ la Marca
/** Debajo del rosetón: el resplandor de la brasa en la piedra y las fisuras que arden. */
export function marcaFondo(cx: number, cy: number, D: number, P: Pulso, fis: [number, number, number][]) {
  const b = P.brasa, r = (22 + 26 * b) * D, fl = 0.5 + 0.5 * acc.destellos;
  const gl = ctx.createRadialGradient(cx, cy, 6 * D, cx, cy, r);
  gl.addColorStop(0, `rgba(255,110,40,${(0.1 + 0.5 * b) * fl})`); gl.addColorStop(0.5, `rgba(230,60,20,${0.16 * b * fl})`); gl.addColorStop(1, 'rgba(200,40,10,0)');
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); ctx.restore();
  grietasLuz(fis, cx, cy, D, '255,96,32', 0.25 + 0.75 * b, 0.35 + 0.65 * b);
  if (b > 0.55) grietasLuz(fis, cx, cy, D, '255,220,150', (b - 0.55) * 1.2, 0.3 + 0.4 * b);
}
/** Encima del rosetón: las chispas que suben y los aros de la voz. */
export function marcaChispas(cx: number, cy: number, D: number, P: Pulso, tactil = false) {
  const b = P.brasa, n = Math.round((1.5 + 8 * b) * (1 - P.pueblo * 0.9) * (tactil ? 0.6 : 1));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const ciclo = 1.3 + hash(i, 1, 51) * 1.5, tt = P.t + hash(i, 2, 51) * 9, k = Math.floor(tt / ciclo), q = (tt / ciclo) % 1;
    const x = cx + Math.round((hash(i, k, 52) - 0.5) * 20 + Math.sin(q * 5 + i) * 3) * D, y = cy - Math.round(9 + q * (22 + hash(i, k, 53) * 22)) * D;
    ctx.fillStyle = q < 0.3 ? `rgba(255,236,170,${(1 - q) * 0.95})` : q < 0.65 ? `rgba(255,150,60,${(1 - q) * 0.9})` : `rgba(200,60,24,${(1 - q) * 0.8})`;
    ctx.fillRect(x, y, D, D);
  }
  if (P.voz > 0.02) for (let i = 0; i < 2; i++) { const p = (P.t * 0.8 + i * 0.5) % 1; ctx.strokeStyle = `rgba(255,120,60,${P.voz * (1 - p) * 0.6 * acc.destellos})`; ctx.lineWidth = D; ctx.beginPath(); ctx.arc(cx, cy, (15 + p * 26) * D, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ la sangre de la racha
interface Gota { x: number; y0: number; y1: number; t0: number; /** El corrimiento de cada tramo (la sangre no baja a plomo). */ xs: Int8Array }
const gotas: Gota[] = []; let rachaVista = -9, claveSangre = '';
/**
 * La racha (tres muertes seguidas o más) hace correr sangre por la piedra del marco: nace en el canto de arriba, baja
 * por la piedra (se para donde hay metal o hueco), y en unos segundos se oscurece y se seca. dx, dy: de puntos del marco
 * a puntos del lienzo.
 */
export function sangreRacha(j: Juego, mat: Uint8Array, w: number, hh: number, clave: string, x0: number, x1: number, dx: (x: number) => number, dy: (y: number) => number, D: number, t: number) {
  const o = j as any;
  if (clave !== claveSangre) { gotas.length = 0; claveSangre = clave; }
  if ((o.rachaT ?? -9) !== rachaVista) {
    rachaVista = o.rachaT ?? -9;
    const r = o.racha ?? 0, n = r >= 12 ? 14 : r >= 8 ? 10 : r >= 5 ? 7 : r >= 3 ? 5 : 0; // (Rick, 20 nov 2026: regueros de 1 a 2 puntos no gritaban matanza: más, más gruesos y con su salpicón)
    for (let i = 0; i < n; i++) {
      const x = Math.floor(x0 + hash(i, Math.floor(t * 60), 61) * (x1 - x0)); let y = 0;
      while (y < hh && !mat[y * w + x]) y++;
      if (y >= hh) continue;
      // baja por la piedra y los metales; se para en un hueco (una casilla, el nicho) pasada la cornisa, o en el aire
      let y1 = y; const L = Math.min(46, 14 + r * 2.4 + hash(i, x, 62) * 10);
      while (y1 < hh - 1 && y1 - y < L) { const m = mat[(y1 + 1) * w + x]; if (!m || (m === M.HUECO && y1 - y > 13)) break; y1++; }
      if (y1 - y < 6) continue;
      // el camino: de vez en cuando se corre un punto hacia un lado (si ahí también hay talla)
      const xs = new Int8Array(y1 - y + 1); let o2 = 0;
      for (let q = 3; q < xs.length; q++) { if (hash(x + q, i, 63) < 0.16) { const d2 = hash(x, q, 64) < 0.5 ? -1 : 1; if (Math.abs(o2 + d2) <= 2 && mat[(y + q) * w + x + o2 + d2]) o2 += d2; } xs[q] = o2; }
      gotas.push({ x, y0: y, y1, t0: t + i * 0.1, xs }); if (gotas.length > 44) gotas.shift();
    }
  }
  for (let i = gotas.length - 1; i >= 0; i--) {
    const g = gotas[i], e = t - g.t0; if (e < 0) continue; if (e > 30) { gotas.splice(i, 1); continue; }
    const tot = g.y1 - g.y0, len = Math.min(tot, Math.floor(e * 26)), corre = len < tot, k = cl(e / 12), a = e > 22 ? 1 - (e - 22) / 8 : 1, ancho = Math.ceil(len * 0.4);
    ctx.fillStyle = `rgba(${Math.round(206 - 136 * k)},${Math.round(18 + 2 * k)},14,${a * (0.96 - 0.2 * k)})`;
    // el reguero: grueso arriba, fino abajo, con su mancha donde nació
    ctx.beginPath(); ctx.rect(dx(g.x - 5), dy(g.y0), 12 * D, D); ctx.rect(dx(g.x - 4), dy(g.y0 + 1), 10 * D, D); ctx.rect(dx(g.x - 2), dy(g.y0 + 2), 7 * D, D);
    // (salpicón al lado de donde nació, distinto en cada una)
    ctx.rect(dx(g.x - 8 + (g.x % 3)), dy(g.y0 + 1 + (g.x % 2)), 2 * D, D); ctx.rect(dx(g.x + 8 - (g.x % 4)), dy(g.y0 + (g.x % 3)), 2 * D, D);
    for (let q = 0; q <= len; q++) { const an = q < ancho ? 4 : q < ancho * 2 ? 3 : 2; ctx.rect(dx(g.x + g.xs[q] - (an >> 1) + 1), dy(g.y0 + q), an * D, D); }
    // la gota de la punta, gorda mientras corre; seca queda un coágulo
    const hx = g.x + g.xs[len]; ctx.rect(dx(hx - (corre ? 1 : 0)), dy(g.y0 + len), (corre ? 4 : 3) * D, (corre ? 3 : 2) * D); if (corre) ctx.rect(dx(hx), dy(g.y0 + len + 3), 2 * D, D);
    ctx.fill();
    if (k < 0.5) { ctx.fillStyle = `rgba(255,150,130,${0.8 * a * (1 - k * 2)})`; ctx.fillRect(dx(hx), dy(g.y0 + len), 2 * D, D); ctx.fillRect(dx(g.x - 1), dy(g.y0), 4 * D, D); }
  }
}
(window as any).__hudGotas = () => gotas.length;

// ------------------------------------------------------------------ la ceniza del jefe
let monton: Uint8Array | null = null, cumbre: Int16Array | null = null, claveCeniza = '';
/**
 * Con un jefe despierto cae ceniza con alguna brasa sobre el panel (la sed del Sediento cae como brasas) y se junta en
 * el canto de arriba de la piedra; cuando el jefe muere o se pierde, se la lleva el aire.
 */
export function cenizaJefe(P: Pulso, mat: Uint8Array, w: number, hh: number, clave: string, dx: (x: number) => number, dy: (y: number) => number, D: number, tactil = false) {
  if (clave !== claveCeniza || !monton || !cumbre) {
    claveCeniza = clave; monton = new Uint8Array(w); cumbre = new Int16Array(w);
    for (let x = 0; x < w; x++) { let y = 0; while (y < hh && !mat[y * w + x]) y++; cumbre[x] = y; }
  }
  const j = P.jefe; let hay = false;
  if (j > 0.6) { const n = Math.ceil(P.dt * w * 0.35); for (let i = 0; i < n; i++) { const x = Math.floor(Math.random() * w); if (cumbre[x] >= hh) continue; const vec = (x > 0 ? monton[x - 1] : 0) + (x < w - 1 ? monton[x + 1] : 0); if (monton[x] < 2 && (monton[x] === 0 ? vec > 0 || Math.random() < 0.12 : vec >= 2 && Math.random() < 0.3)) monton[x]++; } }
  else if (j < 0.5) { const n = Math.ceil(P.dt * w * 0.5); for (let i = 0; i < n; i++) { const x = Math.floor(Math.random() * w); if (monton[x]) monton[x]--; } }
  // la ceniza juntada: tramos iguales en un solo rectángulo
  ctx.fillStyle = '#a39c92'; ctx.beginPath();
  for (let x = 0; x < w;) { const m = monton[x]; if (!m) { x++; continue; } hay = true; let x2 = x + 1; while (x2 < w && monton[x2] === m && cumbre[x2] === cumbre[x]) x2++; ctx.rect(dx(x), dy(cumbre[x] - m), (x2 - x) * D, m * D); x = x2; }
  ctx.fill();
  // la cresta de cada montón, más clara
  ctx.fillStyle = '#d2ccc2'; ctx.beginPath(); for (let x = 0; x < w; x++) if (monton[x] === 2) ctx.rect(dx(x), dy(cumbre[x] - 2), D, D); ctx.fill();
  if (j <= 0.01) return hay;
  // los copos: gris ceniza y, uno de cada cinco, una brasa que titila
  const n = tactil ? 22 : 44, S = 170;
  for (let i = 0; i < n; i++) {
    const v = 16 + hash(i, 1, 71) * 26, y = (P.t * v + hash(i, 2, 71) * S) % S, x = Math.floor(hash(i, 3, 71) * w + Math.sin(P.t * 0.7 + i) * 7), ys = (x >= 0 && x < w ? cumbre[x] : hh) - S + y;
    const a = j * Math.min(1, y / 24) * Math.min(1, (S - y) / 10 + 0.3);
    if (i % 5 === 0) { ctx.fillStyle = `rgba(255,${120 + Math.floor(hash(i, Math.floor(P.t * 9), 72) * 90)},50,${a})`; ctx.fillRect(dx(x), dy(ys), D, D); }
    else { ctx.fillStyle = `rgba(168,160,150,${a * 0.75})`; ctx.fillRect(dx(x), dy(ys), D, D); }
  }
  return true;
}

// ------------------------------------------------------------------ la vela de la doliente
/**
 * La vela es el maná: (x, yBase) es el pie de la vela en puntos del lienzo, hMax su alto entera en puntos de dibujo.
 * Se consume con el maná, con poco tiembla y humea, sin maná (o muerto el héroe) se apaga.
 */
export function velaMana(x: number, yBase: number, D: number, hMax: number, P: Pulso, falta: boolean) {
  const k = P.kM, hv = Math.max(2, Math.round(hMax * (0.3 + 0.7 * k))), tl = Math.floor(P.t * 11);
  const u = (ax: number, ay: number, w: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(x + ax * D, yBase + ay * D, w * D, hh * D); };
  // la cera: tres puntos de ancho, luz a la izquierda, y el charco derretido arriba
  u(-1, -hv, 1, hv, '#e8dcc0'); u(0, -hv, 1, hv, '#cdbd98'); u(1, -hv, 1, hv, '#8f7f62'); u(-1, -hv, 3, 1, '#fff4d8');
  if (hv < hMax * 0.7) u(1, -hv + 1, 1, 2, '#e8dcc0'); // una lágrima de cera
  const apagada = P.muerto > 0.3 || k < 0.04;
  let fh = 0;
  if (!apagada) {
    if (k > 0.5 && !falta) fh = 3 + (hash(tl, 1, 81) > 0.6 ? 1 : 0);
    else if (k > 0.25 && !falta) fh = 2 + (hash(tl, 1, 81) > 0.5 ? 1 : 0);
    else fh = hash(tl, 2, 81) < 0.3 ? 0 : 1 + (hash(tl, 3, 81) > 0.6 ? 1 : 0);
  }
  u(0, -hv - 1, 1, 1, fh ? '#3a2410' : apagada ? (hash(tl >> 2, 4, 81) > 0.5 ? '#c04818' : '#40180c') : '#3a2410'); // el pabilo (rescoldo si se apagó)
  if (fh > 0) {
    const frio = k < 0.25 || falta, lx = hash(tl, 5, 81) < 0.2 ? -1 : hash(tl, 5, 81) > 0.85 ? 1 : 0;
    const r = (7 + 4 * fh) * D, gx = x + D / 2, gy = yBase - (hv + 2) * D, gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, r);
    gl.addColorStop(0, `rgba(255,170,70,${0.12 + 0.05 * fh})`); gl.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(gx - r, gy - r, 2 * r, 2 * r); ctx.restore();
    for (let q = 0; q < fh; q++) u(q >= 2 ? lx : 0, -hv - 2 - q, 1, 1, q === 0 ? (frio ? '#b8ccff' : '#fff4c8') : q === 1 ? '#ffc858' : '#e86414');
    if (fh >= 3) u(-1, -hv - 3, 1, 1, 'rgba(255,170,60,0.6)');
  }
  // el humo: con la llama apagada o temblando
  if (apagada || fh === 0 || k < 0.25 || falta) for (let i = 0; i < 3; i++) { const q = (P.t * 0.7 + i / 3) % 1; ctx.fillStyle = `rgba(190,186,180,${(1 - q) * (apagada ? 0.55 : 0.35)})`; ctx.fillRect(x + Math.round(Math.sin(q * 5 + i * 2) * 2) * D, yBase - (hv + 3 + Math.round(q * 13)) * D, D, D); }
}

// ------------------------------------------------------------------ el orbe: estados, vidrio y trago
const vidrios = new Map<number, [number, number, number][]>();
/**
 * Lo que va encima de un orbe (cx, cy en puntos del lienzo, R el radio en puntos de dibujo). lado 'v': el aro toma el
 * estado del héroe (veneno, escarcha, sangrado, fuego) y el vidrio se raja con la vida baja. En los dos, el trago.
 */
export function estadosOrbe(j: Juego, cx: number, cy: number, R: number, D: number, lado: 'v' | 'm', P: Pulso) {
  const h = j.heroe, t = P.t, u = (x: number, y: number, w: number, hh: number) => ctx.fillRect(cx + Math.round(x) * D, cy + Math.round(y) * D, w * D, hh * D);
  // el trago: una franja de luz que sube por el orbe y pizcas que suben con ella
  const b = P.bebio;
  if (b && (b.tipo === 'rejuv' || (b.tipo === 'vida') === (lado === 'v'))) {
    const col = b.tipo === 'rejuv' ? '220,130,255' : lado === 'v' ? '255,150,120' : '140,170,255', y = R - b.k * 2 * R, a = Math.sin(b.k * Math.PI);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let q = -5; q <= 5; q++) { const yy = Math.round(y + q), half = Math.sqrt(Math.max(0, (R - 1) * (R - 1) - yy * yy)); if (half < 1) continue; ctx.fillStyle = `rgba(${col},${a * (0.55 - Math.abs(q) * 0.09)})`; u(-half, yy, Math.round(half * 2), 1); }
    ctx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
    for (let i = 0; i < 7; i++) { const sx = (hash(i, 1, 91) - 0.5) * 1.5 * R, sy = y - 3 - hash(i, 2, 91) * 10 - b.k * 6; if (sx * sx + sy * sy < (R - 2) * (R - 2)) u(sx, sy, 1, 1); }
    ctx.restore();
  }
  if (lado !== 'v') return;
  // veneno: cuentas verdes que dan la vuelta al aro y burbujas que suben
  if (h.veneno > 0 && !h.muerto) {
    const pts: number[] = []; for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2 + t * 0.7; if (i % 3 !== Math.floor(t * 3) % 3) pts.push(cx + Math.round(Math.cos(a) * (R + 7)) * D, cy + Math.round(Math.sin(a) * (R + 7)) * D); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; puntos(pts, 2 * D, `rgba(120,255,90,${0.55 + 0.25 * Math.sin(t * 5)})`); ctx.restore();
    ctx.fillStyle = 'rgba(190,255,150,0.75)';
    for (let i = 0; i < 5; i++) { const q = (t * 0.45 + i * 0.23) % 1, bx = (hash(i, Math.floor(t * 0.45 + i * 0.23), 92) - 0.5) * 1.3 * R, by = R * 0.75 - q * R * 1.3; if (bx * bx + by * by < (R - 3) * (R - 3)) { u(bx, by, 2, 1); u(bx, by + 2, 2, 1); u(bx - 1, by + 1, 1, 1); u(bx + 2, by + 1, 1, 1); } }
  }
  // escarcha: agujas de hielo que crecen del aro hacia adentro
  const fr = h.muerto ? 0 : cl(Math.max(h.frio / 2.5, h.congelado > 0 ? 1 : 0));
  if (fr > 0.02) {
    const pts: number[] = [];
    for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 + 0.2, L = fr * (4 + hash(i, 1, 93) * 9);
      for (let s = 0; s < L; s++) { const r = R - 1 - s; pts.push(cx + Math.round(Math.cos(a) * r) * D, cy + Math.round(Math.sin(a) * r) * D); if (s === Math.floor(L * 0.5) && L > 5) for (const da of [0.09, -0.09]) for (let q = 1; q <= 2; q++) pts.push(cx + Math.round(Math.cos(a + da * q) * (r - q)) * D, cy + Math.round(Math.sin(a + da * q) * (r - q)) * D); } }
    puntos(pts, D, `rgba(226,244,255,${0.55 + 0.3 * fr})`);
    const p2: number[] = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; if (hash(i, 2, 93) < fr) p2.push(cx + Math.round(Math.cos(a) * (R + 1)) * D, cy + Math.round(Math.sin(a) * (R + 1)) * D); }
    puntos(p2, D, 'rgba(200,232,255,0.8)');
    if (Math.floor(t * 6) % 3 === 0) { const i = Math.floor(t * 2) % 16, a = (i / 16) * Math.PI * 2 + 0.2; ctx.fillStyle = '#ffffff'; u(Math.cos(a) * (R - 3), Math.sin(a) * (R - 3), 1, 1); }
  }
  // sangrado: regueros de sangre que bajan por fuera del vidrio, desde el aro de arriba
  if (h.sangrado > 0 && !h.muerto) for (let i = 0; i < 5; i++) {
    const x = (i - 2) * R * 0.34 + (hash(i, 1, 95) - 0.5) * 4, top = -Math.sqrt(Math.max(0, R * R - x * x)), q = (t * 0.55 + hash(i, 2, 95)) % 1, len = Math.round(q * R * (0.5 + hash(i, 3, 95) * 0.5));
    ctx.fillStyle = `rgba(200,20,20,${0.9 * Math.min(1, (1 - q) * 3)})`; u(x, top, 1, len); u(x, top + len - 1, 2, 2); ctx.fillStyle = `rgba(255,150,140,${0.8 * Math.min(1, (1 - q) * 3)})`; u(x, top + len - 1, 1, 1);
  }
  // el fuego recién recibido: lenguas que lamen la mitad de arriba del aro
  if (P.arde > 0.02) {
    const tf = Math.floor(t * 12);
    for (let i = 0; i < 18; i++) { const a = -Math.PI * (0.04 + (0.92 * i) / 17), al = Math.round((2 + hash(i, tf, 94) * 6) * P.arde); if (al < 1) continue;
      const x = Math.cos(a) * (R + 6), y = Math.sin(a) * (R + 6); ctx.fillStyle = `rgba(226,84,18,${0.7 + 0.3 * P.arde})`; u(x - 1, y - al, 3, al); if (al > 2) { ctx.fillStyle = '#ffc050'; u(x, y - al + 2, 1, al - 2); } if (al > 5) { ctx.fillStyle = '#fff0b0'; u(x, y - 1, 1, 1); } }
    const r = (R + 16) * D, gl = ctx.createRadialGradient(cx, cy, R * D, cx, cy, r); gl.addColorStop(0, `rgba(255,110,30,${0.35 * P.arde})`); gl.addColorStop(1, 'rgba(255,110,30,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); ctx.restore();
  }
  // el vidrio que se raja: por debajo de un cuarto de vida, y entero al morir
  const raja = h.muerto ? 1 : cl((0.25 - P.kV) / 0.2);
  if (raja > 0.02) {
    let g = vidrios.get(R); if (!g) { g = grietas(7 + R, R - 1, 5, R * 1.1, true, [-2.5, -0.6, 2.3, 0.8, -1.5]).filter(([x, y]) => x * x + y * y < (R - 1) * (R - 1)); vidrios.set(R, g); }
    const luz: number[] = [], som: number[] = [];
    for (const [x, y, o] of g) if (o <= raja) { luz.push(cx + x * D, cy + y * D); som.push(cx + (x + 1) * D, cy + (y + 1) * D); }
    puntos(som, D, 'rgba(10,0,0,0.5)'); puntos(luz, D, `rgba(255,236,226,${0.6 + 0.25 * P.lat})`);
  }
}
