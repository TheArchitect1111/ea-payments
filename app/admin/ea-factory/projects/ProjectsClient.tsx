'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

type ProjectRow = {
  id: string;
  client: string;
  goal: string;
  deliverable?: string;
  pipelineStatus: string;
  statusLabel?: string;
  inProgress?: boolean;
  source: string;
  launchId?: string;
  launchReviewUrl?: string;
  url?: string;
  createdAt: string;
  updatedAt: string;
  error?: string;
};

const STATUS_STYLE: Record<string, string> = {
  CREATED: 'bg-neutral-100 text-neutral-700',
  QUEUED: 'bg-amber-50 text-amber-800',
  GENERATING: 'bg-sky-50 text-sky-800',
  INTAKE: 'bg-sky-50 text-sky-800',
  INTAKE_COMPLETE: 'bg-sky-50 text-sky-800',
  RESEARCHING: 'bg-indigo-50 text-indigo-800',
  DISCOVERING: 'bg-violet-50 text-violet-800',
  PLANNING: 'bg-fuchsia-50 text-fuchsia-800',
  BUILDING: 'bg-blue-50 text-blue-800',
  UNDER_REVIEW: 'bg-emerald-50 text-emerald-800',
  COMPLETE: 'bg-emerald-50 text-emerald-800',
  FAILED: 'bg-red-50 text-red-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

function statusHint(status: string): string {
  switch (status) {
    case 'QUEUED':
    case 'INTAKE':
    case 'INTAKE_COMPLETE':
    case 'RESEARCHING':
    case 'DISCOVERING':
    case 'PLANNING':
    case 'GENERATING':
      return 'Factory is working on this…';
    case 'BUILDING':
      return 'Build stage reached — check activity below for progress.';
    case 'UNDER_REVIEW':
    case 'COMPLETE':
      return 'Ready for review.';
    case 'FAILED':
      return 'Something failed — open Detail for the error.';
    default:
      return '';
  }
}

type ActionResponse = {
  ok?: boolean;
  error?: string;
  status?: string;
  message?: string;
  projects?: ProjectRow[];
};

async function readJson(res: Response): Promise<ActionResponse> {
  const raw = await res.text();
  try {
    return raw ? (JSON.parse(raw) as ActionResponse) : {};
  } catch {
    if (res.status === 401 || /login/i.test(raw)) {
      return { ok: false, error: 'Please log in again, then try Continue.' };
    }
    return { ok: false, error: 'Request failed. Please try again.' };
  }
}

export default function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function publishWebsite(projectId: string) {
    setBusyId(projectId);
    setMessage(null);
    try {
      const reviewRes = await fetch(
        `/api/admin/factory/experience-director?projectId=${encodeURIComponent(projectId)}`,
        { credentials: 'include' },
      );
      const reviewData = (await reviewRes.json().catch(() => ({}))) as {
        ok?: boolean;
        review?: { canPublish?: boolean; review?: { approvalStatus?: string } } | null;
      };
      if (!reviewData.review?.canPublish) {
        const status = reviewData.review?.review?.approvalStatus || 'Missing';
        setMessage(
          `Publish blocked — Experience Director status is ${status}. Open Experience Director and reach Approved first.`,
        );
        return;
      }

      const res = await fetch('/api/admin/factory/publish-website', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, force: true }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        siteUrl?: string;
        portalSlug?: string;
      };
      if (!res.ok || !data.ok) {
        setMessage(
          data.error ||
            'Could not publish website. Experience Director must Approve before publish.',
        );
        return;
      }
      setMessage(
        data.siteUrl
          ? `Published Future Website: ${data.siteUrl}`
          : `Published site for ${data.portalSlug || projectId}`,
      );
      if (data.siteUrl) {
        window.open(data.siteUrl, '_blank', 'noopener,noreferrer');
      }
    } catch {
      setMessage('Could not publish website.');
    } finally {
      setBusyId(null);
    }
  }

  async function refresh() {
    const res = await fetch('/api/projects', { credentials: 'include' });
    const data = await readJson(res);
    if (data.ok && Array.isArray(data.projects)) {
      setProjects(data.projects);
      return true;
    }
    return false;
  }

  const anyWorking = projects.some((p) => p.inProgress);
  // Visual-only auto-refresh while anything is in progress (not email).
  useEffect(() => {
    if (!anyWorking) return;
    const id = window.setInterval(() => {
      void refresh();
    }, 5000);
    return () => window.clearInterval(id);
  }, [anyWorking]);

  async function pollRefresh(times = 6, delayMs = 2500) {
    for (let i = 0; i < times; i += 1) {
      await new Promise((r) => window.setTimeout(r, delayMs));
      await refresh();
    }
  }

  async function runAction(id: string, action: 'restart' | 'cancel' | 'continue' | 'resend-package') {
    setBusyId(id);
    setMessage(action === 'continue' ? 'Starting Continue…' : null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await readJson(res);
      if (!res.ok || !data.ok) {
        setMessage(data.error || `${action} failed`);
        return;
      }

      setMessage(
        data.message ||
          (data.status ? `${action} → ${data.status}` : `${action} started`),
      );

      // Optimistic status update when Continue moves intake → research
      if (action === 'continue' && data.status) {
        setProjects((prev) =>
          prev.map((p) =>
            p.id === id
              ? { ...p, pipelineStatus: data.status!, updatedAt: new Date().toISOString() }
              : p,
          ),
        );
      }

      await refresh();
      if (action === 'continue') {
        void pollRefresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusyId(null);
    }
  }

  function canContinue(status: string): boolean {
    return (
      status === 'QUEUED' ||
      status === 'INTAKE' ||
      status === 'INTAKE_COMPLETE' ||
      status === 'RESEARCHING' ||
      status === 'DISCOVERING' ||
      status === 'PLANNING' ||
      status === 'BUILDING' ||
      status === 'GENERATING'
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-neutral-500">{projects.length} project(s)</p>
        <button
          type="button"
          onClick={() => void refresh()}
          className="rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-700 ring-1 ring-neutral-200"
        >
          Refresh
        </button>
      </div>
      {message ? (
        <p className="rounded-xl bg-[#FAF8F3] px-4 py-3 text-sm font-medium text-neutral-800 ring-1 ring-neutral-200">
          {message}
        </p>
      ) : null}
      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
            <tr>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Goal</th>
              <th className="px-4 py-3">Source</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-neutral-500">
                  No factory projects yet.{' '}
                  <Link href="/admin/ea-factory/launch" className="font-semibold underline">
                    Start a Launch
                  </Link>
                  .
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr key={project.id} className="border-b border-neutral-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-neutral-900">{project.client}</div>
                    <div className="mt-1 font-mono text-[11px] text-neutral-400">{project.id}</div>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Link
                        href={`/api/projects/${encodeURIComponent(project.id)}/concept-pack`}
                        target="_blank"
                        className="text-xs font-semibold text-[#1B2B4D] underline"
                      >
                        Concept Pack
                      </Link>
                      <Link
                        href={`/admin/ea-factory/experience-director?projectId=${encodeURIComponent(project.id)}`}
                        className="text-xs font-semibold text-[#1B2B4D] underline"
                      >
                        Experience Director
                      </Link>
                      <button
                        type="button"
                        className="text-xs font-semibold text-[#1B2B4D] underline disabled:opacity-50"
                        disabled={busyId === project.id}
                        title="Requires Experience Director status Approved"
                        onClick={() => void publishWebsite(project.id)}
                      >
                        Publish Future Website
                      </button>
                      <Link
                        href={`/api/projects/${encodeURIComponent(project.id)}/export`}
                        className="text-xs font-semibold text-[#1B2B4D] underline"
                      >
                        Download
                      </Link>
                      {project.launchReviewUrl ? (
                        <Link
                          href={project.launchReviewUrl}
                          className="text-xs font-semibold text-[#1B2B4D] underline"
                        >
                          Review package
                        </Link>
                      ) : null}
                    </div>
                    {project.error ? (
                      <p className="mt-1 text-xs text-red-600">{project.error}</p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        STATUS_STYLE[project.pipelineStatus] || 'bg-neutral-100 text-neutral-700'
                      }`}
                    >
                      {project.statusLabel || project.pipelineStatus}
                    </span>
                    <p className="mt-1 font-mono text-[10px] text-neutral-400">
                      {project.pipelineStatus}
                    </p>
                    {statusHint(project.pipelineStatus) ? (
                      <p className="mt-1 text-[11px] text-neutral-500">
                        {statusHint(project.pipelineStatus)}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-4 py-3 text-neutral-600">{project.goal}</td>
                  <td className="px-4 py-3 text-neutral-500">{project.source}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">
                    {new Date(project.updatedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/admin/ea-factory/projects?focus=${encodeURIComponent(project.id)}`}
                        className="text-xs font-bold text-neutral-700 underline"
                      >
                        Detail
                      </Link>
                      {canContinue(project.pipelineStatus) ? (
                        <button
                          type="button"
                          disabled={busyId === project.id}
                          onClick={() => void runAction(project.id, 'continue')}
                          className="rounded-full bg-[#1B2B4D] px-3 py-1.5 text-xs font-bold text-white disabled:opacity-50"
                        >
                          {busyId === project.id ? 'Working…' : 'Continue'}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        disabled={busyId === project.id}
                        onClick={() => void runAction(project.id, 'resend-package')}
                        className="text-xs font-bold text-[#1B2B4D] underline disabled:opacity-50"
                      >
                        Email package
                      </button>
                      {(project.pipelineStatus === 'FAILED' ||
                        project.pipelineStatus === 'CANCELLED') && (
                        <button
                          type="button"
                          disabled={busyId === project.id}
                          onClick={() => void runAction(project.id, 'restart')}
                          className="text-xs font-bold text-[#1B2B4D] underline disabled:opacity-50"
                        >
                          Restart
                        </button>
                      )}
                      {(project.pipelineStatus === 'CREATED' ||
                        project.pipelineStatus === 'QUEUED' ||
                        project.pipelineStatus === 'GENERATING' ||
                        project.pipelineStatus === 'INTAKE' ||
                        project.pipelineStatus === 'INTAKE_COMPLETE') && (
                        <button
                          type="button"
                          disabled={busyId === project.id}
                          onClick={() => void runAction(project.id, 'cancel')}
                          className="text-xs font-bold text-red-700 underline disabled:opacity-50"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
