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
      if (research.warnings?.length) {
        setMessage(research.warnings[0] || '');
      }
      setSuccess(
        `Found ${research.sources.length} source(s) for ${research.dateFrom} → ${research.dateTo}. Review the draft, then submit for approval.`,
      );
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
      setSuccess(
        `Submitted for review (ID: ${data.requestId ?? 'saved'}). Nothing posts automatically — your team reviews in Update Hub before publishing.`,
      );
    } catch {
      setMessage('Network error. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const portalAmplifi = slug ? `/portal/${slug}/amplifi` : null;
  const updatesUrl = slug ? `/portal/${slug}/updates` : '/portal/login?next=%2Famplifi';

  return (
    <div className="af-app">
      <header className="af-header">
        <span className="af-brand">AMPLIFI™</span>
        <div className="flex gap-4">
          {loggedIn && portalAmplifi ? (
            <Link href={portalAmplifi} className="af-header-link">
              Portal hub
            </Link>
          ) : (
            <Link href="/portal/login?next=%2Famplifi" className="af-header-link">
              Sign in
            </Link>
          )}
          <Link href="/amplifi/install" className="af-header-link">
            Install
          </Link>
        </div>
      </header>

      <main className="af-main">
        <section className="af-hero">
          <p className="af-kicker">Review before posting</p>
          <h1 className="af-title">Draft. Review. Share when ready.</h1>
          <p className="af-lede">
            Start from campaign captures, or optionally use Amplifi Search to gather articles, news, and videos in a
            date window — then store drafts for approval. Amplifi does not auto-publish.{' '}
            {MAGNIFI_PUBLIC_LINK_WARNING}
          </p>
        </section>

        {loggedIn && captures.length > 0 ? (
          <section className="af-card">
            <label className="af-label" htmlFor="af-capture">
              1. Campaign posts (your captures)
            </label>
            <select
              id="af-capture"
              className="af-input"
              value={selectedCaptureId}
              onChange={(e) => pickCapture(e.target.value)}
            >
              <option value="">Select a capture…</option>
              {captures.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                  {c.businessName ? ` — ${c.businessName}` : ''}
                </option>
              ))}
            </select>
            <p className="af-note">
              Or{' '}
              <Link href="/capture" className="underline font-bold text-[#1B2B4D]">
                capture new material
              </Link>{' '}
              with Simplifi first.
            </p>
          </section>
        ) : null}

        <section className="af-card">
          <div className="af-search-head">
            <div>
              <p className="af-label" style={{ marginBottom: 4 }}>
                Amplifi Search (optional)
              </p>
              <p className="af-note" style={{ marginTop: 0 }}>
                Separate tool: topic + date range → public articles, news, and videos → draft for approval.
              </p>
            </div>
            <button
              type="button"
              className="af-btn af-btn-outline"
              onClick={() => setShowAmplifiSearch((v) => !v)}
            >
              {showAmplifiSearch ? 'Hide' : 'Open'}
            </button>
          </div>

          {showAmplifiSearch ? (
            <div className="af-search-body">
              <label className="af-label" htmlFor="af-topic">
                Topic
              </label>
              <textarea
                id="af-topic"
                className="af-textarea"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Automation and how it impacts mid-size businesses"
              />
              <div className="af-date-row">
                <div>
                  <label className="af-label" htmlFor="af-from">
                    From
                  </label>
                  <input
                    id="af-from"
                    type="date"
                    className="af-input"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                  />
                </div>
                <div>
                  <label className="af-label" htmlFor="af-to">
                    To
                  </label>
                  <input
                    id="af-to"
                    type="date"
                    className="af-input"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                  />
                </div>
              </div>
              <button
                type="button"
                className="af-btn af-btn-primary"
                disabled={researching || !loggedIn}
                onClick={() => void runAmplifiSearch()}
              >
                {researching ? 'Searching…' : 'Search & draft posts'}
              </button>
              {!loggedIn ? (
                <p className="af-note">
                  <Link href="/portal/login?next=%2Famplifi" className="underline font-bold text-[#1B2B4D]">
                    Sign in
                  </Link>{' '}
                  to run Amplifi Search.
                </p>
              ) : null}
            </div>
          ) : null}
        </section>

        {researchMeta?.sources?.length ? (
          <section className="af-card">
            <p className="af-label">Search results</p>
            <p className="af-note">
              {researchMeta.topic} · {researchMeta.dateFrom} → {researchMeta.dateTo}
            </p>
            <ul className="af-source-list">
              {researchMeta.sources.map((source) => (
                <li key={source.url}>
                  <a href={source.url} target="_blank" rel="noreferrer">
                    {source.title}
                  </a>
                  <span>
                    {source.kind}
                    {source.publishedAt ? ` · ${source.publishedAt}` : ' · date unconfirmed'}
                  </span>
                  {source.snippet ? <p>{source.snippet}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="af-card">
          <p className="af-label">Create / refine post</p>
          <label className="af-label" htmlFor="af-name">
            Post title
          </label>
          <input
            id="af-name"
            className="af-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Automation impact for mid-size businesses"
          />

          <label className="af-label" htmlFor="af-url">
            Primary source / story link
          </label>
          <input
            id="af-url"
            className="af-input"
            value={storyUrl}
            onChange={(e) => setStoryUrl(e.target.value)}
            placeholder="https://…"
          />

          <label className="af-label" htmlFor="af-headline">
            Hook (optional)
          </label>
          <textarea
            id="af-headline"
            className="af-textarea"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Opening line for your social post"
          />

          <label className="af-label" htmlFor="af-win">
            Quick win (optional)
          </label>
          <input
            id="af-win"
            className="af-input"
            value={quickWin}
            onChange={(e) => setQuickWin(e.target.value)}
            placeholder="One insight worth sharing"
          />

          {message ? <p className="af-error">{message}</p> : null}
          {success ? <p className="af-success">{success}</p> : null}

          <div className="af-actions">
            <button
              type="button"
              className="af-btn af-btn-primary"
              disabled={loading}
              onClick={() => generateDraft()}
            >
              {loading ? 'Loading…' : 'Generate from link'}
            </button>
            <button type="button" className="af-btn af-btn-outline" onClick={loadDemo}>
              Try demo
            </button>
          </div>
        </section>

        {draft ? (
          <section className="af-card">
            <p className="af-kicker" style={{ color: '#c9a844' }}>
              Review before posting
            </p>
            <p className="af-note" style={{ marginBottom: 12 }}>
              Read the draft below. Submit for team approval, or copy/open a network yourself — Amplifi never posts for
              you. {MAGNIFI_PUBLIC_LINK_WARNING}
            </p>
            <StoryDraftPanel draft={draft} />

            <div className="af-actions" style={{ marginTop: 16 }}>
              <button
                type="button"
                className="af-btn af-btn-secondary"
                disabled={submitting || !loggedIn}
                onClick={() => void submitForApproval()}
              >
                {submitting ? 'Submitting…' : 'Submit for approval'}
              </button>
              {loggedIn ? (
                <Link href={updatesUrl} className="af-btn af-btn-outline">
                  View Update Hub
                </Link>
              ) : null}
            </div>

            <p className="af-label" style={{ marginTop: 20 }}>
              Share manually (you post)
            </p>
            <div className="af-platforms">
              <button
                type="button"
                className="af-platform"
                onClick={() => openSocialShare('linkedin', draft, storyUrl.trim() || DEMO_STORY_URL)}
              >
                LinkedIn
              </button>
              <button
                type="button"
                className="af-platform"
                onClick={() => openSocialShare('x', draft, storyUrl.trim() || DEMO_STORY_URL)}
              >
                X / Twitter
              </button>
              <button
                type="button"
                className="af-platform"
                onClick={() => openSocialShare('facebook', draft, storyUrl.trim() || DEMO_STORY_URL)}
              >
                Facebook
              </button>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
