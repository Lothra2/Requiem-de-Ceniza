// Luz avanzada (rama luz-gpu): luz de verdad por punto con la tarjeta gráfica, encima del dibujo de siempre.
//
// Mientras se pinta el mundo, cada sprite que trae relieve horneado (atlas gemelos _n y _h: hacia dónde mira cada punto
// y a qué altura está) se dibuja también en dos lienzos paralelos, con la misma posición y el mismo orden. Lo que no
// trae relieve borra lo de abajo (queda sin reiluminar). Al terminar el mundo, un pase de WebGL toma la imagen, el
// relieve y la altura y, con las luces de la zona (las mismas fogatas y antorchas de luces.ts), aclara lo que mira a
// cada fuego y oscurece lo que le da la espalda. Después suma un resplandor (bloom) de lo que brilla.
import { relDe } from '../motor/assets';
import { lienzoTrabajo } from '../motor/lienzos';
import type { Cuadro } from '../motor/assets';

export const lab = { on: true, fuerza: 1, bloom: 1.1, ms: 0, heroe: 0.7 };
(window as any).__lab = lab; (window as any).__luzCv = () => ({ relCv, altCv, glCv });

let relCv: HTMLCanvasElement | null = null, altCv: HTMLCanvasElement | null = null;
let relC: CanvasRenderingContext2D | null = null, altC: CanvasRenderingContext2D | null = null;
let activo = false, principal: CanvasRenderingContext2D | null = null;

/** Al empezar el pase del mundo: los lienzos paralelos del tamaño del lienzo principal, vacíos. */
export function empezarRelieve(c: CanvasRenderingContext2D) {
  if (!lab.on) { activo = false; return; }
  const w = c.canvas.width, h = c.canvas.height;
  if (!relCv) { relCv = document.createElement('canvas'); altCv = document.createElement('canvas'); relC = relCv.getContext('2d')!; altC = altCv.getContext('2d')!; }
  if (relCv.width !== w || relCv.height !== h) { relCv.width = altCv!.width = w; relCv.height = altCv!.height = h; }
  relC!.setTransform(1, 0, 0, 1, 0, 0); altC!.setTransform(1, 0, 0, 1, 0, 0);
  relC!.clearRect(0, 0, w, h); altC!.clearRect(0, 0, w, h);
  relC!.imageSmoothingEnabled = false; altC!.imageSmoothingEnabled = false;
  principal = c; activo = true;
}

let esHeroe = false;
/** Mientras se pinta el héroe: su silueta va en el azul del lienzo de altura (B no lo usa nada más) y el pase de luz no
 * lo hunde con las luces de atrás (quedaba gris y se perdía, Rick quiere su héroe siempre legible). */
export const marcarHeroe = (on: boolean) => { esHeroe = on; };
/** Lo llama dibujar() después de pintar un sprite en el lienzo principal. */
export function ganchoRelieve(c: CanvasRenderingContext2D, q: Cuadro, im: CanvasImageSource, x: number, y: number, escala: number) {
  if (!activo || c !== principal || !relC) return;
  if (c.globalCompositeOperation !== 'source-over') return; // (lo que se suma como luz no tapa nada)
  const tr = c.getTransform(); relC.setTransform(tr); altC!.setTransform(tr);
  relC.globalAlpha = altC!.globalAlpha = c.globalAlpha;
  const dx = escala === 1 ? Math.round(x - q.ax) : x - q.ax * escala, dy = escala === 1 ? Math.round(y - q.ay) : y - q.ay * escala, dw = q.w * escala, dh = q.h * escala;
  const n = q.rel ?? relDe(q.atlas + '_n'), a = q.alt ?? relDe(q.atlas + '_h');
  if (n) {
    relC.drawImage(n, q.x, q.y, q.w, q.h, dx, dy, dw, dh);
    if (a) altC!.drawImage(a, q.x, q.y, q.w, q.h, dx, dy, dw, dh);
    else { altC!.globalCompositeOperation = 'destination-out'; altC!.drawImage(im, q.x, q.y, q.w, q.h, dx, dy, dw, dh); altC!.globalCompositeOperation = 'source-over'; }
    if (esHeroe) { const t = lienzoTrabajo(q.w, q.h); t.c.globalCompositeOperation = 'copy'; t.c.drawImage(im, q.x, q.y, q.w, q.h, 0, 0, q.w, q.h); t.c.globalCompositeOperation = 'source-in'; t.c.fillStyle = '#0000ff'; t.c.fillRect(0, 0, q.w, q.h); t.c.globalCompositeOperation = 'source-over'; altC!.globalCompositeOperation = 'lighter'; altC!.drawImage(t.cv, 0, 0, q.w, q.h, dx, dy, dw, dh); altC!.globalCompositeOperation = 'source-over'; }
  } else {
    // sin relieve: lo que había debajo deja de valer (no se reilumina con la forma de otro)
    relC.globalCompositeOperation = altC!.globalCompositeOperation = 'destination-out';
    relC.drawImage(im, q.x, q.y, q.w, q.h, dx, dy, dw, dh); altC!.drawImage(im, q.x, q.y, q.w, q.h, dx, dy, dw, dh);
    relC.globalCompositeOperation = altC!.globalCompositeOperation = 'source-over';
  }
  relC.globalAlpha = altC!.globalAlpha = 1;
}

