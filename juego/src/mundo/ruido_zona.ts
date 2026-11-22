// Ruido de valor determinista por baldosa para las formas del piso afuera (no toca el azar de la zona).
export const hz = (x: number, y: number, s: number) => { const v = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return v - Math.floor(v); };
export const suave = (x: number, y: number, e: number, s: number) => {
  const fx = x / e, fy = y / e, ix = Math.floor(fx), iy = Math.floor(fy), u = fx - ix, v = fy - iy, k = (t: number) => t * t * (3 - 2 * t);
  const a = hz(ix, iy, s), b = hz(ix + 1, iy, s), c = hz(ix, iy + 1, s), d = hz(ix + 1, iy + 1, s);
  return (a * (1 - k(u)) + b * k(u)) * (1 - k(v)) + (c * (1 - k(u)) + d * k(u)) * k(v);
};


