// This will be replaced by Workbox with the actual manifest
self.__WB_MANIFEST;

const CACHE_NAME = 'gul-autos-v3';
const STATIC_CACHE = 'gul-autos-static-v3';
const DYNAMIC_CACHE = 'gul-autos-dynamic-v3';

const urlsToCache = [
  '/',
  '/logos.png',
  '/manifest.webmanifest',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Opened static cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})));
      })
      .then(() => {
        console.log('Static resources cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip API calls and external resources
  if (url.pathname.startsWith('/api/') || !url.origin.includes(window.location.hostname)) {
    return;
  }

  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', request.url);
          return response;
        }

        // Otherwise fetch from network
        return fetch(request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();

            // Cache dynamic content
            caches.open(DYNAMIC_CACHE)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          })
          .catch((error) => {
            console.log('Fetch failed:', error);
            // Return offline page or fallback
            if (request.destination === 'document') {
              return caches.match('/');
            }
            throw error;
          });
      })
  );
});

// Handle background sync
self.addEventListener('sync', (event) => {
  console.log('Background sync triggered:', event.tag);
  // Handle background sync tasks here
});

// Handle push notifications
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  // Handle push notifications here
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  event.notification.close();
  // Handle notification click
  event.waitUntil(
    clients.openWindow('/')
  );
});
