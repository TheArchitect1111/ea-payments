'use client';

import { useState } from 'react';
import { GOLD } from '@/lib/design-system';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';

function toLocalInputValue(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatScheduled(iso?: string): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CtpReviewSchedulePanel({
  submission,
  onScheduled,
}: {
  submission: CtpAdminSubmissionView;
  onScheduled: (next: CtpAdminSubmissionView) => void;
}) {
  const [value, setValue] = useState(toLocalInputValue(submission.reviewScheduledAt));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function scheduleReview() {
    if (!value) {
      setError('Choose a review date and time.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/ctp/submissions/${encodeURIComponent(submission.id)}/schedule-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewScheduledAt: new Date(value).toISOString() }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; submission?: CtpAdminSubmissionView };
      if (!res.ok || !data.ok || !data.submission) {
        setError(data.error ?? 'Could not schedule review.');
        return;
      }
      onScheduled(data.submission);
      setValue(toLocalInputValue(data.submission.reviewScheduledAt));
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
        Collaborative review
      </p>
      {submission.reviewScheduledAt ? (
        <p className="mt-2 text-sm text-neutral-700">
          Scheduled for <strong>{formatScheduled(submission.reviewScheduledAt)}</strong>
        </p>
      ) : (
        <p className="mt-2 text-sm text-neutral-600">
          Set when the prospect collaborative review will happen. Portal timeline updates automatically.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-end gap-3">
        <label className="block">
          <span className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
            Review datetime
          </span>
          <input
            type="datetime-local"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800"
            disabled={saving}
          />
        </label>
        <button
          type="button"
          onClick={() => void scheduleReview()}
          disabled={saving || !value}
          className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50"
          style={{ backgroundColor: '#1B2B4D' }}
        >
          {saving ? 'Saving…' : submission.reviewScheduledAt ? 'Update schedule' : 'Schedule review'}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
