import { z } from 'zod';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';
import { listPortalNylasEvents, type PortalCalendarEvent } from './nylas';
export const CalendarConfig = z.discriminatedUnion('provider', [
  z.object({ provider: z.literal('internal') }).strict(),
  z.object({ provider: z.literal('nylas'), grantId: z.string().trim().min(1).max(200), calendarId: z.string().trim().min(1).max(200) }).strict(),
]);
export type CalendarInstall = BrickTenant & { version: 2; config: z.infer<typeof CalendarConfig> };
const installKey = (tenant: BrickTenant) => 'calendar-install-' + brickHash(tenant.organizationId);
export async function installCalendar(tenant: BrickTenant, input: unknown = { provider: 'internal' }) {
  const config = CalendarConfig.parse(input);
  // Validate the actual mapped provider, not just the presence of credentials.
  if (config.provider === 'nylas') await listPortalNylasEvents({ ...config, start: new Date(), end: new Date(Date.now() + 86400000) });
  await writeBrickRecord(tenant, installKey(tenant), { ...tenant, version: 2 as const, config });
  if (config.provider === 'internal' && !await readBrickRecord(tenant, 'calendar-events-' + brickHash(tenant.organizationId)))
    await writeBrickRecord(tenant, 'calendar-events-' + brickHash(tenant.organizationId), { ...tenant, events: [] });
}
export async function loadCalendarInstall(tenant: BrickTenant) {
  const row = await readBrickRecord<CalendarInstall>(tenant, installKey(tenant));
  if (!row || row.version !== 2) throw new Error('Calendar is not installed');
  return CalendarConfig.parse(row.config);
}
const Event = z.object({ id: z.string().regex(/^[a-zA-Z0-9-]{1,100}$/), title: z.string().trim().min(1).max(200),
  start: z.string().datetime(), end: z.string().datetime().optional(), allDay: z.boolean().default(false),
  location: z.string().max(200).optional(), description: z.string().max(2000).optional() }).strict()
  .refine(x => !x.end || new Date(x.end) > new Date(x.start), 'Event end must follow start');
type Events = BrickTenant & { events: PortalCalendarEvent[] };
export async function listCalendarEvents(tenant: BrickTenant, start: Date, end: Date) {
  const config = await loadCalendarInstall(tenant);
  if (config.provider === 'nylas') return listPortalNylasEvents({ ...config, start, end });
  const row = await readBrickRecord<Events>(tenant, 'calendar-events-' + brickHash(tenant.organizationId));
  if (!row) throw new Error('Calendar store unavailable');
  return row.events.filter(x => new Date(x.end || x.start) >= start && new Date(x.start) < end);
}
export async function saveCalendarEvent(tenant: BrickTenant, input: unknown) {
  const config = await loadCalendarInstall(tenant);
  if (config.provider !== 'internal') throw new Error('Manage connected calendar events in your provider');
  const event = Event.parse(input);
  const key = 'calendar-events-' + brickHash(tenant.organizationId);
  const row = await readBrickRecord<Events>(tenant, key);
  if (!row) throw new Error('Calendar store unavailable');
  const prior = row.events.find(x => x.id === event.id);
  const events = [...row.events.filter(x => x.id !== event.id), event];
  await writeBrickRecord(tenant, key, { ...tenant, events });
  await writeBrickRecord(tenant, 'calendar-event-tracking-' + brickHash([tenant.organizationId, event.id]),
    { ...tenant, eventId: event.id, eventType: prior ? 'event_updated' : 'event_created' });
  return event;
}
