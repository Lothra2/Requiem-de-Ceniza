# La portada de pixel fino: Santa Oria abandonada, bajo un cielo de gas.
# Hornea las capas de la escena (1920 x 816; la pantalla ve un trozo de unos 960 x 540 en el medio, agrandado por enteros:
# 2 x 2 en 1080) y las lleva a una paleta de abandono (grises ocres, verdes de moho, óxido, hueso) con trama Bayer.
# Las nubes son gas de verdad: densidad con el dominio torcido y la luz que la atraviesa hacia el sol tapado (barriga
# oscura, canto encendido). Delante, el árbol de la horca con sus ahorcados, las urracas, el camposanto y la niebla.
# Antes: W=560 H=600 X=300 Y=520 ALTO=470 SS=3 npx tsx juego/hornear/portada_pixel/catedral.mts
# Uso: python3 juego/hornear/portada_pixel/pixel.py   -> juego/public/assets/portada/pixel/*.png y escena.json
import os, json, math
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(AQUI, '..', '..', 'public', 'assets', 'portada', 'pixel')
TMP = os.environ.get('TMP_CAT', '/tmp/requiem-pixel/')
os.makedirs(SAL, exist_ok=True)
for f in os.listdir(SAL):
  if f.endswith('.png'): os.remove(os.path.join(SAL, f))
SW, SH = 1920, 816                     # la escena entera
OX, OY = 480, 138                      # lo de abajo se diseña en la vista de 960 x 540: todo va corrido esto
VW, VH = 960, 540

# ------------------------------------------------------------------ la paleta del abandono
PAL = np.array([
  # gris pardo (0..13)
  (7, 8, 9), (11, 12, 13), (15, 16, 17), (20, 21, 21), (26, 27, 26), (33, 34, 32), (41, 41, 38), (50, 50, 45),
  (61, 60, 53), (74, 72, 62), (89, 86, 73), (106, 101, 85), (125, 118, 99), (146, 138, 115),
  # moho (14..19)
  (19, 23, 21), (26, 32, 28), (35, 43, 37), (46, 56, 47), (60, 70, 58), (78, 88, 72),
  # ocre y óxido (20..27)
  (40, 30, 20), (58, 41, 25), (80, 55, 30), (104, 70, 36), (128, 88, 44), (152, 110, 58), (176, 136, 80), (198, 164, 108),
  # pizarra fría (28..32)
  (21, 23, 29), (30, 33, 41), (41, 45, 56), (56, 60, 73), (75, 80, 94),
  # hueso (33..36)
  (168, 160, 140), (192, 185, 164), (216, 210, 190), (236, 234, 222),
  # sangre vieja (37..41)
  (38, 10, 10), (60, 14, 12), (90, 20, 14), (124, 30, 16), (162, 46, 20),
  # fuego (42..48)
  (58, 26, 10), (94, 42, 14), (136, 68, 20), (182, 106, 32), (222, 154, 62), (246, 204, 118), (255, 238, 188),
  # piedra fría a la luna (49..57)
  (10, 11, 14), (16, 18, 23), (24, 27, 34), (34, 38, 47), (46, 51, 62), (61, 67, 80), (80, 87, 101), (104, 111, 125), (136, 143, 156),
  # piedra que toca el fuego (58..63)
  (34, 20, 14), (56, 32, 18), (86, 50, 26), (122, 72, 34), (162, 100, 46), (204, 136, 64),
  # vitral (64..70): plomo, sangre, rubí, ámbar, oro, violeta hondo, azul hondo
  (18, 12, 12), (96, 16, 16), (156, 30, 22), (214, 118, 36), (244, 184, 86), (78, 26, 58), (32, 40, 84),
  # luna (71..76)
  (52, 56, 64), (82, 86, 94), (118, 122, 128), (158, 160, 164), (196, 198, 198), (228, 228, 224),
], np.float32)
FRIA = list(range(49, 58)); CALIDA = list(range(58, 64)); VITRAL = list(range(64, 71)); LUNAP = list(range(71, 77))
GRIS = list(range(0, 14)); MOHO = list(range(14, 20)); OCRE = list(range(20, 28)); PIZ = list(range(28, 33))
HUESO = list(range(33, 37)); SANGRE = list(range(37, 42)); FUEGO = list(range(42, 49))
BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16


def bayer(h, w, x0=0, y0=0):
  ys_, xs_ = np.mgrid[0:h, 0:w]
  return BAYER[(ys_ + y0) % 4, (xs_ + x0) % 4]


def cuantizar(rgb, trama=7.0, sub=None):
  h, w, _ = rgb.shape
  P = PAL if sub is None else PAL[sub]
  v = rgb + (bayer(h, w)[..., None] - 0.5) * trama
  flat = v.reshape(-1, 3); out = np.empty_like(flat)
  pesos = np.array([0.3, 0.59, 0.11]) * 3
  for i in range(0, len(flat), 131072):
    q = flat[i:i + 131072]
    d = ((q[:, None, :] - P[None, :, :]) ** 2 * pesos).sum(-1)
    out[i:i + 131072] = P[d.argmin(1)]
  return out.reshape(h, w, 3)


def rampa(v, idx, trama=0.9):
  """v en 0..1 (h, w) a los colores de la rampa `idx` (de oscuro a claro), con trama ordenada entre escalón y escalón:
  así se sombrea en pixel art (bandas limpias del mismo tono), no con el color más cercano de toda la paleta."""
  h, w = v.shape
  n = len(idx)
  q = np.clip(v, 0, 1) * (n - 1) + (bayer(h, w) - 0.5) * trama
  i = np.clip(np.round(q), 0, n - 1).astype(int)
  return PAL[np.array(idx)][i]


def alfa_trama(a, niveles=4):
  h, w = a.shape
  return np.clip(np.floor(a * niveles + bayer(h, w)) / niveles, 0, 1)


def guardar(nombre, rgb, a=None):
  rgb = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
  if a is None: Image.fromarray(rgb, 'RGB').save(os.path.join(SAL, nombre), optimize=True)
  else:
    al = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, al]), 'RGBA').save(os.path.join(SAL, nombre), optimize=True)


def sat(x): return np.clip(x, 0, 1)
def lerp(a, b, t): return a + (b - a) * t


# ------------------------------------------------------------------ ruido de valor en coordenadas cualquiera (empalma en x)
_G = {}
def grilla(sem, n=256):
  if sem not in _G: _G[sem] = np.random.default_rng(sem).random((n, n)).astype(np.float32)
  return _G[sem]


