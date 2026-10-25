// Tacos Mishos · service worker (permite instalar la app y abrir más rápido)
// Si cambias archivos de la página, no hace falta tocar esto: las páginas se piden primero a internet.
const CACHE = 'tm-shell-v1';
const SHELL = ['./', 'index.html', 'admin.html', 'supabase-config.js', 'manifest.webmanifest', 'admin.webmanifest', 'logo-96.png', 'logo-256.png', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => Promise.allSettled(SHELL.map(u => c.add(u)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // Supabase, mapas y CDN van directo a internet
  if (req.mode === 'navigate') { // páginas: primero internet (así siempre ves la versión nueva); sin señal, la guardada
    e.respondWith(fetch(req).then(r => { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); return r; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./'))));
    return;
  }
  e.respondWith(caches.match(req).then(hit => { // imágenes y archivos: rápido desde caché y se actualizan detrás
    const net = fetch(req).then(r => { if (r.ok) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(req, copy)); } return r; }).catch(() => hit);
    return hit || net;
  }));
});
