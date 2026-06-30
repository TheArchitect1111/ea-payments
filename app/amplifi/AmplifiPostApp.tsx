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
  const [message, setMessage] = useState('');

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

  const portalAmplifi = slug ? `/portal/${slug}/amplifi` : null;

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
          <h1 className="af-title">Write it once. Post everywhere.</h1>
          <p className="af-lede">
            Amplifi turns your Magnifi story into ready-to-post copy for LinkedIn, X, Facebook, and more.
          </p>
        </section>

        <section className="af-card">
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

          <p className="af-note">
            Need a story first?{' '}
            <Link href="/capture" className="underline font-bold text-[#1B2B4D]">
              Capture with Simplifi
            </Link>{' '}
            → Magnifi builds the story → return here to post.
          </p>
        </section>

        {draft ? (
          <section className="af-card">
            <p className="af-kicker" style={{ color: '#c9a844' }}>
              Ready to post
            </p>
            <StoryDraftPanel draft={draft} />

            <p className="af-label" style={{ marginTop: 16 }}>
              Open platform
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
            <p className="af-note">
              LinkedIn: copy the LinkedIn tab text, then paste in the compose window. X and Facebook open with your
              caption pre-filled where the platform allows.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}
