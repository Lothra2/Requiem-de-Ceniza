// El Libro de Odrán: todo lo que se escribió nuevo para el libro, en un solo sitio, para que Rick lo lea y lo apruebe.
// Lo demás del libro son textos que el jugador ya lee en el juego (diarios, páginas, restos, misiones, fantasmas,
// voces), ordenados por hilo en libro_hilos.ts.
//
// Qué hay aquí:
//   HILO_TXT   el nombre de cada hilo y la línea con que Odrán lo abre (la que lleva la capitular)
//   CIERRES    el párrafo con que Odrán cierra cada hilo cuando junta sus piezas clave (el premio)
//   ROJOS      la nota corta del hilo rojo entre dos piezas de hilos distintos que se tocan
//   MARGEN     las notas al margen de otra mano: Vesperio muerto escribe en el libro en los actos 6 y 7
//   PISTA_*    cómo Odrán dice dónde buscar lo que falta (sin nombrar lo que no se ha visto)
//   PORTADA    la portada y el índice
//
// Canon (CLAUDE.md, Historia y canon): sed, nunca hambre. Nadie le dice hijo ni hija al héroe. Sin rayas largas ni punto y
// coma en el español. En inglés los nombres van sin tilde (Odran, Oya, Tomas).

type T2 = [string, string];

/** Nombre del hilo y la línea con que Odrán lo abre. La primera letra de la línea es la capitular iluminada. */
/** (`corto` es el nombre en el índice, donde la hoja es angosta.) */
export const HILO_TXT: Record<string, { nombre: T2; corto: T2; abre: T2 }> = {
  pozo: {
    corto: ['El pozo', 'The Well'],
    nombre: ['Lo que enterraron en el pozo', 'What They Buried in the Well'],
    abre: ['Esto lo copié de un diario que no debí leer. El primer abad tenía la letra más firme que la mía.', 'I copied this from a diary I should not have read. The first abbot had a firmer hand than mine.'],
  },
  marca: {
    corto: ['La Marca', 'The Mark'],
    nombre: ['La Marca que no se apaga', 'The Mark That Will Not Fade'],
    abre: ['Todos los del Refugio tenemos ceniza en la piel. La tuya es la única que me mira cuando escribo.', 'All of us at the Refuge carry ash on our skin. Yours is the only one that watches me while I write.'],
  },
  vesperio: {
    corto: ['Vesperio', 'Vesperio'],
    nombre: ['Vesperio, el que cantó de noche', 'Vesperio, Who Sang at Night'],
    abre: ['Era el más dulce del coro. Lo escribo porque nadie más va a querer escribirlo.', 'He was the sweetest voice in the choir. I write him down because no one else will want to.'],
  },
  tomas: {
    corto: ['Tomás', 'Tomas'],
    nombre: ['Tomás, el que lo vio todo', 'Tomas, Who Saw It All'],
    abre: ['El primer abad mandó buscar a un niño que no habla. Lo tengo sentado junto al fuego desde que llegamos.', 'The first abbot sent for a child who does not speak. He has sat by my fire since the day we came.'],
  },
  sellos: {
    corto: ['Los cinco sellos', 'The Five Seals'],
    nombre: ['Los cinco sellos', 'The Five Seals'],
    abre: ['Cinco cerraduras repartidas por el mundo. Las voy tachando a medida que caen, y me tiembla la mano.', 'Five locks scattered across the world. I strike them out as they fall, and my hand shakes.'],
  },
  ama: {
    corto: ['Ama y su hija', 'Ama and Her Daughter'],
    nombre: ['Ama y su hija', 'Ama and Her Daughter'],
    abre: ['Una capitana llevó río arriba una caja que respiraba. Su hija la sigue buscando en el agua.', 'A captain carried a breathing box upriver. Her daughter is still looking for her in the water.'],
  },
  norte: {
    corto: ['La sangre tibia', 'The Warm Blood'],
    nombre: ['La sangre tibia', 'The Warm Blood'],
    abre: ['En el norte a los muertos los entierran boca abajo. Ahora sé por qué.', 'In the north they bury the dead face down. Now I know why.'],
  },
  auren: {
    corto: ['Las siete voces', 'The Seven Voices'],
    nombre: ['Auren y las siete voces', 'Auren and the Seven Voices'],
    abre: ['Siete voces cantaban en Santa Oria, por si alguna se cansaba. Fui su archivero. Escribí cada canto.', 'Seven voices sang at Santa Oria, in case one grew tired. I was their archivist. I wrote down every song.'],
  },
  ysmeral: {
    corto: ['Ysmeral', 'Ysmeral'],
    nombre: ['Ysmeral y la Abadesa de la Sal', 'Ysmeral and the Abbess of Salt'],
    abre: ['Una ciudad que era una sola iglesia. Se hundió cenando. Subió tocando.', 'A city that was a single church. It sank at supper. It rose ringing.'],
  },
  siete: {
    corto: ['Los siete', 'The Seven'],
    nombre: ['Los siete que subieron', 'The Seven Who Climbed'],
    abre: ['Hace cuarenta años vi salir del valle a siete marcados, mirando el cielo. Ninguno volvió a bajar.', 'Forty years ago I watched seven marked ones leave the valley, staring at the sky. None came back down.'],
  },
  sed: {
    corto: ['El Sediento', 'The Thirsting'],
    nombre: ['Aun-Saar, el Sediento', 'Aun-Saar, the Thirsting'],
    abre: ['El primer abad no quiso escribir el nombre. Yo sí, porque ya no sirve de nada callarlo.', 'The first abbot would not write the name. I will, because keeping silent no longer helps anyone.'],
  },
  pregunta: {
    corto: ['La pregunta', 'The Question'],
    nombre: ['La brasa es una pregunta', 'The Ember Is a Question'],
    abre: ['Vesperio dijo una vez que la brasa no era un demonio sino una pregunta. Nadie supo cuál.', 'Vesperio once said the ember was not a demon but a question. No one knew which.'],
  },
};

