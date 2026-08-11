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

type AmplifiPath = 'publish' | 'research' | 'smartchitecture';
type ApprovedPost = { requestId?: string; title: string; caption: string; status: string; };
type SocialConnection = { id: string; platform: string; name: string; picture?: string; };
type NativeProviderStatus = { provider: 'meta' | 'linkedin' | 'tiktok' | 'x'; label: string; configured: boolean; accounts: SocialConnection[]; };

type TopicWatch = {
  id: string;
  topic: string;
  cadence: 'daily' | 'twice-weekly' | 'weekly';
  status: 'active' | 'paused' | 'stopped';
  timezone: string;
  discoveries: Array<{
    id: string;
    at: string;
    note: string;
    newSourceCount: number;
  }>;
  lastRunAt?: string;
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
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [selectedPath, setSelectedPath] = useState<AmplifiPath | null>(null);
  const [approvedPost, setApprovedPost] = useState<ApprovedPost | null>(null);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionResult, setConnectionResult] = useState('');
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(loggedIn);
  const [connectionsConfigured, setConnectionsConfigured] = useState(false);
  const [providerStatuses, setProviderStatuses] = useState<NativeProviderStatus[]>([]);
  const [publishingNow, setPublishingNow] = useState(false);
  const [publishResult, setPublishResult] = useState('');
  const [captures, setCaptures] = useState<CaptureOption[]>([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(captureId ?? '');
  const [showAmplifiSearch, setShowAmplifiSearch] = useState(false);
  const [topic, setTopic] = useState('');
  const [dateFrom, setDateFrom] = useState(defaults.from);
  const [dateTo, setDateTo] = useState(defaults.to);
  const [researchMeta, setResearchMeta] = useState<ResearchMeta | null>(null);
  const [searchMode, setSearchMode] = useState<'once' | 'watch'>('once');
  const [watchCadence, setWatchCadence] = useState<'daily' | 'twice-weekly' | 'weekly'>('weekly');
  const [topicWatches, setTopicWatches] = useState<TopicWatch[]>([]);
  const [watchBusyId, setWatchBusyId] = useState<string | null>(null);

  useEffect(() => {
    const savedPath = window.localStorage.getItem('amplifi:onboarding:path') as AmplifiPath | null;
    if (savedPath === 'publish' || savedPath === 'research' || savedPath === 'smartchitecture') setSelectedPath(savedPath);
    else setShowWelcome(true);
  }, []);

  const choosePath = (path: AmplifiPath) => {
    setSelectedPath(path);
    setShowWelcome(false);
    window.localStorage.setItem('amplifi:onboarding:path', path);
    window.setTimeout(() => {
      const target = path === 'research' ? 'search' : path === 'smartchitecture' ? 'smartchitecture' : 'content';
      document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  const loadConnections = useCallback(async () => {
    if (!loggedIn) { setConnectionsLoading(false); return; }
    setConnectionsLoading(true);
    try {
      const res = await fetch('/api/portal/amplifi/native-connections', { cache: 'no-store' });
      const data = (await res.json()) as { providers?: NativeProviderStatus[]; connections?: SocialConnection[] };
      setProviderStatuses(data.providers ?? []);
      setConnectionsConfigured(Boolean(data.providers?.some((provider) => provider.configured)));
      setSocialConnections(data.connections ?? []);
    } catch {
      setSocialConnections([]);
    } finally {
      setConnectionsLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => { void loadConnections(); }, [loadConnections]);

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
    if (!loggedIn) return;
    fetch('/api/portal/amplifi/topic-research/watch')
      .then((res) => res.json())
      .then((data: { watches?: TopicWatch[] }) => {
        if (Array.isArray(data.watches)) setTopicWatches(data.watches);
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

  const keepWatching = async () => {
    if (!loggedIn) {
      setMessage('Sign in to use Keep Watching.');
      return;
    }
    if (!topic.trim()) {
      setMessage('Enter a topic before enabling Keep Watching.');
      return;
    }
    setResearching(true);
    setMessage('');
    setSuccess('');
    try {
      const res = await fetch('/api/portal/amplifi/topic-research/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          topic: topic.trim(),
          cadence: watchCadence,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'America/New_York',
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; watch?: TopicWatch };
      if (!res.ok || !data.ok || !data.watch) {
        setMessage(data.error ?? 'Could not enable Keep Watching.');
        return;
      }
      setTopicWatches((current) => [data.watch!, ...current.filter((watch) => watch.id !== data.watch!.id)]);
      setSuccess(`Keep Watching enabled (${watchCadence.replace('-', ' ')}).`);
    } catch {
      setMessage('Could not enable Keep Watching right now.');
    } finally {
      setResearching(false);
    }
  };

  const updateWatch = async (
    watchId: string,
    action: 'pause' | 'resume' | 'stop' | 'run',
  ) => {
    setWatchBusyId(`${action}:${watchId}`);
    try {
      const res = await fetch('/api/portal/amplifi/topic-research/watch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, watchId }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        watch?: TopicWatch;
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
        newSources?: number;
      };
      if (!res.ok || !data.ok || !data.watch) {
        setMessage(data.error ?? 'Watch update failed.');
        return;
      }
      setTopicWatches((current) => current.map((watch) => (watch.id === watchId ? data.watch! : watch)));
      if (action === 'run' && data.research) {
        setDraft(data.research.draft);
        setBusinessName(data.research.draftTitle || data.research.topic);
        setStoryUrl(data.research.sources[0]?.url || '');
        setResearchMeta({
          topic: data.research.topic,
          dateFrom: data.research.dateFrom,
          dateTo: data.research.dateTo,
          researchedAt: data.research.researchedAt,
          sources: data.research.sources,
          warnings: data.research.warnings || [],
        });
        setSuccess(
          data.newSources
            ? `Keep Watching found ${data.newSources} new source${data.newSources === 1 ? '' : 's'}.`
            : 'No genuinely new sources this run.',
        );
      }
    } catch {
      setMessage('Watch update failed due to a network error.');
    } finally {
      setWatchBusyId(null);
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
      setApprovedPost({ requestId: data.requestId, title: businessName.trim() || 'Untitled post', caption: draft.linkedIn, status: 'Ready for publishing review' });
      setSuccess('Post accepted. It is saved in Amplifi and ready for the publishing step.');
      window.setTimeout(() => document.getElementById('approved-posts')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const testPublishingConnection = async () => {
    if (!loggedIn) { setMessage('Sign in to test the publishing connection.'); return; }
    setTestingConnection(true); setConnectionResult('');
    try {
      const res = await fetch('/api/portal/amplifi/test-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: approvedPost?.title || businessName.trim() || 'Amplifi connection test' }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      setConnectionResult(data.ok
        ? 'Connection confirmed. Amplifi reached the publishing workflow without creating a social post.'
        : data.error || 'The publishing connection did not respond. No social post was created.');
    } catch { setConnectionResult('The publishing connection could not be tested. No social post was created.'); }
    finally { setTestingConnection(false); }
  };

  const publishNow = async () => {
    if (!draft) return;
    setPublishingNow(true); setPublishResult('');
    try {
      const res = await fetch('/api/portal/amplifi/native-publish', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draft.linkedIn }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; results?: Array<{ ok: boolean; account: { platform: string }; error?: string }> };
      if (!data.ok) { setPublishResult(data.error || data.results?.map((item) => `${item.account.platform}: ${item.error || 'failed'}`).join(' · ') || 'Publishing failed.'); return; }
      const live = data.results?.filter((item) => item.ok).map((item) => item.account.platform).join(', ');
      const skipped = data.results?.filter((item) => !item.ok).map((item) => `${item.account.platform}: ${item.error}`).join(' · ');
      setPublishResult(`Published to ${live || 'connected channels'}.${skipped ? ` ${skipped}` : ''}`);
    } catch { setPublishResult('Publishing could not be completed.'); }
    finally { setPublishingNow(false); }
  };

  const portalAmplifi = slug ? `/portal/${slug}/amplifi` : null;
  const campaignName = businessName.trim() || 'Your next campaign';
  const sourceCount = researchMeta?.sources.length ?? 0;

  return (
    <div className="af-shell">
      {showWelcome ? (
        <div className="af-modal-backdrop" role="presentation">
          <section className="af-onboarding-modal" role="dialog" aria-modal="true" aria-labelledby="amplifi-welcome-title">
            <span className="af-eyebrow">Welcome to Amplifi</span>
            <h2 id="amplifi-welcome-title">How would you like Amplifi to help?</h2>
            <p>Choose the outcome you want. Amplifi will take you directly to the right workspace.</p>
            <div className="af-path-grid">
              <button type="button" onClick={() => choosePath('publish')}><span>1</span><strong>I have content to publish</strong><small>Enter your post or ask Amplifi to write it, then review and publish to connected channels.</small></button>
              <button type="button" onClick={() => choosePath('research')}><span>2</span><strong>Help me find something worth sharing</strong><small>Search the web for useful sources and turn the best findings into ready-to-review posts.</small></button>
              <button type="button" onClick={() => choosePath('smartchitecture')}><span>3</span><strong>I have a business goal</strong><small>Use Smartchitecture™ to shape the audience, message, campaign, content and next actions.</small></button>
            </div>
            <button type="button" className="af-text-button" onClick={() => setShowWelcome(false)}>I’ll explore on my own</button>
          </section>
        </div>
      ) : null}
      {showHelp ? (
        <div className="af-modal-backdrop" role="presentation" onMouseDown={() => setShowHelp(false)}>
          <section className="af-help-drawer" role="dialog" aria-modal="true" aria-labelledby="amplifi-help-title" onMouseDown={(event) => event.stopPropagation()}>
            <button type="button" className="af-close-button" aria-label="Close help" onClick={() => setShowHelp(false)}>×</button>
            <span className="af-eyebrow">Amplifi guide</span><h2 id="amplifi-help-title">What would you like to do?</h2>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('publish'); }}><strong>Create or enter a post</strong><small>Start with your words, or let Amplifi generate the message.</small></button>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('research'); }}><strong>Research and create</strong><small>Find timely sources, choose an angle and generate a post.</small></button>
            <button type="button" onClick={() => { setShowHelp(false); choosePath('smartchitecture'); }}><strong>Build from a business goal</strong><small>Turn an objective into a coordinated campaign.</small></button>
            <div className="af-help-note"><strong>Your control is protected.</strong><p>Amplifi shows what happens next before anything is published.</p></div>
          </section>
        </div>
      ) : null}
      <aside className="af-sidebar">
        <Link href="/amplifi/workspace" className="af-logo" aria-label="Amplifi workspace">
          <span className="af-logo-mark">A</span>
          <span>amplifi</span>
        </Link>

        <nav className="af-nav" aria-label="Amplifi navigation">
          <a className="af-nav-item af-nav-active" href="#campaign"><NavIcon>C</NavIcon><span>Campaign</span></a>
          <a className="af-nav-item" href="#search"><NavIcon>S</NavIcon><span>Search</span><b className="af-nav-badge">Smart</b></a>
          <a className="af-nav-item" href="#content"><NavIcon>✦</NavIcon><span>Create content</span></a>
          <a className="af-nav-item" href="#calendar"><NavIcon>31</NavIcon><span>Calendar</span></a>
          <a className="af-nav-item" href="#connections"><NavIcon>＋</NavIcon><span>Connections</span></a>
          <a className="af-nav-item" href="#results"><NavIcon>↗</NavIcon><span>Results</span></a>
        </nav>

        <div className="af-sidebar-spacer" />

        <div className="af-copilot-card">
          <span className="af-spark">✦</span>
          <strong>Need help?</strong>
          <p>Tell Amplifi what you want to accomplish and it will take you to the right place.</p>
          <button type="button" onClick={() => setShowHelp(true)}>Open guide</button>
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
            <button type="button" className="af-help-button" onClick={() => setShowHelp(true)}>Help</button>
            <button type="button" className="af-create-button" onClick={() => choosePath('publish')}>＋ Create new</button>
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
            <section className="af-panel af-path-summary" aria-label="Amplifi starting option">
              <div><span className="af-eyebrow">Your Amplifi path</span><h2>{selectedPath === 'research' ? 'Research, create and publish' : selectedPath === 'smartchitecture' ? 'Set the goal. Amplifi builds the campaign.' : 'Create and publish'}</h2></div>
              <button type="button" className="af-secondary-button" onClick={() => setShowWelcome(true)}>Change path</button>
            </section>
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
                  <div className="af-field af-monitor-field">
                    <span>Search mode</span>
                    <div className="af-mode-pills">
                      <button
                        type="button"
                        className={searchMode === 'once' ? 'af-mode-active' : ''}
                        onClick={() => setSearchMode('once')}
                      >
                        Search once
                      </button>
                      <button
                        type="button"
                        className={searchMode === 'watch' ? 'af-mode-active' : ''}
                        onClick={() => setSearchMode('watch')}
                      >
                        Keep watching
                      </button>
                    </div>
                  </div>
                  {searchMode === 'watch' ? (
                    <label className="af-field">
                      <span>Monitoring cadence</span>
                      <select value={watchCadence} onChange={(e) => setWatchCadence(e.target.value as 'daily' | 'twice-weekly' | 'weekly')}>
                        <option value="daily">Daily</option>
                        <option value="twice-weekly">Twice weekly</option>
                        <option value="weekly">Weekly</option>
                      </select>
                    </label>
                  ) : null}
                  <button
                    type="button"
                    className="af-primary-button af-research-submit"
                    disabled={researching || !loggedIn}
                    onClick={() => void (searchMode === 'watch' ? keepWatching() : runAmplifiSearch())}
                  >
                    {researching
                      ? 'Working…'
                      : searchMode === 'watch'
                        ? 'Enable Keep Watching'
                        : 'Search & create draft'}
                  </button>
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

              {topicWatches.length ? (
                <div className="af-watch-list">
                  <h4>Keep Watching topics</h4>
                  {topicWatches.map((watch) => (
                    <div key={watch.id} className="af-watch-item">
                      <div>
                        <strong>{watch.topic}</strong>
                        <p>
                          {watch.cadence.replace('-', ' ')} · {watch.status}
                          {watch.lastRunAt ? ` · last run ${new Date(watch.lastRunAt).toLocaleString()}` : ''}
                        </p>
                      </div>
                      <div className="af-watch-actions">
                        <button
                          type="button"
                          onClick={() => void updateWatch(watch.id, 'run')}
                          disabled={watchBusyId === `run:${watch.id}`}
                        >
                          Run now
                        </button>
                        {watch.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'pause')}
                            disabled={watchBusyId === `pause:${watch.id}`}
                          >
                            Pause
                          </button>
                        ) : null}
                        {watch.status === 'paused' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'resume')}
                            disabled={watchBusyId === `resume:${watch.id}`}
                          >
                            Resume
                          </button>
                        ) : null}
                        {watch.status !== 'stopped' ? (
                          <button
                            type="button"
                            onClick={() => void updateWatch(watch.id, 'stop')}
                            disabled={watchBusyId === `stop:${watch.id}`}
                          >
                            Stop
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="af-panel af-smartchitecture-panel" id="smartchitecture">
              <div className="af-section-heading"><div><span className="af-eyebrow">Smartchitecture™</span><h3>Start with the business result—not a blank content box.</h3></div></div>
              <p>Define the objective and Amplifi coordinates the audience, strategy, campaign structure, messages, calls to action and measures of success.</p>
              <button type="button" className="af-secondary-button" onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}>Build from my goal</button>
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
                  <button type="button" className="af-approve-button" disabled={submitting || !loggedIn || Boolean(approvedPost)} onClick={() => void submitForApproval()}>{submitting ? 'Saving…' : approvedPost ? '✓ Accepted and saved' : '✓ Accept post'}</button>
                  <button type="button" className="af-edit-button" onClick={() => document.getElementById('content')?.scrollIntoView({ behavior: 'smooth' })}>✎ Edit</button>
                  <button type="button" className="af-reject-button" onClick={() => { setDraft(null); setSuccess('Draft removed. Your source and inputs are still here.'); }}>⊘ Reject</button>
                </div>

                <div className="af-manual-share">
                  <span>Manual share</span>
                  <button type="button" onClick={() => openSocialShare('linkedin', draft, storyUrl.trim() || DEMO_STORY_URL)}>LinkedIn</button>
                  <button type="button" onClick={() => openSocialShare('facebook', draft, storyUrl.trim() || DEMO_STORY_URL)}>Facebook</button>
                  <button type="button" onClick={() => openSocialShare('x', draft, storyUrl.trim() || DEMO_STORY_URL)}>X</button>
                  {loggedIn ? <a href="#approved-posts">Approved posts →</a> : null}
                </div>
              </section>
            ) : (
              <section className="af-empty-creative"><span>✦</span><div><strong>Your creative preview will appear here.</strong><p>Add a source and generate a draft, or start with Smart Research.</p></div></section>
            )}

            <section className="af-panel af-approved-panel" id="approved-posts">
              <div className="af-section-heading"><div><span className="af-eyebrow">Approved posts</span><h3>{approvedPost ? 'Your post is saved and ready for the next step.' : 'Accepted posts will appear here.'}</h3></div>{approvedPost ? <span className="af-review-chip af-approved-chip">Accepted</span> : null}</div>
              {approvedPost ? <div className="af-approved-card"><div><strong>{approvedPost.title}</strong><small>{approvedPost.status}{approvedPost.requestId ? ` · ${approvedPost.requestId}` : ''}</small></div><div className="af-approved-actions"><button type="button" className="af-primary-button" disabled={publishingNow || !socialConnections.length} onClick={() => void publishNow()}>{publishingNow ? 'Publishing…' : socialConnections.length ? 'Publish now' : 'Connect accounts first'}</button><button type="button" className="af-secondary-button" disabled={testingConnection} onClick={() => void testPublishingConnection()}>{testingConnection ? 'Testing…' : 'Test publishing connection'}</button></div></div> : <p>Create a draft, review it and select “Accept post.” You will stay inside Amplifi.</p>}
              {connectionResult ? <p className="af-message af-message-success" role="status">{connectionResult}</p> : null}
              {publishResult ? <p className={publishResult.startsWith('Published') ? 'af-message af-message-success' : 'af-message af-message-error'} role="status">{publishResult}</p> : null}
            </section>
            <section className="af-next-strip" id="calendar">
              <div><span className="af-strip-icon">✓</span><p><strong>Next step</strong><small>{approvedPost ? 'Post saved. Test the publishing connection or choose a publishing time.' : draft ? 'Review the draft and accept it.' : 'Choose a path and create the first draft.'}</small></p></div>
              <div><span className="af-strip-icon">◷</span><p><strong>Optimal times</strong><small>Scheduling recommendations appear with approved campaign posts.</small></p></div>
              <div><span className="af-strip-icon">⌕</span><p><strong>Smart Research</strong><small>{sourceCount ? `${sourceCount} source${sourceCount === 1 ? '' : 's'} found in this session.` : 'Research is ready when you need a fresh angle.'}</small></p></div>
            </section>
          </section>

          <aside className="af-insights-column">
            <section className="af-panel af-connections-panel" id="connections">
              <div className="af-section-heading"><div><span className="af-eyebrow">Social connections</span><h3>Connect directly to Amplifi.</h3></div></div>
              <p>Use each platform’s official authorization. Amplifi never asks for or stores your social-media password.</p>
              <div className="af-platform-grid">
                {[
                  { name: 'Facebook', provider: 'meta' as const },
                  { name: 'Instagram', provider: 'meta' as const },
                  { name: 'LinkedIn', provider: 'linkedin' as const },
                  { name: 'TikTok', provider: 'tiktok' as const },
                  { name: 'X', provider: 'x' as const },
                ].map(({ name, provider }) => {
                  const connection = socialConnections.find((item) => item.platform.toLowerCase() === name.toLowerCase());
                  const status = providerStatuses.find((item) => item.provider === provider);
                  return <div className={connection ? 'af-platform-card af-platform-connected' : 'af-platform-card'} key={name}>
                    <span>{connection ? '✓' : '○'}</span>
                    <div><strong>{name}</strong><small>{connection ? connection.name || 'Connected' : status?.configured ? 'Ready to connect' : 'Developer setup required'}</small></div>
                    {status?.configured && !connection ? <a href={`/api/portal/amplifi/native-connections/${provider}/start`}>Connect</a> : null}
                  </div>;
                })}
              </div>
              {connectionsLoading ? <p className="af-connection-note">Checking connections…</p> : null}
              {!connectionsLoading && !connectionsConfigured ? <p className="af-message af-message-error">EA’s platform credentials must be approved and added before client authorization can open.</p> : null}
              {socialConnections.length ? <button type="button" className="af-text-button" onClick={() => void loadConnections()}>Refresh connections</button> : null}
            </section>
            <div id="results">
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
                      </div>
</aside>
        </div>
      </main>
    </div>
  );
}
