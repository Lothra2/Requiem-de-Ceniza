// El HUD forjado, el de por omisión (Opciones, HUD: Clásico vuelve a la barra de siempre con opciones.hud = 'clasico').
// PC (rehecho el 20 nov 2026, Rick: "un HUD mejor que el de Diablo, con intención"): los orbes anclan las esquinas en
// sus casas de arco apuntado, la gárgola (vida) y la doliente con su vela (maná) se asoman por detrás de cada casa, y el
// medio es una consola baja de piedra: las placas del menú de a dos por dos en las puntas, los dos poderes en torres
// que rompen la cornisa (con el botón del ratón grabado en la cresta), cinco atajos a cada lado con su tecla, el
// cinturón en dos pares (1 y 2, 3 y 4) y en el centro el altar: arriba la Marca (el rosetón del nivel es la brasa que
// el héroe lleva clavada) y abajo el nicho con la reliquia de la clase (forja_reliquia.ts). La experiencia corre por la
// cornisa. Lo que late y responde al juego está en forja_viva.ts.
// Todo es pixel a punto entero del aparato: el panel se pinta en "puntos de dibujo" de D puntos del lienzo cada uno
// (1 a 720, 2 a 1080 y 1440, 3 a 2160) y lo fijo se hornea una vez por tamaño (forja_taller.ts). Por cuadro solo
// cambian los orbes, las recargas, los íconos, las cuentas, la reliquia y lo que late.
import { ctx, E, RES, fijarAltoHud } from '../nucleo/lienzo';
import { botonForjado } from '../../../src/engine/gotico/hud';
import { orbeVivo, nivelVisto, CUADROS_LIQ } from './forja_orbe';
import { T, TT, dentro, icono, rasterACanvas, cacheRaster, tooltip, envolver } from './comun';
import { ui, alternar, casillaPoder, casillaAtajo, casillaCinturon, fichasBarra, pistaRoseton, botonesTactilesBarra, cambiarAgresivo, COLOR_POCION, type PanelId } from './juego_ui';
import { hud } from './hud_rects';
import { habilidadDe, costoMana, usarPocion, type Juego } from '../juego/mundo';
import { cant, nivelHab, tiposCinturon, xpPara, PILA_CINTURON, type DatosHeroe } from '../juego/heroe';
import { dibujarRoseton } from './sello_nivel';
import { casillaPoderForjada, type EstadoCasilla } from './forja_habilidad';
import type { Habilidad } from '../datos/clases';
import { cl } from './forja_taller';
import { geometria, tallarMarco, grabarTeclas, cajaAtajos, rectAtajo, grabarAtajos, type Geo } from './forja_panel';
import { textoPixel, anchoPixel } from './letra_pixel';
import { pulsoHud, latido, grietas, enPiedra, grietasLuz, marcaFondo, marcaChispas, sangreRacha, cenizaJefe, velaMana, estadosOrbe, type Pulso } from './forja_viva';
import { reliquiaClase, AYUDA_RELIQUIA } from './forja_reliquia';
import { alternarRegistro, registroAbierto } from './registro';
export { latido };

/** El espacio del dibujo: D puntos del lienzo por punto, el ancho y alto en puntos y dónde cae el origen. */
export interface Esp { D: number; Wa: number; Ha: number; ox: number; oy: number }
export function espacio(): Esp {
  const cw = ctx.canvas.width, ch = ctx.canvas.height, D = Math.max(1, Math.round(RES * 1.15));
  const Wa = Math.floor(cw / D), Ha = Math.floor(ch / D);
  return { D, Wa, Ha, ox: Math.floor((cw - Wa * D) / 2), oy: ch - Ha * D };
}

