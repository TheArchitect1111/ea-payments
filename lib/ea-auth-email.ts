import { sendEmail } from '@ea/portal-chassis/email';

function escHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function sendAuthEmail(input: {
  to: string;
  subject: string;
  title: string;
  bodyHtml: string;
  text?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    const missing = [!apiKey && 'RESEND_API_KEY', !from && 'RESEND_FROM_EMAIL']
      .filter(Boolean)
      .join(', ');
    return { ok: false, error: `Email not configured (missing: ${missing}).` };
  }

  const html = `
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:24px 0;font-family:Arial,sans-serif;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border:1px solid #e5e7eb;">
      <tr><td style="background:#1B2B4D;padding:20px 28px;">
        <p style="margin:0;color:#fff;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Efficiency Architects</p>
        <h1 style="margin:8px 0 0;color:#fff;font-size:20px;">${escHtml(input.title)}</h1>
      </td></tr>
      <tr><td style="padding:28px;color:#334155;font-size:15px;line-height:1.6;">
        ${input.bodyHtml}
      </td></tr>
    </table>
  </td></tr>
</table>`;

  try {
    await sendEmail({
      to: input.to,
      subject: input.subject,
      html,
      from,
    });
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Email send failed.' };
  }
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return 'your email';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(1, local.length - visible.length))}@${domain}`;
}
