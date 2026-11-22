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

- **Mundos** (rama `mundos`, copia en `/home/user/requiem-mundos`, respaldada en origin): entregas 1 a 9 publicadas en main
  (la 9, atascos repetibles, sin espera larga con hueco y cuenta objetiva, `485f3c7`, 21 nov). Cada entrega tiene su sección
  abajo; lo flojo que queda, al final de la 9. La 10 (roca viva de minas y cuevas, 22 nov) se publicó en `63e3477` y su tercera vuelta (lo flojo cerrado) en `637fe0d`.
- **Cada zona con lo suyo** (rama `acto2`, 22 nov 2026): acto 2 hecho (ver su sección). Siguen, con el mismo mecanismo, los actos 6, 7, 3, 4, 5 y 1.
- **Libro de Odrán** (rama `odran`, publicado en `b4ef6bb`, 21 nov 2026): el Códice por hilos de la historia. Pendiente: que
  Rick lea y apruebe los textos nuevos de `juego/src/mundo/libro_cierres.ts` (cierres, notas al margen, pistas y nombres).
- **Fantasma de Vesperio** publicado (`187f377`): sus textos también esperan que Rick los lea.
- **Ya decidido por Rick, no volver a preguntar**: perder el mapa explorado está bien (héroe, objetos, misiones, viajes y
  casas no se tocan); se pueden modelar piezas nuevas (casas, torres, muertos, lava, lo que haga falta); la vara es mejor
  que Diablo 2 pero original; nada montado, todo con intención; respaldar ramas de trabajo en origin está bien.
- **Agentes**: nunca con el modelo Fable (Rick, 20 nov 2026). Usar opus o sonnet.
- **Seguir solo**: la tarea de cada hora se borró el 21 nov al publicar la entrega 9 de mundos y el Libro de Odrán. Si hace falta otra vez, crear una nueva.
- **HUD**: publicado (`9be8834`, `bc0a1e1`). Rick aprobó el cinturón partido en dos pares (20 nov). Sexta pasada (rama
  `pulido-poderes`, 21 nov): grietas de vida baja talladas, ceniza del jefe que se lee y el cinturón siempre de 4 por columna (Rick, la regla por cinto quedó apagada).
- **Poderes**: seis pasadas (la sexta en `pulido-poderes`, ver "Sexta pasada" en Poderes en vivo): Coro de los sellos y
  Puño de dios bajo 10 % de blanco de día y de noche, sonidos de las formas y del Festín, garras con el color del arma viva.
  Séptima (rama `pulido2`): las formas y el Festín rehechos de verdad (ver "Sonidos de las formas y del Festín"). Flojo: siguen
  sin oídos humanos, solo WAV, espectrograma y volumen medidos (los WAV quedan para Rick en `/tmp/requiem-pruebas/sonidos`).
- **No publicar** nada que no se haya revisado mirando las láminas y corrido las pruebas. Main publica solo al hacer push.
- **Interfaz pulida** (rama `pulido-ui`, 21 nov 2026): barras de vida legibles y apiladas, letra gótica nueva en todos los
  menús, la vigilia con boceto y sus arreglos. Ver "Pulido de la interfaz". Segunda pasada de la vigilia (`pulido2`): se pintan 24 cuadros y
  24 se arman (ver "La vigilia, segunda pasada"). Flojo: con la nube cargada por otras sesiones no llega a 15 y 25 s.

- **Libro de Odrán** (rama `odran`, 21 nov 2026): el Códice ordenado por hilos, un libro de pixel que se va llenando. Ver "El
  Libro de Odrán". Los cierres y textos nuevos (`mundo/libro_cierres.ts`) esperan que Rick los lea.

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
  eje de la entrada) que cierran la arena en luz. Donde el anillo de 12 a 19 no tiene sitio (lo llenaban el tesoro del jefe,
  los hitos de la sala y el riego: a3_inundadas, a4_grieta y a7_boveda según la semilla) va `asientoForzado`: el punto más
  de espaldas a la entrada (hasta un coseno de 0,45) a 13 a 19 del jefe, sobre piso que se alcanza y sin roca, muro ni agua;
  saca solo lo suelto que pisa (nunca tags, cofres, escena, umbral ni relato) y muda el tesoro que estaba ahí a los costados
  del asiento (es su botín). `__sinAsientoForzado` lo apaga. Las cuevas y minas llevan `cue_antorcha` (antes `mon_brasero`,
  de monasterio). 93 de 93 jefes con asiento en 3 semillas y unos 72 braseros por semilla (`_m_asientos.mjs`, no se sube).
  El ruedo sigue en 10.
- **Hitos de los actos 1 y 2** (`acto_hito` en `catalogo/hitos_acto.ts`, `HITO_ZONA` en `zona.ts`; el armado de los cuatro
  nuevos en `catalogo/hitos_mayores.ts`, rehechos el 21 nov 2026 porque los primeros eran primitivas sueltas: Rick vio el
  obelisco como un bloque con un disco amarillo y dos óvalos de arena planos). Se suman a la cruz del páramo y el coloso de
  las dunas, misma huella 4 x 4 (2,4 veces). Lo alto va atrás (-x -y) y el relato adelante (+x +y), que es lo que ve la
  cámara; una persona mide unas 31 unidades adentro. **Campanario de Santa Oria** (camposanto): torre de sillares
  (`abo_sillar_grueso`) partida en diagonal hilada por hilada (`muroRoto`), vanos ojivales con su moldura, puerta vencida,
  contrafuertes, hiedra, vigas quemadas del bastidor, derrumbe hacia adelante con un paño entero caído y el pináculo, y la
  campana tumbada y rajada (`campana`, perfil de verdad, bronce con verdín `hit_bronce_verdin`) con su yugo partido, la soga
  enrollada y cuervos. **Roble de las sogas** (bosque): tronco de masa con contrafuertes de raíz y musgo, cinco brazos
  (`ramaM`), el hueco al camino, tres sogas (una cortada con cintas), un muerto que nadie bajó (`muneco` con `colgado`:
  ojo, `colgado` baja la figura 21 sin escalar), el banquillo pateado, el cerco de piedras con nombres raspados y velas.
  **Pozo del Oasis Muerto**: estrado de dos gradas, brocal de sillares con la albardilla gastada por las sogas, cabria de
  piedra con viga, polea y cadena, cubo volcado, abrevadero partido con arena, palmeras secas (`palmaSeca`) y una caída,
  ánforas rotas, osamenta de camello y el fondo del oasis en barro seco en placas (`hit_barro_seco`) hundido en la arena.
  **Obelisco del sol** (Ruinas): estrado de tres gradas de sillares, muñón con glifos y la rotura cavada (`resta` con
  `des2_piedra_pulida`: la cara rota sale lisa), el sol de bronce con ombligo de oro al que le falta un rayo, la aguja caída
  en dos tramos con el piramidión dorado al final, dunas de masa arrimadas (`duna`) y el saqueador con el rayo en la mano.
  Hornear: `RELIEVE=1 GRUPOS=o SOLO=acto_hito ...` (13 s) y después `t1013_cajas.mjs`. Lab:
  `t1020_pieza_lab.mts "acto_hito:a1_campanario+a1_roble+a2_pozo+a2_obelisco"` (láminas en
  `/tmp/requiem-pruebas/mundos3/hitos`). En el juego: `juego/herramientas/_m_hitos_vista.cjs <etiqueta> [zonas]` (no se sube;
  `DX`, `DY` ponen al héroe respecto del hito; ojo: con el héroe detrás, el hito se pinta al 45 % como todo lo alto).
- **Desvíos de los mundos abiertos** (`DESVIO`, `trazarDesvio`, `senderoDesvio` y `vestirDesvio` en `zona.ts`, `__sinDesvios`):
  en los seis exteriores de los actos 1 y 2, un claro chico (radio 4) escondido contra el borde (puntúa el vacío cerca, doble
  al norte y al oeste: detrás de los macizos) a 10 a 34 del camino, lejos de salidas, lugares y el centro. Un sendero propio
  lo une a la celda de camino más cercana, reservado de ancho 2 que se angosta a 1 cerca del claro, bordeado de matas bajas y
  con un cuello de dos peñas (o cruces) que deja pasar de a uno. Al fondo lo que se ve de lejos (la capilla del caminante, el
  nicho de las cintas, la linterna de los muertos con el ángel, la última palmera viva, el obelisco del aguador, el pórtico del
  vigía), el relato del tema y el primero de los dos cofres escondidos de la zona (no suma botín; `lejos` se sigue llamando
  igual para no mover el azar). Es un `Lugar` con `papel: 'desvio'`, `nombre` y `relato`: `historiaPaso` anuncia los dos al
  pisarlo y el mapa lo marca como lugar visto. Ningún campamento a menos de 16. Azar propio, sin tocar pisos. 18 de 18
  (6 zonas x 3 semillas) con cofre alcanzable (`_m_desvios.mjs`, no se sube). t1000: la arena no se mueve (exterior 57).
  Fotos: `_m_desvio_vista.cjs` (no se sube) en `/tmp/requiem-pruebas/mundos3/desvios`.
- **Paredes de bajo tierra** (paso 5a de `curarAdornos`, `vestirParedes`, `PARED_TEMA`, `RINCON_OBRA`, `RINCON_CUEVA`,
  `__sinParedes`): bajo tierra se sentía vacío y el medio de las salas es para pelear, así que se viste el muro de atrás
  (norte u oeste, el que se ve) y los rincones. Por tema: cadenas, candeleros de pared, hornacinas con velas, placas, frescos,
  tumbas cavadas, momias, raíces (cripta, catacumbas, abadía), canopos y momias de pie (tumba), algas, nasas y cruces de
  marinos (catedral ahogada), estandartes y pertrechos (santuario, fortaleza), oro (celestial), runas y reliquias (abismo),
  cristales y congelados (hielo), puntales y herramientas (mina), huesos y raíces (cueva); en los rincones velas, osarios y
  telarañas, y al pie de algunas columnas lo mismo. Lo largo usa su variante `_der` contra el muro oeste. Nada bloquea ni
  ocupa (se pasa por delante, como por delante de una antorcha): la arena no baja. Va solo donde la huella entera toca el
  muro, con paso delante, fuera de pasillos (ancho 6 o menos), puertas, el medio de las salas y el ruedo del jefe, sin pisar
  la caja de otro sprite (lo de pared, que no tiene caja, a 2,5 celdas de otro adorno). Capa `pared`: `desmontar` no la muda
  (la saca si pierde). Azar propio. 17 piezas por mazmorra (`_m_paredes.mjs`, no se sube). t1000 (3 semillas), antes y
  ahora: obra adornos por pantalla 29 a 35 (p90 40 a 44), cueva 31 a 38 a 40, montados obra 9 a 7 y cueva 8 a 5 a 6, arena
  igual (obra 56, cueva 40). Ojo: la medida no cuenta como adorno lo que tiene `pared`, `muro` o `nichos` en el id (las
  cadenas, los candeleros de pared y las momias se ven pero no suman). El tope de `propsPant` de obra en `t1000_pisos.json`
  pasó de 36 a 46.
- **Entrega 2 revisada (21 nov 2026)**: hitos rehechos, asiento de los 93 jefes (3 semillas), un desvío por exterior de los
  actos 1 y 2 y paredes vestidas. Pasaron t1000, t1001, t1011 (0 atascados de 2504), t855 (0 distintas), t370 (288, 0
  malas), conectividad 20 (1920 conectados), t440, t450 y t500. Flojo todavía: el sendero del desvío se lee poco (se
  reserva y lo bordean matas, pero el piso no cambia), la obra queda en 35 adornos por pantalla (meta 40) y las fotos de
  t1021 de los jefes salen con la pelea encima (los jefes despiertan).
- **Nichos secretos** (`mazmorra`, solo las de obra, `__sinNichos`): una o dos baldosas que se abren en el muro de atrás
  (norte u oeste) de una sala que no es la de entrada ni la del jefe: el muro lo tapa desde el medio y la boca va sin luz.
  Adentro un cofre noble (`escondido`, con su rastro de sangre hacia el centro como los de afuera), huesos y velas. El
  cofre va al final de `mazmorra` para no mover el azar de lo de antes. 52 nichos en 31 mazmorras (semilla 12345), todos
  alcanzables (`_m_nichos.mjs`). Ojo: el piso nuevo cambia el azar de los muros y lo que sigue: obra arena 58 a 56 y
  adornos por pantalla 33 a 29 (grupos de monstruos 968 a 976, campamentos 484 a 475 en 3 semillas).

## Mundos, entrega 3 (21 nov 2026)

Rick: "haz todo lo que falte, lo que quedó flojo y lo que falta de los actos 3 al 7, no quiero nada flojo".

- **Sendero de los desvíos** (`vestirDesvio`, `__sinSendero`; piezas en `catalogo/senderos.ts`): el camino del mundo se
  pinta por baldosa y el sendero es de una o dos celdas, así que va por piezas planas a lo largo de la traza: `sendero_paso`
  (2 x 2, plano) un tramo pisado por celda y media con su rumbo (`<fam>_<x|y|d|e>[2]`: el material del piso del tema más
  oscuro, huellas de ida y vuelta, y lo de cada tierra: pasto aplastado, losas hundidas, rizos de arena, tablones sobre el
  barro, nieve sucia, basalto y brasas apagadas, tablas de naufragio con conchas, mármol con filete de oro), las piedras del
  borde (`<fam>_piedras`) cada cuatro puntos de la traza, y `sendero_mojon` (1 x 1) en la boca donde deja el camino (montón
  de piedras con trapo, estela con cruz, piedras con cuerno, estaca con cráneo y plumas, piedra rúnica, púa con cráneo y
  cadena, remo con farol, tambor de columna). `FAM_SENDERO` da la familia por tema. Azar propio (`rs`). Lab:
  `t1020_pieza_lab.mts sendero_paso,sendero_mojon`; en el juego `SENDA=1 _m_desvio_vista.cjs` pone al héroe en medio del
  sendero. Ojo: registrar cualquier pieza nueva en el catálogo cambia el armado de algunas zonas (a4_picos lo mostró con una
  pieza vacía de prueba); no es azar de sesión (t855 da igual), pero mueve objetos. Los pisos no cambian.
- **El roble con luz**: un farol colgado del brazo que mira al camino (jaula de hierro, vidrio que es luz y llama) y tres
  velas vivas en el labio del hueco. `robleSogas` devuelve escena con `resplandor` (ojo: en unidades ya agrandadas 2,4 veces,
  el resplandor no pasa por `conEscala`), y el juego le da su luz (`fuenteDe`).
- **Pozo y obelisco sin manto**: se sacó el disco de arena de debajo (se gastan los mismos números del azar para no mover lo
  demás); solo quedan lenguas de arena arrimadas a las gradas, con el material del piso (`arena`, no `des2_arena`). `duna`
  ahora recibe el material (nieve, ceniza).
- **Obra más vestida** (`vestirParedes`): el rastro al pie de lo que cuelga (`__sinPieMuro`: huesos bajo las cadenas, cera y
  velas bajo el candelero, lo que se les deshizo a las momias), los refugios (`__sinRefugios`: contra el muro norte u oeste de
  algunas salas, el jergón, sus velas, el taburete volcado y los huesos del que esperó; no en celestial, ahogada ni infierno,
  8 por zona como mucho, a 14 celdas), las paredes de la obra más juntas (2,8 en vez de 3,6; `__paredRala` vuelve a lo de
  antes) y los pasillos de 4 a 6 de ancho con lo plano de pared (lo suelto no). t1000 obra: adornos por pantalla 35 a 38
  (p90 44 a 49), montados 7 igual, arena 56 a 57. No llegó a 40: los muros que se ven están llenos y la medida no cuenta lo
  que tiene `pared` en el id.
- **Hitos de los actos 3 a 7** (`catalogo/hitos_lejanos.ts`, `HITOS_LEJANOS`, filas nuevas en `HITO_ZONA`): uno por mundo
  abierto, con el oficio de `hitos_mayores.ts` (de ahí se exportan `campana`, `duna`, `ramaM`, `mezV`, `muroRoto`...). Ojo con la
  escala: lo que es de tamaño de mundo (`cadaver`, `esqueleto`, `calavera`) va a 0,45 adentro de un hito (se agranda 2,4), y lo
  que corre a lo largo de la diagonal x = y se ve de punta (vertical) en pantalla: lo largo va sobre x = -y.
  Tambor de Yhuantl (a3_selva: terraza de tres gradas, ceiba con raíces que la agarran, tambor de tronco con cuero en zigzag y
  manos de sangre, mazas de fémur, tambores chicos, ofrendas, braseros), barco de Ama (a3_pantano: casco de tablones por
  cuaderna con el boquete y las cuadernas al aire, mástil partido, vela en jirones, Ama tallada en la proa, su nombre en la popa,
  el manglar que lo atraviesa, farol), puerta de los jarls (a4_picos: dos piedras con la sierpe de runas frías y el dintel, muro
  de escudos con lanzas, cuerno, el último de guardia), gigante del glaciar (a4_gigante: frente de hielo con seracs, la cabeza
  con el aro de hierro y los ojos de escarcha, el brazo con el hacha clavada, la escala, picas, trineo y farol de los que
  quisieron sacarlo), yunque de Sahrim (a5_llanuras: plinto, yunque de perfil con cuerno, la hoja al rojo, tenazas, martillo
  caído, cadenas a cuatro bolardos, escoria viva, herreros), crisol volcado (a5_rio: pórtico con polea y cadena cortada, crisol
  en su cuna, chorro y canaleta al molde del sello), campana de la marea (a6_costa: mástiles en A, campana con percebes y algas,
  la soga del badajo que se va al agua, bote volcado, ahogado en la red, barriles, farol), Abadesa de la Sal (a6_arrecife:
  estatua velada de sal con la campanilla, peregrinos de sal de rodillas, costillar de ballena con coral, luz del mar),
  campanario ladeado (a6_barrio1), coro de nueve campanas enterradas (a6_barrio2), escalera de los siete (a7_cielo: sube hacia
  la izquierda y se corta en el aire, baranda de oro, seis marcados bebidos, el bastón y el manto del séptimo al pie) y cáliz de
  Aun-Saar (a7_jardin: cáliz de oro seco con corona de puntas, seis suplicantes de mármol, árbol de oro muerto). Todos con su
  `resplandor` menos la puerta. Lab: `t1020_pieza_lab.mts "acto_hito:a3_tambor+..."` (láminas en `/tmp/requiem-pruebas/e3`);
  en el juego `DX=7 DY=7 _m_hitos_vista.cjs <etiqueta> <zonas>`.

