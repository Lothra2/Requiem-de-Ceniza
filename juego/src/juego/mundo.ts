// La simulación: héroe, monstruos, invocados, proyectiles, áreas, botín y efectos de una zona.
import { npcVivo } from './historia';
import { generarZona, pasable, buscarCamino, lineaLibre, lineaPasable, libreCerca, type Zona, type ObjZ } from '../mundo/zona';
import { ZONAS, POBL_ZONA, MISIONES, FRASE_JEFE, FRASE_JEFE_ZONA } from '../mundo/actos';
import { MONSTRUOS, POBLACION, MODS, NOMBRES_UNICOS, type DefMonstruo } from '../datos/monstruos';
import { HABILIDADES, INVOCADOS, ATAQUE, ESCALA_HECHIZOS, poderNivel, danoInvocadoNivel, type Habilidad } from '../datos/clases';
import { GENTE, NPCS } from '../datos/npcs';
import { LUZ_EFECTO } from '../../../src/engine/gotico/luz_efectos';
import { calcular, nivelHab, xpPara, recoger, NIVEL_MAX, nivelEnDificultad, cicloExtra, cant, rellenarColumna, type DatosHeroe, type Calc } from './heroe';
import { botin, crearObjeto, crearUnicoId, legendariaJefe, valorPocion, crearObjetoThor, type Objeto, type Caida } from './objetos';
import { TALISMAN_JEFE } from '../datos/talismanes';
import type { Elemento } from './tipos_objetos';
import { R, entre, elegir, clamp, dist, hashTxt } from '../nucleo/azar';
import { Sonido } from '../audio/sonido';
import { oirLibro } from './libro_oido';
import { repartir, pasoRonda, type SitioTirado } from './reparto';
import { zancada } from '../../../src/engine/gotico/figura';
import { manifiesto, objetoMeta } from '../motor/assets';
/**
 * Qué celdas tapan un tiro: solo los objetos altos (muros, árboles, columnas, casas). Las cosas bajas (cercas, piedras,
 * cajas, lápidas chicas) bloquean el paso pero un proyectil les pasa por encima; antes cualquier objeto lo frenaba y en
 * el páramo, lleno de cosas bajas, uno de cada tres tiros moría en el camino. Alto = 58 px o más de sprite.
 */
const tapaTiros = new WeakMap<Zona, { n: number; a: Uint8Array }>();
function tapaTiro(z: Zona, x: number, y: number): boolean {
  const i = Math.floor(y) * z.W + Math.floor(x), b = z.bloq[i];
  if (b === 2) return true; if (b !== 1) return false;
  let c = tapaTiros.get(z);
  if (!c || c.n !== z.objetos.length) {
    c = { n: z.objetos.length, a: new Uint8Array(z.W * z.H) };
    for (const o of z.objetos) {
      if (!o.bloquea) continue;
      const m = objetoMeta(o.id, o.v), alto = m?.f?.[0]?.h ?? 999;
      if (alto < 58) continue;
      const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2);
      for (let yy = y0; yy < y0 + o.hh; yy++) for (let xx = x0; xx < x0 + o.hw; xx++) if (xx >= 0 && yy >= 0 && xx < z.W && yy < z.H) c.a[yy * z.W + xx] = 1;
    }
    tapaTiros.set(z, c);
  }
  return c.a[i] === 1;
}
import { muertePfx, usosPfx, transicionPfx } from './pfx_usos';

/** Celdas que avanza un ciclo completo de caminar o correr (cuerpo de alto 1), según la pisada del motor. */
export const ZANCADA = { caminar: zancada('caminar') / 16, correr: zancada('correr') / 16 };
export const ALTO_CLASE: Record<string, number> = { berserker: 1.03, cazadora: 1.02 };

export type Dir = 's' | 'so' | 'o' | 'no' | 'n' | 'ne' | 'e' | 'se';
export type Accion = 'quieto' | 'caminar' | 'correr' | 'atacar' | 'lanzar' | 'herido' | 'morir';
import { SENSACION, sensacionDe } from './sensacion';
import { golpeEnClase, zancadaClase, golpesClase } from './anim';
export const DIRS: Dir[] = ['s', 'so', 'o', 'no', 'n', 'ne', 'e', 'se'];
/** Rumbo en el piso: 0° = se (x+), 45° = s, 90° = so ... */
export function dirDe(dx: number, dy: number): Dir {
  const a = (Math.atan2(dy, dx) * 180) / Math.PI;
  const i = Math.round(((a % 360) + 360) % 360 / 45) % 8;
  return (['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'] as Dir[])[i];
}
/** Vector unitario de cada dirección, el inverso de dirDe (ángulo 0 = 'se'). */
const R2 = Math.SQRT1_2;
export const DIR_VEC: Record<string, [number, number]> = { se: [1, 0], s: [R2, R2], so: [0, 1], o: [-R2, R2], no: [-1, 0], n: [-R2, -R2], ne: [0, -1], e: [R2, -R2] };
export const CUADROS: Record<Accion, number> = { quieto: 4, caminar: 8, correr: 8, atacar: 8, lanzar: 8, herido: 4, morir: 8 };

export interface Ent {
  id: number;
  tipo: 'heroe' | 'monstruo' | 'invocado' | 'npc';
  x: number; y: number;
  dir: Dir; acc: Accion; t: number;
  /** Duración de la acción en curso (atacar, lanzar, herido) y cuándo pega. */
  dur: number; golpeEn: number; golpeo: boolean;
  vida: number; vidaMax: number;
  vel: number;
  /** Distancia caminada en celdas: mueve la animación de los pies para que no patinen. */
  recorrido?: number;
  radio: number;
  muerto: boolean; tMuerto: number;
  frio: number; congelado: number; veneno: number; venenoDps: number; aturdido: number; miedo: number; sangrado: number;
  maldicion?: { amplificar: number; debilitar: number; lento: number; t: number; res: number; sifon?: number; condena?: boolean };
  destello: number;
  escala: number; tinte?: string;
  /** Movimiento natural: impulso de arranque (0.4 a 1), último momento en que caminó y espera entre sectores de giro. */
  impulso?: number; tMov?: number; giroT?: number;
  /** Retroceso visual al recibir un golpe: dirección en el mundo y cuándo fue. */
  sacud?: { dx: number; dy: number; t: number; k?: number; lanz?: number };
}
export interface Monstruo extends Ent {
  tipo: 'monstruo' | 'invocado';
  def: DefMonstruo; nivel: number; dano: [number, number]; defensa: number; res: Partial<Record<Elemento, number>>;
  calidad: number; nombre: [string, string]; mods: string[];
  objetivo: Ent | null; estado: 'dormido' | 'deambular' | 'perseguir' | 'huir' | 'surgir';
  cd: number; pensar: number; camino: [number, number][] | null; ox: number; oy: number;
  xp: number; lider?: Monstruo; invocaCd: number; fase: number;
  /** Campamento al que pertenece (índice en `zona.spawns`): despiertan todos juntos. No se guarda. */
  camp?: number;
  misionUnico?: string;
  /** El jefe de la zona (no el de acto): dice su frase de `FRASE_JEFE_ZONA` al verte. No se guarda. */
  jefeZona?: boolean;
  dueno?: boolean; invocaId?: string; tVida?: number;
  habla?: string;
  /** Presa marcada (cazadora): segundos que le quedan, recibe más daño del héroe y los suyos. */
  marca?: number;
}
export interface Proyectil {
  x: number; y: number; z: number; vx: number; vy: number; vida: number; dano: [number, number]; elem: Elemento;
  deHeroe: boolean; perfora: boolean; explota: number; efecto: string; golpeados: Set<number>; buscador: boolean; radio: number;
  /** A quién iba apuntado (hechizos del héroe con blanco): el proyectil corrige un poco el rumbo si el blanco se movió. */
  guia?: Ent | null;
  arco?: { x0: number; y0: number; x1: number; y1: number; t: number; T: number; n?: number };
  hab?: Habilidad; nivelHab?: number; mult?: number; lento?: number; t: number; rebota?: number;
  /** Abanicos: golpes de la misma salva por monstruo (la 2.ª flecha y siguientes al mismo blanco hacen 60 %). */
  salva?: Map<number, number>;
  /** Quién lo disparó (para atribuir el golpe, la escarcha que congela al atacante, etc.). */
  fuente?: Ent;
}
export interface Area { /** Lo que se dibuja al caer (por omisión explosion_fuego; '' nada, el efecto ya trae su impacto). */ fxCaida?: string; escCaida?: number; x: number; y: number; radio: number; dano: [number, number]; elem: Elemento; t: number; dur: number; tick: number; prox: number; deHeroe: boolean; efecto: string; retraso: number; caida?: boolean; /** Al caer deja la marca quemada de este radio. */ quemar?: number; /** Al caer congela el juego estos segundos (el golpe se siente). */ congela?: number; /** El poder que la puso (solo visual: render/poderes_vivos.ts). */ hab?: string }
export interface Suelo { o: Objeto | null; oro: number; x: number; y: number; t: number; id: number; /** Lo botó el jugador: no se recoge solo (sí con clic). */ botado?: boolean }
export interface Numero { x: number; y: number; z: number; txt: string; color: string; t: number; grande?: boolean; chico?: boolean; /** Golpe menor de un combo: número un poco más chico. */ menor?: boolean }
export interface Efecto { id: string; x: number; y: number; t: number; dir: number; escala: number; z?: number; seguir?: Ent; dur?: number }
export interface Particula { x: number; y: number; z: number; vx: number; vy: number; vz: number; t: number; dur: number; color: string; tam: number; tipo: 'chispa' | 'humo' | 'sangre' | 'brasa' | 'nieve' | 'hoja' | 'pluma' | 'ceniza'; grav: number }
export interface Mancha {
  x: number; y: number; r: number; color: string; t: number; tipo: 'sangre' | 'quemado' | 'hielo' | 'veneno';
  /** Forma de la sangre: charco que crece, salpicadura alargada según el golpe, gota o rastro de quien huye. */
  forma?: 'charco' | 'salpicadura' | 'gota' | 'rastro'; ang?: number; rmax?: number; sem?: number;
  /** Paleta del kit de gore: sangre roja, icor negro (no-muertos) o verde (bestias e insectos); y la superficie donde cae. */
  pal?: 'rojo' | 'negro' | 'verde'; sup?: 'piedra' | 'tierra' | 'nieve' | 'madera';
}
/** Pedazo de cuerpo que vuela al reventar: gira, cae con gravedad, salpica al tocar el piso y se desvanece. */
export interface Gib { id: string; pal: string; x: number; y: number; z: number; vx: number; vy: number; vz: number; ang: number; va: number; t: number; vida: number; quieto?: boolean }
/** Manchas por zona: cola circular (las más viejas se van) para que la sangre no se coma el rendimiento. */
export const TOPE_MANCHAS = 300;
export function ponerMancha(j: Juego, m: Mancha) { if (m.forma && !m.sup) m.sup = superficieDe(j); j.manchas.push(m); if (j.manchas.length > TOPE_MANCHAS) j.manchas.splice(0, j.manchas.length - TOPE_MANCHAS); }
// ------------------------------------------------------------------ efectos de las legendarias del arsenal
const efectoArma = (j: Juego) => j.heroe.d.equipo.arma?.efecto;
let enCadena = false;
/** Al pegar con el arma: sed crítica, cadena de rayo, tercer golpe de escarcha y juicio del quinto golpe. */
function efectoLegGolpe(j: Juego, m: Monstruo, total: number, crit: boolean) {
  const ef = efectoArma(j); if (!ef) return;
  const h = j.heroe, o = h as any;
  if (ef === 'sed_critica' && crit) { h.vida = Math.min(h.vidaMax, h.vida + total * 0.25); m.sangrado = Math.max(m.sangrado, 4); particulas(j, h.x, h.y, 6, 'chispa', '#ff3030', 0.8, 40); }
  if (ef === 'cadena' && !enCadena) {
    enCadena = true;
    let desde: Ent = m; const ya = new Set<number>([m.id]);
    for (let k = 0; k < 2; k++) {
      const b = masCercano(j, desde.x, desde.y, 4, ya) as Monstruo | null; if (!b) break;
      const ef2 = { id: 'arco_cadena', x: desde.x, y: desde.y, t: 0, dir: 0, escala: 1, z: 0, dur: 0.25 } as any; ef2.x2 = b.x; ef2.y2 = b.y; j.efectos.push(ef2);
      danar(j, b, { min: total * 0.45, max: total * 0.45, elem: 'rayo', deHeroe: true, fuente: h, sinFallo: true });
      // el destello de impacto_rayo solo en el primero (su luz inunda la pantalla); en cada uno, electrocutado
      if (k === 0) efecto(j, 'impacto_rayo', b.x, b.y, 0, 0.5);
      ya.add(b.id); desde = b;
    }
    enCadena = false;
  }
  if (ef === 'tercer_golpe') {
    o.golpesLeg = (o.golpesLeg ?? 0) + 1;
    if (o.golpesLeg % 3 === 0) {
      efecto(j, 'nova_escarcha', m.x, m.y, 0, 0.9); sonar(j, 'hielo_lanzar', m.x, m.y, 0.7);
      for (const e of enemigosDe(j, true)) if (dist(e.x, e.y, m.x, m.y) < 2.5 + e.radio) { const q = e as Monstruo; q.frio = Math.max(q.frio, 3); if (!q.def?.jefe) q.congelado = Math.max(q.congelado ?? 0, 1.2); if (q !== m) danar(j, q, { min: total * 0.6, max: total * 0.6, elem: 'frio', deHeroe: true, fuente: h, sinFallo: true }); }
    }
  }
  if (ef === 'juicio') {
    o.golpesLeg = (o.golpesLeg ?? 0) + 1;
    if (o.golpesLeg % 5 === 0) { efecto(j, 'castigo', m.x, m.y, 0, 1); danar(j, m, { min: total * 1.5, max: total * 1.5, elem: 'luz', deHeroe: true, fuente: h, sinFallo: true }); h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * 0.04); }
  }
}
/** Al matar con el arma: pira, contagio y la sombra que se levanta. */
function efectoLegMuerte(j: Juego, m: Monstruo) {
  const ef = efectoArma(j); if (!ef) return;
  const h = j.heroe;
  if (ef === 'pira') { efecto(j, 'explosion_fuego', m.x, m.y, 0, 1); j.areas.push({ x: m.x, y: m.y, radio: 2, dano: [m.vidaMax * 0.25, m.vidaMax * 0.35], elem: 'fuego', t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: '', retraso: 0 }); }
  if (ef === 'contagio') j.areas.push({ x: m.x, y: m.y, radio: 2.2, dano: [m.vidaMax * 0.05, m.vidaMax * 0.08], elem: 'veneno', t: 0, dur: 3, tick: 0.5, prox: 0, deHeroe: true, efecto: 'nube_veneno', retraso: 0 });
  if (ef === 'sombra_hambrienta' && R() < 0.3 && mios(j).filter((q) => q.invocaId === 'espiritu' && q.tVida).length < 3) {
    const s = crearInvocado(j, 'espiritu', Math.max(1, Math.floor(h.d.nivel / 6)), m.x, m.y, 12);
    if (s) { s.tinte = '#5020a0'; s.nombre = ['Sombra hambrienta', 'Hungry shadow']; efecto(j, 'maldicion_sombra', m.x, m.y, 0, 0.8); }
  }
}
/** La primera vez que ves a un jefe de verdad: su presentación con el nombre grande y cámara lenta. */
function presentarJefe(j: Juego, m: Monstruo) {
  if (!(m.def.jefe || m.def.ia === 'jefe') || (m as any).presentado) return;
  (m as any).presentado = true;
  transicionPfx('fx_trans_tajo');
  const vis: string[] = ((j.heroe.d as any).jefesVistos ??= []);
  if (!vis.includes(m.def.id)) { vis.push(m.def.id); j.eventos.push({ tipo: 'presentar', dato: m }); }
}
const NO_MUERTO = /zombi|momia|necrof|espectr|lich|aparecid|ahogad|muert|hueca|sin_rostro|suplicante|desollad|penitente|segador|caballero_espectral/;
const BESTIA = /lobo|jabali|arana|escorp|gusano|murcielago|cangrejo|perro|escarabajo|gargola|chacal|trol|madre/;
const paletaDe = (m: Monstruo): 'rojo' | 'negro' | 'verde' => (NO_MUERTO.test(m.def?.sprite ?? '') ? 'negro' : BESTIA.test(m.def?.sprite ?? '') ? 'verde' : 'rojo');
/** Superficie del piso de la zona, para el sello de sangre que corresponde. */
export function superficieDe(j: Juego): 'piedra' | 'tierra' | 'nieve' | 'madera' {
  const d = ZONAS[j.zona?.id ?? '']; const t = d?.tema ?? '';
  if (/nieve|hielo/.test(t)) return 'nieve';
  if (d?.tipo === 'pueblo' && /ahogada|campamento|barco/.test(t)) return 'madera';
  if (d?.tipo === 'mazmorra' || /catedral|celestial|cripta|catacumbas|fortaleza/.test(t)) return 'piedra';
  return 'tierra';
}
// (lo de hueso y lo de piedra o metal no sangra rojo: suelta polvo gris. El gólem dejaba un charco de sangre)
const sangraHueso = (m: Monstruo) => m.def?.sonido === 'hueso' || /golem|gargola|mano_dorada|suplicante|cangrejo_relicario|guardian_halo/.test(m.def?.id ?? '');
const colorSangre = (m: Monstruo) => (sangraHueso(m) ? '#4a4436' : m.def?.elem === 'veneno' ? '#2a4a10' : '#6a0a0a');
/** Salpicadura en la dirección del golpe: sangre que vuela y una mancha alargada en el piso detrás del herido. */
function salpicar(j: Juego, v: Monstruo, de: Ent | undefined, fuerza: number, crit: boolean) {
  if (sangraHueso(v) || v.dueno) return;
  const dx = de ? v.x - de.x : R() - 0.5, dy = de ? v.y - de.y : R() - 0.5, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  const n = Math.min(26, Math.round((crit ? 14 : 5) + fuerza * 30));
  if (j.particulas.length < 900) for (let i = 0; i < n; i++) {
    const sp = (R() - 0.5) * 0.9, c = Math.cos(sp), s = Math.sin(sp), vx = ux * c - uy * s, vy = ux * s + uy * c, vel = (1.5 + R() * 3.5) * (crit ? 1.6 : 1);
    j.particulas.push({ x: v.x, y: v.y, z: 30 * v.escala + R() * 10, vx: vx * vel, vy: vy * vel, vz: 30 + R() * (crit ? 110 : 60), t: 0, dur: 0.5 + R() * 0.5, color: R() < 0.3 ? '#b01010' : '#7a0808', tam: 1 + R() * 2, grav: 260, tipo: 'sangre' } as any);
  }
  if (crit || fuerza > 0.08 || R() < 0.35) ponerMancha(j, { x: v.x + ux * (0.6 + R() * 0.5), y: v.y + uy * (0.6 + R() * 0.5), r: 0.35 + Math.min(0.9, fuerza * 2) + (crit ? 0.35 : 0), color: colorSangre(v), t: 0, tipo: 'sangre', forma: 'salpicadura', ang: Math.atan2(uy, ux), sem: Math.floor(R() * 8), pal: paletaDe(v) });
}
/**
 * Muerte por exceso de daño: el cuerpo revienta. Por ahora es sangre y pedazos con partículas; cuando lleguen los gibs
 * de la Forja, aquí se sueltan sus sprites (GIBS: id de objeto con variantes) con la misma física.
 */
export const GIBS: { id: string; variantes: string[] } | null = null;
const PIEZAS_GIB = ['torso', 'brazo', 'pierna', 'costillas', 'craneo', 'tripas', 'astillas', 'trozo'];
const PAL_GIB: Record<string, string> = { rojo: 'rojo', negro: 'no_muerto', verde: 'bestia' };
function reventar(j: Juego, m: Monstruo) {
  (m as any).reventado = true;
  sonar(j, 'reventon', m.x, m.y, 0.9);
  const col = colorSangre(m), pal = paletaDe(m);
  // el reventón de la Forja y 5 a 9 pedazos que vuelan, giran y caen
  (((j as any).reventones ??= []) as any[]).push({ x: m.x, y: m.y, pal: PAL_GIB[pal], t: 0, esc: m.escala });
  const gibs: Gib[] = ((j as any).gibs ??= []);
  const n = 5 + Math.floor(R() * 5);
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, v = 1.5 + R() * 3.5;
    gibs.push({ id: 'gore_gib_' + (i === 0 ? 'torso' : PIEZAS_GIB[1 + Math.floor(R() * (PIEZAS_GIB.length - 1))]), pal: PAL_GIB[pal], x: m.x, y: m.y, z: 24 * m.escala, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 80 + R() * 140, ang: R() * 8, va: (R() - 0.5) * 30, t: 0, vida: 20 + R() * 20 });
  }
  if (gibs.length > 80) gibs.splice(0, gibs.length - 80);
  if (j.particulas.length < 1100) for (let i = 0; i < 42; i++) {
    const a = R() * Math.PI * 2, vel = 2 + R() * 6, trozo = i < 12;
    j.particulas.push({ x: m.x, y: m.y, z: 26 * m.escala + R() * 20, vx: Math.cos(a) * vel, vy: Math.sin(a) * vel, vz: 60 + R() * 160, t: 0, dur: trozo ? 1.4 + R() * 0.6 : 0.6 + R() * 0.6, color: trozo ? (R() < 0.5 ? '#5a0a0a' : '#8a3a2a') : R() < 0.4 ? '#c01414' : '#7a0808', tam: trozo ? 3 + R() * 3 : 1.2 + R() * 2.2, grav: 300, tipo: 'sangre' } as any);
  }
  for (let i = 0; i < 6; i++) { const a = R() * Math.PI * 2, d = 0.6 + R() * 1.6; ponerMancha(j, { x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, r: 0.3 + R() * 0.5, color: col, t: 0, tipo: 'sangre', forma: 'salpicadura', ang: a, sem: Math.floor(R() * 8) }); }
  j.sacudida = Math.max(j.sacudida, 0.3);
  sonar(j, 'explosion' as any, m.x, m.y, 0.5);
}
/** Torretas y trampas. Las minas (mina = radio de la explosión) esperan a que algo las pise. */
export interface Torreta { x: number; y: number; t: number; dur: number; dano: [number, number]; cd: number; hab?: string; elem?: Elemento; mina?: number; raiz?: boolean; efecto?: string }
export interface Npc extends Ent { npc: string; hablando: boolean }
export interface Portal { x: number; y: number; destino: string; x2?: number; y2?: number; t: number }

let nid = 1;
const nueva = (o: Partial<Ent>): Ent => ({ id: nid++, tipo: 'monstruo', x: 0, y: 0, dir: 's', acc: 'quieto', t: 0, dur: 0, golpeEn: 0, golpeo: false, vida: 1, vidaMax: 1, vel: 3, radio: 0.45, muerto: false, tMuerto: 0, frio: 0, congelado: 0, veneno: 0, venenoDps: 0, aturdido: 0, miedo: 0, sangrado: 0, destello: 0, escala: 1, ...o });

export interface Heroe extends Ent {
  tipo: 'heroe';
  d: DatosHeroe; c: Calc; mana: number;
  camino: [number, number][] | null; destino: [number, number] | null;
  objetivo: Monstruo | null; recoger: Suelo | null; hablar: Npc | null; usar: ObjZ | null;
  habActual: string; correr: boolean;
  buffs: Record<string, { t: number; bonos: Record<string, number>; hab: string }>;
  recargas: Record<string, number>;
  escudoHueso: number;
  torbellino: number; salto: { x0: number; y0: number; x1: number; y1: number; t: number; T: number; hab: Habilidad } | null;
  tempestad: number; huracan: number;
  pasoT: number; regen: number;
  ultimoGolpe: number;
  // ---- mecánicas de clase (se reinician al cambiar de zona o cargar)
  /** Berserker: furia 0-100. */
  furia: number; furiaFija: number; tCombate: number;
  /** Monje: pasos del combo (0-2) y cuándo fue el último golpe. */
  combo: { paso: number; t: number };
  /** Arcanista: cargas elementales guardadas (hasta 3). */
  cargas: Elemento[];
  /** Alquimista: frascos listos y avance del relleno. */
  frascos: number; frascoT: number;
  /** Templario: potencia con que se armó el aura activa. */
  auraPot: number;
  /** Qué habilidad mueve el huracán activo (galerna u ojo del tifón). */
  huracanHab: string;
  avisos: Record<string, number>;
}

export interface Juego {
  zona: Zona;
  heroe: Heroe;
  monstruos: Monstruo[];
  npcs: Npc[];
  proyectiles: Proyectil[];
  areas: Area[];
  suelo: Suelo[];
  numeros: Numero[];
  efectos: Efecto[];
  particulas: Particula[];
  manchas: Mancha[];
  portal: Portal | null;
  t: number;
  sacudida: number;
  /** Pausa de impacto: segundos de mundo casi detenido cuando un golpe conecta. */
  congela?: number;
  /** Empujón de la cámara en la dirección de un golpe (px en pantalla, con reloj real). */
  patada?: { dx: number; dy: number; k: number; t: number };
  mensajes: { txt: [string, string]; t: number; color: string }[];
  jefe: Monstruo | null;
  tirado: Set<string>;
  /** Fantasmas de miedo que asoman al borde de la luz. */
  visiones: { x: number; y: number; t: number; sprite: string; dir: Dir }[];
  eventos: { tipo: string; dato?: any }[];
  idi: 0 | 1;
  cuervos: { x: number; y: number; t: number; dur: number; dano: [number, number]; objetivo: Monstruo | null; ang: number; marca?: boolean }[];
  torretas: Torreta[];
  cadaveres: number;
}

// ------------------------------------------------------------------ zonas en memoria (no se regeneran mientras juegas)
const zonasVivas = new Map<string, { z: Zona; monstruos: Monstruo[]; suelo: Suelo[]; manchas: Mancha[] }>();
export const olvidarZonas = () => zonasVivas.clear();
// El mapa descubierto se guarda con el héroe (campo opcional `mapas`: una tira de bits por zona, en base64). Para que
// sirva al volver, cada zona sale siempre igual para el mismo héroe y ciclo (semilla fija). Partida nueva o ciclo nuevo: se borra.
/** Versión del trazado de los mundos: va en la clave del mapa descubierto. Se sube cuando una fase mueve el trazado de las zonas
 * (siluetas, salas, cuevas): la niebla vieja no se pinta sobre el mapa nuevo y se descubre otra vez. Héroe, objetos, misiones,
 * piedras de viaje, casas y restos van por id de zona y no se enteran. Las claves viejas quedan en el guardado sin usarse. */
export const MAPA_V = 5; // (4: entrega 6, el hito con su explanada. 5: 22 nov, cada zona del acto 2 con su trazado, silueta y viñetas, acto2_zonas.ts)
const claveMapa = (z: Zona) => z.id + (z.hueco ? '~o' : '') + '~m' + MAPA_V;
const empacarMapa = (e: Uint8Array) => { const b = new Uint8Array(Math.ceil(e.length / 8)); for (let i = 0; i < e.length; i++) if (e[i]) b[i >> 3] |= 1 << (i & 7); let s = ''; for (const v of b) s += String.fromCharCode(v); return e.length + ':' + btoa(s); };
function desempacarMapa(t: string, e: Uint8Array) {
  try { const i = t.indexOf(':'); if (+t.slice(0, i) !== e.length) return; const s = atob(t.slice(i + 1)); for (let k = 0; k < e.length; k++) if (s.charCodeAt(k >> 3) & (1 << (k & 7))) e[k] = 1; } catch { /* mapa viejo o roto: se descubre de nuevo */ }
}
/** Antes de guardar: anota en el héroe lo descubierto de cada zona visitada en esta sesión. */
export function anotarMapas(j: Juego) {
  const d = j.heroe.d as DatosHeroe & { mapas?: Record<string, string> };
  const m = (d.mapas ??= {});
  const una = (z: Zona) => { if (z.explorado.some((v) => v)) m[claveMapa(z)] = (d.ciclo ?? 0) + '|' + empacarMapa(z.explorado); };
  for (const v of zonasVivas.values()) una(v.z);
  if (j.zona) una(j.zona);
}
/** Dureza de los ciclos más allá del Infierno (Nueva Partida+): +15 % de vida y daño por ciclo. */
let durezaCiclo = 1;

export function crearJuego(d: DatosHeroe, idi: 0 | 1): Juego {
  const c = calcular(d);
  const h: Heroe = {
    ...(nueva({ tipo: 'heroe', vel: 5.2, radio: 0.4 }) as Ent), tipo: 'heroe', d, c, mana: d.manaActual ?? c.manaMax, vida: d.vidaActual ?? c.vidaMax, vidaMax: c.vidaMax,
    camino: null, destino: null, objetivo: null, recoger: null, hablar: null, usar: null, habActual: 'ataque', correr: true, buffs: {}, recargas: {}, escudoHueso: 0,
    torbellino: 0, salto: null, tempestad: 0, huracan: 0, pasoT: 0, regen: 0, ultimoGolpe: 0,
    furia: 0, furiaFija: 0, tCombate: -99, combo: { paso: 0, t: -99 }, cargas: [], frascos: 0, frascoT: 0, auraPot: 0, huracanHab: 'huracan', avisos: {},
  };
  h.frascos = frascosMax(h);
  const j: Juego = {
    zona: null as unknown as Zona, heroe: h, monstruos: [], npcs: [], proyectiles: [], areas: [], suelo: [], numeros: [], efectos: [], particulas: [], manchas: [], portal: null,
    t: 0, sacudida: 0, mensajes: [], jefe: null, tirado: new Set(), visiones: [], eventos: [], idi, cuervos: [], torretas: [], cadaveres: 0,
  };
  return j;
}

/** Entra a una zona por una entrada (o a la piedra de viaje). */
export function entrarZona(j: Juego, zid: string, entrada: string) {
  if (zid === 'a6_catedral1' || zid === 'a7_cielo') transicionPfx('fx_trans_vidrio');
  durezaCiclo = 1 + 0.15 * cicloExtra(j.heroe.d);
  (j as any).gibs = []; (j as any).reventones = [];
  // guardar la zona actual
  if (j.zona) zonasVivas.set(j.zona.id, { z: j.zona, monstruos: j.monstruos, suelo: j.suelo, manchas: j.manchas });
  const def = ZONAS[zid];
  let viva = zonasVivas.get(zid);
  if (!viva) {
    const semilla = (hashTxt(j.heroe.d.id + zid) % 100000) + (hashTxt(zid + j.heroe.d.id + (j.heroe.d.ciclo ?? 0)) % 1000);
    const z = generarZona(def, semilla);
    const visto = (j.heroe.d as any).mapas?.[claveMapa(z)]; if (typeof visto === 'string' && visto.startsWith((j.heroe.d.ciclo ?? 0) + '|')) desempacarMapa(visto.slice(visto.indexOf('|') + 1), z.explorado);
    viva = { z, monstruos: poblar(z, j.heroe.d, entrada), suelo: [], manchas: [] };
  }
  j.zona = viva.z; j.monstruos = viva.monstruos; j.suelo = viva.suelo; j.manchas = viva.manchas;
  j.proyectiles = []; j.areas = []; j.efectos = []; j.particulas = []; j.numeros = []; j.cuervos = []; j.torretas = [];
  reiniciarMecanicas(j.heroe);
  // invocados vienen con el héroe
  const invocados = (zonasVivas.get(j.heroe.d.zona)?.monstruos ?? []).filter((m) => m.dueno && !m.muerto);
  for (const m of invocados) { const i = (zonasVivas.get(j.heroe.d.zona)!.monstruos).indexOf(m); if (i >= 0) zonasVivas.get(j.heroe.d.zona)!.monstruos.splice(i, 1); }
  const h = j.heroe;
  let p = j.zona.entradas[entrada] ?? j.zona.entradas['salida_' + j.heroe.d.zona];
  if (entrada === 'viaje') { const m = j.zona.marcas.find((q) => q.tipo === 'viaje'); if (m) p = libreCerca(j.zona, m.cx + 2, m.cy + 2); }
  if (entrada === 'portal' && j.zona.entradas.portal) p = j.zona.entradas.portal;
  if (!p) p = j.zona.entradas.centro ?? Object.values(j.zona.entradas)[0] ?? [j.zona.W / 2, j.zona.H / 2];
  h.x = p[0] + 0.5; h.y = p[1] + 0.5; h.camino = null; h.destino = null; h.objetivo = null; h.recoger = null; h.usar = null; h.hablar = null; h.acc = 'quieto';
  for (const m of invocados) { const q = libreCerca(j.zona, h.x + entre(-2, 2), h.y + entre(-2, 2)); m.x = q[0] + 0.5; m.y = q[1] + 0.5; m.objetivo = null; j.monstruos.push(m); }
  h.d.zona = zid; h.d.acto = def.acto;
  if (def.tipo === 'pueblo') { h.vida = h.vidaMax; h.mana = h.c.manaMax; }
  j.npcs = def.tipo === 'pueblo' ? crearNpcs(j.zona, j.heroe.d) : [];
  j.jefe = null;
  if (def.tipo === 'pueblo' && !h.d.viajes.includes(zid)) h.d.viajes.push(zid);
  // misión de llegar
  for (const m of MISIONES) if (m.objetivo.tipo === 'llegar' && m.objetivo.zona === zid && (h.d.misiones[m.id] ?? 0) === 1) { h.d.misiones[m.id] = 2; j.eventos.push({ tipo: 'mision', dato: m.id }); }
  j.eventos.push({ tipo: 'zona', dato: zid });
}

function crearNpcs(z: Zona, d: DatosHeroe): Npc[] {
  const todos = GENTE[z.acto] ?? [];
  const gente = todos.filter((id) => { const dm = NPCS[id]?.desaparece; return (!dm || (d.misiones[dm] ?? 0) < 2) && npcVivo(id, d); });
  const lugares = z.marcas.filter((m) => m.tipo === 'npc');
  // quien murió por una decisión deja su tumba donde solía estar
  todos.forEach((id, i) => {
    const n = NPCS[id]; if (!n?.muereSi || npcVivo(id, d) || z.objetos.some((o) => o.tag === 'tumba' && o.dato?.npc === id)) return;
    const l = lugares[i % Math.max(1, lugares.length)] ?? { cx: z.W / 2, cy: z.H / 2 };
    const q = libreCerca(z, l.cx, l.cy);
    z.objetos.push({ id: 'cem_lapida_celta', v: 'con_musgo', cx: q[0], cy: q[1], hw: 1, hh: 1, bloquea: false, tag: 'tumba', dato: { npc: id } } as any);
  });
  return gente.map((id, i) => {
    const l = lugares[todos.indexOf(id) % Math.max(1, lugares.length)] ?? lugares[i % Math.max(1, lugares.length)] ?? { cx: z.W / 2, cy: z.H / 2 };
    const q = libreCerca(z, l.cx, l.cy);
    return { ...(nueva({ tipo: 'npc', x: q[0] + 0.5, y: q[1] + 0.5, vida: 1, vidaMax: 1, dir: elegir(['s', 'so', 'se'] as Dir[]) }) as Ent), tipo: 'npc', npc: id, hablando: false } as Npc;
  });
}

// ------------------------------------------------------------------ monstruos
/**
 * Los datos de cada monstruo ya traen la dureza de su acto (un caballero del abismo nace más duro que un zombi). Cuando sale
 * por encima de su acto (zombis del acto 1 en Pesadilla, esqueletos en el acto 6) se le sube a la dureza del nivel donde está,
 * así la curva sigue al nivel y no a qué acto reusa a quién. Pasado el 62 (el final de Normal) ya no hay actos nuevos.
 */
const durezaNivel = (n: number) => Math.pow(1 + Math.min(n, 62) / 12, 1.1);
let nativos: Map<string, number> | null = null;
function nivelNativo(id: string): number | undefined {
  if (!nativos) {
    nativos = new Map();
    for (const z of Object.values(ZONAS)) {
      if (z.tipo === 'pueblo') continue;
      for (const m of [...(POBLACION[POBL_ZONA[z.id] ?? ''] ?? []), ...(z.jefe ? [z.jefe] : [])]) nativos.set(m, Math.min(nativos.get(m) ?? 999, z.nivel));
    }
  }
  return nativos.get(id);
}
function escalar(def: DefMonstruo, nivel: number) {
  const k = nivel - 1;
  const nat = nivelNativo(def.id);
  const f = nat ? Math.max(1, durezaNivel(nivel) / durezaNivel(nat)) : 1;
  // el daño sube despacio con el nivel: la dureza del acto ya lo sube, y la vida del héroe crece casi lineal
  const kd = 0.6 * Math.pow(nivel, 0.3);
  return { vida: Math.max(4, Math.round(def.vida * f * 0.6 * (1 + k * 0.32) * (1 + k * 0.012))), dano: [Math.max(1, Math.round(def.dano[0] * f * kd)), Math.max(1, Math.round(def.dano[1] * f * kd))] as [number, number], defensa: Math.round(def.def + nivel * 7), xp: Math.round(def.xp * f * Math.pow(nivel, 0.9)) };
}
export function crearMonstruo(def: DefMonstruo, nivel: number, x: number, y: number, calidad = 0, dif = 0): Monstruo {
  const s = escalar(def, nivel + dif * 0);
  // el nivel ya trae la dificultad (Pesadilla e Infierno suben de nivel): aquí solo un empujón extra
  // los jefes de mazmorra (ia jefe sin ser de acto) salen como únicos: con 4 veces la vida duraban casi como uno de acto
  const mv = durezaCiclo * [1, 3, 4, 1, 1][calidad] * (def.ia === 'jefe' && !def.jefe ? 0.6 : 1) * ([1, 1.35, 1.7][dif] ?? 1);
  // acto 1 en Normal: los monstruos pegan un 25 % menos hasta el nivel 8 y vuelven a lo normal hacia el 14 (para los que empiezan)
  const suave = dif === 0 && nivel < 14 ? 0.75 + 0.25 * clamp((nivel - 8) / 6, 0, 1) : 1;
  const md = durezaCiclo * [1, 1.5, 1.8, 0.7, 0.7][calidad] * ([1, 1.15, 1.3][dif] ?? 1) * suave;
  const m: Monstruo = {
    ...(nueva({ tipo: 'monstruo', x, y, vel: def.vel * (def.jefe ? 1 : 0.94 + R() * 0.12), radio: 0.42 * (def.huella ?? 1), escala: def.escala ?? 1, tinte: def.tinte }) as Ent), tipo: 'monstruo',
    def, nivel, dano: [Math.round(s.dano[0] * md), Math.round(s.dano[1] * md)], defensa: s.defensa, res: { ...(def.res ?? {}) }, calidad, nombre: def.nombre, mods: [],
    objetivo: null, estado: def.surge ? 'surgir' : 'dormido', cd: entre(0.5, 1.5), pensar: R(), camino: null, ox: x, oy: y, xp: Math.round(s.xp * [1, 3, 5, 10, 1][calidad] * ([1, 1.4, 1.8][dif] ?? 1)), invocaCd: entre(3, 6), fase: 0,
  };
  m.vidaMax = m.vida = Math.round(s.vida * mv);
  m.dir = elegir(DIRS);
  return m;
}
/**
 * Lo que dice un jefe al verte: el de la zona su frase propia (`FRASE_JEFE_ZONA`, ata su encargo con la trama), si no la
 * de su cuerpo (`FRASE_JEFE`). Va al registro y a la placa (sobre su cabeza o bajo la barra del jefe), con tiempo de
 * lectura según el largo (unas 15 letras por segundo, de 4 a 9 s).
 */
function hablarJefe(j: Juego, m: Monstruo) {
  const fr = (m.jefeZona && FRASE_JEFE_ZONA[j.zona.id]) || FRASE_JEFE[m.def.id]; if (!fr) return;
  msg(j, fr, '#ff6040'); m.habla = fr[j.idi]; (m as any).hablaT = Math.max(4, Math.min(9, fr[j.idi].length / 15));
}
function poblar(z: Zona, d: DatosHeroe, entrada?: string): Monstruo[] {
  const out: Monstruo[] = [];
  const pool = POBLACION[POBL_ZONA[z.id] ?? ''] ?? [];
  if (!pool.length) return out;
  const def = ZONAS[z.id];
  const dif = d.dificultad;
  const nivel = nivelEnDificultad(z.nivel, dif);
  // el grupo más cercano a una entrada de una zona de inicio es uno solo, para no recibir al héroe de nivel 1 con una paliza
  // (oleada 2: se mide desde la entrada por la que llega, no desde cualquiera, y el segundo campamento más cercano también
  //  es chico, de dos grupos: un héroe nuevo y descuidado encontraba 6 y después 8 cuerpos en sus dos primeras peleas)
  let primero: (typeof z.spawns)[number] | null = null, segundo: (typeof z.spawns)[number] | null = null;
  const mansos = new Set<(typeof z.spawns)[number]>();
  if (z.nivel < 6 && dif === 0 && d.nivel <= 3) {
    const ep = entrada ? z.entradas[entrada] : undefined, ents = ep ? [ep] : Object.values(z.entradas);
    const cerca = z.spawns.filter((s) => s.tipo !== 'jefe' && s.tipo !== 'unico' && s.tipo !== 'campeon').map((s) => ({ s, d: Math.min(...ents.map((e) => dist(s.cx, s.cy, e[0], e[1]))) })).sort((a, b) => a.d - b.d || a.s.cx - b.s.cx || a.s.cy - b.s.cy);
    primero = cerca[0]?.s ?? null; segundo = cerca[1]?.s ?? null;
    // y a un héroe recién llegado no lo esperan campeones ni un único a 40 celdas de la puerta: ahí van como campamento común
    for (const s of z.spawns) if ((s.tipo === 'unico' || s.tipo === 'campeon') && Math.min(...ents.map((e) => dist(s.cx, s.cy, e[0], e[1]))) < 40) mansos.add(s);
  }
  // (el dado de `poblar` es por sesión; los mansos solo quitan élites al que empieza)
  const porDensidad = !(globalThis as any).__campamentos, sitios: SitioTirado[] = [];
  for (const s of z.spawns) {
    if (s.tipo === 'jefe') {
      const dm = MONSTRUOS[def.jefe!]; if (!dm) continue;
      const mis = MISIONES.find((q) => q.objetivo.tipo === 'matar' && q.objetivo.zona === z.id && q.objetivo.monstruo === def.jefe);
      const esActo = !!dm.jefe;
      const m = crearMonstruo(dm, nivel + 2, s.cx + 0.5, s.cy + 0.5, esActo ? 4 : 2, dif);
      if (!esActo) {
        const nu = mis?.objetivo.tipo === 'matar' && mis.objetivo.nombreUnico;
        m.nombre = nu || [dm.nombre[0], dm.nombre[1]];
        m.mods = [elegir([...MODS]).id, elegir([...MODS]).id];
        m.escala = (dm.escala ?? 1) * 1.15;
      }
      m.misionUnico = mis?.id;
      if (!esActo) m.jefeZona = true;
      m.estado = 'dormido';
      out.push(m);
      // escolta
      // la escolta ya no espera amontonada encima del jefe: llega por oleadas después de su presentación (ver oleadaJefe)
      (m as any).oleada = { ids: Array.from({ length: esActo ? 4 : 5 }, () => elegir(pool)), cd: 1.5 };
      continue;
    }
    // ---- un campamento (`acampar` en zona.ts): los cuerpos de `grupos` grupos de los de antes, juntos y con papeles. Cada
    // tirada es el grupo de antes tal cual (mismo dado, mismos cuerpos), así el presupuesto de la zona no cambia
    const ci = z.spawns.indexOf(s), cuerpos: Monstruo[] = [], cortes: number[] = [];
    let lider: Monstruo | undefined;
    const tirada = (tope = 99) => {
      cortes.push(cuerpos.length);
      const dm = MONSTRUOS[R() < 0.55 ? pool[0] : elegir(pool)]; if (!dm) return;
      // los sedientos van en manadas de 5 a 8; las manos doradas, de a dos o tres
      const n = dm.id === 'sediento' ? 5 + Math.floor(R() * 4) : dm.id === 'mano_dorada' ? 2 + Math.floor(R() * 2) : Math.max(1, Math.round((dm.ia === 'enjambre' ? (z.nivel < 6 ? 3 : 5) : dm.ia === 'bruto' ? 2 : z.nivel < 6 ? 2 : 3) * s.fuerza));
      for (let i = 0; i < Math.min(n, tope); i++) { const m = crearMonstruo(i > 0 && R() < 0.3 ? MONSTRUOS[elegir(pool)] : dm, nivel, s.cx + 0.5, s.cy + 0.5, 0, dif); if (lider) m.lider = lider; cuerpos.push(m); }
    };
    const esElite = (s.tipo === 'unico' || s.tipo === 'campeon') && !mansos.has(s);
    if (esElite) {
      let id = R() < 0.55 ? pool[0] : elegir(pool);
      // en la Corona los campeones suelen ser ángeles sedientos (vuelan y escupen luz)
      if (s.tipo === 'campeon' && pool.includes('angel_sediento') && R() < 0.5) id = 'angel_sediento';
      const dm = MONSTRUOS[id]; if (!dm) continue;
      const cal = s.tipo === 'unico' ? 2 : 1;
      const n = s.tipo === 'unico' ? 4 : 3;
      const mods = [elegir([...MODS]).id]; if (cal === 2) mods.push(elegir([...MODS]).id);
      for (let i = 0; i < n; i++) {
        const m = crearMonstruo(dm, nivel + (cal === 2 ? 2 : 1), s.cx + 0.5, s.cy + 0.5, cal === 2 && i > 0 ? 0 : cal, dif);
        if (cal === 2 && i === 0) { lider = m; const a = elegir(NOMBRES_UNICOS.pre), b = elegir(NOMBRES_UNICOS.suf); m.nombre = [`${a[0]} ${b[0]}`, `${a[1]} ${b[1]}`]; m.mods = mods; m.escala *= 1.12; }
        else if (cal === 1) { m.mods = mods; m.nombre = [`${dm.nombre[0]} campeón`, `Champion ${dm.nombre[1]}`]; }
        else if (lider) m.lider = lider;
        aplicarMods(m);
        cuerpos.push(m);
      }
      { const n0 = cuerpos.length; for (let q = 0; q < (s.grupos ?? 0); q++) tirada(); for (let i = n0; i < cuerpos.length; i++) (cuerpos[i] as any).escolta = true; }
    } else if (s === primero) tirada(s.grupos != null ? 2 : 1);
    else if (s === segundo && s.grupos != null) for (let q = 0; q < Math.min(2, s.grupos); q++) tirada();
    else for (let q = 0; q < (mansos.has(s) ? 2 : s.grupos ?? 1); q++) tirada();
    // el campamento con papeles: si la zona tiene gente de tiro o de conjuro y no salió ninguno, uno de los comunes lo es
    const deTiro = (m: Monstruo) => m.def.ia === 'mago' || m.def.ia === 'distancia' || m.def.ia === 'invocador';
    if (s.grupos != null && cuerpos.length >= 6 && !cuerpos.some(deTiro)) {
      const tiros = pool.filter((q) => MONSTRUOS[q] && (MONSTRUOS[q].ia === 'mago' || MONSTRUOS[q].ia === 'distancia')), k = cuerpos.findIndex((m, i) => i > 0 && m.calidad === 0 && !m.lider);
      if (tiros.length && k > 0) { const v = cuerpos[k]; cuerpos[k] = crearMonstruo(MONSTRUOS[elegir(tiros)], v.nivel, v.x, v.y, 0, dif); }
    }
    // (22 nov 2026: sin `__campamentos`, lo tirado no se para acá: `repartir` lo reparte por el mapa, ver reparto.ts)
    if (porDensidad && s.grupos != null) {
      // (el élite y su escolta van juntos en su sitio; lo común, tirada por tirada, se reparte)
      const nEl = esElite ? (cortes.length ? cortes[0] : cuerpos.length) : 0, tir: Monstruo[][] = [];
      if (!esElite) cortes.forEach((c, k) => { const t = cuerpos.slice(c, cortes[k + 1] ?? cuerpos.length); if (t.length) tir.push(t); });
      const esc = cuerpos.slice(nEl); if (esElite) for (const m of esc) (m as any).escolta = true;
      sitios.push({ s, elite: cuerpos.slice(0, nEl), escolta: esElite ? esc : [], tiradas: tir });
      out.push(...cuerpos);
      continue;
    }
    // dónde se para cada uno: el jefe del campamento en el centro, los de cuerpo a cuerpo hacia el frente (de donde llega el
    // héroe) y los de tiro detrás, en el borde del claro. Un grupo suelto de los de antes (sin `grupos`) va apretado como siempre
    const f = s.frente ?? [0, 1], a0 = Math.atan2(f[1], f[0]), campo = s.grupos != null;
    for (const m of cuerpos) {
      const tiro = deTiro(m), jefe = m === lider || m.calidad === 1;
      let q: [number, number] = [s.cx, s.cy];
      for (let k = 0, esc = 1; k < 4; k++, esc *= 0.6) {
        const a = a0 + (tiro ? Math.PI : 0) + entre(-1.25, 1.25), d = (!campo ? entre(0, 2.6) : jefe ? entre(0, 1.4) : tiro ? entre(3, 4.8) : entre(1, 4)) * esc;
        q = libreCerca(z, s.cx + Math.cos(a) * d, s.cy + Math.sin(a) * d);
        if (lineaPasable(z, s.cx + 0.5, s.cy + 0.5, q[0] + 0.5, q[1] + 0.5)) break;
      }
      m.x = m.ox = q[0] + 0.5; m.y = m.oy = q[1] + 0.5; m.camp = ci;
      out.push(m);
    }
  }
  if (porDensidad && sitios.length) {
    // (por donde llega de verdad, como en `entrarZona`: la puerta, la piedra de viaje o el portal)
    let ep: [number, number] | undefined = entrada ? z.entradas[entrada] ?? z.entradas['salida_' + d.zona] : undefined;
    if (entrada === 'viaje') { const mv = z.marcas.find((q) => q.tipo === 'viaje'); if (mv) ep = [mv.cx + 2, mv.cy + 2]; }
    repartir(z, sitios as any, ep ?? z.entradas.centro ?? Object.values(z.entradas)[0], z.nivel < 6 && dif === 0 && d.nivel <= 3);
  }
  return out;
}
/** Lo que oyen los de alrededor de `m` (un golpe, un quejido): a 6,5 casillas si se ve, a 3 aunque haya un muro. */
function oir(j: Juego, m: Monstruo, obj: Ent) {
  for (const o of j.monstruos) {
    if (o === m || o.muerto || o.dueno || o.camp === m.camp || (o.estado !== 'dormido' && o.estado !== 'deambular')) continue;
    const d = dist(o.x, o.y, m.x, m.y); if (d > 6.5 || (d > 3 && !lineaLibre(j.zona, o.x, o.y, m.x, m.y))) continue;
    o.estado = 'perseguir'; o.objetivo = obj; (o as any).alerta = 0.35 + d * 0.08 + entre(0, 0.3);
    if (o.camp != null) alertarCampamento(j, o, obj);
  }
}
/** Despierta al campamento de `m` (los de su mismo `camp`) contra `obj`, escalonado: llegan en oleada y no en bloque. */
function alertarCampamento(j: Juego, m: Monstruo, obj: Ent) {
  const elite = j.monstruos.some((o) => o.camp === m.camp && !o.muerto && o.calidad >= 1);
  for (const o of j.monstruos) {
    if (o === m || o.camp !== m.camp || o.muerto || o.dueno || (o.estado !== 'dormido' && o.estado !== 'deambular')) continue;
    o.estado = 'perseguir'; o.objetivo = obj; (o as any).alerta = 0.2 + Math.min(0.7, dist(o.x, o.y, m.x, m.y) * 0.09) + entre(0, 0.2);
    // la escolta de un campamento de élite es la segunda oleada: los campeones (o el único con los suyos) pelean primero y el
    // grupo que los acompaña entra cuando uno de ellos cae o queda a media vida, si le pegan, o a los 15 s (ver `pelear`).
    // Medido con t1010: todos juntos, el único pegaba el triple de tiempo y esas peleas daban 4 veces más muertes
    if (elite && (o as any).escolta && !(globalThis as any).__frenteViejo) { (o as any).alerta += 14 + entre(0, 2); (o as any).espera = true; }
  }
}
function aplicarMods(m: Monstruo) {
  for (const id of m.mods) {
    const md = MODS.find((x) => x.id === id); if (md && !m.tinte && m.calidad === 1) m.tinte = md.tinte;
    if (id === 'rapido') m.vel *= 1.5;
    if (id === 'piel_piedra') m.defensa *= 3;
    if (id === 'fuerte') { m.dano = [m.dano[0] * 1.5, m.dano[1] * 1.5]; }
    // espectral: medio fuera de este mundo, los golpes físicos lo atraviesan a medias
    if (id === 'espectral') m.res = { ...m.res, fisico: Math.max(m.res.fisico ?? 0, 35) };
    if (id === 'ardiente') m.res.fuego = 75;
    if (id === 'helado') m.res.frio = 75;
    if (id === 'electrico') m.res.rayo = 75;
  }
}

// ------------------------------------------------------------------ utilidades
export const vivos = (j: Juego) => j.monstruos.filter((m) => !m.muerto);
const enemigosDe = (j: Juego, deHeroe: boolean): Ent[] => (deHeroe ? j.monstruos.filter((m) => !m.muerto && !m.dueno && m.estado !== 'surgir') : [j.heroe, ...j.monstruos.filter((m) => m.dueno && !m.muerto)]);
/** El registro entero de lo dicho en la sesión (no se guarda): los mensajes se van de la pantalla pero no se pierden (ui/registro.ts). */
export interface LineaRegistro { txt: [string, string]; color: string; t: number }
export const registroDe = (j: Juego): LineaRegistro[] => ((j as any).registro ??= []);
export function msg(j: Juego, txt: [string, string], color = '#e0d0a0') {
  // (el Libro de Odrán anota lo que es suyo: la voz de la Marca, la llegada a un lugar, lo que dice un jefe...)
  oirLibro(j.heroe?.d, txt);
  j.mensajes.push({ txt, t: 0, color }); if (j.mensajes.length > 6) j.mensajes.shift();
  const r = registroDe(j), u = r[r.length - 1];
  if (!(u && u.txt[0] === txt[0] && j.t - u.t < 1.5)) { r.push({ txt, color, t: j.t }); if (r.length > 300) r.splice(0, r.length - 300); }
}
function numero(j: Juego, e: Ent, v: number, color: string, grande = false, menor = false) { j.numeros.push({ x: e.x + (menor ? (R() - 0.5) * 0.5 : 0), y: e.y, z: 60 * e.escala, txt: String(Math.round(v)), color, t: 0, grande, menor }); }
/** Un letrero corto que flota sobre alguien (por qué no salió un poder, 'Aturdido'...). Uno por clave cada 1,2 s. */
function letrero(j: Juego, e: Ent, txt: [string, string], color: string) {
  const h = j.heroe, k = 'L' + txt[0]; if ((h.avisos[k] ?? -99) > j.t - 1.2) return; h.avisos[k] = j.t;
  j.numeros.push({ x: e.x, y: e.y, z: 64 * e.escala, txt: txt[j.idi], color, t: 0 });
}
/** Efectos que rodean a quien los hace (gritos, ondas, círculos, novas): su mitad de atrás se dibuja detrás del cuerpo. */
const RODEA = /^(grito_guerra|onda_aterrizaje|circulo_invocacion|nova_escarcha|glifo_trampa|maldicion_sombra|llanto_animas|estallido_enredaderas|pfx:fx_(aviso|circulo|aura|nova|onda|grito))/;
export function efecto(j: Juego, id: string, x: number, y: number, dir = 0, escala = 1, z = 0, dur?: number) {
  // lo que nace justo en los pies del héroe (auras, gritos, curación, subir de nivel, el círculo al conjurar) lo envuelve:
  // se parte en dos por la línea de sus pies, atrás por detrás del cuerpo y adelante por delante. Antes todo el efecto se
  // pintaba encima y el arco de atrás le cruzaba la espalda.
  const h = j.heroe, partido = z === 0 && ((!!h && Math.abs(x - h.x) + Math.abs(y - h.y) < 0.05) || RODEA.test(id));
  j.efectos.push({ id, x, y, t: 0, dir, escala, z, dur, ...(partido ? { partido: true } : {}), ...(habEnCurso ? { hab: habEnCurso, de: deDonde } : {}) } as Efecto);
  // el relámpago que cae (Tempestad, Furia del firmamento, el lanzar de los poderes de rayo): además del horneado, un
  // rayo de pixel de verdad que baja del cielo, se quiebra y se abre en el piso (el mismo dibujo del Rayo saltarín)
  if (id === 'relampago') j.efectos.push({ id: 'arco_cadena', x: x + (R() - 0.5) * 1.2, y: y - 0.6 - R() * 0.6, x2: x, y2: y, t: 0, dir: 0, escala: 1, z: 0, dur: 0.3, za: 230 + R() * 60, zb: 0, suelo: true, cielo: true, sem: Math.floor(R() * 1e6) } as Efecto);
}
export function particulas(j: Juego, x: number, y: number, n: number, tipo: Particula['tipo'], color: string, fuerza = 1, z = 30) {
  if (j.particulas.length > 900) return;
  for (let i = 0; i < n; i++) {
    const a = R() * Math.PI * 2, v = R() * 2.2 * fuerza;
    j.particulas.push({ x, y, z: z + R() * 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: (tipo === 'humo' ? 10 : 40 + R() * 60) * fuerza, t: 0, dur: tipo === 'humo' ? 1.2 + R() : 0.5 + R() * 0.6, color, tam: tipo === 'humo' ? 3 + R() * 4 : 1 + R() * 2, tipo, grav: tipo === 'humo' || tipo === 'brasa' || tipo === 'ceniza' ? -20 : 220 });
  }
}
const COLOR_ELEM: Record<Elemento, string> = { fisico: '#ffffff', fuego: '#ff8030', frio: '#80c8ff', rayo: '#ffff90', veneno: '#80ff60', sombra: '#c070ff', luz: '#fff0b0', sangre: '#ff3030' };
const SONIDO_ELEM: Record<Elemento, string> = { fisico: 'golpe_carne', fuego: 'fuego_impacto', frio: 'hielo_impacto', rayo: 'rayo', veneno: 'veneno', sombra: 'sombra', luz: 'luz', sangre: 'golpe_carne' };
export const colorElem = (e: Elemento) => COLOR_ELEM[e];

// ------------------------------------------------------------------ mecánicas de clase
/** Bono sumado de objetos, buffs y pasivas (claves propias de las habilidades). */
export const bono = (h: Heroe, k: string) => h.c.st?.[k] ?? 0;
export const frascosMax = (h: Heroe) => 4 + Math.floor(bono(h, 'frascos_max'));
export const ventanaCombo = (h: Heroe) => 1.8 + bono(h, 'combo_ventana');
export const MAX_CARGAS = 3;
const CONSUME_CARGAS = new Set(['descarga_prismatica', 'sol_negro', 'edad_hielo', 'furia_firmamento']);
export function reiniciarMecanicas(h: Heroe) {
  h.furia = 0; h.furiaFija = 0; h.tCombate = -99; h.combo = { paso: 0, t: -99 }; h.cargas = []; h.frascoT = 0;
  if (h.c) h.frascos = frascosMax(h);
}
/** Mensaje que no se repite seguido (para avisos al mantener apretado el botón). */
function aviso(j: Juego, txt: [string, string], color = '#e0d0a0') {
  const h = j.heroe, k = txt[0];
  if ((h.avisos[k] ?? -99) > j.t - 1.5) return;
  h.avisos[k] = j.t; msg(j, txt, color);
}
export function ganarFuria(j: Juego, v: number) {
  const h = j.heroe; if (h.d.clase !== 'berserker') return;
  h.furia = Math.min(100, h.furia + v * (1 + bono(h, 'furia_gana') / 100)); h.tCombate = j.t;
}
/** Cadáveres de monstruos que todavía sirven (no usados, no invocados). */
export function cadaveresCerca(j: Juego, x: number, y: number, r: number): Monstruo[] {
  return j.monstruos.filter((m) => m.muerto && !m.dueno && !(m as any).usado && m.tMuerto < 590 && dist(m.x, m.y, x, y) <= r).sort((a, b) => dist(a.x, a.y, x, y) - dist(b.x, b.y, x, y));
}
/** (el que revienta queda 2 s más en la lista, `tMuerto` 598, para hincharse antes: lo borra el filtro de los 600 s) */
function usarCadaver(m: Monstruo) { (m as any).usado = true; m.tMuerto = 999; }
/** Gasta las cargas de un elemento (o todas) y dice cuántas eran. */
function gastarCargas(h: Heroe, e?: Elemento): Elemento[] {
  const fuera = h.cargas.filter((c) => !e || c === e); h.cargas = h.cargas.filter((c) => e && c !== e); return fuera;
}
const mios = (j: Juego, id?: string) => j.monstruos.filter((m) => m.dueno && !m.muerto && (!id || m.invocaId === id));

function sonar(j: Juego, id: string, x?: number, y?: number, vol = 1, tono?: number) {
  const h = j.heroe;
  let pan = 0, d = 0;
  if (x !== undefined && y !== undefined) { pan = clamp(((x - y) - (h.x - h.y)) / 14, -1, 1); d = clamp(dist(x, y, h.x, h.y) / 22, 0, 1); }
  Sonido.efecto(id, { pan, dist: d, vol, tono });
}

// ------------------------------------------------------------------ daño
export interface Golpe { /** Golpe del arma del héroe (dispara los efectos de las legendarias del arsenal). */ arma?: boolean; min: number; max: number; elem: Elemento; precision?: number; critico?: number; robo?: number; aturdir?: number; empuje?: number; lento?: number; aplastar?: number; herida?: number; deHeroe: boolean; fuente?: Ent; extra?: Partial<Record<Elemento, number>>; sinFallo?: boolean; /** Golpe de un combo (0, 1 o 2): los dos primeros pegan más suave en pantalla y no disparan efectos de arma. */ parte?: number }
/**
 * Probabilidad (%) de que un golpe del héroe conecte. Contra un monstruo de su nivel ronda el 90 %: la precisión contra la
 * defensa mueve unos ±10 puntos y cada nivel que el monstruo te saca resta 2,5. Entre 60 y 97.
 * (Antes era precisión/(precisión+defensa) × 2·nivel/(nivel+nivel del monstruo): en nivel 1 contra uno de nivel 3 daba 50 %.)
 */
export function aciertoHeroe(prec: number, def: number, nivelH: number, nivelM: number): number {
  const r = prec / Math.max(1, prec + def);
  return clamp(90 + (r - 0.5) * 40 - Math.max(0, nivelM - nivelH) * 2.5, 60, 97);
}
/** El "Falla": chico y gris, y como mucho uno cada 0.6 s por blanco (antes tapaba el combate). */
function falla(j: Juego, v: Ent) {
  const a = v as any; if (a.tFalla !== undefined && j.t - a.tFalla < 0.6) return; a.tFalla = j.t;
  j.numeros.push({ x: v.x, y: v.y, z: 52 * (v.escala ?? 1), txt: j.idi ? 'miss' : 'falla', color: '#8a8a8a', t: 0, chico: true });
}
export function danar(j: Juego, v: Ent, g: Golpe): number {
  // (pruebas: t940_rayo_muro guarda quién le pegó al blanco marcado en __z)
  if ((window as any).__traza && v === (window as any).__z) ((window as any).__trazas ??= []).push(new Error().stack?.split('\n').slice(1, 9).join(' | '));
  if (v.muerto) return 0;
  // nada del héroe ni de sus aliados le pega a un aliado (Thor, invocados, escoltas)
  if (g.deHeroe && (v as Monstruo).dueno) return 0;
  // y ningún aliado le pega al héroe, pase lo que pase con su blanco
  if (v.tipo === 'heroe' && (g.fuente as Monstruo | undefined)?.dueno) return 0;
  const h = j.heroe;
  // ¿pega?
  if (!g.sinFallo && g.elem === 'fisico') {
    if (v.tipo === 'heroe') {
      const mon = g.fuente as Monstruo | undefined;
      const ar = 20 + (mon?.nivel ?? 1) * 14;
      const p = clamp((ar / (ar + h.c.def)) * 2 * (mon?.nivel ?? 1) / ((mon?.nivel ?? 1) + h.d.nivel) * 100, 5, 95);
      if (R() * 100 > p) { falla(j, v); return 0; }
      if (h.c.esquiva && R() * 100 < h.c.esquiva) { j.numeros.push({ x: v.x, y: v.y, z: 60, txt: j.idi ? 'Dodge' : 'Esquiva', color: '#a0ffa0', t: 0 }); return 0; }
      if (h.c.bloqueo && R() * 100 < h.c.bloqueo && h.acc !== 'atacar') { h.acc = 'herido'; h.t = 0; h.dur = 0.25; sonar(j, 'bloqueo', v.x, v.y); j.numeros.push({ x: v.x, y: v.y, z: 60, txt: j.idi ? 'Block' : 'Bloqueo', color: '#c0c0ff', t: 0 }); return 0; }
    } else if (g.deHeroe && g.precision !== undefined) {
      const m = v as Monstruo;
      const def = m.defensa * (1 + (m.maldicion ? -0.3 : 0));
      if (R() * 100 > aciertoHeroe(g.precision, def, h.d.nivel, m.nivel)) { falla(j, v); return 0; }
    }
  }
  let total = 0;
  const partes: [Elemento, number][] = [[g.elem, entre(g.min, g.max)]];
  for (const [e, v2] of Object.entries(g.extra ?? {})) if (v2) partes.push([e as Elemento, v2 * entre(0.7, 1.3)]);
  let crit = false;
  if (g.critico && R() * 100 < g.critico) crit = true;
  // la marca que la habilidad deja sobre cada alcanzado (una por enemigo cada medio segundo)
  if (g.deHeroe && v !== j.heroe) { const bl = usosPfx.hab.get(j.heroe.habActual)?.blanco; if (bl && ((v as any).tBlanco ?? -9) < j.t - 0.5) { (v as any).tBlanco = j.t; efecto(j, 'pfx:' + bl, v.x, v.y, 0, 0.9, 0, 0.7); } }
  // el golpe crítico del héroe se ve: el destello de pixelfx en el punto del golpe y chispas blancas
  if (crit && g.deHeroe) { efecto(j, 'pfx:fx_critico', v.x, v.y, 0, 0.9); particulas(j, v.x, v.y, 8, 'chispa', '#fff4c0', 1.6, 34); }
  for (let [e, d] of partes) {
    // el crítico dobla lo físico y la sangre, y el daño elemental del arma también sube (×1.5)
    if (crit) d *= e === 'fisico' || e === 'sangre' ? 2 : 1.5;
    let res = 0;
    if (v.tipo === 'heroe') { res = h.c.res[e] ?? 0; if (e === 'fisico') res = h.c.reduc_dano; }
    else { const m = v as Monstruo; res = m.res[e] ?? 0; if (m.maldicion) { res += m.maldicion.res; if (e === 'fisico' && m.maldicion.amplificar) res -= m.maldicion.amplificar; } }
    if (g.fuente && g.fuente.tipo === 'monstruo' && (g.fuente as Monstruo).maldicion?.debilitar) d *= 1 - (g.fuente as Monstruo).maldicion!.debilitar / 100;
    d *= 1 - clamp(res, -100, 95) / 100;
    if (e === 'veneno') { v.veneno = Math.max(v.veneno, 2.5); v.venenoDps = Math.max(v.venenoDps, d / 2.5); total += d * 0.2; continue; }
    if (e === 'frio') { v.frio = Math.max(v.frio, 2.5 + (v.tipo === 'heroe' ? 0 : 1)); if (v.tipo !== 'heroe' && R() < 0.15 && !(v as Monstruo).def.jefe) v.congelado = 1.2; else if (v.tipo === 'heroe' && R() < 0.06 * (1 - clamp(res, 0, 90) / 100)) v.congelado = Math.max(v.congelado, 0.6); }
    // quemadura: el fuego sigue ardiendo un rato (20 % más en 2 s)
    if (e === 'fuego' && d > 0) { (v as any).quema = 2; (v as any).quemaDps = Math.max((v as any).quemaDps ?? 0, d * 0.1); }
    if (e === 'sangre') v.sangrado = Math.max(v.sangrado, 3);
    // el rayo sacude el cuerpo que pega: se dibuja sobre su propia silueta (render/electro.ts), no un muñeco horneado
    if (e === 'rayo' && d > 0) (v as any).electroT = j.t;
    total += d;
  }
  // núcleo expuesto de Ozmaren: doble daño
  const nucleo = v.tipo !== 'heroe' && (v as any).nucleoT > 0 && !!g.deHeroe;
  if (nucleo) total *= 2;
  // la arcanista desvía a su maná un cuarto del daño que recibe ("una mente que no se quiebra")
  // paga con maná el 30 % del daño, pero solo con el maná por encima del 25 %: así nunca la deja sin hechizos
  if (v.tipo === 'heroe' && h.d.clase === 'arcanista' && total > 0) { const libre = h.mana - h.c.manaMax * 0.15; if (libre > 0) { const a = Math.min(libre, total * 0.4); h.mana -= a; total -= a; } }
  // escudo de hueso
  if (v.tipo === 'heroe' && h.escudoHueso > 0) { const a = Math.min(h.escudoHueso, total); h.escudoHueso -= a; total -= a; if (a > 0) particulas(j, v.x, v.y, 3, 'chispa', '#e0d8c0'); }
  if (g.aplastar && v.tipo !== 'heroe' && R() * 100 < g.aplastar) total += v.vida * ((v as Monstruo).calidad >= 3 ? 0.05 : 0.25);
  if (g.herida && R() * 100 < g.herida) v.sangrado = 4;
  // presas marcadas, sifón de vida y furia
  if (v.tipo !== 'heroe' && g.deHeroe) {
    const m = v as Monstruo;
    if (m.marca && m.marca > 0) total *= 1 + (20 + bono(h, 'marca_pct') + (h.buffs.caceria_salvaje ? 20 : 0)) / 100;
    if (m.maldicion?.sifon && total > 0) h.vida = Math.min(h.vidaMax, h.vida + total * m.maldicion.sifon / 100);
    h.tCombate = j.t;
  }
  total = Math.max(0, total);
  if (v.tipo === 'heroe' && total > 0) ganarFuria(j, 3);
  // (solo para el HUD: el fuego que acaba de recibir el héroe lame el borde del orbe de vida un momento)
  if (v.tipo === 'heroe' && total > 0 && partes.some(([e, c]) => e === 'fuego' && c > 0)) (h as any).ardeT = j.t;
  // la armadura de Thor: cada tramo le quita daño
  if ((v as any).invocaId === 'thor') total *= 1 - Math.min(45, ((v as any).tramoThor ?? 0) * 8) / 100;
  // el golpe se siente en el cuerpo: un retroceso corto (solo visual) lejos de quien pega
  if (total > 0 && g.fuente && g.fuente !== v) { const sx = v.x - g.fuente.x, sy = v.y - g.fuente.y, sl = Math.hypot(sx, sy) || 1; v.sacud = { dx: sx / sl, dy: sy / sl, t: j.t, k: Math.max(0.5, Math.min(1.8, sensacionDe(g.fuente).peso / sensacionDe(v).peso)) }; }
  v.vida -= total;
  v.destello = 0.12;
  if (total > 0) {
    if (g.parte === undefined || Math.round(total) >= 1) numero(j, v, total, v.tipo === 'heroe' ? '#ff4040' : crit || nucleo ? '#ffe040' : COLOR_ELEM[g.elem], crit || nucleo, g.parte !== undefined && g.parte < 2 && v.vida > 0); // el golpe que mata se lee en tamaño normal (la vida ya viene descontada)
    if (g.robo && g.deHeroe) h.vida = Math.min(h.vidaMax, h.vida + total * g.robo / 100);
    if (g.deHeroe && h.c.robo_mana) h.mana = Math.min(h.c.manaMax, h.mana + total * h.c.robo_mana / 100);
  }
  // aturdir: nunca a los jefes; al héroe solo un momento
  if (g.aturdir && !esJefe(v) && R() * 100 < g.aturdir) v.aturdido = v.tipo === 'heroe' ? Math.max(v.aturdido, 0.5) : 1;
  if (g.lento) v.frio = Math.max(v.frio, 2);
  if (g.empuje && v.tipo !== 'heroe' && g.fuente && !(v as Monstruo).def.jefe) { const dx = v.x - g.fuente.x, dy = v.y - g.fuente.y, l = Math.hypot(dx, dy) || 1; for (let k = 0; k < 6; k++) { const nx = v.x + (dx / l) * 0.35, ny = v.y + (dy / l) * 0.35; if (pasable(j.zona, nx, ny)) { v.x = nx; v.y = ny; } } }
  // sangre y reacción
  if (v.tipo === 'monstruo' && total > 0 && (g.elem === 'fisico' || g.elem === 'sangre' || crit)) salpicar(j, v as Monstruo, g.fuente, total / Math.max(1, v.vidaMax), crit);
  else if (g.elem === 'fisico' || g.elem === 'sangre') particulas(j, v.x, v.y, total > v.vidaMax * 0.2 ? 10 : 5, 'sangre', (v as Monstruo).def?.sonido === 'hueso' ? '#d8d0b8' : '#8a0c0c', 1, 34 * v.escala);
  if (v.tipo === 'heroe') {
    (globalThis as any).__danoHeroe?.(g, total); // (pruebas: t1010_campamentos reparte el daño recibido por quién lo hizo)
    j.sacudida = Math.max(j.sacudida, total > h.vidaMax * 0.15 ? 0.35 : 0.12);
    if (total > h.vidaMax * 0.1) j.congela = Math.max(j.congela ?? 0, 0.045);
    if (total > h.vidaMax * 0.08 && h.acc !== 'atacar' && h.acc !== 'lanzar') { h.acc = 'herido'; h.t = 0; h.dur = 0.3 / (1 + h.c.vel_recuperar / 100); }
    sonar(j, total > h.vidaMax * 0.1 ? 'dolor_heroe' : 'golpe_carne');
    if (R() < 0.06) desgastar(j, elegir(['cabeza', 'torso', 'izq', 'manos', 'pies', 'cinturon']));
    // espinas
    if (g.fuente && g.fuente.tipo === 'monstruo' && h.d.aura) pulsoAura(j, h.buffs.aura_espinas ? g.fuente.x : h.x, h.buffs.aura_espinas ? g.fuente.y : h.y, h.buffs.aura_espinas ? 'espinas' : 'recibe');
    if (g.fuente && g.fuente.tipo === 'monstruo' && (h.c.espinas || h.buffs.aura_espinas)) {
      const esp = h.c.espinas + (h.buffs.aura_espinas ? total * (h.buffs.aura_espinas.bonos.espinas_pct ?? 0) / 100 : 0);
      if (esp > 0) danar(j, g.fuente, { min: esp, max: esp, elem: 'fisico', deHeroe: true, sinFallo: true });
    }
    if (h.buffs.armadura_escarcha && g.fuente && g.fuente.tipo === 'monstruo') { g.fuente.frio = 3; g.fuente.congelado = 0.8; }
    if (h.vida <= 0) morirHeroe(j);
  } else {
    const m = v as Monstruo;
    sonar(j, g.elem !== 'fisico' ? SONIDO_ELEM[g.elem] : m.def.sonido === 'hueso' ? 'golpe_hueso' : m.def.sonido === 'metal' ? 'golpe_metal' : 'golpe_carne', v.x, v.y, g.parte !== undefined && g.parte < 2 ? 0.65 : 0.8, g.parte === undefined ? undefined : g.parte === 2 ? 0.82 : 1.12);
    // gore: la carne chapotea, y un crítico desgarra
    if (total > 0 && (g.elem === 'fisico' || g.elem === 'sangre') && !sangraHueso(m) && m.def.sonido !== 'metal') {
      if (crit) sonar(j, 'desgarro', v.x, v.y, 0.75);
      else if (R() < 0.45) sonar(j, 'chapoteo', v.x, v.y, 0.4 + Math.min(0.4, total / m.vidaMax));
    }
    if (m.estado === 'dormido' || m.estado === 'deambular') { m.estado = 'perseguir'; m.objetivo = g.fuente ?? j.heroe; if (m.camp != null && !(globalThis as any).__vistaVieja) alertarCampamento(j, m, g.fuente ?? j.heroe); }
    // lo que se oye (reparto.ts): el golpe y el quejido despiertan a los de otros grupos que estén a pocas casillas, cada uno con
    // los suyos. No en cadena: el que se despierta por oído no hace oír a nadie más (si no, una pelea despertaba el mapa)
    if (!m.dueno && !(globalThis as any).__campamentos && j.t - ((m as any).oyeT ?? -9) > 0.6) { (m as any).oyeT = j.t; oir(j, m, g.fuente ?? j.heroe); }
    else if ((m as any).alerta > 0.3) { (m as any).alerta = 0.3; (m as any).espera = false; }
    if (total > m.vidaMax * 0.12 && m.acc !== 'atacar' && m.acc !== 'lanzar' && m.calidad < 3) { m.acc = 'herido'; m.t = 0; m.dur = 0.3; }
    if (crit || total > m.vidaMax * 0.3) j.sacudida = Math.max(j.sacudida, 0.1);
    if (g.arma && total > 0 && (g.parte === undefined || g.parte === 2)) efectoLegGolpe(j, m, total, crit);
    if (m.vida <= 0 && (m as any).huye) m.vida = 1; // historia: el heraldo no muere antes de su acto, huye
    // el golpe del héroe se siente según su clase: pausa de impacto y empujón de cámara cuando pega de cerca con el arma,
    // y el que muere sale despedido lejos del golpe (los jefes no)
    if (g.deHeroe && g.fuente === h && total > 0) {
      const S = SENSACION[h.d.clase], dxm = m.x - h.x, dym = m.y - h.y, dm = Math.hypot(dxm, dym) || 1, mata = m.vida <= 0;
      // (solo lo que se ve: el arma viva revienta su materia en el blanco, lo dibuja escena.ts)
      // (solo lo que se ve: el golpe de un poder, para render/poderes_vivos.ts)
      if (habEnCurso && (habEnCurso !== 'ataque' || h.buffs.forma_lobo || h.buffs.forma_oso) && ((j as any).golpesPoder?.length ?? 0) < 24) { const o = deDonde ?? [h.x, h.y], ex = m.x - o[0], ey = m.y - o[1], el = Math.hypot(ex, ey) || 1;
        ((j as any).golpesPoder ??= []).push({ x: m.x, y: m.y, hab: habEnCurso, area: golpeArea, elem: g.elem, crit, mata, ux: ex / el, uy: ey / el, alto: Math.min(60, 18 + (m.radio ?? 0.4) * 40), parte: g.parte, f: Math.min(1, total / Math.max(1, m.vidaMax)), hueso: sangraHueso(m) }); }
      if (g.arma && h.c.vivo && dm < 3.4 && ((j as any).golpesVivos?.length ?? 0) < 8) ((j as any).golpesVivos ??= []).push({ x: m.x, y: m.y, el: h.c.vivo, fuerte: crit || m.vida <= 0, alto: Math.min(60, 18 + (m.radio ?? 0.4) * 40) });
      if (h.d.aura && g.arma && (h.d.aura === 'aura_fuerza' || h.d.aura === 'aura_presteza' || h.d.aura === 'aura_conviccion' || h.d.aura === 'aura_llama')) pulsoAura(j, m.x, m.y, 'golpe');
      if (S && g.arma && dm < 3.4) {
        const f = (crit ? 1.5 : 1) * (mata ? 1.35 : 1) * (g.parte !== undefined && g.parte < 2 ? 0.5 : 1);
        j.congela = Math.max(j.congela ?? 0, Math.min(0.12, S.pausa * f));
        // el crítico de un poder cuerpo a cuerpo se siente siempre, aunque la clase sea liviana (el monje, la cazadora)
        if (crit && habEnCurso && habEnCurso !== 'ataque') j.congela = Math.max(j.congela, 0.07);
        const ux = dxm / dm, uy = dym / dm;
        j.patada = { dx: (ux - uy) * 0.71, dy: (ux + uy) * 0.35, k: S.patada * f, t: performance.now() };
      }
      // a distancia (flechas, frascos, hechizos): la pantalla responde solo cuando el disparo mata o es crítico, y más suave
      else if (S && (mata || crit)) {
        j.congela = Math.max(j.congela ?? 0, S.pausa * 0.6);
        const ux = dxm / dm, uy = dym / dm; j.patada = { dx: (ux - uy) * 0.71, dy: (ux + uy) * 0.35, k: S.patada * 0.7, t: performance.now() };
      }
      if (S && mata && !m.def.jefe && m.calidad < 3) {
        const d = S.empuje * (crit ? 1.4 : 1) / Math.max(0.8, sensacionDe(m).peso); let hecho = 0;
        for (let q = 0; q < 5; q++) { const nx = m.x + (dxm / dm) * d / 5, ny = m.y + (dym / dm) * d / 5; if (!pasable(j.zona, nx, ny)) break; m.x = nx; m.y = ny; hecho += d / 5; }
        m.sacud = { dx: dxm / dm, dy: dym / dm, t: j.t, lanz: hecho };
      }
    }
    // exceso de daño: si el golpe que lo mata pasa de la mitad de su vida, revienta (los jefes no)
    if (m.vida <= 0 && !m.dueno && m.calidad < 3 && !m.def.jefe && total > m.vidaMax * 0.5 && !sangraHueso(m)) reventar(j, m);
    if (m.vida <= 0) { (g as any).fueCrit = crit; morirMonstruo(j, m, g); }
  }
  return total;
}

// ------------------------------------------------------------------ maniobras de los monstruos
// Además de caminar y pegar, cada tipo de enemigo tiene ataques especiales con aviso: se ve venir (marca en el piso,
// el cuerpo se prepara), se puede esquivar saliendo de la marca, y si falla queda un momento expuesto.
//   bruto: embestida (carga en línea; si choca con un muro queda aturdido) y pisotón (onda alrededor)
//   enjambre: salto sobre la presa        común: golpazo (golpe cargado que pega en un círculo)
//   tirador: abanico de proyectiles       mago e invocador: charcos que se quedan en el piso
//   jefes y únicos: varias a la vez, más seguido, y se enfurecen al bajar de la mitad de la vida
export interface Maniobra {
  tipo: 'embestida' | 'pisoton' | 'salto' | 'golpazo' | 'charcos' | 'abanico';
  fase: 'aviso' | 'accion' | 'recupera'; t: number; aviso: number; dur: number;
  x: number; y: number; x0: number; y0: number; ang: number; radio: number; largo: number;
  puntos?: [number, number][]; pegados?: Set<Ent>; hecho?: number;
}
const esMandon = (m: Monstruo) => !!(m.def.jefe || m.def.ia === 'jefe' || m.calidad >= 2);
function maniobrasDe(m: Monstruo): Maniobra['tipo'][] {
  const d = m.def;
  if (d.fijo || d.ia === 'cobarde') return [];
  const tira = d.ia === 'distancia' || d.ia === 'mago' || d.ia === 'invocador';
  const out: Maniobra['tipo'][] = [];
  if (d.ia === 'bruto') out.push('embestida', 'pisoton', 'golpazo');
  else if (d.ia === 'enjambre') out.push('salto', 'golpazo');
  else if (tira) out.push(d.ia === 'distancia' ? 'abanico' : 'charcos');
  else if (d.ia === 'jefe' || d.jefe) { out.push('pisoton'); if (d.proyectil) out.push('abanico', 'charcos'); else out.push('embestida'); if (/arana|lobo|bestia/.test(d.id)) out.push('salto'); }
  else out.push('golpazo');
  if (esMandon(m)) { if (tira) { if (!out.includes('charcos')) out.push('charcos'); if (!out.includes('abanico') && d.proyectil) out.push('abanico'); } else if (!out.includes('pisoton')) out.push('pisoton'); }
  return out;
}
const AVISO_MAN: Record<Maniobra['tipo'], number> = { embestida: 0.8, pisoton: 0.85, salto: 0.6, golpazo: 0.7, charcos: 0.9, abanico: 0.65 };
function intentarManiobra(j: Juego, m: Monstruo, obj: Ent, dt: number): boolean {
  const o = m as any, jefe = esMandon(m);
  if ((globalThis as any).__sinManiobras) return false;
  if (o.manCd === undefined) o.manCd = jefe ? entre(1.5, 3) : entre(2, 6);
  if (o.manCd > 0) return false; void dt; // (la cuenta baja en actualizarMonstruo, también mientras pega)
  if ((m as any).alerta > 0) return false;
  const lista = maniobrasDe(m); if (!lista.length) { o.manCd = 999; return false; }
  // los comunes no se pisan entre ellos: una maniobra nueva cada 1,4 s como mucho en toda la pelea
  if (!jefe && j.t - ((j as any).manT ?? -9) < 1.4) { o.manCd = 0.4 + R() * 0.4; return false; }
  const d = dist(m.x, m.y, obj.x, obj.y), ve = d < 2.5 || lineaLibre(j.zona, m.x, m.y, obj.x, obj.y);
  const alc = m.radio + obj.radio + 0.75;
  const sirve = (t: Maniobra['tipo']) => t === 'embestida' ? d > (jefe ? 1.4 : 3) && d < 8.5 && ve : t === 'pisoton' ? d < alc + 0.9 : t === 'salto' ? d > 2.2 && d < 7 && ve : t === 'golpazo' ? d <= alc + 0.2 : t === 'charcos' ? d < 9 && ve : d < (m.def.rango ?? 7) && d > 1.5 && ve;
  const ok = lista.filter(sirve); if (!ok.length) { o.manCd = 0.35; return false; }
  let tipo = elegir(ok); if (ok.length > 1 && tipo === o.manUlt) tipo = elegir(ok.filter((t) => t !== o.manUlt));
  o.manUlt = tipo; o.manCd = (jefe ? entre(3.6, 5.6) : entre(6, 10)) * (m.fase >= 1 ? 0.7 : 1); (j as any).manT = j.t;
  const ang = Math.atan2(obj.y - m.y, obj.x - m.x), esc = m.radio / 0.42;
  const mn: Maniobra = { tipo, fase: 'aviso', t: 0, aviso: AVISO_MAN[tipo] * (jefe ? 1 : 1.1), dur: 0, x: obj.x, y: obj.y, x0: m.x, y0: m.y, ang, radio: 1.3, largo: 0 };
  if (tipo === 'pisoton') { mn.x = m.x; mn.y = m.y; mn.radio = 1.9 + 0.55 * esc + (m.def.area ?? 0) * 0.3; }
  if (tipo === 'golpazo') mn.radio = 1.15 + 0.2 * esc;
  if (tipo === 'salto') mn.radio = 1.2 + 0.3 * esc;
  if (tipo === 'embestida') mn.largo = Math.min(9, Math.max(5, d + 2.5));
  if (tipo === 'charcos') { const n = jefe ? 4 : 2; mn.radio = jefe ? 1.5 : 1.25; mn.puntos = [[obj.x, obj.y]]; for (let k = 0; k < n; k++) { const a = R() * Math.PI * 2, r = entre(1.6, 3.4); mn.puntos.push([obj.x + Math.cos(a) * r, obj.y + Math.sin(a) * r]); } }
  o.man = mn; m.dir = dirDe(obj.x - m.x, obj.y - m.y); m.camino = null;
  efecto(j, 'pfx:fx_aviso', m.x, m.y, 0, 0.8 + 0.25 * esc, 46 * (m.escala ?? 1) * esc);
  sonar(j, jefe ? 'rugido_jefe' : m.def.sonido === 'hueso' ? 'golpe_hueso' : 'grunido', m.x, m.y, jefe ? 0.7 : 0.5);
  return true;
}
function golpeManiobra(j: Juego, m: Monstruo, k: number, aturdir = 0): Golpe {
  const g: Golpe = { min: m.dano[0] * k, max: m.dano[1] * k, elem: 'fisico', deHeroe: false, fuente: m, sinFallo: true, extra: {} };
  if (m.def.elem && m.def.elem !== 'fisico') g.extra![m.def.elem] = (m.dano[0] + m.dano[1]) * 0.25 * k;
  if (aturdir) g.aturdir = aturdir;
  return g;
}
function avanzarManiobra(j: Juego, m: Monstruo, mn: Maniobra, dt: number) {
  const o = m as any, obj = m.objetivo && !m.objetivo.muerto ? m.objetivo : j.heroe, esc = m.radio / 0.42;
  const fin = (cd = 0.5) => { o.man = undefined; o.alto = 0; m.acc = 'quieto'; m.t = 0; m.cd = Math.max(m.cd, cd); };
  mn.t += dt;
  if (mn.fase === 'aviso') {
    const k = mn.t / mn.aviso, lanza = (mn.tipo === 'charcos' || mn.tipo === 'abanico') && hayLanzar(m);
    // el cuerpo se prepara: el golpe queda armado arriba (media animación, lenta) o retrocede un paso antes de lanzarse
    if (mn.tipo === 'embestida' || mn.tipo === 'salto') {
      if (k < 0.7) { mn.ang = Math.atan2(obj.y - m.y, obj.x - m.x); if (mn.tipo === 'salto') { mn.x = obj.x; mn.y = obj.y; } }
      m.dir = dirDe(Math.cos(mn.ang), Math.sin(mn.ang)); m.acc = 'quieto';
      const bx = m.x - Math.cos(mn.ang) * 0.55 * dt, by = m.y - Math.sin(mn.ang) * 0.55 * dt; if (pasable(j.zona, bx, by)) { m.x = bx; m.y = by; }
      // (el paso atrás de la carga: los pies se mueven, no se corre el cuadro quieto)
      if (mn.tipo === 'embestida') { m.acc = 'caminar'; m.recorrido = (m.recorrido ?? 0) + 0.55 * dt; (m as any).rumbo = mn.ang + Math.PI; (m as any).accVis = 'caminar'; }
      if (R() < dt * 14) particulas(j, m.x, m.y, 1, 'humo', '#6a5a48', 0.5, 4);
    } else { m.acc = lanza ? 'lanzar' : 'atacar'; m.dur = mn.aviso / 0.5; m.t = mn.t; if (mn.tipo === 'abanico') { mn.ang = Math.atan2(obj.y - m.y, obj.x - m.x); m.dir = dirDe(Math.cos(mn.ang), Math.sin(mn.ang)); } }
    m.destello = Math.max(m.destello, k > 0.75 ? 0.05 : 0);
    if (mn.t < mn.aviso) return;
    mn.fase = 'accion'; mn.t = 0; mn.x0 = m.x; mn.y0 = m.y;
    const rematar = () => { m.acc = lanza ? 'lanzar' : 'atacar'; m.dur = 0.5; m.t = 0.27; mn.fase = 'recupera'; mn.t = 0; };
    if (mn.tipo === 'pisoton' || mn.tipo === 'golpazo') {
      const fuerte = mn.tipo === 'pisoton';
      for (const e of enemigosDe(j, false)) if (dist(e.x, e.y, mn.x, mn.y) < mn.radio + e.radio * 0.5) danar(j, e, golpeManiobra(j, m, fuerte ? 1.15 : 1.3, fuerte ? 50 : 0));
      efecto(j, 'onda_aterrizaje', mn.x, mn.y, 0, mn.radio / 1.5); j.sacudida = Math.max(j.sacudida, fuerte ? 0.55 : 0.3);
      particulas(j, mn.x, mn.y, fuerte ? 14 : 7, 'humo', '#6a5a48', 1.4, 6); sonar(j, fuerte ? 'explosion' : 'tajo', mn.x, mn.y, 0.7);
      rematar(); mn.dur = fuerte ? 0.75 : 0.55; return;
    }
    if (mn.tipo === 'charcos') {
      const el: Elemento = m.def.elem && m.def.elem !== 'fisico' ? m.def.elem : m.def.proyectil === 'fuego' ? 'fuego' : m.def.proyectil === 'hielo' ? 'frio' : 'veneno';
      const fx = el === 'fuego' ? 'muro_llamas' : el === 'frio' ? 'nova_escarcha' : el === 'rayo' ? 'trueno' : el === 'luz' ? 'pilar_luz' : 'nube_veneno';
      for (const [x, y] of mn.puntos ?? []) {
        j.areas.push({ x, y, radio: mn.radio, dano: [m.dano[0] * 0.3, m.dano[1] * 0.3], elem: el, t: 0, dur: 3.6, tick: 0.5, prox: 0, deHeroe: false, efecto: fx === 'muro_llamas' ? 'llamas_suelo' : '', retraso: 0 });
        efecto(j, fx, x, y, 0, mn.radio / 1.6, 0, 3.6); particulas(j, x, y, 6, el === 'fuego' ? 'brasa' : 'humo', el === 'fuego' ? '#ff7020' : el === 'frio' ? '#c0e8ff' : '#70b040', 1, 10);
      }
      sonar(j, el === 'fuego' ? 'fuego_lanzar' : el === 'frio' ? 'hielo_lanzar' : 'sombra', m.x, m.y, 0.8);
      rematar(); mn.dur = 0.6; return;
    }
    if (mn.tipo === 'abanico') {
      const n = esMandon(m) ? 7 : 5, pr = m.def.proyectil ?? 'flecha', e: Elemento = m.def.elem ?? 'fisico';
      const g = golpeManiobra(j, m, 0.7); g.sinFallo = false; g.elem = pr === 'flecha' || pr === 'lanza' ? 'fisico' : e; g.extra = {};
      for (let k2 = 0; k2 < n; k2++) { const a = mn.ang + (k2 - (n - 1) / 2) * 0.2; disparar(j, m, m.x + Math.cos(a) * 5, m.y + Math.sin(a) * 5, g, usosPfx.mon.has(m.def.id) && pr !== 'flecha' ? 'pfx:' + usosPfx.mon.get(m.def.id) : efectoProy(pr), pr === 'flecha' ? 11 : 7.5); }
      sonar(j, pr === 'flecha' ? 'flecha' : pr === 'hielo' ? 'hielo_lanzar' : pr === 'fuego' ? 'fuego_lanzar' : 'sombra', m.x, m.y, 0.8);
      rematar(); mn.dur = 0.6; return;
    }
    if (mn.tipo === 'salto') {
      // cae un poco antes de la presa (no encima); si ahí no hay piso, se queda en golpe corto
      const dd = Math.max(0.01, dist(m.x, m.y, mn.x, mn.y)), q = Math.max(0, dd - (m.radio + 0.5)) / dd;
      mn.x = m.x + (mn.x - m.x) * q; mn.y = m.y + (mn.y - m.y) * q;
      if (!pasable(j.zona, mn.x, mn.y) || !lineaLibre(j.zona, m.x, m.y, mn.x, mn.y)) { fin(0.3); return; }
      mn.dur = 0.34 + dd * 0.035; m.acc = 'atacar'; m.dur = mn.dur * 2; m.t = 0; sonar(j, 'grunido', m.x, m.y, 0.5);
    }
    if (mn.tipo === 'embestida') { mn.pegados = new Set(); mn.hecho = 0; sonar(j, 'grunido', m.x, m.y, 0.8); }
    return;
  }
  if (mn.fase === 'accion') {
    if (mn.tipo === 'salto') {
      const k = Math.min(1, mn.t / mn.dur);
      m.x = mn.x0 + (mn.x - mn.x0) * k; m.y = mn.y0 + (mn.y - mn.y0) * k; o.alto = Math.sin(k * Math.PI) * (26 + 10 * esc); m.t = Math.min(m.t, m.dur * 0.5);
      if (k < 1) return;
      o.alto = 0;
      for (const e of enemigosDe(j, false)) if (dist(e.x, e.y, m.x, m.y) < mn.radio + e.radio) danar(j, e, golpeManiobra(j, m, 1.25));
      efecto(j, 'onda_aterrizaje', m.x, m.y, 0, mn.radio / 1.6); j.sacudida = Math.max(j.sacudida, 0.2 + 0.1 * esc); particulas(j, m.x, m.y, 8, 'humo', '#6a5a48', 1.2, 4); sonar(j, 'tajo', m.x, m.y, 0.6);
      m.acc = 'atacar'; m.dur = 0.45; m.t = 0.25; mn.fase = 'recupera'; mn.t = 0; mn.dur = 0.5; return;
    }
    // embestida: corre en línea recta; al que agarra lo atropella, y si choca contra un muro queda aturdido
    const v = Math.max(8.5, m.vel * 3.6), paso = v * dt, nx = m.x + Math.cos(mn.ang) * paso, ny = m.y + Math.sin(mn.ang) * paso;
    m.acc = 'correr' as any; if (m.t >= m.dur) m.t = 0; m.dir = dirDe(Math.cos(mn.ang), Math.sin(mn.ang));
    if (!pasable(j.zona, nx, ny)) {
      efecto(j, 'pfx:fx_impacto_muro', m.x + Math.cos(mn.ang) * 0.5, m.y + Math.sin(mn.ang) * 0.5, 0, 1 + 0.3 * esc, 20); efecto(j, 'onda_aterrizaje', m.x, m.y, 0, 1);
      j.sacudida = Math.max(j.sacudida, 0.5); sonar(j, 'explosion', m.x, m.y, 0.7); particulas(j, m.x, m.y, 12, 'humo', '#7a6a58', 1.6, 12);
      if (!m.def.jefe) m.aturdido = 1.6; letrero(j, m, ['Aturdido', 'Stunned'], '#ffe080');
      fin(0.8); return;
    }
    // (Rick, 20 nov 2026: "los bosses solo se deslizan, la imagen congelada". El cuadro de correr sale de lo recorrido
    // (`recorrido`, los pies clavados en escena.ts) y la embestida movía el cuerpo sin sumarlo: el mismo cuadro se corría
    // por el piso. Ahora suma lo recorrido y el rumbo, como un paso de verdad, y el polvo sale de cada pisada)
    const rec0 = m.recorrido ?? 0;
    m.x = nx; m.y = ny; mn.hecho = (mn.hecho ?? 0) + paso; if (!(window as any).__embestidaVieja) { m.recorrido = rec0 + paso; (m as any).rumbo = mn.ang; (m as any).accVis = 'correr'; }
    if (Math.floor(rec0 / 0.9) !== Math.floor((m.recorrido ?? 0) / 0.9)) { particulas(j, m.x, m.y, 3, 'humo', '#6a5a48', 0.9, 3); j.sacudida = Math.max(j.sacudida, m.def.jefe ? 0.12 : 0.05); }
    if (R() < dt * 30) particulas(j, m.x, m.y, 1, 'humo', '#6a5a48', 0.7, 3);
    for (const e of enemigosDe(j, false)) if (!mn.pegados!.has(e) && dist(e.x, e.y, m.x, m.y) < m.radio + e.radio + 0.3) { mn.pegados!.add(e); danar(j, e, golpeManiobra(j, m, 1.35, 60)); j.sacudida = Math.max(j.sacudida, 0.45); efecto(j, 'onda_aterrizaje', e.x, e.y, 0, 0.9); }
    if (mn.hecho >= mn.largo) { mn.fase = 'recupera'; mn.t = 0; mn.dur = mn.pegados!.size ? 0.5 : 1.1; m.acc = 'quieto'; m.t = 0; }
    return;
  }
  // recupera: termina el gesto y queda un momento quieto (la ventana para castigarlo)
  if ((m.acc === 'atacar' || m.acc === 'lanzar') && m.t >= m.dur) { m.acc = 'quieto'; m.t = 0; }
  if (mn.t >= mn.dur) fin(0.35);
}

/** El aliento de fuego de un monstruo: cono de `alcance` casillas y 90°, aviso de 0.6 s y chorro de 1.5 s. */
interface ConfAliento { alcance: number; escala: number; cd: number; dano: number }
export interface Aliento { fase: 'aviso' | 'sopla'; t: number; ang: number; tick: number; conf: ConfAliento }
const ALIENTO: Record<string, ConfAliento> = { senor_demonio: { alcance: 6, escala: 1, cd: 9, dano: 0.3 }, demonio_alado: { alcance: 3, escala: 0.6, cd: 7, dano: 0.12 } };
/** Índice de dirección (s, so, o, no, n, ne, e, se) para un ángulo en el mundo. */
function dirDeAngulo(a: number) { const vx = Math.cos(a), vy = Math.sin(a), sx = vx - vy, sy = (vx + vy) / 2; return Math.round((Math.atan2(sy, sx) - Math.PI / 2) / (Math.PI / 4) + 8) % 8; }
export function enCono(m: Ent, al: Aliento, x: number, y: number) {
  const d = dist(x, y, m.x, m.y); if (d > al.conf.alcance + 0.4 || d < 0.2) return d < 0.2;
  let da = Math.atan2(y - m.y, x - m.x) - al.ang; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
  return Math.abs(da) <= Math.PI / 4;
}
function avanzarAliento(j: Juego, m: Monstruo, al: Aliento, dt: number) {
  al.t += dt;
  m.acc = (m.def.id === 'senor_demonio' ? 'especial' : 'lanzar') as any; if (m.t >= m.dur) m.t = 0;
  if (al.fase === 'aviso') {
    if (al.t >= 0.6) { al.fase = 'sopla'; al.t = 0; efecto(j, 'aliento_infernal', m.x, m.y, dirDeAngulo(al.ang), al.conf.escala, 0, 1.5); sonar(j, 'fuego_lanzar', m.x, m.y); }
    return;
  }
  al.tick -= dt;
  if (al.tick <= 0) {
    al.tick = 0.3;
    for (const e of enemigosDe(j, false)) if (enCono(m, al, e.x, e.y)) danar(j, e, { min: m.dano[0] * al.conf.dano, max: m.dano[1] * al.conf.dano, elem: 'fuego', deHeroe: false, fuente: m, sinFallo: true });
  }
  if (al.t >= 1.5) { (m as any).aliento = undefined; m.acc = 'quieto'; m.t = 0; m.cd = 0.4; }
}
/** Acompañantes vivos alrededor de un jefe (sin contarlo a él). */
function acompanantes(j: Juego, m: Monstruo) { return j.monstruos.filter((o) => o !== m && !o.muerto && !o.dueno && dist(o.x, o.y, m.x, m.y) < 10).length; }
/** Un lugar libre a 3.5 a 6 casillas del jefe: los que llegan no se le montan encima. */
function lejosDelJefe(j: Juego, m: Monstruo): [number, number] {
  for (let i = 0; i < 10; i++) { const a = R() * Math.PI * 2, r = entre(3.5, 6); const q = libreCerca(j.zona, m.x + Math.cos(a) * r, m.y + Math.sin(a) * r); if (dist(q[0] + 0.5, q[1] + 0.5, m.x, m.y) >= 3) return q; }
  return libreCerca(j.zona, m.x + 4, m.y + 4);
}
/**
 * La muerte se ve: un abanico de sangre hacia donde iba el golpe, el chorro que sigue latiendo unos instantes sobre el
 * cuerpo, una nube roja, astillas si era de hueso, la cabeza que vuela con un crítico, sangre en el lente si fue pegado a
 * ti, y las rachas (varias muertes seguidas) que sacuden la pantalla y se anuncian.
 */
const TINTA: Record<string, [string, string]> = { rojo: ['#8a0808', '#c81818'], negro: ['#1e1e18', '#3c3a2c'], verde: ['#2a5a10', '#5aa020'] };
function muerteBrutal(j: Juego, m: Monstruo, g?: Golpe) {
  const h = j.heroe, o = j as any, hueso = sangraHueso(m), pal = paletaDe(m), [c1, c2] = TINTA[pal], crit = !!(g as any)?.fueCrit, rev = !!(m as any).reventado;
  const fx = g?.fuente?.x ?? h.x, fy = g?.fuente?.y ?? h.y, dx = m.x - fx, dy = m.y - fy, l = Math.hypot(dx, dy) || 1, ang = Math.atan2(dy / l, dx / l), esc = m.escala ?? 1;
  // (lo que muere por un elemento no sangra: se quema, se parte en hielo, se deshace. La sangre es del acero)
  const seco = !!(m as any).mElem && (m as any).mElem !== 'sangre' && !rev;
  if (seco) { /* el cuerpo y sus partículas los pone la muerte por elemento */ }
  else if (hueso) {
    // el esqueleto se desarma: astillas y huesos que saltan en abanico
    if (j.particulas.length < 1000) for (let i = 0; i < 16; i++) { const a = ang + (R() - 0.5) * 1.6, v = 2 + R() * 5; j.particulas.push({ x: m.x, y: m.y, z: 20 * esc + R() * 20, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 50 + R() * 130, t: 0, dur: 0.9 + R() * 0.7, color: R() < 0.5 ? '#d8d0b8' : '#a89c80', tam: 2 + R() * 3, grav: 320, tipo: 'sangre' } as any); }
    particulas(j, m.x, m.y, 5, 'humo', '#8a8474', 0.9, 24 * esc);
  } else {
    // abanico de sangre en el piso, hacia donde iba el golpe
    for (let i = 0, n = 3 + (crit ? 2 : 0) + (esc > 1.3 ? 1 : 0); i < n; i++) { const a = ang + (R() - 0.5) * 1.2, d = 0.9 + R() * 1.9 * Math.min(1.6, esc); ponerMancha(j, { x: m.x + Math.cos(a) * d, y: m.y + Math.sin(a) * d, r: 0.4 + R() * 0.55, color: colorSangre(m), t: 0, tipo: 'sangre', forma: 'salpicadura', ang: a, sem: Math.floor(R() * 8), pal }); }
    // el chorro: late un segundo largo sobre el cuerpo
    if (!rev) (o.chorros ??= []).push({ x: m.x, y: m.y, t: 0, ac: 0, dur: 0.9 + R() * 0.7 + (crit ? 0.5 : 0), ang: ang + (R() - 0.5) * 1.2, esc, c1, c2 });
    particulas(j, m.x, m.y, crit ? 9 : 5, 'humo', c1, 0.8, 26 * esc);
    // un crítico arranca algo: la cabeza (o lo que tenga) sale volando
    if (crit && !rev) { const gibs: Gib[] = (o.gibs ??= []); const v = 3 + R() * 3, a = ang + (R() - 0.5) * 0.5; gibs.push({ id: 'gore_gib_craneo', pal: PAL_GIB[pal], x: m.x, y: m.y, z: 44 * esc, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: 120 + R() * 80, ang: R() * 8, va: (R() - 0.5) * 34, t: 0, vida: 20 + R() * 20 }); sonar(j, 'desgarro', m.x, m.y, 0.8); }
  }
  // sangre en el lente: cuando revienta o cae de un crítico pegado a ti
  if (!hueso && !seco && (rev || crit) && dist(m.x, m.y, h.x, h.y) < 2.6) o.lente = { t: j.t, sem: R() * 100, n: rev ? 10 : 6, color: c1 };
  // rachas: varias muertes seguidas
  o.racha = j.t - (o.rachaT ?? -9) < 2.4 ? (o.racha ?? 0) + 1 : 1; o.rachaT = j.t;
  const RACHA: Record<number, [[string, string], string, number]> = { 3: [['¡Triple!', 'Triple!'], '#ffd070', 0.2], 5: [['¡Carnicería!', 'Carnage!'], '#ff9040', 0.35], 8: [['¡MATANZA!', 'SLAUGHTER!'], '#ff5030', 0.5], 12: [['¡EXTERMINIO!', 'EXTERMINATION!'], '#ff2020', 0.7] };
  const ra = RACHA[o.racha];
  if (ra) { letrero(j, h, ra[0], ra[1]); j.sacudida = Math.max(j.sacudida, ra[2]); if (o.racha >= 8) j.congela = Math.max(j.congela ?? 0, 0.11); sonar(j, 'reventon', h.x, h.y, 0.5); }
}
function morirMonstruo(j: Juego, m: Monstruo, g?: Golpe) {
  if (sangraHueso(m) && !m.dueno) sonar(j, 'hueso_cruje', m.x, m.y, 0.8);
  if (g?.arma && !m.dueno) efectoLegMuerte(j, m);
  m.muerto = true; m.acc = 'morir'; m.t = 0; m.tMuerto = 0; m.vida = 0;
  const h = j.heroe;
  if (m.dueno && m.invocaId === 'thor') {
    // Thor no muere: se echa a descansar y vuelve solo en 60 s (o al llegar al pueblo), sin castigo
    (h.d.thor ??= {}).descanso = 60;
    msg(j, ['Thor se echa a descansar. Vuelve en un minuto, o antes si pasas por el pueblo.', 'Thor lies down to rest. He comes back in a minute, or sooner if you visit town.'], '#c0a070');
    return;
  }
  if (m.dueno) { despedidaInvocado(j, m); j.cadaveres++; return; }
  // la muerte según lo que lo mató: el fuego lo carboniza, el frío lo congela y lo parte, el rayo lo sacude, el veneno
  // lo derrite, la sombra lo deshace en humo negro y la luz lo consume (el cuerpo y las partículas los pone el dibujo:
  // ver escena y energia). Acá queda la marca en el piso.
  { const me: string | undefined = m.congelado > 0 ? 'frio' : (m as any).quema > 0 ? 'fuego' : g?.elem && g.elem !== 'fisico' ? g.elem : !g && m.veneno > 0 ? 'veneno' : !g && m.sangrado > 0 ? 'sangre' : undefined;
    if (me && !m.def.jefe) {
      (m as any).mElem = me; const re = Math.max(0.7, m.escala ?? 1);
      if (me === 'fuego') ponerMancha(j, { x: m.x, y: m.y, r: 1.25 * re, color: '#120c06', t: 0, tipo: 'quemado' });
      else if (me === 'frio') ponerMancha(j, { x: m.x, y: m.y, r: 1.5 * re, color: '#a8d8f0', t: 0, tipo: 'hielo' });
      else if (me === 'veneno') ponerMancha(j, { x: m.x, y: m.y, r: 0.3 * re, rmax: 1.5 * re, color: '#3a7a14', t: 0, tipo: 'veneno' } as any);
      else if (me === 'rayo') ponerMancha(j, { x: m.x, y: m.y, r: 0.85 * re, color: '#16120c', t: 0, tipo: 'quemado' });
      if (me === 'frio' || me === 'rayo') sonar(j, me === 'frio' ? 'hueso_cruje' : 'rayo', m.x, m.y, 0.6);
    } }
  // la muerte de pixelfx (el ánima que sube, el hielo que revienta, la explosión del jefe...). La nube que desintegra
  // el cuerpo no va cuando murió por un elemento: ahí el cuerpo se ve consumirse
  let mp = muertePfx(m as any, g?.elem, R()); if ((m as any).mElem && mp && /desintegrar|alma_sube|implosion/.test(mp)) mp = null; if (mp) { (m as any).pfxMuerte = { id: mp, t0: j.t };
    // (el hielo que revienta se corta al segundo: después sus esquirlas se aplastaban en una raya a lo ancho de la pantalla)
    const hel = mp === 'fx_muerte_helada'; efecto(j, 'pfx:' + mp, m.x, m.y, 0, m.escala ?? 1, 0, hel ? 1.05 : 4.5); if (hel) (j.efectos[j.efectos.length - 1] as any).corte = true; }
  // condena del osario: el maldito revienta al morir
  if (m.maldicion?.condena && !(m as any).usado) {
    usarCadaver(m);
    const hb = habilidadDe('condena_osario'), dh = danoHab(j, hb, Math.max(1, nivelHab(h.d, hb.id, h.c)));
    j.areas.push({ x: m.x, y: m.y, radio: 2.5, dano: [dh[0] * 0.6 + m.vidaMax * 0.15, dh[1] * 0.6 + m.vidaMax * 0.25], elem: 'fuego', t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: 'estallido_cadaver', retraso: 0.05 });
  }
  sonar(j, m.def.sonido === 'hueso' ? 'muerte_esqueleto' : m.calidad >= 3 ? 'rugido_jefe' : 'muerte_monstruo', m.x, m.y);
  // el charco crece despacio bajo el cuerpo
  const rm = (0.8 + R() * 0.8) * m.escala * ((m as any).reventado ? 1.4 : 1);
  const secoM = !!(m as any).mElem && (m as any).mElem !== 'sangre' && !(m as any).reventado;
  if (!secoM) { ponerMancha(j, { x: m.x, y: m.y, r: rm * 0.25, rmax: rm, color: colorSangre(m), t: 0, tipo: 'sangre', forma: sangraHueso(m) ? undefined : 'charco', sem: Math.floor(R() * 8), pal: paletaDe(m) });
    particulas(j, m.x, m.y, 14, 'sangre', m.def.sonido === 'hueso' ? '#d8d0b8' : '#7a0808', 1.4, 30); }
  muerteBrutal(j, m, g);
  if (m.def.jefe || m.calidad >= 3) { ((j as any).caidas ??= []).push({ x: m.x, y: m.y, t: 0, prox: 0.15, esc: Math.max(1, m.escala ?? 1), elem: m.def.elem ?? 'fisico', pal: paletaDe(m), hueso: sangraHueso(m) }); j.congela = Math.max(j.congela ?? 0, 0.22); }
  // experiencia (con castigo si el monstruo es muy bajo)
  const dif = h.d.nivel - m.nivel;
  const k = dif > 5 ? Math.max(0.05, 1 - (dif - 5) * 0.15) : 1;
  ganarXp(j, Math.round(m.xp * k));
  if (h.c.vida_por_muerte) h.vida = Math.min(h.vidaMax, h.vida + h.c.vida_por_muerte);
  if (h.c.mana_por_muerte) h.mana = Math.min(h.c.manaMax, h.mana + h.c.mana_por_muerte);
  // botín
  const cal = m.def.jefe ? 4 : m.calidad;
  const caidas = botin(m.nivel, cal, h.c.hallazgo, h.c.oro_extra, h.d.clase);
  if (m.def.jefe) caidas.push({ obj: crearObjeto(m.nivel, R() < 0.5 ? 'unico' : 'raro') }, { obj: crearObjeto(m.nivel, 'raro') });
  const tj = TALISMAN_JEFE[m.def.id]; if (tj) { const o = crearUnicoId(tj, m.nivel); if (o) caidas.push({ obj: o }); }
  const lj = legendariaJefe(m.def.id, m.nivel, cal); if (lj) caidas.push({ obj: lj });
  // equipo de Thor: collares y bardas de los únicos y los jefes
  if ((m.def.jefe && R() < 0.3) || (m.calidad >= 2 && !m.def.jefe && R() < 0.07)) caidas.push({ obj: crearObjetoThor(R() < 0.5 ? 'collar' : 'barda', m.nivel) });
  if (m.calidad >= 2 && !m.def.jefe && R() < 0.25) caidas.push({ obj: crearObjeto(m.nivel, R() < 0.3 ? 'raro' : 'magico', (b) => b.ranura === 'talisman') });
  soltar(j, m.x, m.y, caidas);
  if (m.mods.includes('ardiente')) { j.areas.push({ x: m.x, y: m.y, radio: 2, dano: [m.dano[0], m.dano[1] * 1.2], elem: 'fuego', t: 0, dur: 0.4, tick: 1, prox: 0.3, deHeroe: false, efecto: 'explosion_fuego', retraso: 0.3 }); efecto(j, 'explosion_fuego', m.x, m.y); }
  if (m.mods.includes('helado')) { efecto(j, 'nova_escarcha', m.x, m.y); for (let a = 0; a < 8; a++) disparar(j, m, m.x + Math.cos(a * 0.785), m.y + Math.sin(a * 0.785), { min: m.dano[0] * 0.5, max: m.dano[1] * 0.5, elem: 'frio', deHeroe: false }, 'saeta_hielo', 8); }
  // misiones
  if (m.misionUnico && (h.d.misiones[m.misionUnico] ?? 0) <= 1) { h.d.misiones[m.misionUnico] = 2; j.eventos.push({ tipo: 'mision', dato: m.misionUnico }); }
  if (m.def.jefe) {
    j.eventos.push({ tipo: 'jefe_muerto', dato: m.def.id });
    efecto(j, 'alma_ascendente', m.x, m.y, 0, 2);
    j.sacudida = 1;
    if (!h.d.actosHechos.includes(h.d.acto)) h.d.actosHechos.push(h.d.acto);
  }
  if (j.jefe === m) j.jefe = null;
  void g;
}
export function soltar(j: Juego, x: number, y: number, caidas: Caida[]) {
  caidas.forEach((c, i) => {
    const a = (i / Math.max(1, caidas.length)) * Math.PI * 2 + R();
    const r = 0.6 + R() * 1.2;
    let px = x + Math.cos(a) * r, py = y + Math.sin(a) * r;
    if (!pasable(j.zona, px, py)) { const q = libreCerca(j.zona, px, py); px = q[0] + 0.5; py = q[1] + 0.5; }
    j.suelo.push({ o: c.obj ?? null, oro: c.oro ?? 0, x: px, y: py, t: 0, id: nid++ });
    if (c.obj && (c.obj.rareza === 'unico' || c.obj.rareza === 'legendario' || c.obj.rareza === 'conjunto')) { sonar(j, 'objeto_unico', px, py); efecto(j, 'pilar_luz', px, py, 0, 0.6); }
    else if (c.obj && c.obj.tipo === 'runa') sonar(j, 'objeto_raro', px, py);
    else if (c.obj) sonar(j, 'objeto_cae', px, py, 0.6);
  });
}
export function ganarXp(j: Juego, xp: number) {
  const h = j.heroe;
  if (h.d.nivel >= NIVEL_MAX) return;
  h.d.xp += xp;
  while (h.d.xp >= xpPara(h.d.nivel + 1) && h.d.nivel < NIVEL_MAX) {
    h.d.nivel++; h.d.puntosAtrib += 5; h.d.puntosHab += 1;
    recalc(j); h.vida = h.vidaMax; h.mana = h.c.manaMax;
    efecto(j, 'subida_nivel', h.x, h.y, 0, 1);
    { const ev = usosPfx.evento.get('subir_nivel'); if (ev) efecto(j, 'pfx:' + ev, h.x, h.y, 0, 1); }
    sonar(j, 'nivel');
    j.eventos.push({ tipo: 'nivel' });
    msg(j, [`¡Nivel ${h.d.nivel}! Tienes puntos nuevos para repartir.`, `Level ${h.d.nivel}! You have new points to spend.`], '#ffe080');
  }
}
function morirHeroe(j: Juego) {
  const h = j.heroe;
  if (h.muerto) return;
  h.muerto = true; h.acc = 'morir'; h.t = 0; h.vida = 0; (h as any).murioEn = j.t; transicionPfx('fx_trans_quemar');
  h.d.muertes++;
  sonar(j, 'muerte_heroe');
  Sonido.latido(false);
  j.eventos.push({ tipo: 'muerte' });
}

function desgastar(j: Juego, cas: string) {
  const o = (j.heroe.d.equipo as any)[cas] as Objeto | undefined;
  if (!o || !o.durabMax || o.stats.some((s) => s[0] === 'durabilidad_infinita') || o.durab <= 0) return;
  o.durab -= 1;
  if (o.durab === 3) msg(j, [`${o.nombre[0]} está por romperse. Repáralo con el herrero.`, `${o.nombre[1]} is about to break. Have the smith repair it.`], '#ffb040');
  if (o.durab <= 0) { o.durab = 0; msg(j, [`¡${o.nombre[0]} se rompió! Ya no sirve hasta repararlo.`, `${o.nombre[1]} broke! It is useless until repaired.`], '#ff5040'); sonar(j, 'negado'); recalc(j); }
}
export function recalc(j: Juego) {
  const h = j.heroe;
  const b: Record<string, number> = {};
  for (const bf of Object.values(h.buffs)) for (const [k, v] of Object.entries(bf.bonos ?? {})) b[k] = (b[k] ?? 0) + v;
  const vidaPct = h.vidaMax ? h.vida / h.vidaMax : 1;
  h.c = calcular(h.d, b);
  h.vidaMax = h.c.vidaMax;
  h.vida = Math.min(h.vidaMax, Math.max(h.muerto ? 0 : 1, vidaPct * h.vidaMax));
  h.mana = Math.min(h.mana, h.c.manaMax);
}

// ------------------------------------------------------------------ proyectiles
function disparar(j: Juego, de: Ent, tx: number, ty: number, g: Golpe, efectoId: string, vel: number, o: Partial<Proyectil> = {}) {
  // fogonazo en la mano del héroe (uno por cuadro aunque sea un abanico)
  const lz = de === j.heroe ? LUZ_EFECTO[efectoId]?.lanzar : undefined;
  if (lz) { const fs: any[] = ((j as any).fogonazos ??= []); if (!fs.some((f) => f.t === 0)) fs.push({ t: 0, dur: lz.cuadros / 25, r: lz.radio, k: lz.intensidad, id: efectoId }); }
  const dx = tx - de.x, dy = ty - de.y, l = Math.hypot(dx, dy) || 1;
  j.proyectiles.push({ x: de.x + (dx / l) * 0.5, y: de.y + (dy / l) * 0.5, z: 34, vx: (dx / l) * vel, vy: (dy / l) * vel, vida: o.vida ?? (g.deHeroe ? 2.2 : Math.min(2.2, 11 / vel)), dano: [g.min, g.max], elem: g.elem, deHeroe: g.deHeroe, perfora: false, explota: 0, efecto: efectoId, golpeados: new Set(), buscador: false, radio: 0.5, t: 0, fuente: g.fuente, ...o });
}

// ------------------------------------------------------------------ habilidades del héroe
export function habilidadDe(id: string): Habilidad { return id === 'ataque' ? ATAQUE : HABILIDADES.find((h) => h.id === id) ?? ATAQUE; }
export function costoMana(j: Juego, hb: Habilidad) { const n = Math.max(1, nivelHab(j.heroe.d, hb.id, j.heroe.c)); return Math.max(0, hb.mana[0] + hb.mana[1] * (n - 1)); }
export function danoHab(j: Juego, hb: Habilidad, n: number): [number, number] {
  if (!hb.dano) return [0, 0];
  const h = j.heroe;
  // nivel del héroe: el daño de la tabla es el del nivel en que se aprende y de ahí sigue la curva del arma
  let k = poderNivel(h.d.nivel) / poderNivel(hb.nivelReq);
  // nivel de la habilidad: lineal
  k *= 1 + ESCALA_HECHIZOS.lineal * hb.dano[2] * (n - 1);
  // sinergias: se suman y tienen tope
  let sin = 0;
  for (const [sid, pct] of hb.sinergias ?? []) sin += pct * (h.d.habs[sid] ?? 0);
  k *= 1 + Math.min(ESCALA_HECHIZOS.topeSinergia, sin) / 100;
  // % del elemento (pasivas, objetos) y % de daño de hechizos del equipo, sumados
  k *= 1 + ((hb.elem === 'fuego' ? h.c.fuego_pct : bono(h, hb.elem + '_pct')) + bono(h, 'dano_hechizos')) / 100;
  // resonancia: cada carga del mismo elemento suma daño
  if (h.d.clase === 'arcanista' && !CONSUME_CARGAS.has(hb.id)) { const c = h.cargas.filter((e) => e === hb.elem).length; k *= 1 + c * (6 + bono(h, 'resonancia')) / 100; }
  // la energía da un poco de poder a los hechizos
  if (hb.anim === 'lanzar') k *= 1 + j.heroe.c.ene / 400;
  return [Math.round(hb.dano[0] * k), Math.round(hb.dano[1] * k)];
}
const val = (b: [number, number] | undefined, n: number) => (b ? b[0] + b[1] * (n - 1) : 0);
function golpeArma(j: Juego, mult: number, elemHab?: Elemento, extraHab?: [number, number]): Golpe {
  const h = j.heroe, c = h.c;
  const extra: Partial<Record<Elemento, number>> = { ...c.elem };
  if (h.buffs.aura_llama) extra.fuego = (extra.fuego ?? 0) + (h.buffs.aura_llama.bonos.dano_fuego ?? 0);
  if (extraHab && elemHab) extra[elemHab] = (extra[elemHab] ?? 0) + entre(extraHab[0], extraHab[1]);
  const fk = h.d.clase === 'berserker' ? 1 + (h.furia / 100) * (15 + bono(h, 'furia_dano')) / 100 : 1;
  return { min: c.dano[0] * mult * fk, max: c.dano[1] * mult * fk, elem: 'fisico', precision: c.precision, critico: c.critico, robo: c.robo_vida, aturdir: c.aturdir, aplastar: c.golpe_aplastante, herida: c.herida_abierta, lento: c.ralentizar, deHeroe: true, fuente: h, extra, arma: true };
}
/** Velocidad de ataque/lanzamiento: duración de la animación. */
const PASO_CLASE: Record<string, number> = { monje: 1.07, cazadora: 1.05, arcanista: 1.0, alquimista: 1.0, druida: 1.0, nigromante: 0.98, berserker: 0.98, templario: 0.95 };
export const durAtaque = (h: Heroe) => clamp(0.62 / (1 + h.c.vel_ataque / 100), 0.25, 1);
export const durLanzar = (h: Heroe) => clamp(0.6 / (1 + h.c.vel_lanzar / 100), 0.25, 1);
const rangoMelee = (h: Heroe) => (h.c.tipoArma === 'lanza' || h.c.tipoArma === 'alabarda' || h.c.tipoArma === 'guadana' ? 2.0 : 1.4);
export const esDistancia = (j: Juego, hb: Habilidad) => hb.tipo !== 'golpe' && hb.tipo !== 'salto' && hb.tipo !== 'carga' && hb.tipo !== 'torbellino' ? true : false;

/** Intenta usar una habilidad hacia (tx,ty) / objetivo. Devuelve si empezó la acción. */
/**
 * Usa una habilidad hacia (tx, ty). Con alAire (clic derecho o Shift + clic) un golpe cuerpo a cuerpo se da en el sitio:
 * le pega a quien esté al alcance hacia el cursor, o al aire si no hay nadie, sin caminar.
 */
export function usarHabilidad(j: Juego, id: string, tx: number, ty: number, obj: Monstruo | null, alAire = false): boolean {
  fxInvocar = null;
  (globalThis as any).__usos?.push(id);
  const h = j.heroe;
  if (h.muerto || h.acc === 'atacar' || h.acc === 'lanzar' || h.salto) return false;
  if (j.zona.tipo === 'pueblo') return false;
  const hb = habilidadDe(id);
  // el ataque básico con arco o ballesta dispara
  const basico = id === 'ataque';
  if (hb.tipo === 'pasiva') return false;
  const n = basico ? 1 : nivelHab(h.d, id, h.c);
  if (!basico && n <= 0) return false;
  // auras: solo una activa a la vez; usarla la vuelve el aura activa
  if (hb.tipo === 'aura') { if (h.d.aura !== id) { h.d.aura = id; sonar(j, 'luz'); } return false; }
  if ((h.recargas[id] ?? 0) > 0) { letrero(j, h, [`Recargando ${Math.ceil(h.recargas[id])} s`, `Recharging ${Math.ceil(h.recargas[id])} s`], '#c0c0c0'); return false; }
  // requisitos de las mecánicas de clase
  if (hb.forma) {
    const ok = hb.forma === 'lobo' ? !!h.buffs.forma_lobo : hb.forma === 'oso' ? !!h.buffs.forma_oso : !!(h.buffs.forma_lobo || h.buffs.forma_oso);
    if (!ok) { aviso(j, hb.forma === 'lobo' ? ['Solo puedo hacerlo como lobo.', 'I can only do that as a wolf.'] : hb.forma === 'oso' ? ['Solo puedo hacerlo como oso.', 'I can only do that as a bear.'] : ['Tengo que estar transformado.', 'I must be transformed.']); return false; }
  }
  if (hb.furia && h.furia < hb.furia) { aviso(j, ['Necesito más furia.', 'I need more fury.'], '#ff8060'); letrero(j, h, [`Furia ${Math.floor(h.furia)} de ${hb.furia}`, `Fury ${Math.floor(h.furia)} of ${hb.furia}`], '#ff8060'); return !alAire && !!obj && usarHabilidad(j, 'ataque', tx, ty, obj, alAire); }
  // (Rick, 20 nov 2026: "no me funciona la habilidad". Sin cargas se negaba con un aviso y parecía rota: ahora sin cargas
  // dispara un rayo prismático simple, y con cargas uno de cada elemento guardado, más fuerte)
  if (hb.id === 'picada' && !mios(j, 'halcon').length) { aviso(j, ['Mi halcón no está conmigo.', 'My hawk is not with me.']); return false; }
  const conFrascos = hb.tipo === 'bomba' && h.d.clase === 'alquimista' && !h.buffs.panacea_negra;
  if (conFrascos && h.frascos < 1) { aviso(j, ['No me quedan frascos.', 'I have no flasks left.'], '#ffb040'); return false; }
  const costo = basico ? 0 : costoMana(j, hb);
  if (h.mana < costo) { if ((h.avisos.mana ?? -99) < j.t - 1.5) { h.avisos.mana = j.t; sonar(j, 'mana_falta'); msg(j, ['No tengo suficiente maná.', 'Not enough mana.'], '#8080ff'); } letrero(j, h, ['Sin maná', 'No mana'], '#8090ff');
    // un golpe de arma que no se puede pagar sale igual como golpe normal: el botón nunca se queda sin hacer nada
    return hb.tipo === 'golpe' && !basico ? usarHabilidad(j, 'ataque', tx, ty, obj, alAire) : false; }
  const melee = hb.tipo === 'golpe' && !(basico && h.c.distancia);
  if (melee) {
    const alcanza = (m: Monstruo) => dist(h.x, h.y, m.x, m.y) <= rangoMelee(h) + m.radio;
    if (alAire) {
      if (obj && !alcanza(obj)) obj = null;
      // sin nadie bajo el cursor: el enemigo al alcance más cercano a la dirección del cursor
      if (!obj) {
        const a0 = Math.atan2(ty - h.y, tx - h.x); let mejor = 1.1;
        for (const m of j.monstruos) {
          if (m.muerto || m.dueno || m.estado === 'surgir' || !alcanza(m)) continue;
          let da = Math.abs(Math.atan2(m.y - h.y, m.x - h.x) - a0); if (da > Math.PI) da = Math.PI * 2 - da;
          if (da < mejor) { mejor = da; obj = m; }
        }
      }
    } else {
      if (!obj) return false;
      if (!alcanza(obj)) return false;
    }
  }
  if (hb.id === 'golpe_escudo' && !h.d.equipo.izq) { aviso(j, ['Necesito un escudo.', 'I need a shield.']); return false; }
  h.mana -= costo;
  if (hb.recarga) h.recargas[id] = hb.recarga;
  if (hb.tipo === 'bomba' && h.d.clase === 'alquimista') {
    const usa = hb.id === 'gran_crisol' ? Math.floor(h.frascos) : 1;
    (h as any).frascosUsados = hb.id === 'gran_crisol' && !conFrascos ? frascosMax(h) : usa;
    if (conFrascos) h.frascos = Math.max(0, h.frascos - usa);
  }
  h.dir = dirDe(tx - h.x, ty - h.y);
  const anim = basico ? 'atacar' : hb.anim;
  h.acc = anim; h.t = 0; h.golpeo = false;
  h.dur = anim === 'atacar' ? durAtaque(h) : durLanzar(h);
  // el golpe cae en el cuadro de impacto de la animación de la clase
  h.golpeEn = h.dur * golpeEnClase(h.d.clase, anim);
  // combo de la clase (el monje pega tres veces en su ataque): solo en golpes directos cuerpo a cuerpo de un impacto
  const gs = melee && anim === 'atacar' && !hb.explota && (Math.round(val(hb.n, basico ? 1 : Math.max(1, nivelHab(h.d, id, h.c)))) || 1) === 1 ? golpesClase(h.d.clase, anim) : undefined;
  (h as any).combo3 = gs ? { i: 0, t: gs.map((f) => f * h.dur), remate: false } : null;
  h.habActual = id;
  (h as any).tx = tx; (h as any).ty = ty; (h as any).tobj = obj;
  h.camino = null; h.destino = null;
  // (las formas del druida suenan al cambiar, con los huesos y el aullido o el rugido: el rugido de jefe al empezar a lanzar se
  // pisaba con ellos)
  if (!basico && hb.sonido && hb.anim === 'lanzar' && !(hb.id.startsWith('forma_') && !(globalThis as any).__sinFormas)) sonar(j, hb.sonido);
  else sonar(j, h.c.distancia && (basico || hb.tipo === 'proyectil') ? (h.c.tipoArma === 'ballesta' ? 'virote' : 'flecha') : 'tajo');
  return true;
}

/** Monje: suma un paso al combo. Devuelve true si este golpe es el remate. */
function pasoCombo(j: Juego, hb: Habilidad): boolean {
  const h = j.heroe;
  if (j.t - h.combo.t > ventanaCombo(h) && !h.buffs.loto_dorado) h.combo.paso = 0;
  h.combo.paso += hb.id === 'puno_eco' ? 2 : 1; h.combo.t = j.t;
  if (hb.id === 'puno_dios') h.combo.paso = 3;
  if (h.combo.paso >= 3) { h.combo.paso = 0; return true; }
  return false;
}
const EFECTO_REMATE: Partial<Record<Elemento, string>> = { fuego: 'explosion_fuego', frio: 'nova_escarcha', rayo: 'trueno', luz: 'castigo', fisico: 'onda_aterrizaje' };
function rematar(j: Juego, x: number, y: number, hb: Habilidad, mult: number) {
  const h = j.heroe, g = golpeArma(j, 0.6 * Math.max(1, mult));
  const veces = hb.id === 'puno_dios' ? 3 : 1;
  // (sexta pasada) la onda triple del Puño de dios la dibuja render/poderes_vivos.ts en el piso (tres aros de rayo que
  // corren): antes eran tres columnas de trueno horneadas apiladas sobre el blanco y lo dejaban en blanco puro
  const ondaViva = hb.id === 'puno_dios' && !(globalThis as any).__blancoQuinta;
  for (let k = 0; k < veces; k++) j.areas.push({ x, y, radio: 2.4 + k * 1.4, dano: [g.min, g.max], elem: hb.elem === 'sangre' ? 'fisico' : hb.elem, t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: ondaViva ? '' : EFECTO_REMATE[hb.elem] ?? 'onda_aterrizaje', retraso: 0.01 + k * 0.18, hab: hb.id });
  j.numeros.push({ x: h.x, y: h.y, z: 80, txt: j.idi ? 'Finisher!' : '¡Remate!', color: '#ffd060', t: 0, grande: true });
  j.sacudida = Math.max(j.sacudida, 0.3);
}
// ------------------------------------------------------------------ Thor
/** Tramo de armadura de Thor (0 solo collar, 5 la barda azul y oro de la Casa GG): por nivel o por su barda propia. */
export const TRAMOS_THOR = [1, 6, 15, 30, 50, 75];
export function tramoThor(d: DatosHeroe): number {
  let t = 0; for (let i = 0; i < TRAMOS_THOR.length; i++) if (d.nivel >= TRAMOS_THOR[i]) t = i;
  return Math.max(t, d.thor?.barda ?? 0);
}
/**
 * Cómo se ve Thor: lo que lleva puesto. Sin barda va a pelo, con su collar; con barda, la armadura de esa barda.
 * (Antes el aspecto salía del mayor entre su nivel y la barda: como por nivel ya iba armado, ponerle una barda no
 * cambiaba nada a la vista. La fuerza sigue saliendo de tramoThor: no pierde nada por ir sin barda.)
 */
export const aspectoThor = (d: DatosHeroe): number => Math.max(0, Math.min(5, d.thor?.barda ?? 0));
/** El sprite de Thor según su tramo; mientras no llegue el de la Forja, un lobo teñido de leonado. */
export function spriteThor(tramo: number): { sprite: string; tinte?: string; escala: number } {
  const m: any = manifiesto()?.m ?? {};
  for (const id of [`thor_${tramo}`, 'thor']) if (m[`${id}/quieto/s`]) return { sprite: id, escala: 1 };
  return { sprite: 'lobo_sombrio', tinte: '#b07838', escala: 1.05 };
}
const conCollar = (h: Heroe) => Object.values(h.d.equipo).some((o) => o && (o as any).unico === 'collar_de_thor' || (o as any)?.nombre?.[0] === 'Collar de Thor');
/** Stats de Thor: suben con el nivel del héroe, su tramo de armadura y el Collar de Thor del Legado GG. */
function statsThor(j: Juego, m: Monstruo) {
  const h = j.heroe, n = h.d.nivel, tr = tramoThor(h.d), col = conCollar(h) ? 1.3 : 1;
  const st = (id: string) => (h.d.thor?.collar?.stats ?? []).filter(([k2]) => k2 === id).reduce((a, [, v]) => a + v, 0);
  const k = (1 + tr * 0.12) * col * (1 + h.c.invocados_pct / 200);
  // después del 40 Thor escala más rápido: al 80 pega cerca de la mitad del ataque básico del héroe
  const tarde = 1 + Math.max(0, n - 40) * 0.012;
  const kd = (1 + st('thor_dano') / 100) * tarde, kv = 1 + st('thor_vida') / 100;
  const pct = m.vidaMax ? m.vida / m.vidaMax : 1;
  m.vidaMax = Math.round((70 + n * 24) * k * kv); m.vida = Math.max(1, Math.round(m.vidaMax * pct));
  m.dano = [(3 + n * 1.0) * k * kd, (5 + n * 1.7) * k * kd];
  m.vel = 5.2 * (col > 1 ? 1.1 : 1) * (1 + st('thor_vel') / 100);
  (m as any).firmaCollar = h.d.thor?.collar?.uid ?? 0;
  (m as any).nivelThor = n; (m as any).tramoThor = tr; (m as any).collarThor = col;
  (m as any).aspectoThor = aspectoThor(h.d);
  const sp = spriteThor(aspectoThor(h.d)); m.def = { ...m.def, sprite: sp.sprite }; m.tinte = sp.tinte; m.escala = sp.escala;
}
function crearThor(j: Juego): Monstruo {
  const h = j.heroe, sp = spriteThor(aspectoThor(h.d));
  const base = MONSTRUOS.lobo_sombrio;
  const def: DefMonstruo = { ...base, id: 'thor', sprite: sp.sprite, nombre: ['Thor', 'Thor'], vida: 70, dano: [4, 8], vel: 5.2, ia: 'normal', xp: 0, jefe: false, res: {} };
  const q = libreCerca(j.zona, h.x + 1, h.y + 1);
  const m = crearMonstruo(def, h.d.nivel, q[0] + 0.5, q[1] + 0.5, 0, 0);
  m.tipo = 'invocado'; m.dueno = true; m.invocaId = 'thor'; m.estado = 'deambular';
  m.vidaMax = 0; statsThor(j, m); m.vida = m.vidaMax;
  (m as any).cdLadrido = 4;
  j.monstruos.push(m);
  return m;
}
export const thorDe = (j: Juego) => j.monstruos.find((m) => m.dueno && m.invocaId === 'thor' && !m.muerto) ?? null;
/** Cada cuadro: que Thor esté, que suba con el héroe, que vuelva tras descansar, y su ladrido protector. */
function actualizarThor(j: Juego, dt: number) {
  const h = j.heroe; const t = (h.d.thor ??= {});
  if (t.descanso && t.descanso > 0) { t.descanso -= dt; if (j.zona.tipo === 'pueblo') t.descanso = 0; if (t.descanso > 0) return; }
  let m = thorDe(j);
  if (!m) { if (h.muerto) return; m = crearThor(j); efecto(j, 'circulo_invocacion', m.x, m.y, 0, 0.6); return; }
  if ((m as any).nivelThor !== h.d.nivel || (m as any).tramoThor !== tramoThor(h.d) || (m as any).collarThor !== (conCollar(h) ? 1.3 : 1) || (m as any).firmaCollar !== (h.d.thor?.collar?.uid ?? 0) || (m as any).aspectoThor !== aspectoThor(h.d)) statsThor(j, m);
  // ladrido protector: escudo para el héroe cuando está en apuros o rodeado
  (m as any).cdLadrido -= dt;
  if ((m as any).cdLadrido <= 0 && !h.muerto) {
    const cerca = j.monstruos.filter((o) => !o.muerto && !o.dueno && dist(o.x, o.y, h.x, h.y) < 6).length;
    if (h.vida < h.vidaMax * 0.5 || cerca >= 3) {
      (m as any).cdLadrido = 14;
      const escudo = Math.round(h.vidaMax * (0.12 + tramoThor(h.d) * 0.02) * ((m as any).collarThor ?? 1));
      h.escudoHueso = Math.max(h.escudoHueso, escudo);
      const conEsp = !!(manifiesto() as any)?.m?.[`${m.def.sprite}/especial/s`];
      if (conEsp) { m.acc = 'especial' as any; m.t = 0; m.dur = 0.9; }
      efecto(j, 'grito_guerra', m.x, m.y, 0, 1.1);
      j.numeros.push({ x: m.x, y: m.y, z: 60, txt: j.idi ? 'Woof!' : '¡Guau!', color: '#9ec8ff', t: 0, grande: true });
      sonar(j, 'grunido', m.x, m.y, 0.8);
    } else (m as any).cdLadrido = 1;
  }
}

/**
 * Thor sigue al héroe sin trabarse: arranca a más de 3.2 celdas y frena a menos de 2.2 (histéresis), con al menos 0.2 s en cada
 * estado; la velocidad sube y baja suave (~0.25 s); va a un punto detrás y a un lado del héroe, rodeando obstáculos con el mismo
 * camino que los monstruos; y la dirección solo cambia si el rumbo pasa el sector vecino por más de 8°.
 */
function seguirThor(j: Juego, m: Monstruo, dh: number, dt: number) {
  const h = j.heroe, t = m as any;
  t.tEst = (t.tEst ?? 0) + dt; t.vAct ??= 0; t.lado ??= m.id % 2 ? 1 : -1;
  // a dónde ir: detrás del héroe según hacia dónde mira (o hacia dónde camina), y un poco a su lado
  const [fx, fy] = DIR_VEC[h.dir] ?? [0, 1];
  const tx0 = h.x - fx * 1.7 + -fy * t.lado * 1.0, ty0 = h.y - fy * 1.7 + fx * t.lado * 1.0;
  // el punto se mueve suave (~0.4 s): si el héroe se da vuelta, Thor no lo rodea dando tumbos
  const [px0, py0] = pasable(j.zona, tx0, ty0) ? [tx0, ty0] : [h.x, h.y];
  t.ptx ??= px0; t.pty ??= py0; const kp = Math.min(1, dt / 0.4); t.ptx += (px0 - t.ptx) * kp; t.pty += (py0 - t.pty) * kp;
  const [tx, ty] = pasable(j.zona, t.ptx, t.pty) ? [t.ptx, t.pty] : [px0, py0];
  const dObj = Math.hypot(tx - m.x, ty - m.y);
  if (!t.sigue && dh > 3.2 && t.tEst > 0.2) { t.sigue = true; t.tEst = 0; }
  else if (t.sigue && (dh < 2.2 || dObj < 0.4) && t.tEst > 0.2) { t.sigue = false; t.tEst = 0; }
  if (dh > 20) { const q = libreCerca(j.zona, tx, ty); m.x = q[0] + 0.5; m.y = q[1] + 0.5; t.vAct = 0; t.camino = null; return; }
  const galopa = h.acc === 'correr' || dh > 7;
  const vDes = t.sigue ? m.vel * (dh > 6 ? 1.75 : galopa ? 1.45 : 1.1) : 0;
  t.vAct += (vDes - t.vAct) * Math.min(1, dt / 0.25);
  if (t.vAct < 0.05 && !t.sigue) { t.vAct = 0; if ((m.acc === 'caminar' || (m.acc as string) === 'correr') && t.tEst > 0.2) m.acc = 'quieto'; return; }
  // rodear: si no hay línea libre, el camino de los monstruos (se recalcula cada medio segundo)
  let gx = tx, gy = ty;
  if (!lineaLibre(j.zona, m.x, m.y, tx, ty)) {
    t.tCam = (t.tCam ?? 0) - dt;
    if (!t.camino || t.tCam <= 0) { t.camino = buscarCamino(j.zona, m.x, m.y, tx, ty, 1500); t.tCam = 0.5; }
    while (t.camino?.length && Math.hypot(t.camino[0][0] + 0.5 - m.x, t.camino[0][1] + 0.5 - m.y) < 0.5) t.camino.shift();
    if (t.camino?.length) { gx = t.camino[0][0] + 0.5; gy = t.camino[0][1] + 0.5; }
  } else t.camino = null;
  const dirAntes = m.dir;
  moverHacia(j, m, gx, gy, t.vAct, dt);
  // dirección con histéresis: el rumbo tiene que pasarse del sector actual en más de 8°
  const ang = Math.atan2(gy - m.y, gx - m.x), [cx, cy] = DIR_VEC[dirAntes] ?? [0, 1];
  let dif = Math.abs(ang - Math.atan2(cy, cx)); if (dif > Math.PI) dif = Math.PI * 2 - dif;
  m.dir = dif > (22.5 + 8) * Math.PI / 180 ? dirDe(gx - m.x, gy - m.y) : dirAntes;
  const acc = galopa ? 'correr' : 'caminar';
  if (m.acc !== acc && (t.tEst > 0.2 || m.acc === 'quieto')) { m.acc = acc as any; }
}

/** Invoca un aliado. tVida: si es temporal (no cuenta para el máximo). */
/** Cómo aparece cada invocación (pixelfx): [efecto, escala, duración, demora]. */
const FX_INVOCAR: Record<string, [string, number, number?, number?]> = {
  alzar_esqueleto: ['pfx:fx_grieta_invocacion', 0.8], mago_hueso: ['pfx:fx_grieta_invocacion', 0.8], sabueso_osario: ['pfx:fx_grieta_invocacion', 0.8], marcha_fosa: ['pfx:fx_grieta_invocacion', 0.8],
  golem_sangre: ['pfx:fx_surge_del_piso', 1], legion_ceniza: ['pfx:fx_grieta_invocacion', 0.6],
  invocar_lobo: ['pfx:fx_torbellino_hojas', 1, 1.2], oso_espiritu: ['pfx:fx_torbellino_hojas', 1.4, 1.2], espiritu_guardian: ['pfx:fx_torbellino_hojas', 1, 1.2], despertar_bosque: ['pfx:fx_torbellino_hojas', 1, 1.2],
  llamar_halcon: ['pfx:fx_plumas', 1],
};
let fxInvocar: [string, number, number?, number?] | null = null, fxPaso = 0;
/** Cuando un invocado se va o muere: el ánima de los no muertos y el humo de los de la naturaleza. */
function despedidaInvocado(j: Juego, m: Monstruo) {
  if (m.invocaId === 'thor') return;
  const natural = /lobo|oso|halcon|arbol|espiritu/.test(m.invocaId ?? '');
  efecto(j, natural ? 'pfx:fx_humareda' : 'pfx:fx_alma_sube', m.x, m.y, 0, natural ? 1 : 0.8, 0, 3);
}
function crearInvocado(j: Juego, invId: string, n: number, x: number, y: number, tVida?: number, extra = 1): Monstruo | null {
  const h = j.heroe, inv = INVOCADOS[invId]; if (!inv) return null;
  if (!pasable(j.zona, x, y)) { const q = libreCerca(j.zona, x, y); x = q[0] + 0.5; y = q[1] + 0.5; }
  const kk = (1 + n * 0.15) * (1 + h.c.invocados_pct / 100) * extra;
  const def: DefMonstruo = { ...(MONSTRUOS[inv.sprite] ?? MONSTRUOS.esqueleto), id: invId, sprite: inv.sprite, vida: inv.vida, dano: inv.dano, vel: inv.vel, ia: inv.distancia ? 'distancia' : 'normal', proyectil: inv.proyectil, rango: inv.distancia ? 7 : undefined, elem: (inv.elem as Elemento) ?? 'fisico', tinte: inv.tinte, escala: inv.escala, res: {}, xp: 0, jefe: false };
  const m = crearMonstruo(def, h.d.nivel, x, y, 0, 0);
  m.tipo = 'invocado'; m.dueno = true; m.invocaId = invId; m.estado = 'deambular';
  m.vidaMax = m.vida = Math.round(inv.vida * kk * (1 + h.d.nivel * 0.12)); m.dano = [inv.dano[0] * kk * danoInvocadoNivel(h.d.nivel), inv.dano[1] * kk * danoInvocadoNivel(h.d.nivel)];
  m.tinte = inv.tinte; m.escala = inv.escala ?? 1; m.tVida = tVida;
  // (quinta pasada) el Oso espíritu ya no es el ogro teñido: se pinta con el oso pardo (la ficha, la huella y el golpe
  // siguen siendo los del ogro, y la escala también: el peso del golpe sale de ella). Con `__sinFormas` vuelve el de antes
  if (inv.aspecto && !(globalThis as any).__sinFormas) { m.def = { ...m.def, sprite: inv.aspecto }; m.tinte = undefined; }
  // (solo lo que se ve: render/presencias.ts) cuándo nació y de qué poder; los muertos y el gólem suben del piso armándose
  // (la muerte al revés, como los que surgen), las bestias y los espíritus toman cuerpo
  (m as any).nace = j.t; (m as any).habInv = habEnCurso ?? undefined;
  if (/esqueleto|arquero|sabueso|golem/.test(invId)) { (m as any).surgiendo = 0.75; (m as any).surgeT = 0.75; }
  j.monstruos.push(m);
  // cómo aparece: lo que pide la habilidad que lo llama (pixelfx), o el círculo de siempre
  if (fxInvocar) { const [id, esc, dur, t0] = fxInvocar; j.efectos.push({ id, x, y, t: -(t0 ?? 0) - fxPaso * 0.1, dir: 0, escala: esc, z: 0, dur: (dur ?? 2.5) + (t0 ?? 0) + fxPaso * 0.1, ...(habEnCurso ? { hab: habEnCurso } : {}) } as Efecto); fxPaso++; }
  else efecto(j, 'circulo_invocacion', x, y, 0, 0.8);
  return m;
}
const golpeSimple = (j: Juego, d: [number, number], elem: Elemento): Golpe => ({ min: d[0], max: d[1], elem, deHeroe: true, fuente: j.heroe, sinFallo: true });
const enRadio = (j: Juego, x: number, y: number, r: number) => enemigosDe(j, true).filter((e) => dist(e.x, e.y, x, y) <= r + e.radio) as Monstruo[];
const esJefe = (e: Ent) => !!(e as Monstruo).def?.jefe;

/** Lo que pasa en el cuadro del golpe. */
/** Daño de cada golpe de un combo de tres: 30 %, 30 % y 40 %. */
const REPARTO_COMBO = [0.3, 0.3, 0.4];
/** Reparte un daño entero entre los golpes del combo por resto mayor: la suma es exacta y, con 3 o más, cada golpe hace al menos 1. Con menos de 3, todo va en el último. */
export function repartirCombo(T: number): number[] {
  const n = REPARTO_COMBO.length;
  if (T < n) return REPARTO_COMBO.map((_, i) => (i === n - 1 ? T : 0));
  const ideal = REPARTO_COMBO.map((f) => f * T), sh = ideal.map(Math.floor);
  let falta = T - sh.reduce((a, b) => a + b, 0);
  const orden = ideal.map((v, i) => [v - Math.floor(v), i] as [number, number]).sort((a, b) => b[0] - a[0] || b[1] - a[1]);
  for (let k = 0; falta > 0; k = (k + 1) % n, falta--) sh[orden[k][1]]++;
  // nadie en 0: el que más tiene le pasa uno
  for (let i = 0; i < n; i++) if (sh[i] < 1) { const d = sh.indexOf(Math.max(...sh)); sh[d]--; sh[i]++; }
  return sh;
}
// ------------------------------------------------------------------ de quién es cada golpe (solo visual, no se guarda)
/** El poder del héroe que está pegando ahora y desde dónde llega el golpe: `efecto` y `danar` lo anotan para que
 * render/poderes_vivos.ts sepa de qué poder es cada efecto y cada golpe (la sangre del Desgarro, las astillas de la flecha). */
let habEnCurso: string | null = null, deDonde: [number, number] | null = null;
/** Un latido del aura activa donde toca a alguien (solo visual: render/presencias.ts). */
function pulsoAura(j: Juego, x: number, y: number, k: string) { const l = ((j as any).pulsosAura ??= []) as unknown[]; if (l.length < 12) l.push({ x, y, k }); }
function resolverHabilidad(j: Juego, parte?: number, cb?: { remate: boolean }) {
  const a0 = j.areas.length, hab0 = habEnCurso, de0 = deDonde; habEnCurso = j.heroe.habActual; deDonde = [j.heroe.x, j.heroe.y];
  try { resolverHabilidad0(j, parte, cb); } finally { habEnCurso = hab0; deDonde = de0; }
  for (let i = a0; i < j.areas.length; i++) j.areas[i].hab ??= j.heroe.habActual;
}
function resolverHabilidad0(j: Juego, parte?: number, cb?: { remate: boolean }) {
  const h = j.heroe;
  const id = h.habActual, hb = habilidadDe(id), basico = id === 'ataque';
  const n = basico ? 1 : Math.max(1, nivelHab(h.d, id, h.c));
  const tx: number = (h as any).tx, ty: number = (h as any).ty;
  const obj: Monstruo | null = (h as any).tobj;
  const mult = (hb.mult ? val(hb.mult, n) : 100) / 100;
  const dh = danoHab(j, hb, n);
  const golpes = Math.round(val(hb.n, n)) || 1;
  const prec = (hb.bonos?.precision ? val(hb.bonos.precision, n) : 0);
  const efectoDir = DIRS.indexOf(h.dir);
  // el efecto que la habilidad declara en el lanzador (pies del héroe)
  { const up = !basico ? usosPfx.hab.get(id) : undefined; if (up?.lanzador && parte === undefined) efecto(j, 'pfx:' + up.lanzador, h.x, h.y, 0, 1); }
  const reembolso = () => { h.mana += costoMana(j, hb); if (hb.recarga) h.recargas[hb.id] = 0; };
  // gritos del berserker: dan furia
  if (h.d.clase === 'berserker' && hb.rama === 1 && !basico) ganarFuria(j, 12 + bono(h, 'furia_grito'));
  switch (hb.tipo) {
    case 'golpe': {
      if (basico && h.c.distancia) { const g = golpeArma(j, 1); disparar(j, h, tx, ty, g, h.c.tipoArma === 'ballesta' ? 'virote' : 'flecha', 16, { perfora: R() * 100 < h.c.perforar }); break; }
      if (!obj || obj.muerto) break;
      // en un combo, el paso del monje se cuenta una vez (en el primer golpe) y vale para los tres
      let remate: boolean;
      if (parte === undefined) remate = h.d.clase === 'monje' && pasoCombo(j, hb);
      else { if (parte === 0 && cb) cb.remate = h.d.clase === 'monje' && pasoCombo(j, hb); remate = !!cb?.remate; }
      const kRem = remate ? 1.5 + bono(h, 'combo_pct') / 100 : 1;
      const kFur = hb.id === 'ejecucion' ? 1 + h.furia / 100 : 1;
      let total = 0;
      for (let k = 0; k < golpes; k++) {
        let g: Golpe;
        if (parte === undefined || !cb) g = golpeArma(j, mult * kRem * kFur, hb.elem !== 'fisico' ? hb.elem : undefined, hb.dano ? dh : undefined);
        else {
          // combo: el golpe entero se tira una sola vez (daño y crítico) en el primero y se reparte exacto entre los tres
          const c3 = cb as any;
          if (parte === 0 || !c3.g) {
            const g0 = golpeArma(j, mult * kRem * kFur, hb.elem !== 'fisico' ? hb.elem : undefined, hb.dano ? dh : undefined);
            c3.g = g0; c3.T = Math.max(1, Math.round(entre(g0.min, g0.max))); c3.sh = repartirCombo(c3.T); c3.crit = R() * 100 < (g0.critico ?? 0);
          }
          const sh: number = c3.sh[parte] ?? 0;
          // con menos de 3 de daño todo va en el último: los anteriores son solo el impacto, sin número
          if (sh <= 0) { sonar(j, 'golpe_carne', obj.x, obj.y, 0.4, 1.15); obj.sacud = { dx: (obj.x - h.x) || 1, dy: obj.y - h.y, t: j.t, k: 0.5 }; { const l = Math.hypot(obj.sacud.dx, obj.sacud.dy) || 1; obj.sacud.dx /= l; obj.sacud.dy /= l; } continue; }
          const ex: Partial<Record<Elemento, number>> = {}; for (const [e, v] of Object.entries(c3.g.extra ?? {})) if (v) ex[e as Elemento] = (v as number) * (sh / c3.T);
          g = { ...c3.g, min: sh, max: sh, critico: c3.crit ? 100 : 0, extra: ex, parte };
        }
        if (prec) g.precision! += prec;
        if (hb.bonos?.aturdir) g.aturdir = 100;
        if (hb.bonos?.empuje) g.empuje = 1;
        if (hb.id === 'ejecucion' && obj.vida < obj.vidaMax * 0.25 && obj.calidad < 3) { g.min *= 3; g.max *= 3; }
        const d = danar(j, obj, g);
        total += d;
        if (d > 0) ganarFuria(j, 5);
        // el berserker vive de pegar: cada golpe normal que conecta le devuelve un poco de maná para su próximo golpe especial
        if (d > 0 && basico && h.d.clase === 'berserker') h.mana = Math.min(h.c.manaMax, h.mana + 1.5);
        if (R() < 0.04) desgastar(j, 'arma');
        if (d > 0 && h.c.vivo) particulas(j, obj.x, obj.y, 8, h.c.vivo === 'fuego' ? 'brasa' : 'chispa', COLOR_ELEM[h.c.vivo], 1.2, 40);
      }
      if (hb.bonos?.robo_golpe && total > 0) h.vida = Math.min(h.vidaMax, h.vida + total * val(hb.bonos.robo_golpe, n) / 100);
      if (hb.id === 'corte_sello' && total > 0) { h.buffs.aura_avivada = { t: val(hb.duracion, n), bonos: { potencia_aura: val(hb.bonos?.potencia_aura, n) }, hab: 'corte_sello' }; recalc(j); }
      // en un combo, el efecto y el remate van una sola vez: con el último golpe, o con el que mata
      const fin = parte === undefined || parte >= REPARTO_COMBO.length - 1 || obj.muerto;
      if (fin && !basico && hb.efecto) efecto(j, efectoDe(hb.efecto, hb.elem, hb), obj.x, obj.y, efectoDir);
      if (hb.explota) { j.areas.push({ x: obj.x, y: obj.y, radio: hb.explota, dano: [dh[0] * kRem, dh[1] * kRem], elem: hb.elem, t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: '', retraso: 0 }); if (hb.id !== 'puno_dios' || (globalThis as any).__blancoQuinta) efecto(j, hb.elem === 'luz' ? 'castigo' : hb.elem === 'rayo' ? 'trueno' : hb.elem === 'fisico' ? 'onda_aterrizaje' : hb.elem === 'frio' ? 'nova_escarcha' : hb.elem === 'veneno' ? 'nube_veneno' : hb.elem === 'sombra' ? 'estallido_cadaver' : 'explosion_fuego', obj.x, obj.y, 0, hb.explota / 2); }   // (a quemarropa el virote de escarcha o de veneno reventaba en fuego)
      if (remate && fin) { rematar(j, obj.x, obj.y, hb, mult); if (cb) cb.remate = false; }
      break;
    }
    case 'proyectil': {
      // el blanco pudo moverse mientras duraba el gesto: se apunta a donde está ahora, no a donde estaba al empezar
      const vivo = obj && !obj.muerto ? obj : null;
      const base = vivo ? Math.atan2(vivo.y - h.y, vivo.x - h.x) : Math.atan2(ty - h.y, tx - h.x);
      if (hb.id === 'descarga_prismatica') {
        const guardadas = gastarCargas(h), cs = guardadas.length ? guardadas : ['rayo' as Elemento];
        const k = guardadas.length ? 1 + cs.length * 0.25 : 0.8;
        cs.forEach((e, i) => {
          const a = base + (i - (cs.length - 1) / 2) * 0.22;
          disparar(j, h, h.x + Math.cos(a) * 5, h.y + Math.sin(a) * 5, golpeSimple(j, [dh[0] * k, dh[1] * k], e), e === 'fuego' ? 'bola_fuego' : e === 'frio' ? 'saeta_hielo' : 'chispa_cargada', 12, { explota: hb.explota ?? 0, hab: hb, nivelHab: n, vida: 1.6 });
        });
        efecto(j, 'destello_teleporte', h.x, h.y, 0, 0.7);
        break;
      }
      const cnt = golpes;
      const circ = !!hb.circulo;
      const abanico = circ ? Math.PI * 2 : cnt > 1 ? Math.min(hb.id === 'tormenta_virotes' ? 1.6 : 1.2, 0.18 * cnt) : 0;
      // con un abanico contra un jefe grande todas las flechas le daban al mismo: ahora la primera pega entera y las demás al 60 %
      const salva = cnt > 1 && !circ && !hb.buscador ? new Map<number, number>() : undefined;
      for (let k = 0; k < cnt; k++) {
        const a = cnt === 1 ? base : circ ? base + (k / cnt) * Math.PI * 2 : base - abanico / 2 + (abanico * k) / (cnt - 1);
        const g: Golpe = hb.mult ? golpeArma(j, mult, hb.elem !== 'fisico' ? hb.elem : undefined, hb.dano ? dh : undefined) : { min: dh[0], max: dh[1], elem: hb.elem, deHeroe: true, fuente: h, sinFallo: true };
        if (prec && g.precision !== undefined) g.precision += prec;
        disparar(j, h, h.x + Math.cos(a) * 5, h.y + Math.sin(a) * 5, g, efectoDe(hb.efecto, hb.elem, hb, true), hb.vel ?? 12, { perfora: !!hb.perfora || R() * 100 < h.c.perforar, explota: hb.explota ?? 0, buscador: !!hb.buscador, hab: hb, nivelHab: n, vida: hb.id === 'martillo_bendito' ? 2.4 : hb.id === 'orbe_glacial' ? 1.4 : 1.6, rebota: hb.id === 'chispa' ? 1 : 0, salva, guia: cnt === 1 && !circ && hb.id !== 'martillo_bendito' ? vivo : null, radio: hb.explota ? 0.75 : 0.5 });
      }
      break;
    }
    case 'nova': {
      const r = hb.radio ?? 4;
      let d0: [number, number] = dh, congela = 0;
      if (hb.mult) { const fu = h.furia; h.furia = 0; const g = golpeArma(j, mult * (1 + fu / 50)); d0 = [g.min, g.max]; }
      if (hb.id === 'edad_hielo') { const u = gastarCargas(h, 'frio').length; d0 = [d0[0] * (1 + 0.35 * u), d0[1] * (1 + 0.35 * u)]; congela = 2 + 0.6 * u; }
      efecto(j, efectoDe(hb.efecto, hb.elem, hb), h.x, h.y, 0, r / 4);
      let total = 0;
      for (const e of enRadio(j, h.x, h.y, r)) {
        total += danar(j, e, { ...golpeSimple(j, d0, hb.elem), aturdir: hb.bonos?.aturdir ? 60 : 0 });
        if (congela && !esJefe(e)) e.congelado = congela;
        if (hb.id === 'canto_invierno' && !esJefe(e)) e.miedo = val(hb.duracion, n);
        // la descarga de rayo alrededor del héroe salta a cada uno con su arco (antes solo se veía el campo en el piso)
        if (hb.elem === 'rayo' && lineaLibre(j.zona, h.x, h.y, e.x, e.y)) arcoCadena(j, h, e, e.x, e.y);
      }
      if (hb.id === 'rio_carmesi') h.vida = Math.min(h.vidaMax, h.vida + Math.min(total * 0.4, h.vidaMax * 0.5));
      if (hb.id === 'canto_invierno') ganarFuria(j, 100);
      if (hb.id === 'rugido_primigenio') { for (const m of mios(j)) m.vida = Math.min(m.vidaMax, m.vida + m.vidaMax * 0.3); h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * 0.15); }
      if (hb.elem === 'sangre') particulas(j, h.x, h.y, 24, 'sangre', '#a00810', 2, 20);
      j.sacudida = Math.max(j.sacudida, hb.definitiva ? 0.6 : 0.2);
      break;
    }
    case 'area': {
      const r = hb.radio ?? 3;
      let ax = tx, ay = ty;
      if (dist(ax, ay, h.x, h.y) > 12) { const a = Math.atan2(ty - h.y, tx - h.x); ax = h.x + Math.cos(a) * 12; ay = h.y + Math.sin(a) * 12; }
      if (hb.enHeroe) { ax = h.x; ay = h.y; }
      const dur = val(hb.duracion, n) || 0.1;
      const golpeArea = (x: number, y: number, rr: number, d: [number, number], ef: string, retraso: number, elem: Elemento = hb.elem, caida = false) => j.areas.push({ x, y, radio: rr, dano: d, elem, t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: ef, retraso, caida });
      // ---- cadáveres
      if (hb.id === 'explosion_cadaver') {
        const cad = cadaveresCerca(j, ax, ay, 4)[0];
        if (!cad) { aviso(j, ['No hay un cadáver cerca.', 'No corpse nearby.']); reembolso(); break; }
        usarCadaver(cad);
        // (solo lo que se ve) el muerto se hincha 0,18 s y revienta: el golpe cae cuando revienta
        const k = cad.vidaMax * 0.5; (cad as any).revienta = j.t + 0.18; cad.tMuerto = 598;
        golpeArea(cad.x, cad.y, r, [dh[0] + k * 0.6, dh[1] + k], 'estallido_cadaver', 0.18, 'fuego');
        j.sacudida = 0.3;
        break;
      }
      if (hb.id === 'cosecha_osario') {
        const cads = cadaveresCerca(j, ax, ay, 6).slice(0, Math.round(val(hb.n, n)));
        if (!cads.length) { aviso(j, ['No hay cadáveres cerca.', 'No corpses nearby.']); reembolso(); break; }
        cads.forEach((cad, i) => { usarCadaver(cad); const k = cad.vidaMax * 0.4, rt = 0.16 + i * 0.22; (cad as any).revienta = j.t + rt; cad.tMuerto = 598; golpeArea(cad.x, cad.y, r, [dh[0] + k * 0.6, dh[1] + k], 'estallido_cadaver', rt, 'fuego'); });
        j.sacudida = 0.4;
        break;
      }
      if (hb.id === 'lamento_osario') {
        cadaveresCerca(j, h.x, h.y, r).forEach((cad, i) => { usarCadaver(cad); (cad as any).revienta = j.t + 0.01 + i * 0.08; cad.tMuerto = 598; golpeArea(cad.x, cad.y, 2.5, dh, 'prision_hueso', 0.01 + i * 0.08); });
        const cn = Math.round(val(hb.n, n));
        for (let k = 0; k < cn; k++) { const a = (k / cn) * Math.PI * 2; disparar(j, h, h.x + Math.cos(a) * 5, h.y + Math.sin(a) * 5, golpeSimple(j, [dh[0] * 0.5, dh[1] * 0.5], 'sombra'), 'lanza_hueso', 13, { perfora: true, vida: 1.2 }); }
        efecto(j, 'llanto_animas', h.x, h.y, 0, 1.3);
        j.sacudida = 0.5;
        break;
      }
      if (hb.id === 'festin_tumba') {
        const cad = cadaveresCerca(j, ax, ay, 4)[0];
        if (!cad) { aviso(j, ['No hay un cadáver cerca.', 'No corpse nearby.']); reembolso(); break; }
        usarCadaver(cad); (cad as any).revienta = j.t + ((globalThis as any).__festinViejo ? 0.32 : 0.65); (cad as any).consume = true; cad.tMuerto = 598;
        h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * val(hb.bonos?.cura_pct, n) / 100);
        h.mana = Math.min(h.c.manaMax, h.mana + h.c.manaMax * val(hb.bonos?.mana_pct_cura, n) / 100);
        efecto(j, 'estallido_cadaver', cad.x, cad.y, 0, 0.6); efecto(j, 'chispas_curacion', h.x, h.y);
        if (!(globalThis as any).__festinViejo) sonar(j, 'festin', cad.x, cad.y, 0.9); // (sexta pasada: el sorbo y el latido húmedo)
        particulas(j, cad.x, cad.y, 14, 'sangre', '#600808', 1.2);
        break;
      }
      if (hb.id === 'ofrenda') {
        const ms = mios(j).filter((m) => dist(m.x, m.y, ax, ay) < 5);
        if (!ms.length) { aviso(j, ['No tengo siervos cerca de ahí.', 'I have no servants near there.']); reembolso(); break; }
        ms.forEach((m, i) => { golpeArea(m.x, m.y, r, [dh[0] + m.vidaMax * 0.3, dh[1] + m.vidaMax * 0.5], 'estallido_cadaver', 0.01 + i * 0.12, 'sombra'); m.vida = 0; m.muerto = true; m.acc = 'morir'; m.t = 0; m.tMuerto = 0; });
        j.sacudida = 0.4;
        break;
      }
      // ---- halcón
      if (hb.id === 'picada') {
        const hal = mios(j, 'halcon')[0];
        if (hal) { hal.x = ax; hal.y = ay; }
        efecto(j, 'tajo_garras', ax, ay, 0, 1.3);
        for (const e of enRadio(j, ax, ay, r)) { danar(j, e, golpeSimple(j, dh, 'fisico')); e.marca = Math.max(e.marca ?? 0, 6); }
        break;
      }
      // ---- cargas del arcanista
      if (hb.id === 'meteoro' || hb.id === 'sol_negro') {
        let d = dh;
        const sol = hb.id === 'sol_negro';
        if (sol) { const u = gastarCargas(h, 'fuego').length; d = [dh[0] * (1 + 0.35 * u), dh[1] * (1 + 0.35 * u)]; }
        // pixelfx: el meteoro trae su roca y su impacto (pega a los 0.64 s); el sol negro es un agujero negro y una explosión
        // oscura a los 0.34 s (sin brasas naranjas). Después, en los dos, el cráter que sigue ardiendo
        const pega = sol ? 0.34 : 0.64;
        j.areas.push({ x: ax, y: ay, radio: r, dano: d, elem: 'fuego', t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: 'meteoro', retraso: pega, caida: true, fxCaida: sol ? 'pfx:fx_explosion_oscura' : '', escCaida: 1.4 });
        j.areas.push({ x: ax, y: ay, radio: r * 0.8, dano: [d[0] * 0.15, d[1] * 0.15], elem: 'fuego', t: 0, dur, tick: 0.5, prox: 0, deHeroe: true, efecto: 'crater_ardiente', retraso: pega + 0.1 });
        if (sol) efecto(j, 'pfx:fx_agujero_negro', ax, ay, 0, 1.2, 0, 0.9); else efecto(j, 'pfx:fx_meteoro', ax, ay, 0, 1, 0, 3.8);
        break;
      }
      if (hb.id === 'furia_firmamento') {
        const u = gastarCargas(h, 'rayo').length;
        const cn = Math.round(val(hb.n, n)) + u * 3;
        const blancos = enRadio(j, h.x, h.y, r);
        for (let k = 0; k < cn; k++) {
          const e = blancos.length ? blancos[k % blancos.length] : null;
          const a = R() * Math.PI * 2, rr = R() * r * 0.7;
          golpeArea(e ? e.x : h.x + Math.cos(a) * rr, e ? e.y : h.y + Math.sin(a) * rr, 1.4, dh, 'relampago', 0.05 + k * 0.1, 'rayo');
        }
        sonar(j, 'trueno'); j.sacudida = 0.5;
        break;
      }
      if (hb.id === 'lluvia_flechas') { const g = golpeArma(j, mult); j.areas.push({ x: ax, y: ay, radio: r, dano: [g.min * 0.5, g.max * 0.5], elem: 'fisico', t: 0, dur, tick: 0.3, prox: 0.2, deHeroe: true, efecto: 'lluvia_flechas', retraso: 0.2 }); break; }
      // la Combustión: el aire donde apuntas chupa el calor y a los 0,2 s revienta (el dibujo entero está en
      // render/poderes_vivos.ts: implosión, fogonazo, bola de fuego de Doom, onda, pedazos y el piso que sigue ardiendo).
      // Antes era el anillo de fuego del piso que tardaba casi 4 s: no se leía como un estallido (Rick, 19 nov 2026)
      if (hb.id === 'combustion') {
        efecto(j, 'combustion', ax, ay, 0, Math.max(0.8, Math.min(1.5, r / 2.2)), 0, 2.4);
        j.areas.push({ x: ax, y: ay, radio: r, dano: dh, elem: 'fuego', t: 0, dur: 0.1, tick: 1, prox: 0, deHeroe: true, efecto: '', retraso: 0.2, caida: true, fxCaida: '', quemar: r * 0.7, congela: 0.05 });
        break;
      }
      // ---- varios golpes repartidos (columnas, rayos, rocas)
      if (hb.n) {
        const cn = Math.round(val(hb.n, n));
        const roca = hb.efecto === 'meteoro';
        for (let k = 0; k < cn; k++) {
          const a = R() * Math.PI * 2, rr = R() * r * 0.85;
          golpeArea(ax + Math.cos(a) * rr, ay + Math.sin(a) * rr, roca ? 2 : 1.6, dh, roca ? 'crater_ardiente' : efectoDe(hb.efecto, hb.elem, hb), (roca ? 0.4 : 0.05) + k * (roca ? 0.25 : 0.15), hb.elem, roca);
        }
        break;
      }
      // el cerco de llamas del arcanista: anillo de fuego de Doom, y con 10 puntos o más el muro del infierno
      const efA = hb.id === 'muro_fuego' ? (n >= 10 ? 'muro_infierno' : 'cerco_llamas') : efectoDe(hb.efecto, hb.elem, hb);
      j.areas.push({ x: ax, y: ay, radio: r, dano: [dh[0] / Math.max(1, dur * 2), dh[1] / Math.max(1, dur * 2)], elem: hb.elem, t: 0, dur, tick: 0.5, prox: 0, deHeroe: true, efecto: efA, retraso: 0.1 });
      break;
    }
    case 'cadena': {
      const rebotes = (hb.rebota ?? 3) + Math.floor(n / 4);
      efecto(j, 'pfx:fx_carga_rayo', h.x, h.y, 0, 0.8, 0, 0.35); particulas(j, h.x, h.y, 8, 'chispa', '#fff6a0', 1.2, 40);
      // el primer salto sale de la mano: el blanco tiene que verse desde el héroe (Rick, 19 nov 2026: el rayo cruzaba
      // muros). Si apuntó a uno tapado, va al más cercano al clic que sí se ve, sin pasar del alcance de la pantalla
      const blanco: Ent | null = obj && !obj.muerto && dist(h.x, h.y, obj.x, obj.y) <= ALCANCE_CADENA && lineaLibre(j.zona, h.x, h.y, obj.x, obj.y) ? obj : masCercano(j, tx, ty, 8, new Set(), h, ALCANCE_CADENA);
      if (!blanco) {
        // sin nadie a tiro el rayo cae a tierra donde se apuntó (antes no salía nada y el maná se iba igual): hasta 7
        // casillas, y si un muro lo para, cae de este lado
        let gx = tx, gy = ty; const d = dist(h.x, h.y, gx, gy); if (d > 7) { gx = h.x + ((gx - h.x) * 7) / d; gy = h.y + ((gy - h.y) * 7) / d; }
        for (let k = 0; k < 30 && !lineaLibre(j.zona, h.x, h.y, gx, gy); k++) { gx = h.x + (gx - h.x) * 0.88; gy = h.y + (gy - h.y) * 0.88; }
        arcoCadena(j, h, null, gx, gy);
        efecto(j, 'impacto_rayo', gx, gy, 0, 0.45);
        break;
      }
      // salto a salto, uno cada 0,06 s: se ve el rayo ir de uno a otro (antes salían todos en el mismo cuadro)
      const c: Cadena = { desde: h, blanco, golpeados: new Set(), rebotes, dh, t: 0, n: 0, zona: j.zona.id };
      saltoCadena(j, c);
      if (c.blanco) ((j as any).cadenas ??= []).push(c);
      break;
    }
    case 'invocar': {
      const invId = hb.invoca!; if (!INVOCADOS[invId]) break;
      // pixelfx de la aparición, por habilidad (escalonados de a 0.1 s si salen varios)
      fxPaso = 0;
      fxInvocar = FX_INVOCAR[hb.id] ?? null;
      if (hb.id === 'legion_ceniza') efecto(j, 'pfx:fx_circulo_conjuro', h.x, h.y, 0, 1.2, 0, 2.5);
      // temporales: marcha de la fosa, legión de la ceniza, despertar del bosque
      if (hb.id === 'marcha_fosa') {
        const cads = cadaveresCerca(j, tx, ty, hb.radio ?? 6).slice(0, Math.floor(val(hb.max, n)));
        if (!cads.length) { aviso(j, ['No hay cadáveres cerca.', 'No corpses nearby.']); reembolso(); break; }
        cads.forEach((cad, i) => { usarCadaver(cad); crearInvocado(j, i % 2 ? 'arquero' : 'esqueleto', n, cad.x, cad.y, val(hb.duracion, n)); });
        break;
      }
      if (hb.id === 'legion_ceniza') {
        const cn = Math.floor(val(hb.max, n));
        for (let k = 0; k < cn; k++) { const a = (k / cn) * Math.PI * 2; crearInvocado(j, k % 2 ? 'arquero' : 'esqueleto', n, h.x + Math.cos(a) * 2, h.y + Math.sin(a) * 2, val(hb.duracion, n), 1.5); }
        j.sacudida = 0.4;
        break;
      }
      if (hb.id === 'despertar_bosque') {
        for (const m of mios(j, 'arbol')) { m.vida = 0; m.muerto = true; m.acc = 'morir'; m.t = 0; }
        crearInvocado(j, 'arbol', n, tx, ty, val(hb.duracion, n), 1.3);
        efecto(j, 'estallido_enredaderas', h.x, h.y, 0, 2);
        for (const e of enRadio(j, h.x, h.y, hb.radio ?? 6)) { if (!esJefe(e)) { e.congelado = 1.5; (e as any).preso = 'raices'; } e.maldicion = { amplificar: 0, debilitar: 0, lento: 60, t: 6, res: 0, sinHumo: true } as any; }
        break;
      }
      const max = Math.max(1, Math.floor(val(hb.max, n)));
      const fijos = mios(j, invId).filter((m) => m.tVida === undefined);
      let x = tx, y = ty;
      if (hb.id === 'alzar_esqueleto' || hb.id === 'mago_hueso') {
        const cad = cadaveresCerca(j, tx, ty, 5)[0];
        if (!cad) { aviso(j, ['Necesito un cadáver.', 'I need a corpse.']); reembolso(); break; }
        usarCadaver(cad); x = cad.x; y = cad.y;
      }
      if (hb.id === 'llamar_halcon') { x = h.x + 0.5; y = h.y + 0.5; }
      if (fijos.length >= max) { const viejo = fijos[0]; viejo.vida = 0; viejo.muerto = true; viejo.acc = 'morir'; viejo.t = 0; }
      crearInvocado(j, invId, n, x, y);
      break;
    }
    case 'buff': {
      const dur = val(hb.duracion, n);
      const bonos: Record<string, number> = {};
      for (const [k, b] of Object.entries(hb.bonos ?? {})) bonos[k] = val(b, n);
      if (hb.id === 'armadura_hueso') { h.escudoHueso = bonos.escudo_hueso ?? 20; }
      if (hb.id === 'tempestad') h.tempestad = dur;
      if (bonos.huracan) { h.huracan = dur; h.huracanHab = hb.id; }
      if (hb.id === 'forma_lobo') delete h.buffs.forma_oso;
      if (hb.id === 'forma_oso') delete h.buffs.forma_lobo;
      if (bonos.cura_pct) { h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * bonos.cura_pct / 100); delete bonos.cura_pct; particulas(j, h.x, h.y, 12, 'chispa', '#80ff90', 0.6, 40); }
      if (hb.id === 'destilar') h.frascos = frascosMax(h);
      if (hb.id === 'ira_jarl') {
        const g = golpeArma(j, mult);
        for (const e of enRadio(j, h.x, h.y, hb.radio ?? 4.5)) danar(j, e, { ...g, sinFallo: true, aturdir: 50 });
        h.furia = 100; h.furiaFija = dur; h.tCombate = j.t;
        efecto(j, 'onda_aterrizaje', h.x, h.y, 0, 2); j.sacudida = 0.7; sonar(j, 'golpe_metal');
      }
      if ((hb.id === 'coro_sellos' || hb.id === 'ascenso_espiritu') && hb.dano) {
        for (const e of enRadio(j, h.x, h.y, hb.radio ?? 6)) danar(j, e, golpeSimple(j, dh, 'luz'));
        efecto(j, 'pilar_luz', h.x, h.y, 0, 1.4); efecto(j, 'castigo', h.x, h.y, 0, 2); j.sacudida = 0.4;
      }
      if (hb.id === 'caceria_salvaje') for (const e of enRadio(j, h.x, h.y, hb.radio ?? 9)) e.marca = Math.max(e.marca ?? 0, dur);
      h.buffs[hb.id] = { t: dur, bonos, hab: hb.id };
      efecto(j, efectoDe(hb.efecto, hb.elem, hb), h.x, h.y, 0, 1);
      recalc(j);
      break;
    }
    case 'grito': {
      efecto(j, 'grito_guerra', h.x, h.y, 0, 1.2);
      const r = hb.radio ?? 5;
      for (const e of enemigosDe(j, true)) if (dist(e.x, e.y, h.x, h.y) <= r && !(e as Monstruo).def.jefe) e.miedo = val(hb.duracion, n);
      break;
    }
    case 'maldicion': {
      const r = hb.radio ?? 3, dur = val(hb.duracion, n) * (1 + bono(h, 'maldicion_dur') / 100);
      const cx = hb.enHeroe ? h.x : tx, cy = hb.enHeroe ? h.y : ty;
      const ef = hb.efecto === 'raices' ? 'estallido_enredaderas' : hb.elem === 'frio' ? 'nova_escarcha' : hb.elem === 'veneno' ? 'nube_veneno' : hb.efecto === 'onda' ? 'grito_guerra' : 'prision_hueso';
      // cada maldición con lo suyo: antes las seis de sombra levantaban la misma jaula de costillas. La jaula queda para
      // las dos que son de hueso (Jaula de costillas y Condena del osario); las demás llevan su sello, su reloj, sus
      // tentáculos o su robo de vida, puestos sobre cada maldito
      const propio = MALDICION_PFX[hb.id];
      // (la jaula de hueso es del nigromante: la Marca de presa de la cazadora y las demás de otras clases no la levantan)
      if (ef !== 'prision_hueso' ? true : propio ? !!propio.jaula : hb.clase === 'nigromante') efecto(j, ef, cx, cy, 0, r / 3);
      else if (!propio) { const ar = usosPfx.hab.get(hb.id)?.area; if (ar) efecto(j, 'pfx:' + ar, cx, cy, 0, Math.min(1.2, r / 3)); }
      if (propio?.piso) efecto(j, 'pfx:' + propio.piso, cx, cy, 0, Math.min(1.4, r / 3));
      const b = hb.bonos ?? {};
      const maldice = !!(b.amplificar || b.debilitar || b.lento || b.res || b.sifon || b.condena);
      for (const e of enRadio(j, cx, cy, r)) {
        const m = e;
        if (b.marca) m.marca = Math.max(m.marca ?? 0, val(b.marca, n));
        if (b.congelar && !esJefe(m)) { m.congelado = Math.max(m.congelado, val(hb.duracion, n)); if (hb.elem !== 'frio') (m as any).preso = hb.clase === 'druida' || hb.efecto === 'raices' ? 'raices' : 'hueso'; }
        if (maldice) m.maldicion = { amplificar: val(b.amplificar, n), debilitar: val(b.debilitar, n), lento: val(b.lento, n), t: dur, res: -val(b.res, n), sifon: b.sifon ? val(b.sifon, n) : undefined, condena: !!b.condena };
        if (b.miedo && !esJefe(m)) m.miedo = dur;
        if (propio?.blanco) efecto(j, 'pfx:' + propio.blanco, m.x, m.y, 0, 0.9, 0, propio.dur);
        if (hb.dano) danar(j, m, golpeSimple(j, dh, hb.elem));
      }
      break;
    }
    case 'teleporte': {
      let x = tx, y = ty;
      if (!pasable(j.zona, x, y)) { const q = libreCerca(j.zona, x, y); x = q[0] + 0.5; y = q[1] + 0.5; }
      if (dist(x, y, h.x, h.y) > 14) { const a = Math.atan2(y - h.y, x - h.x); x = h.x + Math.cos(a) * 14; y = h.y + Math.sin(a) * 14; if (!pasable(j.zona, x, y)) { const q = libreCerca(j.zona, x, y); x = q[0] + 0.5; y = q[1] + 0.5; } }
      efecto(j, 'destello_teleporte', h.x, h.y); h.x = x; h.y = y; efecto(j, 'destello_teleporte', h.x, h.y);
      sonar(j, 'teletransporte');
      break;
    }
    case 'carga': case 'salto': {
      let x = obj && !obj.muerto ? obj.x : tx, y = obj && !obj.muerto ? obj.y : ty;
      const a = Math.atan2(y - h.y, x - h.x), dd = Math.min(hb.tipo === 'salto' ? 8 : 10, dist(x, y, h.x, h.y));
      x = h.x + Math.cos(a) * Math.max(0, dd - (obj ? 0.8 : 0)); y = h.y + Math.sin(a) * Math.max(0, dd - (obj ? 0.8 : 0));
      if (!pasable(j.zona, x, y)) { const q = libreCerca(j.zona, x, y); x = q[0] + 0.5; y = q[1] + 0.5; }
      h.salto = { x0: h.x, y0: h.y, x1: x, y1: y, t: 0, T: hb.tipo === 'salto' ? 0.45 : 0.3, hab: hb };
      (h as any).saltoN = n; (h as any).saltoMult = mult;
      break;
    }
    case 'torbellino': {
      h.torbellino = 1.6; (h as any).torbN = n; (h as any).torbMult = mult; (h as any).torbDir = [tx, ty];
      h.camino = null; h.destino = [tx, ty];
      break;
    }
    case 'bomba': {
      const usados = (h as any).frascosUsados ?? 1;
      let d = dh, radio = (hb.radio ?? 2) * (1 + bono(h, 'bomba_radio') / 100);
      if (hb.id === 'gran_crisol') { d = [dh[0] * (1 + 0.25 * usados), dh[1] * (1 + 0.25 * usados)]; radio *= 1 + 0.06 * usados; }
      j.proyectiles.push({ x: h.x, y: h.y, z: 30, vx: 0, vy: 0, vida: 9, dano: d, elem: hb.elem, deHeroe: true, perfora: false, explota: radio, efecto: 'frasco', golpeados: new Set(), buscador: false, radio: 0.4, t: 0, arco: { x0: h.x, y0: h.y, x1: tx, y1: ty, t: 0, T: 0.6, n: hb.id === 'bomba_cluster' ? Math.round(val(hb.n, n)) : 0 }, hab: hb, nivelHab: n });
      break;
    }
    case 'trampa': {
      const minaR = hb.explota;
      const nueva = (x: number, y: number, elem: Elemento = hb.elem, ef = efectoDe(hb.efecto, hb.elem, hb)): Torreta => ({ x, y, t: 0, dur: val(hb.duracion, n), dano: dh, cd: 0.5, hab: hb.id, elem, mina: minaR, raiz: !!hb.bonos?.congelar, efecto: ef });
      if (hb.id === 'coto_caza') {
        j.torretas = j.torretas.filter((t) => t.hab !== hb.id);
        const cn = Math.round(val(hb.n, n));
        for (let k = 0; k < cn; k++) { const a = (k / cn) * Math.PI * 2; let x = tx + Math.cos(a) * 2.6, y = ty + Math.sin(a) * 2.6; if (!pasable(j.zona, x, y)) { const q = libreCerca(j.zona, x, y); x = q[0] + 0.5; y = q[1] + 0.5; } j.torretas.push(nueva(x, y, k % 2 ? 'rayo' : 'fuego', k % 2 ? 'campo_estatico' : 'explosion_fuego')); efecto(j, 'glifo_trampa', x, y, 0, 0.7); }
        break;
      }
      const max = Math.floor(val(hb.max, n)) || 1;
      const propias = j.torretas.filter((t) => (t.hab ?? 'torreta') === hb.id);
      if (propias.length >= max) j.torretas.splice(j.torretas.indexOf(propias[0]), 1);
      j.torretas.push(nueva(tx, ty));
      efecto(j, 'glifo_trampa', tx, ty);
      break;
    }
    case 'cuervos': {
      const cn = Math.round(val(hb.n, n));
      for (let k = 0; k < cn; k++) j.cuervos.push({ x: h.x, y: h.y, t: 0, dur: val(hb.duracion, n), dano: dh, objetivo: null, ang: (k / cn) * Math.PI * 2, marca: hb.id === 'cielo_halcones' });
      break;
    }
  }
  // arcanista: cada hechizo de fuego, escarcha o rayo guarda una carga
  if (h.d.clase === 'arcanista' && !basico && hb.anim === 'lanzar' && (hb.elem === 'fuego' || hb.elem === 'frio' || hb.elem === 'rayo') && !CONSUME_CARGAS.has(hb.id)) {
    h.cargas.push(hb.elem); if (h.cargas.length > MAX_CARGAS) h.cargas.shift();
  }
}
const EFECTOS: Record<string, string> = {
  fuego: 'saeta_fuego', fuego_grande: 'bola_fuego', hielo: 'saeta_hielo', orbe_hielo: 'saeta_hielo', chispa: 'chispa_cargada', rayo: 'relampago', hueso: 'lanza_hueso',
  luz: 'castigo', columna_luz: 'pilar_luz', veneno: 'nova_veneno', nube_veneno: 'nube_veneno', flecha: 'flecha', virote: 'virote', llamas_suelo: 'muro_llamas', ventisca: 'ventisca',
  nova_hielo: 'nova_escarcha', nova_viento: 'tornado', onda: 'grito_guerra', polvo: 'onda_aterrizaje', tajo: 'chispas_carne', sangre: 'salpicadura_sangre', meteoro: 'meteoro',
  martillo: 'castigo', jabalina: 'chispa_cargada', viento: 'tornado', tornado: 'tornado', torbellino: 'torbellino', cadaver: 'estallido_cadaver', invocar: 'circulo_invocacion',
  aura_roja: 'aura_furia', aura_azul: 'escudo_divino', aura_gris: 'escudo_divino', aura_verde: 'chispas_curacion', aura_fuego: 'aura_furia', aura_morada: 'aura_sagrada', huesos_giran: 'prision_hueso', raices: 'estallido_enredaderas',
  maldicion: 'maldicion_sombra', lluvia_flechas: 'lluvia_flechas', cuervos: 'tajo_garras',
};
/** El efecto propio de cada maldición de sombra: lo que cae sobre cada maldito, lo que se dibuja en el piso y si lleva la jaula. */
const MALDICION_PFX: Record<string, { blanco?: string; piso?: string; jaula?: boolean; dur?: number }> = {
  jaula_costillas: { jaula: true, piso: 'fx_manos_que_agarran' }, condena_osario: { jaula: true, piso: 'fx_circulo_conjuro' },
  amplificar: { blanco: 'fx_maldicion' }, debilidad: { blanco: 'fx_explosion_oscura' }, terror: { piso: 'fx_tentaculos_sombra', blanco: 'fx_maldicion' },
  sifon_vida: { blanco: 'fx_robo_vida' }, huesos_vidrio: { blanco: 'fx_sello_maleficio' }, decrepitud: { blanco: 'fx_reloj_detenido' },
};
export function efectoDe(e: string, elem: Elemento, hb?: Habilidad, proyectil = false): string {
  // pixelfx: el efecto que la Forja asignó a esta habilidad (las flechas, virotes y el tornado siguen con los suyos)
  const up = hb && usosPfx.hab.get(hb.id);
  if (up && !/flecha|virote|tornado/.test(EFECTOS[e] ?? e)) { const id = proyectil ? up.proy : up.area ?? up.proy; if (id) return 'pfx:' + id; }
  if (hb?.id === 'marea_roja' || hb?.id === 'rio_carmesi') return 'nova_sangre';
  // proyectiles de luz o martillo y de veneno: las saetas nuevas de la Forja
  if (proyectil && (e === 'luz' || e === 'martillo')) return 'saeta_sagrada';
  if (proyectil && e === 'veneno') return 'saeta_veneno';
  if (e === 'flecha' && elem === 'fuego') return 'flecha_fuego';
  if (e === 'flecha' && elem === 'frio') return 'flecha_hielo';
  return EFECTOS[e] ?? e;
}
/** El enemigo más cercano a (x, y) que se ve desde ahí (o desde `desde`, si el tiro sale de otro lado, y a no más de `max` de él). */
function masCercano(j: Juego, x: number, y: number, r: number, salvo: Set<number>, desde?: { x: number; y: number }, max = Infinity): Ent | null {
  let best: Ent | null = null, bd = r; const ox = desde?.x ?? x, oy = desde?.y ?? y;
  for (const m of enemigosDe(j, true)) { if (salvo.has(m.id) || m.muerto) continue; const d = dist(m.x, m.y, x, y); if (d < bd && dist(m.x, m.y, ox, oy) <= max && lineaLibre(j.zona, ox, oy, m.x, m.y)) { bd = d; best = m; } }
  return best;
}

// ------------------------------------------------------------------ el Rayo saltarín, salto a salto
/** Hasta dónde busca el primer blanco desde el héroe (casillas: lo que entra en la pantalla). */
const ALCANCE_CADENA = 13;
/** Segundos entre un salto y el siguiente. */
const PASO_CADENA = 0.06;
interface Cadena { desde: Ent; blanco: Ent | null; golpeados: Set<number>; rebotes: number; dh: [number, number]; t: number; n: number; zona: string }
const altoPecho = (e: Ent) => 30 * Math.max(0.8, Math.min(2.5, (e as any).escala ?? 1));
/** Un arco del rayo: sigue a los dos cuerpos que une mientras dura (lo mueve `actualizar`); `a` null cae a tierra en (x2, y2). */
function arcoCadena(j: Juego, de: Ent, a: Ent | null, x2: number, y2: number) {
  const mano = de === j.heroe;
  j.efectos.push({ id: 'arco_cadena', x: de.x, y: de.y, t: 0, dir: 0, escala: 1, z: 0, dur: a ? 0.42 : 0.34, x2, y2, de, a, deMano: mano, za: mano ? 44 : altoPecho(de), zb: a ? altoPecho(a) : 0, suelo: !a, sem: Math.floor(R() * 1e6) } as Efecto);
}
function saltoCadena(j: Juego, c: Cadena) {
  const b = c.blanco!;
  arcoCadena(j, c.desde, b, b.x, b.y);
  danar(j, b, { min: c.dh[0], max: c.dh[1], elem: 'rayo', deHeroe: true, fuente: j.heroe, sinFallo: true });
  // el estallido horneado solo en el primero: en cada salto tapaba el arco con una bola blanca (la estrella del arco y
  // el cuerpo electrocutado ya dicen dónde pegó)
  if (!c.n) efecto(j, 'impacto_rayo', b.x, b.y, 0, 0.6);
  if (c.n) sonar(j, 'rayo', b.x, b.y, 0.3);
  c.golpeados.add(b.id); c.desde = b; c.n++; c.t = PASO_CADENA;
  c.blanco = c.rebotes-- > 0 ? masCercano(j, b.x, b.y, 6, c.golpeados) : null;
}
function seguirCadenas(j: Juego, dt: number) {
  const cs = (j as any).cadenas as Cadena[] | undefined; if (!cs?.length) return;
  for (const c of cs) {
    if (c.zona !== j.zona.id) { c.blanco = null; continue; }
    c.t -= dt; if (c.t > 0 || !c.blanco) continue;
    // si el que seguía ya cayó (lo mató otro), busca otro cerca de donde va
    if (c.blanco.muerto) c.blanco = masCercano(j, c.desde.x, c.desde.y, 6, c.golpeados);
    if (c.blanco) saltoCadena(j, c);
  }
  (j as any).cadenas = cs.filter((c) => c.blanco);
}

// ------------------------------------------------------------------ actualización
export function actualizar(j: Juego, dt: number) {
  { const fs: any[] = (j as any).fogonazos; if (fs?.length) { for (const f of fs) f.t += dt; (j as any).fogonazos = fs.filter((f) => f.t < f.dur); } }
  // pausa de impacto: el mundo casi se detiene unas centésimas cuando un golpe conecta
  if ((j.congela ?? 0) > 0) { j.congela = Math.max(0, j.congela! - dt); dt *= 0.06; }
  j.t += dt;
  const h = j.heroe;
  actualizarHeroe(j, dt);
  actualizarThor(j, dt);
  for (const m of j.monstruos) actualizarMonstruo(j, m, dt);
  // (entrega 10, tercera vuelta) nadie queda pegado al muro: el que no avanza (quieto, esperando, pegando, empujado por otro o
  // por un golpe) no pasaba por `apartarDeMuros` y podía quedar a 0,1 de la roca (a1_mina1, a2_tumbas1)
  if (!(globalThis as any).__esquinaVieja) for (const m of j.monstruos) if (!m.muerto) apartarDeMuros(j.zona, m);
  actualizarTrampas(j, dt);
  // charcos que crecen bajo los muertos y rastro de sangre del que huye herido
  for (const mc of j.manchas) { if (mc.forma === 'charco' && mc.t < 10) mc.t += dt; if (mc.rmax && mc.r < mc.rmax) mc.r = Math.min(mc.rmax, mc.r + (mc.rmax - mc.r) * dt * 0.45 + dt * 0.02); }
  // la caída de un jefe: dos segundos de estallidos sobre el cuerpo, y al final la onda que barre la sala y la lluvia de sangre
  { const cs: any[] | undefined = (j as any).caidas;
    if (cs?.length) {
      const EST: Record<string, string> = { fuego: 'explosion_fuego', frio: 'estallido_esquirlas', rayo: 'impacto_rayo', veneno: 'impacto_veneno', sombra: 'estallido_cadaver', luz: 'castigo', fisico: 'estallido_cadaver', sangre: 'estallido_cadaver' };
      for (const c of cs) {
        c.t += dt; c.prox -= dt;
        if (c.t < 2 && c.prox <= 0) {
          c.prox = 0.16 + R() * 0.14; const a = R() * Math.PI * 2, d = R() * 1.6 * c.esc, x = c.x + Math.cos(a) * d, y = c.y + Math.sin(a) * d;
          efecto(j, EST[c.elem] ?? 'estallido_cadaver', x, y, 0, 0.6 + R() * 0.7); j.sacudida = Math.max(j.sacudida, 0.28);
          particulas(j, x, y, 8, c.hueso ? 'humo' : 'sangre', c.hueso ? '#b8b0a0' : TINTA[c.pal][R() < 0.4 ? 1 : 0], 1.8, 30 * c.esc);
          sonar(j, 'explosion', x, y, 0.35);
        }
        if (c.t >= 2 && !c.fin) {
          c.fin = true; efecto(j, 'onda_aterrizaje', c.x, c.y, 0, 3.2 * c.esc); efecto(j, 'grito_guerra', c.x, c.y, 0, 2.4); j.sacudida = 1; j.congela = Math.max(j.congela ?? 0, 0.16);
          sonar(j, 'reventon', c.x, c.y, 1); sonar(j, 'trueno', c.x, c.y, 0.6);
          // la lluvia: sangre (o ceniza de hueso) que cae sobre toda la sala y la mancha
          if (j.particulas.length < 1100) for (let i = 0; i < 70; i++) { const a = R() * Math.PI * 2, d = R() * 6.5; j.particulas.push({ x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, z: 120 + R() * 260, vx: (R() - 0.5) * 0.6, vy: (R() - 0.5) * 0.6, vz: -40 - R() * 60, t: 0, dur: 1.6 + R() * 0.8, color: c.hueso ? '#c8c0a8' : TINTA[c.pal][R() < 0.35 ? 1 : 0], tam: 1.2 + R() * 2, grav: 260, tipo: 'sangre' } as any); }
          if (!c.hueso) for (let i = 0; i < 12; i++) { const a = R() * Math.PI * 2, d = 1 + R() * 5; ponerMancha(j, { x: c.x + Math.cos(a) * d, y: c.y + Math.sin(a) * d, r: 0.4 + R() * 0.7, color: TINTA[c.pal][0], t: 0, tipo: 'sangre', forma: 'salpicadura', ang: a, sem: Math.floor(R() * 8), pal: c.pal }); }
        }
      }
      (j as any).caidas = cs.filter((c) => c.t < 2.2);
    } }
  // chorros de sangre que laten sobre los recién caídos
  { const ch: any[] | undefined = (j as any).chorros;
    if (ch?.length) {
      for (const c of ch) {
        c.t += dt; c.ac += dt; const pulso = Math.max(0, Math.sin(c.t * 15)), k = 1 - c.t / c.dur;
        while (c.ac > 0.03) { c.ac -= 0.03; if (pulso < 0.25 || j.particulas.length > 1000) continue; const a = c.ang + (R() - 0.5) * 0.4, v = (1 + 2.8 * pulso) * k + 0.3;
          j.particulas.push({ x: c.x, y: c.y, z: 12 * c.esc, vx: Math.cos(a) * v, vy: Math.sin(a) * v, vz: (60 + 110 * pulso) * k + 25, t: 0, dur: 0.75, color: R() < 0.3 ? c.c2 : c.c1, tam: 1 + R() * 1.8, grav: 300, tipo: 'sangre' } as any); }
      }
      (j as any).chorros = ch.filter((c) => c.t < c.dur);
    } }
  // pedazos que vuelan: gravedad, giro (8 cuadros por vuelta) y salpicadura donde caen; se van a los 20-40 s
  const gibs: Gib[] | undefined = (j as any).gibs;
  if (gibs?.length) {
    for (const g of gibs) {
      g.t += dt;
      if (g.quieto) continue;
      g.x += g.vx * dt; g.y += g.vy * dt; g.z += g.vz * dt; g.vz -= 420 * dt; g.ang += g.va * dt;
      if (!pasable(j.zona, g.x, g.y)) { g.vx *= -0.3; g.vy *= -0.3; g.x += g.vx * dt * 2; g.y += g.vy * dt * 2; }
      if (g.z <= 0) {
        g.z = 0;
        if (Math.abs(g.vz) > 60) { ponerMancha(j, { x: g.x, y: g.y, r: 0.35 + R() * 0.3, color: g.pal === 'no_muerto' ? '#2a2a20' : g.pal === 'bestia' ? '#2a4a10' : '#6a0a0a', t: 0, tipo: 'sangre', forma: 'salpicadura', ang: Math.atan2(g.vy, g.vx), sem: Math.floor(R() * 8), pal: g.pal === 'no_muerto' ? 'negro' : g.pal === 'bestia' ? 'verde' : 'rojo' }); g.vz = -g.vz * 0.3; g.vx *= 0.5; g.vy *= 0.5; g.va *= 0.5; }
        else { g.quieto = true; g.ang = Math.round(g.ang); }
      }
    }
    (j as any).gibs = gibs.filter((g) => g.t < g.vida);
  }
  const rv: any[] | undefined = (j as any).reventones; if (rv?.length) { for (const r of rv) r.t += dt; (j as any).reventones = rv.filter((r) => r.t < 1.2); }
  for (const m of j.monstruos) {
    if (m.muerto || m.dueno || sangraHueso(m) || m.vida > m.vidaMax * 0.35) continue;
    const o = m as any; if (o.rx === undefined) { o.rx = m.x; o.ry = m.y; continue; }
    if (dist(m.x, m.y, o.rx, o.ry) > 0.8) { ponerMancha(j, { x: m.x + (R() - 0.5) * 0.3, y: m.y + (R() - 0.5) * 0.3, r: 0.12 + R() * 0.12, color: colorSangre(m), t: 0, tipo: 'sangre', forma: 'rastro', ang: Math.atan2(m.y - o.ry, m.x - o.rx), sem: Math.floor(R() * 8), pal: paletaDe(m) }); o.rx = m.x; o.ry = m.y; }
  }
  // los PNJ te siguen con la mirada cuando te acercas (giran por sectores, sin saltos) y vuelven a lo suyo cuando te vas
  for (const n of j.npcs) {
    n.t += dt; const o = n as any; o.dir0 ??= n.dir;
    if (dist(n.x, n.y, h.x, h.y) < 5) { o.tCerca = j.t; girarHacia(n, h.x - n.x, h.y - n.y, dt * 0.45); }
    else if (j.t - (o.tCerca ?? -9) > 2.5 && n.dir !== o.dir0) { const [vx, vy] = DIR_VEC[o.dir0] ?? [0, 1]; girarHacia(n, vx, vy, dt * 0.3); }
  }
  actualizarProyectiles(j, dt);
  actualizarAreas(j, dt);
  // cuervos
  for (const c of j.cuervos) {
    c.t += dt;
    if (!c.objetivo || c.objetivo.muerto) c.objetivo = masCercano(j, h.x, h.y, 9, new Set()) as Monstruo | null;
    const tx = c.objetivo ? c.objetivo.x : h.x + Math.cos(c.ang + j.t) * 2, ty = c.objetivo ? c.objetivo.y : h.y + Math.sin(c.ang + j.t) * 2;
    const dx = tx - c.x, dy = ty - c.y, l = Math.hypot(dx, dy) || 1;
    c.x += (dx / l) * Math.min(l, 8 * dt); c.y += (dy / l) * Math.min(l, 8 * dt);
    // (solo lo que se ve) cada picotazo lleva el poder, así suelta plumas y sangre (render/poderes_vivos.ts)
    if (c.objetivo && l < 0.6 && Math.floor(c.t * 3) !== Math.floor((c.t - dt) * 3)) { habEnCurso = c.marca ? 'cielo_halcones' : 'cuervos'; deDonde = [c.x - dx / l * 0.5, c.y - dy / l * 0.5]; (c as any).pica = j.t; danar(j, c.objetivo, { min: c.dano[0], max: c.dano[1], elem: 'fisico', deHeroe: true, fuente: h, sinFallo: true }); habEnCurso = null; deDonde = null; if (c.marca) c.objetivo.marca = Math.max(c.objetivo.marca ?? 0, 4); }
  }
  j.cuervos = j.cuervos.filter((c) => c.t < c.dur);
  for (const tr of j.torretas) {
    tr.t += dt; tr.cd -= dt;
    if (tr.mina) {
      // mina o cepo: espera a que algo la pise
      if (tr.cd <= 0) { tr.cd = 1.5; efecto(j, 'glifo_trampa', tr.x, tr.y, 0, 0.5, 0, 1.5); }
      if (enRadio(j, tr.x, tr.y, 0.9).length) {
        const r = tr.mina, el = tr.elem ?? 'fuego';
        const blancos = enRadio(j, tr.x, tr.y, r);
        // (solo lo que se ve: render/presencias.ts revienta la trampa con lo suyo)
        (tr as any).disparo = true; ((j as any).trampasDisparadas ??= []).push({ x: tr.x, y: tr.y, hab: tr.hab ?? 'torreta', elem: el, r, blancos: blancos.slice(0, 6).map((e) => [e.x, e.y]) });
        // (de qué poder es el golpe y el efecto: la materia de la trampa en render/poderes_vivos.ts)
        const hab0 = habEnCurso, de0 = deDonde; habEnCurso = tr.hab ?? null; deDonde = [tr.x, tr.y];
        for (const e of blancos) { danar(j, e, golpeSimple(j, tr.dano, el)); if (tr.raiz && !esJefe(e)) { e.congelado = Math.max(e.congelado, 2); (e as any).preso = 'raices'; } }
        efecto(j, tr.efecto ?? 'explosion_fuego', tr.x, tr.y, 0, r / 2); habEnCurso = hab0; deDonde = de0; sonar(j, el === 'rayo' ? 'trueno' : el === 'veneno' ? 'veneno' : tr.raiz ? 'golpe_metal' : 'explosion', tr.x, tr.y, 0.8);
        j.sacudida = Math.max(j.sacudida, 0.2); tr.t = tr.dur;
      }
      continue;
    }
    if (tr.cd <= 0) { const m = masCercano(j, tr.x, tr.y, 9, new Set()); if (m) { const el = tr.elem ?? 'fisico'; disparar(j, { ...h, x: tr.x, y: tr.y } as Ent, m.x, m.y, golpeSimple(j, tr.dano, el), el === 'fisico' ? 'flecha' : tr.efecto ?? 'chispa_cargada', 15); (tr as any).ang = Math.atan2(m.y - tr.y, m.x - tr.x); (tr as any).tiro = j.t; sonar(j, el === 'rayo' ? 'rayo' : 'virote', tr.x, tr.y, 0.5); } tr.cd = 0.55; }
  }
  j.torretas = j.torretas.filter((t) => t.t < t.dur);
  // efectos, números, partículas
  for (const e of j.efectos) {
    e.t += dt;
    // el arco del rayo va de un cuerpo al otro aunque se muevan (o los empuje el golpe)
    if (e.id === 'arco_cadena') { const q = e as any; if (q.de) { q.x = q.de.x; q.y = q.de.y; } if (q.a) { q.x2 = q.a.x; q.y2 = q.a.y; } }
  }
  seguirCadenas(j, dt);
  j.efectos = j.efectos.filter((e) => e.t < (e.dur ?? 1.4));
  for (const n of j.numeros) { n.t += dt; n.z += dt * 30; }
  j.numeros = j.numeros.filter((n) => n.t < 1.1);
  for (const p of j.particulas) { p.t += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt; p.vz -= p.grav * dt; if (p.z < 0) { p.z = 0; p.vx *= 0.5; p.vy *= 0.5; p.vz = 0; if (p.tipo === 'sangre' && R() < 0.06) ponerMancha(j, { x: p.x, y: p.y, r: 0.12 + R() * 0.18, color: p.color, t: 0, tipo: 'sangre', forma: 'gota', sem: Math.floor(R() * 8) }); } }
  j.particulas = j.particulas.filter((p) => p.t < p.dur);
  for (const s of j.suelo) s.t += dt;
  recogerSolo(j);
  for (const m of j.mensajes) m.t += dt;
  j.mensajes = j.mensajes.filter((m) => m.t < 7);
  j.sacudida = Math.max(0, j.sacudida - dt * 2);
  // cadáveres viejos de invocados se van
  j.monstruos = j.monstruos.filter((m) => !(m.muerto && (m.dueno ? m.tMuerto > 2 : m.tMuerto > 600)));
  // portal
  if (j.portal) j.portal.t += dt;
  // visiones de terror: a veces algo asoma al borde de la luz
  for (const v of j.visiones) v.t += dt;
  j.visiones = j.visiones.filter((v) => v.t < 2.6);
  if (j.zona.tipo !== 'pueblo' && R() < dt * 0.012 && j.visiones.length === 0) {
    const a = R() * Math.PI * 2, r = 7.5 + R() * 2;
    const x = h.x + Math.cos(a) * r, y = h.y + Math.sin(a) * r;
    if (pasable(j.zona, x, y)) {
      const pool = POBLACION[POBL_ZONA[j.zona.id] ?? ''] ?? ['zombi'];
      j.visiones.push({ x, y, t: 0, sprite: MONSTRUOS[elegir(pool)]?.sprite ?? 'zombi', dir: dirDe(h.x - x, h.y - y) });
      Sonido.susurro();
    }
  }
  // terror: cada tanto la luz se encoge y algo se escucha
  (j as any).oscurece = Math.max(0, ((j as any).oscurece ?? 0) - dt);
  if (j.zona.tipo !== 'pueblo' && j.zona.oscuridad > 0.4 && R() < (dt / 70) * (1 - h.c.valor / 120)) {
    (j as any).oscurece = 3.5 * (1 - h.c.valor / 150);
    const frases: [string, string][] = [
      [`Alguien susurró «${h.d.nombre}».`, `Someone whispered "${h.d.nombre}".`], ['Las llamas se encogen. Algo respira detrás de ti.', 'The flames shrink. Something breathes behind you.'],
      ['Se escucha una campana. Muy lejos. Debajo.', 'A bell rings. Far away. Below.'], ['La Marca en tu brazo arde un instante.', 'The Mark on your arm burns for a moment.'],
      ['Pasos. Se detienen cuando te detienes.', 'Footsteps. They stop when you stop.'], ['Un niño ríe en la oscuridad.', 'A child laughs in the dark.'],
      ['Huele a cera derretida y a pelo quemado.', 'It smells of melted wax and burnt hair.'], ['Algo cae del techo. Es tibio.', 'Something drips from above. It is warm.'],
    ];
    msg(j, elegir(frases), '#b08080');
    Sonido.susurro();
  }
  // latido con poca vida
  Sonido.latido(!h.muerto && h.vida < h.vidaMax * 0.3);
}

/** Furia, combo, frascos y formas. */
function actualizarMecanicas(j: Juego, dt: number) {
  const h = j.heroe, cl = h.d.clase;
  if (cl === 'berserker') {
    if (h.furiaFija > 0) { h.furiaFija -= dt; h.furia = 100; }
    else if (j.t - h.tCombate > 4) h.furia = Math.max(0, h.furia - 12 * dt);
  }
  if (cl === 'monje' && h.combo.paso > 0 && j.t - h.combo.t > ventanaCombo(h) && !h.buffs.loto_dorado) h.combo.paso = 0;
  if (cl === 'alquimista') {
    const max = frascosMax(h);
    if (h.frascos < max) { h.frascoT += dt * (1 + bono(h, 'frascos_vel') / 100); if (h.frascoT >= 4) { h.frascoT = 0; h.frascos = Math.min(max, h.frascos + 1); } } else { h.frascos = max; h.frascoT = 0; }
  }
  // formas del druida: el cuerpo cambia de tamaño y de tono
  const lobo = !!h.buffs.forma_lobo, oso = !!h.buffs.forma_oso;
  const esc = oso ? 1.15 : lobo ? 1.06 : 1;
  // (quinta pasada: el héroe se pinta como la bestia, render/formas.ts, y el cambio lo cuenta presencias.ts; el tono y el
  // humo de antes quedan solo con `__sinFormas`. La escala sigue igual: la leen los números y lo que se dibuja encima)
  const viejo = !!(globalThis as any).__sinFormas;
  // (sexta pasada) el cambio suena cuando se ve: huesos que crujen y el aullido, el rugido o el aliento del hombre que vuelve
  if (h.escala !== esc && !viejo && h.escala !== undefined && !h.muerto) sonar(j, oso ? 'forma_oso' : lobo ? 'forma_lobo' : 'forma_hombre', h.x, h.y, 0.85);
  if (h.escala !== esc) { h.escala = esc; if (esc !== 1 && viejo) { efecto(j, 'transformacion_bestia', h.x, h.y, 0, 1); particulas(j, h.x, h.y, 16, 'humo', oso ? '#604028' : '#707888', 1.2, 20); } }
  h.tinte = viejo ? (oso ? '#7a5030' : lobo ? '#8898b0' : undefined) : undefined;
  if ((lobo || oso) && viejo && R() < dt * 3) particulas(j, h.x + entre(-0.3, 0.3), h.y + entre(-0.3, 0.3), 1, 'ceniza', oso ? '#a07040' : '#a0b0c8', 0.3, 40);
}

/**
 * Girar como un cuerpo y no como una veleta: se pasa por los sectores intermedios (uno cada 45 ms, el primero al instante) y
 * al sector vecino solo se cambia si el rumbo lo pasa por más de 10° (sin vaivén en los zigzags del camino).
 */
const PASO_GIRO = 0.045;
export function girarHacia(e: Ent, dx: number, dy: number, dt: number, paso = PASO_GIRO): number {
  if (!dx && !dy) return 0;
  const tengo = DIRS.indexOf(e.dir), quiere = DIRS.indexOf(dirDe(dx, dy));
  const dif = ((quiere - tengo + 12) % 8) - 4;
  e.giroT = Math.max(0, (e.giroT ?? 0) - dt);
  if (!dif) return 0;
  if (Math.abs(dif) === 1) { const [cx, cy] = DIR_VEC[e.dir] ?? [0, 1]; if (Math.abs(Math.atan2(cx * dy - cy * dx, cx * dx + cy * dy)) <= Math.PI / 8 + 0.18) return 0; }
  if (e.giroT <= 0) { e.dir = DIRS[(tengo + (dif < 0 ? -1 : 1) + 8) % 8]; e.giroT = paso; return Math.abs(dif) - 1; }
  return Math.abs(dif);
}
/**
 * Un paso hacia (tx, ty). El cuerpo tiene peso: arranca al 40 % y llega a su velocidad en ~0.16 s, afloja mientras se da
 * vuelta y, si es el final del camino (`ultimo`), frena en la última media casilla en vez de clavarse.
 */
function moverHacia(j: Juego, e: Ent, tx: number, ty: number, vel: number, dt: number, ultimo = false): boolean {
  const dx = tx - e.x, dy = ty - e.y, l = Math.hypot(dx, dy);
  if (l < 0.05) return true;
  if (j.t - (e.tMov ?? -9) > 0.12) e.impulso = 0.4;
  const S = sensacionDe(e);
  e.impulso = Math.min(1, (e.impulso ?? 0.4) + (dt / S.arranque) * 0.6); e.tMov = j.t;
  const falta = girarHacia(e, dx, dy, dt, S.giro);
  let k = e.impulso * (falta >= 2 ? 0.5 : falta === 1 ? 0.8 : 1);
  if (ultimo && l < 0.5) k *= Math.max(0.45, l / 0.5);
  const paso = Math.min(l, vel * k * dt);
  const nx = e.x + (dx / l) * paso, ny = e.y + (dy / l) * paso;
  const x0 = e.x, y0 = e.y;
  if (pasable(j.zona, nx, ny)) { e.x = nx; e.y = ny; }
  else if (pasable(j.zona, nx, e.y)) e.x = nx;
  else if (pasable(j.zona, e.x, ny)) e.y = ny;
  else return true;
  e.recorrido = (e.recorrido ?? 0) + Math.hypot(e.x - x0, e.y - y0);
  // hacia dónde va de verdad (el héroe se dibuja en 16 rumbos al caminar: ver escena)
  if (e.x !== x0 || e.y !== y0) (e as any).rumbo = Math.atan2(e.y - y0, e.x - x0);
  return l <= paso + 0.01;
}

function actualizarHeroe(j: Juego, dt: number) {
  const h = j.heroe;
  h.t += dt; h.destello = Math.max(0, h.destello - dt);
  if (h.muerto) return;
  // congelado o aturdido: un momento sin poder hacer nada
  if (h.congelado > 0 || h.aturdido > 0) { h.congelado = Math.max(0, h.congelado - dt); h.aturdido = Math.max(0, h.aturdido - dt); h.acc = 'quieto'; h.camino = null; h.destino = null; return; }
  for (const k of Object.keys(h.recargas)) h.recargas[k] = Math.max(0, h.recargas[k] - dt);
  // buffs
  let cambio = false;
  for (const [k, b] of Object.entries(h.buffs)) { if (b.t < 9000) { b.t -= dt; if (b.t <= 0) { delete h.buffs[k]; cambio = true; } } }
  if (cambio) { recalc(j); cambio = false; }
  // aura activa: solo una. Poner un aura en el botón derecho (o usarla) la vuelve la activa, y sigue aunque cambies de botón.
  const der = habilidadDe(h.d.der);
  if (der.tipo === 'aura' && nivelHab(h.d, der.id, h.c) > 0 && h.d.aura !== der.id) h.d.aura = der.id;
  const auraHb = h.d.aura ? habilidadDe(h.d.aura) : null;
  const auraId = auraHb && auraHb.tipo === 'aura' && auraHb.clase === h.d.clase && nivelHab(h.d, auraHb.id, h.c) > 0 ? auraHb.id : null;
  const pot = auraId ? bono(h, 'potencia_aura') : 0;
  for (const k of Object.keys(h.buffs)) if (h.buffs[k].t > 9000 && (k !== auraId || Math.abs(h.auraPot - pot) > 0.01)) { delete h.buffs[k]; cambio = true; }
  if (auraId && auraHb && !h.buffs[auraId]) { const n = nivelHab(h.d, auraId, h.c); const bonos: Record<string, number> = {}; for (const [k, b] of Object.entries(auraHb.bonos ?? {})) bonos[k] = val(b, n) * (1 + pot / 100); h.buffs[auraId] = { t: 99999, bonos, hab: auraId }; h.auraPot = pot; cambio = true; }
  if (cambio) recalc(j);
  // aura que daña y aura de sentencia
  if (auraId && auraHb) {
    const n = nivelHab(h.d, auraId, h.c), kp = 1 + pot / 100;
    if (auraHb.dano && Math.floor(j.t * 2) !== Math.floor((j.t - dt) * 2)) { const dh = danoHab(j, auraHb, n); for (const e of enRadio(j, h.x, h.y, auraHb.radio ?? 5)) { danar(j, e, { min: dh[0] * 0.5 * kp, max: dh[1] * 0.5 * kp, elem: auraHb.elem, deHeroe: true, fuente: h, sinFallo: true }); pulsoAura(j, e.x, e.y, 'dano'); } }
    if (auraId === 'aura_conviccion') for (const e of enRadio(j, h.x, h.y, auraHb.radio ?? 7)) { e.maldicion = { amplificar: 0, debilitar: 0, lento: 0, ...((e.maldicion ?? { sinHumo: true }) as any), t: Math.max(0.5, e.maldicion?.t ?? 0), res: val(auraHb.bonos?.enemigo_res, n) * kp } as any; }
  }
  // tempestad y huracán
  if (h.tempestad > 0) { h.tempestad -= dt; if (R() < dt * 2.5) { const m = masCercano(j, h.x, h.y, 6, new Set()); if (m) { const hb = habilidadDe('tempestad'), dh = danoHab(j, hb, nivelHab(h.d, 'tempestad', h.c)); efecto(j, 'relampago', m.x, m.y, 0, 1); danar(j, m, { min: dh[0], max: dh[1], elem: 'rayo', deHeroe: true, fuente: h, sinFallo: true }); sonar(j, 'trueno', m.x, m.y, 0.6); } } }
  if (h.huracan > 0) { h.huracan -= dt; if (Math.floor(j.t * 2) !== Math.floor((j.t - dt) * 2)) { const hb = habilidadDe(h.huracanHab), dh = danoHab(j, hb, Math.max(1, nivelHab(h.d, hb.id, h.c))); for (const e of enRadio(j, h.x, h.y, hb.radio ?? 5)) danar(j, e, { min: dh[0] / 2, max: dh[1] / 2, elem: 'frio', deHeroe: true, fuente: h, sinFallo: true }); particulas(j, h.x, h.y, 6, 'nieve', '#e0f0ff', 2, 20); } }
  actualizarMecanicas(j, dt);
  // regeneración
  h.regen += dt;
  // fuera de combate (5 s sin pegar ni recibir) el héroe se repone despacio: 1.5 % de su vida por segundo
  const regV = h.c.regen_vida + (j.zona.tipo === 'pueblo' ? h.vidaMax * 0.05 : j.t - h.tCombate > 5 ? h.vidaMax * 0.015 : 0);
  h.vida = Math.min(h.vidaMax, h.vida + regV * dt);
  // en Normal el maná vuelve el doble de rápido hasta el nivel 15 y baja a lo normal hacia el 25
  const temprano = h.d.dificultad === 0 ? (h.d.nivel <= 15 ? 2 : 1 + Math.max(0, 25 - h.d.nivel) / 10) : 1;
  h.mana = Math.min(h.c.manaMax, h.mana + h.c.manaMax * 0.025 * temprano * (1 + h.c.regen_mana / 100) * dt);
  if (h.veneno > 0) { h.veneno -= dt; h.vida -= h.venenoDps * dt; if (h.vida <= 0) { h.vida = 1; } }
  if ((h as any).quema > 0) { (h as any).quema -= dt; h.vida -= (h as any).quemaDps * dt; if ((h as any).quema <= 0) (h as any).quemaDps = 0; if (h.vida <= 0) h.vida = 1; }
  if (h.sangrado > 0) { h.sangrado -= dt; h.vida -= h.vidaMax * 0.01 * dt; if (h.vida <= 0) morirHeroe(j); }
  if (h.frio > 0) h.frio -= dt;
  // salto o carga
  if (h.salto) {
    const s = h.salto; s.t += dt;
    const k = Math.min(1, s.t / s.T);
    h.x = s.x0 + (s.x1 - s.x0) * k; h.y = s.y0 + (s.y1 - s.y0) * k;
    h.acc = 'atacar'; h.t = k * 0.5;
    if (k >= 1) {
      const hb = s.hab, n = (h as any).saltoN, mult = (h as any).saltoMult;
      const r = hb.radio ?? 1.8;
      const extra = hb.dano ? danoHab(j, hb, n) : undefined;
      habEnCurso = hb.id; deDonde = [s.x0, s.y0];
      for (const e of enemigosDe(j, true)) if (dist(e.x, e.y, h.x, h.y) <= r + (hb.tipo === 'carga' ? 0.6 : 0)) { const g = golpeArma(j, mult, hb.elem !== 'fisico' ? hb.elem : undefined, extra); if (hb.tipo === 'carga') g.empuje = 1; if (danar(j, e, g) > 0) ganarFuria(j, 4); }
      efecto(j, hb.tipo === 'salto' ? 'onda_aterrizaje' : 'polvo_carga', h.x, h.y, DIRS.indexOf(h.dir));
      j.sacudida = 0.3; sonar(j, 'golpe_metal'); habEnCurso = null; deDonde = null;
      h.salto = null; h.acc = 'quieto';
    }
    return;
  }
  if (h.torbellino > 0) {
    h.torbellino -= dt;
    const [tx, ty] = (h as any).torbDir;
    if (moverHacia(j, h, tx, ty, 4.5, dt)) h.torbellino = Math.min(h.torbellino, 0.05);
    h.acc = 'atacar'; h.dir = DIRS[Math.floor(j.t * 16) % 8];
    if (Math.floor(j.t * 5) !== Math.floor((j.t - dt) * 5)) { habEnCurso = 'torbellino'; deDonde = [h.x, h.y]; for (const e of enemigosDe(j, true)) if (dist(e.x, e.y, h.x, h.y) < 2.2) { if (danar(j, e, golpeArma(j, (h as any).torbMult)) > 0) ganarFuria(j, 2); } habEnCurso = null; deDonde = null; }
    if (Math.floor(j.t * 6) !== Math.floor((j.t - dt) * 6)) sonar(j, 'tajo', h.x, h.y, 0.5);
    if (h.torbellino <= 0) { h.acc = 'quieto'; h.destino = null; }
    return;
  }
  // acción en curso
  if (h.acc === 'atacar' || h.acc === 'lanzar' || h.acc === 'herido') {
    const cb = (h as any).combo3 as { i: number; t: number[]; remate: boolean } | null;
    if (cb && h.acc === 'atacar') { while (cb.i < cb.t.length && h.t >= cb.t[cb.i]) { resolverHabilidad(j, cb.i, cb); cb.i++; } if (cb.i >= cb.t.length) h.golpeo = true; }
    else if ((h.acc === 'atacar' || h.acc === 'lanzar') && !h.golpeo && h.t >= h.golpeEn) { h.golpeo = true; resolverHabilidad(j); if (h.acc === 'atacar') romperCerca(j); }
    if (h.t >= h.dur) { h.acc = 'quieto'; h.t = 0; }
    return;
  }
  // caminar
  // cada clase con su paso: los livianos son un poco más veloces y los de armadura un poco menos (antes las ocho iban igual)
  const vel = (h.correr ? 5.4 : 3.4) * (PASO_CLASE[h.d.clase] ?? 1) * (1 + h.c.vel_mover / 100) * (h.frio > 0 ? 0.6 : 1);
  if (h.camino && h.camino.length) {
    const [tx, ty] = h.camino[0];
    if (moverHacia(j, h, tx, ty, vel, dt, h.camino.length === 1)) h.camino.shift();
    if (h.acc !== (h.correr ? 'correr' : 'caminar')) { h.acc = h.correr ? 'correr' : 'caminar'; }
    // un paso por cada pie que apoya: media zancada
    const medio = (zancadaClase(h.d.clase, h.correr ? 'correr' : 'caminar') ?? (h.correr ? ZANCADA.correr : ZANCADA.caminar)) * (ALTO_CLASE[h.d.clase] ?? 1) / 2;
    const pie = Math.floor((h.recorrido ?? 0) / medio);
    if (pie !== h.pasoT) { h.pasoT = pie; sonar(j, 'paso', h.x, h.y, (h.correr ? 0.4 : 0.3) * (SENSACION[h.d.clase]?.paso ?? 1)); }
    if (!h.camino.length) h.camino = null;
  } else if (h.acc === 'caminar' || h.acc === 'correr') h.acc = 'quieto';
}

function actualizarMonstruo(j: Juego, m: Monstruo, dt: number) {
  m.t += dt; m.destello = Math.max(0, m.destello - dt);
  // lo que dice se apaga solo, para todos (antes la cuenta bajaba solo en los jefes y después de los return de sus
  // maniobras: la frase de un jefe de zona o de un campeón quedaba pegada encima de la pelea)
  if (m.habla) { const o = m as any; o.hablaT = (o.hablaT ?? 0) - dt; if (o.hablaT <= 0 || m.muerto) { m.habla = undefined; o.hablaT = 0; } }
  if (m.muerto) { m.tMuerto += dt; return; }
  if ((m as any).manCd > 0 && !(m as any).man && m.estado === 'perseguir') (m as any).manCd -= dt;
  if ((m.def.jefe || m.calidad >= 3) && (m.acc === 'caminar' || m.acc === 'correr') && (m.escala ?? 1) >= 1.3) {
    const o = m as any; o.pasoT = (o.pasoT ?? 0) - dt;
    if (o.pasoT <= 0) { o.pasoT = 0.44; if (dist(m.x, m.y, j.heroe.x, j.heroe.y) < 14) { j.sacudida = Math.max(j.sacudida, 0.09); particulas(j, m.x, m.y, 4, 'humo', '#6a6050', 0.7, 2); sonar(j, 'objeto_cae', m.x, m.y, 0.25); } }
  }
  actualizarMonstruo2(j, m, dt);
  // lo que se ve: entre quieto y caminar hace falta un mínimo de 0.2 s en cada estado (sin vaivén de un cuadro a otro)
  const o = m as any; o.tVis = (o.tVis ?? 0) + dt;
  const suave = (a: string) => a === 'quieto' || a === 'caminar' || a === 'correr';
  if (o.accVis !== m.acc) { if (!(suave(m.acc) && suave(o.accVis ?? '') && o.tVis < 0.2)) { o.accVis = m.acc; o.tVis = 0; } }
}
function actualizarMonstruo2(j: Juego, m: Monstruo, dt: number) {
  const h = j.heroe;
  if (m.veneno > 0) { m.veneno -= dt; m.vida -= m.venenoDps * dt; if (Math.floor(m.veneno * 2) !== Math.floor((m.veneno + dt) * 2)) particulas(j, m.x, m.y, 2, 'humo', '#60a040', 0.5, 30); if (m.vida <= 0) { morirMonstruo(j, m); return; } }
  if (m.sangrado > 0) { m.sangrado -= dt; m.vida -= m.vidaMax * 0.02 * dt; if (m.vida <= 0) { morirMonstruo(j, m); return; } }
  if ((m as any).quema > 0) { (m as any).quema -= dt; m.vida -= (m as any).quemaDps * dt; if (R() < dt * 6) particulas(j, m.x, m.y, 1, 'brasa', '#ff7020', 0.4, 40 * m.escala); if ((m as any).quema <= 0) (m as any).quemaDps = 0; if (m.vida <= 0) { morirMonstruo(j, m); return; } }
  if (m.maldicion) { m.maldicion.t -= dt; if (m.maldicion.t <= 0) m.maldicion = undefined; }
  if (m.marca && m.marca > 0) { m.marca -= dt; if (Math.floor(m.marca * 2) !== Math.floor((m.marca + dt) * 2)) particulas(j, m.x, m.y, 1, 'pluma', '#ffc860', 0.3, 70 * m.escala); }
  if (m.dueno && m.tVida !== undefined) { m.tVida -= dt; if (m.tVida <= 0) { m.vida = 0; m.muerto = true; m.acc = 'morir'; m.t = 0; m.tMuerto = 0; despedidaInvocado(j, m); return; } }
  // aturdirlo o congelarlo mientras se prepara le corta la maniobra
  if ((m.congelado > 0 || m.aturdido > 0) && (m as any).man) { if ((m as any).man.fase !== 'recupera') (m as any).manCd = 2.5; (m as any).man = undefined; (m as any).alto = 0; }
  if (m.congelado > 0) { m.congelado -= dt; return; }
  if (m.aturdido > 0) { m.aturdido -= dt; m.acc = 'herido'; return; }
  if (m.frio > 0) m.frio -= dt;
  const lento = (m.frio > 0 ? 0.5 : 1) * (m.maldicion?.lento ? 1 - m.maldicion.lento / 100 : 1);
  // surgir del piso
  if (m.estado === 'surgir') { if (dist(m.x, m.y, h.x, h.y) < 7 && !h.muerto) { m.estado = 'perseguir'; m.objetivo = h; m.acc = 'morir'; m.t = 0; (m as any).surgiendo = 1.2; particulas(j, m.x, m.y, 12, 'humo', '#3a3026', 1, 4); sonar(j, 'grunido', m.x, m.y); } return; }
  if ((m as any).surgiendo > 0) { (m as any).surgiendo -= dt; return; }
  if ((m as any).nucleoT > 0) {
    // Ozmaren con el pecho abierto: quieto, el núcleo de lava a la vista y recibe el doble de daño
    const o = m as any; o.nucleoT -= dt; m.acc = 'especial' as any; if (m.t >= m.dur) m.t = 0;
    if (o.nucleoT <= 0) { m.acc = 'quieto'; m.t = 0; m.cd = 0.3; msg(j, ['Ozmaren cierra el pecho.', 'Ozmaren closes its chest.'], '#c08060'); }
    return;
  }
  // aliento de fuego (Ozmaren y el demonio alado): aviso con el cono en el piso y después el chorro, que se esquiva saliendo
  const al = (m as any).aliento as Aliento | undefined;
  if (al) { avanzarAliento(j, m, al, dt); return; }
  const man = (m as any).man as Maniobra | undefined;
  if (man) { if (m.dueno || j.heroe.muerto) { (m as any).man = undefined; (m as any).alto = 0; } else { avanzarManiobra(j, m, man, dt); return; } }
  if (m.acc === 'herido') { if (m.t >= m.dur) { m.acc = 'quieto'; m.t = 0; } return; }
  if (m.acc === 'atacar' || m.acc === 'lanzar') {
    if (!m.golpeo && m.t >= m.golpeEn) { m.golpeo = true; golpeMonstruo(j, m); }
    if (m.t >= m.dur) { m.acc = 'quieto'; m.t = 0; }
    return;
  }
  m.cd -= dt * lento; m.pensar -= dt;
  // invocados: siguen al héroe y pelean
  if (m.dueno) {
    const enem = enemigosDe(j, true);
    if (!m.objetivo || m.objetivo.muerto || dist(m.objetivo.x, m.objetivo.y, h.x, h.y) > 14) m.objetivo = null;
    if (!m.objetivo) { let bd = 8; for (const e of enem) { const d = dist(e.x, e.y, m.x, m.y); if (d < bd) { bd = d; m.objetivo = e; } } }
    if (m.objetivo) { pelear(j, m, m.objetivo, dt, lento); return; }
    const d = dist(m.x, m.y, h.x, h.y);
    if (m.invocaId === 'thor') { seguirThor(j, m, d, dt); return; }
    // Thor galopa si el héroe corre (o si quedó lejos)
    const galopa = m.invocaId === 'thor' && (h.acc === 'correr' || d > 7);
    if (d > 3) { moverHacia(j, m, h.x, h.y, m.vel * (galopa ? 1.8 : 1.4), dt); m.acc = (galopa ? 'correr' : 'caminar') as any; } else if (m.acc === 'caminar' || (m.acc as string) === 'correr') m.acc = 'quieto';
    if (d > 20) { m.x = h.x + entre(-1, 1); m.y = h.y + entre(-1, 1); }
    return;
  }
  const dh = dist(m.x, m.y, h.x, h.y);
  // despertar
  if (m.estado === 'dormido' || m.estado === 'deambular') {
    // (antes 8 celdas: los monstruos se veían parados media pantalla antes de reaccionar. Ahora ven a 13 a cielo abierto, a 11
    //  bajo tierra, y los de élite un poco más. El jefe sigue despertando por su sala)
    const bajo = j.zona.tipo === 'mazmorra', vista = (globalThis as any).__vistaVieja ? (m.calidad >= 3 ? 9 : 8) : m.calidad >= 3 ? 9 : m.calidad >= 1 ? (bajo ? 12 : 15) : bajo ? 11 : 13;
    // los jefes despiertan por cercanía a su sala, aunque un muro los tape (si no, quedan quietos hasta verte)
    const esJefe = !!(m.def.jefe || m.def.ia === 'jefe');
    if (!h.muerto && ((esJefe && dh < 7 + (m.escala ?? 1) * 2) || (dh < vista && (dh < 3 || lineaLibre(j.zona, m.x, m.y, h.x, h.y))))) {
      m.estado = 'perseguir'; m.objetivo = h; (m as any).alerta = entre(0.12, 0.35);
      if (m.calidad >= 3 || m.def.jefe || m.def.ia === 'jefe') { j.jefe = m; (m as any).alerta = 0;
        // la primera vez que ves a un jefe de verdad: su presentación con el nombre grande y cámara lenta
        presentarJefe(j, m);
        if (!(m as any).hablo) { (m as any).hablo = true; hablarJefe(j, m); sonar(j, 'rugido_jefe'); Sonido.musica('jefe'); } }
      // el jefe de la zona (un único con nombre e historia) dice lo suyo al despertar, sobre su cabeza: antes entraba mudo
      else if (m.jefeZona && !(m as any).hablo) { (m as any).hablo = true; hablarJefe(j, m); }
      else if (R() < 0.3) sonar(j, m.def.sonido === 'hueso' ? 'golpe_hueso' : 'grunido', m.x, m.y, 0.6);
      // el grupo despierta junto
      // el grupo despierta junto, pero no entero: los más cercanos sí, los demás a veces (llegan después cuando te vean)
      // el campamento entero se viene, en oleada: cada uno con su demora según lo lejos que esté del que dio la voz
      if (m.camp != null && !(globalThis as any).__vistaVieja) alertarCampamento(j, m, h);
      for (const o of j.monstruos) if (!o.muerto && !o.dueno && o.estado !== 'perseguir' && o.estado !== 'surgir') { const d2 = dist(o.x, o.y, m.x, m.y); if (d2 < 2.5 || (d2 < 5 && R() < 0.4)) { o.estado = 'perseguir'; o.objetivo = h; (o as any).alerta = entre(0.25, 0.7); } }
    } else {
      // los merodeadores (reparto.ts): la manada ronda despacio alrededor de su sitio, cada uno en su lugar del grupo
      if ((m as any).ronda && !(globalThis as any).__campamentos) {
        const q = pasoRonda(j.zona, m, j.t);
        if (q) { m.estado = 'deambular'; if (moverHacia(j, m, q[0], q[1], m.vel * 0.42, dt, true)) m.acc = 'quieto'; else m.acc = 'caminar'; }
        else { m.estado = 'dormido'; m.acc = 'quieto'; if (R() < dt * 0.3) m.dir = DIRS[(DIRS.indexOf(m.dir) + (R() < 0.5 ? 1 : 7)) % 8]; }
        return;
      }
      // deambular cerca de su lugar
      if (m.pensar <= 0) { m.pensar = entre(2, 5); m.estado = R() < 0.5 ? 'deambular' : 'dormido'; (m as any).dest = [m.ox + entre(-3, 3), m.oy + entre(-3, 3)]; }
      if (m.estado === 'deambular' && (m as any).dest) { if (moverHacia(j, m, (m as any).dest[0], (m as any).dest[1], m.vel * 0.4, dt, true)) { m.estado = 'dormido'; m.acc = 'quieto'; } else m.acc = 'caminar'; }
      else { m.acc = 'quieto'; if (R() < dt * 0.22) m.dir = DIRS[(DIRS.indexOf(m.dir) + (R() < 0.5 ? 1 : 7)) % 8]; }
      return;
    }
  }
  if (h.muerto) { m.estado = 'deambular'; m.objetivo = null; return; }
  // elegir objetivo: el héroe o un invocado más cerca
  if (m.pensar <= 0) {
    m.pensar = 0.5 + R() * 0.4;
    let mejor: Ent = h, bd = dh;
    // los jefes y únicos van por el héroe: solo se entretienen con Thor o un invocado si el héroe está bien lejos
    const margen = esMandon(m) ? 5 : 1;
    for (const o of j.monstruos) if (o.dueno && !o.muerto) { const d = dist(o.x, o.y, m.x, m.y); if (d < bd - margen) { bd = d; mejor = o; } }
    m.objetivo = mejor;
    if (dh > 22) { m.estado = 'deambular'; m.objetivo = null; return; }
  }
  if (m.miedo > 0) {
    m.miedo -= dt;
    const a = Math.atan2(m.y - h.y, m.x - h.x);
    moverHacia(j, m, m.x + Math.cos(a) * 2, m.y + Math.sin(a) * 2, m.vel * lento, dt); m.acc = 'caminar';
    return;
  }
  // el aliento: Ozmaren lo alterna con las saetas del pecho (más seguido con furia); el demonio alado, chico y flojo
  const ALC = ALIENTO[m.def.id];
  if (ALC && !m.dueno && !(m as any).nucleoT && dh < ALC.alcance + 1.5) {
    const o = m as any; o.alientoCd = (o.alientoCd ?? ALC.cd * 0.6) - dt;
    if (o.alientoCd <= 0 && ((o.nucleoCd ?? 99) > 2.5)) {
      o.alientoCd = ALC.cd * (m.fase >= 2 ? 0.65 : 1);
      o.aliento = { fase: 'aviso', t: 0, ang: Math.atan2(h.y - m.y, h.x - m.x), tick: 0, conf: ALC } as Aliento;
      m.acc = (m.def.id === 'senor_demonio' ? 'especial' : 'lanzar') as any; m.t = 0; m.dur = 0.9;
      sonar(j, m.def.jefe ? 'rugido_jefe' : 'fuego_lanzar', m.x, m.y);
      return;
    }
  }
  // la escolta del jefe llega por oleadas, con 4 acompañantes vivos como mucho y lejos de él (3 casillas libres)
  const ol = (m as any).oleada as { ids: string[]; cd: number } | undefined;
  if (ol?.ids.length && (m as any).presentado) {
    ol.cd -= dt;
    if (ol.cd <= 0) {
      ol.cd = 6;
      let libres = 4 - acompanantes(j, m);
      while (libres-- > 0 && ol.ids.length) { const q = lejosDelJefe(j, m); const nm = crearMonstruo(MONSTRUOS[ol.ids.pop()!], m.nivel, q[0] + 0.5, q[1] + 0.5, 0, h.d.dificultad); nm.estado = 'perseguir'; j.monstruos.push(nm); efecto(j, 'circulo_invocacion', nm.x, nm.y); }
    }
  }
  // invocar
  if (m.def.invoca && m.invocaCd > 0) m.invocaCd -= dt;
  if (m.def.invoca && m.invocaCd <= 0 && (m.def.ia === 'invocador' || m.def.jefe) && dh < 10) {
    // los jefes llamaban 3 cada 9 s hasta 14 alrededor: eso, y no el jefe, era lo que mataba (sobre todo al cuerpo a cuerpo)
    m.invocaCd = m.def.jefe ? 12 : 7;
    const cuantos = m.def.jefe ? acompanantes(j, m) : j.monstruos.filter((o) => !o.muerto && !o.dueno && dist(o.x, o.y, m.x, m.y) < 8).length;
    if (cuantos < (m.def.jefe ? 4 : 9)) {
      m.acc = 'lanzar'; m.t = 0; m.dur = 0.7; m.golpeEn = 0.4; m.golpeo = true;
      for (let k = 0; k < Math.min(m.def.id === 'abadesa' ? 1 : 2, m.def.jefe ? 4 - cuantos : 9); k++) { const q = m.def.jefe ? lejosDelJefe(j, m) : libreCerca(j.zona, m.x + entre(-2, 2), m.y + entre(-2, 2)); const nm = crearMonstruo(MONSTRUOS[m.def.invoca], m.nivel, q[0] + 0.5, q[1] + 0.5, 0, h.d.dificultad); if (m.def.jefe) nm.dano = [Math.min(nm.dano[0], Math.round(m.dano[0] * 0.5)), Math.min(nm.dano[1], Math.round(m.dano[1] * 0.5))]; nm.estado = 'perseguir'; nm.objetivo = h; nm.acc = 'morir'; nm.t = 0; (nm as any).surgiendo = 1; j.monstruos.push(nm); efecto(j, 'circulo_invocacion', q[0] + 0.5, q[1] + 0.5, 0, 0.7); }
      sonar(j, 'invocar', m.x, m.y);
      return;
    }
  }
  // Ozmaren abre el pecho cada tanto: suelta una ola de fuego (aviso) y queda expuesto unos segundos
  if (m.def.id === 'senor_demonio' && dh < 12) {
    const o = m as any; o.nucleoCd = (o.nucleoCd ?? 8) - dt;
    if (o.nucleoCd <= 0) {
      o.nucleoCd = m.fase >= 2 ? 13 : 16; o.nucleoT = 4.5;
      m.acc = 'especial' as any; m.t = 0; m.dur = 0.9;
      for (let a = 0; a < 10; a++) disparar(j, m, m.x + Math.cos(a * 0.628), m.y + Math.sin(a * 0.628), { min: m.dano[0] * 0.3, max: m.dano[1] * 0.3, elem: 'fuego', deHeroe: false, fuente: m }, 'saeta_fuego', 6);
      efecto(j, 'grito_guerra', m.x, m.y, 0, 1.6); efecto(j, 'pilar_infernal', m.x, m.y, 0, 1.5); j.sacudida = 0.4; sonar(j, 'rugido_jefe', m.x, m.y);
      msg(j, ['¡Ozmaren abre el pecho! Su núcleo queda expuesto: pégale ahora.', 'Ozmaren opens its chest! Its core is exposed: strike now.'], '#ffc060');
      return;
    }
  }
  // un jefe que despertó con su grupo (sin pasar por la vista) también se presenta
  if ((m.def.jefe || m.def.ia === 'jefe') && m.estado === 'perseguir' && !m.dueno && dist(m.x, m.y, h.x, h.y) < 14) { if (!j.jefe || j.jefe.muerto) j.jefe = m; presentarJefe(j, m); }
  // fases de jefe
  if (m.def.jefe) {
    const f = m.vida < m.vidaMax * 0.33 ? 2 : m.vida < m.vidaMax * 0.66 ? 1 : 0;
    if (f > m.fase) { m.fase = f; m.vel *= 1.15; m.cd = 0; efecto(j, 'grito_guerra', m.x, m.y, 0, 2); j.sacudida = 0.6; sonar(j, 'rugido_jefe', m.x, m.y); msg(j, f === 1 ? ['¡Se enfurece!', 'It grows enraged!'] : ['¡Está desesperado!', 'It is desperate!'], '#ff6040');
      // nova al cambiar de fase
      for (let a = 0; a < 12; a++) disparar(j, m, m.x + Math.cos(a * 0.524), m.y + Math.sin(a * 0.524), { min: m.dano[0] * 0.6, max: m.dano[1] * 0.6, elem: m.def.elem ?? 'fuego', deHeroe: false, fuente: m }, efectoProy(m.def.proyectil ?? 'fuego'), 7);
    }
  }
  // los únicos y jefes de mazmorra también se enfurecen: a media vida aceleran y sueltan sus maniobras más seguido
  if (!m.def.jefe && m.calidad >= 2 && m.fase === 0 && m.vida < m.vidaMax * 0.5) {
    m.fase = 1; m.vel *= 1.15; m.cd = 0; (m as any).manCd = 0.6; efecto(j, 'grito_guerra', m.x, m.y, 0, 1.6); j.sacudida = Math.max(j.sacudida, 0.5); sonar(j, 'rugido_jefe', m.x, m.y);
    msg(j, [`¡${m.nombre[0]} se enfurece!`, `${m.nombre[1] || m.nombre[0]} grows enraged!`], '#ff6040');
  }
  // (las maniobras, embestidas y saltos, son del que tiene turno en el frente: el que ronda no se mete así)
  if (m.objetivo && !m.dueno && m.estado === 'perseguir' && (m.objetivo !== h || m.calidad >= 1 || enFrente(j, m, dist(m.x, m.y, h.x, h.y))) && intentarManiobra(j, m, m.objetivo, dt)) return;
  if (m.objetivo) pelear(j, m, m.objetivo, dt, lento);
}

/**
 * Lo que se rompe de un golpe: barriles, vasijas, cajas, sacos y canastos que estén al alcance del arma, del lado al que
 * mira el héroe. Saltan astillas o tiestos, queda libre el paso y a veces había unas monedas adentro.
 */
const ROMPIBLE = /barril|jarr|vasij|urna|anfora|caja|saco|canast|cantaro|tonel|heno|pertrech/;
function romperCerca(j: Juego) {
  const h = j.heroe, z = j.zona, [vx, vy] = DIR_VEC[h.dir];
  for (let i = z.objetos.length - 1; i >= 0; i--) {
    const o = z.objetos[i]; if (o.tag || o.hw * o.hh > 6 || !ROMPIBLE.test(o.id)) continue;
    const dx = o.cx - h.x, dy = o.cy - h.y, d = Math.hypot(dx, dy); if (d > 2.1 || (d > 0.6 && (dx * vx + dy * vy) / d < 0.25)) continue;
    z.objetos.splice(i, 1);
    const x0 = Math.round(o.cx - (o.hw - 1) / 2), y0 = Math.round(o.cy - (o.hh - 1) / 2);
    if (o.bloquea) for (let y = y0; y < y0 + o.hh; y++) for (let x = x0; x < x0 + o.hw; x++) if (x >= 0 && y >= 0 && x < z.W && y < z.H && z.bloq[y * z.W + x] === 1) z.bloq[y * z.W + x] = 0;
    const barro = /jarr|vasij|urna|anfora|cantaro/.test(o.id);
    particulas(j, o.cx, o.cy, 12, 'chispa', barro ? '#b07850' : '#8a6238', 1.5, 14); particulas(j, o.cx, o.cy, 5, 'humo', barro ? '#8a6a50' : '#6a5038', 0.8, 8);
    efecto(j, 'onda_aterrizaje', o.cx, o.cy, 0, 0.5); sonar(j, 'objeto_cae', o.cx, o.cy, 0.8); j.sacudida = Math.max(j.sacudida, 0.12);
    if (R() < 0.4) soltar(j, o.cx, o.cy, [{ oro: 2 + Math.floor(R() * (4 + h.d.nivel * 2)) }]);
  }
}
function efectoProy(p: string) { return p === 'fuego' ? 'saeta_fuego' : p === 'hielo' ? 'saeta_hielo' : p === 'veneno' ? 'saeta_veneno' : p === 'sombra' ? 'lanza_hueso' : p === 'luz' ? 'saeta_sagrada' : p === 'lanza' ? 'flecha' : 'flecha'; }

function pelear(j: Juego, m: Monstruo, obj: Ent, dt: number, lento: number) {
  const d = dist(m.x, m.y, obj.x, obj.y);
  // el sobresalto: al descubrirte se vuelve hacia ti un instante antes de echarse encima (cada uno a su tiempo)
  if ((m as any).espera) {
    const q = m as any;
    if (q.alerta <= 1.2) q.espera = false;
    else { let sigue = false; for (const o of j.monstruos) if (o.camp === m.camp && o.calidad >= 1) { if (o.muerto || o.vida < o.vidaMax * 0.5) { sigue = false; break; } sigue = true; } if (!sigue) { q.espera = false; q.alerta = 0.2 + R() * 0.8; } }
  }
  if ((m as any).alerta > 0) { (m as any).alerta -= dt; girarHacia(m, obj.x - m.x, obj.y - m.y, dt, sensacionDe(m).giro); if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto'; return; }
  // El jefe que también dispara decide si esta vez pelea de lejos o se echa encima, y sostiene esa decisión un rato.
  // Antes la tiraba al azar en cada cuadro: el cuerpo temblaba entre caminar y quedarse quieto (visto cuadro a cuadro,
  // 20 arranques de menos de 0,2 s en diez segundos).
  let jefeLejos = false;
  if (m.def.jefe && m.def.proyectil) { const q = m as any; q.modoT = (q.modoT ?? 0) - dt; if (q.modoT <= 0) { q.modoLejos = R() < 0.4; q.modoT = 1.6 + R() * 1.4; } jefeLejos = !!q.modoLejos; }
  const distancia = m.def.ia === 'distancia' || m.def.ia === 'mago' || m.def.ia === 'invocador' || jefeLejos;
  // (los de golpe en área llegan un poco más lejos, pero nunca más que el golpe del héroe (1,4 + radio del monstruo):
  // con 0,4 de más un ogro pegaba desde 2,39 y el héroe en modo agresivo, que alcanza 2,24, no le respondía nunca)
  const alcance = m.radio + obj.radio + 0.75 + (m.def.area ? 0.2 : 0);
  if (distancia && m.def.rango) {
    const ver = lineaLibre(j.zona, m.x, m.y, obj.x, obj.y);
    if (d < m.def.rango && ver && m.cd <= 0) {
      // la andanada: los de tiro de un campamento no sueltan todos en el mismo instante (ver `enFrente`)
      if (obj === j.heroe && !m.dueno && m.calidad < 1 && !m.def.jefe && !(globalThis as any).__frenteViejo) {
        const q = j as any, tiros: number[] = (q.tirosFrente ??= []);
        while (tiros.length && (j.t - tiros[0] > (j.zona.nivel < 24 ? 1.5 : 1.9) || tiros[0] > j.t)) tiros.shift();
        if (tiros.length >= 1) { m.cd = 0.2 + R() * 0.3; m.acc = 'quieto'; m.dir = dirDe(obj.x - m.x, obj.y - m.y); return; }
        tiros.push(j.t);
      }
      iniciarAtaque(j, m, obj, true); return;
    }
    if (d < 3.5 && m.def.ia !== 'invocador' && !m.def.jefe) { const a = Math.atan2(m.y - obj.y, m.x - obj.x); moverHacia(j, m, m.x + Math.cos(a) * 2, m.y + Math.sin(a) * 2, m.vel * lento, dt); m.acc = 'caminar'; return; }
    if (d >= m.def.rango - 1 || !ver) { avanzar(j, m, obj, dt, lento); return; }
    m.acc = 'quieto'; return;
  }
  // el frente: contra el héroe solo se echan encima unos cuantos a la vez; el resto del campamento cierra el corro y espera su hueco
  if (obj === j.heroe && !m.dueno && !enFrente(j, m, d)) { rondar(j, m, obj, d, dt, lento); return; }
  if (d <= alcance) {
    m.dir = dirDe(obj.x - m.x, obj.y - m.y);
    if (m.cd <= 0) {
      // el turno: los comunes del corro no descargan todos a la vez. Entre el arranque de un golpe y el del siguiente pasa un
      // respiro (`ritmoFrente`), así los golpes llegan en fila y se pueden leer, esquivar o aguantar, aunque haya diez encima
      if (obj === j.heroe && !m.dueno && m.calidad < 1 && !m.def.jefe && m.def.ia !== 'jefe' && !(globalThis as any).__frenteViejo) {
        const q = j as any, ya = q.turnoFrente ?? -9;
        if (j.t < ya && j.t > ya - 5) { m.cd = 0.12 + R() * 0.2; m.acc = 'quieto'; return; }
        q.turnoFrente = j.t + ritmoFrente(j) * (m.def.ia === 'bruto' ? 2 : 1) * (0.85 + R() * 0.3);
      }
      iniciarAtaque(j, m, obj, false);
    } else m.acc = 'quieto';
    return;
  }
  avanzar(j, m, obj, dt, lento);
}
/** Segundos entre el arranque de un golpe común y el siguiente contra el héroe (un bruto ocupa dos turnos). */
export function ritmoFrente(j: Juego) { const n = j.zona.nivel; return ((globalThis as any).__ritmoFrente ?? 1) * (n < 4 ? 1.5 : n < 12 ? 1.35 : n < 24 ? 1.25 : 1.3); }
/**
 * El frente de una pelea (oleada 2 de los mundos). Con los campamentos el héroe tenía 8 a 12 cuerpos pegando a la vez con el
 * daño de cuando eran 3: medido con `t1010_campamentos.mts`, las pociones y las muertes subían al triple desde el nivel 20.
 * Ahora cuerpo a cuerpo entran `topeFrente` a la vez (2 en las primeras zonas, 3 hasta el nivel 12 y 4 después; un campeón vale por dos y van de a dos, el único siempre): los
 * demás cierran un corro a 3 o 4 casillas, rondan y entran apenas cae uno o queda un hueco. Los de tiro siguen igual, atrás.
 * Se ve el campamento entero encima y la pelea es intensa, pero no cae todo el daño en el mismo cuadro.
 * `__frenteViejo` vuelve a todos encima.
 */
export function topeFrente(j: Juego) { const n = j.zona.nivel; return n < 4 ? 2 : n < 12 ? 3 : 4; }
function enFrente(j: Juego, m: Monstruo, d: number): boolean {
  if ((globalThis as any).__frenteViejo || m.calidad >= 2 || m.def.jefe || m.def.ia === 'jefe' || d > 6.5) return true;
  const q = j as any, h = j.heroe;
  let f = q.frente as { t: number; ids: Set<number> } | undefined;
  if (!f || j.t - f.t > 0.25 || j.t < f.t) {
    const antes = f?.ids, cand: { m: Monstruo; s: number }[] = [];
    let elite = 0;
    for (const o of j.monstruos) {
      if (o.muerto || o.dueno || o.estado !== 'perseguir' || o.objetivo !== h || (o as any).surgiendo > 0) continue;
      if (o.def.ia === 'distancia' || o.def.ia === 'mago' || o.def.ia === 'invocador') continue;
      const dd = dist(o.x, o.y, h.x, h.y); if (dd > 6.5) continue;
      if (o.calidad >= 2 || o.def.jefe || o.def.ia === 'jefe') { elite += 2; continue; }
      // el que ya estaba adentro se queda (no se turnan a cada rato), después el más cercano. Los campeones van primero
      // (de a dos: el tercero ronda), y cada uno ocupa el sitio de dos comunes
      cand.push({ m: o, s: dd - (antes?.has(o.id) ? 2.5 : 0) - (o.calidad >= 1 ? 100 : 0) });
    }
    cand.sort((a, b) => a.s - b.s || a.m.id - b.m.id);
    const ids = new Set<number>();
    let cupo = Math.max(1, topeFrente(j) - elite), camps = 0, brutos = 0;
    for (let i = 0; i < cand.length && cupo > 0; i++) {
      const o = cand[i].m;
      // (los pesados, brutos de golpe largo, también valen por dos: uno de ellos y uno o dos livianos a la vez)
      // (y de los brutos comunes, uno solo a la vez: con los campamentos salían de a seis carceleros o gigantes, y dos o tres
      //  pegando juntos con su golpe en área era lo que mataba a las clases de tiro en las Llanuras y el Trono Helado)
      if (o.calidad >= 1) { if (camps >= (o.def.ia === 'bruto' ? 1 : 2)) continue; camps++; cupo -= 2; }
      else if (o.def.ia === 'bruto') { if (brutos >= 1) continue; brutos++; cupo -= 2; }
      else cupo--;
      ids.add(o.id); if (antes && !antes.has(o.id)) o.cd = Math.max(o.cd, 0.15 + R() * 0.45);
    }
    f = q.frente = { t: j.t, ids };
  }
  return f.ids.has(m.id);
}
/** El que espera su hueco: cierra el corro a 3 o 4 casillas del héroe, lo ronda despacio y no le quita la cara. */
function rondar(j: Juego, m: Monstruo, obj: Ent, d: number, dt: number, lento: number) {
  const rr = 3.1 + (m.id % 4) * 0.45, giro = (m.id % 2 ? 1 : -1) * 0.22;
  const a = Math.atan2(m.y - obj.y, m.x - obj.x) + giro;
  const tx = obj.x + Math.cos(a) * rr, ty = obj.y + Math.sin(a) * rr;
  if ((d > rr + 0.5 || d < rr - 0.7 || ((m.id + Math.floor(j.t * 0.5)) % 3 === 0)) && lineaPasable(j.zona, m.x, m.y, tx, ty)) {
    moverHacia(j, m, tx, ty, m.vel * lento * (d > rr + 0.5 ? 0.9 : 0.45), dt); m.acc = 'caminar';
  } else if (d > rr + 1.5) avanzar(j, m, obj, dt, lento);
  else { m.acc = 'quieto'; }
  if (m.acc === 'quieto') m.dir = dirDe(obj.x - m.x, obj.y - m.y);
}
/** Cuántos caminos se pueden calcular todavía en este cuadro (con 40 enemigos persiguiendo, de a muchos frenaba). */
let presCam = { t: -1, n: 0 };
function caminosLibres(j: Juego) { if (presCam.t !== j.t) presCam = { t: j.t, n: 0 }; return presCam.n++ < 8; }
let presFondo = -1;
function caminoFondo(j: Juego) { if (presFondo === j.t) return false; presFondo = j.t; return true; }
/** El cuerpo no se mete en el muro: con el centro a menos de 0,3 de una celda bloqueada vecina, se corre hacia afuera. */
function apartarDeMuros(z: Zona, e: Ent) {
  const R0 = 0.3, cx = Math.floor(e.x), cy = Math.floor(e.y), fx = e.x - cx, fy = e.y - cy;
  let nx = e.x, ny = e.y;
  if (fx < R0 && !pasable(z, cx - 1, cy + 0.5)) nx = cx + R0; else if (fx > 1 - R0 && !pasable(z, cx + 1, cy + 0.5)) nx = cx + 1 - R0;
  if (fy < R0 && !pasable(z, cx + 0.5, cy - 1)) ny = cy + R0; else if (fy > 1 - R0 && !pasable(z, cx + 0.5, cy + 1)) ny = cy + 1 - R0;
  if ((nx !== e.x || ny !== e.y) && pasable(z, nx, ny)) { e.x = nx; e.y = ny; }
  // (entrega 10) las esquinas que salen (los salientes de roca de las minas, las puntas de los muros): con la celda de al lado
  // libre y la de la diagonal no, el cuerpo podía quedar pegado al vértice. Se aparta de él a lo largo de la diagonal.
  if ((globalThis as any).__esquinaVieja) return;
  const bx = Math.floor(e.x), by = Math.floor(e.y), gx = e.x - bx, gy = e.y - by;
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    if ((dx < 0 ? gx : 1 - gx) >= R0 || (dy < 0 ? gy : 1 - gy) >= R0) continue;
    if (pasable(z, bx + dx + 0.5, by + dy + 0.5)) continue;
    const qx = bx + (dx > 0 ? 1 : 0), qy = by + (dy > 0 ? 1 : 0), d = Math.hypot(e.x - qx, e.y - qy);
    if (d >= R0) continue;
    const ux = d > 1e-6 ? (e.x - qx) / d : -dx * Math.SQRT1_2, uy = d > 1e-6 ? (e.y - qy) / d : -dy * Math.SQRT1_2, mx = qx + ux * R0, my = qy + uy * R0;
    if (pasable(z, mx, my)) { e.x = mx; e.y = my; }
  }
}
/**
 * (entrega 7) Los huecos del corro que ya tomó alguien: cada uno que va rodeando a los otros cuerpos reserva el suyo hasta que
 * llega, lo cambia, se aleja, muere o pasan 1,5 s sin renovarlo. Vive en el objetivo (no se guarda nada).
 */
type Reserva = { m: Monstruo; x: number; y: number; t: number };
function huecosDe(j: Juego, obj: Ent): Reserva[] {
  const q = obj as any, L: Reserva[] = (q.huecosCorro ??= []);
  for (let i = L.length - 1; i >= 0; i--) { const r = L[i]; if (r.m.muerto || j.t - r.t > 1.5 || j.t < r.t || (r.m as any).huecoR !== r || r.m.objetivo !== obj) L.splice(i, 1); }
  return L;
}
/**
 * (entrega 7) El hueco al que vale la pena ir: el de `rodeoCuerpos` con las reservas de los demás, siempre que el rodeo no sea
 * una vuelta entera al corro (a lo sumo 1,6 veces lo que falta en línea recta más 2,5 casillas). Un zombi que se iba 12 casillas
 * por detrás del montón tardaba 10 s y se leía como uno que se aleja; esperar su turno detrás de los que pegan es lo que se ve
 * bien. Lo usa `avanzar` y lo mira t1011 (el que no tiene hueco aceptable espera su turno, no está atascado).
 */
export function rodeoAceptable(j: Juego, m: Monstruo, obj: Ent) {
  const q = m as any, r = rodeoCuerpos(j, m, obj, true, q.rodeando && !(window as any).__huecoSalta ? q.hueco : null); q.rodeoCrudo = r; if (!r) return null;
  let l = 0, x = m.x, y = m.y; for (const [a, b] of r.camino) { l += Math.hypot(a - x, b - y); x = a; y = b; }
  // (entrega 9: la paciencia empieza antes y crece más rápido: desde 0,5 s de espera 16 casillas más por segundo, hasta 26 casillas
  //  de camino. Con lo de la entrega 8 había quien miraba al héroe 3 a 5 s con un hueco libre a 12 a 20 casillas; ahora a los 1,7 s
  //  a lo sumo ya va por él. Lo que queda más lejos que eso no se camina: ronda hacia el hueco (`rondaHueco`). `__colaE8` vuelve a lo de antes)
  //  El que ya iba rodeando hacia un hueco y se lo tomó otro acepta de una 10 casillas más: ya está en marcha alrededor del corro, y
  //  si no, volvía al camino de siempre hacia el montón, se trababa y esperaba otra vez (2 a 2,5 s sin acercarse, a3_templo2)
  if (!(window as any).__colaE8 && !(window as any).__colaE7) { const b9 = Math.hypot(m.x - obj.x, m.y - obj.y) * 1.6 + 2.5 + (q.rodeando && q.hueco ? 10 : 0); return l <= Math.max(b9, Math.min(26, b9 + Math.max(0, ((q.tEspH ?? 0) - 0.5) * 16))) ? r : null; }
  // (entrega 8: el que ya lleva rato esperando acepta un rodeo más largo: a partir de 1,2 s de espera, 8 casillas más por
  //  segundo, hasta 18, y nunca más de 16 casillas de camino (24 pasados 2,5 s de espera). Antes había quien esperaba parado
  //  4 a 6 s con un hueco libre a 10 casillas de camino; mirar al héroe un par de segundos se lee bien, más no. `__colaE7`
  //  vuelve a lo de la entrega 7)
  const extra = (window as any).__colaE7 ? 0 : Math.min(18, Math.max(0, ((q.tEspH ?? 0) - 1.2) * 8));
  const base = Math.hypot(m.x - obj.x, m.y - obj.y) * 1.6 + 2.5;
  return l <= ((window as any).__colaE7 ? base : Math.max(base, Math.min(base + extra, (q.tEspH ?? 0) > 2.5 ? 24 : 16))) ? r : null;
}
/** (entrega 7) ¿Tiene otro cuerpo pegado delante, entre él y el objetivo? Así empieza a rodear al toque en vez de empujar un segundo
 * entero hasta contar como trabado (era lo que lo dejaba atrás en la cuenta de t1011). */
function cuerpoDelante(j: Juego, m: Monstruo, obj: Ent, holgura = 0.5) {
  const dx = obj.x - m.x, dy = obj.y - m.y, l = Math.hypot(dx, dy) || 1, ux = dx / l, uy = dy / l;
  for (const o of j.monstruos) {
    if (o === m || o.muerto) continue;
    const ox = o.x - m.x, oy = o.y - m.y, a = ox * ux + oy * uy; if (a <= 0 || a > m.radio + o.radio + holgura || a > l) continue;
    if (Math.abs(ox * uy - oy * ux) < (m.radio + o.radio) * 0.9) return true;
  }
  return false;
}
/** (entrega 8) ¿Hay alguien pegándole ya al objetivo? Sin eso, esperar turno no tiene sentido. */
function corroOcupado(j: Juego, m: Monstruo, obj: Ent) {
  // (a tiro de golpe: el alcance es radio + radio + 0,75, o 0,95 los de área; los que esperan a 2 casillas no cuentan, si no
  //  un anillo de los que esperan se esperaba a sí mismo sin que nadie pegara; y solo los que van por el mismo objetivo: el perro
  //  o Thor pegados al héroe no son su corro)
  return j.monstruos.some((o) => o !== m && !o.muerto && o.objetivo === obj && dist(o.x, o.y, obj.x, obj.y) <= o.radio + obj.radio + 1.0);
}
/**
 * (entrega 9) Un sitio libre del aro de golpe que la búsqueda entre los cuerpos no alcanza (queda fuera de su grilla de 13 x 13: en
 * las islas de a7_islas2 se llega por un puente). 24 rumbos alrededor del objetivo, donde cabe el cuerpo, se ve desde el objetivo y
 * no hay otro cuerpo ni un hueco tomado. Solo dice hacia dónde rondar, no por dónde ir.
 */
function huecoEnAro(j: Juego, m: Monstruo, obj: Ent): [number, number] | null {
  const z = j.zona, r = m.radio + obj.radio + 0.55, am = Math.atan2(m.y - obj.y, m.x - obj.x), res = huecosDe(j, obj);
  let mejor: [number, number] | null = null, bd = 9;
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2, x = obj.x + Math.cos(a) * r, y = obj.y + Math.sin(a) * r;
    if (!pasable(z, x, y) || !pasable(z, x - 0.35, y) || !pasable(z, x + 0.35, y) || !pasable(z, x, y - 0.35) || !pasable(z, x, y + 0.35) || !lineaPasable(z, obj.x, obj.y, x, y)) continue;
    if (j.monstruos.some((o) => o !== m && !o.muerto && dist(o.x, o.y, x, y) < o.radio + m.radio) || res.some((v) => v.m !== m && dist(v.x, v.y, x, y) < v.m.radio + m.radio)) continue;
    let dif = Math.abs(a - am); if (dif > Math.PI) dif = Math.PI * 2 - dif;
    if (dif < bd) { bd = dif; mejor = [x, y]; }
  }
  return mejor;
}
/**
 * (entrega 9) El que espera con un hueco libre que queda muy lejos de camino (más de 26 casillas: la vuelta entera al corro por
 * detrás de un muro) no se queda clavado: camina despacio por el aro de espera hacia el lado del hueco, a la distancia a la que
 * está, entre 3 y 3,8 casillas (el que quedó apretado más cerca se abre hacia allá). Si topa con un muro o un cuerpo, da la vuelta; pasado el hueco, también. Devuelve si se movió.
 */
function rondaHueco(j: Juego, m: Monstruo, obj: Ent, hueco: [number, number], dt: number, lento: number) {
  const q = m as any, z = j.zona, d = dist(m.x, m.y, obj.x, obj.y), am = Math.atan2(m.y - obj.y, m.x - obj.x), ah = Math.atan2(hueco[1] - obj.y, hueco[0] - obj.x);
  let dif = ah - am; while (dif > Math.PI) dif -= Math.PI * 2; while (dif < -Math.PI) dif += Math.PI * 2;
  if (!q.rondaS) { q.rondaS = dif >= 0 ? 1 : -1; q.rondaT = 0; }
  q.rondaT += dt;
  // (pasado el hueco por más de 0,4 rad, de vuelta; nunca antes de 1,2 s en un sentido: no tiembla)
  if (q.rondaT > 1.2 && dif * q.rondaS < -0.4) { q.rondaS = -q.rondaS; q.rondaT = 0; }
  // (el aro de espera es de 3 a 3,8 casillas: el que quedó apretado a 2 casillas entre los que pegan primero se abre hacia allá)
  const rr = clamp(d, 3, 3.8), libre = (tx: number, ty: number) => pasable(z, tx, ty) && lineaPasable(z, m.x, m.y, tx, ty) && !j.monstruos.some((o) => o !== m && !o.muerto && dist(o.x, o.y, tx, ty) < o.radio + m.radio);
  const cand: [number, number][] = [];
  for (const s of [q.rondaS, -q.rondaS]) { const a = am + s * (0.6 / Math.max(d, 1)); cand.push([obj.x + Math.cos(a) * rr, obj.y + Math.sin(a) * rr]); }
  if (d < 2.85) cand.push([obj.x + Math.cos(am) * rr, obj.y + Math.sin(am) * rr]); // (abrirse hasta el aro; ya en él no es moverse: caminaba en el sitio)
  for (let i = 0; i < cand.length; i++) {
    const [tx, ty] = cand[i]; if (!libre(tx, ty)) continue;
    if (i === 0) q.rondaB = 0; else { q.rondaB = (q.rondaB ?? 0) + dt; if (i === 1 && q.rondaB > 0.35 && q.rondaT > 0.6) { q.rondaS = -q.rondaS; q.rondaT = 0; q.rondaB = 0; } else if (i === 1) continue; }
    moverHacia(j, m, tx, ty, m.vel * lento * 0.45, dt); m.acc = 'caminar'; return true;
  }
  q.rondaB = (q.rondaB ?? 0) + dt;
  if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto';
  girarHacia(m, obj.x - m.x, obj.y - m.y, dt, sensacionDe(m).giro);
  return false;
}
function soltarHueco(m: Monstruo) { const q = m as any; if (q.huecoR) { q.huecoR.t = -99; q.huecoR = null; } }
/**
 * (entrega 6) Por dónde llega un cuerpo a pegarle a `obj` contando a los otros cuerpos, no solo los muros: una búsqueda a lo
 * ancho en una grilla de media casilla de 13 x 13 casillas alrededor del objetivo, donde cada otro cuerpo es un disco que no
 * se pisa. La meta es cualquier punto del aro de golpe (sin muro entre el objetivo y él). Devuelve el hueco y el camino, o null
 * si el corro está lleno. Lo usa `avanzar` y lo mira t1011.
 */
export function rodeoCuerpos(j: Juego, m: Monstruo, obj: Ent, reservas = false, prefer?: [number, number] | null): { hueco: [number, number]; camino: [number, number][] } | null {
  // (entrega 9: la grilla pasa de 13 x 13 a 20 x 20 casillas: con 13 el hueco a 18 casillas de camino por detrás de un pilar quedaba
  //  afuera y el que lo tenía rondaba sin ir nunca; la paciencia acepta hasta 26 casillas, así que la grilla tiene que verlas)
  const anchoAro = !(window as any).__colaE8;
  const z = j.zona, R0 = 0.5, N = anchoAro ? 41 : 27, ox = obj.x - (N - 1) * R0 / 2, oy = obj.y - (N - 1) * R0 / 2, r0 = m.radio + obj.radio + 0.35;
  const otros: { x: number; y: number; radio: number }[] = j.monstruos.filter((o) => o !== m && !o.muerto && Math.abs(o.x - obj.x) < (anchoAro ? 11.5 : 8) && Math.abs(o.y - obj.y) < (anchoAro ? 11.5 : 8));
  // (entrega 7) los huecos que ya tomó otro que viene en camino cuentan como ocupados: así dos no se pelean el mismo
  if (reservas) for (const r of huecosDe(j, obj)) if (r.m !== m) otros.push({ x: r.x, y: r.y, radio: r.m.radio });
  const libre = new Uint8Array(N * N);
  for (let gy = 0; gy < N; gy++) for (let gx = 0; gx < N; gx++) {
    const x = ox + gx * R0, y = oy + gy * R0;
    if (!pasable(z, x, y) || !pasable(z, x - 0.35, y) || !pasable(z, x + 0.35, y) || !pasable(z, x, y - 0.35) || !pasable(z, x, y + 0.35) || Math.hypot(x - obj.x, y - obj.y) < r0 - 0.3) continue;
    if (otros.some((o) => Math.hypot(o.x - x, o.y - y) < o.radio + m.radio)) continue; // (sin apretarse: por donde no pasa entero, no pasa)
    libre[gy * N + gx] = 1;
  }
  const sx = Math.round((m.x - ox) / R0), sy = Math.round((m.y - oy) / R0); if (sx < 0 || sy < 0 || sx >= N || sy >= N) return null;
  const padre = new Int32Array(N * N).fill(-2), hondo = new Int16Array(N * N), cola = [sy * N + sx]; padre[sy * N + sx] = -1;
  // (entrega 7: con `prefer`, el hueco que ya tenía gana si queda a lo sumo 3 pasos más lejos que el más cercano: cada medio
  //  segundo los cuerpos se corren un poco y el más cercano saltaba de un lado al otro del corro; el que rodeaba daba media vuelta)
  const armar = (i: number) => { const x = ox + (i % N) * R0, y = oy + Math.floor(i / N) * R0, camino: [number, number][] = []; for (let c = i; c >= 0; c = padre[c]) camino.push([ox + (c % N) * R0, oy + Math.floor(c / N) * R0]);
    camino.reverse(); camino.shift();
    return { hueco: [x, y] as [number, number], camino: reservas ? camino : camino.filter((_, n) => n % 2 === 1 || n === camino.length - 1) }; };
  // (entrega 9: la meta es todo el aro desde donde se pega, radio + radio + 0,7 (el golpe llega a 0,75). Con 0,65 el que quedaba a
  //  2,2 del héroe esperaba quieto con un sitio libre a 1,5 desde donde podía pegar: la búsqueda no lo veía como hueco)
  let primero = -1;
  for (let k = 0; k < cola.length; k++) {
    const i = cola[k], gx = i % N, gy = (i - gx) / N, x = ox + gx * R0, y = oy + gy * R0, d = Math.hypot(x - obj.x, y - obj.y);
    if (primero >= 0 && hondo[i] > hondo[primero] + 3) return armar(primero);
    if (k > 0 && d <= r0 + (anchoAro ? 0.35 : 0.3) && lineaPasable(z, obj.x, obj.y, x, y)) {
      if (!prefer || Math.hypot(x - prefer[0], y - prefer[1]) < 0.8) return armar(i);
      if (primero < 0) primero = i;
    }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      const X = gx + dx, Y = gy + dy; if (X < 0 || Y < 0 || X >= N || Y >= N) continue; const jn = Y * N + X;
      if (padre[jn] !== -2 || !libre[jn]) continue;
      // (sin cortar esquinas; entrega 9: salvo al salir de donde está, que casi nunca es un punto libre de la grilla porque está pegado a
      //  los cuerpos o al muro: con la regla también ahí, el que quedaba apretado en un rincón no veía la salida en diagonal y esperaba
      //  quieto con un hueco a 3 casillas)
      if (dx && dy && (k > 0 || !anchoAro) && (!libre[gy * N + X] || !libre[Y * N + gx])) continue;
      padre[jn] = i; hondo[jn] = hondo[i] + 1; cola.push(jn);
    }
  }
  return primero >= 0 ? armar(primero) : null;
}
function avanzar(j: Juego, m: Monstruo, obj: Ent, dt: number, lento: number) {
  // rodear: cada uno apunta a un punto alrededor del objetivo
  const ang = (m.id * 2.39996) % (Math.PI * 2);
  // (entrega 6: con histéresis. A unas 3 casillas el punto del corro aparecía y desaparecía cuadro a cuadro; el camino se
  //  rehacía cada 0,6 s hacia uno u otro, y detrás de un muro chico eran dos rodeos distintos: el cuerpo iba y venía sin
  //  llegar nunca, el atascado de siempre de t1011)
  const dh = dist(m.x, m.y, obj.x, obj.y), qh = m as any;
  if ((window as any).__colaVieja) qh.corro = dh < 3; else if (dh < 3) qh.corro = true; else if (dh > 3.8) qh.corro = false;
  const off = qh.corro ? 0.9 : 0;
  let tx = obj.x + Math.cos(ang) * off, ty = obj.y + Math.sin(ang) * off;
  // (entrega 7: con el héroe pegado a un muro, el punto del corro podía caer dentro del muro o del otro lado: el camino de la
  //  grilla llevaba al cuerpo a rodear el muro hasta la cara de atrás, donde no se llega, y volvía; así iba y venía en
  //  a7_islas2. Si el punto no se ve desde el objetivo con el cuerpo entero, apunta al objetivo)
  if (off && !(window as any).__colaE6 && !lineaPasable(j.zona, obj.x, obj.y, tx, ty)) { tx = obj.x; ty = obj.y; }
  // (entrega 6: t1011 daba 1 o 2 atascados por corrida, siempre igual: a 3 casillas del héroe pegado a un muro chico, con el
  //  lado que da a este cuerpo ya lleno de otros. El camino de la grilla no ve los cuerpos: rodeaba el muro por un lado, se
  //  topaba con los que ya pegaban, rehacía el camino por el otro lado y así, caminando sin llegar nunca. Trabado o sin
  //  acercarse cerca del héroe, busca por dónde pasar entre muros Y cuerpos (`rodeoCuerpos`) hasta un hueco libre alrededor
  //  del héroe y apunta ahí; si no hay ninguno (el corro está lleno), espera quieto su turno en vez de empujar. `__colaVieja`
  //  vuelve a lo de antes)
  // (entrega 7: lo que quedaba de la entrega 6 era el que tenía hueco del otro lado del corro: apuntaba al hueco pero iba por la
  //  línea recta o por el camino de la grilla, que pasan por encima de los cuerpos que ya pegan, y empujaba en vez de rodear.
  //  Seguir el camino de `rodeoCuerpos` lo empeoraba porque los que hacían cola se peleaban el mismo hueco. Ahora cada uno
  //  RESERVA su hueco (`huecosDe`: los de los demás cuentan como cuerpos en la búsqueda), sigue paso a paso el camino que
  //  rodea a los cuerpos y lo rehace cada medio segundo; el que no tiene hueco libre espera quieto mirando (`esperaH`: antes
  //  se llamaba `espera`, como la de la escolta, y `pelear` la borraba en el cuadro siguiente: el que debía esperar empujaba).
  //  `__colaE6` vuelve a lo de la entrega 6)
  let sigueRodeo: [number, number][] | null = null;
  { const q = m as any, e7 = !(window as any).__colaE6;
    const dh2 = dist(m.x, m.y, obj.x, obj.y), libreDeFlags = !(window as any).__colaVieja && !(window as any).__sinRodeo && !(window as any).__atascoViejo;
    // (entrega 9: "ya llegó" es estar a tiro de golpe, radio + radio + 0,75 (0,72 con margen). Con 0,9 el que quedaba a 1,6 o 1,7 del
    //  héroe, detrás de los que pegan, se daba por llegado: caminaba en el sitio contra ellos sin pegar nunca y sin buscar hueco)
    const llego = m.radio + obj.radio + ((window as any).__colaE8 ? 0.9 : 0.72);
    if (dh2 <= llego) { q.cola = 0; q.hueco = null; q.esperaH = false; q.tEspH = 0; q.rodeoC = null; q.rodeando = false; soltarHueco(m); } // (ya llegó: fuera de la cola)
    else if (libreDeFlags && (e7 ? (q.rodeando && dh2 < (q.porLejos ? 12 : 7)) || (qh.corro && dh2 < 3.8 && !(window as any).__colaE8) || ((q.trabado >= 2 || q.cola || (dh2 < ((window as any).__colaE7 ? 4.5 : 5.5) && cuerpoDelante(j, m, obj))) && dh2 < 5.5) : (q.trabado >= 2 || q.cola) && dh2 < 5.5)) {
      // (entrega 9: ya en el corro, a menos de 3,8, va siempre al hueco libre más cercano entre los cuerpos y no a su punto fijo del aro:
      //  el punto fijo podía caer del otro lado del héroe y el cuerpo le daba la vuelta pegado, pasaba de largo el hueco libre y volvía,
      //  a4_barbaro)
      // (entrega 7: el que entra a rodear se queda rodeando hasta llegar o hasta que el héroe se le vaya a más de 7: antes, al
      //  alejarse un poco por el rodeo dejaba de estar "en cola", volvía al camino de la grilla hacia el montón y así iba y venía)
      if (e7) q.rodeando = true;
      q.tRodeo = (q.tRodeo ?? 0) - dt;
      // (entrega 9: si mientras espera ya nadie le pega al objetivo, se vuelve a mirar en este mismo cuadro: sin corro no hay turno)
      if (q.esperaH && !(window as any).__colaE8 && !corroOcupado(j, m, obj)) q.tRodeo = 0;
      if (q.tRodeo <= 0) {
        q.tCam = 0;
        if (e7) {
          q.tRodeo = 0.5;
          const r = rodeoAceptable(j, m, obj);
          // (entrega 9: el rodeo que de golpe sale mucho más largo que lo que le quedaba (4 casillas o más) suele ser un cuerpo que pasa
          //  por el paso angosto que iba a tomar: aguanta quieto hasta 0,75 s a que se despeje en vez de salir por la vuelta larga; si no,
          //  daba la vuelta larga, el paso se abría y volvía, de acá para allá, a1_abadia2)
          const largoDe = (c: [number, number][]) => { let l = 0, x = m.x, y = m.y; for (const [a, b] of c) { l += Math.hypot(a - x, b - y); x = a; y = b; } return l; };
          // (entrega 9: el camino que ya lleva sigue valiendo si nadie lo pisa: con el mismo hueco no se cambia por otro que sea apenas más
          //  corto (3 casillas o menos). Los cuerpos que se mecen abrían y cerraban un paso angosto y el camino saltaba de un lado al otro
          //  del corro, a1_abadia2)
          const e9 = !(window as any).__colaE8, sigueLibre = (c: [number, number][]) => c.every(([x, y]) => pasable(j.zona, x, y) && !j.monstruos.some((o) => o !== m && !o.muerto && dist(o.x, o.y, x, y) < o.radio + m.radio - 0.05));
          const viejoVale = e9 && !!r && q.rodeando && q.hueco && q.rodeoC && q.rodeoC.length > 0 && Math.hypot(r.hueco[0] - q.hueco[0], r.hueco[1] - q.hueco[1]) < 0.8 && sigueLibre(q.rodeoC);
          const sigueViejo = viejoVale && largoDe(q.rodeoC) <= largoDe(r!.camino) + 3;
          const aguanta = !!r && e9 && !viejoVale && q.rodeando && q.rodeoC && q.rodeoC.length && (q.tAguanta ?? 0) < 0.75 && largoDe(r.camino) > largoDe(q.rodeoC) + 4 && corroOcupado(j, m, obj);
          if (aguanta) { q.tAguanta = (q.tAguanta ?? 0) + 0.25; q.tRodeo = 0.25; q.aguantaHasta = j.t + 0.3; q.esperoT = j.t; m.camino = null; if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto'; girarHacia(m, obj.x - m.x, obj.y - m.y, dt, sensacionDe(m).giro); return; }
          q.tAguanta = 0; q.aguantaHasta = -9;
          if (r) {
            let rv: Reserva | null = q.huecoR; if (!rv) { rv = { m, x: 0, y: 0, t: 0 }; q.huecoR = rv; } rv.x = r.hueco[0]; rv.y = r.hueco[1]; rv.t = j.t;
            const L = huecosDe(j, obj); if (!L.includes(rv)) L.push(rv);
            q.hueco = r.hueco; if (!sigueViejo) q.rodeoC = r.camino; q.esperaH = false; q.rondaS = 0; q.porLejos = false;
          }
          // (entrega 9: el que ya está rondando hacia un hueco lejano sigue en la espera aunque al moverse deje de contar como trabado:
          //  si no, volvía al montón, se trababa otra vez y así iba y venía)
          else if (!(window as any).__colaE8 && q.esperaH && q.rondaS && corroOcupado(j, m, obj)) { soltarHueco(m); q.hueco = null; q.rodeoC = null; }
          // (entrega 9: el que iba rodeando hacia su hueco y en esta vuelta no lo encuentra (se lo tomaron, o un cuerpo que pasa le tapa la
          //  salida un instante) se queda en la espera con la paciencia que juntó, no vuelve al montón: antes la perdía, volvía al camino de
          //  siempre, se trababa y esperaba de nuevo desde cero (a5_abismo1: iba y venía 2 s sin acercarse)
          else if (!(window as any).__colaE8 && q.rodeando && q.hueco && corroOcupado(j, m, obj)) { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = true; }
          else if ((q.trabado >= 2 || q.cola) && ((window as any).__colaE7 || corroOcupado(j, m, obj))) { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = true; }
          // (entrega 8: sin nadie pegando al objetivo no hay turno que esperar: si la búsqueda entre los cuerpos no da (el hueco
          //  queda fuera de su grilla, como en las islas de a7_islas2, donde hay que dar la vuelta por un puente), va por el camino
          //  de siempre. Antes esperaba parado con el corro vacío hasta el final)
          else if (q.trabado >= 2 || q.cola) { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = false; q.rodeando = false; q.cola = 0; q.tEspH = 0; }
          // (entrega 8: el que no tiene rodeo y ya tiene el cuerpo de otro pegado delante, con el corro ocupado, espera mirando: antes
          //  seguía "arrimándose" y caminaba en el sitio contra la espalda del otro hasta 1,5 s, hasta contar como trabado)
          // (entrega 9: el que ya está a menos de 4, con el corro ocupado y un hueco libre que solo queda lejos de camino, no se mete en el
          //  montón a esperar ahí: espera (y junta paciencia) desde donde está. Antes caminaba hasta pegarse a la espalda del de adelante,
          //  esperaba ahí y después volvía sobre sus pasos por la vuelta larga, a3_nido)
          else if (!(window as any).__colaE8 && q.rodeoCrudo && dh2 < 4 && corroOcupado(j, m, obj)) { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = true; }
          else if (!(window as any).__colaE7 && cuerpoDelante(j, m, obj, 0.15) && corroOcupado(j, m, obj)) { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = true; }
          // (si entró solo porque tenía un cuerpo pegado delante y no hay rodeo que valga, sigue como siempre: se arrima al
          //  montón detrás de los que pegan. Esperar quieto es solo para el que ya está trabado o en cola)
          else { soltarHueco(m); q.hueco = null; q.rodeoC = null; q.esperaH = false; q.rodeando = false; q.tEspH = 0; }
          // (entrega 9: el que espera vuelve a mirar cada cuarto de segundo: con medio segundo el hueco que ya valía esperaba otro tanto)
          if (!q.esperaH) q.porLejos = false;
          if (q.esperaH && !(window as any).__colaE8) { q.tRodeo = 0.25; q.huecoLejos = q.rodeoCrudo ? q.rodeoCrudo.hueco : huecoEnAro(j, m, obj); }
        } else { q.tRodeo = 0.8; const r = rodeoCuerpos(j, m, obj); q.hueco = r ? r.hueco : null; q.esperaH = !r; }
      }
      // (la paciencia que juntó esperando no se pierde al echar a andar por el rodeo largo: si se borrara, en la vuelta siguiente
      //  el mismo rodeo ya no valía y volvía a pararse, y así iba y venía; se borra al llegar o al dejar de rodear)
      // (entrega 9: con un hueco libre que queda lejos de camino, desde 1,4 s de espera no se queda clavado: ronda hacia ese lado del
      //  corro, en el aro de espera (3 a 3,8 casillas), mirando al héroe al pararse; si topa, da la vuelta. Mientras ronda vuelve a
      //  mirar el rodeo, que se acorta al acercarse al hueco y entonces lo toma)
      //  Si no hay aro por donde rondar (en las islas el aro de espera cae sobre el vacío) y lleva 0,6 s sin poder moverse, va por el
      //  camino largo de los muros hacia ese hueco: mejor la vuelta que quedarse clavado (a7_islas1 esperaba 4 s)
      if (q.esperaH && q.huecoLejos && (q.tEspH ?? 0) >= 1.4 && !(window as any).__colaE8) {
        q.tEspH += dt;
        if (!q.porLejos && rondaHueco(j, m, obj, q.huecoLejos, dt, lento)) { m.camino = null; return; }
        if (!q.porLejos && (q.rondaB ?? 0) <= 0.6) { m.camino = null; q.esperoT = j.t; return; }
        q.porLejos = true; tx = q.huecoLejos[0]; ty = q.huecoLejos[1];
      }
      else if (q.esperaH) { q.rondaS = 0; q.tEspH = (q.tEspH ?? 0) + dt; q.esperoT = j.t; m.camino = null; if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto'; girarHacia(m, obj.x - m.x, obj.y - m.y, dt, sensacionDe(m).giro); return; }
      // (mientras aguanta a que se despeje el paso, también entre vistazo y vistazo: si no, seguía empujando por el camino tapado)
      if (!(window as any).__colaE8 && (q.aguantaHasta ?? -9) > j.t) { m.camino = null; if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto'; girarHacia(m, obj.x - m.x, obj.y - m.y, dt, sensacionDe(m).giro); return; }
      if (q.hueco) { tx = q.hueco[0]; ty = q.hueco[1]; }
      if (e7 && q.rodeoC && q.rodeoC.length) sigueRodeo = q.rodeoC;
    } else if (!q.trabado && !q.cola) { q.hueco = null; q.esperaH = false; q.tEspH = 0; q.rodeoC = null; q.rodeando = false; soltarHueco(m); }
    // (¿se acerca? el que va y viene entre dos rodeos se mueve y nunca se contaba como trabado: cada 1,5 s, si a menos de 5,5
    //  casillas no se acercó ni 0,3 al héroe, queda en cola hasta que se acerque 0,6)
    if (!(window as any).__colaVieja && !(window as any).__atascoViejo) {
      q.tAcerca = (q.tAcerca ?? 1.5) - dt;
      if (q.tAcerca <= 0) { const d = dist(m.x, m.y, obj.x, obj.y); if (q.dAcerca !== undefined && d < 5.5 && d > llego && q.dAcerca - d < 0.3) q.cola = (q.cola ?? 0) + 1; else if (q.dAcerca !== undefined && q.dAcerca - d >= 0.6) q.cola = 0; q.dAcerca = d; q.tAcerca = 1.5; }
      if (dist(m.x, m.y, obj.x, obj.y) > 7) q.cola = 0;
    }
  }
  // de lejos se lanza a la carrera (si su animación la tiene; si no, camina igual)
  const lejos = m.vel >= 2.6 && dist(m.x, m.y, obj.x, obj.y) > 3.5;
  if ((window as any).__atascoViejo) {
  if (m.camino && m.camino.length) {
    const [cx, cy] = m.camino[0];
    if (moverHacia(j, m, cx, cy, m.vel * lento, dt)) m.camino.shift();
    m.acc = lejos ? 'correr' : 'caminar';
    if (m.pensar <= 0.05) m.camino = null;
  } else if (lineaLibre(j.zona, m.x, m.y, tx, ty)) {
    moverHacia(j, m, tx, ty, m.vel * lento, dt); m.acc = lejos ? 'correr' : 'caminar';
  } else if (m.pensar <= 0.1) {
    m.camino = buscarCamino(j.zona, m.x, m.y, tx, ty, 900);
  }
  } else {
    // (Rick, 20 nov 2026: "los enemigos quedan como atorados en las paredes". El camino para rodear un muro se borraba a
    // los 50 ms de calcularse y no se volvía a pedir hasta el próximo pensar (0,5 a 0,9 s): detrás de un muro se quedaban
    // parados casi todo el tiempo. Y el paso directo miraba una línea de un punto, que se pega a las esquinas: el cuerpo se
    // trababa contra el canto. Ahora va directo solo si pasa el cuerpo entero, el camino dura hasta que se gasta o hasta
    // 0,7 s (se rehace con el héroe en otro lado), y si en medio segundo no avanzó se pide otro al toque.)
    const q = m as any, z = j.zona;
    q.tCam = (q.tCam ?? 0) - dt;
    // ¿avanza? cada medio segundo mira cuánto se movió
    q.tProg = (q.tProg ?? 0) - dt;
    if (q.tProg <= 0) { const mov = q.px === undefined ? 1 : Math.hypot(m.x - q.px, m.y - q.py); q.px = m.x; q.py = m.y; q.tProg = 0.5; if (mov < 0.15) { q.tCam = 0; q.trabado = (q.trabado ?? 0) + 1; } else q.trabado = 0; }
    const directo = lineaPasable(z, m.x, m.y, tx, ty);
    if (sigueRodeo) {
      // (el camino que rodea a los cuerpos, de media casilla en media casilla: se salta lo que ya quedó atrás)
      while (sigueRodeo.length > 1 && Math.hypot(sigueRodeo[0][0] - m.x, sigueRodeo[0][1] - m.y) < 0.35) sigueRodeo.shift();
      m.camino = null; const [cx, cy] = sigueRodeo[0];
      if (moverHacia(j, m, cx, cy, m.vel * lento, dt)) sigueRodeo.shift();
      m.acc = 'caminar';
    } else if (directo) {
      m.camino = null; moverHacia(j, m, tx, ty, m.vel * lento, dt); m.acc = lejos ? 'correr' : 'caminar';
    } else {
      if ((!m.camino || !m.camino.length || q.tCam <= 0) && caminosLibres(j)) {
        // (trabado dos veces seguidas contra lo mismo: apunta a la celda libre del héroe, no al punto del corro)
        // (oleada 2: en las salas grandes de las mazmorras nuevas 1500 a 2500 nodos no alcanzaban para rodear un muro largo. El
        //  camino a medias llevaba al rincón más cercano al héroe, ahí se acababa, y el cuerpo iba y venía sin acumular
        //  "trabado": 9 de 3827 en t1011. `buscarCamino` avisa si el camino es parcial y entonces se busca a fondo, con montículo,
        //  una vez por cuadro en toda la pelea; ese camino largo se sigue 2,5 s. Si ni así llega, se reintenta cada 3 s)
        let c = q.trabado >= 2 && !q.hueco ? buscarCamino(z, m.x, m.y, obj.x, obj.y, 2500) : buscarCamino(z, m.x, m.y, tx, ty, 1500), fondo = false;
        if ((!c || (c as any).parcial) && (q.tFondo ?? 0) <= j.t && caminoFondo(j)) {
          const c2 = buscarCamino(z, m.x, m.y, obj.x, obj.y, 20000, true);
          if (c2 && !(c2 as any).parcial) { c = c2; fondo = true; } else q.tFondo = j.t + 3;
        }
        m.camino = c; q.tCam = fondo ? 2.5 : (!(window as any).__colaVieja && dist(m.x, m.y, obj.x, obj.y) < 6 ? 1.6 : 0.6) + R() * 0.2; // (entrega 6: cerca del héroe el rodeo elegido se sigue más tiempo: rehacerlo cada 0,6 s lo hacía ir y venir entre los dos lados de un muro chico)
        // (el primer punto puede quedar atrás: si ya se ve el segundo con el cuerpo entero, se salta)
        while (m.camino && m.camino.length > 1 && lineaPasable(z, m.x, m.y, m.camino[1][0], m.camino[1][1])) m.camino.shift();
      }
      if (m.camino && m.camino.length) {
        const [cx, cy] = m.camino[0];
        if (moverHacia(j, m, cx, cy, m.vel * lento, dt)) m.camino.shift();
        m.acc = lejos ? 'correr' : 'caminar';
      } else if (lineaLibre(z, m.x, m.y, tx, ty)) { moverHacia(j, m, tx, ty, m.vel * lento, dt); m.acc = lejos ? 'correr' : 'caminar'; }
      else if (m.acc === 'caminar' || m.acc === 'correr') m.acc = 'quieto';
    }
    apartarDeMuros(z, m);
  }
  // separarse de los otros
  for (const o of j.monstruos) {
    if (o === m || o.muerto) continue;
    const dx = m.x - o.x, dy = m.y - o.y, dd = Math.hypot(dx, dy), min = m.radio + o.radio;
    if (dd < min && dd > 0.001) { const k = (min - dd) * 0.5; const nx = m.x + (dx / dd) * k, ny = m.y + (dy / dd) * k; if (pasable(j.zona, nx, ny)) { m.x = nx; m.y = ny; } }
  }
  // (entrega 10) el empujón de los otros también puede arrimarlo al muro (el que está pegando no pasa por `avanzar`): se vuelve a
  // apartar después de separarse
  if (!(globalThis as any).__esquinaVieja) apartarDeMuros(j.zona, m);
}
function iniciarAtaque(j: Juego, m: Monstruo, obj: Ent, distancia: boolean) {
  m.dir = dirDe(obj.x - m.x, obj.y - m.y);
  const lanza = distancia && (m.def.ia === 'mago' || m.def.ia === 'invocador' || m.def.jefe) && (MONSTRUOS[m.def.id]?.ia !== 'distancia');
  m.acc = lanza && hayLanzar(m) ? 'lanzar' : 'atacar'; m.t = 0;
  // El golpe de cada uno dura lo que pesa: antes todos, del chacal al ogro, pegaban en 0,8 s con el impacto al 55 %.
  // Los livianos son secos (0,6 s, pegan pronto) y los pesados cargan largo y se les ve venir (hasta 1,05 s, impacto al 62 %).
  { const ps = sensacionDe(m).peso, kp = Math.max(0, Math.min(1, (ps - 0.7) / 1.1));
    m.dur = (m.def.jefe ? 0.9 : 0.6 + 0.45 * kp) / (m.mods.includes('rapido') ? 1.4 : 1); m.golpeEn = m.dur * (m.def.jefe ? 0.55 : 0.46 + 0.16 * kp); m.golpeo = false; }
  m.cd = (m.def.jefe || m.def.ia === 'jefe' ? entre(0.5, 1.1) : entre(0.9, 1.7)) + (distancia ? 0.6 : 0);
  (m as any).aDist = distancia; m.objetivo = obj;
}
const hayLanzar = (m: Monstruo) => !!(m.def.ia === 'mago' || m.def.ia === 'invocador' || m.def.jefe || m.def.id === 'cultista' || m.def.id === 'monja_hueca');
function golpeMonstruo(j: Juego, m: Monstruo) {
  const obj = m.objetivo; if (!obj || obj.muerto) return;
  const g: Golpe = { min: m.dano[0], max: m.dano[1], elem: 'fisico', deHeroe: !!m.dueno, fuente: m, extra: {} };
  if (m.def.elem && m.def.elem !== 'fisico') g.extra![m.def.elem] = (m.dano[0] + m.dano[1]) * 0.25;
  if (m.mods.includes('ardiente')) g.extra!.fuego = (g.extra!.fuego ?? 0) + m.dano[1] * 0.5;
  // los brutos y los jefes a veces te aturden un instante; el espectral pega con sombra
  if (m.mods.includes('fuerte') || m.def.jefe) g.aturdir = 6;
  if (m.mods.includes('espectral')) g.extra!.sombra = (g.extra!.sombra ?? 0) + m.dano[1] * 0.4;
  // maldito: sus golpes te roban maná y te vuelven lento
  if (m.mods.includes('maldito') && obj.tipo === 'heroe') { const hh = obj as Heroe; hh.mana = Math.max(0, hh.mana - hh.c.manaMax * 0.05); hh.frio = Math.max(hh.frio, 1.5); }
  if (m.mods.includes('helado')) g.extra!.frio = (g.extra!.frio ?? 0) + m.dano[1] * 0.4;
  if (m.mods.includes('electrico')) g.extra!.rayo = (g.extra!.rayo ?? 0) + m.dano[1] * 0.5;
  if (m.dueno) { g.sinFallo = true; g.precision = undefined; }
  if ((m as any).aDist && m.def.proyectil) {
    const e: Elemento = m.def.elem ?? 'fisico';
    const pg: Golpe = { ...g, elem: m.def.proyectil === 'flecha' || m.def.proyectil === 'lanza' ? 'fisico' : e, extra: {} };
    if (pg.elem !== 'fisico') { pg.min *= 1.1; pg.max *= 1.1; }
    const cnt = m.def.jefe ? 3 : 1;
    for (let k = 0; k < cnt; k++) { const a = Math.atan2(obj.y - m.y, obj.x - m.x) + (k - (cnt - 1) / 2) * 0.25; disparar(j, m, m.x + Math.cos(a) * 5, m.y + Math.sin(a) * 5, pg, usosPfx.mon.has(m.def.id) && m.def.proyectil !== 'flecha' ? 'pfx:' + usosPfx.mon.get(m.def.id) : efectoProy(m.def.proyectil), m.def.proyectil === 'flecha' ? 12 : m.def.id === 'monja_hueca' && m.nivel < 25 ? 5.5 : 8); }
    sonar(j, m.def.proyectil === 'flecha' ? 'flecha' : m.def.proyectil === 'hielo' ? 'hielo_lanzar' : m.def.proyectil === 'fuego' ? 'fuego_lanzar' : 'sombra', m.x, m.y, 0.7);
    return;
  }
  if (dist(m.x, m.y, obj.x, obj.y) > m.radio + obj.radio + 1.4 + (m.def.area ?? 0)) return;
  if (m.def.area) {
    efecto(j, 'onda_aterrizaje', obj.x, obj.y, 0, m.def.area / 1.5);
    j.sacudida = Math.max(j.sacudida, 0.25);
    for (const e of enemigosDe(j, !!m.dueno)) if (dist(e.x, e.y, obj.x, obj.y) < m.def.area) danar(j, e, g);
  } else danar(j, obj, g);
  if (m.mods.includes('vampiro')) m.vida = Math.min(m.vidaMax, m.vida + (m.dano[0] + m.dano[1]) * 0.3);
  if (m.dueno && m.invocaId === 'golem') { const h = j.heroe; h.vida = Math.min(h.vidaMax, h.vida + (m.dano[0] + m.dano[1]) * 0.2); }
  if (m.dueno && m.invocaId === 'halcon' && obj.tipo === 'monstruo') (obj as Monstruo).marca = Math.max((obj as Monstruo).marca ?? 0, 4);
  sonar(j, 'tajo', m.x, m.y, 0.5);
}

function actualizarProyectiles(j: Juego, dt: number) {
  for (const p of j.proyectiles) {
    habEnCurso = p.deHeroe ? (p.hab?.id ?? (p as any).habVivo ?? 'ataque') : null; deDonde = habEnCurso ? [p.x - p.vx * 0.06, p.y - p.vy * 0.06] : null;
    p.t += dt; p.vida -= dt;
    if (p.vida <= 0 && !p.arco) { if (p.explota && p.deHeroe) explotar(j, p); else chocar(j, p, false); continue; }
    if (p.arco) {
      const a = p.arco; a.t += dt;
      const k = Math.min(1, a.t / a.T);
      p.x = a.x0 + (a.x1 - a.x0) * k; p.y = a.y0 + (a.y1 - a.y0) * k; p.z = 30 + Math.sin(k * Math.PI) * 70;
      if (k >= 1) { explotar(j, p); p.vida = 0; if (a.n) for (let i = 0; i < a.n; i++) { const an = R() * Math.PI * 2, r = 1.5 + R() * 2; j.proyectiles.push({ ...p, golpeados: new Set(), vida: 9, arco: { x0: p.x, y0: p.y, x1: p.x + Math.cos(an) * r, y1: p.y + Math.sin(an) * r, t: -0.1 * i, T: 0.45, n: 0 }, dano: [p.dano[0] * 0.5, p.dano[1] * 0.5] }); } }
      continue;
    }
    if (p.buscador) {
      const enem = enemigosDe(j, p.deHeroe);
      let best: Ent | null = null, bd = 7; for (const e of enem) { if (p.golpeados.has(e.id)) continue; const d = dist(e.x, e.y, p.x, p.y); if (d < bd) { bd = d; best = e; } }
      if (best) { const v = Math.hypot(p.vx, p.vy); const dx = best.x - p.x, dy = best.y - p.y, l = Math.hypot(dx, dy) || 1; p.vx += ((dx / l) * v - p.vx) * Math.min(1, dt * 5); p.vy += ((dy / l) * v - p.vy) * Math.min(1, dt * 5); }
    }
    // guía suave: si el blanco sigue vivo y adelante (a menos de 50°), el proyectil dobla hacia él hasta 2,6 rad/s
    if (p.guia && !p.buscador) {
      const g = p.guia as Monstruo;
      if (g.muerto) p.guia = null;
      else {
        const v = Math.hypot(p.vx, p.vy), a = Math.atan2(p.vy, p.vx); let da = Math.atan2(g.y - p.y, g.x - p.x) - a;
        while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2;
        if (Math.abs(da) > 0.87) p.guia = null; else { const na = a + Math.max(-2.6 * dt, Math.min(2.6 * dt, da)); p.vx = Math.cos(na) * v; p.vy = Math.sin(na) * v; }
      }
    }
    if (p.hab?.id === 'martillo_bendito') { const a = Math.atan2(p.vy, p.vx) + dt * 2.6; const v = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * v * 1.01; p.vy = Math.sin(a) * v * 1.01; }
    if (p.hab?.id === 'tornado' || p.efecto === 'tornado') { const a = Math.atan2(p.vy, p.vx) + Math.sin(p.t * 6) * dt * 3; const v = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; }
    // (la chispa zigzagueaba tanto que a 9 casillas fallaba la mitad: ahora tiembla menos y la guía la lleva al blanco)
    if (p.hab?.id === 'chispa') { const a = Math.atan2(p.vy, p.vx) + (R() - 0.5) * dt * 5; const v = Math.hypot(p.vx, p.vy); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; }
    if (p.hab?.id === 'orbe_glacial' && Math.floor(p.t * 8) !== Math.floor((p.t - dt) * 8)) { const a = R() * Math.PI * 2; j.proyectiles.push({ ...p, x: p.x, y: p.y, vx: Math.cos(a) * 9, vy: Math.sin(a) * 9, hab: undefined, ...({ habVivo: 'orbe_glacial_esquirla' } as any), explota: 0, perfora: false, vida: 0.6, golpeados: new Set(), dano: [p.dano[0] * 0.3, p.dano[1] * 0.3], efecto: 'saeta_hielo' }); }
    const nx = p.x + p.vx * dt, ny = p.y + p.vy * dt;
    if (nx < 0 || ny < 0 || nx >= j.zona.W || ny >= j.zona.H || tapaTiro(j.zona, nx, ny)) { if (p.explota) explotar(j, p); else chocar(j, p, true); p.vida = 0; continue; }
    p.x = nx; p.y = ny;
    // estela
    if (p.elem === 'fuego' && R() < 0.6) particulas(j, p.x, p.y, 1, 'brasa', '#ff9030', 0.4, p.z);
    if (p.elem === 'frio' && R() < 0.4) particulas(j, p.x, p.y, 1, 'nieve', '#c0e8ff', 0.3, p.z);
    for (const e of enemigosDe(j, p.deHeroe)) {
      if (p.golpeados.has(e.id)) continue;
      if (dist(e.x, e.y, p.x, p.y) < e.radio + p.radio) {
        p.golpeados.add(e.id);
        const ks = p.salva ? (p.salva.get(e.id) ?? 0) : 0; if (p.salva) p.salva.set(e.id, ks + 1);
        const fs = ks ? 0.6 : 1;
        const g: Golpe = { min: p.dano[0] * fs, max: p.dano[1] * fs, elem: p.elem, deHeroe: p.deHeroe, fuente: p.deHeroe ? j.heroe : undefined, sinFallo: p.elem !== 'fisico' || !p.deHeroe ? p.elem !== 'fisico' : false, precision: p.deHeroe ? j.heroe.c.precision : undefined, critico: p.deHeroe ? j.heroe.c.critico : 0 };
        if (p.deHeroe && (p.efecto === 'flecha' || p.efecto === 'flecha_fuego' || p.efecto === 'flecha_hielo' || p.efecto === 'virote')) { g.extra = Object.fromEntries(Object.entries(j.heroe.c.elem).map(([k, v]) => [k, (v as number) * fs])); g.robo = j.heroe.c.robo_vida; }
        if (!p.deHeroe) { g.fuente = p.fuente && p.fuente.tipo === 'monstruo' ? p.fuente : undefined; if (!g.fuente) for (const m of j.monstruos) if (!m.muerto && dist(m.x, m.y, p.x, p.y) < 30) { g.fuente = m; break; } }
        if (p.deHeroe && p.hab?.bonos?.empuje) g.empuje = 1;
        if (p.deHeroe && p.hab?.bonos?.marca && e.tipo === 'monstruo') (e as Monstruo).marca = Math.max((e as Monstruo).marca ?? 0, val(p.hab.bonos.marca, p.nivelHab ?? 1));
        danar(j, e, g);
        if (p.explota) { explotar(j, p); p.vida = 0; break; }
        if (!p.perfora) { p.vida = 0; efecto(j, impactoDe(p), p.x, p.y, 0, 0.5); break; }
      }
    }
  }
  habEnCurso = null; deDonde = null;
  j.proyectiles = j.proyectiles.filter((p) => p.vida > 0);
}
/** Qué efecto suelta un proyectil al pegar: el que sugiere la tabla de luces de la Forja, o uno por elemento. */
function impactoDe(p: Proyectil): string {
  if (p.efecto.startsWith('pfx:')) { const im = usosPfx.impacto.get(p.efecto.slice(4)); if (im) return 'pfx:' + im; }
  const sug = LUZ_EFECTO[p.efecto]?.impacto; if (sug) return sug;
  const IMP: Partial<Record<Elemento, string>> = { fuego: 'explosion_fuego', frio: 'estallido_esquirlas', fisico: 'chispas_carne', rayo: 'impacto_rayo', veneno: 'impacto_veneno', luz: 'impacto_sagrado', sangre: 'salpicadura_sangre' };
  return /hueso/.test(p.efecto) ? 'impacto_hueso' : IMP[p.elem] ?? 'chispas_metal';
}
/** Chispas del elemento donde un proyectil choca o se apaga: [color, tipo de partícula, sonido]. */
const CHISPAS_ELEM: Partial<Record<Elemento, [string, Particula['tipo'], string]>> = {
  fuego: ['#ffb040', 'brasa', 'explosion'], frio: ['#c8ecff', 'chispa', 'hielo_impacto'], rayo: ['#fff6a0', 'chispa', 'golpe_metal'],
  veneno: ['#8fe050', 'chispa', 'golpe_carne'], luz: ['#fff0b0', 'chispa', 'luz'], sombra: ['#b070ff', 'chispa', 'hueso_cruje'], fisico: ['#d8d0c0', 'chispa', 'golpe_metal'], sangre: ['#d02020', 'sangre', 'golpe_carne'],
};
/**
 * Un proyectil que choca contra algo del mundo (muro, árbol, columna) o que se apaga en el aire: nunca desaparece sin
 * más. Contra el mundo suelta su impacto, chispas de su elemento que rebotan, un golpe de sonido y un temblor mínimo;
 * al apagarse, un soplo de chispas.
 */
function chocar(j: Juego, p: Proyectil, contraMundo: boolean) {
  const [color, tipo, son] = CHISPAS_ELEM[p.elem] ?? CHISPAS_ELEM.fisico!;
  if (contraMundo) {
    const fis = p.elem === 'fisico' || /flecha|virote/.test(p.efecto);
    efecto(j, fis ? 'pfx:fx_impacto_muro' : impactoDe(p), p.x, p.y, Math.round(((Math.atan2(p.vy, p.vx) * 180) / Math.PI / 45 + 8) % 8), fis ? 1 : 0.55);
    particulas(j, p.x, p.y, p.deHeroe ? 12 : 7, tipo, color, 1.5, p.z);
    if (p.elem !== 'frio' && p.elem !== 'veneno') particulas(j, p.x, p.y, 4, 'chispa', '#ffffff', 2, p.z);
    if (p.deHeroe) { j.sacudida = Math.max(j.sacudida, 0.07); sonar(j, son, p.x, p.y, 0.45); }
  } else particulas(j, p.x, p.y, 5, tipo, color, 0.7, p.z);
}
function explotar(j: Juego, p: Proyectil) {
  const r = p.explota || 1.5;
  // (manda el elemento de la habilidad: el virote de escarcha y el de veneno viajan como golpe físico y reventaban en fuego)
  const elx = (p.hab?.elem && p.hab.elem !== 'fisico' ? p.hab.elem : p.elem) as Elemento;
  efecto(j, elx === 'frio' ? 'nova_escarcha' : elx === 'veneno' ? 'nube_veneno' : elx === 'rayo' ? 'impacto_rayo' : elx === 'sombra' ? 'estallido_cadaver' : elx === 'luz' ? 'castigo' : 'explosion_fuego', p.x, p.y, 0, r / 2);
  for (const e of enemigosDe(j, p.deHeroe)) if (dist(e.x, e.y, p.x, p.y) < r + e.radio) {
    danar(j, e, { min: p.dano[0], max: p.dano[1], elem: p.elem, deHeroe: p.deHeroe, fuente: p.deHeroe ? j.heroe : undefined, sinFallo: true });
    if (p.hab?.bonos?.miedo && !esJefe(e)) e.miedo = val(p.hab.duracion, p.nivelHab ?? 1);
  }
  if (p.hab?.id === 'frasco_peste' || p.hab?.id === 'bomba_humo') { const d = val(p.hab.duracion, p.nivelHab ?? 1); j.areas.push({ x: p.x, y: p.y, radio: r * 0.9, dano: [p.dano[0] * 0.25, p.dano[1] * 0.25], elem: 'veneno', t: 0, dur: d, tick: 0.5, prox: 0.5, deHeroe: true, efecto: 'nube_veneno', retraso: 0.05 }); }
  // el frasco incendiario deja el piso ardiendo
  if (p.hab?.id === 'bomba_ignea') efecto(j, 'suelo_ardiente', p.x, p.y, 0, Math.max(0.8, r / 2.2), 0, 3);
  if (p.hab?.id === 'gran_crisol') j.areas.push({ x: p.x, y: p.y, radio: r * 0.7, dano: [p.dano[0] * 0.08, p.dano[1] * 0.08], elem: 'fuego', t: 0, dur: 4, tick: 0.5, prox: 0.5, deHeroe: true, efecto: 'crater_ardiente', retraso: 0.05 });
  // las explosiones grandes de fuego del héroe: una segunda onda más ancha, el piso queda ardiendo y la cámara lo siente
  if (p.deHeroe && p.elem === 'fuego' && (p.hab?.id === 'bola_fuego' || p.hab?.id === 'flecha_cometa' || p.hab?.id === 'virote_dragon' || p.hab?.id === 'virote_explosivo')) {
    efecto(j, 'explosion_fuego', p.x, p.y, 0, r / 1.25); efecto(j, 'suelo_ardiente', p.x, p.y, 0, Math.max(0.8, r / 2.2), 0, 2.5);
    particulas(j, p.x, p.y, 14, 'brasa', '#ffb040', 1.4, 30); j.sacudida = Math.max(j.sacudida, 0.32);
  }
  j.sacudida = Math.max(j.sacudida, 0.15);
  sonar(j, p.elem === 'frio' ? 'hielo_impacto' : 'explosion', p.x, p.y, 0.8);
  if (p.elem === 'fuego') ponerMancha(j, { x: p.x, y: p.y, r: r * 0.6, color: '#141008', t: 0, tipo: 'quemado' });
}
// ------------------------------------------------------------------ trampas (oleada 4)
/**
 * Las trampas de la zona (`ponerTrampas` en zona.ts, piezas en catalogo/trampas.ts): se ven, se esquivan y se usan contra los
 * enemigos. La losa de púas salta con quien la pise (héroe o monstruo; un respiro de 2,4 s), la grieta del acto 5 respira y
 * escupe cada tanto (se hincha 1 s antes), el lazo agarra al primero que pisa el aro (y queda saltado) y el brasero flojo se
 * vuelca de un clic (`volcarBrasero`, lo llama main.ts) hacia el lado contrario al héroe: una lengua de fuego que quema lo que
 * pase. Al héroe le quitan una parte de su vida (no lo matan de un golpe); a los monstruos, de la suya (a los jefes y únicos
 * poco). Nada se guarda: el estado vive en el objeto de la zona (`dato`). `__sinTrampas` lo apaga (no salen ni actúan).
 */
const TRAMPA_HEROE: Record<string, number> = { puas: 0.05, grieta: 0.06 };
const TRAMPA_MONSTRUO: Record<string, number> = { puas: 0.3, grieta: 0.35 };
function golpeTrampa(j: Juego, e: Ent, tipo: string, elem: Elemento) {
  const h = j.heroe;
  if (e === h) { const d = h.vidaMax * TRAMPA_HEROE[tipo]; danar(j, h, { min: d, max: d, elem, deHeroe: false, sinFallo: true }); return; }
  const m = e as Monstruo; if (m.dueno) return;
  const k = esJefe(m) ? 0.04 : m.calidad >= 1 ? TRAMPA_MONSTRUO[tipo] * 0.4 : TRAMPA_MONSTRUO[tipo], d = m.vidaMax * k;
  danar(j, m, { min: d, max: d, elem, deHeroe: true, fuente: h, sinFallo: true });
}
function actualizarTrampas(j: Juego, dt: number) {
  if ((globalThis as any).__sinTrampas) return;
  const z = j.zona, h = j.heroe, ts: ObjZ[] = (z as any).trampas ??= z.objetos.filter((o) => o.dato?.trampa);
  if (!ts.length) return;
  const pisan = (o: ObjZ, r: number) => [h, ...j.monstruos].filter((e) => !e.muerto && (e === h || !(e as Monstruo).dueno) && (e as Monstruo).estado !== 'surgir' && Math.abs(e.x - (o.cx + 0.5)) < r && Math.abs(e.y - (o.cy + 0.5)) < r);
  for (const o of ts) {
    const d = o.dato;
    if (Math.hypot(h.x - o.cx, h.y - o.cy) > 40) continue;
    if (d.trampa === 'puas') {
      d.t = (d.t ?? 0) - dt;
      if (o.v === 'arriba' && d.t < 1.6) o.v = 'abajo';
      if (d.t > 0) continue;
      const q = pisan(o, 0.75); if (!q.length) continue;
      o.v = 'arriba'; d.t = 2.4;
      for (const e of q) { golpeTrampa(j, e, 'puas', 'fisico'); particulas(j, e.x, e.y, 10, 'sangre', '#8a1010', 1.2, 14); }
      particulas(j, o.cx + 0.5, o.cy + 0.5, 8, 'chispa', '#d0d0d0', 0.8, 6); sonar(j, 'golpe_hueso', o.cx + 0.5, o.cy + 0.5, 0.8); j.sacudida = Math.max(j.sacudida, 0.15);
    } else if (d.trampa === 'grieta') {
      // respira: quieta de 4 a 6 s, aviso 1 s (se hincha), erupción 0,6 s (quema a quien esté encima)
      d.t = (d.t ?? 2 + (o.cx % 5)) - dt;
      if (d.t > 0) continue;
      if (o.v === 'quieta') { o.v = 'aviso'; d.t = 1; particulas(j, o.cx + 1, o.cy + 1, 6, 'brasa', '#ff8030', 0.5, 8); }
      else if (o.v === 'aviso') {
        o.v = 'erupcion'; d.t = 0.6;
        for (const e of pisan({ ...o, cx: o.cx + 0.5, cy: o.cy + 0.5 } as ObjZ, 1.6)) golpeTrampa(j, e, 'grieta', 'fuego');
        efecto(j, 'explosion_fuego', o.cx + 1, o.cy + 1, 0, 0.9); particulas(j, o.cx + 1, o.cy + 1, 16, 'brasa', '#ffb040', 1.5, 40); sonar(j, 'explosion', o.cx + 1, o.cy + 1, 0.5);
      } else { o.v = 'quieta'; d.t = 4 + R() * 2; }
    } else if (d.trampa === 'lazo') {
      if (o.v !== 'armado') continue;
      const q = pisan(o, 0.7); if (!q.length) continue;
      const e = q[0]; o.v = 'saltado';
      if (e === h) { h.aturdido = Math.max(h.aturdido, 1.1); msg(j, ['¡Un lazo! Te agarra del tobillo.', 'A snare! It grabs your ankle.'], '#e0c080'); }
      else if (!esJefe(e as Monstruo)) e.aturdido = Math.max(e.aturdido, 3.5);
      particulas(j, e.x, e.y, 10, 'humo', '#8a7a50', 0.6, 10); sonar(j, 'golpe_hueso', e.x, e.y, 0.6);
    } else if (d.trampa === 'fuego') {
      // la lengua del brasero volcado: arde unos segundos y quema a quien la cruce
      d.t = (d.t ?? 0) + dt; if (d.t > 6) { o.dato = undefined; continue; }
      d.p = (d.p ?? 0) - dt; if (d.p > 0) continue; d.p = 0.5;
      for (const [x, y] of d.celdas as [number, number][]) for (const e of [h, ...j.monstruos]) if (!e.muerto && Math.abs(e.x - x) < 0.9 && Math.abs(e.y - y) < 0.9) { if (e === h) { const v = h.vidaMax * 0.03; danar(j, h, { min: v, max: v, elem: 'fuego', deHeroe: false, sinFallo: true }); } else if (!(e as Monstruo).dueno) { const m = e as Monstruo, v = m.vidaMax * (esJefe(m) ? 0.01 : 0.06); danar(j, m, { min: v, max: v, elem: 'fuego', deHeroe: true, fuente: h, sinFallo: true }); } }
    }
  }
}
/** El brasero flojo: de un clic se vuelca hacia el lado contrario al héroe y el aceite prende una lengua de cuatro celdas. */
export function volcarBrasero(j: Juego, o: ObjZ) {
  if (o.v !== 'en_pie') return;
  const h = j.heroe, dx = o.cx + 0.5 - h.x, dy = o.cy + 0.5 - h.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
  o.v = 'volcado'; o.tag = undefined; o.bloquea = false; j.zona.bloq[o.cy * j.zona.W + o.cx] = 0;
  const celdas: [number, number][] = [];
  for (let k = 1; k <= 4; k++) for (const s of [-0.6, 0.6]) { const x = o.cx + 0.5 + ux * k * 1.1 - uy * s * (k / 4), y = o.cy + 0.5 + uy * k * 1.1 + ux * s * (k / 4); if (!pasable(j.zona, x, y)) continue; celdas.push([x, y]); efecto(j, 'suelo_ardiente', x, y, 0, 0.6, 0, 6); }
  (j.zona as any).trampas = undefined; o.dato = { trampa: 'fuego', celdas, t: 0, p: 0 };
  efecto(j, 'explosion_fuego', o.cx + 0.5 + ux * 1.5, o.cy + 0.5 + uy * 1.5, 0, 0.8); sonar(j, 'explosion', o.cx + 0.5, o.cy + 0.5, 0.6);
  particulas(j, o.cx + 0.5, o.cy + 0.5, 18, 'brasa', '#ffa040', 1.4, 20); j.sacudida = Math.max(j.sacudida, 0.25);
}

/** (solo para el dibujo) el golpe que se está repartiendo es de un área (la onda del Puño de dios no revienta como el puño) */
let golpeArea = false;
function actualizarAreas(j: Juego, dt: number) {
  for (const a of j.areas) {
    habEnCurso = a.deHeroe ? a.hab ?? null : null; deDonde = null;
    if (a.retraso > 0) { a.retraso -= dt; if (a.retraso <= 0 && a.caida) { j.sacudida = 0.5; sonar(j, 'explosion', a.x, a.y); const fc = a.fxCaida ?? 'explosion_fuego'; if (fc) efecto(j, fc, a.x, a.y, 0, a.escCaida ?? 1.6, 0, fc.startsWith('pfx:') ? 3.5 : undefined);
      if (a.quemar) ponerMancha(j, { x: a.x, y: a.y, r: a.quemar, color: '#141008', t: 0, tipo: 'quemado' });
      if (a.congela) (j as any).congela = Math.max((j as any).congela ?? 0, a.congela); } if (a.retraso > 0) continue; if (a.efecto && !a.caida) efecto(j, a.efecto, a.x, a.y, 0, a.radio / 2.5, 0, Math.max(0.8, a.dur)); }
    a.t += dt; a.prox -= dt;
    if (a.prox <= 0) {
      a.prox = a.tick;
      golpeArea = true;
      for (const e of enemigosDe(j, a.deHeroe)) if (dist(e.x, e.y, a.x, a.y) < a.radio + e.radio) danar(j, e, { min: a.dano[0], max: a.dano[1], elem: a.elem, deHeroe: a.deHeroe, fuente: a.deHeroe ? j.heroe : undefined, sinFallo: true });
      golpeArea = false;
      if (a.efecto === 'lluvia_flechas') for (let k = 0; k < 5; k++) particulas(j, a.x + entre(-a.radio, a.radio), a.y + entre(-a.radio, a.radio), 1, 'chispa', '#d0c090', 0.3, 2);
      if (a.elem === 'frio' && a.efecto === 'ventisca') for (let k = 0; k < 6; k++) particulas(j, a.x + entre(-a.radio, a.radio), a.y + entre(-a.radio, a.radio), 1, 'nieve', '#e0f4ff', 0.5, 90);
    }
  }
  habEnCurso = null;
  j.areas = j.areas.filter((a) => a.retraso > 0 || a.t < a.dur);
}

// ------------------------------------------------------------------ acciones del jugador
export function caminarA(j: Juego, x: number, y: number) {
  const h = j.heroe; if (h.muerto) return;
  h.camino = buscarCamino(j.zona, h.x, h.y, x, y, 2500);
  h.destino = [x, y];
}
/** El efecto de tomarse una poción (del cinturón o de la bolsa). */
export function beberPocion(j: Juego, o: Objeto) {
  const h = j.heroe; if (h.muerto) return;
  const v = valorPocion(o);
  // hasta el nivel 5 la poción cura en 2 s en vez de 4: al empezar se muere por llegar tarde, no por falta de pociones
  if (o.pocion === 'vida') { const tc = h.d.nivel <= 5 ? 2 : 4; (h as any).curando = { t: tc, v: v / tc }; efecto(j, 'pfx:fx_curacion', h.x, h.y, 0, 1, 0, 1.8); }
  else if (o.pocion === 'mana') { (h as any).cargando = { t: 3, v: v / 3 }; }
  else { h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * v / 100); h.mana = Math.min(h.c.manaMax, h.mana + h.c.manaMax * v / 100); }
  // (solo para el HUD: el trago se ve en el orbe)
  (h as any).bebio = { t: j.t, tipo: o.pocion }; (h as any).bebioCol = -1;
  sonar(j, 'pocion');
  particulas(j, h.x, h.y, 10, 'chispa', o.pocion === 'mana' ? '#6080ff' : o.pocion === 'vida' ? '#ff4040' : '#c040ff', 0.6, 40);
}
/** Columnas del cinturón que se rellenan solas desde la bolsa (no se guarda: al entrar todas se rellenan). */
const pendientes = (h: any): boolean[] => (h.rellenar ??= h.d.cinturon.map(() => true));
/** Si se saca a mano una poción del cinturón, esa columna deja de rellenarse sola hasta la próxima vez que se tome. */
export function noRellenar(j: Juego, i: number) { pendientes(j.heroe)[i] = false; }
export function usarPocion(j: Juego, i: number) {
  const h = j.heroe; if (h.muerto) return;
  const o = h.d.cinturon[i]; if (!o) return;
  beberPocion(j, o); (h as any).bebioCol = i;
  if (cant(o) > 1) o.cantidad = cant(o) - 1; else h.d.cinturon[i] = null;
  // la misma columna se rellena desde la bolsa con su tipo
  pendientes(h)[i] = true;
  rellenarColumna(h.d, i);
}
export function curarEnTiempo(j: Juego, dt: number) {
  const h = j.heroe as any;
  // el cinturón se rellena solo desde la bolsa, cada columna con su tipo (salvo las que vaciaste a mano)
  if (!h.muerto && (h.tCinturon = (h.tCinturon ?? 0) - dt) <= 0) {
    h.tCinturon = 0.5;
    const d = h.d, pend = pendientes(h);
    for (let i = 0; i < d.cinturon.length; i++) if (pend[i]) rellenarColumna(d, i);
  }
  if (h.curando) { h.vida = Math.min(h.vidaMax, h.vida + h.curando.v * dt); h.curando.t -= dt; if (h.curando.t <= 0) h.curando = null; }
  if (h.cargando) { h.mana = Math.min(h.c.manaMax, h.mana + h.cargando.v * dt); h.cargando.t -= dt; if (h.cargando.t <= 0) h.cargando = null; }
}
/**
 * Recolección automática: el oro, las pociones, las gemas, las runas y los pergaminos se juntan solos cuando el héroe
 * pasa cerca (el oro desde más lejos); el equipo mágico o mejor, al pasarle por encima. El equipo común (blanco) se
 * deja en el piso: es lo que menos vale y llenaría la bolsa. Cada cosa espera medio segundo después de caer para que se
 * vea caer. Si la bolsa está llena lo dice una sola vez por objeto.
 */
/** Lo fija Opciones (menus.ts). */
export const prefsRecoger = { equipo: false };
function recogerSolo(j: Juego) {
  const h = j.heroe;
  if (h.muerto || j.zona.tipo === 'pueblo' && !j.suelo.length) return;
  for (let i = j.suelo.length - 1; i >= 0; i--) {
    const s = j.suelo[i]; if (!s || s.t < 0.5) continue;
    const consumible = !!s.o && s.o.tipo !== 'equipo';
    // el equipo solo con clic (como en Diablo): al ir por una poción el héroe se llevaba de paso lo que pisaba (Rick, 19 nov
    // 2026). Opciones, Recoger equipo, Al pasar, vuelve a lo de antes
    const radio = s.oro ? 2.6 : consumible ? 2.0 : prefsRecoger.equipo && s.o && s.o.rareza !== 'normal' ? 1.15 : 0;
    if (!radio || dist(s.x, s.y, h.x, h.y) > radio) continue;
    if (s.o && !s.oro && ((s as any).sinLugar || s.botado)) continue; // (lo que el jugador botó no vuelve solo a la bolsa)
    if (!recogerSuelo(j, s, true)) (s as any).sinLugar = true;
  }
}
export function recogerSuelo(j: Juego, s: Suelo, solo = false): boolean {
  if (s.o && s.o.rareza !== 'normal') efecto(j, 'pfx:fx_recoger', s.x, s.y, 0, 1, 0, 0.9);
  const h = j.heroe;
  if (s.oro) { h.d.oro += s.oro; sonar(j, 'oro'); j.suelo.splice(j.suelo.indexOf(s), 1); return true; }
  if (s.o && recoger(h.d, s.o)) { sonar(j, 'objeto_cae', undefined, undefined, 0.5); j.suelo.splice(j.suelo.indexOf(s), 1); return true; }
  msg(j, ['No tengo lugar.', 'I have no room.'], '#ff8080');
  if (!solo) sonar(j, 'negado');
  return false;
}
export function abrirPortal(j: Juego): boolean {
  const h = j.heroe;
  if (j.zona.tipo === 'pueblo') return false;
  const i = h.d.bolsa.findIndex((b) => b.o.base === 'pergamino_portal');
  if (i < 0) { msg(j, ['No tengo pergaminos de regreso.', 'I have no scrolls of return.']); return false; }
  h.d.bolsa.splice(i, 1);
  const q = libreCerca(j.zona, h.x + 1.5, h.y + 1.5);
  j.portal = { x: q[0] + 0.5, y: q[1] + 0.5, destino: j.zona.id, t: 0, x2: h.x, y2: h.y };
  (j as any).portalZona = j.zona.id;
  sonar(j, 'portal');
  return true;
}

