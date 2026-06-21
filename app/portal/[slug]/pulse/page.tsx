import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { verifySession, EA_PORTAL_COOKIE } from '@/lib/ea-portal-auth';
import { getClientByPortalSlug } from '@/lib/airtable';
import { getClientSuccessProfile } from '@/lib/client-success';
import { PortalNav, NAVY, GOLD } from '../PortalNav';
import '../ea-portal.css';

export const dynamic = 'force-dynamic';

function ScoreRing({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="ep-score-ring" style={{ ['--pct' as string]: `${pct}%` }}>
      <span className="ep-score-value">{value}</span>
    </div>
  );
}

export default async function PulsePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PORTAL_COOKIE)?.value;

  if (!token) {
    redirect(`/portal/login`);
  }

  const session = await verifySession(token);
  if (!session) {
    redirect(`/portal/login`);
  }

  if (session.slug !== slug) {
    redirect(`/portal/${session.slug}/pulse`);
  }

  const client = await getClientByPortalSlug(slug);
  if (!client) {
    notFound();
  }

  const profile = await getClientSuccessProfile(client);
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  return (
    <div className="ep-page">
      <PortalNav slug={slug} active="pulse" />

      <main className="ep-main">
        <div className="ep-welcome">
          <p className="ep-welcome-label">Pulse</p>
          <h1 className="ep-welcome-heading">Your Progress, {firstName}</h1>
          <p className="ep-pulse-summary">{profile.summary}</p>
        </div>

        <div className="ep-card ep-pulse-health">
          <p className="ep-card-title">Operational Health</p>
          <div className="ep-pulse-health-row">
            <ScoreRing value={profile.operationalHealth} max={100} />
            <div>
              <p className="ep-pulse-health-label">{profile.healthLabel}</p>
              <p className="ep-pulse-health-detail">
                Composite of capacity, engagement, training, and portal activity.
              </p>
            </div>
          </div>
        </div>

        <div className="ep-pulse-grid">
          {profile.scores
            .filter((score) => score.id !== 'health')
            .map((score) => (
              <div key={score.id} className="ep-card ep-pulse-score-card">
                <p className="ep-card-title">{score.label}</p>
                <p className="ep-pulse-score-number" style={{ color: NAVY }}>
                  {score.value}
                  <span className="ep-pulse-score-max"> / {score.max}</span>
                </p>
                <p className="ep-pulse-score-detail">{score.detail}</p>
              </div>
            ))}
        </div>

        {profile.proposalId && (
          <div className="ep-card">
            <p className="ep-card-title">Your Assessment</p>
            <p className="ep-placeholder-text">
              Review your full capacity analysis and opportunity range.
            </p>
            <Link
              href={`/proposal/${encodeURIComponent(profile.proposalId)}`}
              className="ep-pulse-cta"
              style={{ backgroundColor: NAVY, color: GOLD }}
            >
              View Analysis
            </Link>
          </div>
        )}

        <div className="ep-card">
          <p className="ep-card-title">What Pulse Tracks</p>
          <ul className="ep-pulse-list">
            <li>Capacity reclaimed and operational readiness</li>
            <li>Engagement across onboarding and portal activity</li>
            <li>Training completion as modules unlock</li>
            <li>Overall operational health for renewals and referrals</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
