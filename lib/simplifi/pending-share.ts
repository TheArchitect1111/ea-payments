/**
 * Pending PWA share-target files (written by sw-simplifi-capture.js, read by Capture).
 */

const DB_NAME = 'simplifi-share';
const STORE = 'pending';
const DB_VERSION = 1;
const PENDING_KEY = 'latest';

export type PendingSharedFile = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  queuedAt: string;
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

/** Read and clear the latest shared file (if any). */
export async function takePendingSharedFile(): Promise<PendingSharedFile | null> {
  if (typeof indexedDB === 'undefined') return null;
  const db = await openDb();
  try {
    const entry = await new Promise<PendingSharedFile | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      const getReq = store.get(PENDING_KEY);
      getReq.onsuccess = () => {
        const value = (getReq.result as PendingSharedFile | undefined) ?? null;
        if (value) store.delete(PENDING_KEY);
        resolve(value);
      };
      getReq.onerror = () => reject(getReq.error);
    });
    return entry;
  } finally {
    db.close();
  }
}

export async function hasPendingSharedFile(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  const db = await openDb();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).count();
      req.onsuccess = () => resolve((req.result ?? 0) > 0);
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
