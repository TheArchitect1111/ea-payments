'use client';

import { useState } from 'react';
import { GOLD, NAVY } from '@/lib/design-system';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';

type Props = {
  submission: CtpAdminSubmissionView;
  onUpdated: (next: CtpAdminSubmissionView) => void;
};

type Action =
  | 'ready_for_review'
  | 'approve_reveal'
  | 'run_production'
  | 'run_digital_audit'
  | 'run_open_design_handoff'
  | 'resend_executive_email'
  | 'reprovision_workspace';

type HandoffPayload = {
  mode: 'github-pr' | 'package-only' | 'failed';
  storySentence: string;
  creativeDnaSummary: string;
  deliverableTitles: string[];
  markdown: string;
  packageJson: unknown;
  pullRequestUrl?: string;
};

export default function CtpExecutiveActionsPanel({ submission, onUpdated }: Props) {
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState('');
  const [revealUrl, setRevealUrl] = useState('');
  const [handoffUrl, setHandoffUrl] = useState('');
  const [handoff, setHandoff] = useState<HandoffPayload | null>(null);
  const [copied, setCopied] = useState<'md' | 'json' | null>(null);

  async function run(action: Action) {
    setBusy(action);
    setError('');
    setRevealUrl('');
    setHandoffUrl('');
    if (action === 'run_open_design_handoff') setHandoff(null);
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
        handoffUrl?: string;
        handoff?: HandoffPayload;
        submission?: CtpAdminSubmissionView;
      };
      if (!res.ok || !data.ok || !data.submission) {
        setError(data.error || `Action failed (${res.status})`);
        return;
      }
      onUpdated(data.submission);
      if (data.revealUrl) setRevealUrl(data.revealUrl);
      if (data.handoffUrl) setHandoffUrl(data.handoffUrl);
      if (data.handoff) setHandoff(data.handoff);
    } catch {
      setError('Network error. Try again.');
    } finally {
      setBusy(null);
    }
  }

  async function copyText(kind: 'md' | 'json', value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      setError('Could not copy to clipboard.');
    }
  }

  const completed = submission.status === 'Completed';
  const artifactCount = submission.productionArtifactCount ?? 0;
  const needsReprovision =
    submission.workspaceStatus === 'Failed' ||
    submission.workspaceStatus === 'Pending' ||
    !submission.portalSlug;

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
          disabled={Boolean(busy)}
          onClick={() => void run('run_digital_audit')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
        >
          {busy === 'run_digital_audit' ? 'Auditing…' : 'Re-run digital audit'}
        </button>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => void run('resend_executive_email')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
        >
          {busy === 'resend_executive_email' ? 'Sending…' : 'Resend executive email'}
        </button>
        {needsReprovision ? (
          <button
            type="button"
            disabled={Boolean(busy) || submission.workspaceStatus === 'Provisioning'}
            onClick={() => void run('reprovision_workspace')}
            className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
          >
            {busy === 'reprovision_workspace' ? 'Provisioning…' : 'Re-provision workspace'}
          </button>
        ) : null}
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
          disabled={Boolean(busy)}
          onClick={() => void run('run_open_design_handoff')}
          className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800 disabled:opacity-50"
        >
          {busy === 'run_open_design_handoff' ? 'Handing off…' : 'Open Design → Cursor'}
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
      {handoff ? (
        <div className="border border-neutral-200 bg-white p-3 space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">
            Cursor handoff · {handoff.mode === 'github-pr' ? 'GitHub PR' : 'Package only'}
          </p>
          <p className="text-sm font-semibold text-neutral-900 leading-6">{handoff.storySentence}</p>
          {handoff.creativeDnaSummary ? (
            <p className="text-xs text-neutral-600 leading-5">{handoff.creativeDnaSummary}</p>
          ) : null}
          {handoff.deliverableTitles.length ? (
            <p className="text-xs text-neutral-600">
              Deliverables: {handoff.deliverableTitles.slice(0, 5).join(' · ')}
              {handoff.deliverableTitles.length > 5 ? '…' : ''}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void copyText('md', handoff.markdown)}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800"
            >
              {copied === 'md' ? 'Copied markdown' : 'Copy markdown'}
            </button>
            <button
              type="button"
              onClick={() => void copyText('json', JSON.stringify(handoff.packageJson, null, 2))}
              className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800"
            >
              {copied === 'json' ? 'Copied JSON' : 'Copy JSON'}
            </button>
            {handoffUrl || handoff.pullRequestUrl ? (
              <a
                href={handoffUrl || handoff.pullRequestUrl}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-2 text-xs font-bold uppercase tracking-wider border border-neutral-300 bg-white text-neutral-800"
              >
                Open pull request
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
      {completed ? (
        <p className="text-sm font-semibold text-emerald-800">This submission is completed / revealed.</p>
      ) : null}
    </div>
  );
}
