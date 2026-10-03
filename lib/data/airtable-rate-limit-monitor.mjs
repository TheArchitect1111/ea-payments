/**
 * Emits one structured warning when a warm runtime sees more than five Airtable
 * HTTP 429 responses in a rolling minute. Counts are process-local because Vercel
 * functions scale across isolated runtimes.
 */
export function createAirtableRateLimitMonitor({
  threshold = 5,
  windowMs = 60_000,
  now = () => Date.now(),
  warn = (event) => console.warn('[airtable-rate-limit-alert]', JSON.stringify(event)),
} = {}) {
  let timestamps = [];
  let lastAlertAt = null;

  return (url) => {
    const observedAt = now();
    timestamps = timestamps.filter((timestamp) => observedAt - timestamp < windowMs);
    timestamps.push(observedAt);

    if (timestamps.length <= threshold || (lastAlertAt !== null && observedAt - lastAlertAt < windowMs)) return;
    lastAlertAt = observedAt;

    let requestPath = 'unknown';
    try {
      requestPath = new URL(url).pathname.replace(/^\/v0\/[^/]+\//, '');
    } catch {}

    warn({
      event: 'airtable_rate_limit_threshold_exceeded',
      level: 'warn',
      count: timestamps.length,
      threshold,
      windowMs,
      requestPath,
      observedAt: new Date(observedAt).toISOString(),
    });
  };
}
