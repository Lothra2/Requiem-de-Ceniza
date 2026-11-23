// pixelfx en el mundo: el clima de cada zona (capa pantalla) y lo que vive en ella (murciélagos, fuegos fatuos, goteras,
// burbujas, medusas...), sembrado en lugares fijos por zona. Se carga solo lo de la zona en la que estás.
import { todosPfx, dibujarPfx, efectoPfx, precargarPfx, pfxListo, cajaPfx } from './pfx';
import { E } from '../nucleo/lienzo';
import { mapita, escalaEntera } from './mapitas';
import { pasable } from '../mundo/zona';
import type { Juego } from '../juego/mundo';
import { usosPfx } from '../juego/pfx_usos';

const QUITAR_AMBIENTE = new Set(['fx_columna_regreso', 'fx_portal', 'fx_curacion', 'fx_explosion_barril', 'fx_dormido', 'fx_roca', 'fx_caida_carambano', 'fx_flor_curativa', 'fx_esporas', 'fx_manos_que_agarran', 'fx_tentaculos_sombra', 'fx_grieta_invocacion', 'fx_arco_chispas', 'fx_fuente', 'fx_sol_radiante', 'fx_fragmento_reliquia']);
// del clima a pantalla: uno o dos por zona, los de más peso primero (cada uno son 5 a 7 Mpx)
// sin cielo en el juego: nada de franjas de nubes ni auroras (la tormenta trae su franja de nubes; queda la lluvia)
// la niebla y los rayos de luz son formas grandes que no se repiten bien en mosaico: queda la niebla de siempre
const SIN_PANTALLA = new Set(['fx_aurora', 'fx_nubes', 'fx_tormenta', 'fx_niebla', 'fx_rayos_luz']);
// alfa tope de cada clima a pantalla: que nunca tape al héroe ni a los monstruos
const ALFA: Record<string, number> = { fx_lluvia: 0.45, fx_nieve: 0.5, fx_ventisca: 0.45, fx_niebla: 0.35, fx_hojas_caen: 0.35, fx_luciernagas: 0.5, fx_rayos_luz: 0.35 };
const ORDEN_CLIMA = ['fx_tormenta', 'fx_ventisca', 'fx_lluvia', 'fx_nieve', 'fx_niebla', 'fx_hojas_caen', 'fx_luciernagas', 'fx_rayos_luz', 'fx_nubes'];
const EXCLUYE: Record<string, string> = { fx_lluvia: 'fx_tormenta', fx_nieve: 'fx_ventisca' };

const CRIATURAS = new Set(['fx_sapo', 'fx_serpiente', 'fx_murcielago', 'fx_cuervo', 'fx_espectro', 'fx_calavera_voladora', 'fx_medusa', 'fx_ojo_flotante', 'fx_fuego_fatuo', 'fx_baba']);
interface Planta { id: string; x: number; y: number; fase: number }
let zonaId = '', clima: string[] = [], plantas: Planta[] = [], pantallaTodo: string[] = [];
export const climaPfx = { activo: [] as string[] };

