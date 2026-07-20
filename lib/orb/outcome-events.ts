/**
 * Cross-surface Orb outcome flashes (opportunity page → GlobalOrb).
 */
import type { OrbOutcomeFlash } from './types';

export const ORB_OUTCOME_FLASH_EVENT = 'simplifi-orb-outcome-flash';

export function emitOrbOutcomeFlash(flash: OrbOutcomeFlash): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(ORB_OUTCOME_FLASH_EVENT, { detail: flash }));
}

export function subscribeOrbOutcomeFlash(
  handler: (flash: OrbOutcomeFlash) => void,
): () => void {
  if (typeof window === 'undefined') return () => undefined;
  const listener = (event: Event) => {
    const detail = (event as CustomEvent<OrbOutcomeFlash>).detail;
    if (detail === 'success' || detail === 'learning') handler(detail);
  };
  window.addEventListener(ORB_OUTCOME_FLASH_EVENT, listener);
  return () => window.removeEventListener(ORB_OUTCOME_FLASH_EVENT, listener);
}
