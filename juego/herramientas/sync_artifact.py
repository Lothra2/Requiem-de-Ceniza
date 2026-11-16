# Compara un armado nuevo con el último publicado como artifact y dice qué archivos cambiaron.
# Uso: python3 juego/herramientas/sync_artifact.py <dist nuevo> <copia de lo publicado>
# Copia lo nuevo sobre la copia de lo publicado y escribe por pantalla un JSON {ruta: origen | null}
# (null = se quitó). Con eso se arma el `files` del publish; `index.html` y `publicar.html` no van en `files`.
import filecmp, json, os, shutil, sys
B, A = sys.argv[1], sys.argv[2]
os.makedirs(A, exist_ok=True)
def walk(r): return {os.path.relpath(os.path.join(d, n), r) for d, _, ns in os.walk(r) for n in ns}
a, b = walk(A), walk(B); files = {}
for p in sorted(a - b): os.remove(os.path.join(A, p)); files[p] = None
for p in sorted(b):
    src = os.path.join(B, p); dst = os.path.join(A, p)
    if p not in a or not filecmp.cmp(src, dst, shallow=False):
        os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst)
        if p not in ('publicar.html', 'index.html'): files[p] = dst
print(json.dumps(files))
