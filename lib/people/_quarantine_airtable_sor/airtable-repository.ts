/**
 * AirtablePeopleRepository — the Phase 2B system of record.
 *
 * Transport is the unified client only (`lib/data/airtable-client` via `lib/platform-store`);
 * there is no second Airtable client and no other datastore.
 *
 * Compensating controls for Airtable's missing guarantees (blueprint §2.4):
 * - uniqueness: deterministic `OrgEmailKey` / `OrgExternalKey` lookups + post-create
 *   duplicate detection that collapses a lost race to one authoritative Person (ADV-P-1)
 * - fail closed: a soft `null` write result or transport throw becomes
 *   `PeoplePersistError('unavailable')` — never an empty success (INV-19)
 * - malformed JSON columns are rejected on read and write (INV-28)
 * - optimistic concurrency via the application-managed `Updated At` token (INV-23)
 */
import {
  platformCreate,
  platformQuery,
  platformUpdate,
  platformUpsertByField,
  type AirtableRecord,
} from '@/lib/platform-store';
import { escapeAirtableString } from '@/lib/data/airtable-client';
import { normalizeRole } from '@/lib/rbac';
import {
  ACL_GRANT_FIELDS,
  AUDIT_FIELDS,
  CONSENT_FIELDS,
  DIRECTORY_MEMBERSHIP_FIELDS,
  HOUSEHOLD_FIELDS,
  HOUSEHOLD_MEMBER_FIELDS,
  IMPORT_JOB_FIELDS,
  IMPORT_ROW_RESULT_FIELDS,
  MERGE_JOB_FIELDS,
  MIGRATION_CHECKPOINT_FIELDS,
  PEOPLE_ACL_GRANTS_TABLE,
  PEOPLE_AUDIT_TABLE,
  PEOPLE_CONSENTS_TABLE,
  PEOPLE_HOUSEHOLDS_TABLE,
  PEOPLE_HOUSEHOLD_MEMBERS_TABLE,
  PEOPLE_IMPORT_JOBS_TABLE,
  PEOPLE_IMPORT_ROW_RESULTS_TABLE,
  PEOPLE_MERGE_JOBS_TABLE,
  PEOPLE_MIGRATION_CHECKPOINTS_TABLE,
  PEOPLE_ORG_MEMBERSHIPS_TABLE,
  PEOPLE_PROGRAM_LINKS_TABLE,
  PEOPLE_RELATIONSHIPS_TABLE,
  PEOPLE_TABLE,
  PERSON_FIELDS,
  PROGRAM_LINK_FIELDS,
  RELATIONSHIP_FIELDS,
} from './airtable-tables';
import {
  PeoplePersistError,
  isPeoplePersistError,
  peopleConflict,
  peopleUnavailable,
  peopleValidation,
} from '@/lib/people/errors';
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
  primaryEmailOf,
  programLinkKey,
} from '@/lib/people/keys';
import { incPeopleMetric } from '@/lib/people/metrics';
import { logPeopleFailure, redactPeopleMeta } from '@/lib/people/redact-log';
import { withPeopleRetry } from '@/lib/people/retry';
import { newPeopleId, withPeopleIdentityLocks } from '@/lib/people/store';
import type {
  PeopleImportJob,
  PeopleImportRowResult,
  PeopleMergeJob,
  PeopleMergeStepName,
  PeopleMigrationCheckpoint,
} from '@/lib/people/job-types';
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
import type {
  AclResourceType,
  Household,
  HouseholdMember,
  Person,
  PersonAclGrant,
  PersonConsent,
  PersonDirectoryMembership,
  PersonEmail,
  PersonExternalId,
  PersonId,
  PersonPhone,
  PersonProgramLink,
  PersonRelationship,
} from '@/lib/people/types';
import { normalizeEmail } from '@/lib/people/types';

// --- transport helpers ------------------------------------------------------

function eq(field: string, value: string): string {
  return `{${field}}='${escapeAirtableString(value)}'`;
}

function and(...clauses: string[]): string {
  const parts = clauses.filter(Boolean);
  return parts.length > 1 ? `AND(${parts.join(',')})` : (parts[0] ?? '');
}

/** Reads fail closed: transport/schema errors surface as `unavailable` (INV-19). */
async function peopleQuery(
  table: string,
  filterByFormula?: string,
  maxRecords = 100,
): Promise<AirtableRecord[]> {
  return withPeopleRetry(
    async () => {
      incPeopleMetric('people_airtable_request', 'query');
      try {
        return await platformQuery(table, filterByFormula, maxRecords);
      } catch (error) {
        throw peopleUnavailable(
          `People read failed on ${table}: ${error instanceof Error ? error.message : 'unknown'}`,
          { table },
        );
      }
    },
    { operation: `query:${table}` },
  );
}

async function peopleQueryOne(
  table: string,
  filterByFormula: string,
): Promise<AirtableRecord | null> {
  const rows = await peopleQuery(table, filterByFormula, 1);
  return rows[0] ?? null;
}

/** Writes fail closed: a soft `null` result is a dependency failure, not success. */
async function peopleUpsert(
  table: string,
  lookupField: string,
  lookupValue: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return withPeopleRetry(
    async () => {
      incPeopleMetric('people_airtable_request', 'upsert');
      const record = await platformUpsertByField(table, lookupField, lookupValue, fields);
      if (!record) {
        throw peopleUnavailable(`People upsert failed on ${table}`, { table, lookupField });
      }
      return record;
    },
    { operation: `upsert:${table}` },
  );
}

async function peopleCreate(
  table: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return withPeopleRetry(
    async () => {
      incPeopleMetric('people_airtable_request', 'create');
      const record = await platformCreate(table, fields as Record<string, string | number | boolean>);
      if (!record) {
        throw peopleUnavailable(`People create failed on ${table}`, { table });
      }
      return record;
    },
    { operation: `create:${table}` },
  );
}

async function peopleUpdate(
  table: string,
  recordId: string,
  fields: Record<string, unknown>,
): Promise<AirtableRecord> {
  return withPeopleRetry(
    async () => {
      incPeopleMetric('people_airtable_request', 'update');
      const record = await platformUpdate(
        table,
        recordId,
        fields as Record<string, string | number | boolean>,
      );
      if (!record) {
        throw peopleUnavailable(`People update failed on ${table}`, { table });
      }
      return record;
    },
    { operation: `update:${table}` },
  );
}

// --- field codecs (INV-28) --------------------------------------------------

function text(record: AirtableRecord, field: string): string {
  const value = record.fields[field];
  if (value === undefined || value === null) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  throw peopleValidation(`Unexpected value shape in ${field}`);
}

function optionalText(record: AirtableRecord, field: string): string | undefined {
  const value = text(record, field);
  return value ? value : undefined;
}

function bool(record: AirtableRecord, field: string): boolean | undefined {
  const value = record.fields[field];
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'boolean') return value;
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  throw peopleValidation(`Unexpected checkbox shape in ${field}`);
}

function num(record: AirtableRecord, field: string): number {
  const value = record.fields[field];
  if (value === undefined || value === null || value === '') return 0;
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(parsed)) throw peopleValidation(`Unexpected number shape in ${field}`);
  return parsed;
}

