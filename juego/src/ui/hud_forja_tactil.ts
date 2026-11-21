// El HUD forjado en el táctil (iPad, tabletas y teléfono apaisado): el mismo taller que el panel de PC llevado al dedo.
//   Abajo a la izquierda: el orbe de vida en su casa de arco apuntado, con el rosetón del nivel en la punta.
//   Abajo a la derecha: el orbe de maná en su casa, y alrededor un cuarto de rosetón de piedra (banda con filetes de
//   latón y radios) que lleva Golpe, Poder y los tres atajos: la rueda de acción es parte del marco, no flota.
//   Abajo al centro: el cinturón de cuatro en su bandeja, con las cuentas de lo apilado, y el recurso de la clase encima.
//   Por el borde de abajo, la experiencia en una canaleta de latón. Arriba siguen los botones, el minimapa y la misión.
//   La zona del pulgar izquierdo (el joystick) queda libre entre la casa de la vida y el cinturón.
// En el teléfono todo es más chico (orbes de 66 pt, rueda de 114) y el marco más magro; los toques siguen de 44 pt o más.
// Desde el 20 nov 2026 lleva lo mismo que late en el de PC (forja_viva.ts): el rosetón es la brasa de la Marca, la
// reliquia de la clase va en su nicho sobre el cinturón (forja_reliquia.ts), la vida baja raja la piedra y el vidrio,
// los estados van en el aro del orbe, el trago sube por el orbe, la racha sangra por la piedra, con un jefe cae ceniza
// y con el héroe muerto el marco se apaga y la Marca no. Las esculturas no van: en el dedo cada punto cuenta.
import { ctx, W, H, E, RES, SEGURO, ESCALA } from '../nucleo/lienzo';
import { rasterACanvas, icono } from './comun';
import { ui, COLOR_POCION } from './juego_ui';
import { textoPixel } from './letra_pixel';
import { hud, type Rect } from './hud_rects';
import { msg, type Juego } from '../juego/mundo';
import { cant, tiposCinturon } from '../juego/heroe';
import { dibujarRoseton } from './sello_nivel';
import { espacio, aumentar, cuadroOrbe, cuadroLiq, nuevoCuadroOrbes, frascoVacio, perla, filasColumna, siluetaNegra } from './hud_forja';
import { pulsoHud, grietas, enPiedra, grietasLuz, grietasHondas, marcaFondo, marcaChispas, sangreRacha, cenizaJefe, estadosOrbe } from './forja_viva';
import { reliquiaClase, AYUDA_RELIQUIA } from './forja_reliquia';
import { Taller, M, enOjiva, altoOjiva, bordeOjiva } from './forja_taller';

const L = (pt: number) => pt / Math.max(0.1, ESCALA);
export const telefono = () => Math.min(innerWidth, innerHeight) < 500;

