/**
 * In-memory People store (Phase 2A).
 * Data is retained across flag OFF (INV-18). No automatic purge.
 * Append-only audit: no update/delete APIs (INV-15).
 */
import { randomUUID } from 'node:crypto';
import type {
  Household,
  HouseholdMember,
  PeopleAuditAction,
  PeopleAuditEvent,
  Person,
  PersonAclGrant,
  PersonConsent,
  PersonDirectoryMembership,
  PersonId,
  PersonProgramLink,
  PersonRelationship,
} from '@/lib/people/types';
import { normalizeEmail } from '@/lib/people/types';

type StoreShape = {
  persons: Map<PersonId, Person>;
  directoryMemberships: Map<string, PersonDirectoryMembership>;
  households: Map<string, Household>;
  householdMembers: Map<string, HouseholdMember>;
  relationships: Map<string, PersonRelationship>;
  programLinks: Map<string, PersonProgramLink>;
  consents: Map<string, PersonConsent>;
  aclGrants: Map<string, PersonAclGrant>;
  audit: PeopleAuditEvent[];
};

function emptyStore(): StoreShape {
  return {
    persons: new Map(),
    directoryMemberships: new Map(),
    households: new Map(),
    householdMembers: new Map(),
    relationships: new Map(),
    programLinks: new Map(),
    consents: new Map(),
    aclGrants: new Map(),
    audit: [],
  };
}

let store: StoreShape = emptyStore();

/** Test-only reset — does not run in production paths. */
export function resetPeopleStoreForTests(): void {
  store = emptyStore();
}

