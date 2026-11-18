// El juego instalado en el equipo (PWA): se agrega a la pantalla de inicio o al escritorio, abre en su ventana y, con
// todo guardado, abre al instante y se juega sin internet. Rick lo pidió para PC y iPad (18 nov 2026).
//
// El service worker (public/sw.js) sirve lo guardado. Acá se lo registra y se baja el juego entero con su barra de
// progreso: lista.json dice qué archivos tiene esta versión, con su huella y su peso. Se baja solo lo que falta (si se
// corta, sigue donde quedó) y, al terminar, se borra lo de versiones viejas. Una vez pedido, cada versión nueva se
// completa sola en segundo plano.
//
// La partida no pasa por acá: sigue en localStorage. En el PC la app instalada comparte el guardado con el navegador.
// En el iPad no: la app de la pantalla de inicio tiene su propio guardado (por eso el aviso y el traslado de partida).
import { abrir, parrafo, botonD, cerrar, abrirExportar, abrirImportar } from '../ui/traslado';

const JUEGO = 'requiem-juego';
export const inst = {
  soportado: false,
  /** Ya está todo guardado para la versión que hay. */
  listo: false,
  bajando: false,
  total: 0, hechos: 0, bytes: 0, bytesHechos: 0,
  error: '',
  /** El navegador ofrece instalar (Chrome, Edge). */
  instalable: false,
};
let diferido: any = null;
const pedido = () => { try { return localStorage.getItem('req.descarga') === '1'; } catch { return false; } };
export const esIOS = () => /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const instalada = () => matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches || (navigator as any).standalone === true;

export function registrar() {
  if (import.meta.env.DEV || !('serviceWorker' in navigator) || !('caches' in window)) return;
  inst.soportado = true;
  (window as any).__inst = inst; (window as any).__descargar = descargar; (window as any).__abrirInstalar = abrirInstalar;
  navigator.serviceWorker.register('./sw.js').catch(() => { inst.soportado = false; });
  addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); diferido = e; inst.instalable = true; });
  addEventListener('appinstalled', () => { diferido = null; inst.instalable = false; void descargar(); });
  // instalada o ya pedida: se completa sola (después de que el juego arrancó, para no pelear con su propia carga)
  setTimeout(() => { if (instalada() || pedido()) void descargar(); else void revisar(); }, 5000);
}

async function traerLista(): Promise<{ v: string; f: Record<string, string>; s: Record<string, number> } | null> {
  try { const r = await fetch('./lista.json?t=' + Date.now(), { cache: 'no-store' }); return r.ok ? await r.json() : null; } catch { return null; }
}
const claveDe = (rel: string, h: string) => new URL(rel + '?h=' + h, new URL('./', location.href)).href;

/** Solo mira cuánto falta (para el menú), sin bajar nada. */
async function revisar() {
  const l = await traerLista(); if (!l) return;
  const c = await caches.open(JUEGO); let falta = 0, bytes = 0, hechos = 0;
  // (sin instalar, el service worker igual guarda lo que el juego va pidiendo: lo de versiones viejas se borra acá)
  const vale = new Set(Object.entries(l.f).map(([rel, h]) => claveDe(rel, h))); vale.add(new URL('./index.html', location.href).href);
  for (const k of await c.keys()) if (!vale.has(k.url)) await c.delete(k);
  for (const [rel, h] of Object.entries(l.f)) { bytes += l.s[rel] ?? 0; if (await c.match(claveDe(rel, h))) hechos += l.s[rel] ?? 0; else falta++; }
  if (inst.bajando || inst.listo) return; // (si mientras tanto arrancó la descarga, sus cuentas mandan)
  inst.bytes = bytes; inst.bytesHechos = hechos; inst.listo = falta === 0;
}

/** Baja todo lo que falta de esta versión y limpia lo viejo. Se puede llamar las veces que sea. */
export async function descargar() {
  if (!inst.soportado || inst.bajando) return;
  inst.bajando = true; inst.error = '';
  try { localStorage.setItem('req.descarga', '1'); } catch { /* nada */ }
  try { await (navigator.storage as any)?.persist?.(); } catch { /* nada */ }
  try {
    const l = await traerLista(); if (!l) { inst.error = 'sin red'; return; }
    navigator.serviceWorker.controller?.postMessage({ tipo: 'lista', lista: l });
    const c = await caches.open(JUEGO), todos = Object.entries(l.f), falta: [string, string][] = [];
    inst.total = todos.length; inst.hechos = 0; inst.bytes = 0; inst.bytesHechos = 0;
    for (const [rel, h] of todos) { const b = l.s[rel] ?? 0; inst.bytes += b; if (await c.match(claveDe(rel, h))) { inst.hechos++; inst.bytesHechos += b; } else falta.push([rel, h]); }
    let sig = 0, fallas = 0;
    const obrero = async () => {
      while (sig < falta.length) {
        const [rel, h] = falta[sig++];
        let ok = false;
        for (let intento = 0; intento < 3 && !ok; intento++) {
          try {
            const r = await fetch('./' + rel, { cache: 'no-store', headers: { 'x-requiem': '1' } });
            if (r.ok) { await c.put(claveDe(rel, h), r); ok = true; }
          } catch (e: any) { if (e?.name === 'QuotaExceededError') { inst.error = 'sin espacio'; sig = falta.length; return; } }
        }
        if (ok) { inst.hechos++; inst.bytesHechos += l.s[rel] ?? 0; } else fallas++;
      }
    };
    await Promise.all([obrero(), obrero(), obrero(), obrero()]);
    if (inst.error) return;
    if (fallas) { inst.error = 'incompleto'; return; }
    // lo de versiones viejas fuera (la página guardada y lo que no está en la lista)
    const vale = new Set(todos.map(([rel, h]) => claveDe(rel, h))); vale.add(new URL('./index.html', location.href).href);
    for (const k of await c.keys()) if (!vale.has(k.url)) await c.delete(k);
    inst.listo = true;
  } catch (e: any) { inst.error = e?.name === 'QuotaExceededError' ? 'sin espacio' : 'falló'; }
  finally { inst.bajando = false; }
}

