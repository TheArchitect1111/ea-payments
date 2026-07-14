'use client';

import { useState } from 'react';
import MagicLinkForm from '@/components/auth/MagicLinkForm';
import PortalPasswordLogin from '@/components/auth/PortalPasswordLogin';
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

/** Shared login card — email code/link, plus password fallback on portal when inbox delivery fails. */
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
      {realm === 'portal' ? <PortalPasswordLogin next={next} /> : null}
    </div>
  );
}
