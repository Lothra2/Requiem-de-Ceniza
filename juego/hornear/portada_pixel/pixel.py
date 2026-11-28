# La portada de pixel: la noche en que cae la segunda brasa sobre Santa Oria.
# Hornea las capas de la escena a un punto por punto de la escena (960 x 480; la pantalla ve un trozo de unos 640 x 360
# en el medio, agrandado por enteros) y las lleva a una sola paleta con trama Bayer, como el título de fuego.
# Antes: npx tsx juego/hornear/portada_pixel/catedral.mts  (la catedral en flotantes, en /tmp/requiem-pixel)
# Uso: python3 juego/hornear/portada_pixel/pixel.py   -> juego/public/assets/portada/pixel/*.png y escena.json
import os, json, math
import numpy as np
from PIL import Image

AQUI = os.path.dirname(os.path.abspath(__file__))
SAL = os.path.join(AQUI, '..', '..', 'public', 'assets', 'portada', 'pixel')
TMP = os.environ.get('TMP_CAT', '/tmp/requiem-pixel/')
os.makedirs(SAL, exist_ok=True)
SW, SH = 1280, 544                     # la escena entera (alcanza para un teléfono acostado a un punto por punto)
OX, OY = 160, 32                       # lo de abajo se diseñó en 960 x 480: todo va corrido esto
VX, VY = 160 + OX, 60 + OY             # el trozo seguro de 640 x 360 empieza ahí
rng = np.random.default_rng(1666)

# ------------------------------------------------------------------ la paleta (una sola para toda la escena)
PAL = np.array([
  # noche
  (5, 5, 12), (9, 9, 21), (14, 13, 31), (20, 18, 42), (28, 25, 56), (38, 33, 71), (50, 43, 88), (66, 56, 106), (86, 74, 126),
  # piedra fría
  (18, 18, 27), (27, 27, 39), (38, 38, 53), (51, 52, 69), (67, 68, 88), (88, 90, 112), (114, 118, 142), (146, 152, 176), (182, 188, 208),
  # hueso y luna
  (206, 204, 210), (226, 222, 212), (246, 240, 222),
  # fuego
  (34, 13, 10), (58, 20, 12), (88, 30, 13), (128, 43, 15), (170, 66, 18), (206, 100, 28), (236, 144, 46), (251, 192, 94), (255, 234, 168),
  # la grieta
  (64, 7, 14), (108, 12, 20), (160, 22, 24), (214, 46, 30),
  # violeta de las nubes tocadas por la grieta
  (44, 22, 44), (68, 30, 56), (96, 38, 64), (128, 50, 70),
  # piedra que toca el fuego
  (58, 42, 42), (86, 62, 56), (120, 86, 70), (158, 116, 88),
], np.float32)
BAYER = (np.array([[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]], np.float32) + 0.5) / 16


def bayer(h, w, x0=0, y0=0):
  ys, xs = np.mgrid[0:h, 0:w]
  return BAYER[(ys + y0) % 4, (xs + x0) % 4]


def cuantizar(rgb, trama=14.0, sub=None):
  """rgb en 0..255 (h, w, 3). Trama ordenada y el color más cercano de la paleta (o de `sub`, índices)."""
  h, w, _ = rgb.shape
  P = PAL if sub is None else PAL[sub]
  v = rgb + (bayer(h, w)[..., None] - 0.5) * trama
  flat = v.reshape(-1, 3)
  out = np.empty_like(flat)
  for i in range(0, len(flat), 65536):
    q = flat[i:i + 65536]
    # distancia con peso perceptual simple (el verde pesa más)
    d = ((q[:, None, :] - P[None, :, :]) ** 2 * np.array([0.3, 0.59, 0.11]) * 3).sum(-1)
    out[i:i + 65536] = P[d.argmin(1)]
  return out.reshape(h, w, 3)


def alfa_trama(a, x0=0, y0=0):
  """El alfa en tres escalones (0, medio por trama, 1): lo blando de una nube o la niebla se lee en pixel."""
  h, w = a.shape
  b = bayer(h, w, x0, y0)
  return (a > b).astype(np.float32)


def guardar(nombre, rgb, a=None):
  rgb = np.clip(np.round(rgb), 0, 255).astype(np.uint8)
  if a is None:
    Image.fromarray(rgb, 'RGB').save(os.path.join(SAL, nombre), optimize=True)
  else:
    al = (np.clip(a, 0, 1) * 255).astype(np.uint8)
    Image.fromarray(np.dstack([rgb, al]), 'RGBA').save(os.path.join(SAL, nombre), optimize=True)


