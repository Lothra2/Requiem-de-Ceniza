# Arma la lámina de trajes de t851_lamina_trajes.mts: cada traje con el héroe (dos rumbos, ampliado) y sus íconos.
# Uso: python3 juego/herramientas/t851_lamina.py [clase] [escala]
import json, sys
from PIL import Image, ImageDraw
clase = sys.argv[1] if len(sys.argv) > 1 else 'templario'
K = int(sys.argv[2]) if len(sys.argv) > 2 else 2
D = f'/tmp/requiem-pruebas/trajes/{clase}'
filas = json.load(open(f'{D}/lamina.json'))
CW, CH, COLS = 330, 300, 6
img = Image.new('RGB', (CW * COLS, CH * ((len(filas) + COLS - 1) // COLS)), (26, 22, 20))
dr = ImageDraw.Draw(img)
for n, f in enumerate(filas):
    x0, y0 = (n % COLS) * CW, (n // COLS) * CH
    dr.rectangle([x0 + 2, y0 + 2, x0 + CW - 3, y0 + CH - 3], fill=(38, 33, 30))
    x = x0 + 8
    for j in range(2):
        h = Image.open(f"{D}/h{f['k']}_{j}.png").convert('RGBA')
        h = h.crop(h.getbbox())
        h = h.resize((h.width * K, h.height * K), Image.NEAREST)
        img.paste(h, (x, y0 + 210 - h.height), h); x += h.width + 6
    ix = x0 + 8
    for p in f['iconos']:
        ic = Image.open(p).convert('RGBA')
        img.paste(ic, (ix, y0 + 215), ic); ix += ic.width + 2
    t = f['traje']
    dr.text((x0 + 6, y0 + 4), f"{f['nombre'][:30]} n{f['nivel']} {f['rareza']}", fill=(230, 210, 170))
    dr.text((x0 + 6, y0 + 16), ' '.join(f"{k}:{v}" for k, v in t.items() if k != 'linea')[:52], fill=(170, 160, 140))
    dr.text((x0 + 6, y0 + 28), t['linea'], fill=(170, 160, 140))
img.save(f'{D}/lamina.png')
print(f'{D}/lamina.png', img.size)
