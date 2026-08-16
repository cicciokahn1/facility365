/*
 * Dienstprogramm fuer den Offline-Betrieb.
 *
 * Programmdateien werden nach dem ersten Abruf aus dem Zwischenspeicher
 * bedient; Seitenaufrufe versuchen zuerst das Netz und fallen sonst auf die
 * zwischengespeicherte Fassung zurueck. Die Nutzdaten liegen ohnehin im
 * Browser, daher genuegt das fuer den vollstaendigen Offline-Betrieb.
 */
const CACHE = 'facility365-v1';
const OFFLINE_URL = '/dashboard';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE_URL, '/manifest.webmanifest'])),
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request).then((cached) => cached ?? caches.match(OFFLINE_URL))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(
      (cached) =>
        cached ??
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});

/*
 * Mitteilungen.
 *
 * Ein Klick oeffnet den Datensatz; laeuft die App bereits, wird das
 * bestehende Fenster verwendet. Der Push-Eintrag ist vorbereitet fuer den
 * spaeteren Versand ueber einen Server.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = (event.notification.data && event.notification.data.href) || '/dashboard';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const open = clients.find((client) => client.url.includes(self.location.origin));
      if (open) return open.focus().then(() => open.navigate(href));
      return self.clients.openWindow(href);
    }),
  );
});

self.addEventListener('push', (event) => {
  const payload = (() => {
    try {
      return event.data ? event.data.json() : {};
    } catch {
      return { title: 'Facility365', body: event.data ? event.data.text() : '' };
    }
  })();
  event.waitUntil(
    self.registration.showNotification(payload.title || 'Facility365', {
      body: payload.body || '',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      data: { href: payload.href || '/dashboard' },
    }),
  );
});