const mb = (b: number) => Math.round(b / 1048576);
/** Una línea con el estado, para el menú y el panel. */
export function estadoTxt(en: boolean): string {
  const T = (a: string, b: string) => (en ? b : a);
  if (inst.error === 'sin espacio') return T('No hay espacio en este equipo para guardar el juego.', 'There is no room on this device to store the game.');
  if (inst.error === 'sin red') return T('Sin conexión: se sigue cuando vuelva la red.', 'Offline: it will continue when the network is back.');
  if (inst.error) return T('Se cortó la descarga: vuelve a intentarlo.', 'The download was interrupted: try again.');
  if (inst.listo) return T('Todo guardado: abre al instante y se juega sin internet.', 'All stored: it opens instantly and plays offline.');
  if (inst.bajando && inst.bytes) return T(`Guardando el juego: ${mb(inst.bytesHechos)} de ${mb(inst.bytes)} MB (${Math.floor((inst.bytesHechos / inst.bytes) * 100)} %)`, `Storing the game: ${mb(inst.bytesHechos)} of ${mb(inst.bytes)} MB (${Math.floor((inst.bytesHechos / inst.bytes) * 100)}%)`);
  if (inst.bajando) return T('Preparando la descarga…', 'Preparing the download…');
  return T(`Falta guardar el juego en este equipo${inst.bytes ? ` (${mb(inst.bytes - inst.bytesHechos)} MB)` : ''}.`, `The game is not stored on this device yet${inst.bytes ? ` (${mb(inst.bytes - inst.bytesHechos)} MB)` : ''}.`);
}
/** Para el renglón del menú: null si no hay nada que ofrecer (ya instalada y completa). */
export function renglonMenu(en: boolean): string | null {
  if (!inst.soportado) return null;
  if (instalada() && inst.listo) return null;
  if (inst.bajando && inst.bytes) return (en ? 'Storing ' : 'Guardando ') + Math.floor((inst.bytesHechos / inst.bytes) * 100) + ' %';
  return en ? 'Install the game' : 'Instalar el juego';
}

/** El panel de instalar: qué hacer en este equipo, la barra de lo guardado y el aviso de la partida en el iPad. */
export function abrirInstalar(en: boolean) {
  const T = (a: string, b: string) => (en ? b : a);
  const c = abrir(T('Instalar el juego', 'Install the game'));
  const estado = parrafo(c, estadoTxt(en), '#e8d8b0');
  const barra = document.createElement('div'); barra.style.cssText = 'height:8px;background:#0b0907;border:1px solid #4e4028;margin:6px 0 10px';
  const lleno = document.createElement('div'); lleno.style.cssText = 'height:100%;width:0;background:linear-gradient(#f0d070,#a8862e)'; barra.appendChild(lleno); c.appendChild(barra);
  const tic = setInterval(() => { if (!c.isConnected) { clearInterval(tic); return; } estado.textContent = estadoTxt(en); lleno.style.width = (inst.bytes ? (inst.bytesHechos / inst.bytes) * 100 : inst.listo ? 100 : 0) + '%'; }, 250);
  if (instalada()) parrafo(c, T('Ya estás jugando desde la app instalada.', 'You are already playing from the installed app.'));
  else if (esIOS()) {
    parrafo(c, T('En el iPad o el iPhone: toca el botón Compartir de Safari (el cuadrito con la flecha hacia arriba) y elige «Agregar a pantalla de inicio». El juego queda con su ícono y abre a pantalla completa.', 'On iPad or iPhone: tap Safari\'s Share button (the square with the up arrow) and choose "Add to Home Screen". The game gets its own icon and opens full screen.'));
    parrafo(c, T('Importante: en el iPad la app instalada no ve la partida que tienes en Safari. Antes de instalar, saca tu partida acá (Sacar mi partida, Copiar el código) y después, en la app, pégala en Opciones, Partida, Traer.', 'Important: on iPad the installed app cannot see the save you have in Safari. Before installing, export your save here (Export my save, Copy code) and then, in the app, paste it under Options, Save, Import.'), '#f0b080');
  } else if (diferido) parrafo(c, T('Este navegador lo puede instalar como app: queda en el escritorio y abre en su propia ventana. Tu partida sigue ahí.', 'This browser can install it as an app: it lands on your desktop and opens in its own window. Your save stays.'));
  else parrafo(c, T('En el PC: ábrelo en Chrome o Edge y usa el ícono de instalar de la barra de direcciones (o el menú, «Instalar Réquiem de Ceniza»). Tu partida sigue ahí.', 'On PC: open it in Chrome or Edge and use the install icon in the address bar (or the menu, "Install Réquiem de Ceniza"). Your save stays.'));
  if (diferido) botonD(c, T('Instalar', 'Install'), async () => { try { diferido.prompt(); const r = await diferido.userChoice; if (r?.outcome === 'accepted') { diferido = null; inst.instalable = false; } } catch { /* nada */ } void descargar(); }, true);
  if (!inst.listo) botonD(c, T('Guardar todo en este equipo', 'Store everything on this device'), () => void descargar(), !diferido);
  if (esIOS()) { botonD(c, T('Sacar mi partida', 'Export my save'), () => void abrirExportar(en)); if (instalada()) botonD(c, T('Traer mi partida', 'Import my save'), () => abrirImportar(en)); }
  botonD(c, T('Cerrar', 'Close'), () => { clearInterval(tic); cerrar(); });
}
