/**
 * Role-based access control for the EA Platform Chassis.
 */

export const PLATFORM_ROLES = [
  'owner',
  'admin',
  'manager',
  'staff',
  'viewer',
  'guest',
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

export const PLATFORM_ACTIONS = [
  'admin:access',
  'admin:manage',
  'portal:read',
  'portal:write',
  'org:manage',
  'billing:manage',
] as const;

export type PlatformAction = (typeof PLATFORM_ACTIONS)[number];

const ROLE_RANK: Record<PlatformRole, number> = {
  owner: 60,
  admin: 50,
  manager: 40,
  staff: 30,
  viewer: 20,
  guest: 10,
};

/** Minimum role required per capability. */
const ACTION_MIN_ROLE: Record<PlatformAction, PlatformRole> = {
  'admin:access': 'viewer',
  'admin:manage': 'admin',
  'portal:read': 'guest',
  'portal:write': 'staff',
  'org:manage': 'admin',
  'billing:manage': 'owner',
};

export function normalizeRole(role: string | undefined | null): PlatformRole {
  const lower = (role ?? '').toLowerCase();
  if ((PLATFORM_ROLES as readonly string[]).includes(lower)) {
    return lower as PlatformRole;
  }
  if (lower === 'administrator') return 'admin';
  return 'guest';
}

export function roleRank(role: PlatformRole): number {
  return ROLE_RANK[role] ?? 0;
}

export function roleAtLeast(role: PlatformRole, minimum: PlatformRole): boolean {
  return roleRank(role) >= roleRank(minimum);
}

export function can(role: PlatformRole, action: PlatformAction): boolean {
  const minimum = ACTION_MIN_ROLE[action];
  return roleAtLeast(role, minimum);
}

export function requireRole(
  role: PlatformRole,
  action: PlatformAction,
): { ok: true } | { ok: false; error: string } {
  if (can(role, action)) return { ok: true };
  return {
    ok: false,
    error: `Role "${role}" cannot perform "${action}".`,
  };
}

/** Map legacy EA admin roles (owner | admin) to platform roles. */
export function normalizeAdminRole(role: string | undefined): PlatformRole {
  const normalized = normalizeRole(role);
  if (normalized === 'guest' && role) {
    return role.toLowerCase() === 'owner' ? 'owner' : 'admin';
  }
  return normalized === 'guest' ? 'admin' : normalized;
}
