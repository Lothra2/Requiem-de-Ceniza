import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 3 (22 nov 2026): la selva y el manglar, las dos cuevas, la ciudad hundida y el templo
// pisaban la misma selva, la misma cueva o la misma arenisca con musgo. Como los de los actos 2, 6 y 7.
void BALDOSA;

MATERIALES.a3_hoja = { rampa: ['#0d0f05', '#1a1d08', '#2b2e0c', '#3f4011', '#565416', '#6d681d', '#857d27'], ruido: 0.35, escala: 0.4 };
MATERIALES.a3_hoja_roja = { rampa: ['#170804', '#2a0f07', '#40170a', '#58200e', '#702a13'], ruido: 0.35, escala: 0.4 };
MATERIALES.a3_tierra_negra = { rampa: ['#0a0806', '#14100b', '#1f1810', '#2a2116', '#362b1c'], ruido: 0.3, escala: 0.3 };
MATERIALES.a3_lodo = { rampa: ['#07080a', '#0f1110', '#181a16', '#22251d', '#2d3124', '#3a3e2c'], ruido: 0.2, escala: 0.3, brillo: 0.4 };
MATERIALES.a3_raiz = { rampa: ['#100a06', '#1e140b', '#2e2011', '#3f2c18', '#523a20'], ruido: 0.3, escala: 0.4 };
MATERIALES.a3_agua_cueva = { rampa: ['#020608', '#050d12', '#0a161d', '#11222b', '#1b323d', '#2a4652'], ruido: 0.1, escala: 0.3, brillo: 0.6 };
MATERIALES.a3_roca_mojada = { rampa: ['#0b0c0c', '#151717', '#202322', '#2c302e', '#393e3b', '#474d49'], ruido: 0.28, escala: 0.22, brillo: 0.3 };
MATERIALES.a3_seda = { rampa: ['#2d2c2e', '#4a484b', '#6a676b', '#8b888c', '#aaa7ab', '#c6c3c6'], ruido: 0.4, escala: 0.5 };
MATERIALES.a3_jade = { rampa: ['#041009', '#082014', '#0e3120', '#16442d', '#20583b', '#2c6d4a'], ruido: 0.15, escala: 0.25, brillo: 0.5 };
MATERIALES.a3_oro_opaco = { rampa: ['#241805', '#3e2a09', '#5a3e0f', '#795616', '#966d21'], ruido: 0.15, escala: 0.3, brillo: 0.4 };
MATERIALES.a3_piedra_templo = { rampa: ['#141108', '#221d0f', '#322b17', '#443b21', '#574c2c', '#6a5d38', '#7d6e45'], ruido: 0.2, escala: 0.18 };
MATERIALES.a3_musgo = { rampa: ['#071006', '#0e1d0b', '#162c10', '#203d16', '#2b4f1c'], ruido: 0.4, escala: 0.4 };
MATERIALES.a3_carne = { rampa: ['#140405', '#250809', '#380d0e', '#4c1414', '#621c1a', '#79261f'], ruido: 0.25, escala: 0.3, brillo: 0.5 };
MATERIALES.a3_agua_negra = { rampa: ['#030606', '#060c0c', '#0b1414', '#121e1d', '#1b2b29', '#283b38', '#3a4f4b'], ruido: 0.08, escala: 0.3, brillo: 0.8 };
MATERIALES.a3_reflejo = { rampa: ['#2e3f3d', '#46605c', '#62817b', '#86a39c', '#aec4bc'], ruido: 0.1, escala: 0.4, brillo: 0.9 };
MATERIALES.a3_lenteja = { rampa: ['#0c1a08', '#16300d', '#224613', '#2f5c1a', '#3d7222'], ruido: 0.4, escala: 0.6 };
MATERIALES.a3_vena = { rampa: ['#1a0606', '#320a0a', '#4e100e', '#6b1812'], ruido: 0.2, escala: 0.3 };

