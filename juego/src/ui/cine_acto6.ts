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
  const [px, py] = aPant(m.x, m.y); let x = px - 2, y = py - 46;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let s = 0; s < 36 * u; s++) { x += (hash(s) - 0.5) * 2.4 + (s % 9 < 4 ? 0.5 : -0.5); y += 1; ctx.fillStyle = '#1a1210'; ctx.fillRect(Math.round(x) + 1, Math.round(y), 1, 1); ctx.fillStyle = s > 36 * u - 4 ? '#ffffff' : '#e8f2f0'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); }
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
  const u = Math.min(1, Math.max(0, (tl - 0.6) / 5.2)), s = 1 - (1 - u) ** 2; if (s <= 0) return;
  const [cx, cy] = aPant(e.ax, e.ay), a = { x: cx - 900, y: cy - 300 }, b = { x: cx + 900, y: cy + 240 };
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
 * El cielo de lo alto del cuadro (como la raja del acto 4: el isométrico no mira arriba) que se raja como un vidrio desde un punto,
 * todo a pixel en su propio lienzo (a puntos del dibujo, pegado sin suavizar): grietas quebradas de 2 o 3 puntos que se ramifican
 * sin orden, con el filo de oro de un lado y la sombra del otro; los pedazos entre grietas se sueltan y caen girando sobre el mar
 * con su canto claro y su reflejo; y por los huecos la luz de oro con tramos de losas de mármol de canto dorado que suben en
 * perspectiva y se pierden en la luz.
 */
