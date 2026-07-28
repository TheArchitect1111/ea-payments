/**
 * Event registration reminders — T-7 / T-1 / event day for pretix ledger rows.
 * pretix remains SoT; EA sends portal notify + optional email ahead of eventStartsAt.
 */
import {
  listAllRegistrations,
  markRegistrationReminderSent,
  type PortalEventRegistration,
} from '@/lib/events/registration-ledger';
import { dispatchNotification } from '@/lib/notify-dispatch';
import type { PulseEvent } from '@/lib/pulse-bus';

const DAY_MS = 24 * 60 * 60 * 1000;

const T7_MIN_MS = 6.5 * DAY_MS;
const T7_MAX_MS = 7.5 * DAY_MS;
const T1_MIN_MS = 0.75 * DAY_MS;
const T1_MAX_MS = 1.25 * DAY_MS;

export type ReminderKind = 't7' | 't1' | 'tday';

export type ReminderCandidate = {
  registration: PortalEventRegistration;
  kind: ReminderKind;
};

function isActiveRegistration(row: PortalEventRegistration): boolean {
  return row.status === 'placed' || row.status === 'paid';
}

function utcDateKey(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

export function reminderKindDue(
  row: PortalEventRegistration,
  nowMs = Date.now(),
): ReminderKind | null {
  if (!isActiveRegistration(row) || !row.eventStartsAt) return null;

  const startMs = new Date(row.eventStartsAt).getTime();
  if (Number.isNaN(startMs) || startMs <= nowMs) return null;

  const delta = startMs - nowMs;
  const sent = row.remindersSent || {};

  if (!sent.t7 && delta >= T7_MIN_MS && delta <= T7_MAX_MS) return 't7';
  if (!sent.t1 && delta >= T1_MIN_MS && delta <= T1_MAX_MS) return 't1';

  const todayKey = utcDateKey(new Date(nowMs).toISOString());
  const eventDayKey = utcDateKey(row.eventStartsAt);
  if (
    todayKey &&
    eventDayKey &&
    todayKey === eventDayKey &&
    !sent.tday &&
    startMs > nowMs
  ) {
    return 'tday';
  }

  return null;
}

function reminderCopy(kind: ReminderKind, row: PortalEventRegistration): {
  title: string;
  detail: string;
} {
  const eventName = row.eventTitle || 'your event';
  if (kind === 't7') {
    return {
      title: `One week until ${eventName}`,
      detail: `Your registration for ${eventName} starts in about a week. Review details and plan your arrival.`,
    };
  }
  if (kind === 't1') {
    return {
      title: `Tomorrow: ${eventName}`,
      detail: `Your registration for ${eventName} is coming up tomorrow. Check your confirmation and arrival details.`,
    };
  }
  return {
    title: `Today: ${eventName}`,
    detail: `Your event ${eventName} is today. We look forward to seeing you.`,
  };
}

function portalEventsHref(slug: string): string {
  return `/portal/${slug}/events?tab=registrations`;
}

export async function sendEventRegistrationReminder(
  row: PortalEventRegistration,
  kind: ReminderKind,
  options?: { dryRun?: boolean },
): Promise<{ ok: boolean; sent: boolean; error?: string }> {
  const { title, detail } = reminderCopy(kind, row);
  const href = row.shopUrl || portalEventsHref(row.portalSlug);

  const pulse: PulseEvent = {
    product: 'events',
    type: 'event.registration.reminder',
    title,
    detail,
    priority: kind === 'tday' ? 'high' : 'medium',
    href,
    tenantId: row.portalSlug,
    objectId: row.orderCode,
    metadata: {
      reminderKind: kind,
      orderCode: row.orderCode,
      ...(row.pretixEventSlug ? { pretixEventSlug: row.pretixEventSlug } : {}),
    },
  };

  if (options?.dryRun) {
    return { ok: true, sent: true };
  }

  try {
    await dispatchNotification({
      pulse,
      ...(row.email
        ? {
            email: {
              to: row.email,
              subject: title,
              html: `<p>${detail}</p><p><a href="${href}">View your registration</a></p>`,
            },
          }
        : {}),
    });
    await markRegistrationReminderSent(row.id, kind);
    return { ok: true, sent: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Reminder dispatch failed';
    return { ok: false, sent: false, error: message };
  }
}

export async function processDueEventRegistrationReminders(options?: {
  dryRun?: boolean;
}): Promise<{
  checked: number;
  due: ReminderCandidate[];
  sent: number;
  errors: number;
  dryRun: boolean;
}> {
  const dryRun = Boolean(options?.dryRun);
  const registrations = await listAllRegistrations();
  const due: ReminderCandidate[] = [];
  let sent = 0;
  let errors = 0;

  for (const row of registrations) {
    const kind = reminderKindDue(row);
    if (!kind) continue;
    due.push({ registration: row, kind });

    if (dryRun) {
      sent += 1;
      continue;
    }

    const result = await sendEventRegistrationReminder(row, kind);
    if (result.sent) sent += 1;
    else if (!result.ok) errors += 1;
  }

  return {
    checked: registrations.length,
    due,
    sent,
    errors,
    dryRun,
  };
}