function armar(j: Juego) {
  const z = j.zona; zonaId = z.id + ':' + z.semilla;
  const es = todosPfx();
  const cl = es.filter((e) => !(e as any).soloCinematica && e.capa === 'pantalla' && !SIN_PANTALLA.has(e.id) && e.uso?.some((u) => u.tipo === 'clima' && (u.zonas ? u.zonas.includes(z.id) : u.actos?.includes(z.acto) && z.tipo === 'exterior'))).map((e) => e.id);
  const orden = cl.sort((a, b) => ORDEN_CLIMA.indexOf(a) - ORDEN_CLIMA.indexOf(b)).filter((id) => !(EXCLUYE[id] && cl.includes(EXCLUYE[id])));
  clima = orden.slice(0, E.tactil ? 1 : 2);
  pantallaTodo = cl;
  climaPfx.activo = clima;
  // lo que vive en la zona: lugares fijos (semilla de la zona) en celdas libres
  const amb = es.filter((e) => !(e as any).soloCinematica && e.capa !== 'pantalla' && e.bucle && !QUITAR_AMBIENTE.has(e.id) && e.uso?.some((u) => u.tipo === 'ambiente' && u.zonas?.includes(z.id))).map((e) => e.id);
  plantas = [];
  // en las mazmorras no hay criaturas de ambiente (son de pelea); y nada de ambiente en la sala del jefe
  const jefe = z.spawns.find((q) => q.tipo === 'jefe');
  const usar = z.tipo === 'mazmorra' ? amb.filter((id) => !CRIATURAS.has(id)) : amb;
  let s = (z.semilla * 9301 + 49297) % 233280;
  const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const n = Math.min(60, Math.round((z.W * z.H) / 900));
  for (let i = 0; i < n && usar.length; i++) {
    for (let k = 0; k < 12; k++) {
      const x = 2 + r() * (z.W - 4), y = 2 + r() * (z.H - 4);
      if (!pasable(z, x, y) || (jefe && Math.hypot(jefe.cx - x, jefe.cy - y) < 16)) continue;
      // lo que va tendido en el piso (ondas de agua, burbujas) necesita lugar: nada tapado ni objetos en dos casillas a la redonda
      if (EN_PISO.test(usar[i % usar.length])) {
        let libre = true;
        for (let dy = -2; dy <= 2 && libre; dy++) for (let dx = -2; dx <= 2 && libre; dx++) if (!pasable(z, x + dx, y + dy)) libre = false;
        if (libre) for (const o of z.objetos) if (Math.abs(o.cx - x) < o.hw + 2.5 && Math.abs(o.cy - y) < o.hh + 2.5) { libre = false; break; }
        if (!libre) continue;
      }
      plantas.push({ id: usar[i % usar.length], x, y, fase: r() * 10 });
      break;
    }
  }
  precargarPfx([...clima, ...amb]);
}

/** Efectos de ambiente que van tendidos en el piso: se pintan como suelo, debajo de todo lo que está parado. */
const EN_PISO = /ola|onda|charco|burbuj|circulo|grieta|suelo|lava|pantano/;
/**
 * Lo que vive en la zona, como cosas del mundo: cada una con su profundidad, para que entre en el orden de pintado con
 * los objetos y los cuerpos (antes se pintaban todas al final y una onda de agua salía encima de muros, árboles y gente).
 * Lo tendido en el piso va con la profundidad del suelo. Como mucho 6 en táctil y 12 en escritorio.
 */
export function itemsAmbiente(ctx: CanvasRenderingContext2D, j: Juego, aPant: (x: number, y: number) => [number, number], W: number, H: number, t: number): { prof: number; draw: () => void }[] {
  if (!pfxListo() || (window as any).__sinAmbientePfx) return []; // (las pruebas de cerca lo apagan: un remolino de polvo tapaba el poder)
  if (zonaId !== j.zona.id + ':' + j.zona.semilla) armar(j);
  const out: { prof: number; draw: () => void }[] = []; const tope = E.tactil ? 6 : 12;
  for (const p of plantas) {
    const [px, py] = aPant(p.x, p.y);
    if (px < -80 || px > W + 80 || py < -60 || py > H + 160) continue;
    if (out.length >= tope) break;
    // todo el ambiente a escala 1: el pixel no pasa del del mundo. El espectro, además, translúcido
    out.push({ prof: EN_PISO.test(p.id) ? -9e5 + p.x + p.y : p.x + p.y, draw: () => { dibujarPfx(ctx, p.id, t + p.fase, px, py, { escala: 0.5, alfa: p.id === 'fx_espectro' ? 0.6 : 1, dir: p.id === 'fx_ola' ? 6 : 0 }); } });
  }
  return out;
}