const NUEVOS: PisoDef[] = [
  // la Selva de Yhuantl: hojarasca espesa, hojas de dos verdes y alguna roja, raíces que cruzan y tierra negra entre ellas
  { id: 'a3_hojarasca', nombre: ['Hojarasca', 'Leaf litter'], tema: 'selva', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 14, 150), b = d2 - d1;
    const raiz = Math.abs(fr(x, y, 3, 151) - 0.5) < 0.025;
    if (raiz) return ['a3_raiz', 1.8, (fr(x, y, 12, 152) - 0.5) * 0.2];
    if (b < 0.9) return ['a3_tierra_negra', -0.8, 0];
    const roja = hash3(id, 3, 4) > 0.9;
    if (v > 0 && lejos(x, y) && det(x, y, v, 7) > 0.93) return ['a3_raiz', 1, 0.05];
    return [roja ? 'a3_hoja_roja' : 'a3_hoja', 0.6 + Math.min(1.2, b * 0.3), (hash3(id, 2, 7) - 0.5) * 0.35 + (fr(x, y, 4, 153) - 0.5) * 0.2];
  } },
  // el Manglar Negro: lodo negro brillante con charcos, raíces aéreas que se clavan y hojas podridas
  { id: 'a3_lodo', nombre: ['Lodo del manglar', 'Mangrove mud'], tema: 'selva', variantes: 8, punto: (x, y, v) => {
    const charco = fr(x, y, 3, 154);
    if (charco < 0.3) return ['a3_agua_cueva', 0, (fr(x, y, 10, 155) - 0.5) * 0.2];
    const raiz = Math.abs(fr(x, y, 4, 156) - 0.5) < 0.02 || Math.abs(fr(x, y, 6, 157) - 0.5) < 0.015;
    if (raiz) return ['a3_raiz', 1.6, -0.05];
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.9) return ['a3_hoja', 0.4, -0.15];
    const n = fr(x, y, 9, 158);
    return ['a3_lodo', n * 1.2, (n - 0.5) * 0.2 + (charco < 0.36 ? 0.08 : 0)];
  } },
  // las Cavernas Inundadas: roca mojada que brilla y el agua quieta que cubre la mitad
  { id: 'a3_cueva_agua', nombre: ['Cueva inundada', 'Flooded cave floor'], tema: 'cueva', variantes: 8, punto: (x, y, v) => {
    const agua = fr(x, y, 3, 159);
    if (agua < 0.46) { const ola = Math.sin((x * 0.4 + y) * 0.25 + fr(x, y, 6, 160) * 6); return ['a3_agua_cueva', ola * 0.2, ola * 0.05 + (0.46 - agua) * -0.3]; }
    const n = fr(x, y, 7, 161), g = fr(x, y, 16, 162);
    if (v > 0 && lejos(x, y) && det(x, y, v, 5) > 0.9) return ['a3_roca_mojada', 2.4, 0.1];
    return ['a3_roca_mojada', n * 2.5 + g, (g - 0.5) * 0.25 + (agua < 0.52 ? 0.08 : 0)];
  } },
  // el Nido de la Araña: la roca cubierta de mantos de seda, hilos que cruzan y huesos envueltos
  { id: 'a3_telarana', nombre: ['Piso de seda', 'Silk floor'], tema: 'cueva', variantes: 8, punto: (x, y, v) => {
    const manto = fr(x, y, 3, 163);
    const hilo = fr(x, y, 2, 176) > 0.55 && (Math.abs(fr(x, y, 5, 177) - 0.5) < 0.012 || Math.abs(fr(x, y, 7, 178) - 0.5) < 0.01);
    if (manto > 0.5) return ['a3_seda', 0.6 + (manto - 0.5) * 2, (fr(x, y, 10, 164) - 0.5) * 0.25 - 0.05];
    if (hilo) return ['a3_seda', 0.4, 0.15];
    if (v > 0 && lejos(x, y) && det(x, y, v, 6) > 0.9) return ['hueso', 1.2, 0];
    const n = fr(x, y, 7, 165);
    return ['a3_roca_mojada', n * 2, (n - 0.5) * 0.25 - 0.08];
  } },
  // el Palacio Ahogado: mosaico de jade y oro bajo una película de agua, teselas que faltan
  { id: 'a3_mosaico', nombre: ['Mosaico de jade', 'Jade mosaic'], tema: 'templo_selva', variantes: 8, punto: (x, y, v) => {
    const t = 5, ix = Math.floor(x / t), iy = Math.floor(y / t), ux = x % t, uy = y % t;
    if (ux < 0.7 || uy < 0.7) return ['a3_tierra_negra', -0.3, 0];
    const r = Math.hypot((x % 80) - 40, (y % 80) - 40), banda = Math.abs(r - 30) < 3 || Math.abs((x % 80) - 40) + Math.abs((y % 80) - 40) < 8;
    if (hash3(ix, iy, 166) > 0.95 || (v > 0 && lejos(x, y) && det(x, y, v, 10) > 0.9)) return ['a3_lodo', -0.6, 0];
    if (fr(x, y, 3, 167) < 0.24) return ['a3_agua_cueva', 0, 0.05];
    return [banda ? 'a3_oro_opaco' : 'a3_jade', 0.8, (hash3(ix, iy, 168) - 0.5) * 0.3];
  } },
  // los Escalones Hundidos: peldaños de piedra del templo con musgo en el canto, bajando a lo largo de y
  { id: 'a3_escalones', nombre: ['Escalones del templo', 'Temple steps'], tema: 'templo_selva', variantes: 8, punto: (x, y, v) => {
    const u = y % 20, bloque = Math.floor(x / 30) * 5 + Math.floor(y / 20), corre = (Math.floor(y / 20) % 2) * 15;
    if (u < 1.5) return ['a3_musgo', -1.2, -0.05];
    if (u < 3.2) return [fr(x, y, 8, 169) > 0.5 ? 'a3_musgo' : 'a3_piedra_templo', 1.8, 0.12];
    if ((x + corre) % 30 < 0.9) return ['a3_tierra_negra', -0.5, 0];
    if (fr(x, y, 4, 170) > 0.7) return ['a3_musgo', 0.8, 0];
    return ['a3_piedra_templo', 1 + (u - 3) * 0.02, (hash3(bloque, 2, 2) - 0.5) * 0.2 + (v > 0 && lejos(x, y) && det(x, y, v, 12) > 0.9 ? -0.15 : 0)];
  } },
  // el Vientre de la Madre: carne viva, húmeda, atravesada de venas y raíces, con pliegues
  { id: 'a3_carne', nombre: ['Carne de la Madre', 'The Mother\'s flesh'], tema: 'templo_selva', variantes: 8, punto: (x, y) => {
    const pliegue = fr(x, y, 4, 171), vena = Math.abs(fr(x, y, 5, 172) - 0.5) < 0.022 || Math.abs(fr(x, y, 9, 173) - 0.5) < 0.015;
    if (vena) return ['a3_vena', 1.6, 0.05];
    const raiz = Math.abs(fr(x, y, 3, 174) - 0.5) < 0.012;
    if (raiz) return ['a3_raiz', 2, 0];
    const b = Math.sin(pliegue * 18);
    return ['a3_carne', b * 1.2 + 1, b * 0.12 + (fr(x, y, 12, 175) - 0.5) * 0.15];
  } },
  // el Manglar Negro, el agua: canales y charcas negras que reflejan el cielo gris en vetas largas, anillos donde algo sube,
  // lenteja de agua que se junta en las orillas y alguna hoja que flota
  { id: 'a3_agua_negra', nombre: ['Agua negra', 'Black water'], tema: 'selva', variantes: 8, punto: (x, y, v) => {
    const ondas = fr(x, y, 9, 180);
    if (fr(x, y, 4, 181) > 0.8) return ['a3_lenteja', 0.5, (fr(x, y, 14, 182) - 0.5) * 0.3];
    const cx = (x % 64) - 32 + (hash3(Math.floor(x / 64), Math.floor(y / 64), 183) - 0.5) * 30, cy = (y % 64) - 32, rr = Math.hypot(cx, cy * 1.8);
    if (v > 0 && hash3(Math.floor(x / 64), Math.floor(y / 64), 184 + v) > 0.6 && (Math.abs(rr - 9) < 0.7 || Math.abs(rr - 15) < 0.6)) return ['a3_reflejo', 0, -0.1];
    // el cielo gris que se refleja: manchas anchas más claras, con las ondas a lo ancho de la pantalla (x + y fijo)
    const cielo = fr(x, y, 2, 188);
    if (cielo > 0.6 && Math.abs(Math.sin((x + y) * 0.21 + fr(x, y, 3, 189) * 3)) < 0.09) return ['a3_reflejo', 0, -0.2 + (cielo - 0.6) * 0.8];
    if (cielo > 0.56) return ['a3_agua_negra', 0, 0.12 + (cielo - 0.56) * 1.4];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.97) return ['a3_hoja_roja', 0.3, -0.1];
    return ['a3_agua_negra', 0, (ondas - 0.5) * 0.18];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO3 = NUEVOS.map((d) => d.id);