- **Entrega 3 revisada**: pasaron t1000 (exterior arena 57 a 59, obra 56 a 57, montados exterior 16 a 18 por el corrimiento de
  a1_bosque, a1_cementerio y a4_picos), t1001, t855 (0 distintas en 192), t370 (288, 0 malas), t440, t450, t500 y
  conectividad 20 (1920). t1011 da 1 o 2 atascados de unos 2500 en cada corrida, igual que en cc59d12 (a1_mina1, un zombi
  pegado a 3 de Thor): ya estaba, no es de esto. `MAPA_V` sigue en 3: los pisos no cambiaron, solo objetos.

## Mundos, entrega 4 (21 nov 2026)

- **El azar de las casas iba adentro de un `REGISTRO.find`** (las salidas `casa` de los exteriores): una tirada por cada pieza
  del catálogo hasta dar con la casa, así que registrar cualquier pieza nueva corría el azar de todo lo que venía después
  (a1_bosque, a1_cementerio, a4_picos). Ahora se tira una vez. Nada de `r()` adentro de un callback de `find`, `filter` o
  `some` sobre el catálogo. Prueba: `node juego/herramientas/t1014_catalogo_azar.mjs [semilla]` genera las 96 zonas con y sin
  una pieza de más y falla si alguna cambia. El arreglo movió una vez las zonas con casa (los pisos no).
- **Desvíos de los actos 3 a 7** (filas nuevas en `DESVIO`): el tambor callado (a3_selva), el embarcadero de los que esperaban
  el barco de Ama (a3_pantano), el vigía del jarl (a4_picos), el refugio del cazador (a4_glaciar), la forja del desertor
  (a5_llanuras), la orilla de los que cantaban (a5_rio), la caleta de las viudas (a6_costa), la perla del buzo (a6_arrecife),
  el patio del sacristán (a6_barrio1), el altar de la pescadora (a6_barrio2), el último descanso de los siete (a7_cielo) y
  los que se abrazaron (a7_jardin). Cada uno con lo que se ve de lejos, su cuello, su relato y su sendero (`FAM_SENDERO`). En
  los mundos angostos (el Paso del Glaciar) `trazarDesvio` da una segunda vuelta más floja solo si la primera no dio (así no
  mueve los de antes). 36 de 36 con cofre alcanzable en 3 semillas (`ZONAS=... _m_desvios.mjs`, no se sube).
- **Relatos de los actos 5 a 7**: el muerto de cada tierra (`MUERTO`: quemados de la fragua, ahogados de Ysmeral, bebidos
  del dios; antes era el soldado de la fortaleza en todas partes), la fogata (`FOGATA`: la pira del acto 5, el brasero
  blanco del 7) y lo de al lado (en el 6 la cesta de pescado, en el 7 un bebido sentado: sed, nunca hambre). Castigos nuevos:
  selva (la jaula con el preso, el poste de cuernos, el muerto tribal y las estacas con cráneos), nieve (la horca con su
  ahorcado, el congelado, el trofeo de escudos y la jaula), infierno (los empalados, el desollado, la charca de sangre y la
  doncella) y la costa de Ysmeral (la red llena de huesos, los ahogados enredados y contra el ancla, el pescado podrido).
- **Trampas con intención** (oleada 4; `ponerTrampas` al final de `generarZona`, azar propio, capa `trampa`; piezas en
  `catalogo/trampas.ts`; lógica en `actualizarTrampas` y `volcarBrasero` de `juego/mundo.ts`; `__sinTrampas` apaga las dos).
  Losas de púas (`trampa_puas`) en los pasillos de la obra, 2 a 4 por mazmorra, lejos de entradas y del ruedo: saltan con
  quien las pise (héroe 5 % de su vida, monstruo común 30 %, élite 12 %, jefe 4 %; 2,4 s de respiro). Brasero flojo
  (`trampa_brasero`, tag `volcar`) delante de uno de cada dos campamentos de obra (no en el agua ni en el cielo): de un clic
  se vuelca hacia el lado contrario al héroe y deja una lengua de fuego de 4 celdas que quema 6 s (al monstruo 6 % por medio
  segundo, al héroe 3 %). Barriles de aceite (`com_barril_explosivo`, el `romper` de siempre) delante de los campamentos de
  afuera y de las minas. Grietas que respiran (`trampa_grieta`) en el acto 5: quieta de 4 a 6 s, aviso 1 s, erupción que
  quema al que esté encima (héroe 6 %, monstruo 35 %). Lazos (`trampa_lazo`) en la selva: agarran al primero que pisa el aro (héroe 1,1 s, monstruo
  3,5 s) y quedan saltados. Nada se guarda (el estado vive en `dato`). Prueba en el juego: `_m_trampas.cjs <etiqueta> <zonas>`
  (no se sube): pisa las púas, el lazo, mira la grieta y vuelca el brasero con un monstruo delante.
- **Hitos rehechos tras la revisión**: el gigante del glaciar ahora es un cuerpo atrapado (pecho, hombros, el brazo derecho
  afuera con el hacha, el izquierdo comido por el hielo, cara de carne helada con cuencas hondas y barba de carámbanos,
  melena en mechones) en un glaciar de cristales (`cristal`: prismas de seis caras con punta, cantos duros) con la losa
  rajada; el yunque y el coro de campanas más grandes; el campanario con el campanario más alto y la campana a la vista entre
  los arcos; el tambor de Yhuantl con el arco de la llamada (dos postes pintados con cráneos y plumas, el travesaño con
  cráneos y tamborcitos), la pintura verde que brilla en el tambor, fuego más alto y su luz más grande.

- **Entrega 4 revisada**: t1000 (exterior arena 59 a 57, obra 57 a 55 con los braseros y las púas, montados obra 7 a 9,
  adornos por pantalla obra 38 a 39; el ruedo de a6_arrecife bajaba a 8 por el desvío nuevo: en los actos 3 a 7 el desvío va
  a 14 celdas más del claro del jefe), t1014 (96 iguales), t1011 (1 de 2545, el de siempre), t1001, t855 (0 de 192), t370
  (288, 0 malas), t440, t450, t500 y conectividad 20 (1920). t1010 (niveles 35 y 50, 3 semillas, contra cc59d12): muertes por
  hora 8,5 a 6,2 y 0 a 0, pociones por 100 bajas 16,3 a 17,4 y 9,3 a 5,9: dentro del ruido. El daño de las trampas al héroe
  quedó en 5 % las púas y 6 % la grieta (con 7 y 10 % el nivel 35 subía).

## Mundos, entrega 5 (21 nov 2026)

Rick mandó dos capturas: "mira como salen cofres y otros assets como debajo de las paredes" (un cofre metido en el muro de
atrás de una mazmorra de damero y sillares, y mesas de embalsamar con su muerto contra el muro de una cripta, con la pared
pintada encima).

- **La causa no era solo dónde se ponían las cosas**: un muro de 5 x 1 se ordenaba entero con la profundidad de su punta de
  adelante (`prof` = la celda de más x + y), así que todo lo que estaba delante de sus cuatro celdas de atrás se pintaba ANTES
  y el muro lo tapaba: cofres, jergones, braseros de las puertas, lo que viste las paredes, el castigo y los relatos contra el
  muro (y al héroe, que por eso hacía translúcido el muro). Medido con `t1015_tapados.mjs` (3 semillas, punto por punto con
  las máscaras de los atlas, sin contar la sombra horneada ni el escombro, que es del muro): 1.660 adornos tapados (1.587 en
  las mazmorras, el 15 % de los adornos de bajo tierra, 66 en los pueblos), por capa pared 850, umbral 232, interactivo 185
  (cofres, urnas, barriles), riego 160, sin capa 116, y menos macabro, vida, horror, escondido, relato y jefe. Por pieza
  encabezan el jergón (218), las vasijas, los barriles, las cadenas de pared, las velas y los braseros.
- **Franjas** (`franjasDe` en `render/escena.ts`, `__murosEnteros` vuelve a lo de antes): todo lo largo (el lado largo de 3 o
  más y el corto de a lo sumo la mitad: muros, empalizadas, sarcófagos de 3) que no se mece, no arde, no es ancla de salida ni
  se pisa por dentro se pinta en franjas de 16 puntos, una por celda a lo largo del eje largo, cada una con la profundidad de
  su celda (un pelo menos, para que lo de la celda de delante gane el empate); las de las puntas llegan al borde del cuadro
  con la sombra. Lo alto con bruma también. El muro se vuelve translúcido solo si la franja que tiene al héroe está delante de
  él (antes, con el héroe delante de la punta de atrás de un muro, el muro entero se aclaraba).
- **Nada metido en un muro** (`despegarDeMuros` al final de `generarZona`, sin azar, `__pegadosAlMuro` lo apaga): (1) lo
  suelto cuya huella pisa la de un muro (la esquina a inglete va al final y caía encima de las velas, los huesos y los
  braseros de los rincones) se corre de 1 a 2 celdas hacia la sala, a piso libre; si bloquea o no hay sitio, sale. (2) Lo que
  no está metido pero cuyo dibujo cae bajo una franja de muro que se pinta después (lo tendido y ancho que pasa de su huella:
  un crucifijo caído, un estandarte, una pila de cadáveres que se ordena por su borde de atrás) se mide con su caja
  (`cajas_sprite.json`) contra las franjas del muro (`franjasMuro`, con `cajas_muro.json`, que ahora también escribe
  `t1013_cajas.mjs`) y se corre o sale. Lo que bloquea solo se corre a piso libre con anillo libre; el asiento del jefe va más
  lejos si hace falta (`PASOS_LEJOS`) y nunca sale. Lo que tiene `tag` no se toca (salvo urnas y barriles, `romper`, y los
  restos), ni el escombro (es del muro; correrlo cerraba pasos en la cuenta estricta de t370), ni la jamba de una puerta (`umbral`) si
  no tiene a dónde ir. En 3 semillas: 352 corridos y 76 quitados.
- **Nichos secretos que se leen**: el cofre iba al medio del nicho y quedaba detrás del muro de la sala de al lado (bien
  ordenado, pero se leía como un cofre atravesado por la pared). Ahora va contra la boca, del lado que se ve desde la sala
  (la cámara mira a -x -y), con los huesos y una vela al fondo, dos velas a los lados de la boca (luz tenue que la marca) y el
  rastro de sangre de siempre. `__nichoViejo` vuelve al cofre del medio.
- Resultado de `t1015_tapados.mjs` (96 zonas x 3 semillas): de 1.660 (antes, `ENTEROS=1 BANDERAS=__pegadosAlMuro,__nichoViejo`) a 0.
  Uso: `node juego/herramientas/t1015_tapados.mjs <etiqueta> [semillas]` (`SOLO=`, `RECORTES=16` los peores pintados con los
  atlas de verdad en `/tmp/requiem-pruebas/tapados/<etiqueta>/recortes`, `NICHOS=6` cómo se ve cada nicho, `ENTEROS=1` el
  orden de antes, `BANDERAS=`). Falla si queda alguno. En el juego: `t1016_tapados_fotos.cjs <etiqueta> [zonas]` (elige
  nichos y lo que está contra el muro en la corrida de ahora y la del antes vuelve a los mismos sitios con
  `BANDERAS=__murosEnteros,__pegadosAlMuro,__nichoViejo`) y `python3 juego/herramientas/t1016_lamina.py antes ahora`
  (`/tmp/requiem-pruebas/tapados/fotos`).
- **Losa de púas que avisa**: dos manchas de sangre vieja corridas a lo largo del paso (`gore_sangre_seca` y `cri_sangre_seca`,
  planas, `__puasLimpias` las quita) y las puntas de acero que destellan de a una cada 2,6 s, con un brillo frío que respira
  en las 16 (`brilloPuas` en escena.ts, `__puasMudas`).
- **Desvíos de los actos 3 a 7 lejos de bocas y casas**: `trazarDesvio` pide 38 celdas al punto de una salida `abajo` o `casa`
  (las bocas y las casas son grandes y van al norte de su punto) y 26 a las del borde; si no da, 28 y 14, y una tercera vuelta
  con 22 (el Paso del Glaciar). Los de los actos 1 y 2 no cambian. 36 de 36 con cofre alcanzable; la distancia del claro al
  borde de la boca o la casa más cercana va de 20 a 94 (antes de 19 a 74, con varios en 19 a 21).
- **Gigante del glaciar con cara de viejo jarl** (antes se leía de simio: cara ancha, hocico chato, cabeza hundida entre los
  hombros): cuello que la levanta, cabeza más alta que ancha, frente alta, cejas finas, pómulos, nariz larga y recta en su
  propia masa, mandíbula angosta, bigote y barba blanca que baja por el pecho y se congela en carámbanos, y la melena larga
  que cae por la espalda y los hombros. Horneado con `SOLO=acto_hito`.
- Pruebas: t1000 (exterior arena 57 a 56, obra 55 a 54, montados obra 9 a 8, adornos por pantalla obra 39), t1014 (96
  iguales), t1011 (1 o 2 de unos 2500, el de siempre), t1015 (0 tapados), t1001, t855 (0 de 192), t370 (288, 0 malas: la primera
  corrida dio 6 porque el escombro del frente se corría hacia la sala y su ocupado, que t370 cuenta como muro, cortaba un
  pasillo; el escombro ya no se mueve), conectividad 20 (1920), t440, t450 y t500. `MAPA_V` sigue en 3 (los pisos no cambian).
  Flojo: el destello de la losa es chico (5 puntos, a propósito: se nota si se mira) y el gigante en el juego no entra entero en
  la pantalla de 720 con el héroe al pie (mide 464 puntos).

## Mundos, entrega 6 (21 nov 2026)

Rick: "Acomodá lo flojo, quiero perfección." Lo que quedó flojo de la entrega 5 y un recorrido por las 96 zonas.

- **Hitos que entran en 720** (`exterior` y `conectar` en `zona.ts`, la cámara en `dibujarMundo` de `escena.ts`). Con el héroe
  al pie 17 de 72 puestos se cortaban arriba (el gigante 46 puntos, la escalera de los siete 119, el tambor de Yhuantl 299
  porque la selva lo tapaba y no había desde dónde mirarlo). Tres cosas: (1) el hito mira a +x +y y ahora necesita su
  **explanada** delante (`frente`: piso a 8 celdas por la diagonal con radio 6, o 7 con radio 4, y lejos de las bocas y casas);
  queda reservada como claro y lo que bloquea y cayó ahí después sale (`desmontarFinal`). Después de los claros no se tira
  más `rl`, así que no mueve otro lugar. (2) El hito se iba entero en 1 de cada 10 zonas (`destapar` y `conectar` lo partían
  para abrir paso): `destapar` lo saca solo si no hay otra cosa y en `conectar` pesa 450 (más que el vacío). 0 sin hito en
  18 zonas x 30 semillas. (3) **La cámara sube** frente a un hito lo justo para que entre entero, a lo sumo 150 puntos (o 0,48
  del medio alto visible): el héroe queda en el tercio de abajo, nunca bajo el HUD (`hitosDe`, `__hitoCortado` lo apaga). No
  se achicó ninguna pieza: siguen monumentales. `__hitoViejo` vuelve a la colocación de antes. Prueba:
  `t1030_hitos_pantalla.cjs <etiqueta> [zonas] [frente,izq,der,detras]` (falla si alguno se corta; 72 de 72 enteros, el
  héroe baja hasta 453 de 648 con la escalera y el tambor). Ojo: la explanada y el paso que rodea el hito abren alguna
  baldosa distinta a cielo abierto: **`MAPA_V` pasó a 4** (se pierde solo la niebla).
- **La ventana de lo alto** (`render/recorte.ts`, `__alfaViejo` lo de antes): con el héroe detrás, lo alto que lo tapa ya no
  baja entero a 0,45 (el hito quedaba como un fantasma): se abre un óvalo de 76 x 100 puntos del dibujo alrededor del pecho,
  con un velo de 0,26 de la pieza en el medio y el borde a escalones de un octavo tramados en Bayer 4 x 4, pegado a la grilla
  de la pieza. Se abre y se cierra en 0,25 s por pieza. Los muros en franjas solo abren las franjas que están delante del
  héroe. El relieve de la luz avanzada va a media fuerza en la pieza abierta (`relieveDe` en assets.ts).
- **Obra: 40 adornos por pantalla** (t1000, antes 39). La medida cambió y es más justa: `DECO` en `medir_espacios.mjs` cuenta
  lo que una capa de adorno puso aunque su id diga pared, muro o puerta (cadenas y candeleros de pared, momias de pared, la
  pared de carne, los santuarios, que caían por el `rio_` de `com_santuario_`), y lo que cuelga de la pared y su rastro al pie
  no cuentan como montado. `MEDIDA_VIEJA=1` vuelve a la cuenta de antes (con ella la obra queda en 39: lo que suman los faroles y los refugios
  del fin lo pierde `desmontarFinal` al sacar lo que estaba montado). Con intención: **vías alumbradas** (`alumbrarVias`, `__viasOscuras`): en las minas un farol de mina cada 8
  a 11 celdas donde había una piedra de la orilla del túnel, y en las galerías sin túnel faroles al pie del muro de atrás
  cada 9 a 12 celdas (no bloquean, capa `pared`); y **refugios del fin** (`FIN` en `vestirParedes`, `__sinRefugiosFin`):
  donde no había refugios, el cielo (el bebido sentado o de rodillas con sus velas), lo ahogado (el marino con su nasa o el
  pescado) y el infierno (el desollado o el calcinado con velas en calaveras). Montados obra 8 a 4, arena 54 igual.
