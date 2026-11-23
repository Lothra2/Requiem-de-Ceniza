// Dibuja la zona: pisos, manchas, objetos y personajes por profundidad, poderes, partículas, luz, niebla y clima.
import { nuevoCuadroSombras } from './luces';
import { ctx, W, H, E, ZM, MW, MH, baseLienzo, enMundo, ALTO_HUD } from '../nucleo/lienzo';
import { Sonido } from '../audio/sonido';
import { ZONAS } from '../mundo/actos';
import { puntoSalida } from '../mundo/zona';
import { rumboSalida, nombreDestino, verboRumbo, colorUmbral, type Rumbo } from '../mundo/rumbos';
import { esquivarHud, etiquetasMundo, hud } from '../ui/hud_rects';
import { NPCS } from '../datos/npcs';
import { LUZ_EFECTO } from '../../../src/engine/gotico/luz_efectos';
import { cuadrosPiso, variantePiso, cuadrosHeroe, cuadrosMonstruo, objetoMeta, dibujar, dibujarTenido, manifiesto, precargar, relDe, siSePierdeLaTarjeta, type Cuadro } from '../motor/assets';
import type { Juego, Ent, Monstruo, Efecto, Mancha } from '../juego/mundo';
import { CUADROS, DIRS, DIR_VEC, ZANCADA, ALTO_CLASE } from '../juego/mundo';
import { sensacionDe, cuadroAtaque } from '../juego/sensacion';
import { animClase, zancadaClase, zancadaCorrerMonstruo } from '../juego/anim';
import ZANCADA_MONSTRUO from '../../../src/engine/gotico/datos/zancada_monstruos.json';
import { baseDe } from '../juego/objetos';
import { icono, TITULO, envolver } from '../ui/comun';
import { dibujarNumeros } from './numeros';
import { anotarBarra, dibujarBarras } from './barras_vida';
import { cuadrosVivos, cuadrosFinos, cambioVisible, FINO_RUMBOS } from '../motor/pintor';
import { energiaSuelo, energiaAire, itemsEnergia } from './energia';
import { dibujarMarca } from './marcas';
import { R, rng } from '../nucleo/azar';
import { armaViva, moverDerrames, derramesDelMundo, luzPisoArma, golpeVivo, estiloEstela, luzViva, LUZ_RGB, elemMonstruo, mascaraMonstruo, llamaArmaAtras, type ElemArma } from './arma_viva';
import { auraEquipo } from '../juego/visual';
import { calorOzmaren, fuegoMundo, dibujarFuegosMundo, profFuegosMundo } from './fuego';
import { prepararFuegos, vivosDe, tieneFuegoDoom, dibujarVivos } from './fuego_vivo';
import { dibujarPfx, alfaCuerpo, efectoPfx, dirPfx, claridadPfx, nochePfx } from './pfx';
import { estadosPfx, usosPfx } from '../juego/pfx_usos';
import { fuerzaElectro, tinteElectro, dibujarElectro, cabezaDe, dibujarEscarcha, dibujarVeneno, dibujarAturdido, dibujarMarcaPresa, mascaraDe } from './electro';
/** Estados que van encima de la cabeza (se suben a la cabeza de verdad del cuerpo). */
const ENCIMA = /^fx_(aturdido|confundido|maldito|presa_marcada)$/;
import { itemsAmbiente, dibujarClimaPfx } from './pfx_mundo';
import { pisadaHeroe } from './ambiente';
import { varianteDe } from '../mundo/zonas_propias';
import { ambienteSuelo, ambienteAire, ambienteCfg } from './ambiente';
import { seguirPoderes, itemsPoderes, dibujarArcos, dibujarCombustion, poderesVivos, sinHorneado } from './poderes_vivos';
import { seguirPresencias, itemsPresencias, presenciasVivas, alfaInvocado, aroInvocado, rimHeroe, tieneEstilo } from './presencias';
import { vistaForma, cuadrosForma, accForma, zancadaForma, ESC_FORMA, type Forma } from './formas';
import { tajoHeroe, torbellinoAro, tajoAplica } from './tajos';
/** El tajo del héroe de este cuadro: se pinta delante de los que están pegados a él (los tapaban). */
let tajoPend: [any, Cuadro, number, number, number, number] | null = null;
import { siluetaCuadro } from '../motor/assets';
import { cuerpoArde, seguirSuelo, itemsSuelo, ozmarenArde, cometa, llamaViva } from './fuego_especial';
let dtCuadro = 1 / 60;
// bruma de altura: cada cuadro alto se pinta una vez con el degradado del color de la niebla de la zona
let colorBruma = '78,82,96', anclasCuadro: { q: Cuadro; br: HTMLCanvasElement | null; px: number; py: number }[] = [], esAncla = new Set<object>();
const brumas = new WeakMap<Cuadro, { c: string; cv: HTMLCanvasElement }>();
function conBruma(q: Cuadro, c: string): HTMLCanvasElement | null {
  const g0 = brumas.get(q); if (g0 && g0.c === c) return g0.cv;
  const cv = document.createElement('canvas'); cv.width = q.w; cv.height = q.h;
  const g = cv.getContext('2d')!;
  if (!dibujar(g, q, q.ax, q.ay)) return null;
  // de 0 a 200 px sobre el ancla no hay bruma; de ahí a la punta sube hasta 0.2 de un gris azulado neutro, mezclado
  // (source-atop, no suma luz): baja el contraste de lo alto sin aclararlo
  const y120 = Math.max(1, q.ay - 200), gr = g.createLinearGradient(0, y120, 0, 0);
  gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(1, `rgba(${c},0.2)`);
  g.globalCompositeOperation = 'source-atop'; g.fillStyle = gr; g.fillRect(0, 0, q.w, y120);
  brumas.set(q, { c, cv });
  return cv;
}
const nieblaCv = document.createElement('canvas');
const congelados = new WeakSet<object>();
const ES_FUEGO = /fogata|hoguera|brasero|pira|antorcha|fuego|caldero|hogar/;
import { acc } from '../nucleo/accesible';
import { empezarRelieve, aplicarLuzGPU, ganchoRelieve, marcarHeroe, desviarRelieve, devolverRelieve, lienzosRelieve, lab } from './luz_gpu';
import { tramo, cerrarTramos, rend } from '../nucleo/rendimiento';
import { fijarGanchoRelieve, relieveDe } from '../motor/assets';
import { brilloPuas } from './puas';
import { aperturaRecorte, piezaRecortada, ALTO_PECHO, RX_REC } from './recorte';
import { luzMonumento, PIEZA_MONUMENTO } from '../mundo/monumentos';
import { recolectar, sombras, reflejos, luces, destello, destelloColor, luzFuerte } from './luces';

export const cam = { x: 0, y: 0 };
/** Hacia dónde mira la cámara además del héroe (presentación de un jefe): k de 0 a 1. */
export const foco = { x: 0, y: 0, k: 0 };
/**
 * La cámara de las cinemáticas (ui/director.ts): con `on`, el punto (x, y) del mundo (en casillas) queda en (fx, fy) de la
 * pantalla del mundo (fracción del ancho y el alto) y `alt` lo sube en puntos del dibujo. Manda por encima de todo lo demás
 * (el héroe, el plano de llegada, la cámara del jefe, el alzado frente a los monumentos).
 */
export const camCine = { on: false, x: 0, y: 0, alt: 0, fx: 0.5, fy: 0.5 };
const camS = { x: 0, y: 0, mx: 0, my: 0 }; let camZona = '';
export const aPant = (x: number, y: number): [number, number] => [(x - y) * 16 - cam.x + MW / 2, (x + y) * 8 - cam.y + (MH - ALTO_HUD / ZM) / 2];
/** Lo mismo en puntos del HUD (fuera del pase del mundo, que va acercado). */
export const aPantUI = (x: number, y: number): [number, number] => { const [a, b] = aPant(x, y); return [a * ZM, b * ZM]; };
export const aMundo = (sx: number, sy: number): [number, number] => {
  const X = sx - MW / 2 + cam.x, Y = sy - (MH - ALTO_HUD / ZM) / 2 + cam.y;
  return [(Y / 8 + X / 16) / 2, (Y / 8 - X / 16) / 2];
};

// lienzos auxiliares
const luz = document.createElement('canvas');
const lctx = luz.getContext('2d')!;
const brillo = document.createElement('canvas');
const bctx = brillo.getContext('2d')!;

export interface Pick { tipo: 'monstruo' | 'npc' | 'suelo' | 'objeto' | 'salida' | 'portal'; ref: any; x0: number; y0: number; x1: number; y1: number; prof: number }
export let picks: Pick[] = [];
let picksAnt: Pick[] = [];
export const opciones = { mostrarObjetos: false, idi: 0 as 0 | 1 };

/** Celdas por ciclo de pasos para este cuerpo: zancada del motor por su alto y su escala. */
function zancadaDe(e: Ent, acc: string): number {
  const base = acc === 'correr' ? ZANCADA.correr : ZANCADA.caminar;
  const za = manifiesto().za as Record<string, number> | undefined;
  // el héroe: la zancada de su clase (cada estilo pisa distinto) por su alto
  if (e.tipo === 'heroe' && formaVista) return zancadaForma(formaVista, acc);
  if (e.tipo === 'heroe') { const cl = (e as any).d?.clase; return (zancadaClase(cl, acc === 'correr' ? 'correr' : 'caminar') ?? base) * (za?.[cl] ?? ALTO_CLASE[cl] ?? 1); }
  const m = e as Monstruo;
  // Thor trota a la cintura del héroe: su zancada es más corta que la de un humanoide de su alto
  if (m.def?.sprite?.startsWith('thor')) return base * 0.55;
  // tabla de la Forja: casillas por ciclo de caminar a escala 1, medidas en el sprite (sin pies: el ritmo de aleteo)
  // los que galopan o aletean al correr traen su propio ritmo
  const zc = acc === 'correr' ? zancadaCorrerMonstruo(m.def?.sprite) : undefined;
  if (zc) return zc * (m.escala ?? 1);
  const zm = (ZANCADA_MONSTRUO as Record<string, number>)[m.def?.sprite];
  if (zm) return zm * (base / ZANCADA.caminar) * (m.escala ?? 1);
  const alto = za?.[m.def?.sprite];
  return base * (alto ?? 0.9) * (m.escala ?? 1);
}
/** Cuánto tarda en caer un cuerpo horneado con intermedios: el jefe más (su peso se ve en la caída). */
const durMorir = (e?: Ent) => ((e as any)?.def?.jefe || (e as any)?.def?.sprite?.startsWith?.('jefe_') ? 1.3 : 0.8);
const fr = (acc: string, t: number, dur: number, e?: Ent, accPies?: string, nReal?: number) => {
  // los cuadros que de verdad tiene la animación (los héroes traen 12 al atacar y correr, los monstruos 8)
  const n = nReal || (CUADROS[acc as keyof typeof CUADROS] ?? 8);
  if (e && (acc === 'caminar' || acc === 'correr')) return Math.floor(((e.recorrido ?? 0) / zancadaDe(e, accPies ?? acc)) * n) % n;
  // cada cuerpo respira a su ritmo: un grupo quieto ya no se mueve como un solo muñeco
  if (acc === 'quieto') return Math.floor((t + (e ? (e.id % 9) * 0.29 : 0)) * (e ? 5.4 + (e.id % 4) * 0.4 : 6)) % n;
  if (acc === 'caminar') return Math.floor(t * 11) % n;
  if (acc === 'correr') return Math.floor(t * 14) % n;
  // morir: las 8 claves de siempre iban a 14 por segundo (0,57 s, a saltos). Horneado con intermedios (19 nov 2026: 22
  // cuadros, 29 los jefes) dura más y pesa: 0,8 s el común y 1,3 s el jefe. Se cuenta con los cuadros que trae el atlas,
  // así un atlas viejo de 8 sigue igual que antes.
  if (acc === 'morir') return Math.min(n - 1, Math.floor(t * (n <= 8 ? 14 : (n - 1) / durMorir(e))));
  // atacar y lanzar: la carga y la salida van al ritmo de cada cuerpo, con el cuadro de impacto justo en el golpe
  if (e && (acc === 'atacar' || acc === 'lanzar') && e.golpeEn > 0 && dur > 0) { const an = e.tipo === 'heroe' ? animClase((e as any).d?.clase, acc) : undefined;
    // un combo (el monje) lleva sus golpes en cuadros fijos: la animación corre pareja para que cada uno caiga en el suyo
    if (an?.golpes?.length && (e as any).combo3) return Math.min(n - 1, Math.floor((t / dur) * n));
    return cuadroAtaque(Math.min(1, t / dur), Math.min(0.9, e.golpeEn / dur), n, sensacionDe(e).curva, an?.impacto !== undefined ? Math.round((an.impacto / an.cuadros) * n) : undefined); }
  return Math.min(n - 1, Math.floor((t / Math.max(0.05, dur)) * n));
};

const intercalados = new WeakMap<Cuadro[], { base: Cuadro[]; lista: Cuadro[] }>();
function framesHeroe(j: Juego, acc: string, dir: string): Cuadro[] {
  const D8 = ['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'];
  let k = -1, base: Cuadro[] | null = null;
  // caminando o corriendo: el rumbo real en 16 (si ya está pintado y el cuerpo ya giró hasta ahí), para que no patine de lado
  if ((acc === 'caminar' || acc === 'correr') && !(window as any).__sinFino) {
    k = D8.indexOf(dir) * 2;
    const ru = (j.heroe as any).rumbo as number | undefined;
    if (ru !== undefined) {
      const g = ((ru * 180) / Math.PI + 360) % 360, kr = Math.round(g / (360 / FINO_RUMBOS)) % FINO_RUMBOS;
      if (Math.abs(((kr * (360 / FINO_RUMBOS) - D8.indexOf(dir) * 45 + 540) % 360) - 180) <= 34) {
        // los rumbos pares son los ocho de siempre (pero el que toca por el rumbo real, no el que arrastra el giro)
        if (kr % 2 === 0) { k = kr; dir = D8[kr / 2]; }
        else { const f = cuadrosFinos(acc, kr); if (f && f.length) { k = kr; base = f; } }
      }
    }
    (window as any).__fino = k;
  }
  if (!base) { const vivos = cuadrosVivos(acc, dir); base = vivos && vivos.length ? vivos : cuadrosHeroe(j.heroe.d.clase, acc, dir); }
  // con los medios cuadros ya pintados, el paso va a 24 por ciclo: el del motor y el intermedio, alternados
  if (k >= 0 && !(window as any).__sinMedios) {
    const med = cuadrosFinos(acc, k + '~');
    if (med && med.length === base.length) { let it = intercalados.get(med); if (!it || it.base !== base) { const lista: Cuadro[] = []; for (let i = 0; i < base.length; i++) lista.push(base[i], med[i]); it = { base, lista }; intercalados.set(med, it); } (window as any).__medios = true; return it.lista; }
    (window as any).__medios = false;
  }
  return base;
}
export function framesMonstruo(sprite: string, acc: string, dir: string): Cuadro[] {
  let f = cuadrosMonstruo(sprite, acc, dir);
  if (!f.length && acc === 'lanzar') f = cuadrosMonstruo(sprite, 'atacar', dir);
  if (!f.length && acc === 'correr') f = cuadrosMonstruo(sprite, 'caminar', dir);
  if (!f.length) f = cuadrosMonstruo(sprite, 'quieto', dir);
  return f;
}


let camAlzada = 0, camJefe = 0, vivasMonstruo = 0;
/** Qué tan cerca está el héroe de la puerta de un monumento de los actos 2 a 7 (0 a 1): la niebla se abre alrededor (su luz le gana). */
let cercaMon = 0;
/**
 * La panorámica del monumento (actos 2 a 7): la primera vez en la sesión que el héroe llega frente a un monumento que no entra en
 * la pantalla, la cámara sube hasta lo más alto (el anillo de la Escalera, el humo de la Fragua), se queda un instante y vuelve,
 * en 2,5 s. Mientras dura el mundo espera (`panoramicaActiva`, main.ts). Un clic o una tecla la cortan. Sin temblor (respeta
 * `acc.temblor` porque no sacude). `__sinPanoramica` la apaga.
 */
let monCima: { cima: number; zona: string } | null = null, pano: { t: number; cima: number } | null = null;
const panoVistas = new Set<string>();
const SUBE = 0.9, QUEDA = 0.7, BAJA = 0.9;
export const panoramicaActiva = () => !!pano;
if (typeof window !== 'undefined') { const cortar = () => { if (pano && pano.t > 0.15) pano.t = Math.max(pano.t, SUBE + QUEDA); }; window.addEventListener('keydown', cortar); window.addEventListener('pointerdown', cortar); }
function panoramica(dt: number) {
  if (!pano && monCima && !(window as any).__sinPanoramica && !panoVistas.has(monCima.zona)) {
    panoVistas.add(monCima.zona);
    // (cuánto falta para ver lo más alto con la cámara como está ahora: con el alzado y el plano de llegada ya puestos)
    if (50 - monCima.cima + (cam.y - camS.y) > 60) pano = { t: 0, cima: monCima.cima };
  }
  if (!pano) return;
  pano.t += dt; (window as any).__panoT = pano.t;
  const t = pano.t, k = t < SUBE ? t / SUBE : t < SUBE + QUEDA ? 1 : Math.max(0, 1 - (t - SUBE - QUEDA) / BAJA), e = k * k * (3 - 2 * k);
  cam.y -= Math.max(0, 50 - pano.cima + (cam.y - camS.y)) * e;
  if (t >= SUBE + QUEDA + BAJA) { pano = null; (window as any).__panoT = undefined; }
}
/**
 * Si el dibujo de una pieza tapa de verdad al héroe (algún punto opaco sobre su cuerpo, de los pies a la cabeza): antes bastaba
 * con que el héroe cayera dentro del rectángulo del cuadro, y una pieza ancha con su sombra (los jarls de Hrimgard, con el
 * héroe en la puerta del glaciar) abría su ventana sin tapar nada. Sin máscara leída todavía, se toma como que tapa (lo de
 * antes). `__tapaCaja` vuelve a mirar solo el rectángulo.
 */
function opacoSobre(q: Cuadro, lx: number, ly: number): boolean {
  if ((window as any).__tapaCaja) return true;
  const m = mascaraDe(q); if (!m) return true;
  for (let dy = -64; dy <= 0; dy += 8) for (let dx = -10; dx <= 10; dx += 5) { const x = Math.round(lx + dx), y = Math.round(ly + dy); if (x >= 0 && y >= 0 && x < m.w && y < m.h && m.a[y * m.w + x]) return true; }
  return false;
}
/** Las piezas de los monumentos de los actos 2 a 7 no llevan la bruma de altura: su silueta se lee de lejos y no se lava. */
const monumentoPieza = (id: string) => PIEZA_MONUMENTO.test(id) && !(window as any).__brumaMonumento;
/** Los hitos del acto de la zona (una vez por zona: la cámara los mira cada cuadro). */
const hitosZona = new WeakMap<object, { cx: number; cy: number; id: string; v: string }[]>();
function hitosDe(z: { objetos: { cx: number; cy: number; id: string; v: string }[] }) { let l = hitosZona.get(z); if (!l) { l = z.objetos.filter((o) => o.id === 'acto_hito'); hitosZona.set(z, l); } return l; }
/** La forma que se está pintando en el héroe en este cuadro (la lee zancadaDe). */
let formaVista: Forma | null = null;
/** (la columna que nace en el héroe se pinta más tenue: ver colDetras) */
let alfaEf = 1;
/** De día lo sumado se nota menos: la luz del cambio de forma baja a la mitad a pleno sol. */
const nocheLuz = () => 0.5 + 0.5 * nochePfx();
/** Dónde está la puerta de la obra ancla y hacia dónde mira: la catedral, hacia +y desde su fachada; los monumentos
 *  (monumentos.ts), desde su salida y hacia la cámara (la diagonal), con el ancho del cono en pantalla. */
