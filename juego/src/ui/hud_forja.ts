// El HUD forjado, el de por omisión (Opciones, HUD: Clásico vuelve a la barra de siempre con opciones.hud = 'clasico').
// PC: un solo panel de piedra tallada de borde a borde sobre el mundo, bajo en el medio y alto en las esquinas, donde
// van los orbes en sus casas de arco apuntado, con una gárgola agazapada junto a la vida y una doliente con su vela
// junto al maná. En el medio el cinturón de cuatro en su bandeja hundida (con las cuentas de lo apilado en cada columna),
// los dos poderes en sus pozos de latón, diez atajos con su tecla grabada, el recurso de la clase, el correr, las placas
// del menú y la experiencia corriendo por la cornisa hasta el rosetón. En pantallas anchas los extremos siguen con muro
// tallado y el medio no se estira.
// Todo es pixel a punto entero del aparato: el panel se pinta en "puntos de dibujo" de D puntos del lienzo cada uno
// (1 a 720, 2 a 1080 y 1440, 3 a 2160) y lo fijo se hornea una vez por tamaño (forja_taller.ts). Por cuadro solo
// cambian los orbes, las recargas, los íconos, las cuentas y los números.
import { ctx, E, RES, fijarAltoHud } from '../nucleo/lienzo';
import { botonForjado } from '../../../src/engine/gotico/hud';
import { orbeVivo, nivelVisto, CUADROS_LIQ } from './forja_orbe';
import { T, TT, dentro, icono, rasterACanvas, cacheRaster } from './comun';
import { ui, alternar, casillaPoder, casillaAtajo, casillaCinturon, fichasBarra, pistaRoseton, recursoClase, botonesTactilesBarra, cambiarAgresivo, COLOR_POCION, type PanelId } from './juego_ui';
import { hud } from './hud_rects';
import { habilidadDe, costoMana, usarPocion, type Juego } from '../juego/mundo';
import { cant, nivelHab, tiposCinturon, xpPara, NIVEL_MAX, PILA_CINTURON, type DatosHeroe } from '../juego/heroe';
import { dibujarRoseton } from './sello_nivel';
import { casillaPoderForjada, type EstadoCasilla } from './forja_habilidad';
import type { Habilidad } from '../datos/clases';
import { hash, cl } from './forja_taller';
import { geometria, tallarMarco, grabarTeclas, cajaAtajos, rectAtajo, grabarAtajos, type Geo } from './forja_panel';
import { Taller, M } from './forja_taller';
import { textoPixel, anchoPixel } from './letra_pixel';

/** El espacio del dibujo: D puntos del lienzo por punto, el ancho y alto en puntos y dónde cae el origen. */
export interface Esp { D: number; Wa: number; Ha: number; ox: number; oy: number }
export function espacio(): Esp {
  const cw = ctx.canvas.width, ch = ctx.canvas.height, D = Math.max(1, Math.round(RES * 1.15));
  const Wa = Math.floor(cw / D), Ha = Math.floor(ch / D);
  return { D, Wa, Ha, ox: Math.floor((cw - Wa * D) / 2), oy: ch - Ha * D };
}

let marco: { clave: string; cv: HTMLCanvasElement; llenos: HTMLCanvasElement; cajaL: [number, number, number, number]; w: number; h: number; mascara: Uint8Array; g: Geo } | null = null;
function marcoDe(e: Esp): typeof marco {
  const clave = `${e.Wa}x${e.Ha}x${e.D}`;
  if (marco && marco.clave === clave) return marco;
  const g = geometria(e.Wa, e.Ha); if (!g) { marco = null; return null; }
  const t0 = performance.now();
  const tl = tallarMarco(g), l = tl.hornear({ sombraMundo: 7 });
  grabarTeclas(l, g);
  const mascara = new Uint8Array(tl.w * tl.h); for (let i = 0; i < mascara.length; i++) mascara[i] = tl.mat[i] ? 1 : 0;
  // el pedazo de los atajos llenos (bisel entero y tecla de latón): se pega encima de cada atajo con poder
  const cajaL = cajaAtajos(g), ll = tallarMarco(g, true).recorte(...cajaL).hornear({ sombraMundo: 0 });
  grabarAtajos(ll, g, cajaL[0], cajaL[1]);
  marco = { clave, cv: aumentar(rasterACanvas(l.r), e.D), llenos: aumentar(rasterACanvas(ll.r), e.D), cajaL, w: tl.w, h: tl.h, mascara, g };
  (window as any).__hudForjaMs = Math.round(performance.now() - t0);
  return marco;
}

