const CACHE_NAME = 'reminder-app-v14-cloudflare';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/index.js',
  // '/assets/index.css', // Removed because we use Tailwind CDN and no local CSS is generated
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap',
  'https://www.soundjay.com/clock/sounds/alarm-clock-01.mp3',
  'https://ui-avatars.com/api/?name=R&background=DC2626&color=FBBF24&size=192&bold=true&length=1&font-size=0.7',
  'https://ui-avatars.com/api/?name=R&background=DC2626&color=FBBF24&size=512&bold=true&length=1&font-size=0.7'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(ASSETS).catch(err => {
            console.warn('Some assets failed to precache:', err);
        });
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors' && networkResponse.type !== 'opaque') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          try {
             cache.put(event.request, responseToCache);
          } catch (err) {
             console.warn('Failed to cache runtime request', err);
          }
        });
        return networkResponse;
      }).catch(() => {
        console.log('Offline fetch failed:', event.request.url);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});