interface Rama { pts: [number, number][]; grueso: number; t0: number }
let lienzoCielo: { c: HTMLCanvasElement; g: CanvasRenderingContext2D; f: HTMLCanvasElement; fg: CanvasRenderingContext2D } | null = null;
let ramasCielo: Rama[] | null = null;
function armarRamas(): Rama[] {
  const R: Rama[] = []; let sem = 7;
  const rnd = () => { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; };
  const crecer = (x: number, y: number, an: number, largo: number, grueso: number, t0: number, nivel: number) => {
    const pts: [number, number][] = [[x, y]];
    for (let i = 0; i < largo; i++) {
      an += (rnd() - 0.5) * 0.45; const paso = 4 + rnd() * 6; x += Math.cos(an) * paso; y += Math.sin(an) * paso * 0.62; pts.push([x, y]);
      if (nivel < 1 && rnd() < 0.2) crecer(x, y, an + (rnd() < 0.5 ? -1 : 1) * (0.6 + rnd() * 0.8), Math.floor(largo * (0.3 + rnd() * 0.4)), Math.max(1, grueso - 1), t0 + i * 0.05, nivel + 1);
    }
    R.push({ pts, grueso, t0 });
  };
  for (let i = 0; i < 11; i++) crecer(0, 0, (i / 11) * Math.PI * 2 + (rnd() - 0.5) * 0.4, 10 + Math.floor(rnd() * 10), 3, rnd() * 0.3, 0);
  return R;
}
function cieloRoto(e: EstadoToma, tl: number) {
  const m = ctx.getTransform().inverse(), a = m.transformPoint(new DOMPoint(0, 0)), b = m.transformPoint(new DOMPoint(ctx.canvas.width, ctx.canvas.height));
  const LW = Math.ceil(b.x - a.x), LH = Math.ceil((b.y - a.y) * 0.56), cx = Math.round(LW * 0.52), cy = Math.round(LH * 0.46), E2 = Math.max(1, LW / 300);
  if (!lienzoCielo) { const c = document.createElement('canvas'), f = document.createElement('canvas'); lienzoCielo = { c, g: c.getContext('2d')!, f, fg: f.getContext('2d')! }; }
  const { c, g, f, fg } = lienzoCielo; if (c.width !== LW || c.height !== LH) { c.width = f.width = LW; c.height = f.height = LH; }
  const ramas = (ramasCielo ??= armarRamas());
  const raja = Math.max(0, (tl - 0.5) / 1.8), cae = Math.max(0, tl - 3.0);
  g.clearRect(0, 0, LW, LH); g.imageSmoothingEnabled = false;
  // el cielo de noche (se funde hacia abajo con el mar)
  { const gr = g.createLinearGradient(0, 0, 0, LH); gr.addColorStop(0, 'rgba(4,6,12,1)'); gr.addColorStop(0.8, 'rgba(10,16,28,0.9)'); gr.addColorStop(1, 'rgba(10,16,28,0)'); g.fillStyle = gr; g.fillRect(0, 0, LW, LH); }
  // los huecos: los pedazos entre dos ramas grandes vecinas, del anillo que ya cayó
  const esc2 = (r: Rama): Rama => ({ ...r, pts: r.pts.map(([x, y]) => [x * E2, y * E2] as [number, number]) });
  const ramasE = ramas.map(esc2);
  const grandes = ramasE.filter((r) => r.grueso === 3).sort((p, q) => Math.atan2(p.pts[3][1], p.pts[3][0]) - Math.atan2(q.pts[3][1], q.pts[3][0]));
  const pedazos: { poli: [number, number][]; t0: number; k: number }[] = [];
  for (let i = 0; i < grandes.length; i++) {
    const A = grandes[i].pts, B = grandes[(i + 1) % grandes.length].pts;
    for (const [i0, i1, k] of [[0, 5, 0], [5, 10, 1], [10, 15, 2]] as [number, number, number][]) {
      if (A.length <= i1 || B.length <= i1) continue;
      pedazos.push({ poli: [...A.slice(i0, i1 + 1), ...B.slice(i0, i1 + 1).reverse()], t0: k * 0.6 + ((i * 37) % 10) / 12, k });
    }
  }
  // lo de atrás: la luz de oro y la escalera, por el agujero quebrado que se abre desde el punto a medida que caen los pedazos
  const Rh = Math.min(1, cae / 2.6) * LW * 0.2;
  if (Rh > 2) {
    fg.clearRect(0, 0, LW, LH); fg.globalCompositeOperation = 'source-over'; fg.imageSmoothingEnabled = false;
    const gl = fg.createRadialGradient(cx, cy - Rh * 0.5, 0, cx, cy - Rh * 0.3, LW * 0.22); gl.addColorStop(0, '#fff6dc'); gl.addColorStop(0.25, '#f0c070'); gl.addColorStop(0.6, '#8a5a1c'); gl.addColorStop(1, '#2a1606'); fg.fillStyle = gl; fg.fillRect(0, 0, LW, LH);
    // la escalera: losas de mármol en rombo (como se ven en el mundo), con su canto de oro, que suben en caracol hacia el punto y
    //  se pierden en la luz
    for (let k = 26; k >= 0; k--) {
      const u = k / 26, x = Math.round(cx + Math.sin(u * 6) * 46 * (1 - u * 0.7) * E2), y = Math.round(cy - Rh * 0.45 + (1 - u) * Rh * 1.0), w = Math.round(30 * E2 * (1 - u * 0.75)), h = Math.max(2, Math.round(w / 2)), g2 = Math.max(1, Math.round(5 * E2 * (1 - u * 0.7)));
      fg.globalAlpha = 1 - Math.min(0.8, u * 0.9);
      fg.fillStyle = '#2a1c10'; fg.beginPath(); fg.moveTo(x - w, y); fg.lineTo(x, y + h); fg.lineTo(x, y + h + g2); fg.lineTo(x - w, y + g2); fg.closePath(); fg.fill();
      fg.fillStyle = '#7a6040'; fg.beginPath(); fg.moveTo(x + w, y); fg.lineTo(x, y + h); fg.lineTo(x, y + h + g2); fg.lineTo(x + w, y + g2); fg.closePath(); fg.fill();
      fg.fillStyle = '#d8ccb2'; fg.beginPath(); fg.moveTo(x - w, y); fg.lineTo(x, y - h); fg.lineTo(x + w, y); fg.lineTo(x, y + h); fg.closePath(); fg.fill();
      fg.fillStyle = '#e8b048'; fg.fillRect(x - w, y, w * 2, 1); fg.fillRect(x, y + h, 1, g2);
    }
    fg.globalAlpha = 1; fg.globalCompositeOperation = 'destination-in'; fg.beginPath();
    for (let i = 0; i < 26; i++) { const an = (i / 26) * Math.PI * 2, r = Rh * (0.55 + 0.45 * hash(i * 3 + 1)) * (i % 2 ? 0.78 : 1); const X = cx + Math.cos(an) * r, Y = cy + Math.sin(an) * r * 0.66; i ? fg.lineTo(X, Y) : fg.moveTo(X, Y); }
    fg.closePath(); fg.fillStyle = '#000'; fg.fill(); fg.globalCompositeOperation = 'source-over';
    g.drawImage(f, 0, 0);
  }
  // las grietas: cuerpo claro de 2 o 3 puntos, filo de oro de un lado y sombra del otro; crecen desde el punto
  for (const r of ramasE) {
    const n = Math.floor(Math.min(1, Math.max(0, (raja - r.t0) * 1.4)) * r.pts.length); if (n < 2) continue;
    for (let i = 1; i < n; i++) {
      const [x0, y0] = r.pts[i - 1], [x1, y1] = r.pts[i], L = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))), w = Math.max(1, r.grueso - (i > r.pts.length * 0.6 ? 1 : 0));
      for (let s2 = 0; s2 <= L; s2++) {
        const X = Math.round(cx + x0 + (x1 - x0) * s2 / L), Y = Math.round(cy + y0 + (y1 - y0) * s2 / L);
        g.fillStyle = '#04060a'; g.fillRect(X + 1, Y + 1, w, w);
        g.fillStyle = '#b8c8dc'; g.fillRect(X, Y, w, w);
        g.fillStyle = cae > 0 || Math.sin(tl * 3 + i) > 0 ? '#ffd27a' : '#e8f0fa'; g.fillRect(X, Y - 1, w, 1);
      }
    }
  }
  if (tl > 0.3) { g.fillStyle = '#ffffff'; g.fillRect(cx - 1, cy - 1, 3, 3); }
  // los pedazos que caen: vidrio del color del cielo con su canto claro y un reflejo en diagonal, girando hasta el mar
  for (const p of pedazos) {
    const u = cae - p.t0 * 0.8; if (u <= 0 || u > 3.4) continue;
    const mx = p.poli.reduce((s2, q) => s2 + q[0], 0) / p.poli.length, my = p.poli.reduce((s2, q) => s2 + q[1], 0) / p.poli.length;
    g.save(); g.translate(Math.round(cx + mx + mx * u * 0.3), Math.round(cy + my + (u * u * 34 + u * 8) * E2)); g.rotate(u * ((p.t0 * 7) % 2 - 1) * 2.4);
    const esc = Math.max(0.25, 1 - u * 0.2); g.scale(esc, esc * (0.55 + 0.45 * Math.abs(Math.cos(u * 2.6 + p.t0 * 5))));
    g.beginPath(); p.poli.forEach(([x, y], k) => (k ? g.lineTo(x - mx, y - my) : g.moveTo(x - mx, y - my))); g.closePath();
    g.fillStyle = '#141e32'; g.fill(); g.strokeStyle = '#c8d8ec'; g.lineWidth = 1; g.stroke();
    g.strokeStyle = Math.sin(u * 7 + p.t0 * 3) > 0.3 ? 'rgba(255,230,170,0.9)' : 'rgba(150,170,200,0.6)'; g.beginPath(); g.moveTo(-6, -3); g.lineTo(5, 3); g.stroke();
    g.restore();
  }
  ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(c, Math.round(a.x), Math.round(a.y)); 
  if (cae > 0) { ctx.globalCompositeOperation = 'lighter'; const k = Math.min(1, cae / 1.5), X = a.x + cx, Y = a.y + cy, gr = ctx.createRadialGradient(X, Y, 0, X, Y, LW * 0.35); gr.addColorStop(0, `rgba(255,210,120,${0.35 * k})`); gr.addColorStop(1, 'rgba(255,180,80,0)'); ctx.fillStyle = gr; ctx.fillRect(X - LW * 0.35, Y - LW * 0.35, LW * 0.7, LW * 0.7); }
  ctx.restore();
  void e;
}