function puertaAncla(sa: { cx: number; cy: number; piezas?: { id: string; cx: number; cy: number }[] }) {
  const fa = sa.piezas![sa.piezas!.length - 1], mon = luzMonumento(fa.id);
  if (mon && mon.eje !== 'y') return { x: sa.cx + 0.5, y: sa.cy + 0.5, dx: 0.7071, dy: 0.7071, ux: 22, uy: 0, mon };
  return { x: fa.cx + 0.5, y: fa.cy + 1.5, dx: 0, dy: 1, ux: 16, uy: 8, mon };
}
/** La puerta abierta de la catedral: un cono de luz roja que sale sobre el piso hacia +y y brasas y ceniza que salen y suben. */
function puertaCatedral(j: Juego, dt: number, t: number) {
  for (const sa of j.zona.salidas) {
    const fa = sa.piezas?.[sa.piezas.length - 1]; if (!fa || fa.v === 'sellada') continue;
    const pu = puertaAncla(sa), [px, py] = aPant(pu.x, pu.y); if (px < -300 || px > W + 300 || py < -200 || py > H + 300) continue;
    const pulso = 0.5 + 0.5 * Math.sin(t * 1.4);
    // (los monumentos de los actos 2 a 7 llevan la luz de su puerta y sus motas: monumentos.ts)
    const mon = pu.mon, C = mon?.color ?? '255,70,24', C2 = mon?.color ?? '255,120,60';
    // el cono: del umbral hacia +y (abajo a la izquierda en pantalla), abriéndose
    const [ex, ey] = aPant(pu.x + pu.dx * 6.5, pu.y + pu.dy * 6.5), ux = pu.ux, uy = pu.uy; // de través en pantalla, para el ancho
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(px, py, ex, ey);
    g.addColorStop(0, `rgba(${C},${0.42 + pulso * 0.15})`); g.addColorStop(0.5, `rgba(${C},${0.18 + pulso * 0.07})`); g.addColorStop(1, `rgba(${C},0)`);
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(px - ux * 0.9, py - uy * 0.9); ctx.lineTo(px + ux * 0.9, py + uy * 0.9);
    ctx.lineTo(ex + ux * 2.6, ey + uy * 2.6); ctx.lineTo(ex - ux * 2.6, ey - uy * 2.6); ctx.closePath(); ctx.fill();
    // resplandor en el umbral
    const r = ctx.createRadialGradient(px, py - 10, 2, px, py - 10, 60);
    r.addColorStop(0, `rgba(${C2},${0.35 + pulso * 0.2})`); r.addColorStop(1, `rgba(${C},0)`);
    ctx.fillStyle = r; ctx.fillRect(px - 60, py - 70, 120, 120);
    ctx.restore();
    // brasas y ceniza que salen por la puerta y suben
    if (j.particulas.length < 700) {
      const n = (dt * 18) + (Math.random() < (dt * 18) % 1 ? 1 : 0);
      for (let i = 0; i < Math.floor(n); i++) {
        const ceniza = Math.random() < 0.3;
        const q = (Math.random() - 0.5) * 1.6, ve = 0.6 + Math.random() * 1.1, ld = (Math.random() - 0.5) * 0.5;
        j.particulas.push({ x: pu.x + q * pu.dy + pu.dx * 0.1, y: pu.y - q * pu.dx + pu.dy * 0.1, z: 6 + Math.random() * 30, vx: ld * pu.dy + ve * pu.dx, vy: -ld * pu.dx + ve * pu.dy, vz: ceniza ? 8 + Math.random() * 8 : 20 + Math.random() * 30, t: 0, dur: ceniza ? 2.2 + Math.random() : 1.2 + Math.random() * 0.8, color: ceniza ? mon?.motas?.[2] ?? '#8a8078' : Math.random() < 0.5 ? mon?.motas?.[0] ?? '#ff5020' : mon?.motas?.[1] ?? '#ffa040', tam: ceniza ? 2 : 1.5, tipo: ceniza ? 'humo' : 'brasa' } as any);
      }
    }
  }
}
fijarGanchoRelieve(ganchoRelieve);
export function dibujarMundo(j: Juego, dt: number, tiempo: number) {
  tramo('camara');
  empezarRelieve(ctx);
  const z = j.zona, h = j.heroe;
  nuevoCuadroSombras();
  const sx = j.sacudida > 0 ? (R() - 0.5) * j.sacudida * 12 * acc.temblor : 0, sy = j.sacudida > 0 ? (R() - 0.5) * j.sacudida * 8 * acc.temblor : 0;
  // frente a la pieza ancla (la catedral), la cámara sube suave para que se vean las torres
  let alzar = 0, monCerca = 0; monCima = null;
  for (const sa of z.salidas) if (sa.piezas?.length) {
    const fa = sa.piezas[sa.piezas.length - 1], pu = puertaAncla(sa);
    // (la distancia de frente y de costado se mide desde la puerta y por su eje: la catedral por y, los monumentos por la diagonal)
    const rx = h.x - pu.x, ry = h.y - pu.y, dy = pu.mon ? rx * pu.dx + ry * pu.dy : h.y - fa.cy, dx = pu.mon ? Math.abs(rx * pu.dy - ry * pu.dx) : Math.abs(h.x - fa.cx);
    if (!(dy > -2 && dy < (luzMonumento(fa.id) ? 30 : 26) && dx < 16)) continue;
    const w = (luzMonumento(fa.id) && !(window as any).__alzarCorto ? Math.min(1, (30 - dy) / 6) : Math.min(1, (26 - dy) / 14)) * Math.min(1, (16 - dx) / 6);
    // (los monumentos de los actos 2 a 7, monumentos.ts) sube lo justo para que entre la pieza más alta (con margen por el
    // adelanto de la cámara al caminar)
    let tope = 240;
    if (luzMonumento(fa.id) && !(window as any).__alzarCatedral) {
      const yc = (MH - ALTO_HUD / ZM) / 2; let cima = 1e9;
      for (const o of sa.piezas) { const q = objetoMeta(o.id, o.v)?.f[0]; if (q) cima = Math.min(cima, (o.cx + o.cy + 1) * 8 - q.ay - (h.x + h.y) * 8 + yc); }
      // (hasta 290: el héroe en la puerta queda todavía por encima del HUD, con los pies a 34 puntos de él a 720)
      // (desde unas 12 celdas de la puerta, el tope sube con la distancia hasta dejar al héroe a 70 del HUD, como en `hitosDe`:
      //  de lejos entra lo más alto del monumento, el anillo de la Escalera; cerca de la puerta sigue en 290. `__alzarCorto` lo apaga)
      const lejos = (window as any).__alzarCorto ? 0 : Math.max(0, Math.min(1, (dy - 10) / 5)), tmax = 290 + lejos * Math.max(0, yc - 70 - 290);
      if (cima < 1e9) tope = Math.max(0, Math.min(tmax, 40 - cima));
      if (cima < 1e9 && dy < 26) monCima = { cima, zona: z.id + ':' + z.semilla };
    }
    alzar = Math.max(alzar, tope * w);
    if (luzMonumento(fa.id)) monCerca = Math.max(monCerca, w);
  }
  // (entrega 6) frente a un hito del acto la cámara también sube lo justo para que entre entero en la pantalla, a lo sumo
  // 150 puntos (el héroe queda en el tercio de abajo, nunca bajo el HUD). Antes el gigante del glaciar, la escalera de los
  // siete o el campanario se cortaban arriba con el héroe al pie. `__hitoCortado` vuelve a lo de antes
  if (!(window as any).__hitoCortado) for (const o of hitosDe(z)) {
    const q = objetoMeta(o.id, o.v)?.f[0]; if (!q) continue;
    const d = Math.hypot(h.x - o.cx, h.y - o.cy), w = d < 16 ? 1 : d > 26 ? 0 : (26 - d) / 10; if (!w) continue;
    const ox = (o.cx - o.cy) * 16, hx0 = (h.x - h.y) * 16; if (Math.abs(ox - hx0) > MW / 2 + q.w / 2) continue;
    const yc = (MH - ALTO_HUD / ZM) / 2, cima = (o.cx + o.cy + 1) * 8 - q.ay - (h.x + h.y) * 8 + yc, tope = Math.min(150, yc * 0.48);
    if (cima < 12) alzar = Math.max(alzar, Math.min(tope, 12 - cima) * w * w * (3 - 2 * w));
  }
  camAlzada += (alzar - camAlzada) * Math.min(1, dt * 2.5);
  cercaMon += (((window as any).__nieblaMonViejo ? 0 : monCerca) - cercaMon) * Math.min(1, dt * 1.5); (window as any).__cercaMon = cercaMon;
  // la cámara sigue al héroe con un resorte corto y se adelanta un poco hacia donde camina (antes iba clavada a él: cada
  // arranque y cada giro sacudían toda la pantalla). Al cambiar de zona o teletransportarse, corta en seco
  {
    const hx = (h.x - h.y) * 16, hy = (h.x + h.y) * 8, anda = !h.muerto && (h.acc === 'caminar' || h.acc === 'correr');
    const [vx, vy] = DIR_VEC[h.dir] ?? [0, 0], mx = anda ? (vx - vy) * 0.71 * 30 : 0, my = anda ? (vx + vy) * 0.71 * 15 : 0;
    const clave = z.id + ':' + z.semilla;
    if (clave !== camZona || Math.hypot(hx - camS.x, hy - camS.y) > 150) { camZona = clave; camS.x = hx; camS.y = hy; camS.mx = 0; camS.my = 0; }
    const km = Math.min(1, dt * 2.4), ks = 1 - Math.exp(-dt * 11);
    camS.mx += (mx - camS.mx) * km; camS.my += (my - camS.my) * km;
    camS.x += (hx + camS.mx - camS.x) * ks; camS.y += (hy + camS.my - camS.y) * ks;
    cam.x = camS.x + sx; cam.y = camS.y + sy - camAlzada;
    // el empujón del golpe: la cámara cede un instante hacia donde pegó el héroe
    const pt = j.patada; if (pt) { const ed = (performance.now() - pt.t) / 140; if (ed >= 0 && ed < 1) { const q = (1 - ed) ** 2 * pt.k * acc.temblor; cam.x += pt.dx * q; cam.y += pt.dy * q; } }
  }
  // plano de llegada a la catedral: la primera vez que el héroe entra al camposanto o se acerca a la puerta, 3.5 s con la
  // fachada entera (el foco de siempre, sin zoom); se suelta antes si el héroe camina más de 2 casillas
  if (!camCine.on) planoLlegada(j, dt);
  // cámara de jefe: entre el héroe y el jefe, con el jefe entero debajo de su barra y el héroe arriba del HUD
  const jf = j.jefe, enPelea = !!jf && !jf.muerto && Math.hypot(jf.x - h.x, jf.y - h.y) < 16 && foco.k <= 0;
  camJefe += ((enPelea ? 1 : 0) - camJefe) * Math.min(1, dt * 1.8);
  if (camJefe > 0.002 && jf) {
    const q0 = cuadrosMonstruo(jf.def.sprite, 'quieto', 's')[0], alto = (q0?.ay ?? 120) * (jf.escala ?? 1);
    const bx = (jf.x - jf.y) * 16, by = (jf.x + jf.y) * 8, hx = (h.x - h.y) * 16, hy = (h.x + h.y) * 8, c0 = (H - ALTO_HUD / ZM) / 2;
    const barra = hud.jefe ? hud.jefe[1] + hud.jefe[3] : 70;
    // y de cámara: el jefe con los pies a (barra + alto + 16) como mínimo; el héroe nunca más abajo que H - 170
    const maxJefe = by + c0 - (barra + alto + 16), minHeroe = hy + c0 - (H - 170);
    const yMedio = (hy + by) / 2 - H * 0.08;
    const ty = Math.max(minHeroe, Math.min(maxJefe, yMedio));
    const k = camJefe * camJefe * (3 - 2 * camJefe);
    cam.x += ((hx + bx) / 2 + sx - cam.x) * k; cam.y += (ty + sy - cam.y) * k;
  }
  if (foco.k > 0) { const k = foco.k * foco.k * (3 - 2 * foco.k); cam.x += ((foco.x - foco.y) * 16 - camS.x) * k; cam.y += ((foco.x + foco.y) * 8 - 60 - camS.y + camAlzada) * k; }
  if (camCine.on) { cam.x = (camCine.x - camCine.y) * 16 + sx + MW / 2 - MW * camCine.fx; cam.y = (camCine.x + camCine.y) * 8 + sy - camCine.alt + (MH - ALTO_HUD / ZM) / 2 - MH * camCine.fy; }
  else panoramica(dt);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  picksAnt = picks; picks = []; vivasMonstruo = 0;
  prepararFuegos(j, dt, aPant, W, H); seguirSuelo(j, dt); seguirPoderes(j); seguirPresencias(j); dtCuadro = dt; heroeDibujo = j.heroe; claridadPfx(j.zona.oscuridad);
  colorBruma = '96,100,108'; anclasCuadro = []; esAncla = new Set(z.salidas.flatMap((sa) => sa.piezas ?? []));
  recolectar(j, tiempo, aPant, W, H);
  // explorar
  const btx = Math.floor(h.x / 5), bty = Math.floor(h.y / 5);
  // (a campo abierto se ve lejos: el radio cubre la pantalla, unas 30 casillas. Con 18 el mundo era una isla alumbrada
  //  en medio de una pantalla negra. Bajo tierra se sigue descubriendo de a poco: 22 casillas)
  // (bajo tierra 29 casillas desde las salas grandes de la oleada 1 de mundos: con 22 una sala de 35 no se abría entera al entrar)
  const rv = (window as any).__rv ?? (z.tipo === 'mazmorra' ? 34 : 38);
  for (let dy = -6; dy <= 6; dy++) for (let dx = -6; dx <= 6; dx++) { const X = btx + dx, Y = bty + dy; if (X >= 0 && Y >= 0 && X < z.tw && Y < z.th && dx * dx + dy * dy <= rv) z.explorado[Y * z.tw + X] = 1; }
  // a cielo abierto se ve lo que entra en pantalla, sea del tamaño que sea: en una pantalla grande (1920 de ancho en Lejos)
  // el círculo de seis baldosas dejaba los costados negros, como piso que no existía, hasta caminar hasta allá
  if (z.tipo !== 'mazmorra' && rv >= 38) {
    const A = Math.ceil(W / 2 / 80) + 1, B = Math.ceil(H / 2 / 40) + 1;
    for (let u = -A; u <= A; u++) for (let v = -B; v <= B; v++) {
      if ((u + v) & 1) continue;
      const dx = (u + v) / 2, dy = (v - u) / 2, X = btx + dx, Y = bty + dy;
      if (X >= 0 && Y >= 0 && X < z.tw && Y < z.th) z.explorado[Y * z.tw + X] = 1;
    }
  }
  // pisos visibles
  const f25 = Math.floor(tiempo * 25);
  const [wx0] = aMundo(0, 0), [, wy0] = aMundo(W, 0), [wx1] = aMundo(W, H), [, wy1] = aMundo(0, H);
  const bx0 = Math.max(0, Math.floor(wx0 / 5) - 1), bx1 = Math.min(z.tw - 1, Math.ceil(wx1 / 5) + 1);
  const by0 = Math.max(0, Math.floor(wy0 / 5) - 1), by1 = Math.min(z.th - 1, Math.ceil(wy1 / 5) + 1);
  gobernar(dt);
  tramo('piso');
  // el piso entero (baldosas, matiz, detalles, roca de las cavernas, suelo del relleno) se pinta una vez en trozos y se
  // copia: antes eran unas 400 llamadas por cuadro (y el doble con la luz avanzada). Ver trozosPiso.
  if (!trozosPiso(j, f25)) pintarPiso(ctx, z, aPant, bx0, bx1, by0, by1, Math.floor(f25 / 4), 0, 0, W, H);
  tramo('suelo');
  if (z.lluvia && z.tipo !== 'mazmorra' && !(window as any).__sinLluvia) lluviaSuelo(j, dt, tiempo, aPant, aMundo);
  if (!(window as any).__sinAmbiente) ambienteSuelo(j, dt, tiempo, aPant, bx0, bx1, by0, by1);
  // manchas
  for (const m of j.manchas) {
    const [px, py] = aPant(m.x, m.y); if (px < -60 || px > W + 60 || py < -40 || py > H + 40) continue;
    if (m.forma) { dibujarSangre(m, px, py); continue; }
    if (m.tipo !== 'sangre' && !(window as any).__sinMarcas) { dibujarMarca(ctx, m, px, py, j.t); continue; }
    ctx.save(); ctx.globalAlpha = m.tipo === 'quemado' ? 0.55 : 0.75; ctx.fillStyle = m.color;
    ctx.beginPath(); ctx.ellipse(px, py, m.r * 16, m.r * 8, 0, 0, Math.PI * 2); ctx.fill();
    if (m.tipo === 'sangre' && m.r > 0.5) { ctx.beginPath(); ctx.ellipse(px + m.r * 9, py + 3, m.r * 6, m.r * 3, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  // el piso que sigue ardiendo después de los poderes de fuego
  // (el piso que arde ya no se pinta acá, debajo de todo: va en el orden del mundo, ver itemsSuelo)
  // aviso del aliento: el cono se enciende en el piso antes de soplar (para poder salir de él)
  for (const m of j.monstruos) {
    const al = (m as any).aliento; if (!al || al.fase !== 'aviso' || m.muerto) continue;
    const k = Math.min(1, al.t / 0.6), R0 = al.conf.alcance;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.beginPath();
    const [x0, y0] = aPant(m.x, m.y); ctx.moveTo(x0, y0);
    for (let i = 0; i <= 12; i++) { const a = al.ang - Math.PI / 4 + (i / 12) * (Math.PI / 2); const [x, y] = aPant(m.x + Math.cos(a) * R0, m.y + Math.sin(a) * R0); ctx.lineTo(x, y); }
    // amarillo claro y borde marcado: sobre la lava de Ozmaren un naranja no se distingue
    ctx.closePath(); ctx.fillStyle = `rgba(255,210,110,${0.14 + 0.3 * k})`; ctx.fill();
    ctx.strokeStyle = `rgba(255,240,180,${0.5 + 0.5 * k})`; ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
  }
  // aviso de las maniobras de los monstruos: círculo o carril en el piso que se llena hasta el momento del golpe
  for (const m of j.monstruos) {
    const mn = (m as any).man; if (!mn || m.muerto || mn.fase === 'recupera') continue;
    const enAire = mn.tipo === 'salto' && mn.fase === 'accion';
    if (mn.fase !== 'aviso' && !enAire) continue;
    const k = enAire ? 1 : Math.min(1, mn.t / mn.aviso), pulso = 0.5 + 0.5 * Math.sin(tiempo * 18);
    const rojo = `rgba(255,70,40,${0.1 + 0.22 * k})`, borde = `rgba(255,${150 - 70 * k},${90 - 50 * k},${0.55 + 0.4 * k * pulso})`;
    const disco = (cx: number, cy: number, r: number) => {
      ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; const [x, y] = aPant(cx + Math.cos(a) * r, cy + Math.sin(a) * r); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fillStyle = rojo; ctx.fill(); ctx.strokeStyle = borde; ctx.lineWidth = 2; ctx.stroke();
      // el relleno que crece marca cuánto falta
      ctx.beginPath(); for (let i = 0; i <= 28; i++) { const a = (i / 28) * Math.PI * 2; const [x, y] = aPant(cx + Math.cos(a) * r * k, cy + Math.sin(a) * r * k); if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.fillStyle = `rgba(255,120,60,${0.16 + 0.14 * k})`; ctx.fill();
    };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (mn.tipo === 'embestida') {
      const w = m.radio + 0.45, L = mn.largo, c = Math.cos(mn.ang), sn = Math.sin(mn.ang), nx = -sn * w, ny = c * w;
      const P = (d: number, lado: number) => aPant(m.x + c * d + nx * lado, m.y + sn * d + ny * lado);
      const camino = (d1: number) => { ctx.beginPath(); const a = P(0, 1), b2 = P(d1, 1), c2 = P(d1 + w, 0), d2 = P(d1, -1), e2 = P(0, -1); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.lineTo(c2[0], c2[1]); ctx.lineTo(d2[0], d2[1]); ctx.lineTo(e2[0], e2[1]); ctx.closePath(); };
      camino(L); ctx.fillStyle = rojo; ctx.fill(); ctx.strokeStyle = borde; ctx.lineWidth = 2; ctx.stroke();
      camino(L * k); ctx.fillStyle = `rgba(255,120,60,${0.16 + 0.14 * k})`; ctx.fill();
    } else if (mn.tipo === 'charcos') { for (const [x, y] of mn.puntos ?? []) disco(x, y, mn.radio); }
    else if (mn.tipo === 'abanico') {
      const R0 = (m.def.rango ?? 7), n = 7, ab = 0.2 * 3.4; ctx.beginPath(); const [x0, y0] = aPant(m.x, m.y); ctx.moveTo(x0, y0);
      for (let i = 0; i <= 12; i++) { const a = mn.ang - ab + (i / 12) * ab * 2; const [x, y] = aPant(m.x + Math.cos(a) * R0, m.y + Math.sin(a) * R0); ctx.lineTo(x, y); }
      ctx.closePath(); ctx.fillStyle = `rgba(255,90,50,${0.06 + 0.14 * k})`; ctx.fill(); ctx.strokeStyle = borde; ctx.lineWidth = 1.5; ctx.stroke(); void n;
    } else disco(mn.x, mn.y, mn.radio);
    ctx.restore();
  }
  tramo('lista');
  // lista de cosas a ordenar (t: de qué es, para el medidor F3)
  type Item = { prof: number; draw: () => void; t?: string };
  energiaSuelo(ctx, j, aPant);
  const items: Item[] = [];
  const cerca = (x: number, y: number, m = 3) => { const [px, py] = aPant(x, y); return px > -220 * m / 3 && px < W + 220 && py > -60 && py < H + 320; };
  // quién puede apartar el pasto: el héroe y los monstruos vivos que están cerca
  const pisan: Ent[] = [h]; for (const m of j.monstruos) if (!m.muerto && Math.abs(m.x - h.x) + Math.abs(m.y - h.y) < 22) pisan.push(m);
  const fViento = (window as any).__sinViento ? 0 : z.tipo === 'mazmorra' ? 0.25 : z.lluvia ? 1.9 : 1;
  let nMecen = 0, nDoblan = 0;
  // objetos del mapa
  let nCerca = 0;
  for (const o of (window as any).__sinCubetas ? z.objetos : objetosVisibles(z)) {
    if (!cerca(o.cx + 0.5, o.cy + 0.5, 4)) continue;
    if (o.id === 'muro_esquina' && (window as any).__sinEsquinas) continue; // (las esquinas de muro, para comparar)
    nCerca++;
    const meta = objetoMeta(o.id, o.v); if (!meta || !meta.f.length) continue;
    let q = meta.f[Math.floor(f25 / meta.t) % meta.f.length];
    // cofres que se abren: la animación se toca una vez y queda abierto
    if (o.v.startsWith('abriendo') && o.dato?.abre !== undefined) {
      const i = Math.floor(((j.t - o.dato.abre) * 25) / meta.t);
      if (i >= meta.f.length) o.v = o.v.endsWith('_y') ? 'abierto_y' : 'abierto';
      q = meta.f[Math.min(meta.f.length - 1, i)];
    }
    const [px, py] = aPant(o.cx + 0.5, o.cy + 0.5);
    // fuego de Doom vivo: el gemelo sin llama y el fuego encima
    const vivos = vivosDe(o), gem = vivos?.[0].s.sprite ? objetoMeta(vivos[0].s.sprite, o.v) : null;
    if (vivos && gem?.f.length) q = gem.f[0];
    // (un objeto grande que se pisa por dentro, como el círculo de piedras o una fosa, se ordena por su borde de atrás: por
    // su centro, el que entraba quedaba dibujado detrás de la losa entera)
    // (el río es agua: va como suelo y nunca tapa a nadie)
    const prof = meta.plano || o.id === 'par_arroyo' || o.id === 'inf2_rio_lava' ? -1e6 + o.cx + o.cy : pisable(j.zona, o) ? o.cx + o.cy - (o.hw + o.hh) / 2 + 1 : o.cx + o.cy + (o.hw + o.hh) / 2 - 1;
    const alto = q.ay;
    // lo que es hoja o tela se mece con el viento (un cizallado desde el pie), y el pasto se aparta de quien lo pisa
    let ciz = 0;
    const fo = flagsObj(o), cuelga = fo.cuelga, meceMas = fo.meceMas;
    // lo que cuelga se hamaca siempre un poco (también bajo techo): un péndulo lento, cada uno a su ritmo
    if (cuelga) { ciz = Math.sin(tiempo * 1.1 + o.cx * 1.7 + o.cy * 0.9) * 0.035 + Math.sin(tiempo * 2.3 + o.cx) * 0.012 * (0.4 + fViento); nMecen++; }
    else if ((fo.mece || meceMas) && (fViento || meceMas)) {
      const blanda = fo.blanda || (meceMas && alto < 46), amp = (blanda ? 0.05 : alto > 150 ? 0.011 : 0.028) * (meceMas && !fViento ? 0.35 : 1), fViento2 = Math.max(fViento, meceMas ? 0.35 : 0);
      // ráfagas: una ola lenta que recorre el mapa y, encima, el temblor propio de cada planta
      const raf = 0.55 + 0.45 * Math.sin(tiempo * 0.5 - (o.cx + o.cy) * 0.11);
      ciz = (Math.sin(tiempo * 1.5 + o.cx * 0.7 + o.cy * 0.45) + 0.45 * Math.sin(tiempo * 3.3 + o.cx * 1.3)) * amp * raf * fViento2 + amp * 0.6 * raf * fViento2;
      nMecen++;
      if (blanda) for (const e of pisan) {
        const dx = o.cx + 0.5 - e.x, dy = o.cy + 0.5 - e.y, d2 = dx * dx + dy * dy; if (d2 > 1.7) continue;
        ciz -= (dx - dy >= 0 ? 1 : -1) * 0.42 * (1 - d2 / 1.7); nDoblan++;
      }
    }
    // lo largo (un muro de 5 x 1, una empalizada, un sarcófago de 3) va en franjas de una celda, cada una con la profundidad
    // de su celda: así lo que está delante de la punta de atrás de un muro ya no queda debajo de él. Antes el muro entero
    // iba con la profundidad de su punta de adelante y se pintaba encima de los cofres, jergones, braseros y velas pegados
    // a su cara (Rick, 21 nov 2026: "cofres y otros assets como debajo de las paredes"). `__murosEnteros` vuelve a lo de antes
    const tiras = franjasDe(o, meta.plano, q, prof, !!(ciz || cuelga || vivos || esAncla.has(o) || o.dato?.abre !== undefined || (meta.luz && ES_FUEGO.test(o.id)) || pisable(z, o)));
    if (tiras) {
      let alfa = 1, cubre = false;
      const [hx, hy] = aPant(h.x, h.y);
      if (alto > 60) {
        const lx = hx - (px - q.ax);
        const t = tiras.find((f) => lx >= f.a && lx < f.b);
        if (t && t.prof > h.x + h.y && hy - 30 > py - q.ay && hy - 30 < py - q.ay + q.h * 0.85 && opacoSobre(q, lx, hy - (py - q.ay))) cubre = true;
      }
      // (entrega 6) con el héroe detrás se abre una ventana a su alrededor en las franjas que están delante de él (ver recorte.ts)
      const viejo = (window as any).__alfaViejo, kRec = viejo ? 0 : aperturaRecorte(o, cubre, tiempo);
      if (viejo && cubre) alfa = 0.45;
      let recCv: HTMLCanvasElement | null | undefined;
      for (const t of tiras) {
        const sub = { ...q, x: q.x + t.a, w: t.b - t.a, ax: q.ax - t.a } as Cuadro;
        items.push({ prof: t.prof, t: 'objetos', draw: () => {
          const x0 = px - sub.ax; if (x0 + sub.w < 0 || x0 > W || py - q.ay > H || py - q.ay + q.h < 0) return;
          if (alfa < 1) ctx.globalAlpha = alfa;
          const br = q.ay > 200 && !monumentoPieza(o.id) ? conBruma(q, colorBruma) : null;
          if (kRec > 0.01 && t.prof > h.x + h.y && hx + RX_REC > x0 && hx - RX_REC < x0 + sub.w) {
            if (recCv === undefined) recCv = piezaRecortada(q, br, px, py, hx, hy - ALTO_PECHO, kRec);
            if (recCv) { ctx.drawImage(recCv, t.a, 0, t.b - t.a, q.h, Math.round(px - q.ax) + t.a, Math.round(py - q.ay), t.b - t.a, q.h); const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * (1 - 0.5 * kRec); relieveDe(ctx, sub, px, py); ctx.globalAlpha = a0; }
          } else if (br) ctx.drawImage(br, t.a, 0, t.b - t.a, q.h, Math.round(px - q.ax) + t.a, Math.round(py - q.ay), t.b - t.a, q.h); else dibujar(ctx, sub, px, py);
          if (alfa < 1) ctx.globalAlpha = 1;
        } });
      }
    } else items.push({ prof, t: 'objetos', draw: () => {
      // transparencia si tapa al héroe
      let alfa = 1, cubre = false;
      const [hx, hy] = aPant(h.x, h.y);
      if (alto > 60) {
        if (prof > h.x + h.y && hx > px - q.ax && hx < px - q.ax + q.w && hy - 30 > py - q.ay && hy - 30 < py - q.ay + q.h * 0.85 && opacoSobre(q, hx - (px - q.ax), hy - (py - q.ay))) cubre = true;
      }
      // (entrega 6) antes la pieza entera bajaba a 0,45 y el hito quedaba como un fantasma: ahora solo se abre una ventana
      // alrededor del héroe (recorte.ts). `__alfaViejo` vuelve a lo de antes
      const viejo = (window as any).__alfaViejo, kRec = viejo ? 0 : aperturaRecorte(o, cubre, tiempo);
      if (viejo && cubre) alfa = 0.45;
      // lo alto (más de 200 px sobre el ancla) lleva bruma de altura: perspectiva atmosférica
      const br = q.ay > 200 && !monumentoPieza(o.id) ? conBruma(q, colorBruma) : null;
      if (alfa < 1) ctx.globalAlpha = alfa;
      // (lo que cuelga gira desde su punto más alto; lo que está plantado, desde el pie)
      // lo plantado se mece de la franja del piso para arriba: la base, las raíces y la sombra horneada sobre el piso quedan
      // quietas (antes se cizallaba el cuadro entero y la sombra y el pie se corrían sobre el piso)
      const PISO_QUIETO = Math.min(26, Math.round(alto * 0.22));
      // fuera de la pantalla no se pinta (con lo que se mece de margen): unas 300 llamadas menos en el páramo
      const mg = Math.abs(ciz) * q.h + 2, x0 = px - q.ax, y0 = py - q.ay;
      const rec = kRec > 0.01 && !(x0 + q.w + mg < 0 || x0 - mg > W || y0 > H || y0 + q.h < 0) ? piezaRecortada(q, br, px, py, hx, hy - ALTO_PECHO, kRec) : null;
      if (x0 + q.w + mg < 0 || x0 - mg > W || y0 > H || y0 + q.h < 0) { if (!q.img) precargar([q.atlas]); if (lab.on) { relDe(q.atlas + '_n'); relDe(q.atlas + '_h'); } } // (que sigan bajando antes de entrar)
      else if (rec) {
        // la pieza con su ventana: lo que se mece, igual que abajo (el pie quieto y lo de arriba cizallado)
        const X = Math.round(px - q.ax), Y = Math.round(py - q.ay), corte = ciz && !cuelga && alto > PISO_QUIETO + 4 ? q.ay - PISO_QUIETO : 0;
        if (corte) ctx.drawImage(rec, 0, corte, q.w, q.h - corte, X, Y + corte, q.w, q.h - corte);
        if (ciz) { ctx.save(); ctx.transform(1, 0, ciz, 1, -ciz * (cuelga ? py - q.ay : corte ? py - PISO_QUIETO : py), 0); }
        ctx.drawImage(rec, 0, 0, q.w, corte || q.h, X, Y, q.w, corte || q.h);
        if (ciz) ctx.restore();
        const a0 = ctx.globalAlpha; ctx.globalAlpha = a0 * (1 - 0.5 * kRec); relieveDe(ctx, q, px, py); ctx.globalAlpha = a0;
      }
      else if (ciz && !cuelga && !br && alto > PISO_QUIETO + 4) {
        const corte = q.ay - PISO_QUIETO; // fila del cuadro donde empieza lo quieto
        const abajo = { ...q, y: q.y + corte, h: q.h - corte, ay: q.ay - corte }, arriba = { ...q, h: corte };
        dibujar(ctx, abajo as Cuadro, px, py);
        ctx.save(); ctx.transform(1, 0, ciz, 1, -ciz * (py - PISO_QUIETO), 0); dibujar(ctx, arriba as Cuadro, px, py); ctx.restore();
      } else {
        if (ciz) { ctx.save(); ctx.transform(1, 0, ciz, 1, -ciz * (cuelga ? py - q.ay : py), 0); }
        if (br) ctx.drawImage(br, Math.round(px - q.ax), Math.round(py - q.ay)); else dibujar(ctx, q, px, py);
        if (ciz) ctx.restore();
      }
      if (alfa < 1) ctx.globalAlpha = 1;
      // la losa de púas se delata un poco antes de saltar: las puntas de acero destellan de a una (`__puasMudas` lo apaga)
      if (o.id === 'trampa_puas' && o.v === 'abajo' && !(window as any).__puasMudas) ((window as any).__puasViejas ? brilloPuasViejo : brilloPuas)(ctx, px, py, tiempo, o.cx * 7 + o.cy * 13);
      // la luz del cofre que se abre va con el cofre en el orden de fondo: quien esté parado delante la tapa, no al revés
      if (o.dato?.abre !== undefined && j.t - o.dato.abre < 2.6 && /cofre/.test(o.id)) luzCofre(px, py, j.t - o.dato.abre, /ornado|noble|sarcofago|gg/.test(o.id) ? 1.25 : 1, /maldito/.test(o.id) ? '#b060ff' : '#ffc860');
      if (esAncla.has(o)) anclasCuadro.push({ q, br, px, py });
      // fuego vivo sobre fogatas, braseros, piras y antorchas
      if (vivos && (gem?.f.length || !vivos[0].s.sprite)) dibujarVivos(ctx, vivos, px, py, alfa);
      else if (meta.luz && !tieneFuegoDoom(o) && ES_FUEGO.test(o.id) && !/^(arma_|mis_)/.test(o.id) && !/apagad/.test(o.v)) fuegoMundo(ctx, px, py - meta.luz[2] * 1.1, Math.max(0.3, Math.min(1.3, meta.luz[0] / 160)), tiempo, cam.x, cam.y, o.cx + o.cy);
    } });
    if (o.dato?.mision && (o.tag === 'pista' || o.tag === 'reliquia' || o.tag === 'altar' || o.tag === 'destino')) items.push({ prof: prof - 0.01, draw: () => haloMision(px, py, tiempo, o.tag === 'destino') });
    if (o.tag === 'pista' || o.tag === 'reliquia' || o.tag === 'altar' || o.tag === 'libro' || o.tag === 'cofre' || o.tag === 'santuario' || o.tag === 'pozo' || o.tag === 'baul' || o.tag === 'romper' || o.tag === 'volcar' || o.id === 'com_piedra_viaje') picks.push({ tipo: 'objeto', ref: o, x0: px - q.ax, y0: py - q.ay, x1: px - q.ax + q.w, y1: py - q.ay + q.h, prof });
    // los restos de una matanza se leen, pero solo desde el bulto del medio: la pieza entera es grande y se robaba los clics para caminar
    else if (o.tag === 'restos') { const w = Math.max(24, q.w * 0.5), hh = Math.max(20, q.h * 0.55), x0 = px - q.ax + (q.w - w) / 2, y0 = py - q.ay + q.h - hh - q.h * 0.1; picks.push({ tipo: 'objeto', ref: o, x0, y0, x1: x0 + w, y1: y0 + hh, prof }); }
  }
  (window as any).__viento = { mecen: nMecen, doblan: nDoblan, cerca: nCerca };
  // salidas (las puertas/escaleras ya están como objetos; aquí solo la zona de clic)
  // la zona de clic de una salida es chica y centrada: el umbral, no todo el borde (antes se robaba clics para caminar)
  for (const s of z.salidas) { const [px, py] = aPant(...puntoSalida(z, s)); picks.push({ tipo: 'salida', ref: s, x0: px - 26, y0: py - 70, x1: px + 26, y1: py + 12, prof: s.cx + s.cy - 2 }); }
  // botín en el suelo
  for (const s of j.suelo) {
    if (!cerca(s.x, s.y)) continue;
    const [px, py] = aPant(s.x, s.y);
    items.push({ prof: s.x + s.y - 0.5, draw: () => dibujarBotinSuelo(s, px, py, tiempo) });
  }
  // pedazos de cuerpo y reventones del kit de gore
  for (const gb of ((j as any).gibs ?? []) as any[]) {
    if (!cerca(gb.x, gb.y)) continue;
    const meta = objetoMeta(gb.id, gb.pal); if (!meta || !meta.f.length) continue;
    const [px, py] = aPant(gb.x, gb.y), q = meta.f[((Math.floor(gb.ang) % meta.f.length) + meta.f.length) % meta.f.length];
    const alfa = Math.min(1, (gb.vida - gb.t) / 3);
    items.push({ prof: gb.x + gb.y - (gb.z > 0 ? -0.5 : 0.55), draw: () => { ctx.save(); ctx.globalAlpha = alfa; dibujar(ctx, q, px, py - gb.z * 0.6); ctx.restore(); } });
  }
  for (const rv of ((j as any).reventones ?? []) as any[]) {
    const meta = objetoMeta('gore_reventon', rv.pal); if (!meta || !meta.f.length) continue;
    const i = Math.floor((rv.t * 25) / (meta.t || 2)); if (i >= meta.f.length) continue;
    const [px, py] = aPant(rv.x, rv.y);
    items.push({ prof: rv.x + rv.y + 0.3, draw: () => dibujar(ctx, meta.f[i], px, py, rv.esc ?? 1) });
  }
  // personajes
  const ents: Ent[] = [...j.monstruos, ...j.npcs, h];
  for (const e of ents) {
    if (!cerca(e.x, e.y)) continue;
    const muerto = e.muerto;
    items.push({ prof: (muerto ? e.x + e.y - 0.6 : e.x + e.y) + (sobrePuente(j, e) > 0 ? 4 : 0), t: 'cuerpos', draw: () => dibujarEnt(j, e, tiempo) });
  }
  // visiones
  for (const v of j.visiones) {
    const [px, py] = aPant(v.x, v.y);
    items.push({ prof: v.x + v.y, draw: () => {
      const fs = framesMonstruo(v.sprite, 'quieto', v.dir); const q = fs[Math.floor(tiempo * 6) % Math.max(1, fs.length)];
      const a = Math.sin(Math.min(1, v.t / 2.6) * Math.PI) * 0.35;
      ctx.globalAlpha = a; dibujarTenido(ctx, q, px, py, '#000000', 0.6); ctx.globalAlpha = 1;
    } });
  }
  // los efectos que envuelven un cuerpo van en el orden de profundidad, partidos por la línea de los pies: la mitad de
  // atrás justo antes del cuerpo y la de adelante justo después
  const mezclaDe = (id: string) => (LUZ_EFECTO[id]?.mezcla === 'normal' ? 'source-over' : 'lighter');
  // Todos los efectos del mundo entran en el orden de pintado. Antes se dibujaban al final, encima de todo: el hielo de
  // un congelado tapaba la reja, la lápida y el árbol que tenía delante (visto en el teléfono de Rick).
  //   - lo que está tendido en el piso (anillos, novas, charcos, círculos) se corta en franjas de pantalla y cada franja
  //     va con la profundidad del piso en esa fila: así un anillo grande pasa por DETRÁS del muro que tiene al fondo y por
  //     DELANTE del que tiene más acá, y los cuerpos parados adentro quedan encima;
  //   - lo que envuelve un cuerpo va partido por la línea de los pies (media atrás, media adelante);
  //   - lo que está de pie (un bloque de hielo, una explosión, una columna) va justo después de quien está en ese sitio.
  // Solo quedan arriba los de pantalla entera.
  for (const e of j.efectos) {
    const partido = (e as any).partido && !(window as any).__sinPartir;
    if (!partido && !enOrden(e)) continue;
    const pinta = () => { ctx.globalCompositeOperation = mezclaDe(e.id) as GlobalCompositeOperation; dibujarEfecto(e, tiempo); };
    if (esDePiso(e)) {
      const [, py] = aPant(e.x, e.y), F = 16, alc = Math.round(60 + 70 * Math.min(2.4, e.escala ?? 1));
      for (let y0 = -alc; y0 < alc; y0 += F) { const borde = y0 + F >= alc, arriba = y0 === -alc;
        items.push({ prof: e.x + e.y + (y0 + F / 2) / 8 - 0.55, t: 'efectos', draw: () => { ctx.save(); ctx.beginPath(); ctx.rect(-4000, arriba ? py - 4000 : py + y0, W + 8000, arriba ? 4000 + y0 + F : borde ? 4000 : F); ctx.clip(); pinta(); ctx.restore(); } }); }
    } else if (partido) {
      const [, py] = aPant(e.x, e.y), mitad = (atras: boolean) => () => { ctx.save(); ctx.beginPath(); ctx.rect(-4000, atras ? py - 4000 : py, W + 8000, 4000); ctx.clip(); pinta(); ctx.restore(); };
      items.push({ prof: e.x + e.y - 0.03, t: 'efectos', draw: mitad(true) }, { prof: e.x + e.y + 0.03, t: 'efectos', draw: mitad(false) });
    } else { const cd = colDetras(j, e);
      // (quinta pasada: la columna horneada que nace en el héroe va a dos tercios, menos de noche: se veía como un muro blanco)
      items.push({ prof: e.x + e.y + (cd ? -0.05 : 0.06), t: 'efectos', draw: () => { ctx.save(); alfaEf = cd && !(window as any).__blancoViejo ? 0.45 - 0.08 * nochePfx() : 1; pinta(); alfaEf = 1; ctx.restore(); } }); }
  }
  // Lo que está parado en el mundo y antes se pintaba al final, encima de todo: el portal del héroe, los umbrales de
  // salida, las torretas y las llamas de las fogatas sin fuego vivo. Ahora van en el orden de pintado: lo que tienen
  // delante los tapa. Para que los umbrales se sigan leyendo de lejos, después de la luz se les suma solo un halo suave.
  halosUmbral.length = 0;
  if (j.portal && j.portal.destino && ((j as any).portalZona === z.id || z.tipo === 'pueblo')) {
    const [wx, wy] = z.tipo === 'pueblo' ? [z.entradas.portal[0] + 0.5, z.entradas.portal[1] - 1] : [j.portal.x, j.portal.y];
    items.push({ prof: wx + wy, draw: () => dibujarPortal(j, tiempo) });
    const [hx, hy] = aPant(wx, wy); halosUmbral.push([hx, hy, z.tipo === 'pueblo' ? ZONAS[(j as any).portalZona] : { tipo: 'pueblo' }, 0.5 + 0.5 * Math.sin(tiempo * 3)]);
  }
  // (en las cinemáticas no van los umbrales de las salidas: son del juego, no del lugar)
  for (const sa of camCine.on ? [] : z.salidas) {
    const [wx, wy] = puntoSalida(z, sa), [px, py] = aPant(wx, wy);
    if (px < -120 || px > W + 120 || py < -140 || py > H + 80) continue;
    const pulso = 0.5 + 0.5 * Math.sin(tiempo * 2.2 + sa.cx), r = rumboSalida(z.id, sa.destino);
    items.push({ prof: wx + wy, draw: () => umbralVivo(px, py, !sa.obj, ZONAS[sa.destino], tiempo, pulso, sa.cx * 7.3 + sa.cy * 3.1, dtCuadro, r) });
    halosUmbral.push([px, py, ZONAS[sa.destino], pulso, r, !sa.obj]);
  }
  // (las trampas armadas las dibuja render/presencias.ts: la torreta es una ballesta que apunta, el cepo, la runa, la brasa y el corro)
  if (!presenciasVivas()) for (const tr of j.torretas) items.push({ prof: tr.x + tr.y, draw: () => { const [px, py] = aPant(tr.x, tr.y); ctx.fillStyle = '#3a3430'; ctx.fillRect(px - 6, py - 20, 12, 20); ctx.fillStyle = '#80786c'; ctx.fillRect(px - 9, py - 24, 18, 5); ctx.fillStyle = '#ff9040'; ctx.fillRect(px - 1, py - 22, 2, 2); } });
  for (const pf of profFuegosMundo()) items.push({ prof: pf + 0.02, draw: () => dibujarFuegosMundo(ctx, tiempo, cam.x, cam.y, pf) });
  // lo que vive en la zona (pixelfx) entra en el orden con todo lo demás: lo tapa lo que tiene delante
  for (const it of itemsAmbiente(ctx, j, aPant, W, H, tiempo)) items.push(it);
  // los proyectiles también van en el orden del mundo: el que pasa por detrás de un muro o de un árbol queda tapado
  const dibujarProyectil = (p: (typeof j.proyectiles)[number]) => {
    const [px, py] = aPant(p.x, p.y);
    if (p.arco) { const [ax, ay] = [px, py - p.z * 1.2]; ctx.fillStyle = p.elem === 'frio' ? '#a0e0ff' : p.elem === 'veneno' ? '#80ff60' : '#ffa040'; ctx.beginPath(); ctx.arc(ax, ay, 4, 0, Math.PI * 2); ctx.fill(); return; }
    const id = p.efecto;
    // los hechizos lanzados arden en vivo (cometas de fuego de Doom); flechas y virotes llevan además su sprite
    if (!(window as any).__sinCometa && cometa(ctx, p, px, py, dtCuadro) === 'solo') return;
    if (id.startsWith('pfx:')) { if (dibujarPfx(ctx, id.slice(4), p.t, px, py, { dir: dirPfx(p.vx, p.vy) })) return; }
    ctx.globalCompositeOperation = LUZ_EFECTO[id]?.mezcla === 'normal' ? 'source-over' : 'lighter';
    const meta = manifiesto().wm?.[id];
    const d = Math.round(((Math.atan2(p.vy, p.vx) * 180) / Math.PI / 45 + 8) % 8);
    const dname = (['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'])[d];
    if (meta) {
      const fs = manifiesto().w?.[`${id}/${meta.dir ? dname : 's'}`];
      if (fs) { const raw = fs[Math.floor(p.t * 25 / meta.t) % fs.length]; dibujarRaw(raw, px, py); return; }
    }
    ctx.fillStyle = '#fff'; ctx.fillRect(px - 2, py - 34, 4, 4);
  };
  for (const p of j.proyectiles) items.push({ prof: p.x + p.y + 0.07, draw: () => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; dibujarProyectil(p); ctx.restore(); } });
  for (const it of itemsEnergia(ctx, aPant)) items.push(it);
  for (const it of itemsSuelo(ctx, aPant, dtCuadro)) items.push(it);
  for (const it of itemsPoderes(ctx, aPant)) items.push(it);
  for (const it of itemsPresencias(ctx, j, aPant, tiempo)) items.push(it);
  tajoPend = null;
  // el tajo del héroe va justo después de su cuerpo (lo de delante, un muro o una columna, lo tapa) salvo sobre los
  // enemigos pegados que tiene delante (hasta 1,1 casillas): ahí se pinta otra vez justo después de cada uno, recortado a
  // su cuerpo (así lo que está delante de ese enemigo también lo tapa). Antes iba entero a 1,1 casillas y pisaba el muro
  // que estaba más cerca. Los cuerpos salen de los del cuadro anterior (`picksAnt`)
  const hd = j.heroe.x + j.heroe.y, viejoT = !!(window as any).__tajoViejo;
  const rectsTajo = viejoT ? [] : picksAnt.filter((k) => k.tipo === 'monstruo' && k.prof > hd + 0.04 && k.prof <= hd + 1.1).map((k) => ({ prof: k.prof, r: [Math.floor(k.x0) - 3, Math.floor(k.y0) - 2, Math.ceil(k.x1) + 3, Math.ceil(k.y1)] }));
  const pintaTajo = (clip: ((c: CanvasRenderingContext2D) => void) | null) => { if (!tajoPend) return; const [e, q, px, py, esc, t] = tajoPend;
    if (clip) { ctx.save(); ctx.beginPath(); clip(ctx); }
    tajoHeroe(ctx, j, e, q, px, py, esc, t); torbellinoAro(ctx, j, px, py, t, false); if (clip) ctx.restore(); };
  if (viejoT) items.push({ prof: hd + 1.1, draw: () => pintaTajo(null) });
  else {
    // (cada recorte se suma al anterior: fuera de todos los cuerpos, y cada cuerpo sin los que van después, así donde dos
    // se enciman el tajo no se pinta dos veces)
    const fuera = (c: CanvasRenderingContext2D, rs: typeof rectsTajo) => { for (const k of rs) { c.beginPath(); c.rect(-4000, -4000, W + 8000, H + 8000); c.rect(k.r[0], k.r[1], k.r[2] - k.r[0], k.r[3] - k.r[1]); c.clip('evenodd'); } };
    items.push({ prof: hd + 0.04, draw: () => pintaTajo(rectsTajo.length ? (c) => fuera(c, rectsTajo) : null) });
    rectsTajo.forEach((k, i) => items.push({ prof: k.prof + 0.01, draw: () => pintaTajo((c) => { c.rect(k.r[0], k.r[1], k.r[2] - k.r[0], k.r[3] - k.r[1]); c.clip(); fuera(c, rectsTajo.filter((o, n) => o.prof > k.prof || (o.prof === k.prof && n > i))); }) }));
  }
  tramo('orden');
  // lo que sueltan las armas vivas entra en el orden: las manchas con el piso, las gotas, el miasma y las chispas en la fila
  // del suelo que tienen debajo (antes iban encima de todo y se veían sobre las rocas de delante)
  { const [ox, oy] = aPant(0, 0), gv = (j as any).golpesVivos as { x: number; y: number; el: ElemArma; fuerte: boolean; alto: number }[] | undefined;
    // los golpes del arma viva que conectaron este cuadro revientan en el blanco, a la altura del pecho
    if (gv?.length) { for (const g of gv) { const [gx, gy] = aPant(g.x, g.y); golpeVivo(g.el, gx, gy - g.alto, ox, oy, gy, g.fuerte); luzViva.golpe = { x: gx - ox, y: gy - oy, t: tiempo, c: LUZ_RGB[g.el] }; } gv.length = 0; }
    moverDerrames(dtCuadro);
    for (const d of derramesDelMundo()) items.push({ prof: d.piso ? -1e6 + d.prof + 0.5 : d.prof + 0.3, draw: () => d.dibujar(ctx, ox, oy) } as any);
  }
  items.sort((a, b) => a.prof - b.prof);
  if (rend.on) { let cur = ''; for (const it of items) { const t = it.t ?? 'otros'; if (t !== cur) tramo(cur = t); it.draw(); } }
  else for (const it of items) it.draw();
  tramo('efectos');
  // poderes y efectos
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // los de mucha materia (sangre, hueso, humo, flechas) van con alfa normal: sumados se pierden
  const mezclar = (id: string) => { ctx.globalCompositeOperation = LUZ_EFECTO[id]?.mezcla === 'normal' ? 'source-over' : 'lighter'; };
  for (const e of j.efectos) { if (((e as any).partido && !(window as any).__sinPartir) || enOrden(e)) continue; mezclar(e.id); dibujarEfecto(e, tiempo); }
  energiaAire(ctx, j, aPant, W, H);
  // cuervos
  if (!presenciasVivas()) for (const c of j.cuervos) { const [px, py] = aPant(c.x, c.y); ctx.globalCompositeOperation = 'source-over'; pajaro(px, py - 50 - Math.sin(tiempo * 9 + c.ang) * 6, tiempo + c.ang); ctx.globalCompositeOperation = 'lighter'; }
  ctx.restore();
  tramo('particulas');
  // partículas
  for (const p of j.particulas) {
    const [px, py] = aPant(p.x, p.y);
    const k = 1 - p.t / p.dur;
    ctx.globalAlpha = Math.max(0, p.tipo === 'humo' ? k * 0.35 : k);
    ctx.fillStyle = p.color;
    if (p.tipo === 'humo') { ctx.beginPath(); ctx.arc(px, py - p.z, p.tam * (2 - k), 0, Math.PI * 2); ctx.fill(); }
    else ctx.fillRect(px - p.tam / 2, py - p.z - p.tam / 2, p.tam, p.tam);
  }
  ctx.globalAlpha = 1;
  // bruma baja al pie de la catedral, y después la luz
  tramo('luz');
  brumaAncla(j);
  dibujarLuz(j, tiempo);
  tramo('luzgpu');
  aplicarLuzGPU(ctx, luces as any, ctx.getTransform());
  tramo('arriba'); // (laboratorio: reiluminar con la tarjeta gráfica)
  puertaCatedral(j, dt, tiempo);
  // arcos de rayo: después de la luz (dibujados antes, la noche los apagaba y el rayo no se veía salir de la mano)
  // (el relámpago de pixel que sigue a los cuerpos está en poderes_vivos.ts; `__sinPoderesVivos` vuelve al de antes)
  if (poderesVivos()) dibujarArcos(ctx, j, aPant);
  else { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
  for (const e of j.efectos) if (e.id === 'arco_cadena' && (e as any).x2 !== undefined && e.t >= 0) {
    const [ax, ay] = aPant(e.x, e.y), [bx, by] = aPant((e as any).x2, (e as any).y2);
    // el relámpago en vivo, de la mano al pecho (el arco prehorneado estirado no se veía)
    rayo(ax, ay - ((e as any).deMano ? 44 : 34), bx, by - 34, Math.max(0, 1 - e.t / (e.dur ?? 0.3)) ** 0.6);
  }
  ctx.restore(); }
  // barras de vida de los enemigos (render/barras_vida.ts): encima del mundo y de la luz, debajo de números y frases
  dibujarBarras(j);
  // números de daño (encima de la oscuridad para que se lean)
  if (!(window as any).__sinNumeros) dibujarNumeros(ctx, j.numeros, aPant, TITULO); // (`__sinNumeros`: las pruebas que miden el blanco)
  frasesMonstruos();
  // salidas: se leen de lejos. Sin puerta, un umbral de luz (dos pilares y un arco, aro en el piso y motas que suben);
  // con puerta o escalera, el objeto es el marco y lleva solo el aro y las motas. La luz propia que tiñe el piso va en luces.ts.
  // El nombre aparece a unas 6 casillas (con Alt, todos).
  etiquetasMundo.length = 0;
  // el halo de los umbrales, sumado sobre la noche: se ven de lejos sin que el portal entero tape a nadie
  { ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [hx, hy, dest, pul, rb] of halosUmbral) { const c = colorUmbral(dest, rb).join(',');
      const g = ctx.createRadialGradient(hx, hy - 44, 6, hx, hy - 44, 64); g.addColorStop(0, `rgba(${c},${0.26 + pul * 0.1})`); g.addColorStop(0.5, `rgba(${c},0.09)`); g.addColorStop(1, `rgba(${c},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(hx, hy - 40, 44, 66, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore(); }
  for (const [hx, hy, dest, , rb, arco] of halosUmbral) if (rb) cheuronesRumbo(hx, hy, !!arco, colorUmbral(dest, rb), rb, tiempo);
  for (const sa of z.salidas) {
    const [px, py] = aPant(...puntoSalida(z, sa));
    if (px < -120 || px > W + 120 || py < -140 || py > H + 80) continue;
    const pulso = 0.5 + 0.5 * Math.sin(tiempo * 2.2 + sa.cx);
    void pulso;
    // el nombre: de cerca, entero en pantalla y en táctil fuera de los botones de abajo a la derecha
    const d = Math.hypot(j.heroe.x - sa.cx - 0.5, j.heroe.y - sa.cy - 0.5), kn = E.alt ? 1 : Math.max(0, Math.min(1, 6.5 - d));
    if (kn <= 0) continue;
    ctx.font = '13px Georgia, serif'; ctx.textAlign = 'center';
    const rb = rumboSalida(z.id, sa.destino);
    const txt = (window as any).__sinRumbos ? '» ' + sa.nombre[opciones.idi] + ' «' : '» ' + verboRumbo(rb, opciones.idi) + ' ' + nombreDestino(sa.destino, sa.nombre, opciones.idi) + ' «', tw2 = ctx.measureText(txt).width;
    let lx = Math.max(tw2 / 2 + 6, Math.min(W - tw2 / 2 - 6, px)), ly = Math.max(16, Math.min(H - 130, py - (sa.obj ? 96 : 100)));
    ly = esquivarHud([lx - tw2 / 2, ly - 12, tw2, 16]) + 12;
    etiquetasMundo.push({ txt, r: [lx - tw2 / 2, ly - 12, tw2, 16] });
    ctx.globalAlpha = kn; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(lx - tw2 / 2 - 5, ly - 13, tw2 + 10, 18);
    const cr = colorUmbral(ZONAS[sa.destino], rb);
    ctx.fillStyle = (window as any).__sinRumbos ? '#e8c070' : `rgb(${(cr[0] + 255 * 2) / 3 | 0},${(cr[1] + 255 * 2) / 3 | 0},${(cr[2] + 255 * 2) / 3 | 0})`; ctx.fillText(txt, lx, ly); ctx.globalAlpha = 1; ctx.textAlign = 'left';
  }
  // clima
  tramo('clima');
  clima(j, dt, tiempo);
  cerrarTramos();
}

const nieblaBaja = document.createElement('canvas');
const chispasPortal = new Map<number, { x: number; y: number; vx: number; vy: number; t: number; d: number }[]>();
/**
 * El umbral de una salida, vivo: un sello de runas que gira en el piso, y donde no hay puerta un arco de luz con un velo
 * que ondula adentro, dos braseros de fuego de Doom en los pies, un haz que sube y motas en espiral. El color dice a
 * dónde lleva: oro al pueblo, verde azulado a las mazmorras, rojo brasa a las tierras de fuego y luna fría al resto.
 */
const halosUmbral: [number, number, { tipo?: string; tema?: string } | undefined, number, Rumbo?, boolean?][] = [];
function umbralVivo(px: number, py: number, conArco: boolean, dest: { tipo?: string; tema?: string } | undefined, t: number, pulso: number, sem: number, dt: number, rb?: Rumbo) {
  // el color dice el rumbo (brasa baja, azul frío sube, cielo pálido sale a la superficie): antes la escalera de subir y
  // la de bajar de una mazmorra tenían el mismo verde azulado
  const c = colorUmbral(dest, rb), fuego = /infierno|lava|fragua|ceniza/.test(dest?.tema ?? '');
  const pal: 'sagrado' | 'animas' | 'infierno' | 'corona_fria' = dest?.tipo === 'pueblo' ? 'sagrado' : rb === 'bajar' || rb === 'guarida' || fuego ? 'infierno' : rb === 'subir' || rb === 'superficie' ? 'corona_fria' : dest?.tipo === 'mazmorra' ? 'animas' : 'corona_fria';
  const rgba = (a: number, k = 1) => `rgba(${Math.round(c[0] * k)},${Math.round(c[1] * k)},${Math.round(c[2] * k)},${Math.max(0, Math.min(1, a))})`;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 1;
  // la luz que se derrama en el piso
  const g = ctx.createRadialGradient(px, py, 3, px, py, 52); g.addColorStop(0, rgba(0.3 + pulso * 0.1)); g.addColorStop(0.5, rgba(0.1)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, 52, 26, 0, 0, Math.PI * 2); ctx.fill();
  // el sello: dos aros de trazos que giran al revés y ocho runas entre ellos
  ctx.lineWidth = 1.5;
  for (const [rx, giro, n, a] of [[34, t * 0.5, 14, 0.55], [24, -t * 0.8, 9, 0.4]] as [number, number, number, number][]) {
    ctx.strokeStyle = rgba(a + pulso * 0.2);
    // (los trazos de un aro no se tocan: van en un solo camino y un solo stroke, antes eran uno por trazo)
    if ((window as any).__sinLotes) { for (let i = 0; i < n; i++) { const a0 = giro + (i / n) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(px, py, rx, rx / 2, 0, a0, a0 + (Math.PI * 2 / n) * 0.62); ctx.stroke(); } }
    else { ctx.beginPath(); for (let i = 0; i < n; i++) { const a0 = giro + (i / n) * Math.PI * 2; ctx.moveTo(px + Math.cos(a0) * rx, py + Math.sin(a0) * rx / 2); ctx.ellipse(px, py, rx, rx / 2, 0, a0, a0 + (Math.PI * 2 / n) * 0.62); } ctx.stroke(); }
  }
  for (let i = 0; i < 8; i++) {
    const a = t * 0.5 + (i / 8) * Math.PI * 2, x = px + Math.cos(a) * 29, y = py + Math.sin(a) * 14.5, k = 0.45 + 0.4 * Math.sin(t * 3 + i * 1.7);
    ctx.fillStyle = rgba(k); ctx.fillRect(Math.round(x) - 1, Math.round(y) - 2, 2, 4); ctx.fillRect(Math.round(x) - 2, Math.round(y) - (i % 2 ? 2 : 0), 4, 1);
  }
  if (conArco) {
    // el portal: un óvalo de pie con un remolino adentro (brazos en espiral que se tragan la luz hacia el ojo) y chispas que
    // se desprenden del borde. Sin marco de piedra: el borde es energía viva que tiembla.
    const cy = py - 46, RX = 23, RY = 42, giro = t * 2.6 + sem;
    // resplandor de afuera
    const gh = ctx.createRadialGradient(px, cy, 8, px, cy, 70); gh.addColorStop(0, rgba(0.22 + pulso * 0.08)); gh.addColorStop(0.55, rgba(0.07)); gh.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = gh; ctx.beginPath(); ctx.ellipse(px, cy, 44, 70, 0, 0, Math.PI * 2); ctx.fill();
    // el fondo del óvalo: un pozo oscuro (tapa lo de atrás) y encima el remolino
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    const gf = ctx.createRadialGradient(px, cy, 0, px, cy, RY); gf.addColorStop(0, 'rgba(4,3,8,0.96)'); gf.addColorStop(0.7, `rgba(${c[0] >> 3},${c[1] >> 3},${c[2] >> 3},0.92)`); gf.addColorStop(1, `rgba(${c[0] >> 2},${c[1] >> 2},${c[2] >> 2},0.85)`);
    ctx.fillStyle = gf; ctx.beginPath(); ctx.ellipse(px, cy, RX, RY, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.save(); ctx.beginPath(); ctx.ellipse(px, cy, RX, RY, 0, 0, Math.PI * 2); ctx.clip();
    // brazos del remolino: espirales que giran, cada una hecha de tramos que se afinan y se apagan hacia el ojo
    for (let b = 0; b < 5; b++) {
      const a0 = giro + (b / 5) * Math.PI * 2, vel = 1 + (b % 2) * 0.35;
      for (let k = 0; k < 26; k++) {
        const f = k / 26, f2 = (k + 1) / 26, r1 = 1 - f * 0.94, r2 = 1 - f2 * 0.94;
        const a1 = a0 * vel + f * 5.4 + Math.sin(t * 1.7 + b + f * 4) * 0.18, a2 = a0 * vel + f2 * 5.4 + Math.sin(t * 1.7 + b + f2 * 4) * 0.18;
        ctx.strokeStyle = b % 2 ? `rgba(255,250,235,${0.5 * (1 - f) + 0.08})` : rgba(0.85 * (1 - f * 0.8)); ctx.lineWidth = Math.max(0.8, (b % 2 ? 2 : 3.4) * (1 - f * 0.75));
        ctx.beginPath(); ctx.moveTo(px + Math.cos(a1) * RX * r1, cy + Math.sin(a1) * RY * r1); ctx.lineTo(px + Math.cos(a2) * RX * r2, cy + Math.sin(a2) * RY * r2); ctx.stroke();
      }
    }
    // jirones que caen al ojo y el ojo mismo
    for (let i = 0; i < 14; i++) {
      const f = (t * (0.5 + (i % 4) * 0.13) + i * 0.071 + sem) % 1, a = giro * 1.4 + i * 2.39 + f * 4.2, r = 1 - f;
      ctx.fillStyle = i % 3 ? rgba(0.9 * Math.sin(f * Math.PI)) : `rgba(255,255,255,${0.9 * Math.sin(f * Math.PI)})`;
      ctx.fillRect(Math.round(px + Math.cos(a) * RX * r), Math.round(cy + Math.sin(a) * RY * r), i % 2 ? 2 : 1, i % 2 ? 2 : 1);
    }
    const go = ctx.createRadialGradient(px, cy, 0, px, cy, 9 + pulso * 3); go.addColorStop(0, 'rgba(255,255,255,0.95)'); go.addColorStop(0.4, rgba(0.7)); go.addColorStop(1, rgba(0));
    ctx.fillStyle = go; ctx.fillRect(px - 13, cy - 13, 26, 26);
    ctx.restore();
    // el borde: tres pasadas (halo, color, filo blanco) sobre un óvalo que tiembla
    for (const [w, col] of [[10, rgba(0.13 + pulso * 0.05)], [4.5, rgba(0.62 + pulso * 0.2)], [1.4, `rgba(255,250,235,${0.8 + pulso * 0.2})`]] as [number, string][]) {
      ctx.lineWidth = w; ctx.strokeStyle = col; ctx.beginPath();
      for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI * 2, d = 1 + 0.035 * Math.sin(a * 7 + t * 9 + sem) + 0.02 * Math.sin(a * 13 - t * 14); const x = px + Math.cos(a) * RX * d, y = cy + Math.sin(a) * RY * d; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.closePath(); ctx.stroke();
    }
    // rayitos que corren por el borde
    for (let i = 0; i < 3; i++) {
      const a = (t * (1.9 + i * 0.7) + i * 2.1 + sem) % (Math.PI * 2), l = 0.5 + 0.2 * Math.sin(t * 5 + i);
      ctx.strokeStyle = `rgba(255,255,255,${0.7 + 0.3 * Math.sin(t * 23 + i * 5)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, cy, RX, RY, 0, a, a + l); ctx.stroke();
    }
    // chispas que el borde escupe hacia afuera y caen
    const ch = (chispasPortal.get(sem) ?? chispasPortal.set(sem, []).get(sem)!);
    if (ch.length < 46) for (let n = 0; n < 2; n++) if (Math.random() < 0.85) {
      const a = Math.random() * Math.PI * 2, v = 28 + Math.random() * 60, tg = (Math.random() < 0.5 ? 1 : -1) * 34;
      ch.push({ x: Math.cos(a) * RX, y: Math.sin(a) * RY, vx: Math.cos(a) * v - Math.sin(a) * tg, vy: Math.sin(a) * v + Math.cos(a) * tg - 12, t: 0, d: 0.35 + Math.random() * 0.7 });
    }
    for (let i = ch.length - 1; i >= 0; i--) {
      const q = ch[i]; q.t += dt; if (q.t > q.d) { ch.splice(i, 1); continue; }
      q.vy += 130 * dt; q.vx *= 1 - 1.2 * dt; q.x += q.vx * dt; q.y += q.vy * dt;
      const k = 1 - q.t / q.d, X = Math.round(px + q.x), Y = Math.round(cy + q.y);
      ctx.fillStyle = k > 0.6 ? `rgba(255,255,255,${k})` : rgba(k * 1.3); ctx.fillRect(X, Y, k > 0.5 ? 2 : 1, k > 0.5 ? 2 : 1);
      // estela corta
      ctx.fillStyle = rgba(k * 0.45); ctx.fillRect(Math.round(X - q.vx * 0.03), Math.round(Y - q.vy * 0.03), 1, 1);
    }
    // el haz que sube por encima y el fuego vivo en el pie
    const gz = ctx.createLinearGradient(0, cy - RY - 60, 0, cy - RY + 6); gz.addColorStop(0, rgba(0)); gz.addColorStop(1, rgba(0.14 + pulso * 0.08));
    ctx.fillStyle = gz; ctx.fillRect(px - 4, cy - RY - 60, 8, 66);
    if (!(window as any).__sinFuego) llamaViva(ctx, pal, px, py + 3, 30, 22, dt, 0.75);
  }
  // motas en espiral y alguna chispa que salta
  for (let i = 0; i < 10; i++) {
    const f = (t * 0.4 + i / 10 + sem * 0.13) % 1, a = f * 7 + i * 2.4, r = (conArco ? 17 : 22) * (1 - f * 0.45), x = px + Math.cos(a) * r, y = py - 3 - f * (conArco ? 84 : 62) + Math.sin(a) * r * 0.25;
    ctx.fillStyle = i % 4 ? rgba(Math.sin(f * Math.PI) * 0.85) : `rgba(255,255,255,${Math.sin(f * Math.PI) * 0.9})`; ctx.fillRect(Math.round(x), Math.round(y), i % 3 ? 2 : 1, i % 3 ? 2 : 1);
  }
  ctx.restore();
}

/**
 * El rumbo en el aire: tres cheurones de pixel con canto oscuro que caen (bajar, guarida) o suben (subir, superficie)
 * sobre el umbral, para que de lejos se sepa si esa escalera baja o sube aunque el sprite quede en la sombra. Van después
 * de la luz, con los nombres: dentro del orden los tapaba la propia escalera.
 */
function cheuronesRumbo(px: number, py: number, conArco: boolean, c: [number, number, number], rb: Rumbo | undefined, t: number) {
  const baja = rb === 'bajar' || rb === 'guarida', sube = rb === 'subir' || rb === 'superficie';
  if (!(baja || sube) || (window as any).__sinRumbos) return;
  ctx.save();
  const y0 = py - (conArco ? 104 : 84);
  for (let i = 0; i < 3; i++) {
    const f = (t * 0.7 + i / 3) % 1, a = Math.sin(f * Math.PI), yy = Math.round(y0 + (baja ? f : 1 - f) * 18), d = baja ? 1 : -1;
    for (const [col, ex] of [['0,0,0', 1], [`${c[0]},${c[1]},${c[2]}`, 0]] as [string, number][]) {
      ctx.globalCompositeOperation = ex ? 'source-over' : 'lighter';
      ctx.fillStyle = `rgba(${col},${(ex ? 0.55 : 1) * a})`;
      for (let q = 0; q <= 5; q++) { const x1 = Math.round(px - 6 + q), x2 = Math.round(px + 6 - q), y1 = yy + d * q; ctx.fillRect(x1 - ex, y1 - ex, 2 + ex * 2, 2 + ex * 2); ctx.fillRect(x2 - 1 - ex, y1 - ex, 2 + ex * 2, 2 + ex * 2); }
    }
  }
  ctx.restore();
}
function dibujarRaw(raw: any[], x: number, y: number) {
  const q: Cuadro = { img: null, atlas: raw[0], x: raw[1], y: raw[2], w: raw[3], h: raw[4], ax: raw[5], ay: raw[6] };
  dibujar(ctx, q, x, y);
}
let heroeDibujo: { x: number; y: number } | null = null;
/** Lo que dice un jefe o un campeón al verte: encima de todo, en una placa oscura que se lee, dentro de la pantalla. */
const frasesPendientes: { txt: string; x: number; y: number; a: number }[] = [];
function frasesMonstruos() {
  // (las frases de los jefes de zona son de dos o tres renglones: se cortan a lo ancho de la placa, como mucho 3)
  ctx.save();
  for (const f of frasesPendientes) {
    const lin = envolver(f.txt, Math.min(W - 40, 400), 14, TITULO).slice(0, 3);
    ctx.font = `italic 14px ${TITULO}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lh = 18, w = Math.max(...lin.map((l) => ctx.measureText(l).width)) + 22, h = lin.length * lh + 4;
    const x = Math.round(Math.max(w / 2 + 6, Math.min(W - w / 2 - 6, f.x))), y = Math.round(Math.max(h / 2 + 6, f.y - (lin.length - 1) * lh / 2));
    ctx.globalAlpha = f.a * 0.86; ctx.fillStyle = '#0a0706'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.globalAlpha = f.a; ctx.strokeStyle = '#6a2a1a'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(x - w / 2) + 0.5, Math.round(y - h / 2) + 0.5, Math.round(w) - 1, h - 1);
    lin.forEach((l, i) => { const yy = y - (lin.length - 1) * lh / 2 + i * lh; ctx.fillStyle = '#000'; ctx.fillText(l, x + 1, yy + 1); ctx.fillStyle = '#ffb080'; ctx.fillText(l, x, yy); });
  }
  ctx.restore(); frasesPendientes.length = 0;
}
// Lo que es plano de verdad (anillos, ondas, charcos, círculos): va debajo de todo lo que está de pie. Si se pintara
// en su sitio del orden, la parte de atrás de un anillo grande quedaba encima del pie de las lápidas de más atrás.
const PISO_FX = /nova|onda|circulo|suelo|charco|glifo|anillo|grito|temblor|grieta|runas|aterrizaje|golpe_piso|curacion_area|estallido_mana|remolino|ondas|burbujas|toxico|sello_lacre/;
/** Lo que nace en el piso pero se levanta (manos, tentáculos, pilares, lo que surge, nubes): va de pie, en su sitio. */
const ALZADO_FX = /pilar|manos|tentaculos|surge|trueno|nube|columna|geiser|puas|espinas|raices|muro|cerco/;
/** ¿Este efecto se ordena con el mundo? Todos menos los partidos (ya van ordenados), el arco de cadena y los de pantalla entera. */
function enOrden(e: Efecto): boolean {
  if ((window as any).__efectosEncima || e.id === 'arco_cadena' || ((e as any).partido && !(window as any).__sinPartir)) return false;
  if (e.id.startsWith('pfx:')) { const d = efectoPfx(e.id.slice(4)); if (d?.capa === 'pantalla') return false; }
  return true;
}
/** La columna de luz del Coro de los sellos y del Ascenso del espíritu nace en el héroe: va detrás del cuerpo (encima lo
 * lavaba a blanco a pleno día y no se veía quién la pedía). */
function colDetras(j: Juego, e: Efecto): boolean { const hab = (e as any).hab; return poderesVivos() && (hab === 'coro_sellos' || hab === 'ascenso_espiritu') && Math.hypot(e.x - j.heroe.x, e.y - j.heroe.y) < 0.6; }
function esDePiso(e: Efecto): boolean {
  if (ALZADO_FX.test(e.id)) return false;
  if (e.id.startsWith('pfx:')) { const d = efectoPfx(e.id.slice(4)); return d?.capa === 'piso' || PISO_FX.test(e.id); }
  return PISO_FX.test(e.id);
}
/**
 * El arco del golpe. Visto en video, el golpe básico no se leía: el brazo subía y bajaba pero la hoja no dejaba nada y el
 * ojo no sabía por dónde había pasado. Acá se guarda dónde estuvo la hoja en cada cuadro del ataque (relativo al cuerpo)
 * y se pinta lo que barrió entre uno y otro como una cinta de luz que se apaga en un quinto de segundo, más un filo
 * claro en la hoja mientras baja. Del color del arma viva, o acero. Va para el héroe y para todo enemigo con arma.
 */
const estelas = new WeakMap<object, { s: [number, number, number, number, number][]; ult: string; atq: number }>();
function estelaArma(j: Juego, e: Ent, q: Cuadro, px: number, py: number, esc: number, tiempo: number) {
  const h = q.hoja!, melee = e.acc === 'atacar' && !(e as any).aDist && !(e.tipo === 'heroe' && j.heroe.c.distancia);
  let st = estelas.get(e);
  if (!melee) { if (st && st.s.length && tiempo - st.s[st.s.length - 1][4] > 0.25) st.s.length = 0; if (!st || !st.s.length) return; }
  if (!st) { st = { s: [], ult: '', atq: 0 }; estelas.set(e, st); }
  if (melee) {
    // puños y garras casi no tienen hoja: se les da un largo mínimo para que el golpe también deje su trazo
    let x0 = h[0] * esc, y0 = h[1] * esc, x1 = h[2] * esc, y1 = h[3] * esc; const l = Math.hypot(x1 - x0, y1 - y0);
    // (y como el puño no gira sino que sale recto, el trazo se arma del hombro al puño: una ráfaga corta hacia adelante)
    const puno = l < 9;
    if (puno) { const [vx, vy] = DIR_VEC[e.dir] ?? [0, 1], ux = (vx - vy) * 0.71, uy = (vx + vy) * 0.355, n = Math.hypot(ux, uy) || 1; x1 = x0 + (ux / n) * 6; y1 = y0 + (uy / n) * 6; x0 -= (ux / n) * 14; y0 -= (uy / n) * 14; }
    (st as any).puno = puno;
    const k = `${h[0]},${h[1]},${h[2]},${h[3]}`;
    if (e.t < 0.05 && st.atq !== Math.floor(tiempo * 4)) { st.s.length = 0; st.atq = Math.floor(tiempo * 4); }
    if (k !== st.ult) { st.ult = k; st.s.push([x0, y0, x1, y1, tiempo]); if (st.s.length > 7) st.s.shift(); }
  }
  // con arma viva el arco es de su materia: cuerpo del color del elemento, más espeso, y el filo de su color caliente
  const viva = e.tipo === 'heroe' && j.heroe.c.vivo ? estiloEstela(j.heroe.c.vivo) : null;
  const DUR = viva ? 0.24 : 0.2, rgb = viva?.cuerpo ?? (e.tipo === 'heroe' ? '235,240,255' : '255,214,190'), filo = viva?.filo ?? '255,255,255', kv = viva ? viva.k : 1;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  if ((st as any).puno) {
    // el golpe de puño: tres líneas de velocidad detrás del puño en el cuadro en que sale, y un destello chico en el nudillo
    for (let i = 1; i < st.s.length; i++) { const a = st.s[i - 1], b = st.s[i], edad = tiempo - b[4]; if (edad > 0.14) continue;
      const mov = Math.hypot(b[2] - a[2], b[3] - a[3]); if (mov < 3) continue; const al = (1 - edad / 0.14) * Math.min(1, mov / 8);
      const dx = b[2] - b[0], dy = b[3] - b[1], n = Math.hypot(dx, dy) || 1, nx = -dy / n, ny = dx / n;
      for (const o of [-3, 0, 3]) { const g = ctx.createLinearGradient(px + b[0], py + b[1], px + b[2], py + b[3]); g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(255,255,255,${(o ? 0.5 : 0.9) * al})`); ctx.strokeStyle = g; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(Math.round(px + b[0] + nx * o), Math.round(py + b[1] + ny * o)); ctx.lineTo(Math.round(px + b[2] + nx * o), Math.round(py + b[3] + ny * o)); ctx.stroke(); }
      ctx.fillStyle = `rgba(255,255,255,${al})`; ctx.fillRect(Math.round(px + b[2]) - 1, Math.round(py + b[3]) - 1, 3, 3); }
    ctx.restore(); return;
  }
  for (let i = 1; i < st.s.length; i++) {
    const a = st.s[i - 1], b = st.s[i], edad = tiempo - b[4]; if (edad > DUR) continue;
    // solo cuenta lo que de verdad barre: si la hoja casi no se movió entre cuadros, no hay arco
    const mov = Math.hypot(b[2] - a[2], b[3] - a[3]); if (mov < 5) continue;
    const al = (1 - edad / DUR) ** 1.5 * Math.min(1, mov / 16);
    // la hoja gira alrededor de la mano: el barrido se arma en gajos por ángulo (un arco curvo, no un triángulo plano),
    // más tenue hacia atrás y vivo en el filo de adelante
    const a0 = Math.atan2(a[3] - a[1], a[2] - a[0]), l0 = Math.hypot(a[2] - a[0], a[3] - a[1]), l1 = Math.hypot(b[2] - b[0], b[3] - b[1]);
    let da = Math.atan2(b[3] - b[1], b[2] - b[0]) - a0; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
    const N = Math.max(3, Math.min(9, Math.ceil(Math.abs(da) / 0.22)));
    const pt = (u: number, r: number): [number, number] => { const an = a0 + da * u, l = (l0 + (l1 - l0) * u) * r; return [px + a[0] + (b[0] - a[0]) * u + Math.cos(an) * l, py + a[1] + (b[1] - a[1]) * u + Math.sin(an) * l]; };
    for (let n = 0; n < N; n++) {
      const u0 = n / N, u1 = (n + 1) / N, k = al * (0.25 + 0.75 * u1 * u1);
      const [ax, ay] = pt(u0, 0.45), [bx, by] = pt(u0, 1), [cx, cy] = pt(u1, 1), [dx, dy] = pt(u1, 0.45);
      const g = ctx.createLinearGradient((ax + dx) / 2, (ay + dy) / 2, (bx + cx) / 2, (by + cy) / 2);
      g.addColorStop(0, `rgba(${rgb},0)`); if (viva) g.addColorStop(0.72, `rgba(${rgb},${0.26 * k * kv})`); g.addColorStop(1, `rgba(${viva ? viva.centro : rgb},${Math.min(1, 0.62 * k * kv)})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = `rgba(${filo},${Math.min(1, 0.8 * k * kv)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();
    }
  }
  ctx.restore();
}
/**
 * La luz que sale de un cofre al abrirse: nace en la boca cuando la tapa despega, crece con ella, echa un abanico de
 * rayos hacia arriba y se apaga dejando el resplandor del oro. Todo a puntos enteros y sumado como luz, sobre el cofre
 * del juego (que se abre con sus propios cuadros) y en su mismo lugar del orden de fondo.
 */
function luzCofre(px0: number, py0: number, t: number, k: number, col: string) {
  const px = Math.round(px0), py = Math.round(py0) - 12;
  const sube = Math.max(0, Math.min(1, (t - 0.18) / 0.3)), baja = Math.max(0, Math.min(1, (2.6 - t) / 1.5)), a = sube * baja; if (a <= 0) return;
  const golpe = Math.max(0, 1 - Math.abs(t - 0.5) / 0.28);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  // el resplandor en la boca
  { const r = (26 + golpe * 22) * k, g = ctx.createRadialGradient(px, py, 1, px, py, r); g.addColorStop(0, col + 'cc'); g.addColorStop(0.35, col + '55'); g.addColorStop(1, col + '00'); ctx.globalAlpha = a * (0.55 + golpe * 0.45); ctx.fillStyle = g; ctx.fillRect(px - r, py - r, r * 2, r * 2); }
  // el abanico de rayos: tiras de un punto que suben desde la boca, cada una con su largo y su parpadeo
  for (let i = 0; i < 9; i++) {
    const u = (i - 4) / 4, ang = -Math.PI / 2 + u * 0.62, par = 0.6 + 0.4 * Math.sin(t * 9 + i * 2.3), largo = (30 + (i % 3) * 12 + golpe * 26) * k * sube;
    const g = ctx.createLinearGradient(px, py, px + Math.cos(ang) * largo, py + Math.sin(ang) * largo); g.addColorStop(0, '#fff4d0'); g.addColorStop(0.3, col); g.addColorStop(1, col + '00');
    ctx.globalAlpha = a * par * 0.5; ctx.strokeStyle = g; ctx.lineWidth = i % 2 ? 1 : 2; ctx.beginPath(); ctx.moveTo(px + u * 7 * k, py); ctx.lineTo(Math.round(px + u * 7 * k + Math.cos(ang) * largo), Math.round(py + Math.sin(ang) * largo)); ctx.stroke();
  }
  // motas de oro que suben despacio
  ctx.fillStyle = '#fff0b8';
  for (let i = 0; i < 10; i++) { const v = (t * 0.55 + i * 0.137) % 1, x = px + Math.round(Math.sin(i * 7.1 + t * 1.3) * (6 + i * 1.4) * k), y = py - Math.round(v * 46 * k); ctx.globalAlpha = a * (1 - v) * 0.9; ctx.fillRect(x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2); }
  ctx.restore();
}
function dibujarEfecto(e: Efecto, _t: number) {
  if (e.id === 'arco_cadena' || sinHorneado(e)) return;
  // (el glifo horneado de la trampa armada: ahora la trampa misma late, render/presencias.ts)
  if (e.id === 'glifo_trampa' && presenciasVivas()) return;
  if (e.id === 'combustion') { if (poderesVivos()) { const [px, py] = aPant(e.x, e.y); dibujarCombustion(ctx, e, px, py); } else if (e.t >= 0.2) dibujarEfecto({ ...e, id: 'explosion_fuego', t: e.t - 0.2 } as Efecto, _t); return; }
  if (e.id.startsWith('pfx:')) { const [px, py] = aPant(e.x, e.y);
    // (un efecto cortado antes de su final se apaga en su último cuarto de segundo en vez de desaparecer de golpe)
    const corte = (e as any).corte ? Math.max(0, Math.min(1, ((e.dur ?? 9) - e.t) * 4)) : 1; if (corte < 1) ctx.globalAlpha = corte;
    // un efecto grande y opaco plantado encima del héroe (una nova de hielo, una polvareda) lo dejaba tapado medio
    // segundo: ese se pinta a media fuerza para que el cuerpo se siga leyendo. Los de luz ya bajan solos
    { const def = efectoPfx(e.id.slice(4)), hj = heroeDibujo; if (def && hj && def.mezcla !== 'aditiva' && def.mezcla !== 'sumar' && def.capa !== 'pantalla' && (def.caja[2] - def.caja[0]) * Math.min(2, def.escala * (e.escala ?? 1)) > 170 && Math.hypot(e.x - hj.x, e.y - hj.y) < 1.4) ctx.globalAlpha *= 0.6; }
    // (sexta pasada) la carga de rayo del Puño de dios va a media fuerza: su onda y sus rayos ya dicen el golpe
    if ((e as any).hab === 'puno_dios' && !(window as any).__blancoQuinta) ctx.globalAlpha *= 0.45;
    dibujarPfx(ctx, e.id.slice(4), e.t, px, py - (e.z ?? 0), { dir: e.dir, escala: e.escala }); ctx.globalAlpha = 1; return; }
  const meta = manifiesto().wm?.[e.id];
  const [px, py] = aPant(e.x, e.y);
  if (!meta) return;
  const dn = DIRS[(e.dir ?? 0) % 8];
  const fs = manifiesto().w?.[`${e.id}/${meta.dir ? dn : 's'}`]; if (!fs) return;
  let i = Math.floor((e.t * 25) / meta.t);
  if (meta.bucle) i %= fs.length; else if (i >= fs.length) return;
  const raw = fs[i];
  const q: Cuadro = { img: null, atlas: raw[0], x: raw[1], y: raw[2], w: raw[3], h: raw[4], ax: raw[5], ay: raw[6] };
  const k = e.dur && meta.bucle ? Math.min(1, (e.dur - e.t) * 3) : 1;
  // (tercera pasada) los horneados grandes de luz y rayo (columnas, castigos, relámpagos) van más tenues de día: en las
  // dunas las definitivas quemaban a blanco el centro de la pantalla
  const dia = (meta.elem === 'luz' || meta.elem === 'rayo') && (e.escala ?? 1) >= 1.2 && !(window as any).__fogonazoParejo ? 0.6 + 0.4 * nochePfx() : 1;
  ctx.globalAlpha = Math.max(0, k) * dia * alfaEf;
  dibujar(ctx, q, px, py - (e.z ?? 0), e.escala);
  ctx.globalAlpha = 1;
}
/**
 * Un relámpago en vivo de (ax, ay) a (bx, by): línea quebrada que cambia cada cuadro, con resplandor azul ancho, cuerpo
 * celeste y núcleo blanco, y dos ramas cortas que se abren. `k` 1 recién nacido, 0 apagado.
 */
function rayo(ax: number, ay: number, bx: number, by: number, k: number) {
  const dx = bx - ax, dy = by - ay, largo = Math.hypot(dx, dy) || 1, nx = -dy / largo, ny = dx / largo;
  const seg = Math.max(4, Math.round(largo / 13)), pts: [number, number][] = [[ax, ay]];
  for (let i = 1; i < seg; i++) { const t = i / seg, d = (R() - 0.5) * 22 * Math.sin(t * Math.PI); pts.push([ax + dx * t + nx * d, ay + dy * t + ny * d]); }
  pts.push([bx, by]);
  const traza = (ps: [number, number][]) => { ctx.beginPath(); ctx.moveTo(ps[0][0], ps[0][1]); for (let i = 1; i < ps.length; i++) ctx.lineTo(ps[i][0], ps[i][1]); ctx.stroke(); };
  const ramas: [number, number][][] = [];
  for (let r = 0; r < 2; r++) { const i = 1 + Math.floor(R() * (pts.length - 2)), [x0, y0] = pts[i], a = Math.atan2(dy, dx) + (R() - 0.5) * 1.6, l = 10 + R() * 16; ramas.push([[x0, y0], [x0 + Math.cos(a) * l * 0.5 + (R() - 0.5) * 6, y0 + Math.sin(a) * l * 0.5 + (R() - 0.5) * 6], [x0 + Math.cos(a) * l, y0 + Math.sin(a) * l]]); }
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const [w, c] of [[9, `rgba(70,120,255,${0.22 * k})`], [4, `rgba(150,190,255,${0.7 * k})`], [1.5, `rgba(255,255,255,${Math.min(1, k * 1.4)})`]] as [number, string][]) {
    ctx.lineWidth = w; ctx.strokeStyle = c; traza(pts);
    if (w < 9) { ctx.lineWidth = w * 0.6; for (const rm of ramas) traza(rm); }
  }
  // el destello donde nace y donde cae
  for (const [x, y, r] of [[ax, ay, 9], [bx, by, 13]] as [number, number, number][]) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(0.4, `rgba(150,190,255,${0.5 * k})`); g.addColorStop(1, 'rgba(70,120,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  ctx.restore();
}
const ambJefe: { k: number; m: { x: number; y: number; v: number; f: number; s: number }[] } = { k: 0, m: [] };
// Los objetos de la zona en cubetas de 8 x 8 casillas: el cuadro solo recorre las que tocan la pantalla (en el cementerio
// eran miles por cuadro) y los rasgos que salen del nombre se calculan una vez por objeto, no en cada cuadro.
const CUB = 8;
const cubetas = new WeakMap<object, { n: number; W: number; H: number; c: (typeof objsTipo)[] }>();
let objsTipo: any[] = [];
function objetosVisibles(z: Juego['zona']): any[] {
  let cb = cubetas.get(z);
  if (!cb || cb.n !== z.objetos.length) {
    const W2 = Math.ceil(z.W / CUB) + 1, H2 = Math.ceil(z.H / CUB) + 1, c: any[][] = Array.from({ length: W2 * H2 }, () => []);
    for (const o of z.objetos) { const bx = Math.max(0, Math.min(W2 - 1, Math.floor(o.cx / CUB))), by = Math.max(0, Math.min(H2 - 1, Math.floor(o.cy / CUB))); c[by * W2 + bx].push(o); }
    cb = { n: z.objetos.length, W: W2, H: H2, c }; cubetas.set(z, cb);
  }
  // las casillas que ve la pantalla (con margen: lo alto se ve desde lejos y lo que se mece se sale un poco)
  const esq = [aMundo(-260, -80), aMundo(W + 260, -80), aMundo(-260, H + 420), aMundo(W + 260, H + 420)];
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [x, y] of esq) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  const bx0 = Math.max(0, Math.floor(x0 / CUB) - 1), bx1 = Math.min(cb.W - 1, Math.floor(x1 / CUB) + 1), by0 = Math.max(0, Math.floor(y0 / CUB) - 1), by1 = Math.min(cb.H - 1, Math.floor(y1 / CUB) + 1);
  objsTipo.length = 0;
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) { const l = cb.c[by * cb.W + bx]; for (let i = 0; i < l.length; i++) objsTipo.push(l[i]); }
  return objsTipo;
}
const flagsCache = new WeakMap<object, { v: string; cuelga: boolean; meceMas: boolean; mece: boolean; blanda: boolean }>();
function flagsObj(o: { id: string; v: string }) {
  let f = flagsCache.get(o);
  if (!f || f.v !== o.v) { const idv = o.id + '|' + o.v, cuelga = CUELGA.test(idv), mece = MECE.test(o.id); f = { v: o.v, cuelga, mece, meceMas: !cuelga && !mece && MECE_MAS.test(idv), blanda: BLANDA.test(o.id) }; flagsCache.set(o, f); }
  return f;
}
/** Lo que el viento mece: árboles, matas, pasto, estandartes y toldos. Lo BLANDO además se aparta de quien lo pisa. */
const MECE = /^(arb_(roble|sauce|pino_alto|pino_bajo|abeto|cipres|palmera|arbol_selva|arbol_seco|arbusto|helecho|pasto_alto|flores|juncos)|[a-z0-9]+_estandarte|des2?_(palmera|arbusto)|des_toldo|nie2?_pino|sel2?_(arbol|palmera|helecho|planta|planta_hojas)|par_(juncos_orilla|pasto)|dec_planta|cem_flores_secas|cel_arbol_oro)$/;
// lo demás que también se mueve con el aire: telarañas, lianas, algas, matas y trapos de cualquier tema (el id o la variante lo dicen)
const MECE_MAS = /telar|liana|alga|helecho|pasto|hierba|junco|flor|cardo|planta|zarza|brote|trapo|vela_raida|cortina|mortaja|estandarte|bandera/;
// lo que cuelga se hamaca desde arriba: cadenas, jaulas, ahorcados, campanas y faroles colgantes
// (antes era /colg|ahorc|pendul|horca/ y agarraba estructuras plantadas en el piso: la horca, el árbol del ahorcado, la
// campana en su mástil, la jaula en su poste y hasta armas clavadas: se hamacaban desde arriba y la base se corría sobre el
// piso, Rick lo vio en el campamento, 19 nov 2026. Ahora solo lo que cuelga suelto, sin apoyo dibujado en el piso)
const CUELGA = /^(abi_cadena\|colgante|cri_telarana\|colgante|cat2_raices\|colgantes(_der)?)$/;
const BLANDA = /^(arb_(arbusto|helecho|pasto_alto|flores|juncos)|dec_planta|par_(juncos_orilla|pasto)|sel2?_(helecho|planta|planta_hojas)|des2?_arbusto|cem_flores_secas)$/;
function pajaro(x: number, y: number, t: number) {
  const a = Math.sin(t * 18) * 5;
  ctx.strokeStyle = '#0a0a0e'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 7, y - a); ctx.lineTo(x, y); ctx.lineTo(x + 7, y - a); ctx.stroke();
}

/** Cuánto se mezcla cada sprite sobre sí mismo en modo 'screen' (0 = como viene horneado). Levanta sombras y medios sin quemar los claros. */
// (13 nov: la luz de los personajes ahora sale bien desde el motor; queda un realce suave fuera del pueblo, donde la oscuridad de la zona los apaga)
const REALCE = { heroe: 0.4, aliado: 0.22, monstruo: 0.22 };
/** Si un objeto grande (12 casillas o más) se puede pisar por dentro en al menos un tercio de su huella. */
/**
 * Las franjas de lo largo: una por celda a lo largo del eje largo, de 16 puntos de ancho (la de cada punta llega al borde del
 * cuadro, con la sombra), con la profundidad de esa celda como si fuera una pieza de 1 de ancho (un pelo menos, para que lo
 * que está en la celda de delante gane el empate). Null si no va partido.
 */
function franjasDe(o: { cx: number; cy: number; hw: number; hh: number }, plano: unknown, q: Cuadro, prof: number, no: boolean): { a: number; b: number; prof: number }[] | null {
  const L = Math.max(o.hw, o.hh), C = Math.min(o.hw, o.hh);
  if (no || plano || L < 3 || C * 2 > L || prof < -1e5 || (window as any).__murosEnteros) return null;
  const enX = o.hw > o.hh, a0 = enX ? Math.round(o.cx - (o.hw - 1) / 2) : Math.round(o.cy - (o.hh - 1) / 2), out: { a: number; b: number; prof: number }[] = [];
  for (let k = 0; k < L; k++) {
    const c = enX ? q.ax + (a0 + k - o.cx) * 16 : q.ax + (o.cy - a0 - k) * 16;
    const izq = enX ? k === 0 : k === L - 1, der = enX ? k === L - 1 : k === 0;
    const a = izq ? 0 : Math.max(0, Math.round(c - 8)), b = der ? q.w : Math.min(q.w, Math.round(c + 8));
    if (b <= a) continue;
    out.push({ a, b, prof: (enX ? a0 + k + o.cy + (1 + o.hh) / 2 : o.cx + a0 + k + (o.hw + 1) / 2) - 1 - 0.1 });
  }
  return out.length > 1 ? out : null;
}
/** El destello de acero de una losa de púas armada: en cada vuelta de unos 2,6 s una punta de la cuadrícula de 4 x 4 se
 *  enciende y se apaga (una cruz de pixel con su centro blanco) y todas llevan un punto de brillo frío que respira. */
function brilloPuasViejo(c: CanvasRenderingContext2D, px: number, py: number, t: number, sem: number) {
  const X = Math.round(px), Y = Math.round(py), op = c.globalCompositeOperation;
  c.globalCompositeOperation = 'lighter';
  const resp = 0.16 + 0.1 * Math.sin(t * 1.7 + sem);
  for (let i = 0; i < 4; i++) for (let k = 0; k < 4; k++) {
    const u = -5.1 + i * 3.4, v = -5.1 + k * 3.4, sx = X + Math.round((u - v) * 1.1), sy = Y + Math.round((u + v) * 0.55) - 1;
    c.fillStyle = `rgba(170,190,215,${resp})`; c.fillRect(sx, sy, 1, 1);
  }
  const ciclo = (t + (sem % 97) * 0.13) / 2.6, f = ciclo - Math.floor(ciclo);
  if (f < 0.22) {
    const n = Math.floor(ciclo * 7 + sem) % 16, i = n % 4, k = Math.floor(n / 4), u = -5.1 + i * 3.4, v = -5.1 + k * 3.4;
    const sx = X + Math.round((u - v) * 1.1), sy = Y + Math.round((u + v) * 0.55) - 1, a = Math.sin((f / 0.22) * Math.PI);
    c.fillStyle = `rgba(200,220,255,${0.55 * a})`; c.fillRect(sx - 2, sy, 5, 1); c.fillRect(sx, sy - 2, 1, 5);
    c.fillStyle = `rgba(255,255,255,${0.9 * a})`; c.fillRect(sx, sy, 1, 1);
  }
  c.globalCompositeOperation = op;
}
function pisable(z: Juego['zona'], o: { cx: number; cy: number; hw: number; hh: number; _pis?: boolean }): boolean {
  if (o._pis !== undefined) return o._pis;
  let libres = 0, total = 0;
  if (o.hw * o.hh >= 12) for (let y = Math.floor(o.cy - (o.hh - 1) / 2); y <= o.cy + (o.hh - 1) / 2; y++) for (let x = Math.floor(o.cx - (o.hw - 1) / 2); x <= o.cx + (o.hw - 1) / 2; x++) { total++; if (x >= 0 && y >= 0 && x < z.W && y < z.H && !z.bloq[y * z.W + x]) libres++; }
  return (o._pis = total > 0 && libres / total > 0.33);
}
/**
 * Cuánto sube (px) el que va por el tablero de un puente: el arco del puente de la Forja (104 unidades de largo en unas
 * 6 casillas, 4 de alto en los estribos y 21 en la clave). Sin esto el héroe cruzaba a ras del agua, metido en la piedra.
 */
function sobrePuente(j: Juego, e: Ent): number {
  for (const p of j.zona.puentes ?? []) {
    if (Math.abs(e.y - p.cy) > 1.6 || Math.abs(e.x - p.cx) > 3.2) continue;
    const u = Math.min(1, Math.abs((e.x - p.cx) * 17.3) / 52);
    return (4 + 17 * Math.cos((u * Math.PI) / 2)) * 1.2;
  }
  return 0;
}
// (luz avanzada: lo que se pinta del héroe se marca para que la luz de atrás no lo hunda; ver luz_gpu.ts)
function dibujarEnt(j: Juego, e: Ent, tiempo: number) {
  // (pruebas: `__poseHeroe` = { acc, t, dur, dir, recorrido } pinta al héroe en esa pose sin tocar la lógica, ver t995_formas.cjs)
  const pose = e.tipo === 'heroe' ? (window as any).__poseHeroe : null; if (pose) e = Object.assign(Object.create(Object.getPrototypeOf(e)), e, pose);
  marcarHeroe(e.tipo === 'heroe'); try { dibujarEnt0(j, e, tiempo); } finally { marcarHeroe(false); } }
function dibujarEnt0(j: Juego, e: Ent, tiempo: number) {
  // reventado por exceso de daño: no queda cuerpo (los gibs de la Forja irán en su lugar)
  if (e.muerto && (e as any).reventado) return;
  let [px, py] = aPant(e.x, e.y);
  py -= sobrePuente(j, e);
  py -= (e as any).alto ?? 0; // en el aire durante un salto (maniobra de monstruo)
  // peso en el combate, solo en pantalla, a la medida de cada cuerpo (ver juego/sensacion.ts)
  if (!e.muerto) {
    const S = sensacionDe(e), [vx, vy] = DIR_VEC[e.dir] ?? [0, 0];
    const u = e.dur > 0 ? Math.min(1, e.t / e.dur) : 0, g = e.dur > 0 ? Math.max(0.05, Math.min(0.9, e.golpeEn / e.dur)) : 0.5;
    const lejos = !!(e as any).aDist || (e.tipo === 'heroe' && j.heroe.c.distancia) || e.acc === 'lanzar';
    let k = 0;
    if ((e.acc === 'atacar' || e.acc === 'lanzar') && e.dur > 0) {
      // cuerpo a cuerpo: se recoge antes de pegar y se va encima con el golpe. A distancia o lanzando: recula al soltar
      if (!lejos) k = (u < g * 0.55 ? -0.4 * Math.sin((u / (g * 0.55)) * Math.PI) : u < g ? Math.sin(((u - g * 0.55) / (g * 0.45)) * Math.PI / 2) : Math.max(0, 1 - (u - g) / Math.max(0.05, (1 - g) * 0.7))) * S.embestida;
      else if (u >= g) k = -S.retroceso * Math.max(0, 1 - (u - g) / Math.max(0.05, (1 - g) * 0.6)) ** 2;
    }
    // (el corrimiento del sprite entero hacía patinar los pies: la animación del motor ya lleva el paso, el peso y la
    // recogida del golpe con los pies plantados. Solo queda el retroceso al disparar, que es corto y del cuerpo entero)
    if (k && lejos) { px += (vx - vy) * 0.71 * k; py += (vx + vy) * 0.71 * k * 0.5; }
    const sc = e.sacud;
    if (sc) { const ed = j.t - sc.t; if (ed >= 0 && ed < 0.2) { const q = (1 - ed / 0.2) ** 2 * ((e as Monstruo).calidad >= 3 ? 2 : 4.5) * (sc.k ?? 1); px += (sc.dx - sc.dy) * 0.71 * q; py += (sc.dx + sc.dy) * 0.71 * q * 0.5; } }
  } else if (e.sacud?.lanz) {
    // el que murió de un golpe sale despedido: ya está donde cayó, pero se lo ve llegar desde donde estaba
    const sc = e.sacud, ed = j.t - sc.t;
    if (ed >= 0 && ed < 0.3) { const q = (1 - ed / 0.3) ** 2 * sc.lanz!; px -= (sc.dx - sc.dy) * 16 * q; py -= (sc.dx + sc.dy) * 8 * q; }
  }
  let fs: Cuadro[];
  let acc = e.acc;
  const m = e as Monstruo;
  // el druida transformado es la bestia: sus cuadros, su ritmo de patas y su tamaño (render/formas.ts)
  const vf = e.tipo === 'heroe' ? vistaForma(j, j.t) : null;
  formaVista = vf?.cuerpo ?? null;
  if (e.tipo === 'heroe' && formaVista) { acc = accForma(acc) as any; fs = cuadrosForma(formaVista, acc, e.dir, (e as any).rumbo); }
  else if (e.tipo === 'heroe') fs = framesHeroe(j, acc, e.dir);
  else if (e.tipo === 'npc') fs = cuadrosMonstruo(NPCS[(e as any).npc]?.sprite ?? (e as any).npc, 'quieto', e.dir);
  else {
    // el monstruo se dibuja con su estado visible (con tiempo mínimo entre quieto y caminar)
    const av = (m as any).accVis; if (av && (av === 'quieto' || av === 'caminar' || av === 'correr') && (acc === 'quieto' || acc === 'caminar' || acc === 'correr')) acc = av;
    if ((m as any).surgiendo > 0) acc = 'morir';
    if (acc === 'lanzar' && m.def.sprite.startsWith('jefe_') && ((m as any).fase ?? 0) >= 1) acc = 'especial' as any;
    fs = framesMonstruo(m.def.sprite, acc, e.dir);
    // caminando: el rumbo real en 16, si la Forja lo horneó para este cuerpo (los ocho intermedios van como 'r22.5'...)
    if ((acc === 'caminar' || acc === 'correr') && !(window as any).__sinFino) {
      const ru = (e as any).rumbo as number | undefined;
      if (ru !== undefined) {
        const g = ((ru * 180) / Math.PI + 360) % 360, k = Math.round(g / 22.5) % 16, D8 = ['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'];
        if (Math.abs(((k * 22.5 - D8.indexOf(e.dir) * 45 + 540) % 360) - 180) <= 34) {
          const df = k % 2 ? 'r' + k * 22.5 : D8[k / 2];
          let ff = cuadrosMonstruo(m.def.sprite, acc, df); if (!ff.length && acc === 'correr') ff = cuadrosMonstruo(m.def.sprite, 'caminar', df);
          if (ff.length) fs = ff;
        }
      }
    }
  }
  if (!fs.length) return;
  let i: number;
  if ((e.tipo === 'monstruo' || e.tipo === 'invocado') && (m as any).surgiendo > 0) { const T = (m as any).surgeT ?? 1.2; i = Math.max(0, fs.length - 1 - Math.floor(((T - (m as any).surgiendo) / T) * 1.05 * fs.length)); }
  else if ((e as any).estado === 'surgir') return;
  else i = fr(acc, e.muerto && (e as any).mElem === 'frio' ? Math.max(0, e.t - 0.45) : e.muerto && (e as any).mElem === 'rayo' ? Math.max(0, e.t - 0.55) : e.t, e.dur, e, acc === 'correr' && e.tipo !== 'heroe' && !cuadrosMonstruo(m.def.sprite, 'correr', e.dir).length ? 'caminar' : acc, fs.length);
  if (e.tipo === 'monstruo' && m.estado === 'surgir') return;
  if (e.tipo === 'heroe') pisadaHeroe.bestia = formaVista ?? '';
  if (e.tipo === 'heroe' && !formaVista) { const P = pisadaHeroe; P.acc = acc; P.dir = e.dir; P.i = i; P.n = fs.length; P.resto = 0; P.esc = e.escala ?? 1; const ru = (e as any).rumbo as number | undefined, [ux, uy] = ru !== undefined ? [Math.cos(ru), Math.sin(ru)] : DIR_VEC[e.dir] ?? [0, 0], ul = Math.hypot(ux, uy) || 1; P.vx = ux / ul; P.vy = uy / ul; P.listo = true; }
  // los pies clavados: un cuadro de paso vale para un punto exacto del recorrido, pero se muestra mientras el cuerpo sigue
  // avanzando (hasta 6 píxeles) y el pie apoyado se corría con él, para volver de un salto en el cuadro siguiente. El
  // cuerpo se dibuja donde corresponde al cuadro que se ve (a lo sumo media zancada de cuadro atrás o adelante de donde
  // está): el pie no se mueve del piso y el cuerpo avanza al ritmo de su animación.
  if (!e.muerto && (acc === 'caminar' || acc === 'correr') && !(window as any).__sinClavo && e.tipo !== 'npc') {
    const esH = e.tipo === 'heroe', zp = zancadaDe(e, acc === 'correr' && !esH && !cuadrosMonstruo(m.def.sprite, 'correr', e.dir).length ? 'caminar' : acc) / fs.length;
    if (zp > 0.02 && zp < 0.8) {
      const resto = ((e.recorrido ?? 0) % zp) - zp / 2, ru = (e as any).rumbo as number | undefined, [vx, vy] = ru !== undefined ? [Math.cos(ru), Math.sin(ru)] : DIR_VEC[e.dir] ?? [0, 0];
      // (los monstruos tienen 8 cuadros por ciclo: clavados del todo avanzaban a tirones; van a medias)
      const kc = esH ? 1 : 0.5; px -= (vx - vy) * 16 * resto * kc; py -= (vx + vy) * 8 * resto * kc;
      if (esH) pisadaHeroe.resto = resto;
    }
  }
  const q = fs[Math.min(fs.length - 1, i)];
  const esc = vf && vf.cuerpo ? ESC_FORMA[vf.cuerpo] * vf.k : vf && vf.u < 1 ? (e.escala ?? 1) * vf.k : e.escala;

  if (!e.muerto) sombras(ctx, e, q, px, py, esc);
  // los aliados llevan un aro en los pies (Thor dorado, invocados verdes): de noche un lobo enemigo se confundía con Thor
  if (!e.muerto && (e as any).dueno) {
    // (el collar de Thor se ve: el aro toma el color de su rareza y una gema le brilla al cuello)
    const thor = (e as any).invocaId === 'thor', col = thor ? (j.heroe.d as any).thor?.collar : null, cCol = !col ? null : col.rareza === 'legendario' ? '255,140,40' : col.rareza === 'unico' ? '230,190,90' : col.rareza === 'raro' ? '255,240,110' : '110,170,255';
    const c = thor ? cCol ?? '255,205,120' : aroInvocado(e) ?? '120,225,150', rr = 13 * Math.max(0.8, esc), kk = 0.5 + 0.2 * Math.sin(tiempo * 3 + e.x);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const ga = ctx.createRadialGradient(px, py, rr * 0.3, px, py, rr); ga.addColorStop(0, `rgba(${c},0)`); ga.addColorStop(0.75, `rgba(${c},${0.22 * kk})`); ga.addColorStop(1, `rgba(${c},0)`);
    ctx.fillStyle = ga; ctx.beginPath(); ctx.ellipse(px, py, rr, rr / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(${c},${0.55 * kk})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px, py, rr * 0.82, rr * 0.41, 0, 0, Math.PI * 2); ctx.stroke();
    if (cCol) { (e as any).gemaCollar = cCol; ctx.strokeStyle = `rgba(${cCol},${0.5 * kk})`; ctx.beginPath(); ctx.ellipse(px, py, rr * 1.0, rr * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); } else (e as any).gemaCollar = null;
    ctx.restore();
  }
  // la mitad de atrás del aura va antes del cuerpo
  if (e.tipo === 'heroe' && !e.muerto) { auraHeroe(j, px, py, tiempo, true); torbellinoAro(ctx, j, px, py, tiempo, true); }
  // la llama del arma viva va detrás del cuerpo (el filo encendido va encima, después)
  if (e.tipo === 'heroe' && !e.muerto && q.hoja && j.heroe.c.vivo && !(window as any).__sinDerrame) { const [ox, oy] = aPant(0, 0); llamaArmaAtras(ctx, e, q, px, py, esc, j.heroe.c.vivo as ElemArma, j.heroe.c.tipoArma, tiempo, dtCuadro, ox, oy); }
  let ok: boolean;
  // estados de pixelfx: el primero tiñe el cuerpo, todos van en bucle encima
  const ests = e.muerto ? [] : estadosPfx(e as any);
  // los buffs y el aura del héroe se ven mientras duran: el efecto de lanzador de su habilidad, si es de bucle
  if (e.tipo === 'heroe' && !e.muerto) {
    const hh = j.heroe;
    // (las mejoras y auras que dibuja render/presencias.ts llevan su canto, sus motas y su sello: el bucle horneado encima
    // las tapaba con una burbuja grande del color de otra cosa)
    for (const id of [...Object.keys(hh.buffs), hh.d.aura ?? '']) { const lz = id && !tieneEstilo(id) && usosPfx.hab.get(id)?.lanzador; if (lz && efectoPfx(lz)?.bucle && !ests.includes(lz) && ests.length < 4) ests.push(lz); }
  }
  const tinteEst = ests.map((id) => efectoPfx(id)?.cuerpo?.tinte).find(Boolean);
  // el rayo sacude su propia silueta (render/electro.ts)
  const fEl = e.muerto || (window as any).__sinElectro ? 0 : fuerzaElectro(e, j.t), tinEl = tinteElectro(e.id, fEl, j.t);
  const pm = (e as any).pfxMuerte as { id: string; t0: number } | undefined;
  const alfaM = (e.muerto && pm ? alfaCuerpo(pm.id, j.t - pm.t0) : 1) * (e.tipo === 'invocado' ? alfaInvocado(e, j.t) : 1) * ((e as any).alfaCine ?? 1);
  if (alfaM <= 0.01) return;
  // el muerto que revienta (Estallido fúnebre, Cosecha del osario, Lamento) se hincha y deja de estar al reventar; el que
  // se come el Festín de tumba se seca y se hunde (solo lo que se ve, `revienta` lo pone mundo.ts)
  const rv = e.muerto && poderesVivos() ? ((e as any).revienta as number | undefined) : undefined;
  if (rv !== undefined && j.t >= rv) return;
  const consume = !!(e as any).consume, fv0 = !!(window as any).__festinViejo, hin = rv !== undefined ? Math.max(0, Math.min(1, 1 - (rv - j.t) / (consume ? (fv0 ? 0.32 : 0.65) : 0.18))) : 0;
  // el enemigo que queda delante del héroe y lo tapa se vuelve medio transparente: antes no veías tu propio golpe
  let tapa = 1;
  if (e.tipo === 'monstruo' && !e.muerto && !(e as any).dueno && heroeDibujo && e.x + e.y > heroeDibujo.x + heroeDibujo.y) {
    const [hx, hy] = aPant(heroeDibujo.x, heroeDibujo.y), dx = Math.abs(px - hx);
    if (dx < 34 && py - hy < 62 && py - hy > -6) tapa = 0.4 + 0.6 * Math.min(1, dx / 34) ** 2;
  }
  // el canto del cuerpo con una mejora puesta: la silueta de su color corrida un punto a cada lado, detrás del cuerpo
  if (e.tipo === 'heroe' && !e.muerto) { const rim = rimHeroe(j); if (rim && rim[1] > 0.03) { const sl = siluetaCuadro(q, `rgb(${rim[0][0]},${rim[0][1]},${rim[0][2]})`);
    if (sl) { ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = rim[1]; const x0 = px - q.ax * esc, y0 = py - q.ay * esc, w = q.w * esc, h2 = q.h * esc;
      for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) ctx.drawImage(sl, 0, 0, q.w, q.h, x0 + dx, y0 + dy, w, h2); ctx.restore(); } } }
  if (alfaM * tapa < 1) ctx.globalAlpha = alfaM * tapa;
  if (!e.muerto) { const cg = (e as any).congelado > 0; const preso = (e as any).preso as string | undefined;
    // (lo que lo sujeta no siempre es hielo: las raíces del druida y la jaula de hueso inmovilizan igual, pero se ven como lo que son)
    if (cg && !congelados.has(e)) { if (preso === 'raices') j.efectos.push({ id: 'pfx:fx_raices_atrapan', x: e.x, y: e.y, t: 0, dir: 0, escala: Math.max(0.6, Math.min(1.6, (q.ay * esc) / 75)), z: 0, dur: Math.max(1, (e as any).congelado) } as Efecto); else if (!preso) j.efectos.push({ id: 'pfx:fx_congelar', x: e.x, y: e.y, t: 0, dir: 0, escala: Math.max(0.6, Math.min(3, (q.ay * esc) / 75)), z: 0, dur: 3.8 } as Efecto); }
    if (cg) congelados.add(e); else { congelados.delete(e); if (preso) (e as any).preso = undefined; } }
  if (!e.muerto && e.tipo === 'monstruo' && (m.fase ?? 0) >= 1 && (m.def.jefe || m.calidad >= 2) && m.def.sprite !== 'jefe_ozmaren') { ctx.save(); ctx.globalAlpha = 0.22 + 0.2 * Math.sin(tiempo * 6); for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) dibujarTenido(ctx, q, px + ox, py + oy, '#ff2a14', 1, esc); ctx.restore(); }
  // Ozmaren sobre su lava: un borde rojo brillante en la silueta (detrás del cuerpo) para que se despegue del piso
  if (!e.muerto && e.tipo === 'monstruo' && m.def.sprite === 'jefe_ozmaren') { ctx.save(); ctx.globalAlpha = 0.5; for (const [ox, oy] of [[-2, 0], [2, 0], [0, -2], [0, 2]]) dibujarTenido(ctx, q, px + ox, py + oy, '#ff5a20', 1, esc); ctx.restore(); }
  // la muerte por elemento se ve en el cuerpo: carbonizado, hecho hielo, sacudido por el rayo (blanco y negro, como una
  // radiografía), derretido en verde, negro de sombra o blanco de luz
  const mE = e.muerto ? ((e as any).mElem as string | undefined) : undefined, tm = e.tMuerto;
  let tinM: [string, number] | null = null, escY = 1;
  let brM: [string, number] | null = null, alM = 1;
  if (mE === 'fuego') { tinM = ['#1a0f08', Math.min(0.82, tm / 1.1)]; brM = ['#ff6a18', 0.42 * Math.max(0, 1 - tm / 3.2) * (0.6 + 0.4 * Math.sin(tiempo * 17 + e.id))]; }
  else if (mE === 'frio') tinM = tm < 0.45 ? ['#dcf6ff', 0.78] : ['#9fd8ff', Math.max(0.45, 0.78 - (tm - 0.45) * 0.3)];
  else if (mE === 'rayo') { if (tm < 0.55) { const f = Math.floor(tm * 24) % 2; tinM = [f ? '#ffffff' : '#080812', 0.94]; px += f ? 2 : -2; } else tinM = ['#1a1612', Math.min(0.6, 0.3 + (tm - 0.55))]; }
  else if (mE === 'veneno') { tinM = ['#3f9a1c', Math.min(0.62, tm / 0.8)]; escY = 1 - 0.42 * Math.min(1, tm / 1.6); }
  else if (mE === 'sombra') { tinM = ['#12061e', Math.min(0.9, tm / 0.35)]; brM = ['#8a3cff', 0.4 * Math.max(0, 1 - tm / 1.6)]; alM = Math.max(0.4, 1 - Math.max(0, tm - 0.4) * 0.5); }
  else if (mE === 'luz') { tinM = ['#fff2c8', tm < 0.5 ? 0.85 : Math.max(0.3, 0.85 - (tm - 0.5) * 0.5)]; brM = ['#ffe9a0', 0.6 * Math.max(0, 1 - tm / 1.5)]; alM = Math.max(0.35, 1 - Math.max(0, tm - 0.5) * 0.55); }
  if (mE === 'frio') brM = ['#bfe8ff', 0.22 * Math.max(0, 1 - tm / 4)];
  if (mE === 'rayo' && tm >= 0.55) brM = ['#9ab8ff', 0.3 * Math.max(0, 1 - (tm - 0.55) / 0.8)];
  // (quinta pasada: el Festín se lo bebe de verdad, 0,65 s: late rojo por las venas mientras le sacan la sangre, se pone
  // gris ceniza, se aplasta y se ensancha a tirones, y lo último que queda es una cáscara chata)
  if (hin > 0 && consume && !fv0) { const late = 0.5 + 0.5 * Math.sin(tiempo * 38); tinM = hin < 0.55 ? ['#3a0606', 0.25 + 0.5 * hin] : ['#2e2a24', 0.5 + 0.35 * (hin - 0.55) / 0.45]; brM = ['#ff2a1a', 0.35 * (1 - hin) * late];
    alM = 1 - 0.25 * Math.max(0, hin - 0.7) / 0.3; px += Math.round(Math.sin(tiempo * 55 + e.id) * (hin < 0.8 ? 1.2 : 0.4));
    const esY = 1 - 0.62 * (hin ** 0.8) - 0.04 * late * (1 - hin), esX = 1 + 0.2 * hin;
    ctx.save(); if (!(window as any).__sinHincha) { ctx.translate(px, py); ctx.scale(esX, esY); ctx.translate(-px, -py); } }
  else if (hin > 0) { tinM = consume ? ['#1e0606', 0.3 + 0.45 * hin] : ['#8a1010', (0.12 + 0.3 * hin) * (0.6 + 0.4 * Math.sin(tiempo * 45))]; brM = consume ? ['#ff2a1a', 0.2 * (1 - hin)] : ['#ff5a2a', 0.28 * hin * hin * (0.6 + 0.4 * Math.sin(tiempo * 45))];
    alM = consume ? 1 - 0.55 * hin : 1; px += Math.round(Math.sin(tiempo * 70 + e.id) * hin * (consume ? 0.6 : 1.6));
    ctx.save(); if (!(window as any).__sinHincha) { ctx.translate(px, py); ctx.scale(consume ? 1 + 0.12 * hin : 1 + 0.3 * hin * hin, consume ? 1 - 0.5 * hin : 1 + 0.22 * hin * hin); ctx.translate(-px, -py); } }
  if (escY !== 1) { ctx.save(); ctx.translate(px, py); ctx.scale(1 + (1 - escY) * 0.35, escY); ctx.translate(-px, -py); }
  const cambio = e.tipo === 'heroe' ? performance.now() / 1000 - cambioVisible : 9;
  // nunca una silueta en lugar del sprite: el brillo de equipo nuevo es un velo de 25 % que se apaga, y el destello del
  // golpe un blanco de 30 % como mucho en los primeros 70 ms (destello arranca en 0.12 s), para todos los monstruos
  // (el cambio de forma: la silueta se enciende de verde musgo y se apaga en el cuerpo nuevo)
  if (vf && vf.tinte > 0.02) { ok = dibujarTenido(ctx, q, px, py, '#7ac850', vf.tinte, esc);
    if (ok && vf.brillo > 0.02) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = vf.brillo * nocheLuz(); dibujarTenido(ctx, q, px, py, '#a8f070', 1, esc); ctx.restore(); } }
  else if (cambio >= 0 && cambio < 0.45) ok = dibujarTenido(ctx, q, px, py, '#fff2d0', 0.25 * (1 - cambio / 0.45), esc);
  else if (e.destello > 0.05) ok = dibujarTenido(ctx, q, px, py, '#ffffff', 0.3 * Math.min(1, (e.destello - 0.05) / 0.07), esc);
  // los estados tiñen sin tapar el sprite: como mucho 40 % (salvo petrificado, que es piedra)
  else if (tinM) { if (alM < 1) ctx.globalAlpha = alM; ok = dibujarTenido(ctx, q, px, py, tinM[0], tinM[1], esc); ctx.globalAlpha = 1;
    if (brM && brM[1] > 0.01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = brM[1]; dibujarTenido(ctx, q, px, py, brM[0], 1, esc); ctx.restore(); } }
  else if (tinEl) ok = dibujarTenido(ctx, q, px, py, tinEl[0], tinEl[1], esc);
  else if (tinteEst) ok = dibujarTenido(ctx, q, px, py, tinteEst.color, Math.min(tinteEst.fuerza >= 0.8 ? tinteEst.fuerza : 0.4, tinteEst.fuerza) * (e.frio > 0 && !(e.congelado > 0) ? 0.6 : 1), esc);
  else if (e.tinte) ok = dibujarTenido(ctx, q, px, py, e.tinte, e.tipo === 'invocado' ? 0.35 : e.tipo === 'heroe' ? 0.22 : 0.3, esc);
  else if (e.muerto && e.tMuerto > 60) { ctx.globalAlpha = Math.max(0.25, 1 - (e.tMuerto - 60) / 400); ok = dibujar(ctx, q, px, py, esc); ctx.globalAlpha = 1; }
  else ok = dibujar(ctx, q, px, py, esc);
  if (escY !== 1) ctx.restore();
  if (hin > 0) ctx.restore();
  // realce del personaje: el sprite viene pintado en clave baja y encima cae la oscuridad de la zona, así que el cuerpo
  // quedaba como una mancha parda al lado de un piso bien iluminado. Se suma el sprite sobre sí mismo (en su lugar del
  // orden de dibujo: lo que lo tapa lo sigue tapando): sube la luz y el contraste, los cantos de metal saltan y lo oscuro
  // sigue oscuro. El héroe más que los demás: es el que se mira todo el tiempo
  if (ok && !e.muerto && alfaM >= 1 && !(window as any).__sinRealce) {
    // junto a un fuego el realce baja: el cuerpo queda en clave baja y lo dibuja el filo de luz (ver reflejos)
    const k = ((window as any).__realce ?? (e.tipo === 'heroe' ? REALCE.heroe : (e as any).dueno || e.tipo === 'npc' ? REALCE.aliado : REALCE.monstruo)) * (1 - 0.55 * luzFuerte(e, px, py));
    // (en el pueblo hay luz de sobra: nada)
    if (k > 0) { ctx.save(); ctx.globalCompositeOperation = (window as any).__realceModo ?? 'screen'; ctx.globalAlpha = k * tapa * (j.zona.tipo === 'pueblo' ? 0 : 1); dibujar(ctx, q, px, py, esc); ctx.restore(); }
  }
  if (alfaM * tapa < 1) ctx.globalAlpha = 1;
  if (ok && !e.muerto && !(window as any).__sinReflejos) reflejos(ctx, e, q, px, py, esc);
  if (ok && fEl > 0) dibujarElectro(ctx, e.id, q, px, py, esc, fEl, j.t);
  if (ok && ests.length && !(window as any).__estadosViejos) {
    // el frío y el veneno se dibujan sobre la silueta de verdad (render/electro.ts); lo de encima de la cabeza, a su cabeza
    const k = Math.max(0.6, Math.min(3, (q.ay * esc) / 75)), cab = cabezaDe(q, py, esc) ?? undefined, marca = usosPfx.estado.get('marca') ?? 'fx_presa_marcada';
    for (const id of ests) {
      if (id === 'fx_congelado') { dibujarEscarcha(ctx, e.id, q, px, py, esc, tiempo, e.congelado > 0); continue; }
      if (id === 'fx_envenenado') { dibujarVeneno(ctx, e.id, q, px, py, esc, tiempo); continue; }
      if (id === marca && poderesVivos()) { dibujarMarcaPresa(ctx, e.id, px, cab ?? py - q.ay * esc * 0.9, tiempo); continue; }
      if (id === 'fx_aturdido' && poderesVivos()) { dibujarAturdido(ctx, e.id, px, cab ?? py - q.ay * esc * 0.9, k, tiempo); continue; }
      dibujarPfx(ctx, id, tiempo + (e.id % 7) * 0.31, px, py, { escala: k, cabeza: ENCIMA.test(id) || id === marca ? cab : undefined });
    }
  } else if (ok && ests.length) { const k = Math.max(0.6, Math.min(3, (q.ay * esc) / 75)); for (const id of ests) dibujarPfx(ctx, id, tiempo + (e.id % 7) * 0.31, px, py, { escala: k }); }
  if (ok && !e.muerto && !(window as any).__sinFuego && e.tipo === 'monstruo' && m.def.sprite === 'jefe_ozmaren') {
    const furia = Math.min(1, (m.fase ?? 0) * 0.6 + (m.acc === 'lanzar' || (m.acc as string) === 'especial' ? 0.6 : 0));
    ozmarenArde(ctx, m, q, px, py, esc, dtCuadro, furia); calorOzmaren(ctx, q, px, py, esc, tiempo, furia);
  } else if (ok && !(window as any).__sinFuego && (e.tipo === 'monstruo' || e.tipo === 'heroe')) cuerpoArde(ctx, j, e, q, px, py, esc, dtCuadro);
  // la gema del collar de Thor: un rombo que late a la altura del cuello, del color de la rareza del collar
  if (!e.muerto && (e as any).gemaCollar) {
    const cg = (e as any).gemaCollar as string, gx = Math.round(px), gy = Math.round(py - q.ay * esc * 0.58), lat = 0.7 + 0.3 * Math.sin(tiempo * 5);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createRadialGradient(gx, gy, 0, gx, gy, 9); hg.addColorStop(0, `rgba(${cg},${0.55 * lat})`); hg.addColorStop(1, `rgba(${cg},0)`); ctx.fillStyle = hg; ctx.fillRect(gx - 9, gy - 9, 18, 18);
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = `rgb(${cg})`; ctx.beginPath(); ctx.moveTo(gx, gy - 3); ctx.lineTo(gx + 3, gy); ctx.lineTo(gx, gy + 3); ctx.lineTo(gx - 3, gy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(gx - 1, gy - 1, 1, 1); ctx.restore();
  }
  // únicos y jefes: aura
  if (!e.muerto && e.tipo === 'monstruo' && m.calidad >= 2) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.18 + Math.sin(tiempo * 4) * 0.06;
    const g = ctx.createRadialGradient(px, py - 30 * esc, 4, px, py - 30 * esc, 46 * esc); g.addColorStop(0, m.calidad >= 3 ? '#ff4010' : '#c08020'); g.addColorStop(1, '#00000000');
    ctx.fillStyle = g; ctx.fillRect(px - 50 * esc, py - 80 * esc, 100 * esc, 100 * esc); ctx.restore();
  }
  // el arco del arma: lo que barre la hoja entre un cuadro y el siguiente queda dibujado un instante
  // el héroe con un golpe cuerpo a cuerpo: la media luna ancha del tajo (render/tajos.ts); si no, la estela fina de siempre
  // (se dibuja después, delante de los enemigos pegados: va como su propio paso en el orden, `tajoPend`)
  const tajo = ok && !e.muerto && e.tipo === 'heroe' && tajoAplica(j);
  if (tajo) tajoPend = [e, q, px, py, esc, tiempo];
  if (ok && !e.muerto && q.hoja && !tajo && !(window as any).__sinEstela) estelaArma(j, e, q, px, py, esc, tiempo);
  // el arma viva: el filo encendido, la forma de su elemento pegada a la hoja, lo que suelta en el vuelo y el orbe de los
  // cetros. Las únicas y legendarias sin elemento llevan el brillo que recorre el filo
  if (ok && e.tipo === 'heroe' && !e.muerto && q.hoja && !(window as any).__sinDerrame) {
    const ar = j.heroe.d.equipo.arma as any, el = (j.heroe.c.vivo ?? (ar && (ar.rareza === 'unico' || ar.rareza === 'legendario') ? 'acero' : null)) as ElemArma | null;
    if (el && el !== ('fisico' as any)) { const [ox, oy] = aPant(0, 0); armaViva(ctx, e as any, q, px, py, esc, el, j.heroe.c.tipoArma, tiempo, dtCuadro, ox, oy, 1, true); }
  }
  // (prueba: la hoja en magenta y el tramo vivo en verde, con lo tapado más oscuro)
  if (ok && q.hoja && (window as any).__verHoja && e.tipo === 'heroe') { const h = q.hoja as number[]; ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = '#ff00ff'; ctx.fillRect(px + h[0], py + h[1], 1, 1); ctx.fillRect(px + h[2], py + h[3], 1, 1);
    if (h.length >= 9) for (let i = 0; i <= 12; i++) { const u = i / 12, s2 = Math.min(5, Math.floor(u * 6)); ctx.fillStyle = (h[4] >> s2) & 1 ? '#00ff00' : '#006000'; ctx.fillRect(Math.round(px + h[5] + (h[7] - h[5]) * u), Math.round(py + h[6] + (h[8] - h[6]) * u), 1, 1); } ctx.restore(); }
  // los enemigos con arma de elemento (encantados, campeones, únicos y jefes con arma en la mano) la llevan viva también,
  // más contenida y sin luz propia, y como mucho seis a la vez
  if (ok && e.tipo === 'monstruo' && !e.muerto && !(e as any).dueno && q.hoja && !(window as any).__sinVivaMonstruos && vivasMonstruo < (E.tactil ? 3 : 6) && Math.hypot((q.hoja[2] - q.hoja[0]) * esc, (q.hoja[3] - q.hoja[1]) * esc) >= 10) {
    const el = elemMonstruo(m);
    if (el) { vivasMonstruo++; const [ox, oy] = aPant(0, 0); armaViva(ctx, e as any, q, px, py, esc, el, '', tiempo, dtCuadro, ox, oy, 0.6, false, mascaraMonstruo(q, px, py, esc, e.dir)); }
  }
  // aura del héroe: la mitad de adelante, encima del cuerpo
  if (e.tipo === 'heroe' && !e.muerto) { auraHeroe(j, px, py, tiempo, false); if (!tajoPend) torbellinoAro(ctx, j, px, py, tiempo, false); }
  // zona de clic
  // los aliados (Thor, invocados, escoltas) no se eligen con el clic: el clic los atraviesa
  if (!e.muerto && e.tipo !== 'heroe' && !(e as any).dueno) picks.push({ tipo: e.tipo === 'npc' ? 'npc' : 'monstruo', ref: e, x0: px - q.ax * esc + q.w * esc * 0.2, y0: py - q.ay * esc, x1: px - q.ax * esc + q.w * esc * 0.8, y1: py + 6, prof: e.x + e.y });
  // frase del jefe
  // (la frase del jefe ya no se escribe acá, dentro del orden del mundo: las rocas de delante la tapaban. Va encima, ver frasesMonstruos)
  // la barra de vida va a la altura de la cabeza del cuerpo quieto (el de ataque sube y bajaba la barra a cada cuadro)
  if (!e.muerto && (e.tipo === 'monstruo' || e.tipo === 'invocado')) { const fq = cuadrosMonstruo(m.def.sprite, 'quieto', 's')[0], alto = Math.min(150, (fq ?? q).ay) * (esc ?? 1); anotarBarra(m, px, py - alto); }
  if (e.tipo === 'monstruo' && m.habla && m !== j.jefe) frasesPendientes.push({ txt: m.habla, x: px, y: py - 95 * esc, a: Math.min(1, ((m as any).hablaT ?? 1) / 0.6) });
}

