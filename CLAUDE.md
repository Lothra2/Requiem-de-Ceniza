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
- **Trajes** (`juego/src/datos/trajes.ts`): cada armadura que cae (pecho, casco, guantes, botas, cinto) lleva su traje:
  línea por la base (tela, cuero, tachonado, malla, placas, hueso), color de tela o cuero y metal de la placa o la cota
  según la tierra del acto (por el nivel del objeto; más allá del 64 cualquiera), ribete por rareza (nada o paño en lo
  común, bronce o acero en lo mágico, oro o plata en lo raro, oro entero solo en lo raro), tabardo, y corte (túnica,
  hábito, vestido, camisa, pieles, púas). Sale de `uid` + base + nivel + rareza: no se guarda nada y las piezas viejas
  también lo tienen. `aLoot` lo pone en `design.traje`, el ícono lo lee en `iconoDeLoot`/`estilo` y el cuerpo en
  `trajePecho` (apariencia.ts). Reliquias, conjuntos, míticas, épicas y coronas no pasan por ahí. Antes el 54 % de los
  pechos era la túnica morada (el color de la tela salía solo del escalón) y los cascos de hierro se veían de cuero.
  Diagnóstico: `npx tsx juego/herramientas/t850_trajes.mts 4000 40`. Lámina (héroe e íconos):
  `npx tsx juego/herramientas/t851_lamina_trajes.mts <clase> 24 && python3 juego/herramientas/t851_lamina.py <clase>`.
  En el juego: `t852_traje_vivo.cjs <clase> <semilla>`.
- **Cascos forjados** (`cascoForma` en `iconos3d.ts`): el casco que se lleva puesto se arma con el mismo modelo del
  ícono (`cascoPuesto`, como los escudos), con los materiales del cuerpo (`matCu`, metales y cueros pulidos para que en
  14 puntos de cabeza no se lean como piedra). Cada base tiene su forma en `traje.corte` (dado propio, no mueve nada):
  capucha, turbante, gorro, cofia, nasal, abierto, celada, bacinete, gran_yelmo, astado, mascara, calavera y ciervo; sin
  traje sale por línea y nivel (`formaCasco`). Vistas, ranuras y respiros son piezas oscuras por fuera de la cáscara, nunca
  `resta` (cavaría la cara). Unidades de cabeza: ojos a 0,75 y la nariz llega a 5,3 adelante (lo cerrado va más afuera).
  Las coronas y la capucha también usan su ícono puesto. La capucha cava su abertura con `resta`: por eso `personaje`
  pone al principio lo de la cabeza que cava (así no cava la cara). Los yelmos cerrados tapan la barba. Guantes, vendas
  y botas llevan `ribete` (`ribeteCuerpo`): una banda en el puño y la caña. En la casilla, la cara abierta muestra el
  forro acolchado en penumbra (`forroInterior`), no un hoyo negro.
- **Metales de las piezas que caen** (`tintes.ts`): oro, bronce y acero de trajes y cascos usan `cu_oro_pieza`,
  `cu_bronce_pieza` y `cu_placa_pieza`, con la saturación del ícono (los de siempre salían más naranjas y vivos puestos).
  Los `cu_oro`, `cu_bronce` y `cu_placa` de siempre quedan para lo horneado: no tocarlos sin volver a hornear.
- (Cascos, historia) Antes los cascos forjados de `armadura.ts` quedaban hundidos en la cabeza del héroe (que es 1,2 veces más grande)
  y el gran yelmo era el balde viejo de `tocado`. Los monstruos siguen con `armadura.ts`. Láminas:
  `npx tsx juego/herramientas/t853_cascos.mts <clase> [guantes|botas]` + `t853_lamina.py` (cada base con sus trajes) y
  `t854_formas_cascos.mts` + `t854_lamina.py` (cada forma con varios metales, `FORMAS=` y `METALES=`).
