/**
 * Thin People ACL — authoritative allow/deny.
 * INV-16: this module must NOT import the OpenFGA projector port.
 */
import { roleAtLeast, type PlatformRole } from '@/lib/rbac';
import { isExpired, isPersonMinorAt } from '@/lib/people/minor';
import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import {
  getDirectoryMembership,
  getPersonById,
  listAclGrantsForResource,
  listConsents,
  listRelationshipsForOrg,
} from '@/lib/people/store';
import type {
  AclRelation,
  AclResourceType,
  Person,
  PersonAclGrant,
  PersonConsent,
  PersonDirectoryMembership,
  PersonId,
  PersonRelationship,
} from '@/lib/people/types';

export type PeopleAccessActor = {
  email?: string;
  role: PlatformRole;
  personId?: PersonId;
};

/**
 * Per-request rows loaded by the caller (see `lib/people/acl-context.ts`).
 *
 * INV-27: this is request-scoped only. It must never be memoized across requests —
 * guardian edges, consents, expiry, and majority are always re-evaluated from the
 * system of record at check time.
 */
export type PeopleAclContext = {
  person?: Person | null;
  relationships?: PersonRelationship[];
  consents?: PersonConsent[];
  grants?: PersonAclGrant[];
  actorDirectoryMembership?: PersonDirectoryMembership | null;
};

export type PeopleAccessResult =
  | { ok: true; relation: AclRelation }
  | { ok: false; code: 'forbidden' | 'not_found' | 'cross_tenant' };

function normalizeEmail(email?: string): string {
  return (email || '').trim().toLowerCase();
}

function hasGuardianEdge(params: {
  organizationId: string;
  actorPersonId: PersonId;
  subjectPersonId: PersonId;
  now: Date;
  relationships?: PersonRelationship[];
}): boolean {
  const edges = params.relationships ?? listRelationshipsForOrg(params.organizationId);
  return edges.some((r) => {
    if (r.status !== 'active') return false;
    if (isExpired(r.expiresAt, params.now)) return false;
    if (r.fromPersonId !== params.actorPersonId || r.toPersonId !== params.subjectPersonId) {
      return false;
    }
    return r.type === 'guardian_of' || r.type === 'authorized_rep_for';
  });
}

function guardianConsentOk(
  subjectPersonId: PersonId,
  now: Date,
  consents?: PersonConsent[],
): boolean {
  return (consents ?? listConsents(subjectPersonId)).some((c) => {
    if (c.purpose !== 'share_with_guardian' && c.purpose !== 'portal_access') return false;
    if (c.status !== 'granted') return false;
    if (isExpired(c.expiresAt, now)) return false;
    return true;
  });
}

function actorHasGuardianDirectoryRole(
  organizationId: string,
  actorPersonId: PersonId,
  membership?: PersonDirectoryMembership | null,
): boolean {
  const m = membership === undefined ? getDirectoryMembership(organizationId, actorPersonId) : membership;
  if (!m || m.status !== 'active') return false;
  return m.roles.includes('parent_guardian') || m.roles.includes('authorized_representative');
}

