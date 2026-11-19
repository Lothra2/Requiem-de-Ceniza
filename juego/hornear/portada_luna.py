# La luna de sangre de la portada y las nubes que le pasan por delante, horneadas una vez (unos 30 s).
# Uso: python3 juego/hornear/portada_luna.py   -> fondo/luna.webp y fondo/luna_nubes.webp
#
# La luna es una esfera de verdad: albedo de mares con la cara conocida (Procellarum, Imbrium, Serenitatis,
# Tranquillitatis, Crisium, Nubium...) con bordes deshechos por ruido, tierras altas claras, unos 2600 cráteres con
# cuenco, borde levantado, eyecta y pico central en los grandes, y los rayos de Tycho, Copérnico, Kepler y Aristarco.
# El relieve sale de la altura (normales por gradiente) y se alumbra con una luz corrida arriba a la izquierda
# (Lommel-Seeliger, como la luna de verdad, más algo de Lambert para que el relieve se lea), con oscurecimiento del
# limbo y el color del eclipse total: cobre claro del lado de la penumbra, ladrillo y sangre hacia el otro.
# Las nubes son jirones de estrato que empalman en x (1536 de período, como las capas): en el canal R el cuerpo
# (cuánto tapa) y en el G el filo que se enciende a contraluz (lo fino y los bordes). El juego los tiñe y los suma.
import os
import numpy as np
from PIL import Image

D = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'portada', 'fondo')
N = int(os.environ.get('N', 768))
rng = np.random.default_rng(1666)


def hash3(ix, iy, iz, s=0):
    q = np.sin(ix * 127.1 + iy * 311.7 + iz * 74.7 + s * 19.19) * 43758.5453
    return q - np.floor(q)


def ruido3(x, y, z, s=0):
    ix, iy, iz = np.floor(x), np.floor(y), np.floor(z)
    fx, fy, fz = x - ix, y - iy, z - iz
    fx, fy, fz = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy), fz * fz * (3 - 2 * fz)
    v = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (fx if dx else 1 - fx) * (fy if dy else 1 - fy) * (fz if dz else 1 - fz)
                v = v + w * hash3(ix + dx, iy + dy, iz + dz, s)
    return v


def fbm3(x, y, z, oct=5, s=0):
    v, a, k, tot = 0, 0.5, 1, 0
    for o in range(oct):
        v = v + a * ruido3(x * k, y * k, z * k, s + o * 7)
        tot += a; a *= 0.5; k *= 2.03
    return v / tot


