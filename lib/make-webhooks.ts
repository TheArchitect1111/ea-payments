export interface OnboardingWebhookPayload {
  event: 'payment.received';
  clientName: string;
  email: string;
  organization?: string;
  packageName: string;
  amountPaid: number;
  paymentDate: string;
  stripeTransactionId: string;
  airtableRecordId?: string;
  portalLoginUrl?: string;
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
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const detail = await res.text();
      console.error(`${label} failed (${res.status}):`, detail);
    }
  } catch (err) {
    console.error(`${label} threw:`, err);
  }
}

export async function fireOnboardingWebhook(payload: OnboardingWebhookPayload): Promise<void> {
  await fireMakeWebhook(
    process.env.ONBOARDING_WEBHOOK_URL,
    payload as unknown as Record<string, unknown>,
    'ONBOARDING_WEBHOOK_URL',
  );
}

export async function fireEsignWebhook(payload: Record<string, unknown>): Promise<void> {
  await fireMakeWebhook(process.env.ESIGN_WEBHOOK_URL, payload, 'ESIGN_WEBHOOK_URL');
}