- **Nada montado al final** (`desmontarFinal`, sin azar, al final de `generarZona` antes de las esquinas; `__montadosFinal` lo
  apaga): `desmontar` no veía lo que se pone después (trampas, asiento del jefe), lo de la pared (sin caja: ahora
  `cajas_deco.json`, que escribe `t1013_cajas.mjs`) ni los pares que pesan lo mismo (urna detrás de columna, brasero de la
  puerta sobre la losa de púas, el cofre debajo de la horca, cosas encima del hito). Queda el que pesa más; el otro se corre
  a 1 a 4 celdas a donde se llega caminando, con todo el anillo libre (nunca al ruedo del jefe; lo que bloquea solo si se
  rompe; sin el anillo, una urna corrida a un cuello de una celda lo cerraba en la cuenta estricta de t370, a1_cripta), lo de
  la pared a lo largo de su muro, o sale. Montados exterior 17 a 9, obra 8 a 4 (t1000). Los bebidos de rodillas de la ofrenda ya no van
  iguales en fila (`__bebidosIguales`).
- **Losa de púas de reojo** (`render/puas.ts`; `__puasViejas` el destello de antes, `__puasMudas` nada): el canto de la losa en
  un rombo frío que respira, las 16 puntas con su caña, cada 2,4 s un barrido de luz que cruza la losa en diagonal (las
  puntas se encienden de a una), un velo frío sobre toda la losa y la estrella de 9 x 7 en lo alto, y su luz fría en
  luces.ts (`luzPuas`). Prueba: `t1031_puas.cjs <etiqueta> [zonas]` (30 cuadros seguidos de la losa).
- **Atascos** (`avanzar` y `rodeoCuerpos` en `juego/mundo.ts`; `__colaVieja` vuelve a lo de antes). La causa del de
  siempre (a1_mina1, a7_trono, a7_islas1, a5_abismo2): a unas 3 casillas del héroe pegado a un muro chico, el punto del corro
  aparecía y desaparecía cuadro a cuadro (`dist < 3`) y el camino se rehacía cada 0,6 s hacia uno u otro lado del muro: el
  cuerpo iba y venía sin acercarse y sin contar como trabado. Ahora: histéresis (entra a 3, sale a 3,8), cerca del héroe el
  rodeo elegido dura 1,6 s, quien no se acerca 0,3 en 1,5 s queda en cola, y el trabado o en cola busca con `rodeoCuerpos`
  (búsqueda a lo ancho de media casilla que ve muros y cuerpos enteros, sin apretarse) un hueco libre del aro de golpe y
  apunta ahí; si el corro está lleno de verdad espera quieto su turno; al llegar sale de la cola (antes de esto la cola
  seguía tirando del que ya estaba pegando). Probado y descartado: seguir paso a paso el camino de `rodeoCuerpos` (de 1 a
  unos 20 atascados por corrida: los que hacían cola se peleaban el mismo hueco y daban vueltas). t1011 cuenta aparte a los
  que esperan turno (`esperan`, `SIN_TURNO=1` los cuenta como atascados) y acepta `BANDERAS=`. **No quedó en 0**: en 16
  corridas de `todas 2` dio 7 atascados (unos 40 000 casos; 8 corridas seguidas en 0 y otras 8 con 0 a 2), antes 7 en 6
  corridas. Lo que queda es el que tiene hueco del otro lado del corro: el camino de la grilla pasa por encima de los cuerpos
  que ya pegan y empuja en vez de rodear. Arreglarlo de verdad es un camino con cuerpos que no se pelee el mismo hueco.
- **Recorrido de las 96 zonas**: `t1032_recorrido.cjs <etiqueta> [zonas|todas] [n]` (4 fotos por zona en puntos fijos,
  `PUNTOS=` otro archivo de puntos: `hito_frente`, `hito_detras` y cualquier celda con `dx`, `dy`; se retoma si se cae) y
  `t1033_auditoria.mjs <etiqueta>` sin navegador (flotando, repetidos, junto a la salida, montados al 60 %, hito sin explanada;
  `HEROE=auditoria1` usa la semilla con que ese héroe ve cada zona). Lámina de los 12 peores: `t1034_lamina.py antes ahora`
  (`/tmp/requiem-pruebas/e6/lamina_1.png` y `_2`). Con HEROE=auditoria1, antes y ahora: montados 625 a 235, repetidos 71 a
  49, hito sin explanada o ausente 8 a 1 (con las 3 semillas de t1000: montados 2189 a 700, repetidos 213 a 201). Lo que queda "flotando" (unos 290) es a propósito: lo que vive en el vacío del
  abismo y del cielo y las matas de la orilla.

## Mundos, entrega 7 (21 nov 2026)

Rick: "resuelve lo flojo, no quiero nada flojo". Lo flojo de la entrega 6: los atascos no llegaban a 0 y las minas sin túnel
estaban peladas.

- **Atascos: el corro con huecos reservados** (`avanzar`, `rodeoCuerpos`, `rodeoAceptable`, `huecosDe`, `cuerpoDelante` en
  `juego/mundo.ts`; `__colaE6` vuelve a lo de la entrega 6). Lo que quedaba era el que tenía hueco del otro lado del corro:
  apuntaba al hueco pero iba por la línea recta o por el camino de la grilla, que pasan por encima de los cuerpos, y empujaba.
  Ahora: (1) cada uno **reserva su hueco** del aro de golpe (vive en el objetivo, `huecosCorro`; caduca a 1,5 s, al llegar, al
  morir o al cambiar de objetivo) y en la búsqueda los huecos de los demás cuentan como cuerpos: dos no se pelean el mismo;
  (2) **sigue paso a paso** el camino que rodea a los cuerpos (media casilla) y lo rehace cada 0,5 s, prefiriendo el hueco que ya
  tenía si queda a 3 pasos o menos del más cercano (si no, saltaba de un lado al otro del corro); (3) el rodeo es **pegajoso**:
  quien entra a rodear sigue hasta llegar o hasta que el héroe se le vaya a más de 7 (antes, al alejarse por el rodeo dejaba de
  estar "en cola" y volvía al montón); (4) un rodeo vale solo si no es una vuelta entera (1,6 veces lo que falta más 2,5): si
  no, el que ya está trabado o en cola **espera quieto mirando** (`esperaH`); el que solo tenía un cuerpo delante sigue
  arrimándose como siempre; (5) empieza a rodear apenas tiene un cuerpo pegado delante (`cuerpoDelante`), sin esperar un segundo
  a contar como trabado; (6) el punto del corro que cae dentro de un muro o del otro lado (héroe pegado al muro, a7_islas2) se
  cambia por el objetivo. Dos errores de antes: la espera de la entrega 6 se llamaba `espera`, como la de la escolta, y
  `pelear` la borraba al cuadro siguiente (el que debía esperar empujaba, y a veces se quedaba hasta 1 s en alerta); y el
  punto del corro del otro lado del muro, que era el de siempre de a7_islas2.
- **Las pruebas de atascos miran el rodeo** (t1011 y t995): avanzar también es acortar el camino entre los cuerpos
  (`rodeoAceptable`, a los 6 s 0,6 o desde los 7,5 s 0,3); el que no tiene rodeo aceptable espera su turno (`esperan`); el que
  al final está pegando o en plena maniobra, con su aviso, está peleando (`actuan`). `SIN_TURNO=1`, `SIN_RODEO=1` y
  `SIN_ACTUA=1` vuelven a contarlos. Antes el que daba la vuelta al corro por el lado libre se contaba atascado porque el
  camino de la grilla (sin cuerpos) le decía que se alejaba. `_m_atasco2.mts` (no se sube) es t1011 con el azar sembrado
  (`SEMILLA=`) y la traza de los últimos 3 s de cada atascado (`HIST=1`).
- **Minas vestidas** (`vestirMina` dentro de `vestirParedes`, azar propio `rm`, capa `pared`, nada bloquea; `__minaPelada` lo
  apaga). Las galerías sin túnel (Galerías de Velmora, Socavones) quedaban en 25 y 27 adornos por pantalla. Contra la roca
  (en las minas la orilla es roca que bloquea, no muro: `M` local mira también `bloq === 1`) y sin el veto del claro de la
  sala (la franja contra la roca casi siempre cae adentro): el **entibado** (marcos `min_puntal` paralelos al muro cada 4 a 6
  celdas, `cue_puntal` con farol contra el norte, la cuerda de faroles `min_linternas_cuerda`); las **faenas**, por turno, a 8
  celdas una de otra: el frente de la veta (pico clavado, mineral, carretilla), el derrumbe que mató a alguien (viga caída,
  minero, vela), el polvorín (dinamita, pólvora, cartel), la mesa del capataz con el taburete volcado, la vagoneta volcada con
  su carga y el andamio con herramientas y escalera; lo suelto contra cualquier roca (herramientas, cajones, picos,
  carretillas, huesos) y las **goteras** (`cat2_gotera`, planas, las únicas que van en el medio). No hubo que hornear piezas
  (todas estaban en el catálogo). t1000 (semilla 12345): a1_mina1 25 a 41, a4_minas1 27 a 38, a1_mina2 35 a 43, a4_minas2 39 a
  44; montados 0 y 5 a 6 %, arena igual o más (la familia obra 54 a 55, adornos por pantalla 40 a 41). Mueve las trampas de
  algunas minas (se ponen después, miran lo ocupado). Lámina: `/tmp/requiem-pruebas/e7/lamina_minas.png` (t1021 antes y ahora).
- Pruebas: t1011 (`todas 2`) 22 corridas seguidas en 0 atascados (55.683 casos; esperan su turno 0 a 6 por corrida, 54 en total, unos 7.600 rodean; antes de cerrarlo 2 de 22 y 1 de 20 en dos tandas previas, que se arreglaron); t995 dos tandas de 4 zonas, 0 y 0 (esperan 0); t1010 niveles 35 y 50, 3
  semillas, contra main: muertes por hora 9,7 a 7,8 y 0 a 0, pociones por 100 bajas 19,2 a 20,2 y 11,1 a 8,0, a la vez 5,9 a
  5,9 y 5,0 a 4,9 (dentro del ruido). t1000 (todo en su piso), t1001, t1014 (96 iguales), t1015 (0 tapados), t855 (0 de 192),
  t370 (288, 0 malas), t440, t450, t500 y conectividad 20 (1920). Capturas en serie de un campamento contra el héroe
  invulnerable (`_m_serie.cjs`, no se sube, `BANDERAS=__colaE6` el antes): el corro sigue cerrado y encima del héroe.
  `MAPA_V` sigue en 4 (los pisos no cambian).
- Flojo: las minas llegan a 38 a 44 por pantalla pero el medio de las salas sigue limpio a propósito (es para pelear), así que en
  las fotos se nota sobre todo en el muro de atrás; los marcos del entibado salen menos de lo pensado (2 a 4 por mina: la caja de
  un marco pisa lo que ya había contra la roca y se descarta). La criba de las pruebas de atascos se amplió (rodeo, turno,
  maniobra): está dicho arriba y hay banderas para contar como antes.

## Mundos, entrega 8 (21 nov 2026)

Rick: "deja perfecto bichos y minas, no quiero nada a medias". Dos frentes: comprobar que el 0 de atascos de la entrega 7 no era
maquillaje de la criba (y arreglar lo que sí era atasco) y dejar las minas apuntaladas de verdad.

- **La criba, mirada con la cuenta estricta** (`SIN_RODEO=1 SIN_TURNO=1 SIN_ACTUA=1` en t1011 y en `_m_atasco3.mts`, que no se
  sube: es `_m_atasco2` con la espera de cada uno, si esperaba con un hueco libre y con el corro vacío). Con lo de la entrega 7
  (semilla 101) la estricta daba 3 de 2529: un zombi que rodeó y empezó una maniobra (pelea, está bien), uno que esperaba con el
  corro lleno (está bien) y **uno real**: en a1_abadia1 caminó 1,5 s en el sitio contra la espalda de otro y después se quedó
  esperando parado con un hueco libre a 10 casillas de camino. Midiendo la espera aparecieron más: de 110 esperas por corrida,
  24 tenían hueco libre (hasta 5 s parados), y algunos esperaban con nadie pegándole al héroe.
- **Atascos reales arreglados** (`avanzar`, `rodeoAceptable`, `corroOcupado` en `juego/mundo.ts`; `__colaE7` vuelve a todo lo de la
  entrega 7):
  - **Caminaba en el sitio** contra la espalda del que pegaba (sin rodeo que valiera, "seguía arrimándose" hasta contar como
    trabado, 1 a 1,5 s): ahora, con un cuerpo pegado delante (`cuerpoDelante` con holgura 0,15) y el corro ocupado, espera mirando
    al héroe al toque. Y el que tiene un cuerpo delante empieza a rodear desde 5,5 casillas (antes 4,5: a 4,9 empujaba).
  - **Esperaba con un hueco libre**: el rodeo valía solo hasta 1,6 veces lo que falta más 2,5. Ahora la paciencia (`tEspH`, lo que
    lleva esperando) estira el rodeo que acepta: desde 1,2 s de espera 8 casillas más por segundo, hasta 18 más, con tope de 16
    casillas de camino (24 pasados 2,5 s).
  - **Iba y venía**: al echar a andar por el rodeo largo la paciencia se borraba, en la vuelta siguiente el mismo rodeo ya no
    valía y se paraba otra vez (a1_guarida, a5_abismo2, a7_islas1). La paciencia ahora se borra al llegar o al dejar de rodear.
  - **Esperaba con el corro vacío**: sin nadie a tiro de golpe del mismo objetivo no hay turno que esperar (en las islas de
    a7_islas2 el hueco quedaba fuera de la grilla de `rodeoCuerpos`, y un anillo de los que esperaban a 2 casillas se esperaba a
    sí mismo): va por el camino de siempre. `corroOcupado` cuenta solo a los que van por el mismo objetivo y están a tiro (radio +
    radio + 1; el perro o Thor pegados al héroe no son su corro).
- **t1011 mide la espera** (`esperaMax`: la espera parada más larga de uno que va por el héroe; `vacio`: cuadros esperando sin
  nadie pegándole al héroe, tiene que dar 0). Ojo: en t1011 nadie pega (`cd` 999) ni muere, así que un corro lleno queda lleno los
  9 s y el que espera detrás espera hasta el final (5 a 7 s): eso es de la prueba. En el juego entran 2 a 4 a la vez y el resto
  ronda (`enFrente`, `rondar`), así que la espera parada es para los del frente.
- **Video de verdad** (`_m_video_camp.cjs <etiqueta> [zonas]`, no se sube; reloj controlado a 25 por segundo, el héroe invulnerable
  sin pegar contra un muro junto al campamento más grande, `ABIERTO=1` en lo abierto): guarda el mp4 y cada cuerpo cuadro a
  cuadro, y cuenta los que se deslizan sin andar, tiemblan (el paso se da vuelta 6 veces en un segundo sin ir a ningún lado), se
  congelan andando o empujan sin avanzar. Videos en `/tmp/requiem-pruebas/e8/video`.
- **Minas apuntaladas** (`entibar` dentro de `vestirParedes`, azar propio `re`; `__entibadoE7` vuelve al entibado de antes). En la
  entrega 7 el marco iba después de lo de la pared y de lo suelto, y su caja casi siempre pisaba algo: de 2448 sitios contra la roca
  1328 se perdían por la caja y 797 por la huella (0 a 9 marcos por mina). Ahora va primero: contra la roca de atrás (norte u
  oeste) cada 4 a 6 celdas, también en los túneles de 4 a 6 de ancho, y en dos vueltas (la primera solo donde no pisa nada, la
  segunda donde lo suelto, chico y sin tag, le cede el sitio: lo regado, la vida y lo macabro de 4 celdas o menos). Lo que pesa
  (tags, cofres, urnas, escenas, relatos, horror, jefe, matanzas, luces, vetas, mineros, vagonetas, escombro, estructura) no cede.
  La mitad lleva luz (el puntal con farol contra el norte, la cuerda de faroles contra el oeste). Los túneles con vía llevan su
  marco que cruza sobre los rieles en los tramos rectos que no lo tenían. El marco delante del derrumbe de relleno no se desmonta
  (`marcoAnteFondo`: el relleno es fondo).
- **La roca de la mina** (`mazmorra`, `minaRoca`; `__minaObra` vuelve a lo de antes): la mitad de las minas salía con la sillería
  de obra (`muro_obra`, con sus farolitos verdes) y se leía como mazmorra. Ahora siempre la roca de la galería (`cue_muro`) y uno
  de cada seis tramos es la veta que se trabajaba (`min_pared_veta`: oro, hierro o la sangre que brilla, con su luz), con azar
  propio (`rv`). La roca tiene dos celdas de grueso: va con una celda metida en la roca de atrás (así túneles y galerías conservan
  el ancho del muro de obra; con las dos adentro un túnel quedaba de 3 y un santuario lo cerraba: t370 dio 2 zonas con una sala
  aislada) y con el centro sin redondear (`poner` lo guardaba una celda más adentro que lo que bloquea y la fila de atrás quedaba
  libre y encerrada). La pared con veta es muro para `MURO_TAPA` (`desmontarFinal` la sacaba y abría un hueco en la roca). Al pie de la roca va el
  derrumbe, no el contrafuerte de sillería (`aderezo`).
- **La vía entra a la galería** (`entrarVias` en `vestirMina`, azar propio `rw`, capa `via`; `__viaCortada` lo apaga): `rieles`
  tiende la vía solo por los túneles y se cortaba en seco en la boca de cada sala. Ahora sigue una baldosa adentro, gastada o
  hundida (plana: no estorba la pelea), y lo que se pone después no le cae encima.
- **Nada flotando ni metido en la roca**: `ponerEn` de `vestirMina` y la pasada de pared en las minas redondeaban el centro de
  las huellas pares y la pieza quedaba una celda corrida, con media huella sobre la roca (t1033: 63 flotando en las minas, 3
  semillas); y lo de `vestirMina` exige piso de verdad. Los faroles de la galería (`alumbrarVias`) piden el cuadro de 3 x 3 de
  delante libre: en la boca de un paso de una celda lo cerraban para la cuenta estricta (el jefe de a4_minas2 quedaba sin camino
  por celdas libres).
