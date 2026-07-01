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
export {
  REALM_LOGIN_COPY,
  getRealmLoginCopy,
  magicLinkErrorMessage,
} from './realm-login-copy';
export type { RealmLoginCopy } from './realm-login-copy';
