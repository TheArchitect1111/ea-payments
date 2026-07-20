'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { recordCaptureOutcome, snoozeCapture } from '@/lib/simplifi-client';

export default function FollowUpActions({
  recordId,
  dueDate,
  title,
  nextAction,
}: {
  recordId: string;
  dueDate?: string;
  title: string;
  nextAction?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    setNote('');
    try {
      await fn();
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <li>
      <div>
        <strong>
          <Link href={`/simplifi/opportunity/${recordId}`}>{title}</Link>
        </strong>
        <p>{nextAction}</p>
        {note ? <p className="sw-muted">{note}</p> : null}
        <div className="sw-card-actions" style={{ marginTop: 8 }}>
          <button
            type="button"
            className="sw-btn sw-btn-small"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const data = await snoozeCapture(recordId, 7);
                setNote(data.ok ? `Snoozed to ${data.dueDate ?? 'later'}` : data.error ?? 'Failed');
              })
            }
          >
            Snooze 7d
          </button>
          <button
            type="button"
            className="sw-btn sw-btn-small"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const data = await recordCaptureOutcome(recordId, 'in_progress');
                setNote(data.ok ? 'In progress' : data.error ?? 'Failed');
              })
            }
          >
            In progress
          </button>
          <button
            type="button"
            className="sw-btn sw-btn-small"
            disabled={busy}
            onClick={() =>
              void run(async () => {
                const data = await recordCaptureOutcome(recordId, 'won');
                setNote(data.ok ? 'Done' : data.error ?? 'Failed');
              })
            }
          >
            Done
          </button>
        </div>
      </div>
      <span>{dueDate}</span>
    </li>
  );
}
