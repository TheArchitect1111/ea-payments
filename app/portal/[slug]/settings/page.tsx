import { PortalSubpage } from '@/app/portal/components/PortalSubpage';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { BusinessPresencePanel } from './BusinessPresencePanel';

export const dynamic = 'force-dynamic';

export default async function PortalSettingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'settings');

  return (
    <PortalSubpage
      slug={slug}
      active="home"
      kicker="Settings"
      title="Portal preferences"
      lede={`Branding and notification preferences for ${client.organization || client.clientName}.`}
    >
      <div className="ep-module-card" style={{ maxWidth: 560 }}>
        <p className="ep-module-card-title">Branding</p>
        <p className="ep-module-card-note">
          Your portal theme and organization identity are managed by your Efficiency Architects
          team. Contact your advisor to update logos, colors, or workspace naming.
        </p>
      </div>
      <div className="ep-module-card" style={{ maxWidth: 560, marginTop: 12 }}>
        <p className="ep-module-card-title">Notifications</p>
        <p className="ep-module-card-note">
          Event reminders, review notices, and advisor updates are delivered through Pulse and
          email when an address is on file. Self-serve notification toggles are coming in a future
          release.
        </p>
      </div>
      <BusinessPresencePanel />
    </PortalSubpage>
  );
}
