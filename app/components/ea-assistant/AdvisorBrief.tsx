'use client';

import Link from 'next/link';
import type { EAGuideAction } from '@/lib/ea-guide';
import { ASSISTANT_LABELS } from '@/lib/assistant/constants';
import type { AdvisorBriefModel } from '@/lib/assistant/types';

type AdvisorBriefProps = {
  brief: AdvisorBriefModel;
  onAction: (action: EAGuideAction) => void;
  onGetGuidance: () => void;
  onViewDetails: () => void;
};

export default function AdvisorBrief({ brief, onAction, onGetGuidance, onViewDetails }: AdvisorBriefProps) {
  return (
    <div className="ea-assistant-brief">
      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">Situation</p>
        <p>{brief.situation}</p>
      </div>

      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">Recommendation</p>
        <strong>{brief.recommendation}</strong>
        <p>{brief.recommendationDetail}</p>
      </div>

      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">Why</p>
        <ul className="ea-assistant-why-list">
          {brief.whyBullets.slice(0, 3).map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="ea-assistant-actions">
        {brief.primaryAction ? (
          <ActionButton action={brief.primaryAction} onAction={onAction} primary />
        ) : null}
        {brief.secondaryAction ? (
          <ActionButton action={brief.secondaryAction} onAction={onAction} />
        ) : null}
      </div>

      <div className="ea-assistant-footer" style={{ borderTop: 0, padding: '16px 0 0' }}>
        <button type="button" className="ea-assistant-btn ea-assistant-btn-primary" onClick={onGetGuidance}>
          {ASSISTANT_LABELS.getGuidance}
        </button>
        <button type="button" className="ea-assistant-btn ea-assistant-btn-muted" onClick={onViewDetails}>
          {ASSISTANT_LABELS.viewDetails}
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  action,
  onAction,
  primary = false,
}: {
  action: EAGuideAction;
  onAction: (action: EAGuideAction) => void;
  primary?: boolean;
}) {
  const className = `ea-assistant-btn${primary ? ' ea-assistant-btn-primary' : ''}`;

  if (action.kind === 'href' && action.href) {
    return (
      <Link href={action.href} className={className}>
        {action.label}
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={() => onAction(action)}>
      {action.label}
    </button>
  );
}
