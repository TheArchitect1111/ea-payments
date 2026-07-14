'use client';

import { useState } from 'react';
import { GOLD, NAVY } from '@/lib/design-system';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';

type Props = {
  submission: CtpAdminSubmissionView;
  onUpdated: (next: CtpAdminSubmissionView) => void;
};

type Action = 'ready_for_review' | 'approve_reveal' | 'run_production';

export default function CtpExecutiveActionsPanel({ submission, onUpdated }: Props) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [revealUrl, setRevealUrl] = useState('');

  async function run(action: Action) {
    setBusy(action);
    setError('');
    setRevealUrl('');
    try {
      const res = await fetch(
        `/api/admin/ctp/submissions/${encodeURIComponent(submission.id)}/action`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        },
      );
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        revealUrl?: string;
        submission?: CtpAdminSubmissionView;
      };
      if (!res.ok || !data.ok || !data.submission) {
        setError(data.error || `Action failed (${res.status})`);
        return;
      }
      onUpdated(data.submission);
      if (data.revealUrl) setRevealUrl(data.revealUrl);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(null);
    }
  }

  const completed = submission.status === 'Completed';
  const artifactCount = submission.productionArtifactCount ?? 0;

  return (
    <div className="border border-neutral-200 bg-neutral-50 p-4 space-y-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
          Executive desk
        </p>
        <p className="mt-1 text-sm text-neutral-600 leading-6">
          Run AI production, mark ready for review, then approve & reveal.
        </p>
      </div>

      {submission.productionHeadline ? (
        <div className="border border-neutral-200 bg-white p-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Production package
          </p>
          <p className="mt-1 text-sm font-semibold text-neutral-900">{submission.productionHeadline}</p>
          <p className="mt-1 text-xs text-neutral-600">
            {artifactCount} artifact{artifactCount === 1 ? '' : 's'}
            {submission.productionStack?.length
              ? ` · ${submission.productionStack.slice(0, 3).join(' · ')}`
              : ''}
          </p>
          {submission.productionArtifacts?.length ? (
            <ul className="mt-3 space-y-2">
              {submission.productionArtifacts.map((artifact) => (
                <li key={artifact.id} className="text-sm text-neutral-700">
                  <span className="font-semibold">{artifact.title}</span>
                  <span className="text-neutral-500"> — {artifact.summary}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-neutral-600">No production package yet — run AI production.</p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={Boolean(busy) || completed}
          onClick={() => void run('run_production')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
        >
          {busy === 'run_production' ? 'Building…' : 'Run AI production'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || completed}
          onClick={() => void run('ready_for_review')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
        >
          {busy === 'ready_for_review' ? 'Marking…' : 'Mark ready for review'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy) || completed}
          onClick={() => void run('approve_reveal')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {busy === 'approve_reveal' ? 'Revealing…' : 'Approve & reveal'}
        </button>
        {submission.portalSlug ? (
          <a
            href={`/reveal/${encodeURIComponent(submission.portalSlug)}`}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800"
          >
            Preview reveal
          </a>
        ) : null}
      </div>
      {error ? <p className="text-sm text-red-700">{error}</p> : null}
      {revealUrl ? (
        <p className="text-sm text-emerald-800">
          Reveal sent.{' '}
          <a href={revealUrl} className="font-bold underline" target="_blank" rel="noreferrer">
            Open reveal
          </a>
        </p>
      ) : null}
      {completed ? (
        <p className="text-sm font-semibold text-emerald-800">This submission is completed / revealed.</p>
      ) : null}
    </div>
  );
}