const PILAR: Record<string, string> = { magico: 'magico', raro: 'raro', conjunto: 'conjunto', unico: 'unico', legendario: 'legendario' };
const GEMAS = ['rubi', 'zafiro', 'topacio', 'esmeralda', 'amatista', 'diamante'];
/** Aura del héroe partida por profundidad: los anillos del piso en dos mitades y lo que orbita según su lado. */
function auraHeroe(j: Juego, px: number, py: number, tiempo: number, atras: boolean) {
  // el cetro del final de la Corona Fría: el héroe arde con su llama fría (detrás del cuerpo)
  if (atras && Object.values(j.heroe.d.equipo).some((o: any) => o?.rareza === 'legendario' && o.nombre?.[0] === 'Cetro de la Corona Fría')) dibujarEfecto({ id: 'llama_corona_fria', x: j.heroe.x, y: j.heroe.y, t: tiempo, dir: 0, escala: 0.9, z: 0 } as Efecto, tiempo);
  if (atras && j.heroe.c.vivo) luzPisoArma(ctx, px, py, j.heroe.c.vivo, tiempo);
  const au = Object.values(j.heroe.buffs).find((b) => b.t > 9000);
  const ae = auraEquipo(j.heroe.d.equipo as any);
  // mitad trasera del anillo: de PI a 2PI (arriba en pantalla); delantera: de 0 a PI
  const a0 = atras ? Math.PI : 0, a1 = atras ? Math.PI * 2 : Math.PI;
  if (ae) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const c = ae.color, pul = 0.5 + Math.sin(tiempo * 2.4) * 0.5;
    if (!atras) { const g = ctx.createRadialGradient(px, py - 40, 6, px, py - 40, 60); g.addColorStop(0, `rgba(${c[0]},${c[1]},${c[2]},${0.16 * ae.k + 0.06 * pul})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(px - 60, py - 100, 120, 120); }
    ctx.globalAlpha = 0.25 + 0.2 * pul * ae.k; ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(px, py, 26 + pul * 4, 13 + pul * 2, 0, a0, a1); ctx.stroke();
    for (let k = 0; k < 3; k++) { const a = tiempo * 1.7 + k * 2.1; if ((Math.sin(a) < 0) !== atras) continue; ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`; ctx.fillRect(px + Math.cos(a) * 24, py - 10 - ((tiempo * 30 + k * 23) % 70) + Math.sin(a) * 8, 2, 2); }
    ctx.restore();
  }
  if (au && !presenciasVivas()) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.25 + Math.sin(tiempo * 3) * 0.08; ctx.strokeStyle = '#ffe0a0'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, 34, 17, 0, a0, a1); ctx.stroke(); ctx.restore(); }
  if (j.heroe.escudoHueso > 0 && !presenciasVivas()) for (let k = 0; k < 4; k++) { const a = tiempo * 3 + k * 1.57; if ((Math.sin(a) < 0) !== atras) continue; ctx.fillStyle = '#e0d8c0'; ctx.fillRect(px + Math.cos(a) * 20, py - 30 + Math.sin(a) * 10, 3, 6); }
}

