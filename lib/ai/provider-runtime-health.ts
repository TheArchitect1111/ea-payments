import { classifyReliabilityError, type ReliabilityErrorClass } from '@/lib/reliability/execution';

export type ProviderRuntimeStatus = 'HEALTHY' | 'AUTH' | 'BILLING' | 'QUOTA' | 'RATE_LIMIT' | 'DOWN' | 'UNKNOWN';

export type ProviderRuntimeHealth = {
  provider: string;
  status: ProviderRuntimeStatus;
  failures: number;
  lastFailureAt?: string;
  retryAfter?: string;
};

const state = new Map<string, ProviderRuntimeHealth>();

function mapErrorClass(kind: ReliabilityErrorClass): ProviderRuntimeStatus {
  if (kind === 'AUTH') return 'AUTH';
  if (kind === 'BILLING') return 'BILLING';
  if (kind === 'QUOTA') return 'QUOTA';
  if (kind === 'RATE_LIMIT') return 'RATE_LIMIT';
  if (kind === 'TIMEOUT' || kind === 'TRANSIENT') return 'DOWN';
  return 'DOWN';
}

export function markProviderSuccess(provider: string): ProviderRuntimeHealth {
  const next: ProviderRuntimeHealth = { provider, status: 'HEALTHY', failures: 0 };
  state.set(provider, next);
  return next;
}

export function markProviderFailure(provider: string, error: unknown, retryAfterMs?: number): ProviderRuntimeHealth {
  const current = state.get(provider);
  const now = Date.now();
  const next: ProviderRuntimeHealth = {
    provider,
    status: mapErrorClass(classifyReliabilityError(error)),
    failures: (current?.failures ?? 0) + 1,
    lastFailureAt: new Date(now).toISOString(),
    retryAfter: retryAfterMs ? new Date(now + retryAfterMs).toISOString() : undefined,
  };
  state.set(provider, next);
  return next;
}

export function getProviderRuntimeHealth(provider: string): ProviderRuntimeHealth {
  return state.get(provider) ?? { provider, status: 'UNKNOWN', failures: 0 };
}

export function providerUsable(provider: string, now = Date.now()): boolean {
  const current = getProviderRuntimeHealth(provider);
  if (current.status === 'HEALTHY' || current.status === 'UNKNOWN') return true;
  if (current.retryAfter && new Date(current.retryAfter).getTime() <= now) return true;
  return false;
}
