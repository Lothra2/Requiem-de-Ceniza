# Láminas de la vigilia (t1100_vigilia.cjs): los cuadros del reposo y del gesto recortados al héroe y al doble, la
# galería de cartas al doble y, si hay, antes y después lado a lado. Uso:
#   python3 juego/herramientas/t1100_lamina.py <etiqueta> [vista] [antes]
#   python3 juego/herramientas/t1100_lamina.py video <etiqueta> [vista]     (arma el mp4 de 25 por segundo con ffmpeg)
import sys, os, json, glob, subprocess
from PIL import Image, ImageDraw
D = '/tmp/requiem-pruebas/vigilia'
if sys.argv[1] == 'video':
    et, vista = sys.argv[2], (sys.argv[3] if len(sys.argv) > 3 else 'pc')
    src = f'{D}/{et}_{vista}_video'
    out = f'{D}/{et}_{vista}_vigilia.mp4'
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', '25', '-i', f'{src}/c%04d.png', '-vf', 'crop=trunc(iw/2)*2:trunc(ih/2)*2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', out], check=True)
    print(out); sys.exit()
et = sys.argv[1]; vista = sys.argv[2] if len(sys.argv) > 2 else 'pc'; antes = sys.argv[3] if len(sys.argv) > 3 else None
def caja(n):
    try: v = json.load(open(f'{D}/{et}_{vista}_{n}_info.json'))
    except Exception: return None
    x, y, w, h = v['css']; return (int(x), int(y), int(x + w), int(y + h))
for n in range(3):
    fs = sorted(glob.glob(f'{D}/{et}_{vista}_{n}_t*.png'))
    if not fs: continue
    c = caja(n) or (200, 180, 640, 560)
    tiras = [Image.open(f).convert('RGB').crop(c) for f in fs]
    w, h = tiras[0].size; Z = 2
    lam = Image.new('RGB', (w * Z * min(7, len(tiras)), h * Z * ((len(tiras) + 6) // 7)), (10, 8, 8))
    for i, t in enumerate(tiras): lam.paste(t.resize((w * Z, h * Z), Image.NEAREST), ((i % 7) * w * Z, (i // 7) * h * Z))
    lam.save(f'{D}/lam_{et}_{vista}_{n}.png'); print(f'{D}/lam_{et}_{vista}_{n}.png', lam.size)
# antes y después: la pantalla entera de cada héroe
if antes:
    for n in range(3):
        a, b = f'{D}/{antes}_{vista}_{n}_pant.png', f'{D}/{et}_{vista}_{n}_pant.png'
        if not (os.path.exists(a) and os.path.exists(b)): continue
        A, B = Image.open(a).convert('RGB'), Image.open(b).convert('RGB')
        L = Image.new('RGB', (A.width + B.width + 8, max(A.height, B.height)), (60, 50, 40)); L.paste(A, (0, 0)); L.paste(B, (A.width + 8, 0))
        L.save(f'{D}/ad_{antes}_{et}_{vista}_{n}.png'); print(f'{D}/ad_{antes}_{et}_{vista}_{n}.png')
