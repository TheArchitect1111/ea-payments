'use client';

import { FormEvent, useState } from 'react';

export default function AmplifiRegistrationForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/checkout/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: String(form.get('name') || ''),
          organization: String(form.get('organization') || ''),
          email: String(form.get('email') || ''),
          phone: String(form.get('phone') || ''),
          planId: 'amplifi_social',
          referralSource: 'amplifi-pricing',
        }),
      });
      const data = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !data.url) {
        setError(data.error || 'Amplifi could not open secure checkout.');
        return;
      }
      window.location.assign(data.url);
    } catch {
      setError('Amplifi could not connect to secure checkout. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="am-register-form" onSubmit={submit}>
      <div>
        <p className="am-commerce-kicker">STEP 1 OF 2</p>
        <h2>Who should Amplifi guide?</h2>
        <p className="am-form-intro">We will use these details to prepare your workspace and send the next setup step.</p>
      </div>
      <label>Full name<input name="name" autoComplete="name" required /></label>
      <label>Business or organization<input name="organization" autoComplete="organization" required /></label>
      <label>Email address<input name="email" type="email" autoComplete="email" required /></label>
      <label>Phone number <span>optional</span><input name="phone" type="tel" autoComplete="tel" /></label>
      {error ? <p className="am-form-error" role="alert">{error}</p> : null}
      <button type="submit" disabled={loading}>{loading ? 'Opening secure checkout...' : 'Continue to checkout →'}</button>
      <div className="am-checkout-trust"><span>Secure payment</span><span>Cancel anytime</span><span>Guided setup</span></div>
      <small>By continuing, you agree to the <a href="/legal/terms">Terms of Service</a> and <a href="/legal/privacy">Privacy Policy</a>.</small>
    </form>
  );
}
