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
