// El registro: lo que el juego le dice al jugador (avisos, líneas de ambiente, la voz de la Marca, consejos).
// Antes eran hasta seis renglones largos abajo a la izquierda durante siete segundos, encima de la pelea. Con el HUD
// forjado (20 nov 2026): a lo sumo tres renglones (cuatro fuera de combate), cada mensaje cortado a dos, que se van en
// cinco segundos; y nada se pierde: el registro entero de la sesión se abre con H, con la placa del registro de la
// consola o, en el táctil, con su botón junto a la misión. Se recorre con la rueda, las flechas o arrastrando.
import { ctx, W, H, E, pulso } from '../nucleo/lienzo';
import { texto, ancho, envolver, T, TT, dentro, marco } from './comun';
import { hud, type Rect } from './hud_rects';
import { ui } from './juego_ui';
import { registroDe, type Juego } from '../juego/mundo';

const VISIBLE = 5, TAM = 13, LH = 17;
/** Los mensajes de ahora, abajo a la izquierda sobre la casa de la vida: (x, yBase) el renglón de más abajo. */
export function mensajesForja(j: Juego, x: number, yBase: number) {
  const h = j.heroe, pelea = j.t - h.tCombate < 6 || (!!j.jefe && !j.jefe.muerto), maxL = pelea ? 3 : 4, maxW = Math.min(440, W * 0.36);
  const filas: { s: string; color: string; a: number }[] = [];
  for (let i = j.mensajes.length - 1; i >= 0 && filas.length < maxL; i--) {
    const m = j.mensajes[i]; if (m.t >= VISIBLE) continue;
    let ls = envolver(TT(m.txt), maxW, TAM);
    if (ls.length > 2) ls = [ls[0], ls[1].replace(/[\s.,;:]+$/, '') + '…'];
    if (filas.length + ls.length > maxL) { if (filas.length) break; ls = [ls[0].replace(/[\s.,;:]+$/, '') + '…']; }
    const a = Math.max(0, Math.min(1, (VISIBLE - m.t) / 0.8, m.t / 0.15));
    for (let q = ls.length - 1; q >= 0; q--) filas.push({ s: ls[q], color: m.color, a });
  }
  if (!filas.length) { delete hud.mensajes; return; }
  let aw = 0, vis = 0; for (const f of filas) { aw = Math.max(aw, ancho(f.s, TAM)); vis = Math.max(vis, f.a); }
  const n = filas.length, px0 = x - 9, py0 = yBase - LH * (n - 1) - 15, pw = aw + 18, ph = LH * n + 6;
  ctx.save(); ctx.globalAlpha = vis * 0.6; const gp = ctx.createLinearGradient(px0, 0, px0 + pw + 30, 0); gp.addColorStop(0, 'rgba(6,5,4,1)'); gp.addColorStop(0.75, 'rgba(6,5,4,0.85)'); gp.addColorStop(1, 'rgba(6,5,4,0)'); ctx.fillStyle = gp; ctx.fillRect(px0, py0, pw + 30, ph);
  ctx.globalAlpha = vis * 0.7; ctx.fillStyle = '#8a6c3a'; ctx.fillRect(px0, py0, 2, ph); ctx.restore();
  filas.forEach((f, i) => { ctx.globalAlpha = f.a; texto(f.s, x, yBase - i * LH, { color: f.color, tam: TAM }); });
  ctx.globalAlpha = 1;
  hud.mensajes = [x, py0, aw, ph];
}

// ------------------------------------------------------------------ el registro entero
let abierto = false, corrido = 0, arrastre: { y: number; c: number } | null = null, cache: { n: number; w: number; idi: number; ls: { s: string; color: string; primero: boolean }[] } | null = null;
export const registroAbierto = () => abierto;
export function alternarRegistro(v?: boolean) { abierto = v ?? !abierto; corrido = 0; arrastre = null; }
(window as any).__registro = (v?: boolean) => { if (v !== undefined) alternarRegistro(v); return abierto; };
/** La tecla del registro (H). Escape lo cierra: devuelve true si se usó la tecla. */
export function teclasRegistro(): boolean {
  if (pulso('h')) { alternarRegistro(); return true; }
  if (abierto && pulso('Escape')) { alternarRegistro(false); E.pulsadas.delete('Escape'); return true; }
  return false;
}
/**
 * El panel del registro, encima del HUD. r: dónde va (el táctil lo centra; el PC lo pone a la izquierda sobre la casa
 * de la vida). Hay que llamarlo después del HUD: se queda con los clics y con la rueda.
 */
