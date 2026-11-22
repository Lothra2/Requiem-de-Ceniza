#!/usr/bin/env python3
"""Láminas de un monumento: python3 t1312_lamina.py <acto> <id> <etiqueta_juego> <zona>
Saca en /tmp/requiem-pruebas/monumentos/laminas: acto<N>_lab.png (lejos y de cerca), acto<N>_juego.png (las vistas del juego),
acto<N>_vs_catedral_lab.png y _juego.png (la catedral a la izquierda, de la lámina del acto 2)."""
import sys
from PIL import Image
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
print('listo', L)
