'use client';

import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { ConnectOrgConfig, ConnectResource, ConnectSequenceStep } from '@/lib/connect-store';

type Result = {
  relationship: {
    id: string;
    aiProfile: {
      summary: string;
      interestLevel: string;
      opportunityScore: number;
      recommendedAction: string;
    };
  };
  resources: ConnectResource[];
  redirectDestination: string;
  nextSequence: ConnectSequenceStep[];
};

type Props = {
  org: ConnectOrgConfig;
  event?: string;
  representative?: string;
  source?: string;
};

const steps = ['Name', 'Contact', 'Context', 'Activate'];

export default function ConnectCapture({ org, event, representative, source = 'QR' }: Props) {
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [voiceNote, setVoiceNote] = useState('');
  const [voiceSummary, setVoiceSummary] = useState('');
  const [result, setResult] = useState<Result | null>(null);
  const [payload, setPayload] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    role: '',
    leadType: org.leadTypes[0] ?? 'Prospect',
    conversationNotes: '',
  });

  const progress = useMemo(() => Math.round(((step + 1) / steps.length) * 100), [step]);
  const canAdvance =
    step === 0 ? payload.name.trim().length > 1 :
    step === 1 ? payload.email.includes('@') || payload.phone.trim().length > 6 :
    true;

  function update(field: keyof typeof payload, value: string) {
    setPayload((current) => ({ ...current, [field]: value }));
  }

  async function processVoiceNote() {
    if (!voiceNote.trim()) return;
    const response = await fetch('/api/connect/voice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: voiceNote }),
    });
    const data = await response.json();
    if (response.ok) {
      setVoiceSummary(data.summary);
      update('conversationNotes', data.summary);
    }
  }

  async function activateRelationship() {
    setSaving(true);
    try {
      const response = await fetch('/api/connect/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          orgSlug: org.slug,
          source,
          event,
          representative,
          tags: [payload.role, payload.leadType, event].filter(Boolean),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Unable to activate relationship.');
      setResult(data);
    } finally {
      setSaving(false);
    }
  }

  if (result) {
    return (
      <main className="connect-site" style={{ '--connect-ink': org.colors.ink, '--connect-accent': org.colors.accent, '--connect-soft': org.colors.soft } as CSSProperties}>
        <section className="connect-success">
          <p className="connect-kicker">Relationship activated</p>
          <h1>Everything is moving now.</h1>
          <p>
            {org.name} received the connection, delivered the first resource, and created an intelligent follow-up record.
          </p>

          <div className="connect-resource-strip" aria-label="Resources delivered">
            {result.resources.map((resource) => (
              <a key={resource.id} href={resource.url} className="connect-resource">
                <span>{resource.type}</span>
                <strong>{resource.title}</strong>
                <small>{resource.description}</small>
              </a>
            ))}
          </div>

          <div className="connect-intelligence">
            <span>Opportunity Score</span>
            <strong>{result.relationship.aiProfile.opportunityScore}</strong>
            <p>{result.relationship.aiProfile.summary}</p>
            <b>{result.relationship.aiProfile.recommendedAction}</b>
          </div>

          <a className="connect-primary" href={result.redirectDestination}>
            Continue
          </a>
        </section>
      </main>
    );
  }

  return (
    <main className="connect-site" style={{ '--connect-ink': org.colors.ink, '--connect-accent': org.colors.accent, '--connect-soft': org.colors.soft } as CSSProperties}>
      <section className="connect-shell">
        <header className="connect-hero">
          <p className="connect-kicker">{org.qrCodeLabel}</p>
          <h1>This moment can become a real relationship.</h1>
          <p>
            Share your preferred contact path and {org.name} will send the right resource, remember the conversation,
            and make follow-up easy.
          </p>
        </header>

        <div className="connect-progress" aria-label="Connection progress">
          <span style={{ width: `${progress}%` }} />
        </div>

        <section className="connect-panel" aria-label={steps[step]}>
          {step === 0 ? (
            <div className="connect-step">
              <span>Step 01</span>
              <h2>What should we call you?</h2>
              <input
                autoFocus
                value={payload.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="Your name"
              />
            </div>
          ) : null}

          {step === 1 ? (
            <div className="connect-step">
              <span>Step 02</span>
              <h2>Where should the resource go?</h2>
              <input
                value={payload.email}
                onChange={(event) => update('email', event.target.value)}
                placeholder="Email"
                inputMode="email"
              />
              <input
                value={payload.phone}
                onChange={(event) => update('phone', event.target.value)}
                placeholder="Phone optional"
                inputMode="tel"
              />
            </div>
          ) : null}

          {step === 2 ? (
            <div className="connect-step">
              <span>Step 03</span>
              <h2>Help us route this correctly.</h2>
              <div className="connect-segments">
                {org.leadTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    className={payload.leadType === type ? 'is-active' : ''}
                    onClick={() => update('leadType', type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
              <input
                value={payload.organization}
                onChange={(event) => update('organization', event.target.value)}
                placeholder="Organization, team, school, or company"
              />
              <input
                value={payload.role}
                onChange={(event) => update('role', event.target.value)}
                placeholder="Role or relationship"
              />
            </div>
          ) : null}

          {step === 3 ? (
            <div className="connect-step">
              <span>Step 04</span>
              <h2>Activate the follow-up.</h2>
              <p className="connect-muted">
                We will create the relationship record, deliver the first resource, notify the team, and start the sequence.
              </p>
              <textarea
                value={voiceNote}
                onChange={(event) => setVoiceNote(event.target.value)}
                placeholder="Representative voice note or quick context"
              />
              <button type="button" className="connect-secondary" onClick={processVoiceNote}>
                Summarize note
              </button>
              {voiceSummary ? <p className="connect-note">{voiceSummary}</p> : null}
            </div>
          ) : null}
        </section>

        <footer className="connect-actions">
          {step > 0 ? (
            <button type="button" className="connect-ghost" onClick={() => setStep((value) => value - 1)}>
              Back
            </button>
          ) : <span />}
          {step < steps.length - 1 ? (
            <button type="button" className="connect-primary" disabled={!canAdvance} onClick={() => setStep((value) => value + 1)}>
              Continue
            </button>
          ) : (
            <button type="button" className="connect-primary" disabled={saving} onClick={activateRelationship}>
              {saving ? 'Activating...' : 'Activate Relationship'}
            </button>
          )}
        </footer>

        <aside className="connect-system">
          <div><b>{event ?? 'Live event'}</b><span>Event source</span></div>
          <div><b>{representative ?? 'Auto-routed'}</b><span>Representative</span></div>
          <div><b>{org.sequence.length}</b><span>Follow-up steps</span></div>
        </aside>
      </section>
    </main>
  );
}
