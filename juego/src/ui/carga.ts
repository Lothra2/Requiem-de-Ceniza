/**
 * La pantalla de viaje entre zonas: la tierra del acto en pixel (la carta del acto pasada a paleta corta y trama,
 * `juego/hornear/cargas.py`) agrandada a puntos enteros y con lo que se mueve en esa tierra encima (ceniza y brasas,
 * arena, luciérnagas, nieve, brasas de la Herida, lluvia, motas de oro), el nombre del lugar en la letra gótica, el
 * acto, una línea de lo que se dice de esa tierra y la barra forjada. Si la imagen no llegó todavía va la de siempre.
 * Nada se guarda. `__cargaVieja` vuelve a la pantalla negra de antes.
 */
import { ctx, W, H } from '../nucleo/lienzo';
import { imagenPortada } from './portada';
import { textoGotico } from './texto_gotico';
import { texto, T, TT, IDI } from './comun';

const LW = 400, LH = 225;
const ACTO: Record<number, { es: string; en: string; tono: [number, number, number] }> = {
  1: { es: 'Acto I · El Valle de Velmora', en: 'Act I · The Vale of Velmora', tono: [216, 199, 168] },
  2: { es: 'Acto II · Las Arenas de Sahrim', en: 'Act II · The Sands of Sahrim', tono: [240, 194, 122] },
  3: { es: 'Acto III · La Selva de Yhuantl', en: 'Act III · The Jungle of Yhuantl', tono: [184, 224, 200] },
  4: { es: 'Acto IV · Los Picos de Hrimgard', en: 'Act IV · The Peaks of Hrimgard', tono: [207, 230, 255] },
  5: { es: 'Acto V · La Herida', en: 'Act V · The Wound', tono: [255, 176, 112] },
  6: { es: 'Acto VI · Ysmeral', en: 'Act VI · Ysmeral', tono: [150, 230, 215] },
  7: { es: 'Acto VII · Arriba', en: 'Act VII · Above', tono: [255, 220, 140] },
};
/** Lo que se dice de cada tierra (una por viaje, al azar). */
const DICHOS: Record<number, [string, string][]> = {
  1: [['En Velmora los muertos no duermen. Esperan.', 'In Velmora the dead do not sleep. They wait.'],
    ['Las campanas de Santa Oria callaron la noche que cayó la brasa.', 'The bells of Santa Oria went silent the night the ember fell.'],
    ['El que cuelga del roble no pidió perdón. Nadie se lo dio.', 'The one hanging from the oak never asked forgiveness. No one gave it.']],
  2: [['La arena guarda los nombres que el sol quiso borrar.', 'The sand keeps the names the sun tried to erase.'],
    ['En Sahrim el agua se acabó antes que la sed.', 'In Sahrim the water ran out before the thirst did.'],
    ['El rey no tiene sombra. Dicen que se la vendió al pedazo.', 'The king has no shadow. They say he sold it to the shard.']],
  3: [['Si oyes tambores en la selva, ya es tarde para correr.', 'If you hear drums in the jungle, it is too late to run.'],
    ['El barco de Ama sigue en el manglar. Nadie lo quiere tocar.', "Ama's ship is still in the mangrove. No one wants to touch it."],
    ['Yhuantl no tiene dioses. Tiene hambre de los ajenos.', 'Yhuantl has no gods. It hungers for other people’s.']],
  4: [['Hrimgard no olvida a sus reyes. Tampoco los entierra.', 'Hrimgard does not forget its kings. Nor does it bury them.'],
    ['El hielo guarda lo que el fuego no pudo comerse.', 'The ice keeps what the fire could not eat.'],
    ['Trescientos inviernos dormido. El jarl no soñó con nada bueno.', 'Three hundred winters asleep. The jarl dreamed of nothing good.']],
  5: [['La Herida late. Algo, abajo, todavía tiene sed.', 'The Wound beats. Something below is still thirsty.'],
    ['Aquí forjaron el primer sello. Aquí se rompe.', 'Here the first seal was forged. Here it breaks.'],
    ['La ceniza de la Fragua no es de madera.', 'The ash of the Forge is not from wood.']],
  6: [['Las campanas de Ysmeral suenan bajo el agua.', 'The bells of Ysmeral ring beneath the water.'],
    ['La Abadesa de la Sal no reza. Escucha.', 'The Abbess of Salt does not pray. She listens.'],
    ['El mar se llevó a Ama. Ysmeral le dio las gracias.', 'The sea took Ama. Ysmeral thanked it.']],
  7: [['Arriba nadie reza. Arriba se bebe.', 'Up here no one prays. Up here, they drink.'],
    ['Siete subieron. Uno sigue en la escalera.', 'Seven climbed. One is still on the stairs.'],
    ['El Sediento no tiene hambre. Nunca la tuvo.', 'The Thirsting One is not hungry. It never was.']],
};

