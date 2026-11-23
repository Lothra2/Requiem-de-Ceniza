import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 4 (22 nov 2026): los Picos y el Paso del Glaciar pisaban la misma nieve con placas de
// hielo, las dos minas la misma tierra, la Grieta, las Cuevas y el Trono el mismo hielo, y la Cripta del Rey Bárbaro las lajas
// de las criptas del acto 1. Como los de los otros actos: 8 variantes, cada dos baldosas (`PISO_DOBLE`), en el catálogo.
void BALDOSA;

MATERIALES.a4_nieve = { rampa: ['#4a525e', '#646d7a', '#7f8895', '#9aa3ae', '#b5bdc6', '#ccd3da', '#dfe4e9'], ruido: 0.25, escala: 0.4 };
MATERIALES.a4_pizarra = { rampa: ['#0b0c0f', '#15171c', '#1f2229', '#2a2e37', '#363b45', '#434955'], ruido: 0.2, escala: 0.2 };
MATERIALES.a4_liquen = { rampa: ['#1e1f12', '#2e2f19', '#414121', '#55532a'], ruido: 0.4, escala: 0.5 };
MATERIALES.a4_hielo = { rampa: ['#071a2c', '#0c2740', '#133656', '#1c486d', '#285c86', '#3a739e', '#5390b8'], ruido: 0.12, escala: 0.25, brillo: 0.6 };
MATERIALES.a4_hielo_hondo = { rampa: ['#02060d', '#040c18', '#081424', '#0d1d33', '#132942'], ruido: 0.1, escala: 0.3, brillo: 0.4 };
MATERIALES.a4_hielo_claro = { rampa: ['#5d84a3', '#79a0bd', '#97bbd3', '#b6d3e5', '#d4e8f3'], ruido: 0.15, escala: 0.4, brillo: 0.7 };
MATERIALES.a4_tierra_mina = { rampa: ['#0d0a07', '#18130d', '#241c13', '#30261a', '#3d3021', '#4b3b29'], ruido: 0.3, escala: 0.3 };
MATERIALES.a4_tabla = { rampa: ['#140d07', '#21160c', '#2f2012', '#3e2b18', '#4e371f', '#5f4427'], ruido: 0.3, escala: 0.5 };
MATERIALES.a4_charco = { rampa: ['#05080a', '#0a1015', '#111a21', '#1b262f', '#29363f'], ruido: 0.08, escala: 0.3, brillo: 0.7 };
MATERIALES.a4_roca_veta = { rampa: ['#0e0d0c', '#191715', '#25221e', '#322d28', '#3f3933', '#4d463e'], ruido: 0.25, escala: 0.2 };
MATERIALES.a4_oro = { rampa: ['#3a2a08', '#5e440d', '#866314', '#b0861f', '#d4aa35', '#f0cd5a'], ruido: 0.1, escala: 0.3, brillo: 0.8 };
MATERIALES.a4_mena_roja = { rampa: ['#2a0705', '#470d08', '#66150c', '#882012'], ruido: 0.15, escala: 0.3, brillo: 0.5 };
MATERIALES.a4_losa_tumulo = { rampa: ['#121110', '#1d1b19', '#2a2724', '#37332f', '#45403b', '#544e48'], ruido: 0.22, escala: 0.18 };
MATERIALES.a4_escarcha = { rampa: ['#6d7a86', '#8996a2', '#a8b4bf', '#c6d0d8', '#e0e7ec'], ruido: 0.35, escala: 0.6 };
MATERIALES.a4_runa = { rampa: ['#0c1820', '#163040', '#22506a', '#3a7a9a'], ruido: 0.1, escala: 0.3 };
MATERIALES.a4_roca_fria = { rampa: ['#0a0c0e', '#131719', '#1d2225', '#282e32', '#343b40', '#41494f'], ruido: 0.25, escala: 0.22 };
MATERIALES.a4_tabla_helada = { rampa: ['#0f0d0c', '#1a1715', '#26221f', '#332e2a', '#413b36', '#504943'], ruido: 0.3, escala: 0.5 };

