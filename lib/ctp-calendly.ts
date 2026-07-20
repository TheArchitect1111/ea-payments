/**
 * Canonical Calendly URL for CTP Opportunity Review booking.
 */
export function ctpCalendlyUrl(): string {
  return (
    process.env.CALENDLY_URL?.trim() ||
    'https://calendly.com/freedom-efficiencyarchitects/30min'
  );
}

/** Append Calendly redirect_url so booking returns to an EA-branded confirmation. */
export function withCalendlyRedirect(calendlyUrl: string, redirectUrl: string): string {
  try {
    const u = new URL(calendlyUrl);
    u.searchParams.set('redirect_url', redirectUrl);
    return u.toString();
  } catch {
    return calendlyUrl;
  }
}

/**
 * Parse Calendly return query params into an ISO scheduled time.
 * Common keys: event_start_time, invitee_start_time, start_time.
 */
export function parseCalendlyScheduledAt(
  params: URLSearchParams | Record<string, string | string[] | undefined>,
): string | null {
  const get = (key: string): string | null => {
    if (params instanceof URLSearchParams) {
      return params.get(key);
    }
    const raw = params[key];
    if (Array.isArray(raw)) return raw[0] ?? null;
    return raw ?? null;
  };

  for (const key of ['event_start_time', 'invitee_start_time', 'start_time']) {
    const value = get(key)?.trim();
    if (!value) continue;
    const when = new Date(value);
    if (!Number.isNaN(when.getTime())) return when.toISOString();
  }
  return null;
}
