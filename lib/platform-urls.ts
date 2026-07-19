/** Canonical production URLs for EA satellites — use in admin, health, and docs. */
export const EA_SATELLITE_URLS = {
  cpr: 'https://canadianprospectrecruitment.vercel.app',
  cprAlt: 'https://cpr-site.vercel.app',
  brotherHub: 'https://brother-hub.vercel.app',
  sisterHub: 'https://sister-hub.vercel.app',
} as const;

export const EA_PLATFORM_URL =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ??
  'https://efficiencyarchitects.online';

export const SIMPLIFI_PRODUCT_NAME = 'Simplifi';


/** Apex hub — www points at the CRA marketing project, not the portal. */
export const EA_APEX_URL = 'https://efficiencyarchitects.online';

/**
 * Force portal/email/API public origins onto the apex host.
 * www.efficiencyarchitects.online is the CRA marketing site (Visibility Scorecard).
 */
export function canonicalPlatformOrigin(raw?: string | null): string {
  const fallback = EA_APEX_URL;
  const base = String(raw || process.env.NEXT_PUBLIC_BASE_URL || process.env.EA_PLATFORM_URL || fallback)
    .trim()
    .replace(/\/$/, '');
  if (!base) return fallback;
  return base
    .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, EA_APEX_URL)
    .replace(/^https?:\/\/cc\.efficiencyarchitects\.online/i, EA_APEX_URL);
}
