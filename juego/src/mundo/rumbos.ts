// Hacia dónde lleva cada salida (bajar, subir, salir a la superficie, otra región, guarida, campamento, casa), en qué
// nivel de la mazmorra cae. Lo usan el mapa, el minimapa y el umbral del mundo.
// Rick (19 nov 2026): "en el mapa quiero identificar bien los portales que suben y los que bajan". Antes el signo salía
// solo del tipo del destino: en una mazmorra la escalera de subir y la de bajar eran la misma boca morada.
import { ZONAS } from './actos';
import './actos67';

export type Rumbo = 'bajar' | 'subir' | 'superficie' | 'region' | 'guarida' | 'campamento' | 'casa';

/** Bajo tierra de verdad: una mazmorra que no se une a otra zona por un costado (n, s, e, o). Las Islas de Oro son de
 * tipo mazmorra pero se cruzan de isla en isla como un mundo abierto: cuentan como superficie. */
const COSTADO = /^[nseo]$/;
const honda = (id: string) => { const d = ZONAS[id]; return d?.tipo === 'mazmorra' && !d.salidas.some((s) => COSTADO.test(s.lado)); };
/** El nivel de una mazmorra contando desde la superficie (1 la primera), 0 si no es mazmorra. */
const prof = new Map<string, number>();
export function nivelMazmorra(id: string): number {
  const c = prof.get(id); if (c !== undefined) return c;
  const d = ZONAS[id]; let n = 0;
  if (honda(id)) {
    prof.set(id, 1); // (corta un ciclo, si lo hubiera)
    const up = d.salidas.find((s) => s.lado === 'arriba');
    n = up && honda(up.destino) ? nivelMazmorra(up.destino) + 1 : 1;
  }
  prof.set(id, n); return n;
}

/** Hacia dónde lleva la salida de `desde` a `destino`. */
export function rumboSalida(desde: string, destino: string): Rumbo {
  const a = ZONAS[desde], b = ZONAS[destino];
  if (b?.tipo === 'pueblo') return 'campamento';
  if (b?.casa && !a?.casa) return 'casa';
  const lado = a?.salidas.find((s) => s.destino === destino)?.lado ?? '';
  if (COSTADO.test(lado)) return 'region';
  if (honda(destino) && (lado === 'abajo' || nivelMazmorra(destino) > nivelMazmorra(desde))) return b.jefe ? 'guarida' : 'bajar';
  if (honda(desde)) return honda(destino) ? 'subir' : 'superficie';
  return 'region';
}

/** Si el destino es un nivel de una mazmorra de varios (tiene uno arriba o uno abajo que también es mazmorra). */
export function variosNiveles(destino: string): boolean {
  const n = nivelMazmorra(destino), d = ZONAS[destino];
  return !!n && !d?.casa && (n > 1 || !!d?.salidas.some((s) => s.lado === 'abajo' && honda(s.destino)));
}
/** Lo que se lee del destino: "Catacumbas, nivel 3" en las mazmorras de varios niveles. */
export function nombreDestino(destino: string, nombre: [string, string], idi: number): string {
  return variosNiveles(destino) ? `${nombre[idi]}, ${idi ? 'level' : 'nivel'} ${nivelMazmorra(destino)}` : nombre[idi];
}
/** El verbo de la salida, para el letrero del mundo y la pista del mapa. */
export function verboRumbo(r: Rumbo, idi: number): string {
  const V: Record<Rumbo, [string, string]> = { bajar: ['Bajar a', 'Down to'], guarida: ['Bajar a', 'Down to'], subir: ['Subir a', 'Up to'], superficie: ['Salir a', 'Out to'], region: ['Ir a', 'To'], campamento: ['Volver a', 'Back to'], casa: ['Entrar a', 'Into'] };
  return V[r][idi];
}
/** Color de cada rumbo (el del signo del mapa, el letrero y la luz del umbral). */
export const COLOR_RUMBO: Record<Rumbo, [number, number, number]> = {
  bajar: [255, 110, 52], guarida: [255, 60, 70], subir: [110, 180, 255], superficie: [200, 236, 255], region: [140, 220, 110], campamento: [255, 196, 110], casa: [224, 180, 128],
};

/** El color del umbral en el mundo: por el rumbo (bajar en brasa, subir en azul, superficie en cielo), y las de siempre
 * para las otras regiones (rojo en las tierras de fuego, luna fría) y el campamento (oro). `__sinRumbos` vuelve a lo de antes. */
export function colorUmbral(dest: { tipo?: string; tema?: string } | undefined, r?: Rumbo): [number, number, number] {
  const fuego = /infierno|lava|fragua|ceniza/.test(dest?.tema ?? '');
  if (dest?.tipo === 'pueblo') return [255, 196, 110];
  if (r && r !== 'region' && r !== 'campamento' && !(globalThis as any).__sinRumbos) return COLOR_RUMBO[r];
  return fuego ? [255, 96, 48] : dest?.tipo === 'mazmorra' ? [96, 220, 204] : [170, 198, 255];
}
