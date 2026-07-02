import Link from 'next/link';
import { AppShell } from '@/lib/chassis/AppShell';
import { buildConnectKit } from '@/lib/connect-kit';
import { getConnectOrg } from '@/lib/connect-store';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import ConnectKitClient from './ConnectKitClient';
import ConnectTaskBoard from './ConnectTaskBoard';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function PortalConnectKitPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { session, client, access } = await requirePortalModule(slug, 'connect');
  const org = await getConnectOrg(slug);
  const kit = buildConnectKit(org, slug);
  const canManage = roleAtLeast(normalizeRole(session.role), 'staff');
  const canEditCopy = roleAtLeast(normalizeRole(session.role), 'owner');
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  return (
    <div className="ep-page">
      <AppShell slug={slug} activeModuleId="connect" firstName={firstName} shellNavGroups={access.shellNavGroups}>
        <main className="ep-main ep-main-shell">
          <div className="ep-welcome">
            <p className="ep-welcome-label">EA Connect™</p>
            <h1 className="ep-welcome-heading">QR codes & capture links</h1>
            <p className="ep-pulse-summary">
              Print a QR for your booth, share a link by text, and every conversation becomes a tracked relationship.
            </p>
          </div>

          <ConnectKitClient
            kit={kit}
            canManage={canManage}
            canEditCopy={canEditCopy}
            copy={{
              offerHeadline: org.offer.headline,
              resourceTitle: org.offer.resourceTitle,
              guideIntro: org.guide.intro,
              journeyIntro: org.journey.intro,
            }}
          />

          <ConnectTaskBoard canManage={canManage} />

          <p style={{ marginTop: 24, fontSize: 14, color: '#64748b' }}>
            Public capture:{' '}
            <Link href={`/connect/${org.slug}`} className="underline" style={{ color: '#1B2B4D' }}>
              /connect/{org.slug}
            </Link>
          </p>
        </main>
      </AppShell>
    </div>
  );
}
