import { getPortalCaptures } from '@/lib/capture-records';
import { getClientSuccessProfile } from '@/lib/client-success';
import { buildAmplifiPortalExperience } from '@/lib/amplifi-portal';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import AmplifiPortalExperience from './AmplifiPortalExperience';
import '../ea-portal.css';
import './amplifi-portal.css';

export const dynamic = 'force-dynamic';

export default async function AmplifiPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { client } = await requirePortalModule(slug, 'amplifi');

  let captures: Awaited<ReturnType<typeof getPortalCaptures>> = [];
  let loadError: string | null = null;
  try {
    captures = (await getPortalCaptures(slug, 5)).filter((c) => c.status !== 'Archived');
  } catch {
    loadError = 'Stories could not be loaded right now. Try again in a moment, or open Simplifi to capture.';
  }

  const profile = await getClientSuccessProfile(client);
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;
  const experience = buildAmplifiPortalExperience(client, captures, profile);

  return (
    <PortalShell slug={slug} active="amplifi" firstName={firstName}>
      <main className="ep-main ep-main-amplifi">
        <PortalModuleChromeStrip />
        <AmplifiPortalExperience experience={experience} slug={slug} loadError={loadError} />
      </main>
    </PortalShell>
  );
}
