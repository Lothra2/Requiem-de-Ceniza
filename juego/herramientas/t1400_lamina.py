# Lámina de la película (t1400_pelicula.cjs con LAMINA=1): tres cuadros por toma, una fila por toma.
# Uso: python3 juego/herramientas/t1400_lamina.py <etiqueta> [ancho de cada cuadro]
import json, sys, os
from PIL import Image, ImageDraw
et = sys.argv[1]; w = int(sys.argv[2]) if len(sys.argv) > 2 else 560
D = f'/tmp/requiem-pruebas/cine2/{et}'
fotos = json.load(open(D + '/fotos.json'))
filas = {}
for f in fotos:
    toma = os.path.basename(f).rsplit('_', 1)[0]; filas.setdefault(toma, []).append(f)
ims = [[Image.open(f).convert('RGB') for f in fs] for fs in filas.values()]
h = int(ims[0][0].height * w / ims[0][0].width)
L = Image.new('RGB', (w * 3 + 40, (h + 22) * len(ims) + 10), (16, 14, 14)); d = ImageDraw.Draw(L)
for i, (nombre, fila) in enumerate(zip(filas.keys(), ims)):
    d.text((10, i * (h + 22) + 4), nombre, fill=(220, 200, 160))
    for k, im in enumerate(fila): L.paste(im.resize((w, h), Image.LANCZOS), (10 + k * (w + 10), i * (h + 22) + 18))
L.save(D + '/lamina.png'); print(D + '/lamina.png', L.size)
