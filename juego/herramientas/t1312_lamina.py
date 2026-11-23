#!/usr/bin/env python3
"""Láminas de un monumento: python3 t1312_lamina.py <acto> <id> <etiqueta_juego> <zona>
Saca en /tmp/requiem-pruebas/monumentos/laminas: acto<N>_lab.png (lejos y de cerca), acto<N>_juego.png (las vistas del juego),
acto<N>_vs_catedral_lab.png y _juego.png (la catedral a la izquierda, de la lámina del acto 2)."""
import sys, os
from PIL import Image, ImageDraw, ImageFont
acto, mid, et, zona = sys.argv[1:5]
B = '/tmp/requiem-pruebas/monumentos'
L = B + '/laminas'
def fila(ims, alto):
    ims = [i.resize((int(i.width * alto / i.height), alto)) for i in ims]
    out = Image.new('RGB', (sum(i.width for i in ims) + 10 * (len(ims) - 1), alto), (20, 18, 16)); x = 0
    for i in ims: out.paste(i, (x, 0)); x += i.width + 10
    return out
lab = Image.open(f'{B}/lab_{mid}.png').convert('RGB'); cer = Image.open(f'{B}/lab_{mid}_cerca.png').convert('RGB')
fila([lab, cer], 1000).save(f'{L}/acto{acto}_lab.png')
vistas = [Image.open(f'{B}/juego/{et}/{zona}_{v}.png').convert('RGB') for v in ('puerta', 'cerca', 'izq', 'der', 'lejos', 'detras')]
a = fila(vistas[:3], 720); b = fila(vistas[3:], 720)
j = Image.new('RGB', (max(a.width, b.width), 1450), (20, 18, 16)); j.paste(a, (0, 0)); j.paste(b, (0, 730)); j.save(f'{L}/acto{acto}_juego.png')
cl = Image.open(f'{L}/acto2_vs_catedral_lab.png').convert('RGB'); cat_lab = cl.crop((0, 0, cl.width // 2, cl.height))
fila([cat_lab, lab], 1050).save(f'{L}/acto{acto}_vs_catedral_lab.png')
cj = Image.open(f'{L}/acto2_vs_catedral_juego.png').convert('RGB'); cat_j = cj.crop((0, 0, (cj.width - 10) // 2, cj.height))
fila([cat_j, vistas[0]], 720).save(f'{L}/acto{acto}_vs_catedral_juego.png')
# la línea de qué la separa de la catedral (DIF=...) y, si hay, la vista de 1080 (E1080=etiqueta)
def rotulo(im, txt):
    f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 26) if os.path.exists('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf') else ImageFont.load_default()
    d0 = ImageDraw.Draw(im); filas, f0 = [], ''
    for w in txt.split(' '):
        if d0.textlength(f0 + ' ' + w, font=f) > im.width - 32 and f0: filas.append(f0); f0 = w
        else: f0 = (f0 + ' ' + w).strip()
    filas.append(f0); alto = 14 + 34 * len(filas)
    out = Image.new('RGB', (im.width, im.height + alto), (20, 18, 16)); out.paste(im, (0, alto))
    for i, t in enumerate(filas): ImageDraw.Draw(out).text((16, 8 + 34 * i), t, fill=(235, 220, 190), font=f)
    return out
dif = os.environ.get('DIF', '')
e1080 = os.environ.get('E1080')
for nom in ('vs_catedral_lab', 'vs_catedral_juego'):
    im = Image.open(f'{L}/acto{acto}_{nom}.png').convert('RGB')
    if nom == 'vs_catedral_juego' and e1080:
        g = Image.open(f'{B}/juego/{e1080}/{zona}_puerta.png').convert('RGB'); g = g.resize((int(g.width * 720 / g.height), 720))
        im2 = Image.new('RGB', (im.width + 10 + g.width, 720), (20, 18, 16)); im2.paste(im, (0, 0)); im2.paste(g, (im.width + 10, 0)); im = im2
    if dif: im = rotulo(im, 'Catedral (acto 1) a la izquierda. ' + dif)
    im.save(f'{L}/acto{acto}_{nom}.png')
print('listo', L)
