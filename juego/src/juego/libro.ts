// El Libro de Odrán, la lógica: qué piezas de cada hilo tiene el héroe, qué falta, cuándo cierra un hilo y qué es nuevo.
// Casi todo se deriva de lo que la partida ya guarda (misiones, diarios, páginas, restos, fantasmas, heraldo, actos,
// elecciones, jefes vistos): una partida vieja abre el libro con lo que ya encontró. Lo que no se puede derivar (la voz
// de la Marca, lo que contó alguien, un rincón apartado) se anota desde ahora en el campo opcional `libro` del héroe.
// Los textos de cada pieza son los que el jugador ya leyó (mundo/libro_hilos.ts dice de dónde salen).
import { HILOS, type Hilo, type Pieza, type Fuente } from '../mundo/libro_hilos';
import { HILO_TXT, CIERRES, ROJOS, MARGEN, PISTA_PIEZA, PISTA_TIPO, TIERRA, EPITETO, PORTADA } from '../mundo/libro_cierres';
import { MISIONES, DIARIOS, PAGINAS, RESTOS_ACTO, FANTASMAS, HERALDO, ENTREACTO, PELICULA, conPelicula, REVELACION, TRAS_ELEGIR, VOZ_MARCA, ENTRADA_ZONA, FRASE_JEFE, FRASE_JEFE_ZONA, ZONAS, INTRO, PUEBLO_DE, daMision, type Mision } from '../mundo/actos';
import { DESVIO } from '../mundo/zona';
import { DIALOGOS, NPCS, GENTE, type Linea } from '../datos/npcs';
import { MONSTRUOS } from '../datos/monstruos';
import { hist, prog, eleccionDe, finalDe, tituloRestos, quienDa, decisionDe } from './historia';
import { OIDO } from './libro_oido';
import type { DatosHeroe } from './heroe';

type T2 = [string, string];
/** Lo que el libro guarda en el héroe (campo nuevo y opcional: las partidas viejas no lo tienen y no hace falta). */
export interface EstadoLibro {
  /** Piezas oídas que no se pueden derivar del guardado (voz de la Marca, relatos, rincones). */
  o?: string[];
  /** Piezas ya escritas en el libro (vistas una vez): no se vuelven a escribir solas y quedan aunque la historia vuelva a empezar. */
  v?: string[];
  /** La opción elegida de las piezas de elección ya escritas (por si otra dificultad borra las elecciones). */
  el?: Record<string, number>;
  /** Cierres de Odrán ya escritos, notas al margen ya escritas y hojas ya quemadas. */
  c?: string[]; m?: string[]; q?: string[];
}
export const libroDe = (d: DatosHeroe): EstadoLibro => ((d as any).libro ??= {}) as EstadoLibro;
const leer = (d: DatosHeroe): EstadoLibro => ((d as any).libro ?? {}) as EstadoLibro;