let dicho = -1, t0 = -1;
interface Pz { x: number; y: number; vx: number; vy: number; v: number; d: number }
let piezas: Pz[] = [], tPrev = -1;

/** Pide de antemano la tierra de un acto (para que el primer viaje ya la tenga). */
export function precargarViaje(acto: number) { if (ACTO[acto]) imagenPortada(`carga/acto_${acto}.webp`); }

/** Llamar al arrancar un viaje: elige la línea del dicho y reinicia lo que se mueve. */
export function empezarCarga(acto: number) {
  imagenPortada(`carga/acto_${acto}.webp`);
  dicho = Math.floor(Math.random() * (DICHOS[acto]?.length ?? 1)); t0 = -1; piezas = []; tPrev = -1;
}

/** Dibuja la pantalla. Devuelve false si la imagen del acto todavía no llegó (entonces va la de siempre). */
export function pantallaViaje(k: number, nombre: string, t: number, acto: number): boolean {
  if ((window as any).__cargaVieja || !ACTO[acto]) return false;
  const im = imagenPortada(`carga/acto_${acto}.webp`); if (!im) return false;
  if (t0 < 0) t0 = t;
  const u = t - t0, dt = tPrev < 0 ? 1 / 60 : Math.min(0.1, Math.max(0, t - tPrev)); tPrev = t;
  const DW = ctx.canvas.width, DH = ctx.canvas.height;
  // la escena a puntos enteros: cubre la pantalla con un poco de holgura, y se corre despacio de lado a lado
  const s = Math.max(1, Math.ceil(Math.max(DW / (LW - 24), DH / (LH - 10))));
  const holg = Math.max(0, LW * s - DW), x0 = Math.round(-holg / 2 + Math.sin(u * 0.11) * holg * 0.45), y0 = Math.round((DH - LH * s) / 2);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, DW, DH);
  const entra = Math.min(1, u / 0.35);
  ctx.globalAlpha = entra; ctx.drawImage(im, Math.round(x0 / s) * s, y0, LW * s, LH * s);
  // lo que se mueve en esa tierra, a puntos de la escena (s puntos del aparato)
  const nace = (n: number, f: () => Pz) => { for (let i = 0; i < n; i++) piezas.push(f()); };
  const r = Math.random, cuantas = piezas.length;
  if (cuantas < 160) {
    const q = dt * (acto === 6 ? 160 : acto === 4 ? 60 : 26);
    const n = Math.floor(q) + (r() < q % 1 ? 1 : 0);
    nace(n, () => {
      switch (acto) {
        case 2: return { x: -4, y: LH * (0.45 + r() * 0.55), vx: 40 + r() * 50, vy: (r() - 0.5) * 6, v: 0, d: 6 + r() * 4 };
        case 3: return { x: r() * LW, y: LH * (0.35 + r() * 0.6), vx: (r() - 0.5) * 6, vy: (r() - 0.5) * 6, v: 0, d: 3 + r() * 4 };
        case 4: return { x: r() * (LW + 60) - 30, y: -3, vx: -6 - r() * 10, vy: 14 + r() * 14, v: 0, d: 14 };
        case 5: return { x: r() * LW, y: LH + 2, vx: (r() - 0.5) * 8, vy: -18 - r() * 26, v: 0, d: 4 + r() * 5 };
        case 6: return { x: r() * (LW + 80), y: -6, vx: -26, vy: 170 + r() * 50, v: 0, d: 2 };
        case 7: return { x: r() * LW, y: LH * (0.2 + r() * 0.8), vx: (r() - 0.5) * 4, vy: -4 - r() * 5, v: 0, d: 4 + r() * 4 };
        default: return r() < 0.3 ? { x: r() * LW, y: LH + 2, vx: (r() - 0.5) * 6, vy: -14 - r() * 18, v: 0, d: 4 + r() * 4 } : { x: r() * (LW + 40), y: -3, vx: -8 - r() * 8, vy: 9 + r() * 10, v: 0, d: 20 };
      }
    });
  }
  const ox = Math.round(x0 / s) * s;
  for (let i = piezas.length - 1; i >= 0; i--) {
    const p = piezas[i]; p.v += dt; p.x += p.vx * dt; p.y += p.vy * dt;
    if (acto === 3 || acto === 7) { p.vx += (r() - 0.5) * 20 * dt; p.vy += (r() - 0.5) * 20 * dt; }
    if (p.v >= p.d || p.y > LH + 4 || p.y < -8 || p.x > LW + 90) { piezas[i] = piezas[piezas.length - 1]; piezas.pop(); continue; }
    const w = p.v / p.d, vive = Math.min(1, p.v * 3, (p.d - p.v) * 2);
    let col = '#bdb6ac', a = 0.55, ww = 1, hh = 1;
    switch (acto) {
      case 2: col = '#e8c890'; a = 0.35; ww = 2; break;
      case 3: col = (Math.sin((p.v + i) * 7) > 0.2) ? '#d8ff90' : '#6a9a40'; a = 0.9; break;
      case 4: col = '#e8f2ff'; a = 0.8; ww = hh = i % 3 === 0 ? 2 : 1; break;
      case 5: col = w < 0.3 ? '#fff0b0' : w < 0.6 ? '#ff9a30' : '#b8300a'; a = 1; break;
      case 6: col = '#9ab8c8'; a = 0.45; hh = 4; break;
      case 7: col = Math.sin((p.v + i) * 5) > 0.5 ? '#fff4c8' : '#e0b050'; a = 0.85; break;
      default: if (p.vy < 0) { col = w < 0.4 ? '#ffd070' : '#c04010'; a = 1; } break;
    }
    ctx.globalAlpha = a * vive * entra; ctx.fillStyle = col;
    ctx.fillRect(ox + Math.round(p.x) * s, y0 + Math.round(p.y) * s, ww * s, hh * s);
  }
  ctx.globalAlpha = 1;
  // abajo el negro para leer, y una viñeta a escalones
  const gr = ctx.createLinearGradient(0, DH * 0.5, 0, DH);
  gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(0.55, 'rgba(0,0,0,0.72)'); gr.addColorStop(1, 'rgba(0,0,0,0.95)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, DW, DH);
  ctx.restore();

  // el nombre del lugar, el acto, el dicho y la barra (en puntos lógicos)
  const a = ACTO[acto], cx = W / 2;
  const tam = Math.max(20, Math.min(40, H * 0.055)), yb = H - Math.max(40, H * 0.085);
  ctx.save(); ctx.globalAlpha = entra;
  textoGotico(nombre.toUpperCase(), cx, yb - tam * 3.05, tam, { alin: 'center', tono: 'hueso', brillo: 0.6, max: W - 40 });
  textoGotico((IDI ? a.en : a.es).toUpperCase(), cx, yb - tam * 2.05, Math.max(11, tam * 0.42), { alin: 'center', tono: a.tono, max: W - 40 });
  const d = DICHOS[acto]?.[Math.max(0, dicho)];
  if (d) { ctx.globalAlpha = entra * Math.min(1, Math.max(0, (u - 0.3) / 0.6)); texto(`« ${TT(d)} »`, cx, yb - tam * 1.05, { alin: 'center', tam: Math.max(12, Math.min(16, H * 0.022)), color: '#cdbf9f', fuente: 'Georgia' }); }
  ctx.globalAlpha = entra;
  barraForjada(cx, yb, Math.min(460, W - 80), k, u, a.tono);
  ctx.restore();
  void T;
  return true;
}

