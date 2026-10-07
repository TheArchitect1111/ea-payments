'use client';

import { useMemo, useState } from 'react';

type Props = {
  clientId: string;
  initialRecord: any;
  dark?: boolean;
};

const money = (value: unknown) => {
  const n = Number(value);
  return Number.isFinite(n) ? `$${n.toFixed(2)}` : 'Not estimated';
};

const nice = (value: string) => value.replace(/\bcheckin\b/gi, 'check-in');

export default function BlueprintBrickPanel({ clientId, initialRecord, dark = false }: Props) {
  const [record, setRecord] = useState(initialRecord);
  const [assumptions, setAssumptions] = useState<Record<string, any>>(initialRecord?.policy?.capacity?.assumptions || {});
  const [saving, setSaving] = useState('');
  const policy = record?.policy || {};
  const cap = policy.capacity || {};
  const eventMode = cap.unit === 'event';
  const bricks: string[] = Array.isArray(policy.bricks) ? policy.bricks : [];
  const files = Array.isArray(record?.vaultFiles) ? record.vaultFiles : [];
  const event = policy.events;
  const learning = policy.learning;
  const panel = dark
    ? { background: '#141414', border: '1px solid #2a2a2a', color: '#fff' }
    : { background: '#fffdf8', border: '1px solid #ddd7cb', color: '#17211c' };
  const muted = dark ? '#b8b8b8' : '#667069';
  const accent = dark ? '#c41e3a' : '#b48a49';

  const activeCount = useMemo(() => bricks.length, [bricks]);

  async function saveCapacity() {
    setSaving('Saving capacity…');
    try {
      const response = await fetch(`/api/blueprint/${encodeURIComponent(clientId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assumptions }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Could not save capacity.');
      setRecord(data.record);
      setAssumptions(data.record.policy.capacity.assumptions || {});
      setSaving('Saved');
    } catch (error) {
      setSaving(error instanceof Error ? error.message : 'Could not save');
    }
  }

  async function upload(file: File | null) {
    if (!file) return;
    setSaving('Uploading to vault…');
    try {
      const form = new FormData();
      form.set('file', file);
      const response = await fetch(`/api/blueprint/${encodeURIComponent(clientId)}/vault`, { method: 'POST', body: form });
      const data = await response.json();
      if (!response.ok || !data.ok) throw new Error(data.error || 'Upload failed.');
      setRecord(data.record);
      setSaving('Vault updated');
    } catch (error) {
      setSaving(error instanceof Error ? error.message : 'Upload failed');
    }
  }

  const inputStyle = {
    width: '100%',
    border: dark ? '1px solid #3a3a3a' : '1px solid #c8c2b7',
    borderRadius: 8,
    padding: '9px 10px',
    background: dark ? '#0d0d0d' : '#fff',
    color: dark ? '#fff' : '#17211c',
  } as const;

  return (
    <section style={{ marginTop: 28 }}>
      <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 11, letterSpacing: '.14em', fontWeight: 800, color: accent }}>YOUR BLUEPRINT</p>
            <h2 style={{ margin: '7px 0 4px', fontSize: 28 }}>Eva, Your Guide</h2>
            <p style={{ margin: 0, color: muted }}>{policy.eva?.greeting || 'Your blueprint is ready.'}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <strong>{activeCount} bricks active</strong>
            <p style={{ margin: '3px 0 0', color: muted, fontSize: 13 }}>Policy {policy.version || 'ctp-v5'}</p>
          </div>
        </div>
        <ul style={{ marginBottom: 0 }}>
          {(policy.eva?.attention || []).slice(0, 4).map((item: string) => <li key={item}>{item}</li>)}
        </ul>
      </div>

      {bricks.includes('capacity.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your Time Picture</h3>
          <p><strong>{cap.hours ?? 'Needs review'} hours {eventMode ? 'per event' : 'a month'}</strong> · {money(cap.value)} {eventMode ? 'per event' : 'per month'}</p>
          <p style={{ color: muted }}>Editable assumptions recalculate and persist to the blueprint backend.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(145px,1fr))', gap: 10 }}>
            {[
              ['averageVolume','Average volume'],
              ['frequencyPerMonth', eventMode ? 'Event factor' : 'Frequency / month'],
              ['timeHours','Time / occurrence'],
              ['peopleCount','People involved'],
              ['loadedCost','Loaded $ / hour'],
              ['recoveryPercent','Recovery %'],
            ].map(([key,label]) => (
              <label key={key} style={{ fontSize: 12, color: muted }}>{label}
                <input style={inputStyle} type="number" min="0" step="any" value={assumptions[key] ?? ''} onChange={(e) => setAssumptions((old) => ({ ...old, [key]: e.target.value === '' ? null : Number(e.target.value) }))} />
              </label>
            ))}
          </div>
          <button type="button" onClick={saveCapacity} style={{ marginTop: 12, padding: '10px 15px', border: 0, borderRadius: 9, cursor: 'pointer', background: accent, color: '#fff', fontWeight: 800 }}>Save & recalculate</button>
        </div>
      )}

      {bricks.includes('scheduling.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>How Scheduling Works Now</h3>
          <p>Type: <strong>{policy.scheduling?.type || 'Not shared'}</strong> · Volume: <strong>{policy.scheduling?.volume || 'Not shared'}</strong> · Automatic reminders: <strong>{policy.scheduling?.autoReminder ? 'on' : 'not selected'}</strong></p>
          {policy.scheduling?.eventTimeline ? <p>Event timeline: active. Roster and tee-time deadlines are part of the attention queue.</p> : null}
          <p style={{ color: muted }}>Current pressure: {(policy.workQueue?.stuck || []).join(', ') || 'Not shared yet'}</p>
        </div>
      )}

      {bricks.includes('comm.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>How People Hear From You</h3>
          <p>Channel: <strong>{policy.communications?.channel || 'Not selected'}</strong></p>
          <p>Sequences: {(policy.communications?.sequences || []).map((x: string) => eventMode && x === 'welcome' ? 'welcome players' : nice(x)).join(' · ') || 'Not selected yet'}</p>
        </div>
      )}

      {bricks.includes('vault.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>What You Already Have</h3>
          <p><strong>Existing:</strong> {(policy.vault?.existing || []).join(', ') || 'Not shared yet'}</p>
          <p><strong>Still to gather:</strong> {(policy.vault?.missing || []).join(', ') || 'Nothing inferred yet'}</p>
          <p><strong>Keep personal:</strong> {(policy.vault?.personalProtected || []).join(', ') || 'Not selected yet'}</p>
          <p><strong>Stored files:</strong> {files.length ? files.map((file: any) => file.name).join(', ') : 'None yet'}</p>
          <label style={{ display: 'inline-block', marginTop: 8, cursor: 'pointer', padding: '9px 12px', borderRadius: 9, border: `1px solid ${accent}` }}>
            Add to vault
            <input hidden type="file" accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.tsv,.txt" onChange={(e) => upload(e.target.files?.[0] || null)} />
          </label>
        </div>
      )}

      {bricks.includes('task.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>What Needs Attention</h3>
          <p>{policy.workQueue?.biggestToll || 'Not shared yet'}</p>
          <ol>{(policy.eva?.attention || []).slice(0, 4).map((item: string) => <li key={item}>{item}</li>)}</ol>
        </div>
      )}

      {bricks.includes('brand.core') && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>What People Value</h3>
          <p>{(policy.brand?.pillars || []).join(' · ') || 'Not shared yet'}</p>
        </div>
      )}

      {bricks.includes('learning.core') && learning && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your Classes and Students</h3>
          <p>Students or clients: <strong>{learning.students}</strong> · Sessions: <strong>{learning.sessions}</strong></p>
          <p>Modules: {(learning.modules || []).join(' · ')}</p>
        </div>
      )}

      {bricks.includes('events.core') && event && (
        <div style={{ ...panel, borderRadius: 18, padding: 22, marginBottom: 16 }}>
          <h3 style={{ marginTop: 0 }}>Your Events</h3>
          <p>Events: <strong>{event.eventCount}</strong> · Attendees: <strong>{event.attendees}</strong> · Helpers: <strong>{event.helpers}</strong></p>
          <p>Modules: {(event.modules || []).join(' · ')}</p>
        </div>
      )}
      {saving ? <p style={{ color: muted, fontSize: 13 }}>{saving}</p> : null}
    </section>
  );
}
