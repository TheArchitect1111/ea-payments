/**
 * Airtable persistence for Legal Acceptances + Legal Audit Events.
 * Uses existing platform-store / airtable-client — no second database abstraction.
 */
import { randomUUID } from 'node:crypto';
import {
  platformCreate,
  platformQuery,
  type AirtableRecord,
} from '@/lib/platform-store';
import { escapeAirtableString } from '@/lib/data/airtable-client';
import {
  LEGAL_ACCEPTANCES_TABLE,
  LEGAL_AUDIT_EVENTS_TABLE,
  trustEngineAirtableReady,
  trustEnginePersistenceUnavailableReason,
} from './persistence-mode';
import type {
  LegalAcceptanceRecord,
  LegalAuditEvent,
  LegalAuditEventType,
  TrustLegalDocType,
  TrustProductId,
} from './types';
import type { RecordLegalAuditInput } from './audit-types';

export type StoredLegalAcceptance = LegalAcceptanceRecord & {
  acceptanceId: string;
  clientId: string;
  organizationId: string;
  ipAddress?: string;
  userAgent?: string;
  source: string;
};

function str(fields: Record<string, unknown>, key: string): string {
  const v = fields[key];
  return typeof v === 'string' ? v : v != null ? String(v) : '';
}

export function acceptanceFromAirtable(row: AirtableRecord): StoredLegalAcceptance | null {
  const f = row.fields;
  const acceptanceId = str(f, 'Acceptance ID') || row.id;
  const userId = str(f, 'User ID');
  const clientId = str(f, 'Client ID');
  const docType = str(f, 'Document Type') as TrustLegalDocType;
  const version = str(f, 'Accepted Version');
  const acceptedAt = str(f, 'Accepted At');
  const productId = (str(f, 'Product') || 'portal_products') as TrustProductId;
  if (!userId || !clientId || !docType || !version || !acceptedAt) return null;
  return {
    acceptanceId,
    userId,
    clientId,
    organizationId: str(f, 'Organization ID') || clientId,
    productId,
    docType,
    version,
    acceptedAt,
    href: str(f, 'Href') || `/legal/${docType === 'tos' ? 'terms' : docType.replace(/_/g, '-')}`,
    ipAddress: str(f, 'IP Address') || undefined,
    userAgent: str(f, 'User Agent') || undefined,
    source: str(f, 'Source') || 'api',
  };
}

export function auditFromAirtable(row: AirtableRecord): LegalAuditEvent | null {
  const f = row.fields;
  const id = str(f, 'Event ID') || row.id;
  const type = str(f, 'Event Type') as LegalAuditEventType;
  const at = str(f, 'Timestamp');
  const userId = str(f, 'User ID') || 'unknown';
  const organizationId = str(f, 'Organization ID') || 'unknown';
  if (!type || !at) return null;
  let metadata: LegalAuditEvent['metadata'];
  const rawMeta = str(f, 'Metadata JSON');
  if (rawMeta) {
    try {
      metadata = JSON.parse(rawMeta) as LegalAuditEvent['metadata'];
    } catch {
      metadata = undefined;
    }
  }
  const clientId = str(f, 'Client ID');
  return {
    id,
    at,
    type,
    userId,
    organizationId,
    email: str(f, 'Email') || undefined,
    organizationName: str(f, 'Organization Name') || undefined,
    docType: (str(f, 'Document Type') as TrustLegalDocType) || undefined,
    version: str(f, 'Document Version') || undefined,
    productId: (str(f, 'Product') as TrustProductId) || undefined,
    ipAddress: str(f, 'IP Address') || undefined,
    summary: str(f, 'Summary') || type,
    metadata: {
      ...metadata,
      ...(clientId ? { clientId } : {}),
    },
  };
}

export async function airtableInsertAcceptance(
  row: StoredLegalAcceptance,
): Promise<{ ok: true; record: StoredLegalAcceptance } | { ok: false; error: string }> {
  const unavailable = trustEnginePersistenceUnavailableReason();
  if (unavailable && !trustEngineAirtableReady()) {
    return { ok: false, error: unavailable };
  }
  if (!trustEngineAirtableReady()) {
    return { ok: false, error: 'Airtable not configured' };
  }

  const created = await platformCreate(LEGAL_ACCEPTANCES_TABLE, {
    'Acceptance ID': row.acceptanceId,
    'User ID': row.userId,
    'Client ID': row.clientId,
    'Organization ID': row.organizationId,
    Product: row.productId,
    'Document Type': row.docType,
    'Accepted Version': row.version,
    'Accepted At': row.acceptedAt,
    ...(row.ipAddress ? { 'IP Address': row.ipAddress } : {}),
    ...(row.userAgent ? { 'User Agent': row.userAgent } : {}),
    Source: row.source,
    Href: row.href,
  });

  if (!created) {
    return { ok: false, error: 'Failed to persist legal acceptance to Airtable' };
  }
  return { ok: true, record: row };
}

