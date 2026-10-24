// BAL WALA Progressive Web App Service Worker (Supporting Root, /customer, and /collector PWAs)
const CACHE_NAME = 'bal-wala-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/manifest-customer.json',
  '/manifest-collector.json',
  '/icon.svg',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Never cache or intercept API endpoints
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  // 2. Sensitive Admin Route: Network-Only (Never cache /admin in Service Worker)
  if (url.pathname === '/admin' || url.pathname.startsWith('/admin/')) {
    return; // Pass directly to network
  }

  // 3. Navigation requests for /customer, /collector, or root
  if (event.request.mode === 'navigate') {
    // Network first for HTML navigation to ensure fresh application shell and correct routing
    event.respondWith(
      fetch(event.request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // 4. Static assets (JS, CSS, SVGs, Fonts)
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});

// Push notification receiver supporting standard Web Push and Firebase Cloud Messaging
self.addEventListener('push', (event) => {
  let title = 'BAL WALA';
  let body = 'आपके लिए नया अपडेट है।';
  let url = '/';
  let icon = '/icon.svg';

  try {
    if (event.data) {
      const payload = event.data.json();
      if (payload.notification) {
        title = payload.notification.title || title;
        body = payload.notification.body || body;
        icon = payload.notification.icon || icon;
      }
      if (payload.data) {
        title = payload.data.title || title;
        body = payload.data.body || body;
        url = payload.data.url || payload.data.click_action || url;
      }
    }
  } catch (e) {
    try {
      body = event.data.text() || body;
    } catch (_) {}
  }

  const options = {
    body,
    icon,
    badge: '/icon.svg',
    vibrate: [100, 50, 100],
    data: {
      url,
    },
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