def ruido(x, y, sem, per):
  """x, y en celdas; per = cuántas celdas tiene una vuelta en x (para que empalme)."""
  g = grilla(sem)
  ix, iy = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
  fx, fy = x - ix, y - iy
  fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
  x0, x1 = ix % per, (ix + 1) % per
  y0, y1 = iy % 256, (iy + 1) % 256
  a, b, c, d = g[y0, x0 % 256], g[y0, x1 % 256], g[y1, x0 % 256], g[y1, x1 % 256]
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy


def fbm2(x, y, celda, sem, oct=5, sx=1.0, billow=False):
  """x, y en puntos de la escena; la celda más grande mide `celda` de alto y `celda * sx` de ancho."""
  s = np.zeros_like(x, dtype=np.float32); amp, tot = 0.5, 0.0
  for o in range(oct):
    k = 2 ** o
    per = max(1, int(round(SW / (celda * sx) * k)))
    n = ruido(x / SW * per, y / celda * k, sem + o * 31, per)
    if billow and o >= 1: n = 1 - np.abs(2 * n - 1)
    s += amp * n; tot += amp; amp *= 0.5
  return s / tot


ys, xs = np.mgrid[0:SH, 0:SW].astype(np.float32)
VXS, VYS = xs - OX, ys - OY                     # en coordenadas de la vista de diseño

# ------------------------------------------------------------------ dónde va cada cosa (en la vista de diseño)
SOL = (204, 82)                                  # la luna, entre el gas
LUNA_R = 24
CAT = (440, -48)                                 # esquina de la caja de 560 x 600 de la catedral
GRI_A, GRI_B = (812, 22), (948, 92)              # la grieta, chica y casi cerrada, en un claro de nubes
ARBOL = (58, 492)                                # el pie del árbol de la horca
CUELGAN = [(132, 0, 28), (198, 0, 42), (264, 0, 32)]   # x de la soga, y de la rama, largo de la soga
CAMINANTE_X = 520


def dv(x, y): return (x + OX, y + OY)          # de la vista de diseño a la escena


def trazar(a, b, sem, rug=0.12, niveles=6):
  pts = [np.array(a, float), np.array(b, float)]
  r = np.random.default_rng(sem)
  for nivel in range(niveles):
    nuevo = [pts[0]]
    for p, q in zip(pts[:-1], pts[1:]):
      m = (p + q) / 2; d = q - p; n = np.array([-d[1], d[0]]) / (np.hypot(*d) + 1e-6)
      m = m + n * r.normal(0, np.hypot(*d) * (rug * 0.5 if nivel < 2 else rug * 1.5))
      nuevo += [m, q]
    pts = nuevo
  return np.array(pts)


def dist_poli(pts, X, Y):
  d = np.full(X.shape, 1e9, np.float32); t = np.zeros(X.shape, np.float32)
  L = np.r_[0, np.cumsum(np.hypot(*(np.diff(pts, axis=0).T)))]
  for i in range(len(pts) - 1):
    p, q = pts[i], pts[i + 1]; v = q - p; ll = (v ** 2).sum() + 1e-9
    u = np.clip(((X - p[0]) * v[0] + (Y - p[1]) * v[1]) / ll, 0, 1)
    dd = np.hypot(X - p[0] - u * v[0], Y - p[1] - u * v[1])
    m = dd < d; d = np.where(m, dd, d); t = np.where(m, (L[i] + u * np.sqrt(ll)) / L[-1], t)
  return d, t


GRIETA = trazar(dv(*GRI_A), dv(*GRI_B), 31, 0.1, 5)


# ------------------------------------------------------------------ el cielo: cubierto, ocre gris, con el sol tapado
def cielo():
  v = sat(VYS / 470)
  arriba, medio, abajo = np.array([9, 10, 13]), np.array([24, 27, 32]), np.array([54, 56, 58])
  c = lerp(arriba, medio, sat(v / 0.6)[..., None])
  c = lerp(c, abajo, (sat((v - 0.6) / 0.4) ** 1.4)[..., None])
  sx, sy = dv(*SOL)
  ds = np.hypot(xs - sx, ys - sy)
  # el aire que alumbra la luna: una corona fina pegada al disco y un velo ancho y suave
  c += np.array([44, 48, 56]) * np.exp(-np.maximum(0, ds - LUNA_R) / 14)[..., None] * 0.9
  c += np.array([30, 33, 40]) * np.exp(-ds / 170)[..., None]
  d, t = dist_poli(GRIETA, xs, ys)
  c += np.array([40, 6, 8]) * np.exp(-d / 22)[..., None]
  c *= (0.94 + 0.1 * fbm2(xs, ys, 300, 5, 4, 2.0))[..., None]
  rgb = cuantizar(c, 5, GRIS + PIZ + FRIA)
  ancho = 0.4 + 2.2 * np.sin(np.pi * np.clip(t, 0, 1)) ** 1.4
  rgb[d < ancho + 1.4] = PAL[37]
  rgb[d < ancho + 0.6] = PAL[38]
  rgb[d < ancho] = PAL[40]
  rgb[(d < ancho * 0.45) & (ancho > 1.6)] = PAL[44]
  # la luna: la esfera de la portada vieja (mares, cráteres con relieve) a su tamaño, en plata fría y con el borde nítido
  n = LUNA_R * 2 + 1
  lu = Image.open(os.path.join(SAL, '..', 'fondo', 'luna.webp')).convert('RGBA').resize((n * 4, n * 4), Image.LANCZOS).resize((n, n), Image.BOX)
  la = np.asarray(lu).astype(np.float32)
  lum = la[..., :3].mean(-1) / 255
  lum = (lum - lum[la[..., 3] > 200].min()) / (np.ptp(lum[la[..., 3] > 200]) + 1e-6)
  al = la[..., 3] / 255
  yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
  rr = np.hypot(xx - LUNA_R, yy - LUNA_R) / LUNA_R
  dentro = rr <= 1.0
  # luz que viene de arriba a la derecha y el limbo que se oscurece apenas
  luz = sat(0.35 + 0.8 * lum) * (1 - 0.25 * rr ** 4) * sat(1.15 - 0.3 * ((LUNA_R - xx) / LUNA_R + (yy - LUNA_R) / LUNA_R) * 0.5)
  disco = rampa(luz, LUNAP, 0.7)
  y0, x0 = sy - LUNA_R, sx - LUNA_R
  zona = rgb[y0:y0 + n, x0:x0 + n]
  zona[dentro] = disco[dentro]
  return rgb


