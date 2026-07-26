/**
 * MemoryPeopleRepository — tests, local development, and `PEOPLE_CERT_MEMORY=1` only.
 *
 * Never selected when `UNIVERSAL_PEOPLE_PERSIST=1` in production/preview (INV-19/20).
 * The identity lock queue makes concurrent creates converge on one Person so the
 * ADV-P suite exercises the same contract the Airtable adapter must satisfy.
 */
import { peopleValidation } from '@/lib/people/errors';
import { orgEmailKey, orgExternalKey } from '@/lib/people/keys';
import type {
  ImportJobCreateInput,
  ImportJobPatch,
  ImportRowResultInput,
  MergeJobCreateInput,
  MergeJobPatch,
  MigrationCheckpointInput,
  PeopleAuditInput,
  PeopleRepository,
  PersonCreateInput,
  PersonUpdateOptions,
  PersonUpdatePatch,
  PersonUpsertResult,
} from '@/lib/people/repository';
import {
  addHouseholdMember,
  appendPeopleAudit,
  createHousehold,
  createImportJobRecord,
  createMergeJobRecord,
  createPerson,
  findImportJobByIdempotencyKeyRecord,
  findMergeJobByAbsorbedRecord,
  findPersonByExternalId,
  findPersonByOrgEmailKey,
  findPersonByOrgExternalKey,
  findPersonByPrimaryEmail,
  getDirectoryMembership,
  getImportJobRecord,
  getMergeJobRecord,
  getMigrationCheckpointRecord,
  getPersonById,
  listAclGrantsForResource,
  listConsents,
  listDirectoryMembershipsForPerson,
  listHouseholdMembers,
  listHouseholdMembersForPerson,
  listImportRowResultsRecord,
  listPeopleAudit,
  listPersonsByOrg,
  listProgramLinks,
  listRelationshipsForOrg,
  recordImportRowResultRecord,
  saveMigrationCheckpointRecord,
  updateImportJobRecord,
  updateMergeJobRecord,
  updatePerson,
  upsertAclGrant,
  upsertConsent,
  upsertDirectoryMembership,
  upsertHouseholdMember,
  upsertProgramLink,
  upsertRelationship,
  withPeopleIdentityLocks,
} from '@/lib/people/store';
import type { PersonExternalId, PersonId } from '@/lib/people/types';

class MemoryPeopleRepository implements PeopleRepository {
  readonly kind = 'memory' as const;

  async createPerson(input: PersonCreateInput) {
    return createPerson(input);
  }

  async updatePerson(
    personId: PersonId,
    patch: PersonUpdatePatch,
    options?: PersonUpdateOptions,
  ) {
    return updatePerson(personId, patch, options);
  }

  async getPerson(personId: PersonId) {
    return getPersonById(personId);
  }

  async listPersonsByOrg(organizationId: string) {
    return listPersonsByOrg(organizationId);
  }

  async findPersonByEmail(organizationId: string, email: string) {
    return findPersonByPrimaryEmail(organizationId, email);
  }

  async findPersonByExternalId(
    organizationId: string,
    system: PersonExternalId['system'],
    value: string,
  ) {
    return findPersonByExternalId(organizationId, system, value);
  }

  /** ADV-P-1 — serialized per identity key; the loser of the race reads the winner. */
  async upsertPersonByIdentity(
    input: PersonCreateInput,
    identity: { emailKey?: string; externalKey?: string },
  ): Promise<PersonUpsertResult> {
    const emailKey =
      identity.emailKey ||
      (input.emails?.[0]?.value
        ? orgEmailKey(input.organizationId, input.emails[0].value)
        : undefined);
    const externalKey =
      identity.externalKey ||
      (input.externalIds?.[0]
        ? orgExternalKey(
            input.organizationId,
            input.externalIds[0].system,
            input.externalIds[0].value,
          )
        : undefined);

    if (!emailKey && !externalKey) {
      throw peopleValidation('identity key required for upsert');
    }

    return withPeopleIdentityLocks([externalKey, emailKey], () => {
      const existing =
        (externalKey ? findPersonByOrgExternalKey(externalKey) : null) ||
        (emailKey ? findPersonByOrgEmailKey(emailKey) : null);
      if (existing) return { person: existing, created: false };
      return { person: createPerson(input), created: true };
    });
  }

