# Arma, para un clip grabado, las tiras de cuadros seguidos recortadas alrededor del sujeto (por acción) y saca medidas:
# velocidad, cambios de rumbo, cuánto cambia la imagen en reposo, duración de cada acción.
import sys, json, glob, os
from PIL import Image, ImageDraw, ImageChops
DIR = '/tmp/requiem-pruebas/vid'
def tiras(nombre, quien='m', lado=150):
    d = json.load(open(f'{DIR}/{nombre}.json')); caja = d['caja']; dat = d['datos']
    fs = sorted(glob.glob(f'{DIR}/{nombre}/*.jpg'))
    seg = []; ini = 0
    for i in range(1, len(dat) + 1):
        a = dat[i - 1][quien]; b = dat[i][quien] if i < len(dat) else None
        if b is None or a is None or (b['acc'], b['muerto']) != (a['acc'], a['muerto']):
            if a is not None: seg.append((a['acc'] + ('+muerto' if a['muerto'] else ''), ini, i))
            ini = i
    # juntar segmentos cortos repetidos y quedarse con uno largo por acción (y hasta dos de atacar)
    vistos = {}; elegidos = []
    for acc, a, b in seg:
        n = vistos.get(acc, 0)
        if b - a < 3: continue
        if n < (2 if acc in ('atacar', 'lanzar', 'especial') else 1): elegidos.append((acc, a, b)); vistos[acc] = n + 1
    filas = []
    for acc, a, b in elegidos:
        paso = 1 if acc in ('atacar', 'lanzar', 'especial', 'herido') or 'muerto' in acc or acc == 'morir' else 2
        # (la muerte entera: con los intermedios dura 0,8 s, 1,3 el jefe; 16 cuadros la cortaban)
        idx = list(range(a, b, paso))[:36 if 'muerto' in acc or acc == 'morir' else 16]
        filas.append((acc, a, b, idx))
    L = Image.new('RGB', (max([16] + [len(f[3]) for f in filas]) * lado, len(filas) * (lado + 12)), (16, 16, 16)); dr = ImageDraw.Draw(L)
    for r, (acc, a, b, idx) in enumerate(filas):
        dr.text((3, r * (lado + 12)), f'{nombre} {acc} cuadros {a}-{b} ({(b - a) / 25:.2f}s) paso {idx[1] - idx[0] if len(idx) > 1 else 1}', fill=(255, 220, 120))
        for c, i in enumerate(idx):
            q = dat[i][quien]; im = Image.open(fs[i]); cx = q['p'][0] - caja['x']; cy = q['p'][1] - caja['y'] - lado * 0.3
            L.paste(im.crop((int(cx - lado / 2), int(cy - lado / 2), int(cx + lado / 2), int(cy + lado / 2))), (c * lado, r * (lado + 12) + 12))
    L.save(f'{DIR}/tira_{nombre}.png')
    # medidas
    med = {'clip': nombre, 'acciones': {}}
    for acc, a, b in seg: med['acciones'].setdefault(acc, []).append(round((b - a) / 25, 2))
    cam = [dat[i][quien] for i in range(len(dat)) if dat[i][quien] and dat[i][quien]['acc'] in ('caminar', 'correr') and not dat[i][quien]['muerto']]
    if len(cam) > 6:
        dist = sum(((cam[i]['x'] - cam[i - 1]['x']) ** 2 + (cam[i]['y'] - cam[i - 1]['y']) ** 2) ** 0.5 for i in range(1, len(cam)))
        med['vel_casillas_s'] = round(dist / (len(cam) / 25), 2)
        med['cambios_rumbo_por_s'] = round(sum(1 for i in range(1, len(cam)) if cam[i]['dir'] != cam[i - 1]['dir']) / (len(cam) / 25), 2)
    # reposo: cuánto cambia la imagen del sujeto de un cuadro al siguiente
    qu = [i for i in range(1, len(dat)) if dat[i][quien] and dat[i][quien]['acc'] == 'quieto' and dat[i - 1][quien] and dat[i - 1][quien]['acc'] == 'quieto' and not dat[i][quien]['muerto']]
    if len(qu) > 8:
        difs = []
        for i in qu[:40]:
            q = dat[i][quien]; cx = q['p'][0] - caja['x']; cy = q['p'][1] - caja['y'] - 40; bx = (int(cx - 40), int(cy - 50), int(cx + 40), int(cy + 50))
            a_ = Image.open(fs[i]).crop(bx).convert('L'); b_ = Image.open(fs[i - 1]).crop(bx).convert('L')
            h = ImageChops.difference(a_, b_).point(lambda v: 255 if v > 24 else 0).histogram(); difs.append(h[255] / (80 * 100))
        med['reposo_cambio_pct'] = round(100 * sum(difs) / len(difs), 2); med['reposo_cuadros_quietos_pct'] = round(100 * sum(1 for v in difs if v < 0.002) / len(difs))
    return med
if __name__ == '__main__':
    out = []
    for n in sys.argv[1:]:
        try: out.append(tiras(n, 'h' if n.startswith('heroe') else 'm', 170 if n.startswith('jefe') else 150))
        except Exception as e: out.append({'clip': n, 'error': str(e)[:120]})
    print(json.dumps(out))
