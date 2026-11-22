import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 7 (22 nov 2026): el cielo roto, el jardín, la bóveda, el relicario, las escaleras y el
// trono pisaban arenisca, losas arcanas o las losas de runas de la fortaleza. Como los de los actos 2 y 6.
void BALDOSA;

MATERIALES.a7_lapis = { rampa: ['#04060f', '#080d1d', '#0e152c', '#151e3d', '#1e2a50', '#293864'], ruido: 0.15, escala: 0.2, brillo: 0.3 };
MATERIALES.a7_estrella = { rampa: ['#6a5418', '#a08028', '#d4b048', '#f4dc86'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a7_oro_mate = { rampa: ['#2a1d08', '#46310d', '#664914', '#88631d', '#a87e2a', '#c49a3c'], ruido: 0.12, escala: 0.2, brillo: 0.5 };
MATERIALES.a7_marmol = { rampa: ['#3a3836', '#57544f', '#75716a', '#938e85', '#aea9a0', '#c6c1b8', '#d9d5cd'], ruido: 0.12, escala: 0.2 };
MATERIALES.a7_veta = { rampa: ['#2e2a26', '#45403a', '#5d574f'], ruido: 0.2, escala: 0.4 };
MATERIALES.a7_terciopelo = { rampa: ['#12030a', '#220610', '#350a18', '#4a1022', '#60172d'], ruido: 0.3, escala: 0.5 };
MATERIALES.a7_ceniza = { rampa: ['#141312', '#201e1c', '#2e2b28', '#3d3a36', '#4d4944', '#5e5a54'], ruido: 0.3, escala: 0.3 };
MATERIALES.a7_oro_seco = { rampa: ['#1e1406', '#32220b', '#4a3311', '#644618', '#7e5a20', '#966e2b'], ruido: 0.2, escala: 0.25 };
MATERIALES.a7_sangre_seca = { rampa: ['#0f0303', '#1c0606', '#2b0a0a', '#3b0f0e'], ruido: 0.2, escala: 0.3 };
MATERIALES.a7_musgo_oro = { rampa: ['#141107', '#25200c', '#3a3212', '#524718', '#6c5e1f', '#877627', '#a08f33'], ruido: 0.35, escala: 0.35 };

const NUEVOS: PisoDef[] = [
  // la Bóveda de los Astros: lapislázuli pulido con estrellas de oro, líneas de constelación y, cada dos baldosas, el aro de
  // una esfera armilar embutido en el piso
  { id: 'a7_astros', nombre: ['Piso de los astros', 'Floor of stars'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const r = Math.hypot(x - 80, y - 80);
    if (Math.abs(r - 30) < 1.1 || Math.abs(r - 24) < 0.7) return ['a7_oro_mate', 0.6, 0.05];
    const [d1, , id] = voronoi(x, y, 5, 130);
    if (d1 < 1.3 && hash3(id, 1, 3) > 0.45) return ['a7_estrella', 0.4, hash3(id, 2, 2) * 0.3];
    if (d1 < 0.7) return ['a7_estrella', 0.3, -0.1];
    const c = 40, ux = x % c, uy = y % c;
    if (ux < 0.8 || uy < 0.8) return ['a7_oro_mate', -0.4, -0.2];
    return ['a7_lapis', 1, (fr(x, y, 6, 131) - 0.5) * 0.18 + (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.88 ? -0.12 : 0)];
  } },
  // el Relicario del Sediento: alfombras de terciopelo carmesí con filete de oro sobre mármol pálido
  { id: 'a7_relicario', nombre: ['Piso del relicario', 'Reliquary floor'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const u = y % 80;
    if (u > 22 && u < 58) {
      if (u < 24.5 || u > 55.5) return ['a7_oro_mate', 0.8, 0];
      const rombo = Math.abs(((x % 20) - 10)) + Math.abs(u - 40) * 0.6 < 4;
      return [rombo ? 'a7_oro_mate' : 'a7_terciopelo', rombo ? 0.6 : 0.4, rombo ? -0.1 : (fr(x, y, 10, 132) - 0.5) * 0.2];
    }
    const c = 20, ux = x % c, uy = y % c;
    if (ux < 0.8 || uy < 0.8) return ['a7_veta', -0.6, -0.1];
    const veta = Math.abs(Math.sin((x + y * 0.4) * 0.12 + fr(x, y, 4, 133) * 8)) < 0.06;
    return [veta ? 'a7_veta' : 'a7_marmol', 1, (fr(x, y, 6, 134) - 0.5) * 0.15 + (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.88 ? -0.15 : 0)];
  } },
  // las Escaleras al Trono: mármol blanco veteado en peldaños largos, cada uno con su canto de sombra (sube a lo largo de x)
  { id: 'a7_peldanos', nombre: ['Peldaños de mármol', 'Marble steps'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const u = x % 16, losa = Math.floor(y / 26) + Math.floor(x / 16) * 7;
    if (u < 1.4) return ['a7_veta', -1, -0.25];
    if (u < 3) return ['a7_marmol', 1.6, 0.14];
    if (y % 26 < 0.7) return ['a7_veta', -0.3, -0.05];
    const veta = Math.abs(Math.sin((x * 0.3 + y) * 0.1 + fr(x, y, 4, 135) * 7)) < 0.05;
    return [veta ? 'a7_veta' : 'a7_marmol', 1, (hash3(losa, 3, 1) - 0.5) * 0.12 + (v > 0 && lejos(x, y) && det(x, y, v, 12) > 0.9 ? -0.18 : 0)];
  } },
  // el Trono Sediento: oro reseco y agrietado como tierra sin agua, la sangre seca en las grietas
  { id: 'a7_sed', nombre: ['Oro reseco', 'Parched gold'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 4, 136), b = d2 - d1;
    if (b < 1.1) return ['a7_sangre_seca', -2, 0];
    if (b < 2) return ['a7_oro_seco', -0.5, -0.25];
    if (fr(x, y, 5, 137) > 0.74) return ['a7_sangre_seca', 0.3, 0.1];
    return ['a7_oro_seco', 1 + Math.min(1.5, (4 - b) * 0.3), (hash3(id, 5, 5) - 0.5) * 0.2 + (v > 0 && lejos(x, y) && det(x, y, v, 10) > 0.9 ? 0.1 : 0)];
  } },
  // el Cielo Roto: ceniza que cayó sobre el mármol de las islas, losas que asoman entre la ceniza
  { id: 'a7_ceniza_marmol', nombre: ['Ceniza sobre mármol', 'Ash over marble'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const ceniza = fr(x, y, 3, 138);
    if (ceniza > 0.52) return ['a7_ceniza', (ceniza - 0.52) * 4 + fr(x, y, 14, 139), (fr(x, y, 9, 140) - 0.5) * 0.2];
    const c = 26, ux = x % c, uy = (y + (Math.floor(x / c) % 2) * 13) % c;
    if (ux < 1 || uy < 1) return ['a7_ceniza', -0.5, -0.15];
    return ['a7_marmol', 1, (fr(x, y, 6, 141) - 0.5) * 0.2 - (ceniza > 0.45 ? 0.15 : 0) + (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.88 ? -0.15 : 0)];
  } },
  // el Jardín de los que Intentaron: musgo de oro seco y piedras de paso de mármol
  { id: 'a7_musgo_oro', nombre: ['Musgo de oro', 'Golden moss'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 3, 142);
    if (hash3(id, 8, 8) > 0.72 && d1 < 9) return d1 > 8 ? ['a7_veta', -0.3, 0] : ['a7_marmol', 1.2, (hash3(id, 1, 4) - 0.5) * 0.15];
    const n = fr(x, y, 10, 143), m = fr(x, y, 3, 144);
    if (v > 0 && lejos(x, y) && det(x, y, v, 4) > 0.93) return ['a7_oro_mate', 0.8, 0.1];
    return ['a7_musgo_oro', n * 1.6, (n - 0.5) * 0.3 + (m - 0.5) * 0.15 - (d2 - d1 < 1 ? 0.05 : 0)];
  } },
  // las Islas de Oro: losas grandes de mármol blanco con filetes de oro embutidos y una estrella de oro en cada cruce
  { id: 'a7_oro_losas', nombre: ['Losas de oro y mármol', 'Gold and marble slabs'], tema: 'celestial', variantes: 8, punto: (x, y, v) => {
    const c = 40, ux = x % c, uy = y % c, dx = Math.min(ux, c - ux), dy = Math.min(uy, c - uy);
    if (dx < 4 && dy < 4 && dx + dy < 4.5) return ['a7_oro_mate', 1.2, 0.12 - (dx + dy) * 0.03];
    if (dx < 1.3 || dy < 1.3) return ['a7_oro_mate', 0.5, -0.05];
    const veta = Math.abs(Math.sin((x - y * 0.5) * 0.09 + fr(x, y, 4, 145) * 7)) < 0.05;
    return [veta ? 'a7_veta' : 'a7_marmol', 1, (fr(x, y, 5, 146) - 0.5) * 0.14 + 0.06 + (v > 0 && lejos(x, y) && det(x, y, v, 14) > 0.88 ? -0.15 : 0)];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO7 = NUEVOS.map((d) => d.id);
