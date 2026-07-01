import {
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
} from '@/lib/platform-store';

const READS_TABLE =
  process.env.AIRTABLE_NOTIFICATION_READS_TABLE?.trim() || 'Notification Reads';

type ReadRecord = {
  id: string;
  slug: string;
  email: string;
  keys: Set<string>;
};

const memoryCache = new Map<string, ReadRecord>();

function cacheKey(slug: string, email: string): string {
  return `${slug}:${email.toLowerCase()}`;
}

function parseKeys(raw: unknown): Set<string> {
  if (!raw || typeof raw !== 'string') return new Set();
  try {
    const parsed = JSON.parse(raw) as string[];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

async function loadRecord(slug: string, email: string): Promise<ReadRecord> {
  const key = cacheKey(slug, email);
  const cached = memoryCache.get(key);
  if (cached) return cached;

  const empty: ReadRecord = { id: '', slug, email, keys: new Set() };
  if (!platformStoreConfigured()) {
    memoryCache.set(key, empty);
    return empty;
  }

  const formula = `AND({Portal Slug}='${slug.replace(/'/g, "\\'")}', {Email}='${email.replace(/'/g, "\\'")}')`;
  const rows = await platformQuery(READS_TABLE, formula, 1);
  const row = rows[0];
  if (!row) {
    memoryCache.set(key, empty);
    return empty;
  }

  const record: ReadRecord = {
    id: row.id,
    slug,
    email,
    keys: parseKeys(row.fields['Read Keys']),
  };
  memoryCache.set(key, record);
  return record;
}

async function saveRecord(record: ReadRecord): Promise<void> {
  const key = cacheKey(record.slug, record.email);
  memoryCache.set(key, record);

  if (!platformStoreConfigured()) return;

  const fields = {
    'Portal Slug': record.slug,
    Email: record.email,
    'Read Keys': JSON.stringify([...record.keys]),
  };

  if (record.id) {
    await platformUpdate(READS_TABLE, record.id, fields);
    return;
  }

  const created = await platformCreate(READS_TABLE, fields);
  if (created) {
    record.id = created.id;
    memoryCache.set(key, record);
  }
}

export async function getReadNotificationKeys(slug: string, email: string): Promise<Set<string>> {
  const record = await loadRecord(slug, email);
  return new Set(record.keys);
}

export async function markNotificationKeysRead(
  slug: string,
  email: string,
  ids: string[],
): Promise<number> {
  if (ids.length === 0) return 0;
  const record = await loadRecord(slug, email);
  let added = 0;
  for (const id of ids) {
    if (!record.keys.has(id)) {
      record.keys.add(id);
      added += 1;
    }
  }
  if (added > 0) await saveRecord(record);
  return added;
}

export async function markAllNotificationsRead(
  slug: string,
  email: string,
  allIds: string[],
): Promise<number> {
  return markNotificationKeysRead(slug, email, allIds);
}
