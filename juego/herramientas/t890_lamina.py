# Láminas de t890_caras.mts: antes y después lado a lado, cada recorte ampliado sin suavizar.
# Uso: python3 juego/herramientas/t890_lamina.py <antes> <despues> [salida]
#   -> <salida>/caras_<escala>.png (juego, muneco, retrato) y <salida>/manos_<escala>.png
import json, sys, os
from PIL import Image, ImageDraw
A, D = sys.argv[1], sys.argv[2]
OUT = sys.argv[3] if len(sys.argv) > 3 else '/tmp/requiem-pruebas/caras'
os.makedirs(OUT, exist_ok=True)
fa, fd = json.load(open(f'{A}/filas.json')), json.load(open(f'{D}/filas.json'))
ZOOM = {'juego': 8, 'muneco': 5, 'retrato': 5}
FONDO = (34, 30, 28)

def abrir(d, f):
    p = f'{d}/{f}'
    return Image.open(p).convert('RGBA') if os.path.exists(p) else None

def lamina(clave, filtro, nombre):
    filas = [(r, next((x for x in fd[clave] if x['n'] == r['n']), None)) for r in fa[clave]]
    filas = [(a, b) for a, b in filas if b]
    celdas = [[c for c in a['celdas'] if filtro(c)] for a, _ in filas]
    if not celdas or not celdas[0]: return
    z = ZOOM[celdas[0][0]['esc']]
    m = abrir(A, celdas[0][0]['f']); cw, ch = m.width * z, m.height * z
    ncol = max(len(c) for c in celdas)
    W, H = 110 + ncol * (cw * 2 + 14) + 10, 22 + len(filas) * (ch + 6)
    img = Image.new('RGB', (W, H), FONDO); dr = ImageDraw.Draw(img)
    for j, c in enumerate(celdas[0]):
        x = 110 + j * (cw * 2 + 14)
        dr.text((x + 4, 4), f"{c['dir']}{' ' + c.get('lado', '') if c.get('lado') else ''}  antes | despues", fill=(220, 200, 160))
    for i, (a, b) in enumerate(filas):
        y = 22 + i * (ch + 6)
        dr.text((4, y + ch // 2 - 6), a['n'], fill=(220, 200, 160))
        for j, c in enumerate(celdas[i]):
            x = 110 + j * (cw * 2 + 14)
            for k, d in enumerate([A, D]):
                im = abrir(d, c['f'])
                if im is None: continue
                im = im.resize((im.width * z, im.height * z), Image.NEAREST)
                bg = Image.new('RGBA', im.size, (52, 46, 42, 255)); bg.alpha_composite(im)
                img.paste(bg.convert('RGB'), (x + k * (cw + 2), y))
    p = f'{OUT}/{nombre}.png'; img.save(p); print(p, img.size)

for esc in ['juego', 'muneco', 'retrato']:
    lamina('caras', lambda c, e=esc: c['esc'] == e, f'caras_{esc}')
for esc in ['muneco', 'juego', 'retrato']:
    lamina('manos', lambda c, e=esc: c['esc'] == e, f'manos_{esc}')
print('tiempos antes', fa.get('tiempos'), 'despues', fd.get('tiempos'))
