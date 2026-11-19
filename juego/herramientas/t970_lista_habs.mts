// Las 240 habilidades en una línea cada una (clase | rama | nivel | id | nombre | tipo | elem | glifo | definitiva | forma | desc),
// para las láminas de t970_antes_ahora.py. Uso: npx tsx juego/herramientas/t970_lista_habs.mts > /tmp/requiem-pruebas/iconos/lista.txt
import { HABILIDADES } from '../src/datos/clases';
for (const h of HABILIDADES) console.log([h.clase, h.rama, h.nivelReq, h.id, h.nombre[0], h.tipo, h.elem, h.glifo, h.definitiva ? 'DEF' : '', h.forma ?? '', h.desc[0]].join(' | '));
