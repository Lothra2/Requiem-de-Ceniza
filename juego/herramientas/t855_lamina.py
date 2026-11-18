# Arma la lámina de t855_dinamica.mts: una fila por acción y rumbo con todos sus cuadros, alineados por el ancla
# (el centro de cada cuadro horneado), ampliados. Uso: python3 juego/herramientas/t855_lamina.py <clase> <conjunto> [escala]
import json, sys
from PIL import Image, ImageDraw
clase, conj = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 2
D = f'/tmp/requiem-pruebas/dinamica/{clase}_{conj}'
filas = json.load(open(f'{D}/filas.json'))
ims = {}
W = H = 0
for r in filas:
    for f in range(r['n']):
        im = Image.open(f"{D}/{r['acc']}_{r['dir']}_{f}.png").convert('RGBA')
        ims[(r['acc'], r['dir'], f)] = im; W = max(W, im.width); H = max(H, im.height)
CW, CH = W * K, H * K
cols = max(r['n'] for r in filas)
img = Image.new('RGB', (cols * CW + 80, len(filas) * CH), (40, 36, 32)); dr = ImageDraw.Draw(img)
for i, r in enumerate(filas):
    dr.text((2, i * CH + 4), f"{r['acc']}\n{r['dir']}", fill=(220, 200, 160))
    for f in range(r['n']):
        im = ims[(r['acc'], r['dir'], f)]
        im = im.resize((im.width * K, im.height * K), Image.NEAREST)
        x, y = 80 + f * CW + (CW - im.width) // 2, i * CH + (CH - im.height) // 2
        img.paste(im, (x, y), im)
img.save(f'/tmp/requiem-pruebas/dinamica/{clase}_{conj}.png'); print(f'/tmp/requiem-pruebas/dinamica/{clase}_{conj}.png', img.size)
