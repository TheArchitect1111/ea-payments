'use client';

import { useMemo, useState } from 'react';
import {
  buildWarmIntroductionPackage,
  type WarmIntroductionInput,
  type WarmIntroductionPackage,
} from '@/lib/connect-warm-introduction';

const EMPTY_INPUT: WarmIntroductionInput = {
  referrerName: '',
  prospectName: '',
  organizationName: '',
  relationshipContext: '',
  prospectRelationshipContext: '',
  workSummary: '',
  discovery: '',
  evaSupport: '',
  evaluationUrl: '',
  websiteMockupUrl: '',
  portalMockupUrl: '',
};

const OUTPUTS: Array<{ key: keyof WarmIntroductionPackage; label: string; purpose: string }> = [
  { key: 'contextMessage', label: 'Message to the mutual contact', purpose: 'Explains why the work was created and removes the burden of presenting it.' },
  { key: 'explanationScript', label: 'Explanation for the prospect', purpose: 'Gives the mutual contact brief context before sharing the materials.' },
  { key: 'groupIntroduction', label: 'Group text or email', purpose: 'Makes the warm handoff to Robert.' },
  { key: 'robertFollowUp', label: "Robert's follow-up", purpose: 'Continues the conversation after the introduction.' },
  { key: 'verbalIntroduction', label: '30-second verbal introduction', purpose: 'Works for a phone call or in-person conversation.' },
];

export default function WarmIntroductionBuilder({ canManage }: { canManage: boolean }) {
  const [input, setInput] = useState(EMPTY_INPUT);
  const [generated, setGenerated] = useState(false);
  const [copied, setCopied] = useState('');
  const output = useMemo(() => buildWarmIntroductionPackage(input), [input]);

  if (!canManage) return null;

  function update(key: keyof WarmIntroductionInput, value: string) {
    setInput((current) => ({ ...current, [key]: value }));
    setGenerated(false);
  }

  async function copyOutput(key: keyof WarmIntroductionPackage) {
    await navigator.clipboard.writeText(output[key]);
    setCopied(key);
    window.setTimeout(() => setCopied(''), 1800);
  }

  return (
    <section className="ep-card" style={{ marginTop: 24, display: 'grid', gap: 20 }}>
      <div>
        <p className="ep-welcome-label">Warm introduction package</p>
        <h2 className="ep-card-title">Prepare a referral handoff</h2>
        <p className="ep-pulse-summary">
          Give the mutual contact enough context to open the door. Robert handles the presentation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
        <input className="ep-input" value={input.referrerName} onChange={(e) => update('referrerName', e.target.value)} placeholder="Mutual contact name" />
        <input className="ep-input" value={input.prospectName} onChange={(e) => update('prospectName', e.target.value)} placeholder="Prospect name" />
        <input className="ep-input" value={input.organizationName} onChange={(e) => update('organizationName', e.target.value)} placeholder="Organization name" />
      </div>

      <textarea className="ep-input" rows={2} value={input.relationshipContext} onChange={(e) => update('relationshipContext', e.target.value)} placeholder="Context for the mutual contact (example: you know Terry and understand the scope of her work)" />
      <textarea className="ep-input" rows={2} value={input.prospectRelationshipContext} onChange={(e) => update('prospectRelationshipContext', e.target.value)} placeholder="Context for the prospect (example: I know you and understand the scope of your work)" />
      <textarea className="ep-input" rows={3} value={input.workSummary} onChange={(e) => update('workSummary', e.target.value)} placeholder="Scope of the prospect's work" />
      <textarea className="ep-input" rows={3} value={input.discovery} onChange={(e) => update('discovery', e.target.value)} placeholder="What the evaluation discovered" />
      <textarea className="ep-input" rows={3} value={input.evaSupport} onChange={(e) => update('evaSupport', e.target.value)} placeholder="How Eva would support this organization" />

      <div style={{ display: 'grid', gap: 12, paddingTop: 4, borderTop: '1px solid #e2e8f0' }}>
        <p style={{ margin: 0, fontWeight: 800, fontSize: 14 }}>Materials</p>
        <input className="ep-input" value={input.evaluationUrl} onChange={(e) => update('evaluationUrl', e.target.value)} placeholder="Evaluation link (optional)" />
        <input className="ep-input" value={input.websiteMockupUrl} onChange={(e) => update('websiteMockupUrl', e.target.value)} placeholder="Website mockup link (optional)" />
        <input className="ep-input" value={input.portalMockupUrl} onChange={(e) => update('portalMockupUrl', e.target.value)} placeholder="Portal mockup link (optional)" />
      </div>

      <button
        type="button"
        className="ep-pulse-cta"
        style={{ width: 'fit-content' }}
        disabled={!input.referrerName.trim() || !input.prospectName.trim()}
        onClick={() => setGenerated(true)}
      >
        Generate warm introduction package
      </button>

      {generated ? (
        <div style={{ display: 'grid', gap: 16 }}>
          {OUTPUTS.map((item) => (
            <article key={item.key} style={{ border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, fontWeight: 800 }}>{item.label}</p>
                  <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 13 }}>{item.purpose}</p>
                </div>
                <button type="button" className="ep-btn ep-btn-secondary" onClick={() => void copyOutput(item.key)}>
                  {copied === item.key ? 'Copied' : 'Copy'}
                </button>
              </div>
              <textarea className="ep-input" readOnly rows={10} value={output[item.key]} style={{ marginTop: 12, width: '100%' }} />
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}
