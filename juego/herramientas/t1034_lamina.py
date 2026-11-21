# Lámina de los peores casos de la entrega 6 (antes y después), a partir de las fotos de t1032_recorrido.cjs con
# PUNTOS=puntos_lamina.json. Uso: python3 juego/herramientas/t1034_lamina.py <antes> <ahora> [puntos.json]
# Salen /tmp/requiem-pruebas/e6/lamina_<n>.png con seis casos cada una (izquierda el antes, derecha el ahora).
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
antes, ahora = sys.argv[1], sys.argv[2]
P = json.load(open(sys.argv[3] if len(sys.argv) > 3 else '/tmp/requiem-pruebas/e6/puntos_lamina.json'))
R = '/tmp/requiem-pruebas/e6/recorrido'
try: F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 18)
except Exception: F = ImageFont.load_default()
casos = [(z, i, c) for z, L in P.items() for i, c in enumerate(L)]
W, H, T = 760, 386, 30  # cada foto: el mundo de 1280 x 650 achicado, sin la consola del HUD
for k in range(0, len(casos), 6):
    grupo = casos[k:k + 6]
    L = Image.new('RGB', (W * 2 + 12, len(grupo) * (H + T + 10)), (14, 12, 12))
    d = ImageDraw.Draw(L)
    for n, (z, i, c) in enumerate(grupo):
        y = n * (H + T + 10)
        d.text((8, y + 6), f"{k + n + 1}. {z}: {c.get('t', '')}", fill=(240, 210, 140), font=F)
        for col, et in enumerate([antes, ahora]):
            f = f"{R}/{et}/{z}_{i}_{c['q']}.png"
            if not os.path.exists(f): continue
            im = Image.open(f).convert('RGB').crop((0, 0, 1280, 650)).resize((W, H))
            L.paste(im, (col * (W + 12), y + T))
            d.text((col * (W + 12) + 8, y + T + 6), 'antes' if col == 0 else 'ahora', fill=(255, 255, 255), font=F)
    L.save(f'/tmp/requiem-pruebas/e6/lamina_{k // 6 + 1}.png')
    print(f'/tmp/requiem-pruebas/e6/lamina_{k // 6 + 1}.png')
