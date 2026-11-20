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

## Trabajo en curso y decisiones tomadas (para no repetir)

Leer esto primero en cada sesión nueva. Actualizarlo al cerrar cada frente.

- **Mundos** (rama `mundos`, copia en `/home/user/requiem-mundos`, respaldada en origin). Tanda 1 hecha (campamentos de
  6 a 10, exteriores por lugares, salas y cuevas amplias, arenas de jefe, `MAPA_V = 2`). Tanda 2 en marcha: etapa A
  (balance con campamentos, atascos en 0, arenas de jefe pendientes, fotos frescas, pruebas) es la llave para publicar
  la tanda 1; etapa B (menos montado, puertas y cuellos bajo tierra, gore con relato, puesta en escena de jefes, hitos
  nuevos por acto con los actos 1 y 2 pulidos primero, desvíos y secretos, lugares en el mapa). Auditoría completa en
  `/tmp/requiem-pruebas/auditoria_mundos/informe.md` (se borra al reiniciar la máquina: lo que importa está aquí).
- **Ya decidido por Rick, no volver a preguntar**: perder el mapa explorado está bien (héroe, objetos, misiones, viajes y
  casas no se tocan); se pueden modelar piezas nuevas (casas, torres, muertos, lava, lo que haga falta); la vara es mejor
  que Diablo 2 pero original; nada montado, todo con intención; respaldar ramas de trabajo en origin está bien.
- **Seguir solo**: hay una tarea programada cada hora ("Seguir la reconstrucción de mundos") que reanuda al agente si el
  límite de uso lo frena, revisa, publica y avisa. Se borra sola al terminar.
- **HUD**: publicado (`9be8834`, `bc0a1e1`). Pendiente que Rick diga si le gusta el cinturón partido en dos pares. Sutiles
  todavía: ceniza del jefe y grietas de vida baja.
- **Poderes**: cinco pasadas publicadas. Pendiente: Coro de los sellos (22 a 25 % de blanco por la columna), Puño de dios
  lava a blanco, sin sonido de cambio de forma ni de Festín, no se ve el equipo en forma de bestia.
- **No publicar** nada que no se haya revisado mirando las láminas y corrido las pruebas. Main publica solo al hacer push.

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

- **Las formas del druida** (`lobo_druida` y `oso_pardo` en `catalogo/bestias.ts`, quinta pasada): van en `catalogo/`, que no
  entra en la huella de `__PINTOR__` (solo los `.ts` de `src/engine/gotico/` y no sus carpetas): tocarlas no repinta el héroe
  de nadie. Se hornean solas: `RELIEVE=1 SOLO=lobo_druida,oso_pardo GRUPOS=b,f npx tsx juego/hornear/hornear.mts && python3
  juego/hornear/atlas_webp.py` (75 s). Con `SOLO` los atlas llevan un prefijo con la hora (`bmwog...`), así que el webp
  sale sin pérdida. Un cuerpo nuevo de bestia necesita además su fila en `BESTIAS_OTRAS` (`datos/zancada_monstruos.ts`) y
  los JSON gemelos (`zancada_monstruos.json`, `zancada_correr_monstruos.json`, `animacion_monstruos.json`) al día.
- **Morir con intermedios** (Rick, 19 nov 2026: "más sprites en la muerte para que se vea más fluida"). El motor sigue con
  sus 8 poses clave de morir (`CUADROS.morir`, lo que piden cinemáticas y adornos con un cuadro fijo), pero los enemigos se
  hornean con dos intermedios entre cada par: 22 cuadros (la clave k en el cuadro 3k) y los jefes tres (29, la clave en
  4k), `MORIR_N` en `hornear.mts`. Entre claves `claveSuave` (figura.ts): cúbica que no se pasa, pareja donde el movimiento
  sigue y cortada en los golpes (rodillas y cuerpo contra el piso, `golpes` en `morir`) para que no se vuelvan masa. Las
  tablas `K` de bestias y jefes van suaves solo dentro de un cuadro de morir (`armarMorir`). El arma que se suelta pasa
  del puño al piso de a poco (`armaMez` en la pose, el hacha del Rey de Escarcha y la cuchilla del Verdugo caen con
  gravedad). Los cuadros enteros dan lo mismo que antes. En el juego (`fr` en escena.ts) morir dura 0,8 s y 1,3 el jefe
  con los cuadros que trae el atlas (uno viejo de 8 sigue a 14 por segundo). Hornear solo una acción:
  `RELIEVE=1 ACCS=morir GRUPOS=m npx tsx juego/hornear/hornear.mts` (m 22 min, b y j aparte), van a sus propios atlas
  (`m_<id>_morir_0`) y el resto del manifiesto no se toca. Los cuadros de morir de antes quedan muertos dentro de los
  atlas viejos hasta el próximo horneado entero del grupo. Lab sin servidor: `npx tsx juego/herramientas/t930_morir_lab.mts
  <id,...> [dir]` (`N=8` las claves de antes). En el juego: `t770_video.cjs` + `t770_tiras.py` (la tira de muerte va entera).

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
  cuenco forrado oscuro con degradé hacia el fondo, canto acolchado con pespunte y costuras finas
  (`forroInterior`), no un hoyo negro ni bolas.
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
- **Esquinas de muro** (`muro_esquina` en `src/engine/gotico/catalogo/muros.ts`, `esquinasMuro` en `zona.ts`, Rick,
  19 nov 2026: "plano contra plano, con una rendija"). Donde un muro en x y uno en y se juntan en V hacia la sala, las dos
  puntas quedaban a un grueso de muro: rendija negra y cada cornisa cortada por su lado. La esquina es el muro que sigue
  en cada eje (su paño liso, `ESQUINAS_MURO`), cortado a inglete: hiladas, imposta y cornisa doblan. Va al final de la
  generación, sin azar, sin tocar `bloq` (la celda sigue de piso) y no tapa lo que tiene `tag`. La L del fondo de una sala
  ya cerraba sola. Un muro nuevo en un tema necesita su fila en `ESQUINAS_MURO` y hornear solo eso:
  `RELIEVE=1 GRUPOS=o SOLO=muro_esquina npx tsx juego/hornear/hornear.mts && python3 juego/hornear/atlas_webp.py` (10 s).
  Pruebas: `t911_esquina_lab.mts` (sin servidor, antes y después por variante, `L=1` la L), `t910_esquinas.cjs` +
  `t910_lamina.py` (en el juego, `__sinEsquinas` para comparar) y `t912_esquinas_todas.cjs` (todas las zonas).
- **Adornos con intención** (`curarAdornos` en `zona.ts`, Rick, 19 nov 2026: "dos cofres uno al lado del otro", "no
  quiero adornos por todos lados sin intención"). Los cofres salían de cinco pasos que no se miraban (escenas, los dos
  escondidos, los sueltos de `colocarInteractivos`, el del mini jefe a la fuerza y el de la casa) y los cofres de adorno del
  tema (`hie2_cofre`, `ahg_cofre_barco`, `arc_cofre`, `tum_cofre`) caían pegados a uno de verdad. Va al final de la
  generación, con su propio azar, y cada objeto sabe de qué paso salió (`capa`: riego, vida, macabro, relleno, escena,
  horror, jefe, matanza...). Reglas: ningún cofre a menos de 10 celdas de otro (el que sobra se muda junto a un grupo de
  élite o no sale), sin cofres de adorno cerca, urnas y barriles no pegados al cofre. Nada del riego en pasillos de 6 celdas
  o menos ni junto a entradas y salidas. El gore suelto se junta donde pasó algo (horror, escenas, jefe y las **matanzas**:
  junto a los campeones y únicos sin horror cerca, o a un grupo, una pieza de horror del acto con charcos de
  sangre, de 2 a 5 por zona afuera y de 4 a 9 en las mazmorras, donde pasa lo peor), las velas junto a altares, lápidas y santuarios, las telarañas contra el muro. La misma
  pieza no se repite a menos de 6 celdas (3,5 las matas, 5 en un lugar de gore) y como mucho 2 adornos sueltos por cuadro de 8 x 8 en mazmorras (3 afuera).
  Los escalones del relieve en tramos de menos de 4 piezas se quitan (se leían como ladrillos regados). Lo que se quita solo
  abre paso. Lo que se muda o se agrega con bloqueo va con todo el anillo de alrededor libre y sobre piso que se alcanza.
  De la zona la partida solo guarda el mapa descubierto por baldosa: pisos, tamaño, entradas, salidas y grupos no cambian.
  `__sinCurar` lo apaga. Medida: `node juego/herramientas/t920_adornos.cjs <etiqueta> [semillas]` (`SIN_CURAR=1` el antes,
  y además compara cada zona contra la misma sin curar: tamaño, pisos, entradas, salidas, grupos y lo que se alcanza). Fotos:
  `t921_adornos_fotos.cjs <etiqueta> [zonas]` (héroe de id fijo, mismos puntos en `puntos.json`) y
  `python3 juego/herramientas/t921_lamina.py antes ahora` (láminas en `/tmp/requiem-pruebas/adornos`).
- **Haces de luz del techo** (`haces` en `render/ambiente.ts`, Rick, 20 nov 2026: "muy geométrica, cortada"). En criptas,
  catacumbas, abadías, templos, tumbas, cuevas y minas. Antes era un trapecio con degradé a lo largo y los cantos a
  cuchillo, y se pintaba también sobre lo no explorado (cuñas en el negro). Ahora es un cono con volumen horneado una vez
  por color en dos texturas (`texturaHaz`): campana de lado a lado con el borde que respira, hebras claras y oscuras que
  no llegan parejas al piso, aire con ruido, nace de a poco arriba y se funde abajo en un charco moteado (`charcoHaz`). Las
  dos texturas se funden despacio y una nube pasa (la fuerza sube y baja). Va en un solo drawImage inclinado (sin
  costuras). Polvo que deriva adentro, más claro en el centro, y alguna mota destella. Solo sobre piso ya explorado, y el
  charco pierde fuerza si delante hay muro (va en la capa del aire). `__hazViejo` vuelve al de antes, `__hazFuerza` ajusta.
  Prueba: `t990_haz.cjs <etiqueta> [zonas]` (`VISTA=movil`, `VIEJO=1`), fotos en `/tmp/requiem-pruebas/haz`.
- El servidor de desarrollo se cae seguido: `sh juego/herramientas/servidor.sh &` lo vuelve a levantar solo.

## Mundos: campamentos, lugares y salas (oleada 1, 20 nov 2026)

Rick: los mundos se sentían pegados. "Espacios abiertos y explotables para peleas frenéticas", "no quiero solo ensanchar,
tiene que haber intención", "que no quede todo montado". La auditoría (20 nov) midió que el problema no era el tamaño: a
cielo abierto el adorno bajaba la arena de 91 % a 31 %, bajo tierra casi no había un 9 x 9 libre, y los grupos de 3 cada 9
celdas despertaban de a 3. Definiciones: **despeje** de una celda = anillos libres alrededor (4 = cabe un 9 x 9);
**arena** = la unión de todos los 9 x 9 libres; **montado** = adorno cuyo rectángulo de sprite se pisa 60 % con otro.

- **`MAPA_V`** (`juego/mundo.ts`): versión del trazado en la clave del mapa descubierto (`zid[~o]~m2`). Se sube cuando una
  fase mueve el trazado: se pierde SOLO la niebla. Héroe, bolsa, misiones, viajes, casas y restos van por id de zona. Nunca
  cambiar ids de zona ni nombres de entrada. `t1001_partida_vieja.cjs` arma una partida con las claves de antes y lo revisa.
- **Campamentos** (`acampar` y `asentarCampamentos` en `zona.ts`, `poblar` y `alertarCampamento` en `juego/mundo.ts`).
  `sembrar` ya no existe. El presupuesto es el de antes: `n` grupos de los de antes (7 % únicos, 9 % campeones) se juntan
  en campamentos (`Spawn.grupos`: cuántos grupos de antes vale) de 6 a 10 cuerpos, a 24 celdas uno de otro (se afloja si
  no hay sitio), en la celda más abierta, primero en los sitios que lo piden (los claros de un exterior, las salas grandes).
  El único lleva 1 + 3 + un grupo, los campeones 3 + un grupo. Al final de `generarZona`, ya curado el adorno, cada campamento
  se corre a lo más abierto que tenga a 5 celdas y anota su `frente` (hacia la entrada más cercana). `poblar` tira cada grupo
  con el dado de antes (no sube la experiencia ni el botín), mete uno de tiro si la zona tiene y no salió, y los para con
  papeles: el jefe al centro, cuerpo a cuerpo hacia el frente, tiro y conjuro detrás. `Monstruo.camp` es el índice del
  campamento: al despertar uno (vista 13 a cielo abierto, 11 bajo tierra, 15 y 12 los de élite; el jefe sigue por su sala) o
  al recibir un golpe, todos los de su campamento se vienen con demora escalonada. `__vistaVieja` vuelve a la vista de 8 y
  al contagio de antes. El grupo de bienvenida de un héroe nuevo (`primero`) son 2. Un `Spawn` sin `grupos` (casas, lo
  viejo) sale como antes. Medida: `t1002_presupuesto.cjs <etiqueta> [otra]` entra a las 89 zonas con monstruos y suma
  cuerpos, experiencia y élites (el dado de `poblar` es al azar por sesión: por zona hay ruido, vale el total).
