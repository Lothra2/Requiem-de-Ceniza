# Arma la lámina de cascos de t853_cascos.mts: por pieza, el ícono de la casilla y el héroe en cuatro rumbos (la
# cabeza, o las manos y los pies, ampliada) más el héroe entero a escala de juego.
# Uso: python3 juego/herramientas/t853_lamina.py [clase] [cabeza|guantes|botas] [escala]
import json, sys
from PIL import Image, ImageDraw
clase = sys.argv[1] if len(sys.argv) > 1 else 'templario'
pieza = sys.argv[2] if len(sys.argv) > 2 else 'cabeza'
K = int(sys.argv[3]) if len(sys.argv) > 3 else 4
D = f'/tmp/requiem-pruebas/cascos/{clase}' + ('' if pieza == 'cabeza' else '_' + pieza)
filas = json.load(open(f'{D}/lamina.json'))
COLS = 2
CW, CH = 820, 250
img = Image.new('RGB', (CW * COLS, CH * ((len(filas) + COLS - 1) // COLS)), (26, 22, 20))
dr = ImageDraw.Draw(img)
for n, f in enumerate(filas):
    x0, y0 = (n % COLS) * CW, (n // COLS) * CH
    dr.rectangle([x0 + 2, y0 + 2, x0 + CW - 3, y0 + CH - 3], fill=(44, 38, 34))
    ic = Image.open(f"{D}/i{f['k']}.png").convert('RGBA')
    ic2 = ic.resize((ic.width * 2, ic.height * 2), Image.NEAREST)
    img.paste(ic, (x0 + 8, y0 + 40), ic)
    img.paste(ic2, (x0 + 8, y0 + 100), ic2)
    x = x0 + 112
    for j in range(4):
        h = Image.open(f"{D}/h{f['k']}_{j}.png").convert('RGBA')
        bb = h.getbbox(); h = h.crop(bb)
        if j == 0:
            img.paste(h, (x, y0 + 230 - h.height), h); x += h.width + 8
        if pieza == 'cabeza':
            c = h.crop((0, 0, h.width, min(h.height, int(h.height * 0.24))))
        elif pieza == 'botas':
            c = h.crop((0, int(h.height * 0.72), h.width, h.height))
        else:
            c = h.crop((0, int(h.height * 0.3), h.width, int(h.height * 0.75)))
        k = K if pieza == 'cabeza' else max(2, K - 1)
        c = c.resize((c.width * k, c.height * k), Image.NEAREST)
        img.paste(c, (x, y0 + 36), c); x += c.width + 6
    t = f['traje'] or {}
    dr.text((x0 + 6, y0 + 4), f"{f['base']} n{f['nivel']} {f['rareza']}", fill=(230, 210, 170))
    dr.text((x0 + 6, y0 + 16), ' '.join(f"{k}:{v}" for k, v in t.items())[:110], fill=(170, 160, 140))
img.save(f'{D}/lamina.png')
print(f'{D}/lamina.png', img.size)
