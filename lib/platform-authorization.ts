/**
 * Shared platform authorization — re-exports admin session guards used by API routes.
 */
export {
  adminAuthJsonError,
  requireAdminActionFromRequest,
  requireAdminSessionFromRequest,
  EA_ADMIN_COOKIE,
} from '@/lib/admin-session-guard';
