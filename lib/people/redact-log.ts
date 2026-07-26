/**
 * INV-25 — logs, job meta, and metrics use the same redaction posture as exports.
 * Never log raw DOB, full email lists, phone numbers, or legal names.
 */
import type { Person, PersonId } from '@/lib/people/types';

export type RedactedPersonLog = {
  id: PersonId;
  organizationId: string;
  lifecycleStatus: string;
  source: string;
  emailCount: number;
  phoneCount: number;
  hasDateOfBirth: boolean;
  isMinor: boolean | null;
  emailHint?: string;
  mergedIntoPersonId?: PersonId;
  updatedAt?: string;
};

/** Domain-only hint (`***@example.com`) so ops can correlate without seeing the local part. */
export function redactEmailForLogs(email?: string | null): string | undefined {
  const value = (email || '').trim().toLowerCase();
  if (!value) return undefined;
  const at = value.lastIndexOf('@');
  if (at <= 0) return '***';
  return `***@${value.slice(at + 1)}`;
}

export function redactPersonForLogs(person: Person | null | undefined): RedactedPersonLog | null {
  if (!person) return null;
  return {
    id: person.id,
    organizationId: person.organizationId,
    lifecycleStatus: person.lifecycleStatus,
    source: person.source,
    emailCount: person.emails?.length || 0,
    phoneCount: person.phones?.length || 0,
    hasDateOfBirth: Boolean(person.dateOfBirth),
    isMinor: typeof person.isMinor === 'boolean' ? person.isMinor : null,
    emailHint: redactEmailForLogs(person.emails?.[0]?.value),
    mergedIntoPersonId: person.mergedIntoPersonId,
    updatedAt: person.updatedAt,
  };
}

const SENSITIVE_KEYS = new Set([
  'dateofbirth',
  'dob',
  'birthdate',
  'legalname',
  'preferredname',
  'phone',
  'phones',
  'ssn',
  'address',
  'notes',
]);

const EMAIL_KEYS = new Set(['email', 'emails', 'actoremail', 'guardianemail', 'primaryemail']);

/**
 * Redact arbitrary job meta / error context before it reaches Airtable, logs, or tickets.
 * Values are flattened to audit-safe primitives.
 */
export function redactPeopleMeta(
  meta: Record<string, unknown> | undefined,
): Record<string, string | number | boolean | null> {
  const out: Record<string, string | number | boolean | null> = {};
  if (!meta) return out;
  for (const [key, value] of Object.entries(meta)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.has(lower)) {
      out[key] = value === undefined || value === null ? null : '[redacted]';
      continue;
    }
    if (EMAIL_KEYS.has(lower)) {
      out[key] = redactEmailForLogs(typeof value === 'string' ? value : '') ?? null;
      continue;
    }
    if (value === null || value === undefined) {
      out[key] = null;
      continue;
    }
    if (typeof value === 'string') {
      out[key] = value.includes('@') ? (redactEmailForLogs(value) ?? '[redacted]') : value.slice(0, 240);
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      out[key] = value;
      continue;
    }
    out[key] = '[object]';
  }
  return out;
}

/** Redacted console reporter for People failures (never raw error payloads with PII). */
export function logPeopleFailure(
  scope: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[people:${scope}]`, {
    message: message.slice(0, 300),
    ...redactPeopleMeta(meta),
  });
}
