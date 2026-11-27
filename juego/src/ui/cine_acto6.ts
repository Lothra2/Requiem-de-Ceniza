// El cierre del acto 6, «La Campana calló» (unos 72 s): la Abadesa de la Sal, atada a la campana mayor de Ysmeral, toca por última
// vez y el bronce se raja; el mar vuelve de golpe a su lugar y levanta el barco de Oyá; en el brazo del héroe la Marca calla un
// momento y vuelve a latir con otra voz, más vieja y con sed; el cielo se rompe como un vidrio sobre la costa y detrás hay escalones
// de oro; arriba, Aun-Saar abre la boca que tiene en el pecho y dice el nombre del héroe; la cámara sube por la Escalera al Trono.
// Cartel del acto 7. Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon" (sin Ozmaren tira el dios directo, la voz de la Marca
// cambia de dueño).
import { ctx, W, H, RES } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { libreCerca, type Zona } from '../mundo/zona';
import { estallido } from '../render/brasa_cine';
import { finalDe } from '../juego/historia';
import { textoGotico } from './texto_gotico';
import { type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, anclaJefe, anclaSalida, anclaAgua, despejarPiezas, despejarPies, vez, ceniza, columnaDe, cartel, latido } from './cine_kit';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(6, n, t0, t1, o);
const lucesDe = (e: EstadoToma): any[] | null => ((e.j as any)?.lucesCine as any[] | undefined) ?? null;
const ORO: [number, number, number] = [236, 196, 120];
const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ------------------------------------------------------------------ la Campana
/** Los aros de agua que echa cada tañido por el piso (lo plano del piso), hasta que calla. */
function arosTanido(e: EstadoToma, tl: number, hasta: number) {
  const [cx, cy] = aPant(e.ax, e.ay);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let k = 0; k < 6; k++) {
    const t0 = 0.3 + k * 1.15; if (t0 > hasta) break; const u = tl - t0; if (u < 0 || u > 2.4) continue;
    const r = 10 + u * 70, a = (1 - u / 2.4) * 0.7;
    for (let s = 0; s < 120; s++) { const an = (s / 120) * Math.PI * 2, x = cx + Math.cos(an) * r, y = cy + Math.sin(an) * r * 0.5; ctx.globalAlpha = a * (0.6 + 0.4 * hash(s + k * 7)); ctx.fillStyle = s % 3 ? '#8ec4c8' : '#d6eef0'; ctx.fillRect(Math.round(x), Math.round(y), 2, 1); }
  }
  ctx.restore();
}
/** La grieta blanca que corre por el bronce de arriba abajo cuando la Abadesa cae (sobre su cuerpo, a pixel), y la sal que se le suelta. */
function grietaBronce(e: EstadoToma, tl: number, t0: number) {
  const u = Math.min(1, Math.max(0, (tl - t0) / 0.5)); if (u <= 0) return;
  const m = e.actores.get('abadesa') as any; if (!m) return;
  const [px, py] = aPant(m.x, m.y); let x = px - 4, y = py - 96;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let s = 0; s < 70 * u; s++) { x += (hash(s) - 0.5) * 2.4 + (s % 9 < 4 ? 0.5 : -0.5); y += 1; ctx.fillStyle = '#1a1210'; ctx.fillRect(Math.round(x) + 1, Math.round(y), 1, 1); ctx.fillStyle = s > 70 * u - 4 ? '#ffffff' : '#e8f2f0'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
  ctx.restore();
}
/** La sal: escamas blancas que se le caen a la Abadesa y quedan en el piso (es de sal, como su estatua del arrecife). */
function salAbadesa(e: EstadoToma, x: number, y: number, n: number, dt: number) {
  if (!e.j) return;
  for (let i = 0; i < n; i++) if (Math.random() < dt * 30) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 1.4, y: y + (Math.random() - 0.5) * 1.4, z: 30 + Math.random() * 70, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: -4 - Math.random() * 8, t: 0, dur: 1.8 + Math.random(), color: Math.random() < 0.6 ? '#e8ece8' : '#b8c4c4', tam: 1 + Math.random(), grav: 40, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ el mar que vuelve
/** El agua que vuelve por la arena: una lámina oscura con su línea de espuma que entra desde adelante y rodea el casco (lo plano). */
function marVuelve(e: EstadoToma, tl: number) {
  const u = Math.min(1, Math.max(0, (tl - 0.8) / 2.6)), s = 1 - (1 - u) ** 3; if (s <= 0) return;
  const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const yf = b.y - (b.y - a.y) * 0.95 * s;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = 'rgba(10,26,34,0.82)'; ctx.fillRect(a.x, yf, b.x - a.x, b.y - yf + 2);
  for (let x = Math.floor(a.x); x < b.x; x++) {
    const o = Math.sin(x * 0.13 + tl * 4) * 2 + Math.sin(x * 0.041 - tl * 2) * 3;
    ctx.fillStyle = Math.sin(x * 1.3 + tl * 7) > -0.2 ? '#c8e0e4' : '#6a9aa4'; ctx.fillRect(x, Math.round(yf + o), 1, 2);
    if (Math.sin(x * 0.37 + tl * 3) > 0.7) { ctx.fillStyle = 'rgba(200,224,228,0.55)'; ctx.fillRect(x, Math.round(yf + o) + 3, 1, 3); }
  }
  // las ondas sobre la lámina
  for (let k = 0; k < 60; k++) { const x = a.x + hash(k) * (b.x - a.x), y = yf + 6 + hash(k + 40) * (b.y - yf); if (y > b.y) continue; ctx.fillStyle = 'rgba(120,160,170,0.35)'; ctx.fillRect(Math.round(x + Math.sin(tl * 2 + k) * 3), Math.round(y), 6, 1); }
  ctx.restore();
}

// ------------------------------------------------------------------ la Marca que cambia de dueño
/** La luz de la Marca en el brazo: roja y latiendo, se para, y vuelve en oro reseco, más lenta y honda. */
function marcaDueno(e: EstadoToma, tl: number, hx: number, hy: number) {
  const Ls = lucesDe(e); if (!Ls) return;
  const PARA = 2.6, VUELVE = 3.8;
  let c: [number, number, number], k: number;
  if (tl < PARA) { c = [255, 50, 24]; k = 0.3 + 0.7 * latido(tl); }
  else if (tl < VUELVE) { c = [255, 50, 24]; k = Math.max(0, 0.3 * (1 - (tl - PARA) / 0.3)); }
  else { const f = Math.min(1, (tl - VUELVE) / 0.8); c = [Math.round(255 - 30 * f), Math.round(50 + 140 * f), Math.round(24 + 80 * f)]; k = f * (0.35 + 0.75 * latido((tl - VUELVE) * 0.7)); }
  Ls.push({ id: 'marca', x: e.ax + hx + 0.15, y: e.ay + hy + 0.3, z: 26, r: 160, c, k, sinSombra: false });
}

// ------------------------------------------------------------------ el cielo que se rompe
/**
 * El cielo de lo alto del cuadro (como la raja del acto 4: el isométrico no mira arriba) que se raja como un vidrio desde un punto:
 * grietas en rayos y anillos quebrados, pedazos que se sueltan y caen girando sobre el mar con su destello, y por los huecos la luz
 * de oro con los escalones que suben al fondo. En el pase del mundo, en lo alto de la pantalla.
 */
function cieloRoto(e: EstadoToma, tl: number) {
  const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const ancho = b.x - a.x, alto = b.y - a.y, cx = a.x + ancho * 0.52, cy = a.y + alto * 0.17, hz = a.y + alto * 0.44;
  // el cielo de noche sobre el mar
  { const g = ctx.createLinearGradient(0, a.y, 0, hz); g.addColorStop(0, 'rgba(4,6,12,1)'); g.addColorStop(0.75, 'rgba(10,16,28,0.92)'); g.addColorStop(1, 'rgba(10,16,28,0)'); ctx.fillStyle = g; ctx.fillRect(a.x, a.y, ancho, hz - a.y); }
  const raja = Math.min(1, Math.max(0, (tl - 0.6) / 1.6)), cae = Math.max(0, tl - 3.2);
  const RAY = 13, ANI = [0.05, 0.1, 0.17, 0.26].map((f) => f * ancho);
  // los rayos (ángulo con su quiebre) y los anillos: cada celda (rayo i, anillo j) es un pedazo
  const ang = Array.from({ length: RAY }, (_, i) => (i / RAY) * Math.PI * 2 + (hash(i) - 0.5) * 0.35);
  const P = (i: number, j: number): [number, number] => { const r = j === 0 ? 0 : ANI[j - 1] * (0.85 + hash(i * 13 + j) * 0.3), an = ang[(i + RAY) % RAY] + (j ? (hash(i * 7 + j) - 0.5) * 0.12 : 0); return [cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.62]; };
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // los pedazos que ya cayeron dejan ver el oro y los escalones
  const caido = (i: number, j: number) => j >= 1 && cae > (j - 1) * 0.5 + hash(i * 3 + j) * 1.3;
  ctx.save(); ctx.beginPath(); let alguno = false;
  for (let i = 0; i < RAY; i++) for (let j = 1; j <= ANI.length; j++) if (caido(i, j) || (j === 1 && cae > 0)) { const p0 = P(i, j - 1), p1 = P(i + 1, j - 1), p2 = P(i + 1, j), p3 = P(i, j); ctx.moveTo(...p0); ctx.lineTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); alguno = true; }
  if (alguno) {
    ctx.clip();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ANI[3]); g.addColorStop(0, '#fff4d0'); g.addColorStop(0.35, '#f0c060'); g.addColorStop(1, '#8a5a18'); ctx.fillStyle = g; ctx.fillRect(cx - ANI[3], cy - ANI[3], ANI[3] * 2, ANI[3] * 2);
    // los escalones de oro: suben hacia el punto, cada vez más angostos, con su canto claro y su sombra
    for (let k = 0; k < 16; k++) { const f = 1 - k / 16, y = cy + ANI[2] * 0.55 * f, w = ANI[2] * (0.25 + 0.9 * f); ctx.fillStyle = '#6a4210'; ctx.fillRect(Math.round(cx - w / 2), Math.round(y), Math.round(w), Math.max(1, Math.round(3 * f))); ctx.fillStyle = '#ffe8a8'; ctx.fillRect(Math.round(cx - w / 2), Math.round(y) - 1, Math.round(w), 1); }
  }
  ctx.restore();
  // el resplandor del oro
  if (cae > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, cae / 1.5); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, ANI[3] * 1.6); g.addColorStop(0, `rgba(255,210,120,${0.45 * k})`); g.addColorStop(1, 'rgba(255,180,80,0)'); ctx.fillStyle = g; ctx.fillRect(cx - ANI[3] * 1.6, cy - ANI[3] * 1.6, ANI[3] * 3.2, ANI[3] * 3.2); ctx.restore(); }
  // las grietas: los rayos corren del punto hacia afuera y los anillos se cierran detrás
  const linea = (p: [number, number], q: [number, number], col: string, k: number) => { const n = Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1]) * k); ctx.fillStyle = col; for (let s = 0; s <= n; s++) { const u = n ? s / Math.ceil(Math.hypot(q[0] - p[0], q[1] - p[1])) : 0; ctx.fillRect(Math.round(p[0] + (q[0] - p[0]) * u), Math.round(p[1] + (q[1] - p[1]) * u), 1, 1); } };
  for (let i = 0; i < RAY; i++) for (let j = 1; j <= ANI.length; j++) {
    const kr = Math.min(1, Math.max(0, raja * ANI.length - (j - 1))); if (kr <= 0) continue;
    linea(P(i, j - 1), P(i, j), '#e8f0ff', kr);
    if (kr >= 1 && raja > (j + 0.5) / (ANI.length + 1)) linea(P(i, j), P(i + 1, j), '#9aa8c8', 1);
  }
  // el punto blanco donde empezó
  if (tl > 0.4) { ctx.fillStyle = '#ffffff'; ctx.fillRect(Math.round(cx) - 1, Math.round(cy) - 1, 3, 3); }
  // los pedazos que caen: el vidrio oscuro del cielo, girando, con un destello de oro en el canto; caen hasta el mar
  for (let i = 0; i < RAY; i++) for (let j = 1; j <= ANI.length; j++) {
    const t0 = (j - 1) * 0.5 + hash(i * 3 + j) * 1.3, u = cae - t0; if (u <= 0 || u > 3.2) continue;
    const c = [P(i, j - 1), P(i + 1, j - 1), P(i + 1, j), P(i, j)], mx = c.reduce((s, p) => s + p[0], 0) / 4, my = c.reduce((s, p) => s + p[1], 0) / 4;
    const dy = u * u * 60 + u * 10, dx = (mx - cx) * u * 0.25, giro = u * (hash(i + j * 5) - 0.5) * 5, esc = Math.max(0.2, 1 - u * 0.22);
    ctx.save(); ctx.translate(mx + dx, my + dy); ctx.rotate(giro); ctx.scale(esc, esc * (0.6 + 0.4 * Math.abs(Math.cos(u * 3 + i))));
    ctx.beginPath(); c.forEach((p, k) => (k ? ctx.lineTo(p[0] - mx, p[1] - my) : ctx.moveTo(p[0] - mx, p[1] - my))); ctx.closePath();
    ctx.fillStyle = '#0c1424'; ctx.fill(); ctx.strokeStyle = Math.sin(u * 9 + i) > 0.6 ? '#ffe8b0' : '#5a6a8a'; ctx.lineWidth = 1; ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// ------------------------------------------------------------------ la boca del pecho
/** Dónde queda el pecho de Aun-Saar sobre su ancla (puntos del dibujo hacia arriba). */
const PECHO = 74;
/**
 * La boca que tiene en el pecho: la carne que se abre en vertical (los labios oscuros, dos hileras de dientes y adentro un fondo que
 * alumbra en oro), o curvada hacia arriba cuando sonríe (`sonrie`). `k` lo que se abrió, 0 a 1. Guarda dónde quedó en la pantalla
 * (`e.mem.boca`, puntos lógicos) para que el nombre se escriba delante.
 */
function bocaPecho(e: EstadoToma, k: number, tl: number, sonrie = 0) {
  const m = e.actores.get('aun') as any; if (!m) return;
  const [px, py] = aPant(m.x, m.y), X = Math.round(px), Y = Math.round(py - PECHO);
  const T = ctx.getTransform(); const q = T.transformPoint(new DOMPoint(X, Y)); e.mem.boca = [q.x / RES, q.y / RES, T.a / RES];
  if (k <= 0) return;
  const alto = Math.round(26 * k), lat = 0.8 + 0.2 * Math.sin(tl * 5);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let dy = -alto; dy <= alto; dy++) {
    const f = 1 - (dy / (alto + 0.5)) ** 2, w = Math.round(7 * Math.sqrt(Math.max(0, f)) * (0.8 + 0.4 * k));
    const curva = Math.round(sonrie * ((dy / Math.max(1, alto)) ** 2) * 6);
    const x0 = X - w + curva, ww = w * 2;
    if (ww <= 0) continue;
    ctx.fillStyle = '#2a0806'; ctx.fillRect(x0 - 2, Y + dy, ww + 4, 1); // (el labio)
    ctx.fillStyle = '#5a1008'; ctx.fillRect(x0 - 1, Y + dy, ww + 2, 1);
    ctx.fillStyle = '#0a0202'; ctx.fillRect(x0, Y + dy, ww, 1); // (el adentro)
    if (Math.abs(dy) < alto * 0.6) { ctx.globalAlpha = lat * (1 - Math.abs(dy) / (alto * 0.6)); ctx.fillStyle = '#c08020'; ctx.fillRect(X - Math.max(1, Math.round(w * 0.35)) + curva, Y + dy, Math.max(2, Math.round(w * 0.7)), 1); ctx.globalAlpha = 1; }
    // los dientes: en los dos bordes, uno cada dos filas
    if (dy % 2 === 0 && Math.abs(dy) < alto - 1) { ctx.fillStyle = '#e8dcc0'; ctx.fillRect(x0, Y + dy, 2, 1); ctx.fillRect(x0 + ww - 2, Y + dy, 2, 1); }
  }
  ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(X, Y, 0, X, Y, 30); g.addColorStop(0, `rgba(255,190,90,${0.35 * k * lat})`); g.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = g; ctx.fillRect(X - 30, Y - 30, 60, 60);
  ctx.restore();
  const Ls = lucesDe(e); if (Ls) Ls.push({ id: 'boca', x: m.x + 0.4, y: m.y + 0.4, z: PECHO, r: 140, c: [255, 190, 100], k: 0.8 * k * lat, sinSombra: true });
}
/** El nombre del héroe, en oro, que la boca dice: se escribe delante de ella, late y se deshace en ceniza (encima, en la pantalla). */
function nombreDicho(e: EstadoToma, tl: number, t0: number, rajado: boolean) {
  const b = e.mem.boca; if (!b || tl < t0) return;
  const u = tl - t0, k = Math.min(1, u / 0.8) * (1 - Math.max(0, (u - 3.6) / 1.2)); if (k <= 0) return;
  const nombre = (e.heroe.nombre || '').toUpperCase(), tam = Math.max(22, Math.round(H / 16));
  ctx.save(); ctx.globalAlpha = k;
  textoGotico(rajado ? nombre.slice(0, Math.ceil(nombre.length * 0.6)) + '…' : nombre, b[0], b[1] - tam * 1.6, tam, { alin: 'center', tono: ORO, brillo: 0.3 + 0.2 * latido(u) } as any);
  ctx.restore();
  // la ceniza que se suelta de las letras al deshacerse
  if (u > 3.4) { ctx.save(); ctx.fillStyle = '#c8a060'; for (let i = 0; i < 40; i++) { const v = u - 3.4; ctx.globalAlpha = Math.max(0, 1 - v / 1.4) * hash(i); ctx.fillRect(Math.round(b[0] + (hash(i) - 0.5) * tam * nombre.length * 0.6), Math.round(b[1] - tam * 1.6 - v * 30 * hash(i + 3)), 2, 2); } ctx.restore(); }
}

