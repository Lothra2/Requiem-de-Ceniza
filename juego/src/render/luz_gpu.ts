// Luz avanzada (rama luz-gpu): luz de verdad por punto con la tarjeta gráfica, encima del dibujo de siempre.
//
// Mientras se pinta el mundo, cada sprite que trae relieve horneado (atlas gemelos _n y _h: hacia dónde mira cada punto
// y a qué altura está) se dibuja también en dos lienzos paralelos, con la misma posición y el mismo orden. Lo que no
// trae relieve borra lo de abajo (queda sin reiluminar). Al terminar el mundo, un pase de WebGL toma la imagen, el
// relieve y la altura y, con las luces de la zona (las mismas fogatas y antorchas de luces.ts), aclara lo que mira a
// cada fuego y oscurece lo que le da la espalda. Después suma un resplandor (bloom) de lo que brilla.
import { relDe, bajandoAlgo, relBajando } from '../motor/assets';
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

/** Los lienzos de relieve y alto del cuadro, si la luz avanzada está pintando sobre `c` (para copiar ahí los trozos del piso). */
export const lienzosRelieve = (c: CanvasRenderingContext2D): [CanvasRenderingContext2D, CanvasRenderingContext2D] | null => (activo && c === principal && relC ? [relC, altC!] : null);
let falto = false;
/** Mientras se pinta un trozo del piso guardado: el gancho dibuja su relieve en los lienzos del trozo. */
export function desviarRelieve(c: CanvasRenderingContext2D, r: CanvasRenderingContext2D, a: CanvasRenderingContext2D) {
  const antes = { principal, relC, altC, activo, esHeroe }; principal = c; relC = r; altC = a; activo = true; esHeroe = false; falto = false; return antes;
}
/** Vuelve al lienzo de siempre. Devuelve false si algún relieve estaba bajando (el trozo no se guarda). */
export function devolverRelieve(a: ReturnType<typeof desviarRelieve>): boolean {
  ({ principal, relC, altC, activo, esHeroe } = a); return !falto;
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
  if ((!n && relBajando(q.atlas + '_n')) || (!a && relBajando(q.atlas + '_h'))) falto = true;
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
  vigilar(); if (!lab.on) return false;
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
// Solo con tarjeta gráfica de verdad. Si Chrome da un WebGL por software (sin aceleración, tarjeta en lista negra:
// SwiftShader, llvmpipe), el pase corre a un cuadro cada dos o tres segundos (Rick, 19 nov 2026): ahí no se enciende.
export const infoGPU = (() => { try { const g = document.createElement('canvas').getContext('webgl2', { failIfMajorPerformanceCaveat: true }); if (!g) return { ok: false, que: 'sin webgl2 acelerado' }; const ext = g.getExtension('WEBGL_debug_renderer_info'); const que = String(ext ? g.getParameter(ext.UNMASKED_RENDERER_WEBGL) : g.getParameter(g.RENDERER)); g.getExtension('WEBGL_lose_context')?.loseContext(); return { ok: !/swiftshader|llvmpipe|software|softpipe|basic render|microsoft basic/i.test(que), que }; } catch { return { ok: false, que: 'error' }; } })();
(window as any).__gpu = infoGPU;
export const hayGPU = infoGPU.ok;

// Guardia: si con la luz avanzada el juego va lento de verdad (más de 70 ms por cuadro sostenido 2 s), se apaga sola, se
// guarda en Opciones y se avisa. Así nunca queda injugable en un equipo que no la aguanta.
let ultimoT = 0, media = 16, lentoDesde = 0, desde = 0;
let alApagar: (() => void) | null = null;
export const fijarAvisoLuz = (f: () => void) => { alApagar = f; };
function vigilar() {
  const ahora = performance.now();
  if (!ultimoT || ahora - ultimoT > 1500) { ultimoT = ahora; desde = ahora; lentoDesde = 0; media = 16; return; } // (pestaña dormida o recién prendida)
  const dt = ahora - ultimoT; ultimoT = ahora; media = media * 0.85 + dt * 0.15;
  // (al prenderla o entrar a una zona se bajan y suben a la tarjeta los relieves: esos cuadros no cuentan. Antes la
  // guardia la apagaba justo ahí y quedaba guardada en Clásica aunque la RTX de Rick la aguanta de sobra)
  if (bajandoAlgo()) { desde = ahora; lentoDesde = 0; return; }
  if (ahora - desde < 6000) return;
  if (media > 90) { if (!lentoDesde) lentoDesde = ahora; else if (ahora - lentoDesde > 4000) { lab.on = false; lentoDesde = 0; alApagar?.(); } } else lentoDesde = 0;
}

// ------------------------------------------------------------------ un sprite suelto con su luz (la selección de clase)
// El héroe de la presentación es pixel art a puntos enteros: la luz se calcula por PUNTO DEL DIBUJO (no de la pantalla)
// en un lienzo del tamaño del cuadro, y después el juego lo agranda a ×2 o ×3 sin suavizar. Así cada pixel lleva una sola
// luz y la fogata no pinta degradés lisos dentro de los pixeles. Con su propio contexto de WebGL, chiquito, para no tocar
// el del mundo.
let glS: WebGL2RenderingContext | null = null, glSCv: HTMLCanvasElement | null = null, pSprite: WebGLProgram | null = null, sinGLS = false;
/** Texturas de atlas subidas (color, relieve, alto), las últimas usadas: cada clase tiene su atlas. */
const texS = new Map<string, { t: WebGLTexture; usado: number }>();
const FS_SPRITE = `#version 300 es
precision highp float; out vec4 o;
uniform sampler2D tC, tN, tA; uniform ivec4 rect; uniform vec2 ancla; uniform float kz;
uniform vec4 fuego; uniform vec3 fCol; uniform float fK, sombraK, filoK, aire; uniform vec3 rimDir; uniform vec3 rimCol; uniform float rimK;
void main() {
  ivec2 q = ivec2(gl_FragCoord.xy); q.y = rect.w - 1 - q.y;
  ivec2 t = rect.xy + q;
  vec4 C = texelFetch(tC, t, 0), N = texelFetch(tN, t, 0), A = texelFetch(tA, t, 0);
  if (C.a < 0.01) { o = vec4(0.0); return; }
  // lo que brilla solo (gemas, fuego, ojos de brasa) y lo que no trae relieve queda como está
  if (N.a < 0.3 || (N.a < 0.62 && N.a > 0.38)) { o = C; return; }
  vec3 n = normalize(N.rgb * 2.0 - 1.0);
  // el punto en el mundo del cuadro: x - y es la columna, x + y sale de la fila y del alto (la vista isométrica del motor)
  float z = A.r * 255.0 + A.g;
  float sx = float(q.x) - ancla.x, sy = float(q.y) - ancla.y;
  float S = 2.0 * (sy + kz * z), D = sx;
  vec3 P = vec3((S + D) * 0.5, (S - D) * 0.5, z);
  vec3 L = fuego.xyz - P; float d = length(L); vec3 l = L / d;
  float att = 1.0 / (1.0 + (d / fuego.w) * (d / fuego.w));
  float dif = dot(n, l);
  vec3 V = normalize(vec3(1.0, 1.0, 1.0 / kz)); // hacia la cámara
  float canto = pow(1.0 - max(dot(n, V), 0.0), 2.0);
  vec3 c = C.rgb;
  // la cara que mira al fuego se calienta y aclara con su latido; la de atrás cae a la sombra (más lejos, más honda)
  vec3 calor = fCol * fK * att * max(dif, 0.0);
  float sombra = sombraK * (max(-dif, 0.0) * 0.8 + 0.25) * (1.0 - att * 0.6) + aire * (1.0 - att);
  c = c * (1.0 - min(0.7, sombra)) + c * calor * 1.6 + calor * 0.04;
  // el filo del lado del fuego: los bordes de la silueta que lo miran se encienden de su color
  c += fCol * filoK * att * canto * max(dif, 0.0) * (0.25 + dot(C.rgb, vec3(0.3, 0.5, 0.2)));
  // la contraluz fría de atrás, apenas
  c += rimCol * rimK * canto * max(dot(n, rimDir), 0.0) * (0.3 + 0.7 * smoothstep(0.0, 120.0, z));
  // sin quemar: lo que pasa de 0.86 se dobla suave hacia el blanco cálido
  vec3 sobre = max(c - 0.86, 0.0); c = min(c, 0.86) + sobre / (1.0 + sobre * 3.0);
  o = vec4(c, C.a);
}`;
function iniciarS(): boolean {
  if (glS) return true; if (sinGLS) return false;
  glSCv = document.createElement('canvas');
  glS = glSCv.getContext('webgl2', { premultipliedAlpha: false, antialias: false, preserveDrawingBuffer: true, alpha: true });
  if (!glS) { sinGLS = true; return false; }
  try {
    const g = glS, sh = (t: number, s: string) => { const x = g.createShader(t)!; g.shaderSource(x, s); g.compileShader(x); if (!g.getShaderParameter(x, g.COMPILE_STATUS)) throw new Error(g.getShaderInfoLog(x) ?? 'shader'); return x; };
    const p = g.createProgram()!; g.attachShader(p, sh(g.VERTEX_SHADER, VS)); g.attachShader(p, sh(g.FRAGMENT_SHADER, FS_SPRITE)); g.bindAttribLocation(p, 0, 'p'); g.linkProgram(p);
    if (!g.getProgramParameter(p, g.LINK_STATUS)) throw new Error(g.getProgramInfoLog(p) ?? 'link');
    pSprite = p;
    const b = g.createBuffer(); g.bindBuffer(g.ARRAY_BUFFER, b); g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), g.STATIC_DRAW);
    g.enableVertexAttribArray(0); g.vertexAttribPointer(0, 2, g.FLOAT, false, 0, 0);
  } catch (e) { console.warn('luz del sprite', e); glS = null; sinGLS = true; return false; }
  return true;
}
function texAtlas(nombre: string, im: CanvasImageSource): WebGLTexture {
  const g = glS!; let e = texS.get(nombre);
  if (!e) {
    const t = g.createTexture()!; g.bindTexture(g.TEXTURE_2D, t);
    for (const [k, v] of [[g.TEXTURE_MIN_FILTER, g.NEAREST], [g.TEXTURE_MAG_FILTER, g.NEAREST], [g.TEXTURE_WRAP_S, g.CLAMP_TO_EDGE], [g.TEXTURE_WRAP_T, g.CLAMP_TO_EDGE]]) g.texParameteri(g.TEXTURE_2D, k, v);
    // (sin premultiplicar ni corregir color: el relieve y el alto son datos, no colores)
    g.pixelStorei(g.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); g.pixelStorei(g.UNPACK_COLORSPACE_CONVERSION_WEBGL, g.NONE);
    g.texImage2D(g.TEXTURE_2D, 0, g.RGBA, g.RGBA, g.UNSIGNED_BYTE, im as TexImageSource);
    // las de hace rato se sueltan (cada atlas de retrato son unos MB en la tarjeta), antes de anotar la nueva: si no, la
    // nueva era la de uso más viejo y se borraba al toque (se veía el atlas de otra clase)
    if (texS.size >= 9) { const viejo = [...texS.entries()].sort((a, b) => a[1].usado - b[1].usado)[0]; g.deleteTexture(viejo[1].t); texS.delete(viejo[0]); }
    e = { t, usado: 0 }; texS.set(nombre, e);
  }
  e.usado = performance.now();
  return e.t;
}
export interface LuzSprite {
  /** El fuego en unidades del cuadro, desde el ancla (los pies): x a la derecha, y hacia abajo en pantalla, alto sobre el piso. */
  sx: number; sy: number; alto: number; radio: number;
  color: [number, number, number]; fuerza: number; sombra: number; filo: number; aire?: number;
  rim?: { dir: [number, number, number]; color: [number, number, number]; fuerza: number };
}
/**
 * El cuadro `q` reiluminado por la fogata, en un lienzo de su mismo tamaño en puntos (para dibujar a escala entera sin
 * suavizar). null si no hay WebGL2, la luz avanzada está apagada o el relieve todavía no bajó: entonces va el de siempre.
 */