/** El cierre de Odrán: se escribe cuando el hilo junta sus piezas clave. */
export const CIERRES: Record<string, T2> = {
  pozo: [
    'Ahora lo veo entero. Los primeros hermanos no encerraron a nadie. Partieron una sed en cinco pedazos y le pusieron encima lo único que tenían, siete voces y un voto. El canto era la cerradura y el silencio de la noche era la llave, guardada en el bolsillo de todos. Ulric sonreía con la boca llena de ceniza porque fue el primero en oír lo que hay abajo cuando se deja de cantar. El abad lo supo y no lo escribió. Yo lo escribo. Mil inviernos de cerradura y bastó una voz dulce en la noche equivocada. Que nadie diga que no estaba anotado. Estaba. Nadie leía.',
    'Now I see it whole. The first brothers imprisoned no one. They broke a thirst into five pieces and laid upon it the only things they had, seven voices and a vow. The song was the lock and the silence of night was the key, kept in everyone\'s pocket. Ulric smiled with his mouth full of ash because he was the first to hear what lies below when the singing stops. The abbot knew and did not write it. I write it. A thousand winters of lock, and one sweet voice on the wrong night was enough. Let no one say it was not recorded. It was. No one read.',
  ],
  marca: [
    'La ceniza de los demás es ceniza. La tuya es una astilla que se soltó cuando la brasa tocó el claustro, y se metió en alguien que dormía y no pidió nada. Por eso los guardianes te esperaban y los muertos te llamaban sangre de su sangre. Por eso la voz de tu brazo iba contando los sellos, como quien cuenta los días que faltan para volver a casa. No eras quien abría las puertas. Eras la puerta, caminando. Lo que hiciste con la Brasa ya está escrito en estas hojas. Lo que hará ella contigo todavía no lo sé. Te miro el brazo antes que la cara, como todos. Perdóname.',
    'Everyone else\'s ash is only ash. Yours is a splinter that broke loose when the ember touched the cloister, and it crept into someone asleep who asked for nothing. That is why the guardians waited for you and the dead called you blood of their blood. That is why the voice in your arm kept counting the seals, the way one counts the days left before going home. You were never the one opening the doors. You were the door, walking. What you did with the Ember is already written in these pages. What it will do with you I do not know yet. I look at your arm before your face, like everyone. Forgive me.',
  ],
  vesperio: [
    'Juntando sus cartas se entiende lo que ninguno quiso entender. Vesperio no quería abrir el mundo. Quería que alguien lo escuchara. Su madre no lo escuchaba, el voto no lo dejaba, y en el fondo del pozo había una que sí. Le cantó a la Abadesa, a los reyes de abajo, a la Madre que lo arrullaba en sueños y a un rey de hielo, y cada vez te dio las gracias, porque tú hacías lo que su voz sola no alcanzaba. Murió diciendo que tu Marca nunca fue ceniza. Fue lo único cierto que dijo sin cantar. Las cartas nunca llegaron. Las guardo aquí, en el orden en que las escribió. Alguien tenía que leerlas.',
    'Gather his letters together and you understand what none of us wanted to. Vesperio did not want to open the world. He wanted someone to listen. His mother did not, the vow would not let him, and at the bottom of the well there was one who did. He sang to the Abbess, to the kings below, to the Mother who rocked him in dreams and to a king of ice, and each time he thanked you, because you did what his voice alone could not. He died saying your Mark was never ash. It was the only true thing he said without singing. The letters never arrived. I keep them here, in the order he wrote them. Someone had to read them.',
  ],
  tomas: [
    'Los monjes le quitaron la voz a Tomás porque lo vio todo, y lo que no pudo decir lo dibujó. Dibujó la brasa pequeña sobre tu cabeza antes de que nadie la nombrara. Dibujó al pálido con notas de fuego en la boca. Dibujó la capucha que miraba desde lejos en el bosque, y yo le serví la sopa a Ciro igual. Los ahorcados se fueron livianos porque alguien les enseñó a rezar de noche, y al que les enseñó a ellos le había enseñado un hombre pálido en los osarios. Todo estaba en los dibujos. Yo archivé palabras cuarenta años y no supe leer un dibujo. Tomás no necesitaba voz. Necesitaba que alguien mirara.',
    'The monks took Tomas\'s voice because he saw it all, and what he could not say he drew. He drew the small ember over your head before anyone named it. He drew the pale man with notes of fire in his mouth. He drew the hood watching from afar in the forest, and I served Ciro his soup all the same. The hanged went lightly because someone taught them to pray at night, and the one who taught them had been taught by a pale man in the ossuaries. It was all in the drawings. I filed words away for forty years and could not read a drawing. Tomas never needed a voice. He needed someone to look.',
  ],
  sellos: [
    'Abadesa, rey, madre, rey otra vez, y la Sed misma en su fragua. Ninguno de los cinco se rompió solo. A Ilvara la ablandó el silencio roto, a Khamer-Ul su propio sueño, a la Madre una canción de cuna, a Hjaldur un juramento que se derritió. A cada uno le llegó primero una voz y después tú. Los monjes creyeron que repartir los pedazos lejos era esconderlos. Era sembrarlos. Cada sello que caía dejaba la brasa más cerca de la siguiente, como agua que busca el agua. Cuando cayó el último la sed no se acabó. Subió. Lo que sigue ya no es de sellos. Es de quien los dejó caer desde arriba.',
    'Abbess, king, mother, king again, and the Thirst itself at its forge. None of the five broke on its own. Ilvara was softened by the broken silence, Khamer-Ul by his own sleep, the Mother by a lullaby, Hjaldur by an oath that melted. To each of them came a voice first, and then you. The monks believed that scattering the pieces far apart was hiding them. It was sowing them. Every seal that fell left the ember closer to the next, like water seeking water. When the last one fell the thirst did not end. It rose. What follows is no longer about seals. It is about the one who let them fall from above.',
  ],
  ama: [
    'Ama llevó el tercer pedazo río arriba por encargo nuestro y vio hundirse una ciudad con los tambores sonando. Le escribió a su hija que no volviera al templo. Años después Ysmeral subió con sus campanas tocando su nombre y Ama fue, porque le prometieron que Oyá nunca se iba a ahogar. Cumplieron. Oyá navega todavía y el mar no la toca. Se la lleva de otra forma, como dice la última hoja, y la forma es esta guerra. Los monjes de Santa Oria le pagaron a Ama con una caja. Ysmeral le pagó con una promesa. Ninguno de los dos le devolvió a su hija.',
    'Ama carried the third piece upriver on our errand and watched a city sink with its drums still beating. She wrote to her daughter never to return to the temple. Years later Ysmeral rose with its bells ringing her name and Ama went, because they promised her Oya would never drown. They kept their word. Oya sails still and the sea does not touch her. It takes her another way, as the last page says, and that way is this war. The monks of Santa Oria paid Ama with a box. Ysmeral paid her with a promise. Neither of them gave her back her daughter.',
  ],
  norte: [
    'Hjaldur se sentó sobre el sello y juró no levantarse, y durante trescientos inviernos el frío fue su manera de cumplir. Cuando el pálido le cantó, se levantó con el corazón cambiado por escarcha que late. Su puerta pedía sangre tibia que fuera sola, y en el norte todos tienen a alguien bajo el hielo que los vuelve tibios de esperar. Eirik buscaba a sus hijos. Los hijos de Hakon buscaban a su madre, y a ella el rey le había prometido calor. Vigdis se ofreció porque estaba tibia de esperar a Eirik veinte inviernos. Lo que decidiste está escrito arriba. Lo que aprendió el norte es más corto. El frío conserva las promesas. El calor es lo que las rompe.',
    'Hjaldur sat upon the seal and swore never to rise, and for three hundred winters the cold was how he kept his word. When the pale man sang to him, he rose with his heart traded for frost that beats. His door asked for warm blood that came alone, and in the north everyone has someone under the ice who keeps them warm with waiting. Eirik was searching for his children. Hakon\'s sons were searching for their mother, and the king had promised her warmth. Vigdis offered herself because twenty winters of waiting for Eirik had kept her warm. What you decided is written above. What the north learned is shorter. Cold keeps promises. Warmth is what breaks them.',
  ],
  auren: [
    'Seis voces bajaron al Abismo a cantarle a la nada y una se quedó en el Bastión, sola, sin callarse un año entero. Yo creí que esa voz era la más fiel. Era la que más debía. Auren le enseñó la canción a Vesperio y lo dejó cargar la culpa, y desde esa noche cada canto suyo fue un pago. Lo escribí todo sin saber. Treinta años de cantos en mi libro, y en ninguno estaba la otra mitad. Ahora el nombre de Auren va dos veces en estas hojas, una entre los que cantaron y otra entre los que mintieron. No lo tacho de ninguna. Las dos son verdad, y un archivero no elige qué verdad se queda.',
    'Six voices went down into the Abyss to sing to the nothing, and one stayed at the Bastion, alone, without falling silent for a whole year. I believed that voice was the most faithful. It was the one that owed the most. Auren taught Vesperio the song and let him carry the blame, and from that night on every song of his was a payment. I wrote it all down without knowing. Thirty years of songs in my book, and the other half was in none of them. Now Auren\'s name appears twice in these pages, once among those who sang and once among those who lied. I strike it from neither. Both are true, and an archivist does not choose which truth stays.',
  ],
  ysmeral: [
    'Ysmeral pactó con el fondo, campanas a cambio de orilla, y nadie preguntó hacia dónde mira el fondo. Mira hacia arriba. Cuando cayó la luz sobre el mar, la sacerdotisa se ató a la campana mayor y tocó hasta volverse bronce, y la Abadesa de la Sal mandó callar al único que tocaba a rebato. La campana tenía que sonar llena, una sola vez, cuando llegara la hora. Nadie corrió porque nadie supo. No querían ahogar a la ciudad. Querían subirla, a palmos, hacia quien tiene sed, con la mesa puesta. El agua de Ysmeral nunca fue un castigo. Fue una ofrenda.',
    'Ysmeral made a pact with the deep, bells in exchange for shore, and no one asked which way the deep faces. It faces up. When the light fell upon the sea, the priestess chained herself to the great bell and rang until she turned to bronze, and the Abbess of Salt silenced the only one who rang the alarm. The bell had to sound full, once, when the hour came. No one ran because no one knew. They did not want to drown the city. They wanted to raise it, a hand\'s breadth at a time, toward the one who thirsts, with the table set. The water of Ysmeral was never a punishment. It was an offering.',
  ],
  siete: [
    'Eran siete, marcados por mirar la brasa de la Herida más de la cuenta, y los monjes les dijeron que eran la llave sin decirles de qué puerta. Subieron por una rendija de un dedo y la rendija se cerró detrás. Uno escribió que el último escalón estaba en blanco y que no era para él. Eskel se escondió cuando el copero le ofreció la copa, y por eso vive, y por eso no es nadie, dice. Seis dejaron su nombre en la piedra antes de la escalera. Las estatuas del jardín tienen la Marca de todos ellos y la tuya. No eran tumbas. Eran ensayos. El dios practicaba con ellos la cara que te iba a poner a ti.',
    'There were seven, marked for staring at the ember of the Wound too long, and the monks told them they were the key without telling them which door. They climbed through a crack one finger wide and the crack closed behind them. One wrote that the last step was blank and that it was not meant for him. Eskel hid when the cupbearer offered him the cup, and that is why he lives, and that is why he is no one, he says. Six left their names on the stone before the stair. The statues in the garden bear all their Marks, and yours. They were not tombs. They were rehearsals. The god was practising on them the face it would show you.',
  ],
  sed: [
    'Todo este tiempo peleamos contra su sed y nunca contra él. Ozmaren era un trago que se le cayó del pecho. Las brasas son lágrimas de fuego. Las estrellas son lo que dejó en el fondo del vaso de otro mundo. No odia ni ama. Tiene sed desde antes del agua, y en el lugar del corazón tiene una boca que habla con la voz del náufrago y del niño que llora de noche. Por eso cuesta odiarlo. Un rey del norte se sentó en el hielo para que no bebiera de nosotros. Una ciudad entera subió con la mesa puesta para que bebiera. Cuando dijo una palabra después de mil inviernos, fue tu nombre. Escribo el suyo una sola vez. Aun-Saar. Que el próximo archivero lo olvide.',
    'All this time we fought his thirst and never him. Ozmaren was a mouthful that fell from his chest. The embers are tears of fire. The stars are what he left at the bottom of another world\'s cup. He neither hates nor loves. He has thirsted since before there was water, and where his heart should be he has a mouth that speaks with the voice of the drowning man and of the child who cries at night. That is why he is hard to hate. A king of the north sat on the ice so he would not drink from us. A whole city rose with the table set so that he would. When he spoke a word after a thousand winters, it was your name. I write his only once. Aun-Saar. Let the next archivist forget it.',
  ],
  pregunta: [
    'Ya sé cuál era. No es quién le va a dar de beber. Es quién va a tener sed cuando él se apague. Un dios que se muere de sed desde antes del mundo no busca agua. Busca un heredero. Primero miró a Vesperio, que le barrió la casa y le abrió las cinco puertas. Después te vio a ti, y el pálido dejó de existir, y desde la muerte vino a decirlo con celos de hermano mayor. Lys oyó la pregunta y calló. Auren la oyó y no la entendió. Yo la escribo con la respuesta al lado, que es lo único que sabe hacer un libro. Si alguna noche te sale una canción que no aprendiste, ya sabes de quién es la voz.',
    'Now I know which it was. Not who will give him to drink. Who will thirst when he goes out. A god dying of thirst since before the world is not looking for water. He is looking for an heir. First he looked at Vesperio, who swept his house and opened the five doors for him. Then he saw you, and the pale man ceased to exist, and from death he came to say so with an elder brother\'s jealousy. Lys heard the question and kept silent. Auren heard it and did not understand it. I write it down with the answer beside it, which is the only thing a book knows how to do. If some night a song you never learned comes out of you, you will know whose voice it is.',
  ],
};