// ------------------------------------------------------------------ orbes
/** Los cuadros del orbe (forja_orbe.ts) por nivel (a punto entero del líquido) y cuadro, guardados los últimos 160. */
export const cuadroLiq = (t: number) => Math.floor(t * 10) % CUADROS_LIQ;
const orbes = new Map<string, HTMLCanvasElement>();
let hechosCuadro = 0;
/** Al empezar el cuadro: cuántos cuadros de orbe nuevos se pueden pintar (dos). */
export const nuevoCuadroOrbes = () => { hechosCuadro = 0; };
export function cuadroOrbe(tipo: string, k: number, f: number, R: number, ultimo: HTMLCanvasElement | null): HTMLCanvasElement | null {
  const q = Math.round(cl(k) * 2 * R), clave = `${tipo}|${R}|${q}|${f}`;
  let c = orbes.get(clave);
  if (c) { orbes.delete(clave); orbes.set(clave, c); return c; }
  if (hechosCuadro >= 2 && ultimo) return ultimo;
  hechosCuadro++;
  c = rasterACanvas(orbeVivo(tipo as 'vida', q / (2 * R), f, R));
  orbes.set(clave, c); if (orbes.size > 160) orbes.delete(orbes.keys().next().value!);
  return c;
}
const ultimoOrbe: Record<string, HTMLCanvasElement | null> = {};
/** El latido de la vida baja: dos golpes (lub-dub) por ciclo, más rápido cuanto menos vida. 0 a 1. */
export function latido(k: number, t: number): number {
  if (k >= 0.3) return 0;
  const bpm = 64 + 70 * (1 - k / 0.3), p = ((t * bpm) / 60) % 1;
  const g = (c: number, w: number) => Math.exp(-(((p - c) / w) ** 2));
  return Math.min(1, g(0.06, 0.05) + 0.7 * g(0.27, 0.06)) * (0.55 + 0.45 * (1 - k / 0.3));
}

// ------------------------------------------------------------------ dibujo por cuadro
const rectos: Record<string, [number, number, number, number]> = {};
(window as any).__hudForja = () => ({ ...rectos });
const PLACA: Record<string, { picto: string; panel?: PanelId | 'mapa'; lado?: 'izq' | 'der'; es: string; en: string; tecla: string }> = {
  pers: { picto: 'personaje', panel: 'pers', lado: 'izq', es: 'Personaje', en: 'Character', tecla: 'C' },
  inv: { picto: 'inventario', panel: 'inv', lado: 'der', es: 'Inventario', en: 'Inventory', tecla: 'I' },
  habs: { picto: 'habilidades', panel: 'habs', lado: 'der', es: 'Habilidades', en: 'Skills', tecla: 'T' },
  mapa: { picto: 'mapa', panel: 'mapa', es: 'Mapa', en: 'Map', tecla: 'Tab' },
  menu: { picto: 'menu', panel: 'menu', lado: 'izq', es: 'Menú', en: 'Menu', tecla: 'Esc' },
  agresivo: { picto: 'espada', es: 'Agresivo', en: 'Aggressive', tecla: 'Z' },
};

/**
 * El panel de PC. Devuelve false si la pantalla es demasiado angosta para el panel (entonces va la barra de siempre).
 */
