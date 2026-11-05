const CACHE = 'cp-panel-v3';
const ASSETS = ['./', 'index.html', 'manifest.webmanifest', 'vendor/supabase.js', 'config.js', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png', 'icons/favicon-16.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.allSettled(ASSETS.map(a => c.add(a))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

function networkFirst(req, key) {
  return fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(key || req, copy)); }
    return res;
  }).catch(() => caches.match(key || req));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return;
  if (req.mode === 'navigate') return e.respondWith(networkFirst(req, 'index.html'));
  if (url.pathname.endsWith('/config.js')) return e.respondWith(networkFirst(req));
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
    return res;
  })));
});
