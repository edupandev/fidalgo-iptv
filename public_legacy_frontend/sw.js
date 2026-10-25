// FIDAL GO — Service Worker (Always Fresh)
const CACHE_NAME = 'fidal-go-v25';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  if (
    url.includes('/api/') ||
    url.includes('.m3u8') ||
    url.includes('/stream/') ||
    url.includes('.apk') ||
    url.endsWith('/apk') ||
    url.includes('FIDAL_GO_TV')
  ) {
    return;
  }
  // Sempre busca da rede primeiro
  event.respondWith(
    fetch(event.request, { cache: 'no-store' }).catch(() => caches.match(event.request))
  );
});
