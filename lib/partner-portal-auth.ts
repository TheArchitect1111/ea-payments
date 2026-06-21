import type { HmacSessionConfig } from '@ea/portal-chassis/hmac';

export const EA_PARTNER_SESSION: HmacSessionConfig = {
  secretEnvKey: 'SESSION_SECRET',
  devSecret: 'ea-partner-dev-secret-change-in-prod',
};

export const EA_PARTNER_COOKIE = 'ea_partner_session';

export interface EAPartnerSession {
  slug: string;
  partnerId: string;
  name: string;
  tier: string;
  commissionRate: number | null;
  exp: number;
}
