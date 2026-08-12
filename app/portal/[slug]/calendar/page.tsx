import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import PortalCalendar from './PortalCalendar';

export const dynamic = 'force-dynamic';

export default async function SharedCalendarPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'calendar');
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');

  return (
    <PortalSubpage
      slug={slug}
      active="events"
      kicker={isAmanda ? 'Amanda Catherine Calendar' : 'EA Shared Calendar™'}
      title={isAmanda ? 'Appointments, training & events' : 'Shared calendar'}
      lede={`Appointments, deadlines, events, and reminders for ${client.organization || client.clientName}.`}
    >
      {isAmanda && !process.env.NYLAS_API_KEY ? (
        <div className="ep-module-card" style={{ marginBottom: 24 }}>
          <p className="ep-module-card-title">Connected calendar preview</p>
          <p className="ep-module-card-note">Google or Outlook calendar sync will be activated after Amanda selects the calendar account she wants connected.</p>
        </div>
      ) : null}
      <PortalCalendar slug={slug} />
    </PortalSubpage>
  );
}
