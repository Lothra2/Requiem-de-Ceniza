# Láminas de los íconos de habilidad: una por clase, cada habilidad con su nombre, a tamaño real (46, 26, 22) y a 46 x4.
# Lee lo que deja t971_iconos_lab.mts. Uso: python3 juego/herramientas/t971_lamina.py [clase]
import json, sys
from PIL import Image, ImageDraw, ImageFont
D = '/tmp/requiem-pruebas/iconos/lab'
m = json.load(open(f'{D}/meta.json')); tams = m['tams']; Z = 4
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 13)
except Exception: F = ImageFont.load_default()
clases = []
for e in m['meta']:
    if e['clase'] not in clases: clases.append(e['clase'])
if len(sys.argv) > 1: clases = [c for c in clases if c == sys.argv[1]]
for cl in clases:
    items = [e for e in m['meta'] if e['clase'] == cl]
    cols = 6; cw = 46 * Z + 20; ch = 46 * Z + 70
    W = cols * cw + 10; H = ((len(items) + cols - 1) // cols) * ch + 10
    im = Image.new('RGB', (W, H), (24, 20, 18)); d = ImageDraw.Draw(im)
    for i, e in enumerate(items):
        x = 10 + (i % cols) * cw; y = 10 + (i // cols) * ch
        big = Image.open(e['f'][str(tams[0])]).convert('RGBA').resize((46 * Z, 46 * Z), Image.NEAREST); im.paste(big, (x, y), big)
        xx = x
        for s in tams:
            sm = Image.open(e['f'][str(s)]).convert('RGBA'); im.paste(sm, (xx, y + 46 * Z + 6), sm); xx += s + 6
        d.text((xx + 4, y + 46 * Z + 6), ('* ' if e['def'] else '') + e['nombre'], fill=(240, 220, 170) if e['def'] else (220, 210, 190), font=F)
        d.text((xx + 4, y + 46 * Z + 24), f"{e['tipo']} / {e['elem']}", fill=(150, 140, 120), font=F)
    im.save(f'/tmp/requiem-pruebas/iconos/lamina_{cl}.png'); print(f'/tmp/requiem-pruebas/iconos/lamina_{cl}.png', len(items))

# Revisión de unos pocos: REV=id,id,... arma /tmp/requiem-pruebas/iconos/lamina_revision.png (46 a x3 y 22 al lado)
import os
if os.environ.get('REV'):
    ids = os.environ['REV'].split(',')
    items = [e for e in m['meta'] if e['id'] in ids]
    cols = 7; cw = 46 * 3 + 12; ch = 46 * 3 + 44
    im = Image.new('RGB', (cols * cw + 8, ((len(items) + cols - 1) // cols) * ch + 8), (24, 20, 18)); d = ImageDraw.Draw(im)
    for i, e in enumerate(items):
        x = 8 + (i % cols) * cw; y = 8 + (i // cols) * ch
        big = Image.open(e['f']['46']).convert('RGBA').resize((138, 138), Image.NEAREST); im.paste(big, (x, y), big)
        sm = Image.open(e['f']['22']).convert('RGBA'); im.paste(sm, (x, y + 142), sm)
        d.text((x + 26, y + 144), e['nombre'][:16], fill=(220, 210, 190), font=F)
    im.save('/tmp/requiem-pruebas/iconos/lamina_revision.png'); print('revision', len(items))
