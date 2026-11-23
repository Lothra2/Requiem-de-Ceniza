import { PISOS, type PisoDef } from '../pisos';
import { MATERIALES } from '../materiales';
import { BALDOSA, hash3 } from '../render';
import { fr, voronoi, det, lejos } from './acto2_pisos';

// Pisos propios de las zonas del acto 1 (22 nov 2026): el Bosque de los Ahorcados pisaba el pasto del Páramo, la Guarida y la
// Cueva del Pastor la misma cueva, las dos partes de la Mina la misma tierra, la Nave y el Claustro de la abadía el mismo
// damero, y los Osarios y el Pozo de la Brasa las mismas lajas. Como los de los otros actos: 8 variantes, `PISO_DOBLE`.
void BALDOSA;

MATERIALES.a1_hoja = { rampa: ['#0b0805', '#150f08', '#21170c', '#2e2010', '#3c2a14', '#4b3519'], ruido: 0.4, escala: 0.45 };
MATERIALES.a1_musgo = { rampa: ['#08100a', '#0f1d0f', '#172b15', '#203b1b', '#2a4c22', '#355d2a'], ruido: 0.4, escala: 0.5 };
MATERIALES.a1_raiz = { rampa: ['#0c0806', '#18100a', '#25190f', '#332315'], ruido: 0.3, escala: 0.4 };
MATERIALES.a1_tierra = { rampa: ['#0c0a08', '#17130f', '#231d17', '#2f271f', '#3c3228'], ruido: 0.3, escala: 0.3 };
MATERIALES.a1_paja = { rampa: ['#1e170b', '#2c2211', '#3c2f18', '#4d3d20', '#5f4c29', '#715b32'], ruido: 0.4, escala: 0.6 };
MATERIALES.a1_lana = { rampa: ['#5c5850', '#7a756b', '#989287', '#b5afa3'], ruido: 0.4, escala: 0.6 };
MATERIALES.a1_hueso = { rampa: ['#3a342a', '#564e40', '#746a58', '#928770', '#ada288'], ruido: 0.2, escala: 0.4 };
MATERIALES.a1_sangre = { rampa: ['#150303', '#250606', '#370a09', '#4a0f0c'], ruido: 0.2, escala: 0.3, brillo: 0.4 };
MATERIALES.a1_roca_honda = { rampa: ['#05070a', '#0b0e13', '#12171d', '#1a2028', '#232b34', '#2d3641'], ruido: 0.2, escala: 0.25, brillo: 0.4 };
MATERIALES.a1_agua_mina = { rampa: ['#020406', '#05090d', '#0a1016', '#111a22', '#1b2731'], ruido: 0.08, escala: 0.3, brillo: 0.8 };
MATERIALES.a1_losa = { rampa: ['#141311', '#211f1c', '#2f2c28', '#3d3934', '#4c4741', '#5b554e'], ruido: 0.2, escala: 0.2 };
MATERIALES.a1_pasto = { rampa: ['#0d1208', '#16200d', '#203012', '#2b4018', '#37511f'], ruido: 0.45, escala: 0.55 };
MATERIALES.a1_quemado = { rampa: ['#050404', '#0c0a09', '#15110f', '#1f1a16', '#2a231e'], ruido: 0.25, escala: 0.3 };
MATERIALES.a1_brasa = { rampa: ['#4a1004', '#862006', '#c0400c', '#ec7418', '#ffb046'], ruido: 0.1, escala: 0.3, emite: true };

