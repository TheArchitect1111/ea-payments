/**
 * Runtime version overlay — catalog SSOT remains LEGAL_DOCUMENT_PACK.
 * In-memory only on the server process. No node:fs (client-safe import graph).
 * Durable version changes ship via LEGAL_DOCUMENT_PACK in code deploys.
 */
import { LEGAL_DOCUMENT_PACK, getLegalDocument } from './legal-pack';
import type { TrustLegalDocType, TrustLegalDocument, UpcomingLegalRelease } from './types';

type OverlayState = {
  active: TrustLegalDocument[];
  upcoming: UpcomingLegalRelease[];
};

let state: OverlayState = { active: [], upcoming: [] };

export function getEffectiveLegalDocument(
  docType: TrustLegalDocType,
): TrustLegalDocument | undefined {
  const overlay = state.active.find((d) => d.docType === docType && d.status === 'active');
  if (overlay) return overlay;
  return getLegalDocument(docType);
}

export function listEffectiveLegalDocuments(): TrustLegalDocument[] {
  const byType = new Map<TrustLegalDocType, TrustLegalDocument>();
  for (const d of LEGAL_DOCUMENT_PACK) {
    if (d.status === 'active') byType.set(d.docType, d);
  }
  for (const d of state.active) {
    if (d.status === 'active') byType.set(d.docType, d);
  }
  return [...byType.values()];
}

export function listUpcomingLegalReleases(): UpcomingLegalRelease[] {
  return [...state.upcoming];
}

export function setUpcomingLegalReleases(releases: UpcomingLegalRelease[]) {
  state.upcoming = releases;
}

export type PublishLegalVersionInput = {
  docType: TrustLegalDocType;
  version: string;
  effectiveDate: string;
  sourcePath?: string;
  notes?: string;
};

export function publishLegalVersionOverlay(
  input: PublishLegalVersionInput,
): TrustLegalDocument {
  const base = getEffectiveLegalDocument(input.docType) ?? getLegalDocument(input.docType);
  if (!base) {
    throw new Error(`Unknown legal document type: ${input.docType}`);
  }

  state.active = state.active.map((d) =>
    d.docType === input.docType ? { ...d, status: 'superseded' as const } : d,
  );

  const next: TrustLegalDocument = {
    ...base,
    version: input.version,
    effectiveDate: input.effectiveDate,
    lastUpdated: input.effectiveDate,
    status: 'active',
    sourcePath: input.sourcePath ?? base.sourcePath,
  };
  state.active.push(next);
  state.upcoming = state.upcoming.filter((u) => u.docType !== input.docType);
  return next;
}