// ------------------------------------------------------------------ anclas
/** En el barco varado: un punto libre cerca del medio del pueblo (donde va el barco, la pieza `cine_barco` del acto 5). */
const anclaCubierta = (z: Zona): [number, number] => { const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };
const CUBIERTA = 30 + 4, BARCO_ATRAS = 1.2, PROA: [number, number] = [2.5, -2.5];
const ponerBarco = (e: EstadoToma) => {
  despejarPies(e, 0, 0, 13); const z = e.z;
  if (z) z.objetos = z.objetos.filter((o) => !/fuente|torre|pabellon/.test(o.id) || Math.hypot(o.cx - e.ax, o.cy - e.ay) > 26);
  if (z && !z.objetos.some((o) => o.capa === 'cine')) z.objetos.push({ id: 'cine_barco', v: 'varado', cx: e.ax - 0.5 - BARCO_ATRAS, cy: e.ay - 0.5 - BARCO_ATRAS, hw: 1, hh: 1, bloquea: false, capa: 'cine' } as any);
};

// ------------------------------------------------------------------ el guion
/**
 * Tu nombre: de cerca la boca habla y el nombre se escribe en oro delante de ella. Una toma por variante (la línea cambia): sin
 * elección, destruir (el nombre sale a medias: le falta un pedazo) o absorber (la boca sonríe antes).
 */
