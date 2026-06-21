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
import './ea-portal.css';

export const dynamic = 'force-dynamic';

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
    <div className="ep-page">
      <PortalShell slug={slug} active="home" firstName={firstName} />

      <main className="ep-main">
        <section className="ep-hero">
          <h1 className="ep-hero-greeting">Welcome in, {firstName}</h1>
          <p className="ep-hero-sub">
            Pulse, Simplifi, Magnifi, and Amplifi — your operating rhythm in one place.
          </p>
        </section>

        <EAPortalHubCards slug={slug} />

        <div className="ep-stats-row">
          <div className="ep-stat-pill">
            <p className="ep-stat-label">Operational Health</p>
            <p className="ep-stat-value">{profile.operationalHealth}</p>
            <div className="ep-progress-track">
              <div className="ep-progress-fill" style={{ width: `${onboardingPct}%` }} />
            </div>
          </div>
          <div className="ep-stat-pill">
            <p className="ep-stat-label">Opportunities</p>
            <p className="ep-stat-value ep-stat-value-gold">{opportunities.length}</p>
          </div>
          <div className="ep-stat-pill">
            <p className="ep-stat-label">Captures</p>
            <p className="ep-stat-value">{captures.length}</p>
          </div>
          <div className="ep-stat-pill">
            <p className="ep-stat-label">Portal</p>
            <p className="ep-stat-value" style={{ fontSize: '1rem' }}>
              {isActive ? 'Active' : client.portalAccessStatus}
            </p>
          </div>
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

          <div className="ep-bento-span-4">
            <div className="ep-card">
              <p className="ep-card-title">Pulse™</p>
              <p className="ep-placeholder-text">{profile.summary}</p>
              <Link href={`/portal/${slug}/pulse`} className="ep-pulse-cta">
                View scores
              </Link>
            </div>
          </div>

          <div className="ep-bento-span-4">
            <div className="ep-card">
              <p className="ep-card-title">Amplifi™</p>
              <p className="ep-placeholder-text">
                Your amplification story, stats, and links to latest Magnifi experiences.
              </p>
              <Link href={`/portal/${slug}/amplifi`} className="ep-pulse-cta ep-pulse-cta-outline">
                Open Amplifi
              </Link>
            </div>
          </div>

          <div className="ep-bento-span-4">
            <div className="ep-card ep-card-dark">
              <p className="ep-card-title">Latest share link</p>
              {opportunities[0]?.shareUrl || opportunities[0]?.considerSlug ? (
                <>
                  <p className="ep-placeholder-text">
                    {opportunities[0].businessName || opportunities[0].title}
                  </p>
                  <a
                    href={opportunities[0].shareUrl ?? `/consider/${opportunities[0].considerSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ep-pulse-cta"
                  >
                    Open Consider link
                  </a>
                </>
              ) : (
                <>
                  <p className="ep-placeholder-text">
                    Demo:{' '}
                    <a href="/consider/selena" style={{ color: GOLD }}>
                      /consider/selena
                    </a>
                  </p>
                  <Link href={`/portal/${slug}/simplifi`} className="ep-pulse-cta">
                    Create first capture
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="ep-card" style={{ marginTop: 16 }}>
          <p className="ep-card-title">Partner Portal</p>
          <p className="ep-placeholder-text">
            Part-time sales partners track referrals and commissions here — linked to Command Center.
          </p>
          <Link href="/partners/login" className="ep-pulse-cta ep-pulse-cta-outline">
            Partner sign in
          </Link>
        </div>

        <div className="ep-card">
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
    </div>
  );
}
