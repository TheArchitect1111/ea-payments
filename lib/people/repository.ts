/**
 * PeopleRepository — the single persistence boundary for the People domain.
 *
 * Domain services (acl, merge, ensure, import/export) talk to this interface only;
 * `MemoryPeopleRepository` backs tests/cert memory; `PostgresPeopleRepository` is the
 * Phase 2C durable SoR. Airtable People SoR is quarantined (INV-33).
 */
import type {
  PeopleImportJob,
  PeopleImportJobSource,
  PeopleImportJobStatus,
  PeopleImportRowResult,
  PeopleMergeJob,
  PeopleMergeJobStatus,
  PeopleMergeStepName,
  PeopleMigrationCheckpoint,
} from '@/lib/people/job-types';
import type {
  AclResourceType,
  Household,
  HouseholdMember,
  PeopleAuditAction,
  PeopleAuditEvent,
  Person,
  PersonAclGrant,
  PersonConsent,
  PersonDirectoryMembership,
  PersonExternalId,
  PersonId,
  PersonProgramLink,
  PersonRelationship,
} from '@/lib/people/types';

export type PersonCreateInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

export type PersonUpdatePatch = Partial<Omit<Person, 'id' | 'organizationId' | 'createdAt'>>;

/** INV-23 — optimistic concurrency: mismatch throws `conflict`. */
export type PersonUpdateOptions = { expectedUpdatedAt?: string };

export type PersonUpsertResult = { person: Person; created: boolean };

export type PeopleAuditInput = {
  organizationId: string;
  actorEmail: string;
  actorPersonId?: PersonId;
  action: PeopleAuditAction;
  subjectPersonId?: PersonId;
  meta?: Record<string, string | number | boolean | null>;
};

export type MergeJobCreateInput = {
  organizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type MergeJobPatch = {
  status?: PeopleMergeJobStatus;
  completedStep?: PeopleMergeStepName;
  attempts?: number;
  lastError?: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type ImportJobCreateInput = {
  organizationId: string;
  idempotencyKey: string;
  source: PeopleImportJobSource;
  actorEmail: string;
  rowCount: number;
  dryRun?: boolean;
  meta?: Record<string, string | number | boolean | null>;
};

export type ImportJobPatch = {
  status?: PeopleImportJobStatus;
  okCount?: number;
  failedCount?: number;
  rowCount?: number;
  lastError?: string;
  meta?: Record<string, string | number | boolean | null>;
};

export type ImportRowResultInput = {
  organizationId: string;
  importJobId: string;
  rowNumber: number;
  status: PeopleImportRowResult['status'];
  personId?: PersonId;
  error?: string;
};

export type MigrationCheckpointInput = {
  organizationId: string;
  jobId: string;
  lastClientRecordId?: string;
  processed: number;
  created: number;
  linked: number;
  status: PeopleMigrationCheckpoint['status'];
};

export interface PeopleRepository {
  readonly kind: 'memory' | 'postgres' | 'airtable';

  // --- Person ---------------------------------------------------------------
  createPerson(input: PersonCreateInput): Promise<Person>;
  updatePerson(
    personId: PersonId,
    patch: PersonUpdatePatch,
    options?: PersonUpdateOptions,
  ): Promise<Person>;
  getPerson(personId: PersonId): Promise<Person | null>;
  listPersonsByOrg(organizationId: string): Promise<Person[]>;
  findPersonByEmail(organizationId: string, email: string): Promise<Person | null>;
  findPersonByExternalId(
    organizationId: string,
    system: PersonExternalId['system'],
    value: string,
  ): Promise<Person | null>;
  /**
   * Uniqueness-safe create: serialized per identity key, returns the existing
   * Person when a concurrent writer won the race (ADV-P-1 / ADV-P-1b).
   */
  upsertPersonByIdentity(
    input: PersonCreateInput,
    identity: { emailKey?: string; externalKey?: string },
  ): Promise<PersonUpsertResult>;

  // --- Directory ------------------------------------------------------------
  upsertDirectoryMembership(
    input: Omit<PersonDirectoryMembership, 'id'> & { id?: string },
  ): Promise<PersonDirectoryMembership>;
  getDirectoryMembership(
    organizationId: string,
    personId: PersonId,
  ): Promise<PersonDirectoryMembership | null>;
  listDirectoryMembershipsForPerson(personId: PersonId): Promise<PersonDirectoryMembership[]>;

  // --- Households -----------------------------------------------------------
  createHousehold(input: Omit<Household, 'id'> & { id?: string }): Promise<Household>;
  upsertHouseholdMember(
    input: Omit<HouseholdMember, 'id'> & { id?: string },
  ): Promise<HouseholdMember>;
  listHouseholdMembers(householdId: string): Promise<HouseholdMember[]>;
  listHouseholdMembersForPerson(personId: PersonId): Promise<HouseholdMember[]>;

  // --- Graph ----------------------------------------------------------------
  upsertRelationship(
    input: Omit<PersonRelationship, 'id'> & { id?: string },
  ): Promise<PersonRelationship>;
  listRelationshipsForOrg(organizationId: string): Promise<PersonRelationship[]>;
  upsertProgramLink(
    input: Omit<PersonProgramLink, 'id'> & { id?: string },
  ): Promise<PersonProgramLink>;
  listProgramLinks(personId: PersonId): Promise<PersonProgramLink[]>;
  upsertConsent(input: Omit<PersonConsent, 'id'> & { id?: string }): Promise<PersonConsent>;
  listConsents(personId: PersonId): Promise<PersonConsent[]>;
  upsertAclGrant(input: Omit<PersonAclGrant, 'id'> & { id?: string }): Promise<PersonAclGrant>;
  listAclGrantsForResource(
    organizationId: string,
    resourceType: AclResourceType,
    resourceId: string,
  ): Promise<PersonAclGrant[]>;

  // --- Audit (append-only, INV-15/24) --------------------------------------
  appendAudit(input: PeopleAuditInput): Promise<PeopleAuditEvent>;
  listAudit(organizationId: string): Promise<PeopleAuditEvent[]>;

  // --- Jobs ----------------------------------------------------------------
  createMergeJob(input: MergeJobCreateInput): Promise<PeopleMergeJob>;
  getMergeJob(jobId: string): Promise<PeopleMergeJob | null>;
  findMergeJobByAbsorbed(
    organizationId: string,
    absorbedPersonId: PersonId,
  ): Promise<PeopleMergeJob | null>;
  updateMergeJob(jobId: string, patch: MergeJobPatch): Promise<PeopleMergeJob>;

  createImportJob(input: ImportJobCreateInput): Promise<PeopleImportJob>;
  getImportJob(jobId: string): Promise<PeopleImportJob | null>;
  findImportJobByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PeopleImportJob | null>;
  updateImportJob(jobId: string, patch: ImportJobPatch): Promise<PeopleImportJob>;
  recordImportRowResult(input: ImportRowResultInput): Promise<PeopleImportRowResult>;
  listImportRowResults(importJobId: string): Promise<PeopleImportRowResult[]>;

  saveMigrationCheckpoint(input: MigrationCheckpointInput): Promise<PeopleMigrationCheckpoint>;
  getMigrationCheckpoint(
    organizationId: string,
    jobId: string,
  ): Promise<PeopleMigrationCheckpoint | null>;
}
