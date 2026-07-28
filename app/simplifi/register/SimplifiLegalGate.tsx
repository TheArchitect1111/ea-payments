'use client';

import { useEffect, useState } from 'react';
import { LegalAcceptance } from '@/app/components/LegalAcceptance';
import { serializeLegalAcceptance } from '@/lib/trust-engine/acceptance';
import type { LegalAcceptanceRecord } from '@/lib/trust-engine/types';

const STORAGE_KEY = 'ea.legalAcceptance.simplifi';

/**
 * Pre-auth Simplifi register gate — sessionStorage only.
 * Durable acceptance is recorded after login via LegalReacceptanceShell + /api/trust/accept.
 */
export function SimplifiLegalGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    try {
      setAccepted(Boolean(window.sessionStorage.getItem(STORAGE_KEY)));
    } catch {
      setAccepted(false);
    }
    setReady(true);
  }, []);

  async function onAccepted(records: LegalAcceptanceRecord[]) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, serializeLegalAcceptance(records));
    } catch {
      // non-fatal
    }
    setAccepted(true);
  }

  if (!ready) {
    return <p className="pl-lede">Loading…</p>;
  }

  if (accepted) {
    return <>{children}</>;
  }

  return (
    <div style={{ marginTop: '1.5rem' }}>
      <LegalAcceptance
        productId="simplifi"
        userId="simplifi-register-pending"
        onAccepted={onAccepted}
        continueLabel="Agree and continue"
      />
    </div>
  );
}
