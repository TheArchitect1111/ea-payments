export type ReliabilityErrorClass = 'AUTH' | 'BILLING' | 'QUOTA' | 'RATE_LIMIT' | 'TIMEOUT' | 'TRANSIENT' | 'PERMANENT';

export type RetryPolicy = {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  jitterRatio: number;
};

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 5,
  baseDelayMs: 5_000,
  maxDelayMs: 15 * 60_000,
  jitterRatio: 0.2,
};

export function classifyReliabilityError(error: unknown): ReliabilityErrorClass {
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error ?? '');
  const value = text.toLowerCase();
  if (/401|403|unauthori|forbidden|invalid api key|invalid.*token|auth/.test(value)) return 'AUTH';
  if (/billing|payment|required|card|credit/.test(value)) return 'BILLING';
  if (/quota|insufficient_quota|usage limit/.test(value)) return 'QUOTA';
  if (/429|rate.?limit|too many requests/.test(value)) return 'RATE_LIMIT';
  if (/timeout|timed out|deadline|etimedout/.test(value)) return 'TIMEOUT';
  if (/5\d\d|econnreset|econnrefused|fetch failed|network|temporar/.test(value)) return 'TRANSIENT';
  return 'PERMANENT';
}

export function isRetryableErrorClass(kind: ReliabilityErrorClass): boolean {
  return kind === 'RATE_LIMIT' || kind === 'TIMEOUT' || kind === 'TRANSIENT';
}

export function computeBackoffMs(attempt: number, policy: RetryPolicy = DEFAULT_RETRY_POLICY): number {
  const exponent = Math.max(0, attempt - 1);
  const raw = Math.min(policy.maxDelayMs, policy.baseDelayMs * 2 ** exponent);
  const jitter = raw * policy.jitterRatio;
  return Math.max(0, Math.round(raw - jitter + Math.random() * jitter * 2));
}

export function nextAttemptAt(attempt: number, now = Date.now(), policy: RetryPolicy = DEFAULT_RETRY_POLICY): string {
  return new Date(now + computeBackoffMs(attempt, policy)).toISOString();
}

export function idempotencyKey(parts: Array<string | number | null | undefined>): string {
  return parts.map((part) => String(part ?? '')).join(':').replace(/\s+/g, '-').toLowerCase();
}

export type CircuitState = {
  failures: number;
  openedAt?: string;
  openUntil?: string;
};

export function updateCircuitAfterFailure(
  current: CircuitState | undefined,
  now = Date.now(),
  threshold = 3,
  cooldownMs = 60_000,
): CircuitState {
  const failures = (current?.failures ?? 0) + 1;
  if (failures < threshold) return { failures };
  const openedAt = new Date(now).toISOString();
  return { failures, openedAt, openUntil: new Date(now + cooldownMs).toISOString() };
}

export function circuitOpen(state: CircuitState | undefined, now = Date.now()): boolean {
  if (!state?.openUntil) return false;
  return new Date(state.openUntil).getTime() > now;
}
