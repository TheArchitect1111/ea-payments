'use client';

import { useState } from 'react';
import { LegalAcceptance } from '@/app/components/LegalAcceptance';
import type { LegalAcceptanceRecord, TrustLegalDocType } from '@/lib/trust-engine/types';

function fmt(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(value);
}

export default function CommitmentCheckout({
  proposalId,
  paymentStage = 'deposit',
  depositAmount = 500,
}: {
  proposalId: string;
  paymentStage?: 'deposit' | 'final';
  depositAmount?: number;
}) {
  const [error, setError] = useState('');

  async function acceptAndPay(records: LegalAcceptanceRecord[]) {
    setError('');
    const docTypes = records.map((record) => record.docType as TrustLegalDocType);
    const response = await fetch('/api/trust/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: 'portal_products', docTypes, isReacceptance: false, next: `/commitment/${encodeURIComponent(proposalId)}` }),
    });

    if (!response.ok) {
      const payload = (await response.json().catch(() => ({}))) as { error?: string };
      setError(payload.error || 'We could not save your acceptance. Please try again.');
      return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/api/checkout/proposal';
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = 'proposalId'; input.value = proposalId; form.appendChild(input);
    const stage = document.createElement('input');
    stage.type = 'hidden'; stage.name = 'paymentStage'; stage.value = paymentStage; form.appendChild(stage);
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <div>
      <LegalAcceptance
        productId="portal_products"
        userId={`proposal-${proposalId}`}
        onAccepted={acceptAndPay}
        variant="premium"
        continueLabel={paymentStage === 'final' ? 'Accept & pay final balance' : `Accept agreement & pay ${fmt(depositAmount)}`}
      />
      {error ? <p className="mt-3 text-sm font-semibold text-red-700" role="alert">{error}</p> : null}
      <p className="mt-4 text-center text-[11px] leading-5 text-neutral-400">
        {paymentStage === 'final'
          ? 'Secure checkout opens after acceptance. Full access follows when the final balance clears.'
          : 'Secure checkout opens after acceptance. Your remaining balance is due before final launch or full administrator access.'}
      </p>
    </div>
  );
}
