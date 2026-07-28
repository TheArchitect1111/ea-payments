'use client';

import type { AdvisorBriefDetails } from '@/lib/assistant/types';
import { useAssistantLabels } from './assistant-labels';

type AssistantDetailsProps = {
  details: AdvisorBriefDetails;
  onBack: () => void;
};

export default function AssistantDetails({ details, onBack }: AssistantDetailsProps) {
  const labels = useAssistantLabels();
  return (
    <div className="ea-assistant-details">
      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">{labels.today}</p>
        <ul className="ea-assistant-why-list">
          {details.today.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div className="ea-assistant-section">
        <p className="ea-assistant-section-label">{labels.aboutPage}</p>
        <p>{details.aboutPage}</p>
      </div>

      {details.organization.length > 0 ? (
        <div className="ea-assistant-section">
          <p className="ea-assistant-section-label">{labels.organization}</p>
          <ul className="ea-assistant-why-list">
            {details.organization.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {details.wins.length > 0 ? (
        <div className="ea-assistant-section">
          <p className="ea-assistant-section-label">{labels.wins}</p>
          <ul className="ea-assistant-why-list">
            {details.wins.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="ea-assistant-footer" style={{ borderTop: 0, padding: '16px 0 0' }}>
        <button type="button" className="ea-assistant-btn" onClick={onBack}>
          {labels.backToBrief}
        </button>
      </div>
    </div>
  );
}
