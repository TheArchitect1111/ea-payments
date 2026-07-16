'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import { priorityLevelLabel } from '@/lib/priority-engine';
import OpportunityActions from '@/app/simplifi/opportunity/[id]/OpportunityActions';
import './session-workspace.css';

export type SessionView =
  | { kind: 'inbox' }
  | { kind: 'opportunity'; id: string };

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
        aria-label={view.kind === 'inbox' ? 'Opportunity inbox workspace' : 'Opportunity workspace'}
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
