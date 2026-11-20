# Láminas de antes y ahora de los mundos (fotos de t1003_mundos_fotos.cjs) y mapas de despeje de la zona entera.
# Uso: python3 juego/herramientas/t1003_lamina.py <antes> <ahora> [vista]   -> /tmp/requiem-pruebas/mundos1/lamina_<vista>_N.png y lamina_mapas_N.png
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
D=os.environ.get('MUNDOS_DIR','/tmp/requiem-pruebas/mundos1'); A,B=sys.argv[1],sys.argv[2]; V=sys.argv[3] if len(sys.argv)>3 else 'pc'
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14)
except: F=ImageFont.load_default()
ia={ (r['zid'],r['sitio']):r for r in json.load(open(f'{D}/{A}/{V}/indice.json'))}; ib={ (r['zid'],r['sitio']):r for r in json.load(open(f'{D}/{B}/{V}/indice.json'))}
zs=[]; [zs.append(z) for z,_ in ib if z not in zs]
movil = V=='movil'; tw,th=(422,195) if movil else (640,360); POR=4
for n in range(0,len(zs),POR):
    g=zs[n:n+POR]; im=Image.new('RGB',(tw*4,th*len(g)),'black'); d=ImageDraw.Draw(im)
    for r,z in enumerate(g):
        sit=[s for (zz,s) in ib if zz==z]; cols=[]
        for s in ['grande', 'jefe' if 'jefe' in sit else 'elite' if 'elite' in sit else 'tipico']:
            cols+= [(A,ia.get((z,s)),s),(B,ib.get((z,s)),s)]
        for c,(et,q,s) in enumerate(cols):
            f=f'{D}/{et}/{V}/{z}_{s}.png'
            if not q or not os.path.exists(f): continue
            im.paste(Image.open(f).convert('RGB').resize((tw,th),Image.LANCZOS),(c*tw,r*th))
            t=f"{z} {s} · {'ANTES' if et==A else 'AHORA'} · campamento {q['grupo']}, despeje {q['despeje']}, despiertos {q['desp']} de {q['enPant']}"
            d.rectangle((c*tw,r*th,c*tw+tw,r*th+18),fill=(0,0,0)); d.text((c*tw+3,r*th+1),t if not movil else t[:52],fill=(255,220,120) if et==B else (190,190,190),font=F)
    im.save(f'{D}/lamina_{V}_{n//POR+1}.png')
if V!='pc': sys.exit()
def dt(lib,W,H):
    d=[0]*(W*H)
    for y in range(H):
        for x in range(W):
            i=y*W+x
            if lib[i]: d[i]=1 if (x==0 or y==0 or x==W-1 or y==H-1) else min(d[i-1],d[i-W],d[i-W-1],d[i-W+1])+1
    for y in range(H-1,-1,-1):
        for x in range(W-1,-1,-1):
            i=y*W+x
            if lib[i] and not (x==0 or y==0 or x==W-1 or y==H-1): d[i]=min(d[i],d[i+1]+1,d[i+W]+1,d[i+W+1]+1,d[i+W-1]+1)
    return d
PAL=[(70,20,20),(120,45,25),(170,85,30),(205,140,45),(140,190,80),(70,200,150),(70,190,220),(120,170,255),(235,245,255)]
def mapa(et,z,S=3):
    f=f'{D}/{et}/pc/mapas/{z}.json'
    if not os.path.exists(f): return None
    m=json.load(open(f)); W,H=m['W'],m['H']; lib=[c=='0' for c in m['bloq']]; d=dt(lib,W,H)
    im=Image.new('RGB',(W,H),'black'); px=im.load()
    for y in range(H):
        for x in range(W):
            i=y*W+x
            if lib[i]: px[x,y]=PAL[min(8,d[i]-1)]
            elif m['bloq'][i]=='3': px[x,y]=(90,70,60)
            elif m['bloq'][i]=='1' and m['piso'][(y//5)*m['tw']+x//5]=='1': px[x,y]=(42,42,48)
    im=im.resize((W*S,H*S),Image.NEAREST); dr=ImageDraw.Draw(im)
    for l in m.get('lugares',[]): dr.ellipse(((l[0]-l[2])*S,(l[1]-l[2])*S,(l[0]+l[2])*S,(l[1]+l[2])*S),outline=(255,255,0) if l[3]=='claro' else (255,120,255) if l[3]=='hito' else (255,60,60))
    for g in m['gore']: dr.rectangle((g[0]*S-2,g[1]*S-2,g[0]*S+2,g[1]*S+2),fill=(255,0,0))
    for s in m['spawns']:
        rr=3+min(14,s['n']); col={'grupo':(255,255,255),'campeon':(255,160,0),'unico':(255,80,220),'jefe':(255,0,0)}[s['t']]
        dr.ellipse((s['cx']*S-rr,s['cy']*S-rr,s['cx']*S+rr,s['cy']*S+rr),outline=col,width=2)
    for s in m['salidas']: dr.rectangle((s[0]*S-4,s[1]*S-4,s[0]*S+4,s[1]*S+4),outline=(0,255,0),width=2)
    return im
C=440
for n in range(0,len(zs),3):
    g=zs[n:n+3]; im=Image.new('RGB',(C*2*len(g),C+22),'black'); d=ImageDraw.Draw(im)
    for c,z in enumerate(g):
        for k,et in enumerate([A,B]):
            q=mapa(et,z)
            if q is None: continue
            q.thumbnail((C-4,C-4),Image.NEAREST); im.paste(q,((c*2+k)*C+2,22)); d.text(((c*2+k)*C+4,3),f"{z} · {'ANTES' if k==0 else 'AHORA'} ({q.size[0]//3 if q.size[0]<C-4 else ''})",fill=(255,220,120) if k else (190,190,190),font=F)
    im.save(f'{D}/lamina_mapas_{n//3+1}.png')
print('láminas en',D)