export function newPeopleId(prefix = 'ppl'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function assertExternalUnique(person: Person, excludeId?: PersonId): void {
  for (const ext of person.externalIds || []) {
    for (const other of store.persons.values()) {
      if (excludeId && other.id === excludeId) continue;
      if (other.organizationId !== person.organizationId) continue;
      if (other.mergedIntoPersonId) continue;
      for (const oe of other.externalIds || []) {
        if (oe.system === ext.system && oe.value === ext.value) {
          throw new Error(
            `Duplicate external id ${ext.system}:${ext.value} in org ${person.organizationId}`,
          );
        }
      }
    }
  }
}

function assertEmailUnique(person: Person, excludeId?: PersonId): void {
  const emails = new Set(
    person.emails.map((e) => normalizeEmail(e.value)).filter(Boolean),
  );
  if (emails.size === 0) return;
  for (const other of store.persons.values()) {
    if (excludeId && other.id === excludeId) continue;
    if (other.organizationId !== person.organizationId) continue;
    if (other.mergedIntoPersonId) continue;
    if (other.lifecycleStatus === 'archived' || other.lifecycleStatus === 'deceased') continue;
    for (const e of other.emails) {
      if (emails.has(normalizeEmail(e.value))) {
        throw new Error(`Duplicate email ${e.value} in org ${person.organizationId}`);
      }
    }
  }
}

export function createPerson(input: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Person {
  if (!input.organizationId?.trim() || input.organizationId.startsWith('org_')) {
    if (process.env.NODE_ENV === 'production' && input.organizationId?.startsWith('org_')) {
      throw new Error('Synthetic org_* not allowed for People writes in production');
    }
  }
  if (!input.organizationId?.trim()) {
    throw new Error('organizationId required');
  }
  const now = new Date().toISOString();
  const person: Person = {
    ...input,
    id: input.id || newPeopleId('person'),
    organizationId: input.organizationId.trim(),
    emails: (input.emails || []).map((e) => ({ ...e, value: normalizeEmail(e.value) })),
    phones: input.phones || [],
    createdAt: now,
    updatedAt: now,
  };
  assertExternalUnique(person);
  assertEmailUnique(person);
  store.persons.set(person.id, person);
  return { ...person };
}

/** INV-2: organizationId cannot change. */
export function updatePerson(
  personId: PersonId,
  patch: Partial<Omit<Person, 'id' | 'organizationId' | 'createdAt'>>,
): Person {
  const existing = store.persons.get(personId);
  if (!existing) throw new Error('Person not found');
  if (patch && 'organizationId' in (patch as object)) {
    throw new Error('organizationId is immutable');
  }
  const next: Person = {
    ...existing,
    ...patch,
    id: existing.id,
    organizationId: existing.organizationId,
    emails: patch.emails
      ? patch.emails.map((e) => ({ ...e, value: normalizeEmail(e.value) }))
      : existing.emails,
    updatedAt: new Date().toISOString(),
  };
  assertExternalUnique(next, personId);
  assertEmailUnique(next, personId);
  store.persons.set(personId, next);
  return { ...next };
}

export function getPersonById(personId: PersonId): Person | null {
  const p = store.persons.get(personId);
  return p ? { ...p } : null;
}

export function listPersonsByOrg(organizationId: string): Person[] {
  return [...store.persons.values()]
    .filter((p) => p.organizationId === organizationId)
    .map((p) => ({ ...p }));
}

export function findPersonByExternalId(
  organizationId: string,
  system: import('@/lib/people/types').PersonExternalId['system'],
  value: string,
): Person | null {
  for (const p of store.persons.values()) {
    if (p.organizationId !== organizationId) continue;
    if (p.mergedIntoPersonId) continue;
    if (p.externalIds?.some((e) => e.system === system && e.value === value)) {
      return { ...p };
    }
  }
  return null;
}

export function findPersonByPrimaryEmail(organizationId: string, email: string): Person | null {
  const target = normalizeEmail(email);
  for (const p of store.persons.values()) {
    if (p.organizationId !== organizationId) continue;
    if (p.mergedIntoPersonId) continue;
    if (p.lifecycleStatus === 'archived' || p.lifecycleStatus === 'deceased') continue;
    if (p.emails.some((e) => e.kind === 'primary' && normalizeEmail(e.value) === target)) {
      return { ...p };
    }
    if (p.emails.some((e) => normalizeEmail(e.value) === target)) {
      return { ...p };
    }
  }
  return null;
}

export function upsertDirectoryMembership(
  input: Omit<PersonDirectoryMembership, 'id'> & { id?: string },
): PersonDirectoryMembership {
  const existing = [...store.directoryMemberships.values()].find(
    (m) => m.organizationId === input.organizationId && m.personId === input.personId,
  );
  const row: PersonDirectoryMembership = {
    ...input,
    id: existing?.id || input.id || newPeopleId('pdm'),
  };
  store.directoryMemberships.set(row.id, row);
  return { ...row };
}

export function listDirectoryMembershipsForPerson(personId: PersonId): PersonDirectoryMembership[] {
  return [...store.directoryMemberships.values()]
    .filter((m) => m.personId === personId)
    .map((m) => ({ ...m }));
}

export function getDirectoryMembership(
  organizationId: string,
  personId: PersonId,
): PersonDirectoryMembership | null {
  const m = [...store.directoryMemberships.values()].find(
    (x) => x.organizationId === organizationId && x.personId === personId,
  );
  return m ? { ...m } : null;
}

export function createHousehold(input: Omit<Household, 'id'> & { id?: string }): Household {
  const row: Household = { ...input, id: input.id || newPeopleId('hh') };
  store.households.set(row.id, row);
  return { ...row };
}

export function addHouseholdMember(
  input: Omit<HouseholdMember, 'id'> & { id?: string },
): HouseholdMember {
  const row: HouseholdMember = { ...input, id: input.id || newPeopleId('hhm') };
  store.householdMembers.set(row.id, row);
  return { ...row };
}

export function listHouseholdMembers(householdId: string): HouseholdMember[] {
  return [...store.householdMembers.values()]
    .filter((m) => m.householdId === householdId)
    .map((m) => ({ ...m }));
}

export function createRelationship(
  input: Omit<PersonRelationship, 'id'> & { id?: string },
): PersonRelationship {
  const row: PersonRelationship = { ...input, id: input.id || newPeopleId('rel') };
  store.relationships.set(row.id, row);
  return { ...row };
}

export function listRelationshipsForOrg(organizationId: string): PersonRelationship[] {
  return [...store.relationships.values()]
    .filter((r) => r.organizationId === organizationId)
    .map((r) => ({ ...r }));
}

export function createProgramLink(
  input: Omit<PersonProgramLink, 'id'> & { id?: string },
): PersonProgramLink {
  const existing = [...store.programLinks.values()].find(
    (l) =>
      l.organizationId === input.organizationId &&
      l.personId === input.personId &&
      l.kind === input.kind &&
      l.externalRef === input.externalRef,
  );
  if (existing) return { ...existing };
  const row: PersonProgramLink = { ...input, id: input.id || newPeopleId('pplnk') };
  store.programLinks.set(row.id, row);
  return { ...row };
}

export function listProgramLinks(personId: PersonId): PersonProgramLink[] {
  return [...store.programLinks.values()]
    .filter((l) => l.personId === personId)
    .map((l) => ({ ...l }));
}

export function createConsent(input: Omit<PersonConsent, 'id'> & { id?: string }): PersonConsent {
  const row: PersonConsent = { ...input, id: input.id || newPeopleId('cns') };
  store.consents.set(row.id, row);
  return { ...row };
}

export function listConsents(personId: PersonId): PersonConsent[] {
  return [...store.consents.values()]
    .filter((c) => c.personId === personId)
    .map((c) => ({ ...c }));
}

export function createAclGrant(input: Omit<PersonAclGrant, 'id'> & { id?: string }): PersonAclGrant {
  const row: PersonAclGrant = { ...input, id: input.id || newPeopleId('acl') };
  store.aclGrants.set(row.id, row);
  return { ...row };
}

export function listAclGrantsForResource(
  organizationId: string,
  resourceType: PersonAclGrant['resourceType'],
  resourceId: string,
): PersonAclGrant[] {
  return [...store.aclGrants.values()]
    .filter(
      (g) =>
        g.organizationId === organizationId &&
        g.resourceType === resourceType &&
        g.resourceId === resourceId,
    )
    .map((g) => ({ ...g }));
}

/** INV-15 — append only. */
export function appendPeopleAudit(input: {
  organizationId: string;
  actorEmail: string;
  actorPersonId?: PersonId;
  action: PeopleAuditAction;
  subjectPersonId?: PersonId;
  meta?: PeopleAuditEvent['meta'];
}): PeopleAuditEvent {
  const event: PeopleAuditEvent = {
    id: newPeopleId('aud'),
    organizationId: input.organizationId,
    actorEmail: input.actorEmail,
    actorPersonId: input.actorPersonId,
    action: input.action,
    subjectPersonId: input.subjectPersonId,
    at: new Date().toISOString(),
    meta: input.meta,
  };
  store.audit.push(event);
  return { ...event };
}

export function listPeopleAudit(organizationId: string): PeopleAuditEvent[] {
  return store.audit.filter((a) => a.organizationId === organizationId).map((a) => ({ ...a }));
}

/** INV-15 — explicit rejection of mutation APIs. */
export function updatePeopleAudit(): never {
  throw new Error('People audit is append-only; update is unsupported');
}

export function deletePeopleAudit(): never {
  throw new Error('People audit is append-only; delete is unsupported');
}

export function peopleStoreSnapshotCounts(): {
  persons: number;
  relationships: number;
  audit: number;
} {
  return {
    persons: store.persons.size,
    relationships: store.relationships.size,
    audit: store.audit.length,
  };
}
