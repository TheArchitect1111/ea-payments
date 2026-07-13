'use client';

import { ASSISTANT_LABELS } from '@/lib/assistant/constants';
import type { AdvisorBriefDetails } from '@/lib/assistant/types';

type AssistantDetailsProps = {
  details: AdvisorBriefDetails;
  onBack: () => void;
};

export default function AssistantDetails({ details, onBack }: AssistantDetailsProps) {
  return (
    <div className="ea-assistant-details">
      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">{ASSISTANT_LABELS.today}</p>
        <ul className="ea-assistant-why-list">
          {details.today.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">{ASSISTANT_LABELS.aboutPage}</p>
        <p>{details.aboutPage}</p>
      </div>

      {details.organization.length > 0 ? (
        <div className="ea-assistant-section">
          <p className="ea-assistant-section-label">{ASSISTANT_LABELS.organization}</p>
          <ul className="ea-assistant-why-list">
            {details.organization.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {details.wins.length > 0 ? (
        <div className="ea-assistant-section">
          <p className="ea-assistant-section-label">{ASSISTANT_LABELS.wins}</p>
          <ul className="ea-assistant-why-list">
            {details.wins.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ea-assistant-footer" style={{ borderTop: 0, padding: '16px 0 0' }}>
        <button type="button" className="ea-assistant-btn" onClick={onBack}>
          {ASSISTANT_LABELS.backToBrief}
        </button>
      </div>
    </div>
  );
}
