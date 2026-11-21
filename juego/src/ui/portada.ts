// La portada de la Forja: fondo por capas con paralaje (cielo, nubes, relámpagos, ruinas, catedral con su luz, niebla,
// cementerio), ceniza y brasas, el título nuevo (fijo, revelado y en bucle) y las cartas ilustradas de cada acto.
// Todo se baja por partes: primero el fondo y el título fijo (lo que se ve), después las animaciones del título del
// idioma activo, y las cartas solo cuando hacen falta. Mientras algo no llega, se dibuja lo que hay.
import { ctx, W, H, E } from '../nucleo/lienzo';
import { IDI, TITULO, texto, envolver } from './comun';
import { BASE } from '../motor/assets';
import { Sonido } from '../audio/sonido';
import { fuegoTitulo, golpeTitulo, ENCIENDE_T } from './titulo_fuego';
import { acc } from '../nucleo/accesible';

const RAIZ = BASE + 'portada/';
let man: any = null;
let pidio = false;
const imgs = new Map<string, HTMLImageElement>();
const pedir = (ruta: string) => {
  if (imgs.has(ruta)) return imgs.get(ruta)!;
  const im = new Image(); im.decoding = 'async'; im.src = RAIZ + ruta; imgs.set(ruta, im); return im;
};
const lista = (ruta?: string) => { if (!ruta) return null; const im = pedir(ruta); return im.complete && im.naturalWidth ? im : null; };

/** Baja el manifiesto y lo primero que se ve. Se puede llamar muchas veces. */
export function prepararPortada() {
  if (pidio) return; pidio = true;
  fetch(RAIZ + 'portada.json').then((r) => r.json()).then((m) => {
    man = m;
    for (const c of m.fondo.capas) pedir(c.archivo);
    pedir(m.fondo.relampago.archivo); pedir(m.fondo.ceniza.archivo); pedir('fondo/luna.webp'); pedir('fondo/luna_nubes.webp');
    for (const idi of ['es', 'en']) pedir(m.titulo[idi].fijo['800']);
    // las animaciones del título del idioma activo, después
    setTimeout(() => { const t = m.titulo[IDI ? 'en' : 'es']; for (const k of ['revelar', 'anim']) for (const h of t[k]['800'].hojas) pedir(h); }, 400);
  }).catch(() => { pidio = false; });
}
export const portadaLista = () => !!man && !!lista(man.fondo.capas[0].archivo) && !!lista(man.fondo.capas.find((c: any) => c.id === 'catedral')?.archivo);

// ------------------------------------------------------------------ estado de la escena
let t0 = -1, proxRayo = 1.4, rayo = -1, rayoEspejo = false, trueno = -1;
/** Sprites de luz precalculados (halos, rayos, luna, niebla, brasas): un degradado por cuadro salía carísimo. */
const sprites = new Map<string, HTMLCanvasElement>();
function sprite(k: string, n: number, pintar: (c: CanvasRenderingContext2D, n: number) => void): HTMLCanvasElement {
  let im = sprites.get(k); if (im) return im;
  im = document.createElement('canvas'); im.width = im.height = n; pintar(im.getContext('2d')!, n); sprites.set(k, im); return im;
}
/**
 * Los jirones de delante de la luna: la tira horneada trae en R cuánto tapa y en G el filo fino que se enciende a
 * contraluz. Se pasa UNA vez a dos lienzos ya teñidos (cuerpo casi negro y filo de brasa) y después solo se pegan.
 */
