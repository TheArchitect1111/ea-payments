/**
 * PostgresPeopleRepository — Phase 2C durable SoR via PostgREST + SECURITY DEFINER RPCs.
 * Airtable People SoR is quarantined and must not be used here (INV-33).
 */
import { randomUUID } from 'node:crypto';
import { peopleConflict, peopleUnavailable, peopleValidation } from '@/lib/people/errors';
import { assertPeoplePostgresReady, peopleRest, peopleRpc } from '@/lib/people/postgres-client';
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
  Household,
  HouseholdMember,
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
import type {
  PeopleImportJob,
  PeopleImportRowResult,
  PeopleMergeJob,
  PeopleMigrationCheckpoint,
} from '@/lib/people/job-types';

function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

function rowToPerson(row: Record<string, unknown>): Person {
  return {
    id: String(row.person_key),
    organizationId: String(row.organization_id),
    portalSlug: row.portal_slug ? String(row.portal_slug) : undefined,
    displayName: String(row.display_name || ''),
    legalName: row.legal_name ? String(row.legal_name) : undefined,
    preferredName: row.preferred_name ? String(row.preferred_name) : undefined,
    emails: (row.emails as Person['emails']) || [],
    phones: (row.phones as Person['phones']) || [],
    dateOfBirth: row.date_of_birth ? String(row.date_of_birth) : undefined,
    isMinor: typeof row.is_minor === 'boolean' ? row.is_minor : undefined,
    externalIds: (row.external_ids as Person['externalIds']) || [],
    lifecycleStatus: row.lifecycle_status as Person['lifecycleStatus'],
    deceasedAt: row.deceased_at ? String(row.deceased_at) : undefined,
    mergedIntoPersonId: row.merged_into_person_key
      ? String(row.merged_into_person_key)
      : undefined,
    duplicateOfPersonId: row.duplicate_of_person_key
      ? String(row.duplicate_of_person_key)
      : undefined,
    source: (row.source as Person['source']) || 'manual',
    createdByUserEmail: row.created_by_user_email
      ? String(row.created_by_user_email)
      : undefined,
    ownerUserEmail: row.owner_user_email ? String(row.owner_user_email) : undefined,
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

class PostgresPeopleRepository implements PeopleRepository {
  readonly kind = 'postgres' as const;

  private async must<T>(
    result: { ok: true; data: T } | { ok: false; error: string; status?: number },
  ): Promise<T> {
    if (!result.ok) {
      if (result.status === 409) throw peopleConflict(result.error);
      throw peopleUnavailable(result.error, {
        status: result.status ?? null,
      });
    }
    return result.data;
  }

  async createPerson(input: PersonCreateInput): Promise<Person> {
    const upsert = await this.upsertPersonByIdentity(input, {});
    if (!upsert.created) throw peopleConflict('Person identity already exists');
    return upsert.person;
  }

  async upsertPersonByIdentity(
    input: PersonCreateInput,
    identity: { emailKey?: string; externalKey?: string },
  ): Promise<PersonUpsertResult> {
    assertPeoplePostgresReady();
    const email =
      identity.emailKey?.split('#').pop() ||
      normalizeEmail(input.emails?.[0]?.value || '');
    const clientRecordId =
      input.externalIds?.find((e) => e.system === 'client-record')?.value || null;
    if (!email && !clientRecordId) {
      throw peopleValidation('identity key required for upsert');
    }
    const personKey = input.id || newId('person');
    const result = await peopleRpc<{
      created: boolean;
      person_key: string;
      person: Record<string, unknown>;
    }>('ensure_person', {
      p_organization_id: input.organizationId,
      p_person_key: personKey,
      p_display_name: input.displayName,
      p_email: email || '',
      p_portal_slug: input.portalSlug || null,
      p_client_record_id: clientRecordId,
      p_source: input.source || 'manual',
    });
    const data = await this.must(result);
    // PostgREST may wrap scalar jsonb
    const payload = (Array.isArray(data) ? data[0] : data) as {
      created: boolean;
      person: Record<string, unknown>;
    };
    return { person: rowToPerson(payload.person), created: Boolean(payload.created) };
  }

  async updatePerson(
    personId: PersonId,
    patch: PersonUpdatePatch,
    options: PersonUpdateOptions = {},
  ): Promise<Person> {
    if (patch && 'organizationId' in (patch as object)) {
      throw peopleValidation('organizationId is immutable');
    }
    const existing = await this.getPerson(personId);
    if (!existing) throw peopleValidation('Person not found');
    if (!options.expectedUpdatedAt) {
      throw peopleValidation('expectedUpdatedAt required for Postgres OCC updates');
    }
    if (options.expectedUpdatedAt !== existing.updatedAt) {
      throw peopleConflict('Person changed since read', { personId });
    }
    const rpcPatch: Record<string, unknown> = {};
    if (patch.displayName !== undefined) rpcPatch.display_name = patch.displayName;
    if (patch.emails !== undefined) {
      rpcPatch.emails = patch.emails;
      rpcPatch.primary_email = normalizeEmail(patch.emails[0]?.value || '') || null;
    }
    if (patch.phones !== undefined) rpcPatch.phones = patch.phones;
    if (patch.lifecycleStatus !== undefined) rpcPatch.lifecycle_status = patch.lifecycleStatus;
    if (patch.dateOfBirth !== undefined) rpcPatch.date_of_birth = patch.dateOfBirth;

    const result = await peopleRpc<Record<string, unknown>>('update_person', {
      p_organization_id: existing.organizationId,
      p_person_key: personId,
      p_expected_updated_at: options.expectedUpdatedAt,
      p_patch: rpcPatch,
    });
    if (!result.ok) {
      if (/conflict/i.test(result.error) || result.status === 409) {
        throw peopleConflict('Person changed since read', { personId });
      }
      throw peopleUnavailable(result.error, { status: result.status ?? null });
    }
    const row = (Array.isArray(result.data) ? result.data[0] : result.data) as Record<
      string,
      unknown
    >;
    return rowToPerson(row);
  }

  async getPerson(personId: PersonId): Promise<Person | null> {
    const result = await peopleRpc<Record<string, unknown> | null>('get_person', {
      p_person_key: personId,
    });
    if (!result.ok) throw peopleUnavailable(result.error, { status: result.status ?? null });
    const row = (Array.isArray(result.data) ? result.data[0] : result.data) as Record<
      string,
      unknown
    > | null;
    if (!row || !row.person_key) return null;
    return rowToPerson(row);
  }

  async listPersonsByOrg(organizationId: string): Promise<Person[]> {
    const res = await peopleRest<Record<string, unknown>[]>(
      `persons?organization_id=eq.${encodeURIComponent(organizationId)}&select=*`,
      { organizationId },
    );
    const rows = await this.must(res);
    return (rows || []).map(rowToPerson);
  }

  async findPersonByExternalId(
    organizationId: string,
    system: string,
    value: string,
  ): Promise<Person | null> {
    const res = await peopleRest<Array<{ person_key: string }>>(
      `person_external_keys?organization_id=eq.${encodeURIComponent(organizationId)}&system=eq.${encodeURIComponent(system)}&value=eq.${encodeURIComponent(value)}&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error, { status: res.status ?? null });
    const key = res.data?.[0]?.person_key;
    return key ? this.getPerson(key) : null;
  }

  async findPersonByEmail(organizationId: string, email: string): Promise<Person | null> {
    const normalized = normalizeEmail(email);
    if (!normalized) return null;
    const res = await peopleRest<Array<{ person_key: string }>>(
      `person_email_keys?organization_id=eq.${encodeURIComponent(organizationId)}&email_normalized=eq.${encodeURIComponent(normalized)}&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error, { status: res.status ?? null });
    const key = res.data?.[0]?.person_key;
    return key ? this.getPerson(key) : null;
  }

  // --- Remaining methods: thin REST wrappers (same org scoping) -------------

  async upsertDirectoryMembership(
    input: Omit<PersonDirectoryMembership, 'id'> & { id?: string },
  ): Promise<PersonDirectoryMembership> {
    const id = input.id || newId('pmem');
    const row = {
      membership_key: id,
      organization_id: input.organizationId,
      person_key: input.personId,
      roles: input.roles,
      status: input.status,
      title: input.title || null,
      portal_membership_id: input.portalMembershipId || null,
      client_record_id: input.clientRecordId || null,
      started_at: input.startedAt || null,
      ended_at: input.endedAt || null,
    };
    const res = await peopleRest<Record<string, unknown>[]>('org_memberships', {
      method: 'POST',
      prefer: 'resolution=merge-duplicates,return=representation',
      body: JSON.stringify(row),
      organizationId: input.organizationId,
    });
    await this.must(res);
    return { ...input, id };
  }

  async getDirectoryMembership(organizationId: string, personId: PersonId) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `org_memberships?organization_id=eq.${encodeURIComponent(organizationId)}&person_key=eq.${encodeURIComponent(personId)}&status=neq.ended&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return {
      id: String(r.membership_key),
      organizationId,
      personId,
      roles: (r.roles as PersonDirectoryMembership['roles']) || [],
      status: r.status as PersonDirectoryMembership['status'],
      title: r.title ? String(r.title) : undefined,
      portalMembershipId: r.portal_membership_id
        ? String(r.portal_membership_id)
        : undefined,
      clientRecordId: r.client_record_id ? String(r.client_record_id) : undefined,
      startedAt: r.started_at ? String(r.started_at) : undefined,
      endedAt: r.ended_at ? String(r.ended_at) : undefined,
    };
  }

  async listDirectoryMembershipsForPerson(personId: PersonId) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `org_memberships?person_key=eq.${encodeURIComponent(personId)}`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.membership_key),
      organizationId: String(r.organization_id),
      personId,
      roles: (r.roles as PersonDirectoryMembership['roles']) || [],
      status: r.status as PersonDirectoryMembership['status'],
    }));
  }

  async createHousehold(input: Omit<Household, 'id'> & { id?: string }): Promise<Household> {
    const id = input.id || newId('hh');
    await this.must(
      await peopleRest('households', {
        method: 'POST',
        body: JSON.stringify({
          household_key: id,
          organization_id: input.organizationId,
          display_name: input.displayName || null,
          status: input.status,
          primary_contact_person_key: input.primaryContactPersonId || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return { ...input, id };
  }

  async upsertHouseholdMember(
    input: Omit<HouseholdMember, 'id'> & { id?: string },
  ): Promise<HouseholdMember> {
    const id = input.id || newId('hhm');
    await this.must(
      await peopleRest('household_members', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          member_key: id,
          organization_id: input.organizationId,
          household_key: input.householdId,
          person_key: input.personId,
          role: input.role,
          is_authorized_representative: Boolean(input.isAuthorizedRepresentative),
          authz_expires_at: input.authzExpiresAt || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return { ...input, id };
  }

  async listHouseholdMembers(householdId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `household_members?household_key=eq.${encodeURIComponent(householdId)}`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.member_key),
      organizationId: String(r.organization_id),
      householdId,
      personId: String(r.person_key) as PersonId,
      role: r.role as HouseholdMember['role'],
      isAuthorizedRepresentative: Boolean(r.is_authorized_representative),
      authzExpiresAt: r.authz_expires_at ? String(r.authz_expires_at) : undefined,
    }));
  }

  async listHouseholdMembersForPerson(personId: PersonId) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `household_members?person_key=eq.${encodeURIComponent(personId)}`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.member_key),
      organizationId: String(r.organization_id),
      householdId: String(r.household_key),
      personId,
      role: r.role as HouseholdMember['role'],
      isAuthorizedRepresentative: Boolean(r.is_authorized_representative),
      authzExpiresAt: r.authz_expires_at ? String(r.authz_expires_at) : undefined,
    }));
  }

  async upsertRelationship(
    input: Omit<PersonRelationship, 'id'> & { id?: string },
  ): Promise<PersonRelationship> {
    const id = input.id || newId('rel');
    const result = await peopleRpc<Record<string, unknown>>('upsert_relationship', {
      p_organization_id: input.organizationId,
      p_edge_key: id,
      p_from_person_key: input.fromPersonId,
      p_to_person_key: input.toPersonId,
      p_type: input.type,
      p_status: input.status,
      p_expires_at: input.expiresAt || null,
      p_notes: input.notes || null,
    });
    const row = await this.must(result);
    const payload = (Array.isArray(row) ? row[0] : row) as Record<string, unknown>;
    return {
      id: String(payload.edge_key || id),
      organizationId: input.organizationId,
      fromPersonId: String(payload.from_person_key || input.fromPersonId) as PersonId,
      toPersonId: String(payload.to_person_key || input.toPersonId) as PersonId,
      type: (payload.type as PersonRelationship['type']) || input.type,
      status: (payload.status as PersonRelationship['status']) || input.status,
      expiresAt: payload.expires_at ? String(payload.expires_at) : input.expiresAt,
      notes: payload.notes ? String(payload.notes) : input.notes,
    };
  }

  async listRelationshipsForOrg(organizationId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `relationships?organization_id=eq.${encodeURIComponent(organizationId)}`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.edge_key),
      organizationId,
      fromPersonId: String(r.from_person_key) as PersonId,
      toPersonId: String(r.to_person_key) as PersonId,
      type: r.type as PersonRelationship['type'],
      status: r.status as PersonRelationship['status'],
      expiresAt: r.expires_at ? String(r.expires_at) : undefined,
      notes: r.notes ? String(r.notes) : undefined,
    }));
  }

  async upsertProgramLink(
    input: Omit<PersonProgramLink, 'id'> & { id?: string },
  ): Promise<PersonProgramLink> {
    const id = input.id || newId('plink');
    await this.must(
      await peopleRest('program_links', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          link_key: id,
          organization_id: input.organizationId,
          person_key: input.personId,
          kind: input.kind,
          external_ref: input.externalRef || null,
          label: input.label || null,
          status: input.status,
          role_in_program: input.roleInProgram || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return { ...input, id };
  }

  async listProgramLinks(personId: PersonId): Promise<PersonProgramLink[]> {
    const res = await peopleRest<Record<string, unknown>[]>(
      `program_links?person_key=eq.${encodeURIComponent(personId)}`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.link_key),
      organizationId: String(r.organization_id),
      personId,
      kind: r.kind as PersonProgramLink['kind'],
      externalRef: r.external_ref ? String(r.external_ref) : undefined,
      label: r.label ? String(r.label) : undefined,
      status: r.status as PersonProgramLink['status'],
      roleInProgram: r.role_in_program ? String(r.role_in_program) : undefined,
    }));
  }

  async upsertConsent(input: Omit<PersonConsent, 'id'> & { id?: string }): Promise<PersonConsent> {
    const id = input.id || newId('cns');
    await this.must(
      await peopleRest('consents', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          consent_key: id,
          organization_id: input.organizationId,
          person_key: input.personId,
          purpose: input.purpose,
          status: input.status,
          captured_at: input.capturedAt || null,
          expires_at: input.expiresAt || null,
          source: input.source || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return { ...input, id };
  }

  async listConsents(personId: PersonId): Promise<PersonConsent[]> {
    const res = await peopleRest<Record<string, unknown>[]>(
      `consents?person_key=eq.${encodeURIComponent(personId)}`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.consent_key),
      organizationId: String(r.organization_id),
      personId,
      purpose: String(r.purpose),
      status: r.status as PersonConsent['status'],
      capturedAt: r.captured_at ? String(r.captured_at) : undefined,
      expiresAt: r.expires_at ? String(r.expires_at) : undefined,
      source: (r.source
        ? String(r.source)
        : 'staff') as PersonConsent['source'],
    }));
  }

  async upsertAclGrant(
    input: Omit<PersonAclGrant, 'id'> & { id?: string },
  ): Promise<PersonAclGrant> {
    const id = input.id || newId('acl');
    await this.must(
      await peopleRest('acl_grants', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          grant_key: id,
          organization_id: input.organizationId,
          resource_type: input.resourceType,
          resource_id: input.resourceId,
          grantee_kind: input.grantee.kind,
          grantee_value:
            input.grantee.kind === 'user_email'
              ? input.grantee.email
              : input.grantee.kind === 'person'
                ? input.grantee.personId
                : input.grantee.role,
          relation: input.relation,
          fields_allow: input.fieldsAllow || null,
          fields_deny: input.fieldsDeny || null,
          expires_at: input.expiresAt || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return { ...input, id };
  }

  async listAclGrantsForResource(
    organizationId: string,
    resourceType: string,
    resourceId: string,
  ) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `acl_grants?organization_id=eq.${encodeURIComponent(organizationId)}&resource_type=eq.${encodeURIComponent(resourceType)}&resource_id=eq.${encodeURIComponent(resourceId)}`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.grant_key),
      organizationId,
      resourceType: r.resource_type as PersonAclGrant['resourceType'],
      resourceId: String(r.resource_id),
      grantee: { kind: 'user_email' as const, email: String(r.grantee_value) },
      relation: r.relation as PersonAclGrant['relation'],
      fieldsAllow: r.fields_allow as string[] | undefined,
      fieldsDeny: r.fields_deny as string[] | undefined,
      expiresAt: r.expires_at ? String(r.expires_at) : undefined,
    }));
  }

  async appendAudit(input: PeopleAuditInput): Promise<PeopleAuditEvent> {
    const id = newId('aud');
    const at = new Date().toISOString();
    await this.must(
      await peopleRest('audit_events', {
        method: 'POST',
        body: JSON.stringify({
          audit_key: id,
          organization_id: input.organizationId,
          actor_email: input.actorEmail,
          actor_person_key: input.actorPersonId || null,
          action: input.action,
          subject_person_key: input.subjectPersonId || null,
          at,
          meta: input.meta || null,
        }),
        organizationId: input.organizationId,
      }),
    );
    return {
      id,
      organizationId: input.organizationId,
      actorEmail: input.actorEmail,
      actorPersonId: input.actorPersonId,
      action: input.action,
      subjectPersonId: input.subjectPersonId,
      at,
      meta: input.meta,
    };
  }

  async listAudit(organizationId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `audit_events?organization_id=eq.${encodeURIComponent(organizationId)}&order=at.asc`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.audit_key),
      organizationId,
      actorEmail: String(r.actor_email),
      actorPersonId: r.actor_person_key
        ? (String(r.actor_person_key) as PersonId)
        : undefined,
      action: r.action as PeopleAuditEvent['action'],
      subjectPersonId: r.subject_person_key
        ? (String(r.subject_person_key) as PersonId)
        : undefined,
      at: String(r.at),
      meta: r.meta as PeopleAuditEvent['meta'],
    }));
  }

  async createMergeJob(input: MergeJobCreateInput): Promise<PeopleMergeJob> {
    const id = newId('mrgjob');
    const jobKey = `${input.organizationId}#${input.absorbedPersonId}`;
    const now = new Date().toISOString();
    const existing = await this.findMergeJobByAbsorbed(
      input.organizationId,
      input.absorbedPersonId,
    );
    if (existing) return existing;
    await this.must(
      await peopleRest('merge_jobs', {
        method: 'POST',
        body: JSON.stringify({
          job_id: id,
          job_key: jobKey,
          organization_id: input.organizationId,
          survivor_person_key: input.survivorPersonId,
          absorbed_person_key: input.absorbedPersonId,
          status: 'queued',
          completed_steps: [],
          attempts: 0,
          actor_email: input.actorEmail,
          meta: input.meta || null,
          created_at: now,
          updated_at: now,
        }),
        organizationId: input.organizationId,
      }),
    );
    return {
      id,
      organizationId: input.organizationId,
      jobKey,
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
  }

  async getMergeJob(jobId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `merge_jobs?job_id=eq.${encodeURIComponent(jobId)}&limit=1`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return this.mapMergeJob(r);
  }

  async findMergeJobByAbsorbed(organizationId: string, absorbedPersonId: PersonId) {
    const jobKey = `${organizationId}#${absorbedPersonId}`;
    const res = await peopleRest<Record<string, unknown>[]>(
      `merge_jobs?job_key=eq.${encodeURIComponent(jobKey)}&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    return r ? this.mapMergeJob(r) : null;
  }

  async updateMergeJob(jobId: string, patch: MergeJobPatch) {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status) body.status = patch.status;
    if (patch.attempts !== undefined) body.attempts = patch.attempts;
    if (patch.lastError !== undefined) body.last_error = patch.lastError;
    if (patch.completedStep) {
      const current = await this.getMergeJob(jobId);
      const steps = new Set(current?.completedSteps || []);
      steps.add(patch.completedStep);
      body.completed_steps = [...steps];
    }
    // Finalize via RPC when status becomes finalizing→completed from domain
    if (patch.status === 'completed') {
      const job = await this.getMergeJob(jobId);
      if (job) {
        await this.must(
          await peopleRpc('merge_finalize', {
            p_organization_id: job.organizationId,
            p_survivor_key: job.survivorPersonId,
            p_absorbed_key: job.absorbedPersonId,
            p_job_id: jobId,
          }),
        );
        return (await this.getMergeJob(jobId))!;
      }
    }
    const res = await peopleRest<Record<string, unknown>[]>(
      `merge_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
      {
        method: 'PATCH',
        prefer: 'return=representation',
        body: JSON.stringify(body),
      },
    );
    const rows = await this.must(res);
    return this.mapMergeJob(rows[0]);
  }

  private mapMergeJob(r: Record<string, unknown>): PeopleMergeJob {
    return {
      id: String(r.job_id),
      organizationId: String(r.organization_id),
      jobKey: String(r.job_key),
      survivorPersonId: String(r.survivor_person_key) as PersonId,
      absorbedPersonId: String(r.absorbed_person_key) as PersonId,
      status: r.status as PeopleMergeJob['status'],
      completedSteps: (r.completed_steps as PeopleMergeJob['completedSteps']) || [],
      attempts: Number(r.attempts || 0),
      actorEmail: String(r.actor_email),
      lastError: r.last_error ? String(r.last_error) : undefined,
      meta: r.meta as PeopleMergeJob['meta'],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }

  async createImportJob(input: ImportJobCreateInput): Promise<PeopleImportJob> {
    const existing = await this.findImportJobByIdempotencyKey(
      input.organizationId,
      input.idempotencyKey,
    );
    if (existing) return existing;
    const id = newId('impjob');
    const now = new Date().toISOString();
    await this.must(
      await peopleRest('import_jobs', {
        method: 'POST',
        body: JSON.stringify({
          job_id: id,
          organization_id: input.organizationId,
          idempotency_key: input.idempotencyKey,
          source: input.source,
          status: 'queued',
          row_count: input.rowCount,
          ok_count: 0,
          failed_count: 0,
          actor_email: input.actorEmail,
          dry_run: input.dryRun || false,
          meta: input.meta || null,
          created_at: now,
          updated_at: now,
        }),
        organizationId: input.organizationId,
      }),
    );
    return {
      id,
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
  }

  async getImportJob(jobId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `import_jobs?job_id=eq.${encodeURIComponent(jobId)}&limit=1`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return this.mapImportJob(r);
  }

  async findImportJobByIdempotencyKey(organizationId: string, idempotencyKey: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `import_jobs?organization_id=eq.${encodeURIComponent(organizationId)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    return r ? this.mapImportJob(r) : null;
  }

  async updateImportJob(jobId: string, patch: ImportJobPatch) {
    const body: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (patch.status) body.status = patch.status;
    if (patch.okCount !== undefined) body.ok_count = patch.okCount;
    if (patch.failedCount !== undefined) body.failed_count = patch.failedCount;
    if (patch.rowCount !== undefined) body.row_count = patch.rowCount;
    if (patch.lastError !== undefined) body.last_error = patch.lastError;
    const res = await peopleRest<Record<string, unknown>[]>(
      `import_jobs?job_id=eq.${encodeURIComponent(jobId)}`,
      { method: 'PATCH', prefer: 'return=representation', body: JSON.stringify(body) },
    );
    const rows = await this.must(res);
    return this.mapImportJob(rows[0]);
  }

  private mapImportJob(r: Record<string, unknown>): PeopleImportJob {
    return {
      id: String(r.job_id),
      organizationId: String(r.organization_id),
      idempotencyKey: String(r.idempotency_key),
      source: r.source as PeopleImportJob['source'],
      status: r.status as PeopleImportJob['status'],
      rowCount: Number(r.row_count || 0),
      okCount: Number(r.ok_count || 0),
      failedCount: Number(r.failed_count || 0),
      actorEmail: String(r.actor_email),
      dryRun: Boolean(r.dry_run),
      lastError: r.last_error ? String(r.last_error) : undefined,
      meta: r.meta as PeopleImportJob['meta'],
      createdAt: String(r.created_at),
      updatedAt: String(r.updated_at),
    };
  }

  async recordImportRowResult(input: ImportRowResultInput): Promise<PeopleImportRowResult> {
    const rowKey = `${input.importJobId}#${input.rowNumber}`;
    const now = new Date().toISOString();
    await this.must(
      await peopleRest('import_row_results', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=minimal',
        body: JSON.stringify({
          row_key: rowKey,
          organization_id: input.organizationId,
          import_job_id: input.importJobId,
          row_number: input.rowNumber,
          status: input.status,
          person_key: input.personId || null,
          error: input.error || null,
          created_at: now,
        }),
        organizationId: input.organizationId,
      }),
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
      createdAt: now,
    };
  }

  async listImportRowResults(importJobId: string) {
    const res = await peopleRest<Record<string, unknown>[]>(
      `import_row_results?import_job_id=eq.${encodeURIComponent(importJobId)}&order=row_number.asc`,
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    return (res.data || []).map((r) => ({
      id: String(r.row_key),
      organizationId: String(r.organization_id),
      importJobId,
      rowNumber: Number(r.row_number),
      rowKey: String(r.row_key),
      status: r.status as PeopleImportRowResult['status'],
      personId: r.person_key ? (String(r.person_key) as PersonId) : undefined,
      error: r.error ? String(r.error) : undefined,
      createdAt: String(r.created_at),
    }));
  }

  async saveMigrationCheckpoint(
    input: MigrationCheckpointInput,
  ): Promise<PeopleMigrationCheckpoint> {
    const checkpointKey = `${input.organizationId}#${input.jobId}`;
    const now = new Date().toISOString();
    await this.must(
      await peopleRest('migration_checkpoints', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates,return=representation',
        body: JSON.stringify({
          checkpoint_key: checkpointKey,
          organization_id: input.organizationId,
          job_id: input.jobId,
          last_client_record_id: input.lastClientRecordId || null,
          processed: input.processed,
          created: input.created,
          linked: input.linked,
          status: input.status,
          updated_at: now,
        }),
        organizationId: input.organizationId,
      }),
    );
    return {
      id: checkpointKey,
      organizationId: input.organizationId,
      jobId: input.jobId,
      checkpointKey,
      lastClientRecordId: input.lastClientRecordId,
      processed: input.processed,
      created: input.created,
      linked: input.linked,
      status: input.status,
      updatedAt: now,
    };
  }

  async getMigrationCheckpoint(organizationId: string, jobId: string) {
    const checkpointKey = `${organizationId}#${jobId}`;
    const res = await peopleRest<Record<string, unknown>[]>(
      `migration_checkpoints?checkpoint_key=eq.${encodeURIComponent(checkpointKey)}&limit=1`,
      { organizationId },
    );
    if (!res.ok) throw peopleUnavailable(res.error);
    const r = res.data?.[0];
    if (!r) return null;
    return {
      id: String(r.checkpoint_key),
      organizationId,
      jobId,
      checkpointKey: String(r.checkpoint_key),
      lastClientRecordId: r.last_client_record_id
        ? String(r.last_client_record_id)
        : undefined,
      processed: Number(r.processed || 0),
      created: Number(r.created || 0),
      linked: Number(r.linked || 0),
      status: r.status as PeopleMigrationCheckpoint['status'],
      updatedAt: String(r.updated_at),
    };
  }
}

let singleton: PostgresPeopleRepository | null = null;

export function postgresPeopleRepository(): PeopleRepository {
  assertPeoplePostgresReady();
  if (!singleton) singleton = new PostgresPeopleRepository();
  return singleton;
}
