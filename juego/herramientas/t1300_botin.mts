// Botín en evolución, sin pantalla. Un héroe recorre la campaña Normal en orden (las zonas de combate de cada acto, del
// nivel más bajo al más alto), mata todo lo que sale de verdad en cada zona (poblar del juego vía entrarZona), gana la
// experiencia del juego (con su castigo por monstruo bajo) y tira el botín del juego (`botin`, lo extra del jefe y su
// legendaria) con el azar sembrado. Los mismos drops se miran con los ojos de cada clase: lleva siempre la mejor arma y la
// mejor armadura que puede usar (requisitos de nivel, fuerza y destreza con los atributos del héroe típico de balance.mts)
// y anota a qué nivel cambia, de qué rareza viene y cuánto gana. Lo que no puede llevar todavía lo guarda y lo prueba al
// subir de nivel (como un jugador que guarda el único para después).
//
//   npx tsx juego/herramientas/t1300_botin.mts [--clases a,b] [--semillas 3] [--hasta 60] [--hallazgo 30]
//       [--banderas __botinViejo] [--md tabla.md] [--salida res.json] [--detalle]
//   RAIZ=/otra/copia/juego corre lo mismo contra otra copia del repo (el antes).
//
// Valor del arma: daño por segundo del héroe con ella (calcular del juego: daño físico medio más el elemental, por la
// velocidad de ataque y el crítico). En las clases de hechizos (arcanista, nigromante, druida) el arma vale por
// lo que le suma a los hechizos: (1 + daño de hechizos) × (1 + 0,08 por habilidad de más) × (1 + velocidad de lanzar / 2).
// Mejora real: lo que deja el valor 15 % o más por encima del de la mejora real anterior.
// "Típico del balance": lo que lleva el héroe de balance.mts y t1010 a ese nivel (crearObjeto al nivel menos 2, mitad
// mágico, 42 % raro, 8 % único), media de 16 tiradas. Sirve para ver si el héroe que juega se va muy arriba de lo que el
// balance espera.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import { writeFileSync } from 'node:fs';

function mulberry(seed: number) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
let azar = mulberry(1);
Math.random = () => azar();
const sembrar = (...k: (string | number)[]) => { let h = 2166136261; for (const c of k.join('|')) h = Math.imul(h ^ c.charCodeAt(0), 16777619); azar = mulberry(h >>> 0); };
const arg = (n: string, d: string) => { const i = process.argv.indexOf('--' + n); return i >= 0 ? process.argv[i + 1] : d; };
const SEMILLAS = +arg('semillas', '3');
const CLASES_SIM = arg('clases', 'berserker,templario,cazadora,monje,arcanista,nigromante,druida,alquimista').split(',');
const HASTA = +arg('hasta', '60');
const HALLAZGO = +arg('hallazgo', '30');
const DETALLE = process.argv.includes('--detalle');
for (const b of arg('banderas', '').split(',').filter(Boolean)) { const [k, v] = b.split('='); (globalThis as any)[k] = v === undefined ? true : +v; }

