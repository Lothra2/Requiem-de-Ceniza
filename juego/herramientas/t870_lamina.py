#!/usr/bin/env python3
# Láminas de las armas vivas a partir de las capturas de t870_armas_vivas.cjs.
#   t870_lamina.py tira <etiqueta> <prefijo> [zoom]        una fila: quieto, caminar y todo el ataque de un arma y elemento
#   t870_lamina.py hoja <etiqueta> <clase> <fams> <elems> <dir> <cuadro_ataque> [zoom]
#                                                          elementos en filas × armas en columnas, quieto y golpe lado a lado
import sys, os, glob
from PIL import Image, ImageDraw

BASE = '/tmp/requiem-pruebas/armas'


def abrir(p):
    return Image.open(p).convert('RGB') if os.path.exists(p) else Image.new('RGB', (160, 160), (40, 0, 40))


def tira(etq, pre, z=3):
    d = f'{BASE}/{etq}'
    fs = [f'{d}/{pre}_quieto0.png', f'{d}/{pre}_quieto1.png'] + sorted(glob.glob(f'{d}/{pre}_camina*.png'))[:3] + sorted(glob.glob(f'{d}/{pre}_ataque*.png'))
    ims = [abrir(f) for f in fs]
    w, h = ims[0].size
    out = Image.new('RGB', (len(ims) * w * z, h * z))
    for i, im in enumerate(ims):
        out.paste(im.resize((w * z, h * z), Image.NEAREST), (i * w * z, 0))
    dest = f'{d}/tira_{pre}.png'
    out.save(dest)
    print(dest)


def hoja(etq, clase, fams, elems, dr, cuadro, z=2):
    d = f'{BASE}/{etq}'
    fams, elems = fams.split(','), elems.split(',')
    clases = clase.split(',')
    w = h = 160
    cw, ch = 2 * w * z + 8, h * z
    out = Image.new('RGB', (110 + len(fams) * cw, 24 + len(elems) * ch), (12, 10, 14))
    g = ImageDraw.Draw(out)
    for c, fam in enumerate(fams):
        g.text((110 + c * cw + 6, 6), fam, fill=(230, 220, 200))
    for r, el in enumerate(elems):
        g.text((6, 24 + r * ch + ch // 2), el, fill=(230, 220, 200))
        for c, fam in enumerate(fams):
            cl = next((k for k in clases if os.path.exists(f'{d}/{k}_{fam}_{el}_{dr}_quieto0.png')), clases[0])
            pre = f'{d}/{cl}_{fam}_{el}_{dr}'
            a = abrir(f'{pre}_quieto0.png').resize((w * z, h * z), Image.NEAREST)
            b = abrir(f'{pre}_ataque{int(cuadro):02d}.png').resize((w * z, h * z), Image.NEAREST)
            out.paste(a, (110 + c * cw, 24 + r * ch))
            out.paste(b, (110 + c * cw + w * z, 24 + r * ch))
    dest = f'{d}/hoja_{dr}_{cuadro}.png'
    out.save(dest)
    print(dest)


def zoom(etq, pres, cuadros, z=3, rec=None):
    # filas = prefijos, columnas = cuadros; rec = x,y,w,h dentro del recorte de 160 (para acercar más)
    d = f'{BASE}/{etq}'
    pres, cuadros = pres.split(','), cuadros.split(',')
    x0, y0, w, h = [int(v) for v in rec.split(',')] if rec else (0, 0, 160, 160)
    out = Image.new('RGB', (len(cuadros) * w * z, len(pres) * h * z))
    for r, pre in enumerate(pres):
        for c, cu in enumerate(cuadros):
            im = abrir(f'{d}/{pre}_{cu}.png').crop((x0, y0, x0 + w, y0 + h)).resize((w * z, h * z), Image.NEAREST)
            out.paste(im, (c * w * z, r * h * z))
    dest = f'{d}/zoom.png'
    out.save(dest)
    print(dest)


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[0] == 'zoom':
        zoom(a[1], a[2], a[3], int(a[4]) if len(a) > 4 else 3, a[5] if len(a) > 5 else None)
    elif a[0] == 'tira':
        tira(a[1], a[2], int(a[3]) if len(a) > 3 else 3)
    else:
        hoja(a[1], a[2], a[3], a[4], a[5], a[6], int(a[7]) if len(a) > 7 else 2)
