'use client';

import { useState } from 'react';
import { type EAPlatformId, GUIDED_PLATFORMS } from '@/lib/guided-first-success';

const ANSWERS: Record<string, string> = {
  'What should I capture?': 'Start with one thing you do not want to lose: a website, flyer, screenshot, social profile, offer, event, or resource.',
  'How does Magnifi work?': 'After you capture, Magnifi creates a preview story automatically. You can preview it after Simplifi finishes analyzing.',
  'What do I do after capture?': 'Review the summary, copy the story link, then decide whether to share it or save it for later follow-up.',
};

export default function UniversalCoachPanel({ platformId }: { platformId: EAPlatformId }) {
  const config = GUIDED_PLATFORMS[platformId];
  const [open, setOpen] = useState(false);
  const [answer, setAnswer] = useState('Paste a link or upload a screenshot. That is the whole first step.');
  const prompts = platformId === 'simplifi'
    ? ['What should I capture?', 'How does Magnifi work?', 'What do I do after capture?']
    : config.coachPrompts;

  return (
    <>
      <button type="button" className="uc-fab" onClick={() => setOpen((value) => !value)}>
        Help
      </button>
      {open ? (
        <div className="uc-panel" role="dialog" aria-label={`${config.name} help`}>
          <h3>Simplifi Help</h3>
          <p className="uc-answer">{answer}</p>
          {prompts.map((prompt) => (
            <button
              key={prompt}
              type="button"
              className="uc-prompt"
              onClick={() => setAnswer(ANSWERS[prompt] ?? 'Start with the primary action on this screen. If you are unsure, capture one link first.')}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : null}
    </>
  );
}