/** La barra: un canal de hierro con remaches y la brasa que avanza, a puntos enteros del aparato. */
function barraForjada(cx: number, y: number, w: number, k: number, u: number, tono: [number, number, number]) {
  const res = ctx.getTransform().a || 1, P = Math.max(1, Math.round(res * 1.5));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  const DW = Math.round(w * res / P) * P, x = Math.round(cx * res - DW / 2), yy = Math.round(y * res), h = P * 5;
  const box = (xx: number, y2: number, ww: number, hh: number, c: string) => { ctx.fillStyle = c; ctx.fillRect(xx, y2, ww, hh); };
  box(x - P * 2, yy - P * 2, DW + P * 4, h + P * 4, '#0a0806');
  box(x - P, yy - P, DW + P * 2, P, '#5a4a36'); box(x - P, yy + h, DW + P * 2, P, '#231a12');
  box(x - P, yy, P, h, '#3c3022'); box(x + DW, yy, P, h, '#3c3022');
  box(x, yy, DW, h, '#160f0a');
  const fw = Math.round((DW * Math.min(1, Math.max(0, k))) / P) * P;
  if (fw > 0) {
    box(x, yy, fw, h, '#6a1c08'); box(x, yy + P, fw, h - P * 2, '#b03a10'); box(x, yy + P * 2, fw, P, '#e07a28');
    // la cabeza encendida, que late
    const lat = 0.6 + 0.4 * Math.sin(u * 10);
    ctx.globalAlpha = lat; box(x + fw - P * 2, yy, P * 2, h, '#ffd890'); ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x + fw, yy + h / 2, 0, x + fw, yy + h / 2, P * 14);
    g.addColorStop(0, `rgba(255,150,60,${0.45 * lat})`); g.addColorStop(1, 'rgba(255,90,20,0)');
    ctx.fillStyle = g; ctx.fillRect(x + fw - P * 14, yy - P * 14, P * 28, P * 28);
    ctx.globalCompositeOperation = 'source-over';
  }
  // remaches en los cuartos, del color de la tierra del acto
  for (let i = 0; i <= 4; i++) { const rx = x + Math.round((DW * i) / 4 / P) * P - P; box(rx, yy - P * 2, P * 2, P * 2, `rgb(${tono.map((c) => Math.round(c * 0.55)).join(',')})`); box(rx, yy - P * 2, P, P, `rgb(${tono.join(',')})`); }
  ctx.restore();
}
