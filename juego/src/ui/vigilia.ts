// La vigilia (elegir héroe guardado, `dibujarSeleccion` en ui/menus.ts): el héroe elegido de pie junto a su fogata, con
// exactamente lo que lleva puesto, vivo; y las cartas de la galería con cada héroe vestido.
//
// Rick, 21 nov 2026: "quiero que hagas estas animaciones mejores, más pro, más sprites, más todo". Antes el grande era el
// sprite del mundo agrandado a puntos gruesos (o un retrato liso de cuatro cuadros), con la espada en llamas como un bloque
// amarillo, y las cartas mostraban el héroe de salida (pelo y vestido) aunque llevara capucha, escudo y espada.
//
// Ahora:
// - El grande es la presentación de la clase del motor (acción 'seleccion', motor/vigilia.ts): 36 cuadros de reposo a 12
//   por segundo (respira, pasa el peso de un pie al otro, la tela y el pelo se mecen) y el gesto de la clase (12 cuadros)
//   al elegirlo y cada 10 s, pintados a K veces su alto con la luz de la fogata horneada, en pixel art a puntos enteros del
//   aparato (un lienzo propio a la resolución del héroe, pegado sin suavizar a d puntos por punto).
// - Al elegirlo aparece desde la penumbra: la fogata se aviva y la luz le sube por el cuerpo.
// - La fogata está a su lado de verdad (la de la presentación de las clases, con el fuego de Doom): lo calienta con su
//   latido (la luz avanzada reilumina el relieve, `spriteConLuz`; la clásica suma el calor horneado del lado del fuego),
//   le tira la sombra en el piso y suelta brasas que pasan por delante y por detrás. Cae ceniza, y la lluvia le salpica
//   en la cabeza y los hombros.
// - El arma viva es la del mundo (arma_viva.ts) a la escala de la figura, con su propia bolsa de partículas.
// - Las cartas llevan al héroe vestido (el reposo del mundo pintado a la escala de la carta); la elegida respira con una
//   brasa que corre por el canto y el héroe adentro se mueve; al pasar el ratón se encienden; «Nuevo héroe» con su forja.
//
// Pulido (21 nov 2026, "acomodá lo flojo"): el boceto a media K sale primero (motor/vigilia.ts) y se ve a puntos dobles
// con su luz mientras llega el de verdad; un velo oscuro detrás del héroe lo despega del campamento del fondo (se le veía
// pegado a la cadera un farol azul del campamento, que parecía horneado en el gesto); la luz avanzada no quema lo claro
// (`quema` en luz_gpu.ts: el cuello de piel de la arcanista salía blanco); la fogata va con la grilla fina (`fuegoSueltoFino`,
// celdas de 2 o 3 puntos del aparato como el título: a 1080 eran de 7); las chispas del gesto son de verdad (estallido, estela
// y brasas a la escala de la figura); y en el gesto la llama del arma sigue a la hoja (`armaRapida`: antes quedaba medio paso
// atrás). `__sinVelo`, `__fogataGruesa`, `__chispasViejas` y `__llamaLenta` vuelven a lo de antes, cada uno lo suyo.
//
// `__vigiliaVieja = true` vuelve a lo de antes. `__tSel` fija el reloj de esta pantalla (las pruebas).
import { ctx, W, H } from '../nucleo/lienzo';
import { cuadrosHeroe, objetoMeta, dibujar, dibujarTenido, type Cuadro } from '../motor/assets';
import { cuadrosDeFirma } from '../motor/pintor';
import { pedirVigilia, cuadroV, bocetoV, kBoceto, cercano, SEL_N, SEL_ENT, SEL_FPS, CARTA_N, type CuadroV, type Pedido } from '../motor/vigilia';
import { equipoVisual, firmaVisual, cuerpoDe, calcular, type DatosHeroe } from '../juego/heroe';
import { armaViva, llamaArmaAtras, dibujarDerrames, pozoArma, type ElemArma } from '../render/arma_viva';
import { spriteConLuz, lab } from '../render/luz_gpu';
import { luzFogataSprite, FICHA } from './seleccion';
import { fuegoMundo, dibujarFuegosMundo } from '../render/fuego';
import { fuegoSuelto, dibujarVivos, fuegoSueltoFino, dibujarVivosPixel } from '../render/fuego_vivo';
import { armaRapida } from '../render/fuego_especial';

/** Alto del héroe de la presentación por unidad de K (con la capucha o el casco), en puntos del cuadro. */
const REF = 106;
/** Alto del héroe del mundo (la carta). */
const REF_C = 84;
/** Tope de K: más grande el cuerpo del motor no aguanta (mejor puntos dobles). */
const KMAX = 2.6;
export const vigiliaVieja = () => !!(window as any).__vigiliaVieja;

