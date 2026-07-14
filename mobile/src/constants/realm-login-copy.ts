/** Canonical production API host for Simplifi mobile. Keep in sync with lib/auth/realm-login-copy usage on web. */
export const CANONICAL_API_BASE_URL = 'https://ea-payments.vercel.app';

export type RealmLoginCopy = {
  eyebrow?: string;
  pageTitle: string;
  pageSubtitle: string;
  cardTitle: string;
  cardSubtitle: string;
  buttonLabel: string;
  sentTitle: string;
  sentMessage: string;
  sentDetail: string;
  sendAnotherLabel: string;
  emailPlaceholder: string;
};

/** Simplifi realm copy — mirror of lib/auth/realm-login-copy.ts (simplifi). */
export const SIMPLIFI_LOGIN_COPY: RealmLoginCopy = {
  eyebrow: 'Never Lose An Opportunity Again™',
  pageTitle: 'Welcome to Simplifi™',
  pageSubtitle:
    'Sign in to save opportunities, remember what matters, and follow up when the time is right.',
  cardTitle: 'Simplifi sign in',
  cardSubtitle:
    'Enter your email on file. We will send a one-tap login link — no password needed.',
  buttonLabel: 'Email me a login link',
  sentTitle: 'Simplifi sign in',
  sentMessage: 'Check your email — your login link is on the way.',
  sentDetail: 'Open the email on this device and tap Sign in. The link expires in 2 hours.',
  sendAnotherLabel: 'Send another link',
  emailPlaceholder: 'you@company.com',
};

export function magicLinkErrorMessage(code: string | null | undefined): string | null {
  switch (code) {
    case 'expired':
      return 'That login link expired. Request a new one below.';
    case 'invalid':
      return 'That login link is invalid. Request a new one below — use only the newest email.';
    case 'unauthorized':
      return 'No Simplifi account matches that email.';
    case 'config':
      return 'Login is not configured. Contact support.';
    default:
      return null;
  }
}