// Hojas secas en el viento: cada una es un mapita de 4 o 5 pixeles que gira al caer, se mece y deriva con el viento.
// Viven en el espacio del mundo (se corren con la cámara) y dan la vuelta al salir de la pantalla.
const HOJA_FORMAS: string[][] = [
  ['.##.', '####', '.##.'], ['.#..', '###.', '.###', '..#.'], ['####'], ['..#.', '.###', '###.', '.#..'], ['#', '#', '#'], ['.##', '###', '##.'],
];
const HOJA_COLOR: [string, string][] = [['#8f4a1a', '#5a2c10'], ['#a4661c', '#6a3e12'], ['#6e3814', '#40200c'], ['#927224', '#5c4614'], ['#7a2e16', '#481a0c'], ['#5e5020', '#3a3212']];
const hsh = (i: number, k: number) => { let h = Math.imul(i + 1, 374761393) ^ Math.imul(k + 7, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
function hojasQueCaen(ctx: CanvasRenderingContext2D, j: Juego, W: number, H: number, t: number) {
  const h = j.heroe, ox = (h.x - h.y) * 16, oy = (h.x + h.y) * 8, AW = W + 48, AH = H + 48;
  const n = Math.min(48, Math.round((W * H) / 13000)), entera = escalaEntera(ctx);
  ctx.save();
  for (let i = 0; i < n; i++) {
    const vy = 13 + hsh(i, 1) * 15, vx = -(16 + hsh(i, 2) * 22), fase = hsh(i, 3) * 40, vaiven = 6 + hsh(i, 4) * 12;
    // la ráfaga: cada tanto el viento arrecia y todas se inclinan
    const rafaga = 0.7 + 0.6 * Math.sin(t * 0.23 + 1.3) ** 2;
    let x = hsh(i, 5) * AW + vx * rafaga * t + Math.sin(t * (0.7 + hsh(i, 6)) + fase) * vaiven - ox;
    let y = hsh(i, 7) * AH + vy * t + Math.cos(t * (0.5 + hsh(i, 8) * 0.6) + fase) * 3 - oy;
    x = ((x % AW) + AW) % AW - 24; y = ((y % AH) + AH) % AH - 24;
    const forma = HOJA_FORMAS[Math.floor(t * (2.2 + hsh(i, 9) * 2.4) + fase) % HOJA_FORMAS.length], [c1, c2] = HOJA_COLOR[i % HOJA_COLOR.length];
    ctx.globalAlpha = 0.55 + 0.35 * hsh(i, 10);
    const px = Math.round(x), py = Math.round(y);
    if (entera) { const fi = HOJA_FORMAS.indexOf(forma), ci = i % HOJA_COLOR.length; ctx.drawImage(mapita(`hoja_${fi}_${ci}`, forma, (_c, fx, fy) => (fy === forma.length - 1 || fx === 0 ? c2 : c1)), px, py); continue; }
    for (let fy = 0; fy < forma.length; fy++) for (let fx = 0; fx < forma[fy].length; fx++) if (forma[fy][fx] === '#') { ctx.fillStyle = fy === forma.length - 1 || fx === 0 ? c2 : c1; ctx.fillRect(px + fx, py + fy, 1, 1); }
  }
  ctx.restore();
}

const FUNDE = 48, teselas: HTMLCanvasElement[] = [], mascaras = new Map<string, HTMLCanvasElement>();
/** Alfa de una tesela: entera en el medio y apagándose en los FUNDE puntos de cada borde (dos vecinas suman uno). */
function mascaraTesela(w: number, h: number): HTMLCanvasElement {
  const k = w + 'x' + h; let m = mascaras.get(k); if (m) return m;
  m = document.createElement('canvas'); m.width = w; m.height = h; const g = m.getContext('2d')!, im = g.createImageData(w, h);
  const r = (d: number) => { const t = Math.min(1, Math.max(0, (d + 0.5) / FUNDE)); return t * t * (3 - 2 * t); };
  for (let y = 0; y < h; y++) { const ay = Math.min(r(y), r(h - 1 - y)); for (let x = 0; x < w; x++) { const o = (y * w + x) * 4; im.data[o] = im.data[o + 1] = im.data[o + 2] = 255; im.data[o + 3] = Math.round(255 * ay * Math.min(r(x), r(w - 1 - x))); } }
  g.putImageData(im, 0, 0); mascaras.set(k, m); return m;
}
/** El clima de la zona encima de todo (después de la luz). Devuelve qué tipo de clima ya dibuja, para no repetirlo. */
export function dibujarClimaPfx(ctx: CanvasRenderingContext2D, j: Juego, W: number, H: number, t: number): { lluvia: boolean; nieve: boolean; niebla: boolean } {
  const r = { lluvia: false, nieve: false, niebla: false };
  if (!pfxListo()) return r;
  if (zonaId !== j.zona.id + ':' + j.zona.semilla) armar(j);
  let nt = 0;
  for (const id of clima) {
    // la lluvia y la tormenta ahora las pinta el juego (escena.ts: gotas con viento, salpicaduras, charcos y relámpagos)
    if ((id === 'fx_lluvia' || id === 'fx_tormenta') && j.zona.lluvia && j.zona.tipo !== 'mazmorra') continue;
    // las hojas que caen las pinta el juego: sueltas, del tamaño del pixel del mundo y ancladas al suelo que se ve
    if (id === 'fx_hojas_caen') { hojasQueCaen(ctx, j, W, H, t); continue; }
    const e = efectoPfx(id); if (!e) continue;
    // en mosaico a escala 2, cada tesela con su propio tiempo para que no se note la repetición. Las teselas se enciman
    // FUNDE puntos y se funden en ese margen (cada una se apaga hacia su borde): antes iban a tope, cada una en otro
    // momento del efecto y recortada, y la ventisca dejaba una raya oscura a lo ancho de la pantalla y un corte a lo alto
    // (la niebla se abre frente a un monumento de los actos 2 a 7: su luz le gana, escena.ts `cercaMon`)
    const alfa = (ALFA[id] ?? 0.4) * (id === 'fx_niebla' ? 1 - 0.7 * (((window as any).__cercaMon as number) || 0) : 1), caja = cajaPfx(id);
    let dibujo = false;
    if (!caja) continue;
    const cw = caja[2] * 2, ch = caja[3] * 2, px = cw - FUNDE, py = ch - FUNDE, mz = mascaraTesela(cw, ch);
    const aditivo = e.mezcla === 'aditiva' || e.mezcla === 'sumar', fija = id === 'fx_niebla' || id === 'fx_rayos_luz';
    // cada tesela en su propio lienzo (rearmar uno que ya se pegó en este cuadro frena la tarjeta: ver motor/lienzos.ts, y
    // en el cementerio eran 11 ms por cuadro), y si todas van en la misma fase (niebla, rayos de luz) se arma una sola vez
    let hecha: HTMLCanvasElement | null = null;
    for (let ty = -FUNDE, fy = 0; ty < H; ty += py, fy++) for (let tx = -FUNDE, fx = 0; tx < W; tx += px, fx++) {
      // las hojas, en damero: la mitad de densidad (sueltas, no se nota el corte)
      if (id === 'fx_hojas_caen' && (fx + fy) % 2) continue;
      const fase = fija ? 0 : (fx * 7 + fy * 3) * 0.37;
      let cv: HTMLCanvasElement | null = fija ? hecha : null;
      if (!cv) {
        cv = teselas[nt] ??= document.createElement('canvas'); nt++;
        if (cv.width !== cw || cv.height !== ch) { cv.width = cw; cv.height = ch; }
        const tg = cv.getContext('2d')!;
        tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, cw, ch);
        if (!dibujarPfx(tg, id, t + fase, -caja[0] * 2, -caja[1] * 2, { tesela: true })) continue;
        tg.globalCompositeOperation = 'destination-in'; tg.drawImage(mz, 0, 0);
        if (fija) hecha = cv;
      }
      ctx.save(); ctx.globalAlpha *= alfa;
      ctx.globalCompositeOperation = aditivo ? 'lighter' : 'source-over'; ctx.imageSmoothingEnabled = false;
      ctx.drawImage(cv, Math.round(tx), Math.round(ty)); ctx.restore();
      dibujo = true;
    }
    if (dibujo) {
      if (id === 'fx_lluvia') r.lluvia = true;
      if (id === 'fx_nieve' || id === 'fx_ventisca') r.nieve = true;
      if (id === 'fx_niebla') r.niebla = true;
    }
  }
  // transiciones pedidas por el juego (una pasada cada una)
  const ahora = performance.now() / 1000;
  usosPfx.pantalla = usosPfx.pantalla.filter((q) => { const e = efectoPfx(q.id); if (!e) return ahora - q.t0 < 2; return dibujarPfx(ctx, q.id, ahora - q.t0, 0, 0, { W, H }); });
  return r;
}
(window as any).__climaPfx = () => ({ clima, todos: pantallaTodo, plantas: plantas.length });
