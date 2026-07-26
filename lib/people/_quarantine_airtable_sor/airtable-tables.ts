/**
 * Airtable schema contract for People (blueprint §3.1 / §6.2).
 *
 * Table names are overridable per environment so a dedicated cert base can be used
 * without production pollution. Field names are the schema contract that
 * `scripts/verify-people-airtable-schema.mts` and
 * `docs/plans/EA-PEOPLE-AIRTABLE-SCHEMA-2B.md` enforce.
 */

function table(envName: string, fallback: string): string {
  return process.env[envName]?.trim() || fallback;
}

export const PEOPLE_TABLE = table('AIRTABLE_PEOPLE_TABLE', 'People');
export const PEOPLE_ORG_MEMBERSHIPS_TABLE = table(
  'AIRTABLE_PEOPLE_ORG_MEMBERSHIPS_TABLE',
  'People Org Memberships',
);
export const PEOPLE_HOUSEHOLDS_TABLE = table(
  'AIRTABLE_PEOPLE_HOUSEHOLDS_TABLE',
  'People Households',
);
export const PEOPLE_HOUSEHOLD_MEMBERS_TABLE = table(
  'AIRTABLE_PEOPLE_HOUSEHOLD_MEMBERS_TABLE',
  'People Household Members',
);
export const PEOPLE_RELATIONSHIPS_TABLE = table(
  'AIRTABLE_PEOPLE_RELATIONSHIPS_TABLE',
  'People Relationships',
);
export const PEOPLE_PROGRAM_LINKS_TABLE = table(
  'AIRTABLE_PEOPLE_PROGRAM_LINKS_TABLE',
  'People Program Links',
);
export const PEOPLE_CONSENTS_TABLE = table('AIRTABLE_PEOPLE_CONSENTS_TABLE', 'People Consents');
export const PEOPLE_ACL_GRANTS_TABLE = table(
  'AIRTABLE_PEOPLE_ACL_GRANTS_TABLE',
  'People ACL Grants',
);
export const PEOPLE_AUDIT_TABLE = table('AIRTABLE_PEOPLE_AUDIT_TABLE', 'People Audit');
export const PEOPLE_MERGE_JOBS_TABLE = table(
  'AIRTABLE_PEOPLE_MERGE_JOBS_TABLE',
  'People Merge Jobs',
);
export const PEOPLE_IMPORT_JOBS_TABLE = table(
  'AIRTABLE_PEOPLE_IMPORT_JOBS_TABLE',
  'People Import Jobs',
);
export const PEOPLE_IMPORT_ROW_RESULTS_TABLE = table(
  'AIRTABLE_PEOPLE_IMPORT_ROW_RESULTS_TABLE',
  'People Import Row Results',
);
export const PEOPLE_MIGRATION_CHECKPOINTS_TABLE = table(
  'AIRTABLE_PEOPLE_MIGRATION_CHECKPOINTS_TABLE',
  'People Migration Checkpoints',
);

export const PEOPLE_TABLES: readonly string[] = [
  PEOPLE_TABLE,
  PEOPLE_ORG_MEMBERSHIPS_TABLE,
  PEOPLE_HOUSEHOLDS_TABLE,
  PEOPLE_HOUSEHOLD_MEMBERS_TABLE,
  PEOPLE_RELATIONSHIPS_TABLE,
  PEOPLE_PROGRAM_LINKS_TABLE,
  PEOPLE_CONSENTS_TABLE,
  PEOPLE_ACL_GRANTS_TABLE,
  PEOPLE_AUDIT_TABLE,
  PEOPLE_MERGE_JOBS_TABLE,
  PEOPLE_IMPORT_JOBS_TABLE,
  PEOPLE_IMPORT_ROW_RESULTS_TABLE,
  PEOPLE_MIGRATION_CHECKPOINTS_TABLE,
] as const;