/** Malformed stored JSON is rejected, never coerced or trusted (INV-28 / ADV-P-7). */
function parseJsonArray<T>(
  record: AirtableRecord,
  field: string,
  validate: (value: unknown) => T | null,
): T[] {
  const raw = record.fields[field];
  if (raw === undefined || raw === null || raw === '') return [];
  if (typeof raw !== 'string') {
    throw peopleValidation(`Expected JSON text in ${field}`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw peopleValidation(`Malformed JSON in ${field}`);
  }
  if (!Array.isArray(parsed)) {
    throw peopleValidation(`Expected JSON array in ${field}`);
  }
  const out: T[] = [];
  for (const entry of parsed) {
    const value = validate(entry);
    if (value === null) throw peopleValidation(`Invalid entry in ${field}`);
    out.push(value);
  }
  return out;
}

const EMAIL_KINDS = new Set<PersonEmail['kind']>(['primary', 'work', 'personal', 'other']);
const PHONE_KINDS = new Set<PersonPhone['kind']>(['mobile', 'work', 'home', 'other']);
const EXTERNAL_SYSTEMS = new Set<PersonExternalId['system']>([
  'client-record',
  'membership-email',
  'connect-relationship',
  'stripe-customer',
  'other',
]);
const LIFECYCLE_STATUSES = new Set<Person['lifecycleStatus']>([
  'active',
  'inactive',
  'archived',
  'deceased',
]);
const PERSON_SOURCES = new Set<Person['source']>([
  'manual',
  'client-record-migration',
  'membership-bootstrap',
  'connect-link',
  'import',
  'provisioning',
]);

function validateEmail(value: unknown): PersonEmail | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const email = typeof entry.value === 'string' ? normalizeEmail(entry.value) : '';
  const kind = entry.kind as PersonEmail['kind'];
  if (!email || !EMAIL_KINDS.has(kind)) return null;
  return {
    value: email,
    kind,
    verified: typeof entry.verified === 'boolean' ? entry.verified : undefined,
  };
}

function validatePhone(value: unknown): PersonPhone | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const phone = typeof entry.value === 'string' ? entry.value.trim() : '';
  const kind = entry.kind as PersonPhone['kind'];
  if (!phone || !PHONE_KINDS.has(kind)) return null;
  return { value: phone, kind };
}

function validateExternalId(value: unknown): PersonExternalId | null {
  if (!value || typeof value !== 'object') return null;
  const entry = value as Record<string, unknown>;
  const system = entry.system as PersonExternalId['system'];
  const val = typeof entry.value === 'string' ? entry.value.trim() : '';
  if (!val || !EXTERNAL_SYSTEMS.has(system)) return null;
  return { system, value: val };
}

