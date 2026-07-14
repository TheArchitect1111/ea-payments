'use client';

import { useState } from 'react';
import { GOLD, NAVY } from '@/lib/design-system';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';

type Props = {
  submission: CtpAdminSubmissionView;
  onUpdated: (next: CtpAdminSubmissionView) => void;
};

export default function CtpExecutiveActionsPanel({ submission, onUpdated }: Props) {
  const [busy, setBusy] = useState<'ready_for_review' | 'approve_reveal' | null>(null);
  const [error, setError] = useState('');
  const [revealUrl, setRevealUrl] = useState('');

  async function run(action: 'ready_for_review' | 'approve_reveal') {
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

  return (
    <div className="border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
        Executive desk
      </p>
      <p className="mt-1 text-sm text-neutral-600 leading-6">
        One-click review and reveal. Approval emails the client and unlocks their reveal experience.
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
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
      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      {revealUrl ? (
        <p className="mt-3 text-sm text-emerald-800">
          Reveal sent.{' '}
          <a href={revealUrl} className="font-bold underline" target="_blank" rel="noreferrer">
            Open reveal
          </a>
        </p>
      ) : null}
      {completed ? (
        <p className="mt-3 text-sm font-semibold text-emerald-800">This submission is completed / revealed.</p>
      ) : null}
    </div>
  );
}
