'use client';

import { useState } from 'react';
import type { PortalFormSubmission, PortalFormStatus } from '@/lib/portal-forms/types';

type Props = {
  submissions: PortalFormSubmission[];
  canManage: boolean;
};

const STATUS_OPTIONS: PortalFormStatus[] = ['submitted', 'reviewed', 'accepted', 'rejected'];

export default function IntakeStaffPanel({ submissions: initial, canManage }: Props) {
  const [rows, setRows] = useState(initial);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  if (!canManage) {
    if (rows.length === 0) return null;
    return (
      <ul className="ep-module-list">
        {rows.map((row) => (
          <li key={row.id} className="ep-module-card">
            <p className="ep-module-card-title">{row.name || 'Application'}</p>
            <p className="ep-module-card-meta">Status: {row.status}</p>
            {row.notes ? <p className="ep-module-card-note">{row.notes}</p> : null}
            <p className="ep-module-card-meta">
              Submitted{' '}
              {new Date(row.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
              })}
            </p>
          </li>
        ))}
      </ul>
    );
  }

  async function setStatus(submissionId: string, status: PortalFormStatus) {
    setBusyId(submissionId);
    setError('');
    try {
      const res = await fetch('/api/portal/forms/status', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId, status }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        submission?: PortalFormSubmission;
        error?: string;
      };
      if (!res.ok || !data.ok || !data.submission) {
        setError(data.error || 'Could not update status.');
        return;
      }
      setRows((prev) => prev.map((row) => (row.id === submissionId ? data.submission! : row)));
    } catch {
      setError('Network error — try again.');
    } finally {
      setBusyId('');
    }
  }

  if (rows.length === 0) {
    return <p className="ep-module-card-note">No intake submissions yet.</p>;
  }

  return (
    <div style={{ marginTop: 24 }}>
      <h2 className="ep-module-card-title">Intake queue (staff)</h2>
      {error ? <p className="ep-module-card-note" style={{ color: '#b42318' }}>{error}</p> : null}
      <ul className="ep-module-list">
        {rows.map((row) => (
          <li key={row.id} className="ep-module-card">
            <p className="ep-module-card-title">
              {row.name} · {row.status}
            </p>
            <p className="ep-module-card-meta">
              {row.email}
              {row.phone ? ` · ${row.phone}` : ''}
            </p>
            {row.notes ? <p className="ep-module-card-note">{row.notes}</p> : null}
            <p className="ep-module-card-meta">
              {new Date(row.createdAt).toLocaleString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
              {STATUS_OPTIONS.map((status) => (
                <button
                  key={status}
                  type="button"
                  className="ep-btn"
                  disabled={busyId === row.id || row.status === status}
                  onClick={() => setStatus(row.id, status)}
                >
                  {status}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