def suave(a, b, v):
    t = np.clip((v - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def desenfocar(a, r, n=3):
    # caja separable repetida (casi gaussiana), con los bordes repetidos
    for _ in range(n):
        for eje in (0, 1):
            p = np.pad(a, [(r + 1, r)] * 1 + [(0, 0)] if eje == 0 else [(0, 0), (r + 1, r)], mode='edge')
            c = np.cumsum(p, axis=eje)
            a = ((c[2 * r + 1:] - c[:-2 * r - 1]) if eje == 0 else (c[:, 2 * r + 1:] - c[:, :-2 * r - 1])) / (2 * r + 1)
    return a


def esfera(lon, lat):
    lo, la = np.radians(lon), np.radians(lat)
    return np.array([np.cos(la) * np.sin(lo), np.sin(la), np.cos(la) * np.cos(lo)])


def luna():
    u = (np.arange(N) + 0.5) / N * 2 - 1
    X, Yi = np.meshgrid(u, u)
    Y = -Yi
    r2 = X * X + Y * Y
    dentro = r2 < 1
    Z = np.sqrt(np.clip(1 - r2, 0, 1))
    # libración: la cara apenas girada (que no se vea de catálogo)
    a, b = np.radians(-7), np.radians(5)
    Xs = X * np.cos(a) + Z * np.sin(a); Zs = -X * np.sin(a) + Z * np.cos(a)
    Ys = Y * np.cos(b) - Zs * np.sin(b); Zs = Y * np.sin(b) + Zs * np.cos(b)
    P = np.stack([Xs, Ys, Zs])  # punto selenográfico de cada pixel
    print('mares')
    # mares: (lon, lat, radio en grados, oscuridad)
    mares = [(-57, 20, 26, 1.0), (-50, 0, 18, 0.9), (-62, 38, 16, 0.85), (-16, 33, 17, 1.0), (17, 28, 10, 0.95), (31, 8, 12, 0.92),
             (59, 17, 7.5, 1.0), (51, -8, 9, 0.85), (35, -15, 5.5, 0.85), (-17, -21, 10, 0.8), (-39, -24, 6, 0.9), (-23, -10, 6, 0.75),
             (-30, 7, 8, 0.8), (4, 13, 4.5, 0.75), (0, 56, 7, 0.7), (-25, 55, 6, 0.65), (25, 55, 6, 0.6), (-60, -20, 5, 0.6), (85, 0, 6, 0.6)]
    # el campo de los mares: la cercanía a cada centro (ancha y suave) más ruido, cortado con un umbral. Así los bordes
    # salen deshechos, con bahías y lenguas, y no como discos.
    campo = np.zeros_like(X)
    # el punto torcido con ruido (domain warp): los bordes de los mares hacen bahías y no círculos
    w = 0.2
    Pw = [P[i] + w * (fbm3(P[0] * 2.2 + i * 5.1, P[1] * 2.2, P[2] * 2.2, 5, 70 + i) - 0.5) * 2 for i in range(3)]
    lw = np.sqrt(Pw[0] ** 2 + Pw[1] ** 2 + Pw[2] ** 2); Pw = [q / lw for q in Pw]
    for lon, lat, rad, k in mares:
        c = esfera(lon, lat)
        d = np.degrees(np.arccos(np.clip(Pw[0] * c[0] + Pw[1] * c[1] + Pw[2] * c[2], -1, 1)))
        campo = np.maximum(campo, k * np.exp(-(d / (rad * 1.05)) ** 2))
    q1 = fbm3(P[0] * 2.6, P[1] * 2.6, P[2] * 2.6, 6, 3)
    q2 = fbm3(P[0] * 9, P[1] * 9, P[2] * 9, 4, 5)
    v = campo + (q1 - 0.5) * 0.55 + (q2 - 0.5) * 0.25
    mar = suave(0.34, 0.56, v) * (0.75 + 0.25 * suave(0.3, 0.9, campo))
    mar = desenfocar(mar, max(1, N // 220))
    # tierras altas claras con su manchado; mares oscuros con vetas
    g1 = fbm3(P[0] * 6, P[1] * 6, P[2] * 6, 6, 11)
    g2 = fbm3(P[0] * 22, P[1] * 22, P[2] * 22, 4, 23)
    alb = 0.78 + 0.18 * (g1 - 0.5) * 2 + 0.06 * (g2 - 0.5) * 2
    alb = alb * (1 - mar * (0.52 + 0.22 * (g1 - 0.5) + 0.1 * (g2 - 0.5)))
    alt = np.zeros_like(X)
    rayos = np.zeros_like(X)
    print('cráteres')
    px = lambda v: (v + 1) / 2 * N
    # cráteres con nombre: (lon, lat, radio en grados, con rayos)
    nombrados = [(-11, -43, 2.6, 2.2), (-20, 10, 2.8, 1.2), (-38, 8, 1.0, 0.8), (-47, 24, 1.1, 0.9), (-9, -8, 3.5, 0), (-3, -18, 5, 0), (-60, -5, 3, 0), (-32, -45, 3.6, 0), (12, -36, 3, 0), (-15, 58, 3, 0)]
    crs = []
    for lon, lat, rad, ray in nombrados: crs.append((esfera(lon, lat), np.radians(rad), 1.0, ray))
    n = int(os.environ.get('CRATERES', 12000))
    while len(crs) < n + len(nombrados):
        v = rng.normal(size=3); v /= np.linalg.norm(v)
        rad = np.radians(min(4.2, 0.18 * rng.random() ** -0.55))
        # en los mares hay menos (son más jóvenes)
        sx, sy = px(v[0]), px(-v[1])
        ix, iy = int(np.clip(sx, 0, N - 1)), int(np.clip(sy, 0, N - 1))
        if v[2] > 0 and mar[iy, ix] > 0.3 and rng.random() < 0.72: continue
        crs.append((v, rad, 0.35 + 0.65 * rng.random(), 0))
    # la luna en pantalla (sin libración): el centro selenográfico de cada cráter visto en la imagen
    inv = lambda v: (lambda x, y, z: (x, y * np.cos(b) + z * np.sin(b), -y * np.sin(b) + z * np.cos(b)))(*v)
    for c, rad, fresco, ray in crs:
        x1, y1, z1 = inv(c)
        xv, zv = x1 * np.cos(a) - z1 * np.sin(a), x1 * np.sin(a) + z1 * np.cos(a)
        if zv < -0.2: continue
        ext = (rad * (7 if ray else 2.6)) * N / 2 + 3
        cx, cy = px(xv), px(-y1)
        x0, x1b, y0, y1b = int(max(0, cx - ext)), int(min(N, cx + ext + 1)), int(max(0, cy - ext)), int(min(N, cy + ext + 1))
        if x0 >= x1b or y0 >= y1b: continue
        sl = (slice(y0, y1b), slice(x0, x1b))
        p = P[:, sl[0], sl[1]]
        d = np.arccos(np.clip(p[0] * c[0] + p[1] * c[1] + p[2] * c[2], -1, 1)) / rad
        m = dentro[sl]
        prof = (0.2 if rad < np.radians(1.2) else 0.2 - 0.1 * min(1, (np.degrees(rad) - 1.2) / 3)) * rad * N / 2 * (0.5 + 0.5 * fresco)
        h = np.where(d < 1, -prof * (1 - d * d) * (1 - 0.35 * suave(0.6, 1, d)), 0)
        h = h + prof * 0.45 * np.exp(-((d - 1) / 0.16) ** 2) + np.where(d > 1, prof * 0.18 * np.exp(-(d - 1) * 2.2), 0)
        if rad > np.radians(1.8): h = h + prof * 0.5 * np.exp(-(d / 0.16) ** 2)  # pico central
        alt[sl] += np.where(m, h, 0)
        # el borde y la eyecta de los frescos son más claros; el fondo de los grandes, un poco más oscuro
        dal = fresco * fresco * (0.05 * np.exp(-((d - 1) / 0.22) ** 2) + 0.035 * np.where(d > 1, np.exp(-(d - 1) * 3), 0))
        if ray:
            pc = p - c[:, None, None] * (p[0] * c[0] + p[1] * c[1] + p[2] * c[2])
            e1 = np.cross(c, [0, 1, 0]); e1 /= np.linalg.norm(e1); e2 = np.cross(c, e1)
            ang = np.arctan2(pc[0] * e2[0] + pc[1] * e2[1] + pc[2] * e2[2], pc[0] * e1[0] + pc[1] * e1[1] + pc[2] * e1[2])
            rr = np.zeros_like(ang)
            for k in range(3):
                rr = rr + ruido3(np.cos(ang) * (16 + 14 * k), np.sin(ang) * (16 + 14 * k), d * 0.02 + k, 40 + k)
            rr = suave(1.5, 2.3, rr) * np.exp(-np.maximum(0, d - 1) / (4.5 * ray)) * suave(0.9, 1.6, d)
            dal = dal + 0.07 * np.exp(-np.maximum(0, d - 1) * 1.5) * suave(0.8, 1.1, d)
        alb[sl] += np.where(m, dal, 0)
        if ray: rayos[sl] += np.where(m, rr, 0) * ray
    # los rayos son polvo claro, no rayas: van desenfocados
    alb = alb + 0.2 * desenfocar(rayos, max(1, N // 300))
    alb = np.clip(alb, 0.08, 1.25)
    print('luz')
    # relieve: pequeñas lomas y el gradiente de la altura sobre la normal de la esfera
    alt = alt + 3.2 * (fbm3(P[0] * 18, P[1] * 18, P[2] * 18, 4, 61) - 0.5) * (1 - 0.6 * mar)
    gy, gx = np.gradient(alt)
    lim = suave(0.995, 0.9, np.sqrt(r2)); gx, gy = gx * lim, gy * lim
    k = 1.0
    nx, ny, nz = X - gx * k, Y + gy * k, Z + 1e-4
    l = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / l, ny / l, nz / l
    L = np.array([-0.52, 0.40, 0.75]); L /= np.linalg.norm(L)
    mu0 = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    mu0s = np.clip(X * L[0] + Y * L[1] + Z * L[2], 0, 1)
    mu = np.clip(Z, 0.02, 1)
    ls = 2 * mu0 / (mu0 + mu)
    lam = mu0
    luz = 0.55 * ls * (0.55 + 0.45 * mu0s) + 0.55 * lam
    # el eclipse: el lado de la penumbra (arriba a la izquierda) más claro y cobrizo
    pen = suave(-0.9, 0.9, -X * 0.75 + Y * 0.66)
    I = alb * luz * (0.5 + 0.72 * pen) + 0.03
    I = I * (0.88 + 0.12 * Z)  # oscurecimiento del limbo
    I = np.clip(I / 0.9, 0, 1.0) ** 0.9
    rampa = np.array([[0, 10, 2, 2], [0.18, 52, 9, 6], [0.38, 118, 26, 13], [0.58, 178, 58, 26], [0.78, 224, 112, 52], [0.92, 250, 166, 96], [1.0, 255, 214, 160]], float)
    # del lado de la sombra de la Tierra el rojo es más hondo (sangre); del de la penumbra, cobre y ámbar
    honda = np.array([[0, 6, 1, 2], [0.18, 44, 6, 6], [0.38, 104, 16, 10], [0.58, 160, 36, 18], [0.78, 206, 74, 34], [0.92, 236, 120, 64], [1.0, 250, 170, 120]], float)
    col = np.stack([np.interp(I, rampa[:, 0], rampa[:, c]) for c in (1, 2, 3)], -1)
    col2 = np.stack([np.interp(I, honda[:, 0], honda[:, c]) for c in (1, 2, 3)], -1)
    col = col2 + (col - col2) * pen[..., None]
    # el aire de la Tierra: el borde se tiñe más rojo y se funde
    filo = suave(0.86, 1.0, np.sqrt(r2))
    col = col * (1 - 0.18 * filo[..., None]) + np.array([170, 40, 18]) * 0.18 * filo[..., None]
    rr = np.sqrt(r2) * N / 2
    alfa = np.clip(N / 2 - rr + 0.5, 0, 1) * 255
    img = np.dstack([np.clip(col, 0, 255), alfa]).astype(np.uint8)
    Image.fromarray(img, 'RGBA').save(os.path.join(D, 'luna.webp'), 'WEBP', quality=92, method=6)
    print('luna.webp', os.path.getsize(os.path.join(D, 'luna.webp')) // 1024, 'KB')


def nubes():
    # jirones de estrato, 1536 de ancho (empalma) por 420 de alto en la capa de 1536 x 800, a media resolución
    W, H = 768, 210
    x = np.arange(W) / W * 2 * np.pi
    y = np.arange(H) / H
    Xg, Yg = np.meshgrid(x, y)
    # el ruido en un cilindro: x da la vuelta y empalma. Poca frecuencia en x y mucha en y: jirones largos y finos
    cx, cz = np.cos(Xg), np.sin(Xg)
    base = fbm3(cx * 0.55, Yg * 6, cz * 0.55, 4, 81)
    fib = fbm3(cx * 1.3 + 3, Yg * 38, cz * 1.3, 5, 91)
    fino = fbm3(cx * 4 + 7, Yg * 90, cz * 4, 3, 97)
    dens = (base - 0.5) * 3.4 + (fib - 0.5) * 1.6 + (fino - 0.5) * 0.6 - 0.42
    dens = np.clip(dens * 1.6, 0, 1)
    f2 = fino
    # arriba y abajo se deshacen
    dens *= suave(0.0, 0.18, Yg) * suave(1.0, 0.8, Yg)
    cuerpo = dens ** 1.3
    filo = np.clip(dens * (1 - dens) * 4, 0, 1) ** 1.2 * (0.6 + 0.4 * f2)
    img = np.dstack([cuerpo * 255, filo * 255, np.zeros_like(dens), np.full_like(dens, 255)]).astype(np.uint8)
    Image.fromarray(img[..., :3], 'RGB').resize((W * 2, H * 2), Image.BICUBIC).save(os.path.join(D, 'luna_nubes.webp'), 'WEBP', quality=88, method=6)
    print('luna_nubes.webp', os.path.getsize(os.path.join(D, 'luna_nubes.webp')) // 1024, 'KB')


if __name__ == '__main__':
    que = os.environ.get('QUE', 'luna,nubes').split(',')
    if 'luna' in que: luna()
    if 'nubes' in que: nubes()
