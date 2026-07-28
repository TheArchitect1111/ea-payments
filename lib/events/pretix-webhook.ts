import { findPretixEventByShopOrSlug } from '@/lib/events/pretix-store';
import type { PortalPretixEvent } from '@/lib/events/pretix-types';
import { upsertRegistrationFromPretix } from '@/lib/events/registration-ledger';
import { notifyPortal } from '@/lib/portal-notify';
import { emitPulseEvent } from '@/lib/pulse-bus';
import { sendInternalNotification } from '@/lib/email';

export type PretixWebhookPayload = {
  notification_id?: number;
  organzizer?: string;
  organizer?: string;
  event?: string;
  action?: string;
  /** Older / plugin shapes */
  code?: string;
  order?: string | { code?: string; email?: string; status?: string };
  data?: {
    order?: string;
    code?: string;
    email?: string;
    event?: string;
    organizer?: string;
    url?: string;
  };
};

function extractOrderCode(payload: PretixWebhookPayload): string | undefined {
  // Native pretix payload uses top-level `code`.
  if (payload.code?.trim()) return payload.code.trim();
  if (typeof payload.order === 'string') return payload.order;
  if (payload.order && typeof payload.order === 'object') return payload.order.code;
  return payload.data?.order || payload.data?.code;
}

function extractEmail(payload: PretixWebhookPayload): string | undefined {
  if (payload.order && typeof payload.order === 'object') return payload.order.email;
  return payload.data?.email;
}

function extractAction(payload: PretixWebhookPayload): string {
  return (payload.action || '').toLowerCase();
}

export function isPretixRegistrationAction(action: string): boolean {
  return (
    action.includes('order.paid') ||
    action.includes('order.placed') ||
    action === 'pretix.event.order.paid' ||
    action === 'pretix.event.order.placed'
  );
}

export function isPretixCancelAction(action: string): boolean {
  return action.includes('cancel');
}

export async function handlePretixRegistrationWebhook(
  payload: PretixWebhookPayload,
  matched?: PortalPretixEvent | null,
): Promise<{ ok: boolean; detail: string }> {
  const action = extractAction(payload);
  const paid = action.includes('paid');
  const canceled = isPretixCancelAction(action);
  if (!isPretixRegistrationAction(action) && !canceled) {
    return { ok: true, detail: `Ignored action: ${action || 'unknown'}` };
  }

  const organizer = payload.organizer || payload.organzizer || payload.data?.organizer;
  const eventSlug = payload.event || payload.data?.event;
  const shopUrl = payload.data?.url;
  const event =
    matched ||
    (await findPretixEventByShopOrSlug({
      shopUrl,
      pretixEventSlug: eventSlug,
    }));

  const orderCode = extractOrderCode(payload) || 'unknown';
  const email = extractEmail(payload);
  const title = canceled
    ? `Event registration canceled: ${event?.title || eventSlug || 'Event'}`
    : paid
    ? `Event registration paid: ${event?.title || eventSlug || 'Event'}`
    : `Event registration placed: ${event?.title || eventSlug || 'Event'}`;
  const detail = [
    event?.title ? `Event: ${event.title}` : null,
    orderCode !== 'unknown' ? `Order: ${orderCode}` : null,
    email ? `Buyer: ${email}` : null,
    organizer ? `Organizer: ${organizer}` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  if (event?.portalSlug) {
    await upsertRegistrationFromPretix({
      portalSlug: event.portalSlug,
      orderCode,
      email,
      eventTitle: event.title || eventSlug || 'Event',
      pretixEventSlug: event.pretixEventSlug || eventSlug,
      pretixOrganizerSlug: organizer,
      shopUrl: event.shopUrl || shopUrl,
      eventStartsAt: event.startsAt,
      status: canceled ? 'canceled' : paid ? 'paid' : 'placed',
    });
  }

  if (canceled) {
    return { ok: true, detail: 'Registration canceled in ledger' };
  }

  await notifyPortal({
    product: 'events',
    type: paid ? 'event.registration.confirmed' : 'event.registration.placed',
    title,
    detail: detail || 'pretix registration webhook received',
    priority: paid ? 'high' : 'medium',
    href: event?.shopUrl || `/portal/${event?.portalSlug || 'demo-client'}/events`,
    tenantId: event?.portalSlug,
    objectId: orderCode,
    metadata: {
      provider: 'pretix',
      action,
      orderCode,
      ...(email ? { email } : {}),
      ...(eventSlug ? { pretixEventSlug: eventSlug } : {}),
    },
  });

  await emitPulseEvent({
    product: 'events',
    type: paid ? 'event.registration.confirmed' : 'event.registration.placed',
    title,
    detail,
    priority: paid ? 'high' : 'medium',
    href: event?.shopUrl,
    tenantId: event?.portalSlug,
    objectId: orderCode,
  });

  try {
    await sendInternalNotification({
      subject: title,
      title: 'pretix registration',
      body: detail || title,
    });
  } catch {
    /* non-blocking */
  }

  return { ok: true, detail: paid ? 'Registration confirmed into Pulse' : 'Registration placed into Pulse' };
}
