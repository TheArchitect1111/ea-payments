import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import {
  CPR_PORTAL_EVENTS,
  isCprPortalClient,
} from '@/lib/platform/content-packs/cpr-portal';

export const dynamic = 'force-dynamic';

const DEFAULT_EVENTS = [
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
  const chrome = await resolvePortalWorkspaceChrome(slug);
  const events = isCprPortalClient(chrome.platformClientId)
    ? CPR_PORTAL_EVENTS
    : DEFAULT_EVENTS;

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      module="events"
      kicker="Events"
      title="Upcoming touchpoints"
      lede={`Workshops, reviews, and advisor sessions for {brand} — ${client.organization || client.clientName}.`}
    >
      <ul className="ep-module-list">
        {events.map((event) => (
          <li key={event.title} className="ep-module-card">
            <a href={event.href} className="ep-module-card-title">
              {event.title}
            </a>
            <p className="ep-module-card-note">
              <strong>{event.when}</strong> — {event.detail}
            </p>
          </li>
        ))}
      </ul>
    </PortalSubpage>
  );
}
