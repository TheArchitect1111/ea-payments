'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ACTIVE_SAVE_PURPOSES,
  type ActiveSavePurpose,
} from '@/lib/active-save';
import {
  activeSaveCapture,
  archiveCapture,
  fetchCaptureIntelligence,
  recordCaptureOutcome,
  snoozeCapture,
} from '@/lib/simplifi-client';
import type { OrbOutcomeFlash } from '@/lib/orb';

function defaultDatePlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function OpportunityActions({
  recordId,
  dueDate,
  outcomeStatus,
  onOutcomeFlash,
}: {
  recordId: string;
  dueDate?: string;
  outcomeStatus?: string;
  onOutcomeFlash?: (flash: OrbOutcomeFlash) => void;
}) {
  const router = useRouter();
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [intel, setIntel] = useState('');
  const [purpose, setPurpose] = useState<ActiveSavePurpose>('potential-opportunity');
  const [dateValue, setDateValue] = useState(dueDate || defaultDatePlus(7));

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

      <div className="sw-card-actions" style={{ marginTop: 12, flexWrap: 'wrap', gap: 8 }}>
        <label className="sw-muted" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 160 }}>
          Purpose
          <select
            value={purpose}
            disabled={loading}
            onChange={(e) => {
              const next = e.target.value as ActiveSavePurpose;
              setPurpose(next);
              const opt = ACTIVE_SAVE_PURPOSES.find((p) => p.id === next);
              if (opt) setDateValue(defaultDatePlus(opt.daysUntilDue));
            }}
            className="sw-btn sw-btn-small"
            style={{ textAlign: 'left' }}
          >
            {ACTIVE_SAVE_PURPOSES.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
        <label className="sw-muted" style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 140 }}>
          Due date
          <input
            type="date"
            value={dateValue}
            disabled={loading}
            onChange={(e) => setDateValue(e.target.value)}
            className="sw-btn sw-btn-small"
          />
        </label>
        <button
          type="button"
          className="sw-btn sw-btn-small"
          disabled={loading || !dateValue}
          onClick={() =>
            void run(async () => {
              const data = await activeSaveCapture({
                recordId,
                purpose,
                dueDate: dateValue,
              });
              setNote(
                data.ok
                  ? `Saved · due ${data.dueDate ?? dateValue}. Shows on Follow-ups.`
                  : data.error ?? 'Could not save due date.',
              );
            })
          }
        >
          Set follow-up
        </button>
      </div>

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
              if (data.ok) onOutcomeFlash?.('success');
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
                setIntel(data.error ?? 'Intelligence unavailable.');
                return;
              }
              const { decision, build } = data.intelligence;
              setIntel(
                `${decision.recommendedPath} (${decision.confidenceScore}%) · ${build.buildPath} · ${build.overlayConfidence.overall}`,
              );
            })
          }
        >
          Intelligence
        </button>
      </div>
    </section>
  );
}
