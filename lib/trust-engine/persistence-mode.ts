/**
 * Persistence mode for Trust Engine legal data.
 * Production: Airtable required. Dev: optional local fallback when explicitly enabled.
 */
import { platformStoreConfigured } from '@/lib/platform-store';

export function trustEngineDevFallbackEnabled(): boolean {
  return process.env.TRUST_ENGINE_DEV_FALLBACK === '1';
}

export function trustEngineAirtableReady(): boolean {
  return platformStoreConfigured();
}

/** True when local .data fallback may be used (never in production). */
export function trustEngineAllowLocalFallback(): boolean {
  if (process.env.NODE_ENV === 'production') return false;
  return trustEngineDevFallbackEnabled() || !trustEngineAirtableReady();
}

/**
 * Production fail-safe: writes must not silently succeed without durable store.
 * Returns error message when persistence is unavailable.
 */
export function trustEnginePersistenceUnavailableReason(): string | null {
  if (trustEngineAirtableReady()) return null;
  if (trustEngineAllowLocalFallback()) return null;
  return 'Legal persistence unavailable: configure Airtable or set TRUST_ENGINE_DEV_FALLBACK=1 for local development.';
}

export const LEGAL_ACCEPTANCES_TABLE =
  process.env.AIRTABLE_LEGAL_ACCEPTANCES_TABLE?.trim() || 'Legal Acceptances';

export const LEGAL_AUDIT_EVENTS_TABLE =
  process.env.AIRTABLE_LEGAL_AUDIT_EVENTS_TABLE?.trim() || 'Legal Audit Events';
