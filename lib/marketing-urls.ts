/**
 * Market-facing names and clean public URLs (no demo-client, no ea-payments in tester links).
 */
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export const PRODUCT_NAMES = {
  platform: 'Efficiency Architects',
  simplifiCapture: 'capture.efficiencyarchitects.app',
  amplifiShare: 'amplify.efficiencyarchitects.app',
  magnifiStory: 'story.efficiencyarchitects.app',
  pulseHub: 'pulse.efficiencyarchitects.app',
} as const;

const BASE = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? EA_PLATFORM_URL;

/** Links you send to real testers — product verb in path, not backend slug. */
export const PUBLIC_LINKS = {
  platform: BASE,
  /** Simplifi — Today's Brief (default home) */
  workspace: `${BASE}/simplifi/workspace`,
  /** Simplifi — quick capture */
  capture: `${BASE}/simplifi/capture`,
  /** Amplifi — social posting hub */
  amplify: `${BASE}/amplifi`,
  amplifi: `${BASE}/amplifi`,
  /** Magnifi — read a story (demo) */
  storyDemo: `${BASE}/story/selena`,
  /** Portal sign-in */
  signIn: `${BASE}/portal/login`,
  /** Install Amplifi browser button */
  installAmplifi: `${BASE}/amplifi/install`,
  start: `${BASE}/start`,
  /** One login → test every Simplifi + portal page */
  try: `${BASE}/try`,
} as const;

/** Future custom domains → same routes (add in Vercel Domains when ready). */
export const CUSTOM_DOMAIN_MAP: Record<string, string> = {
  'capture.efficiencyarchitects.online': '/capture',
  'amplify.efficiencyarchitects.online': '/amplifi',
  'story.efficiencyarchitects.online': '/story/selena',
  'pulse.efficiencyarchitects.online': '/portal/login?next=/portal/demo-client/pulse',
  // Portal vanity root is handled by lib/ctp-portal-host (rewrite /{slug} → /portal/{slug}).
};

export function resolveCustomDomainRedirect(host: string | null, pathname: string): string | null {
  if (!host || pathname !== '/') return null;
  const normalized = host.split(':')[0].toLowerCase();
  return CUSTOM_DOMAIN_MAP[normalized] ?? null;
}
