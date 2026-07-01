/**
 * Shared Orb SDK constants for the browser extension.
 * Keep in sync with lib/orb-sdk/actions.ts and lib/orb-sdk/extension.ts
 */
(function (global) {
  const DEFAULT_BASE = 'https://ea-payments.vercel.app';

  global.EA_ORB_SDK = {
    version: 1,
    product: 'simplifi',
    urls: {
      capture: `${DEFAULT_BASE}/simplifi/capture`,
      workspace: `${DEFAULT_BASE}/simplifi/workspace`,
      settings: `${DEFAULT_BASE}/simplifi/settings`,
      connect: `${DEFAULT_BASE}/extension/connect`,
    },
    actions: {
      capture: 'capture',
      workspace: 'workspace',
      guide: 'guide',
      watch: 'watch',
      analyze: 'analyze',
      followup: 'followup',
      dashboard: 'dashboard',
      watchlist: 'watchlist',
      recent: 'recent',
      brief: 'brief',
    },
  };
})(typeof window !== 'undefined' ? window : globalThis);