/** El hilo rojo: una nota corta de Odrán entre dos piezas de hilos distintos que se tocan (ids de libro_hilos.ts). */
export const ROJOS: { a: string; b: string; nota: T2 }[] = [
  { a: 'tomas_ciro', b: 'ves_her1', nota: ['El mismo pálido de los osarios. Ciro no aprendió a rezar solo.', 'The same pale man from the ossuaries. Ciro did not learn to pray alone.'] },
  { a: 'tomas_dibujo', b: 'ves_ivola1', nota: ['Tomás lo dibujó cantando antes de que Ívola lo escribiera.', 'Tomas drew him singing before Ivola wrote it down.'] },
  { a: 'pozo_p2', b: 'aur_coro', nota: ['Las siete voces del abad. Seis bajaron. Una se quedó.', 'The abbot\'s seven voices. Six went down. One stayed.'] },
  { a: 'pozo_p8', b: 'ves_ivola1', nota: ['La primera noche que alguien cante. Ya cantó.', 'The first night someone sings. Someone did.'] },
  { a: 'sel_mapa', b: 'ysm_camp0', nota: ['El sexto sello del mapa estaba bajo una ciudad que no existía. Ahora existe.', 'The sixth seal on the map lay beneath a city that did not exist. Now it does.'] },
  { a: 'sel_mapa', b: 'sie_tabla2', nota: ['La escalera dibujada sobre el mar. La misma.', 'The stair drawn above the sea. The same one.'] },
  { a: 'ama_hija', b: 'sel_ama1', nota: ['Es la misma bitácora. Las hojas se separaron con el barco.', 'It is the same logbook. The pages parted with the ship.'] },
  { a: 'nor_runas1', b: 'sed_sigrun', nota: ['El trono de oro que veía Hjaldur es el mismo de la abuela de Sigrun.', 'The golden throne Hjaldur saw is the one Sigrun\'s grandmother spoke of.'] },
  { a: 'aur_juicio', b: 'ves_carta1', nota: ['La canción que lo dejaron cantar solo tenía otra voz.', 'The song they let him sing alone had another voice.'] },
  { a: 'aur_juicio', b: 'pre_cielo', nota: ['El recado para Auren llegó tarde. O justo.', 'The message for Auren came late. Or just in time.'] },
  { a: 'mar_astilla', b: 'ves_muerte', nota: ['Lo dijo muriendo. El Libro de horas lo decía antes.', 'He said it dying. The Book of Hours said it first.'] },
  { a: 'ysm_voz', b: 'sed_costa', nota: ['La voz honda conoce a la que tocó tres días.', 'The deep voice knows the one who rang for three days.'] },
  { a: 'pre_barrio', b: 'mar_llanuras', nota: ['La voz del brazo cambió de dueño. Aquí se nota.', 'The voice in the arm changed hands. Here you can tell.'] },
  { a: 'aur_doce', b: 'ysm_salitre', nota: ['Doce hermanas allá, siete voces aquí. Siempre alguien cantando para sostener algo.', 'Twelve sisters there, seven voices here. Always someone singing to hold something up.'] },
  { a: 'sie_resto', b: 'sie_eskel', nota: ['«Eskel, no bebas.» No bebió.', '"Eskel, do not drink." He did not.'] },
  { a: 'pozo_resto', b: 'ves_ivola0', nota: ['No cantaron. Igual vino. Alguien había cantado por ellos.', 'They did not sing. It came anyway. Someone had sung for them.'] },
];

