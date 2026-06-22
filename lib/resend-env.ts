/** Expected: `local@domain.tld` or `Display Name <local@domain.tld>` */
export const RESEND_FROM_EMAIL_EXAMPLE = 'noreply@efficiencyarchitects.online';

export type ParsedResendFrom = {
  address: string;
  domain: string;
  parseError?: 'empty' | 'missing_at' | 'invalid_format';
};

export function parseResendFromEmail(raw: string | undefined): ParsedResendFrom | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;

  const bracket = trimmed.match(/<([^>]+)>/);
  const candidate = (bracket?.[1] ?? trimmed).trim().replace(/^["']|["']$/g, '');

  const at = candidate.lastIndexOf('@');
  if (at <= 0 || at >= candidate.length - 1) {
    return { address: candidate, domain: '', parseError: 'missing_at' };
  }

  const local = candidate.slice(0, at).trim();
  const domain = candidate
    .slice(at + 1)
    .trim()
    .toLowerCase()
    .replace(/[>,"'\s]+$/, '');

  const address = `${local}@${domain}`;
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(address)) {
    return { address, domain, parseError: 'invalid_format' };
  }

  return { address, domain };
}

export function resendFromEmailDiagnostic(raw: string | undefined): string {
  const parsed = parseResendFromEmail(raw);
  if (!parsed) return 'RESEND_FROM_EMAIL is not set.';
  if (parsed.parseError === 'missing_at') {
    return `RESEND_FROM_EMAIL must be a full email with @ (e.g. ${RESEND_FROM_EMAIL_EXAMPLE}). Current value has no @ symbol.`;
  }
  if (parsed.parseError === 'invalid_format') {
    return `RESEND_FROM_EMAIL format invalid. Use ${RESEND_FROM_EMAIL_EXAMPLE} or Name <${RESEND_FROM_EMAIL_EXAMPLE}>.`;
  }
  return `Parsed domain: ${parsed.domain}`;
}
