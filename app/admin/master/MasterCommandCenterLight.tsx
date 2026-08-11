import type { MissionControlResponse } from '@ea/portal-chassis/mission-control';
import type { ExecutiveOperatingRhythm } from '@/lib/executive-operating-rhythm';
import type { ExecutiveIntelligenceBundle } from '@/lib/executive-intelligence';
import type { DecisionIntelligenceBundle } from '@/lib/executive-decision-intelligence';

type Props = {
  mission: MissionControlResponse;
  rhythm: ExecutiveOperatingRhythm;
  intelligence: ExecutiveIntelligenceBundle;
  decisions: DecisionIntelligenceBundle;
  lastUpdated?: string;
};

const GOLD = '#B98222';
const INK = '#172033';
const MUTED = '#697386';
const PANEL = '#FFFFFF';
const BORDER = '#E8E4DB';

function countByPriority(mission: MissionControlResponse, min: number) {
  return mission.todaysFocus.filter((item) => item.priority >= min).length;
}

function firstAction(mission: MissionControlResponse) {
  return [...mission.todaysFocus].sort((a, b) => b.priority - a.priority)[0];
}

function firstRevenueScore(rhythm: ExecutiveOperatingRhythm) {
  return rhythm.healthScores.find((score) => /revenue/i.test(score.name)) ?? rhythm.healthScores[0];
}

function intelligenceSummary(intelligence: ExecutiveIntelligenceBundle) {
  return (
    intelligence.summary.mostImportantRecommendation ||
    intelligence.summary.topOpportunity ||
    intelligence.summary.businessHealthDetail ||
    'Executive intelligence will surface here as new signals arrive.'
  );
}

function decisionRows(decisions: DecisionIntelligenceBundle) {
  return [
    ...decisions.queue.Immediate,
    ...decisions.queue.Today,
    ...decisions.queue['This Week'],
  ].slice(0, 4);
}

const quickActions = [
  { label: 'New project', detail: 'Start an initiative', href: '/admin/ea-factory/quick-launch', icon: '+' },
  { label: 'EA Factory', detail: 'Build & deploy', href: '/admin/ea-factory', icon: '◇' },
  { label: 'CTP review', detail: 'Review submissions', href: '/admin/ctp', icon: '✓' },
  { label: 'Clients', detail: 'Accounts & delivery', href: '/admin/delivery', icon: '◎' },
  { label: 'Amplifi', detail: 'Campaign studio', href: '/amplifi', icon: 'A' },
  { label: 'Reports', detail: 'Executive analytics', href: '/admin/dashboard', icon: '↗' },
] as const;

