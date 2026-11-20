// La barra del jefe en el idioma del HUD forjado: un dintel de piedra con herrajes que baja colgado de dos cadenas
// cuando el jefe despierta (cae, rebota y queda), con la vida del jefe como un canal de sangre con filete de latón y el
// nombre en la letra de pixel. Se sacude con cada golpe fuerte, deja ver lo que se acaba de quitar (el tramo pálido) y
// cuando el jefe muere las cadenas lo sueltan y cae. Sale del mismo taller que el panel (forja_taller.ts), horneado una
// vez por ancho, y por cuadro son unos pocos rectángulos.
import { ctx, RES } from '../nucleo/lienzo';
import { rasterACanvas, TT } from './comun';
import { Taller, M, cl, hash } from './forja_taller';
import { textoPixel, anchoLetra } from './letra_pixel';
import { espacio, aumentar } from './hud_forja';
import type { Juego } from '../juego/mundo';
import type { Rect } from './hud_rects';

const ALTO = 31, DESCANSO = 20, PERIODO = 12;
const dinteles = new Map<string, HTMLCanvasElement>();
function dintel(w: number, D: number): HTMLCanvasElement {
  const k = `${w}x${D}`; let c = dinteles.get(k); if (c) return c;
  const tl = new Taller(w, ALTO + 8), cx = w / 2;
  tl.caja(0, 3, w, ALTO - 3, M.PIEDRA, 0, 3, { alto: 3 });
  tl.caja(3, 0, w - 6, 6, M.PIEDRA, 2, 2, { alto: 3 });
  tl.sillares(2, 5, w - 4, ALTO - 8, 13, 38, 31, 1.2);
  // los herrajes de las puntas con la argolla de cada cadena
  for (const x of [0, w - 15]) { tl.caja(x, 2, 15, ALTO - 2, M.HIERRO, 3, 2, { alto: 3 }); tl.anillo(x + 7.5, 7, 2, 5, M.HIERRO, 6, 2); for (const y of [16, 24]) tl.elipsoide(x + 7.5, y + 0.5, 1.7, 1.7, 2, M.LATON, 6, 0); }
  // el canal de la vida, con su filete de latón
  tl.caja(20, 18, w - 40, 10, M.LATON, 4, 1.5, { alto: 2 });
  tl.caja(22, 20, w - 44, 6, M.HUECO, 5, 1, { hundido: true, alto: 3 });
  // la clave del medio: un rombo de hierro bajo el dintel
  tl.forma(cx - 6, ALTO - 4, cx + 6, ALTO + 6, (x, y) => Math.abs(x + 0.5 - cx) + Math.abs(y + 0.5 - (ALTO + 1)) <= 5.5, M.HIERRO, 5, 2, { alto: 3 });
  c = aumentar(rasterACanvas(tl.hornear({ sombraMundo: 5 }).r), D); dinteles.set(k, c); if (dinteles.size > 6) dinteles.delete(dinteles.keys().next().value!);
  return c;
}
let cadenaCv: HTMLCanvasElement | null = null, cadenaD = 0;
/** Una tira de cadena (eslabones de frente y de canto alternados), para colgar el dintel. */
function cadena(D: number): HTMLCanvasElement {
  if (cadenaCv && cadenaD === D) return cadenaCv;
  const n = 10, tl = new Taller(9, PERIODO * n);
  for (let i = 0; i < n; i++) { const y = i * PERIODO; tl.anillo(4.5, y + 4.5, 1.2, 4.2, M.HIERRO, 2, 2.4); tl.capsula(4.5, y + 7, 4.5, y + PERIODO + 2, 1.3, 1.3, M.HIERRO, 3, 1); }
  cadenaCv = aumentar(rasterACanvas(tl.hornear({ sombraMundo: 0 }).r), D); cadenaD = D; return cadenaCv;
}

const est = { id: -1, nombre: '', k: 1, tras: 1, trasT: 0, entro: -9, cayo: -9, sac: 0, t: 0, cx: 0, top: 0, w: 0 };
/**
 * Dibuja el dintel del jefe (o su caída, si acaba de morir). cx, top y maxW en puntos lógicos. Devuelve el rectángulo
 * lógico que ocupa (para hud.jefe), o null si no hay nada que dibujar.
 */
