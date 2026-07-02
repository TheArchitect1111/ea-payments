import type { PulseEvent } from '@/lib/pulse-bus';
import { dispatchNotification } from '@/lib/notify-dispatch';

/** Canonical portal notification entry — Pulse bus + future email/Make channels. */
export async function notifyPortal(event: PulseEvent): Promise<void> {
  await dispatchNotification({ pulse: event });
}
