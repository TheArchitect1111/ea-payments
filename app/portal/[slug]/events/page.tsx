import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalEvents } from '@/lib/portal-event-hub';
import { listPretixEventsForPortal } from '@/lib/events/pretix-store';
import { normalizeRole, roleAtLeast } from '@/lib/rbac';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import PretixEventStaffPanel from './PretixEventStaffPanel';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client, session } = await requirePortalModule(slug, 'events');
  const events = await listPortalEvents(slug, client);
  const canManage = roleAtLeast(normalizeRole(session.role), 'staff');
  const staffEvents = canManage
    ? await listPretixEventsForPortal(slug, { includeDrafts: true })
    : [];
  const hasPretix = events.some((event) => event.source === 'pretix');

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      kicker="Event Hub™"
      title={hasPretix ? 'Events & registration' : 'Upcoming touchpoints'}
      lede={
        hasPretix
          ? `Register for camps and tournaments, or book advisor time — for ${client.organization || client.clientName}.`
          : `Reviews, bookings, and advisor sessions for ${client.organization || client.clientName}.`
      }
    >
      {canManage ? <PretixEventStaffPanel initialEvents={staffEvents} /> : null}

      <ul className="ep-module-list">
        {events.map((event) => (
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
    </PortalSubpage>
  );
}
