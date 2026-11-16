import sys, json
from PIL import Image, ImageDraw
c = sys.argv[1]; ids = json.load(open(f'/tmp/requiem-pruebas/pa/{c}.json'))
n = len(ids); mitad = (n + 1) // 2
for parte, rango in enumerate([range(0, mitad), range(mitad, n)]):
    L = Image.new('RGB', (1200, len(rango) * 220)); d = ImageDraw.Draw(L)
    for r, k in enumerate(rango):
        for i in range(4):
            try: L.paste(Image.open(f'/tmp/requiem-pruebas/pa/{c}_{k:02d}_{i}.png'), (i * 300, r * 220))
            except Exception: pass
        d.rectangle([0, r * 220, 170, r * 220 + 14], fill=(0, 0, 0)); d.text((3, r * 220 + 1), f'{k} {ids[k]}', fill=(255, 230, 120))
    L.save(f'/tmp/requiem-pruebas/pa/lamina_{c}_{parte}.png')
