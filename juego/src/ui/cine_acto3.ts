// El cierre del acto 3, «El río todavía sabe a hierro» (unos 65 s): la Madre Ciénaga muere en su Vientre y los huevos se
// apagan, la brasa sale de la carne sujeta por un cordón de sangre que se corta, sube por los Escalones Hundidos donde
// Vesperio le da las gracias, calla el Tambor de Yhuantl y se va al norte, a la nieve, hasta la puerta de los jarls, donde unas
// huellas enormes y descalzas entran al frío. Cartel del acto 4. Ver ui/director.ts. Canon: CLAUDE.md, "Historia y canon".
import { ctx } from '../nucleo/lienzo';
import { aPant } from '../render/escena';
import type { Zona } from '../mundo/zona';
import { estallido } from '../render/brasa_cine';
import { brasaEn, type Guion, type Toma, type Texto, type EstadoToma } from './director';
import { linea, VIOLETA, anclaJefe, anclaSalida, despejarPiezas, despejarPies, charco, vez, ceniza, columnaDe, cartel, latido } from './cine_kit';
const L = (n: number, t0: number, t1: number, o: Partial<Texto> = {}): Texto => linea(3, n, t0, t1, o);

/** El hito del mundo abierto (el Tambor de Yhuantl, la puerta de los jarls): el medio de su huella. */
export const anclaHito = (z: Zona): [number, number] => { const o = z.objetos.find((q) => q.id === 'acto_hito'); return o ? [o.cx + 0.5, o.cy + 0.5] : [z.W / 2, z.H / 2]; };
/** Las luces de la toma (las arma el director antes del paso): para sumar las que no caben en claves. */
const lucesDe = (e: EstadoToma): any[] | null => ((e.j as any)?.lucesCine as any[] | undefined) ?? null;

// ------------------------------------------------------------------ el Vientre: los huevos que se apagan
/** Los huevos y capullos del Vientre que quedan cerca del ruedo (a lo sumo 7, de lo más cerca a lo más lejos). */
function huevosDe(e: EstadoToma): [number, number][] {
  if (e.mem.huevos) return e.mem.huevos; const z = e.z; if (!z) return [];
  const L = z.objetos.filter((o) => /huevo|capullo/.test(o.id)).map((o) => [o.cx + 0.5, o.cy + 0.5] as [number, number])
    .filter(([x, y]) => Math.hypot(x - e.ax, y - e.ay) < 9).sort((a, b) => Math.hypot(a[0] - e.ax, a[1] - e.ay) - Math.hypot(b[0] - e.ax, b[1] - e.ay)).slice(0, 8);
  return (e.mem.huevos = L);
}
/** La puesta de la Madre alrededor de su ruedo (el ruedo del jefe sale limpio): huevos y capullos detrás y a los lados. */
const PUESTA: [string, number, number][] = [['sel2_nido|huevos', -3.6, -0.6], ['sel_capullo|suelo', -1.2, -4.0], ['cue2_nido_huesos|huevos', -4.8, -3.4], ['sel_capullo|roto', 1.8, -4.6], ['a2_huevos|nidada', -4.4, 1.9], ['sel_capullo|suelo', -2.6, -5.8], ['sel2_nido|huevos', 2.9, -3.0], ['a2_huevos|nidada', -5.8, 0.4]];
function ponerPuesta(e: EstadoToma) {
  const z = e.z; if (!z || z.objetos.some((o) => o.capa === 'cine')) return;
  for (const [k, x, y] of PUESTA) { const [id, v] = k.split('|'); z.objetos.push({ id, v, cx: Math.floor(e.ax + x), cy: Math.floor(e.ay + y), hw: 0, hh: 0, bloquea: false, capa: 'cine' } as any); }
}
/** Cada huevo lleva su luz verde enferma que late con la Madre; desde que ella cae se apagan uno por uno (desde `t0`). */
function lucesHuevos(e: EstadoToma, tl: number, t0: number) {
  const Ls = lucesDe(e); if (!Ls) return;
  huevosDe(e).forEach(([x, y], i) => {
    const apaga = t0 + 0.45 * i + 0.3, k = tl < apaga ? 0.55 + 0.25 * latido(tl + i * 0.13) : Math.max(0, 0.55 * (1 - (tl - apaga) / 0.25));
    if (k > 0.01) Ls.push({ id: 'huevo' + i, x, y, z: 10, r: 70, c: [150, 190, 60], k, sinSombra: true });
  });
}

