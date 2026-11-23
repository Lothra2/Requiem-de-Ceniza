// Lo que queda después de pedir un poder (Rick, 19 nov 2026, tercera pasada: "nada afuera, nada a medias"): las
// invocaciones, las trampas, las auras y las mejoras, una por una.
//   - Invocaciones: llegan con lo suyo (los muertos rompen el piso y suben armándose hueso por hueso con su sello morado,
//     el gólem sale de un charco que hierve, las bestias del druida toman cuerpo de un remolino de hojas y luz verde, el
//     espíritu baja en un haz, el halcón cae en picada) y se van con lo suyo (el alma morada que sube, las hojas que se
//     llevan al lobo, la sangre del gólem que se desarma, la luz del espíritu que se apaga hacia arriba).
//   - Trampas: armadas se ven pero apenas (la runa que late, el brillo que corre por los dientes del cepo, la brasa que
//     respira, los hongos que sueltan esporas) y al saltar revientan con lo suyo. La torreta es una ballesta de verdad que
//     apunta, retrocede al tirar y se desarma al terminar.
//   - Auras: un sello vivo bajo los pies (gira, con sus glifos), el borde del campo que respira y motas del elemento que
//     suben dentro del campo. Todo va en el piso (lo tapan los muros y el cuerpo) y no se pinta sobre lo que no es piso.
//     Late cuando toca a alguien: el golpe del brío, el fuego de la brasa santa, las púas del zarzal, el escudo de la
//     firmeza, la cura de la vigilia y del roble, el ojo de la sentencia sobre cada enemigo.
//   - Mejoras: un estallido al pedirla (grito, metal, sangre, luz, escarcha, rayo, viento, bestia, vidrio, piedra, hueso
//     o cura), mientras dura el canto del cuerpo de su color y unas pocas motas, y al terminar se apaga de a poco.
// Todo a puntos enteros y dentro del orden del mundo. En táctil la mitad de motas y piezas, sin lecturas del lienzo.
// `__sinPresencias` vuelve a lo de antes.
import type { Juego, Monstruo } from '../juego/mundo';
import { E } from '../nucleo/lienzo';
import { anilloPiso, chispasLibres } from './energia';
import { nochePfx } from './pfx';
import { HABILIDADES, type Habilidad } from '../datos/clases';
import { M as V, poderesVivos } from './poderes_vivos';
import { alCambiarForma, formasVivas, DUR_CAMBIO, type Forma } from './formas';

type RGB = [number, number, number];
type AP = (x: number, y: number) => [number, number];
type Item = { prof: number; draw: () => void };
const R = Math.random;
const rnd = (a: number, b: number) => a + R() * (b - a);
const elige = <T,>(xs: T[]) => xs[Math.floor(R() * xs.length)];
const KT = () => (E.tactil ? 0.5 : 1);
export const presenciasVivas = () => poderesVivos() && !(window as any).__sinPresencias;
const HABS = new Map<string, Habilidad>(HABILIDADES.map((h) => [h.id, h]));
const rgba = (c: RGB, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

// ------------------------------------------------------------------ paletas
interface Pal { c: string; c2: string; c3: string; rgb: RGB }
const PAL: Record<string, Pal> = {
  fuego: { c: '#ff7a20', c2: '#ffd870', c3: '#6a1606', rgb: [255, 130, 40] },
  furia: { c: '#ff4a22', c2: '#ffc890', c3: '#560a04', rgb: [255, 84, 40] },
  frio: { c: '#8ad0ff', c2: '#effaff', c3: '#24446e', rgb: [140, 205, 255] },
  rayo: { c: '#8ab0ff', c2: '#ffffff', c3: '#1a2a74', rgb: [150, 180, 255] },
  luz: { c: '#ffd860', c2: '#fff7d8', c3: '#6a4a0c', rgb: [255, 220, 120] },
  oro: { c: '#f0b840', c2: '#fff0b0', c3: '#5a3a08', rgb: [245, 190, 80] },
  oracion: { c: '#9ad0ff', c2: '#f4fbff', c3: '#28406a', rgb: [160, 210, 255] },
  firmeza: { c: '#b0c0f0', c2: '#ffffff', c3: '#2c3460', rgb: [180, 195, 245] },
  sombra: { c: '#b070ff', c2: '#f0dcff', c3: '#28103e', rgb: [180, 110, 255] },
  muerto: { c: '#9a62ff', c2: '#d8ffe0', c3: '#1e0c34', rgb: [160, 100, 255] },
  ceniza: { c: '#ff8a40', c2: '#e8dcd0', c3: '#2a1a14', rgb: [255, 150, 70] },
  sangre: { c: '#d01818', c2: '#ff8a70', c3: '#440406', rgb: [225, 30, 30] },
  veneno: { c: '#7ad040', c2: '#e0ffa0', c3: '#1a340a', rgb: [130, 220, 70] },
  bosque: { c: '#6cc450', c2: '#e4ffbc', c3: '#1a360e', rgb: [115, 205, 95] },
  remero: { c: '#5ac0a0', c2: '#d8fff0', c3: '#0e3a30', rgb: [100, 210, 175] },
  viento: { c: '#c8e8f4', c2: '#ffffff', c3: '#46687a', rgb: [205, 235, 245] },
  piedra: { c: '#c0ac8a', c2: '#f4ead2', c3: '#3a3024', rgb: [205, 185, 150] },
  corteza: { c: '#a07a48', c2: '#e8d0a0', c3: '#2e1e0e', rgb: [180, 140, 90] },
  acero: { c: '#c8ccd8', c2: '#ffffff', c3: '#363a46', rgb: [210, 216, 232] },
  bestia: { c: '#c89a5a', c2: '#ffe8b8', c3: '#3a2410', rgb: [215, 170, 105] },
};

// ------------------------------------------------------------------ glifos de 5 x 5 (sellos de aura y de trampa)
const G5: Record<string, number[]> = {
  espada: [4, 4, 4, 14, 4], cruz: [4, 31, 4, 4, 4], espina: [4, 21, 14, 4, 4], escudo: [31, 17, 17, 10, 4], llama: [4, 10, 10, 21, 14],
  pluma: [3, 6, 12, 24, 16], ojo: [0, 14, 27, 14, 0], hoja: [2, 7, 14, 28, 8], runa: [17, 10, 4, 10, 17], rayo: [6, 12, 31, 6, 12],
  sello: [14, 17, 21, 17, 14], gota: [4, 4, 14, 31, 14], copo: [21, 14, 31, 14, 21], diente: [21, 21, 31, 0, 0], hongo: [14, 31, 4, 4, 0],
};
function glifo(ctx: CanvasRenderingContext2D, g: number[], x: number, y: number) { for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 5; xx++) if (g[yy] & (16 >> xx)) ctx.rect(x + xx, y + yy, 1, 1); }

