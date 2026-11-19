# Tiras de t970_poderes_cerca.cjs: por cada toma (rayo, suelo, combustion) los cuadros desde que algo se ve, en
# columnas de 4, con el tiempo y lo que pasó. Con dos etiquetas pone una encima de la otra por toma (antes y después).
# Uso: python3 t970_lamina.py <etiqueta> [otra]   ->  /tmp/requiem-pruebas/poderes/cerca/lamina_<toma>.png
import sys, json, os
from PIL import Image, ImageDraw
B = '/tmp/requiem-pruebas/poderes/cerca'
ets = sys.argv[1:] or ['ahora']
import glob
extra = sorted({os.path.basename(f)[:-5] for et in ets for f in glob.glob(f'{B}/{et}/*.json')} - {'rayo', 'suelo', 'combustion'})
for toma, desde, cuantos in [('rayo', 6, 12), ('suelo', 6, 8), ('combustion', 6, 24)] + [(x, 6, 16) for x in extra]:
    filas = []
    for et in ets:
        f = f'{B}/{et}/{toma}.json'
        if not os.path.exists(f): continue
        datos = json.load(open(f))
        ims = []
        for i in range(desde, min(len(datos), desde + cuantos)):
            im = Image.open(f'{B}/{et}/{toma}_{i:02d}.png').convert('RGB')
            # el centro al doble y sin suavizar: a 1280 x 720 el mundo va a escala 1 y el poder ocupa unos 250 puntos
            # (el rayo salta lejos: va entero a escala 1)
            if toma != 'rayo': im = im.crop((150, 90, 430, 255)).resize((560, 330), Image.NEAREST)
            d = ImageDraw.Draw(im)
            x = datos[i]; d.rectangle([0, 0, 250, 13], fill=(0, 0, 0)); d.text((3, 1), f"{et} {toma} t={x['t']} arcos={x['arcos']} sac={x['sac']}", fill=(255, 230, 120))
            ims.append(im)
        filas.append(ims)
    if not filas: continue
    w, h = filas[0][0].size; cols = 4
    alto = sum(((len(r) + cols - 1) // cols) for r in filas) * h
    L = Image.new('RGB', (w * cols, alto)); y = 0
    for r in filas:
        for k, im in enumerate(r): L.paste(im, ((k % cols) * w, y + (k // cols) * h))
        y += ((len(r) + cols - 1) // cols) * h
    L.save(f'{B}/lamina_{toma}.png'); print(f'{B}/lamina_{toma}.png', L.size)