// ------------------------------------------------------------------ lo que lleva puesto (se arma solo cuando cambia)
interface Vestido { k: string; eq: any; firma: string; eqMundo: any; firmaMundo: string; el: ElemArma | null; tipo: string; cuerpo: any }
const vestidos = new Map<string, Vestido>();
function vestido(d: DatosHeroe): Vestido {
  const k = d.clase + '|' + Object.entries(d.equipo).map(([c, o]) => c + ':' + (o ? o.uid + '.' + (o.engarces?.length ?? 0) + '.' + (o as any).vivo : '')).join(',');
  let v = vestidos.get(d.id);
  if (!v || v.k !== k) {
    const c = calcular(d), ar = d.equipo.arma as any;
    const el = (c.vivo ?? (ar && (ar.rareza === 'unico' || ar.rareza === 'legendario') ? 'acero' : null)) as ElemArma | null;
    const eqMundo = equipoVisual(d), firmaMundo = firmaVisual(d), eq = { ...eqMundo }, elv = el && (el as string) !== 'fisico' ? el : null;
    // con arma viva, la hoja va limpia: el elemento lo pone arma_viva.ts encima (el encanto horneado del motor era el bloque
    // amarillo que tapaba la hoja); sin ella, el encanto queda
    if (elv && eq.arma?.encanto) eq.arma = { ...eq.arma, encanto: undefined };
    v = { k, eq, firma: firmaMundo + (elv ? '|limpia' : ''), eqMundo, firmaMundo, el: elv, tipo: c.tipoArma, cuerpo: cuerpoDe(d.clase) };
    vestidos.set(d.id, v);
  }
  return v;
}