// ------------------------------------------------------------------ motas
type KMota = 'brasa' | 'escarcha' | 'chispa' | 'luz' | 'hoja' | 'sangre' | 'sombra' | 'veneno' | 'viento' | 'polvo' | 'hueso' | 'cura' | 'pluma' | 'espina';
interface Mota { k: KMota; x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; d: number; c: string; c2: string; sem: number; orb?: { cx: number; cy: number; r: number; an: number; w: number } }
const motas: Mota[] = [];
const TOPE_M = () => (E.tactil ? 90 : 200);
function mota(k: KMota, x: number, y: number, z: number, p: Pal, o: Partial<Mota> = {}) {
  if (motas.length >= TOPE_M()) return;
  const sube = k === 'brasa' || k === 'luz' || k === 'cura' || k === 'veneno' || k === 'sombra' ? rnd(14, 34) : k === 'escarcha' || k === 'hoja' || k === 'pluma' ? -rnd(4, 10) : rnd(4, 14);
  motas.push({ k, x, y, z, vx: rnd(-0.25, 0.25), vy: rnd(-0.25, 0.25), vz: sube, t: 0, d: rnd(0.8, 1.5), c: p.c, c2: p.c2, sem: Math.floor(R() * 1e6), ...o });
}
function moverMotas(dt: number) {
  for (let i = motas.length - 1; i >= 0; i--) {
    const m = motas[i]; m.t += dt; if (m.t > m.d) { motas[i] = motas[motas.length - 1]; motas.pop(); continue; } if (m.t < 0) continue;
    if (m.orb) { m.orb.an += m.orb.w * dt; m.x = m.orb.cx + Math.cos(m.orb.an) * m.orb.r; m.y = m.orb.cy + Math.sin(m.orb.an) * m.orb.r; m.z += m.vz * dt; continue; }
    m.x += m.vx * dt; m.y += m.vy * dt; m.z = Math.max(0, m.z + m.vz * dt);
    if (m.k === 'hoja' || m.k === 'pluma') { m.vx += Math.sin(m.t * 5 + m.sem) * dt * 1.5; }
  }
}
function dibMota(ctx: CanvasRenderingContext2D, m: Mota, aP: AP) {
  const [px, py] = aP(m.x, m.y), x = Math.round(px), y = Math.round(py - m.z), u = m.t / m.d, a = Math.min(1, m.t * 8) * Math.min(1, (1 - u) * 3);
  if (a <= 0.02) return;
  ctx.save(); ctx.globalAlpha = a;
  switch (m.k) {
    case 'brasa': { const c = u < 0.4 ? m.c2 : m.c; ctx.fillStyle = c; ctx.fillRect(x, y, 1, (m.sem & 1) + 1); if (u < 0.25) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c; ctx.fillRect(x - 1, y, 3, 1); } break; }
    case 'luz': case 'cura': { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c; ctx.fillRect(x, y, 1, 1);
      if (m.k === 'cura') { ctx.fillStyle = m.c2; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); }
      else if (Math.sin(m.t * 14 + m.sem) > 0.7) { ctx.fillStyle = m.c2; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } break; }
    case 'escarcha': { ctx.fillStyle = m.c2; ctx.fillRect(x, y, 1, 1); if (Math.sin(m.t * 11 + m.sem) > 0.6) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#ffffff'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } break; }
    case 'chispa': { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c2; const j = Math.floor(m.t * 30 + m.sem) % 3; ctx.fillRect(x + j - 1, y, 1, 1); ctx.fillRect(x, y + (j & 1), 1, 1); ctx.fillStyle = m.c; ctx.fillRect(x - 1 + (j & 1), y - 1, 1, 1); break; }
    case 'hoja': case 'pluma': { const sw = Math.cos(m.t * 6 + m.sem) > 0; ctx.fillStyle = m.c; ctx.fillRect(x, y, sw ? 2 : 1, 1); ctx.fillStyle = m.c2; ctx.fillRect(x + (sw ? 1 : 0), y + 1, 1, 1); if (m.k === 'pluma') { ctx.fillStyle = m.c; ctx.fillRect(x - 1, y - 1, 1, 1); } break; }
    case 'sangre': { ctx.fillStyle = m.c; ctx.fillRect(x, y, 1, 2); break; }
    case 'sombra': { ctx.fillStyle = '#1c0a2c'; ctx.fillRect(x, y, 2, 2); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c; ctx.fillRect(x, y, 1, 1); break; }
    case 'veneno': { ctx.fillStyle = m.c; const s = u > 0.85 ? 0 : 2; if (s) { ctx.fillRect(x, y, s, 1); ctx.fillRect(x, y + s, s, 1); ctx.fillRect(x - 1, y + 1, 1, 1); ctx.fillRect(x + s, y + 1, 1, 1); ctx.fillStyle = m.c2; ctx.fillRect(x, y, 1, 1); } else { ctx.fillRect(x - 1, y, 1, 1); ctx.fillRect(x + 1, y, 1, 1); } break; }
    case 'viento': { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = m.c; const l = 3 + (m.sem % 3), dx = m.orb ? -Math.sin(m.orb.an) : 1; for (let i = 0; i < l; i++) ctx.fillRect(Math.round(x - dx * i), y, 1, 1); break; }
    case 'polvo': { ctx.globalAlpha = a * 0.5; ctx.fillStyle = m.c; ctx.fillRect(x, y, 2, 1); break; }
    case 'hueso': { ctx.fillStyle = '#5a5444'; ctx.fillRect(x, y + 1, 3, 1); ctx.fillStyle = m.c2; ctx.fillRect(x, y, 3, 1); break; }
    case 'espina': { ctx.fillStyle = m.c; ctx.fillRect(x, y, 1, 3); ctx.fillStyle = m.c2; ctx.fillRect(x, y, 1, 1); break; }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ marcas propias (anillos de pulso, sellos que se cierran, restos de trampas)
interface Mk { k: 'pulso' | 'sello' | 'rayos' | 'escudo' | 'cepo' | 'hongos' | 'picada' | 'torreta' | 'llamarada' | 'ojo' | 'barrido'; x: number; y: number; t: number; d: number; p: Pal; r: number; z?: number; g?: string; ang?: number; sem: number; sale?: boolean }
const marcas: Mk[] = [];
function mk(m: Partial<Mk> & { k: Mk['k']; x: number; y: number; d: number; p: Pal }) { if (marcas.length < (E.tactil ? 40 : 90)) marcas.push({ t: 0, r: 1, sem: Math.floor(R() * 1e6), ...m } as Mk); }

// ------------------------------------------------------------------ estado
const vistos = new WeakMap<object, { k: string; ido?: boolean }>();
const vistosPicada = new WeakSet<object>();
let tAnt = -1, zonaAnt = '';
let buffsAnt = new Map<string, number>();
let rimFin: { c: RGB; t0: number } | null = null;
const finBuff: { id: string; t0: number }[] = [];
let latido = 0, ultimaLuz = -9;
((window as any).__limpiadores ??= []).push(() => { motas.length = marcas.length = 0; buffsAnt = new Map(); rimFin = null; finBuff.length = 0; trampasVivas.length = 0; cambiosPend.length = 0; });

// ------------------------------------------------------------------ invocaciones
/** De qué es cada invocado: muerto, ceniza, sangre, bestia, espíritu, ave o árbol. */
function claseInv(m: Monstruo): string {
  const id = m.invocaId ?? '', hb = (m as any).habInv as string | undefined;
  if (hb === 'legion_ceniza') return 'ceniza';
  if (id === 'golem') return 'sangre';
  if (id === 'lobo' || id === 'oso') return 'bestia';
  if (id === 'halcon') return 'ave';
  if (id === 'arbol') return 'arbol';
  if (id === 'espiritu') return 'espiritu';
  return 'muerto';
}
/** Cuánto se ve el cuerpo de un invocado (las bestias, el espíritu y el halcón toman cuerpo y se deshacen). */
export function alfaInvocado(m: any, ahora: number): number {
  if (!presenciasVivas() || !m.dueno || m.invocaId === 'thor') return 1;
  const k = claseInv(m); if (k !== 'bestia' && k !== 'espiritu' && k !== 'ave' && k !== 'arbol') return 1;
  if (m.muerto) return Math.max(0, 1 - (m.tMuerto ?? 0) / (k === 'arbol' ? 1.6 : 0.9));
  const ed = ahora - (m.nace ?? -9); return ed >= 0 && ed < 0.6 ? Math.max(0.05, (ed / 0.6) ** 1.4) : 1;
}
/** El color del aro de los pies de cada invocado (antes todos verdes): morado los muertos, rojo el gólem, verde el bosque, oro el espíritu. */
export function aroInvocado(m: any): string | null {
  if (!presenciasVivas()) return null;
  const k = claseInv(m);
  return k === 'muerto' ? '170,120,255' : k === 'ceniza' ? '255,150,80' : k === 'sangre' ? '255,70,60' : k === 'espiritu' ? '255,225,130' : k === 'ave' ? '240,200,130' : null;
}
function llegada(j: Juego, m: Monstruo) {
  const k = claseInv(m), x = m.x, y = m.y, esc = Math.max(0.8, m.escala ?? 1);
  if (k === 'muerto' || k === 'ceniza') {
    const p = k === 'ceniza' ? PAL.ceniza : PAL.muerto;
    // el piso se raja con su luz morada (o de brasa la legión), el sello se dibuja y se cierra, los huesos asoman
    V.grieta(x, y, 0.9 * esc, 1.6, k === 'ceniza' ? '#ff7a30' : '#a060ff');
    // (de a muchos, como la Legión, solo el primero enciende la luz del centro: seis juntos lavaban la pantalla de día)
    const solo = j.t - ultimaLuz > 0.25; if (solo) ultimaLuz = j.t;
    mk({ k: 'sello', x, y, d: 1.1, p, r: 0.95 * esc, g: k === 'ceniza' ? 'llama' : 'runa', z: solo ? 0 : -1 });
    V.puas(x, y, 5, 0.55, 'hueso', 9, 0.55);
    V.polvo(x, y, 5, k === 'ceniza' ? '#3a2a22' : '#2a1838', 5, 14, 1.2);
    for (let i = 0; i < 10 * KT(); i++) { const an = R() * 6.283, r = rnd(0.1, 0.6); mota(k === 'ceniza' ? 'brasa' : 'sombra', x + Math.cos(an) * r, y + Math.sin(an) * r, rnd(0, 6), p, { vz: rnd(20, 50), d: rnd(0.7, 1.2) }); }
    anilloPiso(x, y, { d: 0.5, r0: 0.2, r1: 1.4 * esc, c: p.rgb, g: 2, a: 0.6 });
    return;
  }
  if (k === 'sangre') {
    V.mancha(j, { x, y, r: 0.9, color: '#5a0808', t: 0, tipo: 'sangre', forma: 'charco', rmax: 1.3, sem: 5, pal: 'rojo' });
    mk({ k: 'sello', x, y, d: 1.2, p: PAL.sangre, r: 1.2, g: 'gota' });
    for (let i = 0; i < 3; i++) V.fuente(x + rnd(-0.5, 0.5), y + rnd(-0.5, 0.5), 0.5, i * 0.08);
    V.sangre(x, y, 10, 0, 0, 14, 3, 0.8);
    V.grieta(x, y, 1.2, 1.8, '#ff2010');
    return;
  }
  if (k === 'bestia' || k === 'arbol') {
    const p = PAL.bosque, r = k === 'arbol' ? 1.5 : m.invocaId === 'oso' ? 1.2 : 0.9;
    mk({ k: 'sello', x, y, d: 1.2, p, r, g: 'hoja' });
    V.hojas(x, y, m.invocaId === 'oso' || k === 'arbol' ? 18 : 12);
    // el espíritu verde que toma cuerpo: motas que acuden en espiral al centro
    for (let i = 0; i < 16 * KT(); i++) { const an = R() * 6.283, rr = rnd(0.8, 1.5) * r; mota('luz', x, y, rnd(4, 30), p, { orb: { cx: x, cy: y, r: rr, an, w: rnd(3, 5) }, vz: rnd(-6, 6), d: rnd(0.4, 0.6) }); }
    V.polvo(x, y, m.invocaId === 'oso' ? 9 : 5, '#6a5a40', 5, 10, 1.6);
    if (m.invocaId === 'oso') { V.grieta(x, y, 1.1, 1.6); j.sacudida = Math.max(j.sacudida, 0.25); }
    anilloPiso(x, y, { d: 0.55, r0: 0.3, r1: 1.6 * r, c: p.rgb, g: 2, a: 0.55 });
    return;
  }
  if (k === 'espiritu') {
    V.haz(x, y, 0.8, 0.6, 0, '#e8ffd0'); mk({ k: 'sello', x, y, d: 1.2, p: PAL.luz, r: 1, g: 'sello' });
    for (let i = 0; i < 14 * KT(); i++) mota('luz', x + rnd(-0.4, 0.4), y + rnd(-0.4, 0.4), rnd(0, 40), PAL.luz, { vz: rnd(-30, -10), d: rnd(0.5, 0.9) });
    return;
  }
  if (k === 'ave') picadaHalcon(j, x, y, 1);
}
/** El halcón que baja en picada desde lo alto (al llamarlo y en la Picada): la silueta con su estela de viento, el golpe
 * de aire en el piso, plumas y polvo; después remonta con las alas abiertas. `k` es la fuerza (la Picada pega más). */
(window as any).__picadaHalcon = (x: number, y: number) => { if (jForma) picadaHalcon(jForma, x, y, 1.4); }; // (pruebas: t996_aves.cjs)
function picadaHalcon(j: Juego, x: number, y: number, k: number) {
  const LLEGA = 0.28;
  mk({ k: 'picada', x, y, d: 0.75, p: PAL.bestia, r: 1.7 * k, z: 0 });
  for (let i = 0; i < 14 * k * KT(); i++) { const an = R() * 6.283, v = rnd(0.6, 2); mota('pluma', x + Math.cos(an) * 0.15, y + Math.sin(an) * 0.15, rnd(6, 26), { ...PAL.bestia, c: elige(['#c8a070', '#f0e0c0', '#6a4a2a', '#8a6a40']) }, { t: -LLEGA, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(10, 30), d: rnd(1.4, 2.2) }); }
  for (let i = 0; i < 8 * k * KT(); i++) { const an = R() * 6.283, v = rnd(0.5, 1.6); mota('polvo', x, y, rnd(0, 4), { ...PAL.piedra, c: '#9a8a70' }, { t: -LLEGA, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(4, 10), d: rnd(0.6, 1) }); }
  anilloPiso(x, y, { d: 0.4, r0: 0.2, r1: 1.4 * k, c: [240, 220, 180], g: 2, a: 0.7, t: -LLEGA });
  mk({ k: 'rayos', x, y, d: 0.3, p: PAL.viento, r: 0.7, z: 14, t: -LLEGA } as any);
}
function despedida(j: Juego, m: Monstruo) {
  const k = claseInv(m), x = m.x, y = m.y;
  if (k === 'muerto' || k === 'ceniza') {
    const p = k === 'ceniza' ? PAL.ceniza : PAL.muerto;
    // el alma que vuelve a la tierra: el sello se cierra, motas que suben y huesitos sueltos
    mk({ k: 'sello', x, y, d: 0.8, p, r: 0.7, g: 'runa', sale: true });
    for (let i = 0; i < 12 * KT(); i++) mota(k === 'ceniza' ? 'brasa' : 'sombra', x + rnd(-0.3, 0.3), y + rnd(-0.3, 0.3), rnd(6, 24), p, { vz: rnd(26, 60), d: rnd(0.8, 1.4) });
    V.astillas(x, y, 10, 6, ['#e8e0c8', '#c8bea0'], '#4a4436', 2.5, 3);
    V.polvo(x, y, 3, '#2a1838', 4, 12, 0.8);
    return;
  }
  if (k === 'sangre') { V.sangre(x, y, 20, 0, 0, 22, 5, 1); V.mancha(j, { x, y, r: 1, color: '#4a0606', t: 0, tipo: 'sangre', forma: 'charco', rmax: 1.4, sem: 2, pal: 'rojo' }); return; }
  if (k === 'bestia' || k === 'arbol') {
    V.hojas(x, y, k === 'arbol' ? 22 : 14);
    for (let i = 0; i < 14 * KT(); i++) mota('luz', x + rnd(-0.4, 0.4), y + rnd(-0.4, 0.4), rnd(6, 36), PAL.bosque, { vz: rnd(20, 50), d: rnd(0.8, 1.3) });
    return;
  }
  if (k === 'espiritu') { for (let i = 0; i < 16 * KT(); i++) mota('luz', x + rnd(-0.3, 0.3), y + rnd(-0.3, 0.3), rnd(10, 40), PAL.luz, { vz: rnd(40, 80), d: rnd(0.6, 1.1) }); return; }
  if (k === 'ave') for (let i = 0; i < 10 * KT(); i++) mota('pluma', x + rnd(-0.3, 0.3), y + rnd(-0.3, 0.3), rnd(10, 30), { ...PAL.bestia, c: elige(['#c8a070', '#f0e0c0', '#6a4a2a']) }, { vz: -rnd(6, 12), d: rnd(1.2, 2) });
}

// ------------------------------------------------------------------ trampas
/** La trampa viva que se vio en el cuadro anterior (para saber cuándo se fue, si saltó o se gastó). */
const trampasVivas: { tr: any; x: number; y: number; hab: string; elem: string }[] = [];
function estiloTrampa(hab: string, elem: string): string {
  if (hab === 'torreta') return 'torreta';
  if (hab === 'cepo_dientes') return 'cepo';
  if (hab === 'trampa_chispas') return 'pilar';
  if (hab === 'corro_hongos') return 'hongos';
  if (hab === 'coto_caza') return elem === 'rayo' ? 'runa_rayo' : 'brasa_oro';
  return elem === 'rayo' ? 'runa_rayo' : elem === 'veneno' ? 'hongos' : 'brasa';
}
function puestaTrampa(tr: any) {
  const est = estiloTrampa(tr.hab ?? 'torreta', tr.elem ?? 'fisico'), x = tr.x, y = tr.y;
  V.polvo(x, y, 4, '#8a7a62', 4, 8, 0.8);
  const p = est === 'pilar' || est === 'runa_rayo' ? PAL.rayo : est === 'hongos' ? PAL.veneno : est === 'cepo' || est === 'torreta' ? PAL.acero : est === 'brasa_oro' ? PAL.oro : PAL.fuego;
  mk({ k: 'pulso', x, y, d: 0.45, p, r: 0.9 });
  if (est === 'torreta') V.astillas(x, y, 8, 4, ['#6a5030', '#8a7050'], '#2a1c10', 1.5, 2);
}
function saltaTrampa(j: Juego, ev: { x: number; y: number; hab: string; elem: string; r: number; blancos: [number, number][] }) {
  const est = estiloTrampa(ev.hab, ev.elem), x = ev.x, y = ev.y;
  if (est === 'cepo') {
    // las mandíbulas se cierran de golpe: chispas de hierro, polvo y sangre si mordió
    mk({ k: 'cepo', x, y, d: 1.2, p: PAL.acero, r: 1 });
    chispasLibres(Math.round(10 * KT()), () => { const an = R() * 6.283, v = rnd(1.5, 4); return { x, y, z: 4, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(50, 140), t: 0, d: rnd(0.2, 0.4), c: [255, 230, 170], s: 2, reb: 1 }; });
    V.polvo(x, y, 5, '#8a7a62', 4, 10, 1.4); V.estrella(x, y, 6, '#fff6d8', 9, 0.16);
    if (ev.blancos.length) V.sangre(x, y, 10, 0, 0, 12, 2, 0.8);
    j.sacudida = Math.max(j.sacudida, 0.2); return;
  }
  if (est === 'hongos') {
    // el corro revienta en una nube de esporas
    mk({ k: 'hongos', x, y, d: 1.4, p: PAL.veneno, r: 0.55, sale: true });
    V.puf(x, y, 8, 'veneno', 2); V.burbujas(x, y, 16, ev.r * 0.6); V.polvo(x, y, 10, '#4a7a22', 6, 18, ev.r * 1.2);
    for (let i = 0; i < 14 * KT(); i++) mota('veneno', x + rnd(-1, 1) * ev.r * 0.6, y + rnd(-1, 1) * ev.r * 0.6, rnd(0, 20), PAL.veneno, { vz: rnd(10, 30), d: rnd(0.8, 1.6) });
    anilloPiso(x, y, { d: 0.6, r0: 0.3, r1: ev.r, c: PAL.veneno.rgb, g: 2, a: 0.6 }); return;
  }
  if (est === 'runa_rayo') {
    // la runa suelta un rayo a cada uno que la pisó
    for (const [bx, by] of ev.blancos.slice(0, 5)) j.efectos.push({ id: 'arco_cadena', x, y, x2: bx, y2: by, t: 0, dir: 0, escala: 1, z: 0, dur: 0.3, za: 6, zb: 30, sem: Math.floor(R() * 1e6) } as any);
    V.estrella(x, y, 8, '#d8e4ff', 12, 0.25); V.grieta(x, y, 1, 1.4, '#8ab0ff');
    chispasLibres(Math.round(14 * KT()), () => { const an = R() * 6.283, v = rnd(2, 5); return { x, y, z: 6, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(40, 140), t: 0, d: rnd(0.15, 0.35), c: [200, 220, 255], s: 2, reb: 1 }; });
    anilloPiso(x, y, { d: 0.4, r0: 0.2, r1: ev.r, c: PAL.rayo.rgb, g: 2.5, a: 0.8 }); return;
  }
  // la brasa: revienta en una bola de fuego chica, lava en las grietas y brasas que vuelan
  j.efectos.push({ id: 'combustion', x, y, t: 0.2, dir: 0, escala: est === 'brasa_oro' ? 0.85 : 0.7, z: 0, dur: 2, sinImplosion: true } as any);
  V.grieta(x, y, 1.2, 2, est === 'brasa_oro' ? '#ffc040' : '#ff6a10');
}

// ------------------------------------------------------------------ auras
interface EstAura { p: Pal; g: string; mota: KMota; extra?: 'llamas' | 'puas' | 'viento' | 'hojas' }
const AURA: Record<string, EstAura> = {
  aura_fuerza: { p: PAL.furia, g: 'espada', mota: 'brasa' },
  aura_oracion: { p: PAL.oracion, g: 'cruz', mota: 'cura' },
  aura_espinas: { p: PAL.acero, g: 'espina', mota: 'espina', extra: 'puas' },
  aura_firmeza: { p: PAL.firmeza, g: 'escudo', mota: 'luz' },
  aura_llama: { p: PAL.fuego, g: 'llama', mota: 'brasa', extra: 'llamas' },
  aura_presteza: { p: PAL.viento, g: 'pluma', mota: 'viento', extra: 'viento' },
  aura_conviccion: { p: PAL.sombra, g: 'ojo', mota: 'sombra' },
  roble_sabio: { p: PAL.bosque, g: 'hoja', mota: 'hoja', extra: 'hojas' },
};
const auraDe = (j: Juego): [Habilidad, EstAura] | null => { const id = Object.values(j.heroe.buffs).find((b) => b.t > 9000)?.hab; const hb = id ? HABS.get(id) : undefined; return hb && AURA[hb.id] ? [hb, AURA[hb.id]] : null; };
function pulsoAura(j: Juego, ev: { x: number; y: number; k: string }, est: EstAura) {
  const p = est.p;
  if (ev.k === 'espinas') { V.puas(ev.x, ev.y, 5, 0.45, 'hueso', 12, 0.45); mk({ k: 'pulso', x: ev.x, y: ev.y, d: 0.35, p, r: 0.7 }); return; }
  if (ev.k === 'recibe') { mk({ k: 'escudo', x: ev.x, y: ev.y, d: 0.35, p, r: 1, z: 26 }); return; }
  if (ev.k === 'cura') { for (let i = 0; i < 5 * KT(); i++) mota('cura', ev.x + rnd(-0.3, 0.3), ev.y + rnd(-0.3, 0.3), rnd(10, 40), p, { d: rnd(0.7, 1) }); mk({ k: 'pulso', x: ev.x, y: ev.y, d: 0.5, p, r: 1.1 }); return; }
  if (ev.k === 'dano' && est.extra === 'llamas') { mk({ k: 'llamarada', x: ev.x, y: ev.y, d: 0.45, p, r: 0.6 }); return; }
  if (ev.k === 'ojo') { mk({ k: 'ojo', x: ev.x, y: ev.y, d: 0.7, p, r: 0.6, z: 64 }); mk({ k: 'pulso', x: ev.x, y: ev.y, d: 0.5, p, r: 0.6 }); return; }
  // el golpe con el aura puesta: un aro de su color bajo el blanco y unas chispas
  mk({ k: 'pulso', x: ev.x, y: ev.y, d: 0.4, p, r: 0.75 });
  if (est.mota === 'brasa') chispasLibres(Math.round(4 * KT()), () => { const an = R() * 6.283, v = rnd(1, 3); return { x: ev.x, y: ev.y, z: 20, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(30, 90), t: 0, d: 0.3, c: p.rgb, s: 2, reb: 0 }; });
}
/** Si la casilla de (x, y) es piso (el sello no se pinta sobre muros, agua honda ni el vacío). */
function piso(j: Juego, x: number, y: number) { const z = j.zona as any, cx = Math.floor(x), cy = Math.floor(y); if (cx < 0 || cy < 0 || cx >= z.W || cy >= z.H) return false; return !z.bloq[cy * z.W + cx]; }

// ------------------------------------------------------------------ mejoras
interface EstBuff { p: Pal; mota: KMota; burst: 'grito' | 'metal' | 'sangre' | 'luz' | 'frio' | 'rayo' | 'viento' | 'bestia' | 'vidrio' | 'piedra' | 'hueso' | 'cura' | 'fuego'; rim?: number; orb?: boolean }
const BUFF: Record<string, EstBuff> = {
  ira_jarl: { p: PAL.furia, mota: 'brasa', burst: 'grito', rim: 1 }, grito_guerra: { p: PAL.furia, mota: 'brasa', burst: 'grito' },
  canto_remero: { p: PAL.remero, mota: 'cura', burst: 'grito' }, piel_hierro: { p: PAL.acero, mota: 'chispa', burst: 'metal', rim: 1 },
  cuerno_ancestros: { p: PAL.oro, mota: 'luz', burst: 'grito' }, pacto_herida: { p: PAL.sangre, mota: 'sangre', burst: 'sangre', rim: 1 },
  juramento_renovado: { p: PAL.sombra, mota: 'luz', burst: 'luz' }, coro_sellos: { p: PAL.luz, mota: 'luz', burst: 'luz', rim: 1 },
  rezo_alivio: { p: PAL.oracion, mota: 'cura', burst: 'cura' }, egida_alba: { p: PAL.luz, mota: 'luz', burst: 'luz', rim: 1, orb: true },
  armadura_escarcha: { p: PAL.frio, mota: 'escarcha', burst: 'frio', rim: 1 }, tempestad: { p: PAL.rayo, mota: 'chispa', burst: 'rayo', rim: 1 },
  savia_bosque: { p: PAL.bosque, mota: 'hoja', burst: 'cura' }, caceria_salvaje: { p: PAL.bestia, mota: 'hoja', burst: 'grito', rim: 1 },
  armadura_hueso: { p: PAL.muerto, mota: 'sombra', burst: 'hueso' }, cortina_viento: { p: PAL.viento, mota: 'viento', burst: 'viento', orb: true },
  ojo_tifon: { p: PAL.viento, mota: 'viento', burst: 'viento', rim: 1, orb: true }, palma_serena: { p: PAL.luz, mota: 'cura', burst: 'cura' },
  mantra_piedra: { p: PAL.piedra, mota: 'polvo', burst: 'piedra', rim: 1 }, grulla: { p: PAL.viento, mota: 'pluma', burst: 'viento' },
  loto_dorado: { p: PAL.oro, mota: 'luz', burst: 'luz', rim: 1 }, ascenso_espiritu: { p: PAL.luz, mota: 'luz', burst: 'luz', rim: 1 },
  forma_lobo: { p: PAL.bestia, mota: 'hoja', burst: 'bestia' }, forma_oso: { p: PAL.bestia, mota: 'polvo', burst: 'bestia' },
  huracan: { p: PAL.frio, mota: 'escarcha', burst: 'viento', orb: true }, piel_corteza: { p: PAL.corteza, mota: 'hoja', burst: 'piedra', rim: 1 },
  destilar: { p: PAL.fuego, mota: 'brasa', burst: 'vidrio' }, elixir: { p: PAL.veneno, mota: 'veneno', burst: 'vidrio' },
  tonico_hierro: { p: PAL.acero, mota: 'veneno', burst: 'vidrio', rim: 1 }, panacea_negra: { p: PAL.veneno, mota: 'veneno', burst: 'vidrio', rim: 1 },
  aura_avivada: { p: PAL.luz, mota: 'luz', burst: 'luz' },
};
function estallidoBuff(j: Juego, est: EstBuff, id: string) {
  const h = j.heroe, x = h.x, y = h.y, p = est.p, def = HABS.get(id)?.definitiva;
  // las definitivas ya traen su golpe propio (poderes_vivos.ts): acá solo el canto y las motas
  for (let i = 0; i < 14 * KT(); i++) { const an = R() * 6.283, v = rnd(0.6, 1.8); mota(est.mota, x + Math.cos(an) * 0.2, y + Math.sin(an) * 0.2, rnd(10, 40), p, { vx: Math.cos(an) * v, vy: Math.sin(an) * v, d: rnd(0.6, 1.1) }); }
  if (def) return;
  switch (est.burst) {
    case 'grito': anilloPiso(x, y, { d: 0.45, r0: 0.4, r1: 3, c: p.rgb, g: 3, a: 0.75 }); anilloPiso(x, y, { d: 0.6, r0: 0.2, r1: 2.2, c: p.rgb, g: 2, a: 0.5, t: -0.1 });
      mk({ k: 'rayos', x, y, d: 0.35, p, r: 1, z: 46 }); V.polvo(x, y, 6, '#8a7a62', 5, 10, 2.2); break;
    case 'metal': mk({ k: 'escudo', x, y, d: 0.5, p, r: 1.2, z: 26 }); mk({ k: 'barrido', x, y, d: 0.4, p, r: 1, z: 64 }); chispasLibres(Math.round(12 * KT()), () => { const an = R() * 6.283, v = rnd(1.5, 4); return { x, y, z: 30, vx: Math.cos(an) * v, vy: Math.sin(an) * v, vz: rnd(40, 120), t: 0, d: rnd(0.2, 0.45), c: [235, 240, 255], s: 2, reb: 1 }; }); anilloPiso(x, y, { d: 0.4, r0: 0.3, r1: 1.8, c: p.rgb, g: 2, a: 0.6 }); break;
    case 'sangre': V.sangre(x, y, 36, 0, 0, 20, 2, 0.9); mk({ k: 'rayos', x, y, d: 0.3, p, r: 0.8, z: 40 }); anilloPiso(x, y, { d: 0.5, r0: 0.3, r1: 2, c: p.rgb, g: 3, a: 0.7 }); break;
    case 'luz': V.haz(x, y, 0.9, 0.55, 0, p.c2); mk({ k: 'sello', x, y, d: 1, p, r: 1.3, g: 'sello' }); break;
    case 'cura': mk({ k: 'sello', x, y, d: 0.9, p, r: 1.1, g: 'cruz' }); for (let i = 0; i < 10 * KT(); i++) mota('cura', x + rnd(-0.5, 0.5), y + rnd(-0.5, 0.5), rnd(0, 30), p, { d: rnd(0.8, 1.2) }); break;
    case 'frio': V.astillas(x, y, 30, 14, ['#f0faff', '#bfe6ff', '#86c4f0'], '#3a6a98', 3.5, 3, 0, 0, true); anilloPiso(x, y, { d: 0.5, r0: 0.3, r1: 2, c: p.rgb, g: 2, a: 0.7 }); mk({ k: 'sello', x, y, d: 0.8, p, r: 1, g: 'copo' }); break;
    case 'rayo': j.efectos.push({ id: 'arco_cadena', x: x + 0.3, y: y - 0.7, x2: x, y2: y, t: 0, dir: 0, escala: 1, z: 0, dur: 0.3, za: 240, zb: 40, cielo: true, sem: Math.floor(R() * 1e6) } as any); V.estrella(x, y, 40, '#d8e4ff', 12, 0.25); break;
    case 'viento': V.remolino(x, y, 0.8, '#d8f0ff', 1.6); V.polvo(x, y, 4, '#b8b0a0', 4, 8, 1.6); break;
    case 'bestia': V.polvo(x, y, 9, '#7a6a50', 6, 12, 2.2); V.hojas(x, y, 10); anilloPiso(x, y, { d: 0.45, r0: 0.3, r1: 2.4, c: p.rgb, g: 3, a: 0.6 }); mk({ k: 'rayos', x, y, d: 0.35, p, r: 1, z: 40 }); j.sacudida = Math.max(j.sacudida, 0.2); break;
    case 'vidrio': V.astillas(x, y, 44, 12, ['#e8faff', '#a8dcef', '#ffffff'], '#4a7890', 2.5, 3, 0, 0, true); V.puf(x + 0.15, y + 0.15, 44, HABS.get(id)?.elem === 'fuego' ? 'fuego' : 'veneno', 0.8); V.burbujas(x, y, 6, 0.4, p.c); break;
    case 'piedra': mk({ k: 'barrido', x, y, d: 0.45, p, r: 1, z: 64 }); V.astillas(x, y, 20, 14, id === 'piel_corteza' ? ['#6a4a28', '#8a6a40', '#4a3018'] : ['#8a7a62', '#a09078', '#5a4e40'], '#2a2018', 3, 3); V.polvo(x, y, 6, '#8a7a62', 5, 10, 1.6); anilloPiso(x, y, { d: 0.45, r0: 0.3, r1: 1.8, c: p.rgb, g: 3, a: 0.6 }); break;
    case 'hueso': V.astillas(x, y, 30, 14, ['#e8e0c8', '#c8bea0'], '#4a4436', 3, 3); mk({ k: 'sello', x, y, d: 0.9, p, r: 1, g: 'runa' }); break;
    case 'fuego': V.brasas(x, y, 30, 16, 3); break;
  }
}
/** El canto del cuerpo del héroe con una mejora puesta: [color, fuerza 0..1] o null. Lo dibuja escena.ts detrás del cuerpo. */
export function rimHeroe(j: Juego): [RGB, number] | null {
  if (!presenciasVivas()) return null;
  const ahora = j.t; let mejor: [RGB, number] | null = null, tMax = -1;
  for (const [k, b] of Object.entries(j.heroe.buffs)) { if (b.t > 9000) continue; const est = BUFF[k]; if (!est) continue; if (formasVivas() && k.startsWith('forma_')) continue; // (la bestia ya dice la forma: sin canto)
    // la última que se pidió manda el color; las que tienen canto propio (rim) se ven más
    const t0 = buffT0.get(k) ?? 0; if (t0 > tMax) { tMax = t0; const nace = Math.min(1, (ahora - t0) / 0.25), sale = Math.min(1, b.t / 0.7); mejor = [est.p.rgb, (est.rim ? 0.75 : 0.45) * Math.max(0.15, nace) * sale * (0.82 + 0.18 * Math.sin(ahora * 4))]; } }
  if (!mejor && rimFin) { const u = (ahora - rimFin.t0) / 0.7; if (u < 1) return [rimFin.c, 0.5 * (1 - u)]; rimFin = null; }
  return mejor;
}
const buffT0 = new Map<string, number>();

// ------------------------------------------------------------------ una vez por cuadro
export function seguirPresencias(j: Juego) {
  if (j.zona.id !== zonaAnt) { zonaAnt = j.zona.id; motas.length = marcas.length = 0; trampasVivas.length = 0; }
  const dt = tAnt < 0 ? 0 : Math.max(0, Math.min(0.05, j.t - tAnt)); tAnt = j.t;
  const pa = (j as any).pulsosAura as any[] | undefined, td = (j as any).trampasDisparadas as any[] | undefined;
  if (!presenciasVivas()) { if (pa) pa.length = 0; if (td) td.length = 0; motas.length = marcas.length = 0; return; }
  const h = j.heroe;
  // invocados: llegada y despedida
  for (const m of j.monstruos) { if (!m.dueno || m.invocaId === 'thor') continue;
    let s = vistos.get(m); if (!s) { s = { k: claseInv(m) }; vistos.set(m, s); if (!m.muerto && j.t - ((m as any).nace ?? -9) < 0.4) llegada(j, m); }
    if (m.muerto && !s.ido) { s.ido = true; despedida(j, m); } }
  // la Picada: el halcón baja en picada sobre el blanco con tres garras
  for (const e of j.efectos as any[]) if (e.hab === 'picada' && e.id === 'tajo_garras' && !vistosPicada.has(e)) { vistosPicada.add(e); picadaHalcon(j, e.x, e.y, 1.4); V.garras(e.x, e.y, 22, -0.9, '#d8a060', '#fff4e0', '#2a1a0a', 1.3, 0.28); }
  // trampas: puestas, disparadas y gastadas
  for (const tr of j.torretas as any[]) if (!trampasVivas.some((q) => q.tr === tr)) { trampasVivas.push({ tr, x: tr.x, y: tr.y, hab: tr.hab ?? 'torreta', elem: tr.elem ?? 'fisico' }); if (tr.t < 0.3) puestaTrampa(tr); }
  if (td?.length) { for (const ev of td) saltaTrampa(j, ev); td.length = 0; }
  for (let i = trampasVivas.length - 1; i >= 0; i--) { const q = trampasVivas[i]; if ((j.torretas as any[]).includes(q.tr)) continue; trampasVivas.splice(i, 1);
    // se gastó sin saltar: se apaga (la torreta se desarma)
    if (!q.tr.disparo) { if (q.hab === 'torreta') { mk({ k: 'torreta', x: q.x, y: q.y, d: 0.6, p: PAL.acero, r: 1, sale: true }); V.astillas(q.x, q.y, 10, 8, ['#6a5030', '#8a7050', '#9a9aa8'], '#2a1c10', 2, 3); V.polvo(q.x, q.y, 3, '#8a7a62', 4, 8, 0.8); }
      else if (q.hab === 'corro_hongos') mk({ k: 'hongos', x: q.x, y: q.y, d: 0.8, p: PAL.veneno, r: 0.55, sale: true });
      else mk({ k: 'pulso', x: q.x, y: q.y, d: 0.5, p: q.elem === 'rayo' ? PAL.rayo : PAL.fuego, r: 0.6, sale: true }); } }
  // el aura: motas en el campo, el latido y lo que toca
  const au = auraDe(j);
  if (au) { const [hb, est] = au, r = hb.radio ?? 5, p = est.p;
    if (R() < dt * 7 * KT()) { const an = R() * 6.283, rr = Math.sqrt(R()) * r * 0.85, x = h.x + Math.cos(an) * rr, y = h.y + Math.sin(an) * rr; if (piso(j, x, y)) mota(est.mota, x, y, rnd(0, 6), p, { d: rnd(1, 1.6) }); }
    if (R() < dt * 5 * KT()) { const an = R() * 6.283, rr = rnd(0.4, 1.1); mota(est.mota, h.x + Math.cos(an) * rr, h.y + Math.sin(an) * rr, rnd(0, 8), p); }
    latido += dt; if (latido > 2.4) { latido = 0; mk({ k: 'pulso', x: h.x, y: h.y, d: 0.9, p, r, sale: false, g: 'campo' });
      if (hb.id === 'aura_conviccion') for (const m of j.monstruos) if (!m.muerto && !m.dueno && Math.hypot(m.x - h.x, m.y - h.y) < r) pulsoAura(j, { x: m.x, y: m.y, k: 'ojo' }, est);
      if (hb.id === 'aura_oracion' || hb.id === 'roble_sabio') pulsoAura(j, { x: h.x, y: h.y, k: 'cura' }, est); }
    if (pa?.length) for (const ev of pa.slice(0, 8)) pulsoAura(j, ev, est);
  }
  if (pa) pa.length = 0;
  // mejoras: nacen, siguen y se apagan
  const ahora = new Map<string, number>();
  for (const [k, b] of Object.entries(h.buffs)) { if (b.t > 9000 || !BUFF[k]) continue; ahora.set(k, b.t);
    const antes = buffsAnt.get(k); if (antes === undefined || b.t > antes + 0.5) { buffT0.set(k, j.t); if (!(formasVivas() && k.startsWith('forma_'))) estallidoBuff(j, BUFF[k], k); } }
  for (const [k, t] of buffsAnt) if (!ahora.has(k)) { const est = BUFF[k]; if (!est) continue; if (formasVivas() && k.startsWith('forma_')) { buffT0.delete(k); continue; }
    // se acabó: el canto se apaga y las motas caen
    if (t < 0.6) { rimFin = { c: est.p.rgb, t0: j.t }; for (let i = 0; i < 10 * KT(); i++) mota(est.mota, h.x + rnd(-0.4, 0.4), h.y + rnd(-0.4, 0.4), rnd(20, 50), est.p, { vz: -rnd(10, 30), d: rnd(0.5, 0.9) }); mk({ k: 'pulso', x: h.x, y: h.y, d: 0.5, p: est.p, r: 0.9, sale: true }); }
    buffT0.delete(k); }
  buffsAnt = ahora;
  // mientras dura: pocas motas (de las dos últimas) y el orbe que gira de las que lo tienen
  const orden = [...ahora.keys()].sort((a, b) => (buffT0.get(b) ?? 0) - (buffT0.get(a) ?? 0)).slice(0, 2);
  for (const k of orden) { const est = BUFF[k];
    if (R() < dt * 3.2 * KT()) { const an = R() * 6.283, rr = rnd(0.2, 0.5); mota(est.mota, h.x + Math.cos(an) * rr, h.y + Math.sin(an) * rr, rnd(4, 40), est.p, { d: rnd(0.7, 1.1) }); }
    if (est.orb && R() < dt * 6 * KT()) mota(est.mota === 'viento' ? 'viento' : est.mota, h.x, h.y, rnd(8, 44), est.p, { orb: { cx: h.x, cy: h.y, r: rnd(0.55, 0.8), an: R() * 6.283, w: rnd(4, 6) }, vz: rnd(-4, 4), d: rnd(0.5, 0.8) }); }
  // el cambio de forma del druida: lo que quedó para el medio del cambio
  jForma = j; for (let i = cambiosPend.length - 1; i >= 0; i--) if (j.t >= cambiosPend[i].t) { const c = cambiosPend.splice(i, 1)[0]; c.fn(); }
  moverMotas(dt);
  for (let i = marcas.length - 1; i >= 0; i--) { const m = marcas[i]; m.t += dt; if (m.t > m.d) { marcas[i] = marcas[marcas.length - 1]; marcas.pop(); } }
}

// ------------------------------------------------------------------ el cambio de forma del druida (render/formas.ts)
let jForma: Juego | null = null;
const cambiosPend: { t: number; fn: () => void }[] = [];
const PELO: Record<Forma, string[]> = { lobo: ['#4e4c46', '#757168', '#8a857a', '#615e56', '#ada188'], oso: ['#36271a', '#4f3926', '#5d432d', '#755037', '#2b1f15'] };
/**
 * El druida cambia de cuerpo: la luz verde del bosque acude en espiral y se cierra sobre él (lo de antes se encoge y se
 * enciende), y en el medio del cambio revienta el pelo de la bestia (o de la que se va), hojas, polvo, un anillo en el
 * piso, los rayos de luz y un golpe de cámara; al volver a ser druida lo que cae es el pelo de la bestia que se deshace.
 */
function cambioForma(j: Juego, de: Forma | null, a: Forma | null) {
  const h = j.heroe, p = PAL.bosque, pesa = a === 'oso' || (!a && de === 'oso'), pelo = PELO[a ?? de ?? 'lobo'];
  for (let i = 0; i < 22 * KT(); i++) { const an = R() * 6.283, r = rnd(0.7, 1.5); mota('cura', h.x + Math.cos(an) * r, h.y + Math.sin(an) * r, rnd(4, 40), p, { orb: { cx: h.x, cy: h.y, r, an, w: rnd(6, 10) * (i % 2 ? 1 : -1) }, vz: rnd(10, 30), d: rnd(0.3, 0.45) }); }
  anilloPiso(h.x, h.y, { d: 0.4, r0: 1.6, r1: 0.3, c: p.rgb, g: 2, a: 0.55 });
  cambiosPend.push({ t: j.t + DUR_CAMBIO * 0.42, fn: () => {
    const x = h.x, y = h.y, alto = pesa ? 30 : 22;
    V.astillas(x, y, alto, a ? 26 : 34, pelo, pelo[pelo.length - 1], pesa ? 3.6 : 3, 3);
    V.hojas(x, y, a ? 14 : 8); V.polvo(x, y, pesa ? 12 : 8, '#7a6a50', pesa ? 7 : 5, 12, 2.4);
    anilloPiso(x, y, { d: 0.5, r0: 0.3, r1: pesa ? 2.8 : 2.2, c: p.rgb, g: 3, a: 0.7 });
    mk({ k: 'rayos', x, y, d: 0.32, p, r: pesa ? 1.2 : 1, z: alto });
    for (let i = 0; i < 16 * KT(); i++) { const an = R() * 6.283, v = rnd(0.8, 2.4); mota('cura', x + Math.cos(an) * 0.2, y + Math.sin(an) * 0.2, rnd(8, alto + 16), p, { vx: Math.cos(an) * v, vy: Math.sin(an) * v, d: rnd(0.5, 0.9) }); }
    j.sacudida = Math.max(j.sacudida, pesa ? 0.28 : 0.18);
  } });
}
alCambiarForma((de, a) => { if (jForma && presenciasVivas() && jForma.t > 0.3) cambioForma(jForma, de, a); });

// ------------------------------------------------------------------ el dibujo
/** Todo lo de este módulo en el orden del mundo (lo plano en el piso, lo de pie con su fila). */
export function itemsPresencias(ctx: CanvasRenderingContext2D, j: Juego, aP: AP, tiempo: number): Item[] {
  if (!presenciasVivas()) return [];
  const out: Item[] = [], h = j.heroe;
  for (const m of motas) if (m.t >= 0) out.push({ prof: m.x + m.y + 0.06, draw: () => dibMota(ctx, m, aP) });
  for (const m of marcas) { if (m.t < 0) continue; const pr = m.x + m.y, plano = m.k === 'pulso' || m.k === 'sello';
    out.push({ prof: plano ? -1e6 + pr + 0.62 : pr + (m.k === 'cepo' || m.k === 'hongos' || m.k === 'torreta' ? 0 : 0.08), draw: () => dibMarca(ctx, j, m, aP) }); }
  // el aura bajo los pies (en el piso, lo tapan el cuerpo y los muros)
  const au = auraDe(j);
  if (au && !h.muerto) out.push({ prof: -1e6 + h.x + h.y + 0.61, draw: () => dibAura(ctx, j, au[0], au[1], aP, tiempo) });
  // las trampas armadas
  for (const tr of j.torretas as any[]) { const est = estiloTrampa(tr.hab ?? 'torreta', tr.elem ?? 'fisico'), plano = est === 'brasa' || est === 'brasa_oro' || est === 'runa_rayo';
    out.push({ prof: plano ? -1e6 + tr.x + tr.y + 0.63 : tr.x + tr.y, draw: () => dibTrampa(ctx, j, tr, est, aP, tiempo) }); }
  // la armadura de hueso: placas de hueso que giran alrededor del pecho, las de atrás detrás del cuerpo
  if ((h as any).escudoHueso > 0 && !h.muerto) for (let k = 0; k < 6; k++) { const an = tiempo * 2.6 + k * 1.047, atras = Math.sin(an) < 0;
    out.push({ prof: h.x + h.y + (atras ? -0.03 : 0.05), draw: () => dibHueso(ctx, aP, h.x, h.y, an, k, tiempo) }); }
  // los cuervos y los halcones de los poderes: pájaros de pixel con su sombra en el piso, en el orden del mundo
  for (const c of j.cuervos as any[]) { out.push({ prof: -1e6 + c.x + c.y + 0.62, draw: () => dibSombraAve(ctx, j, aP, c, tiempo) }); out.push({ prof: c.x + c.y + 0.4, draw: () => dibAve(ctx, j, aP, c, tiempo) }); }
  // las líneas del coto que unen sus trampas
  const coto = (j.torretas as any[]).filter((t) => t.hab === 'coto_caza');
  if (coto.length > 2) out.push({ prof: -1e6 + coto[0].x + coto[0].y + 0.6, draw: () => dibCoto(ctx, coto, aP, tiempo) });
  return out;
}

const luzDia = () => 0.5 + 0.5 * nochePfx();
function elipse(ctx: CanvasRenderingContext2D, j: Juego, cx: number, cy: number, r: number, N: number, paso: number, aP: AP, wx: number, wy: number, fase = 0, hueco = 0) {
  // r en casillas: los puntos que caen fuera del piso no se pintan
  for (let i = 0; i < N; i += paso) { if (hueco && ((i + fase) % hueco) < hueco / 2) continue; const an = (i / N) * 6.283, x = wx + Math.cos(an) * r, y = wy + Math.sin(an) * r;
    if (!piso(j, x, y)) continue; const [px, py] = aP(x, y); ctx.rect(Math.round(px), Math.round(py), 1, 1); }
}
function dibAura(ctx: CanvasRenderingContext2D, j: Juego, hb: Habilidad, est: EstAura, aP: AP, t: number) {
  const h = j.heroe, p = est.p, [cx0, cy0] = aP(h.x, h.y), cx = Math.round(cx0), cy = Math.round(cy0), kd = luzDia(), R0 = 1.15, rC = hb.radio ?? 5;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // el sello: dos aros, el de adentro de a puntos; sombra oscura debajo (se lee sobre arena) y la luz encima
  const gir = t * 0.5, N = 92;
  const sello = (dy: number) => { ctx.beginPath(); elipse(ctx, j, cx, cy, R0, N, 1, aP, h.x, h.y + dy * 0); elipse(ctx, j, cx, cy, R0 * 0.72, N, 2, aP, h.x, h.y, Math.floor(t * 6), 6);
    // los glifos que giran entre los dos aros
    for (let g = 0; g < 6; g++) { const an = gir + (g / 6) * 6.283, x = h.x + Math.cos(an) * R0 * 0.86, y = h.y + Math.sin(an) * R0 * 0.86; if (!piso(j, x, y)) continue; const [gx, gy] = aP(x, y); glifo(ctx, G5[est.g], Math.round(gx) - 2, Math.round(gy) - 2 + dy); }
    // los rayos del sello: cuatro brazos cortos del aro de adentro hacia el centro (no tocan los pies)
    for (let b = 0; b < 4; b++) { const an = -gir * 0.6 + (b / 4) * 6.283; for (let q = 0; q < 5; q++) { const rr = R0 * (0.68 - q * 0.05), x = h.x + Math.cos(an) * rr, y = h.y + Math.sin(an) * rr; if (piso(j, x, y)) { const [bx, by] = aP(x, y); ctx.rect(Math.round(bx), Math.round(by) + dy, 1, 1); } } } };
  ctx.globalAlpha = 0.7; ctx.fillStyle = p.c3; ctx.translate(0, 1); sello(0); ctx.fill(); ctx.translate(0, -1);
  const lat = 0.75 + 0.25 * Math.sin(t * 3.2);
  ctx.globalAlpha = 0.55 * lat; ctx.fillStyle = p.c; sello(0); ctx.fill();
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * lat * kd; sello(0); ctx.fill();
  // el brillo que corre por el aro
  ctx.globalAlpha = 0.9 * kd; ctx.fillStyle = p.c2; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = t * 2.2 + i * 0.05; const x = h.x + Math.cos(an) * R0, y = h.y + Math.sin(an) * R0; if (piso(j, x, y)) { const [bx, by] = aP(x, y); ctx.rect(Math.round(bx), Math.round(by), 1, 1); } } ctx.fill();
  // el borde del campo: de a trazos que corren y respiran, muy tenue
  const resp = 0.5 + 0.5 * Math.sin(t * 1.6);
  ctx.globalAlpha = (0.18 + 0.14 * resp) * kd; ctx.fillStyle = p.c; ctx.beginPath(); elipse(ctx, j, cx, cy, rC, Math.round(rC * 70), 1, aP, h.x, h.y, Math.floor(t * 10), 14); ctx.fill();
  // lo propio de cada aura sobre el aro: llamitas, púas, viento u hojas
  if (est.extra === 'llamas') { ctx.globalAlpha = 0.85 * kd; for (let i = 0; i < 14; i++) { const an = (i / 14) * 6.283 + t * 0.4, x = h.x + Math.cos(an) * R0, y = h.y + Math.sin(an) * R0; if (!piso(j, x, y)) continue; const [fx, fy] = aP(x, y), hh = 2 + Math.round(2.5 * (0.5 + 0.5 * Math.sin(t * 9 + i * 1.7))); ctx.fillStyle = '#ff6a10'; ctx.fillRect(Math.round(fx), Math.round(fy) - hh, 1, hh); ctx.fillStyle = '#ffd870'; ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 1, 1); } }
  if (est.extra === 'puas') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.9; for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283 - t * 0.3, x = h.x + Math.cos(an) * R0 * 1.06, y = h.y + Math.sin(an) * R0 * 1.06; if (!piso(j, x, y)) continue; const [fx, fy] = aP(x, y), hh = 3 + (i % 3); ctx.fillStyle = '#4a4a54'; ctx.fillRect(Math.round(fx), Math.round(fy) - hh, 1, hh); ctx.fillStyle = '#e8ecf4'; ctx.fillRect(Math.round(fx), Math.round(fy) - hh, 1, 1); } }
  if (est.extra === 'viento') { ctx.globalAlpha = 0.6 * kd; ctx.fillStyle = p.c2; ctx.beginPath(); for (let b = 0; b < 3; b++) { const an0 = t * 4 + (b / 3) * 6.283; for (let i = 0; i < 14; i++) { const an = an0 + i * 0.06, x = h.x + Math.cos(an) * R0 * 1.25, y = h.y + Math.sin(an) * R0 * 1.25; if (!piso(j, x, y)) continue; const [fx, fy] = aP(x, y); ctx.rect(Math.round(fx), Math.round(fy) - 3, 1, 1); } } ctx.fill(); }
  if (est.extra === 'hojas') { ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.85; for (let i = 0; i < 8; i++) { const an = (i / 8) * 6.283 + t * 0.25, x = h.x + Math.cos(an) * R0 * 1.08, y = h.y + Math.sin(an) * R0 * 1.08; if (!piso(j, x, y)) continue; const [fx, fy] = aP(x, y); ctx.fillStyle = i % 2 ? '#5a8a2a' : '#8ab040'; ctx.fillRect(Math.round(fx), Math.round(fy) - 1, 2, 1); ctx.fillRect(Math.round(fx) + 1, Math.round(fy), 1, 1); } }
  ctx.restore();
}
function dibTrampa(ctx: CanvasRenderingContext2D, j: Juego, tr: any, est: string, aP: AP, t: number) {
  const [px0, py0] = aP(tr.x, tr.y), px = Math.round(px0), py = Math.round(py0), kd = luzDia(), nace = Math.min(1, tr.t / 0.3), vida = tr.dur - tr.t, lat = 0.5 + 0.5 * Math.sin(t * 4 + tr.x * 3);
  const brillo = ((t * 0.65 + tr.x * 0.37) % 1.6) / 1.6; // el destello que corre cada 1,6 s
  ctx.save(); ctx.imageSmoothingEnabled = false;
  switch (est) {
    case 'torreta': {
      // ballesta de torreta: trípode de madera, caja de hierro con remaches, los brazos del arco que apuntan al blanco
      const ang: number = tr.ang ?? 0.6, [sx, sy] = (() => { const ux = Math.cos(ang), uy = Math.sin(ang), x = ux - uy, y = (ux + uy) / 2, l = Math.hypot(x, y) || 1; return [x / l, y / l]; })();
      const ret = tr.tiro !== undefined ? Math.max(0, 1 - (j.t - tr.tiro) / 0.12) : 0, se = vida < 0.5 ? Math.max(0, vida / 0.5) : 1, alto = Math.round(18 * nace * se);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(px - 9, py, 19, 3);
      // patas (con su canto de luz)
      for (const [dx, dy] of [[-9, 1], [9, 1], [0, 4]]) for (let i = 0; i <= alto; i++) { const f = i / Math.max(1, alto), x = Math.round(px + dx * (1 - f) * nace), y = Math.round(py + dy * (1 - f) - i); ctx.fillStyle = '#2a1a0c'; ctx.fillRect(x, y, 2, 1); ctx.fillStyle = '#6a4a28'; ctx.fillRect(x, y, 1, 1); }
      const bx = px - Math.round(sx * ret * 3), byr = py - alto - 5 - Math.round(sy * ret * 3);
      // la caja de hierro con remaches y la manivela
      ctx.fillStyle = '#1e1e26'; ctx.fillRect(bx - 6, byr - 4, 13, 9); ctx.fillStyle = '#4a4a56'; ctx.fillRect(bx - 5, byr - 3, 11, 7); ctx.fillStyle = '#7a7a88'; ctx.fillRect(bx - 5, byr - 3, 11, 1);
      ctx.fillStyle = '#b8a060'; ctx.fillRect(bx - 4, byr - 2, 1, 1); ctx.fillRect(bx + 4, byr - 2, 1, 1); ctx.fillRect(bx - 4, byr + 2, 1, 1); ctx.fillRect(bx + 4, byr + 2, 1, 1);
      ctx.fillStyle = '#2a2a30'; ctx.fillRect(bx - 8, byr, 2, 1); ctx.fillRect(bx - 8, byr - 2, 1, 3);
      // el riel y el virote hacia donde apunta
      const tipX = bx + Math.round(sx * 13), tipY = byr + Math.round(sy * 13);
      ctx.fillStyle = '#3a2614'; ctx.beginPath(); for (let i = 0; i <= 13; i++) { ctx.rect(Math.round(bx + sx * i), Math.round(byr + sy * i), 1, 2); } ctx.fill();
      // los brazos del arco (perpendiculares, curvos) y la cuerda tensa
      const nx = -sy, ny = sx, ax = bx + Math.round(sx * 9), ay = byr + Math.round(sy * 9), tens = ret > 0 ? 1 : 4;
      ctx.fillStyle = '#5a3a1c'; ctx.beginPath(); for (let i = -9; i <= 9; i++) { const cur = (i * i) / 30; ctx.rect(Math.round(ax + nx * i - sx * cur), Math.round(ay + ny * i * 0.8 - sy * cur), 2, 1); } ctx.fill();
      ctx.fillStyle = '#e0d8c8'; ctx.beginPath(); for (let i = -9; i <= 9; i++) { const f = 1 - Math.abs(i) / 9; ctx.rect(Math.round(ax + nx * i - sx * (2.7 + tens * f)), Math.round(ay + ny * i * 0.8 - sy * (2.7 + tens * f)), 1, 1); } ctx.fill();
      if (ret <= 0) { ctx.fillStyle = '#d8dce8'; ctx.fillRect(tipX, tipY, 1, 1); ctx.fillStyle = '#ffffff'; ctx.fillRect(tipX + Math.round(sx), tipY + Math.round(sy), 1, 1); }
      // la lamparita del mecanismo y el fogonazo del tiro
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,150,60,${0.5 + 0.5 * lat})`; ctx.fillRect(bx, byr + 1, 2, 1);
      if (ret > 0.3) { ctx.fillStyle = '#fff4d0'; ctx.fillRect(tipX - 2, tipY, 5, 1); ctx.fillRect(tipX, tipY - 2, 1, 5); }
      if (vida < 0.5 && R() < 0.5) { ctx.fillStyle = '#ffd890'; ctx.fillRect(bx + Math.round(rnd(-5, 5)), byr + Math.round(rnd(-4, 4)), 1, 1); }
      break; }
    case 'cepo': {
      // cepo abierto en el piso: dos medias lunas de dientes, la cadena y la estaca; un brillo corre por los dientes
      ctx.globalAlpha = nace; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(px - 10, py - 2, 21, 6);
      ctx.fillStyle = '#3a3a40'; ctx.beginPath(); for (let i = 0; i <= 40; i++) { const an = (i / 28) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * 10), Math.round(py + Math.sin(an) * 5), 1, 1); } ctx.fill();
      ctx.fillStyle = '#8a8a96'; ctx.beginPath(); for (let i = 0; i <= 14; i++) { const an = Math.PI + (i / 14) * Math.PI; ctx.rect(Math.round(px + Math.cos(an) * 10), Math.round(py + Math.sin(an) * 5), 1, 1); } ctx.fill();
      // los dientes, de pie hacia adentro
      for (let i = 0; i < 14; i++) { const an = (i / 14) * 6.283 + 0.3, x = Math.round(px + Math.cos(an) * 8), y = Math.round(py + Math.sin(an) * 4), ar = Math.sin(an) < 0; ctx.fillStyle = ar ? '#b8bcc8' : '#6a6a76'; ctx.fillRect(x, y - 3, 1, 3);
        const db = Math.abs(((i / 14) - brillo + 1) % 1); if (db < 0.08) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,255,255,${0.9 * (1 - db / 0.08)})`; ctx.fillRect(x, y - 3, 1, 1); ctx.globalCompositeOperation = 'source-over'; } }
      ctx.fillStyle = '#2a2a2e'; ctx.fillRect(px - 1, py - 1, 3, 2); ctx.fillStyle = '#5a5a60'; ctx.fillRect(px + 10, py + 1, 1, 1); ctx.fillRect(px + 11, py + 2, 1, 1); ctx.fillRect(px + 12, py + 2, 1, 1); ctx.fillRect(px + 13, py + 3, 1, 1); ctx.fillStyle = '#4a3420'; ctx.fillRect(px + 14, py, 2, 4); ctx.fillStyle = '#7a5a34'; ctx.fillRect(px + 14, py, 1, 1);
      break; }
    case 'pilar': {
      // el pilar de chispas: una púa de hierro con su runa azul en el piso y arcos chiquitos que trepan
      const alto = Math.round(14 * nace), se = vida < 0.5 ? vida / 0.5 : 1;
      ctx.globalAlpha = 0.5 * kd * (0.6 + 0.4 * lat) * se; ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = PAL.rayo.c; ctx.beginPath();
      for (let i = 0; i < 36; i++) { const an = (i / 36) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * 9), Math.round(py + Math.sin(an) * 4.5), 1, 1); } glifo(ctx, G5.rayo, px - 2, py - 2); ctx.fill();
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.fillStyle = '#2a2c3a'; ctx.fillRect(px - 1, py - alto, 3, alto); ctx.fillStyle = '#6a7090'; ctx.fillRect(px - 1, py - alto, 1, alto); ctx.fillStyle = '#b8c8ff'; ctx.fillRect(px, py - alto - 2, 1, 2);
      ctx.globalCompositeOperation = 'lighter'; const tic = Math.floor(t * 18 + tr.x * 7), r = (n: number) => { const s = Math.sin((tic + n) * 12.9898) * 43758.5453; return s - Math.floor(s); };
      if (se > 0.2) { ctx.fillStyle = '#d8e4ff'; let x = px, y = py - alto - 1; for (let i = 0; i < 6; i++) { x += Math.round((r(i) - 0.5) * 4); y += Math.round(1 + r(i + 9) * 2); ctx.fillRect(x, y, 1, 1); }
        const tiro = tr.tiro !== undefined ? Math.max(0, 1 - (j.t - tr.tiro) / 0.15) : 0; if (tiro > 0) { ctx.globalAlpha = tiro; ctx.fillStyle = '#ffffff'; ctx.fillRect(px - 2, py - alto - 2, 5, 1); ctx.fillRect(px, py - alto - 4, 1, 5); } }
      break; }
    case 'brasa': case 'brasa_oro': {
      // la mina de brasas: una olla de barro medio enterrada con grietas que respiran, y un hilo de calor que sube
      const oro = est === 'brasa_oro', c1 = oro ? '#ffd060' : '#ff6a10', c2 = oro ? '#fff0b0' : '#ffc060', resp = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 2.6 + tr.x * 5));
      ctx.globalAlpha = nace; ctx.fillStyle = '#1e140c'; ctx.beginPath(); for (let y = -2; y <= 2; y++) { const w = Math.round(5 * Math.sqrt(1 - (y / 2.6) ** 2)); ctx.rect(px - w, py + y, w * 2 + 1, 1); } ctx.fill();
      ctx.fillStyle = '#3a2a1c'; ctx.fillRect(px - 4, py - 2, 9, 1);
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = resp * nace; ctx.fillStyle = c1; ctx.beginPath(); ctx.rect(px - 3, py - 1, 1, 1); ctx.rect(px - 2, py, 1, 1); ctx.rect(px - 1, py, 1, 1); ctx.rect(px + 1, py - 1, 1, 1); ctx.rect(px + 2, py - 1, 1, 1); ctx.rect(px + 3, py, 1, 1); ctx.rect(px, py + 1, 1, 1); ctx.fill();
      ctx.fillStyle = c2; ctx.fillRect(px - 1, py, 1, 1); ctx.fillRect(px + 2, py - 1, 1, 1);
      ctx.globalAlpha = 0.25 * resp * kd; ctx.drawImage(V.halo(oro ? 'rgba(255,220,120,0.9)' : 'rgba(255,150,50,0.9)', 'rgba(255,80,20,0.2)'), px - 10, py - 6, 20, 12);
      // el calor que sube
      ctx.globalAlpha = 0.5 * resp; ctx.fillStyle = c1; for (let i = 0; i < 2; i++) { const f = ((t * 0.8 + i * 0.5 + tr.x) % 1); ctx.fillRect(px + Math.round(Math.sin(f * 9 + i) * 1.5), py - 3 - Math.round(f * 10), 1, 1); }
      // el glifo de la runa de oro del coto
      if (oro) { ctx.globalAlpha = 0.45 * kd * resp; ctx.fillStyle = '#ffd860'; ctx.beginPath(); for (let i = 0; i < 30; i++) { const an = (i / 30) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * 9), Math.round(py + Math.sin(an) * 4.5), 1, 1); } ctx.fill(); }
      break; }
    case 'runa_rayo': {
      // la runa de rayo del coto: el sello azul latiendo y chispas que corren por el aro
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (0.35 + 0.45 * lat) * kd * nace; ctx.fillStyle = PAL.rayo.c; ctx.beginPath();
      for (let i = 0; i < 30; i++) { const an = (i / 30) * 6.283; ctx.rect(Math.round(px + Math.cos(an) * 8), Math.round(py + Math.sin(an) * 4), 1, 1); } glifo(ctx, G5.rayo, px - 2, py - 3); ctx.fill();
      ctx.globalAlpha = kd; ctx.fillStyle = '#ffffff'; const an = t * 5 + tr.x; ctx.fillRect(Math.round(px + Math.cos(an) * 8), Math.round(py + Math.sin(an) * 4), 1, 1);
      break; }
    case 'hongos': {
      // el corro de hongos: seis sombreritos en ronda y esporas que se sueltan
      dibHongos(ctx, px, py, nace, t, tr.x, 1);
      break; }
  }
  ctx.restore();
}
function dibHongos(ctx: CanvasRenderingContext2D, px: number, py: number, k: number, t: number, sem: number, alto: number) {
  for (let i = 0; i < 6; i++) { const an = (i / 6) * 6.283 + 0.4, x = Math.round(px + Math.cos(an) * 9), y = Math.round(py + Math.sin(an) * 4.5), hh = Math.max(0, Math.round((2 + (i % 2)) * k * alto));
    if (hh <= 0) continue; ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.fillStyle = '#d8ccb0'; ctx.fillRect(x, y - hh, 1, hh); ctx.fillStyle = i % 3 ? '#6a8a2a' : '#8a5a9a'; ctx.fillRect(x - 1, y - hh - 1, 3, 1); ctx.fillRect(x, y - hh - 2, 1, 1); ctx.fillStyle = '#e8ffb0'; ctx.fillRect(x - 1, y - hh - 1, 1, 1); }
  // una espora cada tanto
  ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.6 * k; ctx.fillStyle = '#b8f070';
  for (let i = 0; i < 3; i++) { const f = (t * 0.4 + i * 0.33 + sem) % 1; ctx.fillRect(Math.round(px + Math.sin(f * 7 + i * 2) * 8), Math.round(py - 3 - f * 14), 1, 1); }
}
function dibCoto(ctx: CanvasRenderingContext2D, coto: any[], aP: AP, t: number) {
  // las seis trampas del coto unidas por un hilo de runas de oro que corre
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.35 * luzDia(); ctx.fillStyle = '#ffd060'; ctx.beginPath();
  for (let i = 0; i < coto.length; i++) { const a = coto[i], b = coto[(i + 1) % coto.length], [ax, ay] = aP(a.x, a.y), [bx, by] = aP(b.x, b.y), n = Math.ceil(Math.hypot(bx - ax, by - ay) / 2);
    for (let q = 0; q < n; q++) { if ((q + Math.floor(t * 12)) % 5 > 2) continue; const u = q / n; ctx.rect(Math.round(ax + (bx - ax) * u), Math.round(ay + (by - ay) * u), 1, 1); } }
  ctx.fill(); ctx.restore();
}
function dibMarca(ctx: CanvasRenderingContext2D, j: Juego, m: Mk, aP: AP) {
  const [px0, py0] = aP(m.x, m.y), px = Math.round(px0), py = Math.round(py0), u = m.t / m.d, p = m.p, kd = luzDia();
  ctx.save(); ctx.imageSmoothingEnabled = false;
  switch (m.k) {
    case 'pulso': {
      // un aro que se abre (o se cierra al irse) por el piso; el del campo del aura es tenue y llega al borde
      const campo = m.g === 'campo', v = m.sale ? 1 - u : 1 - (1 - u) ** 2, rr = m.r * (campo ? v : 0.3 + 0.7 * v), a = (1 - u) * (campo ? 0.3 : 0.85) * kd;
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath(); const N = Math.max(24, Math.round(rr * 50));
      for (let i = 0; i < N; i++) { const an = (i / N) * 6.283, x = m.x + Math.cos(an) * rr, y = m.y + Math.sin(an) * rr; if (!piso(j, x, y)) continue; const [qx, qy] = aP(x, y); ctx.rect(Math.round(qx), Math.round(qy), campo ? 1 : 2, 1); }
      ctx.fill(); break; }
    case 'sello': {
      // un sello que se dibuja de a poco, gira y se apaga (llegadas de invocados y mejoras)
      const dib = m.sale ? 1 - u : Math.min(1, m.t / 0.25), a = (m.sale ? 1 - u : Math.min(1, (1 - u) * 2.5)) * kd, rr = m.r, N = Math.round(rr * 80), gir = m.t * 1.2 + (m.sem % 7);
      ctx.globalAlpha = a * 0.5; ctx.fillStyle = p.c3; ctx.beginPath(); for (let i = 0; i < N * dib; i++) { const an = (i / N) * 6.283 + gir * 0.2, x = m.x + Math.cos(an) * rr, y = m.y + Math.sin(an) * rr; const [qx, qy] = aP(x, y); ctx.rect(Math.round(qx), Math.round(qy) + 1, 1, 1); } ctx.fill();
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath();
      for (let i = 0; i < N * dib; i++) { const an = (i / N) * 6.283 + gir * 0.2, x = m.x + Math.cos(an) * rr, y = m.y + Math.sin(an) * rr; const [qx, qy] = aP(x, y); ctx.rect(Math.round(qx), Math.round(qy), 1, 1); if (i % 2 === 0) { const [rx, ry] = aP(m.x + Math.cos(an) * rr * 0.78, m.y + Math.sin(an) * rr * 0.78); ctx.rect(Math.round(rx), Math.round(ry), 1, 1); } }
      // la estrella del sello (cinco puntas unidas) y los glifos
      if (dib >= 1 || m.sale) { for (let s = 0; s < 5; s++) { const a0 = gir + (s / 5) * 6.283, a1 = gir + (((s + 2) % 5) / 5) * 6.283, [x0, y0] = aP(m.x + Math.cos(a0) * rr * 0.78, m.y + Math.sin(a0) * rr * 0.78), [x1, y1] = aP(m.x + Math.cos(a1) * rr * 0.78, m.y + Math.sin(a1) * rr * 0.78), n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 1.5);
        for (let q = 0; q < n; q += 1) ctx.rect(Math.round(x0 + (x1 - x0) * q / n), Math.round(y0 + (y1 - y0) * q / n), 1, 1); } }
      ctx.fill();
      if (m.g && G5[m.g]) { ctx.fillStyle = p.c2; ctx.beginPath(); for (let g = 0; g < 4; g++) { const an = -gir + (g / 4) * 6.283, [gx, gy] = aP(m.x + Math.cos(an) * rr * 0.89, m.y + Math.sin(an) * rr * 0.89); glifo(ctx, G5[m.g], Math.round(gx) - 2, Math.round(gy) - 2); } ctx.fill(); }
      // al nacer, una luz en el centro
      if (!m.sale && m.t < 0.3 && m.z !== -1) { ctx.globalAlpha = (1 - m.t / 0.3) * 0.7 * kd; const q = 22 * rr; ctx.drawImage(V.halo(rgba(p.rgb, 0.9), rgba(p.rgb, 0.2)), px - q, py - q * 0.6, q * 2, q * 1.2); }
      break; }
    case 'rayos': {
      // el grito: rayas que salen del pecho hacia afuera
      const z = m.z ?? 40, v = 1 - (1 - u) ** 2; ctx.globalAlpha = (1 - u) * 0.9; ctx.fillStyle = p.c2; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283 + (m.sem % 10) * 0.1, r0 = 8 + v * 22, r1 = r0 + 6 + v * 8; for (let q = r0; q < r1; q += 1) ctx.rect(Math.round(px + Math.cos(an) * q), Math.round(py - z + Math.sin(an) * q * 0.75), 2, 2); }
      ctx.fill(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - u) * 0.6 * kd; ctx.fillStyle = p.c; ctx.beginPath();
      for (let i = 0; i < 12; i++) { const an = (i / 12) * 6.283 + (m.sem % 10) * 0.1 + 0.26, r0 = 6 + v * 18, r1 = r0 + 4 + v * 6; for (let q = r0; q < r1; q += 1) ctx.rect(Math.round(px + Math.cos(an) * q), Math.round(py - z + Math.sin(an) * q * 0.75), 1, 1); }
      ctx.fill(); break; }
    case 'escudo': {
      // un escudo de luz que se arma alrededor: arcos de hexágono que destellan y se apagan
      const z = m.z ?? 26, a = (1 - u) * kd, rr = 16 * m.r * (0.85 + 0.15 * u); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = p.c; ctx.beginPath();
      for (let s = 0; s < 6; s++) { const a0 = (s / 6) * 6.283, a1 = ((s + 1) / 6) * 6.283; if ((s + (m.sem & 3)) % 3 === 0 && u > 0.3) continue; const x0 = px + Math.cos(a0) * rr, y0 = py - z + Math.sin(a0) * rr * 1.25, x1 = px + Math.cos(a1) * rr, y1 = py - z + Math.sin(a1) * rr * 1.25; for (let q = 0; q <= 8; q++) ctx.rect(Math.round(x0 + (x1 - x0) * q / 8), Math.round(y0 + (y1 - y0) * q / 8), 1, 1); }
      ctx.fill(); ctx.fillStyle = p.c2; ctx.globalAlpha = a * (1 - u); for (let s = 0; s < 6; s++) { const an = (s / 6) * 6.283; ctx.fillRect(Math.round(px + Math.cos(an) * rr), Math.round(py - z + Math.sin(an) * rr * 1.25), 1, 1); }
      break; }
    case 'barrido': {
      // el brillo que baja por el cuerpo de la cabeza a los pies (la piel se vuelve hierro, piedra o corteza)
      const z = m.z ?? 64, y = Math.round(py - z * (1 - u)), w = 11; ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = Math.sin(u * Math.PI) * kd; ctx.fillStyle = p.c2;
      ctx.fillRect(px - w, y, w * 2 + 1, 1); ctx.globalAlpha *= 0.5; ctx.fillStyle = p.c; ctx.fillRect(px - w + 2, y - 2, w * 2 - 3, 2); ctx.fillRect(px - w + 2, y + 1, w * 2 - 3, 1);
      break; }
    case 'cepo': {
      // las mandíbulas cerradas: dos hileras de dientes que se juntan de pie
      const a = Math.min(1, (1 - u) * 3); ctx.globalAlpha = a; const cierra = Math.min(1, m.t / 0.05);
      ctx.fillStyle = '#3a3a40'; ctx.fillRect(px - 10, py - 1, 21, 2);
      for (let i = -9; i <= 9; i += 2) { const hh = Math.round(2 + 6 * cierra * (1 - Math.abs(i) / 12)); ctx.fillStyle = '#6a6a76'; ctx.fillRect(px + i, py - hh, 1, hh); ctx.fillStyle = '#c8ccd8'; ctx.fillRect(px + i, py - hh, 1, 1); ctx.fillStyle = '#5a5a66'; ctx.fillRect(px + i + 1, py - hh + 1, 1, hh - 1); }
      ctx.fillStyle = '#8a8a96'; ctx.fillRect(px - 10, py - Math.round(7 * cierra) - 1, 21, 1);
      break; }
    case 'hongos': { dibHongos(ctx, px, py, m.sale ? Math.max(0, 1 - u * 1.6) : 1, m.t + 9, m.sem % 7, m.sale ? 1 - u : 1); break; }
    case 'torreta': {
      // la torreta que se desarma: las piezas caen y se apagan
      ctx.globalAlpha = 1 - u; ctx.fillStyle = '#3a2614'; ctx.fillRect(px - 6, py - 1, 13, 1); ctx.fillStyle = '#2a2a32'; ctx.fillRect(px - 4 + Math.round(u * 3), py - 3 - Math.round((1 - u) * 6), 9, 3); ctx.fillStyle = '#6a4a28'; ctx.fillRect(px - 6, py - 2, 12, 1);
      break; }
    case 'picada': {
      // el halcón cae en picada desde arriba a la izquierda, cada vez más rápido, con su estela de viento; al llegar abre las
      // alas y remonta hacia la derecha (la silueta va oscura con el canto claro: se lee de día y de noche)
      const LL = 0.28, x0 = px - 110, y0 = py - 210, x1 = px, y1 = py - 10;
      let hx: number, hy: number, dx: number, dy: number, abre = 0;
      if (m.t < LL) { const v = (m.t / LL) ** 1.7; hx = x0 + (x1 - x0) * v; hy = y0 + (y1 - y0) * v; dx = x1 - x0; dy = y1 - y0; }
      else { const v = (m.t - LL) / (m.d - LL); hx = x1 + 70 * v; hy = y1 - 120 * v * v - 14 * v; dx = 70; dy = -120 * v - 20; abre = Math.min(1, v * 4); }
      const L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = -uy, ny = ux, a = m.t < LL ? 1 : Math.max(0, 1 - (m.t - LL) / (m.d - LL)) ** 0.7;
      // la estela: dos rayas de viento detrás (oscura debajo, clara sumada)
      if (m.t < LL + 0.12) { const largo = m.t < LL ? 26 + 60 * (m.t / LL) : 80 * (1 - (m.t - LL) / 0.12), ae = m.t < LL ? 1 : 1 - (m.t - LL) / 0.12;
        for (const off of [-4, 0, 4]) { const w = off ? 1 : 2; ctx.globalAlpha = 0.4 * ae; ctx.fillStyle = '#2a1a0c'; ctx.beginPath(); for (let q = 6; q < largo; q += 1) ctx.rect(Math.round(hx - ux * q + nx * off * (1 - q / largo)), Math.round(hy - uy * q + ny * off * (1 - q / largo)) + 1, w, w); ctx.fill();
          ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (off ? 0.6 : 0.9) * ae * kd; ctx.fillStyle = off ? '#d8c8a8' : '#fff6e8'; ctx.beginPath(); for (let q = 6; q < largo; q += 1) if (!off || (q + Math.floor(m.t * 60)) % 7 < 5) ctx.rect(Math.round(hx - ux * q + nx * off * (1 - q / largo)), Math.round(hy - uy * q + ny * off * (1 - q / largo)), w, 1); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; } }
      // la sombra del ave en el piso, que se acerca y se agranda
      if (m.t < LL) { const v = (m.t / LL) ** 1.7, sx = Math.round(px - 40 * (1 - v)), sw = Math.round(3 + 6 * v); ctx.globalAlpha = 0.3 * v; ctx.fillStyle = '#000'; ctx.fillRect(sx - sw, py + 1, sw * 2 + 1, 2); }
      // el ave: cuerpo, cabeza con pico y las alas (plegadas en la picada, abiertas al remontar)
      ctx.globalAlpha = a;
      // (quinta pasada) el halcón de pixel de los pájaros de los poderes: plegado en la picada, apuntando a donde cae, y
      // abriendo las alas y batiendo al remontar
      if (!(window as any).__avesViejas) { const fase = m.t < LL ? 2 : Math.floor(m.t * 18) & 7, spr = spriteAve('halcon', Math.atan2(uy, ux), fase, m.t < LL ? 1 : Math.max(0, 1 - abre)); ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, Math.round(hx) - LADO_AVE / 2, Math.round(hy) - LADO_AVE / 2); }
      else {
      const pt = (f: number, s2: number): [number, number] => [Math.round(hx + ux * f + nx * s2), Math.round(hy + uy * f + ny * s2)];
      const k = m.r, ala = (3 + abre * 7) * k, atras = (5 - abre * 3) * k;
      ctx.fillStyle = '#1e1208'; for (let f = -6 * k; f <= 2 * k; f++) { const [qx, qy] = pt(f, 0); ctx.fillRect(qx - 1, qy - 1, 3, 3); }
      for (const sg of [-1, 1]) for (let q = 0; q <= ala; q++) { const [qx, qy] = pt(-atras * (q / ala) - 1, sg * q); ctx.fillStyle = '#1e1208'; ctx.fillRect(qx - 1, qy - 1, 3, 2); }
      ctx.fillStyle = '#6a4a2a'; for (let f = -6 * k; f <= 2 * k; f++) { const [qx, qy] = pt(f, 0); ctx.fillRect(qx, qy, 1, 1); }
      for (const sg of [-1, 1]) for (let q = 0; q <= ala; q++) { const [qx, qy] = pt(-atras * (q / ala) - 1, sg * q); ctx.fillStyle = q > ala * 0.6 ? '#3a2614' : '#8a6a40'; ctx.fillRect(qx, qy, 1, 1); if (q % 2 === 0) { ctx.fillStyle = '#d8c098'; ctx.fillRect(qx, qy - 1, 1, 1); } }
      { const [qx, qy] = pt(3 * k, 0); ctx.fillStyle = '#e8dcc0'; ctx.fillRect(qx, qy, 1, 1); const [bx, by] = pt(4 * k, 0); ctx.fillStyle = '#f0b040'; ctx.fillRect(bx, by, 1, 1); }
      }
      // el golpe de aire al llegar
      if (m.t >= LL && m.t < LL + 0.1) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - (m.t - LL) / 0.1) * kd; ctx.fillStyle = '#fff6e0'; ctx.fillRect(x1 - 4, y1 + 6, 9, 1); ctx.fillRect(x1, y1 + 2, 1, 9); }
      break; }
    case 'llamarada': {
      // la brasa santa lame al enemigo: tres lenguas de fuego que suben de sus pies
      const a = 1 - u; ctx.globalAlpha = a; for (let i = 0; i < 3; i++) { const x = px - 4 + i * 4, hh = Math.round((8 + i % 2 * 5) * Math.sin(Math.min(1, u * 3) * Math.PI * 0.5) * (1 - u * 0.6));
        ctx.fillStyle = '#c03008'; ctx.fillRect(x, py - hh, 2, hh); ctx.fillStyle = '#ff8a20'; ctx.fillRect(x, py - hh, 1, Math.max(1, hh - 2)); ctx.fillStyle = '#ffe080'; ctx.fillRect(x, py - hh, 1, 1); }
      break; }
    case 'ojo': {
      // la sentencia: el ojo morado se abre sobre la cabeza del enemigo y se cierra
      const z = m.z ?? 64, ab = Math.sin(Math.min(1, u) * Math.PI); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ab * kd; ctx.fillStyle = p.c; const w = 4, hh = Math.round(2 * ab);
      ctx.beginPath(); for (let x = -w; x <= w; x++) { const yy = Math.round(hh * Math.sqrt(1 - (x / (w + 0.5)) ** 2)); ctx.rect(px + x, py - z - yy, 1, 1); ctx.rect(px + x, py - z + yy, 1, 1); } ctx.fill();
      ctx.fillStyle = p.c2; ctx.fillRect(px, py - z, 1, 1); break; }
  }
  ctx.restore();
}