if (process.env.BOTIN) (globalThis as any).__botin = JSON.parse(process.env.BOTIN);
const nada: any = new Proxy(function () {}, { get: (_t, k) => (k === Symbol.toPrimitive ? () => 0 : nada), apply: () => nada, construct: () => nada });
(globalThis as any).document ??= nada; (globalThis as any).window ??= globalThis;
const raiz = process.env.RAIZ ?? fileURLToPath(new URL('..', import.meta.url));
const sv = await createServer({ root: raiz, configFile: false, logLevel: 'error', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const carga = (p: string) => sv.ssrLoadModule(p) as Promise<any>;
const HE = await carga('/src/juego/heroe.ts');
const MU = await carga('/src/juego/mundo.ts');
const OB = await carga('/src/juego/objetos.ts');
const AC = await carga('/src/mundo/actos.ts');
const CL = await carga('/src/datos/clases.ts');
const TA = await carga('/src/datos/talismanes.ts');

// ------------------------------------------------------------------ el héroe típico (atributos de balance.mts)
const ATRIB: Record<string, { fue: number; des: number; vit: number; ene: number }> = {
  berserker: { fue: 0.4, des: 0.15, vit: 0.45, ene: 0 }, templario: { fue: 0.35, des: 0.2, vit: 0.45, ene: 0 },
  arcanista: { fue: 0.1, des: 0.05, vit: 0.55, ene: 0.3 }, cazadora: { fue: 0.15, des: 0.45, vit: 0.4, ene: 0 },
  nigromante: { fue: 0.15, des: 0.05, vit: 0.5, ene: 0.3 }, monje: { fue: 0.2, des: 0.35, vit: 0.45, ene: 0 },
  druida: { fue: 0.15, des: 0.1, vit: 0.5, ene: 0.25 }, alquimista: { fue: 0.2, des: 0.3, vit: 0.4, ene: 0.1 },
};
const premioAtr = (n: number) => Math.round(110 * Math.min(1, n / 60));
const MELEE = ['espada', 'cimitarra', 'mandoble', 'hacha', 'hacha_doble', 'maza', 'martillo', 'mangual', 'lanza', 'alabarda', 'guadana'];
/** Qué armas mira cada clase (las que su estilo usa; las torpes no). */
const FAMS: Record<string, (b: any) => boolean> = {
  berserker: (b) => MELEE.includes(b.familia),
  templario: (b) => MELEE.includes(b.familia) && !b.dosManos || b.familia === 'cetro',
  cazadora: (b) => b.familia === 'arco' || b.familia === 'ballesta',
  monje: (b) => b.familia === 'garras',
  arcanista: (b) => b.familia === 'varita' || b.familia === 'baculo',
  nigromante: (b) => b.familia === 'varita' || b.familia === 'daga' || b.familia === 'guadana',
  druida: (b) => b.familia === 'baculo' || b.familia === 'lanza',
  alquimista: (b) => b.familia === 'ballesta' || b.familia === 'daga',
};
const HECHIZOS = new Set(['arcanista', 'nigromante', 'druida']);
const ARMADURA = ['torso', 'cabeza', 'manos', 'pies', 'cinturon'];

function heroeAl(clase: string, nivel: number) {
  const d = HE.nuevoHeroe(clase, 'Sim');
  const c = CL.CLASES.find((x: any) => x.id === clase);
  const puntos = 5 * (nivel - 1) + premioAtr(nivel);
  for (const k of ['fue', 'des', 'vit', 'ene'] as const) d[k] = c.base[k] + Math.floor(puntos * ATRIB[clase][k]);
  d.nivel = nivel; d.habs = {};
  return d;
}
function valorArma(d: any, o: any): number {
  const prev = d.equipo.arma; d.equipo.arma = o;
  const c = HE.calcular(d); d.equipo.arma = prev;
  if (HECHIZOS.has(d.clase)) return (1 + (c.st.dano_hechizos ?? 0) / 100) * (1 + 0.08 * (c.mas_habilidades ?? 0)) * (1 + (c.vel_lanzar ?? 0) / 200) * 100;
  let el = 0; for (const v of Object.values<number>(c.elem)) el += v;
  const dur = Math.min(1, Math.max(0.25, 0.62 / (1 + c.vel_ataque / 100)));
  return (((c.dano[0] + c.dano[1]) / 2 + el) * (1 + c.critico / 100)) / dur;
}
function puede(d: any, o: any, slot: string): boolean {
  const b = OB.baseDe(o); if (!b) return false;
  if (slot === 'arma' ? !(b.ranura === 'arma' && FAMS[d.clase](b)) : b.ranura !== slot) return false;
  if (slot === 'cabeza' && b.clase && b.clase !== d.clase) return false;
  const prev = d.equipo[slot]; d.equipo[slot] = undefined;
  const c = HE.calcular(d); d.equipo[slot] = prev;
  return HE.cumpleReq(d, c, o);
}

// ------------------------------------------------------------------ la campaña: cada zona una vez, en orden
const ZONAS = Object.values<any>(AC.ZONAS).filter((z) => z.tipo !== 'pueblo' && AC.POBL_ZONA[z.id]).sort((a, b) => a.acto - b.acto || a.nivel - b.nivel);
interface Caida { nivelH: number; o: any; cal: number }
interface Baja { nivelH: number; nivel: number; cal: number; id: string; zona: string }
/** La campaña: qué se mata, a qué nivel del héroe (la experiencia no depende de la clase). */
function campana(semilla: number) {
  const d = HE.nuevoHeroe('berserker', 'Sim'); d.id = 'sim' + semilla;
  const j = MU.crearJuego(d, 0);
  const bajas: Baja[] = []; let xp = 0, nivel = 1;
  for (const z of ZONAS) {
    if (nivel >= HASTA + 3) break;
    sembrar('zona', z.id, semilla);
    d.nivel = nivel; d.xp = xp; MU.olvidarZonas(); MU.entrarZona(j, z.id, 'viaje');
    for (const m of j.monstruos.filter((m: any) => !m.dueno)) {
      const dif = nivel - m.nivel, k = dif > 5 ? Math.max(0.05, 1 - (dif - 5) * 0.15) : 1;
      xp += Math.round(m.xp * k);
      while (xp >= HE.xpPara(nivel + 1) && nivel < 100) nivel++;
      bajas.push({ nivelH: nivel, nivel: m.nivel, cal: m.def.jefe ? 4 : m.calidad, id: m.def.id, zona: z.id });
    }
  }
  return { bajas, nivelFinal: nivel };
}
/** El botín de esas bajas para un héroe de esa clase (botin del juego con la clase, lo extra del jefe y su legendaria). */
function tirar(bajas: Baja[], clase: string, semilla: number): Caida[] {
  const caidas: Caida[] = []; let zona = '';
  for (const m of bajas) {
    if (m.zona !== zona) { zona = m.zona; sembrar('botin', zona, semilla, clase); }
    const cs = OB.botin(m.nivel, m.cal, HALLAZGO, 0, clase);
    if (m.cal === 4) cs.push({ obj: OB.crearObjeto(m.nivel, azar() < 0.5 ? 'unico' : 'raro') }, { obj: OB.crearObjeto(m.nivel, 'raro') });
    const tj = TA.TALISMAN_JEFE?.[m.id]; if (tj) { const o = OB.crearUnicoId(tj, m.nivel); if (o) cs.push({ obj: o }); }
    const lj = OB.legendariaJefe(m.id, m.nivel, m.cal); if (lj) cs.push({ obj: lj });
    for (const c of cs) if (c.obj && c.obj.tipo === 'equipo') caidas.push({ nivelH: m.nivelH, o: c.obj, cal: m.cal });
  }
  return caidas;
}

// ------------------------------------------------------------------ lo típico del balance (lo que esperan balance.mts y t1010)
function tipicoBalance(clase: string, nivel: number, semilla: number): number {
  const d = heroeAl(clase, nivel); let s = 0, n = 0;
  for (let i = 0; i < 16; i++) {
    sembrar('tipico', clase, nivel, semilla, i);
    let o: any = null;
    for (let t = 0; t < 8 && !o; t++) {
      const q = azar(); const rar = t > 4 ? 'magico' : q < 0.5 ? 'magico' : q < 0.92 ? 'raro' : 'unico';
      const x = OB.crearObjeto(Math.max(1, nivel - 2), rar, (b: any) => b.ranura === 'arma' && FAMS[clase](b));
      if (puede(d, x, 'arma')) o = x;
    }
    if (o) { s += valorArma(d, o); n++; }
  }
  return n ? s / n : 0;
}

// ------------------------------------------------------------------ cada clase con los mismos drops
interface Cambio { nivel: number; rareza: string; base: string; nombre: string; ilvl: number; valor: number; gana: number }
function recorrer(clase: string, caidas: Caida[]) {
  let nivel = 1; let d = heroeAl(clase, 1);
  const ini = HE.nuevoHeroe(clase, 'Sim').equipo;
  d.equipo = { ...ini };
  const best: Record<string, number> = { arma: d.equipo.arma ? valorArma(d, d.equipo.arma) : 0 };
  for (const s of ARMADURA) best[s] = d.equipo[s]?.def ?? 0;
  const cambios: Record<string, Cambio[]> = { arma: [], armadura: [] };
  const curva: { arma: number[]; armadura: number[]; ilvl: number[] } = { arma: [], armadura: [], ilvl: [] };
  const guardado: Record<string, any[]> = { arma: [] }; for (const s of ARMADURA) guardado[s] = [];
  const probar = (o: any, slot: string, guardar: boolean) => {
    if (!puede(d, o, slot)) {
      // no la puede llevar todavía: la guarda si es de su tipo (como mucho 40 por casilla, lo de más valor)
      const b = OB.baseDe(o); const es = slot === 'arma' ? b?.ranura === 'arma' && FAMS[clase](b) : b?.ranura === slot;
      if (guardar && es && guardado[slot].length < 400) guardado[slot].push(o);
      return;
    }
    const v = slot === 'arma' ? valorArma(d, o) : o.def ?? 0;
    if (v > best[slot] * 1.0001) {
      const antes = best[slot];
      d.equipo[slot] = o; best[slot] = v;
      const cam = { nivel, rareza: o.rareza, base: o.base, nombre: o.nombre[0], ilvl: o.nivel, valor: v, gana: antes ? v / antes - 1 : 1 };
      if (slot === 'arma') cambios.arma.push(cam);
      else { const tot = ARMADURA.reduce((a, s) => a + best[s], 0); cambios.armadura.push({ ...cam, valor: tot, gana: 0 }); }
    }
  };
  const subir = (n: number) => {
    while (nivel < n) {
      curva.arma[nivel] = best.arma; curva.armadura[nivel] = ARMADURA.reduce((a, s) => a + best[s], 0); curva.ilvl[nivel] = d.equipo.arma?.nivel ?? 1;
      nivel++;
      const eq = d.equipo; d = heroeAl(clase, nivel); d.equipo = eq;
      best.arma = d.equipo.arma ? valorArma(d, d.equipo.arma) : 0;
      for (const s of Object.keys(guardado)) { const l = guardado[s]; guardado[s] = []; for (const o of l) probar(o, s, true); }
    }
  };
  for (const c of caidas) {
    if (c.nivelH > HASTA) break;
    subir(c.nivelH);
    const b = OB.baseDe(c.o); if (!b) continue;
    if (b.ranura === 'arma') probar(c.o, 'arma', true);
    else if (ARMADURA.includes(b.ranura)) probar(c.o, b.ranura, true);
  }
  subir(HASTA + 1);
  return { cambios, curva };
}

// ------------------------------------------------------------------ medidas
function reales(cs: Cambio[], k = 1.15) {
  const out: Cambio[] = []; let ref = 0;
  for (const c of cs) if (!ref || c.valor >= ref * k) { out.push(c); ref = c.valor; }
  return out;
}
const media = (v: number[]) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const f1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const lineas: string[] = []; const linea = (s: string) => { console.log(s); lineas.push(s); };
const res: any = { clases: {} };
const camps = [] as ReturnType<typeof campana>[];
for (let s = 1; s <= SEMILLAS; s++) camps.push(campana(s));
const caidasDe: Record<string, Caida[][]> = {};
for (const c of CLASES_SIM) caidasDe[c] = camps.map((cp, i) => tirar(cp.bajas, c, i + 1));
linea(`campaña: ${camps.map((c) => `${c.bajas.length} bajas, nivel final ${c.nivelFinal}`).join(' | ')}`);
const RAR = ['normal', 'gris', 'magico', 'raro', 'conjunto', 'unico', 'legendario'];
{ const todas = CLASES_SIM.flatMap((c) => caidasDe[c].flat()); const cnt: Record<string, number> = {}; for (const x of todas) cnt[x.o.rareza] = (cnt[x.o.rareza] ?? 0) + 1;
  const n = SEMILLAS * CLASES_SIM.length;
  linea(`equipo que cae por campaña (${Math.round(todas.length / n)}): ` + RAR.map((r) => `${r} ${Math.round((cnt[r] ?? 0) / n)}`).join(', '));
  const armas = todas.filter((x) => x.nivelH <= HASTA && OB.baseDe(x.o)?.ranura === 'arma');
  linea(`armas que caen hasta el ${HASTA} por campaña: ${Math.round(armas.length / n)}; de su tipo por clase: ` + CLASES_SIM.map((c) => `${c} ${Math.round(caidasDe[c].flat().filter((x) => x.nivelH <= HASTA && OB.baseDe(x.o)?.ranura === 'arma' && FAMS[c](OB.baseDe(x.o))).length / SEMILLAS)}`).join(', '));
  const viejas = armas.filter((x) => x.o.nivel - (OB.baseDe(x.o)?.nivel ?? 0) >= 15).length;
  linea(`armas con base 15 niveles o más por debajo del objeto: ${Math.round((viejas / Math.max(1, armas.length)) * 100)} %`); }
linea('');
linea('| clase | mejoras reales de arma (>15 %) | niveles entre mejoras (media / mediana / máx) | tramos de más de 8 niveles sin mejora | de qué rareza viene cada mejora | arma de nivel bajo (≤12) que más duró: hasta qué nivel | arma al 30 y al 60 (nivel del objeto, rareza) | valor del arma al 60 / típico del balance |');
linea('|---|---|---|---|---|---|---|---|');
const porNivelTodas: Record<number, { arma: number[]; tipico: number[] }> = {};
for (const clase of CLASES_SIM) {
  const filas: any[] = [];
  for (let s = 0; s < SEMILLAS; s++) {
    const r = recorrer(clase, caidasDe[clase][s]);
    const rr = reales(r.cambios.arma);
    const gaps = rr.slice(1).map((c, i) => c.nivel - rr[i].nivel);
    gaps.push(HASTA - (rr[rr.length - 1]?.nivel ?? 1));
    const rar: Record<string, number> = {}; for (const c of rr) rar[c.rareza] = (rar[c.rareza] ?? 0) + 1;
    // un arma de nivel bajo (objeto de nivel ≤ 12): hasta qué nivel siguió siendo la mejor
    let dura = 0, cual = '';
    r.cambios.arma.forEach((c, i) => { if (c.ilvl <= 12 && (c.rareza === 'unico' || c.rareza === 'legendario' || c.nivel <= 12)) { const hasta = r.cambios.arma[i + 1]?.nivel ?? HASTA; if (hasta > dura) { dura = hasta; cual = `${c.nombre} (${c.rareza}, nv ${c.nivel})`; } } });
    const a30 = [...r.cambios.arma].reverse().find((c) => c.nivel <= 30), a60 = r.cambios.arma[r.cambios.arma.length - 1];
    const tip60 = tipicoBalance(clase, HASTA, s);
    filas.push({ n: rr.length, gaps, rar, dura, cual, a30, a60, v60: r.curva.arma[HASTA], tip60, rr, r });
    for (const n of [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]) if (n <= HASTA) { (porNivelTodas[n] ??= { arma: [], tipico: [] }); porNivelTodas[n].arma.push(r.curva.arma[n] / tipicoBalance(clase, n, s)); }
  }
  const gaps = filas.flatMap((f) => f.gaps); const gs = [...gaps].sort((a, b) => a - b);
  const rar: Record<string, number> = {}; for (const f of filas) for (const [k, v] of Object.entries<number>(f.rar)) rar[k] = (rar[k] ?? 0) + v;
  const tot = Object.values(rar).reduce((a, b) => a + b, 0);
  const largos = filas.map((f) => f.gaps.filter((g: number) => g > 8).length);
  const dur = filas.map((f) => f.dura);
  linea(`| ${clase} | ${f1(media(filas.map((f) => f.n)))} | ${f1(media(gaps))} / ${gs[Math.floor(gs.length / 2)]} / ${Math.max(...gaps)} | ${f1(media(largos))} | ${RAR.filter((k) => rar[k]).map((k) => `${k} ${Math.round((rar[k] / tot) * 100)} %`).join(', ')} | ${filas.map((f) => f.dura).join(', ')} (${filas[0].cual}) | ${filas.map((f) => `${f.a30?.ilvl ?? '-'} ${f.a30?.rareza?.slice(0, 3) ?? ''} / ${f.a60?.ilvl ?? '-'} ${f.a60?.rareza?.slice(0, 3) ?? ''}`).join(', ')} | ${f1(media(filas.map((f) => f.v60)))} / ${f1(media(filas.map((f) => f.tip60)))} |`);
  res.clases[clase] = filas.map((f) => ({ mejoras: f.rr.map((c: Cambio) => [c.nivel, c.rareza, c.base, Math.round(c.valor), Math.round(c.gana * 100)]), curva: f.r.curva.arma.map((x: number) => Math.round(x ?? 0)), defensa: f.r.curva.armadura.map((x: number) => Math.round(x ?? 0)), arm: f.r.cambios.armadura.length }));
  if (DETALLE) for (const f of filas.slice(0, 1)) { linea(`  ${clase} mejoras: ` + f.rr.map((c: Cambio) => `${c.nivel}:${c.rareza.slice(0, 3)} ${c.base}(${c.ilvl}) ${Math.round(c.valor)} +${Math.round(c.gana * 100)}%`).join(' · ')); }
}
// armadura: defensa total de las cinco casillas
linea('');
linea('| clase | defensa total al 10 / 20 / 30 / 45 / 60 | cambios de armadura (cualquier casilla) | niveles entre subidas de 15 % de la defensa total (media / máx) |');
linea('|---|---|---|---|');
for (const clase of CLASES_SIM) {
  const ds = res.clases[clase];
  const at = (n: number) => Math.round(media(ds.map((x: any) => x.defensa[n] ?? 0)));
  const gaps: number[] = [];
  for (const x of ds) { let ref = 0, ult = 1; for (let n = 1; n <= HASTA; n++) { const v = x.defensa[n] ?? 0; if (!ref || v >= ref * 1.15) { if (ref) gaps.push(n - ult); ref = v; ult = n; } } gaps.push(HASTA - ult); }
  linea(`| ${clase} | ${[10, 20, 30, 45, 60].map(at).join(' / ')} | ${f1(media(ds.map((x: any) => x.arm)))} | ${f1(media(gaps))} / ${Math.max(...gaps)} |`);
}
linea('');
linea('| nivel | arma que lleva / típico del balance (media de las clases) |');
linea('|---|---|');
for (const [n, v] of Object.entries(porNivelTodas)) linea(`| ${n} | ${f1(media(v.arma))} |`);
const md = arg('md', ''); if (md) writeFileSync(md, lineas.join('\n') + '\n');
const sal = arg('salida', ''); if (sal) writeFileSync(sal, JSON.stringify(res));
await sv.close();
process.exit(0);
