'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { MemoryAsset } from '@/lib/memory-assets';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';

interface BriefPayload {
  greeting: string;
  items: {
    id: string;
    title: string;
    detail: string;
    href?: string;
    kind: 'momentum' | 'deadline' | 'explore' | 'overdue' | 'stale' | 'due-soon';
  }[];
  recommendedNext: { label: string; href: string } | null;
  completed?: SimplifiObject[];
}

export default function SimplifiWorkspace({
  slug,
  loggedIn,
  objects,
  brief,
  memoryLibrary,
}: {
  slug: string | null;
  loggedIn: boolean;
  objects: SimplifiObject[];
  brief: BriefPayload;
  memoryLibrary: MemoryAsset[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SimplifiObject | null>(objects[0] ?? null);
  const [localObjects, setLocalObjects] = useState(objects);
  const [actionNote, setActionNote] = useState('');

  const toggleExpand = (obj: SimplifiObject) => {
    setExpandedId((prev) => (prev === obj.id ? null : obj.id));
    setSelected(obj);
  };

  const archiveObject = async (recordId: string) => {
    setActionNote('');
    const res = await fetch('/api/portal/opportunities/manage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'archive', recordId }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };
    if (!data.ok) {
      setActionNote(data.error ?? 'Could not archive.');
      return;
    }
    setLocalObjects((prev) => prev.filter((o) => o.id !== recordId));
    setExpandedId(null);
    setActionNote('Archived.');
  };

  const recordOutcome = async (recordId: string, outcome: 'won' | 'lost' | 'passed' | 'in_progress') => {
    setActionNote('');
    const res = await fetch('/api/portal/captures/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, outcome }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; outcomeStatus?: string };
    if (!data.ok) {
      setActionNote(data.error ?? 'Could not record outcome.');
      return;
    }
    if (outcome === 'won' || outcome === 'lost' || outcome === 'passed') {
      setLocalObjects((prev) => prev.filter((o) => o.id !== recordId));
      setExpandedId(null);
    }
    setActionNote(`Outcome: ${data.outcomeStatus ?? outcome}`);
  };

  const snoozeItem = async (briefItemId: string) => {
    const recordId = briefItemId.replace(/^x-/, '');
    if (!recordId) return;
    setActionNote('');
    const res = await fetch('/api/portal/captures/outcome', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recordId, action: 'snooze', days: 30 }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; dueDate?: string };
    if (!data.ok) {
      setActionNote(data.error ?? 'Could not snooze.');
      return;
    }
    setActionNote(`Snoozed until ${data.dueDate ?? 'later'}.`);
  };

  return (
    <main className="sw-main">
      <section className="sw-hero">
        <p className="sw-eyebrow">Intelligence OS</p>
        <h1>What&apos;s worth exploring today?</h1>
        <p className="sw-lead">
          Capture first. Simplifi clarifies what matters, what most people do, and what we recommend
          — so momentum doesn&apos;t slip away.
        </p>
        <div className="sw-hero-actions">
          <Link href="/simplifi/capture" className="sw-btn sw-btn-primary">
            Capture now
          </Link>
          {brief.recommendedNext && (
            <Link href={brief.recommendedNext.href} className="sw-btn sw-btn-ghost">
              {brief.recommendedNext.label}
            </Link>
          )}
        </div>
      </section>

      <section className="sw-brief">
        <div className="sw-brief-header">
          <h2>Daily Brief</h2>
          <span className="sw-brief-greeting">{brief.greeting}</span>
        </div>
        {brief.items.length === 0 ? (
          <p className="sw-muted">
            {loggedIn
              ? 'Your inbox is clear. Capture something that caught your attention.'
              : 'Sign in to see your personalized brief, or capture without an account.'}
          </p>
        ) : (
          <ul className="sw-brief-list">
            {brief.items.map((item) => (
              <li key={item.id} className={`sw-brief-item sw-brief-${item.kind}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                <div className="sw-brief-actions">
                  {item.href && (
                    <Link href={item.href} className="sw-link">
                      Open
                    </Link>
                  )}
                  {loggedIn && item.id.startsWith('x-') && (item.kind === 'stale' || item.kind === 'overdue') && (
                    <button type="button" className="sw-link-btn" onClick={() => snoozeItem(item.id)}>
                      Snooze 30d
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {brief.completed && brief.completed.length > 0 && (
        <section className="sw-completed">
          <h2>Recently Completed</h2>
          <ul className="sw-completed-list">
            {brief.completed.map((o) => (
              <li key={o.id}>
                <strong>{o.title}</strong>
                <span>{o.outcomeStatus}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memoryLibrary.length > 0 && (
        <section className="sw-memory">
          <div className="sw-inbox-header">
            <h2>Memory Library</h2>
            <span className="sw-count">{memoryLibrary.length} assets</span>
          </div>
          <p className="sw-muted">Reusable captures — adapt, don&apos;t re-capture from scratch.</p>
          <ul className="sw-memory-list">
            {memoryLibrary.slice(0, 6).map((asset) => (
              <li key={asset.id} className="sw-memory-item">
                <div>
                  <strong>{asset.title}</strong>
                  <p>{asset.reuseHint.slice(0, 100)}</p>
                  {asset.savePurpose && (
                    <span className="sw-memory-tag">{asset.savePurpose}</span>
                  )}
                </div>
                {asset.href && (
                  <Link href={asset.href} className="sw-link">
                    Reuse
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="sw-inbox">
        <div className="sw-inbox-header">
          <h2>Inbox</h2>
          <span className="sw-count">{localObjects.length} active</span>
        </div>
        {actionNote && <p className="sw-action-note">{actionNote}</p>}

        {localObjects.length === 0 ? (
          <EmptyStateGuide
            title="Nothing in your inbox yet"
            explanation="Paste a URL, upload a file, or jot a note — Simplifi will score the opportunity and surface your next move."
            actionLabel="First capture"
            actionHref="/simplifi/capture"
          />
        ) : (
          <ul className="sw-inbox-list">
            {localObjects.map((obj) => {
              const open = expandedId === obj.id;
              return (
                <li key={obj.id} className={`sw-card ${open ? 'sw-card-open' : ''}`}>
                  <button
                    type="button"
                    className="sw-card-head"
                    onClick={() => toggleExpand(obj)}
                  >
                    <div>
                      <span className={`sw-priority sw-priority-${obj.priority.toLowerCase()}`}>
                        {obj.priority}
                      </span>
                      <h3>{obj.title}</h3>
                      <p className="sw-card-meta">
                        {obj.type}
                        {obj.savePurpose ? ` · ${obj.savePurpose}` : ''}
                        {obj.opportunityScore != null ? ` · ${obj.opportunityScore}/100` : ''}
                        {obj.dueDate ? ` · due ${obj.dueDate}` : ''}
                      </p>
                    </div>
                    <span className="sw-chevron">{open ? '−' : '+'}</span>
                  </button>

                  {open && (
                    <div className="sw-card-body">
                      <div className="sw-guidance">
                        <div>
                          <h4>Why this matters</h4>
                          <p>{obj.whyThisMatters}</p>
                        </div>
                        <div>
                          <h4>What most people do</h4>
                          <p>{obj.whatMostPeopleDo}</p>
                        </div>
                        <div className="sw-recommend">
                          <h4>What we recommend</h4>
                          <p>{obj.whatWeRecommend}</p>
                          <p className="sw-next-action">
                            Next: <strong>{obj.nextAction}</strong>
                          </p>
                        </div>
                      </div>
                      <div className="sw-card-actions">
                        {obj.considerUrl && (
                          <Link href={obj.considerUrl} className="sw-btn sw-btn-small">
                            Magnifi
                          </Link>
                        )}
                        {obj.shareUrl && (
                          <a href={obj.shareUrl} className="sw-btn sw-btn-small sw-btn-ghost">
                            Share
                          </a>
                        )}
                        {loggedIn && (
                          <>
                            <button
                              type="button"
                              className="sw-btn sw-btn-small"
                              onClick={() => recordOutcome(obj.id, 'won')}
                            >
                              Won
                            </button>
                            <button
                              type="button"
                              className="sw-btn sw-btn-small sw-btn-ghost"
                              onClick={() => recordOutcome(obj.id, 'in_progress')}
                            >
                              In progress
                            </button>
                            <button
                              type="button"
                              className="sw-btn sw-btn-small sw-btn-ghost"
                              onClick={() => recordOutcome(obj.id, 'passed')}
                            >
                              Pass
                            </button>
                            <button
                              type="button"
                              className="sw-btn sw-btn-small sw-btn-ghost"
                              onClick={() => archiveObject(obj.id)}
                            >
                              Archive
                            </button>
                          </>
                        )}
                        {slug && (
                          <Link
                            href={`/portal/${slug}/simplifi`}
                            className="sw-btn sw-btn-small sw-btn-ghost"
                          >
                            Portal workspace
                          </Link>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected && expandedId === selected.id && (
        <aside className="sw-aside" aria-label="Selected capture">
          <p className="sw-aside-label">Focused</p>
          <h3>{selected.title}</h3>
          <p>{selected.nextAction}</p>
        </aside>
      )}
    </main>
  );
}