// ------------------------------------------------------------------ luces (luces.ts)
export function lucesPresencias(j: Juego, aP: AP): { x: number; y: number; h: number; r: number; c: RGB; k: number }[] {
  if (!presenciasVivas()) return [];
  const out: { x: number; y: number; h: number; r: number; c: RGB; k: number }[] = [];
  for (const tr of j.torretas as any[]) { const est = estiloTrampa(tr.hab ?? 'torreta', tr.elem ?? 'fisico'); if (est === 'cepo' || est === 'hongos' || est === 'torreta') continue; const [x, y] = aP(tr.x, tr.y);
    out.push({ x, y, h: 10, r: 60, c: est === 'pilar' || est === 'runa_rayo' ? PAL.rayo.rgb : est === 'brasa_oro' ? PAL.oro.rgb : PAL.fuego.rgb, k: 0.35 + 0.15 * Math.sin(j.t * 3 + tr.x) }); }
  const au = auraDe(j); if (au && !j.heroe.muerto) { const [x, y] = aP(j.heroe.x, j.heroe.y); out.push({ x, y, h: 6, r: 70, c: au[1].p.rgb, k: 0.28 }); }
  for (const m of marcas) if (m.k === 'sello' && !m.sale && m.t < 0.6 && m.z !== -1) { const [x, y] = aP(m.x, m.y); out.push({ x, y, h: 20, r: 90 * m.r, c: m.p.rgb, k: 0.6 * (1 - m.t / 0.6) }); }
  return out;
}

