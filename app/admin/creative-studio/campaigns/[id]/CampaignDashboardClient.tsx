'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type {
  BrandProfile,
  CampaignAnalytics,
  CampaignPlatformMetrics,
  CreativeCampaign,
  MediaAsset,
  PublishResult,
  SocialPlatform,
} from '@/lib/creative-studio/types';
import AssetPreview from '../../AssetPreview';
import { cacheCampaign, readCachedCampaign } from '../../campaign-cache';
import '../../creative-studio.css';

const DEFAULT_BRAND: Pick<BrandProfile, 'primaryColor' | 'secondaryColor' | 'organizationName' | 'preferredCta'> = {
  organizationName: 'Efficiency Architects',
  primaryColor: '#1B2B4D',
  secondaryColor: '#C9A844',
  preferredCta: 'Learn more',
};

type Performance = {
  impressions: number;
  reach: number;
  engagements: number;
  clickThroughRate: number | null;
  engagementRate: number | null;
  ctpConversionRate: number | null;
};

function percent(value: number | null): string {
  return value === null ? '—' : `${(value * 100).toFixed(1)}%`;
}

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
  const [analytics, setAnalytics] = useState<CampaignAnalytics | null>(null);
  const [performance, setPerformance] = useState<Performance | null>(null);
  const [metricDrafts, setMetricDrafts] = useState<Partial<Record<SocialPlatform, CampaignPlatformMetrics>>>({});
  const [savingMetrics, setSavingMetrics] = useState<SocialPlatform | null>(null);

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
          if (data.campaign.analytics) setAnalytics(data.campaign.analytics);
          cacheCampaign(data.campaign);
        } else {
          setError(data.error ?? 'Campaign not found.');
        }
      })
      .catch(() => setError('Could not load campaign.'));
  }, [campaignId]);

  useEffect(() => {
    void fetch(`/api/creative-studio/campaigns/${campaignId}/analytics`)
      .then((res) => res.json())
      .then((data: { analytics?: CampaignAnalytics; performance?: Performance }) => {
        if (data.analytics) {
          setAnalytics(data.analytics);
          setMetricDrafts(Object.fromEntries(data.analytics.platformMetrics.map((item) => [item.platform, item])));
        }
        if (data.performance) setPerformance(data.performance);
      })
      .catch(() => undefined);
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

  async function savePlatformMetrics(platform: SocialPlatform) {
    setSavingMetrics(platform);
    try {
      const res = await fetch(`/api/creative-studio/campaigns/${campaignId}/analytics`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, ...(metricDrafts[platform] ?? {}) }),
      });
      const data = (await res.json()) as { analytics?: CampaignAnalytics; performance?: Performance; error?: string };
      if (data.analytics) setAnalytics(data.analytics);
      if (data.performance) setPerformance(data.performance);
      if (data.error) setError(data.error);
    } finally {
      setSavingMetrics(null);
    }
  }

  function updateMetric(platform: SocialPlatform, field: keyof CampaignPlatformMetrics, value: string) {
    setMetricDrafts((current) => ({
      ...current,
      [platform]: {
        platform,
        source: 'manual',
        impressions: 0,
        reach: 0,
        reactions: 0,
        comments: 0,
        shares: 0,
        saves: 0,
        videoViews: 0,
        ...(current[platform] ?? {}),
        [field]: Math.max(0, Number(value) || 0),
      },
    }));
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
          <span className="cs-progress-ring">Campaign readiness {campaign.completionPercent}%</span>
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
            <span>What this campaign should help accomplish</span>
            <strong>{campaign.strategy.objective}</strong>
          </div>
          <div>
            <span>Who it is for</span>
            <strong>{campaign.strategy.audience}</strong>
          </div>
          <div>
            <span>Where it will appear</span>
            <strong>{campaign.strategy.platforms.join(', ')}</strong>
          </div>
          <div>
            <span>What a good result looks like</span>
            <strong>
              {campaign.strategy.successTarget
                ? `${campaign.strategy.successTarget} ${campaign.strategy.successMetric}`
                : campaign.strategy.successMetric}
            </strong>
          </div>
          <div className="cs-strategy-wide">
            <span>What the campaign will talk about</span>
            <strong>{campaign.strategy.contentPillars.join(' · ')}</strong>
          </div>
        </section>
      ) : null}

      {analytics && performance ? (
        <section className="cs-analytics-panel">
          <div className="cs-intelligence-head">
            <div>
              <p className="cs-kicker">Campaign results</p>
              <h2>What happened after people saw the campaign</h2>
            </div>
            <span className="cs-research-status cs-research-complete">First-party tracking active</span>
          </div>
          <div className="cs-metric-grid">
            <div><strong>{performance.reach.toLocaleString()}</strong><span>Reach</span></div>
            <div><strong>{performance.impressions.toLocaleString()}</strong><span>Impressions</span></div>
            <div><strong>{performance.engagements.toLocaleString()}</strong><span>Engagements</span></div>
            <div><strong>{analytics.totals.linkClicks.toLocaleString()}</strong><span>Tracked clicks</span></div>
            <div><strong>{analytics.totals.ctpStarts.toLocaleString()}</strong><span>CTP visits</span></div>
            <div><strong>{analytics.totals.ctpCompletions.toLocaleString()}</strong><span>CTP completions</span></div>
            <div><strong>{percent(performance.clickThroughRate)}</strong><span>Click-through rate</span></div>
            <div><strong>{percent(performance.ctpConversionRate)}</strong><span>Click-to-CTP conversion</span></div>
          </div>
          <p className="cs-hint">
            Amplifi counts tracked link clicks and CTP completions automatically. Reach, impressions, and social
            engagement require platform Insights; enter those totals below until a platform connection is active.
          </p>
          {analytics.byAsset.length ? (
            <div className="cs-top-content">
              <h3>Post performance</h3>
              {[...analytics.byAsset]
                .sort((a, b) => b.ctpCompletions - a.ctpCompletions || b.linkClicks - a.linkClicks)
                .map((item) => {
                  const asset = campaign.assets.find((candidate) => candidate.id === item.assetId);
                  return (
                    <div key={item.assetId}>
                      <span>{asset?.label ?? item.assetId}</span>
                      <strong>{item.linkClicks} clicks · {item.ctpCompletions} completed</strong>
                    </div>
                  );
                })}
            </div>
          ) : null}
          <div className="cs-platform-metrics">
            {campaign.strategy.platforms.map((platform) => {
              const values = metricDrafts[platform];
              return (
                <article key={platform}>
                  <div className="cs-platform-metric-head">
                    <h3>{platform}</h3>
                    <span>{values?.source === 'connected' ? 'Connected' : values?.source === 'manual' ? 'Manual totals' : 'Insights not connected'}</span>
                  </div>
                  <div className="cs-metric-inputs">
                    {(['impressions', 'reach', 'reactions', 'comments', 'shares', 'saves', 'videoViews'] as const).map((field) => (
                      <label key={field}>
                        <span>{field === 'videoViews' ? 'Video views' : field}</span>
                        <input
                          type="number"
                          min="0"
                          value={values?.[field] ?? 0}
                          onChange={(event) => updateMetric(platform, field, event.target.value)}
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="cs-secondary cs-small-btn"
                    disabled={savingMetrics === platform}
                    onClick={() => void savePlatformMetrics(platform)}
                  >
                    {savingMetrics === platform ? 'Saving…' : 'Save platform totals'}
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}


      {campaign.research ? (
        <section className="cs-intelligence-panel">
          <div className="cs-intelligence-head">
            <div>
              <p className="cs-kicker">What Amplifi found</p>
              <h2>Information used to shape the posts</h2>
            </div>
            <span className={`cs-research-status cs-research-${campaign.research.status}`}>
              {campaign.research.status}
            </span>
          </div>
          {campaign.research.summary ? <p className="cs-research-summary">{campaign.research.summary}</p> : null}
          {campaign.research.sources.length ? (
            <div className="cs-source-grid">
              {campaign.research.sources.map((source) => (
                <article key={source.id} className="cs-source-card">
                  <span>{source.domain}</span>
                  <h3>{source.title}</h3>
                  <p>{source.summary}</p>
                  <a href={source.url} target="_blank" rel="noreferrer">See the source ↗</a>
                </article>
              ))}
            </div>
          ) : (
            <p className="cs-hint">Amplifi did not add outside facts. These posts are based only on the information and brand direction you supplied.</p>
          )}
          {campaign.research.warnings.map((warning) => <p className="cs-hint" key={warning}>{warning}</p>)}
        </section>
      ) : null}

      {campaign.imageSuggestions?.length ? (
        <section className="cs-intelligence-panel">
          <div className="cs-intelligence-head">
            <div>
              <p className="cs-kicker">Images for your campaign</p>
              <h2>Visual options matched to the posts</h2>
            </div>
          </div>
          <div className="cs-image-suggestion-grid">
            {campaign.imageSuggestions.map((image) => (
              <article key={image.id} className="cs-image-suggestion">
                <img src={image.thumbnailUrl} alt={image.altText} />
                <div>
                  <strong>{image.title}</strong>
                  <span>{image.source === 'generated' ? 'Generated for this campaign' : `${image.license} · ${image.creator || 'Creator not listed'}`}</span>
                  <small>
                    {image.rightsStatus === 'public-domain-candidate'
                      ? 'Public-domain candidate — confirm the original source before publishing.'
                      : image.rightsStatus === 'generated'
                        ? 'Generated asset stored for this campaign.'
                        : 'License review required before publishing.'}
                  </small>
                  {image.sourceUrl ? <a href={image.sourceUrl} target="_blank" rel="noreferrer">Verify image source ↗</a> : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="cs-intelligence-panel cs-next-step">
        <p className="cs-kicker">Your next step</p>
        <h2>Look through each post and choose what happens next</h2>
        <p className="cs-hint">
          Choose “Check this post” when you are ready to make a decision. Then choose “Use this post” or send it
          back for changes. Nothing publishes until you choose Publish now or schedule it.
        </p>
      </section>

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
                  <label htmlFor={`media-${asset.id}`}>Choose an image or video for this post</label>
                  <select
                    id={`media-${asset.id}`}
                    value={asset.mediaIds?.[0] ?? ''}
                    disabled={attaching === asset.id}
                    onChange={(event) => void attachMedia(asset.id, event.target.value)}
                  >
                    <option value="">Choose media…</option>
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
                    <p className="cs-hint">Add media before this post can be published.</p>
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
                    Check this post
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
                      Use this post
                    </button>
                    <button
                      type="button"
                      className="cs-secondary cs-small-btn"
                      disabled={workflowBusy !== null}
                      onClick={() => void runWorkflow('reject', asset.id)}
                    >
                      Send back for changes
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
        <h3>Your campaign timeline</h3>
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
                <p className="cs-hint">{item.assetIds.length} posts planned</p>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
