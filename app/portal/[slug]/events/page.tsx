import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { EA_PORTAL_COOKIE, verifySession } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
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
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/events`);

  const client = await getClientByPortalSlug(slug);
  if (!client) redirect('/portal/login');

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
