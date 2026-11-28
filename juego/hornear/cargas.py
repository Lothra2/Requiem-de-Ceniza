"""Las pantallas de carga de cada acto, en pixel: la carta del acto achicada a 400 x 225, con su paleta corta (24 colores
sacados de la carta) y trama Bayer 4 x 4 entre tono y tono, como pixel pintado a mano. Sin suavizar: el juego la agranda a
puntos enteros. Correr: python3 juego/hornear/cargas.py (unos segundos)."""
from PIL import Image
import numpy as np, os
R = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'portada')
W, H, N = 400, 225, 24
B = np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]) / 16.0 - 0.47
for n in range(1, 8):
    im = Image.open(os.path.join(R, 'cartas', f'acto_{n}.webp')).convert('RGB')
    # se recorta un poco abajo (la franja de la narración de la carta) y se achica con buen filtro
    cw, ch = im.size; im = im.crop((0, 0, cw, int(ch * 0.94))).resize((W, H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32)
    # un pelo más de contraste y la sombra más honda (el pixel vive del contraste)
    a = np.clip((a - 10) * 1.12, 0, 255)
    pal = Image.fromarray(a.astype(np.uint8)).quantize(colors=N, method=Image.MEDIANCUT).getpalette()[: N * 3]
    P = np.array(pal, dtype=np.float32).reshape(N, 3)
    # trama ordenada: a cada punto se le corre el color según la matriz y se busca el más cercano de la paleta
    yy, xx = np.mgrid[0:H, 0:W]
    a2 = a + (B[yy % 4, xx % 4] * 26.0)[..., None]
    d = ((a2[:, :, None, :] - P[None, None, :, :]) ** 2).sum(-1)
    out = P[d.argmin(-1)].astype(np.uint8)
    Image.fromarray(out).save(os.path.join(R, 'carga', f'acto_{n}.png'))
    Image.fromarray(out).save(os.path.join(R, 'carga', f'acto_{n}.webp'), lossless=True)
    os.remove(os.path.join(R, 'carga', f'acto_{n}.png'))
    print(n, 'ok')
