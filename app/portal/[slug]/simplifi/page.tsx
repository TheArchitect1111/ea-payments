import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug, getContentRequestsForClient } from '@/lib/airtable';
import { PortalShell, NAVY, GOLD } from '@/lib/chassis/PortalShell';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

export default async function SimplifiClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;
  if (!token) redirect('/portal/login');

  const session = await verifySession(token);
  if (!session) redirect('/portal/login');
  if (session.slug !== slug) redirect(`/portal/${session.slug}/simplifi`);

  const client = await getClientByPortalSlug(slug);
  if (!client) notFound();

  const isSimplifi = client.packagePurchased === 'Simplifi';
  const requests = await getContentRequestsForClient(client.id);
  const activeRequests = requests.filter((r) =>
    ['Pending Review', 'In Progress', 'Awaiting Approval', 'Scheduled'].includes(r.status),
  ).length;

  return (
    <div className="ep-page">
      <PortalShell slug={slug} active="simplifi" />

      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Simplifi™</p>
          <h1 className="ep-welcome-heading">Your Opportunity Workspace</h1>
          <p className="ep-pulse-summary">
            {isSimplifi
              ? 'Capture opportunities, track follow-through, and keep momentum visible in Pulse.'
              : 'Simplifi early access is available as a standalone purchase. Your portal includes Pulse and Update Hub today.'}
          </p>
        </div>

        <div className="ep-card">
          <p className="ep-card-title">Workspace Status</p>
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
          <div className="ep-card">
            <p className="ep-card-title">What You Can Do Now</p>
            <ul className="ep-pulse-list">
              <li>Track progress and capacity gains in Pulse</li>
              <li>Submit content and opportunity updates through Update Hub</li>
              <li>Work with your advisor to activate full capture + audit workflows</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
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
            Full in-portal capture and website audit tools are being enabled for early access
            clients. Your advisor can configure these from Mission Control during onboarding.
          </p>
        </div>
      </main>
    </div>
  );
}
