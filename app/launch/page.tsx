import Link from 'next/link';
import { cookies } from 'next/headers';
import { verifyAdminSession, EA_ADMIN_COOKIE } from '@/lib/ea-admin-auth';
import { redirectToAdminLogin } from '@/lib/admin-redirect';
import { buildLaunchCommandCenterReport } from '@/lib/launch-command-center';
import type { LaunchCheckItem, LaunchSectionSummary, LaunchStatus } from '@/lib/launch-command-center';
import type { LaunchReadinessCategory, LaunchReadinessStatus } from '@/lib/launch-readiness';

export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<LaunchStatus, string> = {
  complete: 'Complete',
  missing: 'Missing',
  needs_credentials: 'Needs credentials',
  needs_human_action: 'Needs human action',
};

const STATUS_CLASS: Record<LaunchStatus, string> = {
  complete: 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10',
  missing: 'text-red-400 border-red-400/40 bg-red-400/10',
  needs_credentials: 'text-amber-400 border-amber-400/40 bg-amber-400/10',
  needs_human_action: 'text-sky-400 border-sky-400/40 bg-sky-400/10',
};

const PLATFORM_STATUS_LABEL: Record<LaunchReadinessStatus, string> = {
  build_ready: 'Build Ready',
  revenue_ready: 'Revenue Ready',
  delivery_ready: 'Delivery Ready',
  controlled_paid_launch_ready: 'Controlled Paid Launch Ready',
  full_launch_ready: 'Full Launch Ready',
  scale_ready: 'Scale Ready',
  needs_setup: 'Needs Setup',
};

function ScoreBar({ score }: { score: number }) {
  const filled = Math.round(score / 5);
  return (
    <div className="flex gap-0.5 mt-3" aria-hidden>
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className={`h-2 flex-1 rounded-sm ${i < filled ? 'bg-[#C9A844]' : 'bg-white/10'}`}
        />
      ))}
    </div>
  );
}

function ReadinessCard({
  title,
  category,
}: {
  title: string;
  category: LaunchReadinessCategory;
}) {
  return (
    <div className="border border-white/10 bg-white/[0.03] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="text-sm font-bold text-white">{title}</h2>
        <span
          className={`text-xs px-2 py-0.5 border rounded-full ${
            category.ready
              ? 'text-emerald-400 border-emerald-400/40 bg-emerald-400/10'
              : 'text-amber-400 border-amber-400/40 bg-amber-400/10'
          }`}
        >
          {category.ready ? 'Ready' : 'Needs attention'}
        </span>
      </div>
      <p className="mt-2 text-xs text-neutral-400">{category.purpose}</p>
      {category.missing.length > 0 ? (
        <ul className="mt-3 space-y-1 text-xs text-neutral-300">
          {category.missing.map((missing) => (
            <li key={missing}>{missing}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-xs text-emerald-300">No missing items.</p>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: LaunchCheckItem }) {
  return (
    <li className="border border-white/10 p-4 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-white">{item.name}</p>
        <span className={`text-xs px-2 py-0.5 border rounded-full ${STATUS_CLASS[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
      </div>
      <p className="mt-2 text-neutral-400">{item.message}</p>
      <p className="mt-1 text-xs text-neutral-500">
        Automation: <span className="text-neutral-300">{item.automation.replace(/_/g, ' ')}</span>
        {item.maxScore > 0 && (
          <>
            {' '}
            · Score: {item.score}/{item.maxScore}
          </>
        )}
      </p>
      {item.fix && <p className="mt-2 text-xs text-[#C9A844]">Fix: {item.fix}</p>}
      {item.verify && <p className="mt-1 text-xs text-neutral-500">Verify: {item.verify}</p>}
    </li>
  );
}

function SectionBlock({ section }: { section: LaunchSectionSummary }) {
  const pct = section.maxScore > 0 ? Math.round((section.score / section.maxScore) * 100) : null;
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold text-[#C9A844]">{section.name}</h2>
        {pct !== null && (
          <span className="text-xs text-neutral-400">
            {section.score}/{section.maxScore} pts ({pct}%)
          </span>
        )}
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        Complete: {section.complete} · Blockers: {section.blockers} · Warnings: {section.warnings}
      </p>
      <ul className="mt-3 grid gap-3">
        {section.items.map((item) => (
          <ItemRow key={item.id} item={item} />
        ))}
      </ul>
    </section>
  );
}

export default async function LaunchCommandCenterPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(EA_ADMIN_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    redirectToAdminLogin('/launch');
  }

  const report = await buildLaunchCommandCenterReport();

  return (
    <main className="min-h-screen bg-[#0f1729] text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Launch Command Center</p>
        <h1 className="mt-3 text-3xl font-black">Readiness report</h1>
        <p className="mt-2 text-neutral-400 text-sm">
          Automated checks for infrastructure, payments, communications, onboarding, domains, and security.
          Updated {new Date(report.generatedAt).toLocaleString()}.
        </p>

        <section className="mt-8 border border-[#C9A844]/30 bg-[#1B2B4D] p-6">
          <p className="text-5xl font-black text-[#C9A844]">{report.readinessScore}</p>
          <p className="text-sm text-neutral-300 mt-1">Launch Readiness Score / 100</p>
          <ScoreBar score={report.readinessScore} />
          <p className="mt-4 text-sm">
            Platform status:{' '}
            <strong className="text-white">{PLATFORM_STATUS_LABEL[report.status]}</strong>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-3">
            <span>Launch blockers: {report.launchBlockers}</span>
            <span>Warnings: {report.warnings}</span>
            <span>Complete: {report.summary.complete}</span>
          </div>
          <p className="mt-4 text-sm text-sky-300 border-t border-white/10 pt-4">
            <strong className="text-white">Next:</strong> {report.recommendedNextAction}
          </p>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold text-[#C9A844]">Readiness Breakdown</h2>
            <span className="text-xs text-neutral-400">
              Critical: {report.readiness.criticalReady ? 'ready' : 'not ready'} {' / '} Full launch:{' '}
              {report.readiness.fullLaunchReady ? 'ready' : 'not ready'}
            </span>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <ReadinessCard title="Revenue Readiness" category={report.readiness.missing.revenue} />
            <ReadinessCard title="Delivery Readiness" category={report.readiness.missing.delivery} />
            <ReadinessCard title="Monitoring Readiness" category={report.readiness.missing.monitoring} />
            <ReadinessCard title="Resilience Readiness" category={report.readiness.missing.resilience} />
          </div>
        </section>

        {report.sections.map((section) => (
          <SectionBlock key={section.id} section={section} />
        ))}

        <section className="mt-10 text-sm text-neutral-400 space-y-2 border-t border-white/10 pt-8">
          <p>
            <Link href="/api/health/command-center" className="text-[#C9A844] underline">
              JSON API
            </Link>{' '}
            ·{' '}
            <Link href="/api/health/launch" className="text-[#C9A844] underline">
              Health launch
            </Link>{' '}
            ·{' '}
            <Link href="/start" className="text-[#C9A844] underline">
              Tester hub
            </Link>
          </p>
          <p>
            Guides:{' '}
            <span className="text-neutral-300">{report.links.friendTestingGuide}</span> ·{' '}
            <span className="text-neutral-300">{report.links.finalReport}</span>
          </p>
          <p>
            CLI: <code className="text-neutral-300">npm run launch:report</code>
          </p>
        </section>
      </div>
    </main>
  );
}
