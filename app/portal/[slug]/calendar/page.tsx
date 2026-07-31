import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import PortalCalendar from './PortalCalendar';

export const dynamic = 'force-dynamic';

export default async function SharedCalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'calendar');

  return (
    <PortalSubpage
      slug={slug}
      active="calendar"
      kicker="EA Shared Calendar™"
      title="Shared calendar"
      lede={`Appointments, deadlines, events, and reminders for ${client.organization || client.clientName}.`}
    >
      <PortalCalendar slug={slug} />
    </PortalSubpage>
  );
}