function validateStringArray(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function recordToPerson(record: AirtableRecord): Person {
  const lifecycle = text(record, PERSON_FIELDS.lifecycleStatus) as Person['lifecycleStatus'];
  if (!LIFECYCLE_STATUSES.has(lifecycle)) {
    throw peopleValidation(`Invalid Lifecycle Status for ${record.id}`);
  }
  const source = (optionalText(record, PERSON_FIELDS.source) || 'manual') as Person['source'];
  if (!PERSON_SOURCES.has(source)) {
    throw peopleValidation(`Invalid Source for ${record.id}`);
  }
  const id = text(record, PERSON_FIELDS.personKey);
  if (!id) throw peopleValidation(`Missing Person Key on ${record.id}`);
  const organizationId = text(record, PERSON_FIELDS.organizationId);
  if (!organizationId) throw peopleValidation(`Missing Organization Id on ${record.id}`);

  return {
    id,
    organizationId,
    portalSlug: optionalText(record, PERSON_FIELDS.portalSlug),
    displayName: text(record, PERSON_FIELDS.displayName) || id,
    legalName: optionalText(record, PERSON_FIELDS.legalName),
    preferredName: optionalText(record, PERSON_FIELDS.preferredName),
    emails: parseJsonArray(record, PERSON_FIELDS.emailsJson, validateEmail),
    phones: parseJsonArray(record, PERSON_FIELDS.phonesJson, validatePhone),
    dateOfBirth: optionalText(record, PERSON_FIELDS.dateOfBirth),
    isMinor: bool(record, PERSON_FIELDS.isMinor),
    externalIds: parseJsonArray(record, PERSON_FIELDS.externalIdsJson, validateExternalId),
    lifecycleStatus: lifecycle,
    deceasedAt: optionalText(record, PERSON_FIELDS.deceasedAt),
    mergedIntoPersonId: optionalText(record, PERSON_FIELDS.mergedIntoPersonKey),
    duplicateOfPersonId: optionalText(record, PERSON_FIELDS.duplicateOfPersonKey),
    createdByUserEmail: optionalText(record, PERSON_FIELDS.createdByUserEmail),
    ownerUserEmail: optionalText(record, PERSON_FIELDS.ownerUserEmail),
    source,
    createdAt: optionalText(record, PERSON_FIELDS.createdAt) || new Date().toISOString(),
    updatedAt: optionalText(record, PERSON_FIELDS.updatedAt) || new Date().toISOString(),
  };
}

function personToFields(person: Person): Record<string, unknown> {
  const emailKeys = personParticipatesInEmailUniqueness(person)
    ? orgEmailKeysForPerson(person)
    : [];
  const externalKeys = personParticipatesInExternalUniqueness(person)
    ? orgExternalKeysForPerson(person)
    : [];
  const clientRecord = person.externalIds?.find((e) => e.system === 'client-record')?.value;

  return {
    [PERSON_FIELDS.personKey]: person.id,
    [PERSON_FIELDS.organizationId]: person.organizationId,
    [PERSON_FIELDS.portalSlug]: person.portalSlug || '',
    [PERSON_FIELDS.displayName]: person.displayName,
    [PERSON_FIELDS.legalName]: person.legalName || '',
    [PERSON_FIELDS.preferredName]: person.preferredName || '',
    [PERSON_FIELDS.primaryEmail]: primaryEmailOf(person),
    // Empty string releases the unique key when a person leaves the uniqueness set.
    [PERSON_FIELDS.orgEmailKey]: emailKeys[0] || '',
    [PERSON_FIELDS.orgEmailKeys]: emailKeys.join('\n'),
    [PERSON_FIELDS.emailsJson]: JSON.stringify(person.emails || []),
    [PERSON_FIELDS.phonesJson]: JSON.stringify(person.phones || []),
    [PERSON_FIELDS.dateOfBirth]: person.dateOfBirth || '',
    [PERSON_FIELDS.isMinor]: person.isMinor === true,
    [PERSON_FIELDS.externalIdsJson]: JSON.stringify(person.externalIds || []),
    [PERSON_FIELDS.clientRecordId]: clientRecord || '',
    [PERSON_FIELDS.orgExternalKey]: externalKeys[0] || '',
    [PERSON_FIELDS.orgExternalKeys]: externalKeys.join('\n'),
    [PERSON_FIELDS.lifecycleStatus]: person.lifecycleStatus,
    [PERSON_FIELDS.deceasedAt]: person.deceasedAt || '',
    [PERSON_FIELDS.mergedIntoPersonKey]: person.mergedIntoPersonId || '',
    [PERSON_FIELDS.duplicateOfPersonKey]: person.duplicateOfPersonId || '',
    [PERSON_FIELDS.createdByUserEmail]: person.createdByUserEmail || '',
    [PERSON_FIELDS.ownerUserEmail]: person.ownerUserEmail || '',
    [PERSON_FIELDS.source]: person.source,
    [PERSON_FIELDS.createdAt]: person.createdAt,
    [PERSON_FIELDS.updatedAt]: person.updatedAt,
  };
}

function jsonArrayField<T>(value: T[] | undefined): string {
  return JSON.stringify(value || []);
}

// --- repository -------------------------------------------------------------

class AirtablePeopleRepository implements PeopleRepository {
  readonly kind = 'airtable' as const;

  // --- Person --------------------------------------------------------------

  private async findPersonRecord(
    personId: PersonId,
  ): Promise<{ record: AirtableRecord; person: Person } | null> {
    const record = await peopleQueryOne(
      PEOPLE_TABLE,
      eq(PERSON_FIELDS.personKey, personId),
    );
    if (!record) return null;
    return { record, person: recordToPerson(record) };
  }

  private async findPersonRecordByKeyField(
    field: string,
    key: string,
  ): Promise<{ record: AirtableRecord; person: Person } | null> {
    const record = await peopleQueryOne(PEOPLE_TABLE, eq(field, key));
    if (!record) return null;
    return { record, person: recordToPerson(record) };
  }

  async createPerson(input: PersonCreateInput): Promise<Person> {
    const organizationId = input.organizationId?.trim();
    if (!organizationId) throw peopleValidation('organizationId required');
    if (organizationId.startsWith('org_')) {
      throw peopleValidation('Synthetic org_* not allowed for durable People writes');
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
      organizationId,
      emails: (input.emails || []).map((e) => ({ ...e, value: normalizeEmail(e.value) })),
      phones: input.phones || [],
      createdAt: now,
      updatedAt: now,
    };

    for (const key of personParticipatesInEmailUniqueness(person)
      ? orgEmailKeysForPerson(person)
      : []) {
      const clash = await this.findPersonRecordByKeyField(PERSON_FIELDS.orgEmailKey, key);
      if (clash) {
        throw peopleConflict(`Duplicate email key in org ${organizationId}`, {
          existingPersonId: clash.person.id,
        });
      }
    }
    for (const key of personParticipatesInExternalUniqueness(person)
      ? orgExternalKeysForPerson(person)
      : []) {
      const clash = await this.findPersonRecordByKeyField(PERSON_FIELDS.orgExternalKey, key);
      if (clash) {
        throw peopleConflict(`Duplicate external id in org ${organizationId}`, {
          existingPersonId: clash.person.id,
        });
      }
    }

    await peopleCreate(PEOPLE_TABLE, personToFields(person));
    return person;
  }

  async updatePerson(
    personId: PersonId,
    patch: PersonUpdatePatch,
    options: PersonUpdateOptions = {},
  ): Promise<Person> {
    if (patch && 'organizationId' in (patch as object)) {
      throw peopleValidation('organizationId is immutable');
    }
    const found = await this.findPersonRecord(personId);
    if (!found) throw peopleValidation('Person not found');
    // INV-23 — OCC token mismatch means the caller read a stale row.
    if (options.expectedUpdatedAt && options.expectedUpdatedAt !== found.person.updatedAt) {
      incPeopleMetric('people_conflict', 'person_update');
      throw peopleConflict('Person changed since read', { personId });
    }

    const cleaned = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ) as PersonUpdatePatch;

    const next: Person = {
      ...found.person,
      ...cleaned,
      id: found.person.id,
      organizationId: found.person.organizationId,
      createdAt: found.person.createdAt,
      emails: cleaned.emails
        ? cleaned.emails.map((e) => ({ ...e, value: normalizeEmail(e.value) }))
        : found.person.emails,
      updatedAt: new Date().toISOString(),
    };

    await peopleUpdate(PEOPLE_TABLE, found.record.id, personToFields(next));
    return next;
  }

  async getPerson(personId: PersonId): Promise<Person | null> {
    const found = await this.findPersonRecord(personId);
    return found?.person ?? null;
  }

  async listPersonsByOrg(organizationId: string): Promise<Person[]> {
    const records = await peopleQuery(
      PEOPLE_TABLE,
      eq(PERSON_FIELDS.organizationId, organizationId),
      1000,
    );
    const people: Person[] = [];
    for (const record of records) {
      // INV-28 — one malformed row must not silently disappear from the directory.
      people.push(recordToPerson(record));
    }
    return people;
  }

  async findPersonByEmail(organizationId: string, email: string): Promise<Person | null> {
    const normalized = normalizeEmail(email);
    if (!organizationId?.trim() || !normalized) return null;
    const key = orgEmailKey(organizationId, normalized);
    const byKey = await this.findPersonRecordByKeyField(PERSON_FIELDS.orgEmailKey, key);
    if (byKey) return byKey.person;
    // Secondary emails live in the newline-joined key column (P1-8).
    const record = await peopleQueryOne(
      PEOPLE_TABLE,
      and(
        eq(PERSON_FIELDS.organizationId, organizationId),
        `FIND('${escapeAirtableString(key)}',{${PERSON_FIELDS.orgEmailKeys}})>0`,
      ),
    );
    return record ? recordToPerson(record) : null;
  }

  async findPersonByExternalId(
    organizationId: string,
    system: PersonExternalId['system'],
    value: string,
  ): Promise<Person | null> {
    if (!organizationId?.trim() || !value?.trim()) return null;
    const key = orgExternalKey(organizationId, system, value);
    const byKey = await this.findPersonRecordByKeyField(PERSON_FIELDS.orgExternalKey, key);
    if (byKey) return byKey.person;
    const record = await peopleQueryOne(
      PEOPLE_TABLE,
      and(
        eq(PERSON_FIELDS.organizationId, organizationId),
        `FIND('${escapeAirtableString(key)}',{${PERSON_FIELDS.orgExternalKeys}})>0`,
      ),
    );
    return record ? recordToPerson(record) : null;
  }

  /**
   * ADV-P-1 — create-or-return under concurrency.
   *
   * Airtable has no atomic UNIQUE, so after creating we re-read the identity key.
   * If two writers both created a row, the lexicographically smallest Person Key
   * wins and the loser — which cannot yet own any edges — is marked as a duplicate
   * so exactly one authoritative Person remains. If the loser already owns graph
   * rows we refuse to guess: fail closed and page ops (§6.6).
   */
  async upsertPersonByIdentity(
    input: PersonCreateInput,
    identity: { emailKey?: string; externalKey?: string },
  ): Promise<PersonUpsertResult> {
    const organizationId = input.organizationId?.trim();
    if (!organizationId) throw peopleValidation('organizationId required');

    const emailKey =
      identity.emailKey ||
      (input.emails?.[0]?.value
        ? orgEmailKey(organizationId, input.emails[0].value)
        : undefined);
    const externalKey =
      identity.externalKey ||
      (input.externalIds?.[0]
        ? orgExternalKey(
            organizationId,
            input.externalIds[0].system,
            input.externalIds[0].value,
          )
        : undefined);

    if (!emailKey && !externalKey) {
      throw peopleValidation('identity key required for upsert');
    }

    return withPeopleIdentityLocks([externalKey, emailKey], async () => {
      const existing = await this.lookupIdentity({ emailKey, externalKey });
      if (existing) return { person: existing, created: false };

      let created: Person;
      try {
        created = await this.createPerson(input);
      } catch (error) {
        if (isPeoplePersistError(error) && error.code === 'conflict') {
          const winner = await this.lookupIdentity({ emailKey, externalKey });
          if (winner) return { person: winner, created: false };
        }
        throw error;
      }

      const authoritative = await this.resolveIdentityRace(created, { emailKey, externalKey });
      return { person: authoritative, created: authoritative.id === created.id };
    });
  }

  private async lookupIdentity(identity: {
    emailKey?: string;
    externalKey?: string;
  }): Promise<Person | null> {
    if (identity.externalKey) {
      const byExternal = await this.findPersonRecordByKeyField(
        PERSON_FIELDS.orgExternalKey,
        identity.externalKey,
      );
      if (byExternal) return byExternal.person;
    }
    if (identity.emailKey) {
      const byEmail = await this.findPersonRecordByKeyField(
        PERSON_FIELDS.orgEmailKey,
        identity.emailKey,
      );
      if (byEmail) return byEmail.person;
    }
    return null;
  }

  private async resolveIdentityRace(
    created: Person,
    identity: { emailKey?: string; externalKey?: string },
  ): Promise<Person> {
    const key = identity.emailKey || identity.externalKey;
    const field = identity.emailKey ? PERSON_FIELDS.orgEmailKey : PERSON_FIELDS.orgExternalKey;
    if (!key) return created;

    const records = await peopleQuery(PEOPLE_TABLE, eq(field, key), 10);
    const claimants = records
      .map((record) => ({ record, person: recordToPerson(record) }))
      .filter((entry) => !entry.person.mergedIntoPersonId && !entry.person.duplicateOfPersonId);
    if (claimants.length <= 1) return created;

    incPeopleMetric('people_duplicate_email_key', 'identity_race');
    const sorted = [...claimants].sort((a, b) => a.person.id.localeCompare(b.person.id));
    const winner = sorted[0];
    const losers = sorted.slice(1);

    for (const loser of losers) {
      const edges = await this.listDirectoryMembershipsForPerson(loser.person.id);
      if (edges.length > 0) {
        logPeopleFailure('duplicate_identity', new Error('duplicate person with graph rows'), {
          organizationId: loser.person.organizationId,
          personId: loser.person.id,
          winnerPersonId: winner.person.id,
        });
        throw peopleConflict('Duplicate Person detected; ops merge required', {
          personId: loser.person.id,
          winnerPersonId: winner.person.id,
        });
      }
      await peopleUpdate(PEOPLE_TABLE, loser.record.id, {
        ...personToFields({
          ...loser.person,
          lifecycleStatus: 'archived',
          duplicateOfPersonId: winner.person.id,
          mergedIntoPersonId: winner.person.id,
          updatedAt: new Date().toISOString(),
        }),
      });
      await this.appendAudit({
        organizationId: loser.person.organizationId,
        actorEmail: 'system',
        action: 'people.merge',
        subjectPersonId: winner.person.id,
        meta: redactPeopleMeta({
          reason: 'identity_race_collapse',
          duplicatePersonId: loser.person.id,
        }),
      });
    }

    return winner.person;
  }

  // --- Directory -----------------------------------------------------------

  async upsertDirectoryMembership(
    input: Omit<PersonDirectoryMembership, 'id'> & { id?: string },
  ): Promise<PersonDirectoryMembership> {
    const key = directoryMembershipKey(input.organizationId, input.personId);
    const row: PersonDirectoryMembership = { ...input, id: input.id || newPeopleId('pdm') };
    const record = await peopleUpsert(
      PEOPLE_ORG_MEMBERSHIPS_TABLE,
      DIRECTORY_MEMBERSHIP_FIELDS.membershipKey,
      key,
      {
        [DIRECTORY_MEMBERSHIP_FIELDS.membershipKey]: key,
        [DIRECTORY_MEMBERSHIP_FIELDS.organizationId]: input.organizationId,
        [DIRECTORY_MEMBERSHIP_FIELDS.personKey]: input.personId,
        [DIRECTORY_MEMBERSHIP_FIELDS.rolesJson]: jsonArrayField(input.roles),
        [DIRECTORY_MEMBERSHIP_FIELDS.status]: input.status,
        [DIRECTORY_MEMBERSHIP_FIELDS.title]: input.title || '',
        [DIRECTORY_MEMBERSHIP_FIELDS.portalMembershipId]: input.portalMembershipId || '',
        [DIRECTORY_MEMBERSHIP_FIELDS.clientRecordId]: input.clientRecordId || '',
        [DIRECTORY_MEMBERSHIP_FIELDS.startedAt]: input.startedAt || '',
        [DIRECTORY_MEMBERSHIP_FIELDS.endedAt]: input.endedAt || '',
      },
    );
    return { ...row, id: text(record, DIRECTORY_MEMBERSHIP_FIELDS.membershipKey) || row.id };
  }

  private recordToDirectoryMembership(record: AirtableRecord): PersonDirectoryMembership {
    return {
      id: text(record, DIRECTORY_MEMBERSHIP_FIELDS.membershipKey),
      organizationId: text(record, DIRECTORY_MEMBERSHIP_FIELDS.organizationId),
      personId: text(record, DIRECTORY_MEMBERSHIP_FIELDS.personKey),
      roles: parseJsonArray(record, DIRECTORY_MEMBERSHIP_FIELDS.rolesJson, (value) =>
        typeof value === 'string' ? (value as PersonDirectoryMembership['roles'][number]) : null,
      ),
      status: (text(record, DIRECTORY_MEMBERSHIP_FIELDS.status) ||
        'active') as PersonDirectoryMembership['status'],
      title: optionalText(record, DIRECTORY_MEMBERSHIP_FIELDS.title),
      portalMembershipId: optionalText(record, DIRECTORY_MEMBERSHIP_FIELDS.portalMembershipId),
      clientRecordId: optionalText(record, DIRECTORY_MEMBERSHIP_FIELDS.clientRecordId),
      startedAt: optionalText(record, DIRECTORY_MEMBERSHIP_FIELDS.startedAt),
      endedAt: optionalText(record, DIRECTORY_MEMBERSHIP_FIELDS.endedAt),
    };
  }

  async getDirectoryMembership(
    organizationId: string,
    personId: PersonId,
  ): Promise<PersonDirectoryMembership | null> {
    const record = await peopleQueryOne(
      PEOPLE_ORG_MEMBERSHIPS_TABLE,
      eq(
        DIRECTORY_MEMBERSHIP_FIELDS.membershipKey,
        directoryMembershipKey(organizationId, personId),
      ),
    );
    return record ? this.recordToDirectoryMembership(record) : null;
  }

  async listDirectoryMembershipsForPerson(
    personId: PersonId,
  ): Promise<PersonDirectoryMembership[]> {
    const records = await peopleQuery(
      PEOPLE_ORG_MEMBERSHIPS_TABLE,
      eq(DIRECTORY_MEMBERSHIP_FIELDS.personKey, personId),
      100,
    );
    return records.map((record) => this.recordToDirectoryMembership(record));
  }

  // --- Households ----------------------------------------------------------

  async createHousehold(input: Omit<Household, 'id'> & { id?: string }): Promise<Household> {
    const row: Household = { ...input, id: input.id || newPeopleId('hh') };
    await peopleUpsert(PEOPLE_HOUSEHOLDS_TABLE, HOUSEHOLD_FIELDS.householdKey, row.id, {
      [HOUSEHOLD_FIELDS.householdKey]: row.id,
      [HOUSEHOLD_FIELDS.organizationId]: row.organizationId,
      [HOUSEHOLD_FIELDS.displayName]: row.displayName,
      [HOUSEHOLD_FIELDS.status]: row.status,
      [HOUSEHOLD_FIELDS.primaryContactPersonKey]: row.primaryContactPersonId || '',
    });
    return row;
  }

  async upsertHouseholdMember(
    input: Omit<HouseholdMember, 'id'> & { id?: string },
  ): Promise<HouseholdMember> {
    const key = householdMemberKey(input.householdId, input.personId);
    const row: HouseholdMember = { ...input, id: input.id || key };
    await peopleUpsert(
      PEOPLE_HOUSEHOLD_MEMBERS_TABLE,
      HOUSEHOLD_MEMBER_FIELDS.memberKey,
      key,
      {
        [HOUSEHOLD_MEMBER_FIELDS.memberKey]: key,
        [HOUSEHOLD_MEMBER_FIELDS.organizationId]: input.organizationId,
        [HOUSEHOLD_MEMBER_FIELDS.householdKey]: input.householdId,
        [HOUSEHOLD_MEMBER_FIELDS.personKey]: input.personId,
        [HOUSEHOLD_MEMBER_FIELDS.role]: input.role,
        [HOUSEHOLD_MEMBER_FIELDS.isAuthorizedRepresentative]:
          input.isAuthorizedRepresentative === true,
        [HOUSEHOLD_MEMBER_FIELDS.authzExpiresAt]: input.authzExpiresAt || '',
      },
    );
    return { ...row, id: key };
  }

  private recordToHouseholdMember(record: AirtableRecord): HouseholdMember {
    return {
      id: text(record, HOUSEHOLD_MEMBER_FIELDS.memberKey),
      organizationId: text(record, HOUSEHOLD_MEMBER_FIELDS.organizationId),
      householdId: text(record, HOUSEHOLD_MEMBER_FIELDS.householdKey),
      personId: text(record, HOUSEHOLD_MEMBER_FIELDS.personKey),
      role: (text(record, HOUSEHOLD_MEMBER_FIELDS.role) || 'other') as HouseholdMember['role'],
      isAuthorizedRepresentative: bool(record, HOUSEHOLD_MEMBER_FIELDS.isAuthorizedRepresentative),
      authzExpiresAt: optionalText(record, HOUSEHOLD_MEMBER_FIELDS.authzExpiresAt),
    };
  }

  async listHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
    const records = await peopleQuery(
      PEOPLE_HOUSEHOLD_MEMBERS_TABLE,
      eq(HOUSEHOLD_MEMBER_FIELDS.householdKey, householdId),
      200,
    );
    return records.map((record) => this.recordToHouseholdMember(record));
  }

  async listHouseholdMembersForPerson(personId: PersonId): Promise<HouseholdMember[]> {
    const records = await peopleQuery(
      PEOPLE_HOUSEHOLD_MEMBERS_TABLE,
      eq(HOUSEHOLD_MEMBER_FIELDS.personKey, personId),
      200,
    );
    return records.map((record) => this.recordToHouseholdMember(record));
  }

  // --- Graph ---------------------------------------------------------------

  async upsertRelationship(
    input: Omit<PersonRelationship, 'id'> & { id?: string },
  ): Promise<PersonRelationship> {
    const key = edgeKey(input.organizationId, input.fromPersonId, input.toPersonId, input.type);
    const row: PersonRelationship = { ...input, id: input.id || key };
    await peopleUpsert(PEOPLE_RELATIONSHIPS_TABLE, RELATIONSHIP_FIELDS.edgeKey, key, {
      [RELATIONSHIP_FIELDS.edgeKey]: key,
      [RELATIONSHIP_FIELDS.organizationId]: input.organizationId,
      [RELATIONSHIP_FIELDS.fromPersonKey]: input.fromPersonId,
      [RELATIONSHIP_FIELDS.toPersonKey]: input.toPersonId,
      [RELATIONSHIP_FIELDS.type]: input.type,
      [RELATIONSHIP_FIELDS.status]: input.status,
      [RELATIONSHIP_FIELDS.expiresAt]: input.expiresAt || '',
      [RELATIONSHIP_FIELDS.bidirectionalMirrorId]: input.bidirectionalMirrorId || '',
      [RELATIONSHIP_FIELDS.notes]: input.notes || '',
    });
    return { ...row, id: key };
  }

  async listRelationshipsForOrg(organizationId: string): Promise<PersonRelationship[]> {
    const records = await peopleQuery(
      PEOPLE_RELATIONSHIPS_TABLE,
      eq(RELATIONSHIP_FIELDS.organizationId, organizationId),
      1000,
    );
    return records.map((record) => ({
      id: text(record, RELATIONSHIP_FIELDS.edgeKey),
      organizationId: text(record, RELATIONSHIP_FIELDS.organizationId),
      fromPersonId: text(record, RELATIONSHIP_FIELDS.fromPersonKey),
      toPersonId: text(record, RELATIONSHIP_FIELDS.toPersonKey),
      type: (text(record, RELATIONSHIP_FIELDS.type) || 'other') as PersonRelationship['type'],
      status: (text(record, RELATIONSHIP_FIELDS.status) || 'active') as PersonRelationship['status'],
      expiresAt: optionalText(record, RELATIONSHIP_FIELDS.expiresAt),
      bidirectionalMirrorId: optionalText(record, RELATIONSHIP_FIELDS.bidirectionalMirrorId),
      notes: optionalText(record, RELATIONSHIP_FIELDS.notes),
    }));
  }

  async upsertProgramLink(
    input: Omit<PersonProgramLink, 'id'> & { id?: string },
  ): Promise<PersonProgramLink> {
    const key = programLinkKey(
      input.organizationId,
      input.personId,
      input.kind,
      input.externalRef,
    );
    const row: PersonProgramLink = { ...input, id: input.id || key };
    await peopleUpsert(PEOPLE_PROGRAM_LINKS_TABLE, PROGRAM_LINK_FIELDS.linkKey, key, {
      [PROGRAM_LINK_FIELDS.linkKey]: key,
      [PROGRAM_LINK_FIELDS.organizationId]: input.organizationId,
      [PROGRAM_LINK_FIELDS.personKey]: input.personId,
      [PROGRAM_LINK_FIELDS.kind]: input.kind,
      [PROGRAM_LINK_FIELDS.externalRef]: input.externalRef,
      [PROGRAM_LINK_FIELDS.label]: input.label || '',
      [PROGRAM_LINK_FIELDS.status]: input.status,
      [PROGRAM_LINK_FIELDS.roleInProgram]: input.roleInProgram || '',
    });
    return { ...row, id: key };
  }

  async listProgramLinks(personId: PersonId): Promise<PersonProgramLink[]> {
    const records = await peopleQuery(
      PEOPLE_PROGRAM_LINKS_TABLE,
      eq(PROGRAM_LINK_FIELDS.personKey, personId),
      200,
    );
    return records.map((record) => ({
      id: text(record, PROGRAM_LINK_FIELDS.linkKey),
      organizationId: text(record, PROGRAM_LINK_FIELDS.organizationId),
      personId: text(record, PROGRAM_LINK_FIELDS.personKey),
      kind: (text(record, PROGRAM_LINK_FIELDS.kind) || 'other') as PersonProgramLink['kind'],
      externalRef: text(record, PROGRAM_LINK_FIELDS.externalRef),
      label: optionalText(record, PROGRAM_LINK_FIELDS.label),
      status: (text(record, PROGRAM_LINK_FIELDS.status) || 'active') as PersonProgramLink['status'],
      roleInProgram: optionalText(record, PROGRAM_LINK_FIELDS.roleInProgram),
    }));
  }

  async upsertConsent(
    input: Omit<PersonConsent, 'id'> & { id?: string },
  ): Promise<PersonConsent> {
    const key = consentKey(input.organizationId, input.personId, input.purpose);
    const row: PersonConsent = { ...input, id: input.id || key };
    await peopleUpsert(PEOPLE_CONSENTS_TABLE, CONSENT_FIELDS.consentKey, key, {
      [CONSENT_FIELDS.consentKey]: key,
      [CONSENT_FIELDS.organizationId]: input.organizationId,
      [CONSENT_FIELDS.personKey]: input.personId,
      [CONSENT_FIELDS.purpose]: input.purpose,
      [CONSENT_FIELDS.status]: input.status,
      [CONSENT_FIELDS.capturedAt]: input.capturedAt,
      [CONSENT_FIELDS.expiresAt]: input.expiresAt || '',
      [CONSENT_FIELDS.source]: input.source,
      [CONSENT_FIELDS.actorPersonKey]: input.actorPersonId || '',
    });
    return { ...row, id: key };
  }

  async listConsents(personId: PersonId): Promise<PersonConsent[]> {
    const records = await peopleQuery(
      PEOPLE_CONSENTS_TABLE,
      eq(CONSENT_FIELDS.personKey, personId),
      200,
    );
    return records.map((record) => ({
      id: text(record, CONSENT_FIELDS.consentKey),
      organizationId: text(record, CONSENT_FIELDS.organizationId),
      personId: text(record, CONSENT_FIELDS.personKey),
      purpose: text(record, CONSENT_FIELDS.purpose) as PersonConsent['purpose'],
      status: (text(record, CONSENT_FIELDS.status) || 'granted') as PersonConsent['status'],
      capturedAt: text(record, CONSENT_FIELDS.capturedAt),
      expiresAt: optionalText(record, CONSENT_FIELDS.expiresAt),
      source: (text(record, CONSENT_FIELDS.source) || 'staff') as PersonConsent['source'],
      actorPersonId: optionalText(record, CONSENT_FIELDS.actorPersonKey),
    }));
  }

  async upsertAclGrant(
    input: Omit<PersonAclGrant, 'id'> & { id?: string },
  ): Promise<PersonAclGrant> {
    const key = grantKey(
      input.organizationId,
      input.resourceType,
      input.resourceId,
      input.grantee,
      input.relation,
    );
    const row: PersonAclGrant = { ...input, id: input.id || key };
    const granteeValue =
      input.grantee.kind === 'user_email'
        ? normalizeEmail(input.grantee.email)
        : input.grantee.kind === 'person'
          ? input.grantee.personId
          : input.grantee.role;
    await peopleUpsert(PEOPLE_ACL_GRANTS_TABLE, ACL_GRANT_FIELDS.grantKey, key, {
      [ACL_GRANT_FIELDS.grantKey]: key,
      [ACL_GRANT_FIELDS.organizationId]: input.organizationId,
      [ACL_GRANT_FIELDS.resourceType]: input.resourceType,
      [ACL_GRANT_FIELDS.resourceId]: input.resourceId,
      [ACL_GRANT_FIELDS.granteeKind]: input.grantee.kind,
      [ACL_GRANT_FIELDS.granteeValue]: granteeValue,
      [ACL_GRANT_FIELDS.relation]: input.relation,
      [ACL_GRANT_FIELDS.fieldsAllowJson]: jsonArrayField(input.fieldsAllow),
      [ACL_GRANT_FIELDS.fieldsDenyJson]: jsonArrayField(input.fieldsDeny),
      [ACL_GRANT_FIELDS.expiresAt]: input.expiresAt || '',
    });
    return { ...row, id: key };
  }

  async listAclGrantsForResource(
    organizationId: string,
    resourceType: AclResourceType,
    resourceId: string,
  ): Promise<PersonAclGrant[]> {
    const records = await peopleQuery(
      PEOPLE_ACL_GRANTS_TABLE,
      and(
        eq(ACL_GRANT_FIELDS.organizationId, organizationId),
        eq(ACL_GRANT_FIELDS.resourceType, resourceType),
        eq(ACL_GRANT_FIELDS.resourceId, resourceId),
      ),
      200,
    );
    return records.map((record) => {
      const kind = text(record, ACL_GRANT_FIELDS.granteeKind);
      const value = text(record, ACL_GRANT_FIELDS.granteeValue);
      const grantee: PersonAclGrant['grantee'] =
        kind === 'person'
          ? { kind: 'person', personId: value }
          : kind === 'platform_role'
            ? { kind: 'platform_role', role: normalizeRole(value) }
            : { kind: 'user_email', email: value };
      return {
        id: text(record, ACL_GRANT_FIELDS.grantKey),
        organizationId: text(record, ACL_GRANT_FIELDS.organizationId),
        resourceType: text(record, ACL_GRANT_FIELDS.resourceType) as AclResourceType,
        resourceId: text(record, ACL_GRANT_FIELDS.resourceId),
        grantee,
        relation: text(record, ACL_GRANT_FIELDS.relation) as PersonAclGrant['relation'],
        fieldsAllow: parseJsonArray(record, ACL_GRANT_FIELDS.fieldsAllowJson, validateStringArray),
        fieldsDeny: parseJsonArray(record, ACL_GRANT_FIELDS.fieldsDenyJson, validateStringArray),
        expiresAt: optionalText(record, ACL_GRANT_FIELDS.expiresAt),
      };
    });
  }

  // --- Audit ---------------------------------------------------------------

  /** INV-15/24 — insert only. There is no update or delete path in the app. */
  async appendAudit(input: PeopleAuditInput) {
    const id = newPeopleId('aud');
    const at = new Date().toISOString();
    await peopleCreate(PEOPLE_AUDIT_TABLE, {
      [AUDIT_FIELDS.auditKey]: id,
      [AUDIT_FIELDS.organizationId]: input.organizationId,
      [AUDIT_FIELDS.actorEmail]: input.actorEmail,
      [AUDIT_FIELDS.actorPersonKey]: input.actorPersonId || '',
      [AUDIT_FIELDS.action]: input.action,
      [AUDIT_FIELDS.subjectPersonKey]: input.subjectPersonId || '',
      [AUDIT_FIELDS.at]: at,
      // INV-25 — meta is redacted before it is ever persisted or logged.
      [AUDIT_FIELDS.metaJson]: JSON.stringify(redactPeopleMeta(input.meta)),
    });
    return {
      id,
      organizationId: input.organizationId,
      actorEmail: input.actorEmail,
      actorPersonId: input.actorPersonId,
      action: input.action,
      subjectPersonId: input.subjectPersonId,
      at,
      meta: redactPeopleMeta(input.meta),
    };
  }

  async listAudit(organizationId: string) {
    const records = await peopleQuery(
      PEOPLE_AUDIT_TABLE,
      eq(AUDIT_FIELDS.organizationId, organizationId),
      500,
    );
    return records.map((record) => {
      const rawMeta = record.fields[AUDIT_FIELDS.metaJson];
      let meta: Record<string, string | number | boolean | null> | undefined;
      if (typeof rawMeta === 'string' && rawMeta.trim()) {
        try {
          const parsed = JSON.parse(rawMeta) as unknown;
          meta =
            parsed && typeof parsed === 'object' && !Array.isArray(parsed)
              ? (parsed as Record<string, string | number | boolean | null>)
              : undefined;
        } catch {
          throw peopleValidation('Malformed audit Meta JSON');
        }
      }
      return {
        id: text(record, AUDIT_FIELDS.auditKey),
        organizationId: text(record, AUDIT_FIELDS.organizationId),
        actorEmail: text(record, AUDIT_FIELDS.actorEmail),
        actorPersonId: optionalText(record, AUDIT_FIELDS.actorPersonKey),
        action: text(record, AUDIT_FIELDS.action) as PeopleAuditInput['action'],
        subjectPersonId: optionalText(record, AUDIT_FIELDS.subjectPersonKey),
        at: text(record, AUDIT_FIELDS.at),
        meta,
      };
    });
  }

  // --- Merge jobs ----------------------------------------------------------

  private recordToMergeJob(record: AirtableRecord): PeopleMergeJob {
    return {
      id: text(record, MERGE_JOB_FIELDS.jobId),
      organizationId: text(record, MERGE_JOB_FIELDS.organizationId),
      jobKey: text(record, MERGE_JOB_FIELDS.jobKey),
      survivorPersonId: text(record, MERGE_JOB_FIELDS.survivorPersonKey),
      absorbedPersonId: text(record, MERGE_JOB_FIELDS.absorbedPersonKey),
      status: (text(record, MERGE_JOB_FIELDS.status) || 'queued') as PeopleMergeJob['status'],
      completedSteps: parseJsonArray(
        record,
        MERGE_JOB_FIELDS.completedStepsJson,
        (value) => (typeof value === 'string' ? (value as PeopleMergeStepName) : null),
      ),
      attempts: num(record, MERGE_JOB_FIELDS.attempts),
      actorEmail: text(record, MERGE_JOB_FIELDS.actorEmail),
      lastError: optionalText(record, MERGE_JOB_FIELDS.lastError),
      createdAt: text(record, MERGE_JOB_FIELDS.createdAt),
      updatedAt: text(record, MERGE_JOB_FIELDS.updatedAt),
    };
  }

  async createMergeJob(input: MergeJobCreateInput): Promise<PeopleMergeJob> {
    const key = mergeJobKey(input.organizationId, input.absorbedPersonId);
    const existing = await peopleQueryOne(
      PEOPLE_MERGE_JOBS_TABLE,
      eq(MERGE_JOB_FIELDS.jobKey, key),
    );
    if (existing) return this.recordToMergeJob(existing);

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
      meta: redactPeopleMeta(input.meta),
      createdAt: now,
      updatedAt: now,
    };
    await peopleUpsert(PEOPLE_MERGE_JOBS_TABLE, MERGE_JOB_FIELDS.jobKey, key, {
      [MERGE_JOB_FIELDS.jobId]: job.id,
      [MERGE_JOB_FIELDS.jobKey]: key,
      [MERGE_JOB_FIELDS.organizationId]: job.organizationId,
      [MERGE_JOB_FIELDS.survivorPersonKey]: job.survivorPersonId,
      [MERGE_JOB_FIELDS.absorbedPersonKey]: job.absorbedPersonId,
      [MERGE_JOB_FIELDS.status]: job.status,
      [MERGE_JOB_FIELDS.completedStepsJson]: '[]',
      [MERGE_JOB_FIELDS.attempts]: 0,
      [MERGE_JOB_FIELDS.actorEmail]: job.actorEmail,
      [MERGE_JOB_FIELDS.metaJson]: JSON.stringify(job.meta || {}),
      [MERGE_JOB_FIELDS.createdAt]: now,
      [MERGE_JOB_FIELDS.updatedAt]: now,
    });
    return job;
  }

  async getMergeJob(jobId: string): Promise<PeopleMergeJob | null> {
    const record = await peopleQueryOne(
      PEOPLE_MERGE_JOBS_TABLE,
      eq(MERGE_JOB_FIELDS.jobId, jobId),
    );
    return record ? this.recordToMergeJob(record) : null;
  }

  async findMergeJobByAbsorbed(
    organizationId: string,
    absorbedPersonId: PersonId,
  ): Promise<PeopleMergeJob | null> {
    const record = await peopleQueryOne(
      PEOPLE_MERGE_JOBS_TABLE,
      eq(MERGE_JOB_FIELDS.jobKey, mergeJobKey(organizationId, absorbedPersonId)),
    );
    return record ? this.recordToMergeJob(record) : null;
  }

  async updateMergeJob(jobId: string, patch: MergeJobPatch): Promise<PeopleMergeJob> {
    const record = await peopleQueryOne(
      PEOPLE_MERGE_JOBS_TABLE,
      eq(MERGE_JOB_FIELDS.jobId, jobId),
    );
    if (!record) throw peopleValidation('Merge job not found');
    const existing = this.recordToMergeJob(record);
    const completedSteps = patch.completedStep
      ? [...new Set([...existing.completedSteps, patch.completedStep])]
      : existing.completedSteps;
    const next: PeopleMergeJob = {
      ...existing,
      status: patch.status ?? existing.status,
      completedSteps,
      attempts: patch.attempts ?? existing.attempts,
      lastError: patch.lastError ?? existing.lastError,
      updatedAt: new Date().toISOString(),
    };
    await peopleUpdate(PEOPLE_MERGE_JOBS_TABLE, record.id, {
      [MERGE_JOB_FIELDS.status]: next.status,
      [MERGE_JOB_FIELDS.completedStepsJson]: JSON.stringify(next.completedSteps),
      [MERGE_JOB_FIELDS.attempts]: next.attempts,
      [MERGE_JOB_FIELDS.lastError]: next.lastError || '',
      [MERGE_JOB_FIELDS.metaJson]: JSON.stringify(redactPeopleMeta(patch.meta)),
      [MERGE_JOB_FIELDS.updatedAt]: next.updatedAt,
    });
    return next;
  }

  // --- Import jobs ---------------------------------------------------------

  private recordToImportJob(record: AirtableRecord): PeopleImportJob {
    return {
      id: text(record, IMPORT_JOB_FIELDS.jobId),
      organizationId: text(record, IMPORT_JOB_FIELDS.organizationId),
      idempotencyKey: text(record, IMPORT_JOB_FIELDS.idempotencyKey),
      source: (text(record, IMPORT_JOB_FIELDS.source) || 'staff-import') as PeopleImportJob['source'],
      status: (text(record, IMPORT_JOB_FIELDS.status) || 'queued') as PeopleImportJob['status'],
      rowCount: num(record, IMPORT_JOB_FIELDS.rowCount),
      okCount: num(record, IMPORT_JOB_FIELDS.okCount),
      failedCount: num(record, IMPORT_JOB_FIELDS.failedCount),
      actorEmail: text(record, IMPORT_JOB_FIELDS.actorEmail),
      dryRun: bool(record, IMPORT_JOB_FIELDS.dryRun),
      lastError: optionalText(record, IMPORT_JOB_FIELDS.lastError),
      createdAt: text(record, IMPORT_JOB_FIELDS.createdAt),
      updatedAt: text(record, IMPORT_JOB_FIELDS.updatedAt),
    };
  }

  async createImportJob(input: ImportJobCreateInput): Promise<PeopleImportJob> {
    if (!input.idempotencyKey?.trim()) {
      throw peopleValidation('idempotencyKey required for import job');
    }
    const existing = await this.findImportJobByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );
    if (existing) return existing;

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
      meta: redactPeopleMeta(input.meta),
      createdAt: now,
      updatedAt: now,
    };
    await peopleUpsert(
      PEOPLE_IMPORT_JOBS_TABLE,
      IMPORT_JOB_FIELDS.idempotencyKey,
      input.idempotencyKey,
      {
        [IMPORT_JOB_FIELDS.jobId]: job.id,
        [IMPORT_JOB_FIELDS.organizationId]: job.organizationId,
        [IMPORT_JOB_FIELDS.idempotencyKey]: job.idempotencyKey,
        [IMPORT_JOB_FIELDS.source]: job.source,
        [IMPORT_JOB_FIELDS.status]: job.status,
        [IMPORT_JOB_FIELDS.rowCount]: job.rowCount,
        [IMPORT_JOB_FIELDS.okCount]: 0,
        [IMPORT_JOB_FIELDS.failedCount]: 0,
        [IMPORT_JOB_FIELDS.actorEmail]: job.actorEmail,
        [IMPORT_JOB_FIELDS.dryRun]: job.dryRun === true,
        [IMPORT_JOB_FIELDS.metaJson]: JSON.stringify(job.meta || {}),
        [IMPORT_JOB_FIELDS.createdAt]: now,
        [IMPORT_JOB_FIELDS.updatedAt]: now,
      },
    );
    return job;
  }

  async getImportJob(jobId: string): Promise<PeopleImportJob | null> {
    const record = await peopleQueryOne(
      PEOPLE_IMPORT_JOBS_TABLE,
      eq(IMPORT_JOB_FIELDS.jobId, jobId),
    );
    return record ? this.recordToImportJob(record) : null;
  }

  async findImportJobByIdempotencyKey(
    organizationId: string,
    idempotencyKey: string,
  ): Promise<PeopleImportJob | null> {
    const record = await peopleQueryOne(
      PEOPLE_IMPORT_JOBS_TABLE,
      and(
        eq(IMPORT_JOB_FIELDS.organizationId, organizationId),
        eq(IMPORT_JOB_FIELDS.idempotencyKey, idempotencyKey),
      ),
    );
    return record ? this.recordToImportJob(record) : null;
  }

  async updateImportJob(jobId: string, patch: ImportJobPatch): Promise<PeopleImportJob> {
    const record = await peopleQueryOne(
      PEOPLE_IMPORT_JOBS_TABLE,
      eq(IMPORT_JOB_FIELDS.jobId, jobId),
    );
    if (!record) throw peopleValidation('Import job not found');
    const existing = this.recordToImportJob(record);
    const next: PeopleImportJob = {
      ...existing,
      status: patch.status ?? existing.status,
      okCount: patch.okCount ?? existing.okCount,
      failedCount: patch.failedCount ?? existing.failedCount,
      rowCount: patch.rowCount ?? existing.rowCount,
      lastError: patch.lastError ?? existing.lastError,
      updatedAt: new Date().toISOString(),
    };
    await peopleUpdate(PEOPLE_IMPORT_JOBS_TABLE, record.id, {
      [IMPORT_JOB_FIELDS.status]: next.status,
      [IMPORT_JOB_FIELDS.okCount]: next.okCount,
      [IMPORT_JOB_FIELDS.failedCount]: next.failedCount,
      [IMPORT_JOB_FIELDS.rowCount]: next.rowCount,
      [IMPORT_JOB_FIELDS.lastError]: next.lastError || '',
      [IMPORT_JOB_FIELDS.updatedAt]: next.updatedAt,
    });
    return next;
  }

  async recordImportRowResult(input: ImportRowResultInput): Promise<PeopleImportRowResult> {
    const rowKey = importRowKey(input.importJobId, input.rowNumber);
    const createdAt = new Date().toISOString();
    await peopleUpsert(
      PEOPLE_IMPORT_ROW_RESULTS_TABLE,
      IMPORT_ROW_RESULT_FIELDS.rowKey,
      rowKey,
      {
        [IMPORT_ROW_RESULT_FIELDS.rowKey]: rowKey,
        [IMPORT_ROW_RESULT_FIELDS.organizationId]: input.organizationId,
        [IMPORT_ROW_RESULT_FIELDS.importJobId]: input.importJobId,
        [IMPORT_ROW_RESULT_FIELDS.rowNumber]: input.rowNumber,
        [IMPORT_ROW_RESULT_FIELDS.status]: input.status,
        [IMPORT_ROW_RESULT_FIELDS.personKey]: input.personId || '',
        [IMPORT_ROW_RESULT_FIELDS.error]: input.error || '',
        [IMPORT_ROW_RESULT_FIELDS.createdAt]: createdAt,
      },
    );
    return {
      id: rowKey,
      organizationId: input.organizationId,
      importJobId: input.importJobId,
      rowNumber: input.rowNumber,
      rowKey,
      status: input.status,
      personId: input.personId,
      error: input.error,
      createdAt,
    };
  }

  async listImportRowResults(importJobId: string): Promise<PeopleImportRowResult[]> {
    const records = await peopleQuery(
      PEOPLE_IMPORT_ROW_RESULTS_TABLE,
      eq(IMPORT_ROW_RESULT_FIELDS.importJobId, importJobId),
      1000,
    );
    return records
      .map((record) => ({
        id: text(record, IMPORT_ROW_RESULT_FIELDS.rowKey),
        organizationId: text(record, IMPORT_ROW_RESULT_FIELDS.organizationId),
        importJobId: text(record, IMPORT_ROW_RESULT_FIELDS.importJobId),
        rowNumber: num(record, IMPORT_ROW_RESULT_FIELDS.rowNumber),
        rowKey: text(record, IMPORT_ROW_RESULT_FIELDS.rowKey),
        status: (text(record, IMPORT_ROW_RESULT_FIELDS.status) ||
          'failed') as PeopleImportRowResult['status'],
        personId: optionalText(record, IMPORT_ROW_RESULT_FIELDS.personKey),
        error: optionalText(record, IMPORT_ROW_RESULT_FIELDS.error),
        createdAt: text(record, IMPORT_ROW_RESULT_FIELDS.createdAt),
      }))
      .sort((a, b) => a.rowNumber - b.rowNumber);
  }

  // --- Migration checkpoints ----------------------------------------------

  async saveMigrationCheckpoint(
    input: MigrationCheckpointInput,
  ): Promise<PeopleMigrationCheckpoint> {
    const key = migrationCheckpointKey(input.organizationId, input.jobId);
    const updatedAt = new Date().toISOString();
    await peopleUpsert(
      PEOPLE_MIGRATION_CHECKPOINTS_TABLE,
      MIGRATION_CHECKPOINT_FIELDS.checkpointKey,
      key,
      {
        [MIGRATION_CHECKPOINT_FIELDS.checkpointKey]: key,
        [MIGRATION_CHECKPOINT_FIELDS.organizationId]: input.organizationId,
        [MIGRATION_CHECKPOINT_FIELDS.jobId]: input.jobId,
        [MIGRATION_CHECKPOINT_FIELDS.lastClientRecordId]: input.lastClientRecordId || '',
        [MIGRATION_CHECKPOINT_FIELDS.processed]: input.processed,
        [MIGRATION_CHECKPOINT_FIELDS.created]: input.created,
        [MIGRATION_CHECKPOINT_FIELDS.linked]: input.linked,
        [MIGRATION_CHECKPOINT_FIELDS.status]: input.status,
        [MIGRATION_CHECKPOINT_FIELDS.updatedAt]: updatedAt,
      },
    );
    return {
      id: key,
      organizationId: input.organizationId,
      jobId: input.jobId,
      checkpointKey: key,
      lastClientRecordId: input.lastClientRecordId,
      processed: input.processed,
      created: input.created,
      linked: input.linked,
      status: input.status,
      updatedAt,
    };
  }

  async getMigrationCheckpoint(
    organizationId: string,
    jobId: string,
  ): Promise<PeopleMigrationCheckpoint | null> {
    const key = migrationCheckpointKey(organizationId, jobId);
    const record = await peopleQueryOne(
      PEOPLE_MIGRATION_CHECKPOINTS_TABLE,
      eq(MIGRATION_CHECKPOINT_FIELDS.checkpointKey, key),
    );
    if (!record) return null;
    return {
      id: key,
      organizationId: text(record, MIGRATION_CHECKPOINT_FIELDS.organizationId),
      jobId: text(record, MIGRATION_CHECKPOINT_FIELDS.jobId),
      checkpointKey: key,
      lastClientRecordId: optionalText(record, MIGRATION_CHECKPOINT_FIELDS.lastClientRecordId),
      processed: num(record, MIGRATION_CHECKPOINT_FIELDS.processed),
      created: num(record, MIGRATION_CHECKPOINT_FIELDS.created),
      linked: num(record, MIGRATION_CHECKPOINT_FIELDS.linked),
      status: (text(record, MIGRATION_CHECKPOINT_FIELDS.status) ||
        'running') as PeopleMigrationCheckpoint['status'],
      updatedAt: text(record, MIGRATION_CHECKPOINT_FIELDS.updatedAt),
    };
  }
}

let instance: AirtablePeopleRepository | null = null;

export function airtablePeopleRepository(): PeopleRepository {
  if (!instance) instance = new AirtablePeopleRepository();
  return instance;
}

export { PeoplePersistError };