# ------------------------------------------------------------------ ruido que empalma en x
def ruido(h, w, celda, semilla, per_x=True, sx=1.0):
  r = np.random.default_rng(semilla)
  gw, gh = max(1, int(round(w / (celda * sx)))), int(math.ceil(h / celda)) + 2
  g = r.random((gh, gw)).astype(np.float32)
  ys, xs = np.mgrid[0:h, 0:w].astype(np.float32)
  fx, fy = xs / w * gw, ys / celda
  ix, iy = np.floor(fx).astype(int), np.floor(fy).astype(int)
  tx, ty = fx - ix, fy - iy
  tx, ty = tx * tx * (3 - 2 * tx), ty * ty * (3 - 2 * ty)
  x0, x1 = ix % gw, (ix + 1) % gw
  a, b, c, d = g[iy, x0], g[iy, x1], g[iy + 1, x0], g[iy + 1, x1]
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty


def fbm(h, w, celda, semilla, oct=5, sx=1.0):
  s, amp, tot = np.zeros((h, w), np.float32), 0.5, 0.0
  for o in range(oct):
    s += amp * ruido(h, w, celda / (2 ** o), semilla + o * 17, sx=sx)
    tot += amp; amp *= 0.5
  return s / tot


def perfil(w, celda, semilla, oct=5):
  return fbm(1, w, celda, semilla, oct)[0]


def lerp(a, b, t):
  return a + (b - a) * t


def sat(x):
  return np.clip(x, 0, 1)


ys, xs = np.mgrid[0:SH, 0:SW].astype(np.float32)

# ------------------------------------------------------------------ dónde va cada cosa (coordenadas de la escena)
CAT_X, CAT_Y = 484 + OX, 80 + OY                 # esquina de la caja de 300 x 300 de la catedral
LUNA = (236 + OX, 112 + OY, 15)                  # la luna, chica, arriba de los botones
# la grieta: de arriba a la derecha, rasgada, hacia la catedral
def trazar_grieta():
  a, b = np.array([662.0 + OX, 150.0 + OY]), np.array([1016.0 + OX, 6.0 + OY])
  pts = [a, b]
  r = np.random.default_rng(31)
  for nivel in range(6):
    nuevo = [pts[0]]
    for p, q in zip(pts[:-1], pts[1:]):
      m = (p + q) / 2
      d = q - p
      n = np.array([-d[1], d[0]]) / (np.hypot(*d) + 1e-6)
      m = m + n * r.normal(0, np.hypot(*d) * (0.07 if nivel < 2 else 0.2))
      nuevo += [m, q]
    pts = nuevo
  return np.array(pts)
GRIETA = trazar_grieta()


def dist_poli(pts, X, Y):
  d = np.full(X.shape, 1e9, np.float32)
  t = np.zeros(X.shape, np.float32)
  L = np.r_[0, np.cumsum(np.hypot(*(np.diff(pts, axis=0).T)))]
  for i in range(len(pts) - 1):
    p, q = pts[i], pts[i + 1]
    v = q - p; ll = (v ** 2).sum() + 1e-9
    u = np.clip(((X - p[0]) * v[0] + (Y - p[1]) * v[1]) / ll, 0, 1)
    dd = np.hypot(X - p[0] - u * v[0], Y - p[1] - u * v[1])
    m = dd < d
    d = np.where(m, dd, d); t = np.where(m, (L[i] + u * np.sqrt(ll)) / L[-1], t)
  return d, t


