/**
 * In-memory People store.
 *
 * Phase 2A semantics are preserved exactly: every sync export still behaves the
 * same for ADV-1…ADV-22. Phase 2B adds the compensating controls that the
 * Airtable adapter also relies on:
 *
 * - identity indexes for `OrgEmailKey` / `OrgExternalKey` uniqueness (§6.1)
 * - a per-identity async lock queue so concurrent creates collapse to one Person (ADV-P-1)
 * - optimistic concurrency on `updatePerson` (INV-23)
 * - durable-shaped job records (merge / import / row results / migration checkpoints)
 * - an optional `globalThis` store (`PEOPLE_SHARED_MEMORY=1`) to simulate instances
 *
 * Data is retained across flag OFF (INV-18). No automatic purge.
 * Append-only audit: no update/delete APIs (INV-15).
 */
import { randomUUID } from 'node:crypto';
import { peopleConflict, peopleValidation } from '@/lib/people/errors';
import { isPeopleSharedMemoryEnabled } from '@/lib/people/flags';
import type {
  PeopleImportJob,
  PeopleImportRowResult,
  PeopleMergeJob,
  PeopleMergeStepName,
  PeopleMigrationCheckpoint,
} from '@/lib/people/job-types';
import {
  consentKey,
  directoryMembershipKey,
  edgeKey,
  grantKey,
  householdMemberKey,
  importRowKey,
  mergeJobKey,
  migrationCheckpointKey,
  orgEmailKey,
  orgEmailKeysForPerson,
  orgExternalKey,
  orgExternalKeysForPerson,
  personParticipatesInEmailUniqueness,
  personParticipatesInExternalUniqueness,
  programLinkKey,
} from '@/lib/people/keys';
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
  /** OrgEmailKey → PersonId (eligible persons only). */
  emailIndex: Map<string, PersonId>;
  /** OrgExternalKey → PersonId (non-merged persons only). */
  externalIndex: Map<string, PersonId>;
  personEmailKeys: Map<PersonId, string[]>;
  personExternalKeys: Map<PersonId, string[]>;
  mergeJobs: Map<string, PeopleMergeJob>;
  importJobs: Map<string, PeopleImportJob>;
  importRowResults: Map<string, PeopleImportRowResult>;
  migrationCheckpoints: Map<string, PeopleMigrationCheckpoint>;
  /** Identity-key serialization queues (compensating control for missing UNIQUE). */
  locks: Map<string, Promise<unknown>>;
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
    emailIndex: new Map(),
    externalIndex: new Map(),
    personEmailKeys: new Map(),
    personExternalKeys: new Map(),
    mergeJobs: new Map(),
    importJobs: new Map(),
    importRowResults: new Map(),
    migrationCheckpoints: new Map(),
    locks: new Map(),
  };
}

const SHARED_KEY = '__eaPeopleMemoryStore__';

type SharedGlobal = typeof globalThis & { [SHARED_KEY]?: StoreShape };

let localStore: StoreShape = emptyStore();

/**
 * PEOPLE_SHARED_MEMORY=1 pins the store to `globalThis` so multiple module
 * instances (or simulated workers) observe the same rows. Never a production SoR.
 */
function store(): StoreShape {
  if (!isPeopleSharedMemoryEnabled()) return localStore;
  const g = globalThis as SharedGlobal;
  if (!g[SHARED_KEY]) g[SHARED_KEY] = emptyStore();
  return g[SHARED_KEY];
}

/** Test-only reset — does not run in production paths. */
export function resetPeopleStoreForTests(): void {
  localStore = emptyStore();
  const g = globalThis as SharedGlobal;
  if (g[SHARED_KEY]) g[SHARED_KEY] = emptyStore();
}

export function newPeopleId(prefix = 'ppl'): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

/**
 * Serializes work per identity key so two concurrent creates for the same
 * email / external id cannot both pass their uniqueness check (ADV-P-1).
 * The Airtable adapter uses the same wrapper around upsert-by-field.
 */