export function panelRegistro(j: Juego, tactil: boolean) {
  if (!abierto) return;
  if (ui.izq || ui.der || ui.mapa) { abierto = false; return; }
  const reg = registroDe(j), tam = tactil ? Math.max(12, Math.round(13 * Math.min(1.25, H / 500))) : 13, lh = Math.round(tam * 1.38);
  const w = Math.min(tactil ? 560 : 520, W - 24), base = tactil ? H - 12 : (hud.casaVida ? hud.casaVida[1] - 10 : H - 110), alto = Math.min(Math.round(H * 0.62), base - 12, 420);
  const x = tactil ? Math.round((W - w) / 2) : 12, y = Math.round(base - alto), r: Rect = [x, y, w, alto];
  // los renglones (se vuelven a cortar si entró algo nuevo)
  if (!cache || cache.n !== reg.length + (reg[reg.length - 1]?.t ?? 0) || cache.w !== w || cache.idi !== j.idi) {
    const ls: { s: string; color: string; primero: boolean }[] = [];
    for (const m of reg) envolver(TT(m.txt), w - 44, tam).forEach((s, i) => ls.push({ s, color: m.color, primero: i === 0 }));
    cache = { n: reg.length + (reg[reg.length - 1]?.t ?? 0), w, idi: j.idi, ls };
  }
  const ls = cache.ls, caben = Math.max(1, Math.floor((alto - 72) / lh)), maxC = Math.max(0, ls.length - caben);
  // recorrer: rueda, flechas, páginas y arrastre
  if (E.rueda) { corrido -= E.rueda * 3; E.rueda = 0; }
  if (pulso('ArrowUp')) corrido++; if (pulso('ArrowDown')) corrido--; if (pulso('PageUp')) corrido += caben - 1; if (pulso('PageDown')) corrido -= caben - 1;
  const enc = dentro(x, y, w, alto);
  if (E.izq && enc && !arrastre && !E.clicIzq) arrastre = { y: E.y, c: corrido };
  if (!E.izq) arrastre = null;
  if (arrastre) corrido = arrastre.c + Math.round((E.y - arrastre.y) / lh);
  corrido = Math.max(0, Math.min(maxC, corrido));
  marco(x, y, w, alto, 0.95);
  texto(T('Registro', 'Log'), x + w / 2, y + 26, { alin: 'center', tam: 16, color: '#e6cf98', fuente: '"Cinzel", Georgia, serif' });
  if (!ls.length) texto(T('Todavía no se ha dicho nada.', 'Nothing has been said yet.'), x + w / 2, y + alto / 2, { alin: 'center', tam, color: '#807060' });
  const y0 = y + 44, fin = ls.length - corrido, ini = Math.max(0, fin - caben);
  for (let i = ini; i < fin; i++) { const f = ls[i], yy = y0 + (i - ini + (caben - (fin - ini))) * lh + tam;
    if (f.primero) { ctx.fillStyle = f.color; ctx.globalAlpha = 0.7; ctx.fillRect(x + 20, yy - Math.round(tam * 0.45), 3, 3); ctx.globalAlpha = 1; }
    texto(f.s, x + 30, yy, { color: f.color, tam }); }
  // la barra de recorrido y la X de cerrar
  if (maxC > 0) { const bh = alto - 78, th = Math.max(18, (bh * caben) / ls.length), ty = y0 + (bh - th) * (1 - corrido / maxC); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x + w - 16, y0, 4, bh); ctx.fillStyle = '#a8823c'; ctx.fillRect(x + w - 16, ty, 4, th); }
  const cs = tactil ? 44 : 24, cx = x + w - cs - (tactil ? 2 : 8), cy = y + (tactil ? 2 : 8), enX = dentro(cx, cy, cs, cs);
  texto('×', cx + cs / 2, cy + cs / 2 + 7, { alin: 'center', tam: 22, color: enX ? '#fff0c0' : '#c8a860' });
  texto(tactil ? T('Arrastra para recorrer', 'Drag to scroll') : T('H o Esc: cerrar · rueda: recorrer', 'H or Esc: close · wheel: scroll'), x + w / 2, y + alto - 8, { alin: 'center', tam: 10, color: '#807060' });
  hud.registro = r;
  if (enc) ui.sobreUI = true;
  if (E.clicIzq) { E.clicIzq = false; ui.sobreUI = true; if (!enc || enX) alternarRegistro(false); }
}
