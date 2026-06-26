'use client';

import { useMemo, useState } from 'react';
import type { ConnectProfile } from '@/lib/connect-types';

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function queryValue(query: Record<string, string | string[] | undefined>, key: string) {
  const value = query[key];
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function deviceLabel() {
  if (typeof navigator === 'undefined') return '';
  return /mobile|iphone|android/i.test(navigator.userAgent)
    ? 'mobile'
    : /ipad|tablet/i.test(navigator.userAgent)
      ? 'tablet'
      : 'desktop';
}

function browserLabel() {
  if (typeof navigator === 'undefined') return '';
  const ua = navigator.userAgent;
  if (/edg/i.test(ua)) return 'Edge';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) return 'Safari';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  return 'Unknown';
}

export default function ConnectPageClient({
  profile,
  initialQuery,
}: {
  profile: ConnectProfile;
  initialQuery: Record<string, string | string[] | undefined>;
}) {
  const [state, setState] = useState<SubmitState>('idle');
  const [error, setError] = useState('');
  const [destination, setDestination] = useState('');
  const [copied, setCopied] = useState(false);
  const googleAuthUrl = process.env.NEXT_PUBLIC_CONNECT_GOOGLE_AUTH_URL;
  const connectUrl = typeof window === 'undefined' ? `/connect/${profile.slug}` : window.location.href;
  const initial = useMemo(
    () => ({
      campaign: queryValue(initialQuery, 'campaign') || queryValue(initialQuery, 'utm_campaign'),
      referralSource: queryValue(initialQuery, 'ref') || queryValue(initialQuery, 'referral_source'),
      utmSource: queryValue(initialQuery, 'utm_source'),
      utmMedium: queryValue(initialQuery, 'utm_medium'),
      utmCampaign: queryValue(initialQuery, 'utm_campaign'),
    }),
    [initialQuery],
  );

  async function submit(formData: FormData, method: 'email' | 'google') {
    setState('submitting');
    setError('');
    const notes = String(formData.get('notes') || '').trim();
    const guidedNotes = [
      ['Reason', String(formData.get('connectionReason') || '')],
      ['Timing', String(formData.get('timing') || '')],
      ['Preferred follow-up', String(formData.get('preferredFollowUp') || '')],
      ['Best way to reach me', String(formData.get('contactPreference') || '')],
    ]
      .filter(([, value]) => value.trim())
      .map(([label, value]) => `${label}: ${value.trim()}`);
    const payload = {
      slug: profile.slug,
      name: String(formData.get('name') || ''),
      email: String(formData.get('email') || ''),
      phone: String(formData.get('phone') || ''),
      company: String(formData.get('company') || ''),
      role: String(formData.get('role') || ''),
      location: String(formData.get('location') || ''),
      notes: [notes, ...guidedNotes].filter(Boolean).join('\n'),
      campaign: String(formData.get('campaign') || initial.campaign),
      referralSource: String(formData.get('referralSource') || initial.referralSource),
      utmSource: initial.utmSource,
      utmMedium: initial.utmMedium,
      utmCampaign: initial.utmCampaign,
      connectionMethod: method,
      device: deviceLabel(),
      browser: browserLabel(),
    };

    const res = await fetch('/api/connect/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok || data.ok === false) {
      setState('error');
      setError(data.error || 'Could not save your connection.');
      return;
    }

    if (data.destinationUrl) {
      window.location.assign(data.destinationUrl);
      return;
    }

    setDestination('');
    setState('success');
  }

  function handleGoogle() {
    if (!googleAuthUrl) return;
    const url = new URL(googleAuthUrl);
    url.searchParams.set('slug', profile.slug);
    url.searchParams.set('return_to', window.location.href);
    window.location.assign(url.toString());
  }

  async function shareConnectCard() {
    if (navigator.share) {
      await navigator.share({
        title: profile.brandName,
        text: profile.headline,
        url: connectUrl,
      });
      return;
    }
    await navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  async function copyLink() {
    await navigator.clipboard.writeText(connectUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  }

  return (
    <main className="connect-page" style={{ ['--connect-primary' as string]: profile.primaryColor }}>
      <section className="connect-shell">
        <header className="connect-pass" aria-label={`${profile.brandName} connect card`}>
          <div className="connect-pass-top">
            {profile.logoUrl ? <img src={profile.logoUrl} alt="" className="connect-logo" /> : <span className="connect-mark" />}
            <div>
              <p>{profile.brandName}</p>
              <h1>{profile.headline || 'Register to connect'}</h1>
            </div>
          </div>
          <span className="connect-pass-copy">
            {profile.subheadline ||
              'Tell us who you are and what you need. We will capture the context, recommend the right follow-up, and send you to the next best step.'}
          </span>
          <div className="connect-guide" aria-label="How this works">
            <p>How this works</p>
            <ol>
              <li>Choose a quick sign-in option, or use email if you prefer.</li>
              <li>Add enough context for us to understand the best next move.</li>
              <li>Register once. The system saves the connection, queues follow-up, and routes you forward.</li>
            </ol>
          </div>
        </header>

        {state === 'success' ? (
          <section className="connect-card connect-success" aria-live="polite">
            <h2>You are connected.</h2>
            <p>Thanks. Your information was saved and the right follow-up has been queued.</p>
            <div className="connect-pass-actions connect-success-actions" aria-label="Contact actions">
              <a href={`/api/connect/${profile.slug}/vcard`} className="connect-pass-action">Save contact</a>
              <button type="button" className="connect-pass-action" onClick={shareConnectCard}>Share</button>
              <button type="button" className="connect-pass-action" onClick={copyLink}>{copied ? 'Copied' : 'Copy link'}</button>
            </div>
            {destination ? <a href={destination}>Continue</a> : null}
          </section>
        ) : (
          <form
            className="connect-card connect-form"
            onSubmit={(event) => {
              event.preventDefault();
              void submit(new FormData(event.currentTarget), 'email');
            }}
          >
            <div className="connect-auth">
              <button type="button" className="connect-provider connect-provider-primary" disabled={!googleAuthUrl} onClick={handleGoogle}>
                <strong>Google</strong>
                <span>{googleAuthUrl ? 'Fast sign-in with your Google account.' : 'Fast sign-in when enabled.'}</span>
              </button>
              <button type="button" className="connect-provider" disabled>
                <strong>Apple</strong>
                <span>Coming soon for Apple ID.</span>
              </button>
              <button type="button" className="connect-provider" disabled>
                <strong>Microsoft</strong>
                <span>Coming soon for work accounts.</span>
              </button>
              <button type="button" className="connect-provider" disabled>
                <strong>LinkedIn</strong>
                <span>Coming soon for profile-based connect.</span>
              </button>
            </div>

            <div className="connect-divider"><span>Or connect by email</span></div>

            <div className="connect-section">
              <h2>Your details</h2>
              <p>This lets us save the connection and avoid asking again later.</p>
            </div>
            <label>Name<input name="name" autoComplete="name" required /></label>
            <label>Email<input name="email" type="email" autoComplete="email" required /></label>
            <label>Phone <small>optional</small><input name="phone" type="tel" autoComplete="tel" /></label>
            <label>Company or organization<input name="company" autoComplete="organization" /></label>
            <div className="connect-two">
              <label>Role<input name="role" autoComplete="organization-title" /></label>
              <label>Location<input name="location" autoComplete="address-level2" /></label>
            </div>

            <div className="connect-section">
              <h2>What should happen next?</h2>
              <p>Choose the closest fit. These details guide the follow-up and destination.</p>
            </div>
            <label>
              Reason for connecting
              <select name="connectionReason" defaultValue="">
                <option value="">Select one</option>
                <option value="I want to explore working together">I want to explore working together</option>
                <option value="I need help with a current project">I need help with a current project</option>
                <option value="I am looking for resources or next steps">I am looking for resources or next steps</option>
                <option value="I was referred by someone">I was referred by someone</option>
                <option value="I want to stay in touch">I want to stay in touch</option>
              </select>
            </label>
            <div className="connect-two">
              <label>
                Timing
                <select name="timing" defaultValue="">
                  <option value="">Select timing</option>
                  <option value="Now / urgent">Now / urgent</option>
                  <option value="This week">This week</option>
                  <option value="This month">This month</option>
                  <option value="Just exploring">Just exploring</option>
                </select>
              </label>
              <label>
                Preferred follow-up
                <select name="preferredFollowUp" defaultValue="">
                  <option value="">Select follow-up</option>
                  <option value="Send me the best resource">Send me the best resource</option>
                  <option value="Email me">Email me</option>
                  <option value="Call me">Call me</option>
                  <option value="Schedule a conversation">Schedule a conversation</option>
                </select>
              </label>
            </div>
            <label>
              Best way to reach me
              <select name="contactPreference" defaultValue="">
                <option value="">Select preference</option>
                <option value="Email">Email</option>
                <option value="Phone">Phone</option>
                <option value="Text">Text</option>
                <option value="LinkedIn">LinkedIn</option>
              </select>
            </label>
            <label>Anything else we should know?<textarea name="notes" rows={3} placeholder="Add context, goals, referral details, or questions." /></label>

            <div className="connect-section">
              <h2>Source</h2>
              <p>Optional, but helpful when this page is used at events, campaigns, or referrals.</p>
            </div>
            <div className="connect-two">
              <label>Campaign<input name="campaign" defaultValue={initial.campaign} /></label>
              <label>Referral source<input name="referralSource" defaultValue={initial.referralSource} /></label>
            </div>

            {state === 'error' ? <p className="connect-error" role="alert">{error}</p> : null}
            <button className="connect-submit" type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? 'Registering...' : 'Register'}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
