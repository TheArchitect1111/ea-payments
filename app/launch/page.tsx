import Link from 'next/link';
import { buildLaunchCommandCenterReport } from '@/lib/launch-command-center';
import type { LaunchCheckItem, LaunchStatus } from '@/lib/launch-command-center';

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

export default async function LaunchCommandCenterPage() {
  const report = await buildLaunchCommandCenterReport();
  const byCategory = report.items.reduce<Record<string, LaunchCheckItem[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#0f1729] text-white px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[#C9A844]">Launch Command Center</p>
        <h1 className="mt-3 text-3xl font-black">Readiness report</h1>
        <p className="mt-2 text-neutral-400 text-sm">
          Automated checks for Airtable, Stripe, Resend, Make, DNS, Sentry, and product flows.
          Updated {new Date(report.generatedAt).toLocaleString()}.
        </p>

        <section className="mt-8 border border-[#C9A844]/30 bg-[#1B2B4D] p-6">
          <p className="text-5xl font-black text-[#C9A844]">{report.readinessScore}</p>
          <p className="text-sm text-neutral-300 mt-1">Launch Readiness Score / 100</p>
          <ScoreBar score={report.readinessScore} />
          <p className="mt-4 text-sm">
            Platform status:{' '}
            <strong className="text-white">{report.status.replace(/_/g, ' ')}</strong>
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-neutral-400 sm:grid-cols-4">
            <span>Complete: {report.summary.complete}</span>
            <span>Missing: {report.summary.missing}</span>
            <span>Needs creds: {report.summary.needsCredentials}</span>
            <span>Human action: {report.summary.needsHumanAction}</span>
          </div>
        </section>

        {Object.entries(byCategory).map(([category, items]) => (
          <section key={category} className="mt-10">
            <h2 className="text-lg font-bold text-[#C9A844]">{category}</h2>
            <ul className="mt-3 grid gap-3">
              {items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </ul>
          </section>
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
          <p>CLI: <code className="text-neutral-300">npm run launch:report</code></p>
          <p>Full check: <code className="text-neutral-300">npm run launch:check</code></p>
        </section>
      </div>
    </main>
  );
}