def grieta_luz():
  d, t = dist_poli(GRIETA, xs, ys)
  k = np.exp(-d / 12) * (0.4 + 0.6 * np.sin(np.pi * np.clip(t, 0, 1)))
  rgb = cuantizar(np.array([200, 46, 24]) * k[..., None], 10, [0] + SANGRE + FUEGO[:3])
  ancho = 0.4 + 2.2 * np.sin(np.pi * np.clip(t, 0, 1)) ** 1.4
  return rgb, alfa_trama(sat(k * 1.3), 3) * (k > 0.03) * (d > ancho + 1.5)


# ------------------------------------------------------------------ gas: nubes con volumen
def gas(sem, y0, y1, celda, cobertura, sx, oscuro, claro, fuerza_luz=1.0, nucleo=0.0, alfa_max=1.0):
  """Densidad de nube con el dominio torcido (las volutas), los bordes en coliflor y la luz que la atraviesa hacia el
  sol: lo que da al sol se enciende, la barriga queda oscura. Empalma en x."""
  qx = fbm2(xs, ys, celda * 1.3, sem + 1, 3, sx)
  qy = fbm2(xs, ys, celda * 1.3, sem + 2, 3, sx)
  wx, wy = xs + (qx - 0.5) * celda * sx * 1.6, ys + (qy - 0.5) * celda * 0.9
  D = fbm2(wx, wy, celda, sem, 6, sx, billow=True)
  banda = sat((ys - (y0 + OY)) / ((y1 - y0) * 0.35)) * sat(((y1 + OY) - ys) / ((y1 - y0) * 0.45))
  den = sat((D * (0.4 + 0.6 * banda) + banda * 0.15 - (1 - cobertura)) * 4.0) * (banda > 0.02)
  sx_, sy_ = dv(*SOL)
  # un claro alrededor del sol (por ahí asoma y bajan los rayos)
  den *= sat((np.hypot((xs - sx_) / 1.8, ys - sy_) - LUNA_R - 4) / 60) ** 0.7
  dirx, diry = sx_ - SW / 2, sy_ - (y0 + y1) / 2 - OY
  L = math.hypot(dirx, diry); dirx, diry = dirx / L, diry / L
  tapa = np.zeros_like(den)
  for i in range(1, 15):
    dx, dy = int(round(dirx * i * 3)), int(round(diry * i * 3))
    tapa += np.roll(np.roll(den, -dy, 0), -dx, 1) * (1 - i / 16)
  T = np.exp(-tapa * 0.62)
  ds = np.hypot(xs - sx_, ys - sy_)
  cerca = np.exp(-ds / 380)
  oscuro, claro = np.array(oscuro, np.float32), np.array(claro, np.float32)
  luz = sat(T * (0.35 + 0.9 * cerca) * fuerza_luz) ** 1.3
  c = lerp(oscuro, claro, luz[..., None])
  fino = sat(1 - den * 1.6) * (den > 0.05)
  c += np.array([70, 74, 80]) * (fino * T * cerca * 1.5)[..., None]
  c *= (1 - nucleo * sat(den - 0.6))[..., None]
  a = alfa_trama(sat(den * 1.25) * alfa_max, 4)
  return cuantizar(c, 5, GRIS + PIZ + FRIA), a