- **Lugares de los exteriores** (`exterior`, `escenasLugares`, `gargantaDe`, `Constructor.racimos`). Antes de regar nada,
  con azar propio, se eligen tres o cuatro **claros** (radio 9 a 13, 4 en mapas de más de 12 000 celdas), el **hito** del
  acto (`acto_hito`, radio 6) y, si la zona tiene jefe, su claro (radio 12 a 14, sin escena). `z.lugares` y `z.claros` (no se
  guardan): `Constructor.poner` no deja caer en un claro nada que no sea plano o de capa `escena`, `horror` o `jefe`. Cada
  claro lleva su **escena** (caravana, guarida, altar, patíbulo) armada contra el fondo (del lado contrario al centro del
  mapa) en arco, con su cofre, y el medio libre para el campamento (que pone `acampar`: la escena ya no trae guardia). Una
  **senda** reservada sale de la celda de camino más cercana hasta cada lugar y la más larga lleva la **garganta** (dos
  frentes del borde que dejan 5 celdas por unas 10). Lo disperso va en **racimos** (3 a 6 piezas de la misma fila del tema,
  9 celdas entre racimos), lo grande a la mitad, las matas solo como falda (a 2 celdas de algo que bloquea), el borde de
  árboles a 2 celdas del filo. Cada claro tiene nombre (`NOMBRE_LUGAR`) y `historiaPaso` lo anuncia la primera vez que se
  pisa. `__sinLugares` vuelve al riego de antes.
- **Bajo tierra** (`mazmorra`, `cavarCueva`, `tamZona`). Mazmorras de obra: `tamZona` les suma 4 baldosas por lado si hay
  jefe y 2 si no (islas y casas no), salas de 4 a 6 baldosas (una cada 80), una **sala mayor** que se pone primero (6 a 7 x
  5 a 6 con dos filas de columnas; con jefe es su sala, de 8 a 10 baldosas) y pasillos siempre de doble ancho. La entrada es
  el cuarto más lejos de la mayor y el jefe se une al final de la cadena. Cuevas: cámaras de radio 9 o más, una gran
  caverna a media cadena (15), la del jefe 17,5, túneles de 3,7. En salas y cámaras el medio queda libre (`z.claros`: lo que
  adorna va en una franja de 3 celdas contra el muro o la roca; las matanzas entran, a 5 a 8,5 del campamento).
  **Ruedo del jefe**: 10 anillos reservados alrededor de donde sale antes de decorar; los estorbos de su arena, las rarezas
  y el tesoro van por fuera (`fuera`), y `curarAdornos`, `ambientarVida` y `ambientarHorror` lo respetan. `__salasViejas`
  vuelve al trazado de antes (ojo: cambia el tamaño). Excepciones a propósito: las islas sobre el vacío (abismo, islas de
  la Corona) y las casas.
- **Pruebas**: `node juego/herramientas/t1000_espacios.mjs [etiqueta] [semillas]` genera las 96 zonas SIN navegador (Vite
  como cargador de módulos, 3 semillas, unos 40 s) y mide por familia arena, arenas de 120, campamentos en arena, adornos
  por pantalla, montados, piso legible y el ruedo de cada jefe; falla si algo baja de `t1000_pisos.json` (`ANTES=<etiqueta>`
  imprime contra otra corrida, `ZONAS=1` cada zona, `SOLO=`). Las medidas están en `medir_espacios.mjs`.
  `t1003_mundos_fotos.cjs <etiqueta> [zonas]` (`VISTA=pc|pc1080|movil`) saca fotos en plena pelea en el campamento más
  grande, uno típico y el jefe o un élite, y `python3 juego/herramientas/t1003_lamina.py <antes> <ahora> [vista]` arma las
  láminas y los mapas de despeje en `/tmp/requiem-pruebas/mundos1`. `t920_adornos` compara los campamentos por cantidad y
  tipo (su sitio se asienta después de curar).

## Mundos, oleada 2 (20 nov 2026)

**Etapa A: que los campamentos se puedan jugar.** La oleada 1 dejó peleas de 6 a 10 cuerpos con el daño de cuando eran 3.

- **Simulador** `npx tsx juego/herramientas/t1010_campamentos.mts [--clases] [--niveles 1,5,10,20,35,50,65] [--semillas 6]
  [--zonas a,b] [--banderas __frenteViejo] [--diag] [--inicio] [--salida x.json] [--md x.md]`: el héroe típico de
  `balance.mts` entra de verdad a 4 zonas de su nivel (2 abiertas, 2 mazmorras) y las limpia con un jugador simple (va al
  más cercano, pega con su poder, poción al 45 %, no esquiva). Mide por pelea cuerpos encima, duración, pociones, vida
  mínima y muertes, y con `--diag` reparte el daño recibido por quién lo hizo (`__danoHeroe` en `danar`). `RAIZ=<otra
  copia>/juego` corre el mismo jugador contra otra copia del repo (el antes). Al morir vuelve a la entrada y deja ese
  campamento. Ojo: muertes por hora = muertes por baja x bajas por hora, y con campamentos se mata 1,3 a 1,5 veces más
  rápido. Con 6 semillas cada clase muere 0 a 10 veces por nivel: por clase es ruido, vale la media.
- **El frente** (`enFrente`, `rondar`, `topeFrente`, `ritmoFrente` en `juego/mundo.ts`; `__frenteViejo` lo apaga todo):
  contra el héroe entran cuerpo a cuerpo 2 a la vez en zonas de nivel menor que 4, 3 hasta el 12 y 4 después; un campeón
  vale por dos y van de a dos, **un solo bruto a la vez** (común o campeón: carceleros y gigantes de a tres eran lo que
  mataba a las clases de tiro en las Llanuras y el Trono Helado), el único siempre. El resto cierra un corro a 3 o 4
  casillas, ronda y entra cuando hay hueco. **Turnos**: entre el arranque de un golpe común y el siguiente pasan 1,2 a
  1,5 s (el bruto ocupa dos). **Andanada**: un tiro común cada 1,5 s (1,9 desde el nivel 24). Las maniobras (embestida,
  salto) son del que tiene turno. **Escolta**: en un campamento de élite el grupo que acompaña (`escolta`) es la segunda
  oleada: entra cuando un élite cae o baja de media vida, si le pegan o a los 15 s.
- **Bienvenida**: en zonas de nivel menor que 6 los campamentos juntan 2 o 3 grupos (4 a 6 cuerpos). Para un héroe de
  nivel 3 o menos, el campamento más cercano a la puerta por la que entra es de 2, el segundo de 2 grupos, y los de élite
  a menos de 40 celdas de esa puerta salen como comunes (`mansos`, solo en esa partida de `poblar`).
- **Atascos**: `buscarCamino` marca `parcial` si se acabó el presupuesto; `avanzar` busca entonces a fondo (20 000 nodos,
  con montículo, `caminoLargo`, una vez por cuadro) y sigue ese camino 2,5 s. `t1011_atascos_sim.mts [zonas|todas]
  [semillas]` es t995 sin navegador (todas las mazmorras en 30 s). El criterio de las dos pruebas ahora mira lo que falta
  por el camino de verdad, no en línea recta, y no cuenta al que hace cola detrás de otros.
- **Ruedo del jefe** (`asentarJefe`, al final de `generarZona`): 10 anillos libres garantizados. Si no los hay, quita el
  adorno suelto que estorba y, si el terreno no da, muda al jefe al punto con ruedo más cercano. En las islas del abismo
  el jefe tiene su isla mayor de 6 x 6 baldosas. `cabe` (lugares de los exteriores) mira también el medio del claro.
- Herramientas: `t1012_desglose.mjs` (de qué capa y pieza sale cada adorno y qué tapa el piso), `t1020_pieza_lab.mts <id>`
  (pinta piezas del catálogo sin servidor, con su huella y una persona de 75 puntos), `t1021_vistas.cjs` +
  `t1021_lamina.py` (vistas de cada lugar de una zona sin niebla ni pelea).

**Etapa B (en marcha).** Hecho: el borde de los exteriores va por **macizos** (`arb_macizo` en `catalogo/arboles.ts`: una
pieza de 9 x 3 o un nudo de 5 x 5 con silueta, cuatro especies), solo donde el vacío queda al norte o al oeste (**lo alto
atrás, lo bajo adelante**: un risco del borde con piso detrás va bajo); la orilla ya no lleva matas ni cascajo, la garganta
es de roca y hay dos viñetas como mucho. `__sinMacizos` vuelve a lo de antes. Piezas del relato horneadas y todavía sin
poner en el mundo (`catalogo/horror.ts`): `sed_cuerpo_seco`, `sed_brasa`, `ves_rastro`, `sed_sello_roto`. Hornear una pieza
suelta: `RELIEVE=1 GRUPOS=o SOLO=<id> npx tsx juego/hornear/hornear.mts && python3 juego/hornear/atlas_webp.py` (25 s).
- **Relatos por campamento** (`curarAdornos` paso 3b, capa `relato`, `__sinRelatos`): el único guarda una ofrenda a la sed
  (`sed_brasa` con cuerpos bebidos de rodillas), los campeones una última defensa (barricada, muertos del acto, charco),
  los comunes por turno el campamento que come (fogata, asador, muerto), los bebidos o solo el muerto; un rastro de sangre
  llega desde el frente. Cada cofre escondido tira un rastro hacia el centro del mapa con su muerto. En la zona de un
  guardián de los actos 1 a 5: el sello roto bajo el jefe y el paso de Vesperio (atril, hileras de velas, partitura).
  Los comunes van por turno castigo, fogata, castigo, bebidos. El **castigo** (`CASTIGO` por tema, a 9 a 12,5 del centro
  del campamento, contra el fondo) usa piezas horneadas que no salían en ningún mapa: árbol de ahorcados y empalados en el
  páramo, tumba abierta y doliente en cementerio y abadía, mesa de embalsamar y amortajados en catacumbas y cripta,
  vagoneta con sangre y mineros muertos en la mina, poste de cráneos en selva y templo, osamenta y jaula en la nieve,
  cerca de púas y doncella en el infierno, potro y jaula en santuario y fortaleza, y en los actos 6 y 7 la brasa fría con
  bebidos (canon: ahí tira el dios directo). Lo de alrededor del ancla no bloquea (se pisa) y nada del relato cae a menos
  de 6,5 celdas del centro de otro campamento (le quitaba el despeje). Cuesta 1 a 2 puntos de arena. Piezas sin usar: `_m_nousadas.mjs` (no se sube).
- **a3_selva** salía oscura: la zona lleva su propia `oscuridad: 0.24` (el tema selva sigue en 0,5 para el Manglar Negro).
  Brillo medio del mundo en las vistas de t1021 de 27 a 38 a unos 35 a 40 (el páramo da 30). El despeje ya no era el
  problema: arena 59 a 69 % y 6 a 8 campamentos de 9 a 11 en arena.
- **Lugares en el mapa** (`dibujarMapa` en `ui/juego_ui.ts`): cada claro visto lleva su rombo de hueso y en el mapa grande
  su nombre (el hito, rombo de brasa). Solo lo explorado. Los signos de salidas, piedras, cofres y altares se apartan
  antes que cualquier nombre, y una etiqueta que choca prueba arriba, abajo y a los lados antes de no ponerse (antes la
  piedra de viaje y los cofres caían encima de los nombres). Se mira con `MAPA=1 t1021_vistas.cjs`.
- **Nada montado** (`desmontar`, paso 5b de `curarAdornos`, `__montados` lo apaga): dos adornos cuyas cajas de sprite se
  pisan 55 % del más chico: queda el que pesa más (tag, estructura, relleno, macizo, garganta, jefe, horror, escondido,
  interactivo, columnas y las anclas del relato nunca salen; después escena, matanza y relato, viñeta, macabro, riego). Lo
  que no bloquea primero se corre a 2 a 6 celdas donde no pise a nadie; lo que bloquea sale (correrlo cerraba arena); la
  escena se corre pero no se desarma. Pueblos y casas no. Las cajas son `juego/src/mundo/cajas_sprite.json`, sacadas del
  manifiesto con `node juego/herramientas/t1013_cajas.mjs`: **correrlo después de hornear piezas nuevas** (sin caja una
  pieza no se desmonta). t1000 (3 semillas), exterior antes de la etapa B y ahora: montados 54 a 15 %, adornos por
  pantalla 55 a 48, arena 62 a 59 (el relato bloquea algo), piso legible 30 a 31; bajo tierra montados 35 a 6 %, adornos
  por pantalla 30 a 25 (cueva 32 a 29).
- **Puertas y cuellos** (`mazmorra`, solo las de obra; `__pasillosLargos` vuelve a la siembra de antes, `__sinPuertas` quita
  las jambas): tres de cada cuatro salas nacen junto a otra (a 1 o 2 baldosas, centros alineados), y entre dos salas a 2
  baldosas o menos el paso es de una baldosa de ancho. Donde un cuello de una baldosa entra a una sala van dos braseros o
  antorchas del tema a los lados, contra el muro (capa `umbral`, no se quitan ni se desmontan). Baldosas de pasillo por
  enlace (93 mazmorras x 3 semillas): mediana 3,3 a 2 (las de doble ancho cuentan 2), p90 8,7 a 3,75. t1000 obra: arena
  57 a 60, campamentos en arena 77 a 83, adornos por pantalla 25 a 33. Medida: `juego/herramientas/_m_pasillo.mjs` no se
  sube (los `_m_` están en .gitignore): contar `suelo && !sala` por enlace en `mazmorra`.
- **Puesta en escena del jefe** (`curarAdornos` 3b, `FOCO_JEFE` y `BRASERO_JEFE` por tema, `__sinEscenaJefe`): de espaldas
  a la entrada más cercana, al borde del ruedo (12,5 a 19 del jefe), su asiento (trono, altar, ídolo, púlpito, mausoleo;
  si no cabe, un trono en ruinas o un relicario) con capa `jefe`, y hasta cuatro braseros del tema a los lados (no en el
  eje de la entrada) que cierran la arena en luz. 28 de 31 jefes con asiento y 70 braseros (semilla 12345). Faltan
  asiento en a3_inundadas, a4_grieta y a7_boveda (no hay sitio fuera del ruedo). El ruedo sigue en 10.

