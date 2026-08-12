import { requirePortalModule } from '@/lib/modules/portal-modules';
import {
  listPortalEvents,
  partitionPortalEventItems,
  type PortalEventItem,
} from '@/lib/portal-event-hub';
import { listRegistrationsForPortal } from '@/lib/events/registration-ledger';
import { listPretixEventsForPortal } from '@/lib/events/pretix-store';
import { findOrganizationByPortalSlug } from '@/lib/organizations';
import { ctpCalendlyUrl } from '@/lib/ctp-calendly';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import PretixEventStaffPanel from './PretixEventStaffPanel';
import BookingUrlPanel from './BookingUrlPanel';
import BookingEmbed from './BookingEmbed';

export const dynamic = 'force-dynamic';

type EventHubTab = 'calendar' | 'events' | 'registrations';

function parseTab(raw: string | undefined, hasPretix: boolean): EventHubTab {
  if (raw === 'calendar' || raw === 'events' || raw === 'registrations') return raw;
  return hasPretix ? 'events' : 'calendar';
}

function tabHref(slug: string, tab: EventHubTab): string {
  return `/portal/${slug}/events?tab=${tab}`;
}

function EventItemList({ items }: { items: PortalEventItem[] }) {
  if (items.length === 0) {
    return <p className="ep-module-card-note">Nothing scheduled here yet.</p>;
  }

  return (
    <ul className="ep-module-list">
      {items.map((event) => (
        <li
          key={`${event.source}:${event.id || event.title}:${event.when}`}
          className="ep-module-card"
        >
          <a
            href={event.href}
            className="ep-module-card-title"
            target={event.external ? '_blank' : undefined}
            rel={event.external ? 'noreferrer' : undefined}
          >
            {event.title}
          </a>
          <p className="ep-module-card-meta">{event.when}</p>
          <p className="ep-module-card-note">{event.detail}</p>
          {event.ctaLabel ? (
            <p style={{ marginTop: 12 }}>
              <a
                href={event.href}
                className="ep-btn"
                target={event.external ? '_blank' : undefined}
                rel={event.external ? 'noreferrer' : undefined}
              >
                {event.ctaLabel}
                {event.external ? ' ↗' : ''}
              </a>
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function registrationStatusLabel(status: string): string {
  if (status === 'paid') return 'Paid';
  if (status === 'placed') return 'Placed';
  if (status === 'canceled') return 'Canceled';
  return status;
}

export default async function EventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const { client, session } = await requirePortalModule(slug, 'events');
  const events = await listPortalEvents(slug, client);
  const { calendar, events: ticketed } = partitionPortalEventItems(events);
  const hasPretix = ticketed.length > 0;
  const tab = parseTab(tabParam, hasPretix);
  const canManage = roleAtLeast(normalizeRole(session.role), 'staff');
  const staffEvents = canManage
    ? await listPretixEventsForPortal(slug, { includeDrafts: true })
    : [];
  const sessionEmail = session.email?.trim();
  const registrations = await listRegistrationsForPortal(
    slug,
    canManage ? undefined : sessionEmail ? { email: sessionEmail } : undefined,
  );
  const org = await findOrganizationByPortalSlug(slug);
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  const bookingEmbedUrl =
    org?.bookingUrl?.trim() ||
    (isAmanda ? process.env.AMANDA_JANE_BOOKING_URL?.trim() : '') ||
    process.env.CALENDLY_URL?.trim() ||
    ctpCalendlyUrl() || '';

  const tabs: { id: EventHubTab; label: string }[] = [
    { id: 'calendar', label: 'Calendar' },
    { id: 'events', label: 'Events' },
    { id: 'registrations', label: 'My registrations' },
  ];

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      kicker="Calendar & Event Hub™"
      title="Calendar & shared scheduling"
      lede={
        hasPretix
          ? `Calendar, ticketed events, and your registrations — for ${client.organization || client.clientName}.`
          : `Reviews, bookings, and advisor sessions for ${client.organization || client.clientName}.`
      }
    >
      <nav className="ep-hub-tabs" aria-label="Event Hub sections">
        {tabs.map((entry) => (
          <a
            key={entry.id}
            href={tabHref(slug, entry.id)}
            className={tab === entry.id ? 'ep-hub-tabs-active' : undefined}
            aria-current={tab === entry.id ? 'page' : undefined}
          >
            {entry.label}
          </a>
        ))}
      </nav>

      {tab === 'calendar' ? (
        <>
          {canManage ? <BookingUrlPanel initialUrl={org?.bookingUrl || ''} providerLabel={isAmanda ? 'Jane' : 'booking'} /> : null}
          {bookingEmbedUrl ? (
            <BookingEmbed bookingUrl={bookingEmbedUrl} title={isAmanda ? 'Book with AesthetiKine' : 'Book advisor time'} />
          ) : isAmanda ? (
            <div className="ep-module-card" style={{ marginBottom: 24 }}>
              <p className="ep-module-card-title">Book with AesthetiKine</p>
              <p className="ep-module-card-note">Jane online booking will open here after Amanda provides her booking-page link.</p>
              <button className="ep-btn" disabled style={{ marginTop: 16 }}>Booking link coming after preview</button>
            </div>
          ) : null}
          <EventItemList items={calendar} />
        </>
      ) : null}

      {tab === 'events' ? (
        <>
          {canManage ? <PretixEventStaffPanel initialEvents={staffEvents} /> : null}
          <EventItemList items={ticketed} />
        </>
      ) : null}

      {tab === 'registrations' ? (
        registrations.length === 0 ? (
          <p className="ep-module-card-note">
            {canManage
              ? 'No registrations recorded for this portal yet.'
              : sessionEmail
                ? 'No registrations found for your account yet.'
                : 'Sign in with the email used at checkout to see your registrations.'}
          </p>
        ) : (
          <ul className="ep-module-list">
            {registrations.map((row) => (
              <li key={row.id} className="ep-module-card">
                <p className="ep-module-card-title">{row.eventTitle}</p>
                <p className="ep-module-card-meta">
                  Order {row.orderCode} · {registrationStatusLabel(row.status)}
                </p>
                {row.eventStartsAt ? (
                  <p className="ep-module-card-note">
                    Starts{' '}
                    {new Date(row.eventStartsAt).toLocaleString(undefined, {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                ) : null}
                {row.shopUrl ? (
                  <p style={{ marginTop: 12 }}>
                    <a href={row.shopUrl} className="ep-btn" target="_blank" rel="noreferrer">
                      View in pretix ↗
                    </a>
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </PortalSubpage>
  );
}
