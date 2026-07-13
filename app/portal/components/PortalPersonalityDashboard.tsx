import Link from 'next/link';
import type { ReactNode } from 'react';
import type { PortalWorkspaceChrome } from '@/lib/platform/portal-workspace';

const SECTION_ALIASES: Record<string, string> = {
  // operations / creative
  needsAttention: 'decisionsRequired',
  continueWorking: 'executiveBriefing',
  systemHealth: 'executiveBriefing',
  whileYouWereAway: 'recentWork',
  creativeQueue: 'recentWork',
  assetLibrary: 'recentWork',
  calendar: 'workspaceDock',
  // compliance (3hc)
  risksRequiringAction: 'decisionsRequired',
  upcomingDeadlines: 'executiveBriefing',
  readinessFocus: 'todaysFocus',
  evidenceUpdates: 'recentWork',
  // athletics (cpr)
  playerFocus: 'todaysFocus',
  eligibilityAlerts: 'decisionsRequired',
  recentAthleteActivity: 'recentWork',
  upcomingEvents: 'workspaceDock',
  // financial coaching (etfm)
  clientFocus: 'todaysFocus',
  actionPlanAlerts: 'decisionsRequired',
  progressUpdates: 'executiveBriefing',
  upcomingSessions: 'workspaceDock',
  // training / learning (bob)
  learningFocus: 'todaysFocus',
  certificationAlerts: 'decisionsRequired',
  continueLearning: 'executiveBriefing',
  learnerSupport: 'recentWork',
};

export function resolvePrimaryActionHref(slug: string, action: string): string {
  const a = action.toLowerCase();
  if (a.includes('pulse') || a.includes('brief') || a.includes('recommend') || a.includes('decision')) {
    return `/portal/${slug}/pulse`;
  }
  if (a.includes('simplifi') || a.includes('draft') || a.includes('capture') || a.includes('approve') || a.includes('asset')) {
    return `/portal/${slug}/simplifi`;
  }
  if (a.includes('train') || a.includes('lesson') || a.includes('learning') || a.includes('certif')) {
    return `/portal/${slug}/learning`;
  }
  if (a.includes('update') || a.includes('family') || a.includes('message')) {
    return `/portal/${slug}/updates`;
  }
  if (a.includes('connect') || a.includes('session') || a.includes('schedule')) {
    return `/portal/${slug}/connect`;
  }
  if (a.includes('amplifi') || a.includes('campaign')) {
    return `/portal/${slug}/amplifi`;
  }
  return `/portal/${slug}`;
}

export function PortalPersonalityRail({
  slug,
  chrome,
  isEmpty,
}: {
  slug: string;
  chrome: Pick<
    PortalWorkspaceChrome,
    | 'personalityName'
    | 'focusLabel'
    | 'attentionLabel'
    | 'primaryActions'
    | 'emptyStateLanguage'
    | 'widgets'
  >;
  isEmpty?: boolean;
}) {
  return (
    <section className="ep-personality-rail" aria-label="Workspace personality">
      <div className="ep-personality-rail-head">
        <div>
          <p className="ep-personality-eyebrow">{chrome.personalityName} workspace</p>
          <h2 className="ep-personality-title">{chrome.focusLabel}</h2>
          <p className="ep-personality-sub">{chrome.attentionLabel}</p>
        </div>
        <div className="ep-personality-actions">
          {chrome.primaryActions.slice(0, 3).map((action) => (
            <Link
              key={action}
              href={resolvePrimaryActionHref(slug, action)}
              className="ep-pulse-cta ep-pulse-cta-outline"
              style={{ marginTop: 0 }}
            >
              {action}
            </Link>
          ))}
        </div>
      </div>
      {isEmpty ? (
        <p className="ep-placeholder-text ep-personality-empty">{chrome.emptyStateLanguage}</p>
      ) : null}
      {chrome.widgets.length > 0 ? (
        <div className="ep-personality-widgets">
          {chrome.widgets.slice(0, 4).map((w) => (
            <div key={w.id} className="ep-personality-widget">
              <span className="ep-hub-tag">{w.zone || 'widget'}</span>
              <strong>{w.title}</strong>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}

/** Order known portal dashboard blocks by personality sectionOrder. */
export function orderDashboardSections(
  sectionOrder: string[],
  blocks: Record<string, ReactNode>,
): ReactNode[] {
  const canonical = sectionOrder.map((key) => SECTION_ALIASES[key] || key);
  const seen = new Set<string>();
  const ordered: ReactNode[] = [];

  for (const key of canonical) {
    if (seen.has(key) || !(key in blocks)) continue;
    seen.add(key);
    ordered.push(<div key={key} data-dashboard-section={key}>{blocks[key]}</div>);
  }

  for (const key of Object.keys(blocks)) {
    if (seen.has(key)) continue;
    ordered.push(<div key={key} data-dashboard-section={key}>{blocks[key]}</div>);
  }

  return ordered;
}