- **Los nichos secretos de las minas tenían cofre**: el nicho es un tramo sin salida y `rieles` le ponía el fin de vía y
  `orillaTunel` sus piedras: el cofre no cabía y no salía (6 de 22 en las 4 minas x 3 semillas). Ahora lo de la vía y las piedras
  del nicho salen antes del cofre: 22 de 22, 158 de 158 nichos con cofre alcanzable en todas las mazmorras (`_m_nichos8.mjs`, no
  se sube). Ojo: eso son unos 1,3 cofres nobles más por mina, y los cofres sueltos de las minas pasaron de 18 a 24 (hay más sitio
  contra la roca): el botín de las minas sube un poco.
- **Faenas y lo suelto** (`vestirMina`): más seguido (faenas 0,6 y a 8 celdas, lo suelto 0,35 a 3 celdas) para no perder
  densidad al cederle la roca a los marcos.
- **Medidas, minas** (a1_mina1, a1_mina2, a4_minas1, a4_minas2, 3 semillas; `_m_minas.mjs`, no se sube), antes y ahora por mina:
  marcos 2,6 a 12, cuerdas de faroles 2,8 a 6, paredes con veta 0 a 11, tramos de vía 7,3 a 11,3, luces 67 a 60 (las de antes
  eran en buena parte los farolitos verdes de la sillería de obra; ahora son faroles, puntales con farol, cuerdas y la veta de
  sangre). t1000 (semilla 12345), adornos por pantalla 41, 43, 38 y 44 a 64, 50, 62 y 51; montados 0 a 6 % igual; arena de las
  minas, media de las 12, 55,2 a 54,5 %. t1033 en las minas: flotando 63 a 0 (la pared con veta cuenta como muro), montados 22 a
  21 (todos del tesoro del jefe junto a su asiento, como en las demás guaridas). Fotos: `t1021_vistas.cjs` en
  `/tmp/requiem-pruebas/e8/vistas/{antes,ahora}` y la lámina `python3 juego/herramientas/t1021_lamina.py ahora antes` con
  `DIR=/tmp/requiem-pruebas/e8/vistas`.
- **Medidas, bichos**: t1011 normal (`todas 2`), con lo de ahora: 10 corridas, 1 atascado en unos 25 000 casos (a7_islas2: un
  esqueleto a 3,8 rodeando; no salió en 16 corridas sembradas de esa zona sola), `vacio` 0 (salvo 12 cuadros en una corrida: el
  corro se vació entre dos vistazos de medio segundo), `esperaMax` 5,9 a 7 s (es el corro lleno de la prueba, ver arriba). Espera
  con un hueco libre (`_m_atasco3`, 3 semillas): la mediana 1,6 s; de unas 80 esperas con hueco por corrida, 8 a 10 pasan de 3 s
  (máximo 5,1, con el hueco a más de 20 casillas de camino). Estricta (semilla 101): 3 a 20 a 32 según la corrida; mirando la
  traza de cada uno (`HIST=1`), todos menos 2 o 3 son "rodea y avanza" (el rodeo se acorta 2 o más pasos en los últimos 3 s), los
  otros esperan con el corro lleno; ninguno camina en el sitio. La estricta sube porque ahora el que esperaba con un hueco libre va
  por él dando la vuelta al corro, y esa cuenta no ve los cuerpos. t1011 además cuenta como que rodea al que cambió de hueco
  después de los 6 s (se lo tomó otro) y acortó el rodeo nuevo. t995 dos tandas 0 y 0 (esperan 1 y 0). Video (`_m_video_camp.cjs`): a1_mina1,
  a4_minas2, a7_islas2 y en lo abierto a1_paramo y a2_dunas, sin nadie que se deslice, tiemble, se congele andando ni empuje.
  t1010 (niveles 35 y 50, 3 semillas, contra main): muertes por hora 7,8 a 8,9 y 0 a 0, pociones por 100 bajas 20,2 a 21,9 y
  8,0 a 6,5, a la vez 5,9 a 6,0 y 4,9 a 4,9 (dentro del ruido).
- Pruebas: t1000 (todo en su piso: exterior arena 56, obra 54, adornos por pantalla obra 41, montados obra 4), t1001, t1014 (96
  iguales), t1015 (0 tapados; `t1015_tapados.py` redondea el ancla, las huellas pares de la mina van en media celda), t855 (0 de
  192), t370 (288, 0 malas), conectividad 20 (1920), t440, t450, t500, t995 (0 y 0). `MAPA_V` sigue en 4: las baldosas no
  cambian (solo dónde va la roca dentro de las de la mina, y eso no lo guarda la partida). t1000 acepta `BANDERAS=`.
- Flojo: la cuenta estricta no ve los cuerpos y cuenta como atascado al que da la vuelta al corro: hay que mirar la traza para
  separarlos (está dicho y hay banderas). Queda 1 atascado cada unas 10 corridas de t1011 que no pude reproducir. El que espera con
  el hueco a más de 20 casillas de camino sigue esperando hasta 5 s (dar esa vuelta se lee peor). Las minas suben a 50 a 64
  adornos por pantalla, todo contra la roca y el medio libre; si a Rick le parece mucho, `vestirMina` tiene las dos
  probabilidades (faenas y suelto) a mano. Los cofres de las minas suben (nichos que ahora salen y más sitio contra la roca).

## Mundos, entrega 9 (21 nov 2026)

Rick: "corrige todo hasta que quede". Lo flojo de la entrega 8: un atascado cada unas 10 corridas de t1011 que no se podía repetir,
el que esperaba hasta 5 s con un hueco libre lejos y una cuenta estricta que no distinguía al que rodea del que está trabado.

- **Por qué no se repetía** (t1011): el juego guarda `R = Math.random` al cargar y el contador de ids (`nid`) es de toda la
  corrida. Correr una zona sola cambiaba el id de Thor, su lado (`lado` sale del id) y con eso a quién perseguía cada cuerpo:
  la misma semilla daba otra pelea. Ahora `SEMILLA` cambia la fuente del azar por debajo, cada zona y semilla tira de su propio
  azar, los cuerpos y Thor llevan ids fijos y el reloj arranca en un punto propio por zona (los topes de caminos por cuadro van
  por `j.t`). `SEMILLA=n S=s t1011 <zona>` da lo mismo que esa zona dentro de la corrida entera (`FIRMA=1` lo comprueba). Cada
  caso deja su traza entera (cada cuadro de los 6 cuerpos y el progreso cada medio segundo) en
  `/tmp/requiem-pruebas/atascos/<semilla>/` con la línea para repetirlo. El atascado raro era uno de estos: un cuerpo que perdía
  su hueco o esperaba con uno libre a 10 a 20 casillas y salía a rodear tarde. Con el código de la entrega 8,
  `RAIZ=<copia de main> SEMILLA=1002 S=1 t1011 a5_abismo2` lo repite siempre. Con lo de ahora ese mismo lugar llega.
- **Lo que se arregló en el juego** (`avanzar`, `rodeoCuerpos`, `rodeoAceptable`, `rondaHueco`, `huecoEnAro` en
  `juego/mundo.ts`. `__colaE8` vuelve a todo lo de la entrega 8):
  - "Ya llegó" era radio + radio + 0,9, pero el golpe llega a 0,75: el que quedaba a 1,6 o 1,7 detrás de los que pegan caminaba en
    el sitio sin pegar nunca. Ahora 0,72. Y la meta de la búsqueda es todo el aro desde donde se pega (0,7, antes 0,65).
  - La búsqueda entre los cuerpos no dejaba salir en diagonal desde donde está el cuerpo (casi nunca es un punto libre de la
    grilla): el apretado en un rincón no veía la salida y esperaba con un hueco a 3 casillas. La grilla pasa de 13 x 13 a 20 x 20.
  - Paciencia: desde 0,5 s de espera acepta 16 casillas más de rodeo por segundo, hasta 26 (antes desde 1,2 s, 8 por segundo). El
    que espera vuelve a mirar cada 0,25 s, el que iba rodeando y perdió su hueco acepta 10 más y se queda en la espera con la
    paciencia que juntó (antes volvía al montón y empezaba de cero). A menos de 4, con un hueco solo lejano, espera desde donde
    está en vez de meterse en el montón. Ya en el corro (menos de 3,8) va siempre al hueco libre más cercano y no a su punto
    fijo del aro (le daba la vuelta pegado al héroe, a4_barbaro).
  - Hueco lejano (más de 26 casillas o fuera de la grilla): desde 1,4 s no se queda clavado, ronda por el aro de espera (3 a 3,8
    casillas) hacia ese lado, a media marcha, y da la vuelta si topa. Si en el aro no hay por dónde (islas) va por la vuelta
    larga de los muros (`porLejos`).
  - Paso angosto que abren y cierran los cuerpos: si el rodeo nuevo sale 4 casillas o más largo que lo que le quedaba, aguanta
    quieto hasta 0,75 s (antes seguía empujando por el camino tapado). Con el mismo hueco no cambia de camino por otro apenas más
    corto si el suyo sigue libre. Sin nadie pegándole al objetivo, el que espera vuelve a mirar en el mismo cuadro.
- **La cuenta objetiva** (t1011, `objetiva`, no mira nada del juego salvo los huecos que otros ya tomaron): cada medio segundo
  arma con los cuerpos de ese momento el campo de distancias por donde cabe el cuerpo entero hasta el aro libre de golpe, y suma
  cuánto lo acercó lo que caminó (o, si va al hueco que tomó o por la vuelta larga, cuánto se acercó a ese sitio). En los últimos
  3 s cada uno es `llegaron`, `avanzan`, `actuan` (maniobra), `corroLleno`, `otroObjetivo` (se fue tras Thor), `rondan`, `esperan`
  (menos de 2,5 s sin acercarse teniendo adónde), `vaiven` (3 casillas sin acercarse) o `atascados` (2,5 s o más sin acercarse
  teniendo adónde ir). La cuenta principal ahora es la de la entrega 8 que además la objetiva da por atascada, y `atascadosE8` es
  la de antes sola (`CRIBA_E8=1`). `esperaHueco` mide la racha más larga de quieto con el aro libre alcanzable, por largo.
- **Medidas** (`t1011 todas 2`, ahora 30 corridas seguidas, semillas 5000 a 5009, 6000 a 6009 y 7000 a 7009, 82.560 casos. Antes
  10 corridas con el código de la entrega 8, `RAIZ=` una copia de main): atascados 0 en las 30 (antes sin semilla 1 cada unas 10,
  con la semilla fija la cuenta de la entrega 8 daba 0 en esas 10). Objetiva: atascados 182 en 10 corridas (0,66 %) a 0 en 30,
  vaivén 1 a 0. Espera parada con un hueco libre: máximo 7 s a 2,5 s (con el camino de 20 casillas o menos 6,5 a 2 s), esperas de
  más de 2,5 s 212 en 10 corridas a 0 en 30. `atascadosE8` da 8 en 30 corridas: miradas en su traza, 6 avanzan por su rodeo (la
  cuenta vieja no ve el rodeo que se rehízo tarde) y 2 se fueron tras Thor. `vacio` 21 cuadros en 30 corridas (el corro se
  vació entre dos vistazos). t995 dos tandas 0 y 0 (esperan 0 y 1). Video (`_m_video_camp.cjs`, ahora en `e9/video`, cuenta la
  espera parada sin el que ronda): a7_islas2, a1_mina1 y a1_paramo a cielo abierto, nadie se desliza, tiembla, se congela ni
  empuja (láminas `lamina_*` y `cerca_*` en `/tmp/requiem-pruebas/e9/video`). t1010 (niveles 35 y 50, 3 semillas, contra main):
  muertes por hora 8,9 a 9,9 y 0 a 0, pociones por 100 bajas 21,9 a 18,6 y 6,5 a 7,0, a la vez 6,0 a 5,9 y 4,9 a 4,7 (ruido).
- Pruebas: tsc, t1000 (todo en su piso), t1001, t1014 (96 iguales), t1015 (0 tapados), t855 (0 distintas), t370 (288, 0 malas),
  conectividad 20 (1920 conectados), t440, t450, t500, t961. `MAPA_V` sigue en 4. Una corrida de `todas 2` tarda unos 45 s sola
  (2 min con tres a la vez y la nube cargada).
- Ojo: un servidor de desarrollo que lleva horas recargando puede darle a las pruebas que importan módulos otra copia de
  `actos.ts` sin las zonas de los actos 6 y 7 (t370 contó 147 y conectividad 980). Reiniciar el servidor antes de creerle a un
  número raro.
- Flojo: la prueba no pega (cd 999) y el corro lleno queda lleno los 9 s, así que la espera con corro lleno sigue llegando a 6,9 s
  (`esperaMax`, igual que antes: es de la prueba). El que ronda hacia un hueco lejano a veces topa a los dos lados y queda quieto
  hasta 0,6 s antes de ir por la vuelta larga. La cuenta objetiva mira el campo cada medio segundo: un paso que se abre y se cierra
  entre dos vistazos no lo ve. `atascadosE8` no llega a 0 porque su criba se confunde con rodeos buenos, no por atascos.

## Mundos, minas sin obra (21 nov 2026)

Rick vio en los Socavones dos "columnas de ladrillo". Eran las cadenas de pared de las criptas (`cri_cadenas_pared`), que traen
pegado su lienzo de sillería: contra la roca de la mina y de la cueva se leían como pilares de obra sueltos. Salen de `PARED_TEMA`
de la mina y de la cueva. De paso, lo demás de obra que caía en las minas: el relleno de los huecos usaba la paleta de las
mazmorras de obra (lienzos de `muro_obra`, columnas y arcos de `dec_ruina`, contrafuertes, estatuas): ahora roca (`bor_risco`),
derrumbes (`min_derrumbe`) y escombro con vigas; al pie de la roca va piedra suelta (`cue_escombros`) en vez de los bloques
labrados del derrumbe del páramo, y el riego de la mina no pone la estatua del páramo. `__minaObra` vuelve a todo lo de antes.
Además t1011 ya no cuenta en `esperaHueco` al que persigue a otro objetivo (un invocado) y lo tiene a tiro: en la prueba nadie pega
y quedaba quieto con el golpe listo (a4_minas2, `SEMILLA=861530 S=1`, 5 s). Pasaron t1000, t1014, t1015 (0), t1033 en las minas
(flotando 0), t370 (288), conectividad 20 (1920), t855, t1011 (`todas 2`, 3 corridas: 0 atascados, espera con hueco 2 s como
mucho), t995, t440, t450, t500, t1001 y t961.

## Mundos, entrega 10: roca viva (22 nov 2026)

Rick: las paredes de roca de las minas y las cuevas se leían como "pared". En la mina cada tramo era la misma pieza de 5 celdas
(`cue_muro`, dos alturas que se repetían) puesta a regla sobre el borde de la baldosa, y en la cueva el contorno era la misma
familia de lajas facetadas apiladas. Aprobó las cuatro cosas juntas: romper la línea, romper la altura, piezas nuevas de roca viva
y el pie de la roca. Todo nuevo va con su propio azar y `__rocaVieja` apaga todo (la roca de antes, a regla).

- **Piezas nuevas** (`src/engine/gotico/catalogo/roca_viva.ts`, materiales `rv_*`; cada variante sale de su propio azar por el
  nombre, no del de la semilla):
  - `roca_muro` (5 x 2, bloquea): roca cortada a pico. El tramo se parte a lo alto por estratos en diagonal (la misma línea
    inclinada en todo el tramo) y a lo largo en losas desparejas, con las juntas corridas de un estrato al otro (si se alinean es
    un muro de bloques). Cada losa es un poliedro con la cara plana y los cantos vivos, apenas girada, y cada estrato se retira un
    poco más que el de abajo (la cara sube en talud). La cara de arriba es angosta y la de atrás casi a plomo (un techo plano o una
    cuña con espalda en rampa se leían como tejado o carpa). La cresta va en escalones y hombros rotos: cada losa lleva su cresta
    casi pareja y el perfil (8 perfiles más dos espejos) sube y baja en tramos planos con el escalón corto en el medio; arriba,
    lascas echadas, no paradas. Grietas cavadas (`resta`), cascajo al pie y las marcas del pico en el material (`rv_mina`: golpes
    cortos en diagonal de a filas en las caras paradas). La roca es parda y cálida como la de antes, la que mira arriba baja un
    poco y lo alto se pierde a medias en lo oscuro del techo (pasados 58 de alto). Vetas `ov`, `hv`, `sv` (oro, hierro, la
    sangre con su luz): un bolsón de mineral sobre una grieta en diagonal. `m1`..`m10`, `ov1`.., con `_y` el espejo por la
    diagonal (adelante es +x), así la esquina a inglete sale sola (`roca_muro` en `ESQUINAS_MURO`).
  - `roca_muro_espolon` (`e<largo><fondo>_<n>`, de 2 x 1 a 3 x 2, bloquea): el saliente. La misma roca, más baja, que se mete en
    la de atrás y cae hacia las puntas (con estratos más gruesos y poco retiro: con los del muro se leía como una pagoda).
  - `roca_penasco` (2 x 2 de huella, no bloquea, como el `cue_penasco` que reemplaza; de dibujo mide 4 a 5 celdas de largo): el
    **macizo** de la cueva. Una masa que se abomba y se derrama: lo alto en hombros redondos de alturas dispares contra la roca,
    bultos que se hinchan en la cara, un banco bajo que se derrama hacia el piso, lascas a medio hundir en la cáscara (sin ellas
    la masa es cera) y bloques caídos al pie. Mira hacia `dir` (ocho rumbos de 45°, el lado del piso). `<fam>_<clase><n>_<dir>`:
    clases `a` alto (76 a 104), `m` medio (50 a 66) y `b` bajo (20 a 34: hombros, bancos de roca), tres caras por clase. Familias
    `c` cueva (caliza con estratos que se cortan y cambian de paso, chorreones de humedad, musgo en las repisas, la gotera con su
    charco, alguna estalagmita chica), `h` hielo (gris azulada con escarcha en lo que mira arriba, carámbanos y poca nieve) y `m`
    mina (la roca parda de la galería, pelada).
  - `roca_pie` (plano, no bloquea): el talud. Polvo claro que se derrama y piedra más grande y tupida contra la roca, cada vez más
    chica y rala hacia el piso, hasta 1,5 celdas sobre el piso. `m1`..`m4` (5 x 2, con `_y`) al pie de cada tramo de la mina;
    `c1`..`c4` y `h1`..`h3` (2 x 2) en la cueva.
  - **La primera vuelta salió mal** y la revisión del coordinador la rebotó: en la cueva quedaba un bosque de columnas y conos
    oscuros, todos altos y verticales, que tapaban el piso (piso legible de la cueva 10 a 9); en la mina la roca era gris, plana y
    muy oscura, y las crestas en punta se leían como carpas o pirámides oscuras; el talud no se veía. Antes de eso ya se habían
    rehecho las lajas en bandas de colores (parecían ladrillo), las crestas como tejados, el saliente como sombrero o pagoda (la
    losa de arriba quedaba flotando a la altura del estrato donde la cresta baja: ahora el pedazo se cierra en cuña), los
    peñascos de masa lisa (termiteros) y las bajas como bolitas de perla. Lab: `t1020_pieza_lab.mts
    "roca_muro,roca_muro_espolon,roca_penasco,roca_pie"` (láminas en `/tmp/requiem-pruebas/e10/lab_*.png`).