## Armas vivas, cofres, poderes y siluetas

- **Armas vivas** (`juego/src/render/arma_viva.ts`, rehechas el 18 nov 2026: antes cada elemento era la misma llama de
  Doom teñida, tapaba la hoja, se pintaba encima del héroe de espaldas y se apagaba justo al pegar). Todo va sobre el
  **tramo vivo** que arma el motor (`filoDe` en `cuerpo.ts`: la hoja, la cabeza del hacha o la maza, el remate del báculo,
  la gema de la varita), que el pintor guarda en `hoja[5..8]` junto con la **máscara** de tramos que se ven (`hoja[4]`,
  `motor/hoja.ts`): lo que pasa por detrás del cuerpo no se dibuja. Capas: el filo encendido a puntos enteros (con su
  latido por elemento), la forma del elemento (fuego y sombra: la llama de Doom en una grilla fija por portador,
  `armaArdeViva` en `fuego_especial.ts`, donde solo cambia dónde nace el calor, así sigue viva en el golpe y deja su cola;
  escarcha: cristales en el filo, vaho que cae y destellos; rayo: arcos quebrados por el filo, a tierra y chispas; veneno:
  perlas que corren, gota que se junta y cae, miasma y burbujas; luz: runas y estrella en la punta; sangre: latido y
  goteo), lo que suelta en el vuelo (queda atrás en el mundo), el estallido al conectar (`golpeVivo`, lo pide
  `danar` con `golpesVivos`, solo visual) y la luz en la hoja (`luzViva`, la lee `luces.ts`: contenida quieto, entera
  pegando, y un fogonazo corto en el blanco). El arco del golpe (`estelaArma`) toma la materia del elemento
  (`estiloEstela`). Los cetros, báculos y varitas llevan un orbe con volumen (canto oscuro, núcleo corrido a la luz,
  brillo duro, motas por delante y por detrás). Los enemigos encantados, campeones, únicos y jefes con arma de elemento
  la llevan también (`elemMonstruo`, más contenida, sin luz, seis a la vez como mucho). Las únicas y legendarias sin
  `vivo` toman el elemento de su daño elemental más alto (`vivoPorStats` en `heroe.ts`, solo visual) o el brillo de filo.
  Prueba: `t870_armas_vivas.cjs <clase> <fam,...> [etiqueta]` (`ELEMS`, `DIRS`, `BLANCO=1` pega a un zombi) y las láminas
  con `t870_lamina.py` en `/tmp/requiem-pruebas/armas`. `__sinDerrame`, `__sinLlamaArma` y `__sinVivaMonstruos` apagan
  partes para comparar.
- **En marcha** (Rick, 19 nov 2026: el veneno no dejaba nada al correr): veneno y sangre chorrean por lo barrido mientras
  se camina o corre (gotas con la inercia del paso que caen y dejan mancha de 2,8 a 3,4 s, y el veneno su estela de
  miasma); la gota de la punta sigue juntándose aunque la hoja se mezca. Probar con `recalc(j)` tras poner `arma.vivo`.
- **Lo que sueltan las armas en el orden** (`derramesDelMundo` y `moverDerrames` en `arma_viva.ts`): cada gota, miasma o
  chispa entra en la lista de pintado con la fila de suelo que tiene debajo (`piso/8`), las manchas con lo plano. Antes iban
  encima de todo y se veían sobre las rocas de delante (Rick, 19 nov 2026). El muñeco sigue con `dibujarDerrames`.
- **Objetos en cubetas** (`objetosVisibles` en `escena.ts`): 8 x 8 casillas, solo las que ve la pantalla; los rasgos del
  nombre (mece, cuelga, blanda) se calculan una vez por objeto (`flagsObj`). `__sinCubetas` para comparar.
- **Recoger equipo** (`prefsRecoger` en `mundo.ts`, Opciones): por omisión el equipo solo con clic, como en Diablo; solos
  van el oro, las pociones y lo consumible. Al ir por una poción el héroe se llevaba lo que pisaba.
- **Huellas del héroe** (`pisadaNueva` en `ambiente.ts`): del mismo esqueleto con que se pinta (`esqueleto` del motor), el
  pie que apoya en el cuadro que se ve (`pisadaHeroe`, lo deja escena.ts con el rumbo real y el pie clavado): una huella
  por paso, en el talón y la punta de ese pie. Antes salían cada 0,46 casillas (tres veces más seguidas que los pasos) a
  un costado fijo. `__huellaVieja` vuelve a lo de antes, `__huellasArr` para las pruebas.
- **Cofres**: se abren con sus propios cuadros (`abriendo`), nunca con un efecto que traiga otro cofre. La luz
  (`luzCofre` en `escena.ts`) se dibuja con el cofre en el orden de fondo: el héroe parado delante la tapa.
- **Grano de los efectos**: `dibujarPfx` no agranda un efecto a más de 2 puntos de pantalla por punto del dibujo. No
  subir ese tope: a 3 o 4 salen bloques gruesos que tapan todo.
- **Siluetas de los exteriores** (`exterior` en `zona.ts`): ensenadas, penínsulas y macizos con azar propio por zona.
  Nada de rectángulos. Después de tocarla correr `conectividad.cjs 20` y `t370_zonas`.

- **Auditoría de poderes**: `node juego/herramientas/t760_auditoria_poderes.cjs <clase>` lanza cada habilidad contra
  tres zombis pegados (las trampas en un sitio libre que pisan a los 0,55 s, con cadáveres a mano para las invocaciones), en campo abierto, cinco cuadros (0,15 a 1,1 s), y `python3 juego/herramientas/t760_lamina.py
  <clase> [carpeta]` arma la lámina en `/tmp/requiem-pruebas/pa` (`SALIDA=` otra carpeta, `SOLO=a,b` solo esos). Antes de
  cada poder despeja lo de alrededor: objetos a 12 casillas, los monstruos de la zona, el perro, el remolino de polvo del
  ambiente (`__sinAmbientePfx`) y el piso que arde (`__apagarSuelos`). Hasta el 19 nov 2026 el fuego de un poder pasaba
  al siguiente (el piso que ardía de la tanda anterior) y Thor se paraba delante de todo: las láminas engañaban. Importar
  un módulo desde la prueba da otra copia si Vite ya lo recargó: los ganchos van por `window`. No correr otras pruebas a
  la vez: se pisan.
