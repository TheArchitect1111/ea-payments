import { roleAtLeast, type PlatformRole } from '@/lib/rbac';
import {
  isUniversalPersonRoleCode,
  type UniversalPersonRoleCode,
} from '@/lib/people/types';

const STAFF_IMPORT_ROLES: UniversalPersonRoleCode[] = [
  'client',
  'member',
  'volunteer',
  'participant',
  'donor',
  'student',
  'other',
];

const PLATFORM_ROLE_STRINGS = new Set([
  'owner',
  'admin',
  'manager',
  'staff',
  'viewer',
  'guest',
  'administrator',
]);

/** INV-8 — directory roles importable by actor PlatformRole. Never PlatformRole. */
export function importableDirectoryRolesForActor(
  actorRole: PlatformRole,
): UniversalPersonRoleCode[] | 'all' | 'none' {
  if (roleAtLeast(actorRole, 'admin')) return 'all';
  if (roleAtLeast(actorRole, 'manager')) {
    return UNIVERSAL_EXCEPT_ORG_LEADER;
  }
  if (roleAtLeast(actorRole, 'staff')) return STAFF_IMPORT_ROLES;
  return 'none';
}

const UNIVERSAL_EXCEPT_ORG_LEADER: UniversalPersonRoleCode[] = [
  'client',
  'member',
  'employee',
  'volunteer',
  'student',
  'parent_guardian',
  'donor',
  'participant',
  'provider',
  'advisor',
  'authorized_representative',
  'staff_contact',
  'other',
];

export type ImportRow = {
  displayName: string;
  email: string;
  phone?: string;
  roles: string[];
  householdName?: string;
  guardianEmail?: string;
  /** Rejected if present — PlatformRole elevation attempt (ADV-12). */
  platformRole?: string;
  membershipRole?: string;
};

export type ImportRowResult =
  | { ok: true; roles: UniversalPersonRoleCode[] }
  | { ok: false; error: string };

export function validateImportRow(
  row: ImportRow,
  actorRole: PlatformRole,
): ImportRowResult {
  if (row.platformRole || row.membershipRole) {
    return { ok: false, error: 'Import cannot assign PlatformRole or Membership role' };
  }
  for (const r of row.roles) {
    const lower = r.trim().toLowerCase();
    if (PLATFORM_ROLE_STRINGS.has(lower)) {
      return { ok: false, error: `Rejected PlatformRole token in roles: ${r}` };
    }
  }

  const allowed = importableDirectoryRolesForActor(actorRole);
  if (allowed === 'none') {
    return { ok: false, error: 'Actor cannot import people' };
  }

  const resolved: UniversalPersonRoleCode[] = [];
  for (const r of row.roles) {
    const code = r.trim().toLowerCase();
    if (!isUniversalPersonRoleCode(code)) {
      return { ok: false, error: `Invalid directory role: ${r}` };
    }
    if (allowed !== 'all' && !allowed.includes(code)) {
      return { ok: false, error: `Role not permitted for actor: ${code}` };
    }
    resolved.push(code);
  }
  return { ok: true, roles: resolved };
}
