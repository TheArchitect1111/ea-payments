'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GOLD, NAVY } from '@/lib/design-system';
import type {
  AiHumanComparisonRecord,
  CalibrationDashboard,
  CorrelationPair,
  ReviewerAgreementGroup,
  SegmentBenchmarkRow,
} from '@/lib/factory-experience-director-calibration';
import type { ExperienceReviewScores } from '@/lib/factory-experience-review';

type SegmentKey = 'industry' | 'organizationSize' | 'projectType';

const AVG_KEYS: Array<{ key: keyof ExperienceReviewScores; label: string }> = [
  { key: 'overall', label: 'Average Overall' },
  { key: 'story', label: 'Average Story' },
  { key: 'visual', label: 'Average Visual' },
  { key: 'originality', label: 'Average Originality' },
  { key: 'executiveExperience', label: 'Average Executive Experience' },
  { key: 'wow', label: 'Average Wow' },
];

function ScoreTile({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-neutral-200 bg-[#FAF8F3] px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-2xl font-black" style={{ color: NAVY }}>
        {value}
      </p>
    </div>
  );
}

function Bar({ value, max = 100, warn = false }: { value: number; max?: number; warn?: boolean }) {
  const pct = Math.max(0, Math.min(100, (Math.abs(value) / max) * 100));
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-neutral-100">
      <div
        className={`h-full rounded-full ${warn ? 'bg-red-500' : 'bg-[#1B2B4D]'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ScatterMini({ pair }: { pair: CorrelationPair }) {
  const w = 220;
  const h = 120;
  const pad = 12;
  const xs = pair.points.map((p) => p.x);
  const ys = pair.points.map((p) => p.y);
  const minX = Math.min(...xs, 0);
  const maxX = Math.max(...xs, 100);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 100);
  const sx = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (w - pad * 2);
  const sy = (y: number) => h - pad - ((y - minY) / (maxY - minY || 1)) * (h - pad * 2);

  let trend: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (pair.points.length >= 2 && pair.coefficient != null) {
    const meanX = xs.reduce((a, b) => a + b, 0) / xs.length;
    const meanY = ys.reduce((a, b) => a + b, 0) / ys.length;
    const slope =
      pair.coefficient *
      (Math.sqrt(ys.reduce((a, y) => a + (y - meanY) ** 2, 0) / ys.length) /
        (Math.sqrt(xs.reduce((a, x) => a + (x - meanX) ** 2, 0) / xs.length) || 1));
    const yAt = (x: number) => meanY + slope * (x - meanX);
    trend = {
      x1: sx(minX),
      y1: sy(yAt(minX)),
      x2: sx(maxX),
      y2: sy(yAt(maxX)),
    };
  }

  return (
    <svg width={w} height={h} className="rounded border border-neutral-200 bg-white">
      {trend ? (
        <line
          x1={trend.x1}
          y1={trend.y1}
          x2={trend.x2}
          y2={trend.y2}
          stroke={GOLD}
          strokeWidth={2}
        />
      ) : null}
      {pair.points.map((p, i) => (
        <circle key={`${p.x}-${p.y}-${i}`} cx={sx(p.x)} cy={sy(p.y)} r={3} fill={NAVY} />
      ))}
    </svg>
  );
}

function ConsensusBadge({ level }: { level: ReviewerAgreementGroup['consensusLevel'] }) {
  const style =
    level === 'Strong'
      ? 'bg-emerald-50 text-emerald-800'
      : level === 'Moderate'
        ? 'bg-amber-50 text-amber-900'
        : 'bg-red-50 text-red-800';
  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${style}`}>
      {level}
    </span>
  );
}

