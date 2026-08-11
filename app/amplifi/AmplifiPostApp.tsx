'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import StoryDraftPanel from '@/app/components/StoryDraftPanel';
import '@/app/components/story-draft-panel.css';
import { buildAmplifiSocialDraft } from '@/lib/amplifi-draft';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import { openSocialShare } from '@/lib/amplifi-social-share';
import {
  absoluteAmplifiShareUrl,
  MAGNIFI_PUBLIC_LINK_WARNING,
  preferPortalMagnifiUrl,
} from '@/lib/amplifi-share-policy';
import { DEMO_CONSIDER_SLUG } from '@/lib/demo-consider-selena';
import { PUBLIC_LINKS } from '@/lib/marketing-urls';

const DEMO_STORY_URL = `${PUBLIC_LINKS.platform.replace(/\/$/, '')}/consider/${DEMO_CONSIDER_SLUG}`;

type CaptureOption = {
  id: string;
  title: string;
  shareUrl?: string;
  businessName?: string;
  magnifiUrl?: string;
};

type ResearchSource = {
  title: string;
  url: string;
  snippet: string;
  kind: string;
  publishedAt?: string | null;
  withinRange?: boolean;
};

type ResearchMeta = {
  topic: string;
  dateFrom: string;
  dateTo: string;
  researchedAt: string;
  sources: ResearchSource[];
  warnings: string[];
};

function defaultDateRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setUTCDate(from.getUTCDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

function NavIcon({ children }: { children: string }) {
  return <span className="af-nav-icon" aria-hidden="true">{children}</span>;
}

export default function AmplifiPostApp({
  loggedIn,
  slug,
  captureId,
  initialUrl,
  initialTitle,
}: {
  loggedIn: boolean;
  slug: string | null;
  captureId?: string;
  initialUrl?: string;
  initialTitle?: string;
}) {
  const defaults = useMemo(() => defaultDateRange(), []);
  const [businessName, setBusinessName] = useState(initialTitle ?? '');
  const [storyUrl, setStoryUrl] = useState(initialUrl ?? '');
  const [headline, setHeadline] = useState('');
  const [quickWin, setQuickWin] = useState('');
  const [draft, setDraft] = useState<AmplifiSocialDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [researching, setResearching] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [captures, setCaptures] = useState<CaptureOption[]>([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(captureId ?? '');
  const [showAmplifiSearch, setShowAmplifiSearch] = useState(false);
  const [topic, setTopic] = useState('');
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | null>(null);

  const generateDraft = useCallback(
    (input?: { businessName: string; storyUrl: string; headline?: string; quickWin?: string }) => {
      const name = (input?.businessName ?? businessName).trim();
      const url = (input?.storyUrl ?? storyUrl).trim();
      if (!name || !url) {
        setMessage('Add a title and story link first.');
        setDraft(null);
        return;
      }
      setMessage('');
      setResearchMeta(null);
      setDraft(
        buildAmplifiSocialDraft({
          businessName: name,
          considerUrl: url,
          headline: input?.headline ?? headline,
          quickWin: input?.quickWin ?? quickWin,
        }),
      );
    },
    [businessName, storyUrl, headline, quickWin],
  );

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/portal/captures')
      .then((res) => res.json())
      .then((data: { ok?: boolean; captures?: CaptureOption[] }) => {
        if (data.ok && data.captures) setCaptures(data.captures);
      })
      .catch(() => {});
  }, [loggedIn]);

  useEffect(() => {
    if (!captureId || !loggedIn) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/portal/captures/${encodeURIComponent(captureId)}/story`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; draft?: AmplifiSocialDraft; error?: string }) => {
        if (cancelled || !data.ok || !data.draft) {
          if (!cancelled && data.error) setMessage(data.error);
          return;
        }
        setDraft(data.draft);
        if (!businessName) setBusinessName('Your capture');
        if (!storyUrl && initialUrl) setStoryUrl(initialUrl);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [captureId, loggedIn, businessName, initialUrl, storyUrl]);

  useEffect(() => {
    if (!initialUrl?.trim() || !initialTitle?.trim() || captureId) return;
    setDraft(
      buildAmplifiSocialDraft({
        businessName: initialTitle.trim(),
        considerUrl: initialUrl.trim(),
      }),
    );
  }, [initialUrl, initialTitle, captureId]);

  const loadDemo = () => {
    setBusinessName('Selena Executive Coaching');
    setStoryUrl(DEMO_STORY_URL);
    setHeadline('Executive coaching with room to grow visibility and engagement.');
    setQuickWin('A clearer story and stronger next step for their audience.');
    setMessage('');
    setResearchMeta(null);
    generateDraft({
      businessName: 'Selena Executive Coaching',
      storyUrl: DEMO_STORY_URL,
      headline: 'Executive coaching with room to grow visibility and engagement.',
      quickWin: 'A clearer story and stronger next step for their audience.',
    });
  };

  const pickCapture = (id: string) => {
    setSelectedCaptureId(id);
    const capture = captures.find((c) => c.id === id);
    if (!capture) return;
    setResearchMeta(null);
    setBusinessName(capture.businessName ?? capture.title);
    const rawUrl =
      preferPortalMagnifiUrl({
        magnifiUrl: capture.magnifiUrl,
        shareUrl: capture.shareUrl,
        captureId: capture.id,
      }) ?? '';
    const fullUrl = rawUrl.startsWith('/')
      ? absoluteAmplifiShareUrl(rawUrl, PUBLIC_LINKS.platform.replace(/\/$/, ''))
      : rawUrl;
    setStoryUrl(fullUrl);
    setLoading(true);
    fetch(`/api/portal/captures/${encodeURIComponent(id)}/story`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; draft?: AmplifiSocialDraft }) => {
        if (data.ok && data.draft) setDraft(data.draft);
        else generateDraft({ businessName: capture.businessName ?? capture.title, storyUrl: fullUrl });
      })
      .catch(() => generateDraft({ businessName: capture.businessName ?? capture.title, storyUrl: fullUrl }))
      .finally(() => setLoading(false));
  };

  const runAmplifiSearch = async () => {
    if (!loggedIn) {
      setMessage('Sign in to use Amplifi Search.');
      return;
    }
    if (!topic.trim()) {
      setMessage('Enter a topic for Amplifi Search.');
      return;
    }
    setResearching(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/topic-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), dateFrom, dateTo }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        research?: {
          topic: string;
          dateFrom: string;
          dateTo: string;
          researchedAt: string;
          sources: ResearchSource[];
          draft: AmplifiSocialDraft;
          draftTitle: string;
          warnings: string[];
        };
      };
      if (!res.ok || !data.ok || !data.research) {
        setMessage(data.error ?? 'Amplifi Search could not complete.');
        return;
      }
      const research = data.research;
      setDraft(research.draft);
      setBusinessName(research.draftTitle || topic.trim());
      setStoryUrl(research.sources[0]?.url || '');
      setResearchMeta({
        topic: research.topic,
        dateFrom: research.dateFrom,
        dateTo: research.dateTo,
        researchedAt: research.researchedAt,
        sources: research.sources,
        warnings: research.warnings || [],
      });
      if (research.warnings?.length) setMessage(research.warnings[0] || '');
      setSuccess(`Found ${research.sources.length} source(s). Review the draft and send it to your approval queue.`);
    } catch {
      setMessage('Network error during Amplifi Search.');
    } finally {
      setResearching(false);
    }
  };

  const submitForApproval = async () => {
    if (!loggedIn) {
      setMessage('Sign in to store posts for approval.');
      return;
    }
    if (!draft) {
      setMessage('Generate posts first.');
      return;
    }
    setSubmitting(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/submit-for-approval', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: businessName.trim(),
          linkedIn: draft.linkedIn,
          caption: draft.shortCaption,
          storyUrl: storyUrl.trim(),
          captureId: selectedCaptureId || captureId,
          research: researchMeta
            ? {
                topic: researchMeta.topic,
                dateFrom: researchMeta.dateFrom,
                dateTo: researchMeta.dateTo,
                researchedAt: researchMeta.researchedAt,
                sources: researchMeta.sources,
                warnings: researchMeta.warnings,
              }
            : undefined,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; updatesUrl?: string; requestId?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Could not submit for approval.');
        return;
      }
      setSuccess(`Added to review queue${data.requestId ? ` · ${data.requestId}` : ''}.`);
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const portalAmplifi = slug ? `/portal/${slug}/amplifi` : null;
  const updatesUrl = slug ? `/portal/${slug}/updates` : '/portal/login?next=%2Famplifi';
  const campaignName = businessName.trim() || 'Your next campaign';
  const sourceCount = researchMeta?.sources.length ?? 0;

  return (
    <div className="af-shell">
      <aside className="af-sidebar">
        <Link href="/amplifi" className="af-logo" aria-label="Amplifi home">
          <span className="af-logo-mark">A</span>
          <span>amplifi</span>
        </Link>

        <nav className="af-nav" aria-label="Amplifi navigation">
          <a className="af-nav-item af-nav-active" href="#campaign"><NavIcon>C</NavIcon><span>Campaign</span></a>
          <a className="af-nav-item" href="#search"><NavIcon>S</NavIcon><span>Search</span><b className="af-nav-badge">Smart</b></a>
          <a className="af-nav-item" href="#content"><NavIcon>✦</NavIcon><span>Content studio</span></a>
          <a className="af-nav-item" href="#calendar"><NavIcon>31</NavIcon><span>Calendar</span></a>
          <a className="af-nav-item" href="#results"><NavIcon>↗</NavIcon><span>Results</span></a>
        </nav>

        <div className="af-sidebar-spacer" />

        <div className="af-copilot-card">
          <span className="af-spark">✦</span>
          <strong>Amplifi guide</strong>
          <p>Research, shape and prepare content without losing the human voice.</p>
          <button type="button" onClick={() => setShowAmplifiSearch(true)}>Start with research</button>
        </div>

        <div className="af-sidebar-footer">
          <span className="af-mini-logo">A</span>
          <span>© 2026 Efficiency Architects</span>
        </div>
      </aside>

      <main className="af-workspace">
        <header className="af-topbar">
          <div>
            <div className="af-title-row">
              <h1>{campaignName}</h1>
              <span className="af-status-pill">Draft workspace</span>
            </div>
            <p>Build, research and review the next piece of your campaign.</p>
          </div>
          <div className="af-top-actions">
            {loggedIn && portalAmplifi ? <Link href={portalAmplifi} className="af-quiet-link">Portal hub</Link> : <Link href="/portal/login?next=%2Famplifi" className="af-quiet-link">Sign in</Link>}
            <button type="button" className="af-create-button" onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}>＋ Create new</button>
          </div>
        </header>

        <div className="af-tabs" id="campaign">
          <a className="af-tab af-tab-active" href="#campaign">Overview</a>
          <a className="af-tab" href="#content">Posts</a>
          <a className="af-tab" href="#search">Research</a>
          <a className="af-tab" href="#results">Results</a>
        </div>

        <div className="af-dashboard-grid">
          <section className="af-primary-column">
            <section className="af-panel af-intro-panel">
              <div>
                <span className="af-eyebrow">Campaign workspace</span>
                <h2>Create work people actually want to stop and read.</h2>
                <p>Start from an EA capture, a source link or fresh research. Amplifi keeps review and publishing controls visible at every step.</p>
              </div>
              <div className="af-intro-orb" aria-hidden="true">A</div>
            </section>

            {loggedIn && captures.length > 0 ? (
              <section className="af-panel af-compact-panel">
                <div className="af-section-heading">
                  <div><span className="af-eyebrow">Campaign source</span><h3>Start from an existing capture</h3></div>
                  <Link href="/capture" className="af-text-action">New capture</Link>
                </div>
                <select className="af-input" value={selectedCaptureId} onChange={(e) => pickCapture(e.target.value)}>
                  <option value="">Select a capture…</option>
                  {captures.map((capture) => <option key={capture.id} value={capture.id}>{capture.title}{capture.businessName ? ` · ${capture.businessName}` : ''}</option>)}
                </select>
              </section>
            ) : null}

            <section className="af-panel" id="search">
              <div className="af-section-heading">
                <div>
                  <span className="af-eyebrow">Smart Research</span>
                  <h3>Find a timely angle before you create.</h3>
                  <p>Search public articles, news and videos inside a date range, then turn the useful findings into a draft.</p>
                </div>
                <button type="button" className="af-outline-button" onClick={() => setShowAmplifiSearch((value) => !value)}>{showAmplifiSearch ? 'Close research' : 'Open research'}</button>
              </div>

              {showAmplifiSearch ? (
                <div className="af-research-form">
                  <label className="af-field af-field-wide"><span>Topic</span><textarea value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="What should Amplifi research?" /></label>
                  <label className="af-field"><span>From</span><input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} /></label>
                  <label className="af-field"><span>To</span><input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} /></label>
                  <div className="af-field af-monitor-field"><span>Search mode</span><div className="af-mode-pills"><button type="button" className="af-mode-active">Search once</button><button type="button" disabled title="Recurring monitoring is next on the Amplifi roadmap">Monitor topic · coming next</button></div></div>
                  <button type="button" className="af-primary-button af-research-submit" disabled={researching || !loggedIn} onClick={() => void runAmplifiSearch()}>{researching ? 'Researching…' : 'Search & create draft'}</button>
                </div>
              ) : null}

              {!loggedIn && showAmplifiSearch ? <p className="af-inline-note">Sign in to run Smart Research.</p> : null}

              {researchMeta?.sources?.length ? (
                <div className="af-source-grid">
                  {researchMeta.sources.slice(0, 4).map((source) => (
                    <a key={source.url} href={source.url} target="_blank" rel="noreferrer" className="af-source-card">
                      <span>{source.kind}</span><strong>{source.title}</strong><p>{source.snippet}</p><small>{source.publishedAt || 'Date unconfirmed'}</small>
                    </a>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="af-panel" id="content">
              <div className="af-section-heading">
                <div><span className="af-eyebrow">Content studio</span><h3>Shape the post</h3><p>Keep the inputs simple. Amplifi turns the source and angle into usable social copy.</p></div>
                <button type="button" className="af-text-action af-button-link" onClick={loadDemo}>Load demo</button>
              </div>

              <div className="af-editor-grid">
                <label className="af-field"><span>Post title</span><input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Campaign or post title" /></label>
                <label className="af-field"><span>Primary source</span><input value={storyUrl} onChange={(e) => setStoryUrl(e.target.value)} placeholder="https://…" /></label>
                <label className="af-field af-field-wide"><span>Hook <small>optional</small></span><textarea value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="Opening thought that earns attention" /></label>
                <label className="af-field af-field-wide"><span>Useful takeaway <small>optional</small></span><input value={quickWin} onChange={(e) => setQuickWin(e.target.value)} placeholder="One thing the reader should leave with" /></label>
              </div>

              {message ? <p className="af-message af-message-error">{message}</p> : null}
              {success ? <p className="af-message af-message-success">{success}</p> : null}

              <div className="af-action-row">
                <button type="button" className="af-primary-button" disabled={loading} onClick={() => generateDraft()}>{loading ? 'Loading…' : draft ? 'Regenerate draft' : 'Generate draft'}</button>
                <span>Nothing publishes from this screen without review.</span>
              </div>
            </section>

            {draft ? (
              <section className="af-panel af-draft-panel">
                <div className="af-section-heading">
                  <div><span className="af-eyebrow">Planned post</span><h3>Review the creative before it moves forward.</h3></div>
                  <span className="af-review-chip">Needs review</span>
                </div>

                <div className="af-social-preview">
                  <div className="af-social-preview-head"><span className="af-network-mark">in</span><div><strong>LinkedIn draft</strong><small>Preview</small></div></div>
                  <div className="af-creative-card"><div className="af-creative-glow" /><span className="af-creative-brand">AMPLIFI</span><h4>{headline.trim() || businessName.trim() || 'A clearer story deserves a stronger next step.'}</h4><p>{quickWin.trim() || 'Turn useful insight into content your audience can act on.'}</p></div>
                  <StoryDraftPanel draft={draft} />
                </div>

                <div className="af-review-actions">
                  <button type="button" className="af-approve-button" disabled={submitting || !loggedIn} onClick={() => void submitForApproval()}>{submitting ? 'Sending…' : '✓ Accept & send to review'}</button>
                  <button type="button" className="af-edit-button" onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}>✎ Edit</button>
                  <button type="button" className="af-reject-button" onClick={() => { setDraft(null); setSuccess('Draft removed. Your source and inputs are still here.'); }}>⊘ Reject</button>
                </div>

                <div className="af-manual-share">
                  <span>Manual share</span>
                  <button type="button" onClick={() => openSocialShare('linkedin', draft, storyUrl.trim() || DEMO_STORY_URL)}>LinkedIn</button>
                  <button type="button" onClick={() => openSocialShare('facebook', draft, storyUrl.trim() || DEMO_STORY_URL)}>Facebook</button>
                  <button type="button" onClick={() => openSocialShare('x', draft, storyUrl.trim() || DEMO_STORY_URL)}>X</button>
                  {loggedIn ? <Link href={updatesUrl}>Review queue →</Link> : null}
                </div>
              </section>
            ) : (
              <section className="af-empty-creative"><span>✦</span><div><strong>Your creative preview will appear here.</strong><p>Add a source and generate a draft, or start with Smart Research.</p></div></section>
            )}

            <section className="af-next-strip" id="calendar">
              <div><span className="af-strip-icon">✓</span><p><strong>Next step</strong><small>{draft ? 'Review the draft and move it into approval.' : 'Create the first draft.'}</small></p></div>
              <div><span className="af-strip-icon">◷</span><p><strong>Optimal times</strong><small>Scheduling recommendations appear with approved campaign posts.</small></p></div>
              <div><span className="af-strip-icon">⌕</span><p><strong>Smart Research</strong><small>{sourceCount ? `${sourceCount} source${sourceCount === 1 ? '' : 's'} found in this session.` : 'Research is ready when you need a fresh angle.'}</small></p></div>
            </section>
          </section>

          <aside className="af-insights-column" id="results">
            <section className="af-panel af-performance-panel">
              <div className="af-section-heading af-tight-heading"><div><span className="af-eyebrow">Campaign performance</span><h3>Results</h3></div><span className="af-live-dot">Live after publish</span></div>
              <div className="af-metric-grid">
                <div><span>Reach</span><strong>—</strong><small>Waiting for live data</small></div>
                <div><span>Engagements</span><strong>—</strong><small>Waiting for live data</small></div>
                <div><span>Link clicks</span><strong>—</strong><small>Tracked after publish</small></div>
                <div><span>Conversions</span><strong>—</strong><small>Attributed when available</small></div>
              </div>
              <div className="af-chart-placeholder"><span /><span /><span /><span /><span /><span /><span /></div>
              <p className="af-data-note">No vanity numbers. This panel stays empty until Amplifi has real campaign data to report.</p>
            </section>

            <section className="af-panel af-health-panel">
              <span className="af-eyebrow">Campaign health</span>
              <div className="af-health-title"><strong>{draft ? 'Creative ready for review' : 'Build in progress'}</strong><span>{draft ? '75%' : '35%'}</span></div>
              <div className="af-health-track"><span style={{ width: draft ? '75%' : '35%' }} /></div>
              <ul>
                <li className={storyUrl ? 'is-ready' : ''}><span />Source connected</li>
                <li className={researchMeta ? 'is-ready' : ''}><span />Research grounded</li>
                <li className={draft ? 'is-ready' : ''}><span />Creative generated</li>
                <li><span />Approval complete</li>
              </ul>
            </section>

            <section className="af-panel af-rules-panel">
              <span className="af-eyebrow">Publishing guardrail</span>
              <h3>Human approval stays in the loop.</h3>
              <p>{MAGNIFI_PUBLIC_LINK_WARNING}</p>
              <Link href="/amplifi/install" className="af-text-action">Install Amplifi →</Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