function dibujarBotinSuelo(s: any, px: number, py: number, t: number) {
  const k = Math.min(1, s.t * 3);
  const salto = (1 - k) * 18 * Math.sin(k * Math.PI);
  const anim = (id: string, v: string, una = false, t0 = 0) => { const m = objetoMeta(id, v); if (!m || !m.f.length) return false; const i = Math.floor(((una ? t0 : t) * 25) / m.t); dibujar(ctx, m.f[una ? Math.min(m.f.length - 1, i) : i % m.f.length], px, py - salto); return true; };
  ctx.save();
  // oro: cae tintineando y queda como montón con brillo
  if (s.oro) {
    const ok = s.t < 0.7 ? anim('oro_caida', s.oro >= 100 ? 'muchas' : 'pocas', true, s.t) : anim('oro_monton', s.oro >= 400 ? 'grande' : s.oro >= 80 ? 'mediano' : 'pequeno');
    if (!ok) { for (let i = 0; i < 5; i++) { ctx.fillStyle = i % 2 ? '#c09030' : '#f0d070'; ctx.fillRect(px - 6 + i * 2.5, py - 4 - (i % 3) - salto, 4, 3); } }
    ctx.restore(); return;
  }
  const o = s.o;
  // haz de luz debajo según la rareza (las runas y gemas también brillan)
  const pv = PILAR[o.rareza] ?? (o.tipo === 'runa' || o.tipo === 'gema' ? 'raro' : null);
  // únicos y legendarios: la columna de luz de pixelfx
  if ((o.rareza === 'unico' || o.rareza === 'legendario') && dibujarPfx(ctx, 'fx_columna_botin', t, px, py, { alfa: Math.min(1, s.t * 2) })) { /* listo */ }
  else if (pv) { const m = objetoMeta('botin_pilar', pv); if (m && m.f.length) { ctx.globalAlpha = Math.min(1, s.t * 2) * 0.9; dibujar(ctx, m.f[Math.floor((t * 25) / m.t) % m.f.length], px, py); ctx.globalAlpha = 1; } }
  else { ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.beginPath(); ctx.ellipse(px, py, 8, 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
  if (o.tipo === 'gema') { const g = GEMAS.find((x) => o.base.startsWith(x)); if (g && anim('gema_suelo', g)) { ctx.restore(); return; } }
  const b = baseDe(o);
  const ENCS: Record<string, string> = { fuego: '_fuego', frio: '_hielo', rayo: '_rayo', veneno: '_veneno', sombra: '_sombra', luz: '_sagrado', sangre: '_sangre' };
  const meta = (o.leg ? objetoMeta(`arma_${o.leg}`, 'suelo') : null) ?? (b?.arma && b.arma !== 'puno' ? (objetoMeta(`arma_${b.arma}${o.vivo ? ENCS[o.vivo] ?? '' : ''}`, 'suelo') ?? objetoMeta(`arma_${b.arma}`, 'suelo')) : null);
  // arma elemental sin dibujo propio de su elemento: un resplandor de su color debajo
  if (o.vivo && meta && !objetoMeta(`arma_${b?.arma}${ENCS[o.vivo] ?? ''}`, 'suelo')) {
    const COL: Record<string, string> = { fuego: '255,120,40', frio: '130,200,255', rayo: '210,200,255', veneno: '110,230,70', sombra: '150,80,230', luz: '255,230,150', sangre: '230,30,40' };
    const g = ctx.createRadialGradient(px, py - 4, 1, px, py - 4, 22); const c = COL[o.vivo] ?? '255,200,120', k = 0.45 + 0.15 * Math.sin(t * 4);
    g.addColorStop(0, `rgba(${c},${k})`); g.addColorStop(1, `rgba(${c},0)`);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py - 4, 22, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  if (meta && meta.f.length) dibujar(ctx, meta.f[Math.floor(t * 25 / meta.t) % meta.f.length], px, py - salto);
  else { ctx.translate(0, -salto); icono(o, px - 11, py - 20, 22, 22, t); }
  ctx.restore();
}

/** Qué portal vivo va en esta zona: el del pueblo, el del infierno (acto 5) o el de las mazmorras y el campo. */
export const tipoPortal = (j: Juego) => (j.zona.tipo === 'pueblo' ? 'pueblo' : /^a5_/.test(j.zona.id) ? 'infierno' : 'mazmorra');
function dibujarPortal(j: Juego, t: number) {
  const p = j.portal!;
  if ((j as any).portalZona !== j.zona.id && j.zona.tipo !== 'pueblo') return;
  const [px, py] = j.zona.tipo === 'pueblo' ? aPant(j.zona.entradas.portal[0] + 0.5, j.zona.entradas.portal[1] - 1) : aPant(p.x, p.y);
  // el portal vivo de la Forja: arco gótico con vórtice ámbar en el pueblo, grieta verde mar en la mazmorra, arco roto en
  // el infierno; la luz del piso va aparte, sumada en modo screen debajo del portal
  // el mismo óvalo de remolino de las salidas: dorado si lleva al pueblo; en el pueblo, del color de la zona a la que vuelve
  umbralVivo(px, py, true, j.zona.tipo === 'pueblo' ? ZONAS[(j as any).portalZona] : { tipo: 'pueblo' }, t, 0.5 + 0.5 * Math.sin(t * 3), 4.2, dtCuadro);
  picks.push({ tipo: 'portal', ref: p, x0: px - 22, y0: py - 90, x1: px + 22, y1: py + 6, prof: 1e9 });
}

const SPR_HUECO = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; const g = x.createRadialGradient(64, 64, 64 * 0.15, 64, 64, 64); g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.6, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); return c; })();
const sprTintes = new Map<string, HTMLCanvasElement>();
function sprTinte(col: string): HTMLCanvasElement {
  let c = sprTintes.get(col);
  if (!c) { c = document.createElement('canvas'); c.width = c.height = 128; const x = c.getContext('2d')!; const g = x.createRadialGradient(64, 64, 0, 64, 64, 64); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, 128, 128); sprTintes.set(col, c); if (sprTintes.size > 200) sprTintes.delete(sprTintes.keys().next().value!); }
  return c;
}
function dibujarLuz(j: Juego, t: number) {
  const z = j.zona;
  if (luz.width !== W || luz.height !== H) { luz.width = W; luz.height = H; brillo.width = W; brillo.height = H; }
  // (tope 0,88: con 0,97 el piso lejos de toda luz quedaba negro puro y parecía que no había nada. Así se intuye siempre,
  // como en el Diablo de Rick, y la clave baja se mantiene. `__topeOscuro` para comparar)
  const oscuro = Math.min((window as any).__topeOscuro ?? 0.88, z.oscuridad + (z.tipo === 'pueblo' ? -0.1 : 0.08)) * (1 - destello * 0.5);
  lctx.globalCompositeOperation = 'source-over';
  lctx.clearRect(0, 0, W, H);
  // (acto 2: cada tumba con el color de su oscuridad: el negro azulado del pozo, el ámbar del templo, el morado del rey)
  const tinta = varianteDe(z.id)?.tinta;
  lctx.fillStyle = tinta ? `rgba(${tinta[0]},${tinta[1]},${tinta[2]},${oscuro})` : `rgba(0,0,0,${oscuro})`; lctx.fillRect(0, 0, W, H);
  lctx.globalCompositeOperation = 'destination-out';
  bctx.clearRect(0, 0, W, H);
  // degradados pintados una vez y escalados: mucho más baratos que crear uno por luz y por cuadro
  const hueco = (x: number, y: number, r: number, k = 1) => { lctx.globalAlpha = Math.min(1, k); lctx.drawImage(SPR_HUECO, x - r, y - r, r * 2, r * 2); lctx.globalAlpha = 1; };
  const tinte = (x: number, y: number, r: number, c: string, a: number) => { bctx.globalAlpha = a; bctx.drawImage(sprTinte(c), x - r, y - r, r * 2, r * 2); bctx.globalAlpha = 1; };
  // clave baja: la antorcha del héroe ya no abre la oscuridad del todo (el misterio vuelve); en el pueblo casi no hay
  // oscuridad y en las mazmorras más negras se deja un poco más para que el héroe no se pierda. Su radio no cambia
  const kHeroe = z.tipo === 'pueblo' ? 0.75 : z.oscuridad >= 0.9 ? 0.6 : 0.52;
  for (const l of luces) {
    const cy = l.y - Math.min(40, l.h * 0.45);
    hueco(l.x, cy, l.r, l.blanca ? kHeroe : Math.min(0.85, 0.5 + l.k * 0.4));
    if (!l.blanca) tinte(l.x, l.y - Math.min(30, l.h * 0.3), l.r * 0.85, `rgb(${l.c[0]},${l.c[1]},${l.c[2]})`, Math.min(0.5, 0.18 + l.k * 0.28));
  }
  ctx.drawImage(luz, 0, 0);
  // (de día el piso ya es claro: el tinte de las luces sumado entero lo quemaba a blanco, así que baja con la claridad)
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (window as any).__sinBrillo ? 0 : 0.45 + 0.55 * Math.min(1, z.oscuridad / 0.6); ctx.drawImage(brillo, 0, 0); ctx.globalAlpha = 1;
  if (destello > 0.02) { ctx.globalAlpha = destello * 0.16 * acc.destellos * (0.2 + 0.8 * nochePfx()); ctx.fillStyle = `rgb(${destelloColor[0]},${destelloColor[1]},${destelloColor[2]})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  // niebla de guerra: lo no explorado se ve negro del todo (salvo las piezas ancla: la catedral no se recorta)
  const conAncla = anclasCuadro.length > 0;
  let nc: CanvasRenderingContext2D = ctx;
  if (conAncla) { if (nieblaCv.width !== W || nieblaCv.height !== H) { nieblaCv.width = W; nieblaCv.height = H; } nc = nieblaCv.getContext('2d')!; nc.clearRect(0, 0, W, H); }
  // La máscara se arma chiquita (1/20) con una mancha redonda por baldosa tapada y se agranda suavizada: el borde de lo
  // visto y el borde del mundo quedan como una penumbra de contorno irregular, no como rombos cortados a regla.
  // Lo que no tiene piso también entra en la máscara: así el filo del mapa se funde en la oscuridad.
  const NB = 20, nw = Math.ceil(W / NB) + 2, nh = Math.ceil(H / NB) + 2;
  if (nieblaBaja.width !== nw || nieblaBaja.height !== nh) { nieblaBaja.width = nw; nieblaBaja.height = nh; }
  const nb = nieblaBaja.getContext('2d')!; nb.clearRect(0, 0, nw, nh); nb.fillStyle = '#000';
  const lotes = !(window as any).__sinLotes;
  const [fx0] = aMundo(0, 0), [, fy0] = aMundo(W, 0), [fx1] = aMundo(W, H), [, fy1] = aMundo(0, H);
  let hay = false;
  for (let by = Math.floor(fy0 / 5) - 2; by <= Math.ceil(fy1 / 5) + 2; by++) for (let bx = Math.floor(fx0 / 5) - 2; bx <= Math.ceil(fx1 / 5) + 2; bx++) {
    const dentro = bx >= 0 && by >= 0 && bx < z.tw && by < z.th;
    if (dentro && z.explorado[by * z.tw + bx] && z.pisos[by * z.tw + bx]) continue;
    // la roca encerrada (rellenarBolsas) no se tapa si ya se vio piso cerca: a tres baldosas o menos, porque el centro de un
    // macizo ancho no tiene piso al lado y la niebla le dejaba un ojo negro en medio de la roca
    if (dentro && z.roca?.[by * z.tw + bx]) { let visto = false; for (let dy = -3; dy <= 3 && !visto; dy++) for (let dx = -3; dx <= 3; dx++) { const x = bx + dx, y = by + dy; if (x >= 0 && y >= 0 && x < z.tw && y < z.th && z.pisos[y * z.tw + x] && z.explorado[y * z.tw + x]) { visto = true; break; } } if (visto) continue; }
    // una baldosa vacía que queda justo DETRÁS de piso ya visto no se tapa: en pantalla cae sobre los muros, los árboles y
    // la cabeza del que está parado en ese borde
    if (!(dentro && z.pisos[by * z.tw + bx])) {
      const visto = (x: number, y: number) => x >= 0 && y >= 0 && x < z.tw && y < z.th && !!z.pisos[y * z.tw + x] && !!z.explorado[y * z.tw + x];
      if (visto(bx + 1, by) || visto(bx, by + 1) || visto(bx + 1, by + 1)) continue;
    }
    const [px, py] = aPant(bx * 5 + 2.5, by * 5 + 2.5);
    if (px < -140 || px > W + 140 || py < -90 || py > H + 90) continue;
    // cada mancha con su tamaño (sale de la baldosa, no cambia con el tiempo): el contorno no repite
    const k = dentro && z.pisos[by * z.tw + bx] ? 0.92 + 0.3 * hashCelda(bx * 3 + 1, by * 7 + 2) : z.tipo === 'mazmorra' ? 0.74 + 0.2 * hashCelda(bx * 3 + 1, by * 7 + 2) : 0.95 + 0.6 * hashCelda(bx * 3 + 1, by * 7 + 2); // (en las mazmorras, menos: no debe comerse los muros)
    // (todas las manchas en un solo camino y un solo fill: antes era un fill por baldosa, hasta 200 por cuadro)
    const ex = px / NB + 1, ey = py / NB + 1, rx = (81 * k) / NB;
    if (lotes) { if (!hay) nb.beginPath(); nb.moveTo(ex + rx, ey); nb.ellipse(ex, ey, rx, (41 * k) / NB, 0, 0, Math.PI * 2); }
    else { nb.beginPath(); nb.ellipse(ex, ey, rx, (41 * k) / NB, 0, 0, Math.PI * 2); nb.fill(); }
    hay = true;
  }
  if (hay && lotes) nb.fill();
  if (hay) { nc.save(); nc.imageSmoothingEnabled = true; nc.imageSmoothingQuality = 'high'; nc.drawImage(nieblaBaja, -NB, -NB, nw * NB, nh * NB); nc.restore(); }
  if (conAncla) {
    nc.globalCompositeOperation = 'destination-out';
    for (const a of anclasCuadro) { if (a.br) nc.drawImage(a.br, Math.round(a.px - a.q.ax), Math.round(a.py - a.q.ay)); else dibujar(nc, a.q, a.px, a.py); }
    nc.globalCompositeOperation = 'source-over';
    ctx.drawImage(nieblaCv, 0, 0);
  }
}

// ---------------------------------------------------------------- la catedral: plano de llegada y bruma baja
let llegada: { t: number; x: number; y: number; hx: number; hy: number; zona: string } | null = null;
const llegadasVistas = new Set<string>();
function planoLlegada(j: Juego, dt: number) {
  const z = j.zona, h = j.heroe;
  if (!llegada) {
    for (const sa of z.salidas) if (sa.piezas?.length) {
      const fa = sa.piezas[sa.piezas.length - 1], clave = z.id + ':' + z.semilla;
      if (llegadasVistas.has(clave)) continue;
      const pu = puertaAncla(sa), puerta = Math.hypot(h.x - pu.x, h.y - pu.y);
      // (el plano de llegada mira la obra: la catedral 15 celdas atrás de su fachada; un monumento, 13 por su eje desde la puerta: entra entero)
      if (z.id === 'a1_cementerio' || puerta < 20) { llegadasVistas.add(clave); llegada = pu.mon ? { t: 0, x: pu.x - pu.dx * 13, y: pu.y - pu.dy * 13, hx: h.x, hy: h.y, zona: clave } : { t: 0, x: fa.cx + 0.5 - 15, y: fa.cy + 1 - 15, hx: h.x, hy: h.y, zona: clave }; }
    }
  }
  if (!llegada) return;
  if (llegada.zona !== z.id + ':' + z.semilla) { llegada = null; foco.k = 0; return; }
  llegada.t += dt;
  // la posición de partida se toma al asentarse la zona (al entrar, el héroe se ubica en el primer cuadro)
  if (llegada.t < 0.3) { llegada.hx = h.x; llegada.hy = h.y; }
  const movio = Math.hypot(h.x - llegada.hx, h.y - llegada.hy) > 2;
  if (llegada.t < 3.5 && !movio) { foco.x = llegada.x; foco.y = llegada.y; foco.k = Math.min(1, foco.k + dt / 0.8); }
  else { foco.k = Math.max(0, foco.k - dt / 1); if (foco.k <= 0) llegada = null; }
}
/** Bruma baja que se arrastra al pie de la fachada y del costado de la nave y la cabecera (solo con niebla). */
function brumaAncla(j: Juego) {
  const z = j.zona; if (!z.niebla) return;
  ctx.save();
  const mancha = (x: number, y: number) => {
    const [px, py] = aPant(x, y); if (px < -150 || px > W + 150 || py < -100 || py > H + 100) return;
    ctx.save(); ctx.translate(px, py); ctx.scale(1, 0.45);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 120); g.addColorStop(0, `rgba(112,116,122,${z.niebla! * 0.22})`); g.addColorStop(1, 'rgba(112,116,122,0)');
    ctx.fillStyle = g; ctx.fillRect(-120, -120, 240, 240); ctx.restore();
  };
  for (const sa of z.salidas) if (sa.piezas?.length) {
    const fa = sa.piezas[sa.piezas.length - 1], pu = puertaAncla(sa);
    // (los monumentos de los actos 2 a 7 no llevan la bruma baja al pie: velaba a los colosos de los costados justo donde más se
    //  mira, con el héroe en la puerta. `__brumaMonumento` la vuelve a poner)
    if (pu.mon) { if ((window as any).__brumaMonumento) for (let i = -8; i <= 8; i += 2) mancha(pu.x + pu.dx * 2 + i * pu.dy, pu.y + pu.dy * 2 - i * pu.dx); continue; }
    for (let i = -6; i <= 6; i += 2) mancha(fa.cx + 0.5 + i, fa.cy + 3.3);
    for (const p of sa.piezas.slice(0, -1)) for (let i = -4; i <= 4; i += 2) mancha(p.cx + 7.7, p.cy + 0.5 + i);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ el suelo no se repite
// Las baldosas de piso son 3 o 4 variantes por tema: solas, se nota la cuadrícula. Encima va (1) un matiz propio de cada
// zona, una textura de un pixel por celda con manchas grandes y medianas más claras, más oscuras, más cálidas o más frías,
// que se estira sobre todo el mapa y multiplica el piso, y (2) detalles sueltos por celda (piedritas, grietas, matas,
// astillas) que salen de la posición: ninguna parte del mapa se ve igual a otra.
let matizDe = '', matizCv: HTMLCanvasElement | null = null;
const PISO_VERDE = /pasto|selva|pantano|par_suelo|musgo/;
function matizSuelo(g: CanvasRenderingContext2D, z: Juego['zona'], ap: (x: number, y: number) => [number, number], bx0: number, bx1: number, by0: number, by1: number, rx0: number, ry0: number, rx1: number, ry1: number): boolean {
  const clave = z.id + ':' + z.semilla;
  if (matizDe !== clave || !matizCv) {
    matizDe = clave; matizCv = document.createElement('canvas'); matizCv.width = z.W; matizCv.height = z.H;
    const g = matizCv.getContext('2d')!, im = g.createImageData(z.W, z.H), r = rng(z.semilla * 31 + 7);
    const campo = (esc: number) => { const gw = Math.ceil(z.W / esc) + 2, gh = Math.ceil(z.H / esc) + 2, gr = Float32Array.from({ length: gw * gh }, () => r()); return (x: number, y: number) => { const fx = x / esc, fy = y / esc, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, su = u * u * (3 - 2 * u), sv = v * v * (3 - 2 * v); const a = gr[iy * gw + ix], b = gr[iy * gw + ix + 1], c = gr[(iy + 1) * gw + ix], d = gr[(iy + 1) * gw + ix + 1]; return a + (b - a) * su + (c - a + (a - b - c + d) * su) * sv; }; };
    const grande = campo(11), medio = campo(4.3), fino = campo(1.7), calor = campo(15);
    // el relieve: un campo de alturas suave que la luz (de arriba a la izquierda) convierte en lomas y hondonadas, más
    // unos escalones donde la altura cruza de una terraza a otra. Solo a cielo abierto; en las mazmorras el piso es obra.
    const lomas = campo(9), ondas = campo(3.6), rel = z.tipo === 'mazmorra' ? 0 : z.tipo === 'pueblo' ? 0.6 : 1;
    const alt = (x: number, y: number) => (z.alturas ? z.alturas[y * z.W + x] : lomas(x, y) * 0.75 + ondas(x, y) * 0.25);
    for (let y = 0; y < z.H; y++) for (let x = 0; x < z.W; x++) {
      const v = 0.5 * grande(x, y) + 0.32 * medio(x, y) + 0.18 * fino(x, y), c = calor(x, y) - 0.5, o = (y * z.W + x) * 4;
      let luz = 0.74 + 0.4 * v;
      if (rel) {
        const a0 = alt(x, y), dx = alt(Math.min(z.W - 1, x + 1), y) - a0, dy = alt(x, Math.min(z.H - 1, y + 1)) - a0;
        // ladera que mira a la luz, más clara; la que le da la espalda, en sombra
        luz *= 1 + Math.max(-0.2, Math.min(0.2, -(dx * 1.1 + dy * 1.6) * 4.2)) * rel;
        // el escalón entre terrazas: sombra corta al pie del que baja, filo claro en el que sube
        const t0 = Math.floor(a0 * 5), t1 = Math.floor(alt(Math.min(z.W - 1, x + 1), Math.min(z.H - 1, y + 1)) * 5);
        if (t1 < t0) luz *= 1 - 0.2 * rel; else if (t1 > t0) luz *= 1 + 0.09 * rel;
      }
      im.data[o] = Math.min(255, 255 * luz * (1 + c * 0.16)); im.data[o + 1] = Math.min(255, 255 * luz); im.data[o + 2] = Math.min(255, 255 * luz * (1 - c * 0.18)); im.data[o + 3] = 255;
    }
    g.putImageData(im, 0, 0);
  }
  if (calidadMundo.nivel > 0) {
  g.save();
  const [ox, oy] = ap(0, 0);
  g.globalCompositeOperation = 'multiply'; g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.transform(16, 8, -16, 8, ox, oy);
  g.drawImage(matizCv, 0, 0);
  g.restore();
  }
  // detalles sueltos: se pintan una vez por baldosa en un lienzo propio y después solo se copian
  let completo = true;
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    if (!z.pisos[by * z.tw + bx]) continue;
    const [px, py] = ap(bx * 5 + 2.5, by * 5 + 2.5); if (px < rx0 - 100 || px > rx1 + 100 || py < ry0 - 60 || py > ry1 + 60) continue;
    const c = detalleBaldosa(z, bx, by); if (c) g.drawImage(c, Math.round(px) - 88, Math.round(py) - 48); else if (!detalles.has(by * z.tw + bx)) completo = false;
  }
  return completo;
}

/**
 * La capa del piso en `g`: baldosas, matiz, detalles, la roca negra de las cavernas y el suelo en penumbra del relleno.
 * `ap` lleva del mundo al lienzo y (rx0, ry0)-(rx1, ry1) es lo que se ve. Devuelve si salió entera (si falta un atlas,
 * no se guarda). Es el mismo código para la pantalla y para los trozos guardados.
 */
function pintarPiso(g: CanvasRenderingContext2D, z: Juego['zona'], ap: (x: number, y: number) => [number, number], bx0: number, bx1: number, by0: number, by1: number, ph: number, rx0: number, ry0: number, rx1: number, ry1: number): boolean {
  let completo = true;
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    const p = z.pisos[by * z.tw + bx]; if (!p) continue;
    const fs = cuadrosPiso(p.id, variantePiso(p.id, p.v, bx, by)); if (!fs.length) continue;
    const q = fs[ph % fs.length];
    const [px, py] = ap(bx * 5 + 2.5, by * 5 + 2.5);
    if (px < rx0 - 100 || px > rx1 + 100 || py < ry0 - 60 || py > ry1 + 60) continue;
    if (!dibujar(g, q, px, py)) completo = false;
  }
  if (!(window as any).__sinMatiz && !matizSuelo(g, z, ap, bx0, bx1, by0, by1, rx0, ry0, rx1, ry1)) completo = false;
  // cavernas: la roca maciza se pinta negra encima del piso, por tramos de celdas seguidas (los peñascos del contorno van después, encima)
  if (z.hueco) {
    const hu = z.hueco, cx0 = Math.max(0, bx0 * 5), cx1 = Math.min(z.W - 1, bx1 * 5 + 4), cy0 = Math.max(0, by0 * 5), cy1 = Math.min(z.H - 1, by1 * 5 + 4);
    g.fillStyle = '#050403'; g.beginPath();
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
      if (!hu[y * z.W + x]) continue;
      let x2 = x; while (x2 < cx1 && hu[y * z.W + x2 + 1]) x2++;
      const a = ap(x, y), b2 = ap(x2 + 1, y), c = ap(x2 + 1, y + 1), d = ap(x, y + 1);
      if (!(b2[0] < rx0 - 40 || d[0] > rx1 + 40 || c[1] < ry0 - 20 || a[1] > ry1 + 20)) { g.moveTo(a[0], a[1] - 1); g.lineTo(b2[0] + 1, b2[1]); g.lineTo(c[0], c[1] + 1); g.lineTo(d[0] - 1, d[1]); g.closePath(); }
      x = x2;
    }
    g.fill();
  }
  // el hueco rellenado (rellenarBolsas): su suelo en penumbra, el piso del tema oscurecido y cortado celda por celda, para que
  // entre las piezas del derrumbe se vea tierra y cascajo en sombra y no el negro de fuera del mapa
  if (z.relleno && z.rellenoPiso && !(window as any).__sinRelleno) {
    const re = z.relleno, cx0 = Math.max(0, bx0 * 5), cx1 = Math.min(z.W - 1, bx1 * 5 + 4), cy0 = Math.max(0, by0 * 5), cy1 = Math.min(z.H - 1, by1 * 5 + 4);
    const tiles = new Set<number>(); g.save(); g.beginPath(); let hay = false;
    for (let y = cy0; y <= cy1; y++) for (let x = cx0; x <= cx1; x++) {
      if (!re[y * z.W + x]) continue;
      let x2 = x; while (x2 < cx1 && re[y * z.W + x2 + 1]) x2++;
      const a = ap(x, y), b2 = ap(x2 + 1, y), c = ap(x2 + 1, y + 1), d = ap(x, y + 1);
      if (!(b2[0] < rx0 - 40 || d[0] > rx1 + 40 || c[1] < ry0 - 20 || a[1] > ry1 + 20)) { g.moveTo(a[0], a[1] - 1); g.lineTo(b2[0] + 1, b2[1]); g.lineTo(c[0], c[1] + 1); g.lineTo(d[0] - 1, d[1]); g.closePath(); hay = true; for (let q = x; q <= x2; q++) tiles.add(Math.floor(y / 5) * z.tw + Math.floor(q / 5)); }
      x = x2;
    }
    if (hay) {
      g.clip();
      for (const ti of tiles) {
        const bx = ti % z.tw, by = (ti - bx) / z.tw, fs = cuadrosPiso(z.rellenoPiso, variantePiso(z.rellenoPiso, (bx * 7 + by * 3) % 8, bx, by)); if (!fs.length) continue;
        const [px, py] = ap(bx * 5 + 2.5, by * 5 + 2.5); if (!dibujar(g, fs[0], px, py)) completo = false;
      }
      g.fillStyle = 'rgba(8,6,5,0.62)'; g.fillRect(rx0, ry0, rx1 - rx0, ry1 - ry0);
    }
    g.restore();
  }
  return completo;
}

// ------------------------------------------------------------------ el piso en trozos
// El piso no cambia de un cuadro a otro: se pinta UNA vez por trozo de unos 512 x 512 puntos de pantalla (en las
// coordenadas del piso, sin cámara) y en cada cuadro solo se copian los trozos que se ven. Las baldosas van a puntos
// enteros (dibujar redondea), así que con la cámara corrida en enteros la copia es punto por punto lo mismo; el matiz,
// la roca y el relleno quedan a lo sumo medio punto corridos (antes nadaban medio punto respecto de las baldosas).
// Las baldosas vivas (agua, lava, pantano, fortaleza, pentagrama) cambian de cuadro cada 4/25 s: el trozo guarda su fase
// y la siguiente se pinta antes de que toque. Con la luz avanzada, cada trozo lleva también su relieve y su alto.
// Solo si el mundo va a una escala entera de puntos del aparato (PC: Lejos, Cerca, Muy cerca); si no, lo de siempre.
// `__sinTrozos` lo apaga para comparar.
interface Trozo { k: number; cv: HTMLCanvasElement; rel: HTMLCanvasElement | null; alt: HTMLCanvasElement | null; usado: number }
const trozos = new Map<number, { L: number; f: Trozo[]; usado: number }>();
let trozosDe = '', trozosZona: object | null = null, cuadroTrozo = 0;
const poolTrozos: HTMLCanvasElement[] = [];
const isoP = (x: number, y: number): [number, number] => [(x - y) * 16, (x + y) * 8];
const mcm = (a: number, b: number) => { let x = a, y = b; while (y) [x, y] = [y, x % y]; return (a / x) * b; };
function lienzoTrozo(lado: number): HTMLCanvasElement {
  let c = poolTrozos.pop();
  if (!c) { c = document.createElement('canvas'); c.addEventListener('contextlost', () => vaciarTrozos()); }
  if (c.width !== lado || c.height !== lado) { c.width = lado; c.height = lado; }
  return c;
}
function soltarTrozo(t: Trozo) { poolTrozos.push(t.cv); if (t.rel) poolTrozos.push(t.rel); if (t.alt) poolTrozos.push(t.alt); if (poolTrozos.length > 24) poolTrozos.length = 24; }
siSePierdeLaTarjeta(() => vaciarTrozos());
export function vaciarTrozos() { for (const e of trozos.values()) for (const t of e.f) soltarTrozo(t); trozos.clear(); }
(window as any).__trozos = () => ({ n: trozos.size, lienzos: [...trozos.values()].reduce((s, e) => s + e.f.length, 0), clave: trozosDe });
function rangoTrozo(z: Juego['zona'], X0: number, Y0: number, S: number): [number, number, number, number] {
  const u0 = (X0 - 100) / 80, u1 = (X0 + S + 100) / 80, v0 = (Y0 - 100) / 40, v1 = (Y0 + S + 20) / 40;
  return [Math.max(0, Math.floor((u0 + v0) / 2) - 1), Math.min(z.tw - 1, Math.ceil((u1 + v1) / 2) + 1), Math.max(0, Math.floor((v0 - u1) / 2) - 1), Math.min(z.th - 1, Math.ceil((v1 - u0) / 2) + 1)];
}
function pintarTrozo(z: Juego['zona'], tx: number, ty: number, S: number, T: number, k: number, conRel: boolean, t: Trozo | null): Trozo | null {
  const lado = S * T, X0 = tx * S, Y0 = ty * S;
  const cv = t?.cv ?? lienzoTrozo(lado), g = cv.getContext('2d')!;
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.imageSmoothingEnabled = false;
  g.fillStyle = '#000'; g.fillRect(0, 0, lado, lado);
  g.setTransform(T, 0, 0, T, -T * X0, -T * Y0);
  let rel: HTMLCanvasElement | null = null, alt: HTMLCanvasElement | null = null, antes: ReturnType<typeof desviarRelieve> | null = null;
  if (conRel) {
    rel = t?.rel ?? lienzoTrozo(lado); alt = t?.alt ?? lienzoTrozo(lado);
    for (const c of [rel, alt]) { const x = c.getContext('2d')!; x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, lado, lado); x.imageSmoothingEnabled = false; }
    antes = desviarRelieve(g, rel.getContext('2d')!, alt.getContext('2d')!);
  } else if (t?.rel) { poolTrozos.push(t.rel); if (t.alt) poolTrozos.push(t.alt); }
  const [bx0, bx1, by0, by1] = rangoTrozo(z, X0, Y0, S);
  let ok: boolean;
  try { ok = pintarPiso(g, z, isoP, bx0, bx1, by0, by1, k, X0, Y0, X0 + S, Y0 + S); }
  finally { if (antes) ok = devolverRelieve(antes) && ok!; }
  const nt: Trozo = { k, cv, rel, alt, usado: cuadroTrozo };
  if (!ok!) { trozoFallido = nt; return null; }
  return nt;
}
let trozoFallido: Trozo | null = null;
/** El período de las baldosas vivas del trozo (1 si no tiene). */
function periodoTrozo(z: Juego['zona'], tx: number, ty: number, S: number): number {
  const [bx0, bx1, by0, by1] = rangoTrozo(z, tx * S, ty * S, S); let L = 1;
  for (let by = by0; by <= by1; by++) for (let bx = bx0; bx <= bx1; bx++) {
    const p = z.pisos[by * z.tw + bx]; if (!p) continue;
    const n = cuadrosPiso(p.id, variantePiso(p.id, p.v, bx, by)).length; if (n > 1) L = mcm(L, n);
  }
  return L;
}
/** Para las pruebas (t891_igual): solo el piso, con lo de siempre (antes) o con los trozos, en la cámara de ahora. */
(window as any).__pintarMundo = (j: Juego, solo: boolean, antes: boolean, tiempo = 100) => { baseLienzo(); enMundo(() => (solo ? soloPiso(j, antes, tiempo) : dibujarMundo(j, 0, tiempo))); return { cam: [cam.x, cam.y] }; };
function soloPiso(j: Juego, antes: boolean, tiempo = 100) {
  empezarRelieve(ctx); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const f25 = Math.floor(tiempo * 25), z = j.zona;
  const [wx0] = aMundo(0, 0), [, wy0] = aMundo(W, 0), [wx1] = aMundo(W, H), [, wy1] = aMundo(0, H);
  const bx0 = Math.max(0, Math.floor(wx0 / 5) - 1), bx1 = Math.min(z.tw - 1, Math.ceil(wx1 / 5) + 1);
  const by0 = Math.max(0, Math.floor(wy0 / 5) - 1), by1 = Math.min(z.th - 1, Math.ceil(wy1 / 5) + 1);
  if (antes || !trozosPiso(j, f25)) pintarPiso(ctx, z, aPant, bx0, bx1, by0, by1, Math.floor(f25 / 4), 0, 0, W, H);
}
function trozosPiso(j: Juego, f25: number): boolean {
  if ((window as any).__sinTrozos) { if (trozos.size) vaciarTrozos(); return false; }
  const tr = ctx.getTransform(), T = Math.round(tr.a);
  const ent = (v: number) => Math.abs(v - Math.round(v)) < 1e-6;
  if (T < 1 || tr.b || tr.c || !ent(tr.a) || !ent(tr.d) || Math.round(tr.d) !== T || !ent(tr.e) || !ent(tr.f)) return false;
  const z = j.zona, S = Math.round(512 / T);
  const clave = `${z.id}:${z.semilla}:${T}:${calidadMundo.nivel > 0 && !(window as any).__sinMatiz}:${!!(window as any).__sinRelleno}`;
  if (clave !== trozosDe || z !== trozosZona) { vaciarTrozos(); trozosDe = clave; trozosZona = z; }
  cuadroTrozo++;
  const rl = lienzosRelieve(ctx), conRel = !!rl;
  const [ox, oy] = aPant(0, 0), OX = Math.round(ox), OY = Math.round(oy), ph = Math.floor(f25 / 4);
  const tx0 = Math.floor(-OX / S), tx1 = Math.floor((W - 1e-6 - OX) / S), ty0 = Math.floor(-OY / S), ty1 = Math.floor((H - 1e-6 - OY) / S);
  const lado = S * T;
  let pintados = 0;
  const conseguir = (tx: number, ty: number, fase: number, ahora: boolean): Trozo | null => {
    const id = (ty + 4096) * 8192 + (tx + 4096);
    let e = trozos.get(id);
    if (!e) { e = { L: periodoTrozo(z, tx, ty, S), f: [], usado: cuadroTrozo }; trozos.set(id, e); }
    if (ahora) e.usado = cuadroTrozo;
    const kq = fase % e.L;
    const t = e.f.find((q) => q.k === kq && (!conRel || q.rel));
    if (t) { if (ahora) t.usado = cuadroTrozo; return t; }
    // se pinta (sobre el más viejo del trozo si ya tiene dos, o sobre el de la misma fase sin relieve)
    let viejo: Trozo | null = null;
    const i = e.f.findIndex((q) => q.k === kq);
    if (i >= 0) viejo = e.f.splice(i, 1)[0];
    else if (e.f.length >= 2) { e.f.sort((a, b) => a.usado - b.usado); viejo = e.f.shift()!; }
    trozoFallido = null; pintados++;
    const nt = pintarTrozo(z, tx, ty, S, T, kq, conRel, viejo);
    if (nt) { if (!ahora) nt.usado = 0; e.f.push(nt); return nt; }
    // incompleto (falta un atlas): se usa este cuadro y no se guarda
    if (!ahora && trozoFallido) { soltarTrozo(trozoFallido); trozoFallido = null; }
    return ahora ? trozoFallido : null;
  };
  const suavizar = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  const r0 = rl?.[0], r1 = rl?.[1];
  if (rl) { for (const c of rl) { c.save(); c.setTransform(tr); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false; } }
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
    const t = conseguir(tx, ty, ph, true); if (!t) continue;
    const x = tx * S + OX, y = ty * S + OY;
    ctx.drawImage(t.cv, 0, 0, lado, lado, x, y, S, S);
    if (r0 && t.rel) r0.drawImage(t.rel, 0, 0, lado, lado, x, y, S, S);
    if (r1 && t.alt) r1.drawImage(t.alt, 0, 0, lado, lado, x, y, S, S);
    if (t === trozoFallido) { soltarTrozo(t); trozoFallido = null; }
  }
  if (rl) for (const c of rl) c.restore();
  ctx.imageSmoothingEnabled = suavizar;
  // adelantar: la fase siguiente de los trozos vivos que se ven y los trozos de alrededor (para cuando la cámara llegue)
  for (let ty = ty0; ty <= ty1 && pintados < 2; ty++) for (let tx = tx0; tx <= tx1 && pintados < 2; tx++) conseguir(tx, ty, ph + 1, false);
  for (let ty = ty0 - 1; ty <= ty1 + 1 && pintados < 1; ty++) for (let tx = tx0 - 1; tx <= tx1 + 1 && pintados < 1; tx++) {
    if (ty >= ty0 && ty <= ty1 && tx >= tx0 && tx <= tx1) continue;
    const e = trozos.get((ty + 4096) * 8192 + (tx + 4096)); if (!e || !e.f.length) conseguir(tx, ty, ph, false);
  }
  // tope de memoria: unos 48 trozos de 512 x 512 (los que no se usan hace más rato se van)
  const tope = Math.max(2 * (tx1 - tx0 + 3) * (ty1 - ty0 + 3), 48);
  let n = 0; for (const e of trozos.values()) n += e.f.length;
  if (n > tope) {
    const lista = [...trozos.entries()].sort((a, b) => a[1].usado - b[1].usado);
    for (const [id, e] of lista) { if (n <= tope) break; if (e.usado === cuadroTrozo) continue; for (const t of e.f) soltarTrozo(t); n -= e.f.length; trozos.delete(id); }
  }
  return true;
}
const detalles = new Map<number, HTMLCanvasElement | null>(); let detallesDe = '';
function detalleBaldosa(z: Juego['zona'], bx: number, by: number): HTMLCanvasElement | null {
  const clave = z.id + ':' + z.semilla; if (detallesDe !== clave) { detallesDe = clave; detalles.clear(); }
  const idx = by * z.tw + bx; if (detalles.has(idx)) return detalles.get(idx)!;
  const p = z.pisos[idx]!; let c: HTMLCanvasElement | null = null, g: CanvasRenderingContext2D | null = null;
  // donde la baldosa vecina es de otro piso, ese piso entra en esta por manchas irregulares a lo largo del borde (la
  // textura de cada piso se repite por baldosa, así que dibujada aquí continúa sin costura): se acaban los parches cuadrados
  const VIVO = /agua|lava|arcano|pentagrama/;
  for (const [dx, dy, x1, y1, x2, y2] of [[0, -1, 88, 8, 168, 48], [1, 0, 168, 48, 88, 88], [0, 1, 88, 88, 8, 48], [-1, 0, 8, 48, 88, 8]]) {
    const X = bx + dx, Y = by + dy; if (X < 0 || Y < 0 || X >= z.tw || Y >= z.th) continue;
    // (el agua y la lava reciben siempre la orilla del vecino: así la poza no es un rombo)
    const o = z.pisos[Y * z.tw + X]; if (!o || o.id === p.id || VIVO.test(o.id) || !(VIVO.test(p.id) || o.id < p.id)) continue;
    const q = cuadrosPiso(o.id, variantePiso(o.id, o.v, bx, by))[0]; if (!q) continue; // (con la fase de ESTA baldosa: así continúa el dibujo)
    if (!g) { c = document.createElement('canvas'); c.width = 176; c.height = 96; g = c.getContext('2d')!; }
    g.save(); g.beginPath();
    for (let i = 0; i < 7; i++) {
      const t = (i + 0.5) / 7, h1 = hashCelda(bx * 5.1 + i * 1.7 + dx * 3, by * 4.3 + i * 0.9 + dy * 7), h2 = hashCelda(bx * 2.9 + i * 3.1 + dy, by * 6.7 + i * 2.3 + dx);
      const ex = x1 + (x2 - x1) * t, ey = y1 + (y2 - y1) * t, r = 9 + h1 * 17;
      // hacia adentro de la baldosa (el centro está en 88,48)
      const ix = 88 - ex, iy = 48 - ey, il = Math.hypot(ix, iy) || 1, m = r * 0.35 + h2 * 5;
      g.moveTo(ex + (ix / il) * m + r, ey + (iy / il) * m); g.ellipse(ex + (ix / il) * m, ey + (iy / il) * m, r, r * 0.55, 0, 0, Math.PI * 2);
    }
    g.clip();
    // recortado además al rombo de la baldosa
    g.beginPath(); g.moveTo(88, 7); g.lineTo(169, 48); g.lineTo(88, 89); g.lineTo(7, 48); g.closePath(); g.clip();
    const ok = dibujar(g, q, 88, 48); g.restore();
    if (!ok) return null; // el atlas del vecino todavía no cargó: se intenta en el próximo cuadro (sin guardar nada)
  }
  if (!/agua|lava|arcano|pentagrama|madera|baldosa/.test(p.id)) for (let cy = by * 5; cy < by * 5 + 5; cy++) for (let cx = bx * 5; cx < bx * 5 + 5; cx++) {
    const dens = 0.17, h = hashCelda(cx * 1.37 + 5, cy * 0.91 + 3); if (h > dens) continue;
    if (z.bloq[cy * z.W + cx] === 2 || (z.hueco && z.hueco[cy * z.W + cx])) continue;
    if (!g) { c = document.createElement('canvas'); c.width = 176; c.height = 96; g = c.getContext('2d')!; }
    const h2 = hashCelda(cx * 7.1, cy * 3.3), h3 = hashCelda(cx * 2.3 + 9, cy * 5.7);
    const lx = cx + 0.2 + h2 * 0.6 - (bx * 5 + 2.5), ly = cy + 0.2 + h3 * 0.6 - (by * 5 + 2.5);
    const X = Math.round(88 + (lx - ly) * 16), Y = Math.round(48 + (lx + ly) * 8), t = h / dens;
    if (t < 0.34) {
      // piedritas: dos o tres, con su luz arriba y su sombra abajo
      for (let i = 0; i < 2 + (h2 > 0.5 ? 1 : 0); i++) { const dx = Math.round((hashCelda(cx + i * 3.1, cy) - 0.5) * 12), dy = Math.round((hashCelda(cx, cy + i * 4.7) - 0.5) * 6), w = 2 + (i === 0 && h3 > 0.4 ? 1 : 0); g.fillStyle = 'rgba(0,0,0,0.42)'; g.fillRect(X + dx, Y + dy + 1, w, 1); g.fillStyle = 'rgba(210,200,180,0.34)'; g.fillRect(X + dx, Y + dy, w, 1); }
    } else if (t < 0.6) {
      // grieta: una línea quebrada fina
      g.strokeStyle = 'rgba(0,0,0,0.36)'; g.lineWidth = 1; g.beginPath(); g.moveTo(X - 6, Y + 0.5); g.lineTo(X - 2, Y + (h2 > 0.5 ? 2.5 : -1.5)); g.lineTo(X + 3, Y + 0.5); g.lineTo(X + 7, Y + (h3 > 0.5 ? -1.5 : 2.5)); g.stroke();
    } else if (t < 0.85 && PISO_VERDE.test(p.id)) {
      // mata de pasto: tres hebras
      for (let i = -1; i <= 1; i++) { g.fillStyle = i ? 'rgba(96,112,62,0.5)' : 'rgba(150,160,96,0.55)'; g.fillRect(X + i * 2, Y - 3 - (i ? 0 : 1), 1, 3 + (i ? 0 : 1)); }
    } else {
      // mancha: un parche apenas más oscuro o más claro, de borde irregular
      g.fillStyle = h2 > 0.5 ? 'rgba(0,0,0,0.16)' : 'rgba(230,215,185,0.07)';
      g.beginPath(); g.ellipse(X, Y, 7 + h3 * 9, 3 + h3 * 4, 0, 0, Math.PI * 2); g.fill(); g.beginPath(); g.ellipse(X + 5, Y + 2, 4 + h2 * 5, 2 + h2 * 2, 0, 0, Math.PI * 2); g.fill();
    }
  }
  detalles.set(idx, c); return c;
}
// ------------------------------------------------------------------ gobernador de calidad
// Si el aparato no da (cuadros por debajo de ~38 por segundo durante 4 s seguidos), se baja un escalón lo más caro de
// lo nuevo, y otro si sigue sin dar. No vuelve a subir en la sesión (para que no ande saltando).
//   2: todo   1: mitad de lluvia, charcos sin ondas y sin bruma   0: además, sin el matiz que multiplica el piso
export const calidadMundo = { nivel: 2, lento: 0, espera: 0 };
function gobernar(dt: number) {
  const c = calidadMundo; ambienteCfg.nivel = c.nivel; if ((window as any).__calidad !== undefined) { c.nivel = (window as any).__calidad; return; }
  if (c.nivel <= 0 || dt <= 0) return;
  if (c.espera > 0) { c.espera -= dt; return; }
  if (dt > 1 / 38 && dt < 0.25) c.lento += dt; else c.lento = Math.max(0, c.lento - dt * 2);
  if (c.lento > 4) { c.nivel--; c.lento = 0; c.espera = 6; }
}
// ------------------------------------------------------------------ la lluvia
// Lluvia de verdad, en dos capas. En el piso: charcos fijos del mapa que reflejan y se llenan de ondas, y cada gota que
// cae revienta en una coronita con salpicaduras. En el aire: dos cortinas de agua a distinta distancia que el viento
// inclina por ráfagas, una bruma baja y, cada tanto, un relámpago que blanquea todo con su trueno.
const salpicones: { x: number; y: number; t: number; d: number; g: number }[] = [];
const chorros: { x: number; y: number; v: number; l: number; c: number }[] = [];
let rafaga = 0, relampago = 0, proxRayo = 9 + Math.random() * 14;
const hashCelda = (x: number, y: number) => { const h = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return h - Math.floor(h); };
let charcosDe = '', charcosZona: { x: number; y: number; h: number; r: number }[] = [];
function lluviaSuelo(j: Juego, dt: number, t: number, aP: (x: number, y: number) => [number, number], aM: (x: number, y: number) => [number, number]) {
  const z = j.zona;
  const piso = (wx: number, wy: number) => { const cx = Math.floor(wx), cy = Math.floor(wy); return cx >= 0 && cy >= 0 && cx < z.W && cy < z.H && !!z.pisos[Math.floor(cy / 5) * z.tw + Math.floor(cx / 5)] && z.bloq[cy * z.W + cx] !== 2 && !(z.hueco && z.hueco[cy * z.W + cx]); };
  // charcos: salen del mapa (siempre en el mismo sitio). Solo donde TODO el charco cabe en piso libre y parejo: ninguna
  // casilla tapada ni otra baldosa (empedrado, losa) ni un objeto ni un desnivel bajo su mancha. Antes se miraba solo la
  // casilla del centro y el borde y las ondas caían encima de muros bajos, losas y bordes de camino.
  const clave = z.id + ':' + z.semilla;
  if (charcosDe !== clave) {
    charcosDe = clave; charcosZona = [];
    const tile = (cx: number, cy: number) => z.pisos[Math.floor(cy / 5) * z.tw + Math.floor(cx / 5)];
    for (let cy = 2; cy < z.H - 2; cy++) for (let cx = 2; cx < z.W - 2; cx++) {
      const h = hashCelda(cx, cy); if (h > 0.02) continue;
      const r = 9 + h * 600, n = r > 15 ? 2 : 1, t0 = tile(cx, cy), a0 = z.alturas ? z.alturas[cy * z.W + cx] : 0;
      let ok = !!t0;
      for (let dy = -n; dy <= n && ok; dy++) for (let dx = -n; dx <= n && ok; dx++) {
        const x = cx + dx, y = cy + dy, t1 = tile(x, y);
        if (z.bloq[y * z.W + x] || !piso(x, y) || !t1 || t1.id !== t0!.id || (z.alturas && Math.abs(z.alturas[y * z.W + x] - a0) > 0.05)) ok = false;
      }
      if (ok) for (const o of z.objetos) if (Math.abs(o.cx - (cx + 0.5)) < o.hw + n + 0.5 && Math.abs(o.cy - (cy + 0.5)) < o.hh + n + 0.5) { ok = false; break; }
      if (ok) charcosZona.push({ x: cx + 0.5, y: cy + 0.5, h, r });
    }
  }
  ctx.save();
  for (const c of charcosZona) {
    const [px, py] = aP(c.x, c.y), r = c.r, h = c.h; if (px < -40 || px > W + 40 || py < -20 || py > H + 20) continue;
    const gr = ctx.createRadialGradient(px, py, 0, px, py, r);
    gr.addColorStop(0, 'rgba(24,34,52,0.62)'); gr.addColorStop(0.75, 'rgba(28,40,60,0.5)'); gr.addColorStop(1, 'rgba(28,40,60,0)');
    ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
    // el reflejo del cielo y las ondas de las gotas que le caen (apagadas: de noche brillaban como neón)
    ctx.strokeStyle = `rgba(130,150,185,${0.1 + 0.06 * Math.sin(t * 2 + h * 900)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(px - r * 0.2, py - r * 0.12, r * 0.45, r * 0.16, 0, Math.PI, Math.PI * 1.9); ctx.stroke();
    if (calidadMundo.nivel >= 2) for (let k = 0; k < 2; k++) { const f = (t * (0.9 + k * 0.35) + h * 500 + k * 0.5) % 1, rr = r * (0.12 + f * 0.5); ctx.strokeStyle = `rgba(150,172,205,${0.2 * (1 - f)})`; ctx.beginPath(); ctx.ellipse(px + (k ? r * 0.2 : -r * 0.15), py + (k ? -r * 0.04 : r * 0.05), rr, rr * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  // gotas que revientan en el piso
  const porSeg = (E.tactil ? 170 : 300) * (0.75 + 0.5 * rafaga) * (calidadMundo.nivel >= 2 ? 1 : 0.5);
  for (let n = porSeg * dt + Math.random(); n >= 1; n--) {
    const sx = Math.random() * W, sy = Math.random() * H, [wx, wy] = aM(sx, sy);
    if (piso(wx, wy)) salpicones.push({ x: wx, y: wy, t: 0, d: 0.22 + Math.random() * 0.14, g: Math.random() });
  }
  for (let i = salpicones.length - 1; i >= 0; i--) {
    const s = salpicones[i]; s.t += dt; if (s.t >= s.d) { salpicones.splice(i, 1); continue; }
    const [px, py] = aP(s.x, s.y), f = s.t / s.d, X = Math.round(px), Y = Math.round(py);
    if (f < 0.25) { ctx.fillStyle = 'rgba(225,235,255,0.85)'; ctx.fillRect(X - 1, Y - 1, 2, 2); }
    else {
      // la corona: un aro que se abre y dos o tres gotitas que saltan y vuelven a caer
      const k = (f - 0.25) / 0.75, r = 2 + k * (4 + s.g * 3);
      ctx.strokeStyle = `rgba(190,208,240,${0.6 * (1 - k)})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(X, Y, r, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = `rgba(225,235,255,${0.8 * (1 - k)})`; const alto = Math.sin(k * Math.PI) * (4 + s.g * 4);
      ctx.fillRect(Math.round(X - 2 - k * 4), Math.round(Y - alto), 1, 1); ctx.fillRect(Math.round(X + 2 + k * 4), Math.round(Y - alto * 0.8), 1, 1); if (s.g > 0.5) ctx.fillRect(X, Math.round(Y - alto * 1.3), 1, 2);
    }
  }
  ctx.restore();
}
function lluviaAire(dt: number, t: number) {
  // el viento sopla por ráfagas: inclina las gotas y las apura
  rafaga = Math.max(0, Math.min(1, 0.5 + 0.5 * Math.sin(t * 0.37) + 0.3 * Math.sin(t * 1.3 + 2)));
  const n = Math.round((E.tactil ? 190 : 340) * (calidadMundo.nivel >= 2 ? 1 : 0.55)), incl = 0.16 + 0.3 * rafaga;
  if (chorros.length > n) chorros.length = n;
  while (chorros.length < n) chorros.push({ x: Math.random() * (W + 300), y: Math.random() * H, v: 0.7 + Math.random() * 0.6, l: 10 + Math.random() * 14, c: Math.random() < 0.3 ? 1 : 0 });
  ctx.save(); ctx.lineCap = 'butt';
  for (const capa of [0, 1]) {
    ctx.strokeStyle = capa ? `rgba(205,218,245,${0.34 + 0.1 * rafaga})` : 'rgba(150,165,200,0.2)'; ctx.lineWidth = capa ? 1.5 : 1; ctx.beginPath();
    for (const g of chorros) {
      if (g.c !== capa) continue;
      const v = (capa ? 980 : 720) * g.v * (0.85 + 0.35 * rafaga);
      if (!capa || true) { g.y += v * dt; g.x -= v * incl * dt; }
      if (g.y > H + 20) { g.y = -20 - Math.random() * 40; g.x = Math.random() * (W + 300); }
      const l = g.l * (capa ? 1.7 : 1);
      ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - l * incl, g.y + l);
    }
    ctx.stroke();
  }
  // bruma de agua que barre baja con cada ráfaga
  if (rafaga > 0.55 && calidadMundo.nivel >= 2) { const a = (rafaga - 0.55) * 0.16, x = W - ((t * 220) % (W + 500)); const gb = ctx.createLinearGradient(x, 0, x + 380, 0); gb.addColorStop(0, 'rgba(170,185,215,0)'); gb.addColorStop(0.5, `rgba(170,185,215,${a})`); gb.addColorStop(1, 'rgba(170,185,215,0)'); ctx.fillStyle = gb; ctx.fillRect(x, 0, 380, H); }
  // relámpago: dos fogonazos seguidos y el trueno un instante después
  proxRayo -= dt;
  if (proxRayo <= 0) { proxRayo = 14 + Math.random() * 22; relampago = 0.5; setTimeout(() => Sonido.efecto('trueno', { vol: 0.35 + Math.random() * 0.2 }), 350 + Math.random() * 900); }
  if (relampago > 0) {
    relampago -= dt; const k = relampago > 0.42 ? 1 : relampago > 0.34 ? 0.15 : relampago > 0.26 ? 0.8 : Math.max(0, relampago / 0.26) * 0.5;
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(190,205,255,${0.32 * k * acc.destellos})`; ctx.fillRect(0, 0, W, H);
  }
  ctx.restore();
}
// clima: lluvia, nieve, ceniza y niebla
const gotas: { x: number; y: number; v: number }[] = [];
const bancos: { x: number; y: number; r: number; v: number }[] = [];
function clima(j: Juego, dt: number, t: number) {
  const z = j.zona;
  // el clima de pixelfx de la zona; lo que ya dibuja no se repite con las partículas de siempre
  const pf = dibujarClimaPfx(ctx, j, W, H, t);
  if (!(window as any).__sinAmbiente) ambienteAire(j, dt, t, aPant);
  // el ambiente de la pelea con un jefe: la pantalla se cierra en su color, del piso suben sus motas (brasas, escarcha,
  // esporas, sombra) y, cuando se enfurece, los bordes laten en rojo
  { const jf = j.jefe as any, hh = j.heroe;
    if (jf && !jf.muerto && Math.hypot(jf.x - hh.x, jf.y - hh.y) < 18) {
      const RGB: Record<string, string> = { fuego: '255,110,40', frio: '140,205,255', rayo: '200,190,255', veneno: '120,220,70', sombra: '150,80,230', luz: '255,225,150', sangre: '220,30,30', fisico: '200,170,130' };
      const el = (jf.def?.elem as string) ?? 'fisico', rgb = RGB[el] ?? RGB.fisico, furia = (jf.fase ?? 0) >= 1, pulso = 0.5 + 0.5 * Math.sin(t * (furia ? 5.2 : 1.7));
      ambJefe.k = Math.min(1, ambJefe.k + dt * 0.8);
      const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.34, W / 2, H / 2, Math.max(W, H) * 0.72);
      g.addColorStop(0, `rgba(${rgb},0)`); g.addColorStop(1, `rgba(${furia ? '200,20,10' : rgb},${(0.13 + (furia ? 0.13 * pulso : 0.04 * pulso)) * ambJefe.k})`);
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // motas que suben desde el piso alrededor del jefe
      const n = E.tactil ? 22 : 40; while (ambJefe.m.length < n) ambJefe.m.push({ x: Math.random() * W, y: H * (0.3 + Math.random() * 0.7), v: 14 + Math.random() * 34, f: Math.random() * 6, s: 1 + Math.floor(Math.random() * 3) });
      ctx.globalCompositeOperation = el === 'sombra' || el === 'fisico' ? 'source-over' : 'lighter';
      const baja = el === 'frio';
      for (const q of ambJefe.m) {
        q.y += (baja ? q.v : -q.v) * dt * (furia ? 1.7 : 1); q.x += Math.sin(t * 1.3 + q.f) * 14 * dt;
        if (q.y < -6 || q.y > H + 6) { q.y = baja ? -4 : H + 4; q.x = Math.random() * W; }
        const a = (0.25 + 0.45 * Math.abs(Math.sin(t * 2.1 + q.f))) * ambJefe.k;
        ctx.fillStyle = `rgba(${furia && q.s === 1 ? '255,60,30' : rgb},${a})`; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.s, q.s);
      }
      ctx.restore();
    } else { ambJefe.k = 0; } }
  // sangre en el lente: goterones en los bordes de la pantalla que escurren y se apagan
  { const le = (j as any).lente as { t: number; sem: number; n: number; color: string } | null;
    if (le) { const k = (j.t - le.t) / 2.4;
      if (k >= 1 || k < 0) (j as any).lente = null;
      else { const hh = (i: number) => { const q = Math.sin(le.sem + i * 91.7) * 43758.5; return q - Math.floor(q); };
        ctx.save(); ctx.globalAlpha = Math.min(1, (1 - k) * 1.6) * 0.78; ctx.fillStyle = le.color;
        for (let i = 0; i < le.n; i++) {
          const lado = i % 4, f = hh(i), m = 14 + hh(i + 40) * 70;
          const x = lado === 0 ? m : lado === 1 ? W - m : f * W, y = lado === 2 ? m : lado === 3 ? H - m - 90 : f * (H - 120), u = 5 + Math.floor(hh(i + 7) * 4);
          // el goterón: un racimo de cuadros gruesos, y un hilo que escurre hacia abajo
          for (let q = 0; q < 7; q++) { const ax = (hh(i * 13 + q) - 0.5) * u * 5, ay = (hh(i * 17 + q) - 0.5) * u * 4, tq = u * (0.6 + hh(i + q * 3)); ctx.fillRect(Math.round(x + ax), Math.round(y + ay), Math.ceil(tq), Math.ceil(tq)); }
          ctx.fillRect(Math.round(x), Math.round(y), Math.max(2, u >> 1), Math.round(10 + k * (50 + hh(i + 3) * 70)));
        }
        ctx.restore(); } } }
  if (z.niebla && !pf.niebla) {
    if (!bancos.length) for (let i = 0; i < 14; i++) bancos.push({ x: R() * W, y: R() * H, r: 80 + R() * 140, v: 6 + R() * 10 });
    ctx.save();
    for (const b of bancos) {
      b.x += b.v * dt; if (b.x - b.r > W) b.x = -b.r;
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r); g.addColorStop(0, `rgba(150,150,160,${z.niebla * 0.22 * (1 - 0.75 * cercaMon)})`); g.addColorStop(1, 'rgba(150,150,160,0)');
      ctx.fillStyle = g; ctx.fillRect(b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
    }
    ctx.restore();
  }
  if (z.lluvia && z.tipo !== 'mazmorra') { if (!(window as any).__sinLluvia) lluviaAire(dt, t); return; }
  const tipo = z.lluvia ? 'lluvia' : z.nieve ? 'nieve' : z.ceniza ? 'ceniza' : null;
  if (!tipo || z.tipo === 'mazmorra' || (tipo === 'lluvia' && pf.lluvia) || (tipo === 'nieve' && pf.nieve)) return;
  const n = tipo === 'lluvia' ? 160 : 110;
  while (gotas.length < n) gotas.push({ x: R() * W, y: R() * H, v: 0.6 + R() * 0.6 });
  ctx.save();
  if (tipo === 'lluvia') { ctx.strokeStyle = 'rgba(150,160,190,0.35)'; ctx.lineWidth = 1; ctx.beginPath(); for (const g of gotas) { g.y += 700 * g.v * dt; g.x -= 90 * g.v * dt; if (g.y > H) { g.y = -10; g.x = R() * W * 1.2; } ctx.moveTo(g.x, g.y); ctx.lineTo(g.x - 3, g.y + 14 * g.v); } ctx.stroke(); }
  else { ctx.fillStyle = tipo === 'nieve' ? 'rgba(235,240,255,0.8)' : 'rgba(255,140,60,0.75)'; for (const g of gotas) { g.y += (tipo === 'nieve' ? 50 : -30) * g.v * dt; g.x += Math.sin(t + g.v * 10) * 20 * dt; if (g.y > H) g.y = -4; if (g.y < -5) g.y = H; ctx.fillRect(g.x, g.y, 2, 2); } }
  ctx.restore();
}

/** Halo dorado que late bajo las cosas de misión, para que se encuentren en la oscuridad. */
function haloMision(px: number, py: number, t: number, destino: boolean) {
  const k = 0.55 + 0.45 * Math.sin(t * 3.2);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const r = destino ? 46 : 30;
  const g = ctx.createRadialGradient(px, py, 2, px, py, r);
  g.addColorStop(0, `rgba(255,200,110,${0.42 * k})`); g.addColorStop(0.6, `rgba(255,150,50,${0.16 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, r, r * 0.5, 0, 0, Math.PI * 2); ctx.fill();
  if (destino) { ctx.strokeStyle = `rgba(255,210,120,${0.5 * k})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(px, py, r * 0.8, r * 0.4, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
}

// ------------------------------------------------------------------ sangre en el piso
// Sellos procedurales en caché (forma, variante y color). Cuando lleguen los de la Forja, selloSangre devuelve su sprite.
const sellos = new Map<string, HTMLCanvasElement>();
function selloSangre(forma: string, sem: number, color: string): HTMLCanvasElement {
  const k = `${forma}|${sem}|${color}`; let c = sellos.get(k); if (c) return c;
  c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d')!, r = rng(sem * 7919 + forma.length * 131);
  const mancha = (x: number, y: number, rad: number, a = 1) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, color); gr.addColorStop(0.7, color); gr.addColorStop(1, color + '00'); g.globalAlpha = a; g.fillStyle = gr; g.beginPath(); g.arc(x, y, rad, 0, Math.PI * 2); g.fill(); };
  if (forma === 'charco') {
    for (let i = 0; i < 9; i++) mancha(64 + (r() - 0.5) * 40, 64 + (r() - 0.5) * 40, 16 + r() * 22, 0.9);
    // centro más oscuro y espeso
    g.globalAlpha = 0.45; g.fillStyle = '#000'; g.beginPath(); g.arc(64, 64, 18, 0, Math.PI * 2); g.fill();
    for (let i = 0; i < 6; i++) { const a = r() * Math.PI * 2, d = 44 + r() * 14; mancha(64 + Math.cos(a) * d, 64 + Math.sin(a) * d, 3 + r() * 4, 0.9); }
  } else if (forma === 'salpicadura') {
    // gota grande atrás y el chorro hacia +x, con gotas que se alejan
    mancha(34, 64, 16 + r() * 6, 0.95);
    for (let i = 0; i < 7; i++) mancha(40 + i * 9, 64 + (r() - 0.5) * 10, 9 - i * 0.8 + r() * 3, 0.85);
    for (let i = 0; i < 12; i++) { const x = 60 + r() * 62, y = 64 + (r() - 0.5) * (14 + (x - 60) * 0.5); mancha(x, y, 1.5 + r() * 3.5, 0.95); }
  } else if (forma === 'rastro') {
    for (let i = 0; i < 3; i++) mancha(44 + i * 18 + r() * 6, 64 + (r() - 0.5) * 12, 6 + r() * 5, 0.9);
  } else {
    mancha(64, 64, 14 + r() * 10, 0.9);
    for (let i = 0; i < 4; i++) { const a = r() * Math.PI * 2; mancha(64 + Math.cos(a) * 22, 64 + Math.sin(a) * 22, 2 + r() * 3, 0.9); }
  }
  g.globalAlpha = 1; sellos.set(k, c); return c;
}
/** La sangre se dibuja acostada en el piso isométrico, girada hacia donde salió el golpe. */
/** Rumbo de pantalla (8 sectores) de un ángulo del mundo, como los nombres del kit de gore. */
function rumbo(ang: number): string { const dx = Math.cos(ang), dy = Math.sin(ang); const sx = dx - dy, sy = (dx + dy) * 0.5; const a = Math.atan2(sy, sx); const i = Math.round(a / (Math.PI / 4)); return (['e', 'se', 's', 'so', 'o', 'no', 'n', 'ne'] as const)[((i % 8) + 8) % 8]; }
/** El sello del kit de gore de la Forja para esta mancha (o null si su atlas no está). */
function selloGore(m: Mancha): { q: Cuadro; esc: number } | null {
  const sup = m.sup ?? 'piedra', pal = m.pal ?? 'rojo';
  let id = '', v = '', fi = 0;
  if (m.forma === 'salpicadura') { id = 'gore_salpicadura'; v = pal === 'rojo' ? `${sup}_${rumbo(m.ang ?? 0)}` : `${pal}_${rumbo(m.ang ?? 0)}`; }
  else if (m.forma === 'charco') { id = 'gore_charco'; v = pal === 'rojo' ? sup : pal; }
  else if (m.forma === 'rastro') { id = 'gore_rastro'; v = `${sup}_${rumbo(m.ang ?? 0)}`; }
  else { id = 'gore_gotas'; v = `${sup}_${(['dispersas', 'hilera_x', 'hilera_y'])[(m.sem ?? 0) % 3]}`; }
  const meta = objetoMeta(id, v); if (!meta || !meta.f.length) return null;
  // el charco crece en sus 8 cuadros una sola vez y se queda en el último
  if (m.forma === 'charco') fi = Math.min(meta.f.length - 1, Math.floor((m.t * 25) / (meta.t || 4)));
  else fi = (m.sem ?? 0) % meta.f.length;
  const nominal = m.forma === 'charco' ? 1.1 : m.forma === 'salpicadura' ? 0.7 : 0.35;
  return { q: meta.f[fi], esc: Math.max(0.45, Math.min(1.5, (m.rmax ?? m.r) / nominal)) };
}
function dibujarSangre(m: Mancha, px: number, py: number) {
  const g = m.tipo === 'sangre' ? selloGore(m) : null;
  if (g) { ctx.save(); ctx.globalAlpha = 0.95; const ok = dibujar(ctx, g.q, px, py, g.esc); ctx.restore(); if (ok) return; }
  const st = selloSangre(m.forma!, m.sem ?? 0, m.color);
  const tam = m.r * 36;
  ctx.save(); ctx.globalAlpha = 0.9; ctx.translate(px, py); ctx.scale(1, 0.5); ctx.rotate((m.ang ?? 0) + Math.PI / 4);
  ctx.drawImage(st, -tam, -tam, tam * 2, tam * 2);
  ctx.restore();
}
