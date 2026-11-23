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
 * El cordón: un hilo de sangre de pixel entre el pecho del cuerpo y la brasa, que cuelga, late (se hincha con el latido) y
 * se estira; a los `corte` segundos se parte: el pedazo de abajo cae y se recoge en el cuerpo, el de arriba se encoge hacia la
 * brasa. En el pase del mundo (aPant vale).
 */
function cordon(e: EstadoToma, tl: number, corte: number) {
  const b = brasaEn(e, tl); if (!b && tl < corte) return;
  const [cx, cy] = aPant(e.ax + 0.1, e.ay + 0.1), P0: [number, number] = [cx, cy - 10];
  const bb = b ?? e.mem.ultB; if (!bb) return; e.mem.ultB = bb;
  const [bx, by0] = aPant(bb.x, bb.y), P1: [number, number] = [bx, by0 - bb.z];
  const lat = latido(tl - 0.2), d = Math.hypot(P1[0] - P0[0], P1[1] - P0[1]);
  ctx.save(); ctx.imageSmoothingEnabled = false;
  // (un trazo continuo, con un punto cada medio punto del dibujo: la curva se va de lado como un cordón que cuelga, y ondea)
  const pinta = (u0: number, u1: number, sag: number, grueso: number, alfa: number, desde: [number, number], hasta: [number, number]) => {
    const L = Math.hypot(hasta[0] - desde[0], hasta[1] - desde[1]) || 1, nx = -(hasta[1] - desde[1]) / L, ny = (hasta[0] - desde[0]) / L;
    const n = Math.max(12, Math.round(L * 2)), pts: [number, number, number][] = [];
    for (let i = 0; i <= n; i++) {
      const u = u0 + (u1 - u0) * (i / n), b = Math.sin(u * Math.PI), o = b * sag + Math.sin(u * 9 - tl * 5) * b * 2.5;
      pts.push([desde[0] + (hasta[0] - desde[0]) * u + nx * o, desde[1] + (hasta[1] - desde[1]) * u + ny * o + b * sag * 0.25, u]);
    }
    ctx.globalAlpha = alfa;
    for (const [x, y, u] of pts) { const w = Math.max(1, Math.round(grueso * (1.3 - 0.7 * u) * (1 + 0.35 * lat))); ctx.fillStyle = '#2a0304'; ctx.fillRect(Math.round(x - w / 2) - 1, Math.round(y - w / 2), w + 2, w + 1); }
    for (const [x, y, u] of pts) { const w = Math.max(1, Math.round(grueso * (1.3 - 0.7 * u) * (1 + 0.35 * lat))); ctx.fillStyle = '#8a1410'; ctx.fillRect(Math.round(x - w / 2), Math.round(y - w / 2), w, w); }
    // la sangre que corre por adentro, hacia arriba, con el latido
    for (let k = 0; k < pts.length; k += 3) { const [x, y, u] = pts[k], f = ((u * 6 - tl * 2.2) % 1 + 1) % 1; if (f < 0.35) { ctx.globalAlpha = alfa * (0.5 + 0.5 * lat); ctx.fillStyle = '#e0402a'; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); } }
  };
  if (tl < corte) {
    // tenso: cuelga menos cuanto más se estira; tiembla en el último segundo
    const tiembla = tl > corte - 1 ? Math.sin(tl * 60) * 1.2 : 0;
    pinta(0, 1, Math.min(12, d * 0.22) + tiembla, 2, 1, P0, P1);
  } else {
    const u = Math.min(1, (tl - corte) / 0.6), cae = u * u;
    const M: [number, number] = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2];
    // el de abajo: se recoge latigueando hacia el cuerpo
    pinta(0, 1, 10 + cae * 30, 2, 1 - u * 0.6, P0, [M[0] + (P0[0] - M[0]) * cae, M[1] + (P0[1] - M[1]) * cae + cae * 18]);
    // el de arriba: se encoge hacia la brasa
    if (u < 1) pinta(0, 1, 6, 1, 1 - u, [M[0] + (P1[0] - M[0]) * u, M[1] + (P1[1] - M[1]) * u], P1);
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
 * Las huellas del Rey de Escarcha: pies desnudos enormes (casi una casilla de largo), hundidos en la nieve con el labio de
 * nieve levantado alrededor, cinco dedos y escarcha que brilla adentro. Van de la cámara hacia la puerta (`hacia`), de a una
 * por pie, alternando. Se dibujan en el piso del mundo (en el pase del mundo).
 */
