'use client';

import { useState } from 'react';
import Link from 'next/link';

type ProjectRow = {
  id: string;
  client: string;
  goal: string;
  deliverable?: string;
  pipelineStatus: string;
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
  UNDER_REVIEW: 'bg-emerald-50 text-emerald-800',
  FAILED: 'bg-red-50 text-red-800',
  CANCELLED: 'bg-neutral-200 text-neutral-600',
};

export default function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function refresh() {
    const res = await fetch('/api/projects', { credentials: 'include' });
    const data = await res.json();
    if (data.ok && Array.isArray(data.projects)) {
      setProjects(data.projects);
    }
  }

  async function runAction(id: string, action: 'restart' | 'cancel') {
    setBusyId(id);
    setMessage(null);
    try {
      const res = await fetch(`/api/projects/${encodeURIComponent(id)}/${action}`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setMessage(data.error || `${action} failed`);
      } else {
        setMessage(`${action} → ${data.status}`);
        await refresh();
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : `${action} failed`);
    } finally {
      setBusyId(null);
    }
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
      {message ? <p className="text-sm text-neutral-600">{message}</p> : null}
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
                    {project.launchReviewUrl ? (
                      <Link
                        href={project.launchReviewUrl}
                        className="mt-1 inline-block text-xs font-semibold text-[#1B2B4D] underline"
                      >
                        Review package
                      </Link>
                    ) : null}
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
                      {project.pipelineStatus}
                    </span>
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
                        project.pipelineStatus === 'GENERATING') && (
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
