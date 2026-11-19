// Dibujos de pixel chicos (un cuervo, una hoja seca) hechos lienzo UNA vez: se pegan con un drawImage en vez de un fillRect
// por punto (el cuervo eran 40 llamadas, y con una bandada en el cementerio, 860 por cuadro). Sale punto por punto lo mismo
// cuando el lienzo va a una escala entera y sin corrimiento fraccionario (`escalaEntera`); si no, se dibuja como antes.
const hechos = new Map<string, HTMLCanvasElement>();
/** El mapita `filas` (un carácter por punto, '.' vacío) con el color de cada carácter, espejado si `espejo`. */
export function mapita(clave: string, filas: string[], color: (c: string, x: number, y: number) => string | null, espejo = false): HTMLCanvasElement {
  const k = clave + (espejo ? '~' : '');
  let cv = hechos.get(k); if (cv) return cv;
  const w = Math.max(...filas.map((f) => f.length)), h = filas.length;
  cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d')!;
  for (let y = 0; y < h; y++) for (let x = 0; x < filas[y].length; x++) {
    const c = filas[y][x]; if (c === '.') continue; const col = color(c, x, y); if (!col) continue;
    g.fillStyle = col; g.fillRect(espejo ? w - 1 - x : x, y, 1, 1);
  }
  hechos.set(k, cv); return cv;
}
/** ¿El lienzo pinta a puntos enteros del aparato? (escala entera, sin giro ni corrimiento fraccionario) */
export function escalaEntera(c: CanvasRenderingContext2D): boolean {
  if ((window as any).__sinMapitas) return false;
  const t = c.getTransform(), e = (v: number) => Math.abs(v - Math.round(v)) < 1e-6;
  return !t.b && !t.c && t.a >= 1 && e(t.a) && e(t.d) && e(t.e) && e(t.f);
}
