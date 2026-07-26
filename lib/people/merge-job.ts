/**
 * Durable merge job runner (INV-21 / blueprint §10.1).
 *
 * Stages: queued → locking → copying → rewriting → finalizing → completed | failed | retryable
 *
 * The absorbed Person is archived and given `mergedIntoPersonId` **only** in the
 * `finalizing` stage, after every copy/rewrite step has succeeded. Steps are keyed by
 * `(mergeJobId, stepName)` so an out-of-order retry re-runs them safely without
 * duplicating edges (ADV-P-4).
 */
import { roleAtLeast, type PlatformRole } from '@/lib/rbac';
import { peopleConflict, peopleValidation } from '@/lib/people/errors';
import {
  PEOPLE_MERGE_STAGES,
  type PeopleMergeJob,
  type PeopleMergeStepName,
} from '@/lib/people/job-types';
import { incPeopleMetric } from '@/lib/people/metrics';
import { logPeopleFailure } from '@/lib/people/redact-log';
import type { PeopleRepository } from '@/lib/people/repository';
import type { Person, PersonId } from '@/lib/people/types';

export type RunMergeJobInput = {
  repository: PeopleRepository;
  /** INV-1 — always the org resolved from the session slug, never a request body. */
  sessionOrganizationId: string;
  survivorPersonId: PersonId;
  absorbedPersonId: PersonId;
  actorEmail: string;
  actorRole: PlatformRole;
  /** Test hook: throw at a stage boundary to simulate a killed worker (ADV-P-4). */
  failAfterStep?: PeopleMergeStepName;
};

export type RunMergeJobResult =
  | { ok: true; survivorId: PersonId; jobId: string; alreadyMerged: boolean }
  | { ok: false; error: string; jobId?: string; status?: PeopleMergeJob['status'] };

class MergeStepAbort extends Error {}

