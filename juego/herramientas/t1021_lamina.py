# Lámina de las vistas de t1021_vistas.cjs. Uso: python3 juego/herramientas/t1021_lamina.py <etiqueta> [otra para comparar] (DIR=, COLS=3, ANCHO=640)
import json, os, sys
from PIL import Image, ImageDraw, ImageFont
D=os.environ.get('DIR','/tmp/requiem-pruebas/mundos2/vistas'); A=sys.argv[1]; B=sys.argv[2] if len(sys.argv)>2 else None
COLS=int(os.environ.get('COLS','3')); tw=int(os.environ.get('ANCHO','640'))
try: F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',13)
except: F=ImageFont.load_default()
ind=json.load(open(f'{D}/{A}/indice.json')); zs=[]
for r in ind:
    if r['zid'] not in zs: zs.append(r['zid'])
for z in zs:
    rs=[r for r in ind if r['zid']==z]; ims=[]
    for r in rs:
        im=Image.open(f"{D}/{A}/{r['f']}").convert('RGB'); th=im.height*tw//im.width; ims.append((im.resize((tw,th),Image.LANCZOS), f"{z} · {r['sitio']}" + (f" · {r['nombre']}" if r.get('nombre') else '')))
        if B and os.path.exists(f"{D}/{B}/{r['f']}"): im2=Image.open(f"{D}/{B}/{r['f']}").convert('RGB'); ims.append((im2.resize((tw,th),Image.LANCZOS), f"{z} · {r['sitio']} · {B}"))
    th=ims[0][0].height; filas=(len(ims)+COLS-1)//COLS; out=Image.new('RGB',(tw*COLS,th*filas),'black'); d=ImageDraw.Draw(out)
    for i,(im,t) in enumerate(ims):
        x,y=(i%COLS)*tw,(i//COLS)*th; out.paste(im,(x,y)); d.rectangle((x,y,x+tw,y+17),fill=(0,0,0)); d.text((x+3,y+1),t,fill=(255,220,120),font=F)
    out.save(f'{D}/lamina_{A}_{z}.png'); print(f'{D}/lamina_{A}_{z}.png')
