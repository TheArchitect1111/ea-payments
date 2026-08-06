'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CAMPAIGN_GOALS } from '@/lib/creative-studio/goals';
import type {
  CampaignGoalId,
  CampaignStrategy,
  CreativeCampaign,
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
  tone: 'Clear, warm, and credible',
  successMetric: 'Engagements',
  contentPillars: ['Story', 'Proof', 'Invitation'],
};

export default function CreativeStudioClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [goalId, setGoalId] = useState<CampaignGoalId | null>(null);
  const [story, setStory] = useState('');
  const [strategy, setStrategy] = useState<CampaignStrategy>(DEFAULT_STRATEGY);
  const [pillars, setPillars] = useState('Story, Proof, Invitation');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<CreativeCampaign[]>([]);

  useEffect(() => {
    void fetch('/api/creative-studio/campaigns')
      .then((res) => res.json())
      .then((data: { campaigns?: CreativeCampaign[] }) => {
        if (data.campaigns) setCampaigns(data.campaigns);
      })
      .catch(() => undefined);
  }, []);

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
        <p className="cs-kicker">EA Creative Studio™</p>
        <h1 className="cs-title">Build the campaign before the posts.</h1>
        <p className="cs-lede">
          Define the objective, audience, platforms, dates, message pillars, and success measure. Amplifi then creates
          a distinct package for each selected channel.
        </p>
      </header>

      {campaigns.length > 0 ? (
        <section className="cs-section cs-recent">
          <h2 className="cs-question">Recent campaigns</h2>
          <ul className="cs-campaign-list">
            {campaigns.slice(0, 8).map((campaign) => (
              <li key={campaign.id}>
                <Link href={`/admin/creative-studio/campaigns/${campaign.id}`}>
                  <strong>{campaign.brief.title}</strong>
                  <span>{campaign.goalLabel}</span>
                  <span className="cs-campaign-meta">{campaign.completionPercent}% complete</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {step === 'goal' ? (
        <section className="cs-section">
          <h2 className="cs-question">What should this campaign accomplish?</h2>
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
            ← Choose a different goal
          </button>
          <h2 className="cs-question">Campaign brief</h2>

          <label className="cs-field">
            <span>Objective</span>
            <input
              value={strategy.objective}
              onChange={(event) => setStrategy({ ...strategy, objective: event.target.value })}
              placeholder="Increase registrations for the fall program"
            />
          </label>

          <label className="cs-field">
            <span>Audience</span>
            <input
              value={strategy.audience}
              onChange={(event) => setStrategy({ ...strategy, audience: event.target.value })}
              placeholder="Parents of student-athletes ages 13–18"
            />
          </label>

          <label className="cs-field">
            <span>Story and offer</span>
            <textarea
              className="cs-story"
              rows={6}
              value={story}
              onChange={(event) => setStory(event.target.value)}
              placeholder="Explain what is happening, why it matters, the offer, and the action people should take…"
            />
          </label>

          <div className="cs-field-row">
            <label className="cs-field">
              <span>Start date</span>
              <input
                type="date"
                value={strategy.startDate ?? ''}
                onChange={(event) => setStrategy({ ...strategy, startDate: event.target.value })}
              />
            </label>
            <label className="cs-field">
              <span>End date</span>
              <input
                type="date"
                value={strategy.endDate ?? ''}
                onChange={(event) => setStrategy({ ...strategy, endDate: event.target.value })}
              />
            </label>
          </div>

          <fieldset className="cs-field">
            <span>Platforms</span>
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
            <span>Tone</span>
            <input
              value={strategy.tone}
              onChange={(event) => setStrategy({ ...strategy, tone: event.target.value })}
            />
          </label>

          <label className="cs-field">
            <span>Content pillars — separate with commas</span>
            <input value={pillars} onChange={(event) => setPillars(event.target.value)} />
          </label>

          <div className="cs-field-row">
            <label className="cs-field">
              <span>Success metric</span>
              <input
                value={strategy.successMetric}
                onChange={(event) => setStrategy({ ...strategy, successMetric: event.target.value })}
                placeholder="Registrations"
              />
            </label>
            <label className="cs-field">
              <span>Target</span>
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
            Build campaign package
          </button>
        </section>
      ) : null}

      {step === 'generating' ? (
        <section className="cs-section cs-panel cs-loading">
          <p className="cs-loading-title">Building your campaign package…</p>
          <p className="cs-hint">Researching relevant information, checking sources, finding campaign images, and creating platform-specific posts.</p>
        </section>
      ) : null}
    </main>
  );
}
