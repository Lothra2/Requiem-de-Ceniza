// Balance con campamentos, sin pantalla: un héroe típico (el de balance.mts) entra de verdad a una zona real (poblar del
// juego) y la limpia encuentro por encuentro con un jugador simple (va al más cercano, pega con su poder, toma pociones).
// Mide por tramo de pelea (mientras haya alguien persiguiéndolo): cuerpos encima a la vez, duración, pociones, vida mínima
// y muertes. Sirve igual con el trazado de antes: RAIZ=/otra/copia/juego corre el mismo jugador contra otra copia del repo.
//
//   npx tsx juego/herramientas/t1010_campamentos.mts [--clases a,b] [--niveles 1,5,10,20,35,50] [--semillas 3]
//       [--muertes 45] [--salida res.json] [--md tabla.md] [--inicio] [--banderas __vistaVieja,...]
//   --inicio: los primeros minutos de un héroe nuevo (nivel 1, equipo de salida, descuidado) entrando al páramo por su puerta.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

function mulberry(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let azar = mulberry(1);
Math.random = () => azar();
const sembrar = (...k: (string | number)[]) => { let h = 2166136261; for (const c of k.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); azar = mulberry(h >>> 0); };
const arg = (n: string, d: string) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const SEMILLAS = +arg('semillas', '3');
const CLASES_SIM = arg('clases', 'berserker,templario,arcanista,cazadora,nigromante,monje,druida,alquimista').split(',');
const NIVELES = arg('niveles', '1,5,10,20,35,50').split(',').map(Number);
const MUERTES = +arg('muertes', '45');
const INICIO = process.argv.includes('--inicio');
const DIAG = process.argv.includes('--diag');
const diag = { n: 0, pg: 0, el: 0, ti: 0, pgMax: 0, h: new Array(10).fill(0) };
for (const b of arg('banderas', '').split(',').filter(Boolean)) (globalThis as any)[b] = true;

const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const carga = (p: string) => sv.ssrLoadModule(p) as Promise<any>;
const HE = await carga('/src/juego/heroe.ts');
const MU = await carga('/src/juego/mundo.ts');
const OB = await carga('/src/juego/objetos.ts');
const OD = await carga('/src/datos/objetos_datos.ts');
const CL = await carga('/src/datos/clases.ts');
const AC = await carga('/src/mundo/actos.ts');
const ZO = await carga('/src/mundo/zona.ts');

// ------------------------------------------------------------------ el héroe típico (igual que balance.mts)
interface Plan { armas: (n: number) => string[]; izq?: (b: any) => boolean; atrib: { fue: number; des: number; vit: number; ene: number }; habs: string[]; principal: (habs: Record<string, number>) => string }
const PLANES: Record<string, Plan> = {
  berserker: { armas: (n) => (n >= 11 ? ['hacha_doble'] : ['hacha']), atrib: { fue: 0.4, des: 0.15, vit: 0.45, ene: 0 }, habs: ['tajo_salvaje', 'maestria_hachas', 'doble_golpe', 'piel_curtida', 'frenesi'], principal: () => 'tajo_salvaje' },
  templario: { armas: () => ['espada'], izq: (b) => b.familia === 'escudo' && !b.clase, atrib: { fue: 0.35, des: 0.2, vit: 0.45, ene: 0 }, habs: ['golpe_sagrado', 'voto_acero', 'disciplina', 'filo_alba'], principal: () => 'golpe_sagrado' },
  arcanista: { armas: () => ['varita'], izq: (b) => b.familia === 'orbe', atrib: { fue: 0.1, des: 0.05, vit: 0.55, ene: 0.3 }, habs: ['bola_fuego', 'saeta_ignea', 'maestria_fuego', 'ceniza_venas'], principal: (h) => (h.bola_fuego ? 'bola_fuego' : 'saeta_ignea') },
  cazadora: { armas: () => ['arco'], atrib: { fue: 0.15, des: 0.45, vit: 0.4, ene: 0 }, habs: ['flecha_certera', 'pulso_firme', 'aljaba_viva', 'ojo_halcon'], principal: () => 'flecha_certera' },
  nigromante: { armas: () => ['varita', 'daga'], izq: (b) => b.familia === 'escudo' && b.clase === 'nigromante', atrib: { fue: 0.15, des: 0.05, vit: 0.5, ene: 0.3 }, habs: ['lanza_hueso', 'espiral_huesos', 'armadura_hueso', 'medula_negra'], principal: () => 'lanza_hueso' },
  monje: { armas: () => ['garras'], atrib: { fue: 0.2, des: 0.35, vit: 0.45, ene: 0 }, habs: ['puno_rayo', 'puno_eco', 'nudillos_hierro', 'arte_remate', 'tercer_ojo'], principal: (h) => (h.puno_eco ? 'puno_eco' : 'puno_rayo') },
  druida: { armas: () => ['baculo'], atrib: { fue: 0.15, des: 0.1, vit: 0.5, ene: 0.25 }, habs: ['invocar_lobo', 'corazon_salvaje', 'oso_espiritu', 'rafaga_artica', 'ojo_nube'], principal: (h) => (h.rafaga_artica ? 'rafaga_artica' : 'ataque') },
  alquimista: { armas: () => ['ballesta'], izq: () => false, atrib: { fue: 0.2, des: 0.3, vit: 0.4, ene: 0.1 }, habs: ['bomba_ignea', 'bandolera', 'bomba_cluster', 'polvora_negra'], principal: (h) => (h.bomba_cluster ? 'bomba_cluster' : 'bomba_ignea') },
};
const premioHab = (n: number) => Math.round(23 * Math.min(1, n / 60));
const premioAtr = (n: number) => Math.round(110 * Math.min(1, n / 60));
function aprenderHasta(d: any, plan: Plan, nivel: number) {
  let gastados = Object.values<number>(d.habs).reduce((a, b) => a + b, 0);
  const aprender = (id: string): boolean => {
    const hb = CL.HABILIDADES.find((x: any) => x.id === id); if (!hb) return false;
    for (const r of hb.req ?? []) if (!d.habs[r]) { if (!aprender(r)) return false; if (d.puntosHab <= 0) return false; }
    d.puntosHab = Math.max(d.puntosHab, 0);
    if (d.puntosHab <= 0 || !HE.puedeAprender(d, hb)) return false;
    d.habs[id] = (d.habs[id] ?? 0) + 1; d.puntosHab--; gastados++;
    return true;
  };
  for (let n = 1; n <= nivel; n++) {
    d.nivel = n; d.puntosHab = n + 1 + premioHab(n) - gastados;
    let otra = true;
    while (d.puntosHab > 0 && otra) { otra = false; for (const id of plan.habs) if (aprender(id)) { otra = true; break; } }
  }
  d.puntosHab = 0;
}
function armarHeroe(clase: string, nivel: number, nivelObj: number, semilla: number) {
  const plan = PLANES[clase];
  const d = HE.nuevoHeroe(clase, 'Sim');
  sembrar('heroe', clase, nivel, semilla);
  d.habs = {}; d.cinturon = [null, null, null, null]; d.bolsa = [];
  const primera = CL.HABILIDADES.find((x: any) => x.clase === clase && x.nivelReq === 1 && x.tipo !== 'pasiva' && x.tipo !== 'aura' && x.tipo !== 'buff');
  if (primera) d.habs[primera.id] = 1;
  aprenderHasta(d, plan, nivel);
  const puntos = 5 * (nivel - 1) + premioAtr(nivel);
  for (const k of ['fue', 'des', 'vit', 'ene'] as const) d[k] += Math.floor(puntos * (plan.atrib as any)[k]);
  d.dificultad = 0; d.nivel = nivel; d.xp = -1e15;
  sembrar('equipo', clase, nivel, semilla);
  const cabe = (b: any) => (b.req.fue ?? 0) <= d.fue && (b.req.des ?? 0) <= d.des && (b.req.nivel ?? 1) <= nivel && (!b.clase || b.clase === clase);
  const tirar = (filtro: (b: any) => boolean) => {
    for (let i = 0; i < 8; i++) {
      const q = azar();
      const rar = i > 4 ? 'magico' : q < 0.5 ? 'magico' : q < 0.92 ? 'raro' : 'unico';
      const o = OB.crearObjeto(nivelObj, rar, (b: any) => filtro(b) && cabe(b));
      const b = OB.baseDe(o);
      if (b && filtro(b) && cabe(b) && HE.reqNivel(o) <= nivel) return o;
    }
    const bs = OD.BASES.filter((b: any) => filtro(b) && cabe(b) && b.nivel <= Math.max(1, nivelObj)).sort((a: any, b: any) => b.nivel - a.nivel);
    return bs.length ? OB.crearBase(bs[0], nivelObj) : null;
  };
  const fams = plan.armas(nivel);
  d.equipo = {};
  const arma = tirar((b) => b.ranura === 'arma' && fams.includes(b.familia));
  if (arma) d.equipo.arma = arma;
  const ba = arma ? OB.baseDe(arma) : null;
  if (plan.izq && !ba?.dosManos) { const o = tirar((b) => b.ranura === 'izq' && plan.izq!(b)); if (o) d.equipo.izq = o; }
  for (const [cas, ran] of [['cabeza', 'cabeza'], ['torso', 'torso'], ['manos', 'manos'], ['cinturon', 'cinturon'], ['pies', 'pies'], ['amuleto', 'amuleto'], ['anillo1', 'anillo'], ['anillo2', 'anillo']]) {
    const o = tirar((b) => b.ranura === ran && (ran !== 'cabeza' || !b.clase));
    if (o) d.equipo[cas] = o;
  }
  return d;
}

// ------------------------------------------------------------------ el jugador
const DT = 1 / 30;
const esMelee = (hb: any, c: any, basico: boolean) => (hb.tipo === 'golpe' && !(basico && c.distancia)) || hb.tipo === 'salto' || hb.tipo === 'carga' || hb.tipo === 'torbellino';
interface Tramo { dur: number; cuerpos: number; pico: number; pociones: number; vidaMin: number; muertes: number }
interface Corrida { t: number; bajas: number; muertes: number; pociones: number; vidaMin: number; tramos: Tramo[]; xp: number }
/**
 * Limpia la zona hasta `tope` bajas o `tMax` segundos. `descuidado`: solo el golpe básico o el don inicial, poción recién al 30 %.
 * Al morir vuelve con la vida llena en el mismo sitio (se cuenta la muerte) y sigue: lo que se mide es cuántas veces.
 */
function limpiar(d: any, zid: string, entrada: string, tope: number, tMax: number, descuidado: boolean, soloTramos = 0): Corrida {
  const j = MU.crearJuego(d, 0);
  MU.olvidarZonas?.();
  MU.entrarZona(j, zid, entrada);
  const h = j.heroe, zona = j.zona;
  vidaRef = h.vidaMax || 1;
  MU.reiniciarMecanicas(h);
  const hab = PLANES[d.clase].principal(d.habs);
  // las invocaciones que no piden cadáver salen antes de pelear
  for (const id of Object.keys(d.habs)) {
    const hb = MU.habilidadDe(id);
    if (!hb || hb.tipo !== 'invocar' || hb.definitiva || ['alzar_esqueleto', 'mago_hueso', 'marcha_fosa'].includes(id)) continue;
    const n = HE.nivelHab(d, id, h.c), mx = Math.max(1, Math.floor(hb.max[0] + hb.max[1] * (n - 1)));
    for (let k = 0; k < mx; k++) { h.mana = h.c.manaMax; MU.usarHabilidad(j, id, h.x + 1, h.y, null); for (let t = 0; t < 1.5 && (h.acc === 'lanzar' || h.acc === 'atacar'); t += DT) MU.actualizar(j, DT); }
  }
  const esJefe = (m: any) => m.def.jefe || m.def.ia === 'jefe' || m.calidad >= 3 || m.jefeZona;
  const vetados = new Set<any>();
  const todos0 = j.monstruos.filter((m: any) => !m.dueno && !esJefe(m));
  const blancos = () => j.monstruos.filter((m: any) => !m.muerto && !m.dueno && !esJefe(m) && !vetados.has(m));
  const total0 = blancos().length, x0 = h.x, y0 = h.y;
  const out: Corrida = { t: 0, bajas: 0, muertes: 0, pociones: 0, vidaMin: 1, tramos: [], xp: 0 };
  let tr: Tramo | null = null, tCamino = -9, tPocion = -9, calma = 0, vivos0 = total0, atasco = 0, px = h.x, py = h.y, tAt = 0;
  for (let t = 0; t < tMax; t += DT) {
    out.t = t;
    if (h.muerto && DIAG) console.log('MUERTE', d.clase, zid, 't', t.toFixed(0), j.monstruos.filter((m: any) => !m.muerto && !m.dueno && m.estado === 'perseguir' && Math.hypot(m.x - h.x, m.y - h.y) < 9).map((m: any) => m.def.id + (m.calidad ? '*' + m.calidad + '[' + m.mods.join(',') + ']' : '') + '@' + Math.hypot(m.x - h.x, m.y - h.y).toFixed(1)).join(' '));
    if (h.muerto) { out.muertes++; if (tr) tr.muertes++; h.muerto = false; h.vida = h.vidaMax; h.acc = 'quieto'; h.camino = null; tPocion = t;
      // como en el juego: vuelve a la entrada, lo que lo mató se calma y se cura; el jugador no vuelve de cabeza al mismo élite
      for (const m of j.monstruos) if (!m.muerto && !m.dueno && (m.estado === 'perseguir' || Math.hypot(m.x - h.x, m.y - h.y) < 12)) { m.estado = 'dormido'; m.objetivo = null; m.vida = m.vidaMax; m.camino = null; m.x = m.ox; m.y = m.oy; if (m.calidad >= 1 || m.lider) { vetados.add(m); m.muerto = true; m.tMuerto = 999; } }
      h.x = x0; h.y = y0; }
    const umbral = descuidado ? 0.3 : 0.45;
    if (h.vida < h.vidaMax * umbral && t - tPocion > 2.5) { tPocion = t; h.vida = Math.min(h.vidaMax, h.vida + h.vidaMax * 0.45); out.pociones++; if (tr) tr.pociones++; }
    const bl = blancos();
    const encima = bl.filter((m: any) => m.estado === 'perseguir' && m.objetivo === h);
    if (encima.length) {
      if (!tr) { tr = { dur: 0, cuerpos: 0, pico: 0, pociones: 0, vidaMin: 1, muertes: 0 }; vivos0 = out.bajas; }
      tr.dur += DT; calma = 0;
      const cerca = encima.filter((m: any) => Math.hypot(m.x - h.x, m.y - h.y) < 9).length;
      tr.pico = Math.max(tr.pico, cerca); tr.vidaMin = Math.min(tr.vidaMin, h.vida / h.vidaMax);
      if (encima.some((m: any) => m.calidad >= 1)) (tr as any).elite = true;
      if (DIAG) { let pg = 0, el = 0, ti = 0; for (const m of encima) { const dd = Math.hypot(m.x - h.x, m.y - h.y); const tiro = m.def.ia === 'distancia' || m.def.ia === 'mago' || m.def.ia === 'invocador'; if (m.calidad >= 1) { if (m.acc === 'atacar') el++; } else if (tiro) { if (m.acc === 'atacar' || m.acc === 'lanzar') ti++; } else if (m.acc === 'atacar') pg++; } diag.n++; diag.pg += pg; diag.el += el; diag.ti += ti; diag.pgMax = Math.max(diag.pgMax, pg); diag.h[Math.min(9, pg)]++; }
    } else if (tr) {
      calma += DT;
      if (calma > 1.2) { tr.cuerpos = todos0.filter((m: any) => m.muerto && !vetados.has(m)).length - vivos0; if (tr.cuerpos > 0) out.tramos.push(tr); tr = null; if (soloTramos && out.tramos.length >= soloTramos) break; }
    }
    out.vidaMin = Math.min(out.vidaMin, h.vida / h.vidaMax);
    out.bajas = todos0.filter((m: any) => m.muerto && !vetados.has(m)).length;
    if (out.bajas >= tope || !bl.length) break;
    if (hab !== 'ataque' && !descuidado && h.mana < MU.costoMana(j, MU.habilidadDe(hab))) h.mana = h.c.manaMax;
    if (!(h.acc === 'atacar' || h.acc === 'lanzar' || h.acc === 'herido') && !h.salto && !(h.torbellino > 0)) {
      let obj: any = null, bd = 1e9;
      for (const m of encima.length ? encima : bl) { const dd = Math.hypot(m.x - h.x, m.y - h.y); if (dd < bd) { bd = dd; obj = m; } }
      if (obj) {
        let id = hab;
        if (id !== 'ataque' && ((h.recargas[id] ?? 0) > 0 || h.mana < MU.costoMana(j, MU.habilidadDe(id)))) id = 'ataque';
        const hb = MU.habilidadDe(id);
        const ver = ZO.lineaLibre(zona, h.x, h.y, obj.x, obj.y);
        const acercarse = esMelee(hb, h.c, id === 'ataque') ? bd > 1.2 + obj.radio : !ver || bd > 7;
        if (acercarse) { if (!h.camino || t - tCamino > 0.4) { h.camino = ZO.buscarCamino(zona, h.x, h.y, obj.x, obj.y, 6000) ?? null; tCamino = t; if (!h.camino) vetados.add(obj); } }
        else { h.camino = null; if (!MU.usarHabilidad(j, id, obj.x, obj.y, obj) && id !== 'ataque') MU.usarHabilidad(j, 'ataque', obj.x, obj.y, obj); }
        // el jugador no avanza (blanco que no se alcanza): se salta
        tAt += DT;
        if (tAt > 3) { if (Math.hypot(h.x - px, h.y - py) < 0.5 && !encima.length && acercarse) { atasco++; vetados.add(obj); } px = h.x; py = h.y; tAt = 0; }
      }
    }
    const xp0 = d.xp;
    MU.actualizar(j, DT);
    if (d.xp > xp0) out.xp += d.xp - xp0;
    if (d.nivel !== (d as any).__n0) { d.nivel = (d as any).__n0; }
  }
  for (const m of todos0) if (m.muerto && !vetados.has(m)) { if (m.calidad >= 2) cuenta.unicos++; else if (m.calidad === 1) cuenta.campeones++; else cuenta.comunes++; }
  for (const m of todos0) { if (m.calidad >= 2) cuenta.unicosZona++; else if (m.calidad === 1) cuenta.campeonesZona++; else cuenta.comunesZona++; }
  if (tr && tr.dur > 0) { tr.cuerpos = todos0.filter((m: any) => m.muerto && !vetados.has(m)).length - vivos0; if (tr.cuerpos > 0) out.tramos.push(tr); }
  void atasco;
  return out;
}

const ZONAS_COMBATE = Object.values<any>(AC.ZONAS).filter((z) => z.tipo !== 'pueblo' && AC.POBL_ZONA[z.id] && !z.casa);
function zonasPara(nivel: number) {
  if (arg('zonas', '')) return arg('zonas', '').split(',').map((id) => AC.ZONAS[id]);
  const ord = ZONAS_COMBATE.map((z) => ({ z, d: Math.abs(z.nivel - nivel) })).sort((a, b) => a.d - b.d);
  return [...ord.filter((x) => x.z.tipo === 'exterior').slice(0, 2), ...ord.filter((x) => x.z.tipo === 'mazmorra').slice(0, 2)].map((x) => x.z);
}
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : NaN);
const med = (v: number[]) => { const s = v.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : NaN; };
const f1 = (v: number) => (Number.isFinite(v) ? (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(1)) : '-');
let md = '';
const linea = (s: string) => { md += s + '\n'; console.log(s); };
const filas: any[] = [];
const filasTr: any[] = [];
const cuenta = { unicos: 0, campeones: 0, comunes: 0, unicosZona: 0, campeonesZona: 0, comunesZona: 0 };
const danoPor: Record<string, number> = {}; let vidaRef = 1;
(globalThis as any).__danoHeroe = (g: any, total: number) => { const f = g.fuente; const k = !f || !f.def ? 'otro' : (f.calidad >= 2 ? 'único' : f.calidad === 1 ? 'campeón' : f.lider ? 'esbirro' : 'común') + ' ' + (f.acc === 'atacar' && !f.aDist ? 'cuerpo' : 'tiro'); danoPor[k] = (danoPor[k] ?? 0) + total / vidaRef; };