// ------------------------------------------------------------------ el cordón de sangre
/**
 * El cordón: un cordón de carne del ancho de un dedo entre el cuerpo de la Madre y la brasa. Carne oscura con su canto de luz
 * arriba, y por adentro la sangre clara que corre hacia la brasa a golpes de latido. Cuelga flojo mientras la brasa está cerca,
 * se estira al subir ella (se afina y tiembla) y a los `corte` segundos se parte: los dos cabos latiguean (el de abajo cae
 * coleteando sobre el cuerpo, el de arriba se enrosca hacia la brasa). En el pase del mundo (aPant vale).
 */
function cordon(e: EstadoToma, tl: number, corte: number) {
  const b = brasaEn(e, tl) ?? e.mem.ultB; if (!b) return; if (tl < corte) e.mem.ultB = b;
  const [cx, cy] = aPant(e.ax + 0.1, e.ay + 0.1), P0: [number, number] = [cx - 2, cy - 14];
  const bb = tl < corte ? b : e.mem.ultB, [bx, by0] = aPant(bb.x, bb.y), P1: [number, number] = [bx, by0 - bb.z + 2];
  const lat = latido(tl - 0.2), estira = Math.min(1, Math.max(0, (tl - 1.2) / (corte - 1.2)));
  ctx.save(); ctx.imageSmoothingEnabled = false;
  /** Un tramo: de A a B, colgando `sag` puntos hacia abajo y a la izquierda, con una onda `onda`, de grosor g0 a g1. */
  const tramo = (A: [number, number], B: [number, number], sag: number, onda: number, g0: number, g1: number, alfa: number, fase: number) => {
    const Lg = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, n = Math.max(16, Math.round(Lg * 2.5)), pts: [number, number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const u = i / n, bq = Math.sin(u * Math.PI), o = Math.sin(u * 7 - tl * 6 + fase) * onda * bq;
      pts.push([A[0] + (B[0] - A[0]) * u - bq * sag * 0.55 + o, A[1] + (B[1] - A[1]) * u + bq * sag + o * 0.4, g0 + (g1 - g0) * u]);
    }
    ctx.globalAlpha = alfa;
    const pinta = (col: string, mas: number, dy: number) => { ctx.fillStyle = col; for (const [x, y, g] of pts) { const w = Math.max(1, Math.round(g + mas)); ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2 + dy), w, w); } };
    pinta('#1e0304', 2, 0.5);        // el canto oscuro y su sombra
    pinta('#4e0e0c', 0, 0);          // la carne
    pinta('#6c1812', -1.6, -0.6);    // la carne con luz
    ctx.fillStyle = '#a04434'; for (let k = 0; k < pts.length; k += 2) { const [x, y, g] = pts[k]; if (g > 2.2) ctx.fillRect(Math.round(x - g * 0.2), Math.round(y - g / 2), 1, 1); }
    // la sangre que corre por adentro hacia la brasa: tramos claros que avanzan con el latido
    for (let k = 0; k < pts.length; k++) {
      const [x, y, g] = pts[k], u = k / pts.length, f = (((u * 5 - tl * (1.4 + lat * 1.6)) % 1) + 1) % 1;
      if (f < 0.3 && g > 1.6) { ctx.globalAlpha = alfa * (0.55 + 0.45 * lat); ctx.fillStyle = f < 0.12 ? '#ff7a50' : '#d8341e'; ctx.fillRect(Math.round(x - 0.5), Math.round(y - 0.5), Math.max(1, Math.round(g * 0.45)), Math.max(1, Math.round(g * 0.45))); }
    }
    ctx.globalAlpha = 1;
  };
  const G = 4.2 - 1.6 * estira + 0.6 * lat; // del ancho de un dedo; se afina al estirarse
  if (tl < corte) {
    const Lg = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]), tiembla = tl > corte - 0.9 ? Math.sin(tl * 70) * 1.2 : 0;
    tramo(P0, P1, Math.max(2, (1 - estira) * Math.min(26, Lg * 0.5)) + tiembla, 1.2 * (1 - estira) + Math.abs(tiembla), G + 1, G * 0.7, 1, 0);
  } else {
    const u = Math.min(1, (tl - corte) / 0.9), M: [number, number] = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2];
    // el de abajo: el cabo se suelta, latiguea y cae sobre el cuerpo
    const caeX = M[0] + (P0[0] + 10 - M[0]) * u + Math.sin(u * 14) * (1 - u) * 10, caeY = M[1] + (P0[1] + 8 - M[1]) * u * u;
    tramo(P0, [caeX, caeY], 4 + u * 10, (1 - u) * 5, G + 1, G * 0.8, 1, 1);
    // el de arriba: se enrosca hacia la brasa y se encoge
    if (u < 1) { const [bx2, by2] = aPant(b.x, b.y), Q: [number, number] = [bx2, by2 - b.z + 2], E: [number, number] = [Q[0] + (M[0] - Q[0]) * (1 - u) + Math.sin(u * 16) * (1 - u) * 8, Q[1] + (M[1] - Q[1]) * (1 - u)]; tramo(Q, E, 3, (1 - u) * 4, G * 0.7, G * 0.9, 1 - u * 0.7, 2); }
  }
  ctx.restore();
}
/** Las gotas que suelta el cordón al partirse (partículas de sangre que caen al piso). */
function gotasCorte(e: EstadoToma, tl: number) {
  const b = brasaEn(e, tl) ?? e.mem.ultB; if (!b || !e.j) return;
  const mx = (e.ax + b.x) / 2, my = (e.ay + b.y) / 2, mz = b.z / 2;
  for (let i = 0; i < 26; i++) e.j.particulas.push({ x: mx + (Math.random() - 0.5) * 0.6, y: my + (Math.random() - 0.5) * 0.6, z: mz + Math.random() * 10, vx: (Math.random() - 0.5) * 2.4, vy: (Math.random() - 0.5) * 2.4, vz: 10 + Math.random() * 40, t: 0, dur: 1.2 + Math.random() * 0.6, color: Math.random() < 0.6 ? '#7a0d0a' : '#b01c12', tam: 1 + Math.random(), grav: 160, tipo: 'ceniza' } as any);
}