const NUEVOS: PisoDef[] = [
  // el Bosque de los Ahorcados: hojarasca podrida de roble, parda y negra, raíces que salen del suelo y musgo en la sombra
  { id: 'a1_hojarasca', nombre: ['Hojarasca podrida', 'Rotten leaves'], tema: 'paramo', variantes: 8, punto: (x, y, v) => {
    const [d1, d2, id] = voronoi(x, y, 16, 260), b = d2 - d1;
    if (Math.abs(fr(x, y, 3, 261) - 0.5) < 0.022) return ['a1_raiz', 1.8, 0];
    if (fr(x, y, 3, 262) < 0.4) return ['a1_musgo', 0.6 + b * 0.2, (fr(x, y, 10, 263) - 0.5) * 0.2];
    if (b < 0.8) return ['a1_tierra', -0.6, 0];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.95) return ['a1_hueso', 1, 0];
    return ['a1_hoja', 0.6 + Math.min(1, b * 0.3), (hash3(id, 3, 264) - 0.5) * 0.35];
  } },
  // la Cueva del Pastor: la paja que tendía para el rebaño sobre la tierra, mechones de lana y lo que dejaron las ovejas
  { id: 'a1_paja', nombre: ['Paja del redil', 'Fold straw'], tema: 'cueva', variantes: 8, punto: (x, y, v) => {
    const manto = fr(x, y, 3, 265), brizna = Math.abs(Math.sin((x * 0.9 - y * 0.4) * 0.6 + fr(x, y, 14, 266) * 9));
    if (manto > 0.36) return brizna < 0.2 ? ['a1_paja', 1.2, 0.15] : ['a1_paja', 0.6 + manto, (fr(x, y, 12, 267) - 0.5) * 0.25];
    if (v > 0 && det(x, y, v, 6) > 0.94) return ['a1_lana', 1.2, 0];
    if (v > 0 && det(x, y, v, 5) > 0.92) return ['a1_raiz', 0.4, -0.1];
    return ['a1_tierra', 1 + fr(x, y, 8, 268), 0.08 + (fr(x, y, 6, 269) - 0.5) * 0.2];
  } },
  // la Guarida del Hambre: tierra con huesos roídos, la sangre vieja arrastrada y los surcos de las uñas
  { id: 'a1_roida', nombre: ['Tierra de la guarida', 'Den floor'], tema: 'cueva', variantes: 8, punto: (x, y, v) => {
    if (fr(x, y, 3, 270) < 0.2) return ['a1_sangre', 0, (fr(x, y, 9, 271) - 0.5) * 0.2];
    const surco = Math.abs(Math.sin((x - y * 0.3) * 0.5)) < 0.06 && fr(x, y, 4, 272) > 0.68;
    if (surco) return ['a1_quemado', -1, 0];
    if (v > 0 && det(x, y, v, 5) > 0.93) return ['a1_hueso', 1.4, 0.05];
    const n = fr(x, y, 8, 273);
    return ['a1_tierra', 0.6 + n * 1.4, (n - 0.5) * 0.25];
  } },
  // la Mina, el Pozo Profundo: roca honda, gris azulada y mojada, con el agua que rezuma en hilos y se junta en charcos
  { id: 'a1_roca_honda', nombre: ['Roca del pozo', 'Deep shaft rock'], tema: 'mina', variantes: 8, punto: (x, y, v) => {
    if (fr(x, y, 3, 274) < 0.22) return ['a1_agua_mina', 0, 0.05];
    if (Math.abs(fr(x, y, 5, 275) - 0.5) < 0.012) return ['a1_agua_mina', 0.2, 0.1];
    const [d1, d2] = voronoi(x, y, 9, 276);
    if (d2 - d1 < 0.4) return ['a1_quemado', -1, 0];
    if (v > 0 && lejos(x, y) && det(x, y, v, 8) > 0.95) return ['a1_roca_honda', 2, 0.2];
    return ['a1_roca_honda', 0.8 + fr(x, y, 9, 277), (fr(x, y, 6, 278) - 0.5) * 0.25];
  } },
  // el Claustro Profanado: el patio del claustro, losas viejas con el pasto que se mete por las juntas y sangre de la profanación
  { id: 'a1_claustro', nombre: ['Patio del claustro', 'Cloister yard'], tema: 'abadia', variantes: 8, punto: (x, y, v) => {
    const P = 18, ix = Math.floor(x / P), iy = Math.floor((y + (ix % 2) * 9) / P), ux = x % P, uy = (y + (ix % 2) * 9) % P;
    const pasto = fr(x, y, 3, 279);
    if (pasto > 0.6) return ['a1_pasto', 0.5 + (pasto - 0.6) * 2, (fr(x, y, 12, 280) - 0.5) * 0.25];
    if (ux < 1 || uy < 1) return pasto > 0.38 ? ['a1_pasto', 0.2, 0] : ['a1_tierra', -0.6, 0];
    if (v > 0 && fr(x, y, 5, 281) < 0.12) return ['a1_sangre', 0, 0];
    return ['a1_losa', 0.8, (hash3(ix, iy, 282) - 0.5) * 0.3 + (fr(x, y, 9, 283) - 0.5) * 0.1];
  } },
  // el Pozo de la Brasa: donde cayó la brasa. Piedra chamuscada con las grietas que irradian y todavía brillan, y ceniza
  { id: 'a1_brasa_caida', nombre: ['Piedra chamuscada', 'Scorched stone'], tema: 'catacumbas', variantes: 8, punto: (x, y, v) => {
    const ang = Math.atan2((y % 96) - 48, (x % 96) - 48), rad = Math.hypot((x % 96) - 48, (y % 96) - 48);
    const rayo = Math.abs(Math.sin(ang * 7 + fr(x, y, 2, 284) * 3)) < 0.05 && rad > 6;
    if (rayo && fr(x, y, 4, 285) > 0.4) return ['a1_brasa', 0, 0.05];
    if (rayo) return ['a1_quemado', -1, 0];
    const [d1, d2] = voronoi(x, y, 7, 286);
    if (d2 - d1 < 0.4) return ['a1_quemado', -0.8, 0];
    if (v > 0 && det(x, y, v, 6) > 0.975) return ['a1_brasa', 0, 0];
    return [fr(x, y, 3, 287) > 0.58 ? 'a1_quemado' : 'a1_losa', 0.7, (fr(x, y, 9, 288) - 0.5) * 0.25 - 0.1];
  } },
];
for (const d of NUEVOS) if (!PISOS.some((q) => q.id === d.id)) PISOS.push(d);
export const PISOS_ACTO1 = NUEVOS.map((d) => d.id);
