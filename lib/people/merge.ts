import { roleAtLeast, type PlatformRole } from '@/lib/rbac';
import {
  appendPeopleAudit,
  getPersonById,
  listConsents,
  listDirectoryMembershipsForPerson,
  listProgramLinks,
  listRelationshipsForOrg,
  updatePerson,
  upsertDirectoryMembership,
  createConsent,
  createProgramLink,
  createRelationship,
} from '@/lib/people/store';
import type { PersonId } from '@/lib/people/types';

export type MergePersonsInput = {
  sessionOrganizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
  actorRole: PlatformRole;
};

export function mergePersons(
  input: MergePersonsInput,
): { ok: true; survivorId: PersonId } | { ok: false; error: string } {
  if (!roleAtLeast(input.actorRole, 'manager')) {
    return { ok: false, error: 'manager role required' };
  }
  const survivor = getPersonById(input.survivorPersonId);
  const absorbed = getPersonById(input.absorbedPersonId);
  if (!survivor || !absorbed) return { ok: false, error: 'person not found' };

  // INV-1 + ADV-11
  if (
    survivor.organizationId !== absorbed.organizationId ||
    survivor.organizationId !== input.sessionOrganizationId
  ) {
    return { ok: false, error: 'cross-organization merge forbidden' };
  }

  if (absorbed.mergedIntoPersonId === survivor.id) {
    return { ok: true, survivorId: survivor.id };
  }

  if (absorbed.lifecycleStatus === 'deceased' && !roleAtLeast(input.actorRole, 'owner')) {
    return { ok: false, error: 'cannot merge deceased without owner' };
  }

  // Move directory memberships (absorb roles onto survivor)
  for (const m of listDirectoryMembershipsForPerson(absorbed.id)) {
    const existing = listDirectoryMembershipsForPerson(survivor.id)[0];
    const roles = Array.from(new Set([...(existing?.roles || []), ...m.roles]));
    upsertDirectoryMembership({
      organizationId: survivor.organizationId,
      personId: survivor.id,
      roles,
      status: 'active',
      clientRecordId: existing?.clientRecordId || m.clientRecordId,
    });
    upsertDirectoryMembership({
      ...m,
      status: 'ended',
      endedAt: new Date().toISOString(),
    });
  }

  // Re-link relationships pointing at absorbed → survivor (same org only)
  for (const r of listRelationshipsForOrg(survivor.organizationId)) {
    if (r.fromPersonId === absorbed.id || r.toPersonId === absorbed.id) {
      createRelationship({
        organizationId: r.organizationId,
        fromPersonId: r.fromPersonId === absorbed.id ? survivor.id : r.fromPersonId,
        toPersonId: r.toPersonId === absorbed.id ? survivor.id : r.toPersonId,
        type: r.type,
        status: r.status,
        expiresAt: r.expiresAt,
      });
    }
  }

  for (const link of listProgramLinks(absorbed.id)) {
    createProgramLink({
      organizationId: link.organizationId,
      personId: survivor.id,
      kind: link.kind,
      externalRef: link.externalRef,
      status: link.status,
      label: link.label,
    });
  }

  for (const c of listConsents(absorbed.id)) {
    createConsent({
      organizationId: c.organizationId,
      personId: survivor.id,
      purpose: c.purpose,
      status: c.status,
      capturedAt: c.capturedAt,
      expiresAt: c.expiresAt,
      source: c.source,
      actorPersonId: c.actorPersonId,
    });
  }

  updatePerson(absorbed.id, {
    mergedIntoPersonId: survivor.id,
    lifecycleStatus: 'archived',
  });

  appendPeopleAudit({
    organizationId: survivor.organizationId,
    actorEmail: input.actorEmail,
    action: 'people.merge',
    subjectPersonId: survivor.id,
    meta: { absorbedPersonId: absorbed.id },
  });

  return { ok: true, survivorId: survivor.id };
}
