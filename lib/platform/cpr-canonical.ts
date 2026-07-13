/**
 * Canonical CPR production URLs.
 * Athletes/parents login ONLY on the CPR app — never EA /portal/cpr.
 */
import { EA_SATELLITE_URLS } from '@/lib/platform-urls';

/** Primary public CPR site (env default in CPR repo). */
export const CPR_SITE_URL =
  process.env.CPR_PORTAL_URL?.replace(/\/$/, '') ||
  process.env.NEXT_PUBLIC_CPR_SITE_URL?.replace(/\/$/, '') ||
  EA_SATELLITE_URLS.cpr;

/** Alias host — same deployment. Prefer CPR_SITE_URL in outward copy. */
export const CPR_SITE_URL_ALT = EA_SATELLITE_URLS.cprAlt;

/** Where athletes & parents MUST sign in. */
export const CPR_FAMILY_LOGIN_URL = `${CPR_SITE_URL}/portal/login`;

/** Where CPR staff / Coach Mike sign in. */
export const CPR_STAFF_LOGIN_URL = `${CPR_SITE_URL}/admin/login`;

/**
 * EA-platform surfaces that look like “CPR portal” but are NOT live family login.
 * Keep for marketing/demo; never send enrolled kids/parents here to “log in.”
 */
export const CPR_QUARANTINED_EA_PATHS = [
  '/portal/cpr',
  '/site/cpr',
  '/portal/login', // on EA host only — wrong for CPR families
] as const;
