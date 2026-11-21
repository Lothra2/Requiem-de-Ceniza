#!/usr/bin/env python3
"""Lámina antes y después de t1016_tapados_fotos.cjs: cada sitio en una fila, el recorte de alrededor del adorno al doble.
Uso: python3 juego/herramientas/t1016_lamina.py antes ahora [zonas]   (/tmp/requiem-pruebas/tapados/fotos/lamina_*.png)"""
import sys, os, json
from PIL import Image, ImageDraw
D = '/tmp/requiem-pruebas/tapados/fotos'
a, b = sys.argv[1], sys.argv[2]
puntos = json.load(open(os.path.join(D, 'puntos.json')))
zonas = sys.argv[3].split(',') if len(sys.argv) > 3 else list(puntos)
filas = [(z, i, s) for z in zonas for i, s in enumerate(puntos.get(z, []))]
CW, CH, K = 380, 230, 2  # recorte alrededor del adorno (arriba a la izquierda del héroe) y ampliación
for hoja in range(0, len(filas), 6):
    parte = filas[hoja:hoja + 6]
    L = Image.new('RGB', (CW * K * 2 + 30, (CH * K + 26) * len(parte)), (20, 20, 22))
    d = ImageDraw.Draw(L)
    for r, (z, i, s) in enumerate(parte):
        for c, et in enumerate((a, b)):
            f = os.path.join(D, et, f'{z}_{i}.png')
            if not os.path.exists(f): continue
            im = Image.open(f).convert('RGB')
            x0, y0 = 640 - CW // 2, 312 - 112 - CH // 2
            im = im.crop((x0, y0, x0 + CW, y0 + CH)).resize((CW * K, CH * K), Image.NEAREST)
            L.paste(im, (c * (CW * K + 30), r * (CH * K + 26) + 22))
            d.text((c * (CW * K + 30) + 6, r * (CH * K + 26) + 4), f'{et}: {z} {s["que"]} {s["id"]} ({s["cx"]},{s["cy"]})', fill=(235, 225, 200))
    ruta = os.path.join(D, f'lamina_{hoja // 6}.png'); L.save(ruta); print(ruta)
