/**
 * Canonical Calendly URL for CTP Opportunity Review booking.
 */
export function ctpCalendlyUrl(): string {
  return (
    process.env.CALENDLY_URL?.trim() ||
    'https://calendly.com/freedom-efficiencyarchitects/30min'
  );
}
