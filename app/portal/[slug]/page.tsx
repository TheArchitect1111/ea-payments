import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getPortalCaptures } from '@/lib/capture-records';
import { getClientSuccessProfile } from '@/lib/client-success';
import PasswordChangeModal from './PasswordChangeModal';
import { PortalShell, NAVY, GOLD } from '@/lib/chassis/PortalShell';
import EAPortalHubCards from '@/app/portal/components/EAPortalHubCards';
import PortalHomeExperience from '@/app/portal/components/PortalHomeExperience';
import { MetricBoxIcon, MetricUsersIcon } from '@/lib/chassis/PortalNavIcons';
import './ea-portal.css';

export const dynamic = 'force-dynamic';

function barHeights(count: number): number[] {
  const base = Math.max(1, count);
  return [0.45, 0.62, 0.55, 0.78, 0.68, 0.92, 0.7, 0.85, 0.6, 0.75, 0.8, 1].map((n) =>
    Math.round(n * (40 + base * 4)),
  );
}

export default async function PortalPage({
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
  if (session.slug !== slug) redirect(`/portal/${session.slug}`);

  const client = await getClientByPortalSlug(slug);
  if (!client) notFound();

  const [profile, captures] = await Promise.all([
    getClientSuccessProfile(client),
    getPortalCaptures(slug, 10),
  ]);

  const firstName = client.clientName.split(' ')[0] ?? client.clientName;
  const opportunities = captures.filter((c) => c.considerSlug || c.shareUrl);
  const onboardingPct = profile.operationalHealth;
  const bars = barHeights(captures.length);

  const paymentDateFormatted = client.paymentDate
    ? new Date(client.paymentDate + 'T12:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  const isActive = client.portalAccessStatus === 'Active';
  const supportEmail = process.env.SUPPORT_EMAIL ?? 'freedom@efficiencyarchitects.online';

  return (
    <PortalShell slug={slug} active="home" firstName={firstName}>
      <main className="ep-main">
        <section className="ep-metrics-grid">
          <div className="ep-metric-card">
            <div className="ep-metric-icon">
              <MetricUsersIcon />
            </div>
            <div className="ep-metric-body">
              <div>
                <p className="ep-metric-label">Operational Health</p>
                <p className="ep-metric-value">{profile.operationalHealth}</p>
              </div>
              <span className="ep-metric-badge ep-metric-badge-up">+{onboardingPct}%</span>
            </div>
          </div>
          <div className="ep-metric-card">
            <div className="ep-metric-icon">
              <MetricBoxIcon />
            </div>
            <div className="ep-metric-body">
              <div>
                <p className="ep-metric-label">Opportunities</p>
                <p className="ep-metric-value">{opportunities.length}</p>
              </div>
              <span className="ep-metric-badge ep-metric-badge-neutral">Live</span>
            </div>
          </div>
          <div className="ep-metric-card">
            <div className="ep-metric-icon">
              <MetricBoxIcon />
            </div>
            <div className="ep-metric-body">
              <div>
                <p className="ep-metric-label">Captures</p>
                <p className="ep-metric-value">{captures.length}</p>
              </div>
              <span className="ep-metric-badge ep-metric-badge-up">Simplifi</span>
            </div>
          </div>
          <div className="ep-metric-card">
            <div className="ep-metric-icon">
              <MetricUsersIcon />
            </div>
            <div className="ep-metric-body">
              <div>
                <p className="ep-metric-label">Portal</p>
                <p className="ep-metric-value" style={{ fontSize: '1.1rem' }}>
                  {isActive ? 'Active' : client.portalAccessStatus}
                </p>
              </div>
              <span className={`ep-metric-badge ${isActive ? 'ep-metric-badge-up' : 'ep-metric-badge-neutral'}`}>
                {isActive ? 'OK' : 'Review'}
              </span>
            </div>
          </div>
        </section>

        <PortalHomeExperience
          slug={slug}
          captureCount={captures.length}
          opportunityCount={opportunities.length}
        />

        <div className="ep-dashboard-grid">
          <div className="ep-panel">
            <div className="ep-panel-head">
              <div>
                <h2 className="ep-panel-title">Capture activity</h2>
                <p className="ep-panel-sub">Simplifi™ captures over recent months</p>
              </div>
            </div>
            <div className="ep-bar-chart" aria-hidden>
              {bars.map((h, i) => (
                <div key={i} className="ep-bar" style={{ height: `${h}px` }} />
              ))}
            </div>
          </div>

          <div className="ep-panel">
            <div className="ep-panel-head">
              <div>
                <h2 className="ep-panel-title">Monthly target</h2>
                <p className="ep-panel-sub">Onboarding & operational rhythm</p>
              </div>
            </div>
            <div className="ep-target-ring" style={{ ['--pct' as string]: `${onboardingPct}%` }}>
              <span className="ep-target-value">{onboardingPct}%</span>
            </div>
            <p className="ep-placeholder-text" style={{ textAlign: 'center' }}>
              {profile.summary}
            </p>
            <Link href={`/portal/${slug}/pulse`} className="ep-pulse-cta" style={{ display: 'flex', justifyContent: 'center' }}>
              View Pulse scores
            </Link>
          </div>
        </div>

        <EAPortalHubCards slug={slug} />

        <div className="ep-panel" style={{ marginBottom: 24 }}>
          <div className="ep-panel-head">
            <div>
              <h2 className="ep-panel-title">Recent captures</h2>
              <p className="ep-panel-sub">Latest Simplifi™ assets and share links</p>
            </div>
            <Link href={`/portal/${slug}/simplifi`} className="ep-pulse-cta ep-pulse-cta-outline" style={{ marginTop: 0 }}>
              See all
            </Link>
          </div>
          {captures.length === 0 ? (
            <p className="ep-placeholder-text">No captures yet. Open Simplifi to create your first opportunity.</p>
          ) : (
            <table className="ep-data-table">
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {captures.slice(0, 5).map((c) => (
                  <tr key={c.id}>
                    <td>{c.businessName || c.title || 'Capture'}</td>
                    <td>{c.captureType}</td>
                    <td>
                      <span
                        className={`ep-table-status ${
                          c.status === 'Routed'
                            ? 'ep-table-status-delivered'
                            : c.status === 'Archived'
                              ? 'ep-table-status-canceled'
                              : 'ep-table-status-pending'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ep-bento">
          <div className="ep-bento-span-8">
            <div className="ep-card ep-card-accent">
              <p className="ep-card-title">Simplifi™ → Magnifi™</p>
              <p className="ep-placeholder-text" style={{ color: 'rgba(255,255,255,0.85)' }}>
                Capture any marketing asset and generate a shareable Opportunity Experience for
                prospects — stored in Pulse automatically.
              </p>
              <Link href={`/portal/${slug}/simplifi`} className="ep-pulse-cta">
                Open Simplifi workspace
              </Link>
            </div>
          </div>

          <div className="ep-bento-span-4">
            <div className="ep-card">
              <p className="ep-card-title">Account</p>
              <table className="ep-info-table">
                <tbody>
                  <tr>
                    <td className="ep-info-label">Package</td>
                    <td className="ep-info-value">{client.packagePurchased}</td>
                  </tr>
                  <tr>
                    <td className="ep-info-label">Member since</td>
                    <td className="ep-info-value">{paymentDateFormatted}</td>
                  </tr>
                  <tr>
                    <td className="ep-info-label">Status</td>
                    <td className="ep-info-value">
                      <span className={`ep-status ${isActive ? 'ep-status-active' : 'ep-status-pending'}`}>
                        {client.portalAccessStatus}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="ep-card" style={{ marginTop: 16 }}>
          <p className="ep-card-title">Support</p>
          <p className="ep-placeholder-text">
            Questions? Reach your advisor at{' '}
            <a href={`mailto:${supportEmail}`} style={{ color: NAVY, fontWeight: 700 }}>
              {supportEmail}
            </a>
          </p>
        </div>
      </main>
      {!client.passwordChanged && <PasswordChangeModal />}
    </PortalShell>
  );
}
