/**
 * Persist legal acceptance records (Trust Engine).
 * Prefers Airtable Client Records field when available; always mirrors to local audit log shape.
 */
import type { LegalAcceptanceRecord } from './types';

export type PersistLegalAcceptanceResult = {
  ok: boolean;
  records: LegalAcceptanceRecord[];
  error?: string;
};

/**
 * Serialize acceptance for Client Record / session storage.
 * Callers (onboarding APIs) should store `acceptanceJson` on the user/org record.
 */
export function serializeLegalAcceptance(records: LegalAcceptanceRecord[]): string {
  return JSON.stringify({
    schemaVersion: 1,
    acceptedAt: records[0]?.acceptedAt ?? new Date().toISOString(),
    items: records,
  });
}

export function parseLegalAcceptance(raw: string | undefined | null): LegalAcceptanceRecord[] {
  if (!raw?.trim()) return [];
  try {
    const parsed = JSON.parse(raw) as { items?: LegalAcceptanceRecord[] };
    return Array.isArray(parsed.items) ? parsed.items : [];
  } catch {
    return [];
  }
}

export function hasAcceptedVersion(
  records: LegalAcceptanceRecord[],
  docType: string,
  version: string,
): boolean {
  return records.some((r) => r.docType === docType && r.version === version);
}
