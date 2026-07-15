import { redirect } from 'next/navigation';

/**
 * QUARANTINED — Do not restore as CTP.
 * This path was the Discover wizard mislabeled as Consider the Possibilities™.
 * Canonical public CTP entry: /consider/selena
 */
export default function QuarantinedCtpIntakePage() {
  redirect('/consider/selena');
}
