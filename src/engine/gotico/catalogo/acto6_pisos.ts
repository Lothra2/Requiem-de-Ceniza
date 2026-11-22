import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 6 (22 nov 2026): la costa, el arrecife, las dos partes del barrio sumergido, el faro, las
// criptas y el campanario pisaban todos lajas con musgo y agua. Como los del acto 2: de 8 variantes, cada dos baldosas
// (`PISO_DOBLE` en motor/assets.ts) y en el catálogo para no mover `__PINTOR__`.
const P = BALDOSA;

MATERIALES.a6_arena_gris = { rampa: ['#121312', '#1e201e', '#2c2e2b', '#3b3d39', '#4b4d48', '#5c5e58', '#6e7069'], ruido: 0.16, escala: 0.22 };
MATERIALES.a6_espuma = { rampa: ['#3e4648', '#56605f', '#6f7a78', '#8a9592', '#a6b0ac'], ruido: 0.35, escala: 0.4 };
MATERIALES.a6_alga = { rampa: ['#060b07', '#0c160d', '#132313', '#1b3119', '#25401f'], ruido: 0.4, escala: 0.4 };
MATERIALES.a6_concha = { rampa: ['#3a2f2a', '#5a4a40', '#7c685a', '#9e8874', '#bea890'], ruido: 0.2, escala: 0.4 };
MATERIALES.a6_coral = { rampa: ['#2a1f1d', '#43322e', '#5f4842', '#7c5f57', '#99786d', '#b39286', '#c9aa9c'], ruido: 0.25, escala: 0.25 };
MATERIALES.a6_charca = { rampa: ['#03080a', '#071116', '#0c1b21', '#12262d', '#1b3540', '#2a4b57'], ruido: 0.1, escala: 0.3, brillo: 0.5 };
MATERIALES.a6_adoquin = { rampa: ['#0c0d10', '#16181c', '#212429', '#2d3137', '#3a3f46', '#494f57', '#5a6068'], ruido: 0.22, escala: 0.22, brillo: 0.3 };
MATERIALES.a6_charco = { rampa: ['#05070a', '#0a0f14', '#121a22', '#1d2933', '#2c3c48', '#40525f'], ruido: 0.08, escala: 0.3, brillo: 0.7 };
MATERIALES.a6_plaza = { rampa: ['#14130f', '#222019', '#312e25', '#423e32', '#544f40', '#666050', '#787161'], ruido: 0.2, escala: 0.2 };
MATERIALES.a6_bronce_verdin = { rampa: ['#0c1a16', '#143027', '#1f4438', '#2d5a4a', '#3f735e', '#568c72'], ruido: 0.25, escala: 0.3, brillo: 0.4 };
MATERIALES.a6_agua_verde = { rampa: ['#030907', '#06120e', '#0a1c16', '#10281f', '#17362b', '#21473a'], ruido: 0.1, escala: 0.3, brillo: 0.6 };
MATERIALES.a6_losa_hundida = { rampa: ['#0b110f', '#131c19', '#1c2824', '#263530', '#31433d'], ruido: 0.2, escala: 0.2 };
MATERIALES.a6_tablas = { rampa: ['#0f0c09', '#1a1510', '#261f17', '#33291e', '#413426', '#4f402f'], ruido: 0.3, escala: 0.25 };
MATERIALES.a6_piedra_faro = { rampa: ['#16171a', '#24262a', '#34373c', '#46494f', '#585c62', '#6c7077', '#80858b'], ruido: 0.2, escala: 0.2 };

