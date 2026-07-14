'use client';

import { useEffect } from 'react';

const STORAGE_KEY = 'ea:factory:opportunity';

type Props = {
  opportunity?: string;
};

export default function FactoryOpportunityState({ opportunity }: Props) {
  useEffect(() => {
    if (!opportunity) return;
    window.sessionStorage.setItem(STORAGE_KEY, opportunity);
  }, [opportunity]);

  return null;
}
