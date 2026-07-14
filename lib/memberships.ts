import type { PlatformRole } from '@/lib/rbac';
import { normalizeRole } from '@/lib/rbac';
import {
  MEMBERSHIPS_TABLE,
  escapeAirtableString,
  platformCreate,
  platformQuery,
  platformStoreConfigured,
  type AirtableRecord,
} from '@/lib/platform-store';

export type MembershipStatus = 'active' | 'invited' | 'suspended';

export type Membership = {
  id: string;
  userEmail: string;
  organizationId: string;
  role: PlatformRole;
  status: MembershipStatus;
};

function mapMembership(record: AirtableRecord): Membership {
  const f = record.fields;
  return {
    id: record.id,
    userEmail: String(f['User Email'] ?? '').toLowerCase(),
    organizationId: String(f['Organization Id'] ?? ''),
    role: normalizeRole(String(f['Role'] ?? 'guest')),
    status: (String(f['Status'] ?? 'active').toLowerCase() as MembershipStatus) || 'active',
  };
}

export async function findMembership(
  userEmail: string,
  organizationId: string,
): Promise<Membership | null> {
  if (!platformStoreConfigured() || organizationId.startsWith('org_')) return null;
  const email = escapeAirtableString(userEmail);
  const orgId = organizationId.replace(/'/g, "\\'");
  const records = await platformQuery(
    MEMBERSHIPS_TABLE,
    `AND(LOWER({User Email})='${email}', {Organization Id}='${orgId}')`,
    1,
  );
  return records[0] ? mapMembership(records[0]) : null;
}

export async function listMembershipsForUser(userEmail: string): Promise<Membership[]> {
  if (!platformStoreConfigured()) return [];
  const email = escapeAirtableString(userEmail);
  const records = await platformQuery(
    MEMBERSHIPS_TABLE,
    `AND(LOWER({User Email})='${email}', LOWER({Status})='active')`,
  );
  return records.map(mapMembership);
}

export async function createMembership(input: {
  userEmail: string;
  organizationId: string;
  role: PlatformRole;
  status?: MembershipStatus;
}): Promise<Membership | null> {
  if (!platformStoreConfigured() || input.organizationId.startsWith('org_')) return null;
  const record = await platformCreate(MEMBERSHIPS_TABLE, {
    'User Email': input.userEmail.trim().toLowerCase(),
    'Organization Id': input.organizationId,
    Role: input.role,
    Status: input.status ?? 'active',
  });
  return record ? mapMembership(record) : null;
}

export async function ensureOwnerMembership(input: {
  userEmail: string;
  organizationId: string;
  allowOwnerBootstrap?: boolean;
}): Promise<{ role: PlatformRole; membership: Membership | null }> {
  if (!platformStoreConfigured() || input.organizationId.startsWith('org_')) {
    return { role: 'guest', membership: null };
  }

  try {
    const existing = await findMembership(input.userEmail, input.organizationId);
    if (existing) {
      return existing.status === 'active'
        ? { role: existing.role, membership: existing }
        : { role: 'guest', membership: existing };
    }

    if (!input.allowOwnerBootstrap) return { role: 'guest', membership: null };

    const created = await createMembership({
      userEmail: input.userEmail,
      organizationId: input.organizationId,
      role: 'owner',
    });
    if (created) return { role: created.role, membership: created };
  } catch (err) {
    console.error('ensureOwnerMembership failed:', err);
  }

  return { role: 'guest', membership: null };
}
