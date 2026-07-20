/**
 * Client-side offline queue for Simplifi capture requests (PWA).
 * Supports URL captures and image Blobs (structured clone).
 */

const DB_NAME = 'simplifi-offline';
const STORE = 'capture-queue';
const DB_VERSION = 2;

export type QueuedCapture =
  | { id: string; kind: 'url'; url: string; prospectName?: string; notes?: string; queuedAt: string }
  | { id: string; kind: 'json'; body: Record<string, string>; queuedAt: string }
  | {
      id: string;
      kind: 'file';
      blob: Blob;
      fileName: string;
      mimeType: string;
      prospectName?: string;
      notes?: string;
      queuedAt: string;
    };

export type QueuedCaptureInput =
  | { kind: 'url'; url: string; prospectName?: string; notes?: string }
  | { kind: 'json'; body: Record<string, string> }
  | {
      kind: 'file';
      blob: Blob;
      fileName: string;
      mimeType: string;
      prospectName?: string;
      notes?: string;
    };

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
  });
}

export async function enqueueCapture(
  item: QueuedCaptureInput & { id?: string },
): Promise<string> {
  const id = item.id ?? `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const entry: QueuedCapture = {
    ...item,
    id,
    queuedAt: new Date().toISOString(),
  } as QueuedCapture;

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
  return id;
}

export async function listQueuedCaptures(): Promise<QueuedCapture[]> {
  const db = await openDb();
  const items = await new Promise<QueuedCapture[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve((req.result as QueuedCapture[]) ?? []);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

export async function removeQueuedCapture(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function flushCaptureQueue(
  submit: (item: QueuedCapture) => Promise<{ ok?: boolean }>,
): Promise<{ flushed: number; failed: number }> {
  const queue = await listQueuedCaptures();
  let flushed = 0;
  let failed = 0;
  for (const item of queue) {
    try {
      const result = await submit(item);
      if (result.ok) {
        await removeQueuedCapture(item.id);
        flushed += 1;
      } else {
        failed += 1;
      }
    } catch {
      failed += 1;
    }
  }
  return { flushed, failed };
}
