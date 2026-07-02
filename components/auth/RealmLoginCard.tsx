'use client';

import MagicLinkForm from '@/components/auth/MagicLinkForm';
import DemoPasswordLogin from '@/components/auth/DemoPasswordLogin';
import type { MagicLinkRealm } from '@/lib/magic-link';

type Props = {
  realm: MagicLinkRealm;
  next?: string;
  error?: string | null;
  title?: string;
  subtitle?: string;
  buttonLabel?: string;
  showTitle?: boolean;
};

/** Shared magic-link login card used across admin, portal, and Simplifi sign-in pages. */
export default function RealmLoginCard({
  realm,
  next,
  error,
  title,
  subtitle,
  buttonLabel,
  showTitle,
}: Props) {
  const showDemo = realm === 'portal' || realm === 'simplifi';

  return (
    <div className="pl-card">
      {error ? (
        <p className="pl-error" role="alert">
          {error}
        </p>
      ) : null}
      <MagicLinkForm
        realm={realm}
        next={next}
        title={title}
        subtitle={subtitle}
        buttonLabel={buttonLabel}
        showTitle={showTitle}
      />
      {showDemo ? (
        <>
          <div className="pl-divider" aria-hidden />
          <DemoPasswordLogin next={next} compact />
        </>
      ) : null}
    </div>
  );
}
