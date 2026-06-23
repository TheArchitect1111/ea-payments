'use client';

import { useState } from 'react';

const DECISIONS = [
  { id: 'approved', label: 'Approve' },
  { id: 'rejected', label: 'Reject' },
  { id: 'revision-requested', label: 'Request Revision' },
] as const;

export default function ApprovalActions({ launchId }: { launchId: string }) {
  const [reviewerName, setReviewerName] = useState('EA Reviewer');
  const [comments, setComments] = useState('');
  const [pending, setPending] = useState('');
  const [message, setMessage] = useState('');

  async function submit(decision: (typeof DECISIONS)[number]['id']) {
    setPending(decision);
    setMessage('');
    const response = await fetch(`/api/ea-factory/launch/${launchId}/approval`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reviewerName, comments }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setMessage(payload.error ?? 'Approval update failed.');
      setPending('');
      return;
    }
    setMessage(`Updated: ${payload.launch.status.replaceAll('-', ' ')}`);
    window.location.reload();
  }

  return (
    <div className="mt-5 space-y-3 border-t border-neutral-200 pt-4">
      <input
        value={reviewerName}
        onChange={(event) => setReviewerName(event.target.value)}
        className="w-full border border-neutral-200 bg-[#FAF8F3] px-3 py-2 text-sm outline-none"
        placeholder="Reviewer name"
      />
      <textarea
        value={comments}
        onChange={(event) => setComments(event.target.value)}
        className="h-24 w-full border border-neutral-200 bg-[#FAF8F3] px-3 py-2 text-sm outline-none"
        placeholder="Reviewer comments"
      />
      <div className="flex flex-wrap gap-2">
        {DECISIONS.map((decision) => (
          <button
            key={decision.id}
            type="button"
            onClick={() => submit(decision.id)}
            disabled={Boolean(pending)}
            className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
          >
            {pending === decision.id ? 'Saving...' : decision.label}
          </button>
        ))}
      </div>
      {message ? <p className="text-xs font-semibold text-neutral-600">{message}</p> : null}
    </div>
  );
}
