import { writeFileSync } from 'fs';
import { encode } from 'fast-png';
import { orbeVivo } from '../src/ui/forja_orbe';
import { orbe } from '../../src/engine/gotico/hud';
const K = 4, R = 46, frames=[0,4,8], niveles=[1,0.5,0.15];
const tipos = ['vida','mana'] as const;
const S = 2*(R+7), cols = frames.length*niveles.length+niveles.length, rows = tipos.length;
const W = cols*S*K, H = rows*S*K, d = new Uint8Array(W*H*4);
for (let i=0;i<d.length;i+=4){d[i]=30;d[i+1]=26;d[i+2]=24;d[i+3]=255;}
tipos.forEach((t,ri)=>{ let ci=0;
 for (const n of niveles){ const rs=[orbe(t as any,n,0,R), ...frames.map(f=>orbeVivo(t as any,n,f,R))];
  for (const r of rs){ for(let y=0;y<r.h*K;y++)for(let x=0;x<r.w*K;x++){const s=((y/K|0)*r.w+(x/K|0))*4,a=r.data[s+3]/255,o=((ri*S*K+y)*W+ci*S*K+x)*4;for(let c=0;c<3;c++)d[o+c]=r.data[s+c]*a+d[o+c]*(1-a);} ci++; } }
});
writeFileSync('/tmp/requiem-pruebas/hud/orbes_lab.png', encode({width:W,height:H,data:d,channels:4}));
