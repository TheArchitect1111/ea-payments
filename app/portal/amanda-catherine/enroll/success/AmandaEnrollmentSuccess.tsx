'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

type State =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; email: string; loginUrl: string; welcomeSent: boolean };

export default function AmandaEnrollmentSuccess() {
  const params = useSearchParams();
  const sessionId = params.get('session_id') || '';
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    if (!sessionId) {
      setState({ status: 'error', message: 'The enrollment confirmation link is incomplete.' });
      return () => { active = false; };
    }
    fetch('/api/public/amanda/enrollment/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { error?: string; email?: string; loginUrl?: string; welcomeSent?: boolean };
        if (!response.ok || !data.email || !data.loginUrl) throw new Error(data.error || 'Enrollment could not be verified.');
        return data;
      })
      .then((data) => { if (active) setState({ status: 'ready', email: data.email!, loginUrl: data.loginUrl!, welcomeSent: Boolean(data.welcomeSent) }); })
      .catch((error) => { if (active) setState({ status: 'error', message: error instanceof Error ? error.message : 'Enrollment could not be verified.' }); });
    return () => { active = false; };
  }, [sessionId]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#102018] px-5 py-12 text-[#17130f]">
      <section className="w-full max-w-2xl rounded-3xl bg-[#fffaf2] p-7 text-center shadow-2xl sm:p-12">
        <p className="text-sm font-black uppercase tracking-[0.28em] text-[#9b7039]">AesthetiKine Academy</p>
        {state.status === 'loading' ? (
          <><h1 className="mt-5 font-serif text-4xl">Confirming your enrollment…</h1><p className="mt-4">Please keep this page open while we create your course access.</p></>
        ) : state.status === 'error' ? (
          <><h1 className="mt-5 font-serif text-4xl">We need to finish your access</h1><p role="alert" className="mt-4 leading-7">{state.message}</p><p className="mt-3 text-sm">If your payment completed, do not pay again. Contact Amanda Catherine with your payment email so your access can be confirmed.</p></>
        ) : (
          <>
            <h1 className="mt-5 font-serif text-5xl">You’re enrolled.</h1>
            <p className="mt-5 text-lg leading-8">Your course has been assigned to <strong>{state.email}</strong>.</p>
            <p className="mt-3 leading-7">{state.welcomeSent ? 'Check your email for your temporary password and sign-in instructions.' : 'Your existing Amanda Catherine sign-in now includes this course.'}</p>
            <a href={state.loginUrl} className="mt-7 inline-flex min-h-14 items-center justify-center rounded-full bg-[#c39851] px-8 text-lg font-black">Open Courses & Learning</a>
          </>
        )}
        <div className="mt-8"><Link className="font-bold underline" href="https://amandacatherine.ca">Return to AmandaCatherine.ca</Link></div>
      </section>
    </main>
  );
}
