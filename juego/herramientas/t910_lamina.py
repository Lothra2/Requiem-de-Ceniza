#!/usr/bin/env python3
"""Lámina de t910_esquinas.cjs: cada esquina antes (izquierda) y ahora (derecha), a doble tamaño, cuatro pares por fila.
Uso: python3 juego/herramientas/t910_lamina.py [etiqueta] [filtro]  ->  /tmp/requiem-pruebas/esquinas/lamina_<etiqueta>[_<filtro>].png"""
import glob, os, sys
from PIL import Image

D = '/tmp/requiem-pruebas/esquinas'
etq = sys.argv[1] if len(sys.argv) > 1 else 'esq'
filtro = sys.argv[2] if len(sys.argv) > 2 else ''
pares = sorted(f for f in glob.glob(f'{D}/{etq}_*_antes.png') if filtro in os.path.basename(f))
if not pares: sys.exit('nada')
w, h = Image.open(pares[0]).size
Z, COL = 2, 2
filas = (len(pares) + COL - 1) // COL
lam = Image.new('RGB', (COL * (2 * w * Z + 12), filas * (h * Z + 12)), (20, 20, 20))
for i, a in enumerate(pares):
    x, y = (i % COL) * (2 * w * Z + 12), (i // COL) * (h * Z + 12)
    lam.paste(Image.open(a).convert('RGB').resize((w * Z, h * Z), Image.NEAREST), (x, y))
    lam.paste(Image.open(a.replace('_antes', '_ahora')).convert('RGB').resize((w * Z, h * Z), Image.NEAREST), (x + w * Z, y))
sal = f'{D}/lamina_{etq}' + (f'_{filtro}' if filtro else '') + '.png'
lam.save(sal)
print(sal, len(pares))
