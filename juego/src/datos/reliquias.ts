// Reliquias: la tanda de únicos y legendarios que llena lo que faltaba. Antes no caía ningún legendario antes del nivel 6
// y casi todos eran armas: acá hay uno de arranque para cada clase (se pueden llevar desde el nivel que dicen, caigan donde
// caigan), piezas legendarias de armadura, escudos, anillos y amuletos en todos los tramos, y un grupo de nivel alto.
// Todo original. Formato: [id, nombre, name, base, nivel, legendario, elemento vivo, stats, historia, lore].
import { BASES, UNICOS } from './objetos_datos';
import type { Elemento, RangoStat, Stat, Unico } from '../juego/tipos_objetos';

type Fila = [string, string, string, string, number, 0 | 1, Elemento | '', string, string, string];
const F: Fila[] = [
  // ---------------- nivel 1 a 5: la primera reliquia de cada clase
  ['diente_primer_invierno', 'Diente del Primer Invierno', 'Tooth of the First Winter', 'hacha_mano', 2, 1, 'frio', 'dano_pct:40-60,dano_frio:2-4,vida:10-15,vel_ataque:10', 'La forjó un niño del norte con el hielo de su propio aliento.', 'A northern child forged it with the ice of his own breath.'],
  ['juramento_novicio', 'Juramento del Novicio', 'Novice\'s Oath', 'espada_corta', 2, 1, 'luz', 'dano_pct:40-55,dano_luz:2-4,def:8-12,res_todo:5', 'Juró no soltarla. La encontraron todavía en su mano.', 'He swore never to let go. They found it still in his hand.'],
  ['chispa_aprendiz', 'Chispa de la Aprendiz', 'Apprentice\'s Spark', 'varita_tejo', 2, 1, 'rayo', 'dano_hechizos:20-30,dano_rayo:2-5,mana:15-20,vel_lanzar:10', 'Su primera tormenta cupo en un dedal. Nunca se apagó.', 'Her first storm fit in a thimble. It never went out.'],
  ['silbo_paramo', 'Silbo del Páramo', 'Moor Whistle', 'arco_corto', 3, 1, 'veneno', 'dano_pct:40-60,dano_veneno:3-5,des:4-6,vel_ataque:10', 'La cuerda silba antes de soltar. Las liebres ya lo saben.', 'The string whistles before it looses. The hares already know.'],
  ['falange_sepulturero', 'Falange del Sepulturero', 'Gravedigger\'s Fingerbone', 'varita_osario', 5, 1, 'sombra', 'mas_clase:1,dano_sombra:3-6,invocados_pct:10-15,mana:12-18', 'Señala hacia abajo. Siempre hacia abajo.', 'It points down. Always down.'],
  ['nudillos_ayuno', 'Nudillos del Ayuno', 'Knuckles of the Fast', 'garras_cuero', 3, 1, 'fuego', 'dano_pct:45-65,dano_fuego:2-4,vel_ataque:15,vida_por_muerte:2-3', 'Cuarenta días sin comer. El hambre se le quedó en los puños.', 'Forty days without food. The hunger stayed in his fists.'],
  ['rama_roble_hendido', 'Rama del Roble Hendido', 'Bough of the Split Oak', 'baculo_peregrino', 3, 1, 'veneno', 'dano_hechizos:18-28,dano_veneno:3-5,vida:12-18,regen_vida:1-2', 'El rayo partió el roble. La rama siguió dando hojas.', 'Lightning split the oak. The bough kept on leafing.'],
  ['ballesta_boticario', 'Ballesta del Boticario', 'Apothecary\'s Crossbow', 'ars_ballesta_1', 2, 1, 'fuego', 'dano_pct:40-55,dano_fuego:2-4,des:3-5,hallazgo:10-15', 'Tira frascos tan bien como virotes. El boticario no preguntaba.', 'It throws flasks as well as bolts. The apothecary never asked.'],
  ['mondadientes_tabernero', 'Mondadientes del Tabernero', 'Innkeeper\'s Toothpick', 'punal_taberna', 1, 1, 'sangre', 'dano_pct:35-50,dano_sangre:1-3,robo_vida:3-4,oro_extra:20-30', 'Cobraba las deudas sin levantar la voz.', 'He collected debts without raising his voice.'],
  ['lucero_alba_chica', 'Lucero del Alba Chica', 'Little Morningstar', 'ars_lucero_1', 4, 1, 'luz', 'dano_pct:45-65,dano_luz:3-5,aturdir:6-8,fue:3-5', 'Chico como un puño de monja, y pega igual.', 'Small as a nun\'s fist, and it hits the same.'],
  ['media_luna_guia', 'Media Luna del Guía', 'Guide\'s Half-Moon', 'sable_caravana', 5, 1, 'fuego', 'dano_pct:50-70,dano_fuego:3-6,vel_ataque:10,vel_mover:8-10', 'El guía se perdió una sola vez. El sable volvió solo.', 'The guide got lost only once. The saber came back alone.'],
  ['capucha_que_volvio', 'Capucha del Que Volvió', 'Hood of the One Who Returned', 'capucha_lana', 2, 1, '', 'def:6-9,vida:10-15,res_frio:10,radio_luz:1', 'Entró a la abadía a buscar a su hermano. Salió con esto puesto.', 'He went into the abbey for his brother. He came out wearing this.'],
  ['jubon_sobreviviente', 'Jubón del Sobreviviente', 'Survivor\'s Doublet', 'camisa_acolchada', 3, 1, '', 'def:10-14,vida:15-20,reduc_dano:3-4,regen_vida:1', 'Tiene siete remiendos. Cada uno es una historia que no cuenta.', 'It has seven patches. Each one is a story he won\'t tell.'],
  ['manos_enterrador', 'Manos del Enterrador', 'Gravedigger\'s Hands', 'guantes_cuero', 4, 1, '', 'def:4-6,vel_ataque:10,fue:3-5,vida_por_muerte:2', 'Cavaron mil fosas. Ya no saben estar quietas.', 'They dug a thousand graves. They no longer know how to be still.'],
  ['botas_mensajero', 'Botas del Mensajero', 'Messenger\'s Boots', 'botas_cuero', 3, 1, '', 'def:4-6,vel_mover:15-20,des:3-5', 'La carta nunca llegó. Las botas sí.', 'The letter never arrived. The boots did.'],
  ['faja_abuela', 'Faja de la Abuela', 'Grandmother\'s Sash', 'faja_tela', 2, 1, '', 'def:2-4,vida:12-18,res_todo:4-6', 'Bordada a la luz de una vela, punto por punto, contra todo mal.', 'Embroidered by candlelight, stitch by stitch, against all evil.'],
  ['tapa_caldero', 'Tapa del Caldero', 'Cauldron Lid', 'rodela', 2, 1, '', 'def:6-10,bloqueo:8-10,res_fuego:10,vida:8-12', 'La cocinera paró con esto la primera flecha del asedio. Y la segunda.', 'The cook stopped the first arrow of the siege with this. And the second.'],
  ['anillo_hojalata_bendita', 'Anillo de Hojalata Bendita', 'Ring of Blessed Tin', 'anillo', 1, 1, '', 'todos_atributos:2-3,hallazgo:10-15,mana:8-12', 'No vale un cobre. El cura lo bendijo igual.', 'Not worth a copper. The priest blessed it anyway.'],
  ['diente_leche_thor', 'Diente de Leche de Thor', 'Thor\'s Milk Tooth', 'amuleto', 3, 1, '', 'vida:15-20,vel_mover:8-10,valor:15-20,oro_extra:15-25', 'El cachorro lo perdió mordiendo una bota. Trae suerte.', 'The pup lost it chewing on a boot. It brings luck.'],
  ['arito_cobre', 'Arito de Cobre', 'Copper Hoop', 'anillo', 5, 0, '', 'mana:10-15,regen_mana:10', 'De una gitana que leía el porvenir. No vio venir el suyo.', 'From a fortune teller. She did not see her own coming.'],
  // ---------------- nivel 6 a 30: armas
  ['partetroncos', 'Partetroncos', 'Logsplitter', 'hacha_lenador', 8, 1, 'fuego', 'dano_pct:70-95,dano_fuego:5-9,golpe_aplastante:8-10,fue:5-8', 'El leñador juraba que el hacha entraba caliente en la madera.', 'The woodsman swore the axe went into the wood warm.'],
  ['aguijon_pantano', 'Aguijón del Pantano', 'Marsh Sting', 'lanza_cazador', 9, 1, 'veneno', 'dano_pct:70-90,dano_veneno:6-11,perforar:20-25,des:5-8', 'La punta nunca se seca.', 'The tip never dries.'],
  ['ultima_palabra', 'La Última Palabra', 'The Last Word', 'mandoble_verdugo', 11, 1, 'sangre', 'dano_pct:80-110,dano_sangre:6-10,herida_abierta:15-20,vida_por_muerte:4-6', 'El verdugo dejaba hablar al reo. Después hablaba ella.', 'The headsman let the condemned speak. Then she spoke.'],
  ['chicharra', 'Chicharra', 'Cicada', 'ballesta_ligera', 10, 1, 'fuego', 'dano_pct:75-100,dano_fuego:6-10,vel_ataque:15-20,critico:4-6', 'Canta al soltar. De noche no deja dormir a nadie.', 'It sings when it looses. At night it lets no one sleep.'],
  ['viento_velmora', 'Viento de Velmora', 'Wind of Velmora', 'arco_tejo_paramo', 12, 1, 'rayo', 'dano_pct:80-105,dano_rayo:7-13,vel_ataque:15,perforar:15-20', 'El tejo creció torcido por el viento del páramo. Tira derecho.', 'The yew grew bent by the moor wind. It shoots straight.'],
  ['media_cosecha', 'Media Cosecha', 'Half Harvest', 'guadana_siega', 13, 1, 'frio', 'dano_pct:85-110,dano_frio:7-12,ralentizar:15-20,mana_por_muerte:3-4', 'La helada llegó a mitad de la siega. Lo que quedó en pie, lo cortó ella.', 'The frost came mid-reaping. What was left standing, she cut.'],
  ['lapida', 'Lápida', 'Headstone', 'mazo_cantero', 16, 1, 'sombra', 'dano_pct:90-125,dano_sombra:8-14,aturdir:10-14,fue:8-12', 'El cantero grabó su propio nombre en la cabeza del mazo. Por si acaso.', 'The mason carved his own name on the maul\'s head. Just in case.'],
  // ---------------- nivel 6 a 30: armadura
  ['gorro_trampero', 'Gorro del Trampero', 'Trapper\'s Cap', 'gorro_cuero', 7, 0, '', 'def:8-12,des:5-8,hallazgo:15-20', 'Huele a zorro mojado. Los zorros no se le acercan.', 'It smells of wet fox. Foxes keep away.'],
  ['cornamenta_venado_blanco', 'Cornamenta del Venado Blanco', 'Antlers of the White Stag', 'craneo_ciervo', 10, 1, '', 'mas_clase:1,vida:20-30,invocados_pct:10-15,res_veneno:15-20', 'Nadie lo cazó. Se echó a morir a los pies del druida.', 'No one hunted it. It lay down to die at the druid\'s feet.'],
  ['yelmo_centinela_dormido', 'Yelmo del Centinela Dormido', 'Helm of the Sleeping Sentinel', 'casco_hierro', 12, 1, '', 'def_pct:40-60,vida:25-35,res_todo:8-10,valor:20-30', 'Se durmió en la guardia la noche del Ascua. El yelmo sigue despierto.', 'He slept on watch the night of the Ember. The helm is still awake.'],
  ['visera_verdugo_arrepentido', 'Visera del Verdugo Arrepentido', 'Visor of the Repentant Headsman', 'yelmo_cerrado', 18, 1, '', 'def_pct:60-80,fue:8-12,golpe_aplastante:8-10,res_sombra:15-20', 'Soldó la visera para no ver más caras.', 'He welded the visor shut to see no more faces.'],
  ['diadema_novia_ahogada', 'Diadema de la Novia Ahogada', 'Circlet of the Drowned Bride', 'diadema_plata', 25, 1, '', 'mas_habilidades:1,mana:30-45,res_frio:20-25,regen_mana:15-20', 'La sacaron del río con la diadema puesta. Todavía gotea.', 'They pulled her from the river with the circlet on. It still drips.'],
  ['habito_remendado', 'Hábito Remendado', 'Mended Habit', 'tunica_novicio', 6, 0, '', 'def:8-12,mana:15-20,regen_mana:10-15', 'Pasó por nueve novicios. Ninguno llegó a monje.', 'It passed through nine novices. None became a monk.'],
  ['piel_lobo_gris', 'Piel del Lobo Gris', 'Pelt of the Grey Wolf', 'jubon_cuero', 9, 1, '', 'def_pct:40-55,des:6-9,vel_mover:10,res_frio:15', 'El lobo siguió al cazador tres inviernos. Al cuarto cambiaron de lugar.', 'The wolf followed the hunter three winters. On the fourth they traded places.'],
  ['cota_mil_remiendos', 'Cota de los Mil Remiendos', 'Mail of a Thousand Mends', 'cota_anillas', 14, 1, '', 'def_pct:50-70,vida:30-40,reduc_dano:5-6,espinas:4-6', 'Ya no queda un solo anillo de la original. Es la misma cota.', 'Not one ring of the original remains. It is the same mail.'],
  ['coraza_herrero_ciego', 'Coraza del Herrero Ciego', 'Blind Smith\'s Cuirass', 'coraza_hierro', 20, 1, '', 'def_pct:70-90,fue:10-14,res_fuego:20-25,reduc_dano:6-8', 'La midió con las manos. Calza como una segunda piel.', 'He measured it with his hands. It fits like a second skin.'],
  ['habito_ultima_misa', 'Hábito de la Última Misa', 'Habit of the Last Mass', 'habito_ceremonial', 26, 1, '', 'def_pct:50-70,mas_habilidades:1,mana:35-50,res_sombra:20-25', 'El abad lo llevaba cuando cayó el Ascua. No se quemó ni un hilo.', 'The abbot wore it when the Ember fell. Not a thread burned.'],
  ['loriga_guardia_rota', 'Loriga de la Guardia Rota', 'Hauberk of the Broken Guard', 'loriga_guardia', 30, 1, '', 'def_pct:80-110,vida:45-60,res_todo:10-12,bloqueo:5-6', 'Eran cuarenta. Quedó una loriga.', 'They were forty. One hauberk remained.'],
  ['vendas_campeon_manco', 'Vendas del Campeón Manco', 'Wraps of the One-Handed Champion', 'vendas_pugil', 11, 1, '', 'def:8-12,vel_ataque:15-20,critico:4-6,fue:5-8', 'Ganó once peleas con una mano. La otra la guardaba para la doce.', 'He won eleven fights with one hand. He was saving the other for the twelfth.'],
  ['brazales_escriba_guerra', 'Brazales del Escriba de Guerra', 'War Scribe\'s Bracers', 'brazales_grabados', 24, 1, '', 'def_pct:40-60,dano_min:3-5,dano_max:6-10,precision:40-60', 'Llevan grabados los nombres de los caídos. Queda poco lugar.', 'They bear the names of the fallen. Little room is left.'],
  ['guanteletes_recaudador', 'Guanteletes del Recaudador', 'Tax Collector\'s Gauntlets', 'guanteletes_malla', 28, 0, '', 'def_pct:40-55,oro_extra:40-60,fue:6-9', 'Nunca devolvieron un vuelto.', 'They never gave back change.'],
  ['sandalias_camino_largo', 'Sandalias del Camino Largo', 'Sandals of the Long Road', 'sandalias_peregrino', 9, 1, '', 'def:6-9,vel_mover:20-25,regen_vida:2-3,valor:15-20', 'El peregrino murió a mitad de camino. Las sandalias quieren llegar.', 'The pilgrim died halfway. The sandals want to arrive.'],
  ['botas_jinete_sin_caballo', 'Botas del Jinete sin Caballo', 'Boots of the Horseless Rider', 'botas_montar', 25, 1, '', 'def_pct:40-60,vel_mover:25-30,des:8-12,res_rayo:15-20', 'Perdió el caballo en la batalla. Llegó primero igual.', 'He lost his horse in battle. He arrived first all the same.'],
  ['sabatones_vado', 'Sabatones del Vado', 'Sabatons of the Ford', 'sabatones_malla', 30, 0, '', 'def_pct:50-70,vida:25-35,res_frio:20-25', 'Cruzaron el río helado cuarenta veces. El óxido no les entra.', 'They crossed the frozen river forty times. Rust will not take them.'],
  ['cinto_contrabandista', 'Cinto del Contrabandista', 'Smuggler\'s Belt', 'cinturon_cuero', 10, 1, '', 'def:6-10,hallazgo:20-30,oro_extra:30-45,vida:15-22', 'Tiene más bolsillos por dentro que por fuera.', 'It has more pockets inside than out.'],
  ['tahali_cien_presas', 'Tahalí de las Cien Presas', 'Baldric of a Hundred Kills', 'tahali_cazador', 24, 1, '', 'def:12-18,des:8-12,vida_por_muerte:4-6,mana_por_muerte:2-3', 'Una muesca por presa. Hubo que coserle otra correa.', 'One notch per kill. They had to sew on a second strap.'],
  ['cinturon_sargento', 'Cinturón del Sargento', 'Sergeant\'s Belt', 'cinturon_malla', 28, 0, '', 'def_pct:40-60,fue:8-12,vida:25-35', 'La hebilla tiene la marca de más de una cabeza dura.', 'The buckle bears the mark of more than one thick skull.'],
  // ---------------- nivel 6 a 30: escudos y mano izquierda
  ['rueda_carretero', 'Rueda del Carretero', 'Carter\'s Wheel', 'escudo_redondo', 8, 1, '', 'def_pct:40-60,bloqueo:10-12,vida:18-25,espinas:3-5', 'Era la rueda de una carreta. La carreta ya no hacía falta.', 'It was a cart wheel. The cart was no longer needed.'],
  ['sonrisa_osario', 'Sonrisa del Osario', 'Ossuary Grin', 'escudo_calavera', 9, 1, '', 'def_pct:40-55,mas_clase:1,invocados_pct:12-18,res_sombra:15', 'Se ríe de un chiste que nadie más oyó.', 'It laughs at a joke no one else heard.'],
  ['cometa_cruzado_nino', 'Cometa del Cruzado Niño', 'Kite of the Child Crusader', 'escudo_cometa', 15, 1, '', 'def_pct:55-75,bloqueo:10-14,res_todo:8-10,valor:20-30', 'Le quedaba grande. Creció detrás de él.', 'It was too big for him. He grew up behind it.'],
  ['sol_bronce', 'Sol de Bronce', 'Bronze Sun', 'rodela_bronce', 23, 1, '', 'def_pct:60-80,bloqueo:12-15,res_fuego:20-25,radio_luz:2', 'Pulida hasta cegar. Los arqueros apuntaban a otro lado.', 'Polished until it blinds. The archers aimed elsewhere.'],
  ['puerta_capilla', 'Puerta de la Capilla', 'Chapel Door', 'escudo_templo', 28, 1, '', 'def_pct:70-95,bloqueo:12-16,vida:35-50,res_todo:10-12', 'Arrancaron la puerta para hacer el escudo. La capilla nunca cayó.', 'They tore off the door to make the shield. The chapel never fell.'],
  ['ojo_escarcha', 'Ojo de Escarcha', 'Frost Eye', 'orbe_cuarzo', 6, 1, 'frio', 'mas_clase:1,dano_frio:3-6,mana:20-28,vel_lanzar:10', 'Mira hacia adentro. Adentro siempre nieva.', 'It looks inward. Inside it is always snowing.'],
  ['corazon_aguacero', 'Corazón del Aguacero', 'Heart of the Downpour', 'orbe_tormenta', 27, 1, 'rayo', 'mas_clase:1,dano_rayo:12-22,mana:40-55,vel_lanzar:15', 'Late una vez por cada trueno que guardó.', 'It beats once for every thunderclap it kept.'],
  ['recetario_manchado', 'Recetario Manchado', 'Stained Recipe Book', 'cuaderno_formulas', 6, 1, 'veneno', 'mas_clase:1,dano_veneno:3-6,hallazgo:15-20,mana:15-22', 'Las manchas también son receta.', 'The stains are recipes too.'],
  ['tratado_nueve_humos', 'Tratado de los Nueve Humos', 'Treatise of the Nine Fumes', 'grimorio_destilacion', 27, 1, 'fuego', 'mas_clase:1,dano_fuego:12-20,vel_lanzar:15,mana:35-50', 'El décimo humo mató al autor antes de anotarlo.', 'The tenth fume killed the author before he wrote it down.'],
  // ---------------- nivel 6 a 30: anillos y amuletos
  ['sello_molinero', 'Sello del Molinero', 'Miller\'s Signet', 'anillo', 8, 1, '', 'fue:5-8,vida:15-22,oro_extra:20-30', 'Con esto sellaba los sacos. Y alguna mandíbula.', 'He sealed the sacks with it. And the odd jaw.'],
  ['anillo_viuda_alegre', 'Anillo de la Viuda Alegre', 'Ring of the Merry Widow', 'anillo', 14, 1, '', 'robo_vida:3-4,critico:3-5,des:6-9', 'Enterró a cinco maridos. A los cinco les sacó el anillo.', 'She buried five husbands. She took the ring off all five.'],
  ['nudo_tormenta', 'Nudo de Tormenta', 'Storm Knot', 'anillo', 22, 1, '', 'dano_rayo:6-12,vel_lanzar:10,mana:25-35,res_rayo:20', 'Un marinero ató el viento en tres nudos. Este es el tercero.', 'A sailor tied the wind in three knots. This is the third.'],
  ['alianza_rey_sin_sombra', 'Alianza del Rey sin Sombra', 'Band of the Shadowless King', 'anillo', 30, 1, '', 'mas_habilidades:1,todos_atributos:5-8,res_todo:8-10', 'El que la lleva tampoco hace sombra a mediodía.', 'Whoever wears it casts no shadow at noon either.'],
  ['relicario_nina_santa', 'Relicario de la Niña Santa', 'Reliquary of the Child Saint', 'amuleto', 7, 1, '', 'vida:20-28,res_todo:6-8,radio_luz:2,valor:20-30', 'Adentro hay un rizo y una oración a medio escribir.', 'Inside there is a curl and a half-written prayer.'],
  ['moneda_agujereada', 'Moneda Agujereada', 'Holed Coin', 'amuleto', 12, 0, '', 'hallazgo:25-35,oro_extra:40-60', 'La flecha iba al corazón. La moneda no estuvo de acuerdo.', 'The arrow was bound for the heart. The coin disagreed.'],
  ['colmillo_jefe_manada', 'Colmillo del Jefe de Manada', 'Fang of the Pack Leader', 'amuleto', 16, 1, '', 'fue:8-12,herida_abierta:10-15,vida_por_muerte:3-5', 'La manada sigue a quien lo lleva. De lejos.', 'The pack follows whoever wears it. From afar.'],
  ['lagrima_ysmeral', 'Lágrima de Ysmeral', 'Tear of Ysmeral', 'amuleto', 24, 1, '', 'mas_habilidades:1,mana:30-45,res_frio:20-25', 'La ciudad se hundió llorando. Esta gota quedó arriba.', 'The city sank weeping. This drop stayed above.'],
  // ---------------- nivel alto: lo increíble
  ['rostro_que_no_descansa', 'Rostro del Que No Descansa', 'Face of the Restless One', 'mascara_funeraria', 36, 1, '', 'def_pct:90-120,mas_habilidades:1,res_sombra:25-30,robo_mana:4-6', 'La máscara se la pusieron al muerto. Él no estuvo de acuerdo.', 'They put the mask on the dead man. He did not agree.'],
  ['corona_ascua_viva', 'Corona del Ascua Viva', 'Crown of the Living Ember', 'corona_ascua', 56, 1, 'fuego', 'def_pct:110-150,mas_habilidades:2,dano_fuego:20-35,res_fuego:30-40', 'Una brasa del Ascua engastada en oro. Sigue cayendo.', 'A coal of the Ember set in gold. It is still falling.'],
  ['coraza_doce_juramentos', 'Coraza de los Doce Juramentos', 'Cuirass of the Twelve Oaths', 'placas_templo', 38, 1, '', 'def_pct:120-160,vida:70-100,res_todo:15-18,reduc_dano:8-10', 'Doce caballeros juraron sobre ella. Los doce cumplieron.', 'Twelve knights swore upon it. All twelve kept their word.'],
  ['mortaja_ultimo_rey', 'Mortaja del Último Rey', 'Shroud of the Last King', 'armadura_ultimo_rey', 64, 1, '', 'def_pct:150-200,todos_atributos:12-18,vida:120-160,res_todo:20-25,mas_habilidades:1', 'Lo enterraron de pie y armado. Por si volvía a hacer falta.', 'They buried him standing and armored. In case he was needed again.'],
  ['muro_lamentos', 'Muro de Lamentos', 'Wall of Laments', 'paves', 36, 1, '', 'def_pct:110-150,bloqueo:15-20,vida:60-85,espinas:15-25', 'Cada golpe que para lo recuerda. Y lo devuelve.', 'It remembers every blow it stops. And gives it back.'],
  ['amanecer_santa_oria', 'Amanecer de Santa Oria', 'Dawn of Saint Oria', 'egida_alba', 52, 1, 'luz', 'def_pct:130-180,bloqueo:18-22,res_todo:18-22,dano_luz:15-25,radio_luz:3', 'La santa lo alzó contra la noche. La noche retrocedió un paso.', 'The saint raised it against the night. The night took one step back.'],
  ['punos_verdugo_mayor', 'Puños del Verdugo Mayor', 'Fists of the High Headsman', 'guanteletes_verdugo', 54, 1, '', 'def_pct:110-150,golpe_aplastante:15-20,fue:18-25,vel_ataque:15-20', 'Cuando se le rompió el hacha, siguió.', 'When his axe broke, he carried on.'],
  ['pasos_sobre_brasa', 'Pasos sobre Brasa', 'Steps upon Embers', 'sabatones_obsidiana', 55, 1, 'fuego', 'def_pct:110-150,vel_mover:30-35,res_fuego:30-40,vida:60-80', 'Cruzó la Herida caminando. Dejó huellas de vidrio.', 'He crossed the Wound on foot. He left footprints of glass.'],
  ['cenidor_coloso', 'Ceñidor del Coloso', 'Girdle of the Colossus', 'cenidor_placas', 54, 1, '', 'def_pct:100-140,fue:20-28,vida:80-110,reduc_dano:6-8', 'Le sobraba a un gigante. A ti te alcanza.', 'It was loose on a giant. It will do for you.'],
  ['ojo_ozmaren', 'Ojo de Ozmaren', 'Eye of Ozmaren', 'anillo', 45, 1, '', 'mas_habilidades:1,dano_fuego:15-25,res_fuego:25-30,robo_vida:4-6', 'Te mira cuando no lo miras.', 'It watches you when you are not watching it.'],
  ['eslabon_corona', 'Eslabón de la Corona', 'Link of the Crown', 'anillo', 70, 1, '', 'mas_habilidades:2,todos_atributos:10-15,res_todo:15-20', 'Un eslabón de la cadena que sostuvo la Corona. El resto cedió.', 'One link of the chain that held the Crown. The rest gave way.'],
  ['corazon_vigdis', 'Corazón de Vigdis', 'Heart of Vigdis', 'amuleto', 50, 1, '', 'mas_habilidades:2,vida:80-110,res_frio:30-40,regen_vida:6-9', 'Helado por fuera. Por dentro todavía late.', 'Frozen on the outside. Inside it still beats.'],
  ['ultimo_aliento_aun_saar', 'Último Aliento de Aun-Saar', 'Last Breath of Aun-Saar', 'amuleto', 80, 1, '', 'mas_habilidades:2,todos_atributos:15-20,res_todo:20-25,hallazgo:40-60', 'El dios suspiró una vez antes de callar. Alguien lo guardó.', 'The god sighed once before falling silent. Someone kept it.'],
];
const stats = (s: string): RangoStat[] => s.split(',').map((q) => { const [st, v] = q.split(':'), [a, b] = v.split('-').map(Number); return { stat: st as Stat, min: a, max: b ?? a }; });
export const RELIQUIAS: Unico[] = [];
for (const [id, es, en, base, nivel, leg, vivo, st, l1, l2] of F) {
  if (!BASES.some((b) => b.id === base)) throw new Error(`reliquia ${id}: falta la base ${base}`);
  // (el nivel necesario es el de la reliquia aunque caiga más adelante: una legendaria de arranque siempre se puede llevar)
  RELIQUIAS.push({ id, nombre: [es, en], base, nivel, stats: stats(st), lore: [l1, l2], ...(vivo ? { vivo } : {}), ...(leg ? { legendario: true } : {}), req: nivel });
}
UNICOS.push(...RELIQUIAS);

