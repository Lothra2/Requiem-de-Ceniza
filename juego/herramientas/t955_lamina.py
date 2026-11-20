# Láminas de los estados del HUD forjado (t955_hud_estados.cjs): de cada captura, la franja de abajo (y la de arriba en
# las del jefe), ampliada a pixel entero y con su nombre.
# Uso: python3 juego/herramientas/t955_lamina.py <etiqueta> [vistas] [carpeta]   (salida: lamina_<etiqueta>_<vista>_<n>.png)
import sys, glob, os
from PIL import Image, ImageDraw
et = sys.argv[1] if len(sys.argv) > 1 else 'x'
vistas = (sys.argv[2] if len(sys.argv) > 2 else 'pc,pc1080,movil').split(',')
d = sys.argv[3] if len(sys.argv) > 3 else '/tmp/requiem-pruebas/hud2/estados'
for v in vistas:
    fs = sorted(glob.glob(f'{d}/{et}_{v}_*.png'))
    fs = [f for f in fs if 'lamina' not in f]
    filas = []
    for f in fs:
        n = os.path.basename(f)[len(et) + len(v) + 2:-4]
        im = Image.open(f).convert('RGB'); W, H = im.size
        tactil = v in ('movil', 'ipad')
        alto = int(H * (0.5 if tactil else 0.30))
        tira = im.crop((0, H - alto, W, H))
        if 'jefe' in n or 'registro' in n or 'mensajes' in n or 'voz' in n:
            arriba = im.crop((0, 0, W, int(H * (0.24 if 'jefe' in n else 0.0)))) if 'jefe' in n else None
            if 'registro' in n or 'mensajes' in n or 'voz' in n: tira = im.crop((0, int(H * 0.25), W, H))
            if arriba is not None:
                j = Image.new('RGB', (W, arriba.size[1] + tira.size[1] + 4), (60, 20, 20)); j.paste(arriba, (0, 0)); j.paste(tira, (0, arriba.size[1] + 4)); tira = j
        k = 2 if W <= 1300 else 1
        if k > 1: tira = tira.resize((tira.size[0] * k, tira.size[1] * k), Image.NEAREST)
        ImageDraw.Draw(tira).rectangle((0, 0, 8 * len(n) + 14, 18), fill=(0, 0, 0)); ImageDraw.Draw(tira).text((6, 3), n, fill=(255, 230, 150))
        filas.append(tira)
    # varias láminas de a lo sumo 2400 de alto
    hoja, y, i = [], 0, 0
    def cerrar(hoja, i):
        if not hoja: return
        w = max(t.size[0] for t in hoja); h = sum(t.size[1] + 6 for t in hoja)
        out = Image.new('RGB', (w, h), (30, 26, 24)); yy = 0
        for t in hoja: out.paste(t, (0, yy)); yy += t.size[1] + 6
        out.save(f'{d}/lamina_{et}_{v}_{i}.png'); print(f'{d}/lamina_{et}_{v}_{i}.png', out.size)
    for t in filas:
        if y + t.size[1] > 2300 and hoja: cerrar(hoja, i); hoja, y, i = [], 0, i + 1
        hoja.append(t); y += t.size[1] + 6
    cerrar(hoja, i)
