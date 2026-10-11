'use client';
import { useState } from 'react';
import { OPERATIONAL_CHALLENGES } from '@/lib/analysis-engine';
export default function DiscoveryForm({ slug }: { slug: string }) {
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [requestId, setRequestId] = useState('');
  const [complete, setComplete] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setStatus('Saving your assessment…');
    const data = new FormData(event.currentTarget);
    const id = requestId || crypto.randomUUID(); setRequestId(id);
    try {
      const result = await fetch(`/api/portal/${encodeURIComponent(slug)}/discovery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        requestId: id, name: data.get('name'), teamSize: Number(data.get('teamSize')), revenueRange: data.get('revenueRange'),
        systemsCount: Number(data.get('systemsCount')), operationalChallenges: data.getAll('challenges'), complexity: data.get('complexity'), goals: data.get('goals'),
      }) });
      const payload = await result.json();
      if (!result.ok) throw new Error(payload.error || 'Your assessment could not be saved.');
      setComplete(true); setStatus(`Your assessment is saved. Your capacity score is ${payload.analysis.capacityScore}. Your confirmation has been sent.`);
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="ep-module-card"><form className="ep-brick-form" onSubmit={submit} style={{ display: 'grid', gap: 16, maxWidth: 680 }}>
    <label>Your name<input className="ep-input" name="name" required maxLength={200} /></label>
    <label>People on your team<input className="ep-input" name="teamSize" type="number" min={1} max={100000} defaultValue={1} required /></label>
    <label>Annual revenue<select className="ep-input" name="revenueRange"><option value="under_100k">Under $100,000</option><option value="100k_500k">$100,000 to $500,000</option><option value="500k_1m">$500,000 to $1 million</option><option value="1m_5m">$1 million to $5 million</option><option value="5m_plus">Over $5 million</option></select></label>
    <label>Tools you use<input className="ep-input" name="systemsCount" type="number" min={0} max={100} defaultValue={0} required /></label>
    <label>How complex is your work?<select className="ep-input" name="complexity"><option value="low">Simple</option><option value="medium">Moderate</option><option value="high">Complex</option></select></label>
    <fieldset><legend>What needs attention?</legend>{OPERATIONAL_CHALLENGES.map(c => <label key={c.id} style={{ display: 'block', marginTop: 8 }}><input type="checkbox" name="challenges" value={c.id} /> {c.label}</label>)}</fieldset>
    <label>What would you like to achieve?<textarea className="ep-input" name="goals" maxLength={4000} rows={4} /></label>
    <button className="ep-btn" disabled={busy || complete}>{busy ? 'Saving…' : complete ? 'Assessment saved' : 'Save my assessment'}</button>
  </form><p role="status" style={{ marginTop: 16 }}>{status}</p></div>;
}
