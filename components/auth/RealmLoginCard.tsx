'use client';

import { useState } from 'react';
import MagicLinkForm from '@/components/auth/MagicLinkForm';
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

/** Shared magic-link login card — email link only (no password) across admin, portal, and Simplifi. */
export default function RealmLoginCard({
  realm,
  next,
  error,
  title,
  subtitle,
  buttonLabel,
  showTitle,
}: Props) {
  const [dismissed, setDismissed] = useState(false);
  const showError = Boolean(error) && !dismissed;

  return (
    <div className="pl-card">
      {showError ? (
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
        onSent={() => setDismissed(true)}
      />
    </div>
  );
}