export async function assertPeopleAccess(input: {
  /** INV-1: must already be resolved from session.slug — never from request body. */
  organizationId: string;
  portalSlug: string;
  actor: PeopleAccessActor;
  resourceType: AclResourceType;
  resourceId: string;
  relationNeeded: AclRelation | AclRelation[];
  field?: string;
  now?: Date;
  /** Request-scoped rows (durable adapter path). Omit to read the memory store. */
  context?: PeopleAclContext;
}): Promise<PeopleAccessResult> {
  const now = input.now || new Date();
  const ctx = input.context;

  if (!isUniversalPeopleEnabled()) {
    return { ok: false, code: 'not_found' };
  }

  if (process.env.NODE_ENV === 'production' && input.organizationId.startsWith('org_')) {
    return { ok: false, code: 'forbidden' };
  }

  if (input.resourceType !== 'person') {
    return { ok: false, code: 'forbidden' };
  }

  const person = ctx && 'person' in ctx ? ctx.person : getPersonById(input.resourceId);
  if (!person) return { ok: false, code: 'not_found' };

  if (person.organizationId !== input.organizationId) {
    return { ok: false, code: 'not_found' };
  }

  const needed = Array.isArray(input.relationNeeded)
    ? input.relationNeeded
    : [input.relationNeeded];

  const isAdmin = roleAtLeast(input.actor.role, 'admin');
  const isOwner = roleAtLeast(input.actor.role, 'owner');
  const isStaff = roleAtLeast(input.actor.role, 'staff');

  const restrictedLife =
    person.lifecycleStatus === 'archived' ||
    person.lifecycleStatus === 'deceased' ||
    Boolean(person.mergedIntoPersonId);
  if (restrictedLife && !isAdmin && !isOwner) {
    return { ok: false, code: 'not_found' };
  }

  const grants =
    ctx?.grants ?? listAclGrantsForResource(input.organizationId, 'person', person.id);
  for (const g of grants) {
    if (isExpired(g.expiresAt, now)) continue;
    const matchesGrantee =
      (g.grantee.kind === 'user_email' &&
        normalizeEmail(g.grantee.email) === normalizeEmail(input.actor.email)) ||
      (g.grantee.kind === 'person' && g.grantee.personId === input.actor.personId) ||
      (g.grantee.kind === 'platform_role' && roleAtLeast(input.actor.role, g.grantee.role));
    if (!matchesGrantee) continue;
    if (input.field && g.fieldsDeny?.includes(input.field)) continue;
    if (input.field && g.fieldsAllow?.length && !g.fieldsAllow.includes(input.field)) continue;
    if (needed.includes(g.relation) || g.relation === 'org_admin') {
      return { ok: true, relation: g.relation };
    }
  }

  if (isAdmin || isOwner) {
    return { ok: true, relation: 'org_admin' };
  }

  const actorEmail = normalizeEmail(input.actor.email);
  if (
    actorEmail &&
    person.emails.some((e) => normalizeEmail(e.value) === actorEmail) &&
    !restrictedLife
  ) {
    if (needed.includes('self') || needed.includes('viewer') || needed.includes('editor')) {
      return { ok: true, relation: 'self' };
    }
  }

  if (input.actor.personId && isPersonMinorAt(person, now)) {
    const edge = hasGuardianEdge({
      organizationId: input.organizationId,
      actorPersonId: input.actor.personId,
      subjectPersonId: person.id,
      now,
      relationships: ctx?.relationships,
    });
    const dirOk = actorHasGuardianDirectoryRole(
      input.organizationId,
      input.actor.personId,
      ctx && 'actorDirectoryMembership' in ctx ? ctx.actorDirectoryMembership : undefined,
    );
    const consentOk = guardianConsentOk(person.id, now, ctx?.consents);
    if (edge && dirOk && consentOk) {
      if (needed.includes('guardian') || needed.includes('viewer')) {
        return { ok: true, relation: 'guardian' };
      }
    }
  }

  if (isStaff && person.lifecycleStatus === 'active') {
    if (input.field === 'dateOfBirth') {
      if (roleAtLeast(input.actor.role, 'manager') && needed.includes('viewer')) {
        return { ok: true, relation: 'viewer' };
      }
      return { ok: false, code: 'forbidden' };
    }
    if (needed.includes('viewer') || needed.includes('editor')) {
      return { ok: true, relation: 'viewer' };
    }
  }

  return { ok: false, code: 'forbidden' };
}

/** INV-14 — shared redaction for GET and export. */
export function redactPersonForActor(
  actor: PeopleAccessActor,
  person: Person,
  access: { relation: AclRelation },
): Partial<Person> {
  const out: Partial<Person> = {
    id: person.id,
    organizationId: person.organizationId,
    portalSlug: person.portalSlug,
    displayName: person.displayName,
    preferredName: person.preferredName,
    lifecycleStatus: person.lifecycleStatus,
    source: person.source,
    createdAt: person.createdAt,
    updatedAt: person.updatedAt,
  };

  const canContact =
    access.relation === 'org_admin' ||
    access.relation === 'owner' ||
    access.relation === 'editor' ||
    access.relation === 'self' ||
    access.relation === 'guardian' ||
    (access.relation === 'viewer' && roleAtLeast(actor.role, 'staff'));

  if (canContact) {
    out.emails = person.emails;
    out.phones = person.phones;
    out.legalName = person.legalName;
  }

  const canDob =
    access.relation === 'self' ||
    access.relation === 'guardian' ||
    access.relation === 'org_admin' ||
    access.relation === 'owner' ||
    roleAtLeast(actor.role, 'manager');

  if (canDob) {
    out.dateOfBirth = person.dateOfBirth;
    out.isMinor = person.isMinor;
  }

  if (
    access.relation === 'org_admin' ||
    access.relation === 'owner' ||
    roleAtLeast(actor.role, 'admin')
  ) {
    out.externalIds = person.externalIds;
    out.ownerUserEmail = person.ownerUserEmail;
    out.mergedIntoPersonId = person.mergedIntoPersonId;
    out.deceasedAt = person.deceasedAt;
  }

  return out;
}

export function personToExportRow(
  actor: PeopleAccessActor,
  person: Person,
  access: { relation: AclRelation },
): Record<string, string> {
  const redacted = redactPersonForActor(actor, person, access);
  return {
    id: String(redacted.id || ''),
    displayName: String(redacted.displayName || ''),
    email: redacted.emails?.[0]?.value || '',
    dateOfBirth: redacted.dateOfBirth || '',
    lifecycleStatus: String(redacted.lifecycleStatus || ''),
  };
}
