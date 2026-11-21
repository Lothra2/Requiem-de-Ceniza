# Lámina del arrastre (t1100_arrastre.cjs): cada tamaño en fila, al doble, con el dedo marcado en el táctil.
#   python3 juego/herramientas/t1100_lamina.py <etiqueta> [pc,movil]  ->  /tmp/requiem-pruebas/arrastre/lamina_<etiqueta>.png
import json, os, sys
from PIL import Image, ImageDraw
SAL = '/tmp/requiem-pruebas/arrastre'
et = sys.argv[1] if len(sys.argv) > 1 else 'ahora'
vistas = (sys.argv[2] if len(sys.argv) > 2 else 'pc,movil').split(',')
TAM = ['1x1', '1x2', '1x3', '2x2', '2x3', '2x4']
filas = []
for v in vistas:
    for t in TAM:
        fila = []
        for suf in ['baul', 'bolsa', 'equipo', 'baul_dedo']:
            f = f'{SAL}/{et}_{v}_{t}_{suf}.png'
            if not os.path.exists(f): continue
            im = Image.open(f).convert('RGB'); im = im.resize((im.width * 2, im.height * 2), Image.NEAREST)
            if os.path.exists(f + '.json'):
                dx, dy = json.load(open(f + '.json'))['dedo']; d = ImageDraw.Draw(im); r = 18
                d.ellipse([dx * 2 - r, dy * 2 - r, dx * 2 + r, dy * 2 + r], outline=(255, 60, 60), width=3)
            fila.append((f'{v} {t} {suf}', im))
        if fila: filas.append(fila)
ancho = max(sum(im.width + 8 for _, im in f) for f in filas)
alto = sum(max(im.height for _, im in f) + 22 for f in filas)
L = Image.new('RGB', (ancho, alto), (20, 16, 12)); d = ImageDraw.Draw(L); y = 0
for f in filas:
    x = 0
    for nom, im in f:
        d.text((x + 4, y + 4), nom, fill=(230, 200, 140)); L.paste(im, (x, y + 18)); x += im.width + 8
    y += max(im.height for _, im in f) + 22
L.save(f'{SAL}/lamina_{et}.png'); print(f'{SAL}/lamina_{et}.png', L.size)
