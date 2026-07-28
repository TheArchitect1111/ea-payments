/**
 * Airtable durability helpers for Event Hub pretix events + registration ledger.
 * @see docs/integrations/PRETIX-EVENT-ENGINE.md
 */
import type { PortalPretixEvent, PortalPretixEventStatus } from '@/lib/events/pretix-types';
import type { PortalEventRegistration, RegistrationPaymentStatus } from '@/lib/events/registration-ledger';
import {
  escapeAirtableString,
  platformQuery,
  platformStoreConfigured,
  platformUpsertByField,
} from '@/lib/platform-store';

export const PORTAL_PRETIX_EVENTS_TABLE =
  process.env.AIRTABLE_PORTAL_PRETIX_EVENTS_TABLE?.trim() || 'Portal Pretix Events';

export const PORTAL_EVENT_REGISTRATIONS_TABLE =
  process.env.AIRTABLE_PORTAL_EVENT_REGISTRATIONS_TABLE?.trim() || 'Portal Event Registrations';

export function registrationKey(input: {
  portalSlug: string;
  orderCode: string;
  pretixEventSlug?: string;
}): string {
  const slug = input.portalSlug.trim().toLowerCase();
  const order = input.orderCode.trim() || 'unknown';
  const eventSlug = input.pretixEventSlug?.trim() || '_';
  return `${slug}:${order}:${eventSlug}`;
}

function mapPretixEventRow(row: { id: string; fields: Record<string, unknown> }): PortalPretixEvent {
  return {
    id: String(row.fields['Event ID'] || row.id),
    portalSlug: String(row.fields['Portal Slug'] || '').trim().toLowerCase(),
    title: String(row.fields.Title || ''),
    summary: String(
      row.fields.Summary ||
        'Register and pay securely. Pretix sends your confirmation — Amplifi/EA never auto-posts.',
    ),
    shopUrl: String(row.fields['Shop URL'] || ''),
    pretixEventSlug: row.fields['Pretix Event Slug']
      ? String(row.fields['Pretix Event Slug'])
      : undefined,
    pretixOrganizerSlug: row.fields['Pretix Organizer Slug']
      ? String(row.fields['Pretix Organizer Slug'])
      : undefined,
    startsAt: row.fields['Starts At'] ? String(row.fields['Starts At']) : undefined,
    endsAt: row.fields['Ends At'] ? String(row.fields['Ends At']) : undefined,
    location: row.fields.Location ? String(row.fields.Location) : undefined,
    status: (String(row.fields.Status || 'published') as PortalPretixEventStatus) || 'published',
    createdAt: String(row.fields['Created At'] || new Date().toISOString()),
    updatedAt: String(row.fields['Updated At'] || new Date().toISOString()),
    createdBy: row.fields['Created By'] ? String(row.fields['Created By']) : undefined,
  };
}

function mapRegistrationRow(row: {
  id: string;
  fields: Record<string, unknown>;
}): PortalEventRegistration {
  const remindersRaw = row.fields['Reminders Sent JSON'];
  let remindersSent: PortalEventRegistration['remindersSent'];
  if (typeof remindersRaw === 'string' && remindersRaw.trim()) {
    try {
      remindersSent = JSON.parse(remindersRaw) as PortalEventRegistration['remindersSent'];
    } catch {
      remindersSent = {};
    }
  }

  return {
    id: String(row.fields['Registration ID'] || row.id),
    portalSlug: String(row.fields['Portal Slug'] || '').trim().toLowerCase(),
    organizationId: row.fields['Organization ID']
      ? String(row.fields['Organization ID'])
      : undefined,
    orderCode: String(row.fields['Order Code'] || 'unknown'),
    email: row.fields.Email ? String(row.fields.Email) : undefined,
    eventTitle: String(row.fields['Event Title'] || ''),
    pretixEventSlug: row.fields['Pretix Event Slug']
      ? String(row.fields['Pretix Event Slug'])
      : undefined,
    pretixOrganizerSlug: row.fields['Pretix Organizer Slug']
      ? String(row.fields['Pretix Organizer Slug'])
      : undefined,
    shopUrl: row.fields['Shop URL'] ? String(row.fields['Shop URL']) : undefined,
    eventStartsAt: row.fields['Event Starts At'] ? String(row.fields['Event Starts At']) : undefined,
    status: (String(row.fields.Status || 'unknown') as RegistrationPaymentStatus) || 'unknown',
    placedAt: String(row.fields['Placed At'] || row.fields['Created At'] || new Date().toISOString()),
    paidAt: row.fields['Paid At'] ? String(row.fields['Paid At']) : undefined,
    updatedAt: String(row.fields['Updated At'] || new Date().toISOString()),
    remindersSent,
  };
}

function pretixEventToFields(event: PortalPretixEvent): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    'Event ID': event.id,
    'Portal Slug': event.portalSlug,
    Title: event.title,
    Summary: event.summary,
    'Shop URL': event.shopUrl,
    Status: event.status,
    'Created At': event.createdAt,
    'Updated At': event.updatedAt,
  };
  if (event.pretixEventSlug) fields['Pretix Event Slug'] = event.pretixEventSlug;
  if (event.pretixOrganizerSlug) fields['Pretix Organizer Slug'] = event.pretixOrganizerSlug;
  if (event.startsAt) fields['Starts At'] = event.startsAt;
  if (event.endsAt) fields['Ends At'] = event.endsAt;
  if (event.location) fields.Location = event.location;
  if (event.createdBy) fields['Created By'] = event.createdBy;
  return fields;
}

