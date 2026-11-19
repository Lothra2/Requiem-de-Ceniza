# Lámina de t952_salidas_mapa: antes y después del mapa grande, el minimapa (x2) y el umbral en el mundo.
# python3 juego/herramientas/t950_lamina.py [antes] [despues]  ->  /tmp/requiem-pruebas/mapa/lamina_mapa.png
import sys, os
from PIL import Image, ImageDraw
D = '/tmp/requiem-pruebas/mapa'; A = sys.argv[1] if len(sys.argv) > 1 else 'antes'; B = sys.argv[2] if len(sys.argv) > 2 else 'despues'
filas = []
def par(nombre, caja, esc):
    fa, fb = f'{D}/{A}_{nombre}.png', f'{D}/{B}_{nombre}.png'
    if not (os.path.exists(fa) and os.path.exists(fb)): return
    ims = [Image.open(f).convert('RGB').crop(caja) for f in (fa, fb)]
    ims = [i.resize((int(i.width * esc), int(i.height * esc)), Image.NEAREST if esc >= 1 else Image.LANCZOS) for i in ims]
    filas.append((nombre, ims))
for z in ['a1_abadia2', 'a1_cata1', 'a1_cementerio', 'a1_paramo']:
    par(f'{z}_mapa', (160, 40, 1270, 560), 0.62)
for z, ds in [('a1_abadia2', ['a1_abadia1', 'a1_cata1']), ('a1_cata1', ['a1_abadia2', 'a1_pozo']), ('a1_cementerio', ['a1_abadia1', 'a1_cripta']), ('a1_paramo', ['a1_guarida'])]:
    for d in ds:
        par(f'{z}_mundo_{d}', (1096, 0, 1280, 166), 2)
        par(f'{z}_mundo_{d}', (500, 120, 820, 360), 1.3)
W = max(sum(i.width for i in ims) + 30 for _, ims in filas); H = sum(max(i.height for i in ims) + 26 for _, ims in filas) + 30
L = Image.new('RGB', (W, H), (18, 15, 12)); d = ImageDraw.Draw(L); y = 10
d.text((10, 0), f'izquierda: {A}   derecha: {B}', fill=(220, 200, 150))
for n, ims in filas:
    d.text((10, y + 4), n, fill=(200, 180, 120)); x = 10; y += 18
    for i in ims: L.paste(i, (x, y)); x += i.width + 10
    y += max(i.height for i in ims) + 8
L.save(f'{D}/lamina_mapa.png'); print(f'{D}/lamina_mapa.png', L.size)