// ------------------------------------------------------------------ el aspecto propio de cada reliquia
// Lo que se ve en la casilla y puesto en el cuerpo. Armadura: línea, grado (1 a 5), color, ribete, gema y brillo (las
// líneas épicas del motor traen sus formas propias: escamas, dracónica, élfica, demoníaca, celestial, ahogada).
// Escudo: 'cara' y su color. Arma: 'arma', metal, gema y nivel de forja (3 a 5: más adornada).
// Se busca por el nombre del objeto, así que también vale para las reliquias que ya estaban en una partida guardada.
const ASPECTO: Record<string, string> = {
  capucha_que_volvio: 'tunica,3,#3a4a5a,#b0b8c0', jubon_sobreviviente: 'cuero,3,#6a3a2a,#c0a060', manos_enterrador: 'cuero,3,#2e2a26,#8a8478',
  botas_mensajero: 'cuero,3,#7a2a22,#d0b060', faja_abuela: 'tunica,3,#a03a50,#e8d8b0', gorro_trampero: 'cuero,3,#5a4024,#a08050',
  yelmo_centinela_dormido: 'placas,4,#4a5a6a,#c0c8d0,#80c0ff', visera_verdugo_arrepentido: 'metal,4,#2a2226,#7a2018,#c02018',
  diadema_novia_ahogada: 'ahogada,5,#2a5c62,#d8d0b8,#5fd0d8,#5fd0d8', habito_remendado: 'tunica,3,#5a5046,#8a7a60',
  piel_lobo_gris: 'cuero,4,#6a6a70,#c8c8d0', cota_mil_remiendos: 'malla,4,#7a7468,#b08a4a', coraza_herrero_ciego: 'placas,4,#3a3230,#d07020,#ff8030,#ff7020',
  habito_ultima_misa: 'tunica,5,#e8e0d0,#c8a040,#ffd060,#ffd060', loriga_guardia_rota: 'malla,5,#5a6a7a,#c0c8d0,#4080c0',
  vendas_campeon_manco: 'cuero,3,#b02a20,#e0c080', brazales_escriba_guerra: 'placas,4,#8a6a3a,#e0c080', guanteletes_recaudador: 'placas,4,#c8a040,#f0e0a0',
  sandalias_camino_largo: 'cuero,3,#a08050,#e8d8a0', botas_jinete_sin_caballo: 'cuero,4,#2a2a3a,#8090c0,#60a0ff', sabatones_vado: 'placas,4,#6a8088,#c0d8e0',
  cinto_contrabandista: 'cuero,3,#3a2a20,#c8a040', tahali_cien_presas: 'cuero,4,#5a3a22,#d8c8a0', cinturon_sargento: 'placas,4,#6a6a70,#b08a4a',
  rostro_que_no_descansa: 'metal,5,#c8b890,#6a5a40,#40d0a0,#40d0a0', corona_ascua_viva: 'metal,5,#c84a18,#ffd060,#ff6020,#ff7020',
  coraza_doce_juramentos: 'celestial,5,#c8a040,#f4e0a0,#f8f4e8,#ffd060', mortaja_ultimo_rey: 'metal,5,#3a2a4a,#c8a040,#a040ff,#a040ff',
  punos_verdugo_mayor: 'demoniaca,5,#5a1410,#c02018,#ff4020,#ff4020', pasos_sobre_brasa: 'draconica,5,#7a2a14,#ff8030,#ffb040,#ff6020',
  cenidor_coloso: 'escamas,5,#5a6a50,#c8a040,#80c060',
  tapa_caldero: 'cara,#3a3a40', rueda_carretero: 'cara,#7a5a36', cometa_cruzado_nino: 'cara,#a02028', sol_bronce: 'cara,#d09030', puerta_capilla: 'cara,#5a3a22',
  muro_lamentos: 'cara,#2a2a30', amanecer_santa_oria: 'cara,#f0e8d0',
  diente_primer_invierno: 'arma,acero,hielo,3', juramento_novicio: 'arma,acero,,3', chispa_aprendiz: 'arma,,magia,3', silbo_paramo: 'arma,,fuego_verde,3',
  falange_sepulturero: 'arma,cu_hueso,fuego_verde,3', nudillos_ayuno: 'arma,bronce,fuego,3', rama_roble_hendido: 'arma,,fuego_verde,3',
  ballesta_boticario: 'arma,bronce,fuego,3', mondadientes_tabernero: 'arma,hierro,,3', lucero_alba_chica: 'arma,cu_oro,,3', media_luna_guia: 'arma,bronce,fuego,3',
  partetroncos: 'arma,hierro,fuego,4', aguijon_pantano: 'arma,bronce,fuego_verde,4', ultima_palabra: 'arma,acero,,4', chicharra: 'arma,bronce,fuego,4',
  viento_velmora: 'arma,,magia,4', media_cosecha: 'arma,acero,hielo,4', lapida: 'arma,hierro,,5',
};
export interface AspectoReliquia { armadura?: { linea: string; grado: 1 | 2 | 3 | 4 | 5; color: string; ribete?: string; gema?: string; brillo?: string }; cara?: string; arma?: { mat?: string; gema?: string; nivel?: 1 | 2 | 3 | 4 | 5 } }
/** El aspecto propio de una reliquia, por su nombre en español. */
export const ASPECTO_RELIQUIA = new Map<string, AspectoReliquia>();
for (const u of RELIQUIAS) {
  const a = ASPECTO[u.id]; if (!a) continue;
  const q = a.split(',');
  if (q[0] === 'cara') ASPECTO_RELIQUIA.set(u.nombre[0], { cara: q[1] });
  else if (q[0] === 'arma') ASPECTO_RELIQUIA.set(u.nombre[0], { arma: { ...(q[1] ? { mat: q[1] } : {}), ...(q[2] ? { gema: q[2] } : {}), nivel: +q[3] as 3 | 4 | 5 } });
  else ASPECTO_RELIQUIA.set(u.nombre[0], { armadura: { linea: q[0], grado: +q[1] as 3 | 4 | 5, color: q[2], ...(q[3] ? { ribete: q[3] } : {}), ...(q[4] ? { gema: q[4] } : {}), ...(q[5] ? { brillo: q[5] } : {}) } });
}