/**
 * Las notas al margen de otra mano. En los actos 6 y 7, con Vesperio muerto, su fantasma escribe en el libro de Odrán con
 * tinta pálida, inclinada al revés. No se arrepiente: tiene celos (canon, el fantasma de Vesperio). Van junto a la pieza.
 */
export const MARGEN: { p: string; nota: T2 }[] = [
  { p: 'ves_carta1', nota: ['Nunca la mandé. Madre no sabía leer.', 'I never sent it. Mother could not read.'] },
  { p: 'ves_ivola1', nota: ['Ella escuchaba. El viejo no.', 'She listened. The old man did not.'] },
  { p: 'ves_muerte', nota: ['No me arrepiento. Escríbelo bien, viejo.', 'I do not repent. Write it properly, old man.'] },
  { p: 'pozo_p8', nota: ['Fui yo. Pon mi nombre.', 'It was me. Put my name.'] },
  { p: 'aur_juicio', nota: ['Él cantaba la otra mitad. Siempre se olvidan de la otra mitad.', 'He sang the other half. They always forget the other half.'] },
  { p: 'sie_tabla2', nota: ['Ese escalón era mío.', 'That step was mine.'] },
  { p: 'mar_hielo', nota: ['No era su cara. Era la mía, en el agua del pozo.', 'It was not her face. It was mine, in the water of the well.'] },
  { p: 'sel_lys', nota: ['Sonrió porque la brasa le habló con mi voz.', 'She smiled because the ember spoke to her in my voice.'] },
  { p: 'aur_coro_eleccion', nota: ['Seis nombres. El mío no lo escribió.', 'Six names. Mine he did not write.'] },
  { p: 'sed_ent6', nota: ['A ti te dijo tu nombre. A mí me dijo que tenía sed.', 'To you he said your name. To me he said he was thirsty.'] },
  { p: 'mar_brasa', nota: ['Lo que hiciste con ella lo hice yo primero, con la voz.', 'What you did with it I did first, with my voice.'] },
];

