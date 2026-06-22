'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { SimplifiObject } from '@/lib/simplifi-objects';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';

interface BriefPayload {
  greeting: string;
  items: {
    id: string;
    title: string;
    detail: string;
    href?: string;
    kind: 'momentum' | 'deadline' | 'explore';
  }[];
  recommendedNext: { label: string; href: string } | null;
}

export default function SimplifiWorkspace({
  slug,
  loggedIn,
  objects,
  brief,
}: {
  slug: string | null;
  loggedIn: boolean;
  objects: SimplifiObject[];
  brief: BriefPayload;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<SimplifiObject | null>(
    objects[0] ?? null,
  );

  const toggleExpand = (obj: SimplifiObject) => {
    setExpandedId((prev) => (prev === obj.id ? null : obj.id));
    setSelected(obj);
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
                {item.href && (
                  <Link href={item.href} className="sw-link">
                    Open
                  </Link>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="sw-inbox">
        <div className="sw-inbox-header">
          <h2>Inbox</h2>
          <span className="sw-count">{objects.length} active</span>
        </div>

        {objects.length === 0 ? (
          <EmptyStateGuide
            title="Nothing in your inbox yet"
            explanation="Paste a URL, upload a file, or jot a note — Simplifi will score the opportunity and surface your next move."
            actionLabel="First capture"
            actionHref="/simplifi/capture"
          />
        ) : (
          <ul className="sw-inbox-list">
            {objects.map((obj) => {
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
