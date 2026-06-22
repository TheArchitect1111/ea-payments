'use client';

import { useState } from 'react';
import type { AmplifiSocialDraft } from '@/lib/amplifi-draft';

type DraftTab = 'linkedin' | 'email' | 'sms' | 'caption';

export default function StoryDraftPanel({ draft }: { draft: AmplifiSocialDraft }) {
  const [tab, setTab] = useState<DraftTab>('linkedin');
  const [copied, setCopied] = useState(false);

  const textForTab = (): string => {
    if (tab === 'email' && draft.email) return draft.email;
    if (tab === 'sms' && draft.sms) return draft.sms;
    if (tab === 'caption') return draft.shortCaption;
    return draft.linkedIn;
  };

  const copy = async () => {
    await navigator.clipboard.writeText(textForTab());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: DraftTab; label: string; show: boolean }[] = [
    { id: 'linkedin', label: 'LinkedIn', show: true },
    { id: 'email', label: 'Email', show: Boolean(draft.email) },
    { id: 'sms', label: 'SMS', show: Boolean(draft.sms) },
    { id: 'caption', label: 'Caption', show: true },
  ];

  return (
    <div className="sdp-panel">
      <p className="sdp-label">Amplifi story drafts</p>
      <div className="sdp-tabs">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sdp-tab${tab === t.id ? ' sdp-tab-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
      </div>
      <pre className="sdp-pre">{textForTab()}</pre>
      <button type="button" className="sdp-copy" onClick={copy}>
        {copied ? 'Copied!' : `Copy ${tabs.find((t) => t.id === tab)?.label ?? 'draft'}`}
      </button>
    </div>
  );
}