// ------------------------------------------------------------------ azar fijo (todo sale del reloj: el video se repite igual)
const hash = (a: number, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const suave = (x: number) => { const k = Math.max(0, Math.min(1, x)); return k * k * (3 - 2 * k); };

// ------------------------------------------------------------------ el grande
const portador = { acc: 'quieto', t: 0, id: 913 };
const pozo: unknown[] = [];
let escenario: { cv: HTMLCanvasElement; c: CanvasRenderingContext2D } | null = null;
const estado = { id: '', tAp: -1 as number, tPrev: 0 };
export let infoVigilia: Record<string, unknown> = {};

/**
 * Qué cuadro de la presentación toca a los `tc` segundos de elegido: el gesto al principio y después de cada dos vueltas
 * del reposo (que empalma su último cuadro con el primero). Sin el gesto pintado entero, el reposo sigue.
 */
const CICLO_V = (SEL_ENT + 2 * (SEL_N - SEL_ENT)) / SEL_FPS;
export function cuadroVigilia(tc: number, gestoListo: boolean): { f: number; gesto: boolean } {
  // (el ciclo es el gesto más dos vueltas justas del reposo: el gesto arranca siempre donde el reposo vuelve a su primera
  //  pose, sin salto)
  const P = CICLO_V, u = ((tc % P) + P) % P;
  if (u < SEL_ENT / SEL_FPS && gestoListo) return { f: Math.min(SEL_ENT - 1, Math.floor(u * SEL_FPS)), gesto: true };
  const lt = u < SEL_ENT / SEL_FPS ? u : u - SEL_ENT / SEL_FPS;
  return { f: SEL_ENT + (Math.floor(lt * SEL_FPS) % (SEL_N - SEL_ENT)), gesto: false };
}

/** K (el tamaño al que se pinta el grande) y d (puntos del aparato por punto suyo, entero) para `alto` puntos lógicos. */
function escalaGrande(alto: number, s: number) {
  // (redondeado: un poco más alto que el tope va a K tope y un punto por punto; recién pasando 1,5 veces, puntos dobles)
  const meta = alto * s, d = Math.max(1, Math.round(meta / (REF * KMAX)));
  return { d, K: Math.max(1, Math.min(KMAX, Math.round((meta / (REF * d)) * 20) / 20)) };
}
/** Las medidas de la pantalla (las mismas que usa `dibujarSeleccion`): si es chica, el nicho de las cartas y el alto del héroe. */
export function medidasVigilia() {
  const chico = H < 520 || W < 760;
  const nichoH = Math.round(chico ? Math.max(74, H * 0.23) : Math.min(150, H * 0.2)), galY = H - nichoH - (chico ? 8 : 20);
  return { chico, nichoH, galY, alto: Math.min(chico ? 230 : 280, galY - (chico ? 64 : 120)) };
}
/**
 * Mientras se está en la portada, el héroe que va a salir primero en la vigilia se va pintando (con menos prioridad):
 * al entrar ya está o le falta poco. Lo llama main.ts en cada cuadro del menú.
 */
/**
 * El pedido del grande de un héroe, el mismo que pinta la vigilia (misma K, mismo equipo: sale de IndexedDB si ya se
 * pintó al elegirlo). Lo usa el primer plano de las cinemáticas (ui/cine_rostro.ts). `prio` 0 en segundo plano.
 */
export function pedidoGrande(hr: DatosHeroe, prio = 0) {
  const v = vestido(hr), { K } = escalaGrande(medidasVigilia().alto, ctx.getTransform().a);
  return pedirVigilia('grande', hr.clase, v.cuerpo, v.eq, v.firma, K, prio);
}
export function precalentarVigilia(hr: DatosHeroe | undefined) {
  if (!hr || vigiliaVieja()) return;
  const v = vestido(hr), { K } = escalaGrande(medidasVigilia().alto, ctx.getTransform().a);
  pedirVigilia('grande', hr.clase, v.cuerpo, v.eq, v.firma, K, 1);
}

/**
 * El héroe de la vigilia: los pies en (hx, hy) y `alto` puntos lógicos de alto, `tc` segundos desde que se eligió. Dibuja
 * la fogata, su luz en el piso, la sombra, el héroe con su arma viva, la lluvia que le pega, la ceniza y las brasas.
 */
export function heroeVigilia(hr: DatosHeroe, hx: number, hy: number, alto: number, t: number, tc: number, chico: boolean) {
  const v = vestido(hr);
  if (estado.id !== hr.id + '|' + v.firma) { estado.id = hr.id + '|' + v.firma; estado.tAp = -1; pozo.length = 0; }
  const dt = Math.max(0, Math.min(0.05, t - estado.tPrev)); estado.tPrev = t;
  const t0 = performance.now();
  // ---- la escala: K (el tamaño al que se pinta) y d (puntos del aparato por punto del héroe), enteros los d
  const m = ctx.getTransform(), s = m.a, { K, d } = escalaGrande(alto, s);
  const p = pedirVigilia('grande', hr.clase, v.cuerpo, v.eq, v.firma, K, 2);
  // ---- qué cuadro: el que toca, o el pintado más cercano mientras llegan los demás
  let gestoListo = true; for (let f = 0; f < SEL_ENT; f++) if (!p.crudos[f]) { gestoListo = false; break; }
  const want = cuadroVigilia(tc, gestoListo);
  const fd = want.gesto ? want.f : cercano(p, want.f, SEL_ENT, SEL_N);
  const q = fd !== null ? cuadroV(p, fd) : null;
  // sin ningún cuadro del reposo todavía: el boceto (el arranque del reposo a media K, sale en un segundo)
  const qb = q ? null : bocetoV(p);
  if ((q || qb) && estado.tAp < 0) estado.tAp = tc < 0.15 ? 0 : tc;
  // la entrada: la luz sube desde la penumbra en 0,9 s desde que hay héroe que mostrar
  const luzK = q || qb ? suave((tc - estado.tAp) / 0.9) : 0;
  const pulF = 0.78 + 0.14 * Math.sin(t * 9.1) * Math.sin(t * 3.7 + 1) + 0.08 * Math.sin(t * 23);
  const aviva = 1 + 0.5 * Math.exp(-Math.max(0, tc - (estado.tAp < 0 ? tc : estado.tAp) - 0.25) * 3) * (q ? 1 : 0.3);
  // ---- la fogata: delante y a la izquierda de su cara (la luz horneada viene de ahí)
  const fx = hx - alto * (chico ? 0.42 : 0.45), fy = hy + alto * 0.075, fe = alto / 225;
  // el velo: la noche se cierra un poco detrás del héroe, así su silueta se despega del campamento del fondo (antes un farol
  // azul de una tienda quedaba pegado a la cadera de la arcanista y parecía parte del gesto)
  if (!(window as any).__sinVelo) {
    ctx.save(); ctx.translate(hx + alto * 0.04, hy - alto * 0.46); ctx.scale(alto * 0.5, alto * 0.72);
    const gv = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); gv.addColorStop(0, 'rgba(5,3,3,0.78)'); gv.addColorStop(0.55, 'rgba(5,3,3,0.55)'); gv.addColorStop(1, 'rgba(5,3,3,0)');
    ctx.fillStyle = gv; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  // su luz en el piso (antes que todo: la sombra es justamente donde esa luz no llega)
  {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(fx, fy); ctx.scale(1, 0.5);
    const rl = alto * (1.25 + 0.15 * pulF) * (0.75 + 0.25 * aviva), gl = ctx.createRadialGradient(0, 0, 6, 0, 0, rl);
    gl.addColorStop(0, `rgba(255,150,60,${0.4 * pulF * (0.6 + 0.4 * luzK)})`); gl.addColorStop(0.4, `rgba(255,110,40,${0.18 * pulF})`); gl.addColorStop(1, 'rgba(255,90,30,0)');
    ctx.fillStyle = gl; ctx.fillRect(-rl, -rl, rl * 2, rl * 2); ctx.restore();
  }
  const tA = performance.now();
  motas(t, hx, hy, alto, fx, fy, s, false, chico);
  const tB = performance.now();
  // ---- el escenario del héroe, a su resolución
  const RK = REF * K, sw = Math.ceil(RK * 1.7), sh = Math.ceil(RK * 1.42), px = Math.round(sw * 0.5), py = sh - Math.round(RK * 0.14);
  if (!escenario) { const cv = document.createElement('canvas'); escenario = { cv, c: cv.getContext('2d')! }; }
  const { cv, c } = escenario;
  if (cv.width !== sw || cv.height !== sh) { cv.width = sw; cv.height = sh; }
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over'; c.imageSmoothingEnabled = false; c.clearRect(0, 0, sw, sh);
  const kd = s / d; // puntos del héroe por punto lógico
  const fsx = (fx - hx) * kd, fsy = (fy - hy) * kd; // la fogata respecto de los pies, en puntos del héroe
  // la sombra en el piso: tres anillos bajo los pies
  pie(c, px, py, Math.round(14 * K), luzK);
  const vivo = !!(v.el && q?.hoja && !(window as any).__sinDerrame);
  const qv = vivo ? ({ hoja: q!.hoja!.map((x, i) => (i === 4 ? x : x / K)) } as any) : null;
  // en el gesto la hoja da media vuelta por cuadro: la llama se enfría detrás de ella y sube un paso más (fuego_especial.ts)
  armaRapida(portador, want.gesto && !(window as any).__llamaLenta);
  const z = q ? 1 : Math.max(1, Math.round(K / kBoceto(K))), zb = z;
  if (q || qb) {
    const qs = (q ?? qb)!, z = zb;
    // la sombra que tira la fogata: la silueta del mismo cuadro echada hacia el lado contrario, que late con la llama
    const gx = -fsx, gy = -fsy * 2, dd = Math.hypot(gx, gy) || 1, L = (0.95 + 0.1 * (1 - pulF)) * 1.05;
    const ssx = (gx / dd) * L, ssy = Math.min(-0.22, (gy / dd) * 0.5 * L);
    c.save(); c.translate(px, py + 1); c.transform(1, 0, -ssx, -ssy, 0, 0);
    c.globalAlpha = 0.5 * luzK * (0.82 + 0.18 * pulF); c.drawImage(qs.sil!, 0, 0, qs.w, qs.h, -qs.ax * z, -qs.ay * z, qs.w * z, qs.h * z); c.restore(); c.globalAlpha = 1;
  }
  pozoArma(pozo);
  try {
    // (en el gesto no va el barrido del cuadro anterior: con la hoja dando media vuelta por cuadro dejaba la llama atrás)
    if (vivo && q) { c.save(); c.translate(px, py); c.scale(K, K); llamaArmaAtras(c, portador, qv, 0, 0, 1, v.el!, v.tipo, t + (want.gesto && !(window as any).__llamaLenta ? 1 : 0), dt, 0, 0); c.restore(); }
    if (!q && qb) {
      // el boceto: a puntos dobles, con su calor que late y su penumbra de entrada (todavía sin el arma viva ni la luz avanzada)
      const bx = px - qb.ax * z, by = py - qb.ay * z;
      c.drawImage(qb.cv, 0, 0, qb.w, qb.h, bx, by, qb.w * z, qb.h * z);
      c.globalCompositeOperation = 'lighter'; c.globalAlpha = luzK * Math.max(0, 0.1 + 0.55 * (pulF - 0.7)) * (0.8 + 0.4 * (aviva - 1)); c.drawImage(qb.calor!, 0, 0, qb.w, qb.h, bx, by, qb.w * z, qb.h * z); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1;
      if (luzK < 1) { c.globalAlpha = (1 - luzK) * 0.94; c.drawImage(qb.sil!, 0, 0, qb.w, qb.h, bx, by, qb.w * z, qb.h * z); c.globalAlpha = 1; }
    } else if (q) {
      // la luz avanzada: la fogata reilumina el relieve punto por punto; si no, el horneado y su calor que late
      const luz = { ...luzFogataSprite(fsx, fsy, 1, t, pulF), quema: (window as any).__quemaVieja ? 0 : 1 };
      const gpu = lab.on ? spriteConLuz({ img: q.cv, atlas: q.atlas, x: 0, y: 0, w: q.w, h: q.h, ax: q.ax, ay: q.ay, rel: q.rel, alt: q.alt } as Cuadro, luz) : null;
      c.drawImage(gpu ?? q.cv, 0, 0, q.w, q.h, px - q.ax, py - q.ay, q.w, q.h);
      if (!gpu) { c.globalCompositeOperation = 'lighter'; c.globalAlpha = luzK * Math.max(0, 0.1 + 0.55 * (pulF - 0.7)) * (0.8 + 0.4 * (aviva - 1)); c.drawImage(q.calor!, px - q.ax, py - q.ay); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; }
      // la penumbra de la entrada: la silueta oscura que se va con la luz
      if (luzK < 1) { c.globalAlpha = (1 - luzK) * 0.94; c.drawImage(q.sil!, px - q.ax, py - q.ay); c.globalAlpha = 1; }
    } else {
      // todavía no está el grande: el de su carta (ya vestido, sale en un segundo) agrandado a puntos enteros y en la
      // penumbra; si tampoco, su silueta (la del mundo, con su equipo si el pintor ya la tiene)
      const pc = cartaDe.get(hr.id), fc = pc ? cercano(pc, Math.floor(t * 6) % CARTA_N, 0, CARTA_N) : null, qc = pc && fc !== null ? cuadroV(pc, fc) : null;
      if (qc && pc) {
        const z = Math.max(1, Math.round(K / pc.K));
        c.drawImage(qc.cv, 0, 0, qc.w, qc.h, px - qc.ax * z, py - qc.ay * z, qc.w * z, qc.h * z);
        c.globalAlpha = 0.72; c.drawImage(qc.sil!, 0, 0, qc.w, qc.h, px - qc.ax * z, py - qc.ay * z, qc.w * z, qc.h * z); c.globalAlpha = 1;
      } else {
        const fs = cuadrosDeFirma(v.firmaMundo, 'quieto', 'so') ?? cuadrosHeroe(hr.clase, 'quieto', 'so'), qm = fs[Math.floor(t * 4) % Math.max(1, fs.length)];
        if (qm) { c.globalAlpha = 0.9; dibujarTenido(c, qm, px, py, '#07060a', 1, K); c.globalAlpha = 1; }
      }
    }
    if (vivo && q) {
      c.save(); c.translate(px, py); c.scale(K, K);
      armaViva(c, portador, qv, 0, 0, 1, v.el!, v.tipo, t, dt, 0, 0, Math.max(0.35, luzK), false);
      dibujarDerrames(c, 0, 0, dt);
      c.restore();
    } else pozo.length = 0;
  } finally { pozoArma(); }
  if (q) { lluvia(c, q, px, py, t, luzK); if (want.gesto) ((window as any).__chispasViejas ? gestoViejo : gesto)(c, q, px, py, K, hr.clase, (((tc % CICLO_V) + CICLO_V) % CICLO_V) / (SEL_ENT / SEL_FPS)); }
  const tC = performance.now();
  // ---- a la pantalla, a puntos enteros del aparato y sin suavizar
  const HX = m.a * hx + m.e, HY = m.d * hy + m.f, OX = Math.round(HX - px * d), OY = Math.round(HY - py * d);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, 0, 0, sw, sh, OX, OY, sw * d, sh * d); ctx.restore();
  // ---- la fogata, delante (más cerca de la cámara que el héroe)
  const tD = performance.now();
  fogata(fx, fy, fe, t, aviva, chico);
  const tE = performance.now();
  motas(t, hx, hy, alto, fx, fy, s, true, chico);
  const tF = performance.now();
  const pr = ((window as any).__vigiliaPartes ??= { piso: 0, motas: 0, heroe: 0, pegar: 0, fogata: 0, n: 0 });
  pr.piso += tA - t0; pr.motas += tB - tA + tF - tE; pr.heroe += tC - tB; pr.pegar += tD - tC; pr.fogata += tE - tD; pr.n++;
  const rc = ctx.canvas.getBoundingClientRect(), kx = rc.width / ctx.canvas.width;
  infoVigilia = { hechos: p.hechos, n: p.n, listo: p.hechos === p.n, gestoListo, f: fd, quiere: want.f, gesto: want.gesto, K, d, luzK: +luzK.toFixed(2), boceto: !q && !!qb, msBoceto: Math.round(p.tBoceto), ms1: Math.round(p.tListo1), msPares: Math.round(p.tPares), msGesto: Math.round(p.tGesto), msReposo: Math.round(p.tReposo), msTodo: Math.round(p.tListo), gpu: lab.on, css: [rc.left + OX * kx, rc.top + OY * kx, sw * d * kx, sh * d * kx], ms: +(performance.now() - t0).toFixed(2) };
}

