import { triggerMakeWebhook } from '@ea/portal-chassis/webhooks';

export interface OnboardingWebhookPayload {
  event: 'payment.received';
  clientName: string;
  /** @deprecated Use clientEmail in Make mappings — kept for backward compatibility */
  email: string;
  organization?: string;
  /** @deprecated Use packagePurchased in Make mappings */
  packageName: string;
  amountPaid: number;
  paymentDate: string;
  stripeTransactionId: string;
  airtableRecordId?: string;
  portalSlug?: string;
  portalLoginUrl?: string;
}

/** Canonical fields for Make.com EA Onboarding Webhook scenario */
export function buildOnboardingWebhookBody(
  payload: OnboardingWebhookPayload,
): Record<string, unknown> {
  return {
    event: payload.event,
    airtableRecordId: payload.airtableRecordId,
    clientName: payload.clientName,
    clientEmail: payload.email,
    email: payload.email,
    packagePurchased: payload.packageName,
    packageName: payload.packageName,
    portalSlug: payload.portalSlug,
    organization: payload.organization,
    amountPaid: payload.amountPaid,
    paymentDate: payload.paymentDate,
    stripeTransactionId: payload.stripeTransactionId,
    portalLoginUrl: payload.portalLoginUrl,
  };
}

export async function fireMakeWebhook(
  url: string | undefined,
  payload: Record<string, unknown>,
  label: string,
): Promise<void> {
  if (!url) {
    console.warn(
      `[make-webhooks] ${label} is not set — automation skipped. Add this env var in Vercel Production.`,
    );
    return;
  }

  try {
    const { success } = await triggerMakeWebhook(url, payload);
    if (!success) {
      console.error(`${label} failed — Make returned non-OK response.`);
    }
  } catch (err) {
    console.error(`${label} threw:`, err);
  }
}

export async function fireOnboardingWebhook(payload: OnboardingWebhookPayload): Promise<void> {
  await fireMakeWebhook(
    process.env.ONBOARDING_WEBHOOK_URL,
    buildOnboardingWebhookBody(payload),
    'ONBOARDING_WEBHOOK_URL',
  );
}

export async function fireEsignWebhook(payload: Record<string, unknown>): Promise<void> {
  await fireMakeWebhook(process.env.ESIGN_WEBHOOK_URL, payload, 'ESIGN_WEBHOOK_URL');
}

export async function fireContentRequestWebhook(payload: Record<string, unknown>): Promise<void> {
  await fireMakeWebhook(
    process.env.CONTENT_REQUEST_WEBHOOK_URL,
    payload,
    'CONTENT_REQUEST_WEBHOOK_URL',
  );
}