- **Dinámica del equipo** (`t855_dinamica.mts <clase> <conjunto> [acciones] [rumbos]` + `t855_lamina.py`): el héroe con
  hábito, vestido, túnica, tabardo, capa, pieles, cada escudo (`escudo_cometa`...) o cada arma (`arma_lanza`...) en cada
  acción, rumbo y cuadro, pintado con el motor (sin servidor). Lo que salió (18 nov 2026): al morir el escudo quedaba
  parado junto al muerto (ahora gira con el cuerpo, `caer` en cuerpo.ts) y la túnica larga del muerto quedaba levantada
  en bultos (el ruedo medía su alto de pie; `faldon`). Esto último cambia el morir de arcanista, nigromante, monje y
  druida: hornear `h,g` de esos héroes (y los monstruos con túnica, si se vuelven a hornear, también mejoran).
- **Tono de los íconos**: la tela y el cuero de la casilla llevan su color alto en la rampa y poca luz blanca
  (`rampaDe` con `centro`), y el latón tiene su material (`ic_laton`, la rampa de `cu_laton_viejo`): antes la casilla
  salía más clara y viva que la prenda puesta.
- **Ambientación** (`ambientarVida` en `juego/src/mundo/zona.ts`): matas, telarañas, cráneos y velas del tema, siempre
  sin tapar el paso y con su propio azar al final de la generación, para no mover nada de una partida guardada.
  `juego/herramientas/t730_ambiente.cjs` genera las 96 zonas y revisa que todo exista horneado.
- El servidor de desarrollo se cae seguido: `sh juego/herramientas/servidor.sh &` lo vuelve a levantar solo.

## Armas vivas, cofres, poderes y siluetas

- **Armas vivas** (`juego/src/render/arma_viva.ts`): cada elemento tiene su derrame (brasas, vaho, arcos, gotas, humo,
  rayos) y los cetros, báculos y varitas llevan un orbe de poder en la cabeza. Las únicas y legendarias sin `vivo` toman
  el elemento de su daño elemental más alto (`vivoPorStats` en `heroe.ts`, solo visual) o el brillo de filo. Todo va
  pegado al arma: no tapar al héroe. Se revisa con una lámina de los ocho elementos (cambiar `equipo.arma.vivo` y
  volver a `calcular`).
- **Cofres**: se abren con sus propios cuadros (`abriendo`), nunca con un efecto que traiga otro cofre. La luz
  (`luzCofre` en `escena.ts`) se dibuja con el cofre en el orden de fondo: el héroe parado delante la tapa.
- **Grano de los efectos**: `dibujarPfx` no agranda un efecto a más de 2 puntos de pantalla por punto del dibujo. No
  subir ese tope: a 3 o 4 salen bloques gruesos que tapan todo.
- **Siluetas de los exteriores** (`exterior` en `zona.ts`): ensenadas, penínsulas y macizos con azar propio por zona.
  Nada de rectángulos. Después de tocarla correr `conectividad.cjs 20` y `t370_zonas`.

- **Auditoría de poderes**: `node juego/herramientas/t760_auditoria_poderes.cjs <clase>` lanza cada habilidad contra
  tres zombis pegados, en campo abierto, cuatro cuadros seguidos, y `python3 juego/herramientas/t760_lamina.py <clase>`
  arma la lámina en `/tmp/requiem-pruebas/pa`. No correr otras pruebas a la vez: se pisan.
- **Fogonazos**: los de `energia.ts` no se apilan y van bajos sobre el héroe. Los efectos que se suman como luz bajan
  con la claridad de la zona (`claridadPfx`). Un efecto grande y opaco plantado sobre el héroe va a media fuerza.
- **Maldiciones**: cada una lleva su efecto (`MALDICION_PFX` en `mundo.ts`). La jaula de hueso es solo del nigromante.
  Lo que inmoviliza sin ser hielo marca `preso` ('raices' o 'hueso') y no se dibuja como bloque de hielo.
- **Números de daño** (`render/numeros.ts`): cifras de pixel con canto negro, brinco y apertura lateral, sin encimarse.

