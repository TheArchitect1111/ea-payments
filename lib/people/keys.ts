/**
 * Phase 2B — durable composite identity keys.
 *
 * Airtable cannot express a SQL UNIQUE constraint, so uniqueness is enforced by
 * upsert-by-field against these deterministic keys (blueprint §6.1, P0-1).
 * Every key is org-scoped: cross-organization collisions are impossible by construction.
 */
import type {
  AclResourceType,
  Person,
  PersonAclGrant,
  PersonExternalId,
  PersonId,
  PersonProgramLinkKind,
  PersonRelationshipType,
} from '@/lib/people/types';
import { normalizeEmail } from '@/lib/people/types';

const SEP = '#';

function part(value: string): string {
  return value.trim();
}

function orgPart(organizationId: string): string {
  const org = part(organizationId);
  if (!org) throw new Error('organizationId required for People key derivation');
  return org;
}

/** `OrgEmailKey` — one per email on the person (primary and secondary), per P1-8. */
export function orgEmailKey(organizationId: string, email: string): string {
  const normalized = normalizeEmail(email);
  if (!normalized) throw new Error('email required for OrgEmailKey');
  return `${orgPart(organizationId)}${SEP}${normalized}`;
}

/** `OrgExternalKey` — unique external id triple (org, system, value). */
export function orgExternalKey(
  organizationId: string,
  system: PersonExternalId['system'] | string,
  value: string,
): string {
  const sys = part(String(system)).toLowerCase();
  const val = part(value);
  if (!sys || !val) throw new Error('system and value required for OrgExternalKey');
  return `${orgPart(organizationId)}${SEP}${sys}${SEP}${val}`;
}

/** Relationship `Edge Key` — resolves concurrent end+create to a single active edge. */
export function edgeKey(
  organizationId: string,
  fromPersonId: PersonId,
  toPersonId: PersonId,
  type: PersonRelationshipType,
): string {
  return [orgPart(organizationId), part(fromPersonId), part(toPersonId), part(type)].join(SEP);
}

export function directoryMembershipKey(organizationId: string, personId: PersonId): string {
  return `${orgPart(organizationId)}${SEP}${part(personId)}`;
}

export function programLinkKey(
  organizationId: string,
  personId: PersonId,
  kind: PersonProgramLinkKind,
  externalRef: string,
): string {
  return [orgPart(organizationId), part(personId), part(kind), part(externalRef)].join(SEP);
}

export function householdMemberKey(householdId: string, personId: PersonId): string {
  return `${part(householdId)}${SEP}${part(personId)}`;
}

export function consentKey(
  organizationId: string,
  personId: PersonId,
  purpose: string,
): string {
  return [orgPart(organizationId), part(personId), part(purpose)].join(SEP);
}

export function grantKey(
  organizationId: string,
  resourceType: AclResourceType,
  resourceId: string,
  grantee: PersonAclGrant['grantee'],
  relation: string,
): string {
  const granteePart =
    grantee.kind === 'user_email'
      ? `email:${normalizeEmail(grantee.email)}`
      : grantee.kind === 'person'
        ? `person:${part(grantee.personId)}`
        : `role:${part(grantee.role)}`;
  return [
    orgPart(organizationId),
    part(resourceType),
    part(resourceId),
    granteePart,
    part(relation),
  ].join(SEP);
}

export function mergeJobKey(organizationId: string, absorbedPersonId: PersonId): string {
  return `${orgPart(organizationId)}${SEP}${part(absorbedPersonId)}`;
}

export function mergeStepKey(mergeJobId: string, stepName: string): string {
  return `${part(mergeJobId)}${SEP}${part(stepName)}`;
}

export function importRowKey(importJobId: string, rowNumber: number): string {
  return `${part(importJobId)}${SEP}${rowNumber}`;
}

export function migrationCheckpointKey(organizationId: string, jobId: string): string {
  return `${orgPart(organizationId)}${SEP}${part(jobId)}`;
}

/** Uniqueness applies to non-merged, non-archived, non-deceased persons only (§6.1). */
export function personParticipatesInEmailUniqueness(person: Pick<
  Person,
  'mergedIntoPersonId' | 'lifecycleStatus'
>): boolean {
  if (person.mergedIntoPersonId) return false;
  return person.lifecycleStatus !== 'archived' && person.lifecycleStatus !== 'deceased';
}

/** External id uniqueness applies to all non-merged persons (§6.1). */
export function personParticipatesInExternalUniqueness(
  person: Pick<Person, 'mergedIntoPersonId'>,
): boolean {
  return !person.mergedIntoPersonId;
}

export function orgEmailKeysForPerson(person: Pick<Person, 'organizationId' | 'emails'>): string[] {
  const keys = new Set<string>();
  for (const email of person.emails || []) {
    const normalized = normalizeEmail(email.value);
    if (!normalized) continue;
    keys.add(orgEmailKey(person.organizationId, normalized));
  }
  return [...keys];
}

export function orgExternalKeysForPerson(
  person: Pick<Person, 'organizationId' | 'externalIds'>,
): string[] {
  const keys = new Set<string>();
  for (const ext of person.externalIds || []) {
    if (!ext?.system || !ext?.value) continue;
    keys.add(orgExternalKey(person.organizationId, ext.system, ext.value));
  }
  return [...keys];
}

export function primaryEmailOf(person: Pick<Person, 'emails'>): string {
  const primary = person.emails?.find((e) => e.kind === 'primary');
  return normalizeEmail(primary?.value || person.emails?.[0]?.value || '');
}
