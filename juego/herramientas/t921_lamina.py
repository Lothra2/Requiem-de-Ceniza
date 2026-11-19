#!/usr/bin/env python3
"""Láminas de t921_adornos_fotos.cjs: cada vista antes (izquierda) y ahora (derecha), seis pares por lámina.
Uso: python3 juego/herramientas/t921_lamina.py [antes] [ahora] [filtro]  ->  /tmp/requiem-pruebas/adornos/lamina_<ahora>_<n>.png"""
import glob, os, sys
from PIL import Image, ImageDraw

D = '/tmp/requiem-pruebas/adornos'
a = sys.argv[1] if len(sys.argv) > 1 else 'antes'
b = sys.argv[2] if len(sys.argv) > 2 else 'ahora'
filtro = sys.argv[3] if len(sys.argv) > 3 else ''
pares = [f for f in sorted(glob.glob(f'{D}/{a}_*.png')) if filtro in os.path.basename(f) and os.path.exists(f.replace(f'/{a}_', f'/{b}_'))]
if not pares: sys.exit('nada')
K, ALTO, POR = 0.6, 650, 6  # (el alto corta la barra de abajo)
w, h = int(1280 * K), int(ALTO * K)
for n in range(0, len(pares), POR):
    grupo = pares[n:n + POR]
    lam = Image.new('RGB', (2 * w + 30, len(grupo) * (h + 26)), (18, 16, 16))
    dib = ImageDraw.Draw(lam)
    for i, f in enumerate(grupo):
        y = i * (h + 26)
        for j, g in enumerate([f, f.replace(f'/{a}_', f'/{b}_')]):
            im = Image.open(g).convert('RGB').crop((0, 0, 1280, ALTO)).resize((w, h), Image.LANCZOS)
            lam.paste(im, (j * (w + 30), y + 22))
        dib.text((4, y + 4), os.path.basename(f)[len(a) + 1:-4] + f'   ({a} | {b})', fill=(230, 210, 160))
    sal = f'{D}/lamina_{b}_{n // POR + 1}.png'
    lam.save(sal)
    print(sal, len(grupo))
