/**
 * Simplifi user-curated watch list — Airtable-backed with in-memory fallback.
 */
import {
  escapeAirtableString,
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  platformUpdate,
} from '@/lib/platform-store';

const WATCH_TABLE =
  process.env.AIRTABLE_SIMPLIFI_WATCH_LIST_TABLE?.trim() || 'Simplifi Watch List';

export type WatchListKind = 'item' | 'interest';
export type WatchListStatus = 'watching' | 'paused' | 'archived';

export type WatchListRecord = {
  id: string;
  portalSlug: string;
  organizationId?: string;
  kind: WatchListKind;
  title: string;
  url?: string;
  category?: string;
  source?: string;
  notes?: string;
  status: WatchListStatus;
  createdAt: string;
  lastCheckedAt?: string;
};

export type CreateWatchListInput = {
  kind?: WatchListKind;
  title: string;
  url?: string;
  category?: string;
  source?: string;
  notes?: string;
  status?: WatchListStatus;
};

const memoryBySlug = new Map<string, WatchListRecord[]>();

function memoryList(portalSlug: string): WatchListRecord[] {
  const key = portalSlug.toLowerCase();
  if (!memoryBySlug.has(key)) memoryBySlug.set(key, []);
  return memoryBySlug.get(key)!;
}

function mapRow(row: { id: string; fields: Record<string, unknown> }): WatchListRecord {
  const kind = row.fields.Kind === 'interest' ? 'interest' : 'item';
  const statusRaw = String(row.fields.Status || 'watching');
  const status: WatchListStatus =
    statusRaw === 'paused' || statusRaw === 'archived' ? statusRaw : 'watching';
  return {
    id: row.id,
    portalSlug: String(row.fields['Portal Slug'] || ''),
    organizationId: row.fields['Organization ID']
      ? String(row.fields['Organization ID'])
      : undefined,
    kind,
    title: String(row.fields.Title || ''),
    url: row.fields.URL ? String(row.fields.URL) : undefined,
    category: row.fields.Category ? String(row.fields.Category) : undefined,
    source: row.fields.Source ? String(row.fields.Source) : undefined,
    notes: row.fields.Notes ? String(row.fields.Notes) : undefined,
    status,
    createdAt: String(row.fields['Created At'] || new Date().toISOString()),
    lastCheckedAt: row.fields['Last Checked At']
      ? String(row.fields['Last Checked At'])
      : undefined,
  };
}

export async function listWatchListItems(
  portalSlug: string,
  opts?: { kind?: WatchListKind; status?: WatchListStatus; limit?: number },
): Promise<WatchListRecord[]> {
  const slug = portalSlug.trim().toLowerCase();
  const limit = opts?.limit ?? 100;

  if (!platformStoreConfigured()) {
    return memoryList(slug)
      .filter((item) => {
        if (opts?.kind && item.kind !== opts.kind) return false;
        if (opts?.status) return item.status === opts.status;
        return item.status !== 'archived';
      })
      .slice(0, limit);
  }

  const parts = [`LOWER({Portal Slug})='${escapeAirtableString(slug)}'`];
  if (opts?.kind) parts.push(`{Kind}='${opts.kind}'`);
  if (opts?.status) {
    parts.push(`{Status}='${opts.status}'`);
  } else {
    parts.push(`{Status}!='archived'`);
  }
  const formula = `AND(${parts.join(',')})`;
  const rows = await platformQuery(WATCH_TABLE, formula, limit);
  return rows.map(mapRow);
}

export async function createWatchListItem(
  portalSlug: string,
  organizationId: string | undefined,
  input: CreateWatchListInput,
): Promise<WatchListRecord> {
  const slug = portalSlug.trim().toLowerCase();
  const title = input.title.trim();
  if (!title) throw new Error('Watch item title is required.');

  const record: WatchListRecord = {
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    portalSlug: slug,
    organizationId,
    kind: input.kind === 'interest' ? 'interest' : 'item',
    title,
    url: input.url?.trim() || undefined,
    category: input.category?.trim() || undefined,
    source: input.source?.trim() || undefined,
    notes: input.notes?.trim() || undefined,
    status: input.status ?? 'watching',
    createdAt: new Date().toISOString(),
  };

  if (!platformStoreConfigured()) {
    const list = memoryList(slug);
    list.unshift(record);
    memoryBySlug.set(slug, list.slice(0, 100));
    return record;
  }

  const fields: Record<string, string> = {
    'Portal Slug': slug,
    Kind: record.kind,
    Title: record.title,
    Status: record.status,
    'Created At': record.createdAt,
  };
  if (organizationId) fields['Organization ID'] = organizationId;
  if (record.url) fields.URL = record.url;
  if (record.category) fields.Category = record.category;
  if (record.source) fields.Source = record.source;
  if (record.notes) fields.Notes = record.notes;

  const created = await platformCreate(WATCH_TABLE, fields);
  if (!created) throw new Error('Could not create watch list item.');
  return mapRow(created);
}

export async function updateWatchListItem(
  portalSlug: string,
  id: string,
  patch: Partial<CreateWatchListInput> & { lastCheckedAt?: string },
): Promise<WatchListRecord | null> {
  const slug = portalSlug.trim().toLowerCase();

  if (!platformStoreConfigured()) {
    const list = memoryList(slug);
    const idx = list.findIndex((item) => item.id === id);
    if (idx < 0) return null;
    const next = {
      ...list[idx],
      ...patch,
      title: patch.title?.trim() || list[idx].title,
      url: patch.url !== undefined ? patch.url.trim() || undefined : list[idx].url,
    };
    list[idx] = next;
    return next;
  }

  const existing = await platformQuery(
    WATCH_TABLE,
    `AND(RECORD_ID()='${id.replace(/'/g, "\\'")}', LOWER({Portal Slug})='${escapeAirtableString(slug)}')`,
    1,
  );
  if (!existing[0]) return null;

  const fields: Record<string, string> = {};
  if (patch.title != null) fields.Title = patch.title.trim();
  if (patch.url != null) fields.URL = patch.url.trim();
  if (patch.category != null) fields.Category = patch.category.trim();
  if (patch.source != null) fields.Source = patch.source.trim();
  if (patch.notes != null) fields.Notes = patch.notes.trim();
  if (patch.status != null) fields.Status = patch.status;
  if (patch.kind != null) fields.Kind = patch.kind;
  if (patch.lastCheckedAt != null) fields['Last Checked At'] = patch.lastCheckedAt;

  const updated = await platformUpdate(WATCH_TABLE, id, fields);
  return updated ? mapRow(updated) : null;
}

export async function archiveWatchListItem(portalSlug: string, id: string): Promise<boolean> {
  const updated = await updateWatchListItem(portalSlug, id, { status: 'archived' });
  return Boolean(updated);
}