# ------------------------------------------------------------------ el cielo
def cielo():
  v = ys / SH
  arriba, medio, abajo = np.array([7, 7, 18]), np.array([18, 16, 40]), np.array([44, 36, 72])
  t1 = sat(v / 0.55)[..., None]; t2 = sat((v - 0.55) / 0.12)[..., None]
  c = lerp(lerp(arriba, medio, t1), abajo, t2 * 1.0)
  # el resplandor rojo de la grieta en el cielo
  d, t = dist_poli(GRIETA, xs, ys)
  ancho = np.clip(np.sin(np.pi * t), 0, 1) ** 0.7
  c += np.array([64, 8, 14]) * (np.exp(-d / (20 + 22 * ancho)) * (0.3 + 0.7 * ancho))[..., None]
  c += np.array([40, 10, 18]) * (np.exp(-d / 120) * 0.3)[..., None]
  # la luna enfría su cielo
  dl = np.hypot(xs - LUNA[0], ys - LUNA[1])
  c += np.array([30, 34, 52]) * np.exp(-dl / 70)[..., None] * 0.9
  # la ciudad que arde, lejos a la izquierda, tiñe el horizonte
  c += np.array([54, 18, 8]) * (np.exp(-np.hypot((xs - 330 - OX) / 220, (ys - 318 - OY) / 40)) * 0.8)[..., None]
  # bandas de nube lejana, muy suaves
  c *= (0.88 + 0.24 * fbm(SH, SW, 160, 5, 4))[..., None]
  rgb = cuantizar(c, 6)
  # estrellas tenues horneadas (las que titilan van en el json)
  r = np.random.default_rng(9)
  n = 900
  sx, sy = r.integers(0, SW, n), (r.random(n) ** 1.7 * (330 + OY)).astype(int)
  for x, y in zip(sx, sy):
    if np.hypot(x - LUNA[0], y - LUNA[1]) < LUNA[2] + 6: continue
    dd, _ = dist_poli(GRIETA, np.array([[x]], np.float32), np.array([[y]], np.float32))
    if dd[0, 0] < 14: continue
    k = r.random()
    base = rgb[y, x]
    rgb[y, x] = PAL[11] if k < 0.5 else PAL[13] if k < 0.85 else PAL[15]
    if k > 0.985 and 1 <= x < SW - 1 and 1 <= y < SH - 1:
      for ddx, ddy in ((1, 0), (-1, 0), (0, 1), (0, -1)): rgb[y + ddy, x + ddx] = PAL[12]
  # la luna: la esfera de la portada vieja, chica, en hueso frío
  lu = Image.open(os.path.join(SAL, '..', 'fondo', 'luna.webp')).convert('RGBA').resize((LUNA[2] * 2 + 1,) * 2, Image.LANCZOS)
  la = np.asarray(lu).astype(np.float32)
  lum = la[..., :3].mean(-1, keepdims=True) / 255
  frio = (np.array([150, 158, 182]) * lum ** 0.8 + np.array([60, 56, 64]) * lum ** 3)
  al = la[..., 3] / 255
  y0, x0 = LUNA[1] - LUNA[2], LUNA[0] - LUNA[2]
  zona = rgb[y0:y0 + frio.shape[0], x0:x0 + frio.shape[1]].astype(np.float32)
  mez = zona * (1 - al[..., None]) + frio * 1.25 * al[..., None]
  rgb[y0:y0 + frio.shape[0], x0:x0 + frio.shape[1]] = cuantizar(mez, 5)
  # la grieta: el cielo rasgado, con su labio rojo y el blanco de adentro
  # la herida: ancha en el medio, fina en las puntas; labio casi negro, carne roja y el blanco de adentro
  tt = np.clip(t, 0, 1)
  ancho = 0.5 + 4.6 * np.sin(np.pi * np.clip(tt * 0.85 + 0.15, 0, 1)) ** 1.3 * (0.8 + 0.4 * fbm(SH, SW, 9, 404, 2))
  rgb[d < ancho + 2.0] = PAL[30]
  rgb[d < ancho + 1.0] = PAL[32]
  rgb[d < ancho] = PAL[33]
  rgb[d < ancho * 0.68] = PAL[27]
  rgb[d < ancho * 0.4] = PAL[28]
  rgb[(d < ancho * 0.18) & (ancho > 2.8)] = PAL[29]
  # ramitas que se abren del tajo
  r = np.random.default_rng(77)
  for k in range(14):
    i = r.integers(6, len(GRIETA) - 6)
    p = GRIETA[i].copy(); ang = math.atan2(GRIETA[i + 1][1] - GRIETA[i - 1][1], GRIETA[i + 1][0] - GRIETA[i - 1][0]) + r.choice([-1, 1]) * r.uniform(0.6, 1.3)
    largo = r.uniform(6, 20)
    for s in range(int(largo)):
      ang += r.normal(0, 0.25)
      p = p + np.array([math.cos(ang), math.sin(ang)])
      x, y = int(p[0]), int(p[1])
      if 0 <= x < SW and 0 <= y < SH: rgb[y, x] = PAL[33] if s < largo * 0.3 else PAL[32] if s < largo * 0.6 else PAL[31]
  return rgb, d, t


# ------------------------------------------------------------------ la luz de la grieta que late (se suma)
def grieta_luz(d, t):
  ancho = np.clip(np.sin(np.pi * t), 0, 1) ** 0.7
  k = np.exp(-d / (9 + 10 * ancho)) * (0.4 + 0.6 * ancho)
  c = np.array([255, 70, 40]) * k[..., None]
  a = alfa_trama(sat(k * 1.4))
  rgb = cuantizar(c, 18, sub=[0, 21, 22, 23, 24, 25, 26, 30, 31, 32, 33])
  # el tajo mismo no se suma (lo quemaba a amarillo verdoso): solo el aire de alrededor
  ancho = 0.5 + 4.6 * np.sin(np.pi * np.clip(np.clip(t, 0, 1) * 0.85 + 0.15, 0, 1)) ** 1.3
  return rgb, a * (k > 0.02) * (d > ancho + 1.5)


