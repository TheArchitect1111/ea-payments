import type { OnboardingWebhookPayload } from '@/lib/make-webhooks';

export type Tier2EnvChecks = {
  onboardingWebhook: boolean;
  esignWebhook: boolean;
  resend: boolean;
  resendFrom: boolean;
  stripe: boolean;
  stripeWebhookSecret: boolean;
};

export function getTier2EnvChecks(): Tier2EnvChecks {
  return {
    onboardingWebhook: Boolean(process.env.ONBOARDING_WEBHOOK_URL?.trim()),
    esignWebhook: Boolean(process.env.ESIGN_WEBHOOK_URL?.trim()),
    resend: Boolean(process.env.RESEND_API_KEY?.trim()),
    resendFrom: Boolean(process.env.RESEND_FROM_EMAIL?.trim()),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY?.trim()),
    stripeWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET?.trim()),
  };
}

export function isTier2AutomationReady(checks: Tier2EnvChecks): boolean {
  return (
    checks.onboardingWebhook &&
    checks.esignWebhook &&
    checks.resend &&
    checks.resendFrom &&
    checks.stripe &&
    checks.stripeWebhookSecret
  );
}

export function sampleOnboardingWebhookPayload(): OnboardingWebhookPayload {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  return {
    event: 'payment.received',
    clientName: 'Tier 2 Test Client',
    email: 'tier2-test@efficiencyarchitects.online',
    organization: 'EA Launch Verification',
    packageName: 'Simplifi',
    amountPaid: 149,
    paymentDate: new Date().toISOString().slice(0, 10),
    stripeTransactionId: `pi_test_tier2_${Date.now()}`,
    airtableRecordId: 'recREPLACE_WITH_REAL_ID',
    portalLoginUrl: `${base}/portal/login`,
  };
}

export function sampleEsignWebhookPayload(): Record<string, unknown> {
  return {
    event: 'esignatures.callback',
    receivedAt: new Date().toISOString(),
    status: 'signed',
    contractId: 'test-contract-tier2',
    signerEmail: 'tier2-test@efficiencyarchitects.online',
    signerName: 'Tier 2 Test Client',
    test: true,
  };
}

export const ESIGNATURES_CALLBACK_URL = 'https://ea-payments.vercel.app/api/webhooks/esignatures';
