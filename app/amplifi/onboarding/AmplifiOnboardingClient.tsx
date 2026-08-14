'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type Profile = {
  businessName: string;
  website: string;
  audience: string;
  brandVoice: string;
  primaryObjective: string;
  channels: string[];
  timezone: string;
  onboardingComplete: boolean;
};

const CHANNELS = ['Facebook', 'Instagram', 'LinkedIn', 'X', 'YouTube', 'TikTok'];

export default function AmplifiOnboardingClient({
  loggedIn,
  slug,
}: {
  loggedIn: boolean;
  slug: string | null;
}) {
  const [businessName, setBusinessName] = useState('');
  const [website, setWebsite] = useState('');
  const [audience, setAudience] = useState('');
  const [brandVoice, setBrandVoice] = useState('');
  const [primaryObjective, setPrimaryObjective] = useState('');
  const [channels, setChannels] = useState<string[]>([]);
  const [timezone, setTimezone] = useState('America/New_York');
  const [loading, setLoading] = useState(loggedIn);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    fetch('/api/portal/amplifi/profile')
      .then((res) => res.json())
      .then((data: { ok?: boolean; profile?: Profile | null }) => {
        if (!data.ok || !data.profile) return;
        const p = data.profile;
        setBusinessName(p.businessName || '');
        setWebsite(p.website || '');
        setAudience(p.audience || '');
        setBrandVoice(p.brandVoice || '');
        setPrimaryObjective(p.primaryObjective || '');
        setChannels(Array.isArray(p.channels) ? p.channels : []);
        setTimezone(p.timezone || 'America/New_York');
        setSaved(Boolean(p.onboardingComplete));
      })
      .catch(() => setMessage('We could not load your saved Amplifi profile.'))
      .finally(() => setLoading(false));
  }, [loggedIn]);

  const toggleChannel = (channel: string) => {
    setChannels((current) => {
      if (current.includes(channel)) return current.filter((item) => item !== channel);
      if (current.length >= 3) {
        setMessage('Amplifi Social supports up to three channels per brand.');
        return current;
      }
      setMessage('');
      return [...current, channel];
    });
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!loggedIn) return;
    setSaving(true);
    setMessage('');
    setSaved(false);
    try {
      const res = await fetch('/api/portal/amplifi/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          website,
          audience,
          brandVoice,
          primaryObjective,
          channels,
          timezone,
        }),
      });
      const data = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setMessage(data.error || 'Amplifi could not save your profile.');
        return;
      }
      setSaved(true);
      setMessage('Brand setup saved. Amplifi can now use this profile across campaigns.');
    } catch {
      setMessage('Connection issue while saving your profile.');
    } finally {
      setSaving(false);
    }
  };

  if (!loggedIn) {
    return (
      <main className="min-h-screen bg-[#f6f4ee] px-6 py-20 text-[#17233d]">
        <div className="mx-auto max-w-xl rounded-[28px] border border-[#e5dfd0] bg-white p-10 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#aa7a1b]">Amplifi setup</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">Sign in to finish your brand setup.</h1>
          <p className="mt-4 text-sm leading-6 text-slate-600">
            Your Amplifi profile is tied to your organization so your brand voice, audience, and campaign settings stay private to your account.
          </p>
          <Link
            href="/portal/login?next=%2Famplifi%2Fonboarding"
            className="mt-8 inline-flex rounded-full bg-[#17233d] px-6 py-3 text-sm font-semibold text-white"
          >
            Sign in to continue
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f4ee] px-5 py-8 text-[#17233d] sm:px-8 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#aa7a1b]">Amplifi onboarding</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Teach Amplifi how your brand should sound.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600">
              One profile becomes the source of truth for your campaigns, research, content, and publishing decisions.
            </p>
          </div>
          <Link
            href={slug ? `/portal/${slug}/amplifi` : '/amplifi'}
            className="rounded-full border border-[#d7d1c3] bg-white px-5 py-2.5 text-sm font-semibold"
          >
            Open Amplifi
          </Link>
        </header>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
          <form onSubmit={submit} className="rounded-[28px] border border-[#e5dfd0] bg-white p-6 shadow-sm sm:p-8">
            {loading ? <p className="text-sm text-slate-500">Loading your brand profile…</p> : null}

            <div className="grid gap-5 sm:grid-cols-2">
              <label className="text-sm font-semibold">
                Brand or business name
                <input
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#ddd7ca] px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
                  placeholder="Efficiency Architects"
                />
              </label>
              <label className="text-sm font-semibold">
                Website
                <input
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="mt-2 w-full rounded-2xl border border-[#ddd7ca] px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
                  placeholder="https://example.com"
                />
              </label>
            </div>

            <label className="mt-5 block text-sm font-semibold">
              Who are you trying to reach?
              <textarea
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#ddd7ca] px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
                placeholder="Describe the people, businesses, or communities you want Amplifi to speak to."
              />
            </label>

            <label className="mt-5 block text-sm font-semibold">
              Brand voice
              <textarea
                value={brandVoice}
                onChange={(e) => setBrandVoice(e.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#ddd7ca] px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
                placeholder="Clear, warm, credible, practical, human…"
              />
            </label>

            <label className="mt-5 block text-sm font-semibold">
              Primary objective
              <textarea
                value={primaryObjective}
                onChange={(e) => setPrimaryObjective(e.target.value)}
                className="mt-2 min-h-28 w-full rounded-2xl border border-[#ddd7ca] px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
                placeholder="What should Amplifi help the business accomplish?"
              />
            </label>

            <div className="mt-6">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-semibold">Social channels</span>
                <span className="text-xs text-slate-500">Choose up to 3</span>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {CHANNELS.map((channel) => {
                  const active = channels.includes(channel);
                  return (
                    <button
                      key={channel}
                      type="button"
                      onClick={() => toggleChannel(channel)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold ${
                        active
                          ? 'border-[#17233d] bg-[#17233d] text-white'
                          : 'border-[#ddd7ca] bg-[#faf9f5] text-[#17233d]'
                      }`}
                    >
                      {channel}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="mt-6 block text-sm font-semibold">
              Time zone
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-2xl border border-[#ddd7ca] bg-white px-4 py-3 font-normal outline-none focus:border-[#aa7a1b]"
              >
                <option value="America/New_York">Eastern</option>
                <option value="America/Chicago">Central</option>
                <option value="America/Denver">Mountain</option>
                <option value="America/Los_Angeles">Pacific</option>
                <option value="UTC">UTC</option>
              </select>
            </label>

            {message ? (
              <p className={`mt-5 rounded-2xl px-4 py-3 text-sm ${saved ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900'}`}>
                {message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={saving || loading}
              className="mt-6 rounded-full bg-[#17233d] px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : saved ? 'Update brand profile' : 'Save brand profile'}
            </button>
          </form>

          <aside className="space-y-5">
            <section className="rounded-[28px] border border-[#e5dfd0] bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aa7a1b]">Account readiness</p>
              <h2 className="mt-2 text-xl font-semibold">Brand profile</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {saved ? 'Saved and ready for campaign use.' : 'Complete the profile to make campaign creation faster and more consistent.'}
              </p>
            </section>

            <section className="rounded-[28px] border border-[#e5dfd0] bg-white p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#aa7a1b]">Social connections</p>
              <h2 className="mt-2 text-xl font-semibold">Provider connection</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Your selected channels are saved here. Connect each approved social account to let Amplifi publish the posts you approve at the scheduled time.
              </p>
              <span className="mt-4 inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
                Meta certification pending
              </span>
            </section>

            <section className="rounded-[28px] border border-[#e5dfd0] bg-[#17233d] p-6 text-white shadow-sm">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#dcb862]">Next</p>
              <h2 className="mt-2 text-xl font-semibold">Build your first campaign.</h2>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Amplifi will use this profile as the starting context for research, copy, and campaign decisions.
              </p>
              <Link
                href="/amplifi"
                className="mt-5 inline-flex rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#17233d]"
              >
                Go to campaign studio
              </Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
