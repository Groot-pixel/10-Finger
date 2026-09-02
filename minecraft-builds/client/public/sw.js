// Offline-Cache: Einmal besuchte Seiten (App-Shell, JS/CSS, Bilder) und
// Build-API-Antworten werden zwischengespeichert, damit besuchte Builds auch
// ohne Internetverbindung nutzbar sind.
const CACHE_NAME = 'craftguide-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  // API-Daten für Builds: Network-First mit Cache-Fallback (immer aktuell, wenn online)
  if (url.pathname.startsWith('/api/builds/') || url.pathname.startsWith('/api/categories') || url.pathname.startsWith('/api/tags')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        try {
          const res = await fetch(event.request);
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        } catch {
          const cached = await cache.match(event.request);
          return cached || Response.error();
        }
      }),
    );
    return;
  }

  // Andere API-Aufrufe (Auth, Kommentare, POST etc.) nie cachen
  if (url.pathname.startsWith('/api/')) return;

  // App-Shell, Bilder, Skripte, Styles: Cache-First mit Netzwerk-Fallback
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cached = await cache.match(event.request);
      if (cached) {
        fetch(event.request).then((res) => res.ok && cache.put(event.request, res.clone())).catch(() => {});
        return cached;
      }
      try {
        const res = await fetch(event.request);
        if (res.ok) cache.put(event.request, res.clone());
        return res;
      } catch {
        return caches.match('/index.html');
      }
    }),
  );
});
