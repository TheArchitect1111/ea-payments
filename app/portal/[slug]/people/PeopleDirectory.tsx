'use client';
import { useCallback, useEffect, useState } from 'react';
type Person = { id: string; displayName: string; emails?: { value: string }[] };
export default function PeopleDirectory({ slug }: { slug: string }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [status, setStatus] = useState('Loading people…');
  const [busy, setBusy] = useState(false);
  const endpoint = `/api/portal/${encodeURIComponent(slug)}/people`;
  const load = useCallback(async () => {
    try {
      const result = await fetch(endpoint, { cache: 'no-store' }); const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'People could not be loaded.');
      setPeople(data.people); setStatus(data.people.length ? '' : 'No people yet. Add your first contact below.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
  }, [endpoint]);
  useEffect(() => {
    const controller = new AbortController();
    fetch(endpoint, { cache: 'no-store', signal: controller.signal }).then(async result => {
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || 'People could not be loaded.');
      if (!controller.signal.aborted) { setPeople(data.people); setStatus(data.people.length ? '' : 'No people yet. Add your first contact below.'); }
    }).catch(error => { if (!controller.signal.aborted) setStatus(error instanceof Error ? error.message : 'Please try again.'); });
    return () => controller.abort();
  }, [endpoint]);
  async function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form); setBusy(true);
    try {
      const result = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ displayName: data.get('name'), email: data.get('email') }) });
      const row = await result.json(); if (!result.ok) throw new Error(row.error || 'Contact could not be saved.');
      form.reset(); await load(); setStatus(row.created ? 'Contact saved.' : 'This contact is already in your directory.');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setBusy(false); }
  }
  return <div className="ep-module-card"><p role="status">{status}</p><ul>{people.map(person => <li key={person.id} style={{ padding: '12px 0', overflowWrap: 'anywhere' }}><strong>{person.displayName}</strong>{person.emails?.map(x => <p key={x.value}>{x.value}</p>)}</li>)}</ul>
    <form className="ep-brick-form" onSubmit={add} style={{ display: 'grid', gap: 14, maxWidth: 600, marginTop: 24 }}><label>Name<input className="ep-input" name="name" required maxLength={200} /></label><label>Email<input className="ep-input" name="email" type="email" required maxLength={254} /></label><button className="ep-btn" disabled={busy}>{busy ? 'Saving…' : 'Add contact'}</button></form>
  </div>;
}