// ------------------------------------------------------------------ las fuentes
const fuentes = (p: Pieza): Fuente[] => (Array.isArray(p.f) ? p.f : [p.f]);
const MIS = (): Record<string, Mision> => Object.fromEntries(MISIONES.map((m) => [m.id, m]));
let misCache: Record<string, Mision> | null = null;
const mision = (id: string) => (misCache ??= MIS())[id];
const est = (d: DatosHeroe, id: string) => d.misiones[id] ?? 0;
/** Lo que dice alguien: el texto exacto (el mismo arreglo que muestra el diálogo) y su acto. */
function lineaNpc(f: Extract<Fuente, { t: 'npc' }>): { txt: T2; acto?: number; l?: Linea } | null {
  const n = NPCS[f.n]; if (!n) return null;
  if (f.ini === 'base') return f.k === 'relato' ? { txt: n.relato } : null;
  const ls = DIALOGOS[f.n]?.[f.k === 'relato' ? 'relatos' : 'lineas'] ?? [];
  const l = ls.find((q) => q.texto[0].startsWith(f.ini));
  if (l) return { txt: l.texto, acto: l.acto, l };
  return f.k === 'relato' && n.relato[0].startsWith(f.ini) ? { txt: n.relato } : null;
}
const actoNpc = (n: string) => { for (const [a, ls] of Object.entries(GENTE)) if (ls.includes(n)) return +a; return 1; };
const actoZona = (z: string) => ZONAS[z]?.acto ?? 1;
/** El acto en que se puede encontrar cada fuente. */
function actoFuente(f: Fuente): number {
  switch (f.t) {
    case 'intro': case 'pag': return 1;
    case 'diario': case 'resto': case 'heraldo': case 'entreacto': return f.a;
    case 'pista': case 'pedido': case 'hecho': case 'eleccion': case 'caza': return mision(f.m)?.acto ?? 1;
    case 'fantasma': return actoZona(FANTASMAS.find((x) => x.id === f.id)?.zona ?? '');
    case 'muerte': case 'revelacion': case 'brasa': return 5;
    case 'voz': case 'entrada': case 'jefeZona': case 'desvio': return actoZona(f.z);
    case 'jefe': { const z = Object.values(ZONAS).find((q) => q.jefe === f.id); return z?.acto ?? 1; }
    case 'npc': return lineaNpc(f)?.acto ?? actoNpc(f.n);
  }
}
export const actoPieza = (p: Pieza) => p.acto ?? Math.min(...fuentes(p).map(actoFuente));
/** Hasta dónde llegó el héroe (lo de más adelante no asoma, ni como hueco). */
export function actoAlcanzado(d: DatosHeroe): number { return Math.min(7, Math.max(d.acto ?? 1, ...((d.actosHechos ?? []).map((a) => a + 1)))); }
/** ¿Estuvo el héroe en esta zona? (por la piedra de viaje, donde está, un encargo cumplido ahí o el campamento del acto). */
function estuvo(d: DatosHeroe, z: string): boolean {
  if (d.zona === z || d.viajes.includes(z)) return true;
  if (Object.entries(PUEBLO_DE).some(([a, p]) => p === z && actoAlcanzado(d) >= +a)) return true;
  return MISIONES.some((m) => m.objetivo.zona === z && est(d, m.id) >= 2);
}

/** ¿Tiene esta fuente? (derivado del guardado o anotado como oído). */
function tieneFuente(d: DatosHeroe, f: Fuente, pid: string): boolean {
  const h = hist(d), oidos = leer(d).o ?? [];
  switch (f.t) {
    case 'intro': return true;
    case 'pag': return (h.paginas ?? 0) > f.i;
    case 'diario': return (h.diarios?.[f.a] ?? 0) > f.i;
    case 'resto': return (h.restos ?? []).includes(`${f.a}:${f.i}`);
    case 'pista': return est(d, f.m) >= 2 || !!(((prog(d)[f.m] ?? 0) >> f.i) & 1);
    case 'pedido': return est(d, f.m) >= 1;
    case 'hecho': return est(d, f.m) === 3;
    case 'eleccion': return est(d, f.m) === 3 && eleccionDe(d, f.m) !== undefined;
    case 'caza': return est(d, f.m) >= 2 || oidos.includes(pid);
    case 'fantasma': { const def = FANTASMAS.find((x) => x.id === f.id); return (h.fantasmas ?? []).includes(f.id) || (!!def && !def.mas?.length && oidos.includes(pid)); }
    case 'heraldo': return f.a < HERALDO.final ? (h.heraldo ?? []).includes(f.a) : !!h.heraldoMuerto;
    case 'muerte': return !!h.heraldoMuerto;
    case 'entreacto': return (d.actosHechos ?? []).includes(f.a);
    case 'revelacion': return !!finalDe(d) || est(d, 'm5_ozmaren') >= 2;
    case 'brasa': return !!finalDe(d);
    case 'voz': case 'entrada': return estuvo(d, f.z) || oidos.includes(pid);
    case 'jefeZona': return MISIONES.some((m) => m.objetivo.zona === f.z && m.objetivo.tipo === 'matar' && est(d, m.id) >= 2) || oidos.includes(pid);
    case 'jefe': return (((d as any).jefesVistos ?? []) as string[]).includes(f.id) || oidos.includes(pid);
    case 'npc': return oidos.includes(pid) || derivaNpc(d, f);
    case 'desvio': return oidos.includes(pid);
  }
}
/**
 * Lo que alguien dijo se puede dar por sabido cuando ya pasó el acto en que lo decía y se cumplió lo que pedía la línea
 * (la misión hecha, la elección tomada, el heraldo escapado...): Odrán lo oyó en el campamento aunque el héroe no
 * estuviera. Mientras el acto sigue, hay que oírlo (puede que todavía se pueda preguntar).
 */
