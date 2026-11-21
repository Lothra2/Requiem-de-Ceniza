#!/usr/bin/env python3
"""Cosas debajo de la pared (lo llama t1015_tapados.mjs con el volcado de las zonas).

Por cada adorno mira, punto por punto con la máscara del primer cuadro horneado, cuánto le pisa un muro que se pinta
DESPUÉS de él (el orden de escena.ts: `prof`, y a igual `prof` el que vino después en la lista) aunque el adorno esté
delante de ese muro (su huella queda más allá en y o en x, sin quedar detrás en el otro eje) o metido en su huella.
Eso es lo que Rick vio como "cofres debajo de las paredes". Lo que está de verdad detrás del muro y se tapa no cuenta.

Imprime por familia, por zona y por capa, guarda resumen.json y los recortes de los peores (la escena pintada con los
atlas de verdad sobre un piso gris, el adorno marcado) y sale con 1 si queda alguno tapado.
"""
import json, os, sys, math
from collections import defaultdict
import numpy as np
from PIL import Image, ImageDraw

ARCH, DIR = sys.argv[1], sys.argv[2]
ASSETS = os.environ.get('ASSETS', os.path.join(os.path.dirname(__file__), '..', 'public', 'assets'))
RECORTES = int(os.environ.get('RECORTES', '16'))
MIN_PX = int(os.environ.get('MIN_PX', '30'))       # puntos tapados para contar (menos es un canto que roza)
MIN_FR = float(os.environ.get('MIN_FR', '0.04'))   # y fracción del adorno
man = json.load(open(os.path.join(ASSETS, 'manifiesto.json')))['o']
zonas = json.load(open(ARCH))

import re
MURO = re.compile(r'muro|muralla|nichos|pared_toba|esquina|almena|reja|tapia|cerca_piedra')
NO_VICTIMA = re.compile(r'escombro|muro|muralla|almena|penasco|risco|nichos|reja|puerta|porton|escalera|portal|piedra_viaje|borde|puente|riel|^via|isla|rio_|arroyo|dec_escalon|^casa_|esquina|macizo|pared_toba')

atlas = {}
def img(nombre):
    if nombre not in atlas:
        atlas[nombre] = Image.open(os.path.join(ASSETS, nombre + '.webp')).convert('RGBA')
    return atlas[nombre]
mascaras = {}
def cuadro(id_, v):
    k = id_ + '|' + v
    m = man.get(k)
    if not m or not m.get('f'): return None
    if k not in mascaras:
        f = m['f'][0]
        a = img(f[0]).crop((f[1], f[2], f[1] + f[3], f[2] + f[4]))
        mascaras[k] = (a, np.asarray(a)[:, :, 3] >= 250, f[5], f[6])
    return mascaras[k]

def ancla(o):  # punto de pantalla del ancla (aPant(cx + 0.5, cy + 0.5) sin la cámara)
    return ((o['cx'] - o['cy']) * 16, (o['cx'] + o['cy'] + 1) * 8)
def huella(o):
    x0 = math.floor(o['cx'] - (o['hw'] - 1) / 2 + 0.5); y0 = math.floor(o['cy'] - (o['hh'] - 1) / 2 + 0.5)
    return x0, x0 + o['hw'] - 1, y0, y0 + o['hh'] - 1
def caja(o):
    c = cuadro(o['id'], o['v'])
    if not c: return None
    sx, sy = ancla(o); _, mk, ax, ay = c
    return (sx - ax, sy - ay, sx - ax + mk.shape[1], sy - ay + mk.shape[0])

def relacion(o, w):
    ox0, ox1, oy0, oy1 = huella(o); wx0, wx1, wy0, wy1 = huella(w)
    if wy0 > oy1 or wx0 > ox1: return 'detras'          # el muro está delante: tapar es lo justo
    if oy0 > wy1 or ox0 > wx1: return 'delante'         # el adorno está delante: el muro no tiene que taparlo
    return 'metido'                                      # las huellas se pisan