- **Romper la línea en la mina** (`lineaMina` en `zona.ts`, en `mazmorra` apenas se tiende la roca, antes de vestir nada: lo que
  se apoya contra la roca después se apoya contra la línea nueva; azar `rl`). Un tramo de cada tres más o menos se mete una celda
  en la roca (el **entrante**: la celda de piso que tapaba queda libre; no en la punta de una línea, donde dobla la esquina, ni
  donde atrás hay piso o algo) y uno de cada cinco echa un **saliente** que entra 1 o 2 celdas a la galería: solo con 10 celdas o
  más de galería delante (nunca en un túnel ni en un paso de una baldosa del trazado), 3 libres delante del saliente también en
  diagonal, nada debajo (tampoco la vía ni la reserva), sin armar bolsillo contra lo de al lado y a más de 15 del centro de la sala
  del jefe. `__sinEntrantes` y `__sinSalientes` apagan cada uno.
- **Al final** (`rocaViva`, después de `desmontarFinal` y antes de las esquinas): `rocaMina` le pone a cada tramo su cara (la veta
  guarda su mineral, ninguna cara igual a la del tramo de al lado), su talud, y revisa los salientes: el que quedó a menos de 7 de
  una salida, 6 de una entrada, 6,5 de un campamento o 13 del jefe se va, y si algo que se alcanza sin salientes deja de
  alcanzarse se va el de al lado. `rocaCueva` junta en macizos los peñascos del contorno de las cuevas (`cue_penasco`), del hielo
  (`bor_risco` `nieve_`) y de la orilla y el relleno de la mina (`bor_risco` `paramo_`): queda uno cada 2,4 celdas (los bajos cada
  2) y los demás salen (no bloquean; la roca la ponen `hueco` y `bloq`; lo que está sobre una celda de piso, como las piedras de la
  orilla de los túneles, se queda). Cada uno mira al piso que tiene cerca (la suma de las celdas de piso a 4 celdas) y **solo es
  alto si la roca le queda atrás** (norte u oeste, contra lo negro); de costado va medio o bajo, adelante siempre bajo. La altura
  sale de un campo suave (`ruido2` de escala 7), más baja en la mina y en el relleno de adentro, sin la misma cara a menos de 5
  celdas. Y el talud al pie de la roca de atrás de la cueva cada 2 a 4 celdas, lejos de salidas y entradas.
- **Lo que hubo que tocar fuera**: `roca_muro` y el saliente entran por el nombre en todo lo que mira `muro` (franjas del orden de
  pintado, `MURO_TAPA`, `despegarDeMuros`, las medidas) y `roca_penasco` en lo que mira `penasco`. `cajas_muro.json` y
  `cajas_sprite.json` al día (`t1013_cajas.mjs`). Los atlas que quedan sueltos de un horneado con `SOLO` (el prefijo cambia cada
  vez) y las variantes que ya no existen se borraron del manifiesto con sus archivos.
- **Medidas, segunda vuelta** (4 minas y 8 cuevas x 3 semillas, `_m_roca.mjs`, no se sube): en las minas 794 tramos, unos 50 entrantes y 188
  salientes, 796 taludes y unos 1100 peñascos de mina; celdas libres de las minas 40.257 a 40.440. En las cuevas unos 6.100
  macizos (antes 11.700 peñascos) y 2.700 taludes. t1000 (3 semillas, con `BANDERAS=__rocaVieja` el antes): arena exterior 56,
  cueva 40, obra 55 igual; **piso legible de la cueva 10 a 16** y objetos dibujados por pantalla 240 a 193; arena de las cuatro
  minas, media de las 12, 53,6 a 52,5 % (a4_minas2 con la semilla 4242 es la que más baja, 44,7 a 41); adornos por pantalla de la
  familia igual, pero en las minas (semilla 12345, a1_mina1, a1_mina2, a4_minas1, a4_minas2) 69, 48, 66 y 48 a 54, 49, 52 y 54:
  lo que se apoya contra la roca encuentra menos tramos rectos.
- Pruebas (segunda vuelta, con el servidor fresco): tsc, t1000 (todo en su piso), t1014 (96 iguales), t1015 (0 tapados), t1033 en
  las 12 zonas (flotando 0, montados 93 a 91, repetidos 9 a 10), t1011 `todas 2` con `SEMILLA` 5000, 6000 y 7000 (0 atascados las
  tres, objetiva 0), t855 (0 distintas en 192), t370 (288, 0 malas), conectividad 20 (1920), t995 (0 atascados; `pegados`, el que
  al final queda a menos de 0,25 de un muro, dio 1 y 3 en dos corridas, antes 0), t440, t450, t500, t961 y t1001.
  Fotos: `DIR=/tmp/requiem-pruebas/e10 t1021_vistas.cjs antes|ahora <zonas>` (el antes con
  `BANDERAS=__topeOscuro=0.45,__rocaVieja`) y `COLS=2 DIR=/tmp/requiem-pruebas/e10 python3 juego/herramientas/t1021_lamina.py
  antes ahora` (`/tmp/requiem-pruebas/e10/lamina_antes_<zona>.png`, el antes a la izquierda); los recortes de cerca en
  `/tmp/requiem-pruebas/e10/cerca_*.png` y `zoom_pie_*.png`.
- `MAPA_V` sigue en 4: las baldosas no cambian, solo qué celdas de adentro de las de la mina son roca (como en la entrega 8), y la
  partida guarda la niebla por baldosa.
- **Tercera vuelta** (el coordinador: "cierra todo lo flojo, de verdad"). Lo de la segunda que quedó a medias, resuelto en el juego:
  - **Macizos de roca, no almohadas** (`macizo` en `roca_viva.ts`): estratos de losas facetadas (`poli`) con su retiro, unos que
    vuelan sobre el de abajo y dejan sombra, juntas oscuras y húmedas entre estrato y estrato (`rv_junta`), grietas cavadas hondas,
    lascas sueltas en las repisas y bloques caídos al pie. El musgo solo en lo que mira arriba (45 % de las repisas). En el relleno
    de las bolsas va lo mismo (no queda bosque de picos) y lo que tiene piso detrás en diagonal (la roca delante de una sala, que
    la tapaba) va siempre bajo (`trasPiso` en `rocaCueva`, `__frenteAlto` lo de antes).
  - **Hielo azul oscuro con copete** (`rv_hielo` más hondo, `rv_nieve` y `rv_caramb`): la masa es roca de hielo azul oscura, la
    nieve es una losa encima solo de la losa de más arriba de cada estrato (antes en todas: se leía como papel o vidrio roto) y no
    pasa del gris claro (no encandila más que el piso); los carámbanos son claros, finos y largos (1 a 3 por voladizo; antes
    bolitas oscuras con palito). El brillo frío va en los cantos (brillo 0,5).
  - **Talud que se ve**: piedra clara (`rv_piedra_clara`) arriba del montón, contra la roca, y una sombra (`rv_junta`) bajo cada
    piedra grande; polvo y grava más claros.
  - **La mina con roca, no tablones** (`rv_mina` y `rocaCortada`): el material deja las rayas de estrato y las marcas del pico en
    filas (se leían como vetas de madera) por manchas de dos escalas, granos de mineral y golpes del pico en racimos, en un pardo
    más gris; cada línea de estrato lleva su inclinación y ondula, los gruesos van de muy finos a muy gruesos, sin el tono par e
    impar. **Lo alto atrás, lo bajo adelante**: el tramo con piso detrás, aunque sea pasando un hueco de roca o en diagonal (el muro
    entre dos salas, que desde la de atrás se ve de frente y tapaba media sala) es bajo (`b1`..`b6` y `q1`..`q4` con entalle, a
    0,42 del alto; `detras` en `rocaMina`, `__tramosAltos` lo de antes), unos 15 de cada 100 tramos. Los demás bajan a 0,86 y los
    salientes a 44 a 74 de alto.
  - **Arena y adornos de las minas** (`_m_minas_props.mjs`, no se sube; t1000 con 3 semillas): el entrante y el entalle se deciden
    en `lineaMina` pero se cavan al final (`CAVAR`, en `rocaMina`): todo lo de en medio sale igual que sin ellos y el azar de lo de
    después no se corre. Las celdas que se le quitan a la roca (el bolsillo) quedan ocupadas pero pisables (bloq 3, `BOLSILLOS`,
    `__bolsilloLibre`): es el pie de la roca con su talud. Lo suelto que cayó de la roca (cascajo, huesos, herramientas,
    `__rocaSinSuelto`) va en cada entrante y entalle (9 de 10), al pie de la mitad de los tramos y de cada saliente, sin bloquear,
    sin pisar la caja de dibujo de nada (más de 30 %, lo de la pared incluido) y sin la misma pieza a menos de 4 celdas. Al final
    de la roca viva, en minas y cuevas, lo suelto repetido (misma pieza y cara a menos de 3 celdas) sale (`__repetidosRoca`).
    Arena de las minas, media de las 12 (3 semillas): antes de la entrega 10 53,5 %, ahora 54,7; con 48 semillas 54,3 a 54,7.
    Adornos por pantalla 56 a 57,6 (3 semillas). t1033 en las 12 zonas, antes de la entrega 10 y ahora: montados 93 a 92,
    repetidos 9 a 8, flotando 0.
  - **Entalles** (`lineaMina`, la pieza `n`/`q`): el medio del tramo (tres celdas) se mete una celda en la roca aunque las puntas
    sigan, así sale también en las líneas cortas (`__sinEntalles`). 382 entalles en las 4 minas x 3 semillas (24 a 40 por mina);
    los entrantes, que ahora se cancelan si al final tienen algo detrás, quedan en 35.
  - **El frente de la galería** (`rocaMina`, `__frenteCortado`): los bordes de adelante del piso (hacia la cámara, +x y +y), que
    quedaban cortados a regla contra lo negro, llevan roca baja de la mina (`roca_penasco m_b*`) cada 2,2 a 3,3 celdas afuera del
    piso: no tapa la pelea ni cierra paso.
  - **Pegados a 0** (`apartarDeMuros` en `juego/mundo.ts`, `__esquinaVieja`): se aparta también de las esquinas que salen (la celda
    de al lado libre y la de la diagonal no), y se aparta a todo monstruo vivo en cada cuadro después de moverlos a todos: el que
    está quieto, espera o pega no pasa por `avanzar` y lo empujaban los otros (un zombi de a2_tumbas1 a 0,12 del muro, uno de
    a1_mina1 a 0,09). t995 ahora dice dónde quedó cada pegado.
  - **t1015 en 0**: el saliente no se pinta en franjas y su punta de adelante tapaba el cofre pegado delante de la de atrás: si
    algo ocupa esas celdas, el saliente se va (`tapaEspolon`, `__espolonTapa`), y lo suelto no cae ahí.
  - **El espejo suelto**: el `mis_espejo` que el misterio riega en toda mazmorra quedaba metido entre los peñascos de antes de la
    cueva y la mina; con los macizos aclarados se veía parado en medio del piso como una puerta negra. Se queda solo con roca a dos
    celdas (`__espejoSuelto`).
- Pruebas (tercera vuelta, servidor fresco): tsc, t1000 (todo en su piso; arena cueva 40 y obra 55 igual, piso legible de la cueva
  10 a 18), t1014 (96 iguales), t1015 (0 tapados), t1033 en las 12 zonas (flotando 0, montados 92, repetidos 8), t1011 `todas 2`
  con `SEMILLA` 5000, 6000 y 7000 (0 atascados, objetiva 0), t855 (0 de 192), t370 (288, 0 malas), conectividad 20 (1920), t995
  dos tandas (0 atascados, 0 pegados), t440, t450, t500, t961 y t1001. Fotos `t1021` en las 7 zonas (antes con `__rocaVieja`) y los recortes de
  cerca de cueva, hielo y mina en `/tmp/requiem-pruebas/e10/cerca5_*.png`. Lab: `lab_r3b.png` (tramos bajos y hielo).

## Cada zona con lo suyo: el acto 2 (22 nov 2026)

Rick: "Bajé por unas escaleras y por el portal y el mundo se parece mucho." Confirmado con fotos (`t1040`): las cinco tumbas del
acto 2 (Pozo de los Nombres, Nombres Borrados, Templo del Sol Caído, Galería de los Dormidos, Cámara del Rey sin Sombra) tenían el
mismo tema `tumba` (arenisca, `tum_muro` o la sillería de la Forja, la misma luz y el mismo riego) y los tres mundos abiertos el
mismo `desierto` (arena, arenisca, el mismo bazar de viñeta). Eran la misma mazmorra con otro nombre.

- **El mecanismo** (`juego/src/mundo/acto2_zonas.ts`, `VARIANTE_ZONA`; `tematicaDe(def)` en `zona.ts`): lo propio de cada zona va
  encima de su tema sin tocar el tema (las tablas por tema siguen igual para las demás zonas). Campos: `piso`, `parches`,
  `camino`, `oscuridad`, `borde`, `disperso`, `grande`, `luces`, `deco`, `extra`, `vinetas`, `muroX`/`muroY` (con muro propio no
  va la sillería genérica de la Forja), `estilo` (escombro, relleno y aderezo), `pared` (`PARED_TEMA`), `castigo` (el relato de
  los campamentos comunes), `foco` y `brasero` (el asiento del jefe), `sala` (ancho, alto, galerías largas, área por sala y sala
  mayor), `hileras` (lo grande de las salas va en filas a lo largo de la galería), `pisoExt` (el piso por baldosa afuera),
  `silueta` (ensenadas y macizos), y para el dibujo `tinta` (el color de la oscuridad, `dibujarLuz` en escena.ts), `haz` (color y
  densidad de los haces del techo, `null` sin haces) y `motas`. **`__acto<N>Viejo`** apaga lo de ese acto (`varianteDe`). Los
  dados de antes se tiran igual donde se pudo, pero las zonas del acto cambian (pisos, trazado, silueta, viñetas): **`MAPA_V`
  pasó a 5** (se pierde solo la niebla).
- **Pisos nuevos** (`src/engine/gotico/catalogo/acto2_pisos.ts`, en el catálogo para no mover `__PINTOR__`; se empujan a `PISOS`
  y van en `PISO_DOBLE` de motor/assets.ts): arena de duna con rizos del viento, barro seco en placas con costra de sal, losas
  de calle con arena en las juntas, piedra negra del pozo con charcos, agua negra, losas doradas con el sol de bronce embutido,
  basalto pulido con filete de oro y pórfido, losas largas de fosa con el polvo de las vendas y el suelo de la cueva con la
  arena que entra y quitina. Lab sin servidor: `npx tsx juego/herramientas/_m_pisos_lab.mts <ids>` (no se sube).
- **Piezas nuevas** (`catalogo/acto2.ts`, tema `acto2`: ningún riego viejo las toma): los muros de cada tumba
  (`a2_muro_pozo` con los nombres de los que bajaron, sogas, el reguero y los nombres raspados; `a2_muro_sol` con el gran disco,
  los rayos, la procesión y el friso de oro y lapislázuli; `a2_muro_dormidos` con tres hileras de nichos y sus dormidos, vendas y
  nichos sellados; `a2_muro_rey` de basalto con el rey de oro y el hueco claro donde debería ir su sombra, los reyes de antes con
  la suya y paneles de oro con el nombre raspado), con su fila en `ESQUINAS_MURO`; la boca del pozo con su cabria, sogas y cubos,
  la charca negra, la piedra de los nombres; la columna del sol, el altar que mira hacia abajo, el sol caído; el lecho del
  dormido, las vendas; la estatua del rey, su tesoro; el nido de escarabajos, la nidada que alumbra verde, las mudas, la arena que
  cae del techo; y afuera la columnata, la casa caída y la fuente seca de las Ruinas y la barca varada del Oasis. Lab:
  `t1020_pieza_lab.mts a2_muro_pozo,...` (`/tmp/requiem-pruebas/acto2/lab`).
- **Cada zona**: las **Dunas** sin viñetas ni ruinas, casi sin ensenadas (se ve lejos), dunas altas, caravanas; el **Oasis Muerto**
  con el lecho seco en el medio (barro en placas y su orilla de tierra), palmeras muertas, la barca varada, el oasis seco; las
  **Ruinas** con calles enlosadas en cuadrícula y plazas, casas caídas, columnatas, fuentes, esfinges; el **Pozo** negro azulado
  con la luz fría de arriba y piedras de nombres en filas; los **Nombres Borrados** casi todo agua negra, nombres raspados, sin
  haces; el **Templo del Sol** de oro, con la sala mayor grande, columnas con disco, haces de oro y motas de oro; la **Galería de
  los Dormidos** en galerías largas con los lechos en hilera a los dos lados del paso; la **Cámara del Rey** de basalto y pórfido,
  salas grandes, la avenida de estatuas, sin un solo haz, oscuridad morada; la **Cueva de los Escarabajos** verde parda con nidos,
  huevos que alumbran y arena que cae. Cada una con su castigo de campamento y su asiento del jefe.