  async upsertDirectoryMembership(input: Parameters<typeof upsertDirectoryMembership>[0]) {
    return upsertDirectoryMembership(input);
  }

  async getDirectoryMembership(organizationId: string, personId: PersonId) {
    return getDirectoryMembership(organizationId, personId);
  }

  async listDirectoryMembershipsForPerson(personId: PersonId) {
    return listDirectoryMembershipsForPerson(personId);
  }

  async createHousehold(input: Parameters<typeof createHousehold>[0]) {
    return createHousehold(input);
  }

  async upsertHouseholdMember(input: Parameters<typeof addHouseholdMember>[0]) {
    return upsertHouseholdMember(input);
  }

  async listHouseholdMembers(householdId: string) {
    return listHouseholdMembers(householdId);
  }

  async listHouseholdMembersForPerson(personId: PersonId) {
    return listHouseholdMembersForPerson(personId);
  }

  async upsertRelationship(input: Parameters<typeof upsertRelationship>[0]) {
    return upsertRelationship(input);
  }

  async listRelationshipsForOrg(organizationId: string) {
    return listRelationshipsForOrg(organizationId);
  }

  async upsertProgramLink(input: Parameters<typeof upsertProgramLink>[0]) {
    return upsertProgramLink(input);
  }

  async listProgramLinks(personId: PersonId) {
    return listProgramLinks(personId);
  }

  async upsertConsent(input: Parameters<typeof upsertConsent>[0]) {
    return upsertConsent(input);
  }

  async listConsents(personId: PersonId) {
    return listConsents(personId);
  }

  async upsertAclGrant(input: Parameters<typeof upsertAclGrant>[0]) {
    return upsertAclGrant(input);
  }

  async listAclGrantsForResource(
    organizationId: string,
    resourceType: Parameters<typeof listAclGrantsForResource>[1],
    resourceId: string,
  ) {
    return listAclGrantsForResource(organizationId, resourceType, resourceId);
  }

  async appendAudit(input: PeopleAuditInput) {
    return appendPeopleAudit(input);
  }

  async listAudit(organizationId: string) {
    return listPeopleAudit(organizationId);
  }

  async createMergeJob(input: MergeJobCreateInput) {
    return createMergeJobRecord(input);
  }

  async getMergeJob(jobId: string) {
    return getMergeJobRecord(jobId);
  }

  async findMergeJobByAbsorbed(organizationId: string, absorbedPersonId: PersonId) {
    return findMergeJobByAbsorbedRecord(organizationId, absorbedPersonId);
  }

  async updateMergeJob(jobId: string, patch: MergeJobPatch) {
    return updateMergeJobRecord(jobId, patch);
  }

  async createImportJob(input: ImportJobCreateInput) {
    if (!input.idempotencyKey?.trim()) {
      throw peopleValidation('idempotencyKey required for import job');
    }
    return createImportJobRecord(input);
  }

  async getImportJob(jobId: string) {
    return getImportJobRecord(jobId);
  }

  async findImportJobByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    return findImportJobByIdempotencyKeyRecord(organizationId, idempotencyKey);
  }

  async updateImportJob(jobId: string, patch: ImportJobPatch) {
    return updateImportJobRecord(jobId, patch);
  }

  async recordImportRowResult(input: ImportRowResultInput) {
    return recordImportRowResultRecord(input);
  }

  async listImportRowResults(importJobId: string) {
    return listImportRowResultsRecord(importJobId);
  }

  async saveMigrationCheckpoint(input: MigrationCheckpointInput) {
    return saveMigrationCheckpointRecord(input);
  }

  async getMigrationCheckpoint(organizationId: string, jobId: string) {
    return getMigrationCheckpointRecord(organizationId, jobId);
  }
}

let instance: MemoryPeopleRepository | null = null;

export function memoryPeopleRepository(): PeopleRepository {
  if (!instance) instance = new MemoryPeopleRepository();
  return instance;
}
