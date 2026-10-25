// FIDAL GO — Service Worker
const CACHE_NAME = 'fidal-go-v10';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  // Ignora requisições de download do APK, stream de vídeo ou APIs dinâmicas
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
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
