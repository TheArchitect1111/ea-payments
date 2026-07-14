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

const WORKSPACE_DIRECTORY = [
  { title: 'Decisions', description: 'Commitments that need your judgment', href: '/admin/decisions' },
  { title: 'Organizations', description: 'Account health and next moves', href: '/admin/organizations' },
  { title: 'Operations', description: 'Operating condition and blockers', href: '/admin/operations' },
  { title: 'Products', description: 'Portfolio strength and gaps', href: '/admin/products' },
  { title: 'Intelligence', description: 'Interpretation of what the business is saying', href: '/admin/intelligence' },
  { title: 'Factory', description: 'Launch the next delivery motion', href: '/admin/factory' },
  { title: 'Search', description: 'Locate any certified EA asset', href: '/admin/search' },
  { title: 'Atlas', description: 'How the enterprise connects', href: '/admin/atlas' },
  { title: 'Knowledge', description: 'Institutional memory and playbooks', href: '/admin/knowledge' },
  { title: 'Capabilities', description: 'What EA is ready to deliver', href: '/admin/capabilities' },
] as const;

const QUEUE_HORIZONS: DecisionHorizon[] = ['Immediate', 'Today', 'This Week'];

const HORIZON_TONE: Record<DecisionHorizon, string> = {
  Immediate: '#991b1b',
  Today: NAVY,
  'This Week': '#775d12',
  Strategic: '#475569',
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

/** Suppress Why when it restates label or detail — keep the stronger unique wording only. */
function distinctWhy(why: string | undefined, label: string, detail: string): string | undefined {
  if (!why?.trim()) return undefined;
  const candidate = why.trim();
  if (titlesOverlap(candidate, detail) || titlesOverlap(candidate, label)) return undefined;
  return candidate;
}

function calmDestinationLabel(actionLabel?: string, recommendedAction?: string): string {
  const phrase = (actionLabel || recommendedAction || '').trim();
  if (!phrase) return 'Continue to Decisions';
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
      label: 'Nothing requires you',
      detail: 'Hold steady. The business is clear.',
      href: '/admin/operations',
      destinationLabel: 'Continue to Operations',
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

  const href = decision.actionUrl || matched?.href || '/admin/decisions';

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

/** A1 — EI summary prose only; no priority-string concatenation. */
function buildExecutiveContext(intelligence: ExecutiveIntelligenceBundle): string {
  const { businessHealthDetail, mostImportantRecommendation, topRisk, businessHealth } =
    intelligence.summary;
  const parts = [
    businessHealthDetail || `${businessHealth}.`,
    mostImportantRecommendation ? `Next focus: ${mostImportantRecommendation}` : '',
    topRisk && topRisk !== 'No critical risk currently evidenced.'
      ? `Watch: ${topRisk}`
      : '',
  ].filter(Boolean);
  return parts.join(' ');
}

const HEALTH_TONE: Record<HealthScoreStatus, string> = {
  Strong: '#047857',
  Watch: '#775d12',
  'At Risk': '#991b1b',
};

function shortHealthName(name: string): string {
  return name.replace(' Health', '');
}

type CriticalSignal = {
  id: string;
  title: string;
  detail: string;
  href: string;
  tone: string;
};

type QueueRow = {
  id: string;
  lane: string;
  tone: string;
  title: string;
  why: string;
  href: string;
};

function buildQueueRows(
  lanes: DecisionLane[],
  topDecision: BriefCard | undefined,
  decisions: DecisionIntelligenceBundle,
): QueueRow[] {
  const diRows: QueueRow[] = [];
  for (const horizon of QUEUE_HORIZONS) {
    for (const item of decisions.queue[horizon]) {
      if (topDecision && titlesOverlap(item.title, topDecision.title)) continue;
      diRows.push({
        id: item.id,
        lane: horizon,
        tone: HORIZON_TONE[horizon],
        title: item.title,
        why: item.whyThisMatters || item.reason,
        href: item.href || '/admin/decisions',
      });
      if (diRows.length >= 5) return diRows;
    }
  }

  if (diRows.length > 0) return diRows;

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
          href: item.actionUrl ?? '/admin/decisions',
        })),
    )
    .slice(0, 5);
}

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
  const dailyBrief = rhythm.dailyBrief;
  const yesterdayHighlights = dailyBrief.yesterday.filter((item) => item.value > 0).slice(0, 3);
  const attentionFromBrief = dailyBrief.needsAttention.filter((item) => item.value > 0).slice(0, 2);

  const attentionCards = [
    ...(lanes.find((l) => l.lane === 'Immediate')?.items ?? []),
    ...(lanes.find((l) => l.lane === 'Today')?.items ?? []),
  ]
    .filter((item) => item.id !== topDecision?.id)
    .slice(0, 3);

  const criticalSignals: CriticalSignal[] = [];

  for (const item of yesterdayHighlights) {
    if (criticalSignals.length >= 4) break;
    criticalSignals.push({
      id: `yesterday-${item.label}`,
      title: `${item.value} ${item.label}`,
      detail: item.detail || 'Overnight signal',
      href: '/admin/intelligence',
      tone: NAVY,
    });
  }

  for (const item of attentionCards) {
    if (criticalSignals.length >= 4) break;
    criticalSignals.push({
      id: item.id,
      title: item.title,
      detail: metadataString(item, 'whyRecommended') || item.summary,
      href: item.actionUrl ?? '/admin/decisions',
      tone: item.priority >= 85 ? '#991b1b' : NAVY,
    });
  }

  if (criticalSignals.length < 4) {
    for (const item of attentionFromBrief) {
      if (criticalSignals.length >= 4) break;
      if (criticalSignals.some((s) => s.title.includes(item.label))) continue;
      criticalSignals.push({
        id: `attention-${item.label}`,
        title: `${item.value} ${item.label}`,
        detail: item.detail || 'Needs attention',
        href: '/admin/decisions',
        tone: '#775d12',
      });
    }
  }

  const queueRows = buildQueueRows(lanes, topDecision, decisions);
  const contextProse = buildExecutiveContext(intelligence);
  const allHealthy = rhythm.healthScores.every((score) => score.status === 'Strong');

  return (
    <section className="space-y-12">
      {lastUpdated ? (
        <div className="flex flex-wrap items-baseline justify-end gap-3">
          <p className="text-xs text-neutral-400">Updated {lastUpdated}</p>
        </div>
      ) : null}

      {/* Hero — Mission Control #1 + why / outcome / destination */}
      <section id="executive-briefing" aria-labelledby="next-move-title">
        <a
          id="next-move"
          href={recommendation.href}
          className="block transition hover:opacity-95"
          style={{
            borderLeft: `3px solid ${recommendation.urgent ? '#991b1b' : NAVY}`,
            backgroundColor: recommendation.urgent ? '#fff7f7' : CREAM,
            padding: '1.75rem 1.5rem 1.75rem 1.75rem',
          }}
        >
          <h2
            id="next-move-title"
            className="max-w-3xl text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl"
            style={{ color: recommendation.urgent ? '#991b1b' : NAVY }}
          >
            {recommendation.label}
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-neutral-600">{recommendation.detail}</p>
          {recommendation.why ? (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-neutral-600">
              <span className="font-semibold" style={{ color: NAVY }}>
                Why:{' '}
              </span>
              {recommendation.why}
            </p>
          ) : null}
          {recommendation.expectedOutcome ? (
            <p className="mt-2 max-w-2xl text-sm leading-6 text-neutral-600">
              <span className="font-semibold" style={{ color: NAVY }}>
                Expected outcome:{' '}
              </span>
              {recommendation.expectedOutcome}
            </p>
          ) : null}
          <p
            className="mt-5 text-xs font-semibold tracking-wide"
            style={{ color: recommendation.urgent ? '#991b1b' : NAVY }}
          >
            {recommendation.destinationLabel} →
          </p>
        </a>
      </section>

      <section id="business-health" aria-labelledby="signal-strip-title">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
          <h3 id="signal-strip-title" className="text-sm font-bold" style={{ color: NAVY }}>
            {allHealthy ? 'All systems healthy' : 'Business signals'}
          </h3>
          <a href="/admin/operations" className="text-xs text-neutral-400 transition hover:text-neutral-700">
            Operations
          </a>
        </div>
        <div className="grid grid-cols-2 gap-x-8 gap-y-6 border-y border-neutral-200 py-6 sm:grid-cols-3 lg:grid-cols-5">
          {rhythm.healthScores.map((score: BusinessHealthScore) => {
            const tone = HEALTH_TONE[score.status];
            const quiet = score.status === 'Strong';
            return (
              <a key={score.name} href="/admin/operations" className="group block min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                  {shortHealthName(score.name)}
                </p>
                <p
                  className="mt-2 text-3xl font-extralight tabular-nums tracking-tight"
                  style={{ color: quiet ? NAVY : tone }}
                >
                  {score.score}
                </p>
                <p className="mt-1 text-xs" style={{ color: quiet ? '#a3a3a3' : tone }}>
                  {score.status}
                </p>
              </a>
            );
          })}
        </div>
      </section>

      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        <section id="attention" aria-labelledby="critical-signals-title">
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
            <h3 id="critical-signals-title" className="text-sm font-bold" style={{ color: NAVY }}>
              Critical signals
            </h3>
            <a href="/admin/intelligence" className="text-xs text-neutral-400 transition hover:text-neutral-700">
              Intelligence
            </a>
          </div>
          {criticalSignals.length > 0 ? (
            <ul className="space-y-5">
              {criticalSignals.map((signal) => (
                <li key={signal.id}>
                  <a href={signal.href} className="group block">
                    <span className="flex gap-3">
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ backgroundColor: signal.tone }}
                        aria-hidden
                      />
                      <span className="min-w-0">
                        <strong className="block text-sm leading-6 group-hover:underline" style={{ color: NAVY }}>
                          {signal.title}
                        </strong>
                        <span className="mt-1 block text-xs leading-5 text-neutral-500">{signal.detail}</span>
                      </span>
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm leading-6 text-neutral-500">No critical signals.</p>
          )}
        </section>

        {/* A1 — Today's Context from EI summary */}
        <section id="operating-rhythm" aria-labelledby="context-title">
          <h3 id="context-title" className="mb-5 text-sm font-bold" style={{ color: NAVY }}>
            Today&apos;s context
          </h3>
          <p className="text-base leading-7 text-neutral-600">{contextProse}</p>
          <p className="mt-6">
            <a href="/admin/intelligence" className="text-xs text-neutral-400 transition hover:text-neutral-700">
              Full interpretation
            </a>
          </p>
        </section>
      </div>

      {/* A3 — Decision queue with DI framing when available */}
      <section id="decision-center" aria-labelledby="decision-queue-title">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3 border-t border-neutral-200 pt-10">
          <h3 id="decision-queue-title" className="text-sm font-bold" style={{ color: NAVY }}>
            Decision queue
          </h3>
          <a href="/admin/decisions" className="text-xs text-neutral-400 transition hover:text-neutral-700">
            All decisions
          </a>
        </div>
        {queueRows.length > 0 ? (
          <ul className="divide-y divide-neutral-100">
            {queueRows.map((row) => (
              <li key={row.id}>
                <a
                  href={row.href}
                  className="group flex gap-4 py-4 transition hover:bg-neutral-50/80"
                >
                  <span
                    className="mt-0.5 w-24 shrink-0 text-[11px] font-semibold uppercase tracking-wide"
                    style={{ color: row.tone }}
                  >
                    {row.lane}
                  </span>
                  <span className="min-w-0 flex-1">
                    <strong className="block text-sm group-hover:underline" style={{ color: NAVY }}>
                      {row.title}
                    </strong>
                    <span className="mt-1 block text-xs leading-5 text-neutral-500">{row.why}</span>
                  </span>
                  <span
                    className="mt-0.5 shrink-0 text-xs text-neutral-300 transition group-hover:text-neutral-500"
                    aria-hidden
                  >
                    →
                  </span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm leading-6 text-neutral-500">No other decisions waiting.</p>
        )}
      </section>

      <nav aria-label="Workspaces" className="border-t border-neutral-200 pt-10">
        <p className="mb-6 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
          Workspaces
        </p>
        <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 lg:grid-cols-5">
          {WORKSPACE_DIRECTORY.map((link) => (
            <a key={link.href} href={link.href} className="group block min-w-0">
              <strong className="block text-sm group-hover:underline" style={{ color: NAVY }}>
                {link.title}
              </strong>
              <span className="mt-1 block text-xs leading-5 text-neutral-500">{link.description}</span>
            </a>
          ))}
        </div>
      </nav>

      <div id="mission-control" className="sr-only" aria-hidden="true" />
      <div id="todays-focus" className="sr-only" aria-hidden="true" />
      <div id="health" className="sr-only" aria-hidden="true" />
      <div id="create-catalog" className="sr-only" aria-hidden="true" />
    </section>
  );
}