export function spriteConLuz(q: Cuadro, luz: LuzSprite): HTMLCanvasElement | null {
  if (!lab.on || !q.img) return null;
  const n = relDe(q.atlas + '_n'), a = relDe(q.atlas + '_h');
  if (!n || !a || !iniciarS()) return null;
  const g = glS!, cv = glSCv!;
  if (cv.width !== q.w || cv.height !== q.h) { cv.width = q.w; cv.height = q.h; }
  g.viewport(0, 0, q.w, q.h);
  g.useProgram(pSprite);
  const texs: [string, WebGLTexture][] = [['tC', texAtlas(q.atlas, q.img)], ['tN', texAtlas(q.atlas + '_n', n)], ['tA', texAtlas(q.atlas + '_h', a)]];
  texs.forEach(([nm, t], i) => { g.activeTexture(g.TEXTURE0 + i); g.bindTexture(g.TEXTURE_2D, t); g.uniform1i(g.getUniformLocation(pSprite!, nm), i); });
  const u = (nm: string) => g.getUniformLocation(pSprite!, nm);
  const KZ = Math.sqrt(1.5);
  // el fuego al mundo del cuadro (la misma cuenta que el punto)
  const S = 2 * (luz.sy + KZ * luz.alto), D = luz.sx;
  g.uniform4i(u('rect'), q.x, q.y, q.w, q.h); g.uniform2f(u('ancla'), q.ax, q.ay); g.uniform1f(u('kz'), KZ);
  g.uniform4f(u('fuego'), (S + D) / 2, (S - D) / 2, luz.alto, luz.radio);
  g.uniform3f(u('fCol'), luz.color[0], luz.color[1], luz.color[2]); g.uniform1f(u('fK'), luz.fuerza); g.uniform1f(u('sombraK'), luz.sombra); g.uniform1f(u('filoK'), luz.filo); g.uniform1f(u('aire'), luz.aire ?? 0);
  const r = luz.rim ?? { dir: [0, 0, 1], color: [0, 0, 0], fuerza: 0 }, rl = Math.hypot(...r.dir) || 1;
  g.uniform3f(u('rimDir'), r.dir[0] / rl, r.dir[1] / rl, r.dir[2] / rl); g.uniform3f(u('rimCol'), r.color[0], r.color[1], r.color[2]); g.uniform1f(u('rimK'), r.fuerza);
  g.bindFramebuffer(g.FRAMEBUFFER, null); g.disable(g.BLEND); g.clearColor(0, 0, 0, 0); g.clear(g.COLOR_BUFFER_BIT);
  g.drawArrays(g.TRIANGLE_STRIP, 0, 4);
  return cv;
}