function registrationToFields(row: PortalEventRegistration): Record<string, unknown> {
  const key = registrationKey({
    portalSlug: row.portalSlug,
    orderCode: row.orderCode,
    pretixEventSlug: row.pretixEventSlug,
  });
  const fields: Record<string, unknown> = {
    'Registration Key': key,
    'Registration ID': row.id,
    'Portal Slug': row.portalSlug,
    'Order Code': row.orderCode,
    'Event Title': row.eventTitle,
    Status: row.status,
    'Placed At': row.placedAt,
    'Updated At': row.updatedAt,
  };
  if (row.organizationId) fields['Organization ID'] = row.organizationId;
  if (row.email) fields.Email = row.email;
  if (row.pretixEventSlug) fields['Pretix Event Slug'] = row.pretixEventSlug;
  if (row.pretixOrganizerSlug) fields['Pretix Organizer Slug'] = row.pretixOrganizerSlug;
  if (row.shopUrl) fields['Shop URL'] = row.shopUrl;
  if (row.eventStartsAt) fields['Event Starts At'] = row.eventStartsAt;
  if (row.paidAt) fields['Paid At'] = row.paidAt;
  if (row.remindersSent && Object.keys(row.remindersSent).length) {
    fields['Reminders Sent JSON'] = JSON.stringify(row.remindersSent);
  }
  return fields;
}

export async function listPretixEventsFromAirtable(opts?: {
  portalSlug?: string;
  includeDrafts?: boolean;
  maxRecords?: number;
}): Promise<PortalPretixEvent[]> {
  if (!platformStoreConfigured()) return [];

  const parts: string[] = [];
  if (opts?.portalSlug) {
    parts.push(`LOWER({Portal Slug})='${escapeAirtableString(opts.portalSlug)}'`);
  }
  if (!opts?.includeDrafts) {
    parts.push(`{Status}='published'`);
  }
  parts.push(`NOT({Deleted At})`);
  const formula = parts.length ? `AND(${parts.join(',')})` : `NOT({Deleted At})`;
  const rows = await platformQuery(PORTAL_PRETIX_EVENTS_TABLE, formula, opts?.maxRecords ?? 200);
  return rows.map(mapPretixEventRow);
}

export async function upsertPretixEventToAirtable(
  event: PortalPretixEvent,
): Promise<PortalPretixEvent | null> {
  if (!platformStoreConfigured()) return null;
  const record = await platformUpsertByField(
    PORTAL_PRETIX_EVENTS_TABLE,
    'Event ID',
    event.id,
    pretixEventToFields(event),
  );
  return record ? mapPretixEventRow(record) : null;
}

export async function markPretixEventDeletedInAirtable(
  eventId: string,
  portalSlug: string,
): Promise<boolean> {
  if (!platformStoreConfigured()) return false;
  const slug = portalSlug.trim().toLowerCase();
  const rows = await platformQuery(
    PORTAL_PRETIX_EVENTS_TABLE,
    `AND({Event ID}='${escapeAirtableString(eventId)}', LOWER({Portal Slug})='${escapeAirtableString(slug)}')`,
    1,
  );
  if (!rows[0]) return false;
  const stamped = new Date().toISOString();
  const record = await platformUpsertByField(
    PORTAL_PRETIX_EVENTS_TABLE,
    'Event ID',
    eventId,
    { 'Deleted At': stamped, 'Updated At': stamped },
  );
  return Boolean(record);
}

export async function findPretixEventInAirtable(input: {
  shopUrl?: string;
  pretixEventSlug?: string;
  portalSlug?: string;
}): Promise<PortalPretixEvent | null> {
  const events = await listPretixEventsFromAirtable({
    portalSlug: input.portalSlug,
    includeDrafts: true,
    maxRecords: 200,
  });
  const shop = input.shopUrl?.trim();
  const eventSlug = input.pretixEventSlug?.trim().toLowerCase();
  return (
    events.find((event) => {
      if (shop && event.shopUrl.replace(/\/$/, '') === shop.replace(/\/$/, '')) return true;
      if (eventSlug && event.pretixEventSlug?.toLowerCase() === eventSlug) return true;
      return false;
    }) ?? null
  );
}

export async function listRegistrationsFromAirtable(opts: {
  portalSlug?: string;
  email?: string;
  maxRecords?: number;
}): Promise<PortalEventRegistration[]> {
  if (!platformStoreConfigured()) return [];

  const parts: string[] = [];
  if (opts.portalSlug) {
    parts.push(`LOWER({Portal Slug})='${escapeAirtableString(opts.portalSlug)}'`);
  }
  if (opts.email) {
    parts.push(`LOWER({Email})='${escapeAirtableString(opts.email)}'`);
  }
  const formula = parts.length ? `AND(${parts.join(',')})` : undefined;
  const rows = await platformQuery(PORTAL_EVENT_REGISTRATIONS_TABLE, formula, opts.maxRecords ?? 500);
  return rows.map(mapRegistrationRow);
}

export async function upsertRegistrationToAirtable(
  row: PortalEventRegistration,
): Promise<PortalEventRegistration | null> {
  if (!platformStoreConfigured()) return null;
  const key = registrationKey({
    portalSlug: row.portalSlug,
    orderCode: row.orderCode,
    pretixEventSlug: row.pretixEventSlug,
  });
  const record = await platformUpsertByField(
    PORTAL_EVENT_REGISTRATIONS_TABLE,
    'Registration Key',
    key,
    registrationToFields(row),
  );
  return record ? mapRegistrationRow(record) : null;
}