/** La disposición forjada del táctil, con los mismos nombres que la de siempre (disposicion() en hud_tactil.ts). */
export function disposicionForja(m: { l: number; r: number; t: number; b: number }) {
  const tel = telefono(), gap = L(6), B = L(44);
  const ml = L(Math.max(SEGURO.l, tel ? 26 : 10)), mr = L(Math.max(SEGURO.r, tel ? 26 : 10)), mb = L(Math.max(SEGURO.b, tel ? 6 : 8));
  const O = L(tel ? 66 : 86), oy = H - mb - O / 2 - L(10);
  const orbV: [number, number] = [ml + O / 2 + L(14), oy], orbM: [number, number] = [W - mr - O / 2 - L(14), oy];
  const G = L(tel ? 70 : 78), S = L(tel ? 46 : 52), A = L(44), rA = L(tel ? 114 : 128);
  const ang = tel ? [180, 212, 238, 264, 290] : [180, 211, 236, 261, 284];
  const en = (a: number, r = rA): [number, number] => [orbM[0] + Math.cos((a * Math.PI) / 180) * r, orbM[1] + Math.sin((a * Math.PI) / 180) * r];
  const [gx, gy] = en(ang[0]), habs = ang.slice(1).map((a) => en(a));
  const ag = en(ang[3], rA + S / 2 + A / 2 + L(8)), agresivo: Rect = [ag[0] - A / 2, ag[1] - A / 2, A, A];
  const P = L(tel ? 46 : 54), cw = P * 4 + gap * 3;
  const cinturon: Rect = [W / 2 - cw / 2, H - mb - P - L(tel ? 12 : 16), cw, P];
  const xp: Rect = [orbV[0] + O / 2 + L(16), H - L(Math.max(SEGURO.b, 0) + 5), orbM[0] - O / 2 - L(16) - (orbV[0] + O / 2 + L(16)), L(3)];
  const filaW = B * 5 + gap * 4;
  const botones: Rect = [W - m.r - filaW, m.t, filaW, B];
  const R = L(45);
  const mini: Rect = [botones[0], botones[1] + B + L(8), R * 2, R * 2];
  const rastreo: Rect = [m.l, m.t, Math.max(L(230), 190), Math.max(L(34), 30)];
  // (orbes: el rectángulo de arriba a la izquierda que esquivan la barra del jefe y los mensajes: ahora es la misión)
  // (el botón del registro va a la derecha de la misión: la barra del jefe lo esquiva también)
  const registro: Rect = [m.l + rastreo[2] + L(6), m.t, B, B];
  const orbes: Rect = [m.l, m.t, rastreo[2] + L(6) + B, 0];
  // el nicho de la reliquia de la clase, sobre el cinturón
  const reliquia: Rect = [cinturon[0], cinturon[1] - L(tel ? 44 : 50), cinturon[2], L(tel ? 34 : 38)];
  const casaV: Rect = [orbV[0] - O / 2 - L(14), orbV[1] - O / 2 - L(40), O + L(28), H - (orbV[1] - O / 2 - L(40))];
  const casaM: Rect = [orbM[0] - O / 2 - L(14), orbM[1] - O / 2 - L(16), O + L(28), H - (orbM[1] - O / 2 - L(16))];
  return { m, O, B, gap, orbes, rastreo, botones, mini, R, G, S, A, gx, gy, habs, agresivo, P, cinturon, xp, orbV, orbM, rA, ang, casaV, casaM, tel, registro, reliquia };
}
export type DispForja = ReturnType<typeof disposicionForja>;

