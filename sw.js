/* Camping 2026 service worker v11 — resilient.
   App files: network-first (always fresh on deploy), cache fallback offline.
   CDN libs: cache-first but only ever cache a valid 200 response (never a broken one).
   Never caches partial/error responses that could freeze the app. */
const CACHE = 'camping2026-v22';
const CORE = ['./','./index.html','./app.js','./i18n.js','./config.js','./manifest.webmanifest',
  './icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon.png',
  './maps/plage.jpg','./maps/ivy.jpg'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.allSettled(CORE.map(u => c.add(u)))).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.hostname.endsWith('supabase.co')) return; // never touch API/auth calls

  if (url.origin === location.origin) {
    // App files: network-first; only cache valid responses; fall back to cache offline.
    e.respondWith(
      fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() =>
        caches.match(req, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html'))
      )
    );
  } else if (url.hostname.includes('jsdelivr') || url.hostname.includes('fonts')) {
    // CDN libs/fonts: serve cache if present, else fetch and cache ONLY if a clean 200.
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          // only store genuinely successful responses; opaque (CORS) we pass through but don't trust-cache app-critically
          if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
        }
        return res;
      }).catch(() => hit))
    );
  }
});