// ------------------------------------------------------------------ WebGL
let gl: WebGL2RenderingContext | null = null, glCv: HTMLCanvasElement | null = null;
let pLuz: WebGLProgram, pBrillo: WebGLProgram, pBlur: WebGLProgram, pFin: WebGLProgram;
const tex: Record<string, WebGLTexture> = {}; const fbo: Record<string, { f: WebGLFramebuffer; t: WebGLTexture; w: number; h: number }> = {};
const VS = `#version 300 es
in vec2 p; out vec2 uv; void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;
const MAXL = 48;
const FS_LUZ = `#version 300 es
precision highp float; in vec2 uv; out vec4 o;
uniform sampler2D tC, tN, tA; uniform vec2 res; uniform int nl; uniform vec4 lp[${MAXL}]; uniform vec4 lc[${MAXL}]; uniform float fuerza, zpx;
void main() {
  vec2 st = vec2(uv.x, 1.0 - uv.y);
  vec4 C = texture(tC, st), N = texture(tN, st), A = texture(tA, st);
  if (N.a < 0.3 || N.a < 0.62 && N.a > 0.38) { o = vec4(C.rgb, 1.0); return; }
  vec3 n = N.rgb * 2.0 - 1.0;
  vec3 nf = normalize(vec3((n.x - n.y) * 0.7071, (n.x + n.y) * 0.7071, n.z));
  float z = (A.r * 255.0 + A.g) * step(0.5, A.a);
  vec2 px = st * res;
  float zp = z * zpx;                       // alto en puntos de pantalla
  vec3 P = vec3(px.x, (px.y + zp) * 2.0, zp * 1.15);
  vec3 acc = vec3(0.0); float sombra = 0.0;
  for (int i = 0; i < ${MAXL}; i++) {
    if (i >= nl) break;
    vec3 L = vec3(lp[i].x, lp[i].y * 2.0, lp[i].z * 1.15);
    vec3 d = L - P;
    float ds = length(vec2(d.x, d.y * 0.5)), r = lp[i].w;
    float att = pow(max(0.0, 1.0 - ds / r), 2.0);
    if (att <= 0.0) continue;
    float dif = dot(nf, normalize(d));
    // lo que mira al fuego se enciende de su color; lo que le da la espalda se hunde en gris (sin teñirse)
    float ka = abs(lc[i].a);
    acc += lc[i].rgb * ka * att * max(dif, 0.0);
    // (la lámpara del héroe, con a negativa, solo alumbra: si hundiera lo que le da la espalda, el héroe quedaba gris)
    if (lc[i].a > 0.0) sombra += ka * att * (max(-dif, 0.0) + 0.18);
  }
  // (el piso, que mira para arriba, se quemaba junto a cada vela: lo horizontal toma menos que los cuerpos y los muros)
  acc *= mix(1.0, 0.5, nf.z * nf.z);
  // (varias velas juntas se sumaban hasta quemar: techo suave, como la exposición de una cámara)
  acc = acc / (1.0 + acc * 0.9);
  float tope = A.b > 0.5 ? 0.12 : 0.62; // (el héroe: la luz de atrás casi no lo hunde)
  vec3 lit = C.rgb * (1.0 + acc * 1.7 * fuerza) * (1.0 - min(tope, sombra * 0.6 * fuerza)) + acc * C.rgb * 0.35 * fuerza;
  o = vec4(lit, 1.0);
}`;
const FS_BRILLO = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t, tN; uniform vec2 px;
void main() {
  vec3 s = vec3(0.0);
  for (int y = -1; y <= 2; y++) for (int x = -1; x <= 2; x++) {
    vec2 q = uv + vec2(float(x), float(y)) * px;
    vec3 c = texture(t, q).rgb; float lum = dot(c, vec3(0.299, 0.587, 0.114));
    float em = texture(tN, vec2(q.x, 1.0 - q.y)).a; em = step(0.38, em) * step(em, 0.62);
    s += c * max(smoothstep(0.6, 0.95, lum) * 0.8, em * 1.1);
  }
  o = vec4(s / 16.0, 1.0);
}`;
const FS_BLUR = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t; uniform vec2 dir;
void main() {
  float w[5] = float[](0.227, 0.194, 0.121, 0.054, 0.016);
  vec3 s = texture(t, uv).rgb * w[0];
  for (int i = 1; i < 5; i++) { s += texture(t, uv + dir * float(i)).rgb * w[i]; s += texture(t, uv - dir * float(i)).rgb * w[i]; }
  o = vec4(s, 1.0);
}`;
const FS_FIN = `#version 300 es
precision highp float; in vec2 uv; out vec4 o; uniform sampler2D t, b; uniform float kb;
void main() { vec3 c = texture(t, uv).rgb + texture(b, uv).rgb * kb; o = vec4(c, 1.0); }`;

function prog(fs: string): WebGLProgram {
  const g = gl!, sh = (t: number, s: string) => { const x = g.createShader(t)!; g.shaderSource(x, s); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(x) ?? 'shader'); return x; };
  const p = g.createProgram()!; g.attachShader(p, sh(g.VERTEX_SHADER, VS)); g.attachShader(p, sh(g.FRAGMENT_SHADER, fs)); g.bindAttribLocation(p, 0, 'p'); g.linkProgram(p);
  if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? 'link');
  return p;
}
function textura(): WebGLTexture { const g = gl!, t = g.createTexture()!; g.bindTexture(g.TEXTURE_2D, t); for (const [k, v] of [[g.TEXTURE_MIN_FILTER, g.LINEAR], [g.TEXTURE_MAG_FILTER, g.LINEAR], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D, k, v); return t; }
function marco(n: string, w: number, h: number) {
  const g = gl!; let m = fbo[n];
  if (m && m.w === w && m.h === h) return m;
  const t = m?.t ?? textura(); g.bindTexture(g.TEXTURE_2D, t); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA8, w, h, 0, g.RGBA, g.UNSIGNED_BYTE, null);
  const f = m?.f ?? g.createFramebuffer()!; g.bindFramebuffer(g.FRAMEBUFFER, f); g.framebufferTexture2D(g.FRAMEBUFFER, g.COLOR_ATTACHMENT0, g.TEXTURE_2D, t, 0);
  return (fbo[n] = { f, t, w, h });
}
function iniciar(): boolean {
  if (gl) return true;
  glCv = document.createElement('canvas');
  gl = glCv.getContext('webgl2', { premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return false;
  pLuz = prog(FS_LUZ); pBrillo = prog(FS_BRILLO); pBlur = prog(FS_BLUR); pFin = prog(FS_FIN);
  const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  for (const k of ['C', 'N', 'A']) tex[k] = textura();
  return true;
}
const subir = (k: string, src: TexImageSource) => { const g = gl!; g.bindTexture(g.TEXTURE_2D, tex[k]); g.pixelStorei(g.UNPACK_FLIP_Y_WEBGL, false); g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, src); };
const usar = (p: WebGLProgram, texs: [string, WebGLTexture][]) => { const g = gl!; g.useProgram(p); texs.forEach(([n, t], i) => { g.activeTexture(g.TEXTURE0 + i); g.bindTexture(g.TEXTURE_2D, t); g.uniform1i(g.getUniformLocation(p, n), i); }); };
const dibujarQuad = () => gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);

export interface LuzLab { x: number; y: number; h: number; r: number; c: [number, number, number]; k: number }
/**
 * Al terminar el mundo: reilumina con las luces (en coordenadas del pase del mundo; `tr` lleva al lienzo) y suma el
 * resplandor. Devuelve false si no hay WebGL (queda el dibujo de siempre).
 */
export function aplicarLuzGPU(c: CanvasRenderingContext2D, luces: LuzLab[], tr: DOMMatrix): boolean {
  activo = false;
  if (!lab.on || !relCv) return false;
  const t0 = performance.now();
  if (!iniciar()) return false;
  const g = gl!, w = c.canvas.width, h = c.canvas.height;
  if (glCv!.width !== w || glCv!.height !== h) { glCv!.width = w; glCv!.height = h; }
  subir('C', c.canvas); subir('N', relCv); subir('A', altCv!);
  // luces al lienzo: posición del pie, alto y radio por la escala del pase del mundo
  // (con la vista Lejos en pantalla grande entran muchas más velas: antes se tomaban las 24 primeras de la lista, que
  // podían quedar fuera de cuadro, y las de al lado del héroe no alumbraban. Ahora van las que tocan la pantalla, las
  // más cercanas al centro primero)
  const k = tr.a, lp = new Float32Array(MAXL * 4), lc = new Float32Array(MAXL * 4);
  const ls = luces.map((l) => ({ l, x: tr.a * l.x + tr.c * l.y + tr.e, y: tr.b * l.x + tr.d * l.y + tr.f, r: l.r * k * 1.35 }))
    .filter((q) => q.x > -q.r && q.x < w + q.r && q.y > -q.r && q.y < h + q.r)
    .map((q) => ({ ...q, d: Math.hypot(q.x - w / 2, q.y - h / 2) - q.r })).sort((a, b) => a.d - b.d).slice(0, MAXL);
  ls.forEach((q, i) => { const l = q.l; lp.set([q.x, q.y, l.h * k, q.r], i * 4); lc.set([l.c[0] / 255, l.c[1] / 255, l.c[2] / 255, (l as any).blanca ? -lab.heroe : Math.min(1.4, 0.55 + l.k * 0.9)], i * 4); });
  // (la lámpara del héroe también: en las mazmorras es la que alumbra casi todo y sin ella el relieve no se veía)
  // 1. reiluminar
  const mL = marco('luz', w, h); g.bindFramebuffer(g.FRAMEBUFFER, mL.f); g.viewport(0, 0, w, h);
  usar(pLuz, [['tC', tex.C], ['tN', tex.N], ['tA', tex.A]]);
  g.uniform2f(g.getUniformLocation(pLuz, 'res'), w, h); g.uniform1i(g.getUniformLocation(pLuz, 'nl'), ls.length);
  g.uniform4fv(g.getUniformLocation(pLuz, 'lp'), lp); g.uniform4fv(g.getUniformLocation(pLuz, 'lc'), lc);
  g.uniform1f(g.getUniformLocation(pLuz, 'fuerza'), lab.fuerza); g.uniform1f(g.getUniformLocation(pLuz, 'zpx'), (75 / 61) * k);
  dibujarQuad();
  // 2. resplandor: lo que brilla, a un cuarto, desenfocado en dos pasadas (dos veces)
  const bw = Math.max(1, w >> 2), bh = Math.max(1, h >> 2), mB = marco('b1', bw, bh), mB2 = marco('b2', bw, bh);
  g.bindFramebuffer(g.FRAMEBUFFER, mB.f); g.viewport(0, 0, bw, bh);
  usar(pBrillo, [['t', mL.t], ['tN', tex.N]]); g.uniform2f(g.getUniformLocation(pBrillo, 'px'), 1 / w, 1 / h); dibujarQuad();
  for (let pasada = 0; pasada < 2; pasada++) {
    g.bindFramebuffer(g.FRAMEBUFFER, mB2.f); usar(pBlur, [['t', mB.t]]); g.uniform2f(g.getUniformLocation(pBlur, 'dir'), (1.6 + pasada) / bw, 0); dibujarQuad();
    g.bindFramebuffer(g.FRAMEBUFFER, mB.f); usar(pBlur, [['t', mB2.t]]); g.uniform2f(g.getUniformLocation(pBlur, 'dir'), 0, (1.6 + pasada) / bh); dibujarQuad();
  }
  // 3. junto, a la pantalla del WebGL (al derecho)
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.viewport(0, 0, w, h);
  usar(pFin, [['t', mL.t], ['b', mB.t]]); g.uniform1f(g.getUniformLocation(pFin, 'kb'), lab.bloom); dibujarQuad();
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'copy'; c.drawImage(glCv!, 0, 0); c.restore();
  lab.ms = lab.ms * 0.9 + (performance.now() - t0) * 0.1;
  return true;
}

// En PC la tecla L prende y apaga la luz avanzada al vuelo (para comparar). Lo de siempre se elige en Opciones, Luz.
if (typeof addEventListener === 'function') addEventListener('keydown', (e: KeyboardEvent) => { if ((e.key === 'l' || e.key === 'L') && !(e.target instanceof HTMLInputElement)) lab.on = !lab.on; });
/** ¿Este aparato puede con la luz avanzada? (WebGL2) */
export const hayGPU = (() => { try { return !!document.createElement('canvas').getContext('webgl2'); } catch { return false; } })();
