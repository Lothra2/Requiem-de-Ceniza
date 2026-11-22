# Láminas del reparto: cada zona antes y ahora, el mapa con los monstruos marcados (cada grupo de su color, los élites con aro
# de oro, los que rondan con un aro celeste, el héroe en la puerta en verde y su círculo de vista de 14 casillas, las
# celdas descubiertas por pantalla en la rejilla de fondo).
#   python3 juego/herramientas/t1042_reparto_lamina.py <antes> <ahora> [zonas]   -> /tmp/requiem-pruebas/enemigos/lamina_<zona>.png
import json, sys, base64, hashlib, os
from PIL import Image, ImageDraw, ImageFont
B = '/tmp/requiem-pruebas/enemigos'
antes, ahora = sys.argv[1], sys.argv[2]
zonas = sys.argv[3].split(',') if len(sys.argv) > 3 else sorted(f[:-5] for f in os.listdir(f'{B}/{ahora}') if f.endswith('.json') and f != 'resumen.json')
K = 4
def color(g):
    h = hashlib.md5(g.encode()).digest()
    return (90 + h[0] % 166, 60 + h[1] % 140, 60 + h[2] % 140)
def mapa(et, zid):
    p = f'{B}/{et}/{zid}.json'
    if not os.path.exists(p): return None
    d = json.load(open(p)); W, H = d['W'], d['H']; bq = base64.b64decode(d['bloq'])
    im = Image.new('RGB', (W * K, H * K), (0, 0, 0)); px = im.load()
    for y in range(H):
        for x in range(W):
            b = bq[y * W + x]; c = (52, 50, 46) if b == 0 else (70, 66, 58) if b == 3 else (24, 22, 22) if b == 1 else (6, 6, 8)
            for a in range(K):
                for e in range(K): px[x * K + a, y * K + e] = c
    dr = ImageDraw.Draw(im)
    hx, hy = d['heroe']; R = 14 * K
    dr.ellipse([hx * K - R, hy * K - R, hx * K + R, hy * K + R], outline=(60, 160, 60))
    dr.ellipse([hx * K - 5, hy * K - 5, hx * K + 5, hy * K + 5], fill=(80, 230, 80))
    for sx, sy, t in d['spawns']:
        c = (200, 60, 60) if t == 'jefe' else (110, 110, 110)
        dr.line([sx * K - 4, sy * K - 4, sx * K + 4, sy * K + 4], fill=c); dr.line([sx * K - 4, sy * K + 4, sx * K + 4, sy * K - 4], fill=c)
    for x, y, cal, g, ia, ronda in d['ms']:
        c = (255, 60, 40) if g == 'jefe' else color(g); r = 3 if cal == 0 else 5
        dr.ellipse([x * K - r, y * K - r, x * K + r, y * K + r], fill=c)
        if cal >= 1: dr.ellipse([x * K - r - 2, y * K - r - 2, x * K + r + 2, y * K + r + 2], outline=(240, 200, 60))
        if ronda: dr.ellipse([x * K - r - 3, y * K - r - 3, x * K + r + 3, y * K + r + 3], outline=(120, 200, 255))
        if ia in ('mago', 'distancia', 'invocador'): dr.rectangle([x * K - 1, y * K - 1, x * K + 1, y * K + 1], fill=(255, 255, 255))
    return im, d
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 22)
except Exception: F = ImageFont.load_default()
for z in zonas:
    a, b = mapa(antes, z), mapa(ahora, z)
    if not a or not b: continue
    w, h = a[0].width + b[0].width + 30, max(a[0].height, b[0].height) + 40
    L = Image.new('RGB', (w, h), (16, 14, 14)); L.paste(a[0], (0, 40)); L.paste(b[0], (a[0].width + 30, 40))
    dr = ImageDraw.Draw(L)
    g = lambda d: len(set(m[3] for m in d['ms'] if m[3] != 'jefe'))
    dr.text((8, 8), f'{z}  antes: {len(a[1]["ms"])} cuerpos en {g(a[1])} grupos', fill=(230, 220, 200), font=F)
    dr.text((a[0].width + 38, 8), f'ahora: {len(b[1]["ms"])} cuerpos en {g(b[1])} grupos', fill=(230, 220, 200), font=F)
    L.save(f'{B}/lamina_{z}.png'); print(f'{B}/lamina_{z}.png', L.size)
