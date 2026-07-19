/**
 * Email notification adapter for Update Hub channels.
 * SMS/push deferred — email only for Portal OS Phase 3.
 */
import { sendEmail } from '@ea/portal-chassis/email';
import {
  UPDATE_HUB_CHANNEL_LABELS,
  type UpdateHubChannel,
} from '@/lib/update-hub-channels';

function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export async function notifyUpdateHubAudience(input: {
  channel: UpdateHubChannel;
  organizationName: string;
  title: string;
  summary?: string;
  portalHref?: string;
  recipientEmail?: string;
}): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  const to = input.recipientEmail?.trim();
  if (!to) {
    return { ok: true, skipped: true };
  }

  const channelLabel = UPDATE_HUB_CHANNEL_LABELS[input.channel];
  const href = input.portalHref?.trim();
  const html = `<!DOCTYPE html><html><body style="font-family:Arial,sans-serif;color:#1a2332;">
<p style="font-size:12px;text-transform:uppercase;letter-spacing:0.08em;color:#8a7350;">${escHtml(channelLabel)} · ${escHtml(input.organizationName)}</p>
<h1 style="font-size:20px;">${escHtml(input.title)}</h1>
${input.summary ? `<p style="line-height:1.6;">${escHtml(input.summary)}</p>` : ''}
${href ? `<p><a href="${escHtml(href)}" style="color:#1a2332;font-weight:bold;">Open in portal</a></p>` : ''}
</body></html>`;

  try {
    await sendEmail({
      to,
      subject: `[${channelLabel}] ${input.title}`,
      html,
    });
    return { ok: true };
  } catch (err) {
    console.error('[update-hub-notify] send failed:', err);
    return { ok: false, error: 'Email send failed.' };
  }
}