/** Las pistas de Odrán para lo que falta, por pieza, cuando la de plantilla no alcanza. Sin nombrar lo no visto. */
export const PISTA_PIEZA: Record<string, T2> = {
  pozo_p8: ['La última hoja del abad está en el fondo de la pila. Siempre está en el fondo.', 'The abbot\'s last page is at the bottom of the pile. It always is.'],
  pozo_odran: ['Pregúntame a mí, cuando tenga ganas de contar. En el fin del mundo las tengo.', 'Ask me, when I feel like telling. At the end of the world, I do.'],
  sie_odran: ['Pregúntame a mí, en el Refugio, cuando hayas visto la abadía.', 'Ask me, at the Refuge, once you have seen the abbey.'],
  tomas_ciro: ['Pregúntale al penitente que reza de más, mientras todavía duerma entre nosotros.', 'Ask the penitent who prays too much, while he still sleeps among us.'],
  nor_glaciar: ['Algo quedó en la nieve, buscando a alguien. Acércate despacio.', 'Something was left in the snow, looking for someone. Come close slowly.'],
  sie_eskel: ['Pregúntale al que se escondió.', 'Ask the one who hid.'],
  ves_muerte: ['Esto se escribe cuando el que canta ya no pueda huir.', 'This is written when the singer can no longer run.'],
  mar_revelacion: ['Se escribe al final de la Herida, frente a lo que arde.', 'It is written at the end of the Wound, facing what burns.'],
  mar_brasa: ['Se escribe cuando decidas qué hacer con lo que arde.', 'It is written when you decide what to do with what burns.'],
  pre_costa: ['Un muerto que canta mal espera en la orilla, mirando lo más alto que hay.', 'A dead man who sings badly waits on the shore, staring at the tallest thing there.'],
  pre_barrio: ['Entre campanas enterradas espera el mismo muerto.', 'The same dead man waits among buried bells.'],
  pre_cielo: ['Donde la escalera se corta en el aire, alguien canta solo.', 'Where the stair breaks off in the air, someone sings alone.'],
  pre_jardin: ['Ante el cáliz del jardín, la pregunta tiene respuesta.', 'Before the garden\'s chalice, the question has its answer.'],
};

