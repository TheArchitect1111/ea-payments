import { redirect } from 'next/navigation';

/**
 * Branded Simplifi Orb entry — EA-owned path.
 * Canonical: https://app.efficiencyarchitects.online/simplifiorb
 * Also works on apex: https://efficiencyarchitects.online/simplifiorb
 */
export default function SimplifiOrbEntryPage() {
  redirect('/simplifi/workspace');
}
