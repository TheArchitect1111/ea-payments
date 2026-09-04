export type EvaMailTenant = {
  id: string;
  label: string;
  enabled: boolean;
  addressLocalPart: string;
  domain?: string;
  autoReply: boolean;
  escalationAddress?: string;
};

/**
 * Eva Mail is a standard EA chassis capability.
 * New portals inherit the capability but remain inactive until a domain and
 * Postal transport are verified. This prevents accidental or spoofed sending.
 */
export const EVA_MAIL_DEFAULTS = {
  capability: 'eva-mail',
  provider: 'postal',
  standardOnFuturePortals: true,
  requireVerifiedDomain: true,
  requireInboundSignature: true,
  requireHumanEscalationFallback: true,
  defaultAutoReply: false,
} as const;

export const EVA_MAIL_TENANTS: Record<string, EvaMailTenant> = {
  'amanda-catherine': {
    id: 'amanda-catherine',
    label: 'Amanda Catherine',
    enabled: true,
    addressLocalPart: 'participants',
    domain: 'amandacatherine.ca',
    autoReply: false,
  },
  cpr: {
    id: 'cpr',
    label: 'Canadian Prospect Recruitment',
    enabled: true,
    addressLocalPart: 'participants',
    autoReply: false,
  },
};

export function getEvaMailTenant(id: string) {
  return EVA_MAIL_TENANTS[id] ?? null;
}

export function getEvaMailAddress(tenant: EvaMailTenant) {
  if (!tenant.domain) return null;
  return `${tenant.addressLocalPart}@${tenant.domain}`;
}
