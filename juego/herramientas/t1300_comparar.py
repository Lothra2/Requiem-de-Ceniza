# Compara dos corridas de t1300_botin (--salida): el arma que lleva el héroe nivel a nivel, media de semillas, por clase.
# python3 juego/herramientas/t1300_comparar.py antes.json ahora.json
import json, sys, statistics as st
a = json.load(open(sys.argv[1])); b = json.load(open(sys.argv[2]))
NIV = [3, 5, 8, 10, 12, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60]
def curva(r, c, n): return st.mean([(x['curva'][n] or 0) for x in r['clases'][c]])
print('| clase | ' + ' | '.join(str(n) for n in NIV) + ' | media |')
print('|---|' + '---|' * (len(NIV) + 1))
tot = []
for c in a['clases']:
    if c not in b['clases']: continue
    rs = [curva(b, c, n) / curva(a, c, n) if curva(a, c, n) > 0 else 1 for n in NIV]
    tot.append(rs)
    print(f'| {c} | ' + ' | '.join(f'{r:.2f}'.replace('.', ',') for r in rs) + f' | {st.mean(rs):.2f} |'.replace('.', ','))
print('| todas | ' + ' | '.join(f'{st.mean(col):.2f}'.replace('.', ',') for col in zip(*tot)) + f' | {st.mean([st.mean(t) for t in tot]):.2f} |'.replace('.', ','))
