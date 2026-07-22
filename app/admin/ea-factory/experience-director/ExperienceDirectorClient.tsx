'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { GOLD, NAVY } from '@/lib/design-system';
import type {
  ExperienceDirectorApprovalStatus,
  ExperienceReviewData,
  ExperienceReviewSummary,
} from '@/lib/factory-experience-review';

type DashboardRow = {
  projectId: string;
  client: string;
  pipelineStatus: string;
  updatedAt: string;
  review: ExperienceReviewSummary | null;
};

const STATUS_STYLE: Record<ExperienceDirectorApprovalStatus | 'Missing', string> = {
  Approved: 'bg-emerald-50 text-emerald-800',
  'Needs Refinement': 'bg-amber-50 text-amber-900',
  Rejected: 'bg-red-50 text-red-800',
  Missing: 'bg-neutral-100 text-neutral-600',
};

const SCORE_ROWS: Array<{ key: keyof ExperienceReviewData['scores']; label: string }> = [
  { key: 'overall', label: 'Overall Score' },
  { key: 'story', label: 'Story Score' },
  { key: 'visual', label: 'Visual Score' },
  { key: 'originality', label: 'Originality Score' },
  { key: 'executiveExperience', label: 'Executive Experience Score' },
  { key: 'wow', label: 'Wow Score' },
];

const EXPERIENCE_THEMES = [
  { id: 'ea-default-theme', label: 'EA Default' },
  { id: 'amanda-editorial', label: 'Amanda Editorial' },
] as const;

type ActivationLinks = {
  website?: string;
  portal?: string;
  portalLogin?: string;
  admin?: string;
};

