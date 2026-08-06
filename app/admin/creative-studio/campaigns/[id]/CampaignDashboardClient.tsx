'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BrandProfile, CreativeCampaign, MediaAsset, PublishResult } from '@/lib/creative-studio/types';
import AssetPreview from '../../AssetPreview';
import { cacheCampaign, readCachedCampaign } from '../../campaign-cache';
import '../../creative-studio.css';

const DEFAULT_BRAND: Pick<BrandProfile, 'primaryColor' | 'secondaryColor' | 'organizationName' | 'preferredCta'> = {
  organizationName: 'Efficiency Architects',
  primaryColor: '#1B2B4D',
  secondaryColor: '#C9A844',
  preferredCta: 'Learn more',
};

export default function CampaignDashboardClient({ campaignId }: { campaignId: string }) {
  const [campaign, setCampaign] = useState<CreativeCampaign | null>(null);
  const [brand, setBrand] = useState(DEFAULT_BRAND);
  const [error, setError] = useState('');
  const [publishNotes, setPublishNotes] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState<string | null>(null);
  const [publishAllBusy, setPublishAllBusy] = useState(false);
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [attaching, setAttaching] = useState<string | null>(null);
  const [workflowBusy, setWorkflowBusy] = useState<string | null>(null);
  const [scheduleTimes, setScheduleTimes] = useState<Record<string, string>>({});
  const [timezone, setTimezone] = useState('America/New_York');

  useEffect(() => {
    void fetch('/api/creative-studio/brand')
      .then((res) => res.json())
      .then((data: { brand?: BrandProfile }) => {
        if (data.brand) {
          setBrand({
            organizationName: data.brand.organizationName,
            primaryColor: data.brand.primaryColor,
            secondaryColor: data.brand.secondaryColor,
            preferredCta: data.brand.preferredCta,
          });
        }
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    void fetch('/api/creative-studio/media')
      .then((res) => res.json())
      .then((data: { media?: MediaAsset[] }) => setMedia(data.media ?? []))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    const cached = readCachedCampaign(campaignId);
    if (cached) setCampaign(cached);

    void fetch(`/api/creative-studio/campaigns/${campaignId}`)
      .then((res) => res.json())
      .then((data: { ok?: boolean; campaign?: CreativeCampaign; error?: string }) => {
        if (data.campaign) {
          setCampaign(data.campaign);
          cacheCampaign(data.campaign);
        } else {
          setError(data.error ?? 'Campaign not found.');
        }
      })
      .catch(() => setError('Could not load campaign.'));
  }, [campaignId]);

  async function runWorkflow(
    action: 'submit-review' | 'approve' | 'reject' | 'schedule' | 'cancel-schedule' | 'pause-campaign' | 'resume-campaign',
    assetId?: string,
  ) {
    const key = assetId ? `${action}:${assetId}` : action;
    setWorkflowBusy(key);
    try {
      const localTime = assetId ? scheduleTimes[assetId] : undefined;
      const publishAt = localTime ? new Date(localTime).toISOString() : undefined;
      const res = await fetch(`/api/creative-studio/campaigns/${campaignId}/workflow`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, assetId, publishAt, timezone }),
      });
      const data = (await res.json()) as { campaign?: CreativeCampaign; error?: string };
      if (data.campaign) {
        setCampaign(data.campaign);
        cacheCampaign(data.campaign);
      }
      if (assetId) {
        setPublishNotes((current) => ({
          ...current,
          [assetId]: data.error ?? `Workflow updated: ${action}.`,
        }));
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      if (assetId) {
        setPublishNotes((current) => ({ ...current, [assetId]: 'Workflow update failed.' }));
      }
    } finally {
      setWorkflowBusy(null);
    }
  }

  async function attachMedia(assetId: string, mediaId: string) {
    if (!mediaId) return;
    setAttaching(assetId);
    try {
      const res = await fetch(`/api/creative-studio/campaigns/${campaignId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId, mediaId }),
      });
      const data = (await res.json()) as {
        campaign?: CreativeCampaign;
        error?: string;
        mediaValidation?: { valid: boolean; errors: string[]; warnings: string[] };
      };
      if (data.campaign) {
        setCampaign(data.campaign);
        cacheCampaign(data.campaign);
      }
      setPublishNotes((current) => ({
        ...current,
        [assetId]:
          data.error ??
          (data.mediaValidation?.valid
            ? 'Media validated and attached.'
            : data.mediaValidation?.errors.join(' ')) ??
          'Media validation failed.',
      }));
    } catch {
      setPublishNotes((current) => ({ ...current, [assetId]: 'Could not attach media.' }));
    } finally {
      setAttaching(null);
    }
  }

  async function publishAsset(assetId: string) {
    setPublishing(assetId);
    try {
      const res = await fetch(`/api/creative-studio/campaigns/${campaignId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetId }),
      });
      const data = (await res.json()) as {
        campaign?: CreativeCampaign;
        publish?: PublishResult;
        error?: string;
      };
      if (data.campaign) {
        setCampaign(data.campaign);
        cacheCampaign(data.campaign);
      }
      setPublishNotes((prev) => ({
        ...prev,
        [assetId]: data.publish?.detail ?? data.error ?? 'Publish failed.',
      }));
    } catch {
      setPublishNotes((prev) => ({ ...prev, [assetId]: 'Network error during publish.' }));
    } finally {
      setPublishing(null);
    }
  }

  async function publishAll() {
    setPublishAllBusy(true);
    try {
      const res = await fetch(`/api/creative-studio/campaigns/${campaignId}/publish-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = (await res.json()) as {
        campaign?: CreativeCampaign;
        results?: Array<{ assetId: string; label: string; result: PublishResult }>;
      };
      if (data.campaign) {
        setCampaign(data.campaign);
        cacheCampaign(data.campaign);
      }
      if (data.results) {
        setPublishNotes((prev) => {
          const next = { ...prev };
          for (const row of data.results!) {
            next[row.assetId] = row.result.detail;
          }
          return next;
        });
      }
    } finally {
      setPublishAllBusy(false);
    }
  }

  if (error) {
    return (
      <main className="cs-page">
        <p className="cs-error">{error}</p>
        <Link href="/admin/creative-studio" className="cs-back">
          ← Start a new campaign
        </Link>
      </main>
    );
  }

  if (!campaign) {
    return (
      <main className="cs-page cs-loading">
        <p className="cs-loading-title">Loading campaign…</p>
      </main>
    );
  }

  const publishable = campaign.assets.filter((asset) => asset.status === 'approved').length;

  return (
    <main className="cs-page">
      <header className="cs-campaign-header">
        <nav className="cs-subnav">
          <Link href="/admin/creative-studio">Campaigns</Link>
          <Link href="/admin/creative-studio/media">Media</Link>
          <Link href="/admin/creative-studio/brand">Brand</Link>
        </nav>
        <p className="cs-kicker">{campaign.goalLabel}</p>
        <h1 className="cs-title">{campaign.brief.title}</h1>
        <p className="cs-lede">{campaign.brief.summary}</p>
        <div className="cs-header-actions">
          <span className="cs-progress-ring">Completion {campaign.completionPercent}%</span>
          {publishable > 0 && !campaign.paused ? (
            <button type="button" className="cs-secondary" disabled={publishAllBusy} onClick={() => void publishAll()}>
              {publishAllBusy ? 'Publishing…' : `Publish approved (${publishable})`}
            </button>
          ) : null}
          <button
            type="button"
            className="cs-secondary"
            disabled={workflowBusy === 'pause-campaign' || workflowBusy === 'resume-campaign'}
            onClick={() => void runWorkflow(campaign.paused ? 'resume-campaign' : 'pause-campaign')}
          >
            {campaign.paused ? 'Resume campaign' : 'Pause campaign'}
          </button>
          {campaign.paused ? <span className="cs-error">Publishing paused</span> : null}
        </div>
      </header>

      {campaign.strategy ? (
        <section className="cs-strategy-card">
          <div>
            <span>Objective</span>
            <strong>{campaign.strategy.objective}</strong>
          </div>
          <div>
            <span>Audience</span>
            <strong>{campaign.strategy.audience}</strong>
          </div>
          <div>
            <span>Platforms</span>
            <strong>{campaign.strategy.platforms.join(', ')}</strong>
          </div>
          <div>
            <span>Success</span>
            <strong>
              {campaign.strategy.successTarget
                ? `${campaign.strategy.successTarget} ${campaign.strategy.successMetric}`
                : campaign.strategy.successMetric}
            </strong>
          </div>
          <div className="cs-strategy-wide">
            <span>Content pillars</span>
            <strong>{campaign.strategy.contentPillars.join(' · ')}</strong>
          </div>
        </section>
      ) : null}

      <section className="cs-asset-grid">
        {campaign.assets.map((asset) => (
          <article key={asset.id} className="cs-asset-card">
            <AssetPreview asset={asset} brand={brand} />
            <div className="cs-asset-meta">
              <p>{asset.channel}</p>
              <h4>{asset.label}</h4>
              <span className={`cs-status cs-status-${asset.status}`}>{asset.status}</span>
              {asset.publishDestination ? (
                <p className="cs-hint cs-publish-dest">→ {asset.publishDestination}</p>
              ) : null}
              {asset.type === 'social-facebook' || asset.type === 'social-instagram' ? (
                <div className="cs-media-attach">
                  <label htmlFor={`media-${asset.id}`}>Campaign media</label>
                  <select
                    id={`media-${asset.id}`}
                    value={asset.mediaIds?.[0] ?? ''}
                    disabled={attaching === asset.id}
                    onChange={(event) => void attachMedia(asset.id, event.target.value)}
                  >
                    <option value="">Select validated media…</option>
                    {media
                      .filter((item) => item.kind === 'image' || item.kind === 'video')
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                  </select>
                  {asset.mediaValidation ? (
                    <p className={asset.mediaValidation.valid ? 'cs-success' : 'cs-error'}>
                      {asset.mediaValidation.valid
                        ? 'Media ready'
                        : asset.mediaValidation.errors.join(' ')}
                    </p>
                  ) : (
                    <p className="cs-hint">Required before publishing.</p>
                  )}
                </div>
              ) : null}
              <div className="cs-workflow-actions">
                {['ready', 'blocked', 'draft'].includes(asset.status) ? (
                  <button
                    type="button"
                    className="cs-publish-btn"
                    disabled={workflowBusy !== null}
                    onClick={() => void runWorkflow('submit-review', asset.id)}
                  >
                    Submit for review
                  </button>
                ) : null}
                {asset.status === 'review' ? (
                  <>
                    <button
                      type="button"
                      className="cs-publish-btn"
                      disabled={workflowBusy !== null}
                      onClick={() => void runWorkflow('approve', asset.id)}
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      className="cs-secondary cs-small-btn"
                      disabled={workflowBusy !== null}
                      onClick={() => void runWorkflow('reject', asset.id)}
                    >
                      Return to draft
                    </button>
                  </>
                ) : null}
                {asset.status === 'approved' ? (
                  <>
                    <button
                      type="button"
                      className="cs-publish-btn"
                      disabled={publishing === asset.id || campaign.paused}
                      onClick={() => void publishAsset(asset.id)}
                    >
                      {publishing === asset.id ? 'Publishing…' : 'Publish now'}
                    </button>
                    <div className="cs-schedule-controls">
                      <input
                        type="datetime-local"
                        value={scheduleTimes[asset.id] ?? ''}
                        onChange={(event) =>
                          setScheduleTimes((current) => ({ ...current, [asset.id]: event.target.value }))
                        }
                      />
                      <select value={timezone} onChange={(event) => setTimezone(event.target.value)}>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="America/Toronto">Toronto Time</option>
                      </select>
                      <button
                        type="button"
                        className="cs-secondary cs-small-btn"
                        disabled={!scheduleTimes[asset.id] || workflowBusy !== null}
                        onClick={() => void runWorkflow('schedule', asset.id)}
                      >
                        Schedule
                      </button>
                    </div>
                  </>
                ) : null}
                {asset.status === 'scheduled' ? (
                  <>
                    <p className="cs-success">
                      Scheduled {asset.schedule ? new Date(asset.schedule.publishAt).toLocaleString() : ''}
                    </p>
                    <button
                      type="button"
                      className="cs-secondary cs-small-btn"
                      disabled={workflowBusy !== null}
                      onClick={() => void runWorkflow('cancel-schedule', asset.id)}
                    >
                      Cancel schedule
                    </button>
                  </>
                ) : null}
              </div>
              {publishNotes[asset.id] ? <p className="cs-publish-note">{publishNotes[asset.id]}</p> : null}
            </div>
          </article>
        ))}
      </section>

      <section className="cs-timeline">
        <h3>Smart campaign timeline</h3>
        <ol>
          {campaign.timeline.map((item) => (
            <li key={item.id}>
              <span className="cs-timeline-day">
                {item.offsetDays === 0
                  ? 'Today'
                  : item.offsetDays < 0
                    ? `${Math.abs(item.offsetDays)}d before`
                    : `Day +${item.offsetDays}`}
              </span>
              <div>
                <strong>{item.label}</strong>
                <p className="cs-hint">{item.assetIds.length} assets scheduled</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
