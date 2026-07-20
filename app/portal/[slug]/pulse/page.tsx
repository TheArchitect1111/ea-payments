import Link from 'next/link';
import { getClientSuccessProfile } from '@/lib/client-success';
import { PortalShell, NAVY, GOLD } from '@/lib/chassis/PortalShell';
import { PortalModuleChromeStrip } from '@/lib/chassis/PortalChromeContext';
import { requirePortalModule } from '@/lib/modules/portal-modules';
import { getTenantPulseMeasure } from '@/lib/portal-pulse-measure';
import OpportunitiesPanel from './OpportunitiesPanel';
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
  const { client } = await requirePortalModule(slug, 'pulse');
  const profile = await getClientSuccessProfile(client);
  const measure = getTenantPulseMeasure(slug);
  const firstName = client.clientName.split(' ')[0] ?? client.clientName;

  return (
    <PortalShell slug={slug} active="pulse" firstName={firstName}>
      <main className="ep-main">
        <PortalModuleChromeStrip />
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

        <OpportunitiesPanel slug={slug} />

        <div className="ep-card">
          <p className="ep-card-title">Recent activity</p>
          <p className="ep-placeholder-text">
            {measure.counts.total} tenant events · {measure.counts.highOrCritical} high or critical
          </p>
          {measure.recent.length === 0 ? (
            <p className="ep-placeholder-text">No recent Pulse activity for this portal yet.</p>
          ) : (
            <ul className="ep-pulse-list">
              {measure.recent.map((item) => (
                <li key={`${item.at}-${item.title}`}>
                  {item.href ? (
                    <Link href={item.href} style={{ color: NAVY }}>
                      {item.title}
                    </Link>
                  ) : (
                    item.title
                  )}
                  {item.detail ? ` — ${item.detail}` : ''}
                  <span className="ep-pulse-score-detail">
                    {' '}
                    · {new Date(item.at).toLocaleString()}
                    {item.priority ? ` · ${item.priority}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

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
    </PortalShell>
  );
}
