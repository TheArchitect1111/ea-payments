'use client';

import { useEffect, useState } from 'react';

export default function PaymentConfirmationEmail({ proposalId, sessionId }: { proposalId: string; sessionId?: string }) {
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'error'>(sessionId ? 'sending' : 'idle');

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function sendConfirmation() {
      try {
        const response = await fetch('/api/quick-quote/payment-confirmation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ proposalId, sessionId }),
        });
        if (cancelled) return;
        setState(response.ok ? 'sent' : 'error');
      } catch {
        if (!cancelled) setState('error');
      }
    }

    void sendConfirmation();
    return () => { cancelled = true; };
  }, [proposalId, sessionId]);

  if (state === 'idle') return null;
  return (
    <div className="mt-5 rounded-2xl border border-[#E4DED2] bg-[#FAF8F3] px-4 py-3 text-xs leading-5 text-neutral-500">
      {state === 'sending' ? 'Preparing your payment confirmation email…' : null}
      {state === 'sent' ? 'Your thank-you, payment confirmation, receipt summary, and next steps have been emailed to you.' : null}
      {state === 'error' ? 'Your payment is confirmed. We could not send the confirmation email automatically, so EA will follow up separately.' : null}
    </div>
  );
}
