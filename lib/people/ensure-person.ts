/**
 * INV-12 — single upsert path for fulfill / org-provision / CTP bind.
 */
import { getPeopleRepository, isPeoplePersistenceActive } from '@/lib/people/adapter';
import { isUniversalPeopleEnabled } from '@/lib/people/flags';
import { orgEmailKey, orgExternalKey } from '@/lib/people/keys';
import { logPeopleFailure } from '@/lib/people/redact-log';
import type { PeopleRepository } from '@/lib/people/repository';
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

function ensureAllowed(input: EnsurePersonInput): boolean {
  if (!isUniversalPeopleEnabled()) return false;
  if (!input.organizationId?.trim()) return false;
  if (input.organizationId.startsWith('org_') && process.env.NODE_ENV === 'production') {
    return false;
  }
  return true;
}

/**
 * Durable idempotent ensure (blueprint §8.2).
 *
 * Lookup order is external id → every normalized email, then a create-or-return
 * upsert so parallel callers converge on one Person (ADV-P-1). Flag OFF → no-op.
 * With Persist ON an Airtable failure throws so callers fail closed (INV-19);
 * `ensurePersonForClientRecordSafe` is the non-fatal wrapper for the fulfill chain.
 */
export async function ensurePersonForClientRecordAsync(
  input: EnsurePersonInput,
  repository?: PeopleRepository,
): Promise<Person | null> {
  if (!ensureAllowed(input)) return null;

  const repo = repository || getPeopleRepository();
  const email = normalizeEmail(input.email);
  let person: Person | null = null;

  if (input.clientRecordId) {
    person = await repo.findPersonByExternalId(
      input.organizationId,
      'client-record',
      input.clientRecordId,
    );
  }
  if (!person && email) {
    person = await repo.findPersonByEmail(input.organizationId, email);
  }

  if (!person) {
    const upserted = await repo.upsertPersonByIdentity(
      {
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
      },
      {
        emailKey: email ? orgEmailKey(input.organizationId, email) : undefined,
        externalKey: input.clientRecordId
          ? orgExternalKey(input.organizationId, 'client-record', input.clientRecordId)
          : undefined,
      },
    );
    person = upserted.person;
    if (upserted.created) {
      await repo.appendAudit({
        organizationId: input.organizationId,
        actorEmail: input.actorEmail || 'system',
        action: 'people.create',
        subjectPersonId: person.id,
        meta: { source: person.source },
      });
    }
  }

  if (input.clientRecordId) {
    const has = person.externalIds?.some(
      (e) => e.system === 'client-record' && e.value === input.clientRecordId,
    );
    if (!has) {
      person = await repo.updatePerson(person.id, {
        externalIds: [
          ...(person.externalIds || []),
          { system: 'client-record', value: input.clientRecordId },
        ],
      });
    }
  }

  const roles = input.roles?.length ? input.roles : (['client'] as UniversalPersonRoleCode[]);
  await repo.upsertDirectoryMembership({
    organizationId: input.organizationId,
    personId: person.id,
    roles,
    status: 'active',
    clientRecordId: input.clientRecordId,
  });

  if (input.ctpWorkspaceRef) {
    await repo.upsertProgramLink({
      organizationId: input.organizationId,
      personId: person.id,
      kind: 'ctp_workspace',
      externalRef: input.ctpWorkspaceRef,
      status: 'active',
    });
  }

  return person;
}

/**
 * Commerce-safe wrapper (§10.3): People ensure must never break fulfill, but a
 * durable failure is logged (redacted) and retried later — never faked in memory.
 */
export async function ensurePersonForClientRecordSafe(
  input: EnsurePersonInput,
): Promise<Person | null> {
  try {
    return await ensurePersonForClientRecordAsync(input);
  } catch (error) {
    logPeopleFailure('ensure_person', error, {
      organizationId: input.organizationId,
      clientRecordId: input.clientRecordId,
      persistActive: isPeoplePersistenceActive(),
    });
    return null;
  }
}

/**
 * Synchronous memory-path ensure (Phase 2A contract, ADV-14/15).
 * Only valid when the memory repository is active; durable callers must use
 * `ensurePersonForClientRecordAsync`.
 */
export function ensurePersonForClientRecord(input: EnsurePersonInput): Person | null {
  if (!ensureAllowed(input)) return null;

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
