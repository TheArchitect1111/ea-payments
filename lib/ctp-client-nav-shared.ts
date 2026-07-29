/**
 * Client-safe Client Experience nav types and pure helpers.
 * Server resolution lives in `@/lib/ctp-client-nav`.
 */
export type ClientExperienceNavId =
  | 'journey'
  | 'listings'
  | 'progress'
  | 'pipeline'
  | 'documents'
  | 'messages'
  | 'support'
  | 'intake';

export type ClientExperienceNavItem = {
  id: ClientExperienceNavId;
  label: string;
  href: string;
};

const QUIET_NAV_IDS = new Set<ClientExperienceNavId>(['journey', 'listings']);

/**
 * Primary destinations match the client mental model.
 * Journey / listings stay reachable but are not competing home links.
 */
export function isQuietClientExperienceNavId(id: ClientExperienceNavId): boolean {
  return QUIET_NAV_IDS.has(id);
}
