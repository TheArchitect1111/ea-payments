import { redirect } from 'next/navigation';

/** Canonical CTP intake (saved Jul 14): CRA OperationalMRI on /ctp */
const CANONICAL_CTP = 'https://cc.efficiencyarchitects.online/ctp';

/**
 * QUARANTINED — Do not restore as CTP.
 * Discover wizard mislabeled as Consider the Possibilities™.
 */
export default function QuarantinedCtpIntakePage() {
  redirect(CANONICAL_CTP);
}
