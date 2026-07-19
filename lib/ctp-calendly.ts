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
