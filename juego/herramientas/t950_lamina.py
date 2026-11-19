# Lámina del HUD forjado: por aparato, la barra de antes y el HUD nuevo lado a lado (vida baja, un poder en recarga),
# y debajo los recortes ampliados del nuevo: orbes, cinturón y casillas de poder (con el destello de listo).
# Uso: python3 juego/herramientas/t950_lamina.py <antes> <despues> [vistas]   (salida /tmp/requiem-pruebas/hud/lamina_hud.png)
import json, sys, os
from PIL import Image, ImageDraw, ImageFont

D = '/tmp/requiem-pruebas/hud'
ANT, DES = sys.argv[1], sys.argv[2]
VS = (sys.argv[3] if len(sys.argv) > 3 else 'pc,pc1080,ultra,ipad,movil,pctactil').split(',')
NOMBRE = {'pc': 'PC 1280x720', 'pc1080': 'PC 1920x1080 nativo', 'ultra': 'Ultrawide 2560x1080', 'ipad': 'iPad 1024x768', 'movil': 'Teléfono 844x390', 'pctactil': 'PC con pantalla táctil'}
try:
    F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 22); f2 = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 16)
except Exception:
    F = f2 = ImageFont.load_default()
ANCHO = 1900

def caja(js, img, r):
    L = js['L']; vw = L['l'] * 2 + L['W'] * L['k']; s = img.width / vw
    return [int((L['l'] + r[0] * L['k']) * s), int((L['t'] + r[1] * L['k']) * s), int((L['l'] + (r[0] + r[2]) * L['k']) * s), int((L['t'] + (r[1] + r[3]) * L['k']) * s)]

def union(cs, m=6):
    cs = [c for c in cs if c]
    if not cs: return None
    return [min(c[0] for c in cs) - m, min(c[1] for c in cs) - m, max(c[2] for c in cs) + m, max(c[3] for c in cs) + m]

def ajustar(im, w):
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS if w < im.width else Image.NEAREST)

def zoom(im, c, alto):
    q = im.crop(c); k = max(1, round(alto / q.height)); return q.resize((q.width * k, q.height * k), Image.NEAREST), k

filas = []
for v in VS:
    pa, pd = f'{D}/{ANT}_{v}_baja.png', f'{D}/{DES}_{v}_baja.png'
    if not os.path.exists(pd): continue
    a = Image.open(pa).convert('RGB') if os.path.exists(pa) else None
    d = Image.open(pd).convert('RGB'); js = json.load(open(f'{D}/{DES}_{v}.json'))
    w2 = (ANCHO - 30) // 2
    fila = Image.new('RGB', (ANCHO, 40), (16, 13, 11))
    dr = ImageDraw.Draw(fila); dr.text((10, 8), NOMBRE.get(v, v), font=F, fill=(240, 210, 140))
    dr.text((10 + w2 + 10, 12), 'antes  |  después (HUD forjado)', font=f2, fill=(200, 180, 140))
    ia = ajustar(a, w2) if a else Image.new('RGB', (w2, 10)); idd = ajustar(d, w2)
    par = Image.new('RGB', (ANCHO, max(ia.height, idd.height) + 10), (16, 13, 11)); par.paste(ia, (10, 0)); par.paste(idd, (20 + w2, 0))
    # recortes ampliados del nuevo
    r, h = js.get('rects') or {}, js.get('hudT') or {}
    cs = {}
    if r.get('orbeVida'):
        cs['orbe de vida'] = union([caja(js, d, r['orbeVida'])], 40); cs['orbe de maná'] = union([caja(js, d, r['orbeMana'])], 40)
        cs['cinturón'] = union([caja(js, d, r[f'poc{i}']) for i in range(4)], 14)
        cs['poderes y atajos'] = union([caja(js, d, r['habIzq'])] + [caja(js, d, r[f'rap{i}']) for i in range(5)], 8)
    else:
        if h.get('casaVida'): cs['orbe de vida'] = union([caja(js, d, h['casaVida'])], 4)
        if h.get('cinturon'): cs['cinturón'] = union([caja(js, d, h['cinturon'])], 20)
        ks = [k for k in ('golpe', 'poder', 'hab1', 'hab2', 'hab3', 'agresivo') if h.get(k)]
        if ks: cs['rueda de acción'] = union([caja(js, d, h[k]) for k in ks] + ([caja(js, d, h['casaMana'])] if h.get('casaMana') else []), 30)
    zs = []
    for nom, c in cs.items():
        if not c: continue
        c = [max(0, c[0]), max(0, c[1]), min(d.width, c[2]), min(d.height, c[3])]
        z, k = zoom(d, c, 300 if v not in ('movil',) else 360)
        if z.width > ANCHO - 20: z = ajustar(z, ANCHO - 20)
        zs.append((f'{nom} ×{k}', z))
    # el destello de listo y el poder del pozo, si hay
    pl = f'{D}/{DES}_{v}_listo.png'
    if os.path.exists(pl) and r.get('rap1'):
        li = Image.open(pl).convert('RGB'); c = union([caja(js, li, r['rap0']), caja(js, li, r['rap2'])], 10)
        z, k = zoom(li, c, 160); zs.append((f'destello al quedar listo ×{k}', z))
    filas_z = []; x = 10; fz = Image.new('RGB', (ANCHO, 10), (16, 13, 11)); cur = []
    for nom, z in zs:
        if x + z.width > ANCHO - 10 and cur: filas_z.append(cur); cur = []; x = 10
        cur.append((nom, z, x)); x += z.width + 14
    if cur: filas_z.append(cur)
    bloques = [fila, par]
    for cur in filas_z:
        hh = max(z.height for _, z, _ in cur) + 30
        b = Image.new('RGB', (ANCHO, hh), (16, 13, 11)); db = ImageDraw.Draw(b)
        for nom, z, x in cur: b.paste(z, (x, 26)); db.text((x, 4), nom, font=f2, fill=(200, 180, 140))
        bloques.append(b)
    filas.append(bloques)
alto = sum(b.height for bl in filas for b in bl) + 20 * len(filas)
out = Image.new('RGB', (ANCHO, alto), (16, 13, 11)); y = 0
for bl in filas:
    for b in bl: out.paste(b, (0, y)); y += b.height
    y += 20
out.save(f'{D}/lamina_hud.png'); print('lamina', out.size, f'{D}/lamina_hud.png')
