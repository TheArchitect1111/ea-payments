import { requirePortalModule } from '@/lib/modules/portal-modules';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { resolvePortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import { buildCrmPilotModel } from '@/lib/crm-pilot';
import CrmPilotClient from './CrmPilotClient';

export const dynamic = 'force-dynamic';

export default async function PortalCrmPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'dashboard');
  const chrome = await resolvePortalWorkspaceChrome(slug);
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;
  const model = buildCrmPilotModel();

  return (
    <PortalShell slug={slug} active="home" firstName={firstName} chrome={chrome}>
      <main style={{ padding: '24px', maxWidth: 1480, margin: '0 auto' }}>
        <CrmPilotClient initialModel={model} />
      </main>
    </PortalShell>
  );
}
