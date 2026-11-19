# Antes y ahora de los íconos de habilidad, de las tiras que deja t970_iconos.cjs (en el juego, 46 a x3 y 22 al lado).
# Uso: python3 juego/herramientas/t970_antes_ahora.py [antes] [ahora] -> /tmp/requiem-pruebas/iconos/antes_ahora.png
# (los nombres salen de npx tsx juego/herramientas/t970_lista_habs.mts > /tmp/requiem-pruebas/iconos/lista.txt)
import json, sys
from PIL import Image, ImageDraw, ImageFont
D = '/tmp/requiem-pruebas/iconos'; A = sys.argv[1] if len(sys.argv) > 1 else 'antes'; B = sys.argv[2] if len(sys.argv) > 2 else 'ahora'
lista = [l.split(' | ') for l in open(f'{D}/lista.txt').read().strip().split('\n')]
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 12)
# una muestra: de cada clase, las que antes compartían glifo (escudos, coronas, ojos, nubes, frascos...)
muestra = [i for i, l in enumerate(lista) if l[3] in ('ira_jarl', 'rugido', 'eco_feroz', 'alarido', 'sentencia_final', 'aura_firmeza', 'egida_alba', 'muralla_fe', 'bola_fuego', 'combustion', 'ventisca', 'tempestad', 'flecha_certera', 'ojo_halcon', 'marca_presa', 'instinto_presa', 'alzar_esqueleto', 'explosion_cadaver', 'ofrenda', 'terror', 'puno_rayo', 'nudillos_hierro', 'tercer_ojo', 'mente_serena', 'savia_vieja', 'abrazo_bosque', 'roble_sabio', 'despertar_bosque', 'bomba_ignea', 'frasco_helado', 'elixir', 'tonico_hierro')]
def celda(nombre, s, i):
    im = Image.open(f'{D}/{nombre}_{s}.png').convert('RGB'); return im.crop(((i % 24) * s, (i // 24) * s, (i % 24) * s + s, (i // 24) * s + s))
cw = 46 * 3 * 2 + 40; ch = 46 * 3 + 40; cols = 4
im = Image.new('RGB', (cols * cw + 10, ((len(muestra) + cols - 1) // cols) * ch + 10), (24, 20, 18)); d = ImageDraw.Draw(im)
for k, i in enumerate(muestra):
    x = 10 + (k % cols) * cw; y = 10 + (k // cols) * ch
    im.paste(celda(A, 46, i).resize((138, 138), Image.NEAREST), (x, y)); im.paste(celda(B, 46, i).resize((138, 138), Image.NEAREST), (x + 148, y))
    im.paste(celda(A, 22, i), (x, y + 142)); im.paste(celda(B, 22, i), (x + 148, y + 142))
    d.text((x + 28, y + 146), lista[i][4][:18], fill=(220, 210, 190), font=F); d.text((x + 176, y + 146), lista[i][0], fill=(150, 140, 120), font=F)
im.save(f'{D}/antes_ahora.png'); print(f'{D}/antes_ahora.png', len(muestra))