/** `People` — directory root. `Person Key` is the stable domain id (§3.2). */
export const PERSON_FIELDS = {
  personKey: 'Person Key',
  organizationId: 'Organization Id',
  portalSlug: 'Portal Slug',
  displayName: 'Display Name',
  legalName: 'Legal Name',
  preferredName: 'Preferred Name',
  primaryEmail: 'Primary Email',
  /**
   * Application identity key for the primary email lookup path.
   * Airtable does NOT enforce UNIQUE on ordinary text fields — ADV-P-1 proves races.
   */
  orgEmailKey: 'OrgEmailKey',
  /** Newline-joined additional OrgEmailKeys (P1-8: all emails participate). */
  orgEmailKeys: 'OrgEmailKeys',
  emailsJson: 'Emails JSON',
  phonesJson: 'Phones JSON',
  dateOfBirth: 'Date Of Birth',
  isMinor: 'Is Minor',
  externalIdsJson: 'External Ids JSON',
  clientRecordId: 'Client Record Id',
  /** Application identity key `org#system#value` — not an Airtable-native UNIQUE. */
  orgExternalKey: 'OrgExternalKey',
  orgExternalKeys: 'OrgExternalKeys',
  lifecycleStatus: 'Lifecycle Status',
  deceasedAt: 'Deceased At',
  mergedIntoPersonKey: 'Merged Into Person Key',
  duplicateOfPersonKey: 'Duplicate Of Person Key',
  createdByUserEmail: 'Created By User Email',
  ownerUserEmail: 'Owner User Email',
  source: 'Source',
  mergeJobId: 'Merge Job Id',
  /** OCC token (INV-23) — application-managed, not Airtable's own timestamp. */
  updatedAt: 'Updated At',
  createdAt: 'Created At',
  payloadJson: 'Payload JSON',
} as const;

export const DIRECTORY_MEMBERSHIP_FIELDS = {
  membershipKey: 'Membership Key',
  organizationId: 'Organization Id',
  personKey: 'Person Key',
  rolesJson: 'Roles JSON',
  status: 'Status',
  title: 'Title',
  portalMembershipId: 'Portal Membership Id',
  clientRecordId: 'Client Record Id',
  startedAt: 'Started At',
  endedAt: 'Ended At',
} as const;

export const HOUSEHOLD_FIELDS = {
  householdKey: 'Household Key',
  organizationId: 'Organization Id',
  displayName: 'Display Name',
  status: 'Status',
  primaryContactPersonKey: 'Primary Contact Person Key',
} as const;

export const HOUSEHOLD_MEMBER_FIELDS = {
  memberKey: 'Member Key',
  organizationId: 'Organization Id',
  householdKey: 'Household Key',
  personKey: 'Person Key',
  role: 'Role',
  isAuthorizedRepresentative: 'Is Authorized Representative',
  authzExpiresAt: 'Authz Expires At',
} as const;

export const RELATIONSHIP_FIELDS = {
  edgeKey: 'Edge Key',
  organizationId: 'Organization Id',
  fromPersonKey: 'From Person Key',
  toPersonKey: 'To Person Key',
  type: 'Type',
  status: 'Status',
  expiresAt: 'Expires At',
  bidirectionalMirrorId: 'Bidirectional Mirror Id',
  notes: 'Notes',
} as const;

export const PROGRAM_LINK_FIELDS = {
  linkKey: 'Link Key',
  organizationId: 'Organization Id',
  personKey: 'Person Key',
  kind: 'Kind',
  externalRef: 'External Ref',
  label: 'Label',
  status: 'Status',
  roleInProgram: 'Role In Program',
} as const;

export const CONSENT_FIELDS = {
  consentKey: 'Consent Key',
  organizationId: 'Organization Id',
  personKey: 'Person Key',
  purpose: 'Purpose',
  status: 'Status',
  capturedAt: 'Captured At',
  expiresAt: 'Expires At',
  source: 'Source',
  actorPersonKey: 'Actor Person Key',
} as const;