- **Segunda vuelta (revisión del coordinador)**: el lecho del Oasis Muerto se leía como un damero oscuro que tapaba todo: ahora
  es solo el medio (`a2_barro_seco` en placas de dos tamaños que se mezclan, tonos de barro pardo a casi arena, el canto claro
  donde se levanta la costra, grietas pardas y no negras) con su orilla (`a2_barro_orilla`: arena con costras sueltas) y la
  arena domina afuera. La Galería de los Dormidos: sin el escombro del frente, las piedras sueltas ni el aderezo de los muros
  (`limpio`), los huecos entre galerías son la arena que entró (`relleno`: dunas en vez de pilas de sillares), los lechos en
  hilera en todas las salas (también la mayor), y su color: caliza tostada, vendas de lino, resina ámbar en los cuencos y en
  las vendas, el friso pintado de ocre y turquesa con el ojo que vela, el surco de ocre en las tapas, oscuridad y haces ámbar.
  En el desierto el santuario de runas moradas (`com_santuario_obelisco`) se leía como una pieza de otro mundo parada en la
  arena: las zonas del acto 2 dan solo el altar de cuernos y el monolito pálido (`santuarios`, el efecto es el de siempre).
- Ojo: un servidor de desarrollo que se levantó antes de crear un archivo nuevo en `catalogo/` no lo ve (el `import.meta.glob`
  se resuelve al cargar): la zona sale sin esas piezas (sin muros). Reiniciar el servidor después de agregar archivos al catálogo.
- Fotos: `node juego/herramientas/t1040_acto2_fotos.cjs <etiqueta> [zonas]` (mismos puntos relativos del mapa: entrada, tres
  fijos, jefe, hito; `BANDERAS=__acto2Viejo` el antes) y `python3 juego/herramientas/t1040_lamina.py antes ahora`
  (`/tmp/requiem-pruebas/acto2/lamina_<zona>.png` y `lamina_tumbas_{p1,p2,entrada}.png`: las seis de bajo tierra lado a lado).
- Pruebas: tsc, t1000 (todo en su piso), t1014 (96 iguales), t1015 (0 tapados), t1033 en las 9 zonas (antes y ahora: flotando 23 a
  14, repetidos 43 a 34, montados 143 a 83), t855 (0 de 192), t370 (288, 0 malas), conectividad 20 (1920), t1011 `todas 2`
  (`SEMILLA=5000`, 0 atascados, objetiva 0), t995 (0), t440, t450, t500, t1001 y t961.

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
    - **Sexta pasada** (Rick, 21 nov 2026: "acomodá lo flojo, quiero perfección"). `__blancoQuinta` vuelve a lo de la
      quinta en todo lo de abajo; `__sinNumeros` saca los números de daño (para medir el blanco sin contarlos).
      - **Puño del dios dormido** (monje): la onda triple ya no son tres columnas de `trueno` horneadas apiladas sobre el
        blanco (más la del `explota`): las áreas llevan `hab` y `ondaRayo` (poderes_vivos.ts) dibuja cada una como un aro
        azul hondo en el piso con rayitos pegados al suelo (`hondo`, alma celeste, `sinLuz`). Los cinco rayos de la
        definitiva caen en corro (`corro`: a 2,2 a 4 casillas, con la x de pantalla lejos del héroe y del blanco, ramas solo
        en lo alto, resplandor y luz a media fuerza sin destello). Lo que reparte la onda (`area` en `golpesPoder`, lo pone
        `golpeArea` en `actualizarAreas`) no revienta como el puño. El reventón va con la paleta `rayo_hondo`, el filo del
        puño celeste, la carga de rayo horneada al 45 % y su luz sin destello, los anillos de la definitiva de azul hondo.
      - **El rayo sobre los cuerpos** (electro.ts): el cuerpo del arco y el alma tapan (no se suman), azul eléctrico con
        alma celeste (la luz de luces.ts pasa después y la aclara: con alma blanca de noche quedaba blanca); el titileo y la luz del cuerpo sacudido más bajos y más azules. Baja también el Puño de rayo.
      - **Coro de los sellos y Ascenso del espíritu**: la columna (`pilar_luz`) y el castigo horneados que nacen en el
        héroe no se dibujan (`sinHorneado`; su luz sí queda, de oro): la columna es el haz del centro, más ancho y de oro
        hondo, detrás del cuerpo; los siete haces de alrededor no caen en la columna de pantalla del héroe; los anillos, los
        fogonazos (`hondo`: sin el centro blanco de `luzSpr`) y las brasas son de oro viejo.
      - Medida (t975 + t996_blanco.py, `BANDERAS=__sinNumeros`, peor cuadro héroe / blanco; antes con `__blancoQuinta`):
        Coro de día 23,8 / 5,8 a 3,8 / 3,4, de noche 30,0 / 4,5 a 5,9 / 4,7. Puño de dios (`CERCA=1`) de día 48,5 / 65,3 a
        3,2 a 5,1 / 3,2 a 3,7, de noche 82,5 / 90,8 a 7,9 a 9,1 / 8,7 a 12,6 (dos corridas; la media de 2,6 a 4 %). Ascenso de día 5,6 / 3,6 a 1,6 / 1,5, de noche 9,1 / 10,5 a 1,7 / 6,0.
        Puño de rayo de noche 9,0 / 18,8 a 4,8 / 9,3. Ojo: el sitio y el azar cambian entre corridas (unos ±3 puntos).
      - **Sonidos** (audio/sonido.ts, síntesis): `forma_lobo` (huesos que se rompen y se acomodan, `huesosCambian`, y el
        aullido, `aullido`: casi tono puro con armónicos que sube, tiembla y cae), `forma_oso` (huesos más graves y el
        gruñido que sube a rugido, `grunidoOso`), `forma_hombre` (huesos espaciados, algo húmedo y el aliento) y `festin`
        (sorbo borboteante y latido húmedo a los 0,3 y 0,52 s, con el chorro y el latido del dibujo). Las formas suenan en
        `actualizarHeroe` cuando cambia `h.escala` (cuando se ve el cambio); la forma ya no suena el rugido de jefe al
        empezar a lanzar. `_renderEfecto(id, seg, true)` devuelve las muestras (para el espectrograma).
      - **Sonidos de las formas y del Festín, séptima pasada** (rama `pulido2`, Rick: "resuelve lo flojo"; los de la sexta eran
        tonos casi puros con un LFO parejo y sonaban a sintetizador). Todo síntesis propia en `audio/sonido.ts`, sin archivos:
        - **Aullido** (`aullido`, `vozLobo`): una onda propia con los armónicos de unos pliegues (`ondaDe`, `createPeriodicWave`,
          el 2.º y el 3.º fuertes), la boca que va de u a o y vuelve a u (`bocaQueCambia`, tres formantes que se deslizan),
          un poco de la fuente sin filtro para que los armónicos se lean claros, vibrato de unos 5 Hz que entra a los 0,5 s y
          se corre (otro LFO de 3,3 Hz y `temblor`: ruido marrón muy filtrado, nada parejo), el aliento (rosa en la banda de la
          boca y el filo del aire, más fuerte al entrar y al morir), la reverberación del bosque (`bosque`: corta, oscura,
          40 reflejos tempranos de los troncos, la respuesta se arma una vez por contexto) y otro lobo que contesta lejos,
          más grave y apagado. Curva: 290 Hz, quiebre a 470 en 0,22 s, sube a 565, baja, vuelve y cae a 330 en 2,2 s.
        - **Oso** (`grunidoOso`): el resoplido de antes, sierra de unos 82 a 118 Hz con sus subarmónicos (la mitad y el tercio),
          aspereza (la amplitud tiembla a unos 31 Hz que se corren, 19,5 Hz y un temblor de 40 Hz), saturación, la garganta
          grande (formantes de 230, 520, 980 y 1900 Hz que se abren al rugir), el aire por la misma garganta, el resuello al
          final y dos golpes de pecho.
        - **Huesos** (`huesosCambian`): ráfagas de 2 a 5 chasquidos de ruido en banda corta (2 a 9 ms, a 4 a 18 ms uno del otro,
          con huecos de 25 a 110 ms), el filo de 1 ms, el cuerpo del hueso (un tono que cae en 20 a 40 ms) y dos o tres que
          revientan más fuerte y más grave (la articulación); el tendón con temblor irregular, algo húmedo y el golpe del pecho.
        - **Festín**: cuatro tirones de sorbo (rosa por una banda que sube de 380 a 1100 Hz y se angosta), lo líquido grave con
          los mismos tirones, 18 burbujas (`burbuja`: un tono que sube 1,5 a 2,1 veces mientras se apaga, la resonancia de la
          burbuja que se cierra), el trago (la garganta que cierra) y el latido lub-dub a los 0,3 y 0,52 s (con el dibujo).
        - **De vuelta a hombre**: los huesos, lo húmedo, el jadeo que entra (ruido por la boca de a a e) y el gemido grave.
        - Prueba sin oído: `node juego/herramientas/t1120_sonidos.cjs [ids] <etiqueta>` (`_renderEfecto(id, seg, true, true)`:
          con la cadena del juego, la reverberación y el compresor y el limitador del maestro; `MODULO=` otra copia del módulo,
          `SECO=1`, `VECES=`) deja los WAV en `/tmp/requiem-pruebas/sonidos` y `python3 juego/herramientas/t1120_espectro.py
          <etiqueta>` los espectrogramas (0 a 6 kHz) y, en el aullido, la fundamental encima con sus medidas. Ahora: la
          fundamental va de 353 a 556 Hz, el vibrato a 4,9 Hz y 31 cents con 23 % de ciclo a ciclo (irregular), los armónicos
          23 dB sobre el ruido de entre medio (el de antes 478 a 604 Hz, casi sin vibrato que se mida, 2 ciclos). Volumen, la
          ventana de 100 ms más fuerte con la cadena del juego: lobo -14,2 dB, oso -13,5, Festín -13,7, de vuelta a hombre
          -17,2, contra el rugido del jefe -14,8, el grito de guerra -15,8 y invocar -11 (antes -16, -15,7, -12,7 y -21,3).
          `REVERB_EXTRA` del lobo baja de 0,45 a 0,15 (lleva su bosque).
      - **Formas y equipo**: el equipo no se pinta sobre la bestia (el druida se vuelve el animal, como en Diablo 2), pero el
        arma viva sigue: el tajo de la mordida y del zarpazo toma el color de su elemento (`VIVO_FORMA` en tajos.ts,
        `__formaSinVivo`) y el estallido del arma viva ya revienta en el blanco.
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
  - Opciones: con la fila del HUD y la de las barras de vida son 15 filas y el alto de la fila baja lo que haga falta para que la losa entre.
    `t954_hud_opcion.cjs [pc|movil]` elige Clásico, recarga y vuelve a Forjado (`__hudVisto` dice cuál se dibujó).
  - Prueba: `node juego/herramientas/t950_hud.cjs <etiqueta> [vistas]` (pc, pc1080, ultra, ipad, movil, pctactil;
    `HUD=0` saca la barra de siempre). Los recortes de cerca: `t953_hud_detalle.cjs <etiqueta> [pc,pc1080,ipad]` y
    `python3 juego/herramientas/t953_lamina.py <etiqueta>` (`/tmp/requiem-pruebas/hud/detalle/lamina_detalle.png`): vida baja con latido, un poder en recarga, el destello de listo, clics de verdad
    (cinturón, tecla 2, bolsa, personaje, poder derecho, el mundo encima del panel), toques de 44 pt sin cruces y el costo
    de la interfaz. `python3 juego/herramientas/t950_lamina.py antes <etiqueta>` arma `lamina_hud.png` en
    `/tmp/requiem-pruebas/hud`. Sin servidor: `npx tsx juego/herramientas/t951_esculturas.mts [ampliación]` (las esculturas
    y el marco entero a 1280 x 720, 960 x 540 y 1707 x 540). `HUD=0` también saca la barra de siempre en
    `comun_pruebas.cjs`, `t650_zoom` y `t651_zoom_pick`.
  - **Filas del cinturón** (sexta pasada, `pilaCinturon` y `FILAS_CINTO` en `juego/heroe.ts`): cuántas pociones apila cada
    columna según el cinto, como en Diablo 2. Los cintos no traen el dato: va por la base (faja de tela 2, cinturón de cuero
    y tahalí 3, de malla, cinto del verdugo y ceñidor de placas 4, otra base 3) y sin cinto 2 (en Diablo 2 es 1: el héroe de
    salida no lleva cinto). Lo que ya está en el cinturón no se toca: si hay más que las filas se ven todas las cuentas
    (`filasColumna`) y solo no entra más. **Rick lo descartó el 21 nov 2026 ("es Diablo 2 amigo, 4 pociones"): toda columna apila 4,
    con o sin cinto.** La regla por cinto queda apagada detrás de `__cinturonPorCinto` (también el renglón del tooltip).
  - **Sexta pasada**: las grietas de vida baja se tallan (`grietasHondas`: surco oscuro con labio de luz) antes de sangrar luz y
    no se apagan entre latidos; la ceniza del jefe sube hasta 4 con cresta clara y brasas, más copos y algunos de 2 x 2.
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

## Barras de vida y arrastre del inventario (21 nov 2026)

- **Barras de vida de los enemigos** (`render/barras_vida.ts`, Rick: "ponle barra de salud a los enemigos"). `escena.ts`
  anota cada monstruo o invocado vivo al pintarlo (`anotarBarra`, a la altura de la cabeza del cuadro `quieto`, así no salta
  con el ataque) y `dibujarBarras` las pinta después de la luz, antes de los números y de las frases (que van encima). A
  puntos enteros del aparato (`P` = escala del mundo redondeada): canto oscuro, sangre con luz arriba y sombra abajo, la punta
  encendida, el tramo recién quitado en pálido que baja a los 0,4 s, latido bajo 25 %, marcas en los cuartos en las largas.
  Placa: común sin placa, campeón azul, único oro, jefe de zona oro con gema de brasa y remaches. Invocados y Thor verde,
  solo heridos. Los jefes de acto y el que tiene el dintel (`j.jefe`) no llevan. Ancho por clase y `sqrt(escala)`, entre 16 y
  44. Modo En pelea (por omisión): golpeado en los últimos 4 s del reloj del juego, o herido, persiguiendo y con el héroe en
  pelea (`tCombate` a 5 s); se apaga en 0,5 s. Solo en baldosa explorada. Opciones, Barras de vida (Siempre, En pelea, Nunca):
  campo opcional `opciones.barras` en `marca.opciones` (sin el campo, En pelea). Nada se guarda en la partida: el estado de cada
  barra vive en un WeakMap. `__sinBarras` la apaga, `__barrasVida.modo` (0, 1, 2), `__barrasVistas` lo dibujado en el cuadro y
  `__barrasCosto` lo que cuesta. Prueba: `t1101_barras.cjs <etiqueta> [pc|pc1080|movil]` (pelea con cada clase de barra,
  recortes, se apaga sola, modos, niebla con `__rv = 0`, 60 enemigos en Siempre), capturas en `/tmp/requiem-pruebas/barras`.
  Costo en la nube con 60 barras: 0,19 a 0,27 ms por cuadro (720, 1080 y teléfono).
- **Lo que va en la mano cuelga de su casilla de arriba a la izquierda** (`dibujarCursor` y `rejillaObjetos` en
  `ui/juego_ui.ts`, Rick: "el mouse queda como en la mitad del objeto y no es fácil moverlo al baúl"). Antes se dibujaba desde
  el cursor pero caía según el centro del objeto: el resaltado y el dibujo no coincidían. Ahora la casilla bajo el cursor es la
  de arriba a la izquierda (bolsa, baúl, tienda), y sobre una rejilla el objeto se pega a las casillas donde va a caer (con su
  sombra): lo que se ve es lo que pasa. Se dibuja a la escala del panel (`escPanel`, `origenPanel`): en pantallas bajas el
  panel se achica y antes la mano seguía a 29. El equipo sigue mirando la casilla bajo el cursor. **Táctil** (`toqueMano` en
  `main.ts`): con algo en la mano el toque suelta al levantar el dedo, no al apoyarlo; si el dedo se mueve más de 8 puntos o se
  sostiene 0,3 s, el objeto sube arriba del dedo (`alzadoMano`: entero a la vista, la casilla de arriba a (alto − 0,5) casillas
  + 30) y la rejilla, el equipo y el cinturón miran ese punto (`ui.alzado`, se corre `E.y` mientras se dibujan paneles y HUD).
  Un toque corto sin mover suelta donde se tocó; lo que mide si fue corto es el tiempo de los eventos (`E.toqueT`, `E.sueltaT`),
  no el de los cuadros: con un cuadro lento el toque parecía sostenido. En t1100 el toque corto va dentro de la página (por CDP
  el levantar espera a que se atienda el apoyar y con un cuadro lento duraba más de 0,3 s de verdad). `__arrastreViejo` vuelve a lo de antes. Ganchos: `__rejillas`,
  `__casillasEquipo`, `__manoDestino`, `__manoDibujo`. Prueba: `t1100_arrastre.cjs [pc|movil] <etiqueta>` (1x1 a 2x4 de la
  bolsa al baúl, del baúl a la bolsa y al equipo; en táctil arrastre con toques de verdad por CDP y el toque corto) y
  `python3 juego/herramientas/t1100_lamina.py <etiqueta>` (`/tmp/requiem-pruebas/arrastre/lamina_<etiqueta>.png`).

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

## La vigilia (elegir héroe guardado, 21 nov 2026)

Rick: "quiero que hagas estas animaciones mejores, más pro, más sprites, más todo". Antes el héroe grande era el sprite
del mundo agrandado a puntos gruesos (o un retrato liso de 4 cuadros), la espada en llamas un bloque amarillo y las cartas
mostraban al héroe de salida aunque llevara capucha, escudo y espada.

- Vive en `ui/vigilia.ts` (el dibujo) y `motor/vigilia.ts` (los cuadros); `dibujarSeleccion` en `ui/menus.ts` los llama.
  `__vigiliaVieja = true` vuelve a lo de antes, `__tSel` fija el reloj de la pantalla (las pruebas).
