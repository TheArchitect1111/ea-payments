'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CAMPAIGN_GOALS } from '@/lib/creative-studio/goals';
import type {
  CampaignGoalId,
  CampaignStrategy,
  SocialPlatform,
} from '@/lib/creative-studio/types';
import { cacheCampaign } from './campaign-cache';
import './creative-studio.css';

type Step = 'goal' | 'story' | 'generating';

const PLATFORM_LABELS: Array<{ id: SocialPlatform; label: string }> = [
  { id: 'facebook', label: 'Facebook' },
  { id: 'instagram', label: 'Instagram' },
  { id: 'linkedin', label: 'LinkedIn' },
  { id: 'x', label: 'X' },
];

const DEFAULT_STRATEGY: CampaignStrategy = {
  objective: '',
  audience: '',
  platforms: ['facebook', 'instagram'],
  tone: 'Clear, warm, practical, and human',
  successMetric: 'Engagements',
  contentPillars: ['What people are experiencing', 'Helpful guidance', 'Next step'],
};

export default function CreativeStudioClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [goalId, setGoalId] = useState<CampaignGoalId | null>(null);
  const [story, setStory] = useState('');
  const [strategy, setStrategy] = useState<CampaignStrategy>(DEFAULT_STRATEGY);
  const [pillars, setPillars] = useState('What people are experiencing, Helpful guidance, Next step');
  const [trustedSources, setTrustedSources] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function togglePlatform(platform: SocialPlatform) {
    setStrategy((current) => ({
      ...current,
      platforms: current.platforms.includes(platform)
        ? current.platforms.filter((item) => item !== platform)
        : [...current.platforms, platform],
    }));
  }

  async function generateCampaign() {
    if (!goalId) return;
    if (!strategy.objective.trim() || !strategy.audience.trim()) {
      setError('Add the campaign objective and audience.');
      return;
    }
    if (!strategy.platforms.length) {
      setError('Select at least one social platform.');
      return;
    }

    setLoading(true);
    setError('');
    setStep('generating');

    try {
      const res = await fetch('/api/creative-studio/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goalId,
          story,
          strategy: {
            ...strategy,
            contentPillars: pillars.split(',').map((value) => value.trim()).filter(Boolean),
            trustedSources: trustedSources
              .split(/[\n,]/)
              .map((value) => value.trim())
              .filter(Boolean),
          },
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        campaign?: CreativeCampaign;
      };
      if (!res.ok || !data.campaign?.id) {
        setError(data.error ?? 'Could not generate campaign.');
        setStep('story');
        setLoading(false);
        return;
      }
      cacheCampaign(data.campaign);
      router.push(`/admin/creative-studio/campaigns/${data.campaign.id}`);
    } catch {
      setError('Network error. Try again.');
      setStep('story');
      setLoading(false);
    }
  }

  return (
    <main className="cs-page">
      <header className="cs-hero">
        <nav className="cs-subnav">
          <span className="cs-subnav-active">Campaigns</span>
          <Link href="/admin/creative-studio/media">Media</Link>
          <Link href="/admin/creative-studio/brand">Brand</Link>
        </nav>
        <p className="cs-kicker">Amplifi Campaign Builder™</p>
        <h1 className="cs-title">Let’s shape your campaign together.</h1>
        <p className="cs-lede">
          Tell Amplifi who you want to reach, what you want them to understand, and what you want them to do next.
          Amplifi will use that direction to create campaign content for each place you choose.
        </p>
      </header>

      {step === 'goal' ? (
        <section className="cs-section">
          <h2 className="cs-question">What would you like this campaign to help people do?</h2>
          <div className="cs-goal-grid">
            {CAMPAIGN_GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className="cs-goal-card"
                onClick={() => {
                  setGoalId(goal.id);
                  setStrategy((current) => ({ ...current, objective: goal.label }));
                  setStep('story');
                }}
              >
                <span className="cs-goal-emoji" aria-hidden>{goal.emoji}</span>
                <span className="cs-goal-label">{goal.label}</span>
                <span className="cs-goal-desc">{goal.description}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 'story' ? (
        <section className="cs-section cs-panel">
          <button type="button" className="cs-back" onClick={() => setStep('goal')}>
            ← Change the campaign goal
          </button>
          <h2 className="cs-question">Guide Amplifi</h2>

          <label className="cs-field">
            <span>What should this campaign help accomplish?</span>
            <input
              value={strategy.objective}
              onChange={(event) => setStrategy({ ...strategy, objective: event.target.value })}
              placeholder="Increase registrations for the fall program"
            />
          </label>

          <label className="cs-field">
            <span>Who are you trying to reach?</span>
            <input
              value={strategy.audience}
              onChange={(event) => setStrategy({ ...strategy, audience: event.target.value })}
              placeholder="Parents of student-athletes ages 13–18"
            />
          </label>

          <label className="cs-field">
            <span>What should people understand?</span>
            <textarea
              className="cs-story"
              rows={6}
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder="Describe what is happening, why it matters to them, and the next step you want to offer."
            />
          </label>

          <div className="cs-field-row">
            <label className="cs-field">
              <span>When should it begin?</span>
              <input
                type="date"
                value={strategy.startDate ?? ''}
                onChange={(event) => setStrategy({ ...strategy, startDate: event.target.value })}
              />
            </label>
            <label className="cs-field">
              <span>When should it end?</span>
              <input
                type="date"
                value={strategy.endDate ?? ''}
                onChange={(event) => setStrategy({ ...strategy, endDate: event.target.value })}
              />
            </label>
          </div>

          <fieldset className="cs-field">
            <span>Where should it appear?</span>
            <div className="cs-platform-grid">
              {PLATFORM_LABELS.map((platform) => (
                <label key={platform.id} className="cs-platform-option">
                  <input
                    type="checkbox"
                    checked={strategy.platforms.includes(platform.id)}
                    onChange={() => togglePlatform(platform.id)}
                  />
                  {platform.label}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="cs-field">
            <span>How should it sound?</span>
            <input
              value={strategy.tone}
              onChange={(event) => setStrategy({ ...strategy, tone: event.target.value })}
            />
          </label>

          <label className="cs-field">
            <span>What should the campaign talk about? Separate ideas with commas.</span>
            <input value={pillars} onChange={(event) => setPillars(event.target.value)} />
          </label>

          <div className="cs-guidance-block">
            <p className="cs-kicker">Help Amplifi find the right information</p>
            <p className="cs-hint">
              Tell Amplifi what to look for. It will check current sources, keep the supporting links, and use only
              supported findings when it writes the posts.
            </p>
            <label className="cs-field">
              <span>What information should Amplifi look for?</span>
              <textarea
                rows={4}
                value={strategy.researchFocus ?? ''}
                onChange={(event) => setStrategy({ ...strategy, researchFocus: event.target.value })}
                placeholder="Look for recent statistics, common questions, local trends, new rules, upcoming events, or examples that matter to this audience."
              />
            </label>
            <label className="cs-field">
              <span>Are there sources you want Amplifi to use first? Add URLs or website names, separated by commas or new lines.</span>
              <textarea
                rows={3}
                value={trustedSources}
                onChange={(event) => setTrustedSources(event.target.value)}
                placeholder="https://example.org/report, local chamber of commerce, industry association"
              />
            </label>
          </div>

          <div className="cs-field-row">
            <label className="cs-field">
              <span>How will you know it worked?</span>
              <input
                value={strategy.successMetric}
                onChange={(event) => setStrategy({ ...strategy, successMetric: event.target.value })}
                placeholder="Registrations"
              />
            </label>
            <label className="cs-field">
              <span>What result are you aiming for?</span>
              <input
                type="number"
                min="1"
                value={strategy.successTarget ?? ''}
                onChange={(event) =>
                  setStrategy({
                    ...strategy,
                    successTarget: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
                placeholder="50"
              />
            </label>
          </div>

          {error ? <p className="cs-error" role="alert">{error}</p> : null}
          <button
            type="button"
            className="cs-primary"
            disabled={loading || story.trim().length < 12}
            onClick={() => void generateCampaign()}
          >
            Create my campaign
          </button>
        </section>
      ) : null}

      {step === 'generating' ? (
        <section className="cs-section cs-panel cs-loading">
          <p className="cs-loading-title">Amplifi is shaping your campaign…</p>
          <p className="cs-hint">Checking the information you requested, reviewing sources, finding campaign images, and creating a different post for each platform.</p>
        </section>
      ) : null}
    </main>
  );
}
