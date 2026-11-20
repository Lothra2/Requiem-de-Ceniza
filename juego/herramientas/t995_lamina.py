#!/usr/bin/env python3
"""Láminas de las formas del druida (t995_formas.cjs): por acción, una fila por rumbo con el druida, el lobo y el oso uno
al lado del otro (cada cuadro al doble), y las tiras del cambio de forma. Salen en /tmp/requiem-pruebas/poderes5/."""
import glob, os, re, sys
from PIL import Image, ImageDraw
D = '/tmp/requiem-pruebas/poderes5/formas'; OUT = '/tmp/requiem-pruebas/poderes5'
Z = int(os.environ.get('Z', 2))
fs = glob.glob(D + '/*.png')
poses = {}
for f in fs:
    m = re.match(r'(druida|lobo|oso)_(\w+?)_(se|s|so|o|no|n|ne|e)_(\d+)\.png$', os.path.basename(f))
    if m: poses.setdefault(m.group(2), {}).setdefault(m.group(3), {}).setdefault(m.group(1), {})[int(m.group(4))] = f
for acc, porDir in poses.items():
    dirs = [d for d in ['se', 's', 'so', 'o', 'no', 'n', 'ne', 'e'] if d in porDir]
    ej = Image.open(next(iter(next(iter(next(iter(porDir.values())).values())).values())))
    w, h = ej.size; n = max(len(v) for d in porDir.values() for v in d.values())
    W = (w * n * 3 + 24) * Z + 40; H = (h * len(dirs)) * Z + 24
    lam = Image.new('RGB', (W, H), (20, 18, 16)); dr = ImageDraw.Draw(lam)
    for fi, d in enumerate(dirs):
        for ci, c in enumerate(['druida', 'lobo', 'oso']):
            for i, ruta in sorted(porDir[d].get(c, {}).items()):
                im = Image.open(ruta).convert('RGB').resize((w * Z, h * Z), Image.NEAREST)
                lam.paste(im, (40 + (ci * (w * n + 12) + i * w) * Z, 24 + fi * h * Z))
        dr.text((4, 24 + fi * h * Z + 10), d, fill=(230, 220, 200))
    for ci, c in enumerate(['druida', 'lobo', 'oso']): dr.text((40 + ci * (w * n + 12) * Z, 4), c, fill=(230, 220, 200))
    lam.save(f'{OUT}/formas_{acc}.png'); print(f'{OUT}/formas_{acc}.png', lam.size)
tiras = {}
for f in fs:
    m = re.match(r'cambio_(\w+)_(\w+)_(\d+)\.png$', os.path.basename(f))
    if m: tiras.setdefault(f'{m.group(1)}_{m.group(2)}', []).append((int(m.group(3)), f))
if tiras:
    filas = [sorted(v) for k, v in sorted(tiras.items())]
    w, h = Image.open(filas[0][0][1]).size; n = max(len(x) for x in filas)
    lam = Image.new('RGB', (w * min(n, 8), h * len(filas) * ((n + 7) // 8)), (20, 18, 16))
    for fi, fila in enumerate(filas):
        for i, (_, ruta) in enumerate(fila): lam.paste(Image.open(ruta).convert('RGB'), ((i % 8) * w, (fi * ((n + 7) // 8) + i // 8) * h))
    lam.save(f'{OUT}/formas_cambio.png'); print(f'{OUT}/formas_cambio.png', lam.size, sorted(tiras))