- **Ríos**: el camino cruza el agua siempre por un puente, nunca por vado (se veía igual que lo hondo y Rick creyó que
  se podía atravesar el río). También donde el arreglo de conectividad abre paso.
- **Rodela**: puesta usa el modelo del ícono como los demás escudos (quedaba afuera por el nombre).
- **Frases de jefes y campeones**: van encima de todo en una placa (`frasesMonstruos`), no dentro del orden del mundo.
- **Mapa y minimapa** (`dibujarMapa` y `SIGNO` en `ui/juego_ui.ts`): cada cosa lleva su signo de pixel (carpa dorada
  al campamento, boca morada mazmorra, flecha verde otra región, casita, óvalo celeste tu portal, rombo azul piedra de
  viaje, cofre, altar, calavera jefe, misión nueva y por entregar). El mapa grande trae la leyenda de lo que hay a la vista.

## Auditoría en video

- `node juego/herramientas/t770_video.cjs heroe <clase>`, `monstruos <id,id,...>` o `jefes <id>` (un jefe por corrida:
  matar a uno dispara la cinemática de cierre). Graba cuadro a cuadro con el reloj del juego controlado (25 por segundo)
  en `/tmp/requiem-pruebas/vid`: un mp4 y un json con acción, rumbo y posición de cada cuadro.
- `t770_lineas.py` imprime la línea de tiempo de cada enemigo (velocidad, tramos de caminata, duración de ataques),
  `t770_tiras.py <clip>` arma las tiras por acción y `t770_zoom.py` las amplía.
- No editar código mientras graba: Vite recarga la página y el lote se cae. Con el reloj congelado los atlas tardan en
  aparecer (siluetas blancas al principio): es de la prueba, no del juego.
- Lo que salió de la primera pasada (17 nov 2026): los jefes temblaban entre caminar y parar (decidían al azar en cada
  cuadro, ahora sostienen la decisión), todos los enemigos pegaban en 0,8 s (ahora según su peso), el cartel de muerte
  tapaba la caída y las bestias soltaban un alma con forma humana.

- **Arco del arma** (`estelaArma` en `escena.ts`): lo que barre la hoja entre cuadros se pinta como un arco curvo
  alrededor de la mano, para el héroe y los enemigos con arma. Usa `hoja` de cada cuadro horneado.
- **Enemigo que tapa**: el monstruo que queda delante del héroe y lo cubre va medio transparente (`tapa`).
- **Paso por clase**: `PASO_CLASE` en `mundo.ts` (monje y cazadora más veloces, templario más lento).

- **Orden de los efectos** (`escena.ts`): nada del mundo se dibuja encima de todo. Efectos, proyectiles, fogonazos,
  chispas de impacto y el piso que arde entran en el orden de pintado. Lo tendido en el piso (`esDePiso`) se corta en
  franjas de 16 puntos, cada una con la profundidad de su fila: un anillo pasa por detrás del muro del fondo y por
  delante del de acá. Lo que envuelve un cuerpo va partido por los pies. Lo de pie va justo después de quien está ahí.
  Arriba solo quedan los de pantalla entera, el rayo en cadena, las partículas y los números. Rick lo vio en el
  teléfono (17 nov 2026): el hielo de un congelado tapaba la reja de delante.
- **Prueba de tapado**: `node juego/herramientas/t781_tapado.cjs <clase>` planta un muro en campo abierto del desierto,
  pone el blanco detrás y mide por cada poder cuánto del dibujo del muro se pierde (10 % es nada encima). Con `FOTO=1`
  guarda capturas en `/tmp/requiem-pruebas/or`, con `SOLO=a,b` corre solo esos. Los que nacen en el héroe o lo mueven
  (cargas, saltos, auras) dan alto y está bien.