ENTEROS = bool(os.environ.get('ENTEROS'))  # el orden de antes: el muro entero con la profundidad de su punta de adelante
def jsround(v): return math.floor(v + 0.5)
def tiras(o):
    """Las franjas de `franjasDe` (render/escena.ts): (desde, hasta, prof) en x del cuadro."""
    a, mk, ax, ay = cuadro(o['id'], o['v']); w = mk.shape[1]
    L, C = max(o['hw'], o['hh']), min(o['hw'], o['hh'])
    if ENTEROS or o['plano'] or L < 3 or C * 2 > L or o['prof'] < -1e5 or o.get('nofranja'): return [(0, w, o['prof'])]
    enX = o['hw'] > o['hh']
    a0 = jsround(o['cx'] - (o['hw'] - 1) / 2) if enX else jsround(o['cy'] - (o['hh'] - 1) / 2)
    out = []
    for k in range(L):
        c = ax + (a0 + k - o['cx']) * 16 if enX else ax + (o['cy'] - a0 - k) * 16
        izq = k == 0 if enX else k == L - 1; der = k == L - 1 if enX else k == 0
        x0 = 0 if izq else max(0, jsround(c - 8)); x1 = w if der else min(w, jsround(c + 8))
        if x1 <= x0: continue
        out.append((x0, x1, (a0 + k + o['cy'] + (1 + o['hh']) / 2 if enX else o['cx'] + a0 + k + (o['hw'] + 1) / 2) - 1 - 0.1))
    return out if len(out) > 1 else [(0, w, o['prof'])]

def despues(w, o, prof=None):
    p = w['prof'] if prof is None else prof
    return p > o['prof'] or (p == o['prof'] and w['i'] > o['i'])

def familia(z):
    if z['tipo'] == 'pueblo': return 'pueblo'
    if z['tipo'] == 'exterior': return 'exterior'
    return 'mazmorra'

casos = []
por_zona = defaultdict(int); por_capa = defaultdict(int); por_fam = defaultdict(int); por_pieza = defaultdict(int)
victimas_total = defaultdict(int)
for z in zonas:
    objs = z['objs']
    muros = [o for o in objs if not o['plano'] and MURO.search(o['id']) and (o['bloq'] or o['id'] == 'muro_esquina') and cuadro(o['id'], o['v'])]
    if not muros: continue
    cajasM = [(w, caja(w)) for w in muros]
    for o in objs:
        if o['plano'] or NO_VICTIMA.search(o['id']) or o['capa'] == 'relleno': continue
        c = caja(o)
        if not c: continue
        victimas_total[familia(z)] += 1
        _, mk, ax, ay = cuadro(o['id'], o['v'])
        tapa = np.zeros_like(mk)
        quien = []
        for w, cw in cajasM:
            if cw[2] <= c[0] or cw[0] >= c[2] or cw[3] <= c[1] or cw[1] >= c[3]: continue
            rel = relacion(o, w)
            if rel == 'detras': continue
            _, mw, _, _ = cuadro(w['id'], w['v'])
            mw = mw.copy()
            for (ta, tb, tp) in tiras(w):
                if not despues(w, o, tp): mw[:, ta:tb] = False
            if not mw.any(): continue
            # la parte común de las dos cajas
            x0, y0, x1, y1 = max(c[0], cw[0]), max(c[1], cw[1]), min(c[2], cw[2]), min(c[3], cw[3])
            sub = mw[y0 - cw[1]:y1 - cw[1], x0 - cw[0]:x1 - cw[0]]
            antes = tapa.sum()
            tapa[y0 - c[1]:y1 - c[1], x0 - c[0]:x1 - c[0]] |= sub
            if tapa.sum() > antes: quien.append((w, rel))
        n = int((tapa & mk).sum()); tot = int(mk.sum())
        if n >= MIN_PX and n / max(1, tot) >= MIN_FR:
            casos.append({'zona': z['id'], 'sem': z['sem'], 'fam': familia(z), 'id': o['id'], 'v': o['v'], 'capa': o['capa'] or o['tag'] or '(sin capa)',
                          'cx': o['cx'], 'cy': o['cy'], 'px': n, 'fr': round(n / tot, 3), 'muros': [(w['id'], w['v'], w['cx'], w['cy'], r) for w, r in quien]})
            por_zona[z['id']] += 1; por_capa[o['capa'] or o['tag'] or '(sin capa)'] += 1; por_fam[familia(z)] += 1; por_pieza[o['id']] += 1