export const ACL_GRANT_FIELDS = {
  grantKey: 'Grant Key',
  organizationId: 'Organization Id',
  resourceType: 'Resource Type',
  resourceId: 'Resource Id',
  granteeKind: 'Grantee Kind',
  granteeValue: 'Grantee Value',
  relation: 'Relation',
  fieldsAllowJson: 'Fields Allow JSON',
  fieldsDenyJson: 'Fields Deny JSON',
  expiresAt: 'Expires At',
} as const;

export const AUDIT_FIELDS = {
  auditKey: 'Audit Key',
  organizationId: 'Organization Id',
  actorEmail: 'Actor Email',
  actorPersonKey: 'Actor Person Key',
  action: 'Action',
  subjectPersonKey: 'Subject Person Key',
  at: 'At',
  metaJson: 'Meta JSON',
} as const;

export const MERGE_JOB_FIELDS = {
  jobId: 'Job Id',
  jobKey: 'Job Key',
  organizationId: 'Organization Id',
  survivorPersonKey: 'Survivor Person Key',
  absorbedPersonKey: 'Absorbed Person Key',
  status: 'Status',
  completedStepsJson: 'Completed Steps JSON',
  attempts: 'Attempts',
  actorEmail: 'Actor Email',
  lastError: 'Last Error',
  metaJson: 'Meta JSON',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
} as const;

export const IMPORT_JOB_FIELDS = {
  jobId: 'Job Id',
  organizationId: 'Organization Id',
  idempotencyKey: 'Idempotency Key',
  source: 'Source',
  status: 'Status',
  rowCount: 'Row Count',
  okCount: 'Ok Count',
  failedCount: 'Failed Count',
  actorEmail: 'Actor Email',
  dryRun: 'Dry Run',
  lastError: 'Last Error',
  metaJson: 'Meta JSON',
  createdAt: 'Created At',
  updatedAt: 'Updated At',
} as const;

export const IMPORT_ROW_RESULT_FIELDS = {
  rowKey: 'Row Key',
  organizationId: 'Organization Id',
  importJobId: 'Import Job Id',
  rowNumber: 'Row Number',
  status: 'Status',
  personKey: 'Person Key',
  error: 'Error',
  createdAt: 'Created At',
} as const;

export const MIGRATION_CHECKPOINT_FIELDS = {
  checkpointKey: 'Checkpoint Key',
  organizationId: 'Organization Id',
  jobId: 'Job Id',
  lastClientRecordId: 'Last Client Record Id',
  processed: 'Processed',
  created: 'Created',
  linked: 'Linked',
  status: 'Status',
  updatedAt: 'Updated At',
} as const;