// ------------------------------------------------------------------ la nieve: el vaho de la brasa y las huellas del rey
/** La brasa en el frío: suelta vaho (motas grises que suben y se abren) detrás de donde pasa. */
function vaho(e: EstadoToma, tl: number, dt: number, n: number) {
  const b = brasaEn(e, tl); if (!b || !e.j || b.k < 0.05) return;
  for (let i = 0; i < n; i++) if (Math.random() < dt * 40) e.j.particulas.push({ x: b.x + (Math.random() - 0.5) * 0.5, y: b.y + (Math.random() - 0.5) * 0.5, z: b.z - 4 + Math.random() * 8, vx: (Math.random() - 0.5) * 0.4, vy: (Math.random() - 0.5) * 0.4, vz: 6 + Math.random() * 10, t: 0, dur: 1.6 + Math.random() * 1.2, color: Math.random() < 0.5 ? '#b8c4d2' : '#8a96a8', tam: 1 + Math.random() * 1.2, grav: -2, tipo: 'ceniza' } as any);
}
/**
 * Las huellas del Rey de Escarcha, hundidas en la nieve (van con lo plano del piso: las tapa lo que está de pie). Pies desnudos
 * enormes, de algo más de una casilla, en fila de pasos alternados y bien separados (izquierdo, derecho), que salen de la puerta
 * y se pierden hacia el norte, fuera de cuadro. Cada una es un hueco: el fondo azul gris, la pared del lado de la luz (arriba a
 * la izquierda) en sombra y la de enfrente más clara, y el borde levantado de nieve, claro donde le da la luz.
 */