function derivaNpc(d: DatosHeroe, f: Extract<Fuente, { t: 'npc' }>): boolean {
  const r = lineaNpc(f); if (!r) return false;
  const acto = r.acto ?? actoNpc(f.n); if (actoAlcanzado(d) <= acto) return false;
  const l = r.l; if (!l) return true;
  if (l.hecha && !l.hecha.every((id) => est(d, id) === 3)) return false;
  if (l.activa && est(d, l.activa) < 1) return false;
  if (l.eleccion && (est(d, l.eleccion[0]) !== 3 || eleccionDe(d, l.eleccion[0]) !== l.eleccion[1])) return false;
  if (l.heraldo !== undefined && !(hist(d).heraldo ?? []).includes(l.heraldo)) return false;
  if (l.final && finalDe(d) !== l.final) return false;
  if (l.decision && decisionDe(d, l.decision[0]) !== l.decision[1]) return false;
  return true;
}
/** El texto que se anota por cada fuente: el título del renglón rojo y lo que dice. */
function textoFuente(d: DatosHeroe, f: Fuente, pid: string): { ru: T2; tx: T2 } {
  const z2 = (z: string): T2 => ZONAS[z]?.nombre ?? ['', ''];
  const q = (t: T2): T2 => [`«${t[0]}»`, `“${t[1]}”`];
  const une = (ts: T2[]): T2 => [ts.map((t) => t[0]).join(' '), ts.map((t) => t[1]).join(' ')];
  const quien = (m: Mision): T2 => NPCS[quienDa(m, d)]?.nombre ?? ['', ''];
  switch (f.t) {
    case 'intro': return { ru: ['Lo que se cuenta en el valle', 'What the valley tells'], tx: une(f.i.map((i) => INTRO[i])) };
    case 'pag': return { ru: [`Diario del primer abad, hoja ${f.i + 1}`, `Diary of the First Abbot, page ${f.i + 1}`], tx: PAGINAS[f.i] };
    case 'diario': { const di = DIARIOS[f.a]; return { ru: [`${di.titulo[0]}, hoja ${f.i + 1}`, `${di.titulo[1]}, page ${f.i + 1}`], tx: di.paginas[f.i] }; }
    case 'resto': { const t = tituloRestos(f.a, f.i), tt = TIERRA[f.a]; return { ru: [`${t[0]}, en ${tt[0]}`, `${t[1]}, in ${tt[1]}`], tx: RESTOS_ACTO[f.a][f.i] }; }
    case 'pista': { const m = mision(f.m); return { ru: [`${m.nombre[0]}, señal ${f.i + 1}`, `${m.nombre[1]}, sign ${f.i + 1}`], tx: (m.objetivo as any).pistas[f.i].texto }; }
    case 'pedido': { const m = mision(f.m), n = quien(m); return { ru: [`Lo que pidió ${n[0]}`, `What ${n[1]} asked`], tx: m.pedido }; }
    case 'hecho': { const m = mision(f.m); return { ru: [`${m.nombre[0]}, al volver`, `${m.nombre[1]}, on returning`], tx: m.hecho }; }
    case 'eleccion': {
      const m = mision(f.m), el = m.eleccion!; const op = eleccionDe(d, f.m) ?? leer(d).el?.[pid] ?? 0, o = el.opciones[op] ?? el.opciones[0];
      return { ru: [`${m.nombre[0]}: lo que elegiste`, `${m.nombre[1]}: what you chose`], tx: [`${el.pregunta[0]} Elegiste: ${o.texto[0]} ${o.hecho[0]}`, `${el.pregunta[1]} You chose: ${o.texto[1]} ${o.hecho[1]}`] };
    }
    case 'caza': { const o = mision(f.m).objetivo as any; return { ru: o.nombre, tx: o.frase }; }
    case 'fantasma': { const fa = FANTASMAS.find((x) => x.id === f.id)!, z = z2(fa.zona); const t = fa.titulo ?? ['Un muerto que no se fue', 'One who did not leave'];
      return { ru: [`${t[0]}, en ${z[0]}`, `${t[1]}, in ${z[1]}`], tx: une([fa.texto, ...(fa.mas ?? [])].map(q)) }; }
    case 'heraldo': { const z = z2(HERALDO.zonas[f.a]); const enc = (HERALDO.encuentro as any)[f.a] as T2, hu = (HERALDO.huida as any)[f.a] as T2 | undefined;
      return { ru: [`El que canta, en ${z[0]}`, `The singer, in ${z[1]}`], tx: une([enc, ...(hu ? [hu] : [])].map(q)) }; }
    case 'muerte': { const z = z2(HERALDO.zonas[HERALDO.final]); return { ru: [`Lo último que cantó, en ${z[0]}`, `The last thing he sang, in ${z[1]}`], tx: une([(HERALDO.encuentro as any)[HERALDO.final] as T2, HERALDO.muerte].map(q)) }; }
    case 'entreacto': { const fi = finalDe(d); return { ru: [`Cuando terminó el acto ${f.a}`, `When act ${f.a} ended`], tx: conPelicula(f.a) ? une(PELICULA[f.a].map((l) => (l.voz ? [`«${l.es}»`, `"${l.en}"`] : [l.es, l.en]) as T2)) : une((ENTREACTO[f.a] ?? []).map((t) => (fi && t.textoSegun?.[fi]) || t.texto)) }; }
    case 'revelacion': return { ru: ['En el Corazón de la Brasa', 'In the Heart of the Ember'], tx: une(REVELACION) };
    case 'brasa': { const fi = finalDe(d) ?? (leer(d).el?.[pid] === 1 ? 'absorber' : 'destruir'); return { ru: ['Lo que hiciste con la Brasa', 'What you did with the Ember'], tx: TRAS_ELEGIR[fi] }; }
    case 'voz': { const z = z2(f.z); return { ru: [`Tu brazo, en ${z[0]}`, `Your arm, in ${z[1]}`], tx: VOZ_MARCA[f.z] }; }
    case 'entrada': return { ru: z2(f.z), tx: ENTRADA_ZONA[f.z] };
    case 'jefeZona': { const z = z2(f.z); return { ru: [`Lo que dijo en ${z[0]}`, `What it said in ${z[1]}`], tx: FRASE_JEFE_ZONA[f.z] }; }
    case 'jefe': { const m = MONSTRUOS[f.id], n = m?.nombre ?? ['', '']; return { ru: [n[0].split(',')[0], n[1].split(',')[0]], tx: q(FRASE_JEFE[f.id]) }; }
    case 'npc': { const l = lineaNpc(f); return { ru: NPCS[f.n]?.nombre ?? ['', ''], tx: l?.txt ?? ['', ''] }; }
    case 'desvio': { const fi = DESVIO[f.z]; return { ru: fi.nombre, tx: fi.texto }; }
  }
}

