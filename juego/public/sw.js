// Réquiem de Ceniza instalado: el juego entero guardado en el equipo para abrir al instante y jugar sin internet.
//
// - La página (index.html) va primero a la red y, si no hay, sale la guardada. Al pasar por la red se trae además
//   lista.json: qué archivos tiene esta versión y la huella de cada uno.
// - Cada archivo se guarda con su huella en la clave (archivo?h=huella): si una versión nueva cambia un atlas que se llama
//   igual, la clave cambia y se baja el nuevo. Sin red y sin la huella nueva, sale la copia que haya.
// - La descarga completa (y la limpieza de lo viejo) la hace la página (nucleo/instalar.ts) con barra de progreso.
// - version.json, lista.json y este archivo nunca se guardan: siempre de la red.
const JUEGO = 'requiem-juego', META = 'requiem-meta', FUENTES = 'requiem-fuentes';
let lista = null;
const raiz = () => self.registration.scope;
const clave = (rel, h) => raiz() + rel + '?h=' + h;

async function leerLista() {
  if (lista) return lista;
  try { const r = await (await caches.open(META)).match('lista'); lista = r ? await r.json() : { f: {} }; } catch { lista = { f: {} }; }
  return lista;
}
async function fijarLista(l) {
  if (!l || !l.f) return;
  lista = l;
  try { await (await caches.open(META)).put('lista', new Response(JSON.stringify(l), { headers: { 'content-type': 'application/json' } })); } catch { /* sin espacio */ }
}

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('message', (e) => { if (e.data && e.data.tipo === 'lista') e.waitUntil(fijarLista(e.data.lista)); });

const conPlazo = (p, ms) => new Promise((ok, mal) => { const t = setTimeout(() => mal(new Error('plazo')), ms); p.then((v) => { clearTimeout(t); ok(v); }, (e) => { clearTimeout(t); mal(e); }); });

async function pagina(req) {
  const c = await caches.open(JUEGO);
  try {
    const [r, l] = await Promise.all([
      conPlazo(fetch(req.url, { cache: 'no-store', credentials: 'same-origin' }), 6000), // (una petición de navegación no se puede rehacer con opciones: va por su dirección)
      fetch(raiz() + 'lista.json', { cache: 'no-store' }).then((x) => (x.ok ? x.json() : null)).catch(() => null),
    ]);
    if (r && r.ok) {
      // (una respuesta redirigida no se puede devolver a una navegación: se copia limpia)
      const limpia = r.redirected ? new Response(await r.blob(), { status: 200, headers: r.headers }) : r;
      if (l) await fijarLista(l);
      await c.put(raiz() + 'index.html', limpia.clone()).catch(() => {});
      return limpia;
    }
    if (r) return r;
  } catch { /* sin red: la guardada */ }
  const g = await c.match(raiz() + 'index.html');
  return g || fetch(req);
}

async function archivo(rel, req) {
  const l = await leerLista(), h = l.f[rel], c = await caches.open(JUEGO);
  if (h) { const g = await c.match(clave(rel, h)); if (g) return g; }
  try {
    const r = await fetch(req);
    if (h && r.status === 200) await c.put(clave(rel, h), r.clone()).catch(() => {});
    return r;
  } catch (e) {
    const viejo = await c.match(raiz() + rel, { ignoreSearch: true });
    if (viejo) return viejo;
    throw e;
  }
}

async function fuente(req) {
  const c = await caches.open(FUENTES), g = await c.match(req);
  const red = fetch(req).then((r) => { if (r.ok || r.type === 'opaque') c.put(req, r.clone()).catch(() => {}); return r; }).catch(() => null);
  return g || (await red) || Response.error();
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') { e.respondWith(fuente(req)); return; }
  if (!url.href.startsWith(raiz())) return;
  if (req.headers.get('x-requiem')) return; // la descarga de la página va directo a la red
  const rel = decodeURIComponent(url.pathname.slice(new URL(raiz()).pathname.length));
  if (rel === 'version.json' || rel === 'lista.json' || rel === 'sw.js') return;
  if (rel.startsWith('luz/')) return; // (la versión con luz avanzada tiene su propio service worker en /luz/)
  if (req.mode === 'navigate' || rel === '' || rel === 'index.html') { e.respondWith(pagina(req)); return; }
  e.respondWith(archivo(rel, req));
});