/** Cómo se llama la tierra de cada acto en la letra de Odrán (para las pistas, sin nombrar zonas que no se vieron). */
export const TIERRA: Record<number, T2> = {
  1: ['el valle', 'the valley'], 2: ['la arena', 'the sand'], 3: ['la selva', 'the jungle'], 4: ['la nieve', 'the snow'],
  5: ['la Herida', 'the Wound'], 6: ['la ciudad que subió', 'the risen city'], 7: ['el cielo roto', 'the broken sky'],
};
/** A quién le pregunta Odrán: cada uno por lo que hace, no por su nombre. */
export const EPITETO: Record<string, T2> = {
  odran: ['yo mismo', 'I myself'], lys: ['la hermana que cose', 'the sister who stitches'], brannoc: ['el herrero', 'the smith'],
  ysolde: ['la de las cartas', 'the one with the cards'], tomas: ['el niño que dibuja', 'the boy who draws'], qadir: ['el aguador', 'the water-bearer'],
  nahla: ['la de los ungüentos', 'the one with the ointments'], barzin: ['el forjador del oasis', 'the oasis smith'], cartografo: ['el viejo que dibuja sin ojos', 'the old man who draws without eyes'],
  oya: ['la capitana', 'the captain'], tlalli: ['la yerbera', 'the herbwoman'], jorun: ['el remendón', 'the cobbler'], ixel: ['el hermano que huyó con una campana', 'the brother who fled with a bell'],
  sigrun: ['la jarla', 'the jarl'], vigdis: ['la curandera del norte', 'the healer of the north'], hakon: ['el viejo de la fragua del norte', 'the old man of the northern forge'],
  nino_nieve: ['el niño de la nieve', 'the snow child'], auren: ['el que no deja de cantar', 'the one who never stops singing'], tarn: ['el calafate', 'the caulker'],
  nerea: ['la de la marea', 'the one of the tide'], sor_salitre: ['la monja de la sal', 'the nun of salt'], mira: ['la que cuenta estrellas', 'the one who counts stars'],
  eskel: ['el que se escondió', 'the one who hid'], hollin: ['el ermitaño', 'the hermit'], ciro: ['el penitente que reza de más', 'the penitent who prays too much'],
};
/** Las pistas por tipo de pieza. {t} la tierra, {n} a quién preguntar, {z} el lugar si ya lo pisaste (si no, la tierra). */
export const PISTA_TIPO: Record<string, T2> = {
  pag: ['Hay más hojas del primer abad sueltas en los libros malditos. Lee todo lo que encuentres.', 'More of the first abbot\'s pages lie loose in the cursed books. Read everything you find.'],
  diario: ['Alguien dejó un cuaderno en {t}. Busca los libros que nadie quiere tocar.', 'Someone left a notebook in {t}. Look for the books no one wants to touch.'],
  resto: ['Algo pasó en {t}. Lo que quedó se puede leer, si uno se agacha.', 'Something happened in {t}. What was left can be read, if you kneel.'],
  carta: ['Hay una carta sin mandar en {t}, donde te espera el que canta.', 'There is an unsent letter in {t}, where the singer waits for you.'],
  pista: ['En {z} quedaron señales. Pregúntale a {n} qué buscar.', 'Signs were left in {z}. Ask {n} what to look for.'],
  pedido: ['Pregúntale a {n}. Tiene algo que pedirte.', 'Ask {n}. There is something to ask of you.'],
  hecho: ['Lo que te pidió {n} todavía no está terminado.', 'What {n} asked of you is not finished yet.'],
  eleccion: ['Alguien va a tener que decidir. {n} espera que seas tú.', 'Someone will have to decide. {n} hopes it will be you.'],
  fantasma: ['Hay un muerto que no se fue en {z}. Acércate despacio.', 'There is a dead one who never left in {z}. Come close slowly.'],
  heraldo: ['El que canta se va a cruzar contigo en {t}. Déjalo hablar antes.', 'The singer will cross your path in {t}. Let him speak first.'],
  entreacto: ['Esto se escribe cuando caiga lo que guarda {t}.', 'This is written when whatever guards {t} falls.'],
  voz: ['Tu brazo habla en {z}. Escúchalo.', 'Your arm speaks in {z}. Listen to it.'],
  entrada: ['Hay que pisar {z}.', 'You have to set foot in {z}.'],
  jefeZona: ['Lo que manda en el fondo de {z} habla antes de pelear.', 'Whatever rules the depths of {z} speaks before it fights.'],
  jefe: ['El guardián de {t} dice algo al verte. Escúchalo antes de matarlo.', 'The guardian of {t} says something when it sees you. Listen before you kill it.'],
  npc: ['Pregúntale a {n} cuando te cuente sus cosas.', 'Ask {n} when they tell you their stories.'],
  desvio: ['En {z} hay un rincón apartado del camino. Se llega a propósito.', 'In {z} there is a nook far from the road. You only reach it on purpose.'],
  caza: ['Alguien con nombre anda suelto en {z}.', 'Someone with a name roams loose in {z}.'],
  intro: ['Esto se sabe desde el principio.', 'This has been known from the start.'],
};
/** Lo que se lee en las hojas en blanco al final de un hilo que sigue en actos que no llegaron. */
export const AUN_NO: T2 = ['Lo demás todavía no pasó. Dejo las hojas en blanco.', 'The rest has not happened yet. I leave the pages blank.'];
/** El hilo está por cerrarse (le falta una sola pieza clave): la hoja late. */
export const LATE: T2 = ['Le falta una sola cosa. La hoja late.', 'One thing is missing. The page beats.'];

