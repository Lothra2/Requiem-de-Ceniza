# Lámina de los recortes de t953_hud_detalle.cjs: por vista, los orbes al 100, 50 y 15 % (dos cuadros), los atajos
# (quietos, con el ratón encima de uno vacío y eligiendo), el correr, el recurso y los letreros, ampliados sin suavizar.
# Uso: python3 juego/herramientas/t953_lamina.py <etiqueta> [vistas]   (salida /tmp/requiem-pruebas/hud/detalle/lamina_detalle.png)
import sys, os
from PIL import Image, ImageDraw, ImageFont

D = '/tmp/requiem-pruebas/hud/detalle'
ET = sys.argv[1]
VS = (sys.argv[2] if len(sys.argv) > 2 else 'pc,pc1080,ipad').split(',')
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 20); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 14)
except Exception:
    F = f2 = ImageFont.load_default()
ANCHO = 2000
FILAS = [
    ('orbes', [f'orbe{o}_{k}_{f}' for o in 'VM' for k in (100, 50, 15) for f in (0, 1)], 220),
    ('atajos', ['atajos_izq', 'atajos_der', 'atajos_izq_encima', 'atajos_der_eligiendo'], 200),
    ('placas y letreros', ['correr', 'caminar', 'recurso', 'letrero_inv', 'letrero_menu', 'letrero_vida'], 110),
]
bloques = []
for v in VS:
    cab = Image.new('RGB', (ANCHO, 36), (16, 13, 11)); ImageDraw.Draw(cab).text((10, 6), v, font=F, fill=(240, 210, 140)); bloques.append(cab)
    for nom, ids, alto in FILAS:
        ims = []
        for i in ids:
            pth = f'{D}/{ET}_{v}_{i}.png'
            if not os.path.exists(pth): continue
            im = Image.open(pth).convert('RGB'); k = max(1, round(alto / im.height)); ims.append((i, im.resize((im.width * k, im.height * k), Image.NEAREST)))
        if not ims: continue
        x, y, fila, h = 10, 0, [], 0
        lienzos = []
        for i, im in ims:
            if x + im.width > ANCHO - 10 and fila: lienzos.append((fila, h)); fila, x, h = [], 10, 0
            fila.append((x, i, im)); x += im.width + 12; h = max(h, im.height)
        if fila: lienzos.append((fila, h))
        for fila, h in lienzos:
            c = Image.new('RGB', (ANCHO, h + 26), (16, 13, 11)); dr = ImageDraw.Draw(c)
            for x, i, im in fila: c.paste(im, (x, 20)); dr.text((x, 2), i, font=f2, fill=(200, 180, 140))
            bloques.append(c)
out = Image.new('RGB', (ANCHO, sum(b.height for b in bloques)), (16, 13, 11)); y = 0
for b in bloques: out.paste(b, (0, y)); y += b.height
out.save(f'{D}/lamina_detalle.png'); print(f'{D}/lamina_detalle.png', out.size)
