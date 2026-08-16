'use client';

import { useState } from 'react';
import { LegalAcceptance } from '@/app/components/LegalAcceptance';
import type { LegalAcceptanceRecord, TrustLegalDocType } from '@/lib/trust-engine/types';

export default function CommitmentCheckout({ proposalId, paymentStage = 'deposit' }: { proposalId: string; paymentStage?: 'deposit' | 'final' }) {
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
    const stage = document.createElement('input');
    stage.type = 'hidden';
    stage.name = 'paymentStage';
    stage.value = paymentStage;
    form.appendChild(stage);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div className="mt-6">
      <LegalAcceptance
        productId="portal_products"
        userId={`proposal-${proposalId}`}
        onAccepted={acceptAndPay}
        continueLabel={paymentStage === 'final' ? 'Pay final balance securely' : 'Pay $250 deposit securely'}
      />
      {error ? (
        <p className="mt-3 text-sm font-semibold text-red-700" role="alert">
          {error}
        </p>
      ) : null}
      <p className="mt-4 text-center text-xs text-neutral-400">
        {paymentStage === 'final'
          ? 'Full access and activation follow after the final balance clears.'
          : 'The deposit reserves your development window. The final balance is due before activation and full access.'}
      </p>
    </div>
  );
}