if (INICIO) {
  linea('| clase | muertes en los 2 primeros encuentros (de ' + SEMILLAS * 2 + ' corridas) | vida mínima (peor / mediana) | pociones | cuerpos del 1.º y 2.º | segundos |');
  linea('|---|---|---|---|---|---|');
  for (const clase of CLASES_SIM) {
    let muertes = 0; const vmin: number[] = [], poc: number[] = [], c1: number[] = [], c2: number[] = [], dur: number[] = [];
    for (let s = 0; s < SEMILLAS * 2; s++) {
      sembrar('inicio', clase, s);
      const d = HE.nuevoHeroe(clase, 'Sim'); d.id = 'nuevo' + s; d.dificultad = 0; (d as any).__n0 = d.nivel;
      const r = limpiar(d, 'a1_paramo', 'o', 999, 240, true, 2);
      muertes += r.tramos.slice(0, 2).reduce((a, x) => a + x.muertes, 0);
      vmin.push(Math.min(...r.tramos.slice(0, 2).map((x) => x.vidaMin), 1)); poc.push(r.tramos.slice(0, 2).reduce((a, x) => a + x.pociones, 0));
      if (r.tramos[0]) c1.push(r.tramos[0].cuerpos); if (r.tramos[1]) c2.push(r.tramos[1].cuerpos); dur.push(r.tramos.slice(0, 2).reduce((a, x) => a + x.dur, 0));
    }
    filas.push({ clase, muertes, vidaMinPeor: Math.min(...vmin), vidaMinMed: med(vmin), pociones: media(poc), c1: media(c1), c2: media(c2), seg: media(dur) });
    linea(`| ${clase} | ${muertes} | ${Math.round(Math.min(...vmin) * 100)} % / ${Math.round(med(vmin) * 100)} % | ${f1(media(poc))} | ${f1(media(c1))} y ${f1(media(c2))} | ${f1(media(dur))} |`);
  }
} else {
  linea('| clase | nivel | zonas | cuerpos por pelea (media / máx a la vez) | s por pelea | bajas/min | pociones por 100 bajas | muertes por 100 bajas | muertes por hora | vida mínima mediana por pelea | xp por baja |');
  linea('|---|---|---|---|---|---|---|---|---|---|---|');
  for (const nivel of NIVELES) for (const clase of CLASES_SIM) {
    const zs = zonasPara(nivel);
    let t = 0, bajas = 0, muertes = 0, poc = 0, xp = 0; const trs: Tramo[] = [];
    for (const z of zs) for (let s = 0; s < SEMILLAS; s++) {
      const d = armarHeroe(clase, Math.max(nivel, 1), Math.max(1, z.nivel - 2), s); d.id = 'sim' + s; (d as any).__n0 = d.nivel;
      sembrar('corrida', clase, nivel, z.id, s);
      const r = limpiar(d, z.id, 'viaje', MUERTES, 420, false);
      t += r.t; bajas += r.bajas; muertes += r.muertes; poc += r.pociones; xp += r.xp; trs.push(...r.tramos); filasTr.push(...r.tramos);
    }
    const f = { clase, nivel, zonas: zs.map((z) => z.id).join(' '), cuerpos: media(trs.map((x) => x.cuerpos)), pico: media(trs.map((x) => x.pico)), picoMax: Math.max(...trs.map((x) => x.pico), 0), durTramo: media(trs.map((x) => x.dur)), bajasMin: (bajas / t) * 60, pocBajas: (poc / Math.max(1, bajas)) * 100, muertesBajas: (muertes / Math.max(1, bajas)) * 100, muertesHora: (muertes / t) * 3600, vidaMin: med(trs.map((x) => x.vidaMin)), xpBaja: xp / Math.max(1, bajas), bajas, t };
    filas.push(f);
    linea(`| ${clase} | ${nivel} | ${f.zonas} | ${f1(f.cuerpos)} (${f1(f.pico)} / ${f.picoMax}) | ${f1(f.durTramo)} | ${f1(f.bajasMin)} | ${f1(f.pocBajas)} | ${f1(f.muertesBajas)} | ${f1(f.muertesHora)} | ${Math.round(f.vidaMin * 100)} % | ${f1(f.xpBaja)} |`);
  }
  linea('\n| nivel | cuerpos por pelea | a la vez (media) | s por pelea | bajas/min | pociones por 100 bajas | muertes por hora | vida mínima |');
  linea('|---|---|---|---|---|---|---|---|');
  for (const nivel of NIVELES) { const fs = filas.filter((f) => f.nivel === nivel); const m = (k: string) => media(fs.map((f) => f[k])); linea(`| ${nivel} | ${f1(m('cuerpos'))} | ${f1(m('pico'))} | ${f1(m('durTramo'))} | ${f1(m('bajasMin'))} | ${f1(m('pocBajas'))} | ${f1(m('muertesHora'))} | ${Math.round(m('vidaMin') * 100)} % |`); }
}
if (DIAG) { const T = filasTr; const e = T.filter((x: any) => x.elite), c = T.filter((x: any) => !x.elite); const su = (v: any[], k: string) => v.reduce((a, x) => a + x[k], 0); console.log('tramos con élite', e.length, 'muertes', su(e, 'muertes'), 'pociones', su(e, 'pociones'), 'cuerpos', su(e, 'cuerpos'), '| sin élite', c.length, 'muertes', su(c, 'muertes'), 'pociones', su(c, 'pociones'), 'cuerpos', su(c, 'cuerpos')); }
if (DIAG) console.log('daño recibido (en vidas enteras) por fuente:', Object.entries(danoPor).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ' ' + v.toFixed(1)).join(', '));
if (DIAG) console.log('bajas y en la zona', JSON.stringify(cuenta));
if (DIAG) console.log('diag: pegados (comunes cuerpo a cuerpo) media', (diag.pg / diag.n).toFixed(2), 'máx', diag.pgMax, 'élites pegados', (diag.el / diag.n).toFixed(2), 'tirando', (diag.ti / diag.n).toFixed(2), 'histograma', diag.h.map((x) => Math.round((x / diag.n) * 100)).join(' '));
if (arg('salida', '')) writeFileSync(arg('salida', ''), JSON.stringify(filas, null, 1));
if (arg('md', '')) writeFileSync(arg('md', ''), md);
await sv.close();
process.exit(0);