function huellasRey(e: EstadoToma, tl: number, desde: [number, number], hacia: [number, number], n: number) {
  const [dx, dy] = [hacia[0] - desde[0], hacia[1] - desde[1]], d = Math.hypot(dx, dy), ux = dx / d, uy = dy / d;
  // el rumbo en la pantalla (la huella apunta hacia donde va)
  const sx = (ux - uy) * 16, sy = (ux + uy) * 8, sl = Math.hypot(sx, sy), ax = sx / sl, ay = sy / sl;
  ctx.save(); ctx.imageSmoothingEnabled = false;
  for (let i = 0; i < n; i++) {
    const k = i / (n - 1), lado = i % 2 ? 1 : -1;
    const wx = e.ax + desde[0] + dx * k - uy * lado * 0.45, wy = e.ay + desde[1] + dy * k + ux * lado * 0.45;
    const [px, py] = aPant(wx, wy);
    // el pie en un marco propio: a lo largo (ax, ay) y a lo ancho (perpendicular, aplastado por el piso)
    const G = 1.4, pie = (u: number, v: number): [number, number] => [Math.round(px + (ax * u - ay * v * 0.55) * G), Math.round(py + (ay * u * 0.55 + ax * v * 0.5) * G)];
    const frio = 0.75 + 0.25 * Math.sin(tl * 3 + i * 1.7);
    const mancha = (u: number, v: number, ru: number, rv: number, col: string, a: number) => {
      ctx.globalAlpha = a; ctx.fillStyle = col;
      for (let q = -ru; q <= ru; q++) for (let w = -rv; w <= rv; w++) if ((q / ru) ** 2 + (w / rv) ** 2 <= 1) { const [x, y] = pie(u + q, v + w); ctx.fillRect(x, y, 2, 2); }
    };
    // el labio de nieve levantado (claro), el hueco (azul oscuro) y la escarcha que brilla
    mancha(-5, 0, 6, 5, '#f2f6fb', 1); mancha(5, lado * 0.5, 7, 6, '#f2f6fb', 1);
    mancha(-5, 0, 5, 4, '#9aa6bf', 1); mancha(4, lado * 0.5, 6, 5, '#9aa6bf', 1);
    mancha(-1, 0, 2, 3, '#9aa6bf', 1);
    for (let t = 0; t < 5; t++) { const v = (t - 2) * 2.4 + lado * 0.5, u = 13 - Math.abs(t - 1.2) * 1.0; mancha(u, v, 1.6, 1.6, '#f2f6fb', 1); mancha(u, v, 1, 1, '#7a87a2', 1); }
    mancha(-6, -1, 3, 2, '#7a87a2', 1); mancha(5, lado, 4, 3, '#7a87a2', 1);
    // escarcha: puntos que destellan de a uno
    for (let s = 0; s < 4; s++) { const [x, y] = pie(-6 + s * 4, ((s * 7 + i * 3) % 7) - 3); ctx.globalAlpha = frio * (((s + i + Math.floor(tl * 4)) % 4) === 0 ? 1 : 0.45); ctx.fillStyle = '#cfe6ff'; ctx.fillRect(x, y, 1, 1); }
  }
  ctx.restore();
}

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
    cam: [{ t: 0, x: 1.1, y: -0.2, alt: 26, zoom: 3, fy: 0.55 }, { t: 4.6, x: 1.0, y: -0.2, alt: 40, c: 'suave' }, { t: 6.4, x: 0.9, y: -0.3, alt: 80, c: 'entra' }, { t: 9, x: 0.9, y: -0.3, alt: 92 }],
    actores: [
      { id: 'madre', tipo: 'mon', mon: 'madre_cienaga', claves: [{ t: 0, x: 0, y: 0, dir: 's', acc: 'morir', ritmo: 60 }] },
      { id: 'heroe', tipo: 'heroe', claves: [{ t: 0, x: 2.5, y: -0.9, mira: [0, 0] }, { t: 3.6, x: 2.5, y: -0.9 }, { t: 4.4, x: 3.0, y: -1.2, c: 'sale' }, { t: 4.5, mira: [0.2, 0.2] }, { t: 6.5, dir: 'no' }] },
      { id: 'thor', tipo: 'thor', claves: [{ t: 0, x: 3.0, y: 1.6, mira: [0, 0] }, { t: 6.2, x: 3.0, y: 1.6 }, { t: 7.6, x: 1.3, y: 1.0, c: 'suave' }, { t: 7.7, mira: [0.2, 0.3] }] },
    ],
    focos: [{ de: 'brasa', r: 200 }, { de: 'heroe', z: 34, r: 120, k: 0.75 }, { de: [0.2, 0.2], z: 10, r: 110, k: 0.6 }],
    primer: [{ id: columnaDe, fx: 0.9, fy: 1.16, par: 2.2, mas: 2 }],
    brasa: [{ t: 0.9, x: 0.15, y: 0.15, z: 4, k: 0, tam: 0.35 }, { t: 2.2, z: 10, k: 0.55, tam: 0.55 }, { t: 4.0, z: 34, k: 0.9, tam: 0.9, c: 'sale' }, { t: 5.4, z: 46, k: 1, tam: 1 }, { t: 6.6, z: 560, k: 1, c: 'entra' }],
    luces: [{ id: 'carne', color: [200, 50, 40], claves: [{ t: 0, x: -1, y: 2, z: 40, r: 200, k: 0.35 }, { t: 9, k: 0.15 }] }],
    sonidos: [{ t: 0.9, id: 'brasa_nace', cine: true }, { t: 1.4, id: 'latido', cine: true }, { t: 2.5, id: 'latido', cine: true }, { t: 3.6, id: 'latido', cine: true, vol: 1.2 }, { t: 5.3, id: 'golpe_carne' }, { t: 5.35, id: 'cordon', cine: true }, { t: 5.9, id: 'brasa_vuela', cine: true }],
    temblores: [[5.35, 0.3, 2]],
    paso: (e, tl) => {
      vez(e, 'sangre', tl, 0, () => charco(e, 'c', 0.3, 0.3, 1.8, 1.9));
      vez(e, 'pecho', tl, 2.2, () => estallido(e.brasa, (e.ax - e.ay) * 16, (e.ax + e.ay) * 8 - 8, 26, 0.6));
      vez(e, 'corta', tl, 5.35, () => gotasCorte(e, tl));
    },
    mundo: (e, tl) => { if (tl > 0.9 && tl < 6.2) cordon(e, tl, 5.35); },
    textos: [L(1, 4.6, 8.8)],
  },
  {
    // la escalera de la pirámide de Yhuantl: la brasa sale por la boca de la máscara; abajo, al pie de los escalones, Vesperio de
    // espaldas cantando bajito. La brasa le pasa junto a la cara, él se inclina, se da vuelta y nos mira un instante
    id: 'escalones', dur: 9, zona: 'a3_pantano', ancla: anclaSalida('a3_templo1'), entra: 0.6, sale: 0.8, oscuridad: 0.84, hundir: 0.66, sinBruma: true, filo: 0.4, sinClima: ['fx_lluvia', 'fx_tormenta', 'fx_luciernagas'],
    preparar: (e) => { sinLluvia(e); despejarPiezas(e.z!, 'a3_templo1'); despejarPies(e, 3, 3, 3.5); },
    cam: [{ t: 0, x: 4.4, y: 2.8, alt: 90, zoom: 2, fy: 0.62 }, { t: 9, x: 4.1, y: 2.5, alt: 96, c: 'suave' }],
    actores: [
      { id: 'vesperio', tipo: 'mon', mon: 'heraldo', sombra: ['#241c2c', 0.55], claves: [{ t: 0, x: 5.2, y: 1.4, dir: 'no', acc: 'quieto' }, { t: 2.4, mira: [0, 0] }, { t: 3.3, acc: 'lanzar', dur: 1.0, ritmo: 0.25, mira: [0, 0] }, { t: 5.2, acc: 'quieto', mira: [6, 2] }, { t: 5.9, dir: 's' }, { t: 7.5, x: 5.2, y: 1.4, alfa: 1 }, { t: 8.8, x: 4.6, y: 0.8, alfa: 0, c: 'lineal' }] },
    ],
    brasa: [{ t: 0.3, x: 0, y: 0, z: 40, k: 0.7, tam: 0.8 }, { t: 2.6, x: 4.4, y: 2.0, z: 70, k: 0.75, tam: 0.9, c: 'sale' }, { t: 4.2, x: 5.0, y: 2.0, z: 76, k: 0.75, c: 'suave' }, { t: 6.0, x: 8, y: -2, z: 150, k: 1, c: 'entra' }, { t: 7.2, x: 16, y: -8, z: 240, k: 0.8, tam: 0.7, c: 'lineal' }],
    focos: [{ de: 'vesperio', z: 56, r: 170, k: 0.85 }, { de: [0, 0], z: 90, r: 200, k: 0.4 }, { de: 'brasa', r: 140, k: 0.7 }],
    luces: [
      { id: 'ves', color: VIOLETA, sombra: true, titila: 0.08, claves: [{ t: 0, x: 6.2, y: 0.8, z: 50, r: 140, k: 0.7 }, { t: 7.5, k: 0.65 }, { t: 8.8, k: 0 }] },
      { id: 'luna', color: [110, 140, 130], claves: [{ t: 0, x: 2, y: 2, z: 400, r: 600, k: 0.25 }] },
    ],
    sonidos: [{ t: 0, id: 'coro_vesperio', cine: true, tono: 0.94 }, { t: 0.4, id: 'brasa_vuela', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => { const m = e.actores.get('vesperio') as any; if (e.j && m && Math.random() < dt * (tl > 7.5 ? 30 : 6)) ceniza(e.j, m.x, m.y, tl > 7.5 ? 2 : 1, '#9e96ae'); },
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
    // hacia el norte: los picos con la nieve que empieza; la brasa entra en el frío, su fuego se encoge y deja vaho
    id: 'norte', dur: 9, zona: 'a4_picos', ancla: anclaHito, entra: 0.8, sale: 0.6, oscuridad: 0.6, hundir: 0.4, sinBruma: true,
    cam: [{ t: 0, x: 26, y: 18, alt: 120, zoom: 1, fy: 0.5 }, { t: 9, x: 12, y: 8, alt: 120, c: 'suave' }],
    brasa: [{ t: 0.5, x: 38, y: 30, z: 220, k: 1, tam: 2.2 }, { t: 5, x: 20, y: 14, z: 150, k: 0.9, tam: 1.5, c: 'suave' }, { t: 9, x: 9, y: 6, z: 100, k: 0.75, tam: 0.9, c: 'suave' }],
    focos: [{ de: 'brasa', r: 300 }],
    luces: [{ id: 'cielo', color: [140, 160, 200], claves: [{ t: 0, x: 0, y: 0, z: 400, r: 800, k: 0.3 }] }],
    sonidos: [{ t: 0, id: 'viento_nieve', cine: true }, { t: 0.4, id: 'dron_frio', cine: true }, { t: 0.6, id: 'brasa_vuela', cine: true, vol: 0.4 }],
    paso: (e, tl, dt) => vaho(e, tl, dt, 2),
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
    mundo: (e, tl) => huellasRey(e, tl, [7.8, -3.0], [3.4, -4.6], 6),
    textos: [L(5, 4.6, 9.6)],
  },
  { id: 'acto4', dur: 7, entra: 0, sale: 1.4, sonidos: [{ t: 0.35, id: 'titulo', cine: true }], pantalla: (_e, tl) => cartel(tl, 7, 4) },
];

export const CINE_ACTO3: Guion = { id: 'acto3', acto: 3, tomas };
