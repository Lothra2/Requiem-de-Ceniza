#!/usr/bin/env python3
"""Cuánto se lava a blanco el golpe (quinta pasada de poderes): de las capturas de t975 (con su `<id>_pos.json`), el
porcentaje de puntos casi blancos (los tres canales en 225 o más) en la caja del héroe y en la del blanco, por cuadro:
el peor cuadro y la media. Uso: python3 juego/herramientas/t996_blanco.py <etiqueta> [<etiqueta>...] (en
/tmp/requiem-pruebas/poderes4/cerca/<etiqueta>). UMBRAL= cambia el umbral."""
import glob, json, os, sys
from PIL import Image
U = int(os.environ.get('UMBRAL', 225))
def caja(im, c, w=24, arr=74, aba=6):
    x0, y0 = max(0, int(c[0] - w)), max(0, int(c[1] - arr)); x1, y1 = min(im.width, int(c[0] + w)), min(im.height, int(c[1] + aba))
    px = im.crop((x0, y0, x1, y1)).getdata(); n = len(px) or 1
    return 100 * sum(1 for p in px if min(p[:3]) >= U) / n
for et in sys.argv[1:]:
    D = f'/tmp/requiem-pruebas/poderes4/cerca/{et}'
    for pos in sorted(glob.glob(D + '/*_pos.json')):
        id = os.path.basename(pos)[:-9]; P = json.load(open(pos))
        fs = sorted(glob.glob(f'{D}/{id}_[0-9][0-9].png'))
        h = [caja(Image.open(f).convert('RGB'), P['heroe']) for f in fs]
        b = [caja(Image.open(f).convert('RGB'), P['blanco']) for f in fs] if P.get('blanco') else [0]
        print(f'{et:>18} {id:>18}  héroe peor {max(h):5.1f} % (cuadro {h.index(max(h)):2d}) media {sum(h)/len(h):5.1f} %   blanco peor {max(b):5.1f} % media {sum(b)/len(b):5.1f} %')