export async function runPeopleMergeJob(input: RunMergeJobInput): Promise<RunMergeJobResult> {
  const repo = input.repository;

  if (!roleAtLeast(input.actorRole, 'manager')) {
    return { ok: false, error: 'manager role required' };
  }
  if (!input.survivorPersonId || !input.absorbedPersonId) {
    return { ok: false, error: 'person not found' };
  }
  if (input.survivorPersonId === input.absorbedPersonId) {
    return { ok: false, error: 'cannot merge a person into itself' };
  }

  const [survivor, absorbed] = await Promise.all([
    repo.getPerson(input.survivorPersonId),
    repo.getPerson(input.absorbedPersonId),
  ]);
  if (!survivor || !absorbed) return { ok: false, error: 'person not found' };

  // INV-1 + ADV-11 + ADV-P-8 — cross-organization merges fail closed.
  if (
    survivor.organizationId !== absorbed.organizationId ||
    survivor.organizationId !== input.sessionOrganizationId
  ) {
    return { ok: false, error: 'cross-organization merge forbidden' };
  }

  // INV-22 — a second job for the same absorbed person returns the survivor.
  if (absorbed.mergedIntoPersonId) {
    if (absorbed.mergedIntoPersonId === survivor.id) {
      const existingJob = await repo.findMergeJobByAbsorbed(
        survivor.organizationId,
        absorbed.id,
      );
      return {
        ok: true,
        survivorId: survivor.id,
        jobId: existingJob?.id || '',
        alreadyMerged: true,
      };
    }
    return { ok: false, error: 'person already merged into a different survivor' };
  }

  if (absorbed.lifecycleStatus === 'deceased' && !roleAtLeast(input.actorRole, 'owner')) {
    return { ok: false, error: 'cannot merge deceased without owner' };
  }

  const job = await repo.createMergeJob({
    organizationId: survivor.organizationId,
    survivorPersonId: survivor.id,
    absorbedPersonId: absorbed.id,
    actorEmail: input.actorEmail,
  });

  if (job.status === 'completed') {
    return { ok: true, survivorId: job.survivorPersonId, jobId: job.id, alreadyMerged: true };
  }

  incPeopleMetric('people_merge_started');
  let current = await repo.updateMergeJob(job.id, {
    status: 'locking',
    attempts: job.attempts + 1,
  });

  const done = new Set<PeopleMergeStepName>(current.completedSteps);

  const step = async (
    name: PeopleMergeStepName,
    status: PeopleMergeJob['status'],
    fn: () => Promise<void>,
  ): Promise<void> => {
    if (current.status !== status) {
      current = await repo.updateMergeJob(job.id, { status });
    }
    if (!done.has(name)) {
      await fn();
      current = await repo.updateMergeJob(job.id, { completedStep: name });
      done.add(name);
    }
    if (input.failAfterStep === name) {
      throw new MergeStepAbort(`simulated worker loss after ${name}`);
    }
  };

  try {
    await step('validate', 'locking', async () => {
      if (current.organizationId !== input.sessionOrganizationId) {
        throw peopleValidation('merge job organization mismatch');
      }
    });

    // Locking — bind the absorbed row to this job so a concurrent job is visible.
    await step('lock', 'locking', async () => {
      const fresh = await repo.getPerson(absorbed.id);
      if (!fresh) throw peopleValidation('absorbed person disappeared');
      if (fresh.mergedIntoPersonId && fresh.mergedIntoPersonId !== survivor.id) {
        throw peopleConflict('absorbed person merged elsewhere');
      }
    });

    // Copying — union directory roles onto the survivor, end the absorbed membership.
    await step('copy_directory', 'copying', async () => {
      const [absorbedMemberships, survivorMemberships] = await Promise.all([
        repo.listDirectoryMembershipsForPerson(absorbed.id),
        repo.listDirectoryMembershipsForPerson(survivor.id),
      ]);
      const survivorMembership = survivorMemberships[0];
      const roles = new Set(survivorMembership?.roles || []);
      let clientRecordId = survivorMembership?.clientRecordId;
      for (const membership of absorbedMemberships) {
        for (const role of membership.roles) roles.add(role);
        clientRecordId = clientRecordId || membership.clientRecordId;
      }
      if (roles.size > 0 || survivorMembership) {
        await repo.upsertDirectoryMembership({
          organizationId: survivor.organizationId,
          personId: survivor.id,
          roles: [...roles],
          status: 'active',
          clientRecordId,
          title: survivorMembership?.title,
          portalMembershipId: survivorMembership?.portalMembershipId,
          startedAt: survivorMembership?.startedAt,
        });
      }
      for (const membership of absorbedMemberships) {
        await repo.upsertDirectoryMembership({
          ...membership,
          status: 'ended',
          endedAt: new Date().toISOString(),
        });
      }
    });

    // Rewriting — edges, household members, program links, consents, ACL grants.
    await step('rewrite_graph', 'rewriting', async () => {
      const edges = await repo.listRelationshipsForOrg(survivor.organizationId);
      for (const edge of edges) {
        if (edge.fromPersonId !== absorbed.id && edge.toPersonId !== absorbed.id) continue;
        const from = edge.fromPersonId === absorbed.id ? survivor.id : edge.fromPersonId;
        const to = edge.toPersonId === absorbed.id ? survivor.id : edge.toPersonId;
        if (from === to) continue;
        await repo.upsertRelationship({
          organizationId: edge.organizationId,
          fromPersonId: from,
          toPersonId: to,
          type: edge.type,
          status: edge.status,
          expiresAt: edge.expiresAt,
          notes: edge.notes,
        });
        await repo.upsertRelationship({
          ...edge,
          status: 'ended',
        });
      }

      for (const member of await repo.listHouseholdMembersForPerson(absorbed.id)) {
        await repo.upsertHouseholdMember({
          organizationId: member.organizationId,
          householdId: member.householdId,
          personId: survivor.id,
          role: member.role,
          isAuthorizedRepresentative: member.isAuthorizedRepresentative,
          authzExpiresAt: member.authzExpiresAt,
        });
      }

      for (const link of await repo.listProgramLinks(absorbed.id)) {
        await repo.upsertProgramLink({
          organizationId: link.organizationId,
          personId: survivor.id,
          kind: link.kind,
          externalRef: link.externalRef,
          status: link.status,
          label: link.label,
          roleInProgram: link.roleInProgram,
        });
      }

      for (const consent of await repo.listConsents(absorbed.id)) {
        await repo.upsertConsent({
          organizationId: consent.organizationId,
          personId: survivor.id,
          purpose: consent.purpose,
          status: consent.status,
          capturedAt: consent.capturedAt,
          expiresAt: consent.expiresAt,
          source: consent.source,
          actorPersonId: consent.actorPersonId,
        });
      }

      for (const grant of await repo.listAclGrantsForResource(
        survivor.organizationId,
        'person',
        absorbed.id,
      )) {
        await repo.upsertAclGrant({
          organizationId: grant.organizationId,
          resourceType: grant.resourceType,
          resourceId: survivor.id,
          grantee: grant.grantee,
          relation: grant.relation,
          fieldsAllow: grant.fieldsAllow,
          fieldsDeny: grant.fieldsDeny,
          expiresAt: grant.expiresAt,
        });
      }
    });

    // Move non-conflicting external ids; the survivor keeps its own on conflict.
    await step('move_external_ids', 'rewriting', async () => {
      const freshSurvivor = await repo.getPerson(survivor.id);
      const freshAbsorbed = await repo.getPerson(absorbed.id);
      if (!freshSurvivor || !freshAbsorbed) throw peopleValidation('person disappeared mid-merge');
      const survivorIds = freshSurvivor.externalIds || [];
      const absorbedIds = freshAbsorbed.externalIds || [];
      const additions: typeof survivorIds = [];
      const conflicts: typeof survivorIds = [];
      for (const candidate of absorbedIds) {
        const alreadyOwned = survivorIds.some(
          (owned) => owned.system === candidate.system && owned.value === candidate.value,
        );
        if (alreadyOwned) continue;
        const systemTaken = survivorIds.some((owned) => owned.system === candidate.system);
        if (systemTaken) conflicts.push(candidate);
        else additions.push(candidate);
      }

      if (absorbedIds.length > 0) {
        // Release moved ids from the absorbed row first so the unique key is free.
        await repo.updatePerson(freshAbsorbed.id, { externalIds: conflicts });
      }
      if (additions.length > 0) {
        await repo.updatePerson(freshSurvivor.id, {
          externalIds: [...survivorIds, ...additions],
        });
      }
      if (conflicts.length > 0) {
        await repo.appendAudit({
          organizationId: survivor.organizationId,
          actorEmail: input.actorEmail,
          action: 'people.merge',
          subjectPersonId: survivor.id,
          meta: { step: 'move_external_ids', conflicts: conflicts.length },
        });
      }
    });

    // Finalizing — the destructive boundary (INV-21).
    await step('finalize', 'finalizing', async () => {
      const fresh = await repo.getPerson(absorbed.id);
      if (!fresh) throw peopleValidation('absorbed person disappeared');
      await repo.updatePerson(absorbed.id, {
        mergedIntoPersonId: survivor.id,
        lifecycleStatus: 'archived',
      });
      await repo.appendAudit({
        organizationId: survivor.organizationId,
        actorEmail: input.actorEmail,
        action: 'people.merge',
        subjectPersonId: survivor.id,
        meta: { absorbedPersonId: absorbed.id, jobId: job.id },
      });
    });

    await repo.updateMergeJob(job.id, { status: 'completed' });
    incPeopleMetric('people_merge_completed');
    return { ok: true, survivorId: survivor.id, jobId: job.id, alreadyMerged: false };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'merge failed';
    const retryable = !(error instanceof MergeStepAbort) ? isRetryable(error) : true;
    const status = retryable ? 'retryable' : 'failed';
    await repo.updateMergeJob(job.id, { status, lastError: message.slice(0, 240) });
    incPeopleMetric(retryable ? 'people_merge_retryable' : 'people_merge_failed');
    logPeopleFailure('merge_job', error, {
      organizationId: survivor.organizationId,
      jobId: job.id,
      status,
    });
    return { ok: false, error: message, jobId: job.id, status };
  }
}