// ------------------------------------------------------------------ las piezas del héroe
export type EstadoPieza = 'tiene' | 'hueco' | 'futuro' | 'oculta';
export interface VistaPieza { p: Pieza; hilo: Hilo; estado: EstadoPieza; acto: number; ru?: T2; tx?: T2; pista?: T2; nueva?: boolean; margen?: T2; margenNueva?: boolean; rojos?: { hacia: string; nota: T2 }[] }
export interface VistaHilo { h: Hilo; nombre: T2; corto: T2; abre: T2; piezas: VistaPieza[]; tiene: number; total: number; futuro: boolean; cierre?: T2; cierreNuevo?: boolean; late: boolean; nuevas: number }

function tieneP(d: DatosHeroe, p: Pieza): Fuente | null {
  for (const f of fuentes(p)) if (tieneFuente(d, f, p.id)) return f;
  return null;
}
/** La pista de Odrán para lo que falta. */
function pistaDe(d: DatosHeroe, p: Pieza, acto: number): T2 {
  if (PISTA_PIEZA[p.id]) return PISTA_PIEZA[p.id];
  const f = fuentes(p)[0];
  const t = TIERRA[acto] ?? TIERRA[1];
  let z: T2 = t, n: T2 = EPITETO.odran;
  let tipo: string = f.t;
  if ('z' in f) z = estuvo(d, f.z) ? ZONAS[f.z]?.nombre ?? t : t;
  if (f.t === 'fantasma') { const zz = FANTASMAS.find((x) => x.id === f.id)?.zona ?? ''; z = estuvo(d, zz) ? ZONAS[zz]?.nombre ?? t : t; }
  if ('m' in f) { const m = mision(f.m); if (m) { n = EPITETO[quienDa(m, d)] ?? EPITETO[daMision(m)] ?? n; const zz = m.objetivo.zona; z = estuvo(d, zz) ? ZONAS[zz]?.nombre ?? t : t; } }
  if (f.t === 'npc') n = EPITETO[f.n] ?? n;
  if (f.t === 'resto' && f.i === 3 && f.a <= HERALDO.final) tipo = 'carta';
  if (f.t === 'muerte') tipo = 'heraldo';
  if (f.t === 'revelacion' || f.t === 'brasa') tipo = 'entreacto';
  const pl = PISTA_TIPO[tipo] ?? PISTA_TIPO.npc;
  const r = (s: string, i: 0 | 1) => s.replace('{t}', t[i]).replace('{z}', z[i]).replace('{n}', n[i]);
  const s: T2 = [r(pl[0], 0).replace(/\ba el /g, 'al ').replace(/\bde el /g, 'del ').replace(/\bA el /g, 'Al '), r(pl[1], 1)];
  // (la mayúscula del principio si la pista empieza con quien se pregunta)
  return [s[0].charAt(0).toUpperCase() + s[0].slice(1), s[1].charAt(0).toUpperCase() + s[1].slice(1)];
}

