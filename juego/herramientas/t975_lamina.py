# Tiras de t975_poderes_lento.cjs: por cada poder 12 cuadros (uno de cada dos) al doble, sin suavizar, con el tiempo.
# Con dos etiquetas pone una encima de la otra (antes y después). Uso: python3 t975_lamina.py <etiqueta> [otra] [SOLO=a,b]
# -> /tmp/requiem-pruebas/poderes4/cerca/lamina_<etiqueta>_<poder>.png
import sys, json, os, glob
from PIL import Image, ImageDraw
B = '/tmp/requiem-pruebas/poderes4/cerca'
ets = sys.argv[1:]
solo = os.environ.get('SOLO', '').split(',') if os.environ.get('SOLO') else None
ids = sorted({os.path.basename(f)[:-5] for f in glob.glob(f'{B}/{ets[0]}/*.json')})
for t in ids:
    if solo and t not in solo: continue
    filas = []
    for et in ets:
        f = f'{B}/{et}/{t}.json'
        if not os.path.exists(f): continue
        datos = json.load(open(f)); ims = []
        for i in range(1, len(datos), 2):
            im = Image.open(f'{B}/{et}/{t}_{i:02d}.png').convert('RGB').crop((60, 40, 340, 230)).resize((560, 380), Image.NEAREST)
            d = ImageDraw.Draw(im); d.rectangle([0, 0, 200, 13], fill=(0, 0, 0)); d.text((3, 1), f'{et} {t} t={datos[i]}', fill=(255, 230, 120)); ims.append(im)
        filas.append(ims)
    if not filas: continue
    cols = 6; w, h = 560, 380
    alto = sum(((len(r) + cols - 1) // cols) for r in filas) * h
    L = Image.new('RGB', (w * cols, alto)); y = 0
    for r in filas:
        for k, im in enumerate(r): L.paste(im, ((k % cols) * w, y + (k // cols) * h))
        y += ((len(r) + cols - 1) // cols) * h
    L.save(f'{B}/lamina_{"_".join(ets)}_{t}.png')