export default function CalibrationClient({
  initialDashboard,
}: {
  initialDashboard: CalibrationDashboard;
}) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [segment, setSegment] = useState<SegmentKey>('industry');
  const [sortAsc, setSortAsc] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedGoldId, setSelectedGoldId] = useState('');

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/factory/experience-director/calibration', {
      credentials: 'include',
    });
    const data = (await res.json().catch(() => ({}))) as {
      ok?: boolean;
      dashboard?: CalibrationDashboard;
    };
    if (data.ok && data.dashboard) setDashboard(data.dashboard);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const segmentRows = useMemo(() => {
    const rows =
      segment === 'industry'
        ? dashboard.industryBenchmarks
        : segment === 'organizationSize'
          ? dashboard.organizationSizeBenchmarks
          : dashboard.projectTypeBenchmarks;
    const filtered = filterText.trim()
      ? rows.filter((r) => r.segment.toLowerCase().includes(filterText.trim().toLowerCase()))
      : rows;
    return [...filtered].sort((a, b) =>
      sortAsc
        ? a.averages.overall - b.averages.overall
        : b.averages.overall - a.averages.overall,
    );
  }, [dashboard, segment, sortAsc, filterText]);

  async function importValidation() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/experience-director/calibration', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import_validation' }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        imported?: number;
        skipped?: number;
        dashboard?: CalibrationDashboard;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Import failed.');
        return;
      }
      if (data.dashboard) setDashboard(data.dashboard);
      setMessage(`Imported ${data.imported ?? 0} review(s); skipped ${data.skipped ?? 0} already in gold set.`);
    } finally {
      setBusy(false);
    }
  }

  async function runCompare(goldStandardId: string) {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/experience-director/calibration', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'compare', goldStandardId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        comparison?: AiHumanComparisonRecord;
        dashboard?: CalibrationDashboard;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Comparison failed.');
        return;
      }
      if (data.dashboard) setDashboard(data.dashboard);
      setMessage(
        `Comparison saved — agreement ${data.comparison?.agreementPercent ?? '—'}%, approval match ${
          data.comparison?.approvalMatch ? 'yes' : 'no'
        }.`,
      );
    } finally {
      setBusy(false);
    }
  }

  const health = dashboard.datasetHealth;

  return (
    <div className="space-y-10">
      {message ? (
        <p className="rounded-xl bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200">
          {message}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">
          Gold set {health.goldCount} · Comparisons {health.comparisonCount} · Model{' '}
          <span className="font-mono text-xs">{health.activeModel.modelId}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void importValidation()}
            className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            Import validation reviews
          </button>
          <Link
            href="/admin/ea-factory/experience-director/validation"
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
          >
            Validation Mode
          </Link>
          <button
            type="button"
            onClick={() => void refresh()}
            className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Dataset health + calibration summary */}
      <section>
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Dataset health
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreTile label="Gold reviews" value={health.goldCount} />
          <ScoreTile label="AI↔Human pairs" value={health.comparisonCount} />
          <ScoreTile label="Projects" value={health.projectCount} />
          <ScoreTile label="Multi-reviewer blueprints" value={health.multiReviewerBlueprints} />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <ScoreTile label="Agreement %" value={`${dashboard.agreementPercent}%`} />
          <ScoreTile label="Avg score difference" value={dashboard.averageScoreDifference} />
          <ScoreTile label="Industries" value={health.industryCount} />
          <ScoreTile label="Imported from validation" value={health.importedFromValidation} />
        </div>
      </section>

      {/* Confidence distribution */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Confidence distribution
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          {(['Very High', 'High', 'Medium', 'Low'] as const).map((level) => (
            <div key={level} className="border border-neutral-100 bg-[#FAF8F3] px-3 py-3">
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{level}</p>
              <p className="mt-1 text-xl font-black" style={{ color: NAVY }}>
                {dashboard.confidenceDistribution[level]}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Reliable categories */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Most reliable categories
          </p>
          <ul className="mt-4 space-y-3">
            {dashboard.mostReliableCategories.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{c.category}</span>
                  <span>±{c.meanAbsDiff}</span>
                </div>
                <Bar value={100 - c.meanAbsDiff} />
              </li>
            ))}
            {!dashboard.mostReliableCategories.length ? (
              <p className="text-sm text-neutral-500">Run AI↔Human comparisons to populate.</p>
            ) : null}
          </ul>
        </article>
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Least reliable categories
          </p>
          <ul className="mt-4 space-y-3">
            {dashboard.leastReliableCategories.map((c) => (
              <li key={c.category}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold">{c.category}</span>
                  <span className="text-red-700">±{c.meanAbsDiff}</span>
                </div>
                <Bar value={c.meanAbsDiff} warn />
              </li>
            ))}
            {!dashboard.leastReliableCategories.length ? (
              <p className="text-sm text-neutral-500">Run AI↔Human comparisons to populate.</p>
            ) : null}
          </ul>
        </article>
      </section>

      {/* AI vs Human */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              AI vs Human comparison
            </p>
            <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
              Top reviewer disagreements
            </h3>
            <p className="mt-1 text-sm text-neutral-500">
              Differences greater than 10 points are highlighted.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedGoldId}
              onChange={(e) => setSelectedGoldId(e.target.value)}
              className="border border-neutral-200 bg-white px-3 py-2 text-xs"
            >
              <option value="">Select gold review…</option>
              {dashboard.goldStandards.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.client} · {g.humanReviewer} · {g.humanOverallScore}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={busy || !selectedGoldId}
              onClick={() => void runCompare(selectedGoldId)}
              className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D] disabled:opacity-50"
            >
              Compare with AI review
            </button>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-2">Client</th>
                <th className="px-3 py-2">Human</th>
                <th className="px-3 py-2">AI</th>
                <th className="px-3 py-2">Diff</th>
                <th className="px-3 py-2">Agreement %</th>
                <th className="px-3 py-2">Approval</th>
                <th className="px-3 py-2">Confidence</th>
                <th className="px-3 py-2">Why confidence</th>
              </tr>
            </thead>
            <tbody>
              {(dashboard.topReviewerDisagreements.length
                ? dashboard.topReviewerDisagreements
                : dashboard.comparisons.slice(0, 10)
              ).map((c) => (
                <tr key={c.id} className="border-b border-neutral-100 align-top">
                  <td className="px-3 py-3">
                    <div className="font-semibold">{c.client}</div>
                    <div className="text-xs text-neutral-500">{c.industry}</div>
                  </td>
                  <td className="px-3 py-3 font-bold">{c.humanScores.overall}</td>
                  <td className="px-3 py-3 font-bold">{c.aiScores.overall}</td>
                  <td
                    className={`px-3 py-3 font-bold ${
                      Math.abs(c.overallDifference) > 10 ? 'text-red-700' : ''
                    }`}
                  >
                    {c.overallDifference > 0 ? '+' : ''}
                    {c.overallDifference}
                  </td>
                  <td className="px-3 py-3">{c.agreementPercent}%</td>
                  <td className="px-3 py-3 text-xs">
                    {c.approvalMatch ? (
                      <span className="text-emerald-700">Match</span>
                    ) : (
                      <span className="font-bold text-red-700">
                        {c.humanApprovalStatus} ≠ {c.aiApprovalStatus}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-xs font-bold">{c.aiConfidence.level}</td>
                  <td className="px-3 py-3 text-xs text-neutral-600">
                    <ul className="list-disc space-y-1 pl-4">
                      {c.aiConfidence.reasons.slice(0, 3).map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    {c.highDisagreementCategories.length ? (
                      <p className="mt-2 font-semibold text-red-700">
                        &gt;10pt:{' '}
                        {c.highDisagreementCategories
                          .map((d) => `${d.category} (${d.difference > 0 ? '+' : ''}${d.difference})`)
                          .join(', ')}
                      </p>
                    ) : null}
                  </td>
                </tr>
              ))}
              {!dashboard.comparisons.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                    Import gold reviews, then compare with AI validation reviews.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Industry benchmarks */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Industry / size / type benchmarks
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {(['industry', 'organizationSize', 'projectType'] as SegmentKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSegment(key)}
              className={`rounded-full px-3 py-1.5 text-xs font-bold ${
                segment === key
                  ? 'bg-[#1B2B4D] text-white'
                  : 'bg-white text-neutral-700 ring-1 ring-neutral-200'
              }`}
            >
              {key === 'organizationSize' ? 'Organization size' : key === 'projectType' ? 'Project type' : 'Industry'}
            </button>
          ))}
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter…"
            className="ml-auto border border-neutral-200 px-3 py-1.5 text-xs"
          />
          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
          >
            Sort overall {sortAsc ? '↑' : '↓'}
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-2">Segment</th>
                <th className="px-3 py-2">n</th>
                {AVG_KEYS.map((k) => (
                  <th key={k.key} className="px-3 py-2">
                    {k.label.replace('Average ', '')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {segmentRows.map((row: SegmentBenchmarkRow) => (
                <tr key={row.segment} className="border-b border-neutral-100">
                  <td className="px-3 py-2 font-semibold">{row.segment}</td>
                  <td className="px-3 py-2">{row.count}</td>
                  {AVG_KEYS.map((k) => (
                    <td key={k.key} className="px-3 py-2">
                      {row.averages[k.key]}
                    </td>
                  ))}
                </tr>
              ))}
              {!segmentRows.length ? (
                <tr>
                  <td colSpan={8} className="px-3 py-8 text-center text-neutral-500">
                    No benchmark segments yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* Reviewer agreement */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Reviewer agreement
        </p>
        <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
          Multiple humans, same blueprint
        </h3>
        <div className="mt-4 space-y-4">
          {dashboard.reviewerAgreement.map((g) => (
            <article key={`${g.projectId}-${g.blueprintVersion}`} className="border border-neutral-100 bg-[#FAF8F3] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{g.client}</p>
                  <p className="text-xs text-neutral-500">
                    {g.industry} · {g.reviewCount} reviews · {g.reviewers.join(', ')}
                  </p>
                  <p className="mt-1 font-mono text-[10px] text-neutral-400">{g.blueprintVersion}</p>
                </div>
                <ConsensusBadge level={g.consensusLevel} />
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Agreement %</p>
                  <p className="text-lg font-black" style={{ color: NAVY }}>
                    {g.agreementPercent}%
                  </p>
                  <Bar value={g.agreementPercent} warn={g.consensusLevel === 'Weak'} />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Variance</p>
                  <p className="text-lg font-black" style={{ color: NAVY }}>
                    {g.variance}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-neutral-500">Avg overall</p>
                  <p className="text-lg font-black" style={{ color: NAVY }}>
                    {g.averageScores.overall}
                  </p>
                </div>
              </div>
            </article>
          ))}
          {!dashboard.reviewerAgreement.length ? (
            <p className="text-sm text-neutral-500">
              Add multiple human gold reviews for the same project + blueprint version to measure
              consensus.
            </p>
          ) : null}
        </div>
      </section>

      {/* Constitution analytics */}
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Constitution failures
          </p>
          <h3 className="mt-2 text-lg font-black" style={{ color: NAVY }}>
            Most common / frequency
          </h3>
          <ul className="mt-4 space-y-2">
            {dashboard.constitution.mostCommonFailures.map((row, i) => (
              <li key={row.label} className="flex items-center justify-between gap-3 text-sm">
                <span>
                  <span className="mr-2 font-mono text-xs text-neutral-400">#{i + 1}</span>
                  {row.label}
                </span>
                <span className="font-bold">{row.count}</span>
              </li>
            ))}
            {!dashboard.constitution.mostCommonFailures.length ? (
              <p className="text-sm text-neutral-500">No failures recorded yet.</p>
            ) : null}
          </ul>
        </article>
        <article className="border border-neutral-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
            Improvement over time
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="py-2 pr-4">Period</th>
                  <th className="py-2 pr-4">Reviews</th>
                  <th className="py-2">Failure rate %</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.constitution.improvementOverTime.map((p) => (
                  <tr key={p.period} className="border-t border-neutral-100">
                    <td className="py-2 pr-4 font-mono text-xs">{p.period}</td>
                    <td className="py-2 pr-4">{p.count}</td>
                    <td className="py-2 font-semibold">{p.failureRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">By industry</p>
              <ul className="mt-2 space-y-1 text-xs">
                {dashboard.constitution.failureByIndustry.slice(0, 6).map((r) => (
                  <li key={r.industry}>
                    {r.industry}: {r.topFailure} ({r.count})
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                By blueprint version
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                {dashboard.constitution.failureByBlueprintVersion.slice(0, 6).map((r) => (
                  <li key={r.blueprintVersion} className="truncate">
                    <span className="font-mono">{r.blueprintVersion}</span>: {r.topFailure} (
                    {r.count})
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </article>
      </section>

      {/* Correlations */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Correlation analysis
        </p>
        <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
          Score relationships
        </h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboard.correlations.map((pair) => (
            <article key={pair.id} className="border border-neutral-100 bg-[#FAF8F3] p-3">
              <p className="text-sm font-semibold">{pair.label}</p>
              <p className="mt-1 text-xs text-neutral-500">
                r = {pair.coefficient == null ? 'n/a' : pair.coefficient}
              </p>
              <div className="mt-3">
                <ScatterMini pair={pair} />
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* Recent activity */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Recent calibration activity
        </p>
        <ul className="mt-4 divide-y divide-neutral-100">
          {dashboard.recentActivity.map((a, i) => (
            <li key={`${a.at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <span>{a.label}</span>
              <span className="text-xs text-neutral-500">{new Date(a.at).toLocaleString()}</span>
            </li>
          ))}
          {!dashboard.recentActivity.length ? (
            <li className="py-6 text-sm text-neutral-500">No calibration activity yet.</li>
          ) : null}
        </ul>
      </section>

      {/* Gold dataset table */}
      <section className="border border-neutral-200 bg-white p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
          Gold standard dataset
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-3 py-2">Project</th>
                <th className="px-3 py-2">Industry</th>
                <th className="px-3 py-2">Blueprint</th>
                <th className="px-3 py-2">Reviewer</th>
                <th className="px-3 py-2">Overall</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">When</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.goldStandards.map((g) => (
                <tr key={g.id} className="border-b border-neutral-100 align-top">
                  <td className="px-3 py-2">
                    <div className="font-semibold">{g.client}</div>
                    <div className="max-w-xs text-xs text-neutral-500 line-clamp-2">
                      {g.humanWrittenRationale}
                    </div>
                  </td>
                  <td className="px-3 py-2">{g.industry}</td>
                  <td className="px-3 py-2 font-mono text-[10px] text-neutral-400">
                    {g.blueprintVersion}
                  </td>
                  <td className="px-3 py-2">{g.humanReviewer}</td>
                  <td className="px-3 py-2 font-bold">{g.humanOverallScore}</td>
                  <td className="px-3 py-2 text-xs font-bold uppercase tracking-wider">
                    {g.approvalStatus}
                  </td>
                  <td className="px-3 py-2 text-xs text-neutral-500">
                    {new Date(g.reviewedAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
