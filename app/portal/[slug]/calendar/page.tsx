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
      active="calendar"
      kicker={isAmanda ? 'Amanda Catherine Calendar' : 'EA Shared Calendar™'}
      title={isAmanda ? 'Appointments, training & events' : 'Shared calendar'}
      lede={`Appointments, deadlines, events, and reminders for ${client.organization || client.clientName}.`}
    >
      {isAmanda ? (
        <>
          <div className="ep-module-card" style={{ marginBottom: 18 }}>
            <p className="ep-module-card-title">Book an appointment</p>
            <p className="ep-module-card-note">
              Client appointments and treatments are booked securely through AesthetiKine’s Jane booking page.
            </p>
            <p style={{ marginTop: 14 }}>
              <a className="ep-btn" href="https://aesthetikine.janeapp.com/" target="_blank" rel="noopener noreferrer">
                Open Jane booking
              </a>
            </p>
          </div>
          <div className="ep-module-card" style={{ marginBottom: 24 }}>
            <p className="ep-module-card-title">Calendar setup</p>
            <p className="ep-module-card-note">
              Calendar authorization is separate from appointment booking. The two approved Google accounts are listed below.
            </p>
            <ul className="ep-module-list" style={{ marginTop: 14 }}>
              <li className="ep-module-card">
                <strong>amanda@aesthetikine.com</strong>
                <p className="ep-module-card-note">Primary AesthetiKine calendar · connection required</p>
              </li>
              <li className="ep-module-card">
                <strong>amandacatherinec@gmail.com</strong>
                <p className="ep-module-card-note">Amanda Catherine calendar · connection required</p>
              </li>
            </ul>
            <p className="ep-module-card-note" style={{ marginTop: 14 }}>
              Secure Google authorization must be completed from each Google account before its events can appear here.
            </p>
          </div>
        </>
      ) : null}
      <PortalCalendar slug={slug} />
    </PortalSubpage>
  );
}
