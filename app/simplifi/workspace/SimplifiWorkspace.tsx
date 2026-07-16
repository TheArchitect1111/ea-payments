'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import type { MemoryAsset } from '@/lib/memory-assets';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { RelationshipCluster } from '@/lib/relationship-hints';
import { priorityLevelLabel } from '@/lib/priority-engine';
import {
  archiveCapture,
  fetchCaptureIntelligence,
  recordCaptureOutcome,
  snoozeCapture,
} from '@/lib/simplifi-client';
import { searchOpportunities } from '@/lib/simplifi-ask';
import { buildBriefAmbientLead } from '@/lib/orb';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';
import ActionCenterPanel from './ActionCenterPanel';
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

const AVATAR_PALETTE = ['#1B2B4D', '#3B82F6', '#C9A844', '#7C3AED', '#0F766E', '#B45309'];

function initialsFromTitle(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function avatarColor(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i += 1) hash = (hash + title.charCodeAt(i) * (i + 1)) % 997;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

function formatBriefDate(date = new Date()): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

function relativeUpdatedLabel(iso: string): string {
  const captured = new Date(iso);
  if (Number.isNaN(captured.getTime())) return 'Updated recently';
  const diffMs = Date.now() - captured.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 60) return `Updated ${Math.max(1, mins)}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Updated yesterday';
  if (days < 7) return `Updated ${days}d ago`;
  return `Updated ${captured.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
}

function briefKindIcon(kind: BriefPayload['items'][number]['kind']): string {
  switch (kind) {
    case 'momentum':
      return '★';
    case 'deadline':
    case 'due-soon':
    case 'overdue':
      return '◷';
    case 'stale':
      return '◎';
    default:
      return '◆';
  }
}

export default function SimplifiWorkspace({
  slug: _slug,
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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const filteredObjects = useMemo(
    () => (searchQuery.trim() ? searchOpportunities(searchQuery, localObjects) : localObjects),
    [localObjects, searchQuery],
  );

  const todayBriefItems = brief.items.slice(0, 4);
  const recentObjects = localObjects.slice(0, 5);
  const ambientLead = buildBriefAmbientLead({ brief, actionCenter });
  const todayLabel = useMemo(() => formatBriefDate(), []);

  const toggleExpand = (obj: SimplifiObject) => {
    setExpandedId((prev) => (prev === obj.id ? null : obj.id));
    setSelected(obj);
  };

  const archiveObject = async (recordId: string) => {
    setActionNote('');
    const data = await archiveCapture(recordId);
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
    const data = await recordCaptureOutcome(recordId, outcome);
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
    const data = await snoozeCapture(recordId, 30);
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
      const data = await fetchCaptureIntelligence(recordId);
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
    <main className="sw-main sw-main--home">
      <section className="sw-home" aria-label="Simplifi brief">
        <header className="sw-home-hero">
          <div className="sw-home-hero-glow" aria-hidden="true" />
          <div className="sw-home-hero-copy">
            <p className="sw-home-greeting">{brief.greeting.replace(/\.$/, '')}</p>
            <p className="sw-home-date">{todayLabel}</p>
            <h1 className="sw-home-title">What deserves your attention?</h1>
            <p className="sw-ambient-lead">{ambientLead}</p>
          </div>
        </header>

        <section className="sw-today-brief" aria-label="Today's Brief">
          <div className="sw-today-brief-head">
            <h2>Today&apos;s Brief</h2>
            {todayBriefItems.length > 0 ? (
              <Link href="/simplifi/follow-ups" className="sw-today-view-all">
                View all
              </Link>
            ) : null}
          </div>

          {todayBriefItems.length === 0 ? (
            <div className="sw-today-empty">
              <p>{ambientLead}</p>
              <Link href="/simplifi/capture" className="sw-today-capture">
                Capture something
              </Link>
            </div>
          ) : (
            <ul className="sw-today-list">
              {todayBriefItems.map((item) => (
                <li key={item.id}>
                  <span className={`sw-today-icon sw-today-icon--${item.kind}`} aria-hidden="true">
                    {briefKindIcon(item.kind)}
                  </span>
                  <div className="sw-today-copy">
                    {item.href ? (
                      <Link href={item.href}>
                        <strong>{item.title}</strong>
                      </Link>
                    ) : (
                      <strong>{item.title}</strong>
                    )}
                    <p>{item.detail}</p>
                  </div>
                  {loggedIn && item.id.startsWith('x-') && (item.kind === 'stale' || item.kind === 'overdue') ? (
                    <button type="button" className="sw-link-btn" onClick={() => snoozeItem(item.id)}>
                      Snooze
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="sw-recent-opps" aria-label="Recent opportunities">
          <div className="sw-recent-head">
            <h2>Recent Opportunities</h2>
            <Link href="/simplifi/inbox" className="sw-today-view-all">
              View all
            </Link>
          </div>

          {recentObjects.length === 0 ? (
            <EmptyStateGuide
              title="Nothing captured yet"
              explanation="Paste a URL, upload a file, or jot a note — Simplifi will score the opportunity and surface your next move."
              actionLabel="Quick capture"
              actionHref="/simplifi/capture"
            />
          ) : (
            <ul className="sw-recent-list">
              {recentObjects.map((obj) => (
                <li key={obj.id}>
                  <Link href={`/simplifi/opportunity/${obj.id}`} className="sw-recent-row">
                    <span
                      className="sw-recent-avatar"
                      style={{ backgroundColor: avatarColor(obj.title) }}
                      aria-hidden="true"
                    >
                      {initialsFromTitle(obj.title)}
                    </span>
                    <span className="sw-recent-copy">
                      <strong>{obj.title}</strong>
                      <span>
                        {obj.nextAction}
                        {' · '}
                        {relativeUpdatedLabel(obj.dateCaptured)}
                      </span>
                    </span>
                    <span className="sw-recent-chevron" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {(searchOpen || searchQuery.trim()) && (
          <label className="sw-search sw-search--home">
            <span>Search Simplifi</span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search opportunities, people, notes..."
              aria-label="Search opportunities"
              autoFocus={searchOpen}
            />
          </label>
        )}

        {searchQuery.trim() ? (
          <section className="sw-brief-panel" aria-label="Search results">
            <div className="sw-panel-heading">
              <h2>Search results</h2>
              <span>{filteredObjects.length}</span>
            </div>
            {filteredObjects.length === 0 ? (
              <p className="sw-muted">No matches. Try another name, topic, or next action.</p>
            ) : (
              <ul className="sw-event-list">
                {filteredObjects.slice(0, 12).map((obj) => (
                  <li key={obj.id}>
                    <div>
                      <strong>
                        <Link href={`/simplifi/opportunity/${obj.id}`}>{obj.title}</Link>
                      </strong>
                      <p>{obj.nextAction}</p>
                    </div>
                    <span>{obj.priority}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        ) : null}
      </section>

      <nav className="sw-mobile-dock" aria-label="Simplifi mobile">
        <Link href="/simplifi/workspace" className="sw-dock-item sw-dock-item--active" aria-current="page">
          <span aria-hidden="true">⌂</span>
          Home
        </Link>
        <Link href="/simplifi/capture" className="sw-dock-item">
          <span aria-hidden="true">＋</span>
          Capture
        </Link>
        <button
          type="button"
          className={`sw-dock-item${searchOpen ? ' sw-dock-item--active' : ''}`}
          onClick={() => setSearchOpen((open) => !open)}
        >
          <span aria-hidden="true">⌕</span>
          Search
        </button>
        <Link href="/simplifi/calendar" className="sw-dock-item">
          <span aria-hidden="true">▦</span>
          Calendar
        </Link>
        <Link href="/simplifi/settings" className="sw-dock-item">
          <span aria-hidden="true">☰</span>
          More
        </Link>
      </nav>

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
                  {asset.savePurpose && <span className="sw-memory-tag">{asset.savePurpose}</span>}
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

      <section className="sw-inbox sw-inbox--secondary" id="inbox">
        <div className="sw-inbox-header">
          <h2>Inbox detail</h2>
          <Link href="/simplifi/inbox" className="sw-link">
            Open full inbox
          </Link>
        </div>
        {actionNote && <p className="sw-action-note">{actionNote}</p>}

        {localObjects.length === 0 ? (
          <p className="sw-muted">Capture to build your opportunity list.</p>
        ) : (
          <ul className="sw-inbox-list">
            {localObjects.slice(0, 5).map((obj) => {
              const open = expandedId === obj.id;
              return (
                <li key={obj.id} className={`sw-card ${open ? 'sw-card-open' : ''}`}>
                  <button type="button" className="sw-card-head" onClick={() => toggleExpand(obj)}>
                    <div>
                      <span className={`sw-priority sw-priority-${obj.priority.toLowerCase()}`}>{obj.priority}</span>
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
                        <div className="sw-recommend">
                          <h4>What we recommend</h4>
                          <p>{obj.whatWeRecommend}</p>
                          <p className="sw-next-action">
                            Next: <strong>{obj.nextAction}</strong>
                          </p>
                        </div>
                      </div>
                      {intelligenceNote && open && <p className="sw-intelligence-note">{intelligenceNote}</p>}
                      <div className="sw-card-actions">
                        <Link href={`/simplifi/opportunity/${obj.id}`} className="sw-btn sw-btn-small">
                          Opportunity profile
                        </Link>
                        {obj.considerUrl && (
                          <Link href={obj.considerUrl} className="sw-btn sw-btn-small sw-btn-ghost">
                            Magnifi
                          </Link>
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
                              onClick={() => archiveObject(obj.id)}
                            >
                              Archive
                            </button>
                          </>
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
