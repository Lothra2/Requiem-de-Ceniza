import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 5 (22 nov 2026): las Llanuras de Ceniza y el Río de Lava, el Abismo, la Fragua y los dos
// santuarios de la Herida pisaban todos la misma tierra roja del infierno. Como los de los otros actos: 8 variantes, cada dos
// baldosas (`PISO_DOBLE`), en el catálogo para no mover `__PINTOR__`.
void BALDOSA;

MATERIALES.a5_ceniza = { rampa: ['#1b1a19', '#2a2826', '#3a3734', '#4b4743', '#5d5853', '#6f6a64', '#827c75'], ruido: 0.3, escala: 0.45 };
MATERIALES.a5_carbon = { rampa: ['#060505', '#0e0c0b', '#171412', '#211d1a'], ruido: 0.3, escala: 0.4 };
MATERIALES.a5_ascua = { rampa: ['#3a0c02', '#6e1b04', '#a83508', '#e0600f', '#ff9a30'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a5_basalto = { rampa: ['#070606', '#0f0d0c', '#181513', '#221e1b', '#2d2824', '#38322d'], ruido: 0.18, escala: 0.22, brillo: 0.3 };
MATERIALES.a5_lava = { rampa: ['#5a0e02', '#981f04', '#d43f08', '#f27014', '#ffa83a', '#ffd88a'], ruido: 0.1, escala: 0.3, emite: true };
MATERIALES.a5_vacio = { rampa: ['#07050b', '#0d0915', '#140e20', '#1c142c', '#251b39', '#2f2347'], ruido: 0.18, escala: 0.25 };
MATERIALES.a5_runa_vacio = { rampa: ['#2a1450', '#4a2484', '#7340bc', '#a874ec'], ruido: 0.05, escala: 0.3, emite: true };
MATERIALES.a5_estrella = { rampa: ['#6a6488', '#a29cc4', '#e0dcf4'], ruido: 0.05, escala: 0.3, emite: true };
MATERIALES.a5_hierro = { rampa: ['#0c0c0d', '#161618', '#212124', '#2d2d31', '#3a3a3f', '#48484e'], ruido: 0.15, escala: 0.3, brillo: 0.4 };
MATERIALES.a5_hollin = { rampa: ['#050404', '#0b0908', '#120f0d', '#1a1613'], ruido: 0.35, escala: 0.5 };
MATERIALES.a5_herida = { rampa: ['#0d0304', '#1a0507', '#2a080b', '#3c0c10', '#501116', '#66171c'], ruido: 0.2, escala: 0.3, brillo: 0.6 };
MATERIALES.a5_sangre_viva = { rampa: ['#3a0306', '#62060b', '#8e0c12', '#bc1a1c'], ruido: 0.1, escala: 0.3, brillo: 0.8 };
MATERIALES.a5_obsidiana = { rampa: ['#030304', '#08080a', '#0f0f12', '#17171b', '#212126', '#2c2c33'], ruido: 0.08, escala: 0.2, brillo: 0.7 };
MATERIALES.a5_brasa_blanca = { rampa: ['#8a3a08', '#c86814', '#f0a032', '#ffd27a', '#fff2c8'], ruido: 0.08, escala: 0.3, emite: true };

const NUEVOS: PisoDef[] = [
  // las Llanuras de Ceniza: ceniza gris en dunas bajas que el viento peina, carbón, ascuas que todavía respiran y huesos quemados
  { id: 'a5_ceniza', nombre: ['Ceniza', 'Ash'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const duna = fr(x, y, 3, 240), peine = Math.sin((x * 0.6 + y) * 0.22 + duna * 6);
    if (v > 0 && det(x, y, v, 6) > 0.975) return ['a5_ascua', 0.4, 0];
    if (fr(x, y, 5, 241) < 0.2) return ['a5_carbon', 0.3, (fr(x, y, 12, 242) - 0.5) * 0.2];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.95) return ['a5_ceniza', 2, 0.2];
    return ['a5_ceniza', 0.4 + duna * 0.8 + peine * 0.25, (duna - 0.5) * 0.25 + peine * 0.05];
  } },
  // el Río de Lava: basalto negro enfriado en losas de seis lados, con la lava que brilla en las juntas y grietas
  { id: 'a5_basalto', nombre: ['Basalto', 'Basalt'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 8, 243), b = d2 - d1;
    const viva = hash3(id, 1, 244) > 0.45;
    if (b < 0.45) return viva ? ['a5_lava', 0, 0.1] : ['a5_carbon', -1, 0];
    if (b < 0.9 && viva) return ['a5_basalto', 0.4, 0.25];
    if (v > 0 && lejos(x, y) && det(x, y, v, 9) > 0.95) return ['a5_lava', 0.2, 0];
    return ['a5_basalto', 0.8 + Math.min(1.2, b * 0.25), (hash3(id, 3, 245) - 0.5) * 0.25];
  } },
  // el Abismo de los Susurros: piedra del vacío, violeta casi negra, con estrellas de lo que hay debajo y runas que susurran
  { id: 'a5_vacio_piedra', nombre: ['Piedra del vacío', 'Void stone'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 6, 246), b = d2 - d1;
    if (b < 0.4) return ['a5_vacio', -1.2, -0.15];
    if (v > 0 && det(x, y, v, 4) > 0.985) return ['a5_estrella', 0, 0];
    const runa = hash3(id, 7, 247) > 0.9 && v > 0;
    if (runa && b > 1.3 && Math.abs(Math.sin(x * 0.9) + Math.cos(y * 0.6)) < 0.25) return ['a5_runa_vacio', 0.1, 0.1];
    return ['a5_vacio', 0.8 + fr(x, y, 9, 248) * 0.8, (hash3(id, 2, 249) - 0.5) * 0.3];
  } },
  // la Fragua de Ozmaren: planchas de hierro remachadas, negras de hollín, con canaletas donde corre el metal al rojo
  { id: 'a5_hierro', nombre: ['Planchas de la fragua', 'Forge plates'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const P = 24, ix = Math.floor(x / P), iy = Math.floor(y / P), ux = x % P, uy = y % P;
    if (((x + 6) % 96) < 3) return ux < 0.8 || ux > 2.2 ? ['a5_hierro', 1.5, 0.1] : ['a5_lava', 0, 0.05];
    if (ux < 0.8 || uy < 0.8) return ['a5_hollin', -0.8, 0];
    if ((Math.abs(ux - 2.5) < 0.8 || Math.abs(ux - P + 2.5) < 0.8) && (Math.abs(uy - 2.5) < 0.8 || Math.abs(uy - P + 2.5) < 0.8)) return ['a5_hierro', 1.6, 0.25];
    if (fr(x, y, 4, 250) > 0.62) return ['a5_hollin', 0.3, 0];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.96) return ['a5_ascua', 0.2, 0];
    return ['a5_hierro', 0.7, (hash3(ix, iy, 251) - 0.5) * 0.25 + (fr(x, y, 10, 252) - 0.5) * 0.1];
  } },
  // la Herida, la Garganta: la piedra abierta como carne, roja y mojada, con la sangre viva que corre por las costuras
  { id: 'a5_herida', nombre: ['La Herida', 'The Wound'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const costura = Math.abs(fr(x, y, 3, 253) - 0.5), pliegue = Math.sin(fr(x, y, 5, 254) * 16);
    if (costura < 0.016) return ['a5_sangre_viva', 0.2, 0.05];
    if (costura < 0.04) return ['a5_obsidiana', 1.4, 0.1];
    if (v > 0 && lejos(x, y) && det(x, y, v, 7) > 0.95) return ['a5_sangre_viva', 0.4, 0];
    return ['a5_herida', 1 + pliegue * 0.8, pliegue * 0.1 + (fr(x, y, 12, 255) - 0.5) * 0.15];
  } },
  // el Corazón de la Brasa: obsidiana negra y pulida cruzada por las venas de la brasa, al blanco
  { id: 'a5_brasa_viva', nombre: ['Corazón de la brasa', 'Heart of the ember'], tema: 'infierno', variantes: 8, punto: (x, y, v) => {
    const vena = Math.abs(fr(x, y, 2, 256) - 0.5), fina = Math.abs(fr(x, y, 6, 257) - 0.5);
    if (vena < 0.012) return ['a5_brasa_blanca', 0, 0.1];
    if (vena < 0.03 || fina < 0.008) return ['a5_lava', 0, -0.05];
    if (vena < 0.06) return ['a5_obsidiana', 1.6, 0.2];
    if (v > 0 && det(x, y, v, 6) > 0.98) return ['a5_brasa_blanca', 0, 0];
    const [d1, d2] = voronoi(x, y, 7, 258);
    return ['a5_obsidiana', 0.6 + Math.min(1, (d2 - d1) * 0.2), (fr(x, y, 9, 259) - 0.5) * 0.2];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO5 = NUEVOS.map((d) => d.id);
