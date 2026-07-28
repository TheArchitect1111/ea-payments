/**
 * Canonical legal + support URLs for Simplifi Orb (Google Play + in-app).
 * Keep in sync with lib/trust-engine/legal-pack.ts public routes.
 */
export const LEGAL_BASE_URL = 'https://efficiencyarchitects.online';

export const LEGAL_URLS = {
  privacy: `${LEGAL_BASE_URL}/legal/privacy`,
  terms: `${LEGAL_BASE_URL}/legal/terms`,
  eula: `${LEGAL_BASE_URL}/legal/eula`,
  aiDisclosure: `${LEGAL_BASE_URL}/legal/ai-disclosure`,
  support: `${LEGAL_BASE_URL}/legal/support`,
  accountDeletion: `${LEGAL_BASE_URL}/legal/account-deletion`,
  trust: `${LEGAL_BASE_URL}/trust`,
} as const;

export const SUPPORT_EMAIL = 'freedom@efficiencyarchitects.online';
export const SUPPORT_WEBSITE = LEGAL_BASE_URL;

/** SecureStore key — bump suffix if legal pack major version requires re-accept. */
export const LEGAL_ACCEPTANCE_KEY = 'simplifi_orb_legal_accepted_v1';

export const LEGAL_ACCEPTANCE_COPY = {
  title: 'Before you continue',
  body: 'By continuing you agree to the Simplifi Orb EULA, Terms of Service, Privacy Policy, and AI Disclosure.',
  checkbox: 'I agree to the EULA, Terms, Privacy Policy, and AI Disclosure',
  continue: 'Continue',
} as const;