- **Luz y sombra de los cuerpos** (`luces.ts`, referencia: el video de Rick de brutaldiablo, 17 nov 2026): la sombra
  sigue a cada fuego y es un núcleo nítido, a puntos enteros y del mismo negro de los pies a la punta (hasta 0,82), con
  un borde apenas difuso. El cuerpo junto al fuego queda en clave baja (el realce baja con `luzFuerte`) y lo dibuja el
  **filo**: los puntos del borde de la silueta que miran a la luz se encienden de su color (`reflejos`), más fuerte con
  la luz de costado y más suave en figuras flacas como los esqueletos. `__sinFilo` lo apaga para comparar.

- **Piso negro** (auditoría `t850_negro.cjs`, 18 nov 2026). Tres causas: (1) los temas de mazmorra con dos parches
  (abadía, tumba, cueva, mina, catedral ahogada, interior celestial) pedían `parches[2]` y una de cada cinco baldosas
  salía sin piso: se caminaba sobre negro. Ahora el tercer parche cae al primero y `generarZona` no deja baldosas sin
  nombre. (2) Lo que no es piso y queda entre lo que se juega (`rellenarBolsas` en `zona.ts`, antes solo en cavernas): roca
  del tema en las bolsas encerradas de cuevas, mazmorras de obra (escombro de `ESCOMBRO_TEMA`) y exteriores (macizos,
  ensenadas angostas y una orilla de tres celdas por el filo, que tapa también las zonas donde la costa se deshace). En
  tres vueltas, peñascos bajos si hay piso detrás a 3 celdas, medianos hasta 7. No bloquea, no toca lo caminable, azar
  propio al final. Las islas del abismo y del cielo no se rellenan. (3) La niebla no tapa `z.roca` con piso visto a 3
  baldosas (antes al lado: el centro de un macizo quedaba como un ojo negro). Además a cielo abierto se explora todo lo que
  entra en pantalla (en pantallas grandes el círculo dejaba los costados negros). `__sinRelleno` apaga el relleno.
  El relleno es un derrumbe compuesto, no una montaña de la misma piedra: el suelo del hueco va en penumbra (`z.relleno`
  y `z.rellenoPiso`, el piso del lugar oscurecido y cortado por celda en `escena.ts`) y encima piezas sueltas con distancia
  entre ellas (más juntas y bajas en la orilla, raras y grandes adentro), sin repetir la misma cerca: en mazmorras de obra
  lienzos de `muro_obra` rotos, pilas, contrafuertes, columnas y cascajo (`cat2_escombro`, `for2_escombros`,
  `campo_escombros`); a cielo abierto roca del tema con matas, ruinas y piezas propias (`EXTRA_FUERA`). Los peñascos de la
  costa, el contorno de las cuevas y el escombro del frente cambian de cara (misma huella y mismo `bloq`).
  `CLARO=1 FOTOS=1 FOTO=1 node juego/herramientas/t850_negro.cjs 2` recorre las 96 zonas (unos 25 min) y guarda las
  peores vistas en `/tmp/requiem-pruebas/negro`. Ojo: las zonas visitadas quedan en `zonasVivas`, para comparar hay que
  generar con `generarZona` directo o abrir otra página.
- **La misma zona siempre** (`t855_determinismo.cjs`): las escenas de los mundos abiertos barajaban con
  `.sort(() => r() - 0.5)` y Chrome ordena distinto en frío (inserción binaria) que con la función compilada (de a uno):
  según cuántas zonas se hubieran generado antes en la sesión, la misma zona salía con otros cofres, otro relieve y otro
  `bloq`. Ahora se baraja a mano como en frío (lo que ve una partida al cargar). Nada de comparadores al azar en la
  generación. La prueba genera las 96 zonas en frío y en caliente y las compara; con `FRESCO=archivo.json` genera cada
  zona abierta en una página nueva (frío de verdad) y guarda o compara lo caminable.
- **Clima en mosaico sin costuras** (`dibujarClimaPfx` en `pfx_mundo.ts`): las teselas se enciman 48 puntos y se funden
  (`mascaraTesela`) y el cuadro recortado va con su corrimiento (`tesela` en `pfx.ts`). Antes la ventisca dejaba una raya
  negra a lo ancho (y = 360) y un corte a lo alto (x = 640).
