// Diagnóstico de la variedad de trajes: tira miles de caídas por nivel y cuenta cuántos aspectos distintos salen
// (lo que se ve en el ícono y lo que se ve puesto). Uso: npx tsx juego/herramientas/t850_trajes.mts [tiradas] [nivelMax]
import { crearObjeto, tirarRareza, baseDe } from '../src/juego/objetos';
import { aLoot } from '../src/ui/loot';
import { iconoDeLoot } from '../../src/engine/gotico/iconos3d';
import { equipoDeInventario } from '../../src/engine/gotico/apariencia';

const N = Number(process.argv[2] ?? 4000), NMAX = Number(process.argv[3] ?? 40);
const CAS: Record<string, string> = { torso: 'pecho', cabeza: 'casco', manos: 'guantes', pies: 'botas', cinturon: 'cinturon' };
const PARTES: Record<string, string[]> = { torso: ['torso', 'piernas', 'hombros', 'tabardo', 'capa'], cabeza: ['cabeza'], manos: ['manos'], pies: ['pies'], cinturon: ['cinturon'] };
const tally: Record<string, { icono: Map<string, number>; puesto: Map<string, number>; color: Map<string, number>; n: number }> = {};
for (const r of Object.keys(CAS)) tally[r] = { icono: new Map(), puesto: new Map(), color: new Map(), n: 0 };
const sumar = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) ?? 0) + 1);
for (let i = 0; i < N; i++) {
  const nivel = 1 + (i % NMAX);
  const o = crearObjeto(nivel, tirarRareza(i % 7 === 0 ? 1 : 0, 0, nivel), (b) => b.ranura in CAS);
  const b = baseDe(o); if (!b || !(b.ranura in CAS)) continue;
  const t = tally[b.ranura]; t.n++;
  const it = aLoot(o), ic = iconoDeLoot(it);
  const eq: any = equipoDeInventario({ [CAS[b.ranura]]: { it } }, {});
  const puesto = PARTES[b.ranura].map((k) => eq[k] ? `${k}:${JSON.stringify(eq[k])}` : '').filter(Boolean).join(' ');
  sumar(t.icono, JSON.stringify(ic)); sumar(t.puesto, puesto);
  sumar(t.color, String((ic as any)?.color ?? (ic as any)?.linea));
}
for (const [r, t] of Object.entries(tally)) {
  console.log(`\n== ${r}: ${t.n} caídas, ${t.icono.size} íconos distintos, ${t.puesto.size} aspectos puestos distintos`);
  const top = [...t.puesto.entries()].sort((a, b) => b[1] - a[1]);
  for (const [k, v] of top.slice(0, Number(process.env.TOP ?? 8))) console.log(`  ${(100 * v / t.n).toFixed(1).padStart(5)} %  ${k.slice(0, 220)}`);
  console.log('  color/línea del ícono:', [...t.color.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${(100 * v / t.n).toFixed(0)}%`).join(', '));
}