const PASO = 2.3;
function dentroPie(u: number, v: number): boolean {
  // el talón, el arco angosto, la planta ancha y cinco dedos (el gordo del lado de adentro, v > 0)
  const el = (cu: number, cv: number, ru: number, rv: number) => ((u - cu) / ru) ** 2 + ((v - cv) / rv) ** 2 <= 1;
  if (el(-8, 0, 5, 4.2) || el(-1, -0.8, 6, 3.4) || el(5, 0.4, 4.6, 5.4)) return true;
  const dedos: [number, number, number][] = [[11.4, 3.6, 2.1], [11.6, 0.9, 1.5], [10.9, -1.4, 1.35], [10.0, -3.4, 1.2], [8.7, -5.0, 1.05]];
  return dedos.some(([cu, cv, r]) => el(cu, cv, r * 1.15, r));
}
function huellasRey(e: EstadoToma, desde: [number, number], hacia: [number, number]) {
  const dx = hacia[0] - desde[0], dy = hacia[1] - desde[1], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d, n = Math.floor(d / PASO) + 1;
  // el rumbo en el plano del piso (la pantalla con el alto al doble)
  const ax = (ux - uy) * 16, ay = (ux + uy) * 16, al = Math.hypot(ax, ay), cx = ax / al, cy = ay / al;
  const C = { fondo: '#4e5a76', sombra: '#2e3650', claro: '#7a88a6', borde: '#f4f8fd', bajo: '#c4cede' }, ES = 1.5;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < n; i++) {
    const lado = i % 2 ? 1 : -1, k = i * PASO;
    const [px, py] = aPant(e.ax + desde[0] + ux * k - uy * lado * 0.42, e.ay + desde[1] + uy * k + ux * lado * 0.42), X = Math.round(px), Y = Math.round(py);
    // (de la pantalla al pie: el piso aplastado a la mitad, girado al rumbo; el izquierdo en espejo)
    const en = (sx: number, sy: number) => { const qy = sy * 2; return dentroPie((sx * cx + qy * cy) / ES, ((-sx * cy + qy * cx) * lado) / ES); };
    for (let sy = -14; sy <= 14; sy++) for (let sx = -24; sx <= 24; sx++) {
      let col: string | null = null;
      if (en(sx, sy)) col = !en(sx - 1, sy - 1) ? C.sombra : !en(sx + 1, sy + 1) ? C.claro : C.fondo;
      else if (en(sx + 1, sy + 1) || en(sx + 1, sy)) col = C.borde;
      else if (en(sx - 1, sy - 1)) col = C.bajo;
      if (!col) continue;
      ctx.globalAlpha = col === C.bajo ? 0.6 : 1; ctx.fillStyle = col; ctx.fillRect(X + sx, Y + sy, 1, 1);
    }
  }
  ctx.restore();
}

/** Cuánto sube Vesperio por la escalera de la pirámide (puntos del dibujo sobre el piso de la boca). */
const ALTO_VES = 275, VX = 4, ALZA = ALTO_VES + (VX - 0.9) * 16;
/** Sin lluvia en esta toma (a ×2 y ×3 las gotas se leen como rayas rotas). */
const sinLluvia = (e: EstadoToma) => { const z: any = e.z; if (!z) return; if (z.lluvia0 === undefined) z.lluvia0 = z.lluvia; z.lluvia = false; };

