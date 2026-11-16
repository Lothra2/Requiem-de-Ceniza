# Réquiem de Ceniza: notas de trabajo

ARPG gótico isométrico original de Rick, en Vite + TypeScript + Canvas 2D. Este repo es la casa del juego desde el
16 nov 2026 (antes vivía en `lothra2/pixel_forja`, carpeta `juego/`, rama `claude/juego-gotico`; allá queda la Forja).

## Reglas de Rick

- Hablarle en español venezolano casual, directo y crítico. Sin rayas largas ni punto y coma.
- Calidad premium (la vara es Diablo 2 remasterizado). Nada a medias. Decir con honestidad qué se probó y qué no.
- **La partida no se toca**: el guardado está en localStorage (`marca.heroes`, `marca.cofre`, `marca.ultimo`,
  `marca.opciones`, `marca.intro`). Solo se agregan campos opcionales, nunca se rompe la compatibilidad.
- Las fotos de la familia son privadas: nunca se suben a ningún lado. El correo de Rick tampoco.
- No usar `git stash` a secas. No abrir PR si no lo pide.
- Este repo es público: nada privado en el código ni en los commits.

## Dónde está cada cosa

- `juego/src`: el juego (`main.ts`, `juego/mundo.ts` la lógica, `render/` el dibujo, `ui/` paneles y HUD, `motor/` el
  pintor del héroe en vivo, `nucleo/lienzo.ts` el lienzo, la entrada y la vista).
- `src/engine/gotico`: el motor que pinta personajes, monstruos, jefes y escenarios.
- `juego/public/assets`: atlas horneados en webp y `manifiesto.json`.
- `juego/hornear`: el horneador. `juego/herramientas`: pruebas de Playwright (`*.cjs`).

## Trabajar

```
npm ci
npx vite --config juego/vite.config.ts --port 5190    # desarrollo; se cae seguido, reiniciar si las pruebas dan conexión rechazada
npx tsc --noEmit -p juego                              # tipos
mkdir -p /tmp/requiem-pruebas && node juego/herramientas/t440_matanza.cjs   # una prueba (necesita el servidor en 5190)
```

- En las sesiones en la nube el Playwright del proyecto no encuentra su navegador: correr las pruebas con
  `CHROMIUM=/opt/pw-browsers/chromium node juego/herramientas/<prueba>.cjs`.
- Pruebas de regresión de siempre: `t223_poderes <clase>`, `t440_matanza`, `t450_jefe`, `t500_guardar`, `t370_zonas`,
  `t520_thor`, `t650_zoom`, `t651_zoom_pick`, `t660_traslado`. Las capturas salen en `/tmp/requiem-pruebas`.
- Ganchos de prueba en `window`: `__juego()`, `__mundo`, `__T`, `__ir(zona)`, `__aPant`, `__estado()`, `__menuFilas`,
  `__pantalla`, `__vista()`.
- La vista (Opciones, Vista) acerca solo el mundo: `ZM`, `MW`, `MH`, `RES` y `enMundo()` en `nucleo/lienzo.ts`. Dentro
  del pase del mundo `W` y `H` son el tamaño del mundo visible. Fuera de él, usar `aPantUI`.

## Hornear sprites

`GRUPOS=h,m,n,r npx tsx juego/hornear/hornear.mts` (unos 40 min) y `GRUPOS=b,j,f` (unos 45 min), después
`python3 juego/hornear/atlas_webp.py`. Grupos: h héroes, m monstruos humanoides, n PNJ, b bestias, j jefes, r retratos,
f direcciones finas. Hornear `m` borra las finas de esos ids, así que después hay que hornear `f`. `g` es el paso fino del héroe
con su equipo de salida (los 8 rumbos intermedios y los medios cuadros, 6 min): hornear `h` lo borra, así que van juntos
(`GRUPOS=h,g`). El héroe se hornea con lo que lleva un héroe recién creado (`equipoVisual(nuevoHeroe())`), que es lo
que `firmaVisual` llama 'base'. Con otro equipo lo pinta el aparato (`motor/pintor.ts`). Los PNG intermedios
no se suben (están en `.gitignore`): se hace commit recién después de pasar a webp.

## Objetos y ambientación

- **Lo que se ve puesto es lo del ícono**: `src/engine/gotico/apariencia.ts` traduce cada casilla al cuerpo. Los escudos y
  los talismanes de mano se arman con el mismo modelo del ícono (`escudoPuesto` en `iconos3d.ts`). Se revisa con
  `juego/herramientas/t720_escudo.cjs <base> <clase>`.
- **Reliquias** (`juego/src/datos/reliquias.ts`): únicos y legendarios en formato de tabla, uno de arranque por clase.
  `req` fija el nivel necesario aunque caigan más adelante. Se agregan filas ahí.
  Cada una lleva su **aspecto propio** en la tabla `ASPECTO` del mismo archivo (línea, grado, color, ribete, gema y
  brillo para armadura, `cara` para escudos, `arma` con metal, gema y nivel de forja): se ve en la casilla y puesto.
  Una reliquia sin fila en `ASPECTO` sale con el aspecto de su base: no entregar reliquias así. Se revisa con
  `juego/herramientas/t740_reliquias.cjs`.
- **Ambientación** (`ambientarVida` en `juego/src/mundo/zona.ts`): matas, telarañas, cráneos y velas del tema, siempre
  sin tapar el paso y con su propio azar al final de la generación, para no mover nada de una partida guardada.
  `juego/herramientas/t730_ambiente.cjs` genera las 96 zonas y revisa que todo exista horneado.
- El servidor de desarrollo se cae seguido: `sh juego/herramientas/servidor.sh &` lo vuelve a levantar solo.

## La presentación de las clases

En la pantalla de elegir clase el héroe es **pixel art** (grupo `r`, horneado a 1,5 veces el tamaño del juego con la luz
de `retrato.ts`) y se dibuja a puntos enteros, igual que la fogata y el piso. No volver a presentarlo como render liso
en grande: el modelo de cuerpo (manos, nariz, torso) no lo aguanta y Rick lo rechazó (16 nov 2026).

## La portada

La catedral de la portada es una toma 3D en perspectiva (`src/engine/gotico/catedral_portada.ts`), no el sprite del
juego. Para volver a pintarla con sus capas (luz, fuego tras los vitrales, niebla, camposanto):
`npx tsx juego/hornear/portada_catedral.mts && python3 juego/hornear/portada_webp.py` (10 s). Encuadre con `X`, `Y`,
`ALTO` (coordenadas de la capa de 1536x800). Se revisa con `juego/herramientas/t680_portada.cjs`.

## Publicar

- **Sitio**: cada push a `main` arma el juego y lo deja en `gh-pages` (`.github/workflows/publicar.yml`).
  Dirección: https://lothra2.github.io/Requiem-de-Ceniza/
- Los push grandes pueden rebotar: subir los atlas en tandas de unos 40 MB por commit.
- **Artifact** (copia vieja, https://claude.ai/artifact/VHUF6kHA1Tt5VG7uGUDRBb): tiene tope de 256 MB y va por 252.
  Solo actualizar si Rick lo pide: `npm run build`, `python3 juego/hornear/publicar.py`,
  `python3 juego/herramientas/sync_artifact.py juego/dist <copia de lo publicado>` y publicar `publicar.html` con los
  archivos que cambiaron.
