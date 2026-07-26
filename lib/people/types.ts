/**
 * Phase 2A People & Relationships — canonical types.
 * @see docs/plans/EA-UNIVERSAL-PORTAL-PHASE-2A-PEOPLE-BLUEPRINT.md
 */

export type PersonId = string;

export type PersonLifecycleStatus = 'active' | 'inactive' | 'archived' | 'deceased';

export type PersonEmail = {
  value: string;
  kind: 'primary' | 'work' | 'personal' | 'other';
  verified?: boolean;
};

export type PersonPhone = {
  value: string;
  kind: 'mobile' | 'work' | 'home' | 'other';
};

export type PersonExternalId = {
  system:
    | 'client-record'
    | 'membership-email'
    | 'connect-relationship'
    | 'stripe-customer'
    | 'other';
  value: string;
};

export type Person = {
  id: PersonId;
  /** IMMUTABLE after create (INV-2). */
  organizationId: string;
  portalSlug?: string;
  displayName: string;
  legalName?: string;
  preferredName?: string;
  emails: PersonEmail[];
  phones: PersonPhone[];
  dateOfBirth?: string;
  isMinor?: boolean;
  externalIds?: PersonExternalId[];
  lifecycleStatus: PersonLifecycleStatus;
  deceasedAt?: string;
  mergedIntoPersonId?: PersonId;
  duplicateOfPersonId?: PersonId;
  createdByUserEmail?: string;
  ownerUserEmail?: string;
  source:
    | 'manual'
    | 'client-record-migration'
    | 'membership-bootstrap'
    | 'connect-link'
    | 'import'
    | 'provisioning';
  createdAt: string;
  updatedAt: string;
};

export type UniversalPersonRoleCode =
  | 'client'
  | 'member'
  | 'employee'
  | 'volunteer'
  | 'student'
  | 'parent_guardian'
  | 'donor'
  | 'participant'
  | 'provider'
  | 'advisor'
  | 'org_leader'
  | 'authorized_representative'
  | 'staff_contact'
  | 'other';

export const UNIVERSAL_PERSON_ROLE_CODES: readonly UniversalPersonRoleCode[] = [
  'client',
  'member',
  'employee',
  'volunteer',
  'student',
  'parent_guardian',
  'donor',
  'participant',
  'provider',
  'advisor',
  'org_leader',
  'authorized_representative',
  'staff_contact',
  'other',
] as const;

export type PersonDirectoryMembership = {
  id: string;
  organizationId: string;
  personId: PersonId;
  roles: UniversalPersonRoleCode[];
  status: 'active' | 'inactive' | 'invited' | 'ended';
  title?: string;
  portalMembershipId?: string;
  clientRecordId?: string;
  startedAt?: string;
  endedAt?: string;
};

export type Household = {
  id: string;
  organizationId: string;
  displayName: string;
  status: 'active' | 'archived';
  primaryContactPersonId?: PersonId;
};

export type HouseholdMemberRole =
  | 'head'
  | 'spouse_partner'
  | 'child'
  | 'dependent'
  | 'guardian'
  | 'other';

export type HouseholdMember = {
  id: string;
  organizationId: string;
  householdId: string;
  personId: PersonId;
  role: HouseholdMemberRole;
  isAuthorizedRepresentative?: boolean;
  authzExpiresAt?: string;
};

export type PersonRelationshipType =
  | 'guardian_of'
  | 'child_of'
  | 'spouse_partner_of'
  | 'authorized_rep_for'
  | 'emergency_contact_for'
  | 'referred_by'
  | 'reports_to'
  | 'advisor_for'
  | 'provider_for'
  | 'other';

export type PersonRelationship = {
  id: string;
  organizationId: string;
  fromPersonId: PersonId;
  toPersonId: PersonId;
  type: PersonRelationshipType;
  status: 'active' | 'ended';
  expiresAt?: string;
  bidirectionalMirrorId?: string;
  notes?: string;
};

export type PersonProgramLinkKind =
  | 'ctp_opportunity'
  | 'ctp_workspace'
  | 'simplifi_opportunity'
  | 'connect_engagement'
  | 'event_registration'
  | 'member_program'
  | 'service_case'
  | 'other';

export type PersonProgramLink = {
  id: string;
  organizationId: string;
  personId: PersonId;
  kind: PersonProgramLinkKind;
  externalRef: string;
  label?: string;
  status: 'active' | 'completed' | 'withdrawn' | 'archived';
  roleInProgram?: string;
};

export type ConsentPurpose =
  | 'portal_access'
  | 'email_transactional'
  | 'email_marketing'
  | 'sms'
  | 'directory_visible_to_members'
  | 'directory_visible_to_staff'
  | 'share_with_guardian'
  | 'data_processing';

export type PersonConsent = {
  id: string;
  organizationId: string;
  personId: PersonId;
  purpose: ConsentPurpose;
  status: 'granted' | 'denied' | 'withdrawn' | 'expired';
  capturedAt: string;
  expiresAt?: string;
  source: 'registration' | 'import' | 'staff' | 'guardian_proxy' | 'legacy-client-record';
  actorPersonId?: PersonId;
};

export type AclResourceType = 'person' | 'household' | 'people_export_job';

export type AclRelation =
  | 'org_admin'
  | 'owner'
  | 'viewer'
  | 'editor'
  | 'guardian'
  | 'self';

export type PersonAclGrant = {
  id: string;
  organizationId: string;
  resourceType: AclResourceType;
  resourceId: string;
  grantee:
    | { kind: 'user_email'; email: string }
    | { kind: 'person'; personId: PersonId }
    | { kind: 'platform_role'; role: import('@/lib/rbac').PlatformRole };
  relation: AclRelation;
  fieldsAllow?: string[];
  fieldsDeny?: string[];
  expiresAt?: string;
};

export type PeopleAuditAction =
  | 'people.create'
  | 'people.update'
  | 'people.status_change'
  | 'people.merge'
  | 'people.export'
  | 'people.import'
  | 'people.acl_grant'
  | 'people.consent_change'
  | 'people.relationship_change'
  | 'people.view_sensitive';

export type PeopleAuditEvent = {
  id: string;
  organizationId: string;
  actorEmail: string;
  actorPersonId?: PersonId;
  action: PeopleAuditAction;
  subjectPersonId?: PersonId;
  at: string;
  meta?: Record<string, string | number | boolean | null>;
};

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isUniversalPersonRoleCode(value: string): value is UniversalPersonRoleCode {
  return (UNIVERSAL_PERSON_ROLE_CODES as readonly string[]).includes(value);
}
