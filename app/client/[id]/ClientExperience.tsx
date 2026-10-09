'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { ContentWhen, HqItem } from '../_lib/hq-store';

type PublicProject = { id: string; name: string; domain: string; livePath: string; items: HqItem[] };

export default function ClientExperience({ projectId, projectName, domain, livePath }: { projectId: string; projectName: string; domain: string; livePath: string }) {
  const [project, setProject] = useState<PublicProject | null>(null);
  const [active, setActive] = useState<HqItem | null>(null);
  const [continued, setContinued] = useState(false);
  const [response, setResponse] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    void fetch(`/client/api/projects/${projectId}`, { cache: 'no-store' }).then((res) => res.json()).then((body) => { if (alive) setProject(body.project ?? null); }).catch(() => {});
    return () => { alive = false; };
  }, [projectId]);

  const audience = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search).get('audience');
  const visible = (project?.items ?? []).filter((item) => item.audience === 'everyone' || (item.audience === 'waitlist' && audience === 'waitlist') || (item.audience === 'foundry' && audience === 'foundry'));
  const always = visible.filter((item) => item.when === 'always');
  const triggered = visible.filter((item) => item.when !== 'always');

  function openItem(item: HqItem) { setActive(item); setContinued(false); setResponse(''); }

  async function submitForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!active) return;
    const form = new FormData(event.currentTarget);
    setBusy(true); setResponse('');
    const res = await fetch('/client/api/forms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ projectId, itemId: active.id, name: form.get('name'), email: form.get('email'), message: form.get('message') }) });
    const body = await res.json().catch(() => ({}));
    setResponse(res.ok ? body.message : body.error || 'Submission failed.'); setBusy(false);
  }

  const iframeSource = livePath.startsWith('/') ? livePath : livePath;
  return <main className="min-h-screen bg-[#f6f0e6] text-[#17211c]">
    <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between gap-3 border-b border-black/10 bg-[#fffdf8]/95 px-4 backdrop-blur">
      <div><p className="text-xs font-bold uppercase tracking-widest text-[#596b5b]">{projectName} · LIVE</p><p className="text-xs text-black/55">{domain}</p></div>
      <a href="/hq" className="grid min-h-20 min-w-20 place-items-center rounded-xl border border-black/20 px-3 text-sm font-bold" aria-label="Open HQ">HQ</a>
    </header>
    {always.length > 0 && <section className="mx-auto grid max-w-3xl gap-3 px-4 py-5">{always.map((item) => <article key={item.id} className="rounded-2xl border border-black/10 bg-[#fffdf8] p-4 shadow-sm"><h1 className="text-xl font-bold">{item.title}</h1>{item.text && <p className="mt-2 whitespace-pre-wrap leading-6">{item.text}</p>}{item.mediaUrl && (item.mediaType === 'video' ? <video className="mt-3 max-h-96 w-full rounded-xl bg-black object-contain" controls playsInline poster={item.posterUrl} src={item.mediaUrl} /> : <img className="mt-3 max-h-96 w-full rounded-xl object-contain" src={item.mediaUrl} alt={item.title} />)}</article>)}</section>}
    <section aria-label={`${projectName} live website`} className="w-full bg-white"><iframe title={`${projectName} live website`} src={iframeSource} className="h-[75dvh] min-h-[520px] w-full border-0" loading="eager" /></section>
    {triggered.length > 0 && <section className="mx-auto max-w-3xl px-4 py-6"><h2 className="text-lg font-black">Continue</h2><div className="mt-3 grid gap-3">{triggered.map((item) => <button key={item.id} type="button" onClick={() => openItem(item)} className="min-h-20 rounded-2xl bg-[#596b5b] px-5 text-left text-base font-bold text-white">{item.buttonLabel || item.title}</button>)}</div></section>}
    <footer className="flex min-h-20 items-center justify-center border-t border-black/10 px-4 text-xs text-black/50">Live client link · Powered by My Projects HQ</footer>

    {active && <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/65 p-3 sm:items-center" onClick={(event) => { if (event.target === event.currentTarget) setActive(null); }}><section role="dialog" aria-modal="true" aria-labelledby="client-modal-title" className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[#fffdf8] p-5 shadow-2xl"><div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-widest text-[#596b5b]">{active.shelf} · {whenName(active.when)}</span><button type="button" onClick={() => setActive(null)} className="min-h-20 min-w-20 rounded-xl border border-black/20 text-2xl" aria-label="Close">×</button></div><h2 id="client-modal-title" className="mt-2 text-2xl font-bold">{active.title}</h2>{active.text && <p className="mt-3 whitespace-pre-wrap leading-6">{active.text}</p>}
      {active.mediaUrl && (active.mediaType === 'video' ? <video className="mt-3 max-h-72 w-full rounded-xl bg-black object-contain" controls playsInline poster={active.posterUrl} src={active.mediaUrl} /> : <img className="mt-3 max-h-72 w-full rounded-xl object-contain" src={active.mediaUrl} alt={active.title} />)}
      {!continued ? <button type="button" onClick={() => { setContinued(true); if (active.destination?.startsWith('/')) window.history.pushState({}, '', active.destination); }} className="mt-5 min-h-20 w-full rounded-xl bg-[#596b5b] px-4 text-base font-bold text-white">Continue</button> : active.shelf === 'form' ? <form onSubmit={(event) => void submitForm(event)} className="mt-4 grid gap-3"><label className="text-sm font-bold">Name<input name="name" className="mt-1 min-h-20 w-full rounded-xl border border-black/20 bg-white px-3" /></label><label className="text-sm font-bold">Email<input name="email" type="email" required className="mt-1 min-h-20 w-full rounded-xl border border-black/20 bg-white px-3" /></label><label className="text-sm font-bold">Message<textarea name="message" rows={3} className="mt-1 w-full rounded-xl border border-black/20 bg-white p-3" /></label><button disabled={busy} className="min-h-20 rounded-xl bg-[#596b5b] font-bold text-white">{busy ? 'Sending…' : 'Submit'}</button>{response && <p role="status" className="text-sm">{response}</p>}</form> : active.destination ? <a href={active.destination} className="mt-5 grid min-h-20 place-items-center rounded-xl bg-[#596b5b] px-4 text-center font-bold text-white">Open next page</a> : <p className="mt-4 text-sm text-black/60">You can continue on the live site below.</p>}
    </section></div>}
  </main>;
}

function whenName(when: ContentWhen) {
  return ({ always: 'Homepage', register: 'Register', waitlist: 'Waitlist', foundry: 'Foundry', multiple: 'More than one button' } as Record<ContentWhen, string>)[when];
}
