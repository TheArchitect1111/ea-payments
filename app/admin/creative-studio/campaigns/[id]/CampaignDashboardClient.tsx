'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import type { BrandProfile, CreativeCampaign, PublishResult } from '@/lib/creative-studio/types';
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
    const cached = readCachedCampaign(campaignId);
    if (cached) {
      setCampaign(cached);
      return;
    }

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

  const unpublished = campaign.assets.filter((a) => a.status !== 'published').length;

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
          {unpublished > 0 ? (
            <button type="button" className="cs-secondary" disabled={publishAllBusy} onClick={() => void publishAll()}>
              {publishAllBusy ? 'Publishing…' : `Publish all (${unpublished})`}
            </button>
          ) : null}
        </div>
      </header>

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
              {asset.status !== 'published' && asset.publishDestination ? (
                <button
                  type="button"
                  className="cs-publish-btn"
                  disabled={publishing === asset.id}
                  onClick={() => void publishAsset(asset.id)}
                >
                  {publishing === asset.id ? 'Publishing…' : 'Publish'}
                </button>
              ) : null}
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
