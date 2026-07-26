export { isUniversalPeopleEnabled, peopleMajorityAge } from '@/lib/people/flags';
export { isPersonMinorAt, isExpired } from '@/lib/people/minor';
export {
  assertPeopleAccess,
  redactPersonForActor,
  personToExportRow,
} from '@/lib/people/acl';
export { ensurePersonForClientRecord } from '@/lib/people/ensure-person';
export {
  migrateClientRecordToPerson,
  migrateClientRecordToPersonIdempotent,
} from '@/lib/people/migrate-from-client';
export { mergePersons } from '@/lib/people/merge';
export { validateImportRow, importableDirectoryRolesForActor } from '@/lib/people/import-export';
export {
  resolvePeopleTenantFromSlug,
  ignoreBodyOrganizationId,
} from '@/lib/people/resolve-tenant';
export { guardPeopleApi } from '@/lib/people/guard';
export { InternalAclAuthzProjector } from '@/lib/people/authz-port';
export type * from '@/lib/people/types';