export function barraJefeForja(j: Juego, t: number, cx: number, top: number, maxW: number): Rect | null {
  const jf = j.jefe && !j.jefe.muerto ? j.jefe : null, dt = cl(t - est.t, 0, 0.1); est.t = t;
  if (jf) {
    if (est.id !== jf.id) { est.id = jf.id; est.entro = t; est.k = est.tras = jf.vida / jf.vidaMax; est.sac = 0; }
    est.nombre = TT(jf.nombre) || TT(jf.def.nombre); est.cayo = -9;
    const k = cl(jf.vida / jf.vidaMax);
    if (k < est.k - 0.0005) { est.sac = Math.min(1, est.sac + (est.k - k) * 14); est.trasT = t; }
    if (k > est.tras) est.tras = k;
    est.k = k; if (t - est.trasT > 0.45) est.tras = Math.max(k, est.tras - dt * 0.3);
    est.cx = cx; est.top = top; est.w = maxW;
  } else if (est.id >= 0) { if (est.cayo < 0) est.cayo = t; if (t - est.cayo > 1) { est.id = -1; return null; } cx = est.cx; top = est.top; maxW = est.w; }
  else return null;
  est.sac = Math.max(0, est.sac - dt * 3.5);
  const e = espacio(), D = e.D, w = Math.max(150, Math.min(460, Math.floor(((maxW * RES) / D) / 2) * 2, Math.max(360, anchoLetra(est.nombre) + 90))); // (más ancho: el de 220 se perdía arriba de la pantalla)
  const x = t - est.entro, cae = est.cayo >= 0 ? t - est.cayo : 0;
  // baja colgado, rebota y queda; al morir el jefe las cadenas lo sueltan
  let dy = x < 3 ? -78 * Math.exp(-4.2 * x) * Math.cos(8 * x) : 0; if (cae > 0) dy += 520 * cae * cae;
  const sx = Math.round(Math.sin(t * 61) * 2.4 * est.sac), sy = Math.round(Math.cos(t * 47) * 1.4 * est.sac);
  const X = Math.round((cx * RES) / D - w / 2) * D + sx * D, Y0 = Math.round(top * RES), Y = Y0 + Math.round(DESCANSO + dy + sy) * D, a = cae > 0 ? cl(1 - cae / 0.8) : 1;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = a;
  // las cadenas, del borde de arriba a las argollas (al caer se recogen)
  const cv = cadena(D), largo = cae > 0 ? Math.max(0, (DESCANSO + 6) * (1 - cae * 2.2)) * D : Y - Y0 + 6 * D;
  if (largo > 0) for (const ax of [3, w - 12]) { const lh = Math.min(largo, cv.height); ctx.drawImage(cv, 0, cv.height - lh, cv.width, lh, X - sx * D + ax * D, Y0, cv.width, lh); }
  ctx.drawImage(dintel(w, D), X, Y);
  // la vida: sangre en el canal, el tramo recién quitado en pálido, marcas en los cuartos y el canto encendido
  const bx = X + 22 * D, by = Y + 20 * D, bw = w - 44, n = Math.round(bw * est.k), nt = Math.round(bw * est.tras), bajo = est.k < 0.25 ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
  if (nt > n) { ctx.fillStyle = '#e8c8a0'; ctx.fillRect(bx + n * D, by, (nt - n) * D, 6 * D); }
  if (n > 0) {
    ctx.fillStyle = bajo ? `rgb(${Math.round(170 + 60 * bajo)},${Math.round(22 + 30 * bajo)},20)` : '#a81616'; ctx.fillRect(bx, by, n * D, 6 * D);
    ctx.fillStyle = '#e8483a'; ctx.fillRect(bx, by, n * D, D); ctx.fillStyle = '#5c0a0a'; ctx.fillRect(bx, by + 4 * D, n * D, 2 * D);
    for (let i = 0; i < Math.ceil(n / 14); i++) { const px = Math.floor(hash(i, Math.floor(t * 4), 37) * n); ctx.fillStyle = 'rgba(255,150,120,0.5)'; ctx.fillRect(bx + px * D, by + 2 * D, 2 * D, D); }
    ctx.fillStyle = '#ffc0a8'; ctx.fillRect(bx + (n - 1) * D, by, D, 6 * D);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.6)'; for (const q of [0.25, 0.5, 0.75]) ctx.fillRect(bx + Math.round(bw * q) * D, by, D, 6 * D);
  textoPixel(est.nombre, X + Math.round(w / 2) * D, Y + 15 * D, { D, alin: 'center', color: '#e6cf98' });
  ctx.restore();
  return [X / RES, top, (w * D) / RES, ((DESCANSO + ALTO + 6) * D) / RES];
}
