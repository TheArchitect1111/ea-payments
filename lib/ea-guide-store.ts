import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import type { EscalationRecord, GuideProgress } from './ea-guide-types';

export type EAGuideStoreData = {
  version: number;
  updatedAt: string;
  progress: GuideProgress[];
  escalations: EscalationRecord[];
};

const DEFAULT_STORE: EAGuideStoreData = {
  version: 0,
  updatedAt: '',
  progress: [],
  escalations: [],
};

const STORE_FILE = process.env.VERCEL
  ? path.join(os.tmpdir(), 'ea-guide-store.json')
  : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'ea-guide-store.json');

export async function readEAGuideStore(): Promise<EAGuideStoreData> {
  try {
    const raw = await readFile(STORE_FILE, 'utf8');
    return normalizeStore(JSON.parse(raw) as Partial<EAGuideStoreData>);
  } catch {
    return structuredClone(DEFAULT_STORE);
  }
}

export async function writeEAGuideStore(data: EAGuideStoreData): Promise<void> {
  await mkdir(path.dirname(STORE_FILE), { recursive: true });
  await writeFile(STORE_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
}

export async function updateEAGuideStore(
  mutator: (data: EAGuideStoreData) => void | Promise<void>,
): Promise<EAGuideStoreData> {
  const data = await readEAGuideStore();
  await mutator(data);
  data.version += 1;
  data.updatedAt = new Date().toISOString();
  await writeEAGuideStore(data);
  return data;
}

export async function upsertGuideProgress(entry: GuideProgress): Promise<GuideProgress> {
  await updateEAGuideStore((data) => {
    const index = data.progress.findIndex(
      (row) => row.userId === entry.userId && row.tourId === entry.tourId,
    );
    if (index >= 0) data.progress[index] = { ...data.progress[index], ...entry };
    else data.progress.push(entry);
  });
  return entry;
}

export async function listGuideProgress(userId: string): Promise<GuideProgress[]> {
  const store = await readEAGuideStore();
  return store.progress.filter((row) => row.userId === userId);
}

export async function createEscalation(record: EscalationRecord): Promise<EscalationRecord> {
  await updateEAGuideStore((data) => {
    data.escalations.unshift(record);
    if (data.escalations.length > 500) data.escalations.length = 500;
  });
  return record;
}

export async function listEscalations(limit = 50): Promise<EscalationRecord[]> {
  const store = await readEAGuideStore();
  return store.escalations.slice(0, limit);
}

function normalizeStore(parsed: Partial<EAGuideStoreData>): EAGuideStoreData {
  return {
    version: Number.isFinite(parsed.version) ? Number(parsed.version) : 0,
    updatedAt: typeof parsed.updatedAt === 'string' ? parsed.updatedAt : '',
    progress: Array.isArray(parsed.progress) ? parsed.progress : [],
    escalations: Array.isArray(parsed.escalations) ? parsed.escalations : [],
  };
}
