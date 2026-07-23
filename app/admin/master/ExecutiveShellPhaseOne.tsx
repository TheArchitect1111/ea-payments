import type { BriefCard } from '@ea/portal-chassis/brief';
import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import { CREAM, NAVY } from '@/lib/design-system';
import type {
  BusinessHealthScore,
  ExecutiveOperatingRhythm,
  HealthScoreStatus,
} from '@/lib/executive-operating-rhythm';
import type { ExecutiveIntelligenceBundle } from '@/lib/executive-intelligence';
import type {
  DecisionHorizon,
  DecisionIntelligenceBundle,
  DecisionIntelligenceItem,
} from '@/lib/executive-decision-intelligence';

type ExecutiveShellPhaseOneProps = {
  mission: MissionControlResponse;
  rhythm: ExecutiveOperatingRhythm;
  intelligence: ExecutiveIntelligenceBundle;
  decisions: DecisionIntelligenceBundle;
  lastUpdated?: string;
};

type DecisionLaneName = 'Immediate' | 'Today' | 'This Week' | 'Informational';

type DecisionLane = {
  lane: DecisionLaneName;
  tone: string;
  items: BriefCard[];
};

/** Primary destinations only — everything else lives under More. */
const PRIMARY_ACTIONS = [
  { title: 'Clients', description: 'Accounts and next moves', href: '/admin/delivery' },
  { title: 'Launch', description: 'Delivery and Factory', href: '/admin/factory' },
] as const;

const MORE_WORKSPACES = [
  { title: 'Capabilities', href: '/admin/capability-marketplace' },
  { title: 'CTP', href: '/admin/ctp' },
  { title: 'Website + Portal ops', href: '/admin/master#website-portal-ops' },
] as const;

const QUEUE_HORIZONS: DecisionHorizon[] = ['Immediate', 'Today', 'This Week'];

const HORIZON_TONE: Record<DecisionHorizon, string> = {
  Immediate: '#991b1b',
  Today: NAVY,
  'This Week': '#775d12',
  Strategic: '#475569',
};

const HEALTH_TONE: Record<HealthScoreStatus, string> = {
  Strong: '#047857',
  Watch: '#775d12',
  'At Risk': '#991b1b',
};

function laneFor(item: BriefCard): DecisionLaneName {
  if (item.priority >= 85) return 'Immediate';
  if (item.priority >= 65) return 'Today';
  if (item.priority >= 40) return 'This Week';
  return 'Informational';
}

function classifyFocus(mission: MissionControlResponse): DecisionLane[] {
  const groups: Record<DecisionLaneName, BriefCard[]> = {
    Immediate: [],
    Today: [],
    'This Week': [],
    Informational: [],
  };

  for (const item of mission.todaysFocus) {
    groups[laneFor(item)].push(item);
  }

  return [
    { lane: 'Immediate', tone: '#991b1b', items: groups.Immediate },
    { lane: 'Today', tone: NAVY, items: groups.Today },
    { lane: 'This Week', tone: '#775d12', items: groups['This Week'] },
    { lane: 'Informational', tone: '#475569', items: groups.Informational },
  ];
}

function firstDecision(lanes: DecisionLane[]): BriefCard | undefined {
  return (
    lanes.find((lane) => lane.lane === 'Immediate')?.items[0] ??
    lanes.find((lane) => lane.lane === 'Today')?.items[0] ??
    lanes.find((lane) => lane.lane === 'This Week')?.items[0]
  );
}

function metadataString(card: BriefCard | undefined, key: string): string | undefined {
  if (!card?.metadata || typeof card.metadata !== 'object') return undefined;
  const value = card.metadata[key];
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, ' ').trim();
}

