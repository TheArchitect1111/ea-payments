import type { HmacSessionConfig } from '@ea/portal-chassis/hmac';

/** EA client portal tenant bindings for @ea/portal-chassis HMAC auth. */
export const EA_PORTAL_SESSION: HmacSessionConfig = {
  secretEnvKey: 'SESSION_SECRET',
  devSecret: 'ea-portal-dev-secret-change-in-prod',
};

export const EA_PORTAL_COOKIE = 'ea_portal_session';
