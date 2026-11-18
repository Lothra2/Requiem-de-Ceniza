# Arma la lámina de t854_formas_cascos.mts: por forma y metal, el ícono y la cabeza puesta ampliada.
# Uso: python3 juego/herramientas/t854_lamina.py [clase] [columnas]
import json, sys
from PIL import Image, ImageDraw
clase = sys.argv[1] if len(sys.argv) > 1 else 'templario'
D = f'/tmp/requiem-pruebas/cascos/formas_{clase}'; out = f'{D}/lamina.png'; K = 5
f = json.load(open(f'{D}/f.json'))
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 2
cells = []
for r in f:
    ims = [Image.open(f"{D}/g{r['k']}.png").convert('RGBA')]
    for j in (0, 1, 3):
        h = Image.open(f"{D}/h{r['k']}_{j}.png").convert('RGBA'); h = h.crop(h.getbbox()); c = h.crop((0, 0, h.width, int(h.height * 0.29)))
        ims.append(c.resize((c.width * K, c.height * K), Image.NEAREST))
    cells.append((r, ims))
CW = max(sum(i.width + 6 for i in ims) for _, ims in cells) + 8; CH = max(max(i.height for i in ims) for _, ims in cells) + 18
img = Image.new('RGB', (CW * cols, CH * ((len(cells) + cols - 1) // cols)), (34, 30, 27)); dr = ImageDraw.Draw(img)
for n, (r, ims) in enumerate(cells):
    x0, y0 = (n % cols) * CW, (n // cols) * CH; x = x0 + 4
    dr.text((x0 + 4, y0 + 2), r['n'], fill=(220, 200, 160))
    for i in ims: img.paste(i, (x, y0 + 16), i); x += i.width + 6
img.save(out); print(out, img.size)
