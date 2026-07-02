/**
 * Market-facing names and clean public URLs (no demo-client, no ea-payments in tester links).
 */
export const PRODUCT_NAMES = {
  platform: 'Efficiency Architects',
  simplifiCapture: 'capture.efficiencyarchitects.app',
  amplifiShare: 'amplify.efficiencyarchitects.app',
  magnifiStory: 'story.efficiencyarchitects.app',
  pulseHub: 'pulse.efficiencyarchitects.app',
} as const;

const BASE =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'https://ea-payments.vercel.app';

/** Links you send to real testers — product verb in path, not backend slug. */
export const PUBLIC_LINKS = {
  platform: BASE,
  /** Simplifi — capture an opportunity */
  capture: `${BASE}/capture`,
  /** Amplifi — social posting hub */
  amplify: `${BASE}/amplifi`,
  amplifi: `${BASE}/amplifi`,
  /** Magnifi — read a story (demo) */
  storyDemo: `${BASE}/story/selena`,
  /** Portal sign-in */
  signIn: `${BASE}/sign-in`,
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
  'pulse.efficiencyarchitects.online': '/sign-in?next=/pulse',
};

export function resolveCustomDomainRedirect(host: string | null, pathname: string): string | null {
  if (!host || pathname !== '/') return null;
  const normalized = host.split(':')[0].toLowerCase();
  return CUSTOM_DOMAIN_MAP[normalized] ?? null;
}