# ------------------------------------------------------------------ nubes (empalman en x)
def nubes(semilla, y0, y1, celda, umbral, luz_grieta=1.0):
  """Bancos de nube de forma dura (como en el pixel de siempre): el cuerpo oscuro, el canto de arriba frío en dos
  escalones y la panza roja donde la toca la grieta. Empalman en x."""
  f = fbm(SH, SW, celda, semilla, 4, sx=7.0)
  g = fbm(SH, SW, celda * 0.5, semilla + 5, 3, sx=4.0)
  banda = sat((ys - y0) / 50) * sat((y1 - ys) / 70)
  forma = (f * 0.8 + g * 0.2) * banda
  M = forma > umbral
  # lejos de la luna (que va delante) y con los bordes sin pelusa: se quitan los puntos sueltos
  M &= np.hypot(xs - LUNA[0], ys - LUNA[1]) > LUNA[2] + 2
  vec = sum(np.roll(np.roll(M, dy, 0), dx, 1).astype(int) for dy in (-1, 0, 1) for dx in (-1, 0, 1))
  M &= vec >= 5
  arriba1 = M & ~np.roll(M, 1, 0)
  arriba2 = M & ~np.roll(M, 2, 0) & ~arriba1
  abajo1 = M & ~np.roll(M, -1, 0)
  abajo2 = M & ~np.roll(M, -2, 0) & ~abajo1
  d, _ = dist_poli(GRIETA, xs, ys)
  cerca = np.exp(-d / 130) * luz_grieta
  dl = np.exp(-np.hypot(xs - LUNA[0], ys - LUNA[1]) / 200)
  # cuán hondo dentro de la nube está cada punto, contando desde su canto de arriba
  prof = np.zeros((SH, SW), np.float32)
  for y in range(1, SH): prof[y] = np.where(M[y], prof[y - 1] + 1, 0)
  luzk = np.exp(-prof / 7)
  c = np.zeros((SH, SW, 3), np.float32)
  c[:] = np.array([13, 11, 27])
  c += (np.array([26, 24, 44]) + np.array([30, 32, 46]) * dl[..., None]) * luzk[..., None]
  c[arriba2] += np.array([16, 16, 26]) + np.array([20, 22, 34]) * dl[arriba2][:, None]
  c[arriba1] += np.array([30, 30, 48]) + np.array([60, 64, 84]) * dl[arriba1][:, None]
  c[abajo2] += np.array([70, 12, 22]) * cerca[abajo2][:, None]
  c[abajo1] += np.array([150, 26, 30]) * cerca[abajo1][:, None]
  c += np.array([44, 8, 18]) * (cerca * 0.6)[..., None]
  return cuantizar(c, 4), M.astype(np.float32)