def pintar(z, caso, ruta):
    """La escena de alrededor pintada en el orden del juego, con el adorno tapado marcado."""
    objs = z['objs']
    cx, cy = caso['cx'], caso['cy']
    sx, sy = (cx - cy) * 16, (cx + cy + 1) * 8
    W, H = 420, 340
    ox, oy = sx - W // 2, sy - H // 2 - 50
    lienzo = Image.new('RGBA', (W, H), (58, 56, 54, 255))
    d = ImageDraw.Draw(lienzo)
    for x in range(cx - 16, cx + 17):  # rejilla del piso
        for y in range(cy - 16, cy + 17):
            px, py = (x - y) * 16 - ox, (x + y) * 8 - oy
            d.polygon([(px, py), (px + 16, py + 8), (px, py + 16), (px - 16, py + 8)], outline=(72, 70, 67, 255))
    cerca = [o for o in objs if abs(o['cx'] - cx) + abs(o['cy'] - cy) < 30 and cuadro(o['id'], o['v'])]
    piezas = []
    for o in cerca:
        for (ta, tb, tp) in tiras(o): piezas.append((tp, o['i'], o, ta, tb))
    piezas.sort(key=lambda p: (p[0], p[1]))
    for tp, _, o, ta, tb in piezas:
        a, mk, ax, ay = cuadro(o['id'], o['v'])
        px, py = ancla(o)
        t = a.crop((ta, 0, tb, a.size[1]))
        lienzo.paste(t, (int(px - ax - ox + ta), int(py - ay - oy)), t)
    # el contorno del adorno tapado, encima de todo
    for o in cerca:
        if o['cx'] == cx and o['cy'] == cy and o['id'] == caso['id']:
            a, mk, ax, ay = cuadro(o['id'], o['v'])
            px, py = ancla(o)
            borde = mk & ~np.roll(mk, 1, 0) | mk & ~np.roll(mk, -1, 0) | mk & ~np.roll(mk, 1, 1) | mk & ~np.roll(mk, -1, 1)
            ys, xs = np.nonzero(borde)
            for x, y in zip(xs, ys):
                X, Y = x + px - ax - ox, y + py - ay - oy
                if 0 <= X < W and 0 <= Y < H: lienzo.putpixel((int(X), int(Y)), (255, 40, 40, 255))
    lienzo = lienzo.resize((W * 2, H * 2), Image.NEAREST)
    ImageDraw.Draw(lienzo).text((6, 6), f"{caso['zona']} {caso['sem']} {caso['id']}|{caso['v']} ({caso['capa']}) {caso['px']} px {int(caso['fr'] * 100)} %", fill=(255, 255, 255, 255))
    lienzo.convert('RGB').save(ruta)

print(f"\nAdornos tapados por un muro que se pinta delante: {len(casos)} (de {sum(victimas_total.values())} adornos con sprite)")
for f in sorted(victimas_total): print(f"  {f:9s} {por_fam[f]:5d} de {victimas_total[f]}")
print('Por capa: ' + ', '.join(f'{k} {v}' for k, v in sorted(por_capa.items(), key=lambda x: -x[1])))
print('Por pieza: ' + ', '.join(f'{k} {v}' for k, v in sorted(por_pieza.items(), key=lambda x: -x[1])[:25]))
print('Por zona: ' + ', '.join(f'{k} {v}' for k, v in sorted(por_zona.items(), key=lambda x: -x[1])[:40]))
json.dump({'casos': casos, 'porCapa': por_capa, 'porZona': por_zona, 'porPieza': por_pieza, 'total': len(casos)}, open(os.path.join(DIR, 'resumen.json'), 'w'), indent=1)
zid = {(z['id'], z['sem']): z for z in zonas}
peores = sorted(casos, key=lambda c: -c['px'])
# los peores, pero sin repetir pieza y capa (así se ve cada clase de error)
vistos, elegidos = set(), []
for c in peores:
    k = (c['id'], c['capa'])
    if k in vistos: continue
    vistos.add(k); elegidos.append(c)
    if len(elegidos) >= RECORTES: break
os.makedirs(os.path.join(DIR, 'recortes'), exist_ok=True)
for k, c in enumerate(elegidos):
    pintar(zid[(c['zona'], c['sem'])], c, os.path.join(DIR, 'recortes', f'{k:02d}_{c["zona"]}_{c["id"]}.png'))
    print(f"  recorte {k:02d}: {c['zona']} {c['sem']} {c['id']}|{c['v']} capa {c['capa']} en {c['cx']},{c['cy']}: {c['px']} px ({int(c['fr'] * 100)} %) por {c['muros'][:2]}")
# los nichos secretos de la obra (el cofre `escondido` de una mazmorra): cómo se leen desde la sala (NICHOS=n recortes)
nn = int(os.environ.get('NICHOS', '0'))
if nn:
    k = 0
    for z in zonas:
        if z['tipo'] != 'mazmorra': continue
        for o in z['objs']:
            if o['id'] == 'cofre_noble' and o['capa'] == 'escondido' and k < nn:
                pintar(z, {'zona': z['id'], 'sem': z['sem'], 'id': o['id'], 'v': o['v'], 'capa': 'nicho', 'cx': o['cx'], 'cy': o['cy'], 'px': 0, 'fr': 0}, os.path.join(DIR, 'recortes', f'nicho_{k:02d}_{z["id"]}.png'))
                k += 1
print('FALLA: quedan tapados' if casos else 'tapados: 0')
sys.exit(1 if casos else 0)
