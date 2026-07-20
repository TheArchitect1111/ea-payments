/* Simplifi capture PWA — minimal offline shell + queue flush hook */
const CACHE = 'simplifi-capture-v1';
const SHELL = ['/simplifi/capture', '/manifest-simplifi.json', '/simplifi-logo.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (!url.pathname.startsWith('/simplifi/capture')) return;

  event.respondWith(
    fetch(request).catch(() => caches.match(request).then((r) => r ?? caches.match('/simplifi/capture'))),
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data?.type === 'DUE_REMINDERS' && Array.isArray(event.data.items)) {
    const items = event.data.items;
    event.waitUntil(
      Promise.all(
        items.map((item) =>
          self.registration.showNotification(item.title || 'Follow-up due', {
            body: item.dueDate ? `Due ${item.dueDate}` : 'Open Simplifi Follow-ups',
            tag: `due-${item.id}`,
            data: { href: item.href || '/simplifi/follow-ups' },
            icon: '/simplifi-logo.png',
          }),
        ),
      ),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const href = event.notification.data?.href || '/simplifi/follow-ups';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate?.(href);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(href);
    }),
  );
});
