'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { NAVY } from '@/lib/design-system';

type LiveState = {
  client?: string;
  statusLabel: string;
  pipelineStatus: string;
  inProgress: boolean;
  ready: boolean;
  failed: boolean;
  error?: string;
};

export default function FactoryLiveStatus({ projectId }: { projectId: string }) {
  const [live, setLive] = useState<LiveState | null>(null);

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
          inProgress?: boolean;
          ready?: boolean;
          failed?: boolean;
        };
        if (cancelled || !data.ok || !data.project) return;

        const next: LiveState = {
          client: data.project.client,
          statusLabel: data.statusLabel || data.project.pipelineStatus || 'Working…',
          pipelineStatus: data.project.pipelineStatus || '',
          inProgress: Boolean(data.inProgress),
          ready: Boolean(data.ready),
          failed: Boolean(data.failed),
          error: data.project.error,
        };
        setLive(next);

        if (next.inProgress) {
          timer = window.setTimeout(() => void tick(), 4000);
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

  const tone = live?.failed
    ? 'border-red-200 bg-red-50 text-red-900'
    : live?.ready
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-sky-200 bg-sky-50 text-sky-950';

  return (
    <div className={`rounded-xl border px-4 py-4 text-sm ${tone}`}>
      <p className="text-xs font-bold uppercase tracking-[0.2em] opacity-70">Live status</p>
      <p className="mt-2 text-lg font-black" style={{ color: live?.failed ? undefined : NAVY }}>
        {live?.statusLabel || 'Starting…'}
      </p>
      {live?.client ? <p className="mt-1 font-semibold">{live.client}</p> : null}
      <p className="mt-1 font-mono text-[11px] opacity-70">{projectId}</p>
      {live?.inProgress ? (
        <p className="mt-3 text-xs opacity-80">
          Updating on this screen every few seconds. You’ll also get an email when it starts and when
          it’s ready (not for every step).
        </p>
      ) : null}
      {live?.ready ? (
        <p className="mt-3 text-xs font-semibold">Ready — open the project for details.</p>
      ) : null}
      {live?.failed ? (
        <p className="mt-3 text-xs font-semibold">{live.error || 'Something went wrong.'}</p>
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