- **El grande**: la acción `seleccion` del motor (48 cuadros a 12 por segundo: 0 a 11 el gesto de la clase, 12 a 47 el
  reposo que respira, pasa el peso y mece la tela) con el equipo de verdad (`equipoVisual`, `firmaVisual`), pintada por los
  obreros (`pintor.worker.ts`, opción `vigilia`) a K veces su alto (hasta 2,6) con la luz de la fogata de la presentación de
  las clases, el grano a la escala y los rasgos grandes (`detalle: 2`), una muestra por punto. Se dibuja en un lienzo propio
  a la resolución del héroe y se pega a d puntos enteros del aparato (720: K 2,6 y d 1; 1080: K 2 y d 2; teléfono d 2).
  La luz vive en `motor/luz_retrato.ts` (`hornear/luz_retrato.mts` la reexporta): fuera del motor, no mueve `__PINTOR__`.
- El gesto sale al elegirlo y cada 10 s (`cuadroVigilia`). Al elegirlo aparece desde la penumbra (la silueta se va con la
  luz en 0,9 s) y la fogata se aviva. Con arma viva la hoja se pinta sin el encanto del motor (era el bloque amarillo) y
  `arma_viva.ts` pone el elemento a la escala de la figura con su propia bolsa (`pozoArma`).
- La fogata (las piedras horneadas y el fuego de Doom) va delante a la izquierda de su cara, como en la presentación: con
  la luz avanzada `spriteConLuz` reilumina el relieve del cuadro (ahora acepta `q.rel` y `q.alt` del cuadro; las texturas
  se sueltan por peso, 48 MB); en la clásica se suma el calor horneado del lado del fuego (`calorDe`) con el latido. La
  sombra es la silueta del cuadro echada lejos del fuego. Brasas que suben de la fogata y ceniza que cae, la mitad por
  detrás y la mitad por delante, y la lluvia salpica en la cabeza y los hombros (`techo` de cada columna).
- **El orden de pintado** (`ordenGrande`): el cuadro con que arranca el reposo, el reposo de a 9 y de a 4 (quien dibuja usa
  el pintado más cercano al que toca: el bucle se afina mientras llegan), el gesto y lo que falta. Antes que nada el primer
  cuadro de la carta elegida (sale en un segundo y se ve agrandado en la penumbra mientras llega el grande). Mientras el
  grande se pinta, el pintor del mundo espera (`vigiliaOcupada` en main.ts: los dos a la vez se peleaban los núcleos), y en
  la portada se va pintando el héroe que saldrá primero (`precalentarVigilia`). Todo queda en IndexedDB `marca_vigilia`
  (los últimos 5 grandes y 16 cartas, `vigilia.claves.*`), con `__PINTOR__` en la clave: la segunda vez sale entero.
- **Las cartas**: el reposo del mundo (`quieto`, 8 cuadros, opción `muneco`) con su equipo a la escala de la carta; la
  elegida respira, se mueve y lleva una brasa que corre por el canto (`brasaCanto`); la del ratón se enciende; «Nuevo
  héroe» con su forja (`forjaNueva`). Hasta que se pinta, la silueta del de salida a oscuras (nunca el equipo que no lleva).
- Prueba: `node juego/herramientas/t1100_vigilia.cjs <etiqueta> [pc,pc1080,ipad,movil] [héroes]` (cuatro héroes vestidos;
  `VIDEO=1` 9 s a 25 por segundo, `LUZ=1` la luz avanzada a la fuerza, `ANTES=1` sin los ganchos nuevos) y
  `python3 juego/herramientas/t1100_vigilia_lamina.py <etiqueta> [vista] [antes]` o `video <etiqueta> [vista]` (láminas, antes y
  después y el mp4 en `/tmp/requiem-pruebas/vigilia`). Sin servidor: `npx tsx juego/herramientas/t1101_vigilia_lab.mts
  <clase> [acc:desde-hasta/paso] [K]` pinta tiras con la luz de la vigilia y el tiempo por cuadro.
- Costo (en la nube, 4 núcleos y el lienzo por software, 21 nov 2026): pintar el grande la primera vez, sin caché, 30 a 45
  s a 720 (el primer cuadro en 5 a 7 s; antes se ve el de la carta en la penumbra) y 40 a 65 en 1080, iPad y teléfono; un
  cuadro tarda 1,7 s en un núcleo solo a K 2,25 (t1101). La segunda vez sale de IndexedDB. Por cuadro, ya pintado
  (`__vigiliaPartes`): el héroe 3,5 a 4,8 ms de JS (3,2 son el arma viva; con `__sinDerrame` 0,2), pegarlo 0,6 a 7 (este
  último con el lienzo por software), la fogata 0,4 a 0,6, la ceniza y las brasas 0,3 a 0,5. El cuadro entero de la
  pantalla pasa de unos 33 a unos 50 ms en la nube con el arma viva (sin ella queda igual que antes).

## Pulido de la interfaz (21 nov 2026, rama `pulido-ui`)

Rick: "Acomodá lo flojo, quiero perfección". Lo flojo de las barras, la letra gótica y la vigilia.

- **Barras de vida** (`render/barras_vida.ts`): un mínimo legible en puntos CSS de la pantalla (`MIN_W` y `MIN_H` por clase:
  común 34 x 4 de canal, campeón 40 x 5, único 46 x 5, jefe de zona 54 x 5, invocados 28 x 3), pasado a puntos del aparato con
  lo que mide el lienzo en la página; en Lejos medían 20 a 30 de ancho y 5 o 6 de alto. Las marcas de los cuartos solo en
  los élites. Dos enemigos pegados ya no las enciman: se apilan hacia arriba (la del de adelante, más abajo en pantalla, queda
  en su sitio y la de atrás sube lo justo), con el corrimiento suavizado por barra (`off` en su estado, 14 por segundo: nunca
  un salto) y un margen más ancho para soltar la pila que para armarla (no tiembla en el borde). `__barrasEncimadas` y
  `__barrasChicas` vuelven a lo de antes. Ojo: el corrimiento empieza con `tOff` vacío (con `undefined` daba NaN y no se
  dibujaba ninguna).
- **La letra gótica** (`ui/letra_gotica.ts`, rehecha): la grande (11 puntos) con espolones (la púa arriba a la izquierda de
  cada fuste), pies en cuña que patean a la derecha, la A con punta de arco, la M y la N con su cuña, y la C, la O, la G, la Q
  y la S facetadas con el nudillo hacia adentro a media altura. Y una menuda de 7 puntos (cabeza de cada fuste en diagonal)
  para lo chico. `LIGA` escribe Æ, Œ, Ø, Ð, Þ, Ł y ẞ con las nuestras; las tildes sin glifo caen a su base (à, ö, â y la ç
  con su cedilla) y lo demás (un nombre en otro alfabeto) al glifo de reserva, un rombo tallado con su cruz. Tonos: hierro,
  brasa, oro, hueso, ceniza, sangre o un color (la clase). `ui/texto_gotico.ts` (`textoGotico`, `medirGotico`) elige talla y
  puntos del aparato por punto que dan la versal más cerca de la del tamaño pedido, achica si no entra en `max` (un punto
  menos, la menuda, y al final corta) y pega a puntos enteros. Va en el detalle de Continuar (dos renglones: el nombre, y la
  clase, el nivel y el acto), en Opciones (título, rótulos, llaves, porcentajes y Volver), en la vigilia (título, ficha,
  Jugar, Borrar, Volver, los nombres y el nivel de las cartas, todas en la misma talla, y «Nuevo héroe») y en `grabado`.
  `boton(..., { gotico: true, tono })` en `ui/comun.ts` la usa; en táctil esos botones miden al menos 44 puntos por lado
  para el dedo (crecen parejo alrededor de la placa) y cada objetivo de toque se anota en `__toquesMenu` (puntos CSS).
  `__letraVieja` vuelve a Cinzel en todo.
- **Opciones en el teléfono**: táctil y bajo va en rejilla de tres columnas por cinco filas, el rótulo encima y cada mando de
  44 puntos o más (en una columna de 15 filas cada fila medía 18), con Volver arriba a la izquierda. `__opcionesViejas`.
- **La ficha de la vigilia**: el nombre en oro grande con su resplandor, la clase en su color y la dificultad y el ciclo en
  sangre, el nivel en su nicho con la cifra grande, el resto en dos filas a una misma talla (la más grande en que entran las
  cinco cifras) con su rótulo menudo en ceniza, Jugar en oro y Borrar en ceniza (sangre cuando pide confirmar). En la carta los
  pies quedan más arriba (casi tocaban el nombre).
- **La vigilia más rápida** (`motor/vigilia.ts`): primero el **boceto** (el cuadro 12 a la mitad de K, un cuarto de los puntos,
  `kBoceto`), que se ve a puntos dobles con su calor y su entrada mientras llega el de verdad; después los 18 pares del reposo
  (el bucle entero respira a 6 por segundo con el pintado más cercano), los impares (12 por segundo) y al final el gesto.
  `__sinBoceto` y `__ordenViejo` (el orden de antes, sin boceto) para medir contra lo mismo; `__vigiliaPedidos()` y
  `__vigilia()` dan `msBoceto`, `ms1`, `msPares`, `msReposo`, `msGesto` y `msTodo`. t1100 acepta `BANDERAS=`.
  Medidas (pc 720, K 2,6, en la nube con la máquina cargada por otras sesiones, carga de 6 a 23 en 4 núcleos: el mismo
  héroe tardó de 38 a 106 s según la corrida): un héroe sin precalentar daba su primer cuadro en 2,5 a 9,6 s y el bucle a 12
  por segundo recién con los 48 (55 a 100 s); ahora el boceto en 0,8 a 2,4 s (0,8 a 1,4 en 1080 y el teléfono), el primer
  cuadro de verdad en 2,6 a 11, el bucle a 6 por segundo en 12 a 43 s (19 cuadros de 49) y el reposo entero en 17 a 81. En
  el lab, un cuadro a K 2,6 cuesta 1,45 s ya caliente y el boceto 0,55 (sin cargar, con 3 obreros: boceto ~1 s, bucle ~10 s,
  todo ~25 s). El total no baja (son los mismos 48 cuadros): baja lo que se espera para ver algo.
- **Lo demás de la vigilia** (`ui/vigilia.ts`): el orbe azul junto a la cadera de la arcanista era el **portal azul del
  campamento** del fondo (no estaba horneado: el motor lo pinta limpio); detrás de la vigilia y Opciones ya no se pinta
  (`sinPortal` en `fondoVigilia`, `__portalFondo` lo vuelve a poner), y un velo de noche detrás del héroe lo despega del fondo
  (`__sinVelo`). La luz avanzada quemaba lo claro cerca del fuego (el cuello de piel): `quema` en `LuzSprite` (luz_gpu.ts, 0 por
  omisión: lo demás igual) calienta menos lo claro y dobla el techo antes; la vigilia va con 1 (`__quemaVieja`). La fogata va
  con la grilla fina (`fuegoSueltoFino` y `dibujarVivosPixel` en fuego_vivo.ts, `specFuego` con la celda forzada: unos 2,5
  puntos del aparato por celda, sin suavizar; a 1080 eran de 7, `__fogataGruesa`). Las chispas del gesto son un estallido
  (fogonazo, aro de pixel que se rompe, 46 chispas de toda la hoja con su estela y brasas que suben, a la escala de K;
  `__chispasViejas`). La llama del arma en el gesto quedaba medio paso atrás: `armaRapida` en fuego_especial.ts enfría la llama
  vieja y da un paso más, y en el gesto no va el barrido del cuadro anterior (`__llamaLenta`).
- Pruebas: `t1102_menus_gotico.cjs <etiqueta> [pc,pc1080,movil]` (portada con Continuar, Opciones con una llave encendida y la
  vigilia con un nombre de otro alfabeto y uno largo; en el teléfono falla si un toque mide menos de 44 pt) y
  `python3 juego/herramientas/t1102_lamina.py <antes> <ahora>` (`/tmp/requiem-pruebas/gotico/lamina_<vista>.png` y `_cerca`).
  Ojo al medir la vigilia en la nube: con otras sesiones corriendo pruebas la carga pasa de 15 en 4 núcleos y el mismo héroe
  tarda de 38 a 100 s; comparar siempre de a pares alternados (`BANDERAS=__ordenViejo`) y contar cuadros.
- **La vigilia, segunda pasada** (rama `pulido2`, Rick: "resuelve lo flojo"; el total seguía en los 48 cuadros pintados).
  Del reposo se pintan solo las **claves**, una cada 3 cuadros (12 de 36, regadas por el bucle), y los 24 de entre medio se
  **arman** de sus dos claves (`motor/intermedio.ts`, en el obrero: mensaje `entre` de `pintor.worker.ts`, unos 0,2 a 1 s cada
  uno contra 1,5 a 5 de pintar). Para cada punto busca el corrimiento (hasta 8 puntos entre claves) que mejor casa las dos
  claves en un parche de 3 x 3 (color, alfa, alto), lo suaviza con una mediana y toma el punto **entero** de una de las dos
  con un dado fijo (con la clave de después con probabilidad S, la altura entre las dos): nada de promedio, que lavaba el
  grano y salía blando (se veía en la lámina). El relieve y el alto salen con el mismo corrimiento, la hoja del arma exacta
  del esqueleto de ese cuadro. Si las claves no casan (`falla` > 0,04) ese cuadro se pinta. **El gesto se pinta entero**:
  se mueve mucho y entre dos claves que se parecen puede pasar otra cosa (el lab lo mostró en el hachazo del berserker).
  Lab (`_m_falla_lab.mts`, `_m_falla3.mts`, no se suben): berserker a K 2,6, el armado contra el pintado 8 a 12 de
  diferencia media, lo mismo que hay entre dos pintados seguidos (es el grano que cambia de cuadro a cuadro); arcanista 3 a
  5; falla del reposo 0,004 a 0,017. Lado a lado (t1100 `VIDEO=1`, pintado, de a 2 y de a 3, el mismo héroe con el mismo uid)
  no se distingue. `__sinIntermedios` pinta los 48, `__pasoEntre = 2` una clave cada dos, `__vigiliaPedidos()` da `entre` y
  `nEntre`. Los obreros de la vigilia suben de 3 a 5 como mucho (núcleos menos uno: en 4 núcleos siguen 3). t1100 ahora fija
  el uid de cada pieza (el traje sale del uid: dos corridas visten igual), acepta `BANDERAS=__pasoEntre=2` y `PEDIDOS=1`.
  Medidas (pc 720, en la nube con otras sesiones corriendo pruebas, carga de 5 a 12 en 4 núcleos; cada cuadro tardaba 3,5 a
  5 s en el obrero contra 1,45 en el lab), bucle entero / todo: antes (`__sinIntermedios`) 36 a 55 s / 44 a 67 s; ahora 18
  a 29 s / 22 a 45 s (el berserker es el lento: su gesto, con el hacha arriba, cuesta más). pc1080 19 a 24 / 26 a 32, teléfono
  19 a 21 / 26 a 29. **No llega a 15 y 25 s con esa carga**; sin carga (lab: 1,45 s el cuadro, 3 obreros) la cuenta da unos
  7 s el bucle y unos 13 s todo. Lo que queda es el gesto (12 cuadros pintados, la mitad del trabajo).

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
- **El título arde en pixel** (Rick, 21 nov 2026: "más dramático, con fuego en las letras, pixelado, más Diablo 2").
  `ui/titulo_fuego.ts` corre dos fuegos de Doom en una grilla de celdas de 2 o 3 puntos enteros del aparato (unas 240
  de ancho en PC, 260 en el teléfono: el grano de las letras; con celdas de 5 puntos a 1080 no pegaba) y
  `ui/fuego_pixel.ts` los pinta en bandas (`BANDAS_LLAMA`, `BANDAS_METAL`, `BANDAS_HUMO`) con trama Bayer 4 x 4 y los
  pega sin suavizar (`pegarPixel`). El calor pasa antes dos veces por un 1-2-1 (sin eso el autómata sale como sal regada)
  y lo de menos de 0,22 no se pinta (si no, una neblina a cuadros). El de atrás nace del canto de arriba de cada letra
  (la fila de abajo a 0,72 para no tapar el DE) y es el fuego grande. Dentro de la letra NO va fuego en bloques (Rick
  lo vería como un tablero encima del hierro): solo el hierro al rojo, liso y sin trama (`calentar`: lo que toca la
  llama, el calor que vive en lo bajo de cada trazo, `bajo`, y respira en vetas que suben, las rachas y la forja de la
  entrada; el canto oscuro del título no se enciende) y lenguas finas de una celda (el fuego de adelante, con la letra
  como forma, nace solo en columnas sueltas del canto de abajo y en algunas grietas, pintado sin trama y solo lo
  caliente). Cada 5 s una **racha** aviva el fuego y una ola de calor cruza el título (`racha`): el bucle no se apaga.
  Las brasas son cuadros de una celda que se enfrían de banda en banda (`dibujarChispas`). El resplandor sigue blando
  (es luz, no fuego). No toca `fuego_doom.ts` (`__PINTOR__`).
- **La entrada es un golpe de forja** (segundos desde que aparece el título, `GOLPE_T` y `ENCIENDE_T`): las letras se
  calientan mientras aparecen, a los 0,7 s el martillazo (`golpeTitulo`: las letras al blanco sumando el título sobre sí
  mismo, fogonazo, un temblor de 7 puntos que se va en 0,13 s, `golpe_metal` y 130 chispas que saltan de los cantos, 60 en
  táctil: rápidas, de 0,3 a 0,8 s, con estela de hasta 6 celdas y de blanco a rojo) y a los 1,45 s el fuego se enciende del centro a los lados en 0,7 s con una bocanada (`avivar`, `fuego_lanzar`).
  El temblor va por `acc.temblor` y los fogonazos por `acc.destellos`. La escena se agranda apenas mientras tiembla.
