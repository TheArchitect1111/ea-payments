'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
export default function SquareTestReturn() {
  const params = useSearchParams();
  const registrationId = params.get('registration_id') || '', token = params.get('token') || '';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ pending?: boolean; error?: string; email?: string; loginUrl?: string }>({ pending: true });
  useEffect(() => {
    let active = true;
    fetch('/api/public/amanda/square-test/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationId, token }) })
      .then(async r => { const data = await r.json(); if (!r.ok) throw new Error(data.error || 'Verification needs a retry.'); return data; })
      .then(data => { if (active) setState(data); })
      .catch(err => { if (active) setState({ error: err instanceof Error ? err.message : 'Please retry verification.' }); });
    return () => { active = false; };
  }, [registrationId, token, attempt]);
  return <main className="mx-auto max-w-lg px-5 py-14"><h1 className="font-serif text-3xl">Wood Therapy test enrollment</h1>
    {state.email && state.loginUrl ? <><p className="my-5">Your test course access is ready for {state.email}. Check your email for your receipt and sign-in instructions.</p><a className="amanda-button" href={state.loginUrl}>Open my student portal</a></> :
      <><p className="my-5" role={state.error ? 'alert' : 'status'}>{state.error || 'Waiting for Square to confirm your test payment.'}</p>
      <button className="amanda-button" onClick={() => { setState({ pending: true }); setAttempt(n => n + 1); }}>Check payment again</button><p>If you completed payment, do not pay again.</p></>}
  </main>;
}
