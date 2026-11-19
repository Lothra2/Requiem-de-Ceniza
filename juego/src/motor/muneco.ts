// El muñeco del inventario: el héroe con lo que lleva puesto, pintado por el mismo motor y con el mismo equipo que en el
// mundo (los obreros de pintor.worker.ts), pero a la escala del nicho y en pixel art (una muestra por punto: nada liso).
// Los cuadros del reposo en los 8 rumbos, con una luz de retrato encima (principal cálida y contraluz) que se calcula
// UNA vez por cuadro al llegar, con el relieve que trae el pintor. Se guardan en su propia base de IndexedDB
// ('marca_muneco': la del pintor poda lo que no reconoce y se llevaría los héroes pintados).
//
// Mientras se pinta un equipo nuevo se sigue viendo el anterior (`previo`), nunca un hueco ni un borrón.
import Obrero from './pintor.worker.ts?worker&inline';
import { accionesClase } from '../juego/anim';

/** Un cuadro listo del muñeco: ya iluminado, con su ancla y la hoja del arma (para el arma viva). */
export interface CuadroM { cv: HTMLCanvasElement; w: number; h: number; ax: number; ay: number; hoja?: number[] }
export const RUMBOS = ['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'];
/** Versión de la luz del muñeco: si cambia la cuenta de `iluminar`, lo guardado se vuelve a pintar. */
const LUZ_V = 3;
const VER = 'M|' + __PINTOR__ + '|' + LUZ_V;
/** Prueba: `__munecoLuz = 0` pinta el muñeco sin la luz de retrato (para comparar). */
const conLuz = () => (window as any).__munecoLuz !== 0;

interface Estado {
  clave: string; clase: string; firma: string; K: number; nf: number; cuerpo: any; equipo: any;
  dirs: Map<string, CuadroM[]>; crudos: Record<string, any[]>;
  /** cuadros hechos por rumbo (de a uno: el rumbo aparece cuando están todos) */
  partes: Map<string, any[]>; cola: { dir: string; i: number }[];
  obreros: Worker[]; enVuelo: Map<Worker, { dir: string; i: number }>; vivo: boolean; cargado: boolean; esperando: boolean;
}
let actual: Estado | null = null;
let previo: Estado | null = null;
let espera: ReturnType<typeof setTimeout> | null = null;

// ------------------------------------------------------------------ la luz del retrato
// En el sistema de la normal que trae el pintor (x e y del mundo, z arriba) pasada a pantalla: x a la derecha, y hacia
// quien mira (abajo en pantalla), z arriba. La cámara mira desde (0, 0.866, 0.5).
const nrm = (v: number[]) => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; };
const LK = nrm([-0.62, 0.62, 0.62]);   // principal: arriba, adelante y a la izquierda (la antorcha del nicho)
const LR = nrm([0.85, -0.45, 0.3]);    // contraluz: atrás a la derecha, recorta el canto
const VV = [0, 0.866, 0.5];
const CALIDA = [1.0, 0.84, 0.62], FRIA = [0.62, 0.74, 1.0];
/**
 * Aclara lo que mira a la luz principal con un tono cálido, deja lo que le da la espalda en clave baja y enciende el canto
 * que mira a la contraluz (por la normal y, donde la silueta se acaba, por el borde). Sin relieve (o en lo que emite) se
 * deja como viene salvo el borde.
 */
