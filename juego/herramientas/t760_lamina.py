import sys, json, os, glob
from PIL import Image, ImageDraw
c = sys.argv[1]; D = sys.argv[2] if len(sys.argv) > 2 else '/tmp/requiem-pruebas/pa'; ids = json.load(open(f'{D}/{c}.json'))
NF = max([int(f[-5]) for f in glob.glob(f'{D}/{c}_*_?.png')] + [3]) + 1  # cuadros por poder (4 las viejas, 5 ahora)
n = len(ids); mitad = (n + 1) // 2
for parte, rango in enumerate([range(0, mitad), range(mitad, n)]):
    L = Image.new('RGB', (300 * NF, len(rango) * 220)); d = ImageDraw.Draw(L)
    for r, k in enumerate(rango):
        for i in range(NF):
            try: L.paste(Image.open(f'{D}/{c}_{k:02d}_{i}.png'), (i * 300, r * 220))
            except Exception: pass
        d.rectangle([0, r * 220, 170, r * 220 + 14], fill=(0, 0, 0)); d.text((3, r * 220 + 1), f'{k} {ids[k]}', fill=(255, 230, 120))
    L.save(f'{D}/lamina_{c}_{parte}.png')
