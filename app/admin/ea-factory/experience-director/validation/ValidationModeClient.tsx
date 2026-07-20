'use client';

import { useCallback, useMemo, useState } from 'react';
import Link from 'next/link';
import { GOLD, NAVY } from '@/lib/design-system';
import type {
  ExperienceDirectorValidationAnalytics,
  ExperienceDirectorValidationEntry,
  FrequencyRow,
  ScoreAverages,
} from '@/lib/factory-experience-director-validation';

const AVG_LABELS: Array<{ key: keyof ScoreAverages; label: string }> = [
  { key: 'overall', label: 'Average Overall Score' },
  { key: 'story', label: 'Average Story Score' },
  { key: 'visual', label: 'Average Visual Score' },
  { key: 'originality', label: 'Average Originality Score' },
  { key: 'executiveExperience', label: 'Average Executive Experience Score' },
  { key: 'wow', label: 'Average Wow Score' },
];

function formatWhen(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-neutral-200 bg-[#FAF8F3] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums" style={{ color: NAVY }}>
        {value}
        <span className="text-sm font-semibold text-neutral-400">/100</span>
      </p>
    </div>
  );
}

function FreqList({ title, rows }: { title: string; rows: FrequencyRow[] }) {
  return (
    <article className="border border-neutral-200 bg-white p-5 shadow-sm">
      <h2 className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row, index) => (
            <li
              key={`${row.label}-${index}`}
              className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-2 text-sm last:border-0"
            >
              <span className="min-w-0 break-words text-neutral-700">{row.label}</span>
              <span className="shrink-0 font-bold tabular-nums text-neutral-900">{row.count}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

export default function ValidationModeClient({
  initialAnalytics,
}: {
  initialAnalytics: ExperienceDirectorValidationAnalytics;
}) {
  const [analytics, setAnalytics] = useState(initialAnalytics);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/experience-director/validation', {
        credentials: 'include',
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        analytics?: ExperienceDirectorValidationAnalytics;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.analytics) {
        setMessage(data.error || 'Could not refresh validation analytics.');
        return;
      }
      setAnalytics(data.analytics);
    } catch {
      setMessage('Could not refresh validation analytics.');
    } finally {
      setBusy(false);
    }
  }, []);

  const selectedCompare = useMemo(() => {
    if (!showCompare || compareIds.length < 2) return [];
    const byId = new Map(analytics.entries.map((e) => [e.id, e]));
    return compareIds
      .map((id) => byId.get(id))
      .filter(Boolean) as ExperienceDirectorValidationEntry[];
  }, [analytics.entries, compareIds, showCompare]);

  function toggleCompare(id: string) {
    setShowCompare(false);
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) {
        setMessage('You can compare up to 4 reviews at a time.');
        return prev;
      }
      setMessage(null);
      return [...prev, id];
    });
  }

  function runCompare() {
    if (compareIds.length < 2) {
      setMessage('Select at least two reviews to compare.');
      return;
    }
    setMessage(null);
    setShowCompare(true);
  }

  const trend = analytics.trends;
  const trendLabel =
    trend.improvingOverTime == null
      ? trend.trendDelta === 0
        ? 'Stable across periods'
        : 'Not enough periods yet'
      : trend.improvingOverTime
        ? `Improving (+${trend.trendDelta ?? 0} pts overall)`
        : `Declining (${trend.trendDelta ?? 0} pts overall)`;

  return (
    <div className="space-y-8">
      {message ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-xl bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200"
        >
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          {analytics.reviewCount} validation review(s) across {analytics.projectCount} project(s)
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ea-factory/experience-director"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
          >
            Director Reviews
          </Link>
          <Link
            href="/admin/ea-factory/experience-director/calibration"
            className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]"
          >
            Calibration
          </Link>
          <button
            type="button"
            disabled={busy}
            onClick={() => void refresh()}
            className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {busy ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>

      <section aria-labelledby="score-averages-heading">
        <h2
          id="score-averages-heading"
          className="text-xs font-bold uppercase tracking-[0.24em]"
          style={{ color: GOLD }}
        >
          Score averages
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVG_LABELS.map((row) => (
            <ScoreCard key={row.key} label={row.label} value={analytics.averages[row.key]} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Status mix
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between gap-3">
              <span>Approved</span>
              <strong className="tabular-nums">{analytics.statusCounts.Approved}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Needs Refinement</span>
              <strong className="tabular-nums">{analytics.statusCounts['Needs Refinement']}</strong>
            </li>
            <li className="flex justify-between gap-3">
              <span>Rejected</span>
              <strong className="tabular-nums">{analytics.statusCounts.Rejected}</strong>
            </li>
          </ul>
        </article>
        <article className="border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Trend analysis
          </h2>
          <p className="mt-2 text-xl font-black" style={{ color: NAVY }}>
            {trendLabel}
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            Weakest categories:{' '}
            {trend.weakestCategories.length
              ? trend.weakestCategories
                  .slice(0, 3)
                  .map((c) => `${c.category} (${c.average})`)
                  .join(' · ')
              : '—'}
          </p>
          {trend.byPeriod.length ? (
            <div className="-mx-1 mt-4 overflow-x-auto px-1">
              <table className="min-w-[320px] w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th scope="col" className="py-2 pr-4">
                      Period
                    </th>
                    <th scope="col" className="py-2 pr-4">
                      Reviews
                    </th>
                    <th scope="col" className="py-2">
                      Avg Overall
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {trend.byPeriod.map((p) => (
                    <tr key={p.period} className="border-t border-neutral-100">
                      <td className="py-2 pr-4 font-mono text-xs">{p.period}</td>
                      <td className="py-2 pr-4 tabular-nums">{p.count}</td>
                      <td className="py-2 font-semibold tabular-nums">{p.averageOverall}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-neutral-500">
              Record Validation Mode reviews to unlock week-over-week trends.
            </p>
          )}
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <FreqList title="Most common rejection reasons" rows={analytics.mostCommonRejectionReasons} />
        <FreqList
          title="Most common required improvements"
          rows={analytics.mostCommonRequiredImprovements}
        />
        <FreqList
          title="Constitution rules failing most"
          rows={analytics.constitutionRulesFailingMost}
        />
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Industries scoring lower
        </h2>
        {trend.industriesScoringLower.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No industry data yet.</p>
        ) : (
          <div className="-mx-1 mt-4 overflow-x-auto px-1">
            <table className="min-w-[640px] w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th scope="col" className="px-3 py-2">
                    Industry
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Reviews
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Avg Overall
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Story
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Visual
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Originality
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Executive
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Wow
                  </th>
                </tr>
              </thead>
              <tbody>
                {trend.industriesScoringLower.map((row) => (
                  <tr key={row.industry} className="border-b border-neutral-100">
                    <td className="px-3 py-2 font-semibold">{row.industry}</td>
                    <td className="px-3 py-2 tabular-nums">{row.count}</td>
                    <td className="px-3 py-2 font-bold tabular-nums">{row.averageOverall}</td>
                    <td className="px-3 py-2 tabular-nums">{row.averages.story}</td>
                    <td className="px-3 py-2 tabular-nums">{row.averages.visual}</td>
                    <td className="px-3 py-2 tabular-nums">{row.averages.originality}</td>
                    <td className="px-3 py-2 tabular-nums">{row.averages.executiveExperience}</td>
                    <td className="px-3 py-2 tabular-nums">{row.averages.wow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Compare reviews
            </h2>
            <p className="mt-2 text-xl font-black" style={{ color: NAVY }}>
              Cross-project comparison
            </p>
            <p className="mt-1 text-sm text-neutral-500">
              Select up to 4 validation reviews, then compare scores and rationale side by side.
            </p>
          </div>
          <button
            type="button"
            disabled={compareIds.length < 2}
            onClick={runCompare}
            className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Compare selected ({compareIds.length})
          </button>
        </div>

        {selectedCompare.length >= 2 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {selectedCompare.map((entry) => (
              <article key={entry.id} className="border border-neutral-200 bg-[#FAF8F3] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-neutral-900">{entry.client}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{entry.industry}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    {entry.approvalStatus}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black tabular-nums" style={{ color: NAVY }}>
                  {entry.scores.overall}
                  <span className="text-sm font-semibold text-neutral-400">/100</span>
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                  <div>Story {entry.scores.story}</div>
                  <div>Visual {entry.scores.visual}</div>
                  <div>Originality {entry.scores.originality}</div>
                  <div>Executive {entry.scores.executiveExperience}</div>
                  <div>Wow {entry.scores.wow}</div>
                  <div className="truncate">Reviewer {entry.reviewer}</div>
                </dl>
                <p className="mt-3 break-all text-xs text-neutral-500">
                  Blueprint: <span className="font-mono">{entry.blueprintVersion}</span>
                </p>
                <p className="mt-2 text-sm leading-6 text-neutral-700">{entry.rationale}</p>
                {entry.requiredImprovements.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-neutral-600">
                    {entry.requiredImprovements.slice(0, 4).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        <div className="-mx-1 mt-6 overflow-x-auto px-1">
          <table className="min-w-[720px] w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th scope="col" className="px-3 py-2">
                  Compare
                </th>
                <th scope="col" className="px-3 py-2">
                  Client
                </th>
                <th scope="col" className="px-3 py-2">
                  Status
                </th>
                <th scope="col" className="px-3 py-2">
                  Overall
                </th>
                <th scope="col" className="px-3 py-2">
                  Industry
                </th>
                <th scope="col" className="px-3 py-2">
                  Reviewer
                </th>
                <th scope="col" className="px-3 py-2">
                  When
                </th>
                <th scope="col" className="px-3 py-2">
                  Blueprint
                </th>
              </tr>
            </thead>
            <tbody>
              {analytics.entries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                    No validation reviews yet. Use Validation Mode on the Experience Director page
                    to record reviews with rationale.
                  </td>
                </tr>
              ) : (
                analytics.entries.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-100 align-top">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={compareIds.includes(entry.id)}
                        onChange={() => toggleCompare(entry.id)}
                        aria-label={`Select ${entry.client} review from ${formatWhen(entry.reviewedAt)} for comparison`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-semibold">{entry.client}</div>
                      <div className="mt-1 max-w-xs text-xs text-neutral-500 line-clamp-2">
                        {entry.rationale}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs font-bold uppercase tracking-wider">
                      {entry.approvalStatus}
                    </td>
                    <td className="px-3 py-2 font-bold tabular-nums">{entry.scores.overall}</td>
                    <td className="px-3 py-2">{entry.industry}</td>
                    <td className="px-3 py-2">{entry.reviewer}</td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {formatWhen(entry.reviewedAt)}
                    </td>
                    <td className="max-w-[10rem] break-all px-3 py-2 font-mono text-[10px] text-neutral-400">
                      {entry.blueprintVersion}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
