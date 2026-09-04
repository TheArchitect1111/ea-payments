import crypto from 'node:crypto';

export type PostalInboundPayload = Record<string, unknown>;

function env(name: string) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : null;
}

export function postalConfigured() {
  return Boolean(env('POSTAL_API_URL') && env('POSTAL_API_KEY'));
}

export function verifyEvaMailWebhook(rawBody: string, signature: string | null) {
  const secret = env('EVA_MAIL_WEBHOOK_SECRET');
  if (!secret || !signature) return false;
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export async function sendPostalMessage(input: {
  from: string;
  to: string[];
  subject: string;
  plainBody: string;
  htmlBody?: string;
  replyToMessageId?: string;
}) {
  const base = env('POSTAL_API_URL');
  const apiKey = env('POSTAL_API_KEY');
  if (!base || !apiKey) throw new Error('Postal transport is not configured');

  const response = await fetch(`${base.replace(/\/$/, '')}/api/v1/send/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Server-API-Key': apiKey,
    },
    body: JSON.stringify({
      to: input.to,
      sender: input.from,
      subject: input.subject,
      plain_body: input.plainBody,
      html_body: input.htmlBody,
      headers: input.replyToMessageId
        ? { 'In-Reply-To': input.replyToMessageId, References: input.replyToMessageId }
        : undefined,
    }),
  });

  if (!response.ok) {
    throw new Error(`Postal send failed (${response.status})`);
  }

  return response.json();
}
