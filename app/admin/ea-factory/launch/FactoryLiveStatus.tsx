'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NAVY } from '@/lib/design-system';

type ConceptUrl = {
  conceptId: string;
  name: string;
  websitePreviewPath: string;
  portalPreviewPath: string;
};

type LaunchState = {
  identityBlocked?: boolean;
  identity?: {
    reason?: string;
    resumeHint?: string;
    candidates?: string[];
    sources?: Array<{ url: string }>;
    claims?: Array<{ text: string; status?: string }>;
  } | null;
  conceptPackReady?: boolean;
  conceptPackFailed?: boolean;
  conceptPackError?: string | null;
  conceptUrls?: ConceptUrl[];
  conceptsReviewPath?: string | null;
  statusLabel?: string;
  plainLanguageStage?: string;
  progressHint?: string;
  needsAutomaticNudge?: boolean;
  stageDurationsMs?: Record<string, number>;
};

type LiveState = {
  client?: string;
  statusLabel: string;
  plainLanguageStage?: string;
  progressHint?: string;
  pipelineStatus: string;
  inProgress: boolean;
  ready: boolean;
  failed: boolean;
  error?: string;
  stageDurationsMs?: Record<string, number>;
  launch?: LaunchState | null;
};

function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

export default function FactoryLiveStatus({ projectId }: { projectId: string }) {
  const [live, setLive] = useState<LiveState | null>(null);
  const [detail, setDetail] = useState('');
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recoveryOpen, setRecoveryOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;

    async function tick() {
      try {
        const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
          credentials: 'include',
        });
        const data = (await res.json()) as {
          ok?: boolean;
          project?: { client?: string; pipelineStatus?: string; error?: string };
          statusLabel?: string;
          plainLanguageStage?: string;
          progressHint?: string;
          stageDurationsMs?: Record<string, number>;
          inProgress?: boolean;
          ready?: boolean;
          failed?: boolean;
          launch?: LaunchState;
        };
        if (cancelled || !data.ok || !data.project) return;

        const next: LiveState = {
          client: data.project.client,
          statusLabel:
            data.plainLanguageStage ||
            data.launch?.plainLanguageStage ||
            data.statusLabel ||
            data.project.pipelineStatus ||
            'Working…',
          plainLanguageStage: data.plainLanguageStage || data.launch?.plainLanguageStage,
          progressHint: data.progressHint || data.launch?.progressHint,
          pipelineStatus: data.project.pipelineStatus || '',
          inProgress: Boolean(data.inProgress),
          ready: Boolean(data.ready),
          failed: Boolean(data.failed),
          error: data.project.error,
          stageDurationsMs: data.stageDurationsMs || data.launch?.stageDurationsMs,
          launch: data.launch || null,
        };
        setLive(next);

        // Keep polling while work remains — server also auto-nudges the pipeline.
        if (next.inProgress || (!next.ready && !next.failed && !next.launch?.identityBlocked)) {
          timer = window.setTimeout(() => void tick(), 3500);
        }
      } catch {
        if (!cancelled) {
          timer = window.setTimeout(() => void tick(), 6000);
        }
      }
    }

    void tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [projectId]);

  async function runConceptAction(body: Record<string, unknown>) {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/concept-previews`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        launch?: LaunchState;
      };
      if (!res.ok || !data.ok) {
        setActionError(data.error || 'Could not update concept pack.');
        if (data.launch) {
          const launch = data.launch;
          setLive((prev) =>
            prev
              ? {
                  ...prev,
                  launch,
                  statusLabel: launch.plainLanguageStage || launch.statusLabel || prev.statusLabel,
                  inProgress: false,
                  ready: Boolean(launch.conceptPackReady),
                }
              : prev,
          );
        }
        return;
      }
      setDetail('');
      setUrl('');
      const refresh = await fetch(`/api/projects/${encodeURIComponent(projectId)}`, {
        credentials: 'include',
      });
      const refreshed = (await refresh.json()) as {
        ok?: boolean;
        project?: { client?: string; pipelineStatus?: string; error?: string };
        statusLabel?: string;
        plainLanguageStage?: string;
        progressHint?: string;
        stageDurationsMs?: Record<string, number>;
        inProgress?: boolean;
        ready?: boolean;
        failed?: boolean;
        launch?: LaunchState;
      };
      if (refreshed.ok && refreshed.project) {
        setLive({
          client: refreshed.project.client,
          statusLabel:
            refreshed.plainLanguageStage ||
            refreshed.statusLabel ||
            refreshed.project.pipelineStatus ||
            'Working…',
          plainLanguageStage: refreshed.plainLanguageStage,
          progressHint: refreshed.progressHint,
          pipelineStatus: refreshed.project.pipelineStatus || '',
          inProgress: Boolean(refreshed.inProgress),
          ready: Boolean(refreshed.ready),
          failed: Boolean(refreshed.failed),
          error: refreshed.project.error,
          stageDurationsMs: refreshed.stageDurationsMs,
          launch: refreshed.launch || null,
        });
      }
    } catch {
      setActionError('Network error while updating concept pack.');
    } finally {
      setBusy(false);
    }
  }

  async function continuePipeline() {
    setBusy(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(projectId)}/continue`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setActionError(data.error || 'Continue failed.');
      }
    } catch {
      setActionError('Network error while continuing.');
    } finally {
      setBusy(false);
    }
  }

  const blocked = Boolean(live?.launch?.identityBlocked);
  const tone = live?.failed
    ? 'border-red-200 bg-red-50 text-red-900'
    : blocked
      ? 'border-amber-200 bg-amber-50 text-amber-950'
      : live?.ready
        ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
        : 'border-sky-200 bg-sky-50 text-sky-950';

  const identity = live?.launch?.identity;
  const conceptUrls = live?.launch?.conceptUrls || [];
  const showRecovery =
    Boolean(live?.failed) ||
    Boolean(live?.launch?.conceptPackFailed && !live?.launch?.needsAutomaticNudge) ||
    (!live?.inProgress && !live?.ready && !blocked && live !== null);

  return (
    <div className={`rounded-xl border px-4 py-4 text-sm ${tone}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Live status</p>
      <p className="mt-2 text-lg font-black" style={{ color: live?.failed ? undefined : NAVY }}>
        {live?.statusLabel || 'Confirming identity'}
      </p>
      {live?.client ? <p className="mt-1 font-semibold">{live.client}</p> : null}
      <p className="mt-1 font-mono text-[11px] opacity-70 break-all">{projectId}</p>

      {live?.progressHint ? (
        <p className="mt-3 text-xs opacity-80">{live.progressHint}</p>
      ) : live?.inProgress ? (
        <p className="mt-3 text-xs opacity-80">
          Stay on this screen — progress updates automatically. You’ll also get an email when it’s
          ready for review.
        </p>
      ) : null}

      {live?.inProgress && live.stageDurationsMs && Object.keys(live.stageDurationsMs).length > 0 ? (
        <details className="mt-3 text-[11px] opacity-70">
          <summary className="cursor-pointer font-semibold">Stage timings</summary>
          <ul className="mt-1 space-y-0.5 font-mono">
            {Object.entries(live.stageDurationsMs).map(([key, ms]) => (
              <li key={key}>
                {key}: {formatDuration(ms)}
                {ms > 180_000 ? ' · longer than expected' : ''}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      {live?.ready && !blocked ? (
        <p className="mt-3 text-xs font-semibold">
          Ready for concept review — open concepts to choose a direction. Nothing publishes until you
          approve.
        </p>
      ) : null}

      {live?.failed ? (
        <p className="mt-3 text-xs font-semibold">{live.error || 'Something went wrong.'}</p>
      ) : null}

      {blocked ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm font-semibold">
            {typeof identity?.reason === 'string'
              ? identity.reason
              : 'We could not confirm who this is yet.'}
          </p>
          {Array.isArray(identity?.candidates) && identity.candidates.length > 1 ? (
            <div className="space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.14em] opacity-70">
                Which one did you mean?
              </p>
              <ul className="space-y-2">
                {identity.candidates.slice(0, 3).map((candidate) => (
                  <li key={candidate}>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() =>
                        void runConceptAction({
                          distinguishingDetail: candidate,
                          force: true,
                        })
                      }
                      className="w-full rounded-lg border border-amber-300 bg-white px-3 py-3 text-left text-sm font-semibold text-[#17130F]"
                    >
                      {candidate}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <>
              <p className="text-xs opacity-80">
                {typeof identity?.resumeHint === 'string'
                  ? identity.resumeHint
                  : 'What city, profession, team, company, or organization is this connected to?'}
              </p>
              <label className="block text-xs font-semibold">
                One clarifying detail
                <input
                  value={detail}
                  onChange={(e) => setDetail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm text-[#17130F]"
                  placeholder="City, role, company, or official site"
                  disabled={busy}
                />
              </label>
              <button
                type="button"
                disabled={busy || !detail.trim()}
                onClick={() =>
                  void runConceptAction({
                    distinguishingDetail: detail.trim() || undefined,
                    url: url.trim() || undefined,
                    force: true,
                  })
                }
                className="w-full rounded-lg bg-[#17130F] px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-white disabled:opacity-50"
              >
                {busy ? 'Continuing…' : 'Continue'}
              </button>
            </>
          )}
        </div>
      ) : null}

      {conceptUrls.length > 0 ? (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-bold uppercase tracking-[0.16em] opacity-70">Concept previews</p>
          <ul className="space-y-2">
            {conceptUrls.map((c) => (
              <li key={c.conceptId} className="rounded-lg border border-black/5 bg-white/70 px-3 py-2">
                <p className="font-semibold">{c.name}</p>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs">
                  <a
                    href={c.websitePreviewPath}
                    className="font-bold underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Website preview
                  </a>
                  <a
                    href={c.portalPreviewPath}
                    className="font-bold underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Portal preview
                  </a>
                </div>
              </li>
            ))}
          </ul>
          {live?.launch?.conceptsReviewPath ? (
            <Link
              href={live.launch.conceptsReviewPath}
              className="inline-block text-xs font-bold underline"
              style={{ color: NAVY }}
            >
              Open concept selection
            </Link>
          ) : null}
        </div>
      ) : null}

      {showRecovery && !blocked ? (
        <details
          className="mt-4 rounded-lg border border-black/10 bg-white/60 px-3 py-2"
          open={recoveryOpen}
          onToggle={(e) => setRecoveryOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-xs font-semibold opacity-80">
            Recovery options (not normally needed)
          </summary>
          <div className="mt-3 space-y-2">
            {live?.launch?.conceptPackError ? (
              <p className="text-xs">{live.launch.conceptPackError}</p>
            ) : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void continuePipeline()}
              className="mr-2 rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-bold"
            >
              {busy ? 'Working…' : 'Continue'}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runConceptAction({ force: true })}
              className="rounded-lg border border-sky-300 bg-white px-3 py-2 text-xs font-bold"
            >
              {busy ? 'Working…' : 'Generate real previews'}
            </button>
          </div>
        </details>
      ) : null}

      {actionError ? (
        <p role="alert" className="mt-3 text-xs font-semibold text-red-800">
          {actionError}
        </p>
      ) : null}

      <Link
        href={`/admin/ea-factory/projects?focus=${encodeURIComponent(projectId)}`}
        className="mt-3 inline-block text-xs font-bold underline"
        style={{ color: NAVY }}
      >
        Open project
      </Link>
    </div>
  );
}
