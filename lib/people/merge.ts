import { roleAtLeast, type PlatformRole } from '@/lib/rbac';
import { getPeopleRepository } from '@/lib/people/adapter';
import { runPeopleMergeJob, type RunMergeJobResult } from '@/lib/people/merge-job';
import type { PeopleMergeStepName } from '@/lib/people/job-types';
import {
  appendPeopleAudit,
  createMergeJobRecord,
  getPersonById,
  listConsents,
  listDirectoryMembershipsForPerson,
  listHouseholdMembersForPerson,
  listProgramLinks,
  listRelationshipsForOrg,
  updateMergeJobRecord,
  updatePerson,
  upsertConsent,
  upsertDirectoryMembership,
  upsertHouseholdMember,
  upsertProgramLink,
  upsertRelationship,
} from '@/lib/people/store';
import type { PersonId } from '@/lib/people/types';

export type MergePersonsInput = {
  sessionOrganizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
  actorRole: PlatformRole;
};

/**
 * Durable merge — runs the INV-21 job state machine against the active repository.
 * Preferred entry point for API routes and ops scripts.
 */
export async function mergePersonsAsync(
  input: MergePersonsInput & { failAfterStep?: PeopleMergeStepName },
): Promise<RunMergeJobResult> {
  return runPeopleMergeJob({
    repository: getPeopleRepository(),
    sessionOrganizationId: input.sessionOrganizationId,
    survivorPersonId: input.survivorPersonId,
    absorbedPersonId: input.absorbedPersonId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
    failAfterStep: input.failAfterStep,
  });
}

/**
 * Synchronous memory-path merge (Phase 2A contract, ADV-11 and friends).
 *
 * Runs the same ordered stages in-process and records a job row so the memory and
 * durable paths agree on semantics: the absorbed Person is archived and tombstoned
 * only after every copy/rewrite step succeeds (INV-21).
 */
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
  if (absorbed.mergedIntoPersonId) {
    return { ok: false, error: 'person already merged into a different survivor' };
  }

  if (absorbed.lifecycleStatus === 'deceased' && !roleAtLeast(input.actorRole, 'owner')) {
    return { ok: false, error: 'cannot merge deceased without owner' };
  }

  const job = createMergeJobRecord({
    organizationId: survivor.organizationId,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: input.actorEmail,
  });
  if (job.status === 'completed') {
    return { ok: true, survivorId: survivor.id };
  }

  const step = (name: PeopleMergeStepName, status: Parameters<typeof updateMergeJobRecord>[1]['status'], fn: () => void) => {
    updateMergeJobRecord(job.id, { status });
    fn();
    updateMergeJobRecord(job.id, { completedStep: name });
  };

  try {
    step('lock', 'locking', () => {
      const fresh = getPersonById(absorbed.id);
      if (!fresh) throw new Error('absorbed person disappeared');
    });

    // Copying — union directory roles onto the survivor; end the absorbed membership.
    step('copy_directory', 'copying', () => {
      const survivorMembership = listDirectoryMembershipsForPerson(survivor.id)[0];
      const roles = new Set(survivorMembership?.roles || []);
      let clientRecordId = survivorMembership?.clientRecordId;
      const absorbedMemberships = listDirectoryMembershipsForPerson(absorbed.id);
      for (const m of absorbedMemberships) {
        for (const role of m.roles) roles.add(role);
        clientRecordId = clientRecordId || m.clientRecordId;
      }
      if (roles.size > 0 || survivorMembership) {
        upsertDirectoryMembership({
          organizationId: survivor.organizationId,
          personId: survivor.id,
          roles: [...roles],
          status: 'active',
          clientRecordId,
        });
      }
      for (const m of absorbedMemberships) {
        upsertDirectoryMembership({ ...m, status: 'ended', endedAt: new Date().toISOString() });
      }
    });

    // Rewriting — edges, household members, program links, consents.
    step('rewrite_graph', 'rewriting', () => {
      for (const r of listRelationshipsForOrg(survivor.organizationId)) {
        if (r.fromPersonId !== absorbed.id && r.toPersonId !== absorbed.id) continue;
        const fromPersonId = r.fromPersonId === absorbed.id ? survivor.id : r.fromPersonId;
        const toPersonId = r.toPersonId === absorbed.id ? survivor.id : r.toPersonId;
        if (fromPersonId === toPersonId) continue;
        upsertRelationship({
          organizationId: r.organizationId,
          fromPersonId,
          toPersonId,
          type: r.type,
          status: r.status,
          expiresAt: r.expiresAt,
        });
        upsertRelationship({ ...r, status: 'ended' });
      }

      for (const member of listHouseholdMembersForPerson(absorbed.id)) {
        upsertHouseholdMember({
          organizationId: member.organizationId,
          householdId: member.householdId,
          personId: survivor.id,
          role: member.role,
          isAuthorizedRepresentative: member.isAuthorizedRepresentative,
          authzExpiresAt: member.authzExpiresAt,
        });
      }

      for (const link of listProgramLinks(absorbed.id)) {
        upsertProgramLink({
          organizationId: link.organizationId,
          personId: survivor.id,
          kind: link.kind,
          externalRef: link.externalRef,
          status: link.status,
          label: link.label,
        });
      }

      for (const c of listConsents(absorbed.id)) {
        upsertConsent({
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
    });

    step('move_external_ids', 'rewriting', () => {
      const survivorIds = getPersonById(survivor.id)?.externalIds || [];
      const absorbedIds = getPersonById(absorbed.id)?.externalIds || [];
      const additions: typeof survivorIds = [];
      const conflicts: typeof survivorIds = [];
      for (const candidate of absorbedIds) {
        if (
          survivorIds.some(
            (owned) => owned.system === candidate.system && owned.value === candidate.value,
          )
        ) {
          continue;
        }
        if (survivorIds.some((owned) => owned.system === candidate.system)) conflicts.push(candidate);
        else additions.push(candidate);
      }
      if (absorbedIds.length > 0) updatePerson(absorbed.id, { externalIds: conflicts });
      if (additions.length > 0) {
        updatePerson(survivor.id, { externalIds: [...survivorIds, ...additions] });
      }
    });

    // Finalizing — destructive boundary, only after every step above succeeded.
    step('finalize', 'finalizing', () => {
      updatePerson(absorbed.id, {
        mergedIntoPersonId: survivor.id,
        lifecycleStatus: 'archived',
      });
      appendPeopleAudit({
        organizationId: survivor.organizationId,
        actorEmail: input.actorEmail,
        action: 'people.merge',
        subjectPersonId: survivor.id,
        meta: { absorbedPersonId: absorbed.id, jobId: job.id },
      });
    });

    updateMergeJobRecord(job.id, { status: 'completed' });
    return { ok: true, survivorId: survivor.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'merge failed';
    updateMergeJobRecord(job.id, { status: 'retryable', lastError: message.slice(0, 240) });
    return { ok: false, error: message };
  }
}