// ------------------------------------------------------------------ el marco del táctil, horneado por tamaño
let marco: { clave: string; cv: HTMLCanvasElement; y0: number; mat: Uint8Array; w: number; h: number; fisV: [number, number, number][]; apagado: HTMLCanvasElement | null; rel: [number, number, number, number] } | null = null;
function marcoDe(P: DispForja): typeof marco {
  const e = espacio(), k = RES / e.D, A = (v: number) => v * k;
  const clave = `${e.Wa}x${e.Ha}:${Math.round(P.O)}:${Math.round(P.rA)}:${Math.round(P.cinturon[0])}`;
  if (marco && marco.clave === clave) return marco;
  const topLog = Math.min(P.orbV[1] - P.O / 2 - L(52), P.orbM[1] - P.rA - P.S / 2 - L(8));
  const y0 = Math.max(0, Math.floor(A(topLog))), hF = e.Ha - y0, tl = new Taller(e.Wa, hF), B = hF;
  const X = (v: number) => A(v), Y = (v: number) => A(v) - y0;
  const R = A(P.O / 2), tel = P.tel;
  // las dos casas de los orbes
  for (const [lx, ly] of [P.orbV, P.orbM]) {
    const cx = X(lx), oy = Y(ly), a = R + A(L(14)), rho = a * 1.1;
    tl.forma(cx - a, oy - altoOjiva(a, rho), cx + a, B, (x, y) => enOjiva(x, y, cx, oy, a, rho, B), M.PIEDRA, 2, 3, { alto: 5 });
    tl.forma(cx - a + 4, oy - altoOjiva(a - 4, (a - 4) * 1.1), cx + a - 4, B, (x, y) => enOjiva(x, y, cx, oy, a - 4, (a - 4) * 1.1, B) && !enOjiva(x, y, cx, oy, a - 6, (a - 6) * 1.1, B + 6), M.LATON, 7, 1.2, { alto: 2, modo: 'set' });
    if (!tel) for (const [px, py] of bordeOjiva(cx, oy, a, rho, 10)) { if (py > oy - 4) continue; tl.elipsoide(px, py - 1, 2.6, 2.6, 3, M.PIEDRA, 6, 1); tl.elipsoide(2 * cx - px, py - 1, 2.6, 2.6, 3, M.PIEDRA, 6, 1); }
    tl.anillo(cx, oy, R + 2, R + 8, M.HIERRO, 6, 3);
    tl.anillo(cx, oy, R + 7.5, R + 9.5, M.LATON, 7, 1.4);
    for (let q = 0; q < 10; q++) { const an = (q / 10) * Math.PI * 2 + 0.3; tl.elipsoide(cx + Math.cos(an) * (R + 5), oy + Math.sin(an) * (R + 5), 1.4, 1.4, 2, M.LATON, 9, 0); }
  }
  // el muro bajo de las esquinas (de la casa al borde)
  { const hM = A(L(tel ? 26 : 34)), xv = X(P.orbV[0]), xm = X(P.orbM[0]);
    tl.caja(-4, B - hM, xv + 4, hM + 4, M.PIEDRA, 0, 3, { alto: 3 }); tl.caja(xm, B - hM, e.Wa - xm + 4, hM + 4, M.PIEDRA, 0, 3, { alto: 3 });
    tl.sillares(0, B - hM + 4, xv, hM - 4, 11, 26, 3); tl.sillares(xm, B - hM + 4, e.Wa - xm, hM - 4, 11, 26, 5); }
  // el cuarto de rosetón de la rueda: banda de piedra con filetes, radios y los asientos de cada medallón
  { const cx = X(P.orbM[0]), cy = Y(P.orbM[1]), rA = A(P.rA), an = A(P.S) * 0.42, a0 = ((P.ang[0] - 8) * Math.PI) / 180, a1 = ((P.ang[4] + 9) * Math.PI) / 180;
    const enBanda = (x: number, y: number, r0: number, r1: number) => { const dx = x + 0.5 - cx, dy = y + 0.5 - cy, d = Math.hypot(dx, dy); let a = Math.atan2(dy, dx); if (a < 0) a += Math.PI * 2; return d >= r0 && d <= r1 && a >= a0 && a <= a1; };
    tl.forma(cx - rA - an, cy - rA - an, cx + rA + an, cy + an, (x, y) => enBanda(x, y, rA - an, rA + an), M.PIEDRA, 2, 3, { alto: 4 });
    for (const q of [-an + 3, an - 3]) tl.forma(cx - rA - an, cy - rA - an, cx + rA + an, cy + an, (x, y) => enBanda(x, y, rA + q - 1, rA + q + 1), M.LATON, 6, 1, { alto: 1.5, modo: 'set' });
    // los radios: entre la casa y la banda, a mitad entre medallones
    for (let i = 0; i < 4; i++) { const am = (((P.ang[i] + P.ang[i + 1]) / 2) * Math.PI) / 180; tl.capsula(cx + Math.cos(am) * (R + 9), cy + Math.sin(am) * (R + 9), cx + Math.cos(am) * (rA - an + 2), cy + Math.sin(am) * (rA - an + 2), 2.6, 2.2, M.PIEDRA, 3, 1.2); }
    for (const a of P.ang) { const r = a === P.ang[0] ? A(P.G) / 2 + 3 : A(P.S) / 2 + 3, x = cx + Math.cos((a * Math.PI) / 180) * rA, y = cy + Math.sin((a * Math.PI) / 180) * rA; tl.anillo(x, y, r - 4, r + 1, M.HIERRO, 5, 2.4); }
  }
  // la bandeja del cinturón: zócalo de piedra con borde de latón y una copa hundida por columna
  { const [cx0, cy0, cw, ch] = P.cinturon, x = X(cx0) - 8, y = Y(cy0) - 6, w = A(cw) + 16, h = B - y + 4, g = A(P.gap);
    tl.caja(x - 10, y + 4, w + 20, h, M.PIEDRA, 0, 3, { alto: 3 });
    tl.caja(x, y, w, h, M.LATON, 4, 2, { alto: 2.5 });
    tl.caja(x + 3, y + 3, w - 6, h, M.HUECO, 6, 2, { hundido: true, alto: 4 });
    for (let i = 0; i < 4; i++) { const px = X(cx0) + i * (A(P.P) + g); tl.caja(px - 1, Y(cy0) - 1, A(P.P) + 2, A(P.P) + 2, M.HIERRO, 3, 1, { alto: 1.5, modo: 'set' }); tl.caja(px, Y(cy0), A(P.P), A(P.P), M.HUECO, 4, 1, { hundido: true, alto: 3, modo: 'set' }); }
    void ch; }
  // el nicho de la reliquia de la clase: una caja de piedra con filete de latón que sube de la bandeja
  const rel: [number, number, number, number] = [Math.round(X(P.reliquia[0])), Math.round(Y(P.reliquia[1])), Math.round(A(P.reliquia[2])), Math.round(A(P.reliquia[3]))];
  { const [x, y, w, h] = rel;
    tl.caja(x - 6, y - 5, w + 12, h + 14, M.PIEDRA, 1, 3, { alto: 3 });
    tl.caja(x - 2, y - 2, w + 4, h + 4, M.LATON, 5, 1.5, { alto: 2 });
    tl.caja(x, y, w, h, M.HUECO, 6, 2, { hundido: true, alto: 4, modo: 'set' });
    for (const [qx, qy] of [[x - 4, y - 3], [x + w + 3, y - 3]]) tl.elipsoide(qx + 0.5, qy + 0.5, 1.5, 1.5, 2, M.LATON, 6, 0); }
  // la canaleta de la experiencia
  { const [x, y, w, h] = P.xp; tl.caja(X(x) - 2, Y(y) - 2, A(w) + 4, A(h) + 4, M.LATON, 3, 1.5, { alto: 2 }); tl.caja(X(x), Y(y), A(w), A(h), M.HUECO, 4, 1, { hundido: true, alto: 2, modo: 'set' }); }
  const l = tl.hornear({ sombraMundo: 10 });
  const fisV = enPiedra(grietas(11, R + 2, 8, tel ? 14 : 18), X(P.orbV[0]), Y(P.orbV[1]), tl.mat, tl.w, tl.h, true);
  marco = { clave, cv: aumentar(rasterACanvas(l.r), e.D), y0, mat: tl.mat, w: tl.w, h: tl.h, fisV, apagado: null, rel };
  return marco;
}