export function MasterCommandCenterLight({
  mission,
  rhythm,
  intelligence,
  decisions,
  lastUpdated,
}: Props) {
  const topAction = firstAction(mission);
  const revenue = firstRevenueScore(rhythm);
  const urgentCount = countByPriority(mission, 65);
  const decisionsList = decisionRows(decisions);
  const systemScore = rhythm.healthScores.length
    ? Math.round(rhythm.healthScores.reduce((sum, item) => sum + item.score, 0) / rhythm.healthScores.length)
    : 0;
  const activeProjects = mission.todaysFocus.length;

  return (
    <section className="space-y-6 pb-8" style={{ color: INK }}>
      <section
        className="relative overflow-hidden rounded-[28px] border px-6 py-7 shadow-[0_18px_55px_rgba(73,55,23,0.08)] sm:px-8 sm:py-9"
        style={{
          borderColor: BORDER,
          background:
            'radial-gradient(circle at 82% 18%, rgba(217,168,79,.24), transparent 26%), linear-gradient(135deg,#fffdf8 0%,#f8f4ea 58%,#f5eee1 100%)',
        }}
      >
        <div className="absolute right-6 top-6 hidden h-28 w-28 rounded-full border border-[#d8c8a5]/40 sm:block" />
        <div className="absolute right-10 top-10 hidden h-20 w-20 rounded-full border border-[#d8c8a5]/35 sm:block" />
        <div className="relative flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl text-xl shadow-sm"
                style={{ backgroundColor: '#FFF7E7', color: GOLD }}
              >
                ☀
              </span>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em]" style={{ color: GOLD }}>
                  Executive OS
                </p>
                <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Good morning, Robert.</h1>
              </div>
            </div>
            <p className="mt-5 max-w-2xl text-sm leading-6" style={{ color: MUTED }}>
              You have {urgentCount || 0} priorit{urgentCount === 1 ? 'y' : 'ies'} that deserve attention today. Everything else can stay quiet until it matters.
            </p>
          </div>
          <div className="rounded-2xl border bg-white/80 px-4 py-3 text-right shadow-sm" style={{ borderColor: BORDER }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: MUTED }}>
              Mission Control
            </p>
            <p className="mt-1 text-sm font-semibold">{lastUpdated ? `Updated ${lastUpdated}` : 'Live executive view'}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Active priorities', value: activeProjects, detail: `${urgentCount} need attention`, icon: '▣' },
          { label: 'Revenue health', value: revenue?.score ?? '—', detail: revenue?.status ?? 'Awaiting signal', icon: '$' },
          { label: 'System score', value: `${systemScore || '—'}${systemScore ? '/100' : ''}`, detail: 'Executive operating health', icon: '⌁' },
          { label: 'Decision queue', value: decisionsList.length, detail: 'Items awaiting judgment', icon: '✓' },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border p-5 shadow-[0_10px_30px_rgba(50,45,35,0.05)]"
            style={{ borderColor: BORDER, backgroundColor: PANEL }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold" style={{ color: MUTED }}>
                {metric.label}
              </span>
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#FBF4E8] font-bold" style={{ color: GOLD }}>
                {metric.icon}
              </span>
            </div>
            <div className="mt-4 text-3xl font-black tracking-tight">{metric.value}</div>
            <p className="mt-1 text-xs" style={{ color: MUTED }}>
              {metric.detail}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,.7fr)]">
        <div className="space-y-5">
          <section className="rounded-[24px] border bg-white p-6 shadow-[0_14px_40px_rgba(50,45,35,0.05)]" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Next best action
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-tight">
                  {topAction?.actionLabel || topAction?.title || 'Nothing requires you right now'}
                </h2>
              </div>
              <span className="rounded-full bg-[#EEF8F1] px-3 py-1 text-xs font-semibold text-[#257A45]">
                {topAction?.priority && topAction.priority >= 85 ? 'Immediate' : 'Today'}
              </span>
            </div>
            <p className="mt-3 max-w-3xl text-sm leading-6" style={{ color: MUTED }}>
              {topAction?.summary || 'The executive queue is clear. Review clients or launch work when you are ready.'}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <a
                href={topAction?.actionUrl || '/admin/delivery'}
                className="rounded-xl px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5"
                style={{ backgroundColor: GOLD }}
              >
                Review now →
              </a>
              <a
                href="#executive-intelligence"
                className="rounded-xl border px-4 py-2.5 text-sm font-semibold"
                style={{ borderColor: BORDER, color: INK }}
              >
                Why this matters
              </a>
            </div>
          </section>

          <section className="rounded-[24px] border bg-white p-6 shadow-[0_14px_40px_rgba(50,45,35,0.05)]" style={{ borderColor: BORDER }}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Today&apos;s priorities
                </p>
                <h2 className="mt-1 text-xl font-black">What is moving now</h2>
              </div>
              <a href="/admin/delivery" className="text-sm font-semibold" style={{ color: GOLD }}>
                View all work →
              </a>
            </div>
            <div className="mt-5 overflow-hidden rounded-2xl border" style={{ borderColor: BORDER }}>
              {mission.todaysFocus.slice(0, 6).map((item, index) => (
                <a
                  key={item.id}
                  href={item.actionUrl || '/admin/master'}
                  className="grid gap-3 border-b px-4 py-4 transition hover:bg-[#FCFAF5] last:border-b-0 sm:grid-cols-[minmax(0,1.6fr)_90px_110px] sm:items-center"
                  style={{ borderColor: BORDER }}
                >
                  <div>
                    <strong className="block text-sm">{item.title}</strong>
                    <span className="mt-1 block text-xs leading-5" style={{ color: MUTED }}>
                      {item.summary}
                    </span>
                  </div>
                  <span className="text-xs font-semibold" style={{ color: item.priority >= 85 ? '#A53A38' : GOLD }}>
                    {item.priority >= 85 ? 'Immediate' : item.priority >= 65 ? 'Today' : 'This week'}
                  </span>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-[10px]" style={{ color: MUTED }}>
                      <span>Priority</span>
                      <span>{item.priority}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-[#F0EDE7]">
                      <span className="block h-full rounded-full" style={{ width: `${Math.min(100, item.priority)}%`, backgroundColor: index === 0 ? GOLD : '#7D8FCC' }} />
                    </div>
                  </div>
                </a>
              ))}
              {mission.todaysFocus.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm" style={{ color: MUTED }}>
                  No active priorities right now.
                </div>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] border bg-white p-6 shadow-[0_14px_40px_rgba(50,45,35,0.05)]" style={{ borderColor: BORDER }}>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                Command center
              </p>
              <h2 className="mt-1 text-xl font-black">Quick launch</h2>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {quickActions.map((action) => (
                <a
                  key={action.href}
                  href={action.href}
                  className="group rounded-2xl border p-4 text-center transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ borderColor: BORDER }}
                >
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-[#FBF4E8] text-lg font-black" style={{ color: GOLD }}>
                    {action.icon}
                  </span>
                  <strong className="mt-3 block text-sm">{action.label}</strong>
                  <span className="mt-1 block text-[11px]" style={{ color: MUTED }}>
                    {action.detail}
                  </span>
                </a>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section id="executive-intelligence" className="rounded-[24px] border bg-white p-6 shadow-[0_14px_40px_rgba(50,45,35,0.05)]" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                Executive intelligence
              </p>
              <span className="rounded-full bg-[#F4F1FB] px-2.5 py-1 text-[10px] font-semibold text-[#6A5C99]">
                {intelligence.summary.executiveConfidence} confidence
              </span>
            </div>
            <blockquote className="mt-5 border-l-2 pl-4 text-sm leading-6" style={{ borderColor: GOLD, color: INK }}>
              {intelligenceSummary(intelligence)}
            </blockquote>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-[#FAF7F0] p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                  Opportunity
                </span>
                <strong className="mt-1 block text-sm">{intelligence.summary.topOpportunity || 'Monitoring'}</strong>
              </div>
              <div className="rounded-xl bg-[#FAF7F0] p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: MUTED }}>
                  Risk
                </span>
                <strong className="mt-1 block text-sm">{intelligence.summary.topRisk || 'No critical risk'}</strong>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border bg-white p-6 shadow-[0_14px_40px_rgba(50,45,35,0.05)]" style={{ borderColor: BORDER }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: GOLD }}>
                  Decision queue
                </p>
                <h2 className="mt-1 text-lg font-black">Awaiting judgment</h2>
              </div>
              <span className="rounded-full bg-[#FFF6DE] px-2.5 py-1 text-xs font-bold" style={{ color: GOLD }}>
                {decisionsList.length}
              </span>
            </div>
            <div className="mt-4 divide-y" style={{ borderColor: BORDER }}>
              {decisionsList.map((item) => (
                <a key={item.id} href={item.href || '/admin/master'} className="block py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <strong className="text-sm">{item.title}</strong>
                    <span className="rounded-full bg-[#F4F1FB] px-2 py-1 text-[10px] font-semibold text-[#6A5C99]">Review</span>
                  </div>
                  <p className="mt-1 text-xs leading-5" style={{ color: MUTED }}>
                    {item.whyThisMatters || item.reason}
                  </p>
                </a>
              ))}
              {decisionsList.length === 0 ? (
                <p className="py-2 text-sm" style={{ color: MUTED }}>
                  No decisions are waiting.
                </p>
              ) : null}
            </div>
          </section>

          <section className="rounded-[24px] border p-6" style={{ borderColor: '#E5D6B6', background: 'linear-gradient(145deg,#FFFDF8,#F8F1E4)' }}>
            <span className="text-2xl" style={{ color: GOLD }}>♛</span>
            <p className="mt-4 text-lg font-black leading-6">We architect outcomes.</p>
            <p className="mt-2 text-xs leading-5" style={{ color: MUTED }}>
              Keep the executive surface focused on decisions, progress and leverage. Everything else stays one click away.
            </p>
          </section>
        </aside>
      </section>

      <div id="mission-control" className="sr-only" aria-hidden="true" />
      <div id="todays-focus" className="sr-only" aria-hidden="true" />
      <div id="health" className="sr-only" aria-hidden="true" />
      <div id="create-catalog" className="sr-only" aria-hidden="true" />
    </section>
  );
}
