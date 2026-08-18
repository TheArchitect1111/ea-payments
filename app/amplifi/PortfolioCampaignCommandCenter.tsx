'use client';

import { useEffect, useState } from 'react';
import type { CampaignArchitecture } from '@/lib/creative-studio/types';
import type { PortfolioCampaignPost } from '@/lib/amplifi-campaign-command';
import { findPortfolioScheduleConflicts } from '@/lib/amplifi-campaign-command';

type ProductResult = { productId: string; productName: string; linkClicks: number; ctpStarts: number; ctpCompletions: number };

export default function PortfolioCampaignCommandCenter({ campaignId, architecture, posts, approvedPostIndexes, schedule }: {
  campaignId?: string;
  architecture: CampaignArchitecture;
  posts: PortfolioCampaignPost[];
  approvedPostIndexes: number[];
  schedule: Record<number, string>;
}) {
  const [showManagement, setShowManagement] = useState(false);
  const [productResults, setProductResults] = useState<ProductResult[]>([]);
  useEffect(() => {
    if (!campaignId) return;
    void fetch(`/api/portal/amplifi/campaigns/${encodeURIComponent(campaignId)}/analytics`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data: { products?: ProductResult[] } | null) => setProductResults(data?.products ?? []))
      .catch(() => undefined);
  }, [campaignId]);
  const currentWave = architecture.waves.find((wave) => wave.status === 'active') || architecture.waves.find((wave) => wave.status === 'planned') || architecture.waves[0];
  const scheduledCount = Object.values(schedule).filter(Boolean).length;
  const conflicts = findPortfolioScheduleConflicts(posts, schedule, architecture);
  const productsWithoutContent = architecture.products.filter((product) => !posts.some((post) => post.productId === product.id));
  const nextAction = productsWithoutContent.length ? `Add content for ${productsWithoutContent[0].name}` : approvedPostIndexes.length < posts.length ? `Review post ${approvedPostIndexes.length + 1}` : scheduledCount < posts.length ? 'Schedule the approved posts' : conflicts.length ? 'Resolve schedule conflicts' : 'Campaign schedule is ready';

  return <section className="af-command-center" aria-label="Campaign Command Center">
    <header className="af-command-head"><div><span className="af-eyebrow">Campaign Command Center</span><h3>{architecture.masterName}</h3><p>{architecture.masterObjective}</p></div><span className="af-portfolio-chip">{architecture.products.length} products</span></header>
    <div className="af-command-summary">
      <div><span>Current launch wave</span><strong>{currentWave?.name || 'Plan the first wave'}</strong><small>{currentWave?.productIds.length || 0} product{currentWave?.productIds.length === 1 ? '' : 's'} included</small></div>
      <div><span>Next action</span><strong>{nextAction}</strong><small>Amplifi keeps the campaign moving one decision at a time.</small></div>
      <div><span>Results</span><strong>{approvedPostIndexes.length} approved · {scheduledCount} scheduled</strong><small>Live reach and conversions appear after publishing.</small></div>
    </div>
    <button type="button" className="af-manage-campaign" aria-expanded={showManagement} onClick={() => setShowManagement((value) => !value)}>Manage campaign <span>{showManagement ? '−' : '+'}</span></button>
    {showManagement ? <div className="af-command-management">
      <section><div className="af-command-section-head"><div><span className="af-eyebrow">Product tracks</span><h4>Every offer keeps its own audience and next step.</h4></div></div><div className="af-command-products">{architecture.products.map((product) => {
        const audienceNames = architecture.audiences.filter((audience) => product.audienceIds.includes(audience.id)).map((audience) => audience.name);
        const contentCount = posts.filter((post) => post.productId === product.id).length;
        const result = productResults.find((item) => item.productId === product.id);
        return <article key={product.id}><div><strong>{product.name}</strong><span>{product.status}</span></div><p>{audienceNames.join(', ')}</p><small>{contentCount} post{contentCount === 1 ? '' : 's'} · {product.callToAction.label}</small>{result ? <em>{result.linkClicks} clicks · {result.ctpCompletions} conversions</em> : null}</article>;
      })}</div></section>
      <section><div className="af-command-section-head"><div><span className="af-eyebrow">Launch sequence</span><h4>Products move in waves instead of competing at once.</h4></div></div><ol className="af-wave-list">{architecture.waves.map((wave) => <li key={wave.id}><span>{String(wave.sequence).padStart(2, '0')}</span><div><strong>{wave.name}</strong><small>{wave.productIds.map((id) => architecture.products.find((product) => product.id === id)?.name).filter(Boolean).join(' · ')}</small></div><time>{wave.startDate || 'Date not set'}</time></li>)}</ol></section>
      <section><div className="af-command-section-head"><div><span className="af-eyebrow">Master calendar</span><h4>One schedule across every product.</h4></div></div><div className="af-master-calendar">{posts.map((post, index) => {
        const product = architecture.products.find((item) => item.id === post.productId);
        const wave = architecture.waves.find((item) => item.id === post.waveId);
        return <div key={`${post.title}-${index}`}><span>{schedule[index] ? new Date(schedule[index]).toLocaleString() : 'Not scheduled'}</span><strong>{post.title}</strong><small>{product?.name || 'Master campaign'} · {wave?.name || 'Wave not assigned'}</small></div>;
      })}</div>{conflicts.length ? <div className="af-schedule-conflicts" role="alert"><strong>Resolve before scheduling</strong>{conflicts.map((conflict) => <p key={conflict}>{conflict}</p>)}</div> : <p className="af-command-clear">No audience or launch-wave conflicts detected.</p>}</section>
    </div> : null}
  </section>;
}
