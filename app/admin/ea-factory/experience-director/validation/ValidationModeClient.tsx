'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
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

function ScoreCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-neutral-200 bg-[#FAF8F3] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: NAVY }}>
        {value}
        <span className="text-sm font-semibold text-neutral-400">/100</span>
      </p>
    </div>
  );
}

function FreqList({ title, rows }: { title: string; rows: FrequencyRow[] }) {
  return (
    <article className="border border-neutral-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-neutral-500">No data yet.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {rows.map((row) => (
            <li
              key={row.label}
              className="flex items-start justify-between gap-3 border-b border-neutral-100 pb-2 text-sm last:border-0"
            >
              <span className="text-neutral-700">{row.label}</span>
              <span className="shrink-0 font-bold text-neutral-900">{row.count}</span>
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
  const [compareEntries, setCompareEntries] = useState<ExperienceDirectorValidationEntry[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/factory/experience-director/validation', {
      credentials: 'include',
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      analytics?: ExperienceDirectorValidationAnalytics;
    };
    if (data.ok && data.analytics) setAnalytics(data.analytics);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const selectedCompare = useMemo(() => {
    if (compareEntries.length) return compareEntries;
    return analytics.entries.filter((e) => compareIds.includes(e.id));
  }, [analytics.entries, compareEntries, compareIds]);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 4) return prev;
      return [...prev, id];
    });
    setCompareEntries([]);
  }

  async function loadCompare() {
    if (compareIds.length < 2) {
      setMessage('Select at least two reviews to compare.');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(
        `/api/admin/factory/experience-director/validation?compare=${encodeURIComponent(compareIds.join(','))}`,
        { credentials: 'include' },
      );
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        entries?: ExperienceDirectorValidationEntry[];
        error?: string;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Could not load comparison.');
        return;
      }
      setCompareEntries(data.entries || []);
    } finally {
      setBusy(false);
    }
  }

  const trend = analytics.trends;
  const trendLabel =
    trend.improvingOverTime == null
      ? 'Not enough periods yet'
      : trend.improvingOverTime
        ? `Improving (+${trend.trendDelta ?? 0} pts overall)`
        : `Declining (${trend.trendDelta ?? 0} pts overall)`;

  return (
    <div className="space-y-8">
      {message ? (
        <p className="rounded-xl bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200">
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
            onClick={() => void refresh()}
            className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white"
          >
            Refresh
          </button>
        </div>
      </div>

      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Score averages
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {AVG_LABELS.map((row) => (
            <ScoreCard key={row.key} label={row.label} value={analytics.averages[row.key]} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Status mix
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Approved</span>
              <strong>{analytics.statusCounts.Approved}</strong>
            </li>
            <li className="flex justify-between">
              <span>Needs Refinement</span>
              <strong>{analytics.statusCounts['Needs Refinement']}</strong>
            </li>
            <li className="flex justify-between">
              <span>Rejected</span>
              <strong>{analytics.statusCounts.Rejected}</strong>
            </li>
          </ul>
        </article>
        <article className="border border-neutral-200 bg-white p-5 shadow-sm md:col-span-2">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Trend analysis
          </p>
          <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
            {trendLabel}
          </h3>
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
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="py-2 pr-4">Period</th>
                    <th className="py-2 pr-4">Reviews</th>
                    <th className="py-2">Avg Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {trend.byPeriod.map((p) => (
                    <tr key={p.period} className="border-t border-neutral-100">
                      <td className="py-2 pr-4 font-mono text-xs">{p.period}</td>
                      <td className="py-2 pr-4">{p.count}</td>
                      <td className="py-2 font-semibold">{p.averageOverall}</td>
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
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Industries scoring lower
        </p>
        {trend.industriesScoringLower.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No industry data yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-3 py-2">Industry</th>
                  <th className="px-3 py-2">Reviews</th>
                  <th className="px-3 py-2">Avg Overall</th>
                  <th className="px-3 py-2">Story</th>
                  <th className="px-3 py-2">Visual</th>
                  <th className="px-3 py-2">Originality</th>
                  <th className="px-3 py-2">Executive</th>
                  <th className="px-3 py-2">Wow</th>
                </tr>
              </thead>
              <tbody>
                {trend.industriesScoringLower.map((row) => (
                  <tr key={row.industry} className="border-b border-neutral-100">
                    <td className="px-3 py-2 font-semibold">{row.industry}</td>
                    <td className="px-3 py-2">{row.count}</td>
                    <td className="px-3 py-2 font-bold">{row.averageOverall}</td>
                    <td className="px-3 py-2">{row.averages.story}</td>
                    <td className="px-3 py-2">{row.averages.visual}</td>
                    <td className="px-3 py-2">{row.averages.originality}</td>
                    <td className="px-3 py-2">{row.averages.executiveExperience}</td>
                    <td className="px-3 py-2">{row.averages.wow}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Compare reviews
            </p>
            <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
              Cross-project comparison
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Select up to 4 validation reviews, then compare scores and rationale side by side.
            </p>
          </div>
          <button
            type="button"
            disabled={busy || compareIds.length < 2}
            onClick={() => void loadCompare()}
            className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Compare selected ({compareIds.length})
          </button>
        </div>

        {selectedCompare.length >= 2 ? (
          <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {selectedCompare.map((entry) => (
              <article key={entry.id} className="border border-neutral-200 bg-[#FAF8F3] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-neutral-900">{entry.client}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{entry.industry}</p>
                  </div>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-neutral-600">
                    {entry.approvalStatus}
                  </span>
                </div>
                <p className="mt-3 text-2xl font-black" style={{ color: NAVY }}>
                  {entry.scores.overall}
                  <span className="text-sm font-semibold text-neutral-400">/100</span>
                </p>
                <dl className="mt-3 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                  <div>Story {entry.scores.story}</div>
                  <div>Visual {entry.scores.visual}</div>
                  <div>Originality {entry.scores.originality}</div>
                  <div>Executive {entry.scores.executiveExperience}</div>
                  <div>Wow {entry.scores.wow}</div>
                  <div>Reviewer {entry.reviewer}</div>
                </dl>
                <p className="mt-3 text-xs text-neutral-500">
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

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-2">Compare</th>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Industry</th>
                <th className="px-3 py-2">Reviewer</th>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Blueprint</th>
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
                        aria-label={`Compare ${entry.client}`}
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
                    <td className="px-3 py-2 font-bold">{entry.scores.overall}</td>
                    <td className="px-3 py-2">{entry.industry}</td>
                    <td className="px-3 py-2">{entry.reviewer}</td>
                    <td className="px-3 py-2 text-xs text-neutral-500">
                      {new Date(entry.reviewedAt).toLocaleString()}
                    </td>
                    <td className="px-3 py-2 font-mono text-[10px] text-neutral-400">
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
