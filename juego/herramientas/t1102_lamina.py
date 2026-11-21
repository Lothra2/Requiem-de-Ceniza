# Láminas de antes y después de la letra gótica en los menús (t1102_menus_gotico.cjs): por vista, la portada, Opciones y
# la vigilia, el antes arriba y el ahora abajo, y un recorte al doble del menú, de la ficha y de Opciones.
# Uso: python3 juego/herramientas/t1102_lamina.py <antes> <ahora> [vistas]   -> /tmp/requiem-pruebas/gotico/lamina_<vista>.png
import sys, os
from PIL import Image, ImageDraw
D = '/tmp/requiem-pruebas/gotico'
antes, ahora = sys.argv[1], sys.argv[2]
vistas = (sys.argv[3] if len(sys.argv) > 3 else 'pc,pc1080,movil').split(',')
PANT = ['portada', 'opciones', 'vigilia']
for v in vistas:
    filas = []
    for et in (antes, ahora):
        ims = []
        for p in PANT:
            f = f'{D}/{et}_{v}_{p}.png'
            if os.path.exists(f):
                im = Image.open(f).convert('RGB'); k = 640 / im.width; ims.append(im.resize((640, int(im.height * k)), Image.LANCZOS))
        if ims: filas.append((et, ims))
    if not filas: continue
    H = max(i.height for _, ims in filas for i in ims)
    out = Image.new('RGB', (640 * len(PANT), (H + 22) * len(filas)), (16, 12, 10)); d = ImageDraw.Draw(out)
    for r, (et, ims) in enumerate(filas):
        d.text((6, r * (H + 22) + 4), et, fill=(230, 200, 140))
        for c, im in enumerate(ims): out.paste(im, (c * 640, r * (H + 22) + 22))
    out.save(f'{D}/lamina_{v}.png'); print(f'{D}/lamina_{v}.png')
    # recortes al doble (las mismas cajas en el antes y el ahora, en proporción de la pantalla)
    cajas = {'portada': (0.04, 0.5, 0.42, 0.95), 'vigilia': (0.52, 0.15, 0.95, 0.65), 'opciones': (0.25, 0.0, 0.75, 0.55)}
    rec = []
    for et in (antes, ahora):
        fila = []
        for p, (a, b, c2, d2) in cajas.items():
            f = f'{D}/{et}_{v}_{p}.png'
            if not os.path.exists(f): continue
            im = Image.open(f).convert('RGB'); W, Hh = im.size
            cr = im.crop((int(a * W), int(b * Hh), int(c2 * W), int(d2 * Hh)))
            z = max(1, round(560 / cr.width)); fila.append(cr.resize((cr.width * z, cr.height * z), Image.NEAREST))
        rec.append(fila)
    if rec and rec[0]:
        ww = sum(i.width for i in rec[0]); hh = max(i.height for f in rec for i in f)
        o = Image.new('RGB', (ww, hh * len(rec)), (16, 12, 10))
        for r, f in enumerate(rec):
            x = 0
            for i in f: o.paste(i, (x, r * hh)); x += i.width
        o.save(f'{D}/lamina_{v}_cerca.png'); print(f'{D}/lamina_{v}_cerca.png')
