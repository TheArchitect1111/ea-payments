import type { HmacSessionConfig } from '@ea/portal-chassis/hmac';

/**
 * EA client portal tenant bindings for @ea/portal-chassis HMAC auth.
 *
 * Always use ADMIN_SESSION_SECRET (same key as magic-links). A runtime ternary
 * on SESSION_SECRET caused Node signing and Edge middleware to disagree when
 * the env was present in one runtime and not the other.
 */
export const EA_PORTAL_SESSION: HmacSessionConfig = {
  secretEnvKey: 'ADMIN_SESSION_SECRET',
  devSecret: 'ea-portal-dev-secret-change-in-prod',
};

export const EA_PORTAL_COOKIE = 'ea_portal_session';