export function withPeopleIdentityLock<T>(key: string, fn: () => Promise<T> | T): Promise<T> {
  const locks = store().locks;
  const previous = locks.get(key) ?? Promise.resolve();
  const run = previous.then(
    () => fn(),
    () => fn(),
  );
  const chained = run.then(
    () => undefined,
    () => undefined,
  );
  locks.set(key, chained);
  void chained.then(() => {
    if (locks.get(key) === chained) locks.delete(key);
  });
  return run;
}

/** Runs `fn` serialized behind every supplied identity key (ordered for determinism). */
export function withPeopleIdentityLocks<T>(
  keys: Array<string | undefined>,
  fn: () => Promise<T> | T,
): Promise<T> {
  const unique = [...new Set(keys.filter((k): k is string => Boolean(k)))].sort();
  if (unique.length === 0) return Promise.resolve().then(fn);
  return unique.reduce<() => Promise<T>>(
    (next, key) => () => withPeopleIdentityLock(key, next),
    () => Promise.resolve().then(fn),
  )();
}

/** Monotonic timestamps keep OCC comparisons meaningful inside a single millisecond. */
function nextTimestamp(previous?: string): string {
  const now = Date.now();
  const prev = previous ? new Date(previous).getTime() : 0;
  const next = Number.isFinite(prev) && prev >= now ? prev + 1 : now;
  return new Date(next).toISOString();
}

function releaseIndexes(personId: PersonId): void {
  const s = store();
  for (const key of s.personEmailKeys.get(personId) || []) {
    if (s.emailIndex.get(key) === personId) s.emailIndex.delete(key);
  }
  for (const key of s.personExternalKeys.get(personId) || []) {
    if (s.externalIndex.get(key) === personId) s.externalIndex.delete(key);
  }
  s.personEmailKeys.delete(personId);
  s.personExternalKeys.delete(personId);
}

function reindexPerson(person: Person): void {
  const s = store();
  const emailKeys = personParticipatesInEmailUniqueness(person)
    ? orgEmailKeysForPerson(person)
    : [];
  const externalKeys = personParticipatesInExternalUniqueness(person)
    ? orgExternalKeysForPerson(person)
    : [];

  for (const key of emailKeys) {
    const owner = s.emailIndex.get(key);
    if (owner && owner !== person.id) {
      throw new Error(
        `Duplicate email ${key.slice(key.indexOf('#') + 1)} in org ${person.organizationId}`,
      );
    }
  }
  for (const key of externalKeys) {
    const owner = s.externalIndex.get(key);
    if (owner && owner !== person.id) {
      const [, system, value] = key.split('#');
      throw new Error(
        `Duplicate external id ${system}:${value} in org ${person.organizationId}`,
      );
    }
  }

  releaseIndexes(person.id);
  s.personEmailKeys.set(person.id, emailKeys);
  s.personExternalKeys.set(person.id, externalKeys);
  for (const key of emailKeys) s.emailIndex.set(key, person.id);
  for (const key of externalKeys) s.externalIndex.set(key, person.id);
}