export const PORTADA = {
  titulo: ['Libro de Odrán', 'The Book of Odran'] as T2,
  sub: ['Nombres, y lo que pasó con ellos', 'Names, and what became of them'] as T2,
  epigrafe: ['Fui archivero de Santa Oria cuarenta años. Escribí cantos, cuentas y nombres. Ahora escribo lo que encuentras. Si una hoja está en blanco es porque todavía no se la contaste a nadie.', 'I was archivist of Santa Oria for forty years. I wrote songs, accounts and names. Now I write what you find. If a page is blank it is because you have not yet told it to anyone.'] as T2,
  firma: ['Odrán, de su mano', 'Odran, by his own hand'] as T2,
  indice: ['Índice', 'Index'] as T2,
  cerrado: ['cerrado', 'closed'] as T2,
  nuevo: ['nuevo', 'new'] as T2,
  anota: ['Odrán anota algo en su libro.', 'Odran writes something in his book.'] as T2,
  ayuda: ['Rueda, flechas o arrastra para pasar la hoja. J o Esc lo cierra.', 'Wheel, arrows or drag to turn the page. J or Esc closes it.'] as T2,
  ayudaTactil: ['Desliza para pasar la hoja. Toca un hilo del índice.', 'Swipe to turn the page. Tap a thread in the index.'] as T2,
  codice: ['Jefes, decisiones y cine: Códice (K).', 'Bosses, choices and films: Codex (K).'] as T2,
  faltan: ['faltan', 'missing'] as T2,
  de: ['de', 'of'] as T2,
  hiloRojo: ['hilo rojo', 'red thread'] as T2,
  vacio: ['Todavía no hay nada escrito. Sal a mirar.', 'Nothing is written yet. Go out and look.'] as T2,
  codiceTactil: ['Jefes, decisiones y cine: toca aquí para el Códice.', 'Bosses, choices and films: tap here for the Codex.'] as T2,
  entiendo: ['Lo que ahora entiendo', 'What I understand now'] as T2,
  sinCorto: ['Sin nombre', 'Unnamed'] as T2,
  sinNombre: ['Un hilo que todavía no tiene nombre', 'A thread that has no name yet'] as T2,
  sinAbre: ['Todavía no sé de qué se trata. Sé que empieza por aquí.', 'I do not yet know what it is about. I know it starts here.'] as T2,
};
