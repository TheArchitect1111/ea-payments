/**
 * UNIVERSAL_PEOPLE — default OFF (INV-17).
 * Set UNIVERSAL_PEOPLE=1|true|on|yes to enable People routes and provisioning hooks.
 *
 * Phase 2C: Persist ON means Postgres (`people` schema) is ready — not Airtable.
 * INV-20: in production/preview, People ON requires Persist ON — never a memory SoR.
 */
import { peopleIllegalFlag, peopleUnavailable } from '@/lib/people/errors';
import { isPeoplePostgresConfigured } from '@/lib/people/postgres-client';

function envOn(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'on' || raw === 'yes';
}

export function isUniversalPeopleEnabled(): boolean {
  return envOn('UNIVERSAL_PEOPLE');
}

/** UNIVERSAL_PEOPLE_PERSIST — default OFF. When ON with People ON → Postgres repository. */
export function isUniversalPeoplePersistEnabled(): boolean {
  return envOn('UNIVERSAL_PEOPLE_PERSIST');
}

/** UNIVERSAL_PEOPLE_MIGRATE_CLIENTS — default OFF. Gates the Client Record backfill job. */
export function isUniversalPeopleMigrateEnabled(): boolean {
  return envOn('UNIVERSAL_PEOPLE_MIGRATE_CLIENTS');
}

/** PEOPLE_CERT_MEMORY=1 — test/cert harness forces the memory adapter. Never set in production. */
export function isPeopleCertMemoryForced(): boolean {
  return envOn('PEOPLE_CERT_MEMORY');
}

/** PEOPLE_SHARED_MEMORY=1 — share the memory store on globalThis to simulate instances. */
export function isPeopleSharedMemoryEnabled(): boolean {
  return envOn('PEOPLE_SHARED_MEMORY');
}

/**
 * Production-grade runtime: Vercel production/preview deployments and any
 * NODE_ENV=production process. These environments are multi-instance, so a
 * process-memory store can never be the system of record.
 */
export function isPeopleProductionMode(): boolean {
  const vercelEnv = process.env.VERCEL_ENV?.trim().toLowerCase();
  if (vercelEnv === 'production' || vercelEnv === 'preview') return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * INV-20 — People surfaces are only allowed to run when the flag combination is legal.
 * People ON + Persist OFF in production/preview is illegal and must behave as OFF (404).
 */
export function isPeopleRuntimeAllowed(): boolean {
  if (!isUniversalPeopleEnabled()) return false;
  if (isPeopleProductionMode() && !isUniversalPeoplePersistEnabled()) return false;
  return true;
}

/** Explanation for the illegal combination, for redacted ops logs. */
export function peopleRuntimeDenyReason(): 'flag_off' | 'persist_required' | null {
  if (!isUniversalPeopleEnabled()) return 'flag_off';
  if (isPeopleRuntimeAllowed()) return null;
  return 'persist_required';
}

/**
 * INV-19 — when Persist is ON the People Postgres credentials must exist.
 * Missing credential is a dependency failure (503), never a silent memory fallback.
 * Never falls back to Airtable People SoR (INV-33).
 */
export function assertPeoplePersistReady(): void {
  if (!isUniversalPeoplePersistEnabled()) return;
  if (isPeopleCertMemoryForced() && !isPeopleProductionMode()) return;
  if (!isPeoplePostgresConfigured()) {
    throw peopleUnavailable(
      'People persistence enabled without PEOPLE_SUPABASE_URL / PEOPLE_SUPABASE_KEY',
    );
  }
}

/** Throws when People is ON with Persist OFF in a multi-instance environment (INV-20). */
export function assertPeopleRuntimeLegal(): void {
  if (!isUniversalPeopleEnabled()) return;
  if (isPeopleProductionMode() && !isUniversalPeoplePersistEnabled()) {
    throw peopleIllegalFlag(
      'UNIVERSAL_PEOPLE requires UNIVERSAL_PEOPLE_PERSIST in production/preview',
    );
  }
}

export function peopleMajorityAge(): number {
  const n = Number(process.env.PEOPLE_MAJORITY_AGE?.trim() || '18');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 18;
}

/** People adapter retry budget: max 5 attempts, configurable ≤ 8. */
export function peopleRetryMaxAttempts(): number {
  const raw = Number(process.env.PEOPLE_RETRY_MAX_ATTEMPTS?.trim() || '5');
  if (!Number.isFinite(raw) || raw < 1) return 5;
  return Math.min(Math.floor(raw), 8);
}

/** Backoff ceiling in milliseconds (cap 30s). */
export function peopleRetryMaxBackoffMs(): number {
  const raw = Number(process.env.PEOPLE_RETRY_MAX_BACKOFF_MS?.trim() || '30000');
  if (!Number.isFinite(raw) || raw < 0) return 30_000;
  return Math.min(Math.floor(raw), 30_000);
}
