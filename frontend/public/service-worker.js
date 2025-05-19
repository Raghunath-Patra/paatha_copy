// public/service-worker.js

// This version hash will be automatically replaced during build
const VERSION = 'BUILD_VERSION_HASH';

// Cache name with version to ensure proper invalidation
const CACHE_NAME = `paatha-cache-${VERSION}`;

// App shell files to cache on install
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/offline.html',  // Fallback page for when offline
  '/favicon.svg',
  '/favicon.ico',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache app shell files
self.addEventListener('install', (event) => {
  console.log(`[SW] Installing new service worker version: ${VERSION}`);
  
  // Skip waiting forces the waiting service worker to become the active service worker
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL_FILES);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`[SW] Activating new service worker version: ${VERSION}`);
  
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
  
  // Remove old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - network-first strategy with cache fallback
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  // For API requests, use network-only approach
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // For asset files like favicons and icons, use cache-first strategy
  if (
    event.request.url.includes('favicon.svg') ||
    event.request.url.includes('favicon.ico') ||
    event.request.url.includes('/icons/') ||
    event.request.url.includes('manifest.json')
  ) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        // If found in cache, use it
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Otherwise fetch from network and cache it
        return fetch(event.request).then((response) => {
          // Don't cache bad responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          
          // Clone the response as it can only be consumed once
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          
          return response;
        });
      })
    );
    return;
  }
  
  // For other requests, use network-first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses for future offline use
        if (response.ok) {
          const clonedResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, clonedResponse);
          });
        }
        return response;
      })
      .catch(() => {
        // When network fails, try from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // If the request is for an HTML page, show offline page
          if (event.request.headers.get('accept').includes('text/html')) {
            return caches.match('/offline.html');
          }
          
          // Otherwise, return a simple error response
          return new Response('Network error occurred', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});

// Listen for messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CHECK_VERSION') {
    // Respond with current version
    event.ports[0].postMessage({
      type: 'VERSION_INFO',
      version: VERSION
    });
  }
  
  // Add handler for clearing icon cache
  if (event.data && event.data.type === 'CLEAR_ICON_CACHE') {
    event.waitUntil(
      caches.open(CACHE_NAME).then((cache) => {
        // Remove icon files from cache
        return Promise.all([
          cache.delete('/favicon.svg'),
          cache.delete('/favicon.ico'),
          cache.delete('/icons/icon-192x192.png'),
          cache.delete('/icons/icon-512x512.png'),
          cache.delete('/manifest.json')
        ]).then(() => {
          // Notify the client that the cache was cleared
          if (event.ports && event.ports[0]) {
            event.ports[0].postMessage({
              type: 'ICON_CACHE_CLEARED'
            });
          }
        });
      })
    );
  }
});