export function iluminar(d: Uint8ClampedArray, rel: Uint8ClampedArray | undefined, w: number, h: number): Uint8ClampedArray {
  const o = new Uint8ClampedArray(d.length);
  const A = (x: number, y: number) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : d[(y * w + x) * 4 + 3]);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = (y * w + x) * 4, a = d[i + 3];
    if (!a) continue;
    let r = d[i] / 255, g = d[i + 1] / 255, b = d[i + 2] / 255;
    const ra = rel ? rel[i + 3] / 255 : 0;
    const emite = ra > 0.38 && ra < 0.62;
    // el borde: el punto de al lado (o el de arriba) ya es aire
    const bordeD = A(x + 1, y) === 0 || A(x + 1, y - 1) === 0, bordeI = A(x - 1, y) === 0 || A(x - 1, y - 1) === 0, bordeA = A(x, y - 1) === 0;
    let kk = 1, rim = 0, cal = 0;
    if (rel && ra >= 0.3 && !emite) {
      const n0 = rel[i] / 127.5 - 1, n1 = rel[i + 1] / 127.5 - 1, n2 = rel[i + 2] / 127.5 - 1;
      const n = nrm([(n0 - n1) * 0.7071, (n0 + n1) * 0.7071, n2]);
      const dk = n[0] * LK[0] + n[1] * LK[1] + n[2] * LK[2], dr = n[0] * LR[0] + n[1] * LR[1] + n[2] * LR[2];
      const fr = 1 - Math.max(0, n[0] * VV[0] + n[1] * VV[1] + n[2] * VV[2]);
      kk = 0.8 + 0.42 * Math.max(0, dk) - 0.12 * Math.max(0, -dk);
      cal = Math.max(0, dk);
      rim = Math.max(0, dr) ** 1.4 * (0.25 + fr * 0.9);
    }
    if (!emite) {
      if (bordeD) rim = Math.max(rim, 0.55); else if (bordeA && x > w * 0.45) rim = Math.max(rim, 0.3);
      if (bordeI) cal = Math.max(cal, 0.7);
    }
    const lum = 0.3 * r + 0.59 * g + 0.11 * b;
    r = r * kk * (1 + (CALIDA[0] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[0] * (0.4 + lum);
    g = g * kk * (1 + (CALIDA[1] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[1] * (0.4 + lum);
    b = b * kk * (1 + (CALIDA[2] - 1) * cal * 0.5) + 0.05 * cal * CALIDA[2] * (0.4 + lum);
    // la contraluz suma su color (más en lo claro: el metal brilla, la tela apenas)
    const rk = rim * (0.22 + 0.5 * lum);
    r += FRIA[0] * rk; g += FRIA[1] * rk; b += FRIA[2] * rk;
    o[i] = Math.min(255, r * 255); o[i + 1] = Math.min(255, g * 255); o[i + 2] = Math.min(255, b * 255); o[i + 3] = a;
  }
  return o;
}

const aLienzo = (data: Uint8ClampedArray, w: number, h: number) => { const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')!.putImageData(new ImageData(data as any, w, h), 0, 0); return c; };
const aCuadroM = (f: any): CuadroM => ({ cv: aLienzo(f.lit, f.w, f.h), w: f.w, h: f.h, ax: f.ax, ay: f.ay, hoja: f.hoja });

// ------------------------------------------------------------------ IndexedDB propia (si no hay, se pinta igual)
let dbP: Promise<IDBDatabase | null> | null = null;
function db(): Promise<IDBDatabase | null> {
  return (dbP ??= new Promise((ok) => {
    const t = setTimeout(() => ok(null), 1200);
    try { const r = indexedDB.open('marca_muneco', 1); r.onupgradeneeded = () => r.result.createObjectStore('m'); r.onsuccess = () => { clearTimeout(t); ok(r.result); }; r.onerror = r.onblocked = () => { clearTimeout(t); ok(null); }; } catch { clearTimeout(t); ok(null); }
  }));
}
async function leer(k: string): Promise<Record<string, any[]> | null> {
  const d = await db(); if (!d) return null;
  return new Promise((ok) => { const tt = setTimeout(() => ok(null), 1500); try { const q = d.transaction('m').objectStore('m').get(k); q.onsuccess = () => { clearTimeout(tt); ok(q.result ?? null); }; q.onerror = () => { clearTimeout(tt); ok(null); }; } catch { clearTimeout(tt); ok(null); } });
}
async function escribir(k: string, v: Record<string, any[]>) {
  const d = await db(); if (!d) return;
  try {
    const st = d.transaction('m', 'readwrite').objectStore('m'); st.put(v, k);
    // los últimos 4 equipos (por orden de uso, en localStorage)
    let ks: string[] = []; try { ks = JSON.parse(localStorage.getItem('muneco.claves') ?? '[]'); } catch { /* nada */ }
    ks = [k, ...ks.filter((x) => x !== k)];
    for (const x of ks.slice(4)) st.delete(x);
    try { localStorage.setItem('muneco.claves', JSON.stringify(ks.slice(0, 4))); } catch { /* nada */ }
  } catch { /* sin espacio */ }
}

// ------------------------------------------------------------------ los obreros
function soltar(e: Estado) { e.vivo = false; for (const w of e.obreros) w.terminate(); e.obreros = []; }
function ponerRumbo(e: Estado, dir: string, crudos: any[]) {
  e.crudos[dir] = crudos; e.dirs.set(dir, crudos.map(aCuadroM));
}
function trabajar(e: Estado) {
  if (!e.vivo || !e.cargado) return;
  const N = Math.max(1, Math.min(2, (navigator.hardwareConcurrency || 4) - 2));
  const dar = (w: Worker) => {
    if (!e.vivo) return;
    const t = e.cola.shift();
    e.enVuelo.delete(w);
    if (!t) { w.terminate(); e.obreros = e.obreros.filter((x) => x !== w); return; }
    e.enVuelo.set(w, t);
    const n = accionesClase(e.clase).find((a) => a[0] === 'quieto')?.[1] ?? 4;
    w.postMessage({ id: e.clave, cuerpo: e.cuerpo, equipo: e.equipo, acc: 'quieto', dir: t.dir, muneco: e.K, fs: [(t.i * n) / e.nf], clave: t.dir + '#' + t.i, calidad: 1 });
  };
  while (e.obreros.length < N && e.cola.length) {
    let w: Worker; try { w = new Obrero(); } catch { return; }
    e.obreros.push(w);
    w.onmessage = (ev) => {
      const m = ev.data; if (!e.vivo || m.id !== e.clave) return;
      const [dir, si] = String(m.clave).split('#'), i = +si;
      const f = m.out?.[0];
      if (!m.error && f) {
        const p = e.partes.get(dir) ?? new Array(e.nf); p[i] = { w: f.w, h: f.h, ax: f.ax, ay: f.ay, hoja: f.hoja, lit: conLuz() ? iluminar(f.data, f.rel, f.w, f.h) : f.data };
        e.partes.set(dir, p);
        if (p.filter(Boolean).length === e.nf) { ponerRumbo(e, dir, p); e.partes.delete(dir); void escribir(e.clave, e.crudos); }
      }
      dar(w);
    };
    w.onerror = () => dar(w);
    dar(w);
  }
}
/** Pone al frente de la cola los cuadros que faltan de un rumbo. */
function priorizar(e: Estado, dir: string) {
  if (e.dirs.has(dir) || !e.cola.length || e.cola[0].dir === dir) return;
  e.cola = [...e.cola.filter((t) => t.dir === dir), ...e.cola.filter((t) => t.dir !== dir)];
}

/**
 * Los cuadros del muñeco para este héroe, equipo y escala, en el rumbo pedido. Si todavía no están, los pide (el rumbo
 * pedido primero, después los demás) y devuelve los del equipo anterior en ese rumbo, si los hay (`viejo`).
 */
export function cuadrosMuneco(clase: string, cuerpo: any, equipo: any, firma: string, K: number, dir: string, nf = 8): { fs: CuadroM[] | null; viejo: boolean; listo: boolean; progreso: number } {
  const clave = VER + (conLuz() ? '' : 'L0') + '|' + clase + '|' + K + '|' + nf + '|' + firma;
  if (!actual || actual.clave !== clave) {
    if (actual) { soltar(actual); if (actual.clase === clase && actual.dirs.size) previo = actual; }
    if (previo && previo.clase !== clase) previo = null;
    const e: Estado = { clave, clase, firma, K, nf, cuerpo, equipo, dirs: new Map(), crudos: {}, partes: new Map(), cola: [], obreros: [], enVuelo: new Map(), vivo: true, cargado: false, esperando: true };
    actual = e;
    // lo pedido de a muchos seguidos (probarse cinco cascos) espera a que el equipo se quede quieto
    if (espera) clearTimeout(espera);
    void (async () => {
      const c = await leer(clave);
      if (actual !== e) return;
      if (c) for (const [d0, fs] of Object.entries(c)) if (Array.isArray(fs) && fs.length === nf) ponerRumbo(e, d0, fs);
      for (const d0 of [dir, ...RUMBOS]) if (!e.dirs.has(d0) && !e.cola.some((t) => t.dir === d0)) for (let i = 0; i < nf; i++) e.cola.push({ dir: d0, i });
      e.cargado = true;
      espera = setTimeout(() => { espera = null; e.esperando = false; if (actual === e) trabajar(e); }, c ? 0 : 300);
    })();
  }
  const e = actual;
  if (e.cargado) { priorizar(e, dir); if (e.cola.length && e.vivo && !e.esperando && e.obreros.length < 2) trabajar(e); }
  const fs = e.dirs.get(dir) ?? null;
  const listo = !!fs, progreso = e.dirs.size / RUMBOS.length;
  if (fs) return { fs, viejo: false, listo, progreso };
  const v = previo && previo.clase === clase && previo.K === K ? previo.dirs.get(dir) ?? null : null;
  return { fs: v, viejo: !!v, listo, progreso };
}