// ------------------------------------------------------------------ la boca del pecho
/** Dónde queda el pecho de Aun-Saar sobre su ancla (puntos del dibujo hacia arriba). */
const PECHO = 130;
/**
 * La boca que tiene en el pecho, sobre la que ya trae el cuerpo (la tapa entera): cerrada es la carne pálida del pecho con la
 * costura; al abrirse la carne se parte en vertical con los labios húmedos oscuros (con su brillo), una hilera de dientes finos a
 * cada lado y una garganta que alumbra de oro desde adentro. `k` lo que se abrió, 0 a 1; `sonrie` tira de las comisuras. Guarda
 * dónde quedó en la pantalla (`e.mem.boca`, puntos lógicos) para que el nombre se escriba delante.
 */
function bocaPecho(e: EstadoToma, k: number, tl: number, sonrie = 0) {
  const m = e.actores.get('aun') as any; if (!m) return;
  const [px, py] = aPant(m.x, m.y), X = Math.round(px), Y = Math.round(py - PECHO);
  const T = ctx.getTransform(); const q = T.transformPoint(new DOMPoint(X, Y)); e.mem.boca = [q.x / RES, q.y / RES, T.a / RES];
  const ALTO = 27, ANCHO = 13, lat = 0.8 + 0.2 * Math.sin(tl * 5), ruido = (a: number, b: number) => { const v = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return v - Math.floor(v); };
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // la carne del pecho que tapa la boca del cuerpo (con su grano y sus pliegues)
  for (let dy = -ALTO - 3; dy <= ALTO + 3; dy++) {
    const f = 1 - (dy / (ALTO + 3.5)) ** 2, w = Math.round(ANCHO * Math.sqrt(Math.max(0, f)) + 2); if (w <= 0) continue;
    for (let dx = -w; dx < w; dx++) { const n = ruido(dx, dy); ctx.fillStyle = Math.abs(dx) > w - 2 ? '#6e625a' : n < 0.15 ? '#7e7066' : n > 0.85 ? '#b2a296' : (dy + dx * 0.3) % 6 === 0 ? '#86786c' : '#9c8e82'; ctx.fillRect(X + dx, Y + dy, 1, 1); }
  }
  // la costura (cerrada)
  ctx.fillStyle = '#3a2620'; ctx.fillRect(X, Y - ALTO + 2, 1, ALTO * 2 - 4);
  if (k > 0) {
    const alto = Math.round(ALTO * Math.min(1, k * 1.1)), abre = k;
    for (let dy = -alto; dy <= alto; dy++) {
      const f = 1 - (dy / (alto + 0.5)) ** 2, w = Math.round((ANCHO - 3) * Math.pow(Math.max(0, f), 0.6) * abre), cur = Math.round(sonrie * Math.pow(Math.abs(dy) / Math.max(1, alto), 2) * 4);
      if (w <= 0) { ctx.fillStyle = '#3a2620'; ctx.fillRect(X, Y + dy, 1, 1); continue; }
      const x0 = X - w - cur, x1 = X + w + cur;
      // los labios: oscuros y húmedos, con el brillo del lado de la luz
      ctx.fillStyle = '#2a0808'; ctx.fillRect(x0 - 2, Y + dy, 2, 1); ctx.fillRect(x1, Y + dy, 2, 1);
      if ((dy + 30) % 7 < 2) { ctx.fillStyle = '#c06a5a'; ctx.fillRect(x0 - 2, Y + dy, 1, 1); }
      ctx.fillStyle = '#5a1410'; ctx.fillRect(x0, Y + dy, 1, 1); ctx.fillRect(x1 - 1, Y + dy, 1, 1);
      // la garganta: oscura en la orilla y de oro hacia el fondo
      for (let dx = x0 + 1; dx < x1 - 1; dx++) { const r = Math.abs(dx - X) / Math.max(1, w) * 0.7 + Math.abs(dy) / alto * 0.5; ctx.fillStyle = r > 0.8 ? '#1a0303' : r > 0.55 ? '#4a0c06' : r > 0.32 ? '#a04a14' : r > 0.16 ? '#e09a3a' : '#ffe2a0'; ctx.fillRect(dx, Y + dy, 1, 1); }
      // los dientes: finos y en hilera, uno por fila con un hueco cada tanto
      if (Math.abs(dy) < alto - 1 && (dy + 40) % 4 !== 3) { ctx.fillStyle = (dy + 40) % 2 ? '#e8dcc4' : '#c8b8a0'; ctx.fillRect(x0 + 1, Y + dy, 2, 1); ctx.fillRect(x1 - 3, Y + dy, 2, 1); }
    }
    ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(X, Y, 0, X, Y, 34); gr.addColorStop(0, `rgba(255,190,90,${0.4 * k * lat})`); gr.addColorStop(1, 'rgba(255,150,60,0)'); ctx.fillStyle = gr; ctx.fillRect(X - 34, Y - 34, 68, 68);
  }
  ctx.restore();
  const Ls = lucesDe(e); if (Ls && k > 0) Ls.push({ id: 'boca', x: m.x + 0.4, y: m.y + 0.4, z: PECHO, r: 140, c: [255, 190, 100], k: 0.8 * k * lat, sinSombra: true });
}
/** El nombre del héroe, en oro y grande, que la boca dice: se escribe delante de ella, en el medio, late y se deshace en ceniza. */
function nombreDicho(e: EstadoToma, tl: number, t0: number, rajado: boolean) {
  const b = e.mem.boca; if (!b || tl < t0) return;
  const u = tl - t0, k = Math.min(1, u / 0.8) * (1 - Math.max(0, (u - 3.6) / 1.2)); if (k <= 0) return;
  const completo = (e.heroe.nombre || '').toUpperCase(), nombre = rajado ? completo.slice(0, Math.ceil(completo.length * 0.6)) : completo;
  const tam = Math.max(44, Math.round(H / 6.2)), x = b[0], y = b[1] + tam * 0.36;
  ctx.save(); ctx.globalAlpha = k;
  // (una sombra que lo despega de la boca: se lee a la primera)
  const gr = ctx.createRadialGradient(x, b[1], 0, x, b[1], tam * Math.max(2, nombre.length * 0.45)); gr.addColorStop(0, 'rgba(0,0,0,0.6)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = gr; ctx.fillRect(x - tam * 6, b[1] - tam * 2, tam * 12, tam * 4);
  textoGotico(nombre, x, y, tam, { alin: 'center', tono: ORO, brillo: 0.3 + 0.25 * latido(u) } as any);
  ctx.restore();
  if (u > 3.4) { ctx.save(); ctx.fillStyle = '#c8a060'; for (let i = 0; i < 60; i++) { const v = u - 3.4; ctx.globalAlpha = Math.max(0, 1 - v / 1.4) * hash(i); ctx.fillRect(Math.round(x + (hash(i) - 0.5) * tam * nombre.length * 0.7), Math.round(b[1] - v * 40 * hash(i + 3)), 2, 2); } ctx.restore(); }
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
    cam: [{ t: 0, x: 0.5, y: 0.5, alt: 128, zoom: 3, fy: 0.52 }, { t: 8, x: 0.45, y: 0.45, alt: 130 }],
    actores: [{ id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'quieto' }] }],
    focos: [{ de: 'aun', z: PECHO, r: 150 }],
    luces: [{ id: 'arriba', color: [230, 190, 110], sombra: true, claves: [{ t: 0, x: 0.5, y: 0.5, z: 260, r: 260, k: 0.55 }] }],
    sonidos: [{ t: 1.6, id: 'coro_vesperio', cine: true, tono: 0.5, vol: 0.8 }, { t: 1.6, id: 'sub', cine: true }],
    mundo: (e, tl) => bocaPecho(e, 1, tl, fin === 'absorber' ? Math.min(1, tl / 1.4) : 0),
    pantalla: (e, tl) => nombreDicho(e, tl, 1.6, fin === 'destruir'),
    textos: [L(n, 2.6, 7.8)],
  };
}
const HX = -3.2, HY = 0.4;
const sala = { zona: 'a6_catedral2', ancla: anclaJefe } as const;
const trono = { zona: 'a7_trono', ancla: anclaJefe } as const;
const tomas: Toma[] = [
  {
    // la Campana: la Abadesa de la Sal atada a la campana toca; el golpe corta a ×3, cae, el bronce se raja y el tañido se corta
    id: 'campana', dur: 10, ...sala, entra: 1.6, sale: 0.4, oscuridad: 0.84, hundir: 0.6,
    cam: [{ t: 0, x: 3.2, y: 1.4, alt: 62, zoom: 2, fy: 0.52 }, { t: 3.05, x: 2.2, y: 0.5, alt: 64, c: 'suave' }, { t: 3.06, x: 1.2, y: -0.4, alt: 60, zoom: 3, fy: 0.5 }, { t: 9.6, x: 1.0, y: -0.3, alt: 46, c: 'suave' }],
    actores: [
      { id: 'abadesa', tipo: 'mon', mon: 'campana_ahoga', sombra: ['#e4e8e2', 0.38], claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'especial', dur: 1.15, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.36 }] },
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
    paso: (e, tl, dt) => { const m = e.actores.get('abadesa') as any; if (m) salAbadesa(e, m.x, m.y, tl > 5.6 ? 3 : 1, dt); },
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