const NUEVOS: PisoDef[] = [
  // la Costa de los Naufragios: arena gris y mojada, las líneas de la espuma que dejó la marea, conchas y algas varadas
  { id: 'a6_arena_gris', nombre: ['Arena mojada', 'Wet sand'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const n = fr(x, y, 3, 101), m = fr(x, y, 8, 102), linea = Math.abs(((x * 0.7 + y * 1.1) / P) * 3 + n * 2.2) % 1;
    if (linea < 0.04) return ['a6_espuma', 0.4, (m - 0.5) * 0.3];
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.92) return ['a6_concha', 1.2, 0];
    if (fr(x, y, 5, 103) > 0.74) return ['a6_alga', 0.6, (m - 0.5) * 0.3];
    const moja = n < 0.4 ? -0.1 : 0;
    return ['a6_arena_gris', m * 1.2, (m - 0.5) * 0.14 + moja + (linea < 0.12 ? 0.06 : 0)];
  } },
  // el Arrecife de Huesos: coral blanco de hueso en mogotes, con charcas de marea entre ellos
  { id: 'a6_coral', nombre: ['Coral de hueso', 'Bone coral'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const charca = fr(x, y, 3, 105);
    if (charca < 0.3) return ['a6_charca', 0, (fr(x, y, 12, 106) - 0.5) * 0.2];
    // ramas de coral: crestas de ruido (1 - |2n - 1|) a dos escalas, que se cruzan como un lecho de cuernos y huesos
    const r1 = Math.max(0, 1 - Math.abs(fr(x, y, 5, 120) - 0.5) * 11), r2 = Math.max(0, 1 - Math.abs(fr(x, y, 11, 121) - 0.5) * 13), cresta = Math.max(r1, r2 * 0.85);
    if (cresta < 0.12) return [charca < 0.42 ? 'a6_charca' : 'a6_arena_gris', -0.6, -0.1 + (fr(x, y, 9, 123) - 0.5) * 0.15];
    if (v > 0 && lejos(x, y) && det(x, y, v, 5) > 0.9) return ['a6_concha', 2.4, 0.05];
    const rosa = fr(x, y, 2, 122) > 0.6;
    return [rosa ? 'a6_coral' : 'a6_concha', cresta * 3, (cresta - 0.6) * 0.4 + (rosa ? 0 : 0.06)];
  } },
  // las Calles Mojadas: adoquín oscuro brillante de agua, charcos que reflejan y verdín en las juntas
  { id: 'a6_adoquin', nombre: ['Adoquín mojado', 'Wet cobbles'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 8, 107), charco = fr(x, y, 3, 108);
    if (charco < 0.28) return ['a6_charco', 0, (fr(x, y, 10, 109) - 0.5) * 0.2];
    if (d2 - d1 < 1.3) return [fr(x, y, 6, 110) > 0.55 ? 'a6_alga' : 'a6_adoquin', -1.2, -0.2];
    if (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.88) return ['a6_adoquin', 0, -0.25];
    return ['a6_adoquin', Math.min(2.4, (d2 - d1) * 0.7), (hash3(id, 3, 3) - 0.5) * 0.22 + (charco < 0.34 ? 0.1 : 0)];
  } },
  // la Plaza de las Ánimas: losas en anillos alrededor de una rosa de bronce con verdín, cada dos baldosas
  { id: 'a6_plaza', nombre: ['Losas de la plaza', 'Square flagstones'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const dx = x - 80, dy = y - 80, r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    if (r < 18) {
      const punta = Math.abs(((ang / (Math.PI * 2)) * 8 + 8.5) % 1 - 0.5) < 0.08 + (18 - r) * 0.012;
      if (r < 3 || punta) return ['a6_bronce_verdin', 1, 0.05];
      return ['a6_plaza', 0.8, 0.12];
    }
    const anillo = Math.floor((r - 18) / 12), u = (r - 18) % 12, piezas = 10 + anillo * 6, s = ((ang / (Math.PI * 2)) * piezas + 100 + anillo * 0.37) % 1;
    if (u < 1 || s < 0.04) return [fr(x, y, 6, 111) > 0.5 ? 'a6_alga' : 'a6_plaza', -1, -0.25];
    const id = anillo * 97 + Math.floor(((ang / (Math.PI * 2)) * piezas + 100 + anillo * 0.37));
    let tono = (hash3(id, 5, 1) - 0.5) * 0.2;
    if (v > 0 && lejos(x, y) && det(x, y, v, 16) > 0.86) tono -= 0.15;
    if (fr(x, y, 4, 112) > 0.72) return ['a6_alga', 0.4, 0];
    return ['a6_plaza', 1, tono];
  } },
  // las Criptas Inundadas: losas bajo dos dedos de agua verde, que asoman donde el piso sube
  { id: 'a6_agua_cripta', nombre: ['Cripta inundada', 'Flooded crypt floor'], tema: 'ahogada', variantes: 8, punto: (x, y) => {
    const [d1, d2, id] = voronoi(x, y, 4, 113), alto = fr(x, y, 3, 114) + (hash3(id, 1, 1) - 0.5) * 0.3;
    if (alto > 0.62 && d2 - d1 > 1.6) return ['a6_losa_hundida', 1, (hash3(id, 2, 2) - 0.5) * 0.2];
    const junta = d2 - d1 < 1.6, ola = Math.sin((x - y) * 0.3 + fr(x, y, 6, 115) * 5) * 0.5;
    return ['a6_agua_verde', ola * 0.3, (junta ? -0.18 : 0.04) + ola * 0.05 + (hash3(id, 3, 3) - 0.5) * 0.1];
  } },
  // el Campanario Hundido: tablas viejas del piso de la torre, negras de humedad, con huecos y clavos
  { id: 'a6_tablas', nombre: ['Tablas mojadas', 'Wet boards'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const tabla = Math.floor(y / 9), corre = hash3(tabla % 18, 1, 116) * P * 2, u = (x + corre) % 46;
    if (y % 9 < 1 || u < 0.9) return ['negro', -1.5, 0];
    if (v > 0 && lejos(x, y) && det(x, y, v, 15) > 0.9) return ['negro', -2, 0]; // tabla podrida que falta
    if (Math.abs(u - 3) < 0.6 && Math.abs((y % 9) - 4.5) < 0.6) return ['hierro_oxido', 0.6, 0];
    if (fr(x, y, 4, 117) > 0.7) return ['a6_alga', 0.3, -0.05];
    return ['a6_tablas', 0.6, (hash3(tabla % 18, Math.floor((x + corre) / 46), 118) - 0.5) * 0.25 + (fr(x * 3, y * 0.3, 8, tabla) - 0.5) * 0.18];
  } },
  // el Faro Apagado: piedra gris clara del faro en anillos alrededor del centro de la torre, con hollín
  { id: 'a6_piedra_faro', nombre: ['Piedra del faro', 'Lighthouse stone'], tema: 'ahogada', variantes: 8, punto: (x, y, v) => {
    const dx = x - 80, dy = y - 80, r = Math.hypot(dx, dy), ang = Math.atan2(dy, dx);
    const anillo = Math.floor(r / 14), u = r % 14, piezas = 6 + anillo * 5, s = ((ang / (Math.PI * 2)) * piezas + 50 + anillo * 0.5) % 1;
    if (u < 1.1 || s < 0.05) return ['a6_adoquin', -1, -0.3];
    const id = anillo * 131 + Math.floor((ang / (Math.PI * 2)) * piezas + 50 + anillo * 0.5);
    let tono = (hash3(id, 4, 7) - 0.5) * 0.2 - (fr(x, y, 3, 119) > 0.66 ? 0.25 : 0); // el hollín del fuego que se apagó
    if (v > 0 && lejos(x, y) && det(x, y, v, 12) > 0.88) tono -= 0.12;
    return ['a6_piedra_faro', 1, tono];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO6 = NUEVOS.map((d) => d.id);
