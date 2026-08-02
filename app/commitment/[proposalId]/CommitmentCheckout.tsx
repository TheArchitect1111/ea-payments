'use client';

import { useState } from 'react';
import { LegalAcceptance } from '@/app/components/LegalAcceptance';
import type { LegalAcceptanceRecord, TrustLegalDocType } from '@/lib/trust-engine/types';

export default function CommitmentCheckout({ proposalId }: { proposalId: string }) {
  const [error, setError] = useState('');

  async function acceptAndPay(records: LegalAcceptanceRecord[]) {
    setError('');
    const docTypes = records.map((record) => record.docType as TrustLegalDocType);
    const response = await fetch('/api/trust/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        productId: 'portal_products',
        docTypes,
        isReacceptance: false,
        next: `/commitment/${encodeURIComponent(proposalId)}`,
      }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || 'We could not save your acceptance. Please sign in and try again.');
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/checkout/proposal';
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'proposalId';
    input.value = proposalId;
    form.appendChild(input);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div className="mt-6">
      <LegalAcceptance
        productId="portal_products"
        userId={`proposal-${proposalId}`}
        onAccepted={acceptAndPay}
        continueLabel="Accept and continue to secure payment"
      />
      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-center text-xs text-neutral-400">
        Your payment is not processed until you complete the secure checkout.
      </p>
    </div>
  );
}
