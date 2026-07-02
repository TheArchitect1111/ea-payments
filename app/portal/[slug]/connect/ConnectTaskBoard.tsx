'use client';

import { useCallback, useEffect, useState } from 'react';

type FollowUpTask = {
  id: string;
  relationshipId: string;
  title: string;
  subtitle: string;
  priority: 'Low' | 'Medium' | 'High' | 'Immediate';
  status: 'open' | 'completed';
  recommendedAction: string;
  contact: { name: string; email: string; phone?: string };
  routedTeam: string;
  event?: string;
  representative?: string;
  opportunityScore: number;
  reasons: string[];
  completedAt?: string;
};

type Props = {
  canManage: boolean;
};

const PRIORITY_COLOR: Record<FollowUpTask['priority'], string> = {
  Immediate: '#b91c1c',
  High: '#c9a844',
  Medium: '#1B2B4D',
  Low: '#64748b',
};

export default function ConnectTaskBoard({ canManage }: Props) {
  const [open, setOpen] = useState<FollowUpTask[]>([]);
  const [completed, setCompleted] = useState<FollowUpTask[]>([]);
  const [stats, setStats] = useState({ open: 0, completed: 0, immediate: 0 });
  const [busyId, setBusyId] = useState('');
  const [noteById, setNoteById] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTasks = useCallback(async () => {
    if (!canManage) return;
    setLoading(true);
    setError('');
    try {
      const response = await fetch('/api/portal/connect/tasks');
      const data = (await response.json()) as {
        open?: FollowUpTask[];
        completed?: FollowUpTask[];
        stats?: typeof stats;
        error?: string;
      };
      if (!response.ok) throw new Error(data.error ?? 'Could not load tasks.');
      setOpen(data.open ?? []);
      setCompleted(data.completed ?? []);
      setStats(data.stats ?? { open: 0, completed: 0, immediate: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load tasks.');
    } finally {
      setLoading(false);
    }
  }, [canManage]);

  useEffect(() => {
    void loadTasks();
  }, [loadTasks]);

  async function completeTask(relationshipId: string) {
    setBusyId(relationshipId);
    setError('');
    try {
      const response = await fetch('/api/portal/connect/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relationshipId, note: noteById[relationshipId]?.trim() || undefined }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? 'Could not complete follow-up.');
      await loadTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete follow-up.');
    } finally {
      setBusyId('');
    }
  }

  if (!canManage) return null;

  return (
    <section className="ep-card" style={{ marginTop: 24 }}>
      <div className="ep-card-header">
        <div>
          <p className="ep-welcome-label">Staff follow-up</p>
          <h2 className="ep-card-title">Task board</h2>
          <p className="ep-pulse-summary">
            {stats.open} open · {stats.immediate} immediate · {stats.completed} completed recently
          </p>
        </div>
        <button type="button" onClick={() => void loadTasks()} className="ep-btn ep-btn-secondary">
          Refresh
        </button>
      </div>

      {loading ? <p className="ep-pulse-summary">Loading tasks…</p> : null}
      {error ? <p className="ep-form-error">{error}</p> : null}

      <div className="grid gap-4" style={{ marginTop: 16 }}>
        {open.length === 0 && !loading ? (
          <p className="ep-pulse-summary">No follow-ups waiting. New hot leads will appear here automatically.</p>
        ) : null}

        {open.map((task) => (
          <article key={task.id} className="border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-black text-neutral-900">{task.title}</h3>
                  <span
                    className="px-2 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white"
                    style={{ backgroundColor: PRIORITY_COLOR[task.priority] }}
                  >
                    {task.priority}
                  </span>
                  <span className="text-sm font-bold text-neutral-500">Score {task.opportunityScore}</span>
                </div>
                <p className="mt-2 text-sm text-neutral-600">{task.recommendedAction}</p>
                <p className="mt-2 text-sm text-neutral-500">
                  {task.contact.email}
                  {task.contact.phone ? ` · ${task.contact.phone}` : ''}
                  {task.event ? ` · ${task.event}` : ''}
                  {task.representative ? ` · ${task.representative}` : ''}
                </p>
                <p className="mt-1 text-xs font-bold uppercase tracking-[0.12em] text-neutral-400">{task.routedTeam}</p>
              </div>
            </div>

            <textarea
              value={noteById[task.id] ?? ''}
              onChange={(e) => setNoteById((current) => ({ ...current, [task.id]: e.target.value }))}
              placeholder="Optional follow-up note"
              rows={2}
              className="mt-3 w-full border border-neutral-300 p-3 text-sm"
            />

            <button
              type="button"
              disabled={busyId === task.id}
              onClick={() => void completeTask(task.relationshipId)}
              className="ep-btn ep-btn-primary mt-3"
            >
              {busyId === task.id ? 'Saving…' : 'Mark follow-up complete'}
            </button>
          </article>
        ))}
      </div>

      {completed.length > 0 ? (
        <div style={{ marginTop: 24 }}>
          <h3 className="text-sm font-black uppercase tracking-[0.14em] text-neutral-500">Recently completed</h3>
          <div className="mt-3 grid gap-2">
            {completed.slice(0, 5).map((task) => (
              <p key={`${task.id}-${task.completedAt}`} className="text-sm text-neutral-600">
                <strong>{task.title}</strong>
                {task.completedAt ? ` · ${new Date(task.completedAt).toLocaleString()}` : ''}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