/** Si la mejora o el aura tiene su dibujo propio acá (entonces no va el bucle horneado de su lanzador). */
export function tieneEstilo(id: string): boolean { return presenciasVivas() && (!!BUFF[id] || !!AURA[id]) && (formasVivas() || (id !== 'forma_lobo' && id !== 'forma_oso')); }

/** Una placa de hueso de la armadura del nigromante: un hueso de pixel con su canto oscuro, que gira y sube y baja. */
function dibHueso(ctx: CanvasRenderingContext2D, aP: AP, hx: number, hy: number, an: number, k: number, t: number) {
  const [px, py] = aP(hx, hy), r = 19 + (k % 2) * 3, x = Math.round(px + Math.cos(an) * r), y = Math.round(py - 28 - (k % 3) * 7 + Math.sin(an) * r * 0.42 + Math.sin(t * 3 + k) * 2);
  const lado = Math.cos(an), l = Math.max(2, Math.round(5 * Math.abs(Math.sin(an)) + 2)); // de canto se ve corto
  ctx.save(); ctx.fillStyle = '#3a3428'; ctx.fillRect(x - 1, y - 1, l + 2, 4); ctx.fillStyle = '#d8d0b4'; ctx.fillRect(x, y, l, 2);
  ctx.fillStyle = '#fffaf0'; ctx.fillRect(x, y, 1, 1); ctx.fillRect(x + l - 1, y + 1, 1, 1); ctx.fillStyle = '#8a8268'; ctx.fillRect(x + (lado > 0 ? 0 : l - 1), y + 1, 1, 1);
  // una mota morada que se le despega a veces
  if (Math.sin(t * 7 + k * 2) > 0.92) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = '#b070ff'; ctx.fillRect(x + (l >> 1), y - 2, 1, 1); }
  ctx.restore();
}

