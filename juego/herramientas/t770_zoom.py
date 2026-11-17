# Tira ampliada de una acción: recorte chico alrededor del cuerpo, x3, cuadro a cuadro.
import sys, json, glob
from PIL import Image, ImageDraw
DIR='/tmp/requiem-pruebas/vid'
def zoom(nombre, quien, acc, cual=0, n=14, lado=84, paso=1, k=3):
    d=json.load(open(f'{DIR}/{nombre}.json')); caja=d['caja']; dat=d['datos']; fs=sorted(glob.glob(f'{DIR}/{nombre}/*.jpg'))
    seg=[]; ini=None
    for i,x in enumerate(dat):
        ok = x[quien] is not None and (x[quien]['acc']==acc or (acc=='morir' and x[quien]['muerto']))
        if ok and ini is None: ini=i
        if not ok and ini is not None: seg.append((ini,i)); ini=None
    if ini is not None: seg.append((ini,len(dat)))
    seg=[s for s in seg if s[1]-s[0]>=4]
    if not seg: return None
    a,b=seg[min(cual,len(seg)-1)]
    idx=list(range(a,b,paso))[:n]
    L=Image.new('RGB',(len(idx)*lado*k,lado*k))
    for c,i in enumerate(idx):
        q=dat[i][quien]; cx=q['p'][0]-caja['x']; cy=q['p'][1]-caja['y']-lado*0.32
        L.paste(Image.open(fs[i]).crop((int(cx-lado/2),int(cy-lado/2),int(cx+lado/2),int(cy+lado/2))).resize((lado*k,lado*k),Image.NEAREST),(c*lado*k,0))
    return L
if __name__=='__main__':
    nombres=sys.argv[3].split(','); quien=sys.argv[1]; filas=[]
    for nb in nombres:
        for acc in sys.argv[2].split(','):
            a,_,c=acc.partition(':'); im=zoom(nb,quien,a,int(c or 0),paso=int(sys.argv[5]) if len(sys.argv)>5 else 1)
            if im: filas.append((f'{nb} {acc}',im))
    W=max(i.width for _,i in filas); L=Image.new('RGB',(W,sum(i.height+12 for _,i in filas)),(16,16,16)); d=ImageDraw.Draw(L); y=0
    for t,i in filas: d.text((3,y),t,fill=(255,220,120)); L.paste(i,(0,y+12)); y+=i.height+12
    if L.width>3600: L=L.resize((3600,L.height*3600//L.width))
    L.save(sys.argv[4]); print(L.size)
