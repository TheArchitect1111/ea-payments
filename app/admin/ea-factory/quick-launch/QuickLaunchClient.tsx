'use client';

import { useState } from 'react';

type LaunchResult = {
  websiteUrl?: string;
  portalUrl?: string;
  portalLoginUrl?: string;
  adminUrl?: string;
  websiteStatus?: 'quarantined' | 'live';
  tempCredentials?: string;
};

export default function QuickLaunchClient() {
  const [launching, setLaunching] = useState(false);
  const [message, setMessage] = useState('');
  const [result, setResult] = useState<LaunchResult | null>(null);

  async function launchAmandaExperience() {
    setLaunching(true);
    setMessage('Creating the website and portal experience…');
    setResult(null);
    try {
      const response = await fetch('/api/admin/factory/activate-experience', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ presetId: 'amanda-catherine-editorial' }),
      });
      const payload = (await response.json().catch(() => ({}))) as LaunchResult & {
        ok?: boolean;
        error?: string;
      };
      if (!response.ok || !payload.ok) {
        setMessage(payload.error || 'The experience could not be launched.');
        return;
      }
      setResult(payload);
      setMessage(
        payload.websiteStatus === 'quarantined'
          ? 'Amanda’s portal is ready. The website remains quarantined.'
          : 'Amanda Catherine Editorial is live.',
      );
    } catch {
      setMessage('The launch request could not be completed.');
    } finally {
      setLaunching(false);
    }
  }

  const links = result
    ? [
        ['Website', result.websiteUrl],
        ['Portal', result.portalUrl],
        ['Portal Login', result.portalLoginUrl],
        ['Admin Portal', result.adminUrl],
      ]
    : [];

  return (
    <main className="min-h-screen bg-[#F7F3EC] px-6 py-12 text-[#17130F]">
      <section className="mx-auto max-w-4xl border border-[#D9CFC1] bg-white p-8 md:p-12">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#B9894D]">
          EA Factory / Quick Launch
        </p>
        <h1 className="mt-4 font-serif text-4xl tracking-tight md:text-6xl">
          Amanda Catherine Editorial
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-[#665F57]">
          One action creates the themed website, wires the existing portal, runs the Experience
          Director gate, and returns every access link.
        </p>

        <button
          type="button"
          onClick={launchAmandaExperience}
          disabled={launching}
          className="mt-8 bg-[#17130F] px-7 py-4 text-sm font-bold uppercase tracking-[0.16em] text-white disabled:cursor-wait disabled:opacity-50"
        >
          {launching ? 'Launching…' : 'Launch Amanda Experience'}
        </button>

        {message ? (
          <p role="status" aria-live="polite" className="mt-6 text-sm font-semibold text-[#665F57]">
            {message}
          </p>
        ) : null}

        {links.length > 0 ? (
          <div className="mt-8 grid gap-px border border-[#D9CFC1] bg-[#D9CFC1] sm:grid-cols-2">
            {links.map(([label, href]) =>
              href ? (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-[#FBF8F3] px-5 py-5 text-sm font-bold text-[#17130F] underline decoration-[#B9894D] underline-offset-4"
                >
                  Open {label}
                </a>
              ) : null,
            )}
          </div>
        ) : null}
        {result?.tempCredentials ? (
          <div className="mt-5 border border-[#D9CFC1] bg-[#FBF8F3] p-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B9894D]">
              Portal credentials
            </p>
            <p className="mt-2 text-sm leading-6 text-[#665F57]">{result.tempCredentials}</p>
          </div>
        ) : null}
      </section>
    </main>
  );
}