let nubL: { cuerpo: HTMLCanvasElement; filo: HTMLCanvasElement; w: number; h: number } | null = null;
function nubesDeLuna() {
  if (nubL) return nubL;
  const im = lista('fondo/luna_nubes.webp'); if (!im) return null;
  const w = im.naturalWidth, h = im.naturalHeight, src = document.createElement('canvas'); src.width = w; src.height = h;
  const g = src.getContext('2d', { willReadFrequently: true })!; g.drawImage(im, 0, 0); const d = g.getImageData(0, 0, w, h);
  const hacer = (rgb: [number, number, number], canal: number, k: number) => {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d')!, o = x.createImageData(w, h);
    for (let i = 0; i < w * h; i++) { o.data[i * 4] = rgb[0]; o.data[i * 4 + 1] = rgb[1]; o.data[i * 4 + 2] = rgb[2]; o.data[i * 4 + 3] = Math.min(255, d.data[i * 4 + canal] * k); }
    x.putImageData(o, 0, 0); return c;
  };
  // (la tira mide 1536 x 420 de la capa: la imagen va a la mitad o al tamaño, se escala al dibujarla)
  nubL = { cuerpo: hacer([16, 5, 6], 0, 0.88), filo: hacer([255, 128, 70], 1, 1), w: 1536, h: 420 };
  return nubL;
}
/** La luna ya achicada al tamaño de pantalla (redondeado a escalones de 3 %), con el filtro de mejor calidad. */
let lunaC: { c: HTMLCanvasElement; d: number } | null = null;
function lunaA(im: HTMLImageElement, d: number) {
  const q = Math.round(Math.pow(1.03, Math.round(Math.log(Math.max(8, d)) / Math.log(1.03))));
  if (lunaC && lunaC.d === q) return lunaC.c;
  const c = lunaC?.c ?? document.createElement('canvas'); c.width = c.height = q; const g = c.getContext('2d')!;
  g.clearRect(0, 0, q, q); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(im, 0, 0, q, q);
  lunaC = { c, d: q }; return c;
}
/** Los lienzos propios donde se arman el cuerpo y el filo de los jirones (cada uno se usa una vez por cuadro). */
const lzLuna = new Map<string, HTMLCanvasElement>();
function lienzoLuna(k: string, S: number, Sy: number) {
  let c = lzLuna.get(k); if (!c) { c = document.createElement('canvas'); lzLuna.set(k, c); }
  if (c.width < S || c.width > S * 1.5 || c.height < Sy || c.height > Sy * 1.5) { c.width = S; c.height = Sy; }
  return c;
}
/** Bocanadas de humo (cuatro formas), hechas una sola vez: ruido de valor en un disco que se deshace. */
let bocanadas: { oscura: HTMLCanvasElement; lumbre: HTMLCanvasElement }[] | null = null;
function humos() {
  if (bocanadas) return bocanadas;
  const n = 96, hs = (x: number, y: number, s: number) => { const q = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return q - Math.floor(q); };
  const vr = (x: number, y: number, s: number) => { const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy, ux = fx * fx * (3 - 2 * fx), uy = fy * fy * (3 - 2 * fy);
    const a = hs(ix, iy, s), b = hs(ix + 1, iy, s), c = hs(ix, iy + 1, s), d = hs(ix + 1, iy + 1, s); return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy; };
  bocanadas = [];
  for (let v = 0; v < 4; v++) {
    const al = new Float32Array(n * n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const dx = (x + 0.5) / n * 2 - 1, dy = (y + 0.5) / n * 2 - 1, r = Math.hypot(dx, dy);
      let f = 0, k = 1, a = 0.5; for (let o = 0; o < 4; o++) { f += a * vr(dx * 2.2 * k + v * 9, dy * 2.2 * k, v * 3 + o); k *= 2; a *= 0.5; }
      const borde = Math.max(0, Math.min(1, (1 - r) / 0.45)); al[y * n + x] = Math.max(0, Math.min(1, 0.95 - r * 0.5 + (f - 0.47) * 1.6)) * borde * borde * (3 - 2 * borde);
    }
    const hacer = (rgb: [number, number, number], abajo: boolean) => {
      const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d')!, o = g.createImageData(n, n);
      for (let i = 0; i < n * n; i++) { const y = Math.floor(i / n) / n; o.data[i * 4] = rgb[0]; o.data[i * 4 + 1] = rgb[1]; o.data[i * 4 + 2] = rgb[2]; o.data[i * 4 + 3] = 255 * al[i] * (abajo ? Math.max(0, y * 1.6 - 0.45) : 1); }
      g.putImageData(o, 0, 0); return c;
    };
    bocanadas.push({ oscura: hacer([22, 11, 10], false), lumbre: hacer([255, 110, 44], true) });
  }
  return bocanadas;
}
interface Part { x: number; y: number; vx: number; vy: number; s: number; a: number; f: number; v: number; vida?: number }
const parts = new Map<string, Part[]>();
const R = Math.random, entre = (r: [number, number]) => r[0] + R() * (r[1] - r[0]);

/** Reinicia la secuencia de entrada (negro, fondo, relámpago, título, botones). */
export function reiniciarPortada() { t0 = -1; proxRayo = 1.4; rayo = -1; trueno = -1; }
(window as any).__reiniciarPortada = reiniciarPortada;
/** Segundos desde que se reinicia la portada hasta que el título termina de forjarse (para entrar con la música del menú). */
export function durForjaTitulo() { const rv = man?.titulo?.[IDI ? 'en' : 'es']?.revelar?.['800']; return 2.2 + (rv ? rv.cuadros / rv.fps : 3); }