- **Rosetón del nivel** (`ui/sello_nivel.ts`, lo llama `selloNivel` en `ui/juego_ui.ts`): pieza forjada pixel a pixel
  con la paleta y la luz de la barra (hierro con cuatro lóbulos remachados, filete de latón, esmalte oscuro y cifras de
  pixel en relieve, 6x9 y 5x7 para el 100) en la punta de la ojiva del orbe de vida (entre los orbes en el táctil, a 1 o
  1,5 puntos). El canal de oro se llena con la experiencia hacia el nivel siguiente, desde arriba en el sentido del reloj.
  Al subir arde 3,5 s (esmalte al rojo, anillo y chispas, con `acc.destellos`). No va en `src/engine/gotico` para no
  cambiar `__PINTOR__`. El de antes Rick lo vio "como un parche" (18 nov 2026). Prueba: `t840_nivel.cjs [etiqueta] [vistas]`
  (pc, pc1080, ipad, movil; capturas en `/tmp/requiem-pruebas/nivel`).
- **Paso fino y caché**: tocar el motor de cuerpos cambia `__PINTOR__` y el héroe con equipo se repinta entero (en PC unos
  40 s los 8 rumbos y otros 45 s los 16 con 2 obreros, ahora van 4). En ese rato camina en 8: no es que se pierdan.

- **Copias de la partida** (`copiaRotativa` en `main.ts`): antes de escribir, la partida anterior pasa a `marca.copia1`
  (como mucho una vez cada 10 min) y la copia1 vieja a `marca.copia2` una vez por día. Opciones, Partida, Copias vuelve a
  una (`abrirCopias` en `traslado.ts`, deja la de ese momento en `marca.respaldo`). Al traer o recuperar una partida se
  marca `__sinGuardar` para que el autoguardado no la pise. Prueba: `t800_copias.cjs [pc|movil]`.
- **Tope de oscuridad** (`dibujarLuz` en `escena.ts`): 0,88 (antes 0,97, el piso lejos de la luz quedaba negro puro). Lo negro que
  queda es la niebla de lo no explorado. `__topeOscuro` para comparar.
- **Accesibilidad** (`nucleo/accesible.ts`): Temblor (0 a 100 %) multiplica todo temblor de cámara, la patada de cámara y
  las cinemáticas; Destellos suaves baja a 30 % los fogonazos de pantalla completa (relámpago, poderes grandes).
- **Topes de estadísticas** (`calcular` en `heroe.ts`): crítico 75, esquiva 60, robo de vida y de maná 30, además de
  resistencias 75, reducción 50 y bloqueo 75. Lo roto no suma daño %. Auditoría: `t810_estadisticas.cjs` (poner y quitar
  objetos deja todo igual, cambiar equipo no cura, las mejoras que terminan no dejan nada, topes por clase).
- **Lo botado no vuelve solo**: lo que el jugador suelta al piso lleva `botado` y `recogerSolo` lo salta (con clic sí).
  Prueba: `t820_botar.cjs`. `window.__ui` es el estado de la interfaz para las pruebas (importar el módulo da otra copia).

- **Pantalla grande de PC** (`ajustar` en `nucleo/lienzo.ts`, 1080 o más puntos de alto, sin táctil): el lienzo va a la
  resolución exacta de la pantalla y el mundo a 1, 2 o 3 puntos por punto (Lejos, Cerca, Muy cerca). Lejos es como se ve
  en el Artifact (Rick, 18 nov 2026: a 1920 × 1080 salía duplicado y con Windows al 125 %, borroso). La barra y los menús
  van a unos 720 de alto lógico. `__sinNativo` vuelve a lo de antes.