// ------------------------------------------------------------------ el guion
const tomas: Toma[] = [
  {
    // el Vientre: la Madre Ciénaga contra el héroe y Thor; el golpe corta a ×3, ella cae y los huevos se apagan uno por uno
    id: 'vientre', dur: 10, zona: 'a3_templo2', ancla: anclaJefe, objetos: PUESTA.map((p) => p[0]), preparar: ponerPuesta, entra: 1.6, sale: 0.4, oscuridad: 0.84, hundir: 0.6,
    cam: [{ t: 0, x: 3.0, y: 1.4, alt: 56, zoom: 2, fy: 0.52 }, { t: 3.05, x: 2.0, y: 0.5, alt: 60, c: 'suave' }, { t: 3.06, x: 1.0, y: -0.4, alt: 62, zoom: 3, fy: 0.5 }, { t: 9.6, x: 0.8, y: -0.3, alt: 44, c: 'suave' }],
    actores: [
      { id: 'madre', tipo: 'mon', mon: 'madre_cienaga', claves: [{ t: 0, x: 0, y: 0, mira: [3, -0.6], acc: 'herido', dur: 1.5, ritmo: 0.5, bucle: true }, { t: 3.55, acc: 'morir', ritmo: 0.42 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 3.8, y: -0.4, mira: [0, 0] }, { t: 2.2, x: 3.8, y: -0.4 }, { t: 3.0, x: 2.5, y: -0.9, c: 'lineal' }, { t: 3.0, acc: 'atacar', dur: 0.62, mira: [0, 0] }, { t: 3.8, acc: 'quieto', mira: [0, 0] }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.4, y: 1.8, mira: [0, 0] }, { t: 1.2, acc: 'especial', dur: 0.9, mira: [0, 0] }, { t: 2.1, acc: 'quieto', mira: [0, 0] }] },
    ],
    focos: [{ de: 'madre', z: 70, r: 210 }, { de: 'heroe', z: 34, r: 120, k: 0.85 }],
    primer: [{ id: columnaDe, fx: 0.07, fy: 1.12, par: 1.8 }, { id: columnaDe, fx: 0.95, fy: 1.2, par: 2.2, espejo: true }],
    luces: [
      { id: 'carne', color: [230, 70, 50], sombra: true, titila: 0.1, claves: [{ t: 0, x: -2, y: 3, z: 50, r: 240, k: 0.55 }, { t: 5, k: 0.5 }, { t: 9, k: 0.3 }] },
      { id: 'frio', color: [120, 150, 120], sombra: true, claves: [{ t: 0, x: 1.5, y: 1.5, z: 160, r: 300, k: 0.4 }] },
    ],
    sonidos: [{ t: 0, id: 'vientre', cine: true }, { t: 1.2, id: 'grunido', vol: 0.7 }, { t: 3.3, id: 'coro_muerte', cine: true, tono: 0.84 }, { t: 3.3, id: 'golpe_carne' }, { t: 5.5, id: 'golpe', cine: true }, { t: 5.5, id: 'sub', cine: true }],
    temblores: [[5.5, 0.5, 3]],
    paso: (e, tl) => { lucesHuevos(e, tl, 5.4); vez(e, 'sangre', tl, 5.5, () => charco(e, 'c1', 0.3, 0.3, 0.4, 1.8)); },
    textos: [L(0, 6.2, 9.7)],
  },
  {
    // el cordón: de la carne sale la brasa, sujeta por un hilo de sangre que late; se estira, se corta y la brasa sube. El héroe
    // la mira irse; Thor olfatea la carne que se enfría
    id: 'cordon', dur: 9, zona: 'a3_templo2', ancla: anclaJefe, objetos: PUESTA.map((p) => p[0]), preparar: ponerPuesta, entra: 0.25, sale: 0.6, oscuridad: 0.9, hundir: 0.7,
    cam: [{ t: 0, x: 1.1, y: -0.2, alt: 26, zoom: 3, fy: 0.55 }, { t: 4.9, x: 1.0, y: -0.2, alt: 38, c: 'suave' }, { t: 4.91, x: 0.3, y: 0.1, alt: 34, zoom: 4, fy: 0.5 }, { t: 6.2, x: 0.3, y: 0.1, alt: 38 }, { t: 6.21, x: 0.9, y: -0.3, alt: 60, zoom: 3, fy: 0.55 }, { t: 7.0, x: 0.9, y: -0.3, alt: 84, c: 'entra' }, { t: 9, x: 0.9, y: -0.3, alt: 92 }],
    actores: [
      { id: 'madre', tipo: 'mon', mon: 'madre_cienaga', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.5, y: -0.9, mira: [0, 0] }, { t: 3.6, x: 2.5, y: -0.9 }, { t: 4.4, x: 3.0, y: -1.2, c: 'sale' }, { t: 4.5, mira: [0.2, 0.2] }, { t: 6.5, dir: 'no' }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.0, y: 1.6, mira: [0, 0] }, { t: 6.2, x: 3.0, y: 1.6 }, { t: 7.6, x: 1.3, y: 1.0, c: 'suave' }, { t: 7.7, mira: [0.2, 0.3] }] },
    ],
    focos: [{ de: 'brasa', r: 200 }, { de: 'heroe', z: 34, r: 120, k: 0.75 }, { de: [0.2, 0.2], z: 10, r: 110, k: 0.6 }],
    primer: [{ id: columnaDe, fx: 0.9, fy: 1.16, par: 2.2, mas: 2 }],
    brasa: [{ t: 0.9, x: 0.15, y: 0.15, z: 4, k: 0, tam: 0.35 }, { t: 2.2, z: 10, k: 0.55, tam: 0.55 }, { t: 4.0, z: 34, k: 0.9, tam: 0.9, c: 'sale' }, { t: 5.3, z: 62, k: 1, tam: 1, c: 'suave' }, { t: 6.2, z: 84, k: 1 }, { t: 7.2, z: 560, k: 1, c: 'entra' }],
    luces: [{ id: 'carne', color: [200, 50, 40], claves: [{ t: 0, x: -1, y: 2, z: 40, r: 200, k: 0.35 }, { t: 9, k: 0.15 }] }],
    sonidos: [{ t: 0.9, id: 'brasa_nace', cine: true }, { t: 1.4, id: 'latido', cine: true }, { t: 2.5, id: 'latido', cine: true }, { t: 3.6, id: 'latido', cine: true, vol: 1.2 }, { t: 5.3, id: 'golpe_carne' }, { t: 5.35, id: 'cordon', cine: true }, { t: 5.9, id: 'brasa_vuela', cine: true }],
    temblores: [[5.35, 0.3, 2]],
    paso: (e, tl) => {
      vez(e, 'sangre', tl, 0, () => charco(e, 'c', 0.3, 0.3, 1.8, 1.9));
      vez(e, 'pecho', tl, 2.2, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 8, 26, 0.6));
      vez(e, 'corta', tl, 5.35, () => gotasCorte(e, tl));
    },
    mundo: (e, tl) => { if (tl > 0.9 && tl < 6.3) cordon(e, tl, 5.35); },
    textos: [L(1, 4.6, 8.8)],
  },
  {
    // la escalera de la pirámide de Yhuantl: Vesperio subido en los escalones, sobre la máscara, de espaldas, cantando bajito
    // (como sobre el agua del acto 2: sus colores en sombra, el canto violeta de un lado y su luz violeta). La brasa sale por la
    // boca, sube por la escalera y le pasa junto a la cara; él se inclina, se da vuelta y nos mira un instante
    id: 'escalones', dur: 9, zona: 'a3_pantano', ancla: anclaSalida('a3_templo1'), entra: 0.6, sale: 0.8, oscuridad: 0.8, hundir: 0.62, sinBruma: true, sinClima: ['fx_lluvia', 'fx_tormenta', 'fx_luciernagas', 'fx_niebla'],
    preparar: (e) => { sinLluvia(e); despejarPiezas(e.z!, 'a3_templo1'); },
    cam: [{ t: 0, x: VX, y: VX, alt: ALZA + 30, zoom: 2, fy: 0.6 }, { t: 9, x: VX, y: VX, alt: ALZA + 40, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#241c2c', 0.42], claves: [{ t: 0, x: VX, y: VX, dir: 'no', acc: 'quieto' }, { t: 3.0, acc: 'lanzar', dur: 1.0, ritmo: 0.25, dir: 'no' }, { t: 4.8, acc: 'quieto', dir: 'o' }, { t: 5.5, dir: 's' }, { t: 7.5, x: VX, y: VX, alfa: 1 }, { t: 8.8, x: VX - 0.4, y: VX - 0.4, alfa: 0, c: 'lineal' }] },
    ],
    brasa: [{ t: 0.3, x: VX, y: VX, z: 30, k: 0.6, tam: 0.7 }, { t: 2.4, x: VX - 0.2, y: VX - 0.5, z: ALZA + 40, k: 0.8, tam: 0.9, c: 'sale' }, { t: 4.0, x: VX + 0.2, y: VX - 0.6, z: ALZA + 60, k: 0.8, c: 'suave' }, { t: 5.6, x: -2, y: -4, z: ALZA + 200, k: 0.8, c: 'entra' }, { t: 6.6, x: -6, y: -9, z: ALZA + 320, k: 0.6, tam: 0.6, c: 'lineal' }],
    focos: [{ de: [VX - ALZA / 16, VX - ALZA / 16], z: 50, r: 190, k: 0.85 }],
    luces: [
      { id: 'ves', color: VIOLETA, sombra: true, titila: 0.08, claves: [{ t: 0, x: VX + 1.4 - ALZA / 16, y: VX - 0.6 - ALZA / 16, z: 70, r: 190, k: 1.0 }, { t: 7.5, k: 0.95 }, { t: 8.8, k: 0 }] },
      { id: 'canto', color: [170, 120, 240], claves: [{ t: 0, x: VX - 1.1 - ALZA / 16, y: VX - 1.7 - ALZA / 16, z: 60, r: 140, k: 1.3 }, { t: 7.5, k: 1.3 }, { t: 8.8, k: 0 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.94 }, { t: 0.4, id: 'brasa_vuela', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (!m) return; m.alto = ALZA; if (e.j && Math.random() < dt * (tl > 7.5 ? 30 : 6)) ceniza(e.j, m.x, m.y, tl > 7.5 ? 2 : 1, '#9e96ae'); },
    textos: [L(2, 5.0, 7.8, { tono: VIOLETA })],
  },
  {
    // el Tambor de Yhuantl: la brasa cruza la ceiba y el tambor; la pintura de sangre del cuero se apaga y los tambores callan
    id: 'tambor', dur: 8, zona: 'a3_selva', ancla: anclaHito, entra: 0.6, sale: 0.6, oscuridad: 0.66, hundir: 0.55, sinBruma: true, sinClima: ['fx_lluvia', 'fx_tormenta'],
    preparar: (e) => { sinLluvia(e); despejarPies(e, 5, 5, 4); },
    cam: [{ t: 0, x: 4.2, y: 4.2, alt: 110, zoom: 2, fy: 0.6 }, { t: 8, x: 3.4, y: 3.4, alt: 104, c: 'suave' }],
    brasa: [{ t: 0.2, x: 12, y: 2, z: 170, k: 1, tam: 1.1 }, { t: 3.2, x: 1, y: 1, z: 120, k: 1, c: 'suave' }, { t: 6.0, x: -6, y: -10, z: 220, k: 0.9, c: 'entra' }, { t: 8, x: -12, y: -20, z: 300, k: 0.7, tam: 0.8, c: 'lineal' }],
    focos: [{ de: [0, 0], z: 90, r: 260, k: 0.85 }, { de: 'brasa', r: 200 }],
    primer: [{ id: 'sel2_helecho|arborescente', fx: 0.04, fy: 1.1, par: 1.8, mas: 2 }],
    luces: [
      // la sangre que brilla en el cuero: viva mientras suenan, se apaga de golpe cuando la brasa pasa
      { id: 'cuero', color: [230, 40, 30], sombra: true, titila: 0.25, claves: [{ t: 0, x: 1.5, y: 1.5, z: 60, r: 180, k: 0.75 }, { t: 3.3, k: 0.9 }, { t: 3.6, k: 0, c: 'sale' }] },
      { id: 'luna', color: [120, 150, 140], claves: [{ t: 0, x: 0, y: 0, z: 500, r: 900, k: 0.35 }] },
    ],
    sonidos: [{ t: 0, id: 'tambores_corte', cine: true }, { t: 1.0, id: 'brasa_vuela', cine: true, vol: 0.5 }],
    paso: (e, tl) => vez(e, 'pasa', tl, 3.3, () => estallido(e.brasa, (e.ax - e.ay) * 16 + 16, (e.ax + e.ay) * 8 - 110, 30, 0.8)),
    textos: [L(3, 4.0, 7.6)],
  },
  {
    // hacia el norte: un campo de nieve abierto y limpio, la nieve que cae; la brasa entra en el frío, se encoge echando vaho y su
    // luz se enfría. Nada en el medio
    id: 'norte', dur: 9, zona: 'a4_picos', ancla: anclaHito, entra: 0.8, sale: 0.6, oscuridad: 0.62, hundir: 0.42, sinBruma: true,
    preparar: (e) => { const z = e.z; if (!z) return; const dentro = (o: any) => { const dx = o.cx + 0.5 - e.ax, dy = o.cy + 0.5 - e.ay; for (let k = 0; k <= 1; k += 0.1) if (Math.hypot(dx - (40 - 32 * k), dy - (32 - 26 * k)) < 17) return true; return false; }; z.objetos = z.objetos.filter((o) => /acto_hito|macizo/.test(o.id) || !dentro(o)); },
    cam: [{ t: 0, x: 28, y: 21, alt: 110, zoom: 1, fy: 0.5 }, { t: 9, x: 16, y: 11, alt: 110, c: 'suave' }],
    brasa: [{ t: 0.4, x: 40, y: 32, z: 200, k: 1, tam: 2.2 }, { t: 4.5, x: 26, y: 19, z: 150, k: 0.85, tam: 1.5, c: 'suave' }, { t: 9, x: 12, y: 8, z: 110, k: 0.55, tam: 0.8, c: 'suave' }],
    focos: [{ de: 'brasa', r: 320 }],
    luces: [{ id: 'cielo', color: [130, 150, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 800, k: 0.26 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true }, { t: 0.4, id: 'dron_frio', cine: true }, { t: 0.6, id: 'brasa_vuela', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => {
      vaho(e, tl, dt, 3);
      // su luz se enfría: una luz azul que la acompaña y crece mientras ella se encoge
      const b = brasaEn(e, tl), Ls = lucesDe(e); if (b && Ls) Ls.push({ id: 'frio', x: b.x, y: b.y, z: b.z, r: 200, c: [150, 190, 255], k: 0.15 + 0.55 * Math.min(1, tl / 8), sinSombra: true });
    },
    textos: [L(4, 2.0, 8.6)],
  },
  {
    // la puerta de los jarls: la brasa pasa entre las piedras y las runas se encienden de azul; unas huellas enormes y descalzas,
    // recién hechas, entran por la puerta hacia el norte. El cuerno, lejos
    id: 'puerta', dur: 10, zona: 'a4_picos', ancla: anclaHito, entra: 0.5, sale: 0.6, oscuridad: 0.78, hundir: 0.66, sinBruma: true,
    preparar: (e) => despejarPies(e, 4.5, 4.5, 4),
    cam: [{ t: 0, x: 5.2, y: 5.6, alt: 120, zoom: 2, fy: 0.62 }, { t: 10, x: 3.8, y: 4.2, alt: 130, c: 'suave' }],
    brasa: [{ t: 0, x: 10, y: 9, z: 110, k: 0.7, tam: 0.6 }, { t: 3.6, x: 1.2, y: 1.2, z: 60, k: 0.75, c: 'suave' }, { t: 6.2, x: -3, y: -3, z: 90, k: 0.6, c: 'suave' }, { t: 8.0, x: -10, y: -10, z: 140, k: 0.4, tam: 0.4, c: 'lineal' }],
    focos: [{ de: [0, 0], z: 60, r: 240, k: 0.85 }, { de: [4.8, -2.8], z: 0, r: 150, k: 0.75 }, { de: 'brasa', r: 120, k: 0.7 }],
    luces: [
      { id: 'runas', color: [90, 150, 255], sombra: true, claves: [{ t: 0, x: 0.6, y: 0.6, z: 70, r: 180, k: 0 }, { t: 3.2, k: 0 }, { t: 4.0, k: 0.75, c: 'sale' }, { t: 10, k: 0.45 }] },
      { id: 'cielo', color: [120, 140, 190], claves: [{ t: 0, x: 3, y: 3, z: 400, r: 700, k: 0.16 }] },
    ],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true, vol: 0.7 }, { t: 3.6, id: 'runas', cine: true }, { t: 5.4, id: 'cuerno', cine: true }],
    paso: (e, tl, dt) => vaho(e, tl, dt, 1),
    suelo: (e) => huellasRey(e, [2.2, 0.4], [-0.6, -15]),
    textos: [L(5, 4.6, 9.6)],
  },
  { id: 'acto4', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 4) },
];

export const CINE_ACTO3: Guion = { id: 'acto3', acto: 3, tomas };
