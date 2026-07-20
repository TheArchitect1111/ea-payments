/**
 * eSignatures.io template + callback config for Make contract delivery.
 * Callback must hit ea-payments (apex), not www CRA marketing.
 */
import { EA_APEX_URL, canonicalPlatformOrigin } from '@/lib/platform-urls';

export type EsignaturesTemplateConfig = {
  msaTemplateId: string;
  sowTemplateId: string;
  templatesReady: boolean;
  missing: string[];
  callbackUrl: string;
  makeEsignWebhookConfigured: boolean;
  contractDeliveryMode: string;
};

/** Production callback — apex host only (www is Visibility Scorecard CRA). */
export function esignaturesCallbackUrl(): string {
  const origin = canonicalPlatformOrigin(
    process.env.NEXT_PUBLIC_BASE_URL || process.env.EA_PLATFORM_URL || EA_APEX_URL,
  );
  return `${origin}/api/webhooks/esignatures`;
}

export function getEsignaturesTemplateConfig(): EsignaturesTemplateConfig {
  const msaTemplateId = process.env.ESIGNATURES_MSA_TEMPLATE_ID?.trim() || '';
  const sowTemplateId = process.env.ESIGNATURES_SOW_TEMPLATE_ID?.trim() || '';
  const missing: string[] = [];
  if (!msaTemplateId) missing.push('ESIGNATURES_MSA_TEMPLATE_ID');
  if (!sowTemplateId) missing.push('ESIGNATURES_SOW_TEMPLATE_ID');

  return {
    msaTemplateId,
    sowTemplateId,
    templatesReady: missing.length === 0,
    missing,
    callbackUrl: esignaturesCallbackUrl(),
    makeEsignWebhookConfigured: Boolean(process.env.ESIGN_WEBHOOK_URL?.trim()),
    contractDeliveryMode: process.env.CONTRACT_DELIVERY_MODE?.trim() || 'manual',
  };
}

/** Fields Make onboarding scenarios use when sending MSA/SOW. */
export function esignaturesMakeTemplateFields(): Record<string, string> {
  const cfg = getEsignaturesTemplateConfig();
  return {
    esignaturesMsaTemplateId: cfg.msaTemplateId,
    esignaturesSowTemplateId: cfg.sowTemplateId,
    esignaturesCallbackUrl: cfg.callbackUrl,
    contractDeliveryMode: cfg.contractDeliveryMode,
  };
}