- **Poderes en vivo** (`render/poderes_vivos.ts`, Rick, 19 nov 2026: "un rayo de nivel 12 que no funciona bien, la
  combustión de fuego podría verse mejor"). `__sinPoderesVivos` vuelve al dibujo de antes.
  - **Rayo saltarín y Arco voltaico** (`cadena` en `mundo.ts`): salta de a uno cada 0,06 s (`seguirCadenas`, antes todos
    en el mismo cuadro), el primer blanco a no más de 13 casillas del héroe (`ALCANCE_CADENA`) y siempre a la vista, el
    siguiente a 6 del anterior; si el que iba a recibir murió en el medio busca otro. Sin nadie a tiro el rayo cae a tierra
    donde se apuntó (hasta 7 casillas, cortado por el muro): antes no salía nada y el maná se iba igual. Cada arco
    (`arco_cadena`, `arcoCadena`) sigue a los dos cuerpos mientras dura (`de` y `a`, los mueve `actualizar`) y se dibuja
    como relámpago de pixel (`dibujarArcos`): rama principal por desplazamiento del punto medio, una hebra al lado y 2 a 4
    bifurcaciones, rasterizado a puntos enteros en un solo camino por capa (halo, cuerpo, núcleo blanco), se vuelve a
    quebrar 24 veces por segundo, nace grueso, se apaga a tirones y pega con una estrella de pixel. El estallido horneado
    (`impacto_rayo`) solo en el primero: en cada salto tapaba el arco con una bola blanca. Suena un chasquido por salto.
  - **El relámpago que cae** (`efecto(j, 'relampago', ...)`: Tempestad, Furia del firmamento y otros) trae además un rayo
    de pixel que baja del cielo (`arco_cadena` con `cielo`, `za` 230 a 290). Las novas de rayo (Latido galvánico) tiran
    un arco a cada uno que tocan.
  - **Combustión** (`combustion`): el efecto `combustion` dura 2,4 s y el área de daño cae a los 0,2 s (`caida`, con
    `quemar` que deja la marca quemada y `congela` 0,05 s de golpe). Antes era el anillo de fuego del piso
    (`fx_anillo_fuego`), que tardaba casi 4 s y no se leía como estallido. Ahora: implosión (40 motas con su raya que
    acuden en espiral, el punto que se enciende, el aire que tiembla y un anillo que se cierra en el piso), fogonazo y
    onda de pixel en el aire, una bola de pixel en racimo de bocanadas (cinco capas de rojo oscuro a blanco que se
    enfrían de adentro hacia afuera, `disco` con el borde que hierve), la bola de fuego de Doom (`bolaFuego` en
    `fuego_especial.ts`, un disco de fuente que crece 0,1 s, se alimenta hasta 0,24 s y sube en humo; cuatro a la vez
    como mucho, dos en táctil), humo oscuro, brasas (`chispasLibres` de energia.ts) y pedazos de piso que rebotan
    (`itemsPoderes`, en el orden del mundo), el piso que sigue ardiendo (`prender`) y la luz (`luzCombustion`: crece con
    la implosión, golpe y se apaga con el fuego). El sonido de lanzar es `fuego_lanzar` y la explosión suena al caer.
  - **El aire que tiembla** (`calima`): copia lo ya pintado a un lienzo de la rueda (nunca la pantalla sobre sí misma) y lo
    vuelve a pegar en tiras de 2 puntos corridas por una onda. No en táctil. `__sinCalima` lo apaga.
  - Pruebas: `node juego/herramientas/t970_poderes_cerca.cjs <etiqueta> [rayo,suelo,combustion,hab:<id>]` (reloj del
    juego controlado, cuadro a cuadro: el rayo contra seis zombis regados, el rayo a tierra, la combustión sobre tres;
    `VIEJO=1` el dibujo de antes, `CLASE=` para otra clase) y `python3 juego/herramientas/t970_lamina.py <etiqueta>
    [otra]` (`/tmp/requiem-pruebas/poderes/cerca`, al doble). Con el reloj quieto el héroe sale como silueta blanca (el
    pintor espera temporizadores): es de la prueba. Costo: `t971_poderes_fps.cjs [ids]` lanza el poder cada 0,35 s con doce
    zombis, con y sin lo nuevo (en la nube la diferencia queda dentro del ruido, los arcos cuestan 0,1 a 0,3 ms).
  - **La materia de cada poder** (segunda pasada, Rick, 19 nov 2026: "cada poder tiene que verse increíble"; la sangre
    del berserker, el cuerpo a cuerpo y los proyectiles chicos no dejaban casi nada después del golpe). mundo.ts anota de
    qué poder es cada cosa, solo para el dibujo y sin guardar nada: `habEnCurso` (lo pone `resolverHabilidad`, el final
    de la carga y el salto, el remolino, cada proyectil y cada área, que lleva `hab`) llega a `efecto` (`e.hab`, `e.de`) y
    a `danar`, que deja cada golpe del héroe con un poder en `j.golpesPoder` (sitio, rumbo, crítico, si mata, si el blanco
    sangra hueso). `seguirMateria` en poderes_vivos.ts los consume y suelta la materia del elemento: sangre en abanico con
    gotas que caen y manchan (`ponerMancha`, forma gota) y pedazos que rebotan, el tajo en media luna del color del poder
    (cuerpo que tapa y filo blanco sumado, los golpes de un combo alternan el lado), chispas de acero, astillas de flecha,
    de hueso, de hielo y de vidrio (giran y destellan), el reventón de pixel del proyectil (`puf`, cinco capas por elemento
    que se enfrían de adentro afuera), estrellas de pixel, el haz de luz que baja con su runa, espinas, púas de hueso y de
    hielo que brotan (`puas`), la ola de sangre (`ola`, cresta que corre partida por delante y por detrás del héroe y suelta
    gotas), fuentes de sangre, remolinos de viento, grietas en el piso que brillan mientras están frescas (lava, sangre,
    rayo) y polvo. La Sangría y la Ejecución beben: hilos de sangre que vuelven al héroe. La carga y el salto dejan polvo
    (el Torrente un reguero de sangre) y al llegar rajan el piso con un golpe seco de cámara (`patada`, lo baja
    `acc.temblor`). Los frascos del alquimista estallan en vidrio con lo que traían. Los proyectiles chicos llevan cabeza
    viva (`cabezaFuego` en racimo de pixel con su cola, `cabezaRayo` que chisporrotea y pica el piso, `cabezaHielo` que
    destella) y sueltan brasas, escarcha, gotas o polvo de hueso en el vuelo. Las definitivas tienen un golpe propio por
    elemento (`definitiva`): luz, haces y runas; sangre, dos olas, fuentes y charco; hueso, anillo de púas y grieta morada;
    bosque, espinas y hojas; frío, púas de hielo; rayo, cinco rayos del cielo; fuego, la bola de la Combustión sin la
    implosión (`sinImplosion`); tierra (Ira del jarl, Rugido, Cacería), grieta, piedras, polvo y hojas. La salpicadura de
    sangre horneada no se dibuja si el golpe es de un poder (`sinHorneado`): salía borrosa encima del tajo. Las áreas que
    pegan cada medio segundo sueltan menos. Topes: 520 piezas y 90 marcas (220 y 40 en táctil, donde todo va a la mitad).
    Sin lecturas del lienzo y sin cachés nuevos. `__sinMateria` lo apaga (`VIEJO=1` en t760 y `SIN_MATERIA=1` en t970;
    `CERCA=1` en t970 pone los zombis pegados para el cuerpo a cuerpo).
    Medidas (19 nov 2026, en la nube): t971 con `CLASE=berserker BANDERA=__sinMateria` lanzando el Río carmesí cada
    0,35 s sube el tramo `otros` del mundo de unos 2 a 3,6 a 4,5 ms; la Marea roja y el Lamento del osario quedan dentro
    del ruido. t781 mide con mucho ruido (lo de `(nada)` va de 19 a 32 % entre corridas): el Orbe glacial da 44 a 55 %
    con y sin la materia, no se movió por esto. `SIN_MATERIA=1` en t781 compara.
  - **De día los fogonazos no lavan la pantalla** (`nochePfx` en pfx.ts, 0 a pleno día y 1 desde 0,55 de oscuridad): el
    resplandor de pantalla entera de energia.ts y el destello de luces.ts van de 20 % a pleno día a entero de noche, los
    fogonazos de impacto al 60 % y el halo grande de la Combustión al 35 % (en el desierto la pantalla quedaba naranja una
    décima de segundo). Medido con la Combustión en las dunas: el rojo de más en una esquina lejos del estallido bajó de
    unos 29 a unos 12 niveles (lo que queda es la sacudida de cámara). `__fogonazoParejo` vuelve a lo de antes.
  - **Tercera pasada: invocaciones, trampas, auras, mejoras y el tajo** (Rick, 19 nov 2026: "nada afuera, nada a
    medias"). `render/presencias.ts` y `render/tajos.ts`, todo a puntos enteros, en el orden del mundo y sin lecturas del
    lienzo (en táctil la mitad de motas y el tajo a pasos de 2). mundo.ts solo anota lo que se ve, sin guardar nada:
    `nace` y `habInv` en cada invocado, `ang` y `tiro` en la torreta, `disparo` y `j.trampasDisparadas` cuando salta una
    mina (con `habEnCurso` puesto, así la trampa suelta su materia), `j.pulsosAura` (`pulsoAura`) cuando el aura toca a
    alguien (el fuego de la brasa santa, las púas del zarzal, el golpe con el brío, la presteza, la sentencia o la llama,
    el golpe recibido con la firmeza) y `sinHumo` en la maldición que solo frena o baja resistencias (la Sentencia y las
    raíces del Despertar del bosque ya no llevan el humo morado y la calavera de `fx_maldito`).
    - Invocaciones: los esqueletos, el sabueso y el gólem suben del piso armándose (la muerte al revés, `surgiendo` con
      `surgeT` 0,75, también para `tipo: 'invocado'` en escena.ts); las bestias, el árbol, el espíritu y el halcón toman
      cuerpo (`alfaInvocado`). Cada uno llega con lo suyo (grieta con luz morada o de brasa, sello que se dibuja, huesos
      que asoman y almas que suben; charco que hierve y fuentes el gólem; sello verde, hojas y motas en espiral las
      bestias; haz el espíritu; picada con plumas el halcón) y se va con lo suyo. De a muchos (la Legión) solo el primero
      enciende la luz del centro. El aro de los pies toma el color de cada uno (`aroInvocado`).
    - Trampas: la torreta es una ballesta en trípode que apunta al blanco, retrocede al tirar y se desarma al gastarse; el
      cepo, un aro de dientes con un brillo que corre y que se cierra de golpe al morder; el pilar de chispas, una púa con
      su runa y arcos chicos; la mina de brasas, una olla enterrada que respira; el coto, brasas de oro y runas de rayo
      unidas por un hilo de runas; el corro, seis hongos que sueltan esporas. Saltan con lo suyo (la brasa con la bola de
      la Combustión chica, la runa con un rayo a cada uno que la pisó, las esporas, las mandíbulas). El glifo horneado
      `glifo_trampa` y la explosión de piedras del cepo ya no se dibujan.
    - Auras: un sello bajo los pies (dos aros, seis glifos de su aura que giran, cuatro brazos, sombra oscura debajo para
      que se lea sobre arena), el borde del campo a trazos que respira, motas del elemento dentro del campo, un latido cada
      2,4 s y lo propio de cada una (llamitas, púas, viento, hojas). Va en el piso: lo tapan el cuerpo y los muros y no se
      pinta donde no hay piso.
    - Mejoras (`BUFF`): un estallido al pedirla (grito, metal con el brillo que baja por el cuerpo, sangre, luz, cura,
      escarcha, rayo, viento, bestia, vidrio, piedra, hueso), mientras dura el canto del cuerpo de su color (la silueta
      corrida un punto a cada lado, detrás del cuerpo, `rimHeroe` y `siluetaCuadro` en motor/assets.ts) y pocas motas, y al
      terminar se apaga. Las que tienen dibujo propio no llevan el bucle horneado del lanzador (`tieneEstilo`): la burbuja
      de oro del escudo divino salía en el tónico, la piel de yunque, el mantra y la cortina. La armadura de hueso son
      placas de hueso que giran alrededor del pecho (las calaveras horneadas no van).
    - El tajo (`TAJO` en tajos.ts, una fila por golpe): la media luna sigue la punta del arma de cada cuadro horneado
      alrededor del pecho y se abre un poco más allá, a la medida del alcance; solo el golpe (el tramo que gira rápido
      con la punta bajando), no el levantar del arma. Cuerpo oscuro que tapa, el color del golpe y el filo encendido;
      gruesa pasando la mitad y fina en la cola. Se pinta como su propio paso del orden, delante de los enemigos pegados
      (`tajoPend` en escena.ts, a 1,1 casillas delante del héroe: más lejos se pintaba encima del muro de delante). Además estocadas (lanza), conos de puño con su anillo de choque (rayo, fuego, piedra,
      eco), la cuña del escudo, las tres uñas del druida y las fauces de la Mordida, el segundo arco del Hachazo de
      barrido, las tres rayas del Desgarro, runas en el Corte del sello y el aro de acero del Remolino de hierro. La media
      luna del blanco sale del mismo estilo, más grande, con chispas de su color, y el crítico de un poder cuerpo a cuerpo
      congela 0,07 s como mínimo. Las medias lunas grises horneadas (`fx_tajo_espada`, `fx_hachazo`, `fx_zarpazo`...) ya
      no se dibujan.
    - De día: los efectos horneados grandes de luz sumada bajan además según su ancho (`dibujarPfx`: uno de 200 puntos
      queda a pleno día a un 55 % de lo de antes) y la luz de los efectos y las áreas en luces.ts va de 45 % a pleno día a
      entera de noche. El resplandor del rayo también baja de día. `__fogonazoParejo` vuelve a lo de antes.
    - `__sinPresencias` y `__sinTajos` apagan lo nuevo. Pruebas: `t975_poderes_lento.cjs <clase> <etiqueta> <ids>` (el
      juego en cámara lenta con `__camaraLenta` y el pintor vivo, sin la silueta blanca del reloj quieto de t970; `CERCA`,
      `FIN` termina la mejora a mitad, `ZONA`, `VIEJO`, `FOGONAZO`) y `t975_lamina.py <etiqueta> [otra]` en
      `/tmp/requiem-pruebas/poderes4/cerca`. t760 y t970 dejan cada poder limpio de verdad (el aura activa, las trampas que
      seguían tirando, los cuervos, la armadura de hueso, la tempestad, el huracán, el remolino, la furia fija, las cargas y
      lo que guardan los módulos de dibujo por `window.__limpiadores`), ponen cadáveres para los que levantan muertos (antes
      salía "Necesito un cadáver" y la lámina vacía) y arman las trampas en un sitio libre que un zombi pisa a mitad.
    - **Cuarta pasada** (Rick, 20 nov 2026: "no dejes nada por fuera ni a medias"). Lo que la tercera dejó flojo:
      - Cadáveres del nigromante: el Estallido fúnebre, la Cosecha del osario, el Festín de tumba y la Ofrenda salían vacíos en
        las láminas porque la auditoría no ponía cadáveres ni siervos. Ahora el muerto se hincha 0,18 s y revienta
        (`revienta` en el monstruo, solo visual, lo pone mundo.ts: el golpe del Estallido y de la Cosecha cae cuando revienta,
        antes caía en el acto), el cuerpo deja de pintarse y `cadaver` en poderes_vivos.ts suelta hueso y carne en cuatro
        rumbos, costillas que giran, un aro de púas, el charco y en la Cosecha almas moradas y huesitos que vuelven al héroe.
        El Festín seca y hunde el cuerpo (`consume`) y le bebe la sangre y un alma verde al héroe. La Ofrenda revienta al
        siervo en sombra con su grieta morada. El que revienta queda 2 s más en la lista (`tMuerto` 598) para hincharse.
        `__sinHincha` apaga la hinchazón. De cerca: `t981_cadaver.cjs <id> <etiqueta>` (un muerto suelto, cámara lenta,
        lámina en `/tmp/requiem-pruebas/poderes4/cadaver`, `SIN=1` sin lo vivo).
      - Puños del monje: rayas de velocidad detrás del puño, el puño encendido de su color y un aro de choque grueso de canto
        (`puno` en tajos.ts). En el blanco, en vez de la media luna, la onda de choque (`choque`: dos anillos de canto, tres el
        Puño del eco, rayas, estrella, aro en el piso y lo del elemento: rayos a tierra, fuego, piedra). El barrido horneado de
        cuerpo a cuerpo de los puños y del escudo (el gancho naranja del Codo de piedra) no va. El Golpe de escudo usa la misma
        onda, con estrella blanca, astillas de acero y cheurones de aire gruesos desde el escudo.
      - Aturdido y presa marcada: las cruces negras de `fx_aturdido` y los corazones de `fx_presa_marcada` (status/charmed) se
        cambiaron por cuatro estrellitas de oro que giran sobre la cabeza (`dibujarAturdido`) y una mira roja de pixel
        (`dibujarMarcaPresa`), en electro.ts.
      - Golpes pesados: el arma viene horneada arriba en un cuadro y abajo en el siguiente. El salto grande se toma como el
        barrido entero (`salto` en `arcoBarrido`), la media luna nace completa en el cuadro del golpe y con cuerpo lleno
        (`lleno` en `mediaLuna`), y lo que sigue después del golpe ya no la alarga. `__tajoDbg = []` guarda las muestras.
      - Orden del tajo: va justo después del cuerpo del héroe (lo de delante lo tapa) y se pinta otra vez justo después de
        cada enemigo pegado de delante, recortado a su cuerpo (los del cuadro anterior, `picksAnt`), sin pintar dos veces
        donde se enciman. `__tajoViejo` vuelve a lo de antes. Prueba: `t980_tajo_muro.cjs <clase> <ids>` (muro del cementerio
        en las dunas, `HX`, `HY`, `MX`, `MY` ponen al héroe y al zombi, capturas en `/tmp/requiem-pruebas/poderes4/muro`). El
        porcentaje que imprime no sirve de mucho: el muro que tapa al héroe se vuelve translúcido igual.
      - Coro de los sellos y Ascenso del espíritu: la columna que nace en el héroe (el haz del centro, `pilar_luz`, `castigo` y
        el fogonazo de la definitiva en energia.ts, `tras`) va detrás del cuerpo (`colDetras` en escena.ts), y su luz en
        luces.ts baja además a 40 % a pleno día. El héroe queda delante de la luz.
      - Manto de escarcha: `fx_estallido_copos` venía opaco. De día va a medias opaco y a medias sumado (`SUMA_LUZ` en pfx.ts),
        de noche como siempre.
      - Halcón: llega en picada (`picadaHalcon` en presencias.ts: la silueta de pixel con su estela, la sombra que se acerca,
        el golpe de aire, plumas y polvo, y remonta con las alas abiertas). La Picada hace lo mismo sobre el blanco con tres
        garras (la de `tajo_garras` horneada no va). La Mordida rabiosa cierra dos hileras de colmillos sobre el blanco
        (`fauces`), arranca carne y la vida vuelve al héroe en hilos.
      - Cuervos y halcones de los poderes: eran una V de línea negra encima de todo. Ahora pájaros de pixel que aletean, miran
        hacia donde vuelan, bajan a picotear y llevan su sombra, en el orden del mundo (`dibAve` en presencias.ts). Cada
        picotazo lleva su poder (`habEnCurso`) y suelta plumas y sangre.
      - Auditoría: t760 y t975 ponen cadáveres para todo poder de `efecto: 'cadaver'`, dos esqueletos para la Ofrenda y el
        halcón para la Picada, y el templario lleva escudo (t760 siempre, t975 con `ESCUDO=1`, se espera al pintor). t975
        guarda en `/tmp/requiem-pruebas/poderes4/cerca`.
      - Formas del druida (solo se miró): el héroe no se vuelve bestia, solo cambia de tono y de tamaño (`h.tinte`,
        `h.escala` en mundo.ts). El lobo se podría pintar con el atlas de `lobo_sombrio` (quieto, caminar, correr, atacar,
        herido y morir en 8 rumbos) sin hornear, pero el oso no tiene cuerpo propio (el oso invocado es el ogro teñido) y
        hay que armarlo en el motor y hornear `b` y `f`.
- **Arreglos del 20 nov 2026** (video de Rick en una cripta):
  - **Luces que saltaban** (`recolectar` en `luces.ts`): con más de 18 luces el tope elegía por peso, y el peso tiembla (radio
    con azar, fuego de Doom que late): las del borde entraban y salían cuadro a cuadro. La que ya está adentro pesa 1,8
    veces más y la que entra o sale se funde en 0,25 s (`presencia` por id, hasta 6 de más mientras se apagan).
    `__lucesSaltan` vuelve a lo de antes. `t996_luces_saltan.cjs` (`VIEJO=1`): 174 saltos en 960 cuadros antes, 2 ahora.
  - **Enemigos contra los muros** (`avanzar` en `mundo.ts`): van directo solo si pasa el cuerpo entero (`lineaPasable`, la
    línea de un punto se pegaba a las esquinas), el camino dura hasta gastarse o 0,7 s, se pide otro si en medio segundo no
    avanzó (8 caminos por cuadro como mucho) y `apartarDeMuros` no deja el centro a menos de 0,3 de un muro.
    `__atascoViejo` vuelve a lo de antes. `t995_atascos.cjs` (`VIEJO=1`): 6 atascados de 168 antes, 0 de 160 ahora. Ojo: Thor
    atrae a los enemigos, la prueba solo cuenta los que van por el héroe. No editar código mientras corre (Vite recarga).
  - **Embestida que se deslizaba** (`avanzarManiobra`): movía el cuerpo sin sumar `recorrido`, de donde sale el cuadro de
    caminar y correr: el jefe o el bruto se corría con la imagen congelada. Suma lo recorrido y el rumbo (también en el paso
    atrás del aviso). `__embestidaVieja` compara. `t997_embestida.cjs [id] [etiqueta]` (lámina en `/tmp/requiem-pruebas/embestida`).
  - **Descarga prismática**: sin cargas dispara un rayo simple al 80 % (antes se negaba con un aviso y parecía rota).
  - **Pozos**: avisan "está seco" o cuánto llenaron (antes nada en ninguno de los dos casos).
      - Formas del druida: en la cuarta solo se miró (el héroe cambiaba de tono y de tamaño). Hecho en la quinta, abajo.
    - **Quinta pasada** (Rick, 20 nov 2026: "metele y déjalo bien perfecto"). Lo que la cuarta dejó flojo:
      - **Formas del druida de verdad** (`render/formas.ts`). Con la Piel de lobo o la Piel de oso el héroe ES la bestia:
        `lobo_druida` (el lobo de `bestias.ts` más grande, gris plata con el pecho claro y ojos de ámbar verde, para no
        confundirse con los lobos sombríos) y `oso_pardo` (cuerpo nuevo: giba, panza, patas cortas y gruesas, cuatro uñas
        claras, cabeza ancha de hocico corto, orejas redondas, pelo largo en la gorguera y el lomo; ataca alzándose y
        descargando la zarpa derecha, `ataque: 'zarpazo'`). Las dos traen 'especial' (el lobo aúlla sentado, el oso se alza
        y ruge), que es lo que se ve al lanzar (`accForma`). `cuadrosForma` da los cuadros con el rumbo real en 16 al andar,
        `zancadaForma` el ritmo de patas (las patas no patinan), las huellas son de pata (`pisadaHeroe.bestia` en
        ambiente.ts) y el golpe sin poder también es de la bestia (`estiloTajoDe` y `TAJO_FORMA` en tajos.ts: el lobo muerde,
        el oso desgarra, con `bocaForma` a su altura; mundo.ts anota ese golpe en `golpesPoder` solo para el dibujo). El
        cambio dura 0,5 s (`vistaForma`): el cuerpo de antes se encoge y se enciende de verde musgo, a los 0,21 s pasa al
        otro, que crece con un rebote mientras se apaga, y presencias.ts suelta la luz verde que acude en espiral, el pelo
        de la bestia, hojas, polvo, un anillo, los rayos y el golpe de cámara (`cambioForma`). El remolino de hojas horneado
        del lanzador y el canto de la mejora no van en forma. **Nada del juego cambia**: estadísticas, choque, velocidad y
        `h.escala` siguen igual (la escala la leen los números y el peso del golpe) y nada se guarda. Los atlas de las formas
        bajan con la zona si el druida tiene el poder (`atlasZona` en main.ts). El Oso espíritu se pinta con el oso pardo
        (`aspecto` en `INVOCADOS`): la ficha, la huella y la escala siguen siendo las del ogro. `__sinFormas` vuelve a todo
        lo de antes. Lab sin servidor: `npx tsx juego/herramientas/t995_formas_lab.mts <id,...> [acciones] [rumbos]`; en el
        juego `t995_formas.cjs [acciones] [rumbos]` (druida, lobo y oso lado a lado en cada acción y rumbo con
        `__poseHeroe`, el cambio de forma en cámara lenta y el Oso espíritu) y `python3 juego/herramientas/t995_lamina.py`
        (láminas en `/tmp/requiem-pruebas/poderes5`).
      - **Menos blanco en el golpe**: Puño de rayo, Coro de los sellos y Ascenso del espíritu dejaban al héroe y al blanco casi
        blancos una décima de segundo, sobre todo de noche. Los puños pintan su color tapando y suman solo el alma
        (`kdia × 0,7`), el núcleo del puño es más chico, el anillo de choque pinta el color y suma el filo fino a media
        fuerza, la estrella del contacto va del color del golpe, los rayos a tierra del puño son chicos (`chico`: arco fino,
        resplandor chico y luz de 70 puntos en vez de 220), la radiografía del rayo es celeste a 0,4. En las definitivas
        de luz que nacen en el héroe: el haz es de oro, tapa a medias y su alma es de un punto, el del centro chico (1,1),
        las brasas de oro, la columna horneada a 0,45 (0,37 de noche, `alfaEf`), su luz en luces.ts a 0,3 de día y 0,5 de
        noche (antes 1 de noche), de oro y sin el destello de pantalla, el fogonazo chico va detrás y la pantalla, los
        anillos y el fogonazo de toda definitiva bajan (0,13, 0,42 y 0,32). Todo golpe cuerpo a cuerpo de un poder (no
        definitivo) revienta en energia.ts a 0,4 (`suave`: ya tiene su materia), su fogonazo en el héroe va detrás a 0,2 y
        su luz en luces.ts a la mitad (`GOLPES`). `__blancoViejo` vuelve a lo de antes. Medida: `python3
        juego/herramientas/t996_blanco.py <etiqueta...>` sobre las capturas de t975 (que ahora guarda `<id>_pos.json` y
        acepta `NOCHE=1`, la oscuridad de la zona a 0,85 en el mismo sitio, y `BANDERAS=`): puntos casi blancos (los tres
        canales en 225 o más) en la caja del héroe y del blanco, peor cuadro. Puño de rayo (pegado) de día 14,9 y 26,6 % a
        3,8 y 4,5, de noche 43,5 y 67,8 a 8,5 y 15,8; Ascenso de día 23,5 y 14,8 a 7,3 y 4,2, de noche 48,8 y 30,2 a 8,7 y
        12,5; Coro de los sellos de noche 54,7 y 27,7 a 25,2 y 7,3, de día 21 a 22 (lo que queda es la columna y los
        anillos detrás y debajo del templario, no su cuerpo: falta bajarla más sin que la definitiva se apague).
      - **Cuervos y halcones de pixel del doble** (`spriteAve` en presencias.ts): unos 18 a 22 puntos de envergadura,
        armados una vez por especie, rumbo (16), aleteo (8) y plegado: alas en tres cuartos (la de cerca baja, la de lejos
        sube, en X planas, en V arriba), cola en abanico, contorno oscuro, luz arriba, el pecho claro del halcón, ojo y pico
        con su punto de luz; las primarias del cuervo abiertas como dedos. La sombra crece con el pájaro y se achica con la
        altura. La picada del halcón usa el mismo halcón, plegado y apuntando a donde cae, y abre las alas al remontar.
        `__avesViejas` vuelve a lo de antes. Lámina: `t996_aves.cjs` (`/tmp/requiem-pruebas/poderes5/aves_lamina.png`, y la picada
        en cámara lenta con `__picadaHalcon` en `poderes5/picada`).
      - **Festín de tumba** (se leía flojo): el muerto se seca 0,65 s (antes 0,32, solo lo que se ve): late rojo, se pone
        gris ceniza, se aplasta y se ensancha a tirones y al final la cáscara se deshace en polvo y huesitos. Un chorro grueso
        de sangre (`chorro` en poderes_vivos.ts, en arco, con las rayas que fluyen hacia el héroe y el alma verde enroscada)
        sale del muerto y entra en el pecho del héroe, suelta gotas que manchan el piso, y cuando llega el héroe late
        (`latido`: dos aros rojo y verde y una cruz de luz). `__festinViejo` vuelve a lo de antes. De cerca:
        `ANCHO=240 DESDE=0 node juego/herramientas/t981_cadaver.cjs festin_tumba <etiqueta>` (`VIEJO=1` el de antes).
      - t975 elige el sitio lejos de toda salida (24 casillas, se afloja a 18 y 14 si no hay): el remolino del umbral "Volver
        a El Oasis" entraba en los recortes.
- **Fogonazos**: los de `energia.ts` no se apilan y van bajos sobre el héroe. Los efectos que se suman como luz bajan
  con la claridad de la zona (`claridadPfx`). Un efecto grande y opaco plantado sobre el héroe va a media fuerza.
- **Maldiciones**: cada una lleva su efecto (`MALDICION_PFX` en `mundo.ts`). La jaula de hueso es solo del nigromante.
  Lo que inmoviliza sin ser hielo marca `preso` ('raices' o 'hueso') y no se dibuja como bloque de hielo.
- **Estados sobre el cuerpo de verdad** (`render/electro.ts`, Rick, 19 nov 2026: un jefe grande se electrocutaba con la
  silueta de un muñeco genérico). `fx_electrocutado`, `fx_congelado` y `fx_envenenado` traían horneado el contorno de un
  cuerpo humano de 50 puntos. Ahora el rayo (`electroT`, lo pone `danar` con daño de rayo, no se guarda) dibuja arcos que
  nacen en el borde del cuadro que se ve, corren por dentro de la silueta y saltan afuera, con parpadeo del sprite y luz
  azul; el frío pone escarcha en lo que mira arriba, motas y piso escarchado del ancho del cuerpo; el veneno burbujas,
  gotas y charco a su medida. La silueta sale de leer el cuadro una vez (`mascaraDe`, como mucho 3 lecturas nuevas por
  cuadro). Lo que va sobre la cabeza (aturdido, confundido, maldito, la marca) se sube a la cabeza real (`cabeza` en
  `dibujarPfx`): con el tope de grano no crecía con el cuerpo. Prueba: `t900_electro.cjs <ids> <etiqueta>` (`ESTADO=frio`,
  `veneno`, `aturdido+marca`...). `__sinElectro` y `__estadosViejos` para comparar.
- **El rayo no cruza muros** (Rick, 19 nov 2026): la cadena le pegaba al enemigo apuntado aunque hubiera un muro en
  medio (el primer salto no miraba la línea de vista desde el héroe). Ahora el primero tiene que verse desde la mano y
  `lineaLibre` mira a cuartos de celda (a media celda una diagonal saltaba la esquina). Prueba: `t940_rayo_muro.cjs [zona]`
  (héroe y zombi con un muro en medio: 0 golpes; sin muro: todos).
- **Números de daño** (`render/numeros.ts`): cifras de pixel con canto negro, brinco y apertura lateral, sin encimarse.

- **Ríos**: el camino cruza el agua siempre por un puente, nunca por vado (se veía igual que lo hondo y Rick creyó que
  se podía atravesar el río). También donde el arreglo de conectividad abre paso.
- **Rodela**: puesta usa el modelo del ícono como los demás escudos (quedaba afuera por el nombre).
- **Frases de jefes y campeones**: van encima de todo en una placa (`frasesMonstruos`), no dentro del orden del mundo.
- **Mapa y minimapa** (`dibujarMapa` y `SIGNO` en `ui/juego_ui.ts`): cada cosa lleva su signo de pixel (carpa dorada
  al campamento, cada salida según su rumbo, flecha verde otra región, casita, óvalo celeste tu portal, rombo azul piedra de
  viaje, cofre, altar, calavera jefe, misión nueva y por entregar). El mapa grande trae la leyenda de lo que hay a la vista.
- **Salidas por su rumbo** (`mundo/rumbos.ts`, Rick, 19 nov 2026: "identificar bien los portales que suben y los que
  bajan"). Antes el signo salía del tipo del destino: en una mazmorra la escalera de subir y la de bajar eran la misma boca
  morada, y el umbral del mundo el mismo verde azulado. `rumboSalida` da bajar (flecha abajo y escalera que baja, brasa),
  subir (flecha arriba y escalera que sube, azul frío), superficie (arco abierto con la flecha arriba, cielo pálido),
  guarida (calavera sobre la escalera que baja, carmesí: el destino tiene `jefe`), región, campamento y casa. Sale del
  `lado` de la salida y del nivel (`nivelMazmorra`, contado desde la superficie por la salida 'arriba'). Las Islas de Oro
  son mazmorra pero se cruzan por los costados: cuentan como superficie (`honda`). En las mazmorras de varios niveles el
  signo lleva la cifra del nivel (`cifraMapa`, 3 x 5) y el nombre dice "Catacumbas, nivel 3". El mapa grande lista cada
  salida vista con su verbo y destino en la leyenda (filas de 22 por los signos de 9 x 9) y el ratón sobre un signo da la
  pista (mapa grande y minimapa de PC). En el mundo el umbral, su halo y su luz en el piso toman el color del rumbo, el
  letrero dice "Bajar a ..." o "Subir a ..." y tres cheurones de pixel caen o suben sobre la escalera, pintados después de
  la luz (dentro del orden los tapaba el sprite de la escalera). Nada guía ni revela: solo lo ya explorado, sin marcar la
  salida "que sigue" (Rick quiere explorar). `__sinRumbos` vuelve al umbral y al letrero de antes. Prueba:
  `t952_salidas_mapa.cjs <etiqueta> [zonas]` (camposanto, abadía 2, catacumbas y páramo: mapa grande y cada salida con el
  minimapa) y `python3 juego/herramientas/t952_lamina_mapa.py antes despues` (`/tmp/requiem-pruebas/mapa/lamina_mapa.png`).

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

- **Viento sin mover el piso** (`escena.ts`, Rick, 19 nov 2026: la horca, el árbol del ahorcado y otras piezas del
  campamento se corrían desde la base): lo plantado se mece de la franja del piso para arriba (`PISO_QUIETO`, el pie, las
  raíces y la sombra horneada no se mueven) y el péndulo (`CUELGA`) es solo para lo que cuelga suelto sin apoyo dibujado.
  Antes `CUELGA` agarraba por el nombre horcas, mástiles, postes y armas clavadas.
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
- **HUD forjado (el de por omisión desde el 19 nov 2026)** (Rick: "un HUD que cubra todo el borde de abajo como
  Diablo 2, encima del juego y no en una franja negra", y lo aprobó el mismo día). Sale en PC, iPad y teléfono. Opciones,
  HUD (Forjado o Clásico) guarda el campo opcional `opciones.hud = 'clasico'` para volver a la barra de siempre (sin el
  campo es el forjado, `hudForja()` y `fijarHud` en `nucleo/lienzo.ts`). `window.__hudNuevo` (true o false) manda por
  encima, para las pruebas. La red de seguridad sigue: si la pantalla de PC no tiene ancho para el panel va la barra.
  - **Rehecho el 20 nov 2026** (Rick: "un HUD mejor que el de Diablo, con intención"; la crítica: los orbes metidos 160
    puntos adentro robaban ancho de pelea, seis renglones de mensajes encima de la pelea, piedra muerta en la banda, el
    recurso de la clase no se entendía y el canto de arriba era un corte recto). Mismo taller, otra disposición y otro
    sentido. Lo de abajo describe lo de ahora.
  - PC (`ui/hud_forja.ts`, geometría y talla en `ui/forja_panel.ts`): los orbes anclan las esquinas (centro a 64 puntos
    del borde a 720, antes 240) en casas de arco apuntado más chicas; la gárgola (vida) y la doliente (maná) se asoman por
    detrás del riñón de cada casa, sobre su pedestal. El medio es una consola baja (62 puntos a 720, antes 88; 112 a 1080,
    antes 156): las placas del menú de a dos por dos en las puntas (personaje, inventario, habilidades, mapa | agresivo,
    correr, registro, menú), los dos poderes en torres que rompen la cornisa con el botón del ratón grabado en la cresta,
    cinco atajos a cada lado con su tecla, el cinturón partido en dos pares (1 y 2, 3 y 4, cada uno con su tecla y sus
    cuentas en la misma fila) y en el centro el **altar**: arriba la Marca (el rosetón) en su frontón y abajo el nicho de
    la reliquia de la clase. La experiencia corre por la cornisa de pozo a pozo. Pináculos en cada pilastra, y la sombra del
    panel sobre el mundo es larga y suave (`sombraMundo: 14`). Entre cada casa y la consola va un hombro de muro bajo (y
    más allá de las casas en pantallas de más de 1494 puntos de dibujo). El núcleo pide 924 puntos (antes 936).
    Lo tallado: 11,1 % de la pantalla a 720 (antes 14,8), 13,4 % a 1080 (antes 17,1): 34 mil y 77 mil puntos más de mundo.
  - **La Marca es el corazón del HUD** (`ui/forja_viva.ts`, `pulsoHud`): el rosetón del nivel es la brasa que el héroe
    lleva clavada (`dibujarRoseton(..., brasa)`, solo el forjado: el esmalte es carbón con manchas que arden). Respira con
    la experiencia hecha, arde al subir de nivel (y la canaleta de la experiencia relumbra), late con aros cuando la voz
    de la Marca habla (`vozMarca` deja `j.vozMarcaHud`), late más con un jefe despierto, se cubre en los pueblos y con el
    héroe muerto el panel entero se apaga y ella no (canon: la Marca que no se apaga). Fisuras encendidas en el frontón y
    chispas que suben.
  - **El estado hecho cosa**: vida bajo 30 %, las grietas de la casa sangran luz con el latido y bajo 25 % el vidrio del
    orbe se raja (entero al morir); la vela de la doliente es el maná (se consume, con menos de un cuarto tiembla y humea,
    sin maná o sin lo que cuesta el poder derecho se apaga); la racha de 3, 5, 8 y 12 muertes (`j.racha`) hace correr
    sangre por la piedra, que se seca en 12 s y se va en 30; en el aro del orbe de vida el veneno (cuentas verdes y
    burbujas), la escarcha (agujas hacia adentro), el sangrado (regueros por el vidrio) y el fuego recién recibido
    (`h.ardeT`, lo pone `danar`); el trago sube por el orbe (`h.bebio`, lo pone `beberPocion`) y la copa relumbra; con un
    jefe cae ceniza con brasas y se junta en el canto de la piedra. Nada de esto se guarda.
  - **El jefe** (`ui/forja_jefe.ts`): un dintel de piedra con herrajes que baja colgado de dos cadenas, rebota y queda;
    la vida es un canal de sangre con el tramo recién quitado en pálido, se sacude con cada golpe y al morir el jefe las
    cadenas lo sueltan. La frase del jefe sigue debajo. La barra de siempre queda para el Clásico.
  - **La reliquia de la clase** (`ui/forja_reliquia.ts`, `reliquiaClase`; `recursoClase` queda para el Clásico): arcanista,
    tres gemas engastadas que se encienden del color del elemento guardado (Rick no entendía las cargas); berserker, un
    canal de brasa con casquillos que arde al tope; monje, tres cuentas en un cordón que se consume; nigromante, seis
    calaveras; cazadora, halcón, mira con las marcas y cepo con las trampas; templario, el sol del aura con su nombre y su
    fuerza; druida, hombre, lobo y oso con el tiempo de la forma; alquimista, sus frascos (el que se llena, a medias).
    Con su rótulo abajo y la ayuda al pasar el ratón (en el táctil, tocándola).
  - **El registro** (`ui/registro.ts`): los mensajes son a lo sumo tres renglones en combate (cuatro fuera), cada uno
    cortado a dos, y se van en 5 s (antes seis renglones largos durante 7 s). Nada se pierde: `msg` guarda todo en
    `registroDe(j)` (300 líneas, no se guarda en la partida) y el registro entero se abre con H, con su placa en la consola
    o, en el táctil, con su botón junto a la misión. Rueda, flechas o arrastrar; H, Esc, la X o un clic afuera lo cierran.
  - Pruebas de lo nuevo: `t955_hud_estados.cjs <etiqueta> [vistas] [estados|recursos|todo] [clases]` fuerza cada estado
    con ganchos (vida, maná, estados, trago, racha fresca y seca, nivel, voz, mensajes, registro, jefe, pueblo, muerte y
    la reliquia de cada clase vacía, a medias y llena) y `python3 juego/herramientas/t955_lamina.py <etiqueta> [vistas]`
    arma las láminas en `/tmp/requiem-pruebas/hud2/estados`. `window.__hudPulso` es el pulso del último cuadro.
  - Costo (`t956_hud_costo.cjs [vistas]`, la fase interfaz del F3 con la vida fija; `PARTES=1` cada estado por separado;
    `URL=` otro servidor para comparar): en la nube, quieto 0,44 a 0,47 ms a 720, 0,42 a 0,54 a 1080 y 0,57 a 0,70 en el
    teléfono (antes y ahora). Con vida al 12 % suma 0,1 a 0,15, veneno 0,05, racha 0,03, el jefe nada que se mida. Con todo
    a la vez (12 % de vida, veneno, jefe y racha de 12) a 1080 sube de 0,43 a 1,0 a 1,4: ese caso sí pasa de 0,3 ms.
    El dintel del jefe y los mensajes se dibujan en `dibujarArriba`, fuera de esa fase (igual que la barra de antes).
    Ojo: `t950` mide con la vida subiendo (cuadros nuevos del orbe) y da números que saltan de 0,5 a 20 ms; no sirve
    para comparar. `t950`, `t953` y `t951` aceptan `SALIDA=`, y `t650` y `t651` ahora `URL=`.
  - Todo se esculpe en un mapa de alturas con material (`Taller` en `forja_taller.ts`: formas con bisel por distancia de
    chaflán, elipsoides y cápsulas con unión suave, anillos, pozos, surcos, sillares) y se hornea una vez por tamaño con la
    luz de la barra: normales, sombra que cae, oclusión, contorno y tramado (unos 150 a 400 ms la primera vez, `__hudForjaMs`).
    Por cuadro solo van los orbes (`orbe` del motor con el nivel a punto entero, cacheado, dos nuevos por cuadro como mucho),
    los íconos, las recargas, las cuentas y los números.
  - Pixel entero: el panel va en puntos de dibujo de D puntos del lienzo (D = redondeo de RES × 1,15: 1 a 720, 2 a 1080 y
    1440, 3 a 2160) pegados en el espacio del aparato. A 1080 va la talla compacta. El rosetón se dibuja con `rejilla`.
  - Casillas de poder (`ui/forja_habilidad.ts`, Rick: "mucho, mucho mejores"): el ícono de `iconos_hab.ts` pintado al
    tamaño exacto, con bisel de vidrio a pixel (`iconoPixel`), la sombra que gira a pixel con los segundos,
    tinte azul sin maná y rojo sin furia, encima y apretado, y un destello al quedar listo. Lo usan el panel de PC, los
    medallones del táctil y la elección de poderes (`casillaElegir`, solo con el HUD forjado).
  - Cámara: `ALTO_HUD` en `lienzo.ts` (96 el de siempre) entra en `aPant`, `aMundo` y la cámara del jefe. El panel pone
    su banda + 10 y el héroe queda en el medio de lo que se ve arriba del panel. Los clics, `__aPant` y el minimapa siguen
    la misma cuenta. Lo tallado (máscara del marco) no deja caminar; lo transparente encima de la banda es del mundo.
  - Táctil (`ui/hud_forja_tactil.ts`, lo llama `hud_tactil.ts` cuando `disposicion()` trae `orbV`): orbes en las esquinas
    de abajo en sus casas, el rosetón (la Marca, con su brasa) en la punta de la de vida, el cinturón de cuatro en su
    bandeja al centro con el nicho de la reliquia de la clase encima (tocarla dice qué es; en el teléfono va al doble y
    sin rótulo), la rueda (Golpe, Poder y tres
    atajos) sobre un cuarto de rosetón de piedra alrededor de la casa del maná, y la experiencia en una canaleta por el
    borde. La misión pasa arriba a la izquierda, con el botón del registro a su derecha (44 pt). Lleva lo mismo que late
    en PC (grietas, vidrio, estados, trago, racha, ceniza, dintel del jefe, la muerte) menos las esculturas y la vela. El
    teléfono va más chico. La zona del pulgar izquierdo queda libre. Manda el aparato: un PC con pantalla táctil (puntero
    fino) lleva el panel de PC, que también se toca (`aparatoTactil` en `main.ts`).
  - Con el HUD forjado en 2560 × 1080 el lienzo ya no se corta en 1600 de ancho (quedaba una franja negra a la derecha).
  - **Orbes** (`ui/forja_orbe.ts`, Rick: lleno "se lee como una bola de billar"): el orbe es propio del HUD (no el del
    motor, que queda para la barra de siempre y no se toca por `__PINTOR__`). El líquido llega a la vista hasta 0,93 del
    alto (`nivelVisto`; con 0,8 Rick lo vio el 20 nov como vida que faltaba: "tengo la vida full pero no parece"): lleno
    queda un casquete fino de vidrio y siempre se ve la lámina, con su canto de adelante claro, la
    cara de arriba vista de canto con destellos que corren, el canto de atrás que cierra la elipse, el menisco que trepa
    por el vidrio y olas que no se quedan quietas ni llenas. Adentro volutas de ruido torcido que dan la vuelta en 16
    cuadros a 10 por segundo (`CUADROS_LIQ`, `cuadroLiq`), hilos de luz, más claro al frente y hundido hacia el borde y
    el fondo. Lab sin servidor: `npx tsx juego/herramientas/t953_orbes.mts` (el del motor y tres cuadros del nuevo al
    100, 50 y 15 %, en `/tmp/requiem-pruebas/hud/orbes_lab.png`).
  - **Íconos de habilidad** (Rick, 19 nov 2026: "¿y los íconos nuevos de las habilidades?"): las 240 son pixel art pintado
    al tamaño exacto en que se ven (46 y 26 en el panel, 40 y 22 a 1080, 34 en el árbol, la elección y los medallones
    del táctil a lo que pidan; más de 64 se pinta a una base chica y se agranda por enteros). `icono_pintor.ts` (sin DOM)
    pinta formas por distancia con signo en 32 x 32 unidades, cada una con su rampa de 6 tonos de sombra corrida de matiz,
    la luz de arriba a la izquierda del HUD, sombra que cae, contorno selectivo y el filo del elemento en el canto de la
    sombra, sobre el fondo del elemento en bandas (lo físico toma el tono de la clase) con Bayer solo entre banda y banda.
    `iconos_motivos.ts` tiene los motivos (armas, cuerpos, bestias, elementos, signos) y `iconos_recetas.ts` una
    composición propia por id (las definitivas con el aro de oro y gemas). Las seudo habilidades (el golpe con el arma de
    la clase, agresivo y calmo) caen a la receta de su glifo. `iconoPintado` y `iconoPixel` siguen con la misma firma y
    `iconoHab` y `discoHab` pegan a puntos enteros del aparato. Se pinta cuando se pide, unos 2 a 3 ms cada uno
    (`window.__iconosHorneado`). Habilidad nueva: su fila en `RECETAS`, distinta de las de su clase. Lab sin servidor:
    `npx tsx juego/herramientas/t971_iconos_lab.mts todo` + `python3 juego/herramientas/t971_lamina.py` (una lámina por
    clase en `/tmp/requiem-pruebas/iconos`, `REV=id,id` arma una de revisión). En el juego: `t970_iconos.cjs <etiqueta>`
    (las 240 a cada tamaño y el tiempo), `t970_antes_ahora.py` y `t972_iconos_juego.cjs [vistas] [clases]` (HUD, árbol y
    elección).
  - **Atajos vacíos** (Rick: "llenan el panel de cajas vacías"): el marco de todos los cuadros lleva cada atajo como un
    rebaje apenas tallado en la piedra y la tecla apenas marcada en una plaquita de piedra. El marco con los atajos llenos
    (`tallarMarco(g, true)`: bisel de hierro, hueco, remaches y la tecla de latón) se hornea solo en el pedazo de los
    atajos (`cajaAtajos`, `Taller.recorte`) y se pega encima de cada atajo con poder (`rectAtajo`: los vecinos se reparten
    el hueco). Vacío se asoma a medias con el ratón encima (y una luz tibia) o latiendo mientras se elige un poder
    (`ui.der === 'elegirHab'`). Los clics siguen iguales.
  - **Letra de pixel** (`ui/letra_pixel.ts`): 5 x 7 con minúsculas, cifras, signos y los acentos (á é í ó ú ü ñ y
    mayúsculas), a puntos enteros del aparato, en relieve (luz arriba, sombra abajo, canto que cae) o grabada (hundida
    con su labio de luz). `textoPixel`, `anchoPixel`. La usan el rótulo y las cifras de la reliquia de la clase (elige el
    rótulo que entra), el nombre del jefe en su dintel, los letreros al pasar por las placas, la experiencia y los orbes
    (`letrero`) y los números de los orbes del táctil. Las fichas de los poderes, las pistas de los objetos, los mensajes y
    el registro siguen con la letra de siempre (son párrafos).
  - **Esculturas**: van del tamaño que Rick quiere, medio escondidas tras cada casa. La doliente se talla sin vela
    (`doliente(f, s, sinVela)`): la vela se dibuja por cuadro (`velaMana`).
  - Opciones: con la fila del HUD son 14 filas y el alto de la fila baja lo que haga falta para que la losa entre.
    `t954_hud_opcion.cjs [pc|movil]` elige Clásico, recarga y vuelve a Forjado (`__hudVisto` dice cuál se dibujó).
  - Prueba: `node juego/herramientas/t950_hud.cjs <etiqueta> [vistas]` (pc, pc1080, ultra, ipad, movil, pctactil;
    `HUD=0` saca la barra de siempre). Los recortes de cerca: `t953_hud_detalle.cjs <etiqueta> [pc,pc1080,ipad]` y
    `python3 juego/herramientas/t953_lamina.py <etiqueta>` (`/tmp/requiem-pruebas/hud/detalle/lamina_detalle.png`): vida baja con latido, un poder en recarga, el destello de listo, clics de verdad
    (cinturón, tecla 2, bolsa, personaje, poder derecho, el mundo encima del panel), toques de 44 pt sin cruces y el costo
    de la interfaz. `python3 juego/herramientas/t950_lamina.py antes <etiqueta>` arma `lamina_hud.png` en
    `/tmp/requiem-pruebas/hud`. Sin servidor: `npx tsx juego/herramientas/t951_esculturas.mts [ampliación]` (las esculturas
    y el marco entero a 1280 x 720, 960 x 540 y 1707 x 540). `HUD=0` también saca la barra de siempre en
    `comun_pruebas.cjs`, `t650_zoom` y `t651_zoom_pick`.
  - Falta: las filas del cinturón según el cinto puesto (hoy toda columna apila 4).
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

## El muñeco del inventario

- `ui/muneco.ts` (lo dibuja y lo gira) y `motor/muneco.ts` (lo pinta). El héroe del nicho es el mismo motor y el mismo
  equipo que en el mundo (`equipoVisual`, `firmaVisual`), pintado por los obreros de `pintor.worker.ts` (opción `muneco`)
  a K veces su alto y a una muestra por punto: pixel art, nada liso. Se pega a la pantalla a puntos enteros del aparato
  (`getTransform`, sin suavizado): K y d (puntos de pantalla por punto del muñeco) salen del tamaño del nicho en pantalla
  (720: K 1,4; 1080 nativo: K 2,1; `__munecoKmax` tope 2,2). El reposo en los 8 rumbos, el de frente primero (unos 3 a
  8 s el primero, los demás detrás, 2 obreros).
- La luz de retrato (`iluminar`: principal cálida arriba a la izquierda y contraluz fría por la normal y el borde) se
  calcula UNA vez por cuadro al llegar, con el relieve que trae el pintor. Si se cambia, subir `LUZ_V`. `__munecoLuz = 0`
  lo pinta sin ella.
- Guarda en su propia base de IndexedDB (`marca_muneco`, los últimos 4 equipos en `muneco.claves`): la del pintor poda
  todo lo que no empieza con `R|` y se llevaría los héroes pintados.
- Mientras se pinta un equipo nuevo se ve el anterior (`previo`); sin nada pintado, el sprite del mundo a escala entera.
- El arma viva va a la escala del mundo ampliada K (la llama guarda su tamaño respecto del arma), con su propia bolsa de
  partículas (`pozoArma` en `arma_viva.ts`: lo que suelta no cae en el mundo).
- Se gira arrastrando en el nicho (ratón o dedo), con las flechas del teclado o con los botoncitos de abajo. Con algo en la
  mano no se gira. `panelInventario` va con `sinHeroe` (antes el render liso se pintaba en el hilo principal en cada cambio).
- Pruebas: `t880_muneco.cjs <etiqueta> [vistas] [clases] [base,reliquias,raros,alto] [giros]` (`RAPIDO=1` no espera al
  pintor del mundo, capturas en `/tmp/requiem-pruebas/muneco`) y `t881_muneco_giro.cjs [pc|movil]` (girar, casillas, mano,
  cambio de casco). Ganchos: `__muneco()`, `__munecoGirar(n)`, `__rectPanel(lado)`.

## La presentación de las clases

En la pantalla de elegir clase el héroe es **pixel art** (grupo `r`) y se dibuja a puntos enteros, igual que la fogata y
el piso. No volver a presentarlo como render liso en grande: el modelo de cuerpo (manos, nariz, torso) no lo aguanta y
Rick lo rechazó (16 nov 2026).

- Desde el 18 nov 2026 se hornea a **2,25** veces el tamaño del juego (`K_RETRATO`, `RETRATO_ALTO = 225`): a ×2 en 720 y
  ×3 en 1080 nativo. Con los rasgos grandes de la cara (`detalle: 2`) y el grano de los materiales 1,5 veces más grande
  (`conGrano`: si no, la tela parecía arena). La luz y el grano están en `juego/hornear/luz_retrato.mts`, NO en el motor:
  así no cambia `__PINTOR__` y nadie repinta su héroe. El color va sin pérdida (`atlas_webp.py`).
- La fogata va a la **izquierda** del héroe, frente a su cara (mira a 'so'): con la fogata a la derecha la cara quedaba
  en la sombra, gris como una calavera. Luz de frente apenas corrida, baja, relleno frío muy bajo y contraluz fría de
  atrás a la derecha. La piel no se aclara (`piel.luz` 0) y el techo baja (antes la cara salía con bandas blancas).
- **Luz avanzada** (Opciones, Luz, con WebGL2): `spriteConLuz` en `render/luz_gpu.ts` reilumina el cuadro con sus gemelos
  `_n` y `_h` por **punto del dibujo** (un lienzo del tamaño del cuadro con su propio WebGL, después agrandado sin suavizar):
  la fogata (`luzFogataSprite` en `seleccion.ts`, en puntos del cuadro desde los pies) calienta lo que la mira, hunde lo de
  atrás, enciende el filo del lado del fuego y late y se mece con la llama. Sin WebGL2, en Clásica o mientras baja el
  relieve, va el horneado tal cual. `window.__luzRet = { fuerza, sombra, filo, aire, rim, radio, alto }` ajusta al vuelo.
- Hornear: `RELIEVE=1 GRUPOS=r npx tsx juego/hornear/hornear.mts` (5 min) y `python3 juego/hornear/atlas_webp.py`. Los
  retratos sueltos para ajustar la luz se pintan sin hornear importando `luzRetrato`/`conGrano` (cada cuadro unos 3 s).
- La cara y las manos de los héroes están talladas (19 nov 2026, ver "Caras y manos").

## Caras y manos (19 nov 2026)

Solo los héroes (`cu.presentacion`): monstruos, gente y cinemáticas siguen con la cabeza y la mano de siempre, así que
después de tocar esto se hornea `h,g,r` (con `RELIEVE=1`) y nada más.

- **Cara** (`rostro.ts`): `cabezaHeroe` arma la cabeza en la masa (cráneo más atrás y frente aparte, arco de las cejas con
  entrecejo, reborde de la órbita, pómulo, nariz con lomo, punta y aletas, maxilar, labios con su material `<piel>_labio`,
  mentón, ángulo de la mandíbula, orejas). El ojo queda hundido en la cuenca: la sombra sale de la forma y de la
  oclusión, no de pintura. Ella: cejas, mandíbula y nariz más finas, labios llenos y más rojos. `rasgos` pone encima
  según `detalle` (sale de la escala si no lo piden: 1 en el juego, 2 desde S 1,35, o sea muñeco y selección): en el
  juego el ojo es un trazo oscuro (blanco y pupila a un punto eran anteojos) y las cejas; desde 2, el globo casi al ras
  del arco (hundido se leía dormido), iris, un punto de luz (`cu_ojo_brillo`), párpados abiertos, pestañas, boca y
  surcos. Las cejas se afinan hacia afuera y bajan al entrecejo según `GESTO` de la clase (berserker el ceño más duro).
  Frente, cráneo, pómulos y arco van con uniones anchas para que la luz caiga de a poco (las repisas eran franjas),
  pero la frente no pasa de la de antes: los cascos se arman a esa medida y la piel asomaba por el borde. Las rayas oscuras van HUNDIDAS en la masa: solo
  asoman en el pliegue (entre los labios, junto a la aleta). `barbaHeroe`: bigote que cae, carrillos, mentón, mechones
  con punta en el borde, chorro de mechones (larga) o trenza de nudos (trenzada); deja ver el labio de abajo. El
  flequillo es parte de la masa del pelo (`flequilloHeroe`) con cortes hundidos entre mechas.
- **Manos** (`manoHeroe` y `agarresDe` en `cuerpo.ts`): palma, cuatro dedos de tres falanges con nudillo y pulgar aparte.
  'agarre': cada dedo da la vuelta al mango que pasa por `b.mano` (en `eje`, hacia la cabeza del arma, del lado del
  pulgar); con guarnición (`CON_GUARDA`) el índice queda bajo la cruz y los demás bajan al pomo. 'puno' (puños, garras,
  la mano que tira del arco, escudo), 'abierta' (sin arma, conjuro, orbe, libro). La izquierda cierra sobre el mango
  cuando la pose la manda ahí (`izq.eje === der.eje`), el arco por su `arriba`. La palma mira adentro según `b.s`
  (s = 1 es la derecha anatómica). Guantes: la misma mano más gruesa; guanteletes: láminas por falange, placa de
  nudillos y de dorso; vendas: palma y base de los dedos (las puntas a la vista); brazales: la mano desnuda.
  No mueve armas ni `filoDe`/`hoja`.
- **Costo**: cada mano y la cabeza tallada van en su propia masa chica (`extra.manos`, `extra.cabeza` en `partes`): en la
  masa del cuerpo cada componente se recorre en cada rayo. Así el pintor quedó igual o un poco más rápido que antes
  (juego 218 a 200 ms por cuadro, muñeco 839 a 830 ms, medido en la nube a una muestra por punto).
- Pruebas: `npx tsx juego/herramientas/t890_caras.mts <salida> [caras|manos|todo]` (8 clases y variantes de género, piel
  y barba; juego en 4 rumbos, muñeco a 2,1 con su luz, retrato a 2,25 con la fogata; manos vacía, puño, espada, mandoble,
  hacha, lanza, báculo, arco, daga, escudo, guantes, guanteletes, vendas, brazales; `SUJ=` y `MAN=` filtran; `RAIZ=`
  pinta el antes con otra copia del repo), `python3 juego/herramientas/t890_lamina.py <antes> <despues>` (láminas en
  `/tmp/requiem-pruebas/caras`), `t890_zoom.py` para ampliar recortes y `t891_cabeza.mts` (cabeza o mano, `MANO=0|1`, a K
  alto para modelar).

## La portada

La catedral de la portada es una toma 3D en perspectiva (`src/engine/gotico/catedral_portada.ts`), no el sprite del
juego. Para volver a pintarla con sus capas (luz, fuego tras los vitrales, niebla, camposanto):
`npx tsx juego/hornear/portada_catedral.mts && python3 juego/hornear/portada_webp.py` (10 s). Encuadre con `X`, `Y`,
`ALTO` (coordenadas de la capa de 1536x800). Se revisa con `juego/herramientas/t680_portada.cjs` (`URL=` para otro puerto).

- **La luna de sangre** (19 nov 2026, Rick la vio como un disco rojo plano con manchas grises): es una esfera horneada
  por `python3 juego/hornear/portada_luna.py` (8 s, `QUE=luna` o `QUE=nubes`) en `fondo/luna.webp` (768, 92 KB): mares con
  la cara de la luna de verdad y bordes torcidos con ruido, unos 12 000 cráteres con cuenco, borde, eyecta y pico central,
  rayos de Tycho y Copérnico, relieve por normales, luz Lommel-Seeliger corrida arriba a la izquierda, limbo y el cobre
  del eclipse. `luna()` en `ui/portada.ts` la achica una vez al tamaño de pantalla (`lunaA`, escalones de 3 %) y le pone
  un solo resplandor sumado y un velo chico. Los jirones de delante (`fondo/luna_nubes.webp`, R el cuerpo y G el filo)
  se tiñen una vez (`nubesDeLuna`) y se arman cada cuadro en dos lienzos propios a media resolución: el cuerpo recortado
  a un óvalo ancho (no raya el título) y el filo a contraluz pegado al disco.
- La noche de arriba (`grado_cielo`) se oscurece sobre el cielo antes de la luna: el grado de antes iba encima de todo y
  apagaba la luna. Al final queda solo el oscuro del piso.
- Humo de la torre rota y la nave (`humoCatedral`, bocanadas hechas una vez), cuervos en silueta llena (antes heredaban
  el 'lighter' del fuego y no se veían), brasas que nacen en la puerta de ahora (el `nacen_en` del manifiesto era de la
  catedral vieja), el fuego del título más parejo y con resplandor barato (achicado a un cuarto), el paño y la franja del
  menú difuminados en los cuatro lados, y el relámpago respeta `acc.destellos`.
- `catedral_luz.png` traía copias fantasma de los vitrales en el cielo (columnas claras a la izquierda de la catedral):
  `desenfocar(..., 26, 3)` en `catedral_portada.ts` leía la lámina RGBA como de 3 canales. Ya va con 4.
- `__pOff` para comparar: `luna`, `jirones`, `humo`, `niebla`, `cat`, o `-<capa>,` para quitar una capa.

## Historia y canon (19 nov 2026)

Rick aprobó la revisión entera de la historia (70 propuestas). Lo que quedó como canon, para que nada nuevo lo contradiga:

- **Arriba** está Aun-Saar, el Dios **Sediento** (sed, nunca hambre). Su sed cae como brasas, una cada mil inviernos.
- **Hace mil inviernos** cae la primera (Ozmaren). Los primeros hermanos de Santa Oria la parten en **cinco pedazos, cinco
  sellos**, con **siete voces** que les cantan "por si alguna se cansa". El primer abad anuncia la segunda brasa.
- Los monjes reparten los pedazos: Sahrim hace mil años, Hrimgard hace trescientos, Yhuantl hace una generación en el barco
  de **Ama, la madre de Oyá**. Ysmeral pactó con el mar hace siglos y sube a veces: hace treinta años se llevó a Ama.
- **Hace cuarenta años** el cielo se raja un dedo y suben siete marcados (Eskel es el único que queda). Odrán los vio salir.
- **Hace un año** Vesperio canta de noche (Auren, su maestro de coro, le enseñó la canción, Lys lo oía y calló) y guía a la
  segunda brasa. Cae en el claustro y suelta una astilla que se mete en el héroe dormido: la Marca que no se apaga.
- **Actos 1 a 5**: Vesperio ablanda a cada guardián, el héroe lo mata y el pedazo se suelta (el héroe es la llave). Vesperio le
  da las gracias cada vez. **Actos 6 y 7**: sin Ozmaren tira el dios directo, y la voz de la Marca cambia de dueño.
- Lo de la selva suena a **tambores**. Las campanas son de Santa Oria y de Ysmeral. La villana de Ysmeral es la Abadesa de la
  Sal. Al héroe nadie le dice hijo ni hija (criatura, sangre de su sangre). En inglés el pueblo del acto 3 es Kesh Landing (the
  Landing) y los nombres van sin tilde (Oya, Odran, Tomas). La tercera brasa es la del final del Rey de Ceniza.

Dónde vive cada hilo nuevo (nada de esto toca la partida salvo `restos`, campo opcional nuevo):

- **Frase del jefe de zona** (`FRASE_JEFE_ZONA` en `mundo/actos.ts`, 20 zonas): el jefe de zona lleva `jefeZona` (no se guarda)
  y `hablarJefe` en `juego/mundo.ts` la dice al despertar, antes que la del cuerpo (`FRASE_JEFE`). Antes los jefes de zona
  (calidad 2) no hablaban nunca. La placa sobre la cabeza (`frasesMonstruos`) y la de la barra del jefe cortan en 3 renglones.
- **La voz de la Marca** (`VOZ_MARCA` en `actos.ts`, 10 zonas): `vozMarca` en `juego/historia.ts` la pone en el registro y
  flotando sobre el héroe (un eco que lo sigue, `sigue`), después de la línea de ambiente. Una vez por sesión, como `ENTRADA_ZONA`.
- **Llegada a los campamentos**: filas de los siete pueblos en `ENTRADA_ZONA`.
- **Restos de las matanzas** (`RESTOS_ACTO` en `actos.ts`, 4 por acto): `marcarRestos` (historia.ts) marca al entrar las piezas
  de capa 'matanza' de `curarAdornos`, NO al generar: la zona sale igual (lo mide `t855_determinismo`). El texto sale de la
  posición de la pieza (orden por huella de cx, cy y un corrimiento por zona), sin repetir en la misma zona (las que sobran
  quedan mudas). La carta de Vesperio a su madre (el cuarto de los actos 1 a 5) sale solo en la zona donde se te aparece
  (`HERALDO.zonas`). Clic en el bulto del medio (`escena.ts`), se lee en la página de las pistas con el lugar en vez del
  número (`paginaSub`) y queda en el Códice (`hist(d).restos`, claves 'acto:i').
- **Ecos en el epílogo** (`ECOS_FINAL` en `mundo/decisiones.ts`): hasta dos líneas según las elecciones de los encargos, antes
  de la última. Solo lee `elecciones`. Auren recuerda el juicio en sus relatos del acto 7 (`DIALOGOS` en `datos/npcs.ts`).
- El texto de las cinemáticas (`marcoCine` en `menus.ts`) crece hacia arriba: con 3 o 4 renglones se metía en la franja.
- No se tocó: el orden de las páginas del abad (la partida guarda un contador) ni el tipo de objetivo de ninguna misión. Las
  ideas sin texto final del informe (epígrafe en la presentación del jefe, bestiario con historia, fantasma de Vesperio en
  los actos 6 y 7, página del niño de la nieve) siguen pendientes.
- Prueba: `node juego/herramientas/t960_historia.cjs [pc|movil]` (clic de verdad en los restos de las Catacumbas, voz de la
  Marca en el Camposanto, Ívola en la Cripta, capturas en `/tmp/requiem-pruebas/historia`).

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

- **Fluidez del dibujo** (19 nov 2026, rama `fps`; el F3 de Rick: 4 a 6 mil llamadas por cuadro y 15 a 21 ms de JS del
  mundo a 1920 × 1007 en Lejos). Todo sale punto por punto igual salvo lo que se dice:
  - **Atlas en lienzo** (`aLienzo` en `motor/assets.ts`): en PC con tarjeta (`__gpu.ok`, sin táctil) cada atlas y cada
    relieve se pega una vez en un lienzo de la tarjeta. Dibujar desde el ImageBitmap era lo que encabezaba el F3 de Rick
    ("drawImage pantalla <- ImageBitmap 2044x1144", 1 a 3,5 ms por atlas). Si la tarjeta se reinicia se sueltan y se
    vuelven a bajar (`siSePierdeLaTarjeta`). `__atlasBitmap` lo apaga, `__atlasLienzo` lo fuerza en la nube.
  - **Piso en trozos** (`trozosPiso` en `escena.ts`): baldosas, matiz, detalles, roca y relleno se pintan una vez por trozo
    de unos 512 puntos de pantalla (con su relieve y alto si la luz avanzada está prendida) y se copian. Las baldosas vivas
    (agua, lava, pantano, fortaleza, pentagrama) guardan su fase y la siguiente se pinta antes. Solo a escala entera (PC
    nativo); si no, `pintarPiso` como siempre. El matiz, la roca y el relleno quedan a lo sumo medio punto corridos
    respecto de antes (ahora van pegados a las baldosas). `__sinTrozos` para comparar.
  - Objetos fuera de pantalla no se pintan (siguen pidiendo su atlas). Cuervos y hojas secas son un drawImage
    (`render/mapitas.ts`, a escala entera). La niebla de guerra, los aros del umbral y las líneas del arma viva van en un
    solo camino (`__sinLotes`). El terreno del minimapa se guarda en un lienzo y se rehace al explorar (`__sinTerreno`).
  - Teselas del clima: una por lienzo (rearmar la misma en el cuadro frenaba 11 ms en el cementerio) y la niebla se arma
    una sola vez. El fuego de Doom de cada fogata va en lienzos `willReadFrequently` (putImageData por cuadro).
  - Medidor F3: además el mundo por tramos (cámara, piso, suelo, lista, objetos, cuerpos, otros, efectos, luz, luzgpu,
    clima). `__rendFases.ligero(true)` mide sin el envoltorio de las llamadas.
  - Pruebas: `GPU=1 node juego/herramientas/t890_llamadas.cjs [zonas] [luz]` (con `GPU=1` el lienzo va acelerado por
    SwiftShader en el proceso de la GPU: el JS por cuadro se parece mucho al del PC de Rick; `CARAS=1` imprime el F3,
    `PELEA=24`, `ATLAS_LIENZO=1`) y `SOLO=1 node juego/herramientas/t891_igual.cjs [zonas] [luz]` (el mismo cuadro con lo
    de antes y lo nuevo, diferencia punto por punto; `FOTO=1` guarda el mapa de diferencias).
- **Memoria en el teléfono y el iPad** (Rick, 19 nov 2026: Safari del iPhone "A problem repeatedly occurred", la página
  muerta por memoria). Una zona cargaba de entrada todos los atlas de sus monstruos (con todas las acciones) y de todos sus
  objetos: 600 a 720 MB de imágenes decodificadas (las muertes nuevas sumaron 57 a 84). En táctil (`E.tactil`) ahora:
  `atlasZona` no carga los monstruos (salvo el jefe) ni los objetos a más de 40 casillas de la entrada (las piezas grandes,
  como la catedral, sí), al entrar se suelta todo lo que la zona nueva no usa (`liberarAtlas(atl, 0, 0)`) y `cuidarMemoria`
  (main.ts) suelta cada 1,5 s lo que no se dibujó en 4 s cuando se pasa de `TOPE_TACTIL_MB` (380, `__topeTactil`). Lo
  soltado vuelve del caché del navegador al dibujarse. Queda en unos 375 MB jugando y el pico al cambiar de zona en unos
  490 (antes 720). En PC nada cambia. Medir: `memoriaAtlas()` de `motor/assets.ts`.
- **Lienzos de trabajo en rueda** (`motor/lienzos.ts`): sombras, filos y destellos de golpe se arman cada uno en un lienzo
  distinto de una rueda de 160. Reusar un solo lienzo ya pegado en el mismo cuadro frena la tarjeta gráfica (Rick, 18 nov
  2026: se trancaba con muchos monstruos y bolas de fuego). No volver a un lienzo único. En la nube no se nota porque
  Chromium pinta sin tarjeta. Prueba de fluidez: `t860_fps.cjs [n] [zona]` (sirve para comparar y ver el perfil).

- **Medidor F3** (`nucleo/rendimiento.ts`, `window.__rend()`): fps, 1 % bajo, tiempo de JS por fase (`medir`: lógica,
  mundo, interfaz), luz avanzada, llamadas de dibujo, lienzo y la tarjeta que da Chrome. Si el JS es mucho menos que el
  cuadro, frena la tarjeta.

## Luz avanzada (la versión única desde el 18 nov 2026)

- Cada atlas trae sus gemelos `_n` (normales) y `_h` (altura) en `manifiesto.json` (`rel`). Se hornea con `RELIEVE=1`
  (todo el juego unas 2 h 15 min a 4 núcleos) y `atlas_webp.py` los pasa a WebP SIN pérdida (Rick, 18 nov 2026: no se
  baja calidad en nada). La lámpara del héroe también alumbra el relieve (solo suma luz, no hunde) y entran las 48 luces
  en pantalla más cercanas al centro.
- **Solo con tarjeta de verdad** (`infoGPU` en `luz_gpu.ts`, `window.__gpu`): WebGL por software (SwiftShader, llvmpipe,
  `failIfMajorPerformanceCaveat`) no la enciende: ahí corría a un cuadro cada 2 o 3 s (Rick, 19 nov 2026). Y una guardia
  (`vigilar`): más de 90 ms por cuadro sostenido 4 s con la luz encendida (sin contar mientras bajan atlas o relieves, `bajandoAlgo`) la apaga, guarda Clásica y avisa.
- `render/luz_gpu.ts`: el pase de WebGL. Opciones, Luz (Clásica o Avanzada), tecla L para comparar, `__lab` en las pruebas.
- Prueba: `URL=http://127.0.0.1:5191/ node juego/herramientas/t870_luz.cjs` (fotos en `/tmp/requiem-pruebas/luz`). En la
  nube Chromium pinta WebGL por software: los cuadros por segundo de ahí no dicen nada del PC de Rick.
