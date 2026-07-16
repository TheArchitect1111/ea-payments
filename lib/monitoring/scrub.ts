/**
 * Scrub secrets / payment / PII-ish fields before events leave the process.
 * Monitoring must never ship passwords, tokens, Stripe payloads, or secrets.
 */

const SENSITIVE_KEY =
  /pass(word)?|secret|token|authorization|cookie|api[_-]?key|stripe|card|cvv|ssn|account[_-]?number|private[_-]?key|bearer/i;

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY.test(key)) return '[Filtered]';
  if (typeof value === 'string' && value.length > 8000) return `${value.slice(0, 8000)}…[truncated]`;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return scrubRecord(value as Record<string, unknown>);
  }
  if (Array.isArray(value)) {
    return value.map((item, index) => scrubValue(String(index), item));
  }
  return value;
}

export function scrubRecord(input: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[key] = scrubValue(key, value);
  }
  return out;
}

export function scrubMonitoringEvent<T extends { request?: unknown; extra?: unknown; contexts?: unknown }>(
  event: T,
): T {
  try {
    if (event.request && typeof event.request === 'object') {
      const req = event.request as Record<string, unknown>;
      if (req.headers && typeof req.headers === 'object') {
        req.headers = scrubRecord(req.headers as Record<string, unknown>);
      }
      if (req.data && typeof req.data === 'object') {
        req.data = scrubRecord(req.data as Record<string, unknown>);
      }
      if (req.cookies) req.cookies = '[Filtered]';
    }
    if (event.extra && typeof event.extra === 'object') {
      event.extra = scrubRecord(event.extra as Record<string, unknown>);
    }
  } catch {
    // Scrubbing must never break capture.
  }
  return event;
}
