export type { AuthRealm, UnifiedSession } from './types';
export {
  REALM_COOKIE,
  getBearerToken,
  verifyRealmToken,
  resolveSession,
  resolveSessionFromRequest,
} from './session';
export { exchangeMagicLinkToken } from './magic-link-exchange';
export type { MagicLinkExchangeResult, MagicLinkExchangeError } from './magic-link-exchange';
export {
  resolvePortalSession,
  resolvePortalSessionFromRequest,
  requirePortalSession,
  requirePortalSessionFromRequest,
} from './resolve-portal-session';
