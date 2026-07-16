import type { HmacSessionConfig } from '@ea/portal-chassis/hmac';

/**
 * Simplifi companion extension session bindings (HMAC).
 * Same secret family as portal sessions — scoped payload differs.
 */
export const EA_EXTENSION_SESSION: HmacSessionConfig = {
  secretEnvKey: 'ADMIN_SESSION_SECRET',
  devSecret: 'ea-extension-dev-secret-change-in-prod',
};

export const EXTENSION_SESSION_SCOPE = 'simplifi:extension' as const;

/** 7-day TTL — shorter than forever tenant tokens; refreshable via /api/extension/session/refresh */
export const EXTENSION_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