/** Dibuja la portada. Devuelve el alfa de los botones (0 a 1) y dónde van, o null si todavía no está lista. */
export function dibujarPortada(tReal: number): { botones: number; yBotones: number } | null {
  prepararPortada();
  if (!portadaLista()) return null;
  if (t0 < 0) t0 = tReal;
  // (`__portadaReloj` fija el tiempo de la escena, para las pruebas cuadro a cuadro)
  const t: number = (window as any).__portadaReloj ?? tReal - t0, m0 = performance.now();
  (window as any).__portadaT = t;
  const f = man.fondo, base = man.base;
  // escala: cubre la pantalla con la base de 1280x720; en vertical se escala por alto y se centra en la catedral
  const vertical = H > W;
  const esc = (vertical ? H / base.h : Math.max(W / base.w, H / base.h)) * (1.03 + 0.03 * (0.5 - 0.5 * Math.cos((2 * Math.PI * t) / 52)));
  const ox = vertical ? W / 2 - man.fondo.foco.x * esc : (W - base.w * esc) / 2, oy = (H - base.h * esc) / 2;
  const cam = f.camara;
  const cx = Math.sin((2 * Math.PI * t) / cam.periodo_x_s) * cam.deriva_x + (E.x / W - 0.5) * 2 * cam.raton;
  const cy = Math.sin((2 * Math.PI * t) / cam.periodo_y_s) * cam.deriva_y + (E.y / H - 0.5) * 2 * cam.raton * 0.3;
  const mx = f.capa.margen_x, my = f.capa.margen_y;
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  // el golpe de forja del título sacude la escena (unos puntos, por acc.temblor): se agranda apenas para no ver el borde
  const gp = golpeTitulo(t - 2.2);
  if (gp.dx || gp.dy) { const k = 1 + (Math.abs(gp.dx) + Math.abs(gp.dy)) * 2.2 / W; ctx.translate(W / 2 + gp.dx, H / 2 + gp.dy); ctx.scale(k, k); ctx.translate(-W / 2, -H / 2); }
  const fondoK = Math.min(1, Math.max(0, (t - 0.2) / 1.6));
  // relámpagos: uno forzado a los 1.4 s y después cada 7 a 16 s
  const rel = f.relampago;
  if (t >= proxRayo && rayo < 0) { rayo = t; rayoEspejo = R() < 0.5; trueno = t + 0.4 + R() * 0.8; proxRayo = t + entre(rel.cada_s); }
  const iRayo = rayo >= 0 ? Math.floor((t - rayo) * rel.fps) : -1;
  if (iRayo >= rel.cuadros) rayo = -1;
  if (trueno > 0 && t >= trueno) { trueno = -1; Sonido.efecto('trueno' as any, { vol: 0.5 }); }
  const enRayo = rayo >= 0 && iRayo < rel.cuadros;
  const luzCat = Math.min(1, Math.max(0, (t - 1.4) / 1)) * (enRayo ? 0.5 : 1);
  const capa = (c: any, alfa = 1, dx = 0) => {
    const im = lista(c.archivo); if (!im) return;
    ctx.globalAlpha = alfa * fondoK; ctx.globalCompositeOperation = c.mezcla === 'sumar' || c.mezcla === 'lighter' ? 'lighter' : 'source-over';
    // capas animadas por cuadros (el fuego de Doom de la ciudad y de la catedral): una tira de cuadros puesta en (x, y)
    if (c.anim?.tipo === 'cuadros') {
      const a = c.anim, w = a.w ?? c.w, h = a.h ?? c.h, cols = a.columnas ?? Math.max(1, Math.floor((im as any).width / w)), n = Math.floor(t * a.fps) % a.cuadros;
      ctx.drawImage(im, (n % cols) * w, Math.floor(n / cols) * h, w, h, ox + ((c.x ?? 0) - mx - cx * c.paralaje) * esc, oy + ((c.y ?? 0) - my - cy * c.paralaje) * esc, w * esc, h * esc);
      return;
    }
    const x = ox + (-mx - cx * c.paralaje + dx) * esc, y = oy + (-my - cy * c.paralaje) * esc;
    ctx.drawImage(im, x, y, c.w * esc, c.h * esc);
    if (c.anim?.enrollar) { const w = c.w * esc; ctx.drawImage(im, x + (dx > 0 ? -w : w), y, w, c.h * esc); }
  };
  const ceniza = (despues: string) => {
    const cz = f.ceniza, im = lista(cz.archivo); if (!im) return;
    for (const pc of cz.particulas) {
      if (pc.despues_de !== despues) continue;
      let ps = parts.get(pc.fila + despues);
      if (!ps) { ps = Array.from({ length: pc.cantidad }, () => nueva(pc, true)); parts.set(pc.fila + despues, ps); }
      const fila = cz.filas[pc.fila];
      ctx.globalCompositeOperation = pc.mezcla === 'sumar' ? 'lighter' : 'source-over';
      for (const p of ps) {
        p.x += p.vx / 60; p.y += p.vy / 60; if (p.vida !== undefined) p.vida -= 1 / 60;
        if (p.x < -40 || p.x > base.w + 40 || p.y < -40 || p.y > base.h + 40 || (p.vida !== undefined && p.vida <= 0)) Object.assign(p, nueva(pc, false));
        const col = Math.floor((t * cz.fps + p.f) % cz.columnas);
        const x = ox + (p.x - cx * pc.paralaje + Math.sin(t * 1.3 + p.f) * pc.vaiven) * esc, y = oy + (p.y - cy * pc.paralaje) * esc, s = cz.celda * p.s * esc;
        ctx.globalAlpha = p.a * fondoK * (p.vida !== undefined ? Math.min(1, p.vida) : 1);
        // los copos de ceniza: un punto de 1 o 2 px de lienzo, tibio y a media luz (el cuadro grande se leía como polvo en el vidrio)
        if (pc.fila.startsWith('copo')) { ctx.globalAlpha *= 0.5; ctx.fillStyle = p.s > 1 ? '#c9a68a' : '#a88a74'; const d = p.s > 1 ? 2 : 1; ctx.fillRect(Math.round(x), Math.round(y), d, d); continue; }
        ctx.drawImage(im, col * cz.celda, fila * cz.celda, cz.celda, cz.celda, x - s / 2, y - s / 2, s, s);
      }
    }
  };
  // ---- lo que la Forja no trae y hace la escena: la luna de sangre detrás de la catedral con sus rayos, los cuervos
  // que rondan las agujas, la niebla en capas y las brasas grandes de primer plano. Todo en coordenadas de la base.
  const P = (bx: number, by: number, par: number): [number, number] => [ox + (bx - cx * par) * esc, oy + (by - cy * par) * esc];
  const luna = () => {
    const [lx, ly] = f.luna ? P(f.luna.x, f.luna.y, 0.07) : P(f.foco.x + 70, 250, 0.07), r = 150 * esc;
    // el resplandor (en radios de luna): la corona pegada al borde, el aura que tiñe las nubes y el velo que llena
    // medio cielo. Un solo sprite sumado: va del naranja junto al disco al rojo hondo afuera.
    const halo = sprite('halo_luna', 512, (c, n) => {
      const R2 = n / 2, k = 1 / 5.5, g = c.createRadialGradient(R2, R2, 0, R2, R2, R2);
      for (const [q, col] of [[0, 'rgba(255,120,60,0.5)'], [0.9, 'rgba(255,110,52,0.45)'], [1.0, 'rgba(255,100,46,0.34)'], [1.12, 'rgba(240,76,34,0.24)'], [1.4, 'rgba(210,52,24,0.17)'], [2.0, 'rgba(170,34,16,0.085)'], [3.2, 'rgba(130,20,10,0.04)'], [4.4, 'rgba(100,12,8,0.012)'], [5.5, 'rgba(80,8,6,0)']] as [number, string][]) g.addColorStop(Math.min(1, q * k), col);
      c.fillStyle = g; c.fillRect(0, 0, n, n);
    });
    const res = 0.94 + 0.04 * Math.sin(t * 0.37) + 0.02 * Math.sin(t * 0.83 + 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fondoK * res;
    ctx.drawImage(halo, lx - r * 5.5, ly - r * 5.5, r * 11, r * 11);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = fondoK;
    // el disco: la esfera horneada (portada_luna.py) con mares, cráteres con relieve y el cobre del eclipse
    const im = lista('fondo/luna.webp');
    // (achicada una vez a su tamaño en pantalla, de a 3 % de escala: el filtro bueno en cada cuadro costaba caro)
    const disco = im && lunaA(im, r * 2);
    if (disco) ctx.drawImage(disco, lx - r, ly - r, r * 2, r * 2);
    // el aire de la Tierra delante del disco: un velo de la misma corona, sumado y suave (la luna brilla, no es una lámina)
    const velo = sprite('velo_luna', 128, (c, n) => { const R2 = n / 2, g = c.createRadialGradient(R2, R2, 0, R2, R2, R2); g.addColorStop(0, 'rgba(255,120,60,0.06)'); g.addColorStop(0.8, 'rgba(255,110,52,0.07)'); g.addColorStop(0.9, 'rgba(255,100,46,0.08)'); g.addColorStop(1, 'rgba(255,100,46,0)'); c.fillStyle = g; c.fillRect(0, 0, n, n); });
    ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fondoK * res;
    ctx.drawImage(velo, lx - r * 1.12, ly - r * 1.12, r * 2.24, r * 2.24);
    ctx.restore();
    if (!((window as any).__pOff ?? '').includes('jirones')) nubesLuna(lx, ly, r);
  };
  // los jirones que le pasan por delante a la luna: el cuerpo oscuro en todo el cielo y, cerca del disco, el filo que
  // se enciende a contraluz (armado en un lienzo propio del tamaño del resplandor y recortado con su forma)
  const nubesLuna = (lx: number, ly: number, r: number) => {
    const nl = nubesDeLuna(); if (!nl) return;
    const par = 0.1, vel = -3.2, wq = nl.w * esc, hq = nl.h * esc;
    const dx = (((t * vel) % nl.w) + nl.w) % nl.w;
    const x0 = ox + (-mx - cx * par - dx) * esc, y0 = oy + ((f.luna?.y ?? 189) - nl.h / 2 - cy * par) * esc;
    // los dos pases van cada uno en su lienzo: el cuerpo, recortado a un óvalo ancho alrededor de la luna (lejos de
    // ella los jirones se pierden contra el cielo y no rayan el título), y el filo encendido, pegado al disco
    const pase = (cual: 'cuerpo' | 'filo', S: number, Sy: number, mk: HTMLCanvasElement, op: GlobalCompositeOperation, a: number) => {
      // a media resolución: son nubes blandas y así el lienzo cuesta la cuarta parte
      const z = 0.5, Sz = Math.ceil(S * z), Syz = Math.ceil(Sy * z), lz = lienzoLuna(cual, Sz, Syz), g = lz.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, lz.width, lz.height);
      const ax = lx - S / 2, ay = ly - Sy / 2;
      for (let k = 0; k < 3; k++) { const xx = x0 + k * wq - ax; if (xx < S && xx + wq > 0) g.drawImage(nl[cual], xx * z, (y0 - ay) * z, wq * z, hq * z); }
      g.globalCompositeOperation = 'destination-in'; g.drawImage(mk, 0, 0, Sz, Syz);
      ctx.globalCompositeOperation = op; ctx.globalAlpha = fondoK * a; ctx.drawImage(lz, 0, 0, Sz, Syz, ax, ay, S, Sy);
    };
    const mascara = (k: string, nucleo: number) => sprite('mascara_luna' + k, 256, (c, n) => { const R2 = n / 2, g2 = c.createRadialGradient(R2, R2, 0, R2, R2, R2); g2.addColorStop(0, 'rgba(0,0,0,1)'); g2.addColorStop(nucleo, 'rgba(0,0,0,1)'); g2.addColorStop(nucleo + (1 - nucleo) * 0.35, 'rgba(0,0,0,0.45)'); g2.addColorStop(nucleo + (1 - nucleo) * 0.7, 'rgba(0,0,0,0.12)'); g2.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = g2; c.fillRect(0, 0, n, n); });
    ctx.save(); ctx.imageSmoothingEnabled = true;
    pase('cuerpo', Math.ceil(r * 9), Math.ceil(r * 3.6), mascara('a', 0.3), 'source-over', 0.9);
    pase('filo', Math.ceil(r * 4.2), Math.ceil(r * 4.2), mascara('b', 0.45), 'lighter', 0.95);
    ctx.restore();
  };
  const cuervosPortada = () => {
    // (antes eran trazos en V que heredaban el 'lighter' del fuego de la catedral: no se veían, y a la vista eran tildes)
    // ahora son siluetas llenas (cuerpo, cabeza, cola en cuña y alas con las primarias abiertas) que baten y planean,
    // pocas y altas, rondando las agujas por encima de los techos; dos cruzan el cielo de lado a lado, lejos y chicos
    ctx.save(); ctx.globalCompositeOperation = 'source-over';
    for (let i = 0; i < 11; i++) {
      const hsh = (n: number) => { const q = Math.sin(i * 91.7 + n * 37.3) * 43758.5; return q - Math.floor(q); };
      let bx: number, by: number, tam: number, dir: number;
      if (i < 9) { const w = (0.1 + hsh(1) * 0.12) * (hsh(2) < 0.5 ? 1 : -1), a = t * w + hsh(3) * 6.28, rx = 60 + hsh(4) * 150, ry = 16 + hsh(5) * 36;
        bx = (f.luna?.x ?? f.foco.x) + 10 + Math.cos(a) * rx; by = 70 + hsh(6) * 90 + Math.sin(a) * ry; tam = (6.5 + hsh(7) * 4.5) * (1 + 0.25 * Math.sin(a)); dir = -Math.sin(a) * Math.sign(w) >= 0 ? 1 : -1; }
      else { const u = ((t * (0.012 + hsh(1) * 0.008) + hsh(2)) % 1); bx = -60 + u * (base.w + 120); by = 60 + hsh(3) * 60 + Math.sin(u * 11) * 8; tam = 4 + hsh(4) * 2; dir = 1; }
      const [x, y] = P(bx, by, 0.3), q = tam * esc;
      // batir de a ratos y planear: la fase de vuelo sale de un seno lento
      const plano = 0.5 + 0.5 * Math.sin(t * 0.7 + i * 2.1), ala = plano > 0.6 ? 0.42 : Math.sin(t * (8 + hsh(8) * 3) + i), punta = -ala * q * 0.75;
      ctx.globalAlpha = fondoK * (0.75 + 0.2 * Math.min(1, tam / 8));
      ctx.fillStyle = '#0a0405';
      ctx.save(); ctx.translate(x, y); ctx.scale(dir, 1);
      // alas (la de atrás un poco más corta, para el volumen)
      for (const [k, lado] of [[0.85, -1], [1, 1]] as [number, number][]) {
        const tx = q * 0.1 * lado, ty = punta * k, ex = q * 1.15 * k * lado;
        ctx.beginPath(); ctx.moveTo(-q * 0.18, 0); ctx.quadraticCurveTo(tx + ex * 0.4, ty * 0.6 - q * 0.12, ex, ty);
        // primarias: tres puntas abiertas en el borde de fuga
        ctx.lineTo(ex - q * 0.12 * lado, ty + q * 0.1); ctx.lineTo(ex - q * 0.08 * lado, ty + q * 0.16); ctx.lineTo(ex - q * 0.26 * lado, ty + q * 0.2);
        ctx.quadraticCurveTo(tx + ex * 0.35, ty * 0.4 + q * 0.14, q * 0.2, q * 0.04); ctx.closePath(); ctx.fill();
      }
      // cuerpo, cabeza y cola
      ctx.beginPath(); ctx.ellipse(0, q * 0.02, q * 0.42, q * 0.11, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(q * 0.42, -q * 0.02, q * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(q * 0.5, -q * 0.03); ctx.lineTo(q * 0.66, q * 0.01); ctx.lineTo(q * 0.5, q * 0.04); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-q * 0.35, 0); ctx.lineTo(-q * 0.72, -q * 0.1); ctx.lineTo(-q * 0.76, q * 0.1); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore();
  };
  // el humo que sube de la torre rota y del techo de la nave: bocanadas que crecen, se tuercen con el viento hacia la
  // derecha (lejos del título) y se apagan; las de abajo llevan la lumbre del incendio en la panza
  const humoCatedral = () => {
    const bs = humos(), fuentes: [number, number, number, number, number][] = [[880, 190, 16, 0.75, 1], [1184, 372, 9, 0.65, 0.8], [1002, 300, 5, 0.45, 0.6]];
    ctx.save(); ctx.imageSmoothingEnabled = true;
    fuentes.forEach(([sx, sy, cuantas, fuerza, alto], fi) => {
      for (let i = 0; i < cuantas; i++) {
        const hsh = (m: number) => { const q = Math.sin(i * 41.3 + fi * 97.1 + m * 13.7) * 43758.5; return q - Math.floor(q); };
        const u = (t * (0.04 + hsh(1) * 0.015) + (i + hsh(6) * 0.6) / cuantas) % 1;
        const bx = sx + (hsh(2) - 0.5) * 14 + u * u * 210 * alto + Math.sin(t * 0.4 + i) * 8 * u, by = sy - u * 250 * alto + u * u * 40 * alto, tam = (26 + u * 170 * alto) * (0.8 + hsh(3) * 0.4);
        const [x, y] = P(bx, by, 0.45), q = tam * esc, b = bs[i % 4];
        const a = Math.min(1, Math.min(1, u * 8) * Math.pow(1 - u, 1.6) * fuerza * fondoK * ((window as any).__humoK ?? 1));
        const giro = hsh(4) * 6.28 + u * (hsh(5) - 0.5) * 2;
        ctx.save(); ctx.translate(x, y); ctx.rotate(giro);
        ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = a; ctx.drawImage(b.oscura, -q / 2, -q / 2, q, q);
        if (u < 0.55) { ctx.rotate(-giro); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a * Math.pow(1 - u, 2.2) * 1.2 * (0.8 + 0.2 * Math.sin(t * 7 + i)); ctx.drawImage(b.lumbre, -q / 2, -q / 2, q, q); }
        ctx.restore();
      }
    });
    ctx.restore();
  };
  const nieblaCapas = (y0: number, par: number, n: number, rgb: string, a: number) => {
    const im = sprite('niebla' + rgb, 128, (c, m) => { const g = c.createRadialGradient(m / 2, m / 2, 0, m / 2, m / 2, m / 2); g.addColorStop(0, `rgba(${rgb},1)`); g.addColorStop(1, `rgba(${rgb},0)`); c.fillStyle = g; c.fillRect(0, 0, m, m); });
    ctx.save();
    for (let i = 0; i < n; i++) {
      const hsh = (m: number) => { const q = Math.sin(i * 57.3 + m * 19.1 + y0) * 43758.5; return q - Math.floor(q); };
      const an = 260 + hsh(1) * 380, v = 5 + hsh(2) * 9, bx = ((hsh(3) * (base.w + an * 2) + t * v * (i % 2 ? 1 : -1)) % (base.w + an * 2) + (base.w + an * 2)) % (base.w + an * 2) - an, by = y0 + (hsh(4) - 0.5) * 50;
      const [x, y] = P(bx, by, par), rx = an * esc, ry = (26 + hsh(5) * 34) * esc;
      ctx.globalAlpha = a * (0.6 + 0.4 * Math.sin(t * 0.3 + i)) * fondoK; ctx.drawImage(im, x - rx, y - ry, rx * 2, ry * 2);
    }
    ctx.restore();
  };
  const brasasCerca = () => {
    const im = sprite('brasa', 64, (c, m) => { const g = c.createRadialGradient(m / 2, m / 2, 0, m / 2, m / 2, m / 2); g.addColorStop(0, 'rgba(255,190,80,1)'); g.addColorStop(0.4, 'rgba(255,110,30,0.5)'); g.addColorStop(1, 'rgba(255,80,20,0)'); c.fillStyle = g; c.fillRect(0, 0, m, m); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) {
      const hsh = (m: number) => { const q = Math.sin(i * 23.9 + m * 71.7) * 43758.5; return q - Math.floor(q); };
      const u = (t * (0.035 + hsh(1) * 0.05) + hsh(2)) % 1, bx = hsh(3) * base.w + Math.sin(u * 6 + i) * 46, by = base.h + 30 - u * (base.h * 0.95), r = (2.5 + hsh(4) * 8) * esc;
      const [x, y] = P(bx, by, 1.5);
      ctx.globalAlpha = Math.sin(u * Math.PI) * (0.14 + hsh(5) * 0.34) * fondoK * (0.7 + 0.3 * Math.sin(t * 9 + i)); ctx.drawImage(im, x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  };
  // la catedral vieja iba un tercio más grande, crecida desde su puerta
  // (la catedral nueva, la de la toma en perspectiva, ya viene a su tamaño: trae `luna` en el manifiesto)
  const KC = f.luna ? 1 : 1.3, [pcx, pcy] = P(f.foco.puerta[0], 600, 0.45);
  for (const c of f.capas) {
    if (c.id === 'vineta') continue;
    const off = ((window as any).__pOff ?? '') as string;
    if (off.includes('-' + c.id + ',')) continue; // (para las pruebas: __pOff = '-ruinas,' quita esa capa)
    if (c.id === 'nubes' && !off.includes('luna')) luna();
    if (c.id === 'cementerio' && !off.includes('niebla')) { nieblaCapas(560, 0.8, 4, '60,16,12', 0.6); }
    const esCat = String(c.id).startsWith('catedral');
    if (esCat) { const kc = off.includes('cat') ? 1 : KC; ctx.save(); ctx.translate(pcx, pcy); ctx.scale(kc, kc); ctx.translate(-pcx, -pcy); }
    if (c.id === 'relampago') {
      if (enRayo) {
        const im = lista(rel.archivo); if (im) {
          const cw = rel.w, ch = rel.h, col = iRayo % rel.columnas, fila = Math.floor(iRayo / rel.columnas);
          const x = ox + (-mx - cx * c.paralaje) * esc, y = oy + (-my - cy * c.paralaje + rel.y_capa) * esc;
          ctx.globalAlpha = fondoK * (0.4 + 0.6 * acc.destellos); ctx.globalCompositeOperation = 'lighter';
          if (rayoEspejo) { ctx.save(); ctx.translate(x + cw * esc, y); ctx.scale(-1, 1); ctx.drawImage(im, col * cw, fila * ch, cw, ch, 0, 0, cw * esc, ch * esc); ctx.restore(); }
          else ctx.drawImage(im, col * cw, fila * ch, cw, ch, x, y, cw * esc, ch * esc);
        }
      }
      continue;
    }
    let alfa = 1, dx = 0;
    if (c.anim?.tipo === 'deriva') dx = ((t * c.anim.px_por_segundo) % c.w + c.w) % c.w * Math.sign(c.anim.px_por_segundo || 1);
    if (c.anim?.tipo === 'titilar') alfa = 0.7 + 0.3 * (0.5 + 0.25 * Math.sin(t * 5.3 * 6.28) + 0.25 * Math.sin(t * 8.9 * 6.28 + 1));
    // en los relámpagos el fuego de la catedral baja (el de las ruinas no)
    if (c.id === 'catedral_fuego' && enRayo) alfa = 0.6;
    if (c.anim?.tipo === 'latir') alfa = (0.7 + 0.3 * (0.5 + 0.5 * Math.sin((t / c.anim.periodo_s) * 6.28))) * luzCat;
    capa(c, alfa, c.anim?.tipo === 'deriva' ? (c.anim.px_por_segundo < 0 ? -dx : dx) : 0);
    // la noche de arriba se oscurece sobre el cielo solo, antes de la luna: el título se despega y la luna no se apaga
    if (c.id === 'cielo') { const gc = sprite('grado_cielo', 256, (q, n) => { const g = q.createLinearGradient(0, 0, 0, n); g.addColorStop(0, 'rgba(8,0,4,0.8)'); g.addColorStop(0.34, 'rgba(8,0,4,0.16)'); g.addColorStop(0.6, 'rgba(8,0,4,0)'); g.addColorStop(1, 'rgba(8,0,4,0)'); q.fillStyle = g; q.fillRect(0, 0, n, n); });
      ctx.globalAlpha = fondoK; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(gc, 0, 0, W, H); }
    if (esCat) ctx.restore();
    ceniza(c.id);
    if (c.id === 'ruinas_llamas' && !off.includes('niebla')) nieblaCapas(500, 0.3, 3, '150,40,20', 0.2);
    if (c.id === 'catedral_fuego') { if (!off.includes('humo')) humoCatedral(); cuervosPortada(); }
    if (c.id === 'cementerio' && !off.includes('niebla')) { nieblaCapas(690, 1.2, 4, '10,4,4', 0.7); brasasCerca(); }
  }
  // el grado de color: arriba casi negro (el título se despega), el horizonte al rojo vivo y el piso otra vez oscuro
  { const gr = sprite('grado', 256, (c, n) => { const g = c.createLinearGradient(0, 0, 0, n); g.addColorStop(0, 'rgba(8,0,4,0.3)'); g.addColorStop(0.34, 'rgba(8,0,4,0.04)'); g.addColorStop(0.62, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); c.fillStyle = g; c.fillRect(0, 0, n, n); });
    ctx.globalAlpha = fondoK; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(gr, 0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over';
  // destello del relámpago en toda la pantalla
  if (enRayo) { ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (rel.destello[iRayo] ?? 0) * acc.destellos; ctx.fillStyle = '#c8d8ff'; ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; }
  const vin = f.capas.find((c: any) => c.id === 'vineta'); const iv = vin && lista(vin.archivo);
  if (iv) { ctx.globalAlpha = 1; ctx.drawImage(iv, 0, 0, W, H); }
  ctx.globalAlpha = 1;
  // título: el cuadro de 800 a 0.54 del ancho (0.96 en vertical), revelado a los 2.2 s y después en bucle
  const m1 = performance.now();
  dibujarTitulo(t - 2.2, vertical, gp.destello, gp.bocanada);
  ctx.restore();
  medirPortada(m1 - m0, performance.now() - m1);
  return { botones: Math.min(1, Math.max(0, (t - 4) / 0.5)), yBotones: H * 0.62 };
}
/** Lo que cuesta la portada por cuadro (ms de JS): el fondo y el título con su fuego, promedio y peor de la ventana. */
function medirPortada(fondo: number, titulo: number) {
  const w = window as any, m = (w.__portadaMed ??= { n: 0, fondo: 0, titulo: 0, peor: 0 });
  m.n++; m.fondo += fondo; m.titulo += titulo; m.peor = Math.max(m.peor, fondo + titulo);
}
function nueva(pc: any, alAzar: boolean): Part {
  const b = man.base;
  const p: Part = { x: R() * b.w, y: alAzar ? R() * b.h : pc.vel_y[0] > 0 ? -20 : b.h + 20, vx: entre(pc.vel_x), vy: entre(pc.vel_y), s: entre(pc.escala), a: entre(pc.alfa), f: R() * 8, v: 0 };
  // (nacen en la puerta de la catedral de ahora: el nacen_en del manifiesto era de la catedral vieja y dejaba un enjambre quieto en medio del campo)
  if (pc.nacen_en) { const [px, py] = man.fondo.foco?.puerta ?? pc.nacen_en; p.x = px + (R() - 0.5) * 34; p.y = py - 20 - R() * (alAzar ? 140 : 14); p.vida = 2 + R() * 2.5; }
  return p;
}
/** El título en su lugar de la portada; tRel < 0 todavía no aparece. */
function dibujarTitulo(tRel: number, vertical: boolean, destello = 0, bocanada = 0) {
  const ti = man.titulo[IDI ? 'en' : 'es'], col = man.titulo.colocacion?.[vertical ? 'movil_vertical' : 'escritorio'] ?? { ancho_rel: 0.54, centro_y_rel: 0.235 };
  // (se mide por ancho, pero nunca más alto que el 40 % de la pantalla: en monitores anchos crecía hasta tapar la catedral)
  const w = Math.min(W * col.ancho_rel, H * 0.4 / 0.6), h = w * 0.6, x = W / 2 - w / 2, y = Math.max(-h * 0.08, H * (vertical ? col.centro_y_rel : 0.19) - h / 2);
  (window as any).__tituloRect = [x, y, w, h];
  if (tRel < 0) return;
  const hoja = (a: any, i: number) => { const n = Math.floor(i / a.por_hoja), j = i % a.por_hoja; const im = lista(a.hojas[n]); if (!im) return false; ctx.drawImage(im, (j % a.columnas) * a.w, Math.floor(j / a.columnas) * a.h, a.w, a.h, x, y, w, h); return true; };
  const rv = ti.revelar['800'], an = ti.anim['800'];
  const iRev = Math.floor(tRel * rv.fps), viejo = !!(window as any).__tituloViejo;
  // el fuego nace de las letras cuando se encienden (antes: cuando terminaban de forjarse) y se queda ardiendo
  const fArde = viejo ? Math.min(1, Math.max(0, (tRel - rv.cuadros / rv.fps + 0.6) / 1.4)) : Math.min(1, Math.max(0, (tRel - ENCIENDE_T) / 0.35)), fijoIm = lista(ti.fijo['800']);
  fuegoTitulo(fijoIm, x, y, w, h, tRel, fArde, 'atras');
  let puesto = false;
  if (iRev < rv.cuadros) puesto = hoja(rv, iRev);
  else puesto = hoja(an, Math.floor((tRel - rv.cuadros / rv.fps) * an.fps) % an.cuadros);
  // sin las hojas todavía: el título fijo, con un fundido
  if (!puesto && fijoIm) { ctx.globalAlpha = Math.min(1, tRel / 1.2); ctx.drawImage(fijoIm, x, y, w, h); ctx.globalAlpha = 1; }
  if (!viejo || iRev >= rv.cuadros) fuegoTitulo(fijoIm, x, y, w, h, tRel, fArde, 'adelante');
  // el fogonazo del golpe (y la bocanada del encendido, más chica): un resplandor sumado en las letras y la pantalla tibia
  if (destello > 0.004 || bocanada > 0.004) {
    const fg = sprite('fogonazo_titulo', 256, (c, n) => { const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2); g.addColorStop(0, 'rgba(255,236,190,1)'); g.addColorStop(0.18, 'rgba(255,170,80,0.75)'); g.addColorStop(0.5, 'rgba(230,80,24,0.25)'); g.addColorStop(1, 'rgba(160,30,10,0)'); c.fillStyle = g; c.fillRect(0, 0, n, n); });
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // las letras mismas se ponen al blanco en el golpe (el título sumado sobre sí mismo)
    if (fijoIm && destello > 0.02) { ctx.globalAlpha = Math.min(1, destello * 0.85); ctx.drawImage(fijoIm, x, y, w, h); ctx.globalAlpha = Math.min(1, destello * 0.5); ctx.drawImage(fijoIm, x, y, w, h); }
    ctx.globalAlpha = Math.min(1, destello * 0.45 + bocanada * 0.3); ctx.drawImage(fg, x - w * 0.15, y - h * 0.05, w * 1.3, h * 1.1);
    ctx.globalAlpha = Math.min(1, destello * 0.28); ctx.fillStyle = '#ff9a50'; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
}
/** El título fijo nuevo en cualquier lugar (pantallas de carga, final). Devuelve false si todavía no llegó. */
export function tituloFijo(cx: number, cy: number, ancho: number, alfa = 1): boolean {
  prepararPortada(); if (!man) return false;
  const im = lista(man.titulo[IDI ? 'en' : 'es'].fijo['800']); if (!im) return false;
  const h = ancho * (im.naturalHeight / im.naturalWidth);
  ctx.save(); ctx.globalAlpha = alfa; ctx.drawImage(im, cx - ancho / 2, cy - h / 2, ancho, h); ctx.restore();
  return true;
}

// ------------------------------------------------------------------ cartas de acto
/** Pide la carta del acto (para tenerla lista antes del entreacto). */
export function prepararCarta(acto: number) { prepararPortada(); const c = man?.cartas.actos.find((a: any) => a.n === acto); if (c) pedir(c.archivo); }
/** Dibuja la carta del acto con su título y la narración. Devuelve false si todavía no está. */
export function dibujarCarta(acto: number, t: number, narracion: string, dur: number): boolean {
  prepararPortada(); if (!man) return false;
  const c = man.cartas.actos.find((a: any) => a.n === acto); if (!c) return false;
  const im = lista(c.archivo); if (!im) return false;
  const cw = man.cartas.w, ch = man.cartas.h, z = man.cartas.zonas;
  const esc = Math.max(W / cw, H / ch) * (1 + 0.04 * Math.min(1, t / 8));
  const ox = W / 2 - (cw * esc) / 2, oy = H / 2 - (ch * esc) / 2;
  const k = Math.min(1, t / 0.8, Math.max(0, (dur - t) / 0.8));
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = k;
  ctx.drawImage(im, ox, oy, cw * esc, ch * esc);
  const P = (zx: number, zy: number) => [ox + zx * esc, oy + zy * esc];
  const [tx, ty] = P(z.titulo.x + z.titulo.w / 2, z.titulo.y + z.titulo.h / 2);
  const tam = Math.round(z.titulo.h * esc * 0.42);
  const nombre = IDI ? c.en : c.es;
  ctx.globalAlpha = k * Math.min(1, Math.max(0, (t - 0.4) / 0.8));
  for (const [dx, dy] of [[-2, 0], [2, 0], [0, -2], [0, 2], [3, 3]]) texto(nombre, tx + dx, ty + dy + tam * 0.35, { alin: 'center', tam, color: '#000', fuente: TITULO });
  texto(nombre, tx, ty + tam * 0.35, { alin: 'center', tam, color: c.color_titulo, fuente: TITULO });
  if (narracion) {
    const [nx, ny] = P(z.narracion.x + z.narracion.w / 2, z.narracion.y);
    const tn = Math.max(16, Math.round(23 * esc));
    ctx.globalAlpha = k * Math.min(1, Math.max(0, (t - 1.2) / 1));
    envolver(narracion, z.narracion.w * esc * 0.92, tn, TITULO).slice(0, 4).forEach((l, i) => texto(l, nx, ny + tn * 1.3 + i * tn * 1.35, { alin: 'center', tam: tn, color: '#e8dcc0', fuente: TITULO }));
  }
  ctx.restore();
  return true;
}

/** Espera a que estén la portada y los títulos fijos (con tope), para que la secuencia arranque con todo y sin el título viejo. */
export async function esperarPortada(tope = 8000) {
  prepararPortada();
  const t0 = performance.now();
  while (performance.now() - t0 < tope) {
    if (portadaLista() && man && ['es', 'en'].every((i) => lista(man.titulo[i].fijo['800']))) return true;
    await new Promise((r) => setTimeout(r, 100));
  }
  return false;
}