- **Canto de brasa en los botones** (`ui/brasa_menu.ts`, `brasaRenglon`): el renglón encendido lleva un fuego de Doom chico
  que nace del canto de abajo de cada letra y lo lame por detrás, y el borde de las letras en brasa de pixel, más vivo
  abajo y donde lo toca la llama. Celdas de 2 puntos del aparato. Una grilla por renglón, solo se mueve mientras está encendido.
- **Sexta pasada de poderes (21 nov 2026)**: las llamas de RÉQUIEM quedaban cortas. Más aire sobre el título (0,42 del alto),
  llama de `altura` 0,5, el título a 6 % del alto en PC (antes 3,5) y el techo a 4,5 %; las filas de arriba de la grilla
  también enfrían (en el teléfono chocaban con la fila de arriba y salía un borde recto). `__tituloCorto` vuelve a lo de
  antes. El golpe suena a su hora con el audio ya desbloqueado (t683: golpe a 0,74 s para 0,7, encendido a 1,51) y, sin gesto,
  apenas se desbloquea (los dos dentro de 0,2 s del clic).
- **Tercera pasada (21 nov 2026)**: las llamas mueren antes del borde de arriba de la pantalla (`filaK`: cada fila del fuego
  se enfría según dónde cae, en el 6 % de arriba) y el título baja un 3,5 % en PC: nunca un corte recto, en ninguna vista.
  En las bandas oscuras no va la trama (`tramaDesde`, 2,6 en PC y 3,6 en táctil: el tablero en el hueco de la Q). El metal
  al rojo es de brasa a naranja con su verde (el rojo solo dejaba rosado el hierro gris). La grilla se mide con `RES`, no
  con la transformación del cuadro: el temblor del golpe la cambiaba y se rearmaba (0,7 s trabado en el golpe y en el
  encendido), y los fuegos nacen sin precalentar. Las hojas del título se piden con `decode()`. La bocanada del encendido
  aviva 2,8 veces, suelta brasas desde el frente que corre y tiñe la pantalla. **Sonido**: el golpe y el encendido
  quedan pendientes hasta que el audio se desbloquea (`pendiente`, `sonar`; `Sonido.mudo()`): el golpe vale hasta 2 s
  después del encendido y el encendido suena 0,4 s detrás del golpe si llegan juntos. `__sonidosPortada` anota lo que
  sonó. Prueba: `t683_portada_video.cjs <etiqueta> [pc|pc1080|movil]` (video real con el grabador de Playwright a mp4 de
  25 por segundo y cuadros sueltos, la API de audio interceptada, sin gesto y ya desbloqueado).
- **La letra gótica del menú** (Rick, 21 nov 2026: "los que no quedan seleccionados están como con una letra no acorde.
  Quiero una letra pixelada que haga honor al horror y a Diablo 2"). `ui/letra_gotica.ts`: versales talladas propias de 11
  puntos de alto (fustes de dos, perfiles de uno, remates en cuña, patas que se abren), las tildes, la ü, la ñ, cifras y
  signos (las minúsculas van a versal). `rasterGotico` (sin DOM) da la tinta por punto; `lienzoGotico(texto, tono)` la
  pinta en relieve con su canto oscuro alrededor y la sombra que cae: 'hierro' apagado y frío sin elegir, 'brasa' el oro del
  renglón encendido. Cada punto de la letra mide `puntoGotico(tam, RES)` puntos del aparato (2 a 720, 3 a 1080) y se pega
  con `pegarPixel`. El canto de brasa del renglón usa la misma grilla de la letra (`brasaRenglon(..., gotico)`). Solo en
  los renglones de la portada (`menuPrincipal`); desde el pulido de la interfaz (abajo) también el detalle de Continuar,
  Opciones y la vigilia. `__letraVieja` vuelve a la letra de antes con el canto de brasa. `HEROE=1` en t681 guarda un héroe
  para que salga Continuar, y la lámina `t681_lamina.py menu <antes> <ahora> <vistas>` arma el menú al doble con un
  renglón encendido y los demás en hierro.
- Banderas: `__tituloViejo` (el fuego liso de antes y sin golpe), `__menuViejo` (el dorado de antes). `__portadaReloj`
  fija el tiempo de la escena y `__portadaMed` suma lo que cuesta por cuadro (fondo y título, ms de JS).
- Pruebas: `t681_portada_fuego.cjs <etiqueta> [pc,pc1080,ultra,ipad,movil,vertical] [es,en]` (ocho momentos, el botón encendido y el costo;
  `BANDERAS=__tituloViejo,__menuViejo` el antes), `t682_portada_golpe.cjs <etiqueta> [vista] [idioma]` (el golpe cuadro a
  cuadro con el reloj fijo, `DESDE`, `HASTA`) y `python3 juego/herramientas/t681_lamina.py <antes> <ahora>` o `golpe
  <etiqueta> <vista_idioma>` (láminas y letras al doble en `/tmp/requiem-pruebas/portada2/laminas`).
  Costo en la nube (21 nov 2026, el título con su fuego y sus hojas, sin el fondo, ms de JS por cuadro): con celdas de
  2 o 3 puntos queda como el de antes: 720 de 15 a 16, 1080 de 28 a 28 a 32 (ruidoso), teléfono de 10 a 9. Con las celdas
  gruesas de la primera pasada era 12, 20 y 7. Las vetas del hierro van separables (senos por fila y por columna).

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
  ideas sin texto final del informe (epígrafe en la presentación del jefe, bestiario con historia, página del niño de la
  nieve) siguen pendientes. El fantasma de Vesperio está hecho (abajo).
- **El fantasma de Vesperio** (Rick, 21 nov 2026: "historia épica con sus fantasmas bien"): muere en la Fragua y en los actos 6
  y 7 espera delante del hito de cuatro mundos (`v_costa`, `v_barrio` en a6_barrio2, `v_cielo`, `v_jardin`, en `FANTASMAS` con
  `junto: 'hito'` y `trasHeraldo`; reemplaza el `f_jardin` de una línea). No se arrepiente: tiene celos (le preparó la casa al
  dios y el dios ahora le habla directo al héroe). Paga «la brasa es una pregunta» de Lys («¿quién va a tener sed cuando yo me
  apague?»: el dios quiere un heredero) y le manda un recado a Auren (el juicio de las cenizas ya contó lo de la canción). Dice
  de 3 a 4 líneas en violeta, una tras otra, y si te alejas más de 13 casillas espera a que vuelvas; sube ceniza pálida de él.
  Los demás fantasmas esperan ahora en el desvío del mundo abierto si lo hay. Lo escuchado entero queda en `fantasmas` (campo
  nuevo y opcional) y en el Códice con todo lo que dijo. Con los cuatro de Vesperio su línea entra al epílogo (`ECO_VESPERIO`
  en decisiones.ts, otra si bebiste la Brasa; `ecosFinal` en historia.ts, hasta dos de los encargos además). `__fantasmasViejos`
  vuelve a lo de antes. Prueba: `t961_fantasmas.cjs [pc|movil]` (no sale sin Vesperio muerto, cada uno junto a su hito, espera
  si te vas, termina, queda anotado y entra al epílogo; `__finalT(s)` pone el epílogo en un segundo, `__ecosFinal()`).
- Prueba: `node juego/herramientas/t960_historia.cjs [pc|movil]` (clic de verdad en los restos de las Catacumbas, voz de la
  Marca en el Camposanto, Ívola en la Cripta, capturas en `/tmp/requiem-pruebas/historia`).

## El Libro de Odrán (21 nov 2026)

Rick: "El libro de Odrán, que se vaya llenando y pueda explorarlo como libro mientras se va desarrollando la historia, buenas
animaciones de libro, gore, sangre, misterio". Reemplaza la pestaña de notas del Códice (que era una lista plana por fuente):
la historia ordenada por **hilos**, no por dónde se leyó.

- **Dónde vive**: `mundo/libro_hilos.ts` (los 12 hilos y sus piezas: cada pieza apunta a un texto que el jugador ya lee, con su
  fuente y lo que la desbloquea), `mundo/libro_cierres.ts` (**todo lo escrito nuevo, para que Rick lo revise**: nombre y línea de
  apertura de cada hilo, los 12 cierres de Odrán, los hilos rojos, las notas al margen de Vesperio, las pistas de lo que falta),
  `juego/libro.ts` (qué tiene el héroe, huecos, cierres, novedades), `juego/libro_oido.ts` (lo que se anota al oírse),
  `ui/libro.ts` (el libro: armado de hojas, animaciones, entrada) y `ui/libro_pixel.ts` (papel, mano de Odrán, capitulares,
  dibujos, sangre, huecos, cuero, guardas). Sonidos `libro_abrir`, `libro_cerrar`, `libro_pagina`, `libro_pluma`, `libro_latido`,
  `libro_arde` en `audio/sonido.ts` (síntesis).
- **Hilos**: el pozo, la Marca, Vesperio, Tomás, los cinco sellos, Ama y su hija, la sangre tibia, las siete voces (Auren),
  Ysmeral, los siete que subieron, Aun-Saar y la pregunta (el fantasma de Vesperio). Lo que dice alguien (relatos y saludos)
  se anota al oírlo y además se da por sabido cuando ya pasó el acto en que se decía y se cumplió lo que pedía la línea
  (`derivaNpc`: misión hecha, elección, heraldo, final): Odrán lo oyó en el campamento. Quedan como `extra` (se escriben si se
  oyen, no cuentan ni dejan hueco) solo tres que dependen del camino o caen en el acto 7, que no se termina nunca: lo que dice
  Oyá si le diste la bitácora y dos relatos de Auren arriba. Una pieza con varias fuentes vale con
  cualquiera (las variantes según lo elegido). Un hilo sin ninguna pieza sale como "un hilo que todavía no tiene nombre".
- **Qué se tiene**: casi todo se deriva del guardado (misiones, `diarios`, `paginas`, `restos`, `fantasmas`, `heraldo`,
  `actosHechos`, `elecciones`, `finalElegido`, `jefesVistos`, `viajes`): una partida vieja abre el libro con lo que ya encontró.
  Lo que no se puede derivar (lo que cuenta alguien, un rincón apartado, frases que no tienen misión) se anota desde ahora:
  `msg` y los diálogos (`saludoDe`, `relatoDe`) pasan por `oirLibro`, que reconoce el texto por identidad del arreglo. Campo
  nuevo y opcional `libro` en el héroe: `o` oídos, `v` piezas ya escritas (quedan aunque la historia vuelva a empezar), `el`
  la opción de cada elección escrita, `c` cierres, `m` notas al margen, `q` hojas quemadas. Nada más del guardado cambia.
- **Nada del futuro**: lo de un acto que no se alcanzó (`actoAlcanzado`) no sale ni como hueco; al final del hilo, hojas en
  blanco ("lo demás todavía no pasó"). Las pistas nombran la tierra del acto, el lugar solo si ya se pisó y a quien preguntar
  por su oficio (`EPITETO`), nunca por su nombre. t1200 lo revisa con nombres prohibidos por altura.
- **El libro**: doble hoja (una en vertical) en pixel a puntos enteros del aparato (`calcGeo`: D = 2 a 720, 3 a 1080; en
  táctil al menos 2 y la letra nunca bajo 9,5 puntos CSS). La tapa de cuero con gofrado, título dorado gastado, sello de los
  cinco pedazos, cantoneras de hierro, broche y sangre; las guardas jaspeadas con el ex libris de Odrán; la cinta roja que lleva
  al índice. Al abrir: aparece cerrado, se corre y la tapa gira. Pasar hoja: la hoja se curva columna a columna (lo de afuera gira
  primero, `hojaQueGira`), con su sombra, por rueda, flechas, clic en una mitad, arrastrar o deslizar (se suelta a medias y
  vuelve). Al pasar, cada columna de la hoja se ilumina según hacia dónde mira (luz de arriba a la izquierda), el lomo de la hoja va en
  sombra, la cresta de la curva prende un filo de luz, el canto libre muestra el grosor del papel y la hoja echa su sombra a
  bandas sobre la de abajo y un hueco de sombra junto al lomo. El índice salta pasando hojas de corrido, y al cerrar desde
  cualquier hoja las hojas vuelven de corrido hasta la primera y la tapa gira y cae (recién después se apaga). Lo nuevo, la primera vez que se ve, primero es un borrón que se disuelve
  (el hueco que se llena) y después se escribe solo con la pluma, tinta negra mojada que se seca a sepia (o al rojo de la
  rúbrica). Cada hilo abre con su capitular iluminada (campo de su color, filete de oro, la letra gótica al doble y un
  zarcillo), y lleva su portadilla. Huecos: mancha de tinta, hoja arrancada o sangre seca, con la pista a lápiz. Gotas, huellas
  de dedos con sangre y cera de vela en algunas hojas. El hilo al que le falta una sola pieza clave **late** (corazón de sangre
  lub-dub y venas desde el canto, con sonido). La carta de Vesperio que dice "quema esta carta" se quema sola la primera vez
  (brasa que corre, humo, la esquina se va). En los actos 6 y 7, con Vesperio muerto, aparecen notas de **otra mano** (la suya,
  violeta, inclinada al revés). El cierre de Odrán ("Lo que ahora entiendo") se escribe cuando el hilo junta sus claves, con su
  firma y sello de cera.
- **En el juego**: J lo abre y lo cierra (Esc también), K el Códice (jefes, decisiones, cine; la pestaña Libro del Códice abre el
  libro y en el índice hay un renglón que lleva al Códice). El mundo espera mientras está abierto. Cuando entra una pieza nueva
  jugando: "Odrán anota algo en su libro." y en PC una pluma junto al mapa (late, se toca y abre); en táctil un botón siempre,
  junto al del registro (44 pt). Cerrado solo cuesta `cuentaLibro` cada 1,2 s (sin armar textos: 0,8 ms en la nube con un
  héroe del acto 7). Abierto, las hojas quietas se pintan una vez y se guardan (24 a lo sumo); solo se repinta cada cuadro la que
  se escribe, late o arde, y el libro entero es un lienzo de unos 400 x 300 puntos que se pega a D.
- Banderas: `__sinMargen` (sin notas de otra mano), `__libroReloj` y `__libroT` (fijan los relojes, para las pruebas). Ganchos:
  `__libro`, `__libroAbrir`, `__libroCerrar`, `__libroIr`, `__libroPasar`, `__libroHojas`, `__libroHilos`, `__libroGeo`,
  `__libroRotas` (fuentes que no apuntan a nada), `__libroDatos`.
- Prueba: `CHROMIUM=... URL=http://127.0.0.1:5193/ node juego/herramientas/t1200_libro.cjs [pc|pc1080|movil|ipad] [acto1,acto3,acto7,vieja]`
  (capturas en `/tmp/requiem-pruebas/libro/<vista>`: apertura, índice, hueco que se llena, escribiéndose, hilo a medias, hoja a
  25, 50 y 78 % de la curva, cierre, nota de otra mano, carta que arde, hoja que late, aviso del HUD).
- El índice: cada hilo con su nombre corto, la cuenta a la derecha y el sello del hilo cerrado (o el corazón del que late) en el
  margen, nunca encima de un número; el hilo sin nombre va con la tinta corrida y un «?»; la nota al pie lleva al Códice. La
  sangre y las manchas no tapan texto que haga falta leer. `__libroFuera()` lista lo que se sale de la hoja (t1200 pide 0) y
  t1200 mide en táctil la X, el botón del índice y las filas (44 pt o más).
- Pasaron (21 nov 2026, segunda vuelta, con origin/main mezclado): t1200 en pc, pc1080, movil e ipad, tsc, t500, t1001, t960,
  t961, t950 pc y movil (17 toques, ninguno chico) y t440.
- Flojo: los textos nuevos (cierres, notas, pistas, nombres) esperan la lectura de Rick. En el teléfono la hoja es angosta (unas
  22 letras por renglón): entra todo, pero se lee apretado, y el índice pasa a una segunda hoja con muchos hilos (cada fila
  mide 44 pt). En una sola hoja (vertical) la tapa no gira al cerrar: el libro se apaga. Nada se oyó con oídos humanos.

## Arreglos del 22 nov 2026

- **El portal no cruza de acto** (`irAZona` en `main.ts`): Rick venció al jefe del acto 1, subió por su portal, la cinemática lo
  pasó al Oasis y al volver a entrar al portal (que seguía en el pueblo del acto 2) apareció otra vez en la guarida del acto 1, sin
  saber cómo volver. Ahora el portal al pueblo es de su acto: al entrar al pueblo de otro acto se cierra (como en Diablo 2). Y al
  entrar a un pueblo de un acto anterior al más alto alcanzado, el registro recuerda que la piedra de viaje lleva al acto que sigue
  (pestaña del acto en la piedra). Probado en el juego: portal abierto en a1_guarida, en a1_refugio sigue, en a2_oasis no está.
- **El nigromante con guadaña en la vigilia** (`nigromante` en `seleccion.ts`): con un arma de dos manos la izquierda quedaba colgando
  detrás del cuerpo y no se veía ese brazo. Ahora agarra el mango (`agarreI`, `pegaI`) y lo suelta solo para el gesto de invocar.
  Toca `src/engine/gotico/`: cambia `__PINTOR__` y los héroes con equipo se repintan solos una vez.

- **Atajos de poderes** (Rick no sabía cómo asignarlos): antes, clic en una casilla de atajo llena ponía ese poder en el botón
  derecho y la única forma de cambiarla era abrir la elección del botón derecho, pasar el ratón por un poder y apretar F1 a F10,
  pero F1 llenaba la casilla que dice 5 (las casillas dicen 5 a 9, 0 y F7 a F10) y en la elección las plaquitas decían F1, F2...
  Ahora: **clic derecho en cualquier casilla de atajo** (o clic en una vacía) abre la elección para esa casilla («Atajo 8») y el clic
  en un poder lo pone ahí; en la elección del botón derecho, la tecla que dice la casilla (5 a 9, 0, F7 a F10) pone el poder en esa
  casilla; jugando, esas mismas teclas cambian el poder del botón derecho (F1 a F6 ya no hacen nada: F5 recargaba la página). Las
  plaquitas de la elección dicen la tecla de verdad. Cada poder vive en una sola casilla (`ponerAtajo`). Nada del guardado cambia.

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
