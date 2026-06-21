'use client';

import { useEffect, useState } from 'react';
import type { OpportunityExperiencePayload } from '@/lib/opportunity-experience';
import './consider.css';

const GOLD = '#C9A844';

interface Props {
  payload: OpportunityExperiencePayload;
  captureId: string;
  slug: string;
}

export default function ConsiderExperience({ payload, captureId, slug }: Props) {
  const [copied, setCopied] = useState(false);
  const { analysis, magnifi, extraction } = payload;
  const scores = analysis.scores;

  useEffect(() => {
    const start = Date.now();
    fetch(`/api/consider/${slug}/view`, { method: 'POST' }).catch(() => {});

    return () => {
      const seconds = Math.round((Date.now() - start) / 1000);
      if (seconds > 2) {
        fetch(`/api/consider/${slug}/view`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ timeOnPageSeconds: seconds }),
        }).catch(() => {});
      }
    };
  }, [slug]);

  const copyMessage = async () => {
    await navigator.clipboard.writeText(payload.clientMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scoreItems = [
    ['Visibility', scores.visibility],
    ['Exposure', scores.exposure],
    ['Conversion', scores.conversion],
    ['Differentiation', scores.differentiation],
    ['Modernity', scores.modernity],
    ['Trust', scores.trust],
  ] as const;

  return (
    <div className="cx-page">
      <header className="cx-hero">
        <p className="cx-eyebrow">Consider The Possibilities™</p>
        <h1 className="cx-title">{payload.businessName}</h1>
        <p className="cx-subtitle">Complimentary Opportunity Experience · Business analysis, not design critique</p>
      </header>

      <section className="cx-section">
        <h2 className="cx-h2">Opportunity Scores</h2>
        <div className="cx-score-grid">
          {scoreItems.map(([label, value]) => (
            <div key={label} className="cx-score-card">
              <span className="cx-score-label">{label}</span>
              <span className="cx-score-value">{value}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="cx-section cx-two-col">
        <div>
          <h2 className="cx-h2">Current State</h2>
          <p className="cx-body">{magnifi.currentState}</p>
        </div>
        <div>
          <h2 className="cx-h2">Extracted Signals</h2>
          <ul className="cx-list">
            {extraction.businessName && <li>Business: {extraction.businessName}</li>}
            {extraction.industry && <li>Industry: {extraction.industry}</li>}
            {extraction.audience && <li>Audience: {extraction.audience}</li>}
            {extraction.cta && <li>CTA signal: {extraction.cta}</li>}
            {extraction.contactInfo && <li>Contact: {extraction.contactInfo}</li>}
            {extraction.website && (
              <li>
                Website:{' '}
                <a href={extraction.website} target="_blank" rel="noopener noreferrer">
                  {extraction.website}
                </a>
              </li>
            )}
          </ul>
        </div>
      </section>

      <section className="cx-section">
        <h2 className="cx-h2">Opportunity Analysis</h2>
        <p className="cx-body">{magnifi.opportunityAnalysis}</p>
        <div className="cx-pill-row">
          {analysis.strengths.map((s) => (
            <span key={s} className="cx-pill cx-pill-good">
              {s}
            </span>
          ))}
          {analysis.missedOpportunities.map((s) => (
            <span key={s} className="cx-pill cx-pill-warn">
              {s}
            </span>
          ))}
        </div>
      </section>

      <section className="cx-section">
        <h2 className="cx-h2">Estimated Impact</h2>
        <div className="cx-estimate-grid">
          <div className="cx-estimate">
            <p className="cx-estimate-label">Revenue left on table</p>
            <p className="cx-estimate-value">
              ${analysis.estimates.revenueLeftOnTable.low.toLocaleString()}–$
              {analysis.estimates.revenueLeftOnTable.high.toLocaleString()}
            </p>
            <p className="cx-assumption">{analysis.estimates.revenueLeftOnTable.assumption}</p>
          </div>
          <div className="cx-estimate">
            <p className="cx-estimate-label">Leads potentially missed / month</p>
            <p className="cx-estimate-value">
              {analysis.estimates.leadsMissed.low}–{analysis.estimates.leadsMissed.high}
            </p>
            <p className="cx-assumption">{analysis.estimates.leadsMissed.assumption}</p>
          </div>
          <div className="cx-estimate">
            <p className="cx-estimate-label">Engagement loss</p>
            <p className="cx-estimate-value">
              {analysis.estimates.engagementLoss.low}–{analysis.estimates.engagementLoss.high}%
            </p>
            <p className="cx-assumption">{analysis.estimates.engagementLoss.assumption}</p>
          </div>
        </div>
      </section>

      <section className="cx-section">
        <h2 className="cx-h2">Future State</h2>
        <p className="cx-body">{magnifi.futureState}</p>
      </section>

      <section className="cx-section cx-grid-3">
        <div>
          <h3 className="cx-h3">3 Strategic Opportunities</h3>
          <ul className="cx-list">{magnifi.strategicOpportunities.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
        <div>
          <h3 className="cx-h3">3 Creative Directions</h3>
          <ul className="cx-list">{magnifi.creativeDirections.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
        <div>
          <h3 className="cx-h3">3 Quick Wins</h3>
          <ul className="cx-list">{magnifi.quickWins.map((i) => <li key={i}>{i}</li>)}</ul>
        </div>
      </section>

      <section className="cx-section cx-possibilities">
        <h2 className="cx-h2">Consider The Possibilities™</h2>
        {magnifi.considerThePossibilities.split('\n\n').map((para) => (
          <p key={para.slice(0, 40)} className="cx-body">
            {para}
          </p>
        ))}
      </section>

      <section className="cx-section cx-cta-block">
        <h2 className="cx-h2">Recommended Next Steps</h2>
        <p className="cx-body">No purchase required to begin. Start with clarity.</p>
        <div className="cx-cta-row">
          <a href="/assessment" className="cx-cta cx-cta-primary">
            Take the Capacity Impact Assessment™
          </a>
          <a
            href="https://calendly.com/freedom-efficiencyarchitects/30min"
            target="_blank"
            rel="noopener noreferrer"
            className="cx-cta cx-cta-secondary"
          >
            Schedule Discovery Conversation
          </a>
          <a href="/assessment" className="cx-cta cx-cta-tertiary">
            Request Blueprint
          </a>
        </div>
        <div className="cx-links-row">
          <a href={`/magnifi/${captureId}`} className="cx-link">
            Full Magnifi™ cinematic experience →
          </a>
          <a href={`/simplifi/guidance/${captureId}`} className="cx-link">
            Simplifi™ guided journey →
          </a>
        </div>
      </section>

      <section className="cx-section cx-message">
        <h2 className="cx-h2">Share This Experience</h2>
        <pre className="cx-message-pre">{payload.clientMessage}</pre>
        <div className="cx-action-row">
          <button type="button" className="cx-cta cx-cta-secondary" onClick={copyMessage}>
            {copied ? 'Copied!' : 'Copy client message'}
          </button>
          <button type="button" className="cx-cta cx-cta-tertiary" onClick={() => window.print()}>
            Download PDF
          </button>
        </div>
      </section>

      <footer className="cx-footer">
        <p style={{ color: GOLD }}>Efficiency Architects</p>
        <p>Opportunity Experience · Stored in Pulse™</p>
      </footer>
    </div>
  );
}