# ------------------------------------------------------------------ montes y el pueblo vacío
def montes():
  rgb = np.zeros((SH, SW, 3), np.float32); a = np.zeros((SH, SW), np.float32)
  X = np.arange(SW, dtype=np.float32)
  for base, alto, celda, sem, col, filo in [(398, 70, 240, 3, (40, 44, 50), (60, 64, 72)), (414, 44, 150, 8, (26, 28, 33), (44, 47, 54))]:
    p = fbm2(X[None, :], np.zeros((1, SW), np.float32) + sem * 7, celda, sem, 6, 1.0)[0]
    top = base + OY - alto * (p - 0.3)
    m = ys >= top[None, :]
    rgb[m] = col; a[m] = 1
    rgb[m & (ys < top[None, :] + 1.5)] = filo
  r = np.random.default_rng(5)
  x = 150 + OX
  while x < 420 + OX:
    ancho = int(r.integers(7, 16)); alto = int(r.integers(5, 13)); suelo = 424 + OY
    roto = r.random() < 0.4
    for xx in range(x, x + ancho):
      dentro = min(xx - x, x + ancho - 1 - xx)
      pico = suelo - alto - min(dentro, ancho // 2) * 0.9
      if roto and xx > x + ancho * 0.55: pico = suelo - alto + int(r.integers(0, 4))
      rgb[int(pico):suelo + 6, xx] = (20, 22, 26); a[int(pico):suelo + 6, xx] = 1
      rgb[int(pico), xx] = (44, 43, 39)
    if r.random() < 0.15:
      tx = x + ancho // 2
      for yy in range(suelo - alto - 26, suelo - alto + 1):
        rgb[yy, tx - 1:tx + 2] = (26, 26, 24); a[yy, tx - 1:tx + 2] = 1
      rgb[suelo - alto - 26, tx - 1:tx + 2] = (44, 43, 39)
    x += ancho + int(r.integers(0, 4))
  return cuantizar(rgb, 4), a


# ------------------------------------------------------------------ la catedral, a la paleta
def catedral():
  m = json.load(open(TMP + 'catedral.json')); w, h = m['w'], m['h']
  c = np.fromfile(TMP + 'catedral_capa.f32', np.float32).reshape(h, w, 4)
  n = np.fromfile(TMP + 'catedral_nit.f32', np.float32).reshape(h, w, 4)
  tie = np.fromfile(TMP + 'catedral_tierra.f32', np.float32).reshape(h, w)
  vid = np.fromfile(TMP + 'catedral_vid.f32', np.float32).reshape(h, w)
  A = np.maximum(c[..., 3], 1e-4)
  frio, cal, mat = c[..., 0] / A, c[..., 1] / A, c[..., 2] / A
  al = ((c[..., 3] > 0.5) & (tie < 0.5)).astype(np.float32)
  # la luz fría a la rampa de piedra (con una curva que abre los medios), lo alto se pierde un poco en la bruma
  vf = sat(frio * 4.2) ** 0.8
  yy = np.arange(h)[:, None] / h
  vf = vf * (0.72 + 0.28 * sat(yy / 0.35)) + 0.1 * sat((0.3 - yy) / 0.3)
  techo = (mat > 0.2) & (mat < 0.5)
  rgb = rampa(vf, FRIA, 0.85)
  rgb[techo] = rampa(vf * 0.75, FRIA[:7], 0.85)[techo]
  # donde gana el fuego de la puerta, la rampa cálida
  # el calor se apaga de a poco hacia arriba (la luz de la puerta no sube derecha por el hastial)
  px0, py0 = m['puerta']
  YYc, XXc = np.mgrid[0:h, 0:w].astype(np.float32)
  cae = np.exp(-np.maximum(0, py0 - YYc) / 34) * np.exp(-np.abs(XXc - px0) / 70)
  vc = sat(cal * 1.5 * cae) ** 1.15
  calido = rampa(sat(vc * 0.85 + vf * 0.3), CALIDA, 0.85)
  # cuánto gana el fuego: de 0 a 1 en tres escalones con trama (piedra, mitad y mitad, fuego)
  k = sat((vc - vf * 0.55) * 2.4)
  q = np.floor(k * 3 + bayer(h, w)) / 3
  mezcla = q[..., None]
  rgb = np.where(mezcla >= 0.99, calido, np.where(mezcla > 0.01, np.where((bayer(h, w) < q)[..., None], calido, rgb), rgb))
  # vitrales: el dibujo de los plomos del render con el color de cada paño llevado al vitral; un tercio rotos (negro)
  YY, XX = np.mgrid[0:h, 0:w].astype(np.float32)
  brillo = 0.45 + 0.75 * fbm2(XX * 2, YY * 2, 140, 77, 2)
  em = n[..., :3] * brillo[..., None]
  vrgb = cuantizar(np.power(np.clip(em * 1.45, 0, 1), 1 / 2.2) * 255, 4, VITRAL)
  esVid = vid > 0.15
  plomo = (c[..., 3] > 0.5) & (mat > 0.9) & ~esVid
  rgb[plomo] = PAL[64]
  rgb[esVid] = PAL[64]
  va = esVid.astype(np.float32)
  # el resplandor cálido: solo alrededor de la puerta y de los vitrales sanos (a trama, se suma y late)
  from PIL import ImageFilter
  hk = np.asarray(Image.fromarray((va * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(7))).astype(np.float32) / 255 * 0.7
  px, py = m['puerta']
  hk = np.maximum(hk, np.exp(-np.hypot(XX - px, (YY - py + 14) * 1.3) / 30) * 0.85)
  hrgb = cuantizar(np.array([190, 92, 32])[None, None, :] * np.ones((h, w, 1)) * np.clip(hk[..., None] * 1.2, 0, 1), 8, [0] + FUEGO[:5])
  ha = alfa_trama(sat(hk), 3) * (hk > 0.06)
  return rgb, al, vrgb, va, hrgb, ha, m, tie


def colina(m, tie):
  w, h = m['w'], m['h']
  cx, cy = dv(*CAT)
  perf = np.full(SW, np.nan)
  for x in range(w):
    col = np.where(tie[:, x] >= 0.5)[0]
    if len(col) and 0 <= cx + x < SW: perf[cx + x] = cy + col[0]
  ok = np.where(~np.isnan(perf))[0]; x0, x1 = ok[0], ok[-1]
  for x in range(SW):
    if x < x0: perf[x] = perf[x0] + ((x0 - x) / 90) ** 1.4 * 34
    elif x > x1: perf[x] = perf[x1] + (x - x1) * 0.05
  perf = np.minimum(perf, SH - 2)
  m_ = ys >= perf[None, :]
  px, py = cx + m['puerta'][0], cy + m['puerta'][1]
  calor = np.exp(-np.hypot(xs - px, (ys - py) * 1.6) / 80)
  tex = fbm2(xs, ys, 22, 61, 4)
  c = np.array([22, 22, 20]) + np.array([20, 19, 16]) * tex[..., None] + np.array([90, 48, 20]) * (calor * (0.5 + 0.5 * tex))[..., None]
  filo = m_ & ~np.roll(m_, 1, 0)
  c[filo] += np.array([30, 29, 24])
  rgb = cuantizar(c, 6); a = m_.astype(np.float32)
  return rgb, a


# ------------------------------------------------------------------ el primer plano: la colina de la horca y el camposanto
def frente():
  rgb = np.zeros((SH, SW, 3), np.float32); a = np.zeros((SH, SW), np.float32)
  NEG = np.array([10, 10, 10], np.float32)
  X0 = np.arange(SW) - OX
  p = fbm2(np.arange(SW, dtype=np.float32)[None, :], np.zeros((1, SW), np.float32), 260, 41, 5)[0]
  top = OY + 500 - 64 * np.exp(-((X0 - 90) / 250) ** 2) + 18 * (p - 0.5) + 26 * sat((X0 - 760) / 300)
  top += 14 * np.exp(-((X0 - 540) / 120) ** 2)
  m = ys >= top[None, :]
  rgb[m] = NEG; a[m] = 1
  tex = fbm2(xs, ys, 14, 88, 3)
  prof = ys - top[None, :]
  sube = sat(1 - prof / 22) * m
  rgb += (np.array([30, 28, 22]) * sube[..., None] * (0.5 + tex[..., None]))
  filo = m & ~np.roll(m, 1, 0)
  rgb[filo] = PAL[9]
  rgb[np.roll(filo, 1, 0) & m] = PAL[6]
  r = np.random.default_rng(12)
  for x in range(SW):
    for _ in range(2):
      if r.random() < 0.55:
        hgt = int(r.integers(1, 7)); y = int(top[x]); xx = x
        for k in range(hgt):
          yy = y - 1 - k
          if k > hgt * 0.5 and r.random() < 0.5: xx += 1
          if 0 < yy < SH and 0 <= xx < SW:
            rgb[yy, xx] = PAL[[6, 7, 21, 22, 8][int(r.integers(0, 5))]] if k >= hgt - 2 else NEG; a[yy, xx] = 1
  def px(x, y, col):
    x, y = int(round(x)), int(round(y))
    if 0 <= x < SW and 0 <= y < SH: rgb[y, x] = col; a[y, x] = 1
  def cruz(cx, alto, brazo, ladeo):
    cx += OX; base = int(top[cx]) + 3
    for k in range(alto):
      x = cx + ladeo * k; y = base - k
      for d in (0, 1, 2): px(x + d, y, NEG)
      px(x, y, PAL[9] if k < alto - 2 else PAL[11]); px(x + 2, y, PAL[4])
    yb = base - int(alto * 0.72); xb = cx + ladeo * alto * 0.72
    for xx in range(int(-brazo), int(brazo) + 3):
      for d in (0, 1): px(xb + xx, yb + d, NEG)
      px(xb + xx, yb, PAL[10])
  def lapida(cx, ancho, alto, ladeo):
    cx += OX; base = int(top[cx]) + 3
    for xi in range(-ancho // 2, ancho // 2 + 1):
      dx = abs(xi) / (ancho / 2 + 0.01)
      cima = base - alto + int(round((1 - math.sqrt(max(0, 1 - dx * dx))) * ancho * 0.45))
      for y in range(cima, base + 1): px(cx + xi + (base - y) * ladeo, y, NEG if xi > -ancho // 2 else PAL[5])
      px(cx + xi + (base - cima) * ladeo, cima, PAL[9] if xi < ancho // 3 else PAL[7])
    for xi in range(-ancho // 2, ancho // 2 + 1):
      if r.random() < 0.6: px(cx + xi, base - 1 - int(r.integers(0, 3)), PAL[[16, 17, 18][int(r.integers(0, 3))]])
  for (cx, alto, brazo, ladeo) in [(250, 30, 6, 0.08), (332, 22, 5, -0.12), (404, 16, 4, 0.14), (590, 13, 3, -0.06), (868, 40, 9, -0.05), (930, 26, 5, 0.1)]:
    cruz(cx, alto, brazo, ladeo)
  for (cx, an, al, la) in [(296, 12, 17, 0.05), (372, 9, 12, -0.08), (450, 7, 9, 0.1), (640, 6, 7, 0), (812, 14, 18, -0.04), (900, 10, 13, 0.06), (980, 8, 10, 0)]:
    lapida(cx, an, al, la)
  for i, x in enumerate(range(430, 560, 13)):
    if i in (3, 6): continue
    cx = x + OX; base = int(top[cx]) + 2; alto = 11 + int(r.integers(0, 5))
    for k in range(alto): px(cx + (k * 0.15 if i % 4 == 1 else 0), base - k, NEG); px(cx + 1, base - k, PAL[5])
    px(cx, base - alto, PAL[9])
  for x in range(430 + OX, 530 + OX):
    if 470 + OX < x < 500 + OX: continue
    px(x, int(top[x]) - 7 + (x % 9 == 0), NEG); px(x, int(top[x]) - 8, PAL[7])
  ramas = []
  def rama(x, y, ang, largo, grosor, prof, rr, guardar=False, recta=0.0):
    for s in range(int(largo)):
      ang += rr.normal(0, 0.06) * (1 - recta)
      x += math.cos(ang); y += math.sin(ang)
      g = max(0.0, grosor * (1 - s / largo * 0.65))
      gi = int(math.ceil(g))
      for dx in range(-gi, gi + 1):
        for dy in range(-gi, gi + 1):
          if dx * dx + dy * dy <= g * g + 0.5: px(x + dx, y + dy, NEG)
      px(x, y - g - 0.6, PAL[7] if g > 1 else PAL[6])
      if guardar: ramas.append((x, y - g))
      if prof > 0 and s > 8 and rr.random() < 0.045 + 0.01 * (4 - prof):
        rama(x, y, ang + rr.choice([-1, 1]) * rr.uniform(0.5, 1.0), largo * rr.uniform(0.3, 0.55), g * 0.6, prof - 1, rr)
    return x, y, ang
  ax, ay = ARBOL[0] + OX, ARBOL[1] + OY
  rr = np.random.default_rng(7)
  for ang in (-0.2, math.pi + 0.3, 0.4, math.pi - 0.5):
    rama(ax, ay - 2, ang, 18 + rr.integers(0, 14), 3.0, 0, rr)
  x, y, ang = rama(ax, ay, -math.pi / 2 + 0.07, 340, 12.5, 0, rr, recta=0.9)
  # la rama de la horca sale del tronco a media altura y corre casi derecha
  rama(ax + 10, ay - 340 * 0.86, -0.1, 250, 5.5, 2, np.random.default_rng(3), guardar=True, recta=0.85)
  rama(x, y, -math.pi / 2 - 0.3, 150, 6.0, 4, np.random.default_rng(11))
  rama(ax + 4, ay - 340 * 0.6, -math.pi + 0.45, 110, 4.0, 3, np.random.default_rng(17))
  rama(x + 1, y + 30, -0.9, 130, 4.0, 3, np.random.default_rng(19))
  rama(ax + 8, ay - 340 * 0.95, -0.6, 90, 3.0, 3, np.random.default_rng(23))
  rx = {}
  for (qx, qy) in ramas: rx.setdefault(int(round(qx)), int(round(qy)))
  return cuantizar(rgb, 3), a, top, rx


# ------------------------------------------------------------------ los ahorcados: cada uno con su soga, 10 cuadros de mecerse
def ahorcado(largo_soga, sem, alto=56):
  r = np.random.default_rng(sem)
  W_, H_ = 40, largo_soga + alto + 8
  cx = W_ // 2
  M = np.zeros((H_, W_), np.int8)   # 0 nada, 1 cuerpo, 2 soga, 3 piel
  for y in range(largo_soga + 4):
    M[y, cx] = 2
  y0 = largo_soga
  ladeo = int(r.choice([-1, 1]))
  for y in range(7):
    for x in range(-3, 4):
      if (x / 3.9) ** 2 + ((y - 3) / 4.2) ** 2 < 1: M[y0 + y, cx + x + ladeo * (y // 3)] = 1
  M[y0 + 1:y0 + 4, cx] = 2
  t0 = y0 + 7
  for y in range(alto - 7):
    k = y / (alto - 7)
    if k < 0.07: half = 1.5
    elif k < 0.16: half = 1.5 + (k - 0.07) / 0.09 * 6.5
    elif k < 0.55: half = 8.0 - (k - 0.16) * 4.5
    elif k < 0.62: half = 6.4 + r.random() * 2.2
    else: half = 0
    for x in range(-int(half), int(half) + 1): M[t0 + y, cx + x] = 1
    if k >= 0.6:
      for x in (-2, -1, 1, 2): M[t0 + y, cx + x] = 1
  for lado in (-1, 1):
    for y in range(int((alto - 7) * 0.5)):
      x = cx + lado * (7.5 + y * 0.05)
      M[t0 + 4 + y, int(round(x))] = 1; M[t0 + 4 + y, int(round(x)) - lado] = 1
    M[t0 + 4 + int((alto - 7) * 0.5):t0 + 7 + int((alto - 7) * 0.5), int(round(cx + lado * 9.2))] = 3
  for x in range(-6, 7):
    if r.random() < 0.4:
      for y in range(int(r.integers(1, 5))): M[t0 + int((alto - 7) * 0.6) + y, cx + x] = 1
  fy = t0 + alto - 9
  for x in (-2, -1, 1, 2): M[fy:fy + 2, cx + x] = 3
  def colorear(Mr):
    out = np.zeros(Mr.shape + (3,), np.float32); al = np.zeros(Mr.shape, np.float32)
    cuerpo = Mr == 1
    out[cuerpo] = PAL[2]; al[Mr > 0] = 1
    out[Mr == 2] = PAL[22]; out[Mr == 3] = PAL[11]
    izq = cuerpo & ~np.roll(cuerpo, 1, 1); arr = cuerpo & ~np.roll(cuerpo, 1, 0)
    out[izq] = PAL[6]; out[arr] = PAL[8]; out[izq & arr] = PAL[9]
    return out, al
  cuadros = []; N = 10
  for f in range(N):
    ang = 6 * math.sin(f / N * 2 * math.pi)
    im = Image.fromarray(M.astype(np.uint8) * 60)
    rot = np.asarray(im.rotate(ang, resample=Image.NEAREST, center=(cx, 0))) // 60
    cuadros.append(colorear(rot.astype(np.int8)))
  hoja = np.concatenate([c[0] for c in cuadros], 1); al = np.concatenate([c[1] for c in cuadros], 1)
  return hoja, al, W_, H_, N, cx


# ------------------------------------------------------------------ los ahorcados pintados por el motor
PZ = '/tmp/requiem-pixel/piezas/'
def pieza(n):
  m = {p['n']: p for p in json.load(open(PZ + 'piezas.json'))}[n]
  a = np.fromfile(PZ + n + '.f32', np.float32).reshape(m['h'], m['w'], 4)
  return a, m


def ahorcado_motor(n, largo, alto):
  """El cuerpo del motor (render de 260 de alto) con su soga, girado en alta para cada cuadro de mecerse y achicado a
  `alto` puntos; a contraluz (casi silueta, el filo del lado del sol tapado) y a la paleta."""
  a, m = pieza(n)
  h, w = a.shape[:2]
  k = alto / h
  L = int(round(largo / k))
  # dónde va la soga: lo más alto de la cabeza, en el medio de lo que hay arriba
  fila = np.where(a[..., 3].max(1) > 0.5)[0][0]
  cols = np.where(a[fila:fila + 6, :, 3].max(0) > 0.5)[0]; cx = int(cols.mean())
  W2 = int(w * 1.6); H2 = h + L + 10
  hoja = np.zeros((H2, W2, 4), np.float32)
  ox = W2 // 2 - cx
  hoja[L + 6:L + 6 + h, ox:ox + w] = a
  # la soga: de arriba al nudo, de unos 3 puntos del render (1 al achicar), con el nudo y el lazo que muerde
  for y in range(0, L + 6 + fila + 18):
    hoja[y, W2 // 2 - 4:W2 // 2 + 4] = [0.5, 0.38, 0.22, 1] if y < L + 6 + fila else hoja[y, W2 // 2 - 4:W2 // 2 + 4]
  hoja[L + 6 + fila - 10:L + 6 + fila + 4, W2 // 2 - 8:W2 // 2 + 8] = [0.42, 0.31, 0.18, 1]
  cuadros = []; N = 10
  for f in range(N):
    ang = 5.5 * math.sin(f / N * 2 * math.pi)
    im = Image.fromarray((np.clip(hoja, 0, 1) * 255).astype(np.uint8), 'RGBA')
    im = im.rotate(ang, resample=Image.BICUBIC, center=(W2 // 2, 0))
    ww, hh = max(2, int(round(W2 * k))), max(2, int(round(H2 * k)))
    im = im.resize((ww, hh), Image.LANCZOS)
    q = np.asarray(im).astype(np.float32)
    al = q[..., 3] / 255
    col = q[..., :3] / np.maximum(al[..., None], 1e-3)
    # a contraluz: el cuerpo se va a casi negro, queda el filo frío de arriba a la izquierda y la piel cerúlea
    lum = col.mean(-1, keepdims=True)
    soga = (col[..., 0] > col[..., 2] * 1.6) & (col[..., 0] > 90)
    col = np.where(soga[..., None], col * 0.62, col * 0.42 + lum * 0.1)
    m_ = al > 0.45
    izq = m_ & ~np.roll(m_, 1, 1); arr = m_ & ~np.roll(m_, 1, 0)
    col[izq] = col[izq] * 0.6 + np.array([70, 68, 58]) * 0.6
    col[arr] = col[arr] * 0.6 + np.array([86, 82, 70]) * 0.6
    rgb = cuantizar(col, 5, GRIS + OCRE + MOHO + HUESO[:1])
    cuadros.append((rgb, m_.astype(np.float32)))
  wq = max(c[0].shape[1] for c in cuadros); hq = max(c[0].shape[0] for c in cuadros)
  hoja2 = np.zeros((hq, wq * N, 3), np.float32); al2 = np.zeros((hq, wq * N), np.float32)
  for i, (r_, a_) in enumerate(cuadros): hoja2[:r_.shape[0], i * wq:i * wq + r_.shape[1]] = r_; al2[:a_.shape[0], i * wq:i * wq + a_.shape[1]] = a_
  return hoja2, al2, wq, hq, N, wq // 2


# ------------------------------------------------------------------ el pueblo abandonado (casas del catálogo en la bruma)
def pueblo():
  rgb = np.zeros((SH, SW, 3), np.float32); al = np.zeros((SH, SW), np.float32)
  niebla = np.array([62, 66, 72], np.float32)
  def poner(n, x, base, alto, bruma):
    a, m = pieza(n); h, w = a.shape[:2]; k = alto / h
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA').resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
    q = np.asarray(im).astype(np.float32); A = q[..., 3] / 255; C = q[..., :3] / np.maximum(A[..., None], 1e-3)
    C = lerp(C * 0.75, niebla, bruma)
    hh, ww = A.shape; X, Y = x + OX - ww // 2, base + OY - hh
    sub = (A > 0.5)
    rgb[Y:Y + hh, X:X + ww][sub] = C[sub]; al[Y:Y + hh, X:X + ww][sub] = 1
  for n, x, base, alto, b in [('granero', 300, 432, 44, 0.58), ('casa2', 352, 426, 50, 0.55), ('capilla', 420, 430, 54, 0.52),
                             ('casa1', 486, 436, 40, 0.5), ('atalaya', 540, 440, 60, 0.46)]:
    poner(n, x, base, alto, b)
  # el molino va aparte, girando (seis cuadros)
  hoja = []
  for f in range(6):
    a, m = pieza('molino' + str(f)); h, w = a.shape[:2]; k = 66 / h
    im = Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8), 'RGBA').resize((max(1, int(w * k)), max(1, int(h * k))), Image.LANCZOS)
    q = np.asarray(im).astype(np.float32); A = q[..., 3] / 255; C = q[..., :3] / np.maximum(A[..., None], 1e-3)
    C = lerp(C * 0.75, niebla, 0.6)
    hoja.append((cuantizar(C, 5, GRIS + OCRE + MOHO + PIZ), (A > 0.5).astype(np.float32)))
  return cuantizar(rgb, 5, GRIS + OCRE + MOHO + PIZ), al, hoja


# ------------------------------------------------------------------ urracas: posadas (3 cuadros) y en vuelo (4 cuadros)
# urraca de perfil mirando a la izquierda: n negro, g negro con brillo, a y A el azul verdoso del ala y la cola, b y s
# el blanco del vientre y los hombros (s en sombra), o el brillo del ojo, k el pico, p las patas
POSA = [
  "......nnn...............",
  ".....nnnnn..............",
  "....nonnnnn.............",
  "..kknnnnnnn.............",
  ".....nnnnnnn............",
  ".....nnnnnnng...........",
  "......nnnnnggnn.........",
  "......nbbnnggAbs........",
  "......bbbbnngAAnnn......",
  ".......bbbsnnaAAannA....",
  ".......nsnnnnnaAannnaA..",
  "........snnnn...nnnaAAa.",
  ".........p..p......naAAa",
  ".........p..p.......naAa",
  "........pp.pp........nAa",
  "......................na",
]
def _mueve(f, filas, cols, dy, dx=0):
  g = [list(r) for r in f]; h, w = len(g), len(g[0]); out = [['.'] * w for _ in range(h)]
  for y in range(h):
    for x in range(w):
      if g[y][x] == '.': continue
      if y in filas and x in cols: yy, xx = y + dy, x + dx
      else: yy, xx = y, x
      if 0 <= yy < h and 0 <= xx < w: out[yy][xx] = g[y][x]
  return ["".join(r) for r in out]
COLA = range(15, 24); CABEZA = range(0, 10)
URRACA_POSADA = [
  POSA,
  _mueve(POSA, range(9, 16), COLA, -3),            # sacude la cola
  _mueve(POSA, range(0, 6), CABEZA, 3, -1),        # picotea
  _mueve(POSA, range(0, 12), range(0, 24), 1),     # se agacha para saltar
]
URRACA_VUELO = [
  ["........bbs.................", ".......nbbs.................", "......nnbs..................", ".....nnnn...................",
   "..kknnnnnngbbnnAAaa.........", "....nonnnnbbbbnnn..aAAa.....", "......nnnnnnnn........aAa...", "...........................a"],
  ["............................", "............................", "......nnnnnn................", "....nnngbbbbn...............",
   "..kknnnnnbbbbbnnAAaa........", "....nonnnnbbbnnn...aAAa.....", "......nnnnnnn.........aAa...", "...........................a"],
  ["............................", "............................", "............................", ".....nnnnnn.................",
   "..kknnnnnnnnbbnnAAaa........", "....nonnnnbbbbnnn..aAAa.....", "......nnnbbs..........aAa...", "........nbbs...............a"],
  ["............................", "............................", "......nnnnnn................", "....nnngbbbbn...............",
   "..kknnnnnbbbbbnnAAaa........", "....nonnnnbbbnnn...aAAa.....", "......nnnnnnn.........aAa...", "...........................a"],
]
def urracas():
  COL = {'n': (12, 12, 14), 'g': (26, 32, 42), 'a': (34, 58, 70), 'A': (52, 92, 98), 'b': (226, 224, 214), 's': (160, 158, 150),
         'o': (120, 112, 96), 'k': (30, 30, 32), 'p': (20, 20, 22)}
  def hacer(frames, w, h):
    hoja = np.zeros((h, w * len(frames), 3), np.float32); al = np.zeros((h, w * len(frames)), np.float32)
    for i, f in enumerate(frames):
      for y, fila in enumerate(f):
        for x, ch in enumerate(fila):
          if ch in COL and x < w: hoja[y, i * w + x] = COL[ch]; al[y, i * w + x] = 1
    return hoja, al
  return hacer(URRACA_POSADA, 24, 16), hacer(URRACA_VUELO, 28, 8)


# ------------------------------------------------------------------ el caminante (de espaldas, la capa al viento)
def caminante():
  W_, H_, N = 26, 46, 6
  hoja = np.zeros((H_, W_ * N, 3), np.float32); al = np.zeros((H_, W_ * N), np.float32)
  CXc = 12.5
  for f in range(N):
    fase = f / N * 2 * math.pi; ox = f * W_
    yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32); X = xx - CXc
    M = (X / 3.7) ** 2 + ((yy - 8.5) / 4.5) ** 2 < 1
    M |= (yy > 3) & (yy < 9) & (X > 1) & (X < 3.8 + (9 - yy) * 0.5 + math.sin(fase) * 0.6) & (yy > 7.5 - (X - 1) * 0.9)
    k = np.clip((yy - 11) / 32, 0, 1)
    izq = -5 - k * 4 + np.sin(fase + k * 3) * 0.4 * k
    der = 4.8 + k * 6 + np.sin(fase + k * 4.2) * 2.1 * k + np.sin(fase * 2 + k * 7) * 0.7 * k
    M |= (yy >= 11) & (yy < 14) & (np.abs(X) < 4.4 + (yy - 11) * 0.3)
    M |= (yy >= 13) & (yy < 43) & (X >= izq) & (X <= der)
    M &= ~((yy >= 40) & (yy < 43) & (((xx.astype(int) + f) % 4) == 0) & (X > 1))
    M |= (yy >= 42) & (yy < 46) & (((X > -3.4) & (X < -0.8)) | ((X > 1) & (X < 3.6)))
    for t in np.linspace(0, 1, 34):
      ix, iy = int(round(CXc - 7.6 - t * 2.6)), int(round(24 + t * 20))
      if 0 <= ix < W_ and 0 <= iy < H_: M[iy, ix] = True
    sub = np.zeros((H_, W_, 3), np.float32); sub[M] = PAL[2]
    izqB = M & ~np.roll(M, 1, 1); arr = M & ~np.roll(M, 1, 0)
    sub[izqB] = PAL[6]; sub[arr] = PAL[8]
    hoja[:, ox:ox + W_] = sub; al[:, ox:ox + W_] = M
  return hoja, al, W_, H_, N


def rayos():
  """Los rayos que bajan del claro del sol hacia la derecha y abajo: franjas a trama que se abren en abanico."""
  sx, sy = dv(*SOL)
  ang = np.arctan2(ys - sy, xs - sx)
  d = np.hypot(xs - sx, ys - sy)
  f = fbm2(ang[..., None][..., 0] * 260, np.zeros_like(ang), 18, 909, 3, 1.0)
  haz = sat((f - 0.5) * 3.2) * sat((ang - 0.25) / 0.25) * sat((1.25 - ang) / 0.3)
  k = haz * sat(d / 60) * np.exp(-d / 520) * 0.9
  rgb = cuantizar(np.array([150, 138, 104])[None, None, :] * np.ones((SH, SW, 1)), 4, GRIS + OCRE)
  return rgb, alfa_trama(sat(k), 4)


def main():
  import time; t0 = time.time()
  def av(s): print(f'{time.time() - t0:5.1f}s', s, flush=True)
  av('cielo'); guardar('cielo.png', cielo())
  g, ga = grieta_luz(); guardar('grieta_luz.png', g, ga)
  av('gas alto'); n, na = gas(101, -40, 250, 120, 0.6, 3.2, (11, 12, 15), (150, 156, 164), 1.0, 0.35); guardar('gas_alto.png', n, na)
  av('montes'); mo, ma = montes(); guardar('montes.png', mo, ma)
  pu, pua, mol = pueblo(); guardar('pueblo.png', pu, pua)
  mw, mh = mol[0][0].shape[1], mol[0][0].shape[0]
  guardar('molino.png', np.concatenate([m[0] for m in mol], 1), np.concatenate([m[1] for m in mol], 1))
  av('gas bajo'); n, na = gas(202, 230, 420, 70, 0.5, 3.8, (15, 16, 19), (118, 124, 132), 0.9, 0.3, 0.92); guardar('gas_bajo.png', n, na)
  av('niebla'); n, na = gas(303, 380, 470, 40, 0.5, 5.0, (42, 45, 50), (92, 97, 104), 0.7, 0.0, 0.75); guardar('niebla.png', n, na)
  av('catedral'); c, ca, v, va, hl, ha, m, tie = catedral()
  guardar('catedral.png', c, ca); guardar('catedral_vidrios.png', v, va); guardar('catedral_halo.png', hl, ha)
  co, coa = colina(m, tie); guardar('colina.png', co, coa)
  av('niebla cerca'); n, na = gas(404, 430, 520, 30, 0.48, 6.0, (34, 36, 40), (80, 84, 90), 0.6, 0.0, 0.8); guardar('niebla_cerca.png', n, na)
  av('frente'); fr, fa, top, rx = frente(); guardar('frente.png', fr, fa)
  colgados = []
  for i, (x, yr, largo) in enumerate(CUELGAN):
    sx = x + OX
    ry = rx.get(sx, yr + OY)
    h, a, w_, h_, n_, cx = ahorcado_motor(f'ahorcado{i}', largo, 84 + i * 4)
    guardar(f'ahorcado{i}.png', h, a)
    colgados.append({'archivo': f'ahorcado{i}.png', 'x': sx - cx, 'y': ry, 'w': w_, 'h': h_, 'n': n_, 'fase': round(i * 1.7, 2), 'periodo': round(4.6 + i * 0.9, 2)})
  (up, upa), (uv, uva) = urracas(); guardar('urraca.png', up, upa); guardar('urraca_vuelo.png', uv, uva)
  cm, cma, cw, ch, cn = caminante(); guardar('caminante.png', cm, cma)
  perchas = []
  for x in (104, 164, 232, 300):
    sx = x + OX
    if sx in rx: perchas.append([sx, rx[sx] - 15, 1 if x % 2 else -1])
  for (cx, alto) in [(250, 30), (868, 40)]:
    perchas.append([cx + OX - 5, int(top[cx + OX]) + 3 - alto - 15, 1])
  cxw = CAMINANTE_X + OX
  cat = dv(*CAT)
  esc = {
    'w': SW, 'h': SH, 'vista': [OX, OY, VW, VH],
    'foco': [OX + VW // 2, OY + VH // 2, OX + 760],
    'catedral': {'x': cat[0], 'y': cat[1], 'w': m['w'], 'h': m['h'], 'puerta': [cat[0] + m['puerta'][0], cat[1] + m['puerta'][1]]},
    'sol': list(dv(*SOL)),
    'brasa': [list(dv(880, 36)), list(dv(912, 316))],
    'humo': list(dv(912, 300)),
    'colgados': colgados,
    'molino': {'x': 606 + OX - mw // 2, 'y': 444 + OY - mh, 'w': mw, 'h': mh, 'n': 6},
    'perchas': perchas,
    'caminante': {'x': cxw - cw // 2, 'y': int(top[cxw]) - ch + 2, 'w': cw, 'h': ch, 'n': cn},
    'capas': [
      {'archivo': 'cielo.png', 'par': 0.02},
      {'archivo': 'grieta_luz.png', 'par': 0.02, 'sumar': True, 'id': 'grieta'},
      {'archivo': 'gas_alto.png', 'par': 0.05, 'deriva': -3.0},
      {'archivo': 'montes.png', 'par': 0.1},
      {'archivo': 'pueblo.png', 'par': 0.12, 'id': 'pueblo'},
      {'archivo': 'gas_bajo.png', 'par': 0.14, 'deriva': -6.0},
      {'archivo': 'niebla.png', 'par': 0.2, 'deriva': 4.0},
      {'archivo': 'colina.png', 'par': 0.3},
      {'archivo': 'catedral.png', 'par': 0.3, 'x': cat[0], 'y': cat[1]},
      {'archivo': 'catedral_halo.png', 'par': 0.3, 'x': cat[0], 'y': cat[1], 'sumar': True, 'id': 'halo'},
      {'archivo': 'catedral_vidrios.png', 'par': 0.3, 'x': cat[0], 'y': cat[1], 'sumar': True, 'id': 'vidrios'},
      {'archivo': 'niebla_cerca.png', 'par': 0.45, 'deriva': 9.0, 'id': 'niebla_media'},
      {'archivo': 'frente.png', 'par': 1.0, 'id': 'frente'},
    ],
  }
  json.dump(esc, open(os.path.join(SAL, 'escena.json'), 'w'))
  av('listo')


if __name__ == '__main__':
  main()
