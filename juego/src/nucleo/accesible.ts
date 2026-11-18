// Accesibilidad (Opciones): cuánto tiembla la pantalla y si los fogonazos que la llenan entera van suaves.
// Lo fijan las opciones guardadas (ui/menus.ts) y lo leen el mundo, los poderes y las cinemáticas.
export const acc = {
  /** 0 a 1: multiplica todo temblor de cámara (golpes, poderes, cinemáticas). */
  temblor: 1,
  /** 1 normal, 0.3 suaves: multiplica los fogonazos de pantalla completa (relámpagos, poderes grandes). */
  destellos: 1,
};