type Fis = [number, number, number][];
let marco: { clave: string; cv: HTMLCanvasElement; llenos: HTMLCanvasElement; cajaL: [number, number, number, number]; w: number; h: number; mat: Uint8Array; g: Geo; fisV: Fis; fisM: Fis; apagado: HTMLCanvasElement | null } | null = null;
function marcoDe(e: Esp): typeof marco {
  const clave = `${e.Wa}x${e.Ha}x${e.D}`;
  if (marco && marco.clave === clave) return marco;
  const g = geometria(e.Wa, e.Ha); if (!g) { marco = null; return null; }
  const t0 = performance.now();
  const tl = tallarMarco(g), l = tl.hornear({ sombraMundo: 14 });
  grabarTeclas(l, g);
  // el pedazo de los atajos llenos (bisel entero y tecla de latón): se pega encima de cada atajo con poder
  const cajaL = cajaAtajos(g), ll = tallarMarco(g, true).recorte(...cajaL).hornear({ sombraMundo: 0 });
  grabarAtajos(ll, g, cajaL[0], cajaL[1]);
  // las grietas de la casa de la vida (sangran luz con la vida baja) y las fisuras de la brasa en el frontón de la Marca
  const fisV = enPiedra(grietas(11, g.t.R + 3, 9, 22), g.orbV[0], g.orbV[1], tl.mat, tl.w, tl.h, true), fisM = enPiedra(grietas(5, 15, 8, 15), g.roseton[0], g.roseton[1], tl.mat, tl.w, tl.h);
  marco = { clave, cv: aumentar(rasterACanvas(l.r), e.D), llenos: aumentar(rasterACanvas(ll.r), e.D), cajaL, w: tl.w, h: tl.h, mat: tl.mat, g, fisV, fisM, apagado: null };
  (window as any).__hudForjaMs = Math.round(performance.now() - t0);
  return marco;
}
/** La silueta del marco en negro (para apagarlo cuando el héroe muere), hecha la primera vez que hace falta. */
export function siluetaNegra(cv: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height; const g = c.getContext('2d')!;
  g.drawImage(cv, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height); return c;
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
  correr: { picto: '', es: 'Corriendo', en: 'Running', tecla: 'R' },
  registro: { picto: '', es: 'Registro', en: 'Log', tecla: 'H' },
};
/** Los dibujos de las placas que el motor no trae (correr, caminar y el registro). */
const GLIFO_PLACA: Record<string, string[]> = {
  correr: ['#...#....', '.#...#...', '..#...#..', '...#...#.', '..#...#..', '.#...#...', '#...#....'],
  caminar: ['..#......', '...#.....', '....#....', '.....#...', '....#....', '...#.....', '..#......'],
  registro: ['#########', '#.......#', '#.#####.#', '#.......#', '#.####..#', '#.......#', '#########'],
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
  // la cámara: el héroe en el medio de lo que queda arriba de la consola (más un poco por las esquinas)
  fijarAltoHud(Math.round(((g.t.hC + 10) * D) / RES));
  const h = j.heroe, d = h.d, P = pulsoHud(j, t);
  hechosCuadro = 0;
  const f8 = cuadroLiq(t);
  const enDev = (fn: () => void) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; try { fn(); } finally { ctx.restore(); } };
  const pegar = (cv: CanvasImageSource, x: number, y: number, w: number, hh: number) => ctx.drawImage(cv, dx(x), dy(y), w * D, hh * D);
  const derHab = habilidadDe(d.der), faltaDer = derHab.id !== 'ataque' && h.mana < costoMana(j, derHab);

  // ---- el marco y los orbes (debajo de todo lo demás)
  const kV = P.kV, kM = P.kM, lat = P.lat;
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
      estadosOrbe(j, dx(cx), dy(cy), tt.R, D, id as 'v' | 'm', P);
    }
    // la vida baja: un halo rojo que golpea dos veces alrededor de la casa y las grietas de la piedra que sangran luz
    if (lat > 0.01) {
      const [cx, cy] = g.orbV, r0 = (tt.R + 14) * D, gx = dx(cx), gy = dy(cy);
      const gl = ctx.createRadialGradient(gx, gy, r0 * 0.9, gx, gy, r0 * 1.7);
      gl.addColorStop(0, `rgba(255,30,20,${0.42 * lat})`); gl.addColorStop(1, 'rgba(255,30,20,0)');
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(gx - r0 * 1.7, gy - r0 * 1.7, r0 * 3.4, r0 * 3.4); ctx.restore();
    }
    if (kV < 0.3 && !h.muerto) { const q = (0.3 - kV) / 0.3; grietasLuz(mc.fisV, dx(g.orbV[0]), dy(g.orbV[1]), D, '255,40,24', 0.3 * q + 0.7 * lat, 0.3 + 0.7 * q); if (lat > 0.5) grietasLuz(mc.fisV, dx(g.orbV[0]), dy(g.orbV[1]), D, '255,200,160', (lat - 0.5) * 0.9, 0.2 + 0.5 * q); }
    // los ojos de la gárgola: brasas que laten con la vida baja (y se apagan con el héroe muerto)
    if (P.muerto < 0.95) for (const [ox, oy] of g.ojos) {
      const a = (0.45 + 0.15 * Math.sin(t * 2.3) + lat * 0.55 + P.jefe * 0.2) * (1 - P.muerto);
      ctx.fillStyle = `rgba(255,${Math.round(90 + 80 * (1 - lat))},40,${cl(a)})`; ctx.fillRect(dx(Math.floor(ox)), dy(Math.floor(oy)), D, D);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gl = ctx.createRadialGradient(dx(ox), dy(oy), 0, dx(ox), dy(oy), 5 * D); gl.addColorStop(0, `rgba(255,80,30,${0.3 * a})`); gl.addColorStop(1, 'rgba(255,80,30,0)'); ctx.fillStyle = gl; ctx.fillRect(dx(ox) - 5 * D, dy(oy) - 5 * D, 10 * D, 10 * D); ctx.restore();
    }
    // la vela de la doliente es el maná
    velaMana(dx(g.vela[0]), dy(g.vela[1]), D, g.velaH, P, faltaDer);
    // la sangre de la racha por la piedra de la consola
    sangreRacha(j, mc.mat, mc.w, mc.h, mc.clave, g.conI + 4, g.conD - 4, dx, dy, D, t);
  });
  // los números del orbe al pasar por encima
  for (const [cx, cy, id] of [[g.orbV[0], g.orbV[1], 'vida'], [g.orbM[0], g.orbM[1], 'mana']] as [number, number, string][]) {
    const r = rect(cx - tt.R, cy - tt.R, tt.R * 2, tt.R * 2); rectos[id === 'vida' ? 'orbeVida' : 'orbeMana'] = r;
    if (!ui.mano && Math.hypot(E.x - (r[0] + r[2] / 2), E.y - (r[1] + r[3] / 2)) < r[2] / 2) {
      const v = id === 'vida' ? `${T('Vida', 'Life')}: ${Math.ceil(h.vida)} / ${h.vidaMax}` : `${T('Maná', 'Mana')}: ${Math.floor(h.mana)} / ${h.c.manaMax}`;
      letrero(v, r[0] + r[2] / 2, r[1] - 8, D, id === 'vida' ? '#ffb0a0' : '#b8c8ff');
    }
  }
  hud.casaVida = rect(g.casaV, g.apex, 2 * tt.arcoA, g.B - g.apex); hud.casaMana = rect(g.casaM, g.apex, 2 * tt.arcoA, g.B - g.apex);
  hud.barra = rect(g.conI, g.yT, g.conD - g.conI, tt.hC); rectos.panel = hud.barra;
  hud.forjaMsg = rect(g.casaV, Math.min(g.apex - 14 * tt.f, g.garg[1]) - 4, 10, 10);

  // ---- la experiencia por la cornisa: oro fundido con su luz arriba, su sombra abajo y una muesca cada décimo
  { const x0 = xpPara(d.nivel), x1 = xpPara(d.nivel + 1), kx = P.kxp;
    const [ex, ey, ew, eh] = g.xp, n = Math.round(ew * kx);
    enDev(() => {
      if (n > 0) { ctx.fillStyle = '#b8952f'; ctx.fillRect(dx(ex), dy(ey), n * D, eh * D); ctx.fillStyle = '#f2cc60'; ctx.fillRect(dx(ex), dy(ey), n * D, D); ctx.fillStyle = '#6a4a14'; ctx.fillRect(dx(ex), dy(ey + eh - 1), n * D, D);
        // un brillo que corre por el oro
        const bx = Math.floor(((t * 40) % (ew + 60)) - 30); if (bx > 0 && bx < n) { ctx.fillStyle = 'rgba(255,240,180,0.7)'; ctx.fillRect(dx(ex + bx), dy(ey + 1), D * 2, (eh - 2) * D); }
        ctx.fillStyle = '#fff0b0'; ctx.fillRect(dx(ex + n - 1), dy(ey), D, eh * D); }
      ctx.fillStyle = 'rgba(0,0,0,0.6)'; for (let i = 1; i < 10; i++) ctx.fillRect(dx(ex + Math.round((ew * i) / 10)), dy(ey), D, eh * D);
      // al subir de nivel toda la canaleta arde un momento
      if (P.subio > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,210,110,${0.55 * P.subio})`; ctx.fillRect(dx(ex), dy(ey), ew * D, eh * D); ctx.globalCompositeOperation = 'source-over'; }
    });
    const r = rect(ex, ey - 2, ew, eh + 4); rectos.xp = r;
    if (dentro(r[0], r[1], r[2], r[3]) && Math.abs(E.x - lx(g.roseton[0])) > 22) letrero(`${T('Experiencia', 'Experience')}: ${d.xp.toLocaleString('es')} / ${x1.toLocaleString('es')}`, E.x, r[1] - 8, D);
    void x0; }
  // ---- la Marca: el rosetón del nivel es una brasa en su frontón
  const marca = () => { const [cx, cy] = g.roseton, esc = D / RES;
    enDev(() => marcaFondo(dx(cx), dy(cy), D, P, mc.fisM));
    dibujarRoseton(d.nivel, P.kxp, lx(cx), ly(cy), esc, j.t, true, P.brasa);
    enDev(() => marcaChispas(dx(cx), dy(cy), D, P)); };
  marca();
  pistaRoseton(d, lx(g.roseton[0]), ly(g.roseton[1]), 15 * (D / RES));

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
  // ---- la reliquia de la clase en el nicho del altar
  { const [x, y, w, hh] = g.rec, r = rect(x, y, w, hh); rectos.recurso = r;
    enDev(() => reliquiaClase(j, dx(x), dy(y), w, hh, D, t));
    if (dentro(r[0], r[1], r[2], r[3])) { ui.sobreUI = true; const ay = AYUDA_RELIQUIA[d.clase]; if (ay && !ui.mano) tooltip(envolver(TT(ay), 260, 13).map((s) => [s, '#e0d0a0'] as [string, string]), r[0] + r[2] / 2, r[1] - 4); } }
  // ---- el cinturón en dos pares: cada columna con su poción, su tecla y las cuentas de lo que hay apilado detrás
  { const tipos = tiposCinturon(d), cap = filasCinturon(d);
    for (let i = 0; i < 4; i++) {
      const [x, y] = g.poc[i], s = tt.poc, o = d.cinturon[i], r = rect(x, y, s, s);
      if (o) enDev(() => icono(o, dx(x) + D, dy(y) + D, (s - 2) * D, (s - 2) * D));
      else enDev(() => frascoVacio(COLOR_POCION[tipos[i]], dx(x), dy(y), s, D));
      // las cuentas: un alvéolo por fila del cinturón, lleno con una perla del color de la poción
      const n = o ? Math.min(cap, cant(o)) : 0, pip = tt.pip, sep = pip + 2, px0 = x + 12, py = g.yT + tt.pipY + Math.round((5 - pip) / 2);
      enDev(() => { for (let k = 0; k < cap; k++) perla(dx(px0 + k * sep), dy(py), pip, D, k < n ? COLOR_POCION[o?.pocion ?? tipos[i]] : null);
        // el trago: la copa relumbra del color de lo que se bebió
        if (P.bebio && (h as any).bebioCol === i) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,240,210,${0.5 * (1 - P.bebio.k)})`; ctx.fillRect(dx(x), dy(y), s * D, s * D); ctx.globalCompositeOperation = 'source-over'; } });
      rectos['poc' + i] = r;
      if (dentro(r[0], r[1], r[2], r[3])) enDev(() => { ctx.fillStyle = 'rgba(255,230,170,0.1)'; ctx.fillRect(dx(x), dy(y), s * D, s * D); });
      // con el dedo (PC con pantalla táctil) tocar la poción la bebe: levantarla y soltarla es cosa del ratón
      if (E.tactil && E.clicIzq && !ui.mano && o && dentro(r[0], r[1], r[2], r[3])) { E.clicIzq = false; usarPocion(j, i); ui.sobreUI = true; }
      casillaCinturon(j, i, r[0], r[1], r[2], r[3]);
    } }
  // ---- las placas del menú, de a dos por dos en las puntas (con el correr, el modo agresivo y el registro)
  for (const p of g.placas) {
    const def = PLACA[p.id], r = rect(p.x, p.y, tt.plW, tt.plH), enc = dentro(r[0], r[1], r[2], r[3]), ag = !!(d as any).agresivo;
    const picto = p.id === 'agresivo' ? (ag ? 'espada' : 'escudo') : def.picto;
    const abierto = p.id === 'registro' ? registroAbierto() : p.id !== 'agresivo' && p.id !== 'correr' && (def.panel === 'mapa' ? ui.mapa : ui.izq === def.panel || ui.der === def.panel);
    const est = enc ? (E.izq ? 'presionado' : 'encima') : abierto ? 'presionado' : 'normal';
    const bt = cacheRaster(`forja_pl_${picto}_${tt.plW}x${tt.plH}_${est[0]}`, () => botonForjado(picto, tt.plW, tt.plH, est));
    enDev(() => { ctx.drawImage(bt, dx(p.x), dy(p.y), tt.plW * D, tt.plH * D);
      if (p.id === 'agresivo' && ag) { ctx.fillStyle = 'rgba(255,60,30,0.85)'; ctx.fillRect(dx(p.x), dy(p.y), tt.plW * D, D); ctx.fillRect(dx(p.x), dy(p.y + tt.plH - 1), tt.plW * D, D); }
      // las placas con dibujo propio: latón encendido corriendo, hierro caminando
      const gf = p.id === 'correr' ? GLIFO_PLACA[h.correr ? 'correr' : 'caminar'] : p.id === 'registro' ? GLIFO_PLACA.registro : null;
      if (gf) { const ox = p.x + Math.floor((tt.plW - gf[0].length) / 2) + (est === 'presionado' ? 1 : 0), oy = p.y + Math.floor((tt.plH - gf.length) / 2) + (est === 'presionado' ? 1 : 0), claro = p.id === 'registro' || h.correr;
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; gf.forEach((f, yy) => { for (let xx = 0; xx < f.length; xx++) if (f[xx] === '#') ctx.fillRect(dx(ox + xx + 1), dy(oy + yy + 1), D, D); });
        gf.forEach((f, yy) => { ctx.fillStyle = claro ? (yy < 2 ? '#f0d898' : yy > gf.length - 3 ? '#a8823c' : '#d0aa5c') : '#8a8478'; for (let xx = 0; xx < f.length; xx++) if (f[xx] === '#') ctx.fillRect(dx(ox + xx), dy(oy + yy), D, D); }); }
      // puntos para repartir: una gema que parpadea en la esquina
      if ((p.id === 'pers' && d.puntosAtrib > 0) || (p.id === 'habs' && d.puntosHab > 0)) { ctx.fillStyle = Math.floor(t * 2) % 2 ? '#ffd060' : '#a07020'; ctx.fillRect(dx(p.x + tt.plW - 5), dy(p.y + 1), 4 * D, 4 * D); ctx.fillStyle = '#fff4c0'; ctx.fillRect(dx(p.x + tt.plW - 5), dy(p.y + 1), D, D); } });
    rectos['btn_' + p.id] = r;
    if (p.id === 'agresivo') hud.agresivo = r;
    if (p.id === 'correr') rectos.correr = r;
    if (enc) {
      ui.sobreUI = true;
      const txt = p.id === 'agresivo' ? (ag ? T('Agresivo (Z): ataca solo lo que entra en su alcance', 'Aggressive (Z): attacks whatever comes in reach') : T('Pasivo (Z): no ataca sin tu orden', 'Passive (Z): does not attack without your order'))
        : p.id === 'correr' ? (h.correr ? T('Corriendo (R)', 'Running (R)') : T('Caminando (R)', 'Walking (R)')) : `${TT([def.es, def.en])} (${def.tecla})`;
      letrero(txt, r[0] + r[2] / 2, r[1] - 6, D);
      if (E.clicIzq) { E.clicIzq = false; if (p.id === 'agresivo') cambiarAgresivo(j); else if (p.id === 'correr') h.correr = !h.correr; else if (p.id === 'registro') alternarRegistro(); else if (def.panel === 'mapa') ui.mapa = !ui.mapa; else alternar(def.panel as PanelId, def.lado!); }
    }
  }
  // ---- el jefe: ceniza y brasas que caen y se juntan en el canto de la piedra
  if (P.jefe > 0 || cenizaViva) enDev(() => { cenizaViva = cenizaJefe(P, mc.mat, mc.w, mc.h, mc.clave, dx, dy, D); });
  // ---- el héroe muerto: el panel se apaga... y la Marca no (canon: la Marca que no se apaga)
  if (P.muerto > 0.01) { mc.apagado ??= siluetaNegra(mc.cv); enDev(() => { ctx.globalAlpha = 0.62 * P.muerto; ctx.drawImage(mc.apagado!, e.ox, oyF); }); marca(); }
  // ---- en una pantalla táctil de PC, Golpe y Poder grandes arriba del orbe de maná
  botonesTactilesBarra(j, lx(g.x1) - 52, ly(Math.min(g.apex - 16, g.dol[1])) - 44);
  // ---- las fichas encima de todo lo de la barra
  fichasBarra(ly(g.yT));
  // ---- lo que tapa el panel no es del mundo (la máscara de lo tallado)
  { const ax = Math.floor((E.x * RES - e.ox) / D), ay = Math.floor((E.y * RES - oyF) / D);
    if (ax >= 0 && ay >= 0 && ax < mc.w && ay < mc.h && mc.mat[ay * mc.w + ax]) ui.sobreUI = true; }
  (window as any).__hudPulso = P;
  return true;
}
let cenizaViva = false;
export type { Pulso };

/** Un letrero de pixel sobre el mundo (al pasar el ratón): letra en relieve con una franja oscura detrás, sin salirse. */
export function letrero(s: string, x: number, y: number, D: number, color = '#f0e4c8') {
  const w = anchoPixel(s, { D }), m = ctx.getTransform().a, p = (2 * D) / m, x0 = Math.max(4 + w / 2, Math.min(ctx.canvas.width / m - 4 - w / 2, x));
  ctx.fillStyle = 'rgba(6,4,3,0.72)'; ctx.fillRect(x0 - w / 2 - p * 2, y - (9 * D) / m - p, w + p * 4, (11 * D) / m + p * 2);
  textoPixel(s, x0, y, { alin: 'center', D, color });
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