export function createPerson(
  input: Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): Person {
  if (!input.organizationId?.trim() || input.organizationId.startsWith('org_')) {
    if (process.env.NODE_ENV === 'production' && input.organizationId?.startsWith('org_')) {
      throw new Error('Synthetic org_* not allowed for People writes in production');
    }
  }
  if (!input.organizationId?.trim()) {
    throw new Error('organizationId required');
  }
  for (const email of input.emails || []) {
    if (!normalizeEmail(email?.value || '')) {
      throw peopleValidation('email value required');
    }
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
  reindexPerson(person);
  store().persons.set(person.id, person);
  return { ...person };
}

/**
 * INV-2: organizationId cannot change.
 * INV-23: when `expectedUpdatedAt` is supplied a mismatch throws `conflict` (409).
 */
export function updatePerson(
  personId: PersonId,
  patch: Partial<Omit<Person, 'id' | 'organizationId' | 'createdAt'>>,
  options: { expectedUpdatedAt?: string } = {},
): Person {
  const s = store();
  const existing = s.persons.get(personId);
  if (!existing) throw new Error('Person not found');
  if (patch && 'organizationId' in (patch as object)) {
    throw new Error('organizationId is immutable');
  }
  if (options.expectedUpdatedAt && options.expectedUpdatedAt !== existing.updatedAt) {
    throw peopleConflict('Person changed since read', { personId });
  }
  const next: Person = {
    ...existing,
    ...patch,
    id: existing.id,
    organizationId: existing.organizationId,
    emails: patch.emails
      ? patch.emails.map((e) => ({ ...e, value: normalizeEmail(e.value) }))
      : existing.emails,
    updatedAt: nextTimestamp(existing.updatedAt),
  };
  reindexPerson(next);
  s.persons.set(personId, next);
  return { ...next };
}

export function getPersonById(personId: PersonId): Person | null {
  const p = store().persons.get(personId);
  return p ? { ...p } : null;
}

export function listPersonsByOrg(organizationId: string): Person[] {
  return [...store().persons.values()]
    .filter((p) => p.organizationId === organizationId)
    .map((p) => ({ ...p }));
}

export function findPersonByExternalId(
  organizationId: string,
  system: import('@/lib/people/types').PersonExternalId['system'],
  value: string,
): Person | null {
  if (!organizationId?.trim() || !value?.trim()) return null;
  const id = store().externalIndex.get(orgExternalKey(organizationId, system, value));
  if (!id) return null;
  const person = store().persons.get(id);
  return person ? { ...person } : null;
}

export function findPersonByPrimaryEmail(organizationId: string, email: string): Person | null {
  const target = normalizeEmail(email);
  if (!organizationId?.trim() || !target) return null;
  const id = store().emailIndex.get(orgEmailKey(organizationId, target));
  if (!id) return null;
  const person = store().persons.get(id);
  return person ? { ...person } : null;
}

export function findPersonByOrgEmailKey(key: string): Person | null {
  const id = store().emailIndex.get(key);
  if (!id) return null;
  const person = store().persons.get(id);
  return person ? { ...person } : null;
}

export function findPersonByOrgExternalKey(key: string): Person | null {
  const id = store().externalIndex.get(key);
  if (!id) return null;
  const person = store().persons.get(id);
  return person ? { ...person } : null;
}

export function upsertDirectoryMembership(
  input: Omit<PersonDirectoryMembership, 'id'> & { id?: string },
): PersonDirectoryMembership {
  const s = store();
  const key = directoryMembershipKey(input.organizationId, input.personId);
  const existing = [...s.directoryMemberships.values()].find(
    (m) => directoryMembershipKey(m.organizationId, m.personId) === key,
  );
  const row: PersonDirectoryMembership = {
    ...input,
    id: existing?.id || input.id || newPeopleId('pdm'),
  };
  s.directoryMemberships.set(row.id, row);
  return { ...row };
}

export function listDirectoryMembershipsForPerson(personId: PersonId): PersonDirectoryMembership[] {
  return [...store().directoryMemberships.values()]
    .filter((m) => m.personId === personId)
    .map((m) => ({ ...m }));
}

export function getDirectoryMembership(
  organizationId: string,
  personId: PersonId,
): PersonDirectoryMembership | null {
  const m = [...store().directoryMemberships.values()].find(
    (x) => x.organizationId === organizationId && x.personId === personId,
  );
  return m ? { ...m } : null;
}

export function createHousehold(input: Omit<Household, 'id'> & { id?: string }): Household {
  const row: Household = { ...input, id: input.id || newPeopleId('hh') };
  store().households.set(row.id, row);
  return { ...row };
}

export function getHousehold(householdId: string): Household | null {
  const row = store().households.get(householdId);
  return row ? { ...row } : null;
}

export function addHouseholdMember(
  input: Omit<HouseholdMember, 'id'> & { id?: string },
): HouseholdMember {
  const row: HouseholdMember = { ...input, id: input.id || newPeopleId('hhm') };
  store().householdMembers.set(row.id, row);
  return { ...row };
}

/** Unique `(Household Id, Person Key)` — concurrent edits converge (§10.6). */
export function upsertHouseholdMember(
  input: Omit<HouseholdMember, 'id'> & { id?: string },
): HouseholdMember {
  const s = store();
  const key = householdMemberKey(input.householdId, input.personId);
  const existing = [...s.householdMembers.values()].find(
    (m) => householdMemberKey(m.householdId, m.personId) === key,
  );
  const row: HouseholdMember = { ...input, id: existing?.id || input.id || newPeopleId('hhm') };
  s.householdMembers.set(row.id, row);
  return { ...row };
}

export function listHouseholdMembers(householdId: string): HouseholdMember[] {
  return [...store().householdMembers.values()]
    .filter((m) => m.householdId === householdId)
    .map((m) => ({ ...m }));
}

export function listHouseholdMembersForPerson(personId: PersonId): HouseholdMember[] {
  return [...store().householdMembers.values()]
    .filter((m) => m.personId === personId)
    .map((m) => ({ ...m }));
}

export function createRelationship(
  input: Omit<PersonRelationship, 'id'> & { id?: string },
): PersonRelationship {
  const row: PersonRelationship = { ...input, id: input.id || newPeopleId('rel') };
  store().relationships.set(row.id, row);
  return { ...row };
}

/** Edge-key upsert — prevents duplicate active edges under merge retries (ADV-P-2/4). */
export function upsertRelationship(
  input: Omit<PersonRelationship, 'id'> & { id?: string },
): PersonRelationship {
  const s = store();
  const key = edgeKey(input.organizationId, input.fromPersonId, input.toPersonId, input.type);
  const existing = [...s.relationships.values()].find(
    (r) => edgeKey(r.organizationId, r.fromPersonId, r.toPersonId, r.type) === key,
  );
  const row: PersonRelationship = { ...input, id: existing?.id || input.id || newPeopleId('rel') };
  s.relationships.set(row.id, row);
  return { ...row };
}

export function updateRelationship(
  relationshipId: string,
  patch: Partial<Omit<PersonRelationship, 'id' | 'organizationId'>>,
): PersonRelationship {
  const s = store();
  const existing = s.relationships.get(relationshipId);
  if (!existing) throw peopleValidation('Relationship not found');
  const next: PersonRelationship = { ...existing, ...patch, id: existing.id };
  s.relationships.set(relationshipId, next);
  return { ...next };
}

export function listRelationshipsForOrg(organizationId: string): PersonRelationship[] {
  return [...store().relationships.values()]
    .filter((r) => r.organizationId === organizationId)
    .map((r) => ({ ...r }));
}

export function createProgramLink(
  input: Omit<PersonProgramLink, 'id'> & { id?: string },
): PersonProgramLink {
  const s = store();
  const key = programLinkKey(
    input.organizationId,
    input.personId,
    input.kind,
    input.externalRef,
  );
  const existing = [...s.programLinks.values()].find(
    (l) => programLinkKey(l.organizationId, l.personId, l.kind, l.externalRef) === key,
  );
  if (existing) return { ...existing };
  const row: PersonProgramLink = { ...input, id: input.id || newPeopleId('pplnk') };
  s.programLinks.set(row.id, row);
  return { ...row };
}

export function upsertProgramLink(
  input: Omit<PersonProgramLink, 'id'> & { id?: string },
): PersonProgramLink {
  const s = store();
  const key = programLinkKey(input.organizationId, input.personId, input.kind, input.externalRef);
  const existing = [...s.programLinks.values()].find(
    (l) => programLinkKey(l.organizationId, l.personId, l.kind, l.externalRef) === key,
  );
  const row: PersonProgramLink = { ...input, id: existing?.id || input.id || newPeopleId('pplnk') };
  s.programLinks.set(row.id, row);
  return { ...row };
}

export function listProgramLinks(personId: PersonId): PersonProgramLink[] {
  return [...store().programLinks.values()]
    .filter((l) => l.personId === personId)
    .map((l) => ({ ...l }));
}

export function createConsent(input: Omit<PersonConsent, 'id'> & { id?: string }): PersonConsent {
  const row: PersonConsent = { ...input, id: input.id || newPeopleId('cns') };
  store().consents.set(row.id, row);
  return { ...row };
}

export function upsertConsent(input: Omit<PersonConsent, 'id'> & { id?: string }): PersonConsent {
  const s = store();
  const key = consentKey(input.organizationId, input.personId, input.purpose);
  const existing = [...s.consents.values()].find(
    (c) => consentKey(c.organizationId, c.personId, c.purpose) === key,
  );
  const row: PersonConsent = { ...input, id: existing?.id || input.id || newPeopleId('cns') };
  s.consents.set(row.id, row);
  return { ...row };
}

export function listConsents(personId: PersonId): PersonConsent[] {
  return [...store().consents.values()]
    .filter((c) => c.personId === personId)
    .map((c) => ({ ...c }));
}

export function createAclGrant(input: Omit<PersonAclGrant, 'id'> & { id?: string }): PersonAclGrant {
  const row: PersonAclGrant = { ...input, id: input.id || newPeopleId('acl') };
  store().aclGrants.set(row.id, row);
  return { ...row };
}

export function upsertAclGrant(
  input: Omit<PersonAclGrant, 'id'> & { id?: string },
): PersonAclGrant {
  const s = store();
  const key = grantKey(
    input.organizationId,
    input.resourceType,
    input.resourceId,
    input.grantee,
    input.relation,
  );
  const existing = [...s.aclGrants.values()].find(
    (g) =>
      grantKey(g.organizationId, g.resourceType, g.resourceId, g.grantee, g.relation) === key,
  );
  const row: PersonAclGrant = { ...input, id: existing?.id || input.id || newPeopleId('acl') };
  s.aclGrants.set(row.id, row);
  return { ...row };
}

export function listAclGrantsForResource(
  organizationId: string,
  resourceType: PersonAclGrant['resourceType'],
  resourceId: string,
): PersonAclGrant[] {
  return [...store().aclGrants.values()]
    .filter(
      (g) =>
        g.organizationId === organizationId &&
        g.resourceType === resourceType &&
        g.resourceId === resourceId,
    )
    .map((g) => ({ ...g }));
}

export function listAclGrantsForOrg(organizationId: string): PersonAclGrant[] {
  return [...store().aclGrants.values()]
    .filter((g) => g.organizationId === organizationId)
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
  store().audit.push(event);
  return { ...event };
}

export function listPeopleAudit(organizationId: string): PeopleAuditEvent[] {
  return store()
    .audit.filter((a) => a.organizationId === organizationId)
    .map((a) => ({ ...a }));
}

/** INV-15 — explicit rejection of mutation APIs. */
export function updatePeopleAudit(): never {
  throw new Error('People audit is append-only; update is unsupported');
}

export function deletePeopleAudit(): never {
  throw new Error('People audit is append-only; delete is unsupported');
}

// --- Merge jobs -------------------------------------------------------------

export function createMergeJobRecord(input: {
  organizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
  meta?: Record<string, string | number | boolean | null>;
}): PeopleMergeJob {
  const s = store();
  const key = mergeJobKey(input.organizationId, input.absorbedPersonId);
  const existing = [...s.mergeJobs.values()].find((j) => j.jobKey === key);
  if (existing) return { ...existing, completedSteps: [...existing.completedSteps] };
  const now = new Date().toISOString();
  const job: PeopleMergeJob = {
    id: newPeopleId('mrgjob'),
    organizationId: input.organizationId,
    jobKey: key,
    survivorPersonId: input.survivorPersonId,
    absorbedPersonId: input.absorbedPersonId,
    status: 'queued',
    completedSteps: [],
    attempts: 0,
    actorEmail: input.actorEmail,
    meta: input.meta,
    createdAt: now,
    updatedAt: now,
  };
  s.mergeJobs.set(job.id, job);
  return { ...job, completedSteps: [] };
}

export function getMergeJobRecord(jobId: string): PeopleMergeJob | null {
  const job = store().mergeJobs.get(jobId);
  return job ? { ...job, completedSteps: [...job.completedSteps] } : null;
}

export function findMergeJobByAbsorbedRecord(
  organizationId: string,
  absorbedPersonId: PersonId,
): PeopleMergeJob | null {
  const key = mergeJobKey(organizationId, absorbedPersonId);
  const job = [...store().mergeJobs.values()].find((j) => j.jobKey === key);
  return job ? { ...job, completedSteps: [...job.completedSteps] } : null;
}

export function updateMergeJobRecord(
  jobId: string,
  patch: {
    status?: PeopleMergeJob['status'];
    completedStep?: PeopleMergeStepName;
    attempts?: number;
    lastError?: string;
    meta?: Record<string, string | number | boolean | null>;
  },
): PeopleMergeJob {
  const s = store();
  const existing = s.mergeJobs.get(jobId);
  if (!existing) throw peopleValidation('Merge job not found');
  const completedSteps = patch.completedStep
    ? [...new Set([...existing.completedSteps, patch.completedStep])]
    : existing.completedSteps;
  const next: PeopleMergeJob = {
    ...existing,
    status: patch.status ?? existing.status,
    completedSteps,
    attempts: patch.attempts ?? existing.attempts,
    lastError: patch.lastError ?? existing.lastError,
    meta: patch.meta ? { ...existing.meta, ...patch.meta } : existing.meta,
    updatedAt: nextTimestamp(existing.updatedAt),
  };
  s.mergeJobs.set(jobId, next);
  return { ...next, completedSteps: [...next.completedSteps] };
}

export function listMergeJobsForOrg(organizationId: string): PeopleMergeJob[] {
  return [...store().mergeJobs.values()]
    .filter((j) => j.organizationId === organizationId)
    .map((j) => ({ ...j, completedSteps: [...j.completedSteps] }));
}

// --- Import jobs ------------------------------------------------------------

export function createImportJobRecord(input: {
  organizationId: string;
  idempotencyKey: string;
  source: PeopleImportJob['source'];
  actorEmail: string;
  rowCount: number;
  dryRun?: boolean;
  meta?: Record<string, string | number | boolean | null>;
}): PeopleImportJob {
  const s = store();
  const existing = [...s.importJobs.values()].find(
    (j) => j.organizationId === input.organizationId && j.idempotencyKey === input.idempotencyKey,
  );
  if (existing) return { ...existing };
  const now = new Date().toISOString();
  const job: PeopleImportJob = {
    id: newPeopleId('impjob'),
    organizationId: input.organizationId,
    idempotencyKey: input.idempotencyKey,
    source: input.source,
    status: 'queued',
    rowCount: input.rowCount,
    okCount: 0,
    failedCount: 0,
    actorEmail: input.actorEmail,
    dryRun: input.dryRun,
    meta: input.meta,
    createdAt: now,
    updatedAt: now,
  };
  s.importJobs.set(job.id, job);
  return { ...job };
}

export function getImportJobRecord(jobId: string): PeopleImportJob | null {
  const job = store().importJobs.get(jobId);
  return job ? { ...job } : null;
}

export function findImportJobByIdempotencyKeyRecord(
  organizationId: string,
  idempotencyKey: string,
): PeopleImportJob | null {
  const job = [...store().importJobs.values()].find(
    (j) => j.organizationId === organizationId && j.idempotencyKey === idempotencyKey,
  );
  return job ? { ...job } : null;
}

export function updateImportJobRecord(
  jobId: string,
  patch: {
    status?: PeopleImportJob['status'];
    okCount?: number;
    failedCount?: number;
    rowCount?: number;
    lastError?: string;
    meta?: Record<string, string | number | boolean | null>;
  },
): PeopleImportJob {
  const s = store();
  const existing = s.importJobs.get(jobId);
  if (!existing) throw peopleValidation('Import job not found');
  const next: PeopleImportJob = {
    ...existing,
    status: patch.status ?? existing.status,
    okCount: patch.okCount ?? existing.okCount,
    failedCount: patch.failedCount ?? existing.failedCount,
    rowCount: patch.rowCount ?? existing.rowCount,
    lastError: patch.lastError ?? existing.lastError,
    meta: patch.meta ? { ...existing.meta, ...patch.meta } : existing.meta,
    updatedAt: nextTimestamp(existing.updatedAt),
  };
  s.importJobs.set(jobId, next);
  return { ...next };
}

export function recordImportRowResultRecord(input: {
  organizationId: string;
  importJobId: string;
  rowNumber: number;
  status: PeopleImportRowResult['status'];
  personId?: PersonId;
  error?: string;
}): PeopleImportRowResult {
  const s = store();
  const rowKey = importRowKey(input.importJobId, input.rowNumber);
  const existing = [...s.importRowResults.values()].find((r) => r.rowKey === rowKey);
  const row: PeopleImportRowResult = {
    id: existing?.id || newPeopleId('improw'),
    organizationId: input.organizationId,
    importJobId: input.importJobId,
    rowNumber: input.rowNumber,
    rowKey,
    status: input.status,
    personId: input.personId ?? existing?.personId,
    error: input.error,
    createdAt: existing?.createdAt || new Date().toISOString(),
  };
  s.importRowResults.set(row.id, row);
  return { ...row };
}

export function listImportRowResultsRecord(importJobId: string): PeopleImportRowResult[] {
  return [...store().importRowResults.values()]
    .filter((r) => r.importJobId === importJobId)
    .sort((a, b) => a.rowNumber - b.rowNumber)
    .map((r) => ({ ...r }));
}

// --- Migration checkpoints --------------------------------------------------

export function saveMigrationCheckpointRecord(input: {
  organizationId: string;
  jobId: string;
  lastClientRecordId?: string;
  processed: number;
  created: number;
  linked: number;
  status: PeopleMigrationCheckpoint['status'];
}): PeopleMigrationCheckpoint {
  const s = store();
  const key = migrationCheckpointKey(input.organizationId, input.jobId);
  const existing = [...s.migrationCheckpoints.values()].find((c) => c.checkpointKey === key);
  const row: PeopleMigrationCheckpoint = {
    id: existing?.id || newPeopleId('mchk'),
    organizationId: input.organizationId,
    jobId: input.jobId,
    checkpointKey: key,
    lastClientRecordId: input.lastClientRecordId ?? existing?.lastClientRecordId,
    processed: input.processed,
    created: input.created,
    linked: input.linked,
    status: input.status,
    updatedAt: new Date().toISOString(),
  };
  s.migrationCheckpoints.set(row.id, row);
  return { ...row };
}

export function getMigrationCheckpointRecord(
  organizationId: string,
  jobId: string,
): PeopleMigrationCheckpoint | null {
  const key = migrationCheckpointKey(organizationId, jobId);
  const row = [...store().migrationCheckpoints.values()].find((c) => c.checkpointKey === key);
  return row ? { ...row } : null;
}

export function peopleStoreSnapshotCounts(): {
  persons: number;
  relationships: number;
  audit: number;
  mergeJobs: number;
  importJobs: number;
} {
  const s = store();
  return {
    persons: s.persons.size,
    relationships: s.relationships.size,
    audit: s.audit.length,
    mergeJobs: s.mergeJobs.size,
    importJobs: s.importJobs.size,
  };
}
