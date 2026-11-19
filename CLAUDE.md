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
- El servidor de desarrollo se cae seguido: `sh juego/herramientas/servidor.sh &` lo vuelve a levantar solo.

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
  tres zombis pegados, en campo abierto, cuatro cuadros seguidos, y `python3 juego/herramientas/t760_lamina.py <clase>`
  arma la lámina en `/tmp/requiem-pruebas/pa`. No correr otras pruebas a la vez: se pisan.
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
  `t950_salidas_mapa.cjs <etiqueta> [zonas]` (camposanto, abadía 2, catacumbas y páramo: mapa grande y cada salida con el
  minimapa) y `python3 juego/herramientas/t950_lamina.py antes despues` (`/tmp/requiem-pruebas/mapa/lamina_mapa.png`).

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
