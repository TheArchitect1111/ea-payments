'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  archiveCapture,
  fetchCaptureIntelligence,
  recordCaptureOutcome,
  snoozeCapture,
} from '@/lib/simplifi-client';

export default function OpportunityActions({
  recordId,
  dueDate,
  outcomeStatus,
}: {
  recordId: string;
  dueDate?: string;
  outcomeStatus?: string;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState('');

  const run = async (fn: () => Promise<void>) => {
    setLoading(true);
    setNote('');
    try {
      await fn();
      router.refresh();
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="sw-brief-panel" aria-label="Opportunity actions">
      <h2>Next moves</h2>
      {dueDate ? <p className="sw-muted">Target date: {dueDate}</p> : null}
      {outcomeStatus ? <p className="sw-muted">Outcome: {outcomeStatus}</p> : null}
      {note ? <p className="sw-action-note">{note}</p> : null}
      {intel ? <p className="sw-intelligence-note">{intel}</p> : null}
      <div className="sw-card-actions" style={{ marginTop: 12 }}>
        <button
          type="button"
          className="sw-btn sw-btn-small"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await snoozeCapture(recordId, 7);
              setNote(data.ok ? `Snoozed until ${data.dueDate ?? 'later'}.` : data.error ?? 'Could not snooze.');
            })
          }
        >
          Snooze 7 days
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await recordCaptureOutcome(recordId, 'in_progress');
              setNote(data.ok ? 'Marked in progress.' : data.error ?? 'Could not update.');
            })
          }
        >
          In progress
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await recordCaptureOutcome(recordId, 'won');
              setNote(data.ok ? 'Marked won.' : data.error ?? 'Could not update.');
            })
          }
        >
          Won
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small sw-btn-ghost"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await recordCaptureOutcome(recordId, 'passed');
              setNote(data.ok ? 'Passed.' : data.error ?? 'Could not update.');
            })
          }
        >
          Pass
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small sw-btn-ghost"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await archiveCapture(recordId);
              setNote(data.ok ? 'Archived.' : data.error ?? 'Could not archive.');
            })
          }
        >
          Archive
        </button>
        <button
          type="button"
          className="sw-btn sw-btn-small sw-btn-ghost"
          disabled={loading}
          onClick={() =>
            void run(async () => {
              const data = await fetchCaptureIntelligence(recordId);
              if (!data.ok || !data.intelligence) {
                setIntel(data.error ?? 'Intelligence not ready.');
                return;
              }
              const { decision, build } = data.intelligence;
              setIntel(
                `Path: ${decision.recommendedPath} (${decision.confidenceScore}/100) · ${build.buildPath}`,
              );
            })
          }
        >
          Build Intelligence
        </button>
      </div>
    </section>
  );
}
