/**
 * INV-12 — single upsert path for fulfill / org-provision / CTP bind.
 */
import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import {
  appendPeopleAudit,
  createPerson,
  createProgramLink,
  findPersonByExternalId,
  findPersonByPrimaryEmail,
  updatePerson,
  upsertDirectoryMembership,
} from '@/lib/people/store';
import type { Person, UniversalPersonRoleCode } from '@/lib/people/types';
import { normalizeEmail } from '@/lib/people/types';

export type EnsurePersonInput = {
  organizationId: string;
  portalSlug?: string;
  clientRecordId?: string;
  email: string;
  displayName: string;
  roles?: UniversalPersonRoleCode[];
  source?: Person['source'];
  ctpWorkspaceRef?: string;
  actorEmail?: string;
};

/**
 * Idempotent ensure. Flag OFF → no-op null (INV-17).
 * Retries return the same Person (INV-12, ADV-14/15).
 */
export function ensurePersonForClientRecord(input: EnsurePersonInput): Person | null {
  if (!isUniversalPeopleEnabled()) return null;
  if (!input.organizationId?.trim() || input.organizationId.startsWith('org_')) {
    if (process.env.NODE_ENV === 'production') return null;
  }

  const email = normalizeEmail(input.email);
  let person: Person | null = null;

  if (input.clientRecordId) {
    person = findPersonByExternalId(input.organizationId, 'client-record', input.clientRecordId);
  }
  if (!person && email) {
    person = findPersonByPrimaryEmail(input.organizationId, email);
  }

  if (!person) {
    person = createPerson({
      organizationId: input.organizationId,
      portalSlug: input.portalSlug,
      displayName: input.displayName || email || 'Person',
      emails: email ? [{ value: email, kind: 'primary' }] : [],
      phones: [],
      lifecycleStatus: 'active',
      externalIds: input.clientRecordId
        ? [{ system: 'client-record', value: input.clientRecordId }]
        : [],
      source: input.source || 'provisioning',
      createdByUserEmail: input.actorEmail,
    });
    appendPeopleAudit({
      organizationId: input.organizationId,
      actorEmail: input.actorEmail || 'system',
      action: 'people.create',
      subjectPersonId: person.id,
      meta: { source: person.source },
    });
  } else if (input.clientRecordId) {
    const has = person.externalIds?.some(
      (e) => e.system === 'client-record' && e.value === input.clientRecordId,
    );
    if (!has) {
      person = updatePerson(person.id, {
        externalIds: [
          ...(person.externalIds || []),
          { system: 'client-record', value: input.clientRecordId },
        ],
      });
    }
  }

  const roles = input.roles?.length ? input.roles : (['client'] as UniversalPersonRoleCode[]);
  upsertDirectoryMembership({
    organizationId: input.organizationId,
    personId: person.id,
    roles,
    status: 'active',
    clientRecordId: input.clientRecordId,
  });

  if (input.ctpWorkspaceRef) {
    createProgramLink({
      organizationId: input.organizationId,
      personId: person.id,
      kind: 'ctp_workspace',
      externalRef: input.ctpWorkspaceRef,
      status: 'active',
    });
  }

  return person;
}
