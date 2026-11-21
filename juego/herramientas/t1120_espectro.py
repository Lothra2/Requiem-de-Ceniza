#!/usr/bin/env python3
"""Espectrogramas y medidas de los WAV de t1120_sonidos.cjs (solo numpy y PIL).

Uso: python3 juego/herramientas/t1120_espectro.py <etiqueta> [otra etiqueta para comparar]
  Por cada <etiqueta>_<id>.wav en /tmp/requiem-pruebas/sonidos arma <etiqueta>_<id>_espectro.png (0 a 6 kHz, dB) y una
  lámina con todos. En el aullido (forma_lobo) sigue la fundamental (el pico entre 250 y 750 Hz, afinado con la parábola),
  la dibuja encima y mide: su rango, el vibrato (frecuencia y profundidad, quitada la curva lenta), lo irregular del
  vibrato (cuánto varía de ciclo a ciclo) y los armónicos (cuánto sobresalen 2f y 3f del ruido de entre medio).
"""
import sys, os, glob, json, wave
import numpy as np
from PIL import Image, ImageDraw

DIR = '/tmp/requiem-pruebas/sonidos'


def leer(p):
    with wave.open(p) as w:
        sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
    return x, sr


def stft(x, n=2048, hop=256):
    win = np.hanning(n); x = np.concatenate([np.zeros(n // 2), x, np.zeros(n)])
    fr = [x[i:i + n] * win for i in range(0, len(x) - n, hop)]
    return np.abs(np.fft.rfft(np.array(fr), axis=1))


def color(v):
    # de negro a morado, rojo, naranja y amarillo pálido (sin matplotlib)
    stops = np.array([[0, 0, 0], [40, 10, 70], [130, 20, 90], [210, 60, 50], [250, 150, 30], [255, 245, 190]], np.float32)
    v = np.clip(v, 0, 1) * (len(stops) - 1); i = np.floor(v).astype(int); f = (v - i)[..., None]; i2 = np.minimum(i + 1, len(stops) - 1)
    return (stops[i] * (1 - f) + stops[i2] * f).astype(np.uint8)


def fundamental(x, sr, f0=250, f1=750):
    n, hop = 4096, 256
    S = stft(x, n, hop); fq = np.fft.rfftfreq(n, 1 / sr); a, b = np.searchsorted(fq, f0), np.searchsorted(fq, f1)
    ener = 20 * np.log10(S.max(axis=1) + 1e-9); umbral = ener.max() - 30
    out = []
    for k, fila in enumerate(S):
        t = k * hop / sr
        if ener[k] < umbral: out.append((t, np.nan, np.nan)); continue
        j = a + int(np.argmax(fila[a:b]))
        y0, y1, y2 = np.log(fila[j - 1] + 1e-9), np.log(fila[j] + 1e-9), np.log(fila[j + 1] + 1e-9)
        d = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2 + 1e-12)
        f = (j + d) * sr / n
        # armónicos: cuánto sobresalen 2f y 3f (dB) de la mediana de entre medio
        def nivel(ff):
            jj = int(round(ff * n / sr)); return 20 * np.log10(fila[max(0, jj - 2):jj + 3].max() + 1e-9)
        piso = 20 * np.log10(np.median(fila[int(f * 1.2 * n / sr):int(f * 3.8 * n / sr)]) + 1e-9)
        out.append((t, f, (nivel(2 * f) - piso + nivel(3 * f) - piso) / 2))
    return np.array(out)


def vibrato(tr, t0, t1):
    m = (tr[:, 0] >= t0) & (tr[:, 0] <= t1) & ~np.isnan(tr[:, 1])
    t, f = tr[m, 0], tr[m, 1]
    if len(t) < 40: return None
    dt = t[1] - t[0]
    # se quita la curva lenta (media corrida de 0,4 s) y queda el temblor
    k = max(3, int(0.4 / dt) | 1); lento = np.convolve(np.pad(f, k // 2, mode='edge'), np.ones(k) / k, mode='valid')
    r = f - lento
    R = np.abs(np.fft.rfft(r * np.hanning(len(r)), 8192)); fq = np.fft.rfftfreq(8192, dt)
    m2 = (fq > 2) & (fq < 12); fv = fq[m2][np.argmax(R[m2])]
    # ciclo a ciclo: los cruces por cero de subida
    z = np.where((r[:-1] < 0) & (r[1:] >= 0))[0]; per = np.diff(t[z]) if len(z) > 2 else np.array([1 / fv])
    return {'frecuencia_hz': round(float(fv), 2), 'profundidad_hz': round(float(np.std(r) * 1.414), 1),
            'profundidad_cents': round(float(1200 * np.log2(1 + np.std(r) * 1.414 / np.mean(f))), 1),
            'irregularidad_%': round(float(100 * np.std(per) / np.mean(per)), 1), 'ciclos': int(len(per))}


def espectro(p, pista=None):
    x, sr = leer(p); S = stft(x); db = 20 * np.log10(S + 1e-7); db = (db - (db.max() - 80)) / 80
    fq = np.fft.rfftfreq(2048, 1 / sr); jmax = np.searchsorted(fq, 6000)
    img = color(db[:, :jmax].T[::-1]); im = Image.fromarray(img).resize((max(400, img.shape[1] * 3), 360), Image.BILINEAR)
    d = ImageDraw.Draw(im); W, H = im.size; seg = len(x) / sr
    for f in range(1000, 6000, 1000): y = H - f / 6000 * H; d.line([(0, y), (W, y)], fill=(90, 90, 90)); d.text((3, y - 11), f'{f // 1000} kHz', fill=(200, 200, 200))
    for s in np.arange(0.5, seg, 0.5): xx = s / seg * W; d.line([(xx, H - 6), (xx, H)], fill=(200, 200, 200)); d.text((xx + 2, H - 14), f'{s:.1f}s', fill=(200, 200, 200))
    if pista is not None:
        pts = [(t / seg * W, H - f / 6000 * H) for t, f, _ in pista if not np.isnan(f)]
        for q in pts: d.point(q, fill=(120, 255, 160))
    d.text((W - 260, 4), os.path.basename(p)[:-4], fill=(255, 255, 255))
    im.save(p[:-4] + '_espectro.png'); return im


def main():
    et = sys.argv[1] if len(sys.argv) > 1 else 'ahora'
    med = {}
    try: med = json.load(open(f'{DIR}/{et}_medidas.json'))
    except Exception: pass
    ims, info = [], {}
    for p in sorted(glob.glob(f'{DIR}/{et}_*.wav')):
        nom = os.path.basename(p)[:-4]; pista = None
        if 'forma_lobo' in nom:
            x, sr = leer(p); pista = fundamental(x, sr)
            v = ~np.isnan(pista[:, 1]); f = pista[v, 1]
            # el aullido arranca a los 0,33 s: lo sostenido va de 0,9 a 2,3 s
            info[nom] = {'f0_min': round(float(np.percentile(f, 3)), 0), 'f0_max': round(float(np.percentile(f, 97)), 0),
                         'armonicos_db': round(float(np.nanmedian(pista[v, 2])), 1), 'vibrato': vibrato(pista, 0.9, 2.3)}
            print(nom, json.dumps(info[nom], ensure_ascii=False))
        ims.append(espectro(p, pista))
        if nom[len(et) + 1:] in med or nom in med: print(nom, 'volumen', med.get(nom))
    if ims:
        W = max(i.size[0] for i in ims); H = sum(i.size[1] + 4 for i in ims); L = Image.new('RGB', (W, H), (20, 20, 20)); y = 0
        for i in ims: L.paste(i, (0, y)); y += i.size[1] + 4
        L.save(f'{DIR}/{et}_lamina.png'); print('lámina', f'{DIR}/{et}_lamina.png')
    json.dump(info, open(f'{DIR}/{et}_aullido.json', 'w'), indent=1, ensure_ascii=False)


main()
