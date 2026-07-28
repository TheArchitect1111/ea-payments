/**
 * Append-only legal audit timeline.
 * Airtable in production; local JSONL only when TRUST_ENGINE_DEV_FALLBACK=1 (non-production).
 */
import { randomUUID } from 'node:crypto';
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  airtableInsertAudit,
  airtableListAudit,
} from './airtable-legal-store';
import type { RecordLegalAuditInput } from './audit-types';
import {
  trustEngineAllowLocalFallback,
  trustEngineAirtableReady,
  trustEnginePersistenceUnavailableReason,
} from './persistence-mode';
import type { LegalAuditEvent } from './types';

export type { RecordLegalAuditInput } from './audit-types';

const memory: LegalAuditEvent[] = [];
const DATA_DIR = join(process.cwd(), '.data', 'trust-engine');
const AUDIT_FILE = join(DATA_DIR, 'legal-audit.jsonl');

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function hydrateFromDisk() {
  if (!trustEngineAllowLocalFallback()) return;
  if (memory.length > 0) return;
  if (!existsSync(AUDIT_FILE)) return;
  try {
    const lines = readFileSync(AUDIT_FILE, 'utf8').split('\n').filter(Boolean);
    for (const line of lines) {
      try {
        memory.push(JSON.parse(line) as LegalAuditEvent);
      } catch {
        // skip
      }
    }
  } catch {
    // ignore
  }
}

export async function recordLegalAuditEvent(
  input: RecordLegalAuditInput,
): Promise<LegalAuditEvent> {
  const event: LegalAuditEvent = {
    id: `la_${randomUUID().replace(/-/g, '').slice(0, 16)}`,
    at: new Date().toISOString(),
    ...input,
    metadata: {
      ...input.metadata,
      ...(input.clientId ? { clientId: input.clientId } : {}),
    },
  };

  if (trustEngineAirtableReady()) {
    const result = await airtableInsertAudit({
      ...input,
      id: event.id,
      at: event.at,
      clientId: input.clientId,
    });
    if (!result.ok) {
      throw new Error(result.error);
    }
    return result.event;
  }

  const unavailable = trustEnginePersistenceUnavailableReason();
  if (unavailable) {
    throw new Error(unavailable);
  }

  // Dev fallback only
  hydrateFromDisk();
  memory.push(event);
  try {
    ensureDir();
    appendFileSync(AUDIT_FILE, `${JSON.stringify(event)}\n`, 'utf8');
  } catch {
    // memory remains
  }
  return event;
}

export async function getLegalAuditHistory(opts?: {
  organizationId?: string;
  userId?: string;
  clientId?: string;
  limit?: number;
}): Promise<LegalAuditEvent[]> {
  if (trustEngineAirtableReady()) {
    return airtableListAudit(opts);
  }

  if (!trustEngineAllowLocalFallback()) {
    return [];
  }

  hydrateFromDisk();
  const limit = opts?.limit ?? 100;
  let rows = [...memory].reverse();
  if (opts?.organizationId) {
    rows = rows.filter((e) => e.organizationId === opts.organizationId);
  }
  if (opts?.userId) {
    rows = rows.filter((e) => e.userId === opts.userId);
  }
  if (opts?.clientId) {
    rows = rows.filter(
      (e) =>
        e.userId === opts.clientId ||
        e.metadata?.clientId === opts.clientId ||
        e.organizationId === opts.clientId,
    );
  }
  return rows.slice(0, limit);
}