export async function airtableFindAcceptanceDuplicate(input: {
  clientId: string;
  docType: TrustLegalDocType;
  version: string;
}): Promise<StoredLegalAcceptance | null> {
  if (!trustEngineAirtableReady()) return null;
  const formula = `AND({Client ID}='${escapeAirtableString(input.clientId)}',{Document Type}='${escapeAirtableString(input.docType)}',{Accepted Version}='${escapeAirtableString(input.version)}')`;
  const rows = await platformQuery(LEGAL_ACCEPTANCES_TABLE, formula, 1);
  if (!rows[0]) return null;
  return acceptanceFromAirtable(rows[0]);
}

export async function airtableListAcceptances(opts?: {
  clientId?: string;
  organizationId?: string;
  userId?: string;
  maxRecords?: number;
}): Promise<StoredLegalAcceptance[]> {
  if (!trustEngineAirtableReady()) return [];
  const parts: string[] = [];
  if (opts?.clientId) {
    parts.push(`{Client ID}='${escapeAirtableString(opts.clientId)}'`);
  }
  if (opts?.organizationId) {
    parts.push(`{Organization ID}='${escapeAirtableString(opts.organizationId)}'`);
  }
  if (opts?.userId) {
    parts.push(`{User ID}='${escapeAirtableString(opts.userId)}'`);
  }
  const formula = parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : `AND(${parts.join(',')})`;
  const rows = await platformQuery(
    LEGAL_ACCEPTANCES_TABLE,
    formula,
    opts?.maxRecords ?? 200,
  );
  return rows
    .map(acceptanceFromAirtable)
    .filter((r): r is StoredLegalAcceptance => Boolean(r))
    .sort((a, b) => a.acceptedAt.localeCompare(b.acceptedAt));
}

export async function airtableInsertAudit(
  input: RecordLegalAuditInput & { id?: string; at?: string; clientId?: string },
): Promise<{ ok: true; event: LegalAuditEvent } | { ok: false; error: string }> {
  const unavailable = trustEnginePersistenceUnavailableReason();
  if (unavailable && !trustEngineAirtableReady()) {
    return { ok: false, error: unavailable };
  }
  if (!trustEngineAirtableReady()) {
    return { ok: false, error: 'Airtable not configured' };
  }

  const event: LegalAuditEvent = {
    id: input.id ?? `la_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    at: input.at ?? new Date().toISOString(),
    type: input.type,
    userId: input.userId,
    email: input.email,
    organizationId: input.organizationId,
    organizationName: input.organizationName,
    docType: input.docType,
    version: input.version,
    productId: input.productId,
    ipAddress: input.ipAddress,
    summary: input.summary,
    metadata: {
      ...input.metadata,
      ...(input.clientId ? { clientId: input.clientId } : {}),
    },
  };

  const clientId =
    input.clientId ||
    (typeof input.metadata?.clientId === 'string' ? input.metadata.clientId : '') ||
    '';

  const created = await platformCreate(LEGAL_AUDIT_EVENTS_TABLE, {
    'Event ID': event.id,
    'Event Type': event.type,
    'User ID': event.userId,
    'Client ID': clientId,
    'Organization ID': event.organizationId,
    ...(event.productId ? { Product: event.productId } : {}),
    ...(event.docType ? { 'Document Type': event.docType } : {}),
    ...(event.version ? { 'Document Version': event.version } : {}),
    Timestamp: event.at,
    ...(event.ipAddress ? { 'IP Address': event.ipAddress } : {}),
    'Metadata JSON': JSON.stringify(event.metadata ?? {}),
    Summary: event.summary,
    ...(event.email ? { Email: event.email } : {}),
    ...(event.organizationName ? { 'Organization Name': event.organizationName } : {}),
  });

  if (!created) {
    return { ok: false, error: 'Failed to persist legal audit event to Airtable' };
  }
  return { ok: true, event };
}

export async function airtableListAudit(opts?: {
  organizationId?: string;
  userId?: string;
  clientId?: string;
  limit?: number;
}): Promise<LegalAuditEvent[]> {
  if (!trustEngineAirtableReady()) return [];
  const parts: string[] = [];
  if (opts?.organizationId) {
    parts.push(`{Organization ID}='${escapeAirtableString(opts.organizationId)}'`);
  }
  if (opts?.userId) {
    parts.push(`{User ID}='${escapeAirtableString(opts.userId)}'`);
  }
  if (opts?.clientId) {
    parts.push(`{Client ID}='${escapeAirtableString(opts.clientId)}'`);
  }
  const formula = parts.length === 0 ? undefined : parts.length === 1 ? parts[0] : `AND(${parts.join(',')})`;
  const rows = await platformQuery(LEGAL_AUDIT_EVENTS_TABLE, formula, opts?.limit ?? 100);
  return rows
    .map(auditFromAirtable)
    .filter((e): e is LegalAuditEvent => Boolean(e))
    .sort((a, b) => b.at.localeCompare(a.at));
}

export function newAcceptanceId(): string {
  return `acc_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}
