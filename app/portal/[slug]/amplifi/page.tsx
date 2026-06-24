import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getPortalCaptures } from '@/lib/capture-records';
import { getClientSuccessProfile } from '@/lib/client-success';
import { buildAmplifiPortalExperience } from '@/lib/amplifi-portal';
import { PortalShell } from '@/lib/chassis/PortalShell';
import AmplifiPortalExperience from './AmplifiPortalExperience';
import '../ea-portal.css';
import './amplifi-portal.css';

export const dynamic = 'force-dynamic';

export default async function AmplifiPortalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  if (!token) redirect('/portal/login');

  const session = token ? await verifySession(token) : null;
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/amplifi`);

  const client = await getClientByPortalSlug(slug);
  if (!client) notFound();

  const captures = await getPortalCaptures(slug, 5);
  const profile = await getClientSuccessProfile(client);
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;
  const experience = buildAmplifiPortalExperience(client, captures, profile);

  return (
    <PortalShell slug={slug} active="amplifi" firstName={firstName}>
      <main className="ep-main ep-main-amplifi">
        <AmplifiPortalExperience experience={experience} slug={slug} />
      </main>
    </PortalShell>
  );
}
