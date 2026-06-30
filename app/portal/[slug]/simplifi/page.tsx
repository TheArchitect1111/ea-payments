import Link from 'next/link';
import { getContentRequestsForClient } from '@/lib/airtable';
import { getPortalCaptures } from '@/lib/capture-records';
import { PortalShell } from '@/lib/chassis/PortalShell';
import { NAVY, GOLD } from '@/lib/design-system';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import SimplifiPortalWorkspace from './SimplifiPortalWorkspace';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { client, access } = await requirePortalModule(slug, 'simplifi');
  const isSimplifi = access.enabledModuleIds.has('simplifi');
  const requests = await getContentRequestsForClient(client.id);
  const activeRequests = requests.filter((r) =>
    ['Pending Review', 'In Progress', 'Awaiting Approval', 'Scheduled'].includes(r.status),
  ).length;
  const captures = isSimplifi ? await getPortalCaptures(slug) : [];

  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  return (
    <div className="ep-page">
      <PortalShell slug={slug} active="simplifi" firstName={firstName} shellNavGroups={access.shellNavGroups}>
      <main className="ep-main ep-main-shell">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Simplifi™</p>
          <h1 className="ep-welcome-heading">Your saved opportunities</h1>
          <p className="ep-pulse-summary">
            {isSimplifi
              ? 'Capture what matters, follow up when the time is right, and keep momentum visible.'
              : 'Simplifi is available as a standalone purchase. Your portal includes updates and activity tracking today.'}
          </p>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Your account</p>
          <table className="ep-info-table">
            <tbody>
              <tr>
                <td className="ep-info-label">Package</td>
                <td className="ep-info-value">{client.packagePurchased}</td>
              </tr>
              <tr>
                <td className="ep-info-label">Portal Access</td>
                <td className="ep-info-value">{client.portalAccessStatus}</td>
              </tr>
              <tr>
                <td className="ep-info-label">Active Update Requests</td>
                <td className="ep-info-value">{activeRequests}</td>
              </tr>
              <tr>
                <td className="ep-info-label">Onboarding</td>
                <td className="ep-info-value">{client.onboardingStatus ?? 'Not Started'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {isSimplifi ? (
          <>
            <SimplifiPortalWorkspace slug={slug} initialCaptures={captures} />
            <div className="ep-card">
              <p className="ep-card-title">Quick Links</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href={`/portal/${slug}/pulse`} className="ep-pulse-cta">
                  Open Pulse
                </Link>
                <Link
                  href={`/portal/${slug}/updates/new`}
                  className="ep-pulse-cta"
                  style={{ backgroundColor: NAVY, color: GOLD }}
                >
                  Submit Update
                </Link>
              </div>
            </div>
          </>
        ) : (
          <div className="ep-card">
            <p className="ep-card-title">Get Simplifi</p>
            <p className="ep-placeholder-text">
              Simplifi Early Access is $149 and includes personal opportunity intelligence plus
              portal access.
            </p>
            <Link
              href="/checkout?package=simplifi_early_access"
              className="ep-pulse-cta"
              style={{ backgroundColor: NAVY, color: GOLD }}
            >
              Start Simplifi
            </Link>
          </div>
        )}

        <div className="ep-card">
          <p className="ep-card-title">Advisor Note</p>
          <p className="ep-placeholder-text">
            Captures are analyzed automatically and linked to your Magnifi opportunity experience.
            Share Magnifi links with stakeholders when you are ready to discuss next steps.
          </p>
        </div>
      </main>
      </PortalShell>
    </div>
  );
}
