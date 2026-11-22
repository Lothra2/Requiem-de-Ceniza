# Láminas del acto 2: por zona, antes arriba y ahora abajo, en los mismos puntos; y las cinco tumbas lado a lado.
# Uso: python3 juego/herramientas/t1040_lamina.py <antes> <ahora> (DIR=/tmp/requiem-pruebas/acto2, LADO=zonas de la lámina lado a lado)
import json, os, sys
from PIL import Image, ImageDraw
D = os.environ.get('DIR', '/tmp/requiem-pruebas/acto2')
antes, ahora = sys.argv[1], (sys.argv[2] if len(sys.argv) > 2 else None)
W = 480
def carga(et):
    try: return json.load(open(f'{D}/{et}/indice.json'))
    except Exception: return []
def img(et, f):
    p = f'{D}/{et}/{f}'
    if not os.path.exists(p): return None
    im = Image.open(p).convert('RGB'); return im.resize((W, int(im.height * W / im.width)))
def fila(et, fs):
    ims = [img(et, f) for f in fs]; ims = [i for i in ims if i]
    if not ims: return None
    h = ims[0].height; out = Image.new('RGB', (W * len(ims), h + 18), (12, 10, 10)); d = ImageDraw.Draw(out)
    for n, i in enumerate(ims): out.paste(i, (n * W, 18))
    d.text((6, 3), et, fill=(230, 200, 150)); return out
ia = carga(antes); zonas = []
for q in ia:
    if q['zid'] not in zonas: zonas.append(q['zid'])
for z in zonas:
    fs = [q['f'] for q in ia if q['zid'] == z]
    filas = [f for f in [fila(antes, fs), fila(ahora, fs) if ahora else None] if f]
    out = Image.new('RGB', (max(f.width for f in filas), sum(f.height for f in filas)), (0, 0, 0)); y = 0
    for f in filas: out.paste(f, (0, y)); y += f.height
    out.save(f'{D}/lamina_{z}.png')
TUMBAS = os.environ.get('LADO', 'a2_nombres1,a2_nombres2,a2_sol,a2_tumbas1,a2_tumbas2,a2_escarabajos').split(',')
for sitio in ['p1', 'p2', 'entrada']:
    filas = [f for f in [fila(antes, [f'{z}_{sitio}.png' for z in TUMBAS]), fila(ahora, [f'{z}_{sitio}.png' for z in TUMBAS]) if ahora else None] if f]
    if not filas: continue
    out = Image.new('RGB', (max(f.width for f in filas), sum(f.height for f in filas)), (0, 0, 0)); y = 0
    for f in filas: out.paste(f, (0, y)); y += f.height
    out.save(f'{D}/lamina_tumbas_{sitio}.png')
print('láminas en', D)