function StatusBadge({ status }: { status: ExperienceDirectorApprovalStatus | 'Missing' }) {
  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${
        STATUS_STYLE[status]
      }`}
    >
      {status}
    </span>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-neutral-800 break-all">{value}</p>
    </div>
  );
}

function ScoreGrid({ scores }: { scores: ExperienceReviewData['scores'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {SCORE_ROWS.map((row) => (
        <div key={row.key} className="border border-neutral-200 bg-[#FAF8F3] px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{row.label}</p>
          <p className="mt-1 text-2xl font-black" style={{ color: NAVY }}>
            {scores[row.key]}
            <span className="text-sm font-semibold text-neutral-400">/100</span>
          </p>
        </div>
      ))}
    </div>
  );
}

export default function ExperienceDirectorClient({
  initialRows,
  initialFocusId,
}: {
  initialRows: DashboardRow[];
  initialFocusId?: string;
}) {
  const [rows, setRows] = useState(initialRows);
  const [focusId, setFocusId] = useState(
    initialFocusId || initialRows.find((r) => r.review)?.projectId || initialRows[0]?.projectId || '',
  );
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [validationMode, setValidationMode] = useState(true);
  const [reviewer, setReviewer] = useState('Experience Director');
  const [rationale, setRationale] = useState('');
  const [themeId, setThemeId] = useState('ea-default-theme');
  const [activationLinks, setActivationLinks] = useState<ActivationLinks | null>(null);

  const focused = useMemo(
    () => rows.find((r) => r.projectId === focusId) || null,
    [rows, focusId],
  );
  const review = focused?.review?.review ?? null;
  const approvalStatus: ExperienceDirectorApprovalStatus | 'Missing' =
    review?.approvalStatus || 'Missing';
  const canPublish = focused?.review?.canPublish === true;

  const refresh = useCallback(async () => {
    const res = await fetch('/api/admin/factory/experience-director', { credentials: 'include' });
    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; rows?: DashboardRow[] };
    if (data.ok && Array.isArray(data.rows)) {
      setRows(data.rows);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function runReview(projectId: string) {
    setBusy(projectId);
    setMessage(null);
    setActivationLinks(null);
    try {
      if (validationMode) {
        const res = await fetch('/api/admin/factory/experience-director/validation', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            reviewer: reviewer.trim() || 'Experience Director',
            rationale: rationale.trim() || undefined,
          }),
        });
        const data = (await res.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          entry?: { approvalStatus?: string };
        };
        if (!res.ok || !data.ok) {
          setMessage(data.error || 'Could not save Validation Mode review.');
          return;
        }
        setMessage(
          `Validation Mode saved: ${data.entry?.approvalStatus || 'recorded'}. Scores, rationale, and improvements logged.`,
        );
        setRationale('');
        setFocusId(projectId);
        await refresh();
        return;
      }

      const res = await fetch('/api/admin/factory/experience-director', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        review?: ExperienceReviewSummary;
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Could not run Experience Director review.');
        return;
      }
      setMessage(`Review recorded: ${data.review?.review.approvalStatus || 'done'}`);
      setFocusId(projectId);
      await refresh();
    } catch {
      setMessage('Could not run Experience Director review.');
    } finally {
      setBusy(null);
    }
  }

  async function logLatestToValidation(projectId: string) {
    setBusy(projectId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/experience-director/validation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          useLatestReview: true,
          reviewer: reviewer.trim() || 'Experience Director',
          rationale: rationale.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Could not log latest review to Validation Mode.');
        return;
      }
      setMessage('Latest review logged to Validation Mode.');
      setRationale('');
    } catch {
      setMessage('Could not log latest review to Validation Mode.');
    } finally {
      setBusy(null);
    }
  }

  async function publishWebsite(projectId: string) {
    if (!canPublish || focused?.projectId !== projectId) {
      setMessage('Publish blocked — Experience Director status must be Approved.');
      return;
    }
    setBusy(projectId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/publish-website', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, themeId, force: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        siteUrl?: string;
        portalSlug?: string;
        portalLoginUrl?: string;
        portalUrl?: string;
        adminUrl?: string;
        directorGate?: { approvalStatus?: string };
      };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Could not publish website.');
        return;
      }
      setMessage(
        data.siteUrl
          ? `Published Future Website: ${data.siteUrl}`
          : `Published site for ${data.portalSlug || projectId}`,
      );
      setActivationLinks({
        website: data.siteUrl,
        portal: data.portalUrl,
        portalLogin: data.portalLoginUrl,
        admin: data.adminUrl,
      });
      if (data.siteUrl) {
        window.open(data.siteUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setMessage('Could not publish website.');
    } finally {
      setBusy(null);
    }
  }

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

      <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-white px-4 py-3">
        <label className="flex items-center gap-2 text-sm font-semibold text-neutral-800">
          <input
            type="checkbox"
            checked={validationMode}
            onChange={(e) => setValidationMode(e.target.checked)}
            aria-describedby="validation-mode-help"
          />
          Validation Mode
        </label>
        <p id="validation-mode-help" className="sr-only">
          When enabled, reviews are logged to the Validation Framework for quality analysis without
          changing publish rules.
        </p>
        <Link
          href="/admin/ea-factory/experience-director/validation"
          className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D]"
        >
          Open Validation Dashboard
        </Link>
        <Link
          href="/admin/ea-factory/experience-director/calibration"
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
        >
          Calibration
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 bg-[#FAF8F3] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
              Projects
            </p>
            <p className="mt-1 text-sm text-neutral-500">{rows.length} factory project(s)</p>
          </div>
          <ul className="max-h-[70vh] divide-y divide-neutral-100 overflow-y-auto">
            {rows.length === 0 ? (
              <li className="px-4 py-8 text-sm text-neutral-500">
                No factory projects yet.{' '}
                <Link href="/admin/ea-factory/launch" className="font-semibold underline">
                  Start a Launch
                </Link>
                .
              </li>
            ) : (
              rows.map((row) => {
                const status = row.review?.review.approvalStatus || 'Missing';
                const active = row.projectId === focusId;
                return (
                  <li key={row.projectId}>
                    <button
                      type="button"
                      onClick={() => setFocusId(row.projectId)}
                      className={`w-full px-4 py-3 text-left transition ${
                        active ? 'bg-[#1B2B4D]/[0.04]' : 'hover:bg-[#FAF8F3]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-neutral-900">{row.client}</p>
                          <p className="mt-0.5 font-mono text-[10px] text-neutral-400">
                            {row.projectId}
                          </p>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      {row.review ? (
                        <p className="mt-2 text-xs text-neutral-500">
                          Overall {row.review.review.scores.overall}/100
                        </p>
                      ) : (
                        <p className="mt-2 text-xs text-neutral-400">No review yet</p>
                      )}
                    </button>
                  </li>
                );
              })
            )}
          </ul>
        </aside>

        <section className="space-y-6">
          {!focused ? (
            <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
              Select a project to view its Experience Review.
            </div>
          ) : (
            <>
              <article className="border border-neutral-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      Experience Review
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight" style={{ color: NAVY }}>
                      {focused.client}
                    </h2>
                    <p className="mt-1 font-mono text-xs text-neutral-400">{focused.projectId}</p>
                  </div>
                  <StatusBadge status={approvalStatus} />
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <Meta label="Pipeline" value={focused.pipelineStatus} />
                  <Meta
                    label="Reviewed"
                    value={
                      focused.review
                        ? new Date(focused.review.createdAt).toLocaleString()
                        : '—'
                    }
                  />
                  <Meta
                    label="Publish"
                    value={canPublish ? 'Allowed' : 'Blocked until Approved'}
                  />
                </div>

                {validationMode ? (
                  <div className="mt-6 space-y-3 border border-dashed border-neutral-300 bg-[#FAF8F3] p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      Validation Mode capture
                    </p>
                    <p className="text-sm text-neutral-500">
                      Saves scores, written rationale, required improvements, timestamp, reviewer,
                      and blueprint version for Director quality analysis. Does not change publish
                      rules.
                    </p>
                    <label className="block text-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Reviewer
                      </span>
                      <input
                        value={reviewer}
                        onChange={(e) => setReviewer(e.target.value)}
                        className="mt-1 w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
                        placeholder="Reviewer name or email"
                        autoComplete="name"
                        maxLength={200}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                        Written rationale
                      </span>
                      <textarea
                        value={rationale}
                        onChange={(e) => setRationale(e.target.value)}
                        rows={3}
                        className="mt-1 w-full border border-neutral-200 bg-white px-3 py-2 text-sm"
                        placeholder="Optional: strengths, weaknesses, why this status — Director auto-rationale used if blank"
                        maxLength={8000}
                      />
                    </label>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-wrap gap-2">
                  <label className="flex items-center gap-2 border border-neutral-200 bg-white px-3 py-2 text-xs font-bold text-neutral-700">
                    Experience Theme
                    <select
                      value={themeId}
                      onChange={(event) => setThemeId(event.target.value)}
                      className="bg-transparent text-xs font-semibold outline-none"
                    >
                      {EXPERIENCE_THEMES.map((theme) => (
                        <option key={theme.id} value={theme.id}>
                          {theme.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    disabled={busy === focused.projectId}
                    aria-busy={busy === focused.projectId}
                    onClick={() => void runReview(focused.projectId)}
                    className="rounded-full bg-[#1B2B4D] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
                  >
                    {busy === focused.projectId
                      ? 'Working…'
                      : validationMode
                        ? 'Run & Log Validation Review'
                        : 'Run Director Review'}
                  </button>
                  {validationMode && focused.review ? (
                    <button
                      type="button"
                      disabled={busy === focused.projectId}
                      onClick={() => void logLatestToValidation(focused.projectId)}
                      className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200 disabled:opacity-50"
                    >
                      Log latest to Validation
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={busy === focused.projectId || !canPublish}
                    title={
                      canPublish
                        ? 'Publish Future Website'
                        : 'Requires Experience Director status Approved'
                    }
                    onClick={() => void publishWebsite(focused.projectId)}
                    className="rounded-full bg-[#C9A844] px-4 py-2 text-xs font-black text-[#1B2B4D] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Publish Future Website
                  </button>
                  <Link
                    href={`/admin/ea-factory/projects?focus=${encodeURIComponent(focused.projectId)}`}
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
                  >
                    Open in Projects
                  </Link>
                  <button
                    type="button"
                    onClick={() => void refresh()}
                    className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
                  >
                    Refresh
                  </button>
                </div>
                {activationLinks ? (
                  <div className="mt-5 grid gap-2 border border-[#C9A844]/50 bg-[#FAF8F3] p-4 sm:grid-cols-2">
                    {[
                      ['Website', activationLinks.website],
                      ['Portal', activationLinks.portal],
                      ['Portal Login', activationLinks.portalLogin],
                      ['Admin Portal', activationLinks.admin],
                    ].map(([label, href]) =>
                      href ? (
                        <a
                          key={label}
                          href={href}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm font-bold text-[#1B2B4D] underline"
                        >
                          Open {label}
                        </a>
                      ) : null,
                    )}
                  </div>
                ) : null}
              </article>

              {review ? (
                <>
                  <article className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      Scores
                    </p>
                    <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
                      Craftsmanship scores
                    </h3>
                    <div className="mt-5">
                      <ScoreGrid scores={review.scores} />
                    </div>
                  </article>

                  <article className="border border-neutral-200 bg-white p-6 shadow-sm">
                    <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                      Required Improvements
                    </p>
                    <h3 className="mt-2 text-xl font-black" style={{ color: NAVY }}>
                      {review.requiredImprovements.length
                        ? `${review.requiredImprovements.length} item(s)`
                        : 'None — Approved'}
                    </h3>
                    {review.requiredImprovements.length === 0 ? (
                      <p className="mt-4 text-sm text-neutral-500">
                        No required improvements. Publishing is allowed.
                      </p>
                    ) : (
                      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-700">
                        {review.requiredImprovements.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    )}
                    {review.notes ? (
                      <p className="mt-4 text-sm text-neutral-500">{review.notes}</p>
                    ) : null}
                  </article>
                </>
              ) : (
                <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
                  No Experience Review artifact yet. Run Director Review to evaluate this project
                  against the EA Experience Constitution. Publish stays blocked until status is
                  Approved.
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