function tomaNombre(fin: 'destruir' | 'absorber' | null, n: number): Toma {
  return {
    id: 'nombre' + (fin ? '_' + fin : ''), dur: 8, zona: 'a7_trono', ancla: anclaJefe, entra: 0.2, sale: 0.8, oscuridad: 0.92, hundir: 0.76,
    omitir: (e) => (finalDe(e.heroe) ?? null) !== fin,
    cam: [{ t: 0, x: 0.5, y: 0.5, alt: 70, zoom: 3, fy: 0.55 }, { t: 8, x: 0.45, y: 0.45, alt: 72 }],
    actores: [{ id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'quieto' }] }],
    focos: [{ de: 'aun', z: PECHO, r: 150 }],
    luces: [{ id: 'arriba', color: [230, 190, 110], sombra: true, claves: [{ t: 0, x: 0.5, y: 0.5, z: 260, r: 260, k: 0.55 }] }],
    sonidos: [{ t: 1.6, id: 'coro_vesperio', cine: true, tono: 0.5, vol: 0.8 }, { t: 1.6, id: 'sub', cine: true }],
    mundo: (e, tl) => bocaPecho(e, 1, tl, fin === 'absorber' ? Math.min(1, tl / 1.4) : 0),
    pantalla: (e, tl) => nombreDicho(e, tl, 1.6, fin === 'destruir'),
    textos: [L(n, 2.6, 7.8)],
  };
}
const HX = 2.6, HY = -0.9;
const sala = { zona: 'a6_catedral2', ancla: anclaJefe } as const;
const trono = { zona: 'a7_trono', ancla: anclaJefe } as const;
const tomas: Toma[] = [
  {
    // la Campana: la Abadesa de la Sal atada a la campana toca; el golpe corta a ×3, cae, el bronce se raja y el tañido se corta
    id: 'campana', dur: 10, ...sala, entra: 1.6, sale: 0.4, oscuridad: 0.84, hundir: 0.6,
    cam: [{ t: 0, x: 3.2, y: 1.4, alt: 62, zoom: 2, fy: 0.52 }, { t: 3.05, x: 2.2, y: 0.5, alt: 64, c: 'suave' }, { t: 3.06, x: 1.2, y: -0.4, alt: 60, zoom: 3, fy: 0.5 }, { t: 9.6, x: 1.0, y: -0.3, alt: 46, c: 'suave' }],
    actores: [
      { id: 'abadesa', tipo: 'mon', mon: 'campana_ahoga', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'especial', dur: 1.15, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.36 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX + 1.3, y: HY + 0.5, mira: [0, 0] }, { t: 2.2, x: HX + 1.3, y: HY + 0.5 }, { t: 3.0, x: HX, y: HY, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'abadesa', z: 70, r: 220 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'mar', color: [90, 190, 180], sombra: true, claves: [{ t: 0, x: -2, y: 2.5, z: 80, r: 280, k: 0.7 }, { t: 5.6, k: 0.7 }, { t: 9, k: 0.35, c: 'suave' }] },
      { id: 'sal', color: [220, 230, 235], claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.3 }] },
    ],
    sonidos: [...[0.3, 1.45, 2.6].map((t, i) => ({ t, id: 'campana', cine: true, tono: 0.62, vol: 0.7 + i * 0.1 })), { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.8 }, { t: 3.3, id: 'golpe_metal' }, { t: 5.8, id: 'campana', cine: true, tono: 0.5, vol: 1 }, { t: 5.8, id: 'golpe', cine: true }],
    temblores: [[5.8, 0.5, 3]],
    suelo: (e, tl) => arosTanido(e, tl, 5.8),
    paso: (e, tl, dt) => { const m = e.actores.get('abadesa') as any; if (m && tl > 5.6) salAbadesa(e, m.x, m.y, 2, dt); },
    mundo: (e, tl) => grietaBronce(e, tl, 5.8),
    textos: [L(0, 6.2, 9.7)],
  },
  {
    // el mar vuelve: el agua entra de golpe por la arena y rodea el barco de Oyá; ella se agarra en la proa
    id: 'mar', dur: 9, zona: 'a6_barco', ancla: anclaCubierta, objetos: ['cine_barco|varado'], entra: 0.5, sale: 0.6, oscuridad: 0.84, hundir: 0.5, lucesZona: 0.3,
    preparar: ponerBarco,
    cam: [{ t: 0, x: 1.0, y: -0.2, alt: 70, zoom: 2, fy: 0.62 }, { t: 9, x: 1.6, y: -0.8, alt: 76, c: 'suave' }],
    actores: [{ id: 'oya', tipo: 'sprite', sprite: 'oya', claves: [{ t: 0, x: PROA[0], y: PROA[1], dir: 's' }, { t: 1.4, dir: 'se' }, { t: 4.4, dir: 'n' }] }],
    focos: [{ de: [0.6, -0.6], z: 40, r: 320, k: 0.8 }, { de: 'oya', z: 70, r: 120 }],
    luces: [
      { id: 'farol', color: [255, 176, 100], sombra: true, titila: 0.2, claves: [{ t: 0, x: 5.0, y: -4.8, z: 44, r: 190, k: 0.95 }] },
      { id: 'luna', color: [120, 140, 180], sombra: true, claves: [{ t: 0, x: -6, y: 4, z: 200, r: 800, k: 0.6 }] },
    ],
    sonidos: [{ t: 0.6, id: 'mar_parte', cine: true, vol: 0.7 }],
    temblores: [[1.2, 1.4, 2]],
    paso: (e) => { const m = e.actores.get('oya') as any; if (m) m.alto = CUBIERTA; },
    suelo: (e, tl) => marVuelve(e, tl),
    textos: [L(1, 2.6, 8.6)],
  },
  {
    // la voz cambia de dueño: el héroe solo junto a la campana rajada; la Marca se para y vuelve a latir en oro
    id: 'voz', dur: 8, ...sala, entra: 0.4, sale: 0.6, oscuridad: 0.92, hundir: 0.74,
    cam: [{ t: 0, x: HX - 0.1, y: HY + 0.2, alt: 30, zoom: 3, fy: 0.52 }, { t: 8, x: HX - 0.1, y: HY + 0.25, alt: 32, c: 'suave' }],
    actores: [
      { id: 'abadesa', tipo: 'mon', mon: 'campana_ahoga', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [0, 0] }, { t: 4.2, dir: 's' }] },
    ],
    focos: [{ de: 'heroe', z: 30, r: 150 }],
    sonidos: [...[0.3, 1.4, 2.5].map((t) => ({ t, id: 'latido', cine: true })), { t: 3.8, id: 'sub', cine: true }, ...[4.2, 5.8, 7.4].map((t) => ({ t, id: 'latido', cine: true, tono: 0.7, vol: 1.3 }))],
    paso: (e, tl, dt) => {
      marcaDueno(e, tl, HX, HY);
      // la ceniza violeta que quedaba en el aire se apaga cuando la Marca calla
      if (e.j && tl < 2.6 && Math.random() < dt * 10) ceniza(e.j, e.ax + HX, e.ay + HY, 1, '#9e86c8');
      vez(e, 'vuelve', tl, 3.8, () => estallido(e.brasa, (e.ax + HX - e.ay - HY) * 16, (e.ax + HX + e.ay + HY) * 8 - 26, 18, 0.4));
    },
    textos: [L(2, 4.0, 7.8, { tono: ORO })],
  },
  {
    // el cielo se rompe sobre la costa: lo alto del cuadro se raja como un vidrio y los pedazos caen al mar; detrás, oro y escalones
    id: 'cielo', dur: 9, zona: 'a6_costa', ancla: anclaAgua(/agua/, true), entra: 0.6, sale: 0.6, oscuridad: 0.8, hundir: 0.4, sinClima: ['fx_lluvia', 'fx_tormenta'],
    cam: [{ t: 0, x: 0, y: 0, alt: 150, zoom: 1, fy: 0.72 }, { t: 9, x: -0.6, y: -0.6, alt: 170, c: 'suave' }],
    focos: [{ de: [-4, -4], z: 200, r: 460, k: 0.6 }],
    luces: [
      { id: 'luna', color: [120, 140, 180], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.35 }] },
      { id: 'oro', color: [255, 200, 110], sombra: true, claves: [{ t: 0, x: -8, y: -8, z: 600, r: 1100, k: 0 }, { t: 3.2, k: 0 }, { t: 5.2, k: 0.75, c: 'sale' }] },
    ],
    sonidos: [{ t: 0.6, id: 'hielo_cruje', cine: true, tono: 1.6 }, { t: 1.6, id: 'hielo_cruje', cine: true, tono: 1.3 }, { t: 3.2, id: 'sub', cine: true }, { t: 3.4, id: 'coro_vesperio', cine: true, tono: 1.2, vol: 0.5 }],
    temblores: [[3.2, 1.4, 2]],
    mundo: (e, tl) => cieloRoto(e, tl),
    textos: [L(3, 2.0, 8.6)],
  },
  {
    // el trono: Aun-Saar quieto en lo oscuro; en el pecho se le abre la boca
    id: 'trono', dur: 9, ...trono, entra: 0.8, sale: 0.4, oscuridad: 0.9, hundir: 0.7,
    cam: [{ t: 0, x: 2.4, y: 2.4, alt: 90, zoom: 1, fy: 0.55 }, { t: 5.5, x: 1.2, y: 1.2, alt: 80, c: 'suave' }, { t: 5.51, x: 0.8, y: 0.8, alt: 74, zoom: 2, fy: 0.52 }, { t: 9, x: 0.6, y: 0.6, alt: 74, c: 'suave' }],
    actores: [{ id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'quieto' }] }],
    focos: [{ de: 'aun', z: 70, r: 200 }],
    luces: [{ id: 'arriba', color: [230, 190, 110], sombra: true, claves: [{ t: 0, x: 0.5, y: 0.5, z: 260, r: 260, k: 0.7 }] }],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true, tono: 0.6 }, { t: 5.5, id: 'sub', cine: true }],
    paso: (e, tl, dt) => { if (e.j && Math.random() < dt * 25) ceniza(e.j, e.ax, e.ay, 1, '#8a7a6a'); },
    mundo: (e, tl) => bocaPecho(e, Math.min(1, Math.max(0, (tl - 5.6) / 2.4)), tl),
    textos: [L(4, 1.2, 8.6)],
  },
  tomaNombre(null, 5), tomaNombre('destruir', 6), tomaNombre('absorber', 7),
  {
    // la Escalera al Trono: la cámara sube por el caracol hasta la gloria con el trono a contraluz
    id: 'escalera', dur: 10, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), entra: 0.8, sale: 1.4, oscuridad: 0.55, hundir: 0.35,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a7_escaleras'); },
    cam: [{ t: 0, x: 8, y: 8, alt: 180, zoom: 0.6, fy: 0.62 }, { t: 10, x: 2, y: 2, alt: 760, c: 'suave' }],
    focos: [{ de: [-4, -4], z: 600, r: 520, k: 0.7 }],
    luces: [{ id: 'gloria', color: [255, 220, 150], claves: [{ t: 0, x: -4, y: -4, z: 800, r: 1200, k: 0.5 }, { t: 10, k: 0.9 }] }],
    sonidos: [{ t: 0.3, id: 'coro_vesperio', cine: true, tono: 0.6, vol: 0.6 }],
  },
  { id: 'acto7', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 7) },
];

export const CINE_ACTO6: Guion = { id: 'acto6', acto: 6, tomas };
void W;