/** El marco y los orbes, debajo de los botones. Pone los rectángulos del HUD (las casas no dejan nacer el joystick). */
export function dibujarBaseForja(j: Juego, P: DispForja, t: number) {
  const e = espacio(), mc = marcoDe(P); if (!mc) return;
  nuevoCuadroOrbes();
  const h = j.heroe, d = h.d, V = pulsoHud(j, t), kV = V.kV, kM = V.kM, lat = V.lat, f8 = cuadroLiq(t), D = e.D;
  const dx = (x: number) => e.ox + x * D, dy = (y: number) => e.oy + (mc.y0 + y) * D;
  // el rosetón (la Marca) en la punta de la casa de la vida
  const obj = L(34) / 27, esc0 = [1, 1.5, 2, 2.5, 3].reduce((m, q) => (Math.abs(q - obj) < Math.abs(m - obj) ? q : m), 1), esc = Math.max(1, Math.round(esc0 * RES)) / RES;
  const mx = P.orbV[0], my = P.orbV[1] - P.O / 2 - L(22), Dm = Math.max(1, Math.round(esc * RES));
  const enDev = (fn: () => void) => { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; try { fn(); } finally { ctx.restore(); } };
  const marca = () => {
    enDev(() => marcaFondo(Math.round(mx * RES), Math.round(my * RES), Dm, V, []));
    dibujarRoseton(d.nivel, V.kxp, mx, my, esc, j.t, true, V.brasa);
    enDev(() => marcaChispas(Math.round(mx * RES), Math.round(my * RES), Dm, V, true)); };
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.drawImage(mc.cv, e.ox, e.oy + mc.y0 * D);
  const R = Math.round((P.O / 2) * (RES / D)) - 6;
  for (const [tipo, k, [cx, cy], id] of [[h.veneno > 0 ? 'veneno' : h.frio > 0 ? 'helado' : 'vida', kV, P.orbV, 'v'], ['mana', kM, P.orbM, 'm']] as [string, number, [number, number], string][]) {
    const c = cuadroOrbe(tipo, k, f8, R, ultimo[id]); if (!c) continue; ultimo[id] = c;
    const ox = Math.round((cx * RES - e.ox) / D - c.width / 2) * D + e.ox, oy = Math.round((cy * RES - e.oy) / D - c.height / 2) * D + e.oy;
    ctx.drawImage(c, ox, oy, c.width * D, c.height * D);
    const ccx = ox + Math.round(c.width / 2) * D, ccy = oy + Math.round(c.height / 2) * D;
    if (id === 'v' && lat > 0.01) {
      const gx = cx * RES, gy = cy * RES, r0 = (P.O / 2) * RES;
      const gl = ctx.createRadialGradient(gx, gy, r0 * 0.9, gx, gy, r0 * 1.8); gl.addColorStop(0, `rgba(255,30,20,${0.45 * lat})`); gl.addColorStop(1, 'rgba(255,30,20,0)');
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = gl; ctx.fillRect(gx - r0 * 1.8, gy - r0 * 1.8, r0 * 3.6, r0 * 3.6); ctx.globalCompositeOperation = 'source-over';
    }
    // la vida baja raja la piedra de la casa: las grietas sangran luz con el latido
    if (id === 'v' && kV < 0.3 && !h.muerto) { const q = (0.3 - kV) / 0.3, hasta = 0.3 + 0.7 * q; grietasHondas(mc.fisV, ccx, ccy, D, 0.5 + 0.5 * q, hasta); grietasLuz(mc.fisV, ccx, ccy, D, '255,40,24', 0.35 + 0.35 * q + 0.5 * lat, hasta); }
    estadosOrbe(j, ccx, ccy, R, D, id as 'v' | 'm', V);
  }
  // la sangre de la racha por la piedra (las casas, el muro y la bandeja)
  sangreRacha(j, mc.mat, mc.w, mc.h, mc.clave, 2, mc.w - 2, dx, dy, D, t);
  // la experiencia en la canaleta
  { const kx = V.kxp, [x, y, w, hh] = P.xp;
    ctx.fillStyle = '#b8952f'; ctx.fillRect(Math.round(x * RES), Math.round(y * RES), Math.round(w * kx * RES), Math.max(D, Math.round(hh * RES))); ctx.fillStyle = '#f2cc60'; ctx.fillRect(Math.round(x * RES), Math.round(y * RES), Math.round(w * kx * RES), D);
    if (V.subio > 0) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,210,110,${0.55 * V.subio})`; ctx.fillRect(Math.round(x * RES), Math.round(y * RES), Math.round(w * RES), Math.max(D, Math.round(hh * RES))); ctx.globalCompositeOperation = 'source-over'; } }
  // la reliquia de la clase en su nicho
  // (en el teléfono al doble y sin rótulo: la pieza tiene que leerse con el aparato a un brazo; tocarla dice qué es)
  { const kR = P.tel ? 2 : 1; reliquiaClase(j, dx(mc.rel[0]), dy(mc.rel[1]), Math.floor(mc.rel[2] / kR), Math.floor(mc.rel[3] / kR), D * kR, t); }
  // con un jefe despierto cae ceniza y se junta en el canto de la piedra
  if (V.jefe > 0 || cenizaViva) cenizaViva = cenizaJefe(V, mc.mat, mc.w, mc.h, mc.clave, dx, dy, D, true);
  // el héroe muerto: el marco se apaga (la Marca no)
  if (V.muerto > 0.01) { mc.apagado ??= siluetaNegra(mc.cv); ctx.globalAlpha = 0.62 * V.muerto; ctx.drawImage(mc.apagado, e.ox, e.oy + mc.y0 * D); ctx.globalAlpha = 1; }
  ctx.restore();
  // los números de cada orbe, siempre a la vista (en el táctil no hay ratón encima)
  const tn = Math.max(10, Math.round(L(P.tel ? 11 : 12)));
  // (con la letra de pixel, a puntos enteros: el grado sale del tamaño que tenía la letra del navegador)
  const gr = { alin: 'center' as const, escala: tn / 10 };
  textoPixel(`${Math.ceil(h.vida)}`, P.orbV[0], P.orbV[1] + P.O * 0.36, { ...gr, color: '#ffd0c0' });
  textoPixel(`${Math.floor(h.mana)}`, P.orbM[0], P.orbM[1] + P.O * 0.36, { ...gr, color: '#d0dcff' });
  marca();
  hud.orbes = P.orbes; hud.casaVida = P.casaV; hud.casaMana = P.casaM; hud.reliquia = P.reliquia;
  // tocar la reliquia dice qué es (en el dedo no hay ratón que pase por encima)
  if (dentroR(P.reliquia)) { ui.sobreUI = true; if (E.clicIzq) { E.clicIzq = false; const ay = AYUDA_RELIQUIA[d.clase]; if (ay && t - tAyuda > 3) { tAyuda = t; msg(j, ay, '#e0d0a0'); } } }
  // las casas no son del mundo: un toque ahí no camina
  if (dentroR(P.casaV) || dentroR(P.casaM)) ui.sobreUI = true;
}
let cenizaViva = false, tAyuda = -9;
const dentroR = (r: Rect) => E.x >= r[0] && E.x < r[0] + r[2] && E.y >= r[1] && E.y < r[1] + r[3];
const ultimo: Record<string, HTMLCanvasElement | null> = {};

/** Lo de adentro de una casilla del cinturón táctil: la poción a pixel entero y las cuentas de lo apilado abajo. */
export function pocionForja(j: Juego, i: number, r: Rect, apretado: boolean) {
  const d = j.heroe.d, o = d.cinturon[i], tipos = tiposCinturon(d), e = espacio();
  const s = Math.round((r[2] * RES) / e.D), x = Math.round((r[0] * RES - e.ox) / e.D) * e.D + e.ox, y = Math.round((r[1] * RES - e.oy) / e.D) * e.D + e.oy;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (apretado) { ctx.fillStyle = 'rgba(255,230,170,0.16)'; ctx.fillRect(x, y, s * e.D, s * e.D); }
  if (!o) frascoVacio(COLOR_POCION[tipos[i]], x, y, s, e.D);
  ctx.restore();
  // (el ícono del objeto se dibuja en puntos lógicos, como en la bolsa)
  if (o) { const pad = r[2] * 0.12; icono(o, r[0] + pad, r[1] + pad * 0.5, r[2] - pad * 2, r[3] - pad * 2.3); }
  const cap = filasColumna(d, o), n = o ? Math.min(cap, cant(o)) : 0, pip = Math.max(3, Math.round(s / 12)), sep = pip + 2, w0 = cap * sep - 2;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const px0 = x + Math.round((s - w0) / 2) * e.D, py = y + (s - pip - 3) * e.D;
  for (let k = 0; k < cap; k++) perla(px0 + k * sep * e.D, py, pip, e.D, k < n ? COLOR_POCION[o?.pocion ?? tipos[i]] : null);
  ctx.restore();
}