/** Todo el libro tal como lo tiene este héroe ahora. */
export function vistaLibro(d: DatosHeroe, ligero = false): VistaHilo[] {
  const L = leer(d), vistas = new Set(L.v ?? []), alc = actoAlcanzado(d);
  const tienen = new Set<string>();
  const out: VistaHilo[] = [];
  const conMargen = alc >= 6 && !!hist(d).heraldoMuerto;
  for (const h of HILOS) {
    const ps: VistaPieza[] = [];
    for (const p of h.piezas) {
      const acto = actoPieza(p), f = tieneP(d, p), escrita = vistas.has(p.id);
      let estado: EstadoPieza = f || escrita ? 'tiene' : acto > alc ? 'futuro' : 'hueco';
      if (estado !== 'tiene' && p.extra) estado = 'oculta';
      const vp: VistaPieza = { p, hilo: h, estado, acto };
      if (estado === 'tiene') {
        if (!ligero) { const tx = textoFuente(d, f ?? fuentes(p)[0], p.id); vp.ru = tx.ru; vp.tx = tx.tx; }
        vp.nueva = !escrita; tienen.add(p.id);
      } else if (estado === 'hueco' && !ligero) vp.pista = pistaDe(d, p, acto);
      ps.push(vp);
    }
    const cuenta = ps.filter((v) => !v.p.extra && v.estado !== 'futuro');
    const tiene = cuenta.filter((v) => v.estado === 'tiene').length;
    const claves = h.piezas.filter((p) => p.clave);
    const faltanClave = claves.filter((p) => !tienen.has(p.id));
    const t = HILO_TXT[h.id], sinNombre = tiene === 0 && !ps.some((v) => v.estado === 'tiene');
    const vh: VistaHilo = { h, nombre: sinNombre ? PORTADA.sinNombre : t.nombre, corto: sinNombre ? PORTADA.sinCorto : t.corto, abre: sinNombre ? PORTADA.sinAbre : t.abre, piezas: ps, tiene, total: cuenta.length, futuro: ps.some((v) => v.estado === 'futuro' && !v.p.extra), late: false, nuevas: ps.filter((v) => v.nueva).length };
    if (!faltanClave.length && claves.length) { vh.cierre = CIERRES[h.id]; vh.cierreNuevo = !(L.c ?? []).includes(h.id); if (vh.cierreNuevo) vh.nuevas++; }
    else vh.late = faltanClave.length === 1 && actoPieza(faltanClave[0]) <= alc;
    out.push(vh);
  }
  // los hilos rojos y las notas de la otra mano (solo entre piezas que se tienen)
  const porId = new Map<string, VistaPieza>(); for (const vh of out) for (const v of vh.piezas) porId.set(v.p.id, v);
  for (const r of ROJOS) {
    const a = porId.get(r.a), b = porId.get(r.b); if (a?.estado !== 'tiene' || b?.estado !== 'tiene') continue;
    (a.rojos ??= []).push({ hacia: r.b, nota: r.nota }); (b.rojos ??= []).push({ hacia: r.a, nota: r.nota });
  }
  if (conMargen && !(globalThis as any).__sinMargen) for (const m of MARGEN) {
    const v = porId.get(m.p); if (v?.estado !== 'tiene') continue;
    v.margen = m.nota; v.margenNueva = !(L.m ?? []).includes(m.p); if (v.margenNueva) v.hilo && out.find((x) => x.h === v.hilo) && (out.find((x) => x.h === v.hilo)!.nuevas++);
  }
  // un hilo se ve si algo suyo ya se puede encontrar o ya se tiene
  return out.filter((vh) => vh.piezas.some((v) => v.estado === 'tiene' || v.estado === 'hueco'));
}
/** Cuántas cosas hay escritas y cuántas sin ver todavía (para el aviso del HUD). */
export function cuentaLibro(d: DatosHeroe): { tiene: number; nuevas: number } {
  let tiene = 0, nuevas = 0;
  for (const vh of vistaLibro(d, true)) { tiene += vh.piezas.filter((v) => v.estado === 'tiene').length + (vh.cierre ? 1 : 0); nuevas += vh.nuevas; }
  return { tiene, nuevas };
}
/** Ya se vio escrita (deja de escribirse sola). Guarda la opción de las elecciones. */
export function marcarVista(d: DatosHeroe, v: VistaPieza) {
  const L = libroDe(d); const vs = (L.v ??= []); if (!vs.includes(v.p.id)) vs.push(v.p.id);
  const f = tieneP(d, v.p);
  if (f?.t === 'eleccion') { const e = eleccionDe(d, f.m); if (e !== undefined) (L.el ??= {})[v.p.id] = e; }
  if (f?.t === 'brasa') (L.el ??= {})[v.p.id] = finalDe(d) === 'absorber' ? 1 : 0;
}
export function marcarCierre(d: DatosHeroe, hilo: string) { const c = (libroDe(d).c ??= []); if (!c.includes(hilo)) c.push(hilo); }
export function marcarMargen(d: DatosHeroe, p: string) { const c = (libroDe(d).m ??= []); if (!c.includes(p)) c.push(p); }
export function marcarQuema(d: DatosHeroe, p: string) { const c = (libroDe(d).q ??= []); if (!c.includes(p)) c.push(p); }
export const quemada = (d: DatosHeroe, p: string) => (leer(d).q ?? []).includes(p);