/** Fields the schema verifier requires (unique keys first). */
export const PEOPLE_REQUIRED_FIELDS: Readonly<Record<string, readonly string[]>> = {
  [PEOPLE_TABLE]: [
    PERSON_FIELDS.personKey,
    PERSON_FIELDS.organizationId,
    PERSON_FIELDS.orgEmailKey,
    PERSON_FIELDS.orgExternalKey,
    PERSON_FIELDS.lifecycleStatus,
    PERSON_FIELDS.updatedAt,
  ],
  [PEOPLE_ORG_MEMBERSHIPS_TABLE]: [
    DIRECTORY_MEMBERSHIP_FIELDS.membershipKey,
    DIRECTORY_MEMBERSHIP_FIELDS.organizationId,
    DIRECTORY_MEMBERSHIP_FIELDS.personKey,
  ],
  [PEOPLE_HOUSEHOLDS_TABLE]: [
    HOUSEHOLD_FIELDS.householdKey,
    HOUSEHOLD_FIELDS.organizationId,
  ],
  [PEOPLE_HOUSEHOLD_MEMBERS_TABLE]: [
    HOUSEHOLD_MEMBER_FIELDS.memberKey,
    HOUSEHOLD_MEMBER_FIELDS.householdKey,
    HOUSEHOLD_MEMBER_FIELDS.personKey,
  ],
  [PEOPLE_RELATIONSHIPS_TABLE]: [
    RELATIONSHIP_FIELDS.edgeKey,
    RELATIONSHIP_FIELDS.organizationId,
    RELATIONSHIP_FIELDS.status,
  ],
  [PEOPLE_PROGRAM_LINKS_TABLE]: [
    PROGRAM_LINK_FIELDS.linkKey,
    PROGRAM_LINK_FIELDS.organizationId,
    PROGRAM_LINK_FIELDS.personKey,
  ],
  [PEOPLE_CONSENTS_TABLE]: [
    CONSENT_FIELDS.consentKey,
    CONSENT_FIELDS.organizationId,
    CONSENT_FIELDS.personKey,
  ],
  [PEOPLE_ACL_GRANTS_TABLE]: [
    ACL_GRANT_FIELDS.grantKey,
    ACL_GRANT_FIELDS.organizationId,
    ACL_GRANT_FIELDS.resourceId,
  ],
  [PEOPLE_AUDIT_TABLE]: [
    AUDIT_FIELDS.auditKey,
    AUDIT_FIELDS.organizationId,
    AUDIT_FIELDS.action,
  ],
  [PEOPLE_MERGE_JOBS_TABLE]: [
    MERGE_JOB_FIELDS.jobId,
    MERGE_JOB_FIELDS.jobKey,
    MERGE_JOB_FIELDS.status,
  ],
  [PEOPLE_IMPORT_JOBS_TABLE]: [
    IMPORT_JOB_FIELDS.jobId,
    IMPORT_JOB_FIELDS.idempotencyKey,
    IMPORT_JOB_FIELDS.status,
  ],
  [PEOPLE_IMPORT_ROW_RESULTS_TABLE]: [
    IMPORT_ROW_RESULT_FIELDS.rowKey,
    IMPORT_ROW_RESULT_FIELDS.importJobId,
    IMPORT_ROW_RESULT_FIELDS.status,
  ],
  [PEOPLE_MIGRATION_CHECKPOINTS_TABLE]: [
    MIGRATION_CHECKPOINT_FIELDS.checkpointKey,
    MIGRATION_CHECKPOINT_FIELDS.jobId,
    MIGRATION_CHECKPOINT_FIELDS.status,
  ],
};

/**
 * Application-level identity / idempotency key fields.
 * These are NOT Airtable-native UNIQUE constraints (Airtable cannot enforce UNIQUE
 * on ordinary text fields). Durability under concurrency is proven by ADV-P-1.
 */
export const PEOPLE_UNIQUE_FIELDS: Readonly<Record<string, readonly string[]>> = {
  [PEOPLE_TABLE]: [PERSON_FIELDS.personKey, PERSON_FIELDS.orgEmailKey, PERSON_FIELDS.orgExternalKey],
  [PEOPLE_ORG_MEMBERSHIPS_TABLE]: [DIRECTORY_MEMBERSHIP_FIELDS.membershipKey],
  [PEOPLE_HOUSEHOLD_MEMBERS_TABLE]: [HOUSEHOLD_MEMBER_FIELDS.memberKey],
  [PEOPLE_RELATIONSHIPS_TABLE]: [RELATIONSHIP_FIELDS.edgeKey],
  [PEOPLE_PROGRAM_LINKS_TABLE]: [PROGRAM_LINK_FIELDS.linkKey],
  [PEOPLE_CONSENTS_TABLE]: [CONSENT_FIELDS.consentKey],
  [PEOPLE_ACL_GRANTS_TABLE]: [ACL_GRANT_FIELDS.grantKey],
  [PEOPLE_MERGE_JOBS_TABLE]: [MERGE_JOB_FIELDS.jobKey],
  [PEOPLE_IMPORT_JOBS_TABLE]: [IMPORT_JOB_FIELDS.idempotencyKey],
  [PEOPLE_IMPORT_ROW_RESULTS_TABLE]: [IMPORT_ROW_RESULT_FIELDS.rowKey],
  [PEOPLE_MIGRATION_CHECKPOINTS_TABLE]: [MIGRATION_CHECKPOINT_FIELDS.checkpointKey],
};
