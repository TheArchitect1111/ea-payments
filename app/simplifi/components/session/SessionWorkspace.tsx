'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import { priorityLevelLabel } from '@/lib/priority-engine';
import { buildExpirationAlerts } from '@/lib/smart-expiration';
import { analyzeCaptureUrl } from '@/lib/simplifi-client';
import OpportunityActions from '@/app/simplifi/opportunity/[id]/OpportunityActions';
import './session-workspace.css';

export type SessionView =
  | { kind: 'inbox' }
  | { kind: 'opportunity'; id: string }
  | { kind: 'followups' }
  | { kind: 'calendar' }
  | { kind: 'capture'; draft?: string };

/**
 * Temporary Orb-generated workspace rendered over the current screen.
 * Reuses data the Orb already holds (objects) — no new fetch. Dismiss returns to Brief.
 */
export default function SessionWorkspace({
  view,
  objects,
  loggedIn,
  onClose,
  onOpenOpportunity,
  onBackToInbox,
}: {
  view: SessionView;
  objects: SimplifiObject[];
  loggedIn: boolean;
  onClose: () => void;
  onOpenOpportunity: (id: string) => void;
  onBackToInbox: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((element) => !element.hasAttribute('hidden'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [onClose, view]);

  const opportunity =
    view.kind === 'opportunity' ? objects.find((o) => o.id === view.id) ?? null : null;

  return (
    <>
      <button
        type="button"
        className="orb-session-scrim"
        aria-label="Dismiss workspace"
        onClick={onClose}
      />
      <section
        ref={panelRef}
        className="orb-session-panel"
        role="dialog"
        aria-modal="true"
        aria-label={SESSION_LABELS[view.kind]}
      >
        <header className="orb-session-head">
          {view.kind === 'opportunity' ? (
            <button type="button" className="orb-session-back" onClick={onBackToInbox}>
              ← Inbox
            </button>
          ) : (
            <span className="orb-session-kicker">Workspace</span>
          )}
          <button ref={closeRef} type="button" className="orb-session-close" onClick={onClose}>
            Done
          </button>
        </header>

        <div className="orb-session-body">
          {view.kind === 'inbox' ? (
            <InboxView objects={objects} onOpenOpportunity={onOpenOpportunity} />
          ) : view.kind === 'followups' ? (
            <FollowUpsView objects={objects} loggedIn={loggedIn} onOpenOpportunity={onOpenOpportunity} />
          ) : view.kind === 'calendar' ? (
            <CalendarView objects={objects} loggedIn={loggedIn} onOpenOpportunity={onOpenOpportunity} />
          ) : view.kind === 'capture' ? (
            <CaptureView initialDraft={view.draft} />
          ) : opportunity ? (
            <OpportunityView opportunity={opportunity} loggedIn={loggedIn} />
          ) : (
            <div className="orb-session-empty">
              <p>That opportunity isn’t in this session.</p>
              <button type="button" className="orb-session-primary" onClick={onBackToInbox}>
                Back to inbox
              </button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

const SESSION_LABELS: Record<SessionView['kind'], string> = {
  inbox: 'Opportunity inbox workspace',
  opportunity: 'Opportunity workspace',
  followups: 'Follow-ups workspace',
  calendar: 'Opportunity calendar workspace',
  capture: 'Quick capture workspace',
};

function InboxView({
  objects,
  onOpenOpportunity,
}: {
  objects: SimplifiObject[];
  onOpenOpportunity: (id: string) => void;
}) {
  if (objects.length === 0) {
    return (
      <div className="orb-session-empty">
        <h2>Inbox is clear</h2>
        <p>Capture a link, note, or screenshot — Simplifi will score it and put it here.</p>
        <Link className="orb-session-primary" href="/simplifi/capture">
          Quick capture
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="orb-session-title">
        <h2>Inbox</h2>
        <span>{objects.length}</span>
      </div>
      <ul className="orb-session-list">
        {objects.map((obj) => (
          <li key={obj.id}>
            <button type="button" className="orb-session-row" onClick={() => onOpenOpportunity(obj.id)}>
              <span className="orb-session-row-head">
                <span className={`orb-session-priority orb-session-priority-${obj.priority.toLowerCase()}`}>
                  {obj.priority}
                </span>
                {obj.priorityLevel && obj.priorityLevel !== 'low' ? (
                  <span className="orb-session-dyn">{priorityLevelLabel(obj.priorityLevel)}</span>
                ) : null}
              </span>
              <strong>{obj.title}</strong>
              <span className="orb-session-meta">
                {obj.type}
                {obj.opportunityScore != null ? ` · ${obj.opportunityScore}/100` : ''}
                {obj.dueDate ? ` · due ${obj.dueDate}` : ''}
              </span>
              <span className="orb-session-next">Next: {obj.nextAction}</span>
            </button>
          </li>
        ))}
      </ul>
      <div className="orb-session-foot">
        <Link href="/simplifi/inbox">Open full inbox</Link>
      </div>
    </>
  );
}

function OpportunityView({
  opportunity,
  loggedIn,
}: {
  opportunity: SimplifiObject;
  loggedIn: boolean;
}) {
  return (
    <>
      <div className="orb-session-title">
        <h2>{opportunity.title}</h2>
      </div>
      <p className="orb-session-meta">
        {opportunity.type}
        {opportunity.opportunityScore != null ? ` · ${opportunity.opportunityScore}/100` : ''}
        {opportunity.dueDate ? ` · due ${opportunity.dueDate}` : ''}
      </p>

      <dl className="orb-session-guidance">
        <dt>Why this matters</dt>
        <dd>{opportunity.whyThisMatters}</dd>
        <dt>What most people do</dt>
        <dd>{opportunity.whatMostPeopleDo}</dd>
        <dt>What we recommend</dt>
        <dd>{opportunity.whatWeRecommend}</dd>
      </dl>

      <p className="orb-session-next orb-session-next-lg">Next: {opportunity.nextAction}</p>

      {loggedIn ? (
        <OpportunityActions
          recordId={opportunity.id}
          dueDate={opportunity.dueDate}
          outcomeStatus={opportunity.outcomeStatus}
        />
      ) : null}

      <div className="orb-session-foot">
        <Link href={`/simplifi/opportunity/${opportunity.id}`}>Open full profile</Link>
      </div>
    </>
  );
}

function SignInPrompt({ next, message }: { next: string; message: string }) {
  return (
    <div className="orb-session-empty">
      <p>{message}</p>
      <Link className="orb-session-primary" href={`/simplifi/login?next=${encodeURIComponent(next)}`}>
        Sign in
      </Link>
    </div>
  );
}

function FollowUpsView({
  objects,
  loggedIn,
  onOpenOpportunity,
}: {
  objects: SimplifiObject[];
  loggedIn: boolean;
  onOpenOpportunity: (id: string) => void;
}) {
  if (!loggedIn) {
    return (
      <SignInPrompt
        next="/simplifi/follow-ups"
        message="Sign in to see dated next actions and expiration alerts."
      />
    );
  }

  const alerts = buildExpirationAlerts(objects);
  const dated = objects
    .filter((o) => o.dueDate)
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));

  return (
    <>
      <div className="orb-session-title">
        <h2>Follow-ups</h2>
      </div>

      {alerts.length > 0 ? (
        <section className="orb-session-group">
          <h3>Needs attention <span>{alerts.length}</span></h3>
          <ul className="orb-session-list">
            {alerts.map((alert) => (
              <li key={alert.objectId}>
                <button
                  type="button"
                  className="orb-session-row"
                  onClick={() => onOpenOpportunity(alert.objectId)}
                >
                  <strong>{alert.title}</strong>
                  <span className="orb-session-meta">{alert.detail}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="orb-session-group">
        <h3>Dated commitments <span>{dated.length}</span></h3>
        {dated.length === 0 ? (
          <p className="orb-session-meta">No due dates yet. Snooze from the Orb or set one on a profile.</p>
        ) : (
          <ul className="orb-session-list">
            {dated.map((obj) => (
              <li key={obj.id}>
                <button type="button" className="orb-session-row" onClick={() => onOpenOpportunity(obj.id)}>
                  <strong>{obj.title}</strong>
                  <span className="orb-session-meta">{obj.nextAction}</span>
                  <span className="orb-session-due">{obj.dueDate}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="orb-session-foot">
        <Link href="/simplifi/follow-ups">Open full follow-ups</Link>
      </div>
    </>
  );
}

function monthKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 7) || 'Undated';
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function CalendarView({
  objects,
  loggedIn,
  onOpenOpportunity,
}: {
  objects: SimplifiObject[];
  loggedIn: boolean;
  onOpenOpportunity: (id: string) => void;
}) {
  if (!loggedIn) {
    return (
      <SignInPrompt
        next="/simplifi/calendar"
        message="Sign in to see opportunity due dates and commitments."
      />
    );
  }

  const dated = objects.filter((o) => o.dueDate);
  const byMonth = new Map<string, SimplifiObject[]>();
  for (const obj of dated) {
    const key = monthKey(obj.dueDate!);
    const list = byMonth.get(key) ?? [];
    list.push(obj);
    byMonth.set(key, list);
  }
  const months = [...byMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

  return (
    <>
      <div className="orb-session-title">
        <h2>Opportunity calendar</h2>
      </div>

      {months.length === 0 ? (
        <p className="orb-session-meta">No dated opportunities. Set a follow-up date from a profile.</p>
      ) : (
        months.map(([month, items]) => (
          <section key={month} className="orb-session-group">
            <h3>{month} <span>{items.length}</span></h3>
            <ul className="orb-session-list">
              {[...items]
                .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)))
                .map((obj) => (
                  <li key={obj.id}>
                    <button
                      type="button"
                      className="orb-session-row"
                      onClick={() => onOpenOpportunity(obj.id)}
                    >
                      <strong>{obj.title}</strong>
                      <span className="orb-session-meta">{obj.nextAction}</span>
                      <span className="orb-session-due">{obj.dueDate}</span>
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        ))
      )}

      <div className="orb-session-foot">
        <Link href="/simplifi/calendar">Open full calendar</Link>
      </div>
    </>
  );
}

function CaptureView({ initialDraft }: { initialDraft?: string }) {
  const [draft, setDraft] = useState(initialDraft ?? '');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const runCapture = async (text: string) => {
    setSaving(true);
    setStatus('Capturing…');
    try {
      const looksLikeUrl = /^https?:\/\//i.test(text.trim());
      if (looksLikeUrl) {
        const data = await analyzeCaptureUrl({ url: text.trim() });
        const record = data.record as { title?: string } | undefined;
        setStatus(data.ok ? (record?.title ? `Captured: ${record.title}` : 'Captured.') : data.error ?? 'Could not capture.');
        return;
      }
      const res = await fetch('/api/portal/captures/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: text, title: text.slice(0, 80) }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; record?: { title?: string } };
      if (!res.ok || !data.ok) {
        setStatus(data.error ?? 'Could not capture.');
        return;
      }
      setStatus(data.record?.title ? `Captured: ${data.record.title}` : 'Captured.');
      setDraft('');
    } catch {
      setStatus('Capture could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="orb-session-title">
        <h2>Quick capture</h2>
      </div>
      <textarea
        className="orb-session-textarea"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Link, note, or idea…"
        rows={4}
        aria-label="Capture text"
      />
      <div className="orb-session-row-actions">
        <button
          type="button"
          className="orb-session-primary"
          disabled={!draft.trim() || saving}
          onClick={() => void runCapture(draft)}
        >
          Capture now
        </button>
        <Link href="/simplifi/capture">More sources</Link>
      </div>
      {status ? <p className="orb-session-status">{status}</p> : null}
    </>
  );
}
