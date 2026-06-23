/**
 * Skin Brief persistence — browser localStorage today.
 * Swap implementation for Airtable, Supabase, or Postgres without UI changes.
 */
import type { SkinBriefRecord } from './skin-factory';

export const SKIN_BRIEF_STORAGE_KEY = 'eaSkinBriefs';

export interface SkinBriefStore {
  list(): SkinBriefRecord[];
  get(id: string): SkinBriefRecord | null;
  save(record: SkinBriefRecord): SkinBriefRecord;
  update(id: string, patch: Partial<SkinBriefRecord>): SkinBriefRecord | null;
  remove(id: string): boolean;
}

export function createBrowserSkinBriefStore(): SkinBriefStore {
  function readAll(): SkinBriefRecord[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(SKIN_BRIEF_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as SkinBriefRecord[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function writeAll(records: SkinBriefRecord[]) {
    window.localStorage.setItem(SKIN_BRIEF_STORAGE_KEY, JSON.stringify(records));
  }

  return {
    list() {
      return readAll().sort((a, b) => b.updated_at.localeCompare(a.updated_at));
    },
    get(id) {
      return readAll().find((record) => record.id === id) ?? null;
    },
    save(record) {
      const records = readAll().filter((item) => item.id !== record.id);
      writeAll([record, ...records]);
      return record;
    },
    update(id, patch) {
      const records = readAll();
      const index = records.findIndex((item) => item.id === id);
      if (index < 0) return null;
      const next = {
        ...records[index],
        ...patch,
        updated_at: new Date().toISOString(),
      };
      records[index] = next;
      writeAll(records);
      return next;
    },
    remove(id) {
      const records = readAll();
      const next = records.filter((item) => item.id !== id);
      if (next.length === records.length) return false;
      writeAll(next);
      return true;
    },
  };
}

export function summarizeSkinBriefs(records: SkinBriefRecord[]) {
  return {
    total: records.length,
    draft: records.filter((r) => r.status === 'draft').length,
    needsReview: records.filter((r) => r.status === 'needs-review').length,
    approved: records.filter((r) => r.status === 'approved').length,
    revisionRequested: records.filter((r) => r.status === 'revision-requested').length,
    archived: records.filter((r) => r.status === 'archived').length,
  };
}