/** La sombra a los pies, en anillos de pixel. */
function pie(c: CanvasRenderingContext2D, px: number, py: number, rx: number, k: number) {
  const ry = Math.max(2, Math.round(rx * 0.36));
  for (const [f, a] of [[1, 0.2], [0.7, 0.24], [0.42, 0.28]] as const) {
    const ex = Math.round(rx * f), ey = Math.max(1, Math.round(ry * f)); c.fillStyle = `rgba(4,2,1,${a * (0.4 + 0.6 * k)})`;
    for (let yy = -ey; yy <= ey; yy++) { const w = Math.round(ex * Math.sqrt(Math.max(0, 1 - (yy * yy) / (ey * ey + 0.01)))); c.fillRect(px - w + 2, py + yy, w * 2 - 1, 1); }
  }
}

/** La lluvia que le pega: gotas que caen hasta el techo de la silueta y salpican en la cabeza y los hombros. */
function lluvia(c: CanvasRenderingContext2D, q: CuadroV, px: number, py: number, t: number, k: number) {
  if (!q.techo || k < 0.3) return;
  const N = 9, x0 = px - q.ax;
  for (let i = 0; i < N; i++) {
    const ritmo = 1.3 + hash(i, 3) * 0.9, u = t * ritmo + hash(i, 7), ciclo = Math.floor(u), fr = u - ciclo;
    let col = Math.floor(hash(i, ciclo) * q.w), y = q.techo[col];
    if (y < 0) continue;
    // solo lo que mira arriba de verdad: la cabeza, los hombros, el canto del escudo (no los costados de la túnica)
    if (y > q.h * 0.55) continue;
    const gy = py - q.ay + y, gx = x0 + col;
    c.globalCompositeOperation = 'lighter';
    if (fr < 0.18) { // la gota que llega (una raya corta que se corta en la figura)
      const largo = 6, yy = gy - Math.round((0.18 - fr) * 90);
      c.fillStyle = `rgba(150,170,200,${0.32 * k})`; c.fillRect(gx - Math.round((0.18 - fr) * 18), yy - largo, 1, largo);
    } else if (fr < 0.34) { // la salpicadura: dos gotitas que saltan a los lados y una corona
      const e = (fr - 0.18) / 0.16, al = (1 - e) * 0.55 * k;
      c.fillStyle = `rgba(190,205,230,${al})`;
      c.fillRect(gx - 1, gy - 1, 3, 1);
      c.fillRect(gx - 1 - Math.round(e * 3), gy - 1 - Math.round(Math.sin(e * Math.PI) * 3), 1, 1);
      c.fillRect(gx + 1 + Math.round(e * 3), gy - 1 - Math.round(Math.sin(e * Math.PI) * 2.5), 1, 1);
    }
    c.globalCompositeOperation = 'source-over';
  }
}

