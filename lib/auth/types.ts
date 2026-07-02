import type { PlatformRole } from '@/lib/rbac';

/**
 * Unified auth realms for the EA Platform.
 * `portal` and `simplifi` share the `ea_portal_session` cookie + chassis HMAC;
 * `admin` and `partner` have their own cookies/signers. The unified session
 * layer is a facade over the existing per-realm signers — it does NOT re-sign
 * tokens, so it is fully backward-compatible with sessions issued today.
 */
export type AuthRealm = 'portal' | 'simplifi' | 'admin' | 'partner';

/** Normalized session shape used across web (cookie) and API/mobile (Bearer). */
export interface UnifiedSession {
  realm: AuthRealm;
  /** Stable subject id — email for portal/admin, partnerId for partner. */
  sub: string;
  email?: string;
  name?: string;
  role: PlatformRole;
  orgId?: string;
  /** Portal tenant slug (portal/simplifi realms). */
  slug?: string;
  /** Partner-only fields. */
  partnerId?: string;
  tier?: string;
  /** Expiry epoch ms when known. */
  exp?: number;
}
