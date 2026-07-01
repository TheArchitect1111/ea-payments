'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import StoryDraftPanel from '@/app/components/StoryDraftPanel';
import '@/app/components/story-draft-panel.css';
import { buildAmplifiSocialDraft } from '@/lib/amplifi-draft';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';
import { openSocialShare } from '@/lib/amplifi-social-share';
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
  const [businessName, setBusinessName] = useState(initialTitle ?? '');
  const [storyUrl, setStoryUrl] = useState(initialUrl ?? '');
  const [headline, setHeadline] = useState('');
  const [quickWin, setQuickWin] = useState('');
  const [draft, setDraft] = useState<AmplifiSocialDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [success, setSuccess] = useState('');
  const [captures, setCaptures] = useState<CaptureOption[]>([]);
  const [selectedCaptureId, setSelectedCaptureId] = useState(captureId ?? '');

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
    setBusinessName(capture.businessName ?? capture.title);
    const rawUrl = capture.shareUrl ?? capture.magnifiUrl ?? '';
    const fullUrl = rawUrl.startsWith('/')
      ? `${PUBLIC_LINKS.platform.replace(/\/$/, '')}${rawUrl}`
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
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string; updatesUrl?: string; requestId?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error ?? 'Could not submit for approval.');
        return;
      }
      setSuccess(
        `Submitted for approval (ID: ${data.requestId ?? 'saved'}). Your team will review in Update Hub.`,
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
          <p className="af-kicker">Social posting</p>
          <h1 className="af-title">Search. Create. Store for approval.</h1>
          <p className="af-lede">
            Pick material from Simplifi captures, generate social copy, and submit to Update Hub for team approval
            before publishing.
          </p>
        </section>

        {loggedIn && captures.length > 0 ? (
          <section className="af-card">
            <label className="af-label" htmlFor="af-capture">
              1. Search material (your captures)
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
          <p className="af-label">2. Create post</p>
          <label className="af-label" htmlFor="af-name">
            Post title
          </label>
          <input
            id="af-name"
            className="af-input"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="e.g. Selena Executive Coaching"
          />

          <label className="af-label" htmlFor="af-url">
            Story link
          </label>
          <input
            id="af-url"
            className="af-input"
            value={storyUrl}
            onChange={(e) => setStoryUrl(e.target.value)}
            placeholder="https://…/consider/selena"
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
              {loading ? 'Loading…' : 'Generate posts'}
            </button>
            <button type="button" className="af-btn af-btn-outline" onClick={loadDemo}>
              Try demo
            </button>
          </div>

          {!loggedIn ? (
            <p className="af-note">
              <Link href="/portal/login?next=%2Famplifi" className="underline font-bold text-[#1B2B4D]">
                Sign in
              </Link>{' '}
              to search captures and store posts for approval.
            </p>
          ) : null}
        </section>

        {draft ? (
          <section className="af-card">
            <p className="af-kicker" style={{ color: '#c9a844' }}>
              3. Review &amp; store
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
              Or post now (skip approval)
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