function isRetryable(error: unknown): boolean {
  if (error && typeof error === 'object' && 'retryable' in error) {
    return Boolean((error as { retryable?: boolean }).retryable);
  }
  return false;
}

/** Resume a `retryable` job from its last completed step (§20.1). */
export async function resumePeopleMergeJob(input: {
  repository: PeopleRepository;
  jobId: string;
  actorEmail: string;
  actorRole: PlatformRole;
}): Promise<RunMergeJobResult> {
  const job = await input.repository.getMergeJob(input.jobId);
  if (!job) return { ok: false, error: 'merge job not found' };
  if (job.status === 'completed') {
    return { ok: true, survivorId: job.survivorPersonId, jobId: job.id, alreadyMerged: true };
  }
  return runPeopleMergeJob({
    repository: input.repository,
    sessionOrganizationId: job.organizationId,
    survivorPersonId: job.survivorPersonId,
    absorbedPersonId: job.absorbedPersonId,
    actorEmail: input.actorEmail,
    actorRole: input.actorRole,
  });
}

export function mergeStageIndex(status: PeopleMergeJob['status']): number {
  return PEOPLE_MERGE_STAGES.indexOf(status);
}

export function personIsTombstone(person: Person | null | undefined): boolean {
  return Boolean(person?.mergedIntoPersonId);
}
