# Recortes de t890 ampliados para mirar de cerca: python3 t890_zoom.py <salida.png> <zoom> <dir1>[,<dir2>...] <archivo1> [archivo2 ...]
# (cada fila un directorio: antes, despues...; cada columna un recorte)
import sys
from PIL import Image
out, z, dirs, fs = sys.argv[1], int(sys.argv[2]), sys.argv[3].split(','), sys.argv[4:]
ims = [[Image.open(f'{d}/{f}').convert('RGBA') for f in fs] for d in dirs]
w = max(i.width for r in ims for i in r) * z; h = max(i.height for r in ims for i in r) * z
o = Image.new('RGB', (len(fs) * (w + 6), len(dirs) * (h + 6)), (24, 22, 20))
for j, r in enumerate(ims):
    for i, im in enumerate(r):
        bg = Image.new('RGBA', im.size, (52, 46, 42, 255)); bg.alpha_composite(im)
        o.paste(bg.convert('RGB').resize((im.width * z, im.height * z), Image.NEAREST), (i * (w + 6), j * (h + 6)))
o.save(out); print(out, o.size)
