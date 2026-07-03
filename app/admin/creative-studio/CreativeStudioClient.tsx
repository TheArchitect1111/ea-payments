'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CAMPAIGN_GOALS } from '@/lib/creative-studio/goals';
import type { CampaignGoalId, CreativeCampaign } from '@/lib/creative-studio/types';
import { cacheCampaign } from './campaign-cache';
import './creative-studio.css';

type Step = 'goal' | 'story' | 'generating';

export default function CreativeStudioClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('goal');
  const [goalId, setGoalId] = useState<CampaignGoalId | null>(null);
  const [story, setStory] = useState('');
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

  async function generateCampaign() {
    if (!goalId) return;
    setLoading(true);
    setError('');
    setStep('generating');

    try {
      const res = await fetch('/api/creative-studio/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goalId, story }),
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
        <h1 className="cs-title">Create Once. Publish Everywhere.™</h1>
        <p className="cs-lede">
          Start with what you want to accomplish — not what you want to design. EA turns one story into a full
          communication campaign.
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
          <h2 className="cs-question">What would you like to accomplish today?</h2>
          <div className="cs-goal-grid">
            {CAMPAIGN_GOALS.map((goal) => (
              <button
                key={goal.id}
                type="button"
                className="cs-goal-card"
                onClick={() => {
                  setGoalId(goal.id);
                  setStep('story');
                }}
              >
                <span className="cs-goal-emoji" aria-hidden>
                  {goal.emoji}
                </span>
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
          <h2 className="cs-question">Tell us what happened.</h2>
          <p className="cs-hint">
            Example: &ldquo;Our Elite Camp registration opens July 15.&rdquo; or &ldquo;Marcus received an offer from
            Duke.&rdquo;
          </p>
          <textarea
            className="cs-story"
            rows={6}
            value={story}
            onChange={(e) => setStory(e.target.value)}
            placeholder="Explain the situation in your own words…"
          />
          {error ? (
            <p className="cs-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="cs-primary"
            disabled={loading || story.trim().length < 12}
            onClick={() => void generateCampaign()}
          >
            Generate campaign
          </button>
        </section>
      ) : null}

      {step === 'generating' ? (
        <section className="cs-section cs-panel cs-loading">
          <p className="cs-loading-title">Building your communication package…</p>
          <p className="cs-hint">Extracting details, applying brand, and preparing every channel.</p>
        </section>
      ) : null}
    </main>
  );
}