# ------------------------------------------------------------------ los montes lejanos y la ciudad que arde
def montes():
  rgb = np.zeros((SH, SW, 3), np.float32); a = np.zeros((SH, SW), np.float32)
  fuegos = []
  for capa, (base, alto, celda, sem, col, filo) in enumerate([
      (300 + OY, 60, 300, 3, (34, 31, 58), (66, 62, 98)),
      (318 + OY, 34, 180, 8, (21, 19, 38), (48, 44, 74))]):
    p = perfil(SW, celda, sem, 6)
    top = base - alto * (p - 0.3)
    m = ys >= top[None, :]
    rgb[m] = col; a[m] = 1
    filo_m = m & (ys < top[None, :] + 1.5)
    rgb[filo_m] = filo
  # la ciudad: techos, torres y lo que arde, a la izquierda (lejos)
  r = np.random.default_rng(5)
  x = 238 + OX
  while x < 448 + OX:
    ancho = int(r.integers(5, 12)); alto = int(r.integers(4, 10))
    suelo = 322 + OY
    for xx in range(x, x + ancho):
      if xx >= SW: break
      pico = suelo - alto - (min(xx - x, x + ancho - xx) if r.random() < 0.6 else 0) * 0.8
      for yy in range(int(pico), suelo + 4): rgb[yy, xx] = (14, 12, 24); a[yy, xx] = 1
    if r.random() < 0.18:
      tx = x + ancho // 2
      for yy in range(suelo - alto - 16, suelo - alto + 1):
        anch = 1 if yy < suelo - alto - 9 else 2
        for xx in range(tx - anch, tx + anch + 1): rgb[yy, xx] = (14, 12, 24); a[yy, xx] = 1
    if r.random() < 0.45:
      for k in range(int(r.integers(1, 3))):
        wx, wy = x + int(r.integers(1, max(2, ancho - 1))), suelo - int(r.integers(1, max(2, alto - 1)))
        rgb[wy, wx] = PAL[26]; a[wy, wx] = 1
    if r.random() < 0.3: fuegos.append([int(x + ancho // 2), int(suelo - alto)])
    x += ancho + int(r.integers(0, 3))
  return cuantizar(rgb, 6), a, fuegos


# ------------------------------------------------------------------ la catedral, a paleta
def catedral():
  m = json.load(open(TMP + 'catedral.json')); w, h = m['w'], m['h']
  c = np.fromfile(TMP + 'catedral_capa.f32', np.float32).reshape(h, w, 4)
  n = np.fromfile(TMP + 'catedral_nit.f32', np.float32).reshape(h, w, 4)
  a = c[..., 3]
  tie = np.fromfile(TMP + 'catedral_tierra.f32', np.float32).reshape(h, w)
  col = c[..., :3] * 1.15 + n[..., :3] * 1.3
  col = col / (1 + col * 0.55)
  col = np.power(np.clip(col, 0, None), 1 / 2.2) * 255
  al = ((a > 0.5) & (tie < 0.5)).astype(np.float32)
  rgb = cuantizar(col, 7)
  # filo oscuro de una celda contra el cielo: la silueta se lee aunque la piedra y el cielo sean del mismo valor
  dentro = al > 0
  borde = dentro & ~(np.roll(dentro, 1, 0) & np.roll(dentro, -1, 0) & np.roll(dentro, 1, 1) & np.roll(dentro, -1, 1))
  osc = rgb[borde].mean(-1) < 110
  rgb[borde & np.zeros_like(borde)] = 0
  # los vidrios: por donde el fuego se ve (la portada los hace latir)
  vid = np.fromfile(TMP + 'catedral_vid.f32', np.float32).reshape(h, w)
  vrgb = cuantizar(np.power(np.clip(n[..., :3] * 1.6, 0, 1), 1 / 2.2) * 255, 10)
  va = (vid > 0.25).astype(np.float32)
  # el halo de la puerta y los vitrales, por trama
  from PIL import ImageFilter
  halo = Image.fromarray((np.clip(n[..., 0] * 255 * 2, 0, 255)).astype(np.uint8)).filter(ImageFilter.GaussianBlur(9))
  hk = np.asarray(halo).astype(np.float32) / 255
  px, py = m['puerta']
  hk = np.maximum(hk, np.exp(-np.hypot(*(np.mgrid[0:h, 0:w][::-1] - np.array([px, py - 10])[:, None, None])) / 28) * 0.9)
  hrgb = cuantizar(np.array([230, 96, 30])[None, None, :] * np.ones((h, w, 1)) * np.clip(hk[..., None] * 1.4, 0, 1), 20)
  ha = alfa_trama(sat(hk * 1.1)) * (hk > 0.06)
  return rgb, al, vrgb, va, hrgb, ha, m


# ------------------------------------------------------------------ niebla del valle (empalma en x)
def niebla(semilla, y0, y1, k):
  f = fbm(SH, SW, 90, semilla, 4)
  banda = sat((ys - y0) / 18) * sat((y1 - ys) / 26)
  den = sat((f * banda - 0.18) * 2.2) * k
  c = np.array([40, 40, 70])[None, None, :] * np.ones((SH, SW, 1))
  c += np.array([40, 16, 10]) * sat((xs - 260) / 200 * 0 + np.exp(-np.abs(xs - 330 - OX) / 160))[..., None] * 0.6
  return cuantizar(c, 10), alfa_trama(den * 0.85)


# ------------------------------------------------------------------ el primer plano: camposanto, árbol y la colina
def frente():
  rgb = np.zeros((SH, SW, 3), np.float32); a = np.zeros((SH, SW), np.float32)
  NEG = np.array([7, 6, 12], np.float32)
  # la colina de la izquierda (debajo de los botones) y el suelo de abajo
  p = perfil(SW, 220, 41, 5)
  X0 = np.arange(SW) - OX
  top = 372 + OY - 40 * np.exp(-((X0 - 170) / 210) ** 2) + 14 * (p - 0.5) + 30 * sat((X0 - 640) / 260)
  top += 22 * np.exp(-((X0 - 440) / 90) ** 2)     # el valle del medio, donde mira el caminante
  m = ys >= top[None, :]
  rgb[m] = NEG; a[m] = 1
  # el filo: frío del lado de la luna, cálido hacia la catedral
  filo = m & ~np.roll(m, 1, 0)
  fx = np.arange(SW)
  frio = (fx < 520 + OX)[None, :] & filo
  rgb[frio] = PAL[12]; rgb[filo & ~frio] = PAL[40]
  rgb[np.roll(filo, 1, 0) & m & (fx < 520 + OX)[None, :]] = PAL[10]
  # pasto: briznas de una celda sobre el filo
  r = np.random.default_rng(12)
  for x in range(SW):
    if r.random() < 0.55:
      hgt = int(r.integers(1, 4)); y = int(top[x])
      for k in range(hgt):
        yy = y - 1 - k
        if yy > 0: rgb[yy, x] = NEG if k else (PAL[10] if x < 520 + OX else PAL[39]); a[yy, x] = 1
  # cruces y lápidas
  def cruz(cx, base, alto, brazo, ladeo, cálido=False):
    for k in range(alto):
      x = int(round(cx + ladeo * k)); y = base - k
      for xx in (x, x + 1):
        rgb[y, xx] = NEG; a[y, xx] = 1
      rgb[y, x] = PAL[40] if cálido else PAL[12]
    yb = base - int(alto * 0.72); xb = int(round(cx + ladeo * alto * 0.72))
    for xx in range(xb - brazo, xb + brazo + 2):
      for yy in (yb, yb + 1): rgb[yy, xx] = NEG; a[yy, xx] = 1
      rgb[yb, xx] = PAL[40] if cálido else PAL[12]
  def lapida(cx, base, ancho, alto, cálido=False):
    for x in range(cx - ancho // 2, cx + ancho // 2 + 1):
      dx = abs(x - cx) / (ancho / 2 + 0.01)
      cima = base - alto + int(round((1 - math.sqrt(max(0, 1 - dx * dx))) * ancho * 0.4))
      for y in range(cima, base + 1): rgb[y, x] = NEG; a[y, x] = 1
      rgb[cima, x] = PAL[40] if cálido else PAL[12]
    lado = cx + ancho // 2 if cálido else cx - ancho // 2
    for y in range(base - alto + 3, base + 1): rgb[y, lado] = PAL[40] if cálido else PAL[11]
  for (cx, alto, brazo, ladeo) in [(110, 24, 5, 0.06), (196, 17, 4, -0.1), (258, 13, 3, 0.12), (342, 10, 3, -0.05)]:
    cx += OX; cruz(cx, int(top[cx]) + 2, alto, brazo, ladeo)
  for (cx, an, al) in [(150, 9, 12), (226, 7, 9), (300, 6, 7), (380, 5, 6)]:
    cx += OX; lapida(cx, int(top[cx]) + 2, an, al)
  for (cx, alto, brazo, ladeo) in [(842, 30, 7, -0.04), (904, 18, 4, 0.08)]:
    cx += OX; cruz(cx, int(top[cx]) + 3, alto, brazo, ladeo, True)
  for (cx, an, al) in [(790, 10, 13), (872, 8, 10), (760, 6, 7)]:
    cx += OX; lapida(cx, int(top[cx]) + 2, an, al, True)
  # el árbol muerto que enmarca a la izquierda
  def rama(x, y, ang, largo, grosor, prof, r):
    for s in range(int(largo)):
      ang += r.normal(0, 0.08)
      x += math.cos(ang); y += math.sin(ang)
      g = max(0, int(round(grosor * (1 - s / largo * 0.6))))
      for dx in range(-g, g + 1):
        xx, yy = int(round(x + dx)), int(round(y))
        if 0 <= xx < SW and 0 <= yy < SH: rgb[yy, xx] = NEG; a[yy, xx] = 1
      ix, iy = int(round(x - g - 1)), int(round(y))
      if 0 <= ix < SW and 0 <= iy < SH and grosor > 0.4 and a[iy, ix] == 0: rgb[iy, ix] = PAL[11]; a[iy, ix] = 1
      if prof > 0 and s > 6 and r.random() < 0.05 + 0.012 * (4 - prof):
        rama(x, y, ang + r.choice([-1, 1]) * r.uniform(0.45, 0.95), largo * r.uniform(0.35, 0.6), grosor * 0.55, prof - 1, r)
  r = np.random.default_rng(int(os.environ.get('ARBOL', 23)))
  rama(172.0 + OX, float(top[172 + OX]) + 4, -math.pi / 2 - 0.22, 165, 4.2, 4, r)
  return cuantizar(rgb, 4), a, top


# ------------------------------------------------------------------ el caminante (de espaldas, con la capa al viento)
def caminante():
  """Seis cuadros de 34 x 58: alguien con capucha, de espaldas, mira la catedral desde el valle. La capa y la punta de
  la capucha ondean (el viento viene de la izquierda) y lleva la espada baja en la derecha."""
  W_, H_, N = 34, 58, 6
  hoja = np.zeros((H_, W_ * N, 3), np.float32); al = np.zeros((H_, W_ * N), np.float32)
  NEG = np.array([6, 5, 11])
  CXc = 15.5
  for f in range(N):
    fase = f / N * 2 * math.pi
    ox = f * W_
    M = np.zeros((H_, W_), bool)
    yy, xx = np.mgrid[0:H_, 0:W_].astype(np.float32)
    X = xx - CXc
    # la capucha: cabeza redonda con la punta que vuela hacia atrás y a la derecha
    M |= (X / 4.6) ** 2 + ((yy - 10.5) / 5.6) ** 2 < 1
    punta = (yy > 4) & (yy < 11) & (X > 1) & (X < 4.5 + (11 - yy) * 0.55 + math.sin(fase) * 0.8) & (yy > 9 - (X - 1) * 0.9)
    M |= punta
    # los hombros caídos y la capa que se abre hasta el ruedo
    k = np.clip((yy - 14) / 40, 0, 1)
    izq = -6.2 - k * 5.2 + np.sin(fase + k * 3) * 0.5 * k
    der = 6.0 + k * 7.5 + np.sin(fase + k * 4.2) * 2.6 * k + np.sin(fase * 2 + k * 7) * 0.9 * k
    hombro = (yy >= 13) & (yy < 18) & (np.abs(X) < 5.2 + (yy - 13) * 0.35)
    M |= hombro
    M |= (yy >= 16) & (yy < 54) & (X >= izq) & (X <= der)
    # el ruedo deshilachado
    ruedo = (yy >= 50) & (yy < 54) & (((xx.astype(int) + f) % 4) == 0) & (X > 1)
    M &= ~ruedo
    # las botas
    M |= (yy >= 53) & (yy < 58) & (((X > -4) & (X < -1)) | ((X > 1.2) & (X < 4.2)))
    # la espada baja en la mano derecha (a la izquierda de la figura, que está de espaldas)
    for t in np.linspace(0, 1, 40):
      ex, ey = CXc - 9.5 - t * 3.2, 30 + t * 25
      ix, iy = int(round(ex)), int(round(ey))
      if 0 <= ix < W_ and 0 <= iy < H_: M[iy, ix] = True
    for gx in range(-2, 3): M[30, int(round(CXc - 9.5)) + gx] = True
    sub = np.zeros((H_, W_, 3), np.float32)
    sub[M] = NEG
    izqB = M & ~np.roll(M, 1, 1)
    derB = M & ~np.roll(M, -1, 1)
    arr = M & ~np.roll(M, 1, 0)
    sub[arr] = PAL[13]; sub[izqB] = PAL[12]
    sub[derB] = PAL[39]
    der2 = np.roll(derB, -1, 1) & M & ~derB
    sub[der2 & (yy > 16)] = PAL[38]
    # el filo de la hoja toma la luz fría
    for t in np.linspace(0.05, 1, 30):
      ex, ey = CXc - 9.5 - t * 3.2, 30 + t * 25
      ix, iy = int(round(ex)), int(round(ey))
      if 0 <= ix < W_ and 0 <= iy < H_ and t > 0.1: sub[iy, ix] = PAL[15] if t < 0.85 else PAL[13]
    hoja[:, ox:ox + W_] = sub; al[:, ox:ox + W_] = M
  return hoja, al, W_, H_, N


# ------------------------------------------------------------------ la colina de la catedral
def colina():
  m = json.load(open(TMP + 'catedral.json')); w, h = m['w'], m['h']
  tie = np.fromfile(TMP + 'catedral_tierra.f32', np.float32).reshape(h, w)
  perf = np.full(SW, np.nan)
  for x in range(w):
    col = np.where(tie[:, x] >= 0.5)[0]
    if len(col): perf[CAT_X + x] = CAT_Y + col[0]
  xs_ok = np.where(~np.isnan(perf))[0]
  x0, x1 = xs_ok[0], xs_ok[-1]
  for x in range(SW):
    if x < x0: perf[x] = perf[x0] + ((x0 - x) / 70) ** 1.5 * 30
    elif x > x1: perf[x] = perf[x1] + (x - x1) * 0.06
  perf = np.minimum(perf, 460 + OY)
  rgb = np.zeros((SH, SW, 3), np.float32); a = np.zeros((SH, SW), np.float32)
  m_ = ys >= perf[None, :]
  px, py = m['puerta'][0] + CAT_X, m['puerta'][1] + CAT_Y
  calor = np.exp(-np.hypot(xs - px, (ys - py) * 1.6) / 70)
  tex = fbm(SH, SW, 18, 61, 3)
  c = np.array([13, 12, 22]) + np.array([16, 14, 24]) * tex[..., None] + np.array([120, 50, 22]) * calor[..., None] * (0.6 + 0.4 * tex[..., None])
  filo = m_ & ~np.roll(m_, 1, 0)
  c[filo] += np.array([30, 32, 50])
  c[filo] += (np.array([120, 70, 30]) * calor[filo][:, None])
  rgb = cuantizar(c, 7); a[m_] = 1
  return rgb, a


# ------------------------------------------------------------------ cuervos: tres cuadros de 7 x 5
def cuervos():
  F = [
    ["..#.#..", ".#...#.", "#..#..#", ".......", "......."],
    [".......", "##.#.##", "..###..", ".......", "......."],
    [".......", "...#...", "..###..", ".#...#.", "#.....#"],
  ]
  hoja = np.zeros((5, 21, 3), np.float32); al = np.zeros((5, 21), np.float32)
  for i, f in enumerate(F):
    for y, fila in enumerate(f):
      for x, ch in enumerate(fila):
        if ch == '#': hoja[y, i * 7 + x] = (8, 7, 14); al[y, i * 7 + x] = 1
  return hoja, al


def main():
  rgb, d, t = cielo(); guardar('cielo.png', rgb)
  g, ga = grieta_luz(d, t); guardar('grieta_luz.png', g, ga)
  n1, a1 = nubes(101, 70 + OY, 250 + OY, 22, 0.56); guardar('nubes_lejos.png', n1, a1)
  n2, a2 = nubes(202, 220 + OY, 300 + OY, 16, 0.55, 1.2); guardar('nubes_cerca.png', n2, a2)
  mo, ma, fuegos = montes(); guardar('montes.png', mo, ma)
  c, ca, v, va, hl, ha, m = catedral()
  guardar('catedral.png', c, ca); guardar('catedral_vidrios.png', v, va); guardar('catedral_halo.png', hl, ha)
  ni, na = niebla(303, 300 + OY, 360 + OY, 1.0); guardar('niebla.png', ni, na)
  co, coa = colina(); guardar('colina.png', co, coa)
  fr, fa, top = frente(); guardar('frente.png', fr, fa)
  cm, cma, cw, ch, cn = caminante(); guardar('caminante.png', cm, cma)
  cu, cua = cuervos(); guardar('cuervos.png', cu, cua)
  # estrellas que titilan
  r = np.random.default_rng(99); est = []
  while len(est) < 60:
    x, y = int(r.integers(0, SW)), int(r.random() ** 1.5 * (290 + OY))
    if np.hypot(x - LUNA[0], y - LUNA[1]) < 30: continue
    dd, _ = dist_poli(GRIETA, np.array([[x]], np.float32), np.array([[y]], np.float32))
    if dd[0, 0] < 24: continue
    est.append([x, y, round(float(r.uniform(0.5, 3.2)), 2), round(float(r.uniform(0, 6.28)), 2), int(r.random() < 0.2)])
  CX = 455 + OX
  esc = {
    'w': SW, 'h': SH, 'vista': [VX, VY, 640, 360],
    'catedral': {'x': CAT_X, 'y': CAT_Y, 'w': m['w'], 'h': m['h'], 'puerta': [CAT_X + m['puerta'][0], CAT_Y + m['puerta'][1]]},
    'luna': list(LUNA),
    'grieta': [[round(float(p[0]), 1), round(float(p[1]), 1)] for p in GRIETA[::4]],
    'estrellas': est,
    'fuegos': fuegos,
    'caminante': {'x': CX - cw // 2, 'y': int(top[CX]) - ch + 2, 'w': cw, 'h': ch, 'n': cn},
    'suelo': [int(v) for v in top[::8]],
    'brasa': [[730 + OX, 121 + OY], [762 + OX, 264 + OY]],
    'humo': [742 + OX, 262 + OY],
    'cuervos': [668 + OX, 100 + OY],
    'foco': [480 + OX, 250 + OY, 600 + OX],
    'capas': [
      {'id': 'cielo', 'archivo': 'cielo.png', 'par': 0.04},
      {'id': 'grieta_luz', 'archivo': 'grieta_luz.png', 'par': 0.04, 'sumar': True},
      {'id': 'nubes_lejos', 'archivo': 'nubes_lejos.png', 'par': 0.08, 'deriva': -1.2},
      {'id': 'montes', 'archivo': 'montes.png', 'par': 0.14},
      {'id': 'nubes_cerca', 'archivo': 'nubes_cerca.png', 'par': 0.18, 'deriva': -2.6},
      {'id': 'niebla_lejos', 'archivo': 'niebla.png', 'par': 0.22, 'deriva': 3.0, 'alfa': 0.7},
      {'id': 'colina', 'archivo': 'colina.png', 'par': 0.34},
      {'id': 'catedral', 'archivo': 'catedral.png', 'par': 0.34, 'x': CAT_X, 'y': CAT_Y},
      {'id': 'catedral_halo', 'archivo': 'catedral_halo.png', 'par': 0.34, 'x': CAT_X, 'y': CAT_Y, 'sumar': True},
      {'id': 'catedral_vidrios', 'archivo': 'catedral_vidrios.png', 'par': 0.34, 'x': CAT_X, 'y': CAT_Y, 'sumar': True},
      {'id': 'niebla_cerca', 'archivo': 'niebla.png', 'par': 0.5, 'deriva': 6.0, 'alfa': 1, 'y': 34},
      {'id': 'frente', 'archivo': 'frente.png', 'par': 1.0},
    ],
  }
  json.dump(esc, open(os.path.join(SAL, 'escena.json'), 'w'))
  print('listo', SAL)


if __name__ == '__main__':
  main()
