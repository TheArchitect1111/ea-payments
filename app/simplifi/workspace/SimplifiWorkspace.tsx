'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { MemoryAsset } from '@/lib/memory-assets';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { RelationshipCluster } from '@/lib/relationship-hints';
import { priorityLevelLabel } from '@/lib/priority-engine';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import ActionCenterPanel from './ActionCenterPanel';
import CompanionOrb from './CompanionOrb';
import './action-center-panel.css';

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
  actionCenter,
  relationships,
}: {
  slug: string | null;
  loggedIn: boolean;
  objects: SimplifiObject[];
  brief: BriefPayload;
  memoryLibrary: MemoryAsset[];
  actionCenter: ActionCenterPayload;
  relationships: RelationshipCluster[];
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SimplifiObject | null>(objects[0] ?? null);
  const [localObjects, setLocalObjects] = useState(objects);
  const [actionNote, setActionNote] = useState('');
  const [intelligenceNote, setIntelligenceNote] = useState('');
  const [intelligenceLoading, setIntelligenceLoading] = useState(false);
  const topObject = localObjects[0] ?? null;
  const topBriefItem = brief.items[0] ?? null;
  const recommendedItems = brief.items.slice(0, 3);
  const recentObjects = localObjects.slice(0, 5);
  const todayActivity = brief.items.length > 0
    ? brief.items.slice(0, 4)
    : recentObjects.map((obj) => ({
        id: `recent-${obj.id}`,
        title: obj.title,
        detail: obj.nextAction,
        href: obj.considerUrl ?? obj.shareUrl,
        kind: 'explore' as const,
      }));
  const quickActions = [
    { label: 'Capture', href: '/simplifi/capture' },
    { label: 'Review Inbox', href: '#inbox' },
    ...(slug
      ? [{ label: 'Portal', href: `/portal/${slug}` }]
      : [{ label: 'Sign In', href: '/simplifi/login?next=/simplifi/workspace' }]),
  ];

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

  const loadIntelligence = async (recordId: string) => {
    setIntelligenceLoading(true);
    setIntelligenceNote('');
    try {
      const res = await fetch(`/api/portal/captures/${recordId}/intelligence`);
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        intelligence?: {
          decision: { recommendedPath: string; confidenceScore: number };
          build: { buildPath: string; overlayConfidence: { overall: string } };
        };
      };
      if (!data.ok || !data.intelligence) {
        setIntelligenceNote(data.error ?? 'Blueprint not ready — capture again for intelligence.');
        return;
      }
      const { decision, build } = data.intelligence;
      setIntelligenceNote(
        `Path: ${decision.recommendedPath} (${decision.confidenceScore}/100) · ${build.buildPath} · Overlay ${build.overlayConfidence.overall}`,
      );
    } catch {
      setIntelligenceNote('Could not load Build Intelligence.');
    } finally {
      setIntelligenceLoading(false);
    }
  };

  return (
    <main className="sw-main">
      <section className="sw-brief-shell" aria-label="Simplifi brief">
        <div className="sw-brief-intro">
          <p>{brief.greeting.replace(/\.$/, '')}</p>
          <h1>What should I pay attention to right now?</h1>
        </div>

        <label className="sw-search">
          <span>Search Simplifi</span>
          <input placeholder="Search opportunities, people, notes, resources..." />
        </label>

        <section className="sw-priority-card" aria-label="Top priority">
          <p className="sw-section-label">Top Priority</p>
          {topObject ? (
            <>
              <div className="sw-priority-main">
                <div>
                  <h2>{topObject.title}</h2>
                  <p>{topBriefItem?.detail ?? topObject.whyThisMatters}</p>
                </div>
                <span>{topObject.opportunityScore != null ? `${topObject.opportunityScore}/100` : topObject.priority}</span>
              </div>
              <div className="sw-card-footer">
                <strong>{topObject.nextAction}</strong>
                <button type="button" className="sw-icon-action" onClick={() => toggleExpand(topObject)}>
                  Review
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="sw-priority-main">
                <div>
                  <h2>Capture the first opportunity</h2>
                  <p>
                    {loggedIn
                      ? 'Your brief is clear. Add something worth exploring and Simplifi will prioritize the next move.'
                      : 'Sign in to see your personalized brief, or capture without an account.'}
                  </p>
                </div>
                <span>Start</span>
              </div>
              <div className="sw-card-footer">
                <strong>Capture something worth exploring</strong>
                <Link href="/simplifi/capture" className="sw-icon-action">
                  Capture
                </Link>
              </div>
            </>
          )}
        </section>

        <section className="sw-brief-grid">
          <div className="sw-brief-panel">
            <div className="sw-panel-heading">
              <h2>Today&apos;s Activity</h2>
              <span>{todayActivity.length}</span>
            </div>
            <ol className="sw-timeline">
              {todayActivity.map((item) => (
                <li key={item.id}>
                  <span aria-hidden="true" />
                  <div>
                    <strong>{item.title}</strong>
                    <p>{item.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="sw-brief-panel">
            <div className="sw-panel-heading">
              <h2>Recommended Actions</h2>
              <span>{recommendedItems.length}</span>
            </div>
            <div className="sw-action-stack">
              {recommendedItems.length === 0 ? (
                <p className="sw-muted">No action is urgent right now.</p>
              ) : (
                recommendedItems.map((item) => (
                  <div key={item.id} className={`sw-action-card sw-brief-${item.kind}`}>
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
                          Snooze
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="sw-brief-panel">
          <div className="sw-panel-heading">
            <h2>Recent Events</h2>
            <span>{recentObjects.length}</span>
          </div>
          {recentObjects.length === 0 ? (
            <p className="sw-muted">Recent captures will appear here.</p>
          ) : (
            <ul className="sw-event-list">
              {recentObjects.map((obj) => (
                <li key={obj.id}>
                  <div>
                    <strong>{obj.title}</strong>
                    <p>{obj.type}{obj.dateCaptured ? ` - ${obj.dateCaptured}` : ''}</p>
                  </div>
                  <span>{obj.priority}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sw-quick-actions" aria-label="Quick actions">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              {action.label}
            </Link>
          ))}
        </section>
      </section>

      <ActionCenterPanel center={actionCenter} />

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

      {relationships.length > 0 && (
        <section className="sw-relationships">
          <h2>Connected patterns</h2>
          <ul className="sw-rel-list">
            {relationships.map((cluster) => (
              <li key={cluster.id} className="sw-rel-item">
                <strong>{cluster.label}</strong>
                <p>{cluster.hint}</p>
                <span className="sw-rel-count">{cluster.objectIds.length} linked</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {memoryLibrary.length > 0 && (
        <section className="sw-memory">
          <div className="sw-inbox-header">
            <h2>Saved for later</h2>
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

      <section className="sw-inbox" id="inbox">
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
                      {obj.priorityLevel && obj.priorityLevel !== 'low' && (
                        <span className={`sw-dyn-priority sw-dyn-${obj.priorityLevel}`}>
                          {priorityLevelLabel(obj.priorityLevel)}
                        </span>
                      )}
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
                      {intelligenceNote && open && (
                        <p className="sw-intelligence-note">{intelligenceNote}</p>
                      )}
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
                              className="sw-btn sw-btn-small sw-btn-ghost"
                              disabled={intelligenceLoading}
                              onClick={() => loadIntelligence(obj.id)}
                            >
                              {intelligenceLoading ? 'Loading…' : 'Build Intelligence'}
                            </button>
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

      <CompanionOrb
        slug={slug}
        loggedIn={loggedIn}
        brief={brief}
        objects={localObjects}
        actionCenter={actionCenter}
      />
    </main>
  );
}
