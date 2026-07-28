'use client';

import { useRouter } from 'next/navigation';
import { LegalAcceptance } from '@/app/components/LegalAcceptance';
import type { ClientLegalProfile, TrustLegalDocType, TrustProductId } from '@/lib/trust-engine/types';
import { NAVY } from '@/lib/design-system';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

/**
 * Blocks normal app access until required checkbox docs are accepted.
 * MSA/SOW remain excluded from this flow.
 */
export function LegalReacceptanceGate({
  productId,
  userId,
  email,
  profile,
  nextPath,
}: {
  productId: TrustProductId;
  userId: string;
  email?: string;
  profile?: ClientLegalProfile | null;
  nextPath?: string;
}) {
  const router = useRouter();

  function safeNext(raw?: string): string {
    if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
    if (raw.startsWith('/legal') || raw.startsWith('/trust')) {
      return productId === 'simplifi' ? '/simplifi/workspace' : '/';
    }
    return raw;
  }

  async function onAccepted(records: { docType: TrustLegalDocType }[]) {
    const docTypes = records.map((r) => r.docType);
    const next = safeNext(nextPath);
    const res = await fetch('/api/trust/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId,
        docTypes,
        isReacceptance: true,
        next,
      }),
    });
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      alert(data.error || 'Unable to save acceptance. Please try again.');
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', padding: '0 1.25rem' }}>
      <p
        style={{
          margin: '0 0 0.5rem',
          fontSize: '0.75rem',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          fontWeight: 700,
          color: '#775d12',
        }}
      >
        {CX_EMOTION.legal.gateKicker}
      </p>
      <h1 style={{ margin: '0 0 0.75rem', color: NAVY, fontSize: '1.75rem' }}>
        {CX_EMOTION.legal.gateTitle}
      </h1>
      <p style={{ margin: '0 0 1.5rem', color: '#555', lineHeight: 1.6 }}>
        {email
          ? `${CX_EMOTION.legal.gateBody} (${email})`
          : CX_EMOTION.legal.gateBody}
      </p>
      <LegalAcceptance
        productId={productId}
        userId={userId}
        profile={profile}
        onlyRequiring
        onAccepted={onAccepted}
        continueLabel="Accept and continue"
      />
    </div>
  );
}