function titlesOverlap(a: string, b: string): boolean {
  const left = normalize(a);
  const right = normalize(b);
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function distinctWhy(why: string | undefined, label: string, detail: string): string | undefined {
  if (!why?.trim()) return undefined;
  const candidate = why.trim();
  if (titlesOverlap(candidate, detail) || titlesOverlap(candidate, label)) return undefined;
  return candidate;
}

function calmDestinationLabel(actionLabel?: string, recommendedAction?: string): string {
  const phrase = (actionLabel || recommendedAction || '').trim();
  if (!phrase) return 'Continue';
  const cleaned = phrase.replace(/^(go|open)\s*:?\s*/i, '').trim() || phrase;
  if (/^(continue|review|open|see)\b/i.test(cleaned)) return cleaned;
  return `Continue: ${cleaned}`;
}

function findMatchingDecision(
  hero: BriefCard | undefined,
  decisions: DecisionIntelligenceBundle,
): DecisionIntelligenceItem | undefined {
  if (!hero) return undefined;
  const pool = [
    ...QUEUE_HORIZONS.flatMap((horizon) => decisions.queue[horizon]),
    ...decisions.recommendations,
  ];
  return pool.find(
    (item) =>
      titlesOverlap(item.title, hero.title) ||
      titlesOverlap(item.title, hero.actionLabel || '') ||
      titlesOverlap(item.recommendedAction, hero.actionLabel || '') ||
      titlesOverlap(item.recommendedAction, hero.title),
  );
}

function recommendationFor(
  decision: BriefCard | undefined,
  matched: DecisionIntelligenceItem | undefined,
  decisions: DecisionIntelligenceBundle,
): {
  label: string;
  detail: string;
  why?: string;
  expectedOutcome?: string;
  href: string;
  destinationLabel: string;
  urgent: boolean;
} {
  if (!decision) {
    return {
      label: 'Nothing requires you right now',
      detail: 'Hold steady. Check revenue and client activity below when you are ready.',
      href: '/admin/delivery',
      destinationLabel: 'Review clients',
      urgent: false,
    };
  }

  const label = decision.actionLabel || decision.title;
  const detail = decision.actionLabel ? decision.title : decision.summary;

  const rawWhy =
    metadataString(decision, 'whyRecommended') ||
    matched?.whyThisMatters ||
    matched?.reason ||
    (titlesOverlap(decisions.dashboard.highestPriorityDecision, decision.title)
      ? decisions.dashboard.why
      : undefined);

  const expectedOutcome =
    matched?.expectedOutcome ||
    (titlesOverlap(decisions.dashboard.highestPriorityDecision, decision.title)
      ? decisions.dashboard.expectedOutcome
      : undefined);

  const href = decision.actionUrl || matched?.href || '/admin/master';

  return {
    label,
    detail,
    why: distinctWhy(rawWhy, label, detail),
    expectedOutcome,
    href,
    destinationLabel: calmDestinationLabel(decision.actionLabel, matched?.recommendedAction),
    urgent: decision.priority >= 65,
  };
}

type QueueRow = {
  id: string;
  lane: string;
  tone: string;
  title: string;
  why: string;
  href: string;
};

function buildPriorityRows(
  lanes: DecisionLane[],
  topDecision: BriefCard | undefined,
  decisions: DecisionIntelligenceBundle,
): QueueRow[] {
  const rows: QueueRow[] = [];
  for (const horizon of QUEUE_HORIZONS) {
    for (const item of decisions.queue[horizon]) {
      if (topDecision && titlesOverlap(item.title, topDecision.title)) continue;
      rows.push({
        id: item.id,
        lane: horizon,
        tone: HORIZON_TONE[horizon],
        title: item.title,
        why: item.whyThisMatters || item.reason,
        href: item.href || '/admin/master',
      });
      if (rows.length >= 3) return rows;
    }
  }

  if (rows.length > 0) return rows;

  return lanes
    .filter((lane) => lane.lane !== 'Informational')
    .flatMap((lane) =>
      lane.items
        .filter((item) => item.id !== topDecision?.id)
        .map((item) => ({
          id: item.id,
          lane: lane.lane,
          tone: lane.tone,
          title: item.title,
          why: metadataString(item, 'whyRecommended') || item.summary,
          href: item.actionUrl ?? '/admin/master',
        })),
    )
    .slice(0, 3);
}

function revenueScore(rhythm: ExecutiveOperatingRhythm): BusinessHealthScore | undefined {
  return rhythm.healthScores.find((score) => /revenue/i.test(score.name));
}

function pipelineSignals(rhythm: ExecutiveOperatingRhythm): Array<{ label: string; detail: string }> {
  const fromBrief = rhythm.dailyBrief.yesterday
    .filter((item) => /revenue|paid|proposal|payment|pipeline|checkout/i.test(item.label))
    .slice(0, 2)
    .map((item) => ({
      label: `${item.value} ${item.label}`,
      detail: item.detail || 'Pipeline signal',
    }));

  const momentum = (rhythm as { momentum?: Array<{ label: string; value: number }> }).momentum;
  // daily brief needsAttention payment-ish
  const attention = rhythm.dailyBrief.needsAttention
    .filter((item) => /payment|proposal|revenue|fail/i.test(item.label))
    .slice(0, 2)
    .map((item) => ({
      label: `${item.value} ${item.label}`,
      detail: item.detail || 'Needs follow-up',
    }));

  void momentum;
  return [...fromBrief, ...attention].slice(0, 3);
}

function alertRows(
  lanes: DecisionLane[],
  topDecision: BriefCard | undefined,
  rhythm: ExecutiveOperatingRhythm,
): Array<{ id: string; title: string; detail: string; href: string; tone: string }> {
  const alerts: Array<{ id: string; title: string; detail: string; href: string; tone: string }> = [];

  for (const item of [
    ...(lanes.find((l) => l.lane === 'Immediate')?.items ?? []),
    ...(lanes.find((l) => l.lane === 'Today')?.items ?? []),
  ]) {
    if (item.id === topDecision?.id) continue;
    alerts.push({
      id: item.id,
      title: item.title,
      detail: metadataString(item, 'whyRecommended') || item.summary,
      href: item.actionUrl ?? '/admin/master',
      tone: item.priority >= 85 ? '#991b1b' : NAVY,
    });
    if (alerts.length >= 3) return alerts;
  }

  for (const item of rhythm.dailyBrief.needsAttention.filter((a) => a.value > 0)) {
    if (alerts.length >= 3) break;
    alerts.push({
      id: `attention-${item.label}`,
      title: `${item.value} ${item.label}`,
      detail: item.detail || 'Needs attention',
      href: '/admin/master',
      tone: '#775d12',
    });
  }

  return alerts;
}

/**
 * Executive home — less is more.
 * Answers: What needs me? What about revenue? What next? What can wait?
 */
export function ExecutiveShellPhaseOne({
  mission,
  rhythm,
  intelligence,
  decisions,
  lastUpdated,
}: ExecutiveShellPhaseOneProps) {
  const lanes = classifyFocus(mission);
  const topDecision = firstDecision(lanes);
  const matchedDecision = findMatchingDecision(topDecision, decisions);
  const recommendation = recommendationFor(topDecision, matchedDecision, decisions);
  const priorities = buildPriorityRows(lanes, topDecision, decisions);
  const alerts = alertRows(lanes, topDecision, rhythm);
  const revenue = revenueScore(rhythm);
  const pipeline = pipelineSignals(rhythm);
  const waitingCount =
    (lanes.find((l) => l.lane === 'This Week')?.items.length ?? 0) +
    (lanes.find((l) => l.lane === 'Informational')?.items.length ?? 0);

  void intelligence;
  void mission;

  return (
    <section className="space-y-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
            Mission Control
          </p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight" style={{ color: NAVY }}>
            What needs you today
          </h1>
        </div>
        {lastUpdated ? (
          <p className="text-xs text-neutral-400">Updated {lastUpdated}</p>
        ) : null}
      </header>

      {/* 1 — Primary next action */}
      <section aria-labelledby="next-move-title">
        <a
          id="next-move"
          href={recommendation.href}
          className="block transition hover:opacity-95"
          style={{
            borderLeft: `3px solid ${recommendation.urgent ? '#991b1b' : NAVY}`,
            backgroundColor: recommendation.urgent ? '#fff7f7' : CREAM,
            padding: '1.5rem 1.35rem',
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
            Do this next
          </p>
          <h2
            id="next-move-title"
            className="mt-2 max-w-3xl text-2xl font-extrabold leading-tight tracking-tight sm:text-3xl"
            style={{ color: recommendation.urgent ? '#991b1b' : NAVY }}
          >
            {recommendation.label}
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">{recommendation.detail}</p>
          {recommendation.why ? (
            <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-600">
              <span className="font-semibold" style={{ color: NAVY }}>
                Why:{' '}
              </span>
              {recommendation.why}
            </p>
          ) : null}
          <p
            className="mt-4 text-xs font-semibold tracking-wide"
            style={{ color: recommendation.urgent ? '#991b1b' : NAVY }}
          >
            {recommendation.destinationLabel} →
          </p>
        </a>
      </section>

      {/* 2 — Four answers */}
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="priorities-title">
          <h3 id="priorities-title" className="text-sm font-bold" style={{ color: NAVY }}>
            Today&apos;s priorities
          </h3>
          {priorities.length > 0 ? (
            <ul className="mt-4 divide-y divide-neutral-100">
              {priorities.map((row) => (
                <li key={row.id}>
                  <a href={row.href} className="group flex gap-3 py-3">
                    <span
                      className="mt-0.5 w-20 shrink-0 text-[10px] font-semibold uppercase tracking-wide"
                      style={{ color: row.tone }}
                    >
                      {row.lane}
                    </span>
                    <span className="min-w-0">
                      <strong className="block text-sm group-hover:underline" style={{ color: NAVY }}>
                        {row.title}
                      </strong>
                      <span className="mt-1 block text-xs leading-5 text-neutral-500">{row.why}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No other priorities waiting.</p>
          )}
        </section>

        <section aria-labelledby="alerts-title">
          <h3 id="alerts-title" className="text-sm font-bold" style={{ color: NAVY }}>
            Alerts
          </h3>
          {alerts.length > 0 ? (
            <ul className="mt-4 space-y-4">
              {alerts.map((alert) => (
                <li key={alert.id}>
                  <a href={alert.href} className="group flex gap-3">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                      style={{ backgroundColor: alert.tone }}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <strong className="block text-sm group-hover:underline" style={{ color: NAVY }}>
                        {alert.title}
                      </strong>
                      <span className="mt-1 block text-xs leading-5 text-neutral-500">{alert.detail}</span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">No alerts.</p>
          )}
        </section>

        <section aria-labelledby="revenue-title">
          <h3 id="revenue-title" className="text-sm font-bold" style={{ color: NAVY }}>
            Revenue pipeline
          </h3>
          {revenue ? (
            <a href="/admin/dashboard" className="mt-4 block">
              <p className="text-[11px] uppercase tracking-wider text-neutral-400">{revenue.name}</p>
              <p
                className="mt-1 text-3xl font-extralight tabular-nums"
                style={{ color: HEALTH_TONE[revenue.status] }}
              >
                {revenue.score}
              </p>
              <p className="mt-1 text-xs" style={{ color: HEALTH_TONE[revenue.status] }}>
                {revenue.status}
                {revenue.factors[0] ? ` · ${revenue.factors[0]}` : ''}
              </p>
            </a>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">Revenue signal unavailable.</p>
          )}
          {pipeline.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {pipeline.map((item) => (
                <li key={item.label} className="text-xs leading-5 text-neutral-600">
                  <span className="font-semibold" style={{ color: NAVY }}>
                    {item.label}
                  </span>
                  {item.detail ? ` — ${item.detail}` : ''}
                </li>
              ))}
            </ul>
          ) : null}
        </section>

        <section aria-labelledby="quick-actions-title">
          <h3 id="quick-actions-title" className="text-sm font-bold" style={{ color: NAVY }}>
            Quick actions
          </h3>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PRIMARY_ACTIONS.map((action) => (
              <li key={action.href}>
                <a
                  href={action.href}
                  className="block border border-neutral-200 px-3 py-3 transition hover:border-neutral-400"
                >
                  <strong className="block text-sm" style={{ color: NAVY }}>
                    {action.title}
                  </strong>
                  <span className="mt-1 block text-xs text-neutral-500">{action.description}</span>
                </a>
              </li>
            ))}
          </ul>
          {waitingCount > 0 ? (
            <p className="mt-4 text-xs text-neutral-500">
              {waitingCount} item{waitingCount === 1 ? '' : 's'} can wait — see More below.
            </p>
          ) : null}
        </section>
      </div>

      {/* 3 — Everything else one click away, not on the home surface */}
      <details className="border-t border-neutral-200 pt-6">
        <summary className="cursor-pointer text-sm font-bold" style={{ color: NAVY }}>
          More workspaces
        </summary>
        <nav aria-label="More workspaces" className="mt-4 flex flex-wrap gap-x-6 gap-y-3">
          {MORE_WORKSPACES.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-neutral-600 underline-offset-2 hover:underline"
            >
              {link.title}
            </a>
          ))}
        </nav>
      </details>

      <div id="mission-control" className="sr-only" aria-hidden="true" />
      <div id="todays-focus" className="sr-only" aria-hidden="true" />
      <div id="health" className="sr-only" aria-hidden="true" />
      <div id="create-catalog" className="sr-only" aria-hidden="true" />
    </section>
  );
}