/**
 * El gesto de la clase (u de 0 a 1 mientras dura): el estallido de la mano del arma. Un fogonazo y un aro de pixel que se
 * abre al empezar, chispas que salen de todo el largo de la hoja con su estela (de blanco al color de la clase y a brasa),
 * caen un poco y se apagan, y unas brasas gruesas que suben. Todo a la escala de la figura (K): antes eran puntos de uno o
 * dos que no se veían.
 */
function gesto(c: CanvasRenderingContext2D, q: CuadroV, px: number, py: number, K: number, clase: string, u: number) {
  const h = q.hoja; if (!h) return;
  const col = FICHA[clase]?.luz ?? [255, 180, 90], k = Math.sin(Math.min(1, u) * Math.PI), vv = h.length >= 9 ? 5 : 0;
  const ax = px + h[vv], ay = py + h[vv + 1], bx = px + h[vv + 2], by = py + h[vv + 3], mx = px + h[0], my = py + h[1];
  const Z = Math.max(1, Math.round(K * 0.85)), cel = (x: number, y: number, z: number) => c.fillRect(Math.round(x / z) * z, Math.round(y / z) * z, z, z);
  c.save(); c.globalCompositeOperation = 'lighter';
  // el aire que se enciende alrededor de la mano y de la hoja
  const gr = 26 * K, g = c.createRadialGradient(mx, my, 0, mx, my, gr); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.38 * k})`); g.addColorStop(0.5, `rgba(${col[0]},${col[1]},${col[2]},${0.12 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(mx - gr, my - gr, gr * 2, gr * 2);
  // el aro que se abre al empezar (puntos sueltos en un óvalo, se rompe al crecer)
  if (u < 0.45) {
    const e = u / 0.45, r = (4 + 26 * e) * K, n = 28;
    for (let i = 0; i < n; i++) {
      if (hash(i, 77) < e * 0.6) continue;
      const a = (i / n) * Math.PI * 2, al = (1 - e) * 0.9;
      c.fillStyle = e < 0.25 ? `rgba(255,250,230,${al})` : `rgba(${col[0]},${col[1]},${col[2]},${al})`;
      cel(mx + Math.cos(a) * r, my + Math.sin(a) * r * 0.55, Z);
    }
  }
  // chispas de la hoja: nacen a lo largo, salen hacia afuera y abajo con su estela
  for (let i = 0; i < 46; i++) {
    const nace = hash(i, 11) * 0.55, e = (u - nace) / (0.35 + hash(i, 12) * 0.25);
    if (e <= 0 || e >= 1) continue;
    const w = hash(i, 13), sx = ax + (bx - ax) * w, sy = ay + (by - ay) * w;
    const a = hash(i, 5) * Math.PI * 2, v = (14 + hash(i, 9) * 30) * K * 0.5;
    const pos = (ee: number) => [sx + Math.cos(a) * v * ee, sy + Math.sin(a) * v * ee * 0.7 + 22 * K * 0.5 * ee * ee] as const;
    for (let tr = 3; tr >= 0; tr--) {
      const ee = Math.max(0, e - tr * 0.045), [x, y] = pos(ee), cal = 1 - ee, al = (1 - tr * 0.24) * (1 - e * 0.85);
      c.fillStyle = cal > 0.75 && tr === 0 ? `rgba(255,252,236,${al})` : cal > 0.45 ? `rgba(${col[0]},${col[1]},${col[2]},${al})` : `rgba(255,${Math.round(70 + 90 * cal)},${Math.round(20 * cal)},${al * 0.85})`;
      cel(x, y, tr === 0 && hash(i, 2) < 0.35 ? Z * 2 : Z);
    }
  }
  // brasas gruesas que suben de la mano y se mecen
  for (let i = 0; i < 12; i++) {
    const e = (u * 1.2 + hash(i, 31)) % 1, x = mx + (hash(i, 32) - 0.5) * 18 * K + Math.sin(e * 6 + i) * 3 * K, y = my - e * 40 * K;
    c.fillStyle = `rgba(255,${Math.round(150 + 90 * (1 - e))},${Math.round(60 * (1 - e))},${k * (1 - e)})`; cel(x, y, Z * (hash(i, 33) < 0.3 ? 2 : 1));
  }
  c.restore();
}
/** El gesto de antes (`__chispasViejas`): chispas de su color que nacen en la mano del arma y suben. */
function gestoViejo(c: CanvasRenderingContext2D, q: CuadroV, px: number, py: number, K: number, clase: string, u: number) {
  const h = q.hoja; if (!h) return;
  const col = FICHA[clase]?.luz ?? [255, 180, 90], k = Math.sin(Math.min(1, u) * Math.PI);
  const mx = px + h[0], my = py + h[1];
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 22; i++) {
    const e = (u * 1.6 + hash(i, 11)) % 1, a = hash(i, 5) * Math.PI * 2, r = e * (10 + hash(i, 9) * 22) * K * 0.5;
    const x = Math.round(mx + Math.cos(a) * r), y = Math.round(my + Math.sin(a) * r * 0.6 - e * 18 * K * 0.5);
    const al = k * (1 - e) * 0.9, z = hash(i, 2) < 0.25 ? 2 : 1;
    c.fillStyle = hash(i, 4) < 0.3 ? `rgba(255,255,235,${al})` : `rgba(${col[0]},${col[1]},${col[2]},${al})`;
    c.fillRect(x, y, z, z);
  }
  // el aire que se enciende alrededor de la mano
  const g = c.createRadialGradient(mx, my, 0, mx, my, 14 * K); g.addColorStop(0, `rgba(${col[0]},${col[1]},${col[2]},${0.25 * k})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  c.fillStyle = g; c.fillRect(mx - 14 * K, my - 14 * K, 28 * K, 28 * K);
  c.globalCompositeOperation = 'source-over';
}

/** La fogata (las piedras y los leños horneados, con el fuego de Doom del juego encima), que se aviva al entrar. */
function fogata(fx: number, fy: number, e: number, t: number, aviva: number, chico: boolean) {
  const fog = objetoMeta('camp_fogata_sin_llama', 'grande') ?? objetoMeta('camp_fogata', 'grande');
  const sm = ctx.imageSmoothingEnabled; ctx.imageSmoothingEnabled = false;
  const ef = Math.max(1, Math.round(e * 2) / 2) * (chico ? 0.85 : 1);
  if (fog) dibujar(ctx, fog.f[Math.floor((t * 25) / fog.t) % fog.f.length], fx, fy, ef);
  // la grilla fina: celdas de unos 2,5 puntos del aparato (como el fuego del título), a medio punto lógico de paso
  const res = ctx.getTransform().a, cf = Math.max(0.5, Math.round((2.5 / (1.6 * ef * res)) * 2) / 2), fina = !(window as any).__fogataGruesa && cf < 3;
  const vs = fina ? fuegoSueltoFino('camp_fogata|grande', cf, 1 / 60) : fuegoSuelto('camp_fogata|grande', 1 / 60);
  if (vs) { ctx.save(); ctx.translate(fx, fy); ctx.scale(1.6 * ef, 1.2 * ef * (0.85 + 0.15 * aviva)); (fina ? dibujarVivosPixel : dibujarVivos)(ctx, vs, 0, 0); ctx.restore(); }
  else for (const [ox, oy, tm] of [[-9, -5, 1.5], [9, -5, 1.5], [0, -8, 1.7], [0, -30, 1.1]] as [number, number, number][]) fuegoMundo(ctx, fx + ox * ef * 0.5, fy + oy * ef * 0.5, tm * ef * 0.5, t, 0, 0);
  fuegoMundo(ctx, fx, fy - 15 * ef, 0.2 * ef * aviva, t, 0, 0);
  dibujarFuegosMundo(ctx, t, 0, 0);
  // el resplandor del fuego en el aire
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const r = 70 * ef * (0.9 + 0.2 * Math.sin(t * 9.1)) * aviva, g = ctx.createRadialGradient(fx, fy - 18 * ef, 0, fx, fy - 18 * ef, r);
  g.addColorStop(0, `rgba(255,140,50,${0.22 * aviva})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(fx - r, fy - 18 * ef - r, r * 2, r * 2);
  ctx.restore(); ctx.imageSmoothingEnabled = sm;
}

/**
 * La ceniza que cae y las brasas que suben de la fogata, en cuadros de pixel del aparato. La mitad pasa por detrás del
 * héroe (`delante` false, antes de pegarlo) y la otra mitad por delante.
 */
function motas(t: number, hx: number, hy: number, alto: number, fx: number, fy: number, s: number, delante: boolean, chico: boolean) {
  const m = ctx.getTransform(), px = Math.max(1, Math.round(s * (chico ? 1 : 1)));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const aP = (x: number, y: number) => [Math.round(m.a * x + m.e), Math.round(m.d * y + m.f)];
  // brasas: nacen en la fogata, suben meciéndose y se enfrían de amarillo a rojo oscuro
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 26; i++) {
    if ((hash(i, 1) < 0.5) !== delante) continue;
    const dur = 2.2 + hash(i, 2) * 2.4, u = (t / dur + hash(i, 3)) % 1, ciclo = Math.floor(t / dur + hash(i, 3));
    const x0 = fx + (hash(i, ciclo) - 0.5) * alto * 0.18, deriva = alto * (0.15 + hash(i, ciclo + 7) * 0.55);
    const x = x0 + u * deriva + Math.sin(t * (1.5 + hash(i, 4) * 2) + i) * alto * 0.03, y = fy - alto * 0.08 - u * alto * (0.9 + hash(i, 5) * 0.7);
    const [X, Y] = aP(x, y), cal = 1 - u;
    const r = 255, g = Math.round(90 + 150 * cal * cal), b = Math.round(40 * cal * cal * cal);
    ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, cal * 1.4) * (0.55 + 0.45 * Math.sin(t * 13 + i * 3))})`;
    const z = hash(i, 6) < 0.3 ? px * 2 : px; ctx.fillRect(X, Y, z, z);
  }
  // ceniza: copos grises que bajan despacio cruzando delante y detrás de él
  ctx.globalCompositeOperation = 'source-over';
  for (let i = 0; i < 18; i++) {
    if ((hash(i, 21) < 0.5) !== delante) continue;
    const dur = 7 + hash(i, 22) * 6, u = (t / dur + hash(i, 23)) % 1;
    const x = hx - alto * 0.7 + hash(i, 24) * alto * 1.6 + Math.sin(t * 0.7 + i) * alto * 0.05 + u * alto * 0.25, y = hy - alto * 1.35 + u * alto * 1.45;
    const [X, Y] = aP(x, y), al = Math.sin(u * Math.PI) * (0.35 + hash(i, 25) * 0.3);
    ctx.fillStyle = `rgba(${150 + Math.round(hash(i, 26) * 40)},${140 + Math.round(hash(i, 26) * 30)},${130},${al})`;
    ctx.fillRect(X, Y, px, px);
  }
  ctx.restore();
}

// ------------------------------------------------------------------ las cartas
/**
 * El héroe de una carta: los pies en (cx, piesY), `alto` puntos lógicos, el reposo del mundo con su equipo. Quieto en la
 * pose de reposo si no está elegido ni con el ratón encima; vivo si lo está. Hasta que se pinta, su silueta en penumbra.
 * Devuelve si ya está pintado.
 */
const cartaDe = new Map<string, Pedido>();
export function heroeCarta(h2: DatosHeroe, cx: number, piesY: number, alto: number, t: number, vivo: boolean, luz: number, i: number): boolean {
  const v = vestido(h2), m = ctx.getTransform(), s = m.a, meta = alto * s;
  const d = Math.max(1, Math.ceil(meta / (REF_C * 2))), K = Math.max(0.6, Math.round((meta / (REF_C * d)) * 20) / 20);
  const p: Pedido = pedirVigilia('carta', h2.clase, v.cuerpo, v.eqMundo, v.firmaMundo, K, vivo ? 1.5 : 1);
  cartaDe.set(h2.id, p);
  const f0 = vivo ? Math.floor(t * 6 + i * 2) % CARTA_N : 0, f = cercano(p, f0, 0, CARTA_N);
  const q = f !== null ? cuadroV(p, f) : null;
  const X = Math.round(m.a * cx + m.e), Y = Math.round(m.d * piesY + m.f);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  if (q) {
    ctx.drawImage(q.cv, 0, 0, q.w, q.h, X - q.ax * d, Y - q.ay * d, q.w * d, q.h * d);
    if (luz > 0.01) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = luz; ctx.drawImage(q.calor!, 0, 0, q.w, q.h, X - q.ax * d, Y - q.ay * d, q.w * d, q.h * d); }
  } else {
    // la silueta del de salida, a oscuras (nunca el equipo que no lleva)
    const fs = cuadrosHeroe(h2.clase, 'quieto', 'so'); ctx.globalAlpha = 0.85;
    if (fs[0]) dibujarTenido(ctx, fs[0], X, Y, '#0a0708', 1, K * d);
  }
  ctx.restore();
  return !!q;
}

/** El canto de la carta elegida: una brasa que corre por el arco, con su cola, y el filo que respira. */
export function brasaCanto(camino: (u: number) => [number, number], t: number, k: number) {
  const m = ctx.getTransform(), s = Math.max(1, Math.round(m.a));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
  for (const fase of [0, 0.5]) {
    const u0 = (t * 0.11 + fase) % 1;
    for (let j = 0; j < 30; j++) {
      const u = (u0 - j * 0.004 + 1) % 1, [x, y] = camino(u), X = Math.round(m.a * x + m.e), Y = Math.round(m.d * y + m.f), e = 1 - j / 30;
      ctx.fillStyle = j < 2 ? `rgba(255,245,200,${k})` : `rgba(255,${Math.round(110 + 110 * e)},${Math.round(30 * e)},${k * e})`;
      const z = j < 3 ? s * 3 : j < 12 ? s * 2 : s;
      ctx.fillRect(X - Math.floor(z / 2), Y - Math.floor(z / 2), z, z);
    }
  }
  ctx.restore();
}

/** «Nuevo héroe»: el yunque vacío con su forja tenue (una brasa en la cruz que late y chispas que suben del piso del nicho). */
export function forjaNueva(cx: number, cy: number, piso: number, ancho: number, t: number, k: number) {
  const m = ctx.getTransform(), s = Math.max(1, Math.round(m.a));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const lat = 0.55 + 0.25 * Math.sin(t * 2.2) + 0.1 * Math.sin(t * 7.3);
  const g = ctx.createRadialGradient(cx, piso, 2, cx, piso, ancho * 0.75); g.addColorStop(0, `rgba(255,120,40,${(0.16 + 0.2 * k) * lat})`); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(cx - ancho, piso - ancho, ancho * 2, ancho * 2);
  const g2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, ancho * 0.3); g2.addColorStop(0, `rgba(255,170,70,${(0.12 + 0.25 * k) * lat})`); g2.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g2; ctx.fillRect(cx - ancho * 0.3, cy - ancho * 0.3, ancho * 0.6, ancho * 0.6);
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 9; i++) {
    const dur = 1.6 + hash(i, 31) * 1.6, u = (t / dur + hash(i, 32)) % 1, ciclo = Math.floor(t / dur + hash(i, 32));
    const x = cx + (hash(i, ciclo) - 0.5) * ancho * 0.6 + Math.sin(t * 2 + i) * 3, y = piso - u * ancho * 1.1;
    const X = Math.round(m.a * x + m.e), Y = Math.round(m.d * y + m.f), e = 1 - u;
    ctx.fillStyle = `rgba(255,${Math.round(110 + 130 * e * e)},${Math.round(40 * e)},${e * (0.35 + 0.5 * k)})`; ctx.fillRect(X, Y, s, s);
  }
  ctx.restore();
}