// ------------------------------------------------------------------ cuervos y halcones
// (cuarta pasada) antes eran una V de línea negra lisa encima de todo. Ahora un pájaro de pixel que aletea (tres cuadros),
// mira hacia donde vuela, baja a picotear al blanco y lleva su sombra en el piso. El halcón del Cielo de halcones es pardo
// con el pecho claro y el pico de oro; el cuervo, negro con el brillo azulado en las alas.
const avesPrev = new WeakMap<object, [number, number]>();
function altoAve(j: Juego, c: any, t: number): number { const cerca = c.objetivo && !c.objetivo.muerto && Math.hypot(c.objetivo.x - c.x, c.objetivo.y - c.y) < 0.8, pica = c.pica !== undefined ? Math.max(0, 1 - (j.t - c.pica) / 0.18) : 0;
  return (cerca ? 30 : 50) - pica * 16 + Math.sin(t * 9 + c.ang) * (cerca ? 3 : 6); }
// ------------------------------------------------------------------ los pájaros de los poderes (quinta pasada)
// (Rick: "los cuervos y los halcones se ven muy chiquitos", 7 puntos a 720) Un pájaro de pixel de unos 18 de envergadura,
// armado una vez por especie, rumbo (16), aleteo (8) y plegado: cuerpo, cabeza, pico, cola en abanico y las dos alas
// (la de atrás más oscura), con la luz de arriba en el canto, lo de abajo hundido, el contorno oscuro de afuera, el ojo
// que brilla y el pico con su punto de luz. Se pega a puntos enteros.
interface PalAve { o: string; d: string; m: string; l: string; s: string; p?: string; pico: string; picoL: string; ojo: string; ojoD?: string }
const PAL_AVE: Record<'cuervo' | 'halcon', PalAve> = {
  cuervo: { o: '#040406', d: '#100f15', m: '#1d1b25', l: '#2f2c3d', s: '#4c4b6e', pico: '#2a2722', picoL: '#8c877c', ojo: '#d8d8f0' },
  halcon: { o: '#1a0f06', d: '#3e2714', m: '#6c4c2a', l: '#9c7446', s: '#c89c64', p: '#e6d8b8', pico: '#e0a838', picoL: '#fff0b0', ojo: '#ffd040', ojoD: '#1a0f06' },
};
const avesHechas = new Map<string, HTMLCanvasElement>();
(window as any).__spriteAve = (esp: 'cuervo' | 'halcon', ang: number, fase: number, pl: number) => spriteAve(esp, ang, fase, pl); // (pruebas: t996_aves.cjs)
export const LADO_AVE = 36;
/** El cuadro del pájaro: especie, rumbo en la pantalla (rad, a 16), fase del aleteo (0..7) y plegado (0 abierto, 1 plegado). */
export function spriteAve(esp: 'cuervo' | 'halcon', ang: number, fase: number, plegado: number): HTMLCanvasElement {
  const ai = ((Math.round(ang / (Math.PI / 8)) % 16) + 16) % 16, pl = Math.round(plegado * 4) / 4, k = `${esp}|${ai}|${fase}|${pl}`;
  let c = avesHechas.get(k); if (c) return c;
  const P = PAL_AVE[esp], hal = esp === 'halcon', N = LADO_AVE, C = N / 2;
  const h = (ai * Math.PI) / 8, fx = Math.cos(h), fy = Math.sin(h);
  // el "arriba" del pájaro en la pantalla: la perpendicular que mira hacia arriba (de cabeza al bajar en picada no)
  let ux = fy, uy = -fx; if (uy > 0 || (uy === 0 && ux > 0 && fx === 0)) { ux = -ux; uy = -uy; }
  // las alas en tres cuartos, como se ve desde arriba en la isométrica: la de cerca baja hacia nosotros y la de lejos sube,
  // abiertas en X con el ala plana, en V arriba y caídas abajo (de -45° a 75° de batida)
  const S = hal ? 1.1 : 1, L = (hal ? 12.5 : 11.5), a = ((15 + 60 * Math.cos((fase / 8) * Math.PI * 2)) * Math.PI) / 180;
  const sh: [number, number] = [0.8 * S, 0.9];
  const ala = (lejos: boolean): [number, number] => { const y = L * Math.cos(a) * 0.74 * (lejos ? 1 : -1), z = L * Math.sin(a) * 0.68; return [sh[0] - 2.2 - Math.abs(Math.cos(a)) * 1.6 - 5 * pl + (lejos ? -0.6 : 0), sh[1] + (z + y) * (1 - pl) + pl * 0.6]; };
  const dSeg = (px: number, py: number, ax: number, ay: number, bx: number, by: number) => { const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (py - ay) * vy) / l2)); return [Math.hypot(px - ax - vx * t, py - ay - vy * t), t]; };
  const lab = new Uint8Array(N * N); // 0 nada, 1 cuerpo, 2 cabeza, 3 pico, 4 cola, 5 ala cerca, 6 ala lejos, 7 ojo
  const tip0 = ala(true), tip1 = ala(false);
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
    const sx = xx + 0.5 - C, sy = yy + 0.5 - C, lx = sx * fx + sy * fy, ly = sx * ux + sy * uy; let v = 0;
    // ala de atrás (debajo de todo), cola, cuerpo, ala de adelante, cabeza, pico
    { const [d, t] = dSeg(lx, ly, sh[0] - 0.6, sh[1] + 0.4, tip0[0], tip0[1]); if (d < 2.8 * (1 - t) + (hal ? 0.6 : 1.1) && pl < 1) v = 6; }
    { const tx = -lx / S - 3.4; if (tx > 0 && tx < (hal ? 5 : 4.6) && Math.abs(ly) < 0.9 + tx * (hal ? 0.55 : 0.42)) v = 4; }
    if ((lx / (4.6 * S)) ** 2 + (ly / 2.1) ** 2 < 1) v = 1;
    { const [d, t] = dSeg(lx, ly, sh[0], sh[1], tip1[0], tip1[1]); if (d < 3.1 * (1 - t) + (hal ? 0.6 : 1.1) && pl < 1) v = 5;
      // (el cuervo: las primarias abiertas como dedos en la punta, el halcón la punta afilada)
      if (!hal && pl < 1 && t > 0.72 && d < 2.2 && Math.floor((lx - tip1[0]) * 1.4 + 20) % 2 === 0) v = 5; }
    if (!hal && pl < 1) { const [d, t] = dSeg(lx, ly, sh[0] - 0.6, sh[1] + 0.4, tip0[0], tip0[1]); if (v === 0 && t > 0.72 && d < 2.0 && Math.floor((lx - tip0[0]) * 1.4 + 20) % 2 === 0) v = 6; }
    if ((lx - 5 * S) ** 2 + (ly - 0.7) ** 2 < (hal ? 3.6 : 3.3)) v = 2;
    { const bx = lx - 6.3 * S; if (bx > 0 && bx < (hal ? 1.9 : 2.8) && Math.abs(ly - 0.55 + (hal ? bx * 0.25 : 0)) < (hal ? 0.9 : 0.85) - bx * (hal ? 0.3 : 0.2)) v = 3; }
    lab[yy * N + xx] = v;
  }
  // el ojo: el punto de la cabeza más adelante y arriba
  { let mejor = -1e9, oi = -1; for (let i = 0; i < N * N; i++) if (lab[i] === 2) { const sx = (i % N) + 0.5 - C, sy = Math.floor(i / N) + 0.5 - C, lx = sx * fx + sy * fy, ly = sx * ux + sy * uy, sc = lx * 0.6 + ly - Math.abs(lx - 5.6 * S) * 0.9; if (sc > mejor) { mejor = sc; oi = i; } } if (oi >= 0) lab[oi] = 7; }
  c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d')!, img = g.createImageData(N, N), d = img.data;
  const hex = (s: string) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
  const pon = (i: number, col: string) => { const [r, gg, b] = hex(col); d[i * 4] = r; d[i * 4 + 1] = gg; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; };
  const en = (x: number, y: number) => x >= 0 && y >= 0 && x < N && y < N && lab[y * N + x] > 0;
  for (let yy = 0; yy < N; yy++) for (let xx = 0; xx < N; xx++) {
    const i = yy * N + xx, v = lab[i];
    if (!v) { if (en(xx - 1, yy) || en(xx + 1, yy) || en(xx, yy - 1) || en(xx, yy + 1)) pon(i, P.o); continue; }
    const arriba = !en(xx, yy - 1), abajo = !en(xx, yy + 1);
    if (v === 3) { pon(i, arriba ? P.picoL : P.pico); continue; }
    if (v === 7) { pon(i, P.ojo); continue; }
    if (v === 6) { pon(i, arriba ? P.m : P.d); continue; }
    // el pecho claro del halcón: lo de abajo del cuerpo y la cabeza
    if (hal && P.p && (v === 1 || v === 2) && !arriba) { const sx = xx + 0.5 - C, sy = yy + 0.5 - C, ly = sx * ux + sy * uy; if (ly < 0.2) { pon(i, abajo ? P.l : P.p); continue; } }
    pon(i, arriba ? (v === 5 && (xx + yy) % 2 ? P.s : P.l) : abajo ? P.d : P.m);
  }
  // el halcón: la línea oscura detrás del ojo
  if (hal && P.ojoD) for (let i = 0; i < N * N; i++) if (lab[i] === 7) { const x = i % N, y = Math.floor(i / N), bx = x - Math.round(fx), by = y - Math.round(fy); if (en(bx, by) && lab[by * N + bx] === 2) pon(by * N + bx, P.ojoD); }
  g.putImageData(img, 0, 0); avesHechas.set(k, c); return c;
}
function dibSombraAve(ctx: CanvasRenderingContext2D, j: Juego, aP: AP, c: any, t: number) {
  const [px, py] = aP(c.x, c.y), a = Math.min(1, c.t * 4) * Math.min(1, (c.dur - c.t) * 3); ctx.save(); ctx.globalAlpha = 0.3 * a; ctx.fillStyle = '#000000';
  // (quinta pasada: la sombra del tamaño del pájaro nuevo, más chica y clara cuanto más alto vuela)
  if ((window as any).__avesViejas) { ctx.fillRect(Math.round(px) - 3, Math.round(py), 7, 2); ctx.fillRect(Math.round(px) - 1, Math.round(py) - 1, 3, 1); }
  else { const al = altoAve(j, c, t), k = Math.max(0.55, 1 - al / 90), w = Math.round(8 * k); ctx.globalAlpha = 0.34 * a * k; ctx.fillRect(Math.round(px) - w, Math.round(py), w * 2 + 1, 2); ctx.fillRect(Math.round(px) - (w >> 1), Math.round(py) - 1, w + 1, 1); ctx.fillRect(Math.round(px) - (w >> 1), Math.round(py) + 2, w + 1, 1); }
  ctx.restore();
}
function dibAve(ctx: CanvasRenderingContext2D, j: Juego, aP: AP, c: any, t: number) {
  const [px0, py0] = aP(c.x, c.y), prev = avesPrev.get(c) ?? [px0, py0]; avesPrev.set(c, [px0, py0]);
  const mira = px0 - prev[0] < -0.05 ? -1 : px0 - prev[0] > 0.05 ? 1 : (c.mira ?? 1); c.mira = mira;
  const halcon = !!c.marca, x = Math.round(px0), y = Math.round(py0 - altoAve(j, c, t)), a = Math.min(1, c.t * 4) * Math.min(1, (c.dur - c.t) * 3);
  const cerca = c.objetivo && Math.hypot(c.objetivo.x - c.x, c.objetivo.y - c.y) < 0.8;
  if ((window as any).__avesViejas) return dibAveViejo(ctx, x, y, a, mira, halcon, cerca, t, c);
  // aletea de verdad: ocho cuadros por batida, más rápido cuando ronda al blanco; al picar pliega las alas y baja la cabeza
  const pica = c.pica !== undefined ? Math.max(0, 1 - (j.t - c.pica) / 0.18) : 0, fase = Math.floor(t * (cerca ? 26 : 16) + c.ang * 5) & 7;
  const spr = spriteAve(halcon ? 'halcon' : 'cuervo', mira > 0 ? pica * 0.6 : Math.PI - pica * 0.6, fase, pica > 0.3 ? 0.75 : 0);
  ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false; ctx.drawImage(spr, x - LADO_AVE / 2, y - LADO_AVE / 2); ctx.restore();
}
function dibAveViejo(ctx: CanvasRenderingContext2D, x: number, y: number, a: number, mira: number, halcon: boolean, cerca: boolean, t: number, c: any) {
  const fr = Math.floor((t * (cerca ? 22 : 14) + c.ang * 3)) % 4, ala = fr === 0 ? -3 : fr === 2 ? 2 : 0; // arriba, medio, abajo, medio
  const cO = halcon ? '#2a1a0c' : '#06060a', cC = halcon ? '#7a5a34' : '#1a1820', cB = halcon ? '#c8a070' : '#3a3650', cP = halcon ? '#e8dcc0' : '#26222e';
  ctx.save(); ctx.globalAlpha = a;
  const W = halcon ? 7 : 6, px = (dx: number, dy: number, w = 1, h = 1) => ctx.fillRect(x + dx * mira - (mira < 0 ? w - 1 : 0), y + dy, w, h);
  ctx.fillStyle = cO; for (let i = 1; i <= W; i++) { const yy = Math.round(ala * (i / W) ** 1.3); px(-i, yy - 1, 1, 3); px(i - 1, yy - 1, 1, 3); }
  px(-2, -1, 6, 3); px(4, -2, 2, 3);
  ctx.fillStyle = cC; for (let i = 1; i < W; i++) { const yy = Math.round(ala * (i / W) ** 1.3); px(-i, yy, 1, 1); px(i - 1, yy, 1, 1); }
  ctx.fillStyle = cB; for (let i = 2; i < W - 1; i += 2) { const yy = Math.round(ala * (i / W) ** 1.3); px(-i, yy - 1 + (ala > 0 ? 1 : 0), 1, 1); px(i - 1, yy - 1 + (ala > 0 ? 1 : 0), 1, 1); }
  ctx.fillStyle = cC; px(-1, 0, 4, 1); ctx.fillStyle = cP; px(0, 1, 3, 1); ctx.fillStyle = cC; px(4, -1, 1, 1);
  ctx.fillStyle = halcon ? '#f0b040' : '#4a4436'; px(6, -1, 1, 1); ctx.fillStyle = halcon ? '#ffe080' : '#a0a0b8'; px(4, -2, 1, 1);
  ctx.fillStyle = cO; px(-4, 0, 2, 1); px(-5, 1, 1, 1);
  ctx.restore();
}
