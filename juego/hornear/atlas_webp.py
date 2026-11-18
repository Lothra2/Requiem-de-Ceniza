#!/usr/bin/env python3
"""Pasa los atlas PNG del manifiesto a WebP: los de personajes (h_, m_, b_, j_, n_, r_) con pérdida a calidad 92 y el
alfa exacto, el resto sin pérdida. Con la clave baja los PNG crecieron tanto (de 289 a 344 MB el juego entero) que no
entraba en el tope de 256 MB del artifact; así queda en ~175 MB. Actualiza manifiesto.json y borra los PNG.
Correr después de cada horneado: python3 juego/hornear/atlas_webp.py"""
import json, os
from concurrent.futures import ProcessPoolExecutor
from PIL import Image

D = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets')

def convertir(archivo):
    src = os.path.join(D, archivo); dst = src[:-4] + '.webp'
    im = Image.open(src)
    # (los f_, el andar de los monstruos en los rumbos intermedios, iban sin pérdida por descuido: 34 MB que son 12)
    # (el relieve, normales y altura, va SIN pérdida: Rick no quiere bajar nada. De la altura el shader lee R, G y A;
    # B no lo usa nadie y se pone en cero, que no cambia nada en pantalla y pesa menos)
    if archivo[:-4].endswith('_h'):
        r, g, b, a = im.convert('RGBA').split()
        Image.merge('RGBA', (r, g, b.point(lambda v: 0), a)).save(dst, 'WEBP', lossless=True, method=6)
    elif archivo[:-4].endswith('_n'): im.save(dst, 'WEBP', lossless=True, method=6)
    elif os.path.basename(archivo)[:2] in ('h_', 'm_', 'b_', 'j_', 'n_', 'r_', 'f_', 'g_'): im.save(dst, 'WEBP', quality=90, alpha_quality=100, method=5)
    else: im.save(dst, 'WEBP', lossless=True, method=4)
    a, b = os.path.getsize(src), os.path.getsize(dst)
    os.remove(src)
    return archivo, a, b

if __name__ == '__main__':
    man = json.load(open(os.path.join(D, 'manifiesto.json')))
    tablas = [man['atlas']] + ([man['rel']] if 'rel' in man else [])
    pend = [v[0] for t in tablas for v in t.values() if v[0].endswith('.png') and os.path.exists(os.path.join(D, v[0]))]
    antes = despues = 0
    with ProcessPoolExecutor() as ex:
        for archivo, a, b in ex.map(convertir, pend): antes += a; despues += b
    for v in (v for t in tablas for v in t.values()):
        if v[0].endswith('.png') and not os.path.exists(os.path.join(D, v[0])) and os.path.exists(os.path.join(D, v[0][:-4] + '.webp')): v[0] = v[0][:-4] + '.webp'
    json.dump(man, open(os.path.join(D, 'manifiesto.json'), 'w'), separators=(',', ':'))
    print(len(pend), 'atlas a WebP:', round(antes / 1e6, 1), 'MB ->', round(despues / 1e6, 1), 'MB')
