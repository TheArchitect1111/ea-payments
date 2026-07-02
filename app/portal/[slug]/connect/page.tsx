import Link from 'next/link';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { buildConnectKit } from '@/lib/connect-kit';
import { getConnectOrg } from '@/lib/connect-store';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { roleAtLeast, normalizeRole } from '@/lib/rbac';
import ConnectKitClient from './ConnectKitClient';
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
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  return (
    <div className="ep-page">
      <PortalShell slug={slug} active="home" activeModuleId="connect" firstName={firstName} shellNavGroups={access.shellNavGroups}>
        <main className="ep-main ep-main-shell">
          <div className="ep-welcome">
            <p className="ep-welcome-label">EA Connect™</p>
            <h1 className="ep-welcome-heading">QR codes & capture links</h1>
            <p className="ep-pulse-summary">
              Print a QR for your booth, share a link by text, and every conversation becomes a tracked relationship.
            </p>
          </div>

          <ConnectKitClient kit={kit} canManage={canManage} />

          <p style={{ marginTop: 24, fontSize: 14, color: '#64748b' }}>
            Public capture:{' '}
            <Link href={`/connect/${org.slug}`} className="underline" style={{ color: '#1B2B4D' }}>
              /connect/{org.slug}
            </Link>
          </p>
        </main>
      </PortalShell>
    </div>
  );
}
