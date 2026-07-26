/**
 * Bounded retry policy for People Airtable operations (blueprint §10.4 / §10.5).
 *
 * - max 5 attempts per discrete operation (configurable ≤ 8)
 * - exponential backoff with jitter, capped at 30s
 * - exhaustion is terminal: fail closed, never loop (INV-19)
 */
import { peopleRetryMaxAttempts, peopleRetryMaxBackoffMs } from '@/lib/people/flags';
import {
  PeoplePersistError,
  isPeoplePersistError,
  peopleUnavailable,
} from '@/lib/people/errors';
import { incPeopleMetric } from '@/lib/people/metrics';

export type PeopleRetryClass = 'safe' | 'unsafe_without_reread' | 'terminal';

const RATE_LIMIT_PATTERN = /\b429\b|rate limit/i;
const TRANSIENT_PATTERN = /\b(408|500|502|503|504)\b|timeout|etimedout|econnreset|socket hang up|fetch failed|network/i;
const UNSAFE_PATTERN = /unknown 500|indeterminate/i;

/** §10.5 — safe to retry / unsafe without re-read / terminal. */
export function classifyPeopleError(error: unknown): PeopleRetryClass {
  if (isPeoplePersistError(error)) {
    if (error.code === 'conflict') return 'safe';
    if (error.code === 'unavailable') return error.retryable ? 'safe' : 'terminal';
    return 'terminal';
  }
  const message = error instanceof Error ? error.message : String(error);
  if (UNSAFE_PATTERN.test(message)) return 'unsafe_without_reread';
  if (RATE_LIMIT_PATTERN.test(message) || TRANSIENT_PATTERN.test(message)) return 'safe';
  return 'terminal';
}

export function isRateLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return RATE_LIMIT_PATTERN.test(message);
}

function backoffDelayMs(attempt: number, cap: number): number {
  const base = Math.min(cap, 250 * 2 ** (attempt - 1));
  const jitter = Math.random() * base * 0.25;
  return Math.min(cap, Math.floor(base + jitter));
}

function sleep(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export type PeopleRetryOptions = {
  /** Operation label for metrics — must not contain PII. */
  operation: string;
  maxAttempts?: number;
  maxBackoffMs?: number;
  /**
   * Called before a retry when the previous failure was classified
   * `unsafe_without_reread` — re-read by idempotency key instead of re-creating.
   */
  onUnsafeRetry?: () => Promise<void> | void;
};

/**
 * Runs `fn` with bounded retries. Exhaustion throws a terminal
 * `PeoplePersistError('unavailable')` so callers fail closed.
 */
export async function withPeopleRetry<T>(
  fn: (attempt: number) => Promise<T>,
  options: PeopleRetryOptions,
): Promise<T> {
  const maxAttempts = Math.max(1, options.maxAttempts ?? peopleRetryMaxAttempts());
  const cap = options.maxBackoffMs ?? peopleRetryMaxBackoffMs();
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (isRateLimitError(error)) incPeopleMetric('people_airtable_429', options.operation);
      const klass = classifyPeopleError(error);
      if (klass === 'terminal' || attempt >= maxAttempts) break;
      if (klass === 'unsafe_without_reread' && options.onUnsafeRetry) {
        await options.onUnsafeRetry();
      }
      incPeopleMetric('people_airtable_retry', options.operation);
      await sleep(backoffDelayMs(attempt, cap));
    }
  }

  incPeopleMetric('people_airtable_retry_exhausted', options.operation);
  if (isPeoplePersistError(lastError)) {
    // Preserve conflict/validation semantics; only transport exhaustion becomes 503.
    if (lastError.code !== 'unavailable') throw lastError;
    throw new PeoplePersistError('unavailable', lastError.message, {
      retryable: false,
      details: { operation: options.operation, exhausted: true },
    });
  }
  const message = lastError instanceof Error ? lastError.message : String(lastError);
  throw peopleUnavailable(`People operation ${options.operation} failed: ${message}`, {
    operation: options.operation,
    exhausted: true,
  });
}
