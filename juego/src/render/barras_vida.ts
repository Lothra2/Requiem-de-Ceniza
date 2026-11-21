// La barra de vida chica sobre cada enemigo herido o en pelea (Rick, 21 nov 2026: "ponle barra de salud a los enemigos
// para ver más fácil cómo están de energía"). Pixel art a puntos enteros del aparato: canto oscuro, el relleno de sangre
// con su luz arriba y su sombra abajo, el tramo recién quitado en pálido que baja después (como el dintel del jefe) y la
// placa del color de lo que es: común sin placa, campeón azul, único oro, jefe de zona oro con su gema de brasa. Los
// invocados del héroe y Thor la llevan verde, solo heridos. Los jefes de acto no: ya tienen su dintel arriba.
//
// Se anota al pintar cada cuerpo (escena.ts, `anotarBarra`) y se dibuja encima del mundo después de la luz, antes de los
// números de daño y de las frases (que la tapan: nunca al revés). Respeta la niebla: solo lo que está en una baldosa ya
// explorada y dentro de la pantalla. Nada se guarda: el estado de cada barra vive en un WeakMap del monstruo.
// `__sinBarras` la apaga; `__barrasCosto` junta lo que cuesta dibujarlas ({ n, ms, cuadros }).
import { ctx, W, H } from '../nucleo/lienzo';
import type { Juego, Monstruo } from '../juego/mundo';

/** 0 siempre, 1 en pelea (por omisión), 2 nunca. Lo fija Opciones (`opciones.barrasVida`, campo opcional). */
export const barrasVida = { modo: 1 as 0 | 1 | 2 };
(window as any).__barrasVida = barrasVida;

interface Estado { k: number; tras: number; trasT: number; golpeT: number; a: number; t: number }
const estados = new WeakMap<Monstruo, Estado>();
const pendientes: { m: Monstruo; x: number; y: number }[] = [];

/** Lo llama escena.ts al pintar un monstruo o un invocado vivo: dónde queda su cabeza en el mundo visible. */
export function anotarBarra(m: Monstruo, x: number, y: number) {
  if (barrasVida.modo === 2 || (window as any).__sinBarras) return;
  if (pendientes.length < 200) pendientes.push({ m, x, y });
}

// la placa por clase de enemigo: [borde, luz del borde]; null = sin placa (solo el canto)
type Tipo = 'comun' | 'campeon' | 'unico' | 'zona' | 'aliado';
const PLACA: Record<Tipo, [string, string] | null> = {
  comun: null,
  campeon: ['#3f5fd0', '#8ea8ff'],
  unico: ['#a8822c', '#f0d488'],
  zona: ['#b08a34', '#ffe39a'],
  aliado: null,
};
// relleno: [cuerpo, luz de arriba, sombra de abajo, la punta encendida]
const SANGRE = ['#a81616', '#e8483a', '#5c0a0a', '#ffc0a8'];
const VERDE = ['#2e9a44', '#86e092', '#145a24', '#d8ffd0'];
const ANCHO: Record<Tipo, number> = { comun: 20, campeon: 24, unico: 28, zona: 32, aliado: 18 };

function tipoDe(m: Monstruo): Tipo {
  if (m.dueno) return 'aliado';
  if (m.jefeZona) return 'zona';
  if (m.calidad >= 2) return 'unico';
  if (m.calidad === 1) return 'campeon';
  return 'comun';
}

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

