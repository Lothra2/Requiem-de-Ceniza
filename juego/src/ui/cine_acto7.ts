// El acto 7 termina en un final, no en un cartel, y lleva dos películas (ver ui/director.ts):
// - 7a «La Corona tibia» (`CINE_ACTO7`, al caer Aun-Saar): cae, la boca del pecho se cierra, la Corona rueda tibia hasta los pies
//   del héroe, la gloria de la Escalera se apaga y la Marca late o queda gris. Vuelve al juego (la Corona se lleva al campamento).
// - 7b «El final» (`guionFinal`, al entregar la Corona): el final elegido con su epílogo, una toma por línea de `EPILOGOS`, la de
//   Vigdis y los ecos antes de la última, y el título del final con «Fin». Sin líneas nuevas. Por ahora solo la Vigilia: los demás
//   finales siguen con la cinemática y la pantalla de texto de antes (`guionFinal` devuelve null).
// Canon: CLAUDE.md, "Historia y canon".
import { ctx, W, H } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import { libreCerca, type Zona } from '../mundo/zona';
import { finalDe } from '../juego/historia';
import { IDI } from './comun';
import type { DatosHeroe } from '../juego/heroe';
import { EPILOGOS, type Final } from '../mundo/decisiones';
import { textoGotico } from './texto_gotico';
import { dibujarRostro, rostroListo } from './cine_rostro';
import { type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, anclaJefe, anclaSalida, despejarPiezas, despejarPies, vez, ceniza, columnaDe, latido } from './cine_kit';
import { anclaFachada } from './cine_acto1';
import { nievePiso, anclaPuertaFortin } from './cine_acto4';
import { bocaPecho } from './cine_acto6';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(7, n, t0, t1, o);
const hash = (n: number) => { const v = Math.sin(n * 127.1 + 311.7) * 43758.5453; return v - Math.floor(v); };

