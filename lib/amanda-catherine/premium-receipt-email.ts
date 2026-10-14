import { createAmandaReceiptPdf, type AmandaReceiptData } from './receipt-pdf';

export async function sendAmandaPremiumReceiptEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
  receipt: AmandaReceiptData;
  idempotencyKey: string;
}): Promise<{ ok: boolean; error?: string; messageId?: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const configuredFrom = process.env.RESEND_FROM_EMAIL?.trim();
  if (!apiKey || !configuredFrom) return { ok: false, error: 'Amanda email provider is not configured.' };
  const sender = configuredFrom.match(/<([^<>]+)>/)?.[1] || configuredFrom;
  if (!/^\S+@\S+\.\S+$/.test(sender)) return { ok: false, error: 'Invalid configured sender.' };
  const pdf = createAmandaReceiptPdf(input.receipt);
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + apiKey,
        'Content-Type': 'application/json',
        'Idempotency-Key': input.idempotencyKey.slice(0, 256),
      },
      body: JSON.stringify({
        from: 'Amanda Catherine <' + sender + '>',
        reply_to: 'Amanda@aesthetikine.com',
        to: [input.to],
        subject: input.subject,
        html: '<div style="background:#f6f0e6;padding:24px;font-family:Arial,sans-serif">' +
          '<div style="max-width:600px;margin:auto;background:white;border-top:6px solid #596b5b;padding:32px">' +
          '<p style="color:#596b5b;font-weight:bold">Amanda Catherine · AesthetiKine Studio Lab</p>' +
          input.html + '</div></div>',
        text: input.text,
        attachments: [{ filename: 'Amanda-Catherine-Payment-Receipt.pdf', content: pdf.toString('base64'), content_type: 'application/pdf' }],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) return { ok: false, error: 'Receipt email provider declined delivery (' + response.status + ').' };
    const payload = await response.json() as { id?: string };
    return { ok: true, messageId: payload.id };
  } catch {
    return { ok: false, error: 'Receipt email delivery failed.' };
  }
}