- **Pistas y páginas**: `envolver(texto, ancho, tam, fuente)` mide con la letra con que se dibuja (medir Georgia y dibujar
  Cinzel sacaba el texto del marco). Prueba: `t830_pista.cjs`.

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
- **Siempre la última versión**: `vite.config.ts` graba la versión (commit y hora) en el juego y en `dist/version.json`.
  Al abrir, al volver a la pestaña y cada 5 min el juego la pide sin caché y, si es otra, guarda y recarga una sola vez
  (`buscarVersion` en `main.ts`). La versión se lee abajo a la derecha del panel de Pausa. GitHub Pages cachea 10 min.
- **Caché de héroes pintados**: el pintor guarda los cuadros del héroe con su equipo en IndexedDB con la clave
  `VER = 'p' + __PINTOR__`, una huella de `src/engine/gotico/*.ts`, `visual.ts` y `pintor.ts` (`vite.config.ts`). Si
  cambia cómo se pinta el cuerpo o el equipo, el héroe guardado se repinta solo. Antes era una versión a mano que nadie
  subió y Rick seguía viendo el escudo viejo en su héroe.
- Los push grandes pueden rebotar: subir los atlas en tandas de unos 40 MB por commit.
- **Instalado (PWA)**: `public/manifest.webmanifest`, `public/sw.js` y `src/nucleo/instalar.ts`. El build escribe
  `dist/lista.json` (cada archivo con huella y peso). El service worker guarda cada archivo como `archivo?h=huella`, la
  página va primero a la red (y trae la lista nueva) y sin red sale la guardada. "Instalar el juego" en el menú abre el
  panel: botón de instalar (Chrome, Edge), pasos del iPad y la barra de lo guardado (~240 MB). Una vez pedido, cada
  versión nueva se completa sola y se borra lo viejo. En el iPad la app de la pantalla de inicio NO ve la partida de
  Safari: el panel manda a sacar y traer la partida (traslado). Solo corre en el build, no en `vite` de desarrollo.
  Prueba: `npm run build`, `npx vite preview --config juego/vite.config.ts --port 4180` y `t790_instalar.cjs`
  (`ACTUALIZAR=1` arma otra versión en medio y revisa que se baje sola).
- **Artifact** (copia vieja, https://claude.ai/artifact/VHUF6kHA1Tt5VG7uGUDRBb): tiene tope de 256 MB y va por 252.
  Solo actualizar si Rick lo pide: `npm run build`, `python3 juego/hornear/publicar.py`,
  `python3 juego/herramientas/sync_artifact.py juego/dist <copia de lo publicado>` y publicar `publicar.html` con los
  archivos que cambiaron.

- **Lienzos de trabajo en rueda** (`motor/lienzos.ts`): sombras, filos y destellos de golpe se arman cada uno en un lienzo
  distinto de una rueda de 160. Reusar un solo lienzo ya pegado en el mismo cuadro frena la tarjeta gráfica (Rick, 18 nov
  2026: se trancaba con muchos monstruos y bolas de fuego). No volver a un lienzo único. En la nube no se nota porque
  Chromium pinta sin tarjeta. Prueba de fluidez: `t860_fps.cjs [n] [zona]` (sirve para comparar y ver el perfil).

## Luz avanzada (rama `luz-gpu`, publicada en /luz/)

- Cada atlas trae sus gemelos `_n` (normales) y `_h` (altura) en `manifiesto.json` (`rel`). Se hornea con `RELIEVE=1`
  (todo el juego unas 2 h 15 min a 4 núcleos) y `atlas_webp.py` los pasa a WebP SIN pérdida (Rick, 18 nov 2026: no se
  baja calidad en nada). La lámpara del héroe también alumbra el relieve (solo suma luz, no hunde) y entran las 48 luces
  en pantalla más cercanas al centro.
- `render/luz_gpu.ts`: el pase de WebGL. Opciones, Luz (Clásica o Avanzada), tecla L para comparar, `__lab` en las pruebas.
- Prueba: `URL=http://127.0.0.1:5191/ node juego/herramientas/t870_luz.cjs` (fotos en `/tmp/requiem-pruebas/luz`). En la
  nube Chromium pinta WebGL por software: los cuadros por segundo de ahí no dicen nada del PC de Rick.
