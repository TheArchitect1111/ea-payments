import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';

export const dynamic = 'force-dynamic';

const UPCOMING_EVENTS = [
  {
    title: 'Simplifi friend-testing office hours',
    when: 'Rolling — book via Calendly',
    detail: 'Walk through capture → Magnifi → share links with your team.',
    href: process.env.CALENDLY_URL ?? 'https://calendly.com/freedom-efficiencyarchitects/30min',
  },
  {
    title: 'Operational MRI review call',
    when: 'After assessment submit',
    detail: 'We review your assessment and map next-step packages.',
    href: '/assessment',
  },
];

export default async function EventsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'events');

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      kicker="Events"
      title="Upcoming touchpoints"
      lede={`Workshops, reviews, and advisor sessions for ${client.organization || client.clientName}.`}
    >
      <ul className="ep-module-list">
        {UPCOMING_EVENTS.map((event) => (
          <li key={event.title} className="ep-module-card">
            <a href={event.href} className="ep-module-card-title" target={event.href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
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
