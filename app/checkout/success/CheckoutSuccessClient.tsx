'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type SessionStatus = {
  ok?: boolean;
  paid?: boolean;
  isWebsitePortalAuto?: boolean;
  siteUrl?: string;
  portalLoginUrl?: string;
  portalSlug?: string;
  ready?: boolean;
  error?: string;
};

type Props = {
  sessionId?: string;
  packageId?: string;
  fulfillment?: string;
  type?: string;
};

export default function CheckoutSuccessClient({
  sessionId,
  packageId,
  fulfillment,
  type,
}: Props) {
  const isSubscription = type === 'subscription';
  const presumedAuto =
    fulfillment === 'website-portal-auto' || packageId === 'website_portal_starter';

  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [polling, setPolling] = useState(Boolean(sessionId && presumedAuto));

  useEffect(() => {
    if (!sessionId || !presumedAuto) return;

    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 20;

    async function poll() {
      attempts += 1;
      try {
        const res = await fetch(`/api/checkout/session-status?session_id=${encodeURIComponent(sessionId!)}`);
        const data = (await res.json()) as SessionStatus;
        if (cancelled) return;
        setStatus(data);
        if (data.ready || attempts >= maxAttempts) {
          setPolling(false);
          return;
        }
      } catch {
        if (attempts >= maxAttempts) {
          setPolling(false);
          return;
        }
      }
      window.setTimeout(poll, 2000);
    }

    void poll();
    return () => {
      cancelled = true;
    };
  }, [sessionId, presumedAuto]);

  const isWebsitePortalAuto = status?.isWebsitePortalAuto ?? presumedAuto;
  const siteUrl = status?.siteUrl;
  const portalLoginUrl = status?.portalLoginUrl || '/portal/login';
  const ready = Boolean(siteUrl);

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="bg-neutral-950 px-6 py-8 text-center">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
          Efficiency Architects
        </p>
      </div>

      <div className="mx-auto max-w-lg px-6 py-20 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl font-bold text-green-600">
          &#10003;
        </div>

        <h1 className="text-2xl font-extrabold uppercase tracking-wide text-neutral-900">
          {isWebsitePortalAuto
            ? ready
              ? 'You Are Live'
              : 'Provisioning Your Site'
            : isSubscription
              ? 'Subscription Started'
              : 'Payment Received'}
        </h1>

        <p className="mt-4 text-sm leading-relaxed text-neutral-600">
          {isWebsitePortalAuto
            ? ready
              ? 'Your website and client portal are ready. Open your live site below, and check email for one-click portal login.'
              : polling
                ? 'Payment received. Finishing your website and portal — this usually takes under a minute.'
                : 'Payment received. Check your email for your live website link and portal login. Provisioning may still be finishing.'
            : isSubscription
              ? 'Your subscription is active. A confirmation receipt is on its way to your email.'
              : 'Your payment has been processed successfully. A confirmation receipt is on its way to your email.'}
        </p>

        {!isWebsitePortalAuto ? (
          <p className="mt-3 text-sm leading-relaxed text-neutral-600">
            {isSubscription
              ? 'Watch for your welcome email with portal access. Manage billing anytime from your portal after you sign in.'
              : 'Your onboarding has been queued. Watch for your welcome email with portal access, next steps, and the first items needed to begin delivery.'}
          </p>
        ) : null}

        {isWebsitePortalAuto && siteUrl ? (
          <p className="mt-4 break-all text-sm font-semibold text-neutral-800">
            <a href={siteUrl} className="underline decoration-neutral-400 underline-offset-2 hover:decoration-neutral-900">
              {siteUrl}
            </a>
          </p>
        ) : null}

        <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          {isWebsitePortalAuto && siteUrl ? (
            <a
              href={siteUrl}
              className="inline-block bg-neutral-950 px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-neutral-800"
            >
              Open My Website
            </a>
          ) : null}
          <Link
            href={portalLoginUrl}
            className={`inline-block px-8 py-3 text-xs font-bold uppercase tracking-widest ${
              isWebsitePortalAuto && siteUrl
                ? 'border border-neutral-300 bg-white text-neutral-800 hover:border-neutral-800'
                : 'bg-neutral-950 text-white hover:bg-neutral-800'
            }`}
          >
            Client Login
          </Link>
        </div>
      </div>
    </main>
  );
}