// ------------------------------------------------------------------ lo oído: el mapa de textos que el libro anota
function registrar() {
  const pon = (t: T2 | undefined, id: string) => { if (!t) return; const l = OIDO.get(t) ?? []; if (!l.includes(id)) l.push(id); OIDO.set(t, l); };
  for (const h of HILOS) for (const p of h.piezas) for (const f of fuentes(p)) {
    if (f.t === 'voz') pon(VOZ_MARCA[f.z], p.id);
    else if (f.t === 'entrada') pon(ENTRADA_ZONA[f.z], p.id);
    else if (f.t === 'jefeZona') pon(FRASE_JEFE_ZONA[f.z], p.id);
    else if (f.t === 'jefe') pon(FRASE_JEFE[f.id], p.id);
    else if (f.t === 'npc') pon(lineaNpc(f)?.txt, p.id);
    else if (f.t === 'desvio') pon(DESVIO[f.z]?.texto, p.id);
    else if (f.t === 'caza') pon((mision(f.m)?.objetivo as any)?.frase, p.id);
    else if (f.t === 'fantasma') pon(FANTASMAS.find((x) => x.id === f.id)?.texto, p.id);
  }
}
registrar();
/** Lo que no encuentra su texto (para la prueba): fuentes de libro_hilos.ts que no apuntan a nada. */
export function piezasRotas(): string[] {
  const out: string[] = [];
  for (const h of HILOS) for (const p of h.piezas) for (const f of fuentes(p)) {
    try {
      const d = { misiones: {}, viajes: [], actosHechos: [], acto: 1 } as unknown as DatosHeroe;
      const tx = textoFuente(d, f, p.id);
      if (!tx.tx?.[0] || !tx.tx?.[1] || !tx.ru?.[0]) out.push(`${p.id} (${f.t})`);
    } catch { out.push(`${p.id} (${f.t})`); }
  }
  for (const r of ROJOS) for (const id of [r.a, r.b]) if (!HILOS.some((h) => h.piezas.some((p) => p.id === id))) out.push(`rojo ${id}`);
  for (const m of MARGEN) if (!HILOS.some((h) => h.piezas.some((p) => p.id === m.p))) out.push(`margen ${m.p}`);
  return out;
}
export { PORTADA };
(globalThis as any).__libroRotas = piezasRotas;
/** Para las pruebas: las misiones, las piezas que se anotan al oírlas y todas las piezas. */
(globalThis as any).__libroDatos = () => ({
  misiones: MISIONES.map((m) => ({ id: m.id, el: !!m.eleccion })),
  oidos: HILOS.flatMap((h) => h.piezas.filter((p) => fuentes(p).some((f) => ['npc', 'desvio', 'voz', 'entrada', 'jefeZona', 'jefe', 'caza'].includes(f.t))).map((p) => p.id)),
  todas: HILOS.flatMap((h) => h.piezas.map((p) => p.id)),
});
(globalThis as any).__libroCuenta = cuentaLibro;
