'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { resolveOnboardingAcceptanceDocs } from '@/lib/trust-engine/legal-pack';
import type {
  ClientLegalProfile,
  LegalAcceptanceRecord,
  TrustProductId,
} from '@/lib/trust-engine/types';
import { NAVY, GOLD, CREAM } from '@/lib/design-system';

export type LegalAcceptanceProps = {
  productId: TrustProductId;
  userId: string;
  /** Called when all required docs are accepted. */
  onAccepted: (records: LegalAcceptanceRecord[]) => void | Promise<void>;
  /** Optional continue label */
  continueLabel?: string;
  /** When set with onlyRequiring, only docs needing acceptance are shown. */
  profile?: ClientLegalProfile | null;
  onlyRequiring?: boolean;
};

/**
 * Reusable onboarding legal acceptance — Continue disabled until all required boxes are checked.
 * Client-safe: does not import Node/fs Trust Engine modules.
 */
export function LegalAcceptance({
  productId,
  userId,
  onAccepted,
  continueLabel = 'Continue',
  profile = null,
  onlyRequiring = false,
}: LegalAcceptanceProps) {
  const docs = useMemo(() => {
    const all = resolveOnboardingAcceptanceDocs(productId);
    if (!onlyRequiring) return all;
    return all.filter((doc) => {
      const accepted = profile?.latestByDoc[doc.docType];
      return !accepted || accepted.version !== doc.version;
    });
  }, [productId, profile, onlyRequiring]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);

  const allAccepted =
    docs.length > 0 && docs.every((doc) => checked[`${doc.docType}:${doc.version}`]);

  async function handleContinue() {
    if (!allAccepted || submitting) return;
    setSubmitting(true);
    const acceptedAt = new Date().toISOString();
    const records: LegalAcceptanceRecord[] = docs.map((doc) => ({
      userId,
      productId,
      docType: doc.docType,
      version: doc.version,
      acceptedAt,
      href: doc.href,
    }));
    try {
      await onAccepted(records);
    } finally {
      setSubmitting(false);
    }
  }

  if (docs.length === 0) {
    return (
      <p style={{ color: '#555' }}>No legal acknowledgements are configured for this product.</p>
    );
  }

  return (
    <section
      aria-labelledby="legal-acceptance-title"
      style={{
        background: CREAM,
        borderLeft: `3px solid ${NAVY}`,
        padding: '1.5rem 1.35rem',
        maxWidth: 560,
      }}
    >
      <h2
        id="legal-acceptance-title"
        style={{ margin: 0, fontSize: '1.15rem', color: NAVY, fontWeight: 800 }}
      >
        Before continuing, please review
      </h2>
      <ul style={{ listStyle: 'none', margin: '1.25rem 0 0', padding: 0 }}>
        {docs.map((doc) => {
          const key = `${doc.docType}:${doc.version}`;
          const label =
            doc.docType === 'eula'
              ? 'End User License Agreement'
              : doc.docType === 'tos'
                ? 'Terms of Service'
                : doc.docType === 'ai_disclosure'
                  ? 'AI Disclosure'
                  : doc.title;
          return (
            <li key={key} style={{ marginBottom: '0.85rem' }}>
              <label
                style={{
                  display: 'flex',
                  gap: '0.65rem',
                  alignItems: 'flex-start',
                  cursor: 'pointer',
                  fontSize: '0.95rem',
                  color: '#1a1a2e',
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked[key])}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [key]: e.target.checked }))
                  }
                  style={{ marginTop: '0.2rem' }}
                />
                <span>
                  {label}{' '}
                  <Link href={doc.href} target="_blank" rel="noreferrer" style={{ color: NAVY }}>
                    (view)
                  </Link>
                  <span style={{ display: 'block', fontSize: '0.75rem', color: '#777' }}>
                    Version {doc.version}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        disabled={!allAccepted || submitting}
        onClick={() => void handleContinue()}
        style={{
          marginTop: '1.25rem',
          padding: '0.75rem 1.35rem',
          border: 'none',
          background: allAccepted ? NAVY : '#c4c4c4',
          color: allAccepted ? GOLD : '#666',
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontSize: '0.75rem',
          cursor: allAccepted ? 'pointer' : 'not-allowed',
        }}
      >
        {submitting ? 'Saving…' : continueLabel}
      </button>
    </section>
  );
}
