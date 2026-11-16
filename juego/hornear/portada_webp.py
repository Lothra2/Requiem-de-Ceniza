# Pasa a WebP las capas de la portada que el juego pide en ese formato (después de portada_catedral.mts).
import os
from PIL import Image
D = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'portada', 'fondo')
for n in ('catedral_fuego', 'cementerio'):
    p = os.path.join(D, n + '.png')
    if not os.path.exists(p): continue
    Image.open(p).save(os.path.join(D, n + '.webp'), 'WEBP', quality=92, method=6)
    print(n, os.path.getsize(p) // 1024, 'KB ->', os.path.getsize(os.path.join(D, n + '.webp')) // 1024, 'KB'); os.remove(p)
