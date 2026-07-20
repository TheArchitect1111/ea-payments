import { requirePortalModule } from '@/lib/modules/portal-modules';
import { listPortalEvents } from '@/lib/portal-event-hub';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'events');
  const events = await listPortalEvents(slug, client);

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      kicker="Events"
      title="Upcoming touchpoints"
      lede={`Reviews, bookings, and advisor sessions for ${client.organization || client.clientName}.`}
    >
      <ul className="ep-module-list">
        {events.map((event) => (
          <li key={`${event.source}:${event.title}:${event.when}`} className="ep-module-card">
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
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}
