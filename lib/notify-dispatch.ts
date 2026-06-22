import type { PulseEvent } from './pulse-bus';
import { emitPulseEvent } from './pulse-bus';

export type NotifyChannel = 'email' | 'pulse' | 'make';

export interface NotifyPayload {
  email?: { to: string; subject: string; html: string };
  pulse?: PulseEvent;
  make?: { urlEnvKey: string; payload: Record<string, unknown> };
}

/** Unified notification dispatcher — Novu can plug in here later. */
export async function dispatchNotification(channels: NotifyPayload): Promise<void> {
  if (channels.pulse) {
    await emitPulseEvent(channels.pulse);
  }

  if (channels.email) {
    const { sendEmail } = await import('@ea/portal-chassis/email');
    try {
      await sendEmail(channels.email);
    } catch (err) {
      console.error('[notify] email failed:', err);
    }
  }

  if (channels.make?.urlEnvKey) {
    const url = process.env[channels.make.urlEnvKey];
    if (!url) {
      console.warn(`[notify] ${channels.make.urlEnvKey} not set — Make skipped`);
      return;
    }
    const { triggerMakeWebhook } = await import('@ea/portal-chassis/webhooks');
    await triggerMakeWebhook(url, channels.make.payload);
  }
}
