/**
 * El paso de la portada a la vigilia (o a crear héroe): la cámara se mete por la puerta encendida de la catedral, el
 * fuego de adentro la traga y del negro sale la fogata de la vigilia.
 * Se toma una foto del último cuadro de la portada y se agranda a puntos enteros (sin suavizar, como todo el pixel del
 * juego) hacia la puerta, con brasas que pasan de largo, el calor que crece y el negro; después el negro se abre sobre la
 * pantalla nueva con un resto de calor. Dura 1,15 s y no se guarda nada. `__pasoViejo` vuelve al corte seco de antes.
 */
import { ctx } from '../nucleo/lienzo';
import { acc } from '../nucleo/accesible';
import { puertaPant } from './portada_pixel';
import { Sonido } from '../audio/sonido';

const DUR = 1.15, CAE = 0.55;
let foto: HTMLCanvasElement | null = null, t0 = -1, foco: [number, number] = [0, 0];
interface Ch { a: number; r: number; v: number; c: number }
let chispas: Ch[] = [];

const suave = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k * k * (3 - 2 * k); };
const ahora = () => ((window as any).__pasoReloj ?? performance.now() / 1000) as number;

/** Toma la foto del cuadro que se acaba de dibujar y arranca el paso. */
export function arrancarPasoMenu() {
  if ((window as any).__pasoViejo) return;
  const c = ctx.canvas;
  if (!foto) foto = document.createElement('canvas');
  foto.width = c.width; foto.height = c.height;
  const g = foto.getContext('2d')!; g.imageSmoothingEnabled = false; g.drawImage(c, 0, 0);
  foco = puertaPant ? [puertaPant[0], puertaPant[1]] : [c.width / 2, c.height * 0.52];
  t0 = ahora();
  chispas = [];
  for (let i = 0; i < 70; i++) chispas.push({ a: Math.random() * Math.PI * 2, r: 0.02 + Math.random() * 0.25, v: 0.6 + Math.random() * 1.6, c: Math.floor(Math.random() * 4) });
  try { Sonido.efecto('fuego_lanzar' as any, { vol: 0.32 }); } catch { /* sin sonido */ }
}

/** Mientras la cámara entra no se atienden clics de la pantalla nueva. */
export function pasoMenuTapa(): boolean { return t0 >= 0 && ahora() - t0 < CAE + 0.15; }

const BRASA = ['#ffe9a8', '#ffb347', '#ff7a1f', '#c8380f'];

/** Encima de todo, al final del cuadro. */
export function dibujarPasoMenu() {
  if (t0 < 0 || !foto) return;
  const u = (ahora() - t0) / DUR;
  if (u >= 1 || u < 0) { t0 = -1; return; }
  // (el nombre del héroe es un campo del documento: va encima del lienzo, así que se esconde hasta que se abre el negro)
  if (u < 0.85) { const inp = document.getElementById('nombre') as HTMLInputElement | null; if (inp) inp.style.display = 'none'; }
  const DW = ctx.canvas.width, DH = ctx.canvas.height, D = Math.max(1, Math.round(DH / 540));
  const luz = Math.min(1, Math.max(0.3, Number(acc.destellos ?? 1)));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingEnabled = false;
  ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  if (u < CAE) {
    const a = u / CAE, e = Math.pow(a, 2.3);
    // la escena se agranda hacia la puerta, que va yendo al medio de la pantalla (a puntos enteros: z redondo por D)
    const z = Math.max(1, Math.round((1 + 5 * e) * 4) / 4);
    const cx = foco[0] + (DW / 2 - foco[0]) * suave(a), cy = foco[1] + (DH / 2 - foco[1]) * suave(a);
    ctx.drawImage(foto, Math.round(cx - foco[0] * z), Math.round(cy - foco[1] * z), Math.round(DW * z), Math.round(DH * z));
    // el calor de la puerta que crece y la traga
    ctx.globalCompositeOperation = 'lighter';
    const R = Math.max(DW, DH) * (0.08 + 0.75 * e), k = Math.pow(suave(a * 1.15), 1.4);
    const gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    gr.addColorStop(0, `rgba(255,190,90,${Math.min(1, 1.1 * k) * luz})`); gr.addColorStop(0.3, `rgba(240,100,25,${0.75 * k * luz})`);
    gr.addColorStop(0.7, `rgba(150,35,5,${0.35 * k * luz})`); gr.addColorStop(1, 'rgba(80,10,0,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, DW, DH);
    // brasas que pasan de largo hacia los bordes (la cámara las atraviesa)
    const diag = Math.hypot(DW, DH) * 0.6;
    for (const p of chispas) {
      const r = (p.r + a * a * p.v) * diag; if (r > diag * 1.2) continue;
      const x = cx + Math.cos(p.a) * r, y = cy + Math.sin(p.a) * r * 0.8, q = D * (1 + Math.floor(a * 2.5));
      ctx.globalAlpha = Math.min(1, 0.4 + a) * (1 - a * 0.3);
      ctx.fillStyle = BRASA[p.c]; ctx.fillRect(Math.round(x), Math.round(y), q, q);
      // la estela hacia el centro: dos puntos más apagados
      ctx.globalAlpha *= 0.45; ctx.fillRect(Math.round(x - Math.cos(p.a) * q * 2), Math.round(y - Math.sin(p.a) * q * 1.6), q, q);
    }
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
    // el negro: llega entero justo al final de la entrada
    ctx.fillStyle = `rgba(0,0,0,${Math.pow(suave((a - 0.35) / 0.65), 1.2)})`; ctx.fillRect(0, 0, DW, DH);
  } else {
    // del negro sale la pantalla nueva, con un resto de calor que se va
    const b = (u - CAE) / (1 - CAE);
    ctx.fillStyle = `rgba(0,0,0,${1 - suave(b)})`; ctx.fillRect(0, 0, DW, DH);
    ctx.globalCompositeOperation = 'lighter';
    const gr = ctx.createRadialGradient(DW * 0.5, DH * 0.62, 0, DW * 0.5, DH * 0.62, Math.max(DW, DH) * 0.6);
    gr.addColorStop(0, `rgba(255,120,40,${0.22 * (1 - b) * luz})`); gr.addColorStop(1, 'rgba(255,80,20,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, DW, DH);
  }
  ctx.restore();
}
