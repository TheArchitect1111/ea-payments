'use client';

import { useState } from 'react';

export function CopyCodexPrompt({ prompt }: { prompt: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(prompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copy} className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white">
      {copied ? 'Copied' : 'Copy Codex Prompt'}
    </button>
  );
}

type Repo = {
  id: string;
  name: string;
  reviewStatus: 'pending' | 'approved' | 'removed';
  requirement: 'required' | 'optional';
  reviewerNotes: string;
};

export function RepoReviewForm({ launchId, repos }: { launchId: string; repos: Repo[] }) {
  const [items, setItems] = useState(repos);
  const [reviewerName, setReviewerName] = useState('EA Reviewer');
  const [pending, setPending] = useState(false);

  function patchRepo(id: string, patch: Partial<Repo>) {
    setItems((current) => current.map((repo) => repo.id === id ? { ...repo, ...patch } : repo));
  }

  async function save() {
    setPending(true);
    await fetch(`/api/ea-factory/launch/${launchId}/repos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewerName, repos: items }),
    });
    window.location.reload();
  }

  return (
    <div className="mt-5 space-y-3">
      <input
        value={reviewerName}
        onChange={(event) => setReviewerName(event.target.value)}
        className="w-full border border-neutral-200 bg-white px-3 py-2 text-sm outline-none"
        placeholder="Reviewer name"
      />
      {items.map((repo) => (
        <div key={repo.id} className="grid gap-2 border border-neutral-200 bg-white p-3 md:grid-cols-[1fr_150px_150px]">
          <div>
            <p className="font-black text-[#1B2B4D]">{repo.name}</p>
            <input
              value={repo.reviewerNotes}
              onChange={(event) => patchRepo(repo.id, { reviewerNotes: event.target.value })}
              className="mt-2 w-full border border-neutral-200 px-2 py-1 text-xs outline-none"
              placeholder="Reviewer notes"
            />
          </div>
          <select
            value={repo.reviewStatus}
            onChange={(event) => patchRepo(repo.id, { reviewStatus: event.target.value as Repo['reviewStatus'] })}
            className="border border-neutral-200 px-2 py-2 text-xs outline-none"
          >
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="removed">Removed</option>
          </select>
          <select
            value={repo.requirement}
            onChange={(event) => patchRepo(repo.id, { requirement: event.target.value as Repo['requirement'] })}
            className="border border-neutral-200 px-2 py-2 text-xs outline-none"
          >
            <option value="required">Required</option>
            <option value="optional">Optional</option>
          </select>
        </div>
      ))}
      <button type="button" onClick={save} disabled={pending} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D] disabled:opacity-50">
        {pending ? 'Saving...' : 'Save Repo Review'}
      </button>
    </div>
  );
}
