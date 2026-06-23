'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import AuthNav from '@/components/auth/AuthNav';

type Realm = 'admin' | 'portal' | 'partner' | 'simplifi';

const CONFIG: Record<
  Realm,
  { title: string; lede: string; endpoint: string; assessmentLink?: string }
> = {
  admin: {
    title: 'Request admin access',
    lede: 'Admin accounts are approved by EA leadership. Submit your request and we will follow up.',
    endpoint: '/api/admin/register',
  },
  portal: {
    title: 'Request portal access',
    lede: 'New clients can start with the Operational MRI™ assessment or request direct portal access.',
    endpoint: '/api/portal/register',
    assessmentLink: '/assessment',
  },
  partner: {
    title: 'Request partner access',
    lede: 'Join the EA partner network to track referrals, commissions, and pipeline.',
    endpoint: '/api/partners/register',
  },
  simplifi: {
    title: 'Request Simplifi access',
    lede: 'Request Simplifi access or start with the Operational MRI assessment if you are still choosing the right EA path.',
    endpoint: '/api/portal/register',
    assessmentLink: '/assessment',
  },
};

export default function RegisterForm({ realm }: { realm: Realm }) {
  const config = CONFIG[realm];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          company: company.trim() || undefined,
          message: message.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? 'Could not submit request.');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setLoading(false);
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  }

  return (
    <>
      <AuthNav realm={realm} active="register" />
      <div className="pl-card">
        {success ? (
          <p className="pl-success">
            Request received. Our team will contact you at <strong>{email}</strong>.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="pl-form">
            <label className="pl-label" htmlFor="name">
              Full name
            </label>
            <input
              id="name"
              className="pl-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />

            <label className="pl-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="pl-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            {realm !== 'admin' ? (
              <>
                <label className="pl-label" htmlFor="company">
                  Company
                </label>
                <input
                  id="company"
                  className="pl-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </>
            ) : null}

            <label className="pl-label" htmlFor="message">
              Message (optional)
            </label>
            <textarea
              id="message"
              className="pl-input"
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />

            <button type="submit" className="pl-btn" disabled={loading}>
              {loading ? 'Submitting…' : 'Submit request'}
            </button>

            {error ? (
              <p className="pl-error" role="alert">
                {error}
              </p>
            ) : null}
          </form>
        )}

        {config.assessmentLink ? (
          <p className="pl-footer-text" style={{ marginTop: 16 }}>
            Prefer self-serve onboarding?{' '}
            <Link href={config.assessmentLink} className="pl-footer-link">
              Start the assessment
            </Link>
          </p>
        ) : null}
      </div>
    </>
  );
}