// ------------------------------------------------------------------ la Corona
/** La Corona de Aun-Saar a pixel (oro con sus puntas y una gema), a `k` de alfa, de canto o echada: lo que rueda y lo que se da. */
function coronaPixel(x: number, y: number, k: number, canto = 0) {
  if (k <= 0) return;
  const X = Math.round(x), Y = Math.round(y), w = Math.round(9 - canto * 4);
  ctx.save(); ctx.globalAlpha = k; ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#3a2408'; ctx.fillRect(X - w - 1, Y - 1, w * 2 + 2, 5);
  ctx.fillStyle = '#c08a24'; ctx.fillRect(X - w, Y, w * 2, 3);
  ctx.fillStyle = '#f0c860'; ctx.fillRect(X - w, Y, w * 2, 1);
  for (let i = 0; i < 5; i++) { const px = X - w + Math.round((i + 0.5) * (w * 2) / 5); ctx.fillStyle = '#d8a038'; ctx.fillRect(px - 1, Y - 4, 2, 4); ctx.fillStyle = '#fff0b0'; ctx.fillRect(px - 1, Y - 5, 1, 1); }
  ctx.fillStyle = '#a01818'; ctx.fillRect(X - 1, Y + 1, 2, 1);
  ctx.restore();
}
/** El vaho tibio que sube de la Corona. */
function vahoTibio(e: EstadoToma, x: number, y: number, dt: number) {
  if (!e.j) return;
  if (Math.random() < dt * 14) e.j.particulas.push({ x: x + (Math.random() - 0.5) * 0.4, y: y + (Math.random() - 0.5) * 0.4, z: 4, vx: 0, vy: 0, vz: 10 + Math.random() * 8, t: 0, dur: 1.6 + Math.random(), color: Math.random() < 0.5 ? '#d8c8a8' : '#a89880', tam: 1, grav: -2, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ 7a: la Corona tibia
const HX = 2.6, HY = -0.9, PIES: [number, number] = [HX - 0.6, HY + 0.5];
const trono = { zona: 'a7_trono', ancla: anclaJefe } as const;
/** La Corona que rueda: sale del cuerpo, da un arco de canto con dos botes chicos y queda a los pies del héroe. */
function coronaRueda(e: EstadoToma, tl: number) {
  const u = Math.min(1, Math.max(0, (tl - 0.8) / 3.2)), s = 1 - (1 - u) ** 2;
  const x = e.ax + 0.3 + (PIES[0] - 0.3) * s + Math.sin(s * Math.PI) * 0.8, y = e.ay + 0.3 + (PIES[1] - 0.3) * s - Math.sin(s * Math.PI) * 0.8;
  const bote = Math.abs(Math.sin(s * Math.PI * 3)) * 6 * (1 - s), [px, py] = aPant(x, y);
  coronaPixel(px, py - 3 - bote, 1, u < 1 ? Math.abs(Math.sin(tl * 9)) : 0);
  e.mem.corona = [x, y];
}
const tomas: Toma[] = [
  {
    // Aun-Saar cae: el golpe corta a ×3, su muerte horneada a cámara lenta; la boca del pecho se cierra mientras se dobla
    id: 'cae', dur: 10, ...trono, entra: 1.4, sale: 0.4, oscuridad: 0.86, hundir: 0.62,
    cam: [{ t: 0, x: 3.2, y: 1.4, alt: 90, zoom: 2, fy: 0.55 }, { t: 3.05, x: 2.2, y: 0.6, alt: 92, c: 'suave' }, { t: 3.06, x: 1.2, y: -0.2, alt: 80, zoom: 3, fy: 0.52 }, { t: 9.6, x: 1.0, y: -0.2, alt: 56, c: 'suave' }],
    actores: [
      { id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.5, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.36 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX + 1.3, y: HY + 0.5, mira: [0, 0] }, { t: 2.2, x: HX + 1.3, y: HY + 0.5 }, { t: 3.0, x: HX, y: HY, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'aun', z: 90, r: 240 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'oro', color: [240, 190, 100], sombra: true, claves: [{ t: 0, x: 0.5, y: 0.5, z: 260, r: 300, k: 0.8 }, { t: 5.5, k: 0.8 }, { t: 9.5, k: 0.2, c: 'suave' }] },
      { id: 'frio', color: [140, 140, 170], claves: [{ t: 0, x: 2, y: 2, z: 160, r: 320, k: 0.25 }] },
    ],
    sonidos: [{ t: 0, id: 'dron_marca', cine: true, tono: 0.55 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.7 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.8, id: 'golpe', cine: true }, { t: 5.8, id: 'sub', cine: true }],
    temblores: [[5.8, 0.7, 4]],
    // (la boca abierta mientras está de pie; se cierra mientras se dobla; ya caído no va)
    mundo: (e, tl) => { if (tl < 4.3) bocaPecho(e, tl < 3.55 ? 1 : Math.max(0, 1 - (tl - 3.55) / 0.7), tl); },
    paso: (e, tl, dt) => { if (e.j && tl > 5.8 && Math.random() < dt * 30) ceniza(e.j, e.ax, e.ay, 1, '#9a8a6a'); },
  },
  {
    // la Corona rueda: se suelta del cuerpo, rueda de canto hasta los pies del héroe y queda humeando, tibia
    id: 'corona', dur: 8, ...trono, entra: 0.3, sale: 0.4, oscuridad: 0.9, hundir: 0.72,
    cam: [{ t: 0, x: 1.4, y: -0.2, alt: 26, zoom: 3, fy: 0.56 }, { t: 8, x: PIES[0], y: PIES[1], alt: 30, c: 'suave' }],
    actores: [
      { id: 'aun', tipo: 'mon', mon: 'aun_saar', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: HX, y: HY, mira: [0, 0] }, { t: 4.2, mira: [PIES[0], PIES[1] + 1] }] },
    ],
    focos: [{ de: [PIES[0], PIES[1]], z: 6, r: 150 }, { de: 'heroe', z: 34, r: 130, k: 0.8 }],
    luces: [{ id: 'tibia', color: [255, 200, 120], claves: [{ t: 0, x: 0.4, y: 0.4, z: 8, r: 80, k: 0.5 }, { t: 4, x: PIES[0], y: PIES[1], c: 'sale' }, { t: 8, k: 0.35 }] }],
    sonidos: [{ t: 0.8, id: 'rueda', cine: true, tono: 1.3 }, ...[4.4, 5.6, 6.8].map((t) => ({ t, id: 'latido', cine: true, vol: 0.6 }))],
    mundo: (e, tl) => coronaRueda(e, tl),
    paso: (e, tl, dt) => { const c = e.mem.corona; if (c && tl > 3.6) vahoTibio(e, c[0], c[1], dt); },
    textos: [L(0, 4.2, 7.8)],
  },
  {
    // el cielo callado: la gloria de la Escalera al Trono se apaga; cae ceniza quieta; solo viento
    id: 'callado', dur: 8, zona: 'a7_jardin', ancla: anclaSalida('a7_escaleras'), entra: 0.8, sale: 0.9, oscuridad: 0.6, hundir: 0.4, lucesZona: 1,
    preparar: (e) => { if (e.z) despejarPiezas(e.z, 'a7_escaleras'); },
    cam: [{ t: 0, x: 3, y: 3, alt: 600, zoom: 0.6, fy: 0.5 }, { t: 8, x: 3.4, y: 3.4, alt: 560, c: 'suave' }],
    focos: [{ de: [-4, -4], z: 600, r: 520, k: 0.6 }],
    luces: [{ id: 'gloria', color: [255, 220, 150], claves: [{ t: 0, x: -4, y: -4, z: 800, r: 1200, k: 0.9 }, { t: 6, k: 0.1, c: 'suave' }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.6, tono: 0.8 }],
    paso: (e, tl, dt) => { if (e.j) { (e.j as any).lucesZonaCine = Math.max(0.1, 1 - tl / 6); if (Math.random() < dt * 30) e.j.particulas.push({ x: e.ax - 6 + (Math.random() - 0.5) * 14, y: e.ay - 6 + (Math.random() - 0.5) * 14, z: 200 + Math.random() * 300, vx: 0, vy: 0, vz: -14, t: 0, dur: 5, color: '#8a8478', tam: 1.4, grav: 0, tipo: 'ceniza' } as any); } },
    textos: [L(1, 1.4, 7.6)],
  },
  {
    // el primer plano: la Marca late roja si bebió la Brasa; si la apagó, queda gris y quieta
    id: 'rostro', dur: 6, entra: 0.2, sale: 1.6,
    omitir: (e) => !rostroListo(e.heroe),
    sonidos: [{ t: 0.4, id: 'latido', cine: true, vol: 1.2 }, { t: 1.5, id: 'latido', cine: true, vol: 1 }, { t: 2.6, id: 'latido', cine: true, vol: 0.8 }],
    pantalla: (e, tl) => { ctx.save(); ctx.fillStyle = '#030202'; ctx.fillRect(0, 0, W, H); ctx.restore(); dibujarRostro(e.heroe, tl, finalDe(e.heroe) === 'destruir' ? 0 : latido(tl), Math.min(1, tl / 1)); },
  },
];
export const CINE_ACTO7: Guion = { id: 'acto7', acto: 7, tomas };

// ------------------------------------------------------------------ 7b: los finales
/** Un texto del epílogo (español e inglés), de t0 a t1. */
const T1 = (par: [string, string], t0: number, t1: number, o: Partial<Texto> = {}): Texto => ({ t0, t1, es: par[0], en: par[1], ...o });
/** Parte un texto largo en dos por sus frases (la franja lleva dos renglones): la primera mitad y después la segunda. */
const mitades = (s: string): [string, string] => { const fr = s.match(/[^.!?]+[.!?]+/g) ?? [s]; if (fr.length < 2) return [s, '']; let a = '', i = 0; while (i < fr.length - 1 && (a + fr[i]).length < s.length * 0.55) a += fr[i++]; if (!a) a = fr[i++]; return [a.trim(), fr.slice(i).join('').trim()]; };
/** Un texto del epílogo (español e inglés), de t0 a t1; si no entra en dos renglones va en dos partes seguidas. */
function T(par: [string, string], t0: number, t1: number, o: Partial<Texto> = {}): Texto[] {
  if (par[0].length < 92 && par[1].length < 100) return [T1(par, t0, t1, o)];
  const [e1, e2] = mitades(par[0]), [n1, n2] = mitades(par[1]); if (!e2) return [T1(par, t0, t1, o)];
  const m = t0 + (t1 - t0) * (e1.length / Math.max(1, par[0].length));
  return [...T([e1, n1 || n2], t0, m - 0.15, o), ...T([e2, n2 || n1], m + 0.15, t1, o)];
}
/** La fogata del Refugio (la del campamento). */
const anclaFogata = (z: Zona): [number, number] => { const o = z.objetos.find((q) => /camp_fogata/.test(q.id)); if (o) return [o.cx + 0.5, o.cy + 0.5]; const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };
const anclaCentro = (z: Zona): [number, number] => { const q = libreCerca(z, z.W / 2, z.H / 2); return [q[0] + 0.5, q[1] + 0.5]; };
/** Una toma del Refugio junto al fuego (los ecos y la última línea de la Vigilia). */
function tomaFuego(id: string, dur: number, textos: Texto[], fuegoMira = true): Toma {
  return {
    id, dur, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.8, sale: 0.8, oscuridad: 0.86, hundir: 0.6, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; despejarPies(e, 2.6, 0.8, 1.4); despejarPies(e, -0.4, 2.8, 1.4); despejarPies(e, 2.6, 2.6, 1.2); },
    cam: [{ t: 0, x: 1.2, y: 1.4, alt: 30, zoom: 3, fy: 0.56 }, { t: dur, x: 1.1, y: 1.3, alt: 32, c: 'suave' }],
    actores: [
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.6, y: 0.8, mira: [0, 0] }] },
      { id: 'odran', tipo: 'sprite', sprite: 'odran', claves: [{ t: 0, x: -0.4, y: 2.8, mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 2.6, y: 2.6, mira: [0, 0] }] },
    ],
    focos: [{ de: [0.3, 0.8], z: 24, r: 170 }],
    // (la llama quieta, que ya no mira: sin titilar)
    luces: [{ id: 'fuego', color: [255, 160, 80], sombra: true, titila: fuegoMira ? 0.12 : 0.02, claves: [{ t: 0, x: 0, y: 0, z: 20, r: 200, k: 1 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.3, tono: 0.7 }],
    textos,
  };
}
/** El título del final y «Fin», en la letra gótica con su brasa (o su escarcha). */
function tituloFin(tl: number, par: [string, string], frio: boolean) {
  ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const k = Math.min(1, tl / 1.4) * Math.min(1, Math.max(0, (8 - tl) / 1.6)); ctx.globalAlpha = k;
  textoGotico((IDI ? par[1] : par[0]).toUpperCase(), W / 2, H * 0.46, Math.max(30, Math.round(H / 12)), { alin: 'center', tono: frio ? 'hueso' : 'oro', brillo: 0.3 } as any);
  textoGotico(IDI ? 'The End' : 'Fin', W / 2, H * 0.58, Math.max(18, Math.round(H / 26)), { alin: 'center', tono: 'ceniza' } as any);
  ctx.restore();
}
/** La línea de Vigdis: salvada llega al Refugio con el deshielo y nieve en el pelo; entregada, su tumba en el Fortín amanece limpia. */
function tomaVigdis(par: [string, string], salvada: boolean): Toma {
  if (salvada) return {
    id: 'vigdis', dur: 8, zona: 'a1_refugio', ancla: anclaFogata, entra: 0.6, sale: 0.6, oscuridad: 0.7, hundir: 0.55, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; despejarPies(e, 3, -2, 3); },
    cam: [{ t: 0, x: 2.2, y: -1.0, alt: 34, zoom: 3, fy: 0.58 }, { t: 8, x: 1.8, y: -0.4, alt: 34, c: 'suave' }],
    actores: [{ id: 'vigdis', tipo: 'sprite', sprite: 'vigdis', claves: [{ t: 0, x: 4.5, y: -3.5, dir: 'so' }, { t: 5, x: 2.0, y: -0.6, c: 'sale' }, { t: 8, dir: 's' }] }],
    focos: [{ de: 'vigdis', z: 30, r: 150 }],
    luces: [{ id: 'fuego', color: [255, 160, 80], sombra: true, titila: 0.1, claves: [{ t: 0, x: 0, y: 0, z: 20, r: 220, k: 0.9 }] }, { id: 'alba', color: [170, 180, 210], claves: [{ t: 0, x: 4, y: -4, z: 300, r: 600, k: 0.3 }] }],
    sonidos: [{ t: 0.3, id: 'nana', cine: true }],
    paso: (e, tl, dt) => { const m = e.actores.get('vigdis') as any; if (e.j && m && Math.random() < dt * 10) e.j.particulas.push({ x: m.x + (Math.random() - 0.5) * 0.5, y: m.y + (Math.random() - 0.5) * 0.5, z: 30 + Math.random() * 10, vx: 0, vy: 0, vz: -8, t: 0, dur: 1.4, color: '#e8eef4', tam: 1, grav: 10, tipo: 'ceniza' } as any); void tl; },
    textos: T(par, 0.8, 7.8),
  };
  return {
    id: 'vigdis', dur: 8, zona: 'a4_fortin', ancla: anclaPuertaFortin, objetos: ['cem_lapida_cruz|intacta'], entra: 0.6, sale: 0.6, oscuridad: 0.75, hundir: 0.6, sinBruma: true, sinClima: ['fx_ventisca', 'fx_niebla'],
    preparar: (e) => { despejarPies(e, 1.5, 2.5, 5); if (e.z && !e.z.objetos.some((o) => o.capa === 'cine')) e.z.objetos.push({ id: 'cem_lapida_cruz', v: 'intacta', cx: Math.floor(e.ax), cy: Math.floor(e.ay), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); },
    cam: [{ t: 0, x: 1.0, y: 1.3, alt: 30, zoom: 3, fy: 0.6 }, { t: 8, x: 0.7, y: 1.0, alt: 36, c: 'suave' }],
    focos: [{ de: [0.3, 0.6], z: 10, r: 140 }],
    luces: [{ id: 'alba', color: [200, 190, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 600, k: 0.35 }] }, { id: 'tibia', color: [255, 190, 130], claves: [{ t: 0, x: 0.4, y: 0.8, z: 6, r: 90, k: 0.45 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.4 }],
    suelo: (e) => nievePiso(e, 15),
    // (la piedra limpia en medio de la nieve: un charco tibio a su pie)
    paso: (e) => vez(e, 'charco', 0, 0, () => { if (e.j) e.j.manchas.push({ x: e.ax + 0.4, y: e.ay + 0.8, r: 0.9, rmax: 1.1, color: '#5a6270', t: 0, tipo: 'hielo', forma: 'charco', sem: 2 } as any); }),
    textos: T(par, 0.8, 7.8),
  };
}

/** La Vigilia: Auren recibe la Corona, los monjes cantan sobre la cripta nueva de Santa Oria, la abadía vela, y el Refugio. */
function vigilia(d: DatosHeroe, vigdis: string | undefined, ecos: [string, string][]): Toma[] {
  const ep = EPILOGOS.vigilia, l = ep.lineas;
  const ts: Toma[] = [
    {
      // el héroe pone la Corona en manos de Auren; él no la mira, la envuelve en el manto y se va hacia la escalera
      id: 'auren', dur: 9, zona: 'a7_campamento', ancla: anclaCentro, entra: 1.0, sale: 0.6, oscuridad: 0.7, hundir: 0.55,
      preparar: (e) => despejarPies(e, 0, 0, 5),
      cam: [{ t: 0, x: 0.4, y: 0.2, alt: 36, zoom: 3, fy: 0.58 }, { t: 9, x: -0.2, y: -0.8, alt: 40, c: 'suave' }],
      actores: [
        { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: -0.6, y: 0.9, mira: [1.1, -1.1] }] },
        { id: 'auren', tipo: 'sprite', sprite: 'auren', claves: [{ t: 0, x: 1.1, y: -1.1, mira: [-0.6, 0.9] }, { t: 4.6, x: 1.1, y: -1.1, dir: 'n' }, { t: 9, x: -1.6, y: -4.2, c: 'lineal' }] },
      ],
      focos: [{ de: [0.2, 0.1], z: 30, r: 170 }],
      luces: [{ id: 'oro', color: [240, 210, 160], sombra: true, claves: [{ t: 0, x: 2, y: 2, z: 200, r: 400, k: 0.6 }] }],
      sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.6, vol: 0.5 }],
      // la Corona pasa de las manos del héroe a las de Auren y desaparece en el manto
      mundo: (e, tl) => {
        const h = e.actores.get('heroe') as any, a = e.actores.get('auren') as any; if (!h || !a) return;
        const u = Math.min(1, Math.max(0, (tl - 1.2) / 1.8)), x = h.x + (a.x - h.x) * u, y = h.y + (a.y - h.y) * u, [px, py] = aPant(x, y);
        coronaPixel(px, py - 30, 1 - Math.max(0, (tl - 3.8) / 0.6));
      },
      textos: T(l[0], 0.8, 8.8),
    },
    {
      // Santa Oria de noche: la cripta nueva abierta y doce monjes con velas alrededor, cantando por turnos
      id: 'cripta', dur: 9, zona: 'a1_cementerio', ancla: anclaFachada, objetos: ['cem_fosa_abierta|vacia', 'mue_velas|grupo'], entra: 0.7, sale: 0.6, oscuridad: 0.84, hundir: 0.6, sinClima: ['fx_lluvia', 'fx_tormenta', 'fx_niebla'],
      preparar: (e) => {
        despejarPies(e, 5, 5, 5); const z: any = e.z; if (!z) return; z.lluvia = false;
        if (!z.objetos.some((o: any) => o.capa === 'cine')) { z.objetos.push({ id: 'cem_fosa_abierta', v: 'vacia', cx: Math.floor(e.ax + 5), cy: Math.floor(e.ay + 5), hw: 1, hh: 1, bloquea: false, capa: 'cine' }); for (const [dx, dy] of [[2.6, 6.4], [6.4, 2.6], [3, 3]]) z.objetos.push({ id: 'mue_velas', v: 'grupo', cx: Math.floor(e.ax + dx), cy: Math.floor(e.ay + dy), hw: 0, hh: 0, bloquea: false, capa: 'cine' }); }
      },
      cam: [{ t: 0, x: 6.2, y: 6.2, alt: 36, zoom: 2, fy: 0.5 }, { t: 9, x: 5.8, y: 5.8, alt: 44, c: 'suave' }],
      actores: Array.from({ length: 12 }, (_, i) => { const an = (i / 12) * Math.PI * 2, r = 3.4 + (i % 2) * 0.7; return { id: 'monje' + i, tipo: 'mon' as const, mon: 'penitente', sombra: ['#2a1e16', 0.72] as [string, number], claves: [{ t: 0, x: 5.4 + Math.cos(an) * r, y: 5.4 + Math.sin(an) * r * 0.9, mira: [5.4, 5.4] as [number, number] }] }; }),
      focos: [{ de: [5.4, 5.4], z: 20, r: 220 }],
      luces: [{ id: 'velas', color: [255, 190, 110], sombra: true, titila: 0.1, claves: [{ t: 0, x: 5.4, y: 5.4, z: 30, r: 230, k: 0.95 }] }, { id: 'luna', color: [120, 130, 170], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 800, k: 0.2 }] }],
      sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.5, vol: 0.8 }],
      textos: T(l[1], 0.6, 8.8),
    },
    {
      // la abadía que vela: Santa Oria de lejos, gris, con la luz de las velas en los vitrales; el canto sigue
      id: 'abadia', dur: 8, zona: 'a1_cementerio', ancla: anclaFachada, entra: 0.6, sale: 0.6, oscuridad: 0.6, hundir: 0.45, sinClima: ['fx_lluvia', 'fx_tormenta'],
      preparar: (e) => { const z: any = e.z; if (z) z.lluvia = false; },
      cam: [{ t: 0, x: 10, y: 10, alt: 230, zoom: 0.6, fy: 0.55 }, { t: 8, x: 8, y: 8, alt: 250, c: 'suave' }],
      focos: [{ de: [-4, -4], z: 200, r: 460, k: 0.6 }],
      luces: [{ id: 'gris', color: [150, 155, 170], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.45 }] }, { id: 'velas', color: [255, 190, 110], claves: [{ t: 0, x: -2, y: -2, z: 120, r: 260, k: 0.7 }] }],
      sonidos: [{ t: 0, id: 'organo_pozo', cine: true, tono: 1.2, vol: 0.5 }],
      textos: T(l[2], 0.6, 7.8),
    },
  ];
  if (vigdis === 'salvar' || vigdis === 'sacrificar') ts.push(tomaVigdis(ep.vigdis[vigdis], vigdis === 'salvar'));
  // los ecos del viaje: de a uno junto al fuego
  if (ecos.length) ts.push(tomaFuego('ecos', 2 + ecos.length * 7, ecos.flatMap((par, i) => T(par, 1 + i * 7, 7.6 + i * 7))));
  ts.push(tomaFuego('fuego', 10, T(l[3], 1.0, 9.4), false));
  ts.push({ id: 'titulo', dur: 8, entra: 0, sale: 1.5, sonidos: [{ t: 0.4, id: 'titulo', cine: true }], pantalla: (_e, tl) => tituloFin(tl, ep.titulo, true) });
  void d;
  return ts;
}

/**
 * El guion del final del héroe (7b), con su Vigdis y sus ecos; null si ese final todavía no tiene película (sigue la cinemática y
 * la pantalla de texto de antes).
 */
export function guionFinal(fin: Final, d: DatosHeroe, vigdis: string | undefined, ecos: [string, string][]): Guion | null {
  if (fin === 'vigilia') return { id: 'fin_vigilia_' + (vigdis ?? '') + ecos.length, acto: 7, tomas: vigilia(d, vigdis, ecos) };
  return null;
}
void hash;
