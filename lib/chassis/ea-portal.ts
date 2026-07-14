import type { HmacSessionConfig } from '@ea/portal-chassis/hmac';

/**
 * EA client portal tenant bindings for @ea/portal-chassis HMAC auth.
 *
 * Prefer SESSION_SECRET when set; otherwise ADMIN_SESSION_SECRET (same secret
 * magic-links already use). Production often has only ADMIN_SESSION_SECRET —
 * without a fallback, verify succeeds, cookie signing returns null / middleware
 * rejects the session, and the user lands back on login.
 */
export const EA_PORTAL_SESSION: HmacSessionConfig = {
  secretEnvKey: process.env.SESSION_SECRET?.trim() ? 'SESSION_SECRET' : 'ADMIN_SESSION_SECRET',
  devSecret: 'ea-portal-dev-secret-change-in-prod',
};

export const EA_PORTAL_COOKIE = 'ea_portal_session';