/** Dibuja las barras anotadas en este cuadro (dentro del pase del mundo). */
export function dibujarBarras(j: Juego) {
  if (!pendientes.length) { (window as any).__barrasVistas = []; return; }
  const t0 = performance.now();
  const modo = barrasVida.modo, z = j.zona, h = j.heroe, enPelea = j.t - h.tCombate < 5;
  const T = ctx.getTransform(), P = Math.max(1, Math.round(T.a));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  let n = 0; const vistas: { id: number; tipo: string; x: number; y: number; w: number; a: number }[] = [];
  for (const { m, x, y } of pendientes) {
    if (m.muerto || m === j.jefe || m.def.jefe || m.vidaMax <= 0) continue;
    const k = clamp(m.vida / m.vidaMax, 0, 1);
    let st = estados.get(m);
    if (!st) { st = { k, tras: k, trasT: -9, golpeT: -99, a: 0, t: j.t }; estados.set(m, st); }
    const dt = clamp(j.t - st.t, 0, 0.1); st.t = j.t;
    if (k < st.k - 0.0005) { st.golpeT = j.t; st.trasT = j.t; }
    if (k > st.tras) st.tras = k;
    st.k = k; if (j.t - st.trasT > 0.4) st.tras = Math.max(k, st.tras - dt * 0.9);
    // ¿se ve? lo que está en lo no explorado no lleva barra, aunque el cuerpo se pinte debajo de la niebla
    const bx = Math.floor(m.x / 5), by = Math.floor(m.y / 5);
    const visto = bx >= 0 && by >= 0 && bx < z.tw && by < z.th && !!z.explorado[by * z.tw + bx];
    const tipo = tipoDe(m), herido = k < 0.999;
    let quiere = 0;
    if (!visto || m.estado === 'surgir' || (m as any).surgiendo > 0) quiere = 0;
    else if (tipo === 'aliado') quiere = herido ? 1 : 0;
    else if (modo === 0) quiere = 1;
    else quiere = j.t - st.golpeT < 4 || (herido && m.estado === 'perseguir' && enPelea) ? 1 : 0;
    st.a = quiere > st.a ? Math.min(1, st.a + dt / 0.12) : Math.max(0, st.a - dt / 0.5);
    if (st.a <= 0.01) continue;
    // a puntos del aparato
    const esc = m.escala ?? 1, wu = clamp(Math.round((ANCHO[tipo] * Math.sqrt(esc)) / 2) * 2, 16, 44);
    const hu = tipo === 'comun' || tipo === 'aliado' ? 3 : 4, placa = PLACA[tipo], bord = placa ? 1 : 0;
    const totW = wu + 2 + bord * 2, totH = hu + 2 + bord * 2;
    const dx = T.a * x + T.c * y + T.e, dy = T.b * x + T.d * y + T.f;
    const X0 = Math.round(dx - (totW * P) / 2), Y0 = Math.round(dy) - totH * P - 3 * P;
    if (X0 + totW * P < 0 || Y0 + totH * P < 0 || X0 > W * 4 * P + 4000 || Y0 > H * 4 * P + 4000) continue;
    const r = (xu: number, yu: number, w: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(X0 + xu * P, Y0 + yu * P, w * P, hh * P); };
    ctx.globalAlpha = st.a;
    if (placa) {
      r(0, 0, totW, totH, placa[0]);
      r(1, 0, totW - 2, 1, placa[1]);
      // las esquinas cortadas: la placa se lee forjada, no un rectángulo
      ctx.clearRect(X0, Y0, P, P); ctx.clearRect(X0 + (totW - 1) * P, Y0, P, P); ctx.clearRect(X0, Y0 + (totH - 1) * P, P, P); ctx.clearRect(X0 + (totW - 1) * P, Y0 + (totH - 1) * P, P, P);
    }
    // el canto oscuro y el canal vacío
    r(bord, bord, wu + 2, hu + 2, '#0b0706');
    r(bord + 1, bord + 1, wu, hu, '#24100c');
    const cx = bord + 1, cy = bord + 1, nk = Math.round(wu * k), nt = Math.round(wu * st.tras), col = tipo === 'aliado' ? VERDE : SANGRE;
    if (nt > nk) r(cx + nk, cy, nt - nk, hu, '#e8c8a0');
    if (nk > 0) {
      const bajo = k < 0.25 && tipo !== 'aliado' ? 0.5 + 0.5 * Math.sin(j.t * 9 + m.id) : 0;
      r(cx, cy, nk, hu, bajo ? `rgb(${Math.round(168 + 60 * bajo)},${Math.round(22 + 26 * bajo)},20)` : col[0]);
      r(cx, cy, nk, 1, col[1]);
      if (hu >= 3) r(cx, cy + hu - 1, nk, 1, col[2]);
      r(cx + nk - 1, cy, 1, hu, col[3]);
    }
    // marcas en los cuartos en las barras largas (las de los élites)
    if (wu >= 26) for (const q of [0.25, 0.5, 0.75]) { const qx = Math.round(wu * q); if (qx < nk) r(cx + qx, cy, 1, hu, 'rgba(0,0,0,0.45)'); }
    // el jefe de zona: la gema de brasa en la clave de arriba y dos remaches en las puntas
    if (tipo === 'zona') {
      const gx = Math.floor(totW / 2) - 1;
      r(gx - 1, -2, 4, 3, '#2a1408'); r(gx, -3, 2, 1, '#2a1408'); r(gx, -2, 2, 2, '#d8401c'); r(gx, -2, 1, 1, '#ffb070');
      r(-1, 1, 1, totH - 2, placa![0]); r(totW, 1, 1, totH - 2, placa![0]);
    }
    n++; vistas.push({ id: m.id, tipo, x: X0, y: Y0, w: totW * P, a: st.a });
  }
  ctx.restore();
  pendientes.length = 0; (window as any).__barrasVistas = vistas;
  const c = ((window as any).__barrasCosto ??= { n: 0, ms: 0, cuadros: 0 });
  c.n += n; c.ms += performance.now() - t0; c.cuadros++;
}