const NUEVOS: PisoDef[] = [
  // los Picos de Hrimgard: nieve que el viento barre en lenguas y deja ver la pizarra negra en costillas, con liquen
  { id: 'a4_nieve_pizarra', nombre: ['Nieve sobre pizarra', 'Snow over slate'], tema: 'nieve', variantes: 8, punto: (x, y, v) => {
    const viento = fr(x, y, 3, 200) + Math.sin((x - y * 0.4) * 0.08) * 0.08, costilla = Math.abs(Math.sin((x * 0.3 + y) * 0.07 + fr(x, y, 2, 201) * 4));
    if (viento < 0.38 || (viento < 0.46 && costilla < 0.25)) {
      if (fr(x, y, 10, 202) > 0.78) return ['a4_liquen', 0.6, 0];
      return ['a4_pizarra', 1.4 + costilla, (fr(x, y, 8, 203) - 0.5) * 0.2];
    }
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.93) return ['a4_pizarra', 2, 0.1];
    return ['a4_nieve', 0.5 + (viento - 0.46) * 2, (fr(x, y, 9, 204) - 0.5) * 0.12 + Math.min(0.15, (viento - 0.46) * 0.5)];
  } },
  // el Paso del Glaciar: hielo azul del glaciar con grietas hondas, burbujas presas y lenguas de nieve que el viento arrastra
  { id: 'a4_hielo_glaciar', nombre: ['Hielo del glaciar', 'Glacier ice'], tema: 'nieve', variantes: 8, punto: (x, y, v) => {
    const [d1, d2] = voronoi(x, y, 6, 205), b = d2 - d1;
    if (b < 0.35) return ['a4_hielo_hondo', -1.5, 0];
    if (b < 0.9) return ['a4_hielo_claro', 1.2, 0.1];
    if (fr(x, y, 3, 206) > 0.66) return ['a4_nieve', 0.6, 0.05];
    if (v > 0 && lejos(x, y) && det(x, y, v, 9) > 0.9) return ['a4_hielo_claro', 0.5, 0.25];
    const n = fr(x, y, 5, 207);
    return ['a4_hielo', 0.3 + n * 0.6, (n - 0.5) * 0.3];
  } },
  // los Socavones: tierra pisada y negra, tablones tendidos sobre el barro y charcos donde gotea
  { id: 'a4_socavon', nombre: ['Tierra del socavón', 'Tunnel floor'], tema: 'mina', variantes: 8, punto: (x, y, v) => {
    const fila = Math.floor(y / 12), tab = (x + fila * 7) % 46;
    if (fr(x, y, 2, 208) > 0.6 && (y % 12) > 0.8) return tab < 0.9 ? ['a4_tierra_mina', -0.6, 0] : ['a4_tabla', 1.2 + ((x * 0.6) % 1) * 0.3, (hash3(Math.floor((x + fila * 7) / 46), fila, 209) - 0.5) * 0.25];
    if (fr(x, y, 4, 210) < 0.34) return ['a4_charco', 0, 0.05 + (fr(x, y, 12, 231) - 0.5) * 0.15];
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.9) return ['a4_roca_veta', 1.6, 0];
    const n = fr(x, y, 8, 211);
    return ['a4_tierra_mina', n * 1.4, (n - 0.5) * 0.2];
  } },
  // la Veta Madre: la roca del piso cruzada de vetas de oro y de mena roja que brillan, y pepitas sueltas
  { id: 'a4_veta_madre', nombre: ['Roca de la veta', 'Lode rock'], tema: 'mina', variantes: 8, punto: (x, y, v) => {
    const veta = Math.abs(fr(x, y, 3, 212) - 0.5), roja = Math.abs(fr(x, y, 4, 213) - 0.5);
    if (veta < 0.015) return ['a4_oro', 1.2, -0.02];
    if (veta < 0.034) return ['a4_roca_veta', 1.8, 0.12];
    if (roja < 0.01) return ['a4_mena_roja', 1.2, 0];
    if (v > 0 && det(x, y, v, 5) > 0.97) return ['a4_oro', 1.6, 0];
    const [d1, d2] = voronoi(x, y, 9, 214);
    if (d2 - d1 < 0.4) return ['a4_tierra_mina', -0.8, 0];
    return ['a4_roca_veta', 0.8 + fr(x, y, 10, 215), (fr(x, y, 6, 216) - 0.5) * 0.2];
  } },
  // la Cripta del Rey Bárbaro: losas toscas de pizarra de un túmulo, la escarcha en las juntas y alguna losa con runas
  { id: 'a4_losas_tumulo', nombre: ['Losas del túmulo', 'Barrow slabs'], tema: 'cripta', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 7, 217), b = d2 - d1;
    if (b < 0.5) return [fr(x, y, 9, 218) > 0.5 ? 'a4_escarcha' : 'a4_pizarra', -0.6, 0];
    const runa = hash3(id, 5, 219) > 0.92 && v > 0;
    if (runa && Math.abs(Math.sin(x * 0.7) * Math.cos(y * 0.5)) > 0.85 && b > 1.4) return ['a4_runa', 0.2, 0.1];
    return ['a4_losa_tumulo', 0.8 + Math.min(1, b * 0.2), (hash3(id, 2, 220) - 0.5) * 0.3];
  } },
  // la Grieta Glaciar: hielo hondo, azul casi negro, con las grietas claras y el hielo viejo en capas
  { id: 'a4_grieta_hielo', nombre: ['Hielo de la grieta', 'Crevasse ice'], tema: 'hielo', variantes: 8, punto: (x, y, v) => {
    const capa = Math.sin((x * 0.2 + y) * 0.12 + fr(x, y, 3, 221) * 5);
    const grieta = Math.abs(fr(x, y, 4, 222) - 0.5) < 0.016 || Math.abs(fr(x, y, 7, 223) - 0.5) < 0.01;
    if (grieta) return ['a4_hielo_claro', 1, 0.2];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.93) return ['a4_escarcha', 0.6, 0];
    return [capa > 0.6 ? 'a4_hielo' : 'a4_hielo_hondo', 0.4 + capa * 0.4, capa * 0.12];
  } },
  // las Cuevas del Aliento Helado: roca fría y oscura cubierta de escarcha blanca en plumas, donde el aliento se congela
  { id: 'a4_escarcha_roca', nombre: ['Roca escarchada', 'Rimed rock'], tema: 'hielo', variantes: 8, punto: (x, y, v) => {
    const manto = fr(x, y, 3, 224), pluma = Math.abs(Math.sin((x - y) * 0.35 + fr(x, y, 9, 225) * 6));
    if (manto > 0.52 || (manto > 0.44 && pluma < 0.3)) return ['a4_escarcha', 0.4 + pluma * 0.8, (fr(x, y, 12, 226) - 0.5) * 0.2];
    if (v > 0 && lejos(x, y) && det(x, y, v, 7) > 0.92) return ['a4_hielo_claro', 1, 0.1];
    const n = fr(x, y, 8, 227);
    return ['a4_roca_fria', 0.8 + n * 1.4, (n - 0.5) * 0.25];
  } },
  // el Trono de Hjaldur: tablones del gran salón, negros y helados, con la escarcha en las juntas y el hielo que los cubre
  { id: 'a4_tablas_heladas', nombre: ['Tablas heladas', 'Frozen boards'], tema: 'hielo', variantes: 8, punto: (x, y, v) => {
    const fila = Math.floor(x / 10), u = x % 10, junta = (y + fila * 17) % 52;
    if (u < 0.9) return [fr(x, y, 6, 230) > 0.6 ? 'a4_escarcha' : 'a4_roca_fria', -0.4, -0.2];
    if (junta < 0.8) return ['a4_tierra_mina', -0.6, 0];
    if (fr(x, y, 3, 228) > 0.7) return ['a4_hielo', 0.2, -0.05];
    if (v > 0 && lejos(x, y) && det(x, y, v, 9) > 0.97) return ['a4_escarcha', 0.4, -0.1];
    return ['a4_tabla_helada', 1 + ((y * 0.3) % 1) * 0.4, (hash3(fila, Math.floor((y + fila * 17) / 52), 229) - 0.5) * 0.3];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO4 = NUEVOS.map((d) => d.id);
