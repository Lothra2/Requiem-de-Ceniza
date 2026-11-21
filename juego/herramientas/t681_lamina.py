"""Láminas de la portada: momentos (antes y ahora) y el golpe cuadro a cuadro, con recortes del título al doble.
Uso: python3 juego/herramientas/t681_lamina.py <antes> <ahora> [vista_idioma ...]   (por omisión pc_es pc1080_es movil_es pc_en)
     python3 juego/herramientas/t681_lamina.py golpe <etiqueta> <vista_idioma>
Salida en /tmp/requiem-pruebas/portada2/laminas."""
import json, os, sys
from PIL import Image, ImageDraw
R = '/tmp/requiem-pruebas/portada2'
S = f'{R}/laminas'; os.makedirs(S, exist_ok=True)
MOM = ['entrada', 'golpe', 'forja1', 'forja2', 'forjado', 'enciende', 'bucle1', 'bucle2']

def recorte_titulo(im, rect, escala_log):
    x, y, w, h = [v * escala_log for v in rect]
    return im.crop((int(x - w * 0.06), max(0, int(y - h * 0.02)), int(x + w * 1.06), int(y + h * 0.95)))

def rotulo(im, s):
    d = ImageDraw.Draw(im); d.rectangle((0, 0, 8 + 7 * len(s), 16), fill=(0, 0, 0)); d.text((4, 2), s, fill=(255, 220, 160)); return im

def lamina_momentos(antes, ahora, k):
    filas = []
    for etq in (antes, ahora):
        m = json.load(open(f'{R}/{etq}/medidas.json'))[k]
        fila = []
        for n in MOM:
            p = f'{R}/{etq}/{k}_{n}.png'
            if not os.path.exists(p): continue
            im = Image.open(p).convert('RGB')
            sc = im.width / json_W(etq, k, im)
            c = recorte_titulo(im, m['rect'], sc); c = c.resize((int(c.width * 360 / c.height), 360))
            fila.append(rotulo(c, f'{etq} {n}'))
        filas.append(fila)
    W = max(sum(c.width for c in f) for f in filas); L = Image.new('RGB', (W, 360 * len(filas)))
    for i, f in enumerate(filas):
        x = 0
        for c in f: L.paste(c, (x, i * 360)); x += c.width
    L.save(f'{S}/momentos_{antes}_{ahora}_{k}.png')
    # recortes de las letras al doble (bucle1): la palabra de arriba, punto por punto
    filas = []
    for etq in (antes, ahora):
        m = json.load(open(f'{R}/{etq}/medidas.json'))[k]
        im = Image.open(f'{R}/{etq}/{k}_bucle1.png').convert('RGB'); sc = im.width / json_W(etq, k, im)
        x, y, w, h = [v * sc for v in m['rect']]
        c = im.crop((int(x + w * 0.04), max(0, int(y - h * 0.02)), int(x + w * 0.5), int(y + h * 0.5)))
        c = c.resize((c.width * 2, c.height * 2), Image.NEAREST); filas.append(rotulo(c, f'{etq} x2'))
    L = Image.new('RGB', (max(c.width for c in filas), sum(c.height for c in filas)))
    yy = 0
    for c in filas: L.paste(c, (0, yy)); yy += c.height
    L.save(f'{S}/letras_x2_{antes}_{ahora}_{k}.png')
    # el botón encendido
    bs = [f'{R}/{e}/{k}_boton.png' for e in (antes, ahora) if os.path.exists(f'{R}/{e}/{k}_boton.png')]
    if len(bs) == 2:
        cs = []
        for p in bs:
            im = Image.open(p).convert('RGB'); sc = im.width / json_W(antes, k, im)
            c = im.crop((int(40 * sc), int(im.height * 0.6), int(420 * sc), int(im.height * 0.76))); cs.append(c.resize((c.width * 2, c.height * 2), Image.NEAREST))
        L = Image.new('RGB', (cs[0].width, cs[0].height * 2)); L.paste(cs[0], (0, 0)); L.paste(cs[1], (0, cs[0].height)); L.save(f'{S}/boton_x2_{antes}_{ahora}_{k}.png')

def json_W(etq, k, im):
    # el título va limitado por el alto (w = H x 0,4 / 0,6): de ahí sale la escala de lógico a captura
    m = json.load(open(f'{R}/{etq}/medidas.json'))[k]
    if m.get('W'): return m['W']
    return im.width / (im.height / (m['rect'][2] * 1.5))

def lamina_golpe(etq, k):
    d = f'{R}/{etq}/golpe_{k}'; r = json.load(open(f'{d}/rect.json'))
    fs = sorted(f for f in os.listdir(d) if f.endswith('.png'))
    im0 = Image.open(f'{d}/{fs[0]}'); sc = im0.height / (r[2] * 1.5)
    cs = []
    for i, f in enumerate(fs[::2]):
        im = Image.open(f'{d}/{f}').convert('RGB'); c = recorte_titulo(im, r, sc); c = c.resize((int(c.width * 220 / c.height), 220)); cs.append(rotulo(c, f'{i * 2}'))
    col = 6; W = cs[0].width; L = Image.new('RGB', (W * col, 220 * ((len(cs) + col - 1) // col)))
    for i, c in enumerate(cs): L.paste(c, ((i % col) * W, (i // col) * 220))
    L.save(f'{S}/golpe_{etq}_{k}.png')

if sys.argv[1] == 'golpe': lamina_golpe(sys.argv[2], sys.argv[3])
else:
    for k in (sys.argv[3:] or ['pc_es', 'pc1080_es', 'movil_es', 'pc_en']):
        try: lamina_momentos(sys.argv[1], sys.argv[2], k)
        except FileNotFoundError as e: print('falta', e)
print('listo', S)
