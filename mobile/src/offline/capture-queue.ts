import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const STORAGE_KEY = '@simplifi/offline-capture-queue';
const PHOTO_DIR = `${FileSystem.documentDirectory ?? ''}offline-captures/`;

export type QueuedCapture =
  | {
      id: string;
      kind: 'url';
      url: string;
      prospectName?: string;
      notes?: string;
      queuedAt: string;
    }
  | {
      id: string;
      kind: 'photo';
      uri: string;
      name: string;
      type: string;
      prospectName?: string;
      notes?: string;
      queuedAt: string;
    };

function newId(): string {
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function readQueue(): Promise<QueuedCapture[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedCapture[];
  } catch {
    return [];
  }
}

async function writeQueue(items: QueuedCapture[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function ensurePhotoDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }
}

export async function listQueuedCaptures(): Promise<QueuedCapture[]> {
  const items = await readQueue();
  return items.sort((a, b) => a.queuedAt.localeCompare(b.queuedAt));
}

export async function enqueueUrlCapture(input: {
  url: string;
  prospectName?: string;
  notes?: string;
}): Promise<string> {
  const id = newId();
  const entry: QueuedCapture = {
    id,
    kind: 'url',
    url: input.url,
    prospectName: input.prospectName,
    notes: input.notes,
    queuedAt: new Date().toISOString(),
  };
  const queue = await readQueue();
  queue.push(entry);
  await writeQueue(queue);
  return id;
}

export async function enqueuePhotoCapture(
  file: { uri: string; name: string; type: string },
  fields?: { prospectName?: string; notes?: string },
): Promise<string> {
  await ensurePhotoDir();
  const id = newId();
  const ext = file.name.includes('.') ? file.name.split('.').pop() : 'jpg';
  const dest = `${PHOTO_DIR}${id}.${ext}`;
  await FileSystem.copyAsync({ from: file.uri, to: dest });

  const entry: QueuedCapture = {
    id,
    kind: 'photo',
    uri: dest,
    name: file.name,
    type: file.type,
    prospectName: fields?.prospectName,
    notes: fields?.notes,
    queuedAt: new Date().toISOString(),
  };
  const queue = await readQueue();
  queue.push(entry);
  await writeQueue(queue);
  return id;
}

async function deleteQueuedPhoto(item: QueuedCapture): Promise<void> {
  if (item.kind !== 'photo') return;
  try {
    const info = await FileSystem.getInfoAsync(item.uri);
    if (info.exists) {
      await FileSystem.deleteAsync(item.uri, { idempotent: true });
    }
  } catch {
    // ignore cleanup errors
  }
}

export async function removeQueuedCapture(id: string): Promise<void> {
  const queue = await readQueue();
  const item = queue.find((entry) => entry.id === id);
  if (item) await deleteQueuedPhoto(item);
  await writeQueue(queue.filter((entry) => entry.id !== id));
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
