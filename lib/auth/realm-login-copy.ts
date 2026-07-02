import type { MagicLinkRealm } from '@/lib/magic-link';

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

const DEFAULT_FORM: Pick<
  RealmLoginCopy,
  'cardSubtitle' | 'buttonLabel' | 'sentMessage' | 'sentDetail' | 'sendAnotherLabel' | 'emailPlaceholder'
> = {
  cardSubtitle: 'Enter your email on file. We will send a one-tap login link — no password needed.',
  buttonLabel: 'Email me a login link',
  sentMessage: 'Check your email — your login link is on the way.',
  sentDetail: 'Open the email on this device and tap Sign in. The link expires in 15 minutes.',
  sendAnotherLabel: 'Send another link',
  emailPlaceholder: 'you@company.com',
};

export const REALM_LOGIN_COPY: Record<MagicLinkRealm, RealmLoginCopy> = {
  simplifi: {
    eyebrow: 'Never Lose An Opportunity Again™',
    pageTitle: 'Welcome to Simplifi™',
    pageSubtitle:
      'Sign in to save opportunities, remember what matters, and follow up when the time is right.',
    cardTitle: 'Simplifi sign in',
    sentTitle: 'Simplifi sign in',
    ...DEFAULT_FORM,
  },
  portal: {
    pageTitle: 'Welcome to your portal',
    pageSubtitle: 'Your command center for tasks, documents, and progress.',
    cardTitle: 'Portal sign in',
    sentTitle: 'Portal sign in',
    ...DEFAULT_FORM,
  },
  admin: {
    pageTitle: 'Admin sign in',
    pageSubtitle: 'One email, one tap — no password to remember.',
    cardTitle: 'Admin sign in',
    sentTitle: 'Admin sign in',
    cardSubtitle: 'Enter your admin email. We will send a one-tap login link.',
    buttonLabel: 'Email me a login link',
    sentMessage: DEFAULT_FORM.sentMessage,
    sentDetail: DEFAULT_FORM.sentDetail,
    sendAnotherLabel: DEFAULT_FORM.sendAnotherLabel,
    emailPlaceholder: DEFAULT_FORM.emailPlaceholder,
  },
};

export function getRealmLoginCopy(realm: MagicLinkRealm): RealmLoginCopy {
  return REALM_LOGIN_COPY[realm];
}

export function magicLinkErrorMessage(
  realm: MagicLinkRealm,
  code: string | null | undefined,
): string | null {
  switch (code) {
    case 'expired':
      return 'That login link expired. Request a new one below.';
    case 'unauthorized':
      if (realm === 'admin') return 'That email is not registered as an EA admin.';
      if (realm === 'simplifi') return 'No Simplifi account matches that email.';
      return 'No account matches that email. Use the email from your welcome message.';
    case 'config':
      if (realm === 'admin') {
        return 'Admin login is not configured. Set ADMIN_SESSION_SECRET on Vercel Production.';
      }
      return 'Login is not configured. Contact support.';
    default:
      return null;
  }
}
