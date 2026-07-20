/* Simplifi capture PWA — offline shell, share-target POST, due reminders */
const CACHE = 'simplifi-capture-v2';
const SHELL = ['/simplifi/capture', '/manifest-simplifi.json', '/simplifi-logo.png'];
const SHARE_DB = 'simplifi-share';
const SHARE_STORE = 'pending';
const SHARE_KEY = 'latest';

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

function openShareDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(SHARE_DB, 1);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SHARE_STORE)) {
        db.createObjectStore(SHARE_STORE, { keyPath: 'id' });
      }
    };
  });
}

async function stashSharedFile(file) {
  const db = await openShareDb();
  await new Promise((resolve, reject) => {
    const tx = db.transaction(SHARE_STORE, 'readwrite');
    tx.objectStore(SHARE_STORE).put({
      id: SHARE_KEY,
      name: file.name || 'shared-image.jpg',
      type: file.type || 'application/octet-stream',
      blob: file,
      queuedAt: new Date().toISOString(),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function handleShareTargetPost(request) {
  const formData = await request.formData();
  const title = String(formData.get('title') || '').trim();
  const text = String(formData.get('text') || '').trim();
  const shareUrl = String(formData.get('url') || '').trim();
  const media = formData.getAll('media').filter((f) => f && typeof f === 'object' && 'size' in f && f.size > 0);

  let hasFile = false;
  if (media[0]) {
    await stashSharedFile(media[0]);
    hasFile = true;
  }

  const params = new URLSearchParams();
  if (title) params.set('title', title.slice(0, 500));
  if (text) params.set('text', text.slice(0, 2000));
  if (shareUrl) params.set('url', shareUrl.slice(0, 2000));
  if (hasFile) params.set('sharedFile', '1');

  const target = `/simplifi/capture${params.toString() ? `?${params}` : ''}`;
  return Response.redirect(new URL(target, self.location.origin).href, 303);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method === 'POST' && url.pathname === '/simplifi/share-target') {
    event.respondWith(handleShareTargetPost(request));
    return;
  }

  if (request.method !== 'GET') return;
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
