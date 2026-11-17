import json,glob,re,sys
M={'quieto':'.','caminar':'c','lanzar':'L','atacar':'A','herido':'h','morir':'M','especial':'E','correr':'r'}
for f in sorted(glob.glob('/tmp/requiem-pruebas/vid/mon_*.json')):
    d=json.load(open(f))['datos']; s=''.join(M.get(x['m']['acc'],'?') if x['m'] else ' ' for x in d)
    tr=[len(m.group()) for m in re.finditer('[cr]+',s)]; at=[len(m.group()) for m in re.finditer('A+|L+',s)]
    dirs=sum(1 for i in range(1,len(d)) if d[i]['m'] and d[i-1]['m'] and d[i]['m']['dir']!=d[i-1]['m']['dir'])
    v=[x['m'] for x in d if x['m'] and x['m']['acc'] in('caminar','correr')]
    vel=sum(((v[i]['x']-v[i-1]['x'])**2+(v[i]['y']-v[i-1]['y'])**2)**.5 for i in range(1,len(v)))/(len(v)/25) if len(v)>3 else 0
    t1=next((i for i,c in enumerate(s) if c in 'AL'),-1)
    print(f"{f.split('/')[-1][4:-5]:22s} vel {vel:4.1f} tramos {len(tr):2d} cortos {sum(1 for t in tr if t<5):2d} giros {dirs:2d} ataques {len(at)} dur {[round(a/25,2) for a in at[:3]]} 1er {t1/25:.1f}s herido {s.count('h')} | {s[:120]}")
