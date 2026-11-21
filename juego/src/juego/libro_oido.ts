// Lo que el héroe oyó y que el Libro de Odrán anota (la voz de la Marca, la llegada a un lugar, lo que dice un jefe, lo que
// cuenta alguien, un rincón apartado). Sin dependencias: lo llaman `msg` (juego/mundo.ts) y los diálogos (juego/historia.ts)
// con el mismo arreglo de textos que muestran, y juego/libro.ts llena el mapa al cargarse (por identidad del arreglo).
export const OIDO = new Map<object, string[]>();
/** Si este texto es una pieza del libro, queda anotada en el héroe (campo opcional `libro.o`). */
export function oirLibro(d: unknown, txt: unknown): void {
  if (!d || !txt || typeof txt !== 'object') return;
  const ids = OIDO.get(txt as object); if (!ids) return;
  const L = ((d as { libro?: { o?: string[] } }).libro ??= {}); const o = (L.o ??= []);
  for (const id of ids) if (!o.includes(id)) o.push(id);
}
