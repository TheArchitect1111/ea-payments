import { redirect } from 'next/navigation';

const CANONICAL_CTP = 'https://cc.efficiencyarchitects.online/ctp';

/** QUARANTINED thank-you — see /ctp-intake page. */
export default function QuarantinedCtpIntakeThankYouPage() {
  redirect(CANONICAL_CTP);
}
