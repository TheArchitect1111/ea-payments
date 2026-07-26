export {
  isUniversalPeopleEnabled,
  isUniversalPeoplePersistEnabled,
  isUniversalPeopleMigrateEnabled,
  isPeopleCertMemoryForced,
  isPeopleSharedMemoryEnabled,
  isPeopleProductionMode,
  isPeopleRuntimeAllowed,
  peopleRuntimeDenyReason,
  assertPeoplePersistReady,
  assertPeopleRuntimeLegal,
  peopleMajorityAge,
} from '@/lib/people/flags';
export { isPersonMinorAt, isExpired } from '@/lib/people/minor';
export {
  assertPeopleAccess,
  redactPersonForActor,
  personToExportRow,
} from '@/lib/people/acl';
export { loadPeopleAclContext, loadPeopleAclContextBatch } from '@/lib/people/acl-context';
export {
  ensurePersonForClientRecord,
  ensurePersonForClientRecordAsync,
  ensurePersonForClientRecordSafe,
} from '@/lib/people/ensure-person';
export {
  migrateClientRecordToPerson,
  migrateClientRecordToPersonIdempotent,
} from '@/lib/people/migrate-from-client';
export {
  runPeopleClientBackfill,
  airtableClientRecordLoader,
} from '@/lib/people/migrate-backfill';
export { mergePersons, mergePersonsAsync } from '@/lib/people/merge';
export { runPeopleMergeJob, resumePeopleMergeJob } from '@/lib/people/merge-job';
export { reconcilePeopleOrganization } from '@/lib/people/reconcile';
export { validateImportRow, importableDirectoryRolesForActor } from '@/lib/people/import-export';
export {
  resolvePeopleTenantFromSlug,
  ignoreBodyOrganizationId,
} from '@/lib/people/resolve-tenant';
export { guardPeopleApi, peopleErrorResponse } from '@/lib/people/guard';
export { getPeopleRepository, isPeoplePersistenceActive } from '@/lib/people/adapter';
export { PeoplePersistError, isPeoplePersistError } from '@/lib/people/errors';
export {
  orgEmailKey,
  orgExternalKey,
  edgeKey,
  grantKey,
  programLinkKey,
  householdMemberKey,
} from '@/lib/people/keys';
export { redactPersonForLogs, redactPeopleMeta } from '@/lib/people/redact-log';
export { peopleMetricsSnapshot, incPeopleMetric } from '@/lib/people/metrics';
export { withPeopleRetry, classifyPeopleError } from '@/lib/people/retry';
export { InternalAclAuthzProjector } from '@/lib/people/authz-port';
export type { PeopleRepository } from '@/lib/people/repository';
export type * from '@/lib/people/job-types';
export type * from '@/lib/people/types';