export function dibujarHudForja(j: Juego, t: number): boolean {
  for (const k of ['agresivo', 'golpe', 'poder', 'barra', 'casaVida', 'casaMana', 'forjaMsg']) delete hud[k];
  const e = espacio(), mc = marcoDe(e);
  if (!mc) { fijarAltoHud(96); return false; }
  const g = mc.g, tt = g.t, D = e.D, oyF = e.oy + (e.Ha - g.HF) * D;
  // de puntos del marco a puntos del lienzo (dev) y a puntos lógicos (log)
  const dx = (x: number) => e.ox + x * D, dy = (y: number) => oyF + y * D, lx = (x: number) => dx(x) / RES, ly = (y: number) => dy(y) / RES;
  const rect = (x: number, y: number, w: number, h: number): [number, number, number, number] => [lx(x), ly(y), (w * D) / RES, (h * D) / RES];
  // la cámara: el héroe en el medio de lo que queda arriba de la banda (más un poco por las esquinas)
  fijarAltoHud(Math.round(((g.t.hC + 10) * D) / RES));
  // con un panel abierto en una pantalla baja la barra no va (taparía el panel), igual que la de siempre
  const h = j.heroe, d = h.d;
  hechosCuadro = 0;
  const f8 = cuadroLiq(t);
  const enDev = (fn: () => void) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; try { fn(); } finally { ctx.restore(); } };
  const pegar = (cv: CanvasImageSource, x: number, y: number, w: number, hh: number) => ctx.drawImage(cv, dx(x), dy(y), w * D, hh * D);

  // ---- el marco y los orbes (debajo de todo lo demás)
  const kV = h.vida / Math.max(1, h.vidaMax), kM = h.mana / Math.max(1, h.c.manaMax), lat = latido(kV, t);
  enDev(() => {
    ctx.drawImage(mc.cv, e.ox, oyF);
    for (const [tipo, k, [cx, cy], id] of [[h.veneno > 0 ? 'veneno' : h.frio > 0 ? 'helado' : 'vida', kV, g.orbV, 'v'], ['mana', kM, g.orbM, 'm']] as [string, number, [number, number], string][]) {
      const c = cuadroOrbe(tipo, k, f8, tt.R, ultimoOrbe[id]); if (!c) continue; ultimoOrbe[id] = c;
      const S = c.width; pegar(c, Math.round(cx - S / 2), Math.round(cy - S / 2), S, S);
      // el brillo de adentro: el líquido alumbra el vidrio desde el fondo
      const rr = tt.R * D, gx = dx(cx), gy = dy(cy) + rr * (1 - 2 * nivelVisto(k)) * 0.5 + rr * 0.3;
      const col = id === 'v' ? '255,70,40' : '80,120,255';
      const gl = ctx.createRadialGradient(gx, gy, 0, gx, gy, rr * 0.9);
      gl.addColorStop(0, `rgba(${col},${0.1 + (id === 'v' ? lat * 0.35 : 0)})`); gl.addColorStop(1, `rgba(${col},0)`);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath(); ctx.arc(dx(cx), dy(cy), rr, 0, Math.PI * 2); ctx.clip(); ctx.fillStyle = gl; ctx.fillRect(dx(cx) - rr, dy(cy) - rr, rr * 2, rr * 2); ctx.restore();
    }
    // el latido: un halo rojo que golpea dos veces alrededor de la casa de la vida
    if (lat > 0.01) {
      const [cx, cy] = g.orbV, r0 = (tt.R + 14) * D, gx = dx(cx), gy = dy(cy);
      const gl = ctx.createRadialGradient(gx, gy, r0 * 0.9, gx, gy, r0 * 1.7);
      gl.addColorStop(0, `rgba(255,30,20,${0.42 * lat})`); gl.addColorStop(1, 'rgba(255,30,20,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(gx - r0 * 1.7, gy - r0 * 1.7, r0 * 3.4, r0 * 3.4); ctx.restore();
    }
    // los ojos de la gárgola: brasas que laten con la vida baja
    for (const [ox, oy] of g.ojos) {
      const a = 0.45 + 0.15 * Math.sin(t * 2.3) + lat * 0.55;
      ctx.fillStyle = `rgba(255,${Math.round(90 + 80 * (1 - lat))},40,${cl(a)})`; ctx.fillRect(dx(Math.floor(ox)), dy(Math.floor(oy)), D, D);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(dx(ox), dy(oy), 0, dx(ox), dy(oy), 5 * D); gl.addColorStop(0, `rgba(255,80,30,${0.3 * a})`); gl.addColorStop(1, 'rgba(255,80,30,0)'); ctx.fillStyle = gl; ctx.fillRect(dx(ox) - 5 * D, dy(oy) - 5 * D, 10 * D, 10 * D); ctx.restore();
    }
    // la vela de la doliente: una llama de tres puntos que tiembla
    { const [fx, fy] = g.llama, tl = Math.floor(t * 9), al = 2 + ((hash(tl, 1, 3) * 3) | 0), lx0 = Math.round(fx) + (hash(tl, 2, 3) < 0.25 ? -1 : hash(tl, 2, 3) > 0.8 ? 1 : 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(dx(fx), dy(fy - 1), 0, dx(fx), dy(fy - 1), 14 * D); gl.addColorStop(0, `rgba(255,170,70,${0.22 + hash(tl, 4, 3) * 0.06})`); gl.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = gl; ctx.fillRect(dx(fx) - 14 * D, dy(fy) - 15 * D, 28 * D, 28 * D); ctx.restore();
      for (let k = 0; k < al; k++) { ctx.fillStyle = k === 0 ? '#fff4c8' : k === 1 ? '#ffc858' : '#e86414'; ctx.fillRect(dx(k > 1 ? lx0 : Math.round(fx)), dy(Math.round(fy) - k), D, D); } }
  });
  // los números del orbe al pasar por encima
  for (const [cx, cy, id] of [[g.orbV[0], g.orbV[1], 'vida'], [g.orbM[0], g.orbM[1], 'mana']] as [number, number, string][]) {
    const r = rect(cx - tt.R, cy - tt.R, tt.R * 2, tt.R * 2); rectos[id === 'vida' ? 'orbeVida' : 'orbeMana'] = r;
    if (!ui.mano && Math.hypot(E.x - (r[0] + r[2] / 2), E.y - (r[1] + r[3] / 2)) < r[2] / 2) {
      const v = id === 'vida' ? `${T('Vida', 'Life')}: ${Math.ceil(h.vida)} / ${h.vidaMax}` : `${T('Maná', 'Mana')}: ${Math.floor(h.mana)} / ${h.c.manaMax}`;
      letrero(v, r[0] + r[2] / 2, r[1] - 8, D, id === 'vida' ? '#ffb0a0' : '#b8c8ff');
    }
  }
  hud.casaVida = rect(g.casaV, g.apex, tt.CASA, g.B - g.apex); hud.casaMana = rect(g.casaM, g.apex, tt.CASA, g.B - g.apex);
  hud.barra = rect(g.casaV, g.yT, g.casaM + tt.CASA - g.casaV, tt.hC); rectos.panel = hud.barra;
  hud.forjaMsg = rect(g.x0, Math.min(g.apex, g.yT - 100 * tt.f), 10, 10);

  // ---- la experiencia por la cornisa: oro fundido con su luz arriba, su sombra abajo y una muesca cada décimo
  { const x0 = xpPara(d.nivel), x1 = xpPara(d.nivel + 1), kx = d.nivel >= NIVEL_MAX ? 1 : cl((d.xp - x0) / Math.max(1, x1 - x0));
    const [ex, ey, ew, eh] = g.xp, n = Math.round(ew * kx);
    enDev(() => {
      if (n > 0) { ctx.fillStyle = '#b8952f'; ctx.fillRect(dx(ex), dy(ey), n * D, eh * D); ctx.fillStyle = '#f2cc60'; ctx.fillRect(dx(ex), dy(ey), n * D, D); ctx.fillStyle = '#6a4a14'; ctx.fillRect(dx(ex), dy(ey + eh - 1), n * D, D);
        // un brillo que corre por el oro
        const bx = Math.floor(((t * 40) % (ew + 60)) - 30); if (bx > 0 && bx < n) { ctx.fillStyle = 'rgba(255,240,180,0.7)'; ctx.fillRect(dx(ex + bx), dy(ey + 1), D * 2, (eh - 2) * D); }
        ctx.fillStyle = '#fff0b0'; ctx.fillRect(dx(ex + n - 1), dy(ey), D, eh * D); }
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; for (let i = 1; i < 10; i++) ctx.fillRect(dx(ex + Math.round((ew * i) / 10)), dy(ey), D, eh * D);
    });
    const r = rect(ex, ey - 2, ew, eh + 4); rectos.xp = r;
    if (dentro(r[0], r[1], r[2], r[3]) && Math.abs(E.x - lx(g.roseton[0])) > 22) letrero(`${T('Experiencia', 'Experience')}: ${d.xp.toLocaleString('es')} / ${x1.toLocaleString('es')}`, E.x, r[1] - 8, D); }
  // ---- el rosetón del nivel en su frontón
  { const [cx, cy] = g.roseton, a = xpPara(d.nivel), b = xpPara(d.nivel + 1), esc = D / RES;
    dibujarRoseton(d.nivel, d.nivel >= NIVEL_MAX ? 1 : (d.xp - a) / Math.max(1, b - a), lx(cx), ly(cy), esc, j.t, true);
    pistaRoseton(d, lx(cx), ly(cy), 15 * esc); }

  // ---- los dos poderes en sus pozos y los diez atajos: casillas forjadas (forja_habilidad.ts)
  const casilla = (hb: Habilidad, x: number, y: number, sz: number, r: [number, number, number, number], extra: Partial<EstadoCasilla> = {}) => {
    const n = hb.id === 'ataque' ? 1 : nivelHab(d, hb.id, h.c), enc = !ui.mano && dentro(r[0], r[1], r[2], r[3]);
    casillaPoderForjada(dx(x), dy(y), sz, D, { hb, apagado: n <= 0, encima: enc, apretado: enc && E.izq, recarga: h.recargas[hb.id] ?? 0, total: hb.recarga ?? 1,
      faltaMana: hb.id !== 'ataque' && h.mana < costoMana(j, hb), faltaFuria: !!(hb as any).furia && h.furia < (hb as any).furia, id: hb.id + '@' + x, ...extra }, (v) => v / RES);
  };
  for (const [lado, [x, y]] of [['izq', g.pozoI], ['der', g.pozoD]] as ['izq' | 'der', [number, number]][]) {
    const r = rect(x, y, tt.hab, tt.hab); rectos[lado === 'izq' ? 'habIzq' : 'habDer'] = r;
    casilla(habilidadDe(d[lado]), x, y, tt.hab, r);
    casillaPoder(j, lado, r[0], r[1], r[2], r[3]);
  }
  while (d.atajos.length < 10) d.atajos.push(null);
  // el atajo vacío es un rebaje apenas tallado; el que tiene poder lleva su bisel entero (el pedazo del marco lleno), y
  // el vacío se asoma a medias al pasarle por encima o mientras se elige un poder para ponerle
  const eligiendo = ui.der === 'elegirHab';
  for (let i = 0; i < 10; i++) {
    const [x, y] = g.rapidos[i], id = d.atajos[i], r = rect(x, y, tt.rap, tt.rap), enc = !ui.mano && dentro(r[0], r[1], r[2], r[3]);
    const a = id ? 1 : enc ? 0.75 : eligiendo ? 0.4 + 0.2 * Math.sin(t * 5) : 0;
    if (a > 0) { const [qx, qy, qw, qh] = rectAtajo(g, i), [cx0, cy0] = mc.cajaL;
      enDev(() => { ctx.globalAlpha = a; ctx.drawImage(mc.llenos, (qx - cx0) * D, (qy - cy0) * D, qw * D, qh * D, dx(qx), dy(qy), qw * D, qh * D); ctx.globalAlpha = 1;
        if (!id) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,190,90,${enc ? 0.14 : 0.07 + 0.05 * Math.sin(t * 5)})`; ctx.fillRect(dx(x + 1), dy(y + 1), (tt.rap - 2) * D, (tt.rap - 2) * D); ctx.globalCompositeOperation = 'source-over'; } }); }
    if (id) casilla(habilidadDe(id), x, y, tt.rap, r, { marcado: id === d.der, chico: true });
    rectos['rap' + i] = r;
    casillaAtajo(j, i, r[0], r[1], r[2], r[3]);
  }
  // ---- el recurso de la clase en su ranura
  { const [x, y, w, hh] = g.rec, r = rect(x, y, w, hh); recursoClase(j, Math.round(r[0]), Math.round(r[1] + (r[3] - 13) / 2), Math.round(r[2]), true); rectos.recurso = r; }
  // ---- correr o caminar: una placa de latón (corriendo) o de hierro (caminando), con su tecla
  { const [x, y, w, hh] = g.correr, r = rect(x, y, w, hh);
    const pl = placa(w - 2, hh - 2, h.correr);
    enDev(() => ctx.drawImage(pl, dx(x + 1), dy(y + 1), (w - 2) * D, (hh - 2) * D));
    const s = h.correr ? T('Corriendo (R)', 'Running (R)') : T('Caminando (R)', 'Walking (R)');
    // grabada en el latón, o incrustada de latón en el hierro (la letra va a D puntos, como el marco)
    textoPixel(s, lx(x + w / 2), ly(y + Math.round((hh - 7) / 2) + 7), h.correr ? { alin: 'center', D, estilo: 'grabado', color: '#2a1706', labio: '#f0d898' } : { alin: 'center', D, color: '#c8a35a' });
    rectos.correr = r;
    if (dentro(r[0], r[1], r[2], r[3])) { ui.sobreUI = true; if (E.clicIzq) { E.clicIzq = false; h.correr = !h.correr; } } }
  // ---- el cinturón: cada columna con su poción y las cuentas de lo que hay apilado detrás
  { const tipos = tiposCinturon(d), cap = filasCinturon(d);
    for (let i = 0; i < 4; i++) {
      const [x, y] = g.poc[i], s = tt.poc, o = d.cinturon[i], r = rect(x, y, s, s);
      if (o) enDev(() => icono(o, dx(x) + D, dy(y) + D, (s - 2) * D, (s - 2) * D));
      else enDev(() => frascoVacio(COLOR_POCION[tipos[i]], dx(x), dy(y), s, D));
      // las cuentas: un alvéolo por fila del cinturón, lleno con una perla del color de la poción
      const n = o ? Math.min(cap, cant(o)) : 0, pip = tt.pip, sep = pip + 2, w0 = cap * sep - 2, px0 = Math.round(x + (s - w0) / 2), py = g.yT + tt.pipY;
      enDev(() => { for (let k = 0; k < cap; k++) perla(dx(px0 + k * sep), dy(py), pip, D, k < n ? COLOR_POCION[o?.pocion ?? tipos[i]] : null); });
      rectos['poc' + i] = r;
      if (dentro(r[0], r[1], r[2], r[3])) enDev(() => { ctx.fillStyle = 'rgba(255,230,170,0.1)'; ctx.fillRect(dx(x), dy(y), s * D, s * D); });
      // con el dedo (PC con pantalla táctil) tocar la poción la bebe: levantarla y soltarla es cosa del ratón
      if (E.tactil && E.clicIzq && !ui.mano && o && dentro(r[0], r[1], r[2], r[3])) { E.clicIzq = false; usarPocion(j, i); ui.sobreUI = true; }
      casillaCinturon(j, i, r[0], r[1], r[2], r[3]);
    } }
  // ---- las placas del menú (y el modo agresivo o pasivo)
  for (const p of g.placas) {
    const def = PLACA[p.id], r = rect(p.x, p.y, tt.plW, tt.plH), enc = dentro(r[0], r[1], r[2], r[3]), ag = !!(d as any).agresivo;
    const picto = p.id === 'agresivo' ? (ag ? 'espada' : 'escudo') : def.picto;
    const abierto = p.id !== 'agresivo' && (def.panel === 'mapa' ? ui.mapa : ui.izq === def.panel || ui.der === def.panel);
    const bt = cacheRaster(`forja_pl_${picto}_${tt.plW}x${tt.plH}_${enc ? (E.izq ? 'p' : 'e') : abierto ? 'p' : 'n'}`, () => botonForjado(picto, tt.plW, tt.plH, enc ? (E.izq ? 'presionado' : 'encima') : abierto ? 'presionado' : 'normal'));
    enDev(() => { ctx.drawImage(bt, dx(p.x), dy(p.y), tt.plW * D, tt.plH * D);
      if (p.id === 'agresivo' && ag) { ctx.fillStyle = 'rgba(255,60,30,0.85)'; ctx.fillRect(dx(p.x), dy(p.y), tt.plW * D, D); ctx.fillRect(dx(p.x), dy(p.y + tt.plH - 1), tt.plW * D, D); }
      // puntos para repartir: una gema que parpadea en la esquina
      if ((p.id === 'pers' && d.puntosAtrib > 0) || (p.id === 'habs' && d.puntosHab > 0)) { ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffd060' : '#a07020'; ctx.fillRect(dx(p.x + tt.plW - 5), dy(p.y + 1), 4 * D, 4 * D); ctx.fillStyle = '#fff4c0'; ctx.fillRect(dx(p.x + tt.plW - 5), dy(p.y + 1), D, D); } });
    rectos['btn_' + p.id] = r;
    if (p.id === 'agresivo') hud.agresivo = r;
    if (enc) {
      ui.sobreUI = true;
      const txt = p.id === 'agresivo' ? (ag ? T('Agresivo (Z): ataca solo lo que entra en su alcance', 'Aggressive (Z): attacks whatever comes in reach') : T('Pasivo (Z): no ataca sin tu orden', 'Passive (Z): does not attack without your order')) : `${TT([def.es, def.en])} (${def.tecla})`;
      letrero(txt, r[0] + r[2] / 2, r[1] - 6, D);
      if (E.clicIzq) { E.clicIzq = false; if (p.id === 'agresivo') cambiarAgresivo(j); else if (def.panel === 'mapa') ui.mapa = !ui.mapa; else alternar(def.panel as PanelId, def.lado!); }
    }
  }
  // ---- en una pantalla táctil de PC, Golpe y Poder grandes arriba del orbe de maná
  botonesTactilesBarra(j, lx(g.casaM) - 30, ly(g.apex) - 40);
  // ---- las fichas encima de todo lo de la barra
  fichasBarra(ly(g.yT));
  // ---- lo que tapa el panel no es del mundo (la máscara de lo tallado)
  { const ax = Math.floor((E.x * RES - e.ox) / D), ay = Math.floor((E.y * RES - oyF) / D);
    if (ax >= 0 && ay >= 0 && ax < mc.w && ay < mc.h && mc.mascara[ay * mc.w + ax]) ui.sobreUI = true; }
  return true;
}

/** Un letrero de pixel sobre el mundo (al pasar el ratón): letra en relieve con una franja oscura detrás, sin salirse. */
export function letrero(s: string, x: number, y: number, D: number, color = '#f0e4c8') {
  const w = anchoPixel(s, { D }), m = ctx.getTransform().a, p = (2 * D) / m, x0 = Math.max(4 + w / 2, Math.min(ctx.canvas.width / m - 4 - w / 2, x));
  ctx.fillStyle = 'rgba(6,4,3,0.72)'; ctx.fillRect(x0 - w / 2 - p * 2, y - (9 * D) / m - p, w + p * 4, (11 * D) / m + p * 2);
  textoPixel(s, x0, y, { alin: 'center', D, color });
}
/** La placa del correr: latón (corriendo) o hierro (caminando), tallada con su bisel y un remache en cada punta. */
const placas = new Map<string, HTMLCanvasElement>();
export function placa(w: number, h: number, laton: boolean): HTMLCanvasElement {
  const k = `${w}x${h}${laton ? 'l' : 'h'}`; let c = placas.get(k); if (c) return c;
  const tl = new Taller(w, h), m = laton ? M.LATON : M.HIERRO;
  tl.caja(0, 0, w, h, m, 0, 2, { alto: 2.6 });
  for (const qx of [3, w - 4]) tl.elipsoide(qx + 0.5, h / 2, 1.5, 1.5, 2, laton ? M.HIERRO : M.LATON, 2.6, 0);
  c = rasterACanvas(tl.hornear({ sombraMundo: 0 }).r); placas.set(k, c); return c;
}
/**
 * El marco ya agrandado a puntos del lienzo (D veces, sin suavizar), una vez: pegarlo agrandado en cada cuadro costaba
 * unos 8 ms a 1080 con el lienzo por software, y así es una copia 1:1.
 */
export function aumentar(cv: HTMLCanvasElement, D: number): HTMLCanvasElement {
  if (D <= 1) return cv;
  const c = document.createElement('canvas'); c.width = cv.width * D; c.height = cv.height * D;
  const g = c.getContext('2d')!; g.imageSmoothingEnabled = false; g.drawImage(cv, 0, 0, c.width, c.height); return c;
}
/** Cuántas filas tiene el cinturón (las cuentas debajo de cada columna). Hoy toda columna apila PILA_CINTURON. */
export const filasCinturon = (_d: DatosHeroe) => PILA_CINTURON;

/** Una columna vacía: la silueta de un frasco del tipo de la columna, apenas teñida. */
export function frascoVacio(col: string, x: number, y: number, s: number, D: number) {
  const c = Math.floor(s / 2), r = Math.max(4, Math.round(s * 0.2)), cy = Math.round(s * 0.6);
  ctx.save(); ctx.globalAlpha = 0.28; ctx.fillStyle = col;
  for (let yy = -r; yy <= r; yy++) for (let xx = -r; xx <= r; xx++) if (xx * xx + yy * yy <= r * r + r) ctx.fillRect(x + (c + xx) * D, y + (cy + yy) * D, D, D);
  ctx.fillRect(x + (c - 2) * D, y + (cy - r - 5) * D, 4 * D, 6 * D);
  ctx.globalAlpha = 0.4; ctx.fillStyle = '#d8c8a0'; ctx.fillRect(x + (c - 3) * D, y + (cy - r - 6) * D, 6 * D, 2 * D);
  ctx.restore();
}
/** Una cuenta del cinturón: perla de vidrio del color de la poción con su brillo, o el alvéolo vacío. */
export function perla(x: number, y: number, p: number, D: number, col: string | null) {
  if (!col) { ctx.fillStyle = '#0a0706'; ctx.fillRect(x, y, p * D, p * D); ctx.fillStyle = 'rgba(200,170,110,0.25)'; ctx.fillRect(x, y + (p - 1) * D, p * D, D); return; }
  ctx.fillStyle = col; ctx.fillRect(x, y, p * D, p * D);
  ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y + (p - 1) * D, p * D, D); ctx.fillRect(x + (p - 1) * D, y, D, p * D);
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fillRect(x, y, D, D);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = col; ctx.globalAlpha = 0.25; ctx.fillRect(x - D, y - D, (p + 2) * D, (p + 2) * D); ctx.restore();
}
